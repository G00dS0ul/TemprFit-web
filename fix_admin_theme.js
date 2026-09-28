const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/components/AdminSidebar/index.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "import { \n  Activity, ShieldCheck, Users, Tag, Dumbbell, \n  MessageSquare, Settings, LogOut, Megaphone\n} from 'lucide-react';",
  "import { \n  Activity, ShieldCheck, Users, Tag, Dumbbell, \n  MessageSquare, Settings, LogOut, Megaphone, Moon, Sun\n} from 'lucide-react';"
);

content = content.replace(
  "const [counters, setCounters] = useState({ trainers: 0, users: 0, bookings: 0 });",
  "const [counters, setCounters] = useState({ trainers: 0, users: 0, bookings: 0 });\n  const [theme, setTheme] = useState('dark');\n\n  useEffect(() => {\n    const saved = localStorage.getItem('theme') || 'dark';\n    setTheme(saved);\n    document.documentElement.setAttribute('data-theme', saved);\n  }, []);\n\n  const toggleTheme = () => {\n    const next = theme === 'dark' ? 'light' : 'dark';\n    setTheme(next);\n    localStorage.setItem('theme', next);\n    document.documentElement.setAttribute('data-theme', next);\n  };"
);

content = content.replace(
  "<Link href=\"/admin/settings\"",
  "<button onClick={toggleTheme} className={styles.menuItem} style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', color: 'var(--color-text)' }}>\n          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}\n          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>\n        </button>\n        <Link href=\"/admin/settings\""
);

fs.writeFileSync(path, content, 'utf8');
