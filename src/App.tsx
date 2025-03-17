import React, { useEffect, useState } from 'react';
import { Bike, Pencil, X, ArrowLeft, BarChart as ChartBar } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { supabase, type Ride, type Participant, type Rider } from './lib/supabase';
import { getWeatherForecast, type WeatherData } from './lib/weather';
import { WeatherRideCard } from './components/WeatherRideCard';
import { RidePreviewCard } from './components/RidePreviewCard';
import { ConfirmDialog } from './components/ConfirmDialog';
import { RiderStats } from './components/RiderStats';

function App() {
  const [rides, setRides] = React.useState<(Ride & { participants: Participant[] })[]>([]);
  const [riders, setRiders] = React.useState<Rider[]>([]);
  const [isCreating, setIsCreating] = React.useState(false);
  const [showStats, setShowStats] = React.useState(false);
  const [weather, setWeather] = React.useState<Record<string, WeatherData>>({});
  const [selectedRide, setSelectedRide] = React.useState<string | null>(null);
  const [editingRide, setEditingRide] = React.useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    type: 'ride' | 'participant';
    id: string;
    name?: string;
  } | null>(null);

  React.useEffect(() => {
    loadRides();
    loadRiders();
  }, []);

  async function loadRiders() {
    const { data: riders, error } = await supabase
      .from('riders')
      .select('*')
      .order('name');

    if (error) {
      console.error('Failed to load riders:', error);
      toast.error('Failed to load riders');
      return;
    }

    setRiders(riders);
  }

  React.useEffect(() => {
    async function loadWeather() {
      const weatherData: Record<string, WeatherData> = {};
      let errors = 0;

      const promises = rides.map(async (ride) => {
        try {
          const forecast = await getWeatherForecast(ride.date, ride.time);
          if (forecast) {
            weatherData[ride.id] = forecast;
          } else {
            console.warn(`No weather data available for ride:`, {
              rideId: ride.id,
              date: ride.date,
              time: ride.time,
            });
          }
        } catch (error) {
          errors++;
          console.error(`Failed to load weather for ride:`, {
            rideId: ride.id,
            date: ride.date,
            time: ride.time,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });

      await Promise.all(promises);
      
      if (errors > 0) {
        toast.error(`Failed to load weather for ${errors} ride${errors > 1 ? 's' : ''}`);
      }

      setWeather(weatherData);
    }

    if (rides.length > 0) {
      loadWeather();
    } else {
      setWeather({});
    }
  }, [rides]);

  async function loadRides() {
    const { data: rides, error } = await supabase
      .from('rides')
      .select(`
        *,
        participants (
          *,
          riders (*)
        )
      `);

    if (error) {
      console.error('Failed to load rides:', {
        error: error.message,
        details: error.details,
        hint: error.hint,
      });
      toast.error('Failed to load rides');
      return;
    }

    // Filter future rides for display
    const today = new Date().toISOString().split('T')[0];
    const futureRides = rides.filter(ride => ride.date >= today);

    if (!Array.isArray(rides)) {
      console.error('Invalid rides data format:', rides);
      toast.error('Failed to load rides: Invalid data format');
      return;
    }

    setRides(rides);
  }

  const selectedRideData = selectedRide ? rides.find(r => r.id === selectedRide) : null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const rideData = {
      date: formData.get('date'),
      time: formData.get('time'),
      rider_id: formData.get('organizer'),
      start_location: formData.get('location'),
      distance: Number(formData.get('distance')),
      expected_speed: formData.get('speed') ? Number(formData.get('speed')) : null,
      route_description: formData.get('description') || null,
    };

    const { data: newRide, error } = await supabase
      .from('rides')
      .insert(rideData)
      .select(`
        *,
        participants (*)
      `)
      .single();

    if (error) {
      toast.error('Failed to create ride');
      return;
    }

    // Fetch weather for the new ride immediately
    const forecast = await getWeatherForecast(newRide.date, newRide.time);
    if (forecast && newRide) {
      setWeather(prev => ({
        ...prev,
        [newRide.id]: forecast
      }));
    }

    toast.success('Ride created!');
    form.reset();
    setIsCreating(false);
    loadRides(); // Reload all rides to ensure consistency
  }

  async function handleJoinRide(rideId: string, riderId: string) {
    const { error } = await supabase
      .from('participants')
      .insert({
        ride_id: rideId,
        rider_id: riderId,
      });

    if (error) {
      toast.error('Failed to join ride');
      return;
    }

    toast.success('Joined ride!');
    loadRides();
  }

  async function confirmDeleteRide(rideId: string) {
    setDeleteConfirm({ type: 'ride', id: rideId });
  }

  async function confirmDeleteParticipant(participantId: string, riderName: string) {
    setDeleteConfirm({ type: 'participant', id: participantId, name: riderName });
  }

  async function executeDeleteRide(rideId: string) {
    const { error } = await supabase
      .from('rides')
      .delete()
      .eq('id', rideId)
      .select();

    if (error) {
      toast.error('Failed to delete ride');
      return;
    }

    setRides(prev => prev.filter(ride => ride.id !== rideId));
    toast.success('Ride deleted!');
  }

  async function executeDeleteParticipant(participantId: string) {
    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('id', participantId)
      .select();

    if (error) {
      toast.error('Failed to remove participant');
      return;
    }

    setRides(prev => prev.map(ride => ({
      ...ride,
      participants: ride.participants.filter(p => p.id !== participantId)
    })));
    toast.success('Participant removed');
  }

  async function handleUpdateRide(rideId: string, updates: Partial<Ride>) {
    const { error } = await supabase
      .from('rides')
      .update(updates)
      .eq('id', rideId);

    if (error) {
      toast.error('Failed to update ride');
      return;
    }

    toast.success('Ride updated!');
    setEditingRide(null);
    loadRides();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6 text-white">
      <Toaster position="top-right" />
      
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8 relative">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/20 backdrop-blur-sm">
              <Bike className="w-8 h-8 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold">'t Zondagse fietsclubje</h1>
          </div>
          <div className="flex items-center gap-3">
            {selectedRide || showStats ? (
              <button
                onClick={() => {
                  setSelectedRide(null);
                  setShowStats(false);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 backdrop-blur-sm transition-colors text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <>
              <button
                onClick={() => setShowStats(true)}
                className="px-6 py-3 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-xl backdrop-blur-sm border border-indigo-500/20 transition-all duration-300 flex items-center gap-2"
              >
                <ChartBar className="w-5 h-5" />
                <span>Statistieken</span>
              </button>
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="px-6 py-3 bg-indigo-500/20 hover:bg-indigo-500/30 rounded-xl backdrop-blur-sm border border-indigo-500/20 transition-all duration-300"
            >
              {isCreating ? 'Annuleren' : 'Rit Aanmaken'}
            </button>
              </>
            )}
          </div>
        </header>

        {isCreating && (
          <form onSubmit={handleSubmit} className="glass-dark rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-xl font-semibold mb-6 text-white">Nieuwe Rit Aanmaken</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white/80 mb-2">Je Naam (Organisator)</label>
                <select
                  name="organizer"
                  required
                  className="w-full rounded-xl bg-white/80 border-0 shadow-sm focus:ring-2 focus:ring-indigo-500 text-gray-900"
                >
                  <option value="">Kies een rijder...</option>
                  {riders.map(rider => (
                    <option key={rider.id} value={rider.id}>
                      {rider.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Datum</label>
                <input
                  type="date"
                  name="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Tijd</label>
                <input
                  type="time"
                  name="time"
                  required
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white/80 mb-2">Startlocatie</label>
                <input
                  type="text"
                  name="location"
                  required
                  placeholder="Vul verzamelpunt in"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Afstand (km)</label>
                <input
                  type="number"
                  name="distance"
                  required
                  min="1"
                  step="0.1"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Verwachte Snelheid (km/u)</label>
                <input
                  type="number"
                  name="speed"
                  min="1"
                  step="0.1"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white/80 mb-2">Routebeschrijving</label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Optionele routedetails..."
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-all duration-300"
              >
                Rit Aanmaken
              </button>
            </div>
          </form>
        )}

        {selectedRideData ? (
          <WeatherRideCard
            ride={selectedRideData}
            weather={weather[selectedRideData.id]}
            onBack={() => setSelectedRide(null)}
            riders={riders}
            onDelete={() => confirmDeleteRide(selectedRideData.id)}
            onDeleteParticipant={(id, riderName) => confirmDeleteParticipant(id, riderName)}
            onEdit={() => setEditingRide(selectedRideData.id)}
            onUpdate={(updates) => handleUpdateRide(selectedRideData.id, updates)}
            isEditing={editingRide === selectedRideData.id}
            onJoin={(riderId) => handleJoinRide(selectedRideData.id, riderId)}
          />
        ) : showStats ? (
          <RiderStats riders={riders} rides={rides} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rides
              .filter(ride => ride.date >= new Date().toISOString().split('T')[0])
              .map((ride) => (
              <RidePreviewCard
                key={ride.id}
                ride={ride}
                weather={weather[ride.id]}
                onClick={() => setSelectedRide(ride.id)}
              />
            ))}

            {rides.length === 0 && (
              <div className="text-center py-12 text-white/60 md:col-span-2">
                Geen geplande ritten. Maak er een aan om te beginnen!
              </div>
            )}
          </div>
        )}
        
        <ConfirmDialog
          isOpen={deleteConfirm !== null}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => {
            if (deleteConfirm?.type === 'ride') {
              executeDeleteRide(deleteConfirm.id);
            } else if (deleteConfirm?.type === 'participant') {
              executeDeleteParticipant(deleteConfirm.id);
            }
            setDeleteConfirm(null);
          }}
          title={deleteConfirm?.type === 'ride' ? 'Delete Ride' : 'Remove Participant'}
          message={
            deleteConfirm?.type === 'ride'
              ? 'Are you sure you want to delete this ride? This action cannot be undone.'
              : `Are you sure you want to remove ${deleteConfirm?.name} from this ride?`
          }
        />
      </div>
    </div>
  );
}

export default App;