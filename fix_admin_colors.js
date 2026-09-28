const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // Replace hardcoded "white" text colors in inputs or text elements
      if (content.includes("color: 'white'")) {
        content = content.replace(/color:\s*'white'/g, "color: 'var(--color-text)'");
        changed = true;
      }
      
      // Look for the specific ternary in users/page.js
      if (content.includes("user.isBanned ? '#ef4444' : 'white'")) {
        content = content.replace(/user\.isBanned \? '#ef4444' : 'white'/g, "user.isBanned ? '#ef4444' : 'var(--color-text)'");
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log("Updated: " + fullPath);
      }
    }
  }
}

processDir('C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/admin');
