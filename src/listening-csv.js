const CAMBRIDGE20_CSV = [
    {
        "Video_Title":  "Cambridge 20 listening test 1 || IELTS Listening test 1 || BOOK 20 TEST 1 || 2025 update",
        "YouTube_URL":  "https://www.youtube.com/watch?v=H7z82rHd4uY\u0026list=PLkd3MOGUc7Mc7WWkVzsdVfpJJv7tBRsM3\u0026index=30",
        "Part":  "Part 1 (Questions 1-10)",
        "Start_Timestamp":  "00:00:01",
        "Topic_and_Question_Summary":  "Restaurant recommendations for sister\u0027s 30th birthday: 1. The Junction (Grayson Street, near station, fresh fish, roof drinks); 2. Paloma (Bow Street, beside cinema, Spanish small dishes, £50 deposit, limited vegetarian); 3. The Audley (hotel near Baxter Bridge, top floor, chef Angela Fra, local products, £30 set lunch / £50 evening, average portions).",
        "Answers":  "1. Grayson | 2. fish | 3. roof | 4. cinema | 5. £50 / 50 | 6. vegetarian | 7. Audley | 8. bridge | 9. local | 10. lunch"
    },
    {
        "Video_Title":  "Cambridge 20 listening test 1 || IELTS Listening test 1 || BOOK 20 TEST 1 || 2025 update",
        "YouTube_URL":  "https://www.youtube.com/watch?v=H7z82rHd4uY\u0026list=PLkd3MOGUc7Mc7WWkVzsdVfpJJv7tBRsM3\u0026index=30",
        "Part":  "Part 2 (Questions 11-20)",
        "Start_Timestamp":  "00:06:45",
        "Topic_and_Question_Summary":  "Heather McCallum talk at Adelman Pottery: History/archaeology of clay pots, personal benefits (concentration, exercise for arthritis), safety/clothing rules (remove watches/necklaces, tie hair back, old clothes), and workshop equipment (kiln at 1,000°C, potter\u0027s wheel, sculpting/basic tools).",
        "Answers":  "11-16 (Multiple Choice / Info): Archaeological insight (tool scratches/clay origin), concentration/stress relief, arthritis exercise, remove jewelry/tie hair, old clothes | 17-20 (Equipment): Kiln (1,000°C, domestic ovens crack clay, toxic compounds), Potter\u0027s wheel (circular walls), Basic tools (provided)"
    },
    {
        "Video_Title":  "Cambridge 20 listening test 1 || IELTS Listening test 1 || BOOK 20 TEST 1 || 2025 update",
        "YouTube_URL":  "https://www.youtube.com/watch?v=H7z82rHd4uY\u0026list=PLkd3MOGUc7Mc7WWkVzsdVfpJJv7tBRsM3\u0026index=30",
        "Part":  "Part 3 (Questions 21-30)",
        "Start_Timestamp":  "00:14:47",
        "Topic_and_Question_Summary":  "Sociology presentation on loneliness by Tamara and Dev: Causes (city design/high-rise flats, moving for work), health risks (10% cancer risk in Finland, weakened immune system; mixed dementia/cardiovascular data), evolutionary theory, lack of clinical diagnosis, presentation ideas (personal university experience, talking to strangers, solitude vs. loneliness).",
        "Answers":  "21-26 (Discussion/Analysis): High-rise city design, moving for work, 10% cancer risk \u0026 weakened immune system supported, evolutionary neuron theory inconclusive | 27-30 (Presentation Plan): No clinical diagnosis/treatment, start with personal uni example, talking to strangers connects to community, solitude benefits vs. dislike of being alone"
    },
    {
        "Video_Title":  "Cambridge 20 listening test 1 || IELTS Listening test 1 || BOOK 20 TEST 1 || 2025 update",
        "YouTube_URL":  "https://www.youtube.com/watch?v=H7z82rHd4uY\u0026list=PLkd3MOGUc7Mc7WWkVzsdVfpJJv7tBRsM3\u0026index=30",
        "Part":  "Part 4 (Questions 31-40)",
        "Start_Timestamp":  "00:22:30",
        "Topic_and_Question_Summary":  "Urban planning presentation on the role of rivers in cities: Historical transport, fishing, pleasure trips; pollution from sewage and factories (Thames declared biologically dead in 1957); modern cleanup (seals/whale in Thames), riverside apartments/restaurants, Los Angeles river park/local art, Paris summer river beaches, future transport (ferries, freight barges replacing 44 trucks, cargo bikes in Amsterdam, drones).",
        "Answers":  "31. fishing | 32. sewage | 33. factories | 34. whale | 35. apartments | 36. art | 37. beaches | 38. ferries / ferry | 39. bikes / cargo bikes | 40. drones / drone"
    }
];

const CSV_PRACTICE_PROMPTS = {
  1: ['Restaurant recommendations', [
    "The Junction is on ___ Street, near the station.",
    "The Junction serves fresh ___ .",
    "Drinks are available on the ___ .",
    "Paloma is beside the ___ in Bow Street.",
    "Paloma requires a deposit of ___ .",
    "Paloma has a limited selection of ___ dishes.",
    "The third restaurant is called The ___ .",
    "Its hotel is near Baxter ___ .",
    "The chef uses ___ products.",
    "The set ___ costs 30 pounds."
  ]],
  4: ['The role of rivers in cities', [
    "Historical uses included transport, ___ and pleasure trips.",
    "One source of river pollution was ___ from homes.",
    "Another source of pollution was ___ .",
    "A ___ has been seen in the Thames after the cleanup.",
    "Modern riversides include restaurants and ___ .",
    "Plans for the Los Angeles river include a park and local ___ .",
    "Paris creates summer river ___ .",
    "A future transport option is passenger ___ .",
    "Deliveries in Amsterdam can use cargo ___ .",
    "Future deliveries may use ___ ."
  ]]
};
function applyCambridge20Csv(tests) {
  const test = tests.find(t => t.book === 20 && t.sourceTest === 1);
  if (!test) return;
  // Keep answers entered for the OCR version separate from this new question order.
  test.id = 'c20l1-csv';
  test.csvSource = true;
  test.groups = [];
  test.sourceNote = 'Practice notes adapted from your CSV summary, replacing the OCR version. Questions 11-30 have summaries only and are not graded. These are not the original Cambridge question wording or numbering.';
  test.answers = Array.from({length: 40}, (_, i) => ({n: i+1, answer: '', accept: []}));
  for (const row of CAMBRIDGE20_CSV) {
    if (!/^\d+\./.test(row.Answers)) continue;
    for (const item of row.Answers.split('|')) {
      const match = item.trim().match(/^(\d+)\.\s*(.+)$/);
      if (!match) continue;
      const n = Number(match[1]);
      if (n < 1 || n > 40) continue;
      test.answers[n-1] = {n, answer: match[2], accept: match[2].split('/').map(a => a.trim())};
    }
  }
}
function renderCambridge20Csv(test, selectedPart) {
  const row = CAMBRIDGE20_CSV[selectedPart-1];
  const practice = CSV_PRACTICE_PROMPTS[selectedPart];
  let body = '<p class="notice">Practice notes adapted from the supplied CSV. The original Cambridge question text is not contained in that file.</p>';
  if (practice) {
    body += '<h2>'+esc(practice[0])+'</h2><p>Complete the practice notes using the recording. Question numbers follow the CSV answer list.</p>';
    body += practice[1].map((text, i) => '<p class="flow-line"><strong>'+((selectedPart-1)*10+i+1)+'.</strong> '+esc(text)+'</p>').join('');
  } else {
    body += '<h2>'+esc(row.Part)+'</h2><p class="notice warn">The CSV provides a topic summary, not individual questions, letter choices or a numbered answer key for this Part. These responses cannot be graded.</p>';
    body += '<p>'+esc(row.Topic_and_Question_Summary)+'</p>';
  }
  return '<section class="listening-text">'+body+'</section>';
}
