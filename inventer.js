// ============================================================
// inventer.js — « ✨ Invente-moi une recette »
//
// Quand aucune recette toute prête ne colle à ton placard, l'appli
// en compose une : une BASE (pâtes, riz…) + une PROTÉINE (poulet,
// œufs…) + des LÉGUMES + une SAUCE, selon ce que tu as coché,
// le moment (petit-déj, déjeuner…) et le temps que tu as.
// Pas d'intelligence artificielle : des briques qui s'assemblent.
// ============================================================

const hasard = (liste) => liste[Math.floor(Math.random() * liste.length)];
const melanger = (liste) => [...liste].sort(() => Math.random() - .5);
const listeFr = (mots) => mots.length <= 1 ? mots.join("") : mots.slice(0, -1).join(", ") + " et " + mots[mots.length - 1];

// ---------- Les briques ----------
const BASES = {
  pates:    { nom: "Pâtes", min: 12, kcal: 350, etape: "Fais cuire les pâtes dans une grande casserole d'eau salée (temps indiqué sur le paquet), égoutte." },
  riz:      { nom: "Riz", min: 15, kcal: 300, etape: "Fais cuire le riz (15 min dans l'eau salée, ou un sachet micro-ondes si tu es pressée)." },
  semoule:  { nom: "Semoule", min: 5, kcal: 300, etape: "Verse autant d'eau bouillante salée que de semoule, couvre 5 min, puis égrène à la fourchette." },
  quinoa:   { nom: "Quinoa", min: 12, kcal: 300, etape: "Fais cuire le quinoa 12 min dans l'eau salée, égoutte." },
  pdt:      { nom: "Pommes de terre", min: 20, kcal: 250, etape: "Coupe les pommes de terre en dés et fais-les dorer 20 min à la poêle (5 min au micro-ondes avant, pour aller plus vite)." },
  gnocchis: { nom: "Gnocchis", min: 6, kcal: 400, etape: "Fais dorer les gnocchis 5 min à la poêle avec un filet d'huile." },
  lentilles:{ nom: "Lentilles", min: 20, kcal: 300, etape: "Fais cuire les lentilles 15 à 20 min dans l'eau, égoutte." },
};
const PROTEINES = {
  poulet:       { de: "au poulet", min: 8, kcal: 200, etape: "Coupe le poulet en morceaux et fais-le dorer 8 min avec un filet d'huile, sel, poivre." },
  steak:        { de: "à la viande hachée", min: 6, kcal: 250, etape: "Fais revenir la viande hachée 5 à 6 min en l'émiettant, sel, poivre." },
  saumon:       { de: "au saumon", min: 8, kcal: 250, etape: "Cuis le saumon 4 min côté peau, puis 2 à 3 min de l'autre côté, et émiette-le." },
  thon:         { de: "au thon", min: 0, kcal: 150, etape: "Égoutte le thon et émiette-le." },
  oeufs:        { de: "aux œufs", min: 4, kcal: 150, etape: "Casse 2 œufs dans la poêle et brouille-les doucement 2 min (ou fais-les au plat)." },
  lardons:      { de: "aux lardons", min: 5, kcal: 200, etape: "Fais dorer les lardons à sec 5 min." },
  jambon:       { de: "au jambon", min: 0, kcal: 100, etape: "Coupe le jambon en lanières." },
  pois_chiches: { de: "aux pois chiches", min: 4, kcal: 180, etape: "Rince les pois chiches et fais-les dorer 3 min à la poêle avec une pincée d'épices." },
  haricots:     { de: "aux haricots rouges", min: 3, kcal: 150, etape: "Rince les haricots rouges et réchauffe-les 3 min." },
  feta:         { de: "à la feta", min: 0, kcal: 150, etape: "Émiette la feta, à ajouter à la fin." },
  chevre:       { de: "au chèvre", min: 0, kcal: 150, etape: "Coupe le chèvre en morceaux, à ajouter à la fin pour qu'il fonde un peu." },
  mozza:        { de: "à la mozzarella", min: 0, kcal: 150, etape: "Coupe la mozzarella en dés, à ajouter à la fin." },
};
const LEGUMES_CUITS = ["oignon", "courgette", "poivron", "champi", "epinards", "carotte", "brocoli", "aubergine", "tomate", "mais"];
const LEGUMES_CRUS = ["salade", "tomate", "concombre", "avocat", "mais", "carotte"];
const SAUCES = {
  creme:        { de: "à la crème", etape: "Ajoute 10 cl de crème, mélange et laisse épaissir 2 min à feu doux." },
  sauce_tomate: { de: "sauce tomate", etape: "Verse la sauce tomate et laisse mijoter 5 min." },
  coco:         { de: "au lait de coco", etape: "Ajoute le lait de coco (et 1 cuillère de curry si tu en as), laisse mijoter 5 min.", avec: "curry" },
  pesto:        { de: "au pesto", etape: "Hors du feu, mélange avec 2 cuillères de pesto." },
  soja:         { de: "à la sauce soja", etape: "Ajoute 2 cuillères de sauce soja en fin de cuisson." },
  citron:       { de: "au citron", etape: "Arrose d'un filet de jus de citron au moment de servir." },
};
const nomCourt = (code) => (INGREDIENTS[code] || code).toLowerCase();

// ---------- Déjeuner, dîner ----------
function inventerPlat() {
  const a = aLaMaison;
  const temps = tempsDispo || 60;
  const bases = Object.keys(BASES).filter((b) => a(b) && BASES[b].min <= temps);
  const prots = Object.keys(PROTEINES).filter((p) => a(p) && PROTEINES[p].min <= temps);
  const cuits = LEGUMES_CUITS.filter(a);
  const crus = LEGUMES_CRUS.filter(a);
  const sauces = Object.keys(SAUCES).filter(a);

  // Les styles possibles avec ce qu'il y a
  const styles = [];
  if (bases.length && (prots.length || cuits.length)) styles.push("poelee", "poelee");
  if ((a("wraps") || a("pain")) && (prots.length || crus.length)) styles.push("wrap");
  if (a("oeufs") && cuits.length) styles.push("omelette");
  if (crus.length >= 2 && (prots.length || bases.some((b) => ["riz", "quinoa", "semoule", "pates", "lentilles"].includes(b)))) styles.push("salade");
  if (!styles.length) return null;
  const style = hasard(styles);

  const ingredients = [];
  const etapes = [];
  let min = 5, kcal = 0, nom = "";

  if (style === "poelee") {
    const base = hasard(bases);
    const prot = prots.filter((p) => p !== base).length ? hasard(prots.filter((p) => p !== base)) : null;
    const legs = melanger(cuits).slice(0, prot ? 2 : 3);
    const sauce = sauces.length ? hasard(sauces) : null;
    ingredients.push(base, ...(prot ? [prot] : []), ...legs, ...(sauce ? [sauce] : []));
    etapes.push(BASES[base].etape);
    if (legs.length) etapes.push(`Pendant ce temps, fais revenir ${listeFr(legs.map(nomCourt))} 8 à 10 min à la poêle avec un filet d'huile, sel, poivre.`);
    if (prot) etapes.push(PROTEINES[prot].etape);
    if (sauce) etapes.push(SAUCES[sauce].etape);
    etapes.push(`Mélange tout avec ${BASES[base].nom.toLowerCase()}${a("fromage") ? ", parsème de fromage râpé" : ""} et sers chaud.`);
    if (a("fromage")) ingredients.push("fromage");
    min = 3 + Math.max(BASES[base].min, (prot ? PROTEINES[prot].min : 0) + (legs.length ? 8 : 0)); // tout cuit en même temps
    kcal = BASES[base].kcal + (prot ? PROTEINES[prot].kcal : 0) + legs.length * 30 + (sauce ? 100 : 0);
    // « Pâtes au poulet, courgette et oignon, à la crème »
    const garniture = prot ? listeFr([PROTEINES[prot].de, ...legs.map(nomCourt)]) : legs.length ? "aux légumes (" + listeFr(legs.map(nomCourt)) + ")" : "";
    nom = `${BASES[base].nom} ${garniture}${sauce ? ", " + SAUCES[sauce].de : ""}`;
  } else if (style === "wrap") {
    const contenant = a("wraps") ? "wraps" : "pain";
    const prot = prots.length ? hasard(prots) : null;
    const legs = melanger(crus).slice(0, 2);
    ingredients.push(contenant, ...(prot ? [prot] : []), ...legs);
    if (prot && PROTEINES[prot].min) etapes.push(PROTEINES[prot].etape);
    etapes.push(contenant === "wraps" ? "Chauffe les wraps 20 s à la poêle." : "Fais griller le pain.");
    if (legs.length) etapes.push(`Coupe ${listeFr(legs.map(nomCourt))}.`);
    etapes.push(contenant === "wraps" ? "Garnis, ajoute un filet de sauce si tu en as, roule bien serré." : "Garnis les tartines et sers.");
    min += (prot ? PROTEINES[prot].min : 0) + 5;
    kcal = 250 + (prot ? PROTEINES[prot].kcal : 0) + legs.length * 30;
    nom = `${contenant === "wraps" ? "Wraps" : "Tartines"} : ${listeFr([...(prot ? [nomCourt(prot)] : []), ...legs.map(nomCourt)])}`;
  } else if (style === "omelette") {
    const legs = melanger(cuits).slice(0, 2);
    const plus = ["fromage", "jambon", "lardons", "chevre", "feta"].filter(a);
    const extra = plus.length ? hasard(plus) : null;
    ingredients.push("oeufs", ...legs, ...(extra ? [extra] : []));
    etapes.push(`Fais revenir ${listeFr(legs.map(nomCourt))} 6 à 8 min à la poêle.`);
    etapes.push(`Bats 3 œufs avec sel et poivre${extra ? ` et ${nomCourt(extra)}` : ""}.`);
    etapes.push("Verse sur les légumes, laisse prendre 3 min à feu moyen, plie l'omelette en deux.");
    min = 11;
    kcal = 300 + legs.length * 30 + (extra ? 100 : 0);
    nom = `Omelette : ${listeFr([...legs.map(nomCourt), ...(extra ? [nomCourt(extra)] : [])])}`;
  } else {
    const baseFroide = bases.filter((b) => ["riz", "quinoa", "semoule", "pates", "lentilles"].includes(b));
    const base = baseFroide.length && Math.random() < .7 ? hasard(baseFroide) : null;
    const prot = prots.filter((p) => !["poulet", "steak", "saumon", "lardons"].includes(p) || PROTEINES[p].min <= temps - 5);
    const p = prot.length ? hasard(prot) : null;
    const legs = melanger(crus).slice(0, 3);
    ingredients.push(...(base ? [base] : []), ...(p ? [p] : []), ...legs, ...(a("citron") ? ["citron"] : []));
    if (base) etapes.push(BASES[base].etape + " Rince à l'eau froide.");
    if (p && PROTEINES[p].min) etapes.push(PROTEINES[p].etape);
    etapes.push(`Coupe ${listeFr(legs.map(nomCourt))}.`);
    etapes.push(`Mélange tout avec un filet d'huile d'olive${a("citron") ? ", du jus de citron" : ", un peu de vinaigre"}, sel et poivre.`);
    min += (base ? BASES[base].min : 0) + (p ? PROTEINES[p].min : 0) + 5;
    kcal = (base ? BASES[base].kcal : 100) + (p ? PROTEINES[p].kcal : 0) + legs.length * 30 + 80;
    nom = `${base ? "Salade de " + BASES[base].nom.toLowerCase() : "Salade composée"} ${p ? PROTEINES[p].de + ", " : ": "}${listeFr(legs.map(nomCourt))}`;
  }
  return { nom: nom.replace(/\s+/g, " ").trim(), emoji: { poelee: "🍳", wrap: "🌯", omelette: "🍳", salade: "🥗" }[style], min, kcal, ingredients: [...new Set(ingredients)], etapes };
}

// ---------- Petit-déj, goûter ----------
function inventerSucre() {
  const a = aLaMaison;
  const fruits = ["banane", "pomme", "fruits_rouges"].filter(a);
  const idees = [];
  if (a("yaourt")) idees.push(() => {
    const garni = [...fruits.slice(0, 2), ...(a("avoine") ? ["avoine"] : []), ...(a("miel") ? ["miel"] : [])];
    return { nom: `Bol de yaourt${garni.length ? " " + listeFr(garni.map(nomCourt)) : ""}`, emoji: "🥣", min: 5, kcal: 250,
      ingredients: ["yaourt", ...garni], etapes: ["Verse le yaourt dans un bol.", garni.length ? `Ajoute ${listeFr(garni.map(nomCourt))} par-dessus.` : "Ajoute ce que tu aimes par-dessus."] };
  });
  if (a("pain")) idees.push(() => {
    const dessus = ["beurre", "miel", "avocat", "fromage", "jambon", "oeufs", "chocolat"].filter(a);
    const d = melanger(dessus).slice(0, 2);
    return { nom: d.length ? `Tartines : ${listeFr(d.map(nomCourt))}` : "Tartines grillées", emoji: "🍞", min: 5, kcal: 300,
      ingredients: ["pain", ...d], etapes: ["Fais griller 2 tranches de pain.", d.length ? `Garnis de ${listeFr(d.map(nomCourt))}.` : "Garnis de ce que tu aimes."] };
  });
  if (a("oeufs") && !a("farine")) idees.push(() => ({ nom: "Œufs brouillés", emoji: "🍳", min: 6, kcal: 250, ingredients: ["oeufs", ...(a("pain") ? ["pain"] : [])],
    etapes: ["Bats 2 œufs avec sel et poivre.", "Fais-les cuire à feu doux en remuant sans arrêt, retire-les encore un peu baveux.", ...(a("pain") ? ["Sers avec du pain grillé."] : [])] }));
  if (fruits.length && (a("lait") || a("yaourt"))) idees.push(() => ({ nom: `Smoothie ${listeFr(fruits.slice(0, 2).map(nomCourt))}`, emoji: "🥤", min: 5, kcal: 220,
    ingredients: [...fruits.slice(0, 2), a("yaourt") ? "yaourt" : "lait"], etapes: ["Mets les fruits coupés dans le mixeur avec le lait ou le yaourt.", "Mixe 1 min (ajoute un peu d'eau si c'est trop épais)."] }));
  if (a("avoine") && a("lait")) idees.push(() => ({ nom: `Porridge${fruits.length ? " " + nomCourt(fruits[0]) : ""}`, emoji: "🥣", min: 8, kcal: 330,
    ingredients: ["avoine", "lait", ...fruits.slice(0, 1), ...(a("miel") ? ["miel"] : [])], etapes: ["Fais chauffer 40 g de flocons avec 20 cl de lait, 4 min en remuant.", "Ajoute les fruits et un filet de miel."] }));
  if (!idees.length) return null;
  return hasard(idees)();
}

// ---------- Le bouton ----------
let dernierNomInvente = "";
function inventerRecette() {
  let r = null;
  // Plusieurs essais pour ne pas proposer deux fois la même chose
  for (let i = 0; i < 8; i++) {
    r = ["petitdej", "gouter"].includes(momentChoisi) ? inventerSucre() : inventerPlat();
    if (!r || (r.nom !== dernierNomInvente && (!tempsDispo || r.min <= tempsDispo))) break;
  }
  if (!r) {
    alert(["petitdej", "gouter"].includes(momentChoisi)
      ? "Pour inventer un petit-déj, coche dans « Mon frigo et placard » au moins du pain, des yaourts, des fruits, des œufs ou des flocons d'avoine."
      : "Pour inventer un plat, coche dans « Mon frigo et placard » une base (pâtes, riz, semoule…) et une protéine ou des légumes.");
    return;
  }
  dernierNomInvente = r.nom;
  ouvrirRecette({
    id: "gen-" + nouvelId(), genere: true, nom: r.nom[0].toUpperCase() + r.nom.slice(1), emoji: r.emoji,
    minutes: r.min, kcal: Math.round(r.kcal / 10) * 10, ingredients: r.ingredients, bonus: [], etapes: r.etapes, moments: [momentChoisi],
  });
}
document.getElementById("btn-inventer").addEventListener("click", inventerRecette);

// Dans la feuille d'une recette inventée : « Une autre idée » et « Garder »
const dessinerRecetteBase = dessinerRecette;
dessinerRecette = function () {
  dessinerRecetteBase();
  const r = recetteOuverte;
  if (!r?.genere) return;
  document.querySelector("#contenu-recette .btn-coeur")?.remove();
  const zone = document.querySelector("#contenu-recette .boutons-recette");
  const autre = el("button", "btn-secondaire", "🎲 Une autre idée");
  autre.type = "button";
  autre.addEventListener("click", () => { fenRecette.close(); inventerRecette(); });
  const garder = el("button", "btn-texte", "♥ Garder dans mes recettes");
  garder.type = "button";
  garder.addEventListener("click", () => {
    const id = "ma-" + nouvelId();
    forme.cuisine.mesRecettes.push({ ...r, id, genere: undefined, autres: [] });
    forme.cuisine.favoris.push(id);
    enregistrerForme();
    afficher();
    garder.textContent = "Gardée dans « Nos préférées » ✓";
    garder.disabled = true;
  });
  zone.prepend(autre);
  zone.append(garder);
  // Un petit mot pour dire d'où vient la recette
  zone.parentElement.insertBefore(el("p", "aide aide-invente", "✨ Inventée avec ce que tu as et le temps choisi. Les quantités sont pour 1 personne."), zone);
};
