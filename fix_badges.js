const fs = require('fs');

// 1. Fix Badges Page Tabs
const badgesPath = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/badges/page.js';
let badgesContent = fs.readFileSync(badgesPath, 'utf8');

if (!badgesContent.includes('activeTab')) {
  badgesContent = badgesContent.replace(
    "const [buying, setBuying] = useState(false);",
    "const [buying, setBuying] = useState(false);\n  const [activeTab, setActiveTab] = useState('badges');"
  );

  badgesContent = badgesContent.replace(
    "<h1 className={styles.title}>Achievements & Rewards</h1>\n              <p className={styles.subtitle}>Unlock badges for XP and spend your XP in the shop.</p>\n            </div>\n            <div className={styles.xpBadge}>\n              <Star fill=\"currentColor\" size={18} /> {user.xp || 0} XP\n            </div>\n          </div>",
    "<h1 className={styles.title}>Achievements & Rewards</h1>\n              <p className={styles.subtitle}>Unlock badges for XP and spend your XP in the shop.</p>\n            </div>\n            <div className={styles.xpBadge}>\n              <Star fill=\"currentColor\" size={18} /> {user.xp || 0} XP\n            </div>\n          </div>\n\n          <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', borderBottom: '1px solid var(--color-border)' }}>\n            <button onClick={() => setActiveTab('badges')} style={{ background: 'none', border: 'none', borderBottom: activeTab === 'badges' ? '3px solid #fbbf24' : '3px solid transparent', padding: '12px 24px', color: activeTab === 'badges' ? '#fbbf24' : 'var(--color-text-muted)', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}>My Badges</button>\n            <button onClick={() => setActiveTab('shop')} style={{ background: 'none', border: 'none', borderBottom: activeTab === 'shop' ? '3px solid #3b82f6' : '3px solid transparent', padding: '12px 24px', color: activeTab === 'shop' ? '#3b82f6' : 'var(--color-text-muted)', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}>XP Store</button>\n          </div>"
  );

  badgesContent = badgesContent.replace(
    "<div className={styles.section}>\n            <h2 className={styles.sectionTitle}><Trophy size={24} style={{ color: '#fbbf24' }} /> Badges",
    "{activeTab === 'badges' && <div className={styles.section}>\n            <h2 className={styles.sectionTitle}><Trophy size={24} style={{ color: '#fbbf24' }} /> Badges"
  );

  badgesContent = badgesContent.replace(
    "More coming soon...</h3>\n                <p className={styles.badgeDesc} style={{ textAlign: 'center' }}>We are actively adding new challenges and badges!</p>\n              </div>\n            </div>\n          </div>\n\n          <div className={styles.section}>",
    "More coming soon...</h3>\n                <p className={styles.badgeDesc} style={{ textAlign: 'center' }}>We are actively adding new challenges and badges!</p>\n              </div>\n            </div>\n          </div>}\n\n          {activeTab === 'shop' && <div className={styles.section}>"
  );

  badgesContent = badgesContent.replace(
    "</BuyXPButton>\n                  </div>\n                );\n              })}\n            </div>\n          </div>",
    "</BuyXPButton>\n                  </div>\n                );\n              })}\n            </div>\n          </div>}"
  );

  fs.writeFileSync(badgesPath, badgesContent, 'utf8');
}

// 2. Fix Moments UN Placeholder
const momentsPath = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/moments/page.js';
let momentsContent = fs.readFileSync(momentsPath, 'utf8');

// Replace standard avatar generation strings
momentsContent = momentsContent.replace(/name=\$\\{m\.user\?\.username\\}/g, "name=${m.user?.username || 'Deleted'}");
momentsContent = momentsContent.replace(/name=\$\\{activeMoment\.user\?\.username\\}/g, "name=${activeMoment.user?.username || 'Deleted'}");
momentsContent = momentsContent.replace(/name=\$\\{c\.user\?\.username\\}/g, "name=${c.user?.username || 'Deleted'}");
momentsContent = momentsContent.replace(/name=\$\\{reply\.user\?\.username\\}/g, "name=${reply.user?.username || 'Deleted'}");

// Replace actual rendered usernames
momentsContent = momentsContent.replace(/>\\{m\.user\?\.username\\}<\/div>/g, ">{m.user?.username || 'Deleted User'}</div>");
momentsContent = momentsContent.replace(/>\\{m\.user\?\.username\\}<\/strong>/g, ">{m.user?.username || 'Deleted User'}</strong>");
momentsContent = momentsContent.replace(/>\\{activeMoment\.user\?\.username\\}<\/div>/g, ">{activeMoment.user?.username || 'Deleted User'}</div>");
momentsContent = momentsContent.replace(/>\\{activeMoment\.user\?\.username\\}<\/strong>/g, ">{activeMoment.user?.username || 'Deleted User'}</strong>");
momentsContent = momentsContent.replace(/>\\{c\.user\?\.username\\}<\/strong>/g, ">{c.user?.username || 'Deleted User'}</strong>");
momentsContent = momentsContent.replace(/>\\{reply\.user\?\.username\\}<\/strong>/g, ">{reply.user?.username || 'Deleted User'}</strong>");

fs.writeFileSync(momentsPath, momentsContent, 'utf8');
