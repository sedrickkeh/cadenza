// Assembles src/shell.html + src/game.js into a single playable index.html
const fs = require('fs');
const shell = fs.readFileSync('src/shell.html', 'utf8');
const js = fs.readFileSync('src/game.js', 'utf8');
if (js.includes('</scr' + 'ipt>')) { console.error('game.js contains a closing script tag'); process.exit(1); }
fs.writeFileSync('index.html', shell.replace('/*__GAME_JS__*/', () => js));
console.log('Built index.html:', fs.statSync('index.html').size, 'bytes');
