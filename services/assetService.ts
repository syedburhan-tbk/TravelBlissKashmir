import { DestinationImage, ItineraryDay } from '../types';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

let _workspaceId: string | null = null;
export function setAssetWorkspaceId(id: string | null) {
  _workspaceId = id;
}

export async function getRandomImagesForDestination(destination: string | undefined | null, count: number = 2): Promise<string[]> {
  if (!destination || !_workspaceId) return [];
  
  try {
    const destAssetsRef = collection(db, `workspaces/${_workspaceId}/destination_assets`);
    // Due to simple search, we will fetch all and filter client side.
    // In production with large sets, this would use a proper querying approach.
    const snapshot = await getDocs(destAssetsRef);
    const allImages: any[] = [];
    snapshot.forEach(doc => allImages.push(doc.data()));
    
    if (allImages.length === 0) return [];
    
    const searchStr = (destination || '').toLowerCase();
    
    const relevantImages = allImages.filter(img => 
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

export async function populateItineraryWithRandomImages(itinerary: ItineraryDay[]): Promise<ItineraryDay[]> {
  if (!itinerary) return [];
  
  const promises = itinerary.map(async day => {
    try {
      // Determine primary destination for the day
      const destination = day.location || day.title;
      const randomImages = await getRandomImagesForDestination(destination);
      
      return {
        ...day,
        images: randomImages.length > 0 ? randomImages : (day.images || [])
      };
    } catch (e) {
      console.error('Error populating day with images:', e);
      return day;
    }
  });
  
  return Promise.all(promises);
}
