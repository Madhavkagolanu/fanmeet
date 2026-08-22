'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  priority?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-20 h-20 text-2xl',
  '2xl': 'w-28 h-28 text-3xl sm:w-32 sm:h-32 sm:text-4xl',
};

const dimensionMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 80,
  '2xl': 128,
};

// Generate consistent background color based on name
function getGradientFromName(name: string): string {
  const gradients = [
    'from-pink-500 via-rose-500 to-amber-500',
    'from-violet-600 via-indigo-600 to-blue-500',
    'from-emerald-500 via-teal-500 to-cyan-500',
    'from-amber-500 via-orange-500 to-red-500',
    'from-fuchsia-600 via-purple-600 to-pink-500',
    'from-cyan-500 via-blue-600 to-indigo-600',
  ];

  if (!name) return gradients[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

// Generate initials (e.g. "Alex Rivera" -> "AR", "Sarah" -> "S")
function getInitials(name: string): string {
  if (!name || typeof name !== 'string') return 'FM';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'FM';
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({
  src,
  name = 'Creator',
  size = 'md',
  className = '',
  priority = false,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [hasValidSrc, setHasValidSrc] = useState(Boolean(src && src.trim()));

  useEffect(() => {
    setImageError(false);
    setHasValidSrc(Boolean(src && src.trim()));
  }, [src]);

  const initials = getInitials(name);
  const gradient = getGradientFromName(name);
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const dimension = dimensionMap[size] || 40;

  if (hasValidSrc && !imageError && src) {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 aspect-square bg-neutral-100 ${sizeClass} ${className}`}
        style={{ borderRadius: '9999px' }}
      >
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover object-center rounded-full block"
          onError={() => setImageError(true)}
          style={{ borderRadius: '9999px' }}
        />
      </div>
    );
  }

  // Fallback: Initials with stylish vibrant gradient
  return (
    <div
      className={`inline-flex items-center justify-center font-black rounded-full shrink-0 select-none aspect-square bg-gradient-to-tr text-white tracking-wider shadow-inner ${gradient} ${sizeClass} ${className}`}
      style={{ borderRadius: '9999px' }}
      title={name}
      aria-label={name}
    >
      <span>{initials}</span>
    </div>
  );
}
