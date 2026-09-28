const fs = require('fs');

const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/api/pods/[id]/join/route.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "import jwt from 'jsonwebtoken';",
  "import { getSessionUser } from '@/lib/auth';"
);

content = content.replace(
  "const token = cookies().get('token')?.value;\n    if (!token) {\n      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });\n    }\n    const decoded = jwt.verify(token, process.env.JWT_SECRET);\n    if (!decoded || !decoded.userId) {\n      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });\n    }",
  "const sessionUser = await getSessionUser();\n    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });"
);

content = content.replace(
  "const isMember = pod.members.some(id => id.toString() === decoded.userId);",
  "const isMember = pod.members.some(id => id.toString() === sessionUser._id.toString());"
);

content = content.replace(
  "pod.members = pod.members.filter(id => id.toString() !== decoded.userId);",
  "pod.members = pod.members.filter(id => id.toString() !== sessionUser._id.toString());"
);

content = content.replace(
  "pod.members.push(decoded.userId);",
  "pod.members.push(sessionUser._id);"
);

fs.writeFileSync(path, content, 'utf8');
