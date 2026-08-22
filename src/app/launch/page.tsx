'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Globe,
  ArrowRight,
  User as UserIcon,
  Eye,
  Camera,
  Upload,
  X,
  Lock,
  ExternalLink,
  ShieldCheck,
  Check,
} from 'lucide-react';
import {
  InstagramIcon,
  FacebookIcon,
  XIcon,
  LinkedinIcon,
  YoutubeIcon,
} from '@/components/SocialIcons';
import { useAuth } from '@/context/AuthContext';
import { uploadImageFile } from '@/lib/supabase/db';
import { getAppHost } from '@/lib/utils';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import Avatar from '@/components/Avatar';

export default function LaunchPage() {
  const router = useRouter();
  const { user, creator, updateCreatorProfile } = useAuth();
  const [appHost, setAppHost] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Creator Profile State
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Social Links
  const [insta, setInsta] = useState('');
  const [fb, setFb] = useState('');
  const [xLink, setXLink] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [youtube, setYoutube] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize from logged in user or existing creator
  useEffect(() => {
    setAppHost(getAppHost());
    if (user) {
      if (creator) {
        setHandle(creator.handle);
        setDisplayName(creator.display_name || user.name);
        setBio(creator.bio || '');
        setAvatarUrl(creator.avatar_url || user.avatar_url || '');
        setInsta(creator.social_links?.insta || '');
        setFb(creator.social_links?.fb || '');
        setXLink(creator.social_links?.x || '');
        setLinkedin(creator.social_links?.linkedin || '');
        setYoutube(creator.social_links?.youtube || '');
      } else {
        const cleanNameHandle = user.name
          ? user.name.toLowerCase().replace(/[^a-z0-9]/g, '')
          : '';
        setHandle(cleanNameHandle || 'creator');
        setDisplayName(user.name);
        setAvatarUrl(user.avatar_url || '');
        setBio('Creator hosting acoustic jams, dance meetups & workshops.');
      }
    }
  }, [user, creator]);

  // Handle URL change - strictly enforce lowercase a-z and 0-9 with no spaces or symbols
  const handleHandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const sanitized = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
    setHandle(sanitized);
    if (errorMessage) setErrorMessage(null);
  };

  // Custom Photo Upload handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (under 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size should be under 5MB.');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      setErrorMessage(null);
      const uploadedUrl = await uploadImageFile(file, user?.id || 'creator');
      setAvatarUrl(uploadedUrl);
    } catch (err: any) {
      console.error('Error uploading photo:', err);
      setErrorMessage('Failed to upload photo. Please try another image.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!user) {
      setErrorMessage('Please sign in with Google to launch your creator page.');
      return;
    }

    const cleanHandle = handle.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!cleanHandle) {
      setErrorMessage('Please enter a handle. Only lowercase letters (a-z) and numbers (0-9) are allowed.');
      return;
    }

    if (cleanHandle.length < 2) {
      setErrorMessage('Handle must be at least 2 characters long.');
      return;
    }

    if (!displayName.trim()) {
      setErrorMessage('Please enter your display name.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Save creator profile (Only creates handle and profile, NO event is auto-added)
      await updateCreatorProfile({
        handle: cleanHandle,
        display_name: displayName.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl.trim() || user.avatar_url || '',
        social_links: {
          insta: insta.trim(),
          fb: fb.trim(),
          x: xLink.trim(),
          linkedin: linkedin.trim(),
          youtube: youtube.trim(),
        },
      });

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
      });

      // Redirect immediately to creator's admin studio
      setTimeout(() => {
        router.push('/admin');
      }, 600);
    } catch (err: any) {
      console.error('Launch page error:', err);
      setErrorMessage(err?.message || 'Failed to claim handle and launch page.');
      setIsSubmitting(false);
    }
  };

  // If already a live creator, provide instant dashboard shortcut
  if (user && creator) {
    return (
      <div className="min-h-[85vh] bg-gradient-to-b from-neutral-50 to-white py-16 px-4 sm:px-6 flex items-center justify-center">
        <div className="max-w-xl w-full mx-auto text-center space-y-6 bg-white p-8 sm:p-10 rounded-3xl border-2 border-black shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg ring-8 ring-emerald-50">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 rounded-full text-xs font-mono font-bold text-neutral-800 mb-2">
              <span>@{creator.handle}</span>
            </div>
            <h1 className="text-3xl font-black uppercase text-neutral-950 tracking-tight">
              Your Creator Page Is Active
            </h1>
            <p className="text-xs text-neutral-600 font-medium mt-2 leading-relaxed">
              Your permanent handle <span className="font-mono font-bold text-black">{appHost}/{creator.handle}</span> is live. Manage your events, ticket pricing, and bookings in your Creator Studio.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
            <Link
              href="/admin"
              className="py-4 px-6 rounded-2xl bg-black text-white text-xs font-black uppercase tracking-wider hover:bg-neutral-800 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <span>⚡ Go to Creator Studio</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href={`/${creator.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-4 px-6 rounded-2xl border-2 border-black bg-white text-neutral-900 text-xs font-black uppercase tracking-wider hover:bg-neutral-50 transition-all flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              <span>View Public Page</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white py-12 px-4 sm:px-6 lg:px-8 pb-28">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header Title Banner */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[11px] font-bold text-amber-300 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>INSTANT CREATOR ACTIVATION • 0 WAITING</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight uppercase text-white">
            Claim Your Creator Handle
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 font-medium">
            Launch your official Fanmeet page in 30 seconds. Share tickets, host jams, and accept direct UPI payments.
          </p>
        </div>

        {/* Step 1: Google Sign-in Card if not logged in */}
        {!user ? (
          <div className="max-w-md mx-auto bg-neutral-900 border border-neutral-800 rounded-3xl p-8 sm:p-10 text-center shadow-2xl space-y-6">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-neutral-300">
              <UserIcon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase text-white">
                Sign In With Google
              </h2>
              <p className="text-xs text-neutral-400 font-medium mt-1">
                Fast & secure authentication. No password needed.
              </p>
            </div>

            <div className="pt-2">
              <GoogleSignInButton label="Continue with Google to Claim Handle" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Creator Configuration Form */}
            <div className="lg:col-span-7 bg-white text-neutral-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-200">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="border-b border-neutral-200 pb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black uppercase text-neutral-950">
                      Creator Details
                    </h2>
                    <p className="text-xs text-neutral-500 font-medium">
                      Setup your public fanmeet identity
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-neutral-100 px-3 py-1 rounded-full text-neutral-600 truncate max-w-[180px]">
                    {user.email}
                  </span>
                </div>

                {/* Photo Upload Section */}
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-800 mb-2">
                    Profile / Creator Photo
                  </label>
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
                    <div className="relative">
                      <Avatar
                        src={avatarUrl}
                        name={displayName || user.name}
                        size="xl"
                        className="border-2 border-black shadow-md"
                      />
                      {isUploadingPhoto && (
                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                          <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingPhoto}
                          className="px-4 py-2 bg-black text-white text-xs font-bold uppercase rounded-xl hover:bg-neutral-800 transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
                        </button>

                        {avatarUrl && (
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Remove Photo"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <p className="text-[11px] text-neutral-500 leading-tight">
                        Upload custom image (PNG, JPG). If left blank, your name initials will be displayed automatically.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Handle Input with strict lowercase a-z0-9 rule */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-black uppercase text-neutral-800">
                      Creator Handle URL *
                    </label>
                    <span className="text-[10px] font-bold text-neutral-500 uppercase">
                      Lowercase a-z & numbers only
                    </span>
                  </div>

                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-xs font-mono font-bold text-neutral-400 select-none">
                      {appHost}/
                    </span>
                    <input
                      type="text"
                      required
                      value={handle}
                      onChange={handleHandleChange}
                      placeholder="yourname"
                      maxLength={30}
                      className="w-full pl-36 pr-4 py-3 rounded-xl border-2 border-neutral-300 text-xs font-mono font-bold text-neutral-900 focus:border-black focus:outline-none bg-neutral-50 focus:bg-white transition-all tracking-wider"
                    />
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1.5 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Permanent URL format: <strong>a-z</strong> and <strong>0-9</strong> only. No spaces or special characters.</span>
                  </p>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-800 mb-1.5">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-900 focus:border-black focus:outline-none bg-neutral-50/50"
                  />
                </div>

                {/* Bio / About */}
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-800 mb-1.5">
                    Bio / Creator Summary
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell your fans what jams, meetups, or workshops you organize..."
                    className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-xs font-medium text-neutral-900 focus:border-black focus:outline-none bg-neutral-50/50"
                  />
                </div>

                {/* Social Media Links */}
                <div>
                  <label className="block text-xs font-black uppercase text-neutral-800 mb-2">
                    Social Media Profiles (Optional)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative flex items-center">
                      <div className="absolute left-3">
                        <InstagramIcon className="w-4 h-4 text-neutral-500" />
                      </div>
                      <input
                        type="url"
                        value={insta}
                        onChange={(e) => setInsta(e.target.value)}
                        placeholder="Instagram URL"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:border-black focus:outline-none bg-neutral-50/50"
                      />
                    </div>

                    <div className="relative flex items-center">
                      <div className="absolute left-3">
                        <XIcon className="w-4 h-4 text-neutral-500" />
                      </div>
                      <input
                        type="url"
                        value={xLink}
                        onChange={(e) => setXLink(e.target.value)}
                        placeholder="X / Twitter URL"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:border-black focus:outline-none bg-neutral-50/50"
                      />
                    </div>

                    <div className="relative flex items-center">
                      <div className="absolute left-3">
                        <YoutubeIcon className="w-4 h-4 text-neutral-500" />
                      </div>
                      <input
                        type="url"
                        value={youtube}
                        onChange={(e) => setYoutube(e.target.value)}
                        placeholder="YouTube URL"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:border-black focus:outline-none bg-neutral-50/50"
                      />
                    </div>

                    <div className="relative flex items-center">
                      <div className="absolute left-3">
                        <LinkedinIcon className="w-4 h-4 text-neutral-500" />
                      </div>
                      <input
                        type="url"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        placeholder="LinkedIn URL"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-neutral-300 text-xs text-neutral-900 focus:border-black focus:outline-none bg-neutral-50/50"
                      />
                    </div>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-xs text-red-700 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Submit Launch Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !handle}
                  className="w-full py-4 px-8 rounded-2xl bg-black text-white font-black text-sm uppercase tracking-wider hover:bg-neutral-800 active:scale-[0.99] transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                      <span>Activating Your Page...</span>
                    </>
                  ) : (
                    <>
                      <span>💖 Claim @{handle || 'handle'} & Launch</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right Column: Live Creator Card Preview */}
            <div className="lg:col-span-5 space-y-4">
              <div className="text-center lg:text-left">
                <span className="text-[10px] font-black tracking-widest uppercase px-3 py-1 bg-white/10 text-neutral-300 rounded-full">
                  LIVE CARD PREVIEW
                </span>
                <h3 className="text-xl font-black uppercase text-white mt-1">
                  How Fans See Your Page
                </h3>
              </div>

              {/* Mockup Card */}
              <div className="bg-neutral-900 border-2 border-neutral-800 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden space-y-6">
                {/* Background decorative glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center gap-4">
                  <Avatar
                    src={avatarUrl}
                    name={displayName || user.name}
                    size="xl"
                    className="border-2 border-white shadow-lg"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xl font-black uppercase tracking-tight truncate">
                      {displayName || 'Your Name'}
                    </h4>
                    <p className="text-xs font-mono font-bold text-amber-400">
                      @{handle || 'yourhandle'}
                    </p>
                  </div>
                </div>

                <div className="bg-black/60 p-4 rounded-2xl border border-white/10 space-y-1.5">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                    Public Creator Link
                  </span>
                  <p className="text-xs font-mono font-bold text-emerald-400 truncate">
                    https://{appHost}/{handle || 'yourhandle'}
                  </p>
                </div>

                {bio ? (
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-1">
                    <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                      Bio
                    </span>
                    <p className="text-xs text-neutral-200 font-medium leading-relaxed">
                      {bio}
                    </p>
                  </div>
                ) : (
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 border-dashed text-center">
                    <p className="text-xs text-neutral-400 italic">
                      Add a bio to let fans know about your upcoming meetups and jams.
                    </p>
                  </div>
                )}

                {/* Social icons preview */}
                {(insta || fb || xLink || linkedin || youtube) && (
                  <div className="flex items-center gap-2 pt-1">
                    {insta && (
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white">
                        <InstagramIcon className="w-4 h-4" />
                      </div>
                    )}
                    {xLink && (
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white">
                        <XIcon className="w-4 h-4" />
                      </div>
                    )}
                    {youtube && (
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white">
                        <YoutubeIcon className="w-4 h-4" />
                      </div>
                    )}
                    {linkedin && (
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white">
                        <LinkedinIcon className="w-4 h-4" />
                      </div>
                    )}
                    {fb && (
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white">
                        <FacebookIcon className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-400">
                  <span>⚡ 0 Events yet (Add in Studio)</span>
                  <span className="font-bold text-white">Direct Fan Meetups</span>
                </div>
              </div>

              {/* Info checklist */}
              <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-5 space-y-2.5 text-xs text-neutral-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Events can be created anytime in your Admin Studio</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Custom venue address & map links supported</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Real-time seat capacity locking & QR ticket generation</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
