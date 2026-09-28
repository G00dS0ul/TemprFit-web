const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/lib/gemini.js';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `  if (!res.ok) {
    const bodyText = await res.text().catch(() => '')
    console.error(\`[Gemini] API error \${res.status}:\`, bodyText.slice(0, 1000))
    throw new GeminiRequestError(\`Gemini API error (\${res.status}): \${bodyText.slice(0, 300)}\`)
  }`;

const replacementStr = `  if (res.status === 503) {
    console.error('[Gemini] 503 API error');
    throw new GeminiRequestError("The AI coach is currently busy experiencing high demand. Please try again in a few moments!");
  }

  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    console.error(\`[Gemini] API error \${res.status}:\`, bodyText.slice(0, 1000));
    // Provide a friendly error for users if they see it
    let userMsg = "The AI coach ran into an unexpected error. Please try again.";
    if (res.status === 500) userMsg = "The AI server encountered an internal issue. Please try again later.";
    if (res.status === 400) userMsg = "There was an issue with your request to the AI. Please modify it and try again.";
    throw new GeminiRequestError(userMsg);
  }`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync(path, content, 'utf8');
console.log("Updated gemini.js friendly errors");
