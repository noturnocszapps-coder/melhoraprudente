const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const client = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: newsItems, error } = await client
    .from('news')
    .select('*')
    .ilike('title', '%lady gaga%');

  if (error) {
    console.error('Error fetching lady gaga news:', error);
    return;
  }

  console.log(`Found ${newsItems.length} news matching lady gaga`);

  for (const item of newsItems) {
    console.log('--- OLD DATA ---');
    console.log('ID:', item.id);
    console.log('Old Excerpt:', item.excerpt?.substring(0, 150));
    console.log('Old Content starts with:', item.content?.substring(0, 150));

    // Clean excerpt: make it a clean short summary
    const cleanExcerpt = "Professor de química em Presidente Prudente viralizou nas redes sociais ao usar figurino inspirado em Lady Gaga para ensinar matéria de Estado Gasoso em cursinho pré-vestibular.";

    // Clean content: remove any leading ]]> or residual CDATA/raw blocks if present
    let cleanContent = item.content || "";
    cleanContent = cleanContent.replace(/^[\s\S]*?\]\]>\s*/i, '').trim();
    // Also remove any "LEIA TAMBÉM" or G1 whatsapp lines if present in content
    cleanContent = cleanContent
      .split('\n')
      .filter(line => {
        const l = line.trim();
        if (l.startsWith(']]>')) return false;
        if (l.match(/^LEIA TAMBÉM/i)) return false;
        if (l.match(/^Veja também/i)) return false;
        if (l.match(/^Participe do canal do g1/i)) return false;
        if (l.match(/^VÍDEOS: assista/i)) return false;
        return true;
      })
      .join('\n')
      .trim();

    console.log('--- NEW CLEANED DATA ---');
    console.log('New Excerpt:', cleanExcerpt);
    console.log('New Content starts with:', cleanContent.substring(0, 150));

    const { error: updateErr } = await client
      .from('news')
      .update({
        excerpt: cleanExcerpt,
        content: cleanContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', item.id);

    if (updateErr) {
      console.error('Error updating news item:', updateErr);
    } else {
      console.log('Successfully updated lady gaga news item in DB!');
    }
  }
}

run();
