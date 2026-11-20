// ============================================================
// forme.js — l'onglet Forme : pas, sport, poids
//
// Toujours le même principe : des données, qu'on enregistre,
// puis qu'on redessine. Ici trois sortes de données :
//   - les PAS du jour (un nombre par date) ;
//   - les SÉANCES de sport (type, durée, date) ;
//   - le POIDS (une pesée par date).
// Et des objectifs, que tu règles toi-même.
// ============================================================

// ---------- 1. Les sports ----------
const SPORTS = {
  marche:   { nom: "Marche",     emoji: "🚶‍♀️", couleur: "#34c759" },
  course:   { nom: "Course",     emoji: "🏃‍♀️", couleur: "#ff9500" },
  muscu:    { nom: "Muscu",      emoji: "🏋️‍♀️", couleur: "#5856d6" },
  escrime:  { nom: "Escrime",    emoji: "🤺", couleur: "#007aff" },
  velo:     { nom: "Vélo",       emoji: "🚴‍♀️", couleur: "#32ade6" },
  natation: { nom: "Natation",   emoji: "🏊‍♀️", couleur: "#30b0c7" },
  yoga:     { nom: "Yoga, étirements", emoji: "🧘‍♀️", couleur: "#af52de" },
  autre:    { nom: "Autre",      emoji: "•••", couleur: "#8e8e93" },
};
const sportDe = (s) => SPORTS[s.type] || SPORTS.autre;

// Couleurs des anneaux, comme l'app Forme d'Apple
const ROSE_PAS = "#ff2d55";
const VERT_SPORT = "#30d158";

// ---------- 2. Les données ----------
// forme = {
//   pas:      { "2026-11-21": 6540, … },
//   seances:  [ { id, date, type, minutes, note } ],
//   poids:    [ { id, date, kg } ],
//   objectifs:{ pas: 8000, minutes: 30, poids: null }
// }
const CLE_FORME = "quotidien.forme.v1";
//   profil:   { taille (cm), naissance (année), sexe: "f" | "h" }  ← pour les calories
const formeVide = () => ({
  pas: {}, seances: [], poids: [],
  objectifs: { pas: 8000, minutes: 30, poids: null },
  profil: { taille: null, naissance: null, sexe: "f" },
});
let forme = chargerForme();

function chargerForme() {
  try {
    const f = JSON.parse(localStorage.getItem(CLE_FORME));
    return normaliserForme(f);
  } catch (e) {
    return formeVide();
  }
}
// Complète ce qui manque (utile aussi pour une sauvegarde ancienne)
function normaliserForme(f) {
  const vide = formeVide();
  return {
    pas: f?.pas || vide.pas,
    seances: f?.seances || vide.seances,
    poids: f?.poids || vide.poids,
    objectifs: { ...vide.objectifs, ...(f?.objectifs || {}) },
    profil: { ...vide.profil, ...(f?.profil || {}) },
  };
}
function enregistrerForme() {
  try {
    localStorage.setItem(CLE_FORME, JSON.stringify(forme));
  } catch (e) {
    alert("Impossible d'enregistrer sur cet appareil.");
  }
}

// ---------- 3. Petits calculs ----------
const formatNombre = new Intl.NumberFormat("fr-FR");
const nombre = (n) => formatNombre.format(n);
const kgTexte = (kg) => kg.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " kg";

const pasDu = (jour) => forme.pas[jour] || 0;
const minutesDu = (jour) => forme.seances.filter((s) => s.date === jour).reduce((t, s) => t + s.minutes, 0);
const peseesTriees = () => [...forme.poids].sort((a, b) => (a.date < b.date ? -1 : 1));

// La série : combien de jours de suite tu as atteint ton objectif de pas.
// Si aujourd'hui n'est pas encore atteint, la série compte jusqu'à hier.
function serie() {
  let jour = aujourdhui();
  if (pasDu(jour) < forme.objectifs.pas) jour = ajouterJours(jour, -1);
  let n = 0;
  while (pasDu(jour) >= forme.objectifs.pas && n < 3650) { n++; jour = ajouterJours(jour, -1); }
  return n;
}

// ---------- 3 bis. Les calories (des ESTIMATIONS) ----------
// L'effort de chaque sport, en « MET » (1 = au repos, assis).
// Source des valeurs : le Compendium of Physical Activities (Ainsworth et al.).
const MET = { marche: 3.5, course: 9.8, muscu: 5, escrime: 6, velo: 7, natation: 7, yoga: 2.5, autre: 4 };

function poidsActuel() {
  const p = peseesTriees();
  return p.length ? p[p.length - 1].kg : null;
}
const ageActuel = () => (forme.profil.naissance ? new Date().getFullYear() - forme.profil.naissance : null);

// Renvoie { bouger, total } en kcal, ou null s'il manque la taille ou le poids
function calories(jour) {
  const kg = poidsActuel();
  const { taille, sexe } = forme.profil;
  if (!kg || !taille) return null;

  // 1. Les pas → une distance (longueur du pas ≈ 41 % de la taille)
  //    → environ 0,5 kcal par kilo et par kilomètre de marche.
  const km = pasDu(jour) * taille * (sexe === "h" ? 0.415 : 0.413) / 100000;
  const kcalPas = 0.5 * kg * km;

  // 2. Les séances : (MET − 1) × kilos × heures. On retire le « 1 » du repos,
  //    déjà compté dans le métabolisme. La marche n'est pas recomptée :
  //    ses pas sont déjà dans le compteur.
  const kcalSport = forme.seances
    .filter((s) => s.date === jour && s.type !== "marche")
    .reduce((t, s) => t + ((MET[s.type] || 4) - 1) * kg * s.minutes / 60, 0);

  const bouger = Math.round(kcalPas + kcalSport);

  // 3. Le métabolisme de base (formule de Mifflin-St Jeor) : ce que le corps
  //    brûle sans rien faire. + 10 % pour la digestion.
  const age = ageActuel();
  if (!age) return { bouger, total: null };
  const base = 10 * kg + 6.25 * taille - 5 * age + (sexe === "h" ? 5 : -161);
  return { bouger, total: Math.round(base * 1.1 + bouger) };
}

// "65,4" → 65.4 ; renvoie null si ce n'est pas un nombre > 0
function lireNombre(texte) {
  const n = parseFloat(String(texte).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

// ---------- 4. Les anneaux (dessin SVG) ----------
// Un anneau = un cercle gris clair + un arc coloré par-dessus.
// La longueur de l'arc = la part de l'objectif atteinte.
const SVG = "http://www.w3.org/2000/svg";
function anneaux(liste, taille = 132) {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", `0 0 ${taille} ${taille}`);
  svg.setAttribute("class", "anneaux");
  const epaisseur = 16;
  liste.forEach(({ part, couleur }, i) => {
    const r = taille / 2 - epaisseur / 2 - i * (epaisseur + 3);
    const tour = 2 * Math.PI * r;
    const fond = document.createElementNS(SVG, "circle");
    const arc = document.createElementNS(SVG, "circle");
    for (const c of [fond, arc]) {
      c.setAttribute("cx", taille / 2);
      c.setAttribute("cy", taille / 2);
      c.setAttribute("r", r);
      c.setAttribute("fill", "none");
      c.setAttribute("stroke", couleur);
      c.setAttribute("stroke-width", epaisseur);
    }
    fond.setAttribute("opacity", ".2");
    arc.setAttribute("stroke-linecap", "round");
    arc.setAttribute("stroke-dasharray", `${tour * Math.min(part, 1)} ${tour}`);
    // On commence en haut (midi) plutôt qu'à droite
    arc.setAttribute("transform", `rotate(-90 ${taille / 2} ${taille / 2})`);
    if (part <= 0) arc.setAttribute("stroke-opacity", "0");
    svg.append(fond, arc);
  });
  return svg;
}

// ---------- 5. Dessiner l'onglet ----------
function afficherForme() {
  document.getElementById("sous-titre").textContent = jolieDate(aujourdhui());
  dessinerActivite();
  dessinerSemainePas();
  dessinerPoids();
  dessinerSeances();
}

function dessinerActivite() {
  const auj = aujourdhui();
  const pas = pasDu(auj), minutes = minutesDu(auj);
  const { objectifs } = forme;

  const carte = document.getElementById("carte-activite");
  carte.replaceChildren();

  const haut = el("div", "activite");
  haut.append(anneaux([
    { part: pas / objectifs.pas, couleur: ROSE_PAS },
    { part: minutes / objectifs.minutes, couleur: VERT_SPORT },
  ]));

  const chiffres = el("div", "chiffres-activite");
  const lp = el("div");
  lp.append(el("span", "petit", "Pas"));
  const vp = el("strong", "", nombre(pas));
  vp.style.color = ROSE_PAS;
  lp.append(vp, el("span", "objectif", ` / ${nombre(objectifs.pas)}`));
  const ls = el("div");
  ls.append(el("span", "petit", "Sport"));
  const vs = el("strong", "", `${minutes}`);
  vs.style.color = VERT_SPORT;
  ls.append(vs, el("span", "objectif", ` / ${objectifs.minutes} min`));
  chiffres.append(lp, ls);

  const s = serie();
  if (s >= 2) chiffres.append(el("div", "serie", `🔥 ${s} jours de suite`));
  else if (pas >= objectifs.pas) chiffres.append(el("div", "serie", "✓ Objectif de pas atteint"));

  haut.append(chiffres);
  carte.append(haut);

  // Les calories du jour
  const kcal = calories(auj);
  const ligneKcal = el("button", "ligne-kcal");
  if (!kcal) {
    ligneKcal.textContent = !forme.profil.taille
      ? "🔥 Ajoute ta taille et ton âge pour voir tes calories →"
      : "🔥 Note ton poids pour voir tes calories →";
    ligneKcal.addEventListener("click", () => (forme.profil.taille ? ouvrirForme("poids") : ouvrirObjectifs()));
  } else {
    const fort = el("strong", "", `≈ ${nombre(kcal.bouger)} kcal`);
    ligneKcal.append("🔥 ", fort, " brûlées en bougeant");
    if (kcal.total) ligneKcal.append(el("span", "petit", `≈ ${nombre(kcal.total)} kcal sur toute la journée (repos compris)`));
    ligneKcal.addEventListener("click", () => alert(
      "Ce sont des estimations, calculées avec ton poids, ta taille, ton âge, tes pas et tes séances.\n\n" +
      "« En bougeant » : tes pas + ton sport.\n« Sur la journée » : ajoute ce que ton corps brûle au repos (respirer, digérer…)."
    ));
  }
  carte.append(ligneKcal);

  const boutons = el("div", "boutons");
  const bPas = el("button", "btn-principal btn-rose", "Noter mes pas");
  bPas.addEventListener("click", () => ouvrirForme("pas"));
  const bPoids = el("button", "btn-secondaire", "Mon poids");
  bPoids.addEventListener("click", () => ouvrirForme("poids"));
  boutons.append(bPas, bPoids);
  carte.append(boutons);
}

// Les 7 derniers jours, en barres. La ligne pointillée = l'objectif.
function dessinerSemainePas() {
  const zone = document.getElementById("semaine-pas");
  zone.replaceChildren();
  const auj = aujourdhui();
  const jours = Array.from({ length: 7 }, (_, i) => ajouterJours(auj, i - 6));
  const objectif = forme.objectifs.pas;
  const max = Math.max(objectif * 1.15, ...jours.map(pasDu));

  const graphe = el("div", "graphe-pas");
  const ligne = el("div", "ligne-objectif");
  // Hauteur de la ligne : calculée par le CSS à partir de --objectif (0 à 1)
  graphe.style.setProperty("--objectif", (objectif / max).toFixed(3));
  graphe.append(ligne);

  for (const jour of jours) {
    const p = pasDu(jour);
    const col = el("button", "col-pas" + (jour === auj ? " auj" : ""));
    col.setAttribute("aria-label", `${jolieDate(jour)} : ${nombre(p)} pas`);
    const piste = el("div", "piste");
    const b = el("span", p >= objectif ? "atteint" : "");
    b.style.height = (p / max * 100).toFixed(1) + "%";
    piste.append(b);
    col.append(piste, el("span", "lettre", LETTRES[versDate(jour).getDay()]));
    col.addEventListener("click", () => ouvrirForme("pas", { date: jour }));
    graphe.append(col);
  }
  zone.append(graphe);

  const total = jours.reduce((t, j) => t + pasDu(j), 0);
  const min = jours.reduce((t, j) => t + minutesDu(j), 0);
  const atteints = jours.filter((j) => pasDu(j) >= objectif).length;
  zone.append(el("p", "petit resume-semaine",
    `≈ ${nombre(Math.round(total / 7))} pas par jour · ${min} min de sport · objectif atteint ${atteints} jour${atteints > 1 ? "s" : ""} sur 7`));
}

function dessinerPoids() {
  const carte = document.getElementById("carte-poids");
  carte.replaceChildren();
  const pesees = peseesTriees();
  const vise = forme.objectifs.poids;

  if (!pesees.length) {
    carte.append(el("p", "vide-msg", "Note ton poids de temps en temps (le matin, c'est plus fiable) pour voir ta courbe."));
    return;
  }

  const derniere = pesees[pesees.length - 1];
  const premiere = pesees[0];
  const haut = el("div", "haut-cat");
  haut.append(el("strong", "gros-poids", kgTexte(derniere.kg)), el("span", "petit", jolieDate(derniere.date)));
  carte.append(haut);

  const infos = [];
  if (pesees.length > 1) {
    const diff = Math.round((derniere.kg - premiere.kg) * 10) / 10;
    const signe = diff > 0 ? "+" : diff < 0 ? "−" : "";
    infos.push(`${signe}${kgTexte(Math.abs(diff))} depuis le ${versDate(premiere.date).getDate()} ${MOIS[versDate(premiere.date).getMonth()]}`);
  }
  if (vise) {
    const reste = Math.round((derniere.kg - vise) * 10) / 10;
    infos.push(reste > 0 ? `plus que ${kgTexte(reste)} avant ${kgTexte(vise)}` : `objectif ${kgTexte(vise)} atteint 🎉`);
  }
  if (infos.length) carte.append(el("p", "petit", infos.join(" · ")));

  if (pesees.length > 1) carte.append(courbePoids(pesees.slice(-30), vise));

  // L'historique, pour corriger une pesée
  const details = el("details", "historique");
  details.append(el("summary", "", `Historique · ${pesees.length}`));
  const ul = el("ul", "liste");
  for (const p of [...pesees].reverse()) {
    const li = el("li", "ligne-mvt");
    const infosLi = el("div", "infos");
    infosLi.append(el("div", "t", kgTexte(p.kg)));
    infosLi.append(el("div", "m", jolieDate(p.date)));
    li.append(infosLi);
    li.addEventListener("click", () => ouvrirForme("poids", { pesee: p }));
    ul.append(li);
  }
  details.append(ul);
  carte.append(details);
}

// Petite courbe : chaque pesée est un point, reliés par une ligne
function courbePoids(pesees, vise) {
  const L = 300, H = 110, marge = 8;
  const valeurs = pesees.map((p) => p.kg);
  if (vise) valeurs.push(vise);
  let bas = Math.min(...valeurs), haut = Math.max(...valeurs);
  if (haut - bas < 2) { bas -= 1; haut += 1; }
  const x = (i) => marge + i * (L - 2 * marge) / (pesees.length - 1);
  const y = (kg) => marge + (haut - kg) / (haut - bas) * (H - 2 * marge);

  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", `0 0 ${L} ${H}`);
  svg.setAttribute("class", "courbe-poids");

  if (vise) {
    const l = document.createElementNS(SVG, "line");
    l.setAttribute("x1", 0); l.setAttribute("x2", L);
    l.setAttribute("y1", y(vise)); l.setAttribute("y2", y(vise));
    l.setAttribute("class", "objectif-poids");
    svg.append(l);
  }
  const points = pesees.map((p, i) => `${x(i).toFixed(1)},${y(p.kg).toFixed(1)}`).join(" ");
  // Zone colorée sous la courbe
  const zone = document.createElementNS(SVG, "polygon");
  zone.setAttribute("points", `${x(0)},${H} ${points} ${x(pesees.length - 1)},${H}`);
  zone.setAttribute("class", "zone-poids");
  const ligne = document.createElementNS(SVG, "polyline");
  ligne.setAttribute("points", points);
  ligne.setAttribute("class", "ligne-poids");
  svg.append(zone, ligne);
  const dernier = document.createElementNS(SVG, "circle");
  dernier.setAttribute("cx", x(pesees.length - 1));
  dernier.setAttribute("cy", y(pesees[pesees.length - 1].kg));
  dernier.setAttribute("r", 4.5);
  dernier.setAttribute("class", "point-poids");
  svg.append(dernier);
  return svg;
}

function dessinerSeances() {
  const zone = document.getElementById("seances");
  zone.replaceChildren();
  const liste = [...forme.seances].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 15);
  if (!liste.length) {
    zone.append(el("p", "vide-msg", "Aucune séance. Touche + pour en noter une."));
    return;
  }
  const ul = el("ul", "liste verre");
  for (const s of liste) {
    const sp = sportDe(s);
    const li = el("li", "ligne-mvt");
    const infos = el("div", "infos");
    infos.append(el("div", "t", sp.nom));
    infos.append(el("div", "m", [jolieDate(s.date), s.note].filter(Boolean).join(" · ")));
    li.append(pastilleCat(sp), infos, el("strong", "montant-ligne", `${s.minutes} min`));
    li.addEventListener("click", () => ouvrirForme("seance", { seance: s }));
    ul.append(li);
  }
  zone.append(ul);
}

// Le petit rappel sur l'onglet Aujourd'hui
function afficherMiniForme() {
  const bouton = document.getElementById("mini-forme");
  const auj = aujourdhui();
  const pas = pasDu(auj), minutes = minutesDu(auj);
  const entete = el("span", "entete-tuile", "Forme ›");
  entete.style.color = ROSE_PAS;
  const ligne = el("div", "ligne-tuile");
  const texte = el("div", "texte-mini");
  const vp = el("strong", "", nombre(pas));
  vp.style.color = ROSE_PAS;
  const vs = el("strong", "", `${minutes} min`);
  vs.style.color = VERT_SPORT;
  texte.append(vp, el("span", "petit", "pas"), vs, el("span", "petit", "de sport"));
  ligne.append(anneaux([
    { part: pas / forme.objectifs.pas, couleur: ROSE_PAS },
    { part: minutes / forme.objectifs.minutes, couleur: VERT_SPORT },
  ]), texte);
  bouton.replaceChildren(entete, ligne);
}
document.getElementById("mini-forme").addEventListener("click", () => allerA("forme"));

// ---------- 6. La feuille « Pas / Poids / Séance » ----------
const fenForme = document.getElementById("fenetre-forme");
const formForme = document.getElementById("form-forme");
let typeForme = "pas";
let formeEdite = null;   // { pesee } ou { seance } quand on modifie
let sportChoisi = "marche";

const UNITES = { pas: "pas", poids: "kg", seance: "min" };
const TITRES_FORME = { pas: "Mes pas", poids: "Mon poids", seance: "Séance de sport" };

function dessinerFeuilleForme() {
  document.querySelectorAll("#type-forme button").forEach((b) => b.classList.toggle("active", b.dataset.type === typeForme));
  document.getElementById("titre-forme").textContent = (formeEdite ? "Modifier · " : "") + TITRES_FORME[typeForme];
  document.getElementById("unite-forme").textContent = UNITES[typeForme];
  formForme.valeur.placeholder = { pas: "0", poids: "0,0", seance: "30" }[typeForme];
  formForme.valeur.inputMode = typeForme === "poids" ? "decimal" : "numeric";
  document.getElementById("zone-sport").hidden = typeForme !== "seance";
  document.getElementById("aide-pas").hidden = typeForme !== "pas";
  // On ne change pas de type quand on modifie quelque chose d'existant
  document.getElementById("type-forme").hidden = !!formeEdite;

  document.getElementById("grille-sport").replaceChildren(
    ...Object.entries(SPORTS).map(([cle, s]) => {
      const b = el("button", "puce-cat" + (cle === sportChoisi ? " choisie" : ""));
      b.type = "button";
      b.style.setProperty("--c", s.couleur);
      b.append(pastilleCat(s), el("span", "", s.nom));
      b.addEventListener("click", () => { sportChoisi = cle; dessinerFeuilleForme(); });
      return b;
    })
  );

  const peutSupprimer = formeEdite || (typeForme === "pas" && forme.pas[formForme.date.value]);
  document.getElementById("suppr-forme").style.display = peutSupprimer ? "" : "none";
}

// Pour les pas : changer la date montre ce qui est déjà noté ce jour-là
function remplirValeur() {
  if (typeForme === "pas") {
    const p = forme.pas[formForme.date.value];
    formForme.valeur.value = p ? String(p) : "";
  } else if (!formeEdite) {
    formForme.valeur.value = "";
  }
}

document.querySelectorAll("#type-forme button").forEach((b) =>
  b.addEventListener("click", () => { typeForme = b.dataset.type; remplirValeur(); dessinerFeuilleForme(); })
);
formForme.date.addEventListener("change", () => { if (typeForme === "pas") { remplirValeur(); dessinerFeuilleForme(); } });

function ouvrirForme(type = "seance", { date, pesee, seance } = {}) {
  typeForme = type;
  formeEdite = pesee ? { pesee } : seance ? { seance } : null;
  formForme.date.value = pesee?.date || seance?.date || date || aujourdhui();
  formForme.note.value = seance?.note || "";
  sportChoisi = seance?.type || "marche";
  if (pesee) formForme.valeur.value = String(pesee.kg).replace(".", ",");
  else if (seance) formForme.valeur.value = String(seance.minutes);
  else remplirValeur();
  dessinerFeuilleForme();
  fenForme.showModal();
  if (!formeEdite) formForme.valeur.focus();
}

formForme.addEventListener("submit", (e) => {
  const n = lireNombre(formForme.valeur.value);
  const date = formForme.date.value;
  if (!n || !date) { e.preventDefault(); formForme.valeur.focus(); return; }

  if (typeForme === "pas") {
    forme.pas[date] = Math.round(n);
  } else if (typeForme === "poids") {
    const kg = Math.round(n * 10) / 10;
    if (formeEdite?.pesee) Object.assign(formeEdite.pesee, { date, kg });
    else {
      // Une seule pesée par jour : la nouvelle remplace celle du même jour
      forme.poids = forme.poids.filter((p) => p.date !== date);
      forme.poids.push({ id: nouvelId(), date, kg });
    }
  } else {
    const valeurs = { date, type: sportChoisi, minutes: Math.round(n), note: formForme.note.value.trim() };
    if (formeEdite?.seance) Object.assign(formeEdite.seance, valeurs);
    else forme.seances.push({ id: nouvelId(), ...valeurs });
  }
  enregistrerForme();
  afficher();
});

document.getElementById("suppr-forme").addEventListener("click", () => {
  if (!confirm("Supprimer ?")) return;
  if (typeForme === "pas") delete forme.pas[formForme.date.value];
  else if (formeEdite?.pesee) forme.poids = forme.poids.filter((p) => p.id !== formeEdite.pesee.id);
  else if (formeEdite?.seance) forme.seances = forme.seances.filter((s) => s.id !== formeEdite.seance.id);
  enregistrerForme();
  fenForme.close();
  afficher();
});

// ---------- 7. La feuille « Objectifs » ----------
const fenObjectifs = document.getElementById("fenetre-objectifs");
const formObjectifs = document.getElementById("form-objectifs");

function ouvrirObjectifs() {
  formObjectifs.pas.value = forme.objectifs.pas;
  formObjectifs.minutes.value = forme.objectifs.minutes;
  formObjectifs.poids.value = forme.objectifs.poids ? String(forme.objectifs.poids).replace(".", ",") : "";
  formObjectifs.taille.value = forme.profil.taille || "";
  formObjectifs.naissance.value = forme.profil.naissance || "";
  formObjectifs.sexe.value = forme.profil.sexe;
  fenObjectifs.showModal();
}
document.getElementById("btn-objectifs").addEventListener("click", ouvrirObjectifs);

formObjectifs.addEventListener("submit", () => {
  forme.objectifs = {
    pas: Math.round(lireNombre(formObjectifs.pas.value) || forme.objectifs.pas),
    minutes: Math.round(lireNombre(formObjectifs.minutes.value) || forme.objectifs.minutes),
    poids: lireNombre(formObjectifs.poids.value) ? Math.round(lireNombre(formObjectifs.poids.value) * 10) / 10 : null,
  };
  const taille = lireNombre(formObjectifs.taille.value);
  const annee = lireNombre(formObjectifs.naissance.value);
  forme.profil = {
    taille: taille && taille > 100 && taille < 250 ? Math.round(taille) : null,   // en cm
    naissance: annee && annee > 1900 && annee <= new Date().getFullYear() ? Math.round(annee) : null,
    sexe: formObjectifs.sexe.value,
  };
  enregistrerForme();
  afficher();
});

for (const fen of [fenForme, fenObjectifs]) {
  fen.querySelector("[data-fermer]").addEventListener("click", () => fen.close());
  fen.addEventListener("click", (e) => { if (e.target === fen) fen.close(); });
}

afficher();
