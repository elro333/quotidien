// ============================================================
// moi.js — l'onglet « Moi » : le développement personnel
//
//   - Habitudes : les petites choses pour toi, à cocher chaque jour
//     (avec une série de jours 🔥), et « ma victoire du jour ».
//   - À lire / à voir : livres, films, séries, vidéos, podcasts.
//   - Conseils : un conseil par jour, un défi par semaine.
// ============================================================

// ---------- 1. Les contenus ----------
const TYPES_ENVIES = {
  livre:   { nom: "Livres",   un: "Livre",   emoji: "📚", couleur: "#ff9500" },
  film:    { nom: "Films",    un: "Film",    emoji: "🎬", couleur: "#ff2d55" },
  serie:   { nom: "Séries",   un: "Série",   emoji: "📺", couleur: "#5856d6" },
  video:   { nom: "Vidéos",   un: "Vidéo",   emoji: "▶️", couleur: "#ff3b30" },
  podcast: { nom: "Podcasts", un: "Podcast", emoji: "🎧", couleur: "#af52de" },
};

// Des idées pour commencer (de vraies œuvres, à ajouter d'un geste)
const SUGGESTIONS = [
  { type: "livre", titre: "Un rien peut tout changer", auteur: "James Clear" },
  { type: "livre", titre: "Les Quatre Accords toltèques", auteur: "Don Miguel Ruiz" },
  { type: "livre", titre: "Sapiens. Une brève histoire de l'humanité", auteur: "Yuval Noah Harari" },
  { type: "livre", titre: "Comment se faire des amis", auteur: "Dale Carnegie" },
  { type: "livre", titre: "Petit traité de manipulation à l'usage des honnêtes gens", auteur: "R.-V. Joule et J.-L. Beauvois" },
  { type: "livre", titre: "L'Étranger", auteur: "Albert Camus" },
  { type: "film", titre: "À voix haute : la force de la parole", auteur: "Stéphane de Freitas et Ladj Ly" },
  { type: "film", titre: "Le Discours d'un roi", auteur: "Tom Hooper" },
  { type: "film", titre: "Les Figures de l'ombre", auteur: "Theodore Melfi" },
  { type: "film", titre: "Le Cercle des poètes disparus", auteur: "Peter Weir" },
  { type: "film", titre: "Erin Brockovich, seule contre tous", auteur: "Steven Soderbergh" },
  { type: "serie", titre: "Le Bureau des légendes", auteur: "Éric Rochant" },
  { type: "serie", titre: "The Crown", auteur: "Peter Morgan" },
  { type: "video", titre: "Le Précepteur (philosophie)", auteur: "Charles Robin" },
  { type: "video", titre: "Nota Bene (histoire)", auteur: "Benjamin Brillaud" },
  { type: "video", titre: "HugoDécrypte (actualité)", auteur: "Hugo Travers" },
  { type: "video", titre: "Le Dessous des cartes (géopolitique)", auteur: "Arte" },
  { type: "podcast", titre: "Affaires sensibles", auteur: "France Inter" },
  { type: "podcast", titre: "Les Pieds sur terre", auteur: "France Culture" },
];

const CONSEILS = [
  ["Confiance", "Note chaque soir une chose réussie, même petite : ton cerveau retient mieux les échecs que les victoires, aide-le."],
  ["Éloquence", "Avant de parler, respire par le ventre trois secondes : ta voix sera plus posée."],
  ["Éloquence", "Une pause d'une seconde te paraît longue, mais elle montre de l'assurance à ceux qui t'écoutent."],
  ["Organisation", "La règle des 2 minutes : si ça prend moins de 2 minutes, fais-le tout de suite."],
  ["Organisation", "Le soir, choisis LA tâche la plus importante de demain. Le matin, commence par elle."],
  ["Énergie", "Le téléphone hors de la chambre : un meilleur sommeil et un réveil plus calme."],
  ["Mindset", "Remplace « je dois » par « je choisis de » : ça change la façon dont tu vis la tâche."],
  ["Mindset", "Pas besoin de motivation pour commencer, juste de 5 minutes. La motivation vient en faisant."],
  ["Relations", "Écouter vraiment, c'est ne pas préparer sa réponse pendant que l'autre parle."],
  ["Confiance", "Le trac montre que ça compte pour toi. Il ne veut pas dire que tu n'es pas prête."],
  ["Éloquence", "Structure en trois : une idée, un exemple, une conclusion. Simple et efficace à l'oral."],
  ["Éloquence", "Lis un article à voix haute 5 minutes par jour : diction et vocabulaire progressent vite."],
  ["Organisation", "Coupe une grosse tâche en morceaux de 25 minutes, avec 5 minutes de pause entre chaque."],
  ["Énergie", "Un verre d'eau au réveil, avant le café : ton corps sort de toute une nuit sans boire."],
  ["Énergie", "Dix minutes de marche après un repas : la digestion et l'humeur te remercient."],
  ["Mindset", "Compare-toi à toi d'il y a un an, pas aux autres d'aujourd'hui."],
  ["Mindset", "Quand tu procrastines, cherche la toute première action, ridicule tant elle est petite, et fais-la."],
  ["Confiance", "Tiens-toi droite, épaules ouvertes : le corps parle aussi au mental, pas seulement l'inverse."],
  ["Relations", "Dire non à quelque chose, c'est dire oui à ce qui compte plus pour toi."],
  ["Culture", "Lis un article d'actualité par jour et résume-le en une phrase : culture générale et clarté d'esprit."],
  ["Culture", "Un mot nouveau par jour : note-le, et place-le une fois dans la journée."],
  ["Énergie", "Écrans éteints 30 minutes avant de dormir : lis plutôt quelques pages."],
  ["Mindset", "Les erreurs sont des informations, pas un jugement sur toi."],
  ["Organisation", "Range ton téléphone dans une autre pièce quand tu travailles : chaque notification coûte ta concentration."],
  ["Confiance", "Accepte un compliment par un simple « merci », sans te justifier."],
  ["Éloquence", "Regarde ton public par petits groupes, une phrase pour chacun : tout le monde se sent regardé."],
  ["Relations", "Envoie un message gentil à quelqu'un sans raison : ça fait du bien des deux côtés."],
  ["Mindset", "Sépare ce que tu contrôles de ce que tu ne contrôles pas. Mets ton énergie dans le premier."],
  ["Énergie", "Bouger 20 minutes, c'est déjà un antistress puissant."],
  ["Culture", "De temps en temps, un documentaire à la place d'un épisode de série."],
];

const DEFIS = [
  "Parle 2 minutes devant le miroir sur un sujet d'actualité.",
  "Une soirée entière sans écran.",
  "Lis 50 pages dans la semaine.",
  "Fais un compliment sincère à quelqu'un que tu connais peu.",
  "Couche-toi avant 23 h trois soirs de la semaine.",
  "Appelle tes grands-parents, juste pour prendre des nouvelles.",
  "Vide un tiroir ou un dossier qui t'encombre.",
  "Écris trois choses dont tu es fière.",
  "Pose une question à voix haute en cours ou en réunion.",
  "Fais seule une activité que tu n'as jamais faite.",
  "Une journée sans réseaux sociaux.",
  "Apprends 10 mots d'italien.",
  "Raconte une histoire à tes amis en soignant la façon de la raconter.",
  "Mets ton téléphone en noir et blanc pendant 3 jours.",
  "Écris une lettre à toi-même dans un an.",
  "Cuisine un plat pour quelqu'un.",
  "Regarde un discours célèbre et note ce qui le rend fort.",
  "Termine une chose que tu repousses depuis longtemps.",
  "Marche 10 000 pas en une journée.",
  "Une matinée sans téléphone avant 10 h.",
];

// ---------- 2. Les données ----------
const CLE_MOI = "quotidien.moi.v1";
const moiVide = () => ({
  habitudes: [
    { id: "h-lire", nom: "Lire 10 pages", emoji: "📖" },
    { id: "h-eau", nom: "Boire 1,5 L d'eau", emoji: "💧" },
    { id: "h-tel", nom: "Pas de téléphone au lit", emoji: "📵" },
    { id: "h-moi", nom: "10 minutes rien que pour moi", emoji: "🧘‍♀️" },
  ],
  coches: {},        // { "2026-11-22": ["h-lire", …] }
  envies: [],        // [ { id, type, titre, auteur, lien, statut: "afaire"|"encours"|"fini", note, finiLe, creeLe } ]
  conseilsGardes: [],// index dans CONSEILS
  defis: {},         // { "2026-S47": true }
  positifs: {},      // { "2026-11-22": ["petit rien", "bon moment", "le plus beau"] }  (positifs.js)
  appris: [],        // [ { id, date, texte, source, r7, r30 } ]                        (positifs.js)
  infosGardees: [],  // index dans SAVAIS_TU                                             (positifs.js)
});
function normaliserMoi(m) {
  const v = moiVide();
  return {
    habitudes: m?.habitudes || v.habitudes,
    coches: m?.coches || {},
    envies: m?.envies || [],
    conseilsGardes: m?.conseilsGardes || [],
    defis: m?.defis || {},
    positifs: versPositifs(m),
    appris: m?.appris || [],
    infosGardees: m?.infosGardees || [],
  };
}
// L'ancienne « victoire du jour » devient le 3e positif de ce jour-là
function versPositifs(m) {
  const p = { ...(m?.positifs || {}) };
  for (const [d, texte] of Object.entries(m?.victoires || {})) {
    const l = [...(p[d] || ["", "", ""])];
    if (!l[2]) l[2] = texte;
    p[d] = l;
  }
  return p;
}
let moi = (() => {
  try { return normaliserMoi(JSON.parse(localStorage.getItem(CLE_MOI))); } catch (e) { return moiVide(); }
})();
function enregistrerMoi() {
  try { localStorage.setItem(CLE_MOI, JSON.stringify(moi)); } catch (e) { alert("Impossible d'enregistrer sur cet appareil."); }
}

// ---------- 3. Petits calculs ----------
const cocheLe = (jour, id) => (moi.coches[jour] || []).includes(id);
function serieHabitude(id) {
  let jour = aujourdhui();
  if (!cocheLe(jour, id)) jour = ajouterJours(jour, -1);
  let n = 0;
  while (cocheLe(jour, id) && n < 3650) { n++; jour = ajouterJours(jour, -1); }
  return n;
}
const jourDeLAnnee = () => Math.floor(versDate(aujourdhui()).getTime() / 86400000);
// Numéro de semaine (lundi → dimanche), pour le défi de la semaine
function cleSemaine() {
  const lundi = versDate(lundiDe(aujourdhui()));
  return `S${Math.floor(lundi.getTime() / (7 * 86400000))}`;
}
const defiDeLaSemaine = () => DEFIS[Number(cleSemaine().slice(1)) % DEFIS.length];
let decalageConseil = 0; // « Un autre conseil »

// ---------- 4. Habitudes / À lire / Conseils : l'interrupteur ----------
let sousMoi = "habitudes";
function changerSousMoi(s) {
  sousMoi = s;
  document.querySelectorAll("#segment-moi button").forEach((b) => b.classList.toggle("active", b.dataset.sous === s));
  for (const p of ["habitudes", "positifs", "culture", "envies"]) document.getElementById("moi-" + p).hidden = p !== s;
  window.scrollTo(0, 0);
  afficher();
}
document.querySelectorAll("#segment-moi button").forEach((b) => b.addEventListener("click", () => changerSousMoi(b.dataset.sous)));

function afficherMoi() {
  document.getElementById("sous-titre").textContent = jolieDate(aujourdhui());
  if (sousMoi === "habitudes") { dessinerHabitudes(); dessinerConseils(); }
  if (sousMoi === "envies") dessinerEnvies();
  // Positifs et Culture G : dessinés par positifs.js
}

// ---------- 5. Habitudes ----------
function basculerHabitude(id, jour = aujourdhui()) {
  const l = moi.coches[jour] || [];
  moi.coches[jour] = l.includes(id) ? l.filter((x) => x !== id) : [...l, id];
  if (!moi.coches[jour].length) delete moi.coches[jour];
  enregistrerMoi();
  afficher();
}

function dessinerHabitudes() {
  const auj = aujourdhui();
  const total = moi.habitudes.length;
  const faites = moi.habitudes.filter((h) => cocheLe(auj, h.id)).length;

  const carte = document.getElementById("carte-habitudes");
  carte.replaceChildren();
  const haut = el("div", "activite");
  haut.append(anneaux([{ part: total ? faites / total : 0, couleur: "#af52de" }], 96));
  const txt = el("div", "chiffres-activite");
  const l1 = el("div");
  l1.append(el("span", "petit", "Aujourd'hui"));
  const v = el("strong", "", `${faites} / ${total}`);
  v.style.color = "#af52de";
  l1.append(v);
  txt.append(l1, el("div", "petit", faites === total && total ? "Tout est fait, bravo 🎉" : "Petit à petit, ça compte."));
  haut.append(txt);
  carte.append(haut);

  const ul = document.getElementById("liste-habitudes");
  const lundi = lundiDe(auj);
  ul.replaceChildren(...moi.habitudes.map((h) => {
    const li = el("li", "ligne-habitude");
    const c = el("button", "case" + (cocheLe(auj, h.id) ? " cochee" : ""));
    c.style.setProperty("--couleur", "#af52de");
    c.setAttribute("aria-label", cocheLe(auj, h.id) ? "Pas encore fait" : "Fait");
    c.addEventListener("click", () => basculerHabitude(h.id));
    const infos = el("div", "infos");
    infos.append(el("div", "t", `${h.emoji} ${h.nom}`));
    const semaine = el("div", "semaine-habitude");
    for (let i = 0; i < 7; i++) {
      const j = ajouterJours(lundi, i);
      const p = el("i", (cocheLe(j, h.id) ? "fait" : "") + (j === auj ? " auj" : ""));
      p.title = jolieDate(j);
      semaine.append(p);
    }
    infos.append(semaine);
    infos.addEventListener("click", () => ouvrirHabitude(h));
    const s = serieHabitude(h.id);
    li.append(c, infos, el("span", "serie-habitude", s >= 2 ? `🔥 ${s}` : ""));
    return li;
  }));
  if (!moi.habitudes.length) ul.append(el("li", "vide-msg", "Touche + pour ajouter une habitude."));
}

// Feuille « habitude »
const fenHabitude = document.getElementById("fenetre-habitude");
const formHabitude = document.getElementById("form-habitude");
let habitudeEditee = null;
function ouvrirHabitude(h = null) {
  habitudeEditee = h;
  document.getElementById("titre-habitude").textContent = h ? "Modifier" : "Nouvelle habitude";
  formHabitude.emoji.value = h?.emoji || "";
  formHabitude.nom.value = h?.nom || "";
  document.getElementById("suppr-habitude").style.display = h ? "" : "none";
  fenHabitude.showModal();
  if (!h) formHabitude.nom.focus();
}
formHabitude.addEventListener("submit", (e) => {
  const nom = formHabitude.nom.value.trim();
  if (!nom) { e.preventDefault(); return; }
  const emoji = formHabitude.emoji.value.trim() || "✨";
  if (habitudeEditee) Object.assign(habitudeEditee, { nom, emoji });
  else moi.habitudes.push({ id: "h-" + nouvelId(), nom, emoji });
  enregistrerMoi();
  afficher();
});
document.getElementById("suppr-habitude").addEventListener("click", () => {
  if (!habitudeEditee || !confirm(`Supprimer « ${habitudeEditee.nom} » ? L'historique de cette habitude sera perdu.`)) return;
  moi.habitudes = moi.habitudes.filter((h) => h.id !== habitudeEditee.id);
  enregistrerMoi();
  fenHabitude.close();
  afficher();
});

// ---------- 6. À lire / à voir ----------
let filtreEnvies = "tout";

function ligneEnvie(x) {
  const t = TYPES_ENVIES[x.type] || TYPES_ENVIES.livre;
  const li = el("li", "ligne-mvt");
  const p = el("span", "ico-cat", t.emoji);
  p.style.background = t.couleur;
  const infos = el("div", "infos");
  infos.append(el("div", "t", x.titre));
  const meta = [t.un];
  if (x.auteur) meta.push(x.auteur);
  if (x.statut === "fini" && x.note) meta.push("★".repeat(x.note));
  infos.append(el("div", "m", meta.join(" · ")));
  li.append(p, infos);
  li.addEventListener("click", () => ouvrirEnvie(x));
  return li;
}

function dessinerEnvies() {
  // Les filtres
  const zoneF = document.getElementById("filtres-envies");
  zoneF.replaceChildren(...[["tout", "Tout"], ...Object.entries(TYPES_ENVIES).map(([k, t]) => [k, `${t.emoji} ${t.nom}`])].map(([k, nom]) => {
    const b = el("button", k === filtreEnvies ? "active" : "", nom);
    b.addEventListener("click", () => { filtreEnvies = k; afficher(); });
    return b;
  }));

  const visibles = moi.envies.filter((x) => filtreEnvies === "tout" || x.type === filtreEnvies);
  const remplirListe = (id, liste, vide) => {
    const zone = document.getElementById(id);
    zone.replaceChildren();
    if (liste.length) {
      const ul = el("ul", "liste verre");
      liste.forEach((x) => ul.append(ligneEnvie(x)));
      zone.append(ul);
    } else if (vide) zone.append(el("p", "aide aide-groupe", vide));
  };
  remplirListe("envies-encours", visibles.filter((x) => x.statut === "encours"), "Rien en cours. Touche une envie pour la commencer.");
  remplirListe("envies-afaire", visibles.filter((x) => x.statut === "afaire").sort((a, b) => b.creeLe - a.creeLe),
    "Ta liste est vide : touche + ou pioche dans les idées ci-dessous.");
  const finis = visibles.filter((x) => x.statut === "fini").sort((a, b) => (b.finiLe || "").localeCompare(a.finiLe || ""));
  document.getElementById("resume-finis").textContent = `Terminés · ${finis.length}`;
  remplirListe("envies-finis", finis);

  // Les idées : celles qui ne sont pas déjà dans ta liste
  const deja = new Set(moi.envies.map((x) => sansAccentsMin(x.titre)));
  const idees = SUGGESTIONS.filter((s) => !deja.has(sansAccentsMin(s.titre)) && (filtreEnvies === "tout" || s.type === filtreEnvies));
  const zoneIdees = document.getElementById("idees-envies");
  zoneIdees.replaceChildren(...idees.map((s) => {
    const t = TYPES_ENVIES[s.type];
    const li = el("li", "ligne-mvt");
    const p = el("span", "ico-cat", t.emoji);
    p.style.background = t.couleur;
    const infos = el("div", "infos");
    infos.append(el("div", "t", s.titre), el("div", "m", `${t.un} · ${s.auteur}`));
    const b = el("button", "btn-texte", "+ Ajouter");
    b.addEventListener("click", () => {
      moi.envies.push({ id: nouvelId(), ...s, lien: "", statut: "afaire", note: 0, creeLe: Date.now() });
      enregistrerMoi();
      afficher();
    });
    li.append(p, infos, b);
    return li;
  }));
  document.getElementById("details-idees").hidden = !idees.length;
}

// Feuille « envie »
const fenEnvie = document.getElementById("fenetre-envie");
const formEnvie = document.getElementById("form-envie");
let envieEditee = null, typeEnvie = "livre", statutEnvie = "afaire", noteEnvie = 0;

function dessinerFeuilleEnvie() {
  document.getElementById("type-envie").replaceChildren(...Object.entries(TYPES_ENVIES).map(([k, t]) => {
    const b = el("button", k === typeEnvie ? "active" : "", t.emoji);
    b.type = "button";
    b.setAttribute("aria-label", t.un);
    b.addEventListener("click", () => { typeEnvie = k; dessinerFeuilleEnvie(); });
    return b;
  }));
  document.getElementById("nom-type-envie").textContent = TYPES_ENVIES[typeEnvie].un;
  formEnvie.auteur.placeholder = { livre: "Auteur", film: "Réalisateur", serie: "Créateur ou plateforme", video: "Chaîne YouTube", podcast: "Émission ou radio" }[typeEnvie];
  document.querySelectorAll("#statut-envie button").forEach((b) => b.classList.toggle("active", b.dataset.statut === statutEnvie));
  const etoiles = document.getElementById("note-envie");
  etoiles.hidden = statutEnvie !== "fini";
  etoiles.replaceChildren(...[1, 2, 3, 4, 5].map((n) => {
    const b = el("button", "etoile-note" + (n <= noteEnvie ? " on" : ""), n <= noteEnvie ? "★" : "☆");
    b.type = "button";
    b.addEventListener("click", () => { noteEnvie = n === noteEnvie ? 0 : n; dessinerFeuilleEnvie(); });
    return b;
  }));
  // Lien : le tien, sinon une recherche
  const q = encodeURIComponent(`${formEnvie.titre.value} ${formEnvie.auteur.value}`.trim());
  const lien = formEnvie.lien.value.trim() ||
    (typeEnvie === "video" ? `https://www.youtube.com/results?search_query=${q}` : `https://www.google.com/search?q=${q}`);
  const a = document.getElementById("ouvrir-envie");
  a.href = lien;
  a.querySelector(".libelle").textContent = formEnvie.lien.value.trim() ? "Ouvrir le lien" : typeEnvie === "video" ? "Chercher sur YouTube" : "Chercher sur internet";
  a.hidden = !formEnvie.titre.value.trim();
}
document.querySelectorAll("#statut-envie button").forEach((b) =>
  b.addEventListener("click", () => { statutEnvie = b.dataset.statut; dessinerFeuilleEnvie(); })
);
["titre", "auteur", "lien"].forEach((n) => formEnvie[n].addEventListener("input", dessinerFeuilleEnvie));

function ouvrirEnvie(x = null) {
  envieEditee = x;
  typeEnvie = x?.type || (filtreEnvies !== "tout" ? filtreEnvies : "livre");
  statutEnvie = x?.statut || "afaire";
  noteEnvie = x?.note || 0;
  formEnvie.titre.value = x?.titre || "";
  formEnvie.auteur.value = x?.auteur || "";
  formEnvie.lien.value = x?.lien || "";
  document.getElementById("titre-feuille-envie").textContent = x ? "Modifier" : "À lire / à voir";
  document.getElementById("suppr-envie").style.display = x ? "" : "none";
  dessinerFeuilleEnvie();
  fenEnvie.showModal();
  if (!x) formEnvie.titre.focus();
}
formEnvie.addEventListener("submit", (e) => {
  const titre = formEnvie.titre.value.trim();
  if (!titre) { e.preventDefault(); return; }
  const valeurs = {
    type: typeEnvie, titre, auteur: formEnvie.auteur.value.trim(), lien: formEnvie.lien.value.trim(),
    statut: statutEnvie, note: statutEnvie === "fini" ? noteEnvie : 0,
  };
  if (statutEnvie === "fini" && envieEditee?.statut !== "fini") valeurs.finiLe = aujourdhui();
  if (envieEditee) Object.assign(envieEditee, valeurs);
  else moi.envies.push({ id: nouvelId(), creeLe: Date.now(), ...valeurs });
  enregistrerMoi();
  afficher();
});
document.getElementById("suppr-envie").addEventListener("click", () => {
  if (!envieEditee) return;
  moi.envies = moi.envies.filter((x) => x.id !== envieEditee.id);
  enregistrerMoi();
  fenEnvie.close();
  afficher();
});

// ---------- 7. Conseils ----------
function dessinerConseils() {
  const index = (jourDeLAnnee() + decalageConseil) % CONSEILS.length;
  const [theme, texte] = CONSEILS[index];
  const carte = document.getElementById("carte-conseil");
  carte.replaceChildren(el("div", "etiquette etiquette-moi", `Conseil du jour · ${theme}`), el("p", "texte-conseil", texte));
  const boutons = el("div", "boutons");
  const garde = moi.conseilsGardes.includes(index);
  const bGarder = el("button", garde ? "btn-secondaire" : "btn-principal btn-violet", garde ? "♥ Gardé" : "♡ Je le garde");
  bGarder.addEventListener("click", () => {
    moi.conseilsGardes = garde ? moi.conseilsGardes.filter((i) => i !== index) : [...moi.conseilsGardes, index];
    enregistrerMoi();
    afficher();
  });
  const bAutre = el("button", "btn-secondaire", "Un autre");
  bAutre.addEventListener("click", () => { decalageConseil++; afficher(); });
  boutons.append(bGarder, bAutre);
  carte.append(boutons);

  // Le défi de la semaine
  const cle = cleSemaine();
  const releve = !!moi.defis[cle];
  const carteDefi = document.getElementById("carte-defi");
  carteDefi.replaceChildren();
  const haut = el("div", "haut-cat");
  haut.append(el("strong", "", "🎯 Défi de la semaine"), el("span", "petit", `${Object.keys(moi.defis).length} relevé${Object.keys(moi.defis).length > 1 ? "s" : ""}`));
  carteDefi.append(haut, el("p", "texte-defi", defiDeLaSemaine()));
  const b = el("button", releve ? "btn-secondaire" : "btn-principal btn-violet", releve ? "✓ Défi relevé" : "J'ai relevé le défi");
  b.addEventListener("click", () => {
    if (releve) delete moi.defis[cle]; else moi.defis[cle] = true;
    enregistrerMoi();
    afficher();
  });
  carteDefi.append(b);

  // Mes conseils gardés
  const ul = document.getElementById("liste-conseils-gardes");
  ul.replaceChildren(...moi.conseilsGardes.map((i) => {
    const li = el("li");
    const infos = el("div", "infos");
    infos.append(el("div", "t", CONSEILS[i][1]), el("div", "m", CONSEILS[i][0]));
    const b = el("button", "btn-texte", "Retirer");
    b.addEventListener("click", () => { moi.conseilsGardes = moi.conseilsGardes.filter((x) => x !== i); enregistrerMoi(); afficher(); });
    li.append(infos, b);
    return li;
  }));
  if (!moi.conseilsGardes.length) ul.append(el("li", "vide-msg", "Touche « Je le garde » sur un conseil qui te parle."));
}

// ---------- 8. Le récap sur Aujourd'hui ----------
function afficherMiniMoi() {
  const b = document.getElementById("mini-moi");
  const auj = aujourdhui();
  const total = moi.habitudes.length;
  const faites = moi.habitudes.filter((h) => cocheLe(auj, h.id)).length;
  const enCours = moi.envies.find((x) => x.statut === "encours");
  const entete = el("span", "entete-tuile", "Moi ›");
  entete.style.color = "#af52de";
  const ligne = el("div", "ligne-tuile");
  ligne.append(anneaux([{ part: total ? faites / total : 0, couleur: "#af52de" }]));
  const t = el("div", "texte-mini");
  t.append(el("strong", "", `${faites} / ${total}`), el("span", "petit", "habitudes"));
  if (enCours) t.append(el("span", "petit", `${TYPES_ENVIES[enCours.type].emoji} ${enCours.titre}`));
  ligne.append(t);
  b.replaceChildren(entete, ligne);
}
document.getElementById("mini-moi").addEventListener("click", () => allerA("moi"));

// ---------- 9. Feuilles et branchement ----------
for (const fen of [fenHabitude, fenEnvie]) {
  fen.querySelector("[data-fermer]").addEventListener("click", () => fen.close());
  fen.addEventListener("click", (e) => { if (e.target === fen) fen.close(); });
}
function ajouterDansMoi() {
  if (sousMoi === "envies") ouvrirEnvie();
  else if (sousMoi === "positifs") ouvrirJourPositifs(aujourdhui());
  else if (sousMoi === "culture") document.getElementById("champ-appris").focus();
  else ouvrirHabitude();
}

const afficherSansMoi = afficher;
afficher = function () {
  afficherSansMoi();
  if (vueActive === "moi") afficherMoi();
  if (vueActive === "aujourdhui") afficherMiniMoi();
};
afficher();
