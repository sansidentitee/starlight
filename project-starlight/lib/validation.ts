import type { AppData } from './types';

type RecordValue = Record<string, unknown>;
type Validator = (value: unknown) => boolean;
const maxBytes = 5 * 1024 * 1024;
const maxItems = 25_000;
const text = (value: unknown): value is string => typeof value === 'string';
const requiredText = (value: unknown): value is string => text(value) && value.trim().length > 0;
const id = (value: unknown): value is string => requiredText(value) && value.length <= 256;
const reference = (value: unknown): boolean => text(value) && (value === '' || id(value));
const bool = (value: unknown): boolean => typeof value === 'boolean';
const number = (value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): value is number => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
const integer = (value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): boolean => number(value, min, max) && Number.isInteger(value);
const oneOf = (value: unknown, allowed: readonly string[]): boolean => text(value) && allowed.includes(value);

function record(value: unknown): value is RecordValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function shape(value: unknown, required: Record<string, Validator>, optional: Record<string, Validator> = {}): value is RecordValue {
  if (!record(value)) return false;
  // Closed versioned shapes also prevent unknown cyclic values, accessors, and
  // prototype keys from entering the persisted JSON workspace.
  for (const key of Object.keys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !('value' in descriptor)) return false;
    if (!Object.hasOwn(required, key) && !Object.hasOwn(optional, key)) return false;
  }
  for (const [key, validate] of Object.entries(required)) {
    if (!Object.hasOwn(value, key) || !validate(value[key])) return false;
  }
  for (const [key, validate] of Object.entries(optional)) {
    if (Object.hasOwn(value, key) && value[key] !== undefined && !validate(value[key])) return false;
  }
  return true;
}

function list(value: unknown, validate: Validator, uniqueIds = false): value is unknown[] {
  if (!Array.isArray(value) || value.length > maxItems) return false;
  const seen = new Set<unknown>();
  // A for loop intentionally rejects sparse arrays as well as malformed rows.
  for (let index = 0; index < value.length; index++) {
    const item = value[index];
    if (!validate(item)) return false;
    if (uniqueIds) {
      if (!record(item) || seen.has(item.id)) return false;
      seen.add(item.id);
    }
  }
  return true;
}

function day(value: unknown, allowEmpty = false): boolean {
  if (!text(value)) return false;
  if (value === '') return allowEmpty;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, date] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12 || date < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return date <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}
const optionalDay = (value: unknown) => day(value, true);
const requiredDay = (value: unknown) => day(value);
const time = (value: unknown) => text(value) && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
function timestamp(value: unknown): boolean {
  return text(value) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    && day(value.slice(0, 10)) && time(value.slice(11, 16)) && Number(value.slice(17, 19)) < 60 && Number.isFinite(Date.parse(value));
}
const checkedItem: Validator = value => shape(value, { id, title: requiredText, done: bool });
const task: Validator = value => shape(value, {
  id, title: requiredText, subjectId: reference,
  quadrant: value => oneOf(value, ['inbox', 'do', 'plan', 'delegate', 'eliminate']),
  done: bool, due: optionalDay, minutes: value => number(value, 5, 720),
  difficulty: value => integer(value, 1, 5), energy: value => oneOf(value, ['low', 'medium', 'high']),
  notes: text, subtasks: value => list(value, checkedItem, true),
  recurrence: value => oneOf(value, ['none', 'daily', 'weekly']),
}, { attachment: text });
const event: Validator = value => shape(value, {
  id, title: requiredText, date: requiredDay, time, minutes: value => number(value, 5, 720), subjectId: reference,
}, { taskId: reference });
const chapter: Validator = value => shape(value, {
  id, title: requiredText, mastery: value => number(value, 0, 100), lastReviewed: optionalDay,
  nextReview: optionalDay, question: text, answer: text,
}, { exercise: text, solution: text, notes: text, errors: text });
const subject: Validator = value => shape(value, {
  id, name: requiredText, color: value => text(value) && /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value),
  icon: requiredText, chapters: value => list(value, chapter, true),
});
const session: Validator = value => shape(value, {
  id, date: value => requiredDay(value) || timestamp(value), minutes: value => number(value, 0.01, 180),
  distractions: value => integer(value), taskId: reference,
  mode: value => oneOf(value, ['Deep Work', 'Pomodoro', 'Break', 'Short Break', 'Long Break', 'Study', 'Reading', 'Memorization', 'Practice', 'Exam Simulation']),
});
const grade: Validator = value => shape(value, {
  id, subjectId: reference, title: requiredText, score: value => number(value),
  outOf: value => number(value, 0.01), coefficient: value => number(value, 0.01), date: requiredDay,
  errors: value => list(value, requiredText),
}, { chapter: text }) && number(value.score) && number(value.outOf) && value.score <= value.outOf;
const goal: Validator = value => shape(value, {
  id, title: requiredText, vision: text, due: optionalDay, milestones: value => list(value, checkedItem, true),
});
const note: Validator = value => shape(value, {
  id, title: requiredText, body: text, subjectId: reference, kind: requiredText, updatedAt: timestamp,
  links: value => list(value, id) && new Set(value).size === value.length,
});
const resource: Validator = value => shape(value, {
  id, title: requiredText, url: text, subjectId: reference, kind: requiredText, starred: bool,
});
const review: Validator = value => shape(value, { id, date: requiredDay, wins: text, challenges: text, nextWeek: text });
const settings: Validator = value => shape(value, {
  // An empty display name is supported by the Personal space editor and shell.
  name: value => text(value) && value.length <= 40,
  appearance: value => oneOf(value, ['warm', 'pure', 'light']),
  accent: value => oneOf(value, ['peach', 'rose', 'amber']),
  glass: value => number(value, 30, 95), blur: value => number(value, 0, 40),
  motion: bool, neumorphism: bool, focusMinutes: value => number(value, 1, 180),
  weeklyTarget: value => number(value, 1, 80),
});

/** Validates both imported files and cloud data before any UI reads nested fields.
 * References may be empty or orphaned: deleting a task must preserve its history.
 * URL fields remain strings; safeUrl restricts schemes at every rendering point.
 */
export function isAppData(value: unknown): value is AppData {
  try {
    if (!shape(value, {
      version: value => value === 1, tasks: value => list(value, task, true),
      events: value => list(value, event, true), subjects: value => list(value, subject, true),
      sessions: value => list(value, session, true), grades: value => list(value, grade, true),
      goals: value => list(value, goal, true), notes: value => list(value, note, true),
      resources: value => list(value, resource, true), reviews: value => list(value, review, true), settings,
    })) return false;
    // Chapter IDs feed a single global review queue, so they must also be unique
    // across subjects, not only within each subject's chapter collection.
    const chapterIds = (value.subjects as { chapters: { id: string }[] }[]).flatMap(subject => subject.chapters.map(chapter => chapter.id));
    if (new Set(chapterIds).size !== chapterIds.length) return false;
    const serialized = JSON.stringify(value);
    return new TextEncoder().encode(serialized).byteLength <= maxBytes;
  } catch {
    return false;
  }
}
