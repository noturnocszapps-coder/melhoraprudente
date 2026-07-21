async function testPrefeitura() {
  const url = 'https://presidenteprudente.sp.gov.br/site/noticias.xhtml';
  console.log('Testing Prefeitura...');
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    if (!res.ok) {
      console.log('Prefeitura responded with error:', res.status);
      return;
    }
    const html = await res.text();
    console.log('Prefeitura HTML Length:', html.length);
    
    // Check if table contains rows
    const trRegex = /<tr[^>]*data-ri="(\d+)"[^>]*>([\s\S]*?)<\/tr>/gi;
    let match;
    let count = 0;
    while ((match = trRegex.exec(html)) !== null && count < 15) {
      const rowHtml = match[2];
      const dateRegex = /<strong>\s*(\d{2}\/\d{2}\/\d{4})\s*<\/strong>/i;
      const dateMatch = dateRegex.exec(rowHtml);
      const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*title=["']([^"']+)["'][^>]*>/i;
      const linkMatch = linkRegex.exec(rowHtml);
      
      console.log(`Row ${count}:`);
      if (dateMatch) {
        console.log(`  Raw Date: "${dateMatch[1]}"`);
      } else {
        console.log(`  Raw Date: NOT FOUND in row: ${rowHtml.substring(0, 150)}`);
      }
      if (linkMatch) {
        console.log(`  Title: "${linkMatch[2]}"`);
        console.log(`  URL: "${linkMatch[1]}"`);
      } else {
        console.log(`  Link/Title: NOT FOUND in row: ${rowHtml.substring(0, 150)}`);
      }
      count++;
    }
    if (count === 0) {
      console.log('No rows matched trRegex. Let\'s check for <tr> tags in general.');
      const anyTr = html.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
      if (anyTr) {
        console.log(`Found ${anyTr.length} <tr> tags. Printing first 2:`);
        console.log(anyTr.slice(0, 2).map(t => t.substring(0, 200)));
      } else {
        console.log('No <tr> tags found at all in HTML!');
      }
    }
  } catch (err) {
    console.error('Error fetching Prefeitura:', err);
  }
}

async function testG1() {
  const rssUrl = 'https://g1.globo.com/dynamo/sp/presidente-prudente-e-regiao/rss2.xml';
  console.log('\nTesting G1...');
  try {
    const res = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    console.log('G1 Status:', res.status);
    if (!res.ok) return;
    const xml = await res.text();
    console.log('G1 XML Length:', xml.length);
    
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    let match;
    let count = 0;
    while ((match = itemRegex.exec(xml)) !== null && count < 5) {
      const itemXml = match[1];
      const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i);
      const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
      const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i);
      console.log(`G1 Item ${count}:`);
      console.log(`  Title: ${titleMatch ? titleMatch[1].trim() : 'N/A'}`);
      console.log(`  PubDate: ${pubDateMatch ? pubDateMatch[1].trim() : 'N/A'}`);
      console.log(`  Link: ${linkMatch ? linkMatch[1].trim() : 'N/A'}`);
      count++;
    }
  } catch (err) {
    console.error('Error fetching G1:', err);
  }
}

async function testInova() {
  const url = 'https://inovaprudente.com.br/noticias';
  console.log('\nTesting Inova...');
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    console.log('Inova Status:', res.status);
    if (!res.ok) return;
    const html = await res.text();
    console.log('Inova HTML Length:', html.length);
    const postRegex = /<div class=\"row post-micro[^\"]* clearfix\">([\s\S]*?)<\/div>\s*<!-- end post-micro -->/gi;
    let match;
    let count = 0;
    while ((match = postRegex.exec(html)) !== null && count < 5) {
      const postHtml = match[1];
      const linkTitleMatch = postHtml.match(/<h3[^>]*>\s*<a href=\"([^\"]+)\"[^>]*>([\s\S]*?)<\/a>\s*<\/h3>/i);
      const dateMatch = postHtml.match(/<h4>(\d{2}\/\d{2}\/\d{4})<\/h4>/i);
      console.log(`Inova Item ${count}:`);
      console.log(`  Title: ${linkTitleMatch ? linkTitleMatch[2].trim() : 'N/A'}`);
      console.log(`  Date: ${dateMatch ? dateMatch[1].trim() : 'N/A'}`);
      count++;
    }
    if (count === 0) {
      console.log('Inova: No matching post-micro divs. Let\'s search for post classes or date patterns in HTML.');
      const postClasses = html.match(/class="[^"]*post[^"]*"/gi);
      console.log('Found post-related classes:', postClasses ? postClasses.slice(0, 10) : 'None');
      const dates = html.match(/\d{2}\/\d{2}\/\d{4}/g);
      console.log('Found date-like patterns:', dates ? dates.slice(0, 10) : 'None');
    }
  } catch (err) {
    console.error('Error fetching Inova:', err);
  }
}

async function run() {
  await testPrefeitura();
  await testG1();
  await testInova();
}

run();
