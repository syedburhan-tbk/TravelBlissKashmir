
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, MapPin, Clock, Copy, ArrowRight, Eye, Trash2, Edit3 } from 'lucide-react';
import { MOCK_TEMPLATES } from '../constants';
import { TripTemplate } from '../constants';

const Templates: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [allTemplates, setAllTemplates] = useState<TripTemplate[]>([]);

  useEffect(() => {
    const savedTemplatesRaw = localStorage.getItem('et_templates');
    const savedTemplates: TripTemplate[] = savedTemplatesRaw ? JSON.parse(savedTemplatesRaw) : [];
    setAllTemplates([...MOCK_TEMPLATES, ...savedTemplates]);
  }, []);

  const filteredTemplates = allTemplates.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (MOCK_TEMPLATES.find(t => t.id === id)) {
      alert("System templates cannot be deleted directly. You can edit them to save a custom copy.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this custom template?")) {
      const savedTemplatesRaw = localStorage.getItem('et_templates');
      const savedTemplates: TripTemplate[] = savedTemplatesRaw ? JSON.parse(savedTemplatesRaw) : [];
      const updated = savedTemplates.filter(t => t.id !== id);
      localStorage.setItem('et_templates', JSON.stringify(updated));
      setAllTemplates([...MOCK_TEMPLATES, ...updated]);
    }
  };

  const handleUseTemplate = (id: string) => {
    navigate(`/trips/new?templateId=${id}`);
  };

  const handleEditTemplate = (id: string) => {
    navigate(`/templates/${id}/edit`);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Itinerary Templates</h1>
          <p className="text-slate-500">Standardized packages for quick conversion.</p>
        </div>
        <button 
          onClick={() => navigate('/trips/new')}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
        >
          <Plus size={18} /> Create Template
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search templates by name..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <div key={template.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden group hover:shadow-xl transition-all flex flex-col">
            <div className="h-40 bg-slate-100 relative overflow-hidden">
              <img 
                src={`https://picsum.photos/seed/${template.id}/600/400`} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                alt={template.name} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <span className="text-[10px] font-black uppercase tracking-widest bg-blue-600/80 backdrop-blur px-2 py-1 rounded">
                  {template.tripType}
                </span>
                <h3 className="font-bold text-lg mt-1">{template.name}</h3>
              </div>
            </div>
            
            <div className="p-6 flex-1 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium">
                  <Clock size={16} />
                  {template.duration}
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium">
                  <MapPin size={16} />
                  Kashmir
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2">Itinerary Preview</p>
                <div className="space-y-2">
                  {template.itinerary.slice(0, 2).map((day, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      Day {day.dayNumber}: {day.title}
                    </div>
                  ))}
                  {template.itinerary.length > 2 && (
                    <div className="text-xs font-bold text-slate-400 pl-3">+{template.itinerary.length - 2} more days...</div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex gap-2">
                <button 
                  onClick={() => handleEditTemplate(template.id)}
                  className="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-white transition-all flex items-center gap-1 text-xs font-bold"
                  title="Edit Template"
                >
                  <Edit3 size={18} />
                  Edit
                </button>
                {!MOCK_TEMPLATES.find(t => t.id === template.id) && (
                  <button 
                    onClick={(e) => handleDeleteTemplate(template.id, e)}
                    className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-white transition-all"
                    title="Delete Custom Template"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleUseTemplate(template.id)}
                  className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all"
                >
                  Use This
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Templates;
