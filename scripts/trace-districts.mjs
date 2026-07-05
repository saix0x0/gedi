// One-time: trace district border edges along real roads via OSRM, bake to JSON.
import { writeFileSync } from 'fs'
const CORNERS = {
  GACHIBOWLI: [[78.30,17.46],[78.36,17.465],[78.385,17.44],[78.38,17.40],[78.34,17.38],[78.30,17.40]],
  KONDAPUR: [[78.36,17.465],[78.34,17.50],[78.40,17.50],[78.41,17.47],[78.385,17.44]],
  MADHAPUR: [[78.385,17.44],[78.41,17.47],[78.44,17.46],[78.445,17.435],[78.42,17.415],[78.39,17.415]],
  KUKATPALLY: [[78.34,17.50],[78.36,17.55],[78.44,17.545],[78.44,17.49],[78.40,17.50]],
  'JUBILEE HILLS': [[78.39,17.415],[78.42,17.415],[78.445,17.435],[78.46,17.42],[78.44,17.40],[78.41,17.395]],
  'BANJARA HILLS': [[78.41,17.395],[78.44,17.40],[78.46,17.42],[78.47,17.40],[78.45,17.38],[78.42,17.375]],
  'CITY CENTER': [[78.46,17.42],[78.445,17.435],[78.44,17.46],[78.47,17.47],[78.50,17.44],[78.50,17.40],[78.47,17.40]],
  SECUNDERABAD: [[78.44,17.46],[78.44,17.49],[78.52,17.50],[78.54,17.45],[78.50,17.44],[78.47,17.47]],
  'OLD CITY': [[78.42,17.375],[78.45,17.38],[78.47,17.40],[78.50,17.40],[78.51,17.35],[78.46,17.31],[78.41,17.33]],
  'HITEC CITY': [[78.372,17.452],[78.392,17.458],[78.398,17.443],[78.382,17.436],[78.370,17.443]],
  MANIKONDA: [[78.372,17.408],[78.400,17.410],[78.406,17.390],[78.378,17.386]],
  BEGUMPET: [[78.448,17.452],[78.470,17.455],[78.474,17.438],[78.452,17.435]],
  AMEERPET: [[78.438,17.445],[78.458,17.446],[78.460,17.430],[78.440,17.428]],
}
// Cache each undirected edge so shared borders between adjacent districts are identical
const cache = new Map()
const key = (a,b) => JSON.stringify([`${a}`,`${b}`].sort())
async function edge(a,b) {
  const k = key(a,b)
  if (!cache.has(k)) {
    let seg = [a,b]
    try {
      const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${a[0]},${a[1]};${b[0]},${b[1]}?overview=full&geometries=geojson`)
      const j = await r.json()
      if (j.routes?.[0]) seg = j.routes[0].geometry.coordinates
    } catch (e) { console.error('edge failed', a, b, e.message) }
    await new Promise(r=>setTimeout(r,300))
    cache.set(k, { from: `${a}`, seg })
  }
  const { from, seg } = cache.get(k)
  return from === `${a}` ? seg : [...seg].reverse()
}
const out = {}
for (const [name, ring] of Object.entries(CORNERS)) {
  let traced = []
  for (let i=0;i<ring.length;i++) traced.push(...await edge(ring[i], ring[(i+1)%ring.length]))
  traced = traced.map(c=>[+c[0].toFixed(5),+c[1].toFixed(5)]).filter((c,i,arr)=>!i||c[0]!==arr[i-1][0]||c[1]!==arr[i-1][1])
  out[name] = traced
  console.log(name, traced.length, 'pts')
}
writeFileSync('src/districts-traced.json', JSON.stringify(out))
console.log('written')
