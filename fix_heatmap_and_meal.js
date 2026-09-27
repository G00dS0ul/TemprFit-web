const fs = require('fs');

// 1. Fix Heatmap Date Bug
const heatmapPath = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/components/ActivityHeatmap/index.js';
let heatmapContent = fs.readFileSync(heatmapPath, 'utf8');

heatmapContent = heatmapContent.replace(
  "const dateStr = d.toISOString().split('T')[0];",
  "const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;"
);

fs.writeFileSync(heatmapPath, heatmapContent, 'utf8');

// 2. Add "Done with today's meals" in MealPlanView
const mealPlanPath = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/components/MealPlanView/index.js';
let mealPlanContent = fs.readFileSync(mealPlanPath, 'utf8');

if (!mealPlanContent.includes('logWholeDay')) {
  // Add useEffect to load/save openDay
  mealPlanContent = mealPlanContent.replace(
    "const [openDay, setOpenDay] = useState(1);",
    "const [openDay, setOpenDay] = useState(1);\n  const [loggingDay, setLoggingDay] = useState(false);\n\n  import('react').then((React) => {\n    React.useEffect(() => {\n      const saved = localStorage.getItem('temprfit_ai_plan_day');\n      if (saved) setOpenDay(parseInt(saved) || 1);\n    }, []);\n    React.useEffect(() => {\n      localStorage.setItem('temprfit_ai_plan_day', openDay);\n    }, [openDay]);\n  });"
  );
  
  // Add logWholeDay function
  mealPlanContent = mealPlanContent.replace(
    "const logMeal = async (meal, mealId) => {",
    "const logWholeDay = async (day) => {\n    setLoggingDay(true);\n    try {\n      for (const meal of day.meals) {\n        await fetch('/api/nutrition/log', {\n          method: 'POST',\n          headers: { 'Content-Type': 'application/json' },\n          body: JSON.stringify({\n            mealType: meal.mealType.toLowerCase(),\n            servings: 1,\n            date: new Date().toISOString().split('T')[0],\n            rawFood: {\n              name: meal.name,\n              calories: meal.calories,\n              protein: meal.protein,\n              carbs: meal.carbs,\n              fat: meal.fat\n            }\n          })\n        });\n      }\n      window.appAlert(`Successfully logged all meals for Day ${day.dayNumber}!`);\n      if (day.dayNumber < 7) setOpenDay(day.dayNumber + 1);\n    } catch (e) {\n      window.appAlert('Failed to log day.');\n    }\n    setLoggingDay(false);\n  };\n\n  const logMeal = async (meal, mealId) => {"
  );

  // Add the button at the bottom of the meals map
  mealPlanContent = mealPlanContent.replace(
    "</div>\n            )}\n          </div>\n        );\n      })}",
    "</div>\n                <button onClick={() => logWholeDay(day)} disabled={loggingDay} style={{ width: '100%', marginTop: '16px', background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: loggingDay ? 0.7 : 1 }}>\n                  {loggingDay ? <Loader2 size={18} className=\"spin\" style={{ animation: 'spin 1s linear infinite' }} /> : null} {loggingDay ? 'Logging Entire Day...' : `Done with Day ${day.dayNumber} Meals`}\n                </button>\n              </div>\n            )}\n          </div>\n        );\n      })}"
  );

  fs.writeFileSync(mealPlanPath, mealPlanContent, 'utf8');
}
