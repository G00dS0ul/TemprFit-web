const fs = require('fs');

const pagePath = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/pods/page.js';
let page = fs.readFileSync(pagePath, 'utf8');
if (!page.includes('Image URL')) {
  page = page.replace(
    "<select value={newPodIcon} onChange={e => setNewPodIcon(e.target.value)} className={styles.input}>",
    "<label className={styles.label}>Image URL (optional)</label>\n            <input type='url' className={styles.input} placeholder='https://...' value={newPodImage} onChange={e => setNewPodImage(e.target.value)} />\n            <label className={styles.label}>Reward XP (deducted from your balance)</label>\n            <input type='number' className={styles.input} placeholder='0' value={newPodReward} onChange={e => setNewPodReward(e.target.value)} />\n            <label className={styles.label}>Icon</label>\n            <select value={newPodIcon} onChange={e => setNewPodIcon(e.target.value)} className={styles.input}>"
  );
  fs.writeFileSync(pagePath, page);
}

const apiPath = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/api/pods/route.js';
let api = fs.readFileSync(apiPath, 'utf8');
if (!api.includes('rewardXP')) {
  api = api.replace(
    "const { name, description, icon } = await req.json();",
    "const { name, description, icon, image, rewardXP } = await req.json();"
  );
  api = api.replace(
    "if (!name || !description)",
    "const reward = parseInt(rewardXP) || 0;\n    const user = await User.findById(decoded.id);\n    if (reward > 0 && user.xp < reward) return NextResponse.json({ error: 'Insufficient XP for reward' }, { status: 400 });\n    if (reward > 0) { user.xp -= reward; await user.save(); }\n    if (!name || !description)"
  );
  api = api.replace(
    "desc: description,\n      icon: icon || 'Dumbbell'",
    "desc: description,\n      icon: icon || 'Dumbbell',\n      image: image || '',\n      rewardXP: reward,\n      creator: decoded.id"
  );
  fs.writeFileSync(apiPath, api);
}
