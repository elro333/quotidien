// ============================================================
// dire.js — « Dis-le » : tu parles (ou tu écris) une phrase,
// l'appli comprend où la ranger.
//
//   « le 22 novembre à 14h dentiste »        → une tâche dans l'Agenda
//   « j'ai dépensé 25 € de courses »          → une dépense dans le Budget
//   « j'ai fait 9000 pas »                    → tes pas dans Forme
//   « 45 minutes de course » / « je pèse 62 » → une séance / ton poids
//
// Pas d'intelligence artificielle : des règles simples, écrites à la
// main. Si une phrase est mal comprise, il suffit d'ajouter une règle.
// ============================================================

// ---------- 1. Petits outils ----------
const sansAccents = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const MOIS_RX = "janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[ée]cembre";
const NOMS_MOIS = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"];
const JOURS_RX = "lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche";
const NOMS_JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const NOMBRES = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, quinze: 15 };
const nombreMot = (s) => (/^\d+$/.test(s) ? Number(s) : NOMBRES[s] || 1);
const pad = (n) => String(n).padStart(2, "0");

// Le prochain « lundi » (si on est lundi : celui de la semaine prochaine)
function prochainJour(nom, inclureAujourdhui = false) {
  const cible = NOMS_JOURS.indexOf(nom);
  const auj = versDate(aujourdhui()).getDay();
  let ecart = (cible - auj + 7) % 7;
  if (ecart === 0 && !inclureAujourdhui) ecart = 7;
  return ajouterJours(aujourdhui(), ecart);
}

// Un jour + un mois sans année : cette année, ou l'an prochain si c'est passé
function dateSansAnnee(j, m, a) {
  let annee = a ? (a < 100 ? 2000 + a : a) : new Date().getFullYear();
  let d = `${annee}-${pad(m)}-${pad(j)}`;
  if (!a && d < aujourdhui()) d = `${annee + 1}-${pad(m)}-${pad(j)}`;
  return d;
}

// Cherche une catégorie : la première dont un mot-clé apparaît dans la phrase
function chercherCat(texte, table, defaut) {
  const t = " " + sansAccents(texte.toLowerCase()) + " ";
  for (const [cat, mots] of table) if (mots.some((m) => t.includes(m))) return cat;
  return defaut;
}

const MOTS_DEPENSES = [
  ["remboursement", ["rembourse a", "rendu a", "rendre a", "rembourser"]],
  ["courses", ["course", "supermarche", "carrefour", "lidl", "monoprix", "intermarche", "auchan", "casino", "franprix", "picard", "marche ", "boulangerie", "epicerie"]],
  ["restos", ["resto", "restaurant", " bar", "cafe", "verre", "sortie", "mcdo", "burger", "sushi", "pizza", "kebab", "uber eats", "deliveroo", "brunch", "diner", "dejeuner"]],
  ["abonnements", ["abonnement", "netflix", "spotify", "apple", "icloud", "forfait", "deezer", "disney", "prime"]],
  ["transport", ["essence", "train", "sncf", " bus", "tram", "uber", "taxi", "peage", "parking", "navigo", "ticket", "billet", "carburant"]],
  ["sante", ["pharmacie", "medecin", "docteur", "dentiste", "coiffeur", "sephora", "maquillage", "beaute", "ongles", "sante"]],
  ["sport", ["salle de sport", "sport", "escrime", "basic fit", "piscine"]],
  ["loisirs", ["cinema", "cine", "concert", "livre", "jeu", "musee", "loisir", "theatre", "spectacle"]],
  ["cadeaux", ["cadeau", "anniversaire", "anniv"]],
  ["logement", ["loyer", "electricite", "edf", "internet", "box", "logement"]],
  ["shopping", ["vetement", "zara", "shopping", "chaussure", "habits", "robe", "pull", "sac"]],
];
const MOTS_REVENUS = [
  ["missions", ["mission", "reserve", "solde", "gendarmerie"]],
  ["extra", ["arrivee", "location", "airbnb", "client", "petit boulot", "baby"]],
  ["famille", ["parents", "maman", "papa", "mamie", "papi", "famille", "grand-mere", "grand-pere"]],
  ["aides", ["caf", "bourse", "aide", "apl"]],
  ["rembourse", ["rembourse", "on m'a rendu", "rendu"]],
  ["salaire", ["salaire", "paie", "paye"]],
];
const MOTS_TACHES = [
  ["cours", ["cours", " td", "examen", "partiel", "revis", "memoire", "fiche", "prof", "fac", "amphi", "oral", "dissert"]],
  ["reserve", ["reserve", "mission", "gendarmerie", "caserne", "brigade", "limes"]],
  ["delegation", ["delegation", "delegue", "table ronde", "conference", "promo", "asso", "linkedin"]],
  ["admin", ["banque", "impot", "caf", "papiers", "dossier", "mairie", "prefecture", "assurance", "mutuelle", "secu", "ameli", "inscription", "facture", "courrier"]],
];
const MOTS_SPORTS = [
  ["course", ["course a pied", "couru", "courir", "footing", "jogging", "running", "course"]],
  ["muscu", ["muscu", "salle", "renforcement"]],
  ["escrime", ["escrime"]],
  ["velo", ["velo"]],
  ["natation", ["natation", "nage", "nager", "piscine"]],
  ["yoga", ["yoga", "etirement", "pilates"]],
  ["marche", ["marche", "promenade", "balade", "rando"]],
];

// Nettoie ce qui reste de la phrase pour en faire un titre
function nettoyer(t) {
  let s = t.replace(/\s+/g, " ").trim();
  // Les petits mots seuls en début ou en fin (« dans les courses » → « courses »)
  const debut = /^(?:(?:que|de|le|la|les|à|a|au|aux|pour|dans|en|du|des|chez|et|ma|mon|mes)\s+|qu'|d'|l'|[,.:;]\s*)/i;
  const fin = /(?:\s+(?:à|a|le|la|les|de|du|des|pour|et|en|dans)|\s*[,.:;])$/i;
  for (let i = 0; i < 6; i++) s = s.replace(debut, "").replace(fin, "").trim();
  return s ? s[0].toUpperCase() + s.slice(1) : "";
}

// ---------- 2. Comprendre la phrase ----------
function analyser(brut) {
  let t = " " + brut.replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim() + " ";
  const bas = t.toLowerCase();
  // « prendre » : si la règle trouve quelque chose, on le retire de la phrase
  const prendre = (rx, f) => {
    const m = t.match(rx);
    if (!m) return false;
    f(m);
    t = t.replace(m[0], " ");
    return true;
  };

  // --- L'argent : « 25 € », « 25 euros », « 12,50 € », « 25 euros 50 »
  const rxArgent = /(\d+(?:[.,]\d{1,2})?)\s?(?:€|euros?|balles)(?:\s(\d{1,2})(?!\s?(?:h|heures?|min)))?/i;
  if (rxArgent.test(t)) {
    let montant = 0;
    prendre(rxArgent, (m) => { montant = Math.round(parseFloat(m[1].replace(",", ".")) * 100) + (m[2] ? Number(m[2]) : 0); });
    const revenu = /\b(gagn[ée]|re[çc]u|touch[ée]|salaire|rentr[ée]e|vers[ée]|pay[ée]e?s? pour|on m'a)/i.test(bas)
      && !/\b(j'ai pay[ée]|d[ée]pens[ée])/i.test(bas);
    const date = lireDate();
    prendre(/(?:mets?|note|ajoute)\s+(?:dans|au)\s+(?:le\s+)?budget\s*(?:que\s+|qu')?/i, () => {});
    // (?!\p{L}) = « pas suivi d'une lettre » : \b ne marche pas après un é en JavaScript
    prendre(/(?:j'ai\s+)?(?:d[ée]pens[ée]|pay[ée]|claqu[ée]|achet[ée]|gagn[ée]|re[çc]u|touch[ée])(?!\p{L})/iu, () => {});
    const cat = revenu ? chercherCat(bas, MOTS_REVENUS, "autre") : chercherCat(bas, MOTS_DEPENSES, "autre");
    return {
      genre: "mouvement",
      type: revenu ? "revenu" : "depense",
      montant,
      cat,
      date: date || aujourdhui(),
      libelle: nettoyer(t.replace(/\bj'ai\b/gi, " ")),
    };
  }

  // --- Les pas : « 9000 pas », « 9 000 pas »
  const mPas = bas.match(/(\d[\d\s.]{0,7})\s?pas\b/);
  if (mPas) {
    const n = Number(mPas[1].replace(/[\s.]/g, ""));
    if (n > 0) return { genre: "pas", pas: n, date: lireDate() || aujourdhui() };
  }

  // --- Le poids : « je pèse 62,5 », « 62 kilos »
  const mPoids = bas.match(/(?:je p[eè]se|poids)\D{0,12}(\d{2,3}(?:[.,]\d)?)|(\d{2,3}(?:[.,]\d)?)\s?(?:kg|kilos?)\b/);
  if (mPoids) {
    const kg = parseFloat((mPoids[1] || mPoids[2]).replace(",", "."));
    if (kg > 25 && kg < 300) return { genre: "poids", kg, date: lireDate() || aujourdhui() };
  }

  // --- Une séance : un sport + une durée (« 45 min de course », « 1h30 de muscu »)
  const sport = chercherCat(bas, MOTS_SPORTS, null);
  const mDuree = bas.match(/(\d+)\s?h\s?(\d{2})?\b|(\d+)\s?(?:min|minutes?)\b/);
  if (sport && mDuree) {
    const minutes = mDuree[3] ? Number(mDuree[3]) : Number(mDuree[1]) * 60 + Number(mDuree[2] || 0);
    if (minutes > 0) return { genre: "seance", type: sport, minutes, date: lireDate() || aujourdhui() };
  }

  // --- Sinon : une tâche pour l'Agenda
  let heure = "";
  prendre(/\b(?:à|a|vers)?\s?(\d{1,2})\s?(?:h|heures?|:)\s?(\d{2})?\b/i, (m) => { heure = `${pad(Math.min(Number(m[1]), 23))}:${pad(Number(m[2] || 0))}`; });
  if (!heure) prendre(/\b(?:à |a )?midi\b/i, () => { heure = "12:00"; });

  let repete = "", jours = [];
  prendre(/\b(?:tous les jours|chaque jour)\b/i, () => { repete = "jour"; });
  prendre(new RegExp(`\\b(?:tous les|chaque) (${JOURS_RX})s?\\b`, "i"), (m) => {
    repete = "jours";
    jours = [NOMS_JOURS.indexOf(m[1].toLowerCase())];
  });
  prendre(/\b(?:toutes les semaines|chaque semaine)\b/i, () => { repete = "semaine"; });
  prendre(/\b(?:tous les mois|chaque mois)\b/i, () => { repete = "mois"; });

  let date = lireDate();
  if (repete === "jours" && !date) date = prochainJour(NOMS_JOURS[jours[0]], true);
  if (repete && !date) date = aujourdhui();

  let important = false;
  prendre(/\b(?:c'est\s+)?(?:tr[eè]s\s+)?(?:important|urgent)e?\b/i, () => { important = true; });

  // Les débuts de phrase qui ne font pas partie du titre
  prendre(/^\s*(?:(?:est-ce que tu peux|peux-tu|tu peux)\s+)?(?:mets?|mettre|ajoute[rz]?|rajoute|note[rz]?)(?:\s+(?:dans|à|sur)\s+(?:l'|le |la |mon |ma )?(?:agenda|calendrier|liste|todo|tâches?))?(?:\s+que)?\s+/i, () => {});
  prendre(/^\s*(?:rappelle[- ]moi\s+(?:de\s+|d')?|il faut que je\s+|je dois\s+|j'aurai\s+|j'ai\s+|penser à\s+)/i, () => {});
  prendre(/^\s*(?:que\s+)?(?:j'aurai|j'ai|je dois)\s+/i, () => {});

  return {
    genre: "tache",
    titre: nettoyer(t) || "Sans titre",
    date: date || "",
    heure,
    cat: chercherCat(bas, MOTS_TACHES, "perso"),
    important,
    repete,
    jours,
  };

  // Lit une date dans la phrase (et la retire). Renvoie "" si aucune.
  function lireDate() {
    let d = "";
    const essais = [
      [new RegExp(`\\b(?:le |l')?(\\d{1,2})(?:er)?\\s(${MOIS_RX})(?:\\s(\\d{4}))?\\b`, "i"),
        (m) => { d = dateSansAnnee(Number(m[1]), NOMS_MOIS.indexOf(sansAccents(m[2].toLowerCase())) + 1, m[3] && Number(m[3])); }],
      [/\b(?:le )?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/,
        (m) => { d = dateSansAnnee(Number(m[1]), Number(m[2]), m[3] && Number(m[3])); }],
      [/\b(?:aujourd'hui|ce soir|ce matin|cet apr[eè]s-midi|tout à l'heure)\b/i, () => { d = aujourdhui(); }],
      [/\bapr[eè]s[- ]demain\b/i, () => { d = ajouterJours(aujourdhui(), 2); }],
      [/\bdemain\b/i, () => { d = ajouterJours(aujourdhui(), 1); }],
      [/\bhier\b/i, () => { d = ajouterJours(aujourdhui(), -1); }],
      [/\bdans (\d+|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|quinze) (jours?|semaines?|mois)\b/i, (m) => {
        const n = nombreMot(m[1].toLowerCase());
        if (/^jour/i.test(m[2])) d = ajouterJours(aujourdhui(), n);
        else if (/^semaine/i.test(m[2])) d = ajouterJours(aujourdhui(), 7 * n);
        else { const x = new Date(); x.setMonth(x.getMonth() + n); d = enTexte(x); }
      }],
      [new RegExp(`\\b(?:ce |le |la semaine prochaine )?(${JOURS_RX})(?: prochain)?\\b`, "i"),
        (m) => { d = prochainJour(m[1].toLowerCase()); }],
      [/\b(?:le )(\d{1,2})(?:er)?\b/i, (m) => {
        const j = Number(m[1]);
        if (j < 1 || j > 31) return;
        const x = new Date();
        let cand = `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(j)}`;
        if (cand < aujourdhui()) { x.setDate(1); x.setMonth(x.getMonth() + 1); cand = `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(j)}`; }
        d = cand;
      }],
    ];
    for (const [rx, f] of essais) if (prendre(rx, f) && d) break;
    return d;
  }
}

// ---------- 3. Montrer ce qu'on a compris ----------
function resumer(r) {
  const quand = (d) => (d === aujourdhui() ? "aujourd'hui" : d === ajouterJours(aujourdhui(), 1) ? "demain" : jolieDate(d));
  switch (r.genre) {
    case "mouvement": {
      const c = catDe(r);
      return { emoji: c.emoji, couleur: c.couleur, ou: "Budget",
        titre: `${r.type === "revenu" ? "Revenu" : "Dépense"} de ${euros(r.montant)}`,
        detail: [r.libelle, c.nom, quand(r.date)].filter(Boolean).join(" · ") };
    }
    case "pas":
      return { emoji: "👟", couleur: ROSE_PAS, ou: "Forme", titre: `${nombre(r.pas)} pas`, detail: quand(r.date) };
    case "poids":
      return { emoji: "⚖️", couleur: "#007aff", ou: "Forme", titre: kgTexte(r.kg), detail: quand(r.date) };
    case "seance": {
      const s = SPORTS[r.type] || SPORTS.autre;
      return { emoji: s.emoji, couleur: s.couleur, ou: "Forme", titre: `${s.nom} · ${r.minutes} min`, detail: quand(r.date) };
    }
    default:
      return { emoji: r.important ? "★" : "📅", couleur: CATEGORIES[r.cat]?.couleur || "var(--accent)", ou: "Agenda",
        titre: r.titre,
        detail: [r.date ? quand(r.date) : "sans date", r.heure && r.heure.replace(":", "h"), CATEGORIES[r.cat]?.nom,
          r.repete && "↻ " + libelleRepete(r), r.important && "très important"].filter(Boolean).join(" · ") };
  }
}

// ---------- 4. La feuille « Dis-le » ----------
const fenDire = document.getElementById("fenetre-dire");
const champDire = document.getElementById("champ-dire");
const apercuDire = document.getElementById("apercu-dire");
const btnAjouterDire = document.getElementById("btn-ajouter-dire");
let compris = null;

function majApercu() {
  const texte = champDire.value.trim();
  apercuDire.replaceChildren();
  compris = texte ? analyser(texte) : null;
  btnAjouterDire.disabled = !compris;
  if (!compris) {
    apercuDire.append(el("p", "aide", "Exemples : « demain à 14h dentiste » · « j'ai dépensé 25 € de courses » · « 9000 pas » · « 45 min de course » · « tous les lundis réviser les fiches, important »"));
    return;
  }
  const r = resumer(compris);
  const ligne = el("div", "ligne-cat");
  const p = el("span", "ico-cat", r.emoji);
  p.style.background = r.couleur;
  const infos = el("div", "infos-cat");
  infos.append(el("div", "petit", "Je vais ajouter dans " + r.ou), el("strong", "", r.titre), el("div", "petit", r.detail));
  ligne.append(p, infos);
  apercuDire.append(ligne);
}
champDire.addEventListener("input", majApercu);

function ouvrirDire() {
  champDire.value = "";
  majApercu();
  fenDire.showModal();
  champDire.focus();
}
document.getElementById("btn-dire").addEventListener("click", ouvrirDire);
fenDire.querySelector("[data-fermer]").addEventListener("click", () => fenDire.close());
fenDire.addEventListener("click", (e) => { if (e.target === fenDire) fenDire.close(); });

// Ajouter pour de vrai, puis aller voir le bon onglet
document.getElementById("form-dire").addEventListener("submit", (e) => {
  if (!compris) { e.preventDefault(); return; }
  const r = compris;
  let aModifier = null;
  if (r.genre === "mouvement") {
    const m = { id: nouvelId(), type: r.type, montant: r.montant, libelle: r.libelle, cat: r.cat, date: r.date, mensuel: false, dette: "" };
    budget.mouvements.push(m);
    enregistrerBudget();
    moisAffiche = moisDe(r.date);
    allerA("budget");
    aModifier = () => ouvrirMouvement(m);
  } else if (r.genre === "pas") {
    forme.pas[r.date] = r.pas;
    enregistrerForme();
    allerA("forme");
  } else if (r.genre === "poids") {
    forme.poids = forme.poids.filter((p) => p.date !== r.date);
    forme.poids.push({ id: nouvelId(), date: r.date, kg: r.kg });
    enregistrerForme();
    allerA("forme");
  } else if (r.genre === "seance") {
    const s = { id: nouvelId(), date: r.date, type: r.type, minutes: r.minutes, note: "" };
    forme.seances.push(s);
    enregistrerForme();
    allerA("forme");
    aModifier = () => ouvrirForme("seance", { seance: s });
  } else {
    const t = { id: nouvelId(), fait: false, creeLe: Date.now(), titre: r.titre, date: r.date, heure: r.heure,
      cat: r.cat, note: "", repete: r.repete, jours: r.jours, important: r.important };
    if (t.repete) t.dateDebut = t.date;
    taches.push(t);
    enregistrer();
    allerA("taches");
    aModifier = () => ouvrirFenetre(t);
  }
  if (vueActive === "forme" && typeof changerSousForme === "function" && sousForme !== "activite") changerSousForme("activite");
  afficher();
  montrerToast("Ajouté ✓", aModifier);
});

// ---------- 5. Le petit message « Ajouté ✓ — Modifier » ----------
const toast = document.getElementById("toast");
let minuteurToast = null;
function montrerToast(texte, quandModifier, libelle = "Modifier") {
  toast.replaceChildren(el("span", "", texte));
  if (quandModifier) {
    const b = el("button", "btn-texte", libelle);
    b.addEventListener("click", () => { toast.classList.remove("visible"); quandModifier(); });
    toast.append(b);
  }
  toast.classList.add("visible");
  clearTimeout(minuteurToast);
  minuteurToast = setTimeout(() => toast.classList.remove("visible"), 4000);
}
