const fs = require('fs');

const supportPath = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/support/page.js';
let supportContent = fs.readFileSync(supportPath, 'utf8');

supportContent = supportContent.replace(
  "<p style={{ fontSize: '0.9rem', margin: 0 }}>{c.adminReply}</p>\n                        </div>\n                      )}",
  "<p style={{ fontSize: '0.9rem', margin: 0 }}>{c.adminReply}</p>\n                            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>\n                              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Did this resolve your issue?</span>\n                              <button onClick={() => handleFeedback(c._id, 'thumbs_up')} style={{ background: c.userFeedback === 'thumbs_up' ? '#22c55e' : 'transparent', border: '1px solid var(--color-border)', color: c.userFeedback === 'thumbs_up' ? '#000' : 'var(--color-text-muted)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>\n                                <ThumbsUp size={14} /> Yes\n                              </button>\n                              <button onClick={() => handleFeedback(c._id, 'thumbs_down')} style={{ background: c.userFeedback === 'thumbs_down' ? '#ef4444' : 'transparent', border: '1px solid var(--color-border)', color: c.userFeedback === 'thumbs_down' ? '#fff' : 'var(--color-text-muted)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>\n                                <ThumbsDown size={14} /> No\n                              </button>\n                            </div>\n                          </div>\n                        )}"
);

fs.writeFileSync(supportPath, supportContent, 'utf8');

// Now let's fix admin/complaints/page.js
const adminSupportPath = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/admin/complaints/page.js';
let adminSupportContent = fs.readFileSync(adminSupportPath, 'utf8');

adminSupportContent = adminSupportContent.replace(
  "<p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{c.adminReply}</p>\n                  </div>\n                )}",
  "<p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{c.adminReply}</p>\n                    {c.userFeedback && (\n                      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>\n                        <span style={{ color: 'var(--color-text-muted)' }}>User Feedback:</span>\n                        {c.userFeedback === 'thumbs_up' ? <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}><ThumbsUp size={14} /> Satisfied</span> : <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}><ThumbsDown size={14} /> Not Satisfied</span>}\n                      </div>\n                    )}\n                  </div>\n                )}"
);

fs.writeFileSync(adminSupportPath, adminSupportContent, 'utf8');
