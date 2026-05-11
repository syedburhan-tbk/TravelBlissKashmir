
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Car, 
  Hotel, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Phone, 
  MessageSquare,
  ChevronRight,
  PlaneLanding,
  PlaneTakeoff,
  RefreshCcw,
  Trash2,
  Edit2,
  Zap,
  Info,
  Calendar,
  Compass,
  X,
  User,
  ShieldCheck,
  Map as MapIcon,
  IndianRupee,
  Utensils,
  Moon,
  ExternalLink
} from 'lucide-react';
import { MOCK_TRIPS, HOTELS, VEHICLES, ACTIVITIES } from '../constants';
import { Trip, TripStatus, ItineraryDay, OpsAlert } from '../types';
import { tripService } from '../services/tripService';
import { useStorageSync } from '../hooks/useStorageSync';
import { safeLocalStorage, STORAGE_KEYS } from '../utils/storage';

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-5">
    <div className={`${color} p-4 rounded-2xl text-white shadow-lg`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
  </div>
);

const OngoingTrips: React.FC = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>(() => {
    const savedTrips = safeLocalStorage.getItem(STORAGE_KEYS.TRIPS);
    return savedTrips ? JSON.parse(savedTrips) : MOCK_TRIPS;
  });

  // Sync trips across tabs
  useStorageSync(STORAGE_KEYS.TRIPS, trips, setTrips, MOCK_TRIPS);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewingTrip, setViewingTrip] = useState<Trip | null>(null);

  const deleteTrip = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('OngoingTrips: Attempting to delete trip with ID:', id);
    if (window.confirm("Permanently delete this trip from your records? This action cannot be undone.")) {
      console.log('OngoingTrips: User confirmed deletion for ID:', id);
      
      // 1. Delete from Cloud
      await tripService.deleteTrip(id);
      
      // 2. Update Local State & Storage
      setTrips(prev => {
        const updated = prev.filter(t => t.id !== id);
        console.log('OngoingTrips: New trip count:', updated.length);
        const success = safeLocalStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(updated));
        if (success) {
          console.log('OngoingTrips: Successfully updated storage');
        } else {
          console.error('OngoingTrips: Failed to update storage');
          alert('Warning: Could not save changes to local storage. Your storage might be full.');
        }
        return updated;
      });
    }
  };

  useEffect(() => {
    // Initialized via useState initializer
  }, []);

  const ongoingTrips = useMemo(() => {
    return trips.filter(trip => {
      if (trip.status !== TripStatus.BOOKED) return false;
      return trip.startDate <= selectedDate && trip.endDate >= selectedDate;
    });
  }, [trips, selectedDate]);

  const getDayInfo = (trip: Trip, dateStr: string) => {
    const start = new Date(trip.startDate);
    const targetDate = new Date(dateStr);
    const diffTime = targetDate.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    const todayItinerary = trip.itinerary.find(d => d.dayNumber === diffDays);
    const yesterdayItinerary = trip.itinerary.find(d => d.dayNumber === diffDays - 1);
    
    return {
      currentDay: diffDays,
      totalDays: trip.itinerary.length,
      todayPlan: todayItinerary,
      yesterdayPlan: yesterdayItinerary
    };
  };

  const opsAlerts = useMemo(() => {
    const alerts: OpsAlert[] = [];
    ongoingTrips.forEach(trip => {
      const { currentDay, totalDays, todayPlan, yesterdayPlan } = getDayInfo(trip, selectedDate);
      
      if (currentDay === 1) {
        alerts.push({
          id: `arr-${trip.id}`,
          tripId: trip.id,
          clientName: trip.client.name,
          type: 'ARRIVAL',
          message: `Arrival today in ${trip.startLocation}. Coordinate pickup.`,
          severity: 'CRITICAL',
          timestamp: new Date().toISOString()
        });
      }
      
      if (currentDay === totalDays) {
        alerts.push({
          id: `dep-${trip.id}`,
          tripId: trip.id,
          clientName: trip.client.name,
          type: 'DEPARTURE',
          message: `Departure today. Drop-off at ${trip.startLocation} Airport/Station.`,
          severity: 'CRITICAL',
          timestamp: new Date().toISOString()
        });
      }

      if (todayPlan && yesterdayPlan && todayPlan.hotelId !== yesterdayPlan.hotelId && todayPlan.hotelId) {
        alerts.push({
          id: `move-${trip.id}`,
          tripId: trip.id,
          clientName: trip.client.name,
          type: 'HOTEL_CHANGE',
          message: `Moving from ${yesterdayPlan.location || 'Previous'} to ${todayPlan.location || 'Current'} today.`,
          severity: 'WARNING',
          timestamp: new Date().toISOString()
        });
      }
    });
    return alerts;
  }, [ongoingTrips, selectedDate]);

  const displayDate = new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" /> Live Operations Hub
          </h1>
          <p className="text-slate-600 text-sm">Operational tracking for <span className="font-bold text-slate-800">{displayDate}</span>.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 relative overflow-hidden group border border-slate-800">
            <Calendar size={14} className="text-blue-400" />
            <input 
              type="date" 
              className="bg-transparent border-none outline-none cursor-pointer uppercase font-black"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 transition-all flex items-center gap-2 text-xs font-bold shadow-sm"
          >
            <RefreshCcw size={18} /> Today
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Trips on Date" value={ongoingTrips.length} icon={Users} color="bg-blue-600" />
        <StatCard label="Arrivals" value={opsAlerts.filter(a => a.type === 'ARRIVAL').length} icon={PlaneLanding} color="bg-emerald-600" />
        <StatCard label="Departures" value={opsAlerts.filter(a => a.type === 'DEPARTURE').length} icon={PlaneTakeoff} color="bg-rose-600" />
        <StatCard label="Movements" value={opsAlerts.filter(a => a.type === 'HOTEL_CHANGE').length} icon={RefreshCcw} color="bg-amber-600" />
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 xl:col-span-8 space-y-6">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Operations Board for {displayDate}</h3>
           </div>

           <div className="space-y-6">
             {ongoingTrips.length > 0 ? ongoingTrips.map(trip => {
               const { currentDay, totalDays, todayPlan } = getDayInfo(trip, selectedDate);
               const hotel = HOTELS.find(h => h.id === todayPlan?.hotelId);
               const vehicle = VEHICLES.find(v => v.id === todayPlan?.vehicleId);

               return (
                 <div key={trip.id} className="bg-white border border-slate-200 rounded-[40px] shadow-sm hover:shadow-md transition-all overflow-hidden group">
                    <div className="p-8 flex flex-col md:flex-row gap-8">
                       <div className="flex-1 space-y-4">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-sm ${currentDay === 1 ? 'bg-emerald-600 text-white' : currentDay === totalDays ? 'bg-rose-600 text-white' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                  Day {currentDay} / {totalDays}
                                </span>
                                <h3 className="text-xl font-black text-slate-900">{trip.client.name}</h3>
                             </div>
                             <div className="flex items-center gap-1.5">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); navigate(`/trips/${trip.id}`); }}
                                  className="p-2 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all border border-slate-100"
                                  title="Edit Trip"
                                >
                                  <Edit2 size={16}/>
                                </button>
                                <button 
                                  onClick={(e) => deleteTrip(trip.id, e)}
                                  className="p-2 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all border border-slate-100"
                                  title="Delete Trip"
                                >
                                  <Trash2 size={16}/>
                                </button>
                                <button className="p-2 bg-slate-50 text-slate-500 hover:text-emerald-600 rounded-xl transition-all border border-slate-100"><MessageSquare size={16}/></button>
                                <button className="p-2 bg-slate-50 text-slate-500 hover:text-blue-600 rounded-xl transition-all border border-slate-100"><Phone size={16}/></button>
                             </div>
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500">
                                   <MapPin size={12} className="text-blue-600"/> Plan Location
                                </div>
                                <p className="font-black text-slate-900">{todayPlan?.location || 'Transfer / Srinagar'}</p>
                             </div>
                             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500">
                                   <Hotel size={12} className="text-amber-600"/> Scheduled Stay
                                </div>
                                <p className="font-black text-slate-900 truncate">{hotel?.name || 'In-Transit'}</p>
                             </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                             <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                                   <Car size={16} className="text-slate-400" /> {vehicle?.type || 'Not Assigned'}
                                </div>
                                <div className="w-1 h-1 bg-slate-300 rounded-full" />
                                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                                   <Users size={16} className="text-slate-400" /> {trip.pax} Guests
                                </div>
                             </div>
                             <button 
                               onClick={() => setViewingTrip(trip)}
                               className="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-1 hover:underline"
                             >
                               Full Detail <ChevronRight size={14}/>
                             </button>
                          </div>
                       </div>

                       <div className="w-full md:w-64 bg-slate-950 p-6 rounded-[32px] text-white space-y-4 shadow-xl border border-slate-800">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Day {currentDay} Program</p>
                          <div className="space-y-3">
                             <div className="text-xs font-black leading-tight text-white uppercase tracking-tight">
                                {todayPlan?.title || 'Relax / Optional Tours'}
                             </div>
                             {todayPlan?.activityIds.length ? todayPlan.activityIds.slice(0, 2).map(id => {
                               const act = ACTIVITIES.find(a => a.id === id);
                               return (
                                 <div key={id} className="flex items-center gap-2 text-[10px] font-bold text-slate-300">
                                    <Zap size={12} className="text-amber-400" /> {act?.name || 'Activity'}
                                 </div>
                               );
                             }) : (
                               <div className="text-slate-600 text-[10px] font-black uppercase tracking-widest py-4">No Scheduled Excursions</div>
                             )}
                          </div>
                          {trip.numRooms && (
                             <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-500 uppercase">Rooms</span>
                                <span className="text-sm font-black text-blue-400">{trip.numRooms} Units</span>
                             </div>
                          )}
                       </div>
                    </div>
                 </div>
               );
             }) : (
               <div className="bg-white p-32 rounded-[48px] border-2 border-dashed border-slate-200 text-center flex flex-col items-center gap-6">
                 <div className="p-8 bg-slate-50 rounded-full text-slate-200">
                    <Compass size={64} />
                 </div>
                 <div>
                    <h4 className="text-xl font-black text-slate-900 uppercase">No Active Trips on this Date</h4>
                    <p className="text-slate-500 font-bold">Select another date from the calendar to view future/past operations.</p>
                 </div>
               </div>
             )}
           </div>
        </div>

        <div className="col-span-12 xl:col-span-4 space-y-8">
           <div className="bg-rose-50 p-8 rounded-[48px] border border-rose-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                 <h3 className="text-xs font-black uppercase tracking-widest text-rose-700 flex items-center gap-2">
                    <AlertCircle size={16} /> Day Movement Log
                 </h3>
                 <span className="bg-rose-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full">{opsAlerts.length} Criticals</span>
              </div>
              
              <div className="space-y-4">
                 {opsAlerts.map(alert => (
                    <div key={alert.id} className="bg-white p-5 rounded-[32px] border border-rose-200 shadow-sm space-y-3 relative overflow-hidden group">
                       <div className={`absolute top-0 left-0 w-1.5 h-full ${alert.severity === 'CRITICAL' ? 'bg-rose-600' : 'bg-amber-500'}`} />
                       <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${alert.type === 'ARRIVAL' ? 'bg-emerald-100 text-emerald-700' : alert.type === 'DEPARTURE' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                             {alert.type}
                          </span>
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-0.5">{alert.clientName}</p>
                          <p className="text-xs font-bold text-slate-900 leading-snug">{alert.message}</p>
                       </div>
                    </div>
                 ))}
                 {opsAlerts.length === 0 && (
                   <div className="py-20 text-center space-y-4 opacity-40">
                      <CheckCircle2 size={48} className="mx-auto text-emerald-600" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Board Clear for Today</p>
                   </div>
                 )}
              </div>
           </div>

           <div className="bg-blue-600 p-8 rounded-[48px] text-white shadow-2xl space-y-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-blue-100">System Logs</h3>
              <div className="space-y-6">
                 <div className="flex gap-4">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0 border border-white/20 shadow-lg"><Info size={20}/></div>
                    <div className="space-y-1">
                       <p className="text-[11px] font-black leading-snug text-white">Operations data matches current bookings and itineraries as of this moment.</p>
                       <p className="text-[9px] text-blue-200 uppercase font-black">Live Data Notice</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => window.print()}
                   className="w-full py-4 bg-white text-blue-700 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-900/20"
                 >
                    Print Manifest for {selectedDate}
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* Trip Detail Modal (Full Detail View) */}
      {viewingTrip && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl z-[150] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-[48px] shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-slate-200">
              <div className="bg-slate-950 p-10 flex items-center justify-between text-white shrink-0 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
                    <MapPin size={300} />
                 </div>
                 <div className="flex items-center gap-8 relative z-10">
                    <div className="bg-blue-600 p-5 rounded-[32px] shadow-2xl shadow-blue-600/20 border border-blue-500">
                       <User size={40} className="text-white" />
                    </div>
                    <div>
                       <h2 className="text-4xl font-black tracking-tighter leading-none">{viewingTrip.client.name}</h2>
                       <div className="flex items-center gap-5 mt-3">
                          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-400 bg-blue-950/50 px-3 py-1 rounded-lg border border-blue-900">{viewingTrip.tripName}</span>
                          <span className="w-1.5 h-1.5 bg-slate-700 rounded-full" />
                          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{viewingTrip.startDate} — {viewingTrip.endDate}</span>
                       </div>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 relative z-10">
                    <button 
                      onClick={() => navigate(`/quotation/${viewingTrip.id}`)}
                      className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                    >
                       <ExternalLink size={16} className="text-blue-400" /> Proposal View
                    </button>
                    <button 
                      onClick={() => setViewingTrip(null)}
                      className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-slate-400 hover:text-white transition-all shadow-inner"
                    >
                       <X size={32} />
                    </button>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-12 space-y-12 bg-slate-50/50">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="bg-white p-8 rounded-[36px] border border-slate-200 shadow-sm space-y-3">
                       <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Client Contact</p>
                       <p className="text-lg font-black text-slate-900 flex items-center gap-2"><Phone size={16} className="text-blue-600"/> {viewingTrip.client.phone}</p>
                       <p className="text-xs text-slate-600 font-bold truncate">{viewingTrip.client.email}</p>
                    </div>
                    <div className="bg-white p-8 rounded-[36px] border border-slate-200 shadow-sm space-y-3">
                       <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Group Config</p>
                       <p className="text-lg font-black text-slate-900 flex items-center gap-2"><Users size={16} className="text-emerald-600"/> {viewingTrip.pax} Guests</p>
                       <p className="text-xs text-slate-600 font-bold">{viewingTrip.numRooms || 1} Rooms / {viewingTrip.extraBeds || 0} Extra Beds</p>
                    </div>
                    <div className="bg-white p-8 rounded-[36px] border border-slate-200 shadow-sm space-y-3">
                       <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Package Tier</p>
                       <p className="text-lg font-black text-slate-900 flex items-center gap-2"><ShieldCheck size={16} className="text-blue-600"/> {viewingTrip.tripType}</p>
                       <span className="inline-block text-[9px] px-2 py-0.5 bg-emerald-600 text-white rounded font-black uppercase tracking-widest">{viewingTrip.status}</span>
                    </div>
                    <div className="bg-white p-8 rounded-[36px] border border-slate-200 shadow-sm space-y-3">
                       <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Operations Hub</p>
                       <p className="text-lg font-black text-slate-900 flex items-center gap-2"><MapIcon size={16} className="text-amber-600"/> {viewingTrip.startLocation} Office</p>
                       <p className="text-xs text-slate-600 font-bold uppercase tracking-tighter">Agent: {viewingTrip.assignedSalesperson}</p>
                    </div>
                 </div>

                 <div className="space-y-8">
                    <div className="flex items-center gap-4">
                       <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-100">
                          <Compass size={18} />
                       </div>
                       <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em]">Complete Trip Manifest</h4>
                       <div className="flex-1 h-px bg-slate-200" />
                    </div>
                    <div className="space-y-6">
                       {viewingTrip.itinerary.map((day, idx) => {
                          const hotel = HOTELS.find(h => h.id === day.hotelId);
                          const vehicle = VEHICLES.find(v => v.id === day.vehicleId);
                          const isTargetDay = getDayInfo(viewingTrip, selectedDate).currentDay === day.dayNumber;

                          return (
                            <div key={day.id} className={`p-10 rounded-[48px] border transition-all flex flex-col md:flex-row gap-10 ${isTargetDay ? 'bg-blue-600 border-blue-500 text-white shadow-2xl scale-[1.01]' : 'bg-white border-slate-200 shadow-sm'}`}>
                               <div className="w-40 shrink-0 space-y-2">
                                  <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${isTargetDay ? 'text-blue-100' : 'text-blue-600'}`}>Day {day.dayNumber}</p>
                                  <p className="text-2xl font-black tracking-tighter">{new Date(new Date(viewingTrip.startDate).getTime() + (idx * 24 * 60 * 60 * 1000)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                  {isTargetDay && (
                                     <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 mt-2">
                                        <Clock size={12}/> Active Date
                                     </div>
                                  )}
                               </div>

                               <div className="flex-1 space-y-6">
                                  <h5 className="text-xl font-black tracking-tight uppercase leading-none">{day.title}</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                     <div className={`p-5 rounded-3xl flex items-center gap-4 border ${isTargetDay ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-100'}`}>
                                        <div className={`p-3 rounded-2xl ${isTargetDay ? 'bg-white/20' : 'bg-amber-100 text-amber-600'}`}>
                                           <Hotel size={24} className={isTargetDay ? 'text-white' : ''} />
                                        </div>
                                        <div className="overflow-hidden">
                                           <p className={`text-[10px] font-black uppercase tracking-widest ${isTargetDay ? 'text-blue-100' : 'text-slate-500'}`}>Accommodation</p>
                                           <p className={`text-sm font-black truncate max-w-[180px] ${isTargetDay ? 'text-white' : 'text-slate-900'}`}>{hotel?.name || 'Check-out / Transit'}</p>
                                        </div>
                                     </div>
                                     <div className={`p-5 rounded-3xl flex items-center gap-4 border ${isTargetDay ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-100'}`}>
                                        <div className={`p-3 rounded-2xl ${isTargetDay ? 'bg-white/20' : 'bg-blue-100 text-blue-600'}`}>
                                           <Car size={24} className={isTargetDay ? 'text-white' : ''} />
                                        </div>
                                        <div className="overflow-hidden">
                                           <p className={`text-[10px] font-black uppercase tracking-widest ${isTargetDay ? 'text-blue-100' : 'text-slate-500'}`}>Transport</p>
                                           <p className={`text-sm font-black truncate ${isTargetDay ? 'text-white' : 'text-slate-900'}`}>{vehicle?.type || 'Standard Sedan'}</p>
                                        </div>
                                     </div>
                                     <div className={`p-5 rounded-3xl flex items-center gap-4 border ${isTargetDay ? 'bg-white/10 border-white/20' : 'bg-slate-50 border-slate-100'}`}>
                                        <div className={`p-3 rounded-2xl ${isTargetDay ? 'bg-white/20' : 'bg-emerald-100 text-emerald-600'}`}>
                                           <Utensils size={24} className={isTargetDay ? 'text-white' : ''} />
                                        </div>
                                        <div className="overflow-hidden">
                                           <p className={`text-[10px] font-black uppercase tracking-widest ${isTargetDay ? 'text-blue-100' : 'text-slate-500'}`}>Meal Plan</p>
                                           <p className={`text-sm font-black ${isTargetDay ? 'text-white' : 'text-slate-900'}`}>{day.mealPlan || 'Plan Variable'}</p>
                                        </div>
                                     </div>
                                  </div>
                                  {day.activityIds.length > 0 && (
                                     <div className="flex flex-wrap gap-2 pt-2">
                                        {day.activityIds.map(aid => (
                                          <span key={aid} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors ${isTargetDay ? 'bg-white/10 border-white/30 text-white hover:bg-white/20' : 'bg-blue-600 text-white border-blue-700'}`}>
                                             ✓ {ACTIVITIES.find(a => a.id === aid)?.name}
                                          </span>
                                        ))}
                                     </div>
                                  )}
                               </div>
                            </div>
                          );
                       })}
                    </div>
                 </div>
              </div>

              <div className="p-10 bg-white border-t border-slate-200 flex justify-end gap-5 shrink-0">
                 <button 
                   onClick={() => setViewingTrip(null)}
                   className="px-10 py-5 text-slate-600 font-black uppercase tracking-[0.2em] text-xs hover:text-slate-950 transition-all border-2 border-transparent hover:border-slate-100 rounded-[28px]"
                 >
                    Close Manifest
                 </button>
                 <button 
                    onClick={() => navigate(`/trips/${viewingTrip.id}`)}
                    className="px-12 py-5 bg-slate-950 text-white rounded-[28px] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-slate-950/20 hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-3 border border-slate-800"
                 >
                    Open in Itinerary Builder <ChevronRight size={18}/>
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default OngoingTrips;
