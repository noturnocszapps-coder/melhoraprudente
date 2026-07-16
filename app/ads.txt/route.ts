import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('adsense_code')
      .single();

    if (error) {
      return new NextResponse('google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    let adsTxt = 'google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0';
    if (data && data.adsense_code) {
      if (data.adsense_code.startsWith('{')) {
        try {
          const parsed = JSON.parse(data.adsense_code);
          if (parsed.ads_txt_content) {
            adsTxt = parsed.ads_txt_content;
          } else if (parsed.adsense_publisher_id) {
            adsTxt = `google.com, ${parsed.adsense_publisher_id}, DIRECT, f08c47fec0942fa0`;
          }
        } catch (e) {}
      } else {
        // Just return the raw text if it's not a JSON
        adsTxt = data.adsense_code;
      }
    }

    return new NextResponse(adsTxt, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400'
      },
    });
  } catch (err) {
    return new NextResponse('google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
