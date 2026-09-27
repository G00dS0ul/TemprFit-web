const fs = require('fs');
const path = require('path');

// 1. Update Complaint.js Model
const complaintModelPath = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/models/Complaint.js';
let complaintModelContent = fs.readFileSync(complaintModelPath, 'utf8');
if (!complaintModelContent.includes('userFeedback')) {
  complaintModelContent = complaintModelContent.replace(
    "type: { type: String, enum: ['support', 'appeal'], default: 'support' }",
    "type: { type: String, enum: ['support', 'appeal'], default: 'support' },\n  userFeedback: { type: String, enum: ['thumbs_up', 'thumbs_down', null], default: null }"
  );
  fs.writeFileSync(complaintModelPath, complaintModelContent, 'utf8');
}

// 2. Create app/api/complaints/[id]/route.js
const apiDirPath = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/api/complaints/[id]';
if (!fs.existsSync(apiDirPath)) {
  fs.mkdirSync(apiDirPath, { recursive: true });
}
const routePath = path.join(apiDirPath, 'route.js');
const routeCode = `
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Complaint from '@/models/Complaint';
import { getSessionUser } from '@/lib/auth';

export async function PATCH(req, { params }) {
  await connectDB();
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = params;
    const { userFeedback } = await req.json();

    const complaint = await Complaint.findOne({ _id: id, user: sessionUser._id });
    if (!complaint) return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });

    complaint.userFeedback = userFeedback;
    await complaint.save();

    return NextResponse.json({ success: true, complaint });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
}
`;
fs.writeFileSync(routePath, routeCode.trim(), 'utf8');

// 3. Update app/support/page.js
const supportPath = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/support/page.js';
let supportContent = fs.readFileSync(supportPath, 'utf8');
if (!supportContent.includes('handleFeedback')) {
  supportContent = supportContent.replace(
    "import { Send, CheckCircle, MessageSquare } from 'lucide-react';",
    "import { Send, CheckCircle, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';"
  );

  supportContent = supportContent.replace(
    "const handleSubmit = async (e) => {",
    "const handleFeedback = async (id, feedback) => {\n    try {\n      const res = await fetch(`/api/complaints/${id}`, {\n        method: 'PATCH',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify({ userFeedback: feedback })\n      });\n      if (res.ok) fetchComplaints();\n    } catch (e) { console.error(e); }\n  };\n\n  const handleSubmit = async (e) => {"
  );

  // Add the feedback buttons below the admin reply
  supportContent = supportContent.replace(
    /<span style=\{\{ fontSize: '0\.75rem', color: '#3b82f6', fontWeight: 600, display: 'block', marginBottom: '4px' \}\}>Admin Reply<\/span>\n                          <p style=\{\{ fontSize: '0\.9rem', margin: 0 \}\}>\{c\.adminReply\}<\/p>\n                        <\/div>\n                      \)\}/g,
    "<span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Admin Reply</span>\n                          <p style={{ fontSize: '0.9rem', margin: 0 }}>{c.adminReply}</p>\n                          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>\n                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Did this resolve your issue?</span>\n                            <button onClick={() => handleFeedback(c._id, 'thumbs_up')} style={{ background: c.userFeedback === 'thumbs_up' ? '#22c55e' : 'transparent', border: '1px solid var(--color-border)', color: c.userFeedback === 'thumbs_up' ? '#000' : 'var(--color-text-muted)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>\n                              <ThumbsUp size={14} /> Yes\n                            </button>\n                            <button onClick={() => handleFeedback(c._id, 'thumbs_down')} style={{ background: c.userFeedback === 'thumbs_down' ? '#ef4444' : 'transparent', border: '1px solid var(--color-border)', color: c.userFeedback === 'thumbs_down' ? '#fff' : 'var(--color-text-muted)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>\n                              <ThumbsDown size={14} /> No\n                            </button>\n                          </div>\n                        </div>\n                      )}"
  );
  
  fs.writeFileSync(supportPath, supportContent, 'utf8');
}

// 4. Update app/admin/complaints/page.js
const adminSupportPath = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/admin/complaints/page.js';
let adminSupportContent = fs.readFileSync(adminSupportPath, 'utf8');
if (!adminSupportContent.includes('userFeedback')) {
  adminSupportContent = adminSupportContent.replace(
    "import { MessageSquare, Check, CornerDownRight, ShieldAlert } from 'lucide-react';",
    "import { MessageSquare, Check, CornerDownRight, ShieldAlert, ThumbsUp, ThumbsDown } from 'lucide-react';"
  );

  adminSupportContent = adminSupportContent.replace(
    /<p style=\{\{ margin: 0, whiteSpace: 'pre-wrap' \}\}>\{c\.adminReply\}<\/p>\n                  <\/div>\n                \)\}/g,
    "<p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{c.adminReply}</p>\n                    {c.userFeedback && (\n                      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>\n                        <span style={{ color: 'var(--color-text-muted)' }}>User Feedback:</span>\n                        {c.userFeedback === 'thumbs_up' ? <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}><ThumbsUp size={14} /> Satisfied</span> : <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}><ThumbsDown size={14} /> Not Satisfied</span>}\n                      </div>\n                    )}\n                  </div>\n                )}"
  );

  fs.writeFileSync(adminSupportPath, adminSupportContent, 'utf8');
}
