const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/admin/page.module.css';
let content = fs.readFileSync(path, 'utf8');

content += "\n.chartsGrid {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 24px;\n  margin-top: 24px;\n}\n\n@media (max-width: 768px) {\n  .chartsGrid {\n    grid-template-columns: 1fr;\n  }\n}\n";

fs.writeFileSync(path, content, 'utf8');
console.log("Added .chartsGrid CSS");
