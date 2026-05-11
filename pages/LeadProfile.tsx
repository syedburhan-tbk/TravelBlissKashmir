
import React, { useState, useEffect, useMemo } from 'react';
import { useStorageSync } from '../hooks/useStorageSync';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MessageSquare, 
  Calendar, 
  Plus, 
  Clock, 
  User, 
  TrendingUp, 
  Target,
  FileText,
  Map,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Zap,
  Tag,
  Sparkles,
  Loader2,
  X,
  Send,
  History,
  Activity as ActivityIcon,
  ShieldCheck,
  Smartphone,
  Eye,
  RefreshCcw,
  Check,
  ListTodo,
  Bell,
  Edit3,
  Layers
} from 'lucide-react';
import { Lead, LeadStage, LeadScore, CommunicationLog, FollowUp, Trip, LeadActivity, MessageLog } from '../types';
import { MOCK_LEADS, MOCK_TRIPS } from '../constants';
import { suggestFollowUp, draftWhatsAppMessage } from '../services/geminiService';
import { sendSimulatedMessage, DEFAULT_TEMPLATES, saveMessageLog, getMessageLogsForLead } from '../services/messagingService';

import { safeLocalStorage, STORAGE_KEYS } from '../utils/storage';

const generateActId = () => `act-${Date.now()}`;
const generateCommId = () => `c-${Date.now()}`;
const generateFUId = () => `f-${Date.now()}`;

const recordActivity = (updatedLead: Lead, type: LeadActivity['type'], description: string, meta?: any) => {
  const activity: LeadActivity = {
    id: generateActId(),
    leadId: updatedLead.id,
    type,
    timestamp: new Date().toISOString(),
    description,
    meta
  };
  updatedLead.activities = [activity, ...(updatedLead.activities || [])];
  updatedLead.updatedAt = new Date().toISOString();
  return updatedLead;
};

const LeadProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [lead, setLead] = useState<Lead | null>(() => {
    try {
      const savedLeads = safeLocalStorage.getItem(STORAGE_KEYS.LEADS);
      let allLeads: Lead[] = MOCK_LEADS;
      if (savedLeads) {
        const parsed = JSON.parse(savedLeads);
        if (Array.isArray(parsed)) allLeads = parsed;
      }
      
      const found = allLeads.find((l: Lead) => l.id === id);
      if (found) {
        if (!found.activities) found.activities = [];
        if (found.whatsappOptIn === undefined) found.whatsappOptIn = true;
        return found;
      }
    } catch (e) {
      console.error('Failed to initialize lead:', e);
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'trips' | 'timeline' | 'messaging' | 'followups'>('overview');
  const [newLog, setNewLog] = useState('');
  
  // Lead Editing State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Follow-up States
  const [isAiScheduling, setIsAiScheduling] = useState(false);
  const [isFUModalOpen, setIsFUModalOpen] = useState(false);
  const [fuFormData, setFuFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Call' as 'Call' | 'WhatsApp' | 'Email',
    note: ''
  });

  // Messaging States
  const [isSending, setIsSending] = useState(false);
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>(() => {
    return id ? getMessageLogsForLead(id) : [];
  });

  useEffect(() => {
    // If id changes, we need to re-sync. To avoid "synchronous setState" warning,
    // we use a microtask or just an async check.
    const syncLead = async () => {
      try {
        const savedLeads = safeLocalStorage.getItem(STORAGE_KEYS.LEADS);
        let allLeads: Lead[] = MOCK_LEADS;
        if (savedLeads) {
          const parsed = JSON.parse(savedLeads);
          if (Array.isArray(parsed)) allLeads = parsed;
        }
        
        const found = allLeads.find((l: Lead) => l.id === id);
        if (found && found.id !== lead?.id) {
          if (!found.activities) found.activities = [];
          if (found.whatsappOptIn === undefined) found.whatsappOptIn = true;
          setLead(found);
          setMessageLogs(getMessageLogsForLead(found.id));
        }
      } catch (e) {
        console.error('Failed to sync lead:', e);
      }
    };
    
    syncLead();
  }, [id, lead?.id]);

  const updateLeadInStorage = (updatedLead: Lead) => {
    setLead(updatedLead);
    try {
      const savedLeads = safeLocalStorage.getItem(STORAGE_KEYS.LEADS);
      let allLeads: Lead[] = [...MOCK_LEADS];
      if (savedLeads) {
        const parsed = JSON.parse(savedLeads);
        if (Array.isArray(parsed)) allLeads = parsed;
      }
      
      const index = allLeads.findIndex((l: Lead) => l.id === updatedLead.id);
      if (index > -1) {
        allLeads[index] = updatedLead;
      } else {
        allLeads.push(updatedLead);
      }
      safeLocalStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(allLeads));
    } catch (e) {
      console.error('Failed to update leads in storage:', e);
    }
  };

  const handleManualMessage = async (templateId: string) => {
    if (!lead || isSending) return;
    const template = DEFAULT_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    setIsSending(true);
    try {
      const log = await sendSimulatedMessage(lead, template);
      saveMessageLog(log);
      setMessageLogs(prev => [log, ...prev]);
      
      // Fix: Explicitly type updatedLead as Lead to prevent inference errors when reassigning from recordActivity
      let updatedLead: Lead = { ...lead };
      updatedLead = recordActivity(updatedLead, 'MessageSent', `Manual ${template.type} sent: ${template.name}`, { msgId: log.id });
      updateLeadInStorage(updatedLead);
    } finally {
      setIsSending(false);
    }
  };

  const handleStageChange = (newStage: LeadStage) => {
    if (!lead) return;
    // Fix: Explicitly type updatedLead as Lead to prevent inference errors when reassigning from recordActivity
    let updatedLead: Lead = { ...lead, stage: newStage };
    updatedLead = recordActivity(updatedLead, 'StatusChange', `Stage changed from ${lead.stage} to ${newStage}`);
    updateLeadInStorage(updatedLead);
  };

  const addCommunicationLog = (type: CommunicationLog['type'] = 'Note', content: string = newLog) => {
    if (!lead || !content.trim()) return;
    const log: CommunicationLog = {
      id: generateCommId(),
      type,
      timestamp: new Date().toISOString(),
      content,
      author: 'Adil Bakshi'
    };
    // Fix: Explicitly type updatedLead as Lead to prevent inference errors when reassigning from recordActivity
    let updatedLead: Lead = { ...lead, communicationLogs: [log, ...lead.communicationLogs] };
    updatedLead = recordActivity(updatedLead, 'NoteAdded', `Communication logged: ${type}`, { logId: log.id });
    updateLeadInStorage(updatedLead);
    if (type === 'Note') setNewLog('');
  };

  const handleAiSuggestTask = async () => {
    if (!lead || isAiScheduling) return;
    setIsAiScheduling(true);
    try {
      const suggestion = await suggestFollowUp(lead.name, lead.stage, lead.notes, lead.interest);
      setFuFormData(prev => ({
        ...prev,
        note: suggestion.task,
        date: new Date(Date.now() + suggestion.daysFromNow * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));
    } catch (error) {
      console.error("AI Suggestion failed:", error);
    } finally {
      setIsAiScheduling(false);
    }
  };

  const handleCustomFollowUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !fuFormData.note.trim()) return;

    const newFollowUp: FollowUp = {
      id: generateFUId(),
      date: fuFormData.date,
      status: 'Pending',
      type: fuFormData.type,
      note: fuFormData.note
    };

    // Fix: Explicitly type updatedLead as Lead to prevent inference errors when reassigning from recordActivity
    let updatedLead: Lead = {
      ...lead,
      followUps: [...lead.followUps, newFollowUp]
    };
    updatedLead = recordActivity(updatedLead, 'FollowUpCreated', `Scheduled ${fuFormData.type}: ${fuFormData.note} for ${fuFormData.date}`);
    updateLeadInStorage(updatedLead);
    
    setIsFUModalOpen(false);
    setFuFormData({
      date: new Date().toISOString().split('T')[0],
      type: 'Call',
      note: ''
    });
  };

  const completeFollowUp = (fuId: string) => {
    if (!lead) return;
    const completedTask = lead.followUps.find(f => f.id === fuId)?.note;
    const updatedFollowUps = lead.followUps.map(fu => 
      fu.id === fuId ? { ...fu, status: 'Completed' as const } : fu
    );
    // Fix: Explicitly type updatedLead as Lead to prevent inference errors when reassigning from recordActivity
    let updatedLead: Lead = { ...lead, followUps: updatedFollowUps };
    updatedLead = recordActivity(updatedLead, 'FollowUpCompleted', `Task completed: ${completedTask}`);
    updateLeadInStorage(updatedLead);
  };

  const openEditModal = () => {
    if (!lead) return;
    setEditingLead({ ...lead });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    // Fix: Explicitly type updatedLead as Lead to prevent inference errors when reassigning from recordActivity, especially when overriding optional properties like updatedAt
    let updatedLead: Lead = { ...editingLead, updatedAt: new Date().toISOString() };
    updatedLead = recordActivity(updatedLead, 'NoteAdded', 'Client profile updated');
    updateLeadInStorage(updatedLead);
    setIsEditModalOpen(false);
    setEditingLead(null);
  };

  const [allTrips, setAllTrips] = useState<Trip[]>(() => {
    try {
      const savedTrips = safeLocalStorage.getItem(STORAGE_KEYS.TRIPS);
      return savedTrips ? JSON.parse(savedTrips) : MOCK_TRIPS;
    } catch (e) {
      console.error('LeadProfile: Failed to load trips:', e);
      return MOCK_TRIPS;
    }
  });

  // Sync trips across tabs
  useStorageSync(STORAGE_KEYS.TRIPS, allTrips, setAllTrips, MOCK_TRIPS);

  const leadTrips = useMemo(() => {
    return allTrips.filter(t => t.leadId === lead?.id);
  }, [allTrips, lead?.id]);

  if (!lead) return <div className="p-20 text-center font-black text-slate-300 uppercase tracking-widest flex flex-col items-center gap-4">
    <Loader2 className="animate-spin" size={48} />
    LOADING LEAD...
  </div>;

  const pendingFollowUps = lead.followUps.filter(f => f.status === 'Pending');

  return (
    <div className="space-y-8 pb-20">
      {/* Header Profile Info */}
      <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-10">
         <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-5">
                  <button onClick={() => navigate('/leads')} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all active:scale-95"><ArrowLeft size={20}/></button>
                  <div>
                     <h1 className="text-4xl font-black text-slate-900 tracking-tighter">{lead.name}</h1>
                     <div className="flex items-center gap-4 mt-1">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${lead.score === LeadScore.HOT ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                           {lead.score} Priority
                        </span>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full">
                           <Smartphone size={10} className="text-emerald-600" />
                           <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">WhatsApp {lead.whatsappOptIn ? 'Opted-In' : 'Opted-Out'}</span>
                        </div>
                     </div>
                  </div>
               </div>
               <button 
                 onClick={openEditModal}
                 className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center gap-2 group"
               >
                 <Edit3 size={18} />
                 <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover:block animate-in slide-in-from-right-2">Edit Profile</span>
               </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
               <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Phone</p>
                  <p className="font-bold text-slate-900 flex items-center gap-2 transition-all hover:text-blue-600 cursor-pointer"><Phone size={14} className="text-blue-500"/> {lead.phone}</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Email</p>
                  <p className="font-bold text-slate-900 flex items-center gap-2 truncate"><Mail size={14} className="text-blue-500"/> {lead.email}</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Travel Month</p>
                  <p className="font-bold text-slate-900 flex items-center gap-2"><Calendar size={14} className="text-amber-500"/> {lead.travelMonth}</p>
               </div>
               <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Budget</p>
                  <p className="font-bold text-slate-900 flex items-center gap-2">₹ {lead.budgetRange}</p>
               </div>
            </div>
         </div>

         <div className="w-full md:w-80 bg-slate-950 p-8 rounded-[40px] text-white space-y-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pipeline Stage</p>
            <div className="flex flex-col gap-4">
               <select 
                 value={lead.stage}
                 onChange={(e) => handleStageChange(e.target.value as LeadStage)}
                 className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl font-black text-xs uppercase tracking-widest outline-none"
               >
                  {Object.values(LeadStage).map(s => <option key={s} value={s}>{s}</option>)}
               </select>
               <button 
                onClick={() => { setActiveTab('followups'); setIsFUModalOpen(true); }}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-900/40 hover:bg-blue-700 transition-all active:scale-95"
               >
                  Quick Log Follow-up
               </button>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
         <div className="col-span-12 lg:col-span-8 space-y-8">
            <div className="flex gap-4 p-1.5 bg-white border border-slate-100 rounded-3xl w-fit">
               {['overview', 'trips', 'timeline', 'messaging', 'followups'].map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                      activeTab === tab ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {tab}
                  </button>
               ))}
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                 <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                       <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Add Communication Log</h3>
                    </div>
                    <div className="relative">
                       <textarea 
                         rows={4}
                         placeholder="Add a call summary, WhatsApp update, or internal note..."
                         className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[32px] outline-none font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all shadow-inner resize-none"
                         value={newLog}
                         onChange={(e) => setNewLog(e.target.value)}
                       />
                       <button 
                         onClick={() => addCommunicationLog('Note')}
                         className="absolute bottom-4 right-4 bg-slate-900 text-white p-4 rounded-2xl shadow-xl hover:bg-blue-600 transition-all active:scale-90"
                       >
                          <Plus size={20}/>
                       </button>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-4">Recent Interactions</h3>
                    {lead.communicationLogs.map((log) => (
                       <div key={log.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex gap-6 group relative animate-in fade-in slide-in-from-left-2 transition-all">
                          <div className={`p-4 rounded-2xl shrink-0 h-fit ${
                            log.type === 'WhatsApp' ? 'bg-emerald-50 text-emerald-600' : 
                            log.type === 'Call' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'
                          }`}>
                             {log.type === 'WhatsApp' ? <MessageSquare size={20}/> : log.type === 'Call' ? <Phone size={20}/> : <Clock size={20}/>}
                          </div>
                          <div className="flex-1 space-y-2">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                   <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Logged by {log.author}</span>
                                   <span className="px-2 py-0.5 bg-slate-100 rounded-full text-[8px] font-black uppercase text-slate-400 tracking-tighter">{log.type}</span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-300">{new Date(log.timestamp).toLocaleDateString()}</span>
                             </div>
                             <p className="text-slate-800 font-bold leading-relaxed">{log.content}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
            )}

            {activeTab === 'messaging' && (
               <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
                     <div className="flex items-center justify-between">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                           <MessageSquare size={16} className="text-blue-600" /> Messaging Action Center
                        </h3>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {DEFAULT_TEMPLATES.map(tmp => (
                           <button 
                             key={tmp.id}
                             onClick={() => handleManualMessage(tmp.id)}
                             disabled={isSending}
                             className="p-6 border border-slate-100 rounded-[32px] text-left hover:bg-slate-50 hover:border-blue-200 transition-all group flex flex-col gap-3"
                           >
                              <div className={`p-3 rounded-2xl w-fit ${tmp.type === 'WhatsApp' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                 {tmp.type === 'WhatsApp' ? <Smartphone size={18}/> : <Mail size={18}/>}
                              </div>
                              <div>
                                 <p className="font-black text-slate-900 text-sm">{tmp.name}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Template: {tmp.id}</p>
                              </div>
                              <div className="mt-4 flex items-center justify-between">
                                 <span className="text-[10px] font-black text-blue-600 group-hover:underline">Trigger Now</span>
                                 <ChevronRight size={14} className="text-slate-200 group-hover:text-blue-600" />
                              </div>
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-6">
                     <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-4">Communication Delivery Log</h3>
                     {messageLogs.map(log => (
                        <div key={log.id} className="bg-white p-6 rounded-[32px] border border-slate-50 shadow-sm flex items-center gap-6">
                           <div className={`p-4 rounded-2xl ${log.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                              {log.status === 'Delivered' ? <Check size={20}/> : <AlertCircle size={20}/>}
                           </div>
                           <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${log.type === 'WhatsApp' ? 'text-emerald-600' : 'text-blue-600'}`}>{log.type} Delivery</span>
                                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                    <span className="text-[10px] font-bold text-slate-300">{new Date(log.timestamp).toLocaleString()}</span>
                                 </div>
                                 <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${log.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{log.status}</span>
                              </div>
                              <p className="text-sm text-slate-600 font-medium italic line-clamp-2">"{log.content}"</p>
                              {log.errorMessage && <p className="text-[10px] font-black text-rose-500 uppercase tracking-tighter">Error: {log.errorMessage}</p>}
                           </div>
                           <button className="p-3 text-slate-300 hover:text-slate-900 transition-colors"><Eye size={18}/></button>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {activeTab === 'trips' && (
               <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                     <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Linked Proposal & Trips</h3>
                     <button onClick={() => navigate(`/trips/new?leadId=${lead.id}`)} className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-all flex items-center gap-2 group">
                        <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Build New Proposal
                     </button>
                  </div>
                  {leadTrips.map(trip => (
                     <div key={trip.id} onClick={() => navigate(`/trips/${trip.id}`)} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all cursor-pointer relative overflow-hidden">
                        <div className="flex items-center gap-6">
                           <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                              <Map size={24}/>
                           </div>
                           <div>
                              <h4 className="text-lg font-black text-slate-900">{trip.tripName}</h4>
                              <div className="flex items-center gap-3 mt-1">
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{trip.tripType} • {trip.startDate} Start</p>
                                 {(trip.versions || []).length > 0 && (
                                    <span className="flex items-center gap-1 text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                       <Layers size={10} /> {(trip.versions || []).length} Versions
                                    </span>
                                 )}
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-8">
                           <div className="text-right">
                              <p className="text-[9px] font-black uppercase text-slate-300">Status</p>
                              <p className="text-[10px] font-black uppercase text-emerald-600">{trip.status}</p>
                           </div>
                           <div className="flex items-center gap-2">
                             <button 
                               onClick={async (e) => {
                                 e.stopPropagation();
                                 if (window.confirm("Permanently delete this trip from your records? This action cannot be undone.")) {
                                   await tripService.deleteTrip(trip.id);
                                   const updatedTrips = allTrips.filter(t => t.id !== trip.id);
                                   safeLocalStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(updatedTrips));
                                   setAllTrips(updatedTrips);
                                 }
                               }}
                               className="p-3 bg-slate-50 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-all border border-slate-100 hover:border-rose-200"
                               title="Delete Trip"
                             >
                                <Trash2 size={20} />
                             </button>
                             <ChevronRight size={20} className="text-slate-200 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            )}

            {activeTab === 'timeline' && (
              <div className="space-y-12 py-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="relative border-l-2 border-slate-100 ml-10 space-y-10 pb-10">
                  {(lead.activities || []).map((act, i) => (
                    <div key={act.id} className="relative pl-12 group">
                      <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full border-4 border-white shadow-sm transition-all group-hover:scale-125 ${
                        act.type === 'StatusChange' ? 'bg-blue-600' :
                        act.type === 'BookingConfirmed' ? 'bg-emerald-600' :
                        act.type === 'ProposalSent' ? 'bg-indigo-600' :
                        'bg-slate-300'
                      }`} />
                      <div className="bg-white p-6 rounded-[32px] border border-slate-50 shadow-sm transition-all group-hover:shadow-lg group-hover:border-blue-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-50 rounded text-slate-400">
                              {act.type.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className="text-[10px] font-bold text-slate-300">
                              {new Date(act.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <p className="text-slate-800 font-bold">{act.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'followups' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between">
                   <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-4">Scheduled Tasks</h3>
                   <button 
                     onClick={() => setIsFUModalOpen(true)}
                     className="bg-blue-600 text-white px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2"
                   >
                     <Plus size={14}/> Add Task
                   </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lead.followUps.map(fu => (
                    <div key={fu.id} className={`p-6 rounded-[32px] border transition-all ${
                      fu.status === 'Completed' ? 'bg-slate-50 border-slate-100 grayscale opacity-60' : 'bg-white border-slate-100 shadow-sm'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                            fu.status === 'Completed' ? 'bg-slate-200 text-slate-500' : 'bg-rose-100 text-rose-600'
                          }`}>
                            {fu.status}
                          </span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest border border-slate-100 px-2 py-1 rounded-lg">
                            {fu.type || 'Task'}
                          </span>
                        </div>
                        {fu.status === 'Pending' && (
                          <button onClick={() => completeFollowUp(fu.id)} className="p-2 hover:bg-emerald-50 text-slate-200 hover:text-emerald-500 transition-all rounded-xl">
                            <CheckCircle2 size={20}/>
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{new Date(fu.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric'})}</p>
                      <p className="font-bold text-slate-800 leading-snug">{fu.note}</p>
                    </div>
                  ))}
                  {lead.followUps.length === 0 && (
                     <div className="col-span-2 py-20 text-center space-y-4 opacity-20">
                        <ListTodo size={48} className="mx-auto" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No Follow-ups scheduled</p>
                     </div>
                  )}
                </div>
              </div>
            )}
         </div>

         {/* Right Sidebar Strategy Card */}
         <div className="col-span-12 lg:col-span-4 space-y-8">
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
               <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-blue-600" /> Lead Compliance
               </h3>
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                     <div className="flex items-center gap-3">
                        <Smartphone size={16} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-700">WhatsApp Opt-in</span>
                     </div>
                     <button 
                       onClick={() => updateLeadInStorage({ ...lead, whatsappOptIn: !lead.whatsappOptIn })}
                       className={`w-12 h-6 rounded-full transition-all relative ${lead.whatsappOptIn ? 'bg-emerald-500' : 'bg-slate-300'}`}
                     >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${lead.whatsappOptIn ? 'left-7' : 'left-1'}`} />
                     </button>
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                     Automated follow-ups are restricted if WhatsApp opt-in is disabled.
                  </p>
               </div>
            </div>

            <div className="bg-blue-600 p-10 rounded-[48px] text-white space-y-8 shadow-2xl">
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">Channel Activity</h3>
               <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white/10 p-5 rounded-[32px]">
                        <p className="text-[9px] font-black text-blue-200 uppercase tracking-widest">WhatsApp Sent</p>
                        <p className="text-2xl font-black mt-1">{messageLogs.filter(l => l.type === 'WhatsApp').length}</p>
                     </div>
                     <div className="bg-white/10 p-5 rounded-[32px]">
                        <p className="text-[9px] font-black text-blue-200 uppercase tracking-widest">Emails Sent</p>
                        <p className="text-2xl font-black mt-1">{messageLogs.filter(l => l.type === 'Email').length}</p>
                     </div>
                  </div>
                  <button className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-blue-50 transition-all">
                     <RefreshCcw size={14} /> Resync Messaging API
                  </button>
               </div>
            </div>
         </div>
      </div>

      {/* Edit Lead Modal */}
      {isEditModalOpen && editingLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[48px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="bg-slate-950 p-8 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                   <div className="bg-blue-600 p-3 rounded-2xl">
                      <Edit3 size={24}/>
                   </div>
                   <div>
                      <h2 className="text-xl font-black tracking-tight">Edit Client: {editingLead.name}</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Profile Detail Update</p>
                   </div>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24}/></button>
             </div>

             <form onSubmit={handleEditSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Name</label>
                      <input required type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-slate-900 focus:ring-4 focus:ring-blue-50 transition-all" value={editingLead.name || ''} onChange={e => setEditingLead({...editingLead, name: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Phone</label>
                      <input required type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-slate-900 focus:ring-4 focus:ring-blue-50 transition-all" value={editingLead.phone || ''} onChange={e => setEditingLead({...editingLead, phone: e.target.value})} />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email</label>
                      <input type="email" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-slate-900 focus:ring-4 focus:ring-blue-50 transition-all" value={editingLead.email || ''} onChange={e => setEditingLead({...editingLead, email: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Priority Score</label>
                      <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-slate-900 focus:ring-4 focus:ring-blue-50 transition-all" value={editingLead.score} onChange={e => setEditingLead({...editingLead, score: e.target.value as LeadScore})}>
                         {Object.values(LeadScore).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Travel Month</label>
                      <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-slate-900 focus:ring-4 focus:ring-blue-50 transition-all" value={editingLead.travelMonth || ''} onChange={e => setEditingLead({...editingLead, travelMonth: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Budget</label>
                      <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-slate-900 focus:ring-4 focus:ring-blue-50 transition-all" value={editingLead.budgetRange || ''} onChange={e => setEditingLead({...editingLead, budgetRange: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Pax</label>
                      <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-slate-900 focus:ring-4 focus:ring-blue-50 transition-all" value={editingLead.pax || 0} onChange={e => setEditingLead({...editingLead, pax: parseInt(e.target.value)})} />
                   </div>
                </div>

                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Sales Notes</label>
                   <textarea rows={4} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium outline-none text-slate-900 focus:ring-4 focus:ring-blue-50 transition-all" value={editingLead.notes || ''} onChange={e => setEditingLead({...editingLead, notes: e.target.value})} />
                </div>

                <div className="pt-4 flex gap-4">
                   <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 rounded-2xl transition-all">Discard</button>
                   <button type="submit" className="flex-[2] py-4 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
                      <Check size={18}/> Commit Updates
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Custom Follow-up Modal */}
      {isFUModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[48px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="bg-slate-950 p-8 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                   <div className="bg-blue-600 p-3 rounded-2xl">
                      <Bell size={24}/>
                   </div>
                   <div>
                      <h2 className="text-xl font-black tracking-tight uppercase">Schedule Follow-up</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conversion Strategy Task</p>
                   </div>
                </div>
                <button onClick={() => setIsFUModalOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24}/></button>
             </div>

             <form onSubmit={handleCustomFollowUpSubmit} className="p-10 space-y-8">
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Task Type</label>
                      <div className="grid grid-cols-3 gap-2">
                         {['Call', 'WhatsApp', 'Email'].map(t => (
                            <button 
                              key={t}
                              type="button"
                              onClick={() => setFuFormData({...fuFormData, type: t as any})}
                              className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all border ${
                                fuFormData.type === t ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                              }`}
                            >
                               {t}
                            </button>
                         ))}
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Schedule Date</label>
                      <input 
                        required 
                        type="date" 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:ring-4 focus:ring-blue-50 transition-all text-slate-900" 
                        value={fuFormData.date} 
                        onChange={e => setFuFormData({...fuFormData, date: e.target.value})} 
                      />
                   </div>
                </div>

                <div className="space-y-2">
                   <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Task Description</label>
                      <button 
                        type="button"
                        onClick={handleAiSuggestTask}
                        disabled={isAiScheduling}
                        className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1.5 hover:underline disabled:opacity-50"
                      >
                         {isAiScheduling ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                         AI Suggest Task
                      </button>
                   </div>
                   <textarea 
                     rows={3} 
                     required
                     className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl font-bold text-sm text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all shadow-inner" 
                     placeholder="What needs to be done? e.g. Call to finalize houseboat selection..."
                     value={fuFormData.note}
                     onChange={e => setFuFormData({...fuFormData, note: e.target.value})}
                   />
                </div>

                <div className="pt-4 flex gap-4">
                   <button type="button" onClick={() => setIsFUModalOpen(false)} className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 rounded-2xl transition-all">Cancel</button>
                   <button type="submit" className="flex-[2] py-4 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
                      <Calendar size={18}/> Schedule Task
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadProfile;
