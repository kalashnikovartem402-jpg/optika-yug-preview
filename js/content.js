(function () {
  'use strict';

  var DEFAULT_THUMB = 'images/AdobeStock_317116275_1_0.png.jpg';
  var RAW_GH_BASE = '';
  var isGhPages = /\.github\.io$/i.test(location.hostname);

  var PYRAMIDS = {
    'мужские':       ['М', 'УЖ', 'СКАЯ', 'коллекция', 'D=50.0', 'V=0.1'],
    'мужская':       ['М', 'УЖ', 'СКАЯ', 'коллекция', 'D=50.0', 'V=0.1'],
    'женские':       ['Ж', 'ЕН', 'СКАЯ', 'коллекция', 'D=25.0', 'V=0.2'],
    'женская':       ['Ж', 'ЕН', 'СКАЯ', 'коллекция', 'D=25.0', 'V=0.2'],
    'детские':       ['Д', 'ЕТ', 'СКИЕ', 'коллекция', 'D=16.7', 'V=0.3'],
    'детская':       ['Д', 'ЕТ', 'СКАЯ', 'коллекция', 'D=16.7', 'V=0.3'],
    'ремонт оправ':  ['Р', 'ЕМ', 'ОНТ', 'оправ', 'D=12.5', 'V=0.4'],
    'ремонт':        ['Р', 'ЕМ', 'ОНТ', 'оправ', 'D=12.5', 'V=0.4'],
    'контактные линзы': ['Л', 'ИН', 'ЗЫ', 'контактные', 'D=10.0', 'V=0.5'],
    'линзы':         ['Л', 'ИН', 'ЗЫ', 'контактные', 'D=10.0', 'V=0.5'],
    'аксессуары':    ['А', 'КС', 'ЕССУАРЫ', 'оптики', 'D=5.0', 'V=1.0']
  };
  var D_STEPS = [
    ['D=50.0', 'V=0.1'],
    ['D=25.0', 'V=0.2'],
    ['D=16.7', 'V=0.3'],
    ['D=12.5', 'V=0.4'],
    ['D=10.0', 'V=0.5'],
    ['D=5.0',  'V=1.0']
  ];
  var SERVICE_OPTO = ['Ш', 'Б', 'М', 'Н', 'К', 'Ы', 'И'];
  var SERVICE_D = [
    ['D=50.0', 'V=0.1'],
    ['D=25.0', 'V=0.2'],
    ['D=12.5', 'V=0.4'],
    ['D=7.1',  'V=0.7'],
    ['D=5.0',  'V=1.0']
  ];

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function buildPyramid(title, label, idx) {
    var raw = String(title || '').trim();
    var key = raw.toLowerCase();
    var preset = PYRAMIDS[key];
    var step = D_STEPS[idx % D_STEPS.length];
    if (preset) {
      return {
        r1: preset[0],
        r2: preset[1],
        r3: preset[2],
        r4: (label && String(label).trim()) ? String(label).trim().toLowerCase() : preset[3],
        d: preset[4],
        v: preset[5]
      };
    }
    var parts = raw.split(/\s+/);
    var main = (parts[0] || 'ОЧКИ').toUpperCase();
    var sub = parts.length > 1 ? parts.slice(1).join(' ').toLowerCase() : 'коллекция';
    if (label && String(label).trim()) sub = String(label).trim().toLowerCase();
    return {
      r1: main.slice(0, 1) || 'О',
      r2: main.slice(1, 3) || 'ПТ',
      r3: main.slice(3) || 'ИКА',
      r4: sub,
      d: step[0],
      v: step[1]
    };
  }

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
      var p = buildPyramid(it.title, it.label, i);
      var longCls = p.r3.length > 5 ? ' is-long' : '';
      return '<a href="' + esc(link) + '"' + (external ? ' target="_blank" rel="noopener"' : '') + ' aria-label="' + esc(it.title) + '" class="catalog-tile reveal group">' +
        '<div class="tile-head">' +
          '<span>№' + pad2(i + 1) + ' · ' + esc(p.d) + '</span>' +
          '<span class="tile-v">' + esc(p.v) + '</span>' +
        '</div>' +
        '<div class="pyramid" aria-hidden="true">' +
          '<span class="pyr-1">' + esc(p.r1) + '</span>' +
          '<span class="pyr-2">' + esc(p.r2) + '</span>' +
          '<span class="pyr-3' + longCls + '">' + esc(p.r3) + '</span>' +
          '<span class="pyr-4">' + esc(p.r4) + '</span>' +
        '</div>' +
        '<div class="tile-foot">' +
          '<span class="truncate pr-2">' + esc(it.linkText || 'Смотреть в ВК') + '</span>' +
          '<span class="cta-arrow"><i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i></span>' +
        '</div>' +
      '</a>';
    }).join('');
  }

  function renderServices(srv) {
    var list = document.getElementById('services-list');
    if (!srv || !list || !Array.isArray(srv.items) || !srv.items.length) return;
    var t = document.getElementById('services-title');
    if (t && srv.title) t.textContent = srv.title;
    list.innerHTML = srv.items.map(function (it, i) {
      var opto = SERVICE_OPTO[i % SERVICE_OPTO.length];
      var dv = SERVICE_D[i % SERVICE_D.length];
      var isLast = i === srv.items.length - 1;
      return '<div class="service-row reveal group grid grid-cols-12 items-center gap-4 py-6 sm:py-7 px-4 sm:px-6' + (isLast ? ' border-b-2 border-b-signal' : '') + '">' +
        '<div class="col-span-3 sm:col-span-2 flex items-baseline gap-3">' +
          '<span class="service-opto text-3xl sm:text-4xl">' + opto + '</span>' +
          '<span class="font-mono text-[11px] text-med hidden sm:inline">' + dv[0] + '</span>' +
        '</div>' +
        '<div class="col-span-7 sm:col-span-8">' +
          '<h3 class="text-base sm:text-xl font-bold tracking-tight text-black">' + esc(it.title) + '</h3>' +
          (it.text ? '<p class="text-sm sm:text-base text-black mt-1">' + esc(it.text) + '</p>' : '') +
        '</div>' +
        '<div class="col-span-2 flex items-center justify-end gap-3">' +
          '<span class="font-mono text-xs font-semibold ' + (isLast ? 'text-signal' : 'text-med') + '">' + dv[1] + '</span>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function applyAll(data) {
    if (!data) return null;
    applyContacts(data.contacts);
    renderCatalog(data.catalog);
    renderServices(data.services);
    if (window.lucide) lucide.createIcons({ attrs: { 'stroke-width': 1.75 } });
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
