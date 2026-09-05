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

    // Extract data using multiple regex strategies
    // Name - try various patterns
    let name = '';
    const h1Match = html.match(/<h1[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) name = h1Match[1].trim();
    else {
      const h1Fallback = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
      if (h1Fallback) name = h1Fallback[1].trim();
    }

    // Winery
    let winery = '';
    const wMatch = html.match(/wineries\/([^"]+)"[^>]*>([^<]+)<\/a>/);
    if (wMatch) winery = wMatch[2].trim();

    // Rating - look for rating text pattern: "4.6 (29892 ratings)"
    let rating = 0, reviews = 0;
    const rMatch = html.match(/(\d\.\d+)\s*<[^>]*>.*?(\d[\d,]*)\s*ratings?\s*</);
    if (rMatch) {
      rating = parseFloat(rMatch[1]);
      reviews = parseInt(rMatch[2].replace(/,/g, ''));
    } else {
      const rFallback = html.match(/(\d\.\d+)\s*<[^>]*>ratings?\s*<[^>]*>(\d[\d,]*)/);
      if (rFallback) {
        rating = parseFloat(rFallback[1]);
        reviews = parseInt(rFallback[2].replace(/,/g, ''));
      }
    }

    // Price
    let price = '';
    const pMatch = html.match(/\$(\d+[\d.,]*)/);
    if (pMatch) price = pMatch[1];

    // Wine type/style
    let type = '';
    const tMatch = html.match(/Wine style[^<]*<[^>]*>([^<]+)<\/a>/i);
    if (tMatch) type = tMatch[1].trim();

    // Grapes
    let grapes = '';
    const gMatch = html.match(/Grapes[^<]*<\/td>[^<]*<td[^>]*>([^<]+)</i);
    if (gMatch) grapes = gMatch[1].trim();
    else {
      const gFallback = html.match(/Grapes[^<]*<[^>]*>([^<]+)<\/a>/i);
      if (gFallback) grapes = gFallback[1].trim();
    }

    // Region
    let region = '';
    const regMatch = html.match(/Region[^<]*<\/td>[^<]*<td[^>]*>([^<]+)</i);
    if (regMatch) region = regMatch[1].trim();

    // Alcohol
    let alcohol = '';
    const aMatch = html.match(/Alcohol content[^<]*<\/td>[^<]*<td[^>]*>([^<]+)/i);
    if (aMatch) alcohol = aMatch[1].trim();

    // Critic scores
    let ws = '', rp = '', js = '';
    const wsMatch = html.match(/Wine Spectator[^<]*<\/td>[^<]*<td[^>]*>(\d+)/i);
    if (wsMatch) ws = wsMatch[1];
    const rpMatch = html.match(/Robert Parker[^<]*<\/td>[^<]*<td[^>]*>(\d+)/i);
    if (rpMatch) rp = rpMatch[1];
    const jsMatch = html.match(/James Suckling[^<]*<\/td>[^<]*<td[^>]*>(\d+)/i);
    if (jsMatch) js = jsMatch[1];

    // Vintage - extract from the page
    let vintage = '';
    const vMatch = html.match(/Vintage(\d{4})/);
    if (vMatch) vintage = vMatch[1];

    // Description from JSON-LD
    let description = '';
    const dMatch = html.match(/"description":"([^"]+)"/);
    if (dMatch) description = dMatch[1].replace(/\\n/g, ' ');

    return new Response(JSON.stringify({
      name, winery, rating, reviews, price, grapes, region, alcohol,
      type, vintage, description,
      ws, rp, js
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}