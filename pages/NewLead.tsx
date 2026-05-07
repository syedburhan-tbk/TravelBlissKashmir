
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, Globe, MapPinned, Users, Wallet, Calendar, Check, Flame } from 'lucide-react';
import { Lead, LeadStage, LeadScore, TripType, TeamMember } from '../types';
import { MOCK_LEADS, DEFAULT_PERSONAS } from '../constants';

const NewLead: React.FC = () => {
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'Instagram',
    interest: TripType.FAMILY,
    budgetRange: '1L - 2L',
    travelMonth: 'May',
    pax: 2,
    score: LeadScore.WARM,
    notes: '',
    assignedTo: ''
  });

  useEffect(() => {
    const savedMembers = localStorage.getItem('et_team_members');
    const members: TeamMember[] = savedMembers ? JSON.parse(savedMembers) : DEFAULT_PERSONAS;
    setTeamMembers(members);
    if (members.length > 0) {
      setFormData(prev => ({ ...prev, assignedTo: members[0].name }));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newLead: Lead = {
      id: `l-${Date.now()}`,
      ...formData,
      assignedTo: formData.assignedTo || 'Adil Bakshi',
      stage: LeadStage.NEW,
      communicationLogs: [],
      followUps: [],
      tripIds: [],
      createdAt: new Date().toISOString(),
      whatsappOptIn: true
    };

    const saved = localStorage.getItem('et_leads');
    const allLeads = saved ? JSON.parse(saved) : [...MOCK_LEADS];
    allLeads.push(newLead);
    localStorage.setItem('et_leads', JSON.stringify(allLeads));
    
    navigate(`/leads/${newLead.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto py-10">
      <button onClick={() => navigate('/pipeline')} className="mb-8 flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all font-black uppercase tracking-widest text-xs">
        <ArrowLeft size={16} /> Back to Pipeline
      </button>

      <div className="bg-white rounded-[48px] border border-slate-200 shadow-2xl overflow-hidden">
        <div className="bg-slate-950 p-10 text-white">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-900/40">
              <User size={24} />
            </div>
            <h1 className="text-3xl font-black tracking-tighter">Capture New Lead</h1>
          </div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Travel Bliss Kashmir - Central CRM Entry</p>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-10">
          <div className="grid grid-cols-2 gap-8">
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Name</label>
                <div className="relative">
                   <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                   <input required type="text" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-50 transition-all text-slate-900" placeholder="e.g. Rahul Verma" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">WhatsApp / Phone</label>
                <div className="relative">
                   <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                   <input required type="tel" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-50 transition-all text-slate-900" placeholder="+91..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Address</label>
                <div className="relative">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                   <input type="email" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-50 transition-all text-slate-900" placeholder="client@example.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Lead Source</label>
                <div className="relative">
                   <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                   <select className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none appearance-none text-slate-900" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})}>
                      <option>Instagram</option>
                      <option>Website</option>
                      <option>Referral</option>
                      <option>Meta Ads</option>
                      <option>WhatsApp Direct</option>
                   </select>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Interest</label>
                <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-slate-900" value={formData.interest} onChange={e => setFormData({...formData, interest: e.target.value as TripType})}>
                   {Object.values(TripType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Month</label>
                <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-slate-900" placeholder="Dec/Jan..." value={formData.travelMonth} onChange={e => setFormData({...formData, travelMonth: e.target.value})} />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Budget</label>
                <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-slate-900" placeholder="e.g. 1.5L" value={formData.budgetRange} onChange={e => setFormData({...formData, budgetRange: e.target.value})} />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Initial Score</label>
                <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-slate-900" value={formData.score} onChange={e => setFormData({...formData, score: e.target.value as LeadScore})}>
                   {Object.values(LeadScore).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Assigned Agent</label>
                <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-slate-900" value={formData.assignedTo} onChange={e => setFormData({...formData, assignedTo: e.target.value})}>
                   {teamMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
             </div>
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Capture Notes</label>
             <textarea rows={4} className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl font-medium outline-none text-slate-900" placeholder="What is the client specifically looking for?" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          </div>

          <div className="pt-6 flex gap-4">
             <button type="button" onClick={() => navigate('/pipeline')} className="flex-1 py-5 text-slate-400 font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 rounded-3xl transition-all">Discard</button>
             <button type="submit" className="flex-[2] py-5 bg-blue-600 text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-3xl shadow-2xl shadow-blue-900/30 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3">
                <Check size={20} /> Create Lead & Open Profile
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewLead;
