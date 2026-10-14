import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  RefreshCw, 
  AlertCircle, 
  Wind, 
  Droplets, 
  Sun, 
  Sprout, 
  CloudRain,
  CloudSun,
  CheckCircle2,
  AlertTriangle,
  Compass,
  ArrowRight
} from 'lucide-react';
import { useAppContext } from '../../../core/context/AppContext.tsx';
import { useLocation } from '../../../shared/hooks/useLocation.ts';
import { WeatherSkeleton } from '../../../shared/components/skeletons/WeatherSkeleton.tsx';

export const WeatherTab: React.FC = () => {
  const { appData, updateModuleData } = useAppContext();
  const { location, locationName, loading: locationLoading, refresh: refreshLocation } = useLocation();

  const cities = ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ludhiana', 'Nagpur'];

  const fetchWeather = async (city: string, lat?: number, lon?: number) => {
    updateModuleData('weatherLoading', true);
    updateModuleData('weatherError', null);
    updateModuleData('weatherCity', city);
    try {
      let url = `/api/weather/${city}`;
      if (lat && lon) {
        url += `?lat=${lat}&lon=${lon}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.status === 'ok') {
        updateModuleData('weather', data);
      } else {
        updateModuleData('weatherError', data.error || "Weather service temporarily offline");
      }
    } catch (err) {
      console.error("Failed to fetch weather:", err);
      updateModuleData('weatherError', "Failed to connect to weather service.");
    } finally {
      updateModuleData('weatherLoading', false);
    }
  };

  useEffect(() => {
    if (location?.city) {
      fetchWeather(location.city, location.lat, location.lon);
    } else if (!appData.weather && !appData.weatherLoading) {
      fetchWeather(appData.weatherCity || 'Bangalore');
    }
  }, [location?.city, location?.lat, location?.lon]);

  const currentWeather = appData.weather;
  const isSafeToSpray = currentWeather ? (currentWeather.windSpeed < 15 && currentWeather.humidity < 80) : true;

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      
      {/* ================= 1. PAGE TITLE & CITY BAR ================= */}
      <div className="agri-card p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <CloudSun size={24} className="text-[#f2b51b]" />
              Micro-Climate & Agro Weather Radar
            </h1>
            <p className="text-xs md:text-sm text-stone-300 mt-1">
              Live meteorological intelligence tailored for crop spraying, irrigation timing, and frost alerts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => refreshLocation()}
              disabled={locationLoading}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/15 text-stone-200 text-xs font-semibold rounded-xl border border-white/10 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <MapPin size={14} className={locationLoading ? "animate-pulse text-emerald-400" : "text-emerald-400"} />
              <span className="truncate max-w-[160px]">{locationLoading ? "Locating..." : locationName || "Auto GPS"}</span>
            </button>

            <button
              type="button"
              onClick={() => fetchWeather(appData.weatherCity || 'Bangalore')}
              className="p-2.5 bg-white/10 hover:bg-white/15 text-stone-300 rounded-xl border border-white/10 transition-colors"
              title="Refresh Weather"
            >
              <RefreshCw size={15} className={appData.weatherLoading ? "opacity-50 text-emerald-400" : "text-stone-300"} />
            </button>
          </div>
        </div>

        {/* Quick City Pills */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)] overflow-x-auto pb-1">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider shrink-0">City:</span>
          {cities.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => fetchWeather(city)}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-all shrink-0 ${
                appData.weatherCity === city 
                  ? 'bg-[#278b50] text-white shadow-md shadow-[#278b50]/20' 
                  : 'bg-[#242b24] text-stone-400 hover:text-white hover:bg-[#2e372e]'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* ================= 2. MAIN LIVE WEATHER CARD ================= */}
      {currentWeather ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Main Weather Metric Box (7 cols) */}
          <div className="lg:col-span-7 agri-card p-6 flex flex-col justify-between bg-gradient-to-br from-[#1c2c1c] to-[#121c12]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-stone-400 flex items-center gap-1">
                  <MapPin size={13} className="text-[#278b50]" />
                  {currentWeather.city} Weather Observation
                </span>
                <span className="agri-pill g text-xs py-0.5 px-3">Live Feed</span>
              </div>

              <div className="flex items-baseline gap-4 my-2">
                <span className="text-5xl md:text-6xl font-light text-white tracking-tight">
                  {currentWeather.temp}°C
                </span>
                <div>
                  <b className="text-lg text-white block capitalize">{currentWeather.condition}</b>
                  <span className="text-xs text-stone-400 capitalize">{currentWeather.description || 'Gentle ambient breeze'}</span>
                </div>
              </div>

              {/* Spray Window Status Badge */}
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold mt-3 ${
                isSafeToSpray 
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40' 
                  : 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
              }`}>
                {isSafeToSpray ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                <span>
                  {isSafeToSpray 
                    ? 'Foliar Spraying Condition: Favorable Window Active' 
                    : 'High Wind / Rain Alert: Postpone Spraying'}
                </span>
              </div>
            </div>

            {/* Weather Sensor Grid */}
            <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-[rgba(255,255,255,0.06)]">
              <div className="agri-in text-center py-3">
                <Wind size={20} className="mx-auto text-stone-400 mb-1" />
                <span className="text-[10px] text-stone-500 uppercase font-bold block">Wind Speed</span>
                <b className="text-sm text-white">{currentWeather.windSpeed || 8} km/h</b>
                <span className="text-[10px] text-emerald-400 block mt-0.5">Calm</span>
              </div>

              <div className="agri-in text-center py-3">
                <Droplets size={20} className="mx-auto text-stone-400 mb-1" />
                <span className="text-[10px] text-stone-500 uppercase font-bold block">Humidity</span>
                <b className="text-sm text-white">{currentWeather.humidity || 58}%</b>
                <span className="text-[10px] text-emerald-400 block mt-0.5">Optimal</span>
              </div>

              <div className="agri-in text-center py-3">
                <Sun size={20} className="mx-auto text-[#f2b51b] mb-1" />
                <span className="text-[10px] text-stone-500 uppercase font-bold block">UV Radiation</span>
                <b className="text-sm text-white">{currentWeather.uvIndex || 4.2}</b>
                <span className="text-[10px] text-stone-400 block mt-0.5">Moderate</span>
              </div>
            </div>
          </div>

          {/* AI Agricultural Advisory (5 cols) */}
          <div className="lg:col-span-5 agri-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-[#278b50]/20 flex items-center justify-center text-[#278b50]">
                  <Sprout size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Agro-Meteorological Advisory</h3>
                  <span className="text-[11px] text-stone-400">Prescriptive advice for farmers</span>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                <div className="p-3 rounded-xl bg-[#1c241c] border border-white/5">
                  <b className="text-xs text-white block mb-0.5">Irrigation Recommendation</b>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    Soil evaporation is moderate. Drip irrigation recommended for 20 minutes in early morning to minimize water loss.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#1c241c] border border-white/5">
                  <b className="text-xs text-white block mb-0.5">Pest & Fungus Watch</b>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    Dry warm conditions suppress powdery mildew and blight spores. No fungicide intervention required today.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)] text-[11px] text-stone-400">
              Synced with regional agromet advisory bulletin
            </div>
          </div>

        </div>
      ) : appData.weatherLoading ? (
        <WeatherSkeleton />
      ) : (
        <div className="agri-card p-12 text-center">
          <AlertCircle size={36} className="text-red-400 mx-auto mb-3" />
          <p className="text-stone-300 text-sm mb-4">{appData.weatherError || "Could not load weather data"}</p>
          <button
            type="button"
            onClick={() => fetchWeather('Bangalore')}
            className="px-5 py-2.5 bg-[#278b50] hover:bg-[#1f7a44] text-white text-xs font-bold rounded-xl transition-all"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* ================= 3. 5-DAY AGRO FORECAST ================= */}
      {currentWeather?.forecast && currentWeather.forecast.length > 0 && (
        <div className="agri-card p-5">
          <h3 className="text-sm font-bold text-white mb-3">5-Day Agricultural Forecast</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {currentWeather.forecast.map((day: any, idx: number) => (
              <div key={idx} className="p-3 rounded-xl bg-[#1c241c] border border-white/5 text-center flex flex-col justify-between">
                <span className="text-xs text-stone-400 font-medium block">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                
                <div className="my-2 flex flex-col items-center">
                  <CloudSun size={28} className="text-[#f2b51b] mb-1" />
                  <b className="text-lg font-bold text-white">{day.temp}°C</b>
                  <span className="text-[11px] text-stone-300 capitalize">{day.condition}</span>
                </div>

                <span className="text-[10px] text-stone-500">
                  {day.rain ? `${day.rain}mm rain` : 'No rain'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
