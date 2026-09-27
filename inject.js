const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/dashboard/page.js';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('XPTransferWidget')) {
  content = content.replace(
    "import styles from './page.module.css';", 
    "import XPTransferWidget from '@/components/XPTransferWidget';\nimport styles from './page.module.css';"
  );
  
  content = content.replace(
    "<WaterTracker />",
    "<div style={{ marginBottom: '24px' }}>\n            <XPTransferWidget user={user} onTransferSuccess={(newXp) => setUser({ ...user, xp: newXp })} />\n          </div>\n          <WaterTracker />"
  );
  
  fs.writeFileSync(path, content, 'utf8');
  console.log('Injected XPTransferWidget');
} else {
  console.log('Already injected');
}
