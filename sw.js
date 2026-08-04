/* ============================================================
 * 77 记账喽 · Service Worker
 * 让 PWA 可安装（Android "添加到主屏幕" / 安装应用）+ 离线可用
 *
 * 缓存策略：
 *  - 核心静态资源（index.html / manifest / 图标）：安装时预缓存，缓存优先
 *  - 页面导航：网络优先，在线时总是拿到最新版，断网时回退到缓存
 *  - Google 字体（跨域）：运行时缓存，失败静默不影响页面
 *
 * 更新方式：改了核心资源内容后，把下面 CACHE 的版本号 +1（如 bk-v2），
 * 旧的缓存会在 activate 时被自动清理。
 * ============================================================ */
const CACHE = 'bk-v1';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-32.png',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './icon-1024.png',
  './icon.ico'
];

/* 安装：预缓存核心资源；跳过等待让新版 SW 立刻生效 */
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

/* 激活：清理旧版本缓存；立即接管所有已打开的页面 */
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return; // 只处理 GET

  const url = new URL(req.url);

  /* ---- 同源请求 ---- */
  if (url.origin === location.origin) {
    /* 页面导航：网络优先，在线更新到最新版；断网回退缓存 */
    if (req.mode === 'navigate') {
      e.respondWith(
        fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put('./index.html', copy));
            return res;
          })
          .catch(() => caches.match('./index.html'))
      );
      return;
    }

    /* 静态资源：缓存优先，命中直接返回；未命中走网络并顺手入缓存 */
    e.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        });
      })
    );
    return;
  }

  /* ---- 跨域：Google 字体，缓存优先 + 失败静默（国内访问不到也不影响页面） ---- */
  if (/fonts\.(googleapis|gstatic)\.com/.test(url.host)) {
    e.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          })
          .catch(() => undefined); // 拿不到就交给浏览器默认处理，不报错
      })
    );
  }
});
