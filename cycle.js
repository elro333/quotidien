// ============================================================
// cycle.js — dans l'onglet Forme, la partie « Cycle »
//
// Règles, pilule, humeur, rapports : un petit carnet par jour
// (forme.cycle.jours), et la pilule (forme.cycle.pilule).
// Tout reste dans le téléphone, comme le reste de l'appli.
// Les dates prévues sont des ESTIMATIONS, jamais une contraception.
// ============================================================

const HUMEURS = [
  ["😄", "Au top"], ["🙂", "Bien"], ["😐", "Bof"], ["😔", "Triste"],
  ["😢", "À fleur de peau"], ["😠", "Énervée"], ["😴", "Fatiguée"],
];
const FLUX = { leger: "Léger", moyen: "Moyen", abondant: "Abondant" };
const TYPES_PILULE = {
  "21-7":     { nom: "21 j + 7 j d'arrêt", actifs: 21, total: 28 },
  "24-4":     { nom: "24 j + 4 j d'arrêt", actifs: 24, total: 28 },
  "28":       { nom: "28 j sans arrêt", actifs: 28, total: 28 },
  "continue": { nom: "En continu", actifs: Infinity, total: null },
};

// ---------- 1. Petits outils ----------
const jourCycle = (d) => forme.cycle.jours[d] || {};
const diffJours = (a, b) => Math.round((versDate(b) - versDate(a)) / 86400000);

// Modifie un jour ; un jour vide est retiré pour garder le fichier léger
function changerJour(d, valeurs) {
  const j = { ...jourCycle(d), ...valeurs };
  for (const k of Object.keys(j)) if (j[k] === "" || j[k] === false || j[k] == null) delete j[k];
  if (Object.keys(j).length) forme.cycle.jours[d] = j;
  else delete forme.cycle.jours[d];
}

// Le premier jour de chaque période de règles
function debutsRegles() {
  return Object.keys(forme.cycle.jours)
    .filter((d) => jourCycle(d).regles && !jourCycle(ajouterJours(d, -1)).regles)
    .sort();
}

// Durée moyenne du cycle (entre deux débuts), sur les 6 derniers. 28 par défaut.
function dureeCycle() {
  const debuts = debutsRegles();
  const ecarts = [];
  for (let i = 1; i < debuts.length; i++) {
    const e = diffJours(debuts[i - 1], debuts[i]);
    if (e >= 18 && e <= 45) ecarts.push(e);   // on ignore les écarts bizarres (oubli de noter)
  }
  const derniers = ecarts.slice(-6);
  return derniers.length ? Math.round(derniers.reduce((a, b) => a + b, 0) / derniers.length) : 28;
}

// Durée moyenne des règles. 5 par défaut.
function dureeRegles() {
  const durees = debutsRegles().map((d) => {
    let n = 0;
    while (jourCycle(ajouterJours(d, n)).regles && n < 15) n++;
    return n;
  }).slice(-6);
  return durees.length ? Math.round(durees.reduce((a, b) => a + b, 0) / durees.length) : 5;
}

// Où en est le cycle aujourd'hui
function etatCycle() {
  const auj = aujourdhui();
  const debuts = debutsRegles().filter((d) => d <= auj);
  if (!debuts.length) return null;
  const dernier = debuts[debuts.length - 1];
  const duree = dureeCycle();
  const prochaines = ajouterJours(dernier, duree);
  return {
    jour: diffJours(dernier, auj) + 1,
    duree,
    dureeRegles: dureeRegles(),
    prochaines,
    dans: diffJours(auj, prochaines),
    enCours: !!jourCycle(auj).regles,
  };
}

// Les jours de règles PRÉVUS (pour les montrer en pointillé dans le calendrier)
function reglesPrevues(d) {
  const e = etatCycle();
  if (!e || d <= aujourdhui()) return false;
  for (let k = 0; k < 6; k++) {
    const debut = ajouterJours(e.prochaines, k * e.duree);
    const ecart = diffJours(debut, d);
    if (ecart >= 0 && ecart < e.dureeRegles) return true;
  }
  return false;
}

// La pilule ce jour-là : { prise: true/false, numero, total, reprise }
function etatPilule(jour) {
  const p = forme.cycle.pilule;
  if (!p.active || !p.debut || jour < p.debut) return null;
  const t = TYPES_PILULE[p.type] || TYPES_PILULE["21-7"];
  if (!t.total) return { prise: true, numero: null };
  const pos = diffJours(p.debut, jour) % t.total;
  return {
    prise: pos < t.actifs,
    numero: pos + 1,
    total: t.actifs,
    reprise: pos < t.actifs ? null : ajouterJours(jour, t.total - pos),
  };
}

const dateCourte = (d) => { const x = versDate(d); return `${JOURS[x.getDay()]} ${x.getDate()} ${MOIS[x.getMonth()]}`; };

// ---------- 2. Activité / Cycle : l'interrupteur en haut de Forme ----------
let sousForme = "activite";
function changerSousForme(s) {
  sousForme = s;
  document.querySelectorAll("#segment-forme button").forEach((b) => b.classList.toggle("active", b.dataset.sous === s));
  document.getElementById("forme-activite").hidden = s !== "activite";
  document.getElementById("forme-cycle").hidden = s !== "cycle";
  document.getElementById("forme-alim").hidden = s !== "alim";
  window.scrollTo(0, 0);
  afficher();
}
document.querySelectorAll("#segment-forme button").forEach((b) =>
  b.addEventListener("click", () => changerSousForme(b.dataset.sous))
);

// ---------- 3. Dessiner la partie Cycle ----------
let moisCycle = moisActuel();

function afficherCycle() {
  dessinerCarteCycle();
  dessinerCartePilule(document.getElementById("carte-pilule"), false);
  dessinerHumeur(document.getElementById("humeur-cycle"));
  dessinerCalendrier();
  dessinerHistoriquePilule();
}

function dessinerCarteCycle() {
  const carte = document.getElementById("carte-cycle");
  carte.replaceChildren();
  const e = etatCycle();
  const auj = aujourdhui();

  if (!e) {
    carte.classList.add("vide");
    carte.append(el("span", "grand-emoji", "🌸"),
      "Note tes premiers jours de règles : touche « J'ai mes règles » ou un jour du calendrier.");
  } else {
    carte.classList.remove("vide");
    carte.append(el("div", "etiquette etiquette-cycle", e.enCours ? "Règles en cours" : "Ton cycle"));
    carte.append(el("div", "tache-titre", `Jour ${e.jour}`));
    let texte;
    if (e.dans > 1) texte = `Prochaines règles dans ≈ ${e.dans} jours (${dateCourte(e.prochaines)})`;
    else if (e.dans === 1) texte = "Prochaines règles ≈ demain";
    else if (e.dans === 0) texte = "Règles prévues ≈ aujourd'hui";
    else texte = `Règles prévues il y a ${-e.dans} jour${e.dans < -1 ? "s" : ""}`;
    if (e.enCours) texte = `Fin prévue ≈ ${dateCourte(ajouterJours(debutsRegles().filter((d) => d <= auj).pop(), e.dureeRegles - 1))}`;
    carte.append(el("p", "muted", texte));
    carte.append(el("p", "petit", `Cycle moyen ≈ ${e.duree} j · règles ≈ ${e.dureeRegles} j · des estimations`));
  }

  const boutons = el("div", "boutons");
  const b = el("button", jourCycle(auj).regles ? "btn-secondaire" : "btn-principal btn-rouge",
    jourCycle(auj).regles ? "✓ Règles notées aujourd'hui" : "J'ai mes règles");
  b.addEventListener("click", () => {
    if (jourCycle(auj).regles) return ouvrirJourCycle(auj);
    changerJour(auj, { regles: "moyen" });
    enregistrerForme();
    afficher();
  });
  boutons.append(b);
  carte.append(boutons);
}

// La carte pilule (aussi utilisée en petit sur Aujourd'hui)
function dessinerCartePilule(carte, mini) {
  carte.replaceChildren();
  const p = forme.cycle.pilule;
  const auj = aujourdhui();

  if (!p.active) {
    if (mini) { carte.hidden = true; return; }
    const dernier = p.historique[p.historique.length - 1];
    const haut = el("div", "haut-cat");
    haut.append(el("strong", "", "💊 Pilule"));
    carte.append(haut);
    carte.append(el("p", "petit", dernier?.action === "arret"
      ? `Arrêtée le ${dateCourte(dernier.date)}.`
      : "Tu peux noter ta pilule pour suivre chaque prise."));
    const b = el("button", "btn-texte", dernier?.action === "arret" ? "Je la reprends" : "Ajouter ma pilule");
    b.addEventListener("click", () => ouvrirPilule(!!dernier));
    carte.append(b);
    return;
  }

  carte.hidden = false;
  const e = etatPilule(auj);
  const prise = !!jourCycle(auj).pilule;
  const haut = el("div", "haut-cat");
  haut.append(el("strong", "", "💊 " + (p.nom || "Ma pilule")));
  if (!mini) {
    const modifier = el("button", "btn-texte", "Modifier");
    modifier.addEventListener("click", () => ouvrirPilule());
    haut.append(modifier);
  }
  carte.append(haut);

  if (!e) {
    carte.append(el("p", "petit", `Début prévu le ${dateCourte(p.debut)}.`));
  } else if (e.prise) {
    carte.append(el("p", "petit",
      (e.numero ? `Comprimé ${e.numero} / ${e.total}` : "Un comprimé par jour") + (p.heure ? ` · à ${p.heure.replace(":", "h")}` : "")));
    const b = el("button", prise ? "btn-secondaire bouton-pris" : "btn-principal btn-vert", prise ? "✓ Prise aujourd'hui" : "Je l'ai prise");
    b.addEventListener("click", () => {
      changerJour(auj, { pilule: !prise });
      enregistrerForme();
      afficher();
    });
    carte.append(b);
  } else {
    carte.append(el("p", "petit", `Jours d'arrêt · reprise le ${dateCourte(e.reprise)}`));
  }

  // Hier : un comprimé à prendre, mais pas noté ?
  const hier = ajouterJours(auj, -1);
  const eh = etatPilule(hier);
  if (eh?.prise && !jourCycle(hier).pilule) {
    carte.append(el("p", "alerte-pilule", "⚠️ Pas notée hier. Si tu l'as oubliée, regarde la notice de ta pilule (ou demande à un pharmacien)."));
  }
}

// Les humeurs, en une rangée de smileys
function dessinerHumeur(zone) {
  const auj = aujourdhui();
  const actuelle = jourCycle(auj).humeur;
  zone.replaceChildren(el("div", "titre-humeur", actuelle
    ? `Aujourd'hui : ${HUMEURS.find((h) => h[0] === actuelle)?.[1] || ""}`
    : "Comment tu te sens aujourd'hui ?"));
  const rangee = el("div", "rangee-humeurs");
  for (const [emoji, nom] of HUMEURS) {
    const b = el("button", "humeur" + (emoji === actuelle ? " choisie" : ""), emoji);
    b.setAttribute("aria-label", nom);
    b.addEventListener("click", () => {
      changerJour(auj, { humeur: emoji === actuelle ? "" : emoji });
      enregistrerForme();
      afficher();
    });
    rangee.append(b);
  }
  zone.append(rangee);
}

function dessinerCalendrier() {
  document.getElementById("titre-mois-cycle").textContent = nomMois(moisCycle);
  const grille = document.getElementById("calendrier-cycle");
  grille.replaceChildren();
  for (const l of ["L", "M", "M", "J", "V", "S", "D"]) grille.append(el("span", "entete-cal", l));

  const premier = moisCycle + "-01";
  const decalage = (versDate(premier).getDay() + 6) % 7; // lundi = 0
  for (let i = 0; i < decalage; i++) grille.append(el("span"));

  const [a, m] = moisCycle.split("-").map(Number);
  const nbJours = new Date(a, m, 0).getDate();
  const auj = aujourdhui();
  for (let n = 1; n <= nbJours; n++) {
    const d = `${moisCycle}-${String(n).padStart(2, "0")}`;
    const j = jourCycle(d);
    const c = el("button", "case-cal");
    const num = el("span", "num-cal", String(n));
    if (j.regles) num.classList.add("regles", j.regles);
    else if (reglesPrevues(d)) num.classList.add("prevues");
    if (d === auj) c.classList.add("auj");
    const marques = el("span", "marques-cal");
    if (j.humeur) marques.append(el("span", "", j.humeur));
    else if (j.pilule) marques.append(el("i", "point-pilule"));
    if (j.rapport) marques.append(el("span", "coeur", "♥"));
    c.append(num, marques);
    c.addEventListener("click", () => ouvrirJourCycle(d));
    grille.append(c);
  }
}
document.getElementById("mois-cycle-prec").addEventListener("click", () => { moisCycle = decalerMois(moisCycle, -1); dessinerCalendrier(); });
document.getElementById("mois-cycle-suiv").addEventListener("click", () => { moisCycle = decalerMois(moisCycle, 1); dessinerCalendrier(); });

function dessinerHistoriquePilule() {
  const zone = document.getElementById("historique-pilule");
  const h = forme.cycle.pilule.historique;
  zone.hidden = !h.length;
  const ul = zone.querySelector("ul");
  ul.replaceChildren(...[...h].reverse().map((x) => {
    const li = el("li");
    const infos = el("div", "infos");
    infos.append(el("div", "t", x.action === "arret" ? "Arrêt" : `Début${x.nom ? " · " + x.nom : ""}`));
    infos.append(el("div", "m", jolieDate(x.date)));
    li.append(infos);
    return li;
  }));
}

// ---------- 4. Feuille « un jour » ----------
const fenJour = document.getElementById("fenetre-jour-cycle");
const formJour = document.getElementById("form-jour-cycle");
let jourEdite = null;
let fluxChoisi = "";
let humeurChoisie = "";

function dessinerFeuilleJour() {
  document.querySelectorAll("#choix-flux button").forEach((b) => b.classList.toggle("active", b.dataset.flux === fluxChoisi));
  const zone = document.getElementById("choix-humeur");
  zone.replaceChildren(...HUMEURS.map(([emoji, nom]) => {
    const b = el("button", "humeur" + (emoji === humeurChoisie ? " choisie" : ""), emoji);
    b.type = "button";
    b.setAttribute("aria-label", nom);
    b.addEventListener("click", () => { humeurChoisie = emoji === humeurChoisie ? "" : emoji; dessinerFeuilleJour(); });
    return b;
  }));
  document.getElementById("ligne-pilule-jour").hidden = !etatPilule(jourEdite)?.prise;
  document.getElementById("ligne-protege").hidden = !formJour.rapport.checked;
}
document.querySelectorAll("#choix-flux button").forEach((b) =>
  b.addEventListener("click", () => { fluxChoisi = b.dataset.flux; dessinerFeuilleJour(); })
);
formJour.rapport.addEventListener("change", dessinerFeuilleJour);

function ouvrirJourCycle(d) {
  jourEdite = d;
  const j = jourCycle(d);
  document.getElementById("titre-jour-cycle").textContent = dateCourte(d);
  fluxChoisi = j.regles || "";
  humeurChoisie = j.humeur || "";
  formJour.pilule.checked = !!j.pilule;
  formJour.rapport.checked = !!j.rapport;
  formJour.protege.checked = !!j.protege;
  formJour.note.value = j.note || "";
  dessinerFeuilleJour();
  fenJour.showModal();
}

formJour.addEventListener("submit", () => {
  changerJour(jourEdite, {
    regles: fluxChoisi,
    humeur: humeurChoisie,
    pilule: etatPilule(jourEdite)?.prise ? formJour.pilule.checked : jourCycle(jourEdite).pilule,
    rapport: formJour.rapport.checked,
    protege: formJour.rapport.checked && formJour.protege.checked,
    note: formJour.note.value.trim(),
  });
  enregistrerForme();
  afficher();
});

// ---------- 5. Feuille « ma pilule » ----------
const fenPilule = document.getElementById("fenetre-pilule");
const formPilule = document.getElementById("form-pilule");

formPilule.type.replaceChildren(...Object.entries(TYPES_PILULE).map(([k, t]) => new Option(t.nom, k)));

function ouvrirPilule(reprise = false) {
  const p = forme.cycle.pilule;
  formPilule.nom.value = p.nom || "";
  formPilule.type.value = p.type;
  // Reprise ou première fois : la plaquette commence aujourd'hui (modifiable)
  formPilule.debut.value = p.active ? p.debut : aujourdhui();
  formPilule.heure.value = p.heure || "";
  document.getElementById("arret-pilule").style.display = p.active ? "" : "none";
  document.getElementById("aide-debut").textContent = p.active
    ? "Le jour où tu as pris le 1er comprimé de la plaquette en cours (ou de la première)."
    : reprise ? "Le jour où tu reprends (1er comprimé)." : "Le jour du 1er comprimé de ta plaquette.";
  fenPilule.showModal();
}

formPilule.addEventListener("submit", (e) => {
  const p = forme.cycle.pilule;
  if (!formPilule.debut.value) { e.preventDefault(); return; }
  if (!p.active) p.historique.push({ action: "debut", date: formPilule.debut.value, nom: formPilule.nom.value.trim() });
  Object.assign(p, {
    active: true,
    nom: formPilule.nom.value.trim(),
    type: formPilule.type.value,
    debut: formPilule.debut.value,
    heure: formPilule.heure.value,
  });
  enregistrerForme();
  afficher();
});

document.getElementById("arret-pilule").addEventListener("click", () => {
  if (!confirm("Noter que tu arrêtes la pilule aujourd'hui ?")) return;
  const p = forme.cycle.pilule;
  p.active = false;
  p.historique.push({ action: "arret", date: aujourdhui(), nom: p.nom });
  enregistrerForme();
  fenPilule.close();
  afficher();
});

for (const fen of [fenJour, fenPilule]) {
  fen.querySelector("[data-fermer]").addEventListener("click", () => fen.close());
  fen.addEventListener("click", (e) => { if (e.target === fen) fen.close(); });
}

// ---------- 6. Brancher dans l'appli ----------
// À chaque fois que l'écran est redessiné : la partie Cycle, et sur
// Aujourd'hui, la pilule du jour + l'humeur.
const afficherSansCycle = afficher;
afficher = function () {
  afficherSansCycle();
  if (vueActive === "forme" && sousForme === "cycle") afficherCycle();
  if (vueActive === "aujourdhui") {
    dessinerCartePilule(document.getElementById("mini-pilule"), true);
    dessinerHumeur(document.getElementById("humeur-jour"));
  }
};

afficher();
