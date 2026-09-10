const payload = {
  goal: "Build Muscle",
  experience: "Beginner",
  equipment: "Full Gym",
  daysPerWeek: 4
};

fetch('http://localhost:3001/api/workouts/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
