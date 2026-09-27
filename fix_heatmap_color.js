const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/components/ActivityHeatmap/index.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix the color: Green for workout, maybe Blue for other activities
content = content.replace(
  "const isGreen = dayObj.count > 0 || dayObj.meals > 0 || waterLogs[dayObj.dateStr] || sleepLogs[dayObj.dateStr];",
  "const isWorkout = dayObj.count > 0;\n              const isOther = !isWorkout && (dayObj.meals > 0 || waterLogs[dayObj.dateStr] || sleepLogs[dayObj.dateStr]);"
);

// We need to change the CSS class applied.
content = content.replace(
  "className={`${styles.day} ${isGreen ? styles.activeDay : ''}`}",
  "className={`${styles.day} ${isWorkout ? styles.activeDay : isOther ? styles.otherDay : ''}`}"
);

// We also need to change the condition for making it clickable
content = content.replace(
  "onClick={() => { if (isGreen) setSelectedDay(dayObj) }}",
  "onClick={() => { if (isWorkout || isOther) setSelectedDay(dayObj) }}"
);
content = content.replace(
  "style={{ cursor: isGreen ? 'pointer' : 'default' }}",
  "style={{ cursor: (isWorkout || isOther) ? 'pointer' : 'default' }}"
);

// 2. Fix the timezone issue (new Date('YYYY-MM-DD') -> new Date('YYYY-MM-DDT12:00:00Z'))
content = content.replace(
  "{new Date(selectedDay.dateStr).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}",
  "{new Date(selectedDay.dateStr + 'T12:00:00Z').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}"
);

fs.writeFileSync(path, content, 'utf8');
