
import React, { useState, useMemo } from 'react';
import { Sparkles, MapPin, Search, Plus, Filter, LayoutGrid, List as ListIcon, Trash2, Edit2, ChevronRight, Clock, Award, X, Save } from 'lucide-react';
import { ITINERARY_VARIATIONS } from '../itineraryDatabase';
import { ItineraryDayVariation, DayType } from '../types';
import { safeLocalStorage, STORAGE_KEYS } from '../utils/storage';

const VariationsDatabase: React.FC = () => {
  const [customVariations, setCustomVariations] = useState<ItineraryDayVariation[]>(() => {
    try {
      const saved = safeLocalStorage.getItem(STORAGE_KEYS.VARIATIONS);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse custom variations:', e);
      return [];
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<DayType | 'All'>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVariation, setEditingVariation] = useState<ItineraryDayVariation | null>(null);
  const [formData, setFormData] = useState<Partial<ItineraryDayVariation>>({
    dayType: DayType.SIGHTSEEING,
    experienceTags: [],
    seasonalRelevance: ['Summer'],
    routeType: 'Direct',
    stayType: 'Hotel',
    transferType: 'Private'
  });

  const variations = useMemo(() => {
    const customIds = new Set(customVariations.map(v => v.id));
    // Filter out mock variations if they are overridden by custom ones (same ID)
    const mock = ITINERARY_VARIATIONS.filter(v => !customIds.has(v.id));
    return [...mock, ...customVariations];
  }, [customVariations]);

  const filtered = variations.filter(v => {
    const matchesSearch = 
      v.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      v.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.customerDescription.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || v.dayType === filterType;
    return matchesSearch && matchesType;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.destination) {
      alert("Title and Destination are required.");
      return;
    }

    const variationData: ItineraryDayVariation = {
      id: editingVariation?.id || `v-custom-${Date.now()}`,
      title: formData.title || '',
      dayType: formData.dayType as DayType || DayType.SIGHTSEEING,
      source: formData.source || '',
      destination: formData.destination || '',
      routeType: formData.routeType as any || 'Direct',
      experienceTags: formData.experienceTags || [],
      stayType: formData.stayType as any || 'Hotel',
      transferType: formData.transferType as any || 'Private',
      recommendedAddOns: formData.recommendedAddOns || [],
      seasonalRelevance: formData.seasonalRelevance as any || ['Summer'],
      travelTimeApprox: formData.travelTimeApprox || '',
      internalNotes: formData.internalNotes || '',
      customerDescription: formData.customerDescription || '',
      luxuryEnhancement: formData.luxuryEnhancement || ''
    };

    let updated: ItineraryDayVariation[];
    if (editingVariation) {
      updated = customVariations.map(v => v.id === editingVariation.id ? variationData : v);
      // If editing a mock variation, it becomes a custom one
      if (!customVariations.find(v => v.id === editingVariation.id)) {
        updated = [...customVariations, variationData];
      }
    } else {
      updated = [...customVariations, variationData];
    }

    setCustomVariations(updated);
    safeLocalStorage.setItem(STORAGE_KEYS.VARIATIONS, JSON.stringify(updated));
    setIsModalOpen(false);
    setEditingVariation(null);
    setFormData({
      dayType: DayType.SIGHTSEEING,
      experienceTags: [],
      seasonalRelevance: ['Summer'],
      routeType: 'Direct',
      stayType: 'Hotel',
      transferType: 'Private'
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Permanently remove this variation?")) {
      const updated = customVariations.filter(v => v.id !== id);
      setCustomVariations(updated);
      safeLocalStorage.setItem(STORAGE_KEYS.VARIATIONS, JSON.stringify(updated));
    }
  };

  const openEditModal = (variation: ItineraryDayVariation) => {
    setEditingVariation(variation);
    setFormData(variation);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingVariation(null);
    setFormData({
      dayType: DayType.SIGHTSEEING,
      experienceTags: [],
      seasonalRelevance: ['Summer'],
      routeType: 'Direct',
      stayType: 'Hotel',
      transferType: 'Private'
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
           <div className="flex items-center gap-3 mb-2">
             <div className="p-2.5 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
                <Sparkles className="text-white" size={24} />
             </div>
             <div>
               <h1 className="text-2xl font-black text-slate-900 tracking-tight">Day Variations Master</h1>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Intelligent Itinerary Components</p>
             </div>
           </div>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
           <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 group transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20">
             <Search size={16} className="text-slate-400 group-focus-within:text-blue-500" />
             <input 
               type="text" 
               placeholder="Search variations..." 
               className="bg-transparent border-none outline-none text-xs font-bold text-slate-600 w-48"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           <button 
             onClick={openAddModal}
             className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2"
           >
             <Plus size={20} />
           </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
         <div className="flex gap-2 p-1.5 bg-white border border-slate-100 rounded-2xl overflow-x-auto max-w-full no-scrollbar">
            {(['All', ...Object.values(DayType)] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  filterType === type 
                    ? 'bg-slate-900 text-white shadow-lg' 
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                {type}
              </button>
            ))}
         </div>
         <div className="flex gap-1 p-1 bg-white border border-slate-100 rounded-xl">
           <button 
             onClick={() => setViewMode('grid')}
             className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:bg-slate-50'}`}
           >
             <LayoutGrid size={18} />
           </button>
           <button 
             onClick={() => setViewMode('list')}
             className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:bg-slate-50'}`}
           >
             <ListIcon size={18} />
           </button>
         </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(variation => (
            <div 
              key={variation.id}
              className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                   variation.dayType === DayType.ARRIVAL ? 'bg-emerald-50 text-emerald-600' :
                   variation.dayType === DayType.TRANSFER ? 'bg-blue-50 text-blue-600' :
                   variation.dayType === DayType.DROP ? 'bg-rose-50 text-rose-600' :
                   variation.dayType === DayType.SIGHTSEEING ? 'bg-amber-50 text-amber-600' :
                   'bg-slate-50 text-slate-600'
                }`}>
                  {variation.dayType}
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => openEditModal(variation)}
                    className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-blue-500 transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(variation.id)}
                    className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <h3 className="text-base font-black text-slate-900 mb-2 leading-tight">{variation.title}</h3>
              
              <div className="flex flex-wrap gap-1.5 mb-4">
                 {variation.experienceTags.slice(0, 3).map(tag => (
                   <span key={tag} className="text-[8px] font-bold text-slate-400 uppercase tracking-widest border border-slate-100 px-2 py-0.5 rounded-md">
                     {tag}
                   </span>
                 ))}
                 {variation.experienceTags.length === 0 && (
                   <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest px-2 py-0.5">No tags</span>
                 )}
              </div>

              <p className="text-[11px] text-slate-500 line-clamp-3 mb-6 leading-relaxed flex-1">
                {variation.customerDescription}
              </p>

              <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                 <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-blue-500" />
                    {variation.destination}
                 </div>
                 <div className="flex items-center gap-1.5 text-right">
                    <Clock size={12} className="text-blue-500" />
                    <span className="truncate max-w-[80px]">{variation.travelTimeApprox || 'N/A'}</span>
                 </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
              <Search size={40} className="mb-4 opacity-20" />
              <p className="font-bold uppercase tracking-widest text-xs">No variations found</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Title & Tag</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Destination</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Time</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(variation => (
                <tr key={variation.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-black text-slate-900">{variation.title}</span>
                      <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">{variation.dayType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {variation.destination}
                  </td>
                  <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {variation.travelTimeApprox}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button 
                        onClick={() => openEditModal(variation)}
                        className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-blue-500 shadow-sm transition-all"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(variation.id)}
                        className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-500 shadow-sm transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Variation Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black text-slate-900">{editingVariation ? 'Edit Variation' : 'New Day Variation'}</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configure Itinerary Component</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white rounded-2xl text-slate-400 shadow-sm transition-all transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Basic Info */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Variation Title</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g., Arrival and Gurez-Habba View"
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Day Type</label>
                      <select 
                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none"
                        value={formData.dayType}
                        onChange={(e) => setFormData({...formData, dayType: e.target.value as DayType})}
                      >
                        {Object.values(DayType).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Route Type</label>
                      <select 
                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none"
                        value={formData.routeType}
                        onChange={(e) => setFormData({...formData, routeType: e.target.value as any})}
                      >
                        {['Direct', 'Via-Scenic', 'Local', 'Offbeat', 'Trek'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">From (Source)</label>
                      <input 
                        type="text" 
                        placeholder="e.g., Srinagar"
                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        value={formData.source || ''}
                        onChange={(e) => setFormData({...formData, source: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">To (Destination)</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g., Gurez"
                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        value={formData.destination || ''}
                        onChange={(e) => setFormData({...formData, destination: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Travel Time</label>
                      <input 
                        type="text" 
                        placeholder="e.g., 6 hours"
                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        value={formData.travelTimeApprox || ''}
                        onChange={(e) => setFormData({...formData, travelTimeApprox: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Stay Type</label>
                      <select 
                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none"
                        value={formData.stayType}
                        onChange={(e) => setFormData({...formData, stayType: e.target.value as any})}
                      >
                        {['Hotel', 'Houseboat', 'Camp', 'None'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Descriptions */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Client-Facing Description</label>
                    <textarea 
                      required
                      placeholder="High-quality description for the itinerary..."
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all min-h-[140px] leading-relaxed"
                      value={formData.customerDescription || ''}
                      onChange={(e) => setFormData({...formData, customerDescription: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Luxury Enhancement Notes</label>
                    <textarea 
                      placeholder="What makes this premium?"
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all min-h-[100px] leading-relaxed"
                      value={formData.luxuryEnhancement || ''}
                      onChange={(e) => setFormData({...formData, luxuryEnhancement: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Internal Operations Notes</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Check Razdan Pass status with local driver"
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      value={formData.internalNotes || ''}
                      onChange={(e) => setFormData({...formData, internalNotes: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Experience Tags (Comma separated)</label>
                    <input 
                      type="text" 
                      placeholder="Meadows, Adventure, Scenic..."
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                      value={formData.experienceTags?.join(', ') || ''}
                      onChange={(e) => setFormData({
                        ...formData, 
                        experienceTags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                      })}
                    />
                  </div>
                  <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Seasonal Relevance</label>
                     <div className="flex gap-2">
                        {['Summer', 'Winter', 'Spring', 'Autumn'].map(season => (
                          <button
                            key={season}
                            type="button"
                            onClick={() => {
                              const current = formData.seasonalRelevance || [];
                              const next = current.includes(season as any) 
                                ? current.filter(s => s !== season)
                                : [...current, season as any];
                              setFormData({...formData, seasonalRelevance: next});
                            }}
                            className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                              formData.seasonalRelevance?.includes(season as any)
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            {season}
                          </button>
                        ))}
                     </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="flex gap-4">
                  </div>
                  <div className="flex gap-4">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)}
                      className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-2"
                    >
                      <Save size={16} />
                      {editingVariation ? 'Update Variation' : 'Create Variation'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VariationsDatabase;
