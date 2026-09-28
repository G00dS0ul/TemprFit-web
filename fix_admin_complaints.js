const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/admin/complaints/page.js';
let content = fs.readFileSync(path, 'utf8');

const feedbackDisplay = `
                {c.userFeedback && (
                  <div style={{ background: 'rgba(245,158,11,0.05)', borderLeft: '4px solid #f59e0b', padding: '16px', borderRadius: '0 8px 8px 0' }}>
                    <span style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                      User Feedback: 
                      {c.userFeedback === 'thumbs_up' ? <ThumbsUp size={14} color="#22c55e" /> : <ThumbsDown size={14} color="#ef4444" />}
                    </span>
                  </div>
                )}
`;

content = content.replace(
  "{c.status === 'open' && (",
  feedbackDisplay + "\n                {c.status === 'open' && ("
);

fs.writeFileSync(path, content, 'utf8');
