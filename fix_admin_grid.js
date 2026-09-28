const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/admin/page.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>",
  "<div className={styles.chartsGrid}>"
);

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed inline grid");
