// ============================================================
// calendrier.js — « Ajouter au Calendrier » (Calendrier d'Apple)
//
// L'appli ne peut pas envoyer de notification toute seule.
// Mais elle peut fabriquer un petit fichier d'événement (.ics)
// que l'iPhone ajoute à son Calendrier, AVEC une alarme :
// c'est le Calendrier qui te prévient à l'heure.
// ============================================================

const RRULES = {
  jour: "FREQ=DAILY",
  ouvres: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
  semaine: "FREQ=WEEKLY",
  "deux-semaines": "FREQ=WEEKLY;INTERVAL=2",
  mois: "FREQ=MONTHLY",
};
const JOURS_ICS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

// Les virgules, points-virgules et retours à la ligne doivent être « échappés »
const echapperIcs = (s) => String(s || "").replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
const dateIcs = (d) => d.replace(/-/g, "");
const heureIcs = (h) => h.replace(":", "") + "00";

function fichierIcs(t) {
  const maintenant = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const l = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//TODOS//FR", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    `UID:${t.id}@todos`, `DTSTAMP:${maintenant}`];
  if (t.heure) {
    // Avec une heure : de l'heure de début à la fin (ou 1 h plus tard)
    let fin = t.heureFin, dateFin = t.date;
    if (!fin) {
      const [h, m] = t.heure.split(":").map(Number);
      fin = `${String(Math.min(h + 1, 23)).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    } else if (fin <= t.heure) {
      dateFin = ajouterJours(t.date, 1); // mission qui finit le lendemain
    }
    l.push(`DTSTART:${dateIcs(t.date)}T${heureIcs(t.heure)}`, `DTEND:${dateIcs(dateFin)}T${heureIcs(fin)}`);
  } else {
    // Sans heure : toute la journée
    l.push(`DTSTART;VALUE=DATE:${dateIcs(t.date)}`, `DTEND;VALUE=DATE:${dateIcs(ajouterJours(t.date, 1))}`);
  }
  l.push(`SUMMARY:${echapperIcs((t.important ? "★ " : "") + t.titre)}`);
  if (t.note) l.push(`DESCRIPTION:${echapperIcs(t.note)}`);
  if (t.repete === "jours" && t.jours?.length) l.push(`RRULE:FREQ=WEEKLY;BYDAY=${t.jours.map((j) => JOURS_ICS[j]).join(",")}`);
  else if (RRULES[t.repete]) l.push(`RRULE:${RRULES[t.repete]}`);
  // L'alarme : 30 min avant (ou à 9 h le jour même pour une journée entière)
  l.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${echapperIcs(t.titre)}`,
    t.heure ? "TRIGGER:-PT30M" : "TRIGGER:PT9H", "END:VALARM", "END:VEVENT", "END:VCALENDAR");
  return l.join("\r\n") + "\r\n";
}

async function ajouterAuCalendrier(t) {
  if (!t?.date) { alert("Mets d'abord une date à cette tâche."); return; }
  const texte = fichierIcs(t);
  const fichier = new File([texte], "TODOS-evenement.ics", { type: "text/calendar" });
  // Sur iPhone, on ouvre le fichier : iOS propose « Ajouter au Calendrier »
  const lien = document.createElement("a");
  lien.href = URL.createObjectURL(fichier);
  lien.target = "_blank";
  lien.rel = "noopener";
  try {
    lien.click();
  } catch (e) {
    if (navigator.canShare?.({ files: [fichier] })) await navigator.share({ files: [fichier] }).catch(() => {});
  }
  setTimeout(() => URL.revokeObjectURL(lien.href), 60000);
}

document.getElementById("btn-calendrier").addEventListener("click", () => {
  // La tâche ouverte dans la fiche, avec ce qui est écrit à l'écran (même pas encore enregistré)
  const f = formulaire;
  const t = {
    ...(enEdition || {}), id: enEdition?.id || nouvelId(),
    titre: f.titre.value.trim() || "Tâche", date: f.date.value, heure: f.heure.value,
    heureFin: f.heureFin?.value || "", note: f.note.value.trim(), repete: f.repete.value,
    jours: f.repete.value === "jours" ? [...joursChoisis] : [], important: f.important.checked,
  };
  ajouterAuCalendrier(t);
});
