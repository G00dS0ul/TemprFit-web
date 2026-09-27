const fs = require('fs');

const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/api/auth/admin/route.js';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('generateToken')) {
  content = content.replace(
    "import SystemConfig from '@/models/SystemConfig';",
    "import SystemConfig from '@/models/SystemConfig';\nimport { generateToken } from '@/lib/auth';"
  );
  
  content = content.replace(
    "response.cookies.set('admin_token', 'true', {",
    "const adminJwt = generateToken({ role: 'admin' });\n    response.cookies.set('admin_token', adminJwt, {"
  );

  fs.writeFileSync(path, content, 'utf8');
}
