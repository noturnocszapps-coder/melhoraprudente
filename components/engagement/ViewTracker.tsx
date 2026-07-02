'use client';

import { useEffect } from 'react';
import { engagementService } from '@/services';

interface ViewTrackerProps {
  newsId: string;
}

export default function ViewTracker({ newsId }: ViewTrackerProps) {
  useEffect(() => {
    if (!newsId) return;
    
    // Generate or fetch session ID from localStorage
    let sessionId = localStorage.getItem('mp_session_id');
    if (!sessionId) {
      sessionId = `session-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
      localStorage.setItem('mp_session_id', sessionId);
    }
    
    // Record view in Supabase / Local Fallback
    engagementService.recordView(newsId, sessionId);
  }, [newsId]);

  return null;
}
