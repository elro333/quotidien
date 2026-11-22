// ============================================================
// positifs.js — dans l'onglet Moi :
//   - « Mes 3 positifs » : chaque jour, trois choses positives,
//     du plus petit rien au plus beau moment. Un calendrier pour
//     les relire, et des souvenirs qui ressortent.
//   - « Culture G » : le savais-tu du jour, ce que j'ai appris,
//     et « Tu te souviens ? » 7 jours puis 30 jours plus tard.
// Les données sont dans `moi` (moi.js).
// ============================================================

const INVITES_POSITIFS = [
  ["✨", "Un petit rien qui m'a fait du bien"],
  ["🌤", "Un bon moment"],
  ["🌟", "Le plus beau de ma journée"],
];

// Des faits sûrs, un par jour (dates et chiffres vérifiables)
const SAVAIS_TU = [
  "La Déclaration des droits de l'homme et du citoyen a été adoptée le 26 août 1789.",
  "La Ve République est née avec la Constitution du 4 octobre 1958.",
  "La France compte 101 départements, dont 96 en métropole.",
  "Depuis 2016, la France métropolitaine compte 13 régions (18 avec l'outre-mer).",
  "Le Conseil constitutionnel compte 9 membres nommés pour 9 ans ; les anciens présidents de la République en sont membres de droit.",
  "Depuis la loi du 3 août 2009, la gendarmerie nationale est rattachée au ministère de l'Intérieur, tout en restant une force armée.",
  "L'Union européenne compte 27 États membres depuis le départ du Royaume-Uni, le 31 janvier 2020.",
  "Le traité de Rome, qui a créé la Communauté économique européenne, a été signé le 25 mars 1957.",
  "La Marseillaise a été composée en 1792 par Rouget de Lisle, à Strasbourg.",
  "La loi de séparation des Églises et de l'État date du 9 décembre 1905.",
  "Les Françaises ont voté pour la première fois en 1945, grâce à l'ordonnance du 21 avril 1944.",
  "La peine de mort a été abolie en France par la loi du 9 octobre 1981, portée par Robert Badinter.",
  "La Cour européenne des droits de l'homme siège à Strasbourg : elle dépend du Conseil de l'Europe, pas de l'Union européenne.",
  "La Cour de justice de l'Union européenne siège à Luxembourg.",
  "L'Assemblée nationale compte 577 députés.",
  "Le Sénat compte 348 sénateurs, élus pour 6 ans au suffrage universel indirect.",
  "Le mandat du président de la République est passé de 7 à 5 ans après le référendum de 2000.",
  "L'armistice de la Première Guerre mondiale a été signé le 11 novembre 1918, à Rethondes.",
  "Le débarquement de Normandie a eu lieu le 6 juin 1944.",
  "Le 14 juillet est devenu la fête nationale par une loi de 1880.",
  "Napoléon Bonaparte a été sacré empereur le 2 décembre 1804, à Notre-Dame de Paris.",
  "Le Code civil a été promulgué le 21 mars 1804.",
  "Nice a été rattachée à la France en 1860, par le traité de Turin.",
  "La Corse est devenue française en 1768, par le traité de Versailles.",
  "La devise « Liberté, Égalité, Fraternité » figure à l'article 2 de la Constitution de 1958.",
  "Les 12 étoiles du drapeau européen symbolisent l'unité et la perfection : ce n'est pas le nombre de pays.",
  "Depuis l'arrivée de la Croatie en 2023, 20 pays de l'Union européenne utilisent l'euro.",
  "La lumière du Soleil met environ 8 minutes pour arriver jusqu'à la Terre.",
  "Le cœur humain bat environ 100 000 fois par jour.",
  "La structure en double hélice de l'ADN a été décrite en 1953, grâce notamment aux travaux de Rosalind Franklin.",
  "Marie Curie est la seule personne à avoir reçu un prix Nobel dans deux sciences différentes : physique (1903) et chimie (1911).",
  "L'Allemagne est un État fédéral de 16 Länder.",
  "Le Bundestag siège dans le bâtiment du Reichstag, à Berlin.",
  "Le mur de Berlin est tombé le 9 novembre 1989 ; la réunification allemande date du 3 octobre 1990.",
  "L'ONU a été créée en 1945 ; son siège est à New York.",
  "Le Conseil de sécurité de l'ONU compte 5 membres permanents : Chine, États-Unis, France, Royaume-Uni et Russie.",
  "L'OTAN a été fondée en 1949 par le traité de Washington.",
  "Le Code pénal actuel est entré en vigueur le 1er mars 1994.",
  "Interpol a son siège à Lyon ; Europol, à La Haye.",
  "Le GIGN a été créé en 1974, le RAID en 1985.",
  "La Garde républicaine fait partie de la gendarmerie nationale.",
  "La gendarmerie porte ce nom depuis 1791 : elle est l'héritière de la maréchaussée.",
  "« Les Misérables » de Victor Hugo ont été publiés en 1862.",
  "« Le Petit Prince » a été publié en 1943, d'abord à New York.",
  "Le Vatican est le plus petit État du monde.",
  "La Cour de cassation est la plus haute juridiction de l'ordre judiciaire ; le Conseil d'État, celle de l'ordre administratif.",
  "La fonction de préfet a été créée en 1800, sous Bonaparte.",
  "Depuis 2010, tout justiciable peut contester une loi devant le Conseil constitutionnel grâce à la QPC.",
  "La majorité et le droit de vote sont passés à 18 ans en France en 1974.",
  "La Loire est le plus long fleuve entièrement français, avec environ 1 000 km.",
];

// ---------- 1. Mes 3 positifs ----------
const positifsDu = (d) => moi.positifs[d] || ["", "", ""];
const nbPositifs = (d) => positifsDu(d).filter((x) => x.trim()).length;
let moisPositifs = moisActuel();

function changerPositif(d, i, texte) {
  const l = [...positifsDu(d)];
  l[i] = texte;
  if (l.some((x) => x.trim())) moi.positifs[d] = l;
  else delete moi.positifs[d];
  enregistrerMoi();
}

function dessinerPositifs() {
  const auj = aujourdhui();

  // Les 3 cases du jour (on les remplit à la main, sans rien valider)
  const zone = document.getElementById("positifs-du-jour");
  if (!zone.contains(document.activeElement)) {
    zone.replaceChildren(...INVITES_POSITIFS.map(([emoji, invite], i) => {
      const l = el("label", "ligne-positif");
      l.append(el("span", "emoji-positif", emoji));
      const t = el("textarea");
      t.rows = 1;
      t.placeholder = invite;
      t.value = positifsDu(auj)[i];
      const ajuster = () => { t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; };
      t.addEventListener("input", () => { changerPositif(auj, i, t.value); ajuster(); dessinerStatsPositifs(); });
      t.addEventListener("blur", () => afficher());
      setTimeout(ajuster);
      l.append(t);
      return l;
    }));
  }
  dessinerStatsPositifs();
  dessinerCalendrierPositifs();
}

function dessinerStatsPositifs() {
  const annee = aujourdhui().slice(0, 4);
  const jours = Object.keys(moi.positifs).filter((d) => d.startsWith(annee) && nbPositifs(d));
  const total = jours.reduce((t, d) => t + nbPositifs(d), 0);
  const carte = document.getElementById("stats-positifs");
  carte.replaceChildren();
  const haut = el("div", "deux-totaux");
  const a = el("div"); a.append(el("span", "petit", `Jours remplis en ${annee}`), el("strong", "", String(jours.length)));
  const b = el("div"); b.append(el("span", "petit", "Choses positives"), el("strong", "", String(total)));
  haut.append(a, b);
  carte.append(haut);

  // Il y a un an aujourd'hui
  const ilYAUnAn = `${Number(annee) - 1}${aujourdhui().slice(4)}`;
  if (nbPositifs(ilYAUnAn)) {
    const s = el("button", "souvenir");
    s.append(el("span", "petit", "Il y a un an aujourd'hui"), el("span", "", positifsDu(ilYAUnAn).filter(Boolean).join(" · ")));
    s.addEventListener("click", () => ouvrirJourPositifs(ilYAUnAn));
    carte.append(s);
  }

  // Un souvenir au hasard
  const passes = Object.keys(moi.positifs).filter((d) => d < aujourdhui() && nbPositifs(d));
  if (passes.length) {
    const b2 = el("button", "btn-secondaire bouton-souvenir", "🎲 Un souvenir au hasard");
    b2.addEventListener("click", () => {
      const d = passes[Math.floor(Math.random() * passes.length)];
      const choix = positifsDu(d).filter((x) => x.trim());
      const zone = document.getElementById("souvenir-hasard");
      zone.replaceChildren(el("span", "petit", jolieDate(d)), el("span", "", choix[Math.floor(Math.random() * choix.length)]));
      zone.hidden = false;
      zone.onclick = () => ouvrirJourPositifs(d);
    });
    carte.append(b2);
  }
}

function dessinerCalendrierPositifs() {
  document.getElementById("titre-mois-positifs").textContent = nomMois(moisPositifs);
  const grille = document.getElementById("calendrier-positifs");
  grille.replaceChildren();
  for (const l of ["L", "M", "M", "J", "V", "S", "D"]) grille.append(el("span", "entete-cal", l));
  const decalage = (versDate(moisPositifs + "-01").getDay() + 6) % 7;
  for (let i = 0; i < decalage; i++) grille.append(el("span"));
  const [a, m] = moisPositifs.split("-").map(Number);
  const auj = aujourdhui();
  for (let n = 1; n <= new Date(a, m, 0).getDate(); n++) {
    const d = `${moisPositifs}-${String(n).padStart(2, "0")}`;
    const nb = nbPositifs(d);
    const c = el("button", "case-cal" + (d === auj ? " auj" : ""));
    const num = el("span", "num-cal" + (nb ? " positif-" + nb : ""), String(n));
    const marques = el("span", "marques-cal", nb ? "✨" : "");
    c.append(num, marques);
    c.disabled = d > auj;
    c.addEventListener("click", () => ouvrirJourPositifs(d));
    grille.append(c);
  }
}
document.getElementById("mois-positifs-prec").addEventListener("click", () => { moisPositifs = decalerMois(moisPositifs, -1); dessinerCalendrierPositifs(); });
document.getElementById("mois-positifs-suiv").addEventListener("click", () => { moisPositifs = decalerMois(moisPositifs, 1); dessinerCalendrierPositifs(); });

// La feuille d'un jour : relire (et compléter) ses 3 positifs
const fenPositifs = document.getElementById("fenetre-positifs");
const formPositifs = document.getElementById("form-positifs");
let jourPositifs = null;
function ouvrirJourPositifs(d) {
  jourPositifs = d;
  document.getElementById("titre-positifs").textContent = d === aujourdhui() ? "Aujourd'hui" : jolieDate(d);
  INVITES_POSITIFS.forEach(([, invite], i) => {
    const t = formPositifs.elements["p" + i];
    t.placeholder = invite;
    t.value = positifsDu(d)[i];
  });
  fenPositifs.showModal();
}
formPositifs.addEventListener("submit", () => {
  INVITES_POSITIFS.forEach((_, i) => changerPositif(jourPositifs, i, formPositifs.elements["p" + i].value.trim()));
  afficher();
});

// ---------- 2. Culture G ----------
let decalageInfo = 0;
const ageEnJours = (d) => diffJoursSimple(d, aujourdhui());
function diffJoursSimple(a, b) { return Math.round((versDate(b) - versDate(a)) / 86400000); }

function dessinerCulture() {
  // Le savais-tu ?
  const index = (Math.floor(versDate(aujourdhui()).getTime() / 86400000) + decalageInfo) % SAVAIS_TU.length;
  const carte = document.getElementById("carte-savais-tu");
  carte.replaceChildren(el("div", "etiquette etiquette-moi", "Le savais-tu ?"), el("p", "texte-conseil", SAVAIS_TU[index]));
  const boutons = el("div", "boutons");
  const garde = moi.infosGardees.includes(index);
  const g = el("button", garde ? "btn-secondaire" : "btn-principal btn-violet", garde ? "♥ Gardée" : "♡ Je la garde");
  g.addEventListener("click", () => {
    moi.infosGardees = garde ? moi.infosGardees.filter((i) => i !== index) : [...moi.infosGardees, index];
    enregistrerMoi();
    afficher();
  });
  const autre = el("button", "btn-secondaire", "Une autre");
  autre.addEventListener("click", () => { decalageInfo++; afficher(); });
  boutons.append(g, autre);
  carte.append(boutons);

  // Tu te souviens ? (7 jours puis 30 jours après)
  const aRevoir = moi.appris.filter((x) => (ageEnJours(x.date) >= 7 && !x.r7) || (ageEnJours(x.date) >= 30 && !x.r30));
  const zoneR = document.getElementById("tu-te-souviens");
  zoneR.replaceChildren();
  zoneR.hidden = !aRevoir.length;
  if (aRevoir.length) {
    const x = aRevoir[0];
    const etape = ageEnJours(x.date) >= 30 && !x.r30 ? "r30" : "r7";
    zoneR.append(el("div", "etiquette etiquette-moi", `Tu te souviens ? · appris il y a ${ageEnJours(x.date)} jours`));
    zoneR.append(el("p", "texte-defi", x.texte));
    if (x.source) zoneR.append(el("p", "petit", x.source));
    const ok = el("button", "btn-principal btn-violet", "✓ Je m'en souviens");
    const relis = el("button", "btn-secondaire", "😅 Je relis");
    for (const b of [ok, relis]) b.addEventListener("click", () => {
      x[etape] = true;
      if (etape === "r30") x.r7 = true;
      enregistrerMoi();
      afficher();
    });
    const bb = el("div", "boutons");
    bb.append(ok, relis);
    zoneR.append(bb);
    if (aRevoir.length > 1) zoneR.append(el("p", "petit", `Encore ${aRevoir.length - 1} à revoir après.`));
  }

  // Mon carnet
  const ul = document.getElementById("liste-appris");
  const liste = [...moi.appris].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  ul.replaceChildren(...liste.map((x) => {
    const li = el("li");
    const infos = el("div", "infos");
    infos.append(el("div", "t", x.texte), el("div", "m", [jolieDate(x.date), x.source].filter(Boolean).join(" · ")));
    const sup = el("button", "btn-texte", "×");
    sup.setAttribute("aria-label", "Supprimer");
    sup.addEventListener("click", () => {
      if (!confirm("Supprimer cette note ?")) return;
      moi.appris = moi.appris.filter((y) => y.id !== x.id);
      enregistrerMoi();
      afficher();
    });
    li.append(infos, sup);
    return li;
  }));
  if (!liste.length) ul.append(el("li", "vide-msg", "Ce que tu apprends s'affichera ici."));
  document.getElementById("resume-appris").textContent = `Mon carnet · ${liste.length}`;

  // Mes infos gardées
  const ulG = document.getElementById("liste-infos-gardees");
  ulG.replaceChildren(...moi.infosGardees.map((i) => {
    const li = el("li");
    const infos = el("div", "infos");
    infos.append(el("div", "t", SAVAIS_TU[i]));
    li.append(infos);
    return li;
  }));
  document.getElementById("details-infos-gardees").hidden = !moi.infosGardees.length;
}

document.getElementById("form-appris").addEventListener("submit", (e) => {
  e.preventDefault();
  const texte = document.getElementById("champ-appris").value.trim();
  if (!texte) return;
  moi.appris.push({
    id: nouvelId(), date: aujourdhui(), texte,
    source: document.getElementById("source-appris").value.trim(), r7: false, r30: false,
  });
  enregistrerMoi();
  document.getElementById("champ-appris").value = "";
  document.getElementById("source-appris").value = "";
  afficher();
  if (typeof montrerToast === "function") montrerToast("Noté ✓ Je te le redemande dans 7 jours");
});

// ---------- 3. La carte du soir sur Aujourd'hui ----------
function afficherRappelPositifs() {
  const b = document.getElementById("rappel-positifs");
  const n = nbPositifs(aujourdhui());
  b.hidden = !(new Date().getHours() >= 19 && n < 3);
  b.replaceChildren(
    el("span", "emoji-positif", "✨"),
    el("span", "", n ? `Encore ${3 - n} positif${3 - n > 1 ? "s" : ""} à noter aujourd'hui` : "Tes 3 positifs du jour : touche pour les noter"),
  );
}
document.getElementById("rappel-positifs").addEventListener("click", () => {
  allerA("moi");
  changerSousMoi("positifs");
});

for (const fen of [fenPositifs]) {
  fen.querySelector("[data-fermer]").addEventListener("click", () => fen.close());
  fen.addEventListener("click", (e) => { if (e.target === fen) fen.close(); });
}

// ---------- 4. Brancher ----------
const afficherSansPositifs = afficher;
afficher = function () {
  afficherSansPositifs();
  if (vueActive === "moi" && sousMoi === "positifs") dessinerPositifs();
  if (vueActive === "moi" && sousMoi === "culture") dessinerCulture();
  if (vueActive === "aujourdhui") afficherRappelPositifs();
};
afficher();
