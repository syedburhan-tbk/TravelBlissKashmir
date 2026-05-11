
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Sparkles, Trash2, Edit2, Check, X, IndianRupee, Users } from 'lucide-react';
import { ADD_ONS } from '../constants';
import { AddOn } from '../types';

import { safeLocalStorage, STORAGE_KEYS } from '../utils/storage';

const AddOns: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [customAddOns, setCustomAddOns] = useState<AddOn[]>(() => {
    try {
      const saved = safeLocalStorage.getItem(STORAGE_KEYS.ADD_ONS);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse custom add-ons:', e);
      return [];
    }
  });
  
  const [formData, setFormData] = useState<Partial<AddOn>>({
    name: '',
    cost: 0,
    isPerPax: false,
    description: ''
  });


  const allAddOns = useMemo(() => {
    const customIds = new Set(customAddOns.map(a => a.id));
    return [...ADD_ONS.filter(a => !customIds.has(a.id)), ...customAddOns];
  }, [customAddOns]);

  const filteredAddOns = useMemo(() => {
    return allAddOns.filter(a => 
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allAddOns, searchTerm]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', cost: 0, isPerPax: false, description: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (addon: AddOn) => {
    setEditingId(addon.id);
    setFormData({ ...addon });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newAddOn: AddOn = {
      id: editingId || `ao-custom-${Date.now()}`,
      name: formData.name || 'New Add-on',
      cost: formData.cost || 0,
      isPerPax: formData.isPerPax || false,
      description: formData.description || ''
    };

    let updated: AddOn[];
    if (editingId) {
      const index = customAddOns.findIndex(a => a.id === editingId);
      if (index > -1) {
        updated = [...customAddOns];
        updated[index] = newAddOn;
      } else updated = [...customAddOns, newAddOn];
    } else updated = [...customAddOns, newAddOn];

    setCustomAddOns(updated);
    safeLocalStorage.setItem(STORAGE_KEYS.ADD_ONS, JSON.stringify(updated));
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Remove this premium add-on?")) {
      const updated = customAddOns.filter(a => a.id !== id);
      setCustomAddOns(updated);
      safeLocalStorage.setItem(STORAGE_KEYS.ADD_ONS, JSON.stringify(updated));
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Premium Add-ons</h1>
          <p className="text-slate-500 text-sm">Manage special experiences and upsell items for client itineraries.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg transition-all"
        >
          <Plus size={18} /> New Add-on
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search add-ons..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAddOns.map(addon => (
          <div key={addon.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all group flex flex-col h-full shadow-sm relative p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                <Sparkles size={24} />
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEditModal(addon)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600"><Edit2 size={16}/></button>
                <button onClick={() => handleDelete(addon.id)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
              </div>
            </div>
            
            <h3 className="font-bold text-slate-900 text-lg mb-2">{addon.name}</h3>
            <p className="text-slate-500 text-xs mb-4 line-clamp-2 leading-relaxed">{addon.description || 'No description provided.'}</p>
            
            <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase text-slate-400">{addon.isPerPax ? 'Per Person' : 'Fixed Cost'}</span>
                <div className="text-lg font-black text-slate-900 flex items-center gap-0.5">
                  <IndianRupee size={16} />
                  {addon.cost.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">{editingId ? 'Edit Add-on' : 'Create New Add-on'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Name</label>
                <input required type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cost (INR)</label>
                  <input required type="number" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900" value={formData.cost || 0} onChange={e => setFormData({...formData, cost: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pricing Model</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900" value={formData.isPerPax ? 'true' : 'false'} onChange={e => setFormData({...formData, isPerPax: e.target.value === 'true'})}>
                    <option value="false">Fixed Price</option>
                    <option value="true">Per Person</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Description</label>
                <textarea rows={3} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm text-slate-900" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-4 bg-blue-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                <Check size={18} /> Save Add-on
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddOns;
