
export interface Train {
  trainNumber: string;
  name: string;
  source: string;
  destination: string;
  departureTime: string;
  platform: string;
  status: 'On Time' | 'Delayed' | 'Cancelled';
  delay?: string;
}

export interface PNRStatus {
  pnrNumber: string;
  trainName: string;
  date: string;
  passengers: {
    name: string;
    status: string; // e.g., "CNF", "WL", "RAC"
    coach?: string;
    seat?: string;
  }[];
}

export interface Amenity {
  key: string;
  names: string[];
  location_type: string;
  platform_area: string;
  side: string;
  landmark: string;
  answer: string;
  coordinates: { x: number; y: number }; // Percentage 0-100
  phone?: string;
}

export interface StationInfo {
  name: string;
  code: string;
  map_reference: string;
}

export interface StationNotes {
  primary_amenity_zone: string;
  platforms_on_map: number[];
  direction_labels: Record<string, string>;
}

export interface StationData {
  station: StationInfo;
  notes: StationNotes;
  amenities: Amenity[];
}

export interface StationFacility {
  id: string;
  name: string; // e.g., "Main Waiting Room", "Food Court"
  location: string; // e.g., "Platform 1, Near Escalator"
  type: 'food' | 'rest' | 'emergency' | 'ticket';
  status: 'Open' | 'Closed';
}

export enum DashboardMode {
  SCHEDULE = 'schedule',
  PNR = 'pnr',
  MAP = 'map'
}

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

export interface AudioConfig {
  inputSampleRate: number;
  outputSampleRate: number;
}

export const AUDIO_CONFIG: AudioConfig = {
  inputSampleRate: 16000,
  outputSampleRate: 24000,
};
