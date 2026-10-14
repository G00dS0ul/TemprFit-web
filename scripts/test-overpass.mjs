const lat = 6.519862;
const lng = 3.253626;
const radius = 10000;
const q = `[out:json][timeout:25];(node["leisure"="fitness_centre"](around:${radius},${lat},${lng});node["leisure"="sports_centre"](around:${radius},${lat},${lng}););out center 40;`;

const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(q);
fetch(url, { headers: { 'User-Agent': 'TemprFit-Gym-App/1.0' } })
  .then(async (r) => {
    const text = await r.text();
    console.log('HTTP status:', r.status);
    console.log('Body snippet:', text.slice(0, 300));
  })
  .catch((err) => console.error('Fetch error:', err.message));
