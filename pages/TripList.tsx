
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Calendar, User, ArrowRight, X, Layers } from 'lucide-react';
import { MOCK_TRIPS } from '../constants';
import { Trip, TripStatus, TripType } from '../types';

const TripList: React.FC = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [tripTypeFilter, setTripTypeFilter] = useState('All');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [salespersonFilter, setSalespersonFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const savedTrips = localStorage.getItem('et_trips');
    if (savedTrips) {
      setTrips(JSON.parse(savedTrips));
    } else {
      setTrips(MOCK_TRIPS);
    }
  }, []);

  const salespeople = Array.from(new Set(trips.map(t => t.assignedSalesperson)));

  const filteredTrips = trips.filter(trip => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      trip.client.name.toLowerCase().includes(searchLower) || 
      trip.tripName.toLowerCase().includes(searchLower) ||
      trip.client.phone.includes(searchTerm) ||
      trip.client.email.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === 'All' || trip.status === statusFilter;
    const matchesType = tripTypeFilter === 'All' || trip.tripType === tripTypeFilter;
    const matchesSales = salespersonFilter === 'All' || trip.assignedSalesperson === salespersonFilter;
    const matchesDate = !startDateFilter || trip.startDate >= startDateFilter;

    return matchesSearch && matchesStatus && matchesType && matchesSales && matchesDate;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setTripTypeFilter('All');
    setStartDateFilter('');
    setSalespersonFilter('All');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by client, phone, email, or trip name..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg font-medium transition-all ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-700'}`}
            >
              <Filter size={18} />
              {showFilters ? 'Hide Filters' : 'Advanced Filters'}
            </button>
            <button 
              onClick={() => navigate('/trips/new')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-sm"
            >
              <Plus size={18} />
              New Trip
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm text-slate-900"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                {Object.values(TripStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Trip Type</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm text-slate-900"
                value={tripTypeFilter}
                onChange={(e) => setTripTypeFilter(e.target.value)}
              >
                <option value="All">All Types</option>
                {Object.values(TripType).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Salesperson</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm text-slate-900"
                value={salespersonFilter}
                onChange={(e) => setSalespersonFilter(e.target.value)}
              >
                <option value="All">All Salespeople</option>
                {salespeople.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Starts After</label>
              <input 
                type="date" 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm text-slate-900"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
              />
            </div>
            <div className="lg:col-span-4 flex justify-end">
              <button onClick={resetFilters} className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-1">
                <X size={14} /> Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTrips.map(trip => (
          <div 
            key={trip.id} 
            className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer flex flex-col group"
            onClick={() => navigate(`/trips/${trip.id}`)}
          >
            <div className="p-5 flex-1">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                  trip.tripType === TripType.HONEYMOON ? 'bg-pink-100 text-pink-700' :
                  trip.tripType === TripType.FAMILY ? 'bg-emerald-100 text-emerald-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {trip.tripType}
                </span>
                <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                  trip.status === TripStatus.BOOKED ? 'bg-green-100 text-green-700' :
                  trip.status === TripStatus.QUOTED ? 'bg-blue-100 text-blue-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {trip.status}
                </span>
              </div>
              
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">
                  {trip.tripName}
                </h3>
                {(trip.versions || []).length > 0 && (
                   <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter" title="Itinerary Versions">
                      <Layers size={10} />
                      {(trip.versions || []).length}
                   </div>
                )}
              </div>
              <p className="text-slate-500 text-sm mb-4">Client: {trip.client.name}</p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-600">
                  <Calendar size={16} className="text-slate-400" />
                  <span className="text-sm font-medium">{trip.startDate || 'No date'} - {trip.endDate || 'No date'}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <User size={16} className="text-slate-400" />
                  <span className="text-sm font-medium">{trip.pax} Passengers • {trip.budgetRange}</span>
                </div>
              </div>
            </div>
            
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-600" title={trip.assignedSalesperson}>
                  {trip.assignedSalesperson.split(' ').map(n => n[0]).join('')}
                </div>
              </div>
              <div className="flex items-center gap-1 text-blue-600 font-bold text-sm">
                Open Builder
                <ArrowRight size={14} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTrips.length === 0 && (
        <div className="bg-white p-20 rounded-xl border-2 border-dashed border-slate-200 text-center">
          <p className="text-slate-400 font-bold">No trips found matching your criteria.</p>
          <button onClick={resetFilters} className="mt-4 text-blue-600 font-bold hover:underline">Reset Filters</button>
        </div>
      )}
    </div>
  );
};

export default TripList;
