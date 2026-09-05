export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const wineUrl = url.searchParams.get('url') || '';
  if (!wineUrl) return new Response(JSON.stringify({ error: 'Missing url' }), { status: 400 });

  try {
    const resp = await fetch(wineUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const html = await resp.text();

    // Extract data
    const name = (html.match(/<h1[^>]*>([^<]+)<\/h1>/) || [,''])[1].trim();
    const winery = (html.match(/Penfolds<\/a>\s*([^<]+)/) || [,''])[1].trim();
    
    // Rating
    const ratingMatch = html.match(/(\d\.\d)\s*<[^>]*>ratings?\s*([\d,.]+)/);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
    const reviews = ratingMatch ? parseInt(ratingMatch[2].replace(/,/g,'')) : 0;
    
    // Price
    const priceMatch = html.match(/\$(\d+[\d.,]*)/);
    const price = priceMatch ? priceMatch[1] : null;
    
    // Grape
    const grapeMatch = html.match(/Grapes[^<]*<[^>]*>([^<]+)<\/a>/);
    const grapes = grapeMatch ? grapeMatch[1].trim() : '';
    
    // Region
    const regionMatch = html.match(/Region[^<]*<[^>]*>([^<]+)<\/a>/);
    const region = regionMatch ? regionMatch[1].trim() : '';
    
    // Alcohol
    const alcoMatch = html.match(/Alcohol content<\/td>[^<]*<td[^>]*>([^<]+%)/);
    const alcohol = alcoMatch ? alcoMatch[1].trim() : '';
    
    // Type
    const typeMatch = html.match(/Wine style[^<]*<[^>]*>([^<]+)<\/a>/);
    const type = typeMatch ? typeMatch[1].trim() : 'Wine';

    // Critic scores
    const wsMatch = html.match(/Wine Spectator[^<]*<\/td>[^<]*<td[^>]*>\s*(\d+)/);
    const rpMatch = html.match(/Robert Parker[^<]*<\/td>[^<]*<td[^>]*>\s*(\d+)/);
    const jsMatch = html.match(/James Suckling[^<]*<\/td>[^<]*<td[^>]*>\s*(\d+)/);

    // Description
    const descMatch = html.match(/"description":"([^"]+)"/);
    const description = descMatch ? descMatch[1].replace(/\\n/g, ' ') : '';

    return new Response(JSON.stringify({
      name, winery, rating, reviews, price, grapes, region, alcohol, type,
      ws: wsMatch ? wsMatch[1] : null,
      rp: rpMatch ? rpMatch[1] : null,
      js: jsMatch ? jsMatch[1] : null,
      description
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
