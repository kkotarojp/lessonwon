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
  function revealAll() { Array.prototype.forEach.call(reveals, function (el) { el.classList.add('is-in'); }); }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    Array.prototype.forEach.call(reveals, function (el) { io.observe(el); });
    /* 保険: 監視が何らかの理由で動かなくても、本文が見えないままにはしない */
    setTimeout(function () {
      if (reveals.length && !document.querySelector('.reveal.is-in')) revealAll();
    }, 3000);
  } else {
    revealAll();
  }

  /* ---------- FVの写真バンド(自動で流す + 指/マウスで回せる) ----------
     CSSアニメーションではなく scrollLeft で動かすことで、
     ネイティブの横スワイプと同じ操作感になる。 */
  var bands = document.querySelectorAll('.fv__band');
  Array.prototype.forEach.call(bands, function (band) {
    var track = band.querySelector('.fv__bandtrack');
    if (!track) return;

    /* 同じ8枚を2周分ならべてあるので、半分進んだら先頭に戻せば継ぎ目が出ない */
    var half = 0;
    function measure() {
      half = track.scrollWidth / 2;
      if (band.scrollLeft > half) band.scrollLeft -= half;
    }
    measure();
    window.addEventListener('resize', measure);
    if (window.ResizeObserver) new ResizeObserver(measure).observe(track);

    /* 下段は逆向き。開始位置を中央にしておくと、左へ戻る余地ができる */
    var dir = band.classList.contains('fv__band--bottom') ? -1 : 1;
    var speed = dir > 0 ? 0.017 : 0.014;   /* px/ミリ秒。端末のリフレッシュレートに依存させない */

    var holding = false, resumeAt = 0, last = 0;
    /* scrollLeft は小数が丸められることがあり += 0.3 では進まないので、位置はJS側で持つ */
    var pos = dir < 0 ? half : 0;
    band.scrollLeft = pos;

    function wrap() {
      if (pos >= half) pos -= half;
      else if (pos < 0) pos += half;
    }

    function tick(now) {
      requestAnimationFrame(tick);
      if (half <= 0) return;
      var dt = last ? Math.min(now - last, 64) : 0;
      last = now;
      if (holding) {          /* 指を置いている間は実際の位置に追従するだけ */
        pos = band.scrollLeft;
        return;
      }
      if (now < resumeAt) {   /* 慣性スクロール中。位置は追うが、継ぎ目だけ繋ぐ */
        pos = band.scrollLeft;
        var before = pos; wrap();
        if (pos !== before) band.scrollLeft = pos;
        return;
      }
      pos += speed * dir * dt;
      wrap();
      band.scrollLeft = pos;
    }
    if (!reduceMotion) requestAnimationFrame(tick);

    /* 触れている間は自動送りを止め、離してから少し待って再開 */
    function hold() { holding = true; }
    function release() { holding = false; resumeAt = performance.now() + 1200; }
    band.addEventListener('pointerdown', hold);
    band.addEventListener('touchstart', hold, { passive: true });
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    band.addEventListener('touchend', release, { passive: true });
    /* ホイールの横スクロール中も少し待つ(scrollイベントは自動送り自身が発火させるため使わない) */
    band.addEventListener('wheel', function () { resumeAt = performance.now() + 900; }, { passive: true });

    /* マウスはネイティブのドラッグスクロールが効かないので自前で動かす */
    var dragging = false, startX = 0, startLeft = 0;
    band.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      dragging = true; startX = e.clientX; startLeft = band.scrollLeft;
      band.setPointerCapture(e.pointerId);
      band.classList.add('is-dragging');
      e.preventDefault();
    });
    band.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      band.scrollLeft = startLeft - (e.clientX - startX);
    });
    band.addEventListener('pointerup', function () { dragging = false; band.classList.remove('is-dragging'); });
    band.addEventListener('pointercancel', function () { dragging = false; band.classList.remove('is-dragging'); });
  });

})();
