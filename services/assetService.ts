import { DestinationImage, ItineraryDay } from '../types';
import { safeLocalStorage, STORAGE_KEYS } from '../utils/storage';

export function getRandomImagesForDestination(destination: string | undefined | null, count: number = 2): string[] {
  if (!destination) return [];
  
  const saved = safeLocalStorage.getItem(STORAGE_KEYS.DEST_IMAGES);
  if (!saved) return [];
  
  try {
    const allImages = JSON.parse(saved);
    if (!Array.isArray(allImages)) return [];
    
    const searchStr = (destination || '').toLowerCase();
    
    const relevantImages = allImages.filter((img: any) => 
      img && 
      typeof img.destination === 'string' && 
      (img.destination.toLowerCase().includes(searchStr) ||
       searchStr.includes(img.destination.toLowerCase()))
    );
    
    if (relevantImages.length === 0) return [];
    
    // Shuffle and pick
    const shuffled = [...relevantImages].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map(img => img.url);
  } catch (e) {
    console.error('Error fetching images for destination:', e);
    return [];
  }
}

export function populateItineraryWithRandomImages(itinerary: ItineraryDay[]): ItineraryDay[] {
  if (!itinerary) return [];
  
  return itinerary.map(day => {
    try {
      // Determine primary destination for the day
      const destination = day.location || day.title;
      const randomImages = getRandomImagesForDestination(destination);
      
      return {
        ...day,
        images: randomImages.length > 0 ? randomImages : (day.images || [])
      };
    } catch (e) {
      console.error('Error populating day with images:', e);
      return day;
    }
  });
}
