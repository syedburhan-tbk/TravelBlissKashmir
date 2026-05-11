import React, { useState, useEffect } from 'react';
import { Camera, Image as ImageIcon, Plus, Trash2, MapPin, Upload, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DestinationImage } from '../types';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { useWorkspace } from '../contexts/WorkspaceContext';

const DESTINATIONS = [
  'Srinagar',
  'Gulmarg',
  'Pahalgam',
  'Sonamarg',
  'Doodhpathri',
  'Yusmarg',
  'Gurez',
  'Katra',
  'Jammu',
  'Verinag'
];

const generateImgId = () => Math.random().toString(36).substr(2, 9);

export default function DestinationAssets() {
  const { currentWorkspace } = useWorkspace();
  const [images, setImages] = useState<DestinationImage[]>([]);
  const [selectedDest, setSelectedDest] = useState(DESTINATIONS[0]);
  const [activeTab, setActiveTab] = useState<'files' | 'links'>('files');
  const [isUploading, setIsUploading] = useState(false);
  const [newImageUrls, setNewImageUrls] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!currentWorkspace) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setImages([]);
      return;
    }
    const destAssetsRef = collection(db, `workspaces/${currentWorkspace.id}/destination_assets`);
    const unsubscribe = onSnapshot(destAssetsRef, (snapshot) => {
      const loadedImages: DestinationImage[] = [];
      snapshot.forEach(doc => {
        loadedImages.push(doc.data() as DestinationImage);
      });
      setImages(loadedImages);
    }, (error) => {
      console.error("Error loading destination assets:", error);
    });
    return () => unsubscribe();
  }, [currentWorkspace]);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const result = event.target?.result;
        if (!result) {
          reject(new Error('FileReader result is empty'));
          return;
        }
        const img = new Image();
        img.src = result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress as JPEG with 0.6 quality to save massive space
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Failed to load image for compression'));
      };
      reader.onerror = () => reject(new Error('Failed to read file for compression'));
    });
  };

  const renderImage = async (file: File): Promise<DestinationImage> => {
    try {
      const compressedUrl = await compressImage(file);
      return {
        id: generateImgId(),
        destination: selectedDest,
        url: compressedUrl
      };
    } catch (error) {
      console.error('Compression error:', error);
      // Fallback to original if compression fails (though likely won't happen if reader works)
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            id: generateImgId(),
            destination: selectedDest,
            url: reader.result as string
          });
        };
        reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
        reader.readAsDataURL(file);
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    try {
      const fileList = Array.from(files);
      const results = await Promise.allSettled(fileList.map(file => renderImage(file)));
      
      const newItems: DestinationImage[] = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          newItems.push(result.value);
        } else {
          console.error(`Failed to process file ${fileList[index].name}:`, result.reason);
        }
      });
      
      if (newItems.length > 0) {
        saveImages(newItems);
      }
      
      if (newItems.length < fileList.length) {
        alert('Some images could not be processed effectively.');
      }

      setIsUploading(false);
    } catch (error) {
      console.error('Upload process error:', error);
      alert('An unexpected error occurred during upload.');
    } finally {
      setIsProcessing(false);
      if (event.target) event.target.value = '';
    }
  };

  const saveImages = async (newImages: DestinationImage[]) => {
    if (!currentWorkspace) return;
    try {
      const promises = newImages.map(img => 
        setDoc(doc(db, `workspaces/${currentWorkspace.id}/destination_assets`, img.id), img)
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Firestore save error:', error);
      alert('Error saving images to cloud. Check console for details.');
    }
  };

  const clearDestinationAssets = async () => {
    if (!currentWorkspace) return;
    if (window.confirm(`Are you sure you want to delete ALL assets for ${selectedDest}? This will delete them from the cloud.`)) {
      const toDelete = images.filter(img => img.destination === selectedDest);
      try {
        const promises = toDelete.map(img => 
          deleteDoc(doc(db, `workspaces/${currentWorkspace.id}/destination_assets`, img.id))
        );
        await Promise.all(promises);
      } catch (error) {
        console.error("Error deleting assets", error);
      }
    }
  };

  const handleBulkAdd = () => {
    const urls = newImageUrls.split('\n').filter(url => url.trim().length > 0);
    const newItems: DestinationImage[] = urls.map(url => ({
      id: Math.random().toString(36).substr(2, 9),
      destination: selectedDest,
      url: url.trim()
    }));
    
    saveImages(newItems);
    setNewImageUrls('');
    setIsUploading(false);
  };

  const removeImage = async (id: string) => {
    if (!currentWorkspace) return;
    try {
      await deleteDoc(doc(db, `workspaces/${currentWorkspace.id}/destination_assets`, id));
    } catch (error) {
      console.error("Error deleting image", error);
    }
  };

  const filteredImages = images.filter(img => img.destination === selectedDest);

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">Destination Assets</h1>
          <p className="text-slate-500 font-medium">Manage photography library for PDF generation</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={clearDestinationAssets}
            disabled={filteredImages.length === 0}
            className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all disabled:opacity-30"
          >
            Clear {selectedDest}
          </button>
          <button
            onClick={() => setIsUploading(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:-translate-y-0.5"
          >
            <Plus size={20} />
            Add To {selectedDest}
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
        {DESTINATIONS.map(dest => (
          <button
            key={dest}
            onClick={() => setSelectedDest(dest)}
            className={`px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${
              selectedDest === dest
                ? 'bg-slate-900 text-white shadow-xl translate-y-[-2px]'
                : 'bg-white text-slate-500 hover:bg-slate-50'
            }`}
          >
            {dest}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredImages.map((img) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={img.id}
              className="group relative aspect-square bg-slate-100 rounded-3xl overflow-hidden shadow-sm"
            >
              <img 
                src={img.url} 
                alt={img.destination}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => removeImage(img.id)}
                  className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              <div className="absolute top-4 left-4">
                <div className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider text-slate-900 flex items-center gap-1 shadow-sm">
                  <MapPin size={10} className="text-blue-500" />
                  {img.destination}
                </div>
              </div>
            </motion.div>
          ))}
          {filteredImages.length === 0 && (
            <div className="col-span-full py-32 flex flex-col items-center text-slate-400 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
              <Camera size={48} className="mb-4 opacity-20" />
              <p className="font-bold">No assets for {selectedDest}</p>
              <p className="text-sm">Upload photos to use in PDF itineraries</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {isUploading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="bg-white rounded-[40px] w-full max-w-xl overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Add Assets: {selectedDest}</h3>
                <div className="flex gap-4 mt-4">
                  <button 
                    onClick={() => setActiveTab('files')}
                    className={`text-sm font-bold pb-2 border-b-2 transition-all ${
                      activeTab === 'files' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'
                    }`}
                  >
                    Upload Files
                  </button>
                  <button 
                    onClick={() => setActiveTab('links')}
                    className={`text-sm font-bold pb-2 border-b-2 transition-all ${
                      activeTab === 'links' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'
                    }`}
                  >
                    Import Links
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setIsUploading(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                disabled={isProcessing}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8">
              {activeTab === 'files' ? (
                <div className="space-y-4">
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="p-4 bg-white rounded-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
                        <Upload className="text-blue-600" size={32} />
                      </div>
                      <p className="mb-2 text-sm text-slate-700 font-bold">
                        {isProcessing ? 'Processing files...' : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-xs text-slate-400">PNG, JPG or WebP (Multiple allowed)</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      multiple 
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isProcessing}
                    />
                  </label>
                  {isProcessing && (
                    <div className="flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-2xl animate-pulse">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-bold">Converting images to local assets...</span>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <textarea
                    value={newImageUrls}
                    onChange={(e) => setNewImageUrls(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-1... &#10;https://images.unsplash.com/photo-2..."
                    className="w-full h-48 p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:bg-white focus:border-blue-500 transition-all font-mono text-sm resize-none"
                  />
                  
                  <div className="mt-8 flex gap-4">
                    <button
                      onClick={() => setIsUploading(false)}
                      className="flex-1 px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkAdd}
                      disabled={!newImageUrls.trim()}
                      className="flex-[2] px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:shadow-none"
                    >
                      Import {newImageUrls.split('\n').filter(l => l.trim()).length} Images
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
