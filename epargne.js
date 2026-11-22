// ============================================================
// epargne.js — dans le Budget :
//   - Objectifs d'épargne : « 300 € d'ici mars », une barre qui avance.
//     « Mettre de côté » crée une dépense de catégorie Épargne 🐷
//     (l'argent sort de ton compte courant, il ne se dépense plus).
//   - Plafonds : une limite par catégorie (ex. Cadeaux 50 € / mois),
//     en rouge quand c'est dépassé.
// ============================================================

function epargneDe(obj) {
  return budget.mouvements.filter((m) => m.cat === "epargne" && m.objectif === obj.id).reduce((t, m) => t + m.montant, 0);
}

function dessinerObjectifs() {
  budget.objectifs ||= [];
  const zone = document.getElementById("objectifs-epargne");
  zone.replaceChildren();
  if (!budget.objectifs.length) {
    zone.append(el("p", "aide", "Un voyage, un coussin de sécurité, un cadeau… Fixe un montant : chaque euro mis de côté fait avancer la barre."));
    return;
  }
  for (const obj of budget.objectifs) {
    const deja = epargneDe(obj);
    const carte = el("div", "verre carte-dette carte-objectif");
    const haut = el("div", "haut-cat");
    haut.append(el("strong", "", `${obj.emoji || "🐷"} ${obj.nom}`), el("span", deja >= obj.cible ? "positif" : "", `${euros(deja)} / ${euros(obj.cible)}`));
    const barre = el("div", "barre fine");
    const rempli = el("span");
    rempli.style.width = Math.min(deja / obj.cible * 100, 100).toFixed(1) + "%";
    rempli.style.background = "#30b0c7";
    barre.append(rempli);
    carte.append(haut, barre);
    const reste = obj.cible - deja;
    let info = reste > 0 ? `Encore ${euros(reste)}` : "Objectif atteint 🎉";
    if (reste > 0 && obj.echeance) {
      const [a, m] = obj.echeance.split("-").map(Number);
      const auj = new Date();
      const nbMois = Math.max(1, (a - auj.getFullYear()) * 12 + (m - 1 - auj.getMonth()) + 1);
      info += ` · ≈ ${euros(Math.ceil(reste / nbMois))} par mois jusqu'en ${MOIS_LONGS[m - 1]} ${a}`;
    }
    carte.append(el("div", "petit", info));
    const boutons = el("div", "boutons-objectif");
    const mettre = el("button", "btn-principal btn-bleu-canard", "Mettre de côté");
    mettre.addEventListener("click", () => mettreDeCote(obj));
    const modif = el("button", "btn-texte", "Modifier");
    modif.addEventListener("click", () => ouvrirObjectif(obj));
    boutons.append(mettre, modif);
    carte.append(boutons);
    zone.append(carte);
  }
}

function mettreDeCote(obj) {
  const rep = prompt(`Combien mets-tu de côté pour « ${obj.nom} » ?`);
  if (rep === null) return;
  const montant = lireMontant(rep);
  if (!montant) { alert("Ce montant n'est pas un nombre."); return; }
  budget.mouvements.push({ id: nouvelId(), type: "depense", montant, libelle: `Épargne : ${obj.nom}`,
    cat: "epargne", objectif: obj.id, date: aujourdhui(), mensuel: false, dette: "" });
  enregistrerBudget();
  afficher();
  if (typeof montrerToast === "function") montrerToast(`${euros(montant)} de côté 🐷`);
}

// Feuille « objectif »
const fenObjectif = document.getElementById("fenetre-objectif");
const formObjectif = document.getElementById("form-objectif");
let objectifEdite = null;
function ouvrirObjectif(obj = null) {
  objectifEdite = obj;
  document.getElementById("titre-objectif").textContent = obj ? "Modifier l'objectif" : "Nouvel objectif";
  formObjectif.emoji.value = obj?.emoji || "";
  formObjectif.nom.value = obj?.nom || "";
  formObjectif.cible.value = obj ? versTexteMontant(obj.cible) : "";
  formObjectif.echeance.value = obj?.echeance || "";
  document.getElementById("suppr-objectif").style.display = obj ? "" : "none";
  fenObjectif.showModal();
}
document.getElementById("btn-nouvel-objectif").addEventListener("click", () => ouvrirObjectif());
formObjectif.addEventListener("submit", (e) => {
  const cible = lireMontant(formObjectif.cible.value);
  const nom = formObjectif.nom.value.trim();
  if (!cible || !nom) { e.preventDefault(); return; }
  const valeurs = { nom, cible, emoji: formObjectif.emoji.value.trim() || "🐷", echeance: formObjectif.echeance.value };
  budget.objectifs ||= [];
  if (objectifEdite) Object.assign(objectifEdite, valeurs);
  else budget.objectifs.push({ id: nouvelId(), ...valeurs });
  enregistrerBudget();
  afficher();
});
document.getElementById("suppr-objectif").addEventListener("click", () => {
  if (!objectifEdite || !confirm(`Supprimer l'objectif « ${objectifEdite.nom} » ? L'argent déjà mis de côté reste noté dans tes mouvements.`)) return;
  budget.objectifs = budget.objectifs.filter((o) => o.id !== objectifEdite.id);
  enregistrerBudget();
  fenObjectif.close();
  afficher();
});
fenObjectif.querySelector("[data-fermer]").addEventListener("click", () => fenObjectif.close());
fenObjectif.addEventListener("click", (e) => { if (e.target === fenObjectif) fenObjectif.close(); });

// ---------- Plafonds par catégorie ----------
// On remplace le dessin de « Dépenses par catégorie » : même chose,
// + le plafond de chaque catégorie, + l'épargne mise à part.
dessinerRepartition = function ({ liste }) {
  budget.plafonds ||= {};
  const zone = document.getElementById("repartition");
  zone.replaceChildren();
  const parCat = {};
  for (const m of liste.filter((m) => m.type === "depense" && m.cat !== "epargne")) parCat[m.cat] = (parCat[m.cat] || 0) + m.montant;
  for (const cat of Object.keys(budget.plafonds)) parCat[cat] ||= 0;
  const lignes = Object.entries(parCat).sort((a, b) => b[1] - a[1]);
  const depenses = lignes.reduce((t, [, s]) => t + s, 0);
  if (!lignes.length) {
    zone.append(el("p", "vide-msg", "Aucune dépense ce mois-ci."));
  }
  const max = Math.max(1, ...lignes.map(([c, s]) => Math.max(s, budget.plafonds[c] || 0)));
  for (const [cle, somme] of lignes) {
    const c = CAT_DEPENSES[cle] || CAT_DEPENSES.autre;
    const plafond = budget.plafonds[cle];
    const depasse = plafond && somme > plafond;
    const ligne = el("button", "ligne-cat ligne-cat-bouton");
    const texte = el("div", "infos-cat");
    const haut = el("div", "haut-cat");
    haut.append(el("span", "", c.nom), el("strong", depasse ? "negatif" : "", plafond ? `${euros(somme)} / ${euros(plafond)}` : euros(somme)));
    const barre = el("div", "barre fine");
    const rempli = el("span");
    rempli.style.width = (somme / (plafond || max) * 100 > 100 ? 100 : somme / (plafond || max) * 100).toFixed(1) + "%";
    rempli.style.background = depasse ? "var(--rouge)" : plafond && somme > plafond * .8 ? "var(--orange)" : c.couleur;
    barre.append(rempli);
    const sous = depasse ? `Plafond dépassé de ${euros(somme - plafond)}`
      : plafond ? `Il reste ${euros(plafond - somme)} avant ton plafond`
      : depenses ? `${Math.round(somme / depenses * 100)} % des dépenses · touche pour fixer un plafond` : "";
    texte.append(haut, barre, el("div", "petit" + (depasse ? " negatif" : ""), sous));
    ligne.append(pastilleCat(c), texte);
    ligne.addEventListener("click", () => {
      const rep = prompt(`Plafond par mois pour « ${c.nom} » ?\n(laisse vide pour l'enlever)`, plafond ? versTexteMontant(plafond) : "");
      if (rep === null) return;
      const v = lireMontant(rep);
      if (v) budget.plafonds[cle] = v; else delete budget.plafonds[cle];
      enregistrerBudget();
      afficher();
    });
    zone.append(ligne);
  }
  // Un raccourci pour mettre un plafond sur une catégorie sans dépense encore
  const ajout = el("button", "btn-texte ajout-plafond", "+ Fixer un plafond");
  ajout.addEventListener("click", () => {
    const noms = Object.entries(CAT_DEPENSES).filter(([k]) => k !== "epargne" && k !== "remboursement");
    const choix = prompt("Quelle catégorie ?\n" + noms.map(([, c], i) => `${i + 1}. ${c.nom}`).join("\n"));
    const n = Number(choix);
    if (!n || !noms[n - 1]) return;
    const [cle, c] = noms[n - 1];
    const v = lireMontant(prompt(`Plafond par mois pour « ${c.nom} » ?`) || "");
    if (!v) return;
    budget.plafonds[cle] = v;
    enregistrerBudget();
    afficher();
  });
  zone.append(ajout);
};

// Brancher sur le dessin du Budget
const afficherBudgetSansEpargne = afficherBudget;
afficherBudget = function () {
  afficherBudgetSansEpargne();
  dessinerObjectifs();
};
afficher();
