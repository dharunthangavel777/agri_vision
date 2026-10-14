import path from 'path';

export const JWT_SECRET = process.env.JWT_SECRET || 'smart-agri-secret-key-2026';
export const MARKET_CACHE_TIME = 10 * 60 * 1000;
export const MARKET_RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';
export const PORT = Number(process.env.PORT) || 3000;

export type MarketApiRecord = {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  arrival_date: string;
  min_price: string;
  max_price: string;
  modal_price: string;
};

export type MarketApiResponse = {
  records: MarketApiRecord[];
  count?: number;
  source?: 'live' | 'cache' | 'backup';
  fallback?: boolean;
  message?: string;
};

export const LOCAL_MARKET_BACKUP: MarketApiRecord[] = [
  {
    state: 'Karnataka',
    district: 'Bangalore',
    market: 'Binny Mill (F&V)',
    commodity: 'Tomato',
    variety: 'Local',
    arrival_date: '2026-04-15',
    min_price: '1100',
    max_price: '1400',
    modal_price: '1250',
  },
  {
    state: 'Punjab',
    district: 'Ludhiana',
    market: 'Ludhiana',
    commodity: 'Wheat',
    variety: 'Kanak',
    arrival_date: '2026-04-15',
    min_price: '2100',
    max_price: '2200',
    modal_price: '2125',
  },
  {
    state: 'Maharashtra',
    district: 'Nashik',
    market: 'Lasalgaon',
    commodity: 'Onion',
    variety: 'Red',
    arrival_date: '2026-04-15',
    min_price: '1700',
    max_price: '1900',
    modal_price: '1800',
  },
  {
    state: 'Uttar Pradesh',
    district: 'Agra',
    market: 'Agra',
    commodity: 'Potato',
    variety: 'Desi',
    arrival_date: '2026-04-15',
    min_price: '900',
    max_price: '1000',
    modal_price: '950',
  },
  {
    state: 'Telangana',
    district: 'Warangal',
    market: 'Warangal',
    commodity: 'Cotton',
    variety: 'Other',
    arrival_date: '2026-04-15',
    min_price: '6800',
    max_price: '7200',
    modal_price: '7000',
  },
];
