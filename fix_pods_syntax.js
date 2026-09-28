const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/api/pods/route.js';
let content = fs.readFileSync(path, 'utf8');

const badSyntax = `    const { name, description, icon,
      customImage: image || null,
      challenge: {
        targetVolume: 50000,
        currentVolume: 0,
        rewardXP: parseInt(rewardXP) || 2500,
        rewardType: rewardType || 'shared_pool'
      }, image, rewardXP, rewardType } = body;`;

const goodSyntax = `    const { name, description, icon, customImage, challenge, image, rewardXP, rewardType } = body;`;

content = content.replace(badSyntax, goodSyntax);
fs.writeFileSync(path, content, 'utf8');
