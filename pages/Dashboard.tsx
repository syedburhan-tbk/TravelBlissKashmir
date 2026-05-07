
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, Users, MapPin, CheckCircle, Target, MessageSquare, Zap, Clock, AlertCircle, ChevronRight, IndianRupee } from 'lucide-react';
import { MOCK_LEADS, MOCK_TRIPS } from '../constants';
import { LeadStage, LeadScore, Lead } from '../types';

const data = [
  { name: 'Jan', leads: 45, bookings: 12 },
  { name: 'Feb', leads: 52, bookings: 15 },
  { name: 'Mar', leads: 61, bookings: 18 },
  { name: 'Apr', leads: 58, bookings: 14 },
  { name: 'May', leads: 89, bookings: 25 },
  { name: 'Jun', leads: 95, bookings: 28 },
];

const sourceData = [
  { name: 'Instagram', value: 40, color: '#ec4899' },
  { name: 'Website', value: 30, color: '#2563eb' },
  { name: 'Referral', value: 15, color: '#10b981' },
  { name: 'Google Ads', value: 15, color: '#f59e0b' },
];

const StatCard = ({ label, value, icon: Icon, color, trend }: any) => (
  <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-5 -mr-10 -mt-10 rounded-full group-hover:scale-150 transition-transform duration-700`} />
    <div className="flex items-start justify-between">
      <div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{label}</p>
        <h3 className="text-4xl font-black text-slate-900 mt-2 tracking-tighter">{value}</h3>
      </div>
      <div className={`${color} p-4 rounded-2xl text-white shadow-lg`}>
        <Icon size={24} />
      </div>
    </div>
    <div className="mt-6 flex items-center gap-1.5">
      <TrendingUp size={14} className="text-emerald-500 font-black" />
      <span className="text-emerald-500 text-[10px] font-black">{trend}</span>
      <span className="text-slate-300 text-[10px] font-bold uppercase tracking-widest ml-1">Growth</span>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const leads: Lead[] = useMemo(() => {
    const saved = localStorage.getItem('et_leads');
    return saved ? JSON.parse(saved) : MOCK_LEADS;
  }, []);

  const pendingFollowups = useMemo(() => {
    const list: any[] = [];
    leads.forEach(l => {
      l.followUps.filter(f => f.status === 'Pending').forEach(f => {
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

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Leads" value={leads.length} icon={Users} color="bg-blue-600" trend="+12.5%" />
        <StatCard label="Pipeline Value" value="₹ 64L" icon={Zap} color="bg-indigo-600" trend="+4.3%" />
        <StatCard label="Conv. Rate" value="24.2%" icon={Target} color="bg-emerald-600" trend="+18.2%" />
        <StatCard label="Active Follows" value={pendingFollowups.length} icon={MessageSquare} color="bg-rose-600" trend="+10.1%" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-sm">
            <h3 className="text-slate-900 font-black text-lg mb-8 uppercase tracking-widest flex items-center gap-3">
               <div className="w-2 h-6 bg-blue-600 rounded-full" /> Lead Volume & Conversion
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                  <Tooltip />
                  <Area type="monotone" dataKey="leads" stroke="#2563eb" fillOpacity={1} fill="url(#colorLeads)" strokeWidth={4} />
                  <Area type="monotone" dataKey="bookings" stroke="#10b981" fillOpacity={0} strokeWidth={4} strokeDasharray="8 8" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-[48px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-slate-900 font-black text-lg uppercase tracking-widest">High-Value Active Pipeline</h3>
              <Link to="/pipeline" className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline">View Pipeline</Link>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">
                <tr>
                  <th className="px-10 py-5">Client Profile</th>
                  <th className="px-10 py-5">Interest</th>
                  <th className="px-10 py-5">Stage</th>
                  <th className="px-10 py-5 text-right">Budget</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {leads.slice(0, 5).map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                    <td className="px-10 py-6">
                      <Link to={`/leads/${lead.id}`}>
                        <div className="font-black text-slate-900 text-base">{lead.name}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{lead.email}</div>
                      </Link>
                    </td>
                    <td className="px-10 py-6">
                       <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-blue-50 text-blue-600 rounded-full">{lead.interest}</span>
                    </td>
                    <td className="px-10 py-6">
                      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                        lead.stage === LeadStage.BOOKED ? 'bg-emerald-100 text-emerald-700' : 
                        lead.stage === LeadStage.NEGOTIATION ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {lead.stage}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-right font-black text-slate-900 text-lg tracking-tighter">₹ {lead.budgetRange}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 p-8 rounded-[48px] text-white space-y-8 shadow-2xl">
             <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                   <Clock size={16} className="text-blue-400" /> Daily Follow-up Queue
                </h3>
                <span className="bg-blue-600 text-[10px] font-black px-3 py-1 rounded-full uppercase">{pendingFollowups.length} Tasks</span>
             </div>
             <div className="space-y-4">
                {pendingFollowups.map(f => (
                   <Link 
                     key={f.id} 
                     to={`/leads/${f.leadId}`}
                     className="block p-5 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all group"
                   >
                      <div className="flex items-center justify-between mb-2">
                         <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{f.date}</span>
                         <ChevronRight size={14} className="text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-sm font-bold text-white mb-1">{f.leadName}</p>
                      <p className="text-xs text-slate-400 line-clamp-1">{f.note}</p>
                   </Link>
                ))}
                {pendingFollowups.length === 0 && (
                   <div className="py-10 text-center space-y-3 opacity-20">
                      <CheckCircle size={40} className="mx-auto" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Queue Clear</p>
                   </div>
                )}
             </div>
          </div>

          <div className="bg-rose-50 p-8 rounded-[48px] border border-rose-100 space-y-6">
             <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-rose-600 flex items-center gap-2">
                   <AlertCircle size={16} /> Rule-Based Attention
                </h3>
             </div>
             <div className="space-y-4">
                {attentionLeads.map(l => (
                   <Link key={l.id} to={`/leads/${l.id}`} className="block bg-white p-4 rounded-3xl border border-rose-100 shadow-sm hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-2">
                         <span className="text-[9px] font-black text-rose-500 uppercase bg-rose-50 px-2 py-0.5 rounded">Inactivity</span>
                         <span className="text-[9px] font-bold text-slate-400">{l.stage}</span>
                      </div>
                      <p className="font-black text-slate-900 text-sm">{l.name}</p>
                   </Link>
                ))}
                {attentionLeads.length === 0 && (
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center py-4">All leads within SLA</p>
                )}
             </div>
          </div>

          <div className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-sm">
            <h3 className="text-slate-900 font-black text-lg mb-8 uppercase tracking-widest">Acquisition</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceData} innerRadius={60} outerRadius={80} paddingAngle={10} dataKey="value">
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4 mt-6">
               {sourceData.map(item => (
                 <div key={item.name} className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{item.name}</span>
                   </div>
                   <span className="text-xs font-black text-slate-400">{item.value}%</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
