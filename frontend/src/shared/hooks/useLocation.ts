import { useEffect } from 'react';
import { useLocationStore, type RealLocationData } from '../stores/locationStore.ts';

export type LocationData = RealLocationData;

export const useLocation = () => {
  const location = useLocationStore((state) => state.location);
  const loading = useLocationStore((state) => state.loading);
  const error = useLocationStore((state) => state.error);
  const permissionState = useLocationStore((state) => state.permissionState);
  const fetchRealLocation = useLocationStore((state) => state.fetchRealLocation);
  const setManualLocation = useLocationStore((state) => state.setManualLocation);

  useEffect(() => {
    // Request real device permission on first load if not yet determined or if cached is older than 30 minutes
    if (!location || (Date.now() - (location.timestamp || 0) > 1800000)) {
      fetchRealLocation();
    }
  }, [location, fetchRealLocation]);

  return {
    location,
    loading,
    error,
    denied: permissionState === 'denied',
    permissionState,
    refresh: () => fetchRealLocation(true),
    setManualLocation,
    // Convenient human-readable display string for all features
    locationName: location?.formatted || (location?.city ? `${location.city}, ${location.state || 'India'}` : 'Detecting GPS...'),
  };
};
