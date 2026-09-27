'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import type { AppData } from './types';
import { createDemoData } from './demo';
import { supabase } from './supabase';
const DEMO_KEY = 'starlight-demo-v1';
import { isAppData } from './validation';
export { isAppData } from './validation';
type Store = {data:AppData; update:(recipe:(draft:AppData)=>void)=>boolean; notify:(message:string)=>void; user:User|null; ready:boolean; writable:boolean; syncStatus:string; flush:()=>Promise<boolean>; reloadCloud:()=>void; resetDemo:()=>void; importData:(value:unknown)=>boolean; toast:string; configured:boolean};
const Context = createContext<Store|null>(null);
export function StoreProvider({children}:{children:ReactNode}) {
 const [data,setData] = useState<AppData>(createDemoData);
 const [user,setUser] = useState<User|null>(null);
 const [ready,setReady] = useState(false);
 const [syncStatus,setSyncStatus] = useState('Local demo');
 const [toast,setToast] = useState('');
 const [reload,setReload] = useState(0);
 const revision=useRef(0), generation=useRef(0), saved=useRef(''), timer=useRef<ReturnType<typeof setTimeout>|null>(null), blocked=useRef(false);
 const readyRef=useRef(false), userRef=useRef<User|null>(null), dataRef=useRef(data), flight=useRef<Promise<boolean>|null>(null);
 dataRef.current=data;
 const notify=useCallback((message:string)=>setToast(message),[]);
 useEffect(()=>{ if (!toast) return; const t=setTimeout(()=>setToast(''),4500); return()=>clearTimeout(t); },[toast]);
 useEffect(()=>{
  let alive=true; let identity:string|null|undefined=undefined;
  async function load(account:User|null) {
   identity=account?.id??null;
   const epoch=++generation.current; readyRef.current=false; setReady(false); blocked.current=false;
   if(timer.current) clearTimeout(timer.current);
   userRef.current=account; setUser(account); revision.current=0;
   let next=createDemoData();
   if(account && supabase){
    setSyncStatus('Loading your workspace…');
    const {data:row,error}=await supabase.from('app_workspaces').select('data,revision').eq('user_id',account.id).maybeSingle();
    if(!alive || epoch!==generation.current) return;
    if(error){setSyncStatus('Cloud unavailable · reload to retry');blocked.current=true;notify('Your cloud workspace could not be loaded. Editing is paused to protect your data.');}
    else if(row){ if(isAppData(row.data)){next=row.data;revision.current=row.revision;setSyncStatus('All changes saved');} else {blocked.current=true;setSyncStatus('Invalid cloud data · restore a backup');}}
    else setSyncStatus('New cloud workspace');
   }else{
    try{const raw=localStorage.getItem(DEMO_KEY);if(raw){const value=JSON.parse(raw);if(isAppData(value))next=value;}}catch{notify('Browser storage is unavailable. Export a backup before closing.');}
    setSyncStatus('Local demo');
   }
   if(!alive || epoch!==generation.current) return;
   saved.current=account&&revision.current===0&&!blocked.current?'':JSON.stringify(next); dataRef.current=next; setData(next); readyRef.current=true;setReady(true);
  }
  if(supabase){const {data:listener}=supabase.auth.onAuthStateChange((_event,session)=>{if((session?.user.id??null)===identity)return;void load(session?.user??null);});return()=>{alive=false;generation.current++;listener.subscription.unsubscribe();};}
  void load(null);return()=>{alive=false;generation.current++;};
 },[reload,notify]);
 const save=useCallback(async function flush():Promise<boolean>{
  if(!readyRef.current||blocked.current) return false;
  if(flight.current){const ok=await flight.current;return ok?flush():false;}
  const account=userRef.current, snapshot=JSON.stringify(dataRef.current);
  if(snapshot===saved.current)return true;
  if(!account){try{localStorage.setItem(DEMO_KEY,snapshot);saved.current=snapshot;setSyncStatus('Saved on this device');return true;}catch{setSyncStatus('Storage full · export a backup');return false;}}
  if(!supabase)return false;
  const client=supabase;const epoch=generation.current;
  setSyncStatus('Saving…');
  const request=(async()=>{try{
   const {data:nextRevision,error}=await client.rpc('save_workspace',{p_data:JSON.parse(snapshot),p_expected_revision:revision.current});
   if(epoch!==generation.current)return false;
   if(error)throw error;
   revision.current=Number(nextRevision);saved.current=snapshot;setSyncStatus('All changes saved');return true;
  }catch{if(epoch===generation.current){blocked.current=true;setSyncStatus('Sync paused · export then reload');notify('Sync was interrupted or the workspace changed elsewhere. Export your changes, then reload the cloud workspace.');}return false;}})();
  flight.current=request;let ok=false;
  try{ok=await request;}finally{if(flight.current===request)flight.current=null;}
  return ok&&epoch===generation.current?flush():false;
 },[notify]);
 useEffect(()=>{if(!ready)return;if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>void save(),600);return()=>{if(timer.current)clearTimeout(timer.current);};},[data,ready,save]);
 useEffect(()=>{const before=(event:BeforeUnloadEvent)=>{if(userRef.current && JSON.stringify(dataRef.current)!==saved.current){event.preventDefault();event.returnValue='';}else if(!userRef.current&&readyRef.current){try{localStorage.setItem(DEMO_KEY,JSON.stringify(dataRef.current));}catch{}}};window.addEventListener('beforeunload',before);return()=>window.removeEventListener('beforeunload',before);},[]);
 const update=useCallback((recipe:(draft:AppData)=>void)=>{if(!readyRef.current||blocked.current){notify('Please load your workspace before making changes.');return false;}const next=structuredClone(dataRef.current);recipe(next);dataRef.current=next;setData(next);if(!userRef.current){try{localStorage.setItem(DEMO_KEY,JSON.stringify(next));saved.current=JSON.stringify(next);setSyncStatus('Saved on this device');}catch{setSyncStatus('Storage full · export a backup');}}return true;},[notify]);
 const importData=(value:unknown)=>{if(!isAppData(value)){notify('This is not a valid Starlight backup.');return false;}if(!readyRef.current||blocked.current){notify('Reload your workspace before importing.');return false;}dataRef.current=value;setData(value);notify('Backup restored.');return true;};
 return <Context.Provider value={{data,update,notify,user,ready,writable:ready&&!blocked.current,syncStatus,flush:save,reloadCloud:()=>setReload(x=>x+1),resetDemo:()=>{if(!user){const next=createDemoData();dataRef.current=next;setData(next);notify('Demo reset.');}},importData,toast,configured:!!supabase}}>{children}</Context.Provider>;
}
export function useStore(){const value=useContext(Context);if(!value)throw new Error('Missing StoreProvider');return value;}
