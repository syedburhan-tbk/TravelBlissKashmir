import { ITINERARY_VARIATIONS } from '../itineraryDatabase';
import { 
  DayType, 
  ItineraryDayVariation, 
  ItineraryGenerationInput, 
  ItineraryDay, 
  TripType,
  UserRole
} from '../types';

export class ItineraryEngine {
  /**
   * USE CASE 1: Auto Build Itinerary
   * Selects best route flow based on destinations and constraints.
   */
  static buildSmartItinerary(input: ItineraryGenerationInput): ItineraryDayVariation[] {
    const { totalDays, arrivalCity, departureCity, destinations } = input;
    const plan: ItineraryDayVariation[] = [];
    const usedVariationIds = new Set<string>();

    const isSrinagarArrival = arrivalCity.toLowerCase().includes('srinagar');
    const isJammuArrival = arrivalCity.toLowerCase().includes('jammu');
    const isSrinagarDrop = departureCity.toLowerCase().includes('srinagar');
    const isJammuDrop = departureCity.toLowerCase().includes('jammu');

    // 1. SELECT MASTER FLOW PATTERN (FROM SCREENSHOTS)
    let flow: DayType[] = [];
    let flowDestinations: string[] = [];

    if (isSrinagarArrival && isSrinagarDrop) {
      if (totalDays === 4) {
        flow = [DayType.ARRIVAL, DayType.EXCURSION, DayType.EXCURSION, DayType.DROP];
        flowDestinations = ['Srinagar', 'Gulmarg', 'Pahalgam', 'Srinagar Airport'];
      } else if (totalDays === 5) {
        flow = [DayType.ARRIVAL, DayType.TRANSFER, DayType.EXCURSION, DayType.EXCURSION, DayType.DROP];
        flowDestinations = ['Pahalgam', 'Srinagar', 'Sonamarg', 'Gulmarg', 'Srinagar Airport'];
      } else if (totalDays === 6) {
        flow = [DayType.ARRIVAL, DayType.TRANSFER, DayType.EXCURSION, DayType.SIGHTSEEING, DayType.EXCURSION, DayType.DROP];
        flowDestinations = ['Pahalgam', 'Srinagar', 'Gulmarg', 'Srinagar', 'Sonamarg', 'Srinagar Airport'];
      } else if (totalDays === 7) {
        flow = [DayType.ARRIVAL, DayType.TRANSFER, DayType.EXCURSION, DayType.SIGHTSEEING, DayType.EXCURSION, DayType.EXCURSION, DayType.DROP];
        flowDestinations = ['Pahalgam', 'Srinagar', 'Gulmarg', 'Srinagar', 'Sonamarg', 'Doodhpathri', 'Srinagar Airport'];
      } else if (totalDays === 8) {
        flow = [DayType.ARRIVAL, DayType.EXCURSION, DayType.EXCURSION, DayType.SIGHTSEEING, DayType.TRANSFER, DayType.TRANSFER, DayType.TRANSFER, DayType.DROP];
        flowDestinations = ['Srinagar', 'Doodhpathri', 'Gulmarg', 'Srinagar', 'Sonamarg', 'Srinagar', 'Pahalgam', 'Srinagar Airport'];
      }
    } else if (isJammuArrival || isJammuDrop) {
      // Jammu related flows from page 3-4
      if (totalDays === 5) {
        flow = [DayType.ARRIVAL, DayType.EXCURSION, DayType.EXCURSION, DayType.TRANSFER, DayType.DROP];
        flowDestinations = ['Srinagar', 'Gulmarg', 'Sonamarg', 'Pahalgam', 'Jammu'];
      } else if (totalDays === 6) {
        flow = [DayType.ARRIVAL, DayType.TRANSFER, DayType.EXCURSION, DayType.SIGHTSEEING, DayType.EXCURSION, DayType.DROP];
        flowDestinations = ['Pahalgam', 'Srinagar', 'Sonamarg', 'Srinagar', 'Gulmarg', 'Jammu'];
      }
    }

    // 2. CONSTRUCT PLAN BASED ON FLOW OR FALLBACK
    if (flow.length === totalDays) {
      for (let i = 0; i < totalDays; i++) {
        const currentSource = i === 0 ? arrivalCity : plan[i-1].destination;
        const targetDest = flowDestinations[i];
        
        let variation = this.findVariation({
          dayType: flow[i],
          source: currentSource,
          destination: targetDest
        }, usedVariationIds);

        if (!variation) {
          variation = this.findVariation({ dayType: flow[i], destination: targetDest }, usedVariationIds) || 
                      this.findVariation({ dayType: flow[i] }, usedVariationIds) || 
                      ITINERARY_VARIATIONS[0];
        }

        plan.push(variation);
        usedVariationIds.add(variation.id);
      }
      return plan;
    }

    // FALLBACK: HEURISTIC BUILDING (if no exact flow matches)
    const firstDest = destinations[0] || 'Srinagar';
    const arrivalDay = this.findVariation({
      dayType: DayType.ARRIVAL,
      source: arrivalCity,
      destination: firstDest
    }, usedVariationIds) || ITINERARY_VARIATIONS[0];
    
    plan.push(arrivalDay);
    usedVariationIds.add(arrivalDay.id);

    // 2. INTERMEDIATE DAYS
    let currentCity = firstDest;
    const visitedDests = new Set([currentCity]);
    
    for (let i = 1; i < totalDays - 1; i++) {
        const remainingDests = destinations.filter(d => !visitedDests.has(d));
        
        // Decide if we should move or stay
        // If we have remaining destinations and we've spent at least 1-2 days in current city, move.
        const shouldMove = remainingDests.length > 0 && Math.random() > 0.3;

        if (shouldMove) {
            const nextDest = remainingDests[0];
            const transferDay = this.findVariation({
                dayType: DayType.TRANSFER,
                source: currentCity,
                destination: nextDest
            }, usedVariationIds);
            
            if (transferDay) {
                plan.push(transferDay);
                usedVariationIds.add(transferDay.id);
                currentCity = nextDest;
                visitedDests.add(nextDest);
                continue;
            }
        }

        // Sightseeing / Excursion / Leisure in current city
        // Try Sightseeing first, then Excursion, then Leisure
        let nextDay = this.findVariation({
            dayType: DayType.SIGHTSEEING,
            source: currentCity,
            destination: currentCity
        }, usedVariationIds);

        if (!nextDay) {
            nextDay = this.findVariation({
                dayType: DayType.EXCURSION,
                source: currentCity,
                destination: currentCity
            }, usedVariationIds);
        }

        if (!nextDay) {
            nextDay = this.findVariation({
                dayType: DayType.LEISURE,
                source: currentCity,
                destination: currentCity
            }, usedVariationIds);
        }

        if (nextDay) {
            plan.push(nextDay);
            usedVariationIds.add(nextDay.id);
        } else {
            // Ultimate Fallback: Generic variation if nothing matches
            const fallback = {
                ...ITINERARY_VARIATIONS[0],
                id: `fallback-${currentCity}-${i}`,
                title: `${currentCity} Exploration`,
                dayType: DayType.SIGHTSEEING,
                source: currentCity,
                destination: currentCity,
                customerDescription: `A beautiful day to explore the serene surroundings of ${currentCity}. Immerse yourself in the local culture and alpine landscapes.`
            };
            plan.push(fallback);
        }
    }

    // 3. DROP DAY
    const dropDay = this.findVariation({
        dayType: DayType.DROP,
        source: currentCity,
        destination: departureCity
    }, usedVariationIds) || ITINERARY_VARIATIONS.find(v => v.dayType === DayType.DROP) || ITINERARY_VARIATIONS[ITINERARY_VARIATIONS.length - 1];
    
    plan.push(dropDay);
    return plan;
  }

  /**
   * USE CASE 3: Luxury Upgrade Logic
   * Enhances descriptions and adds curated experiences for premium tiers.
   */
  static applyLuxuryLogic(day: ItineraryDayVariation, tier: 'prime' | 'elite' | 'signature'): Partial<ItineraryDayVariation> {
    if (tier === 'signature' && day.luxuryEnhancement) {
      return {
        customerDescription: `${day.customerDescription}\n\n${day.luxuryEnhancement}`,
        experienceTags: [...day.experienceTags, 'Elite Curated', 'Private Luxury']
      };
    }
    return {};
  }

  /**
   * USE CASE 5: Auto Add Local Rules
   */
  static getLocalRules(location: string): { notes: string; activities: string[] } {
    switch (location.toLowerCase()) {
      case 'pahalgam':
        return { 
          notes: 'ABC Valley sightseeing requires a local union cab not included in Srinagar package.', 
          activities: ['Union Cab Tour'] 
        };
      case 'gulmarg':
        return { 
          notes: 'Gondola tickets are subject to availability and should be pre-booked.', 
          activities: ['Gondola Ride'] 
        };
      case 'sonamarg':
        return { 
          notes: 'Zero point excursion is optional and requires local vehicle.', 
          activities: ['Thajiwas Glacier'] 
        };
      default:
        return { notes: '', activities: [] };
    }
  }

  /**
   * USE CASE 6: Transport Intelligence
   */
  static refineTransportWording(description: string, vehicleType: string): string {
    if (vehicleType.toLowerCase().includes('no cab') || vehicleType.toLowerCase().includes('self drive')) {
        return description.replace(/our representative will transfer you|we whisk you away/gi, 'as you proceed on your own');
    }
    if (vehicleType.toLowerCase().includes('fortuner') || vehicleType.toLowerCase().includes('crysta')) {
        return description.replace(/transfer|journey/gi, 'luxurious drive');
    }
    return description;
  }

  /**
   * Helper to find best matching variation
   */
  private static findVariation(
    criteria: { dayType?: DayType, source?: string, destination?: string, season?: string }, 
    excludeIds: Set<string> = new Set()
  ): ItineraryDayVariation | undefined {
    // Filter matching variations
    const matches = ITINERARY_VARIATIONS.filter(v => {
      if (excludeIds.has(v.id)) return false;
      
      const matchType = criteria.dayType ? v.dayType === criteria.dayType : true;
      const matchSource = criteria.source ? v.source.toLowerCase().includes(criteria.source.toLowerCase()) : true;
      const matchDest = criteria.destination ? v.destination.toLowerCase().includes(criteria.destination.toLowerCase()) : true;
      
      // Basic season check if provided
      const matchSeason = criteria.season ? v.seasonalRelevance.some(s => s.toLowerCase() === criteria.season?.toLowerCase()) : true;

      return matchType && matchSource && matchDest && matchSeason;
    });

    if (matches.length === 0) return undefined;

    // Return a random one from matches to avoid repetition
    return matches[Math.floor(Math.random() * matches.length)];
  }

  /**
   * Final formatter to convert Variation to ItineraryDay
   */
  static variationToDay(v: ItineraryDayVariation, dayNum: number, tier: 'prime' | 'elite' | 'signature', vehicleType: string): ItineraryDay {
    const luxuryMods = this.applyLuxuryLogic(v, tier);
    const finalV = { ...v, ...luxuryMods };
    const localRules = this.getLocalRules(v.destination);
    
    let description = finalV.customerDescription;
    description = this.refineTransportWording(description, vehicleType);

    return {
      id: `smart-day-${dayNum}-${Date.now()}`,
      dayNumber: dayNum,
      title: finalV.title,
      location: finalV.destination,
      hotelId: '', // To be selected by user
      vehicleId: '', // To be selected by user
      activityIds: [], // Can auto-fill from v.recommendedAddOns if matched with master
      clientNotes: description,
      internalNotes: `${v.internalNotes} ${localRules.notes}`.trim(),
      unionCabSelected: v.transferType === 'Union'
    };
  }
}
