
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  ShieldCheck, 
  XCircle, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  Info,
  Search,
  ListChecks,
  AlertCircle
} from 'lucide-react';
import { DEFAULT_INCLUSIONS, DEFAULT_EXCLUSIONS } from '../constants';

const MasterTerms: React.FC = () => {
  const [inclusions, setInclusions] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const savedInc = localStorage.getItem('et_master_inclusions');
    const savedExc = localStorage.getItem('et_master_exclusions');
    
    setInclusions(savedInc ? JSON.parse(savedInc) : [...DEFAULT_INCLUSIONS]);
    setExclusions(savedExc ? JSON.parse(savedExc) : [...DEFAULT_EXCLUSIONS]);
  }, []);

  const handleSave = () => {
    localStorage.setItem('et_master_inclusions', JSON.stringify(inclusions));
    localStorage.setItem('et_master_exclusions', JSON.stringify(exclusions));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleReset = () => {
    if (window.confirm("Reset all terms to system defaults? Your custom items will be removed.")) {
      setInclusions([...DEFAULT_INCLUSIONS]);
      setExclusions([...DEFAULT_EXCLUSIONS]);
    }
  };

  const addItem = (type: 'inclusion' | 'exclusion') => {
    if (type === 'inclusion' && newInclusion.trim()) {
      setInclusions([...inclusions, newInclusion.trim()]);
      setNewInclusion('');
    } else if (type === 'exclusion' && newExclusion.trim()) {
      setExclusions([...exclusions, newExclusion.trim()]);
      setNewExclusion('');
    }
  };

  const removeItem = (type: 'inclusion' | 'exclusion', index: number) => {
    if (type === 'inclusion') {
      setInclusions(inclusions.filter((_, i) => i !== index));
    } else {
      setExclusions(exclusions.filter((_, i) => i !== index));
    }
  };

  const filteredInclusions = inclusions.filter(i => i.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredExclusions = exclusions.filter(e => e.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Master Terms & Policy</h1>
          <p className="text-slate-500 text-sm mt-1">Manage standard inclusions and exclusions used across all new itineraries.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleReset}
            className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-slate-200 transition-all"
          >
            <RotateCcw size={16} /> Restore Defaults
          </button>
          <button 
            onClick={handleSave}
            className="bg-blue-600 text-white px-10 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95"
          >
            {showSuccess ? <CheckCircle2 size={18} /> : <Save size={18} />}
            {showSuccess ? 'Saved Successfully' : 'Commit Changes'}
          </button>
        </div>
      </div>

      {/* Global Search */}
      <div className="bg-white p-4 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden group">
         <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
         <input 
           type="text" 
           placeholder="Search across all master terms..." 
           className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-900 focus:bg-white focus:ring-8 focus:ring-blue-50 transition-all"
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)}
         />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* INCLUSIONS COLUMN */}
        <div className="space-y-6">
          <div className="bg-emerald-600 p-8 rounded-[40px] text-white space-y-6 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <ShieldCheck size={120} />
             </div>
             <div className="flex items-center justify-between relative z-10">
                <div>
                   <h2 className="text-xl font-black tracking-tight uppercase">Master Inclusions</h2>
                   <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest mt-1">What we provide by default</p>
                </div>
                <div className="bg-white/20 p-3 rounded-2xl">
                   <ListChecks size={24} />
                </div>
             </div>
             
             <div className="flex gap-3 relative z-10">
                <input 
                  type="text" 
                  placeholder="Type a new standard inclusion..."
                  className="flex-1 px-6 py-4 bg-white/10 border border-white/20 rounded-2xl outline-none font-bold placeholder:text-emerald-200 text-sm focus:bg-white/20 transition-all"
                  value={newInclusion}
                  onChange={(e) => setNewInclusion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addItem('inclusion')}
                />
                <button 
                  onClick={() => addItem('inclusion')}
                  className="bg-white text-emerald-600 p-4 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                  <Plus size={24} strokeWidth={3} />
                </button>
             </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[40px] p-6 space-y-3 shadow-sm min-h-[400px]">
            {filteredInclusions.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-3xl group hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <p className="flex-1 text-sm font-bold text-slate-700 leading-snug">{item}</p>
                <button 
                  onClick={() => removeItem('inclusion', idx)}
                  className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {filteredInclusions.length === 0 && (
              <div className="h-60 flex flex-col items-center justify-center text-slate-300 gap-4">
                 <Info size={48} className="opacity-10" />
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-40">No entries matched</p>
              </div>
            )}
          </div>
        </div>

        {/* EXCLUSIONS COLUMN */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-6 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <XCircle size={120} />
             </div>
             <div className="flex items-center justify-between relative z-10">
                <div>
                   <h2 className="text-xl font-black tracking-tight uppercase">Master Exclusions</h2>
                   <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">What the client pays extra for</p>
                </div>
                <div className="bg-white/10 p-3 rounded-2xl">
                   <AlertCircle size={24} />
                </div>
             </div>
             
             <div className="flex gap-3 relative z-10">
                <input 
                  type="text" 
                  placeholder="Type a new standard exclusion..."
                  className="flex-1 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold placeholder:text-slate-500 text-sm focus:bg-white/10 transition-all"
                  value={newExclusion}
                  onChange={(e) => setNewExclusion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addItem('exclusion')}
                />
                <button 
                  onClick={() => addItem('exclusion')}
                  className="bg-blue-600 text-white p-4 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                  <Plus size={24} strokeWidth={3} />
                </button>
             </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[40px] p-6 space-y-3 shadow-sm min-h-[400px]">
            {filteredExclusions.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-3xl group hover:border-blue-200 hover:bg-slate-100/50 transition-all">
                <div className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                <p className="flex-1 text-sm font-bold text-slate-700 leading-snug">{item}</p>
                <button 
                  onClick={() => removeItem('exclusion', idx)}
                  className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {filteredExclusions.length === 0 && (
              <div className="h-60 flex flex-col items-center justify-center text-slate-300 gap-4">
                 <Info size={48} className="opacity-10" />
                 <p className="text-[10px] font-black uppercase tracking-widest opacity-40">No entries matched</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-10 bg-blue-50 border border-blue-100 rounded-[48px] flex flex-col md:flex-row items-center gap-10">
         <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shrink-0">
            <Info size={40} />
         </div>
         <div className="space-y-2">
            <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">System Propagation Notice</h4>
            <p className="text-slate-600 font-medium leading-relaxed">
               Updating master terms will affect all <strong>newly created</strong> trips and templates. Existing itineraries will retain their current terms to avoid client confusion during negotiation.
            </p>
         </div>
      </div>
    </div>
  );
};

export default MasterTerms;
