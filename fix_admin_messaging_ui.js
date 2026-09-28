const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/admin/users/page.js';
let content = fs.readFileSync(path, 'utf8');

const messageBtn = `<button onClick={() => setMsgUser(user)} title="Message User" style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', padding: '4px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                    </button>`;

if (!content.includes('Message User"')) {
  content = content.replace(
    "<button onClick={() => openEditModal(user)}",
    messageBtn + "\n                    <button onClick={() => openEditModal(user)}"
  );
}

const msgModalJSX = `
      {msgUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--color-surface-elevated)', padding: '24px', borderRadius: '12px', width: '400px', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg> 
                Message {msgUser.username}
              </h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setMsgUser(null)} />
            </div>
            
            <form onSubmit={submitMessage} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Title</label>
                <input 
                  type="text" 
                  value={msgTitle} 
                  onChange={e => setMsgTitle(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }} 
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Message</label>
                <textarea 
                  value={msgText} 
                  onChange={e => setMsgText(e.target.value)} 
                  required 
                  rows="4" 
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', resize: 'vertical' }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setMsgUser(null)} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={msgSending} style={{ flex: 1, padding: '12px', borderRadius: '8px', background: '#10b981', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>{msgSending ? 'Sending...' : 'Send Message'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
`;

if (!content.includes('Message {msgUser.username}')) {
  const lastDivIndex = content.lastIndexOf("</div>");
  if (lastDivIndex !== -1) {
    content = content.substring(0, lastDivIndex) + msgModalJSX + "\n    " + content.substring(lastDivIndex);
  }
}

// Add the submitMessage function since it looks like my previous replace might have missed it or malformed it
// Wait, I see in line 164 `body: JSON.stringify({ userId: msgUser._id, title: msgTitle, message: msgText })`
// So submitMessage exists!

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed admin messaging button and modal");
