
import React from 'react';
import { Amenity } from '../types';

interface AmenityCardProps {
  amenity: Amenity | null;
}

const AmenityCard: React.FC<AmenityCardProps> = ({ amenity }) => {
  if (!amenity) {
    return (
      <div className="bg-gray-800 p-3 border-t border-gray-700 text-center text-gray-400 text-sm">
         Tap on any marker to see details, or ask: "Where is the ATM?"
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-4 border-t-4 border-red-500 animate-[slideIn_0.3s_ease-out] shadow-lg relative z-20">
      <div className="flex justify-between items-start">
        <div>
           <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-red-400 text-2xl">📍</span>
              {amenity.names[0].toUpperCase().replace('_', ' ')}
           </h3>
           <p className="text-gray-300 mt-1 text-sm md:text-base leading-snug">{amenity.answer}</p>
        </div>
        {amenity.phone && (
          <div className="bg-green-900 text-green-100 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
             📞 {amenity.phone}
          </div>
        )}
      </div>
      
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="bg-gray-700 text-blue-200 px-2 py-1 rounded border border-gray-600">
             {amenity.platform_area}
          </span>
          <span className="bg-gray-700 text-yellow-200 px-2 py-1 rounded border border-gray-600">
             {amenity.side}
          </span>
          {amenity.landmark && (
             <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded border border-gray-600 italic">
                Near: {amenity.landmark}
             </span>
          )}
      </div>
    </div>
  );
};

export default React.memo(AmenityCard);
