'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, Wifi, Cable, Tv, DollarSign, TrendingUp, TrendingDown,
  AlertTriangle, Bell, Settings, LogOut, Plus, Search, RefreshCw,
  ChevronLeft, ChevronRight, Edit, Trash2, Eye, X, Check,
  UserPlus, Package, Receipt, CreditCard, Building2, UserCog,
  BarChart3, ArrowUpRight, ArrowDownRight, Calendar, Clock,
  Menu, Filter, Download, Send, CheckCircle2, XCircle, AlertCircle,
  FileText, ClipboardList, Shield, Zap, Monitor, Phone, Mail, MapPin
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
  PieChart, Pie, Cell, LineChart, Line, Legend, Area, AreaChart
} from 'recharts';
import type {
  Business, Customer, Vendor, Employee, Connection, Invoice,
  Payment, Expense, Notification as Notif, DashboardData, Page, PaginatedResponse
} from '@/lib/types';

const CHART_COLORS = ['#10b981', '#f59e0b', '#6366f1', '#ef4444', '#06b6d4', '#8b5cf6'];
const PKG_TYPE_ICON: Record<string, React.ReactNode> = {
  internet: <Wifi className="h-4 w-4" />,
  cable: <Cable className="h-4 w-4" />,
  iptv: <Tv className="h-4 w-4" />,
};
const PKG_TYPE_COLOR: Record<string, string> = {
  internet: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cable: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  iptv: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
};
const STATUS_COLOR: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-700',
  expired: 'bg-amber-100 text-amber-700',
  disconnected: 'bg-red-100 text-red-700',
  paid: 'bg-emerald-100 text-emerald-700',
  unpaid: 'bg-red-100 text-red-700',
  overdue: 'bg-orange-100 text-orange-700',
  partial: 'bg-amber-100 text-amber-700',
};
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ==================== API HELPER ====================
async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Request failed'); }
  return res.json();
}

function formatCurrency(n: number) { return 'PKR ' + Number(n || 0).toLocaleString(); }
function formatDate(d: string) { if (!d) return '-'; return new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }); }
function formatDateTime(d: string) { if (!d) return '-'; return new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }

// ==================== AUTH SCREENS ====================
function AuthScreen({ onLogin }: { onLogin: (b: Business) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', businessName: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (isLogin) {
        const b = await api<Business>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: form.email, password: form.password }) });
        onLogin(b);
      } else {
        const b = await api<Business>('/api/auth/signup', { method: 'POST', body: JSON.stringify(form) });
        onLogin(b);
      }
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 text-white mb-4 shadow-lg shadow-emerald-200">
            <Zap className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Z ISP Solution</h1>
          <p className="text-gray-500 mt-1">Manage your ISP business efficiently</p>
        </div>
        <Card className="shadow-xl border-0 shadow-emerald-100/50">
          <CardContent className="pt-6">
            <Tabs value={isLogin ? 'login' : 'signup'} onValueChange={v => { setIsLogin(v === 'login'); setError(''); }}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 flex items-center gap-2"><AlertCircle className="h-4 w-4" />{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && <><div><Label>Business Name</Label><Input placeholder="Your ISP business name" value={form.businessName} onChange={e => update('businessName', e.target.value)} required /></div>
                <div><Label>Your Name</Label><Input placeholder="Full name" value={form.name} onChange={e => update('name', e.target.value)} required /></div></>}
                <div><Label>Email</Label><Input type="email" placeholder="email@example.com" value={form.email} onChange={e => update('email', e.target.value)} required /></div>
                <div><Label>Password</Label><Input type="password" placeholder="Min 6 characters" value={form.password} onChange={e => update('password', e.target.value)} required minLength={6} /></div>
                {!isLogin && <div><Label>Phone</Label><Input placeholder="03XX-XXXXXXX" value={form.phone} onChange={e => update('phone', e.target.value)} /></div>}
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                  {isLogin ? 'Sign In' : 'Create Account & Start Free Trial'}
                </Button>
              </form>
            </Tabs>
            {!isLogin && <p className="text-center text-xs text-gray-400 mt-4">30-day free trial. No credit card required.</p>}
          </CardContent>
        </Card>
        <p className="text-center text-xs text-gray-400 mt-6">Powered by Zee Technologies</p>
      </div>
    </div>
  );
}

// ==================== MAIN APP ====================
function ISPApp({ business, onLogout }: { business: Business; onLogout: () => void }) {
  const [page, setPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  const fetchNotifCount = useCallback(async () => {
    try { const r = await api<{ unreadCount: number }>('/api/notifications?unread=true&limit=1'); setNotifCount(r.unreadCount); } catch {}
  }, []);

  const fetchDashboard = useCallback(async () => {
    try { const d = await api<DashboardData>('/api/dashboard'); setDashboardData(d); } catch {}
  }, []);

  useEffect(() => { fetchNotifCount(); fetchDashboard(); }, [fetchNotifCount, fetchDashboard]);

  const NAV_ITEMS: { id: Page; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="h-5 w-5" /> },
    { id: 'customers', label: 'Customers', icon: <Users className="h-5 w-5" /> },
    { id: 'connections', label: 'Connections', icon: <Wifi className="h-5 w-5" /> },
    { id: 'billing', label: 'Billing & Dues', icon: <Receipt className="h-5 w-5" /> },
    { id: 'vendors', label: 'Vendors', icon: <Building2 className="h-5 w-5" /> },
    { id: 'employees', label: 'Employees', icon: <UserCog className="h-5 w-5" /> },
    { id: 'expenses', label: 'Expenses', icon: <CreditCard className="h-5 w-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="h-5 w-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
  ];

  const trialDaysLeft = business.trialEndsAt ? Math.max(0, Math.ceil((new Date(business.trialEndsAt).getTime() - Date.now()) / 86400000)) : 0;

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200`}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-200">
              <Zap className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 truncate">Z ISP Solution</h2>
              <p className="text-xs text-gray-500 truncate">{business.name}</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1"><X className="h-5 w-5" /></button>
          </div>
        </div>
        {business.plan === 'trial' && trialDaysLeft <= 7 && trialDaysLeft > 0 && (
          <div className="mx-3 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs font-medium text-amber-700">Trial: {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left</p>
            <Progress value={(trialDaysLeft / 30) * 100} className="mt-1 h-1.5" />
          </div>
        )}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => { setPage(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${page === item.id ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
              {item.icon}<span>{item.label}</span>
              {item.id === 'notifications' && notifCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1.5">{notifCount}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2 px-3 py-1.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">{business.name?.[0]?.toUpperCase()}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{business.name}</p>
              <p className="text-xs text-gray-500 truncate">{business.plan === 'trial' ? 'Free Trial' : business.plan}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start text-gray-500 hover:text-red-600" onClick={onLogout}>
            <LogOut className="h-4 w-4 mr-2" />Sign Out
          </Button>
        </div>
      </aside>
      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      {/* Main */}
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 lg:px-6 h-14 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">{NAV_ITEMS.find(n => n.id === page)?.label}</h1>
          <div className="ml-auto flex items-center gap-2">
            {business.plan === 'trial' && (
              <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
                <Clock className="h-3 w-3 mr-1" />Trial: {trialDaysLeft}d
              </Badge>
            )}
            <Button variant="ghost" size="icon" className="relative" onClick={() => setPage('notifications')}>
              <Bell className="h-5 w-5" />
              {notifCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full h-4 min-w-4 flex items-center justify-center">{notifCount}</span>}
            </Button>
          </div>
        </header>
        <div className="p-4 lg:p-6">
          {page === 'dashboard' && <DashboardPage data={dashboardData} onRefresh={fetchDashboard} />}
          {page === 'customers' && <CustomersPage />}
          {page === 'connections' && <ConnectionsPage />}
          {page === 'billing' && <BillingPage />}
          {page === 'vendors' && <VendorsPage />}
          {page === 'employees' && <EmployeesPage />}
          {page === 'expenses' && <ExpensesPage />}
          {page === 'notifications' && <NotificationsPage />}
          {page === 'settings' && <SettingsPage business={business} />}
        </div>
      </main>
    </div>
  );
}

// ==================== DASHBOARD ====================
function DashboardPage({ data, onRefresh }: { data: DashboardData | null; onRefresh: () => void }) {
  if (!data) return <div className="flex items-center justify-center py-20"><RefreshCw className="h-6 w-6 animate-spin text-emerald-600" /></div>;

  const stats = [
    { label: 'Total Customers', value: data.totalCustomers, icon: <Users className="h-5 w-5" />, color: 'text-blue-600 bg-blue-50', change: '+12%' },
    { label: 'Active Connections', value: data.activeConnections, icon: <Wifi className="h-5 w-5" />, color: 'text-emerald-600 bg-emerald-50', change: '+5%' },
    { label: 'Monthly Revenue', value: formatCurrency(data.totalMonthlyRevenue), icon: <DollarSign className="h-5 w-5" />, color: 'text-amber-600 bg-amber-50', change: '+8%' },
    { label: 'Collected This Month', value: formatCurrency(data.totalCollectedThisMonth), icon: <TrendingUp className="h-5 w-5" />, color: 'text-violet-600 bg-violet-50', change: '+3%' },
    { label: 'Expenses This Month', value: formatCurrency(data.totalExpensesThisMonth), icon: <CreditCard className="h-5 w-5" />, color: 'text-red-600 bg-red-50', change: '-2%' },
    { label: 'Overdue Invoices', value: data.overdueInvoicesCount, icon: <AlertTriangle className="h-5 w-5" />, color: data.overdueInvoicesCount > 0 ? 'text-orange-600 bg-orange-50' : 'text-gray-600 bg-gray-50', change: '' },
  ];

  const pieData = [
    { name: 'Internet', value: data.connectionsByType.internet || 0 },
    { name: 'Cable TV', value: data.connectionsByType.cable || 0 },
    { name: 'IPTV', value: data.connectionsByType.iptv || 0 },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500">Overview of your ISP business</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
      </div>
      {data.expiringConnectionsCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-700"><span className="font-semibold">{data.expiringConnectionsCount} connection(s)</span> expiring within 7 days. Check Connections page for details.</p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-xl ${s.color}`}>{s.icon}</div>
                {s.change && <span className={`text-xs font-medium flex items-center ${s.change.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}`}>{s.change.startsWith('+') ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{s.change}</span>}
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Revenue vs Expenses</CardTitle><CardDescription>Last 6 months</CardDescription></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthlyRevenueData}>
                  <defs><linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient><linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#colorRev)" strokeWidth={2} name="Revenue" />
                  <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#colorExp)" strokeWidth={2} name="Expenses" />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Connections by Type</CardTitle></CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-center text-gray-400 py-10">No connections yet</p>}
            <div className="space-y-2 mt-2">
              {pieData.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-sm"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />{d.name}</div><span className="font-medium">{d.value}</span></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Recent Payments</CardTitle><CardDescription>Latest 10 payments received</CardDescription></CardHeader>
        <CardContent>
          {data.recentPayments.length > 0 ? (
            <Table><TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
            <TableBody>{data.recentPayments.map(p => (
              <TableRow key={p.id}><TableCell className="font-medium">{p.customer?.name || 'N/A'}</TableCell><TableCell>{formatCurrency(p.amount)}</TableCell><TableCell><Badge variant="outline" className="capitalize">{p.method || 'N/A'}</Badge></TableCell><TableCell className="text-gray-500">{formatDateTime(p.createdAt)}</TableCell></TableRow>
            ))}</TableBody></Table>
          ) : <p className="text-center text-gray-400 py-8">No payments recorded yet</p>}
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== GENERIC CRUD HOOK ====================
function useCrud<T>(basePath: string) {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');

  const fetch = useCallback(async (p = page, s = search, f = filter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' });
      if (s) params.set('search', s);
      if (f) params.set('status', f);
      const r = await api<PaginatedResponse<T>>(`${basePath}?${params}`);
      setItems(r.data); setTotal(r.total);
    } catch {} finally { setLoading(false); }
  }, [basePath, page, search, filter]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (data: any) => { const r = await api<T>(basePath, { method: 'POST', body: JSON.stringify(data) }); fetch(1); return r; };
  const update = async (id: string, data: any) => { const r = await api<T>(`${basePath}/${id}`, { method: 'PUT', body: JSON.stringify(data) }); fetch(); return r; };
  const remove = async (id: string) => { await api(`${basePath}/${id}`, { method: 'DELETE' }); fetch(); };

  return { items, total, loading, page, setPage, search, setSearch, filter, setFilter, fetch, create, update, remove };
}

// ==================== PAGINATION ====================
function Pagination({ page, total, limit, onPageChange }: { page: number; total: number; limit: number; onPageChange: (p: number) => void }) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-gray-500">Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} of {total}</p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
        {Array.from({ length: Math.min(5, pages) }, (_, i) => {
          const p = page <= 3 ? i + 1 : page >= pages - 2 ? pages - 4 + i : page - 2 + i;
          if (p < 1 || p > pages) return null;
          return <Button key={p} variant={p === page ? 'default' : 'outline'} size="icon" className="h-8 w-8" onClick={() => onPageChange(p)}>{p}</Button>;
        })}
        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= pages} onClick={() => onPageChange(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

// ==================== SEARCH BAR ====================
function SearchBar({ value, onChange, placeholder, filterValue, onFilterChange, filterOptions, filterLabel }: { value: string; onChange: (v: string) => void; placeholder: string; filterValue?: string; onFilterChange?: (v: string) => void; filterOptions?: { value: string; label: string }[]; filterLabel?: string }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} className="pl-9" /></div>
      {filterOptions && onFilterChange && (
        <Select value={filterValue || ''} onValueChange={onFilterChange}>
          <SelectTrigger className="w-full sm:w-44"><Filter className="h-4 w-4 mr-2" />{filterValue ? filterOptions.find(o => o.value === filterValue)?.label : filterLabel || 'All Status'}</SelectTrigger>
          <SelectContent>{filterOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      )}
    </div>
  );
}

// ==================== CUSTOMERS PAGE ====================
function CustomersPage() {
  const { items, total, loading, page, setPage, search, setSearch, filter, setFilter, create, update, remove } = useCrud<Customer>('/api/customers');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [viewing, setViewing] = useState<Customer | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', cnic: '', status: 'active' });

  const resetForm = () => setForm({ name: '', phone: '', email: '', address: '', cnic: '', status: 'active' });
  const openCreate = () => { resetForm(); setEditing(null); setOpen(true); };
  const openEdit = (c: Customer) => { setForm({ name: c.name, phone: c.phone, email: c.email || '', address: c.address || '', cnic: c.cnic || '', status: c.status }); setEditing(c); setOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) { await update(editing.id, form); } else { await create(form); }
    setOpen(false);
  };

  const viewCustomer = async (c: Customer) => {
    setViewing(c);
    try { const [connRes, payRes] = await Promise.all([api<PaginatedResponse<Connection>>(`/api/connections?search=${c.name}&limit=50`), api<PaginatedResponse<Payment>>(`/api/payments?limit=50`)]); setConnections(connRes.data.filter(cn => cn.customerId === c.id)); setPayments(payRes.data.filter(p => p.customerId === c.id)); } catch {}
  };

  const statusOpts = [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'suspended', label: 'Suspended' }];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Customers</h2><p className="text-sm text-gray-500">{total} total customers</p></div><Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4 mr-2" />Add Customer</Button></div>
      <SearchBar value={search} onChange={setSearch} placeholder="Search by name or phone..." filterValue={filter} onFilterChange={setFilter} filterOptions={statusOpts} filterLabel="All Status" />
      {loading ? <div className="flex justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-emerald-600" /></div> : (
        <Card className="border-0 shadow-sm"><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="hidden sm:table-cell">Phone</TableHead><TableHead className="hidden md:table-cell">Address</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
          {items.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-400">No customers found</TableCell></TableRow> : items.map(c => (
            <TableRow key={c.id}><TableCell className="font-medium"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">{c.name[0]}</div>{c.name}</div></TableCell><TableCell className="hidden sm:table-cell">{c.phone}</TableCell><TableCell className="hidden md:table-cell text-gray-500 max-w-[200px] truncate">{c.address || '-'}</TableCell><TableCell><Badge className={STATUS_COLOR[c.status] || ''}>{c.status}</Badge></TableCell><TableCell className="text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => viewCustomer(c)}><Eye className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>
          ))}
        </TableBody></Table></CardContent></Card>
      )}
      <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? 'Edit Customer' : 'Add Customer'}</DialogTitle><DialogDescription>{editing ? 'Update customer information' : 'Add a new customer to your ISP business'}</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div><Label>Phone *</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>CNIC</Label><Input value={form.cnic} onChange={e => setForm({ ...form, cnic: e.target.value })} /></div>
          </div>
          <div><Label>Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          <div><Label>Status</Label><Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statusOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">{editing ? 'Update' : 'Create'}</Button></DialogFooter>
        </form>
      </DialogContent></Dialog>
      {/* View Dialog */}
      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Customer Details</DialogTitle></DialogHeader>
        {viewing && <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4"><div><p className="text-xs text-gray-500">Name</p><p className="font-medium">{viewing.name}</p></div><div><p className="text-xs text-gray-500">Phone</p><p className="font-medium">{viewing.phone}</p></div><div><p className="text-xs text-gray-500">Email</p><p className="font-medium">{viewing.email || '-'}</p></div><div><p className="text-xs text-gray-500">CNIC</p><p className="font-medium">{viewing.cnic || '-'}</p></div><div><p className="text-xs text-gray-500">Address</p><p className="font-medium">{viewing.address || '-'}</p></div><div><p className="text-xs text-gray-500">Status</p><Badge className={STATUS_COLOR[viewing.status]}>{viewing.status}</Badge></div></div>
          <Separator />
          <div><h4 className="font-semibold mb-2">Connections ({connections.length})</h4>
            {connections.length > 0 ? <Table><TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Package</TableHead><TableHead>Fee</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{connections.map(c => <TableRow key={c.id}><TableCell><Badge className={PKG_TYPE_COLOR[c.packageType]}>{c.packageType}</Badge></TableCell><TableCell>{c.packageName || '-'}</TableCell><TableCell>{formatCurrency(c.monthlyFee)}</TableCell><TableCell><Badge className={STATUS_COLOR[c.status]}>{c.status}</Badge></TableCell></TableRow>)}</TableBody></Table> : <p className="text-gray-400 text-sm">No connections</p>}</div>
          <div><h4 className="font-semibold mb-2">Payment History ({payments.length})</h4>
            {payments.length > 0 ? <Table><TableHeader><TableRow><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Date</TableHead></TableRow></TableHeader><TableBody>{payments.map(p => <TableRow key={p.id}><TableCell>{formatCurrency(p.amount)}</TableCell><TableCell className="capitalize">{p.method || '-'}</TableCell><TableCell>{formatDateTime(p.createdAt)}</TableCell></TableRow>)}</TableBody></Table> : <p className="text-gray-400 text-sm">No payments</p>}</div>
        </div>}
      </DialogContent></Dialog>
    </div>
  );
}

// ==================== CONNECTIONS PAGE ====================
function ConnectionsPage() {
  const { items, total, loading, page, setPage, search, setSearch, filter, setFilter, create, update, remove } = useCrud<Connection>('/api/connections');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Connection | null>(null);
  const [form, setForm] = useState({ customerId: '', packageType: 'internet', packageName: '', speed: '', monthlyFee: '', status: 'active', expiresAt: '' });

  useEffect(() => { api<PaginatedResponse<Customer>>('/api/customers?limit=200').then(r => setCustomers(r.data)).catch(() => {}); }, []);

  const resetForm = () => setForm({ customerId: '', packageType: 'internet', packageName: '', speed: '', monthlyFee: '', status: 'active', expiresAt: '' });
  const openCreate = () => { resetForm(); setEditing(null); setOpen(true); };
  const openEdit = (c: Connection) => { setForm({ customerId: c.customerId, packageType: c.packageType, packageName: c.packageName || '', speed: c.speed || '', monthlyFee: String(c.monthlyFee), status: c.status, expiresAt: c.expiresAt ? c.expiresAt.split('T')[0] : '' }); setEditing(c); setOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, monthlyFee: parseFloat(form.monthlyFee), expiresAt: form.expiresAt || null };
    if (editing) { await update(editing.id, data); } else { await create(data); }
    setOpen(false);
  };

  const typeOpts = [{ value: 'internet', label: 'Internet' }, { value: 'cable', label: 'Cable TV' }, { value: 'iptv', label: 'IPTV' }];
  const statusOpts = [{ value: 'active', label: 'Active' }, { value: 'expired', label: 'Expired' }, { value: 'disconnected', label: 'Disconnected' }];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Connections</h2><p className="text-sm text-gray-500">{total} total connections</p></div><Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4 mr-2" />New Connection</Button></div>
      <SearchBar value={search} onChange={setSearch} placeholder="Search by customer or package..." filterValue={filter} onFilterChange={setFilter} filterOptions={[...typeOpts, ...statusOpts]} filterLabel="All Types" />
      {loading ? <div className="flex justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-emerald-600" /></div> : (
        <Card className="border-0 shadow-sm"><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Type</TableHead><TableHead className="hidden sm:table-cell">Package</TableHead><TableHead className="hidden md:table-cell">Speed</TableHead><TableHead>Fee</TableHead><TableHead>Status</TableHead><TableHead className="hidden lg:table-cell">Expires</TableHead><TableCell className="text-right">Actions</TableCell></TableRow></TableHeader><TableBody>
          {items.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-400">No connections found</TableCell></TableRow> : items.map(c => (
            <TableRow key={c.id}><TableCell className="font-medium">{c.customer?.name || 'N/A'}</TableCell><TableCell><Badge className={PKG_TYPE_COLOR[c.packageType]}>{PKG_TYPE_ICON[c.packageType]}<span className="ml-1 capitalize">{c.packageType}</span></Badge></TableCell><TableCell className="hidden sm:table-cell">{c.packageName || '-'}</TableCell><TableCell className="hidden md:table-cell">{c.speed || '-'}</TableCell><TableCell className="font-medium">{formatCurrency(c.monthlyFee)}</TableCell><TableCell><Badge className={STATUS_COLOR[c.status]}>{c.status}</Badge></TableCell><TableCell className="hidden lg:table-cell text-gray-500">{formatDate(c.expiresAt || '')}</TableCell><TableCell className="text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>
          ))}
        </TableBody></Table></CardContent></Card>
      )}
      <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? 'Edit Connection' : 'New Connection'}</DialogTitle><DialogDescription>{editing ? 'Update connection details' : 'Create a new connection for a customer'}</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><Label>Customer *</Label><Select value={form.customerId} onValueChange={v => setForm({ ...form, customerId: v })} disabled={!!editing}><SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger><SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name} - {c.phone}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Package Type *</Label><Select value={form.packageType} onValueChange={v => setForm({ ...form, packageType: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{typeOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Monthly Fee (PKR) *</Label><Input type="number" step="0.01" value={form.monthlyFee} onChange={e => setForm({ ...form, monthlyFee: e.target.value })} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Package Name</Label><Input value={form.packageName} onChange={e => setForm({ ...form, packageName: e.target.value })} placeholder="e.g. Basic 10Mbps" /></div>
            <div><Label>Speed</Label><Input value={form.speed} onChange={e => setForm({ ...form, speed: e.target.value })} placeholder="e.g. 10 Mbps" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Status</Label><Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statusOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Expires At</Label><Input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} /></div>
          </div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">{editing ? 'Update' : 'Create'}</Button></DialogFooter>
        </form>
      </DialogContent></Dialog>
    </div>
  );
}

// ==================== BILLING PAGE ====================
function BillingPage() {
  const [tab, setTab] = useState('invoices');
  const [generating, setGenerating] = useState(false);
  const [genMonth, setGenMonth] = useState(new Date().toISOString().slice(0, 7));
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invLoading, setInvLoading] = useState(true);
  const [invPage, setInvPage] = useState(1);
  const [invTotal, setInvTotal] = useState(0);
  const [invFilter, setInvFilter] = useState('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payLoading, setPayLoading] = useState(true);
  const [payPage, setPayPage] = useState(1);
  const [payTotal, setPayTotal] = useState(0);
  const [payOpen, setPayOpen] = useState(false);
  const [payForm, setPayForm] = useState({ customerId: '', connectionId: '', invoiceId: '', amount: '', method: 'cash', collectedBy: '', note: '' });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);

  const fetchInvoices = useCallback(async (p = invPage, f = invFilter) => {
    setInvLoading(true);
    try { const params = new URLSearchParams({ page: String(p), limit: '20' }); if (f) params.set('status', f); const r = await api<PaginatedResponse<Invoice>>(`/api/invoices?${params}`); setInvoices(r.data); setInvTotal(r.total); } catch {} finally { setInvLoading(false); }
  }, [invPage, invFilter]);

  const fetchPayments = useCallback(async (p = payPage) => {
    setPayLoading(true);
    try { const r = await api<PaginatedResponse<Payment>>(`/api/payments?page=${p}&limit=20`); setPayments(r.data); setPayTotal(r.total); } catch {} finally { setPayLoading(false); }
  }, [payPage]);

  useEffect(() => { fetchInvoices(); fetchPayments(); }, [fetchInvoices, fetchPayments]);
  useEffect(() => { api<PaginatedResponse<Customer>>('/api/customers?limit=200').then(r => setCustomers(r.data)).catch(() => {}); api<PaginatedResponse<Connection>>('/api/connections?limit=200').then(r => setConnections(r.data)).catch(() => {}); }, []);

  const generateInvoices = async () => {
    setGenerating(true);
    try { await api('/api/invoices', { method: 'POST', body: JSON.stringify({ month: genMonth }) }); fetchInvoices(1); } catch {} finally { setGenerating(false); }
  };

  const openPayDialog = () => { setPayForm({ customerId: '', connectionId: '', invoiceId: '', amount: '', method: 'cash', collectedBy: '', note: '' }); setPayOpen(true); };
  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    await api('/api/payments', { method: 'POST', body: JSON.stringify({ ...payForm, amount: parseFloat(payForm.amount) }) });
    setPayOpen(false); fetchInvoices(); fetchPayments();
  };

  const markPaid = async (inv: Invoice) => {
    await api(`/api/invoices/${inv.id}`, { method: 'PUT', body: JSON.stringify({ status: 'paid', paidAt: new Date().toISOString() }) });
    fetchInvoices();
  };

  const filteredConnections = connections.filter(c => !payForm.customerId || c.customerId === payForm.customerId);
  const filteredInvoices = invoices.filter(i => !payForm.connectionId || i.connectionId === payForm.connectionId);

  const invStatusOpts = [{ value: 'unpaid', label: 'Unpaid' }, { value: 'paid', label: 'Paid' }, { value: 'overdue', label: 'Overdue' }, { value: 'partial', label: 'Partial' }];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold">Billing & Dues</h2><p className="text-sm text-gray-500">Manage invoices and collect payments</p></div>
        <div className="flex gap-2">
          <Dialog><DialogTrigger asChild><Button variant="outline"><FileText className="h-4 w-4 mr-2" />Generate Invoices</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Generate Monthly Invoices</DialogTitle><DialogDescription>Create invoices for all active connections</DialogDescription></DialogHeader><div className="space-y-4"><div><Label>Month</Label><Input type="month" value={genMonth} onChange={e => setGenMonth(e.target.value)} /></div><DialogFooter><Button onClick={generateInvoices} disabled={generating} className="bg-emerald-600 hover:bg-emerald-700">{generating ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}Generate</Button></DialogFooter></div></DialogContent></Dialog>
          <Button onClick={openPayDialog} className="bg-emerald-600 hover:bg-emerald-700"><DollarSign className="h-4 w-4 mr-2" />Collect Payment</Button>
        </div>
      </div>
      <Tabs value={tab} onValueChange={setTab}><TabsList><TabsTrigger value="invoices">Invoices ({invTotal})</TabsTrigger><TabsTrigger value="payments">Payments ({payTotal})</TabsTrigger></TabsList>
        <TabsContent value="invoices" className="mt-4">
          <div className="mb-4"><Select value={invFilter || ''} onValueChange={v => { setInvFilter(v === '__all__' ? '' : v); }}><SelectTrigger className="w-44"><Filter className="h-4 w-4 mr-2" />{invFilter ? invStatusOpts.find(o => o.value === invFilter)?.label : 'All Status'}</SelectTrigger><SelectContent><SelectItem value="__all__">All Status</SelectItem>{invStatusOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
          {invLoading ? <div className="flex justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-emerald-600" /></div> : (
            <Card className="border-0 shadow-sm"><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Package</TableHead><TableHead>Month</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
              {invoices.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">No invoices found</TableCell></TableRow> : invoices.map(inv => (
                <TableRow key={inv.id}><TableCell className="font-medium">{inv.connection?.customer?.name || 'N/A'}</TableCell><TableCell className="capitalize">{inv.connection?.packageType || '-'}</TableCell><TableCell>{inv.month}</TableCell><TableCell className="font-medium">{formatCurrency(inv.amount)}</TableCell><TableCell><Badge className={STATUS_COLOR[inv.status]}>{inv.status}</Badge></TableCell><TableCell className="text-right">{inv.status !== 'paid' && <Button size="sm" variant="outline" onClick={() => markPaid(inv)}><Check className="h-3 w-3 mr-1" />Mark Paid</Button>}{inv.status === 'paid' && <span className="text-xs text-gray-400">{formatDate(inv.paidAt || '')}</span>}</TableCell></TableRow>
              ))}
            </TableBody></Table></CardContent></Card>
          )}
          <Pagination page={invPage} total={invTotal} limit={20} onPageChange={setInvPage} />
        </TabsContent>
        <TabsContent value="payments" className="mt-4">
          {payLoading ? <div className="flex justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-emerald-600" /></div> : (
            <Card className="border-0 shadow-sm"><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Collected By</TableHead><TableHead>Date</TableHead></TableRow></TableHeader><TableBody>
              {payments.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-400">No payments yet</TableCell></TableRow> : payments.map(p => (
                <TableRow key={p.id}><TableCell className="font-medium">{p.customer?.name || 'N/A'}</TableCell><TableCell className="font-medium text-emerald-600">{formatCurrency(p.amount)}</TableCell><TableCell><Badge variant="outline" className="capitalize">{p.method || '-'}</Badge></TableCell><TableCell>{p.collectedBy || '-'}</TableCell><TableCell className="text-gray-500">{formatDateTime(p.createdAt)}</TableCell></TableRow>
              ))}
            </TableBody></Table></CardContent></Card>
          )}
          <Pagination page={payPage} total={payTotal} limit={20} onPageChange={setPayPage} />
        </TabsContent>
      </Tabs>
      {/* Collect Payment Dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Collect Payment</DialogTitle><DialogDescription>Record a payment from a customer</DialogDescription></DialogHeader>
        <form onSubmit={handlePay} className="space-y-3">
          <div><Label>Customer *</Label><Select value={payForm.customerId} onValueChange={v => setPayForm({ ...payForm, customerId: v, connectionId: '', invoiceId: '' })}><SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger><SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name} - {c.phone}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Connection</Label><Select value={payForm.connectionId} onValueChange={v => setPayForm({ ...payForm, connectionId: v, invoiceId: '' })} disabled={!payForm.customerId}><SelectTrigger><SelectValue placeholder="Select connection" /></SelectTrigger><SelectContent>{filteredConnections.map(c => <SelectItem key={c.id} value={c.id}><span className="capitalize">{c.packageType}</span> - {c.packageName || '-'} ({formatCurrency(c.monthlyFee)})</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Against Invoice (optional)</Label><Select value={payForm.invoiceId} onValueChange={v => setPayForm({ ...payForm, invoiceId: v })} disabled={!payForm.connectionId}><SelectTrigger><SelectValue placeholder="Select invoice" /></SelectTrigger><SelectContent>{filteredInvoices.filter(i => i.status !== 'paid').map(i => <SelectItem key={i.id} value={i.id}>{i.month} - {formatCurrency(i.amount)} ({i.status})</SelectItem>)}</SelectContent></Select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Amount (PKR) *</Label><Input type="number" step="0.01" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} required /></div>
            <div><Label>Method</Label><Select value={payForm.method} onValueChange={v => setPayForm({ ...payForm, method: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['cash', 'jazzcash', 'easypaisa', 'bank', 'online'].map(m => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div><Label>Collected By</Label><Input value={payForm.collectedBy} onChange={e => setPayForm({ ...payForm, collectedBy: e.target.value })} /></div>
          <div><Label>Note</Label><Textarea value={payForm.note} onChange={e => setPayForm({ ...payForm, note: e.target.value })} rows={2} /></div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button><Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Record Payment</Button></DialogFooter>
        </form>
      </DialogContent></Dialog>
    </div>
  );
}

// ==================== VENDORS PAGE ====================
function VendorsPage() {
  const { items, total, loading, page, setPage, search, setSearch, create, update, remove } = useCrud<Vendor>('/api/vendors');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', service: '', status: 'active' });

  const resetForm = () => setForm({ name: '', phone: '', email: '', address: '', service: '', status: 'active' });
  const openCreate = () => { resetForm(); setEditing(null); setOpen(true); };
  const openEdit = (v: Vendor) => { setForm({ name: v.name, phone: v.phone, email: v.email || '', address: v.address || '', service: v.service || '', status: v.status }); setEditing(v); setOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); if (editing) { await update(editing.id, form); } else { await create(form); } setOpen(false); };
  const statusOpts = [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Vendors</h2><p className="text-sm text-gray-500">{total} vendors & suppliers</p></div><Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4 mr-2" />Add Vendor</Button></div>
      <SearchBar value={search} onChange={setSearch} placeholder="Search vendors..." />
      {loading ? <div className="flex justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-emerald-600" /></div> : (
        <Card className="border-0 shadow-sm"><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead className="hidden sm:table-cell">Service</TableHead><TableHead className="hidden md:table-cell">Email</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
          {items.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">No vendors found</TableCell></TableRow> : items.map(v => (
            <TableRow key={v.id}><TableCell className="font-medium">{v.name}</TableCell><TableCell>{v.phone}</TableCell><TableCell className="hidden sm:table-cell">{v.service || '-'}</TableCell><TableCell className="hidden md:table-cell text-gray-500">{v.email || '-'}</TableCell><TableCell><Badge className={STATUS_COLOR[v.status]}>{v.status}</Badge></TableCell><TableCell className="text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(v)}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => remove(v.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>
          ))}
        </TableBody></Table></CardContent></Card>
      )}
      <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3"><div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div><div><Label>Phone *</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required /></div><div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div><div><Label>Service</Label><Input value={form.service} onChange={e => setForm({ ...form, service: e.target.value })} /></div></div>
          <div><Label>Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
          <div><Label>Status</Label><Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statusOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">{editing ? 'Update' : 'Create'}</Button></DialogFooter>
        </form>
      </DialogContent></Dialog>
    </div>
  );
}

// ==================== EMPLOYEES PAGE ====================
function EmployeesPage() {
  const { items, total, loading, page, setPage, search, setSearch, filter, setFilter, create, update, remove } = useCrud<Employee>('/api/employees');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', role: 'technician', salary: '', status: 'active' });

  const resetForm = () => setForm({ name: '', phone: '', email: '', role: 'technician', salary: '', status: 'active' });
  const openCreate = () => { resetForm(); setEditing(null); setOpen(true); };
  const openEdit = (e: Employee) => { setForm({ name: e.name, phone: e.phone, email: e.email || '', role: e.role, salary: String(e.salary || ''), status: e.status }); setEditing(e); setOpen(true); };

  const handleSubmit = async (ev: React.FormEvent) => { ev.preventDefault(); const data = { ...form, salary: form.salary ? parseFloat(form.salary) : null }; if (editing) { await update(editing.id, data); } else { await create(data); } setOpen(false); };

  const roleOpts = [{ value: 'admin', label: 'Admin' }, { value: 'technician', label: 'Technician' }, { value: 'collector', label: 'Collector' }, { value: 'operator', label: 'Operator' }];
  const statusOpts = [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }];
  const roleColor: Record<string, string> = { admin: 'bg-purple-100 text-purple-700', technician: 'bg-blue-100 text-blue-700', collector: 'bg-amber-100 text-amber-700', operator: 'bg-cyan-100 text-cyan-700' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Employees</h2><p className="text-sm text-gray-500">{total} team members</p></div><Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4 mr-2" />Add Employee</Button></div>
      <SearchBar value={search} onChange={setSearch} placeholder="Search employees..." filterValue={filter} onFilterChange={setFilter} filterOptions={[...roleOpts, ...statusOpts]} filterLabel="All Roles" />
      {loading ? <div className="flex justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-emerald-600" /></div> : (
        <Card className="border-0 shadow-sm"><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Role</TableHead><TableHead className="hidden sm:table-cell">Salary</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
          {items.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">No employees found</TableCell></TableRow> : items.map(emp => (
            <TableRow key={emp.id}><TableCell className="font-medium"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">{emp.name[0]}</div>{emp.name}</div></TableCell><TableCell>{emp.phone}</TableCell><TableCell><Badge className={roleColor[emp.role] || ''}>{emp.role}</Badge></TableCell><TableCell className="hidden sm:table-cell">{emp.salary ? formatCurrency(emp.salary) : '-'}</TableCell><TableCell><Badge className={STATUS_COLOR[emp.status]}>{emp.status}</Badge></TableCell><TableCell className="text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(emp)}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => remove(emp.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>
          ))}
        </TableBody></Table></CardContent></Card>
      )}
      <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? 'Edit Employee' : 'Add Employee'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3"><div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div><div><Label>Phone *</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required /></div><div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div><div><Label>Salary (PKR)</Label><Input type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} /></div></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Role</Label><Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{roleOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Status</Label><Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statusOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">{editing ? 'Update' : 'Create'}</Button></DialogFooter>
        </form>
      </DialogContent></Dialog>
    </div>
  );
}

// ==================== EXPENSES PAGE ====================
function ExpensesPage() {
  const { items, total, loading, page, setPage, search, setSearch, filter, setFilter, create, update, remove } = useCrud<Expense>('/api/expenses');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState({ category: 'rent', amount: '', description: '', date: new Date().toISOString().split('T')[0], vendorId: '', employeeId: '' });

  useEffect(() => { api<PaginatedResponse<Vendor>>('/api/vendors?limit=200').then(r => setVendors(r.data)).catch(() => {}); api<PaginatedResponse<Employee>>('/api/employees?limit=200').then(r => setEmployees(r.data)).catch(() => {}); }, []);

  const resetForm = () => setForm({ category: 'rent', amount: '', description: '', date: new Date().toISOString().split('T')[0], vendorId: '', employeeId: '' });
  const openCreate = () => { resetForm(); setEditing(null); setOpen(true); };
  const openEdit = (e: Expense) => { setForm({ category: e.category, amount: String(e.amount), description: e.description || '', date: e.date.split('T')[0], vendorId: e.vendorId || '', employeeId: e.employeeId || '' }); setEditing(e); setOpen(true); };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault(); const data = { ...form, amount: parseFloat(form.amount), vendorId: form.vendorId || null, employeeId: form.employeeId || null };
    if (editing) { await update(editing.id, data); } else { await create(data); } setOpen(false);
  };

  const catOpts = [{ value: 'rent', label: 'Rent' }, { value: 'salary', label: 'Salary' }, { value: 'equipment', label: 'Equipment' }, { value: 'maintenance', label: 'Maintenance' }, { value: 'utility', label: 'Utility' }, { value: 'transport', label: 'Transport' }, { value: 'other', label: 'Other' }];
  const catColor: Record<string, string> = { rent: 'bg-blue-100 text-blue-700', salary: 'bg-purple-100 text-purple-700', equipment: 'bg-amber-100 text-amber-700', maintenance: 'bg-cyan-100 text-cyan-700', utility: 'bg-orange-100 text-orange-700', transport: 'bg-pink-100 text-pink-700', other: 'bg-gray-100 text-gray-700' };

  const totalExpenses = items.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold">Expenses</h2><p className="text-sm text-gray-500">{total} expenses | Total: <span className="font-semibold text-red-600">{formatCurrency(totalExpenses)}</span></p></div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4 mr-2" />Add Expense</Button>
      </div>
      <SearchBar value={search} onChange={setSearch} placeholder="Search expenses..." filterValue={filter} onFilterChange={setFilter} filterOptions={catOpts} filterLabel="All Categories" />
      {loading ? <div className="flex justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-emerald-600" /></div> : (
        <Card className="border-0 shadow-sm"><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Category</TableHead><TableHead>Description</TableHead><TableHead>Amount</TableHead><TableHead className="hidden sm:table-cell">Vendor/Employee</TableHead><TableHead className="hidden md:table-cell">Date</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
          {items.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">No expenses recorded</TableCell></TableRow> : items.map(e => (
            <TableRow key={e.id}><TableCell><Badge className={catColor[e.category] || ''}>{e.category}</Badge></TableCell><TableCell className="max-w-[200px] truncate">{e.description || '-'}</TableCell><TableCell className="font-medium text-red-600">{formatCurrency(e.amount)}</TableCell><TableCell className="hidden sm:table-cell">{e.vendor?.name || e.employee?.name || '-'}</TableCell><TableCell className="hidden md:table-cell text-gray-500">{formatDate(e.date)}</TableCell><TableCell className="text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(e)}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => remove(e.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>
          ))}
        </TableBody></Table></CardContent></Card>
      )}
      <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
      <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? 'Edit Expense' : 'Add Expense'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Category *</Label><Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{catOpts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Amount (PKR) *</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required /></div>
          </div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Date *</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required /></div>
            <div><Label>Vendor (optional)</Label><Select value={form.vendorId} onValueChange={v => setForm({ ...form, vendorId: v })}><SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem>{vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div><Label>Employee (optional)</Label><Select value={form.employeeId} onValueChange={v => setForm({ ...form, employeeId: v })}><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent><SelectItem value="none">None</SelectItem>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">{editing ? 'Update' : 'Create'}</Button></DialogFooter>
        </form>
      </DialogContent></Dialog>
    </div>
  );
}

// ==================== NOTIFICATIONS PAGE ====================
function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try { const r = await api<PaginatedResponse<Notif>>('/api/notifications?limit=50'); setNotifs(r.data); } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  const markRead = async (id: string) => { await api(`/api/notifications/${id}`, { method: 'PUT', body: JSON.stringify({ isRead: true }) }); fetchNotifs(); };
  const markAllRead = async () => { for (const n of notifs.filter(n => !n.isRead)) { await api(`/api/notifications/${n.id}`, { method: 'PUT', body: JSON.stringify({ isRead: true }) }); } fetchNotifs(); };

  const typeIcon: Record<string, React.ReactNode> = { info: <Bell className="h-4 w-4" />, warning: <AlertTriangle className="h-4 w-4" />, expiry: <Clock className="h-4 w-4" />, payment: <DollarSign className="h-4 w-4" /> };
  const typeColor: Record<string, string> = { info: 'bg-blue-100 text-blue-600', warning: 'bg-amber-100 text-amber-600', expiry: 'bg-orange-100 text-orange-600', payment: 'bg-emerald-100 text-emerald-600' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Notifications</h2><p className="text-sm text-gray-500">{notifs.filter(n => !n.isRead).length} unread</p></div>
        {notifs.some(n => !n.isRead) && <Button variant="outline" size="sm" onClick={markAllRead}><CheckCheck className="h-4 w-4 mr-2" />Mark All Read</Button>}
      </div>
      {loading ? <div className="flex justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-emerald-600" /></div> : (
        <div className="space-y-2">
          {notifs.length === 0 ? <Card className="border-0 shadow-sm"><CardContent className="py-12 text-center text-gray-400">No notifications yet</CardContent></Card> : notifs.map(n => (
            <Card key={n.id} className={`border-0 shadow-sm transition-all cursor-pointer hover:shadow-md ${!n.isRead ? 'border-l-4 border-l-emerald-500' : ''}`} onClick={() => !n.isRead && markRead(n.id)}>
              <CardContent className="py-3 px-4 flex items-start gap-3">
                <div className={`p-2 rounded-lg ${typeColor[n.type] || typeColor.info} mt-0.5`}>{typeIcon[n.type] || typeIcon.info}</div>
                <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><p className={`text-sm ${!n.isRead ? 'font-semibold' : 'font-medium'}`}>{n.title}</p>{!n.isRead && <div className="w-2 h-2 rounded-full bg-emerald-500" />}</div><p className="text-sm text-gray-500 mt-0.5">{n.message}</p></div>
                <p className="text-xs text-gray-400 flex-shrink-0">{formatDateTime(n.createdAt)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CheckCheck(props: React.SVGProps<SVGSVGElement> & { className?: string }) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 7 17l-5-5" /><path d="m22 10-7.5 7.5L13 16" /></svg>; }

// ==================== SETTINGS PAGE ====================
function SettingsPage({ business }: { business: Business }) {
  const [form, setForm] = useState({ name: business.name, email: business.email, phone: business.phone || '', address: business.address || '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try { await api<Business>(`/api/auth/${business.id}`, { method: 'PUT', body: JSON.stringify(form) }); setSaved(true); setTimeout(() => setSaved(false), 2000); } catch {} finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div><h2 className="text-xl font-bold">Settings</h2><p className="text-sm text-gray-500">Manage your business profile and preferences</p></div>
      <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="text-base">Business Profile</CardTitle><CardDescription>Update your business information</CardDescription></CardHeader><CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div><Label>Business Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4"><div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div><div><Label>Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div></div>
          <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}{saved ? <CheckCircle2 className="h-4 w-4 mr-2" /> : null}{saved ? 'Saved!' : 'Save Changes'}</Button>
        </form>
      </CardContent></Card>
      <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="text-base">Subscription</CardTitle></CardHeader><CardContent>
        <div className="flex items-center gap-3 mb-4">
          <Badge className={business.plan === 'trial' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}>{business.plan === 'trial' ? 'Free Trial' : business.plan}</Badge>
          {business.trialEndsAt && <span className="text-sm text-gray-500">Expires: {formatDate(business.trialEndsAt)}</span>}
        </div>
        <p className="text-sm text-gray-500">Contact Z ISP Solution support to upgrade your plan.</p>
      </CardContent></Card>
      <Card className="border-0 shadow-sm"><CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader><CardContent className="space-y-3">
        <Button variant="outline" className="w-full justify-start" onClick={() => { if (confirm('Seed demo data? This will add sample customers, connections, and payments.')) { fetch('/api/dashboard').then(() => alert('Demo data would be seeded in production.')); } }}><ClipboardList className="h-4 w-4 mr-2" />Seed Demo Data</Button>
        <Button variant="outline" className="w-full justify-start text-red-600" onClick={() => { if (confirm('Are you sure you want to delete ALL data? This cannot be undone.')) { alert('Data deletion would run in production.'); } }}><Trash2 className="h-4 w-4 mr-2" />Delete All Data</Button>
      </CardContent></Card>
    </div>
  );
}

// ==================== ROOT COMPONENT ====================
export default function Home() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ business: Business | null }>('/api/auth/me').then(r => {
      if (r.business) setBusiness(r.business);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setBusiness(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="text-center"><div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 text-white mb-4 shadow-lg shadow-emerald-200"><Zap className="h-8 w-8 animate-pulse" /></div><p className="text-gray-500">Loading Z ISP Solution...</p></div>
      </div>
    );
  }

  if (!business) return <AuthScreen onLogin={setBusiness} />;
  return <ISPApp business={business} onLogout={handleLogout} />;
}
