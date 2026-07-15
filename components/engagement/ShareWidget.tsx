'use client';

import React, { useState, useEffect } from 'react';
import { Share2, Link2, Check } from 'lucide-react';
import { engagementService } from '@/services';
import { checkRateLimit } from '@/lib/rateLimit';
import { trackEvent } from '@/lib/analytics';

interface ShareWidgetProps {
  newsId: string;
  newsTitle: string;
  newsSlug: string;
}

export default function ShareWidget({ newsId, newsTitle, newsSlug }: ShareWidgetProps) {
  const [sharesCount, setSharesCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/noticia/${newsSlug}`
    : `https://melhoraprudente.com.br/noticia/${newsSlug}`;

  useEffect(() => {
    async function loadShares() {
      try {
        const count = await engagementService.getSharesCount(newsId);
        setSharesCount(count);
      } catch (err) {
        console.error('Error loading shares count:', err);
      }
    }
    loadShares();
  }, [newsId]);

  const handleShare = async (platform: string, url: string) => {
    const limitResult = checkRateLimit(`share:${newsId}`, 10, 60000, true);
    if (limitResult.limited) {
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    try {
      await engagementService.recordShare(newsId, platform);
      setSharesCount(prev => prev + 1);
      trackEvent('compartilhamento', {
        category: 'Engajamento',
        news_id: newsId,
        platform: platform,
        slug: newsSlug
      });
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Error recording share:', err);
      trackEvent('compartilhamento_erro', {
        category: 'Erros',
        news_id: newsId,
        platform: platform
      });
    }
  };

  const handleCopyLink = async () => {
    const limitResult = checkRateLimit(`share:${newsId}`, 10, 60000, true);
    if (limitResult.limited) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Error copying link:', err);
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      await engagementService.recordShare(newsId, 'copy_link');
      setSharesCount(prev => prev + 1);
      trackEvent('compartilhamento', {
        category: 'Engajamento',
        news_id: newsId,
        platform: 'copy_link',
        slug: newsSlug
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying link:', err);
      trackEvent('compartilhamento_erro', {
        category: 'Erros',
        news_id: newsId,
        platform: 'copy_link'
      });
    }
  };

  const encodedTitle = encodeURIComponent(newsTitle);
  const encodedUrl = encodeURIComponent(shareUrl);

  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`
  };

  return (
    <div className="bg-zinc-50 p-6 rounded-[2rem] border border-zinc-100/60 space-y-4 shadow-sm" id="share-widget">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Compartilhar</h4>
        {sharesCount > 0 && (
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider bg-zinc-200/50 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Share2 size={10} className="text-red-500" /> {sharesCount} {sharesCount === 1 ? 'envio' : 'envios'}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handleShare('whatsapp', shareLinks.whatsapp)}
          className="bg-[#25D366] hover:bg-[#20ba59] text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
        >
          <span className="font-extrabold text-[13px] leading-none">WhatsApp</span>
        </button>

        <button
          onClick={() => handleShare('facebook', shareLinks.facebook)}
          className="bg-[#1877F2] hover:bg-[#1564d2] text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
        >
          <span className="font-extrabold text-[13px] leading-none">Facebook</span>
        </button>

        <button
          onClick={() => handleShare('twitter', shareLinks.twitter)}
          className="bg-zinc-950 hover:bg-zinc-900 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm border border-zinc-800 cursor-pointer"
        >
          <span className="font-extrabold text-[13px] leading-none">X (Twitter)</span>
        </button>

        <button
          onClick={handleCopyLink}
          className={`font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer border ${
            copied
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-700'
          }`}
        >
          {copied ? (
            <>
              <Check size={14} className="text-green-600" />
              <span className="font-extrabold text-[13px] leading-none">Copiado</span>
            </>
          ) : (
            <>
              <Link2 size={14} />
              <span className="font-extrabold text-[13px] leading-none">Copiar Link</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
