// ============================================================
// budget.js — l'onglet Budget
//
// Même principe que pour les tâches : une liste de "mouvements"
// (dépenses et revenus), qu'on enregistre puis qu'on redessine.
// Les montants sont gardés en CENTIMES (nombres entiers) :
// 12,50 € = 1250. Ça évite les erreurs d'arrondi des décimales.
// ============================================================

// ---------- 1. Les catégories ----------
const CAT_DEPENSES = {
  courses:      { nom: "Courses",        emoji: "🛒", couleur: "#34c759" },
  restos:       { nom: "Restos, sorties", emoji: "🍕", couleur: "#ff9500" },
  factures:     { nom: "Factures",       emoji: "🧾", couleur: "#ff9f0a" },
  abonnements:  { nom: "Abonnements",    emoji: "📱", couleur: "#5856d6" },
  transport:    { nom: "Transport",      emoji: "🚆", couleur: "#007aff" },
  shopping:     { nom: "Shopping",       emoji: "🛍️", couleur: "#ff2d55" },
  sante:        { nom: "Santé, beauté",  emoji: "💊", couleur: "#ff3b30" },
  sport:        { nom: "Sport",          emoji: "🏋️", couleur: "#32ade6" },
  loisirs:      { nom: "Loisirs",        emoji: "🎉", couleur: "#af52de" },
  cadeaux:      { nom: "Cadeaux",        emoji: "🎁", couleur: "#ffcc00" },
  logement:     { nom: "Logement",       emoji: "🏠", couleur: "#a2845e" },
  remboursement:{ nom: "Remboursement",  emoji: "↩️", couleur: "#5e5ce6" },
  epargne:      { nom: "Épargne",        emoji: "🐷", couleur: "#30b0c7" },
  autre:        { nom: "Autre",          emoji: "•••", couleur: "#8e8e93" },
};
const CAT_REVENUS = {
  salaire:  { nom: "Salaire",          emoji: "💼", couleur: "#34c759" },
  missions: { nom: "Missions",         emoji: "🗓️", couleur: "#30b0c7" },
  extra:    { nom: "Petits boulots",   emoji: "🔑", couleur: "#ff9500" },
  famille:  { nom: "Famille",          emoji: "💛", couleur: "#ffcc00" },
  aides:    { nom: "Aides, bourses",   emoji: "🏛️", couleur: "#007aff" },
  rembourse:{ nom: "On m'a remboursé", emoji: "🔁", couleur: "#5856d6" },
  autre:    { nom: "Autre",            emoji: "•••", couleur: "#8e8e93" },
};
const catDe = (m) => (m.type === "revenu" ? CAT_REVENUS : CAT_DEPENSES)[m.cat] || { nom: "Autre", emoji: "•••", couleur: "#8e8e93" };

// ---------- 2. Les données ----------
// mouvement : { id, type: "depense" | "revenu", montant (centimes), libelle, cat, date,
//               mensuel: true/false, modeleId (si créé automatiquement), dette (id) }
// dette     : { id, nom, total (centimes) }
const CLE_BUDGET = "quotidien.budget.v1";
let budget = chargerBudget();

function chargerBudget() {
  try {
    const b = JSON.parse(localStorage.getItem(CLE_BUDGET));
    // On garde tout (réserve, objectifs d'épargne, plafonds…), et on complète ce qui manque
    return { ...(b || {}), mouvements: b?.mouvements || [], dettes: b?.dettes || [] };
  } catch (e) {
    return { mouvements: [], dettes: [] };
  }
}
function enregistrerBudget() {
  try {
    localStorage.setItem(CLE_BUDGET, JSON.stringify(budget));
  } catch (e) {
    alert("Impossible d'enregistrer sur cet appareil.");
  }
}

// ---------- 3. Outils : argent et mois ----------
const formatEuros = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const euros = (centimes) => formatEuros.format(centimes / 100);

// "12,5" ou "12.50" ou "1 200" → centimes. Renvoie null si ce n'est pas un nombre > 0.
function lireMontant(texte) {
  const n = parseFloat(String(texte).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
}
const versTexteMontant = (centimes) => String(centimes / 100).replace(".", ",");

const MOIS_LONGS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const moisDe = (date) => date.slice(0, 7);          // "2026-11-20" → "2026-11"
const moisActuel = () => moisDe(aujourdhui());
function decalerMois(mois, n) {
  const [a, m] = mois.split("-").map(Number);
  const d = new Date(a, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function nomMois(mois) {
  const [a, m] = mois.split("-").map(Number);
  return `${MOIS_LONGS[m - 1]} ${a}`;
}

let moisAffiche = moisActuel();

// ---------- 4. Les mouvements « chaque mois » ----------
// Un mouvement coché « Chaque mois » sert de modèle : pour chaque mois
// écoulé depuis (jusqu'au mois en cours), on crée sa copie si elle manque.
function creerMensuels() {
  let ajoutes = 0;
  const fin = moisActuel();
  for (const modele of budget.mouvements.filter((m) => m.mensuel)) {
    let mois = decalerMois(moisDe(modele.date), 1);
    while (mois <= fin) {
      const existe = budget.mouvements.some((m) => m.modeleId === modele.id && moisDe(m.date) === mois);
      if (!existe) {
        const [a, mo] = mois.split("-").map(Number);
        const dernierJour = new Date(a, mo, 0).getDate();
        const jour = Math.min(Number(modele.date.slice(8, 10)), dernierJour);
        budget.mouvements.push({
          ...modele, id: nouvelId(), mensuel: false, modeleId: modele.id,
          date: `${mois}-${String(jour).padStart(2, "0")}`,
        });
        ajoutes++;
      }
      mois = decalerMois(mois, 1);
    }
  }
  if (ajoutes) enregistrerBudget();
}

// ---------- 5. Calculs du mois ----------
function totauxDuMois(mois) {
  const liste = budget.mouvements.filter((m) => moisDe(m.date) === mois);
  const revenus = liste.filter((m) => m.type === "revenu").reduce((s, m) => s + m.montant, 0);
  const depenses = liste.filter((m) => m.type === "depense").reduce((s, m) => s + m.montant, 0);
  return { liste, revenus, depenses, reste: revenus - depenses };
}

// Petit outil pour créer un élément avec une classe et un texte
function el(balise, classe, texte) {
  const e = document.createElement(balise);
  if (classe) e.className = classe;
  if (texte !== undefined) e.textContent = texte;
  return e;
}
function pastilleCat(c) {
  const p = el("span", "ico-cat", c.emoji);
  p.style.background = c.couleur;
  return p;
}

// ---------- 6. Dessiner l'onglet ----------
function afficherBudget() {
  creerMensuels();
  document.getElementById("titre-mois").textContent = nomMois(moisAffiche);
  document.getElementById("sous-titre").textContent =
    moisAffiche === moisActuel() ? "Ce mois-ci" : nomMois(moisAffiche);
  const t = totauxDuMois(moisAffiche);
  dessinerReste(t);
  dessinerRepartition(t);
  dessinerFactures();
  dessinerDettes();
  dessinerMouvements(t);
}

function dessinerReste({ revenus, depenses, reste }) {
  const carte = document.getElementById("carte-reste");
  carte.replaceChildren();

  carte.append(el("div", "etiquette", reste >= 0 ? "Il te reste" : "Tu es dans le rouge"));
  const gros = el("div", "gros-montant " + (reste >= 0 ? "positif" : "negatif"), euros(reste));
  carte.append(gros);

  // Barre : part des revenus déjà dépensée
  const barre = el("div", "barre");
  const rempli = el("span");
  const part = revenus ? Math.min(depenses / revenus, 1) : (depenses ? 1 : 0);
  rempli.style.width = (part * 100).toFixed(1) + "%";
  rempli.className = part >= 0.9 ? "alerte" : part >= 0.7 ? "attention" : "";
  barre.append(rempli);
  carte.append(barre);

  const ligne = el("div", "deux-totaux");
  const r = el("div"); r.append(el("span", "petit", "Revenus"), el("strong", "positif", "+" + euros(revenus)));
  const d = el("div"); d.append(el("span", "petit", "Dépenses"), el("strong", "", "−" + euros(depenses)));
  ligne.append(r, d);
  carte.append(ligne);

  // Ce mois-ci : combien par jour jusqu'à la fin du mois
  if (moisAffiche === moisActuel() && reste > 0) {
    const auj = new Date();
    const joursRestants = new Date(auj.getFullYear(), auj.getMonth() + 1, 0).getDate() - auj.getDate() + 1;
    carte.append(el("p", "muted", `≈ ${euros(Math.floor(reste / joursRestants))} par jour jusqu'à la fin du mois`));
  }
}

function dessinerRepartition({ liste, depenses }) {
  const zone = document.getElementById("repartition");
  zone.replaceChildren();
  const parCat = {};
  for (const m of liste.filter((m) => m.type === "depense")) parCat[m.cat] = (parCat[m.cat] || 0) + m.montant;
  const lignes = Object.entries(parCat).sort((a, b) => b[1] - a[1]);
  if (!lignes.length) {
    zone.append(el("p", "vide-msg", "Aucune dépense ce mois-ci."));
    return;
  }
  const max = lignes[0][1];
  for (const [cle, somme] of lignes) {
    const c = CAT_DEPENSES[cle] || CAT_DEPENSES.autre;
    const ligne = el("div", "ligne-cat");
    const texte = el("div", "infos-cat");
    const haut = el("div", "haut-cat");
    haut.append(el("span", "", c.nom), el("strong", "", euros(somme)));
    const barre = el("div", "barre fine");
    const rempli = el("span");
    rempli.style.width = (somme / max * 100).toFixed(1) + "%";
    rempli.style.background = c.couleur;
    barre.append(rempli);
    const pct = el("div", "petit", Math.round(somme / depenses * 100) + " % des dépenses");
    texte.append(haut, barre, pct);
    ligne.append(pastilleCat(c), texte);
    zone.append(ligne);
  }
}

// ---------- Les factures mensuelles ----------
// Ce sont les dépenses cochées « Chaque mois » : l'appli les recopie
// toute seule chaque mois. Ici, on les voit toutes au même endroit.
function occurrenceDuMois(modele, mois) {
  if (moisDe(modele.date) === mois) return modele;
  return budget.mouvements.find((m) => m.modeleId === modele.id && moisDe(m.date) === mois) || null;
}

function dessinerFactures() {
  const zone = document.getElementById("factures");
  zone.replaceChildren();
  const modeles = budget.mouvements
    .filter((m) => m.mensuel && m.type === "depense")
    .sort((a, b) => Number(a.date.slice(8, 10)) - Number(b.date.slice(8, 10)));
  if (!modeles.length) {
    zone.append(el("p", "aide", "Ton forfait téléphone, ton assurance, tes abonnements… Ajoute-les une fois : ils se recopient tout seuls chaque mois."));
    return;
  }
  const total = modeles.reduce((t, m) => t + m.montant, 0);
  const ul = el("ul", "liste verre");
  for (const modele of modeles) {
    const c = catDe(modele);
    const li = el("li", "ligne-mvt");
    const infos = el("div", "infos");
    infos.append(el("div", "t", modele.libelle || c.nom));
    const jour = Number(modele.date.slice(8, 10));
    const occ = occurrenceDuMois(modele, moisAffiche);
    let statut;
    if (moisAffiche < moisDe(modele.date)) statut = "pas encore commencée";
    else if (occ && occ.date <= aujourdhui()) statut = `payée le ${jour} ✓`;
    else statut = `prélevée le ${jour}`;
    infos.append(el("div", "m", `${c.nom} · ${statut}`));
    li.append(pastilleCat(c), infos, el("strong", "montant-ligne", euros(modele.montant)));
    li.addEventListener("click", () => ouvrirMouvement(modele));
    ul.append(li);
  }
  zone.append(ul);
  zone.append(el("p", "petit total-factures", `Total : ${euros(total)} par mois`));
}

function rembourseSur(dette) {
  return budget.mouvements
    .filter((m) => m.type === "depense" && m.cat === "remboursement" && m.dette === dette.id)
    .reduce((s, m) => s + m.montant, 0);
}

function dessinerDettes() {
  const zone = document.getElementById("dettes");
  zone.replaceChildren();
  if (!budget.dettes.length) {
    zone.append(el("p", "aide", "Aucune dette suivie. « Ajouter » pour en suivre une."));
    return;
  }
  for (const dette of budget.dettes) {
    const rendu = rembourseSur(dette);
    const reste = Math.max(dette.total - rendu, 0);
    const carte = el("button", "verre carte-dette");
    const haut = el("div", "haut-cat");
    haut.append(el("strong", "", dette.nom), el("span", reste ? "" : "positif", reste ? `reste ${euros(reste)}` : "Remboursé ✓"));
    const barre = el("div", "barre fine");
    const rempli = el("span");
    rempli.style.width = Math.min(rendu / dette.total * 100, 100).toFixed(1) + "%";
    rempli.style.background = "var(--vert)";
    barre.append(rempli);
    carte.append(haut, barre, el("div", "petit", `${euros(rendu)} rendus sur ${euros(dette.total)}`));
    carte.addEventListener("click", () => ouvrirDette(dette));
    zone.append(carte);
  }
}

function dessinerMouvements({ liste }) {
  const zone = document.getElementById("mouvements");
  zone.replaceChildren();
  if (!liste.length) {
    zone.append(el("p", "vide-msg", "Rien ce mois-ci. Touche + pour noter une dépense ou un revenu."));
    return;
  }
  // Regroupés par jour, du plus récent au plus ancien
  const parJour = {};
  for (const m of liste) (parJour[m.date] ||= []).push(m);
  for (const jour of Object.keys(parJour).sort().reverse()) {
    zone.append(el("h3", "jour-mvt", jolieDate(jour)));
    const ul = el("ul", "liste verre");
    for (const m of parJour[jour]) {
      const c = catDe(m);
      const li = el("li", "ligne-mvt");
      const infos = el("div", "infos");
      infos.append(el("div", "t", m.libelle || c.nom));
      const meta = [c.nom];
      if (m.mensuel || m.modeleId) meta.push("↻ chaque mois");
      if (m.dette) {
        const d = budget.dettes.find((x) => x.id === m.dette);
        if (d) meta.push("→ " + d.nom);
      }
      infos.append(el("div", "m", meta.join(" · ")));
      const montant = el("strong", "montant-ligne " + (m.type === "revenu" ? "positif" : ""),
        (m.type === "revenu" ? "+" : "−") + euros(m.montant));
      li.append(pastilleCat(c), infos, montant);
      li.addEventListener("click", () => ouvrirMouvement(m));
      ul.append(li);
    }
    zone.append(ul);
  }
}

// Le petit rappel sur l'onglet Aujourd'hui
function afficherMiniBudget() {
  creerMensuels();
  const bouton = document.getElementById("mini-budget");
  const { reste, revenus, depenses } = totauxDuMois(moisActuel());
  const entete = el("span", "entete-tuile", "Budget ›");
  entete.style.color = "var(--vert)";
  if (!revenus && !depenses) {
    bouton.replaceChildren(entete, el("span", "petit", "Rien de noté ce mois-ci."));
    return;
  }
  bouton.replaceChildren(
    entete,
    el("span", "petit", reste >= 0 ? "Il te reste" : "Dans le rouge"),
    el("strong", "chiffre-tuile " + (reste >= 0 ? "positif" : "negatif"), euros(reste)),
    el("span", "petit", `${euros(depenses)} dépensés`),
  );
}
document.getElementById("mini-budget").addEventListener("click", () => allerA("budget"));

document.getElementById("mois-prec").addEventListener("click", () => { moisAffiche = decalerMois(moisAffiche, -1); afficherBudget(); });
document.getElementById("mois-suiv").addEventListener("click", () => { moisAffiche = decalerMois(moisAffiche, 1); afficherBudget(); });

// ---------- 7. Feuille « dépense / revenu » ----------
const fenMvt = document.getElementById("fenetre-mvt");
const formMvt = document.getElementById("form-mvt");
let mvtEdite = null;
let typeMvt = "depense";
let catMvt = "courses";

function dessinerGrilleCat() {
  const cats = typeMvt === "revenu" ? CAT_REVENUS : CAT_DEPENSES;
  if (!cats[catMvt]) catMvt = Object.keys(cats)[0];
  document.getElementById("grille-cat").replaceChildren(
    ...Object.entries(cats).map(([cle, c]) => {
      const b = el("button", "puce-cat" + (cle === catMvt ? " choisie" : ""));
      b.type = "button";
      b.style.setProperty("--c", c.couleur);
      b.append(pastilleCat(c), el("span", "", c.nom));
      b.addEventListener("click", () => { catMvt = cle; dessinerGrilleCat(); });
      return b;
    })
  );
  // Choix de la dette seulement pour un remboursement
  const ligneDette = document.getElementById("ligne-dette");
  ligneDette.hidden = !(typeMvt === "depense" && catMvt === "remboursement" && budget.dettes.length);
  document.getElementById("choix-dette").replaceChildren(
    new Option("—", ""),
    ...budget.dettes.map((d) => new Option(d.nom, d.id))
  );
  if (mvtEdite?.dette) formMvt.dette.value = mvtEdite.dette;
  else if (budget.dettes.length === 1) formMvt.dette.value = budget.dettes[0].id;

  document.querySelectorAll("#type-mvt button").forEach((b) => b.classList.toggle("active", b.dataset.type === typeMvt));
  document.getElementById("titre-mvt").textContent =
    (mvtEdite ? "Modifier " : "Nouvelle ") + (typeMvt === "revenu" ? (mvtEdite ? "le revenu" : "rentrée") : (mvtEdite ? "la dépense" : "dépense"));
}

document.querySelectorAll("#type-mvt button").forEach((b) =>
  b.addEventListener("click", () => { typeMvt = b.dataset.type; dessinerGrilleCat(); })
);

function ouvrirMouvement(m = null, preRempli = {}) {
  mvtEdite = m;
  typeMvt = m?.type || "depense";
  catMvt = m?.cat || preRempli.cat || (typeMvt === "revenu" ? "salaire" : "courses");
  formMvt.montant.value = m ? versTexteMontant(m.montant) : "";
  formMvt.libelle.value = m?.libelle || "";
  // Nouveau mouvement : aujourd'hui si on regarde ce mois-ci, sinon le 1er du mois affiché
  formMvt.date.value = m?.date || (moisAffiche === moisActuel() ? aujourdhui() : moisAffiche + "-01");
  formMvt.mensuel.checked = !!(m ? m.mensuel : preRempli.mensuel);
  document.getElementById("suppr-mvt").style.display = m ? "" : "none";
  dessinerGrilleCat();
  fenMvt.showModal();
  if (!m) formMvt.montant.focus();
}

formMvt.addEventListener("submit", (e) => {
  const montant = lireMontant(formMvt.montant.value);
  if (!montant || !formMvt.date.value) { e.preventDefault(); formMvt.montant.focus(); return; }
  const valeurs = {
    type: typeMvt,
    montant,
    libelle: formMvt.libelle.value.trim(),
    cat: catMvt,
    date: formMvt.date.value,
    mensuel: formMvt.mensuel.checked,
    dette: typeMvt === "depense" && catMvt === "remboursement" ? formMvt.dette.value || "" : "",
  };
  if (mvtEdite) Object.assign(mvtEdite, valeurs);
  else budget.mouvements.push({ id: nouvelId(), ...valeurs });
  moisAffiche = moisDe(valeurs.date);
  enregistrerBudget();
  afficher();
});

document.getElementById("suppr-mvt").addEventListener("click", () => {
  if (!mvtEdite) return;
  const msg = mvtEdite.mensuel
    ? "Supprimer ce mouvement ? Il ne se répétera plus les mois suivants."
    : "Supprimer ce mouvement ?";
  if (!confirm(msg)) return;
  budget.mouvements = budget.mouvements.filter((m) => m.id !== mvtEdite.id);
  // Les copies déjà créées restent, mais ne sont plus rattachées à un modèle
  budget.mouvements.forEach((m) => { if (m.modeleId === mvtEdite.id) m.modeleId = ""; });
  enregistrerBudget();
  fenMvt.close();
  afficher();
});

// ---------- 8. Feuille « dette » ----------
const fenDette = document.getElementById("fenetre-dette");
const formDette = document.getElementById("form-dette");
let detteEditee = null;

function ouvrirDette(d = null) {
  detteEditee = d;
  document.getElementById("titre-dette").textContent = d ? "Modifier la dette" : "Nouvelle dette";
  formDette.nom.value = d?.nom || "";
  formDette.total.value = d ? versTexteMontant(d.total) : "";
  document.getElementById("suppr-dette").style.display = d ? "" : "none";
  fenDette.showModal();
}
document.getElementById("btn-nouvelle-dette").addEventListener("click", () => ouvrirDette());
document.getElementById("btn-nouvelle-facture").addEventListener("click", () => ouvrirMouvement(null, { cat: "factures", mensuel: true }));

formDette.addEventListener("submit", (e) => {
  const total = lireMontant(formDette.total.value);
  const nom = formDette.nom.value.trim();
  if (!total || !nom) { e.preventDefault(); return; }
  if (detteEditee) Object.assign(detteEditee, { nom, total });
  else budget.dettes.push({ id: nouvelId(), nom, total });
  enregistrerBudget();
  afficher();
});

document.getElementById("suppr-dette").addEventListener("click", () => {
  if (!detteEditee || !confirm("Supprimer cette dette ? Les remboursements déjà notés restent dans tes dépenses.")) return;
  budget.dettes = budget.dettes.filter((d) => d.id !== detteEditee.id);
  enregistrerBudget();
  fenDette.close();
  afficher();
});

// Boutons « Annuler » et toucher le fond : fermer la feuille
for (const fen of [fenMvt, fenDette]) {
  fen.querySelector("[data-fermer]").addEventListener("click", () => fen.close());
  fen.addEventListener("click", (e) => { if (e.target === fen) fen.close(); });
}

afficher();
