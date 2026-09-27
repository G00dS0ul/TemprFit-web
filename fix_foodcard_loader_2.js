const fs = require('fs');

const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/components/FoodCard/index.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /<Plus size=\{15\} \/> \{logging \? 'Adding[^']*' : 'Log'\}/g,
  "{logging ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={15} />} {logging ? 'Adding...' : 'Log'}"
);

fs.writeFileSync(path, content, 'utf8');
