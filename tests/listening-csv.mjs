import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const tests = JSON.parse(readFileSync('data/listening/tests.json', 'utf8'));
const context = vm.createContext({tests, esc: s => String(s)});
vm.runInContext(readFileSync('src/listening-csv.js', 'utf8'), context);
vm.runInContext('applyCambridge20Csv(tests)', context);
const test = tests.find(t => t.id === 'c20l1-csv');
assert.equal(tests.length, 60);
assert(test);
assert.equal(test.answers.filter(q => q.answer).length, 20);
assert.equal(test.answers[0].answer, 'Grayson');
assert.equal(test.answers[30].answer, 'fishing');
assert(test.answers.slice(10, 30).every(q => !q.answer));
assert.equal(test.groups.length, 0);
context.test = test;
for (let part = 1; part <= 4; part++) {
  const html = vm.runInContext(`renderCambridge20Csv(test, ${part})`, context);
  if (part === 1 || part === 4) {
    assert.equal((html.match(/class="flow-line"/g) || []).length, 10);
  } else {
    assert.match(html, /cannot be graded/);
  }
}
for (const path of ['listening.html', 'src/listening.template.html']) {
  const html = readFileSync(path, 'utf8');
  assert.match(html, /src="src\/listening-csv.js"/);
  assert.match(html, /applyCambridge20Csv\(TESTS\)/);
  assert.match(html, /renderCambridge20Csv\(current,part\)/);
  if (path === 'listening.html') {
    for (const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
  }
}
console.log('PASS: CSV practice prompts, answer keys, incomplete Parts, progress separation and page integration.');
