
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, Globe, Calendar, Users, Briefcase, ChevronRight, Check, MapPin } from 'lucide-react';
import { TripType, TripStatus, Trip } from '../types';
import { MOCK_TEMPLATES, MOCK_TRIPS, BRAND_CONFIG, TripTemplate, DEFAULT_INCLUSIONS, DEFAULT_EXCLUSIONS, MOCK_LEADS } from '../constants';

import { populateItineraryWithRandomImages } from '../services/assetService';
import { safeLocalStorage, STORAGE_KEYS } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';

const NewTrip: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [allTemplates, setAllTemplates] = useState<TripTemplate[]>(() => {
    const savedTemplatesRaw = safeLocalStorage.getItem(STORAGE_KEYS.TEMPLATES);
    let savedTemplates: TripTemplate[] = [];
    try {
      if (savedTemplatesRaw) {
        const parsed = JSON.parse(savedTemplatesRaw);
        if (Array.isArray(parsed)) savedTemplates = parsed;
      }
    } catch (e) {
      console.error('Failed to parse templates in NewTrip:', e);
    }
    return [...MOCK_TEMPLATES, ...savedTemplates];
  });
  const [formData, setFormData] = useState(() => {
    const queryParams = new URLSearchParams(location.search);
    const templateId = queryParams.get('templateId');
    const leadId = queryParams.get('leadId');

    const initialState = {
      clientName: '',
      phone: '',
      email: '',
      source: 'Website',
      tripName: '',
      tripType: TripType.FAMILY,
      pax: 2,
      startDate: '',
      endDate: '',
      templateId: 'blank',
      startLocation: 'Srinagar' as 'Srinagar' | 'Jammu',
      leadId: ''
    };

    if (templateId) {
      // Note: allTemplates isn't available yet in the same initializer, 
      // but we can load templates specifically for this check or just rely on merged if we move merged logic up.
      // Actually, it's better to just do the localStorage check again if needed or use merged logic.
      const savedTemplatesRaw = safeLocalStorage.getItem(STORAGE_KEYS.TEMPLATES);
      let savedTemplates: TripTemplate[] = [];
      try {
        if (savedTemplatesRaw) {
          const parsed = JSON.parse(savedTemplatesRaw);
          if (Array.isArray(parsed)) savedTemplates = parsed;
        }
      } catch (e) {
        console.warn('NewTrip: Failed to parse templates:', e);
      }
      const merged = [...MOCK_TEMPLATES, ...savedTemplates];
      const template = merged.find(t => t.id === templateId);
      if (template) {
        initialState.templateId = templateId;
        initialState.tripType = template.tripType;
      }
    }

    if (leadId) {
      const savedLeadsRaw = safeLocalStorage.getItem(STORAGE_KEYS.LEADS);
      let allLeads = MOCK_LEADS;
      try {
        if (savedLeadsRaw) {
          const parsed = JSON.parse(savedLeadsRaw);
          if (Array.isArray(parsed)) allLeads = parsed;
        }
      } catch (e) {
        console.warn('NewTrip initializer: Failed to parse leads:', e);
      }
      const foundLead = allLeads.find((l: any) => l.id === leadId);
      if (foundLead) {
        initialState.leadId = leadId;
        initialState.clientName = foundLead.name;
        initialState.phone = foundLead.phone;
        initialState.email = foundLead.email;
        initialState.source = foundLead.source;
        initialState.pax = foundLead.pax;
        initialState.tripType = foundLead.interest;
      } else {
        initialState.leadId = leadId;
      }
    }

    return initialState;
  });

  useEffect(() => {
    // If URL parameters change after initial mount, we update state.
    // This is safe because it's reacting to external changes (location.search).
    const queryParams = new URLSearchParams(location.search);
    const templateId = queryParams.get('templateId');
    const leadId = queryParams.get('leadId');

    if (templateId) {
      const template = allTemplates.find(t => t.id === templateId);
      if (template && formData.templateId !== templateId) {
        Promise.resolve().then(() => {
          setFormData(prev => ({ 
            ...prev, 
            templateId, 
            tripType: template.tripType 
          }));
        });
      }
    }

    if (leadId && formData.leadId !== leadId) {
      const savedLeadsRaw = safeLocalStorage.getItem(STORAGE_KEYS.LEADS);
      let allLeads = MOCK_LEADS;
      try {
        if (savedLeadsRaw) {
          const parsed = JSON.parse(savedLeadsRaw);
          if (Array.isArray(parsed)) allLeads = parsed;
        }
      } catch (e) {
        console.warn('NewTrip effect: Failed to parse leads:', e);
      }
      const foundLead = allLeads.find((l: any) => l.id === leadId);
      if (foundLead) {
        Promise.resolve().then(() => {
          setFormData(prev => ({
            ...prev,
            leadId,
            clientName: foundLead.name,
            phone: foundLead.phone,
            email: foundLead.email,
            source: foundLead.source,
            pax: foundLead.pax,
            tripType: foundLead.interest
          }));
        });
      } else {
        Promise.resolve().then(() => {
          setFormData(prev => ({ ...prev, leadId }));
        });
      }
    }
  }, [location.search, allTemplates, formData.leadId, formData.templateId]);

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Fetch current Master Terms
    const masterInc = safeLocalStorage.getItem(STORAGE_KEYS.MASTER_INCLUSIONS);
    const masterExc = safeLocalStorage.getItem(STORAGE_KEYS.MASTER_EXCLUSIONS);
    let currentMasterInclusions = [...DEFAULT_INCLUSIONS];
    let currentMasterExclusions = [...DEFAULT_EXCLUSIONS];

    try {
      if (masterInc) {
        const parsed = JSON.parse(masterInc);
        if (Array.isArray(parsed)) currentMasterInclusions = parsed;
      }
      if (masterExc) {
        const parsed = JSON.parse(masterExc);
        if (Array.isArray(parsed)) currentMasterExclusions = parsed;
      }
    } catch (e) {
      console.error('Failed to parse master terms:', e);
    }

    try {
      const newId = `trip-${Date.now()}`;
      const selectedTemplate = allTemplates.find(t => t.id === formData.templateId);
      
      const newTrip: Trip = {
        id: newId,
        leadId: formData.leadId,
        client: {
          name: formData.clientName,
          phone: formData.phone,
          email: formData.email,
          source: formData.source,
        },
        tripName: formData.tripName || `${formData.clientName}'s Kashmir Trip`,
        tripType: formData.tripType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        pax: formData.pax,
        budgetRange: 'TBD',
        assignedSalesperson: userProfile?.name || user?.displayName || user?.email || 'Executive Partner',
        status: TripStatus.LEAD,
        marginPercentage: selectedTemplate?.baseMargin || BRAND_CONFIG.defaultMargin,
        addOnIds: [],
        itinerary: selectedTemplate ? populateItineraryWithRandomImages(JSON.parse(JSON.stringify(selectedTemplate.itinerary))) : [],
        versions: [],
        startLocation: formData.startLocation,
        // If blank trip, use Master Database Terms. If template, use Template Terms.
        inclusions: selectedTemplate ? [...selectedTemplate.inclusions] : currentMasterInclusions,
        exclusions: selectedTemplate ? [...selectedTemplate.exclusions] : currentMasterExclusions
      };

      const savedTripsRaw = safeLocalStorage.getItem(STORAGE_KEYS.TRIPS);
      let allTrips: Trip[] = [...MOCK_TRIPS];
      try {
        if (savedTripsRaw) {
          const parsed = JSON.parse(savedTripsRaw);
          if (Array.isArray(parsed)) allTrips = parsed;
        }
      } catch (e) {
        console.error('Failed to parse trips on submit:', e);
      }
      allTrips.push(newTrip);
      const success = safeLocalStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(allTrips));

      if (success) {
        navigate(`/trips/${newId}`); 
      }
    } catch (error) {
      console.error('Error during trip creation:', error);
      alert('Failed to create trip. Please check the console for more details.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <button onClick={() => navigate('/trips')} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-medium">
        <ArrowLeft size={18} />
        Back to Trips
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden text-slate-900">
        <div className="bg-slate-50 border-b border-slate-100 flex p-6 gap-8">
          <div className={`flex items-center gap-3 ${step >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              {step > 1 ? <Check size={16} /> : '1'}
            </div>
            <span className="font-bold text-sm uppercase tracking-wider">Client Details</span>
          </div>
          <div className={`flex items-center gap-3 ${step >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              {step > 2 ? <Check size={16} /> : '2'}
            </div>
            <span className="font-bold text-sm uppercase tracking-wider">Trip Logistics</span>
          </div>
          <div className={`flex items-center gap-3 ${step >= 3 ? 'text-blue-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              3
            </div>
            <span className="font-bold text-sm uppercase tracking-wider">Template</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Client Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      required
                      type="text" 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 placeholder:text-slate-300"
                      placeholder="e.g. Adnan Ahmad"
                      value={formData.clientName}
                      onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest">WhatsApp / Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      required
                      type="tel" 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 placeholder:text-slate-300"
                      placeholder="+91 0000 000000"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="email" 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 placeholder:text-slate-300"
                      placeholder="client@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Lead Source</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <select 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                      value={formData.source}
                      onChange={(e) => setFormData({...formData, source: e.target.value})}
                    >
                      <option>Website</option>
                      <option>Instagram</option>
                      <option>Referral</option>
                      <option>Walk-in</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Trip Name</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      required
                      type="text" 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 placeholder:text-slate-300"
                      placeholder="e.g. Kashmir Family Getaway"
                      value={formData.tripName}
                      onChange={(e) => setFormData({...formData, tripName: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Start Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <select 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                      value={formData.startLocation}
                      onChange={(e) => setFormData({...formData, startLocation: e.target.value as 'Srinagar' | 'Jammu'})}
                    >
                      <option value="Srinagar">Srinagar (Base)</option>
                      <option value="Jammu">Jammu (+₹1k/day Vehicle)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Trip Type</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                    value={formData.tripType}
                    onChange={(e) => setFormData({...formData, tripType: e.target.value as TripType})}
                  >
                    {Object.values(TripType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Number of Pax</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      required
                      type="number" 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                      value={formData.pax}
                      onChange={(e) => setFormData({...formData, pax: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Start Date</label>
                  <input 
                    required
                    type="date" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest">End Date</label>
                  <input 
                    required
                    type="date" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, templateId: 'blank'})}
                  className={`p-6 border-2 rounded-2xl text-left transition-all ${formData.templateId === 'blank' ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                >
                  <h4 className="font-bold text-slate-800">Start from Scratch</h4>
                  <p className="text-sm text-slate-500 mt-1">Empty itinerary, uses Master Database terms.</p>
                </button>
                {allTemplates.map(temp => (
                  <button 
                    key={temp.id}
                    type="button"
                    onClick={() => setFormData({...formData, templateId: temp.id})}
                    className={`p-6 border-2 rounded-2xl text-left transition-all ${formData.templateId === temp.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                  >
                    <h4 className="font-bold text-slate-800">{temp.name}</h4>
                    <p className="text-sm text-slate-500 mt-1">{temp.duration} • {temp.tripType}</p>
                    <div className="mt-3 flex gap-1">
                      {temp.itinerary.slice(0, 3).map((_, i) => <div key={i} className="w-4 h-1 bg-slate-200 rounded-full" />)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
            {step > 1 ? (
              <button type="button" onClick={handleBack} className="px-6 py-2 text-slate-500 font-bold hover:text-slate-800">Back</button>
            ) : <div></div>}
            
            {step < 3 ? (
              <button type="button" onClick={handleNext} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">Continue <ChevronRight size={18} /></button>
            ) : (
              <button type="submit" className="bg-emerald-600 text-white px-10 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all">Create Trip & Start Building</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTrip;
