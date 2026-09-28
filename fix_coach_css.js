const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/coach/coach.module.css';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /\.chatPage\s*\{\s*min-height:\s*90vh;\s*padding:\s*100px\s+0\s+60px;\s*\}/g,
  ".chatPage {\n  height: 100vh;\n  padding: 80px 0 20px;\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n}"
);

content = content.replace(
  /\.chatWindow\s*\{[\s\S]*?overflow:\s*hidden;\s*\}/g,
  ".chatWindow {\n  max-width: 720px;\n  width: 100%;\n  margin: 0 auto;\n  background: var(--color-surface);\n  border: 1px solid var(--color-border);\n  border-radius: var(--radius-lg);\n  display: flex;\n  flex-direction: column;\n  flex: 1;\n  min-height: 0;\n  overflow: hidden;\n}"
);

content = content.replace(
  /\.formCheckLink\s*\{[\s\S]*?white-space:\s*nowrap;\s*\}/g,
  ".formCheckLink {\n  margin-left: auto;\n  font-size: 0.85rem;\n  font-weight: 600;\n  color: var(--color-bg);\n  background: var(--color-primary);\n  padding: 8px 16px;\n  border-radius: 8px;\n  white-space: nowrap;\n  text-decoration: none;\n  transition: all 0.2s;\n}\n.formCheckLink:hover {\n  opacity: 0.9;\n  transform: translateY(-2px);\n}"
);

const newStyles = `
.welcomeBox {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--color-surface-elevated);
  padding: 20px;
  border-radius: var(--radius-md);
  margin-bottom: 24px;
  border: 1px solid var(--color-border);
  text-align: left;
}
.welcomeAvatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.welcomeText h3 {
  margin: 0 0 4px 0;
  color: var(--color-text);
  font-size: 1.1rem;
}
.welcomeText p {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}
`;
if (!content.includes('.welcomeBox')) {
    content += newStyles;
}

fs.writeFileSync(path, content, 'utf8');
console.log("Updated coach css");
