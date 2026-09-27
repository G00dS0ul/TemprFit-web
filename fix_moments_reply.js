const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/moments/page.js';
let content = fs.readFileSync(path, 'utf8');

// The line is: setCommentText(@ );
// But it was injected or originally written with a template literal.
// Let's replace the block containing handleCommentReply.
content = content.replace('setCommentText(@ );', "setCommentText('@' + (comment.user?.username || 'user') + ' ');");

fs.writeFileSync(path, content, 'utf8');
