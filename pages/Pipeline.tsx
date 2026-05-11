
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LeadStage, Lead, LeadScore, TripType } from '../types';
import { MOCK_LEADS } from '../constants';
import { 
  MoreVertical, 
  Plus, 
  Calendar, 
  MessageSquare, 
  Phone, 
  TrendingUp, 
  Flame, 
  Snowflake,
  Search,
  Clock,
  Zap,
  Filter,
  AlertTriangle,
  Edit2,
  X,
  Check,
  Timer
} from 'lucide-react';

import { safeLocalStorage, STORAGE_KEYS } from '../utils/storage';

const Pipeline: React.FC = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>(() => {
    try {
      const saved = safeLocalStorage.getItem(STORAGE_KEYS.LEADS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse leads in Pipeline:', e);
    }
    return MOCK_LEADS;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Define 'now' for SLA calculations in the component scope
  const now = new Date();
  const stages = Object.values(LeadStage);

  const saveLeads = (updatedLeads: Lead[]) => {
    setLeads(updatedLeads);
    safeLocalStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(updatedLeads));
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(l => 
      (l.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (l.phone || '').includes(searchTerm)
    );
  }, [leads, searchTerm]);

  const getLeadsByStage = (stage: LeadStage) => filteredLeads.filter(l => l.stage === stage);

  const openEditModal = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    setEditingLead({ ...lead });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    const updated = leads.map(l => l.id === editingLead.id ? { ...editingLead, updatedAt: new Date().toISOString() } : l);
    saveLeads(updated);
    setIsEditModalOpen(false);
    setEditingLead(null);
  };

  const ScoreBadge = ({ score }: { score: LeadScore }) => {
    if (score === LeadScore.HOT) return <div className="p-2 bg-rose-100 text-rose-600 rounded-xl shadow-sm"><Flame size={14} /></div>;
    if (score === LeadScore.WARM) return <div className="p-2 bg-orange-100 text-orange-600 rounded-xl shadow-sm"><TrendingUp size={14} /></div>;
    return <div className="p-2 bg-blue-100 text-blue-600 rounded-xl shadow-sm"><Snowflake size={14} /></div>;
  };

  // Fixed: Wrapped PipelineCard in React.FC type to handle 'key' prop correctly in map callback
  const PipelineCard: React.FC<{ lead: Lead }> = ({ lead }) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const lastUpdate = lead.updatedAt ? new Date(lead.updatedAt) : new Date(lead.createdAt);
    const hoursInactivity = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60));
    
    // SLA Rule 1: Stage Inactivity
    const isStageOverdue = (lead.stage === LeadStage.NEW && hoursInactivity > 24) || 
                          (lead.stage === LeadStage.PROPOSAL_SENT && hoursInactivity > 48);

    // SLA Rule 2: Overdue Tasks
    const overdueTask = lead.followUps.find(f => f.status === 'Pending' && f.date < todayStr);
    
    const isSLAAlert = isStageOverdue || !!overdueTask;

    return (
      <div 
        onClick={() => navigate(`/leads/${lead.id}`)}
        className={`bg-white p-6 rounded-3xl border group transition-all cursor-pointer relative overflow-hidden ${
          isSLAAlert ? 'border-rose-400 shadow-rose-100 shadow-2xl ring-4 ring-rose-50/50' : 'border-slate-100 hover:border-blue-300 hover:shadow-2xl shadow-sm'
        }`}
      >
        {isSLAAlert && (
           <div className={`absolute top-0 right-0 bg-rose-600 text-white text-[8px] font-black uppercase px-3 py-1.5 rounded-bl-xl tracking-[0.15em] flex items-center gap-1.5 shadow-lg ${isStageOverdue ? 'animate-pulse' : ''}`}>
              {overdueTask ? <Clock size={10} /> : <Timer size={10} />}
              {overdueTask ? 'TASK OVERDUE' : `INACTIVE ${hoursInactivity}H`}
           </div>
        )}
        
        <div className="flex items-start justify-between mb-4">
          <ScoreBadge score={lead.score} />
          <button 
            onClick={(e) => openEditModal(e, lead)}
            className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
          >
            <Edit2 size={14} />
          </button>
        </div>

        <h4 className="font-black text-slate-900 mb-1 text-base tracking-tight leading-tight">{lead.name}</h4>
        
        <div className="flex flex-wrap items-center gap-2 mb-4">
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-full">{lead.interest}</span>
           <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-full">{lead.pax} PAX</span>
        </div>
        
        {overdueTask && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-2xl animate-in fade-in duration-300">
            <p className="text-[9px] font-black text-rose-600 uppercase tracking-wider mb-1 flex items-center gap-1">
              <AlertTriangle size={10} /> Missed Task
            </p>
            <p className="text-[11px] font-bold text-rose-800 line-clamp-1 italic">"{overdueTask.note}"</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-4 text-slate-400 border-t border-slate-50 pt-4">
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className={overdueTask ? 'text-rose-500' : 'text-slate-300'}/> 
            <span className={`text-[9px] font-bold uppercase ${overdueTask ? 'text-rose-600 font-black' : ''}`}>
              {lead.travelMonth}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap size={12} className="text-amber-400"/> 
            <span className="text-[9px] font-bold uppercase">{lead.budgetRange}</span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <img src={`https://picsum.photos/seed/${lead.assignedTo}/32/32`} className="w-7 h-7 rounded-full border-2 border-white shadow-sm" title={lead.assignedTo} alt="Sales" />
              <span className="text-[8px] font-black uppercase text-slate-300 tracking-widest group-hover:text-slate-500 transition-colors">{lead.assignedTo.split(' ')[0]}</span>
           </div>
           <div className="flex gap-1.5">
              <button 
                onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${lead.phone}`; }}
                className="p-2.5 text-slate-300 hover:text-blue-600 bg-slate-50 hover:bg-white rounded-xl transition-all active:scale-90"
              >
                <Phone size={14}/>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); const cleanPhone = lead.phone.replace(/\D/g, ''); window.open(`https://wa.me/${cleanPhone}`, '_blank'); }}
                className="p-2.5 text-slate-300 hover:text-emerald-500 bg-slate-50 hover:bg-white rounded-xl transition-all active:scale-90"
              >
                <MessageSquare size={14}/>
              </button>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col gap-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-96">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
             <input 
               type="text" 
               placeholder="Search pipeline..." 
               className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold outline-none focus:ring-8 focus:ring-blue-50/50 transition-all shadow-sm text-slate-900"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <button className="p-4 bg-white border border-slate-200 rounded-3xl text-slate-400 hover:text-slate-900 transition-all active:scale-95">
             <Filter size={20} />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 rounded-2xl">
            <AlertTriangle size={14} className="text-rose-500 animate-pulse" />
            <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Breached: {leads.filter(l => (l.stage === LeadStage.NEW && Math.floor((now.getTime() - (l.updatedAt ? new Date(l.updatedAt) : new Date(l.createdAt)).getTime()) / 3600000) > 24)).length}</span>
          </div>
          <button 
            onClick={() => navigate('/leads/new')}
            className="bg-blue-600 text-white px-10 py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-[11px] flex items-center gap-3 hover:bg-blue-700 transition-all shadow-2xl shadow-blue-900/30 active:scale-95"
          >
            <Plus size={20} /> New Sales Lead
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-6 -mx-4 px-4">
        <div className="flex gap-8 h-full min-w-max">
          {stages.map(stage => {
            const stageLeads = getLeadsByStage(stage);
            return (
              <div key={stage} className="w-80 flex flex-col gap-6">
                <div className="flex items-center justify-between px-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{stage}</h3>
                    <span className="bg-slate-200 text-slate-600 text-[10px] font-black px-3 py-0.5 rounded-full">
                      {stageLeads.length}
                    </span>
                  </div>
                  <button className="text-slate-300 hover:text-blue-600 transition-colors"><MoreVertical size={16}/></button>
                </div>

                <div className="flex-1 bg-slate-100/40 rounded-[48px] p-5 space-y-6 border-2 border-dashed border-slate-200/50 overflow-y-auto custom-scrollbar">
                  {stageLeads.map(lead => <PipelineCard key={lead.id} lead={lead} />)}
                  {stageLeads.length === 0 && (
                    <div className="h-32 flex flex-col items-center justify-center text-slate-300 gap-3">
                       <Clock size={32} className="opacity-10" />
                       <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-30">No Active Leads</span>
                    </div>
                  )}
                  <button onClick={() => navigate('/leads/new')} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-300 hover:text-blue-400 hover:border-blue-200 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest">
                    <Plus size={14}/> Add to {stage}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Lead Modal */}
      {isEditModalOpen && editingLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[48px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="bg-slate-950 p-8 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                   <div className="bg-blue-600 p-3 rounded-2xl">
                      <Edit2 size={24}/>
                   </div>
                   <div>
                      <h2 className="text-xl font-black tracking-tight">Edit Lead: {editingLead.name}</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pipeline Data Update</p>
                   </div>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24}/></button>
             </div>

             <form onSubmit={handleEditSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Name</label>
                      <input required type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-slate-900" value={editingLead.name || ''} onChange={e => setEditingLead({...editingLead, name: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Phone</label>
                      <input required type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-slate-900" value={editingLead.phone || ''} onChange={e => setEditingLead({...editingLead, phone: e.target.value})} />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email</label>
                      <input type="email" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-slate-900" value={editingLead.email || ''} onChange={e => setEditingLead({...editingLead, email: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Priority Score</label>
                      <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-slate-900" value={editingLead.score} onChange={e => setEditingLead({...editingLead, score: e.target.value as LeadScore})}>
                         {Object.values(LeadScore).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Travel Month</label>
                      <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-slate-900" value={editingLead.travelMonth || ''} onChange={e => setEditingLead({...editingLead, travelMonth: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Budget</label>
                      <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-slate-900" value={editingLead.budgetRange || ''} onChange={e => setEditingLead({...editingLead, budgetRange: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Pax</label>
                      <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-slate-900" value={editingLead.pax || 0} onChange={e => setEditingLead({...editingLead, pax: parseInt(e.target.value)})} />
                   </div>
                </div>

                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Sales Notes</label>
                   <textarea rows={4} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium outline-none text-slate-900" value={editingLead.notes || ''} onChange={e => setEditingLead({...editingLead, notes: e.target.value})} />
                </div>

                <div className="pt-4 flex gap-4">
                   <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 rounded-2xl transition-all">Discard</button>
                   <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                      <Check size={18}/> Update Lead
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pipeline;
