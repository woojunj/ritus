// ritus 서비스 워커. 한 번 연 뒤에는 네트워크 없이도 앱이 열리게 한다.
// 데이터는 모두 브라우저 저장소에 있으므로, 여기서는 화면을 그리는 파일만 보관한다.

const CACHE = "ritus-v1";
const PAGES = ["/", "/timer", "/memo", "/todos", "/conscience", "/help"];
const FILES = ["/manifest.webmanifest", "/icon-192.png", "/icon-512.png", "/apple-icon.png"];
const STATIC_ASSET = /\/_next\/static\/[^"'\s)\\]+/g;

// 설치할 때 모든 화면과, 그 화면이 쓰는 스크립트·스타일·글꼴을 받아 둔다.
// 한 번도 열지 않은 화면도 오프라인에서 열리게 하기 위해서다.
async function precache() {
  const cache = await caches.open(CACHE);
  await Promise.all(
    PAGES.map(async (path) => {
      const response = await fetch(path, { cache: "reload" });
      if (!response.ok) return;
      const html = await response.clone().text();
      await cache.put(path, response);
      const assets = new Set(html.match(STATIC_ASSET) ?? []);
      await Promise.all([...assets].map((asset) => cache.add(asset).catch(() => {})));
    })
  );
  await Promise.all(FILES.map((file) => cache.add(file).catch(() => {})));
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

// 온라인이면 늘 새 화면을 받고 보관해 둔다. 오프라인이면 보관해 둔 화면을 낸다.
async function networkFirst(request, key) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(key, response.clone());
    return response;
  } catch (error) {
    const cached = (await cache.match(key)) ?? (await cache.match("/"));
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // 파일 이름에 내용의 해시가 들어 있어 한 번 받은 것은 바뀌지 않는다.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 화면 사이를 옮길 때 받는 데이터(RSC)는 네트워크에 맡긴다. 오프라인이면
  // Next.js가 그 주소로 새로 열고, 그 요청은 아래에서 보관해 둔 화면으로 답한다.
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, url.pathname));
    return;
  }

  if (FILES.includes(url.pathname)) {
    event.respondWith(networkFirst(request, url.pathname));
  }
});
