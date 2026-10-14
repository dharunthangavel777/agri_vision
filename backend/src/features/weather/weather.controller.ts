import { Request, Response } from 'express';

export const getWeather = async (req: Request, res: Response) => {
  const { city } = req.params;
  const { lat, lon } = req.query;
  const apiKey = process.env.WEATHER_API_KEY || '19927003d654bcd63f64e32840eeba91';

  const fallbackData = {
    status: 'ok', 
    city: city || 'Unknown',
    temp: 25,
    humidity: 60,
    windSpeed: 5,
    condition: 'Clear',
    description: 'Clear sky (Fallback)',
    icon: '01d',
    uvIndex: 'Moderate',
    insights: ["Weather data currently unavailable. Showing seasonal averages."],
    forecast: [],
    fallback: true
  };

  if (!apiKey || apiKey === 'YOUR_OPENWEATHERMAP_API_KEY') {
    console.warn('[API] Weather API key not configured');
    return res.json(fallbackData);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    let currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    let forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

    if (lat && lon) {
      currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
      forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    }

    // Fetch current weather
    const currentRes = await fetch(currentUrl, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!currentRes.ok) {
      clearTimeout(timeoutId);
      console.warn(`[API] Weather API responded with ${currentRes.status}`);
      return res.json(fallbackData);
    }
    const currentData = await currentRes.json();

    // Fetch 5-day forecast
    const forecastRes = await fetch(forecastUrl, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const forecastData = await forecastRes.json();
    clearTimeout(timeoutId);

    // AI Advisory Logic
    const insights: string[] = [];
    const temp = currentData.main.temp;
    const humidity = currentData.main.humidity;
    const weatherMain = currentData.weather[0].main.toLowerCase();

    if (humidity > 70 && (weatherMain.includes('rain') || weatherMain.includes('drizzle'))) {
      insights.push("High humidity & rainfall detected. Suitable for water-intensive crops like Rice or Sugarcane.");
      insights.push("High fungal risk due to moisture. Avoid Tomato or Potato exposure if possible.");
    } else if (temp > 30 && humidity < 40) {
      insights.push("Low humidity & high temperature. Suitable for drought-resistant crops like Millet or Cotton.");
      insights.push("Ensure adequate irrigation to prevent soil moisture depletion.");
    } else if (temp < 15) {
      insights.push("Cooler temperatures detected. Suitable for Rabi crops like Wheat or Mustard.");
    } else {
      insights.push("Moderate weather conditions. Good for a variety of seasonal vegetables.");
    }

    if (currentData.wind.speed > 20) {
      insights.push("Strong winds detected. Secure young saplings and avoid spraying pesticides.");
    }

    // Process forecast to get daily highs/lows
    const dailyForecast = forecastData.list ? forecastData.list.filter((_: any, index: number) => index % 8 === 0).map((item: any) => ({
      date: item.dt_txt.split(' ')[0],
      temp: Math.round(item.main.temp),
      condition: item.weather[0].main,
      icon: item.weather[0].icon
    })) : [];

    res.json({
      status: 'ok',
      city: currentData.name,
      temp: Math.round(currentData.main.temp),
      humidity: currentData.main.humidity,
      windSpeed: currentData.wind.speed,
      condition: currentData.weather[0].main,
      description: currentData.weather[0].description,
      icon: currentData.weather[0].icon,
      uvIndex: "Moderate",
      insights,
      forecast: dailyForecast
    });
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.warn('[API] Weather API error:', error.message);
    res.json(fallbackData);
  }
};
