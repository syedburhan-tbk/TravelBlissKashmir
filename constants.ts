
import { Hotel, Vehicle, Activity, AddOn, Trip, TripStatus, TripType, HotelCategory, Lead, LeadStage, LeadScore, ItineraryDay, TeamMember, UserRole, TripTemplate } from './types';

// Exporting TripTemplate type as it is imported from this file in several components
export type { TripTemplate };

export const DEFAULT_PERSONAS: TeamMember[] = [
  { id: 'tm-1', name: 'Adil Bakshi', role: UserRole.ADMIN, avatar: 'https://picsum.photos/seed/adil/100/100', title: 'Super Admin', color: 'bg-blue-600', email: 'adil@travelblisskashmir.in', phone: '+91 99061 23456', location: 'Srinagar Office' },
  { id: 'tm-2', name: 'Sajad Ahmad', role: UserRole.SALES, avatar: 'https://picsum.photos/seed/sajad/100/100', title: 'Senior Sales Executive', color: 'bg-emerald-600', email: 'sajad@travelblisskashmir.in', phone: '+91 99061 23457', location: 'Srinagar Office' },
  { id: 'tm-3', name: 'Ishfaq Lone', role: UserRole.OPERATIONS, avatar: 'https://picsum.photos/seed/ishfaq/100/100', title: 'Operations Manager', color: 'bg-amber-600', email: 'ishfaq@travelblisskashmir.in', phone: '+91 99061 23458', location: 'Srinagar Office' }
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

export const MOCK_LEADS: Lead[] = [
  {
    id: 'l1',
    name: 'Anjali Gupta',
    phone: '9876543210',
    email: 'anjali@example.com',
    source: 'Instagram',
    interest: TripType.HONEYMOON,
    budgetRange: '1.5L - 2L',
    travelMonth: 'December',
    pax: 2,
    assignedTo: 'Sajad Ahmad',
    stage: LeadStage.CONTACTED,
    score: LeadScore.HOT,
    notes: 'Very interested in Taj Vivanta.',
    communicationLogs: [
      { id: 'c1', type: 'WhatsApp', timestamp: '2024-11-20T10:00:00Z', content: 'Sent winter catalog.', author: 'Sajad' }
    ],
    followUps: [
      { id: 'f1', date: '2024-11-25', status: 'Pending', note: 'Call to discuss itinerary' }
    ],
    tripIds: ['t1', 't-ongoing-1'],
    createdAt: '2024-11-19T08:00:00Z',
    whatsappOptIn: true
  }
];

export const MOCK_TRIPS: Trip[] = [
  {
    id: 't1',
    leadId: 'l1',
    client: {
      name: 'Anjali Gupta',
      phone: '9876543210',
      email: 'anjali@example.com',
      source: 'Instagram'
    },
    assignedSalesperson: 'Sajad Ahmad',
    budgetRange: '1.5L - 2L',
    tripName: 'Anjali & Rohit - Winter Honeymoon',
    tripType: TripType.HONEYMOON,
    startDate: '2024-12-15',
    endDate: '2024-12-21',
    pax: 2,
    numRooms: 1,
    extraBeds: 0,
    childNoBed: 0,
    status: TripStatus.BOOKED,
    marginPercentage: 15,
    addOnIds: ['ao1'],
    startLocation: 'Srinagar',
    inclusions: ['Welcome Drink', 'Honeymoon Cake'],
    exclusions: ['Airfare'],
    itinerary: [
      { id: 'd1', dayNumber: 1, title: 'Arrival', location: 'Srinagar', hotelId: 'h1', vehicleId: 'v2', activityIds: ['a1'], clientNotes: 'Welcome!', internalNotes: '' }
    ],
    versions: []
  },
  {
    id: 't-ongoing-1',
    leadId: 'l1',
    client: {
      name: 'Anjali Gupta',
      phone: '9876543210',
      email: 'anjali@example.com',
      source: 'Instagram'
    },
    assignedSalesperson: 'Ishfaq Lone',
    budgetRange: '2.5L',
    tripName: 'Gupta Family - Valley Tour',
    tripType: TripType.FAMILY,
    startDate: formatDate(new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)), // Started 2 days ago
    endDate: formatDate(new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)),   // Ends in 3 days
    pax: 4,
    status: TripStatus.BOOKED,
    marginPercentage: 15,
    addOnIds: [],
    startLocation: 'Srinagar',
    inclusions: [],
    exclusions: [],
    itinerary: [
      { id: 'od1', dayNumber: 1, title: 'Arrival in Srinagar', location: 'Srinagar', hotelId: 'h4', vehicleId: 'v2', activityIds: ['a1'], clientNotes: '', internalNotes: '' },
      { id: 'od2', dayNumber: 2, title: 'Gulmarg Day Trip', location: 'Srinagar', hotelId: 'h4', vehicleId: 'v2', activityIds: ['a2'], clientNotes: '', internalNotes: '' },
      { id: 'od3', dayNumber: 3, title: 'Pahalgam Transfer', location: 'Pahalgam', hotelId: 'h5', vehicleId: 'v2', activityIds: ['a3'], clientNotes: '', internalNotes: '' },
      { id: 'od4', dayNumber: 4, title: 'Local Sightseeing', location: 'Pahalgam', hotelId: 'h5', vehicleId: 'v2', activityIds: [], clientNotes: '', internalNotes: '' },
      { id: 'od5', dayNumber: 5, title: 'Departure', location: 'Srinagar', hotelId: '', vehicleId: 'v2', activityIds: [], clientNotes: '', internalNotes: '' }
    ],
  }
];

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
    id: 'mt-1',
    name: 'Paradise Kashmir - 6D/5N',
    duration: '6 Days, 5 Nights',
    tripType: TripType.FAMILY,
    baseMargin: 15,
    inclusions: [...DEFAULT_INCLUSIONS],
    exclusions: [...DEFAULT_EXCLUSIONS],
    itinerary: [
      { id: 'mtd1', dayNumber: 1, title: 'Arrival in Srinagar', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Welcome to the summer capital of J&K.', internalNotes: 'Pickup from Airport.' },
      { id: 'mtd2', dayNumber: 2, title: 'Srinagar to Gulmarg', location: 'Gulmarg', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Enjoy the meadows of flowers.', internalNotes: 'Gondola tickets to be booked in advance.' },
      { id: 'mtd3', dayNumber: 3, title: 'Gulmarg to Pahalgam', location: 'Pahalgam', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Drive to the valley of shepherds.', internalNotes: '' },
      { id: 'mtd4', dayNumber: 4, title: 'Pahalgam Sightseeing', location: 'Pahalgam', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Visit local spots.', internalNotes: '' },
      { id: 'mtd5', dayNumber: 5, title: 'Pahalgam to Srinagar', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Overnight in Houseboat.', internalNotes: '' },
      { id: 'mtd6', dayNumber: 6, title: 'Departure', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Transfer to Srinagar Airport.', internalNotes: '' }
    ]
  },
  {
    id: 'mt-sri-5',
    name: 'Srinagar Pick & Drop - 5D/4N',
    duration: '5 Days, 4 Nights',
    tripType: TripType.COUPLE,
    baseMargin: 15,
    inclusions: [...DEFAULT_INCLUSIONS],
    exclusions: [...DEFAULT_EXCLUSIONS],
    itinerary: [
      { id: 'ms5-1', dayNumber: 1, title: 'Arrival & Srinagar Sightseeing', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Arrive at Srinagar airport. Local sightseeing including Mughal Gardens.', internalNotes: 'Airport pickup and check-in.' },
      { id: 'ms5-2', dayNumber: 2, title: 'Day Trip to Gulmarg', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Full day excursion to Gulmarg. Enjoy Gondola ride.', internalNotes: 'Suggest pre-booking Gondola.' },
      { id: 'ms5-3', dayNumber: 3, title: 'Srinagar to Pahalgam', location: 'Pahalgam', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Drive to Pahalgam. Enroute visit Saffron fields.', internalNotes: 'Drive takes ~2.5 hrs.' },
      { id: 'ms5-4', dayNumber: 4, title: 'Pahalgam to Srinagar Houseboat', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Morning in Pahalgam, afternoon drive to Srinagar. Check in to Houseboat.', internalNotes: 'Houseboat check-in.' },
      { id: 'ms5-5', dayNumber: 5, title: 'Departure from Srinagar', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Transfer to Srinagar airport for onward journey.', internalNotes: 'Airport drop.' }
    ]
  },
  {
    id: 'mt-sri-4',
    name: 'Srinagar Pick & Drop - 4D/3N',
    duration: '4 Days, 3 Nights',
    tripType: TripType.FAMILY,
    baseMargin: 15,
    inclusions: [...DEFAULT_INCLUSIONS],
    exclusions: [...DEFAULT_EXCLUSIONS],
    itinerary: [
      { id: 'ms4-1', dayNumber: 1, title: 'Arrival & Srinagar Sightseeing', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Arrive in Srinagar. Visit local Mughal Gardens & Shikara Ride.', internalNotes: 'Airport pickup.' },
      { id: 'ms4-2', dayNumber: 2, title: 'Day Trip to Gulmarg', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Day trip to Gulmarg. Return to Srinagar by evening.', internalNotes: '' },
      { id: 'ms4-3', dayNumber: 3, title: 'Day Trip to Pahalgam', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Day excursion to Pahalgam. Evening stay in a Houseboat.', internalNotes: 'Long day out.' },
      { id: 'ms4-4', dayNumber: 4, title: 'Departure', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Transfer to Srinagar airport.', internalNotes: 'Airport drop.' }
    ]
  },
  {
    id: 'mt-jam-5',
    name: 'Jammu Pick & Drop - 5D/4N',
    duration: '5 Days, 4 Nights',
    tripType: TripType.GROUP,
    baseMargin: 15,
    inclusions: [...DEFAULT_INCLUSIONS],
    exclusions: [...DEFAULT_EXCLUSIONS],
    itinerary: [
      { id: 'mj5-1', dayNumber: 1, title: 'Arrival at Jammu & Drive to Pahalgam', location: 'Pahalgam', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Pickup from Jammu Airport/Railway Station. Drive directly to Pahalgam.', internalNotes: 'Long drive ~7-8 hours. Start early.' },
      { id: 'mj5-2', dayNumber: 2, title: 'Pahalgam Sightseeing & Drive to Srinagar', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Visit Aru/Betaab Valley in morning. Afternoon drive to Srinagar.', internalNotes: 'Arrange local union cab for Betaab Valley.' },
      { id: 'mj5-3', dayNumber: 3, title: 'Day Trip to Gulmarg', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Full day excursion to Gulmarg. Evening return to Srinagar.', internalNotes: '' },
      { id: 'mj5-4', dayNumber: 4, title: 'Srinagar Sightseeing & Houseboat', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Visit Mughal Gardens. Evening stay in a beautiful Dal Lake Houseboat.', internalNotes: 'Houseboat check-in.' },
      { id: 'mj5-5', dayNumber: 5, title: 'Drive from Srinagar to Jammu', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Early morning drive back to Jammu for drop off.', internalNotes: 'Another 7-8 hours drive. Need early departure.' }
    ]
  },
  {
    id: 'mt-jam-4',
    name: 'Jammu Pick & Drop - 4D/3N',
    duration: '4 Days, 3 Nights',
    tripType: TripType.COUPLE,
    baseMargin: 15,
    inclusions: [...DEFAULT_INCLUSIONS],
    exclusions: [...DEFAULT_EXCLUSIONS],
    itinerary: [
      { id: 'mj4-1', dayNumber: 1, title: 'Jammu Arrival & Drive to Srinagar', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Pickup from Jammu and scenic drive to Srinagar.', internalNotes: 'Day long drive.' },
      { id: 'mj4-2', dayNumber: 2, title: 'Day Trip to Gulmarg', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Excursion to Gulmarg. Return to Srinagar by evening.', internalNotes: '' },
      { id: 'mj4-3', dayNumber: 3, title: 'Srinagar Sightseeing & Houseboat', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Local sightseeing and stay in Houseboat.', internalNotes: '' },
      { id: 'mj4-4', dayNumber: 4, title: 'Drive to Jammu for Drop', location: 'Srinagar', hotelId: '', vehicleId: '', activityIds: [], clientNotes: 'Drive back to Jammu Airport/Railway Station.', internalNotes: 'Start early morning.' }
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
