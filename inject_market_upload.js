const fs = require('fs');

const pagePath = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/shop/marketplace/sell/page.js';
let page = fs.readFileSync(pagePath, 'utf8');

if (!page.includes('handleImageUpload')) {
  page = page.replace(
    "const [imageUrl, setImageUrl] = useState('');",
    "const [imageUrl, setImageUrl] = useState('');\n  const [uploadingImage, setUploadingImage] = useState(false);\n\n  const handleImageUpload = async (e) => {\n    const file = e.target.files[0];\n    if (!file) return;\n    setUploadingImage(true);\n    const formData = new FormData();\n    formData.append('file', file);\n    try {\n      const res = await fetch('/api/upload', { method: 'POST', body: formData });\n      const data = await res.json();\n      if (data.success) setImages([...images, data.fileUrl]);\n      else alert('Upload failed');\n    } catch (err) {\n      alert('Upload failed');\n    }\n    setUploadingImage(false);\n  };"
  );

  page = page.replace(
    "<input \n                type=\"url\" \n                placeholder=\"Paste an image URL here (Cloudinary/Imgur)\" \n                value={imageUrl}\n                onChange={e => setImageUrl(e.target.value)}\n              />\n              <button type=\"button\" onClick={addImage} className={styles.addBtn}>Add</button>",
    "<input \n                type=\"url\" \n                placeholder=\"Paste an image URL here\" \n                value={imageUrl}\n                onChange={e => setImageUrl(e.target.value)}\n              />\n              <button type=\"button\" onClick={addImage} className={styles.addBtn}>Add</button>\n              <input type=\"file\" accept=\"image/*\" onChange={handleImageUpload} style={{display:'none'}} id=\"market-img-upload\" />\n              <label htmlFor=\"market-img-upload\" className={styles.addBtn} style={{display:'flex', alignItems:'center', cursor:'pointer'}}>\n                {uploadingImage ? '...' : 'Upload'}\n              </label>"
  );

  fs.writeFileSync(pagePath, page);
}
