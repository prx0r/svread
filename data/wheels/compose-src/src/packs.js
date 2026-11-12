/* packs.js — LOCAL EXTENSION (ours, not from the R2 zip).
   Content packs for the four master wheels. A pack supplies vetted, fully
   inflected lexemes; the wheel supplies grammar. No new inflector here: every
   form below is a curated surface placed in a slot the template controls.
   Status: MACHINE_PROPOSED_UNREVIEWED.

   Loops: every wheel has a `loop(state)` that returns the next prompt, so a
   session can continue without bound (finite per step, unbounded in sequence):
     conversation  ask -> answer -> ask (dialogue turns)
     expression    clause -> because/but -> clause (chained reasoning)
     action        do X -> then do Y (narrative sequence)
     description   this X is Y -> and its Z is W (elaboration)
*/
(function (root) {
  'use strict';
  const { people, verbs, times } = SWShared;

  const subjects = {
    brother: { id: 'brother', dev: 'भ्राता', roman: 'bhrātā', en: 'brother', person: 'third' },
    mother: { id: 'mother', dev: 'माता', roman: 'mātā', en: 'mother', person: 'third' },
    father: { id: 'father', dev: 'पिता', roman: 'pitā', en: 'father', person: 'third' },
    student: { id: 'student', dev: 'शिष्यः', roman: 'śiṣyaḥ', en: 'student', person: 'third' },
    teacher: { id: 'teacher', dev: 'गुरुः', roman: 'guruḥ', en: 'teacher', person: 'third' },
    boy: { id: 'boy', dev: 'बालः', roman: 'bālaḥ', en: 'boy', person: 'third' },
  };

  const P = (dev, roman, en) => ({ dev, roman, en });
  const T = (dev, roman, en, gender) => ({ dev, roman, en, gender });

  const packs = {
    'about-me': {
      id: 'about-me', name: 'About Me', version: '1.0.0',
      subjects: ['i', 'you', 'sir'],
      objects: {
        read: [P('संस्कृतम्', 'saṃskṛtam', 'Sanskrit'), P('गीतम्', 'gītam', 'a song'), P('चित्रम्', 'citram', 'a picture')],
        write: [P('पत्रम्', 'patram', 'a letter'), P('श्लोकम्', 'ślokam', 'a verse')],
        go: [P('गृहम्', 'gṛham', 'home'), P('विद्यालयम्', 'vidyālayam', 'to school')],
      },
      places: [P('गृहे', 'gṛhe', 'at home'), P('अत्र', 'atra', 'here')],
      opinions: [P('संस्कृतम्', 'saṃskṛtam', 'Sanskrit'), P('गीतम्', 'gītam', 'music'), P('ध्यानम्', 'dhyānam', 'meditation')],
      qualities: [P('सुन्दरम्', 'sundaram', 'beautiful'), P('रोचकम्', 'rocakam', 'interesting'), P('उपयुक्तम्', 'upayuktam', 'useful')],
      reasons: [P('तत् मधुरम् अस्ति', 'tat madhuram asti', 'it sounds sweet'), P('तत् मनः स्थिरीकरोति', 'tat manaḥ sthirīkaroti', 'it steadies the mind')],
      things: [
        { ...T('गीतम्', 'gītam', 'the song', 'n'), quality: P('मधुरम्', 'madhuram', 'sweet') },
        { ...T('चित्रम्', 'citram', 'the picture', 'n'), quality: P('सुन्दरम्', 'sundaram', 'beautiful') },
        { ...T('पुस्तिका', 'pustikā', 'the notebook', 'f'), quality: P('नवीना', 'navīnā', 'new') },
      ],
      topics: [
        { q: P('त्वं किं पठसि', 'tvaṃ kiṃ paṭhasi', 'What do you study'), answers: [P('अहं संस्कृतम् पठामि', 'ahaṃ saṃskṛtam paṭhāmi', 'I study Sanskrit')], next: [1] },
        { q: P('तव गृहं कुत्र', 'tava gṛhaṃ kutra', 'Where is your home'), answers: [P('मम गृहम् अत्र', 'mama gṛham atra', 'my home is here')], next: [0] },
      ],
    },
    family: {
      id: 'family', name: 'Family', version: '1.0.0',
      subjects: ['brother', 'mother', 'father', 'i'],
      objects: {
        read: [P('पुस्तकम्', 'pustakam', 'a book'), P('पत्रम्', 'patram', 'a letter'), P('कथाम्', 'kathām', 'a story')],
        write: [P('पत्रम्', 'patram', 'a letter'), P('सन्देशम्', 'sandeśam', 'a message')],
        go: [P('गृहम्', 'gṛham', 'home'), P('आपणम्', 'āpaṇam', 'to the shop')],
      },
      places: [P('गृहे', 'gṛhe', 'at home'), P('उद्याने', 'udyāne', 'in the garden')],
      opinions: [P('कुटुम्बः', 'kuṭumbaḥ', 'family'), P('गृहम्', 'gṛham', 'home'), P('माता', 'mātā', 'mother')],
      qualities: [P('महत्त्वपूर्णः', 'mahattvapūrṇaḥ', 'important'), P('सुन्दरः', 'sundaraḥ', 'beautiful')],
      reasons: [P('सः सुखदायकः अस्ति', 'saḥ sukhadāyakaḥ asti', 'it brings happiness'), P('तत्र शान्तिः अस्ति', 'tatra śāntiḥ asti', 'there is peace there')],
      things: [
        { ...T('गृहम्', 'gṛham', 'the home', 'n'), quality: P('सुन्दरम्', 'sundaram', 'beautiful') },
        { ...T('भ्राता', 'bhrātā', 'the brother', 'm'), quality: P('ज्येष्ठः', 'jyeṣṭhaḥ', 'elder') },
        { ...T('भगिनी', 'bhaginī', 'the sister', 'f'), quality: P('कनिष्ठा', 'kaniṣṭhā', 'younger') },
      ],
      topics: [
        { q: P('तव भ्राता कुत्र वसति', 'tava bhrātā kutra vasati', 'Where does your brother live'), answers: [P('मम भ्राता गृहे वसति', 'mama bhrātā gṛhe vasati', 'my brother lives at home')], next: [1] },
        { q: P('तव माता किं करोति', 'tava mātā kiṃ karoti', 'What does your mother do'), answers: [P('मम माता पठति', 'mama mātā paṭhati', 'my mother reads')], next: [0] },
      ],
    },
    classroom: {
      id: 'classroom', name: 'Classroom', version: '1.0.0',
      subjects: ['student', 'teacher', 'i'],
      objects: {
        read: [P('पुस्तकम्', 'pustakam', 'a book'), P('पाठम्', 'pāṭham', 'the lesson'), P('श्लोकम्', 'ślokam', 'a verse')],
        write: [P('पाठम्', 'pāṭham', 'the lesson'), P('उत्तरम्', 'uttaram', 'an answer')],
        go: [P('विद्यालयम्', 'vidyālayam', 'to school'), P('गृहम्', 'gṛham', 'home')],
      },
      places: [P('विद्यालये', 'vidyālaye', 'at school'), P('कक्षायाम्', 'kakṣāyām', 'in the classroom')],
      opinions: [P('पाठः', 'pāṭhaḥ', 'the lesson'), P('व्याकरणम्', 'vyākaraṇam', 'grammar'), P('संस्कृतम्', 'saṃskṛtam', 'Sanskrit')],
      qualities: [P('कठिनः', 'kaṭhinaḥ', 'difficult'), P('स्पष्टः', 'spaṣṭaḥ', 'clear')],
      reasons: [P('तत् ज्ञानं ददाति', 'tat jñānaṃ dadāti', 'it gives knowledge'), P('तत् सुबोधम् अस्ति', 'tat subodham asti', 'it is easy to understand')],
      things: [
        { ...T('पाठः', 'pāṭhaḥ', 'the lesson', 'm'), quality: P('कठिनः', 'kaṭhinaḥ', 'difficult') },
        { ...T('पुस्तकम्', 'pustakam', 'the book', 'n'), quality: P('नवीनम्', 'navīnam', 'new') },
        { ...T('पुस्तिका', 'pustikā', 'the notebook', 'f'), quality: P('सुन्दरी', 'sundarī', 'beautiful') },
      ],
      topics: [
        { q: P('किं त्वं संस्कृतं पठसि', 'kiṃ tvaṃ saṃskṛtaṃ paṭhasi', 'Do you study Sanskrit'), answers: [P('आम् अहं संस्कृतं पठामि', 'ām ahaṃ saṃskṛtaṃ paṭhāmi', 'yes, I study Sanskrit')], next: [1] },
        { q: P('किं ते पाठः कठिनः', 'kiṃ te pāṭhaḥ kaṭhinaḥ', 'Is the lesson difficult for you'), answers: [P('न तत् सुबोधम्', 'na tat subodham', 'no, it is easy')], next: [0] },
      ],
    },
    travel: {
      id: 'travel', name: 'Travel', version: '1.0.0',
      subjects: ['i', 'you', 'sir'],
      objects: {
        read: [P('मार्गनिर्देशम्', 'mārganirdeśam', 'the directions'), P('पत्रम्', 'patram', 'a letter')],
        write: [P('पत्रम्', 'patram', 'a letter'), P('सन्देशम्', 'sandeśam', 'a message')],
        go: [P('वाराणसीम्', 'vārāṇasīm', 'to Varanasi'), P('गृहम्', 'gṛham', 'home'), P('नगरम्', 'nagaram', 'to the city')],
      },
      places: [P('वाराणस्याम्', 'vārāṇasyām', 'in Varanasi'), P('मार्गे', 'mārge', 'on the road')],
      opinions: [P('वाराणसी', 'vārāṇasī', 'Varanasi'), P('यात्रा', 'yātrā', 'the journey')],
      qualities: [P('सुन्दरी', 'sundarī', 'beautiful'), P('रोचिका', 'rocikā', 'interesting')],
      reasons: [P('तत्र पवित्रा नदी अस्ति', 'tatra pavitrā nadī asti', 'there is a sacred river there'), P('तत् शान्तिदायकम् अस्ति', 'tat śāntidāyakam asti', 'it is calming')],
      things: [
        { ...T('नगरम्', 'nagaram', 'the city', 'n'), quality: P('सुन्दरम्', 'sundaram', 'beautiful') },
        { ...T('नदी', 'nadī', 'the river', 'f'), quality: P('पवित्रा', 'pavitrā', 'sacred') },
      ],
      topics: [
        { q: P('त्वं कुत्र गच्छसि', 'tvaṃ kutra gacchasi', 'Where are you going'), answers: [P('अहं वाराणसीम् गच्छामि', 'ahaṃ vārāṇasīm gacchāmi', 'I am going to Varanasi')], next: [1] },
        { q: P('मार्गः कुत्र', 'mārgaḥ kutra', 'Where is the road'), answers: [P('मार्गः अत्र', 'mārgaḥ atra', 'the road is here')], next: [0] },
      ],
    },
    vedanta: {
      id: 'vedanta', name: 'Vedānta', version: '1.0.0',
      subjects: ['i', 'student', 'teacher'],
      objects: {
        read: [P('वेदान्तम्', 'vedāntam', 'Vedānta'), P('उपनिषदम्', 'upaniṣadam', 'an Upaniṣad'), P('ब्रह्मसूत्रम्', 'brahmasūtram', 'the Brahma-sūtra')],
        write: [P('भाष्यम्', 'bhāṣyam', 'a commentary'), P('टिप्पणीम्', 'ṭippaṇīm', 'a note')],
        go: [P('आश्रमम्', 'āśramam', 'to the ashram'), P('गृहम्', 'gṛham', 'home')],
      },
      places: [P('आश्रमे', 'āśrame', 'at the ashram'), P('मठे', 'maṭhe', 'in the monastery')],
      opinions: [P('वेदान्तः', 'vedāntaḥ', 'Vedānta'), P('आत्मा', 'ātmā', 'the Self'), P('ज्ञानम्', 'jñānam', 'knowledge')],
      qualities: [P('गहनः', 'gahanaḥ', 'profound'), P('महत्त्वपूर्णः', 'mahattvapūrṇaḥ', 'important')],
      reasons: [P('तत् अज्ञानं नाशयति', 'tat ajñānaṃ nāśayati', 'it dispels ignorance'), P('तेन मोक्षः भवति', 'tena mokṣaḥ bhavati', 'through it there is liberation')],
      things: [
        { ...T('उपनिषद्', 'upaniṣad', 'the Upaniṣad', 'f'), quality: P('गहना', 'gahanā', 'profound') },
        { ...T('ज्ञानम्', 'jñānam', 'knowledge', 'n'), quality: P('महत्त्वपूर्णम्', 'mahattvapūrṇam', 'important') },
      ],
      topics: [
        { q: P('त्वं किं पठसि', 'tvaṃ kiṃ paṭhasi', 'What do you study'), answers: [P('अहम् उपनिषदं पठामि', 'aham upaniṣadaṃ paṭhāmi', 'I study the Upaniṣad')], next: [1] },
        { q: P('आत्मा किम्', 'ātmā kim', 'What is the Self'), answers: [P('आत्मा चैतन्यम्', 'ātmā caitanyam', 'the Self is consciousness')], next: [0] },
      ],
    },
    trika: {
      id: 'trika', name: 'Trika', version: '1.0.0',
      subjects: ['i', 'student', 'teacher'],
      objects: {
        read: [P('शिवसूत्राणि', 'śivasūtrāṇi', 'the Śiva Sūtras'), P('तन्त्रालोकम्', 'tantrālokam', 'the Tantrāloka'), P('ईश्वरप्रत्यभिज्ञाम्', 'īśvarapratyabhijñām', 'the Īśvara-pratyabhijñā')],
        write: [P('भाष्यम्', 'bhāṣyam', 'a commentary'), P('स्तोत्रम्', 'stotram', 'a hymn')],
        go: [P('काशीम्', 'kāśīm', 'to Kashi'), P('आश्रमम्', 'āśramam', 'to the ashram')],
      },
      places: [P('काश्याम्', 'kāśyām', 'in Kashi'), P('आश्रमे', 'āśrame', 'at the ashram')],
      opinions: [P('शैवदर्शनम्', 'śaivadarśanam', 'Śaiva philosophy'), P('चैतन्यम्', 'caitanyam', 'consciousness'), P('शिवसूत्राणि', 'śivasūtrāṇi', 'the Śiva Sūtras')],
      qualities: [P('गहनम्', 'gahanam', 'profound'), P('सुन्दरम्', 'sundaram', 'beautiful')],
      reasons: [P('तत् स्वातन्त्र्यं दर्शयति', 'tat svātantryaṃ darśayati', 'it reveals freedom'), P('तेन आत्मा प्रकाशते', 'tena ātmā prakāśate', 'through it the Self shines')],
      things: [
        { ...T('तन्त्रालोकः', 'tantrālokaḥ', 'the Tantrāloka', 'm'), quality: P('गहनः', 'gahanaḥ', 'profound') },
        { ...T('चैतन्यम्', 'caitanyam', 'consciousness', 'n'), quality: P('सुन्दरम्', 'sundaram', 'beautiful') },
      ],
      topics: [
        { q: P('त्वं किं पठसि', 'tvaṃ kiṃ paṭhasi', 'What do you study'), answers: [P('अहं शिवसूत्राणि पठामि', 'ahaṃ śivasūtrāṇi paṭhāmi', 'I study the Śiva Sūtras')], next: [1] },
        { q: P('चैतन्यं किम्', 'caitanyaṃ kim', 'What is consciousness'), answers: [P('चैतन्यं शिवः', 'caitanyaṃ śivaḥ', 'consciousness is Śiva')], next: [0] },
      ],
    },
  };

  function actorById(id) {
    return people.find((p) => p.id === id) || subjects[id];
  }
  function enSubject(a) {
    if (a.en === 'I') return 'I';
    if (a.en.startsWith('you')) return a.en;
    return 'the ' + a.en;
  }
  function enPerson(a) { return a.en && a.en.startsWith('you') ? 'second' : a.person; }
  function enVerb(verbId, person, neg) {
    const base = { read: 'study', write: 'write', go: 'go' }[verbId];
    const third = { study: 'studies', write: 'writes', go: 'goes' }[base];
    if (person === 'third') return (neg ? 'does not ' : '') + third;
    return (neg ? 'do not ' : '') + base;
  }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  function actorRing(pack) {
    const actors = pack.subjects.map(actorById);
    return {
      id: 'actor', title: 'Who?',
      options: actors.map((a) => SW.choose(a.id, a.dev, { en: a.en, person: a.person })),
    };
  }

  // ---- Action wheel (3.1, 3.2) ----
  function action31(pack, ringActor) {
    const objOptions = (s) => (pack.objects[s.verb] || []).map((o, i) => SW.choose('o' + i, o.dev, { en: o.en }));
    return [
      ringActor,
      { id: 'verb', title: 'Action', options: Object.keys(pack.objects).map((v) => SW.choose(v, verbs[v].label)) },
      { id: 'target', title: 'Object / goal', options: objOptions },
      { id: 'time', title: 'When?', options: times.map((t) => SW.choose(t.id, t.label, { en: t.en })) },
      { id: 'polarity', title: 'Positive / negative', options: [SW.choose('yes', 'आम्'), SW.choose('no', 'न')] },
    ];
  }
  function action32(pack, ringActor) {
    const objOptions = (s) => (pack.objects[s.verb] || []).map((o, i) => SW.choose('o' + i, o.dev, { en: o.en }));
    return [
      ringActor,
      { id: 'verb', title: 'Action', options: Object.keys(pack.objects).filter((v) => v !== 'go').map((v) => SW.choose(v, verbs[v].label)) },
      { id: 'target', title: 'Object', options: objOptions },
      { id: 'place', title: 'Where?', options: pack.places.map((p, i) => SW.choose('p' + i, p.dev, { en: p.en })) },
      { id: 'time', title: 'When?', options: times.map((t) => SW.choose(t.id, t.label, { en: t.en })) },
    ];
  }
  const build31 = (pack) => (s) => {
    const a = actorById(s.actor);
    const o = (pack.objects[s.verb] || [])[Number(String(s.target).slice(1))];
    const t = times.find((x) => x.id === s.time);
    const v = verbs[s.verb].forms[a.person] || verbs[s.verb].forms.third;
    const neg = s.polarity === 'no';
    return {
      lines: [SW.line(
        `${t.dev} ${a.nom || a.dev} ${o.dev} ${neg ? 'न ' : ''}${v[0]}।`,
        `${t.roman} ${a.nomR || a.roman} ${o.roman} ${neg ? 'na ' : ''}${v[1]}.`,
        `${cap(t.en)} ${enSubject(a)} ${enVerb(s.verb, enPerson(a), neg)} ${o.en}.`,
      )],
      note: `Action 3.1 · ${pack.name}: the verb agrees with the actor; the object is accusative.`,
    };
  };
  const build32 = (pack) => (s) => {
    const a = actorById(s.actor);
    const o = (pack.objects[s.verb] || [])[Number(String(s.target).slice(1))];
    const p = pack.places[Number(String(s.place).slice(1))];
    const t = times.find((x) => x.id === s.time);
    const v = verbs[s.verb].forms[a.person] || verbs[s.verb].forms.third;
    return {
      lines: [SW.line(
        `${t.dev} ${a.nom || a.dev} ${p.dev} ${o.dev} ${v[0]}।`,
        `${t.roman} ${a.nomR || a.roman} ${p.roman} ${o.roman} ${v[1]}.`,
        `${cap(t.en)} ${enSubject(a)} ${enVerb(s.verb, enPerson(a), false)} ${o.en} ${p.en}.`,
      )],
      note: `Action 3.2 · ${pack.name}: place is locative; the verb agrees with the actor.`,
    };
  };

  // ---- Expression wheel (2.1) ----
  function expression21(pack, ringActor) {
    return [
      ringActor,
      { id: 'stance', title: 'Mental verb', options: [
        { id: 'think', dev: 'मन्ये', roman: 'manye' },
        { id: 'know', dev: 'जानामि', roman: 'jānāmi' },
        { id: 'say', dev: 'वदामि', roman: 'vadāmi' },
      ].map((x) => SW.choose(x.id, x.dev)) },
      { id: 'subject', title: 'About', options: pack.opinions.map((o, i) => SW.choose('s' + i, o.dev, { en: o.en })) },
      { id: 'quality', title: 'Judgment', options: pack.qualities.map((q, i) => SW.choose('q' + i, q.dev, { en: q.en })) },
      { id: 'reason', title: 'Because', options: pack.reasons.map((r, i) => SW.choose('r' + i, r.dev, { en: r.en })) },
    ];
  }
  const build21 = (pack) => (s) => {
    const subj = pack.opinions[Number(String(s.subject).slice(1))];
    const q = pack.qualities[Number(String(s.quality).slice(1))];
    const r = pack.reasons[Number(String(s.reason).slice(1))];
    const stance = { think: ['मन्ये', 'manye', 'think'], know: ['जानामि', 'jānāmi', 'know'], say: ['वदामि', 'vadāmi', 'say'] }[s.stance];
    const a = actorById(s.actor);
    const first = a.person === 'first';
    const verb = first ? stance[1] : (s.stance === 'think' ? 'manyate' : s.stance === 'know' ? 'jānāti' : 'vadati');
    return {
      lines: [SW.line(
        `${a.nom || a.dev} ${subj.dev} ${q.dev} इति ${first ? stance[0] : (s.stance === 'think' ? 'मन्यते' : s.stance === 'know' ? 'जानाति' : 'वदति')}, यतः ${r.dev}।`,
        `${a.nomR || a.roman} ${subj.roman} ${q.roman} iti ${verb}, yataḥ ${r.roman}.`,
        `${cap(enSubject(a))} ${first ? stance[2] : stance[2] + 's'} that ${subj.en} is ${q.en}, because ${r.en}.`,
      )],
      note: `Expression 2.1 · ${pack.name}: iti closes the thought; yataḥ introduces the reason.`,
    };
  };

  // ---- Description wheel (4.1) ----
  function description41(pack, ringActor) {
    return [
      ringActor,
      { id: 'point', title: 'This / that', options: [
        { id: 'this', forms: { m: ['अयं', 'ayaṃ', 'this'], f: ['इयं', 'iyaṃ', 'this'], n: ['इदं', 'idaṃ', 'this'] } },
        { id: 'that', forms: { m: ['सः', 'saḥ', 'that'], f: ['सा', 'sā', 'that'], n: ['तत्', 'tat', 'that'] } },
      ].map((x) => SW.choose(x.id, x.id === 'this' ? 'इदम्' : 'तत्')) },
      { id: 'thing', title: 'Thing', options: pack.things.map((t, i) => SW.choose('t' + i, t.dev, { en: t.en })) },
      { id: 'degree', title: 'Intensity', options: [SW.choose('plain', 'सामान्यम्'), SW.choose('very', 'अतीव')] },
      { id: 'polarity', title: 'Affirm / deny', options: [SW.choose('yes', 'अस्ति'), SW.choose('no', 'नास्ति')] },
    ];
  }
  const build41 = (pack) => (s) => {
    const th = pack.things[Number(String(s.thing).slice(1))];
    const dm = { this: { m: ['अयं', 'ayaṃ', 'this'], f: ['इयं', 'iyaṃ', 'this'], n: ['इदं', 'idaṃ', 'this'] }, that: { m: ['सः', 'saḥ', 'that'], f: ['सा', 'sā', 'that'], n: ['तत्', 'tat', 'that'] } }[s.point][th.gender];
    const deg = s.degree === 'very' ? ['अतीव ', 'atīva ', 'very '] : ['', '', ''];
    const neg = s.polarity === 'no';
    return {
      lines: [SW.line(
        `${dm[0]} ${th.dev} ${deg[0]}${th.quality.dev} ${neg ? 'न ' : ''}अस्ति।`.replace(/  +/g, ' '),
        `${dm[1]} ${th.roman} ${deg[1]}${th.quality.roman} ${neg ? 'na ' : ''}asti.`.replace(/  +/g, ' '),
        `${cap(dm[2])} ${String(th.en).replace(/^the /, '')} is ${neg ? 'not ' : ''}${deg[2]}${th.quality.en}.`,
      )],
      note: `Description 4.1 · ${pack.name}: demonstrative and quality agree with the noun's gender (${th.gender}).`,
    };
  };

  // ---- Conversation wheel (1.1, pack topics) ----
  function conversation11(pack, ringActor) {
    return [
      ringActor,
      { id: 'topic', title: 'Question', options: pack.topics.map((t, i) => SW.choose('t' + i, t.q.dev, { en: t.q.en })) },
      { id: 'reply', title: 'Answer', options: (s) => {
        const t = pack.topics[Number(String(s.topic).slice(1))];
        return t.answers.map((a, i) => SW.choose('a' + i, a.dev, { en: a.en }));
      } },
      { id: 'style', title: 'Response style', options: [SW.choose('full', 'पूर्णम्'), SW.choose('short', 'लघु')] },
      { id: 'next', title: 'Follow-up', options: (s) => {
        const t = pack.topics[Number(String(s.topic).slice(1))];
        return (t.next || []).map((ni, i) => SW.choose('n' + i, pack.topics[ni].q.dev, { en: pack.topics[ni].q.en }));
      } },
    ];
  }
  const build11 = (pack) => (s, chosen) => {
    const ti = Number(String(s.topic).slice(1));
    const t = pack.topics[ti];
    const ans = t.answers[Number(String(s.reply).slice(1))];
    const nx = (t.next || []).length ? pack.topics[t.next[0]] : null;
    const lines = [SW.line(`${t.q.dev}?`, `${t.q.roman}?`, `${cap(t.q.en)}?`, 'Question')];
    if (s.style === 'full') lines.push(SW.line(`${ans.dev}।`, `${ans.roman}.`, `${cap(ans.en)}.`, 'Answer'));
    else lines.push(SW.line(`${ans.dev}।`, `${ans.roman}.`, `${cap(ans.en)}.`, 'Answer'));
    if (nx) lines.push(SW.line(`${nx.q.dev}?`, `${nx.q.roman}?`, `${cap(nx.q.en)}?`, 'Follow-up'));
    return { lines, note: `Conversation 1.1 · ${pack.name}: the follow-up ring asks the next question, so turns continue.` };
  };

  // ---- loops: the next prompt after a turn (finite per step, unbounded) ----
  const loops = {
    conversation(pack, state) {
      const ti = Number(String(state.topic || 't0').slice(1));
      const t = pack.topics[ti] || pack.topics[0];
      const nx = (t.next || [])[0];
      const nt = pack.topics[nx] || pack.topics[0];
      return SW.line(`${nt.q.dev}?`, `${nt.q.roman}?`, `${cap(nt.q.en)}?`, 'Continue');
    },
    expression(pack, state) {
      return SW.line('अपि च किमर्थम्?', 'api ca kimartham?', 'And why else?', 'Continue');
    },
    action(pack, state) {
      return SW.line('ततः किम्?', 'tataḥ kim?', 'And then what?', 'Continue');
    },
    description(pack, state) {
      return SW.line('अस्य गुणः कः?', 'asya guṇaḥ kaḥ?', "And what is its quality?", 'Continue');
    },
  };

  root.SWPacks = {
    packs, subjects, actorById, actorRing,
    action31, action32, build31, build32,
    expression21, build21,
    description41, build41,
    conversation11, build11,
    loops,
  };
})(globalThis);
