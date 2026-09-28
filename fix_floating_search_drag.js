const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/components/FloatingSearch/index.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "const [position, setPosition] = useState({ x: 20, y: 20 });",
  "const [position, setPosition] = useState({ x: 20, y: 20 });\n  const [hasDragged, setHasDragged] = useState(false);"
);

content = content.replace(
  "const handlePointerDown = (e) => {",
  "const handlePointerDown = (e) => {\n    setHasDragged(false);"
);

content = content.replace(
  "dragStartPos.current = { x: e.clientX, y: e.clientY };\n  };",
  "dragStartPos.current = { x: e.clientX, y: e.clientY };\n    setHasDragged(true);\n  };"
);

content = content.replace(
  "onClick={() => setOpen(true)}",
  "onClick={(e) => { if (hasDragged) { e.preventDefault(); e.stopPropagation(); } else { setOpen(true); } }}"
);

fs.writeFileSync(path, content, 'utf8');
console.log("Updated FloatingSearch drag logic");
