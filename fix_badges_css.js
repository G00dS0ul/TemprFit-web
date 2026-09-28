const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/badges/page.module.css';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));",
  "grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));"
);

fs.writeFileSync(path, content, 'utf8');
