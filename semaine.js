// ============================================================
// semaine.js — « Ma semaine » : le bilan du lundi au dimanche
// Tâches, argent, forme, habitudes, positifs, réserve.
// Il s'ouvre depuis Aujourd'hui (mis en avant le dimanche et le lundi).
// ============================================================

let lundiBilan = lundiDe(aujourdhui());

function joursDeLaSemaine(lundi) {
  return Array.from({ length: 7 }, (_, i) => ajouterJours(lundi, i));
}

function dessinerBilan() {
  const jours = joursDeLaSemaine(lundiBilan);
  const [debut, fin] = [jours[0], jours[6]];
  const dans = (d) => d >= debut && d <= fin;
  const dl = versDate(debut), df = versDate(fin);
  document.getElementById("titre-bilan").textContent =
    `${dl.getDate()} ${MOIS[dl.getMonth()]} – ${df.getDate()} ${MOIS[df.getMonth()]}`;
  const zone = document.getElementById("contenu-bilan");
  zone.replaceChildren();

  const bloc = (emoji, titre, lignes) => {
    const b = el("div", "groupe bloc-bilan");
    const h = el("div", "titre-bilan");
    h.append(el("span", "emoji-positif", emoji), el("strong", "", titre));
    b.append(h);
    for (const l of lignes.filter(Boolean)) b.append(el("p", "ligne-bilan", l));
    zone.append(b);
  };

  // Tâches
  const faites = taches.filter((t) => t.fait && dans(t.date)).length;
  const restees = taches.filter((t) => !t.fait && t.date && dans(t.date) && t.date < aujourdhui()).length;
  bloc("✅", "Tâches", [
    `${faites} tâche${faites > 1 ? "s" : ""} faite${faites > 1 ? "s" : ""}`,
    restees ? `${restees} restée${restees > 1 ? "s" : ""} en retard : on les replanifie ?` : "Rien en retard 👏",
  ]);

  // Argent
  const mvts = budget.mouvements.filter((m) => dans(m.date));
  const dep = mvts.filter((m) => m.type === "depense" && m.cat !== "epargne").reduce((t, m) => t + m.montant, 0);
  const rev = mvts.filter((m) => m.type === "revenu").reduce((t, m) => t + m.montant, 0);
  const epargne = mvts.filter((m) => m.cat === "epargne").reduce((t, m) => t + m.montant, 0);
  const parCat = {};
  for (const m of mvts.filter((m) => m.type === "depense" && m.cat !== "epargne")) parCat[m.cat] = (parCat[m.cat] || 0) + m.montant;
  const top = Object.entries(parCat).sort((a, b) => b[1] - a[1])[0];
  bloc("💶", "Argent", [
    `Dépensé : ${euros(dep)}` + (rev ? ` · reçu : ${euros(rev)}` : ""),
    top && `Le plus gros poste : ${(CAT_DEPENSES[top[0]] || CAT_DEPENSES.autre).nom} (${euros(top[1])})`,
    epargne && `Mis de côté : ${euros(epargne)} 🐷`,
  ]);

  // Forme
  const pas = jours.map(pasDu);
  const totalPas = pas.reduce((a, b) => a + b, 0);
  const atteints = pas.filter((p) => p >= forme.objectifs.pas).length;
  const minutes = jours.reduce((t, d) => t + minutesDu(d), 0);
  const pesees = peseesTriees().filter((p) => dans(p.date));
  bloc("💪", "Forme", [
    `≈ ${nombre(Math.round(totalPas / 7))} pas par jour · objectif atteint ${atteints} jour${atteints > 1 ? "s" : ""} sur 7`,
    `${minutes} min de sport`,
    pesees.length > 1 && `Poids : ${kgTexte(pesees[0].kg)} → ${kgTexte(pesees[pesees.length - 1].kg)}`,
  ]);

  // Moi : habitudes et positifs
  if (typeof moi !== "undefined") {
    const possibles = moi.habitudes.length * 7;
    const cochees = jours.reduce((t, d) => t + (moi.coches[d] || []).filter((id) => moi.habitudes.some((h) => h.id === id)).length, 0);
    const lesPositifs = jours.flatMap((d) => (moi.positifs[d] || []).filter((x) => x.trim()));
    const finis = moi.envies.filter((x) => x.statut === "fini" && x.finiLe && dans(x.finiLe));
    bloc("✨", "Moi", [
      possibles && `Habitudes : ${cochees} / ${possibles} (${Math.round(cochees / possibles * 100)} %)`,
      `${lesPositifs.length} chose${lesPositifs.length > 1 ? "s" : ""} positive${lesPositifs.length > 1 ? "s" : ""} notée${lesPositifs.length > 1 ? "s" : ""}`,
      lesPositifs.length && `« ${lesPositifs[Math.floor(Math.random() * lesPositifs.length)]} »`,
      finis.length && `Terminé : ${finis.map((x) => x.titre).join(", ")}`,
    ]);
  }

  // Réserve
  if (typeof calculMission === "function") {
    let jp = 0, pan = 0;
    for (const d of jours) {
      const t = taches.find((x) => estMission(x) && (x.date === d || tombeLe(x, d)));
      if (t) { const c = calculMission(t); jp += c.jours; if (c.panier) pan++; }
    }
    if (jp) bloc("🎖", "Réserve", [`${jp} jour${jp > 1 ? "s" : ""} de mission · ${pan} panier${pan > 1 ? "s" : ""}`]);
  }
}

const fenBilan = document.getElementById("fenetre-bilan");
function ouvrirBilan() {
  // Le dimanche et le lundi matin, on regarde la semaine qui se termine
  const j = versDate(aujourdhui()).getDay();
  lundiBilan = j === 1 ? lundiDe(ajouterJours(aujourdhui(), -7)) : lundiDe(aujourdhui());
  dessinerBilan();
  fenBilan.showModal();
}
document.getElementById("bilan-prec").addEventListener("click", () => { lundiBilan = ajouterJours(lundiBilan, -7); dessinerBilan(); });
document.getElementById("bilan-suiv").addEventListener("click", () => { lundiBilan = ajouterJours(lundiBilan, 7); dessinerBilan(); });
fenBilan.querySelector("[data-fermer]").addEventListener("click", () => fenBilan.close());
fenBilan.addEventListener("click", (e) => { if (e.target === fenBilan) fenBilan.close(); });

// Le bouton sur Aujourd'hui (mis en avant le dimanche et le lundi)
function afficherBoutonBilan() {
  const b = document.getElementById("btn-bilan");
  const j = versDate(aujourdhui()).getDay();
  const enAvant = j === 0 || j === 1;
  b.classList.toggle("en-avant", enAvant);
  b.replaceChildren(el("span", "emoji-positif", "📊"),
    el("span", "", enAvant ? (j === 0 ? "C'est dimanche : ton bilan de la semaine" : "Le bilan de ta semaine passée") : "Ma semaine"));
}
document.getElementById("btn-bilan").addEventListener("click", ouvrirBilan);

const afficherSansBilan = afficher;
afficher = function () {
  afficherSansBilan();
  if (vueActive === "aujourdhui") afficherBoutonBilan();
};
afficher();
