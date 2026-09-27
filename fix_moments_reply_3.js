const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/moments/page.js';
let content = fs.readFileSync(path, 'utf8');
content = content.replace("setCommentText(`@${comment.user.username} `);", "setCommentText('@' + (comment.user && comment.user.username ? comment.user.username : 'user') + ' ');");
fs.writeFileSync(path, content, 'utf8');
