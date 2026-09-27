const fs = require('fs');
const momentsPath = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/moments/page.js';
let momentsContent = fs.readFileSync(momentsPath, 'utf8');

momentsContent = momentsContent.replace(/name=\$\{m\.user\?\.username\}/g, "name=${m.user?.username || 'Deleted'}");
momentsContent = momentsContent.replace(/name=\$\{activeMoment\.user\?\.username\}/g, "name=${activeMoment.user?.username || 'Deleted'}");
momentsContent = momentsContent.replace(/name=\$\{c\.user\?\.username\}/g, "name=${c.user?.username || 'Deleted'}");
momentsContent = momentsContent.replace(/name=\$\{reply\.user\?\.username\}/g, "name=${reply.user?.username || 'Deleted'}");

momentsContent = momentsContent.replace(/>\{m\.user\?\.username\}<\/div>/g, ">{m.user?.username || 'Deleted User'}</div>");
momentsContent = momentsContent.replace(/>\{m\.user\?\.username\}<\/strong>/g, ">{m.user?.username || 'Deleted User'}</strong>");
momentsContent = momentsContent.replace(/>\{activeMoment\.user\?\.username\}<\/div>/g, ">{activeMoment.user?.username || 'Deleted User'}</div>");
momentsContent = momentsContent.replace(/>\{activeMoment\.user\?\.username\}<\/strong>/g, ">{activeMoment.user?.username || 'Deleted User'}</strong>");
momentsContent = momentsContent.replace(/>\{c\.user\?\.username\}<\/strong>/g, ">{c.user?.username || 'Deleted User'}</strong>");
momentsContent = momentsContent.replace(/>\{reply\.user\?\.username\}<\/strong>/g, ">{reply.user?.username || 'Deleted User'}</strong>");

fs.writeFileSync(momentsPath, momentsContent, 'utf8');
