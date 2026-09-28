const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/api/admin/stats/route.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "if (!user || (user.role !== 'admin' && !(await verifyAdminToken()))) {",
  "const isAdmin = (user && user.role === 'admin') || (await verifyAdminToken());\n  if (!isAdmin) {"
);

fs.writeFileSync(path, content, 'utf8');
