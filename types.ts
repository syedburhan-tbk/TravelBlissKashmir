
export enum UserRole {
  ADMIN = 'ADMIN',
  SALES = 'SALES',
  OPERATIONS = 'OPERATIONS'
}

export interface TeamMember {
  id: string;
  name: string;
  role: UserRole;
  title: string;
  avatar: string;
  email: string;
  phone: string;
  location: string;
  color: string;
  isApproved?: boolean;
}

export enum LeadStage {
  NEW = 'New',
  CONTACTED = 'Contacted',
  QUALIFIED = 'Qualified',
  PROPOSAL_SENT = 'Proposal Sent',
  NEGOTIATION = 'Negotiation',
  BOOKED = 'Booked',
  LOST = 'Lost',
  CANCELLED = 'Cancelled'
}

export enum LeadScore {
  HOT = 'Hot',
  WARM = 'Warm',
  COLD = 'Cold'
}

export enum TripStatus {
  LEAD = 'Lead',
  QUOTED = 'Quoted',
  BOOKED = 'Booked',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

export enum TripType {
  HONEYMOON = 'Honeymoon',
  FAMILY = 'Family',
  GROUP = 'Group',
  CORPORATE = 'Corporate'
}

export enum HotelCategory {
  BUDGET = 'Budget',
  DELUXE = 'Deluxe',
  LUXURY = 'Luxury',
  HOUSEBOAT = 'Houseboat'
}

export enum MealPlan {
  EP = 'EP (Room Only)',
  CP = 'CP (Room + Breakfast)',
  MAP = 'MAP (Room + BF + Dinner)',
  AP = 'AP (Room + All Meals)'
}

export interface Hotel {
  id: string;
  name: string;
  location: string;
  category: HotelCategory;
  ratePerNight: number;
  contact: string;
  gallery?: string[];
  rateValidityDate?: string;
  extraBedRate?: number;
  childNoBedRate?: number;
  epRate?: number;
  cpRate?: number;
  mapRate?: number;
  apRate?: number;
  internalNotes?: string;
  hotelLink?: string;
  attachmentData?: string;
  attachmentName?: string;
  attachmentType?: string;
}

export interface Vehicle {
  id: string;
  type: string;
  brand?: string;
  capacity: number;
  ratePerDay: number;
  isAC: boolean;
  image?: string;
  fuelType?: string;
  model?: string;
  internalNotes?: string;
  providerName?: string;
  providerContact?: string;
  rateValidityDate?: string;
  features?: string[];
}

export interface Activity {
  id: string;
  name: string;
  costPerPax: number;
  description: string;
  location?: string;
  category?: string;
  duration?: string;
  internalNotes?: string;
  image?: string;
}

export interface AddOn {
  id: string;
  name: string;
  cost: number;
  isPerPax: boolean;
  description?: string;
}

export interface DestinationImage {
  id: string;
  destination: string;
  url: string;
  category?: string;
}

export interface ItineraryDay {
  id: string;
  dayNumber: number;
  title: string;
  location?: string;
  hotelId?: string;
  mealPlan?: MealPlan;
  vehicleId?: string;
  activityIds: string[];
  highlights?: string[]; 
  clientNotes: string;
  internalNotes: string;
  unionCabSelected?: boolean;
  images?: string[];
}

export interface MessageTemplate {
  id: string;
  name: string;
  type: 'WhatsApp' | 'Email';
  body: string;
  isActive: boolean;
  triggerStage?: LeadStage;
  delayHours?: number;
}

export interface MessageLog {
  id: string;
  leadId: string;
  type: 'WhatsApp' | 'Email';
  content: string;
  timestamp: string;
  status: 'Sent' | 'Failed' | 'Delivered';
  templateId?: string;
  errorMessage?: string;
  retryCount: number;
}

export interface ChannelSettings {
  whatsappEnabled: boolean;
  emailEnabled: boolean;
  whatsappApiKey?: string;
  sendgridApiKey?: string;
  fromEmail?: string;
}

export interface CommunicationLog {
  id: string;
  type: 'Call' | 'WhatsApp' | 'Email' | 'Note';
  timestamp: string;
  content: string;
  author: string;
}

export interface FollowUp {
  id: string;
  date: string;
  status: 'Pending' | 'Completed' | 'Snoozed';
  note: string;
  type?: 'Call' | 'WhatsApp' | 'Email';
}

export interface LeadActivity {
  id: string;
  leadId: string;
  type: 'StatusChange' | 'FollowUpCreated' | 'FollowUpCompleted' | 'ProposalSent' | 'BookingConfirmed' | 'NoteAdded' | 'MessageSent';
  timestamp: string;
  description: string;
  meta?: any;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: string;
  interest: TripType;
  budgetRange: string;
  travelMonth: string;
  pax: number;
  assignedTo: string;
  stage: LeadStage;
  score: LeadScore;
  notes: string;
  communicationLogs: CommunicationLog[];
  followUps: FollowUp[];
  activities?: LeadActivity[];
  messageLogs?: MessageLog[];
  tripIds: string[]; 
  createdAt: string;
  updatedAt?: string;
  whatsappOptIn: boolean;
}

export interface TierPrices {
  signature: number;
  elite: number;
  prime: number;
}

export interface HotelTierSelection {
  location: string;
  signatureHotelId: string;
  eliteHotelId: string;
  primeHotelId: string;
}

export interface TripVersion {
  id: string;
  timestamp: string;
  label: string;
  itinerary: ItineraryDay[];
  tierPrices: TierPrices;
}

export enum DayType {
  ARRIVAL = 'Arrival',
  TRANSFER = 'Transfer',
  SIGHTSEEING = 'Sightseeing',
  EXCURSION = 'Excursion',
  DROP = 'Drop',
  LEISURE = 'Leisure'
}

export interface ItineraryDayVariation {
  id: string;
  title: string;
  dayType: DayType;
  source: string;
  destination: string;
  routeType: 'Direct' | 'Via-Scenic' | 'Local' | 'Offbeat' | 'Trek';
  experienceTags: string[];
  stayType: 'Hotel' | 'Houseboat' | 'Camp' | 'None';
  transferType: 'Private' | 'Union' | 'Self-Drive' | 'None';
  recommendedAddOns: string[];
  seasonalRelevance: ('Summer' | 'Winter' | 'Spring' | 'Autumn')[];
  travelTimeApprox: string;
  internalNotes: string;
  customerDescription: string;
  luxuryEnhancement?: string;
}

export interface ItineraryGenerationInput {
  totalDays: number;
  arrivalCity: string;
  departureCity: string;
  destinations: string[];
  budgetLevel: 'prime' | 'elite' | 'signature';
  tripType: TripType;
}

export interface Trip {
  id: string;
  leadId: string;
  client: {
    name: string;
    phone: string;
    email: string;
    source: string;
  };
  assignedSalesperson: string;
  budgetRange: string;
  tripName: string;
  tripType: TripType;
  startDate: string;
  endDate: string;
  pax: number;
  numRooms?: number;
  extraBeds?: number;
  childNoBed?: number;
  compChild?: number;
  status: TripStatus;
  itinerary: ItineraryDay[];
  marginPercentage: number; 
  tierMargins?: TierPrices; 
  addOnIds: string[];
  vehicleSelection?: string;
  startLocation: 'Srinagar' | 'Jammu';
  dropLocation?: 'Srinagar' | 'Jammu';
  inclusions: string[];
  exclusions: string[];
  hotelTiers?: HotelTierSelection[];
  tierPrices?: TierPrices;
  versions?: TripVersion[];
}

export interface TripTemplate {
  id: string;
  name: string;
  duration: string;
  tripType: TripType;
  baseMargin: number;
  itinerary: ItineraryDay[];
  inclusions: string[];
  exclusions: string[];
  startLocation?: 'Srinagar' | 'Jammu';
  dropLocation?: 'Srinagar' | 'Jammu';
}

export type OpsAlertType = 'ARRIVAL' | 'DEPARTURE' | 'HOTEL_CHANGE' | 'PLAN_REMINDER';

export interface OpsAlert {
  id: string;
  tripId: string;
  clientName: string;
  type: OpsAlertType;
  message: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  timestamp: string;
}

// Finance Module Types
export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  author: string;
  referenceId?: string; // Link to lead or trip ID
  paymentMode: 'Cash' | 'Bank Transfer' | 'GPay' | 'Card' | 'UPI';
  vendorName?: string;
  billNumber?: string;
  taxAmount?: number;
  tripReference?: string;
  receiptData?: string; // Base64
  receiptName?: string;
}
