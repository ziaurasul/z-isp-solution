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
  LayoutDashboard, PieChart as PieChartIcon, Template, ChevronDown
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
  AdminBusiness, AdminStats, AdminBusinessesResponse, Message, ReportData
} from '@/lib/types';

const CHART_COLORS = ['#10b981', '#f59e0b', '#6366f1', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const PKG_ICON: Record<string, React.ReactNode> = { internet: <Wifi className="h-4 w-4" />, cable: <Cable className="h-4 w-4" />, iptv: <Tv className="h-4 w-4" /> };
const PKG_COL: Record<string, string> = { internet: 'bg-emerald-100 text-emerald-700', cable: 'bg-amber-100 text-amber-700', iptv: 'bg-violet-100 text-violet-700' };
const ST_COL: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700', inactive: 'bg-gray-100 text-gray-600', suspended: 'bg-red-100 text-red-700',
  expired: 'bg-amber-100 text-amber-700', disconnected: 'bg-red-100 text-red-700',
  paid: 'bg-emerald-100 text-emerald-700', unpaid: 'bg-red-100 text-red-700', overdue: 'bg-orange-100 text-orange-700', partial: 'bg-amber-100 text-amber-700',
};
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface SearchResult { type: string; id: string; title: string; subtitle: string; extra: string; }
interface AdminBizDetail {
  business: { id: string; name: string; email: string; phone: string | null; address: string | null; plan: string; isActive: boolean; isPlatformAdmin: boolean; createdAt: string; };
  customers: Customer[]; connections: (Connection & { customer?: { id: string; name: string; phone: string } })[];
  invoices: Invoice[]; payments: Payment[]; expenses: Expense[]; employees: Employee[]; vendors: Vendor[]; notifications: Notif[];
  stats: { totalCustomers: number; activeConnections: number; monthlyRevenue: number; collectedThisMonth: number; expensesThisMonth: number; unpaidInvoices: number };
}

async function api<T>(path: string, opts?: RequestInit): Promise<T> {
  const r = await fetch(path, { ...opts, headers: { 'Content-Type': 'application/json', ...opts?.headers } });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Request failed'); }
  return r.json();
}
const fmtCur = (n: number) => 'Rs ' + Number(n || 0).toLocaleString();
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
const fmtDT = (d: string) => d ? new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

function SkelRow({ cols = 5 }: { cols?: number }) { return <TableRow>{Array.from({ length: cols }).map((_, i) => <TableCell key={i}><div className="h-4 bg-gray-200 rounded animate-pulse w-full" /></TableCell>)}</TableRow>; }
function SkelCards({ count = 4 }: { count?: number }) { return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: count }).map((_, i) => <Card key={i} className="border-0 shadow-sm"><CardContent className="p-5"><div className="h-10 w-10 bg-gray-200 rounded-xl animate-pulse" /><div className="mt-3 h-7 w-28 bg-gray-200 rounded animate-pulse" /><div className="mt-2 h-4 w-36 bg-gray-200 rounded animate-pulse" /></CardContent></Card>)}</div>; }
function Empty({ icon: I, title, desc }: { icon: React.ElementType; title: string; desc: string }) { return <div className="flex flex-col items-center justify-center py-12 text-center"><div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4"><I className="h-7 w-7 text-gray-400" /></div><p className="font-medium text-gray-600">{title}</p><p className="text-sm text-gray-400 mt-1">{desc}</p></div>; }

function Pagination({ page, total, limit, onPageChange }: { page: number; total: number; limit: number; onPageChange: (p: number) => void }) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  return <div className="flex items-center justify-between mt-4"><p className="text-sm text-gray-500">{total} total</p><div className="flex items-center gap-1"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft className="h-4 w-4" /></Button><span className="text-sm px-2">{page} / {pages}</span><Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onPageChange(page + 1)}><ChevronRight className="h-4 w-4" /></Button></div></div>;
}

function SearchBar({ value, onChange, placeholder, filterValue, onFilterChange, filterOptions, filterLabel }: { value: string; onChange: (v: string) => void; placeholder: string; filterValue?: string; onFilterChange?: (v: string) => void; filterOptions?: { value: string; label: string }[]; filterLabel?: string }) {
  return <div className="flex flex-col sm:flex-row gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} className="pl-9" /></div>{filterOptions && onFilterChange && <Select value={filterValue || ''} onValueChange={onFilterChange}><SelectTrigger className="w-full sm:w-44"><SelectValue placeholder={filterLabel || 'Filter'} /></SelectTrigger><SelectContent>{filterOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>}</div>;
}

// ==================== AUTH ====================
function AuthScreen({ onLogin }: { onLogin: (b: Business) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', businessName: '' });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { const b = await api<Business>(isLogin ? '/api/auth/login' : '/api/auth/signup', { method: 'POST', body: JSON.stringify(form) }); onLogin(b); }
    catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8"><div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 text-white mb-4 shadow-lg shadow-emerald-200"><Zap className="h-8 w-8" /></div><h1 className="text-3xl font-bold text-gray-900">Z ISP Solution</h1><p className="text-gray-500 mt-1">Manage your ISP business efficiently</p></div>
        <Card className="shadow-xl border-0 shadow-emerald-100/50"><CardContent className="pt-6">
          <Tabs value={isLogin ? 'login' : 'signup'} onValueChange={v => { setIsLogin(v === 'login'); setError(''); }}>
            <TabsList className="grid w-full grid-cols-2 mb-6"><TabsTrigger value="login">Sign In</TabsTrigger><TabsTrigger value="signup">Sign Up</TabsTrigger></TabsList>
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && <><div><Label>Business Name</Label><Input placeholder="Your ISP name" value={form.businessName} onChange={e => setForm(p => ({ ...p, businessName: e.target.value }))} required /></div><div><Label>Your Name</Label><Input placeholder="Full name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></div></>}
              <div><Label>Email</Label><Input type="email" placeholder="email@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required /></div>
              <div><Label>Password</Label><Input type="password" placeholder="Min 6 characters" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={6} /></div>
              {!isLogin && <div><Label>Phone</Label><Input placeholder="03XX-XXXXXXX" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>}
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>{loading && <RefreshCw className="h-4 w-4 animate-spin mr-2" />}{isLogin ? 'Sign In' : 'Create Account'}</Button>
            </form>
          </Tabs>
        </CardContent></Card>
        <p className="text-center text-xs text-gray-400 mt-6">Powered by Zee Technologies</p>
      </div>
    </div>
  );
}

// ==================== GLOBAL SEARCH ====================
function GlobalSearch({ open, onOpenChange, onNav }: { open: boolean; onOpenChange: (o: boolean) => void; onNav: (p: Page) => void }) {
  const [q, setQ] = useState(''); const [results, setResults] = useState<SearchResult[]>([]); const [searching, setSearching] = useState(false); const [sel, setSel] = useState(-1); const ref = useRef<HTMLInputElement>(null); const debRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => { if (open) { setQ(''); setResults([]); setSel(-1); setTimeout(() => ref.current?.focus(), 100); } }, [open]);
  const doSearch = useCallback(async (s: string) => { if (!s.trim()) { setResults([]); return; } setSearching(true); try { const r = await api<{ results: SearchResult[] }>(`/api/search?q=${encodeURIComponent(s.trim())}`); setResults(r.results); setSel(-1); } catch {} finally { setSearching(false); } }, []);
  const handleInput = (v: string) => { setQ(v); if (debRef.current) clearTimeout(debRef.current); debRef.current = setTimeout(() => doSearch(v), 300); };
  const tIcon: Record<string, React.ReactNode> = { customer: <User className="h-4 w-4 text-blue-500" />, connection: <Wifi className="h-4 w-4 text-emerald-500" />, payment: <DollarSign className="h-4 w-4 text-amber-500" />, invoice: <FileText className="h-4 w-4 text-violet-500" />, vendor: <Building2 className="h-4 w-4 text-cyan-500" />, employee: <UserCog className="h-4 w-4 text-purple-500" /> };
  const tCol: Record<string, string> = { customer: 'bg-blue-100 text-blue-700', connection: 'bg-emerald-100 text-emerald-700', payment: 'bg-amber-100 text-amber-700', invoice: 'bg-violet-100 text-violet-700', vendor: 'bg-cyan-100 text-cyan-700', employee: 'bg-purple-100 text-purple-700' };
  const tLbl: Record<string, string> = { customer: 'Customer', connection: 'Connection', payment: 'Payment', invoice: 'Invoice', vendor: 'Vendor', employee: 'Employee' };
  const pMap: Record<string, Page> = { customer: 'customers', connection: 'connections', payment: 'billing', invoice: 'billing', vendor: 'vendors', employee: 'employees' };
  const groups = Object.entries(results.reduce((acc, r) => { (acc[r.type] = acc[r.type] || []).push(r); return acc; }, {} as Record<string, SearchResult[]>));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0">
      <div className="flex items-center border-b px-4 py-3 gap-3"><Search className="h-5 w-5 text-gray-400 flex-shrink-0" /><Input ref={ref} value={q} onChange={e => handleInput(e.target.value)} placeholder="Search everything... (Ctrl+K)" className="border-0 shadow-none focus-visible:ring-0" /><kbd className="hidden sm:inline-flex rounded border border-gray-300 bg-gray-100 px-2 py-0.5 text-xs text-gray-500 font-mono">ESC</kbd></div>
      <div className="px-4 py-2 max-h-[60vh] overflow-y-auto">
        {searching && <div className="flex items-center justify-center py-8"><RefreshCw className="h-5 w-5 animate-spin text-emerald-600 mr-2" />Searching...</div>}
        {!searching && q && results.length === 0 && <Empty icon={Inbox} title="No results" desc="Try a different term" />}
        {!searching && groups.map(([k, items]) => <div key={k} className="mb-4"><p className="text-xs font-semibold text-gray-400 uppercase mb-2">{tLbl[k] || k}s</p>{items.map(item => <button key={item.id} onClick={() => { onNav(pMap[item.type] || 'customers'); onOpenChange(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-gray-50 cursor-pointer"><div className="flex-shrink-0">{tIcon[item.type]}</div><div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 truncate">{item.title}</p><p className="text-xs text-gray-500 truncate">{item.subtitle}</p></div><Badge className={'text-[10px] px-1.5 py-0 ' + (tCol[item.type])}>{tLbl[item.type]}</Badge></button>)}</div>)}
        {!searching && !q && <Empty icon={Search} title="Type to search" desc="Search across all data" />}
      </div>
    </DialogContent></Dialog>
  );
}

// ==================== ADMIN DEEP DIVE ====================
function AdminDeepDive({ bizId, bizName, open, onOpenChange }: { bizId: string; bizName: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [data, setData] = useState<AdminBizDetail | null>(null); const [loading, setLoading] = useState(false); const [tab, setTab] = useState('customers');
  useEffect(() => { if (open && bizId) { setLoading(true); setTab('customers'); api<AdminBizDetail>(`/api/admin/businesses/${bizId}/data`).then(setData).catch(() => {}).finally(() => setLoading(false)); } if (!open) setData(null); }, [open, bizId]);
  if (!open) return null;
  const stats = data ? [
    { l: 'Customers', v: data.stats.totalCustomers, i: <Users className="h-4 w-4" />, c: 'text-blue-600 bg-blue-50' },
    { l: 'Active', v: data.stats.activeConnections, i: <Wifi className="h-4 w-4" />, c: 'text-emerald-600 bg-emerald-50' },
    { l: 'Revenue', v: fmtCur(data.stats.monthlyRevenue), i: <DollarSign className="h-4 w-4" />, c: 'text-amber-600 bg-amber-50' },
    { l: 'Collected', v: fmtCur(data.stats.collectedThisMonth), i: <TrendingUp className="h-4 w-4" />, c: 'text-violet-600 bg-violet-50' },
    { l: 'Expenses', v: fmtCur(data.stats.expensesThisMonth), i: <CreditCard className="h-4 w-4" />, c: 'text-red-600 bg-red-50' },
    { l: 'Unpaid', v: data.stats.unpaidInvoices, i: <AlertTriangle className="h-4 w-4" />, c: 'text-orange-600 bg-orange-50' },
  ] : [];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
      {loading ? <div className="flex items-center justify-center py-16"><RefreshCw className="h-8 w-8 animate-spin text-emerald-600" /></div> : data ? <div className="space-y-6">
        <div><div className="flex items-center gap-3 mb-1"><div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700"><Building2 className="h-5 w-5" /></div><div><DialogTitle className="text-xl">{data.business.name}</DialogTitle><DialogDescription>{data.business.email} {data.business.phone ? `| ${data.business.phone}` : ''}</DialogDescription></div></div><div className="flex flex-wrap gap-2 mt-3"><Badge>{data.business.plan}</Badge><Badge className={data.business.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>{data.business.isActive ? 'Active' : 'Disabled'}</Badge></div></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">{stats.map((s,i)=>(<div key={i} className="rounded-xl border bg-white p-3"><div className={'p-1.5 rounded-lg ' + (s.c) + ' w-fit'}>{s.i}</div><p className="mt-2 text-lg font-bold">{s.v}</p><p className="text-xs text-gray-500">{s.l}</p></div>))}</div>
        <Tabs value={tab} onValueChange={setTab}><TabsList className="flex flex-wrap h-auto gap-1">
          {['customers','connections','payments','invoices','expenses','employees','vendors','notifications'].map(t => <TabsTrigger key={t} value={t}>{t} ({(data as any)[t]?.length || 0})</TabsTrigger>)}
        </TabsList>
        {['customers','connections','payments','invoices','expenses','employees','vendors','notifications'].map(t => <TabsContent key={t} value={t}><Card className="border-0 shadow-sm"><CardContent className="p-0"><Table><TableHeader><TableRow>{t==='customers'?<><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead></>:t==='connections'?<><TableHead>Customer</TableHead><TableHead>Type</TableHead><TableHead>Fee</TableHead><TableHead>Status</TableHead></>:t==='payments'?<><TableHead>Customer</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead></>:t==='invoices'?<><TableHead>Month</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></>:t==='expenses'?<><TableHead>Category</TableHead><TableHead>Amount</TableHead></>:t==='employees'?<><TableHead>Name</TableHead><TableHead>Role</TableHead></>:t==='vendors'?<><TableHead>Name</TableHead><TableHead>Service</TableHead></>:<><TableHead>Title</TableHead><TableHead>Type</TableHead></>}</TableRow></TableHeader><TableBody>
            {(data as any)[t]?.length === 0 ? <TableRow><TableCell colSpan={4}><Empty icon={Users} title="No data" desc="" /></TableCell></TableRow> :
            (data as any)[t]?.map((r: any, i: number) => <TableRow key={r.id}><TableCell className="font-medium">{t==='customers'||t==='employees'?<div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">{r.name?.[0]}</div>{r.name}</div>:t==='payments'?r.customer?.name||'N/A':t==='invoices'?r.connection?.customer?.name||'N/A':t==='connections'?r.customer?.name||'N/A':t==='expenses'?r.category:r.title||r.name||'-'}</TableCell>{t==='customers'&&<TableCell>{r.phone}</TableCell>}{t==='customers'&&<TableCell><Badge className={ST_COL[r.status]||''}>{r.status}</Badge></TableCell>}{t==='connections'&&<TableCell><Badge className={PKG_COL[r.packageType]}>{r.packageType}</Badge></TableCell>}{t==='connections'&&<TableCell>{fmtCur(r.monthlyFee)}</TableCell>}{t==='connections'&&<TableCell><Badge className={ST_COL[r.status]}>{r.status}</Badge></TableCell>}{t==='payments'&&<TableCell className="text-emerald-600 font-medium">{fmtCur(r.amount)}</TableCell>}{t==='payments'&&<TableCell><Badge variant="outline">{r.method||'N/A'}</Badge></TableCell>}{t==='invoices'&&<TableCell>{r.month}</TableCell>}{t==='invoices'&&<TableCell>{fmtCur(r.amount)}</TableCell>}{t==='invoices'&&<TableCell><Badge className={ST_COL[r.status]}>{r.status}</Badge></TableCell>}{t==='expenses'&&<TableCell className="text-red-600 font-medium">{fmtCur(r.amount)}</TableCell>}{t==='employees'&&<TableCell className="capitalize">{r.role}</TableCell>}{t==='vendors'&&<TableCell>{r.service||'-'}</TableCell>}{t==='notifications'&&<TableCell className="capitalize text-sm">{r.type}</TableCell>}</TableRow>)
          }</TableBody></Table></CardContent></Card></TabsContent>)}
      </Tabs></div> : null}
    </DialogContent></Dialog>
  );
}

// ==================== BULK UPLOAD ====================
function BulkUpload({ type, open, onOpenChange, onSuccess }: { type: string; open: boolean; onOpenChange: (o: boolean) => void; onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null); const [uploading, setUploading] = useState(false); const [result, setResult] = useState<{ created: number; errors: { row: number; message: string }[]; total: number } | null>(null);
  const handleUpload = async () => {
    if (!file) return; setUploading(true); setResult(null);
    const fd = new FormData(); fd.append('file', file); fd.append('type', type);
    try { const r = await fetch('/api/upload/bulk', { method: 'POST', body: fd }); const d = await r.json(); setResult(d); if (d.created > 0) onSuccess(); } catch (e: any) { setResult({ created: 0, errors: [{ row: 0, message: e.message }], total: 0 }); } finally { setUploading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>Bulk Upload {type}</DialogTitle><DialogDescription>Upload CSV or Excel file with {type} data</DialogDescription></DialogHeader>
      <div className="space-y-4">
        <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => window.open(`/api/upload/template?type=${type}`, '_blank')}><Download className="h-4 w-4 mr-2" />Download Sample Template</Button></div>
        <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-emerald-400 transition-colors" onClick={() => (document.getElementById('bulk-file') as HTMLInputElement)?.click()}>
          <input id="bulk-file" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => { setFile(e.target.files?.[0] || null); setResult(null); }} />
          {file ? <div><FileSpreadsheet className="h-10 w-10 text-emerald-600 mx-auto mb-2" /><p className="font-medium">{file.name}</p><p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p></div> : <div><Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" /><p className="text-sm text-gray-500">Click to select CSV or Excel file</p><p className="text-xs text-gray-400">Max 500 rows</p></div>}
        </div>
        {result && <div className="rounded-lg border p-3 space-y-2"><div className="flex gap-4 text-sm"><span className="text-emerald-600 font-medium">{result.created} created</span><span className="text-gray-500">{result.total} total</span>{result.errors.length > 0 && <span className="text-red-600">{result.errors.length} errors</span>}</div>
          {result.errors.length > 0 && <div className="max-h-32 overflow-y-auto"><p className="text-xs font-medium text-gray-500 mb-1">Errors:</p>{result.errors.slice(0, 10).map((e, i) => <p key={i} className="text-xs text-red-600">Row {e.row}: {e.message}</p>)}{result.errors.length > 10 && <p className="text-xs text-gray-400">...and {result.errors.length - 10} more</p>}</div>}
        </div>}
        <Button onClick={handleUpload} disabled={!file || uploading} className="w-full bg-emerald-600 hover:bg-emerald-700">{uploading ? <><RefreshCw className="h-4 w-4 animate-spin mr-2" />Uploading...</> : <><Upload className="h-4 w-4 mr-2" />Upload</>}</Button>
      </div>
    </DialogContent></Dialog>
  );
}

function getHeaderStyle(tpl: string, color: string): React.CSSProperties {
  if (tpl === 'minimal') return { borderBottom: '3px solid ' + color };
  if (tpl === 'bold') return { background: '#1f2937' };
  if (tpl === 'classic') return { background: color };
  if (tpl === 'modern') return { background: 'linear-gradient(135deg, ' + color + ', ' + color + 'cc)' };
  return {};
}

// ==================== INVOICE PREVIEW ====================
function InvoicePreview({ invoice, biz, open, onOpenChange }: { invoice: Invoice; biz: Business; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [tpl, setTpl] = useState(biz.invoiceTemplate || 'modern');
  const color = biz.invoiceColor || '#10b981';
  const cust = invoice.connection?.customer;
  const conn = invoice.connection;
  const invNo = invoice.id.slice(-8).toUpperCase();
  const printInv = () => { const el = document.getElementById('inv-print'); if (!el) return; const w = window.open('', '_blank'); if (!w) return; w.document.write(`<!DOCTYPE html><html><head><title>Invoice</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;padding:20px}@media print{@page{margin:10mm}}</style></head><body>${el.innerHTML}</body></html>`); w.document.close(); setTimeout(() => w.print(), 500); };
  if (!open) return null;
  const tplStyles: Record<string, string> = { modern: `background:linear-gradient(135deg,${color},${color}dd)`, classic: `background:${color}`, minimal: `border-bottom:3px solid ${color}`, bold: `background:#1f2937` };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Invoice Preview</DialogTitle></DialogHeader>
      <div className="flex gap-2 mb-4">{['modern','classic','minimal','bold'].map(t => <button key={t} onClick={() => setTpl(t)} className={'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ' + (tpl === t ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>{t}</button>)}</div>
      <div id="inv-print">
        <div className="rounded-xl overflow-hidden border shadow-sm">
          <div className={'px-6 py-5 text-white ' + (tpl === 'minimal' ? 'bg-white text-gray-900 px-6 py-3' : '')} style={getHeaderStyle(tpl, color)}>
            <div className="flex items-center justify-between">
              <div className={tpl === 'minimal' ? '' : ''}>
                {biz.logo ? <img src={biz.logo} className="h-10 w-10 rounded-lg object-cover mb-2" alt="" /> : null}
                <h2 className={'text-xl font-bold ' + (tpl === 'minimal' ? 'text-gray-900' : '')}>{biz.name}</h2>
                {biz.address && <p className={'text-sm opacity-80 ' + (tpl === 'minimal' ? 'text-gray-500' : '')}>{biz.address}</p>}
                {biz.phone && <p className={'text-sm opacity-80 ' + (tpl === 'minimal' ? 'text-gray-500' : '')}>{biz.phone}</p>}
              </div>
              <div className="text-right"><p className={'text-sm font-medium ' + (tpl === 'minimal' ? 'text-gray-500' : 'opacity-80')}>INVOICE</p><p className={'text-2xl font-bold ' + (tpl === 'minimal' ? 'text-gray-900' : '')}>#{invNo}</p></div>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6"><div><p className="text-xs text-gray-500 uppercase">Bill To</p><p className="font-semibold mt-1">{cust?.name || 'N/A'}</p>{cust?.phone && <p className="text-sm text-gray-600">{cust.phone}</p>}{cust?.address && <p className="text-sm text-gray-600">{cust.address}</p>}</div><div className="text-right"><p className="text-xs text-gray-500 uppercase">Invoice Details</p><p className="text-sm mt-1"><span className="font-medium">Month:</span> {invoice.month}</p><p className="text-sm"><span className="font-medium">Date:</span> {fmtDate(invoice.createdAt)}</p>{invoice.dueDate && <p className="text-sm"><span className="font-medium">Due:</span> {fmtDate(invoice.dueDate)}</p>}<Badge className={'mt-2 ' + (ST_COL[invoice.status])}>{invoice.status}</Badge></div></div>
            <div className="border rounded-lg overflow-hidden"><Table><TableHeader><TableRow className="bg-gray-50"><TableHead>Service</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell><p className="font-medium capitalize">{conn?.packageType || ''} {conn?.packageName ? `- ${conn.packageName}` : ''}</p><p className="text-xs text-gray-500">{conn?.speed || ''}</p></TableCell><TableCell className="text-right font-bold text-lg">{fmtCur(invoice.amount)}</TableCell></TableRow></TableBody></Table></div>
            <div className="flex justify-end"><div className="w-64 space-y-2"><div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{fmtCur(invoice.amount)}</span></div><div className="flex justify-between text-sm"><span className="text-gray-500">Tax</span><span>Rs 0</span></div><Separator /><div className="flex justify-between font-bold text-lg"><span>Total</span><span style={{ color }}>{fmtCur(invoice.amount)}</span></div></div></div>
          </div>
        </div>
      </div>
      <div className="flex justify-end mt-4"><Button onClick={printInv} className="bg-emerald-600 hover:bg-emerald-700"><Printer className="h-4 w-4 mr-2" />Print Invoice</Button></div>
    </DialogContent></Dialog>
  );
}

// ==================== PAGE COMPONENTS ====================

function DashboardPage({ business: _biz }: { business: Business }) {
  const [d, setD] = useState<DashboardData | null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(true); api<DashboardData>('/api/dashboard').then(setD).catch(() => {}).finally(() => setLoading(false)); }, []);
  if (loading) return <SkelCards />;
  if (!d) return <Empty icon={BarChart3} title="No data" desc="" />;
  const cards = [
    { l: 'Total Customers', v: d.totalCustomers, i: <Users className="h-5 w-5" />, c: 'text-blue-600 bg-blue-50', ch: d.totalCustomers > 0 ? '+12%' : '' },
    { l: 'Active Connections', v: d.activeConnections, i: <Wifi className="h-5 w-5" />, c: 'text-emerald-600 bg-emerald-50' },
    { l: 'Monthly Revenue', v: fmtCur(d.totalMonthlyRevenue), i: <DollarSign className="h-5 w-5" />, c: 'text-amber-600 bg-amber-50' },
    { l: 'Collected This Month', v: fmtCur(d.totalCollectedThisMonth), i: <TrendingUp className="h-5 w-5" />, c: 'text-violet-600 bg-violet-50' },
    { l: 'Expenses', v: fmtCur(d.totalExpensesThisMonth), i: <CreditCard className="h-5 w-5" />, c: 'text-red-600 bg-red-50' },
    { l: 'Expiring Soon', v: d.expiringConnectionsCount, i: <AlertTriangle className="h-5 w-5" />, c: d.expiringConnectionsCount > 0 ? 'text-orange-600 bg-orange-50' : 'text-gray-600 bg-gray-50' },
  ];
  return (<div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{cards.map((c, i) => <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow"><CardContent className="p-5"><div className="flex items-start justify-between"><div className={'p-2.5 rounded-xl ' + (c.c)}>{c.i}</div>{c.ch && <Badge className="bg-emerald-100 text-emerald-700"><ArrowUpRight className="h-3 w-3 mr-0.5" />{c.ch}</Badge>}</div><p className="mt-3 text-2xl font-bold text-gray-900">{c.v}</p><p className="text-sm text-gray-500">{c.l}</p></CardContent></Card>)}</div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="border-0 shadow-sm lg:col-span-2"><CardHeader><CardTitle className="text-base">Revenue & Expenses</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={280}><AreaChart data={d.monthlyRevenueData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><RTooltip /><Area type="monotone" dataKey="revenue" name="Revenue" fill="#10b981" fillOpacity={0.2} stroke="#10b981" strokeWidth={2} /><Area type="monotone" dataKey="expenses" name="Expenses" fill="#ef4444" fillOpacity={0.2} stroke="#ef4444" strokeWidth={2} /></AreaChart></ResponsiveContainer></CardContent></Card>
      <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="text-base">Connections by Type</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={[{ name: 'Internet', value: d.connectionsByType.internet }, { name: 'Cable', value: d.connectionsByType.cable }, { name: 'IPTV', value: d.connectionsByType.iptv }].filter(x => x.value > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={4}>{CHART_COLORS.map((c, i) => <Cell key={i} fill={c} />)}</Pie><RTooltip /><Legend /></PieChart></ResponsiveContainer></CardContent></Card>
    </div>
    <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="text-base">Recent Payments</CardTitle></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Customer</TableHead><TableHead className="hidden sm:table-cell">Package</TableHead><TableHead>Amount</TableHead><TableHead className="hidden sm:table-cell">Method</TableHead><TableHead>Date</TableHead></TableRow></TableHeader><TableBody>{d.recentPayments.length === 0 ? <TableRow><TableCell colSpan={5}><Empty icon={CreditCard} title="No payments yet" desc="" /></TableCell></TableRow> : d.recentPayments.map(p => <TableRow key={p.id}><TableCell className="font-medium">{p.customer?.name || 'N/A'}</TableCell><TableCell className="hidden sm:table-cell capitalize text-sm">{p.connection?.packageType || '-'}</TableCell><TableCell className="font-medium text-emerald-600">{fmtCur(p.amount)}</TableCell><TableCell className="hidden sm:table-cell"><Badge variant="outline" className="capitalize">{p.method || 'N/A'}</Badge></TableCell><TableCell className="text-gray-500 text-sm">{fmtDT(p.createdAt)}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
  </div>);
}

function CustomersPage({ business: _biz }: { business: Business }) {
  const [data, setData] = useState<Customer[]>([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(1); const [search, setSearch] = useState(''); const [filter, setFilter] = useState(''); const [loading, setLoading] = useState(true);
  const [dlg, setDlg] = useState<{ open: boolean; edit: Customer | null }>({ open: false, edit: null });
  const [bulk, setBulk] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', cnic: '', status: 'active' });
  const fetch = useCallback(async () => { setLoading(true); try { const r = await api<PaginatedResponse<Customer>>(`/api/customers?page=${page}&limit=20&search=${search}&status=${filter}`); setData(r.data); setTotal(r.total); } catch {} finally { setLoading(false); } }, [page, search, filter]);
  useEffect(() => { fetch(); }, [fetch]);
  const openCreate = () => { setForm({ name: '', phone: '', email: '', address: '', cnic: '', status: 'active' }); setDlg({ open: true, edit: null }); };
  const openEdit = (c: Customer) => { setForm({ name: c.name, phone: c.phone, email: c.email || '', address: c.address || '', cnic: c.cnic || '', status: c.status }); setDlg({ open: true, edit: c }); };
  const handleSave = async () => { if (!form.name || !form.phone) return; try { if (dlg.edit) { await api(`/api/customers/${dlg.edit.id}`, { method: 'PUT', body: JSON.stringify(form) }); } else { await api('/api/customers', { method: 'POST', body: JSON.stringify(form) }); } setDlg({ open: false, edit: null }); fetch(); } catch (e: any) { alert(e.message); } };
  const handleDel = async (id: string) => { if (!confirm('Delete this customer?')) return; await api(`/api/customers/${id}`, { method: 'DELETE' }); fetch(); };
  return (<div className="space-y-4">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"><div><h2 className="text-xl font-bold">Customers</h2><p className="text-sm text-gray-500">{total} total</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => setBulk(true)}><Upload className="h-4 w-4 mr-2" />Bulk Upload</Button><Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4 mr-2" />New Customer</Button></div></div>
    <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search by name or phone..." filterValue={filter} onFilterChange={v => { setFilter(v); setPage(1); }} filterOptions={[{value:'',label:'All Status'},{value:'active',label:'Active'},{value:'inactive',label:'Inactive'},{value:'suspended',label:'Suspended'}]} />
    <Card className="border-0 shadow-sm"><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="hidden sm:table-cell">Phone</TableHead><TableHead className="hidden md:table-cell">Email</TableHead><TableHead>Status</TableHead><TableHead className="hidden lg:table-cell">Joined</TableHead><TableCell className="text-right">Actions</TableCell></TableRow></TableHeader><TableBody>{loading ? [1,2,3].map(i => <SkelRow key={i} cols={6} />) : data.length === 0 ? <TableRow><TableCell colSpan={6}><Empty icon={Users} title="No customers" desc="Add your first customer" /></TableCell></TableRow> : data.map((c, i) => <TableRow key={c.id} className={i % 2 === 1 ? 'bg-gray-50/50' : ''}><TableCell className="font-medium"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">{c.name[0]}</div><div><p>{c.name}</p><p className="text-xs text-gray-500 sm:hidden">{c.phone}</p></div></div></TableCell><TableCell className="hidden sm:table-cell">{c.phone}</TableCell><TableCell className="hidden md:table-cell text-gray-500">{c.email || '-'}</TableCell><TableCell><Badge className={ST_COL[c.status]}>{c.status}</Badge></TableCell><TableCell className="hidden lg:table-cell text-gray-500 text-sm">{fmtDate(c.createdAt)}</TableCell><TableCell className="text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDel(c.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
    <Dialog open={dlg.open} onOpenChange={o => setDlg({ open: o, edit: null })}><DialogContent><DialogHeader><DialogTitle>{dlg.edit ? 'Edit' : 'New'} Customer</DialogTitle></DialogHeader><div className="space-y-3"><div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div><div><Label>Phone *</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div><div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div><div><Label>Address</Label><Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div><div><Label>CNIC</Label><Input value={form.cnic} onChange={e => setForm(p => ({ ...p, cnic: e.target.value }))} /></div><div><Label>Status</Label><Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent></Select></div></div><DialogFooter><Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">{dlg.edit ? 'Update' : 'Create'}</Button></DialogFooter></DialogContent></Dialog>
    <BulkUpload type="customers" open={bulk} onOpenChange={setBulk} onSuccess={fetch} />
  </div>);
}

function ConnectionsPage({ business: _biz }: { business: Business }) {
  const [data, setData] = useState<Connection[]>([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(1); const [search, setSearch] = useState(''); const [filter, setFilter] = useState(''); const [loading, setLoading] = useState(true);
  const [dlg, setDlg] = useState<{ open: boolean; edit: Connection | null }>({ open: false, edit: null });
  const [bulk, setBulk] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState({ customerId: '', packageType: 'internet', packageName: '', speed: '', monthlyFee: '', status: 'active' });
  const fetch = useCallback(async () => { setLoading(true); try { const r = await api<PaginatedResponse<Connection>>(`/api/connections?page=${page}&limit=20&search=${search}&status=${filter}`); setData(r.data); setTotal(r.total); } catch {} finally { setLoading(false); } }, [page, search, filter]);
  useEffect(() => { fetch(); api<Customer[]>('/api/customers?limit=200').then(setCustomers).catch(() => {}); }, [fetch]);
  const openCreate = () => { setForm({ customerId: '', packageType: 'internet', packageName: '', speed: '', monthlyFee: '', status: 'active' }); setDlg({ open: true, edit: null }); };
  const openEdit = (c: Connection) => { setForm({ customerId: c.customerId, packageType: c.packageType, packageName: c.packageName || '', speed: c.speed || '', monthlyFee: String(c.monthlyFee), status: c.status }); setDlg({ open: true, edit: c }); };
  const handleSave = async () => { if (!form.customerId || !form.monthlyFee) return; try { if (dlg.edit) { await api(`/api/connections/${dlg.edit.id}`, { method: 'PUT', body: JSON.stringify({ ...form, monthlyFee: parseFloat(form.monthlyFee) }) }); } else { await api('/api/connections', { method: 'POST', body: JSON.stringify({ ...form, monthlyFee: parseFloat(form.monthlyFee) }) }); } setDlg({ open: false, edit: null }); fetch(); } catch (e: any) { alert(e.message); } };
  const handleDel = async (id: string) => { if (!confirm('Delete?')) return; await api(`/api/connections/${id}`, { method: 'DELETE' }); fetch(); };
  return (<div className="space-y-4">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"><div><h2 className="text-xl font-bold">Connections</h2><p className="text-sm text-gray-500">{total} total</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => setBulk(true)}><Upload className="h-4 w-4 mr-2" />Bulk Upload</Button><Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4 mr-2" />New Connection</Button></div></div>
    <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search by customer or package..." filterValue={filter} onFilterChange={v => { setFilter(v); setPage(1); }} filterOptions={[{value:'',label:'All'},{value:'internet',label:'Internet'},{value:'cable',label:'Cable'},{value:'iptv',label:'IPTV'},{value:'active',label:'Active'},{value:'expired',label:'Expired'},{value:'disconnected',label:'Disconnected'}]} />
    <Card className="border-0 shadow-sm"><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Type</TableHead><TableHead className="hidden sm:table-cell">Package</TableHead><TableHead className="hidden md:table-cell">Speed</TableHead><TableHead>Fee</TableHead><TableHead>Status</TableHead><TableCell className="text-right">Actions</TableCell></TableRow></TableHeader><TableBody>{loading ? [1,2,3].map(i => <SkelRow key={i} cols={7} />) : data.length === 0 ? <TableRow><TableCell colSpan={7}><Empty icon={Wifi} title="No connections" desc="" /></TableCell></TableRow> : data.map((c, i) => <TableRow key={c.id} className={i % 2 === 1 ? 'bg-gray-50/50' : ''}><TableCell className="font-medium">{c.customer?.name || 'N/A'}</TableCell><TableCell><Badge className={PKG_COL[c.packageType]}><span className="capitalize flex items-center gap-1">{PKG_ICON[c.packageType]}{c.packageType}</span></Badge></TableCell><TableCell className="hidden sm:table-cell">{c.packageName || '-'}</TableCell><TableCell className="hidden md:table-cell">{c.speed || '-'}</TableCell><TableCell className="font-medium">{fmtCur(c.monthlyFee)}</TableCell><TableCell><Badge className={ST_COL[c.status]}>{c.status}</Badge></TableCell><TableCell className="text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDel(c.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
    <Dialog open={dlg.open} onOpenChange={o => setDlg({ open: o, edit: null })}><DialogContent><DialogHeader><DialogTitle>{dlg.edit ? 'Edit' : 'New'} Connection</DialogTitle></DialogHeader><div className="space-y-3"><div><Label>Customer *</Label><Select value={form.customerId} onValueChange={v => setForm(p => ({ ...p, customerId: v }))}><SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger><SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.phone})</SelectItem>)}</SelectContent></Select></div><div className="grid grid-cols-2 gap-3"><div><Label>Type</Label><Select value={form.packageType} onValueChange={v => setForm(p => ({ ...p, packageType: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="internet">Internet</SelectItem><SelectItem value="cable">Cable TV</SelectItem><SelectItem value="iptv">IPTV</SelectItem></SelectContent></Select></div><div><Label>Monthly Fee *</Label><Input type="number" value={form.monthlyFee} onChange={e => setForm(p => ({ ...p, monthlyFee: e.target.value }))} /></div></div><div className="grid grid-cols-2 gap-3"><div><Label>Package Name</Label><Input value={form.packageName} onChange={e => setForm(p => ({ ...p, packageName: e.target.value }))} placeholder="e.g. Basic, Premium" /></div><div><Label>Speed</Label><Input value={form.speed} onChange={e => setForm(p => ({ ...p, speed: e.target.value }))} placeholder="e.g. 10 Mbps" /></div></div><div><Label>Status</Label><Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="expired">Expired</SelectItem><SelectItem value="disconnected">Disconnected</SelectItem></SelectContent></Select></div></div><DialogFooter><Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">{dlg.edit ? 'Update' : 'Create'}</Button></DialogFooter></DialogContent></Dialog>
    <BulkUpload type="connections" open={bulk} onOpenChange={setBulk} onSuccess={fetch} />
  </div>);
}

function BillingPage({ business }: { business: Business }) {
  const [tab, setTab] = useState('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]); const [invTotal, setInvTotal] = useState(0); const [invPage, setInvPage] = useState(1);
  const [payments, setPayments] = useState<Payment[]>([]); const [payTotal, setPayTotal] = useState(0); const [payPage, setPayPage] = useState(1);
  const [search, setSearch] = useState(''); const [loading, setLoading] = useState(true);
  const [payDlg, setPayDlg] = useState(false); const [invPreview, setInvPreview] = useState<Invoice | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]); const [connections, setConnections] = useState<Connection[]>([]);
  const [pForm, setPForm] = useState({ customerId: '', connectionId: '', amount: '', method: 'cash', collectedBy: '', note: '' });
  const fetchInv = useCallback(async () => { try { const r = await api<PaginatedResponse<Invoice>>(`/api/invoices?page=${invPage}&limit=20&search=${search}`); setInvoices(r.data); setInvTotal(r.total); } catch {} }, [invPage, search]);
  const fetchPay = useCallback(async () => { try { const r = await api<PaginatedResponse<Payment>>(`/api/payments?page=${payPage}&limit=20&search=${search}`); setPayments(r.data); setPayTotal(r.total); } catch {} }, [payPage, search]);
  useEffect(() => { setLoading(true); Promise.all([fetchInv(), fetchPay()]).finally(() => setLoading(false)); }, [fetchInv, fetchPay]);
  useEffect(() => { api<Customer[]>('/api/customers?limit=200').then(setCustomers).catch(() => {}); }, []);
  const handleCustChange = (cid: string) => { setPForm(p => ({ ...p, customerId: cid, connectionId: '' })); api<Connection[]>(`/api/connections?limit=50&customerId=${cid}`).then(setConnections).catch(() => {}); };
  const handlePaySave = async () => { if (!pForm.customerId || !pForm.amount) return; try { await api('/api/payments', { method: 'POST', body: JSON.stringify({ ...pForm, amount: parseFloat(pForm.amount) }) }); setPayDlg(false); setPForm({ customerId: '', connectionId: '', amount: '', method: 'cash', collectedBy: '', note: '' }); fetchPay(); fetchInv(); } catch (e: any) { alert(e.message); } };
  return (<div className="space-y-4">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"><div><h2 className="text-xl font-bold">Billing & Dues</h2></div><Button onClick={() => setPayDlg(true)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4 mr-2" />Record Payment</Button></div>
    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search invoices & payments..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
    <Tabs value={tab} onValueChange={setTab}><TabsList><TabsTrigger value="invoices">Invoices ({invTotal})</TabsTrigger><TabsTrigger value="payments">Payments ({payTotal})</TabsTrigger></TabsList>
    <TabsContent value="invoices" className="mt-4"><Card className="border-0 shadow-sm"><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Customer</TableHead><TableHead className="hidden sm:table-cell">Package</TableHead><TableHead>Month</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableCell className="text-right">Actions</TableCell></TableRow></TableHeader><TableBody>{loading ? [1,2,3].map(i => <SkelRow key={i} cols={6} />) : invoices.length === 0 ? <TableRow><TableCell colSpan={6}><Empty icon={Receipt} title="No invoices" desc="" /></TableCell></TableRow> : invoices.map((inv, i) => <TableRow key={inv.id} className={i % 2 === 1 ? 'bg-gray-50/50' : ''}><TableCell className="font-medium">{inv.connection?.customer?.name || 'N/A'}</TableCell><TableCell className="hidden sm:table-cell capitalize">{inv.connection?.packageType || '-'}</TableCell><TableCell>{inv.month}</TableCell><TableCell className="font-medium">{fmtCur(inv.amount)}</TableCell><TableCell><Badge className={ST_COL[inv.status]}>{inv.status}</Badge></TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setInvPreview(inv)}><Eye className="h-4 w-4" /></Button></TableCell></TableRow>)}</TableBody></Table></CardContent></Card><Pagination page={invPage} total={invTotal} limit={20} onPageChange={setInvPage} /></TabsContent>
    <TabsContent value="payments" className="mt-4"><Card className="border-0 shadow-sm"><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Amount</TableHead><TableHead className="hidden sm:table-cell">Method</TableHead><TableHead className="hidden sm:table-cell">Collector</TableHead><TableHead>Date</TableHead></TableRow></TableHeader><TableBody>{payments.length === 0 ? <TableRow><TableCell colSpan={5}><Empty icon={CreditCard} title="No payments" desc="" /></TableCell></TableRow> : payments.map((p, i) => <TableRow key={p.id} className={i % 2 === 1 ? 'bg-gray-50/50' : ''}><TableCell className="font-medium">{p.customer?.name || 'N/A'}</TableCell><TableCell className="font-medium text-emerald-600">{fmtCur(p.amount)}</TableCell><TableCell className="hidden sm:table-cell"><Badge variant="outline" className="capitalize">{p.method || 'N/A'}</Badge></TableCell><TableCell className="hidden sm:table-cell text-sm">{p.collectedBy || '-'}</TableCell><TableCell className="text-gray-500 text-sm">{fmtDT(p.createdAt)}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card><Pagination page={payPage} total={payTotal} limit={20} onPageChange={setPayPage} /></TabsContent>
    </Tabs>
    <Dialog open={payDlg} onOpenChange={setPayDlg}><DialogContent><DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader><div className="space-y-3"><div><Label>Customer *</Label><Select value={pForm.customerId} onValueChange={handleCustChange}><SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger><SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.phone})</SelectItem>)}</SelectContent></Select></div><div><Label>Connection</Label><Select value={pForm.connectionId} onValueChange={v => setPForm(p => ({ ...p, connectionId: v }))}><SelectTrigger><SelectValue placeholder="Select connection" /></SelectTrigger><SelectContent>{connections.map(c => <SelectItem key={c.id} value={c.id}>{c.packageType} - {c.packageName || 'N/A'} ({fmtCur(c.monthlyFee)})</SelectItem>)}</SelectContent></Select></div><div className="grid grid-cols-2 gap-3"><div><Label>Amount *</Label><Input type="number" value={pForm.amount} onChange={e => setPForm(p => ({ ...p, amount: e.target.value }))} /></div><div><Label>Method</Label><Select value={pForm.method} onValueChange={v => setPForm(p => ({ ...p, method: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['cash','jazzcash','easypaisa','bank','online'].map(m => <SelectItem key={m} value={m}><span className="capitalize">{m}</span></SelectItem>)}</SelectContent></Select></div></div><div><Label>Collected By</Label><Input value={pForm.collectedBy} onChange={e => setPForm(p => ({ ...p, collectedBy: e.target.value }))} /></div><div><Label>Note</Label><Input value={pForm.note} onChange={e => setPForm(p => ({ ...p, note: e.target.value }))} /></div></div><DialogFooter><Button onClick={handlePaySave} className="bg-emerald-600 hover:bg-emerald-700">Record Payment</Button></DialogFooter></DialogContent></Dialog>
    {invPreview && <InvoicePreview invoice={invPreview} biz={business} open={!!invPreview} onOpenChange={o => !o && setInvPreview(null)} />}
  </div>);
}

function ReportsPage({ business: _biz }: { business: Business }) {
  const [d, setD] = useState<ReportData | null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => { api<ReportData>('/api/reports').then(setD).catch(() => {}).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="space-y-4"><SkelCards count={4} /><Card className="border-0 shadow-sm h-64"><CardContent className="p-4"><div className="h-full bg-gray-200 rounded animate-pulse" /></CardContent></Card></div>;
  if (!d) return <Empty icon={BarChart3} title="No report data" desc="" />;
  const totRev = d.revenueByMonth.reduce((s, m) => s + m.revenue, 0);
  const totExp = d.revenueByMonth.reduce((s, m) => s + m.expenses, 0);
  const totCol = d.revenueByMonth.reduce((s, m) => s + m.collections, 0);
  const collRate = totRev > 0 ? Math.round((totCol / totRev) * 100) : 0;
  const summaryCards = [
    { l: '6-Month Revenue', v: fmtCur(totRev), c: 'text-emerald-600 bg-emerald-50' },
    { l: '6-Month Expenses', v: fmtCur(totExp), c: 'text-red-600 bg-red-50' },
    { l: 'Net Profit', v: fmtCur(totRev - totExp), c: (totRev - totExp) >= 0 ? 'text-blue-600 bg-blue-50' : 'text-red-600 bg-red-50' },
    { l: 'Collection Rate', v: `${collRate}%`, c: collRate >= 70 ? 'text-violet-600 bg-violet-50' : 'text-orange-600 bg-orange-50' },
  ];
  const fmtM = (m: string) => { const [y, mo] = m.split('-'); return MONTHS[parseInt(mo) - 1] + ' ' + y.slice(2); };
  return (<div className="space-y-6">
    <div><h2 className="text-xl font-bold">Reports & Analytics</h2><p className="text-sm text-gray-500">Comprehensive business insights</p></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{summaryCards.map((c, i) => <Card key={i} className="border-0 shadow-sm"><CardContent className="p-5"><p className="text-sm text-gray-500">{c.l}</p><p className={'text-2xl font-bold mt-1 ' + (c.c.split(' ')[0])}>{c.v}</p></CardContent></Card>)}</div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Revenue vs Expenses</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><AreaChart data={d.revenueByMonth.map(m => ({ ...m, month: fmtM(m.month) }))}><defs><linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient><linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><RTooltip /><Area type="monotone" dataKey="revenue" name="Revenue" fill="url(#gRev)" stroke="#10b981" strokeWidth={2} /><Area type="monotone" dataKey="expenses" name="Expenses" fill="url(#gExp)" stroke="#ef4444" strokeWidth={2} /></AreaChart></ResponsiveContainer></CardContent></Card>
      <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Customer Growth</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={300}><LineChart data={d.customerGrowth.map(m => ({ ...m, month: fmtM(m.month) }))}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><RTooltip /><Line type="monotone" dataKey="count" name="Customers" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} /></LineChart></ResponsiveContainer></CardContent></Card>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Connections by Type</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={d.connectionsByType.map(c => ({ ...c, name: c.type }))} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="count" paddingAngle={3} label>{CHART_COLORS.map((c, i) => <Cell key={i} fill={c} />)}</Pie><RTooltip /><Legend /></PieChart></ResponsiveContainer></CardContent></Card>
      <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Payment Methods</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={d.paymentMethods} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="count" paddingAngle={3} nameKey="method" label>{CHART_COLORS.map((c, i) => <Cell key={i} fill={c} />)}</Pie><RTooltip /><Legend /></PieChart></ResponsiveContainer></CardContent></Card>
      <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Expense Categories</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={250}><BarChart data={d.expenseCategories} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis type="number" tick={{ fontSize: 11 }} /><YAxis dataKey="category" type="category" tick={{ fontSize: 11 }} width={70} /><RTooltip /><Bar dataKey="amount" name="Amount" fill="#ef4444" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Daily Collections (This Month)</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={250}><BarChart data={d.dailyCollections}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><RTooltip /><Bar dataKey="amount" name="Amount" fill="#10b981" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
      <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Top Customers</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={250}><BarChart data={d.topCustomers.slice(0, 8)} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" /><XAxis type="number" tick={{ fontSize: 11 }} /><YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} /><RTooltip /><Bar dataKey="amount" name="Paid" fill="#6366f1" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card className="border-0 shadow-sm"><CardContent className="p-5"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-orange-50 text-orange-600"><AlertTriangle className="h-5 w-5" /></div><div><p className="text-2xl font-bold">{d.overdueInvoices}</p><p className="text-sm text-gray-500">Overdue Invoices</p><p className="text-xs text-orange-600 font-medium">{fmtCur(d.overdueAmount)} unpaid</p></div></div></CardContent></Card>
      <Card className="border-0 shadow-sm"><CardContent className="p-5"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-red-50 text-red-600"><XCircle className="h-5 w-5" /></div><div><p className="text-2xl font-bold">{d.unpaidInvoices}</p><p className="text-sm text-gray-500">Total Unpaid</p><p className="text-xs text-red-600 font-medium">{fmtCur(d.unpaidAmount)}</p></div></div></CardContent></Card>
      <Card className="border-0 shadow-sm"><CardContent className="p-5"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-50 text-amber-600"><Clock className="h-5 w-5" /></div><div><p className="text-2xl font-bold">{d.expiringConnections}</p><p className="text-sm text-gray-500">Expiring Soon</p><p className="text-xs text-amber-600 font-medium">Next 30 days</p></div></div></CardContent></Card>
    </div>
    {d.collectorPerf.length > 0 && <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Collector Performance</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Collector</TableHead><TableHead>Collections</TableHead><TableHead>Amount</TableHead></TableRow></TableHeader><TableBody>{d.collectorPerf.map((c, i) => <TableRow key={i}><TableCell className="font-medium">{c.collector}</TableCell><TableCell>{c.count}</TableCell><TableCell className="font-medium text-emerald-600">{fmtCur(c.amount)}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>}
  </div>);
}

function MessagesPage({ business }: { business: Business }) {
  const [customers, setCustomers] = useState<Customer[]>([]); const [selected, setSelected] = useState<Customer | null>(null); const [messages, setMessages] = useState<Message[]>([]); const [msg, setMsg] = useState(''); const [loading, setLoading] = useState(false); const [sending, setSending] = useState(false); const [search, setSearch] = useState('');
  useEffect(() => { api<Customer[]>('/api/customers?limit=200').then(setCustomers).catch(() => {}); }, []);
  const loadMessages = useCallback(async (c: Customer) => { setSelected(c); setLoading(true); try { const r = await api<{ data: Message[] }>(`/api/messages?customerId=${c.id}`); setMessages(r.data); } catch {} finally { setLoading(false); } }, []);
  const sendMessage = async () => { if (!msg.trim() || !selected) return; setSending(true); try { const r = await api<{ data: Message }>('/api/messages', { method: 'POST', body: JSON.stringify({ customerId: selected.id, content: msg, channel: business.whatsappEnabled ? 'whatsapp' : 'inapp', sendWhatsapp: business.whatsappEnabled }) }); setMessages(p => [r.data, ...p]); setMsg(''); } catch {} finally { setSending(false); } };
  const templates = [
    { label: 'Payment Reminder', text: `Dear ${selected?.name || '{name}'}, your bill is due. Please pay at your earliest convenience.` },
    { label: 'Expiry Notice', text: `Dear ${selected?.name || '{name}'}, your connection is expiring soon. Please renew to avoid disconnection.` },
    { label: 'Welcome', text: `Welcome to ${business.name}! We are happy to have you as our valued customer.` },
  ];
  const filtered = customers.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));
  return (<div className="space-y-4">
    <div><h2 className="text-xl font-bold">Messages</h2><p className="text-sm text-gray-500">Communicate with your customers</p></div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-220px)] min-h-[400px]">
      <Card className="border-0 shadow-sm flex flex-col lg:col-span-1"><div className="p-3 border-b"><Input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="h-9" /></div><ScrollArea className="flex-1">{filtered.map(c => <button key={c.id} onClick={() => loadMessages(c)} className={'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b ' + (selected?.id === c.id ? 'bg-emerald-50' : '')}><div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold flex-shrink-0">{c.name[0]}</div><div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{c.name}</p><p className="text-xs text-gray-500 truncate">{c.phone}</p></div></button>)}</ScrollArea></Card>
      <Card className="border-0 shadow-sm flex flex-col lg:col-span-2">
        {!selected ? <div className="flex-1 flex items-center justify-center"><Empty icon={MessageSquare} title="Select a customer" desc="Choose from the list to start messaging" /></div> : <>
          <div className="p-4 border-b flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">{selected.name[0]}</div><div><p className="font-semibold">{selected.name}</p><p className="text-xs text-gray-500">{selected.phone}</p></div>{business.whatsappEnabled && <Badge className="bg-green-100 text-green-700 ml-auto"><MessageCircle className="h-3 w-3 mr-1" />WhatsApp</Badge>}</div>
          <ScrollArea className="flex-1 p-4 space-y-3">{loading ? <div className="flex justify-center py-8"><RefreshCw className="h-6 w-6 animate-spin text-emerald-600" /></div> : messages.length === 0 ? <p className="text-center text-gray-400 text-sm py-8">No messages yet. Send one!</p> : messages.map(m => <div key={m.id} className={'flex ' + (m.direction === 'outgoing' ? 'justify-end' : 'justify-start')}><div className={'max-w-[80%] rounded-2xl px-4 py-2.5 ' + (m.direction === 'outgoing' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-900')}><p className="text-sm">{m.content}</p><div className={'flex items-center gap-1 mt-1 ' + (m.direction === 'outgoing' ? 'text-emerald-100' : 'text-gray-400')}><p className="text-[10px]">{fmtDT(m.createdAt)}</p>{m.channel !== 'inapp' && <Badge className="text-[8px] px-1 py-0 bg-white/20 text-white border-0">{m.channel}</Badge>}</div></div></div>)}</ScrollArea>
          <div className="p-3 border-t space-y-2"><div className="flex gap-1 flex-wrap">{templates.map((t, i) => <Button key={i} variant="outline" size="sm" className="text-xs h-7" onClick={() => setMsg(t.text)}>{t.label}</Button>)}</div><div className="flex gap-2"><Input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Type a message..." className="flex-1" onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())} /><Button onClick={sendMessage} disabled={sending || !msg.trim()} className="bg-emerald-600 hover:bg-emerald-700 px-4"><SendHorizonal className="h-4 w-4" /></Button></div></div>
        </>}
      </Card>
    </div>
  </div>);
}

function VendorsPage({ business: _biz }: { business: Business }) {
  const [data, setData] = useState<Vendor[]>([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(1); const [search, setSearch] = useState(''); const [loading, setLoading] = useState(true);
  const [dlg, setDlg] = useState<{ open: boolean; edit: Vendor | null }>({ open: false, edit: null });
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', service: '', status: 'active' });
  const fetch = useCallback(async () => { setLoading(true); try { const r = await api<PaginatedResponse<Vendor>>(`/api/vendors?page=${page}&limit=20&search=${search}`); setData(r.data); setTotal(r.total); } catch {} finally { setLoading(false); } }, [page, search]);
  useEffect(() => { fetch(); }, [fetch]);
  const openCreate = () => { setForm({ name: '', phone: '', email: '', address: '', service: '', status: 'active' }); setDlg({ open: true, edit: null }); };
  const openEdit = (v: Vendor) => { setForm({ name: v.name, phone: v.phone, email: v.email || '', address: v.address || '', service: v.service || '', status: v.status }); setDlg({ open: true, edit: v }); };
  const handleSave = async () => { if (!form.name || !form.phone) return; try { if (dlg.edit) { await api(`/api/vendors/${dlg.edit.id}`, { method: 'PUT', body: JSON.stringify(form) }); } else { await api('/api/vendors', { method: 'POST', body: JSON.stringify(form) }); } setDlg({ open: false, edit: null }); fetch(); } catch (e: any) { alert(e.message); } };
  const handleDel = async (id: string) => { if (!confirm('Delete?')) return; await api(`/api/vendors/${id}`, { method: 'DELETE' }); fetch(); };
  return (<div className="space-y-4"><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Vendors</h2><p className="text-sm text-gray-500">{total} total</p></div><Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4 mr-2" />New Vendor</Button></div>
    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search vendors..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" /></div>
    <Card className="border-0 shadow-sm"><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="hidden sm:table-cell">Service</TableHead><TableHead className="hidden md:table-cell">Phone</TableHead><TableHead>Status</TableHead><TableCell className="text-right">Actions</TableCell></TableRow></TableHeader><TableBody>{loading ? [1,2,3].map(i => <SkelRow key={i} cols={5} />) : data.length === 0 ? <TableRow><TableCell colSpan={5}><Empty icon={Building2} title="No vendors" desc="" /></TableCell></TableRow> : data.map((v, i) => <TableRow key={v.id} className={i % 2 === 1 ? 'bg-gray-50/50' : ''}><TableCell className="font-medium">{v.name}</TableCell><TableCell className="hidden sm:table-cell">{v.service || '-'}</TableCell><TableCell className="hidden md:table-cell">{v.phone}</TableCell><TableCell><Badge className={ST_COL[v.status]}>{v.status}</Badge></TableCell><TableCell className="text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(v)}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDel(v.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
    <Dialog open={dlg.open} onOpenChange={o => setDlg({ open: o, edit: null })}><DialogContent><DialogHeader><DialogTitle>{dlg.edit ? 'Edit' : 'New'} Vendor</DialogTitle></DialogHeader><div className="space-y-3"><div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div><div><Label>Phone *</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div><div><Label>Service</Label><Input value={form.service} onChange={e => setForm(p => ({ ...p, service: e.target.value }))} placeholder="e.g. Fiber, Equipment" /></div><div><Label>Email</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div><div><Label>Address</Label><Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div></div><DialogFooter><Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">{dlg.edit ? 'Update' : 'Create'}</Button></DialogFooter></DialogContent></Dialog>
  </div>);
}

function EmployeesPage({ business: _biz }: { business: Business }) {
  const [data, setData] = useState<Employee[]>([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(1); const [search, setSearch] = useState(''); const [loading, setLoading] = useState(true);
  const [dlg, setDlg] = useState<{ open: boolean; edit: Employee | null }>({ open: false, edit: null });
  const [form, setForm] = useState({ name: '', phone: '', email: '', role: 'technician', salary: '', status: 'active' });
  const fetch = useCallback(async () => { setLoading(true); try { const r = await api<PaginatedResponse<Employee>>(`/api/employees?page=${page}&limit=20&search=${search}`); setData(r.data); setTotal(r.total); } catch {} finally { setLoading(false); } }, [page, search]);
  useEffect(() => { fetch(); }, [fetch]);
  const openCreate = () => { setForm({ name: '', phone: '', email: '', role: 'technician', salary: '', status: 'active' }); setDlg({ open: true, edit: null }); };
  const openEdit = (e: Employee) => { setForm({ name: e.name, phone: e.phone, email: e.email || '', role: e.role, salary: String(e.salary || ''), status: e.status }); setDlg({ open: true, edit: e }); };
  const handleSave = async () => { if (!form.name || !form.phone) return; try { if (dlg.edit) { await api(`/api/employees/${dlg.edit.id}`, { method: 'PUT', body: JSON.stringify({ ...form, salary: form.salary ? parseFloat(form.salary) : null }) }); } else { await api('/api/employees', { method: 'POST', body: JSON.stringify({ ...form, salary: form.salary ? parseFloat(form.salary) : null }) }); } setDlg({ open: false, edit: null }); fetch(); } catch (e: any) { alert(e.message); } };
  const handleDel = async (id: string) => { if (!confirm('Delete?')) return; await api(`/api/employees/${id}`, { method: 'DELETE' }); fetch(); };
  return (<div className="space-y-4"><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Employees</h2><p className="text-sm text-gray-500">{total} total</p></div><Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4 mr-2" />New Employee</Button></div>
    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search employees..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" /></div>
    <Card className="border-0 shadow-sm"><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="hidden sm:table-cell">Role</TableHead><TableHead className="hidden md:table-cell">Phone</TableHead><TableHead>Status</TableHead><TableCell className="text-right">Actions</TableCell></TableRow></TableHeader><TableBody>{loading ? [1,2,3].map(i => <SkelRow key={i} cols={5} />) : data.length === 0 ? <TableRow><TableCell colSpan={5}><Empty icon={UserCog} title="No employees" desc="" /></TableCell></TableRow> : data.map((e, i) => <TableRow key={e.id} className={i % 2 === 1 ? 'bg-gray-50/50' : ''}><TableCell className="font-medium"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">{e.name[0]}</div>{e.name}</div></TableCell><TableCell className="hidden sm:table-cell capitalize">{e.role}</TableCell><TableCell className="hidden md:table-cell">{e.phone}</TableCell><TableCell><Badge className={ST_COL[e.status]}>{e.status}</Badge></TableCell><TableCell className="text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(e)}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDel(e.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
    <Dialog open={dlg.open} onOpenChange={o => setDlg({ open: o, edit: null })}><DialogContent><DialogHeader><DialogTitle>{dlg.edit ? 'Edit' : 'New'} Employee</DialogTitle></DialogHeader><div className="space-y-3"><div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div><div><Label>Phone *</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div><div className="grid grid-cols-2 gap-3"><div><Label>Role</Label><Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="technician">Technician</SelectItem><SelectItem value="collector">Collector</SelectItem><SelectItem value="operator">Operator</SelectItem></SelectContent></Select></div><div><Label>Salary</Label><Input type="number" value={form.salary} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))} /></div></div><div><Label>Email</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div></div><DialogFooter><Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">{dlg.edit ? 'Update' : 'Create'}</Button></DialogFooter></DialogContent></Dialog>
  </div>);
}

function ExpensesPage({ business: _biz }: { business: Business }) {
  const [data, setData] = useState<Expense[]>([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(1); const [search, setSearch] = useState(''); const [filter, setFilter] = useState(''); const [loading, setLoading] = useState(true);
  const [dlg, setDlg] = useState<{ open: boolean; edit: Expense | null }>({ open: false, edit: null });
  const [bulk, setBulk] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]); const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState({ category: 'other', amount: '', description: '', date: '', vendorId: '', employeeId: '' });
  const fetch = useCallback(async () => { setLoading(true); try { const r = await api<PaginatedResponse<Expense>>(`/api/expenses?page=${page}&limit=20&search=${search}&category=${filter}`); setData(r.data); setTotal(r.total); } catch {} finally { setLoading(false); } }, [page, search, filter]);
  useEffect(() => { fetch(); api<Vendor[]>('/api/vendors?limit=200').then(setVendors).catch(() => {}); api<Employee[]>('/api/employees?limit=200').then(setEmployees).catch(() => {}); }, [fetch]);
  const openCreate = () => { setForm({ category: 'other', amount: '', description: '', date: new Date().toISOString().split('T')[0], vendorId: '', employeeId: '' }); setDlg({ open: true, edit: null }); };
  const openEdit = (e: Expense) => { setForm({ category: e.category, amount: String(e.amount), description: e.description || '', date: e.date?.split('T')[0] || '', vendorId: e.vendorId || '', employeeId: e.employeeId || '' }); setDlg({ open: true, edit: e }); };
  const handleSave = async () => { if (!form.amount) return; try { if (dlg.edit) { await api(`/api/expenses/${dlg.edit.id}`, { method: 'PUT', body: JSON.stringify({ ...form, amount: parseFloat(form.amount), date: form.date ? new Date(form.date).toISOString() : new Date().toISOString() }) }); } else { await api('/api/expenses', { method: 'POST', body: JSON.stringify({ ...form, amount: parseFloat(form.amount), date: form.date ? new Date(form.date).toISOString() : new Date().toISOString() }) }); } setDlg({ open: false, edit: null }); fetch(); } catch (e: any) { alert(e.message); } };
  const handleDel = async (id: string) => { if (!confirm('Delete?')) return; await api(`/api/expenses/${id}`, { method: 'DELETE' }); fetch(); };
  return (<div className="space-y-4"><div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"><div><h2 className="text-xl font-bold">Expenses</h2><p className="text-sm text-gray-500">{total} total</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => setBulk(true)}><Upload className="h-4 w-4 mr-2" />Bulk Upload</Button><Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4 mr-2" />New Expense</Button></div></div>
    <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search expenses..." filterValue={filter} onFilterChange={v => { setFilter(v); setPage(1); }} filterOptions={[{value:'',label:'All Categories'},{value:'rent',label:'Rent'},{value:'salary',label:'Salary'},{value:'equipment',label:'Equipment'},{value:'maintenance',label:'Maintenance'},{value:'utility',label:'Utility'},{value:'transport',label:'Transport'},{value:'other',label:'Other'}]} />
    <Card className="border-0 shadow-sm"><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Category</TableHead><TableHead className="hidden sm:table-cell">Description</TableHead><TableHead>Amount</TableHead><TableHead className="hidden sm:table-cell">Date</TableHead><TableCell className="text-right">Actions</TableCell></TableRow></TableHeader><TableBody>{loading ? [1,2,3].map(i => <SkelRow key={i} cols={5} />) : data.length === 0 ? <TableRow><TableCell colSpan={5}><Empty icon={CreditCard} title="No expenses" desc="" /></TableCell></TableRow> : data.map((e, i) => <TableRow key={e.id} className={i % 2 === 1 ? 'bg-gray-50/50' : ''}><TableCell className="capitalize"><Badge variant="outline">{e.category}</Badge></TableCell><TableCell className="hidden sm:table-cell max-w-[200px] truncate text-gray-600">{e.description || '-'}</TableCell><TableCell className="font-medium text-red-600">{fmtCur(e.amount)}</TableCell><TableCell className="hidden sm:table-cell text-gray-500 text-sm">{fmtDate(e.date)}</TableCell><TableCell className="text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(e)}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDel(e.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
    <Dialog open={dlg.open} onOpenChange={o => setDlg({ open: o, edit: null })}><DialogContent><DialogHeader><DialogTitle>{dlg.edit ? 'Edit' : 'New'} Expense</DialogTitle></DialogHeader><div className="space-y-3"><div><Label>Category</Label><Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['rent','salary','equipment','maintenance','utility','transport','other'].map(c => <SelectItem key={c} value={c}><span className="capitalize">{c}</span></SelectItem>)}</SelectContent></Select></div><div><Label>Amount *</Label><Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div><div><Label>Description</Label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div><div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div></div><DialogFooter><Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">{dlg.edit ? 'Update' : 'Create'}</Button></DialogFooter></DialogContent></Dialog>
    <BulkUpload type="expenses" open={bulk} onOpenChange={setBulk} onSuccess={fetch} />
  </div>);
}

function NotificationsPage({ business: _biz }: { business: Business }) {
  const [data, setData] = useState<Notif[]>([]); const [loading, setLoading] = useState(true);
  const fetch = useCallback(async () => { setLoading(true); try { const r = await api<PaginatedResponse<Notif>>('/api/notifications?limit=50'); setData(r.data); } catch {} finally { setLoading(false); } }, []);
  useEffect(() => { fetch(); }, [fetch]);
  const markRead = async (id: string) => { await api(`/api/notifications/${id}`, { method: 'PUT', body: JSON.stringify({ isRead: true }) }); fetch(); };
  const markAllRead = async () => { await Promise.all(data.filter(n => !n.isRead).map(n => api(`/api/notifications/${n.id}`, { method: 'PUT', body: JSON.stringify({ isRead: true }) }))); fetch(); };
  const typeIcon: Record<string, React.ReactNode> = { info: <Bell className="h-4 w-4 text-blue-500" />, warning: <AlertTriangle className="h-4 w-4 text-amber-500" />, expiry: <Clock className="h-4 w-4 text-orange-500" />, payment: <DollarSign className="h-4 w-4 text-emerald-500" /> };
  return (<div className="space-y-4"><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Notifications</h2><p className="text-sm text-gray-500">{data.filter(n => !n.isRead).length} unread</p></div>{data.some(n => !n.isRead) && <Button variant="outline" onClick={markAllRead}><Check className="h-4 w-4 mr-2" />Mark All Read</Button>}</div>
    <Card className="border-0 shadow-sm"><CardContent className="p-0">{loading ? [1,2,3].map(i => <div key={i} className="flex items-center gap-4 p-4 border-b"><div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" /><div className="flex-1"><div className="h-4 w-48 bg-gray-200 rounded animate-pulse mb-2" /><div className="h-3 w-32 bg-gray-100 rounded animate-pulse" /></div></div>) : data.length === 0 ? <Empty icon={Bell} title="No notifications" desc="You are all caught up" /> : <div>{data.map(n => <div key={n.id} className={"flex items-start gap-4 p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors " + (!n.isRead ? 'bg-blue-50/50' : '')} onClick={() => !n.isRead && markRead(n.id)}><div className="mt-0.5">{typeIcon[n.type] || typeIcon.info}</div><div className="flex-1 min-w-0"><p className={"text-sm " + (!n.isRead ? 'font-semibold' : 'font-medium text-gray-700')}>{n.title}</p><p className="text-sm text-gray-500 mt-0.5 truncate">{n.message}</p><p className="text-xs text-gray-400 mt-1">{fmtDT(n.createdAt)}</p></div>{!n.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>}</div>)}</div>}</CardContent></Card>
  </div>);
}

function SettingsPage({ business: _biz, onUpdate }: { business: Business; onUpdate: (b: Business) => void }) {
  const [biz, setBiz] = useState<Business>(_biz);
  const [form, setForm] = useState({ name: biz.name, phone: biz.phone || '', address: biz.address || '' });
  const [logo, setLogo] = useState(biz.logo || '');
  const [invTpl, setInvTpl] = useState(biz.invoiceTemplate || 'modern');
  const [invColor, setInvColor] = useState(biz.invoiceColor || '#10b981');
  const [waEnabled, setWaEnabled] = useState(biz.whatsappEnabled || false);
  const [waToken, setWaToken] = useState(biz.whatsappToken || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const saveProfile = async () => { setSaving(true); try { const b = await api<Business>('/api/business/settings', { method: 'PUT', body: JSON.stringify({ ...form, invoiceTemplate: invTpl, invoiceColor: invColor, whatsappEnabled: waEnabled, whatsappToken: waToken }) }); setBiz(b); onUpdate(b); } catch (e: any) { alert(e.message); } finally { setSaving(false); } };
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; setUploading(true); const fd = new FormData(); fd.append('logo', f); try { const r = await fetch('/api/business/logo', { method: 'POST', body: fd }); const d = await r.json(); if (d.logo) { setLogo(d.logo); setBiz(p => ({ ...p, logo: d.logo })); onUpdate({ ...biz, logo: d.logo }); } } catch { alert('Upload failed'); } finally { setUploading(false); } };
  const removeLogo = async () => { await fetch('/api/business/logo', { method: 'DELETE' }); setLogo(''); setBiz(p => ({ ...p, logo: null })); onUpdate({ ...biz, logo: null }); };
  const tplColors: Record<string, { bg: string; label: string }> = { modern: { bg: 'bg-gradient-to-br from-emerald-500 to-teal-600', label: 'Modern' }, classic: { bg: 'bg-emerald-600', label: 'Classic' }, minimal: { bg: 'bg-white border-2 border-gray-300', label: 'Minimal' }, bold: { bg: 'bg-gray-800', label: 'Bold' } };
  return (<div className="space-y-6 max-w-3xl">
    <div><h2 className="text-xl font-bold">Settings</h2><p className="text-sm text-gray-500">Manage your business profile and preferences</p></div>
    <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="text-base">Business Logo</CardTitle></CardHeader><CardContent><div className="flex items-center gap-6">
      <div className="relative group"><div className={'w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed ' + (logo ? 'border-transparent' : 'border-gray-300')} onClick={() => (document.getElementById('logo-input') as HTMLInputElement)?.click()}>{logo ? <img src={logo} className="w-full h-full object-cover" alt="Logo" /> : <Upload className="h-8 w-8 text-gray-400" />}</div><input id="logo-input" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />{uploading && <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center"><RefreshCw className="h-5 w-5 animate-spin" /></div>}</div>
      <div><p className="font-medium">Upload Logo</p><p className="text-sm text-gray-500">Used in invoices and branding. Max 2MB.</p>{logo && <Button variant="ghost" size="sm" className="text-red-500 mt-1" onClick={removeLogo}><Trash2 className="h-3 w-3 mr-1" />Remove</Button>}</div>
    </div></CardContent></Card>
    <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="text-base">Business Profile</CardTitle></CardHeader><CardContent className="space-y-4"><div><Label>Business Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div><div><Label>Email</Label><Input value={biz.email} disabled className="bg-gray-50" /></div></div><div><Label>Address</Label><Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div><Button onClick={saveProfile} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving ? 'Saving...' : 'Save Changes'}</Button></CardContent></Card>
    <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="text-base">Invoice Template</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-gray-500">Choose a template style for your invoices</p><div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{Object.entries(tplColors).map(([k, v]) => <button key={k} onClick={() => setInvTpl(k)} className={'rounded-xl overflow-hidden border-2 transition-all ' + (invTpl === k ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-gray-200 hover:border-gray-300')}><div className={'h-16 ' + v.bg + ' flex items-center justify-center'}>{k === 'minimal' ? <span className="text-gray-400 text-xs">Clean</span> : k === 'bold' ? <span className="text-white text-xs font-bold">BOLD</span> : <Zap className="h-5 w-5 text-white" />}</div><p className="text-xs text-center py-1.5 font-medium">{v.label}</p></button>)}</div>
    <div className="flex items-center gap-3"><Label className="flex-shrink-0">Accent Color</Label><Input type="color" value={invColor} onChange={e => setInvColor(e.target.value)} className="w-12 h-10 p-1 cursor-pointer" /><span className="text-sm text-gray-500">{invColor}</span></div>
    </CardContent></Card>
    <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="text-base">WhatsApp Integration</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-gray-500">Enable WhatsApp messaging</p><div className="flex items-center justify-between"><div><p className="font-medium">Enable WhatsApp</p><p className="text-xs text-gray-500">Send via WhatsApp API</p></div><button onClick={() => setWaEnabled(!waEnabled)} className={waEnabled ? "relative w-11 h-6 rounded-full bg-emerald-600" : "relative w-11 h-6 rounded-full bg-gray-300"}><div className={waEnabled ? "absolute top-0.5 left-5 w-5 h-5 rounded-full bg-white shadow" : "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow"}></div></button></div>
    {waEnabled && <div><Label>WhatsApp Token</Label><Input value={waToken} onChange={e => setWaToken(e.target.value)} placeholder="Enter your WhatsApp API token" /></div>}</CardContent></Card>
  </div>);
}

function AdminPage({ business: _biz }: { business: Business }) {
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([]); const [total, setTotal] = useState(0); const [page, setPage] = useState(1); const [search, setSearch] = useState(''); const [loading, setLoading] = useState(true); const [stats, setStats] = useState<AdminStats | null>(null); const [deepDive, setDeepDive] = useState<{ id: string; name: string } | null>(null);
  const fetch = useCallback(async () => { setLoading(true); try { const r = await api<AdminBusinessesResponse>(`/api/admin/businesses?page=${page}&limit=20&search=${search}`); setBusinesses(r.data); setTotal(r.total); setStats(r.stats); } catch {} finally { setLoading(false); } }, [page, search]);
  useEffect(() => { fetch(); }, [fetch]);
  const toggleActive = async (b: AdminBusiness) => { await api(`/api/admin/businesses/${b.id}`, { method: 'PUT', body: JSON.stringify({ isActive: !b.isActive }) }); fetch(); };
  const changePlan = async (id: string, plan: string) => { await api(`/api/admin/businesses/${id}`, { method: 'PUT', body: JSON.stringify({ plan }) }); fetch(); };
  const deleteBusiness = async (id: string) => { if (!confirm('Delete this business and ALL its data?')) return; await api(`/api/admin/businesses/${id}`, { method: 'DELETE' }); fetch(); };
  const planCol: Record<string, string> = { trial: 'bg-amber-100 text-amber-700', basic: 'bg-blue-100 text-blue-700', pro: 'bg-violet-100 text-violet-700', enterprise: 'bg-emerald-100 text-emerald-700' };
  return (<div className="space-y-6"><div><h2 className="text-2xl font-bold">Platform Admin</h2><p className="text-sm text-gray-500">Manage all ISP businesses</p></div>
    {stats ? <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">{[
      { l: 'Businesses', v: stats.totalBusinesses, i: <Building2 className="h-5 w-5" />, c: 'text-blue-600 bg-blue-50' },
      { l: 'Customers', v: stats.totalCustomers, i: <Users className="h-5 w-5" />, c: 'text-emerald-600 bg-emerald-50' },
      { l: 'Active Conn.', v: stats.totalActiveConnections, i: <Wifi className="h-5 w-5" />, c: 'text-violet-600 bg-violet-50' },
      { l: 'Revenue', v: fmtCur(stats.totalMonthlyRevenue), i: <DollarSign className="h-5 w-5" />, c: 'text-amber-600 bg-amber-50' },
      { l: 'Collected', v: fmtCur(stats.totalPaymentsCollected), i: <TrendingUp className="h-5 w-5" />, c: 'text-cyan-600 bg-cyan-50' },
    ].map((s, i) => <Card key={i} className="border-0 shadow-sm"><CardContent className="p-4"><div className={'p-2 rounded-xl ' + s.c + ' w-fit'}>{s.i}</div><p className="mt-2 text-xl font-bold">{s.v}</p><p className="text-xs text-gray-500">{s.l}</p></CardContent></Card>)}</div> : null}
    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search businesses..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" /></div>
    <Card className="border-0 shadow-sm"><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Business</TableHead><TableHead>Plan</TableHead><TableHead className="hidden sm:table-cell">Customers</TableHead><TableHead>Status</TableHead><TableCell className="text-right">Actions</TableCell></TableRow></TableHeader><TableBody>{loading ? [1,2,3].map(i => <SkelRow key={i} cols={5} />) : businesses.length === 0 ? <TableRow><TableCell colSpan={5}><Empty icon={Building2} title="No businesses" desc="" /></TableCell></TableRow> : businesses.map((b, i) => <TableRow key={b.id} className={i % 2 === 1 ? 'bg-gray-50/50' : ''}><TableCell><p className="font-medium">{b.name}</p><p className="text-xs text-gray-500">{b.email}</p></TableCell><TableCell><Badge className={planCol[b.plan] || ''}>{b.plan}</Badge></TableCell><TableCell className="hidden sm:table-cell">{b._count.customers}</TableCell><TableCell><Badge className={b.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>{b.isActive ? 'Active' : 'Disabled'}</Badge></TableCell><TableCell className="text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" onClick={() => setDeepDive({ id: b.id, name: b.name })}><Eye className="h-4 w-4" /></Button><Select value={b.plan} onValueChange={v => changePlan(b.id, v)}><SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="trial">Trial</SelectItem><SelectItem value="basic">Basic</SelectItem><SelectItem value="pro">Pro</SelectItem><SelectItem value="enterprise">Enterprise</SelectItem></SelectContent></Select><Button variant="ghost" size="icon" className={b.isActive ? 'h-8 w-8 text-amber-600' : 'h-8 w-8 text-emerald-600'} onClick={() => toggleActive(b)}>{b.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}</Button><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteBusiness(b.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
    {deepDive && <AdminDeepDive bizId={deepDive.id} bizName={deepDive.name} open={!!deepDive} onOpenChange={o => !o && setDeepDive(null)} />}
  </div>);
}

// ==================== MAIN APP ====================
function ISPApp({ business, onLogout }: { business: Business; onLogout: () => void }) {
  const [page, setPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [biz, setBiz] = useState<Business>(business);
  const fetchNotifCount = useCallback(async () => { try { const r = await api<{ unreadCount: number }>('/api/notifications?unread=true&limit=1'); setNotifCount(r.unreadCount); } catch {} }, []);
  useEffect(() => { fetchNotifCount(); }, [fetchNotifCount]);
  useEffect(() => { const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); } }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);
  const trialDaysLeft = biz.trialEndsAt ? Math.max(0, Math.ceil((new Date(biz.trialEndsAt).getTime() - Date.now()) / 86400000)) : 999;
  const NAV: { id: Page; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: 'customers', label: 'Customers', icon: <Users className="h-5 w-5" /> },
    { id: 'connections', label: 'Connections', icon: <Wifi className="h-5 w-5" /> },
    { id: 'billing', label: 'Billing & Dues', icon: <Receipt className="h-5 w-5" /> },
    { id: 'reports', label: 'Reports', icon: <TrendingUp className="h-5 w-5" /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare className="h-5 w-5" /> },
    { id: 'vendors', label: 'Vendors', icon: <Building2 className="h-5 w-5" /> },
    { id: 'employees', label: 'Employees', icon: <UserCog className="h-5 w-5" /> },
    { id: 'expenses', label: 'Expenses', icon: <CreditCard className="h-5 w-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="h-5 w-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
    ...(biz.isPlatformAdmin ? [{ id: 'admin' as Page, label: 'Platform Admin', icon: <Shield className="h-5 w-5" /> }] : []),
  ];
  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <DashboardPage business={biz} />;
      case 'customers': return <CustomersPage business={biz} />;
      case 'connections': return <ConnectionsPage business={biz} />;
      case 'billing': return <BillingPage business={biz} />;
      case 'reports': return <ReportsPage business={biz} />;
      case 'messages': return <MessagesPage business={biz} />;
      case 'vendors': return <VendorsPage business={biz} />;
      case 'employees': return <EmployeesPage business={biz} />;
      case 'expenses': return <ExpensesPage business={biz} />;
      case 'notifications': return <NotificationsPage business={biz} />;
      case 'settings': return <SettingsPage business={biz} onUpdate={setBiz} />;
      case 'admin': return biz.isPlatformAdmin ? <AdminPage business={biz} /> : null;
      default: return null;
    }
  };
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      {/* Sidebar */}
      <aside className={'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r flex flex-col transform transition-transform duration-200 ' + (sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')}>
        <div className="p-4 border-b flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white flex-shrink-0"><Zap className="h-5 w-5" /></div>
          <div className="flex-1 min-w-0"><h2 className="font-bold text-gray-900 truncate">Z ISP Solution</h2><p className="text-xs text-gray-500 truncate">{biz.name}</p></div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1"><X className="h-5 w-5" /></button>
        </div>
        {biz.plan === 'trial' && trialDaysLeft <= 7 && trialDaysLeft > 0 && <div className="mx-3 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg"><p className="text-xs font-medium text-amber-700">Trial: {trialDaysLeft}d left</p><Progress value={(trialDaysLeft / 30) * 100} className="mt-1 h-1.5" /></div>}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(item => <button key={item.id} onClick={() => { setPage(item.id); setSidebarOpen(false); }} className={'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ' + (page === item.id ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')}>{item.icon}<span>{item.label}</span>{item.id === 'notifications' && notifCount > 0 && <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1.5">{notifCount}</span>}</button>)}
        </nav>
        <div className="p-3 border-t"><button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"><LogOut className="h-5 w-5" />Sign Out</button></div>
      </aside>
      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b px-4 lg:px-6 py-3 flex items-center gap-4 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1"><Menu className="h-5 w-5" /></button>
          <button onClick={() => setSearchOpen(true)} className="flex-1 max-w-md flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"><Search className="h-4 w-4 text-gray-400" /><span className="text-sm text-gray-500">Search everything... <kbd className="hidden sm:inline text-[10px] bg-gray-200 px-1.5 py-0.5 rounded ml-2 font-mono">Ctrl+K</kbd></span></button>
          <div className="flex items-center gap-2">
            {biz.logo ? <img src={biz.logo} className="h-8 w-8 rounded-lg object-cover" alt="" /> : <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">{biz.name[0]}</div>}
            <span className="hidden sm:block text-sm font-medium max-w-[150px] truncate">{biz.name}</span>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">{renderPage()}</div>
      </main>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} onNav={setPage} />
    </div>
  );
}

// ==================== ROOT ====================
export default function Home() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api<{ business: Business | null }>('/api/auth/me').then(r => { if (r.business) setBusiness(r.business); setLoading(false); }).catch(() => setLoading(false)); }, []);
  const handleLogout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); setBusiness(null); };
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50"><div className="text-center"><div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 text-white mb-4 shadow-lg shadow-emerald-200"><Zap className="h-8 w-8 animate-pulse" /></div><p className="text-gray-500">Loading Z ISP Solution...</p></div></div>;
  if (!business) return <AuthScreen onLogin={setBusiness} />;
  return <ISPApp business={business} onLogout={handleLogout} />;
}
