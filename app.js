// ============================================================
// app.js — le comportement de l'appli
//
// Le principe, à retenir : on garde toutes les tâches dans une
// liste (un "tableau"). Chaque fois que quelque chose change,
// on (1) enregistre la liste, puis (2) on redessine l'écran.
// ============================================================

// ---------- 1. Les catégories ----------
const CATEGORIES = {
  cours:      { nom: "Cours",      couleur: "var(--bleu)" },
  reserve:    { nom: "Réserve",    couleur: "var(--vert)" },
  delegation: { nom: "Délégation", couleur: "var(--violet)" },
  perso:      { nom: "Perso",      couleur: "var(--orange)" },
  admin:      { nom: "Admin",      couleur: "var(--gris)" },
};

// ---------- 2. Les données ----------
// Une tâche ressemble à ça :
// { id, titre, date: "2026-11-21", heure: "14:00", cat: "cours", note, fait: false, creeLe,
//   repete: "" | "jour" | "ouvres" | "jours" | "semaine" | "deux-semaines" | "mois",
//   jours: [1, 3, 5],    ← pour "jours" : 0 = dimanche, 1 = lundi … 6 = samedi
//   important: true }    ← l'étoile : toujours en haut, et en premier sur Aujourd'hui
const CLE = "quotidien.taches.v1";
let taches = charger();

function charger() {
  try {
    return JSON.parse(localStorage.getItem(CLE)) || [];
  } catch (e) {
    return []; // si le stockage est indisponible, on démarre vide
  }
}

function enregistrer() {
  try {
    localStorage.setItem(CLE, JSON.stringify(taches));
  } catch (e) {
    alert("Impossible d'enregistrer sur cet appareil.");
  }
}

// ---------- 3. Petits outils pour les dates ----------
// On écrit les dates "AAAA-MM-JJ" : c'est ce que donne <input type="date">.
function enTexte(d) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const j = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${j}`;
}
function versDate(txt) {
  const [a, m, j] = txt.split("-").map(Number);
  return new Date(a, m - 1, j);
}
function ajouterJours(txt, n) {
  const d = versDate(txt);
  d.setDate(d.getDate() + n);
  return enTexte(d);
}
const aujourdhui = () => enTexte(new Date());

const JOURS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const JOURS_LONGS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

function jolieDate(txt) {
  const d = versDate(txt);
  return `${JOURS_LONGS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]}`;
}

// ---------- 3 bis. Les tâches répétées ----------
// Comme dans l'app Rappels : une tâche répétée n'existe qu'une fois.
// Quand tu la coches, on garde une trace "faite" et la tâche
// saute à sa prochaine date.
const REPETITIONS = {
  "jour": "Tous les jours",
  "ouvres": "En semaine",
  "jours": "Certains jours",
  "semaine": "Chaque semaine",
  "deux-semaines": "Toutes les 2 sem.",
  "mois": "Chaque mois",
};
const LETTRES = ["D", "L", "M", "M", "J", "V", "S"]; // index = jour de la semaine

function libelleRepete(t) {
  if (t.repete === "jours" && t.jours?.length) {
    // Affiché dans l'ordre lundi → dimanche
    return [1, 2, 3, 4, 5, 6, 0].filter((j) => t.jours.includes(j)).map((j) => JOURS[j]).join(" ");
  }
  return REPETITIONS[t.repete] || "";
}

// Date de la prochaine occurrence après `txt`
function suivante(txt, t) {
  const d = versDate(txt);
  switch (t.repete) {
    case "jour": d.setDate(d.getDate() + 1); break;
    case "semaine": d.setDate(d.getDate() + 7); break;
    case "deux-semaines": d.setDate(d.getDate() + 14); break;
    case "mois": {
      const jour = versDate(t.dateDebut || txt).getDate();      // on garde le jour d'origine (ex. le 31)
      d.setDate(1); d.setMonth(d.getMonth() + 1);
      const dernier = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      d.setDate(Math.min(jour, dernier));
      break;
    }
    case "ouvres":
    case "jours": {
      const permis = t.repete === "ouvres" ? [1, 2, 3, 4, 5] : (t.jours?.length ? t.jours : [d.getDay()]);
      do { d.setDate(d.getDate() + 1); } while (!permis.includes(d.getDay()));
      break;
    }
    default: return null;
  }
  return enTexte(d);
}

// Pour l'agenda : la tâche répétée tombe-t-elle aussi ce jour-là ?
function tombeLe(t, jour) {
  if (!t.repete || !t.date || t.fait || jour <= t.date) return false;
  let d = t.date;
  for (let i = 0; i < 800 && d < jour; i++) d = suivante(d, t);
  return d === jour;
}

// Ordre de tri : d'abord les tâches datées (par jour puis heure), puis sans date.
function trier(a, b) {
  const da = a.date || "9999", db = b.date || "9999";
  if (da !== db) return da < db ? -1 : 1;
  const ha = a.heure || "99", hb = b.heure || "99";
  if (ha !== hb) return ha < hb ? -1 : 1;
  return a.creeLe - b.creeLe;
}

// ---------- 4. Navigation entre onglets ----------
// Les écrans : "aujourdhui", "taches" (Agenda en liste), "agenda" (Agenda en semaine), "budget", "forme".
// L'onglet Agenda de la barre regroupe "taches" et "agenda" (interrupteur Liste / Semaine).
const TITRES = { aujourdhui: "Aujourd'hui", taches: "Agenda", agenda: "Agenda", budget: "Budget", forme: "Forme", moi: "Moi" };
let vueActive = "aujourdhui";
let sousAgenda = "taches"; // la dernière vue choisie dans l'onglet Agenda

const barreOnglets = document.querySelector(".onglets");
const boutonsOnglets = [...barreOnglets.querySelectorAll("button")];
const pilule = document.getElementById("pilule");
const ongletDe = (vue) => (vue === "taches" ? "agenda" : vue); // écran → bouton de la barre

function allerA(vue) {
  if (vue === "agenda" && vueActive !== "taches" && vueActive !== "agenda") vue = sousAgenda;
  if (vue === vueActive) { placerPilule(); return; }
  vueActive = vue;
  if (vue === "taches" || vue === "agenda") sousAgenda = vue;
  boutonsOnglets.forEach((b) => b.classList.toggle("active", b.dataset.vue === ongletDe(vue)));
  document.getElementById("btn-aujourdhui").classList.toggle("active", vue === "aujourdhui");
  document.querySelectorAll(".vue").forEach((v) => v.classList.toggle("active", v.id === "vue-" + vue));
  document.querySelectorAll("#segment-agenda button").forEach((b) => b.classList.toggle("active", b.dataset.sous === vue));
  document.getElementById("segment-agenda").hidden = ongletDe(vue) !== "agenda";
  window.scrollTo(0, 0);
  afficher();
}

document.querySelectorAll("#segment-agenda button").forEach((b) =>
  b.addEventListener("click", () => allerA(b.dataset.sous))
);

// Le bouton du haut ramène au récap ; les titres du récap mènent à leur onglet
document.getElementById("btn-aujourdhui").addEventListener("click", () => allerA("aujourdhui"));
document.querySelectorAll("[data-aller]").forEach((b) =>
  b.addEventListener("click", () => allerA(b.dataset.aller))
);

// Glisser le doigt sur la barre, comme sur iOS 26 :
// la pilule suit le doigt, grossit un peu, et se pose sur
// l'onglet le plus proche quand on lâche.
let glisse = null; // { debutX, bouge }

function ongletSous(x) {
  // l'onglet dont le centre est le plus proche du doigt
  return boutonsOnglets.reduce((meilleur, b) => {
    const r = b.getBoundingClientRect();
    const d = Math.abs(r.left + r.width / 2 - x);
    return d < meilleur.d ? { b, d } : meilleur;
  }, { b: boutonsOnglets[0], d: Infinity }).b;
}

function suivreDoigt(x) {
  const nav = barreOnglets.getBoundingClientRect();
  const largeur = pilule.offsetWidth;
  const pos = Math.max(4, Math.min(x - nav.left - largeur / 2, nav.width - largeur - 4));
  pilule.style.transform = `translateX(${pos}px) scale(1.12)`;
  const sous = ongletSous(x);
  boutonsOnglets.forEach((b) => b.classList.toggle("survol", b === sous));
}

barreOnglets.addEventListener("pointerdown", (e) => {
  glisse = { debutX: e.clientX, bouge: false };
  barreOnglets.setPointerCapture(e.pointerId);
  barreOnglets.classList.add("glisse");
  suivreDoigt(e.clientX);
});
barreOnglets.addEventListener("pointermove", (e) => {
  if (!glisse) return;
  if (Math.abs(e.clientX - glisse.debutX) > 4) glisse.bouge = true;
  suivreDoigt(e.clientX);
});
function lacher(e) {
  if (!glisse) return;
  glisse = null;
  barreOnglets.classList.remove("glisse");
  boutonsOnglets.forEach((b) => b.classList.remove("survol"));
  allerA(ongletSous(e.clientX).dataset.vue);
  placerPilule();
}
barreOnglets.addEventListener("pointerup", lacher);
barreOnglets.addEventListener("pointercancel", lacher);

// Au clavier (Entrée / Espace), les onglets restent des boutons normaux
boutonsOnglets.forEach((b) =>
  b.addEventListener("click", (e) => { if (e.detail === 0) allerA(b.dataset.vue); })
);

// ---------- 5. Fabriquer une ligne de tâche ----------
// On construit les éléments un par un (plutôt que du HTML en texte)
// pour qu'un titre ne puisse jamais "casser" la page.
function ligneTache(t, { montrerDate = true, projection = false } = {}) {
  const li = document.createElement("li");
  if (t.fait) li.classList.add("fait");
  // "projection" = une future occurrence d'une tâche répétée, montrée dans l'agenda
  if (projection) li.classList.add("projection");

  const caseBtn = document.createElement("button");
  caseBtn.className = "case" + (t.fait ? " cochee" : "");
  caseBtn.style.setProperty("--couleur", CATEGORIES[t.cat]?.couleur || "var(--accent)");
  caseBtn.setAttribute("aria-label", t.fait ? "Marquer à faire" : "Marquer faite");
  caseBtn.addEventListener("click", () => basculer(t.id));

  const infos = document.createElement("div");
  infos.className = "infos";
  infos.addEventListener("click", () => ouvrirFenetre(t));

  const titre = document.createElement("div");
  titre.className = "t";
  if (t.important && !t.fait) {
    const etoile = document.createElement("span");
    etoile.className = "etoile";
    etoile.textContent = "★ ";
    titre.append(etoile);
  }
  titre.append(t.titre);

  const meta = document.createElement("div");
  meta.className = "m";
  const morceaux = [];
  if (montrerDate && t.date) morceaux.push(jolieDate(t.date));
  if (t.heure) morceaux.push(t.heure.replace(":", "h"));
  morceaux.push(CATEGORIES[t.cat]?.nom || "");
  if (t.repete) morceaux.push("↻ " + libelleRepete(t));
  meta.textContent = morceaux.filter(Boolean).join(" · ");
  if (!t.fait && !projection && t.date && t.date < aujourdhui()) {
    meta.classList.add("retard");
    meta.textContent = "En retard · " + meta.textContent;
  }

  infos.append(titre, meta);

  const pastille = document.createElement("span");
  pastille.className = "pastille";
  pastille.style.background = CATEGORIES[t.cat]?.couleur || "var(--doux)";

  if (projection) {
    li.append(caseBtn, infos, pastille);
    return li;
  }

  // La ligne peut glisser : on met son contenu dans une « plaque »
  // qui bouge, et derrière, les deux actions (vert à gauche, rouge à droite).
  li.classList.add("glissable");
  const plaque = document.createElement("div");
  plaque.className = "plaque";
  plaque.append(caseBtn, infos, pastille);
  const actionFait = document.createElement("div");
  actionFait.className = "action-glisse action-fait";
  actionFait.textContent = t.fait ? "↺ À faire" : "✓ Fait";
  const actionSuppr = document.createElement("div");
  actionSuppr.className = "action-glisse action-suppr";
  actionSuppr.textContent = "🗑 Supprimer";
  li.append(actionFait, actionSuppr, plaque);
  rendreGlissable(li, plaque, {
    droite: () => basculer(t.id),
    gauche: () => mettreALaCorbeille(t.id),
  });
  return li;
}

// ---------- 5 bis. Glisser une ligne, comme dans Rappels ----------
// Vers la droite → fait (vert). Vers la gauche → corbeille (rouge).
// On ne glisse que si le doigt part de côté : vers le haut ou le bas,
// la page défile normalement.
let vientDeGlisser = false;

function rendreGlissable(li, plaque, { droite, gauche }) {
  let depart = null; // { x, y, sens: null | "cote" | "vertical" }
  let dx = 0;

  plaque.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    depart = { x: e.clientX, y: e.clientY, sens: null };
    dx = 0;
  });
  plaque.addEventListener("pointermove", (e) => {
    if (!depart) return;
    const mx = e.clientX - depart.x, my = e.clientY - depart.y;
    if (!depart.sens) {
      if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
      depart.sens = Math.abs(mx) > Math.abs(my) ? "cote" : "vertical";
      if (depart.sens === "cote") { plaque.setPointerCapture(e.pointerId); li.classList.add("en-glisse"); }
    }
    if (depart.sens !== "cote") return;
    dx = mx;
    plaque.style.transform = `translateX(${dx}px)`;
    const seuil = Math.min(110, li.offsetWidth * 0.35);
    li.classList.toggle("vers-droite", dx > 0);
    li.classList.toggle("vers-gauche", dx < 0);
    li.classList.toggle("assez", Math.abs(dx) > seuil);
  });

  function finir() {
    if (!depart) return;
    const glissait = depart.sens === "cote";
    depart = null;
    li.classList.remove("en-glisse");
    if (!glissait) return;
    vientDeGlisser = true;
    setTimeout(() => (vientDeGlisser = false), 50);
    const seuil = Math.min(110, li.offsetWidth * 0.35);
    if (Math.abs(dx) > seuil) {
      // La ligne file hors de l'écran, puis l'action se fait
      plaque.style.transform = `translateX(${dx > 0 ? li.offsetWidth : -li.offsetWidth}px)`;
      li.classList.add("part");
      setTimeout(() => (dx > 0 ? droite() : gauche()), 220);
    } else {
      plaque.style.transform = "";
      li.classList.remove("vers-droite", "vers-gauche", "assez");
    }
  }
  plaque.addEventListener("pointerup", finir);
  plaque.addEventListener("pointercancel", finir);
  // Après un glissement, le « clic » de fin ne doit pas ouvrir la tâche
  plaque.addEventListener("click", (e) => { if (vientDeGlisser) { e.stopPropagation(); e.preventDefault(); } }, true);
}

// ---------- 5 ter. La corbeille ----------
// Une tâche supprimée n'est pas perdue : elle va dans « Supprimées »
// (gardée 30 jours), d'où on peut la restaurer.
const CLE_CORBEILLE = "quotidien.corbeille.v1";
let corbeille = (() => {
  try { return JSON.parse(localStorage.getItem(CLE_CORBEILLE)) || []; } catch (e) { return []; }
})();
function enregistrerCorbeille() {
  // On oublie ce qui est dans la corbeille depuis plus de 30 jours
  const limite = Date.now() - 30 * 86400000;
  corbeille = corbeille.filter((t) => (t.supprimeeLe || 0) > limite);
  try { localStorage.setItem(CLE_CORBEILLE, JSON.stringify(corbeille)); } catch (e) {}
}

function mettreALaCorbeille(id) {
  const t = taches.find((x) => x.id === id);
  if (!t) return;
  taches = taches.filter((x) => x.id !== id);
  corbeille.unshift({ ...t, supprimeeLe: Date.now() });
  enregistrer();
  enregistrerCorbeille();
  afficher();
  if (typeof montrerToast === "function") montrerToast("Supprimée", () => restaurerTache(t.id), "Annuler");
}

function restaurerTache(id) {
  const t = corbeille.find((x) => x.id === id);
  if (!t) return;
  corbeille = corbeille.filter((x) => x.id !== id);
  const { supprimeeLe, ...tache } = t;
  taches.push(tache);
  enregistrer();
  enregistrerCorbeille();
  afficher();
}

function afficherCorbeille() {
  const zone = document.getElementById("corbeille");
  document.getElementById("resume-corbeille").textContent = `Supprimées · ${corbeille.length}`;
  zone.hidden = !corbeille.length;
  const ul = document.getElementById("liste-corbeille");
  ul.replaceChildren(...corbeille.map((t) => {
    const li = document.createElement("li");
    const infos = document.createElement("div");
    infos.className = "infos";
    const titre = document.createElement("div");
    titre.className = "t";
    titre.textContent = t.titre;
    const meta = document.createElement("div");
    meta.className = "m";
    const d = new Date(t.supprimeeLe);
    meta.textContent = `Supprimée le ${d.getDate()} ${MOIS[d.getMonth()]}`;
    infos.append(titre, meta);
    const b = document.createElement("button");
    b.className = "btn-texte";
    b.textContent = "Restaurer";
    b.addEventListener("click", () => restaurerTache(t.id));
    li.append(infos, b);
    return li;
  }));
}
document.getElementById("vider-corbeille").addEventListener("click", () => {
  if (!confirm(`Supprimer définitivement ${corbeille.length} tâche(s) ? Ce n'est pas réversible.`)) return;
  corbeille = [];
  enregistrerCorbeille();
  afficher();
});

function remplir(ul, liste, options) {
  ul.replaceChildren(...liste.map((t) => ligneTache(t, options)));
}

// ---------- 6. Onglet AUJOURD'HUI ----------
// L'idée anti-éparpillement : UNE seule tâche mise en avant.
let tachesPassees = []; // celles où tu as dit "pas maintenant" (le temps de la session)

function afficherAujourdhui() {
  const auj = aujourdhui();
  const aFaire = taches.filter((t) => !t.fait).sort(trier);

  // Candidates : en retard + aujourd'hui, puis sans date
  let candidates = aFaire.filter((t) => t.date && t.date <= auj);
  if (candidates.length === 0) candidates = aFaire.filter((t) => !t.date);
  // Les tâches ★ très importantes passent toujours en premier (même à venir ou sans date)
  const importantes = aFaire.filter((t) => t.important);
  candidates = [...importantes, ...candidates.filter((t) => !t.important)];
  const restantes = candidates.filter((t) => !tachesPassees.includes(t.id));
  const focus = restantes[0] || candidates[0];

  const carte = document.getElementById("carte-focus");
  carte.replaceChildren();
  carte.classList.toggle("vide", !focus);

  if (!focus) {
    const emoji = document.createElement("span");
    emoji.className = "grand-emoji";
    emoji.textContent = aFaire.length ? "🌿" : "✨";
    carte.append(emoji, aFaire.length
      ? "Rien de prévu aujourd'hui. Profite, ou avance sur une tâche de la semaine."
      : "Aucune tâche pour l'instant. Touche + pour en ajouter une.");
  } else {
    const etiquette = document.createElement("div");
    etiquette.className = "etiquette";
    etiquette.textContent = focus.important ? "★ Très important" : "Ta prochaine petite tâche";
    if (focus.important) etiquette.classList.add("importante");

    const titre = document.createElement("div");
    titre.className = "tache-titre";
    titre.textContent = focus.titre;

    const meta = document.createElement("div");
    const enRetard = focus.date && focus.date < auj;
    meta.className = "muted" + (enRetard ? " retard" : "");
    meta.textContent = [
      enRetard ? "En retard (" + jolieDate(focus.date) + ")" : "",
      focus.date && focus.date > auj ? "Pour " + jolieDate(focus.date) : "",
      focus.heure ? focus.heure.replace(":", "h") : "",
      CATEGORIES[focus.cat]?.nom,
    ].filter(Boolean).join(" · ");

    const boutons = document.createElement("div");
    boutons.className = "boutons";
    const fait = document.createElement("button");
    fait.className = "btn-principal";
    fait.textContent = "C'est fait ✓";
    fait.addEventListener("click", () => basculer(focus.id));
    const plusTard = document.createElement("button");
    plusTard.className = "btn-secondaire";
    plusTard.textContent = "Plus tard";
    plusTard.addEventListener("click", () => {
      tachesPassees.push(focus.id);
      if (candidates.every((t) => tachesPassees.includes(t.id))) tachesPassees = [];
      afficher();
    });
    boutons.append(fait, plusTard);

    carte.append(etiquette, titre, meta, boutons);
  }

  const duJour = taches.filter((t) => t.date === auj).sort(trier);
  const ul = document.getElementById("liste-aujourdhui");
  remplir(ul, duJour, { montrerDate: false });
  if (!duJour.length) {
    const li = document.createElement("li");
    li.className = "vide-msg";
    li.textContent = "Rien de prévu aujourd'hui.";
    ul.append(li);
  }
}

// ---------- 7. Onglet TÂCHES ----------
let filtre = "toutes";

function afficherFiltres() {
  const zone = document.getElementById("filtres");
  const choix = { toutes: "Toutes", ...Object.fromEntries(Object.entries(CATEGORIES).map(([k, c]) => [k, c.nom])) };
  zone.replaceChildren(
    ...Object.entries(choix).map(([cle, nom]) => {
      const b = document.createElement("button");
      b.textContent = nom;
      b.classList.toggle("active", cle === filtre);
      b.addEventListener("click", () => { filtre = cle; afficher(); });
      return b;
    })
  );
}

function afficherTaches() {
  afficherFiltres();
  const auj = aujourdhui();
  const demain = ajouterJours(auj, 1);
  const visibles = taches.filter((t) => filtre === "toutes" || t.cat === filtre).sort(trier);
  const aFaire = visibles.filter((t) => !t.fait);

  // Les ★ ont leur propre section, tout en haut ; on ne les répète pas plus bas
  const importantes = aFaire.filter((t) => t.important);
  const normales = aFaire.filter((t) => !t.important);
  const groupes = [
    ["★ Très important", importantes],
    ["En retard", normales.filter((t) => t.date && t.date < auj)],
    ["Aujourd'hui", normales.filter((t) => t.date === auj)],
    ["Demain", normales.filter((t) => t.date === demain)],
    ["Plus tard", normales.filter((t) => t.date && t.date > demain)],
    ["Sans date", normales.filter((t) => !t.date)],
  ];

  const zone = document.getElementById("groupes-taches");
  zone.replaceChildren();
  for (const [nom, liste] of groupes) {
    if (!liste.length) continue;
    const h = document.createElement("h2");
    h.textContent = `${nom} · ${liste.length}`;
    const ul = document.createElement("ul");
    ul.className = "liste";
    if (liste === importantes) { h.classList.add("titre-important"); ul.classList.add("liste-importante"); }
    remplir(ul, liste, { montrerDate: ["Plus tard", "En retard", "★ Très important"].includes(nom) });
    zone.append(h, ul);
  }
  if (!aFaire.length) {
    const p = document.createElement("p");
    p.className = "vide-msg";
    p.textContent = "Rien à faire ici 🎉";
    zone.append(p);
  }

  const faites = visibles.filter((t) => t.fait);
  document.getElementById("resume-faites").textContent = `Faites · ${faites.length}`;
  remplir(document.getElementById("liste-faites"), faites.reverse());
  afficherCorbeille();
}

// ---------- 8. Onglet AGENDA ----------
let jourChoisi = aujourdhui();

function lundiDe(txt) {
  const d = versDate(txt);
  const decalage = (d.getDay() + 6) % 7; // lundi = 0
  return ajouterJours(txt, -decalage);
}

function afficherAgenda() {
  const lundi = lundiDe(jourChoisi);
  const dimanche = ajouterJours(lundi, 6);
  const dl = versDate(lundi), dd = versDate(dimanche);
  document.getElementById("titre-semaine").textContent =
    `${dl.getDate()} ${MOIS[dl.getMonth()]} – ${dd.getDate()} ${MOIS[dd.getMonth()]}`;

  const bande = document.getElementById("bande-jours");
  bande.replaceChildren();
  for (let i = 0; i < 7; i++) {
    const jour = ajouterJours(lundi, i);
    const d = versDate(jour);
    const b = document.createElement("button");
    if (jour === aujourdhui()) b.classList.add("auj");
    if (jour === jourChoisi) b.classList.add("choisi");

    const nom = document.createElement("span");
    nom.textContent = JOURS[d.getDay()];
    const num = document.createElement("b");
    num.textContent = d.getDate();
    const points = document.createElement("span");
    points.className = "points";
    // Les tâches ★ d'abord, en orange
    const duJourLa = taches.filter((t) => (t.date === jour && !t.fait) || tombeLe(t, jour))
      .sort((a, b) => (b.important ? 1 : 0) - (a.important ? 1 : 0));
    for (const t of duJourLa.slice(0, 3)) {
      const i = document.createElement("i");
      if (t.important) i.className = "important";
      points.append(i);
    }

    b.append(nom, num, points);
    b.addEventListener("click", () => { jourChoisi = jour; afficher(); });
    bande.append(b);
  }

  document.getElementById("titre-jour").textContent = jolieDate(jourChoisi);
  const vraies = taches.filter((t) => t.date === jourChoisi);
  const futures = taches.filter((t) => tombeLe(t, jourChoisi));
  const duJour = [...vraies, ...futures].sort((a, b) => (a.heure || "99") < (b.heure || "99") ? -1 : 1);
  const ul = document.getElementById("liste-jour");
  ul.replaceChildren(...duJour.map((t) => ligneTache(t, { montrerDate: false, projection: futures.includes(t) })));
  if (!duJour.length) {
    const li = document.createElement("li");
    li.className = "vide-msg";
    li.textContent = "Rien ce jour-là.";
    ul.append(li);
  }
}

document.getElementById("semaine-prec").addEventListener("click", () => { jourChoisi = ajouterJours(jourChoisi, -7); afficher(); });
document.getElementById("semaine-suiv").addEventListener("click", () => { jourChoisi = ajouterJours(jourChoisi, 7); afficher(); });

// ---------- 9. Ajouter / modifier / supprimer ----------
const fenetre = document.getElementById("fenetre");
const formulaire = document.getElementById("formulaire");
let enEdition = null; // la tâche qu'on modifie (null = nouvelle tâche)

document.getElementById("choix-cat").replaceChildren(
  ...Object.entries(CATEGORIES).map(([cle, c]) => new Option(c.nom, cle))
);

const nouvelId = () => crypto.randomUUID?.() || String(Date.now() + Math.random());

// Les 7 boutons L M M J V S D (lundi en premier)
let joursChoisis = [];
const zoneJours = document.getElementById("jours-semaine");

function dessinerJours() {
  zoneJours.hidden = formulaire.repete.value !== "jours";
  zoneJours.replaceChildren(
    ...[1, 2, 3, 4, 5, 6, 0].map((j) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = LETTRES[j];
      b.setAttribute("aria-label", JOURS_LONGS[j]);
      b.classList.toggle("on", joursChoisis.includes(j));
      b.addEventListener("click", () => {
        joursChoisis = joursChoisis.includes(j) ? joursChoisis.filter((x) => x !== j) : [...joursChoisis, j];
        dessinerJours();
      });
      return b;
    })
  );
}
formulaire.repete.addEventListener("change", dessinerJours);

// La ligne « Mission payée » n'apparaît que pour la catégorie Réserve
// (avec les horaires : fin de mission, panier, et le résumé « payée 2 jours · panier ✓ »)
function majLigneMission() {
  const reserveOn = formulaire.cat.value === "reserve";
  const mission = reserveOn && formulaire.mission.checked;
  document.getElementById("ligne-mission").hidden = !reserveOn;
  document.getElementById("ligne-fin").hidden = !mission;
  document.getElementById("ligne-panier").hidden = !mission;
  const aide = document.getElementById("aide-mission");
  aide.hidden = !mission;
  if (mission && typeof calculMission === "function") {
    const c = calculMission({ heure: formulaire.heure.value, heureFin: formulaire.heureFin.value, panier: formulaire.panier.value });
    aide.textContent = c.inconnu
      ? "Mets l'heure de début (Heure) et de fin : l'appli saura si tu as le panier."
      : `Payée ${c.jours} jour${c.jours > 1 ? "s" : ""} · panier repas ${c.panier ? "✓" : "✗"}` +
        (formulaire.panier.value ? " (forcé)" : "");
  }
}
for (const champ of ["cat", "mission", "heure", "heureFin", "panier"]) {
  formulaire[champ].addEventListener("change", majLigneMission);
  formulaire[champ].addEventListener("input", majLigneMission);
}

function ouvrirFenetre(tache = null) {
  enEdition = tache;
  document.getElementById("titre-fenetre").textContent = tache ? "Modifier" : "Nouvelle tâche";
  document.getElementById("btn-supprimer").style.display = tache ? "" : "none";
  formulaire.titre.value = tache?.titre || "";
  // Nouvelle tâche depuis l'agenda : pré-remplie au jour affiché
  formulaire.date.value = tache ? tache.date || "" : (vueActive === "agenda" ? jourChoisi : aujourdhui());
  formulaire.heure.value = tache?.heure || "";
  formulaire.cat.value = tache?.cat || "perso";
  formulaire.note.value = tache?.note || "";
  formulaire.repete.value = tache?.repete || "";
  formulaire.important.checked = !!tache?.important;
  // Réserve : une tâche compte comme mission payée, sauf si on décoche
  formulaire.mission.checked = tache ? tache.mission !== false : true;
  formulaire.heureFin.value = tache?.heureFin || "";
  formulaire.panier.value = tache?.panier || "";
  majLigneMission();
  joursChoisis = tache?.jours ? [...tache.jours] : [];
  dessinerJours();
  fenetre.showModal();
  if (!tache) formulaire.titre.focus();
}

// Le bouton + ajoute une tâche… un mouvement d'argent sur Budget… une séance sur Forme
document.getElementById("btn-ajouter").addEventListener("click", () => {
  if (vueActive === "budget") ouvrirMouvement();
  else if (vueActive === "forme") {
    if (sousForme === "cycle") ouvrirJourCycle(aujourdhui());
    else if (sousForme === "alim") ouvrirRepas();
    else ouvrirForme("seance");
  }
  else if (vueActive === "moi") ajouterDansMoi();
  else ouvrirFenetre();
});
document.getElementById("btn-annuler").addEventListener("click", () => fenetre.close());

formulaire.addEventListener("submit", () => {
  const valeurs = {
    titre: formulaire.titre.value.trim(),
    date: formulaire.date.value,
    heure: formulaire.heure.value,
    cat: formulaire.cat.value,
    note: formulaire.note.value.trim(),
    repete: formulaire.repete.value,
    jours: formulaire.repete.value === "jours" ? [...joursChoisis] : [],
    important: formulaire.important.checked,
    mission: formulaire.cat.value === "reserve" ? formulaire.mission.checked : undefined,
    heureFin: formulaire.cat.value === "reserve" ? formulaire.heureFin.value : "",
    panier: formulaire.cat.value === "reserve" ? formulaire.panier.value : "",
  };
  if (!valeurs.titre) return;
  if (valeurs.repete) {
    // Une tâche répétée a toujours une date de départ
    if (!valeurs.date) valeurs.date = aujourdhui();
    // "Certains jours" sans jour coché → le jour de la date choisie
    if (valeurs.repete === "jours" && !valeurs.jours.length) valeurs.jours = [versDate(valeurs.date).getDay()];
    // Si la date de départ ne tombe pas un jour choisi, on avance au premier bon jour
    const permis = valeurs.repete === "ouvres" ? [1, 2, 3, 4, 5] : valeurs.repete === "jours" ? valeurs.jours : null;
    if (permis && !permis.includes(versDate(valeurs.date).getDay())) valeurs.date = suivante(valeurs.date, valeurs);
    valeurs.dateDebut = valeurs.date;
  }
  if (enEdition) {
    Object.assign(enEdition, valeurs);
  } else {
    taches.push({ id: nouvelId(), fait: false, creeLe: Date.now(), ...valeurs });
  }
  enregistrer();
  afficher();
});

document.getElementById("btn-supprimer").addEventListener("click", () => {
  if (!enEdition) return;
  fenetre.close();
  mettreALaCorbeille(enEdition.id); // pas de question : elle reste dans « Supprimées »
});

function basculer(id) {
  const t = taches.find((x) => x.id === id);
  if (!t) return;

  if (t.repete && !t.fait) {
    // 1. On garde une trace de ce qui a été fait (dans "Faites")
    taches.push({ ...t, id: nouvelId(), repete: "", jours: [], fait: true, creeLe: Date.now() });
    // 2. La tâche saute à sa prochaine date (jamais avant aujourd'hui)
    let prochaine = suivante(t.date || aujourdhui(), t);
    while (prochaine < aujourdhui()) prochaine = suivante(prochaine, t);
    t.date = prochaine;
    tachesPassees = tachesPassees.filter((x) => x !== t.id);
    enregistrer();
    afficher();
    return;
  }

  t.fait = !t.fait;
  enregistrer();
  afficher();
}

// ---------- 10. Tout redessiner ----------
function afficher() {
  document.getElementById("titre").textContent = TITRES[vueActive];
  document.getElementById("titre-petit").textContent = TITRES[vueActive];
  const sous = document.getElementById("sous-titre");
  const restantes = taches.filter((t) => !t.fait && t.date && t.date <= aujourdhui()).length;
  sous.textContent = {
    aujourdhui: jolieDate(aujourdhui()) + (restantes ? ` · ${restantes} à faire` : ""),
    taches: `${taches.filter((t) => !t.fait).length} à faire`,
    agenda: "Semaine",
    budget: "Ce mois-ci",
    forme: jolieDate(aujourdhui()),
    moi: jolieDate(aujourdhui()),
  }[vueActive];
  placerPilule();

  if (vueActive === "aujourdhui") afficherAujourdhui();
  if (vueActive === "taches") afficherTaches();
  if (vueActive === "agenda") afficherAgenda();
  // budget.js est chargé après ce fichier : on vérifie qu'il est là
  if (typeof afficherBudget === "function") {
    if (vueActive === "budget") afficherBudget();
    if (vueActive === "aujourdhui") afficherMiniBudget();
  }
  if (typeof afficherForme === "function") {
    if (vueActive === "forme") afficherForme();
    if (vueActive === "aujourdhui") afficherMiniForme();
  }
}

// La pilule de verre glisse sous l'onglet choisi
function placerPilule() {
  const actif = document.querySelector(".onglets button.active");
  // Sur Aujourd'hui, aucun onglet du bas n'est choisi : la pilule se cache
  pilule.classList.toggle("cachee", !actif);
  if (actif) pilule.style.transform = `translateX(${actif.offsetLeft}px)`;
}

// La barre du haut devient du verre dès qu'on fait défiler
const barreHaut = document.getElementById("barre-haut");
window.addEventListener("scroll", () => barreHaut.classList.toggle("defile", window.scrollY > 40), { passive: true });

// Pas de zoom à deux doigts (Safari ignore parfois l'interdiction du HTML)
["gesturestart", "gesturechange", "gestureend"].forEach((ev) =>
  document.addEventListener(ev, (e) => e.preventDefault(), { passive: false })
);

// Toucher le fond sombre ferme la feuille
fenetre.addEventListener("click", (e) => { if (e.target === fenetre) fenetre.close(); });

afficher();

// ---------- 11. Mode hors-ligne ----------
// Le "service worker" garde une copie de l'appli sur l'iPhone :
// elle s'ouvre même sans réseau.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
