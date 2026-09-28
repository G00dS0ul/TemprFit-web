const fs = require('fs');

const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/pods/page.js';
let content = fs.readFileSync(path, 'utf8');

// Add missing states if they aren't there
if (!content.includes('const [newPodRewardType, setNewPodRewardType]')) {
  content = content.replace(
    "const [newPodImage, setNewPodImage] = useState(null);",
    "const [newPodImage, setNewPodImage] = useState(null);\n  const [newPodRewardType, setNewPodRewardType] = useState('shared_pool');\n  const fileInputRef = useRef(null);"
  );
  
  content = content.replace(
    "import { Plus, Users, Activity, Flame, Shield, Trophy, Zap, Medal, Dumbbell, Sun, X } from 'lucide-react';",
    "import { Plus, Users, Activity, Flame, Shield, Trophy, Zap, Medal, Dumbbell, Sun, X, Upload } from 'lucide-react';\nimport { useRef } from 'react';"
  );
}

// Add the UI for image upload and reward type
const oldSelectIcon = `<div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Select Icon</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {Object.keys(ICON_MAP).map(iconKey => {
                    const IconComp = ICON_MAP[iconKey];
                    return (
                      <button 
                        key={iconKey}
                        type="button"
                        onClick={() => setNewPodIcon(iconKey)}
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          background: newPodIcon === iconKey ? 'var(--color-primary)' : 'var(--color-bg)',
                          border: \`1px solid \${newPodIcon === iconKey ? 'var(--color-primary)' : 'var(--color-border)'}\`,
                          color: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        <IconComp size={24} />
                      </button>
                    )
                  })}
                </div>
              </div>`;

const newSelectIcon = `<div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Select Icon or Upload Image</label>
                
                {newPodImage ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <img src={newPodImage} alt="Pod Icon" style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover' }} />
                    <button type="button" onClick={() => setNewPodImage(null)} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Remove Image</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={fileInputRef} 
                      style={{ display: 'none' }} 
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setNewPodImage(reader.result);
                          reader.readAsDataURL(file);
                        }
                      }} 
                    />
                    <button type="button" onClick={() => fileInputRef.current?.click()} style={{ background: 'var(--color-surface)', border: '1px dashed var(--color-border)', color: 'var(--color-text)', padding: '16px 24px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center' }}>
                      <Upload size={20} /> Upload Custom Image
                    </button>
                  </div>
                )}
                
                {!newPodImage && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {Object.keys(ICON_MAP).map(iconKey => {
                      const IconComp = ICON_MAP[iconKey];
                      return (
                        <button 
                          key={iconKey}
                          type="button"
                          onClick={() => setNewPodIcon(iconKey)}
                          style={{
                            padding: '12px',
                            borderRadius: '8px',
                            background: newPodIcon === iconKey ? 'var(--color-primary)' : 'var(--color-bg)',
                            border: \`1px solid \${newPodIcon === iconKey ? 'var(--color-primary)' : 'var(--color-border)'}\`,
                            color: newPodIcon === iconKey ? '#000' : '#fff',
                            cursor: 'pointer'
                          }}
                        >
                          <IconComp size={24} />
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Reward XP</label>
                  <input 
                    type="number" 
                    value={newPodReward} 
                    onChange={(e) => setNewPodReward(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: '#fff' }}
                    placeholder="2500"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)' }}>Reward Type</label>
                  <select 
                    value={newPodRewardType} 
                    onChange={(e) => setNewPodRewardType(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: '#fff', appearance: 'none' }}
                  >
                    <option value="shared_pool">Shared Pool (Divide amongst winners)</option>
                    <option value="winner_takes_all">Winner Takes All (First person gets everything)</option>
                  </select>
                </div>
              </div>`;

content = content.replace(oldSelectIcon, newSelectIcon);

// Update fetch payload
content = content.replace(
  "body: JSON.stringify({ name: newPodName, description: newPodDesc, icon: newPodIcon, image: newPodImage, rewardXP: parseInt(newPodReward) || 0 })",
  "body: JSON.stringify({ name: newPodName, description: newPodDesc, icon: newPodIcon, image: newPodImage, rewardXP: parseInt(newPodReward) || 0, rewardType: newPodRewardType })"
);

// Update rendering of customImage
content = content.replace(
  "<div className={styles.podIconWrap}>\n                      <Icon size={24} />\n                    </div>",
  `<div className={styles.podIconWrap} style={{ padding: pod.customImage ? 0 : '12px', overflow: 'hidden' }}>
                      {pod.customImage ? <img src={pod.customImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Pod" /> : <Icon size={24} />}
                    </div>`
);

fs.writeFileSync(path, content, 'utf8');
