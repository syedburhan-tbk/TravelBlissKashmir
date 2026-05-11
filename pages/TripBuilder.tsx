
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Save, 
  Sparkles,
  ArrowLeft,
  CalendarDays,
  Hotel as HotelIcon,
  Car as CarIcon,
  History,
  Download,
  Check,
  MapPin,
  Utensils,
  Map as MapIcon,
  PlusCircle,
  Wallet,
  MapPinned,
  IndianRupee,
  Star,
  ListPlus,
  X,
  ChevronRight,
  ShieldCheck,
  XCircle,
  Trophy,
  Award,
  Crown,
  Compass,
  ArrowRightLeft,
  Bed,
  Moon,
  Clock,
  RefreshCcw,
  Repeat,
  Percent,
  Calculator,
  Info,
  PlaneTakeoff,
  Copy,
  Split,
  FileClock,
  RotateCcw,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  Library,
  ChevronDown,
  Users,
  BedDouble,
  Baby,
  ImageIcon,
  Maximize2,
  Archive
} from 'lucide-react';
import { MOCK_TRIPS, HOTELS, VEHICLES, ACTIVITIES, ADD_ONS, DEFAULT_INCLUSIONS, DEFAULT_EXCLUSIONS } from '../constants';
import { Trip, ItineraryDay, TripVersion, HotelCategory, Hotel, MealPlan, TripStatus, AddOn, Vehicle, HotelTierSelection, TierPrices } from '../types';
import { generateDayDescription, suggestNextDayTitle } from '../services/geminiService';
import { tripService } from '../services/tripService';
import { ItineraryEngine } from '../services/itineraryEngine';
import { ITINERARY_VARIATIONS } from '../itineraryDatabase';
import { TripType, DayType } from '../types';
import { populateItineraryWithRandomImages } from '../services/assetService';
import { useStorageSync } from '../hooks/useStorageSync';
import { safeLocalStorage, STORAGE_KEYS } from '../utils/storage';

const generateUniqueId = () => `d-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const TripBuilder: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(() => {
    // We can't use id here if we want it to be fully reactive in useState, 
    // but we can initialize for the FIRST mount.
    // However, TripBuilder is a complex page where id usually doesn't change without remount.
    // Let's grab id from window.location or just use a helper if needed, but useParams() works here too.
    const tripId = window.location.hash.split('/').pop();
    if (!tripId || tripId === 'new') return null;

    const savedTrips = safeLocalStorage.getItem(STORAGE_KEYS.TRIPS);
    let foundTrip: Trip | undefined;

    if (savedTrips) {
      try {
        const parsed = JSON.parse(savedTrips);
        if (Array.isArray(parsed)) {
          foundTrip = parsed.find((t: Trip) => t.id === tripId);
        }
      } catch (e) {
        console.warn('TripBuilder initializer: Failed to parse trips:', e);
      }
    }

    if (!foundTrip) {
      foundTrip = MOCK_TRIPS.find(t => t.id === tripId);
    }

    if (foundTrip) {
      // Fix-up logic (same as in useEffect)
      // Since masterVehicles/masterHotels are useMemo, we might need to load them here too if we want perfect sync
      const savedVehicles = safeLocalStorage.getItem(STORAGE_KEYS.VEHICLES);
      const customVehicles = savedVehicles ? JSON.parse(savedVehicles) : [];
      const mVehicles = [...VEHICLES, ...(Array.isArray(customVehicles) ? customVehicles : [])];

      const paxCount = foundTrip.pax || 2;
      let matchedVehicle;
      if (paxCount <= 3) {
        matchedVehicle = mVehicles.find(v => (v.type || '').toLowerCase().includes('sedan') || (v.brand || '').toLowerCase().includes('sedan') || (v.brand || '').toLowerCase().includes('etios'));
      } else if (paxCount <= 7) {
        matchedVehicle = mVehicles.find(v => (v.brand || '').toLowerCase().includes('innova') || (v.brand || '').toLowerCase().includes('ertiga') || (v.type || '').toLowerCase().includes('suv'));
      }
      if (!matchedVehicle) matchedVehicle = mVehicles[0];
      const defaultVehicleId = matchedVehicle ? matchedVehicle.id : '';

      const updatedItinerary = (foundTrip.itinerary || []).map((day, idx) => {
        const isDeparture = idx === (foundTrip.itinerary?.length || 0) - 1;
        return {
          ...day,
          vehicleId: day.vehicleId || defaultVehicleId,
          mealPlan: day.mealPlan || (isDeparture ? undefined : MealPlan.MAP)
        };
      });

      return { 
        ...foundTrip,
        itinerary: updatedItinerary,
        startLocation: foundTrip.startLocation || 'Srinagar',
        dropLocation: foundTrip.dropLocation || foundTrip.startLocation || 'Srinagar',
        numRooms: foundTrip.numRooms || 1,
        extraBeds: foundTrip.extraBeds || 0,
        childNoBed: foundTrip.childNoBed || 0,
        compChild: foundTrip.compChild || 0,
        inclusions: foundTrip.inclusions || [...DEFAULT_INCLUSIONS],
        exclusions: foundTrip.exclusions || [...DEFAULT_EXCLUSIONS],
        hotelTiers: foundTrip.hotelTiers || [],
        tierPrices: foundTrip.tierPrices || { signature: 0, elite: 0, prime: 0 },
        tierMargins: foundTrip.tierMargins || { signature: 15, elite: 15, prime: 15 },
        versions: foundTrip.versions || []
      };
    }
    return null;
  });

  const [tripsForSync, setTripsForSync] = useState<Trip[]>([]);
  useStorageSync(STORAGE_KEYS.TRIPS, tripsForSync, (newTrips) => {
    setTripsForSync(newTrips);
    // If our current trip is gone from the main list, redirect
    if (id && id !== 'new' && newTrips.length > 0) {
      const stillExists = newTrips.some(t => t.id === id);
      if (!stillExists) {
        console.warn('TripBuilder: Current trip was deleted from another tab. Redirecting...');
        navigate('/trips');
      }
    }
  }, []);

  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<'config' | 'history'>('config');
  
  const [newHighlight, setNewHighlight] = useState('');
  const [newInclusion, setNewInclusion] = useState('');
  const [newExclusion, setNewExclusion] = useState('');
  
  const updateTripInStorage = (updated: Trip) => {
    try {
      const savedTrips = safeLocalStorage.getItem(STORAGE_KEYS.TRIPS);
      let allTrips: Trip[] = [];
      if (savedTrips) {
        try {
          const parsed = JSON.parse(savedTrips);
          if (Array.isArray(parsed)) allTrips = parsed;
        } catch (e) {
          console.warn('updateTripInStorage: Failed to parse trips:', e);
        }
      }

      const index = allTrips.findIndex((t: Trip) => t.id === updated.id);
      if (index !== -1) {
        allTrips[index] = updated;
        safeLocalStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(allTrips));
        tripService.saveTrip(updated).catch(err => {
           console.warn('Sync to RTDB failed, but local copy is updated:', err);
        });
      } else {
        console.warn('TripBuilder: Attempted to save a trip that is no longer in the master list (possibly deleted).');
      }
    } catch (error) {
      console.error('Failed to save trip update:', error);
      // Don't crash the UI, but maybe warn the user if it's a quota issue
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        alert('Browser storage is full! Please delete some images in the Assets section to free up space.');
      }
    }
  };

  // Auto-save logic
  useEffect(() => {
    if (!trip) return;
    const timeoutId = setTimeout(() => {
      console.log('Auto-saving trip...');
      updateTripInStorage(trip);
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [trip]);
  
  // Master Library States
  const [masterInclusions, setMasterInclusions] = useState<string[]>(() => {
    const mInc = safeLocalStorage.getItem(STORAGE_KEYS.MASTER_INCLUSIONS);
    return mInc ? JSON.parse(mInc) : [...DEFAULT_INCLUSIONS];
  });
  const [masterExclusions, setMasterExclusions] = useState<string[]>(() => {
    const mExc = safeLocalStorage.getItem(STORAGE_KEYS.MASTER_EXCLUSIONS);
    return mExc ? JSON.parse(mExc) : [...DEFAULT_EXCLUSIONS];
  });
  const [showInclusionLibrary, setShowInclusionLibrary] = useState(false);
  const [showExclusionLibrary, setShowExclusionLibrary] = useState(false);

  // Regional Config constants
  const UNION_CAB_COST = 2500;
  const JAMMU_DAILY_SURCHARGE = 1000;

  // Versioning state
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [versionLabel, setVersionLabel] = useState('');
  const [viewingHotelPhotos, setViewingHotelPhotos] = useState<Hotel | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Smart Build State
  const [isSmartBuildModalOpen, setIsSmartBuildModalOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [matchingVariations, setMatchingVariations] = useState<any[]>([]);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const allVariations = useMemo(() => {
    try {
      const saved = safeLocalStorage.getItem(STORAGE_KEYS.VARIATIONS);
      const custom = saved ? JSON.parse(saved) : [];
      const customIds = new Set(custom.map((v: any) => v.id));
      const mock = ITINERARY_VARIATIONS.filter(v => !customIds.has(v.id));
      return [...mock, ...custom];
    } catch (e) {
      return ITINERARY_VARIATIONS;
    }
  }, []);

  const [smartInput, setSmartInput] = useState({
    arrivalCity: 'Srinagar',
    departureCity: 'Srinagar',
    destinations: ['Pahalgam', 'Gulmarg'],
    totalDays: 6,
    budgetLevel: 'elite' as 'prime' | 'elite' | 'signature'
  });

  const handleSmartBuild = async () => {
    if (!trip) return;

    const variations = ItineraryEngine.buildSmartItinerary({
      totalDays: smartInput.totalDays,
      arrivalCity: smartInput.arrivalCity,
      departureCity: smartInput.departureCity,
      destinations: smartInput.destinations,
      budgetLevel: smartInput.budgetLevel,
      tripType: trip.tripType
    });

    // Update trip details
    const newItinerary = variations.map((v, i) => 
      ItineraryEngine.variationToDay(v, i + 1, smartInput.budgetLevel, trip.vehicleSelection || 'Sedan')
    );

    const populatedItinerary = await populateItineraryWithRandomImages(newItinerary);

    setTrip(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        numDays: smartInput.totalDays,
        startLocation: smartInput.arrivalCity,
        dropLocation: smartInput.departureCity,
        itinerary: populatedItinerary
      };
    });

    setIsSmartBuildModalOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTitleChange = (val: string) => {
    updateDay(activeDayIndex, { title: val });
    
    if (val.trim().length > 0) {
      const searchLower = val.toLowerCase();
      const searchTerms = searchLower.split(' ').filter(t => t.length >= 2);
      
      const filtered = allVariations.filter((v: any) => {
        const title = (v.title || '').toLowerCase();
        const dest = (v.destination || '').toLowerCase();
        const notes = (v.internalNotes || '').toLowerCase();
        const customerDesc = (v.customerDescription || '').toLowerCase();
        const combined = `${title} ${dest} ${notes} ${customerDesc}`;
        
        // Match full sequence
        if (combined.includes(searchLower)) return true;
        
        // Match all individual keywords (more flexible)
        if (searchTerms.length > 0) {
          return searchTerms.every(term => combined.includes(term));
        }
        
        return false;
      }).slice(0, 50);
      
      setMatchingVariations(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const applyVariation = (v: any) => {
    updateDay(activeDayIndex, { 
      title: v.title,
      clientNotes: v.customerDescription,
      internalNotes: v.internalNotes,
      location: v.destination,
      unionCabSelected: v.transferType === 'Union'
    });
    setShowSuggestions(false);
  };

  const masterHotels = useMemo(() => {
    try {
      const saved = safeLocalStorage.getItem(STORAGE_KEYS.HOTELS);
      let custom: Hotel[] = [];
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) custom = parsed;
      }
      const combined = [...HOTELS];
      custom.forEach((ch: Hotel) => {
        const idx = combined.findIndex(h => h.id === ch.id);
        if (idx > -1) combined[idx] = ch;
        else combined.push(ch);
      });
      return combined;
    } catch (e) {
      console.error('Failed to parse hotels:', e);
      return [...HOTELS];
    }
  }, []);

  const masterVehicles = useMemo(() => {
    try {
      const saved = safeLocalStorage.getItem(STORAGE_KEYS.VEHICLES);
      let custom: Vehicle[] = [];
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) custom = parsed;
      }
      const combined = [...VEHICLES];
      custom.forEach((cv: Vehicle) => {
        const idx = combined.findIndex(v => v.id === cv.id);
        if (idx > -1) combined[idx] = cv;
        else combined.push(cv);
      });
      return combined;
    } catch (e) {
      console.error('Failed to parse vehicles:', e);
      return [...VEHICLES];
    }
  }, []);

  const masterAddOns = useMemo(() => {
    try {
      const saved = safeLocalStorage.getItem(STORAGE_KEYS.ADDONS);
      const custom = saved ? JSON.parse(saved) : [];
      return [...ADD_ONS, ...(Array.isArray(custom) ? custom : [])];
    } catch (e) {
      console.error('Failed to parse addons:', e);
      return [...ADD_ONS];
    }
  }, []);

  const hotelLocations = useMemo(() => {
    const locs = Array.from(new Set(masterHotels.map(h => h.location)));
    return locs.sort();
  }, [masterHotels]);

  useEffect(() => {
    const tripIdFromUrl = id || window.location.hash.split('/').pop();
    // Re-verify trip if id changes or if it was not loaded initially
    if (!trip || trip.id !== tripIdFromUrl) {
       const savedTrips = safeLocalStorage.getItem(STORAGE_KEYS.TRIPS);
       let foundTrip: Trip | undefined;
       if (savedTrips) {
         try {
           const parsed = JSON.parse(savedTrips);
           if (Array.isArray(parsed)) foundTrip = parsed.find((t: Trip) => t.id === tripIdFromUrl);
         } catch (e) {
            console.warn('TripBuilder sync: Failed to parse trips:', e);
          }
       }
       if (!foundTrip) foundTrip = MOCK_TRIPS.find(t => t.id === tripIdFromUrl);
       if (foundTrip) {
         Promise.resolve().then(() => setTrip(foundTrip));
       }
    }
  }, [id, trip]);

  useEffect(() => {
    if (trip) {
      try {
        const savedTrips = safeLocalStorage.getItem(STORAGE_KEYS.TRIPS);
        let allTrips: Trip[] = [];
        try {
          if (savedTrips) {
            const parsed = JSON.parse(savedTrips);
            if (Array.isArray(parsed)) allTrips = parsed;
          } else {
            allTrips = [...MOCK_TRIPS];
          }
        } catch (e) {
          allTrips = [...MOCK_TRIPS];
        }

        const index = allTrips.findIndex(t => t.id === trip.id);
        if (index > -1) allTrips[index] = trip;
        else allTrips.push(trip);
        
        // Limit total trips or their versions to save space
        const limitedTrips = allTrips.map(t => {
          if (t.id === trip.id && t.versions && t.versions.length > 5) {
            return { ...t, versions: t.versions.slice(0, 5) };
          }
          return t;
        });

        safeLocalStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(limitedTrips));
      } catch (e) {
        console.error('Failed to auto-save trip:', e);
      }
    }
  }, [trip]);

  const itineraryLocations = useMemo(() => {
    if (!trip) return [];
    return Array.from(new Set(trip.itinerary.slice(0, -1).map(day => {
      if (day.location) return day.location;
      const hotel = masterHotels.find(h => h.id === day.hotelId);
      return hotel?.location || 'Srinagar';
    })));
  }, [trip, masterHotels]);

  const stayTracking = useMemo(() => {
    if (!trip || trip.itinerary.length < 2) return { summaries: [], dayStayInfo: {} };
    
    const summaries: { location: string; nights: number; startDay: number }[] = [];
    const dayStayInfo: Record<number, { nightNum: number; totalNightsInLocation: number }> = {};
    
    let currentLocation: string | undefined = undefined;
    let currentCount = 0;
    let currentStart = 1;
    let currentDayIndices: number[] = [];

    const stayDays = trip.itinerary.slice(0, -1);

    stayDays.forEach((day, idx) => {
      const dayLoc = day.location || masterHotels.find(h => h.id === day.hotelId)?.location || 'Srinagar';

      if (dayLoc === currentLocation) {
        currentCount++;
        currentDayIndices.push(day.dayNumber);
      } else {
        if (currentLocation) {
          summaries.push({
            location: currentLocation,
            nights: currentCount,
            startDay: currentStart
          });
          currentDayIndices.forEach((dNum, i) => {
            dayStayInfo[dNum] = { nightNum: i + 1, totalNightsInLocation: currentCount };
          });
        }
        currentLocation = dayLoc;
        currentCount = 1;
        currentStart = day.dayNumber;
        currentDayIndices = [day.dayNumber];
      }

      if (idx === stayDays.length - 1 && currentLocation) {
        summaries.push({
          location: currentLocation,
          nights: currentCount,
          startDay: currentStart
        });
        currentDayIndices.forEach((dNum, i) => {
          dayStayInfo[dNum] = { nightNum: i + 1, totalNightsInLocation: currentCount };
        });
      }
    });

    return { summaries, dayStayInfo };
  }, [trip, masterHotels]);

  const getHotelRateByMealPlan = (hotel: Hotel, plan?: MealPlan) => {
    if (!plan) return hotel.ratePerNight || 0;
    switch (plan) {
      case MealPlan.EP: return hotel.epRate || hotel.ratePerNight || 0;
      case MealPlan.CP: return hotel.cpRate || hotel.ratePerNight || 0;
      case MealPlan.MAP: return hotel.mapRate || hotel.ratePerNight || 0;
      case MealPlan.AP: return hotel.apRate || hotel.ratePerNight || 0;
      default: return hotel.ratePerNight || 0;
    }
  };

  const tieredCosts = useMemo(() => {
    if (!trip) return { 
      signature: { subtotal: 0, margin: 0, suggested: 0 }, 
      elite: { subtotal: 0, margin: 0, suggested: 0 }, 
      prime: { subtotal: 0, margin: 0, suggested: 0 } 
    };
    
    const calculateForTier = (tier: 'signature' | 'elite' | 'prime') => {
      let hotelCost = 0;
      let vehicleCost = 0;
      let activityCost = 0;
      let addOnsCost = 0;
      let jammuSurcharge = 0;
      let regionalCabCost = 0;
      let oneWaySurcharge = 0;

      if (trip.startLocation && trip.dropLocation && trip.startLocation !== trip.dropLocation) {
        let hasTraveler = false;
        trip.itinerary.forEach(day => {
          if (day.vehicleId) {
            const vehicle = masterVehicles.find(v => v.id === day.vehicleId);
            if (vehicle && (vehicle.type || '').toLowerCase().includes('traveler')) {
              hasTraveler = true;
            }
          }
        });
        oneWaySurcharge = hasTraveler ? 4000 : 3000;
      }

      const roomsCount = trip.numRooms || 1;
      const ebCount = trip.extraBeds || 0;
      const cnbCount = trip.childNoBed || 0;

      trip.itinerary.forEach((day, idx) => {
        const dayLoc = day.location || masterHotels.find(h => h.id === day.hotelId)?.location || 'Srinagar';
        const tierMap = trip.hotelTiers?.find(t => t.location === dayLoc);
        const tierHotelId = tierMap?.[`${tier}HotelId` as keyof HotelTierSelection] as string;
        const hotel = masterHotels.find(h => h.id === tierHotelId);
        
        if (hotel && idx < trip.itinerary.length - 1) {
          const baseRoomRate = getHotelRateByMealPlan(hotel, day.mealPlan);
          const ebRate = hotel.extraBedRate || 0;
          const cnbRate = hotel.childNoBedRate || 0;
          hotelCost += (baseRoomRate * roomsCount) + (ebRate * ebCount) + (cnbRate * cnbCount);
        }

        if (day.vehicleId) {
          const vehicle = masterVehicles.find(v => v.id === day.vehicleId);
          if (vehicle) {
            vehicleCost += vehicle.ratePerDay;
            if (trip.startLocation === 'Jammu') jammuSurcharge += JAMMU_DAILY_SURCHARGE;
          }
        }

        if (day.unionCabSelected) {
          regionalCabCost += UNION_CAB_COST;
        }

        (day.activityIds || []).forEach(aid => {
          const act = ACTIVITIES.find(a => a.id === aid);
          if (act) activityCost += act.costPerPax * (trip.pax || 1);
        });
      });

      trip.addOnIds.forEach(aoId => {
        const ao = masterAddOns.find(a => a.id === aoId);
        if (ao) {
          addOnsCost += ao.isPerPax ? ao.cost * (trip.pax || 1) : ao.cost;
        }
      });

      const subtotal = hotelCost + vehicleCost + jammuSurcharge + activityCost + addOnsCost + regionalCabCost + oneWaySurcharge;
      const marginPct = trip.tierMargins?.[tier] ?? 15;
      const margin = subtotal * (marginPct / 100);
      
      return { 
        subtotal, 
        margin, 
        suggested: Math.ceil(subtotal + margin) 
      };
    };

    return {
      signature: calculateForTier('signature'),
      elite: calculateForTier('elite'),
      prime: calculateForTier('prime')
    };
  }, [trip, masterHotels, masterVehicles, masterAddOns]);

  const remapItinerary = (itinerary: ItineraryDay[]) => {
    return itinerary.map((day, i) => ({
      ...day,
      dayNumber: i + 1
    }));
  };

  const updateDay = (index: number, updates: Partial<ItineraryDay>) => {
    if (!trip) return;
    const newItinerary = [...trip.itinerary];
    newItinerary[index] = { ...newItinerary[index], ...updates };

    if (index === 0 && updates.vehicleId !== undefined) {
      for (let i = 1; i < newItinerary.length; i++) {
        newItinerary[i] = { ...newItinerary[i], vehicleId: updates.vehicleId };
      }
    }

    setTrip({ ...trip, itinerary: newItinerary });
  };

  const applyHotelCategoryToAllDays = (category: HotelCategory) => {
    if (!trip) return;
    const newItinerary = [...trip.itinerary];
    newItinerary.forEach((day, idx) => {
      if (idx === newItinerary.length - 1) return;
      const loc = day.location || masterHotels.find(h => h.id === day.hotelId)?.location || 'Srinagar';
      const hotelMatch = masterHotels.find(h => h.location === loc && h.category === category);
      if (hotelMatch) {
        day.hotelId = hotelMatch.id;
      }
    });
    setTrip({ ...trip, itinerary: newItinerary });
  };

  const removeDay = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!trip || trip.itinerary.length <= 1) return;
    if (!window.confirm("Are you sure you want to delete this day? All its contents will be lost.")) return;
    const filtered = trip.itinerary.filter((_, i) => i !== index);
    const remapped = remapItinerary(filtered);
    if (index === activeDayIndex) {
      setActiveDayIndex(Math.min(index, remapped.length - 1));
    } else if (index < activeDayIndex) {
      setActiveDayIndex(prev => prev - 1);
    }
    setTrip({ ...trip, itinerary: remapped });
  };

  const cloneDay = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!trip) return;
    const dayToClone = trip.itinerary[index];
    const newDay: ItineraryDay = {
      ...JSON.parse(JSON.stringify(dayToClone)),
      id: generateUniqueId(),
      title: `${dayToClone.title} (Copy)`
    };
    const newItinerary = [...trip.itinerary];
    newItinerary.splice(index + 1, 0, newDay);
    setTrip({ ...trip, itinerary: remapItinerary(newItinerary) });
    setActiveDayIndex(index + 1);
  };

  const insertDay = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!trip) return;
    const prevDay = trip.itinerary[index];
    const newDay: ItineraryDay = {
      id: generateUniqueId(),
      dayNumber: index + 2,
      title: `Day ${index + 2}: New Exploration`,
      location: prevDay?.location || 'Srinagar',
      hotelId: '',
      vehicleId: prevDay?.vehicleId || '',
      activityIds: [],
      highlights: [],
      clientNotes: '',
      internalNotes: '',
      unionCabSelected: false
    };
    const newItinerary = [...trip.itinerary];
    newItinerary.splice(index + 1, 0, newDay);
    setTrip({ ...trip, itinerary: remapItinerary(newItinerary) });
    setActiveDayIndex(index + 1);
  };

  const handleAddDay = () => {
    if (!trip) return;
    const nextDayNum = trip.itinerary.length + 1;
    const lastDay = trip.itinerary[trip.itinerary.length - 1];
    const newDay: ItineraryDay = {
      id: generateUniqueId(),
      dayNumber: nextDayNum,
      title: `Day ${nextDayNum}: Exploring Kashmir`,
      location: lastDay?.location || 'Srinagar',
      hotelId: '',
      vehicleId: lastDay?.vehicleId || '',
      activityIds: [],
      highlights: [],
      clientNotes: '',
      internalNotes: '',
      unionCabSelected: false
    };
    setTrip({ ...trip, itinerary: [...trip.itinerary, newDay] });
    setActiveDayIndex(trip.itinerary.length);
  };

  const toggleActivity = (activityId: string) => {
    if (!trip) return;
    const currentDay = trip.itinerary[activeDayIndex];
    const currentActivityIds = currentDay.activityIds || [];
    const isSelected = currentActivityIds.includes(activityId);
    const updatedIds = isSelected 
      ? currentActivityIds.filter(id => id !== activityId)
      : [...currentActivityIds, activityId];
    updateDay(activeDayIndex, { activityIds: updatedIds });
  };

  const updateTierSelection = (location: string, tier: 'signature' | 'elite' | 'prime', hotelId: string) => {
    if (!trip) return;
    const tiers = [...(trip.hotelTiers || [])];
    const index = tiers.findIndex(t => t.location === location);
    if (index > -1) {
      tiers[index] = { ...tiers[index], [`${tier}HotelId`]: hotelId };
    } else {
      tiers.push({
        location,
        signatureHotelId: tier === 'signature' ? hotelId : '',
        eliteHotelId: tier === 'elite' ? hotelId : '',
        primeHotelId: tier === 'prime' ? hotelId : ''
      });
    }
    setTrip({ ...trip, hotelTiers: tiers });
  };

  const updateTierPrice = (tier: keyof TierPrices, value: string) => {
    if (!trip) return;
    setTrip({ 
      ...trip, 
      tierPrices: { 
        ...(trip.tierPrices || { signature: 0, elite: 0, prime: 0 }), 
        [tier]: parseInt(value) || 0 
      } 
    });
  };

  const updateTierMargin = (tier: keyof TierPrices, value: string) => {
    if (!trip) return;
    setTrip({
      ...trip,
      tierMargins: {
        ...(trip.tierMargins || { signature: 15, elite: 15, prime: 15 }),
        [tier]: parseInt(value) || 0
      }
    });
  };

  const autoCalculatePricing = () => {
    if (!trip) return;
    setTrip({
      ...trip,
      tierPrices: {
        signature: tieredCosts.signature.suggested,
        elite: tieredCosts.elite.suggested,
        prime: tieredCosts.prime.suggested
      }
    });
  };

  const addHighlight = () => {
    if (!trip || !newHighlight.trim()) return;
    const day = trip.itinerary[activeDayIndex];
    const updatedHighlights = [...(day.highlights || []), newHighlight.trim()];
    updateDay(activeDayIndex, { highlights: updatedHighlights });
    setNewHighlight('');
  };

  const removeHighlight = (idx: number) => {
    if (!trip) return;
    const day = trip.itinerary[activeDayIndex];
    const updatedHighlights = (day.highlights || []).filter((_, i) => i !== idx);
    updateDay(activeDayIndex, { highlights: updatedHighlights });
  };

  const addInclusion = () => {
    if (!trip || !newInclusion.trim()) return;
    setTrip({ ...trip, inclusions: [...(trip.inclusions || []), newInclusion.trim()] });
    setNewInclusion('');
  };

  const updateInclusionInline = (index: number, value: string) => {
    if (!trip) return;
    const updated = [...trip.inclusions];
    updated[index] = value;
    setTrip({ ...trip, inclusions: updated });
  };

  const removeInclusion = (idx: number) => {
    if (!trip) return;
    setTrip({ ...trip, inclusions: (trip.inclusions || []).filter((_, i) => i !== idx) });
  };

  const swapInToEx = (idx: number) => {
    if (!trip) return;
    const item = trip.inclusions[idx];
    const newInclusions = trip.inclusions.filter((_, i) => i !== idx);
    const newExclusions = [...(trip.exclusions || []), item];
    setTrip({ ...trip, inclusions: newInclusions, exclusions: newExclusions });
  };

  const addExclusion = () => {
    if (!trip || !newExclusion.trim()) return;
    setTrip({ ...trip, exclusions: [...(trip.exclusions || []), newExclusion.trim()] });
    setNewExclusion('');
  };

  const updateExclusionInline = (index: number, value: string) => {
    if (!trip) return;
    const updated = [...trip.exclusions];
    updated[index] = value;
    setTrip({ ...trip, exclusions: updated });
  };

  const removeExclusion = (idx: number) => {
    if (!trip) return;
    setTrip({ ...trip, exclusions: (trip.exclusions || []).filter((_, i) => i !== idx) });
  };

  const swapExToIn = (idx: number) => {
    if (!trip) return;
    const item = trip.exclusions[idx];
    const newExclusions = trip.exclusions.filter((_, i) => i !== idx);
    const newInclusions = [...(trip.inclusions || []), item];
    setTrip({ ...trip, inclusions: newInclusions, exclusions: newExclusions });
  };

  const syncWithMaster = (type: 'inclusions' | 'exclusions') => {
    if (!trip) return;
    if (window.confirm(`Are you sure you want to reset all trip ${type} to the Master Database values? Current custom edits will be lost.`)) {
      setTrip({ ...trip, [type]: type === 'inclusions' ? [...masterInclusions] : [...masterExclusions] });
    }
  };

  const handleAiDescription = async () => {
    if (!trip) return;
    setIsAiGenerating(true);
    const day = trip.itinerary[activeDayIndex];
    const activitiesNames = (day.activityIds || []).map(aid => ACTIVITIES.find(a => a.id === aid)?.name || '');
    const description = await generateDayDescription(day.title, activitiesNames);
    updateDay(activeDayIndex, { clientNotes: description });
    setIsAiGenerating(false);
  };

  const handleSaveVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip || !versionLabel.trim()) return;
    const newVersion: TripVersion = {
      id: `v-${Date.now()}`,
      timestamp: new Date().toISOString(),
      label: versionLabel,
      itinerary: JSON.parse(JSON.stringify(trip.itinerary)),
      tierPrices: { ...(trip.tierPrices || { signature: 0, elite: 0, prime: 0 }) }
    };
    setTrip({
      ...trip,
      versions: [newVersion, ...(trip.versions || [])]
    });
    setIsVersionModalOpen(false);
    setVersionLabel('');
    setActiveRightTab('history');
  };

  const restoreVersion = (version: TripVersion) => {
    if (!trip) return;
    if (!window.confirm(`Restore "${version.label}"? Your current changes will be overwritten unless saved as a version.`)) return;
    setTrip({
      ...trip,
      itinerary: JSON.parse(JSON.stringify(version.itinerary)),
      tierPrices: { ...version.tierPrices }
    });
    setActiveDayIndex(0);
  };

  const deleteVersion = (vId: string) => {
    if (!trip) return;
    setTrip({
      ...trip,
      versions: (trip.versions || []).filter(v => v.id !== vId)
    });
  };

  const handleSaveToCloud = async () => {
    if (!trip) return;
    setIsSaving(true);
    await tripService.saveTrip(trip);
    setIsSaving(false);
  };

  const handleCopyProposalLink = async () => {
    if (!trip) return;
    setIsSaving(true);
    await tripService.saveTrip(trip);
    const link = `${window.location.origin}/#/quotation/${trip.id}`;
    await navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setIsSaving(false);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveAsTemplate = () => {
    if (!trip) return;
    const templateName = prompt("Enter a name for this new template:", `${trip.tripName} Template`);
    if (!templateName) return;

    const dayCount = trip.itinerary.length;
    const durationStr = dayCount <= 0 ? '0 Days' : dayCount === 1 ? '1 Day' : `${dayCount} Days, ${dayCount - 1} Nights`;

    const newTemplate: TripTemplate = {
      id: `temp-${Date.now()}`,
      name: templateName,
      duration: durationStr,
      tripType: trip.tripType,
      baseMargin: trip.tierMargins?.signature || 15,
      itinerary: trip.itinerary.map(day => ({
        ...day,
        id: `d-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      })),
      inclusions: [...(trip.inclusions || [])],
      exclusions: [...(trip.exclusions || [])],
      startLocation: trip.startLocation,
      dropLocation: trip.dropLocation || trip.startLocation,
    };

    const savedTemplatesRaw = safeLocalStorage.getItem(STORAGE_KEYS.TEMPLATES);
    const savedTemplates: TripTemplate[] = savedTemplatesRaw ? JSON.parse(savedTemplatesRaw) : [];
    savedTemplates.push(newTemplate);
    safeLocalStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(savedTemplates));
    
    alert(`Template "${templateName}" saved successfully!`);
    navigate('/templates');
  };

  const handleNavigateToProposal = async () => {
    if (!trip) return;
    setIsSaving(true);
    await tripService.saveTrip(trip);
    setIsSaving(false);
    navigate(`/quotation/${trip.id}`);
  };

  const handleRefreshVisuals = async () => {
    if (!trip) return;
    if (window.confirm('Update all day images randomly from the assets database?')) {
      const updated = await populateItineraryWithRandomImages(trip.itinerary);
      const updatedTrip = { ...trip, itinerary: updated };
      setTrip(updatedTrip);
      updateTripInStorage(updatedTrip);
    }
  };

  if (!trip) return <div className="p-20 text-center text-slate-400 font-black uppercase tracking-widest">LOADING BUILDER...</div>;

  const currentDay = trip.itinerary[activeDayIndex];
  const isLastDay = activeDayIndex === trip.itinerary.length - 1;
  const activeLocation = currentDay?.location || masterHotels.find(h => h.id === currentDay?.hotelId)?.location || 'All';
  const showUnionCabOption = ['Pahalgam', 'Sonamarg'].includes(currentDay?.location || '');
  
  // Find current day's hotel based on hotelId property
  const selectedHotel = masterHotels.find(h => h.id === currentDay?.hotelId);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] space-y-6 pb-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button onClick={() => navigate('/trips')} className="p-3 hover:bg-slate-50 rounded-2xl transition-all border border-slate-100 shadow-sm">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{trip.tripName}</h1>
            <div className="flex items-center gap-3 mt-1 text-slate-400">
               <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">{trip.client.name}</span>
               <span className="w-1 h-1 bg-slate-200 rounded-full"/>
               <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                  <MapIcon size={12} className="text-slate-400" />
                  <select 
                    className="bg-transparent text-[10px] font-black uppercase text-slate-600 outline-none cursor-pointer"
                    value={trip.startLocation}
                    onChange={(e) => setTrip({ ...trip, startLocation: e.target.value as 'Srinagar' | 'Jammu' })}
                  >
                    <option value="Srinagar">Srinagar Start</option>
                    <option value="Jammu">Jammu Start (+₹1k/Day)</option>
                  </select>
               </div>
               <span className="w-1 h-1 bg-slate-200 rounded-full"/>
               <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                  <MapIcon size={12} className="text-slate-400" />
                  <select 
                    className="bg-transparent text-[10px] font-black uppercase text-slate-600 outline-none cursor-pointer"
                    value={trip.dropLocation || trip.startLocation}
                    onChange={(e) => setTrip({ ...trip, dropLocation: e.target.value as 'Srinagar' | 'Jammu' })}
                  >
                    <option value="Srinagar">Srinagar Drop</option>
                    <option value="Jammu">Jammu Drop</option>
                  </select>
               </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center gap-6">
           <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
                 <Bed size={16} className="text-blue-600" />
                 <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Rooms</span>
                    <input 
                      type="number" 
                      min="1"
                      className="bg-transparent text-sm font-black text-slate-900 w-8 outline-none"
                      value={trip.numRooms || 1}
                      onChange={(e) => setTrip({...trip, numRooms: parseInt(e.target.value) || 1})}
                    />
                 </div>
              </div>
              <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
                 <Plus size={16} className="text-emerald-600" />
                 <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Extra Bed</span>
                    <input 
                      type="number" 
                      min="0"
                      className="bg-transparent text-sm font-black text-slate-900 w-8 outline-none"
                      value={trip.extraBeds || 0}
                      onChange={(e) => setTrip({...trip, extraBeds: parseInt(e.target.value) || 0})}
                    />
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <Baby size={16} className="text-amber-500" />
                 <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Child NB</span>
                    <input 
                      type="number" 
                      min="0"
                      className="bg-transparent text-sm font-black text-slate-900 w-8 outline-none"
                      value={trip.childNoBed || 0}
                      onChange={(e) => setTrip({...trip, childNoBed: parseInt(e.target.value) || 0})}
                    />
                 </div>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-6 px-6 py-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-900/20">
             <div className="text-right">
               <p className="text-[9px] font-black text-blue-100 uppercase tracking-widest">Selected Elite Quote</p>
               <p className="text-xl font-black text-white">₹{(trip.tierPrices?.elite || tieredCosts.elite.suggested).toLocaleString()}</p>
             </div>
          </div>
          <button 
            onClick={handleRefreshVisuals}
            className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all shadow-sm border border-indigo-100"
            title="Refresh Destination Assets"
          >
            <ImageIcon size={20} />
          </button>
          <button 
            onClick={() => setIsVersionModalOpen(true)}
            className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm"
            title="Save as Version"
          >
            <FileClock size={20} />
          </button>
          <button 
            onClick={handleSaveAsTemplate}
            disabled={isSaving}
            className="bg-white border-2 border-slate-200 text-slate-700 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-sm hover:border-slate-300 transition-all active:scale-95 disabled:opacity-50"
          >
            <Archive size={18} />
            SAVE TEMPLATE
          </button>
          <button 
            onClick={handleCopyProposalLink}
            disabled={isSaving}
            className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-sm flex items-center gap-2"
            title="Copy Shareable Link"
          >
            {copiedLink ? <Check size={20} className="text-emerald-600" /> : <Copy size={20} />}
            {copiedLink && <span className="text-[10px] font-black uppercase">Copied</span>}
          </button>
          <button 
            onClick={handleNavigateToProposal}
            disabled={isSaving}
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <RefreshCcw size={18} className="animate-spin" /> : <Download size={18} />}
            {isSaving ? 'SYNCING...' : 'PROPOSAL / PDF'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 flex-1 overflow-hidden">
        <div className="col-span-12 lg:col-span-3 space-y-6 overflow-y-auto pr-2">
            {/* AI Enhancement Section */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] p-6 shadow-xl shadow-blue-900/10 text-white overflow-hidden relative group">
               <div className="relative z-10 space-y-4">
                 <div className="flex items-center gap-2">
                   <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                     <Sparkles size={20} className="text-white" />
                   </div>
                   <h2 className="text-sm font-black uppercase tracking-widest">Intelligent Engine</h2>
                 </div>
                 <p className="text-[10px] font-bold text-blue-100 leading-relaxed">
                   Auto-select best route flow, avoid backtracking, and add seasonal curated experiences.
                 </p>
                 <button 
                   onClick={() => setIsSmartBuildModalOpen(true)}
                   className="w-full py-3 bg-white text-blue-600 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-blue-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                 >
                   Open Smart Builder
                 </button>
               </div>
               <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm flex flex-col h-fit">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <CalendarDays size={16} className="text-blue-600" /> Trip Steps
                 </h3>
               </div>
              <div className="space-y-4">
                {trip.itinerary.map((day, idx) => {
                  const hotel = masterHotels.find(h => h.id === day.hotelId);
                  const stayInfo = stayTracking.dayStayInfo[day.dayNumber];
                  const isDayLast = idx === trip.itinerary.length - 1;
                  const isSelected = activeDayIndex === idx;
                  
                  return (
                    <div key={day.id} className="relative group">
                      <button 
                        onClick={() => setActiveDayIndex(idx)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-1 ${
                          isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-lg z-10' : 'bg-white border-slate-100 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-blue-100' : 'text-blue-600'}`}>Day {day.dayNumber}</span>
                            {day.images && day.images.length > 0 && (
                              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black ${isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                                <ImageIcon size={8} />
                                {day.images.length}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1.5">
                             {stayInfo && !isDayLast && (
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1 ${isSelected ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600'}`}>
                                  <Moon size={8} /> {`Night ${stayInfo.nightNum}`}
                                </span>
                             )}
                             {isDayLast && (
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1 ${isSelected ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-600'}`}>
                                  <PlaneTakeoff size={8} /> Departure
                                </span>
                             )}
                             {!isDayLast && (
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                  {day.location || hotel?.location || 'Srinagar'}
                                </span>
                             )}
                          </div>
                        </div>
                        <h4 className="font-bold text-sm truncate pr-10">{day.title}</h4>
                        {day.unionCabSelected && <p className={`text-[8px] font-black uppercase tracking-tighter ${isSelected ? 'text-emerald-200' : 'text-emerald-500'}`}>+ Union Cab Selected</p>}
                      </button>

                      <div className={`absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 transition-all duration-200 z-20 ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'}`}>
                         <button 
                            onClick={(e) => insertDay(idx, e)}
                            title="Add Day After"
                            className="p-1.5 bg-emerald-500 text-white rounded-lg shadow-lg hover:bg-emerald-600 active:scale-90 transition-all border-2 border-white"
                          >
                           <PlusCircle size={14} />
                         </button>
                         <button 
                            onClick={(e) => cloneDay(idx, e)}
                            title="Clone Day"
                            className="p-1.5 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 active:scale-90 transition-all border-2 border-white"
                          >
                           <Copy size={14} />
                         </button>
                         {trip.itinerary.length > 1 && (
                            <button 
                              onClick={(e) => removeDay(idx, e)}
                              title="Delete Day"
                              className="p-1.5 bg-rose-500 text-white rounded-lg shadow-lg hover:bg-rose-600 active:scale-90 transition-all border-2 border-white"
                            >
                              <Trash2 size={14} />
                            </button>
                         )}
                      </div>
                    </div>
                  );
                })}
                <button 
                  onClick={handleAddDay}
                  className="w-full py-5 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/30 transition-all"
                >
                  <Plus size={16} /> Append Final Day
                </button>
              </div>
           </div>

           <div className="bg-slate-50 border border-slate-200 rounded-[32px] p-6 shadow-inner space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                 <Moon size={16} className="text-amber-500" /> Stay Distribution (Nights)
              </h3>
              <div className="space-y-4">
                 {stayTracking.summaries.map((summary, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-3 bg-blue-50 text-blue-600 rounded-bl-2xl font-black text-xs">
                          {summary.nights} {summary.nights === 1 ? 'Night' : 'Nights'}
                       </div>
                       <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Starting Day {summary.startDay}</span>
                          <h5 className="font-black text-slate-900 text-sm leading-tight pr-12">{summary.location} Stay</h5>
                          <div className="flex items-center gap-2 mt-2">
                             <MapPin size={12} className="text-slate-300" />
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{summary.location}</span>
                          </div>
                       </div>
                    </div>
                 ))}
                 {stayTracking.summaries.length === 0 && (
                    <div className="py-10 text-center opacity-30">
                       <Bed size={32} className="mx-auto mb-2 text-slate-400" />
                       <p className="text-[10px] font-black uppercase tracking-widest">No Overnight Stays</p>
                    </div>
                 )}
              </div>
           </div>
        </div>

        <div className="col-span-12 lg:col-span-6 space-y-8 overflow-y-auto pr-2 pb-6">
           {trip.itinerary[activeDayIndex] && (
             <div className="bg-white border border-slate-200 rounded-[40px] p-10 shadow-sm space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="space-y-3">
                   <div className="flex justify-between items-center px-1">
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Daily Title Headline</label>
                      {isLastDay && <span className="text-[9px] font-black uppercase text-rose-500 bg-rose-50 px-3 py-1 rounded-full">Departure Day - No Night Stay</span>}
                   </div>
                   <div className="relative group">
                     <input 
                       type="text" 
                       value={trip.itinerary[activeDayIndex].title || ''}
                       onChange={(e) => handleTitleChange(e.target.value)}
                       onFocus={() => {
                         if (trip.itinerary[activeDayIndex].title.trim().length > 0) setShowSuggestions(true);
                       }}
                       className="w-full px-8 py-6 bg-blue-50/30 border-2 border-blue-100 rounded-3xl text-2xl font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all outline-none shadow-sm"
                       placeholder="Enter day title (e.g. Pahalgam)..."
                     />
                     
                     {showSuggestions && (
                       <div 
                         ref={suggestionsRef}
                         className="absolute left-0 right-0 top-full mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 p-3 z-[150] animate-in slide-in-from-top-2 duration-200"
                       >
                         <div className="flex items-center gap-2 px-3 pb-2 mb-2 border-b border-slate-50">
                            <Sparkles size={14} className="text-blue-600" />
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Smart Recommendations</span>
                         </div>
                         <div className="space-y-1">
                           {matchingVariations.map((v) => (
                             <button
                               key={v.id}
                               onClick={() => applyVariation(v)}
                               className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 text-left transition-colors group/item"
                             >
                               <div>
                                 <p className="text-sm font-bold text-slate-900">{v.title}</p>
                                 <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{v.destination} • {v.dayType}</p>
                               </div>
                               <ChevronRight size={16} className="text-slate-200 group-hover/item:text-blue-500 group-hover/item:translate-x-1 transition-all" />
                             </button>
                           ))}
                         </div>
                       </div>
                     )}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <label className="text-xs font-black uppercase text-slate-700 flex items-center gap-2 tracking-widest">
                         <MapPin size={16} className="text-blue-500" /> Destination City
                      </label>
                      <select 
                        value={trip.itinerary[activeDayIndex].location || 'Srinagar'}
                        onChange={(e) => updateDay(activeDayIndex, { location: e.target.value })}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs text-slate-900 shadow-sm outline-none uppercase tracking-widest"
                      >
                         <option value="Srinagar">Srinagar</option>
                         <option value="Gulmarg">Gulmarg</option>
                         <option value="Pahalgam">Pahalgam</option>
                         <option value="Sonamarg">Sonamarg</option>
                         <option value="Houseboat">⚓ Houseboat Context</option>
                         {hotelLocations.filter(l => !['Srinagar', 'Gulmarg', 'Pahalgam', 'Sonamarg', 'Houseboat'].includes(l)).map(loc => <option key={loc} value={loc}>{loc}</option>)}
                      </select>
                   </div>
                   
                   <div className="space-y-4">
                      <label className="text-xs font-black uppercase text-slate-700 flex items-center gap-2 tracking-widest">
                         <CarIcon size={16} className="text-blue-500" /> Primary Transport
                      </label>
                      <select 
                        value={trip.itinerary[activeDayIndex].vehicleId}
                        onChange={(e) => updateDay(activeDayIndex, { vehicleId: e.target.value })}
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs text-slate-900 shadow-sm outline-none"
                      >
                         <option value="">Select Transport...</option>
                         {masterVehicles.map(v => <option key={v.id} value={v.id}>{v.brand} {v.type}</option>)}
                      </select>
                   </div>
                </div>

                {/* Hotel Selection & Visual Reference */}
                {!isLastDay && (
                  <div className="space-y-4">
                     <label className="text-xs font-black uppercase text-slate-700 flex items-center gap-2 tracking-widest">
                        <HotelIcon size={16} className="text-blue-500" /> Manual Hotel Choice (Overrides Tier)
                     </label>
                     <div className="flex gap-6 items-start">
                        <div className="flex-1 space-y-4">
                          <select 
                            value={trip.itinerary[activeDayIndex].hotelId || ''}
                            onChange={(e) => updateDay(activeDayIndex, { hotelId: e.target.value })}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs text-slate-900 shadow-sm outline-none"
                          >
                            <option value="">Use Tier Defaults...</option>
                            {masterHotels.filter(h => h.location === (trip.itinerary[activeDayIndex].location || 'Srinagar')).map(h => (
                              <option key={h.id} value={h.id}>{h.name} ({h.category})</option>
                            ))}
                          </select>
                          <p className="text-[10px] font-bold text-slate-400 italic">Select a specific hotel for this night if it deviates from the global tier selection.</p>
                        </div>

                        {selectedHotel && (
                           <div className="w-48 space-y-3 group cursor-pointer" onClick={() => setViewingHotelPhotos(selectedHotel)}>
                              <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 shadow-md">
                                 <img 
                                   src={selectedHotel.gallery?.[0] || `https://picsum.photos/seed/${selectedHotel.id}/400/200`} 
                                   className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                   alt={selectedHotel.name} 
                                 />
                                 <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <Maximize2 size={24} className="text-white" />
                                 </div>
                              </div>
                              <div className="flex items-center justify-between">
                                 <span className="text-[9px] font-black uppercase text-blue-600 tracking-widest truncate">{selectedHotel.name}</span>
                                 <ImageIcon size={12} className="text-slate-300" />
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <label className={`text-xs font-black uppercase flex items-center gap-2 tracking-widest ${isLastDay ? 'text-slate-300' : 'text-slate-700'}`}>
                         <Utensils size={16} className={isLastDay ? 'text-slate-300' : 'text-blue-500'} /> Daily Meal Plan
                      </label>
                      <select 
                        disabled={isLastDay}
                        value={trip.itinerary[activeDayIndex].mealPlan}
                        onChange={(e) => updateDay(activeDayIndex, { mealPlan: e.target.value as MealPlan })}
                        className={`w-full p-4 border rounded-2xl font-black text-xs shadow-sm outline-none ${
                           isLastDay ? 'bg-slate-50 border-slate-100 text-slate-300' : 'bg-slate-50 border border-slate-200 text-slate-900'
                        }`}
                      >
                         <option value="">{isLastDay ? 'None (Departure Day)' : 'Select Plan...'}</option>
                         {!isLastDay && Object.values(MealPlan).map(mp => <option key={mp} value={mp}>{mp}</option>)}
                      </select>
                   </div>

                   <div className="space-y-4">
                      <label className={`text-xs font-black uppercase flex items-center gap-2 tracking-widest ${!showUnionCabOption ? 'text-slate-300' : 'text-slate-700'}`}>
                         <ShieldAlert size={16} className={!showUnionCabOption ? 'text-slate-300' : 'text-amber-500'} /> 
                         Regional Logistics
                      </label>
                      <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                        !showUnionCabOption ? 'bg-slate-50 border-slate-100 opacity-40' : 
                        trip.itinerary[activeDayIndex].unionCabSelected ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'
                      }`}>
                         <div className="flex flex-col">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${!showUnionCabOption ? 'text-slate-400' : 'text-slate-900'}`}>Local Union Cab</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Required for {currentDay.location}</span>
                         </div>
                         <button 
                           disabled={!showUnionCabOption}
                           onClick={() => updateDay(activeDayIndex, { unionCabSelected: !trip.itinerary[activeDayIndex].unionCabSelected })}
                           className={`p-2 rounded-xl transition-all ${trip.itinerary[activeDayIndex].unionCabSelected ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
                         >
                            {trip.itinerary[activeDayIndex].unionCabSelected ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                         </button>
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                         <Compass size={14} className="text-emerald-500" /> Available Excursions
                      </h4>
                   </div>
                   <div className="flex flex-wrap gap-3">
                      {ACTIVITIES.map(act => {
                         const isSelected = (trip.itinerary[activeDayIndex].activityIds || []).includes(act.id);
                         return (
                            <button 
                               key={act.id}
                               onClick={() => toggleActivity(act.id)}
                               className={`px-4 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                  isSelected 
                                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' 
                                  : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-200 hover:text-emerald-600'
                               }`}
                            >
                               {act.name}
                            </button>
                         );
                      })}
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                         <Star size={14} className="text-amber-500" /> Major Highlights
                      </h4>
                   </div>
                   <div className="space-y-3">
                      {(trip.itinerary[activeDayIndex].highlights || []).map((h, i) => (
                        <div key={i} className="flex items-center gap-3 group">
                           <div className="flex-1 bg-blue-50 border border-blue-100 text-blue-900 px-6 py-4 rounded-2xl text-xs font-bold shadow-sm">
                              {h}
                           </div>
                           <button onClick={() => removeHighlight(i)} className="p-4 text-slate-300 hover:text-rose-500 transition-colors">
                              <X size={16}/>
                           </button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="e.g. Afternoon at Tulip Garden..."
                          value={newHighlight}
                          onChange={(e) => setNewHighlight(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addHighlight()}
                          className="flex-1 p-5 bg-white border-2 border-dashed border-slate-200 rounded-2xl text-xs font-bold outline-none text-slate-900"
                        />
                        <button onClick={addHighlight} className="bg-slate-900 text-white px-6 rounded-2xl active:scale-95 transition-all">
                          <Plus size={24} />
                        </button>
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Client Facing Description</h4>
                      <button 
                        onClick={handleAiDescription}
                        disabled={isAiGenerating}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-all"
                      >
                        <Sparkles size={14} /> AI Context Suggest
                      </button>
                   </div>
                   <textarea 
                     rows={8}
                     value={trip.itinerary[activeDayIndex].clientNotes}
                     onChange={(e) => updateDay(activeDayIndex, { clientNotes: e.target.value })}
                     className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[32px] text-base leading-relaxed text-slate-800 outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-inner"
                     placeholder="Paint a picture of the day's experiences for the client..."
                   />
                </div>
             </div>
           )}
        </div>

        <div className="col-span-12 lg:col-span-3 space-y-6 overflow-y-auto pr-2 pb-6">
           <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
              <button 
                onClick={() => setActiveRightTab('config')}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeRightTab === 'config' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Package
              </button>
              <button 
                onClick={() => setActiveRightTab('history')}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeRightTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Tiers
              </button>
           </div>

           {activeRightTab === 'config' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 shadow-2xl space-y-8">
                   <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Calculator size={16} className="text-blue-400" /> Pricing Control
                      </h3>
                      <button 
                        onClick={autoCalculatePricing}
                        className="text-[9px] font-black uppercase text-blue-400 flex items-center gap-1 hover:underline"
                      >
                        <RefreshCcw size={10}/> Auto-Calc
                      </button>
                   </div>
                   
                   <div className="space-y-6">
                      <div className="space-y-1">
                         <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black uppercase text-slate-400">Elite Signature</label>
                            <span className="text-[8px] font-bold text-slate-500">Sug: ₹{tieredCosts.signature.suggested.toLocaleString()}</span>
                         </div>
                         <input 
                           type="number" 
                           value={trip.tierPrices?.signature || ''} 
                           onChange={(e) => updateTierPrice('signature', e.target.value)} 
                           className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-black text-white outline-none focus:ring-2 focus:ring-blue-500" 
                         />
                      </div>
                      <div className="space-y-1">
                         <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black uppercase text-blue-400">Elite Premier</label>
                            <span className="text-[8px] font-black text-blue-300">Sug: ₹{tieredCosts.elite.suggested.toLocaleString()}</span>
                         </div>
                         <input 
                           type="number" 
                           value={trip.tierPrices?.elite || ''} 
                           onChange={(e) => updateTierPrice('elite', e.target.value)} 
                           className="w-full p-3 bg-blue-900/30 border border-blue-500/50 rounded-xl text-xs font-black text-blue-300 outline-none focus:ring-2 focus:ring-blue-400" 
                         />
                      </div>
                      <div className="space-y-1">
                         <div className="flex justify-between items-center px-1">
                            <label className="text-[10px] font-black uppercase text-amber-500">Elite Prime</label>
                            <span className="text-[8px] font-black text-amber-300">Sug: ₹{tieredCosts.prime.suggested.toLocaleString()}</span>
                         </div>
                         <input 
                           type="number" 
                           value={trip.tierPrices?.prime || ''} 
                           onChange={(e) => updateTierPrice('prime', e.target.value)} 
                           className="w-full p-3 bg-amber-900/10 border border-amber-500/30 rounded-xl text-xs font-black text-amber-400 outline-none focus:ring-2 focus:ring-amber-400" 
                         />
                      </div>
                   </div>

                   <div className="pt-6 border-t border-white/10 space-y-4">
                      <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1"><Percent size={12}/> Margins</p>
                      <div className="grid grid-cols-3 gap-2">
                        {['signature', 'elite', 'prime'].map(tier => (
                          <div key={tier} className="flex flex-col gap-1">
                            <label className="text-[8px] font-black uppercase text-slate-500">{tier.slice(0,3)}%</label>
                            <input 
                              type="number" 
                              value={trip.tierMargins?.[tier as keyof TierPrices] ?? 15}
                              onChange={(e) => updateTierMargin(tier as keyof TierPrices, e.target.value)}
                              className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-center font-black text-white outline-none text-[10px]"
                            />
                          </div>
                        ))}
                      </div>
                   </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Sparkles size={16} className="text-blue-400" /> Premium Experiences
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {masterAddOns.map(ao => {
                      const isSelected = (trip.addOnIds || []).includes(ao.id);
                      return (
                        <button 
                          key={ao.id}
                          onClick={() => {
                            const updated = isSelected ? trip.addOnIds.filter(id => id !== ao.id) : [...trip.addOnIds, ao.id];
                            setTrip({...trip, addOnIds: updated});
                          }}
                          className={`w-full text-left p-5 rounded-3xl border transition-all flex flex-col gap-1 ${
                            isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                          }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>{ao.name}</span>
                              {isSelected && <Check size={14} className="text-white" />}
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={`text-[9px] font-bold uppercase tracking-widest ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>{ao.isPerPax ? 'Per Guest' : 'Flat'}</span>
                              <span className={`text-sm font-black ${isSelected ? 'text-white' : 'text-blue-600'}`}>₹{(ao.cost || 0).toLocaleString()}</span>
                            </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2"><ShieldCheck size={16} /> Trip Inclusions</h3>
                      <div className="flex items-center gap-2">
                         <button onClick={() => setShowInclusionLibrary(!showInclusionLibrary)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all" title="Master Library">
                           <Library size={14} />
                         </button>
                         <button onClick={() => syncWithMaster('inclusions')} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-rose-500 transition-all" title="Reset to Master">
                           <RotateCcw size={14} />
                         </button>
                      </div>
                    </div>
                    
                    {showInclusionLibrary && (
                      <div className="bg-slate-900 p-4 rounded-2xl space-y-3 animate-in slide-in-from-top-2">
                        <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest px-1">Master Database Inclusions</p>
                        <div className="max-h-40 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                          {masterInclusions.map((item, idx) => (
                            <button 
                              key={idx} 
                              onClick={() => { if(trip) setTrip({...trip, inclusions: [...(trip.inclusions || []), item]}); setShowInclusionLibrary(false); }}
                              className="w-full text-left p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-slate-300 transition-all flex items-center justify-between group"
                            >
                               <span className="flex-1 truncate mr-2">{item}</span>
                               <Plus size={10} className="text-slate-600 group-hover:text-blue-400" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                        {(trip.inclusions || []).map((inc, i) => (
                          <div key={i} className="flex items-start gap-2 group">
                              <textarea 
                                value={inc}
                                onChange={(e) => updateInclusionInline(i, e.target.value)}
                                className="flex-1 text-[10px] font-bold text-slate-600 bg-emerald-50 p-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-200 resize-none overflow-hidden"
                                rows={2}
                              />
                              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => swapInToEx(i)} className="p-2 text-slate-300 hover:text-blue-500 transition-all" title="Move to Exclusions"><Repeat size={14}/></button>
                                <button onClick={() => removeInclusion(i)} className="p-2 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={14}/></button>
                              </div>
                          </div>
                        ))}
                        <div className="flex gap-2 pt-2">
                          <input type="text" placeholder="Add custom inclusion..." value={newInclusion} onChange={(e) => setNewInclusion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addInclusion()} className="flex-1 p-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold outline-none text-slate-900" />
                          <button onClick={addInclusion} className="bg-emerald-600 text-white p-2 rounded-lg transition-all active:scale-90"><Plus size={14}/></button>
                        </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-widest text-rose-500 flex items-center gap-2"><XCircle size={16} /> Trip Exclusions</h3>
                      <div className="flex items-center gap-2">
                         <button onClick={() => setShowExclusionLibrary(!showExclusionLibrary)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all" title="Master Library">
                           <Library size={14} />
                         </button>
                         <button onClick={() => syncWithMaster('exclusions')} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-rose-500 transition-all" title="Reset to Master">
                           <RotateCcw size={14} />
                         </button>
                      </div>
                    </div>

                    {showExclusionLibrary && (
                      <div className="bg-slate-900 p-4 rounded-2xl space-y-3 animate-in slide-in-from-top-2">
                        <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest px-1">Master Database Exclusions</p>
                        <div className="max-h-40 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                          {masterExclusions.map((item, idx) => (
                            <button 
                              key={idx} 
                              onClick={() => { if(trip) setTrip({...trip, exclusions: [...(trip.exclusions || []), item]}); setShowExclusionLibrary(false); }}
                              className="w-full text-left p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-slate-300 transition-all flex items-center justify-between group"
                            >
                               <span className="flex-1 truncate mr-2">{item}</span>
                               <Plus size={10} className="text-slate-600 group-hover:text-rose-400" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                        {(trip.exclusions || []).map((exc, i) => (
                          <div key={i} className="flex items-start gap-2 group">
                              <textarea 
                                value={exc}
                                onChange={(e) => updateExclusionInline(i, e.target.value)}
                                className="flex-1 text-[10px] font-bold text-slate-600 bg-rose-50 p-3 rounded-xl outline-none focus:ring-2 focus:ring-rose-200 resize-none overflow-hidden"
                                rows={2}
                              />
                              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => swapExToIn(i)} className="p-2 text-slate-300 hover:text-blue-500 transition-all" title="Move to Inclusions"><Repeat size={14}/></button>
                                <button onClick={() => removeExclusion(i)} className="p-2 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={14}/></button>
                              </div>
                          </div>
                        ))}
                        <div className="flex gap-2 pt-2">
                          <input type="text" placeholder="Add custom exclusion..." value={newInclusion} onChange={(e) => setNewInclusion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addExclusion()} className="flex-1 p-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold outline-none text-slate-900" />
                          <button onClick={addExclusion} className="bg-rose-500 text-white p-2 rounded-lg transition-all active:scale-90"><Plus size={14}/></button>
                        </div>
                    </div>
                  </div>
                </div>
                <div className="pb-6" />
             </div>
           )}

           {activeRightTab === 'history' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-white border-2 border-blue-600 rounded-[32px] p-6 shadow-sm space-y-8">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2"><Trophy size={16} /> Tier Hotel Config</h3>
                  <div className="space-y-2 border-b border-slate-100 pb-4">
                     <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Global Hotel Auto-Select</p>
                     <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => applyHotelCategoryToAllDays(HotelCategory.BUDGET)} className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black transition-all shadow-sm active:scale-95">Select 3 Star (Budget)</button>
                        <button onClick={() => applyHotelCategoryToAllDays(HotelCategory.DELUXE)} className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black transition-all shadow-sm active:scale-95">Select 4 Star (Deluxe)</button>
                     </div>
                  </div>
                   {itineraryLocations.map(location => {
                     const selection = trip.hotelTiers?.find(t => t.location === location) || { signatureHotelId: '', eliteHotelId: '', primeHotelId: '' };
                     const locHotels = masterHotels.filter(h => h.location === location);
                     const isActive = location === activeLocation || (activeLocation === 'Houseboat' && location === 'Srinagar');

                     return (
                       <div key={location} className={`space-y-4 pt-4 border-t border-slate-50 first:border-0 first:pt-0 transition-all ${isActive ? 'bg-blue-50/50 -mx-4 px-4 py-4 rounded-xl' : ''}`}>
                          <p className="text-[9px] font-black uppercase text-slate-900 bg-slate-100 px-2 py-1 rounded w-fit">{location}</p>
                          <div className="space-y-3">
                             <div className="space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase">Elite Signature</label>
                                <select value={selection.signatureHotelId} onChange={e => updateTierSelection(location, 'signature', e.target.value)} className="w-full p-2 bg-slate-50 border rounded-xl text-[10px] font-bold outline-none">
                                   <option value="">Select Signature...</option>
                                   {locHotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                </select>
                             </div>
                             <div className="space-y-1">
                                <label className="text-[8px] font-black text-blue-500 uppercase">Elite Premier</label>
                                <select value={selection.eliteHotelId} onChange={e => updateTierSelection(location, 'elite', e.target.value)} className="w-full p-2 bg-blue-50 border border-blue-100 rounded-xl text-[10px] font-black outline-none text-blue-900">
                                   <option value="">Select Elite...</option>
                                   {locHotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                </select>
                             </div>
                             <div className="space-y-1">
                                <label className="text-[8px] font-black text-amber-500 uppercase">Elite Prime</label>
                                <select value={selection.primeHotelId} onChange={e => updateTierSelection(location, 'prime', e.target.value)} className="w-full p-2 bg-amber-50 border border-amber-100 rounded-xl text-[10px] font-bold outline-none">
                                   <option value="">Select Prime...</option>
                                   {locHotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                </select>
                             </div>
                          </div>
                       </div>
                     );
                   })}
                </div>

                <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-8 shadow-2xl">
                   <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                         <History size={16} /> Iteration History
                      </h3>
                   </div>
                   
                   <div className="space-y-4">
                      {trip.versions?.map(v => (
                         <div key={v.id} className="p-5 bg-white/5 border border-white/10 rounded-[32px] group hover:bg-white/10 transition-all">
                            <div className="flex justify-between items-start mb-2">
                               <div>
                                  <p className="text-xs font-black text-white">{v.label}</p>
                                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                                     {new Date(v.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                  </p>
                               </div>
                               <button onClick={() => deleteVersion(v.id)} className="p-1.5 text-slate-600 hover:text-rose-400 transition-colors">
                                  <Trash2 size={14} />
                                </button>
                            </div>
                            <div className="flex gap-2 mt-4">
                               <button 
                                 onClick={() => restoreVersion(v)}
                                 className="flex-1 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-500 transition-all flex items-center justify-center gap-2"
                               >
                                  <RotateCcw size={12} /> Restore
                               </button>
                            </div>
                         </div>
                      ))}
                      
                      {(trip.versions || []).length === 0 && (
                         <div className="py-12 text-center space-y-4 opacity-20">
                            <Clock size={40} className="mx-auto" />
                            <p className="text-[10px] font-black uppercase tracking-widest">No versions saved yet</p>
                         </div>
                      )}
                   </div>
                   
                   <button 
                      onClick={() => setIsVersionModalOpen(true)}
                      className="w-full py-4 bg-white/10 text-white border border-white/20 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                   >
                      <Plus size={14} /> Save Current Draft
                   </button>
                </div>
             </div>
           )}
        </div>
      </div>

      {/* Version Modal */}
      {isVersionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
           <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="bg-slate-950 p-8 text-white flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2.5 rounded-xl">
                       <FileClock size={20} />
                    </div>
                    <div>
                       <h3 className="font-black uppercase text-sm">Save Version</h3>
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Freeze current progress</p>
                    </div>
                 </div>
                 <button onClick={() => setIsVersionModalOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X size={24}/></button>
              </div>

              <form onSubmit={handleSaveVersion} className="p-10 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Version Label</label>
                    <input 
                      autoFocus
                      required
                      type="text" 
                      placeholder="e.g. Initial Draft, Added Houseboat, Post-Discount..."
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all"
                      value={versionLabel}
                      onChange={(e) => setVersionLabel(e.target.value)}
                    />
                 </div>
                 
                 <div className="pt-4 flex gap-4">
                    <button type="button" onClick={() => setIsVersionModalOpen(false)} className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 rounded-2xl transition-all">Discard</button>
                    <button type="submit" className="flex-[2] py-4 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl hover:bg-blue-600 transition-all">
                       Commit Version
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Smart Build Modal */}
      {isSmartBuildModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden border border-white/20">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                  <Sparkles className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">Smart Itinerary Builder</h2>
                  <p className="text-blue-100 text-xs font-bold uppercase tracking-widest opacity-80">Dynamic Route Optimization</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSmartBuildModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                     <Clock size={12} className="text-blue-500" /> Duration
                   </label>
                   <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                     <input 
                       type="number" 
                       min="1"
                       max="15"
                       value={smartInput.totalDays}
                       onChange={(e) => setSmartInput({...smartInput, totalDays: parseInt(e.target.value) || 1})}
                       className="bg-transparent font-black text-xl text-slate-900 w-full outline-none"
                     />
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Days</span>
                   </div>
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                     <PlaneTakeoff size={12} className="text-blue-500" /> Arrival
                   </label>
                   <select 
                     value={smartInput.arrivalCity}
                     onChange={(e) => setSmartInput({...smartInput, arrivalCity: e.target.value})}
                     className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs text-slate-900 shadow-sm outline-none"
                   >
                     <option value="Srinagar">Srinagar</option>
                     <option value="Jammu">Jammu</option>
                     <option value="Katra">Katra</option>
                   </select>
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                     <PlaneTakeoff size={12} className="text-blue-500 rotate-180" /> Drop City
                   </label>
                   <select 
                     value={smartInput.departureCity}
                     onChange={(e) => setSmartInput({...smartInput, departureCity: e.target.value})}
                     className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs text-slate-900 shadow-sm outline-none"
                   >
                     <option value="Srinagar">Srinagar</option>
                     <option value="Jammu">Jammu</option>
                     <option value="Katra">Katra</option>
                   </select>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                   <MapPin size={12} className="text-blue-500" /> Select Destinations
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Gulmarg', 'Pahalgam', 'Sonamarg', 'Dhoodpathri', 'Yusmarg', 'Gurez', 'Patnitop'].map(dest => {
                    const isSelected = smartInput.destinations.includes(dest);
                    return (
                      <button
                        key={dest}
                        onClick={() => {
                          const newDests = isSelected 
                            ? smartInput.destinations.filter(d => d !== dest)
                            : [...smartInput.destinations, dest];
                          setSmartInput({...smartInput, destinations: newDests});
                        }}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                          isSelected 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {dest}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                   <Crown size={12} className="text-amber-500" /> Luxury Tier Logic
                </label>
                <div className="grid grid-cols-3 gap-6">
                  {(['prime', 'elite', 'signature'] as const).map(tier => {
                    const isSelected = smartInput.budgetLevel === tier;
                    return (
                      <button
                        key={tier}
                        onClick={() => setSmartInput({...smartInput, budgetLevel: tier})}
                        className={`p-6 rounded-3xl text-left transition-all border-2 flex flex-col gap-2 ${
                          isSelected 
                            ? 'bg-amber-50 border-amber-500 shadow-xl shadow-amber-900/5' 
                            : 'bg-white border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <div className={`p-2 w-fit rounded-lg ${isSelected ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                           {tier === 'signature' && <Crown size={16} />}
                           {tier === 'elite' && <Trophy size={16} />}
                           {tier === 'prime' && <Award size={16} />}
                        </div>
                        <span className={`text-xs font-black uppercase tracking-widest ${isSelected ? 'text-amber-700' : 'text-slate-400'}`}>{tier}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 flex gap-4">
               <button 
                 onClick={() => setIsSmartBuildModalOpen(false)}
                 className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px]"
               >
                 Cancel
               </button>
               <button 
                 onClick={handleSmartBuild}
                 className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-900/20 hover:bg-blue-700 transition-all active:scale-95"
               >
                 Build Intelligent Flow
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Hotel Photo Viewer Modal */}
      {viewingHotelPhotos && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[210] flex flex-col animate-in fade-in duration-300 no-print p-6">
           <div className="flex items-center justify-between mb-6 shrink-0 bg-white/5 p-4 rounded-3xl border border-white/10">
              <div className="flex items-center gap-6">
                 <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-xl">
                    <ImageIcon size={24}/>
                 </div>
                 <div>
                    <h2 className="text-xl font-black text-white tracking-tight uppercase">{viewingHotelPhotos.name}</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{viewingHotelPhotos.category} • {viewingHotelPhotos.location}</p>
                 </div>
              </div>
              <button 
                onClick={() => setViewingHotelPhotos(null)} 
                className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-2xl active:scale-95 border border-blue-500"
              >
                 <X size={28} strokeWidth={3} />
              </button>
           </div>

           <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {(viewingHotelPhotos.gallery || []).map((img, idx) => (
                    <div key={idx} className="rounded-[32px] overflow-hidden border border-white/10 shadow-2xl aspect-video bg-slate-900">
                       <img src={img} className="w-full h-full object-cover" alt={`Gallery ${idx}`} />
                    </div>
                 ))}
                 {(viewingHotelPhotos.gallery || []).length === 0 && (
                    <div className="col-span-full h-96 flex flex-col items-center justify-center text-slate-500 opacity-20">
                       <ImageIcon size={100} />
                       <p className="font-black uppercase tracking-[0.3em] mt-4 text-xl">No Photos in Gallery</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TripBuilder;
