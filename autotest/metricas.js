// Métricas de calidad de traducción: BLEU (1-4 gramas) y chrF (6-gramas de
// caracteres). Se usan para medir la calidad del corpus de forma objetiva y
// detectar regresiones al cambiar el glosario/correcciones.

function normalizar(s) {
  return (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
function tokenizar(s) {
  return normalizar(s).match(/[a-z0-9]+/g) || [];
}
function ngramasArr(arr, n) {
  const g = [];
  for (let i = 0; i + n <= arr.length; i++) g.push(arr.slice(i, i + n).join(" "));
  return g;
}
function ngramasChar(s, n) {
  s = normalizar(s);
  const g = [];
  for (let i = 0; i + n <= s.length; i++) g.push(s.substr(i, n));
  return g.length ? g : [""];
}
function contar(arr) {
  const m = {};
  arr.forEach((x) => (m[x] = (m[x] || 0) + 1));
  return m;
}

function bleuOracion(hyp, ref) {
  const h = tokenizar(hyp), r = tokenizar(ref);
  if (!h.length) return 0;
  const bp = h.length >= r.length ? 1 : Math.exp(1 - r.length / h.length);
  let logsum = 0;
  for (let n = 1; n <= 4; n++) {
    const hg = contar(ngramasArr(h, n)), rg = contar(ngramasArr(r, n));
    let c = 0;
    Object.keys(hg).forEach((k) => (c += Math.min(hg[k], rg[k] || 0)));
    const tot = Object.keys(hg).reduce((a, k) => a + hg[k], 0);
    const prec = tot === 0 ? 1e-9 : c / tot;
    logsum += Math.log(prec || 1e-9);
  }
  return bp * Math.exp(logsum / 4);
}

function chrfOracion(hyp, ref, n, beta) {
  n = n || 6; beta = beta || 2;
  const hg = ngramasChar(hyp, n), rg = ngramasChar(ref, n);
  const hm = contar(hg), rm = contar(rg);
  let overlap = 0;
  Object.keys(hm).forEach((k) => (overlap += Math.min(hm[k], rm[k] || 0)));
  const P = hg.length ? overlap / hg.length : 0;
  const R = rg.length ? overlap / rg.length : 0;
  if (P + R === 0) return 0;
  return ((1 + beta * beta) * P * R) / (beta * beta * P + R);
}

function metricasCorpus(pares) {
  let total = { 1: 0, 2: 0, 3: 0, 4: 0 }, hypc = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let hypLen = 0, refLen = 0, chOverlap = 0, chHyp = 0, chRef = 0;
  pares.forEach((p) => {
    const h = tokenizar(p.hyp), r = tokenizar(p.ref);
    hypLen += h.length; refLen += r.length;
    for (let n = 1; n <= 4; n++) {
      const hg = contar(ngramasArr(h, n)), rg = contar(ngramasArr(r, n));
      let c = 0;
      Object.keys(hg).forEach((k) => (c += Math.min(hg[k], rg[k] || 0)));
      total[n] += c;
      hypc[n] += Object.keys(hg).reduce((a, k) => a + hg[k], 0);
    }
    const hc = ngramasChar(p.hyp, 6), rc = ngramasChar(p.ref, 6);
    const hm = contar(hc), rm = contar(rc);
    let ov = 0;
    Object.keys(hm).forEach((k) => (ov += Math.min(hm[k], rm[k] || 0)));
    chOverlap += ov; chHyp += hc.length; chRef += rc.length;
  });
  const bp = hypLen >= refLen ? 1 : Math.exp(1 - refLen / hypLen);
  let logsum = 0;
  for (let n = 1; n <= 4; n++) {
    const prec = hypc[n] ? total[n] / hypc[n] : 1e-9;
    logsum += Math.log(prec || 1e-9);
  }
  const bleu = bp * Math.exp(logsum / 4);
  const P = chHyp ? chOverlap / chHyp : 0;
  const R = chRef ? chOverlap / chRef : 0;
  const chrf = P + R ? ((1 + 4) * P * R) / (4 * P + R) : 0;
  return { bleu, chrf };
}

module.exports = { normalizar, tokenizar, bleuOracion, chrfOracion, metricasCorpus };
