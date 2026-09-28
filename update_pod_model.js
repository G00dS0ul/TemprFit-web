const fs = require('fs');

const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/models/Pod.js';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('customImage')) {
  content = content.replace(
    "icon: { type: String, required: true }, // lucide icon name",
    "icon: { type: String, required: true }, // lucide icon name\n  customImage: { type: String, default: null }, // user uploaded image for pod"
  );
  
  content = content.replace(
    "rewardXP: { type: Number, default: 2500 },",
    "rewardXP: { type: Number, default: 2500 },\n    rewardType: { type: String, enum: ['winner_takes_all', 'shared_pool'], default: 'shared_pool' },"
  );

  fs.writeFileSync(path, content, 'utf8');
}
