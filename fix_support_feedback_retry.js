const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/support/page.js';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `                      {c.adminReply && (
                        <div style={{ background: 'rgba(59,130,246,0.05)', borderLeft: '3px solid #3b82f6', padding: '12px', borderRadius: '0 8px 8px 0', marginTop: '12px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Admin Reply</span>
                          <p style={{ fontSize: '0.9rem', margin: 0 }}>{c.adminReply}</p>
                        </div>
                      )}`;

const replacementStr = `                      {c.adminReply && (
                        <div style={{ background: 'rgba(59,130,246,0.05)', borderLeft: '3px solid #3b82f6', padding: '12px', borderRadius: '0 8px 8px 0', marginTop: '12px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Admin Reply</span>
                          <p style={{ fontSize: '0.9rem', margin: 0 }}>{c.adminReply}</p>
                          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Did this resolve your issue?</span>
                            <button onClick={() => handleFeedback(c._id, 'thumbs_up')} style={{ background: c.userFeedback === 'thumbs_up' ? '#22c55e' : 'transparent', border: '1px solid var(--color-border)', color: c.userFeedback === 'thumbs_up' ? '#000' : 'var(--color-text-muted)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <ThumbsUp size={14} /> Yes
                            </button>
                            <button onClick={() => handleFeedback(c._id, 'thumbs_down')} style={{ background: c.userFeedback === 'thumbs_down' ? '#ef4444' : 'transparent', border: '1px solid var(--color-border)', color: c.userFeedback === 'thumbs_down' ? '#fff' : 'var(--color-text-muted)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <ThumbsDown size={14} /> No
                            </button>
                          </div>
                        </div>
                      )}`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync(path, content, 'utf8');
