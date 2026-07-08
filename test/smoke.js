const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync('index.html', 'utf8');

// stub canvas 2d + AudioContext + rAF before scripts run
const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  resources: undefined,
  beforeParse(window) {
    const ctxStub = new Proxy({}, { get: (t, p) => {
      if (p === 'canvas') return null;
      return (...a) => { if (p === 'createLinearGradient') return { addColorStop(){} }; return undefined; };
    }, set: () => true });
    window.HTMLCanvasElement.prototype.getContext = () => ctxStub;
    window.requestAnimationFrame = fn => setTimeout(fn, 16);
    window.cancelAnimationFrame = id => clearTimeout(id);
    window.AudioContext = class {
      constructor(){ this.currentTime = 0; this.state='running'; this.destination={}; this.sampleRate=44100; }
      resume(){} suspend(){}
      createGain(){ return { gain:{value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}}, connect(){} }; }
      createDynamicsCompressor(){ return { threshold:{value:0}, ratio:{value:0}, connect(){} }; }
      createDelay(){ return { delayTime:{value:0}, connect(){} }; }
      createOscillator(){ return { type:'', frequency:{value:0}, connect(){}, start(){}, stop(){}, onended:null }; }
      createBuffer(){ return { getChannelData(){ return new Float32Array(882); } }; }
      createBufferSource(){ return { buffer:null, connect(){}, start(){} }; }
      createBiquadFilter(){ return { type:'', frequency:{value:0}, Q:{value:0}, connect(){} }; }
    };
    window.onerror = (msg, src, line, col, err) => { console.log('WINDOW ERROR:', msg, 'line', line, err && err.stack); process.exitCode = 1; };
  },
});

setTimeout(() => {
  const w = dom.window;
  const errs = [];
  try {
    // simulate: enter hall
    w.document.getElementById('enterBtn').click();
    const active = w.document.querySelector('.screen.active');
    if (active.id !== 'screen-select') errs.push('did not switch to select, got ' + active.id);
    // wait for async init then check song cards
    setTimeout(() => {
      // re-render since init is async
      const cards = w.document.querySelectorAll('.progRow');
      console.log('song cards rendered:', cards.length);
      if (cards.length < 7) { console.log('FAIL: expected 7 cards (6 songs + upload)'); process.exitCode = 1; }
      // click first song -> difficulty modal
      cards[0].click();
      const modal = w.document.getElementById('modal');
      if (!modal.classList.contains('open')) { console.log('FAIL: modal did not open'); process.exitCode = 1; }
      const rows = w.document.querySelectorAll('.diffRow');
      console.log('difficulty rows:', rows.length);
      if (rows.length !== 4) { console.log('FAIL: expected 4 diff rows'); process.exitCode = 1; }
      // start a game
      rows[1].click();
      const activeNow = w.document.querySelector('.screen.active');
      console.log('after start:', activeNow.id);
      if (activeNow.id !== 'screen-game') { console.log('FAIL: game did not start'); process.exitCode = 1; }
      // let a few frames run, simulate keypress
      setTimeout(() => {
        w.document.dispatchEvent(new w.window.KeyboardEvent('keydown', { key: 'f' }));
        console.log(errs.length || process.exitCode ? 'SMOKE ISSUES' : 'SMOKE OK');
        process.exit(process.exitCode || 0);
      }, 300);
    }, 400);
  } catch (e) {
    console.log('SMOKE EXCEPTION:', e.stack);
    process.exit(1);
  }
}, 300);
