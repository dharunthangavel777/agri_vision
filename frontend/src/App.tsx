import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

import { AuthProvider, useAuth } from './core/context/AuthContext.tsx';
import { AppProvider } from './core/context/AppContext.tsx';
import { useUIStore } from './shared/stores/uiStore.ts';
import { useLocation } from './shared/hooks/useLocation.ts';

// AgriVision Shell & Navigation Components
import { NavigationRail } from './shared/components/NavigationRail.tsx';
import { TopHeader } from './shared/components/TopHeader.tsx';
import { ActivityLogModal } from './shared/components/ActivityLogModal.tsx';
import { TabPanel } from './shared/components/TabPanel.tsx';
import { ErrorBoundary } from './shared/components/ErrorBoundary.tsx';
import { AppShellSkeleton } from './shared/components/skeletons/AppShellSkeleton.tsx';
import { GlobalLocationModal } from './shared/components/GlobalLocationModal.tsx';

// Feature Components
import { Login } from './features/auth/components/Login.tsx';
import { ProfileSettings } from './features/auth/components/ProfileSettings.tsx';
import { HomeTab } from './features/home/components/HomeTab.tsx';
import { CropAdvisorTab } from './features/crop-advisor/components/CropAdvisorTab.tsx';
import { DiseaseDetectionTab } from './features/disease-detection/components/DiseaseDetectionTab.tsx';
import { FertilizerRecommendation } from './features/fertilizer/components/FertilizerRecommendation.tsx';
import { WeatherTab } from './features/weather/components/WeatherTab.tsx';
import { HistoryModal } from './features/history/components/HistoryModal.tsx';
import { ChatWidget } from './features/chat/components/ChatWidget.tsx';
import { initKnowledgeBase } from './features/chat/services/ragService.ts';

export function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const activeTab = useUIStore((state) => state.activeTab);
  const showHistory = useUIStore((state) => state.showHistory);
  const setShowHistory = useUIStore((state) => state.setShowHistory);

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { location } = useLocation();

  useEffect(() => {
    initKnowledgeBase();
    document.body.classList.remove('light');
    document.body.classList.add('dark');
  }, []);

  const handleActivityLogged = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (authLoading) {
    return <AppShellSkeleton />;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="agri-shell">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1e2a1c] border border-[#278b50]/50 text-white text-xs px-5 py-3 rounded-xl shadow-2xl animate-fade-in flex items-center space-x-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Left Navigation Rail (.rail) */}
      <NavigationRail />

      {/* Main Content View (.main) */}
      <main className="agri-main">
        {/* Top Header (.top: Brand, Real Farm Location, Profile) */}
        <TopHeader 
          onOpenLogModal={() => setIsActivityModalOpen(true)}
        />

        {/* Screen Content Panels */}
        <div className="flex-1 min-h-0 pt-1 flex flex-col">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="h-full flex-1 flex flex-col"
          >
            <TabPanel active={activeTab === 'home'}>
              <ErrorBoundary fallbackTitle="Home Dashboard Error">
                <HomeTab />
              </ErrorBoundary>
            </TabPanel>
            
            <TabPanel active={activeTab === 'advisor'}>
              <ErrorBoundary fallbackTitle="Crop Advisor Error">
                <CropAdvisorTab />
              </ErrorBoundary>
            </TabPanel>
            
            <TabPanel active={activeTab === 'fertilizer'}>
              <ErrorBoundary fallbackTitle="Fertilizer Guide Error">
                <FertilizerRecommendation />
              </ErrorBoundary>
            </TabPanel>
            
            <TabPanel active={activeTab === 'disease'}>
              <ErrorBoundary fallbackTitle="Disease Detection Error">
                <DiseaseDetectionTab />
              </ErrorBoundary>
            </TabPanel>
            
            <TabPanel active={activeTab === 'weather'}>
              <ErrorBoundary fallbackTitle="Weather Analysis Error">
                <WeatherTab />
              </ErrorBoundary>
            </TabPanel>
            
            <TabPanel active={activeTab === 'profile'}>
              <ErrorBoundary fallbackTitle="Profile Settings Error">
                <ProfileSettings />
              </ErrorBoundary>
            </TabPanel>
          </motion.div>
        </div>
      </main>

      {/* Modals & Floating Tools */}
      <ActivityLogModal 
        isOpen={isActivityModalOpen} 
        onClose={() => setIsActivityModalOpen(false)}
        onLogged={handleActivityLogged}
      />

      <HistoryModal 
        open={showHistory} 
        onClose={() => setShowHistory(false)} 
      />

      <GlobalLocationModal />

      <ChatWidget />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
