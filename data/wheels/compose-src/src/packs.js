/* packs.js — LOCAL EXTENSION (ours, not from the R2 zip).
   Content packs for the four master wheels. A pack supplies vetted, fully
   inflected lexemes; the wheel supplies grammar. No new inflector here: every
   form below is a curated surface, and the engine only places it in a slot
   the template already controls. Status: MACHINE_PROPOSED_UNREVIEWED. */
(function (root) {
  'use strict';
  const { people, verbs, times } = SWShared;

  // third-person subjects usable by packs (nominative + singular verb agrees)
  const subjects = {
    brother: { id: 'brother', dev: 'भ्राता', roman: 'bhrātā', en: 'brother', person: 'third' },
    mother: { id: 'mother', dev: 'माता', roman: 'mātā', en: 'mother', person: 'third' },
    father: { id: 'father', dev: 'पिता', roman: 'pitā', en: 'father', person: 'third' },
    student: { id: 'student', dev: 'शिष्यः', roman: 'śiṣyaḥ', en: 'the student', person: 'third' },
    teacher: { id: 'teacher', dev: 'गुरुः', roman: 'guruḥ', en: 'the teacher', person: 'third' },
    boy: { id: 'boy', dev: 'बालः', roman: 'bālaḥ', en: 'the boy', person: 'third' },
  };

  const P = (dev, roman, en) => ({ dev, roman, en });

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
    },
  };

  function actorById(id) {
    if (people.find((p) => p.id === id)) return people.find((p) => p.id === id);
    return subjects[id];
  }

  function enSubject(a) {
    if (a.en === 'I') return 'I';
    if (a.en.startsWith('you')) return a.en;
    return 'the ' + a.en;
  }
  function enPerson(a) {
    // polite bhavān/bhavatī are grammatically third person but English 'you'
    return a.en && a.en.startsWith('you') ? 'second' : a.person;
  }
  function enVerb(verbId, person, neg) {
    const base = { read: 'study', write: 'write', go: 'go' }[verbId];
    const third = { study: 'studies', write: 'writes', go: 'goes' }[base];
    if (person === 'third') return (neg ? 'does not ' : '') + third;
    return (neg ? 'do not ' : '') + base;
  }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  function withPack(level, pack) {
    // returns a level whose rings are rebuilt from the pack's lexemes,
    // keeping the wheel's grammar (verb person, tense, polarity) unchanged.
    const actors = pack.subjects.map(actorById);
    const ringActor = {
      id: 'actor', title: 'Who?',
      options: actors.map((a) => SW.choose(a.id, a.dev, { en: a.en, person: a.person })),
    };
    return { ...level, pack: pack.id, rings: level.__rebuild(pack, ringActor) };
  }

  // Action wheel, pack-aware: 3.1 (actor/verb/object/time/polarity),
  // 3.2 (actor/verb/object/place/time). Same build logic as the vendored
  // Action family, but the object/place sets come from the pack.
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

  function build31(pack) {
    return (s) => {
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
        note: `Action 3.1 · pack ${pack.name}: the verb agrees with the actor (${a.person} person); the object is accusative.`,
      };
    };
  }
  function build32(pack) {
    return (s) => {
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
        note: `Action 3.2 · pack ${pack.name}: the place is locative; the verb agrees with the actor.`,
      };
    };
  }

  // A tiny "Why did that change?" explainer: diff two states of the same level.
  function why(levelDef, fromState, toState) {
    const ringTitle = {};
    levelDef.rings.forEach((r) => { ringTitle[r.id] = r.title; });
    const diffs = Object.keys(toState).filter((k) => fromState[k] !== toState[k]);
    const personNote = {
      first: 'takes a first-person verb (…āmi)', second: 'takes a second-person verb (…asi)',
      third: 'takes a third-person verb (…ati)', iv: 'takes a third-person verb (…ati)',
    };
    return diffs.map((k) => ({
      ring: ringTitle[k] || k,
      why: k === 'actor'
        ? 'The actor changed, so the verb ending must change to agree with it.'
        : `The “${ringTitle[k] || k}” changed, so that part of the sentence was rebuilt.`,
    }));
  }

  root.SWPacks = { packs, action31, action32, build31, build32, withPack, why, actorById };
})(globalThis);
