const fs = require('fs');

const pagePath = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/pods/page.js';
let page = fs.readFileSync(pagePath, 'utf8');

// If already contains handleImageUpload, don't inject again.
if (!page.includes('handleImageUpload')) {
  page = page.replace(
    "const [newPodImage, setNewPodImage] = useState('');",
    "const [newPodImage, setNewPodImage] = useState('');\n  const [uploadingImage, setUploadingImage] = useState(false);\n\n  const handleImageUpload = async (e) => {\n    const file = e.target.files[0];\n    if (!file) return;\n    setUploadingImage(true);\n    const formData = new FormData();\n    formData.append('file', file);\n    try {\n      const res = await fetch('/api/upload', { method: 'POST', body: formData });\n      const data = await res.json();\n      if (data.success) setNewPodImage(data.fileUrl);\n      else window.appAlert('Upload failed');\n    } catch (err) {\n      window.appAlert('Upload failed');\n    }\n    setUploadingImage(false);\n  };"
  );

  page = page.replace(
    "<input type='url' className={styles.input} placeholder='https://...' value={newPodImage} onChange={e => setNewPodImage(e.target.value)} />",
    "<div style={{display:'flex', gap:'8px'}}>\n              <input type='url' className={styles.input} style={{flex:1}} placeholder='Image URL or Upload...' value={newPodImage} onChange={e => setNewPodImage(e.target.value)} />\n              <input type='file' accept='image/*' onChange={handleImageUpload} style={{display:'none'}} id='pod-img-upload' />\n              <label htmlFor='pod-img-upload' className={styles.createBtn} style={{cursor:'pointer', padding:'8px 16px'}}>\n                {uploadingImage ? '...' : 'Upload'}\n              </label>\n            </div>"
  );
  
  fs.writeFileSync(pagePath, page);
}

