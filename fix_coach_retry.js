const fs = require('fs');
const path = 'C:/Users/A_bisoye/Desktop/REPForge-phase7-formcheck/app/coach/page.js';
let content = fs.readFileSync(path, 'utf8');

const searchStr = `        if (!res.ok) {
          setError(data.error || 'The coach ran into an error.');
          return;
        }`;

const replaceStr = `        if (!res.ok) {
          setError(data.error || 'The coach ran into an error.');
          setMessages((prev) => prev.slice(0, -1));
          setInput(content);
          if (currentAttachment) setAttachment(currentAttachment);
          return;
        }`;

const searchStrCatch = `      } catch (e) {
        setError('Could not reach the AI coach. Check your connection and try again.');
      }`;

const replaceStrCatch = `      } catch (e) {
        setError('Could not reach the AI coach. Check your connection and try again.');
        setMessages((prev) => prev.slice(0, -1));
        setInput(content);
        if (currentAttachment) setAttachment(currentAttachment);
      }`;

content = content.replace(searchStr, replaceStr);
content = content.replace(searchStrCatch, replaceStrCatch);

fs.writeFileSync(path, content, 'utf8');
console.log("Updated coach error handling");
