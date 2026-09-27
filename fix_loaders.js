const fs = require('fs');

// 1. Add Loader2 to MealPlanView
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/components/MealPlanView/index.js';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('Loader2')) {
  content = content.replace(
    "import { Flame, ChevronDown, ShoppingCart } from 'lucide-react';",
    "import { Flame, ChevronDown, ShoppingCart, Loader2 } from 'lucide-react';"
  );
  
  content = content.replace(
    "const [openDay, setOpenDay] = useState(1);",
    "const [openDay, setOpenDay] = useState(1);\n  const [loggingMeal, setLoggingMeal] = useState(null);"
  );

  content = content.replace(
    "const logMeal = async (meal) => {",
    "const logMeal = async (meal, index) => {\n    setLoggingMeal(index);"
  );

  content = content.replace(
    "} else {\n      window.appAlert('Failed to log meal.');\n    }\n  };",
    "} else {\n      window.appAlert('Failed to log meal.');\n    }\n    setLoggingMeal(null);\n  };"
  );

  // The button is inside `meals.map((meal, i) => (`. So `i` is the index but it is relative to the day.
  // Wait, let's use `${day.dayNumber}-${i}` as the index identifier.
  content = content.replace(
    "const logMeal = async (meal, index) => {",
    "const logMeal = async (meal, mealId) => {\n    setLoggingMeal(mealId);"
  );
  
  content = content.replace(
    "<button onClick={() => logMeal(meal)} style={{ marginTop: '12px', background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>\n                      + Log to Tracker\n                    </button>",
    "<button onClick={() => logMeal(meal, `${day.dayNumber}-${i}`)} disabled={loggingMeal === `${day.dayNumber}-${i}`} style={{ marginTop: '12px', background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', opacity: loggingMeal === `${day.dayNumber}-${i}` ? 0.7 : 1 }}>\n                      {loggingMeal === `${day.dayNumber}-${i}` ? <Loader2 size={16} className=\"spin\" style={{ animation: 'spin 1s linear infinite' }} /> : '+'} {loggingMeal === `${day.dayNumber}-${i}` ? 'Logging...' : 'Log to Tracker'}\n                    </button>"
  );

  // Add the keyframes for spin directly or assume global CSS has `.spin`
  fs.writeFileSync(path, content, 'utf8');
}
