// ── Wine Lens - Cloudflare Worker ──
// Serves the HTML app + API proxy for Vivino

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<title>🍷 Wine Lens</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:#f8f6f2;color:#2d2d2d;min-height:100dvh;display:flex;flex-direction:column;align-items:center}
.container{max-width:480px;width:100%;padding:16px;padding-bottom:80px}
.header{display:flex;align-items:center;gap:10px;padding:16px 0 8px}
.header h1{font-size:22px;font-weight:700;letter-spacing:-0.3px}
.tabs{display:flex;gap:8px;margin:12px 0 16px;border-bottom:2px solid #e8e4de;padding-bottom:10px}
.tab{flex:1;padding:10px;text-align:center;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;background:#e8e4de;color:#666;border:none;transition:all .2s}
.tab.active{background:#722f37;color:#fff}
.camera-area{position:relative;background:#000;border-radius:12px;overflow:hidden;aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;margin-bottom:12px}
.camera-area video{width:100%;height:100%;object-fit:cover}
.camera-area img{width:100%;height:100%;object-fit:contain;background:#1a1a1a}
.camera-placeholder{color:#999;text-align:center;font-size:15px}
.overlay-btns{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:10px}
.overlay-btns button{padding:10px 24px;border:none;border-radius:24px;font-size:14px;font-weight:600;cursor:pointer;transition:all .15s}
.btn-capture{background:#fff;color:#2d2d2d;box-shadow:0 2px 8px rgba(0,0,0,.3)}
.btn-retake{background:rgba(255,255,255,.9);color:#2d2d2d}
.btn-done{background:#722f37;color:#fff}
.btn-done:disabled{opacity:.5;cursor:not-allowed}
.search-box{display:flex;gap:8px;margin-bottom:12px}
.search-box input{flex:1;padding:12px 14px;border:2px solid #ddd;border-radius:10px;font-size:16px;background:#fff;outline:none}
.search-box input:focus{border-color:#722f37}
.search-box button{padding:12px 18px;background:#722f37;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap}
.search-box button:disabled{opacity:.5}
.status{text-align:center;padding:12px;font-size:14px;color:#888;min-height:44px}
.status .spinner{display:inline-block;width:16px;height:16px;border:2px solid #ddd;border-top-color:#722f37;border-radius:50%;animation:spin .7s linear infinite;vertical-align:middle;margin-right:8px}
@keyframes spin{to{transform:rotate(360deg)}}
.result-card{background:#fff;border-radius:16px;box-shadow:0 2px 20px rgba(0,0,0,.08);overflow:hidden;display:none;margin-top:4px}
.result-card.show{display:block}
.card-header{background:#722f37;color:#fff;padding:18px;position:relative}
.card-header h2{font-size:20px;font-weight:700;line-height:1.3;margin-bottom:4px}
.card-header .winery-name{font-size:14px;opacity:.85}
.card-badge{position:absolute;top:14px;right:14px;background:rgba(255,255,255,.2);border-radius:20px;padding:5px 12px;font-size:12px;font-weight:600}
.card-body{padding:18px}
.rating-row{display:flex;align-items:center;gap:12px;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid #f0eee8}
.rating-score{font-size:36px;font-weight:800;color:#2d2d2d;line-height:1}
.rating-stars{font-size:20px;letter-spacing:2px}
.rating-sub{font-size:13px;color:#888}
.price-row{display:flex;gap:16px;margin-bottom:16px}
.price-box{flex:1;background:#f8f6f2;border-radius:10px;padding:12px;text-align:center}
.price-box .label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
.price-box .value{font-size:20px;font-weight:700;color:#2d2d2d}
.critic-scores{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
.critic-score{flex:1;min-width:70px;background:#f8f6f2;border-radius:8px;padding:8px;text-align:center}
.critic-score .label{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.4px}
.critic-score .value{font-size:16px;font-weight:700;color:#2d2d2d}
.critic-score .source{font-size:10px;color:#999}
.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
.detail-item{background:#f8f6f2;border-radius:8px;padding:10px 12px}
.detail-item .label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.4px;margin-bottom:2px}
.detail-item .value{font-size:15px;font-weight:600;color:#2d2d2d}
.desc{font-size:13px;color:#555;line-height:1.5;margin-bottom:14px;padding:10px 12px;background:#f8f6f2;border-radius:8px}
.no-results{text-align:center;padding:40px 20px;color:#999;font-size:15px;display:none}
.api-notice{background:#fdf6ec;border:1px solid #f0e4d0;border-radius:8px;padding:12px;font-size:13px;color:#866;margin-bottom:12px;line-height:1.5}
.footer{text-align:center;padding:20px 0 10px;font-size:11px;color:#bbb}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div><h1>🍷 Wine Lens</h1></div>
  </div>
  <div class="api-notice" id="apiNotice">🔑 <strong>Gemini API key needed</strong> (free, 60 req/min). Get at <a href="https://aistudio.google.com/apikey" target="_blank" style="color:#722f37">aistudio.google.com/apikey</a></div>
  <div class="tabs">
    <button class="tab active" onclick="switchTab('scan')">📸 Scan Label</button>
    <button class="tab" onclick="switchTab('search')">🔍 Search</button>
  </div>
  <div id="tab-scan">
    <div class="camera-area" id="cameraArea" onclick="if(!stream)initCamera()">
      <video id="video" autoplay playsinline></video>
      <canvas id="canvas" style="display:none"></canvas>
      <img id="preview" style="display:none">
      <div class="camera-placeholder" id="placeholder">
        <div style="font-size:48px;margin-bottom:8px">📷</div>
        <div>Tap to start camera</div>
      </div>
      <div class="overlay-btns" id="overlayBtns" style="display:none">
        <button class="btn-capture" id="btnCapture" onclick="capturePhoto()">📸 Capture</button>
        <button class="btn-retake" id="btnRetake" style="display:none" onclick="retakePhoto()">↩ Retake</button>
        <button class="btn-done" id="btnDone" style="display:none" disabled onclick="analyzeWine()">🔍 Analyze</button>
      </div>
    </div>
  </div>
  <div id="tab-search" style="display:none">
    <div class="search-box">
      <input id="searchInput" type="text" placeholder="e.g. Penfolds Grange 2018" autocomplete="off">
      <button id="searchBtn" onclick="searchWine()">🔍</button>
    </div>
  </div>
  <div class="status" id="status">Ready</div>
  <div class="result-card" id="resultCard">
    <div class="card-header">
      <h2 id="wineName"></h2>
      <div class="winery-name" id="wineryName"></div>
      <div class="card-badge" id="wineType"></div>
    </div>
    <div class="card-body">
      <div class="rating-row">
        <div><div class="rating-score" id="ratingScore"></div></div>
        <div><div class="rating-stars" id="ratingStars"></div><div class="rating-sub" id="ratingCount"></div></div>
      </div>
      <div class="price-row" id="priceRow">
        <div class="price-box"><div class="label">💰 Price</div><div class="value" id="winePrice">—</div></div>
        <div class="price-box"><div class="label">🏆 Rating</div><div class="value" id="vivRating">—</div></div>
      </div>
      <div class="critic-scores" id="criticScores">
        <div class="critic-score"><div class="label">Wine Spectator</div><div class="value" id="wsScore">—</div><div class="source" id="wsSource"></div></div>
        <div class="critic-score"><div class="label">Robert Parker</div><div class="value" id="rpScore">—</div></div>
        <div class="critic-score"><div class="label">James Suckling</div><div class="value" id="jsScore">—</div></div>
      </div>
      <div class="detail-grid">
        <div class="detail-item"><div class="label">🍇 Grape</div><div class="value" id="grapeVal">—</div></div>
        <div class="detail-item"><div class="label">📅 Vintage</div><div class="value" id="vintageVal">—</div></div>
        <div class="detail-item"><div class="label">🌍 Region</div><div class="value" id="regionVal">—</div></div>
        <div class="detail-item"><div class="label">🍷 Alc.</div><div class="value" id="alcoholVal">—</div></div>
      </div>
      <div class="desc" id="wineDesc" style="display:none"></div>
      <div style="font-size:11px;color:#bbb;text-align:center;padding-top:8px">Data via Vivino</div>
    </div>
  </div>
  <div class="no-results" id="noResults">No wine found. Try a different name.</div>
  <div class="footer">🍷 Wine Lens · Gemini AI + Vivino</div>
</div>
<script>
let stream=null,capturedBlob=null,currentTab='scan';
function switchTab(t){
  currentTab=t;
  document.querySelectorAll('.tab')[0].classList.toggle('active',t==='scan');
  document.querySelectorAll('.tab')[1].classList.toggle('active',t==='search');
  document.getElementById('tab-scan').style.display=t==='scan'?'block':'none';
  document.getElementById('tab-search').style.display=t==='search'?'block':'none';
  hideResult();
  if(t==='scan')initCamera();else stopCamera();
}
async function initCamera(){
  try{
    if(!stream){
      stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:1920}}});
      document.getElementById('video').srcObject=stream;
    }
    document.getElementById('video').style.display='block';
    document.getElementById('preview').style.display='none';
    document.getElementById('placeholder').style.display='none';
    document.getElementById('btnCapture').style.display='inline-block';
    document.getElementById('btnRetake').style.display='none';
    document.getElementById('btnDone').style.display='none';
    document.getElementById('overlayBtns').style.display='flex';
    capturedBlob=null;
  }catch(e){
    document.getElementById('placeholder').innerHTML='<div style="font-size:32px;margin-bottom:8px">📷</div><div>Camera not available<br><small style="color:#999">'+e.message+'</small><br><button onclick="switchTab(\\'search\\')" style="margin-top:8px;padding:8px 16px;border:1px solid #722f37;border-radius:8px;background:white;color:#722f37;cursor:pointer">Try Search instead</button></div>';
  }
}
function stopCamera(){if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}}
function capturePhoto(){
  const v=document.getElementById('video'),c=document.getElementById('canvas');
  c.width=v.videoWidth;c.height=v.videoHeight;
  c.getContext('2d').drawImage(v,0,0);
  document.getElementById('preview').src=c.toDataURL('image/jpeg',0.85);
  document.getElementById('preview').style.display='block';
  document.getElementById('video').style.display='none';
  document.getElementById('btnCapture').style.display='none';
  document.getElementById('btnRetake').style.display='inline-block';
  document.getElementById('btnDone').style.display='inline-block';
  document.getElementById('btnDone').disabled=false;
  setStatus('📸 Tap "Analyze"');
  capturedBlob=c.toDataURL('image/jpeg',0.85);
}
function retakePhoto(){capturedBlob=null;document.getElementById('preview').style.display='none';document.getElementById('video').style.display='block';document.getElementById('btnCapture').style.display='inline-block';document.getElementById('btnRetake').style.display='none';document.getElementById('btnDone').style.display='none';hideResult();setStatus('Ready');}
function setStatus(m){document.getElementById('status').innerHTML=m;}
function hideResult(){document.getElementById('resultCard').classList.remove('show');document.getElementById('noResults').style.display='none';}
async function analyzeWine(){
  const k=localStorage.getItem('wine_gemini_key');
  if(!k){const p=prompt('Enter your Gemini API key (free at aistudio.google.com/apikey):');if(!p){setStatus('Key needed');document.getElementById('btnDone').disabled=false;return;}localStorage.setItem('wine_gemini_key',p);}
  setStatus('<span class="spinner"></span>Reading label with AI…');
  hideResult();document.getElementById('btnDone').disabled=true;
  try{
    const b64=capturedBlob.split(',')[1]||capturedBlob;
    const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key='+localStorage.getItem('wine_gemini_key'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:'Extract wine info as JSON: {"wine_name":"...","winery":"...","vintage":0,"grape":"...","region":"...","type":"Red/White/Rose/Sparkling/Dessert"}. Return raw JSON only, no markdown.'},{inline_data:{mime_type:'image/jpeg',data:b64}}]}]})});
    if(!r.ok)throw new Error('Gemini '+r.status);
    const d=await r.json(),txt=d.candidates?.[0]?.content?.parts?.[0]?.text||'',m=txt.match(/\\{[\\s\\S]*\\}/);
    if(!m)throw new Error('Could not parse AI response');
    const ld=JSON.parse(m[0]);if(ld.error)throw new Error(ld.error);
    const q=[ld.wine_name,ld.winery,ld.vintage].filter(Boolean).join(' ');
    setStatus('<span class="spinner"></span>Looking up: '+q+'…');
    await lookupVivino(q);
  }catch(e){setStatus('❌ '+e.message);document.getElementById('btnDone').disabled=false;}
}
async function searchWine(){
  const q=document.getElementById('searchInput').value.trim();if(!q)return;
  hideResult();setStatus('<span class="spinner"></span>Searching…');
  document.getElementById('searchBtn').disabled=true;
  try{await lookupVivino(q);}catch(e){setStatus('❌ '+e.message);}
  finally{document.getElementById('searchBtn').disabled=false;}
}
async function lookupVivino(query){
  const r=await fetch('/api/search-vivino?q='+encodeURIComponent(query));
  if(!r.ok)throw new Error('Search failed: '+r.status);
  const d=await r.json();
  if(!d||!d.url){document.getElementById('noResults').style.display='block';setStatus('No results');return;}
  setStatus('<span class="spinner"></span>Getting details…');
  const dr=await fetch('/api/get-vivino-wine?url='+encodeURIComponent(d.url));
  if(!dr.ok)throw new Error('Details failed');
  renderWineCard(await dr.json(),query);
  setStatus('✅ Done');
}
function renderWineCard(d,q){
  document.getElementById('wineName').textContent=d.name||q;
  document.getElementById('wineryName').textContent=d.winery||'';
  document.getElementById('wineType').textContent=d.type||'Wine';
  document.getElementById('ratingScore').textContent=d.rating?d.rating.toFixed(1):'—';
  document.getElementById('ratingStars').textContent=getStars(d.rating||0);
  document.getElementById('ratingCount').textContent=d.reviews?d.reviews.toLocaleString()+' ratings':'No ratings';
  document.getElementById('vivRating').textContent=d.rating?d.rating.toFixed(1)+' ⭐':'—';
  document.getElementById('winePrice').textContent=d.price?'$'+d.price:'—';
  document.getElementById('wsScore').textContent=d.ws||'—';
  document.getElementById('rpScore').textContent=d.rp||'—';
  document.getElementById('jsScore').textContent=d.js||'—';
  document.getElementById('grapeVal').textContent=d.grapes||'—';
  document.getElementById('vintageVal').textContent=d.vintage||'NV';
  document.getElementById('regionVal').textContent=d.region||'—';
  document.getElementById('alcoholVal').textContent=d.alcohol||'—';
  const de=document.getElementById('wineDesc');
  if(d.description){de.textContent=d.description;de.style.display='block';}else de.style.display='none';
  document.getElementById('resultCard').classList.add('show');
  document.getElementById('noResults').style.display='none';
  document.getElementById('btnDone').disabled=false;
}
function getStars(r){let s='';for(let i=0;i<5;i++){if(r>=i+.75)s+='★';else if(r>=i+.25)s+='⯨';else s+='☆';}return s;}
document.addEventListener('DOMContentLoaded',()=>{initCamera();document.getElementById('searchInput').addEventListener('keydown',e=>{if(e.key==='Enter')searchWine();});});
</script>
</body>
</html>`;

// ── Vivino Scraper ──
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function searchWineOnVivino(query) {
  const resp = await fetch('https://www.vivino.com/search/wines?q=' + encodeURIComponent(query), {
    headers: { 'User-Agent': UA }
  });
  const html = await resp.text();
  // Try multiple patterns to find wine links
  const patterns = [
    /href="(https:\/\/www\.vivino\.com\/\w+\/[^"]+\/w\/\d+[^"]*)"/,
    /href="(\/en\/[^"]+\/w\/\d+[^"]*)"/,
    /\/w\/\d+/,
    /<a[^>]*href="([^"]+)"[^>]*class="[^"]*link[^"]*"[^>]*>/
  ];
  for (const pat of patterns) {
    const m = html.match(pat);
    if (m) {
      let url = m[1];
      if (url.startsWith('/')) url = 'https://www.vivino.com' + url;
      if (url.match(/\/w\/\d+/)) return url;
    }
  }
  // Last resort: find any URL containing /w/
  const wineMatch = html.match(/https?:\/\/[^"']*\/w\/\d+[^"' ]*/);
  return wineMatch ? wineMatch[0] : null;
}

async function getWineDetails(wineUrl) {
  const resp = await fetch(wineUrl, { headers: { 'User-Agent': UA } });
  const html = await resp.text();

  // Extract JSON-LD for most data (most reliable)
  const ldMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/s);
  let ld = {};
  if (ldMatch) {
    try { ld = JSON.parse(ldMatch[1].trim()); } catch(e) { ld = {}; }
  }

  const name = ld.name || '';
  // Winery - try from JSON-LD brand/manufacturer
  let winery = '';
  if (ld.brand) winery = typeof ld.brand === 'string' ? ld.brand : ld.brand.name || '';
  if (!winery && ld.manufacturer) winery = typeof ld.manufacturer === 'string' ? ld.manufacturer : ld.manufacturer.name || '';
  if (!winery) {
    const wm = html.match(/wineries\/([^"\/]+)/);
    if (wm) winery = wm[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
  const rating = ld.aggregateRating ? parseFloat(ld.aggregateRating.ratingValue || 0) : 0;
  const reviews = ld.aggregateRating ? parseInt(ld.aggregateRating.ratingCount || 0) : 0;

  // Price from offers
  let price = '';
  if (ld.offers && ld.offers.length > 0) {
    const offer = ld.offers[0];
    price = offer.lowPrice || offer.price || '';
  }

  // Extract wine type, grapes, region from the info table
  let type = '', grapes = '', region = '', alcohol = '', vintage = '';

  // Try to find "Wine style" text
  const wineStyleMatch = html.match(/Wine style[^<]*<[^>]*>[^<]*<[^>]*>([^<]+)</i);
  if (wineStyleMatch) type = wineStyleMatch[1].trim();

  // Grapes
  const grapesMatch = html.match(/Grapes[^<]*<[^>]*>[^<]*<[^>]*>([^<]+)</i) || html.match(/<td[^>]*>[^<]*Grapes[^<]*<\/td>\s*<td[^>]*>([^<]+)</i);
  if (grapesMatch) grapes = grapesMatch[1].trim();

  // Region
  const regionMatch = html.match(/Region[^<]*<[^>]*>[^<]*<[^>]*>([^<]+)</i) || html.match(/Australia\s*\/\s*([^<]+)/);
  if (regionMatch) region = regionMatch[1].trim();

  // Alcohol
  const alcMatch = html.match(/Alcohol content[^<]*<[^>]*>[^<]*<[^>]*>([^<]+)/i);
  if (alcMatch) alcohol = alcMatch[1].trim();

  // Vintage from JSON-LD or page
  const vintageMatch = html.match(/(?:Vintage|year)[^<]*<[^>]*>[^<]*<[^>]*>(\d{4})/i) || html.match(/\?year=(\d{4})/);
  if (vintageMatch) vintage = vintageMatch[1];

  // Critic scores
  let ws = '', rp = '', js = '';
  const wsM = html.match(/Wine Spectator[^<]*<[^>]*>[^<]*<[^>]*>\s*(\d+)/i);
  if (wsM) ws = wsM[1];
  const rpM = html.match(/Robert Parker[^<]*<[^>]*>[^<]*<[^>]*>\s*(\d+)/i);
  if (rpM) rp = rpM[1];
  const jsM = html.match(/James Suckling[^<]*<[^>]*>[^<]*<[^>]*>\s*(\d+)/i);
  if (jsM) js = jsM[1];

  // Description from JSON-LD
  const description = ld.description || '';

  return { name, winery, rating, reviews, price, grapes, region, alcohol, type, vintage, description, ws, rp, js };
}

// ── Worker Entry ──
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // API: Search Vivino
    if (path === '/api/search-vivino') {
      const q = url.searchParams.get('q');
      if (!q) return new Response(JSON.stringify({ error: 'Missing q' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      try {
        const result = await searchWineOnVivino(q);
        if (!result) return new Response(JSON.stringify({ error: 'No results' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        return new Response(JSON.stringify({ url: result }), { headers: { 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // API: Get wine details
    if (path === '/api/get-vivino-wine') {
      const wineUrl = url.searchParams.get('url');
      if (!wineUrl) return new Response(JSON.stringify({ error: 'Missing url' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      try {
        const details = await getWineDetails(wineUrl);
        return new Response(JSON.stringify(details), { headers: { 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // Serve HTML for everything else
    return new Response(HTML, { headers: { 'Content-Type': 'text/html;charset=utf-8' } });
  }
}