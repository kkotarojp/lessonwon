/* レッスンWON v3 — ページ間ワイプ遷移 / プリローダー / リビール / モバイルメニュー */
(function () {
  'use strict';

  var wipe = null;   /* 2026-10-27: ページ間の幕(ワイプ)はやめた。リンクは普通に即移動する。#wipe の要素は残っているが使わない */
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
      /* リンク・とじるボタン・パネルの外側(背景)のどれを押しても閉じる */
      if (e.target.closest('a') || e.target.closest('[data-menu-close]') || !e.target.closest('.mmenu__panel')) setMenu(false);
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

  /* ---------- FVのアーチロゴ:肉球を文字の位置に置く ----------
     全角スペースを目印にして、その文字の座標と傾きを取り、そこへ肉球を重ねる。
     フォントが変わっても位置がずれない。JSが動かなくても文字は読める。 */
  var arch = document.getElementById('fvArch');
  if (arch) {
    var SVGNS = 'http://www.w3.org/2000/svg';
    function placePaws() {
      var old = arch.querySelectorAll('.fv__arch-paw');
      Array.prototype.forEach.call(old, function (el) { el.remove(); });
      var texts = arch.querySelectorAll('text[data-paw]');
      Array.prototype.forEach.call(texts, function (t) {
        var sym = t.getAttribute('data-paw');
        var ratio = parseFloat(t.getAttribute('data-paw-size')) || 1;
        var fs = parseFloat(getComputedStyle(t).fontSize) || 0;
        var size = fs * ratio;
        var idx = t.getAttribute('data-paw-at').split(',');
        idx.forEach(function (s) {
          var i = parseInt(s, 10);
          var a, b, rot;
          try {
            a = t.getStartPositionOfChar(i);
            b = t.getEndPositionOfChar(i);
            rot = t.getRotationOfChar(i);
          } catch (e) { return; }
          var u = document.createElementNS(SVGNS, 'use');
          u.setAttribute('href', '#' + sym);
          u.setAttribute('width', size);
          u.setAttribute('height', size);
          /* 基線の少し上に、文字と同じ大きさで置く */
          u.setAttribute('x', -size / 2);
          u.setAttribute('y', -fs * 0.36 - size / 2);
          u.setAttribute('transform', 'translate(' + ((a.x + b.x) / 2).toFixed(2) + ',' +
            ((a.y + b.y) / 2).toFixed(2) + ') rotate(' + rot.toFixed(2) + ')');
          u.setAttribute('class', 'fv__arch-paw');
          arch.appendChild(u);
        });
      });
    }
    placePaws();
    /* Webフォントの読み込みで文字幅が変わるため、読み込み後にもう一度置き直す */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(placePaws);
    window.addEventListener('resize', placePaws);
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
    var speed = 44;                       /* px/秒。上下とも同じ速さ(向きだけ逆) */

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

  /* ---------- お知らせ ----------
     ・/news/ は4件以上のとき3件ぶんの高さで止めて中をスクロール
     ・トップのロゴ下の1行は /news/ の最新1件から自分で埋める(編集箇所を1つにするため) */
  var newsBox = document.getElementById('newsScroll');
  if (newsBox) {
    var items = newsBox.querySelectorAll('.news__item');
    if (items.length > 3) {
      var cap = function () {
        newsBox.style.maxHeight = '';
        newsBox.classList.remove('is-capped');
        var top = newsBox.getBoundingClientRect().top;
        var h = Math.round(items[2].getBoundingClientRect().bottom - top);
        newsBox.style.maxHeight = h + 'px';
        newsBox.classList.add('is-capped');
      };
      var markEnd = function () {
        var end = newsBox.scrollTop + newsBox.clientHeight >= newsBox.scrollHeight - 2;
        newsBox.classList.toggle('is-end', end);
      };
      var capAll = function () { cap(); markEnd(); };
      capAll();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(capAll);
      window.addEventListener('resize', capAll);
      newsBox.addEventListener('scroll', markEnd);
    }
  }

  var pill = document.querySelector('.fv__news');
  if (pill && !newsBox) {
    /* トップページ: /news/ の一番上の1件を読んで文言を差し替える。
       取れなければHTMLに書いてある文言のまま(壊れない) */
    fetch(pill.getAttribute('href'), { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (html) {
        if (!html) return;
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var first = doc.querySelector('.news__item .news__body');
        if (!first) { pill.hidden = true; return; }
        var txt = pill.querySelector('.fv__news-text');
        if (txt) txt.textContent = first.textContent.trim().split('。')[0] + '。';
      })
      .catch(function () {});
  }

})();


/* ---------- 案内役: スクロールで今の場所に合わせて一言 ----------
   見出し(h2)の文言から、言うことを決める。マークアップは触らず、JSが組み立てる。
   PC(1024px〜)だけ。閉じたらセッション中は出さない。 */
(function wonGuide() {
  var mqG = window.matchMedia('(min-width: 1024px)');
  if (!mqG.matches) { mqG.addEventListener && mqG.addEventListener('change', function (e) { if (e.matches) location.reload(); }, { once: true }); return; }
  try { if (sessionStorage.getItem('won_guide_off') === '1') return; } catch (e) {}
  var heads = Array.prototype.slice.call(document.querySelectorAll('main h2'));
  if (heads.length < 2) return;

  /* 看板犬の桃太郎のセリフ。上からにならないよう「ぼく」の目線で、やわらかく */
  /* 看板犬の桃太郎のセリフ。お客さま向けなので丁寧に、吹き出し1行に収まる長さ(16文字+絵文字まで)で */
  var LINES = [
    ['サービスのご案内', 'まずは、この3つからどうぞ'],
    ['静かな家', 'はじめてご利用の方は、こちら'],
    ['お客様の声', 'ご利用いただいた方の声です'],
    ['ご利用の流れ', 'ご利用の流れは、この3つです'],
    ['料金', '料金は、すべてこちらです'],
    ['特徴', 'レッスンWONの特徴です'],
    ['お悩み', 'お悩みがあれば、ご相談ください'],
    ['こんなとき', 'こんなときに、どうぞ'],
    ['お預かりについて', 'まずは「仮お泊まり」からどうぞ'],
    ['一時預かり', '数時間だけのご利用もできます'],
    ['キャンセル', 'こちらも、ご一読ください'],
    ['よくあるご質問', '気になることは、こちらに'],
    ['コース', 'コースのちがいは、こちら'],
    ['社会化', '幼稚園に通う理由です'],
    ['対応エリア', '対応エリアは、こちらです'],
    ['プロフィール', '担当の訓練士をご紹介します']
  ];
  function lineFor(h) {
    var t = h.textContent;
    for (var i = 0; i < LINES.length; i++) if (t.indexOf(LINES[i][0]) !== -1) return LINES[i][1];
    return '';
  }
  var targets = heads.map(function (h) { return { el: h.closest('section') || h, line: lineFor(h) }; })
                     .filter(function (t) { return t.line; });
  if (targets.length < 2) return;

  var base = document.querySelector('.brand') ? (document.querySelector('.brand').getAttribute('href') || './') : './';
  base = base.replace(/index\.html$/, '');
  var box = document.createElement('div');
  box.className = 'guide';
  box.innerHTML = '<img class="guide__img" src="' + base + 'assets/img/mascot/momotaro-point-256.webp" alt="" width="92" height="92">' +
                  '<div class="guide__bubble"><b class="guide__name">看板犬の桃太郎</b><span class="guide__text"></span><button class="guide__close" type="button" aria-label="案内を閉じる">×</button></div>';
  document.body.appendChild(box);
  var text = box.querySelector('.guide__text');
  var current = null, shown = false, timer = null;

  function say(t) {
    if (t === current) return;
    current = t;
    if (timer) clearTimeout(timer);
    box.classList.add('is-swap');
    timer = setTimeout(function () {
      text.textContent = t;
      box.classList.remove('is-swap');
      box.classList.remove('is-hop'); void box.offsetWidth; box.classList.add('is-hop');
      timer = null;
    }, 220);
    if (!shown) { shown = true; box.classList.add('is-on'); }
  }
  /* 「読んでいる場所」= 画面の上から45%の線を最後に通過したセクション。
     まだどのセクションも線に届いていなければ(FVの間は)出さない */
  function pick() {
    var line = window.innerHeight * 0.45, best = null;
    for (var i = 0; i < targets.length; i++) {
      var r = targets[i].el.getBoundingClientRect();
      if (r.top <= line && r.bottom > 80) best = targets[i];
    }
    if (best) say(best.line);
    else if (shown) { box.classList.remove('is-on'); shown = false; current = null; }
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { pick(); ticking = false; });
  }, { passive: true });
  box.querySelector('.guide__close').addEventListener('click', function () {
    box.classList.remove('is-on');
    try { sessionStorage.setItem('won_guide_off', '1'); } catch (e) {}
    setTimeout(function () { box.remove(); }, 500);
  });
  pick();
})();
