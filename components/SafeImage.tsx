'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Shield } from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function SafeImage({
  src,
  alt,
  className = '',
  fallbackTitle,
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#0A2540] via-[#13325A] to-[#1E3A8A] text-white/80 ${className}`}
      >
        <Shield className="w-7 h-7 text-emerald-400/80 mb-1" />
        {fallbackTitle ? (
          <span className="text-xs font-medium text-white/80">{fallbackTitle}</span>
        ) : null}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 768px) 100vw, 50vw"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
