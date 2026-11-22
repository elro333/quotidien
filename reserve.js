// ============================================================
// reserve.js — dans le Budget, la carte « Réserve »
//
// Chaque tâche de l'Agenda en catégorie « Réserve » (cochée
// « Mission payée ») compte pour une mission ce jour-là.
// La paie arrive vers le 25 du mois SUIVANT :
//   missions d'octobre → payées vers le 25 novembre,
//   missions de novembre → vers le 25 décembre, etc.
// Tu notes ce que tu as vraiment reçu : l'appli montre ce qui manque.
// Tous les montants sont réglables (« Réglages »).
// ============================================================

const reserveVide = () => ({
  tarif: 7000,         // par mission, en centimes
  panier: 2000,        // panier repas par mission
  km: 0,               // indemnités kilométriques moyennes par mission
  jourPaie: 25,
  panierDecale: false, // true = les paniers arrivent un mois après la solde
  recus: {},           // { "2026-11": { montant, mvt } } ← la paie reçue ce mois-là
});
function reserve() {
  budget.reserve = { ...reserveVide(), ...(budget.reserve || {}) };
  return budget.reserve;
}

// Une tâche compte comme mission payée ?
const estMission = (t) => t.cat === "reserve" && t.mission !== false;

// Les jours de mission d'un mois (un jour = une mission)
function missionsDuMois(mois) {
  const [a, m] = mois.split("-").map(Number);
  const jours = [];
  for (let n = 1; n <= new Date(a, m, 0).getDate(); n++) {
    const d = `${mois}-${String(n).padStart(2, "0")}`;
    if (taches.some((t) => estMission(t) && (t.date === d || tombeLe(t, d)))) jours.push(d);
  }
  return jours;
}

// Ce qui doit tomber le jour de paie du mois « mois » (missions du mois d'avant)
function paieAttendue(mois) {
  const r = reserve();
  const missions = missionsDuMois(decalerMois(mois, -1)).length;
  const missionsPaniers = r.panierDecale ? missionsDuMois(decalerMois(mois, -2)).length : missions;
  const solde = missions * (r.tarif + r.km);
  const paniers = missionsPaniers * r.panier;
  return { missions, missionsPaniers, solde, paniers, total: solde + paniers };
}

const moisLong = (mois) => MOIS_LONGS[Number(mois.slice(5, 7)) - 1];

function dessinerReserve() {
  const carte = document.getElementById("carte-reserve");
  carte.replaceChildren();
  const r = reserve();
  const p = paieAttendue(moisAffiche);
  const recu = r.recus[moisAffiche];
  const jourPaie = `${r.jourPaie} ${moisLong(moisAffiche)}`;

  const haut = el("div", "haut-cat");
  haut.append(el("strong", "", "🎖 Réserve"));
  const reglages = el("button", "btn-texte", "Réglages");
  reglages.addEventListener("click", ouvrirReglagesReserve);
  haut.append(reglages);
  carte.append(haut);

  // La paie de ce mois-ci : missions du mois d'avant
  carte.append(el("p", "petit", `Paie vers le ${jourPaie} · missions de ${moisLong(decalerMois(moisAffiche, -1))}`));
  const lignes = el("div", "lignes-reserve");
  const ligne = (g, d, fort) => { const l = el("div", "ligne-reserve" + (fort ? " fort" : "")); l.append(el("span", "", g), el("span", "", d)); lignes.append(l); };
  ligne(`${p.missions} mission${p.missions > 1 ? "s" : ""} × ${euros(r.tarif + r.km)}`, euros(p.solde));
  ligne(`${p.missionsPaniers} panier${p.missionsPaniers > 1 ? "s" : ""} × ${euros(r.panier)}` + (r.panierDecale ? " (décalés)" : ""), euros(p.paniers));
  ligne("Attendu", euros(p.total), true);
  if (recu) {
    ligne("Reçu", euros(recu.montant), true);
    const ecart = p.total - recu.montant;
    carte.append(lignes);
    carte.append(el("p", "ecart-reserve " + (ecart > 0 ? "negatif" : "positif"),
      ecart > 0 ? `Il manque ${euros(ecart)} : à vérifier sur ta fiche de paie` : ecart < 0 ? `${euros(-ecart)} de plus que prévu (un retard rattrapé ?)` : "Tout est là ✓"));
  } else {
    carte.append(lignes);
  }
  const b = el("button", recu ? "btn-secondaire" : "btn-principal btn-vert", recu ? "Modifier ce que j'ai reçu" : "Je l'ai reçue");
  b.addEventListener("click", noterPaieRecue);
  carte.append(b);

  // Et les missions de ce mois, payées le mois prochain
  const ceMois = missionsDuMois(moisAffiche).length;
  if (ceMois) {
    const suivant = decalerMois(moisAffiche, 1);
    carte.append(el("p", "petit prochaine-paie",
      `Ce mois-ci : ${ceMois} mission${ceMois > 1 ? "s" : ""} → ≈ ${euros(ceMois * (r.tarif + r.km + (r.panierDecale ? 0 : r.panier)))} vers le ${r.jourPaie} ${moisLong(suivant)}`));
  }
}

function noterPaieRecue() {
  const r = reserve();
  const p = paieAttendue(moisAffiche);
  const deja = r.recus[moisAffiche];
  const rep = prompt(`Combien as-tu reçu de la réserve en ${moisLong(moisAffiche)} ?\n(attendu : ${euros(p.total)}). Laisse vide pour effacer.`,
    deja ? versTexteMontant(deja.montant) : versTexteMontant(p.total));
  if (rep === null) return;
  const montant = lireMontant(rep);
  // On garde aussi un « revenu » dans les mouvements, pour que le Budget le compte
  const ancien = deja && budget.mouvements.find((m) => m.id === deja.mvt);
  if (!montant) {
    if (ancien) budget.mouvements = budget.mouvements.filter((m) => m.id !== ancien.id);
    delete r.recus[moisAffiche];
  } else if (ancien) {
    ancien.montant = montant;
    r.recus[moisAffiche] = { montant, mvt: ancien.id };
  } else {
    const jour = String(Math.min(r.jourPaie, 28)).padStart(2, "0");
    const m = { id: nouvelId(), type: "revenu", montant, cat: "missions",
      libelle: `Solde réserve (missions de ${moisLong(decalerMois(moisAffiche, -1))})`,
      date: `${moisAffiche}-${jour}`, mensuel: false, dette: "" };
    budget.mouvements.push(m);
    r.recus[moisAffiche] = { montant, mvt: m.id };
  }
  enregistrerBudget();
  afficher();
}

// ---------- Réglages ----------
const fenReserve = document.getElementById("fenetre-reserve");
const formReserve = document.getElementById("form-reserve");
function ouvrirReglagesReserve() {
  const r = reserve();
  formReserve.tarif.value = versTexteMontant(r.tarif);
  formReserve.panier.value = versTexteMontant(r.panier);
  formReserve.km.value = r.km ? versTexteMontant(r.km) : "";
  formReserve.jourPaie.value = r.jourPaie;
  formReserve.panierDecale.checked = r.panierDecale;
  fenReserve.showModal();
}
formReserve.addEventListener("submit", () => {
  const r = reserve();
  r.tarif = lireMontant(formReserve.tarif.value) ?? r.tarif;
  r.panier = lireMontant(formReserve.panier.value) ?? 0;
  r.km = lireMontant(formReserve.km.value) || 0;
  const j = Math.round(Number(formReserve.jourPaie.value));
  r.jourPaie = j >= 1 && j <= 31 ? j : 25;
  r.panierDecale = formReserve.panierDecale.checked;
  enregistrerBudget();
  afficher();
});
fenReserve.querySelector("[data-fermer]").addEventListener("click", () => fenReserve.close());
fenReserve.addEventListener("click", (e) => { if (e.target === fenReserve) fenReserve.close(); });

// ---------- Brancher ----------
// (les flèches de mois appellent afficherBudget directement : on se branche là)
const afficherBudgetSansReserve = afficherBudget;
afficherBudget = function () {
  afficherBudgetSansReserve();
  dessinerReserve();
};
afficher();
