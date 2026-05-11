
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { 
  Users, 
  MapPin, 
  Target, 
  MessageSquare, 
  Zap, 
  Clock, 
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { LeadStage, Lead } from '../types';
import { safeLocalStorage, STORAGE_KEYS } from '../utils/storage';

const STATS_COLORS = {
  blue: 'text-blue-500',
  indigo: 'text-indigo-500',
  emerald: 'text-emerald-500',
  rose: 'text-rose-500',
};

const StatCard = ({ label, value, icon: Icon, color, trend }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className={`p-2.5 rounded-xl bg-slate-50 ${color}`}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
      </div>
      {trend && (
        <div className="flex items-center space-x-1">
          <TrendingUp size={14} className="text-emerald-500" />
          <span className="text-xs font-semibold text-emerald-500">{trend}</span>
        </div>
      )}
    </div>
    <div className="mt-4">
      <h3 className="text-4xl font-light text-slate-900 tracking-tight">{value}</h3>
    </div>
  </div>
);

const EmptyState = ({ title, message, icon: Icon }: any) => (
  <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">
    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 text-slate-400">
      <Icon size={24} />
    </div>
    <h4 className="text-sm font-semibold text-slate-900 mb-1">{title}</h4>
    <p className="text-sm text-slate-500 max-w-sm">{message}</p>
  </div>
);

const Dashboard: React.FC = () => {
  const [leads] = useState<Lead[]>(() => {
    try {
      const saved = safeLocalStorage.getItem(STORAGE_KEYS.LEADS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse leads in Dashboard:', e);
    }
    return []; // Completely removed MOCK_LEADS
  });

  const pendingFollowups = useMemo(() => {
    const list: any[] = [];
    leads.forEach(l => {
      l.followUps?.filter(f => f.status === 'Pending').forEach(f => {
        list.push({ ...f, leadName: l.name, leadId: l.id });
      });
    });
    return list.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  }, [leads]);

  const attentionLeads = useMemo(() => {
    const now = new Date();
    return leads.filter(l => {
      const lastUpdate = l.updatedAt ? new Date(l.updatedAt) : new Date(l.createdAt);
      const hours = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
      return (l.stage === LeadStage.NEW && hours > 24) || (l.stage === LeadStage.PROPOSAL_SENT && hours > 48);
    }).slice(0, 3);
  }, [leads]);

  const chartData = useMemo(() => {
    if (leads.length === 0) return [];
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const grouped = leads.reduce((acc, lead) => {
      const d = new Date(lead.createdAt);
      const m = months[d.getMonth()];
      if (!acc[m]) acc[m] = { name: m, leads: 0, bookings: 0 };
      acc[m].leads++;
      if (lead.stage === LeadStage.BOOKED) acc[m].bookings++;
      return acc;
    }, {} as Record<string, { name: string, leads: number, bookings: number }>);
    
    return Object.values(grouped);
  }, [leads]);

  const sourceData = useMemo(() => {
    if (leads.length === 0) return [];
    
    const colors = ['#0ea5e9', '#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'];
    const counts = leads.reduce((acc, lead) => {
      const src = lead.source || 'Other';
      acc[src] = (acc[src] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([name, value], idx) => ({
        name,
        value,
        color: colors[idx % colors.length]
      }))
      .sort((a, b) => b.value - a.value);
  }, [leads]);

  const totalValue = useMemo(() => {
    return leads.reduce((sum, lead) => {
      // Very basic budget extraction to sum values. 
      // e.g "50k-1L" will map roughly, but for now we'll do a simple fallback
      const val = parseInt(lead.budgetRange.replace(/[^0-9]/g, '')) || 0;
      return sum + val;
    }, 0);
  }, [leads]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-light tracking-tight text-slate-900">Dashboard Overview</h1>
        <Link 
          to="/leads/new" 
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Add New Lead
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Leads" 
          value={leads.length} 
          icon={Users} 
          color={STATS_COLORS.blue} 
        />
        <StatCard 
          label="Pipeline Est." 
          value={`₹${totalValue}`} 
          icon={Zap} 
          color={STATS_COLORS.indigo} 
        />
        <StatCard 
          label="Conversion" 
          value={leads.length > 0 ? `${Math.round((leads.filter(l => l.stage === LeadStage.BOOKED).length / leads.length) * 100)}%` : '0%'} 
          icon={Target} 
          color={STATS_COLORS.emerald} 
        />
        <StatCard 
          label="Active Tasks" 
          value={pendingFollowups.length} 
          icon={MessageSquare} 
          color={STATS_COLORS.rose} 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Trend Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <h3 className="text-base font-semibold text-slate-900 mb-6">Volume & Conversion Trend</h3>
            
            {chartData.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLeadsBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 12}} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 12}} 
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="leads" 
                      stroke="#0ea5e9" 
                      fill="url(#colorLeadsBlue)" 
                      strokeWidth={3} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="bookings" 
                      stroke="#10b981" 
                      fill="transparent" 
                      strokeWidth={3} 
                      strokeDasharray="4 4" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState 
                icon={TrendingUp} 
                title="No Data Available" 
                message="Start adding leads to see your volume and conversion trends over time." 
              />
            )}
          </div>

          {/* Active Pipeline */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-base font-semibold text-slate-900">Recent Pipeline Actions</h3>
              <Link to="/pipeline" className="text-sm text-blue-600 font-medium hover:text-blue-700">View All</Link>
            </div>
            
            {leads.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white text-xs font-medium text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-normal">Client Name</th>
                      <th className="px-6 py-4 font-normal">Interest</th>
                      <th className="px-6 py-4 font-normal">Stage</th>
                      <th className="px-6 py-4 font-normal text-right">Est. Budget</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leads.slice(0, 5).map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <Link to={`/leads/${lead.id}`} className="block">
                            <div className="font-medium text-slate-900">{lead.name}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{lead.email || lead.phone}</div>
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                           <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                            {lead.interest}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium
                            ${lead.stage === LeadStage.BOOKED ? 'bg-emerald-50 text-emerald-700' : 
                              lead.stage === LeadStage.NEGOTIATION ? 'bg-indigo-50 text-indigo-700' : 
                              lead.stage === LeadStage.LOST ? 'bg-rose-50 text-rose-700' :
                              'bg-blue-50 text-blue-700'}`}>
                            {lead.stage}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-medium text-slate-900">₹ {lead.budgetRange}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
               <div className="p-6">
                 <EmptyState 
                   icon={Users} 
                   title="Empty Pipeline" 
                   message="Your active deals will appear here once you start generating leads." 
                 />
               </div>
            )}
          </div>
        </div>

        {/* Side Panel Area */}
        <div className="space-y-8">
          
          {/* Action Queue */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-semibold text-slate-900 flex items-center space-x-2">
                   <Clock size={18} className="text-amber-500" />
                   <span>Action Queue</span>
                </h3>
             </div>
             
             {pendingFollowups.length > 0 ? (
               <div className="space-y-4">
                  {pendingFollowups.map(f => (
                     <Link 
                       key={f.id} 
                       to={`/leads/${f.leadId}`}
                       className="block p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
                     >
                        <div className="flex items-center justify-between mb-1">
                           <span className="text-xs font-semibold text-blue-600">{f.date}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-900">{f.leadName}</p>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{f.note}</p>
                     </Link>
                  ))}
               </div>
             ) : (
                <EmptyState 
                  icon={Clock}
                  title="All caught up"
                  message="No pending follow-ups right now."
                />
             )}
          </div>

          {/* Attention Required */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
             <div className="flex items-center mb-6">
                <h3 className="text-base font-semibold text-slate-900 flex items-center space-x-2">
                   <AlertCircle size={18} className="text-rose-500" />
                   <span>Needs Attention</span>
                </h3>
             </div>
             
             {attentionLeads.length > 0 ? (
               <div className="space-y-4">
                  {attentionLeads.map(l => (
                     <Link key={l.id} to={`/leads/${l.id}`} className="block p-4 rounded-xl border border-rose-100 bg-rose-50/50 hover:bg-rose-50 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                           <span className="text-xs font-semibold text-rose-600">SLA Breach Warning</span>
                           <span className="text-xs text-slate-500">{l.stage}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-900 mt-1">{l.name}</p>
                     </Link>
                  ))}
               </div>
             ) : (
                <EmptyState 
                  icon={AlertCircle}
                  title="Smooth sailing"
                  message="No leads are currently stalled or breaching SLA guidelines."
                />
             )}
          </div>

          {/* Acquisition Sources */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <h3 className="text-base font-semibold text-slate-900 mb-6 flex items-center space-x-2">
               <MapPin size={18} className="text-indigo-500" />
               <span>Acquisition Sources</span>
            </h3>
            
            {sourceData.length > 0 ? (
              <>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={sourceData} 
                        innerRadius={60} 
                        outerRadius={80} 
                        paddingAngle={5} 
                        dataKey="value"
                        stroke="none"
                      >
                        {sourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 mt-6">
                   {sourceData.map(item => (
                     <div key={item.name} className="flex items-center justify-between text-sm">
                       <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-slate-600">{item.name}</span>
                       </div>
                       <span className="font-medium text-slate-900">{item.value}</span>
                     </div>
                   ))}
                </div>
              </>
            ) : (
               <EmptyState 
                 icon={MapPin}
                 title="No Source Data"
                 message="Add leads with traffic sources to see your acquisition breakdown."
               />
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

