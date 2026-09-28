const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/api/admin/users/[id]/edit/route.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "const { username, avatarUrl, password } = await req.json();",
  "const { username, avatarUrl, password, plan } = await req.json();"
);

content = content.replace(
  "if (password && password.trim() !== '') {\n      const salt = await bcrypt.genSalt(10);\n      targetUser.password = await bcrypt.hash(password, salt);\n    }",
  "if (password && password.trim() !== '') {\n      const salt = await bcrypt.genSalt(10);\n      targetUser.password = await bcrypt.hash(password, salt);\n    }\n\n    if (plan !== undefined && ['free', 'pro', 'max'].includes(plan)) {\n      targetUser.plan = plan;\n    }"
);

content = content.replace(
  "username: targetUser.username,\n      avatarUrl: targetUser.avatarUrl\n    } });",
  "username: targetUser.username,\n      avatarUrl: targetUser.avatarUrl,\n      plan: targetUser.plan\n    } });"
);

fs.writeFileSync(path, content, 'utf8');
