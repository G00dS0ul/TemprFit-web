const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/moments/page.module.css';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  ".actionBtn {\n  display: flex;",
  ".actionBtn {\n  display: flex;\n  cursor: pointer;\n  transition: all 0.2s ease;"
);

content = content.replace(
  ".avatar {\n  width: 40px;",
  ".avatar {\n  width: 40px;\n  cursor: pointer;\n  transition: transform 0.2s;"
);

content = content.replace(
  ".avatar {\n  width: 40px;\n  cursor: pointer;\n  transition: transform 0.2s;\n  height: 40px;\n  border-radius: 50%;\n  object-fit: cover;\n}",
  ".avatar {\n  width: 40px;\n  cursor: pointer;\n  transition: transform 0.2s;\n  height: 40px;\n  border-radius: 50%;\n  object-fit: cover;\n}\n.avatar:hover {\n  transform: scale(1.05);\n}"
);

fs.writeFileSync(path, content, 'utf8');
