const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/components/Navbar/Navbar.module.css';
let content = fs.readFileSync(path, 'utf8');

if (content.includes(".omniDropdown, .premiumNotifDropdown, .dropdown")) {
    console.log("SUCCESS: Replaced correctly in media query");
} else {
    console.log("FAIL: Not replaced");
}
