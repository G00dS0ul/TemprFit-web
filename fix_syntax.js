const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/coach/page.js';
let content = fs.readFileSync(path, 'utf8');

const searchStr = `            {messages?.length === 0 && (
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
            )}>{p}</button>
                  ))}
                </div>
              </div>
            )}`;

const replaceStr = `            {messages?.length === 0 && (
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

content = content.replace(searchStr, replaceStr);

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed syntax error");
