import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../core/context/AuthContext.tsx';
import { useGreeting } from '../hooks/useAgricultureDashboard.ts';

export const HERO_CONTENT = [
  {
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1200",
    titleKey: "home.slogan1",
    subtitleKey: "home.subtitle1"
  },
  {
    image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=80&w=1200",
    titleKey: "home.slogan2",
    subtitleKey: "home.subtitle2"
  },
  {
    image: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=1200",
    titleKey: "home.slogan3",
    subtitleKey: "home.subtitle3"
  },
  {
    image: "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&q=80&w=1200",
    titleKey: "home.slogan4",
    subtitleKey: "home.subtitle4"
  },
  {
    image: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=1200",
    titleKey: "home.slogan5",
    subtitleKey: "home.subtitle5"
  }
];

export const HeroSection: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const greetingKey = useGreeting();
  const [heroIndex, setHeroIndex] = useState(() => new Date().getHours() % HERO_CONTENT.length);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentHour = new Date().getHours();
      setHeroIndex(currentHour % HERO_CONTENT.length);
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-64 rounded-3xl overflow-hidden shadow-2xl shadow-emerald-900/20">
      <AnimatePresence mode="wait">
        <motion.div
          key={heroIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <img 
            src={HERO_CONTENT[heroIndex].image} 
            alt="Hero" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        </motion.div>
      </AnimatePresence>
      
      <div className="absolute inset-0 p-8 flex flex-col justify-end">
        <motion.div
          key={`text-${heroIndex}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-2">
            {t(greetingKey)}, {user?.name || (user?.id?.startsWith('demo-user') ? t('auth.demoMode') : t('common.profile'))}
          </h2>
          <p className="text-stone-300 text-sm md:text-base max-w-md">
            {t(HERO_CONTENT[heroIndex].titleKey)}
          </p>
          <div className="mt-4 flex items-center space-x-2">
            <div className="w-8 h-1 rounded-full bg-brand-green" />
            <div className="text-[10px] text-stone-400 font-medium">
              {t(HERO_CONTENT[heroIndex].subtitleKey)}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
