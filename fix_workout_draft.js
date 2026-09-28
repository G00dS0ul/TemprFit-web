const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/workouts/new/page.js';
let content = fs.readFileSync(path, 'utf8');

const draftLogic = `  const [browseResults, setBrowseResults] = useState([]);

  // Draft feature
  useEffect(() => {
    const draft = localStorage.getItem('workout_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.name) setName(parsed.name);
        if (parsed.goal) setGoal(parsed.goal);
        if (parsed.exercises && parsed.exercises.length > 0) setExercises(parsed.exercises);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (name || exercises.length > 0) {
      localStorage.setItem('workout_draft', JSON.stringify({ name, goal, exercises }));
    }
  }, [name, goal, exercises]);`;

content = content.replace(
  "const [browseResults, setBrowseResults] = useState([]);",
  draftLogic
);

content = content.replace(
  "if (!res.ok) throw new Error(data.error);",
  "if (!res.ok) throw new Error(data.error);\n      localStorage.removeItem('workout_draft');"
);

fs.writeFileSync(path, content, 'utf8');
