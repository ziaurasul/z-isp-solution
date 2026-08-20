'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Users, Wifi, Cable, Tv, DollarSign, TrendingUp, TrendingDown,
  AlertTriangle, Bell, Settings, LogOut, Plus, Search, RefreshCw,
  ChevronLeft, ChevronRight, Edit, Trash2, Eye, X, Check,
  UserPlus, Package, Receipt, CreditCard, Building2, UserCog,
  BarChart3, ArrowUpRight, ArrowDownRight, Calendar, Clock,
  Menu, Filter, Download, Send, CheckCircle2, XCircle, AlertCircle,
  FileText, ClipboardList, Shield, Zap, Monitor, Phone, Mail, MapPin,
  Inbox, ArrowLeft, User, WifiOff, Hash, MessageSquare, Upload,
  FileSpreadsheet, Palette, MessageCircle, Printer, Image, SendHorizonal,
  LayoutDashboard, PieChart as PieChartIcon, ChevronDown, Lock, Landmark, Megaphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, Area, AreaChart,
  Tooltip as RTooltip
} from 'recharts';
import type {
  Business, Customer, Vendor, Employee, Connection, Invoice,
  Payment, Expense, Notification as Notif, DashboardData, Page, PaginatedResponse,
  AdminBusiness, AdminStats, AdminBusinessesResponse, Message, ReportData, BankAccount
} from '@/lib/types';

const CC = ['#10b981','#f59e0b','#6366f1','#ef4444','#06b6d4','#8b5cf6','#ec4899','#14b8a6','#f97316'];
const PI: Record<string,React.ReactNode> = { internet:<Wifi className="h-4 w-4"/>, cable:<Cable className="h-4 w-4"/>, iptv:<Tv className="h-4 w-4"/> };
const PC: Record<string,string> = { internet:'bg-emerald-100 text-emerald-700', cable:'bg-amber-100 text-amber-700', iptv:'bg-violet-100 text-violet-700' };
const SC: Record<string,string> = {
  active:'bg-emerald-100 text-emerald-700', inactive:'bg-gray-100 text-gray-600', suspended:'bg-red-100 text-red-700',
  expired:'bg-amber-100 text-amber-700', disconnected:'bg-red-100 text-red-700',
  paid:'bg-emerald-100 text-emerald-700', unpaid:'bg-red-100 text-red-700', overdue:'bg-orange-100 text-orange-700', partial:'bg-amber-100 text-amber-700',
  info:'bg-blue-100 text-blue-700', warning:'bg-amber-100 text-amber-700', expiry:'bg-orange-100 text-orange-700', payment:'bg-emerald-100 text-emerald-700',
  sent:'bg-blue-100 text-blue-700', delivered:'bg-emerald-100 text-emerald-700', read:'bg-violet-100 text-violet-700', failed:'bg-red-100 text-red-700',
};
const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface SR { type:string; id:string; title:string; subtitle:string; extra:string; }

async function api<T>(p:string,o?:RequestInit):Promise<T>{ const r=await fetch(p,{...o,headers:{'Content-Type':'application/json',...o?.headers}}); if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.error||'Failed');} return r.json(); }
class ErrBound extends React.Component<{children:React.ReactNode},{hasError:boolean;error:Error|null}>{state={hasError:false,error:null};static getDerivedStateFromError(e:Error){return{hasError:true,error:e};}render(){if(this.state.hasError)return<div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center"><div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4"><AlertCircle className="h-7 w-7 text-red-500"/></div><p className="font-medium text-gray-900">Something went wrong</p><p className="text-sm text-gray-500 mt-1 max-w-md">{this.state.error?.message}</p><Button onClick={()=>this.setState({hasError:false,error:null})} className="mt-4 bg-emerald-600 hover:bg-emerald-700" size="sm">Try Again</Button></div>;return this.props.children;}}
const fc=(n:number)=>'Rs '+Number(n||0).toLocaleString();
const fd=(d:string)=>d?new Date(d).toLocaleDateString('en-PK',{day:'2-digit',month:'short',year:'numeric'}):'-';
const fdt=(d:string)=>d?new Date(d).toLocaleDateString('en-PK',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'-';
const fm=(m:string)=>{if(!m||m.length<7)return m;const[y,mo]=m.split('-');return MN[parseInt(mo)-1]+' '+y;};

const safeMap=(arr:any,fn:any)=>Array.isArray(arr)?arr.map(fn):[];
function SkelR({c=5}:{c?:number}){return <TableRow>{Array.from({length:c}).map((_,i)=><TableCell key={i}><div className="h-4 bg-gray-200 rounded animate-pulse w-full"/></TableCell>)}</TableRow>;}
function SkelC({n=4}:{n?:number}){return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({length:n}).map((_,i)=><Card key={i} className="border-0 shadow-sm"><CardContent className="p-5"><div className="h-10 w-10 bg-gray-200 rounded-xl animate-pulse"/><div className="mt-3 h-7 w-28 bg-gray-200 rounded animate-pulse"/><div className="mt-2 h-4 w-36 bg-gray-200 rounded animate-pulse"/></CardContent></Card>)}</div>;}
function Emp({icon:I,title,desc}:{icon:React.ElementType;title:string;desc:string}){return <div className="flex flex-col items-center justify-center py-12 text-center"><div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4"><I className="h-7 w-7 text-gray-400"/></div><p className="font-medium text-gray-600">{title}</p><p className="text-sm text-gray-400 mt-1">{desc}</p></div>;}
function Pag({page,total,limit,onPage}:{page:number;total:number;limit:number;onPage:(p:number)=>void}){ const pgs=Math.ceil(total/limit);if(pgs<=1)return null; return <div className="flex items-center justify-between mt-4"><p className="text-sm text-gray-500">{total} total</p><div className="flex items-center gap-1"><Button variant="outline" size="sm" disabled={page<=1} onClick={()=>onPage(page-1)}><ChevronLeft className="h-4 w-4"/></Button><span className="text-sm px-2">{page}/{pgs}</span><Button variant="outline" size="sm" disabled={page>=pgs} onClick={()=>onPage(page+1)}><ChevronRight className="h-4 w-4"/></Button></div></div>; }
function SB({value,onChange,placeholder,fv,ofc,fo,fl}:{value:string;onChange:(v:string)=>void;placeholder:string;fv?:string;ofc?:(v:string)=>void;fo?:{value:string;label:string}[];fl?:string}){ return <div className="flex flex-col sm:flex-row gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/><Input placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)} className="pl-9"/></div>{fo&&ofc&&<Select value={fv||''} onValueChange={ofc}><SelectTrigger className="w-full sm:w-44"><SelectValue placeholder={fl||'Filter'}/></SelectTrigger><SelectContent>{fo.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>}</div>; }

// ===== AUTH =====
function AuthScreen({onLogin}:{onLogin:(b:Business)=>void}){
  const [isLogin,setIsLogin]=useState(true);const [loading,setLoading]=useState(false);const [error,setError]=useState('');
  const [form,setForm]=useState({name:'',email:'',password:'',phone:'',businessName:''});
  const submit=async(e:React.FormEvent)=>{e.preventDefault();setError('');setLoading(true);
    try{const b=await api<Business>(isLogin?'/api/auth/login':'/api/auth/signup',{method:'POST',body:JSON.stringify(form)});onLogin(b);}catch(err:any){setError(err.message);}finally{setLoading(false);}};
  return(
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8"><div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 text-white mb-4 shadow-lg shadow-emerald-200"><Zap className="h-8 w-8"/></div><h1 className="text-3xl font-bold text-gray-900">Z ISP Solution</h1><p className="text-gray-500 mt-1">Manage your ISP business efficiently</p></div>
        <Card className="shadow-xl border-0 shadow-emerald-100/50"><CardContent className="pt-6">
          <Tabs value={isLogin?'login':'signup'} onValueChange={v=>{setIsLogin(v==='login');setError('');}}>
            <TabsList className="grid w-full grid-cols-2 mb-6"><TabsTrigger value="login">Sign In</TabsTrigger><TabsTrigger value="signup">Sign Up</TabsTrigger></TabsList>
            {error&&<div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 flex items-center gap-2"><AlertCircle className="h-4 w-4"/>{error}</div>}
            <form onSubmit={submit} className="space-y-4">
              {!isLogin&&<><div><Label>Business Name</Label><Input placeholder="Your ISP name" value={form.businessName} onChange={e=>setForm(p=>({...p,businessName:e.target.value}))} required/></div><div><Label>Your Name</Label><Input placeholder="Full name" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} required/></div></>}
              <div><Label>Email</Label><Input type="email" placeholder="email@example.com" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} required/></div>
              <div><Label>Password</Label><Input type="password" placeholder="Min 6 characters" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} required minLength={6}/></div>
              {!isLogin&&<div><Label>Phone</Label><Input placeholder="03XX-XXXXXXX" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/></div>}
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>{loading&&<RefreshCw className="h-4 w-4 animate-spin mr-2"/>}{isLogin?'Sign In':'Create Account'}</Button>
            </form>
          </Tabs>
        </CardContent></Card>
        <p className="text-center text-xs text-gray-400 mt-6">Powered by Zee Technologies</p>
      </div>
    </div>);
}

// ===== GLOBAL SEARCH =====
function GlobalSearch({open,onOpenChange,onNav}:{open:boolean;onOpenChange:(o:boolean)=>void;onNav:(p:Page)=>void}){
  const [q,setQ]=useState('');const [results,setResults]=useState<SR[]>([]);const [searching,setSearching]=useState(false);const [sel,setSel]=useState(-1);const ref=useRef<HTMLInputElement>(null);const dRef=useRef<ReturnType<typeof setTimeout>>();
  useEffect(()=>{if(open){setQ('');setResults([]);setSel(-1);setTimeout(()=>ref.current?.focus(),100);}},[open]);
  const doSearch=useCallback(async(s:string)=>{if(!s.trim()){setResults([]);return;}setSearching(true);try{const r=await api<{results:SR[]}>(`/api/search?q=${encodeURIComponent(s.trim())}`);setResults(r.results);setSel(-1);}catch{}finally{setSearching(false);}},[]);
  const handleInput=(v:string)=>{setQ(v);if(dRef.current)clearTimeout(dRef.current);dRef.current=setTimeout(()=>doSearch(v),300);};
  const tI:Record<string,React.ReactNode>={customer:<User className="h-4 w-4 text-blue-500"/>,connection:<Wifi className="h-4 w-4 text-emerald-500"/>,payment:<DollarSign className="h-4 w-4 text-amber-500"/>,invoice:<FileText className="h-4 w-4 text-violet-500"/>,vendor:<Building2 className="h-4 w-4 text-cyan-500"/>,employee:<UserCog className="h-4 w-4 text-purple-500"/>};
  const tC:Record<string,string>={customer:'bg-blue-100 text-blue-700',connection:'bg-emerald-100 text-emerald-700',payment:'bg-amber-100 text-amber-700',invoice:'bg-violet-100 text-violet-700',vendor:'bg-cyan-100 text-cyan-700',employee:'bg-purple-100 text-purple-700'};
  const tL:Record<string,Page>={customer:'customers',connection:'connections',payment:'billing',invoice:'billing',vendor:'vendors',employee:'employees'};
  return(
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-lg p-0 gap-0">
      <div className="flex items-center border-b px-4 py-3"><Search className="h-4 w-4 text-gray-400 mr-3"/><input ref={ref} value={q} onChange={e=>handleInput(e.target.value)} onKeyDown={e=>{if(e.key==='ArrowDown')setSel(s=>Math.min(s+1,results.length-1));if(e.key==='ArrowUp')setSel(s=>Math.max(s-1,0));if(e.key==='Enter'&&sel>=0){onNav(tL[results[sel].type]||'dashboard');onOpenChange(false);}}} placeholder="Search customers, connections, payments..." className="flex-1 outline-none text-sm bg-transparent" autoFocus/></div>
      <div className="max-h-80 overflow-y-auto">
        {searching&&<div className="p-4 text-center text-sm text-gray-400"><RefreshCw className="h-4 w-4 animate-spin inline mr-2"/>Searching...</div>}
        {!searching&&q&&results.length===0&&<div className="p-4 text-center text-sm text-gray-400">No results found</div>}
        {!searching&&results.map((r,i)=>(
          <button key={r.type+r.id} onClick={()=>{onNav(tL[r.type]||'dashboard');onOpenChange(false);}} className={'w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors '+(i===sel?'bg-gray-50':'')}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">{tI[r.type]||<FileText className="h-4 w-4 text-gray-400"/>}</div>
            <div className="flex-1 min-w-0"><p className="font-medium text-gray-900 truncate">{r.title}</p><p className="text-xs text-gray-500 truncate">{r.subtitle}</p></div>
            <Badge variant="secondary" className={tC[r.type]||''}>{r.type}</Badge>
          </button>
        ))}
      </div>
      <div className="border-t px-4 py-2 text-xs text-gray-400">Press Esc to close</div>
    </DialogContent></Dialog>);
}

// ===== INVOICE PREVIEW =====
function InvoicePreview({invoice,biz,open,onOpenChange}:{invoice:Invoice;biz:Business;open:boolean;onOpenChange:(o:boolean)=>void}){
  const [tpl,setTpl]=useState(biz.invoiceTemplate||'modern');const color=biz.invoiceColor||'#10b981';
  const cust=invoice.connection?.customer;const conn=invoice.connection;const invNo=invoice.id.slice(-8).toUpperCase();
  const printInv=()=>{const el=document.getElementById('inv-print');if(!el)return;const w=window.open('','_blank');if(!w)return;w.document.write('<!DOCTYPE html><html><head><title>Invoice</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;padding:20px}@media print{@page{margin:10mm}}</style></head><body>'+el.innerHTML+'</body></html>');w.document.close();setTimeout(()=>w.print(),500);};
  if(!open)return null;
  const tS:Record<string,React.CSSProperties>={modern:{background:'linear-gradient(135deg,'+color+','+color+'dd)'},classic:{background:color},minimal:{borderBottom:'3px solid '+color},bold:{background:'#1f2937'}};
  return(
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Invoice Preview</DialogTitle></DialogHeader>
      <div className="flex gap-2 mb-4 flex-wrap">{['modern','classic','minimal','bold'].map(t=><button key={t} onClick={()=>setTpl(t)} className={'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors '+(tpl===t?'bg-emerald-600 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200')}>{t}</button>)}</div>
      <div id="inv-print">
        <div className="border rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 text-white" style={tS[tpl]||{}}>
            <div className="flex justify-between items-start">
              <div>{biz.logo&&<img src={biz.logo} className="h-12 w-12 rounded-lg object-cover mb-2 bg-white/20 p-0.5"/>}<h2 className="text-xl font-bold">{biz.name}</h2>{biz.phone&&<p className="text-sm opacity-80">{biz.phone}</p>}{biz.address&&<p className="text-sm opacity-80">{biz.address}</p>}</div>
              <div className="text-right"><h3 className="text-2xl font-bold">INVOICE</h3><p className="text-sm opacity-80">#{invNo}</p><p className="text-sm opacity-80">{invoice.month}</p></div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-6"><div><p className="text-xs text-gray-500 uppercase tracking-wider">Bill To</p><p className="font-medium mt-1">{cust?.name||'N/A'}</p><p className="text-sm text-gray-500">{cust?.phone||''}</p></div><div className="text-right"><p className="text-xs text-gray-500 uppercase tracking-wider">Status</p><Badge className={SC[invoice.status]||''}>{invoice.status}</Badge></div></div>
            <div className="border rounded-lg overflow-hidden mb-6"><Table><TableHeader><TableRow className="bg-gray-50"><TableHead>Package</TableHead><TableHead>Type</TableHead><TableHead>Period</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell className="font-medium">{conn?.packageName||'N/A'}</TableCell><TableCell>{conn?.packageType}</TableCell><TableCell>{invoice.month}</TableCell><TableCell className="text-right font-semibold">{fc(invoice.amount)}</TableCell></TableRow></TableBody></Table></div>
            <div className="flex justify-end"><div className="w-64"><div className="flex justify-between py-2 border-b"><span className="text-gray-500">Subtotal</span><span className="font-medium">{fc(invoice.amount)}</span></div><div className="flex justify-between py-2 border-b"><span className="text-gray-500">Tax</span><span className="font-medium">Rs 0</span></div><div className="flex justify-between py-3 text-lg"><span className="font-semibold">Total</span><span className="font-bold" style={{color}}>{fc(invoice.amount)}</span></div></div></div>
          </div>
          <div className="px-6 pb-4 text-center text-xs text-gray-400">Thank you for your business</div>
        </div>
      </div>
      <div className="flex gap-2 mt-4"><Button onClick={printInv} className="flex-1"><Printer className="h-4 w-4 mr-2"/>Print</Button><Button variant="outline" onClick={()=>onOpenChange(false)} className="flex-1">Close</Button></div>
    </DialogContent></Dialog>);
}

// ===== BULK UPLOAD =====
function BulkUploadDlg({open,onOpenChange,onDone}:{open:boolean;onOpenChange:(o:boolean)=>void;onDone:()=>void}){
  const [type,setType]=useState('customers');const [file,setFile]=useState<File|null>(null);const [uploading,setUploading]=useState(false);const [result,setResult]=useState<{created:number;errors:{row:number;error:string}[];total:number}|null>(null);const [dl,setDl]=useState(false);
  const upload=async()=>{if(!file)return;setUploading(true);setResult(null);const fd=new FormData();fd.append('file',file);fd.append('type',type);
    try{const r=await fetch('/api/upload/bulk',{method:'POST',body:fd});const d=await r.json();if(!r.ok)throw new Error(d.error);setResult(d);if(d.created>0)onDone();}catch(e:any){alert(e.message);}finally{setUploading(false);}};
  const dlTemplate=async()=>{setDl(true);try{const r=await fetch('/api/upload/template?type='+type);const b=await r.blob();const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=type+'_template.xlsx';a.click();URL.revokeObjectURL(u);}catch(e:any){alert(e.message);}finally{setDl(false);}};
  return(
    <Dialog open={open} onOpenChange={o=>{onOpenChange(o);if(!o){setFile(null);setResult(null);}}}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Bulk Upload</DialogTitle><DialogDescription>Import data from CSV or Excel file</DialogDescription></DialogHeader>
      <div className="space-y-4">
        <div><Label>Type</Label><Select value={type} onValueChange={setType}><SelectTrigger className="mt-1"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="customers">Customers</SelectItem><SelectItem value="connections">Connections</SelectItem><SelectItem value="expenses">Expenses</SelectItem></SelectContent></Select></div>
        <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-emerald-500 transition-colors" onClick={()=>{const i=document.createElement('input');i.type='file';i.accept='.csv,.xlsx,.xls';i.onchange=e=>{setFile((e.target as HTMLInputElement).files?.[0]||null);};i.click();}}><Upload className="h-8 w-8 mx-auto text-gray-400 mb-2"/><p className="text-sm text-gray-600">{file?file.name:'Click to select file'}</p><p className="text-xs text-gray-400 mt-1">Max 500 rows</p></div>
        <Button variant="outline" size="sm" onClick={dlTemplate} disabled={dl} className="w-full"><Download className="h-4 w-4 mr-2"/>{dl?'Downloading...':'Download Sample Template'}</Button>
        {result&&<div className="bg-gray-50 rounded-lg p-3 text-sm"><p className="font-medium text-emerald-600">{result.created}/{result.total} imported</p>{result.errors.length>0&&<><p className="text-red-500 mt-1">{result.errors.length} errors</p><div className="max-h-20 overflow-y-auto mt-1">{result.errors.slice(0,10).map((e,i)=><p key={i} className="text-xs text-gray-500">Row {e.row}: {e.error}</p>)}</div></>}</div>}
        <Button onClick={upload} disabled={!file||uploading} className="w-full bg-emerald-600 hover:bg-emerald-700">{uploading?<RefreshCw className="h-4 w-4 animate-spin mr-2"/>:<Upload className="h-4 w-4 mr-2"/>}{uploading?'Uploading...':'Upload'}</Button>
      </div>
    </DialogContent></Dialog>);
}

// ===== DASHBOARD =====
function DashboardPage({business}:{business:Business}){
  const [data,setData]=useState<DashboardData|null>(null);const [loading,setLoading]=useState(true);
  const fetch=useCallback(async()=>{setLoading(true);try{setData(await api<DashboardData>('/api/dashboard'));}catch{}finally{setLoading(false);}},[]);
  useEffect(()=>{fetch();},[fetch]);
  if(loading)return <SkelC/>;
  if(!data)return <Emp icon={LayoutDashboard} title="No data" desc="Start by adding customers"/>;
  const cards=[{l:'Total Customers',v:data.totalCustomers,i:Users,c:'text-blue-600 bg-blue-50',ch:data.totalCustomers>0},{l:'Active Connections',v:data.activeConnections,i:Wifi,c:'text-emerald-600 bg-emerald-50',ch:true},{l:'Monthly Revenue',v:fc(data.totalMonthlyRevenue),i:DollarSign,c:'text-amber-600 bg-amber-50',ch:true},{l:'Collected This Month',v:fc(data.totalCollectedThisMonth),i:CreditCard,c:'text-violet-600 bg-violet-50',ch:true},{l:'Expenses This Month',v:fc(data.totalExpensesThisMonth),i:TrendingDown,c:'text-red-600 bg-red-50',ch:false},{l:'Overdue Invoices',v:data.overdueInvoicesCount,i:AlertTriangle,c:'text-orange-600 bg-orange-50',ch:false},{l:'Expiring Soon',v:data.expiringConnectionsCount,i:Clock,c:'text-cyan-600 bg-cyan-50',ch:false}];
  return(
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.slice(0,4).map((c,i)=><Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow"><CardContent className="p-5"><div className="flex items-center justify-between"><div className={'w-10 h-10 rounded-xl flex items-center justify-center '+c.c}><c.i className="h-5 w-5"/></div></div><div className="mt-3"><p className="text-2xl font-bold text-gray-900">{c.v}</p><p className="text-sm text-gray-500 mt-0.5">{c.l}</p></div></CardContent></Card>)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.slice(4).map((c,i)=><Card key={i} className="border-0 shadow-sm"><CardContent className="p-4 flex items-center gap-3"><div className={'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 '+c.c}><c.i className="h-4 w-4"/></div><div><p className="text-lg font-bold">{c.v}</p><p className="text-xs text-gray-500">{c.l}</p></div></CardContent></Card>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Revenue & Expenses</CardTitle></CardHeader><CardContent><div className="h-64"><ResponsiveContainer><AreaChart data={data.monthlyRevenueData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="month" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><RTooltip/><Area type="monotone" dataKey="revenue" fill="#10b981" fillOpacity={0.15} stroke="#10b981" name="Revenue"/><Area type="monotone" dataKey="expenses" fill="#ef4444" fillOpacity={0.15} stroke="#ef4444" name="Expenses"/></AreaChart></ResponsiveContainer></div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Connections by Type</CardTitle></CardHeader><CardContent><div className="h-64 flex items-center justify-center"><ResponsiveContainer><PieChart><Pie data={[{name:'Internet',value:data.connectionsByType.internet},{name:'Cable',value:data.connectionsByType.cable},{name:'IPTV',value:data.connectionsByType.iptv}]} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label><Cell fill="#10b981"/><Cell fill="#f59e0b"/><Cell fill="#6366f1"/></Pie><RTooltip/><Legend/></PieChart></ResponsiveContainer></div></CardContent></Card>
      </div>
      <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Recent Payments</CardTitle></CardHeader><CardContent>
        {data.recentPayments.length===0?<Emp icon={CreditCard} title="No payments" desc="Payments will appear here"/>:
        <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Date</TableHead></TableRow></TableHeader><TableBody>{data.recentPayments.map(p=><TableRow key={p.id}><TableCell className="font-medium">{p.customer?.name||'-'}</TableCell><TableCell>{fc(p.amount)}</TableCell><TableCell><Badge variant="secondary">{p.method||'cash'}</Badge></TableCell><TableCell className="text-sm text-gray-500">{fdt(p.createdAt)}</TableCell></TableRow>)}</TableBody></Table></div>}
      </CardContent></Card>
      <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader><CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Button variant="outline" size="sm" className="text-orange-600 hover:bg-orange-50" onClick={async()=>{try{const r=await api<{messagesCreated:number}>('/api/reminders',{method:'POST',body:JSON.stringify({type:'expiring'})});alert(r.messagesCreated+' reminder messages sent!');}catch(e:any){alert(e.message);}}}><Megaphone className="h-4 w-4 mr-1"/>Expiry Reminders</Button>
          <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={async()=>{try{const r=await api<{messagesCreated:number}>('/api/reminders',{method:'POST',body:JSON.stringify({type:'overdue'})});alert(r.messagesCreated+' overdue reminders sent!');}catch(e:any){alert(e.message);}}}><AlertTriangle className="h-4 w-4 mr-1"/>Overdue Reminders</Button>
          <Button variant="outline" size="sm" className="text-blue-600 hover:bg-blue-50" onClick={async()=>{try{const r=await api<{messagesCreated:number}>('/api/reminders',{method:'POST',body:JSON.stringify({type:'welcome'})});alert(r.messagesCreated+' welcome messages sent!');}catch(e:any){alert(e.message);}}}><Send className="h-4 w-4 mr-1"/>Welcome Messages</Button>
          <Button variant="outline" size="sm" className="text-purple-600 hover:bg-purple-50" onClick={()=>{const msg=prompt('Enter maintenance notice message:');if(msg){api('/api/reminders',{method:'POST',body:JSON.stringify({type:'maintenance',message:msg})}).then(r=>alert('Sent to '+(r as any).messagesCreated+' customers!')).catch(e=>alert((e as any).message));}}}><Megaphone className="h-4 w-4 mr-1"/>Maintenance</Button>
        </div>
      </CardContent></Card>
    </div>);
}

// ===== CUSTOMERS =====
function CustomersPage({business:_b,onBulk}:{business:Business;onBulk:()=>void}){
  const [data,setData]=useState<Customer[]>([]);const [total,setTotal]=useState(0);const [page,setPage]=useState(1);const [search,setSearch]=useState('');const [loading,setLoading]=useState(true);
  const [dlg,setDlg]=useState<{open:boolean;edit:Customer|null}>({open:false,edit:null});
  const [form,setForm]=useState({name:'',phone:'',email:'',address:'',cnic:'',status:'active'});
  const fetch=useCallback(async()=>{setLoading(true);try{const r=await api<PaginatedResponse<Customer>>(`/api/customers?page=${page}&limit=20&search=${search}`);setData(r.data);setTotal(r.total);}catch{}finally{setLoading(false);}},[page,search]);
  useEffect(()=>{fetch();},[fetch]);
  const openCreate=()=>{setForm({name:'',phone:'',email:'',address:'',cnic:'',status:'active'});setDlg({open:true,edit:null});};
  const openEdit=(c:Customer)=>{setForm({name:c.name,phone:c.phone,email:c.email||'',address:c.address||'',cnic:c.cnic||'',status:c.status});setDlg({open:true,edit:c});};
  const save=async()=>{if(!form.name||!form.phone)return;try{if(dlg.edit){await api('/api/customers/'+dlg.edit.id,{method:'PUT',body:JSON.stringify(form)});}else{await api('/api/customers',{method:'POST',body:JSON.stringify(form)});}setDlg({open:false,edit:null});fetch();}catch(e:any){alert(e.message);}};
  const del=async(id:string)=>{if(!confirm('Delete this customer?'))return;try{await api('/api/customers/'+id,{method:'DELETE'});fetch();}catch(e:any){alert(e.message);}};
  return(
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 justify-between"><SB value={search} onChange={v=>{setSearch(v);setPage(1);}} placeholder="Search customers..."/>
        <div className="flex gap-2"><Button variant="outline" size="sm" onClick={onBulk}><Upload className="h-4 w-4 mr-1"/>Bulk</Button><Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={openCreate}><Plus className="h-4 w-4 mr-1"/>Add</Button></div></div>
      <Card className="border-0 shadow-sm"><CardContent className="p-0">
        <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="hidden sm:table-cell">Phone</TableHead><TableHead className="hidden md:table-cell">Status</TableHead><TableHead className="hidden lg:table-cell">Created</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
          {loading?Array.from({length:5}).map((_,i)=><SkelR key={i} c={5}/>):
          data.length===0?<TableRow><TableCell colSpan={5}><Emp icon={Users} title="No customers" desc="Add your first customer"/></TableCell></TableRow>:
          data.map(c=>(
            <TableRow key={c.id}><TableCell><div><p className="font-medium">{c.name}</p><p className="text-xs text-gray-500 sm:hidden">{c.phone}</p></div></TableCell><TableCell className="hidden sm:table-cell">{c.phone}</TableCell><TableCell className="hidden md:table-cell"><Badge className={SC[c.status]||''}>{c.status}</Badge></TableCell><TableCell className="hidden lg:table-cell text-sm text-gray-500">{fd(c.createdAt)}</TableCell><TableCell className="text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={()=>openEdit(c)}><Edit className="h-4 w-4"/></Button><Button variant="ghost" size="sm" className="text-red-500" onClick={()=>del(c.id)}><Trash2 className="h-4 w-4"/></Button></div></TableCell></TableRow>
          ))}
        </TableBody></Table></div>
        <div className="px-4"><Pag page={page} total={total} limit={20} onPage={setPage}/></div>
      </CardContent></Card>
      <Dialog open={dlg.open} onOpenChange={o=>setDlg({open:o,edit:null})}><DialogContent><DialogHeader><DialogTitle>{dlg.edit?'Edit':'Add'} Customer</DialogTitle></DialogHeader><div className="space-y-3">
        <div><Label>Name</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
        <div><Label>Phone</Label><Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
        <div><Label>Email</Label><Input value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
        <div><Label>Address</Label><Input value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></div>
        <div><Label>CNIC</Label><Input value={form.cnic} onChange={e=>setForm({...form,cnic:e.target.value})}/></div>
        <div><Label>Status</Label><Select value={form.status} onValueChange={v=>setForm({...form,status:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent></Select></div>
        <Button onClick={save} className="w-full bg-emerald-600 hover:bg-emerald-700">Save</Button></div></DialogContent></Dialog>
    </div>);
}

// ===== CONNECTIONS =====
function ConnectionsPage({business:_b}:{business:Business}){
  const [data,setData]=useState<(Connection&{customer?:{id:string;name:string;phone:string}})[]>([]);const [total,setTotal]=useState(0);const [page,setPage]=useState(1);const [search,setSearch]=useState('');const [loading,setLoading]=useState(true);
  const [dlg,setDlg]=useState<{open:boolean;edit:any;customers:Customer[]}>({open:false,edit:null,customers:[]});
  const [form,setForm]=useState({customerId:'',packageType:'internet',packageName:'',speed:'',monthlyFee:'',status:'active',expiresAt:''});
  const fetch=useCallback(async()=>{setLoading(true);try{const r=await api<PaginatedResponse<any>>(`/api/connections?page=${page}&limit=20&search=${search}`);setData(r.data);setTotal(r.total);}catch{}finally{setLoading(false);}},[page,search]);
  useEffect(()=>{fetch();},[fetch]);
  const openCreate=async()=>{const cs=(await api<PaginatedResponse<Customer>>('/api/customers?limit=100')).data;setForm({customerId:'',packageType:'internet',packageName:'',speed:'',monthlyFee:'',status:'active',expiresAt:''});setDlg({open:true,edit:null,customers:cs});};
  const openEdit=async(c:any)=>{const cs=(await api<PaginatedResponse<Customer>>('/api/customers?limit=100')).data;setForm({customerId:c.customerId,packageType:c.packageType,packageName:c.packageName||'',speed:c.speed||'',monthlyFee:String(c.monthlyFee),status:c.status,expiresAt:c.expiresAt?c.expiresAt.slice(0,10):''});setDlg({open:true,edit:c,customers:cs});};
  const save=async()=>{if(!form.customerId||!form.monthlyFee)return;try{const body={...form,monthlyFee:parseFloat(form.monthlyFee),expiresAt:form.expiresAt||null};if(dlg.edit){await api('/api/connections/'+dlg.edit.id,{method:'PUT',body:JSON.stringify(body)});}else{await api('/api/connections',{method:'POST',body:JSON.stringify(body)});}setDlg({open:false,edit:null,customers:[]});fetch();}catch(e:any){alert(e.message);}};
  const del=async(id:string)=>{if(!confirm('Delete?'))return;await api('/api/connections/'+id,{method:'DELETE'});fetch();};
  return(
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 justify-between"><SB value={search} onChange={v=>{setSearch(v);setPage(1);}} placeholder="Search connections..." fo={[{value:'internet',label:'Internet'},{value:'cable',label:'Cable'},{value:'iptv',label:'IPTV'}]} ofc={v=>{setSearch(v);setPage(1);}} fv={''} fl="Type"/>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={openCreate}><Plus className="h-4 w-4 mr-1"/>Add</Button></div>
      <Card className="border-0 shadow-sm"><CardContent className="p-0">
        <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Package</TableHead><TableHead className="hidden sm:table-cell">Type</TableHead><TableHead className="hidden md:table-cell">Fee</TableHead><TableHead className="hidden lg:table-cell">Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
          {loading?Array.from({length:5}).map((_,i)=><SkelR key={i}/>):
          data.length===0?<TableRow><TableCell colSpan={6}><Emp icon={Wifi} title="No connections" desc="Add your first connection"/></TableCell></TableRow>:
          data.map(c=>(
            <TableRow key={c.id}><TableCell className="font-medium">{c.customer?.name||'-'}</TableCell><TableCell>{c.packageName||c.packageType}</TableCell><TableCell className="hidden sm:table-cell"><Badge className={PC[c.packageType]||''}>{c.packageType}</Badge></TableCell><TableCell className="hidden md:table-cell">{fc(c.monthlyFee)}</TableCell><TableCell className="hidden lg:table-cell"><Badge className={SC[c.status]||''}>{c.status}</Badge></TableCell><TableCell className="text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={()=>openEdit(c)}><Edit className="h-4 w-4"/></Button><Button variant="ghost" size="sm" className="text-red-500" onClick={()=>del(c.id)}><Trash2 className="h-4 w-4"/></Button></div></TableCell></TableRow>
          ))}
        </TableBody></Table></div>
        <div className="px-4"><Pag page={page} total={total} limit={20} onPage={setPage}/></div>
      </CardContent></Card>
      <Dialog open={dlg.open} onOpenChange={o=>setDlg({open:o,edit:null,customers:[]})}><DialogContent><DialogHeader><DialogTitle>{dlg.edit?'Edit':'Add'} Connection</DialogTitle></DialogHeader><div className="space-y-3">
        <div><Label>Customer</Label><Select value={form.customerId} onValueChange={v=>setForm({...form,customerId:v})}><SelectTrigger><SelectValue placeholder="Select customer"/></SelectTrigger><SelectContent>{dlg.customers.map(c=><SelectItem key={c.id} value={c.id}>{c.name} - {c.phone}</SelectItem>)}</SelectContent></Select></div>
        <div className="grid grid-cols-2 gap-3"><div><Label>Package Type</Label><Select value={form.packageType} onValueChange={v=>setForm({...form,packageType:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="internet">Internet</SelectItem><SelectItem value="cable">Cable</SelectItem><SelectItem value="iptv">IPTV</SelectItem></SelectContent></Select></div><div><Label>Monthly Fee</Label><Input type="number" value={form.monthlyFee} onChange={e=>setForm({...form,monthlyFee:e.target.value})}/></div></div>
        <div><Label>Package Name</Label><Input value={form.packageName} onChange={e=>setForm({...form,packageName:e.target.value})} placeholder="e.g. Basic 10Mbps"/></div>
        <div><Label>Speed</Label><Input value={form.speed} onChange={e=>setForm({...form,speed:e.target.value})} placeholder="e.g. 10 Mbps"/></div>
        <div className="grid grid-cols-2 gap-3"><div><Label>Status</Label><Select value={form.status} onValueChange={v=>setForm({...form,status:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="expired">Expired</SelectItem><SelectItem value="disconnected">Disconnected</SelectItem></SelectContent></Select></div><div><Label>Expires At</Label><Input type="date" value={form.expiresAt} onChange={e=>setForm({...form,expiresAt:e.target.value})}/></div></div>
        <Button onClick={save} className="w-full bg-emerald-600 hover:bg-emerald-700">Save</Button></div></DialogContent></Dialog>
    </div>);
}

// ===== BILLING =====
function BillingPage({business,refreshBiz}:any){
  const [tab,setTab]=useState('invoices');const [inv,setInv]=useState<Invoice[]>([]);const [pay,setPay]=useState<Payment[]>([]);const [total,setTotal]=useState(0);const [page,setPage]=useState(1);const [search,setSearch]=useState('');const [loading,setLoading]=useState(true);
  const [payDlg,setPayDlg]=useState<{open:boolean;inv:Invoice|null;connections:(Connection&{customer?:{id:string;name:string}})[]}>({open:false,inv:null,connections:[]});
  const [payForm,setPayForm]=useState({connectionId:'',customerId:'',amount:'',method:'cash',note:'',collectedBy:''});
  const [viewInv,setViewInv]=useState<Invoice|null>(null);
  const fetchInv=useCallback(async()=>{setLoading(true);try{const r=await api<PaginatedResponse<Invoice>>(`/api/invoices?page=${page}&limit=20&search=${search}`);setInv(r.data);setTotal(r.total);}catch{}finally{setLoading(false);}},[page,search]);
  const fetchPay=useCallback(async()=>{setLoading(true);try{const r=await api<PaginatedResponse<Payment>>(`/api/payments?page=${page}&limit=20&search=${search}`);setPay(r.data);setTotal(r.total);}catch{}finally{setLoading(false);}},[page,search]);
  useEffect(()=>{if(tab==='invoices')fetchInv();else fetchPay();},[tab,fetchInv,fetchPay]);
  const openPay=async(inv?:Invoice)=>{const cs=(await api<PaginatedResponse<any>>('/api/connections?limit=200')).data;setPayForm({connectionId:inv?.connectionId||'',customerId:inv?.connection?.customerId||'',amount:inv?String(inv.amount):'',method:'cash',note:'',collectedBy:''});setPayDlg({open:true,inv:inv||null,connections:cs});};
  const savePay=async()=>{if(!payForm.connectionId||!payForm.amount)return;try{await api('/api/payments',{method:'POST',body:JSON.stringify({...payForm,amount:parseFloat(payForm.amount),invoiceId:payDlg.inv?.id||null})});setPayDlg({open:false,inv:null,connections:[]});if(tab==='invoices')fetchInv();else fetchPay();}catch(e:any){alert(e.message);}};
  return(
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}><TabsList><TabsTrigger value="invoices">Invoices ({inv.length})</TabsTrigger><TabsTrigger value="payments">Payments ({pay.length})</TabsTrigger></TabsList></Tabs>
      <div className="flex flex-col sm:flex-row gap-2 justify-between"><SB value={search} onChange={v=>{setSearch(v);setPage(1);}} placeholder={tab==='invoices'?'Search invoices...':'Search payments...'}/>
        <div className="flex gap-2 flex-wrap">{tab==='invoices'&&<Button size="sm" variant="outline" onClick={async()=>{const m=prompt('Enter month to generate invoices (YYYY-MM):',new Date().getFullYear()+'-'+String(new Date().getMonth()+1).padStart(2,'0'));if(!m)return;try{const r=await api<{created:number;skipped:number;message:string}>('/api/invoices',{method:'POST',body:JSON.stringify({month:m})});alert(r.message+(r.created?` (${r.created} created)`:''));fetchInv();}catch(e:any){alert(e.message);}}}><FileText className="h-4 w-4 mr-1"/>Generate Invoices</Button>}<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={()=>openPay()}><Plus className="h-4 w-4 mr-1"/>Record Payment</Button></div></div>
      <Card className="border-0 shadow-sm"><CardContent className="p-0">
        {tab==='invoices'?<div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Month</TableHead><TableHead className="hidden sm:table-cell">Package</TableHead><TableHead className="hidden md:table-cell">Amount</TableHead><TableHead className="hidden lg:table-cell">Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
          {loading?Array.from({length:5}).map((_,i)=><SkelR key={i}/>):
          inv.length===0?<TableRow><TableCell colSpan={6}><Emp icon={Receipt} title="No invoices" desc="Invoices are generated for connections"/></TableCell></TableRow>:
          inv.map(i=>(
            <TableRow key={i.id}><TableCell className="font-medium">{i.connection?.customer?.name||'-'}</TableCell><TableCell>{fm(i.month)}</TableCell><TableCell className="hidden sm:table-cell">{i.connection?.packageName||'-'}</TableCell><TableCell className="hidden md:table-cell">{fc(i.amount)}</TableCell><TableCell className="hidden lg:table-cell"><Badge className={SC[i.status]||''}>{i.status}</Badge></TableCell><TableCell className="text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={()=>setViewInv(i)}><Eye className="h-4 w-4"/></Button>{(i.status==='unpaid'||i.status==='overdue')&&<Button variant="ghost" size="sm" className="text-emerald-600" onClick={()=>openPay(i)}><DollarSign className="h-4 w-4"/></Button>}</div></TableCell></TableRow>
          ))}
        </TableBody></Table></div>
        :<div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Customer</TableHead><TableHead className="hidden sm:table-cell">Package</TableHead><TableHead>Amount</TableHead><TableHead className="hidden md:table-cell">Method</TableHead><TableHead className="hidden lg:table-cell">Date</TableHead></TableRow></TableHeader><TableBody>
          {loading?Array.from({length:5}).map((_,i)=><SkelR key={i}/>):
          pay.length===0?<TableRow><TableCell colSpan={5}><Emp icon={CreditCard} title="No payments" desc="Record your first payment"/></TableCell></TableRow>:
          pay.map(p=>(
            <TableRow key={p.id}><TableCell className="font-medium">{p.customer?.name||'-'}</TableCell><TableCell className="hidden sm:table-cell">{p.connection?.packageName||'-'}</TableCell><TableCell>{fc(p.amount)}</TableCell><TableCell className="hidden md:table-cell"><Badge variant="secondary">{p.method||'cash'}</Badge></TableCell><TableCell className="hidden lg:table-cell text-sm text-gray-500">{fdt(p.createdAt)}</TableCell></TableRow>
          ))}
        </TableBody></Table></div>}
        <div className="px-4"><Pag page={page} total={total} limit={20} onPage={setPage}/></div>
      </CardContent></Card>
      <InvoicePreview invoice={viewInv!} biz={business} open={!!viewInv} onOpenChange={o=>{if(!o)setViewInv(null);}}/>
      <Dialog open={payDlg.open} onOpenChange={o=>setPayDlg({open:o,inv:null,connections:[]})}><DialogContent><DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader><div className="space-y-3">
        <div><Label>Connection</Label><Select value={payForm.connectionId} onValueChange={v=>{const c=payDlg.connections.find(x=>x.id===v);setPayForm({...payForm,connectionId:v,customerId:c?.customerId||''});}}><SelectTrigger><SelectValue placeholder="Select connection"/></SelectTrigger><SelectContent>{payDlg.connections.map(c=><SelectItem key={c.id} value={c.id}>{c.customer?.name||'-'} - {c.packageName||c.packageType}</SelectItem>)}</SelectContent></Select></div>
        <div className="grid grid-cols-2 gap-3"><div><Label>Amount</Label><Input type="number" value={payForm.amount} onChange={e=>setPayForm({...payForm,amount:e.target.value})}/></div><div><Label>Method</Label><Select value={payForm.method} onValueChange={v=>setPayForm({...payForm,method:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="jazzcash">JazzCash</SelectItem><SelectItem value="easypaisa">EasyPaisa</SelectItem><SelectItem value="bank">Bank</SelectItem><SelectItem value="online">Online</SelectItem></SelectContent></Select></div></div>
        <div><Label>Collected By</Label><Input value={payForm.collectedBy} onChange={e=>setPayForm({...payForm,collectedBy:e.target.value})} placeholder="Employee name"/></div>
        <div><Label>Note</Label><Input value={payForm.note} onChange={e=>setPayForm({...payForm,note:e.target.value})}/></div>
        <Button onClick={savePay} className="w-full bg-emerald-600 hover:bg-emerald-700">Save Payment</Button></div></DialogContent></Dialog>
    </div>);
}

// ===== VENDORS =====
function VendorsPage({business:_b}:{business:Business}){
  const [data,setData]=useState<Vendor[]>([]);const [total,setTotal]=useState(0);const [page,setPage]=useState(1);const [search,setSearch]=useState('');const [loading,setLoading]=useState(true);
  const [dlg,setDlg]=useState<{open:boolean;edit:Vendor|null}>({open:false,edit:null});
  const [form,setForm]=useState({name:'',phone:'',email:'',address:'',service:'',status:'active'});
  const fetch=useCallback(async()=>{setLoading(true);try{const r=await api<PaginatedResponse<Vendor>>(`/api/vendors?page=${page}&limit=20&search=${search}`);setData(r.data);setTotal(r.total);}catch{}finally{setLoading(false);}},[page,search]);
  useEffect(()=>{fetch();},[fetch]);
  const openCreate=()=>{setForm({name:'',phone:'',email:'',address:'',service:'',status:'active'});setDlg({open:true,edit:null});};
  const openEdit=(v:Vendor)=>{setForm({name:v.name,phone:v.phone,email:v.email||'',address:v.address||'',service:v.service||'',status:v.status});setDlg({open:true,edit:v});};
  const save=async()=>{if(!form.name||!form.phone)return;try{if(dlg.edit){await api('/api/vendors/'+dlg.edit.id,{method:'PUT',body:JSON.stringify(form)});}else{await api('/api/vendors',{method:'POST',body:JSON.stringify(form)});}setDlg({open:false,edit:null});fetch();}catch(e:any){alert(e.message);}};
  const del=async(id:string)=>{if(!confirm('Delete?'))return;await api('/api/vendors/'+id,{method:'DELETE'});fetch();};
  return(
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 justify-between"><SB value={search} onChange={v=>{setSearch(v);setPage(1);}} placeholder="Search vendors..."/><Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={openCreate}><Plus className="h-4 w-4 mr-1"/>Add</Button></div>
      <Card className="border-0 shadow-sm"><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="hidden sm:table-cell">Phone</TableHead><TableHead className="hidden md:table-cell">Service</TableHead><TableHead className="hidden lg:table-cell">Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
        {loading?Array.from({length:5}).map((_,i)=><SkelR key={i}/>):
        data.length===0?<TableRow><TableCell colSpan={5}><Emp icon={Building2} title="No vendors" desc="Add your first vendor"/></TableCell></TableRow>:
        data.map(v=>(<TableRow key={v.id}><TableCell className="font-medium">{v.name}</TableCell><TableCell className="hidden sm:table-cell">{v.phone}</TableCell><TableCell className="hidden md:table-cell">{v.service||'-'}</TableCell><TableCell className="hidden lg:table-cell"><Badge className={SC[v.status]||''}>{v.status}</Badge></TableCell><TableCell className="text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={()=>openEdit(v)}><Edit className="h-4 w-4"/></Button><Button variant="ghost" size="sm" className="text-red-500" onClick={()=>del(v.id)}><Trash2 className="h-4 w-4"/></Button></div></TableCell></TableRow>))}
      </TableBody></Table></div><div className="px-4"><Pag page={page} total={total} limit={20} onPage={setPage}/></div></CardContent></Card>
      <Dialog open={dlg.open} onOpenChange={o=>setDlg({open:o,edit:null})}><DialogContent><DialogHeader><DialogTitle>{dlg.edit?'Edit':'Add'} Vendor</DialogTitle></DialogHeader><div className="space-y-3">
        <div><Label>Name</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
        <div><Label>Phone</Label><Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
        <div><Label>Service</Label><Input value={form.service} onChange={e=>setForm({...form,service:e.target.value})}/></div>
        <div><Label>Email</Label><Input value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
        <div><Label>Address</Label><Input value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></div>
        <Button onClick={save} className="w-full bg-emerald-600 hover:bg-emerald-700">Save</Button></div></DialogContent></Dialog>
    </div>);
}

// ===== EMPLOYEES =====
function EmployeesPage({business:_b}:{business:Business}){
  const [data,setData]=useState<Employee[]>([]);const [total,setTotal]=useState(0);const [page,setPage]=useState(1);const [search,setSearch]=useState('');const [loading,setLoading]=useState(true);
  const [dlg,setDlg]=useState<{open:boolean;edit:Employee|null}>({open:false,edit:null});
  const [form,setForm]=useState({name:'',phone:'',email:'',role:'technician',salary:'',status:'active'});
  const fetch=useCallback(async()=>{setLoading(true);try{const r=await api<PaginatedResponse<Employee>>(`/api/employees?page=${page}&limit=20&search=${search}`);setData(r.data);setTotal(r.total);}catch{}finally{setLoading(false);}},[page,search]);
  useEffect(()=>{fetch();},[fetch]);
  const openCreate=()=>{setForm({name:'',phone:'',email:'',role:'technician',salary:'',status:'active'});setDlg({open:true,edit:null});};
  const openEdit=(e:Employee)=>{setForm({name:e.name,phone:e.phone,email:e.email||'',role:e.role,salary:e.salary?String(e.salary):'',status:e.status});setDlg({open:true,edit:e});};
  const save=async()=>{if(!form.name||!form.phone)return;try{const body={...form,salary:form.salary?parseFloat(form.salary):null};if(dlg.edit){await api('/api/employees/'+dlg.edit.id,{method:'PUT',body:JSON.stringify(body)});}else{await api('/api/employees',{method:'POST',body:JSON.stringify(body)});}setDlg({open:false,edit:null});fetch();}catch(e:any){alert(e.message);}};
  const del=async(id:string)=>{if(!confirm('Delete?'))return;await api('/api/employees/'+id,{method:'DELETE'});fetch();};
  return(
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 justify-between"><SB value={search} onChange={v=>{setSearch(v);setPage(1);}} placeholder="Search employees..."/><Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={openCreate}><Plus className="h-4 w-4 mr-1"/>Add</Button></div>
      <Card className="border-0 shadow-sm"><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="hidden sm:table-cell">Phone</TableHead><TableHead className="hidden md:table-cell">Role</TableHead><TableHead className="hidden lg:table-cell">Salary</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
        {loading?Array.from({length:5}).map((_,i)=><SkelR key={i}/>):
        data.length===0?<TableRow><TableCell colSpan={5}><Emp icon={UserCog} title="No employees" desc="Add team members"/></TableCell></TableRow>:
        data.map(e=>(<TableRow key={e.id}><TableCell className="font-medium">{e.name}</TableCell><TableCell className="hidden sm:table-cell">{e.phone}</TableCell><TableCell className="hidden md:table-cell"><Badge variant="secondary">{e.role}</Badge></TableCell><TableCell className="hidden lg:table-cell">{e.salary?fc(e.salary):'-'}</TableCell><TableCell className="text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={()=>openEdit(e)}><Edit className="h-4 w-4"/></Button><Button variant="ghost" size="sm" className="text-red-500" onClick={()=>del(e.id)}><Trash2 className="h-4 w-4"/></Button></div></TableCell></TableRow>))}
      </TableBody></Table></div><div className="px-4"><Pag page={page} total={total} limit={20} onPage={setPage}/></div></CardContent></Card>
      <Dialog open={dlg.open} onOpenChange={o=>setDlg({open:o,edit:null})}><DialogContent><DialogHeader><DialogTitle>{dlg.edit?'Edit':'Add'} Employee</DialogTitle></DialogHeader><div className="space-y-3">
        <div><Label>Name</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
        <div><Label>Phone</Label><Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
        <div><Label>Email</Label><Input value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
        <div className="grid grid-cols-2 gap-3"><div><Label>Role</Label><Select value={form.role} onValueChange={v=>setForm({...form,role:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="technician">Technician</SelectItem><SelectItem value="collector">Collector</SelectItem><SelectItem value="operator">Operator</SelectItem></SelectContent></Select></div><div><Label>Salary</Label><Input type="number" value={form.salary} onChange={e=>setForm({...form,salary:e.target.value})}/></div></div>
        <Button onClick={save} className="w-full bg-emerald-600 hover:bg-emerald-700">Save</Button></div></DialogContent></Dialog>
    </div>);
}

// ===== EXPENSES =====
function ExpensesPage({business:_b,onBulk}:{business:Business;onBulk:()=>void}){
  const [data,setData]=useState<Expense[]>([]);const [total,setTotal]=useState(0);const [page,setPage]=useState(1);const [search,setSearch]=useState('');const [loading,setLoading]=useState(true);
  const [dlg,setDlg]=useState<{open:boolean;edit:Expense|null}>({open:false,edit:null});
  const [vendors,setVendors]=useState<Vendor[]>([]);const [employees,setEmployees]=useState<Employee[]>([]);
  const [form,setForm]=useState({category:'other',amount:'',description:'',date:new Date().toISOString().slice(0,10),vendorId:'',employeeId:''});
  const fetch=useCallback(async()=>{setLoading(true);try{const r=await api<PaginatedResponse<Expense>>(`/api/expenses?page=${page}&limit=20&search=${search}`);setData(r.data);setTotal(r.total);}catch{}finally{setLoading(false);}},[page,search]);
  useEffect(()=>{fetch();},[fetch]);
  const openCreate=async()=>{const[v,e]=await Promise.all([(await api<PaginatedResponse<Vendor>>('/api/vendors?limit=100')).data,(await api<PaginatedResponse<Employee>>('/api/employees?limit=100')).data]);setVendors(v);setEmployees(e);setForm({category:'other',amount:'',description:'',date:new Date().toISOString().slice(0,10),vendorId:'',employeeId:''});setDlg({open:true,edit:null});};
  const openEdit=async(ex:Expense)=>{const[v,e]=await Promise.all([(await api<PaginatedResponse<Vendor>>('/api/vendors?limit=100')).data,(await api<PaginatedResponse<Employee>>('/api/employees?limit=100')).data]);setVendors(v);setEmployees(e);setForm({category:ex.category,amount:String(ex.amount),description:ex.description||'',date:ex.date.slice(0,10),vendorId:ex.vendorId||'',employeeId:ex.employeeId||''});setDlg({open:true,edit:ex});};
  const save=async()=>{if(!form.amount)return;try{const body={...form,amount:parseFloat(form.amount),vendorId:form.vendorId||null,employeeId:form.employeeId||null};if(dlg.edit){await api('/api/expenses/'+dlg.edit.id,{method:'PUT',body:JSON.stringify(body)});}else{await api('/api/expenses',{method:'POST',body:JSON.stringify(body)});}setDlg({open:false,edit:null});fetch();}catch(e:any){alert(e.message);}};
  const del=async(id:string)=>{if(!confirm('Delete?'))return;await api('/api/expenses/'+id,{method:'DELETE'});fetch();};
  return(
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 justify-between"><SB value={search} onChange={v=>{setSearch(v);setPage(1);}} placeholder="Search expenses..." fo={[{value:'rent',label:'Rent'},{value:'salary',label:'Salary'},{value:'equipment',label:'Equipment'},{value:'maintenance',label:'Maintenance'},{value:'utility',label:'Utility'},{value:'transport',label:'Transport'},{value:'other',label:'Other'}]} ofc={v=>{setSearch(v);setPage(1);}} fv={''} fl="Category"/>
        <div className="flex gap-2"><Button variant="outline" size="sm" onClick={onBulk}><Upload className="h-4 w-4 mr-1"/>Bulk</Button><Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={openCreate}><Plus className="h-4 w-4 mr-1"/>Add</Button></div></div>
      <Card className="border-0 shadow-sm"><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Category</TableHead><TableHead className="hidden sm:table-cell">Description</TableHead><TableHead>Amount</TableHead><TableHead className="hidden md:table-cell">Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
        {loading?Array.from({length:5}).map((_,i)=><SkelR key={i}/>):
        data.length===0?<TableRow><TableCell colSpan={5}><Emp icon={Receipt} title="No expenses" desc="Track your expenses"/></TableCell></TableRow>:
        data.map(e=>(<TableRow key={e.id}><TableCell><Badge variant="secondary">{e.category}</Badge></TableCell><TableCell className="hidden sm:table-cell max-w-48 truncate">{e.description||'-'}</TableCell><TableCell className="font-medium">{fc(e.amount)}</TableCell><TableCell className="hidden md:table-cell text-sm text-gray-500">{fd(e.date)}</TableCell><TableCell className="text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={()=>openEdit(e)}><Edit className="h-4 w-4"/></Button><Button variant="ghost" size="sm" className="text-red-500" onClick={()=>del(e.id)}><Trash2 className="h-4 w-4"/></Button></div></TableCell></TableRow>))}
      </TableBody></Table></div><div className="px-4"><Pag page={page} total={total} limit={20} onPage={setPage}/></div></CardContent></Card>
      <Dialog open={dlg.open} onOpenChange={o=>setDlg({open:o,edit:null})}><DialogContent><DialogHeader><DialogTitle>{dlg.edit?'Edit':'Add'} Expense</DialogTitle></DialogHeader><div className="space-y-3">
        <div className="grid grid-cols-2 gap-3"><div><Label>Category</Label><Select value={form.category} onValueChange={v=>setForm({...form,category:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="rent">Rent</SelectItem><SelectItem value="salary">Salary</SelectItem><SelectItem value="equipment">Equipment</SelectItem><SelectItem value="maintenance">Maintenance</SelectItem><SelectItem value="utility">Utility</SelectItem><SelectItem value="transport">Transport</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div><div><Label>Amount</Label><Input type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></div></div>
        <div><Label>Description</Label><Input value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div>
        <div><Label>Date</Label><Input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div>
        <div className="grid grid-cols-2 gap-3"><div><Label>Vendor</Label><Select value={form.vendorId} onValueChange={v=>setForm({...form,vendorId:v})}><SelectTrigger><SelectValue placeholder="Optional"/></SelectTrigger><SelectContent>{vendors.map(v=><SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent></Select></div><div><Label>Employee</Label><Select value={form.employeeId} onValueChange={v=>setForm({...form,employeeId:v})}><SelectTrigger><SelectValue placeholder="Optional"/></SelectTrigger><SelectContent>{employees.map(e=><SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></div></div>
        <Button onClick={save} className="w-full bg-emerald-600 hover:bg-emerald-700">Save</Button></div></DialogContent></Dialog>
    </div>);
}

// ===== NOTIFICATIONS =====
function NotificationsPage({business:_b}:{business:Business}){
  const [data,setData]=useState<Notif[]>([]);const [loading,setLoading]=useState(true);
  const fetch=useCallback(async()=>{setLoading(true);try{setData((await api<{data:Notif[]}>('/api/notifications?limit=50')).data);}catch{}finally{setLoading(false);}},[]);
  useEffect(()=>{fetch();},[fetch]);
  const markRead=async(id:string)=>{await api('/api/notifications/'+id,{method:'PUT',body:JSON.stringify({isRead:true})});fetch();};
  const del=async(id:string)=>{await api('/api/notifications/'+id,{method:'DELETE'});fetch();};
  return(
    <div className="space-y-4">
      <Card className="border-0 shadow-sm"><CardContent className="p-0"><div className="divide-y">
        {loading?Array.from({length:5}).map((_,i)=><div key={i} className="p-4"><div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"/><div className="h-3 bg-gray-200 rounded animate-pulse w-1/2 mt-2"/></div>):
        data.length===0?<div className="p-8"><Emp icon={Bell} title="No notifications" desc="You're all caught up"/></div>:
        data.map(n=>(
          <div key={n.id} className={'p-4 flex gap-3 hover:bg-gray-50 transition-colors '+(n.isRead?'':'bg-blue-50/50')}>
            <div className={'w-2 h-2 rounded-full mt-2 flex-shrink-0 '+(n.isRead?'bg-gray-300':'bg-blue-500')}/>
            <div className="flex-1 min-w-0"><div className="flex items-start justify-between gap-2"><p className={'text-sm '+(n.isRead?'text-gray-600':'font-medium text-gray-900')}>{n.title}</p><Badge className={SC[n.type]||''} variant="secondary">{n.type}</Badge></div><p className="text-xs text-gray-500 mt-0.5">{n.message}</p><p className="text-xs text-gray-400 mt-1">{fdt(n.createdAt)}</p></div>
            <div className="flex gap-1 flex-shrink-0">{!n.isRead&&<Button variant="ghost" size="sm" onClick={()=>markRead(n.id)}><Check className="h-4 w-4"/></Button>}<Button variant="ghost" size="sm" className="text-red-500" onClick={()=>del(n.id)}><X className="h-4 w-4"/></Button></div>
          </div>
        ))}
      </div></CardContent></Card>
    </div>);
}

// ===== REPORTS =====
function ReportsPage({business:_b}:{business:Business}){
  const [data,setData]=useState<ReportData|null>(null);const [loading,setLoading]=useState(true);
  useEffect(()=>{(async()=>{setLoading(true);try{setData(await api<ReportData>('/api/reports'));}catch{}finally{setLoading(false);}})();},[]);
  if(loading)return <SkelC n={3}/>;
  if(!data)return <Emp icon={BarChart3} title="No data" desc="Add some data to see reports"/>;
  const totalRev=data.revenueByMonth.reduce((s,m)=>s+m.revenue,0);
  const totalExp=data.revenueByMonth.reduce((s,m)=>s+m.expenses,0);
  const totalProfit=totalRev-totalExp;
  return(
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm"><CardContent className="p-5"><div className="flex items-center justify-between"><div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-emerald-600"/></div></div><p className="text-2xl font-bold mt-3">{fc(totalRev)}</p><p className="text-sm text-gray-500">Total Revenue (6mo)</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-5"><div className="flex items-center justify-between"><div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center"><TrendingDown className="h-5 w-5 text-red-600"/></div></div><p className="text-2xl font-bold mt-3">{fc(totalExp)}</p><p className="text-sm text-gray-500">Total Expenses (6mo)</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-5"><div className="flex items-center justify-between"><div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><DollarSign className="h-5 w-5 text-blue-600"/></div></div><p className="text-2xl font-bold mt-3">{fc(totalProfit)}</p><p className="text-sm text-gray-500">Net Profit (6mo)</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-5"><div className="flex items-center justify-between"><div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-amber-600"/></div></div><p className="text-2xl font-bold mt-3">{data.overdueInvoices+data.unpaidInvoices}</p><p className="text-sm text-gray-500">Overdue + Unpaid</p><p className="text-xs text-red-500">{fc(data.overdueAmount+data.unpaidAmount)}</p></CardContent></Card>
      </div>
      <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Revenue, Expenses & Profit Trend</CardTitle></CardHeader><CardContent><div className="h-72"><ResponsiveContainer><AreaChart data={data.revenueByMonth}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="month" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><RTooltip/><Area type="monotone" dataKey="revenue" fill="#10b981" fillOpacity={0.15} stroke="#10b981" name="Revenue"/><Area type="monotone" dataKey="expenses" fill="#ef4444" fillOpacity={0.15} stroke="#ef4444" name="Expenses"/><Area type="monotone" dataKey="profit" fill="#6366f1" fillOpacity={0.15} stroke="#6366f1" name="Profit"/><Line type="monotone" dataKey="collections" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" name="Collections" dot={false}/></AreaChart></ResponsiveContainer></div></CardContent></Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Daily Collections This Month</CardTitle></CardHeader><CardContent><div className="h-56"><ResponsiveContainer><BarChart data={data.dailyCollections}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis tick={{fontSize:11}}/><RTooltip/><Bar dataKey="amount" fill="#10b981" radius={[4,4,0,0]} name="Amount"/></BarChart></ResponsiveContainer></div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Payment Methods</CardTitle></CardHeader><CardContent><div className="h-56 flex items-center justify-center"><ResponsiveContainer><PieChart><Pie data={data.paymentMethods} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="amount" nameKey="method" label>{data.paymentMethods.map((_,i)=><Cell key={i} fill={CC[i%CC.length]}/>)}</Pie><RTooltip/><Legend/></PieChart></ResponsiveContainer></div></CardContent></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Customer Growth</CardTitle></CardHeader><CardContent><div className="h-56"><ResponsiveContainer><LineChart data={data.customerGrowth}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="month" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><RTooltip/><Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} name="Customers" dot={{fill:'#6366f1'}}/></LineChart></ResponsiveContainer></div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Top Customers by Payment</CardTitle></CardHeader><CardContent><div className="space-y-2 max-h-56 overflow-y-auto">{data.topCustomers.length===0?<p className="text-sm text-gray-400 text-center py-8">No payment data</p>:data.topCustomers.map((c,i)=><div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50"><div className="flex items-center gap-3"><span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-medium">{i+1}</span><div><p className="text-sm font-medium">{c.name}</p><p className="text-xs text-gray-500">{c.phone}</p></div></div><span className="font-semibold text-sm">{fc(c.amount)}</span></div>)}</div></CardContent></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Connections by Status</CardTitle></CardHeader><CardContent><div className="h-48"><ResponsiveContainer><PieChart><Pie data={data.connectionsByStatus} cx="50%" cy="50%" innerRadius={35} outerRadius={65} dataKey="count" nameKey="status" label>{data.connectionsByStatus.map((_,i)=><Cell key={i} fill={CC[i%CC.length]}/>)}</Pie><RTooltip/><Legend/></PieChart></ResponsiveContainer></div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Expense Categories</CardTitle></CardHeader><CardContent><div className="h-48"><ResponsiveContainer><BarChart data={data.expenseCategories} layout="vertical"><XAxis type="number" tick={{fontSize:10}}/><YAxis type="category" dataKey="category" tick={{fontSize:10}} width={80}/><RTooltip/><Bar dataKey="amount" fill="#ef4444" radius={[0,4,4,0]}/></BarChart></ResponsiveContainer></div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Collector Performance</CardTitle></CardHeader><CardContent><div className="space-y-2 max-h-48 overflow-y-auto">{data.collectorPerf.length===0?<p className="text-sm text-gray-400 text-center py-6">No data</p>:data.collectorPerf.map((c,i)=><div key={i} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50"><div><p className="text-sm font-medium">{c.collector}</p><p className="text-xs text-gray-500">{c.count} collections</p></div><span className="font-semibold text-sm text-emerald-600">{fc(c.amount)}</span></div>)}</div></CardContent></Card>
      </div>
    </div>);
}

// ===== MESSAGES =====
function MessagesPage({business:_b}:{business:Business}){
  const [customers,setCustomers]=useState<Customer[]>([]);
  const [custFilter,setCustFilter]=useState('');
  const [selectedCust,setSelectedCust]=useState<string>('');
  const [messages,setMessages]=useState<Message[]>([]);
  const [msg,setMsg]=useState('');
  const [channel,setChannel]=useState('inapp');
  const [loadingMsgs,setLoadingMsgs]=useState(false);
  useEffect(()=>{(async()=>{try{setCustomers((await api<PaginatedResponse<Customer>>('/api/customers?limit=200')).data);}catch{}})();},[]);
  const loadMsgs=useCallback(async(custId:string)=>{setSelectedCust(custId);setLoadingMsgs(true);try{const r=await api<{data:Message[]}>(`/api/messages?customerId=${custId}&limit=100`);setMessages(r.data.reverse());}catch{}finally{setLoadingMsgs(false);}},[]);
  const send=async()=>{if(!msg.trim()||!selectedCust)return;try{await api('/api/messages',{method:'POST',body:JSON.stringify({customerId:selectedCust,channel,content:msg.trim(),sendWhatsapp:channel==='whatsapp'})});setMsg('');loadMsgs(selectedCust);}catch(e:any){alert(e.message);}};
  const selected=customers.find(c=>c.id===selectedCust);
  return(
    <div className="flex gap-4 h-[calc(100vh-180px)] min-h-[400px]">
      <div className="w-72 flex-shrink-0 border rounded-xl overflow-hidden flex flex-col bg-white hidden md:flex">
        <div className="p-3 border-b"><input placeholder="Search customers..." value={custFilter} onChange={e=>setCustFilter(e.target.value)} className="w-full text-sm outline-none bg-gray-50 rounded-lg px-3 py-2"/></div>
        <ScrollArea className="flex-1">{customers.filter(c=>!custFilter||c.name.toLowerCase().includes(custFilter.toLowerCase())||c.phone.includes(custFilter)).map(c=>(
          <button key={c.id} onClick={()=>loadMsgs(c.id)} className={'w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 '+(selectedCust===c.id?'bg-emerald-50':'')}>
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0"><User className="h-4 w-4 text-emerald-700"/></div>
            <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{c.name}</p><p className="text-xs text-gray-500 truncate">{c.phone}</p></div>
          </button>
        ))}</ScrollArea>
      </div>
      <div className="flex-1 border rounded-xl overflow-hidden flex flex-col bg-white">
        {!selectedCust?<div className="flex-1 flex items-center justify-center text-gray-400"><div className="text-center"><MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-40"/><p className="text-sm">Select a customer to start messaging</p></div></div>:
        <>
          <div className="p-3 border-b flex items-center gap-3">
            <div className="md:hidden"><button onClick={()=>setSelectedCust('')}><ArrowLeft className="h-5 w-5"/></button></div>
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center"><User className="h-4 w-4 text-emerald-700"/></div>
            <div><p className="font-medium text-sm">{selected?.name}</p><p className="text-xs text-gray-500">{selected?.phone}</p></div>
            <div className="ml-auto"><Select value={channel} onValueChange={setChannel}><SelectTrigger className="w-28 h-8 text-xs"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="inapp">In-App</SelectItem><SelectItem value="whatsapp">WhatsApp</SelectItem><SelectItem value="sms">SMS</SelectItem></SelectContent></Select></div>
          </div>
          <ScrollArea className="flex-1 p-4">
            {loadingMsgs?<div className="flex justify-center py-8"><RefreshCw className="h-5 w-5 animate-spin text-gray-400"/></div>:
            messages.length===0?<div className="text-center py-8 text-gray-400 text-sm">No messages yet. Say hello!</div>:
            messages.map(m=>(
              <div key={m.id} className={'flex mb-3 '+(m.direction==='outgoing'?'justify-end':'justify-start')}>
                <div className={'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm '+(m.direction==='outgoing'?'bg-emerald-600 text-white rounded-br-md':'bg-gray-100 text-gray-800 rounded-bl-md')}>
                  <p>{m.content}</p>
                  <div className={'flex items-center gap-1 mt-1 '+(m.direction==='outgoing'?'text-emerald-200':'text-gray-400')}>
                    <span className="text-[10px]">{fdt(m.createdAt)}</span>
                    {m.channel!=='inapp'&&<span className="text-[10px]">via {m.channel}</span>}
                  </div>
                </div>
              </div>
            ))}
          </ScrollArea>
          <div className="p-3 border-t flex gap-2">
            <div className="md:hidden w-full"><Select value={selectedCust} onValueChange={v=>loadMsgs(v)}><SelectTrigger className="h-8 text-xs mb-2"><SelectValue placeholder="Select customer"/></SelectTrigger><SelectContent>{customers.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <Input value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Type a message..." className="flex-1" onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}}/>
            <Button onClick={send} className="bg-emerald-600 hover:bg-emerald-700" size="icon"><SendHorizonal className="h-4 w-4"/></Button>
          </div>
        </>}
      </div>
    </div>);
}

// ===== BANK ACCOUNTS =====
function BankAccountsPage({business:_b}:{business:Business}){
  const [data,setData]=useState<BankAccount[]>([]);const [loading,setLoading]=useState(true);
  const [dlg,setDlg]=useState<{open:boolean;edit:BankAccount|null}>({open:false,edit:null});
  const [form,setForm]=useState({bankName:'',accountTitle:'',accountNumber:'',branch:'',type:'current',isDefault:false});
  const fetch=useCallback(async()=>{setLoading(true);try{setData((await api<{data:BankAccount[]}>('/api/bank-accounts')).data);}catch{}finally{setLoading(false);}},[]);
  useEffect(()=>{fetch();},[fetch]);
  const openCreate=()=>{setForm({bankName:'',accountTitle:'',accountNumber:'',branch:'',type:'current',isDefault:false});setDlg({open:true,edit:null});};
  const openEdit=(a:BankAccount)=>{setForm({bankName:a.bankName,accountTitle:a.accountTitle,accountNumber:a.accountNumber,branch:a.branch||'',type:a.type,isDefault:a.isDefault});setDlg({open:true,edit:a});};
  const save=async()=>{if(!form.bankName||!form.accountTitle||!form.accountNumber)return;try{if(dlg.edit){await api('/api/bank-accounts/'+dlg.edit.id,{method:'PUT',body:JSON.stringify(form)});}else{await api('/api/bank-accounts',{method:'POST',body:JSON.stringify(form)});}setDlg({open:false,edit:null});fetch();}catch(e:any){alert(e.message);}};
  const del=async(id:string)=>{if(!confirm('Delete this bank account?'))return;try{await api('/api/bank-accounts/'+id,{method:'DELETE'});fetch();}catch(e:any){alert(e.message);}};
  return(
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 justify-between"><div/><Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700" size="sm"><Plus className="h-4 w-4 mr-2"/>Add Account</Button></div>
      <Card className="border-0 shadow-sm"><CardContent className="p-0">
        {loading?Array.from({length:3}).map((_,i)=><div key={i} className="p-4 border-b"><div className="h-5 bg-gray-200 rounded animate-pulse w-1/3"/><div className="h-3 bg-gray-200 rounded animate-pulse w-1/2 mt-2"/></div>):
        data.length===0?<div className="p-8"><Emp icon={Landmark} title="No bank accounts" desc="Add your first bank account"/></div>:
        <div className="divide-y">{data.map(a=>(
          <div key={a.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0"><Landmark className="h-5 w-5 text-blue-600"/></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2"><p className="font-medium text-sm">{a.bankName}</p>{a.isDefault&&<Badge className="bg-emerald-100 text-emerald-700" variant="secondary">Default</Badge>}</div>
              <p className="text-xs text-gray-500 mt-0.5">{a.accountTitle} - {a.accountNumber}</p>
              {a.branch&&<p className="text-xs text-gray-400">Branch: {a.branch}</p>}
            </div>
            <Badge variant="secondary" className="capitalize">{a.type}</Badge>
            <div className="flex gap-1"><Button variant="ghost" size="sm" onClick={()=>openEdit(a)}><Edit className="h-4 w-4"/></Button><Button variant="ghost" size="sm" className="text-red-500" onClick={()=>del(a.id)}><Trash2 className="h-4 w-4"/></Button></div>
          </div>
        ))}</div>}
      </CardContent></Card>
      <Dialog open={dlg.open} onOpenChange={o=>setDlg({open:o,edit:null})}><DialogContent><DialogHeader><DialogTitle>{dlg.edit?'Edit':'Add'} Bank Account</DialogTitle></DialogHeader><div className="space-y-3">
        <div><Label>Bank Name</Label><Input value={form.bankName} onChange={e=>setForm({...form,bankName:e.target.value})} placeholder="HBL, UBL, MCB..."/></div>
        <div><Label>Account Title</Label><Input value={form.accountTitle} onChange={e=>setForm({...form,accountTitle:e.target.value})}/></div>
        <div><Label>Account Number</Label><Input value={form.accountNumber} onChange={e=>setForm({...form,accountNumber:e.target.value})}/></div>
        <div className="grid grid-cols-2 gap-3"><div><Label>Branch</Label><Input value={form.branch} onChange={e=>setForm({...form,branch:e.target.value})}/></div><div><Label>Type</Label><Select value={form.type} onValueChange={v=>setForm({...form,type:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="current">Current</SelectItem><SelectItem value="savings">Savings</SelectItem></SelectContent></Select></div></div>
        <div className="flex items-center justify-between"><Label>Set as Default</Label><button onClick={()=>setForm({...form,isDefault:!form.isDefault})} className={'relative w-11 h-6 rounded-full transition-colors '+(form.isDefault?'bg-emerald-600':'bg-gray-300')}><div className={'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform '+(form.isDefault?'translate-x-[22px] left-0.5':'left-0.5')}/></button></div>
        <Button onClick={save} className="w-full bg-emerald-600 hover:bg-emerald-700">{dlg.edit?'Update':'Add'} Account</Button>
      </div></DialogContent></Dialog>
    </div>);
}

// ===== SETTINGS =====
function SettingsPage({business,refreshBiz}:{business:Business;refreshBiz:()=>void}){
  const [form,setForm]=useState({name:business.name,phone:business.phone||'',address:business.address||'',invoiceTemplate:business.invoiceTemplate||'modern',invoiceColor:business.invoiceColor||'#10b981',whatsappEnabled:business.whatsappEnabled||false,whatsappToken:business.whatsappToken||''});
  const [saving,setSaving]=useState(false);const [logoUploading,setLogoUploading]=useState(false);
  const save=async()=>{setSaving(true);try{await api('/api/business/settings',{method:'PUT',body:JSON.stringify(form)});refreshBiz();}catch(e:any){alert(e.message);}finally{setSaving(false);}};
  const uploadLogo=async()=>{const i=document.createElement('input');i.type='file';i.accept='image/*';i.onchange=async e=>{const f=(e.target as HTMLInputElement).files?.[0];if(!f)return;setLogoUploading(true);const fd=new FormData();fd.append('logo',f);try{await fetch('/api/business/logo',{method:'POST',body:fd});refreshBiz();}catch(e:any){alert(e.message);}finally{setLogoUploading(false);}};i.click();};
  const removeLogo=async()=>{await fetch('/api/business/logo',{method:'DELETE'});refreshBiz();};
  const presets=['#10b981','#6366f1','#ef4444','#f59e0b','#06b6d4','#8b5cf6','#ec4899','#14b8a6','#f97316','#1f2937'];
  return(
    <div className="max-w-2xl space-y-6">
      <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="text-base">Business Profile</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="flex items-center gap-4"><div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">{business.logo?<img src={business.logo} className="w-full h-full object-cover"/>:<Zap className="h-8 w-8 text-gray-400"/>}</div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={uploadLogo} disabled={logoUploading}>{logoUploading?<RefreshCw className="h-4 w-4 animate-spin mr-1"/>:<Image className="h-4 w-4 mr-1"/>}Upload Logo</Button>{business.logo&&<Button variant="outline" size="sm" className="text-red-500" onClick={removeLogo}>Remove</Button>}</div></div>
        <div><Label>Business Name</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><Label>Phone</Label><Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div><div><Label>Address</Label><Input value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></div></div>
        <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving?'Saving...':'Save Changes'}</Button>
      </CardContent></Card>
      <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="text-base">Invoice Settings</CardTitle></CardHeader><CardContent className="space-y-4">
        <div><Label>Template</Label><div className="flex gap-2 mt-1 flex-wrap">{['modern','classic','minimal','bold'].map(t=><button key={t} onClick={()=>setForm({...form,invoiceTemplate:t})} className={'px-4 py-2 rounded-lg text-sm font-medium transition-all '+(form.invoiceTemplate===t?'bg-emerald-600 text-white shadow-md':'bg-gray-100 text-gray-600 hover:bg-gray-200')}>{t}</button>)}</div></div>
        <div><Label>Brand Color</Label><div className="flex gap-2 mt-2 flex-wrap">{presets.map(c=><button key={c} onClick={()=>setForm({...form,invoiceColor:c})} className={'w-8 h-8 rounded-lg transition-transform '+(form.invoiceColor===c?'ring-2 ring-offset-2 ring-gray-400 scale-110':'')} style={{background:c}}/>)}</div><div className="flex items-center gap-2 mt-2"><input type="color" value={form.invoiceColor} onChange={e=>setForm({...form,invoiceColor:e.target.value})} className="w-8 h-8 rounded cursor-pointer"/><span className="text-sm text-gray-500">Custom color</span></div></div>
        <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">Save Invoice Settings</Button>
      </CardContent></Card>
      <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="text-base">WhatsApp Integration</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="flex items-center justify-between"><div><p className="font-medium text-sm">Enable WhatsApp</p><p className="text-xs text-gray-500">Send messages via WhatsApp Business API</p></div><button onClick={()=>setForm({...form,whatsappEnabled:!form.whatsappEnabled})} className={'relative w-11 h-6 rounded-full transition-colors '+(form.whatsappEnabled?'bg-emerald-600':'bg-gray-300')}><div className={'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform '+(form.whatsappEnabled?'translate-x-[22px] left-0.5':'left-0.5')}/></button></div>
        {form.whatsappEnabled&&<div><Label>WhatsApp Token</Label><Input value={form.whatsappToken} onChange={e=>setForm({...form,whatsappToken:e.target.value})} placeholder="Your WhatsApp Business API token"/></div>}
        <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">Save WhatsApp Settings</Button>
      </CardContent></Card>
      <ChangePasswordCard/>
    </div>);
}
function ChangePasswordCard(){
  const [saving,setSaving]=useState(false);
  const [curPw,setCurPw]=useState('');const [newPw,setNewPw]=useState('');const [msg,setMsg]=useState('');
  const save=async()=>{if(!curPw||!newPw||newPw.length<6){setMsg('Fill both fields (min 6 chars)');return;}setSaving(true);setMsg('');try{await api('/api/auth/change-password',{method:'POST',body:JSON.stringify({currentPassword:curPw,newPassword:newPw})});setMsg('Password changed!');setCurPw('');setNewPw('');}catch(e:any){setMsg(e.message);}finally{setSaving(false);}};
  return(
    <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="text-base">Change Password</CardTitle></CardHeader><CardContent className="space-y-3">
      <div><Label>Current Password</Label><Input type="password" value={curPw} onChange={e=>setCurPw(e.target.value)} placeholder="Enter current password"/></div>
      <div><Label>New Password</Label><Input type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="Min 6 characters"/></div>
      {msg&&<p className={msg.includes('changed')?'text-sm text-emerald-600':'text-sm text-red-500'}>{msg}</p>}
      <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving?'Updating...':'Update Password'}</Button>
    </CardContent></Card>);
}
// ===== ADMIN =====
function AdminPage(){
  const [data,setData]=useState<AdminBusinessesResponse|null>(null);const [loading,setLoading]=useState(true);const [page,setPage]=useState(1);const [search,setSearch]=useState('');
  const [editDlg,setEditDlg]=useState<{open:boolean;biz:AdminBusiness|null}>({open:false,biz:null});
  const [form,setForm]=useState({plan:'',isActive:true,trialEndsAt:''});
  const [deepDlg,setDeepDlg]=useState<{open:boolean;bizId:string|null;data:any|null}>({open:false,bizId:null,data:null});
  const fetch=useCallback(async()=>{setLoading(true);try{setData(await api<AdminBusinessesResponse>(`/api/admin/businesses?page=${page}&limit=15&search=${search}`));}catch{}finally{setLoading(false);}},[page,search]);
  useEffect(()=>{fetch();},[fetch]);
  const openEdit=(b:AdminBusiness)=>{setForm({plan:b.plan,isActive:b.isActive,trialEndsAt:b.trialEndsAt?b.trialEndsAt.slice(0,10):''});setEditDlg({open:true,biz:b});};
  const saveEdit=async()=>{if(!editDlg.biz)return;try{await api('/api/admin/businesses/'+editDlg.biz.id,{method:'PUT',body:JSON.stringify({...form,trialEndsAt:form.trialEndsAt||null})});setEditDlg({open:false,biz:null});fetch();}catch(e:any){alert(e.message);}};
  const delBiz=async(id:string)=>{if(!confirm('Delete this business and ALL its data permanently?'))return;await api('/api/admin/businesses/'+id,{method:'DELETE'});fetch();};
  const openDeep=async(id:string)=>{setDeepDlg({open:true,bizId:id,data:null});try{const d=await api<any>('/api/admin/businesses/'+id+'/data');setDeepDlg({open:true,bizId:id,data:d});}catch(e:any){alert(e.message);setDeepDlg({open:false,bizId:null,data:null});}};
  if(!data)return <SkelC n={3}/>;
  const s=data.stats;
  return(
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-0 shadow-sm"><CardContent className="p-4"><p className="text-2xl font-bold">{s.totalBusinesses}</p><p className="text-sm text-gray-500">Businesses</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4"><p className="text-2xl font-bold">{s.totalCustomers}</p><p className="text-sm text-gray-500">Customers</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4"><p className="text-2xl font-bold">{s.totalActiveConnections}</p><p className="text-sm text-gray-500">Connections</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4"><p className="text-2xl font-bold">{fc(s.totalMonthlyRevenue)}</p><p className="text-sm text-gray-500">Monthly Revenue</p></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4"><p className="text-2xl font-bold">{fc(s.totalPaymentsCollected)}</p><p className="text-sm text-gray-500">Total Collected</p></CardContent></Card>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 justify-between"><SB value={search} onChange={v=>{setSearch(v);setPage(1);}} placeholder="Search businesses..."/></div>
      <Card className="border-0 shadow-sm"><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Business</TableHead><TableHead className="hidden sm:table-cell">Plan</TableHead><TableHead className="hidden md:table-cell">Trial Expires</TableHead><TableHead className="hidden lg:table-cell">Customers</TableHead><TableHead className="hidden lg:table-cell">Connections</TableHead><TableHead className="hidden lg:table-cell">Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
        {loading?Array.from({length:5}).map((_,i)=><SkelR key={i} c={7}/>):
        data.data.length===0?<TableRow><TableCell colSpan={7}><Emp icon={Shield} title="No businesses" desc="No tenant businesses yet"/></TableCell></TableRow>:
        data.data.map(b=>{
          const isExpired=b.trialEndsAt&&new Date(b.trialEndsAt)<new Date()&&b.plan==='trial';
          return(
          <TableRow key={b.id}><TableCell><div><p className="font-medium">{b.name}</p><p className="text-xs text-gray-500">{b.email}</p></div></TableCell><TableCell className="hidden sm:table-cell"><Badge variant="secondary">{b.plan}</Badge></TableCell><TableCell className="hidden md:table-cell"><span className={isExpired?'text-red-500 font-medium':''}>{b.trialEndsAt?fd(b.trialEndsAt):'-'}</span></TableCell><TableCell className="hidden lg:table-cell">{b._count.customers}</TableCell><TableCell className="hidden lg:table-cell">{b._count.connections}</TableCell><TableCell className="hidden lg:table-cell"><Badge className={b.isActive?(isExpired?'bg-red-100 text-red-700':'bg-emerald-100 text-emerald-700'):'bg-gray-100 text-gray-600'}>{b.isActive?(isExpired?'Expired':'Active'):'Disabled'}</Badge></TableCell><TableCell className="text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="sm" onClick={()=>openDeep(b.id)}><Eye className="h-4 w-4"/></Button><Button variant="ghost" size="sm" onClick={()=>openEdit(b)}><Edit className="h-4 w-4"/></Button><Button variant="ghost" size="sm" className="text-red-500" onClick={()=>delBiz(b.id)}><Trash2 className="h-4 w-4"/></Button></div></TableCell></TableRow>);
        })}
      </TableBody></Table></div><div className="px-4"><Pag page={page} total={data.total} limit={15} onPage={setPage}/></div></CardContent></Card>
      {/* Edit Dialog with Custom Date */}
      <Dialog open={editDlg.open} onOpenChange={o=>setEditDlg({open:o,biz:null})}><DialogContent><DialogHeader><DialogTitle>Manage: {editDlg.biz?.name}</DialogTitle><DialogDescription>Update plan, status, or assign custom expiry date</DialogDescription></DialogHeader><div className="space-y-4">
        <div><Label>Plan</Label><Select value={form.plan} onValueChange={v=>setForm({...form,plan:v})}><SelectTrigger className="mt-1"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="trial">Trial</SelectItem><SelectItem value="basic">Basic</SelectItem><SelectItem value="pro">Pro</SelectItem><SelectItem value="enterprise">Enterprise</SelectItem></SelectContent></Select></div>
        <div><Label>Custom Expiry / Valid Until Date</Label><p className="text-xs text-gray-500 mb-1">Assign any date - useful when customer purchases a specific duration</p><Input type="date" value={form.trialEndsAt} onChange={e=>setForm({...form,trialEndsAt:e.target.value})}/></div>
        <div className="flex items-center justify-between"><div><Label>Status</Label><p className="text-xs text-gray-500">Active businesses can use the system</p></div><button onClick={()=>setForm({...form,isActive:!form.isActive})} className={'relative w-11 h-6 rounded-full transition-colors '+(form.isActive?'bg-emerald-600':'bg-gray-300')}><div className={'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform '+(form.isActive?'translate-x-[20px] left-0.5':'left-0.5')}/></button></div>
        <Button onClick={saveEdit} className="w-full bg-emerald-600 hover:bg-emerald-700">Save Changes</Button>
      </div></DialogContent></Dialog>
      {/* Deep Dive Dialog */}
      <Dialog open={deepDlg.open} onOpenChange={o=>setDeepDlg({open:o,bizId:null,data:null})}><DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Business Deep Dive</DialogTitle></DialogHeader>
        {deepDlg.data?(
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-lg font-bold">{deepDlg.data.stats.totalCustomers}</p><p className="text-xs text-gray-500">Customers</p></div>
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-lg font-bold">{deepDlg.data.stats.activeConnections}</p><p className="text-xs text-gray-500">Active Conn.</p></div>
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-lg font-bold">{fc(deepDlg.data.stats.monthlyRevenue)}</p><p className="text-xs text-gray-500">Monthly Rev.</p></div>
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-lg font-bold">{fc(deepDlg.data.stats.collectedThisMonth)}</p><p className="text-xs text-gray-500">Collected</p></div>
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-lg font-bold">{fc(deepDlg.data.stats.expensesThisMonth)}</p><p className="text-xs text-gray-500">Expenses</p></div>
            </div>
            <Tabs defaultValue="customers"><TabsList className="w-full"><TabsTrigger value="customers">Customers ({safeMap(deepDlg.data?.customers,c=>c).length})</TabsTrigger><TabsTrigger value="connections">Connections ({safeMap(deepDlg.data?.connections,c=>c).length})</TabsTrigger><TabsTrigger value="payments">Payments ({safeMap(deepDlg.data?.payments,p=>p).length})</TabsTrigger><TabsTrigger value="invoices">Invoices ({safeMap(deepDlg.data?.invoices,i=>i).length})</TabsTrigger><TabsTrigger value="expenses">Expenses ({safeMap(deepDlg.data?.expenses,e=>e).length})</TabsTrigger><TabsTrigger value="employees">Employees ({safeMap(deepDlg.data?.employees,e=>e).length})</TabsTrigger><TabsTrigger value="vendors">Vendors ({safeMap(deepDlg.data?.vendors,v=>v).length})</TabsTrigger></TabsList>
            <TabsContent value="customers"><div className="max-h-64 overflow-y-auto"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{safeMap(deepDlg.data?.customers,c=>c).slice(0,50).map((c:any)=><TableRow key={c.id}><TableCell className="font-medium text-sm">{c.name}</TableCell><TableCell className="text-sm">{c.phone}</TableCell><TableCell><Badge className={SC[c.status]||''} variant="secondary">{c.status}</Badge></TableCell></TableRow>)}</TableBody></Table></div></TabsContent>
            <TabsContent value="connections"><div className="max-h-64 overflow-y-auto"><Table><TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Type</TableHead><TableHead>Fee</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{safeMap(deepDlg.data?.connections,c=>c).slice(0,50).map((c:any)=><TableRow key={c.id}><TableCell className="text-sm">{c.customer?.name||'-'}</TableCell><TableCell><Badge className={PC[c.packageType]||''} variant="secondary">{c.packageType}</Badge></TableCell><TableCell className="text-sm">{fc(c.monthlyFee)}</TableCell><TableCell><Badge className={SC[c.status]||''} variant="secondary">{c.status}</Badge></TableCell></TableRow>)}</TableBody></Table></div></TabsContent>
            <TabsContent value="payments"><div className="max-h-64 overflow-y-auto"><Table><TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Date</TableHead></TableRow></TableHeader><TableBody>{safeMap(deepDlg.data?.payments,p=>p).slice(0,50).map((p:any)=><TableRow key={p.id}><TableCell className="text-sm">{p.customer?.name||'-'}</TableCell><TableCell className="text-sm font-medium">{fc(p.amount)}</TableCell><TableCell className="text-sm">{p.method||'cash'}</TableCell><TableCell className="text-xs text-gray-500">{fdt(p.createdAt)}</TableCell></TableRow>)}</TableBody></Table></div></TabsContent>
            <TabsContent value="invoices"><div className="max-h-64 overflow-y-auto"><Table><TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Month</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{safeMap(deepDlg.data?.invoices,i=>i).slice(0,50).map((i:any)=><TableRow key={i.id}><TableCell className="text-sm">{i.connection?.customer?.name||'-'}</TableCell><TableCell className="text-sm">{i.month}</TableCell><TableCell className="text-sm">{fc(i.amount)}</TableCell><TableCell><Badge className={SC[i.status]||''} variant="secondary">{i.status}</Badge></TableCell></TableRow>)}</TableBody></Table></div></TabsContent>
            <TabsContent value="expenses"><div className="max-h-64 overflow-y-auto"><Table><TableHeader><TableRow><TableHead>Category</TableHead><TableHead>Description</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead></TableRow></TableHeader><TableBody>{safeMap(deepDlg.data?.expenses,e=>e).slice(0,50).map((e:any)=><TableRow key={e.id}><TableCell className="text-sm">{e.category}</TableCell><TableCell className="text-sm">{e.description||'-'}</TableCell><TableCell className="text-sm">{fc(e.amount)}</TableCell><TableCell className="text-xs text-gray-500">{fd(e.date)}</TableCell></TableRow>)}</TableBody></Table></div></TabsContent>
            <TabsContent value="employees"><div className="max-h-64 overflow-y-auto"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Role</TableHead><TableHead>Salary</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{safeMap(deepDlg.data?.employees,e=>e).slice(0,50).map((e:any)=><TableRow key={e.id}><TableCell className="text-sm font-medium">{e.name}</TableCell><TableCell className="text-sm">{e.phone}</TableCell><TableCell className="text-sm"><Badge variant="secondary">{e.role}</Badge></TableCell><TableCell className="text-sm">{e.salary?fc(e.salary):'-'}</TableCell><TableCell><Badge className={SC[e.status]||''} variant="secondary">{e.status}</Badge></TableCell></TableRow>)}</TableBody></Table></div></TabsContent>
            <TabsContent value="vendors"><div className="max-h-64 overflow-y-auto"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Service</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{safeMap(deepDlg.data?.vendors,v=>v).slice(0,50).map((v:any)=><TableRow key={v.id}><TableCell className="text-sm font-medium">{v.name}</TableCell><TableCell className="text-sm">{v.phone}</TableCell><TableCell className="text-sm">{v.service||'-'}</TableCell><TableCell><Badge className={SC[v.status]||''} variant="secondary">{v.status}</Badge></TableCell></TableRow>)}</TableBody></Table></div></TabsContent>
            </Tabs>
          </div>
        ):<div className="text-center py-8"><RefreshCw className="h-6 w-6 animate-spin mx-auto text-gray-400"/><p className="text-sm text-gray-500 mt-2">Loading...</p></div>}
      </DialogContent></Dialog>
    </div>);
}
// ===== MAIN APP =====
const NAV:Record<string,Record<string,any>> = {
  dashboard:{icon:LayoutDashboard,label:'Dashboard'},
  customers:{icon:Users,label:'Customers'},
  connections:{icon:Wifi,label:'Connections'},
  billing:{icon:Receipt,label:'Billing'},
  expenses:{icon:Receipt,label:'Expenses'},
  vendors:{icon:Building2,label:'Vendors'},
  employees:{icon:UserCog,label:'Employees'},
  'bank-accounts':{icon:Landmark,label:'Bank Accounts'},
  reports:{icon:BarChart3,label:'Reports'},
  messages:{icon:MessageSquare,label:'Messages'},
  notifications:{icon:Bell,label:'Notifications'},
  settings:{icon:Settings,label:'Settings'},
};

export default function Home(){
  const [business,setBusiness]=useState<Business|null>(null);const [loading,setLoading]=useState(true);const [page,setPage]=useState<Page>('dashboard');
  const [searchOpen,setSearchOpen]=useState(false);const [sidebarOpen,setSidebarOpen]=useState(false);const [bulkOpen,setBulkOpen]=useState(false);const [notifCount,setNotifCount]=useState(0);
  const [bizForRefresh,setBizForRefresh]=useState(0);

  useEffect(()=>{(async()=>{try{const b=await api<Business>('/api/auth/me');if(b){setBusiness(b);if(b.isPlatformAdmin)setPage('admin');}}catch{}})().finally(()=>setLoading(false));},[]);

  const refreshBiz=useCallback(async()=>{try{const b=await api<Business>('/api/auth/me');setBusiness(b);setBizForRefresh(x=>x+1);}catch{}},[]);

  useEffect(()=>{if(!business)return;(async()=>{try{const ns=await api<{unreadCount:number}>('/api/notifications?limit=1');setNotifCount(ns.unreadCount||0);}catch{}})();},[business,page,bizForRefresh]);

  // Keyboard shortcut for search
  useEffect(()=>{const handler=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();setSearchOpen(true);}};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);},[]);

  if(loading)return <div className="min-h-screen flex items-center justify-center bg-gray-50"><RefreshCw className="h-8 w-8 animate-spin text-emerald-600"/></div>;
  if(!business)return <AuthScreen onLogin={setBusiness}/>;

  const navItems=Object.entries(NAV);
  const unreadNotif=notifCount>0;

  const renderPage=()=>{
    switch(page){
      case 'dashboard':return <ErrBound><DashboardPage business={business}/></ErrBound>;
      case 'customers':return <ErrBound><CustomersPage business={business} onBulk={()=>setBulkOpen(true)}/></ErrBound>;
      case 'connections':return <ErrBound><ConnectionsPage business={business}/></ErrBound>;
      case 'billing':return <ErrBound><BillingPage business={business} refreshBiz={refreshBiz}/></ErrBound>;
      case 'expenses':return <ErrBound><ExpensesPage business={business} onBulk={()=>setBulkOpen(true)}/></ErrBound>;
      case 'vendors':return <ErrBound><VendorsPage business={business}/></ErrBound>;
      case 'employees':return <ErrBound><EmployeesPage business={business}/></ErrBound>;
      case 'bank-accounts':return <ErrBound><BankAccountsPage business={business}/></ErrBound>;
      case 'reports':return <ErrBound><ReportsPage business={business}/></ErrBound>;
      case 'messages':return <ErrBound><MessagesPage business={business}/></ErrBound>;
      case 'notifications':return <ErrBound><NotificationsPage business={business}/></ErrBound>;
      case 'settings':return <ErrBound><SettingsPage business={business} refreshBiz={refreshBiz}/></ErrBound>;
      case 'admin':return <ErrBound><AdminPage/></ErrBound>;
      default:return <ErrBound><DashboardPage business={business}/></ErrBound>;
    }
  };

  return(
    <TooltipProvider><div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar overlay on mobile */}
      {sidebarOpen&&<div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={()=>setSidebarOpen(false)}/>}
      {/* Sidebar */}
      <aside className={'fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r flex flex-col transition-transform duration-200 '+(sidebarOpen?'translate-x-0':'-translate-x-full lg:translate-x-0')}>
        <div className="p-4 border-b flex items-center gap-3">
          {business.logo?<img src={business.logo} className="h-9 w-9 rounded-lg object-cover"/>:<div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white"><Zap className="h-5 w-5"/></div>}
          <div className="flex-1 min-w-0"><p className="font-bold text-sm truncate">{business.name}</p><p className="text-xs text-gray-500 truncate">{business.plan}</p></div>
          <button className="lg:hidden" onClick={()=>setSidebarOpen(false)}><X className="h-5 w-5"/></button>
        </div>
        <ScrollArea className="flex-1 py-2 px-2">
          <nav className="space-y-0.5">
            {business.isPlatformAdmin&&(
              <button onClick={()=>{setPage('admin');setSidebarOpen(false);}} className={'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors '+(page==='admin'?'bg-emerald-50 text-emerald-700 font-medium':'text-gray-700 hover:bg-gray-100')}>
                <Shield className="h-4 w-4"/><span>Super Admin</span>
              </button>
            )}
            {navItems.map(([key,{icon:I,label}])=>(
              <button key={key} onClick={()=>{setPage(key as Page);setSidebarOpen(false);}} className={'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors '+(page===key?'bg-emerald-50 text-emerald-700 font-medium':'text-gray-700 hover:bg-gray-100')}>
                <I className="h-4 w-4"/><span>{label}</span>
                {key==='notifications'&&unreadNotif&&<span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">{notifCount}</span>}
              </button>
            ))}
          </nav>
        </ScrollArea>
        <div className="p-3 border-t">
          <button onClick={async()=>{await fetch('/api/auth/logout',{method:'POST'});setBusiness(null);}} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="h-4 w-4"/><span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b px-4 py-3 flex items-center gap-3">
          <button className="lg:hidden" onClick={()=>setSidebarOpen(true)}><Menu className="h-5 w-5"/></button>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
            <input onClick={()=>setSearchOpen(true)} readOnly placeholder="Search... (Ctrl+K)" className="w-full bg-gray-50 rounded-lg pl-9 pr-3 py-2 text-sm outline-none cursor-pointer hover:bg-gray-100 transition-colors"/>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setPage('notifications')} className="relative p-2 rounded-lg hover:bg-gray-100"><Bell className="h-5 w-5 text-gray-600"/>{unreadNotif&&<span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"></span>}</button>
            <button onClick={()=>setPage('messages')} className="relative p-2 rounded-lg hover:bg-gray-100"><MessageSquare className="h-5 w-5 text-gray-600"/></button>
          </div>
        </header>
        <div className="p-4 lg:p-6">{renderPage()}</div>
      </main>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} onNav={setPage}/>
      <BulkUploadDlg open={bulkOpen} onOpenChange={setBulkOpen} onDone={()=>setBizForRefresh(x=>x+1)}/>
    </div></TooltipProvider>);
}
