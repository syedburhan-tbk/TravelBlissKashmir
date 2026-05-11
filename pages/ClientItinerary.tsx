
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Printer, 
  ArrowLeft, 
  Download, 
  Loader2, 
  Phone,
  Mail,
  Check,
  X,
  MapPin,
  Clock,
  Compass,
  Bed,
  Car,
  Link as LinkIcon,
  ChevronDown,
  Star,
  MessageCircle,
  Calendar,
  Users,
  Instagram,
  ArrowRight
} from 'lucide-react';
import { 
  MOCK_TRIPS, 
  BRAND_CONFIG, 
  HOTELS, 
  VEHICLES, 
  PAYMENT_TERMS,
  CANCELLATION_POLICY,
  DEFAULT_INCLUSIONS,
  DEFAULT_EXCLUSIONS
} from '../constants';
import { Trip, HotelCategory } from '../types';
import { safeLocalStorage, STORAGE_KEYS } from '../utils/storage';

import { tripService } from '../services/tripService';
import { useAuth } from '../contexts/AuthContext';

const ClientItinerary: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [agencyConfig, setAgencyConfig] = useState(() => {
    const saved = safeLocalStorage.getItem(STORAGE_KEYS.BRAND_CONFIG);
    return saved ? JSON.parse(saved) : BRAND_CONFIG;
  });
  const [copied, setCopied] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTrip = async () => {
      setLoading(true);
      if (id) {
        const foundTrip = await tripService.getTrip(id);
        if (foundTrip) {
          setTrip(foundTrip);
          // Set dynamic SEO metadata
          document.title = `Your Itinerary: ${foundTrip.tripName.split(' - ')[1] || foundTrip.tripName} | Travel Bliss`;
          
          // Update meta description
          const metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc) {
            metaDesc.setAttribute('content', `Exclusive ${foundTrip.tripType} curated by Travel Bliss. Duration: ${foundTrip.itinerary.length} Days.`);
          }
        }
      }
      setLoading(false);
    };

    fetchTrip();
  }, [id]);

  const masterHotels = useMemo(() => {
    const saved = safeLocalStorage.getItem(STORAGE_KEYS.HOTELS);
    const custom = saved ? JSON.parse(saved) : [];
    return [...HOTELS, ...custom];
  }, []);

  const masterVehicles = useMemo(() => {
    const saved = safeLocalStorage.getItem(STORAGE_KEYS.VEHICLES);
    const custom = saved ? JSON.parse(saved) : [];
    return [...VEHICLES, ...custom];
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = async () => {
    if (!trip || !printableRef.current || isGenerating) return;
    setIsGenerating(true);
    const scrollPos = window.scrollY;
    
    setTimeout(async () => {
      window.scrollTo(0, 0); 
      try {
        const h2p = (window as any).html2pdf;
        const element = printableRef.current;
        if (!element) return;

        const originalStyle = element.getAttribute('style') || '';
        element.style.width = '1100px';
        element.style.maxWidth = '1100px';
        element.style.margin = '0';
        element.style.padding = '0';
        element.classList.add('pdf-rendering');
        
        const opt = {
          margin: 0, 
          filename: `${trip.client.name.replace(/ /g, '_')}_Proposal.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true, 
            logging: false,
            windowWidth: 1100,
            width: 1100,
            scrollX: 0,
            scrollY: 0,
            x: 0,
            y: 0,
            backgroundColor: '#FDFBF7'
          },
          jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'] }
        };

        await h2p().from(element).set(opt).save();
        
        element.classList.remove('pdf-rendering');
        element.setAttribute('style', originalStyle);
      } catch (err) {
        console.error('PDF Error:', err);
      } finally {
        window.scrollTo(0, scrollPos);
        setIsGenerating(false);
      }
    }, 500);
  };

  const itineraryLocations = useMemo(() => {
    if (!trip || !Array.isArray(trip.itinerary)) return [];
    const locs: string[] = [];
    trip.itinerary.slice(0, -1).forEach(day => {
       if (!day) return;
       const loc = day.location || masterHotels.find(h => h.id === day.hotelId)?.location || 'Srinagar';
       if (!locs.includes(loc)) locs.push(loc);
    });
    return locs;
  }, [trip, masterHotels]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 border-4 border-[#C5A059]/20 border-t-[#C5A059] rounded-full animate-spin" />
        <p className="text-[#C5A059] font-black uppercase tracking-[0.3em] text-xs">Accessing Private Dossier</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-[#0F1115] flex flex-col items-center justify-center p-8 text-center space-y-6 text-[#FDFBF7]">
        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mb-4 border border-rose-500/20">
          <X size={40} />
        </div>
        <h1 className="text-4xl font-serif italic tracking-tight">Access Denied / Not Found</h1>
        <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
          The requested itinerary link is either expired, invalid, or requires authorization. 
          Please contact your <span className="text-[#C5A059] font-bold">Travel Bliss</span> concierge for assistance.
        </p>
        <button 
          onClick={() => navigate('/')}
          className="mt-8 px-12 py-4 bg-[#C5A059] text-white font-black uppercase tracking-widest text-[11px] rounded-full hover:bg-white hover:text-black transition-all shadow-xl shadow-[#C5A059]/10"
        >
          Return to HQ
        </button>
      </div>
    );
  }

  const durationDays = trip.itinerary?.length || 0;
  const durationNights = Math.max(0, durationDays - 1);
  
  const tiers = [
    { id: 'signature', name: 'Elite Signature', price: trip.tierPrices?.signature || 0, color: 'text-slate-400', bg: 'bg-slate-50 border-slate-200' },
    { id: 'elite', name: 'Elite Premier', price: trip.tierPrices?.elite || 0, color: 'text-blue-400', bg: 'bg-blue-50 border-blue-200' },
    { id: 'prime', name: 'Elite Prime', price: trip.tierPrices?.prime || 0, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200' },
  ].filter(t => t.price > 0);

  const proposalPrice = tiers.length > 0 ? tiers[0].price : 0;
  const regularPrice = proposalPrice * 1.15; // Fallback for decorative discount

  const getDayHotel = (hotelId: string | undefined) => masterHotels.find(h => h.id === hotelId);

  // Pick a cinematic image for hero (from first day if possible)
  const heroImage = (trip.itinerary && trip.itinerary[0]?.images?.[0]) || "https://images.unsplash.com/photo-1598305072042-430b3554e7f3?auto=format&fit=crop&q=80&w=2000";
  
  return (
    <div className="bg-[#F5F1E9] min-h-screen text-[#0F1115] font-sans selection:bg-[#C5A059]/30">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap');
        
        .luxury-serif { font-family: 'Playfair Display', serif; }
        .text-gold { color: #C5A059; }
        .bg-gold { background-color: #C5A059; }
        .border-gold { border-color: #C5A059; }
        
        .pdf-rendering { 
          width: 1100px !important; 
          max-width: 1100px !important; 
          background: #FDFBF7 !important; 
        }
        
        .page-break { page-break-before: always; break-before: page; }
        
        @media print {
          .no-print { display: none !important; }
          .page-break { page-break-before: always !important; }
          body { background: #FDFBF7; }
        }

        .cinematic-overlay {
          background: linear-gradient(to bottom, rgba(15,17,21,0.2) 0%, rgba(15,17,21,0.8) 100%);
        }

        .ivory-card {
          background: #FDFBF7;
          border: 1px solid rgba(197, 160, 89, 0.1);
        }
      `}</style>
      
      {/* ACTION BAR */}
      <div className="no-print sticky top-0 bg-[#FDFBF7]/80 backdrop-blur-md border-b border-[#C5A059]/10 z-[100] px-6 py-4 flex justify-between items-center shadow-sm">
        {user ? (
          <button onClick={() => navigate(`/trips/${id}`)} className="text-[#0F1115] font-medium flex items-center gap-2 hover:opacity-70 transition-all text-sm uppercase tracking-widest">
            <ArrowLeft size={16} /> Back to Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <img src={agencyConfig.logo} alt="Logo" className="h-6 w-auto opacity-80" />
          </div>
        )}
        <div className="flex items-center gap-4">
          <button onClick={handleCopyLink} className="text-[#C5A059] font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:opacity-80">
            {copied ? <Check size={14} /> : <LinkIcon size={14} />} 
            {copied ? 'Link Copied' : 'Share Link'}
          </button>
          <button onClick={handleDownloadPdf} disabled={isGenerating} className="bg-[#0F1115] text-[#FDFBF7] px-6 py-2.5 rounded-full font-bold flex items-center gap-2 hover:bg-[#C5A059] transition-all text-xs uppercase tracking-widest disabled:opacity-50">
            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {isGenerating ? 'Curating PDF...' : 'Download Proposal'}
          </button>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto flex flex-col items-center" ref={printableRef}>
        
        {/* 1. HERO COVER PAGE */}
        <section className="relative w-full h-[100vh] flex flex-col justify-end overflow-hidden">
          <img src={heroImage} className="absolute inset-0 w-full h-full object-cover" alt="Kashmir Landscapes" />
          <div className="absolute inset-0 cinematic-overlay" />
          
          <div className="relative z-10 p-12 lg:p-20 w-full text-[#FDFBF7]">
            <div className="flex justify-between items-start mb-20">
              <div className="flex flex-col gap-2">
                <img src={agencyConfig.logo} alt="Brand Logo" className="h-12 w-auto object-contain brightness-0 invert opacity-90" />
                <p className="text-[10px] uppercase font-bold tracking-[0.3em] opacity-60">Elite Concierge Service</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-60 mb-1">Ref No</p>
                <p className="text-sm font-medium tracking-widest font-serif italic">#TBK-{trip.id.slice(-6).toUpperCase()}</p>
              </div>
            </div>

            <div className="max-w-4xl">
              <p className="text-[#C5A059] luxury-serif italic text-xl sm:text-2xl mb-4 tracking-wide">{agencyConfig.tagline}</p>
              <h1 className="luxury-serif text-6xl sm:text-8xl lg:text-9xl font-normal leading-[0.9] mb-8 tracking-tighter">
                {(trip.tripName || '').split(' - ')[1] || trip.tripName || 'Himalayan Retreat'}
              </h1>
              
              <div className="flex flex-wrap items-center gap-x-12 gap-y-6 mt-12 pt-12 border-t border-[#FDFBF7]/20 uppercase tracking-[0.2em] text-[10px] sm:text-xs">
                <div className="flex flex-col gap-2">
                  <span className="opacity-50">Duration</span>
                  <span className="font-bold">{durationDays} Days · {durationNights} Nights</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="opacity-50">Arrival</span>
                  <span className="font-bold">{new Date(trip.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="opacity-50">Guests</span>
                  <span className="font-bold">{trip.pax} Travelers</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. TRIP OVERVIEW PAGE */}
        <section className="w-full min-h-[80vh] bg-[#FDFBF7] p-12 lg:p-20 flex flex-col justify-center page-break">
          <div className="max-w-4xl mx-auto w-full">
            <div className="mb-16 text-center">
              <h2 className="luxury-serif text-4xl sm:text-5xl mb-4">The Grand Journey</h2>
              <p className="text-[#C5A059] uppercase tracking-[0.4em] text-[10px] font-bold">Curated for Your Essence</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: 'Cinematic Route', value: (trip.itinerary || []).map(d => d.location).filter((v, i, a) => v && a.indexOf(v) === i).join(' → ') },
                { label: 'Exclusivity', value: trip.tripType },
                { label: 'Accommodations', value: `${Array.from(new Set((trip.itinerary || []).map(d => d.hotelId).filter(Boolean))).length} Luxury Boutiques` },
                { label: 'Transport', value: 'Private Dedicated Luxury Vehicle' },
                { label: 'Total Investment', value: `₹${proposalPrice.toLocaleString()}` },
                { label: 'Guests', value: `${trip.pax} Adults` },
              ].map((item, i) => (
                <div key={i} className="p-8 ivory-card rounded-2xl flex flex-col justify-center items-center text-center space-y-3">
                  <p className="text-[10px] uppercase font-black tracking-widest text-[#C5A059] opacity-70 leading-none">{item.label}</p>
                  <p className="text-lg font-medium text-[#0F1115] luxury-serif">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-20 flex flex-col items-center">
              <div className="flex items-center gap-6 p-6 rounded-2xl bg-[#F5F1E9] border border-[#C5A059]/10">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                   <img src="https://picsum.photos/seed/concierge/100/100" alt="Concierge" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-[#C5A059]">Assigned Concierge</p>
                  <p className="font-serif italic text-lg">{trip.assignedSalesperson || 'Executive Partner'}</p>
                </div>
                <div className="h-8 w-px bg-[#C5A059]/20 ml-4 hidden sm:block"/>
                <div className="hidden sm:flex gap-4 ml-4">
                  <a href={`tel:${agencyConfig.phone}`} className="w-10 h-10 rounded-full ivory-card flex items-center justify-center hover:bg-[#C5A059] hover:text-white transition-all">
                    <Phone size={16} />
                  </a>
                  <a href={`mailto:${agencyConfig.email}`} className="w-10 h-10 rounded-full ivory-card flex items-center justify-center hover:bg-[#C5A059] hover:text-white transition-all">
                    <Mail size={16} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. DAY-BY-DAY TIMELINE */}
        <section className="w-full bg-[#F5F1E9] p-12 lg:p-20 page-break">
          <div className="max-w-4xl mx-auto">
             <div className="flex items-center gap-6 mb-16">
               <div className="h-px bg-[#0F1115]/10 flex-1"/>
               <h3 className="luxury-serif text-3xl">Our Shared Vision</h3>
               <div className="h-px bg-[#0F1115]/10 flex-1"/>
             </div>

             <div className="relative space-y-12 pl-12 border-l border-[#C5A059]/30">
               {(trip.itinerary || []).map((day, idx) => (
                 <div key={day.id} className="relative group">
                    <div className="absolute -left-[54px] top-0 w-10 h-10 rounded-full bg-[#FDFBF7] border border-[#C5A059] flex items-center justify-center text-[10px] font-bold group-hover:bg-[#C5A059] group-hover:text-white transition-all shadow-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="luxury-serif text-2xl mb-2">{day.title}</h4>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-[#C5A059] flex items-center gap-2">
                        <MapPin size={10} /> {day.location}
                        <span className="w-1 h-1 rounded-full bg-slate-300"/>
                        {idx === (trip.itinerary?.length || 0) - 1 ? 'Departure' : 'Evening at Leisure'}
                      </p>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </section>

        {/* 4. DAILY ITINERARY SECTION - Storytelling */}
        {(trip.itinerary || []).map((day, idx) => {
          const hotel = getDayHotel(day.hotelId);
          // Use user-uploaded images if available, else high-end sample
          const dayImage = day.images && day.images.length > 0 
            ? day.images[0] 
            : "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&q=80&w=1200";
          
          return (
            <section key={day.id} className="w-full bg-[#FDFBF7] page-break">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className={`h-[50vh] lg:h-auto overflow-hidden ${idx % 2 === 0 ? 'lg:order-1' : 'lg:order-2'}`}>
                  <img src={dayImage} className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-1000" alt={day.title} />
                </div>
                <div className={`p-12 lg:p-20 flex flex-col justify-center ${idx % 2 === 0 ? 'lg:order-2' : 'lg:order-1'}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-6xl font-serif text-[#C5A059]/20 italic leading-none">{idx + 1}</span>
                    <div className="h-px w-12 bg-[#0F1115]/10" />
                    <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-[#C5A059]">The Awakening</span>
                  </div>
                  
                  <h2 className="luxury-serif text-4xl sm:text-5xl mb-8 leading-tight">{day.title}</h2>
                  
                  <div className="prose prose-slate max-w-none mb-10">
                    <p className="text-[#0F1115]/80 leading-relaxed text-lg font-light serif italic">
                      {day.clientNotes || "The mist rises over the pristine lakes as you begin your morning in the crown jewel of India. Every moment is crafted to breathe life into your soul, surrounded by snow-capped peaks and whispers of ancient history."}
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#F5F1E9] flex items-center justify-center text-[#C5A059]">
                        <Bed size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-[#0F1115]/40 mb-1">Your Sanctuary</p>
                        <p className="font-serif italic text-lg">{hotel?.name || 'Private Villa'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#F5F1E9] flex items-center justify-center text-[#C5A059]">
                        <Compass size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-[#0F1115]/40 mb-1">Cuisine Experience</p>
                        <p className="font-serif italic text-lg">{day.mealPlan || 'Curated Breakfast & Dinner'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })}

        {/* 5. ACCOMMODATIONS COMPARISON SECTION */}
        <section className="w-full bg-[#F5F1E9] p-12 lg:p-20 page-break">
          <div className="max-w-screen-xl mx-auto">
             <div className="mb-16">
               <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-[#C5A059]">BEYOND STAYING</span>
               <h3 className="luxury-serif text-4xl sm:text-5xl mt-4">Tiered Accommodations</h3>
               <p className="text-[#0F1115]/50 text-xs mt-2 uppercase tracking-widest font-bold">Compare elite selections across our curated categories</p>
             </div>

             <div className="overflow-x-auto">
               <table className="w-full border-collapse table-fixed">
                 <thead>
                   <tr>
                     <th className="w-[18%] p-6 text-left text-[10px] uppercase tracking-[0.3em] font-black text-slate-400 bg-white/50 rounded-tl-3xl">Destination</th>
                     <th className="w-[27.33%] p-6 text-left text-[10px] uppercase tracking-[0.3em] font-black text-slate-500 bg-slate-50">Elite Signature</th>
                     <th className="w-[27.33%] p-6 text-left text-[10px] uppercase tracking-[0.3em] font-black text-blue-600 bg-blue-50/50">Elite Premier</th>
                     <th className="w-[27.33%] p-6 text-left text-[10px] uppercase tracking-[0.3em] font-black text-amber-600 bg-amber-50/50 rounded-tr-3xl">Elite Prime</th>
                   </tr>
                 </thead>
                 <tbody className="bg-white">
                   {itineraryLocations.map((loc, idx) => {
                      const hotelTiers = Array.isArray(trip.hotelTiers) ? trip.hotelTiers : Object.values(trip.hotelTiers || {});
                      const tierSelection: any = hotelTiers.find((t: any) => t.location === loc);
                      return (
                        <tr key={loc} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                          <td className="p-6 font-black uppercase tracking-widest text-xs text-slate-900 bg-slate-50/30">
                            <div className="flex items-center gap-2">
                              <MapPin size={12} className="text-[#C5A059]" />
                              {loc}
                            </div>
                          </td>
                          <td className="p-6 text-[10px] text-slate-500 font-medium whitespace-normal">
                            <div className="flex flex-col gap-3">
                              <div className="w-full aspect-[16/10] rounded-2xl overflow-hidden shrink-0 border border-slate-100 bg-slate-50 shadow-sm">
                                <img 
                                  src={getDayHotel(tierSelection?.signatureHotelId)?.gallery?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400'} 
                                  className="w-full h-full object-cover transition-transform hover:scale-110 duration-700" 
                                  alt="" 
                                />
                              </div>
                              <span className="italic font-bold text-slate-900 leading-tight block truncate">{getDayHotel(tierSelection?.signatureHotelId)?.name || 'Standard Boutique'}</span>
                            </div>
                          </td>
                          <td className="p-6 text-[10px] text-blue-900 font-bold whitespace-normal">
                            <div className="flex flex-col gap-3">
                              <div className="w-full aspect-[16/10] rounded-2xl overflow-hidden shrink-0 border border-blue-100 bg-blue-50 shadow-sm">
                                <img 
                                  src={getDayHotel(tierSelection?.eliteHotelId)?.gallery?.[0] || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=400'} 
                                  className="w-full h-full object-cover transition-transform hover:scale-110 duration-700" 
                                  alt="" 
                                />
                              </div>
                              <span className="text-blue-900 font-bold leading-tight block truncate">{getDayHotel(tierSelection?.eliteHotelId)?.name || 'Deluxe Curator'}</span>
                            </div>
                          </td>
                          <td className="p-6 text-[10px] text-amber-900 font-black whitespace-normal">
                            <div className="flex flex-col gap-3">
                              <div className="w-full aspect-[16/10] rounded-2xl overflow-hidden shrink-0 border border-amber-100 bg-amber-50 shadow-sm">
                                <img 
                                  src={getDayHotel(tierSelection?.primeHotelId)?.gallery?.[0] || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=400'} 
                                  className="w-full h-full object-cover transition-transform hover:scale-110 duration-700" 
                                  alt="" 
                                />
                              </div>
                              <span className="text-amber-950 font-black leading-tight block truncate">{getDayHotel(tierSelection?.primeHotelId)?.name || 'Luxury Grande'}</span>
                            </div>
                          </td>
                        </tr>
                      );
                   })}
                 </tbody>
               </table>
             </div>

             <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
               {(() => {
                 // Collect a few representative hotels across tiers for visual showcase
                 const showcaseHotels: { id: string, tier: string, color: string }[] = [];
                 
                 itineraryLocations.slice(0, 2).forEach(loc => {
                   const hotelTiers = Array.isArray(trip.hotelTiers) ? trip.hotelTiers : Object.values(trip.hotelTiers || {});
                   const selection: any = hotelTiers.find((t: any) => t.location === loc);
                   if (selection?.primeHotelId) showcaseHotels.push({ id: selection.primeHotelId, tier: 'Elite Prime', color: 'text-amber-600' });
                   if (selection?.eliteHotelId) showcaseHotels.push({ id: selection.eliteHotelId, tier: 'Elite Premier', color: 'text-blue-600' });
                   if (selection?.signatureHotelId) showcaseHotels.push({ id: selection.signatureHotelId, tier: 'Elite Signature', color: 'text-slate-500' });
                 });

                 return showcaseHotels.slice(0, 6).map((item, idx) => {
                   const hotel = getDayHotel(item.id);
                   if (!hotel) return null;
                   const hotelImage = hotel.gallery?.[0] || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1200";

                   return (
                     <div key={idx} className="overflow-hidden ivory-card rounded-3xl flex flex-col group transition-all hover:shadow-xl hover:border-[#C5A059]/30">
                       <div className="h-64 overflow-hidden relative">
                         <img src={hotelImage} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000" alt={hotel.name} />
                         <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full shadow-sm">
                           <p className={`text-[8px] font-black uppercase tracking-widest ${item.color}`}>{item.tier}</p>
                         </div>
                       </div>
                       <div className="p-8 flex-1 flex flex-col justify-center">
                          <div className="flex gap-1 mb-3">
                             {[...Array(5)].map((_, i) => (
                               <Star key={i} size={10} className="fill-[#C5A059] text-[#C5A059]" />
                             ))}
                          </div>
                          <h4 className="luxury-serif text-2xl mb-3">{hotel.name}</h4>
                          <div className="flex justify-between items-end">
                            <p className="text-[10px] uppercase tracking-widest font-black text-[#C5A059] opacity-70">{hotel.location}</p>
                            <span className="text-[8px] uppercase font-bold text-slate-400">Curated Choice</span>
                          </div>
                       </div>
                     </div>
                   );
                 });
               })()}
             </div>
          </div>
        </section>

        {/* 6. INVESTMENT SECTION */}
        <section className="w-full bg-[#0F1115] text-[#FDFBF7] p-12 lg:p-20 page-break">
          <div className="max-w-4xl mx-auto text-center">
             <span className="text-[10px] uppercase font-bold tracking-[0.6em] text-[#C5A059] mb-8 block">THE SOPHISTICATED CHOICE</span>
             <h3 className="luxury-serif text-4xl sm:text-6xl mb-12">Tiered Selections</h3>
             
             {tiers.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                 {tiers.map((tier) => (
                   <div key={tier.id} className={`p-8 rounded-[32px] border-2 ${tier.id === 'elite' ? 'border-[#C5A059] bg-[#C5A059]/5' : 'border-white/10 bg-white/5'} flex flex-col items-center gap-4 transition-all hover:scale-105`}>
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${tier.color}`}>{tier.name}</span>
                      <div className="text-3xl font-serif text-[#FDFBF7]">₹{tier.price.toLocaleString()}</div>
                      <div className="h-px w-8 bg-white/20" />
                      <p className="text-[8px] uppercase tracking-widest opacity-50 font-bold">Inclusive Price</p>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="p-12 border border-[#C5A059]/30 rounded-[4rem] mb-12">
                 <div className="text-6xl sm:text-8xl font-serif text-[#C5A059] mb-4 italic">₹{proposalPrice.toLocaleString()}</div>
                 <p className="text-sm uppercase tracking-widest font-bold opacity-60">Complete Curated Journey for {trip.pax} Guests</p>
               </div>
             )}
             
             <div className="mt-16 pt-16 border-t border-[#FDFBF7]/10 grid grid-cols-2 sm:grid-cols-4 gap-8">
                <div>
                  <p className="text-[10px] opacity-40 mb-2 uppercase tracking-widest">Pricing Model</p>
                  <p className="font-serif italic text-lg">{tiers.length > 0 ? 'Tiered Options' : 'Fixed Quota'}</p>
                </div>
                <div>
                  <p className="text-[10px] opacity-40 mb-2 uppercase tracking-widest">Exclusive Concierge</p>
                  <p className="font-serif italic text-lg">Included</p>
                </div>
                <div>
                  <p className="text-[10px] opacity-40 mb-2 uppercase tracking-widest">Insurance</p>
                  <p className="font-serif italic text-lg">Included</p>
                </div>
                <div>
                  <p className="text-[10px] opacity-40 mb-2 uppercase tracking-widest">Happiness</p>
                  <p className="font-serif italic text-lg">Unlimited</p>
                </div>
             </div>
          </div>
        </section>

        {/* 7. INCLUSIONS / EXCLUSIONS */}
        <section className="w-full bg-[#FDFBF7] p-12 lg:p-20 page-break grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="p-10 ivory-card rounded-3xl">
             <h3 className="luxury-serif text-2xl mb-10 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#C5A059]/10 flex items-center justify-center text-[#C5A059]">
                  <Check size={20} />
                </div>
                Included Experiences
             </h3>
             <ul className="space-y-6">
                {(trip.inclusions || DEFAULT_INCLUSIONS).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C5A059] mt-2 shrink-0"/>
                    <p className="text-sm font-light text-[#0F1115]/80 leading-relaxed italic font-serif">
                      {item}
                    </p>
                  </li>
                ))}
             </ul>
          </div>
          <div className="p-10 ivory-card rounded-3xl opacity-60">
             <h3 className="luxury-serif text-2xl mb-10 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                  <X size={20} />
                </div>
                Awaiting Customization
             </h3>
             <ul className="space-y-6">
                {(trip.exclusions || DEFAULT_EXCLUSIONS).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0"/>
                    <p className="text-sm font-light text-[#0F1115]/80 leading-relaxed italic font-serif">
                      {item}
                    </p>
                  </li>
                ))}
             </ul>
          </div>
        </section>

        {/* 8. TERMS & POLICIES */}
        <section className="w-full bg-[#F5F1E9] p-12 lg:p-20 page-break">
           <div className="max-w-4xl mx-auto space-y-16">
              <div>
                <h4 className="text-[10px] uppercase font-bold tracking-[0.4em] text-[#C5A059] mb-6">THE ESSENTIALS</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div>
                      <p className="luxury-serif text-xl mb-6 italic underline decoration-[#C5A059]/30">Payment Etiquette</p>
                      <ul className="text-xs space-y-4 text-[#0F1115]/60 font-medium tracking-wide">
                        {PAYMENT_TERMS.map((t, i) => <li key={i}>· {t}</li>)}
                      </ul>
                   </div>
                   <div>
                      <p className="luxury-serif text-xl mb-6 italic underline decoration-[#C5A059]/30">Cancellation Policy</p>
                      <p className="text-xs text-[#0F1115]/60 font-medium tracking-wide leading-relaxed">
                        {CANCELLATION_POLICY.join(' ')}
                      </p>
                   </div>
                </div>
              </div>
           </div>
        </section>

        {/* 9. THANK YOU & CTA */}
        <section className="w-full bg-[#FDFBF7] p-12 lg:p-20 flex flex-col items-center text-center page-break">
            <div className="max-w-2xl">
              <img src={agencyConfig.logo} alt="Logo" className="h-16 w-auto mb-12 grayscale opacity-40 mx-auto" />
              <h2 className="luxury-serif text-5xl sm:text-6xl mb-8 italic">The Mountains are Waiting</h2>
              <p className="text-lg text-[#0F1115]/70 italic font-serif leading-relaxed mb-12">
                "In Kashmir, every season tells a different story. We hope to be part of yours."
              </p>
              
              <div className="no-print flex flex-col sm:flex-row gap-4 justify-center items-center">
                 <button className="w-full sm:w-auto bg-[#0F1115] text-[#FDFBF7] px-12 py-5 rounded-full font-bold flex items-center justify-center gap-3 hover:bg-[#C5A059] transition-all text-sm uppercase tracking-widest shadow-xl group">
                   Accept Proposal <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                 </button>
                 <a 
                   href={`https://wa.me/${agencyConfig.phone.replace(/[^0-9]/g, '')}?text=Hi! I have reviewed the luxury proposal for ${trip.tripName}. Can we discuss further?`}
                   target="_blank" rel="noreferrer"
                   className="w-full sm:w-auto bg-white border-2 border-[#0F1115] text-[#0F1115] px-12 py-5 rounded-full font-bold flex items-center justify-center gap-3 hover:bg-[#F5F1E9] transition-all text-sm uppercase tracking-widest shadow-sm"
                 >
                   Request Changes
                 </a>
              </div>

              <div className="mt-20 pt-20 border-t border-[#0F1115]/5 flex flex-col items-center">
                 <div className="flex gap-8 mb-8">
                   <Instagram className="text-[#C5A059] w-6 h-6" />
                   <MessageCircle className="text-[#C5A059] w-6 h-6" />
                   <Mail className="text-[#C5A059] w-6 h-6" />
                 </div>
                 <p className="text-[10px] uppercase font-bold tracking-[0.4em] opacity-40">Created Exclusively by {agencyConfig.name}</p>
                 <p className="text-[8px] uppercase tracking-widest opacity-20 mt-4 underline">All Rights Reserved · 2024</p>
              </div>
            </div>
        </section>

      </div>

      {/* Floating Price Tracker (Web Only) */}
      <div className="no-print fixed bottom-8 right-8 z-[100] hidden lg:block">
         <div className="ivory-card rounded-3xl p-6 shadow-2xl border border-[#C5A059]/20 flex flex-col transition-all hover:-translate-y-2">
            <span className="text-[10px] font-black uppercase text-[#C5A059] tracking-widest mb-1">Proposed Investment</span>
            <div className="flex items-end gap-2">
               <span className="text-3xl font-serif text-[#0F1115]">₹{proposalPrice.toLocaleString()}</span>
               <span className="text-xs text-slate-400 line-through mb-1">₹{regularPrice.toLocaleString()}</span>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ClientItinerary;
