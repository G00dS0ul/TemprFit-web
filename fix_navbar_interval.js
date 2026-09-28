const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/components/Navbar/index.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "if (data.user) fetchNotifications();\n      })\n      .catch(() => setUser(null))\n      .finally(() => setCheckedAuth(true));\n  }, []);",
  "if (data.user) fetchNotifications();\n      })\n      .catch(() => setUser(null))\n      .finally(() => setCheckedAuth(true));\n\n    const interval = setInterval(() => {\n      if (user) fetchNotifications();\n    }, 60000);\n    return () => clearInterval(interval);\n  }, [user]);"
);

fs.writeFileSync(path, content, 'utf8');
