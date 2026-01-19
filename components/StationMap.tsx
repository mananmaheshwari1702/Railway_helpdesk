
import React from 'react';
import { Amenity } from '../types';

interface StationMapProps {
  amenities: Amenity[];
  selectedAmenity: Amenity | null;
  onSelect: (amenity: Amenity) => void;
}

const StationMap: React.FC<StationMapProps> = ({ amenities, selectedAmenity, onSelect }) => {
  return (
    <div className="flex-1 bg-gray-900 relative flex flex-col overflow-hidden w-full h-full">
        {/* Map Viewport - centers the image-container */}
        <div className="flex-1 w-full h-full flex items-center justify-center p-4 overflow-hidden relative">
            
            {/* 
              IMAGE WRAPPER: 
              Using inline-block ensures the div shrinks to fit the <img> dimensions exactly.
              This guarantees that 'top/left' percentages on child pins map 1:1 to the image content.
            */}
            <div className="relative inline-block shadow-2xl rounded-lg overflow-hidden border border-gray-700 bg-black">
                
                {/* The Map Image */}
                <img 
                    src="/Station_map.jpg" 
                    alt="Station Map" 
                    className="block w-auto h-auto max-w-full max-h-[60vh] md:max-h-[65vh] object-contain"
                />

                {/* Pins Overlay */}
                {amenities.map((item) => {
                    const isSelected = selectedAmenity?.key === item.key;
                    // If something is selected, dim others. If nothing selected, show all bright.
                    const isDimmed = selectedAmenity && !isSelected;

                    return (
                        <div 
                            key={item.key}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(item);
                            }}
                            className={`absolute flex flex-col items-center justify-end cursor-pointer transition-all duration-500 ease-out group
                                ${isSelected ? 'z-50 scale-125' : 'z-30 hover:z-40 hover:scale-110'}
                                ${isDimmed ? 'opacity-30 grayscale' : 'opacity-100'}
                            `}
                            style={{ 
                                left: `${item.coordinates.x}%`, 
                                top: `${item.coordinates.y}%`,
                                transform: 'translate(-50%, -100%)' // Pin tip at exact coordinates
                            }}
                        >
                             {/* Label on Hover / Select */}
                             <div className={`
                                whitespace-nowrap text-[10px] font-bold px-2 py-0.5 rounded shadow-lg mb-1 transition-opacity duration-300
                                ${isSelected ? 'bg-red-600 text-white opacity-100 animate-bounce' : 'bg-white text-black opacity-0 group-hover:opacity-100'}
                             `}>
                                {item.names[0].toUpperCase()}
                             </div>

                             {/* Pin Icon */}
                             <svg viewBox="0 0 24 24" fill="currentColor" className={`drop-shadow-md transition-colors duration-300 ${isSelected ? 'text-red-500 w-10 h-10' : 'text-blue-500 w-6 h-6'}`}>
                                 <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                             </svg>

                             {/* Pulse Effect for selected */}
                             {isSelected && (
                                 <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75"></div>
                             )}
                        </div>
                    );
                })}
            </div>

            {!selectedAmenity && (
                 <div className="absolute top-4 left-4 bg-black/80 text-white p-2 px-3 rounded-lg text-xs backdrop-blur-md border border-white/10 pointer-events-none shadow-lg z-10">
                     ℹ️ &nbsp; Tap markers to view details
                 </div>
             )}
        </div>
    </div>
  );
};

export default React.memo(StationMap);
