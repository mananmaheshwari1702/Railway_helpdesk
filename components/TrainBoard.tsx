
import React, { useState, useEffect, useRef } from 'react';
import { Train, PNRStatus, StationFacility, DashboardMode, Amenity } from '../types';
import StationMap from './StationMap';
import AmenityCard from './AmenityCard';

interface TrainBoardProps {
  mode: DashboardMode;
  trains: Train[];
  pnrData: PNRStatus | null;
  pnrError?: string | null;
  facilities: StationFacility[];
  activeAmenity?: Amenity | null;
  hasSearched?: boolean;
  amenities?: Amenity[];
}

const TrainBoard: React.FC<TrainBoardProps> = ({ mode, trains, pnrData, pnrError, facilities, activeAmenity, hasSearched = false, amenities = [] }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync activeAmenity (from voice) to local selection
  useEffect(() => {
    if (activeAmenity) {
        setSelectedAmenity(activeAmenity);
    }
  }, [activeAmenity]);

  // Scroll to top when trains change
  useEffect(() => {
    if (listRef.current) {
        listRef.current.scrollTop = 0;
    }
  }, [trains]);
  
  const renderHeader = () => {
    let title = "Train Information Display";
    let iconColor = "bg-red-500";
    
    if (mode === DashboardMode.PNR) {
        title = "PNR Status Enquiry";
        iconColor = "bg-blue-500";
    } else if (mode === DashboardMode.MAP) {
        title = "Station Facilities Map";
        iconColor = "bg-green-500";
    }

    return (
      <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-black p-3 flex justify-between items-center border-b-4 border-yellow-700 shadow-md z-10">
        <div className="flex items-center gap-3">
            <div className={`w-3 h-3 ${iconColor} rounded-full animate-ping`}></div>
            <h2 className="font-bold text-xl tracking-wider uppercase drop-shadow-sm">{title}</h2>
        </div>
        <div className="flex flex-col items-end">
             <span className="text-sm font-mono font-bold bg-black/10 px-2 rounded">{currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
             <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Your Station</span>
        </div>
      </div>
    );
  }

  const renderSchedule = () => (
    <>
      <div className="bg-blue-900 text-white p-2 grid grid-cols-5 gap-2 text-xs md:text-sm font-bold uppercase tracking-wider border-b border-blue-800">
        <div className="pl-2">Train No.</div>
        <div className="col-span-2">Name / Dest</div>
        <div>Time</div>
        <div className="text-right pr-2">PF</div>
      </div>
      <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-900 scrollbar-hide scroll-smooth">
        {trains.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                {hasSearched ? (
                    <>
                         <div className="text-4xl">❌</div>
                         <div className="text-center">
                            <p className="text-lg font-semibold text-red-400">No Trains Found</p>
                            <p className="text-xs mt-2 text-gray-600">Try checking the train number or city name.</p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 border-4 border-gray-700 border-t-yellow-500 rounded-full animate-spin opacity-50"></div>
                        <div className="text-center">
                            <p className="text-lg font-semibold text-gray-400">Waiting for query...</p>
                            <p className="text-xs mt-2 text-gray-600 uppercase tracking-widest">"Puchiye, kaunsi train chahiye?"</p>
                        </div>
                    </>
                )}
            </div>
        ) : (
            trains.map((train, idx) => (
            <div 
                key={`${train.trainNumber}-${idx}`} 
                className="bg-gray-800 text-yellow-400 p-3 rounded grid grid-cols-5 gap-2 items-center font-mono text-sm md:text-base border-l-4 border-green-500 shadow-sm animate-[fadeIn_0.5s_ease-out]"
                style={{ animationDelay: `${idx * 100}ms` }}
            >
                <div className="text-white font-bold text-lg tracking-wider">{train.trainNumber}</div>
                <div className="col-span-2 truncate">
                <span className="block text-white font-bold text-xs uppercase tracking-widest mb-0.5">{train.name}</span>
                <span className="text-gray-400 text-[10px] md:text-xs flex items-center gap-1">
                    {train.source} 
                    <span className="text-gray-600">➔</span> 
                    {train.destination}
                </span>
                </div>
                <div className={train.status === 'Delayed' ? 'text-red-500 animate-pulse font-bold' : 'text-green-400 font-bold'}>
                {train.departureTime}
                {train.status === 'Delayed' && <span className="block text-[10px] bg-red-900/50 px-1 rounded w-fit mt-1">Late {train.delay}</span>}
                </div>
                <div className="text-right font-bold text-2xl text-white bg-blue-800 rounded px-3 py-1 w-fit justify-self-end shadow-inner min-w-[3rem] text-center">
                {train.platform}
                </div>
            </div>
            ))
        )}
      </div>
    </>
  );

  const renderPNR = () => {
    if (pnrError) {
        return (
            <div className="flex-1 p-6 bg-gray-900 text-white flex flex-col items-center justify-center animate-[fadeIn_0.5s_ease-out]">
                <div className="w-full max-w-md p-8 bg-gray-800 border-2 border-red-500 rounded-xl text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>
                    <div className="relative z-10">
                        <div className="text-6xl mb-4">🚫</div>
                        <h3 className="text-2xl font-bold text-red-400 mb-2">PNR Not Found</h3>
                        <p className="text-gray-300">The PNR number provided is invalid or not in our database.</p>
                        <p className="mt-4 text-xs font-mono bg-black/30 p-2 rounded text-red-300">ERR_PNR_LOOKUP_FAILED</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
    <div className="flex-1 p-6 bg-gray-900 text-white flex flex-col items-center justify-center">
        {pnrData ? (
            <div className="w-full max-w-md bg-white text-black rounded-lg overflow-hidden shadow-2xl relative animate-[fadeIn_0.5s_ease-out]">
                {/* Ticket Header */}
                <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                    <span className="font-bold tracking-widest">e-TICKET</span>
                    <span className="font-mono">{pnrData.pnrNumber}</span>
                </div>
                {/* Dashed Line */}
                <div className="h-0 border-b-2 border-dashed border-gray-300 mx-2"></div>
                
                {/* Details */}
                <div className="p-6 space-y-4">
                    <div>
                        <p className="text-xs text-gray-500 uppercase">Train</p>
                        <p className="font-bold text-lg">{pnrData.trainName}</p>
                    </div>
                    <div className="flex justify-between">
                        <div>
                            <p className="text-xs text-gray-500 uppercase">Date</p>
                            <p className="font-semibold">{pnrData.date}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-xs text-gray-500 uppercase">Status</p>
                             <p className={`font-bold ${pnrData.passengers?.[0]?.status === 'CNF' ? 'text-green-600' : 'text-orange-500'}`}>
                                {pnrData.passengers?.[0]?.status === 'CNF' ? 'CONFIRMED' : 'WAITING'}
                             </p>
                        </div>
                    </div>
                    
                    <div className="bg-gray-100 p-3 rounded-lg mt-4">
                        <div className="grid grid-cols-4 gap-2 text-xs font-bold text-gray-500 border-b border-gray-300 pb-1 mb-1">
                            <div className="col-span-2">Name</div>
                            <div>Coach</div>
                            <div>Seat</div>
                        </div>
                        {pnrData.passengers?.map((p, i) => (
                            <div key={i} className="grid grid-cols-4 gap-2 text-sm font-semibold">
                                <div className="col-span-2">{p.name}</div>
                                <div>{p.coach}</div>
                                <div>{p.seat}</div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Cutout Circles */}
                <div className="absolute top-1/2 -left-3 w-6 h-6 bg-gray-900 rounded-full"></div>
                <div className="absolute top-1/2 -right-3 w-6 h-6 bg-gray-900 rounded-full"></div>
            </div>
        ) : (
            <div className="text-center text-gray-400 animate-pulse">
                <div className="text-6xl mb-4">🎫</div>
                <p>Scanning Ticket / PNR...</p>
            </div>
        )}
    </div>
  );
  }

  const renderMapMode = () => (
      <div className="flex-1 flex flex-col h-full bg-gray-900 overflow-hidden">
          <StationMap 
             amenities={amenities} 
             selectedAmenity={selectedAmenity}
             onSelect={setSelectedAmenity} 
          />
          <AmenityCard amenity={selectedAmenity} />
      </div>
  );

  return (
    <div className="bg-black rounded-lg border-4 border-gray-800 overflow-hidden shadow-2xl flex flex-col h-full ring-4 ring-black/20 transition-all duration-500">
      {renderHeader()}
      
      {mode === DashboardMode.SCHEDULE && renderSchedule()}
      {mode === DashboardMode.PNR && renderPNR()}
      {mode === DashboardMode.MAP && renderMapMode()}

      {/* Marquee Footer */}
      <div className="bg-blue-950 text-white p-2 overflow-hidden whitespace-nowrap border-t border-blue-900 z-10">
        <div className="animate-marquee inline-block text-sm font-mono text-yellow-300">
           Welcome to South East Central Railway Smart AI. Jai Johar! AI Inquiry Center ma apka swagat hai. Namaskar! SECR madhe aaple swagat ahe. Please stand in front of the camera and ask for assistance. Yatri kripya dhyan de, gaadi sankhya... *** SURAKSHA PRATHAM *** AAPKI YATRA MANGALMAY HO
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default React.memo(TrainBoard);
