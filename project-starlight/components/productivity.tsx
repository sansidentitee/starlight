'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { ArrowDown, ArrowRight, Check, ChevronLeft, ChevronRight, Clock3, Coffee, GripVertical, Headphones, ListTodo, Maximize2, Pause, Play, Plus, RotateCcw, Sparkles, Target, Trash2, X, Zap } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useFocus } from '@/lib/focus';
import { Button, Empty, Field, Modal, PageHeading, Panel, Progress } from '@/components/ui';
import type { CalendarEvent, Quadrant, Task } from '@/lib/types';
import { dateOffset, duration, localDate, safeUrl, uid } from '@/lib/utils';
import './productivity.css';

const quadrants: { id: Quadrant; title: string; subtitle: string; tag: string; className: string }[] = [
  { id: 'do', title: 'Do first', subtitle: 'Important & urgent', tag: '01', className: 'prod-peach' },
  { id: 'plan', title: 'Schedule', subtitle: 'Important, less urgent', tag: '02', className: 'prod-lilac' },
  { id: 'delegate', title: 'Delegate', subtitle: 'Urgent, less important', tag: '03', className: 'prod-cream' },
  { id: 'eliminate', title: 'Let go', subtitle: 'Neither urgent nor important', tag: '04', className: 'prod-sage' },
];
const quadrantLabel = (q: Quadrant) => q === 'inbox' ? 'Inbox' : quadrants.find(item => item.id === q)?.title || q;
const freshTask = (): Task => ({ id: uid(), title: '', subjectId: '', quadrant: 'inbox', done: false, due: localDate(), minutes: 30, difficulty: 2, energy: 'medium', notes: '', subtasks: [], recurrence: 'none', attachment: '' });
const dateLabel = (date: string, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) => new Date(`${date}T12:00:00`).toLocaleDateString('en-US', options);

function TaskTile({ task, onEdit, overlay = false }: { task: Task; onEdit: (task: Task) => void; overlay?: boolean }) {
  const { data, update, notify } = useStore();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: overlay ? `${task.id}-overlay` : task.id, disabled: overlay, data: { taskId: task.id } });
  const subject = data.subjects.find(item => item.id === task.subjectId);
  const style: CSSProperties = { transform: transform && !overlay ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined, opacity: isDragging ? .25 : 1 };
  function toggleDone() {
    update(draft => {
      const current = draft.tasks.find(item => item.id === task.id);
      if (!current) return;
      current.done = !current.done;
      if (current.done && current.recurrence !== 'none') {
        const nextDue = dateOffset(current.recurrence === 'daily' ? 1 : 7, new Date(`${current.due || localDate()}T12:00:00`));
        if (!draft.tasks.some(item => item.id !== current.id && item.title === current.title && item.due === nextDue && !item.done)) {
          draft.tasks.push({ ...current, id: uid(), done: false, due: nextDue, subtasks: current.subtasks.map(item => ({ ...item, id: uid(), done: false })) });
        }
      }
    });
    notify(task.done ? 'Task reopened' : task.recurrence === 'none' ? 'A little more space to breathe. Task complete.' : 'Task complete. Your next occurrence is ready.');
  }
  return <article ref={setNodeRef} style={style} className={`prod-task ${task.done ? 'prod-task-done' : ''} ${overlay ? 'prod-task-overlay' : ''}`}>
    <div className="prod-task-top">
      <button type="button" className={`prod-check ${task.done ? 'is-checked' : ''}`} onClick={toggleDone} aria-label={`${task.done ? 'Reopen' : 'Complete'} ${task.title}`}>{task.done && <Check size={12} />}</button>
      <button type="button" className="prod-task-title" onClick={() => onEdit(task)}>{task.title}</button>
      <button type="button" className="prod-drag" {...attributes} {...listeners} aria-label={`Drag ${task.title}`}><GripVertical size={15} /></button>
    </div>
    <div className="prod-task-meta">
      {subject && <span className="prod-subject" style={{ '--subject-color': subject.color } as CSSProperties}><i />{subject.name}</span>}
      <span><Clock3 size={11} /> {task.minutes}m</span>
      {task.subtasks.length > 0 && <span><ListTodo size={11} /> {task.subtasks.filter(item => item.done).length}/{task.subtasks.length}</span>}
    </div>
    <div className="prod-task-bottom"><span className={task.due && task.due < localDate() && !task.done ? 'prod-overdue' : ''}>{task.due ? dateLabel(task.due) : 'No due date'}</span><select aria-label={`Move ${task.title}`} value={task.quadrant} onChange={event => { const quadrant = event.target.value as Quadrant; update(draft => { const current = draft.tasks.find(item => item.id === task.id); if (current) current.quadrant = quadrant; }); notify(`Moved to ${quadrantLabel(quadrant)}`); }}><option value="inbox">Inbox</option>{quadrants.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div>
  </article>;
}

function TaskZone({ id, title, subtitle, tag, className = '', tasks, onEdit, onAdd }: { id: Quadrant; title: string; subtitle: string; tag?: string; className?: string; tasks: Task[]; onEdit: (task: Task) => void; onAdd: (quadrant: Quadrant) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return <section ref={setNodeRef} className={`prod-zone ${className} ${isOver ? 'prod-zone-over' : ''}`} aria-label={`${title} task column`}>
    <header className="prod-zone-header"><div><div className="row"><h3>{title}</h3><span className="prod-count">{tasks.length}</span></div><p>{subtitle}</p></div>{tag ? <span className="prod-zone-number">{tag}</span> : <ListTodo size={17} />}</header>
    <div className="prod-zone-body">{tasks.map(task => <TaskTile key={task.id} task={task} onEdit={onEdit} />)}{!tasks.length && <div className="prod-drop-hint"><ArrowDown size={17} /><span>Room for what matters.<br />Drop a task here.</span></div>}</div>
    <button className="prod-add-task" type="button" onClick={() => onAdd(id)}><Plus size={14} /> Add a task</button>
  </section>;
}

export function TasksPage() {
  const { data, update, notify, ready } = useStore();
  const [editing, setEditing] = useState<Task | null>(null);
  const [newSubtask, setNewSubtask] = useState('');
  const [search, setSearch] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [filterSubject, setFilterSubject] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const queryTask = useRef('');
  const queryNew = useRef(false);
  useEffect(() => { if (ready && !queryNew.current && new URLSearchParams(window.location.search).get('new') === '1') { queryNew.current = true; setEditing(freshTask()); setNewSubtask(''); } });
  useEffect(() => { const id = new URLSearchParams(window.location.search).get('task'); if (!ready || !id || id === queryTask.current) return; const task = data.tasks.find(item => item.id === id); if (task) { queryTask.current = id; setEditing(structuredClone(task)); setNewSubtask(''); } });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 7 } }), useSensor(KeyboardSensor));
  const tasks = data.tasks.filter(task => (showCompleted || !task.done) && (!filterSubject || task.subjectId === filterSubject) && `${task.title} ${task.notes}`.toLowerCase().includes(search.toLowerCase()));
  const selectedTask = data.tasks.find(task => task.id === activeId);
  function openTask(task: Task) { setEditing(structuredClone(task)); setNewSubtask(''); }
  function addTask(quadrant: Quadrant = 'inbox') { setEditing({ ...freshTask(), quadrant }); setNewSubtask(''); }
  function dragStart(event: DragStartEvent) { setActiveId(String(event.active.id)); }
  function dragEnd(event: DragEndEvent) {
    setActiveId(null);
    if (!event.over || !['inbox', 'do', 'plan', 'delegate', 'eliminate'].includes(String(event.over.id))) return;
    const quadrant = String(event.over.id) as Quadrant;
    update(draft => { const task = draft.tasks.find(item => item.id === event.active.id); if (task) task.quadrant = quadrant; });
    notify(`Moved to ${quadrantLabel(quadrant)}`);
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || !editing.title.trim()) return;
    if (editing.attachment && !safeUrl(editing.attachment)) { notify('Please use a valid https:// or http:// attachment URL.'); return; }
    const task = { ...editing, title: editing.title.trim(), notes: editing.notes.trim(), attachment: editing.attachment ? safeUrl(editing.attachment) : '', minutes: Math.max(5, Math.min(720, editing.minutes || 30)) };
    update(draft => { const index = draft.tasks.findIndex(item => item.id === task.id); if (index >= 0) draft.tasks[index] = task; else draft.tasks.unshift(task); });
    setEditing(null); notify('Task saved');
  }
  function deleteTask() { if (!editing) return; update(draft => { draft.tasks = draft.tasks.filter(task => task.id !== editing.id); draft.events = draft.events.filter(event => event.taskId !== editing.id); }); setEditing(null); notify('Task and its calendar blocks removed'); }
  const completion = data.tasks.length ? Math.round(data.tasks.filter(task => task.done).length / data.tasks.length * 100) : 0;
  return <div className="page-stack">
    <PageHeading eyebrow="MAKE ROOM FOR WHAT MATTERS" title="A little clarity. A lot of possibility." description="Capture everything. Give the important things a place." actions={<Button onClick={() => addTask()}><Plus size={16} /> New task</Button>} />
    <div className="prod-task-toolbar"><div className="prod-search"><ListTodo size={16} /><input aria-label="Search tasks" placeholder="Find a task…" value={search} onChange={event => setSearch(event.target.value)} /></div><select className="input" aria-label="Filter tasks by subject" value={filterSubject} onChange={event => setFilterSubject(event.target.value)}><option value="">All subjects</option>{data.subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select><label className="prod-completed-filter"><input type="checkbox" checked={showCompleted} onChange={event => setShowCompleted(event.target.checked)} /> Show completed</label><span className="prod-completion"><span>{completion}% complete</span><Progress value={completion} /></span></div>
    <DndContext sensors={sensors} onDragStart={dragStart} onDragEnd={dragEnd} onDragCancel={() => setActiveId(null)}>
      <div className="prod-task-layout"><TaskZone id="inbox" title="Inbox" subtitle="Get it out of your head." tasks={tasks.filter(task => task.quadrant === 'inbox')} onEdit={openTask} onAdd={addTask} className="prod-inbox" /><div className="prod-matrix"><div className="prod-matrix-heading"><div><span className="eyebrow">THE EISENHOWER MATRIX</span><h2>Intentional priorities</h2></div><span className="muted prod-small">Drag to find the right place</span></div><div className="prod-quadrant-grid">{quadrants.map(quadrant => <TaskZone key={quadrant.id} {...quadrant} tasks={tasks.filter(task => task.quadrant === quadrant.id)} onEdit={openTask} onAdd={addTask} />)}</div></div></div>
      <DragOverlay>{selectedTask && <TaskTile task={selectedTask} onEdit={openTask} overlay />}</DragOverlay>
    </DndContext>
    <div className="prod-quiet-note"><Sparkles size={15} /><span>Being productive begins with choosing what deserves your attention.</span><span className="prod-keyboard-note">Keyboard: use each task’s move menu.</span></div>
    <Modal open={!!editing} onClose={() => setEditing(null)} title={editing && data.tasks.some(task => task.id === editing.id) ? 'A closer look' : 'One thing at a time'}>
      {editing && <form className="stack" onSubmit={save}>
        <Field label="Task"><input className="input" autoFocus required maxLength={180} value={editing.title} onChange={event => setEditing({ ...editing, title: event.target.value })} placeholder="What would you like to do?" /></Field>
        <div className="form-grid"><Field label="Subject"><select className="input" value={editing.subjectId} onChange={event => setEditing({ ...editing, subjectId: event.target.value })}><option value="">Personal / no subject</option>{data.subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></Field><Field label="Priority"><select className="input" value={editing.quadrant} onChange={event => setEditing({ ...editing, quadrant: event.target.value as Quadrant })}><option value="inbox">Inbox</option>{quadrants.map(quadrant => <option key={quadrant.id} value={quadrant.id}>{quadrant.title}</option>)}</select></Field><Field label="Due date"><input className="input" type="date" value={editing.due} onChange={event => setEditing({ ...editing, due: event.target.value })} /></Field><Field label="Estimated minutes"><input className="input" type="number" min="5" max="720" step="5" required value={editing.minutes} onChange={event => setEditing({ ...editing, minutes: Number(event.target.value) })} /></Field><Field label="Difficulty"><select className="input" value={editing.difficulty} onChange={event => setEditing({ ...editing, difficulty: Number(event.target.value) })}>{[1, 2, 3, 4, 5].map(level => <option key={level} value={level}>{level} — {['Light', 'Comfortable', 'Moderate', 'Challenging', 'Deep thinking'][level - 1]}</option>)}</select></Field><Field label="Energy needed"><select className="input" value={editing.energy} onChange={event => setEditing({ ...editing, energy: event.target.value as Task['energy'] })}><option value="low">Low energy</option><option value="medium">Steady energy</option><option value="high">High energy</option></select></Field></div>
        <Field label="Notes"><textarea className="input" rows={3} value={editing.notes} onChange={event => setEditing({ ...editing, notes: event.target.value })} placeholder="A starting point, a reminder, a little context…" /></Field>
        <div className="prod-subtasks"><span className="prod-form-label">Small steps</span>{editing.subtasks.map(subtask => <div key={subtask.id} className="row"><input type="checkbox" checked={subtask.done} aria-label={`Complete ${subtask.title}`} onChange={event => setEditing({ ...editing, subtasks: editing.subtasks.map(item => item.id === subtask.id ? { ...item, done: event.target.checked } : item) })} /><span className={subtask.done ? 'prod-struck' : ''}>{subtask.title}</span><button type="button" className="icon-button" aria-label={`Remove ${subtask.title}`} onClick={() => setEditing({ ...editing, subtasks: editing.subtasks.filter(item => item.id !== subtask.id) })}><X size={14} /></button></div>)}<div className="row"><input className="input" aria-label="New subtask" placeholder="Add a small step…" value={newSubtask} onChange={event => setNewSubtask(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); if (newSubtask.trim()) { setEditing({ ...editing, subtasks: [...editing.subtasks, { id: uid(), title: newSubtask.trim(), done: false }] }); setNewSubtask(''); } } }} /><Button type="button" variant="soft" onClick={() => { if (newSubtask.trim()) { setEditing({ ...editing, subtasks: [...editing.subtasks, { id: uid(), title: newSubtask.trim(), done: false }] }); setNewSubtask(''); } }}><Plus size={15} /> Add</Button></div></div>
        <div className="form-grid"><Field label="Repeat"><select className="input" value={editing.recurrence} onChange={event => setEditing({ ...editing, recurrence: event.target.value as Task['recurrence'] })}><option value="none">Does not repeat</option><option value="daily">Every day</option><option value="weekly">Every week</option></select></Field><Field label="Attachment URL"><input className="input" type="url" placeholder="https://…" value={editing.attachment || ''} onChange={event => setEditing({ ...editing, attachment: event.target.value })} /></Field></div>
        <div className="row between prod-modal-footer">{data.tasks.some(task => task.id === editing.id) ? <Button type="button" variant="ghost" onClick={deleteTask}><Trash2 size={15} /> Delete task</Button> : <span />}<div className="row"><Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit">Save task <ArrowRight size={15} /></Button></div></div>
      </form>}
    </Modal>
  </div>;
}

const calendarHours = [0, 6, 9, 12, 15, 18, 21];
const hourLabel = (hour: number) => hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
const newEvent = (date = localDate(), time = '09:00'): CalendarEvent => ({ id: uid(), title: '', date, time, minutes: 45, subjectId: '' });

export function CalendarPage() {
  const { data, update, notify, ready } = useStore();
  const [anchor, setAnchor] = useState(localDate());
  const [view, setView] = useState<'week' | 'day'>('week');
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [dragOver, setDragOver] = useState('');
  const [taskQuery, setTaskQuery] = useState('');
  const queryTask = useRef('');
  const queryDate = useRef('');
  useEffect(() => { const date = new URLSearchParams(window.location.search).get('date'); if (!date || queryDate.current === date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return; const parsed = new Date(`${date}T12:00:00`); if (!Number.isNaN(parsed.getTime()) && localDate(parsed) === date) { queryDate.current = date; setAnchor(date); } });
  useEffect(() => { const id = new URLSearchParams(window.location.search).get('task'); if (!ready || !id || id === queryTask.current) return; const task = data.tasks.find(item => item.id === id); if (task) { queryTask.current = id; setEditing({ ...newEvent(), title: task.title, taskId: task.id, subjectId: task.subjectId, minutes: task.minutes }); } });
  const dates = useMemo(() => { const date = new Date(`${anchor}T12:00:00`); if (view === 'day') return [anchor]; const day = (date.getDay() + 6) % 7; return Array.from({ length: 7 }, (_, index) => dateOffset(index - day, date)); }, [anchor, view]);
  const events = data.events.filter(event => dates.includes(event.date));
  const unfinished = data.tasks.filter(task => !task.done && task.title.toLowerCase().includes(taskQuery.toLowerCase()));
  const plannedMinutes = events.reduce((sum, event) => sum + event.minutes, 0);
  function navigate(direction: number) { setAnchor(dateOffset(direction * (view === 'week' ? 7 : 1), new Date(`${anchor}T12:00:00`))); }
  function scheduleTask(task: Task, date = anchor, time = '09:00') { setEditing({ ...newEvent(date, time), title: task.title, taskId: task.id, subjectId: task.subjectId, minutes: task.minutes }); }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editing || !editing.title.trim() || !editing.date || !editing.time) return;
    const scheduled = { ...editing, title: editing.title.trim(), minutes: Math.max(5, Math.min(720, editing.minutes || 45)) };
    update(draft => { const index = draft.events.findIndex(item => item.id === scheduled.id); if (index >= 0) draft.events[index] = scheduled; else draft.events.push(scheduled); });
    setAnchor(scheduled.date); setEditing(null); notify('Your time is reserved');
  }
  function drop(value: string, date: string, hour: number) {
    setDragOver('');
    const time = `${String(hour).padStart(2, '0')}:00`;
    if (value.startsWith('event:')) { const id = value.slice(6); update(draft => { const event = draft.events.find(item => item.id === id); if (event) { event.date = date; event.time = time; } }); notify('Calendar block moved'); return; }
    const task = data.tasks.find(item => item.id === value.replace(/^task:/, ''));
    if (!task) return;
    update(draft => { draft.events.push({ ...newEvent(date, time), title: task.title, taskId: task.id, subjectId: task.subjectId, minutes: task.minutes }); }); notify(`${task.title} scheduled for ${dateLabel(date)} at ${time}`);
  }
  return <div className="page-stack">
    <PageHeading eyebrow="A LITTLE STRUCTURE. A LOT OF SPACE." title="Make time for what matters." description="A thoughtful rhythm for your studies, and everything around them." actions={<Button onClick={() => setEditing(newEvent(anchor))}><Plus size={16} /> Add a block</Button>} />
    <div className="prod-calendar-toolbar"><div className="row"><div className="prod-calendar-nav"><button className="icon-button" type="button" aria-label={`Previous ${view}`} onClick={() => navigate(-1)}><ChevronLeft size={17} /></button><button className="icon-button" type="button" aria-label={`Next ${view}`} onClick={() => navigate(1)}><ChevronRight size={17} /></button></div><h2>{dateLabel(anchor, { month: 'long', year: 'numeric' })}</h2><Button variant="ghost" onClick={() => setAnchor(localDate())}>Today</Button></div><div className="row"><span className="muted prod-small">{duration(plannedMinutes)} thoughtfully planned</span><div className="prod-segmented" aria-label="Calendar view"><button type="button" className={view === 'week' ? 'active' : ''} onClick={() => setView('week')}>Week</button><button type="button" className={view === 'day' ? 'active' : ''} onClick={() => setView('day')}>Day</button></div></div></div>
    <div className="prod-calendar-layout"><Panel className="prod-calendar-panel"><div className="prod-calendar-scroll"><div className={`prod-calendar-grid ${view === 'day' ? 'prod-calendar-day' : ''}`} style={{ '--days': dates.length } as CSSProperties}><div className="prod-time-heading"><Clock3 size={14} /></div>{dates.map(date => <button type="button" key={date} className={`prod-day-heading ${date === localDate() ? 'prod-today' : ''}`} onClick={() => { setAnchor(date); setView('day'); }}><span>{dateLabel(date, { weekday: 'short' })}</span><strong>{new Date(`${date}T12:00:00`).getDate()}</strong></button>)}{calendarHours.map((hour, index) => <div key={hour} className="prod-calendar-row"><div className="prod-time-label">{hourLabel(hour)}</div>{dates.map(date => { const cellEvents = events.filter(event => event.date === date && Number(event.time.split(':')[0]) >= hour && Number(event.time.split(':')[0]) < (calendarHours[index + 1] ?? 24)).sort((a, b) => a.time.localeCompare(b.time)); const cellId = `${date}-${hour}`; return <div key={date} className={`prod-calendar-cell ${dragOver === cellId ? 'prod-calendar-drop' : ''} ${date === localDate() ? 'prod-calendar-today' : ''}`} onDragOver={event => { event.preventDefault(); setDragOver(cellId); }} onDragLeave={() => setDragOver('')} onDrop={event => { event.preventDefault(); drop(event.dataTransfer.getData('text/plain'), date, hour); }}><button type="button" className="prod-cell-add" onClick={() => setEditing(newEvent(date, `${String(hour).padStart(2, '0')}:00`))} aria-label={`Add time block ${date} at ${hourLabel(hour)}`}><Plus size={12} /></button>{cellEvents.map(event => { const subject = data.subjects.find(item => item.id === event.subjectId); return <button key={event.id} type="button" className="prod-calendar-event" style={{ '--event-color': subject?.color || '#dcb8a0' } as CSSProperties} draggable onDragStart={dragEvent => { dragEvent.dataTransfer.setData('text/plain', `event:${event.id}`); dragEvent.dataTransfer.effectAllowed = 'move'; }} onClick={() => setEditing({ ...event })}><span className="prod-event-time">{event.time} <span>· {event.minutes}m</span></span><strong>{event.title}</strong>{subject && <span className="prod-event-subject">{subject.name}</span>}</button>; })}</div>; })}</div>)}</div></div></Panel><aside className="prod-calendar-sidebar"><Panel><div className="panel-header"><div><span className="eyebrow">MAKE IT HAPPEN</span><h3>Your tasks</h3></div><ListTodo size={18} /></div><p className="muted prod-small">Drag a task onto your week, or choose Schedule.</p><input className="input" placeholder="Find a task…" aria-label="Find tasks to schedule" value={taskQuery} onChange={event => setTaskQuery(event.target.value)} /><div className="prod-schedule-list">{unfinished.length ? unfinished.map(task => <div key={task.id} className="prod-schedule-task" draggable onDragStart={event => { event.dataTransfer.setData('text/plain', `task:${task.id}`); event.dataTransfer.effectAllowed = 'copy'; }}><div className="row"><GripVertical size={13} /><strong>{task.title}</strong></div><div className="row between"><span className="muted">{task.minutes} min</span><button type="button" onClick={() => scheduleTask(task)}>Schedule <ArrowRight size={11} /></button></div></div>) : <Empty text="A little breathing room. No open tasks." />}</div></Panel><div className="prod-calendar-tip"><Sparkles size={18} /><h3>Leave a little room.</h3><p>Small pauses make a thoughtful week. Your calendar can hold those, too.</p><Button variant="ghost" onClick={() => setEditing({ ...newEvent(anchor, '12:00'), title: 'A little breathing room', minutes: 20 })}>Plan a pause <Plus size={13} /></Button></div></aside></div>
    <Modal open={!!editing} onClose={() => setEditing(null)} title={editing && data.events.some(event => event.id === editing.id) ? 'Shape this moment' : 'Make a little time'}>{editing && <form className="stack" onSubmit={save}>
      <Field label="Time block"><input className="input" required autoFocus maxLength={180} placeholder="What is this time for?" value={editing.title} onChange={event => setEditing({ ...editing, title: event.target.value })} /></Field>
      <Field label="Linked task"><select className="input" value={editing.taskId || ''} onChange={event => { const task = data.tasks.find(item => item.id === event.target.value); setEditing(task ? { ...editing, taskId: task.id, title: task.title, subjectId: task.subjectId, minutes: task.minutes } : { ...editing, taskId: undefined }); }}><option value="">Independent time block</option>{data.tasks.filter(task => !task.done || task.id === editing.taskId).map(task => <option key={task.id} value={task.id}>{task.title}</option>)}</select></Field>
      <div className="form-grid"><Field label="Date"><input className="input" type="date" required value={editing.date} onChange={event => setEditing({ ...editing, date: event.target.value })} /></Field><Field label="Start time"><input className="input" type="time" required value={editing.time} onChange={event => setEditing({ ...editing, time: event.target.value })} /></Field><Field label="Duration in minutes"><input className="input" type="number" min="5" max="720" step="5" required value={editing.minutes} onChange={event => setEditing({ ...editing, minutes: Number(event.target.value) })} /></Field><Field label="Subject"><select className="input" value={editing.subjectId} onChange={event => setEditing({ ...editing, subjectId: event.target.value })}><option value="">Personal / no subject</option>{data.subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></Field></div>
      <div className="row between prod-modal-footer">{data.events.some(event => event.id === editing.id) ? <Button type="button" variant="ghost" onClick={() => { update(draft => { draft.events = draft.events.filter(event => event.id !== editing.id); }); setEditing(null); notify('Time block removed'); }}><Trash2 size={15} /> Delete block</Button> : <span />}<Button type="submit">Save block <ArrowRight size={15} /></Button></div>
    </form>}</Modal>
  </div>;
}

export function FocusPage() {
  const { data, notify, ready } = useStore();
  const focus = useFocus();
  const [quietMode, setQuietMode] = useState(false);
  const [sound, setSound] = useState(false);
  const [volume, setVolume] = useState(18);
  const [soundKind, setSoundKind] = useState<'soft' | 'deep'>('soft');
  const audio = useRef<{ context: AudioContext; source: AudioBufferSourceNode; gain: GainNode; filter: BiquadFilterNode } | null>(null);
  const queryTask = useRef('');
  useEffect(() => { const id = new URLSearchParams(window.location.search).get('task'); if (!ready || !id || id === queryTask.current || focus.running) return; const task = data.tasks.find(item => item.id === id); if (task) { queryTask.current = id; focus.setTaskId(task.id); } });
  const sessions = data.sessions.filter(session => session.date.slice(0, 10) === localDate());
  const focusedMinutes = sessions.reduce((sum, session) => sum + session.minutes, 0);
  const progress = focus.totalSeconds > 0 ? (1 - focus.seconds / focus.totalSeconds) * 100 : 0;
  const timeText = `${String(Math.floor(focus.seconds / 60)).padStart(2, '0')}:${String(focus.seconds % 60).padStart(2, '0')}`;
  const tasks = data.tasks.filter(task => !task.done || task.id === focus.taskId);
  useEffect(() => () => { if (audio.current) { audio.current.source.stop(); void audio.current.context.close(); audio.current = null; } }, []);
  useEffect(() => { if (audio.current) audio.current.gain.gain.setTargetAtTime(volume / 500, audio.current.context.currentTime, .15); }, [volume]);
  useEffect(() => { if (audio.current) audio.current.filter.frequency.setTargetAtTime(soundKind === 'deep' ? 280 : 1100, audio.current.context.currentTime, .2); }, [soundKind]);
  async function toggleSound() {
    if (audio.current) { audio.current.source.stop(); await audio.current.context.close(); audio.current = null; setSound(false); return; }
    try {
      const context = new AudioContext();
      const buffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
      const channel = buffer.getChannelData(0);
      for (let index = 0; index < channel.length; index++) channel[index] = Math.random() * 2 - 1;
      const source = context.createBufferSource(); source.buffer = buffer; source.loop = true;
      const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = soundKind === 'deep' ? 280 : 1100;
      const gain = context.createGain(); gain.gain.value = volume / 500;
      source.connect(filter); filter.connect(gain); gain.connect(context.destination);
      audio.current = { context, source, gain, filter };
      await context.resume(); source.start(); setSound(true);
    } catch { if (audio.current) { void audio.current.context.close(); audio.current = null; } setSound(false); notify('Audio could not start. Please check your browser sound permissions.'); }
  }
  return <div className={`page-stack ${quietMode ? 'prod-quiet-focus' : ''}`}>
    <PageHeading eyebrow="ONE THING, BEAUTIFULLY DONE." title="Find your flow." description="Take a breath. Clear a little space. Begin." actions={<Button variant="ghost" onClick={() => setQuietMode(!quietMode)}><Maximize2 size={15} /> {quietMode ? 'Show insights' : 'Quiet view'}</Button>} />
    <div className="prod-focus-layout"><Panel className="prod-focus-main"><div className="prod-focus-mode" aria-label="Focus mode">{[{ id: 'Deep Work', label: 'Deep work', icon: <Sparkles size={14} /> }, { id: 'Pomodoro', label: 'Pomodoro', icon: <Clock3 size={14} /> }, { id: 'Break', label: 'A little break', icon: <Coffee size={14} /> }].map(mode => <button type="button" key={mode.id} className={focus.mode === mode.id ? 'active' : ''} onClick={() => { focus.setMode(mode.id); focus.selectDuration(mode.id === 'Break' ? 5 : mode.id === 'Pomodoro' ? 25 : data.settings.focusMinutes); }} disabled={focus.running}>{mode.icon}{mode.label}</button>)}</div>
      <div className="prod-timer-scene"><span className="prod-timer-orbit prod-orbit-one" /><span className="prod-timer-orbit prod-orbit-two" /><div className={`prod-timer-orb ${focus.running ? 'prod-orb-running' : ''}`}><span className="prod-timer-label">{focus.running ? 'YOU ARE RIGHT HERE' : focus.seconds === 0 ? 'A MOMENT WELL SPENT' : 'YOUR SPACE TO FOCUS'}</span><div className="prod-timer-digits" role="timer" aria-label={`${Math.floor(focus.seconds / 60)} minutes ${focus.seconds % 60} seconds remaining`}>{timeText}</div><span className="prod-timer-caption">{focus.mode === 'Break' ? 'Let your mind wander a little.' : 'Nothing else needs you right now.'}</span><div className="prod-timer-progress"><Progress value={progress} color="#c99983" /></div></div></div>
      <div className="prod-focus-controls"><button className="prod-reset-button" type="button" aria-label="Reset focus timer" onClick={focus.reset}><RotateCcw size={19} /></button><Button onClick={focus.toggle}>{focus.running ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}{focus.running ? 'Pause session' : focus.completed ? 'Begin new session' : progress > 0 && focus.seconds > 0 ? 'Continue session' : 'Begin session'}</Button><button className="prod-reset-button" type="button" aria-label="Finish and save focus session" onClick={focus.finish} disabled={focus.completed || focus.seconds >= focus.totalSeconds}><Check size={20} /></button></div>
      {focus.completed && focus.lastSession && <section aria-label="Last session summary" className="prod-session-summary"><span className="prod-summary-check"><Check size={16} /></span><div><strong>A moment well spent.</strong><p>{Number(focus.lastSession.minutes.toFixed(2))} minutes · {focus.lastSession.mode} · {focus.lastSession.distractions} {focus.lastSession.distractions === 1 ? 'distraction' : 'distractions'} noticed</p></div></section>}
      <div className="prod-focus-task"><label htmlFor="focus-task"><Target size={14} /> A little intention</label><select id="focus-task" className="input" value={focus.taskId} onChange={event => focus.setTaskId(event.target.value)} disabled={focus.running}><option value="">Free focus — follow your curiosity</option>{tasks.map(task => <option key={task.id} value={task.id}>{task.title}</option>)}</select></div>
      <div className="prod-focus-activity"><label htmlFor="focus-activity">Focus activity</label><select id="focus-activity" value={focus.mode} disabled={focus.running} onChange={event => focus.setMode(event.target.value)}>{['Deep Work', 'Study', 'Reading', 'Memorization', 'Practice', 'Exam Simulation', 'Pomodoro', 'Break'].map(mode => <option key={mode} value={mode}>{mode}</option>)}</select></div>
      <div className="prod-duration-options"><span>Set your rhythm</span>{[15, 25, 45, 60, 90].map(minutes => <button type="button" key={minutes} className={focus.totalSeconds === minutes * 60 ? 'active' : ''} onClick={() => focus.selectDuration(minutes)} disabled={focus.running}>{minutes}m</button>)}<input type="number" min="1" max="180" aria-label="Custom focus duration in minutes" title="Custom duration in minutes" value={Math.round(focus.totalSeconds / 60)} disabled={focus.running} onChange={event => { const minutes = Number(event.target.value); if (Number.isFinite(minutes) && minutes >= 1 && minutes <= 180) focus.selectDuration(minutes); }} /></div>
      <p className="prod-focus-bottom">Small, focused moments add up to extraordinary things.</p>
    </Panel><aside className="prod-focus-sidebar"><Panel><div className="panel-header"><div><span className="eyebrow">A GENTLE MOMENTUM</span><h3>Your day, so far</h3></div><span className="prod-small-icon"><Zap size={17} /></span></div><div className="prod-focus-stats"><div><strong>{duration(focusedMinutes)}</strong><span>of focused attention</span></div><div><strong>{sessions.length}</strong><span>sessions completed</span></div></div><div className="prod-focus-target"><div className="row between"><span>Weekly intention</span><span>{data.settings.weeklyTarget}h</span></div><Progress value={Math.min(100, data.sessions.filter(session => session.date.slice(0, 10) >= dateOffset(-((new Date().getDay() + 6) % 7))).reduce((sum, session) => sum + session.minutes, 0) / Math.max(1, data.settings.weeklyTarget * 60) * 100)} /></div></Panel>
      <Panel><div className="panel-header"><div><span className="eyebrow">SET THE ATMOSPHERE</span><h3>A softer background</h3></div><Headphones size={18} /></div><div className="prod-soundscape"><div className={`prod-sound-wave ${sound ? 'active' : ''}`} aria-hidden="true">{[2, 5, 8, 4, 10, 6, 9, 4, 7, 3, 6, 9, 5, 8, 4].map((height, index) => <i key={index} style={{ height: `${height * 3}px`, animationDelay: `${index * .12}s` }} />)}</div><div className="row between"><select aria-label="Ambient sound texture" value={soundKind} onChange={event => setSoundKind(event.target.value as 'soft' | 'deep')}><option value="soft">Soft white noise</option><option value="deep">Deep filtered noise</option></select><button type="button" className="prod-sound-play" aria-label={sound ? 'Stop ambient sound' : 'Play ambient sound'} onClick={() => void toggleSound()}>{sound ? <Pause size={15} /> : <Play size={15} />}</button></div><input type="range" min="0" max="100" value={volume} onChange={event => setVolume(Number(event.target.value))} aria-label="Ambient sound volume" /></div><p className="muted prod-small">A quiet texture, made here in your browser.</p></Panel>
      <Panel className="prod-distraction-panel"><div className="row between"><div><span className="eyebrow">NOTICE. RELEASE. RETURN.</span><h3>A wandering thought?</h3></div><span className="prod-distraction-count">{focus.distractions}</span></div><p className="muted prod-small">It happens. Acknowledge it, then gently come back.</p><Button variant="soft" disabled={!focus.running} onClick={focus.distract}><Plus size={14} /> Log a distraction</Button></Panel>
      <div className="prod-focus-quote">“Almost everything will work again if you unplug it for a few minutes, including you.”<span>Anne Lamott</span></div>
    </aside></div>
  </div>;
}
