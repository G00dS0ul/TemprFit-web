const fs = require('fs');

const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/api/pods/route.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "const { name, description, icon } = body;",
  "const { name, description, icon, image, rewardXP, rewardType } = body;"
);

content = content.replace(
  "icon,",
  "icon,\n      customImage: image || null,\n      challenge: {\n        targetVolume: 50000,\n        currentVolume: 0,\n        rewardXP: parseInt(rewardXP) || 2500,\n        rewardType: rewardType || 'shared_pool'\n      },"
);

content = content.replace(
  "description: p.description,",
  "description: p.description,\n      customImage: p.customImage,"
);

fs.writeFileSync(path, content, 'utf8');
