// ============================================================
// alimentation.js — dans Forme, la partie « Alimentation »
//
//   - Repas : ce que tu as mangé aujourd'hui, face à ton objectif.
//   - Recettes : selon le moment (petit-déj, déjeuner, goûter, dîner),
//     ce que tu as et le temps que tu as. ♥ pour tes préférées,
//     et « + Ma recette » pour ajouter les tiennes.
//   - Une recette s'ajuste en direct : « il m'en manque » →
//     un remplacement, ou la liste de courses.
//   - Frigo et placard : tu coches ce que tu as.
//   - Courses : liste à cocher, articles habituels, liens vers
//     Carrefour / Intermarché, prix notés à la main, total → Budget.
// Les recettes de base sont dans recettes.js.
// ============================================================

const aLaMaison = (ing) => forme.cuisine.frigo.includes(ing);
const nomIngr = (ing) => INGREDIENTS[ing] || ing;
const sansAccentsMin = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// ---------- 1. Les moments du repas ----------
const MOMENTS = {
  petitdej: { nom: "Petit-déj", emoji: "☕" },
  dejeuner: { nom: "Déjeuner", emoji: "🍽" },
  gouter:   { nom: "Goûter", emoji: "🍪" },
  diner:    { nom: "Dîner", emoji: "🌙" },
};
// Les recettes de base qui ne sont pas « déjeuner ou dîner »
const MOMENTS_RECETTES = {
  porridge: ["petitdej", "gouter"], pancakes: ["petitdej", "gouter"], smoothie: ["petitdej", "gouter"],
  tartine_avocat: ["petitdej", "dejeuner"], omelette: ["petitdej", "dejeuner", "diner"],
  oeufs_epinards: ["petitdej", "dejeuner", "diner"], mug_cake: ["gouter"],
};
const momentsDe = (r) => r.moments?.length ? r.moments : MOMENTS_RECETTES[r.id] || ["dejeuner", "diner"];

function momentSelonHeure() {
  const d = new Date();
  const h = d.getHours() + d.getMinutes() / 60;
  return h < 10.5 ? "petitdej" : h < 15 ? "dejeuner" : h < 18 ? "gouter" : "diner";
}
let momentChoisi = momentSelonHeure();
let tempsDispo = 0; // 0 = peu importe

// Toutes les recettes : les tiennes d'abord, puis celles de base
const toutesRecettes = () => [...forme.cuisine.mesRecettes, ...RECETTES];
const estFavori = (r) => forme.cuisine.favoris.includes(r.id);

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
const rentreDansLeTemps = (r) => !tempsDispo || !r.minutes || r.minutes <= tempsDispo || (r.rapide && r.rapide.minutes <= tempsDispo);

const kcalDuJour = (jour) => (forme.cuisine.repas[jour] || []).reduce((t, x) => t + x.kcal, 0);

// ---------- 2. Dessiner ----------
function afficherAlimentation() {
  dessinerRepas();
  document.querySelectorAll("#moment-repas button").forEach((b) => b.classList.toggle("active", b.dataset.moment === momentChoisi));
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
  carte.append(el("div", "tache-titre", `${nombre(mange)} kcal`));
  if (objectif) {
    const barre = el("div", "barre");
    const rempli = el("span");
    rempli.style.width = (Math.min(mange / objectif, 1) * 100).toFixed(1) + "%";
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

  // Les repas du jour, rangés par moment
  const liste = forme.cuisine.repas[auj] || [];
  if (liste.length) {
    const zone = el("div", "puces-repas");
    for (const cle of Object.keys(MOMENTS)) {
      for (const x of liste.filter((y) => (y.moment || "dejeuner") === cle)) {
        const b = el("button", "puce-repas", `${MOMENTS[cle].emoji} ${x.nom} · ${x.kcal} ×`);
        b.setAttribute("aria-label", `Retirer ${x.nom}`);
        b.addEventListener("click", () => {
          forme.cuisine.repas[auj] = liste.filter((y) => y.id !== x.id);
          enregistrerForme();
          afficher();
        });
        zone.append(b);
      }
    }
    carte.append(zone);
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
  const p = el("span", "ico-cat", r.emoji || "🍽");
  p.style.background = manque.length ? "rgba(120,120,128,.18)" : "rgba(52,199,89,.18)";
  const infos = el("div", "infos");
  infos.append(el("div", "t", (estFavori(r) ? "♥ " : "") + r.nom));
  const meta = [];
  const rapideUtile = tempsDispo && r.minutes > tempsDispo && r.rapide;
  if (r.minutes) meta.push(rapideUtile ? `${r.rapide.minutes} min (version rapide)` : `${r.minutes} min`);
  if (r.kcal) meta.push(`≈ ${r.kcal} kcal`);
  if (manque.length) meta.push("il manque : " + manque.map(nomIngr).join(", ").toLowerCase());
  else if (remplacements.length) meta.push("avec un remplacement");
  infos.append(el("div", "m", meta.join(" · ")));
  li.append(p, infos);
  li.addEventListener("click", () => ouvrirRecette(r, !!rapideUtile));
  return li;
}

function dessinerRecettes() {
  const duMoment = toutesRecettes().filter((r) => momentsDe(r).includes(momentChoisi));

  // ♥ Nos préférées : toujours visibles pour ce moment (même s'il manque des choses)
  const favoris = duMoment.filter(estFavori);
  const zoneFav = document.getElementById("recettes-favoris");
  zoneFav.replaceChildren();
  if (favoris.length) {
    const ul = el("ul", "liste verre");
    favoris.forEach((r) => ul.append(ligneRecette(r)));
    zoneFav.append(ul);
  } else {
    zoneFav.append(el("p", "aide aide-groupe", "Touche ♡ dans une recette pour la garder ici, ou ajoute les vôtres avec « + Ma recette »."));
  }

  // Les autres : selon le frigo et le temps
  const ok = el("ul", "liste verre");
  const presque = el("ul", "liste verre");
  duMoment
    .filter((r) => !estFavori(r) && rentreDansLeTemps(r))
    .map((r) => ({ r, e: etatRecette(r) }))
    .sort((a, b) => a.e.manque.length - b.e.manque.length || (a.r.minutes || 0) - (b.r.minutes || 0))
    .forEach(({ r, e }) => (e.manque.length ? presque : ok).append(ligneRecette(r)));

  const zoneOk = document.getElementById("recettes-ok");
  zoneOk.replaceChildren();
  if (ok.children.length) zoneOk.append(ok);
  else zoneOk.append(el("p", "aide aide-groupe", forme.cuisine.frigo.length
    ? "Rien de complet avec ce que tu as. Regarde juste en dessous : il manque souvent un seul ingrédient."
    : "Coche d'abord ce que tu as dans « Mon frigo et placard », plus bas."));
  document.getElementById("titre-presque").textContent = `Avec quelques courses · ${presque.children.length}`;
  document.getElementById("recettes-presque").replaceChildren(presque);
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
      b.addEventListener("click", () => { basculerFrigo(code); afficher(); });
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

// ---------- 3. Les courses ----------
const MAGASINS = {
  carrefour:   { nom: "Carrefour",   recherche: (q) => `https://www.carrefour.fr/s?q=${encodeURIComponent(q)}` },
  intermarche: { nom: "Intermarché", recherche: (q) => `https://www.intermarche.com/recherche/${encodeURIComponent(q)}` },
};
const prixDe = (nom) => forme.cuisine.prix[sansAccentsMin(nom)] || {};

function dessinerCourses() {
  const magasin = forme.cuisine.magasin;
  document.querySelectorAll("#choix-magasin button").forEach((b) => b.classList.toggle("active", b.dataset.magasin === magasin));

  // Les habituels : un geste pour les remettre dans la liste
  const zoneHab = document.getElementById("habituels");
  zoneHab.replaceChildren();
  for (const h of forme.cuisine.habituels) {
    const dejaLa = forme.cuisine.courses.some((c) => !c.fait && sansAccentsMin(c.nom) === sansAccentsMin(h.nom));
    const b = el("button", "puce-frigo" + (dejaLa ? " on" : ""), (dejaLa ? "✓ " : "+ ") + h.nom);
    b.type = "button";
    b.addEventListener("click", () => {
      if (!dejaLa) { ajouterCourse(h.nom, h.ingredient); enregistrerForme(); afficher(); }
    });
    zoneHab.append(b);
  }
  document.getElementById("bloc-habituels").hidden = !forme.cuisine.habituels.length;

  const ul = document.getElementById("liste-courses");
  const courses = forme.cuisine.courses;
  ul.replaceChildren(...courses.map((c) => {
    const li = el("li");
    const caseBtn = el("button", "case" + (c.fait ? " cochee" : ""));
    caseBtn.style.setProperty("--couleur", "var(--vert)");
    caseBtn.setAttribute("aria-label", c.fait ? "Pas encore acheté" : "Acheté");
    caseBtn.addEventListener("click", () => {
      c.fait = !c.fait;
      if (c.ingredient) basculerFrigo(c.ingredient, c.fait); // acheté → dans le frigo
      enregistrerForme();
      afficher();
    });
    const infos = el("div", "infos");
    infos.append(el("div", "t", c.nom));
    const p = prixDe(c.nom)[magasin];
    if (p) infos.append(el("div", "m", `≈ ${euros(p)} chez ${MAGASINS[magasin].nom}`));
    infos.addEventListener("click", () => ouvrirArticle(c));
    if (c.fait) li.classList.add("fait");
    li.append(caseBtn, infos);
    if (forme.cuisine.habituels.some((h) => sansAccentsMin(h.nom) === sansAccentsMin(c.nom))) li.append(el("span", "etoile", "★"));
    return li;
  }));
  if (!courses.length) ul.append(el("li", "vide-msg", "Liste vide."));

  // Le total estimé, avec les prix que tu as notés
  const aAcheter = courses.filter((c) => !c.fait);
  const totalMag = (m, liste) => liste.reduce((t, c) => t + (prixDe(c.nom)[m] || 0), 0);
  const connus = (m, liste) => liste.filter((c) => prixDe(c.nom)[m]).length;
  const zoneTotal = document.getElementById("total-courses");
  zoneTotal.replaceChildren();
  if (aAcheter.length && Object.keys(MAGASINS).some((m) => connus(m, aAcheter))) {
    for (const m of Object.keys(MAGASINS)) {
      const n = connus(m, aAcheter);
      if (!n) continue;
      zoneTotal.append(el("div", m === magasin ? "fort" : "",
        `${MAGASINS[m].nom} : ≈ ${euros(totalMag(m, aAcheter))}` + (n < aAcheter.length ? ` (${n} prix sur ${aAcheter.length})` : "")));
    }
  }
  zoneTotal.hidden = !zoneTotal.children.length;

  const achetes = courses.filter((c) => c.fait);
  document.getElementById("retirer-achetes").hidden = !achetes.length;
  document.getElementById("courses-budget").hidden = !achetes.length;
}

function ajouterCourse(nom, ingredient = "") {
  nom = nom.trim();
  if (!nom) return;
  // Le nom d'un ingrédient connu ? On le relie (pour le frigo)
  if (!ingredient) {
    const trouve = Object.entries(INGREDIENTS).find(([, n]) => sansAccentsMin(n) === sansAccentsMin(nom));
    if (trouve) ingredient = trouve[0];
  }
  if (forme.cuisine.courses.some((c) => !c.fait && sansAccentsMin(c.nom) === sansAccentsMin(nom))) return;
  forme.cuisine.courses.push({ id: nouvelId(), nom: nom[0].toUpperCase() + nom.slice(1), ingredient, fait: false });
}

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
document.querySelectorAll("#choix-magasin button").forEach((b) =>
  b.addEventListener("click", () => { forme.cuisine.magasin = b.dataset.magasin; enregistrerForme(); afficher(); })
);

// Courses finies : une dépense « Courses » dans le Budget, puis on vide les achetés
document.getElementById("courses-budget").addEventListener("click", () => {
  const m = forme.cuisine.magasin;
  const achetes = forme.cuisine.courses.filter((c) => c.fait);
  const estime = achetes.reduce((t, c) => t + (prixDe(c.nom)[m] || 0), 0);
  const reponse = prompt(`Combien as-tu payé chez ${MAGASINS[m].nom} ?`, estime ? versTexteMontant(estime) : "");
  if (reponse === null) return;
  const montant = lireMontant(reponse);
  if (!montant) { alert("Ce montant n'est pas un nombre."); return; }
  budget.mouvements.push({
    id: nouvelId(), type: "depense", montant, libelle: `Courses ${MAGASINS[m].nom}`,
    cat: "courses", date: aujourdhui(), mensuel: false, dette: "",
  });
  enregistrerBudget();
  forme.cuisine.courses = forme.cuisine.courses.filter((c) => !c.fait);
  enregistrerForme();
  afficher();
  if (typeof montrerToast === "function") montrerToast(`${euros(montant)} ajoutés au Budget ✓`);
});

// ---------- 4. Un article : prix, magasins, habituel ----------
const fenArticle = document.getElementById("fenetre-article");
const formArticle = document.getElementById("form-article");
let articleOuvert = null;

function ouvrirArticle(c) {
  articleOuvert = c;
  document.getElementById("titre-article").textContent = c.nom;
  const p = prixDe(c.nom);
  formArticle.carrefour.value = p.carrefour ? versTexteMontant(p.carrefour) : "";
  formArticle.intermarche.value = p.intermarche ? versTexteMontant(p.intermarche) : "";
  formArticle.habituel.checked = forme.cuisine.habituels.some((h) => sansAccentsMin(h.nom) === sansAccentsMin(c.nom));
  for (const [cle, m] of Object.entries(MAGASINS)) document.getElementById("lien-" + cle).href = m.recherche(c.nom);
  fenArticle.showModal();
}

formArticle.addEventListener("submit", () => {
  const c = articleOuvert;
  const cle = sansAccentsMin(c.nom);
  const prix = {};
  for (const m of Object.keys(MAGASINS)) {
    const v = lireMontant(formArticle[m].value);
    if (v) prix[m] = v;
  }
  if (Object.keys(prix).length) forme.cuisine.prix[cle] = prix;
  else delete forme.cuisine.prix[cle];
  const habituels = forme.cuisine.habituels.filter((h) => sansAccentsMin(h.nom) !== cle);
  if (formArticle.habituel.checked) habituels.push({ nom: c.nom, ingredient: c.ingredient || "" });
  forme.cuisine.habituels = habituels;
  enregistrerForme();
  afficher();
});
document.getElementById("suppr-article").addEventListener("click", () => {
  forme.cuisine.courses = forme.cuisine.courses.filter((c) => c.id !== articleOuvert.id);
  enregistrerForme();
  fenArticle.close();
  afficher();
});

// ---------- 5. Une recette, qui s'ajuste en direct ----------
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
  const perso = r.id.startsWith("ma-");

  const tete = el("div", "tete-recette");
  tete.append(el("span", "emoji-recette", r.emoji || "🍽"));
  const t = el("div", "texte-tete");
  t.append(el("h2", "titre-recette", r.nom));
  const meta = [];
  if (r.minutes) meta.push(`${versionRapide ? r.rapide.minutes : r.minutes} min`);
  if (r.kcal) meta.push(`≈ ${r.kcal} kcal la portion`);
  meta.push(momentsDe(r).map((m) => MOMENTS[m].emoji).join(" "));
  t.append(el("p", "petit", meta.join(" · ")));
  tete.append(t);
  const coeur = el("button", "btn-coeur" + (estFavori(r) ? " on" : ""), estFavori(r) ? "♥" : "♡");
  coeur.type = "button";
  coeur.setAttribute("aria-label", estFavori(r) ? "Retirer des préférées" : "Ajouter aux préférées");
  coeur.addEventListener("click", () => {
    const f = forme.cuisine.favoris;
    forme.cuisine.favoris = estFavori(r) ? f.filter((x) => x !== r.id) : [...f, r.id];
    enregistrerForme();
    dessinerRecette();
    afficher();
  });
  tete.append(coeur);
  zone.append(tete);

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
    const rempl = remplacements.find((x) => x.i === i);
    const statut = aLaMaison(i) ? el("span", "statut ok", "✓")
      : rempl ? el("span", "statut remplace", "→ " + nomIngr(rempl.par))
      : el("span", "statut " + (bonus ? "bonus" : "manque"), bonus ? "facultatif" : "manque");
    l.append(el("span", "libelle" + (bonus ? " ingr-bonus" : ""), nomIngr(i)), statut);
    l.addEventListener("click", () => { basculerFrigo(i); dessinerRecette(); afficher(); });
    groupe.append(l);
  };
  r.ingredients.forEach((i) => ligneIngr(i, false));
  (r.bonus || []).forEach((i) => ligneIngr(i, true));
  // Tes ingrédients « en plus », écrits à la main
  for (const autre of r.autres || []) {
    const l = el("div", "ligne ligne-ingr");
    l.append(el("span", "libelle", autre), el("span", "statut bonus", "à prévoir"));
    groupe.append(l);
  }
  zone.append(groupe);

  zone.append(el("h3", "titre-groupe", "Étapes"));
  const ol = el("ol", "etapes");
  for (const rp of remplacements) ol.append(el("li", "etape-rempl", `Remplace ${nomIngr(rp.i).toLowerCase()} par ${nomIngr(rp.par).toLowerCase()}.`));
  for (const e of r.etapes || []) ol.append(el("li", "", e));
  if (!ol.children.length) ol.append(el("li", "", "Pas d'étapes notées."));
  zone.append(ol);

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
  const manger = el("button", "btn-principal btn-vert", r.kcal ? `Je le mange · ≈ ${r.kcal} kcal` : "Je le mange");
  manger.type = "button";
  manger.addEventListener("click", () => {
    if (r.kcal) noterRepas(r.nom, r.kcal);
    else { fenRecette.close(); ouvrirRepas(r.nom); return; }
    fenRecette.close();
    if (typeof montrerToast === "function") montrerToast("Bon appétit ✓");
  });
  boutons.append(manger);
  if (perso) {
    const modif = el("button", "btn-texte", "Modifier ma recette");
    modif.type = "button";
    modif.addEventListener("click", () => { fenRecette.close(); ouvrirMaRecette(r); });
    boutons.append(modif);
  }
  zone.append(boutons);
}

// ---------- 6. « + Ma recette » : ajouter les vôtres ----------
const fenMaRecette = document.getElementById("fenetre-ma-recette");
const formMaRecette = document.getElementById("form-ma-recette");
let maRecetteEditee = null;
let ingrChoisis = [];
let momentsChoisis = [];

function dessinerChoixMaRecette() {
  document.getElementById("moments-ma-recette").replaceChildren(...Object.entries(MOMENTS).map(([cle, m]) => {
    const b = el("button", "puce-frigo" + (momentsChoisis.includes(cle) ? " on" : ""), `${m.emoji} ${m.nom}`);
    b.type = "button";
    b.addEventListener("click", () => {
      momentsChoisis = momentsChoisis.includes(cle) ? momentsChoisis.filter((x) => x !== cle) : [...momentsChoisis, cle];
      dessinerChoixMaRecette();
    });
    return b;
  }));
  const zone = document.getElementById("ingr-ma-recette");
  zone.replaceChildren();
  for (const rayon of Object.values(RAYONS)) {
    zone.append(el("h3", "jour-mvt", rayon.nom));
    const puces = el("div", "puces-frigo");
    for (const [code, nom] of Object.entries(rayon.ingredients)) {
      const b = el("button", "puce-frigo" + (ingrChoisis.includes(code) ? " on" : ""), nom);
      b.type = "button";
      b.addEventListener("click", () => {
        ingrChoisis = ingrChoisis.includes(code) ? ingrChoisis.filter((x) => x !== code) : [...ingrChoisis, code];
        dessinerChoixMaRecette();
      });
      puces.append(b);
    }
    zone.append(puces);
  }
  document.getElementById("resume-ingr").textContent = `Ingrédients · ${ingrChoisis.length} choisi${ingrChoisis.length > 1 ? "s" : ""}`;
}

function ouvrirMaRecette(r = null) {
  maRecetteEditee = r;
  document.getElementById("titre-ma-recette").textContent = r ? "Modifier ma recette" : "Ma recette";
  formMaRecette.nom.value = r?.nom || "";
  formMaRecette.emoji.value = r?.emoji || "";
  formMaRecette.minutes.value = r?.minutes || "";
  formMaRecette.kcal.value = r?.kcal || "";
  formMaRecette.autres.value = (r?.autres || []).join(", ");
  formMaRecette.etapes.value = (r?.etapes || []).join("\n");
  ingrChoisis = [...(r?.ingredients || [])];
  momentsChoisis = [...(r?.moments || [momentChoisi])];
  document.getElementById("suppr-ma-recette").style.display = r ? "" : "none";
  dessinerChoixMaRecette();
  fenMaRecette.showModal();
}
document.getElementById("btn-ma-recette").addEventListener("click", () => ouvrirMaRecette());

formMaRecette.addEventListener("submit", (e) => {
  const nom = formMaRecette.nom.value.trim();
  if (!nom) { e.preventDefault(); formMaRecette.nom.focus(); return; }
  const valeurs = {
    nom,
    emoji: formMaRecette.emoji.value.trim() || "🍽",
    minutes: Math.round(lireNombre(formMaRecette.minutes.value) || 0),
    kcal: Math.round(lireNombre(formMaRecette.kcal.value) || 0),
    moments: momentsChoisis.length ? momentsChoisis : ["dejeuner", "diner"],
    ingredients: ingrChoisis,
    bonus: [],
    autres: formMaRecette.autres.value.split(",").map((x) => x.trim()).filter(Boolean),
    etapes: formMaRecette.etapes.value.split("\n").map((x) => x.trim()).filter(Boolean),
  };
  if (maRecetteEditee) Object.assign(maRecetteEditee, valeurs);
  else {
    const id = "ma-" + nouvelId();
    forme.cuisine.mesRecettes.push({ id, ...valeurs });
    forme.cuisine.favoris.push(id); // tes recettes vont direct dans « Nos préférées »
  }
  enregistrerForme();
  afficher();
});

document.getElementById("suppr-ma-recette").addEventListener("click", () => {
  if (!maRecetteEditee || !confirm(`Supprimer « ${maRecetteEditee.nom} » ?`)) return;
  const id = maRecetteEditee.id;
  forme.cuisine.mesRecettes = forme.cuisine.mesRecettes.filter((r) => r.id !== id);
  forme.cuisine.favoris = forme.cuisine.favoris.filter((x) => x !== id);
  enregistrerForme();
  fenMaRecette.close();
  afficher();
});

// ---------- 7. Noter un repas ----------
const fenRepas = document.getElementById("fenetre-repas");
const formRepas = document.getElementById("form-repas");
let momentRepas = momentChoisi;

function noterRepas(nom, kcal, moment = momentSelonHeure()) {
  const auj = aujourdhui();
  (forme.cuisine.repas[auj] ||= []).push({ id: nouvelId(), nom, kcal: Math.round(kcal), moment });
  enregistrerForme();
  afficher();
}
function dessinerMomentRepas() {
  document.querySelectorAll("#moment-repas-feuille button").forEach((b) => b.classList.toggle("active", b.dataset.moment === momentRepas));
}
document.querySelectorAll("#moment-repas-feuille button").forEach((b) =>
  b.addEventListener("click", () => { momentRepas = b.dataset.moment; dessinerMomentRepas(); })
);
function ouvrirRepas(nom = "") {
  formRepas.reset();
  formRepas.nom.value = nom;
  momentRepas = momentSelonHeure();
  dessinerMomentRepas();
  fenRepas.showModal();
  formRepas.kcal.focus();
}
formRepas.addEventListener("submit", (e) => {
  const kcal = lireNombre(formRepas.kcal.value);
  if (!kcal) { e.preventDefault(); formRepas.kcal.focus(); return; }
  noterRepas(formRepas.nom.value.trim() || "Repas", kcal, momentRepas);
});

// ---------- 8. Les boutons du haut, et les feuilles ----------
document.querySelectorAll("#moment-repas button").forEach((b) =>
  b.addEventListener("click", () => { momentChoisi = b.dataset.moment; afficher(); })
);
document.querySelectorAll("#temps-dispo button").forEach((b) =>
  b.addEventListener("click", () => { tempsDispo = Number(b.dataset.min); afficher(); })
);
for (const fen of [fenRecette, fenRepas, fenMaRecette, fenArticle]) {
  fen.querySelector("[data-fermer]").addEventListener("click", () => fen.close());
  fen.addEventListener("click", (e) => { if (e.target === fen) fen.close(); });
}

// ---------- 9. Brancher dans l'appli ----------
const afficherSansAlim = afficher;
afficher = function () {
  afficherSansAlim();
  if (vueActive === "forme" && sousForme === "alim") afficherAlimentation();
};
afficher();
