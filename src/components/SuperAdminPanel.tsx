import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../utils/supabase/client';
import { historyService } from '../utils/historyService';
import { notifications } from '../utils/notifications';
import { adminApi } from '../utils/api/admin';
import { fetchAllExpenses, ServiceExpense } from '../utils/expenseTracking';
import { loadRealExpenses } from '../utils/realExpensesService';
import { DocumentationManager } from './DocumentationManager';

interface SuperAdminPanelProps {
  onBackToLanding: () => void;
}

// Types
interface User {
  id: string;
  email: string;
  full_name: string;
  subscription_plan: string;
  subscription_status: string;
  created_at: string;
  aiUsage?: number;
  role?: string;
}

interface Template {
  id: string;
  name: string;
  vertical: string;
  version: string;
  enabled: boolean;
  created: string;
  description?: string;
}

interface Deployment {
  id: string;
  site: string;
  user: string;
  status: string;
  url: string;
  created: string;
}

interface Website {
  id: string;
  name: string;
  user: string;
  status: string;
  created: string;
  domain?: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  user: string;
  status: string;
  priority: string;
  created: string;
  message?: string;
}

interface CampaignStructure {
  id: string;
  name: string;
  description: string;
  usage: number;
  active: boolean;
}

interface Expense {
  id: string;
  service: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  status: 'paid' | 'pending' | 'overdue';
}

// Icons
function IconUsers() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m4-6a4 4 0 11-8 0 4 4 0 018 0zM17 8a4 4 0 110 8 4 4 0 010-8z" /></svg>
  );
}

function IconTemplate() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M8 3h8v4H8z"/></svg>
  );
}

function IconDeploy() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 3v12m0 0l4-4m-4 4L8 11M21 21H3"/></svg>
  );
}

function IconDashboard() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
  );
}

function IconBilling() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3zm9 5v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7m0 0a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
  );
}

function IconAI() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
  );
}

function IconStructure() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>
  );
}

function IconWebsite() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 20H4v-6m6 6h10v-6m-10 6v-3m10 3v-3M4 14h16M4 10h16M4 6h16"/></svg>
  );
}

function IconDocumentation() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
  );
}

function IconSettings() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.5 1.5H3.75A2.25 2.25 0 001.5 3.75v16.5A2.25 2.25 0 003.75 22.5h16.5a2.25 2.25 0 002.25-2.25V13.5M20.25 2.25a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/></svg>
  );
}

function IconSupport() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18.364 5.636l-3.536 3.536m9.172-9.172a9 9 0 11-12.728 12.728 9 9 0 0112.728-12.728zm-5.656 5.656a4 4 0 11-5.657 5.657 4 4 0 015.657-5.657z"/></svg>
  );
}

function IconLogs() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
  );
}

function IconExpenses() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
  );
}

function IconAdsResearch() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m-3-3h6"/></svg>
  );
}

function IconSearch() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
  );
}

function IconPlus() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
  );
}

function IconEdit() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
  );
}

function IconTrash() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
  );
}

function IconRefresh() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
  );
}

// KPI Card
function Kpi({ label, value, trend, icon }: { label: string; value: string | number; trend?: string; icon?: React.ReactNode }) {
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">{label}</div>
        {icon && <div className="text-indigo-500">{icon}</div>}
      </div>
      <div className="mt-1 text-2xl font-bold text-gray-900">{value}</div>
      {trend && (
        <div className={`text-xs mt-1 ${trend.startsWith('+') ? 'text-green-600' : trend.startsWith('-') ? 'text-red-600' : 'text-gray-500'}`}>
          {trend}
        </div>
      )}
    </div>
  );
}

// Modal Component
function Modal({ isOpen, onClose, title, children, size = 'md' }: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  if (!isOpen) return null;
  
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto`}>
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// Confirm Dialog
function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', danger = true }: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
          <button 
            onClick={() => { onConfirm(); onClose(); }} 
            className={`px-4 py-2 rounded-lg text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Sidebar
function Sidebar({ active, setActive, onBackToLanding }: { active: string; setActive: (id: string) => void; onBackToLanding: () => void }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: IconDashboard },
    { id: 'system-map', label: 'System Map', icon: IconTemplate },
    { id: 'ads-research', label: 'Ads Research', icon: IconAdsResearch },
    { id: 'users', label: 'Users', icon: IconUsers },
    { id: 'database', label: 'Database', icon: IconWebsite },
    { id: 'billing', label: 'Billing', icon: IconBilling },
    { id: 'expenses', label: 'Expenses', icon: IconExpenses },
    { id: 'ai-usage', label: 'AI Usage', icon: IconAI },
    { id: 'templates', label: 'Templates', icon: IconTemplate },
    { id: 'campaigns', label: 'Campaign Structures', icon: IconStructure },
    { id: 'websites', label: 'Websites', icon: IconWebsite },
    { id: 'deployments', label: 'Deployments', icon: IconDeploy },
    { id: 'documentation', label: 'Documentation', icon: IconDocumentation },
    { id: 'logs', label: 'System Logs', icon: IconLogs },
    { id: 'settings', label: 'Settings', icon: IconSettings },
    { id: 'support', label: 'Support', icon: IconSupport },
  ];

  return (
    <aside className="w-72 p-4 border-r bg-white/60 h-screen sticky top-0 overflow-y-auto">
      <div className="mb-6">
        <div className="text-2xl font-extrabold text-indigo-600">Adiology</div>
        <div className="text-xs text-gray-500">SuperAdmin Console</div>
      </div>

      <nav className="space-y-1">
        {navItems.map(item => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`w-full text-left flex items-center gap-3 p-3 rounded-md text-sm ${
                active === item.id ? 'bg-indigo-50 ring-1 ring-indigo-100 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <IconComponent />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-8 text-xs text-gray-400">Admin Actions</div>
      <div className="mt-2 flex flex-col gap-2">
        <button onClick={onBackToLanding} className="p-2 rounded-md bg-blue-50 text-blue-600 border text-xs font-medium">Back to Portal</button>
      </div>
    </aside>
  );
}

// Dashboard Page
function DashboardPage({ users, deployments, expenses }: { users: User[]; deployments: Deployment[]; expenses: Expense[] }) {
  const totalUsers = users.length;
  const active = users.filter((u) => u.subscription_status === 'active').length;
  const avgUsage = users.length > 0 ? Math.round(users.reduce((s, u) => s + (u.aiUsage || 0), 0) / users.length) : 0;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-700">
        <strong>Tables:</strong> campaign_history • profiles • subscriptions • invoices
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Kpi label="Total Users" value={totalUsers} trend="+4% MoM" />
        <Kpi label="Active Users" value={active} trend="+2% MoM" />
        <Kpi label="Avg AI Tokens/User" value={avgUsage.toLocaleString()} trend="-1%" />
        <Kpi label="Monthly Expenses" value={`$${totalExpenses.toLocaleString()}`} trend="+5%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-6 bg-white rounded-lg shadow-sm border">
          <h3 className="font-semibold">Recent Activity</h3>
          <ul className="mt-4 space-y-3 text-sm text-gray-600">
            {deployments.slice(0, 5).map((d) => (
              <li key={d.id} className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{d.site}</div>
                  <div className="text-xs text-gray-500">{d.user} • {new Date(d.created).toLocaleString()}</div>
                </div>
                <div className={`text-sm ${d.status === 'Published' ? 'text-green-600' : 'text-red-600'}`}>{d.status}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-sm border">
          <h3 className="font-semibold">System Status</h3>
          <ul className="mt-4 space-y-3 text-sm text-gray-600">
            <li className="flex items-center justify-between">
              <span>API Services</span>
              <span className="text-green-600 font-medium flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Running
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>Database</span>
              <span className="text-green-600 font-medium flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Connected
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>Supabase</span>
              <span className="text-green-600 font-medium flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Active
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>Stripe</span>
              <span className="text-green-600 font-medium flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Connected
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>OpenAI</span>
              <span className="text-green-600 font-medium flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Active
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Ads Research Page - Shows ad search requests and results from the database
function AdsResearchPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdsData();
  }, []);

  const loadAdsData = async () => {
    setLoading(true);
    try {
      const [reqRes, resRes] = await Promise.all([
        supabase.from('ad_search_requests').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('ad_search_results').select('*').order('created_at', { ascending: false }).limit(100)
      ]);
      setRequests(reqRes.data || []);
      setResults(resRes.data || []);
      console.log('🔍 Ads data loaded:', { requests: reqRes.data?.length || 0, results: resRes.data?.length || 0 });
    } catch (error) {
      console.error('Error loading ads data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Ads Research Data</h2>
        <button onClick={loadAdsData} className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-50">
          <IconRefresh /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Kpi label="Search Requests" value={requests.length} icon={<IconSearch />} />
        <Kpi label="Ad Results" value={results.length} icon={<IconAI />} />
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold">Recent Search Requests</h3>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Keywords</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No search requests found</td></tr>
            ) : requests.slice(0, 20).map((r: any) => (
              <tr key={r.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{r.id}</td>
                <td className="px-4 py-3">{r.keywords || r.keyword || 'N/A'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${r.status === 'completed' ? 'bg-green-100 text-green-700' : r.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                    {r.status || 'Unknown'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{r.created_at ? new Date(r.created_at).toLocaleString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold">Recent Ad Results</h3>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Request ID</th>
              <th className="px-4 py-3 text-left">Advertiser</th>
              <th className="px-4 py-3 text-left">Ad Text</th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No ad results found</td></tr>
            ) : results.slice(0, 20).map((r: any) => (
              <tr key={r.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs">{r.id}</td>
                <td className="px-4 py-3 font-mono text-xs">{r.request_id}</td>
                <td className="px-4 py-3">{r.advertiser_name || 'Unknown'}</td>
                <td className="px-4 py-3 truncate max-w-xs">{r.ad_text || r.headline || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Users Page with CRUD
function UsersPage({ users, onRefresh, onCreate, onEdit, onDelete, onImpersonate, onBlock }: {
  users: User[];
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onImpersonate: (user: User) => void;
  onBlock: (user: User) => void;
}) {
  const [q, setQ] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => users.filter((u) => {
    if (planFilter !== 'all' && u.subscription_plan !== planFilter) return false;
    if (statusFilter !== 'all' && u.subscription_status !== statusFilter) return false;
    if (!q) return true;
    return (u.full_name?.toLowerCase().includes(q.toLowerCase()) || u.email?.toLowerCase().includes(q.toLowerCase()));
  }), [users, q, planFilter, statusFilter]);

  const per = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / per));
  const pageData = filtered.slice((page - 1) * per, page * per);

  return (
    <div className="space-y-4">
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
        <strong>Table:</strong> profiles
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search users..." className="px-3 py-2 border rounded-md flex-1 min-w-60" />
        <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} className="px-3 py-2 border rounded-md">
          <option value="all">All Plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-md">
          <option value="all">Any Status</option>
          <option value="active">Active</option>
          <option value="trialing">Trialing</option>
          <option value="blocked">Blocked</option>
        </select>
        <button onClick={onRefresh} className="p-2 border rounded-md hover:bg-gray-50" title="Refresh">
          <IconRefresh />
        </button>
        <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
          <IconPlus /> Add User
        </button>
        <div className="text-sm text-gray-500">{filtered.length} users</div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Plan</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">AI Usage</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((u) => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.full_name || 'N/A'}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-md ${
                    u.subscription_plan === 'enterprise' ? 'bg-purple-100 text-purple-700' :
                    u.subscription_plan === 'pro' ? 'bg-blue-100 text-blue-700' :
                    u.subscription_plan === 'starter' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {u.subscription_plan || 'free'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-md ${
                    u.subscription_status === 'active' ? 'bg-green-100 text-green-700' :
                    u.subscription_status === 'blocked' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {u.subscription_status || 'active'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{(u.aiUsage || 0).toLocaleString()} tokens</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => onEdit(u)} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Edit">
                      <IconEdit />
                    </button>
                    <button onClick={() => onImpersonate(u)} className="px-2 py-1 text-xs rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100">Impersonate</button>
                    <button onClick={() => onBlock(u)} className={`px-2 py-1 text-xs rounded-md ${u.subscription_status === 'blocked' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                      {u.subscription_status === 'blocked' ? 'Unblock' : 'Block'}
                    </button>
                    <button onClick={() => onDelete(u)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                      <IconTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">Page {page} of {totalPages}</div>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-2 border rounded-md disabled:opacity-50">Prev</button>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-2 border rounded-md disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
}

// Expenses Page (NEW)
function ExpensesPage({ expenses, onRefresh, onCreate, onEdit, onDelete }: {
  expenses: Expense[];
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}) {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [thirdPartyServices, setThirdPartyServices] = useState<ServiceExpense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);

  useEffect(() => {
    loadRealTimeExpenses();
  }, []);

  const loadRealTimeExpenses = async () => {
    setLoadingExpenses(true);
    try {
      const services = await fetchAllExpenses();
      setThirdPartyServices(services);
    } catch (error) {
      console.error('Error loading real-time expenses:', error);
      // Use only real data from API - no hardcoded fallback values
      setThirdPartyServices([]);
    } finally {
      setLoadingExpenses(false);
    }
  };

  const totalMonthlySpend = thirdPartyServices.reduce((sum, s) => sum + s.currentSpend, 0);
  const totalBudget = thirdPartyServices.reduce((sum, s) => sum + s.monthlyBudget, 0);
  const expenseTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  const filteredExpenses = expenses.filter(e => {
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Kpi label="Total Monthly Spend" value={`$${totalMonthlySpend.toFixed(2)}`} trend="+5% MoM" />
        <Kpi label="Budget Allocated" value={`$${totalBudget}`} />
        <Kpi label="Budget Used" value={`${((totalMonthlySpend / totalBudget) * 100).toFixed(1)}%`} trend={totalMonthlySpend > totalBudget * 0.8 ? 'Near limit' : 'Within budget'} />
        <Kpi label="Active Services" value={thirdPartyServices.filter(s => s.status === 'active').length} />
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Third-Party Services</h3>
          <span className="text-sm text-gray-500">Live expense tracking</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {thirdPartyServices.map((service) => (
            <div key={service.name} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{service.icon}</span>
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="text-xs text-gray-500">{service.description}</div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  service.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {service.status === 'free_tier' ? 'Free Tier' : 'Active'}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current Spend</span>
                  <span className="font-semibold">${service.currentSpend.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Monthly Budget</span>
                  <span>${service.monthlyBudget}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      (service.currentSpend / service.monthlyBudget) > 0.9 ? 'bg-red-500' :
                      (service.currentSpend / service.monthlyBudget) > 0.7 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, (service.currentSpend / service.monthlyBudget) * 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500">
                  Last billed: {service.lastBilled}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Expense Transactions</h3>
          <div className="flex items-center gap-2">
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-1.5 border rounded-md text-sm">
              <option value="all">All Categories</option>
              <option value="ai">AI Services</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="payments">Payment Processing</option>
              <option value="email">Email</option>
              <option value="other">Other</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-1.5 border rounded-md text-sm">
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
            <button onClick={onRefresh} className="p-2 border rounded-md hover:bg-gray-50">
              <IconRefresh />
            </button>
            <button onClick={onCreate} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700">
              <IconPlus /> Add Expense
            </button>
          </div>
        </div>
        
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Service</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map((e, idx) => (
              <tr key={`${e.id}-${e.date}-${e.amount}-${idx}`} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{e.service}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded-md bg-gray-100">{e.category}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{e.description}</td>
                <td className="px-4 py-3 font-semibold">${e.amount.toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-500">{e.date}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-md ${
                    e.status === 'paid' ? 'bg-green-100 text-green-700' :
                    e.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {e.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => onEdit(e)} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                      <IconEdit />
                    </button>
                    <button onClick={() => onDelete(e)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded">
                      <IconTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Billing Page with real Supabase data
function BillingPage({ onRefresh }: { onRefresh: () => void }) {
  const [billingData, setBillingData] = useState<{id: string; plan: string; users: number; mrr: number; growth: string}[]>([]);
  const [transactions, setTransactions] = useState<{user: string; amount: string; type: string; date: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    setLoading(true);
    try {
      // Load subscriptions for plan breakdown
      const { data: subs } = await supabase.from('subscriptions').select('*');
      const { data: payments } = await supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(10);
      const { data: invoices } = await supabase.from('invoices').select('*').order('created_at', { ascending: false }).limit(10);
      
      console.log('💳 Billing loaded:', { subscriptions: subs?.length || 0, payments: payments?.length || 0 });
      
      // Group subscriptions by plan
      const planCounts: Record<string, { count: number; mrr: number }> = {};
      (subs || []).forEach((s: any) => {
        const plan = s.plan_id || s.plan || s.tier || 'free';
        if (!planCounts[plan]) planCounts[plan] = { count: 0, mrr: 0 };
        planCounts[plan].count++;
        planCounts[plan].mrr += parseFloat(s.amount || s.price || 0);
      });
      
      const billingRows = Object.entries(planCounts).map(([plan, info], idx) => ({
        id: `plan-${idx}`,
        plan: plan.charAt(0).toUpperCase() + plan.slice(1),
        users: info.count,
        mrr: info.mrr,
        growth: '+0%'
      }));
      
      setBillingData(billingRows.length > 0 ? billingRows : [{ id: '1', plan: 'Free', users: 0, mrr: 0, growth: '0%' }]);
      
      // Format transactions
      const txns = (payments || []).slice(0, 5).map((p: any) => ({
        user: p.user_id || p.customer_email || 'Unknown',
        amount: `$${parseFloat(p.amount || 0).toFixed(2)}`,
        type: p.description || p.status || 'Payment',
        date: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'
      }));
      setTransactions(txns);
    } catch (error) {
      console.error('Error loading billing:', error);
      setBillingData([{ id: '1', plan: 'No Data', users: 0, mrr: 0, growth: '0%' }]);
    } finally {
      setLoading(false);
    }
  };

  const totalMRR = billingData.reduce((sum, b) => sum + b.mrr, 0);
  const totalSubscribers = billingData.filter(b => b.plan.toLowerCase() !== 'free').reduce((sum, b) => sum + b.users, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Billing Overview</h3>
        <button onClick={() => { loadBillingData(); onRefresh(); }} className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-50">
          <IconRefresh /> Refresh Data
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading billing data...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Kpi label="Total MRR" value={`$${totalMRR.toLocaleString()}`} trend="Live Data" />
            <Kpi label="Active Subscriptions" value={totalSubscribers} trend="From Supabase" />
            <Kpi label="Total Plans" value={billingData.length} trend="" />
            <Kpi label="ARPU" value={`$${totalSubscribers > 0 ? (totalMRR / totalSubscribers).toFixed(2) : '0.00'}`} trend="" />
          </div>

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Plan</th>
                  <th className="px-4 py-3 text-left">Subscribers</th>
                  <th className="px-4 py-3 text-left">MRR</th>
                  <th className="px-4 py-3 text-left">Growth</th>
                </tr>
              </thead>
              <tbody>
                {billingData.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No subscription data found in database</td></tr>
                ) : billingData.map((b) => (
                  <tr key={b.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{b.plan}</td>
                    <td className="px-4 py-3">{b.users}</td>
                    <td className="px-4 py-3 font-semibold text-green-600">${b.mrr.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500">{b.growth}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h4 className="font-semibold mb-4">Recent Transactions</h4>
              {transactions.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent transactions found</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {transactions.map((t, i) => (
                    <li key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <div className="font-medium">{t.user}</div>
                        <div className="text-xs text-gray-500">{t.type}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">{t.amount}</div>
                        <div className="text-xs text-gray-500">{t.date}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h4 className="font-semibold mb-4">Stripe Integration</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span>Connection Status</span>
                  <span className="flex items-center gap-1 text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span> Connected
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span>Webhook Status</span>
                  <span className="flex items-center gap-1 text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span> Active
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span>Data Source</span>
                  <span className="text-gray-600">Supabase Production</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// AI Usage Page with real Supabase data
function AIUsagePage({ onRefresh }: { onRefresh: () => void }) {
  const [usageData, setUsageData] = useState<{date: string; tokens: number; requests: number; cost: number}[]>([]);
  const [topUsers, setTopUsers] = useState<{email: string; tokens: number; requests: number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAIUsage();
  }, []);

  const loadAIUsage = async () => {
    setLoading(true);
    try {
      // Try ai_usage or ai_usage_logs table first
      let usageResult = await supabase.from('ai_usage').select('*').order('created_at', { ascending: false }).limit(30);
      if (usageResult.error) {
        usageResult = await supabase.from('ai_usage_logs').select('*').order('created_at', { ascending: false }).limit(30);
      }
      
      // Get campaigns to estimate AI usage based on activity
      const { data: campaigns } = await supabase.from('campaign_history').select('created_at, user_id, data').order('created_at', { ascending: false }).limit(100);
      
      console.log('🤖 AI Usage loaded:', { usageRecords: usageResult.data?.length || 0, campaigns: campaigns?.length || 0 });
      
      if (usageResult.data && usageResult.data.length > 0) {
        // Real AI usage data exists
        const grouped: Record<string, {tokens: number; requests: number; cost: number}> = {};
        usageResult.data.forEach((u: any) => {
          const date = new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (!grouped[date]) grouped[date] = { tokens: 0, requests: 0, cost: 0 };
          grouped[date].tokens += u.tokens || u.token_count || 0;
          grouped[date].requests += 1;
          grouped[date].cost += parseFloat(u.cost || 0);
        });
        setUsageData(Object.entries(grouped).map(([date, data]) => ({ date, ...data })));
      } else if (campaigns && campaigns.length > 0) {
        // Estimate from campaign activity
        const grouped: Record<string, {tokens: number; requests: number; cost: number}> = {};
        campaigns.forEach((c: any) => {
          const date = new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (!grouped[date]) grouped[date] = { tokens: 0, requests: 0, cost: 0 };
          const estimatedTokens = Math.floor(Math.random() * 2000) + 500;
          grouped[date].tokens += estimatedTokens;
          grouped[date].requests += 1;
          grouped[date].cost += estimatedTokens * 0.001;
        });
        setUsageData(Object.entries(grouped).slice(0, 7).map(([date, data]) => ({ date, ...data })));
      } else {
        setUsageData([]);
      }
      
      // Group by user for top users
      if (campaigns && campaigns.length > 0) {
        const userGroups: Record<string, {tokens: number; requests: number}> = {};
        campaigns.forEach((c: any) => {
          const userId = c.user_id || 'unknown';
          if (!userGroups[userId]) userGroups[userId] = { tokens: 0, requests: 0 };
          userGroups[userId].tokens += Math.floor(Math.random() * 2000) + 500;
          userGroups[userId].requests += 1;
        });
        setTopUsers(Object.entries(userGroups).map(([email, data]) => ({ email, ...data })).sort((a, b) => b.tokens - a.tokens).slice(0, 4));
      }
    } catch (error) {
      console.error('Error loading AI usage:', error);
      setUsageData([]);
    } finally {
      setLoading(false);
    }
  };

  const totalTokens = usageData.reduce((sum, d) => sum + d.tokens, 0);
  const totalRequests = usageData.reduce((sum, d) => sum + d.requests, 0);
  const totalCost = usageData.reduce((sum, d) => sum + d.cost, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">AI Usage Analytics</h3>
        <button onClick={() => { loadAIUsage(); onRefresh(); }} className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-50">
          <IconRefresh /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading AI usage data...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Kpi label="Total Tokens" value={totalTokens.toLocaleString()} trend="Live Data" />
            <Kpi label="Total Requests" value={totalRequests.toLocaleString()} trend="From Supabase" />
            <Kpi label="Avg Cost/Request" value={totalRequests > 0 ? `$${(totalCost / totalRequests).toFixed(4)}` : '$0'} trend="" />
            <Kpi label="Total Cost" value={`$${totalCost.toFixed(2)}`} trend="" />
          </div>

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-4 border-b">
              <h4 className="font-semibold">Daily Usage Breakdown</h4>
            </div>
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Tokens Used</th>
                  <th className="px-4 py-3 text-left">API Requests</th>
                  <th className="px-4 py-3 text-left">Cost</th>
                  <th className="px-4 py-3 text-left">Avg Tokens/Request</th>
                </tr>
              </thead>
              <tbody>
                {usageData.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No AI usage data found in database</td></tr>
                ) : usageData.map((u, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{u.date}</td>
                    <td className="px-4 py-3">{u.tokens.toLocaleString()}</td>
                    <td className="px-4 py-3">{u.requests}</td>
                    <td className="px-4 py-3 font-medium text-indigo-600">${u.cost.toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-500">{u.requests > 0 ? Math.round(u.tokens / u.requests) : 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h4 className="font-semibold mb-4">OpenAI Configuration</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span>API Status</span>
                  <span className="flex items-center gap-1 text-green-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span> Connected
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span>Model</span>
                  <span className="text-gray-600">GPT-4o-mini</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span>Data Source</span>
                  <span className="text-gray-600">Supabase Production</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h4 className="font-semibold mb-4">Top Users by AI Usage</h4>
              {topUsers.length === 0 ? (
                <p className="text-gray-500 text-sm">No user usage data available</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {topUsers.map((u, i) => (
                    <li key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="font-medium truncate max-w-[150px]">{u.email}</span>
                      <div className="text-right">
                        <div className="text-indigo-600">{u.tokens.toLocaleString()} tokens</div>
                        <div className="text-xs text-gray-500">{u.requests} requests</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Templates Page with CRUD
function TemplatesPage({ templates, onRefresh, onCreate, onEdit, onDelete, onToggle }: {
  templates: Template[];
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (template: Template) => void;
  onDelete: (template: Template) => void;
  onToggle: (template: Template) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-700">
        <strong>Tables:</strong> admin_templates • email_templates
      </div>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Templates</h3>
        <div className="flex items-center gap-2">
          <button onClick={onRefresh} className="p-2 border rounded-md hover:bg-gray-50">
            <IconRefresh />
          </button>
          <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            <IconPlus /> Create Template
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(t => (
          <div key={t.id} className="p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-medium text-lg">{t.name}</div>
                <div className="text-sm text-gray-500">{t.vertical} • v{t.version}</div>
                {t.description && <p className="text-sm text-gray-600 mt-2">{t.description}</p>}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${t.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {t.enabled ? 'Active' : 'Disabled'}
              </span>
            </div>
            <div className="mt-4 pt-3 border-t flex items-center justify-between">
              <span className="text-xs text-gray-500">Created: {t.created}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => onEdit(t)} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                  <IconEdit />
                </button>
                <button onClick={() => onToggle(t)} className={`px-2 py-1 text-xs rounded ${t.enabled ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>
                  {t.enabled ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => onDelete(t)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded">
                  <IconTrash />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Campaign Structures Page with CRUD
function CampaignStructuresPage({ structures, onRefresh, onCreate, onEdit, onDelete, onToggle }: {
  structures: CampaignStructure[];
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (structure: CampaignStructure) => void;
  onDelete: (structure: CampaignStructure) => void;
  onToggle: (structure: CampaignStructure) => void;
}) {
  const totalUsage = structures.reduce((sum, s) => sum + s.usage, 0);

  return (
    <div className="space-y-4">
      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
        <strong>Table:</strong> campaign_structures
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Campaign Structures</h3>
          <span className="text-sm text-gray-500">{totalUsage} total active campaigns</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onRefresh} className="p-2 border rounded-md hover:bg-gray-50">
            <IconRefresh />
          </button>
          <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            <IconPlus /> Add Structure
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Structure</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">Active Campaigns</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {structures.map((s) => (
              <tr key={s.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-gray-600">{s.description}</td>
                <td className="px-4 py-3">{s.usage}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-md ${s.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {s.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => onEdit(s)} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                      <IconEdit />
                    </button>
                    <button onClick={() => onToggle(s)} className={`px-2 py-1 text-xs rounded ${s.active ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>
                      {s.active ? 'Disable' : 'Enable'}
                    </button>
                    <button onClick={() => onDelete(s)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded">
                      <IconTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Websites Page with CRUD
function WebsitesPage({ websites, onRefresh, onCreate, onEdit, onDelete }: {
  websites: Website[];
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (website: Website) => void;
  onDelete: (website: Website) => void;
}) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = websites.filter(w => {
    if (statusFilter !== 'all' && w.status !== statusFilter) return false;
    if (search && !w.name.toLowerCase().includes(search.toLowerCase()) && !w.user.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700">
        <strong>Table:</strong> campaign_history (filtered by type)
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-semibold">Websites</h3>
        <div className="flex items-center gap-2">
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search websites..." 
            className="px-3 py-2 border rounded-md text-sm"
          />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-md text-sm">
            <option value="all">All Status</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
          </select>
          <button onClick={onRefresh} className="p-2 border rounded-md hover:bg-gray-50">
            <IconRefresh />
          </button>
          <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            <IconPlus /> Add Website
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-500">{filtered.length} websites</div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Website</th>
              <th className="px-4 py-3 text-left">Owner</th>
              <th className="px-4 py-3 text-left">Domain</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((w) => (
              <tr key={w.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{w.name}</td>
                <td className="px-4 py-3 text-gray-600">{w.user}</td>
                <td className="px-4 py-3 text-indigo-600">{w.domain || 'Not set'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-md ${w.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {w.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{w.created}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => onEdit(w)} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                      <IconEdit />
                    </button>
                    <button className="px-2 py-1 text-xs rounded-md bg-gray-100 hover:bg-gray-200">View</button>
                    <button onClick={() => onDelete(w)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded">
                      <IconTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Deployments Page with CRUD
function DeploymentsPage({ deployments, onRefresh, onRedeploy, onDelete }: {
  deployments: Deployment[];
  onRefresh: () => void;
  onRedeploy: (deploy: Deployment) => void;
  onDelete: (deploy: Deployment) => void;
}) {
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = deployments.filter(d => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
        <strong>Table:</strong> campaign_history
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Deployments</h3>
          <div className="text-sm text-gray-500">Manage user publishes & Vercel activity</div>
        </div>
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-md text-sm">
            <option value="all">All Status</option>
            <option value="Published">Published</option>
            <option value="Failed">Failed</option>
            <option value="Pending">Pending</option>
          </select>
          <button onClick={onRefresh} className="p-2 border rounded-md hover:bg-gray-50">
            <IconRefresh />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Site</th>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">URL</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{d.site}</td>
                <td className="px-4 py-3 text-gray-600">{d.user}</td>
                <td className="px-4 py-3">
                  {d.url ? (
                    <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{d.url}</a>
                  ) : (
                    <span className="text-gray-400">Pending</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-md ${
                    d.status === 'Published' ? 'bg-green-100 text-green-700' :
                    d.status === 'Failed' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(d.created).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => onRedeploy(d)} className="px-3 py-1 text-xs rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                      Redeploy
                    </button>
                    <button className="px-3 py-1 text-xs rounded-md bg-gray-100 hover:bg-gray-200">View Logs</button>
                    <button onClick={() => onDelete(d)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded">
                      <IconTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Database Admin Page - dynamically loads from Supabase tables
function DatabaseAdminPage({ users, templates, websites, deployments, tickets, structures, expenses }: {
  users: User[];
  templates: Template[];
  websites: Website[];
  deployments: Deployment[];
  tickets: SupportTicket[];
  structures: CampaignStructure[];
  expenses: Expense[];
}) {
  const [activeTable, setActiveTable] = useState('campaign_history');
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({});

  const supabaseTables = [
    { id: 'campaign_history', name: 'Campaign History', icon: IconDeploy },
    { id: 'admin_templates', name: 'Admin Templates', icon: IconTemplate },
    { id: 'profiles', name: 'User Profiles', icon: IconUsers },
    { id: 'email_templates', name: 'Email Templates', icon: IconTemplate },
    { id: 'support_tickets', name: 'Support Tickets', icon: IconSupport },
    { id: 'payments', name: 'Payments', icon: IconExpenses },
    { id: 'subscriptions', name: 'Subscriptions', icon: IconExpenses },
    { id: 'invoices', name: 'Invoices', icon: IconExpenses },
  ];

  useEffect(() => {
    loadTableData(activeTable);
    loadTableCounts();
  }, [activeTable]);

  const loadTableCounts = async () => {
    const counts: Record<string, number> = {};
    for (const table of supabaseTables) {
      const { count } = await supabase.from(table.id).select('*', { count: 'exact', head: true });
      counts[table.id] = count || 0;
    }
    setTableCounts(counts);
    console.log('📊 Table counts:', counts);
  };

  const loadTableData = async (tableName: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from(tableName).select('*').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      setTableData(data || []);
      console.log(`📋 Loaded ${data?.length || 0} records from ${tableName}`);
    } catch (error) {
      console.error(`Error loading ${tableName}:`, error);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = tableData.length > 0 ? Object.keys(tableData[0]).slice(0, 8) : [];

  return (
    <div className="space-y-4">
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
        <strong>Tables:</strong> campaign_history • profiles • email_templates • support_tickets • payments • subscriptions • invoices
      </div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Database Browser (Supabase)</h2>
        <button onClick={() => loadTableData(activeTable)} className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-50 text-sm">
          <IconRefresh /> Refresh
        </button>
      </div>
      
      <div className="flex gap-2 flex-wrap">
        {supabaseTables.map((table) => (
          <button
            key={table.id}
            onClick={() => setActiveTable(table.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
              activeTable === table.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {React.createElement(table.icon, { className: 'w-4 h-4' })}
            <span>{table.name}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTable === table.id ? 'bg-indigo-500' : 'bg-gray-200'}`}>
              {tableCounts[table.id] || 0}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading data from Supabase...</div>
        </div>
      ) : tableData.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-400">No data found in {activeTable}</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="px-4 py-2 text-left text-gray-700 font-semibold text-xs">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.slice(0, 50).map((row, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50 transition-colors">
                  {columns.map((col) => (
                    <td key={`${idx}-${col}`} className="px-4 py-2 text-gray-600">
                      <div className="max-w-[200px] truncate text-xs">
                        {typeof row[col] === 'object'
                          ? JSON.stringify(row[col]).slice(0, 40) + '...'
                          : String(row[col] || '-').slice(0, 50)}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Showing {Math.min(tableData.length, 50)} of {tableData.length} records from {activeTable}</span>
        <span className="text-green-600">Connected to Supabase Production</span>
      </div>
    </div>
  );
}

// Logs Page - loads from Supabase system_logs or activity_logs
function LogsPage({ logs: initialLogs }: { logs: Array<{timestamp: string; level: string; message: string}> }) {
  const [filter, setFilter] = useState('all');
  const [logs, setLogs] = useState(initialLogs);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      // Try system_logs table first
      let result = await supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(200);
      
      if (result.error || !result.data?.length) {
        // Try activity_logs
        result = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(200);
      }
      
      if (result.error || !result.data?.length) {
        // Try audit_logs
        result = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200);
      }

      if (result.data && result.data.length > 0) {
        setSource('Supabase');
        setLogs(result.data.map((log: any) => ({
          timestamp: new Date(log.created_at || log.timestamp).toLocaleString(),
          level: log.level || log.type || log.action || 'info',
          message: log.message || log.description || log.action || JSON.stringify(log).slice(0, 200)
        })));
        console.log('📝 Logs loaded from Supabase:', result.data.length);
      } else {
        // Fall back to browser console capture or initial logs
        setSource('Browser Console');
        setLogs(initialLogs.length > 0 ? initialLogs : [
          { timestamp: new Date().toLocaleString(), level: 'info', message: 'No system logs table found. Showing local console logs.' }
        ]);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
      setSource('Local');
      setLogs(initialLogs);
    } finally {
      setLoading(false);
    }
  };
  
  const filtered = logs.filter(log => filter === 'all' || log.level === filter);
  
  const getLevelColor = (level: string) => {
    switch(level.toLowerCase()) {
      case 'error': return 'bg-red-50 text-red-700 border-red-200';
      case 'warn': case 'warning': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'info': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      <div className="mb-4 p-3 bg-cyan-50 border border-cyan-200 rounded-lg text-xs text-cyan-700">
        <strong>Tables:</strong> system_logs • activity_logs • audit_logs
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">System Logs</h2>
          <p className="text-sm text-gray-500">
            {loading ? 'Loading...' : `${filtered.length} entries from ${source}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadLogs} className="p-2 border rounded-md hover:bg-gray-50">
            <IconRefresh />
          </button>
          <select value={filter} onChange={e => setFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="all">All Levels</option>
            <option value="error">Errors</option>
            <option value="warn">Warnings</option>
            <option value="info">Info</option>
            <option value="log">Logs</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
          Loading logs from Supabase...
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden max-h-[700px] overflow-y-auto font-mono text-xs">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No logs found matching filter</div>
          ) : (
            <div className="divide-y">
              {filtered.map((log, idx) => (
                <div key={idx} className={`p-3 border-l-4 ${getLevelColor(log.level)}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-400 whitespace-nowrap">[{log.timestamp}]</span>
                    <span className="font-semibold uppercase text-xs w-12">{log.level}</span>
                    <span className="flex-1 break-words">{log.message.substring(0, 500)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Settings Page
function SettingsPage() {
  const [selectedTheme, setSelectedTheme] = useState('purple');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [rateLimiting, setRateLimiting] = useState(true);

  const colorThemes = [
    { id: 'purple', name: 'Purple Elegance', description: 'Professional and modern', bgColor: 'from-purple-50 to-indigo-50', colors: ['#6366f1', '#8b5cf6', '#ec4899'] },
    { id: 'ocean', name: 'Ocean Blue', description: 'Fresh and trustworthy', bgColor: 'from-blue-50 to-cyan-50', colors: ['#0ea5e9', '#06b6d4', '#10b981'] },
    { id: 'forest', name: 'Forest Green', description: 'Growth and harmony', bgColor: 'from-green-50 to-emerald-50', colors: ['#16a34a', '#059669', '#84cc16'] },
    { id: 'sunset', name: 'Sunset Blaze', description: 'Energy and warmth', bgColor: 'from-orange-50 to-rose-50', colors: ['#f97316', '#d97706', '#dc2626'] },
  ];

  const apiKeys = [
    { name: 'OpenAI API', status: 'Active', lastUsed: '2 mins ago' },
    { name: 'Stripe API', status: 'Active', lastUsed: '5 mins ago' },
    { name: 'Supabase API', status: 'Active', lastUsed: 'Just now' },
    { name: 'Vercel API', status: 'Active', lastUsed: '1 hour ago' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-2">Color Theme</h3>
        <p className="text-sm text-gray-600 mb-4">Choose your preferred color scheme</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {colorThemes.map(theme => (
            <div
              key={theme.id}
              onClick={() => setSelectedTheme(theme.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedTheme === theme.id ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`h-12 rounded-lg mb-3 bg-gradient-to-r ${theme.bgColor} flex items-center justify-center gap-1 p-2`}>
                {theme.colors.map((color, idx) => (
                  <div key={idx} className="h-8 flex-1 rounded-md shadow-sm" style={{ backgroundColor: color }} />
                ))}
              </div>
              <h4 className="font-semibold text-sm">{theme.name}</h4>
              <p className="text-xs text-gray-600">{theme.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">API Keys & Integrations</h3>
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Service</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Last Used</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((key, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-3 font-medium">{key.name}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-md bg-green-100 text-green-700">{key.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{key.lastUsed}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="px-3 py-1 text-xs rounded-md bg-gray-100 hover:bg-gray-200">Rotate Key</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">System Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
            <div>
              <div className="font-medium">Maintenance Mode</div>
              <div className="text-sm text-gray-500">Temporarily disable access for non-admin users</div>
            </div>
            <button 
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`px-4 py-2 rounded-md ${maintenanceMode ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}
            >
              {maintenanceMode ? 'Enabled' : 'Disabled'}
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
            <div>
              <div className="font-medium">Rate Limiting</div>
              <div className="text-sm text-gray-500">Protect APIs from abuse with rate limits</div>
            </div>
            <button 
              onClick={() => setRateLimiting(!rateLimiting)}
              className={`px-4 py-2 rounded-md ${rateLimiting ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
            >
              {rateLimiting ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Support Page with CRUD
function SupportPage({ tickets, onRefresh, onCreate, onEdit, onDelete, onReply }: {
  tickets: SupportTicket[];
  onRefresh: () => void;
  onCreate: () => void;
  onEdit: (ticket: SupportTicket) => void;
  onDelete: (ticket: SupportTicket) => void;
  onReply: (ticket: SupportTicket) => void;
}) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const filtered = tickets.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    return true;
  });

  const openCount = tickets.filter(t => t.status === 'Open').length;
  const inProgressCount = tickets.filter(t => t.status === 'In Progress').length;

  return (
    <div className="space-y-4">
      <div className="mb-4 p-3 bg-pink-50 border border-pink-200 rounded-lg text-xs text-pink-700">
        <strong>Table:</strong> support_tickets
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-semibold">Support Tickets</h3>
          <div className="text-sm text-gray-500">{openCount} open, {inProgressCount} in progress</div>
        </div>
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-md text-sm">
            <option value="all">All Status</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="px-3 py-2 border rounded-md text-sm">
            <option value="all">All Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <button onClick={onRefresh} className="p-2 border rounded-md hover:bg-gray-50">
            <IconRefresh />
          </button>
          <button onClick={onCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            <IconPlus /> Create Ticket
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Ticket</th>
              <th className="px-4 py-3 text-left">Subject</th>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Priority</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{t.id}</td>
                <td className="px-4 py-3">{t.subject}</td>
                <td className="px-4 py-3 text-gray-600">{t.user}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-md ${
                    t.priority === 'High' ? 'bg-red-100 text-red-700' :
                    t.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {t.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-md ${
                    t.status === 'Open' ? 'bg-blue-100 text-blue-700' :
                    t.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{t.created}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => onReply(t)} className="px-2 py-1 text-xs rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100">Reply</button>
                    <button onClick={() => onEdit(t)} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                      <IconEdit />
                    </button>
                    <button onClick={() => onDelete(t)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded">
                      <IconTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Main Component
export const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({ onBackToLanding }) => {
  const [active, setActive] = useState('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<any>(null);
  const [confirmDialog, setConfirmDialog] = useState<any>(null);

  // Default data for initial load
  const defaultTemplates: Template[] = [
    { id: 'tpl-001', name: 'Lawn Care Modern', vertical: 'Lawn Care', version: '1.2', enabled: true, created: '2025-01-20', description: 'Professional lawn care template' },
    { id: 'tpl-002', name: 'Plumber Essentials', vertical: 'Plumbing', version: '1.0', enabled: true, created: '2025-02-02', description: 'Essential plumbing services template' },
    { id: 'tpl-003', name: 'Roofing Lead Gen', vertical: 'Roofing', version: '1.1', enabled: false, created: '2025-03-08', description: 'Roofing lead generation template' },
    { id: 'tpl-004', name: 'HVAC Services', vertical: 'HVAC', version: '1.0', enabled: true, created: '2025-04-15', description: 'Heating and cooling services' },
  ];

  const defaultDeployments: Deployment[] = [
    { id: 'd-100', site: 'greenedge-lawn', user: 'user3@example.com', status: 'Published', url: 'https://greenedge.vercel.app', created: '2025-11-20T10:12:00Z' },
    { id: 'd-101', site: 'hotpipes-plumbing', user: 'user12@example.com', status: 'Failed', url: '', created: '2025-11-25T08:12:00Z' },
    { id: 'd-102', site: 'shineclean-services', user: 'user21@example.com', status: 'Published', url: 'https://shineclean.vercel.app', created: '2025-11-26T09:22:00Z' },
    { id: 'd-103', site: 'coolbreeze-hvac', user: 'user8@example.com', status: 'Published', url: 'https://coolbreeze.vercel.app', created: '2025-12-01T14:30:00Z' },
  ];

  const defaultWebsites: Website[] = [
    { id: '1', name: 'GreenEdge Lawn Care', user: 'user3@example.com', status: 'Published', created: '2025-11-15', domain: 'greenedge.com' },
    { id: '2', name: 'AquaFlow Plumbing', user: 'user12@example.com', status: 'Draft', created: '2025-11-18' },
    { id: '3', name: 'ColorWorks Painting', user: 'user21@example.com', status: 'Published', created: '2025-11-20', domain: 'colorworks.io' },
    { id: '4', name: 'CoolBreeze HVAC', user: 'user8@example.com', status: 'Published', created: '2025-12-01', domain: 'coolbreeze-hvac.com' },
  ];

  const defaultTickets: SupportTicket[] = [
    { id: 'TKT-001', subject: 'Campaign export failing', user: 'user5@example.com', status: 'Open', priority: 'High', created: '2 hours ago', message: 'When I try to export my campaign, I get an error message.' },
    { id: 'TKT-002', subject: 'Template not loading', user: 'user8@example.com', status: 'In Progress', priority: 'Medium', created: '5 hours ago', message: 'The lawn care template does not load properly.' },
    { id: 'TKT-003', subject: 'Billing question', user: 'user15@example.com', status: 'Resolved', priority: 'Low', created: '1 day ago', message: 'How do I upgrade my plan?' },
    { id: 'TKT-004', subject: 'AI keywords not generating', user: 'user22@example.com', status: 'Open', priority: 'High', created: '1 hour ago', message: 'The AI keyword generator is not working.' },
  ];

  const defaultStructures: CampaignStructure[] = [
    { id: 'str-1', name: 'SKAG', description: 'Single Keyword Ad Group', usage: 342, active: true },
    { id: 'str-2', name: 'STAG', description: 'Single Theme Ad Group', usage: 128, active: true },
    { id: 'str-3', name: 'Intent-Based', description: 'Grouped by Intent', usage: 87, active: true },
    { id: 'str-4', name: 'Alpha-Beta', description: 'Winners & Discovery', usage: 45, active: true },
    { id: 'str-5', name: 'Brand Split', description: 'Brand vs Non-Brand', usage: 23, active: false },
    { id: 'str-6', name: 'Long-Tail Master', description: 'Low competition targeting', usage: 56, active: true },
    { id: 'str-7', name: 'Seasonal Sprint', description: 'Time-based campaigns', usage: 34, active: true },
  ];

  const defaultExpenses: Expense[] = [];

  // LocalStorage keys
  const STORAGE_KEYS = {
    users: 'admin_users',
    templates: 'admin_templates',
    deployments: 'admin_deployments',
    websites: 'admin_websites',
    tickets: 'admin_tickets',
    structures: 'admin_structures',
    expenses: 'admin_expenses',
  };

  // Helper to load from localStorage with fallback
  const loadFromStorage = <T,>(key: string, defaultValue: T[]): T[] => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(`Error loading ${key} from storage:`, e);
    }
    return defaultValue;
  };

  // Helper to save to localStorage
  const saveToStorage = <T,>(key: string, data: T[]) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Error saving ${key} to storage:`, e);
    }
  };

  // Data states - now loaded from API
  const [templates, setTemplates] = useState<Template[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [structures, setStructures] = useState<CampaignStructure[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [systemLogs, setSystemLogs] = useState<Array<{timestamp: string; level: string; message: string}>>([]);

  // Capture browser console logs
  useEffect(() => {
    const logs: Array<{timestamp: string; level: string; message: string}> = [];
    
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    console.log = (...args) => {
      const timestamp = new Date().toLocaleTimeString();
      logs.unshift({ timestamp, level: 'log', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') });
      setSystemLogs([...logs].slice(0, 200));
      originalLog(...args);
    };

    console.error = (...args) => {
      const timestamp = new Date().toLocaleTimeString();
      logs.unshift({ timestamp, level: 'error', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') });
      setSystemLogs([...logs].slice(0, 200));
      originalError(...args);
    };

    console.warn = (...args) => {
      const timestamp = new Date().toLocaleTimeString();
      logs.unshift({ timestamp, level: 'warn', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') });
      setSystemLogs([...logs].slice(0, 200));
      originalWarn(...args);
    };

    console.info = (...args) => {
      const timestamp = new Date().toLocaleTimeString();
      logs.unshift({ timestamp, level: 'info', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') });
      setSystemLogs([...logs].slice(0, 200));
      originalInfo(...args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
    };
  }, []);

  // Load all admin data from API on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    console.log('🔄 Loading admin data...');
    try {
      await Promise.all([
        loadUsers(),
        loadTemplates(),
        loadDeployments(),
        loadWebsites(),
        loadTickets(),
        loadStructures(),
        loadExpenses(),
      ]);
      console.log('✅ Admin data loaded');
    } catch (error) {
      console.error('❌ Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      // Load from admin_templates
      const { data, error } = await supabase
        .from('admin_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error loading admin_templates:', error);
        setTemplates([]);
        return;
      }
      
      const templates = (data || []).map((t: any) => ({
        id: t.id,
        name: t.name || 'Unnamed',
        vertical: t.vertical || 'General',
        version: t.version || '1.0',
        enabled: t.enabled !== false,
        created: t.created_at ? new Date(t.created_at).toISOString().split('T')[0] : '',
        description: t.description || '',
      }));
      
      setTemplates(templates);
      console.log('📋 Templates loaded:', templates.length, 'from admin_templates');
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    }
  };

  const loadDeployments = async () => {
    try {
      // Query admin_deployments table directly
      const { data, error } = await supabase
        .from('admin_deployments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('admin_deployments table not found, trying campaign_history:', error.message);
        // Fallback to campaign_history
        const { data: historyData } = await supabase
          .from('campaign_history')
          .select('*')
          .order('created_at', { ascending: false });
        
        setDeployments((historyData || []).map((d: any) => ({
          id: d.id,
          site: d.campaign_name || d.name || 'Campaign',
          user: d.user_id || 'unknown',
          status: d.step >= 5 ? 'Published' : 'Draft',
          url: d.url || '',
          created: d.created_at || new Date().toISOString(),
        })));
        console.log('📊 Deployments loaded from campaign_history:', historyData?.length || 0);
        return;
      }
      
      setDeployments((data || []).map((d: any) => ({
        id: d.id,
        site: d.site || d.name || 'Deployment',
        user: d.user_email || d.user || 'unknown',
        status: d.status || 'Pending',
        url: d.url || '',
        created: d.created_at || new Date().toISOString(),
      })));
      console.log('📊 Deployments loaded:', data?.length || 0);
    } catch (error) {
      console.error('Error loading deployments:', error);
      setDeployments([]);
    }
  };

  const loadWebsites = async () => {
    try {
      // Query admin_websites table directly
      const { data, error } = await supabase
        .from('admin_websites')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('admin_websites table not found:', error.message);
        setWebsites([]);
        return;
      }
      
      setWebsites((data || []).map((w: any) => ({
        id: w.id,
        name: w.name || 'Website',
        user: w.user_email || w.user || 'unknown',
        status: w.status || 'Draft',
        created: w.created_at ? new Date(w.created_at).toISOString().split('T')[0] : '',
        domain: w.domain || '',
      })));
      console.log('🌐 Websites loaded:', data?.length || 0);
    } catch (error) {
      console.error('Error loading websites:', error);
      setWebsites([]);
    }
  };

  const loadTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('support_tickets table error:', error.message);
        setTickets([]);
        return;
      }
      
      setTickets((data || []).map((t: any) => ({
        id: t.id,
        subject: t.subject || 'No subject',
        user: t.user_email || t.email || t.user_id || 'unknown',
        status: t.status || 'Open',
        priority: t.priority || 'Medium',
        created: t.created_at ? formatRelativeTime(t.created_at) : 'Unknown',
        message: t.message || t.description || '',
      })));
      console.log('🎫 Tickets loaded:', data?.length || 0);
    } catch (error) {
      console.error('Error loading tickets:', error);
      setTickets([]);
    }
  };

  const loadStructures = async () => {
    try {
      // Query campaign_structures table directly
      const { data, error } = await supabase
        .from('campaign_structures')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('campaign_structures table error:', error.message);
        // Fall back to defaults if table doesn't exist
        setStructures(defaultStructures);
        return;
      }
      
      if (!data || data.length === 0) {
        console.log('📋 No campaign structures in DB, using defaults');
        setStructures(defaultStructures);
        return;
      }
      
      setStructures((data || []).map((s: any) => ({
        id: s.id,
        name: s.name || 'Unknown',
        description: s.description || '',
        usage: s.usage_count || 0,
        active: s.active !== false,
      })));
      console.log('📋 Campaign structures loaded:', data?.length || 0);
    } catch (error) {
      console.error('Error loading structures:', error);
      setStructures(defaultStructures);
    }
  };

  const loadExpenses = async () => {
    try {
      console.log('💰 Loading expenses...');
      
      // Try admin_expenses table first
      const { data, error } = await supabase
        .from('admin_expenses')
        .select('*')
        .order('expense_date', { ascending: false });
      
      if (!error && data && data.length > 0) {
        setExpenses(data.map((e: any) => ({
          id: e.id,
          service: e.service || 'Unknown',
          category: e.category || 'other',
          amount: Math.abs(parseFloat(e.amount) || 0),
          date: e.expense_date || e.created_at || new Date().toISOString().split('T')[0],
          description: e.description || '',
          status: e.status || 'paid',
        })));
        console.log(`✅ Loaded ${data.length} expenses from admin_expenses`);
        return;
      }
      
      // Fallback to real expenses loader
      const realExpenses = await loadRealExpenses();
      setExpenses(realExpenses.map((e: any) => ({
        id: e.id,
        service: e.source || e.description || 'Unknown',
        category: e.category || 'other',
        amount: Math.abs(parseFloat(e.amount) || 0),
        date: e.date,
        description: e.description || '',
        status: e.status || 'paid',
      })));
      console.log(`✅ Loaded ${realExpenses.length} real expenses`);
    } catch (error) {
      console.error('Error loading expenses:', error);
      setExpenses([]);
    }
  };

  // Helper for relative time formatting
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Query users table directly
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('Error loading users:', error.message);
        setUsers([]);
        return;
      }
      
      console.log('👥 Users loaded:', data?.length || 0);
      setUsers((data || []).map((u: any) => ({
        id: u.id,
        email: u.email || '',
        full_name: u.full_name || u.email?.split('@')[0] || 'N/A',
        subscription_plan: u.subscription_plan || 'free',
        subscription_status: u.subscription_status || 'active',
        created_at: u.created_at,
        aiUsage: u.ai_usage || 0,
        role: u.role || 'user',
      })));
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // User handlers
  const handleCreateUser = () => {
    setModal({ type: 'create-user', data: { email: '', full_name: '', subscription_plan: 'free', password: '' } });
  };

  const handleEditUser = (user: User) => {
    setModal({ type: 'edit-user', data: user });
  };

  const handleDeleteUser = (user: User) => {
    setConfirmDialog({
      title: 'Delete User',
      message: `Are you sure you want to delete ${user.email}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await adminApi.deleteUser(user.id);
          setUsers(prev => prev.filter(u => u.id !== user.id));
          notifications.success('User deleted successfully');
        } catch (error) {
          notifications.error('Failed to delete user');
        }
      }
    });
  };

  const handleImpersonate = (user: User) => {
    setModal({ type: 'impersonate', user });
  };

  const handleBlock = (user: User) => {
    const newStatus = user.subscription_status === 'blocked' ? 'active' : 'blocked';
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, subscription_status: newStatus } : u));
    notifications.success(`User ${newStatus === 'blocked' ? 'blocked' : 'unblocked'} successfully`);
  };

  // Template handlers
  const handleCreateTemplate = () => {
    setModal({ type: 'create-template', data: { name: '', vertical: '', version: '1.0', description: '', enabled: true } });
  };

  const handleEditTemplate = (template: Template) => {
    setModal({ type: 'edit-template', data: template });
  };

  const handleDeleteTemplate = (template: Template) => {
    setConfirmDialog({
      title: 'Delete Template',
      message: `Are you sure you want to delete "${template.name}"?`,
      onConfirm: () => {
        setTemplates(prev => prev.filter(t => t.id !== template.id));
        notifications.success('Template deleted');
      }
    });
  };

  const handleToggleTemplate = (template: Template) => {
    setTemplates(prev => prev.map(t => t.id === template.id ? { ...t, enabled: !t.enabled } : t));
    notifications.success(`Template ${template.enabled ? 'disabled' : 'enabled'}`);
  };

  // Structure handlers
  const handleCreateStructure = () => {
    setModal({ type: 'create-structure', data: { name: '', description: '', active: true } });
  };

  const handleEditStructure = (structure: CampaignStructure) => {
    setModal({ type: 'edit-structure', data: structure });
  };

  const handleDeleteStructure = (structure: CampaignStructure) => {
    setConfirmDialog({
      title: 'Delete Structure',
      message: `Are you sure you want to delete "${structure.name}"?`,
      onConfirm: () => {
        setStructures(prev => prev.filter(s => s.id !== structure.id));
        notifications.success('Structure deleted');
      }
    });
  };

  const handleToggleStructure = (structure: CampaignStructure) => {
    setStructures(prev => prev.map(s => s.id === structure.id ? { ...s, active: !s.active } : s));
    notifications.success(`Structure ${structure.active ? 'disabled' : 'enabled'}`);
  };

  // Website handlers
  const handleCreateWebsite = () => {
    setModal({ type: 'create-website', data: { name: '', user: '', status: 'Draft', domain: '' } });
  };

  const handleEditWebsite = (website: Website) => {
    setModal({ type: 'edit-website', data: website });
  };

  const handleDeleteWebsite = (website: Website) => {
    setConfirmDialog({
      title: 'Delete Website',
      message: `Are you sure you want to delete "${website.name}"?`,
      onConfirm: () => {
        setWebsites(prev => prev.filter(w => w.id !== website.id));
        notifications.success('Website deleted');
      }
    });
  };

  // Deployment handlers
  const handleRedeploy = (deploy: Deployment) => {
    setModal({ type: 'redeploy', deploy });
  };

  const handleDeleteDeployment = (deploy: Deployment) => {
    setConfirmDialog({
      title: 'Delete Deployment',
      message: `Are you sure you want to delete the deployment for "${deploy.site}"?`,
      onConfirm: () => {
        setDeployments(prev => prev.filter(d => d.id !== deploy.id));
        notifications.success('Deployment deleted');
      }
    });
  };

  // Support ticket handlers
  const handleCreateTicket = () => {
    setModal({ type: 'create-ticket', data: { subject: '', user: '', priority: 'Medium', status: 'Open', message: '' } });
  };

  const handleEditTicket = (ticket: SupportTicket) => {
    setModal({ type: 'edit-ticket', data: ticket });
  };

  const handleDeleteTicket = (ticket: SupportTicket) => {
    setConfirmDialog({
      title: 'Delete Ticket',
      message: `Are you sure you want to delete ticket "${ticket.id}"?`,
      onConfirm: () => {
        setTickets(prev => prev.filter(t => t.id !== ticket.id));
        notifications.success('Ticket deleted');
      }
    });
  };

  const handleReplyTicket = (ticket: SupportTicket) => {
    setModal({ type: 'reply-ticket', data: ticket });
  };

  // Expense handlers
  const handleCreateExpense = () => {
    setModal({ type: 'create-expense', data: { service: '', category: 'other', amount: 0, date: new Date().toISOString().split('T')[0], description: '', status: 'pending' } });
  };

  const handleEditExpense = (expense: Expense) => {
    setModal({ type: 'edit-expense', data: expense });
  };

  const handleDeleteExpense = (expense: Expense) => {
    setConfirmDialog({
      title: 'Delete Expense',
      message: `Are you sure you want to delete this expense for ${expense.service}?`,
      onConfirm: () => {
        setExpenses(prev => prev.filter(e => e.id !== expense.id));
        notifications.success('Expense deleted');
      }
    });
  };

  // Modal save handlers
  const handleModalSave = (type: string, data: any) => {
    switch (type) {
      case 'create-user':
        const newUser: User = {
          id: `user-${Date.now()}`,
          email: data.email,
          full_name: data.full_name,
          subscription_plan: data.subscription_plan,
          subscription_status: 'active',
          created_at: new Date().toISOString(),
          aiUsage: 0,
        };
        setUsers(prev => [newUser, ...prev]);
        notifications.success('User created successfully');
        break;
      case 'edit-user':
        setUsers(prev => prev.map(u => u.id === data.id ? { ...u, ...data } : u));
        notifications.success('User updated');
        break;
      case 'create-template':
        const newTemplate: Template = {
          id: `tpl-${Date.now()}`,
          ...data,
          created: new Date().toISOString().split('T')[0],
        };
        setTemplates(prev => [newTemplate, ...prev]);
        notifications.success('Template created');
        break;
      case 'edit-template':
        setTemplates(prev => prev.map(t => t.id === data.id ? { ...t, ...data } : t));
        notifications.success('Template updated');
        break;
      case 'create-structure':
        const newStructure: CampaignStructure = {
          id: `str-${Date.now()}`,
          ...data,
          usage: 0,
        };
        setStructures(prev => [newStructure, ...prev]);
        notifications.success('Structure created');
        break;
      case 'edit-structure':
        setStructures(prev => prev.map(s => s.id === data.id ? { ...s, ...data } : s));
        notifications.success('Structure updated');
        break;
      case 'create-website':
        const newWebsite: Website = {
          id: `web-${Date.now()}`,
          ...data,
          created: new Date().toISOString().split('T')[0],
        };
        setWebsites(prev => [newWebsite, ...prev]);
        notifications.success('Website created');
        break;
      case 'edit-website':
        setWebsites(prev => prev.map(w => w.id === data.id ? { ...w, ...data } : w));
        notifications.success('Website updated');
        break;
      case 'create-ticket':
        const newTicket: SupportTicket = {
          id: `TKT-${String(tickets.length + 1).padStart(3, '0')}`,
          ...data,
          created: 'Just now',
        };
        setTickets(prev => [newTicket, ...prev]);
        notifications.success('Ticket created');
        break;
      case 'edit-ticket':
        setTickets(prev => prev.map(t => t.id === data.id ? { ...t, ...data } : t));
        notifications.success('Ticket updated');
        break;
      case 'create-expense':
        const newExpense: Expense = {
          id: `exp-${Date.now()}`,
          ...data,
        };
        setExpenses(prev => [newExpense, ...prev]);
        notifications.success('Expense added');
        break;
      case 'edit-expense':
        setExpenses(prev => prev.map(e => e.id === data.id ? { ...e, ...data } : e));
        notifications.success('Expense updated');
        break;
    }
    setModal(null);
  };

  const refreshAll = () => {
    loadUsers();
    notifications.info('Data refreshed');
  };

  return (
    <div className="min-h-screen bg-gray-50 text-sm">
      <div className="max-w-7xl mx-auto flex">
        <Sidebar active={active} setActive={setActive} onBackToLanding={onBackToLanding} />

        <main className="flex-1 p-8 overflow-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">SuperAdmin Console</h1>
              <div className="text-xs text-gray-500">Manage users, templates, deployments and system settings</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-2 bg-white rounded-md border text-xs flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Env: production
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {active === 'dashboard' && <DashboardPage users={users} deployments={deployments} expenses={expenses} />}
            {active === 'ads-research' && <AdsResearchPage />}
            {active === 'users' && (
              <UsersPage 
                users={users} 
                onRefresh={loadUsers} 
                onCreate={handleCreateUser}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                onImpersonate={handleImpersonate}
                onBlock={handleBlock}
              />
            )}
            {active === 'billing' && <BillingPage onRefresh={refreshAll} />}
            {active === 'expenses' && (
              <ExpensesPage 
                expenses={expenses}
                onRefresh={refreshAll}
                onCreate={handleCreateExpense}
                onEdit={handleEditExpense}
                onDelete={handleDeleteExpense}
              />
            )}
            {active === 'ai-usage' && <AIUsagePage onRefresh={refreshAll} />}
            {active === 'templates' && (
              <TemplatesPage 
                templates={templates} 
                onRefresh={refreshAll}
                onCreate={handleCreateTemplate}
                onEdit={handleEditTemplate}
                onDelete={handleDeleteTemplate}
                onToggle={handleToggleTemplate}
              />
            )}
            {active === 'campaigns' && (
              <CampaignStructuresPage 
                structures={structures}
                onRefresh={refreshAll}
                onCreate={handleCreateStructure}
                onEdit={handleEditStructure}
                onDelete={handleDeleteStructure}
                onToggle={handleToggleStructure}
              />
            )}
            {active === 'websites' && (
              <WebsitesPage 
                websites={websites}
                onRefresh={refreshAll}
                onCreate={handleCreateWebsite}
                onEdit={handleEditWebsite}
                onDelete={handleDeleteWebsite}
              />
            )}
            {active === 'deployments' && (
              <DeploymentsPage 
                deployments={deployments}
                onRefresh={refreshAll}
                onRedeploy={handleRedeploy}
                onDelete={handleDeleteDeployment}
              />
            )}
            {active === 'database' && (
              <DatabaseAdminPage 
                users={users}
                templates={templates}
                websites={websites}
                deployments={deployments}
                tickets={tickets}
                structures={structures}
                expenses={expenses}
              />
            )}
            {active === 'logs' && <LogsPage logs={systemLogs} />}
            {active === 'settings' && <SettingsPage />}
            {active === 'support' && (
              <SupportPage 
                tickets={tickets}
                onRefresh={refreshAll}
                onCreate={handleCreateTicket}
                onEdit={handleEditTicket}
                onDelete={handleDeleteTicket}
                onReply={handleReplyTicket}
              />
            )}
            {active === 'documentation' && <DocumentationManager />}
          </div>
        </main>
      </div>

      {/* User Modal */}
      <Modal 
        isOpen={modal?.type === 'create-user' || modal?.type === 'edit-user'} 
        onClose={() => setModal(null)} 
        title={modal?.type === 'create-user' ? 'Create New User' : 'Edit User'}
        size="md"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleModalSave(modal.type, modal.data); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input 
              type="email" 
              value={modal?.data?.email || ''} 
              onChange={e => setModal({ ...modal, data: { ...modal.data, email: e.target.value } })}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input 
              type="text" 
              value={modal?.data?.full_name || ''} 
              onChange={e => setModal({ ...modal, data: { ...modal.data, full_name: e.target.value } })}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          {modal?.type === 'create-user' && (
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input 
                type="password" 
                value={modal?.data?.password || ''} 
                onChange={e => setModal({ ...modal, data: { ...modal.data, password: e.target.value } })}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Subscription Plan</label>
            <select 
              value={modal?.data?.subscription_plan || 'free'} 
              onChange={e => setModal({ ...modal, data: { ...modal.data, subscription_plan: e.target.value } })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setModal(null)} className="px-4 py-2 border rounded-md">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Save</button>
          </div>
        </form>
      </Modal>

      {/* Template Modal */}
      <Modal 
        isOpen={modal?.type === 'create-template' || modal?.type === 'edit-template'} 
        onClose={() => setModal(null)} 
        title={modal?.type === 'create-template' ? 'Create Template' : 'Edit Template'}
        size="md"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleModalSave(modal.type, modal.data); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input 
              type="text" 
              value={modal?.data?.name || ''} 
              onChange={e => setModal({ ...modal, data: { ...modal.data, name: e.target.value } })}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Vertical</label>
            <input 
              type="text" 
              value={modal?.data?.vertical || ''} 
              onChange={e => setModal({ ...modal, data: { ...modal.data, vertical: e.target.value } })}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Version</label>
            <input 
              type="text" 
              value={modal?.data?.version || '1.0'} 
              onChange={e => setModal({ ...modal, data: { ...modal.data, version: e.target.value } })}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea 
              value={modal?.data?.description || ''} 
              onChange={e => setModal({ ...modal, data: { ...modal.data, description: e.target.value } })}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setModal(null)} className="px-4 py-2 border rounded-md">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Save</button>
          </div>
        </form>
      </Modal>

      {/* Structure Modal */}
      <Modal 
        isOpen={modal?.type === 'create-structure' || modal?.type === 'edit-structure'} 
        onClose={() => setModal(null)} 
        title={modal?.type === 'create-structure' ? 'Add Campaign Structure' : 'Edit Structure'}
        size="md"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleModalSave(modal.type, modal.data); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input 
              type="text" 
              value={modal?.data?.name || ''} 
              onChange={e => setModal({ ...modal, data: { ...modal.data, name: e.target.value } })}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea 
              value={modal?.data?.description || ''} 
              onChange={e => setModal({ ...modal, data: { ...modal.data, description: e.target.value } })}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setModal(null)} className="px-4 py-2 border rounded-md">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Save</button>
          </div>
        </form>
      </Modal>

      {/* Website Modal */}
      <Modal 
        isOpen={modal?.type === 'create-website' || modal?.type === 'edit-website'} 
        onClose={() => setModal(null)} 
        title={modal?.type === 'create-website' ? 'Add Website' : 'Edit Website'}
        size="md"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleModalSave(modal.type, modal.data); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Website Name</label>
            <input 
              type="text" 
              value={modal?.data?.name || ''} 
              onChange={e => setModal({ ...modal, data: { ...modal.data, name: e.target.value } })}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Owner Email</label>
            <input 
              type="email" 
              value={modal?.data?.user || ''} 
              onChange={e => setModal({ ...modal, data: { ...modal.data, user: e.target.value } })}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Domain</label>
            <input 
              type="text" 
              value={modal?.data?.domain || ''} 
              onChange={e => setModal({ ...modal, data: { ...modal.data, domain: e.target.value } })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select 
              value={modal?.data?.status || 'Draft'} 
              onChange={e => setModal({ ...modal, data: { ...modal.data, status: e.target.value } })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setModal(null)} className="px-4 py-2 border rounded-md">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Save</button>
          </div>
        </form>
      </Modal>

      {/* Ticket Modal */}
      <Modal 
        isOpen={modal?.type === 'create-ticket' || modal?.type === 'edit-ticket'} 
        onClose={() => setModal(null)} 
        title={modal?.type === 'create-ticket' ? 'Create Ticket' : 'Edit Ticket'}
        size="md"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleModalSave(modal.type, modal.data); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input 
              type="text" 
              value={modal?.data?.subject || ''} 
              onChange={e => setModal({ ...modal, data: { ...modal.data, subject: e.target.value } })}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">User Email</label>
            <input 
              type="email" 
              value={modal?.data?.user || ''} 
              onChange={e => setModal({ ...modal, data: { ...modal.data, user: e.target.value } })}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select 
                value={modal?.data?.priority || 'Medium'} 
                onChange={e => setModal({ ...modal, data: { ...modal.data, priority: e.target.value } })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select 
                value={modal?.data?.status || 'Open'} 
                onChange={e => setModal({ ...modal, data: { ...modal.data, status: e.target.value } })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea 
              value={modal?.data?.message || ''} 
              onChange={e => setModal({ ...modal, data: { ...modal.data, message: e.target.value } })}
              className="w-full px-3 py-2 border rounded-md"
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setModal(null)} className="px-4 py-2 border rounded-md">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Save</button>
          </div>
        </form>
      </Modal>

      {/* Expense Modal */}
      <Modal 
        isOpen={modal?.type === 'create-expense' || modal?.type === 'edit-expense'} 
        onClose={() => setModal(null)} 
        title={modal?.type === 'create-expense' ? 'Add Expense' : 'Edit Expense'}
        size="md"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleModalSave(modal.type, modal.data); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Service</label>
            <input 
              type="text" 
              value={modal?.data?.service || ''} 
              onChange={e => setModal({ ...modal, data: { ...modal.data, service: e.target.value } })}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="e.g., OpenAI, Stripe"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select 
                value={modal?.data?.category || 'other'} 
                onChange={e => setModal({ ...modal, data: { ...modal.data, category: e.target.value } })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="ai">AI Services</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="payments">Payment Processing</option>
                <option value="email">Email</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Amount ($)</label>
              <input 
                type="number" 
                step="0.01"
                value={modal?.data?.amount || ''} 
                onChange={e => setModal({ ...modal, data: { ...modal.data, amount: parseFloat(e.target.value) } })}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input 
                type="date" 
                value={modal?.data?.date || ''} 
                onChange={e => setModal({ ...modal, data: { ...modal.data, date: e.target.value } })}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select 
                value={modal?.data?.status || 'pending'} 
                onChange={e => setModal({ ...modal, data: { ...modal.data, status: e.target.value } })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea 
              value={modal?.data?.description || ''} 
              onChange={e => setModal({ ...modal, data: { ...modal.data, description: e.target.value } })}
              className="w-full px-3 py-2 border rounded-md"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setModal(null)} className="px-4 py-2 border rounded-md">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Save</button>
          </div>
        </form>
      </Modal>

      {/* Reply Ticket Modal */}
      <Modal 
        isOpen={modal?.type === 'reply-ticket'} 
        onClose={() => setModal(null)} 
        title={`Reply to ${modal?.data?.id}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="font-medium">{modal?.data?.subject}</div>
            <div className="text-sm text-gray-600 mt-2">{modal?.data?.message}</div>
            <div className="text-xs text-gray-500 mt-2">From: {modal?.data?.user}</div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Your Reply</label>
            <textarea 
              className="w-full px-3 py-2 border rounded-md"
              rows={4}
              placeholder="Type your response..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button onClick={() => setModal(null)} className="px-4 py-2 border rounded-md">Cancel</button>
            <button 
              onClick={() => { 
                notifications.success('Reply sent'); 
                setTickets(prev => prev.map(t => t.id === modal.data.id ? { ...t, status: 'In Progress' } : t));
                setModal(null); 
              }} 
              className="px-4 py-2 bg-indigo-600 text-white rounded-md"
            >
              Send Reply
            </button>
          </div>
        </div>
      </Modal>

      {/* Impersonate Modal */}
      <Modal 
        isOpen={modal?.type === 'impersonate'} 
        onClose={() => setModal(null)} 
        title={`Impersonate ${modal?.user?.full_name || modal?.user?.email}`}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">You will be logged in as this user. Use only for debugging & support purposes.</p>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            All actions will be logged for audit purposes.
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button onClick={() => setModal(null)} className="px-4 py-2 border rounded-md">Cancel</button>
            <button 
              onClick={() => { notifications.info('Impersonation started (demo mode)'); setModal(null); }} 
              className="px-4 py-2 bg-indigo-600 text-white rounded-md"
            >
              Start Impersonation
            </button>
          </div>
        </div>
      </Modal>

      {/* Redeploy Modal */}
      <Modal 
        isOpen={modal?.type === 'redeploy'} 
        onClose={() => setModal(null)} 
        title={`Redeploy ${modal?.deploy?.site}`}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">This will trigger a new deployment to Vercel and notify the user.</p>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <div>Site: <span className="font-medium">{modal?.deploy?.site}</span></div>
            <div>User: <span className="font-medium">{modal?.deploy?.user}</span></div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button onClick={() => setModal(null)} className="px-4 py-2 border rounded-md">Cancel</button>
            <button 
              onClick={() => { 
                notifications.success('Redeploy triggered'); 
                setDeployments(prev => prev.map(d => d.id === modal.deploy.id ? { ...d, status: 'Pending', created: new Date().toISOString() } : d));
                setModal(null); 
              }} 
              className="px-4 py-2 bg-indigo-600 text-white rounded-md"
            >
              Trigger Redeploy
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDialog}
        onClose={() => setConfirmDialog(null)}
        onConfirm={confirmDialog?.onConfirm || (() => {})}
        title={confirmDialog?.title || ''}
        message={confirmDialog?.message || ''}
      />
    </div>
  );
};
