
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  Car, 
  Users, 
  Plus, 
  IndianRupee, 
  X, 
  Check, 
  Edit2, 
  Eye, 
  Phone, 
  Info, 
  Calendar, 
  Zap, 
  Wind, 
  Droplets,
  Trash2,
  ArrowRight,
  Paperclip,
  Image as ImageIcon,
  Camera
} from 'lucide-react';
import { VEHICLES } from '../constants';
import { Vehicle } from '../types';

import { safeLocalStorage, STORAGE_KEYS } from '../utils/storage';

const Vehicles: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [customVehicles, setCustomVehicles] = useState<Vehicle[]>(() => {
    try {
      const saved = safeLocalStorage.getItem(STORAGE_KEYS.VEHICLES);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse custom vehicles:', e);
      return [];
    }
  });

  const allVehicles = useMemo(() => {
    const customIds = new Set(customVehicles.map(v => v.id));
    return [...VEHICLES.filter(v => !customIds.has(v.id)), ...customVehicles];
  }, [customVehicles]);

  const filteredVehicles = useMemo(() => {
    return allVehicles.filter(v => {
      const matchesSearch = v.type.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (v.brand?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCapacity = capacityFilter === 'All' || v.capacity >= parseInt(capacityFilter);
      return matchesSearch && matchesCapacity;
    });
  }, [allVehicles, searchTerm, capacityFilter]);

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
    setEditingVehicleId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicleId(vehicle.id);
    setFormData({ ...vehicle });
    setIsModalOpen(true);
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    const vehicleData: Vehicle = {
      ...formData,
      id: editingVehicleId || `v-custom-${Date.now()}`,
      type: formData.type || 'Standard',
      capacity: formData.capacity || 1,
      ratePerDay: formData.ratePerDay || 0,
      isAC: formData.isAC ?? true,
    } as Vehicle;

    let updated: Vehicle[];
    if (editingVehicleId) {
      const index = customVehicles.findIndex(v => v.id === editingVehicleId);
      if (index > -1) {
        updated = [...customVehicles];
        updated[index] = vehicleData;
      } else {
        updated = [...customVehicles, vehicleData];
      }
    } else {
      updated = [...customVehicles, vehicleData];
    }

    setCustomVehicles(updated);
    safeLocalStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(updated));
    setIsModalOpen(false);
  };

  const handleDeleteVehicle = (id: string) => {
    if (window.confirm("Delete this vehicle from your inventory?")) {
      const updated = customVehicles.filter(v => v.id !== id);
      setCustomVehicles(updated);
      safeLocalStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(updated));
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vehicle Fleet</h1>
          <p className="text-slate-500 text-sm">Manage transport inventory, driver details, and seasonal rates.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95"
        >
          <Plus size={18} /> Add Vehicle
        </button>
      </div>

      {/* Fleet Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-[28px] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
            <Car size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Fleet Count</p>
            <p className="text-xl font-black text-slate-900">{allVehicles.length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-[28px] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600">
            <Zap size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Luxury Segment</p>
            <p className="text-xl font-black text-slate-900">{allVehicles.filter(v => v.isAC).length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-[28px] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-amber-50 p-3 rounded-2xl text-amber-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">High Capacity</p>
            <p className="text-xl font-black text-slate-900">{allVehicles.filter(v => v.capacity >= 7).length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-[28px] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
            <IndianRupee size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Average Rate</p>
            <p className="text-xl font-black text-slate-900">
              ₹{(allVehicles.reduce((acc, v) => acc + v.ratePerDay, 0) / (allVehicles.length || 1)).toFixed(0)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by brand or model..." 
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-1">
          <Users size={16} className="text-slate-400" />
          <select 
            className="bg-transparent py-2.5 text-xs font-black uppercase text-slate-700 outline-none tracking-widest"
            value={capacityFilter}
            onChange={(e) => setCapacityFilter(e.target.value)}
          >
            <option value="All">All Capacities</option>
            <option value="4">4+ Seater</option>
            <option value="7">7+ Seater</option>
            <option value="12">12+ Seater</option>
          </select>
        </div>
      </div>

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredVehicles.map(v => (
          <div key={v.id} className="bg-white border border-slate-200 rounded-[36px] overflow-hidden hover:shadow-2xl hover:border-blue-100 transition-all group flex flex-col shadow-sm">
            <div className="relative h-44 bg-slate-100 overflow-hidden">
              <img 
                src={v.image || `https://picsum.photos/seed/${v.id}/400/300`} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                alt={v.type}
              />
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <span className={`flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-700 shadow-sm`}>
                  {v.isAC ? <Wind size={12} className="text-blue-500" /> : <Droplets size={12} className="text-amber-500" />}
                  {v.isAC ? 'Climate Control' : 'Standard'}
                </span>
              </div>
              <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <button 
                  onClick={() => setViewingVehicle(v)}
                  className="p-2.5 bg-white/90 backdrop-blur rounded-2xl text-slate-400 hover:text-blue-600 hover:bg-white transition-all shadow-sm"
                >
                  <Eye size={16} />
                </button>
                <button 
                  onClick={() => openEditModal(v)}
                  className="p-2.5 bg-white/90 backdrop-blur rounded-2xl text-slate-400 hover:text-blue-600 hover:bg-white transition-all shadow-sm"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <div className="mb-6">
                <h3 className="font-black text-slate-800 text-lg group-hover:text-blue-600 transition-colors leading-tight mb-2">
                  {v.brand} {v.type}
                </h3>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <Users size={14} />
                    {v.capacity} PAX
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-100" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {v.fuelType || 'Diesel'}
                  </span>
                </div>
              </div>

              <div className="mt-auto pt-5 border-t border-slate-50 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] mb-1">Standard Rate</p>
                  <p className="text-2xl font-black text-slate-900 flex items-center gap-1">
                    <IndianRupee size={20} className="text-blue-600" />
                    {v.ratePerDay.toLocaleString()}
                  </p>
                </div>
                <button 
                  onClick={() => setViewingVehicle(v)}
                  className="p-3 bg-slate-900 rounded-2xl text-white hover:bg-blue-600 transition-all shadow-lg"
                >
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View Modal */}
      {viewingVehicle && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[48px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="h-64 relative bg-slate-900">
              <img 
                src={viewingVehicle.image || `https://picsum.photos/seed/${viewingVehicle.id}/800/400`} 
                className="w-full h-full object-cover opacity-60" 
                alt={viewingVehicle.type}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
              <button 
                onClick={() => setViewingVehicle(null)}
                className="absolute top-8 right-8 p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all z-10"
              >
                <X size={20} />
              </button>
              <div className="absolute bottom-10 left-10">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-4 py-1.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-xl">
                    {viewingVehicle.isAC ? 'Climate Control' : 'Standard Class'}
                  </span>
                  <span className="text-blue-300 text-xs font-black uppercase tracking-widest">{viewingVehicle.fuelType} Engine</span>
                </div>
                <h2 className="text-5xl font-black text-white leading-none tracking-tighter">{viewingVehicle.brand} {viewingVehicle.type}</h2>
              </div>
            </div>

            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-5 flex items-center gap-2">
                    <div className="w-8 h-px bg-slate-200"/> Vehicle Specifications
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                      <span className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Max Load</span>
                      <span className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <Users size={20} className="text-blue-600" />
                        {viewingVehicle.capacity} Seats
                      </span>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                      <span className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Standard Daily</span>
                      <span className="text-xl font-black text-slate-900 flex items-center gap-1">
                        <IndianRupee size={20} className="text-blue-600" />
                        {viewingVehicle.ratePerDay.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {viewingVehicle.internalNotes && (
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                      <div className="w-8 h-px bg-slate-200"/> Operational Tips
                    </h4>
                    <div className="bg-blue-900 p-6 rounded-[32px] text-sm text-blue-100 leading-relaxed italic shadow-xl">
                      "{viewingVehicle.internalNotes}"
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-8 bg-slate-50/50 p-8 rounded-[40px] border border-slate-100">
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Service Provider</p>
                    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                      <div className="bg-blue-600 p-3 rounded-xl text-white shadow-lg">
                        <Phone size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{viewingVehicle.providerName || 'In-House Fleet'}</p>
                        <p className="text-xs text-slate-500 font-bold">{viewingVehicle.providerContact || 'Verified Operator'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Contract Validity</p>
                    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                      <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
                        <Calendar size={18} />
                      </div>
                      <span className="text-sm font-black text-slate-800">
                        {viewingVehicle.rateValidityDate ? new Date(viewingVehicle.rateValidityDate).toLocaleDateString('en-IN', {month: 'long', year: 'numeric'}) : 'Annual Contract'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex gap-4">
                  <button 
                    onClick={() => { setViewingVehicle(null); openEditModal(viewingVehicle); }}
                    className="flex-1 py-4 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-600 transition-all shadow-xl active:scale-95"
                  >
                    Edit Fleet Item
                  </button>
                  <button 
                    onClick={() => { handleDeleteVehicle(viewingVehicle.id); setViewingVehicle(null); }}
                    className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[44px] shadow-2xl w-full max-w-3xl my-8 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-white p-8 border-b border-slate-50 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-xl shadow-blue-100">
                  {editingVehicleId ? <Edit2 size={24} /> : <Car size={24} />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{editingVehicleId ? 'Modify Fleet Inventory' : 'Register New Vehicle'}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Operational Database Entry</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 hover:bg-slate-50 rounded-full transition-colors text-slate-300 hover:text-slate-900"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="p-10 space-y-12">
              {/* Image Picker Section */}
              <div className="space-y-6">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600 border-b border-blue-50 pb-3 flex items-center gap-2">
                  <Camera size={14} /> Fleet Visuals & Branding
                </h4>
                <div className="flex flex-col items-center gap-6">
                  <div className="w-full h-64 rounded-[40px] bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden relative group transition-all hover:border-blue-400 hover:bg-blue-50/30">
                    {formData.image ? (
                      <>
                        <img src={formData.image} className="w-full h-full object-cover" alt="Cab Preview" />
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
                          <p className="text-sm font-black text-slate-600 uppercase tracking-widest">Select Cab Image</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Supports High-res Photos</p>
                        </div>
                      </button>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={imageInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                  />
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600 border-b border-blue-50 pb-3 flex items-center gap-2">
                  <Info size={14} /> Technical Specifications
                </h4>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Model / Type</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Innova Crysta Zx"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      value={formData.type || ''}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Brand</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Toyota"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      value={formData.brand || ''}
                      onChange={e => setFormData({...formData, brand: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Passenger Capacity</label>
                    <input 
                      required
                      type="number" 
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900 outline-none"
                      value={formData.capacity || 0}
                      onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Net Rate / Day (INR)</label>
                    <input 
                      required
                      type="number" 
                      className="w-full px-5 py-3.5 bg-blue-50 border border-blue-100 rounded-2xl text-sm font-black text-blue-900 outline-none"
                      value={formData.ratePerDay || 0}
                      onChange={e => setFormData({...formData, ratePerDay: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600 border-b border-blue-50 pb-3 flex items-center gap-2">
                   <Zap size={14} /> Operations & Logistics
                </h4>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ownership</label>
                    <input 
                      type="text" 
                      placeholder="e.g. In-House / Vendor Name"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none"
                      value={formData.providerName || ''}
                      onChange={e => setFormData({...formData, providerName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Provider Contact</label>
                    <input 
                      type="text" 
                      placeholder="+91..."
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none"
                      value={formData.providerContact || ''}
                      onChange={e => setFormData({...formData, providerContact: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Internal Fleet Notes</label>
                    <textarea 
                      rows={3}
                      placeholder="e.g. Brand new 2024 model, luggage carrier included."
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-medium text-slate-900 outline-none resize-none transition-all focus:ring-2 focus:ring-blue-500"
                      value={formData.internalNotes || ''}
                      onChange={e => setFormData({...formData, internalNotes: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-8 flex gap-5 border-t border-slate-50">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 text-slate-500 font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-blue-600 text-white font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-2xl shadow-blue-900/10 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Check size={18} />
                  {editingVehicleId ? 'Update Inventory' : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;
