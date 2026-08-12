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

  /* ---------- お問い合わせフォーム(飼い主さま / 法人・団体さま の2窓口) ----------
     送信先(CONTACT_FORM_ENDPOINT)が未設定のうちはフォームを出さず、
     お電話のご案内だけを表示する。 */
  var cwrap = document.getElementById('cform-wrap');
  if (cwrap) {
    var endpoint = (typeof CONTACT_FORM_ENDPOINT === 'string' ? CONTACT_FORM_ENDPOINT : '').trim();
    var fallback = document.getElementById('cform-fallback');

    /* --- タブ切り替え(送信先の有無にかかわらず動かす) --- */
    var tabs = cwrap.querySelectorAll('.cform__tab');
    function showPane(id) {
      Array.prototype.forEach.call(tabs, function (t) {
        var on = t.getAttribute('data-pane') === id;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      Array.prototype.forEach.call(cwrap.querySelectorAll('.cform__pane'), function (p) {
        p.hidden = p.id !== id;
      });
    }
    Array.prototype.forEach.call(tabs, function (t) {
      t.addEventListener('click', function () { showPane(t.getAttribute('data-pane')); });
    });
    /* ?biz や #biz で来たら法人窓口を開いた状態にする(名刺やメールから直接誘導できる) */
    var wantBiz = /(^|[?&#])biz\b/.test(location.search + location.hash);
    showPane(wantBiz ? 'pane-biz' : 'pane-private');

    if (endpoint) {
      cwrap.hidden = false;
      if (fallback) fallback.hidden = true;

      Array.prototype.forEach.call(cwrap.querySelectorAll('form.cform'), function (form) {
        form.setAttribute('action', endpoint);
        var btn = form.querySelector('button[type="submit"]');
        var status = form.querySelector('.cform__status');
        var group = form.querySelector('[data-required-group]');

        function say(msg, cls) { status.textContent = msg; status.className = 'cform__status' + (cls ? ' ' + cls : ''); }

        form.addEventListener('submit', function (e) {
          e.preventDefault();
          say('');
          /* チェックは1つ以上えらんでもらう(HTMLのrequiredでは表現できないため) */
          if (group && !group.querySelector('input:checked')) {
            say('1つ以上お選びください。', 'is-ng');
            group.querySelector('input').focus();
            return;
          }
          if (!form.checkValidity()) {
            var bad = form.querySelector(':invalid');
            say('未入力の項目があります。ご確認ください。', 'is-ng');
            if (bad) bad.focus();
            return;
          }
          btn.disabled = true;
          say('送信しています…');
          fetch(endpoint, {
            method: 'POST',
            body: new FormData(form),
            headers: { 'Accept': 'application/json' }
          }).then(function (res) {
            if (!res.ok) throw new Error(res.status);
            /* 送信できたらフォームを片づけて、お礼だけを残す */
            cwrap.innerHTML = '<div class="cform__done"><strong>送信しました。ありがとうございます。</strong>' +
              '<p>2営業日以内にご返信いたします。<br>お急ぎの場合は <a href="tel:0774223005">0774-22-3005</a> までお電話ください。</p></div>';
            cwrap.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
          }).catch(function () {
            btn.disabled = false;
            say('送信できませんでした。恐れ入りますが 0774-22-3005 までお電話ください。', 'is-ng');
          });
        });
      });
    }
  }

  /* ---------- FVの写真バンド(自動で流す + 指/マウスで回せる) ----------
     scrollLeft は端で頭打ちになり、小数も丸められてカクつくため使わない。
     transform で動かし、半周ぶん進んだら位置を戻すことで途切れなく循環させる。 */
  var bands = document.querySelectorAll('.fv__band');
  Array.prototype.forEach.call(bands, function (band) {
    var track = band.querySelector('.fv__bandtrack');
    if (!track) return;

    /* 同じ8枚を2周分ならべてあるので、半周ぶんで位置を戻せば継ぎ目が出ない。
       offsetWidth は transform の影響を受けないので実寸がとれる。 */
    var half = 0;
    function measure() { half = track.offsetWidth / 2; }
    measure();
    window.addEventListener('resize', measure);
    if (window.ResizeObserver) new ResizeObserver(measure).observe(track);

    var dir = band.classList.contains('fv__band--bottom') ? -1 : 1;
    var speed = dir > 0 ? 52 : 41;        /* px/秒。上下で変えて同じ動きに見えないようにする */

    var offset = 0, prevTime = 0, velocity = 0;
    var dragging = false, startX = 0, startOffset = 0, lastX = 0, lastT = 0;

    function normalize() { if (half > 0) offset = ((offset % half) + half) % half; }
    function apply() { track.style.transform = 'translate3d(' + (-offset).toFixed(2) + 'px,0,0)'; }

    function tick(now) {
      requestAnimationFrame(tick);
      if (half <= 0) { measure(); return; }
      var dt = prevTime ? Math.min((now - prevTime) / 1000, 0.05) : 0;
      prevTime = now;
      if (dragging) return;
      if (Math.abs(velocity) > 8) {       /* 指を離したあとの惰性 */
        offset += velocity * dt;
        velocity *= Math.pow(0.06, dt);   /* 1秒で約6%まで減衰 */
      } else {
        velocity = 0;
        if (!reduceMotion) offset += speed * dir * dt;
      }
      normalize();
      apply();
    }
    requestAnimationFrame(tick);

    /* 指でもマウスでも回せるようにする。
       touch-action: pan-y をCSSで指定してあるので、縦スワイプはページのスクロールに渡る。 */
    band.addEventListener('pointerdown', function (e) {
      dragging = true; velocity = 0;
      startX = lastX = e.clientX; startOffset = offset; lastT = e.timeStamp;
      band.setPointerCapture(e.pointerId);
      band.classList.add('is-dragging');
    });
    band.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      offset = startOffset - (e.clientX - startX);
      normalize();
      apply();
      var dt = (e.timeStamp - lastT) / 1000;
      if (dt > 0) velocity = Math.max(-2600, Math.min(2600, -(e.clientX - lastX) / dt));
      lastX = e.clientX; lastT = e.timeStamp;
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      band.classList.remove('is-dragging');
    }
    band.addEventListener('pointerup', endDrag);
    band.addEventListener('pointercancel', endDrag);
    band.addEventListener('pointerleave', endDrag);
  });

})();
