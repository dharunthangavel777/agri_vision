import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../../core/context/AuthContext.tsx';
import { 
  Mail, 
  ArrowRight, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  KeyRound, 
  MapPin, 
  Sprout, 
  CheckCircle2, 
  ScanLine, 
  FlaskConical, 
  CloudSun,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import authBg from '../../../../assets/auth_bg.jpg';

type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-password';

const formatFirebaseError = (error: any): string => {
  const code = error?.code || '';
  const message = error?.message || 'Authentication error';
  
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials or sign up.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address. Please log in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completing. Please try again.';
    case 'auth/cancelled-popup-request':
      return 'Sign-in cancelled. Please try again.';
    case 'auth/too-many-requests':
      return 'Access temporarily blocked due to many failed attempts. Try again later or reset password.';
    case 'auth/network-request-failed':
      return 'Network connection issue. Please check your internet connection or use registered credentials.';
    case 'auth/unauthorized-domain':
      return 'Google Sign-In is only available on localhost or registered domains. Please sign in with Email & Password.';
    default:
      return message.replace(/^Firebase:\s*/i, '');
  }
};

const AGRIVISION_FEATURES = [
  {
    icon: ScanLine,
    title: 'Pathology Diagnostics',
    desc: 'Instant leaf lesion & disease detection with computer vision',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
  },
  {
    icon: Sprout,
    title: 'Multimodal Crop Advisor',
    desc: 'Live GPS telemetry & soil stoichiometry recommendation',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
  },
  {
    icon: FlaskConical,
    title: 'Precision Fertilizer Guide',
    desc: 'Stage-by-stage NPK dosing & split schedule balance',
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/30'
  },
  {
    icon: CloudSun,
    title: 'Satellite Weather Radar',
    desc: 'Hyperlocal agromet forecast & foliar spray windows',
    color: 'text-lime-400 bg-lime-500/10 border-lime-500/30'
  }
];

export const Login: React.FC = () => {
  const { t } = useTranslation();
  const { login, register, loginWithGoogle, sendPasswordReset, resetPasswordConfirm } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [farmType, setFarmType] = useState('Vegetable');
  const [agreeTerms, setAgreeTerms] = useState(true);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setError(null);
    setSuccess(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address');
      return;
    }

    if (mode === 'forgot-password') {
      setLoading(true);
      try {
        await sendPasswordReset(trimmedEmail);
        setSuccess('Password reset link sent to your email! You can also enter the OTP below to reset now.');
        setMode('reset-password');
      } catch (err: any) {
        setError(formatFirebaseError(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'reset-password') {
      if (!otp.trim()) {
        setError('Please enter the 6-digit OTP code');
        return;
      }
      if (!password || password.length < 6) {
        setError('New password must be at least 6 characters');
        return;
      }
      setLoading(true);
      try {
        await resetPasswordConfirm({
          identifier: trimmedEmail,
          otp: otp.trim(),
          newPassword: password
        });
        setSuccess('Password reset successfully! You can now log in with your new password.');
        setMode('login');
        setPassword('');
        setOtp('');
      } catch (err: any) {
        setError(formatFirebaseError(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (!agreeTerms) {
        setError('Please agree to the Terms of Service & Privacy Policy');
        return;
      }
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(trimmedEmail, password);
      } else if (mode === 'register') {
        await register(trimmedEmail, password, {
          name: name.trim() || trimmedEmail.split('@')[0],
          location: location.trim(),
          farmType
        });
      }
    } catch (err: any) {
      setError(formatFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccess(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(formatFirebaseError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-3 sm:p-6 lg:p-8 overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Full-Bleed Viewport Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
        style={{ backgroundImage: `url(${authBg})` }}
      />
      
      {/* Atmospheric Ambient Dark Gradient & Vignette Overlay */}
      <div className="fixed inset-0 bg-black/65 backdrop-blur-[2px]" />
      <div className="fixed inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/70 pointer-events-none" />
      <div className="fixed inset-0 bg-radial from-transparent via-black/40 to-black/90 pointer-events-none" />

      {/* 2-Part Container Card matching user reference */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="relative z-10 w-full max-w-6xl min-h-[640px] bg-black/60 backdrop-blur-xl rounded-[32px] sm:rounded-[36px] shadow-2xl border border-white/15 overflow-hidden grid grid-cols-1 lg:grid-cols-12"
      >

        {/* ================= LEFT PART: VISUAL, BRAND & ANIMATED AGRIVISION FEATURES ================= */}
        <div className="lg:col-span-7 relative flex flex-col justify-between p-6 sm:p-10 lg:p-12 overflow-hidden min-h-[380px] lg:min-h-full">
          {/* Glass atmospheric overlay connecting with full-screen photo */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30 backdrop-blur-[1px]" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/50 pointer-events-none" />

          {/* Top Brand Identity */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg width="40" height="36" viewBox="0 0 44 40" className="shrink-0 drop-shadow-md">
                <path d="M2 6c14-2 22 4 22 20 0 4-1 7-2 9C10 34 2 24 2 6z" fill="#278b50" />
                <path d="M42 4C28 4 20 12 20 28c0 3 0 5 1 8 14 0 22-10 21-32z" fill="#4ade80" />
              </svg>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none drop-shadow-sm">
                  AgriVision
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-300/90 mt-1">
                  AI Smart Agriculture
                </span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 text-xs text-emerald-300 font-semibold shadow-sm">
              <Sparkles size={14} className="text-[#4ade80]" />
              <span>Next-Gen Farm Intelligence</span>
            </div>
          </div>

          {/* Inspiring Headline (Exact wording matching reference) */}
          <div className="relative z-10 my-auto py-8 lg:py-12">
            <motion.h1 
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.1] max-w-lg drop-shadow-lg"
            >
              Every big thing starts small
            </motion.h1>
            
            <p className="text-stone-200 text-sm sm:text-base font-medium mt-3 max-w-md drop-shadow">
              {mode === 'register' 
                ? 'Sign up and start growing your yield with AI-driven agronomic precision.' 
                : 'Log in and continue growing your farm with real-time telemetry.'}
            </p>

            {/* Animative AgriVision Products & Features Showcase List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-6 max-w-xl">
              {AGRIVISION_FEATURES.map((feat, idx) => (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * idx, duration: 0.3 }}
                  className="flex items-center gap-3 bg-black/45 hover:bg-black/60 backdrop-blur-md border border-white/10 hover:border-emerald-500/40 p-2.5 rounded-2xl transition-all shadow-md group"
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${feat.color} group-hover:scale-105 transition-transform`}>
                    <feat.icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate leading-tight group-hover:text-emerald-300 transition-colors">
                      {feat.title}
                    </span>
                    <span className="text-[10px] text-stone-300 block truncate leading-tight mt-0.5">
                      {feat.desc}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom Trust Badge */}
          <div className="relative z-10 flex items-center gap-3 text-xs text-stone-300/80 pt-4 border-t border-white/10">
            <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
              <ShieldCheck size={16} />
              <span>Verified Agronomy Cloud</span>
            </div>
            <span>•</span>
            <span className="text-stone-300">GPS Device Connected</span>
          </div>
        </div>


        {/* ================= RIGHT PART: AESTHETIC AUTH FORM CARD ================= */}
        <div className="lg:col-span-5 bg-[#FAF6F0] text-[#292524] flex flex-col justify-center p-6 sm:p-10 lg:p-12 relative">
          
          <div className="w-full max-w-sm mx-auto">
            {/* Header */}
            <div className="mb-6 text-left">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1c1917] tracking-tight">
                {mode === 'login' ? 'Log in to your account' : 
                 mode === 'register' ? 'Create your account' : 
                 mode === 'forgot-password' ? 'Reset password' :
                 'Enter verification code'}
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-1.5 font-medium">
                {mode === 'login' ? 'Welcome back! Enter your details to continue.' : 
                 mode === 'register' ? 'Start your 100% free smart farming journey.' : 
                 mode === 'forgot-password' ? 'We will send a secure password reset link to your email.' :
                 'Enter the 6-digit OTP and choose a new password.'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Register-only Fields: Full Name & Location */}
              <AnimatePresence>
                {mode === 'register' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3.5 overflow-hidden"
                  >
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1 ml-0.5">
                        Full name
                      </label>
                      <div className="relative">
                        <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={17} />
                        <input 
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your full name"
                          className="w-full bg-white border border-[#E5DEC9] rounded-2xl py-3 pl-11 pr-4 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm transition-all shadow-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1 ml-0.5">
                          Location
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
                          <input 
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g. Mandya"
                            className="w-full bg-white border border-[#E5DEC9] rounded-2xl py-3 pl-9 pr-3 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-xs transition-all shadow-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1 ml-0.5">
                          Farm Type
                        </label>
                        <div className="relative">
                          <Sprout className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
                          <select 
                            value={farmType}
                            onChange={(e) => setFarmType(e.target.value)}
                            className="w-full bg-white border border-[#E5DEC9] rounded-2xl py-3 pl-9 pr-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-xs appearance-none transition-all shadow-xs"
                          >
                            <option value="Vegetable">Vegetable</option>
                            <option value="Fruit">Fruit Orchard</option>
                            <option value="Grain">Grains & Cereals</option>
                            <option value="Mixed">Mixed Farming</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 ml-0.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={17} />
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    disabled={mode === 'reset-password'}
                    className="w-full bg-white border border-[#E5DEC9] rounded-2xl py-3 pl-11 pr-4 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm transition-all shadow-xs disabled:bg-stone-100 disabled:text-stone-500"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* OTP Field (reset-password mode only) */}
              {mode === 'reset-password' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1 ml-0.5">
                    Verification OTP code
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={17} />
                    <input 
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full bg-white border border-[#E5DEC9] rounded-2xl py-3 pl-11 pr-4 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm font-mono tracking-widest transition-all shadow-xs"
                      required
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              {mode !== 'forgot-password' && (
                <div>
                  <div className="flex items-center justify-between mb-1 ml-0.5">
                    <label className="block text-xs font-semibold text-stone-700">
                      {mode === 'reset-password' ? 'New Password' : 'Password'}
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={17} />
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'reset-password' ? "Enter new password (min 6 chars)" : "Enter your password"}
                      className="w-full bg-white border border-[#E5DEC9] rounded-2xl py-3 pl-11 pr-11 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm transition-all shadow-xs"
                      required
                      autoComplete={mode === 'login' ? "current-password" : "new-password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors p-1"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Forgot Password Link right under password input as in screenshot */}
                  {mode === 'login' && (
                    <div className="text-right mt-1.5">
                      <button 
                        type="button"
                        onClick={() => switchMode('forgot-password')}
                        className="text-stone-500 hover:text-emerald-700 text-xs font-medium transition-colors"
                      >
                        Forgot your password?
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Confirm Password (register only) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1 ml-0.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={17} />
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full bg-white border border-[#E5DEC9] rounded-2xl py-3 pl-11 pr-11 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm transition-all shadow-xs"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors p-1"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Terms & Conditions Checkbox */}
                  <div className="flex items-start gap-2 pt-2 text-xs text-stone-600">
                    <input 
                      type="checkbox"
                      id="terms"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="terms" className="cursor-pointer">
                      I agree to the <span className="text-emerald-700 font-semibold underline">Terms of Service</span> and <span className="text-emerald-700 font-semibold underline">Privacy Policy</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Error Notice */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-700 text-xs bg-red-100/80 p-3 rounded-xl border border-red-200"
                >
                  {error}
                </motion.div>
              )}

              {/* Success Notice */}
              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-2 text-emerald-800 text-xs bg-emerald-100/80 p-3 rounded-xl border border-emerald-200"
                >
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                  <span>{success}</span>
                </motion.div>
              )}

              {/* Primary Green Action Button */}
              <button 
                type="submit"
                disabled={loading || googleLoading}
                className="w-full bg-[#388e3c] hover:bg-[#2e7d32] active:bg-[#1b5e20] disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-700/20 active:scale-[0.99] cursor-pointer text-sm sm:text-base mt-2"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <span>
                    {mode === 'login' ? 'Log in' : 
                     mode === 'register' ? 'Sign up' : 
                     mode === 'forgot-password' ? 'Send reset link' :
                     'Reset password'}
                  </span>
                )}
              </button>
            </form>

            {/* Divider (or) matching reference */}
            {(mode === 'login' || mode === 'register') && (
              <>
                <div className="relative flex items-center justify-center my-4">
                  <div className="border-t border-[#E5DEC9] w-full" />
                  <span className="bg-[#FAF6F0] px-3 text-xs text-stone-400 font-medium absolute">
                    or
                  </span>
                </div>

                {/* Continue with Google Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading || googleLoading}
                  className="w-full bg-white hover:bg-[#F2ECE4] border border-[#E5DEC9] text-stone-800 font-semibold py-3 px-4 rounded-2xl flex items-center justify-center space-x-3 transition-all cursor-pointer shadow-xs active:scale-[0.99] text-sm"
                >
                  {googleLoading ? (
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
                      <span>Connecting to Google...</span>
                    </div>
                  ) : (
                    <>
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>
              </>
            )}

            {/* Bottom Mode Switch */}
            <div className="mt-6 text-center text-xs text-stone-600">
              {mode === 'login' ? (
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="text-[#2e7d32] hover:text-[#1b5e20] font-bold hover:underline ml-1"
                  >
                    Sign up
                  </button>
                </p>
              ) : mode === 'register' ? (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-[#2e7d32] hover:text-[#1b5e20] font-bold hover:underline ml-1"
                  >
                    Log in
                  </button>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-[#2e7d32] hover:text-[#1b5e20] font-bold hover:underline"
                >
                  ← Back to Log in
                </button>
              )}
            </div>

          </div>
        </div>

      </motion.div>
    </div>
  );
};

