'use client';

import React, { useState, useEffect } from 'react';
import { Ad } from '@/types';
import { adService } from '@/services';

interface AdSlotProps {
  position: string;
  className?: string;
}

export default function AdSlot({ position, className }: AdSlotProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const validAds = await adService.getActiveAdsBySlot(position);
        
        if (validAds && validAds.length > 0) {
          const randomIndex = Math.floor(Math.random() * validAds.length);
          setAd(validAds[randomIndex]);
        } else {
          setAd(null);
        }
      } catch (error) {
        console.warn(`Error fetching ad for ${position}:`, error);
      } finally {
        setLoading(false);
      }
    };
    fetchAd();
  }, [position]);

  const isHorizontal = position === 'home_top' || position === 'home_middle' || position === 'home_footer';

  // Strip any mobile-specific min-h- or h- classes (those without responsive prefix like md:)
  const cleanedClassName = className
    ? className
        .split(' ')
        .filter((c) => {
          const isMobileHeight = (c.startsWith('min-h-') || c.startsWith('h-')) && !c.includes(':');
          return !isMobileHeight;
        })
        .join(' ')
    : '';

  if (loading || !ad) {
    return (
      <div 
        className={`bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-zinc-300 ${cleanedClassName}`}
        style={isHorizontal ? { aspectRatio: '728 / 90', width: '100%', height: 'auto' } : undefined}
      >
        Publicidade
      </div>
    );
  }

  if (isHorizontal) {
    return (
      <div 
        className={`relative group overflow-hidden rounded-2xl w-full ${cleanedClassName}`}
        style={{ width: '100%' }}
      >
        <a 
          href={ad.target_url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="block w-full"
          style={{ display: 'block', width: '100%' }}
        >
          <div 
            className="relative w-full overflow-hidden animate-in fade-in duration-500"
            style={{ position: 'relative', width: '100%', aspectRatio: '728 / 90', overflow: 'hidden' }}
          >
            <img 
              src={ad.image_url} 
              alt={ad.name} 
              className="transition-transform duration-700 group-hover:scale-105"
              style={{ display: 'block', width: '100%', height: '100%', maxWidth: 'none', objectFit: 'cover' }}
            />
            <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-[8px] font-black uppercase tracking-widest text-white px-2 py-1 rounded z-10">
              Patrocinado
            </div>
          </div>
        </a>
      </div>
    );
  }

  return (
    <div className={`relative group overflow-hidden rounded-2xl ${cleanedClassName}`}>
      <a href={ad.target_url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
        <img 
          src={ad.image_url} 
          alt={ad.name} 
          className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-[8px] font-black uppercase tracking-widest text-white px-2 py-1 rounded z-10">
          Patrocinado
        </div>
      </a>
    </div>
  );
}
