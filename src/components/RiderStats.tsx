import React from 'react';
import { Trophy, Calendar, Route, Activity } from 'lucide-react';
import type { Ride, Participant, Rider } from '../lib/supabase';

type RiderStatsProps = {
  riders: Rider[];
  rides: (Ride & { participants: Participant[] })[];
};

export function RiderStats({ riders, rides }: RiderStatsProps) {
  const stats = React.useMemo(() => {
    return riders.map(rider => {
      const participations = rides.reduce((acc, ride) => {
        const isParticipant = ride.participants.some(p => p.rider_id === rider.id);
        if (isParticipant) {
          acc.totalRides += 1;
          acc.totalDistance += ride.distance;
        }
        return acc;
      }, {
        totalRides: 0,
        totalDistance: 0,
      });

      const organized = rides.filter(ride => ride.rider_id === rider.id).length;

      return {
        ...rider,
        ...participations,
        organized,
      };
    }).sort((a, b) => b.totalRides - a.totalRides);
  }, [riders, rides]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {stats.map(rider => (
        <div
          key={rider.id}
          className="glass-dark rounded-xl p-6 backdrop-blur-md"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-xl font-semibold text-white">
              {rider.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{rider.name}</h3>
              <p className="text-white/60 text-sm">Lid sinds {new Date(rider.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-white">
              <div className="p-2 rounded-lg bg-purple-500/30 backdrop-blur-md">
                <Trophy className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <div className="text-sm text-white/60">Deelnames</div>
                <div className="font-semibold">{rider.totalRides}x</div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-white">
              <div className="p-2 rounded-lg bg-blue-500/30 backdrop-blur-md">
                <Calendar className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-white/60">Georganiseerd</div>
                <div className="font-semibold">{rider.organized}x</div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-white">
              <div className="p-2 rounded-lg bg-green-500/30 backdrop-blur-md">
                <Route className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <div className="text-sm text-white/60">Totale Afstand</div>
                <div className="font-semibold">{Math.round(rider.totalDistance)} km</div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-white">
              <div className="p-2 rounded-lg bg-amber-500/30 backdrop-blur-md">
                <Activity className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="text-sm text-white/60">Deelname %</div>
                <div className="font-semibold">
                  {rides.length ? Math.round((rider.totalRides / rides.length) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}