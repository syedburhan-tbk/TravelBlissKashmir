
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Save, 
  Sparkles,
  ArrowLeft,
  CalendarDays,
  Hotel as HotelIcon,
  Car as CarIcon,
  Clock,
  Settings,
  Briefcase,
  Layers,
  Filter,
  MapPinned,
  ShieldCheck,
  XCircle
} from 'lucide-react';
import { MOCK_TEMPLATES, HOTELS, VEHICLES, ACTIVITIES, TripTemplate, DEFAULT_INCLUSIONS, DEFAULT_EXCLUSIONS } from '../constants';
import { ItineraryDay, TripType, HotelCategory, Hotel } from '../types';
import { generateDayDescription, suggestNextDayTitle } from '../services/geminiService';

const TemplateBuilder: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<TripTemplate | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [hotelCategoryFilter, setHotelCategoryFilter] = useState<string>('All');
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');

  // Combined master hotels (mock + local)
  const masterHotels = useMemo(() => {
    const saved = localStorage.getItem('et_hotels');
    const custom = saved ? JSON.parse(saved) : [];
    const customIds = new Set(custom.map((h: Hotel) => h.id));
    return [...HOTELS.filter(h => !customIds.has(h.id)), ...custom];
  }, []);

  useEffect(() => {
    const savedTemplatesRaw = localStorage.getItem('et_templates');
    const savedTemplates = savedTemplatesRaw ? JSON.parse(savedTemplatesRaw) : [];
    const merged = [...MOCK_TEMPLATES, ...savedTemplates];
    const found = merged.find(t => t.id === id);
    if (found) setTemplate(JSON.parse(JSON.stringify(found)));
    else setTemplate({ 
      id: `temp-${Date.now()}`, 
      name: 'New Custom Template', 
      duration: '1 Day', 
      tripType: TripType.FAMILY, 
      baseMargin: 15, 
      itinerary: [],
      inclusions: [...DEFAULT_INCLUSIONS],
      exclusions: [...DEFAULT_EXCLUSIONS]
    });
  }, [id]);

  useEffect(() => {
    if (template?.itinerary[activeDayIndex]?.hotelId) {
      const currentHotel = masterHotels.find(h => h.id === template.itinerary[activeDayIndex].hotelId);
      if (currentHotel) setHotelCategoryFilter(currentHotel.category);
      else setHotelCategoryFilter('All');
    } else setHotelCategoryFilter('All');
  }, [activeDayIndex, template?.itinerary, masterHotels]);

  const filteredHotels = useMemo(() => {
    if (hotelCategoryFilter === 'All') return masterHotels;
    return masterHotels.filter(h => h.category === hotelCategoryFilter);
  }, [hotelCategoryFilter, masterHotels]);

  if (!template) return <div className="p-10 text-center text-slate-400 font-bold">Loading Template...</div>;

  const handleSave = () => {
    if (!template) return;
    const savedTemplatesRaw = localStorage.getItem('et_templates');
    let savedTemplates: TripTemplate[] = savedTemplatesRaw ? JSON.parse(savedTemplatesRaw) : [];
    const index = savedTemplates.findIndex(t => t.id === template.id);
    if (index > -1) savedTemplates[index] = template;
    else savedTemplates.push(template);
    localStorage.setItem('et_templates', JSON.stringify(savedTemplates));
    alert("Template updated successfully!");
    navigate('/templates');
  };

  const updateDay = (index: number, updates: Partial<ItineraryDay>) => {
    const newItinerary = [...template.itinerary];
    newItinerary[index] = { ...newItinerary[index], ...updates };
    setTemplate({ ...template, itinerary: newItinerary });
  };

  const remapItinerary = (itinerary: ItineraryDay[]) => {
    return itinerary.map((day, i) => ({
      ...day,
      dayNumber: i + 1
    }));
  };

  const updateDurationString = (dayCount: number) => {
    if (dayCount <= 0) return '0 Days';
    if (dayCount === 1) return '1 Day';
    return `${dayCount} Days, ${dayCount - 1} Nights`;
  };

  const removeDay = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!template || template.itinerary.length <= 1) return;

    if (!window.confirm("Delete this step from the template?")) return;

    const filtered = template.itinerary.filter((_, i) => i !== index);
    const remapped = remapItinerary(filtered);

    if (index === activeDayIndex) {
      setActiveDayIndex(Math.min(index, remapped.length - 1));
    } else if (index < activeDayIndex) {
      setActiveDayIndex(prev => prev - 1);
    }

    setTemplate({
      ...template,
      itinerary: remapped,
      duration: updateDurationString(remapped.length)
    });
  };

  const handleAddDay = async () => {
    const nextDayNum = template.itinerary.length + 1;
    const lastDay = template.itinerary[template.itinerary.length - 1];
    const newDay: ItineraryDay = { id: `d-${Date.now()}`, dayNumber: nextDayNum, title: `Day ${nextDayNum}: Suggesting...`, hotelId: lastDay?.hotelId || '', vehicleId: lastDay?.vehicleId || '', activityIds: [], clientNotes: '', internalNotes: '' };
    const newItinerary = [...template.itinerary, newDay];
    setTemplate({ ...template, itinerary: newItinerary, duration: updateDurationString(newItinerary.length) });
    setActiveDayIndex(newItinerary.length - 1);
    const suggestedTitle = await suggestNextDayTitle(lastDay?.title || 'Start of Trip', template.tripType, nextDayNum);
    updateDay(newItinerary.length - 1, { title: suggestedTitle });
  };

  const addInclusion = () => {
    if (!template || !newInclusion.trim()) return;
    setTemplate({ ...template, inclusions: [...(template.inclusions || []), newInclusion.trim()] });
    setNewInclusion('');
  };

  const removeInclusion = (index: number) => {
    const updated = [...template.inclusions];
    updated.splice(index, 1);
    setTemplate({ ...template, inclusions: updated });
  };

  const addExclusion = () => {
    if (!template || !newExclusion.trim()) return;
    setTemplate({ ...template, exclusions: [...(template.exclusions || []), newExclusion.trim()] });
    setNewExclusion('');
  };

  const removeExclusion = (index: number) => {
    const updated = [...template.exclusions];
    updated.splice(index, 1);
    setTemplate({ ...template, exclusions: updated });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/templates')} className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200"><ArrowLeft size={20} className="text-slate-600" /></button>
          <div><h1 className="text-2xl font-bold text-slate-900">Template Builder</h1><p className="text-slate-500 text-sm">Design reusable itineraries.</p></div>
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"><Save size={18} />Save Template</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 overflow-hidden">
        <div className="lg:col-span-1 space-y-6 flex flex-col overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm text-slate-900">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-widest"><Settings size={16} className="text-blue-600" />General Info</h3>
            <div className="space-y-4">
              <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Template Name</label><input type="text" value={template.name} onChange={(e) => setTemplate({ ...template, name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" /></div>
              <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">Trip Type</label><select value={template.tripType} onChange={(e) => setTemplate({ ...template, tripType: e.target.value as TripType })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold">{Object.values(TripType).map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm text-slate-900">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-widest"><ShieldCheck size={16} className="text-emerald-600" />Default Inclusions</h3>
            <div className="space-y-2">
              {template.inclusions.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 group">
                  <div className="flex-1 text-[10px] font-bold text-slate-600 bg-emerald-50 p-2 rounded-lg line-clamp-2">{item}</div>
                  <button onClick={() => removeInclusion(idx)} className="text-slate-300 hover:text-rose-500"><Trash2 size={12}/></button>
                </div>
              ))}
              <div className="flex gap-1 mt-2">
                <input 
                  type="text" 
                  placeholder="New..." 
                  value={newInclusion}
                  onChange={(e) => setNewInclusion(e.target.value)}
                  className="flex-1 text-[10px] p-2 border border-slate-200 rounded-lg outline-none"
                />
                <button onClick={addInclusion} className="p-2 bg-blue-600 text-white rounded-lg"><Plus size={14}/></button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm text-slate-900">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-widest"><XCircle size={16} className="text-rose-600" />Default Exclusions</h3>
            <div className="space-y-2">
              {template.exclusions.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 group">
                  <div className="flex-1 text-[10px] font-bold text-slate-600 bg-rose-50 p-2 rounded-lg line-clamp-2">{item}</div>
                  <button onClick={() => removeExclusion(idx)} className="text-slate-300 hover:text-rose-500"><Trash2 size={12}/></button>
                </div>
              ))}
              <div className="flex gap-1 mt-2">
                <input 
                  type="text" 
                  placeholder="New..." 
                  value={newExclusion}
                  onChange={(e) => setNewExclusion(e.target.value)}
                  className="flex-1 text-[10px] p-2 border border-slate-200 rounded-lg outline-none"
                />
                <button onClick={addExclusion} className="p-2 bg-blue-600 text-white rounded-lg"><Plus size={14}/></button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl flex-1 flex flex-col overflow-hidden shadow-sm min-h-[200px]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between"><h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><Layers size={16} className="text-blue-600" />Itinerary Steps</h3></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {template.itinerary.map((day, idx) => (
                <div key={day.id} className="relative group">
                  <button onClick={() => setActiveDayIndex(idx)} className={`w-full text-left p-3 rounded-xl border transition-all pr-12 ${activeDayIndex === idx ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-slate-100 hover:border-slate-300'}`}>
                    <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-black uppercase text-blue-600">Day {day.dayNumber}</span></div>
                    <h4 className={`font-semibold text-sm truncate ${activeDayIndex === idx ? 'text-blue-900' : 'text-slate-700'}`}>{day.title || 'New Step'}</h4>
                  </button>
                  {template.itinerary.length > 1 && (
                    <button 
                      onClick={(e) => removeDay(idx, e)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                      title="Remove Step"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={handleAddDay} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold hover:border-blue-400 hover:text-blue-500 transition-all flex items-center justify-center gap-2 text-sm"><Plus size={18} />Add Step</button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 overflow-y-auto pr-2 pb-6">
          {template.itinerary[activeDayIndex] ? (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-200 text-slate-900">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step Title</label>
                <input 
                  type="text" 
                  value={template.itinerary[activeDayIndex].title} 
                  onChange={(e) => updateDay(activeDayIndex, { title: e.target.value })} 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none placeholder:text-slate-300 shadow-inner"
                  placeholder="Step title..." 
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex flex-col gap-3">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><HotelIcon size={16} className="text-blue-500" />Standard Stay</label>
                    <select value={template.itinerary[activeDayIndex].hotelId} onChange={(e) => updateDay(activeDayIndex, { hotelId: e.target.value })} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 shadow-sm">
                      <option value="">Select Hotel</option>
                      {masterHotels.map(h => <option key={h.id} value={h.id}>{h.name} ({h.location})</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><CarIcon size={16} className="text-blue-500" />Standard Vehicle</label>
                  <select value={template.itinerary[activeDayIndex].vehicleId} onChange={(e) => updateDay(activeDayIndex, { vehicleId: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900">
                    <option value="">Select Suggested Vehicle</option>
                    {VEHICLES.map(v => <option key={v.id} value={v.id}>{v.type}</option>)}
                  </select>
                </div>
              </div>
              <textarea rows={6} value={template.itinerary[activeDayIndex].clientNotes} onChange={(e) => updateDay(activeDayIndex, { clientNotes: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm leading-relaxed text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Describe what the guest will experience..." />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 bg-white border-2 border-dashed border-slate-200 rounded-2xl text-slate-400"><Layers size={64} className="mb-4 opacity-10" /><p className="font-bold">Add steps to this template.</p></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateBuilder;
