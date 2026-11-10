/* ==========================================================
   ygaxii 资源站 · 新版前端脚本（无依赖）
   ========================================================== */
(function () {
  'use strict';

  /* ---------------- 主题 ---------------- */
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem('yg-theme'); } catch (e) {}
  if (saved === 'dark') root.setAttribute('data-theme', 'dark');
  if (saved === 'light') root.removeAttribute('data-theme');

  var themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    var paint = function () {
      var dark = root.getAttribute('data-theme') === 'dark';
      themeBtn.innerHTML = dark
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
      themeBtn.title = dark ? '切换浅色' : '切换深色';
    };
    paint();
    themeBtn.addEventListener('click', function () {
      var dark = root.getAttribute('data-theme') === 'dark';
      if (dark) { root.removeAttribute('data-theme'); } else { root.setAttribute('data-theme', 'dark'); }
      try { localStorage.setItem('yg-theme', dark ? 'light' : 'dark'); } catch (e) {}
      paint();
    });
  }

  /* ---------------- Hero 轮播 ---------------- */
  var hero = document.querySelector('.hero');
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero-dots button'));
    var idx = 0, timer = null;

    var show = function (n) {
      if (!slides.length) return;
      idx = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle('is-active', i === idx); });
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === idx); });
    };
    var play = function () {
      stop();
      if (slides.length > 1) timer = setInterval(function () { show(idx + 1); }, 5200);
    };
    var stop = function () { if (timer) { clearInterval(timer); timer = null; } };

    var prev = hero.querySelector('.hero-arrow.prev');
    var next = hero.querySelector('.hero-arrow.next');
    if (prev) prev.addEventListener('click', function () { show(idx - 1); play(); });
    if (next) next.addEventListener('click', function () { show(idx + 1); play(); });
    dots.forEach(function (d, i) {
      d.addEventListener('click', function () { show(i); play(); });
    });
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', play);
    show(0);
    play();
  }

  /* ---------------- 卡片：搜索 / 标签 / 加载更多 ---------------- */
  var grid = document.getElementById('postGrid');
  if (grid) {
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.post-card'));
    var PAGE = 24;
    var shown = 0;
    var currentTab = 'all';
    var keyword = '';
    var tagFilter = '';

    var matchTab = function (card) {
      if (currentTab === 'all') return true;
      var tags = (card.getAttribute('data-tags') || '').split(/\s+/);
      if (currentTab === 'new') return card.getAttribute('data-new') === '1';
      return tags.indexOf(currentTab) >= 0;
    };
    var matchKeyword = function (card) {
      if (tagFilter) {                       // 侧栏标签云：按标签精确匹配，和标签上的数字对得上
        var tags = (card.getAttribute('data-tags') || '').split(/\s+/);
        return tags.indexOf(tagFilter) >= 0;
      }
      if (!keyword) return true;             // 搜索框：按名字模糊匹配
      var hay = (card.getAttribute('data-name') || '') + ' ' + (card.getAttribute('data-tags') || '');
      return hay.toLowerCase().indexOf(keyword) >= 0;
    };

    var moreWrap = document.querySelector('.load-more-wrap');
    var apply = function (reset) {
      if (reset) shown = 0;
      var visible = [];
      cards.forEach(function (c) {
        var ok = matchTab(c) && matchKeyword(c);
        c.__ok = ok;
        c.classList.add('hidden');
        if (ok) visible.push(c);
      });
      var limit = keyword ? visible.length : Math.min(visible.length, shown + PAGE);
      if (keyword) shown = visible.length;
      for (var i = 0; i < limit; i++) visible[i].classList.remove('hidden');
      shown = limit;
      if (moreWrap) moreWrap.classList.toggle('hidden', !(limit < visible.length));
      var empty = document.getElementById('emptyState');
      if (empty) empty.classList.toggle('hidden', visible.length > 0);
    };

    var moreBtn = document.querySelector('.load-more');
    if (moreBtn) moreBtn.addEventListener('click', function () { apply(false); });

    var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab[data-tab]'));
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        tabs.forEach(function (x) { x.classList.remove('is-active'); });
        t.classList.add('is-active');
        currentTab = t.getAttribute('data-tab');
        tagFilter = ''; keyword = ''; if (input) input.value = '';
        apply(true);
      });
    });

    var input = document.getElementById('searchInput');
    if (input) {
      var t0 = null;
      input.addEventListener('input', function () {
        clearTimeout(t0);
        t0 = setTimeout(function () {
          tagFilter = '';                       // 手动输入就切回模糊搜索
          keyword = input.value.trim().toLowerCase();
          apply(true);
        }, 120);
      });
    }

    // 侧栏「分类云」：点一下等于按这个标签筛选（再点一次取消）
    Array.prototype.forEach.call(document.querySelectorAll('[data-q]'), function (a) {
      a.addEventListener('click', function (ev) {
        ev.preventDefault();
        var q = a.getAttribute('data-q') || '';
        if (tagFilter === q) { tagFilter = ''; if (input) input.value = ''; }
        else { tagFilter = q; keyword = ''; if (input) input.value = q; }
        apply(true);
        var tabsEl = document.getElementById('all');
        if (tabsEl) tabsEl.scrollIntoView({ block: 'start', behavior: 'smooth' });
      });
    });

    apply(true);

    /* ---------------- 随机推荐 ---------------- */
    var randList = document.getElementById('randomList');
    var dataEl = document.getElementById('gameIndex');
    var shuffleBtn = document.getElementById('shuffleBtn');
    if (randList && dataEl) {
      var all = [];
      try { all = JSON.parse(dataEl.textContent || '[]'); } catch (e) {}
      var renderRandom = function () {
        if (!all.length) return;
        var pool = all.slice();
        var pick = [];
        for (var i = 0; i < 6 && pool.length; i++) {
          pick.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
        }
        randList.innerHTML = pick.map(function (g) {
          return '<a class="rank-item" href="' + g.u + '">' +
            '<span class="rank-thumb"><img loading="lazy" src="' + g.c + '" alt=""></span>' +
            '<span class="rank-main"><span class="rank-title">' + g.n + '</span>' +
            '<span class="rank-meta"><span>' + g.t + '</span></span></span></a>';
        }).join('');
      };
      renderRandom();
      if (shuffleBtn) shuffleBtn.addEventListener('click', renderRandom);
    }
  }
})();
