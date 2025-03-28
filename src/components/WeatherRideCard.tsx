import React from 'react';
import { Bike, Calendar, Clock, MapPin, Users, CloudSun, Pencil, X, Share2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import type { Ride, Participant, Rider } from '../lib/supabase';
import type { WeatherData } from '../lib/weather';
import { formatRideToShare } from '../lib/utils';

type WeatherRideCardProps = {
  ride: Ride & { participants: Participant[] };
  riders: Rider[];
  weather?: WeatherData;
  onBack: () => void;
  onDelete: () => void;
  onDeleteParticipant: (id: string, riderName: string) => void;
  onEdit: () => void;
  onUpdate: (updates: Partial<Ride>) => void;
  isEditing: boolean;
  onJoin: (riderId: string) => void;
};

export function WeatherRideCard({
  ride,
  riders,
  weather,
  onBack,
  onDelete,
  onDeleteParticipant,
  onEdit,
  onUpdate,
  isEditing,
  onJoin
}: WeatherRideCardProps) {
  const [isLoadingWeather, setIsLoadingWeather] = React.useState(!weather);
  const [weatherError, setWeatherError] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    start_location: ride.start_location,
    distance: ride.distance,
    expected_speed: ride.expected_speed,
    route_description: ride.route_description || ''
  });

  // Reset form when editing state changes
  React.useEffect(() => {
    if (isEditing) {
      setEditForm({
        start_location: ride.start_location,
        distance: ride.distance,
        expected_speed: ride.expected_speed,
        route_description: ride.route_description || ''
      });
    }
  }, [isEditing, ride]);

  React.useEffect(() => {
    setIsLoadingWeather(!weather);
    setWeatherError(!weather && !isLoadingWeather);
  }, [weather]);

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    onUpdate(editForm);
  }

  return (
    <div className="relative rounded-2xl shadow-xl overflow-hidden max-w-4xl mx-auto">
      <div
        className="absolute inset-0 animate-zoom-bg"
        style={weather?.background ? {
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.3)), url(${weather.background})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : {
          backgroundImage: 'linear-gradient(to right bottom, rgb(30, 41, 59), rgb(30, 41, 59))'
        }}
      />
      
      {/* Header with back button and actions */}
      <div className="relative z-20 flex items-center justify-between p-4 backdrop-blur-sm bg-black/30">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-blue-500/30 hover:bg-blue-500/40 backdrop-blur-md transition-colors text-white flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Terug</span>
        </button>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const message = formatRideToShare(ride, weather);
              navigator.clipboard.writeText(message);
              toast.success('Rit gekopieerd naar klembord!');
            }}
            className="p-2 rounded-lg bg-green-500/30 hover:bg-green-500/40 backdrop-blur-md transition-colors"
            title="Delen"
          >
            <Share2 className="w-5 h-5 text-green-500" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 rounded-lg bg-blue-500/30 hover:bg-blue-500/40 backdrop-blur-md transition-colors"
            title="Bewerken"
          >
            <Pencil className="w-5 h-5 text-blue-500" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg bg-red-500/30 hover:bg-red-500/40 backdrop-blur-md transition-colors"
            title="Verwijderen"
          >
            <X className="w-5 h-5 text-red-500" />
          </button>
        </div>
      </div>

      <div className="backdrop-blur-sm bg-black/20 p-4 sm:p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 rounded-lg bg-blue-500/30 backdrop-blur-md">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-sm sm:text-base">{format(new Date(ride.date), 'eeee d MMMM yyyy', { locale: nl })}</span>
            </div>
            
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 rounded-lg bg-indigo-500/30 backdrop-blur-md">
                <Clock className="w-5 h-5 text-indigo-500" />
              </div>
              <span className="text-sm sm:text-base">{ride.time.slice(0, 5)}</span>
            </div>
            
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 rounded-lg bg-violet-500/30 backdrop-blur-md">
                <Users className="w-5 h-5 text-violet-500" />
              </div>
              <span className="text-sm sm:text-base">Georganiseerd door {riders.find(r => r.id === ride.rider_id)?.name}</span>
            </div>
            
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 rounded-lg bg-red-500/30 backdrop-blur-md">
                <MapPin className="w-5 h-5 text-red-500" />
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.start_location}
                  onChange={(e) => setEditForm(prev => ({ ...prev, start_location: e.target.value }))}
                  className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-1 text-white text-sm sm:text-base"
                />
              ) : (
                <span className="text-sm sm:text-base">{ride.start_location}</span>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 rounded-lg bg-green-500/30 backdrop-blur-md">
                <Bike className="w-5 h-5 text-green-500" />
              </div>
              {isEditing ? (
                <div className="flex flex-wrap gap-2 items-center flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={editForm.distance}
                      onChange={(e) => setEditForm(prev => ({ ...prev, distance: Number(e.target.value) }))}
                      className="w-16 sm:w-20 bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-white text-sm sm:text-base"
                    />
                    <span className="text-sm sm:text-base">km</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={editForm.expected_speed}
                      onChange={(e) => setEditForm(prev => ({ ...prev, expected_speed: Number(e.target.value) }))}
                      placeholder="Speed"
                      className="w-16 sm:w-20 bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-white text-sm sm:text-base"
                    />
                    <span className="text-sm sm:text-base">km/h</span>
                  </div>
                </div>
              ) : (
                <span className="text-sm sm:text-base">
                  {ride.distance} km
                  {ride.expected_speed && <span className="ml-2">• {ride.expected_speed} km/h</span>}
                </span>
              )}
            </div>

            <div className="relative">
              {isLoadingWeather ? (
                <div className="p-4 rounded-xl bg-black/30 backdrop-blur-md border border-white/10 animate-pulse">
                  <div className="h-16 flex items-center justify-center text-white/70 text-sm sm:text-base">
                    Weersvoorspelling laden...
                  </div>
                  <div className="text-xs text-white/50 text-center mt-2">
                    Weer in Boskoop
                  </div>
                </div>
              ) : weather ? (
                <div className="p-4 rounded-xl bg-black/30 backdrop-blur-md border border-white/10">
                  <div className="flex items-center gap-4 text-white">
                    <span className="text-3xl sm:text-4xl">{weather.icon}</span>
                    <div>
                      <div className="font-medium mb-2 text-sm sm:text-lg">
                        {weather.description}
                      </div>
                      <div className="flex gap-3 items-center">
                        <span className="font-semibold text-2xl sm:text-3xl tracking-tight">
                          {weather.temperature}°C
                        </span>
                        {weather.precipitation > 0 && (
                          <span className="text-blue-200 flex items-center gap-1 text-base sm:text-lg">
                            <span>💧</span>
                            <span>{weather.precipitation}%</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-white/50 text-center mt-2">
                    Weer in Boskoop
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-black/30 backdrop-blur-md border border-red-500/20">
                  <div className="text-red-400 text-center flex items-center justify-center gap-2 text-sm sm:text-base">
                    <CloudSun className="w-5 h-5" />
                    <span>Kan weersvoorspelling niet laden</span>
                  </div>
                  <div className="text-xs text-white/50 text-center mt-2">
                    Weer in Boskoop
                  </div>
                </div>
              )}
            </div>

            {(isEditing || ride.route_description) && (
              <div className="mt-2">
                {isEditing ? (
                  <textarea
                    value={editForm.route_description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, route_description: e.target.value }))}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm sm:text-base"
                    rows={3}
                    placeholder="Beschrijf de route..."
                  />
                ) : (
                  <p className="text-white/90 text-sm sm:text-base">{ride.route_description}</p>
                )}
              </div>
            )}

            {isEditing && (
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => {
                    setEditForm({
                      start_location: ride.start_location,
                      distance: ride.distance,
                      expected_speed: ride.expected_speed,
                      route_description: ride.route_description || ''
                    });
                    onEdit();
                  }}
                  className="px-4 py-2 bg-gray-500/30 hover:bg-gray-500/40 rounded-lg text-white transition-colors text-sm sm:text-base"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleEditSubmit}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-colors text-sm sm:text-base"
                >
                  Wijzigingen Opslaan
                </button>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4 text-white">
              <div className="p-2 rounded-lg bg-purple-500/30 backdrop-blur-md">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className="font-medium text-sm sm:text-base">Deelnemers ({ride.participants.length})</h3>
            </div>
            
            <div className="space-y-2">
              {ride.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between text-white px-3 sm:px-4 py-2 rounded-lg bg-white/20 backdrop-blur-md"
                >
                  <span className="text-sm sm:text-base">{participant.riders.name}</span>
                  <button
                    onClick={() => onDeleteParticipant(participant.id, participant.riders.name)}
                    className="p-1 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const riderId = new FormData(e.currentTarget).get('rider') as string;
                  if (riderId) {
                    onJoin(riderId);
                    e.currentTarget.reset();
                  }
                }}
                className="flex flex-col sm:flex-row gap-2 pt-2 relative z-10"
              >
                <select
                  name="rider"
                  required
                  className="flex-1 rounded-xl bg-black/30 border border-white/10 shadow-sm focus:ring-2 focus:ring-indigo-500 text-white backdrop-blur-md px-3 py-2 text-sm sm:text-base"
                >
                  <option value="">Kies een rijder...</option>
                  {riders
                    .filter(rider => !ride.participants.some(p => p.rider_id === rider.id))
                    .map(rider => (
                      <option key={rider.id} value={rider.id}>
                        {rider.name}
                      </option>
                    ))
                  }
                </select>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-all duration-300 text-sm sm:text-base"
                >
                  Meedoen
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}