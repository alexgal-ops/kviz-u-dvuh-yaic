// Проверка файла категории: node tools/check-category.js categories/<id>.js
const fs = require("fs"), path = require("path");
const file = process.argv[2];
if (!file) { console.log("usage: node tools/check-category.js categories/<id>.js"); process.exit(2); }
const root = path.join(__dirname, "..");
global.KVIZ_CATS = [];
try { eval(fs.readFileSync(file, "utf8")); } catch (e) { console.log("SYNTAX: " + e.message); process.exit(1); }
const c = KVIZ_CATS[0], errs = [], warn = [];
if (!c) { console.log("файл не вызывает KVIZ_CATS.push"); process.exit(1); }
const need = (o, k, where) => { if (o[k] === undefined || o[k] === "") errs.push(`${where}: нет поля ${k}`); };
["id", "name", "sub", "title", "lead", "pics", "tiebreak", "rounds"].forEach(k => need(c, k, "категория"));
if (path.basename(file, ".js") !== c.id) errs.push(`id "${c.id}" не совпадает с именем файла`);
const img = p => { if (!p) return; const f = path.join(root, p);
  if (!fs.existsSync(f)) errs.push(`нет файла ${p}`);
  else if (fs.statSync(f).size > 700 * 1024) warn.push(`${p}: ${Math.round(fs.statSync(f).size / 1024)} КБ, лучше уменьшить`);
  if (!p.startsWith(`img/${c.id}/`)) errs.push(`${p}: картинка не в img/${c.id}/`); };
(c.pics || []).forEach(img);
if ((c.pics || []).length !== 2) errs.push("pics: нужно 2 картинки");
const plan = [["choice", 7], ["image", 7], ["emoji", 7], ["open", 7], ["bet", 6], ["box", 3]];
(c.rounds || []).forEach((r, ri) => {
  const w = `раунд ${ri + 1}`;
  ["name", "kind", "time", "pts", "intro", "qs"].forEach(k => need(r, k, w));
  if (!plan[ri] || r.kind !== plan[ri][0]) errs.push(`${w}: kind ${r.kind}, ожидался ${plan[ri] && plan[ri][0]}`);
  if (plan[ri] && r.qs && r.qs.length !== plan[ri][1]) errs.push(`${w}: ${r.qs.length} вопросов, нужно ${plan[ri][1]}`);
  (r.qs || []).forEach((q, qi) => {
    const wq = `${w}, вопрос ${qi + 1}`;
    need(q, "a", wq);
    if (r.kind === "choice") { need(q, "q", wq); if (!Array.isArray(q.o) || q.o.length !== 4) errs.push(`${wq}: нужно 4 варианта`); if (!(q.a >= 0 && q.a <= 3)) errs.push(`${wq}: a — индекс 0–3`); }
    if (r.kind === "image") { need(q, "q", wq); need(q, "img", wq); need(q, "fx", wq); img(q.img); }
    if (r.kind === "emoji") { need(q, "e", wq); need(q, "hint", wq); }
    if (r.kind === "open" || r.kind === "bet") need(q, "q", wq);
    if (r.kind === "box") { if (!Array.isArray(q.hints) || q.hints.length !== 3) errs.push(`${wq}: нужно 3 подсказки`); img(q.img); }
    if (q.g && !(c.tags && c.tags[q.g])) errs.push(`${wq}: тег ${q.g} не описан в tags`);
  });
});
if ((c.rounds || []).length !== 6) errs.push(`раундов ${(c.rounds || []).length}, нужно 6`);
if (!(c.rounds || [])[2] || !c.rounds[2].breakAfter) warn.push("у 3-го раунда нет breakAfter:true");
if (c.tiebreak && !/\d/.test(String(c.tiebreak.a))) errs.push("tiebreak: ответ должен быть числом");
const n = (c.rounds || []).reduce((s, r) => s + (r.qs || []).length, 0);
console.log(`${c.id}: ${(c.rounds || []).length} раундов, ${n} вопросов`);
warn.forEach(x => console.log("  ~ " + x));
errs.forEach(x => console.log("  ✗ " + x));
console.log(errs.length ? `ОШИБОК: ${errs.length}` : "OK");
process.exit(errs.length ? 1 : 0);
