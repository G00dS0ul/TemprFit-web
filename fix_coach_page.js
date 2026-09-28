const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/coach/page.js';
let content = fs.readFileSync(path, 'utf8');

// Store user
content = content.replace(
  "const [signedIn, setSignedIn] = useState(true);",
  "const [signedIn, setSignedIn] = useState(true);\n  const [user, setUser] = useState(null);"
);

content = content.replace(
  ".then((d) => setMessages(d.messages || []))",
  ".then((d) => {\n        setMessages(d.messages || []);\n        fetch('/api/auth/me').then(r => r.json()).then(ud => { if(ud.user) setUser(ud.user) });\n      })"
);

// Update user avatar
content = content.replace(
  "{m.role === 'assistant' ? <Image src=\"/images/brand/my-logo.png\" alt=\"\" width={16} height={16} /> : <User size={16} />}",
  "{m.role === 'assistant' ? <Image src=\"/images/brand/my-logo.png\" alt=\"\" width={16} height={16} /> : (user?.profilePicture ? <img src={user.profilePicture} alt=\"\" style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }} /> : <User size={16} />)}"
);

// Add default welcome message for AI coach
const emptyStateMatch = "{messages?.length === 0 && (";
const emptyStateReplacement = `{messages?.length === 0 && (
              <div className={styles.empty}>
                <div className={styles.welcomeBox}>
                  <div className={styles.welcomeAvatar}><Image src="/images/brand/my-logo.png" alt="" width={32} height={32} /></div>
                  <div className={styles.welcomeText}>
                    <h3>Welcome to TemprFit AI Coach!</h3>
                    <p>I can help you analyze your progress, check your form, and plan your next workout.</p>
                  </div>
                </div>
                <div className={styles.starters}>
                  {STARTER_PROMPTS.map((p) => (
                    <button key={p} className={styles.starterBtn} onClick={() => send(p)}>{p}</button>
                  ))}
                </div>
              </div>
            )}`;

content = content.replace(
  /\{messages\?\.length === 0 && \([\s\S]*?\)\}/m,
  emptyStateReplacement
);

fs.writeFileSync(path, content, 'utf8');
console.log("Updated coach page JS");
