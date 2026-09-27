'use client';
import {useEffect,useMemo,useState,type CSSProperties,type ReactNode} from 'react';
import Link from 'next/link';
import {usePathname,useRouter} from 'next/navigation';
import {Home,CheckSquare,Target,CalendarDays,BookOpen,Library,ChartNoAxesColumn,GraduationCap,Flag,NotebookPen,Orbit,Settings,Search,Sun,Bell,Menu,X,Command,ArrowUpRight,Plus,Sparkles,Check,Cloud,HardDrive,LogOut,ArrowRight} from 'lucide-react';
import {StoreProvider,useStore} from '@/lib/store';
import {FocusProvider,useFocus} from '@/lib/focus';
import {supabase} from '@/lib/supabase';
import {Modal,Button,Field} from './ui';
import {localDate} from '@/lib/utils';
const nav=[{id:'dashboard',label:'Dashboard',icon:Home,group:'Your space'},{id:'focus',label:'Focus',icon:Target},{id:'tasks',label:'Tasks',icon:CheckSquare},{id:'calendar',label:'Calendar',icon:CalendarDays},{id:'subjects',label:'Subjects',icon:BookOpen,group:'Study'},{id:'revision',label:'Revision',icon:Orbit},{id:'notes',label:'Notes',icon:NotebookPen},{id:'library',label:'Library',icon:Library},{id:'analytics',label:'Analytics',icon:ChartNoAxesColumn,group:'Growth'},{id:'grades',label:'Grades',icon:GraduationCap},{id:'goals',label:'Goals',icon:Flag},{id:'strategy',label:'Weekly Review',icon:Sparkles}];
export function AppShell({children}:{children:ReactNode}){return <StoreProvider><FocusProvider><Shell>{children}</Shell></FocusProvider></StoreProvider>;}
function Shell({children}:{children:ReactNode}){
 const {data,update,toast,user,syncStatus,ready}=useStore();const {running,seconds}=useFocus();
 const [command,setCommand]=useState(false),[menu,setMenu]=useState(false),[notices,setNotices]=useState(false),[auth,setAuth]=useState(false),[clock,setClock]=useState<Date|null>(null);
 const path=usePathname();
 useEffect(()=>{setClock(new Date());const t=setInterval(()=>setClock(new Date()),30000);return()=>clearInterval(t);},[]);
 useEffect(()=>{const handler=(event:KeyboardEvent)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();setCommand(v=>!v);}if(event.key==='Escape'){setMenu(false);setNotices(false);}};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);},[]);
 useEffect(()=>{setMenu(false);setNotices(false);},[path]);
 const style={'--glass-alpha':data.settings.glass/100,'--glass-blur':`${data.settings.blur}px`,'--accent':data.settings.accent==='rose'?'#cd8da6':data.settings.accent==='amber'?'#d7a05b':'#e5a184'} as CSSProperties;
 return <div className={`starlight appearance-${data.settings.appearance} ${data.settings.motion?'':'motion-off'} ${data.settings.neumorphism?'':'flat'}`} style={style}>
 <div className="world" aria-hidden="true"/><div className="world-glow" aria-hidden="true"/>
 <a className="skip-link" href="#main">Skip to content</a>
 {menu&&<button className="sidebar-scrim" onClick={()=>setMenu(false)} aria-label="Close navigation"/>}
 <aside className={`sidebar ${menu?'is-open':''}`} aria-label="Main navigation">
  <Link href="/" className="brand"><span className="brand-orb"/><span>Project<strong>Starlight<span className="brand-spark">✧</span></strong><small>A Higher You.</small></span></Link>
  <nav>{nav.map(({id,label,icon:Icon,group})=><div key={id}>{group&&<p className="nav-group">{group}</p>}<Link href={`/${id}`} className={`nav-link ${(path===`/${id}`||(id==='dashboard'&&path==='/'))?'active':''}`} aria-current={(path===`/${id}`||(id==='dashboard'&&path==='/'))?'page':undefined}><Icon size={17} strokeWidth={1.6}/><span>{label}</span>{id==='focus'&&running&&<span className="live-dot"/>}</Link></div>)}</nav>
  <div className="sidebar-bottom"><Link className={`nav-link ${path==='/settings'?'active':''}`} href="/settings"><Settings size={17} strokeWidth={1.6}/>Settings</Link><button className="profile" onClick={()=>setAuth(true)}><span className="avatar">{data.settings.name.charAt(0)||'A'}</span><span><strong>{data.settings.name||'Your space'}</strong><small>{user?'Personal workspace':'Personal · Demo'}</small></span><ArrowUpRight size={14}/></button><div className="sidebar-quote"><span className="eyebrow">Discipline today</span><p>A calmer mind<br/>builds a sharper reality.</p><span>—</span></div></div>
 </aside>
 <div className="main-shell"><header className="topbar"><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={()=>setMenu(true)}><Menu size={21}/></button><button className="global-search" onClick={()=>setCommand(true)}><Search size={18}/><span>Search anything in Project Starlight…</span><kbd>⌘ K</kbd></button><div className="topbar-actions"><button className="icon-button round" aria-label="Toggle warm appearance" onClick={()=>update(d=>{d.settings.appearance=d.settings.appearance==='pure'?'warm':'pure';})}><Sun size={19}/></button><button className="icon-button round notification-button" aria-label="Open notifications" onClick={()=>setNotices(v=>!v)}><Bell size={18}/><i/></button><button className="top-avatar" aria-label="Account" onClick={()=>setAuth(true)}><span className="brand-orb"/></button><div className="clock"><span>{clock?clock.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}):'Your moment'}</span><strong>{clock?clock.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:true}).replace(/\s[AP]M/,''):'09:24'}<small> {clock&&clock.getHours()>=12?'PM':'AM'}</small></strong></div></div></header>
 {notices&&<div className="notification-panel panel"><div className="panel-header"><h3>A little heads-up</h3><button className="icon-button" aria-label="Close notifications" onClick={()=>setNotices(false)}><X size={16}/></button></div><p><span className="live-dot"/>{data.tasks.filter(t=>!t.done&&t.due&&t.due<=localDate()).length} tasks need your attention.</p><Link href="/revision" className="list-row"><Orbit size={18}/>Your next small step: a revision session.<ArrowRight size={15}/></Link><small className="muted">{syncStatus}</small></div>}
 <main id="main" tabIndex={-1}>{ready?children:<div className="workspace-loading"><span className="brand-orb"/><p>Making a little space for you…</p></div>}</main>
 <footer className="workspace-footer"><span>{user?<Cloud size={12}/>:<HardDrive size={12}/>} {syncStatus}</span><span>Less noise. More meaning. <span className="footer-star">✧</span></span></footer>
 </div>
 {running&&path!=='/focus'&&<Link className="mini-focus" href="/focus"><span className="live-dot"/>Focus in progress <strong>{Math.floor(seconds/60)}:{String(seconds%60).padStart(2,'0')}</strong><ArrowUpRight size={14}/></Link>}
 <div className={`toast ${toast?'visible':''}`} role="status" aria-live="polite"><Check size={16}/>{toast}</div>
 <CommandPalette open={command} onClose={()=>setCommand(false)}/><AuthModal open={auth} onClose={()=>setAuth(false)}/>
 </div>;
}
function CommandPalette({open,onClose}:{open:boolean;onClose:()=>void}){
 const {data}=useStore();const router=useRouter();const [query,setQuery]=useState('');const [selected,setSelected]=useState(0);
 useEffect(()=>{if(open){setQuery('');setSelected(0);}},[open]);
 const results=useMemo(()=>[
 ...nav.map(n=>({id:n.id,title:n.label,kind:'Page',href:`/${n.id}`,icon:n.icon})),{id:'settings',title:'Settings',kind:'Page',href:'/settings',icon:Settings},
 ...data.tasks.filter(t=>!t.done).map(t=>({id:t.id,title:t.title,kind:'Task',href:`/tasks?task=${t.id}`,icon:CheckSquare})),
 ...data.notes.map(n=>({id:n.id,title:n.title,kind:'Note',href:`/notes?note=${n.id}`,icon:NotebookPen})),
 ...data.subjects.map(s=>({id:s.id,title:s.name,kind:'Subject',href:`/subjects?subject=${s.id}`,icon:BookOpen})),
 ...data.resources.map(r=>({id:r.id,title:r.title,kind:'Resource',href:`/library?q=${encodeURIComponent(r.title)}`,icon:Library}))
 ].filter(item=>`${item.title} ${item.kind}`.toLowerCase().includes(query.toLowerCase())).slice(0,12),[data,query]);
 const go=(href:string)=>{router.push(href);onClose();};
 return <Modal open={open} onClose={onClose} title="Command Center"><div className="command-input"><Search size={20}/><input autoFocus aria-label="Search pages, tasks, notes, and resources" value={query} placeholder="Where would you like to go?" onChange={e=>{setQuery(e.target.value);setSelected(0);}} onKeyDown={e=>{if(e.key==='ArrowDown'){e.preventDefault();setSelected(v=>Math.min(results.length-1,v+1));}if(e.key==='ArrowUp'){e.preventDefault();setSelected(v=>Math.max(0,v-1));}if(e.key==='Enter'&&results[selected]){e.preventDefault();go(results[selected].href);}}}/></div><div className="command-results">{results.map((r,i)=><button key={`${r.kind}-${r.id}`} className={`command-result ${selected===i?'selected':''}`} onMouseEnter={()=>setSelected(i)} onClick={()=>go(r.href)}><r.icon size={18}/><span>{r.title}<small>{r.kind}</small></span><ArrowUpRight size={16}/></button>)}{!results.length&&<p className="empty">No matches. Try a subject or a page name.</p>}</div><div className="command-footer"><span>↑ ↓ to explore</span><span>↵ to open</span><span>esc to close</span></div></Modal>;
}
export function AuthModal({open,onClose}:{open:boolean;onClose:()=>void}){
 const {user,configured,notify,flush}=useStore();const [signup,setSignup]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const submit=async(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();if(!supabase)return;setBusy(true);setMessage('');const form=new FormData(e.currentTarget);const credentials={email:String(form.get('email')),password:String(form.get('password'))};try{const result=signup?await supabase.auth.signUp({...credentials,options:{emailRedirectTo:window.location.origin}}):await supabase.auth.signInWithPassword(credentials);if(result.error)setMessage(result.error.message);else if(signup&&!result.data.session)setMessage('Check your email to confirm your account, then sign in.');else{notify('Welcome to your Starlight workspace.');onClose();}}catch{setMessage('Could not reach the account service. Please try again.');}finally{setBusy(false);}};
 return <Modal open={open} onClose={onClose} title={user?'Your personal space':signup?'A space of your own.':'Welcome back.'}>{!configured?<div className="stack"><p>You’re exploring Starlight in demo mode. Your changes are saved on this device.</p><p className="muted">Connect your Supabase project using the included setup guide to enable accounts and cloud sync.</p><Button variant="primary" onClick={onClose}>Keep exploring <ArrowRight size={16}/></Button></div>:user?<div className="stack"><p>Signed in as <strong>{user.email}</strong></p><p className="muted">Your workspace is private and saved to your account.</p><Button onClick={async()=>{if(!await flush()){setMessage('Export a backup or restore cloud sync before signing out. Your changes have not been saved.');return;}const result=await supabase?.auth.signOut();if(result?.error)setMessage(result.error.message);else onClose();}}><LogOut size={16}/>Sign out</Button>{message&&<p role="alert">{message}</p>}</div>:<form className="stack" onSubmit={submit}><p className="muted">{signup?'Create your private workspace. A fresh demo dataset will help you get started.':'Your focus, notes, and progress. All in one place.'}</p><Field label="Email"><input name="email" type="email" autoComplete="email" required placeholder="you@example.com"/></Field><Field label="Password"><input name="password" type="password" autoComplete={signup?'new-password':'current-password'} minLength={8} required placeholder="At least 8 characters"/></Field>{message&&<p className="auth-message" role="status">{message}</p>}<Button variant="primary" disabled={busy}>{busy?'One moment…':signup?'Create account':'Sign in'}<ArrowRight size={16}/></Button><Button type="button" variant="ghost" onClick={()=>{setSignup(v=>!v);setMessage('');}}>{signup?'Already have an account? Sign in':'New here? Create an account'}</Button></form>}</Modal>;
}



