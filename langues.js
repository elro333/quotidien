// ============================================================
// langues.js — l'onglet Langues : italien, allemand, anglais
//
// Des cartes, comme des fiches bristol : le mot d'un côté,
// la traduction de l'autre. On revoit chaque carte au bon moment
// (répétition espacée) : si tu la savais, elle revient plus tard
// (1, 2, 4, 7, 15, 30, 60 jours) ; sinon, elle revient demain.
// Les listes de mots sont dans mots.js.
// En allemand, en plus : « der, die, das ? » et les déclinaisons.
// ============================================================

const LANGUES = {
  it: { nom: "Italien", drapeau: "🇮🇹", mots: MOTS_IT, parJour: 5, couleur: "#34c759" },
  de: { nom: "Allemand", drapeau: "🇩🇪", mots: MOTS_DE, parJour: 3, couleur: "#ff9500" },
  en: { nom: "Anglais", drapeau: "🇬🇧", mots: MOTS_EN, parJour: 3, couleur: "#007aff" },
};
const INTERVALLES = [1, 2, 4, 7, 15, 30, 60];

// ---------- Les données ----------
// { it: { cartes: { "12": { b: 0-6, p: "2026-11-23", vu: "2026-11-22" } }, parJour }, … , jours: { "2026-11-22": true } }
const CLE_LANGUES = "quotidien.langues.v1";
let langues = (() => {
  try { return JSON.parse(localStorage.getItem(CLE_LANGUES)) || {}; } catch (e) { return {}; }
})();
for (const k of Object.keys(LANGUES)) langues[k] ||= { cartes: {} };
langues.jours ||= {};
function enregistrerLangues() {
  try { localStorage.setItem(CLE_LANGUES, JSON.stringify(langues)); } catch (e) {}
}

let langueActive = "it";
let modeAllemand = "cartes"; // "cartes" | "articles" | "declinaisons"
let carteRetournee = false;

// ---------- Ce qu'il y a à faire aujourd'hui ----------
function aReviser(l) {
  const auj = aujourdhui();
  const d = langues[l];
  const dues = Object.entries(d.cartes).filter(([, c]) => c.p <= auj).sort((a, b) => a[1].p.localeCompare(b[1].p)).map(([i]) => Number(i));
  const nouveauxDuJour = Object.values(d.cartes).filter((c) => c.vu === auj).length;
  const quota = Math.max(0, (d.parJour || LANGUES[l].parJour) - nouveauxDuJour);
  const nouveaux = [];
  for (let i = 0; i < LANGUES[l].mots.length && nouveaux.length < quota; i++) if (!d.cartes[i]) nouveaux.push(i);
  return { dues, nouveaux, file: [...dues, ...nouveaux] };
}
const totalAReviser = () => Object.keys(LANGUES).reduce((t, l) => t + aReviser(l).file.length, 0);

function repondre(l, i, savais) {
  const auj = aujourdhui();
  const c = langues[l].cartes[i] || { b: 0, vu: auj };
  c.b = savais ? Math.min(c.b + 1, INTERVALLES.length - 1) : 0;
  c.p = ajouterJours(auj, savais ? INTERVALLES[c.b] : 1);
  langues[l].cartes[i] = c;
  langues.jours[auj] = true;
  carteRetournee = false;
  enregistrerLangues();
  afficher();
}

// La série : jours d'affilée avec au moins une carte révisée
function serieLangues() {
  let jour = aujourdhui();
  if (!langues.jours[jour]) jour = ajouterJours(jour, -1);
  let n = 0;
  while (langues.jours[jour] && n < 3650) { n++; jour = ajouterJours(jour, -1); }
  return n;
}

// ---------- Dessiner ----------
function afficherLangues() {
  document.getElementById("sous-titre").textContent = jolieDate(aujourdhui());
  document.querySelectorAll("#segment-langues button").forEach((b) => {
    b.classList.toggle("active", b.dataset.langue === langueActive);
    const n = aReviser(b.dataset.langue).file.length;
    b.textContent = `${LANGUES[b.dataset.langue].drapeau} ${LANGUES[b.dataset.langue].nom}` + (n ? ` · ${n}` : "");
  });
  document.getElementById("modes-allemand").hidden = langueActive !== "de";
  document.querySelectorAll("#modes-allemand button").forEach((b) => b.classList.toggle("active", b.dataset.mode === modeAllemand));

  const zone = document.getElementById("zone-langue");
  zone.replaceChildren();
  if (langueActive === "de" && modeAllemand === "articles") return dessinerArticles(zone);
  if (langueActive === "de" && modeAllemand === "declinaisons") return dessinerDeclinaisons(zone);
  dessinerCartes(zone);
}

function dessinerCartes(zone) {
  const l = langueActive;
  const L = LANGUES[l];
  const { dues, nouveaux, file } = aReviser(l);
  const d = langues[l];

  // La carte du moment
  const carte = el("div", "verre focus carte-mot");
  if (!file.length) {
    carte.classList.add("vide");
    carte.append(el("span", "grand-emoji", "🎉"), "Tout est révisé pour aujourd'hui !");
    const plus = el("button", "btn-secondaire", `${L.parJour} mots de plus`);
    plus.addEventListener("click", () => {
      d.parJour = (d.parJour || L.parJour) + L.parJour;
      enregistrerLangues();
      afficher();
    });
    if (Object.keys(d.cartes).length < L.mots.length) {
      const b = el("div", "boutons");
      b.append(plus);
      carte.append(b);
    }
  } else {
    const i = file[0];
    const [mot, trad, exemple] = L.mots[i];
    const nouveau = !d.cartes[i];
    carte.append(el("div", "etiquette", nouveau ? `Nouveau mot · ${L.drapeau}` : `À revoir · ${L.drapeau}`));
    carte.lastChild.style.color = L.couleur;
    carte.append(el("div", "mot-langue", mot));
    if (carteRetournee) {
      carte.append(el("div", "trad-langue", trad));
      if (exemple) carte.append(el("div", "exemple-langue", exemple));
      const boutons = el("div", "boutons");
      const non = el("button", "btn-secondaire", "😅 À revoir");
      non.addEventListener("click", () => repondre(l, i, false));
      const oui = el("button", "btn-principal", "✓ Je savais");
      oui.style.background = L.couleur;
      oui.addEventListener("click", () => repondre(l, i, true));
      boutons.append(non, oui);
      carte.append(boutons);
    } else {
      const voir = el("button", "btn-principal", "Voir la traduction");
      voir.style.background = L.couleur;
      voir.addEventListener("click", () => { carteRetournee = true; afficher(); });
      const b = el("div", "boutons");
      b.append(voir);
      carte.append(b);
    }
    carte.append(el("p", "petit compteur-langue", `${file.length} carte${file.length > 1 ? "s" : ""} aujourd'hui · ${dues.length} à revoir, ${nouveaux.length} nouvelle${nouveaux.length > 1 ? "s" : ""}`));
  }
  zone.append(carte);

  // Où j'en suis
  const vus = Object.keys(d.cartes).length;
  const maitrises = Object.values(d.cartes).filter((c) => c.b >= 4).length;
  const s = serieLangues();
  const stats = el("div", "verre bloc stats-positifs");
  const deux = el("div", "deux-totaux");
  const a = el("div"); a.append(el("span", "petit", "Mots vus"), el("strong", "", `${vus} / ${L.mots.length}`));
  const b = el("div"); b.append(el("span", "petit", "Bien retenus"), el("strong", "", String(maitrises)));
  deux.append(a, b);
  stats.append(deux);
  if (s >= 2) stats.append(el("p", "serie", `🔥 ${s} jours de suite`));
  stats.querySelectorAll("strong").forEach((x) => (x.style.color = L.couleur));
  zone.append(stats);

  // Mes mots
  const details = el("details", "faites");
  details.append(el("summary", "", `Mes mots · ${vus}`));
  const ul = el("ul", "liste verre");
  for (const [i, c] of Object.entries(d.cartes).sort((x, y) => y[1].vu.localeCompare(x[1].vu))) {
    const [mot, trad] = L.mots[i] || ["?", ""];
    const li = el("li");
    const infos = el("div", "infos");
    infos.append(el("div", "t", mot), el("div", "m", trad));
    li.append(infos, el("span", "niveau-mot", "●".repeat(c.b + 1)));
    ul.append(li);
  }
  if (vus) details.append(ul);
  zone.append(details);
}

// ---------- Allemand : der, die, das ? ----------
const nomsAllemands = MOTS_DE.map((m, i) => [i, m]).filter(([, m]) => /^(der|die|das) /.test(m[0]));
let questionArticle = null, reponseArticle = null, scoreArticles = { bons: 0, total: 0 };

function nouvelleQuestionArticle() {
  questionArticle = nomsAllemands[Math.floor(Math.random() * nomsAllemands.length)][1];
  reponseArticle = null;
}
function dessinerArticles(zone) {
  if (!questionArticle) nouvelleQuestionArticle();
  const [motComplet, trad] = questionArticle;
  const [article, ...reste] = motComplet.split(" ");
  const nom = reste.join(" ");
  const carte = el("div", "verre focus carte-mot");
  carte.append(el("div", "etiquette", "Der, die oder das ?"));
  carte.lastChild.style.color = "#ff9500";
  carte.append(el("div", "mot-langue", (reponseArticle ? article + " " : "___ ") + nom));
  carte.append(el("div", "trad-langue", trad));
  const boutons = el("div", "boutons boutons-articles");
  for (const a of ["der", "die", "das"]) {
    const b = el("button", "btn-secondaire", a);
    if (reponseArticle) {
      if (a === article) b.classList.add("bonne");
      else if (a === reponseArticle) b.classList.add("mauvaise");
    }
    b.addEventListener("click", () => {
      if (reponseArticle) return;
      reponseArticle = a;
      scoreArticles.total++;
      if (a === article) scoreArticles.bons++;
      afficher();
    });
    boutons.append(b);
  }
  carte.append(boutons);
  if (reponseArticle) {
    carte.append(el("p", reponseArticle === article ? "positif retour-quiz" : "negatif retour-quiz", reponseArticle === article ? "Richtig ✓" : `Non : ${article} ${nom}`));
    const suite = el("button", "btn-principal", "Suivant");
    suite.style.background = "#ff9500";
    suite.addEventListener("click", () => { nouvelleQuestionArticle(); afficher(); });
    carte.append(suite);
  }
  carte.append(el("p", "petit compteur-langue", `${scoreArticles.bons} / ${scoreArticles.total} cette fois-ci`));
  zone.append(carte);
  zone.append(el("p", "aide aide-groupe", "Astuces : -ung, -heit, -keit, -schaft, -ion → die. -chen, -lein, -nis (souvent) → das. -er (personnes), -ismus → der."));
}

// ---------- Allemand : les déclinaisons ----------
let questionDecl = null, reponseDecl = null;
function dessinerDeclinaisons(zone) {
  if (!questionDecl) questionDecl = DECLINAISONS[Math.floor(Math.random() * DECLINAISONS.length)];
  const [phrase, bonne, pourquoi] = questionDecl;
  const debut = phrase.startsWith("___");
  const carte = el("div", "verre focus carte-mot");
  carte.append(el("div", "etiquette", "Le bon article"));
  carte.lastChild.style.color = "#ff9500";
  const rempli = reponseDecl ? phrase.replace("___", debut ? bonne[0].toUpperCase() + bonne.slice(1) : bonne) : phrase;
  carte.append(el("div", "phrase-decl", rempli));
  const boutons = el("div", "boutons boutons-decl");
  for (const a of ["der", "die", "das", "den", "dem", "des"]) {
    const b = el("button", "btn-secondaire", a);
    if (reponseDecl) {
      if (a === bonne) b.classList.add("bonne");
      else if (a === reponseDecl) b.classList.add("mauvaise");
    }
    b.addEventListener("click", () => { if (!reponseDecl) { reponseDecl = a; afficher(); } });
    boutons.append(b);
  }
  carte.append(boutons);
  if (reponseDecl) {
    carte.append(el("p", reponseDecl === bonne ? "positif retour-quiz" : "negatif retour-quiz", (reponseDecl === bonne ? "Richtig ✓ " : `Non : « ${bonne} ». `) + pourquoi));
    const suite = el("button", "btn-principal", "Suivante");
    suite.style.background = "#ff9500";
    suite.addEventListener("click", () => {
      questionDecl = DECLINAISONS[Math.floor(Math.random() * DECLINAISONS.length)];
      reponseDecl = null;
      afficher();
    });
    carte.append(suite);
  }
  zone.append(carte);

  // Le tableau à garder sous les yeux
  const tableau = el("div", "verre bloc tableau-decl");
  tableau.append(el("strong", "", "L'article défini"));
  const t = el("table");
  const lignes = [["", "masc.", "fém.", "neutre", "plur."], ["Nominatif", "der", "die", "das", "die"],
    ["Accusatif", "den", "die", "das", "die"], ["Datif", "dem", "der", "dem", "den (+n)"], ["Génitif", "des (+s)", "der", "des (+s)", "der"]];
  lignes.forEach((l, r) => {
    const tr = el("tr");
    l.forEach((c, k) => tr.append(el(r === 0 || k === 0 ? "th" : "td", "", c)));
    t.append(tr);
  });
  tableau.append(t);
  tableau.append(el("p", "petit", "Accusatif après : durch, für, gegen, ohne, um. Datif après : aus, bei, mit, nach, seit, von, zu. Génitif : wegen, trotz, während. In, an, auf… : datif si « où ? », accusatif si « vers où ? »."));
  zone.append(tableau);
}

// ---------- Les boutons ----------
document.querySelectorAll("#segment-langues button").forEach((b) =>
  b.addEventListener("click", () => { langueActive = b.dataset.langue; carteRetournee = false; window.scrollTo(0, 0); afficher(); })
);
document.querySelectorAll("#modes-allemand button").forEach((b) =>
  b.addEventListener("click", () => { modeAllemand = b.dataset.mode; afficher(); })
);

// Le récap sur Aujourd'hui
function afficherMiniLangues() {
  const b = document.getElementById("mini-langues");
  const n = totalAReviser();
  const it = aReviser("it").file.length;
  b.replaceChildren(el("span", "emoji-positif", "🗣"),
    el("span", "", n ? `Langues : ${n} carte${n > 1 ? "s" : ""} aujourd'hui` + (it ? ` (dont ${it} en italien 🇮🇹)` : "") : "Langues : tout est révisé ✓"));
}
document.getElementById("mini-langues").addEventListener("click", () => { langueActive = aReviser("it").file.length ? "it" : langueActive; allerA("langues"); });

const afficherSansLangues = afficher;
afficher = function () {
  afficherSansLangues();
  if (vueActive === "langues") afficherLangues();
  if (vueActive === "aujourdhui") afficherMiniLangues();
};
afficher();
