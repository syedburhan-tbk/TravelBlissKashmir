
import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, 
  Building, 
  ShieldCheck, 
  Mail, 
  Phone, 
  MapPin, 
  Percent, 
  Image as ImageIcon, 
  Palette, 
  MessageSquare, 
  BellRing, 
  Smartphone, 
  Code, 
  Globe, 
  X, 
  Plus, 
  Eye, 
  EyeOff, 
  CheckCircle2,
  Loader2,
  Clock,
  Trash2,
  Upload
} from 'lucide-react';
import { BRAND_CONFIG } from '../constants';
import { DEFAULT_TEMPLATES } from '../services/messagingService';

import { safeLocalStorage, STORAGE_KEYS } from '../utils/storage';

// Moved outside to prevent re-mounting on every state change (keystroke)
const Section = ({ title, icon: Icon, children }: any) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8 animate-in fade-in duration-300">
    <div className="p-6 border-b border-slate-100 flex items-center gap-3">
      <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
        <Icon size={20} />
      </div>
      <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">{title}</h3>
    </div>
    <div className="p-8">
      {children}
    </div>
  </div>
);

const Settings: React.FC = () => {
  const [config, setConfig] = useState(() => {
    try {
      const savedConfig = safeLocalStorage.getItem(STORAGE_KEYS.BRAND_CONFIG);
      return savedConfig ? JSON.parse(savedConfig) : BRAND_CONFIG;
    } catch (e) {
      console.error('Failed to parse brand config:', e);
      return BRAND_CONFIG;
    }
  });
  const [activeTab, setActiveTab] = useState<'agency' | 'messaging'>('agency');
  const [templates, setTemplates] = useState(() => {
    try {
      const savedTemplates = safeLocalStorage.getItem(STORAGE_KEYS.MESSAGE_TEMPLATES);
      return savedTemplates ? JSON.parse(savedTemplates) : DEFAULT_TEMPLATES;
    } catch (e) {
      console.error('Failed to parse message templates:', e);
      return DEFAULT_TEMPLATES;
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // API Key State
  const [apiKeys, setApiKeys] = useState(() => {
    const defaultKeys = {
      whatsapp: '',
      sendgrid: '',
      fromEmail: 'hello@escapetheory.in'
    };
    try {
      const savedKeys = safeLocalStorage.getItem(STORAGE_KEYS.API_KEYS);
      return savedKeys ? JSON.parse(savedKeys) : defaultKeys;
    } catch (e) {
      console.error('Failed to parse API keys:', e);
      return defaultKeys;
    }
  });
  
  const [showKeys, setShowKeys] = useState({
    whatsapp: false,
    sendgrid: false
  });

  useEffect(() => {
    // Initialized via useState initializers
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    
    // Simulate network delay for effect
    await new Promise(resolve => setTimeout(resolve, 800));

    safeLocalStorage.setItem(STORAGE_KEYS.BRAND_CONFIG, JSON.stringify(config));
    safeLocalStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(apiKeys));
    safeLocalStorage.setItem(STORAGE_KEYS.MESSAGE_TEMPLATES, JSON.stringify(templates));

    // Dispatch global event so other components (Layout, etc) can refresh
    window.dispatchEvent(new Event('et_settings_updated'));

    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Configuration</h1>
          <p className="text-slate-500">Global brand identity and automated messaging controls.</p>
        </div>
        
        <div className="flex items-center gap-4">
          {showSuccess && (
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm animate-in fade-in slide-in-from-right-2">
              <CheckCircle2 size={18} />
              Changes Saved!
            </div>
          )}
          <button 
            onClick={handleSaveAll}
            disabled={isSaving}
            className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all disabled:opacity-50 active:scale-95"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isSaving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      <div className="flex gap-4 p-1.5 bg-white border border-slate-100 rounded-3xl w-fit">
        <button 
          onClick={() => setActiveTab('agency')}
          className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
            activeTab === 'agency' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'
          }`}
        >
          Agency & Costing
        </button>
        <button 
          onClick={() => setActiveTab('messaging')}
          className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
            activeTab === 'messaging' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'
          }`}
        >
          Messaging & Automation
        </button>
      </div>

      {activeTab === 'agency' && (
        <div className="space-y-8">
          <Section title="Brand Identity" icon={Building}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Agency Name</label>
                  <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900 focus:ring-2 focus:ring-blue-500" value={config.name} onChange={e => setConfig({...config, name: e.target.value})} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tagline / Motto</label>
                  <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900 focus:ring-2 focus:ring-blue-500" value={config.tagline} onChange={e => setConfig({...config, tagline: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Support Phone</label>
                    <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900" value={config.phone} onChange={e => setConfig({...config, phone: e.target.value})} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Official Address</label>
                    <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900" value={config.address} onChange={e => setConfig({...config, address: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Agency Logomark</label>
                 <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[32px] p-10 bg-slate-50/50 hover:bg-slate-100/50 transition-all group relative overflow-hidden">
                    {config.logo ? (
                      <div className="relative z-10">
                        <img src={config.logo} alt="Logo" className="w-24 h-24 object-contain" />
                        <button 
                          onClick={() => setConfig({...config, logo: ''})}
                          className="absolute -top-4 -right-4 bg-rose-600 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-slate-300 z-10">
                        <ImageIcon size={48} />
                        <span className="text-[10px] font-black uppercase tracking-widest">No Logo Uploaded</span>
                      </div>
                    )}
                    <button 
                      onClick={() => logoInputRef.current?.click()}
                      className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-600 hover:border-blue-300 shadow-sm relative z-10 active:scale-95 transition-all"
                    >
                      <Upload size={14} /> {config.logo ? 'Change Logo' : 'Upload Logo'}
                    </button>
                    <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                 </div>
              </div>
            </div>
          </Section>

          <Section title="Financial Configuration" icon={Percent}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Default Profit Margin (%)</label>
                    <span className="text-xl font-black text-blue-600">{config.defaultMargin}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="50" 
                    step="1"
                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                    value={config.defaultMargin} 
                    onChange={e => setConfig({...config, defaultMargin: parseInt(e.target.value)})} 
                  />
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">This margin is applied to all new leads and trip drafts.</p>
                </div>
              </div>
              <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col justify-center">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Costing Strategy</h4>
                 <p className="text-sm font-bold text-slate-300 leading-relaxed italic">"Dynamic margins allow our sales team to remain competitive during peak season while maintaining high yield in winter."</p>
              </div>
            </div>
          </Section>
        </div>
      )}

      {activeTab === 'messaging' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <Section title="Channel API Configuration" icon={Globe}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="flex flex-col gap-3">
                   <div className="flex items-center justify-between">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">WhatsApp Business API Key</label>
                     {apiKeys.whatsapp && <span className="flex items-center gap-1 text-[8px] font-black uppercase text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full"><ShieldCheck size={10}/> Connected</span>}
                   </div>
                   <div className="relative">
                     <input 
                       type={showKeys.whatsapp ? "text" : "password"} 
                       placeholder="Enter WA_API_KEY..." 
                       className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 shadow-inner"
                       value={apiKeys.whatsapp}
                       onChange={e => setApiKeys({...apiKeys, whatsapp: e.target.value})}
                     />
                     <button 
                       onClick={() => setShowKeys({...showKeys, whatsapp: !showKeys.whatsapp})}
                       className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                     >
                       {showKeys.whatsapp ? <EyeOff size={18} /> : <Eye size={18} />}
                     </button>
                   </div>
                </div>
                <div className="flex flex-col gap-3">
                   <div className="flex items-center justify-between">
                     <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">SendGrid SMTP / API Key</label>
                     {apiKeys.sendgrid && <span className="flex items-center gap-1 text-[8px] font-black uppercase text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full"><ShieldCheck size={10}/> Authenticated</span>}
                   </div>
                   <div className="relative">
                     <input 
                       type={showKeys.sendgrid ? "text" : "password"} 
                       placeholder="SG.xxxxxxx..." 
                       className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 shadow-inner"
                       value={apiKeys.sendgrid}
                       onChange={e => setApiKeys({...apiKeys, sendgrid: e.target.value})}
                     />
                     <button 
                       onClick={() => setShowKeys({...showKeys, sendgrid: !showKeys.sendgrid})}
                       className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                     >
                       {showKeys.sendgrid ? <EyeOff size={18} /> : <Eye size={18} />}
                     </button>
                   </div>
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Authorized Sender Email</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                    value={apiKeys.fromEmail}
                    onChange={e => setApiKeys({...apiKeys, fromEmail: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="bg-slate-950 border border-slate-800 rounded-[40px] p-10 space-y-8 flex flex-col justify-center shadow-2xl">
                 <div className="space-y-3 text-center">
                    <div className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center transition-colors duration-500 ${apiKeys.whatsapp && apiKeys.sendgrid ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                       <ShieldCheck size={32} />
                    </div>
                    <h4 className="text-sm font-black uppercase text-white tracking-[0.2em]">Live Automation Hub</h4>
                 </div>
                 
                 <div className="space-y-5">
                    <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/10 group hover:bg-white/10 transition-all">
                       <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-xl ${apiKeys.whatsapp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
                             <Smartphone size={20} />
                          </div>
                          <span className="text-xs font-black uppercase tracking-widest text-slate-300">WhatsApp Engine</span>
                       </div>
                       <div className={`w-12 h-6 rounded-full relative transition-colors ${apiKeys.whatsapp ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg transition-all ${apiKeys.whatsapp ? 'right-1' : 'left-1'}`} />
                       </div>
                    </div>
                    <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/10 group hover:bg-white/10 transition-all">
                       <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-xl ${apiKeys.sendgrid ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-600'}`}>
                             <Mail size={20} />
                          </div>
                          <span className="text-xs font-black uppercase tracking-widest text-slate-300">Email Dispatcher</span>
                       </div>
                       <div className={`w-12 h-6 rounded-full relative transition-colors ${apiKeys.sendgrid ? 'bg-blue-500' : 'bg-slate-700'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg transition-all ${apiKeys.sendgrid ? 'right-1' : 'left-1'}`} />
                       </div>
                    </div>
                 </div>
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center leading-relaxed">
                    Automations trigger based on CRM inactivity or lead status changes.
                 </p>
              </div>
            </div>
          </Section>

          <Section title="Automated Message Blueprints" icon={Code}>
            <div className="space-y-10">
               <div className="flex gap-4 p-5 bg-blue-50 rounded-[28px] border border-blue-100 shadow-inner">
                  <div className="bg-white p-2 rounded-xl text-blue-600 shadow-sm shrink-0 h-fit">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-blue-900 tracking-widest">Global Dynamic Injectors</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                       {['name', 'trip_name', 'travel_month', 'agent_name', 'pax'].map(tag => (
                         <span key={tag} className="text-[10px] font-bold bg-white text-blue-600 px-2 py-0.5 rounded-lg border border-blue-100 shadow-sm">{"{{"}{tag}{"}}"}</span>
                       ))}
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 gap-8">
                  {templates.map((tmp, idx) => (
                    <div key={tmp.id} className="p-10 border border-slate-100 rounded-[48px] space-y-8 relative group hover:border-blue-200 transition-all bg-white shadow-sm hover:shadow-xl">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-5">
                             <div className={`p-4 rounded-3xl shadow-lg transition-all duration-500 ${tmp.type === 'WhatsApp' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}`}>
                                {tmp.type === 'WhatsApp' ? <Smartphone size={24}/> : <Mail size={24}/>}
                             </div>
                             <div>
                                <h4 className="text-lg font-black text-slate-900 tracking-tight">{tmp.name}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-full border border-slate-100">
                                    <Clock size={12} className="text-slate-400" />
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Trigger: {tmp.delayHours}h Inactivity</p>
                                  </div>
                                  <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                  <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{tmp.type} Channel</span>
                                </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-4">
                             <div className="flex flex-col items-end gap-1 mr-4">
                                <span className="text-[8px] font-black uppercase text-slate-400">Automation Status</span>
                                <div className="w-12 h-6 bg-emerald-500 rounded-full relative shadow-inner cursor-pointer border-2 border-emerald-100">
                                  <div className="absolute right-1 top-0.5 w-4 h-4 bg-white rounded-full shadow-lg"/>
                                </div>
                             </div>
                             <button className="p-3 bg-slate-50 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"><Trash2 size={20}/></button>
                          </div>
                       </div>
                       <div className="relative">
                          <textarea 
                            className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[40px] outline-none font-bold text-slate-800 focus:bg-white focus:ring-8 focus:ring-blue-50 transition-all text-base leading-relaxed shadow-inner"
                            rows={5}
                            value={tmp.body}
                            onChange={(e) => {
                              const newTemplates = [...templates];
                              newTemplates[idx].body = e.target.value;
                              setTemplates(newTemplates);
                            }}
                          />
                          <div className="absolute top-4 right-4 bg-white/80 backdrop-blur border border-slate-100 p-2 rounded-xl text-slate-300 pointer-events-none group-focus-within:opacity-0 transition-opacity">
                             <ImageIcon size={16}/>
                          </div>
                       </div>
                    </div>
                  ))}
                  <button className="w-full py-16 border-4 border-dashed border-slate-100 rounded-[64px] text-slate-300 font-black uppercase tracking-[0.4em] text-xs hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/20 transition-all flex flex-col items-center justify-center gap-6">
                     <div className="p-6 bg-slate-50 rounded-full shadow-inner group-hover:bg-white transition-colors">
                        <Plus size={48} className="opacity-40" />
                     </div>
                     <span>New Communication Blueprint</span>
                  </button>
               </div>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
};

export default Settings;
