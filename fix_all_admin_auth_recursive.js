const fs = require('fs');
const path = require('path');

const OLD_AUTH_BLOCK = "if (!user || (user.role !== 'admin' && !(await verifyAdminToken()))) {";
const NEW_AUTH_BLOCK = "const isAdmin = (user && user.role === 'admin') || (await verifyAdminToken());\n  if (!isAdmin) {";

function fixAuthInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixAuthInDir(fullPath);
    } else if (fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(OLD_AUTH_BLOCK)) {
        content = content.replace(OLD_AUTH_BLOCK, NEW_AUTH_BLOCK);
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log("Fixed auth in: " + fullPath);
      }
    }
  }
}

fixAuthInDir('C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/api/admin');
