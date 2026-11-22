// sw.js â€” le "service worker" : il garde une copie de l'appli
// pour qu'elle s'ouvre sans rÃ©seau.
// Ã€ chaque nouvelle version de l'appli, on change le numÃ©ro ci-dessous
// pour que l'iPhone tÃ©lÃ©charge les nouveaux fichiers.
const VERSION = "quotidien-v24";
const FICHIERS = ["./", "index.html", "style.css", "app.js", "budget.js", "forme.js", "cycle.js", "recettes.js", "alimentation.js", "moi.js", "positifs.js", "accueil.js", "dire.js", "sauvegarde.js", "manifest.json", "icons/icon-180.png", "icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FICHIERS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((cles) => Promise.all(cles.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// RÃ©seau d'abord (pour avoir la derniÃ¨re version), copie locale si pas de rÃ©seau.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((rep) => {
        const copie = rep.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copie));
        return rep;
      })
      .catch(() => caches.match(e.request))
  );
});
