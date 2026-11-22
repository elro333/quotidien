// ============================================================
// sauvegarde.js — sauvegarder et restaurer toutes les données
//
// Les données de l'appli vivent dans le téléphone (localStorage).
// Si on supprime l'icône, elles disparaissent. La sauvegarde les
// met dans un fichier .json que tu ranges où tu veux (iCloud Drive…),
// et la restauration les remet dans l'appli.
// ============================================================

const CLE_DERNIERE = "quotidien.derniereSauvegarde";
const JOURS_AVANT_RAPPEL = 7;

const fenReglages = document.getElementById("fenetre-reglages");
const fichierRestaurer = document.getElementById("fichier-restaurer");

function lireDerniere() {
  try { return localStorage.getItem(CLE_DERNIERE); } catch (e) { return null; }
}

// Ce qu'on met dans le fichier : tout, avec une étiquette pour le reconnaître
function contenuSauvegarde() {
  return {
    appli: "TODOS",
    version: 1,
    creeLe: new Date().toISOString(),
    taches,
    budget,
    forme,
    corbeille,
    moi,
  };
}

async function sauvegarder() {
  const texte = JSON.stringify(contenuSauvegarde(), null, 2);
  const nom = `TODOS-sauvegarde-${aujourdhui()}.json`;
  const fichier = new File([texte], nom, { type: "application/json" });

  try {
    // Sur iPhone : la feuille de partage d'Apple → « Enregistrer dans Fichiers »
    if (navigator.canShare?.({ files: [fichier] })) {
      await navigator.share({ files: [fichier], title: nom });
    } else {
      // Sur ordinateur : un téléchargement classique
      const lien = document.createElement("a");
      lien.href = URL.createObjectURL(fichier);
      lien.download = nom;
      lien.click();
      setTimeout(() => URL.revokeObjectURL(lien.href), 2000);
    }
  } catch (e) {
    if (e.name === "AbortError") return; // tu as fermé la feuille de partage : rien n'est enregistré
    alert("La sauvegarde n'a pas marché : " + e.message);
    return;
  }

  try { localStorage.setItem(CLE_DERNIERE, new Date().toISOString()); } catch (e) {}
  majInfos();
}

function restaurer(fichier) {
  const lecteur = new FileReader();
  lecteur.onload = () => {
    let donnees;
    try {
      donnees = JSON.parse(lecteur.result);
    } catch (e) {
      alert("Ce fichier n'est pas une sauvegarde TODOS.");
      return;
    }
    // On vérifie que c'est bien une sauvegarde de cette appli
    if (donnees?.appli !== "TODOS" || !Array.isArray(donnees.taches) || !donnees.budget) {
      alert("Ce fichier n'est pas une sauvegarde TODOS.");
      return;
    }
    const nbT = donnees.taches.length;
    const nbM = donnees.budget.mouvements?.length || 0;
    const date = new Date(donnees.creeLe).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    if (!confirm(`Restaurer la sauvegarde du ${date} ?\n${nbT} tâche(s), ${nbM} mouvement(s) d'argent, ${donnees.forme?.seances?.length || 0} séance(s) de sport.\n\nCe qu'il y a dans l'appli maintenant sera remplacé.`)) return;

    taches = donnees.taches;
    budget = { mouvements: donnees.budget.mouvements || [], dettes: donnees.budget.dettes || [] };
    forme = normaliserForme(donnees.forme); // une ancienne sauvegarde n'a pas de « forme » : on part de zéro
    enregistrer();
    enregistrerBudget();
    enregistrerForme();
    corbeille = Array.isArray(donnees.corbeille) ? donnees.corbeille : [];
    moi = normaliserMoi(donnees.moi);
    if (typeof brancherMesIngredients === "function") brancherMesIngredients();
    enregistrerMoi();
    enregistrerCorbeille();
    fenReglages.close();
    afficher();
    alert("C'est restauré ✓");
  };
  lecteur.readAsText(fichier);
}

// ---------- Textes d'information et rappel ----------
function joursDepuis(iso) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function majInfos() {
  const derniere = lireDerniere();
  document.getElementById("info-sauvegarde").textContent = derniere
    ? `Dernière sauvegarde : ${new Date(derniere).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}. Range le fichier dans iCloud Drive pour le retrouver même si tu changes de téléphone.`
    : "Aucune sauvegarde pour l'instant. Choisis « Enregistrer dans Fichiers », puis iCloud Drive.";

  // Le rappel sur Aujourd'hui : seulement s'il y a des données à protéger
  const rappel = document.getElementById("rappel-sauvegarde");
  const aDesDonnees = taches.length || budget.mouvements.length || forme.seances.length || forme.poids.length || Object.keys(forme.pas).length;
  const enRetard = !derniere || joursDepuis(derniere) >= JOURS_AVANT_RAPPEL;
  rappel.hidden = !(aDesDonnees && enRetard && vueActive === "aujourdhui");
  rappel.textContent = derniere
    ? `☁️ Dernière sauvegarde il y a ${joursDepuis(derniere)} jours. Sauvegarder maintenant`
    : "☁️ Tes données ne sont pas encore sauvegardées. Sauvegarder maintenant";
}

function ouvrirReglages() {
  majInfos();
  fenReglages.showModal();
}

document.getElementById("btn-reglages").addEventListener("click", ouvrirReglages);
document.getElementById("rappel-sauvegarde").addEventListener("click", ouvrirReglages);
document.getElementById("btn-sauvegarder").addEventListener("click", sauvegarder);
document.getElementById("btn-restaurer").addEventListener("click", () => fichierRestaurer.click());
fichierRestaurer.addEventListener("change", () => {
  if (fichierRestaurer.files[0]) restaurer(fichierRestaurer.files[0]);
  fichierRestaurer.value = ""; // pour pouvoir choisir deux fois le même fichier
});
fenReglages.addEventListener("click", (e) => { if (e.target === fenReglages) fenReglages.close(); });

// Le rappel se met à jour à chaque fois que l'écran est redessiné
const afficherSansRappel = afficher;
afficher = function () {
  afficherSansRappel();
  majInfos();
};

// Demande au téléphone de ne pas effacer nos données pour faire de la place
navigator.storage?.persist?.().catch(() => {});

majInfos();
