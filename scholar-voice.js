/* Push-to-talk: 16 kHz PCM in, 24 kHz PCM out. Credentials stay server-side. */
(function(root){
  class ScholarVoice {
    constructor({url,onStatus,onTranscript,onComplete}){
      this.url=url;this.onStatus=onStatus||(()=>{});this.onTranscript=onTranscript||(()=>{});this.onComplete=onComplete||(()=>{});
      this.socket=null;this.stream=null;this.context=null;this.capture=null;this.nextTime=0;this.ready=false;
      this.recording=false;this.awaitingReply=false;this.turn=null;this.turnsByItem=new Map();
    }
    static pcm(samples,sourceRate){
      const count=Math.max(1,Math.floor(samples.length*16000/sourceRate)),bytes=new Uint8Array(count*2),view=new DataView(bytes.buffer);
      for(let i=0;i<count;i++){const pos=i*sourceRate/16000,left=Math.floor(pos),fraction=pos-left;
        const value=Math.max(-1,Math.min(1,(samples[left]||0)*(1-fraction)+(samples[Math.min(left+1,samples.length-1)]||0)*fraction));
        view.setInt16(i*2,Math.round(value<0?value*32768:value*32767),true);}
      let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary);
    }
    async talk(){
      if(this.recording||this.stream)return;
      if(this.awaitingReply){this.onStatus('Wait for Qwen to finish before the next turn.');return;}
      this.stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true},video:false});
      this.context=this.context||new (root.AudioContext||root.webkitAudioContext)();await this.context.resume();
      if(!this.socket||this.socket.readyState!==WebSocket.OPEN){
        this.ready=false;this.socket=new WebSocket(this.url);this.socket.onmessage=e=>this.receive(e);
        this.socket.onerror=()=>{this.releaseMic();this.onStatus('Voice connection failed.');};
        this.socket.onclose=()=>{this.releaseMic();this.ready=false;this.onStatus('Voice session ended.');};
        this.onStatus('Connecting to Qwen…');
      }else if(this.ready)this.beginCapture();
    }
    beginCapture(){
      if(!this.stream||this.recording||!this.ready)return;
      this.turn={id:crypto.randomUUID(),user:'',agent:'',completed:false};
      const input=this.context.createMediaStreamSource(this.stream),processor=this.context.createScriptProcessor(1024,1,1),mute=this.context.createGain();
      mute.gain.value=0;processor.onaudioprocess=e=>{if(this.recording&&this.socket?.readyState===WebSocket.OPEN)
        this.socket.send(JSON.stringify({type:'input_audio_buffer.append',audio:ScholarVoice.pcm(e.inputBuffer.getChannelData(0),this.context.sampleRate)}));};
      input.connect(processor);processor.connect(mute);mute.connect(this.context.destination);
      this.capture={input,processor,mute};this.recording=true;this.onStatus('Listening — press Send when finished.');
    }
    send(){if(!this.recording||this.socket?.readyState!==WebSocket.OPEN)return;this.releaseMic();this.awaitingReply=true;
      this.socket.send(JSON.stringify({type:'input_audio_buffer.commit'}));this.socket.send(JSON.stringify({type:'response.create'}));this.onStatus('Qwen is responding…');}
    receive(event){
      let data;try{data=JSON.parse(event.data);}catch{return;}
      if(data.type==='session.updated'){this.ready=true;this.beginCapture();}
      if(data.type==='input_audio_buffer.committed'&&data.item_id&&this.turn)this.turnsByItem.set(data.item_id,this.turn);
      if(data.type==='conversation.item.input_audio_transcription.completed'){
        const turn=this.turnsByItem.get(data.item_id)||(data.item_id?null:this.turn);
        if(turn){turn.user=data.transcript||'';if(turn===this.turn)this.onTranscript('You',turn.user);
          if(turn.completed)this.onComplete({id:turn.id,user:turn.user,agent:turn.agent});}}
      if(data.type==='response.audio_transcript.delta'&&this.turn){this.turn.agent+=data.delta||'';this.onTranscript('Qwen',this.turn.agent);}
      if(data.type==='response.audio.delta'&&data.delta)this.play(data.delta);
      if(data.type==='response.done'&&this.turn){this.turn.completed=true;this.awaitingReply=false;this.onStatus('Ready — press Talk for a follow-up.');
        this.onComplete({id:this.turn.id,user:this.turn.user,agent:this.turn.agent});}
      if(data.type==='error'){this.awaitingReply=false;this.onStatus('Qwen voice reported an error.');}
    }
    play(encoded){const raw=atob(encoded),count=Math.floor(raw.length/2);if(!count||!this.context)return;
      const buffer=this.context.createBuffer(1,count,24000),channel=buffer.getChannelData(0);
      for(let i=0;i<count;i++){let n=raw.charCodeAt(i*2)|(raw.charCodeAt(i*2+1)<<8);if(n>=32768)n-=65536;channel[i]=n/32768;}
      const node=this.context.createBufferSource();node.buffer=buffer;node.connect(this.context.destination);
      this.nextTime=Math.max(this.context.currentTime,this.nextTime);node.start(this.nextTime);this.nextTime+=buffer.duration;}
    releaseMic(){this.recording=false;if(this.capture){for(const item of Object.values(this.capture))try{item.disconnect();}catch{}this.capture=null;}
      if(this.stream){this.stream.getTracks().forEach(track=>track.stop());this.stream=null;}}
    end(){this.releaseMic();if(this.socket){try{this.socket.close();}catch{}this.socket=null;}
      if(this.context){try{this.context.close();}catch{}this.context=null;}this.ready=false;this.awaitingReply=false;}
  }
  root.ScholarVoice=ScholarVoice;
})(globalThis);
