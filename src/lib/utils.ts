import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parse } from "date-fns";
import { nl } from 'date-fns/locale';
import type { Ride, Participant } from './supabase';
import type { WeatherData } from './weather';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRideToShare(ride: Ride & { participants: Participant[] }, weather?: WeatherData): string {
  const date = format(new Date(ride.date), 'EEEE d MMMM', { locale: nl });
  const time = ride.time.slice(0, -3);
  
  let message = `🚴‍♂️ Fietsrit op ${date}\n\n`;
  message += `⏰ ${time} uur\n`;
  message += `📍 Start: ${ride.start_location}\n`;
  message += `📏 Afstand: ${ride.distance} km\n`;
  
  if (ride.expected_speed) {
    message += `⚡ Snelheid: ${ride.expected_speed} km/u\n`;
  }
  
  if (weather) {
    message += `\n🌡️ Weer: ${weather.temperature}°C ${weather.icon}`;
    if (weather.precipitation > 0) {
      message += ` (${weather.precipitation}% kans op neerslag)`;
    }
    message += '\n';
  }
  
  if (ride.route_description) {
    message += `\n📝 Route: ${ride.route_description}\n`;
  }
  
  if (ride.participants.length > 0) {
    message += `\n👥 Deelnemers (${ride.participants.length}):\n`;
    ride.participants.forEach(p => {
      message += `• ${p.riders.name}\n`;
    });
  }
  
  const organizer = ride.participants.find(p => p.rider_id === ride.rider_id);
  message += `\nGeorganiseerd door ${organizer?.riders?.name || 'Onbekend'} 🎯`;
  
  return message;
}
export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return format(date, 'EEEE, MMMM d, yyyy');
}

export function formatTime(timeString: string) {
  try {
    const time = parse(timeString, 'HH:mm', new Date());
    return format(time, 'h:mm a');
  } catch (error) {
    return timeString;
  }
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Get weather data from Open-Meteo API for the specific date and time
 */
export async function fetchWeather(date: string, time: string): Promise<Weather | null> {
  try {
    // Parse the date and time to get the timezone offset
    const rideDate = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    
    // Set the ride time on the ride date
    rideDate.setHours(hours, minutes, 0, 0);
    
    // Get the date in ISO format for the API
    const formattedDate = rideDate.toISOString().split('T')[0];
    
    // Coordinates for Boskoop, Netherlands
    const latitude = 52.08;
    const longitude = 4.65;
    
    console.log(`Fetching weather data for Boskoop (${latitude}, ${longitude}) on ${formattedDate} at ${time}`);
    
    // Construct URL for Open-Meteo API
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.append("latitude", latitude.toString());
    url.searchParams.append("longitude", longitude.toString());
    url.searchParams.append("hourly", "temperature_2m,weather_code,wind_speed_10m");
    url.searchParams.append("daily", "weather_code,temperature_2m_max,temperature_2m_min");
    url.searchParams.append("timezone", "Europe/Amsterdam");
    url.searchParams.append("start_date", formattedDate);
    url.searchParams.append("end_date", formattedDate);
    
    console.log(`API URL: ${url.toString()}`);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Weather API error:', errorData);
      throw new Error(`Weather data fetch failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Weather data received:', data);
    
    // Find the closest hour in the hourly data
    const hourIndex = findClosestHourIndex(data.hourly.time, rideDate);
    
    if (hourIndex === -1) {
      console.error('No matching time found in weather data');
      return null;
    }
    
    // Get weather data for the specific hour
    const temperature = Math.round(data.hourly.temperature_2m[hourIndex]);
    const weatherCode = data.hourly.weather_code[hourIndex];
    const windSpeed = Math.round(data.hourly.wind_speed_10m[hourIndex]);
    
    // Get weather description and icon from the weather code
    const { description, icon } = getWeatherInfo(weatherCode);
    
    return {
      temperature,
      description,
      icon,
      windSpeed
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}

/**
 * Find the index of the closest hour in the hourly data
 */
function findClosestHourIndex(timeArray: string[], targetDate: Date): number {
  const targetTime = targetDate.getTime();
  
  let closestIndex = -1;
  let smallestDiff = Infinity;
  
  timeArray.forEach((timeStr, index) => {
    const currentTime = new Date(timeStr).getTime();
    const timeDiff = Math.abs(currentTime - targetTime);
    
    if (timeDiff < smallestDiff) {
      smallestDiff = timeDiff;
      closestIndex = index;
    }
  });
  
  return closestIndex;
}

/**
 * Get weather description and icon based on the WMO weather code
 * https://open-meteo.com/en/docs#weathervariables
 */
function getWeatherInfo(code: number): { description: string, icon: string } {
  // Map WMO codes to descriptions and icons (similar to what OpenWeatherMap uses)
  const weatherMap: Record<number, { description: string, icon: string }> = {
    0: { description: 'clear sky', icon: '01d' },
    1: { description: 'mainly clear', icon: '02d' },
    2: { description: 'partly cloudy', icon: '03d' },
    3: { description: 'overcast', icon: '04d' },
    45: { description: 'fog', icon: '50d' },
    48: { description: 'depositing rime fog', icon: '50d' },
    51: { description: 'light drizzle', icon: '09d' },
    53: { description: 'moderate drizzle', icon: '09d' },
    55: { description: 'dense drizzle', icon: '09d' },
    56: { description: 'light freezing drizzle', icon: '09d' },
    57: { description: 'dense freezing drizzle', icon: '09d' },
    61: { description: 'slight rain', icon: '10d' },
    63: { description: 'moderate rain', icon: '10d' },
    65: { description: 'heavy rain', icon: '10d' },
    66: { description: 'light freezing rain', icon: '13d' },
    67: { description: 'heavy freezing rain', icon: '13d' },
    71: { description: 'slight snow fall', icon: '13d' },
    73: { description: 'moderate snow fall', icon: '13d' },
    75: { description: 'heavy snow fall', icon: '13d' },
    77: { description: 'snow grains', icon: '13d' },
    80: { description: 'slight rain showers', icon: '09d' },
    81: { description: 'moderate rain showers', icon: '09d' },
    82: { description: 'violent rain showers', icon: '09d' },
    85: { description: 'slight snow showers', icon: '13d' },
    86: { description: 'heavy snow showers', icon: '13d' },
    95: { description: 'thunderstorm', icon: '11d' },
    96: { description: 'thunderstorm with slight hail', icon: '11d' },
    99: { description: 'thunderstorm with heavy hail', icon: '11d' },
  };
  
  return weatherMap[code] || { description: 'unknown', icon: '03d' };
}

// Function to get the weather icon URL from OpenWeatherMap
export function getWeatherIconUrl(iconCode: string): string {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}