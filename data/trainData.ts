
import { Train, PNRStatus, StationFacility, Amenity } from '../types';
import { STATION_DATA } from './amenities';

// Helper to generate dynamic dates for the demo
const getFormattedDate = (offsetDays: number = 0): string => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    // Format: "12 Oct 2023"
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const TRAIN_DATABASE: Train[] = [
  {
    trainNumber: "12951",
    name: "Mumbai Rajdhani",
    source: "Mumbai Central",
    destination: "New Delhi",
    departureTime: "17:00",
    platform: "2",
    status: "On Time"
  },
  {
    trainNumber: "12002",
    name: "Bhopal Shatabdi",
    source: "New Delhi",
    destination: "Rani Kamlapati",
    departureTime: "06:00",
    platform: "1",
    status: "On Time"
  },
  {
    trainNumber: "22436",
    name: "Vande Bharat Express",
    source: "New Delhi",
    destination: "Varanasi",
    departureTime: "06:00",
    platform: "16",
    status: "On Time"
  },
  {
    trainNumber: "12138",
    name: "Punjab Mail",
    source: "Firozpur Cantt",
    destination: "Mumbai CSMT",
    departureTime: "21:40",
    platform: "5",
    status: "Delayed",
    delay: "45 mins"
  },
  {
    trainNumber: "12301",
    name: "Howrah Rajdhani",
    source: "Howrah",
    destination: "New Delhi",
    departureTime: "16:50",
    platform: "9",
    status: "On Time"
  },
  {
    trainNumber: "12260",
    name: "Sealdah Duronto",
    source: "Bikaner",
    destination: "Sealdah",
    departureTime: "12:15",
    platform: "3",
    status: "On Time"
  }
];

export const PNR_DATABASE: Record<string, PNRStatus> = {
  "1234567890": {
    pnrNumber: "1234567890",
    trainName: "12951 - Mumbai Rajdhani",
    date: getFormattedDate(0), // Today's date
    passengers: [
      { name: "Rahul Sharma", status: "CNF", coach: "B1", seat: "45" },
      { name: "Priya Sharma", status: "CNF", coach: "B1", seat: "46" }
    ]
  },
  "8234567890": {
    pnrNumber: "8234567890",
    trainName: "22436 - Vande Bharat",
    date: getFormattedDate(1), // Tomorrow's date
    passengers: [
      { name: "Amit Verma", status: "RAC", coach: "-", seat: "-" }
    ]
  }
};

/**
 * Searches for trains based on specific criteria.
 * Supports partial matching for Source and Destination to handle city names vs station names.
 */
export const searchTrains = (source?: string, destination?: string, trainNumber?: string): Train[] => {
  // If no criteria provided, return empty to prevent showing all trains irrelevantly
  if (!source && !destination && !trainNumber) return [];

  return TRAIN_DATABASE.filter(train => {
    let matches = true;

    // Filter by Train Number or Name if provided
    if (trainNumber) {
        const q = trainNumber.toLowerCase().trim();
        matches = matches && (
            train.trainNumber.includes(q) || 
            train.name.toLowerCase().includes(q)
        );
    }

    // Filter by Source (Origin)
    if (source) {
        const s = source.toLowerCase().trim();
        matches = matches && train.source.toLowerCase().includes(s);
    }

    // Filter by Destination
    if (destination) {
        const d = destination.toLowerCase().trim();
        matches = matches && train.destination.toLowerCase().includes(d);
    }

    return matches;
  });
};

export const checkPNR = (pnr: string): PNRStatus | null => {
  // Normalize PNR: ensure string and remove any non-digit characters (spaces, dashes)
  if (!pnr) return null;
  const normalizedPNR = String(pnr).replace(/\D/g, '');
  
  // 1. Check exact database match
  if (PNR_DATABASE[normalizedPNR]) {
      return PNR_DATABASE[normalizedPNR];
  }

  // 2. Wildcard Logic for Kiosk Demo:
  // If a user shows ANY 10-digit number (real ticket), generate a mock status.
  // This ensures the vision demo always succeeds.
  if (normalizedPNR.length === 10) {
      // Deterministic generation based on the last digit
      const lastDigit = parseInt(normalizedPNR.slice(-1));
      const isConfirmed = lastDigit % 2 === 0; // Even digits = Confirmed, Odd = Waiting
      
      return {
          pnrNumber: normalizedPNR,
          // FIX: Use a train number that EXISTS in TRAIN_DATABASE (12951) so follow-up queries work.
          trainName: isConfirmed ? "12951 - Mumbai Rajdhani" : "12002 - Bhopal Shatabdi",
          date: getFormattedDate(0), // Dynamic Today's date
          passengers: [
              { 
                  name: "Passenger 1", 
                  status: isConfirmed ? "CNF" : "WL/24", 
                  coach: isConfirmed ? "B2" : "-", 
                  seat: isConfirmed ? "15" : "-" 
              },
              { 
                  name: "Passenger 2", 
                  status: isConfirmed ? "CNF" : "WL/25", 
                  coach: isConfirmed ? "B2" : "-", 
                  seat: isConfirmed ? "16" : "-" 
              }
          ]
      };
  }

  return null;
};

// Helper to determine type from key
const mapKeyToType = (key: string): 'food' | 'rest' | 'emergency' | 'ticket' => {
    if(['restaurant', 'mcdonalds', 'tea', 'coffee'].some(k => key.includes(k))) return 'food';
    if(['waiting', 'cloak', 'hotel', 'retiring'].some(k => key.includes(k))) return 'rest';
    if(['ticket', 'enquiry', 'reservation'].some(k => key.includes(k))) return 'ticket';
    return 'emergency'; // Default/Other/Medical/Police
}

export const getStationFacilities = (): StationFacility[] => {
  return STATION_DATA.amenities.map(a => ({
      id: a.key,
      name: a.names[1] ? a.names[1].replace(/^\w/, c => c.toUpperCase()) : a.names[0].replace(/^\w/, c => c.toUpperCase()),
      location: a.platform_area,
      type: mapKeyToType(a.key),
      status: 'Open'
  }));
}

export const getAllAmenities = (): Amenity[] => {
    return STATION_DATA.amenities;
}

export const findAmenity = (query: string): Amenity | null => {
    if (!query) return null;
    const lowerQ = query.toLowerCase();
    
    // Find matching amenity by checking all possible names/aliases
    return STATION_DATA.amenities.find(item => 
        item.names.some(name => lowerQ.includes(name))
    ) || null;
}
