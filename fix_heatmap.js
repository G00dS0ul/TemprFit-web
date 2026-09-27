const fs = require('fs');

// 1. Update /api/stats/route.js
const statsPath = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/api/stats/route.js';
let statsContent = fs.readFileSync(statsPath, 'utf8');

if (!statsContent.includes('MealLog.find')) {
  statsContent = statsContent.replace(
    "import Exercise from '@/models/Exercise'",
    "import Exercise from '@/models/Exercise'\nimport MealLog from '@/models/MealLog'"
  );
  
  statsContent = statsContent.replace(
    "const activityHeatmap = [];",
    "const mealLogs = await MealLog.find({ user: user._id }).lean();\n  const activityHeatmap = [];"
  );
  
  statsContent = statsContent.replace(
    "heatmapMap[dateStr].count += 1;",
    "heatmapMap[dateStr].count += 1;\n      heatmapMap[dateStr].meals = 0;"
  );

  statsContent = statsContent.replace(
    "for (const [date, data] of Object.entries(heatmapMap))",
    "mealLogs.forEach(m => {\n    if (!m.date) return;\n    const dateStr = new Date(m.date).toISOString().split('T')[0];\n    if (!heatmapMap[dateStr]) {\n      heatmapMap[dateStr] = { count: 0, exercises: new Set(), meals: 0 };\n    }\n    heatmapMap[dateStr].meals = (heatmapMap[dateStr].meals || 0) + 1;\n  });\n\n  for (const [date, data] of Object.entries(heatmapMap))"
  );

  statsContent = statsContent.replace(
    "activityHeatmap.push({ date, count: data.count, exercises: Array.from(data.exercises) });",
    "activityHeatmap.push({ date, count: data.count, exercises: Array.from(data.exercises), meals: data.meals || 0 });"
  );
  
  fs.writeFileSync(statsPath, statsContent, 'utf8');
}

// 2. Update components/ActivityHeatmap/index.js
const heatmapPath = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/components/ActivityHeatmap/index.js';
let heatmapContent = fs.readFileSync(heatmapPath, 'utf8');

if (!heatmapContent.includes('waterLogs')) {
  heatmapContent = heatmapContent.replace(
    "const [selectedDay, setSelectedDay] = useState(null);",
    "const [selectedDay, setSelectedDay] = useState(null);\n  const [waterLogs, setWaterLogs] = useState({});\n  const [sleepLogs, setSleepLogs] = useState({});\n\n  React.useEffect(() => {\n    try {\n      const savedWater = JSON.parse(localStorage.getItem('temprfit_water_logs') || '[]');\n      const wMap = {};\n      savedWater.forEach(l => wMap[l.date] = l.amountMl);\n      setWaterLogs(wMap);\n\n      const savedSleep = JSON.parse(localStorage.getItem('temprfit_sleep_logs') || '[]');\n      const sMap = {};\n      savedSleep.forEach(l => sMap[l.date] = { hours: l.hours, quality: l.quality });\n      setSleepLogs(sMap);\n    } catch(e) {}\n  }, []);"
  );

  heatmapContent = heatmapContent.replace(
    "const count = dataMap[dateStr] ? dataMap[dateStr].count : 0;",
    "const count = dataMap[dateStr] ? dataMap[dateStr].count : 0;\n      const meals = dataMap[dateStr] ? dataMap[dateStr].meals : 0;"
  );

  heatmapContent = heatmapContent.replace(
    "currentWeek.push({ day, dateStr, count, exercises });",
    "currentWeek.push({ day, dateStr, count, exercises, meals });"
  );

  heatmapContent = heatmapContent.replace(
    "const isGreen = dayObj.count > 0;",
    "const isGreen = dayObj.count > 0 || dayObj.meals > 0 || waterLogs[dayObj.dateStr] || sleepLogs[dayObj.dateStr];"
  );

  heatmapContent = heatmapContent.replace(
    "{selectedDay.count} Session(s) Completed\n            </p>",
    "{selectedDay.count} Session(s) Completed\n            </p>\n            {selectedDay.meals > 0 && <p style={{ color: 'var(--color-primary)', fontWeight: 'bold', margin: '0 0 16px 0' }}>{selectedDay.meals} Meal(s) Logged</p>}\n            {waterLogs[selectedDay.dateStr] && <p style={{ color: '#3b82f6', fontWeight: 'bold', margin: '0 0 16px 0' }}>Water Logged: {waterLogs[selectedDay.dateStr]} ml</p>}\n            {sleepLogs[selectedDay.dateStr] && <p style={{ color: '#8b5cf6', fontWeight: 'bold', margin: '0 0 16px 0' }}>Sleep Logged: {sleepLogs[selectedDay.dateStr].hours}h ({sleepLogs[selectedDay.dateStr].quality})</p>}"
  );

  fs.writeFileSync(heatmapPath, heatmapContent, 'utf8');
}
