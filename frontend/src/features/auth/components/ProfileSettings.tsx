import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../../core/context/AuthContext.tsx';
import { User as UserIcon, MapPin, Sprout, Lock, Eye, EyeOff, Loader2, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ProfileSettings: React.FC = () => {
  const { t } = useTranslation();
  const { user, updateProfile, changePassword, logout } = useAuth();
  
  // Profile State
  const [name, setName] = useState(user?.name || '');
  const [location, setLocation] = useState(user?.location || '');
  const [farmType, setFarmType] = useState(user?.farmType || 'Vegetable');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleProfileUpdate = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(null);
    try {
      await updateProfile({ name, location, farmType });
      setProfileSuccess(t('common.success'));
      setTimeout(() => setProfileSuccess(null), 3000);
    } catch (err: any) {
      setProfileError(err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError(t('auth.error'));
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError(t('auth.error'));
      return;
    }

    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      await changePassword(oldPassword, newPassword);
      setPasswordSuccess(t('common.success'));
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 3000);
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('profile.settings')}</h2>
        <button 
          onClick={logout}
          className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors text-sm font-bold"
        >
          <LogOut size={18} />
          <span>{t('common.logout')}</span>
        </button>
      </div>

      {/* Profile Information */}
      <div className="bg-dark-card rounded-3xl border border-dark-border overflow-hidden">
        <div className="p-6 border-b border-dark-border">
          <h3 className="text-lg font-bold flex items-center">
            <UserIcon className="mr-2 text-emerald-500" size={20} />
            {t('profile.personalInfo')}
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">{t('profile.fullName')}</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-stone-900/50 border border-dark-border rounded-xl py-3 pl-12 pr-4 text-stone-200 focus:outline-none focus:border-emerald-500/50 transition-colors text-sm"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">{t('profile.location')}</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
                <input 
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-stone-900/50 border border-dark-border rounded-xl py-3 pl-12 pr-4 text-stone-200 focus:outline-none focus:border-emerald-500/50 transition-colors text-sm"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">{t('profile.farmType')}</label>
            <div className="relative">
              <Sprout className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
              <select 
                value={farmType}
                onChange={(e) => setFarmType(e.target.value)}
                className="w-full bg-stone-900/50 border border-dark-border rounded-xl py-3 pl-12 pr-4 text-stone-200 focus:outline-none focus:border-emerald-500/50 transition-colors text-sm appearance-none"
              >
                <option value="Vegetable">Vegetable Farming</option>
                <option value="Fruit">Fruit Orchard</option>
                <option value="Grain">Grain/Cereal Production</option>
                <option value="Greenhouse">Greenhouse/Hydroponics</option>
                <option value="Mixed">Mixed Farming</option>
              </select>
            </div>
          </div>

          {profileError && (
            <div className="flex items-center space-x-2 text-red-400 text-xs bg-red-400/10 p-3 rounded-lg border border-red-400/20">
              <AlertCircle size={14} />
              <span>{profileError}</span>
            </div>
          )}

          {profileSuccess && (
            <div className="flex items-center space-x-2 text-emerald-400 text-xs bg-emerald-400/10 p-3 rounded-lg border border-emerald-400/20">
              <CheckCircle2 size={14} />
              <span>{profileSuccess}</span>
            </div>
          )}

          <button 
            type="button"
            onClick={handleProfileUpdate}
            disabled={profileLoading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2"
          >
            {profileLoading ? (
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                <span>Updating Profile...</span>
              </div>
            ) : t('profile.updateProfile')}
          </button>
        </div>
      </div>

      {/* Password Change */}
      <div className="bg-dark-card rounded-3xl border border-dark-border overflow-hidden">
        <div className="p-6 border-b border-dark-border">
          <h3 className="text-lg font-bold flex items-center">
            <Lock className="mr-2 text-amber-500" size={20} />
            {t('profile.security')}
          </h3>
        </div>
        {user?.type === 'google' ? (
          <div className="p-6 text-stone-400 text-sm flex items-center space-x-3 bg-stone-900/30">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </div>
            <p className="text-xs text-stone-400">
              Signed in with Google (<span className="text-stone-200 font-medium">{user.email || user.identifier}</span>). Your credentials are secure and managed via your Google Account.
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">{t('profile.currentPassword')}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
                <input 
                  type={showPasswords ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-stone-900/50 border border-dark-border rounded-xl py-3 pl-12 pr-12 text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-emerald-500/50 transition-colors text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                >
                  {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">{t('auth.newPassword')}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
                  <input 
                    type={showPasswords ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-stone-900/50 border border-dark-border rounded-xl py-3 pl-12 pr-4 text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-emerald-500/50 transition-colors text-sm"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">{t('auth.confirmPassword')}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
                  <input 
                    type={showPasswords ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-stone-900/50 border border-dark-border rounded-xl py-3 pl-12 pr-4 text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-emerald-500/50 transition-colors text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            {passwordError && (
              <div className="flex items-center space-x-2 text-red-400 text-xs bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                <AlertCircle size={14} />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="flex items-center space-x-2 text-emerald-400 text-xs bg-emerald-400/10 p-3 rounded-lg border border-emerald-400/20">
                <CheckCircle2 size={14} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <button 
              type="button"
              onClick={handlePasswordChange}
              disabled={passwordLoading}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-2"
            >
              {passwordLoading ? (
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                  <span>Updating Password...</span>
                </div>
              ) : t('profile.changePassword')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
