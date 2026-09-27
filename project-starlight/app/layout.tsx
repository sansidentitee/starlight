import type { Metadata } from 'next';
import { AppShell } from '@/components/shell';
import './globals.css';
export const metadata:Metadata={title:'Project Starlight — A Higher You',description:'A calmer space to focus, learn, and become. Your personal study workspace.',icons:{icon:'/icon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" data-scroll-behavior="smooth"><body><AppShell>{children}</AppShell></body></html>;}
