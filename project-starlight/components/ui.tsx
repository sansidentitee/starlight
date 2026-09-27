'use client';
import type {ReactNode,ButtonHTMLAttributes} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {X,Sparkles} from 'lucide-react';
export function Panel({children,className='',...props}:{children:ReactNode;className?:string}&React.HTMLAttributes<HTMLElement>){return <section className={`panel ${className}`} {...props}>{children}</section>;}
export function PageHeading({eyebrow,title,description,actions}:{eyebrow:string;title:string;description?:string;actions?:ReactNode}){return <header className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description&&<p className="muted">{description}</p>}</div>{actions&&<div className="heading-actions">{actions}</div>}</header>;}
export function Button({children,className='',variant='soft',...props}:ButtonHTMLAttributes<HTMLButtonElement>&{variant?:'primary'|'ghost'|'soft'}){return <button className={`btn btn-${variant} ${className}`} {...props}>{children}</button>;}
export function Modal({open,onClose,title,children}:{open:boolean;onClose:()=>void;title:string;children:ReactNode}){return <Dialog.Root open={open} onOpenChange={v=>{if(!v)onClose();}}><Dialog.Portal><Dialog.Overlay className="modal-overlay"/><Dialog.Content className="modal-content" aria-describedby={undefined}><div className="panel-header"><Dialog.Title>{title}</Dialog.Title><Dialog.Close className="icon-button" aria-label="Close dialog"><X size={18}/></Dialog.Close></div>{children}</Dialog.Content></Dialog.Portal></Dialog.Root>;}
export function Progress({value,color}:{value:number;color?:string}){return <div className="progress-track" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}><span style={{width:`${Math.min(100,Math.max(0,value))}%`,background:color}}/></div>;}
export function Empty({text}:{text:string}){return <div className="empty"><Sparkles size={26}/><p>{text}</p></div>;}
export function Field({label,children}:{label:string;children:ReactNode}){return <label className="field"><span>{label}</span>{children}</label>;}
