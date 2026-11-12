/* Family 7 — Numbers. LOCAL EXTENSION (not from the R2 zip).
   Same contract as the vendored families: 5 rings + deterministic build().
   Conservative, well-attested forms only; status stays
   MACHINE_PROPOSED_UNREVIEWED until Vidyut checks each line. */
(function () {
  'use strict';
  const { choose, line, registerFamily } = SW;

  // cardinal numerals that agree with a neuter noun (counting things)
  const nums = [
    { id: '1', n: 1, form: 'एकम्', roman: 'ekam', en: 'one', num: 'sg' },
    { id: '2', n: 2, form: 'द्वे', roman: 'dve', en: 'two', num: 'du' },
    { id: '3', n: 3, form: 'त्रीणि', roman: 'trīṇi', en: 'three', num: 'pl' },
    { id: '4', n: 4, form: 'चत्वारि', roman: 'catvāri', en: 'four', num: 'pl' },
    { id: '5', n: 5, form: 'पञ्च', roman: 'pañca', en: 'five', num: 'pl' },
    { id: '6', n: 6, form: 'षट्', roman: 'ṣaṭ', en: 'six', num: 'pl' },
    { id: '7', n: 7, form: 'सप्त', roman: 'sapta', en: 'seven', num: 'pl' },
    { id: '8', n: 8, form: 'अष्ट', roman: 'aṣṭa', en: 'eight', num: 'pl' },
    { id: '9', n: 9, form: 'नव', roman: 'nava', en: 'nine', num: 'pl' },
    { id: '10', n: 10, form: 'दश', roman: 'daśa', en: 'ten', num: 'pl' },
  ];
  // neuter nouns with the three number-forms the numeral selects
  const things = [
    { id: 'phala', en: 'fruit', sg: ['फलम्', 'phalam'], du: ['फले', 'phale'], pl: ['फलानि', 'phalāni'] },
    { id: 'pustaka', en: 'book', sg: ['पुस्तकम्', 'pustakam'], du: ['पुस्तके', 'pustake'], pl: ['पुस्तकानि', 'pustakāni'] },
    { id: 'puppha', en: 'flower', sg: ['पुष्पम्', 'puṣpam'], du: ['पुष्पे', 'puṣpe'], pl: ['पुष्पाणि', 'puṣpāṇi'] },
  ];
  const places = [
    { id: 'atra', dev: 'अत्र', roman: 'atra', en: 'here' },
    { id: 'tatra', dev: 'तत्र', roman: 'tatra', en: 'there' },
    { id: 'udyane', dev: 'उद्याने', roman: 'udyāne', en: 'in the garden' },
  ];
  const verbs = { sg: ['अस्ति', 'asti', 'there is'], du: ['स्तः', 'staḥ', 'there are (two)'], pl: ['सन्ति', 'santi', 'there are'] };

  function thingForm(t, num) { return t[num] || t.pl; }

  const level71 = {
    id: '7.1', title: 'Count to ten', focus: 'Count things: the noun follows the number (1 singular, 2 dual, 3+ plural).',
    rings: [
      { id: 'number', title: 'How many?', options: nums.map((x) => choose(x.id, x.form, { en: x.en })) },
      { id: 'thing', title: 'What?', options: things.map((x) => choose(x.id, x.en)) },
      { id: 'place', title: 'Where?', options: places.map((x) => choose(x.id, x.dev, { en: x.en })) },
      { id: 'mode', title: 'Statement / question', options: [choose('say', 'वाक्यम्', { en: 'statement' }), choose('ask', 'प्रश्नः', { en: 'question' })] },
      { id: 'style', title: 'Length', options: [choose('full', 'पूर्णम्', { en: 'full sentence' }), choose('short', 'लघु', { en: 'just the count' })] },
    ],
    build: (s) => {
      const num = nums.find((x) => x.id === s.number);
      const t = things.find((x) => x.id === s.thing);
      const p = places.find((x) => x.id === s.place);
      const nf = thingForm(t, num.num);
      const v = verbs[num.num];
      if (s.mode === 'ask') {
        const q = s.style === 'short'
          ? line(`कति ${nf[0]}?`, `kati ${nf[1]}?`, `How many ${t.en}s?`, 'Question')
          : line(`${p.dev} कति ${nf[0]} सन्ति?`, `${p.roman} kati ${nf[1]} santi?`, `How many ${t.en}s are ${p.en}?`, 'Question');
        return { lines: [q], note: 'kati (“how many?”) takes a plural noun; the number answers it.' };
      }
      const say = s.style === 'short'
        ? line(`${num.form} ${nf[0]}।`, `${num.roman} ${nf[1]}.`, `${num.en} ${t.en}${num.n === 1 ? '' : 's'}.`, 'Count')
        : line(`${p.dev} ${num.form} ${nf[0]} ${v[0]}।`, `${p.roman} ${num.roman} ${nf[1]} ${v[1]}.`, `There ${num.n === 1 ? 'is' : 'are'} ${num.en} ${t.en}${num.n === 1 ? '' : 's'} ${p.en}.`, 'Statement');
      return { lines: [say], note: 'Sanskrit agrees with the number: 1 takes singular, 2 takes dual (dvau/dve), 3 and above take plural.' };
    },
  };

  const tens = [
    { id: '20', n: 20, dev: 'विंशतिः', roman: 'viṃśatiḥ', en: 'twenty' },
    { id: '30', n: 30, dev: 'त्रिंशत्', roman: 'triṃśat', en: 'thirty' },
    { id: '40', n: 40, dev: 'चत्वारिंशत्', roman: 'catvāriṃśat', en: 'forty' },
    { id: '50', n: 50, dev: 'पञ्चाशत्', roman: 'pañcāśat', en: 'fifty' },
    { id: '60', n: 60, dev: 'षष्टिः', roman: 'ṣaṣṭiḥ', en: 'sixty' },
    { id: '70', n: 70, dev: 'सप्ततिः', roman: 'saptatiḥ', en: 'seventy' },
    { id: '80', n: 80, dev: 'अशीतिः', roman: 'aśītiḥ', en: 'eighty' },
    { id: '90', n: 90, dev: 'नवतिः', roman: 'navatiḥ', en: 'ninety' },
    { id: '100', n: 100, dev: 'शतम्', roman: 'śatam', en: 'one hundred' },
  ];
  const level72 = {
    id: '7.2', title: 'Tens and hundreds', focus: 'The tens: viṃśatiḥ, triṃśat … śatam. The counted noun stays plural.',
    rings: [
      { id: 'number', title: 'How many?', options: tens.map((x) => choose(x.id, x.dev, { en: x.en })) },
      { id: 'thing', title: 'What?', options: things.map((x) => choose(x.id, x.en)) },
      { id: 'place', title: 'Where?', options: places.map((x) => choose(x.id, x.dev, { en: x.en })) },
      { id: 'mode', title: 'Statement / question', options: [choose('say', 'वाक्यम्', { en: 'statement' }), choose('ask', 'प्रश्नः', { en: 'question' })] },
      { id: 'style', title: 'Length', options: [choose('full', 'पूर्णम्', { en: 'full sentence' }), choose('short', 'लघु', { en: 'just the count' })] },
    ],
    build: (s) => {
      const n = tens.find((x) => x.id === s.number);
      const t = things.find((x) => x.id === s.thing);
      const p = places.find((x) => x.id === s.place);
      const pl = t.pl;
      if (s.mode === 'ask') {
        const q = line(`${p.dev} कति ${pl[0]} सन्ति?`, `${p.roman} kati ${pl[1]} santi?`, `How many ${t.en}s are ${p.en}?`, 'Question');
        return { lines: [q], note: 'Questions with kati do not need the number in them.' };
      }
      const say = s.style === 'short'
        ? line(`${n.dev} ${pl[0]}।`, `${n.roman} ${pl[1]}.`, `${n.en.charAt(0).toUpperCase() + n.en.slice(1)} ${t.en}s.`, 'Count')
        : line(`${p.dev} ${n.dev} ${pl[0]} सन्ति।`, `${p.roman} ${n.roman} ${pl[1]} santi.`, `There are ${n.en} ${t.en}s ${p.en}.`, 'Statement');
      return { lines: [say], note: 'From 20 upward the numeral itself is a feminine noun (viṃśatiḥ); the counted noun stays plural.' };
    },
  };

  const people = [
    { id: 'mama', dev: 'मम', roman: 'mama', en: 'I', verb: 'अस्मि', vr: 'asmi', poss: 'my' },
    { id: 'tava', dev: 'तव', roman: 'tava', en: 'you', verb: 'असि', vr: 'asi', poss: 'your' },
    { id: 'bhavatah', dev: 'भवतः', roman: 'bhavataḥ', en: 'you (respectful)', verb: 'अस्ति', vr: 'asti', poss: 'your (respectful)' },
    { id: 'tasya', dev: 'तस्य', roman: 'tasya', en: 'he', verb: 'अस्ति', vr: 'asti', poss: 'his' },
  ];
  const ages = [
    { id: '10', dev: 'दश', roman: 'daśa', en: 'ten' },
    { id: '20', dev: 'विंशतिः', roman: 'viṃśatiḥ', en: 'twenty' },
    { id: '27', dev: 'सप्तविंशतिः', roman: 'saptaviṃśatiḥ', en: 'twenty-seven' },
    { id: '30', dev: 'त्रिंशत्', roman: 'triṃśat', en: 'thirty' },
    { id: '36', dev: 'षट्त्रिंशत्', roman: 'ṣaṭtriṃśat', en: 'thirty-six' },
    { id: '50', dev: 'पञ्चाशत्', roman: 'pañcāśat', en: 'fifty' },
  ];
  const level73 = {
    id: '7.3', title: 'Age', focus: 'Say how old someone is: “my age is 36”.',
    rings: [
      { id: 'person', title: 'Whose age?', options: people.map((x) => choose(x.id, x.dev, { en: x.en })) },
      { id: 'age', title: 'Age', options: ages.map((x) => choose(x.id, x.dev, { en: x.en })) },
      { id: 'mode', title: 'Statement / question', options: [choose('say', 'वाक्यम्', { en: 'statement' }), choose('ask', 'प्रश्नः', { en: 'question' })] },
      { id: 'style', title: 'Length', options: [choose('full', 'पूर्णम्', { en: 'full sentence' }), choose('short', 'लघु', { en: 'short' })] },
      { id: 'politeness', title: 'Tone', options: [choose('plain', 'सामान्यम्', { en: 'plain' }), choose('soft', 'मृदु', { en: 'gentle' })] },
    ],
    build: (s) => {
      const p = people.find((x) => x.id === s.person);
      const a = ages.find((x) => x.id === s.age);
      if (s.mode === 'ask') {
        const q = line(`${p.dev} वयः कियत्?`, `${p.roman} vayaḥ kiyat?`, `How old ${p.en === 'I' ? 'am I' : 'are ' + p.en}?`, 'Question');
        return { lines: [q], note: 'vayaḥ kiyat? — “how much is the age?” — is the standard age question.' };
      }
      const say = s.style === 'short'
        ? line(`${p.dev} वयः ${a.dev}।`, `${p.roman} vayaḥ ${a.roman}.`, `${p.poss} age (is) ${a.en}.`, 'Answer')
        : line(`${p.dev} वयः ${a.dev} ${p.verb}।`, `${p.roman} vayaḥ ${a.roman} ${p.vr}.`, `${p.poss.charAt(0).toUpperCase() + p.poss.slice(1)} age is ${a.en}.`, 'Answer');
      return { lines: [say], note: 'Age uses vayaḥ (neuter); the numeral stands alone, no “years” word is required.' };
    },
  };

  const relations = [
    { id: 'brother', dev: 'भ्राता', roman: 'bhrātā', en: 'brother', g: 'm' },
    { id: 'sister', dev: 'भगिनी', roman: 'bhaginī', en: 'sister', g: 'f' },
    { id: 'friend', dev: 'मित्रम्', roman: 'mitram', en: 'friend', g: 'n' },
  ];
  // adjectives must agree with the relation's gender
  const adjByG = {
    elder: { m: ['ज्येष्ठः', 'jyeṣṭhaḥ'], f: ['ज्येष्ठा', 'jyeṣṭhā'], n: ['ज्येष्ठम्', 'jyeṣṭham'] },
    younger: { m: ['कनिष्ठः', 'kaniṣṭhaḥ'], f: ['कनिष्ठा', 'kaniṣṭhā'], n: ['कनिष्ठम्', 'kaniṣṭham'] },
    one: { m: ['एकः', 'ekaḥ'], f: ['एका', 'ekā'], n: ['एकम्', 'ekam'] },
  };
  function article(word) { return /^[aeiou]/i.test(word) ? 'an' : 'a'; }
  const level74 = {
    id: '7.4', title: 'Family and friends', focus: 'Combine a relation with an age or an adjective — the seed of role-play.',
    rings: [
      { id: 'person', title: 'Whose?', options: [people[0], people[1], people[2]].map((x) => choose(x.id, x.dev, { en: x.en })) },
      { id: 'relation', title: 'Relation', options: relations.map((x) => choose(x.id, x.dev, { en: x.en })) },
      { id: 'quality', title: 'Which one?', options: [choose('elder', 'ज्येष्ठः', { en: 'elder' }), choose('younger', 'कनिष्ठः', { en: 'younger' }), choose('one', 'एकः', { en: 'one' })] },
      { id: 'verb', title: 'Be', options: [choose('asti', 'अस्ति', { en: 'is' }), choose('santi', 'सन्ति', { en: 'are (many)' })] },
      { id: 'mode', title: 'Statement / question', options: [choose('say', 'वाक्यम्', { en: 'statement' }), choose('ask', 'प्रश्नः', { en: 'question' })] },
    ],
    build: (s) => {
      const p = people.find((x) => x.id === s.person);
      const r = relations.find((x) => x.id === s.relation);
      const qDev = adjByG[s.quality][r.g];
      const qEn = s.quality === 'one' ? 'one' : s.quality === 'elder' ? 'elder' : 'younger';
      const v = s.verb === 'santi' ? ['सन्ति', 'santi', 'are'] : ['अस्ति', 'asti', 'is'];
      if (s.mode === 'ask') {
        return { lines: [line(`${p.dev} ${r.dev} कः?`, `${p.roman} ${r.roman} kaḥ?`, `Who is ${p.poss} ${r.en}?`, 'Question')],
                 note: 'kaḥ? asks “who?” for a masculine person; use kā? for a feminine one.' };
      }
      const have = { mama: 'I have', tava: 'You have', bhavatah: 'You have' }[p.id];
      const obj = s.quality === 'one' ? 'one' : article(qEn) + ' ' + qEn;
      return { lines: [line(`${p.dev} ${qDev[0]} ${r.dev} ${v[0]}।`, `${p.roman} ${qDev[1]} ${r.roman} ${v[1]}.`, `${have} ${obj} ${r.en}.`, 'Statement')],
               note: 'Adjectives agree with the noun: jyeṣṭhaḥ bhrātā (elder brother), but jyeṣṭhā bhaginī (elder sister). This level fixes the masculine frame.' };
    },
  };

  registerFamily({
    id: 'numbers', number: 7, title: 'Numbers', sub: 'Count, age, and quantities',
    description: 'Counting things with correct agreement, the tens, age in conversation, and relations with numbers — the seed of role-play scenarios.',
    levels: [level71, level72, level73, level74],
  });
})();
