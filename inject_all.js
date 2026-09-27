const fs = require('fs');

function updateMoments() {
  const modelPath = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/models/Moment.js';
  let model = fs.readFileSync(modelPath, 'utf8');
  if (!model.includes('visibility')) {
    model = model.replace(
      'views: { type: Number, default: 0 },',
      "views: { type: Number, default: 0 },\n  visibility: { type: String, enum: ['public', 'hidden'], default: 'public' },"
    );
    fs.writeFileSync(modelPath, model);
  }

  const pagePath = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/moments/page.js';
  let page = fs.readFileSync(pagePath, 'utf8');
  if (!page.includes('my_moments')) {
    page = page.replace(
      "const [activeTab, setActiveTab] = useState('global'); // 'global' or 'saved'",
      "const [activeTab, setActiveTab] = useState('global'); // 'global', 'saved', 'my_moments'"
    );
    page = page.replace(
      "const displayedMoments = activeTab === 'saved' \n      ? moments.filter(m => m.savedBy?.includes(currentUser?._id))\n      : moments;",
      "const displayedMoments = activeTab === 'saved' ? moments.filter(m => m.savedBy?.includes(currentUser?._id)) : activeTab === 'my_moments' ? moments.filter(m => m.user?._id === currentUser?._id) : moments.filter(m => m.visibility !== 'hidden' || m.user?._id === currentUser?._id);"
    );
    page = page.replace(
      "Global Feed\n            </button>\n            <button \n              className={\\ \\}\n              onClick={() => setActiveTab('saved')}\n            >\n              Saved Moments\n            </button>",
      "Global Feed\n            </button>\n            <button \n              className={\\ \\}\n              onClick={() => setActiveTab('saved')}\n            >\n              Saved\n            </button>\n            <button \n              className={\\ \\}\n              onClick={() => setActiveTab('my_moments')}\n            >\n              My Moments\n            </button>"
    );
    page = page.replace(
      "<Trash2 size={16} /> Delete\n                          </button>",
      "<Trash2 size={16} /> Delete\n                          </button>\n                          <button onClick={async (e) => { e.stopPropagation(); await fetch(\/api/moments/\\, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visibility: m.visibility === 'hidden' ? 'public' : 'hidden' }) }); fetchMoments(); setMenuOpenId(null); }} className={styles.menuItem}>\n                            <Eye size={16} style={{opacity: m.visibility === 'hidden' ? 0.5 : 1}} /> {m.visibility === 'hidden' ? 'Make Public' : 'Make Hidden'}\n                          </button>\n                          <div className={styles.menuItem} style={{cursor:'default', color:'var(--color-text-muted)'}}>\n                            <Activity size={16} /> {m.views || 0} Views\n                          </div>"
    );
    fs.writeFileSync(pagePath, page);
  }

  const apiPath = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/api/moments/[id]/route.js';
  let api = fs.readFileSync(apiPath, 'utf8');
  if (!api.includes('export async function PATCH')) {
    api += "\nexport async function PATCH(req, { params }) {\n  const { connectDB } = require('@/lib/db');\n  const Moment = require('@/models/Moment').default;\n  const { verifyToken } = require('@/lib/auth');\n  const { NextResponse } = require('next/server');\n  await connectDB();\n  const token = req.cookies.get('token')?.value;\n  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });\n  const decoded = verifyToken(token);\n  const { visibility } = await req.json();\n  const moment = await Moment.findById(params.id);\n  if (moment.user.toString() !== decoded.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });\n  moment.visibility = visibility;\n  await moment.save();\n  return NextResponse.json({ success: true, moment });\n}\n";
    fs.writeFileSync(apiPath, api);
  }
}

function updatePods() {
  const modelPath = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/models/Pod.js';
  let model = fs.readFileSync(modelPath, 'utf8');
  if (!model.includes('rewardXP')) {
    model = model.replace(
      "icon: { type: String, default: 'Dumbbell' },",
      "icon: { type: String, default: 'Dumbbell' },\n  image: { type: String, default: '' },\n  rewardXP: { type: Number, default: 0 },"
    );
    fs.writeFileSync(modelPath, model);
  }

  const pagePath = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/pods/page.js';
  let page = fs.readFileSync(pagePath, 'utf8');
  if (!page.includes('newPodReward')) {
    page = page.replace(
      "const [newPodIcon, setNewPodIcon] = useState('Dumbbell');",
      "const [newPodIcon, setNewPodIcon] = useState('Dumbbell');\n  const [newPodImage, setNewPodImage] = useState('');\n  const [newPodReward, setNewPodReward] = useState('');"
    );
    page = page.replace(
      "body: JSON.stringify({ name: newPodName, description: newPodDesc, icon: newPodIcon })",
      "body: JSON.stringify({ name: newPodName, description: newPodDesc, icon: newPodIcon, image: newPodImage, rewardXP: parseInt(newPodReward) || 0 })"
    );
    fs.writeFileSync(pagePath, page);
  }
}

try {
  updateMoments();
  updatePods();
  console.log('Successfully injected features.');
} catch (e) {
  console.error('Error:', e);
}
