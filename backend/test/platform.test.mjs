import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const directory = mkdtempSync(path.join(tmpdir(), 'algosphere-test-'));
process.env.DATABASE_PATH = path.join(directory, 'test.db');
const { seedDatabase } = await import('../dist/seed.js');
const { db, queryOne, execute } = await import('../dist/models/db.js');
const { catalog } = await import('../dist/catalog/index.js');
const { judgeSubmission } = await import('../dist/judges/judgeService.js');
const { default: app } = await import('../dist/index.js');
let server, base, student, admin;

async function request(route, token, body, method = body ? 'POST' : 'GET') {
  const response = await fetch(base + route, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, data: await response.json() };
}

before(async () => {
  await seedDatabase();
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;

  // Register dynamic student account for testing
  const studentReg = await request('/auth/register', null, {
    username: 'test_student',
    email: 'test_student@test.local',
    password: 'password123',
  });
  student = studentReg.data;

  // Register dynamic admin account for testing
  const adminReg = await request('/auth/register', null, {
    username: 'test_admin',
    email: 'test_admin@test.local',
    password: 'password123',
  });
  // Promote test_admin to admin role in database
  execute("UPDATE users SET role = 'admin' WHERE id = ?", [adminReg.data.user.id]);
  // Login as admin to get fresh token with admin role
  admin = (await request('/auth/login', null, { username: 'test_admin', password: 'password123' })).data;
});

after(async () => {
  await new Promise(resolve => server.close(resolve));
  db.close();
  rmSync(directory, { recursive: true, force: true });
});

test('144 questions, all sample anchors and reference solutions pass the real judge', async () => {
  assert.equal(catalog.length, 144);
  assert.equal(catalog.filter(p => p.source === 'Level 1').length, 35);
  assert.equal(catalog.filter(p => p.source === 'Level 2').length, 57);
  assert.equal(catalog.filter(p => p.source === 'Level 3').length, 52);
  for (const p of catalog) {
    assert.ok(p.tests.filter(t => t.is_hidden).length >= (p.source === 'Level 1' ? 4 : 5), p.slug);
    assert.ok(p.tests.some(t => t.expected_output !== p.examples[0].output), `${p.slug} must reject sample hardcoding`);
    const result = await judgeSubmission('python', p.reference_solution, p.tests.map((t, i) => ({ input: t.input, expectedOutput: t.expected_output, isHidden: t.is_hidden, testCaseNumber: i + 1 })));
    assert.equal(result.verdict, 'Accepted', `${p.slug}: ${JSON.stringify(result.testCaseResults.filter(t => t.status !== 'PASS'))}`);
  }
});

test('dynamic login, rejection, role authorization, and protected execution', async () => {
  assert.equal(student.user.username, 'test_student');
  assert.equal(student.user.role, 'student');
  assert.equal(admin.user.role, 'admin');
  assert.equal((await request('/auth/login', null, { username: 'test_admin', password: 'wrong' })).status, 401);
  assert.equal((await request('/auth/login', null, { username: {}, password: [] })).status, 400);
  assert.equal((await request('/admin/problems', student.token)).status, 403);
  assert.equal((await request('/admin/problems', admin.token)).status, 200);
  assert.equal((await request('/problems/fibonacci-series/submit', null, { language: 'python', code: 'print(1)' })).status, 401);
  assert.equal((await request('/submissions')).status, 401);
  assert.equal((await request('/problems/fibonacci-series/run', student.token, { language: 'ruby', code: 'print(1)' })).status, 400);
  assert.equal((await request('/problems/fibonacci-series/run', student.token, { language: 'python', code: '   ' })).status, 400);
});

test('no hidden values or runtime diagnostics leak through submission responses or history', async () => {
  const p = catalog[0];
  const details = await request('/problems/' + p.slug, student.token);
  assert.equal(details.data.problem.reference_solution, undefined);
  assert.equal(details.data.problem.starter_python, '');
  assert.equal(details.data.problem.sampleTestCases.length, 1);
  for (const code of ['import sys;print(sys.stdin.read())', 'import sys;raise Exception(sys.stdin.read())']) {
    const response = await request(`/problems/${p.slug}/submit`, student.token, { language: 'python', code });
    assert.equal(response.status, 200);
    for (const r of response.data.testCaseResults.filter(t => t.isHidden)) {
      assert.equal(r.inputPreview, '[Hidden Test Case]');
      assert.equal(r.expectedOutput, '[Hidden]');
      assert.equal(r.actualOutput, '[Hidden]');
      assert.ok(!r.errorMessage || r.errorMessage === 'Hidden test execution failed');
    }
    const history = await request(`/submissions/${response.data.submissionId}`, student.token);
    for (const r of history.data.submission.results.filter(t => t.is_hidden)) {
      assert.equal(r.input_preview, '[Hidden]');
      assert.equal(r.expected_output, '[Hidden]');
      assert.equal(r.actual_output, '[Hidden]');
    }
    const uniqueUsername = 'other' + response.data.submissionId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
    const other = (await request('/auth/register', null, { username: uniqueUsername, email: response.data.submissionId + '@test.local', password: 'password123' })).data;
    assert.equal((await request(`/submissions/${response.data.submissionId}`, other.token)).status, 403);
  }
});

test('sample run, custom input, wrong answer, and accepted progress', async () => {
  const p = catalog[0];
  const run = await request(`/problems/${p.slug}/run`, student.token, { language: 'python', code: p.reference_solution });
  assert.equal(run.data.result.totalCount, 1);
  assert.equal(run.data.result.verdict, 'Accepted');
  const custom = await request(`/problems/${p.slug}/run`, student.token, { language: 'python', code: 'print(input())', customInput: 'hello' });
  assert.equal(custom.data.result.verdict, 'Accepted');
  assert.equal(custom.data.result.testCaseResults[0].actualOutput, 'hello');
  const wrong = await request(`/problems/${p.slug}/submit`, student.token, { language: 'python', code: `print(${JSON.stringify(p.examples[0].output)})` });
  assert.equal(wrong.data.verdict, 'Wrong Answer');
  const right = await request(`/problems/${p.slug}/submit`, student.token, { language: 'python', code: p.reference_solution });
  assert.equal(right.data.verdict, 'Accepted');
  assert.equal((await request('/problems/' + p.slug, student.token)).data.problem.userStatus, 'solved');
});

test('reseed preserves problem IDs, progress and submissions, and maintains platform integrity', async () => {
  const before = queryOne('SELECT id FROM problems WHERE slug=?', ['reverse-the-digits']);
  const count = queryOne('SELECT COUNT(*) AS count FROM submissions').count;
  // Reproduce the old #12 reverse problem before upgrading the catalog.
  execute('UPDATE problems SET problem_number=1000 WHERE problem_number=12');
  execute('UPDATE problems SET problem_number=12 WHERE id=?', [before.id]);
  await seedDatabase();
  assert.equal(queryOne('SELECT id FROM problems WHERE slug=?', ['reverse-the-digits']).id, before.id);
  assert.equal(queryOne('SELECT problem_number FROM problems WHERE id=?', [before.id]).problem_number, 84);
  assert.equal(queryOne('SELECT COUNT(*) AS count FROM problems').count, 144);
  assert.equal(queryOne('SELECT COUNT(*) AS count FROM submissions').count, count);
  assert.equal(queryOne('SELECT COUNT(*) AS count FROM test_cases').count, 951);
  assert.equal((await request('/auth/login', null, { username: 'test_admin', password: 'password123' })).status, 200);
});

test('C and C++ compile and execute; Python syntax and timeout verdicts work', async () => {
  const tests = [{ input: '', expectedOutput: '42', isHidden: false, testCaseNumber: 1 }];
  for (const [lang, code] of [['c', '#include <stdio.h>\nint main(){printf("42");return 0;}'], ['cpp', '#include <iostream>\nint main(){std::cout<<42;}']]) {
    assert.equal((await judgeSubmission(lang, code, tests)).verdict, 'Accepted');
  }
  assert.equal((await judgeSubmission('python', 'if :', tests)).verdict, 'Compilation Error');
  assert.equal((await judgeSubmission('python', 'while True: pass', tests, { timeLimitMs: 100 })).verdict, 'Time Limit Exceeded');
});

test('admin regeneration uses curated array inputs and preserves hidden visibility', async () => {
  const p = catalog.find(p => p.source === 'Level 3' && p.source_number === 41);
  const id = queryOne('SELECT id FROM problems WHERE slug=?', [p.slug]).id;
  const result = await request(`/admin/problems/${id}/generate-tests`, admin.token, {}, 'POST');
  assert.equal(result.status, 200);
  assert.deepEqual(result.data.testCases.map(t => t.input), p.tests.map(t => t.input));
  assert.equal(result.data.testCases.filter(t => t.isHidden).length, p.tests.length - 1);
  assert.deepEqual(result.data.testCases.map(t => t.expectedOutput), p.tests.map(t => t.expected_output));
});

test('level metadata reflects the PDF catalog and dashboard groups by source level', async () => {
  const { data } = await request('/problems', student.token);
  assert.equal(data.problems.filter(p => p.level === 'Level 2').length, 57);
  assert.equal(data.problems.filter(p => p.level === 'Level 3').length, 52);
  const firstArray = data.problems.find(p => p.level === 'Level 3');
  assert.equal(firstArray.level_question_number, 1);
  const details = await request('/problems/' + firstArray.slug, student.token);
  assert.equal(details.data.problem.level, 'Level 3');
  const progress = await request('/user/progress', student.token);
  assert.equal(progress.data.stats.levels['Level 2'].total, 57);
  assert.equal(progress.data.stats.levels['Level 3'].total, 52);
});

test('global leaderboard scores unique published solves, shares tied ranks, paginates, and excludes private fields', async () => {
  await request(`/problems/${catalog[0].slug}/submit`, student.token, { language: 'python', code: catalog[0].reference_solution });
  const ids = ['leaderboard-alice', 'leaderboard-bob', 'leaderboard-carol'];
  const l2 = queryOne('SELECT id FROM problems WHERE slug=?', [catalog.find(p => p.source === 'Level 2').slug]).id;
  const l3 = queryOne('SELECT id FROM problems WHERE slug=?', [catalog.find(p => p.source === 'Level 3').slug]).id;
  const hidden = queryOne('SELECT id FROM problems WHERE slug=?', [catalog.find(p => p.source === 'Level 3' && p.source_number === 2).slug]).id;
  try {
    for (const id of ids) execute('INSERT INTO users (id, username, email, role) VALUES (?, ?, ?, ?)', [id, id, id + '@test.local', 'student']);
    for (const id of ids.slice(0, 2)) for (const problem of [l2, l3]) execute("INSERT INTO user_progress (user_id, problem_id, status) VALUES (?, ?, 'solved')", [id, problem]);
    execute("INSERT INTO user_progress (user_id, problem_id, status) VALUES (?, ?, 'solved')", [ids[2], l2]);
    execute("INSERT INTO user_progress (user_id, problem_id, status) VALUES (?, ?, 'attempted')", [ids[2], l3]);
    execute('UPDATE problems SET is_published=0 WHERE id=?', [hidden]);
    execute("INSERT INTO user_progress (user_id, problem_id, status) VALUES (?, ?, 'solved')", [ids[0], hidden]);
    const result = await request('/user/leaderboard', student.token);
    assert.equal(result.status, 200);
    const alice = result.data.entries.find(e => e.user_id === ids[0]);
    const bob = result.data.entries.find(e => e.user_id === ids[1]);
    const carol = result.data.entries.find(e => e.user_id === ids[2]);
    assert.equal(alice.points, 30);
    assert.equal(alice.solved, 2);
    assert.equal(alice.level2_solved, 1);
    assert.equal(alice.level3_solved, 1);
    assert.equal(alice.rank, bob.rank);
    assert.equal(carol.points, 10);
    assert.ok(carol.rank > alice.rank);
    assert.equal(result.data.currentUser.user_id, student.user.id);
    assert.equal(result.data.entries.some(e => e.user_id === admin.user.id), false);
    for (const entry of result.data.entries) {
      assert.equal(entry.email, undefined);
      assert.equal(entry.password_hash, undefined);
      assert.equal(entry.code, undefined);
    }
    const publicResult = await request('/user/leaderboard');
    assert.equal(publicResult.status, 200);
    assert.equal(publicResult.data.currentUser, null);
    const paged = await request('/user/leaderboard?limit=1&offset=1');
    assert.deepEqual(paged.data.entries, publicResult.data.entries.slice(1, 2));
    for (const query of ['limit=0', 'limit=101', 'limit=oops', 'offset=-1', 'offset=1.5']) assert.equal((await request('/user/leaderboard?' + query)).status, 400);
    // Re-submitting an already accepted problem cannot add points.
    const scoreBefore = result.data.currentUser.points;
    const p = catalog[0];
    await request(`/problems/${p.slug}/submit`, student.token, { language: 'python', code: p.reference_solution });
    assert.equal((await request('/user/leaderboard', student.token)).data.currentUser.points, scoreBefore);
  } finally {
    execute('UPDATE problems SET is_published=1 WHERE id=?', [hidden]);
    for (const id of ids) execute('DELETE FROM users WHERE id=?', [id]);
  }
});
