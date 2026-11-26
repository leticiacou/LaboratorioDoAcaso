'use strict';
/* =====================================================
   Laboratório do Acaso — lógica do jogo
   ===================================================== */

/* ===== utilidades ===== */
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = a => a[rand(0, a.length - 1)];
const shuffle = a => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = rand(0, i); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const sum = a => a.reduce((s, x) => s + x, 0);
const gcd = (a, b) => b ? gcd(b, a % b) : a;
const reduce = (n, d) => { const g = gcd(n, d) || 1; return { n: n / g, d: d / g }; };
const pctTxt = (n, d) => (Math.round(n / d * 1000) / 10).toLocaleString('pt-BR') + '%';
const fmt = (n, d) => { if (d === 100) return pctTxt(n, d); const r = reduce(n, d); return r.n + '/' + r.d + ' = ' + pctTxt(n, d); };
const eq = (n, d) => { const r = reduce(n, d); return d === 100 ? `${n}% = ${pctTxt(n, d)}`.replace(/^(\d+)% = \1(,\d)?%$/, '$1%') : `${n}/${d} = ` + (r.n === n ? '' : `${r.n}/${r.d} = `) + pctTxt(n, d); };
const key = (n, d) => { const r = reduce(n, d); return r.n + '/' + r.d; };
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const joinList = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1];
const wpick = (items, weights) => { let r = Math.random() * sum(weights); for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r < 0) return items[i]; } return items[items.length - 1]; };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const BALL = { azul: '#3a86ff', vermelha: '#ef233c', amarela: '#ffc914', verde: '#2ec4b6' };
const BALL_PL = { azul: 'azuis', vermelha: 'vermelhas', amarela: 'amarelas', verde: 'verdes' };
const WCOL = { azul: '#3a86ff', verde: '#2ec4b6', amarelo: '#ffc914', vermelho: '#ef233c' };

const PHASES = [
  { name: 'Dado equilibrado', icon: '🎲', color: '#ffc914', goal: 'Analise o dado: conte as faces que cumprem a condição (casos favoráveis) e divida pelo total de faces (casos possíveis).' },
  { name: 'Urna colorida', icon: '🏺', color: '#2ec4b6', goal: 'Some todas as bolas da urna para achar o total e compare com a quantidade da cor pedida.' },
  { name: 'Cartas e evento complementar', icon: '🃏', color: '#ff6b9d', goal: 'A chance de um evento acontecer e a de ele não acontecer somam 100%. Calcule o que resta.' },
  { name: 'Roleta desigual', icon: '🎡', color: '#ff9f1c', goal: 'Os setores têm tamanhos diferentes. Setores maiores têm maior chance de ser sorteados.' },
  { name: 'Retirada sem reposição', icon: '🧪', color: '#9b7bff', goal: 'A bola retirada não volta para a urna. A segunda probabilidade muda porque o total e as quantidades diminuem.' }
];
const PER_PHASE = 3;

/* opções de resposta: 1 correta + 3 distratores plausíveis */
function makeOptions(cn, cd, wrongs) {
  const seen = new Set([key(cn, cd)]); const out = [];
  for (const [n, d] of shuffle(wrongs)) {
    if (!(n > 0 && d > 0 && n < d)) continue;
    const k = key(n, d); if (seen.has(k)) continue;
    seen.add(k); out.push([n, d]); if (out.length === 3) break;
  }
  let t = 0;
  while (out.length < 3 && t++ < 400) {
    const d = cd === 100 ? 100 : rand(Math.max(2, cd - 2), cd + 4);
    const n = cd === 100 ? rand(1, 19) * 5 : rand(1, d - 1);
    const k = key(n, d); if (seen.has(k)) continue;
    seen.add(k); out.push([n, d]);
  }
  return shuffle([[cn, cd, true], ...out.map(([n, d]) => [n, d, false])]).map(([n, d, c]) => ({ html: fmt(n, d), correct: c }));
}

/* ===== Fase 1: dado ===== */
const DICE = [
  { n: 6, t: 'sair um número par', f: x => x % 2 === 0 },
  { n: 6, t: 'sair um número ímpar', f: x => x % 2 === 1 },
  { n: 6, t: 'sair um número maior que 4', f: x => x > 4 },
  { n: 6, t: 'sair um múltiplo de 3', f: x => x % 3 === 0 },
  { n: 6, t: 'sair um número primo', f: x => [2, 3, 5].includes(x) },
  { n: 6, t: 'sair um número menor que 3', f: x => x < 3 },
  { n: 6, t: 'sair um número diferente de 6', f: x => x !== 6 },
  { n: 8, t: 'sair um múltiplo de 4', f: x => x % 4 === 0 },
  { n: 8, t: 'sair um número maior que 5', f: x => x > 5 },
  { n: 8, t: 'sair um número par', f: x => x % 2 === 0 },
  { n: 10, t: 'sair um múltiplo de 5', f: x => x % 5 === 0 }
];
function genDice() {
  return shuffle(DICE).slice(0, PER_PHASE).map(q => {
    const faces = [...Array(q.n)].map((_, i) => i + 1);
    const fav = faces.filter(q.f); const f = fav.length, t = q.n;
    return {
      type: 'dice', phase: 1, n: t, test: q.f,
      q: `Em um dado equilibrado de ${t} faces, qual é a probabilidade de ${q.t}?`,
      options: makeOptions(f, t, [[f + 1, t], [f - 1, t], [t - f, t], [f, t + 1], [1, t], [f, t - f]]),
      reason: { fav: f, tot: t },
      hint: `Escreva as faces de 1 a ${t} e marque as que cumprem a condição. O total de casos possíveis é ${t}.`,
      explain: `Casos favoráveis: ${fav.join(', ')} (${f}). Casos possíveis: ${t}.<br>Probabilidade: ${eq(f, t)}.`
    };
  });
}

/* ===== Fase 2: urna colorida ===== */
function genUrn() {
  return [0, 1, 2].map(i => {
    const k = i === 2 ? 4 : 3;
    const names = shuffle(Object.keys(BALL)).slice(0, k);
    let counts; do { counts = names.map(() => rand(1, 6)); } while (sum(counts) < 7 || sum(counts) > 14);
    const t = sum(counts);
    const two = i === 2;
    const target = two ? [names[0], names[1]] : [names[0]];
    const f = sum(target.map(n => counts[names.indexOf(n)]));
    const label = target.join(' ou ');
    const list = joinList(names.map((n, j) => `${counts[j]} ${counts[j] === 1 ? 'bola ' + n : 'bolas ' + BALL_PL[n]}`));
    return {
      type: 'urn', phase: 2, scene: 'urn',
      balls: names.map((n, j) => ({ name: n, count: counts[j] })),
      test: n => target.includes(n),
      q: `Uma urna tem ${list}. Qual é a probabilidade de retirar uma bola ${label}?`,
      options: makeOptions(f, t, [[f, t - f], [t - f, t], [f + 1, t], [f - 1, t], [f, t + 1], [1, t]]),
      reason: { fav: f, tot: t },
      hint: `Some todas as bolas para achar o total de casos possíveis. Depois conte só as bolas ${label}.`,
      explain: `Total de bolas: ${counts.join(' + ')} = ${t}.<br>Bolas ${label}: ${f}.<br>Probabilidade: ${eq(f, t)}.`
    };
  });
}

/* ===== Fase 3: cartas e evento complementar ===== */
function genCards() {
  const p = pick([10, 15, 20, 25, 30, 35, 40, 45, 60, 65, 70, 75, 80]);
  const A = {
    type: 'cards', phase: 3, scene: 'pct', p, pSpecial: p / 100,
    q: `Se a probabilidade de retirar uma carta especial é ${p}%, qual é a probabilidade de não retirar uma carta especial?`,
    options: makeOptions(100 - p, 100, [[p, 100], [100 - p + 10, 100], [100 - p - 10, 100], [100 - p + 5, 100], [100 - p - 5, 100], [p + 10, 100]]),
    reason: { fav: 100 - p, tot: 100 },
    hint: 'Os dois eventos (sair e não sair carta especial) juntos somam 100%. Subtraia de 100%.',
    explain: `Evento complementar: 100% − ${p}% = ${100 - p}%.<br>${p}% + ${100 - p}% = 100%.`
  };
  const N = pick([10, 12, 16, 20, 25, 40]); const k = rand(2, Math.floor(N / 3));
  const B = {
    type: 'cards', phase: 3, scene: 'deck', N, k, pSpecial: k / N,
    q: `Um baralho do jogo tem ${N} cartas, e ${k} são especiais. Qual é a probabilidade de retirar uma carta que não seja especial?`,
    options: makeOptions(N - k, N, [[k, N], [N - k + 1, N], [N - k - 1, N], [N - k, N - 1], [N - k, N + k]]),
    reason: { fav: N - k, tot: N },
    hint: 'Quantas cartas não são especiais? Esse é o número de casos favoráveis. O total é o número de cartas do baralho.',
    explain: `Cartas comuns: ${N} − ${k} = ${N - k}.<br>P(não especial) = ${eq(N - k, N)}.<br>Conferindo: P(especial) = ${fmt(k, N)}, e as duas somam 100%.`
  };
  const b = pick([4, 5, 8, 10]); const a = rand(1, b - 1);
  const C = {
    type: 'cards', phase: 3, scene: 'frac', a, b, pSpecial: a / b,
    q: `A chance de retirar uma carta especial é ${a}/${b}. Qual é a probabilidade de não retirar uma carta especial?`,
    options: makeOptions(b - a, b, [[a, b], [b - a + 1, b], [b - a - 1, b], [b - a, b + 1], [1, b]]),
    reason: { fav: b - a, tot: b },
    hint: 'O total de casos é o denominador. Subtraia do todo (1 = ' + b + '/' + b + ') a fração dada.',
    explain: `1 − ${a}/${b} = ${b}/${b} − ${a}/${b} = ${eq(b - a, b)}.`
  };
  return [A, B, C];
}

/* ===== Fase 4: roleta desigual ===== */
const SETS_VIS = [[50, 30, 20], [60, 30, 10], [40, 30, 20, 10], [70, 20, 10], [45, 35, 20], [50, 40, 10]];
const SETS_SUM = [[50, 30, 20], [40, 35, 25], [45, 30, 25], [40, 30, 20, 10], [35, 30, 20, 15]];
function makeSectors(set) {
  const names = shuffle(Object.keys(WCOL)).slice(0, set.length);
  return shuffle(set).map((v, i) => ({ name: names[i], v, color: WCOL[names[i]] }));
}
const swatch = s => `<i class="sw" style="background:${s.color}"></i>${cap(s.name)}`;
function genWheel() {
  const mk = most => {
    const sectors = makeSectors(pick(SETS_VIS));
    const target = sectors.reduce((a, s) => (most ? s.v > a.v : s.v < a.v) ? s : a);
    return {
      type: 'wheel', phase: 4, sectors, show: false,
      q: `Na roleta, qual setor tem a ${most ? 'maior' : 'menor'} probabilidade de ser sorteado?`,
      options: shuffle(sectors).map(s => ({ html: swatch(s), correct: s === target })),
      reason: null,
      hint: `Compare o tamanho dos arcos: o ${most ? 'maior' : 'menor'} setor tem a ${most ? 'maior' : 'menor'} chance.`,
      explain: `Medidas dos setores: ${sectors.map(s => `${s.name} ${s.v}%`).join(', ')}.<br>O setor ${target.name} (${target.v}%) é o ${most ? 'maior' : 'menor'}, então tem a ${most ? 'maior' : 'menor'} probabilidade.`,
      note: 'A roleta é desigual: o sorteio pode parar em qualquer setor, mas o setor maior aparece com mais frequência em muitas repetições.'
    };
  };
  const sectors = makeSectors(pick(SETS_SUM));
  const [A, B] = shuffle(sectors).slice(0, 2); const s = A.v + B.v;
  const C = {
    type: 'wheel', phase: 4, sectors, show: true,
    q: `Qual é a probabilidade de a roleta parar no setor ${A.name} ou no setor ${B.name}?`,
    options: makeOptions(s, 100, [[s + 10, 100], [s - 10, 100], [s + 5, 100], [s - 5, 100], [A.v, 100], [B.v, 100], [100 - s, 100]]),
    reason: { fav: s, tot: 100 },
    hint: 'Os setores não se sobrepõem. Some a chance dos dois setores.',
    explain: `${cap(A.name)}: ${A.v}% e ${B.name}: ${B.v}%.<br>${A.v}% + ${B.v}% = ${s}%.`,
    sumCheck: [A.name, B.name]
  };
  return [mk(true), mk(false), C];
}

/* ===== Fase 5: retirada sem reposição ===== */
function genSeq() {
  return [0, 1, 2].map(i => {
    const [c1, c2] = shuffle(Object.keys(BALL)).slice(0, 2);
    const x = rand(2, 5), y = rand(1, 4), t = x + y, d = t - 1;
    const type = i === 0 ? 'same' : i === 1 ? 'other' : pick(['same', 'other']);
    const f = type === 'same' ? x - 1 : y;
    const qtd = (n, c) => `${n} ${n === 1 ? 'bola ' + c : 'bolas ' + BALL_PL[c]}`;
    return {
      type: 'seq', phase: 5, c1, c2,
      balls: [{ name: c1, count: x }, { name: c2, count: y }],
      rem: [{ name: c1, count: x - 1 }, { name: c2, count: y }],
      test: n => (type === 'same' ? n === c1 : n === c2),
      q: `Uma urna tem ${qtd(x, c1)} e ${qtd(y, c2)}. O jogador retira uma bola ${c1} e não a devolve. Qual é a probabilidade de ${type === 'same' ? 'retirar outra bola ' + c1 : 'a segunda bola ser ' + c2}?`,
      options: makeOptions(f, d, [[f, t], [f + 1, d], [f - 1, d], [f, d + 1], [d - f, d]]),
      reason: { fav: f, tot: d },
      hint: `Depois da primeira retirada, quantas bolas restam no total? E quantas bolas ${type === 'same' ? c1 : c2} restam?`,
      explain: `Antes: ${qtd(x, c1)} e ${qtd(y, c2)} (total ${t}).<br>Depois de retirar uma ${c1} sem devolver: restam ${qtd(x - 1, c1)} e ${qtd(y, c2)}, ou seja, ${d} bolas no total.<br>Probabilidade da segunda: ${eq(f, d)}.<br>A segunda retirada depende da primeira (evento dependente).`
    };
  });
}

const GENS = [genDice, genUrn, genCards, genWheel, genSeq];
function buildAll() { return GENS.flatMap(g => g()); }

/* ===== UI ===== */
/* ===== estado ===== */
let G = null;
const $ = s => document.querySelector(s);
const FAST = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const MAX_ENERGY = 100, ERR_COST = 15;

function newGame() {
  G = { ch: buildAll(), i: 0, score: 0, energy: MAX_ENERGY, streak: 0, best: 0, errors: 0, hints: 0, phasesDone: 0, introFor: -1, snap: { score: 0, i: 0 }, over: false, won: false };
  show('game'); renderBoard(); updateHud(); loadStep();
}

function show(name) {
  $('#screenStart').hidden = name !== 'start';
  $('#screenGame').hidden = name !== 'game';
  $('#screenEnd').hidden = name !== 'end';
  $('#top').hidden = name === 'start';
  window.scrollTo(0, 0);
  if (name === 'start') updateBest();
  if (name === 'game') requestAnimationFrame(placeToken);
}

function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 3200); }

function updateHud() {
  $('#hudScore').textContent = G.score;
  $('#hudEnergy').textContent = G.energy;
  $('#hudEnergyBar').style.width = G.energy + '%';
  document.querySelector('.stat.energy').classList.toggle('low', G.energy <= 30);
  $('#hudStreak').textContent = G.streak;
  $('#hudHints').textContent = G.hints;
  const solved = G.ch.filter(c => c.solved).length;
  const pct = Math.round(solved / G.ch.length * 100);
  $('#stabBar').style.width = pct + '%'; $('#stabPct').textContent = pct + '%';
}

/* ===== tabuleiro ===== */
function renderBoard() {
  const board = $('#board');
  [...board.querySelectorAll('.tile')].forEach(t => t.remove());
  G.ch.forEach((c, i) => {
    const ph = PHASES[c.phase - 1];
    const row = Math.floor(i / 5), col = row % 2 === 0 ? i % 5 : 4 - i % 5;
    const t = document.createElement('div');
    t.className = 'tile' + (i < G.i ? ' done' : '') + (i === G.i && !G.over ? ' current' : '');
    t.style.setProperty('--c', ph.color); t.style.gridRow = row + 1; t.style.gridColumn = col + 1;
    t.innerHTML = `<span class="ic">${ph.icon}</span><small>${i + 1}</small>`;
    t.dataset.i = i; t.title = `Fase ${c.phase}: ${ph.name}`;
    board.appendChild(t);
  });
  $('#legend').innerHTML = PHASES.map((p, k) => `<li style="--c:${p.color}" class="${Math.floor(G.i / PER_PHASE) >= k ? 'on' : ''}">${p.icon} ${k + 1}. ${p.name}</li>`).join('');
  placeToken();
}
function placeToken() {
  const tok = $('#token'); if (!G) return;
  const i = Math.min(G.i, G.ch.length - 1);
  const tile = $('#board').querySelector(`.tile[data-i="${i}"]`); if (!tile) return;
  tok.style.left = (tile.offsetLeft + tile.offsetWidth / 2 - tok.offsetWidth / 2) + 'px';
  tok.style.top = (tile.offsetTop + tile.offsetHeight / 2 - tok.offsetHeight / 2) + 'px';
}
window.addEventListener('resize', placeToken);

/* ===== fluxo ===== */
function loadStep() {
  if (G.i % PER_PHASE === 0 && G.introFor !== G.i) renderIntro(); else renderChallenge();
}

function renderIntro() {
  const ph = PHASES[G.ch[G.i].phase - 1], n = G.ch[G.i].phase;
  $('#panel').innerHTML = `
    <div class="intro">
      <span class="chip" style="background:${ph.color}">Fase ${n} de ${PHASES.length}</span>
      <div class="big-ic" aria-hidden="true">${ph.icon}</div>
      <h2>${ph.name}</h2>
      <p>${ph.goal}</p>
      <p class="formula">Probabilidade = casos favoráveis ÷ casos possíveis</p>
      <p>Esta fase tem ${PER_PHASE} missões. Cada erro custa ${ERR_COST} de energia.</p>
      <button class="btn primary big" id="btnEnter">Entrar na fase</button>
    </div>`;
  $('#btnEnter').onclick = () => { G.introFor = G.i; G.snap = { score: G.score, i: G.i }; renderChallenge(); };
}

function sceneHTML(ch) {
  const balls = list => list.map(b => Array.from({ length: b.count }, () => `<span class="ball" style="background:${BALL[b.name]}"></span>`).join('')).join('');
  const chips = list => `<div class="chips">${list.map(b => `<span><i class="ball" style="background:${BALL[b.name]}"></i>${b.name} × ${b.count}</span>`).join('')}</div>`;
  if (ch.type === 'dice') return `<div class="faces">${Array.from({ length: ch.n }, (_, i) => `<span class="face">${i + 1}</span>`).join('')}</div><p>Dado equilibrado de ${ch.n} faces: todas têm a mesma chance.</p>`;
  if (ch.type === 'urn') return `<div class="urn"><div class="balls">${balls(ch.balls)}</div></div>${chips(ch.balls)}`;
  if (ch.type === 'cards') {
    if (ch.scene === 'pct') return `<div class="bigPct">${ch.p}%</div><p>chance de retirar uma carta especial</p>`;
    if (ch.scene === 'frac') return `<div class="bigPct">${ch.a}/${ch.b}</div><p>chance de retirar uma carta especial</p>`;
    const deck = Array.from({ length: ch.N }, (_, i) => `<span class="pcard ${i < ch.k ? 'sp' : ''}">${i < ch.k ? '★' : ''}</span>`).join('');
    return `<div class="deck">${deck}</div><p>${ch.N} cartas: ${ch.k} especiais (★) e ${ch.N - ch.k} comuns.</p>`;
  }
  if (ch.type === 'wheel') {
    let acc = 0; const stops = ch.sectors.map(s => { const a = acc; acc += s.v * 3.6; return `${s.color} ${a}deg ${acc}deg`; }).join(',');
    const legend = ch.show ? `<div class="chips">${ch.sectors.map(s => `<span>${swatch(s)} ${s.v}%</span>`).join('')}</div>` : `<div class="chips">${ch.sectors.map(s => `<span>${swatch(s)}</span>`).join('')}</div><p>Os tamanhos dos setores contam a história.</p>`;
    return `<div class="wheelWrap"><div class="wheel" id="wheel" style="background:conic-gradient(${stops})"></div></div>${legend}`;
  }
  if (ch.type === 'seq') return `<div class="urn"><div class="balls">${balls(ch.balls)}</div></div>${chips(ch.balls)}<div class="outside">1ª retirada: <span class="ball" style="background:${BALL[ch.c1]}"></span> bola ${ch.c1} (fora da urna, não devolvida)</div>`;
  return '';
}

function renderChallenge() {
  const ch = G.ch[G.i], ph = PHASES[ch.phase - 1];
  ch.wrong = []; ch.hintUsed = false; ch.done = false;
  $('#panel').innerHTML = `
    <span class="chip" style="background:${ph.color}">${ph.icon} Fase ${ch.phase} · missão ${G.i % PER_PHASE + 1} de ${PER_PHASE}</span>
    <h2 class="q">${ch.q}</h2>
    <div class="scene">${sceneHTML(ch)}</div>
    ${ch.reason ? `<div class="reason"><p><b>Monte o cálculo</b> (opcional, +30 pontos): escreva os casos antes de simplificar.</p>
      <div class="row"><label>Casos favoráveis<input id="inFav" type="number" min="0" inputmode="numeric"></label><span class="div">÷</span><label>Casos possíveis<input id="inTot" type="number" min="0" inputmode="numeric"></label></div></div>` : ''}
    <div class="opts">${ch.options.map((o, k) => `<button class="opt" data-k="${k}">${o.html}</button>`).join('')}</div>
    <div class="tools"><button class="btn small" id="btnHint">Usar dica</button></div>
    <p class="hintBox" id="hintBox" hidden></p>
    <div class="fb" id="fb" role="status" aria-live="polite"></div>
    <div id="drawBox"></div><div id="explain"></div><div id="nextRow"></div>`;
  $('#panel').querySelectorAll('.opt').forEach(b => b.onclick = () => answer(+b.dataset.k));
  $('#btnHint').onclick = useHint;
  renderBoard();
}

function useHint() {
  const ch = G.ch[G.i]; if (ch.done) return;
  if (!ch.hintUsed) { ch.hintUsed = true; G.hints++; updateHud(); }
  const hb = $('#hintBox'); hb.hidden = false; hb.textContent = '💡 ' + ch.hint;
  $('#btnHint').disabled = true; $('#btnHint').textContent = 'Dica usada';
}

function answer(k) {
  const ch = G.ch[G.i]; if (ch.done || G.over || ch.wrong.includes(k)) return;
  const btns = [...$('#panel').querySelectorAll('.opt')]; const fb = $('#fb');
  if (!ch.options[k].correct) {
    ch.wrong.push(k); G.errors++; G.streak = 0; G.energy = Math.max(0, G.energy - ERR_COST);
    btns[k].classList.add('wrong'); btns[k].disabled = true;
    fb.className = 'fb bad'; fb.textContent = `Resposta incorreta: −${ERR_COST} de energia. Revise os casos favoráveis e possíveis e tente de novo.`;
    updateHud();
    if (G.energy <= 0) { G.over = true; setTimeout(() => endGame(false), 1000); }
    return;
  }
  ch.done = true; ch.solved = true;
  btns.forEach((b, j) => { b.disabled = true; if (j === k) b.classList.add('right'); });
  const clean = !ch.hintUsed && ch.wrong.length === 0;
  const items = [['Resposta correta', 100]];
  if (clean) {
    G.streak++; G.best = Math.max(G.best, G.streak);
    items.push(['Cálculo correto sem dica', 50]);
    if (G.streak > 1) items.push([`Sequência de ${G.streak} acertos`, Math.min(50, (G.streak - 1) * 10)]);
  } else {
    G.streak = 0;
    items.push([ch.hintUsed ? 'Bônus reduzido (dica usada)' : 'Bônus reduzido (houve erro)', ch.hintUsed ? 10 : 25]);
  }
  if (ch.reason) {
    const fv = $('#inFav'), tv = $('#inTot');
    if (fv.value !== '' && +fv.value === ch.reason.fav && +tv.value === ch.reason.tot) items.push(['Raciocínio explicado', 30]);
    fv.disabled = tv.disabled = true;
  }
  const total = sum(items.map(x => x[1])); G.score += total;
  fb.className = 'fb ok';
  fb.innerHTML = `<strong>Correto! +${total} pontos</strong><ul>${items.map(x => `<li>${x[0]}: +${x[1]}</li>`).join('')}</ul>`;
  $('#btnHint').disabled = true;
  $('#drawBox').innerHTML = `<button class="btn primary big" id="btnDraw">Realizar sorteio</button>`;
  $('#btnDraw').onclick = doDraw;
  updateHud();
}

/* ===== sorteios ===== */
const DRAW = {
  async dice(ch, f) {
    for (let i = 0; i < (FAST ? 2 : 14); i++) { f.textContent = rand(1, ch.n); await sleep(60 + i * 12); }
    const v = rand(1, ch.n); f.textContent = v;
    return `Saiu ${v}. ${ch.test(v) ? 'O evento aconteceu.' : 'O evento não aconteceu.'}`;
  },
  async urn(ch, f) { return ballDraw(ch, f, ch.balls, 'Saiu uma bola'); },
  async seq(ch, f) { return ballDraw(ch, f, ch.rem, 'A segunda bola foi'); },
  async cards(ch, f) {
    for (let i = 0; i < (FAST ? 2 : 10); i++) { f.textContent = i % 2 ? 'Especial' : 'Comum'; f.classList.toggle('sp', i % 2 === 1); await sleep(80 + i * 15); }
    const sp = Math.random() < ch.pSpecial;
    f.textContent = sp ? '★ Especial' : 'Comum'; f.classList.toggle('sp', sp);
    return `Saiu uma carta ${sp ? 'especial' : 'comum'}. O evento "não retirar carta especial" ${sp ? 'não aconteceu' : 'aconteceu'}.`;
  },
  async wheel(ch, f) {
    f.hidden = true;
    const a = Math.random() * 360, R = 360 * 5 + (360 - a);
    $('#wheel').style.transform = `rotate(${R}deg)`;
    await sleep(FAST ? 200 : 3400);
    let acc = 0, hit = ch.sectors[ch.sectors.length - 1];
    for (const s of ch.sectors) { acc += s.v * 3.6; if (a < acc) { hit = s; break; } }
    ch.hit = hit;
    return `A roleta parou no setor ${hit.name} (chance de ${hit.v}%).`;
  }
};
async function ballDraw(ch, f, items, lead) {
  f.className = 'drawFace ball-big';
  for (let i = 0; i < (FAST ? 2 : 12); i++) { f.style.background = BALL[pick(items).name]; await sleep(70 + i * 12); }
  const b = wpick(items, items.map(x => x.count)); f.style.background = BALL[b.name];
  return `${lead} ${b.name}. ${ch.test(b.name) ? 'Era a cor pedida.' : 'Não era a cor pedida.'}`;
}

async function doDraw() {
  const ch = G.ch[G.i];
  $('#drawBox').innerHTML = `<div class="draw"><div class="drawFace" id="dFace">?</div><p id="dText">Sorteando…</p></div>`;
  const text = await DRAW[ch.type](ch, $('#dFace'));
  $('#dText').textContent = text;
  const good = ch.options.find(o => o.correct).html;
  const cmp = ch.note || `A chance calculada era <b>${good}</b>. O sorteio mostra só um resultado possível; se a jogada fosse repetida muitas vezes, a frequência do evento se aproximaria desse valor.`;
  $('#explain').innerHTML = `<div class="explain"><h3>Como se calcula</h3><p>${ch.explain}</p><p>${cmp}</p></div>`;
  const lastOfPhase = G.i % PER_PHASE === PER_PHASE - 1, lastAll = G.i === G.ch.length - 1;
  $('#nextRow').innerHTML = `<button class="btn primary big" id="btnNext">${lastAll ? 'Estabilizar a máquina' : lastOfPhase ? 'Concluir fase e avançar' : 'Próxima missão'}</button>`;
  $('#btnNext').onclick = next; $('#btnNext').focus({ preventScroll: false });
}

function next() {
  if (G.i % PER_PHASE === PER_PHASE - 1) {
    G.score += 150; G.energy = Math.min(MAX_ENERGY, G.energy + 10); G.phasesDone++;
    toast(`Fase ${G.ch[G.i].phase} concluída: +150 pontos e +10 de energia`);
  }
  G.i++;
  if (G.i >= G.ch.length) { updateHud(); renderBoard(); setTimeout(() => endGame(true), 900); return; }
  updateHud(); renderBoard(); loadStep();
}

/* ===== fim de jogo ===== */
function rank(won, acc) {
  if (!won) return 'Aprendiz em treinamento';
  if (acc >= 90 && G.hints <= 1) return 'Mestre do Acaso';
  if (acc >= 75) return 'Cientista da Probabilidade';
  if (acc >= 55) return 'Explorador Calculista';
  return 'Estagiário do Laboratório';
}
function bestScore() { try { return +localStorage.getItem('labAcasoBest') || 0; } catch (e) { return 0; } }
function updateBest() { const b = bestScore(); $('#bestLine').textContent = b ? `Melhor pontuação neste aparelho: ${b}` : ''; }

function endGame(won) {
  G.over = true; G.won = won;
  const solved = G.ch.filter(c => c.solved).length;
  const acc = solved + G.errors ? Math.round(solved / (solved + G.errors) * 100) : 0;
  try { if (G.score > bestScore()) localStorage.setItem('labAcasoBest', G.score); } catch (e) { }
  $('#screenEnd').innerHTML = `
    <h2>${won ? 'Máquina estabilizada!' : 'A energia acabou'}</h2>
    <p class="rank">${won ? 'Todas as fases foram concluídas.' : 'A máquina continua instável. Refaça a fase e tente de novo.'} Classificação: ${rank(won, acc)}</p>
    <div class="stats">
      <div><span>Pontuação total</span><b>${G.score}</b></div>
      <div><span>Porcentagem de acertos</span><b>${acc}%</b></div>
      <div><span>Fases concluídas</span><b>${G.phasesDone} de ${PHASES.length}</b></div>
      <div><span>Erros cometidos</span><b>${G.errors}</b></div>
      <div><span>Dicas utilizadas</span><b>${G.hints}</b></div>
      <div><span>Energia restante</span><b>${G.energy}</b></div>
      <div><span>Maior sequência</span><b>${G.best}</b></div>
    </div>
    <div class="btn-row" style="justify-content:center">
      <button class="btn primary big" id="eAgain">Jogar novamente</button>
      <button class="btn" id="eRestart">Reiniciar partida</button>
      <button class="btn" id="eMenu">Voltar ao menu</button>
      <button class="btn" id="eConcepts">Consultar conceitos</button>
    </div>`;
  $('#eAgain').onclick = newGame;
  $('#eRestart').onclick = restartMission;
  $('#eMenu').onclick = () => show('start');
  $('#eConcepts').onclick = () => $('#dlgConcepts').showModal();
  show('end');
}

/* recomeça a fase em que o jogador parou, com energia cheia */
function restartMission() {
  if (G.won) { newGame(); return; }
  const start = G.snap.i, phase = G.ch[start].phase;
  G.ch.splice(start, PER_PHASE, ...GENS[phase - 1]());
  G.i = start; G.score = G.snap.score; G.energy = MAX_ENERGY; G.streak = 0;
  G.phasesDone = Math.floor(start / PER_PHASE); G.over = false; G.introFor = -1;
  show('game'); renderBoard(); updateHud(); loadStep();
}

/* ===== eventos ===== */
$('#btnStart').onclick = newGame;
$('#btnRules').onclick = () => $('#dlgRules').showModal();
$('#btnConcepts').onclick = () => $('#dlgConcepts').showModal();
$('#btnConceptsTop').onclick = () => $('#dlgConcepts').showModal();
$('#btnResetTop').onclick = () => { if (confirm('Começar uma nova partida? O progresso atual será perdido.')) newGame(); };

/* dado de demonstração na tela inicial */
(function () {
  let n = 0, even = 0, busy = false;
  const die = $('#heroDie');
  die.onclick = async () => {
    if (busy) return; busy = true; die.classList.add('rolling');
    for (let i = 0; i < (FAST ? 1 : 8); i++) { die.textContent = rand(1, 6); await sleep(70); }
    const v = rand(1, 6); die.textContent = v; die.classList.remove('rolling');
    n++; if (v % 2 === 0) even++;
    $('#dieNote').textContent = `${n} lançamento${n > 1 ? 's' : ''}: ${even} par${even === 1 ? '' : 'es'} (${Math.round(even / n * 100)}%). A probabilidade teórica é 3/6 = 50%.`;
    busy = false;
  };
})();
updateBest();
