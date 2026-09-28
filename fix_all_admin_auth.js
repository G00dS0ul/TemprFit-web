const fs = require('fs');

function fixAuth(path) {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace(
      "if (!user || (user.role !== 'admin' && !(await verifyAdminToken()))) {",
      "const isAdmin = (user && user.role === 'admin') || (await verifyAdminToken());\n  if (!isAdmin) {"
    );
    fs.writeFileSync(path, content, 'utf8');
  }
}

fixAuth('C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/api/admin/disputes/route.js');
fixAuth('C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/api/admin/trainers/route.js');
fixAuth('C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/api/admin/users/route.js');
fixAuth('C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/api/admin/sidebar-counters/route.js');
fixAuth('C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/api/admin/coupons/route.js');

