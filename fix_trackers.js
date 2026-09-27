const fs = require('fs');

const waterPath = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/components/WaterTracker.js';
let waterContent = fs.readFileSync(waterPath, 'utf8');
waterContent = waterContent.replace('title={Water Intake History}', 'title="Water Intake History"');
fs.writeFileSync(waterPath, waterContent, 'utf8');

const sleepPath = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/components/SleepTracker.js';
if (fs.existsSync(sleepPath)) {
  let sleepContent = fs.readFileSync(sleepPath, 'utf8');
  sleepContent = sleepContent.replace('title={Sleep History}', 'title="Sleep History"');
  fs.writeFileSync(sleepPath, sleepContent, 'utf8');
}
