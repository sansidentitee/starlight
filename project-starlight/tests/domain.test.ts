import test from 'node:test';
import assert from 'node:assert/strict';
import { average, dateOffset, localDate, reviewChapter, safeUrl } from '../lib/utils';
import type { Chapter, Grade } from '../lib/types';

const chapter: Chapter = {
  id: 'chapter-1', title: 'Integrals', mastery: 50,
  lastReviewed: '', nextReview: '2026-01-01',
  question: 'What is integration?', answer: 'Accumulation.',
};
const grade = (score: number, outOf: number, coefficient: number): Grade => ({
  id: `${score}-${outOf}`, subjectId: 'math', title: 'Exam',
  score, outOf, coefficient, date: '2026-01-01', errors: [],
});

test('weighted average normalizes different grading scales to /20', () => {
  const result = average([grade(16, 20, 2), grade(75, 100, 1)]);
  assert.ok(Math.abs(result - 47 / 3) < 1e-10);
});

test('no grades or no contributing coefficients returns zero', () => {
  assert.equal(average([]), 0);
  assert.equal(average([grade(18, 20, 0)]), 0);
});

test('zero scores count toward the weighted average', () => {
  assert.equal(average([grade(0, 20, 1), grade(20, 20, 1)]), 10);
});

test('date offsets handle leap days, year boundaries and past dates', () => {
  assert.equal(dateOffset(1, new Date(2024, 1, 28, 12)), '2024-02-29');
  assert.equal(dateOffset(2, new Date(2024, 1, 28, 12)), '2024-03-01');
  assert.equal(dateOffset(1, new Date(2026, 11, 31, 12)), '2027-01-01');
  assert.equal(dateOffset(-1, new Date(2026, 0, 1, 12)), '2025-12-31');
});

test('date offsets preserve the input and use local calendar dates', () => {
  const base = new Date(2026, 2, 28, 23, 30);
  const original = base.getTime();
  assert.equal(dateOffset(2, base), '2026-03-30');
  assert.equal(base.getTime(), original);
  assert.equal(localDate(new Date(2026, 0, 4, 0, 1)), '2026-01-04');
});

test('failed review schedules tomorrow and never lowers mastery below zero', () => {
  const result = reviewChapter({ ...chapter, mastery: 5 }, 0, new Date(2026, 11, 31, 12));
  assert.equal(result.mastery, 0);
  assert.equal(result.lastReviewed, '2026-12-31');
  assert.equal(result.nextReview, '2027-01-01');
});

test('easy review extends spacing and caps mastery at 100', () => {
  const result = reviewChapter({ ...chapter, mastery: 95 }, 3, new Date(2024, 1, 25, 12));
  assert.equal(result.mastery, 100);
  assert.equal(result.nextReview, '2024-03-04');
});

test('review does not mutate original learning material', () => {
  const result = reviewChapter(chapter, 2, new Date(2026, 0, 1, 12));
  assert.notEqual(result, chapter);
  assert.equal(chapter.mastery, 50);
  assert.equal(chapter.lastReviewed, '');
  assert.equal(result.question, chapter.question);
  assert.equal(result.answer, chapter.answer);
});

test('out-of-range review ratings are bounded consistently', () => {
  const today = new Date(2026, 0, 1, 12);
  assert.deepEqual(reviewChapter(chapter, -10, today), reviewChapter(chapter, 0, today));
  assert.deepEqual(reviewChapter(chapter, 10, today), reviewChapter(chapter, 3, today));
});

test('resources accept and normalize public web protocols', () => {
  assert.equal(safeUrl('https://example.com'), 'https://example.com/');
  assert.equal(safeUrl('http://example.com/a?q=study#notes'), 'http://example.com/a?q=study#notes');
});

test('resource links reject executable protocols and incomplete addresses', () => {
  for (const url of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,<script>alert(1)</script>', 'file:///tmp/private.txt', 'vbscript:msgbox(1)', '/relative', 'example.com', '']) {
    assert.equal(safeUrl(url), '', `Rejected unsafe or incomplete resource: ${url}`);
  }
});
