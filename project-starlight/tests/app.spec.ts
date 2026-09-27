import { test, expect, type Page } from '@playwright/test';
import { createDemoData } from '../lib/demo';
import type { AppData } from '../lib/types';

const storageKey = 'starlight-demo-v1';

async function seed(page: Page, change?: (data: AppData) => void) {
  const data = createDemoData();
  change?.(data);
  await page.addInitScript(({ key, value }) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(value));
  }, { key: storageKey, value: data });
  return data;
}

async function readSaved(page: Page): Promise<AppData> {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) || '{}'), storageKey);
}

async function visit(page: Page, route: string) {
  const response = await page.goto(route);
  expect(response?.status()).toBeLessThan(400);
  // A fresh Next.js development server compiles the client bundle on first use.
  await expect(page.locator('main h1')).toBeVisible({ timeout: 60_000 });
}

test('all thirteen spaces load without client exceptions; Command Center opens a task', async ({ page }) => {
  test.setTimeout(180_000);
  await seed(page);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await visit(page, '/dashboard');
  for (const [label, route] of [['Tasks', 'tasks'], ['Focus', 'focus'], ['Calendar', 'calendar'], ['Subjects', 'subjects'], ['Revision', 'revision'], ['Analytics', 'analytics'], ['Grades', 'grades'], ['Goals', 'goals'], ['Notes', 'notes'], ['Library', 'library'], ['Weekly Review', 'strategy'], ['Settings', 'settings']]) {
    await page.getByRole('complementary', { name: 'Main navigation' }).getByRole('link', { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${route}$`));
    await expect(page.locator('main h1')).toBeVisible();
  }
  await page.keyboard.press('Control+k');
  const command = page.getByRole('dialog', { name: 'Command Center' });
  await expect(command).toBeVisible();
  await command.getByRole('textbox', { name: 'Search pages, tasks, notes, and resources' }).fill('Prepare mathematics exam');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/tasks\?task=t7/);
  await expect(page.getByRole('dialog').getByLabel('Task', { exact: true })).toHaveValue('Prepare mathematics exam');
  expect(errors).toEqual([]);
});

test('task creation, editing, subtasks and local persistence survive a reload', async ({ page }) => {
  await seed(page);
  await visit(page, '/tasks?new=1');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Task', { exact: true }).fill('Explore polar coordinates');
  await dialog.getByRole('combobox', { name: 'Subject', exact: true }).selectOption('math');
  await dialog.getByLabel('Estimated minutes').fill('45');
  await dialog.getByRole('textbox', { name: 'Notes', exact: true }).fill('Make a sketch and explain the geometric intuition.');
  await dialog.getByRole('textbox', { name: 'New subtask' }).fill('Draw the unit circle');
  await dialog.getByRole('button', { name: 'Add', exact: true }).click();
  await dialog.getByRole('button', { name: 'Save task', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Explore polar coordinates', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Explore polar coordinates', exact: true }).click();
  await dialog.getByLabel('Task', { exact: true }).fill('Explain polar coordinates');
  await dialog.getByLabel('Complete Draw the unit circle', { exact: true }).check();
  await dialog.getByRole('combobox', { name: 'Priority', exact: true }).selectOption('plan');
  await dialog.getByRole('button', { name: 'Save task', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Schedule task column' }).getByRole('button', { name: 'Explain polar coordinates', exact: true })).toBeVisible();
  await expect.poll(async () => (await readSaved(page)).tasks.find(task => task.title === 'Explain polar coordinates')?.subtasks[0]?.done).toBe(true);
  // Remove the one-time create action from the URL before reloading.
  await page.evaluate(() => history.replaceState(null, '', '/tasks'));
  await page.reload();
  await page.getByRole('button', { name: 'Explain polar coordinates', exact: true }).click();
  await expect(dialog.getByLabel('Estimated minutes')).toHaveValue('45');
  await expect(dialog.getByRole('textbox', { name: 'Notes', exact: true })).toHaveValue('Make a sketch and explain the geometric intuition.');
  await expect(dialog.getByLabel('Complete Draw the unit circle', { exact: true })).toBeChecked();
});

test('Eisenhower supports pointer dragging and an accessible move menu', async ({ page }) => {
  await seed(page);
  await visit(page, '/tasks');
  const source = page.getByRole('button', { name: 'Drag Prepare mathematics exam', exact: true });
  const destination = page.getByRole('region', { name: 'Do first task column' });
  await source.scrollIntoViewIfNeeded();
  const from = await source.boundingBox();
  const to = await destination.boundingBox();
  expect(from).not.toBeNull();
  expect(to).not.toBeNull();
  await page.mouse.move(from!.x + from!.width / 2, from!.y + from!.height / 2);
  await page.mouse.down();
  await page.mouse.move(from!.x + 15, from!.y + 10, { steps: 3 });
  await page.mouse.move(to!.x + to!.width / 2, to!.y + to!.height / 2, { steps: 20 });
  await page.mouse.up();
  await expect(destination.getByRole('button', { name: 'Prepare mathematics exam', exact: true })).toBeVisible();
  await destination.getByRole('combobox', { name: 'Move Prepare mathematics exam', exact: true }).selectOption('plan');
  await expect(page.getByRole('region', { name: 'Schedule task column' }).getByRole('button', { name: 'Prepare mathematics exam', exact: true })).toBeVisible();
  await expect.poll(async () => (await readSaved(page)).tasks.find(task => task.id === 't7')?.quadrant).toBe('plan');
});

test('calendar links honor their date and a task can be scheduled and rescheduled', async ({ page }) => {
  await seed(page);
  await visit(page, '/calendar?date=2027-03-18');
  await expect(page.getByRole('heading', { name: 'March 2027', exact: true })).toBeVisible();
  const task = page.locator('.prod-schedule-task').filter({ hasText: 'Prepare mathematics exam' });
  await task.getByRole('button', { name: 'Schedule', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Linked task')).toHaveValue('t7');
  await dialog.getByLabel('Date', { exact: true }).fill('2027-03-18');
  await dialog.getByLabel('Start time').fill('14:30');
  await dialog.getByLabel('Duration in minutes').fill('75');
  await dialog.getByRole('button', { name: 'Save block', exact: true }).click();
  const block = page.locator('.prod-calendar-event').filter({ hasText: 'Prepare mathematics exam' });
  await expect(block).toContainText('14:30');
  await expect(block).toContainText('75m');
  await block.click();
  await dialog.getByLabel('Start time').fill('16:00');
  await dialog.getByRole('button', { name: 'Save block', exact: true }).click();
  await expect(block).toContainText('16:00');
  await expect.poll(async () => (await readSaved(page)).events.find(event => event.taskId === 't7')?.time).toBe('16:00');
});

test('focus continues across navigation and saves exactly one session', async ({ page }) => {
  const initial = await seed(page);
  await visit(page, '/focus?task=t7');
  await expect(page.getByLabel('A little intention')).toHaveValue('t7');
  await page.getByLabel('Focus activity', { exact: true }).selectOption('Reading');
  await page.getByRole('button', { name: '15m', exact: true }).click();
  await expect(page.getByRole('timer')).toHaveText('15:00');
  await page.getByRole('button', { name: 'Begin session', exact: true }).click();
  await expect(page.getByRole('timer')).not.toHaveText('15:00');
  await page.getByRole('button', { name: 'Log a distraction', exact: true }).click();
  await page.getByRole('link', { name: 'Tasks', exact: true }).click();
  await expect(page.getByRole('link', { name: /Focus in progress/ })).toBeVisible();
  await page.getByRole('link', { name: /Focus in progress/ }).click();
  await expect(page.getByRole('button', { name: 'Pause session', exact: true })).toBeVisible();
  await expect(page.getByRole('timer')).not.toHaveText('15:00');
  await page.getByRole('button', { name: 'Finish and save focus session', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Session recorded');
  await expect.poll(async () => (await readSaved(page)).sessions.length).toBe(initial.sessions.length + 1);
  const session = (await readSaved(page)).sessions[0];
  expect(session.taskId).toBe('t7');
  expect(session.mode).toBe('Reading');
  expect(session.distractions).toBe(1);
  expect(session.minutes).toBeGreaterThan(0);
  await expect(page.getByRole('region', { name: 'Last session summary' })).toContainText('1 distraction noticed');
  // A finished session cannot accidentally be saved twice.
  await expect(page.getByRole('button', { name: 'Finish and save focus session', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Begin new session', exact: true })).toBeVisible();
  expect((await readSaved(page)).sessions.length).toBe(initial.sessions.length + 1);
});

test('notes save content and remain searchable after reload', async ({ page }) => {
  await seed(page);
  await visit(page, '/notes');
  await page.getByRole('button', { name: 'New note', exact: true }).click();
  await page.getByRole('textbox', { name: 'Note title', exact: true }).fill('A geometric intuition');
  await page.getByRole('textbox', { name: 'Note body', exact: true }).fill('The amber spiral connects rotation to scale. [[Complex numbers, simply.]]');
  await page.getByRole('button', { name: 'Save note', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Note saved');
  await expect.poll(async () => (await readSaved(page)).notes.find(note => note.title === 'A geometric intuition')?.links).toContain('n1');
  await page.reload();
  await page.getByRole('textbox', { name: 'Search notes', exact: true }).fill('amber spiral');
  await expect(page.locator('.learn-note-item')).toHaveCount(1);
  await page.locator('.learn-note-item').click();
  await expect(page.getByRole('textbox', { name: 'Note title', exact: true })).toHaveValue('A geometric intuition');
  await expect(page.getByRole('textbox', { name: 'Note body', exact: true })).toHaveValue(/amber spiral/);
});

test('grades normalize different denominators and weight assessments', async ({ page }) => {
  await seed(page, data => { data.grades = []; });
  await visit(page, '/grades');
  for (const grade of [{ title: 'First checkpoint', score: '16', outOf: '20', weight: '1' }, { title: 'Second checkpoint', score: '9', outOf: '10', weight: '3' }]) {
    await page.getByRole('button', { name: 'Add assessment', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Assessment title').fill(grade.title);
    await dialog.getByLabel('Out of', { exact: true }).fill(grade.outOf);
    await dialog.getByLabel('Score', { exact: true }).fill(grade.score);
    await dialog.getByLabel('Coefficient', { exact: true }).fill(grade.weight);
    await dialog.getByRole('button', { name: 'Save assessment', exact: true }).click();
    await expect(dialog).not.toBeVisible();
  }
  await expect(page.locator('.learn-grade-average')).toContainText('17.5');
  await page.getByRole('button', { name: 'Create review task for Second checkpoint', exact: true }).click();
  await page.getByRole('link', { name: 'Tasks', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Inbox task column' }).getByRole('button', { name: 'Review: Second checkpoint', exact: true })).toBeVisible();
});

test('mobile navigation reaches every page without document overflow', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await visit(page, '/');
  for (const [label, route] of [['Tasks', 'tasks'], ['Calendar', 'calendar'], ['Focus', 'focus'], ['Subjects', 'subjects'], ['Revision', 'revision'], ['Notes', 'notes'], ['Library', 'library'], ['Analytics', 'analytics'], ['Grades', 'grades'], ['Goals', 'goals'], ['Weekly Review', 'strategy'], ['Settings', 'settings'], ['Dashboard', 'dashboard']]) {
    await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
    await page.getByRole('complementary', { name: 'Main navigation' }).getByRole('link', { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${route}$`));
    await expect(page.locator('main h1')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `${label} creates horizontal document overflow`).toBeLessThanOrEqual(2);
  }
});
