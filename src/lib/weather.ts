const BOSKOOP_COORDS = {
  lat: 52.0775,
  lon: 4.6547,
};

interface WeatherAPIResponse {
  hourly?: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    weather_code: number[];
  };
  error?: boolean;
  reason?: string;
}

export type WeatherData = {
  temperature: number;
  precipitation: number;
  weatherCode: number;
  description: string;
  color: string;
  icon: string;
  background: string;
};

export function getWeatherIcon(code: number): { icon: string; description: string; color: string; background: string } {
  // WMO Weather interpretation codes: https://open-meteo.com/en/docs
  switch (true) {
    case [0, 1].includes(code): // Clear, Mainly clear
      return {
        icon: '☀️',
        description: 'Clear sky',
        color: 'text-amber-500',
        background: 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?w=800&auto=format&fit=crop&q=60',
      };
    case code === 2: // Partly cloudy
      return {
        icon: '⛅',
        description: 'Partly cloudy',
        color: 'text-blue-400',
        background: 'https://images.unsplash.com/photo-1612251017776-972d48e963c8?w=800&auto=format&fit=crop&q=60',
      };
    case code === 3: // Overcast
      return {
        icon: '☁️',
        description: 'Overcast',
        color: 'text-gray-500',
        background: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=800&auto=format&fit=crop&q=60',
      };
    case [45, 48].includes(code): // Foggy
      return {
        icon: '🌫️',
        description: 'Foggy',
        color: 'text-gray-400',
        background: 'https://images.unsplash.com/photo-1543968996-ee822b8176ba?w=800&auto=format&fit=crop&q=60',
      };
    case [51, 53, 55, 56, 57].includes(code): // Drizzle
      return {
        icon: '🌧️',
        description: 'Light rain',
        color: 'text-blue-500',
        background: 'https://images.unsplash.com/photo-1511634829096-045a111727eb??w=800&auto=format&fit=crop&q=70',
      };
    case [61, 63, 65, 66, 67].includes(code): // Rain
      return {
        icon: '🌧️',
        description: 'Rain',
        color: 'text-blue-600',
        background: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=800&auto=format&fit=crop&q=60',
      };
    case [71, 73, 75, 77].includes(code): // Snow
      return {
        icon: '🌨️',
        description: 'Snow',
        color: 'text-blue-200',
        background: 'https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=800&auto=format&fit=crop&q=60',
      };
    case [80, 81, 82].includes(code): // Rain showers
      return {
        icon: '🌦️',
        description: 'Rain showers',
        color: 'text-blue-500',
        background: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=800&auto=format&fit=crop&q=60',
      };
    case [95, 96, 99].includes(code): // Thunderstorm
      return {
        icon: '⛈️',
        description: 'Thunderstorm',
        color: 'text-purple-600',
        background: 'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=800&auto=format&fit=crop&q=60',
      };
    default:
      return {
        icon: '🌥️',
        description: 'Cloudy',
        color: 'text-gray-400',
        background: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=800&auto=format&fit=crop&q=60',
      };
  }
}

export async function getWeatherForecast(date: string, time: string): Promise<WeatherData | null> {
  try {
    // Validate inputs
    if (!date || !time) {
      console.error('Weather forecast error: Missing date or time parameter', { date, time });
      return null;
    }

    // Round to nearest hour since the API only provides hourly data
    const [hours, minutes] = time.split(':');
    const roundedHours = minutes && parseInt(minutes) >= 30 
      ? (parseInt(hours) + 1).toString().padStart(2, '0')
      : hours.padStart(2, '0');
    const formattedTime = `${roundedHours}:00:00`;
    
    const targetDate = new Date(`${date}T${formattedTime}`);
    const formattedDate = targetDate.toISOString().split('T')[0];
    
    if (isNaN(targetDate.getTime())) {
      console.error('Weather forecast error: Invalid date or time format', { date, time, formattedTime });
      return null;
    }
    
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.append('latitude', BOSKOOP_COORDS.lat.toString());
    url.searchParams.append('longitude', BOSKOOP_COORDS.lon.toString());
    url.searchParams.append('hourly', 'temperature_2m,precipitation_probability,weather_code');
    url.searchParams.append('timezone', 'Europe/Amsterdam');
    url.searchParams.append('start_date', formattedDate);
    url.searchParams.append('end_date', formattedDate);

    // Adjust date if hours rolled over to next day
    if (parseInt(roundedHours) === 0 && parseInt(hours) === 23) {
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);
      url.searchParams.set('end_date', nextDate.toISOString().split('T')[0]);
    }
    
    // Try up to 3 times with exponential backoff
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'CyclingApp/1.0',
          },
        });
    
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
        }
    
        const data: WeatherAPIResponse = await response.json();
        
        if (data.error || !data.hourly) {
          throw new Error(`Invalid API response format: ${data.reason || 'Missing hourly data'}`);
        }
    
        const targetDateTime = `${date}T${formattedTime}`;
        const index = data.hourly.time.findIndex((t: string) => {
          // Remove seconds from API time for comparison
          const apiTime = t.split(':')[0] + ':' + t.split(':')[1];
          // Remove seconds from target time
          const targetTime = targetDateTime.split(':')[0] + ':' + targetDateTime.split(':')[1];
          return apiTime === targetTime;
        });
    
        if (index === -1) {
          console.error('Weather forecast error: No data for specified time', {
            targetDateTime,
            availableTimes: data.hourly.time
          });
          return null;
        }

        const temperature = data.hourly.temperature_2m[index];
        const precipitation = data.hourly.precipitation_probability[index];
        const weatherCode = data.hourly.weather_code[index];

        if (typeof temperature !== 'number' || typeof precipitation !== 'number' || typeof weatherCode !== 'number') {
          console.error('Weather forecast error: Invalid data values', {
            temperature,
            precipitation,
            weatherCode
          });
          return null;
        }
    
        return {
          temperature,
          precipitation,
          weatherCode,
          ...getWeatherIcon(weatherCode)
        };
      } catch (error: unknown) {
        if (attempt === 2) { // Last attempt
          throw error; // Re-throw on final attempt
        } else {
          console.warn(`Weather API attempt ${attempt + 1} failed, retrying...`, error);
        }
        // Wait before retrying (exponential backoff: 1s, 2s, 4s)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    return null; // Fallback if all retries fail
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to fetch weather:', {
      error: errorMessage,
      date,
      time
    });
    return null;
  }
}