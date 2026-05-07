
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  MapPin, 
  IndianRupee, 
  Plus, 
  Activity as ActivityIcon, 
  X, 
  Check, 
  Edit2, 
  Eye, 
  Trash2, 
  Clock, 
  Layers, 
  Info,
  Camera,
  Image as ImageIcon,
  Compass,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { ACTIVITIES } from '../constants';
import { Activity } from '../types';

const ACTIVITY_CATEGORIES = ['Sightseeing', 'Adventure', 'Cultural', 'Nature', 'Leisure'];

const Activities: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [maxCost, setMaxCost] = useState('10000');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [viewingActivity, setViewingActivity] = useState<Activity | null>(null);
  const [customActivities, setCustomActivities] = useState<Activity[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const initialFormState: Partial<Activity> = {
    name: '',
    costPerPax: 0,
    description: '',
    location: '',
    category: 'Sightseeing',
    duration: '1 Hour',
    internalNotes: '',
    image: ''
  };

  const [formData, setFormData] = useState<Partial<Activity>>(initialFormState);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('et_activities');
    if (saved) setCustomActivities(JSON.parse(saved));
  }, []);

  const allActivities = useMemo(() => {
    const customIds = new Set(customActivities.map(a => a.id));
    return [...ACTIVITIES.filter(a => !customIds.has(a.id)), ...customActivities];
  }, [customActivities]);

  const filteredActivities = useMemo(() => {
    return allActivities.filter(a => {
      const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (a.location?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCost = a.costPerPax <= parseInt(maxCost);
      const matchesCategory = categoryFilter === 'All' || a.category === categoryFilter;
      return matchesSearch && matchesCost && matchesCategory;
    });
  }, [allActivities, searchTerm, maxCost, categoryFilter]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    setEditingActivityId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, activity: Activity) => {
    e.stopPropagation();
    setEditingActivityId(activity.id);
    setFormData({ ...activity });
    setIsModalOpen(true);
    setViewingActivity(null);
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    const activityData: Activity = {
      ...formData,
      id: editingActivityId || `a-custom-${Date.now()}`,
      name: formData.name || 'New Activity',
      costPerPax: formData.costPerPax || 0,
      description: formData.description || '',
    } as Activity;

    let updated: Activity[];
    if (editingActivityId) {
      const index = customActivities.findIndex(a => a.id === editingActivityId);
      if (index > -1) {
        updated = [...customActivities];
        updated[index] = activityData;
      } else updated = [...customActivities, activityData];
    } else updated = [...customActivities, activityData];

    setCustomActivities(updated);
    localStorage.setItem('et_activities', JSON.stringify(updated));
    setIsModalOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Permanently remove this activity from inventory?")) {
      const updated = customActivities.filter(a => a.id !== id);
      setCustomActivities(updated);
      localStorage.setItem('et_activities', JSON.stringify(updated));
      setViewingActivity(null);
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Activity Catalog</h1>
          <p className="text-slate-500 text-sm">Curated experiences, excursions, and local highlights for Kashmir trips.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95"
        >
          <Plus size={18} /> New Activity
        </button>
      </div>

      <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-8 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search activities by name or location..." 
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-50/50 transition-all text-slate-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-6 w-full md:w-auto">
          <div className="flex items-center gap-3">
             <div className="bg-slate-100 p-2.5 rounded-xl text-slate-500"><ActivityIcon size={16}/></div>
             <select 
               className="bg-transparent text-xs font-black uppercase tracking-widest text-slate-700 outline-none cursor-pointer"
               value={categoryFilter}
               onChange={(e) => setCategoryFilter(e.target.value)}
             >
               <option value="All">All Types</option>
               {ACTIVITY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
          </div>

          <div className="flex-1 min-w-[200px] space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Max Budget / PAX</label>
              <span className="text-[11px] font-black text-blue-600">₹{parseInt(maxCost).toLocaleString()}</span>
            </div>
            <input 
              type="range" 
              min="500" 
              max="20000" 
              step="500" 
              value={maxCost}
              onChange={(e) => setMaxCost(e.target.value)}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredActivities.map(act => (
          <div 
            key={act.id} 
            onClick={() => setViewingActivity(act)}
            className="bg-white border border-slate-200 rounded-[36px] overflow-hidden hover:shadow-2xl hover:border-blue-100 transition-all group flex flex-col shadow-sm cursor-pointer relative"
          >
            <div className="relative h-48 bg-slate-100 overflow-hidden">
              <img 
                src={act.image || `https://picsum.photos/seed/${act.id}/600/400`} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90" 
                alt={act.name} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 bg-white/90 backdrop-blur border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-700 shadow-sm">
                  {act.category || 'Sightseeing'}
                </span>
              </div>
              <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <button onClick={(e) => openEditModal(e, act)} className="p-2.5 bg-white/90 backdrop-blur rounded-2xl text-slate-400 hover:text-blue-600 hover:bg-white shadow-sm transition-all"><Edit2 size={16} /></button>
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <div className="mb-6">
                <h3 className="font-black text-slate-900 text-lg group-hover:text-blue-600 transition-colors leading-tight mb-2 truncate" title={act.name}>
                  {act.name}
                </h3>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <MapPin size={12} className="text-blue-500" />
                    {act.location || 'Kashmir'}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-slate-200" />
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Clock size={12} className="text-amber-500" />
                    {act.duration || 'Flexible'}
                  </span>
                </div>
              </div>

              <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed mb-6 italic font-medium">
                "{act.description}"
              </p>
              
              <div className="mt-auto pt-5 border-t border-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] mb-1">Cost Per Guest</span>
                  <div className="text-2xl font-black text-slate-900 flex items-center gap-1">
                    <IndianRupee size={20} className="text-blue-600" />
                    {act.costPerPax.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                  <ArrowRight size={20} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredActivities.length === 0 && (
        <div className="bg-white p-32 rounded-[48px] border-2 border-dashed border-slate-200 text-center flex flex-col items-center gap-6">
          <div className="p-6 bg-slate-50 rounded-full text-slate-300">
             <Search size={64} />
          </div>
          <div>
             <p className="text-xl font-black text-slate-900 uppercase tracking-tight">No Experiences Found</p>
             <p className="text-slate-400 font-bold mt-1">Try adjusting your filters or search criteria.</p>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewingActivity && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[48px] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="h-80 relative bg-slate-900">
              <img 
                src={viewingActivity.image || `https://picsum.photos/seed/${viewingActivity.id}/1200/600`} 
                className="w-full h-full object-cover opacity-60" 
                alt={viewingActivity.name} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
              <button onClick={() => setViewingActivity(null)} className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all z-10"><X size={24} /></button>
              <div className="absolute bottom-10 left-10">
                <div className="flex items-center gap-3 mb-3">
                   <span className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-xl">{viewingActivity.category}</span>
                   <span className="text-blue-300 text-xs font-black uppercase tracking-widest">{viewingActivity.location}</span>
                </div>
                <h2 className="text-5xl font-black text-white leading-none tracking-tighter drop-shadow-lg">{viewingActivity.name}</h2>
              </div>
            </div>

            <div className="p-12 grid grid-cols-1 md:grid-cols-12 gap-12">
               <div className="md:col-span-7 space-y-10">
                  <div className="space-y-4">
                     <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
                        <div className="w-8 h-px bg-slate-200" /> Experience Narrative
                     </h4>
                     <p className="text-lg text-slate-700 leading-relaxed font-medium italic">
                       "{viewingActivity.description}"
                     </p>
                  </div>

                  {viewingActivity.internalNotes && (
                    <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Info size={120} />
                       </div>
                       <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-4 flex items-center gap-2">
                          <Info size={14} /> Operations Context
                       </h4>
                       <p className="text-base text-slate-300 leading-relaxed font-bold relative z-10">
                         {viewingActivity.internalNotes}
                       </p>
                    </div>
                  )}
               </div>

               <div className="md:col-span-5 space-y-6">
                  <div className="bg-slate-50 p-8 rounded-[48px] border border-slate-100 space-y-8 shadow-sm">
                     <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Standard Net Rate</p>
                        <div className="text-4xl font-black text-slate-900 flex items-center gap-1.5">
                           <IndianRupee size={32} className="text-blue-600" />
                           {viewingActivity.costPerPax.toLocaleString()}
                           <span className="text-[10px] text-slate-300 font-black uppercase ml-2 tracking-widest">/ Guest</span>
                        </div>
                     </div>

                     <div className="space-y-4 pt-4 border-t border-slate-200">
                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
                           <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Time Required</span>
                           <span className="text-sm font-black text-slate-900 flex items-center gap-2"><Clock size={16} className="text-amber-500" /> {viewingActivity.duration}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
                           <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Primary Hub</span>
                           <span className="text-sm font-black text-slate-900 flex items-center gap-2"><MapPin size={16} className="text-blue-500" /> {viewingActivity.location}</span>
                        </div>
                     </div>

                     <div className="pt-6 flex flex-col gap-3">
                        <button 
                          onClick={(e) => openEditModal(e, viewingActivity)}
                          className="w-full py-4 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                           <Edit2 size={16}/> Modify Experience
                        </button>
                        <button 
                          onClick={(e) => handleDelete(e, viewingActivity.id)}
                          className="w-full py-4 text-rose-600 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-rose-50 rounded-2xl transition-all"
                        >
                           Remove from Hub
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[48px] shadow-2xl w-full max-w-3xl my-8 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-white p-8 border-b border-slate-50 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-xl shadow-blue-100">
                  {editingActivityId ? <Edit2 size={24} /> : <Compass size={24} />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">{editingActivityId ? 'Modify Experience Hub' : 'Register New Experience'}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Curatorial Database Entry</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 hover:bg-slate-50 rounded-full transition-colors text-slate-300 hover:text-slate-900"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveActivity} className="p-10 space-y-12">
               {/* Image Picker */}
               <div className="space-y-6">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600 border-b border-blue-50 pb-3 flex items-center gap-2">
                    <Camera size={14} /> Catalog Visualization
                  </h4>
                  <div className="w-full h-64 rounded-[40px] bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden relative group transition-all hover:border-blue-400 hover:bg-blue-50/30">
                    {formData.image ? (
                      <>
                        <img src={formData.image} className="w-full h-full object-cover" alt="Preview" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            type="button"
                            onClick={() => setFormData({ ...formData, image: '' })}
                            className="bg-white text-rose-600 p-4 rounded-full shadow-2xl hover:scale-110 transition-transform"
                          >
                            <Trash2 size={24} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-4"
                      >
                        <div className="bg-white p-5 rounded-3xl shadow-lg border border-slate-100 text-blue-600">
                          <ImageIcon size={48} />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-black text-slate-600 uppercase tracking-widest">Select Catalog Image</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">High-quality Landscape Shots Preferred</p>
                        </div>
                      </button>
                    )}
                  </div>
                  <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
               </div>

               <div className="space-y-8">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600 border-b border-blue-50 pb-3">Core Particulars</h4>
                  <div className="grid grid-cols-2 gap-8">
                     <div className="col-span-2 space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Activity Name</label>
                        <input required type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-50/50 transition-all shadow-inner" placeholder="e.g. Shikara Ride on Dal Lake" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Primary Hub (Location)</label>
                        <input required type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none" placeholder="e.g. Srinagar" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Category</label>
                        <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black uppercase tracking-widest text-slate-700 outline-none cursor-pointer shadow-sm" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                           {ACTIVITY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                     </div>
                  </div>
               </div>

               <div className="space-y-8">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600 border-b border-blue-50 pb-3">Operational Logistics</h4>
                  <div className="grid grid-cols-2 gap-8">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Standard Duration</label>
                        <input type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none" placeholder="e.g. 1.5 Hours" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Net Cost / PAX</label>
                        <div className="relative">
                           <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 font-black">₹</div>
                           <input required type="number" className="w-full pl-10 pr-4 py-3.5 bg-blue-50 border border-blue-100 rounded-2xl text-base font-black text-blue-900 outline-none" value={formData.costPerPax || ''} onChange={e => setFormData({...formData, costPerPax: parseInt(e.target.value) || 0})} />
                        </div>
                     </div>
                  </div>
               </div>

               <div className="space-y-8">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600 border-b border-blue-50 pb-3">Descriptive Metadata</h4>
                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Client Narrative (Public)</label>
                        <textarea rows={4} className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[32px] text-sm font-medium leading-relaxed text-slate-700 outline-none shadow-inner" placeholder="Briefly describe the guest experience..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Internal Logistical Notes (Hidden)</label>
                        <textarea rows={3} className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[32px] text-sm font-bold leading-relaxed text-slate-600 outline-none shadow-inner italic" placeholder="Add provider details, seasonal restrictions, or booking tips..." value={formData.internalNotes} onChange={e => setFormData({...formData, internalNotes: e.target.value})} />
                     </div>
                  </div>
               </div>

               <div className="pt-8 flex gap-6 border-t border-slate-50">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 text-slate-400 font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 rounded-2xl transition-all">Discard</button>
                  <button type="submit" className="flex-[2] py-5 bg-blue-600 text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl shadow-2xl shadow-blue-900/10 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 active:scale-95">
                     <Check size={20}/> {editingActivityId ? 'Update Inventory Entry' : 'Commit New Experience'}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Activities;
