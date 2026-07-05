import { readFileSync } from 'fs'
const places = JSON.parse(readFileSync('src/data/places.json','utf8'))
const hav=(a,b)=>{const R=6371000,r=x=>x*Math.PI/180;const dφ=r(b.lat-a.lat),dλ=r(b.lon-a.lon);const x=Math.sin(dφ/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dλ/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
// core search token per place id (what OSM would likely name it)
const CORE = {
 'california-burrito-gachibowli':'California Burrito','california-burrito-madhapur':'California Burrito','california-burrito-kondapur':'California Burrito','california-burrito-financial-district':'California Burrito',
 'hyderabad-spice-kitchen':'Spice Kitchen','haze-gachibowli':'Haze','buffalo-wild-wings':'Buffalo Wild Wings','underdogs':'Underdogs','brew-house':'Brew House','fishermans-wharf':'Fisherman','patiala-plate':'Patiala','biryani-times-madhapur':'Biryani Times',
 'udipi-upahar-gachibowli':'Udipi Upahar','udipi-upahar-manikonda':'Udipi Upahar','bawarchi-madhapur':'Bawarchi','mehfil-madhapur':'Mehfil','ala-liberty':'Liberty','good-vibes-only':'Good Vibes','little-italy':'Little Italy','fire-water':'Firewater',
 'niloufer-lakdikapul':'Nimrah|Niloufer','niloufer-bhooja':'Niloufer','sattva-knowledge-city':'Knowledge City','sattva-knowledge-park':'Knowledge Park','sarath-city':'Sarath City','inorbit':'Inorbit','gvk-one':'GVK One',
 'karachi-bakery':'Karachi Bakery','birla-mandir':'Birla Mandir','salar-jung':'Salar Jung','shah-ghouse':'Shah Ghouse','mahendra-hills':'Mahendra','santosh-dhaba-pan-bazar':'Santosh','taj-falaknuma':'Falaknuma'
}
const ENDPOINT='https://overpass-api.de/api/interpreter'
for (const p of places) {
  const core = CORE[p.id]; if(!core) continue
  const rx = core.replace(/["\\]/g,'.')
  const query=`[out:json][timeout:25];(nwr["name"~"${rx}",i](17.20,78.20,17.62,78.72););out center 40;`
  let hits=[]
  try{
    const res=await fetch(ENDPOINT,{method:'POST',body:'data='+encodeURIComponent(query),headers:{'Content-Type':'application/x-www-form-urlencoded','User-Agent':'gedi-map/1.0 (student project; contact saix0x0)'}})
    const j=await res.json()
    hits=(j.elements||[]).map(e=>{const lat=e.lat??e.center?.lat,lon=e.lon??e.center?.lon;return lat&&lon?{lat,lon,name:e.tags?.name||''}:null}).filter(Boolean)
  }catch(e){console.log('ERR',p.id,e.message);await new Promise(r=>setTimeout(r,3000));continue}
  if(!hits.length){console.log(`NONE   ${p.name.slice(0,32)}`);await new Promise(r=>setTimeout(r,3000));continue}
  hits.forEach(h=>h.d=hav({lat:p.lat,lon:p.lng},h))
  hits.sort((a,b)=>a.d-b.d)
  const n=hits[0]
  const flag = n.d>800?'*** MOVE':'ok'
  console.log(`${flag.padEnd(9)}${String(Math.round(n.d)).padStart(6)}m  ${p.name.slice(0,30).padEnd(31)} -> ${n.lat.toFixed(5)},${n.lon.toFixed(5)} [${n.name.slice(0,26)}] (${hits.length} hits)`)
  await new Promise(r=>setTimeout(r,3000))
}
