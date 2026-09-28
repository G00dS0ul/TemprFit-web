const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/admin/users/page.js';
let content = fs.readFileSync(path, 'utf8');

const stateCode = `  const [msgUser, setMsgUser] = useState(null);
  const [msgTitle, setMsgTitle] = useState('Admin Message');
  const [msgText, setMsgText] = useState('');
  const [msgSending, setMsgSending] = useState(false);`;

content = content.replace(
  "const [editError, setEditError] = useState('');",
  "const [editError, setEditError] = useState('');\n" + stateCode
);

const submitMessageCode = `  const submitMessage = async (e) => {
    e.preventDefault();
    setMsgSending(true);
    try {
      const res = await fetch('/api/admin/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: msgUser._id, title: msgTitle, message: msgText })
      });
      const data = await res.json();
      if (res.ok) {
        window.appAlert('Message sent successfully!');
        setMsgUser(null);
        setMsgText('');
      } else {
        window.appAlert(data.error || 'Failed to send message');
      }
    } catch (e) {
      window.appAlert('Network error');
    }
    setMsgSending(false);
  };`;

content = content.replace(
  "const submitEdit = async (e) => {",
  submitMessageCode + "\n\n  const submitEdit = async (e) => {"
);

// Add button to user row
const messageBtn = `<button onClick={() => setMsgUser(user)} title="Message User" style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', padding: '4px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                    </button>`;

content = content.replace(
  "<button onClick={() => openEditModal(user)}",
  messageBtn + "\n                    <button onClick={() => openEditModal(user)}"
);

// Add modal JSX
const msgModalJSX = `
        {msgUser && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'var(--color-surface)', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '400px', border: '1px solid var(--color-border)' }}>
              <h3 style={{ marginTop: 0, color: 'var(--color-text)' }}>Message {msgUser.username}</h3>
              <form onSubmit={submitMessage} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Title</label>
                  <input type="text" value={msgTitle} onChange={e => setMsgTitle(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Message</label>
                  <textarea value={msgText} onChange={e => setMsgText(e.target.value)} required rows="4" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setMsgUser(null)} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={msgSending} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: '#10b981', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>{msgSending ? 'Sending...' : 'Send'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
`;

content = content.replace("</main>", msgModalJSX + "\n    </main>");

fs.writeFileSync(path, content, 'utf8');
