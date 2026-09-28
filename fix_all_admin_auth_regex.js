const fs = require('fs');
const path = require('path');

function fixAuthInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixAuthInDir(fullPath);
    } else if (fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const regex = /if\s*\(\s*!(\w+)\s*\|\|\s*\(\s*\1\.role\s*!==\s*'admin'\s*&&\s*!\(\s*await\s+verifyAdminToken\(\)\s*\)\s*\)\s*\)\s*\{/g;
      
      if (regex.test(content)) {
        content = content.replace(regex, (match, p1) => {
          return `const isAdmin = (${p1} && ${p1}.role === 'admin') || (await verifyAdminToken());\n  if (!isAdmin) {`;
        });
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log("Regex fixed auth in: " + fullPath);
      }
    }
  }
}

fixAuthInDir('C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/api/admin');
