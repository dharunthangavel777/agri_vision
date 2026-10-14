import { useState, useEffect, useRef } from 'react';
import { fetchAgroWeather, getRegionalFallbackWeather } from '../../weather/services/weatherService.ts';

export const useGreeting = () => {
  const [greetingKey, setGreetingKey] = useState('home.goodMorning');

  useEffect(() => {
    const updateGreeting = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();

      if (hour >= 4 && hour < 12) {
        setGreetingKey('home.goodMorning');
      } else if (hour >= 12 && hour < 17) {
        setGreetingKey('home.goodAfternoon');
      } else if (hour >= 17 && (hour < 21 || (hour === 21 && minute <= 30))) {
        setGreetingKey('home.goodEvening');
      } else {
        setGreetingKey('home.goodNight');
      }
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  return greetingKey;
};

export interface WeatherData {
  temp: number;
  humidity: number;
  condition: string;
  location: string;
  rain?: number;
  pop?: number;
}

export const getFarmingInsights = (weather: WeatherData, t: any) => {
  const insights = [];

  const isRaining = (weather?.condition || '').toLowerCase().includes('rain') || (weather?.condition || '').toLowerCase().includes('drizzle');
  const heavyRain = (weather.rain && weather.rain > 2) || (weather.pop && weather.pop > 60);

  if (heavyRain || isRaining) {
    insights.push({
      id: 'rain-alert',
      type: 'rain',
      title: t('home.rainAlert'),
      message: t('home.rainAlertDesc'),
      color: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      icon: 'CloudRain'
    });
  }

  if (weather.temp > 35) {
    insights.push({
      id: 'heat-alert',
      type: 'heat',
      title: t('home.heatAlert'),
      message: t('home.heatAlertDesc'),
      color: 'bg-red-500/10 border-red-500/20 text-red-400',
      icon: 'Sun'
    });
  }

  let cropSuggestion = '';
  let cropTitle = t('home.cropSuitability');
  
  if (weather.temp > 30 && (weather.humidity < 40 || (weather.rain && weather.rain < 0.5))) {
    cropSuggestion = t('home.milletSorghum', { temp: weather.temp });
  } else if (weather.temp >= 20 && weather.temp <= 30 && (weather.humidity > 60 || (weather.rain && weather.rain > 1))) {
    cropSuggestion = t('home.riceMaize', { temp: weather.temp });
  } else if (weather.temp < 20) {
    cropSuggestion = t('home.wheatBarley', { temp: weather.temp });
  } else if ((weather?.condition || '').toLowerCase().includes('rain')) {
    cropSuggestion = t('home.moistureLoving');
  } else {
    cropSuggestion = t('home.stableGeneral', { temp: weather.temp, humidity: weather.humidity });
  }

  insights.push({
    id: 'crop-suggestion',
    type: 'suggestion',
    title: cropTitle,
    message: cropSuggestion,
    color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    icon: 'Sprout'
  });

  return insights;
};

export const useWeather = (defaultCity: string = 'Bangalore', initialLat?: number, initialLon?: number) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const fetchWeather = async (lat?: number, lon?: number, city?: string) => {
    setLoading(true);
    try {
      const targetLat = lat ?? initialLat;
      const targetLon = lon ?? initialLon;
      const targetCity = city || defaultCity;
      const data = await fetchAgroWeather(targetCity, targetLat, targetLon);

      setWeather({
        temp: data.temp,
        humidity: data.humidity,
        condition: data.condition,
        location: data.city,
        rain: data.forecast?.[0]?.rain || 0,
        pop: 0
      });
      setError(null);
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error("Weather fetch error:", err);
      }
      const fallback = getRegionalFallbackWeather(city || defaultCity);
      setWeather({
        temp: fallback.temp,
        humidity: fallback.humidity,
        condition: fallback.condition,
        location: fallback.city,
        rain: 0,
        pop: 0
      });
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(initialLat, initialLon);

    const interval = setInterval(() => {
      fetchWeather(initialLat, initialLon);
    }, 10 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, [defaultCity, initialLat, initialLon]);

  return { weather, loading, error, refresh: fetchWeather };
};
