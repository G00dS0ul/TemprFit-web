const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/settings/page.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "import { Camera, Check, Loader2, Link as LinkIcon, FileText, Video } from 'lucide-react';",
  "import { Camera, Check, Loader2, Link as LinkIcon, FileText, Video, X } from 'lucide-react';"
);

fs.writeFileSync(path, content, 'utf8');
