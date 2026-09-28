const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/components/AdminSidebar/index.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "MessageSquare, Settings, LogOut, Megaphone",
  "MessageSquare, Settings, LogOut, Megaphone, Sun, Moon"
);

fs.writeFileSync(path, content, 'utf8');
