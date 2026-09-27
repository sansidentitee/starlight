'use client';
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {useStore} from './store';
import {localDate,uid} from './utils';
type Summary={minutes:number;distractions:number;taskId:string;mode:string};
type FocusState={seconds:number;totalSeconds:number;running:boolean;completed:boolean;lastSession:Summary|null;mode:string;taskId:string;distractions:number;setMode:(s:string)=>void;setTaskId:(s:string)=>void;toggle:()=>void;reset:()=>void;finish:()=>void;distract:()=>void;selectDuration:(n:number)=>void};
const Context=createContext<FocusState|null>(null);
export function FocusProvider({children}:{children:ReactNode}){
 const {data,update,notify,user,ready,writable}=useStore();
 const [seconds,setSeconds]=useState(50*60),[totalSeconds,setTotal]=useState(50*60),[running,setRunning]=useState(false),[mode,setModeState]=useState('Deep Work'),[taskId,setTaskIdState]=useState(''),[distractions,setDistractions]=useState(0),[completed,setCompleted]=useState(false),[lastSession,setLastSession]=useState<Summary|null>(null);
 const deadline=useRef(0),initialized=useRef(false),didSave=useRef(false),owner=useRef<string|undefined>(undefined);
 useEffect(()=>{if(!ready)return;const identity=user?.id??'demo';if(!initialized.current||owner.current!==identity){const changedOwner=initialized.current&&owner.current!==identity;owner.current=identity;initialized.current=true;setRunning(false);setSeconds(data.settings.focusMinutes*60);setTotal(data.settings.focusMinutes*60);if(changedOwner)setTaskIdState('');setDistractions(0);setCompleted(false);setLastSession(null);didSave.current=false;}},[ready,user?.id,data.settings.focusMinutes]);
 const finish=useCallback(()=>{
  if(didSave.current)return;
  const remaining=running?Math.max(0,Math.ceil((deadline.current-Date.now())/1000)):seconds;
  const elapsed=totalSeconds-remaining;
  if(elapsed<1){notify('Start your session first.');return;}
  setRunning(false);setSeconds(remaining);
  const summary={minutes:Math.round(elapsed/60*100)/100,distractions,taskId,mode};
  const isBreak=/break/i.test(mode);
  if(!isBreak&&!update(d=>{d.sessions.unshift({id:uid(),date:localDate(),...summary});}))return;
  didSave.current=true;setCompleted(true);setLastSession(summary);
  notify(isBreak?'A little room to breathe. Ready when you are.':`Session recorded · ${Math.round(elapsed/60)} minutes of progress.`);
 },[running,seconds,totalSeconds,distractions,taskId,mode,update,notify]);
 useEffect(()=>{if(!running)return;const tick=()=>{const remaining=Math.max(0,Math.ceil((deadline.current-Date.now())/1000));setSeconds(remaining);if(remaining===0)finish();};const t=setInterval(tick,250);return()=>clearInterval(t);},[running,finish]);
 const reset=()=>{setRunning(false);setSeconds(totalSeconds);setDistractions(0);setCompleted(false);didSave.current=false;};
 const toggle=()=>{if(!writable){notify('Load your workspace before starting a session.');return;}if(didSave.current||seconds===0){didSave.current=false;setCompleted(false);setSeconds(totalSeconds);setDistractions(0);deadline.current=Date.now()+totalSeconds*1000;setRunning(true);}else if(running){setSeconds(Math.max(0,Math.ceil((deadline.current-Date.now())/1000)));setRunning(false);}else{deadline.current=Date.now()+seconds*1000;setRunning(true);}};
 const selectDuration=(n:number)=>{if(running){notify('Pause before changing the session length.');return;}if(!Number.isFinite(n))return;const value=Math.round(Math.min(180,Math.max(1,n))*60);setTotal(value);setSeconds(value);setDistractions(0);didSave.current=false;setCompleted(false);};
 const setMode=(value:string)=>{if(running){notify('Pause before changing focus mode.');return;}setModeState(value);};
 const setTaskId=(value:string)=>{if(running){notify('Pause before changing your focus task.');return;}setTaskIdState(value);};
 return <Context.Provider value={{seconds,totalSeconds,running,completed,lastSession,mode,taskId,distractions,setMode,setTaskId,toggle,reset,finish,distract:()=>{if(running)setDistractions(n=>n+1);},selectDuration}}>{children}</Context.Provider>;
}
export function useFocus(){const value=useContext(Context);if(!value)throw new Error('Missing FocusProvider');return value;}
