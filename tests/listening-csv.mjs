import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const tests = JSON.parse(readFileSync('data/listening/tests.json', 'utf8'));
const context = vm.createContext({tests, esc: s => String(s)});
vm.runInContext(readFileSync('src/listening-csv.js', 'utf8'), context);
vm.runInContext('applyCambridge20Csv(tests)', context);
const test = tests.find(t => t.id === 'c20l1-full-csv');
assert.equal(tests.length, 60);
assert(test);
assert.equal(test.answers.length, 40);
assert.equal(test.answers.filter(q => q.answer && !q.manualReference).length, 40);
assert.equal(test.answers[0].answer, 'Grayson');
assert.equal(test.answers[30].answer, 'fishing');
assert.equal(test.answers[14].answer, 'C');
assert.equal(test.answers.slice(20,30).map(q=>q.answer).join(','), 'C,E,D,E,B,B,B,B,B,A');
assert.equal(test.groups.length, 2);
assert.equal(test.part3Revision, 'supplied-v1');
assert.deepEqual(Array.from(test.answers[37].accept), ['ferry', 'ferries']);
context.test = test;
for (let part = 1; part <= 4; part++) {
  const html = vm.runInContext(`renderCambridge20Csv(test, ${part})`, context);
  assert.match(html, /exam-heading/);
  assert.doesNotMatch(html, /adapted|OCR|CSV|cannot be graded|\[[A-E](?:, [A-E])?\]/);
  if (part === 1 || part === 4) assert.equal((html.match(/class="exam-blank"/g) || []).length, 10);
  if (part === 1) { assert.match(html, /exam-table/); assert.doesNotMatch(html, /Grayson|Audley|\[fish\]/); }
  if (part === 2) assert.equal((html.match(/class="exam-choices"/g) || []).length, 6);
  if (part === 3) {
    assert.equal((html.match(/class="exam-choices"/g) || []).length, 8);
    assert.match(html, /smoking-equivalent mortality/);
    assert.match(html, /going on holiday alone/);
  }
}
for (const path of ['listening.html', 'src/listening.template.html']) {
  const html = readFileSync(path, 'utf8');
  assert.match(html, /src="src\/listening-csv.js\?v=[^"]+"/);
  assert.match(html, /applyCambridge20Csv\(TESTS\)/);
  assert.match(html, /renderCambridge20Csv\(current,part\)/);
  assert.doesNotMatch(html, /csvOcrPart3/);
  if (path === 'listening.html') {
    for (const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
  }
}
// Exercise the actual scoring function, including reversed pairs and duplicates.
const source = readFileSync('src/listening.template.html', 'utf8');
const gradeFunction = source.match(/function grade\([\s\S]*?\nconst answered=/)[0].replace(/\nconst answered=$/, '');
context.norm = s => String(s || '').toLowerCase().trim();
vm.runInContext(gradeFunction, context);
context.responses = {answers: Object.fromEntries(test.answers.map(q=>[q.n,q.accept[0]]))};
let scores = vm.runInContext('grade(test,responses)', context);
assert.equal(Object.values(scores).filter(Boolean).length,40);
Object.assign(context.responses.answers, {21:'E',22:'C',23:'E',24:'D'});
scores = vm.runInContext('grade(test,responses)', context);
assert.equal(Object.values(scores).filter(Boolean).length,40);
context.responses.answers[22]='E';
scores=vm.runInContext('grade(test,responses)',context);
assert.equal(scores[21],true);
assert.equal(scores[22],false);
console.log('PASS: supplied Part 3 questions, all 40 keys, either-order pairs, duplicate rejection and page integration.');
