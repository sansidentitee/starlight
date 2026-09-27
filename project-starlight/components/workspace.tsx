'use client';
import type {PageId} from '@/lib/types';
import {Dashboard} from './dashboard';
import {TasksPage,CalendarPage,FocusPage} from './productivity';
import {SubjectsPage,RevisionPage,AnalyticsPage,GradesPage,GoalsPage,NotesPage,LibraryPage,StrategyPage} from './learning';
import {SettingsPage} from './settings';
const pages={dashboard:Dashboard,tasks:TasksPage,focus:FocusPage,calendar:CalendarPage,subjects:SubjectsPage,revision:RevisionPage,analytics:AnalyticsPage,grades:GradesPage,goals:GoalsPage,notes:NotesPage,library:LibraryPage,strategy:StrategyPage,settings:SettingsPage};
export function Workspace({page}:{page:PageId}){const Component=pages[page];return <Component/>;}
