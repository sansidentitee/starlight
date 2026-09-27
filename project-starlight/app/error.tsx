'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <div className="panel empty"><h1>Let’s take a breath.</h1><p>This page couldn’t load. Your saved workspace is still on this device or in your account.</p><button className="btn btn-primary" onClick={reset}>Try again</button></div>;}
