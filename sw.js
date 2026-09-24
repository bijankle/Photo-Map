/* PhotoMap Field service worker.
   Exists ONLY to receive photos shared from other apps (the Android share sheet hands
   original files WITH their GPS intact, unlike the file picker, which strips it).
   It never caches the app itself — every normal request goes straight to the network,
   so the self-updating page keeps working exactly as before. */
self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method === "POST" && u.pathname.endsWith("/share-target")) {
    e.respondWith((async () => {
      try {
        const fd = await e.request.formData();
        const files = fd.getAll("photos").filter(f => f && f.size);
        const cache = await caches.open("pm-shared");
        await cache.put("meta", new Response(JSON.stringify(files.map(f => ({ n: f.name, t: f.type })))));
        for (let i = 0; i < files.length; i++) await cache.put("file-" + i, new Response(files[i]));
        return Response.redirect("./Photo-Map.html?shared=" + files.length, 303);
      } catch (err) {
        return Response.redirect("./Photo-Map.html?shared=err", 303);
      }
    })());
  }
});
