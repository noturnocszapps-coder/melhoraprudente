import { garimpoService } from './services/news-sources/garimpo-service';
import { supabase } from './lib/supabase';

async function run() {
  console.log('--- RUNNING REAL GARIMPO SERVICE ---');
  try {
    const stats = await garimpoService.buscarNovasNoticias(10, supabase);
    console.log('Varredura concluída!');
    console.log('Stats:', JSON.stringify(stats, null, 2));
  } catch (err) {
    console.error('Fatal error running Garimpo Service:', err);
  }
}

run();
