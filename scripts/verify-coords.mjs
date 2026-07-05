import { readFileSync } from 'fs'
const places = JSON.parse(readFileSync('src/data/places.json','utf8'))
const HYD = { lat: 17.42, lon: 78.42 }
const hav = (a,b) => { const R=6371000,r=x=>x*Math.PI/180; const dφ=r(b.lat-a.lat),dλ=r(b.lon-a.lon); const x=Math.sin(dφ/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dλ/2)**2; return 2*R*Math.asin(Math.sqrt(x)) }
// clean the display name into a search query
const q = p => p.name.replace(/—.*$/,'').replace(/\(.*?\)/g,'').trim() + ', ' + p.area.split('·')[0].split('/')[0].trim() + ', Hyderabad'
for (const p of places) {
  const query = q(p)
  let best = null
  try {
    const u = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1&lat=${HYD.lat}&lon=${HYD.lon}`
    const j = await (await fetch(u,{headers:{'User-Agent':'gedi-map/1.0'}})).json()
    const f = j.features?.[0]
    if (f) { const [lon,lat]=f.geometry.coordinates; best={lat,lon,street:f.properties.street||f.properties.name||'',city:f.properties.city||f.properties.county||''} }
  } catch(e){ best={err:e.message} }
  await new Promise(r=>setTimeout(r,600))
  if (!best) { console.log(`NO_HIT   ${p.name}`); continue }
  if (best.err){ console.log(`ERR      ${p.name} ${best.err}`); continue }
  const d = Math.round(hav({lat:p.lat,lon:p.lng},best))
  const inHyd = best.lat>17.2&&best.lat<17.6&&best.lon>78.2&&best.lon<78.7
  console.log(`${d>1500?'FAR':'ok '} ${String(d).padStart(5)}m ${p.name.slice(0,30).padEnd(31)} photon:${best.lat.toFixed(4)},${best.lon.toFixed(4)} ${inHyd?'':'(OUT!)'} [${(best.street||'').slice(0,28)}]`)
}
