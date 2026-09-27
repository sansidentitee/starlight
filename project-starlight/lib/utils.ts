import type { Grade, Chapter } from './types';
export const uid = () => crypto.randomUUID();
export function localDate(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export function dateOffset(days: number, base = new Date()) { const d = new Date(base); d.setDate(d.getDate()+days); return localDate(d); }
export const duration = (minutes: number) => { const rounded=Math.max(0,Math.round(minutes)); return `${Math.floor(rounded / 60)}h ${String(rounded % 60).padStart(2,'0')}m`; };
export function average(grades: Grade[]) { const weight = grades.reduce((a,g)=>a+g.coefficient,0); return weight ? grades.reduce((a,g)=>a+(g.score / g.outOf)*20*g.coefficient,0)/weight : 0; }
export function reviewChapter(chapter: Chapter, rating: number, today = new Date()): Chapter { const index=Number.isFinite(rating)?Math.max(0,Math.min(3,Math.round(rating))):0; const interval = [1,2,4,8][index]; return {...chapter, mastery: Math.max(0,Math.min(100,chapter.mastery+[-12,2,9,16][index])), lastReviewed:localDate(today), nextReview:dateOffset(interval,today)}; }
export function safeUrl(value: string) { try { const url = new URL(value); return ['http:','https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } }
