const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/admin/users/page.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "const [editForm, setEditForm] = useState({ username: '', avatarUrl: '', password: '' });",
  "const [editForm, setEditForm] = useState({ username: '', avatarUrl: '', password: '', plan: 'free' });"
);

content = content.replace(
  "setEditForm({ username: user.username, avatarUrl: user.avatarUrl || '', password: '' });",
  "setEditForm({ username: user.username, avatarUrl: user.avatarUrl || '', password: '', plan: user.plan || 'free' });"
);

content = content.replace(
  "setUsers(users.map(u => u._id === editUser._id ? { ...u, username: data.user.username, avatarUrl: data.user.avatarUrl } : u));",
  "setUsers(users.map(u => u._id === editUser._id ? { ...u, username: data.user.username, avatarUrl: data.user.avatarUrl, plan: data.user.plan } : u));"
);

const planSelect = `
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Plan Tier</label>
                  <select 
                    value={editForm.plan} 
                    onChange={e => setEditForm({...editForm, plan: e.target.value})} 
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="max">Max</option>
                  </select>
                </div>
`;

content = content.replace(
  "<div>\n                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>New Password (leave blank to keep current)</label>",
  planSelect + "\n                <div>\n                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>New Password (leave blank to keep current)</label>"
);

// Display the user plan in the list
content = content.replace(
  "color: 'var(--color-text-muted)' }}>{user.email}</span>",
  "color: 'var(--color-text-muted)' }}>{user.email} &bull; <span style={{ textTransform: 'capitalize', color: 'var(--color-primary)' }}>{user.plan || 'Free'} Plan</span></span>"
);

fs.writeFileSync(path, content, 'utf8');
