/* レッスンWON v3 — ページ間ワイプ遷移 / プリローダー / リビール / モバイルメニュー */
(function () {
  'use strict';

  var wipe = document.getElementById('wipe');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 入場演出 ----------
     内部リンク経由(sessionStorage.won_nav=1)ならワイプ開幕、
     ホーム初回はプリローダー、それ以外は演出なし */
  var preloader = document.querySelector('.preloader');
  var cameFromInternal = false;
  try { cameFromInternal = sessionStorage.getItem('won_nav') === '1'; sessionStorage.removeItem('won_nav'); } catch (e) {}

  if (!reduceMotion && cameFromInternal && wipe) {
    wipe.classList.add('is-cover');
    if (preloader) preloader.classList.add('is-done');
    window.addEventListener('load', function () {
      requestAnimationFrame(function () {
        wipe.classList.remove('is-cover');
        wipe.classList.add('is-out');
        setTimeout(function () { wipe.classList.remove('is-out'); }, 700);
      });
    });
  } else if (preloader) {
    var played = false;
    try { played = sessionStorage.getItem('won_intro') === '1'; } catch (e) {}
    if (played || reduceMotion) {
      preloader.classList.add('is-done');
    } else {
      window.addEventListener('load', function () {
        preloader.classList.add('is-play');
        setTimeout(function () { preloader.classList.add('is-done'); }, 2100);
        try { sessionStorage.setItem('won_intro', '1'); } catch (e) {}
      });
      /* 保険 */
      setTimeout(function () {
        if (!preloader.classList.contains('is-done')) {
          preloader.classList.add('is-play');
          setTimeout(function () { preloader.classList.add('is-done'); }, 2100);
        }
      }, 3000);
    }
  }

  /* ---------- 退場演出(内部リンククリック→ワイプ→遷移) ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a || !wipe || reduceMotion) return;
    var href = a.getAttribute('href');
    if (!href || href.indexOf('http') === 0 || href.indexOf('#') === 0 || href.indexOf('tel:') === 0 || href.indexOf('mailto:') === 0) return;
    if (a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    try { sessionStorage.setItem('won_nav', '1'); } catch (err) {}
    wipe.classList.add('is-in');
    setTimeout(function () { location.href = href; }, 440);
  });
  /* bfcache 復帰時にワイプが残らないように */
  window.addEventListener('pageshow', function (e) {
    if (e.persisted && wipe) { wipe.classList.remove('is-in', 'is-cover', 'is-out'); }
  });

  /* ---------- Header ---------- */
  var header = document.querySelector('.header');
  function onScroll() { if (header) header.classList.toggle('is-scrolled', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- モバイルメニュー ---------- */
  var mmenu = document.getElementById('mmenu');
  var menuBtn = document.querySelector('.menu-btn');
  function setMenu(open) {
    if (!mmenu) return;
    mmenu.classList.toggle('is-open', open);
    document.body.classList.toggle('is-locked', open);
    if (menuBtn) menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (menuBtn) menuBtn.addEventListener('click', function () { setMenu(!mmenu.classList.contains('is-open')); });
  if (mmenu) {
    mmenu.addEventListener('click', function (e) {
      if (e.target.closest('a') || e.target.closest('[data-menu-close]')) setMenu(false);
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mmenu && mmenu.classList.contains('is-open')) setMenu(false);
  });

  /* ---------- Reveal ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }
})();
