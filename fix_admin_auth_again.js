const fs = require('fs');

const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/api/auth/admin/route.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "import { generateToken } from '@/lib/auth';",
  "import { signToken } from '@/lib/auth';"
);

content = content.replace(
  "const adminJwt = generateToken({ role: 'admin' });",
  "const adminJwt = signToken({ role: 'admin', userId: 'admin' });"
);

fs.writeFileSync(path, content, 'utf8');
