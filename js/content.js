(function () {
  'use strict';

  var BENTO = [
    { span: 'col-span-2 row-span-2 md:col-span-3 lg:col-span-5', pos: 'object-[50%_25%]', title: 'text-[2rem] sm:text-[2.5rem] lg:text-[3rem] leading-[1]' },
    { span: 'col-span-1 md:col-span-3 md:row-span-2 lg:col-span-4', pos: 'object-[50%_25%]', title: 'text-[1.35rem] sm:text-[2.5rem] lg:text-[2.75rem] leading-[1]' },
    { span: 'col-span-1 md:col-span-2 lg:col-span-3', pos: 'object-[50%_35%]', title: 'text-[1.35rem] sm:text-[1.75rem] lg:text-[1.9rem] leading-[1.05]' },
    { span: 'col-span-1 md:col-span-2 lg:col-span-3', pos: 'object-[50%_45%]', title: 'text-[1.35rem] sm:text-[1.75rem] lg:text-[1.9rem] leading-[1.05]' },
    { span: 'col-span-1 md:col-span-2 lg:col-span-7', pos: 'object-[50%_42%]', title: 'text-[1.35rem] sm:text-[1.75rem] lg:text-[2.25rem] leading-[1.05]' },
    { span: 'col-span-2 md:col-span-6 lg:col-span-5', pos: 'object-[50%_55%]', title: 'text-[1.6rem] sm:text-[1.9rem] lg:text-[2.25rem] leading-[1.05]' }
  ];
  var ARROW_PAIR = '<i data-lucide="arrow-up-right" class="w-4 h-4"></i><i data-lucide="arrow-up-right" class="w-4 h-4"></i>';

  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  var DEFAULT_THUMB = 'images/AdobeStock_317116275_1_0.png.jpg';
  var RAW_GH_BASE = '';
  var isGhPages = /\.github\.io$/i.test(location.hostname);

  function esc(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function safeAsset(url, fallback) {
    url = String(url || '');
    if (/^https:\/\//i.test(url) || (/^(images|uploads)\/[\w\-./]+$/.test(url) && url.indexOf('..') === -1)) return url;
    return fallback || '';
  }

  function getCachedBlobUrl(path) {
    return new Promise(function (resolve) {
      if (!path || path.indexOf('uploads/') !== 0 || typeof indexedDB === 'undefined') return resolve(null);
      try {
        var req = indexedDB.open('OptikaMediaCache', 1);
        req.onupgradeneeded = function (e) {
          var db = e.target.result;
          if (!db.objectStoreNames.contains('files')) db.createObjectStore('files');
        };
        req.onsuccess = function (e) {
          var db = e.target.result;
          if (!db.objectStoreNames.contains('files')) return resolve(null);
          var getReq = db.transaction('files', 'readonly').objectStore('files').get(path);
          getReq.onsuccess = function () {
            resolve(getReq.result ? URL.createObjectURL(getReq.result) : null);
          };
          getReq.onerror = function () { resolve(null); };
        };
        req.onerror = function () { resolve(null); };
      } catch (e) { resolve(null); }
    });
  }

  function resolveMediaUrl(path, fallback) {
    var clean = safeAsset(path, fallback);
    if (!clean) return Promise.resolve('');
    if (clean.indexOf('uploads/') !== 0) return Promise.resolve(clean);
    return getCachedBlobUrl(clean).then(function (blobUrl) {
      if (blobUrl) return blobUrl;
      if (isGhPages) return RAW_GH_BASE + clean;
      return clean;
    });
  }

  function safeLink(url) {
    url = String(url || '');
    return /^(https?:\/\/|tel:|mailto:|#)/i.test(url) ? url : '#';
  }

  function telHref(phone) {
    var digits = String(phone || '').replace(/[^\d+]/g, '');
    if (digits.charAt(0) === '8' && digits.length === 11) digits = '+7' + digits.slice(1);
    return 'tel:' + digits;
  }

  function applyContacts(c) {
    if (!c) return;
    if (window.OptikaContent) window.OptikaContent.contacts = c;
    document.querySelectorAll('[data-bind]').forEach(function (el) {
      var key = el.getAttribute('data-bind');
      if (c[key]) el.textContent = c[key];
    });
    document.querySelectorAll('[data-bind-tel]').forEach(function (el) {
      var key = el.getAttribute('data-bind-tel');
      if (c[key]) el.setAttribute('href', telHref(c[key]));
    });
  }

  function renderCatalog(cat) {
    var grid = document.getElementById('catalog-grid');
    if (!cat || !grid || !Array.isArray(cat.items) || !cat.items.length) return;
    var t = document.getElementById('catalog-title');
    var s = document.getElementById('catalog-subtitle');
    if (t && cat.title) t.textContent = cat.title;
    if (s && cat.subtitle) s.textContent = cat.subtitle;
    grid.innerHTML = cat.items.map(function (it, i) {
      var link = safeLink(it.link);
      var external = /^https?:\/\//i.test(link);
      var imgPath = safeAsset(it.image, DEFAULT_THUMB);
      var imgSrc = (isGhPages && imgPath.indexOf('uploads/') === 0) ? (RAW_GH_BASE + imgPath) : imgPath;
      var hasLabel = Boolean(it.label && String(it.label).trim());
      var b = BENTO[i % BENTO.length];
      return '<a href="' + esc(link) + '"' + (external ? ' target="_blank" rel="noopener"' : '') + ' class="catalog-tile bento-card sheen reveal group relative isolate overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] bg-ink flex flex-col justify-between p-4 sm:p-6 lg:p-7 ' + b.span + '">' +
        '<img data-upload-path="' + esc(imgPath) + '" src="' + esc(imgSrc) + '" alt="' + esc(it.title) + '" loading="lazy" class="bento-img absolute inset-0 -z-10 w-full h-full object-cover ' + b.pos + '" />' +
        '<div class="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>' +
        '<div class="relative flex items-start justify-between gap-3">' +
          '<span class="glass-dark rounded-full px-3 py-1.5 text-[10px] sm:text-[11px] font-medium tracking-[0.18em] uppercase text-white/90 tabular-nums">' + (hasLabel ? esc(it.label) : pad2(i + 1)) + '</span>' +
          '<span class="cta-arrow arrow-swap w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-white">' + ARROW_PAIR + '</span>' +
        '</div>' +
        '<div class="bento-meta relative">' +
          (it.linkText ? '<span class="bento-cta block text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-white/80 font-medium mb-2 sm:mb-3">' + esc(it.linkText) + '</span>' : '') +
          '<h3 class="' + b.title + ' font-medium tracking-[-0.035em] text-white break-words">' + esc(it.title) + '</h3>' +
        '</div>' +
      '</a>';
    }).join('');
    grid.querySelectorAll('img[data-upload-path^="uploads/"]').forEach(function (img) {
      getCachedBlobUrl(img.getAttribute('data-upload-path')).then(function (u) {
        if (u) img.src = u;
      });
    });
  }

  function renderServices(srv) {
    var list = document.getElementById('services-list');
    if (!srv || !list || !Array.isArray(srv.items) || !srv.items.length) return;
    var t = document.getElementById('services-title');
    if (t && srv.title) t.textContent = srv.title;
    list.innerHTML = srv.items.map(function (it, i) {
      var icon = /^[a-z0-9-]+$/.test(it.icon || '') ? it.icon : 'check';
      var featured = i === 0;
      var card = featured
        ? 'is-featured p-6 sm:p-8 lg:p-10 sm:col-span-2 bg-ink border-ink text-ivory'
        : 'p-6 sm:p-8 bg-white/70 border-zinc-200/80 hover:border-bronze-300 hover:bg-white';
      var iconCls = featured
        ? 'border-white/15 bg-white/5 text-bronze-300 group-hover:bg-ivory group-hover:text-ink group-hover:border-ivory'
        : 'border-zinc-200 bg-ivory text-bronze group-hover:bg-ink group-hover:text-ivory group-hover:border-ink';
      return '<div class="service-card reveal group relative overflow-hidden rounded-[1.75rem] border flex flex-col min-h-[15rem] sm:min-h-[17rem] ' + card + '">' +
        '<div class="relative flex items-start justify-between">' +
          '<div class="service-icon w-12 h-12 rounded-full border flex items-center justify-center ' + iconCls + '"><i data-lucide="' + icon + '" class="w-5 h-5"></i></div>' +
          '<span class="service-num text-[11px] tracking-luxe tabular-nums ' + (featured ? 'text-ivory/40' : 'text-ink-400') + '">' + pad2(i + 1) + '</span>' +
          '<span class="service-arrow absolute right-0 top-0 w-10 h-10 rounded-full flex items-center justify-center ' + (featured ? 'bg-ivory text-ink' : 'bg-ink text-ivory') + '"><i data-lucide="arrow-up-right" class="w-4 h-4"></i></span>' +
        '</div>' +
        '<div class="relative mt-auto pt-10">' +
          '<h3 class="text-xl font-medium tracking-[-0.02em] leading-snug ' + (featured ? 'sm:text-[1.65rem] text-ivory' : 'sm:text-[1.4rem] text-ink') + '">' + esc(it.title) + '</h3>' +
          (it.text ? '<p class="mt-2.5 text-[15px] leading-relaxed max-w-md ' + (featured ? 'text-ivory/60' : 'text-ink-500') + '">' + esc(it.text) + '</p>' : '') +
        '</div>' +
      '</div>';
    }).join('');
  }

  function applyAll(data) {
    if (!data) return null;
    applyContacts(data.contacts);
    renderCatalog(data.catalog);
    renderServices(data.services);
    if (window.lucide) lucide.createIcons({ attrs: { 'stroke-width': 1.5 } });
    if (typeof window.optikaRevealScan === 'function') window.optikaRevealScan();
    if (typeof window.onOptikaPlaylistUpdate === 'function' && data.playlist) {
      window.onOptikaPlaylistUpdate(data.playlist);
    }
    return data;
  }

  function getLocalImmediateContent() {
    try {
      var liveRaw = localStorage.getItem('optika_live_content_v2');
      if (liveRaw) {
        var parsed = JSON.parse(liveRaw);
        if (parsed && parsed.content && (Date.now() - (parsed.ts || 0) < 10 * 60 * 1000)) {
          return parsed.content;
        }
      }
      var demoRaw = localStorage.getItem('optika_demo_content_v2');
      if (demoRaw) return JSON.parse(demoRaw);
    } catch (e) {}
    return null;
  }

  function fetchLatestContent() {
    var localData = getLocalImmediateContent();
    if (localData) {
      return Promise.resolve(applyAll(localData));
    }
    var url = isGhPages
      ? (RAW_GH_BASE + 'content.json?t=' + Date.now())
      : ('content.json?t=' + Date.now());
    return fetch(url, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) return fetch('content.json?t=' + Date.now(), { cache: 'no-store' });
        return r;
      })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(applyAll)
      .catch(function () { return null; });
  }

  window.OptikaContent = {
    esc: esc,
    safeAsset: safeAsset,
    resolveMediaUrl: resolveMediaUrl,
    RAW_GH_BASE: RAW_GH_BASE,
    isGhPages: isGhPages,
    DEFAULT_THUMB: DEFAULT_THUMB
  };

  window.optikaContentReady = fetchLatestContent();

  window.addEventListener('storage', function (e) {
    if (e.key === 'optika_live_content_v2' || e.key === 'optika_demo_content_v2') {
      fetchLatestContent();
    }
  });
})();
