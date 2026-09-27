import { notFound } from 'next/navigation';
import { Workspace } from '@/components/workspace';
import { pageIds, type PageId } from '@/lib/types';
export function generateStaticParams(){return pageIds.map(page=>({page}));}
export default async function Page({params}:{params:Promise<{page:string}>}){const {page}=await params;if(!pageIds.includes(page as PageId))notFound();return <Workspace page={page as PageId}/>;}
