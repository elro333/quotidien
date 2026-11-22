// ============================================================
// alimentation.js — dans Forme, la partie « Alimentation »
//
//   - Mon frigo et placard : tu coches ce que tu as.
//   - Recettes : celles que tu peux faire avec ce que tu as,
//     dans le temps que tu as. Une recette s'ajuste en direct :
//     « il m'en manque » → un remplacement, ou la liste de courses.
//   - Courses : une liste à cocher au magasin.
//   - Repas : ce que tu as mangé aujourd'hui, face à ton objectif.
// Les recettes elles-mêmes sont dans recettes.js.
// ============================================================

const aLaMaison = (ing) => forme.cuisine.frigo.includes(ing);
const nomIngr = (ing) => INGREDIENTS[ing] || ing;
let tempsDispo = 0; // 0 = peu importe

// Ce qui manque pour une recette, et ce qu'on peut remplacer
function etatRecette(r) {
  const remplacements = [];
  const manque = [];
  for (const i of r.ingredients) {
    if (aLaMaison(i)) continue;
    const par = (REMPLACEMENTS[i] || []).find(aLaMaison);
    if (par) remplacements.push({ i, par });
    else manque.push(i);
  }
  return { remplacements, manque };
}
const rentreDansLeTemps = (r) => !tempsDispo || r.minutes <= tempsDispo || (r.rapide && r.rapide.minutes <= tempsDispo);

function kcalDuJour(jour) {
  return (forme.cuisine.repas[jour] || []).reduce((t, x) => t + x.kcal, 0);
}

// ---------- 1. Dessiner la partie Alimentation ----------
function afficherAlimentation() {
  dessinerRepas();
  document.querySelectorAll("#temps-dispo button").forEach((b) => b.classList.toggle("active", Number(b.dataset.min) === tempsDispo));
  dessinerRecettes();
  dessinerFrigo();
  dessinerCourses();
}

function dessinerRepas() {
  const carte = document.getElementById("carte-repas");
  carte.replaceChildren();
  const auj = aujourdhui();
  const mange = kcalDuJour(auj);
  const objectif = typeof besoinCalories === "function" ? besoinCalories()?.manger : null;

  carte.append(el("div", "etiquette etiquette-alim", "Mangé aujourd'hui"));
  const gros = el("div", "tache-titre", `${nombre(mange)} kcal`);
  carte.append(gros);
  if (objectif) {
    const barre = el("div", "barre");
    const rempli = el("span");
    const part = Math.min(mange / objectif, 1);
    rempli.style.width = (part * 100).toFixed(1) + "%";
    rempli.style.background = mange > objectif ? "var(--orange)" : "var(--vert)";
    barre.append(rempli);
    carte.append(barre);
    const reste = objectif - mange;
    carte.append(el("p", "petit", reste >= 0
      ? `Encore ≈ ${nombre(reste)} kcal pour ton objectif du jour (${nombre(objectif)})`
      : `${nombre(-reste)} kcal au-dessus de ton objectif (${nombre(objectif)}) : pas grave, demain est un autre jour`));
  } else {
    carte.append(el("p", "petit", "Remplis « Moi et mes objectifs » (Activité) pour voir ton objectif du jour."));
  }

  const liste = forme.cuisine.repas[auj] || [];
  if (liste.length) {
    const ul = el("div", "puces-repas");
    for (const x of liste) {
      const b = el("button", "puce-repas", `${x.nom} · ${x.kcal} ×`);
      b.setAttribute("aria-label", `Retirer ${x.nom}`);
      b.addEventListener("click", () => {
        forme.cuisine.repas[auj] = liste.filter((y) => y.id !== x.id);
        enregistrerForme();
        afficher();
      });
      ul.append(b);
    }
    carte.append(ul);
  }
  const boutons = el("div", "boutons");
  const b = el("button", "btn-principal btn-vert", "Noter un repas");
  b.addEventListener("click", () => ouvrirRepas());
  boutons.append(b);
  carte.append(boutons);
}

function ligneRecette(r) {
  const { remplacements, manque } = etatRecette(r);
  const li = el("li", "ligne-mvt");
  const p = el("span", "ico-cat", r.emoji);
  p.style.background = manque.length ? "rgba(120,120,128,.18)" : "rgba(52,199,89,.18)";
  const infos = el("div", "infos");
  infos.append(el("div", "t", r.nom));
  const meta = [];
  const rapideUtile = tempsDispo && r.minutes > tempsDispo && r.rapide;
  meta.push(rapideUtile ? `${r.rapide.minutes} min (version rapide)` : `${r.minutes} min`);
  meta.push(`≈ ${r.kcal} kcal`);
  if (manque.length) meta.push("il manque : " + manque.map(nomIngr).join(", ").toLowerCase());
  else if (remplacements.length) meta.push("avec un remplacement");
  infos.append(el("div", "m", meta.join(" · ")));
  li.append(p, infos);
  li.addEventListener("click", () => ouvrirRecette(r, !!rapideUtile));
  return li;
}

function dessinerRecettes() {
  const ok = el("ul", "liste verre");
  const presque = el("ul", "liste verre");
  const dansLeTemps = RECETTES.filter(rentreDansLeTemps);
  const triees = dansLeTemps
    .map((r) => ({ r, e: etatRecette(r) }))
    .sort((a, b) => a.e.manque.length - b.e.manque.length || a.r.minutes - b.r.minutes);
  for (const { r, e } of triees) (e.manque.length ? presque : ok).append(ligneRecette(r));

  const zoneOk = document.getElementById("recettes-ok");
  const zonePresque = document.getElementById("recettes-presque");
  zoneOk.replaceChildren();
  zonePresque.replaceChildren();
  if (ok.children.length) zoneOk.append(ok);
  else zoneOk.append(el("p", "aide aide-groupe", forme.cuisine.frigo.length
    ? "Rien de complet avec ce que tu as. Regarde juste en dessous : il manque souvent un seul ingrédient."
    : "Coche d'abord ce que tu as dans « Mon frigo et placard », plus bas."));
  document.getElementById("titre-presque").textContent = `Avec quelques courses · ${presque.children.length}`;
  zonePresque.append(presque);
}

function dessinerFrigo() {
  const zone = document.getElementById("zone-frigo");
  zone.replaceChildren();
  document.getElementById("resume-frigo").textContent = `Mon frigo et placard · ${forme.cuisine.frigo.length}`;
  for (const rayon of Object.values(RAYONS)) {
    zone.append(el("h3", "jour-mvt", rayon.nom));
    const puces = el("div", "puces-frigo");
    for (const [code, nom] of Object.entries(rayon.ingredients)) {
      const b = el("button", "puce-frigo" + (aLaMaison(code) ? " on" : ""), nom);
      b.type = "button";
      b.addEventListener("click", () => {
        basculerFrigo(code);
        afficher();
      });
      puces.append(b);
    }
    zone.append(puces);
  }
  zone.append(el("p", "aide", "Sel, poivre, huile et eau : on fait comme si tu en avais toujours."));
}

function basculerFrigo(code, present) {
  const f = forme.cuisine.frigo;
  const a = present ?? !f.includes(code);
  forme.cuisine.frigo = a ? [...new Set([...f, code])] : f.filter((x) => x !== code);
  enregistrerForme();
}

function dessinerCourses() {
  const ul = document.getElementById("liste-courses");
  const courses = forme.cuisine.courses;
  ul.replaceChildren(...courses.map((c) => {
    const li = el("li");
    const caseBtn = el("button", "case" + (c.fait ? " cochee" : ""));
    caseBtn.style.setProperty("--couleur", "var(--vert)");
    caseBtn.setAttribute("aria-label", c.fait ? "Pas encore acheté" : "Acheté");
    caseBtn.addEventListener("click", () => {
      c.fait = !c.fait;
      // Acheté → c'est maintenant dans ton frigo
      if (c.ingredient) basculerFrigo(c.ingredient, c.fait);
      enregistrerForme();
      afficher();
    });
    const infos = el("div", "infos");
    infos.append(el("div", "t", c.nom));
    if (c.fait) li.classList.add("fait");
    li.append(caseBtn, infos);
    return li;
  }));
  if (!courses.length) {
    const li = el("li", "vide-msg", "Liste vide.");
    ul.append(li);
  }
  document.getElementById("retirer-achetes").hidden = !courses.some((c) => c.fait);
}

function ajouterCourse(nom, ingredient = "") {
  nom = nom.trim();
  if (!nom) return;
  // Si on tape le nom d'un ingrédient connu, on le relie (pour le frigo)
  if (!ingredient) {
    const trouve = Object.entries(INGREDIENTS).find(([, n]) => sansAccentsMin(n) === sansAccentsMin(nom));
    if (trouve) ingredient = trouve[0];
  }
  if (forme.cuisine.courses.some((c) => !c.fait && sansAccentsMin(c.nom) === sansAccentsMin(nom))) return;
  forme.cuisine.courses.push({ id: nouvelId(), nom: nom[0].toUpperCase() + nom.slice(1), ingredient, fait: false });
}
const sansAccentsMin = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

document.getElementById("form-course").addEventListener("submit", (e) => {
  e.preventDefault();
  const champ = document.getElementById("champ-course");
  ajouterCourse(champ.value);
  champ.value = "";
  enregistrerForme();
  afficher();
});
document.getElementById("retirer-achetes").addEventListener("click", () => {
  forme.cuisine.courses = forme.cuisine.courses.filter((c) => !c.fait);
  enregistrerForme();
  afficher();
});
document.querySelectorAll("#temps-dispo button").forEach((b) =>
  b.addEventListener("click", () => { tempsDispo = Number(b.dataset.min); afficher(); })
);

// ---------- 2. Une recette, qui s'ajuste en direct ----------
const fenRecette = document.getElementById("fenetre-recette");
let recetteOuverte = null;
let versionRapide = false;

function ouvrirRecette(r, rapide = false) {
  recetteOuverte = r;
  versionRapide = rapide && !!r.rapide;
  dessinerRecette();
  fenRecette.showModal();
}

function dessinerRecette() {
  const r = recetteOuverte;
  const zone = document.getElementById("contenu-recette");
  zone.replaceChildren();
  const { remplacements, manque } = etatRecette(r);

  const tete = el("div", "tete-recette");
  tete.append(el("span", "emoji-recette", r.emoji));
  const t = el("div");
  t.append(el("h2", "titre-recette", r.nom));
  t.append(el("p", "petit", `${versionRapide ? r.rapide.minutes : r.minutes} min · ≈ ${r.kcal} kcal la portion`));
  tete.append(t);
  zone.append(tete);

  // Normale / rapide
  if (r.rapide) {
    const seg = el("div", "segment segment-plein");
    for (const [rap, txt] of [[false, `Normale · ${r.minutes} min`], [true, `Rapide · ${r.rapide.minutes} min`]]) {
      const b = el("button", rap === versionRapide ? "active" : "", txt);
      b.type = "button";
      b.addEventListener("click", () => { versionRapide = rap; dessinerRecette(); });
      seg.append(b);
    }
    zone.append(seg);
    if (versionRapide) zone.append(el("p", "astuce-rapide", "⚡ " + r.rapide.astuce));
  }

  // Les ingrédients : touche-en un pour dire « il m'en manque » (ou « je l'ai »)
  zone.append(el("h3", "titre-groupe", "Ingrédients · touche pour dire si tu l'as"));
  const groupe = el("div", "groupe");
  const ligneIngr = (i, bonus) => {
    const l = el("button", "ligne ligne-ingr");
    l.type = "button";
    const a = aLaMaison(i);
    const rempl = remplacements.find((x) => x.i === i);
    const statut = a ? el("span", "statut ok", "✓")
      : rempl ? el("span", "statut remplace", "→ " + nomIngr(rempl.par))
      : el("span", "statut " + (bonus ? "bonus" : "manque"), bonus ? "facultatif" : "manque");
    l.append(el("span", "libelle" + (bonus ? " ingr-bonus" : ""), nomIngr(i)), statut);
    l.addEventListener("click", () => { basculerFrigo(i); dessinerRecette(); afficher(); });
    groupe.append(l);
  };
  r.ingredients.forEach((i) => ligneIngr(i, false));
  r.bonus.forEach((i) => ligneIngr(i, true));
  zone.append(groupe);

  // Les étapes, avec les remplacements rappelés
  zone.append(el("h3", "titre-groupe", "Étapes"));
  const ol = el("ol", "etapes");
  for (const rp of remplacements) ol.append(el("li", "etape-rempl", `Remplace ${nomIngr(rp.i).toLowerCase()} par ${nomIngr(rp.par).toLowerCase()}.`));
  for (const e of r.etapes) ol.append(el("li", "", e));
  zone.append(ol);

  // Actions
  const boutons = el("div", "boutons boutons-recette");
  if (manque.length) {
    const b = el("button", "btn-secondaire", `Ajouter aux courses (${manque.length})`);
    b.type = "button";
    b.addEventListener("click", () => {
      manque.forEach((i) => ajouterCourse(nomIngr(i), i));
      enregistrerForme();
      afficher();
      b.textContent = "Ajouté aux courses ✓";
      b.disabled = true;
    });
    boutons.append(b);
  }
  const manger = el("button", "btn-principal btn-vert", `Je le mange · ≈ ${r.kcal} kcal`);
  manger.type = "button";
  manger.addEventListener("click", () => {
    noterRepas(r.nom, r.kcal);
    fenRecette.close();
    if (typeof montrerToast === "function") montrerToast("Bon appétit ✓");
  });
  boutons.append(manger);
  zone.append(boutons);
}

// ---------- 3. Noter un repas ----------
const fenRepas = document.getElementById("fenetre-repas");
const formRepas = document.getElementById("form-repas");

function noterRepas(nom, kcal) {
  const auj = aujourdhui();
  (forme.cuisine.repas[auj] ||= []).push({ id: nouvelId(), nom, kcal: Math.round(kcal) });
  enregistrerForme();
  afficher();
}
function ouvrirRepas() {
  formRepas.reset();
  fenRepas.showModal();
  formRepas.kcal.focus();
}
formRepas.addEventListener("submit", (e) => {
  const kcal = lireNombre(formRepas.kcal.value);
  if (!kcal) { e.preventDefault(); formRepas.kcal.focus(); return; }
  noterRepas(formRepas.nom.value.trim() || "Repas", kcal);
});

for (const fen of [fenRecette, fenRepas]) {
  fen.querySelector("[data-fermer]").addEventListener("click", () => fen.close());
  fen.addEventListener("click", (e) => { if (e.target === fen) fen.close(); });
}

// ---------- 4. Brancher dans l'appli ----------
const afficherSansAlim = afficher;
afficher = function () {
  afficherSansAlim();
  if (vueActive === "forme" && sousForme === "alim") afficherAlimentation();
};
afficher();
