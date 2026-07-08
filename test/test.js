const { JSDOM } = require('jsdom');
global.DOMParser = new JSDOM().window.DOMParser;
const g = require('../src/game.js');

let fails = 0;
function ok(cond, msg) { if (!cond) { console.log('FAIL: ' + msg); fails++; } else console.log('ok: ' + msg); }

// --- builtins sanity ---
for (const s of g.BUILTIN_SONGS) {
  const ev = g.songEvents(s);
  ok(ev.length > 40, s.id + ' has ' + ev.length + ' events');
  ok(ev.every(e => e.t >= 0 && e.midi >= 21 && e.midi <= 108), s.id + ' events valid');
  ok(ev.every((e, i) => i === 0 || e.t >= ev[i-1].t), s.id + ' sorted');
  for (const d of ['easy','normal','hard','virtuoso']) {
    const c = g.buildChart(ev, d);
    ok(c.length > 20, s.id + '/' + d + ' chart ' + c.length + ' notes');
    ok(c.every(n => n.lane >= 0 && n.lane <= 3), s.id + '/' + d + ' lanes 0-3');
    // lane gap check
    const cfg = g.DIFF_CONFIG[d];
    const lastL = [-9,-9,-9,-9]; let gapOK = true;
    for (const n of c) { if (n.t - lastL[n.lane] < cfg.laneGap - 1e-9) gapOK = false; lastL[n.lane] = n.t; }
    ok(gapOK, s.id + '/' + d + ' lane gaps respected');
    const st = g.chartStats(c);
    ok(st.stars >= 1 && st.stars <= 5, s.id + '/' + d + ' stars=' + st.stars + ' nps=' + st.nps.toFixed(2));
  }
  const m = g.songMeta({events: ev});
  console.log('  ' + s.id + ': ' + m.duration.toFixed(1) + 's, ' + m.noteCount + ' notes, stars ' + m.starLo + '-' + m.starHi);
}

// --- MIDI parser: fmt0, tpq 480, tempo 500000, C4 q, E4 q ---
function vlq(n){const b=[n&0x7f];while(n>>=7)b.unshift((n&0x7f)|0x80);return b;}
const track = [
  0x00, 0xFF, 0x51, 0x03, 0x07, 0xA1, 0x20,      // tempo 500000 (120bpm)
  0x00, 0x90, 60, 100,                            // C4 on
  ...vlq(480), 0x80, 60, 0,                       // C4 off after 1 beat
  0x00, 0x90, 64, 100,                            // E4 on
  ...vlq(480), 0x80, 64, 0,                       // E4 off
  0x00, 0xFF, 0x2F, 0x00,                         // end of track
];
const hdr = [0x4D,0x54,0x68,0x64, 0,0,0,6, 0,0, 0,1, (480>>8)&0xff, 480&0xff];
const trkHdr = [0x4D,0x54,0x72,0x6B, (track.length>>24)&0xff,(track.length>>16)&0xff,(track.length>>8)&0xff,track.length&0xff];
const midiBytes = new Uint8Array([...hdr, ...trkHdr, ...track]);
const mid = g.parseMIDI(midiBytes.buffer, 'test.mid');
ok(mid.events.length === 2, 'MIDI 2 events, got ' + mid.events.length);
ok(Math.abs(mid.events[0].t - 0) < 0.001 && mid.events[0].midi === 60, 'MIDI note1 t=0 C4');
ok(Math.abs(mid.events[1].t - 0.5) < 0.001 && mid.events[1].midi === 64, 'MIDI note2 t=0.5 E4, got t=' + mid.events[1].t);
ok(Math.abs(mid.events[0].dur - 0.5) < 0.001, 'MIDI dur 0.5');
ok(mid.bpmHint === 120, 'MIDI bpm 120');

// --- MusicXML: chord, tie, backup, tempo ---
const xml = `<?xml version="1.0"?>
<score-partwise version="3.1">
 <work><work-title>Test Piece</work-title></work>
 <part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
 <part id="P1">
  <measure number="1">
   <attributes><divisions>2</divisions></attributes>
   <direction><sound tempo="120"/></direction>
   <note><pitch><step>C</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice></note>
   <note><chord/><pitch><step>E</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice></note>
   <note><pitch><step>G</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><tie type="start"/></note>
   <backup><duration>4</duration></backup>
   <note><pitch><step>C</step><octave>3</octave></pitch><duration>4</duration><voice>2</voice></note>
  </measure>
  <measure number="2">
   <note><pitch><step>G</step><octave>4</octave></pitch><duration>2</duration><voice>1</voice><tie type="stop"/></note>
   <note><rest/><duration>2</duration><voice>1</voice></note>
  </measure>
 </part>
</score-partwise>`;
const mx = g.parseMusicXML(xml, 'test.xml');
ok(mx.title === 'Test Piece', 'XML title, got ' + mx.title);
ok(mx.bpmHint === 120, 'XML bpm 120');
// expected: C4(60)@0, E4(64)@0 chord, C3(48)@0 voice2, G4(67)@1 tied dur 1.5 beats = 1.0s+0.5s... at 120bpm beat=0.5s: G4 @ t=0.5, dur 0.75+... let's just check pitches/count
ok(mx.events.length === 4, 'XML 4 events, got ' + mx.events.length + ' ' + JSON.stringify(mx.events));
const midis = mx.events.map(e=>e.midi).sort((a,b)=>a-b);
ok(JSON.stringify(midis) === JSON.stringify([48,60,64,67]), 'XML pitches ' + JSON.stringify(midis));
const g4 = mx.events.find(e=>e.midi===67);
ok(Math.abs(g4.t - 0.5) < 0.01, 'G4 at t=0.5, got ' + g4.t);
ok(Math.abs(g4.dur - 1.0) < 0.02, 'G4 tied dur=1.0s (2 beats @120), got ' + g4.dur);

console.log(fails ? ('\n' + fails + ' FAILURES') : '\nALL TESTS PASSED');
process.exit(fails ? 1 : 0);
