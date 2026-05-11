
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Plus, 
  ChevronRight, 
  MessageSquare, 
  Phone, 
  Mail, 
  MoreVertical,
  Flame,
  TrendingUp,
  Snowflake,
  Clock,
  Calendar,
  Zap,
  CheckCircle2,
  X,
  Trash2,
  UserPlus,
  ArrowRightLeft,
  Check,
  Edit2,
  Sparkles,
  Loader2,
  Globe,
  User,
  Activity as ActivityIcon,
  Smartphone,
  Send,
  ShieldCheck
} from 'lucide-react';
import { Lead, LeadStage, LeadScore, TripType, FollowUp, LeadActivity, TeamMember } from '../types';
import { MOCK_LEADS, DEFAULT_PERSONAS } from '../constants';
import { suggestFollowUp } from '../services/geminiService';
import { DEFAULT_TEMPLATES, sendSimulatedMessage, saveMessageLog } from '../services/messagingService';

import { safeLocalStorage, STORAGE_KEYS } from '../utils/storage';

const LeadList: React.FC = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>(() => {
    try {
      const savedLeads = safeLocalStorage.getItem(STORAGE_KEYS.LEADS);
      if (savedLeads) {
        const parsed = JSON.parse(savedLeads);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse leads in LeadList:', e);
    }
    return MOCK_LEADS;
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    try {
      const savedMembers = safeLocalStorage.getItem(STORAGE_KEYS.TEAM_MEMBERS);
      if (savedMembers) {
        const parsed = JSON.parse(savedMembers);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse team members in LeadList:', e);
    }
    return DEFAULT_PERSONAS;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [scoreFilter, setScoreFilter] = useState('All');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  
  // Edit State
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // AI Suggestion State
  const [suggestingForId, setSuggestingForId] = useState<string | null>(null);
  const [currentSuggestion, setCurrentSuggestion] = useState<{ task: string, daysFromNow: number } | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

  // Bulk Messaging State
  const [isBulkMessageModalOpen, setIsBulkMessageModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(DEFAULT_TEMPLATES[0].id);
  const [isBulkSending, setIsBulkSending] = useState(false);

  useEffect(() => {
    // Already initialized via useState initializer
  }, []);

  const saveLeads = (updatedLeads: Lead[]) => {
    setLeads(updatedLeads);
    safeLocalStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(updatedLeads));
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchesSearch = (l.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (l.phone || '').includes(searchTerm) ||
                           (l.email || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStage = stageFilter === 'All' || l.stage === stageFilter;
      const matchesScore = scoreFilter === 'All' || l.score === scoreFilter;
      return matchesSearch && matchesStage && matchesScore;
    });
  }, [leads, searchTerm, stageFilter, scoreFilter]);

  const toggleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id));
    }
  };

  const toggleSelectLead = (id: string) => {
    setSelectedLeads(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const updateLeadField = (id: string, field: keyof Lead, value: any) => {
    const updated = leads.map(l => l.id === id ? { ...l, [field]: value, updatedAt: new Date().toISOString() } : l);
    saveLeads(updated);
  };

  const handleBulkStatusUpdate = (newStage: LeadStage) => {
    const updated = leads.map(l => selectedLeads.includes(l.id) ? { ...l, stage: newStage, updatedAt: new Date().toISOString() } : l);
    saveLeads(updated);
    setSelectedLeads([]);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedLeads.length} leads?`)) {
      const updated = leads.filter(l => !selectedLeads.includes(l.id));
      saveLeads(updated);
      setSelectedLeads([]);
    }
  };

  const handleBulkWhatsAppSend = async () => {
    setIsBulkSending(true);
    const template = DEFAULT_TEMPLATES.find(t => t.id === selectedTemplateId);
    if (!template) return;

    const selectedLeadsData = leads.filter(l => selectedLeads.includes(l.id));
    
    // Process messages in parallel (simulated)
    const promises = selectedLeadsData.map(async (lead) => {
      if (!lead.whatsappOptIn && template.type === 'WhatsApp') return null;
      const log = await sendSimulatedMessage(lead, template);
      saveMessageLog(log);
      
      // Update individual lead activities
      const activity: LeadActivity = {
        id: `act-${Date.now()}-${lead.id}`,
        leadId: lead.id,
        type: 'MessageSent',
        timestamp: new Date().toISOString(),
        description: `Bulk ${template.type} sent: ${template.name}`
      };
      
      return { leadId: lead.id, activity };
    });

    const results = await Promise.all(promises);
    
    // Update master leads state with new activities
    const updatedLeads = leads.map(l => {
      const result = results.find(r => r?.leadId === l.id);
      if (result) {
        return {
          ...l,
          activities: [result.activity, ...(l.activities || [])],
          updatedAt: new Date().toISOString()
        };
      }
      return l;
    });

    saveLeads(updatedLeads);
    setIsBulkSending(false);
    setIsBulkMessageModalOpen(false);
    setSelectedLeads([]);
    alert(`Bulk transmission complete for ${selectedLeads.length} leads.`);
  };

  // Edit Logic
  const openEditModal = (lead: Lead) => {
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

  // AI Suggestion Logic
  const handleGetSuggestion = async (lead: Lead) => {
    if (isSuggesting) return;
    setSuggestingForId(lead.id);
    setIsSuggesting(true);
    setCurrentSuggestion(null);

    try {
      const suggestion = await suggestFollowUp(lead.name, lead.stage, lead.notes, lead.interest);
      setCurrentSuggestion(suggestion);
    } catch (error) {
      console.error("AI Error:", error);
      alert("AI failed to provide a suggestion. Please try again.");
      setSuggestingForId(null);
    } finally {
      setIsSuggesting(false);
    }
  };

  const acceptSuggestion = () => {
    if (!suggestingForId || !currentSuggestion) return;
    
    const lead = leads.find(l => l.id === suggestingForId);
    if (!lead) return;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + currentSuggestion.daysFromNow);
    
    const newFollowUp: FollowUp = {
      id: `f-${Date.now()}`,
      date: futureDate.toISOString().split('T')[0],
      status: 'Pending',
      note: currentSuggestion.task
    };

    const activity: LeadActivity = {
      id: `act-${Date.now()}`,
      leadId: lead.id,
      type: 'FollowUpCreated',
      timestamp: new Date().toISOString(),
      description: `AI Suggested Task: ${currentSuggestion.task} for ${newFollowUp.date}`
    };

    const updatedLead = {
      ...lead,
      followUps: [...lead.followUps, newFollowUp],
      activities: [activity, ...(lead.activities || [])],
      updatedAt: new Date().toISOString()
    };

    const updatedLeads = leads.map(l => l.id === lead.id ? updatedLead : l);
    saveLeads(updatedLeads);
    setSuggestingForId(null);
    setCurrentSuggestion(null);
  };

  const ScoreBadge = ({ score }: { score: LeadScore }) => {
    switch (score) {
      case LeadScore.HOT:
        return <span className="flex items-center gap-1 text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100"><Flame size={12}/> Hot</span>;
      case LeadScore.WARM:
        return <span className="flex items-center gap-1 text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100"><TrendingUp size={12}/> Warm</span>;
      case LeadScore.COLD:
        return <span className="flex items-center gap-1 text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100"><Snowflake size={12}/> Cold</span>;
    }
  };

  return (
    <div className="space-y-8 pb-20 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lead Manager</h1>
          <p className="text-slate-500 text-sm">Manage client acquisitions and team assignments.</p>
        </div>
        <button 
          onClick={() => navigate('/leads/new')}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95"
        >
          <Plus size={18} /> New Capture
        </button>
      </div>

      <div className="bg-white p-5 rounded-[32px] border border-slate-200 shadow-sm flex flex-wrap items-center gap-6">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search leads by name, phone, or email..." 
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50/50 transition-all text-slate-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl">
            <Clock size={16} className="text-slate-400" />
            <select 
              className="bg-transparent text-[10px] font-black uppercase text-slate-700 outline-none cursor-pointer"
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
            >
              <option value="All">All Stages</option>
              {Object.values(LeadStage).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl">
            <Zap size={16} className="text-slate-400" />
            <select 
              className="bg-transparent text-[10px] font-black uppercase text-slate-700 outline-none cursor-pointer"
              value={scoreFilter}
              onChange={(e) => setScoreFilter(e.target.value)}
            >
              <option value="All">All Priority</option>
              {Object.values(LeadScore).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {(searchTerm || stageFilter !== 'All' || scoreFilter !== 'All') && (
            <button 
              onClick={() => { setSearchTerm(''); setStageFilter('All'); setScoreFilter('All'); }}
              className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedLeads.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl z-[100] flex items-center gap-8 animate-in slide-in-from-bottom-4 duration-300 border border-slate-800">
          <div className="flex items-center gap-3 pr-8 border-r border-slate-800">
             <span className="bg-blue-600 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">{selectedLeads.length} Selected</span>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsBulkMessageModalOpen(true)}
              className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <MessageSquare size={16} /> Send WhatsApp
            </button>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Update Stage</span>
              <select 
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-[10px] font-bold outline-none cursor-pointer text-white"
                onChange={(e) => handleBulkStatusUpdate(e.target.value as LeadStage)}
                value=""
              >
                <option value="" disabled>Move to...</option>
                {Object.values(LeadStage).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button 
              onClick={handleBulkDelete}
              className="flex items-center gap-2 text-[10px] font-black uppercase text-rose-400 hover:text-rose-300 transition-colors"
            >
              <Trash2 size={16} /> Delete
            </button>
            <button onClick={() => setSelectedLeads([])} className="p-1 hover:bg-slate-800 rounded-lg text-slate-500">
              <X size={20}/>
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100">
              <th className="px-8 py-5 w-10">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-8 py-5">Lead Profile</th>
              <th className="px-8 py-5">Pipeline Progress</th>
              <th className="px-8 py-5">Trip Context</th>
              <th className="px-8 py-5">Assigned Agent</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredLeads.map(lead => (
              <tr key={lead.id} className={`group hover:bg-slate-50/50 transition-colors ${selectedLeads.includes(lead.id) ? 'bg-blue-50/30' : ''}`}>
                <td className="px-8 py-6">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={selectedLeads.includes(lead.id)}
                    onChange={() => toggleSelectLead(lead.id)}
                  />
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div 
                      onClick={() => navigate(`/leads/${lead.id}`)}
                      className="w-12 h-12 rounded-2xl bg-blue-50 border-2 border-white shadow-sm flex items-center justify-center font-black text-blue-600 cursor-pointer hover:bg-blue-600 hover:text-white transition-all"
                    >
                      {lead.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p onClick={() => navigate(`/leads/${lead.id}`)} className="font-black text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer">{lead.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lead.source}</span>
                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span className="text-[10px] font-bold text-slate-300">{new Date(lead.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2 items-center">
                      <select 
                        className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border shadow-sm outline-none cursor-pointer appearance-none transition-all
                          ${lead.stage === LeadStage.BOOKED ? 'bg-blue-600 text-white border-blue-700' : 
                            lead.stage === LeadStage.PROPOSAL_SENT ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}
                        `}
                        value={lead.stage}
                        onChange={(e) => updateLeadField(lead.id, 'stage', e.target.value)}
                      >
                        {Object.values(LeadStage).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ScoreBadge score={lead.score} />
                    </div>
                    <div className="flex items-center gap-3 text-slate-400">
                      <button onClick={() => handleCall(lead.phone)} className="flex items-center gap-1 text-[10px] font-bold uppercase hover:text-blue-600 transition-colors">
                        <Phone size={10}/> {lead.phone}
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{lead.interest} Trip</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Calendar size={10}/> {lead.travelMonth}</span>
                      <span className="w-1 h-1 bg-slate-200 rounded-full" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Zap size={10}/> ₹{lead.budgetRange}</span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <img src={teamMembers.find(m => m.name === lead.assignedTo)?.avatar || `https://picsum.photos/seed/${lead.assignedTo}/32/32`} className="w-8 h-8 rounded-full border-2 border-white shadow-sm" alt="Staff" />
                    <select 
                      className="bg-transparent text-[11px] font-black text-slate-700 uppercase tracking-widest outline-none cursor-pointer hover:bg-slate-100 px-2 py-1 rounded-lg transition-all"
                      value={lead.assignedTo}
                      onChange={(e) => updateLeadField(lead.id, 'assignedTo', e.target.value)}
                    >
                      <option value="" disabled>Select Agent</option>
                      {teamMembers.map(member => <option key={member.id} value={member.name}>{member.name}</option>)}
                    </select>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => handleGetSuggestion(lead)}
                      disabled={suggestingForId === lead.id && isSuggesting}
                      className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-xl shadow-sm transition-all active:scale-90" 
                      title="AI Suggest Next Action"
                    >
                      {suggestingForId === lead.id && isSuggesting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    </button>
                    <button 
                      onClick={() => openEditModal(lead)}
                      className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-blue-500 rounded-xl shadow-sm transition-all active:scale-90" 
                      title="Edit Lead"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleWhatsApp(lead.phone)}
                      className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-emerald-500 rounded-xl shadow-sm transition-all active:scale-90" 
                      title="WhatsApp Client"
                    >
                      <MessageSquare size={16} />
                    </button>
                    <button 
                      onClick={() => updateLeadField(lead.id, 'stage', LeadStage.LOST)}
                      className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-500 rounded-xl shadow-sm transition-all active:scale-90" 
                      title="Mark as Lost"
                    >
                      <Trash2 size={16} />
                    </button>
                    <Link to={`/leads/${lead.id}`} className="p-2.5 bg-slate-900 text-white rounded-xl shadow-xl shadow-slate-900/10 hover:bg-blue-600 transition-all active:scale-90">
                      <ChevronRight size={18} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredLeads.length === 0 && (
          <div className="py-32 text-center flex flex-col items-center gap-4 opacity-30">
            <Search size={64} />
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-slate-900">No matching leads found</p>
              <p className="text-xs font-bold mt-1">Try adjusting your filters or search terms.</p>
            </div>
          </div>
        )}
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
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update Client Portfolio</p>
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
                      <Check size={18}/> Update Portfolio
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* AI Suggestion Display Modal */}
      {currentSuggestion && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
           <div className="bg-white rounded-[48px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-blue-600 p-8 text-white text-center space-y-2">
                 <div className="w-16 h-16 bg-white/20 rounded-3xl mx-auto flex items-center justify-center mb-2">
                    <Sparkles size={32} />
                 </div>
                 <h3 className="text-xl font-black tracking-tight uppercase">AI Sales Suggestion</h3>
                 <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest">Optimized Conversion Path</p>
              </div>

              <div className="p-10 space-y-8">
                 <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4 shadow-inner text-center">
                    <p className="text-slate-900 font-bold text-lg leading-snug">"{currentSuggestion.task}"</p>
                    <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase text-blue-600 tracking-widest">
                       <Clock size={14}/> Schedule for {currentSuggestion.daysFromNow} days from now
                    </div>
                 </div>

                 <div className="flex flex-col gap-3">
                    <button 
                      onClick={acceptSuggestion}
                      className="w-full py-4 bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-xl hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                       <CheckCircle2 size={18}/> Accept & Schedule
                    </button>
                    <button 
                      onClick={() => setCurrentSuggestion(null)}
                      className="w-full py-4 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-rose-500 transition-colors"
                    >
                       Ignore
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Bulk Message Modal */}
      {isBulkMessageModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
           <div className="bg-white rounded-[48px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-emerald-600 p-8 text-white flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-2xl">
                       <Smartphone size={24}/>
                    </div>
                    <div>
                       <h2 className="text-xl font-black tracking-tight uppercase">Bulk Transmission</h2>
                       <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest">{selectedLeads.length} Recipients Selected</p>
                    </div>
                 </div>
                 <button onClick={() => setIsBulkMessageModalOpen(false)} className="text-emerald-200 hover:text-white transition-colors"><X size={24}/></button>
              </div>

              <div className="p-10 space-y-8">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Select Message Template</label>
                    <div className="space-y-3">
                       {DEFAULT_TEMPLATES.map(tmp => (
                          <button 
                            key={tmp.id}
                            onClick={() => setSelectedTemplateId(tmp.id)}
                            className={`w-full p-5 rounded-[32px] text-left transition-all border flex items-center gap-4 ${
                              selectedTemplateId === tmp.id 
                              ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
                              : 'bg-white border-slate-100 hover:bg-slate-50'
                            }`}
                          >
                             <div className={`p-2.5 rounded-xl ${tmp.type === 'WhatsApp' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                {tmp.type === 'WhatsApp' ? <Smartphone size={18}/> : <Mail size={18}/>}
                             </div>
                             <div className="flex-1">
                                <p className="font-black text-slate-900 text-sm">{tmp.name}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{tmp.type} Channel</p>
                             </div>
                             {selectedTemplateId === tmp.id && <CheckCircle2 size={20} className="text-emerald-600" />}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="p-6 bg-slate-900 rounded-[32px] text-slate-400 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                       <ShieldCheck size={14} className="text-emerald-500" /> Compliance Check
                    </p>
                    <p className="text-xs leading-relaxed">
                       Messages will be personalized using AI-injected variables. Only leads with verified WhatsApp opt-in status will receive the transmission.
                    </p>
                 </div>

                 <div className="flex flex-col gap-3 pt-4">
                    <button 
                      onClick={handleBulkWhatsAppSend}
                      disabled={isBulkSending}
                      className="w-full py-5 bg-emerald-600 text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-3xl shadow-xl shadow-emerald-900/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                       {isBulkSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18}/>}
                       {isBulkSending ? 'Transmitting Data...' : `Dispatch to ${selectedLeads.length} Leads`}
                    </button>
                    <button 
                      onClick={() => setIsBulkMessageModalOpen(false)}
                      className="w-full py-4 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-slate-900 transition-colors"
                    >
                       Cancel Batch
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default LeadList;
