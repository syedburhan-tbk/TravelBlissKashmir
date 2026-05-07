
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  Hotel as HotelIcon, 
  MapPin, 
  Phone, 
  Plus, 
  Layers, 
  Anchor, 
  Stars, 
  Wallet, 
  X, 
  Check, 
  Edit2, 
  Eye, 
  Clock, 
  IndianRupee, 
  Image as ImageIcon, 
  Trash2,
  Calendar,
  Info,
  ChevronRight,
  Coffee,
  Utensils,
  Sun,
  BedDouble,
  Link as LinkIcon,
  FileText,
  Paperclip,
  Download,
  ExternalLink,
  Globe
} from 'lucide-react';
import { HOTELS } from '../constants';
import { HotelCategory, Hotel } from '../types';

const CategoryIcon = ({ category }: { category: HotelCategory }) => {
  switch (category) {
    case HotelCategory.LUXURY: return <Stars size={14} className="text-amber-500" />;
    case HotelCategory.DELUXE: return <Layers size={14} className="text-blue-500" />;
    case HotelCategory.HOUSEBOAT: return <Anchor size={14} className="text-cyan-500" />;
    case HotelCategory.BUDGET: return <Wallet size={14} className="text-slate-500" />;
    default: return <HotelIcon size={14} />;
  }
};

const Hotels: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingHotel, setViewingHotel] = useState<Hotel | null>(null);
  const [editingHotelId, setEditingHotelId] = useState<string | null>(null);
  const [customHotels, setCustomHotels] = useState<Hotel[]>([]);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Full Form Initial State
  const initialFormState: Partial<Hotel> = {
    name: '',
    location: '',
    category: HotelCategory.DELUXE,
    ratePerNight: 0,
    contact: '',
    rateValidityDate: '',
    gallery: [],
    extraBedRate: undefined,
    epRate: undefined,
    cpRate: undefined,
    mapRate: undefined,
    apRate: undefined,
    internalNotes: '',
    hotelLink: '',
    attachmentName: '',
    attachmentType: '',
    attachmentData: ''
  };

  const [formData, setFormData] = useState<Partial<Hotel>>(initialFormState);

  useEffect(() => {
    const saved = localStorage.getItem('et_hotels');
    if (saved) setCustomHotels(JSON.parse(saved));
  }, []);

  const allHotels = useMemo(() => {
    const customIds = new Set(customHotels.map(h => h.id));
    return [...HOTELS.filter(h => !customIds.has(h.id)), ...customHotels];
  }, [customHotels]);

  const filteredHotels = useMemo(() => {
    return allHotels.filter(hotel => {
      const matchesSearch = hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           hotel.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || hotel.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [allHotels, searchTerm, categoryFilter]);

  const groupedHotels = useMemo(() => {
    const groups: Record<string, Hotel[]> = {};
    filteredHotels.forEach(hotel => {
      if (!groups[hotel.location]) groups[hotel.location] = [];
      groups[hotel.location].push(hotel);
    });
    return groups;
  }, [filteredHotels]);

  // Handle multi-image uploads for the property gallery
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Fixed: Cast the FileList result to a proper File array to prevent 'unknown' type inference
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    const imagePromises = files.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        // Fixed: Passing 'file' here is now safe because 'files' is explicitly typed as File[]
        reader.readAsDataURL(file);
      });
    });

    const newImages = await Promise.all(imagePromises);
    setFormData(prev => ({
      ...prev,
      gallery: [...(prev.gallery || []), ...newImages]
    }));
    
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      gallery: (prev.gallery || []).filter((_, i) => i !== index)
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          attachmentName: file.name,
          attachmentType: file.type,
          attachmentData: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    setEditingHotelId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (hotel: Hotel) => {
    setEditingHotelId(hotel.id);
    setFormData({ 
      ...initialFormState,
      ...hotel,
      gallery: hotel.gallery || []
    });
    setIsModalOpen(true);
  };

  const handleSaveHotel = (e: React.FormEvent) => {
    e.preventDefault();
    const hotelData: Hotel = {
      ...formData,
      id: editingHotelId || `h-custom-${Date.now()}`,
      name: formData.name || '',
      location: formData.location || '',
      category: formData.category || HotelCategory.DELUXE,
      ratePerNight: formData.epRate || formData.ratePerNight || 0,
      contact: formData.contact || '',
      gallery: formData.gallery || []
    } as Hotel;

    let updated: Hotel[];
    if (editingHotelId) {
      const index = customHotels.findIndex(h => h.id === editingHotelId);
      if (index > -1) {
        updated = [...customHotels];
        updated[index] = hotelData;
      } else updated = [...customHotels, hotelData];
    } else updated = [...customHotels, hotelData];

    setCustomHotels(updated);
    localStorage.setItem('et_hotels', JSON.stringify(updated));
    setIsModalOpen(false);
  };

  const downloadAttachment = (hotel: Hotel) => {
    if (!hotel.attachmentData) return;
    const link = document.createElement('a');
    link.href = hotel.attachmentData;
    link.download = hotel.attachmentName || 'attachment';
    link.click();
  };

  const destinations = Object.keys(groupedHotels).sort();

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hotel Inventory</h1>
          <p className="text-slate-500 text-sm">Manage net seasonal rates, meal plans, and property contracts.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95"
        >
          <Plus size={18} /> Add New Hotel
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search hotel name or location..." 
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1">
          <Layers size={16} className="text-slate-400" />
          <select 
            className="bg-transparent py-2 text-sm text-slate-900 font-bold outline-none cursor-pointer"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            {Object.values(HotelCategory).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-12">
        {destinations.map((location) => (
          <section key={location} className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="bg-slate-900 text-white p-2 rounded-xl shadow-lg"><MapPin size={20} /></div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                {location}
              </h2>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {groupedHotels[location].map(hotel => (
                <div key={hotel.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all group flex flex-col h-full shadow-sm relative">
                  <div className="relative h-32 bg-slate-100 overflow-hidden">
                    <img 
                      src={hotel.gallery?.[0] || `https://picsum.photos/seed/${hotel.id}/400/200`} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80" 
                      alt={hotel.name}
                    />
                    <div className="absolute top-3 left-3">
                       <span className="flex items-center gap-1.5 px-2 py-1 bg-white/90 backdrop-blur border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-700 shadow-sm">
                        <CategoryIcon category={hotel.category} />
                        {hotel.category}
                       </span>
                    </div>
                    <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <button onClick={() => setViewingHotel(hotel)} className="p-2 bg-white/90 backdrop-blur rounded-full text-slate-400 hover:text-blue-600 hover:bg-white shadow-sm transition-colors"><Eye size={14} /></button>
                      <button onClick={() => openEditModal(hotel)} className="p-2 bg-white/90 backdrop-blur rounded-full text-slate-400 hover:text-blue-600 hover:bg-white shadow-sm transition-colors"><Edit2 size={14} /></button>
                    </div>
                  </div>
                  
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-slate-800 text-base leading-tight mb-2 truncate" title={hotel.name}>{hotel.name}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {hotel.cpRate && <div className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-black">CP: ₹{hotel.cpRate.toLocaleString()}</div>}
                      {hotel.mapRate && <div className="text-[9px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-black">MAP: ₹{hotel.mapRate.toLocaleString()}</div>}
                    </div>
                    <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-black uppercase text-slate-400">Net EP Rate</span>
                        <div className="text-lg font-black text-slate-900">₹{(hotel.epRate || hotel.ratePerNight).toLocaleString()}</div>
                      </div>
                      <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Viewing Details Modal */}
      {viewingHotel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="h-72 relative bg-slate-900 group">
              <img 
                src={viewingHotel.gallery?.[0] || `https://picsum.photos/seed/${viewingHotel.id}/1200/600`} 
                className="w-full h-full object-cover opacity-60" 
                alt={viewingHotel.name}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
              <button onClick={() => setViewingHotel(null)} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all z-10"><X size={24} /></button>
              <div className="absolute bottom-8 left-10">
                <div className="flex items-center gap-2 mb-2">
                   <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase rounded-full shadow-lg">{viewingHotel.category}</span>
                   <span className="text-blue-300 text-xs font-bold uppercase tracking-widest">{viewingHotel.location}</span>
                </div>
                <h2 className="text-5xl font-black text-white leading-tight drop-shadow-md">{viewingHotel.name}</h2>
              </div>
            </div>

            <div className="p-10 space-y-12">
              {viewingHotel.gallery && viewingHotel.gallery.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-3">
                    <div className="w-8 h-px bg-slate-200" /> Property Gallery
                  </h4>
                  <div className="grid grid-cols-5 gap-4">
                    {viewingHotel.gallery.map((img, i) => (
                      <div key={i} className="aspect-video rounded-2xl overflow-hidden shadow-sm hover:scale-105 transition-transform duration-300 cursor-pointer">
                        <img src={img} className="w-full h-full object-cover" alt="Hotel" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                 <div className="md:col-span-8 space-y-10">
                    <div>
                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Commercial Rates (Net)</h4>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl shadow-sm">
                          <div className="flex items-center gap-2 mb-2"><Sun size={14} className="text-slate-400" /><span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">EP Plan</span></div>
                          <span className="text-2xl font-black text-slate-900">₹{(viewingHotel.epRate || viewingHotel.ratePerNight).toLocaleString()}</span>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl shadow-sm">
                          <div className="flex items-center gap-2 mb-2"><Coffee size={14} className="text-emerald-500" /><span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">CP Plan</span></div>
                          <span className="text-2xl font-black text-slate-900">{viewingHotel.cpRate ? `₹${viewingHotel.cpRate.toLocaleString()}` : 'N/A'}</span>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl shadow-sm">
                          <div className="flex items-center gap-2 mb-2"><Utensils size={14} className="text-blue-500" /><span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">MAP Plan</span></div>
                          <span className="text-2xl font-black text-slate-900">{viewingHotel.mapRate ? `₹${viewingHotel.mapRate.toLocaleString()}` : 'N/A'}</span>
                        </div>
                        <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl shadow-sm">
                          <div className="flex items-center gap-2 mb-2"><Utensils size={14} className="text-indigo-500" /><span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">AP Plan</span></div>
                          <span className="text-2xl font-black text-slate-900">{viewingHotel.apRate ? `₹${viewingHotel.apRate.toLocaleString()}` : 'N/A'}</span>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl shadow-sm">
                          <div className="flex items-center gap-2 mb-2"><BedDouble size={14} className="text-amber-500" /><span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">Extra Bed</span></div>
                          <span className="text-2xl font-black text-slate-900">{viewingHotel.extraBedRate ? `₹${viewingHotel.extraBedRate.toLocaleString()}` : 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Additional Information</h4>
                      <div className="grid grid-cols-2 gap-6">
                        {viewingHotel.hotelLink && (
                          <a href={viewingHotel.hotelLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors group">
                             <div className="bg-blue-100 p-3 rounded-xl text-blue-600 group-hover:scale-110 transition-transform"><Globe size={20} /></div>
                             <div>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Website</p>
                               <p className="text-sm font-bold text-blue-600 truncate max-w-[150px]">{viewingHotel.hotelLink.replace('https://', '')}</p>
                             </div>
                          </a>
                        )}
                        {viewingHotel.attachmentData && (
                          <button onClick={() => downloadAttachment(viewingHotel)} className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors group">
                             <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform"><FileText size={20} /></div>
                             <div className="text-left">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contract Doc</p>
                               <p className="text-sm font-bold text-slate-800">Download PDF</p>
                             </div>
                          </button>
                        )}
                      </div>
                    </div>

                    {viewingHotel.internalNotes && (
                      <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 flex items-center gap-2">
                           <Info size={14} /> Operational/Sales Notes
                        </h4>
                        <p className="text-base text-slate-300 leading-relaxed italic">"{viewingHotel.internalNotes}"</p>
                      </div>
                    )}
                 </div>

                 <div className="md:col-span-4 space-y-6">
                    <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 space-y-6 shadow-sm">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Contact Phone</p>
                          <p className="text-lg font-black text-slate-900 flex items-center gap-3"><Phone size={18} className="text-blue-500"/> {viewingHotel.contact}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Rate Expiry</p>
                          <p className="text-base font-bold text-slate-700 flex items-center gap-3"><Clock size={18} className="text-amber-500"/> {viewingHotel.rateValidityDate ? new Date(viewingHotel.rateValidityDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Always Valid'}</p>
                        </div>
                        <div className="pt-4 flex flex-col gap-3">
                           <button onClick={() => { setViewingHotel(null); openEditModal(viewingHotel); }} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2">
                             <Edit2 size={16} /> Edit Entry
                           </button>
                           <button onClick={() => setViewingHotel(null)} className="w-full py-4 bg-white text-slate-500 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-50 transition-all">
                             Close
                           </button>
                        </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Hotel Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-white p-6 border-b border-slate-100 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg">
                  {editingHotelId ? <Edit2 size={20} /> : <HotelIcon size={20} />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{editingHotelId ? `Edit Property Inventory` : 'New Property Registration'}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kashmir Operational Database</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X size={20} /></button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto bg-slate-50/30">
              <form onSubmit={handleSaveHotel} className="p-8 space-y-12 pb-24">
                
                {/* Media Section */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                    <h4 className="text-xs font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                      <ImageIcon size={16} /> Property Media Gallery
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {formData.gallery?.length || 0} Photos Added
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {formData.gallery?.map((img, i) => (
                      <div key={i} className="aspect-square rounded-2xl overflow-hidden relative group border border-slate-200 shadow-sm">
                        <img src={img} className="w-full h-full object-cover" alt="Gallery item" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button type="button" onClick={() => removeGalleryImage(i)} className="p-2 bg-red-600 text-white rounded-full hover:scale-110 transition-transform"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                    <button 
                      type="button" 
                      onClick={() => galleryInputRef.current?.click()}
                      className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/30 transition-all"
                    >
                      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 mb-2">
                        <Plus size={24} className="text-blue-600" />
                      </div>
                      <span className="text-[9px] font-black uppercase mt-1">Add Photo</span>
                      <input type="file" multiple ref={galleryInputRef} className="hidden" onChange={handleGalleryUpload} accept="image/*" />
                    </button>
                  </div>
                </div>

                {/* Core Info Section */}
                <div className="space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-widest text-blue-600 border-b border-blue-50 pb-2">Core Property Information</h4>
                  <div className="grid grid-cols-2 gap-6">
                      <div className="col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Hotel Name</label>
                        <input required type="text" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 shadow-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Location / City</label>
                        <input required type="text" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 shadow-sm" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Category</label>
                        <select className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-black text-slate-900 focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as HotelCategory})}>
                          {Object.values(HotelCategory).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Operational Phone</label>
                        <input required type="text" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 shadow-sm" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Official URL (Optional)</label>
                        <input type="url" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 shadow-sm" placeholder="https://..." value={formData.hotelLink} onChange={e => setFormData({...formData, hotelLink: e.target.value})} />
                      </div>
                  </div>
                </div>

                {/* Pricing Section */}
                <div className="space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-widest text-blue-600 border-b border-blue-50 pb-2">Seasonal Pricing (Net Rates)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1"><Sun size={12}/> EP Rate</label>
                      <input type="number" className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl outline-none font-black text-blue-900 shadow-sm" value={formData.epRate || formData.ratePerNight || ''} onChange={e => setFormData({...formData, epRate: parseInt(e.target.value) || 0, ratePerNight: parseInt(e.target.value) || 0})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1"><Coffee size={12}/> CP Rate</label>
                      <input type="number" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-black text-slate-900 shadow-sm" value={formData.cpRate || ''} onChange={e => setFormData({...formData, cpRate: parseInt(e.target.value) || undefined})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1"><Utensils size={12}/> MAP Rate</label>
                      <input type="number" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-black text-slate-900 shadow-sm" value={formData.mapRate || ''} onChange={e => setFormData({...formData, mapRate: parseInt(e.target.value) || undefined})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1"><Utensils size={12}/> AP Rate</label>
                      <input type="number" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-black text-slate-900 shadow-sm" value={formData.apRate || ''} onChange={e => setFormData({...formData, apRate: parseInt(e.target.value) || undefined})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1"><BedDouble size={12}/> Extra Bed Cost</label>
                      <input type="number" className="w-full px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl outline-none font-black text-amber-900 shadow-sm" value={formData.extraBedRate || ''} onChange={e => setFormData({...formData, extraBedRate: parseInt(e.target.value) || undefined})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Rate Valid Until</label>
                      <input type="date" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-900 shadow-sm" value={formData.rateValidityDate} onChange={e => setFormData({...formData, rateValidityDate: e.target.value})} />
                    </div>
                  </div>
                </div>

                {/* Operations Section */}
                <div className="space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-widest text-blue-600 border-b border-blue-50 pb-2">Operational Meta</h4>
                  <div className="grid grid-cols-2 gap-6">
                      <div className="col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Internal Notes (Hidden from clients)</label>
                        <textarea rows={3} placeholder="Add tips for sales/ops team..." className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-medium text-slate-900 shadow-sm" value={formData.internalNotes} onChange={e => setFormData({...formData, internalNotes: e.target.value})} />
                      </div>
                      <div className="col-span-2 space-y-3">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Contract / Seasonal PDF</label>
                         <div className="flex items-center gap-4">
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all hover:bg-slate-800 shadow-lg shadow-slate-200">
                               <Paperclip size={16}/> Select File
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx" />
                            {formData.attachmentName && (
                              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-100">
                                 <Check size={14}/> {formData.attachmentName}
                              </div>
                            )}
                         </div>
                      </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-white flex gap-4 z-10">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-500 font-bold rounded-2xl transition-all hover:bg-slate-50">Cancel</button>
              <button onClick={handleSaveHotel} type="button" className="flex-1 py-4 bg-blue-600 text-white font-black uppercase tracking-[0.1em] text-xs rounded-2xl shadow-xl transition-all hover:bg-blue-700 flex items-center justify-center gap-2">
                <Check size={18} /> {editingHotelId ? 'Update Inventory Record' : 'Save Property to Database'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hotels;
