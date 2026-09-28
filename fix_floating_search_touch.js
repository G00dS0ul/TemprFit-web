const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/components/FloatingSearch/FloatingSearch.module.css';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  ".fab {",
  ".fab {\n  touch-action: none;"
);

fs.writeFileSync(path, content, 'utf8');
