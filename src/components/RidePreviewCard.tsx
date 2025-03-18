import React from 'react';
import { Bike, Calendar, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import type { Ride, Participant, Rider } from '../lib/supabase';
import type { WeatherData } from '../lib/weather';

type RidePreviewCardProps = {
  ride: Ride & { 
    participants: Participant[];
    organizer: Rider;
  };
  weather?: WeatherData;
  onClick: () => void;
};

export function RidePreviewCard({ ride, weather, onClick }: RidePreviewCardProps) {
  return (
    <div
      onClick={onClick}
      className="relative rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-102 hover:shadow-xl"
    >
      <div
        className="absolute inset-0 -z-10 animate-zoom-bg"
        style={weather?.background ? {
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.4)), url(${weather.background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : {
          backgroundImage: 'linear-gradient(to right bottom, rgb(30, 41, 59), rgb(30, 41, 59))'
        }}
      />
      <div className="backdrop-blur-sm bg-black/20 p-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 rounded-lg bg-blue-500/30 backdrop-blur-md">
              <Calendar className="w-4 h-4 text-blue-500" />
            </div>
            <span>{format(new Date(ride.date), 'eeee d MMMM', { locale: nl })}</span>
          </div>
          
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 rounded-lg bg-indigo-500/30 backdrop-blur-md">
              <Clock className="w-4 h-4 text-indigo-500" />
            </div>
            <span>{ride.time.slice(0, 5)}</span>
          </div>

          <div className="flex items-center gap-3 text-white">
            <div className="p-2 rounded-lg bg-violet-500/30 backdrop-blur-md">
              <Users className="w-4 h-4 text-violet-500" />
            </div>
            <span>{ride.organizer?.name}</span>
          </div>

          <div className="flex items-center gap-3 text-white">
            <div className="p-2 rounded-lg bg-green-500/30 backdrop-blur-md">
              <Bike className="w-4 h-4 text-green-500" />
            </div>
            <span>{ride.distance} km</span>
            {ride.expected_speed && <span>• {ride.expected_speed} km/h</span>}
          </div>

          {weather && (
            <div className="flex items-center gap-3 mt-4">
              <span className="text-3xl">{weather.icon}</span>
              <div className="text-white">
                <span className="font-semibold text-xl">
                  {weather.temperature}°C
                </span>
                {weather.precipitation > 0 && (
                  <span className="text-blue-200 ml-2">
                    💧 {weather.precipitation}%
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mt-4 text-white/90">
            <Users className="w-4 h-4" />
            <span>{ride.participants.length} {ride.participants.length === 1 ? 'deelnemer' : 'deelnemers'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}