'use client';

import React from 'react';

interface RoxouLogoProps {
  variant?: 'symbol' | 'horizontal' | 'vertical' | 'favicon';
  theme?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  className?: string;
  customSize?: number;
}

export default function RoxouLogo({
  variant = 'horizontal',
  theme = 'dark',
  size = 'md',
  className = '',
  customSize,
}: RoxouLogoProps) {
  // Dimensions map
  const sizeMap = {
    sm: variant === 'symbol' || variant === 'favicon' ? 24 : 120,
    md: variant === 'symbol' || variant === 'favicon' ? 40 : 160,
    lg: variant === 'symbol' || variant === 'favicon' ? 64 : 220,
    xl: variant === 'symbol' || variant === 'favicon' ? 96 : 320,
    custom: customSize || 40,
  };

  const currentSize = sizeMap[size];

  const isDark = theme === 'dark';
  const textColor = isDark ? 'text-white' : 'text-zinc-950';
  const subtextColor = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const purpleAccent = '#a855f7'; // Purple-500
  const purpleNeon = '#c084fc'; // Purple-400

  // The symbol alone
  const renderSymbol = (symbolSize: number) => (
    <svg
      width={symbolSize}
      height={symbolSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="inline-block select-none filter drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]"
    >
      <defs>
        <linearGradient id="roxouHexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="roxouXGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f3e8ff" />
        </linearGradient>
        <filter id="roxouGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer Hexagon */}
      <polygon
        points="50,5 90,28 90,72 50,95 10,72 10,28"
        fill="black"
        fillOpacity="0.3"
        stroke="url(#roxouHexGradient)"
        strokeWidth="6"
        strokeLinejoin="round"
        className="transition-all duration-300"
      />

      {/* Decorative inner tech dots/lines */}
      <circle cx="50" cy="18" r="2" fill={purpleNeon} />
      <circle cx="50" cy="82" r="2" fill={purpleNeon} />

      {/* Geometric "X" - Left-to-Right Slash */}
      <path
        d="M 28,34 C 28,34 40,50 50,50 C 60,50 72,66 72,66"
        stroke="url(#roxouXGradient)"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d="M 72,34 C 72,34 60,50 50,50 C 40,50 28,66 28,66"
        stroke="url(#roxouHexGradient)"
        strokeWidth="10"
        strokeLinecap="round"
      />

      {/* Center connection node */}
      <circle cx="50" cy="50" r="5" fill="#ffffff" className="animate-pulse" />
    </svg>
  );

  if (variant === 'symbol' || variant === 'favicon') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {renderSymbol(currentSize)}
      </div>
    );
  }

  if (variant === 'horizontal') {
    const symbolSize = Math.max(24, Math.floor(currentSize * 0.22));
    return (
      <div className={`inline-flex items-center gap-3.5 select-none ${className}`}>
        {renderSymbol(symbolSize)}
        <div className="flex flex-col justify-center">
          <span 
            className={`font-black tracking-[0.25em] text-lg md:text-xl ${textColor}`}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            ROXOU
          </span>
          <span className={`text-[8px] font-bold tracking-[0.15em] whitespace-nowrap ${subtextColor}`}>
            TECNOLOGIA • MÍDIA • EXPERIÊNCIAS
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'vertical') {
    const symbolSize = Math.max(48, Math.floor(currentSize * 0.35));
    return (
      <div className={`flex flex-col items-center text-center select-none ${className}`}>
        {renderSymbol(symbolSize)}
        <div className="mt-4 space-y-1">
          <h1 
            className={`font-black tracking-[0.3em] text-2xl md:text-3xl ${textColor}`}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            ROXOU
          </h1>
          <p className={`text-[9px] md:text-[10px] font-black tracking-[0.22em] uppercase ${subtextColor}`}>
            TECNOLOGIA • MÍDIA • EXPERIÊNCIAS
          </p>
        </div>
      </div>
    );
  }

  return null;
}
