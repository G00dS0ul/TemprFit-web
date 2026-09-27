const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/components/XPTransferWidget.js';
let content = fs.readFileSync(path, 'utf8');
content = content.replace('window.appAlert(Successfully transferred XP to !);', "window.appAlert('Successfully transferred ' + amount + ' XP to ' + recipient + '!');");
fs.writeFileSync(path, content, 'utf8');
