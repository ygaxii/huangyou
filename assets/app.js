/* 站点交互：菜单、搜索、筛选、公告、图片渐显 */
(function () {
  'use strict';

  var SETS = window.__SETS__ || [];
  var GAMES = window.__GAMES__ || [];

  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  }); }

  /* ---------- 抽屉菜单 ---------- */
  var tgl = $('.drawer-toggle');
  var drawer = $('#drawer');
  if (tgl && drawer) {
    tgl.addEventListener('click', function (e) {
      e.stopPropagation();
      drawer.classList.toggle('open');
      tgl.setAttribute('aria-expanded', drawer.classList.contains('open') ? 'true' : 'false');
    });
    document.addEventListener('click', function () { drawer.classList.remove('open'); });
  }

  /* ---------- 所有下拉（筛选 / 搜索）统一收起 ---------- */
  function closeAll(except) {
    $$('.dd, .s-wrap').forEach(function (d) { if (d !== except) d.classList.remove('open'); });
  }
  document.addEventListener('click', function () { closeAll(null); });
  $$('.dd > .btn, .s-wrap > .btn').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      var p = b.parentElement;
      var open = p.classList.contains('open');
      closeAll(p);
      p.classList.toggle('open', !open);
    });
  });
  $$('.dd-menu').forEach(function (m) { m.addEventListener('click', function (e) { e.stopPropagation(); }); });

  /* ---------- 平台筛选 ---------- */
  $$('.plat-menu button').forEach(function (b) {
    b.addEventListener('click', function () {
      var p = b.getAttribute('data-plat');
      $$('.plat-menu button').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      var label = $('.plat-label');
      if (label) label.textContent = b.textContent;
      $$('.card[data-platform]').forEach(function (c) {
        c.style.display = (p === 'all' || c.getAttribute('data-platform') === p) ? '' : 'none';
      });
      closeAll(null);
    });
  });

  /* ---------- 搜索 ---------- */
  function match(q, keys) {
    var s = (keys.join(' ') || '').toLowerCase();
    return q.split(/\s+/).filter(Boolean).every(function (k) { return s.indexOf(k) > -1; });
  }

  function searchNow(q) {
    q = q.trim().toLowerCase();
    var out = [];
    if (!q) return out;
    SETS.forEach(function (s) {
      if (match(q, [s.title, s.date, s.platform])) {
        out.push({ kind: '合集', title: s.title, meta: s.count + ' 款 · ' + (s.platform || ''), href: s.slug + '.html' });
      }
    });
    GAMES.forEach(function (g) {
      if (match(q, [g.name, g.desc, g.set])) {
        out.push({ kind: '条目', title: g.name, meta: g.set, href: g.slug + '.html#g-' + g.i });
      }
    });
    return out.slice(0, 40);
  }

  function renderList(el, res, q) {
    if (!el) return;
    if (!res.length) {
      el.innerHTML = '<div class="empty">' + (q ? '没有找到「' + esc(q) + '」相关内容' : '试试搜索关键词，无需输入全名') + '</div>';
      return;
    }
    el.innerHTML = res.map(function (r) {
      return '<a href="' + esc(r.href) + '">' +
        '<div class="t"><span class="tagmark">' + esc(r.kind) + '</span><b>' + esc(r.title) + '</b></div>' +
        '<div class="meta">' + esc(r.meta) + '</div></a>';
    }).join('');
  }

  var input = $('#s-input');
  var box = $('#s-box');
  var resBox = $('#s-res');

  if (input && box && resBox) {
    var timer = null;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      var q = input.value;
      timer = setTimeout(function () { renderList(resBox, searchNow(q), q); }, 120);
    });
    input.addEventListener('focus', function () {
      closeAll(null);
      box.classList.add('open');
      renderList(resBox, searchNow(input.value), input.value);
    });
    box.addEventListener('click', function (e) { e.stopPropagation(); });
    var form = $('#s-form');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = input.value.trim();
      if (q) location.href = 'search.html?q=' + encodeURIComponent(q);
    });
  }

  /* ---------- 搜索页 ---------- */
  var pgInput = $('#p-input');
  var pgRes = $('#p-res');
  var pgCount = $('#p-count');
  if (pgInput && pgRes) {
    function run() {
      var q = pgInput.value;
      var res = searchNow(q);
      renderList(pgRes, res, q);
      if (pgCount) pgCount.textContent = q.trim() ? '共找到 ' + res.length + ' 条结果' : '';
    }
    pgInput.addEventListener('input', run);
    var k = new URLSearchParams(location.search).get('q');
    if (k) { pgInput.value = k; run(); }
  }

  /* ---------- 公告弹窗 ---------- */
  var mask = $('#notice');
  if (mask) {
    var key = 'notice-' + (mask.getAttribute('data-ver') || 'v1');
    if (localStorage.getItem(key) !== '1') mask.hidden = false;
    $$('#notice [data-close]').forEach(function (b) {
      b.addEventListener('click', function () {
        mask.hidden = true;
        try { localStorage.setItem(key, '1'); } catch (e) {}
      });
    });
    mask.addEventListener('click', function (e) { if (e.target === mask) mask.hidden = true; });
  }

  /* ---------- 图片渐显 ---------- */
  function show(im) {
    if (im.classList.contains('on')) return;
    if (im.complete && im.naturalWidth) im.classList.add('on');
    else im.addEventListener('load', function () { im.classList.add('on'); });
    im.addEventListener('error', function () { im.classList.add('on'); });
  }
  var imgs = $$('.covers img, .gcard .cover img');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '300px' });
    imgs.forEach(function (im) { io.observe(im); });
  } else {
    imgs.forEach(show);
  }

  /* ---------- 图片查看器（Lightbox） ---------- */
  var lb = $('#lightbox');
  if (lb) {
    var lbImg = $('#lb-img');
    var lbTitle = $('#lb-title');
    var lbDesc = $('#lb-desc');
    var lbLinks = $('#lb-links');
    var lbCount = $('#lb-count');
    var items = $$('.gcard[data-item]');
    var cur = -1;

    function decodeData(attr) {
      var html = document.createElement('div');
      html.innerHTML = attr;
      return html.textContent;
    }

    function openAt(idx) {
      if (idx < 0 || idx >= items.length) return;
      cur = idx;
      var card = items[idx];
      var data;
      try { data = JSON.parse(decodeData(card.getAttribute('data-item'))); }
      catch (e) { return; }
      lbImg.src = data.cover || '';
      lbImg.alt = data.name || '';
      lbTitle.textContent = data.name || '';
      lbDesc.textContent = data.desc || '';
      lbDesc.style.display = data.desc ? '' : 'none';
      lbCount.textContent = (idx + 1) + ' / ' + items.length;
      var links = data.links || [];
      lbLinks.innerHTML = links.length
        ? links.map(function (l) {
            return '<a href="' + esc(l.url) + '" target="_blank" rel="noreferrer">' + esc(l.label || '下载') + '</a>';
          }).join('')
        : '<span class="lb-nolink">链接待补充</span>';
      lb.hidden = false;
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeLb() {
      lb.hidden = true;
      lb.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      cur = -1;
    }

    function next(d) {
      if (cur < 0) return;
      var n = cur + d;
      if (n < 0) n = items.length - 1;
      if (n >= items.length) n = 0;
      openAt(n);
    }

    // 点击封面图打开（含键盘回车/空格）
    items.forEach(function (card, i) {
      var trigger = card.querySelector('.cover');
      card.addEventListener('click', function (e) {
        if (e.target.closest('.links') || e.target.closest('a')) return;
        openAt(i);
      });
      if (trigger) trigger.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAt(i); }
      });
    });

    // 关闭：点遮罩 / 关闭按钮
    $$('#lightbox [data-lb-close]').forEach(function (el) {
      el.addEventListener('click', closeLb);
    });

    // 上一张 / 下一张
    var prevBtn = $('.lb-prev');
    var nextBtn = $('.lb-next');
    if (prevBtn) prevBtn.addEventListener('click', function () { next(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { next(1); });

    // 键盘：Esc 关闭，左右方向键切换
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLb();
      else if (e.key === 'ArrowLeft') next(-1);
      else if (e.key === 'ArrowRight') next(1);
    });

    // 切换图片时淡入
    lbImg.addEventListener('load', function () { lbImg.classList.add('on'); });
  }
})();
