import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoData } from '../lib/demo';
import { isAppData } from '../lib/validation';
import type { AppData } from '../lib/types';

function rejects(change: (data: AppData) => void) {
  const data = createDemoData();
  change(data);
  assert.equal(isAppData(data), false);
}

test('accepts the generated seed and its exported JSON round trip', () => {
  const seed = createDemoData();
  assert.equal(isAppData(seed), true);
  assert.equal(isAppData(JSON.parse(JSON.stringify(seed))), true);
});

test('keeps every supported focus mode valid after saving and reloading', () => {
  const modes = ['Deep Work', 'Pomodoro', 'Break', 'Short Break', 'Long Break', 'Study', 'Reading', 'Memorization', 'Practice', 'Exam Simulation'];
  for (const mode of modes) {
    const data = createDemoData();
    data.sessions[0].mode = mode;
    assert.equal(isAppData(JSON.parse(JSON.stringify(data))), true, `${mode} survives a backup round trip`);
  }
  rejects(data => { data.sessions[0].mode = 'Unknown mode'; });
});

test('accepts legitimate edited content, decimal results, optional fields and short focus sessions', () => {
  const data = createDemoData();
  data.tasks[0].due = '';
  data.tasks[0].attachment = 'https://example.com/reference';
  Object.assign(data.subjects[0].chapters[0], { question: '', answer: '', nextReview: '', lastReviewed: '', notes: '', errors: '', exercise: '', solution: '' });
  data.subjects[0].color = '#AbC';
  data.grades[0].score = 7.25; data.grades[0].outOf = 10; data.grades[0].coefficient = 0.5;
  data.sessions[0].minutes = 0.02;
  data.sessions[0].taskId = 'a-deleted-task';
  data.notes[0].kind = 'My own type';
  data.settings.name = '';
  data.events[0].taskId = undefined;
  assert.equal(isAppData(data), true);
});

test('requires every collection and correctly shaped nested rows', () => {
  for (const value of [null, undefined, false, [], {}, { version: 1 }]) assert.equal(isAppData(value), false);
  for (const key of ['tasks', 'events', 'subjects', 'sessions', 'grades', 'goals', 'notes', 'resources', 'reviews'] as const) {
    rejects(data => { (data as unknown as Record<string, unknown>)[key] = null; });
    rejects(data => { (data as unknown as Record<string, unknown>)[key] = [null]; });
  }
  rejects(data => { data.tasks[0].subtasks = null as never; });
  rejects(data => { data.subjects[0].chapters = [{}] as never; });
  rejects(data => { data.goals[0].milestones[0].done = 'yes' as never; });
  rejects(data => { data.notes[0].links = [25] as never; });
  rejects(data => { data.grades[0].errors = 'Incorrect type' as never; });
  rejects(data => { data.resources[0].url = { toString: () => 'https://example.com' } as never; });
});

test('rejects duplicate identities including nested rows and the global chapter queue', () => {
  rejects(data => { data.tasks.push({ ...data.tasks[0] }); });
  rejects(data => { data.subjects[0].chapters.push({ ...data.subjects[0].chapters[0] }); });
  rejects(data => { data.subjects[1].chapters.push({ ...data.subjects[0].chapters[0] }); });
  rejects(data => { data.goals[0].milestones.push({ ...data.goals[0].milestones[0] }); });
  rejects(data => { data.notes[0].links.push(data.notes[0].links[0]); });
});

test('rejects non-finite and out-of-range numbers before they reach charts or timers', () => {
  for (const value of [NaN, Infinity, -Infinity, -1, 721]) rejects(data => { data.tasks[0].minutes = value; });
  rejects(data => { data.subjects[0].chapters[0].mastery = 101; });
  rejects(data => { data.grades[0].outOf = 0; });
  rejects(data => { data.grades[0].score = 21; });
  rejects(data => { data.grades[0].coefficient = -1; });
  rejects(data => { data.sessions[0].minutes = -1; });
  rejects(data => { data.sessions[0].distractions = 1.5; });
  rejects(data => { data.settings.weeklyTarget = 0; });
  rejects(data => { data.settings.glass = 150; });
  rejects(data => { data.settings.blur = 100; });
  rejects(data => { data.settings.focusMinutes = 181; });
});

test('checks real calendar dates, leap years, clock times and note timestamps', () => {
  for (const value of ['', '2026-02-29', '2026-04-31', '2026-13-01', '2026-00-01', '0000-01-01', '2026-1-01', 'tomorrow']) rejects(data => { data.events[0].date = value; });
  for (const value of ['24:00', '09:60', '9:00', '']) rejects(data => { data.events[0].time = value; });
  rejects(data => { data.notes[0].updatedAt = '2026-02-30T10:30:00Z'; });
  rejects(data => { data.notes[0].updatedAt = '2026-09-01T99:30:00Z'; });
  const data = createDemoData(); data.events[0].date = '2024-02-29';
  assert.equal(isAppData(data), true);
});

test('rejects invalid enums, blank identities and missing required content', () => {
  rejects(data => { data.tasks[0].id = ''; });
  rejects(data => { data.tasks[0].title = '   '; });
  rejects(data => { data.tasks[0].quadrant = 'urgent' as never; });
  rejects(data => { data.tasks[0].energy = 'extreme' as never; });
  rejects(data => { data.tasks[0].recurrence = 'monthly' as never; });
  rejects(data => { data.settings.appearance = 'dark' as never; });
  rejects(data => { data.settings.motion = 1 as never; });
  rejects(data => { data.subjects[0].color = 'url(https://example.com)' as never; });
});

test('handles cycles, unexpected keys, accessors, sparse arrays and oversized content safely', () => {
  const cyclic = createDemoData() as AppData & { unexpected?: unknown };
  cyclic.unexpected = cyclic;
  assert.equal(isAppData(cyclic), false);
  const accessor = createDemoData();
  Object.defineProperty(accessor.tasks[0], 'title', { enumerable: true, get() { throw new Error('Must not read accessors'); } });
  assert.equal(isAppData(accessor), false);
  rejects(data => { data.tasks = Array(2); });
  rejects(data => { data.notes[0].body = 'a'.repeat(5 * 1024 * 1024); });
});

test('treats URL-like fields strictly as strings without executing them', () => {
  const data = createDemoData();
  data.resources[0].url = 'javascript:alert(1)';
  data.tasks[0].attachment = 'data:text/html,test';
  // Renderers use safeUrl to disable these links; importing cannot execute them.
  assert.equal(isAppData(data), true);
});
