// sw.js — le "service worker" : il garde une copie de l'appli
// pour qu'elle s'ouvre sans réseau.
// À chaque nouvelle version de l'appli, on change le numéro ci-dessous
// pour que l'iPhone télécharge les nouveaux fichiers.
const VERSION = "quotidien-v3";
const FICHIERS = ["./", "index.html", "style.css", "app.js", "manifest.json", "icons/icon-180.png", "icons/icon-512.png"];

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

// Réseau d'abord (pour avoir la dernière version), copie locale si pas de réseau.
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
