
import { Hotel, Vehicle, Activity, AddOn, Trip, TripStatus, TripType, HotelCategory, Lead, LeadStage, LeadScore, ItineraryDay, TeamMember, UserRole, TripTemplate } from './types';

// Exporting TripTemplate type as it is imported from this file in several components
export type { TripTemplate };

export const DEFAULT_PERSONAS: TeamMember[] = [
  { id: 'tm-1', name: 'Executive Partner', role: UserRole.ADMIN, avatar: 'https://picsum.photos/seed/adil/100/100', title: 'Super Admin', color: 'bg-blue-600', email: 'admin@travelblisskashmir.in', phone: '+91 99061 23456', location: 'Srinagar Office' },
  { id: 'tm-2', name: 'Sales Executive', role: UserRole.SALES, avatar: 'https://picsum.photos/seed/sajad/100/100', title: 'Senior Sales Executive', color: 'bg-emerald-600', email: 'sales@travelblisskashmir.in', phone: '+91 99061 23457', location: 'Srinagar Office' },
  { id: 'tm-3', name: 'Operations Manager', role: UserRole.OPERATIONS, avatar: 'https://picsum.photos/seed/ishfaq/100/100', title: 'Operations Manager', color: 'bg-amber-600', email: 'operations@travelblisskashmir.in', phone: '+91 99061 23458', location: 'Srinagar Office' }
];

const today = new Date();
const formatDate = (date: Date) => date.toISOString().split('T')[0];

export const HOTELS: Hotel[] = [
  { 
    id: 'h1', 
    name: 'Taj Vivanta, Srinagar', 
    location: 'Srinagar', 
    category: HotelCategory.LUXURY, 
    ratePerNight: 22000, 
    contact: '+91 194 2461234',
    epRate: 22000,
    cpRate: 24000,
    mapRate: 28000,
    apRate: 32000,
    extraBedRate: 6500,
    childNoBedRate: 3500
  },
  { 
    id: 'h2', 
    name: 'Khyber Himalayan Resort', 
    location: 'Gulmarg', 
    category: HotelCategory.LUXURY, 
    ratePerNight: 28000, 
    contact: '+91 194 2451234',
    epRate: 28000,
    cpRate: 31000,
    mapRate: 35000,
    apRate: 40000,
    extraBedRate: 8500,
    childNoBedRate: 4500
  },
  { 
    id: 'h3', 
    name: 'Heevan Retreat', 
    location: 'Gulmarg', 
    category: HotelCategory.DELUXE, 
    ratePerNight: 12000, 
    contact: '+91 194 2451235',
    epRate: 12000,
    cpRate: 13500,
    mapRate: 16000,
    apRate: 19000,
    extraBedRate: 4500,
    childNoBedRate: 2500
  },
  { 
    id: 'h4', 
    name: 'Luxury Houseboat Nigeen', 
    location: 'Srinagar', 
    category: HotelCategory.HOUSEBOAT, 
    ratePerNight: 8500, 
    contact: '+91 194 2451236',
    epRate: 8500,
    cpRate: 10000,
    mapRate: 12500,
    apRate: 15000,
    extraBedRate: 3500,
    childNoBedRate: 2000
  },
  { 
    id: 'h5', 
    name: 'Pine N Peak', 
    location: 'Pahalgam', 
    category: HotelCategory.LUXURY, 
    ratePerNight: 15000, 
    contact: '+91 194 2451237',
    epRate: 15000,
    cpRate: 17000,
    mapRate: 20000,
    apRate: 24000,
    extraBedRate: 5500,
    childNoBedRate: 3000
  },
];

export const VEHICLES: Vehicle[] = [
  { id: 'v1', type: 'Sedan (Etios/Dzire)', capacity: 3, ratePerDay: 2500, isAC: true },
  { id: 'v2', type: 'Toyota Innova Crysta', capacity: 6, ratePerDay: 4500, isAC: true },
  { id: 'v3', type: 'Tempo Traveler', capacity: 12, ratePerDay: 7500, isAC: true },
];

export const ACTIVITIES: Activity[] = [
  { id: 'a1', name: 'Shikara Ride (1 Hr)', costPerPax: 800, description: 'Leisurely ride on Dal Lake' },
  { id: 'a2', name: 'Gondola Phase 1 & 2', costPerPax: 1800, description: 'Cable car ride in Gulmarg' },
  { id: 'a3', name: 'Pony Ride in Baisaran', costPerPax: 1200, description: 'Horse riding in Mini Switzerland' },
];

export const ADD_ONS: AddOn[] = [
  { id: 'ao1', name: 'Honeymoon Cake', cost: 1000, isPerPax: false },
  { id: 'ao2', name: 'Candlelight Dinner', cost: 3500, isPerPax: false },
];

export const MOCK_LEADS: Lead[] = [];

export const MOCK_TRIPS: Trip[] = [];


export const DEFAULT_INCLUSIONS = [
  'Accommodation on twin sharing basis',
  'Daily Breakfast and Dinner',
  'Private vehicle for transfers',
  'Shikara ride (1 Hour)'
];

export const DEFAULT_EXCLUSIONS = [
  'Domestic or International Airfare',
  'Lunch and extra meals',
  'Personal expenses'
];

// Added MOCK_TEMPLATES to fix missing exported member errors
export const MOCK_TEMPLATES: TripTemplate[] = [
  {
    id: 'mt-sri-sri-6',
    name: 'Srinagar Round Trip - 6D/5N',
    duration: '6 Days, 5 Nights',
    tripType: TripType.FAMILY,
    baseMargin: 15,
    inclusions: [...DEFAULT_INCLUSIONS],
    exclusions: [...DEFAULT_EXCLUSIONS],
    startLocation: 'Srinagar',
    dropLocation: 'Srinagar',
    itinerary: [
      { id: 'ss6-1', dayNumber: 1, title: 'Arrival in Srinagar', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: ['a1'], clientNotes: 'Welcome to Srinagar.', internalNotes: 'Airport pickup.' },
      { id: 'ss6-2', dayNumber: 2, title: 'Srinagar to Gulmarg', location: 'Gulmarg', hotelId: '', vehicleId: '', activityIds: ['a2'], clientNotes: 'Day trip or stay in Gulmarg.', internalNotes: '' },
      { id: 'ss6-3', dayNumber: 3, title: 'Gulmarg to Pahalgam', location: 'Pahalgam', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Scenic drive to Pahalgam.', internalNotes: '' },
      { id: 'ss6-4', dayNumber: 4, title: 'Pahalgam Local Sightseeing', location: 'Pahalgam', hotelId: '', vehicleId: '', activityIds: ['a3'], clientNotes: 'Visit Aru/Betaab Valley.', internalNotes: '' },
      { id: 'ss6-5', dayNumber: 5, title: 'Pahalgam to Srinagar', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Stay in a Houseboat.', internalNotes: '' },
      { id: 'ss6-6', dayNumber: 6, title: 'Departure from Srinagar', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Transfer to airport.', internalNotes: 'Airport drop.' }
    ]
  },
  {
    id: 'mt-sri-sri-5',
    name: 'Srinagar Round Trip - 5D/4N',
    duration: '5 Days, 4 Nights',
    tripType: TripType.COUPLE,
    baseMargin: 15,
    inclusions: [...DEFAULT_INCLUSIONS],
    exclusions: [...DEFAULT_EXCLUSIONS],
    startLocation: 'Srinagar',
    dropLocation: 'Srinagar',
    itinerary: [
      { id: 'ss5-1', dayNumber: 1, title: 'Arrival & Srinagar Sightseeing', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: ['a1'], clientNotes: 'Welcome to Srinagar.', internalNotes: 'Airport pickup.' },
      { id: 'ss5-2', dayNumber: 2, title: 'Srinagar to Pahalgam', location: 'Pahalgam', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Drive to the saffron fields.', internalNotes: '' },
      { id: 'ss5-3', dayNumber: 3, title: 'Pahalgam to Gulmarg', location: 'Gulmarg', hotelId: '', vehicleId: '', activityIds: ['a2'], clientNotes: 'Full day excursion to Gulmarg.', internalNotes: '' },
      { id: 'ss5-4', dayNumber: 4, title: 'Gulmarg to Srinagar', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Stay in a Houseboat.', internalNotes: '' },
      { id: 'ss5-5', dayNumber: 5, title: 'Departure from Srinagar', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Transfer to airport.', internalNotes: 'Airport drop.' }
    ]
  },
  {
    id: 'mt-sri-sri-4',
    name: 'Srinagar Round Trip - 4D/3N',
    duration: '4 Days, 3 Nights',
    tripType: TripType.FAMILY,
    baseMargin: 15,
    inclusions: [...DEFAULT_INCLUSIONS],
    exclusions: [...DEFAULT_EXCLUSIONS],
    startLocation: 'Srinagar',
    dropLocation: 'Srinagar',
    itinerary: [
      { id: 'ss4-1', dayNumber: 1, title: 'Arrival & Srinagar Sightseeing', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: ['a1'], clientNotes: 'Welcome to Srinagar.', internalNotes: 'Airport pickup.' },
      { id: 'ss4-2', dayNumber: 2, title: 'Day Trip to Gulmarg', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: ['a2'], clientNotes: 'Explore the meadows.', internalNotes: '' },
      { id: 'ss4-3', dayNumber: 3, title: 'Day Trip to Pahalgam', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: ['a3'], clientNotes: 'Visit Pahalgam.', internalNotes: '' },
      { id: 'ss4-4', dayNumber: 4, title: 'Departure from Srinagar', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Transfer to airport.', internalNotes: 'Airport drop.' }
    ]
  },
  {
    id: 'mt-jam-jam-6',
    name: 'Jammu Round Trip - 6D/5N',
    duration: '6 Days, 5 Nights',
    tripType: TripType.FAMILY,
    baseMargin: 15,
    inclusions: [...DEFAULT_INCLUSIONS],
    exclusions: [...DEFAULT_EXCLUSIONS],
    startLocation: 'Jammu',
    dropLocation: 'Jammu',
    itinerary: [
      { id: 'jj6-1', dayNumber: 1, title: 'Jammu Arrival & Drive to Pahalgam', location: 'Pahalgam', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Long drive from Jammu to Pahalgam.', internalNotes: '7-8 hours drive.' },
      { id: 'jj6-2', dayNumber: 2, title: 'Pahalgam to Srinagar', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: ['a3'], clientNotes: 'Drive to Srinagar.', internalNotes: '' },
      { id: 'jj6-3', dayNumber: 3, title: 'Gulmarg Day Excursion', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: ['a2'], clientNotes: 'Day trip to Gulmarg.', internalNotes: '' },
      { id: 'jj6-4', dayNumber: 4, title: 'Srinagar Sightseeing', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: ['a1'], clientNotes: 'Visit Mughal Gardens.', internalNotes: '' },
      { id: 'jj6-5', dayNumber: 5, title: 'Srinagar to Patnitop', location: 'Patnitop', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Break the journey at Patnitop.', internalNotes: '' },
      { id: 'jj6-6', dayNumber: 6, title: 'Patnitop to Jammu Departure', location: 'Jammu', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Transfer to Jammu Airport/Railway Station.', internalNotes: '' }
    ]
  },
  {
    id: 'mt-jam-jam-5',
    name: 'Jammu Round Trip - 5D/4N',
    duration: '5 Days, 4 Nights',
    tripType: TripType.GROUP,
    baseMargin: 15,
    inclusions: [...DEFAULT_INCLUSIONS],
    exclusions: [...DEFAULT_EXCLUSIONS],
    startLocation: 'Jammu',
    dropLocation: 'Jammu',
    itinerary: [
      { id: 'jj5-1', dayNumber: 1, title: 'Arrival at Jammu & Drive to Pahalgam', location: 'Pahalgam', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Pickup from Jammu Airport/Railway Station.', internalNotes: '' },
      { id: 'jj5-2', dayNumber: 2, title: 'Pahalgam to Srinagar', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: ['a3'], clientNotes: 'Visit Betaab/Aru Valley.', internalNotes: '' },
      { id: 'jj5-3', dayNumber: 3, title: 'Gulmarg Day Trip', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: ['a2'], clientNotes: 'Full day in Gulmarg.', internalNotes: '' },
      { id: 'jj5-4', dayNumber: 4, title: 'Srinagar Sightseeing & Houseboat', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: ['a1'], clientNotes: 'Stay in Houseboat.', internalNotes: '' },
      { id: 'jj5-5', dayNumber: 5, title: 'Srinagar to Jammu Departure', location: 'Jammu', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Drive back to Jammu.', internalNotes: '' }
    ]
  },
  {
    id: 'mt-jam-jam-4',
    name: 'Jammu Round Trip - 4D/3N',
    duration: '4 Days, 3 Nights',
    tripType: TripType.COUPLE,
    baseMargin: 15,
    inclusions: [...DEFAULT_INCLUSIONS],
    exclusions: [...DEFAULT_EXCLUSIONS],
    startLocation: 'Jammu',
    dropLocation: 'Jammu',
    itinerary: [
      { id: 'jj4-1', dayNumber: 1, title: 'Jammu Arrival & Drive to Srinagar', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Drive to Srinagar.', internalNotes: '' },
      { id: 'jj4-2', dayNumber: 2, title: 'Day Trip to Gulmarg', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: ['a2'], clientNotes: 'Gondola ride.', internalNotes: '' },
      { id: 'jj4-3', dayNumber: 3, title: 'Srinagar Sightseeing & Houseboat', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: ['a1'], clientNotes: 'Stay in Dal Lake.', internalNotes: '' },
      { id: 'jj4-4', dayNumber: 4, title: 'Srinagar to Jammu Drop', location: 'Jammu', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Drive to Jammu for drop.', internalNotes: '' }
    ]
  },
  {
    id: 'mt-sri-jam-6',
    name: 'Srinagar to Jammu - 6D/5N',
    duration: '6 Days, 5 Nights',
    tripType: TripType.COUPLE,
    baseMargin: 15,
    inclusions: [...DEFAULT_INCLUSIONS],
    exclusions: [...DEFAULT_EXCLUSIONS],
    startLocation: 'Srinagar',
    dropLocation: 'Jammu',
    itinerary: [
      { id: 'sj6-1', dayNumber: 1, title: 'Srinagar Arrival', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: ['a1'], clientNotes: 'Welcome to Kashmir.', internalNotes: '' },
      { id: 'sj6-2', dayNumber: 2, title: 'Srinagar to Gulmarg', location: 'Gulmarg', hotelId: '', vehicleId: '', activityIds: ['a2'], clientNotes: 'Explore Gulmarg.', internalNotes: '' },
      { id: 'sj6-3', dayNumber: 3, title: 'Gulmarg to Pahalgam', location: 'Pahalgam', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Drive to Pahalgam.', internalNotes: '' },
      { id: 'sj6-4', dayNumber: 4, title: 'Pahalgam Sightseeing', location: 'Pahalgam', hotelId: '', vehicleId: '', activityIds: ['a3'], clientNotes: 'Valley sightseeing.', internalNotes: '' },
      { id: 'sj6-5', dayNumber: 5, title: 'Pahalgam to Jammu (Via Patnitop)', location: 'Jammu', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Drive to Jammu for orientation.', internalNotes: 'Long mountain drive.' },
      { id: 'sj6-6', dayNumber: 6, title: 'Jammu Departure', location: 'Jammu', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Drop at Jammu station/airport.', internalNotes: '' }
    ]
  },
  {
    id: 'mt-jam-sri-6',
    name: 'Jammu to Srinagar - 6D/5N',
    duration: '6 Days, 5 Nights',
    tripType: TripType.GROUP,
    baseMargin: 15,
    inclusions: [...DEFAULT_INCLUSIONS],
    exclusions: [...DEFAULT_EXCLUSIONS],
    startLocation: 'Jammu',
    dropLocation: 'Srinagar',
    itinerary: [
      { id: 'js6-1', dayNumber: 1, title: 'Jammu Arrival & Drive to Pahalgam', location: 'Pahalgam', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Pickup from Jammu.', internalNotes: '' },
      { id: 'js6-2', dayNumber: 2, title: 'Pahalgam Exploration', location: 'Pahalgam', hotelId: '', vehicleId: '', activityIds: ['a3'], clientNotes: 'Full day in Pahalgam.', internalNotes: '' },
      { id: 'js6-3', dayNumber: 3, title: 'Pahalgam to Gulmarg', location: 'Gulmarg', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Drive to the heights of Gulmarg.', internalNotes: '' },
      { id: 'js6-4', dayNumber: 4, title: 'Gulmarg to Srinagar', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: ['a2'], clientNotes: 'Return to Srinagar.', internalNotes: '' },
      { id: 'js6-5', dayNumber: 5, title: 'Srinagar Local & Shikara', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: ['a1'], clientNotes: 'Mughal Gardens and Lake.', internalNotes: '' },
      { id: 'js6-6', dayNumber: 6, title: 'Departure from Srinagar', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Transfer to Srinagar Airport.', internalNotes: '' }
    ]
  }
];

export const BRAND_CONFIG = {
  name: 'Travel Bliss Kashmir',
  tagline: 'Crafting Himalayan Memories',
  logo: 'https://img.icons8.com/color/96/mountain.png',
  email: 'hello@travelblisskashmir.in',
  phone: '+91 9906 123 456',
  address: 'Rajbagh, Srinagar, J&K',
  defaultMargin: 15
};

export const TERMS_AND_CONDITIONS = [
  'AC will not be functional on hills, terrains and slopes.',
  'Prepaid mobile numbers of other states do not work in J&K',
  'In Gulmarg/Sonamarg horseman union is not allowing any vehicle to drop or pickup guests at/from neither Gondola nor horseman union allow any sightseeing tours. The vehicle will be stopped at a predestinated parking placed by the local taxi / pony union.',
  'From the parking area guests will have to walk or take ponies on direct payment',
  'Gondola rides in Gulmarg @810/- up to 1st Phase per Ticket & Rs 1050/- up to 2nd Phase per Ticket',
  'Garden Entry Ticket @24/- Per Person/Per Garden | Betaab Valley @100/-',
  'It is mandatory to carry a valid photo identity card (Passport / Driving License / Voter ID card)'
];

export const PAYMENT_TERMS = [
  'A minimum 50% advance payment is required to confirm the booking. The remaining balance must be cleared on arrival.',
  'Payments are non-transferable and subject to cancellation policies',
  'Travel Bliss is not responsible for any delays or issues arising due to incomplete or late payments.'
];

export const CANCELLATION_POLICY = [
  'Cancellations that could be made before 24 days of arrival date will not have any charges. If cancellation is made within 24 days of arrival will be subject to 100% retention for the entire length of Stay.'
];

export const REFUND_POLICY = [
  'Refunds depend on cancellation timing and supplier policies. Non-refundable components include flights, hotels, and pre-booked activities. No refunds for cancellations within 7 days of departure. Travel Bliss is not responsible for cancellations due to natural disasters, political unrest, or other unforeseen circumstances but will assist in finding the best possible solution.'
];
