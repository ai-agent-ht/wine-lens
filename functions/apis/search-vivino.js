export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';
  if (!q) return new Response(JSON.stringify({ error: 'Missing query' }), { status: 400 });

  try {
    // Search Vivino via their search page
    const searchUrl = 'https://www.vivino.com/search/wines?q=' + encodeURIComponent(q);
    const resp = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const html = await resp.text();

    // Extract first wine link from search results
    const match = html.match(/href="(https:\/\/www\.vivino\.com\/[a-z]+\/[^"]+\/w\/\d+[^"]*)"/);
    if (!match) return new Response(JSON.stringify({ error: 'No results' }), { status: 404 });

    return new Response(JSON.stringify({ url: match[1] }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
