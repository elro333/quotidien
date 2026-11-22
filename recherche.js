// ============================================================
// recherche.js — chercher partout, depuis Aujourd'hui
// Tâches, argent, recettes, à lire / à voir, positifs, culture G,
// habitudes, séances, notes du cycle. Toucher un résultat l'ouvre.
// ============================================================

const champRecherche = document.getElementById("champ-recherche");
const zoneResultats = document.getElementById("resultats-recherche");
const normal = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function chercher(q) {
  const mots = normal(q).split(/\s+/).filter(Boolean);
  const trouve = (...textes) => { const t = normal(textes.join(" ")); return mots.every((m) => t.includes(m)); };
  const res = []; // { groupe, emoji, titre, detail, date, ouvrir }

  for (const t of taches) if (trouve(t.titre, t.note)) res.push({
    groupe: "Agenda", emoji: t.fait ? "✅" : t.important ? "★" : "📅", titre: t.titre,
    detail: [t.date && jolieDate(t.date), CATEGORIES[t.cat]?.nom, t.fait && "faite"].filter(Boolean).join(" · "),
    date: t.date || "", ouvrir: () => ouvrirFenetre(t),
  });
  for (const m of budget.mouvements) {
    const c = catDe(m);
    if (trouve(m.libelle, c.nom)) res.push({
      groupe: "Budget", emoji: c.emoji, titre: m.libelle || c.nom,
      detail: `${m.type === "revenu" ? "+" : "−"}${euros(m.montant)} · ${jolieDate(m.date)}`, date: m.date,
      ouvrir: () => { moisAffiche = moisDe(m.date); allerA("budget"); ouvrirMouvement(m); },
    });
  }
  if (typeof toutesRecettes === "function") for (const r of toutesRecettes()) {
    if (trouve(r.nom, ...(r.ingredients || []).map(nomIngr), ...(r.autres || []))) res.push({
      groupe: "Recettes", emoji: r.emoji || "🍽", titre: r.nom, detail: `${r.minutes ? r.minutes + " min · " : ""}${r.kcal ? "≈ " + r.kcal + " kcal" : ""}`,
      date: "", ouvrir: () => { allerA("forme"); changerSousForme("alim"); ouvrirRecette(r); },
    });
  }
  if (typeof moi !== "undefined") {
    for (const x of moi.envies) if (trouve(x.titre, x.auteur)) res.push({
      groupe: "À lire / à voir", emoji: TYPES_ENVIES[x.type]?.emoji || "📚", titre: x.titre, detail: x.auteur || "",
      date: "", ouvrir: () => { allerA("moi"); changerSousMoi("envies"); ouvrirEnvie(x); },
    });
    for (const [d, liste] of Object.entries(moi.positifs)) for (const p of liste) if (p.trim() && trouve(p)) res.push({
      groupe: "Positifs", emoji: "✨", titre: p, detail: jolieDate(d), date: d,
      ouvrir: () => { allerA("moi"); changerSousMoi("positifs"); ouvrirJourPositifs(d); },
    });
    for (const a of moi.appris) if (trouve(a.texte, a.source)) res.push({
      groupe: "Culture G", emoji: "🧠", titre: a.texte, detail: [jolieDate(a.date), a.source].filter(Boolean).join(" · "), date: a.date,
      ouvrir: () => { allerA("moi"); changerSousMoi("culture"); },
    });
    for (const h of moi.habitudes) if (trouve(h.nom)) res.push({
      groupe: "Habitudes", emoji: h.emoji, titre: h.nom, detail: "", date: "",
      ouvrir: () => { allerA("moi"); changerSousMoi("habitudes"); },
    });
  }
  for (const s of forme.seances) if (trouve(sportDe(s).nom, s.note)) res.push({
    groupe: "Sport", emoji: sportDe(s).emoji, titre: sportDe(s).nom + (s.note ? ` · ${s.note}` : ""), detail: `${s.minutes} min · ${jolieDate(s.date)}`, date: s.date,
    ouvrir: () => { allerA("forme"); changerSousForme("activite"); ouvrirForme("seance", { seance: s }); },
  });
  for (const [d, j] of Object.entries(forme.cycle.jours)) if (j.note && trouve(j.note)) res.push({
    groupe: "Cycle", emoji: "🌸", titre: j.note, detail: jolieDate(d), date: d,
    ouvrir: () => { allerA("forme"); changerSousForme("cycle"); ouvrirJourCycle(d); },
  });
  return res;
}

function afficherResultats() {
  const q = champRecherche.value.trim();
  const section = document.getElementById("vue-aujourdhui");
  section.classList.toggle("en-recherche", !!q);
  zoneResultats.hidden = !q;
  zoneResultats.replaceChildren();
  if (!q) return;
  const res = chercher(q);
  if (!res.length) {
    zoneResultats.append(el("p", "vide-msg", "Rien trouvé."));
    return;
  }
  // Rangés par groupe, les plus récents d'abord
  const groupes = {};
  for (const r of res) (groupes[r.groupe] ||= []).push(r);
  for (const [nom, liste] of Object.entries(groupes)) {
    zoneResultats.append(el("h3", "jour-mvt titre-resultats", `${nom} · ${liste.length}`));
    const ul = el("ul", "liste verre");
    for (const r of liste.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20)) {
      const li = el("li", "ligne-mvt");
      li.append(el("span", "emoji-resultat", r.emoji));
      const infos = el("div", "infos");
      infos.append(el("div", "t", r.titre));
      if (r.detail) infos.append(el("div", "m", r.detail));
      li.append(infos);
      li.addEventListener("click", () => { champRecherche.blur(); r.ouvrir(); });
      ul.append(li);
    }
    zoneResultats.append(ul);
  }
}
champRecherche.addEventListener("input", afficherResultats);
document.getElementById("effacer-recherche").addEventListener("click", () => {
  champRecherche.value = "";
  afficherResultats();
});
