const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const client = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  // Query news table
  const { data: newsData, error: newsErr } = await client
    .from('news')
    .select('id, title, excerpt, content, created_at')
    .ilike('title', '%lady gaga%')
    .limit(5);

  console.log('--- NEWS TABLE ---');
  if (newsErr) console.log('News Error:', newsErr);
  else {
    newsData.forEach(n => {
      console.log('ID:', n.id);
      console.log('TITLE:', n.title);
      console.log('EXCERPT (length', n.excerpt?.length, '):', n.excerpt ? n.excerpt.substring(0, 200) : 'null');
      console.log('CONTENT (length', n.content?.length, '):', n.content ? n.content.substring(0, 300) : 'null');
    });
  }

  // Query news_candidates table
  const { data: candData, error: candErr } = await client
    .from('news_candidates')
    .select('id, original_title, original_url, ai_summary, status')
    .ilike('original_title', '%lady gaga%')
    .limit(5);

  console.log('\n--- NEWS CANDIDATES TABLE ---');
  if (candErr) console.log('Cand Error:', candErr);
  else {
    candData.forEach(c => {
      console.log('ID:', c.id);
      console.log('TITLE:', c.original_title);
      console.log('AI SUMMARY (length', c.ai_summary?.length, '):', c.ai_summary ? c.ai_summary.substring(0, 200) : 'null');
    });
  }
}

run();
