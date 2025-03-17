import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Don't persist auth state
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

export type Ride = {
  id: string;
  date: string;
  time: string;
  start_location: string;
  distance: number;
  expected_speed?: number;
  route_description?: string;
  rider_id: string;
  created_at: string;
};

export type Participant = {
  id: string;
  ride_id: string;
  rider_id: string;
  riders: Rider;
  created_at: string;
};

export type Rider = {
  id: string;
  name: string;
  created_at: string;
};