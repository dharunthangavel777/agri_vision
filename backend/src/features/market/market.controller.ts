import { Request, Response } from 'express';
import {
  MARKET_CACHE_TIME,
  MARKET_RESOURCE_ID,
  LOCAL_MARKET_BACKUP,
  MarketApiResponse,
} from '../../core/config.ts';

const marketCache = new Map<string, { data: MarketApiResponse; fetchedAt: number }>();

const buildMarketCacheKey = (params: {
  state?: string | null;
  district?: string | null;
  commodity?: string | null;
  limit?: string | number | null;
}) => JSON.stringify({
  state: params.state || '',
  district: params.district || '',
  commodity: params.commodity || '',
  limit: params.limit || 100,
});

const filterBackupMarketData = (params: {
  state?: string | null;
  district?: string | null;
  commodity?: string | null;
}) =>
  LOCAL_MARKET_BACKUP.filter((record) => {
    if (params.state && params.state !== 'All States' && record.state !== params.state) {
      return false;
    }

    if (params.district && params.district !== 'All Districts' && record.district !== params.district) {
      return false;
    }

    if (params.commodity && !record.commodity.toLowerCase().includes(params.commodity.toLowerCase())) {
      return false;
    }

    return true;
  });

const fetchMarketWithRetry = async (url: string, retries: number = 3): Promise<MarketApiResponse> => {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.records)) {
      throw new Error('Market API returned invalid payload');
    }

    return {
      ...data,
      source: 'live',
    };
  } catch (error) {
    if (retries > 1) {
      await new Promise((resolve) => setTimeout(resolve, (4 - retries) * 1000));
      return fetchMarketWithRetry(url, retries - 1);
    }

    throw error;
  }
};

const getCachedMarketData = (cacheKey: string): MarketApiResponse | null => {
  const cached = marketCache.get(cacheKey);
  if (!cached) {
    return null;
  }

  if (Date.now() - cached.fetchedAt > MARKET_CACHE_TIME) {
    marketCache.delete(cacheKey);
    return null;
  }

  return {
    ...cached.data,
    source: 'cache',
    fallback: true,
    message: 'Using cached market data.',
  };
};

export const getMarketPrices = async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.MARKET_API_KEY || '579b464db66ec23bdd0000012ed5666eba6749fd7423718378c732ff';
    const { state, district, commodity, limit = 100 } = req.query;
    const cacheKey = buildMarketCacheKey({
      state: state as string | undefined,
      district: district as string | undefined,
      commodity: commodity as string | undefined,
      limit: limit as string | undefined,
    });

    const baseUrl = new URL(`https://api.data.gov.in/resource/${MARKET_RESOURCE_ID}`);
    baseUrl.searchParams.set('api-key', apiKey);
    baseUrl.searchParams.set('format', 'json');
    baseUrl.searchParams.set('limit', '100');
    baseUrl.searchParams.set('offset', '0');

    if (state && state !== 'All States') {
      baseUrl.searchParams.set('filters[state]', state as string);
    }
    if (district && district !== 'All Districts' && district !== state) {
      baseUrl.searchParams.set('filters[district]', district as string);
    }
    if (commodity) {
      baseUrl.searchParams.set('filters[commodity]', commodity as string);
    }

    try {
      const liveData = await fetchMarketWithRetry(baseUrl.toString(), 3);

      if (!liveData.records || liveData.records.length === 0) {
        throw new Error('Market API returned empty records');
      }

      marketCache.set(cacheKey, {
        data: liveData,
        fetchedAt: Date.now(),
      });

      return res.json({
        status: 'ok',
        ...liveData,
      });
    } catch (error: any) {
      console.warn('[API] Live market fetch failed:', error.message);

      const cachedData = getCachedMarketData(cacheKey);
      if (cachedData) {
        return res.json({
          status: 'ok',
          ...cachedData,
        });
      }

      const backupRecords = filterBackupMarketData({
        state: state as string | undefined,
        district: district as string | undefined,
        commodity: commodity as string | undefined,
      });

      return res.json({
        status: 'ok',
        records: backupRecords,
        count: backupRecords.length,
        source: 'backup',
        fallback: true,
        message: 'Using local backup market data.',
      });
    }
  } catch (error) {
    console.error('[API] Market route critical error:', error);
    const backupRecords = filterBackupMarketData({});
    res.json({
      status: 'ok',
      records: backupRecords,
      count: backupRecords.length,
      source: 'backup',
      fallback: true,
      message: 'Critical error in market route. Using local backup market data.',
    });
  }
};
