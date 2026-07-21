const { createClient } = require('@supabase/supabase-js');

function getGarimpoMinimumDate_test() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '', 10);
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '', 10) - 1; // 0-indexed
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '', 10);
  
  // Criar data de hoje 00:00 no fuso de São Paulo (UTC-3)
  const todayInSP = new Date(Date.UTC(year, month, day, 3, 0, 0, 0));
  
  // Ontem às 00:00 no fuso de São Paulo
  const yesterdayInSP = new Date(todayInSP.getTime() - 24 * 60 * 60 * 1000);
  return yesterdayInSP;
}

async function checkDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  console.log('NEXT_PUBLIC_SUPABASE_URL is configured:', !!supabaseUrl);
  if (!supabaseUrl) return;

  const client = createClient(supabaseUrl, supabaseAnonKey);
  try {
    const { data, error } = await client
      .from('news_candidates')
      .select('id, source_name, original_title, original_url, original_published_at, status')
      .order('collected_at', { ascending: false })
      .limit(15);
    
    if (error) {
      console.error('Error fetching candidates:', error);
      return;
    }
    console.log(`\nFound ${data.length} news_candidates in database:`);
    const minDate = getGarimpoMinimumDate_test();
    console.log('Minimum Date limitDate:', minDate.toISOString());
    
    data.forEach((row, i) => {
      const pubDate = new Date(row.original_published_at);
      const isOld = (!row.original_published_at || row.original_published_at === 'unknown' || isNaN(pubDate.getTime()) || pubDate < minDate);
      console.log(`[${i}] Source: ${row.source_name}`);
      console.log(`    Title: "${row.original_title}"`);
      console.log(`    Published At: ${row.original_published_at}`);
      console.log(`    parsed pubDate: ${pubDate.toISOString()} -> isOld: ${isOld}`);
      console.log(`    Status: ${row.status}`);
    });
  } catch (err) {
    console.error('DB exception:', err);
  }
}

async function run() {
  console.log('--- TEST RUN ---');
  const now = new Date();
  console.log('Current Date (now):', now.toISOString());
  
  await checkDatabase();
}

run();
