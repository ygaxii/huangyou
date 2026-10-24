/* 站点交互：菜单、搜索、筛选、公告、分页、图片渐显、图片查看器 */
(function () {
  'use strict';

  var SETS = window.__SETS__ || [];
  var GAMES = window.__GAMES__ || [];

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  }); }

  /* 分页状态：供 lightbox 显示“全局第几款 / 共几款” */
  var pagerState = { total: 0, page: 1, pages: 1 };

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

  var io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '300px' });
  }

  /** 给容器内（含新翻出来的）封面图挂渐显 */
  function observeImgs(root) {
    $$('.covers img, .gcard .cover img', root || document).forEach(function (im) {
      if (im.classList.contains('on')) return;
      if (io) io.observe(im); else show(im);
    });
  }
  observeImgs(document);

  /* ---------- 图片查看器（Lightbox） ---------- */
  var lb = $('#lightbox');
  var lbItems = [];

  function collectItems() { lbItems = $$('.gcard[data-item]'); }

  if (lb) {
    var lbImg = $('#lb-img');
    var lbTitle = $('#lb-title');
    var lbDesc = $('#lb-desc');
    var lbLinks = $('#lb-links');
    var lbCount = $('#lb-count');
    var cur = -1;

    function decodeData(attr) {
      var html = document.createElement('div');
      html.innerHTML = attr;
      return html.textContent;
    }

    function openAt(idx) {
      if (idx < 0 || idx >= lbItems.length) return;
      cur = idx;
      var card = lbItems[idx];
      var data;
      try { data = JSON.parse(decodeData(card.getAttribute('data-item'))); }
      catch (e) { return; }
      lbImg.classList.remove('on');
      lbImg.src = data.cover || '';
      lbImg.alt = data.name || '';
      lbTitle.textContent = data.name || '';
      lbDesc.textContent = data.desc || '';
      lbDesc.style.display = data.desc ? '' : 'none';
      var no = card.getAttribute('data-no') || (idx + 1);
      var total = pagerState.total || lbItems.length;
      lbCount.textContent = no + ' / ' + total +
        (pagerState.pages > 1 ? ' · 第 ' + pagerState.page + '/' + pagerState.pages + ' 页' : '');
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
      if (n < 0) n = lbItems.length - 1;
      if (n >= lbItems.length) n = 0;
      openAt(n);
    }

    /** 给卡片绑定点击打开（新翻出来的卡片也要绑） */
    var boundCards = (typeof WeakSet === 'function') ? new WeakSet() : null;
    var boundList = [];
    function isBound(card) {
      return boundCards ? boundCards.has(card) : boundList.indexOf(card) > -1;
    }
    function markBound(card) {
      if (boundCards) boundCards.add(card); else boundList.push(card);
    }

    window.__bindCards = function (root) {
      $$('.gcard[data-item]', root || document).forEach(function (card) {
        if (isBound(card)) return;
        markBound(card);
        card.addEventListener('click', function (e) {
          if (e.target.closest('.links') || e.target.closest('a')) return;
          var i = lbItems.indexOf(card);
          if (i >= 0) openAt(i);
        });
        var trigger = card.querySelector('.cover');
        if (trigger) trigger.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            var i = lbItems.indexOf(card);
            if (i >= 0) openAt(i);
          }
        });
      });
    };

    collectItems();
    window.__bindCards(document);

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

  /* ---------- 合集详情页分页（顶部 + 底部两份导航共用一套状态） ---------- */
  var glist = $('.glist');
  var pagerEls = $$('.pager[data-total]');
  if (glist && pagerEls.length) {
    (function () {
      var pagerEl = pagerEls[0];
      var per = parseInt(pagerEl.getAttribute('data-per'), 10) || 50;
      var total = parseInt(pagerEl.getAttribute('data-total'), 10) || glist.children.length;
      var slug = pagerEl.getAttribute('data-slug') || '';
      var src = pagerEl.getAttribute('data-src') || '';
      var pageCount = Math.max(1, Math.ceil(total / per));

      var cache = { 1: glist.innerHTML };   // 已渲染过的页面 HTML
      var data = null;                      // assets/<slug>-pages.js 载入后的数据
      var loading = false;
      var queue = [];
      var cur = 1;

      pagerState.total = total;
      pagerState.pages = pageCount;
      pagerState.page = 1;

      pagerEls.forEach(function (el) { el.hidden = false; });

      /* 翻页后滚到列表上方：优先对齐顶部那份导航，本页没有顶部导航时退回列表顶部 */
      var anchorEl = $('.pager-top', document) || glist;

      /* 懒加载后续分页数据：只有点页码 / 带锚点进入时才请求 */
      function load(cb) {
        if (data) { cb(data); return; }
        queue.push(cb);
        if (loading || !src) return;
        loading = true;
        var s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = function () {
          loading = false;
          data = (window.__PAGES__ && window.__PAGES__[slug]) || { pages: [] };
          var q = queue; queue = [];
          q.forEach(function (f) { f(data); });
        };
        s.onerror = function () {
          loading = false;
          data = { pages: [] };
          var q = queue; queue = [];
          q.forEach(function (f) { f(data); });
        };
        document.head.appendChild(s);
      }

      function htmlFor(p) {
        if (cache[p]) return cache[p];
        if (data && data.pages && data.pages[p - 2] != null) return (cache[p] = data.pages[p - 2]);
        return null;
      }

      function render(p) {
        var html = htmlFor(p);
        if (html == null) return false;
        glist.innerHTML = html;
        cur = p;
        pagerState.page = p;
        if (window.__bindCards) { collectItems(); window.__bindCards(glist); }
        observeImgs(glist);
        drawNav();
        return true;
      }

      function scrollToTop() {
        var top = anchorEl.getBoundingClientRect().top + (window.pageYOffset || 0) - 76;
        try { window.scrollTo({ top: top < 0 ? 0 : top, behavior: 'smooth' }); }
        catch (e) { window.scrollTo(0, top < 0 ? 0 : top); }
      }

      function hashPage(p) {
        try {
          if (history.replaceState) history.replaceState(null, '', '#page=' + p);
          else location.hash = 'page=' + p;
        } catch (e) {}
      }

      function go(p, done) {
        p = Math.min(pageCount, Math.max(1, parseInt(p, 10) || 1));
        if (p === cur) { if (done) done(); return; }
        if (cache[p]) {
          if (render(p)) { if (done) done(); else { hashPage(p); scrollToTop(); } }
          return;
        }
        load(function () {
          if (!render(p)) {
            pagerEls.forEach(function (el) {
              el.innerHTML = '<p class="pager-noscript">分页数据加载失败，刷新页面重试。</p>';
            });
            return;
          }
          if (done) done(); else { hashPage(p); scrollToTop(); }
        });
      }

      /* 页码序列：页数多时用省略号收窄 */
      function pageList(n, pages) {
        var out = [], i;
        if (pages <= 7) {
          for (i = 1; i <= pages; i++) out.push(i);
          return out;
        }
        out.push(1);
        var s = Math.max(2, n - 2), e = Math.min(pages - 1, n + 2);
        if (s > 2) out.push('…');
        for (i = s; i <= e; i++) out.push(i);
        if (e < pages - 1) out.push('…');
        out.push(pages);
        return out;
      }

      function drawNav() {
        var nums = pageList(cur, pageCount).map(function (n) {
          if (n === '…') return '<span class="pg-gap">…</span>';
          return '<button class="pg-num' + (n === cur ? ' on' : '') + '" type="button" data-pg="' + n + '"' +
            (n === cur ? ' aria-current="page"' : '') + '>' + n + '</button>';
        }).join('');
        var html =
          '<div class="pager-in">' +
            '<button class="pg-btn" type="button" data-pg="prev"' + (cur === 1 ? ' disabled' : '') + '>上一页</button>' +
            '<span class="pg-nums">' + nums + '</span>' +
            '<button class="pg-btn" type="button" data-pg="next"' + (cur === pageCount ? ' disabled' : '') + '>下一页</button>' +
          '</div>' +
          '<div class="pg-info">第 ' + cur + ' / ' + pageCount + ' 页 · 每页 ' + per + ' 款 · 共 ' + total + ' 款</div>';
        pagerEls.forEach(function (el) { el.innerHTML = html; });
      }

      /* 顶部、底部两份导航都绑同一套点击逻辑 */
      pagerEls.forEach(function (el) {
        el.addEventListener('click', function (e) {
          var b = e.target.closest('[data-pg]');
          if (!b || b.disabled) return;
          var v = b.getAttribute('data-pg');
          if (v === 'prev') go(cur - 1);
          else if (v === 'next') go(cur + 1);
          else go(parseInt(v, 10));
        });
      });

      drawNav();

      /* 进入页面时的锚点处理：#g-105 跳到第 3 页并定位；#page=2 直接翻页 */
      function scrollToCard(no) {
        var el = document.getElementById('g-' + no);
        if (!el) return;
        var top = el.getBoundingClientRect().top + (window.pageYOffset || 0) - 84;
        try { window.scrollTo({ top: top < 0 ? 0 : top, behavior: 'smooth' }); }
        catch (e2) { window.scrollTo(0, top < 0 ? 0 : top); }
        el.classList.add('flash');
        setTimeout(function () { el.classList.remove('flash'); }, 1600);
      }

      var h = String(location.hash || '').replace(/^#/, '');
      var mg = /^g-(\d+)$/.exec(h);
      var mp = /^page=(\d+)$/.exec(h);
      if (mg) {
        var no = parseInt(mg[1], 10);
        if (no >= 1 && no <= total) {
          var p = Math.ceil(no / per);
          if (p === 1) scrollToCard(no);
          else go(p, function () { scrollToCard(no); });
        }
      } else if (mp) {
        var p2 = parseInt(mp[1], 10);
        if (p2 >= 1 && p2 <= pageCount && p2 !== 1) go(p2);
      }
    })();
  }
})();
