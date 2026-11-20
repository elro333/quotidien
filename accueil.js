// ============================================================
// accueil.js — « Bonjour » selon l'heure, et une phrase par jour
//
// Le prénom est réglé dans l'appli (Réglages « … ») et rangé avec
// tes données : il n'est jamais écrit dans le code.
// ============================================================

// Une phrase par jour : la même toute la journée, une autre demain.
const PHRASES = [
  "Une petite tâche faite vaut mieux qu'une grande tâche rêvée.",
  "Tu n'as pas besoin d'être prête pour commencer. Commence, et tu seras prête.",
  "Le progrès compte plus que la perfection.",
  "Ce que tu fais chaque jour compte plus que ce que tu fais de temps en temps.",
  "Tu as déjà réussi des choses difficiles. Celle-ci aussi, tu peux.",
  "Avance, même lentement : tu dépasses tous ceux qui restent sur place.",
  "La confiance vient en faisant, pas en attendant.",
  "Une journée à la fois. Une tâche à la fois.",
  "Sois fière du chemin parcouru, pas seulement de la destination.",
  "Le courage, ce n'est pas l'absence de peur : c'est d'y aller quand même.",
  "Dix minutes maintenant valent mieux qu'une heure « plus tard ».",
  "Tu n'es pas en retard : tu es sur ton propre chemin.",
  "Prends soin de toi : c'est toi qui portes tout le reste.",
  "Une erreur n'est pas un échec, c'est une leçon déguisée.",
  "Ce qui te semble dur aujourd'hui sera ta force demain.",
  "Fais de ton mieux avec ce que tu as, là où tu es.",
  "La discipline, c'est se souvenir de ce que l'on veut vraiment.",
  "Ose parler : ta voix mérite d'être entendue.",
  "Tu n'as pas à tout faire aujourd'hui. Juste la prochaine chose.",
  "Le repos fait partie du travail.",
  "Chaque « non » à une distraction est un « oui » à tes objectifs.",
  "Tu es plus capable que ce que ta petite voix te raconte.",
  "Commence là où tu es. Utilise ce que tu as. Fais ce que tu peux.",
  "Les grandes choses se construisent avec de petits jours ordinaires.",
  "Sois aussi gentille avec toi-même qu'avec tes amis.",
  "Ton futur toi te remerciera pour ce que tu fais aujourd'hui.",
  "La motivation te lance, l'habitude te fait avancer.",
  "Respire. Tu gères plus que tu ne le crois.",
  "Rien ne change si rien ne change.",
  "Célèbre les petites victoires : elles font les grandes.",
  "Le doute disparaît quand l'action commence.",
  "Ce n'est pas grave d'aller doucement. C'est grave de s'arrêter.",
  "Tu mérites la place que tu prends.",
  "Fais-le pour la femme que tu es en train de devenir.",
  "Aujourd'hui est une bonne journée pour être fière de toi.",
  "L'éloquence s'apprend : chaque prise de parole t'entraîne.",
  "Range une chose, finis une chose, souris une fois. C'est déjà une belle journée.",
  "La comparaison vole la joie. Regarde ton propre progrès.",
  "Le meilleur moment pour commencer était hier. Le deuxième, c'est maintenant.",
  "Tu as le droit d'être fatiguée. Tu as aussi le droit d'être fière.",
];

function phraseDuJour() {
  const jour = Math.floor(versDate(aujourdhui()).getTime() / 86400000);
  return PHRASES[jour % PHRASES.length];
}

// Bonjour / Bonsoir / Bonne nuit, selon l'heure
function salutation() {
  const h = new Date().getHours();
  const mot = h >= 5 && h < 18 ? "Bonjour" : h >= 18 && h < 23 ? "Bonsoir" : "Bonne nuit";
  const prenom = (forme.profil.prenom || "").trim();
  return prenom ? `${mot} ${prenom}` : mot;
}

// Sur Aujourd'hui, le grand titre devient « Bonjour Prénom »
const afficherSansAccueil = afficher;
afficher = function () {
  afficherSansAccueil();
  document.getElementById("titre").classList.toggle("titre-salut", vueActive === "aujourdhui");
  if (vueActive === "aujourdhui") {
    const titre = salutation();
    document.getElementById("titre").textContent = titre;
    document.getElementById("phrase-du-jour").textContent = "✨ " + phraseDuJour();
  }
};

// Le champ « Ton prénom » dans les Réglages
const champPrenom = document.getElementById("champ-prenom");
document.getElementById("btn-reglages").addEventListener("click", () => {
  champPrenom.value = forme.profil.prenom || "";
});
champPrenom.addEventListener("change", () => {
  forme.profil.prenom = champPrenom.value.trim();
  enregistrerForme();
  afficher();
});

// Si l'appli reste ouverte, le « Bonjour » devient « Bonsoir » tout seul
document.addEventListener("visibilitychange", () => { if (!document.hidden) afficher(); });

afficher();
