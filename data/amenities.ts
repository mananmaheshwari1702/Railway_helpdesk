
import { StationData } from '../types';

export const STATION_DATA: StationData = {
  "station": {
    "name": "Delhi Junction Railway Station",
    "code": "DLI",
    "map_reference": "Delhi Junction Railway Station Map (DLI)"
  },
  "notes": {
    "primary_amenity_zone": "Most amenities in this map are shown on the right side (Metro side), outside the station, near Platforms 7–8 area.",
    "platforms_on_map": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    "direction_labels": {
      "right_side": "Metro side / Delhi Public Library side",
      "top_left": "Kashmere Gate / Minerva Cinema side",
      "bottom_left": "Chandni Chowk Market side",
      "left_side": "Mori Gate side"
    }
  },
  "amenities": [
    {
      "key": "atm",
      "names": ["atm", "cash", "money", "withdraw"],
      "location_type": "outside",
      "platform_area": "Near Platforms 7–8 side",
      "side": "Metro side (right side)",
      "landmark": "ATM icon in the Metro-side amenity cluster",
      "answer": "ATM is outside the station on the Metro side (right side), near Platforms 7–8 area.",
      "coordinates": { x: 75, y: 35 }
    },
    {
      "key": "bus_stand",
      "names": ["bus", "bus stand", "bus stop", "dtc bus"],
      "location_type": "outside",
      "platform_area": "Right side area",
      "side": "Right side (outside station)",
      "landmark": "Bus icons shown on the right side",
      "answer": "Bus stand is outside the station on the right side, near the bus stop area.",
      "coordinates": { x: 90, y: 70 }
    },
    {
      "key": "call_pco",
      "names": ["call", "pco", "phone", "telephone"],
      "location_type": "outside",
      "platform_area": "Lower right side area",
      "side": "Metro side (right side)",
      "landmark": "Phone icon shown on the right side",
      "answer": "Call/PCO is outside on the Metro side (right side).",
      "coordinates": { x: 65, y: 55 }
    },
    {
      "key": "cinema_minerva",
      "names": ["cinema", "minerva cinema", "movie"],
      "location_type": "outside",
      "platform_area": "Top-left direction",
      "side": "Kashmere Gate side",
      "landmark": "Marked 'Minerva Cinema' towards Kashmere Gate",
      "answer": "Minerva Cinema is outside the station towards Kashmere Gate side.",
      "coordinates": { x: 25, y: 10 }
    },
    {
      "key": "cloak_room",
      "names": ["cloak room", "luggage", "luggage room", "bag deposit", "storage"],
      "location_type": "outside",
      "platform_area": "Near Platforms 7–8 side",
      "side": "Metro side (right side)",
      "landmark": "Cloak room icon in the Metro-side amenity cluster",
      "answer": "Cloak room is outside the station on the Metro side (right side), near Platforms 7–8 area.",
      "coordinates": { x: 70, y: 40 }
    },
    {
      "key": "enquiry",
      "names": ["enquiry", "information", "helpdesk", "info"],
      "location_type": "outside",
      "platform_area": "Near Platforms 7–8 side",
      "side": "Metro side (right side)",
      "landmark": "Enquiry (i) icon in the Metro-side amenity cluster",
      "phone": "139",
      "answer": "Enquiry counter is outside the station on the Metro side (right side), near Platforms 7–8 area. You can also call 139.",
      "coordinates": { x: 15, y: 10 }
    },
    {
      "key": "escalator",
      "names": ["escalator", "moving stairs"],
      "location_type": "outside",
      "platform_area": "Near Platforms 7–8 side",
      "side": "Metro side (right side)",
      "landmark": "Escalator icon in the Metro-side amenity cluster",
      "answer": "Escalator is outside the station on the Metro side (right side), near Platforms 7–8 area.",
      "coordinates": { x: 72, y: 38 }
    },
    {
      "key": "exit_entry",
      "names": ["exit", "entry", "gate", "entrance", "way out"],
      "location_type": "outside",
      "platform_area": "Near Platforms 7–8 side",
      "side": "Metro side (right side)",
      "landmark": "Exit/Entry arrows near the Metro-side amenity cluster",
      "answer": "Exit/Entry is on the Metro side (right side), near the main amenity area.",
      "coordinates": { x: 80, y: 45 }
    },
    {
      "key": "hospital",
      "names": ["hospital", "medical", "doctor", "first aid", "health"],
      "location_type": "outside",
      "platform_area": "Near Platforms 7–8 side",
      "side": "Metro side (right side)",
      "landmark": "Hospital icon in the Metro-side amenity cluster",
      "answer": "Medical help is outside the station on the Metro side (right side), near Platforms 7–8 area.",
      "coordinates": { x: 78, y: 32 }
    },
    {
      "key": "hotel",
      "names": ["hotel", "stay", "rooms", "lodging"],
      "location_type": "outside",
      "platform_area": "Near Platforms 7–8 side",
      "side": "Metro side (right side)",
      "landmark": "Hotel/bed icon in the Metro-side amenity cluster",
      "answer": "Hotels are outside the station on the Metro side (right side), near Platforms 7–8 area.",
      "coordinates": { x: 70, y: 30 }
    },
    {
      "key": "library_delhi_public",
      "names": ["library", "delhi public library", "books"],
      "location_type": "outside",
      "platform_area": "Right side (marked Delhi Public Library)",
      "side": "Right side (outside station)",
      "landmark": "Marked 'Delhi Public Library' on the right side",
      "answer": "Delhi Public Library is outside the station on the right side.",
      "coordinates": { x: 95, y: 30 }
    },
    {
      "key": "mcdonalds",
      "names": ["mcdonalds", "mc donalds", "mc d", "burger"],
      "location_type": "outside",
      "platform_area": "Near Platforms 7–8 side",
      "side": "Metro side (right side)",
      "landmark": "Near Police icon in the Metro-side amenity cluster",
      "answer": "McDonald’s is outside the station on the Metro side (right side), near Platforms 7–8 area, close to the Police helpdesk.",
      "coordinates": { x: 68, y: 42 }
    },
    {
      "key": "metro",
      "names": ["metro", "delhi metro", "subway"],
      "location_type": "outside",
      "platform_area": "Right side (marked Metro)",
      "side": "Metro side (right side)",
      "landmark": "Metro marked on the map",
      "answer": "Metro is outside the station on the right side (Metro side).",
      "coordinates": { x: 85, y: 22 }
    },
    {
      "key": "parking",
      "names": ["parking", "car parking", "bike parking", "park"],
      "location_type": "outside",
      "platform_area": "Right side area",
      "side": "Right side (outside station)",
      "landmark": "Parking icons shown on the right side",
      "answer": "Parking is outside the station on the right side.",
      "coordinates": { x: 92, y: 60 }
    },
    {
      "key": "police",
      "names": ["police", "security", "help", "complaint"],
      "location_type": "outside",
      "platform_area": "Near Platforms 7–8 side",
      "side": "Metro side (right side)",
      "landmark": "Police icon in the Metro-side amenity cluster",
      "answer": "Police helpdesk is outside the station on the Metro side (right side), near Platforms 7–8 area.",
      "coordinates": { x: 76, y: 42 }
    },
    {
      "key": "prepaid_auto",
      "names": ["prepaid auto", "auto", "auto stand", "rickshaw"],
      "location_type": "outside",
      "platform_area": "Right side area",
      "side": "Metro side (right side)",
      "landmark": "Prepaid auto icon shown on the right side",
      "answer": "Prepaid auto is outside the station on the Metro side (right side).",
      "coordinates": { x: 68, y: 80 }
    },
    {
      "key": "prepaid_taxi",
      "names": ["prepaid taxi", "taxi", "cab", "cab stand"],
      "location_type": "outside",
      "platform_area": "Right side area",
      "side": "Metro side (right side)",
      "landmark": "Prepaid taxi icon shown on the right side",
      "answer": "Prepaid taxi is outside the station on the Metro side (right side).",
      "coordinates": { x: 75, y: 85 }
    },
    {
      "key": "restaurant",
      "names": ["food", "restaurant", "food court", "canteen", "eat", "snacks"],
      "location_type": "outside",
      "platform_area": "Near Platforms 7–8 side",
      "side": "Metro side (right side)",
      "landmark": "Restaurant icon in the Metro-side amenity cluster",
      "answer": "Restaurants/food options are outside the station on the Metro side (right side), near Platforms 7–8 area.",
      "coordinates": { x: 72, y: 28 }
    },
    {
      "key": "temple",
      "names": ["temple", "mandir", "pray"],
      "location_type": "outside",
      "platform_area": "Right side area",
      "side": "Right side (outside station)",
      "landmark": "Temple icon shown on the right side",
      "answer": "Temple is outside the station on the right side.",
      "coordinates": { x: 92, y: 80 }
    },
    {
      "key": "ticket_counter",
      "names": ["ticket", "ticket counter", "counter", "booking"],
      "location_type": "outside",
      "platform_area": "Near Platforms 7–8 side",
      "side": "Metro side (right side)",
      "landmark": "Ticket icon in the Metro-side amenity cluster",
      "answer": "Ticket counter is outside the station on the Metro side (right side), near Platforms 7–8 area.",
      "coordinates": { x: 88, y: 28 }
    },
    {
      "key": "toilet",
      "names": ["toilet", "washroom", "restroom", "bathroom"],
      "location_type": "outside",
      "platform_area": "Near Platforms 7–8 side",
      "side": "Metro side (right side)",
      "landmark": "Toilet icon in the Metro-side amenity cluster",
      "answer": "Toilets are outside the station on the Metro side (right side), near Platforms 7–8 area.",
      "coordinates": { x: 85, y: 25 }
    },
    {
      "key": "waiting_area",
      "names": ["waiting", "waiting area", "waiting room", "sit"],
      "location_type": "outside",
      "platform_area": "Near Platforms 7–8 side",
      "side": "Metro side (right side)",
      "landmark": "Waiting area icon in the Metro-side amenity cluster",
      "answer": "Waiting area is outside the station on the Metro side (right side), near Platforms 7–8 area.",
      "coordinates": { x: 90, y: 90 }
    }
  ]
};
