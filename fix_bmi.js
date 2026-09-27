const fs = require('fs');

const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/api/bmi/route.js';
let content = fs.readFileSync(path, 'utf8');

// Replace the imports and auth check for POST
content = content.replace(
  "import { verifyToken } from '@/lib/auth'",
  "import { getSessionUser } from '@/lib/auth'"
);

content = content.replace(
  "const token = req.cookies.get('token')?.value\n    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })\n\n    const decoded = verifyToken(token)\n    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })",
  "const sessionUser = await getSessionUser();\n    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });"
);

content = content.replace(
  "user: decoded.id,",
  "user: sessionUser._id,"
);
content = content.replace(
  "user: decoded.id,",
  "user: sessionUser._id,"
);

// Do it again for GET which might have the same issue
content = content.replace(
  "const token = req.cookies.get('token')?.value\n    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })",
  "const sessionUser = await getSessionUser();\n    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });"
);
content = content.replace(
  "const decoded = verifyToken(token)\n    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })",
  ""
);
content = content.replace(
  "user: decoded.id",
  "user: sessionUser._id"
);

fs.writeFileSync(path, content, 'utf8');
