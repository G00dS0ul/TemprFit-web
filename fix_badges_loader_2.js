const fs = require('fs');

const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/badges/page.js';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('Loader2')) {
  content = content.replace(
    /import \{ Trophy, Star, CheckCircle, Lock, Shield \} from 'lucide-react';/,
    "import { Trophy, Star, CheckCircle, Lock, Shield, Loader2 } from 'lucide-react';"
  );
  
  content = content.replace(
    /<button className=\{styles\.buyBtn\} onClick=\{\(\) => handleBuy\(item\.value, item\.cost\)\} disabled=\{buying \|\| \!canAfford\}>/g,
    "<button className={styles.buyBtn} onClick={() => handleBuy(item.value, item.cost)} disabled={buying || !canAfford} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>"
  );
  
  content = content.replace(
    /\{buying \? 'Processing\.\.\.' : 'Buy for ' \+ item\.cost \+ ' XP'\}/g,
    "{buying ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null} {buying ? 'Processing...' : 'Buy for ' + item.cost + ' XP'}"
  );

  fs.writeFileSync(path, content, 'utf8');
}
