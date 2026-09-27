const fs = require('fs');

// 1. Update /api/nutrition/log/route.js
const logRoutePath = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/api/nutrition/log/route.js';
let logContent = fs.readFileSync(logRoutePath, 'utf8');

if (!logContent.includes('rawFood')) {
  logContent = logContent.replace(
    "const { foodId, mealType, servings, date } = body",
    "const { foodId, mealType, servings, date, rawFood } = body"
  );

  logContent = logContent.replace(
    "if (!foodId) return NextResponse.json({ error: 'foodId is required.' }, { status: 400 })",
    "if (!foodId && !rawFood) return NextResponse.json({ error: 'foodId or rawFood is required.' }, { status: 400 })"
  );

  logContent = logContent.replace(
    "const food = await Food.findById(foodId).lean()\n  if (!food) return NextResponse.json({ error: 'Food not found.' }, { status: 404 })",
    "let food;\n  if (foodId) {\n    food = await Food.findById(foodId).lean();\n  } else if (rawFood) {\n    food = await Food.create({\n      name: rawFood.name || 'AI Generated Meal',\n      source: 'manual',\n      calories: rawFood.calories || 0,\n      protein: rawFood.protein || 0,\n      carbs: rawFood.carbs || 0,\n      fat: rawFood.fat || 0,\n      servingSize: 1,\n      servingUnit: 'meal'\n    });\n  }\n  if (!food) return NextResponse.json({ error: 'Food not found.' }, { status: 404 });"
  );
  
  fs.writeFileSync(logRoutePath, logContent, 'utf8');
}

// 2. Update components/MealPlanView/index.js
const mealPlanPath = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/components/MealPlanView/index.js';
let mealPlanContent = fs.readFileSync(mealPlanPath, 'utf8');

if (!mealPlanContent.includes('logMeal')) {
  // Add a function to log the meal
  mealPlanContent = mealPlanContent.replace(
    "export default function MealPlanView({ plan }) {",
    "export default function MealPlanView({ plan }) {\n  const logMeal = async (meal) => {\n    const res = await fetch('/api/nutrition/log', {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({\n        mealType: meal.mealType.toLowerCase(),\n        servings: 1,\n        date: new Date().toISOString().split('T')[0],\n        rawFood: {\n          name: meal.name,\n          calories: meal.calories,\n          protein: meal.protein,\n          carbs: meal.carbs,\n          fat: meal.fat\n        }\n      })\n    });\n    if (res.ok) {\n      window.appAlert('Successfully logged to today\\'s tracker!');\n    } else {\n      window.appAlert('Failed to log meal.');\n    }\n  };"
  );

  // Add the log button to each meal
  mealPlanContent = mealPlanContent.replace(
    "<span>{meal.fat}g F</span>\n                    </div>\n                  </div>",
    "<span>{meal.fat}g F</span>\n                    </div>\n                    <button onClick={() => logMeal(meal)} style={{ marginTop: '12px', background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>\n                      + Log to Tracker\n                    </button>\n                  </div>"
  );

  fs.writeFileSync(mealPlanPath, mealPlanContent, 'utf8');
}
