'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Ad } from '@/types';

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
        const { data, error } = await supabase
          .from('ads')
          .select('*')
          .eq('slot', position)
          .eq('is_active', true);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Filter by date if applicable
          const now = new Date().toISOString();
          const validAds = data.filter(a => {
            const startOk = !a.starts_at || a.starts_at <= now;
            const endOk = !a.ends_at || a.ends_at >= now;
            return startOk && endOk;
          });

          if (validAds.length > 0) {
            const randomIndex = Math.floor(Math.random() * validAds.length);
            setAd(validAds[randomIndex]);
          }
        }
      } catch (error) {
        console.error(`Error fetching ad for ${position}:`, error);
      } finally {
        setLoading(false);
      }
    };
    fetchAd();
  }, [position]);

  if (loading || !ad) {
    return (
      <div className={`bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-zinc-300 min-h-[100px] ${className}`}>
        Publicidade
      </div>
    );
  }

  return (
    <div className={`relative group overflow-hidden rounded-2xl ${className}`}>
      <a href={ad.target_url} target="_blank" rel="noopener noreferrer" className="block">
        <img 
          src={ad.image_url} 
          alt={ad.name} 
          className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-[8px] font-black uppercase tracking-widest text-white px-2 py-1 rounded">
          Patrocinado
        </div>
      </a>
    </div>
  );
}
