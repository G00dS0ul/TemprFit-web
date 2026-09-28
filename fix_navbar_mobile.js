const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/components/Navbar/Navbar.module.css';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  ".omniDropdown {\n    position: fixed;",
  ".omniDropdown, .premiumNotifDropdown, .dropdown {\n    position: fixed;"
);

fs.writeFileSync(path, content, 'utf8');
