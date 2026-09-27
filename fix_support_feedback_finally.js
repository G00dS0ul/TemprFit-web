const fs = require('fs');

const supportPath = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/support/page.js';
let supportContent = fs.readFileSync(supportPath, 'utf8');
const lines = supportContent.split('\n');

const newContent = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{c.adminReply}</p>')) {
    newContent.push(lines[i]);
    newContent.push("                          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>");
    newContent.push("                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Did this resolve your issue?</span>");
    newContent.push("                            <button onClick={() => handleFeedback(c._id, 'thumbs_up')} style={{ background: c.userFeedback === 'thumbs_up' ? '#22c55e' : 'transparent', border: '1px solid var(--color-border)', color: c.userFeedback === 'thumbs_up' ? '#000' : 'var(--color-text-muted)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>");
    newContent.push("                              <ThumbsUp size={14} /> Yes");
    newContent.push("                            </button>");
    newContent.push("                            <button onClick={() => handleFeedback(c._id, 'thumbs_down')} style={{ background: c.userFeedback === 'thumbs_down' ? '#ef4444' : 'transparent', border: '1px solid var(--color-border)', color: c.userFeedback === 'thumbs_down' ? '#fff' : 'var(--color-text-muted)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>");
    newContent.push("                              <ThumbsDown size={14} /> No");
    newContent.push("                            </button>");
    newContent.push("                          </div>");
  } else {
    newContent.push(lines[i]);
  }
}

fs.writeFileSync(supportPath, newContent.join('\n'), 'utf8');
