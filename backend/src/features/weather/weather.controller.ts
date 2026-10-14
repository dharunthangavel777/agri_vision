import { Request, Response } from 'express';

const CITY_COORDS: Record<string, { lat: number; lon: number; name: string }> = {
  bangalore: { lat: 12.9716, lon: 77.5946, name: 'Bangalore' },
  bengaluru: { lat: 12.9716, lon: 77.5946, name: 'Bengaluru' },
  mumbai: { lat: 19.0760, lon: 72.8777, name: 'Mumbai' },
  delhi: { lat: 28.6139, lon: 77.2090, name: 'Delhi' },
  'new delhi': { lat: 28.6139, lon: 77.2090, name: 'New Delhi' },
  hyderabad: { lat: 17.3850, lon: 78.4867, name: 'Hyderabad' },
  chennai: { lat: 13.0827, lon: 80.2707, name: 'Chennai' },
  kolkata: { lat: 22.5726, lon: 88.3639, name: 'Kolkata' },
  pune: { lat: 18.5204, lon: 73.8567, name: 'Pune' },
  ludhiana: { lat: 30.9010, lon: 75.8573, name: 'Ludhiana' },
  nagpur: { lat: 21.1458, lon: 79.0882, name: 'Nagpur' },
  salem: { lat: 11.6643, lon: 78.1460, name: 'Salem' },
  namakkal: { lat: 11.2189, lon: 78.1674, name: 'Namakkal' },
  coimbatore: { lat: 11.0168, lon: 76.9558, name: 'Coimbatore' },
  madurai: { lat: 9.9252, lon: 78.1198, name: 'Madurai' },
  trichy: { lat: 10.7905, lon: 78.7047, name: 'Tiruchirappalli' },
  erode: { lat: 11.3410, lon: 77.7172, name: 'Erode' },
  ahmedabad: { lat: 23.0225, lon: 72.5714, name: 'Ahmedabad' },
  jaipur: { lat: 26.9124, lon: 75.7873, name: 'Jaipur' },
  chandigarh: { lat: 30.7333, lon: 76.7794, name: 'Chandigarh' },
  lucknow: { lat: 26.8467, lon: 80.9462, name: 'Lucknow' },
  patna: { lat: 25.5941, lon: 85.1376, name: 'Patna' },
  bhopal: { lat: 23.2599, lon: 77.4126, name: 'Bhopal' },
};

function parseWmoWeather(code: number): { condition: string; description: string; icon: string } {
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

function buildAgroInsights(temp: number, humidity: number, windSpeed: number, condition: string): string[] {
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

function getRegionalFallback(cleanCity: string) {
  const now = new Date();
  const forecast = [];
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
    city: cleanCity,
    temp: 28,
    humidity: 58,
    windSpeed: 7,
    condition: 'Partly Cloudy',
    description: 'Pleasant ambient agricultural conditions',
    icon: '02d',
    uvIndex: 4.8,
    insights: buildAgroInsights(28, 58, 7, 'Partly Cloudy'),
    forecast,
    fallback: true,
  };
}

export const getWeather = async (req: Request, res: Response) => {
  const rawCity = (req.params.city || (req.query.city as string) || '').trim();
  const cleanCity = rawCity.split(',')[0].trim() || 'Salem';
  const cityKey = cleanCity.toLowerCase();
  
  const queryLat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
  const queryLon = req.query.lon ? parseFloat(req.query.lon as string) : undefined;
  
  const matchedCoords = CITY_COORDS[cityKey];
  const targetLat = !isNaN(queryLat as number) ? queryLat : (matchedCoords?.lat ?? 11.6643);
  const targetLon = !isNaN(queryLon as number) ? queryLon : (matchedCoords?.lon ?? 78.1460);

  const apiKey = process.env.WEATHER_API_KEY || '19927003d654bcd63f64e32840eeba91';

  // 1. Try OpenWeatherMap if configured and valid
  if (apiKey && apiKey !== 'YOUR_OPENWEATHERMAP_API_KEY') {
    try {
      const owmController = new AbortController();
      const owmTimeout = setTimeout(() => owmController.abort(), 4000);

      let currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${targetLat}&lon=${targetLon}&appid=${apiKey}&units=metric`;
      let forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${targetLat}&lon=${targetLon}&appid=${apiKey}&units=metric`;

      const currentRes = await fetch(currentUrl, {
        signal: owmController.signal,
        headers: { 'User-Agent': 'AgriVision/1.0' }
      });

      if (currentRes.ok) {
        const currentData = await currentRes.json();
        const forecastRes = await fetch(forecastUrl, {
          signal: owmController.signal,
          headers: { 'User-Agent': 'AgriVision/1.0' }
        });
        clearTimeout(owmTimeout);

        const forecastData = forecastRes.ok ? await forecastRes.json() : null;
        const temp = Math.round(currentData.main.temp);
        const humidity = currentData.main.humidity;
        const windSpeed = Math.round(currentData.wind.speed * 3.6); // m/s to km/h
        const condition = currentData.weather[0].main;
        const description = currentData.weather[0].description;
        const icon = currentData.weather[0].icon;

        const dailyForecast = forecastData?.list ? forecastData.list.filter((_: any, index: number) => index % 8 === 0).map((item: any) => ({
          date: item.dt_txt.split(' ')[0],
          temp: Math.round(item.main.temp),
          condition: item.weather[0].main,
          rain: item.rain?.['3h'] || 0,
          icon: item.weather[0].icon
        })) : getRegionalFallback(cleanCity).forecast;

        return res.json({
          status: 'ok',
          city: currentData.name || cleanCity,
          temp,
          humidity,
          windSpeed,
          condition,
          description,
          icon,
          uvIndex: 4.5,
          insights: buildAgroInsights(temp, humidity, windSpeed, condition),
          forecast: dailyForecast
        });
      }
      clearTimeout(owmTimeout);
    } catch (e) {
      // Fall through to Open-Meteo
    }
  }

  // 2. Open-Meteo Fallback (Free, reliable, accurate, global coordinates)
  try {
    const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${targetLat}&longitude=${targetLon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
    const meteoRes = await fetch(meteoUrl, {
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'AgriVision/1.0' }
    });

    if (meteoRes.ok) {
      const meteoData = await meteoRes.json();
      const current = meteoData.current || {};
      const daily = meteoData.daily || {};

      const temp = Math.round(current.temperature_2m ?? 28);
      const humidity = Math.round(current.relative_humidity_2m ?? 60);
      const windSpeed = Math.round(current.wind_speed_10m ?? 8);
      const weatherCode = current.weather_code ?? 1;
      const { condition, description, icon } = parseWmoWeather(weatherCode);

      const forecast = [];
      if (Array.isArray(daily.time)) {
        for (let i = 0; i < Math.min(daily.time.length, 5); i++) {
          const code = daily.weather_code ? daily.weather_code[i] : 1;
          const { condition: dayCond, icon: dayIcon } = parseWmoWeather(code);
          const maxT = Math.round(daily.temperature_2m_max ? daily.temperature_2m_max[i] : temp);
          const rain = daily.precipitation_sum ? Math.round(daily.precipitation_sum[i] * 10) / 10 : 0;

          forecast.push({
            date: daily.time[i],
            temp: maxT,
            condition: dayCond,
            rain,
            icon: dayIcon,
          });
        }
      }

      return res.json({
        status: 'ok',
        city: cleanCity,
        temp,
        humidity,
        windSpeed,
        condition,
        description,
        icon,
        uvIndex: temp > 30 ? 6.2 : 4.5,
        insights: buildAgroInsights(temp, humidity, windSpeed, condition),
        forecast: forecast.length > 0 ? forecast : getRegionalFallback(cleanCity).forecast
      });
    }
  } catch (meteoErr) {
    console.warn('[API] Open-Meteo backend fallback error:', meteoErr);
  }

  // 3. Guaranteed Seasonal Regional Fallback
  return res.json(getRegionalFallback(cleanCity));
};
