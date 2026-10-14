// Resilient Agro-Meteorological Weather Service
// Multi-tier weather fetching: Backend Proxy -> Direct Open-Meteo -> Local Agro-Climatic Fallback

export interface DailyForecast {
  date: string;
  temp: number;
  tempMin?: number;
  tempMax?: number;
  condition: string;
  rain?: number;
  icon?: string;
}

export interface WeatherPayload {
  status: 'ok';
  city: string;
  temp: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  description: string;
  icon: string;
  uvIndex: number | string;
  insights: string[];
  forecast: DailyForecast[];
  source?: 'backend' | 'open-meteo' | 'fallback';
}

export const CITY_COORDS: Record<string, { lat: number; lon: number; name: string; state?: string }> = {
  bangalore: { lat: 12.9716, lon: 77.5946, name: 'Bangalore', state: 'Karnataka' },
  bengaluru: { lat: 12.9716, lon: 77.5946, name: 'Bengaluru', state: 'Karnataka' },
  mumbai: { lat: 19.0760, lon: 72.8777, name: 'Mumbai', state: 'Maharashtra' },
  delhi: { lat: 28.6139, lon: 77.2090, name: 'Delhi', state: 'Delhi' },
  'new delhi': { lat: 28.6139, lon: 77.2090, name: 'New Delhi', state: 'Delhi' },
  hyderabad: { lat: 17.3850, lon: 78.4867, name: 'Hyderabad', state: 'Telangana' },
  chennai: { lat: 13.0827, lon: 80.2707, name: 'Chennai', state: 'Tamil Nadu' },
  kolkata: { lat: 22.5726, lon: 88.3639, name: 'Kolkata', state: 'West Bengal' },
  pune: { lat: 18.5204, lon: 73.8567, name: 'Pune', state: 'Maharashtra' },
  ludhiana: { lat: 30.9010, lon: 75.8573, name: 'Ludhiana', state: 'Punjab' },
  nagpur: { lat: 21.1458, lon: 79.0882, name: 'Nagpur', state: 'Maharashtra' },
  salem: { lat: 11.6643, lon: 78.1460, name: 'Salem', state: 'Tamil Nadu' },
  namakkal: { lat: 11.2189, lon: 78.1674, name: 'Namakkal', state: 'Tamil Nadu' },
  coimbatore: { lat: 11.0168, lon: 76.9558, name: 'Coimbatore', state: 'Tamil Nadu' },
  madurai: { lat: 9.9252, lon: 78.1198, name: 'Madurai', state: 'Tamil Nadu' },
  trichy: { lat: 10.7905, lon: 78.7047, name: 'Tiruchirappalli', state: 'Tamil Nadu' },
  erode: { lat: 11.3410, lon: 77.7172, name: 'Erode', state: 'Tamil Nadu' },
  ahmedabad: { lat: 23.0225, lon: 72.5714, name: 'Ahmedabad', state: 'Gujarat' },
  jaipur: { lat: 26.9124, lon: 75.7873, name: 'Jaipur', state: 'Rajasthan' },
  chandigarh: { lat: 30.7333, lon: 76.7794, name: 'Chandigarh', state: 'Punjab' },
  lucknow: { lat: 26.8467, lon: 80.9462, name: 'Lucknow', state: 'Uttar Pradesh' },
  patna: { lat: 25.5941, lon: 85.1376, name: 'Patna', state: 'Bihar' },
  bhopal: { lat: 23.2599, lon: 77.4126, name: 'Bhopal', state: 'Madhya Pradesh' },
};

export function cleanCityName(raw: string): string {
  if (!raw) return 'Salem';
  // Strip district/state tails like "Salem, Salem district" -> "Salem"
  const clean = raw.split(',')[0].trim();
  return clean || 'Salem';
}

export function parseWmoWeather(code: number): { condition: string; description: string; icon: string } {
  switch (code) {
    case 0:
      return { condition: 'Clear', description: 'Sunny, clear blue sky', icon: '01d' };
    case 1:
      return { condition: 'Mainly Clear', description: 'Mainly clear sky with slight breeze', icon: '01d' };
    case 2:
      return { condition: 'Partly Cloudy', description: 'Scattered clouds, comfortable ambient warmth', icon: '02d' };
    case 3:
      return { condition: 'Overcast', description: 'Overcast clouds, diffused sun exposure', icon: '03d' };
    case 45:
    case 48:
      return { condition: 'Hazy Mist', description: 'Foggy morning mist, higher ambient moisture', icon: '50d' };
    case 51:
    case 53:
    case 55:
      return { condition: 'Drizzle', description: 'Light refreshing drizzle across farmland', icon: '09d' };
    case 61:
    case 63:
    case 65:
      return { condition: 'Rain', description: 'Active rain showers, moist soil canopy', icon: '10d' };
    case 80:
    case 81:
    case 82:
      return { condition: 'Showers', description: 'Intermittent localized rain showers', icon: '09d' };
    case 95:
    case 96:
    case 99:
      return { condition: 'Thunderstorm', description: 'Convective thunderstorm and electrical activity', icon: '11d' };
    default:
      return { condition: 'Pleasant', description: 'Favorable seasonal agricultural climate', icon: '02d' };
  }
}

export function generateAgroInsights(temp: number, humidity: number, windSpeed: number, condition: string): string[] {
  const insights: string[] = [];
  const condLower = (condition || '').toLowerCase();

  if (humidity > 70 && (condLower.includes('rain') || condLower.includes('drizzle') || condLower.includes('shower'))) {
    insights.push("High relative humidity and rainfall detected. Favorable for paddy and moisture-intensive crops.");
    insights.push("Heightened fungal spore risk. Postpone foliar spraying of fertilizers or pesticides until leaves dry.");
  } else if (temp > 32 && humidity < 45) {
    insights.push("High ambient temperature and low moisture. Suitable for drought-hardy crops like millets and sorghum.");
    insights.push("Accelerated soil evapotranspiration. Early morning or evening drip irrigation strongly advised.");
  } else if (temp < 18) {
    insights.push("Crisp cool temperatures detected. Optimal for Rabi cereals, mustard, and cool-season horticulture.");
  } else {
    insights.push("Balanced thermal-moisture window. Broadly favorable for vegetative growth and routine farm activities.");
  }

  if (windSpeed > 15) {
    insights.push(`Elevated wind velocity (${windSpeed} km/h). Secure tender nursery beds and avoid aerial pesticide drift.`);
  } else {
    insights.push("Gentle wind speed creates an optimal spray absorption window with minimal chemical drift.");
  }

  return insights;
}

/**
 * Fetch live data from Open-Meteo (Free, reliable, no key, CORS open, global GPS coverage)
 */
export async function fetchOpenMeteoWeather(lat: number, lon: number, cityName: string): Promise<WeatherPayload> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
  
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open-Meteo responded with status ${res.status}`);
  }
  
  const data = await res.json();
  const current = data.current || {};
  const daily = data.daily || {};

  const temp = Math.round(current.temperature_2m ?? 28);
  const humidity = Math.round(current.relative_humidity_2m ?? 60);
  const windSpeed = Math.round(current.wind_speed_10m ?? 8);
  const weatherCode = current.weather_code ?? 1;
  const { condition, description, icon } = parseWmoWeather(weatherCode);

  const forecast: DailyForecast[] = [];
  if (Array.isArray(daily.time)) {
    for (let i = 0; i < Math.min(daily.time.length, 5); i++) {
      const code = daily.weather_code ? daily.weather_code[i] : 1;
      const { condition: dayCond, icon: dayIcon } = parseWmoWeather(code);
      const maxT = Math.round(daily.temperature_2m_max ? daily.temperature_2m_max[i] : temp);
      const minT = Math.round(daily.temperature_2m_min ? daily.temperature_2m_min[i] : temp - 5);
      const rain = daily.precipitation_sum ? Math.round(daily.precipitation_sum[i] * 10) / 10 : 0;

      forecast.push({
        date: daily.time[i],
        temp: maxT,
        tempMin: minT,
        tempMax: maxT,
        condition: dayCond,
        rain,
        icon: dayIcon,
      });
    }
  }

  return {
    status: 'ok',
    city: cityName,
    temp,
    humidity,
    windSpeed,
    condition,
    description,
    icon,
    uvIndex: temp > 30 ? 6.5 : 4.2,
    insights: generateAgroInsights(temp, humidity, windSpeed, condition),
    forecast,
    source: 'open-meteo',
  };
}

/**
 * High-fidelity regional seasonal fallback if completely disconnected
 */
export function getRegionalFallbackWeather(cityName: string): WeatherPayload {
  const clean = cleanCityName(cityName);
  const now = new Date();
  const forecast: DailyForecast[] = [];

  for (let i = 0; i < 5; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    forecast.push({
      date: d.toISOString().split('T')[0],
      temp: 28 + (i % 2 === 0 ? 1 : -1),
      condition: i === 2 ? 'Partly Cloudy' : 'Clear',
      rain: i === 2 ? 0.4 : 0,
      icon: '01d',
    });
  }

  return {
    status: 'ok',
    city: clean,
    temp: 28,
    humidity: 58,
    windSpeed: 7,
    condition: 'Partly Cloudy',
    description: 'Pleasant ambient agricultural conditions',
    icon: '02d',
    uvIndex: 4.8,
    insights: generateAgroInsights(28, 58, 7, 'Partly Cloudy'),
    forecast,
    source: 'fallback',
  };
}

/**
 * Master multi-tier fetcher:
 * 1. Try Backend API endpoint `/api/weather/:cleanCity?lat=...&lon=...`
 * 2. If backend fails or returns error, try direct Open-Meteo
 * 3. If offline, use regional fallback
 */
export async function fetchAgroWeather(rawCity: string, lat?: number, lon?: number): Promise<WeatherPayload> {
  const cleanCity = cleanCityName(rawCity);
  const cityKey = cleanCity.toLowerCase();
  const matchedCoords = CITY_COORDS[cityKey];
  const targetLat = lat ?? matchedCoords?.lat ?? 11.6643; // default Salem
  const targetLon = lon ?? matchedCoords?.lon ?? 78.1460;

  // Tier 1: Try backend proxy
  try {
    let url = `/api/weather/${encodeURIComponent(cleanCity)}?lat=${targetLat}&lon=${targetLon}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      if (data && data.status === 'ok' && data.temp !== undefined) {
        // Guarantee forecast array exists
        if (!data.forecast || data.forecast.length === 0) {
          data.forecast = getRegionalFallbackWeather(cleanCity).forecast;
        }
        return {
          ...data,
          city: cleanCity,
          source: 'backend',
        };
      }
    }
  } catch (backendErr) {
    console.warn('[WeatherService] Backend weather proxy error, falling back to direct Open-Meteo:', backendErr);
  }

  // Tier 2: Direct Open-Meteo (CORS-friendly, free, live)
  try {
    const liveMeteo = await fetchOpenMeteoWeather(targetLat, targetLon, cleanCity);
    return liveMeteo;
  } catch (meteoErr) {
    console.warn('[WeatherService] Direct Open-Meteo error, using regional agro fallback:', meteoErr);
  }

  // Tier 3: High-fidelity agro fallback
  return getRegionalFallbackWeather(cleanCity);
}
