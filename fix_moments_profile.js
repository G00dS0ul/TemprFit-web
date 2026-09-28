const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/moments/page.js';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes("viewingProfile")) {
  content = content.replace(
    "const [uploadOpen, setUploadOpen] = useState(false);",
    "const [uploadOpen, setUploadOpen] = useState(false);\n  const [viewingProfile, setViewingProfile] = useState(null);"
  );

  const profileModalCode = `
      {viewingProfile && (
        <div className={styles.overlay} onClick={() => setViewingProfile(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px'}}>
            <button className={styles.closeBtn} onClick={() => setViewingProfile(null)} style={{position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer'}}>X</button>
            <img src={viewingProfile.avatar} alt={viewingProfile.username} style={{width: '200px', height: '200px', borderRadius: '50%', objectFit: 'cover', marginBottom: '16px'}} />
            <h3 style={{color: 'var(--color-text)', margin: 0, fontSize: '1.4rem'}}>{viewingProfile.username}</h3>
          </div>
        </div>
      )}
  `;
  content = content.replace("</main>", profileModalCode + "\n    </main>");

  // Add click to avatar
  content = content.replace(
    /<img\s+src=\{m\.user\?\.profilePicture \|\| '\/images\/default-avatar\.png'\}\s+alt="avatar"\s+className=\{styles\.avatar\}\s*\/>/g,
    `<img src={m.user?.profilePicture || '/images/default-avatar.png'} alt="avatar" className={styles.avatar} onClick={(e) => { e.stopPropagation(); setViewingProfile({ avatar: m.user?.profilePicture || '/images/default-avatar.png', username: m.user?.username || 'Unknown' }); }} />`
  );

  fs.writeFileSync(path, content, 'utf8');
  console.log("Added profile picture viewing to moments page");
}
