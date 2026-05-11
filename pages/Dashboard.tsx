
import React, { useMemo, useState, useEffect } from 'react';
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
  YAxis,
  CartesianGrid
} from 'recharts';
import { 
  Users, 
  MapPin, 
  Target, 
  MessageSquare, 
  Zap, 
  Clock, 
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  Plus,
  FileText,
  MousePointer2,
  Calendar,
  Activity,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LeadStage, Lead, Trip } from '../types';
import { safeLocalStorage, STORAGE_KEYS } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';

const APPLE_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  purple: '#AF52DE',
  pink: '#FF2D55',
  teal: '#5AC8FA',
  indigo: '#5856D6',
};

const STATS_COLORS = {
  blue: 'text-[#007AFF] bg-[#007AFF]/10',
  indigo: 'text-[#5856D6] bg-[#5856D6]/10',
  emerald: 'text-[#34C759] bg-[#34C759]/10',
  rose: 'text-[#FF3B30] bg-[#FF3B30]/10',
};

const StatCard = ({ label, value, icon: Icon, colorClass, trend, delay = 0 }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="bg-white/80 backdrop-blur-xl p-6 rounded-[24px] border border-slate-200/50 shadow-sm hover:shadow-md transition-all group"
  >
    <div className="flex items-center justify-between">
      <div className={`p-3 rounded-2xl ${colorClass} transition-transform group-hover:scale-110 duration-300`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      {trend && (
        <div className="flex items-center space-x-1 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
          <ArrowUpRight size={12} className="text-emerald-600" />
          <span className="text-[10px] font-bold text-emerald-600">{trend}</span>
        </div>
      )}
    </div>
    <div className="mt-5">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <h3 className="text-3xl font-bold text-slate-900 tracking-tighter mt-1">{value}</h3>
    </div>
  </motion.div>
);

const EmptyState = ({ title, message, icon: Icon }: any) => (
  <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50/30 backdrop-blur-sm rounded-[32px] border border-slate-200 border-dashed">
    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 text-slate-300 border border-slate-100">
      <Icon size={32} strokeWidth={1.5} />
    </div>
    <h4 className="text-base font-bold text-slate-800 mb-1 tracking-tight">{title}</h4>
    <p className="text-sm text-slate-500 max-w-xs">{message}</p>
  </div>
);

const SectionHeader = ({ title, icon: Icon, color, action }: any) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center space-x-3">
      {Icon && (
        <div className={`p-2 rounded-xl bg-white shadow-sm border border-slate-100 ${color}`}>
          <Icon size={18} />
        </div>
      )}
      <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
    </div>
    {action}
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-xl">
        <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-3 mb-1 last:mb-0">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-sm font-bold text-slate-800">{entry.name}:</span>
            <span className="text-sm font-black text-slate-900">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC = () => {
  const { userProfile } = useAuth();
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
    return [];
  });

  const [trips] = useState<Trip[]>(() => {
    try {
      const saved = safeLocalStorage.getItem(STORAGE_KEYS.TRIPS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse trips:', e);
    }
    return [];
  });

  const [greeting] = useState(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
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
    }).slice(0, 4);
  }, [leads]);

  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = new Date().getMonth();
    // Show last 6 months
    const last6 = [];
    for (let i = 5; i >= 0; i--) {
      const idx = (currentMonthIdx - i + 12) % 12;
      last6.push(months[idx]);
    }

    const grouped = leads.reduce((acc, lead) => {
      const d = new Date(lead.createdAt);
      const m = months[d.getMonth()];
      if (last6.includes(m)) {
        if (!acc[m]) acc[m] = { name: m, leads: 0, bookings: 0 };
        acc[m].leads++;
        if (lead.stage === LeadStage.BOOKED) acc[m].bookings++;
      }
      return acc;
    }, {} as Record<string, { name: string, leads: number, bookings: number }>);
    
    return last6.map(m => grouped[m] || { name: m, leads: 0, bookings: 0 });
  }, [leads]);

  const sourceData = useMemo(() => {
    if (leads.length === 0) return [];
    const colors = [APPLE_COLORS.blue, APPLE_COLORS.indigo, APPLE_COLORS.purple, APPLE_COLORS.pink, APPLE_COLORS.orange, APPLE_COLORS.teal];
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
    return leads.filter(l => l.stage !== LeadStage.LOST).reduce((sum, lead) => {
      const val = parseInt(lead.budgetRange.replace(/[^0-9]/g, '')) || 0;
      return sum + val;
    }, 0);
  }, [leads]);

  const stats = [
    { label: "Total Leads", value: leads.length, icon: Users, color: STATS_COLORS.blue, trend: "+12%" },
    { label: "Pipeline Value", value: `₹${(totalValue/100000).toFixed(1)}L`, icon: Zap, color: STATS_COLORS.indigo, trend: "+8%" },
    { label: "Conversion Rate", value: leads.length > 0 ? `${Math.round((leads.filter(l => l.stage === LeadStage.BOOKED).length / leads.length) * 100)}%` : '0%', icon: Target, color: STATS_COLORS.emerald, trend: "+3%" },
    { label: "Active Tasks", value: pendingFollowups.length, icon: MessageSquare, color: STATS_COLORS.rose, trend: "-2%" },
  ];

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 pb-20 overflow-visible">
      {/* Top Banner / Greeting */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1 className="text-4xl font-bold tracking-tighter text-slate-900">
            {greeting}, <span className="text-[#007AFF]">{userProfile?.name.split(' ')[0] || 'Partner'}</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Here's what's happening with your travel business today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
            <Filter size={16} />
            <span>Filters</span>
          </button>
          <Link 
            to="/leads/new" 
            className="flex items-center gap-2 bg-[#007AFF] hover:bg-[#0070E0] text-white px-6 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-blue-200 active:scale-95"
          >
            <Plus size={18} />
            <span>New Lead</span>
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <StatCard key={stat.label} {...stat} colorClass={stat.color} delay={idx * 0.1} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Main Insights */}
        <div className="xl:col-span-8 space-y-8">
          
          {/* Main Trend Chart */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white/70 backdrop-blur-sm p-8 rounded-[32px] border border-slate-200/50 shadow-sm"
          >
            <SectionHeader 
              title="Conversion Performance" 
              icon={Activity} 
              color="text-blue-500"
              action={
                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#007AFF]" />
                    <span>Active Leads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#34C759]" />
                    <span>Booked Trips</span>
                  </div>
                </div>
              }
            />
            
            <div className="h-[360px] w-full mt-4">
              {chartData.some(d => d.leads > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#007AFF" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#007AFF" stopOpacity={0.01}/>
                      </linearGradient>
                      <linearGradient id="bookedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34C759" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#34C759" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} 
                      dy={15}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} 
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      name="Active Leads"
                      type="monotone" 
                      dataKey="leads" 
                      stroke="#007AFF" 
                      fill="url(#leadsGradient)" 
                      strokeWidth={4} 
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#007AFF' }}
                    />
                    <Area 
                      name="Booked Trips"
                      type="monotone" 
                      dataKey="bookings" 
                      stroke="#34C759" 
                      fill="url(#bookedGradient)" 
                      strokeWidth={4} 
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#34C759' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState 
                  icon={TrendingUp} 
                  title="No conversion history" 
                  message="Start booking trips to see your success metrics visualized here." 
                />
              )}
            </div>
          </motion.div>

          {/* Detailed Pipeline */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                  <MousePointer2 size={18} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Active Opportunities</h3>
              </div>
              <Link to="/pipeline" className="text-sm border border-slate-200 px-4 py-1.5 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all">Manage All</Link>
            </div>
            
            {leads.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <tr>
                      <th className="px-8 py-4">Client Representative</th>
                      <th className="px-8 py-4">Package/Interest</th>
                      <th className="px-8 py-4">Status & Health</th>
                      <th className="px-8 py-4 text-right">Potential Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {leads.slice(0, 5).map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                        <td className="px-8 py-5">
                          <Link to={`/leads/${lead.id}`} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold border border-slate-200 overflow-hidden">
                              {lead.name.charAt(0)}
                            </div>
                            <div>
                               <div className="font-bold text-slate-800 group-hover:text-[#007AFF] transition-colors">{lead.name}</div>
                               <div className="text-[11px] font-medium text-slate-500 mt-0.5">{lead.email || lead.phone}</div>
                            </div>
                          </Link>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex flex-col gap-1">
                             <span className="text-[11px] font-bold text-slate-400 uppercase">{lead.source || 'Direct'}</span>
                             <span className="text-xs font-bold text-slate-700">{lead.interest}</span>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              lead.stage === LeadStage.BOOKED ? 'bg-emerald-500' : 
                              lead.stage === LeadStage.NEGOTIATION ? 'bg-indigo-500' : 
                              lead.stage === LeadStage.LOST ? 'bg-slate-300' : 'bg-blue-500'
                             }`} />
                            <span className="text-xs font-bold text-slate-600">{lead.stage}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span className="text-sm font-black text-slate-900">₹{lead.budgetRange}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
                <div className="p-12">
                  <EmptyState 
                    icon={Users} 
                    title="Pipeline is quiet" 
                    message="No active leads found. High time to launch a new marketing campaign!" 
                  />
                </div>
            )}
          </motion.div>
        </div>

        {/* Right Column / Side Widgets */}
        <div className="xl:col-span-4 space-y-8">
          
          {/* Quick Actions Grid */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-2 gap-4"
          >
            <Link to="/leads/new" className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-[#007AFF] transition-all group flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-50 text-[#007AFF] rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform font-bold">
                <Plus size={24} />
              </div>
              <span className="text-xs font-bold text-slate-800">Add Lead</span>
            </Link>
            <Link to="/trips/new" className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-[#34C759] transition-all group flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-emerald-50 text-[#34C759] rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform font-bold">
                <Calendar size={24} />
              </div>
              <span className="text-xs font-bold text-slate-800">Create Trip</span>
            </Link>
            <Link to="/templates" className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-[#AF52DE] transition-all group flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-purple-50 text-[#AF52DE] rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform font-bold">
                <FileText size={24} />
              </div>
              <span className="text-xs font-bold text-slate-800">Templates</span>
            </Link>
            <Link to="/settings" className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-[#FF9500] transition-all group flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-orange-50 text-[#FF9500] rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform font-bold">
                <MoreHorizontal size={24} />
              </div>
              <span className="text-xs font-bold text-slate-800">Settings</span>
            </Link>
          </motion.div>

          {/* Critical Follow-ups */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm"
          >
             <SectionHeader 
               title="Next Actions" 
               icon={Clock} 
               color="text-amber-500" 
             />
             
             {pendingFollowups.length > 0 ? (
               <div className="space-y-4">
                  {pendingFollowups.map(f => (
                     <Link 
                       key={f.id} 
                       to={`/leads/${f.leadId}`}
                       className="block p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
                     >
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-full">{f.date}</span>
                        </div>
                        <p className="text-sm font-bold text-slate-800 group-hover:text-[#007AFF] transition-colors">{f.leadName}</p>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1 italic">{f.note}</p>
                     </Link>
                  ))}
               </div>
             ) : (
                <EmptyState 
                  icon={Clock}
                  title="Zero pending tasks"
                  message="Your action queue is empty. You're completely up to date!"
                />
             )}
          </motion.div>

          {/* Attention / SLA Warning */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-[#FFF5F5] p-8 rounded-[32px] border border-rose-100 shadow-sm"
          >
             <SectionHeader 
               title="Needs Attention" 
               icon={AlertCircle} 
               color="text-rose-500" 
             />
             
             <AnimatePresence>
              {attentionLeads.length > 0 ? (
                <motion.div layout className="space-y-4">
                    {attentionLeads.map(l => (
                      <motion.div key={l.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Link to={`/leads/${l.id}`} className="block p-4 rounded-2xl border border-rose-200 bg-white hover:bg-rose-50 transition-all shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded-full">SLA Breach</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">{l.stage}</span>
                            </div>
                            <p className="text-sm font-bold text-slate-800">{l.name}</p>
                            <p className="text-[10px] text-slate-500 mt-1">Stalled for {Math.floor((new Date().getTime() - new Date(l.updatedAt || l.createdAt).getTime()) / (1000 * 60 * 60))}h</p>
                        </Link>
                      </motion.div>
                    ))}
                </motion.div>
              ) : (
                  <EmptyState 
                    icon={AlertCircle}
                    title="Healthy Pipeline"
                    message="Every lead is moving through the funnel within expected timeframes."
                  />
              )}
             </AnimatePresence>
          </motion.div>

          {/* Allocation Analysis */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm"
          >
            <SectionHeader 
              title="Traffic Distribution" 
              icon={MapPin} 
              color="text-indigo-500" 
            />
            
            {sourceData.length > 0 ? (
              <>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={sourceData} 
                        innerRadius={70} 
                        outerRadius={90} 
                        paddingAngle={5} 
                        dataKey="value"
                        stroke="none"
                      >
                        {sourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} cornerRadius={4} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4 mt-8">
                   {sourceData.map(item => (
                     <div key={item.name} className="flex items-center justify-between">
                       <div className="flex items-center space-x-3">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm font-medium text-slate-600">{item.name}</span>
                       </div>
                       <span className="text-sm font-black text-slate-900">{item.value}</span>
                     </div>
                   ))}
                </div>
              </>
            ) : (
               <EmptyState 
                 icon={MapPin}
                 title="No traffic records"
                 message="Add source data to leads to see your acquisition channels."
               />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

