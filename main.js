/* Yoav Rosenberg — site interactions (shared across all pages).
   Plain vanilla JS: site config + WhatsApp wiring, sticky header,
   mobile menu, nav dropdowns, reveal-on-scroll, testimonials carousel,
   and a layer of tasteful motion (progress bar, hero tilt/parallax,
   hover micro-interactions). All motion respects prefers-reduced-motion. */
(function () {
  'use strict';

  function prefersReduced() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function canHover() {
    return !!(window.matchMedia && window.matchMedia('(hover: hover)').matches);
  }

  /* =====================================================================
     SITE CONFIG — single source of truth.
       whatsapp  : digits only, international format, no + or spaces
       phone     : human-readable, used for click-to-call (tel:)
       instagram : full profile URL
     ===================================================================== */
  var SITE = window.SITE = {
    whatsapp: '972526202541',
    phone: '+972-52-620-2541',
    instagram: 'https://www.instagram.com/yoav_ros/',
    waDefaultMsg: 'היי יואב, הגעתי דרך האתר ואשמח לשמוע פרטים על הסדנאות.',
    /* booking: paste Yoav's scheduler link (Calendly / Setmore event URL) to
       enable barbershop-style online booking on the audition-prep page.
       Yoav controls working hours and which slots are open in that account.
       Empty string = the WhatsApp fallback stays. */
    booking: '',
  };

  /* Wire every WhatsApp trigger. Markup: <a data-wa> or
     <a data-wa data-wa-msg="custom prefilled text">…</a> */
  function wireWhatsApp() {
    var digits = (SITE.whatsapp || '').replace(/\D/g, '');
    document.querySelectorAll('[data-wa]').forEach(function (el) {
      var msg = el.getAttribute('data-wa-msg') || SITE.waDefaultMsg;
      var href = 'https://wa.me/' + digits + '?text=' + encodeURIComponent(msg);
      el.setAttribute('href', href);
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener');
    });
    /* tel: / instagram helpers */
    document.querySelectorAll('[data-tel]').forEach(function (el) {
      if (SITE.phone) el.setAttribute('href', 'tel:' + SITE.phone.replace(/[^\d+]/g, ''));
    });
    document.querySelectorAll('[data-instagram]').forEach(function (el) {
      if (SITE.instagram) {
        el.setAttribute('href', SITE.instagram);
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener');
      }
    });
  }

  /* =====================================================================
     FX stylesheet — injected so all motion is progressive enhancement.
     Lives behind html.js-fx; fully neutralised under reduced-motion.
     ===================================================================== */
  var FX_CSS = [
    /* reveal: fade + rise via transition (overrides the inline rise anim) */
    'html.js-fx .reveal{opacity:0;transform:translateY(24px);transition:opacity .9s cubic-bezier(.16,.84,.44,1),transform .9s cubic-bezier(.16,.84,.44,1);}',
    'html.js-fx .reveal.in{opacity:1;transform:none;animation:none!important;}',
    /* scroll progress hairline */
    '#scroll-progress{position:fixed;top:0;left:0;right:0;height:2px;z-index:60;background:#A95142;transform:scaleX(0);transform-origin:right center;will-change:transform;}',
    /* hero portrait */
    'html.js-fx .fx-tilt{transition:transform .3s cubic-bezier(.16,.84,.44,1);will-change:transform;}',
    /* workshop / teaser rows slide on hover */
    'html.js-fx [data-row]>div{transition:transform .5s cubic-bezier(.16,.84,.44,1);}',
    'html.js-fx [data-row]:hover>div{transform:translateX(-8px);}',
    /* outline buttons: subtle lift (the filled .btn-primary carries its own
       hover scale + shadow in tw.css) */
    'html.js-fx a.btn-ghost{transition:background-color .5s,color .5s,transform .35s cubic-bezier(.16,.84,.44,1);}',
    'html.js-fx a.btn-ghost:hover{transform:translateY(-1px);}',
    /* dropdown menu pop-in */
    '@keyframes fx-pop{from{opacity:0;transform:translateY(-6px);}to{opacity:1;transform:none;}}',
    /* bridge the visual gap between toggle and panel with an invisible strip,
       so travelling down to the links never fires mouseleave on the group */
    'nav [data-dropdown]>[data-dropdown-menu]::before{content:"";position:absolute;left:0;right:0;bottom:100%;height:1.25rem;}',
    /* media slider: hide scrollbar (still scrollable) */
    '[data-slider]::-webkit-scrollbar{display:none;}',
    '[data-slider]{-ms-overflow-style:none;}',
    /* section hairline rules draw in from the right (RTL) when revealed */
    'html.js-fx [data-draw]{transform:scaleX(0);transform-origin:right center;transition:transform 1.1s cubic-bezier(.16,.84,.44,1);}',
    'html.js-fx [data-draw].drawn{transform:scaleX(1);}',
    /* headline lines: cinematic clip wipe-up, staggered */
    'html.js-fx [data-line]{display:block;clip-path:inset(0 0 110% 0);transform:translateY(0.3em);opacity:0;transition:clip-path 1s cubic-bezier(.16,.84,.44,1),transform 1s cubic-bezier(.16,.84,.44,1),opacity .8s ease;}',
    'html.js-fx [data-line].lit{clip-path:inset(-0.15em 0 -0.15em 0);transform:none;opacity:1;}',
    /* reduced-motion: strip every enhancement back to a static, visible state */
    '@media (prefers-reduced-motion: reduce){',
    '  html.js-fx .reveal{opacity:1!important;transform:none!important;transition:none!important;}',
    '  #scroll-progress{display:none;}',
    '  html.js-fx [data-row]:hover>div{transform:none;}',
    '  html.js-fx [data-draw]{transform:none!important;}',
    '  html.js-fx [data-line]{clip-path:none!important;transform:none!important;opacity:1!important;}',
    '  html.js-fx a.btn-ghost:hover{transform:none;box-shadow:none;}',
    '}'
  ].join('\n');

  function injectFXStyles() {
    document.documentElement.classList.add('js-fx');
    var s = document.createElement('style');
    s.id = 'fx-styles';
    s.textContent = FX_CSS;
    document.head.appendChild(s);
  }

  /* =====================================================================
     Sticky header: swap to blurred paper after a small scroll.
     Mobile menu: toggle + morph the hamburger into an X.
     ===================================================================== */
  function initHeader() {
    var header = document.getElementById('site-header');
    if (!header) return;
    var SCROLLED = ['bg-paper/85', 'backdrop-blur-md', 'border-b', 'border-charcoal/10', 'py-4'];
    function onScroll() {
      var scrolled = window.scrollY > 20;
      header.classList.toggle('bg-transparent', !scrolled);
      header.classList.toggle('py-7', !scrolled);
      SCROLLED.forEach(function (c) { header.classList.toggle(c, scrolled); });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Mobile menu toggle */
    var toggle = document.getElementById('menu-toggle');
    var menu = document.getElementById('mobile-menu');
    if (toggle && menu) {
      var ICON_MENU = toggle.innerHTML;
      var ICON_CLOSE = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>';
      function setMenu(open) {
        menu.classList.toggle('hidden', !open);
        menu.classList.toggle('flex', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.innerHTML = open ? ICON_CLOSE : ICON_MENU;
      }
      toggle.addEventListener('click', function () { setMenu(menu.classList.contains('hidden')); });
      /* close the whole menu when a real nav link is tapped — but NOT when the
         dropdown toggle is tapped (that just expands the sub-list). */
      menu.querySelectorAll('a:not([data-dropdown-toggle])').forEach(function (a) {
        a.addEventListener('click', function () { setMenu(false); });
      });
    }
  }

  /* =====================================================================
     Nav dropdowns ("הסדנאות"). Generic: any [data-dropdown] wrapper with a
     [data-dropdown-toggle] and a [data-dropdown-menu]. Opens on hover for
     pointer devices, on click/tap everywhere, closes on outside-click /
     Escape, rotates an optional [data-chevron], and pops in subtly.
     ===================================================================== */
  function initDropdowns() {
    var hover = canHover();
    var reduce = prefersReduced();
    document.querySelectorAll('[data-dropdown]').forEach(function (dd) {
      var toggle = dd.querySelector('[data-dropdown-toggle]');
      var menu = dd.querySelector('[data-dropdown-menu]');
      if (!toggle || !menu) return;
      var chevron = toggle.querySelector('[data-chevron]');
      var open = false;
      function setOpen(v) {
        open = v;
        menu.classList.toggle('hidden', !v);
        toggle.setAttribute('aria-expanded', String(v));
        if (chevron) chevron.classList.toggle('rotate-180', v);
        if (v && !reduce) { menu.style.animation = 'fx-pop .25s cubic-bezier(.16,.84,.44,1)'; }
        else { menu.style.animation = ''; }
      }
      setOpen(false);
      toggle.addEventListener('click', function (e) {
        /* hover devices: let the link navigate (hover already opens the menu).
           touch / no-hover: first tap opens the menu instead of navigating. */
        if (hover) return;
        e.preventDefault();
        setOpen(!open);
      });
      if (hover) {
        /* Close on a short delay: the panel sits a few px below the toggle, so
           the pointer briefly leaves `dd` on the way down. Closing instantly
           would make the links unreachable. Re-entering cancels the close. */
        var closeTimer = null;
        function cancelClose() { if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; } }
        dd.addEventListener('mouseenter', function () { cancelClose(); setOpen(true); });
        dd.addEventListener('mouseleave', function () {
          cancelClose();
          closeTimer = setTimeout(function () { closeTimer = null; setOpen(false); }, 320);
        });
        /* keyboard users get the same menu: focus opens, leaving the group closes */
        dd.addEventListener('focusin', function () { cancelClose(); setOpen(true); });
        dd.addEventListener('focusout', function (e) {
          if (!dd.contains(e.relatedTarget)) setOpen(false);
        });
      }
      dd.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && open) { setOpen(false); toggle.focus(); }
      });
      document.addEventListener('click', function (e) {
        if (open && !dd.contains(e.target)) setOpen(false);
      });
      /* closing a sub-link should also collapse the dropdown */
      menu.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () { setOpen(false); });
      });
    });
  }

  /* =====================================================================
     Scroll progress hairline at the very top of the page.
     ===================================================================== */
  function initProgress() {
    if (prefersReduced()) return;
    var bar = document.createElement('div');
    bar.id = 'scroll-progress';
    document.body.appendChild(bar);
    function update() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? (window.scrollY || h.scrollTop) / max : 0;
      bar.style.transform = 'scaleX(' + Math.max(0, Math.min(1, p)) + ')';
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* =====================================================================
     Hero portrait: gentle pointer tilt (hover devices) + scroll parallax,
     with a baseline scale so edges never gap inside the clipped frame.
     ===================================================================== */
  function initHero() {
    var imgs = document.querySelectorAll('img[src*="yoav-portrait"]');
    if (!imgs.length) return;
    var reduce = prefersReduced();
    var hover = canHover();
    imgs.forEach(function (img) {
      img.classList.add('fx-tilt');
      var wrap = img.parentElement;
      if (wrap) { wrap.style.perspective = '900px'; wrap.style.overflow = 'hidden'; }
      var rx = 0, ry = 0, py = 0;
      function apply() {
        img.style.transform = 'scale(1.04) translateY(' + py + 'px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
      }
      apply();
      if (hover && !reduce) {
        img.addEventListener('mousemove', function (e) {
          var r = img.getBoundingClientRect();
          ry = ((e.clientX - r.left) / r.width - 0.5) * 5;
          rx = -((e.clientY - r.top) / r.height - 0.5) * 5;
          apply();
        });
        img.addEventListener('mouseleave', function () { rx = 0; ry = 0; apply(); });
      }
      if (!reduce) {
        window.addEventListener('scroll', function () {
          var r = img.getBoundingClientRect();
          var mid = r.top + r.height / 2;
          var off = (mid - window.innerHeight / 2) / window.innerHeight;
          py = Math.max(-8, Math.min(8, off * -16));
          apply();
        }, { passive: true });
      }
    });
  }

  /* =====================================================================
     Hero video: the framed loop is the hero's focal image. The poster shows
     immediately (so it's never empty), and the muted loop fades in over it
     once it can play. Plays for everyone; only Save-Data keeps the poster.
     ===================================================================== */
  function initHeroVideo() {
    var box = document.querySelector('[data-hero-video]');
    if (!box) return;
    var video = box.querySelector('video');
    if (!video) return;

    /* always reveal the element — its poster gives a static image even
       when we never load the moving video. */
    video.style.opacity = '1';

    /* The hero loop plays for everyone (slow, muted, small file). Only
       Save-Data keeps the static poster instead of downloading the video. */
    var conn = navigator.connection || {};
    if (conn.saveData) return;

    var src = video.getAttribute('data-src');
    if (!src) return;
    video.src = src;
    video.load();
    video.addEventListener('canplay', function () {
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    }, { once: true });
    /* pause when the hero scrolls out of view to save battery/CPU */
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { var q = video.play(); if (q && q.catch) q.catch(function () {}); }
          else { video.pause(); }
        });
      }, { threshold: 0.05 });
      io.observe(box);
    }
  }

  /* =====================================================================
     Draw-in section hairlines: the thin "flex-1 h-px" rules inside section
     eyebrows animate their width when scrolled into view (RTL origin).
     ===================================================================== */
  function initDraw() {
    if (prefersReduced()) return;
    var rules = Array.from(document.querySelectorAll('span.flex-1.h-px, span.h-px.flex-1'));
    if (!rules.length) return;
    rules.forEach(function (el) { el.setAttribute('data-draw', ''); });
    function draw(el) { el.classList.add('drawn'); }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { draw(e.target); io.unobserve(e.target); } });
      }, { threshold: 0.6 });
      rules.forEach(function (el) { io.observe(el); });
      setTimeout(function () { rules.forEach(draw); }, 2800);
    } else {
      rules.forEach(draw);
    }
  }

  /* =====================================================================
     Center-focus carousel: [data-carousel] is a horizontal scroll-snap
     track of .cf-slide items. The slide nearest the track's horizontal
     center gets .is-active (scaled up, sharp); the rest stay dimmed/small.
     Clicking a non-centered slide scrolls it to center (instead of firing
     its action), so the whole thing is drag/tap driven — no arrows needed.
     ===================================================================== */
  function initMediaCarousel() {
    var tracks = Array.from(document.querySelectorAll('[data-carousel]'));
    if (!tracks.length) return;
    var reduce = prefersReduced();

    tracks.forEach(function (track) {
      /* `all` mirrors the track's real DOM order — no clones. Once the
         centered slide reaches either end, recycle() moves the far node
         across to the opposite side (and shifts scrollLeft by exactly one
         slide-width to compensate) so playback keeps going in one
         direction without ever showing the same file twice at once. */
      var all = Array.from(track.querySelectorAll('.cf-slide'));
      if (all.length < 2) return;

      function unit() {
        var gap = parseFloat(getComputedStyle(track).gap || getComputedStyle(track).columnGap || '16') || 16;
        return all[0].offsetWidth + gap;
      }
      /* dynamic side padding so ANY slide can sit dead-center at any width */
      function pad() {
        var p = Math.max(0, (track.clientWidth - all[0].offsetWidth) / 2);
        track.style.paddingLeft = p + 'px';
        track.style.paddingRight = p + 'px';
      }

      function centerX() { return track.scrollLeft + track.clientWidth / 2; }
      function activeSlide() {
        var mid = centerX(), best = null, bd = Infinity;
        all.forEach(function (s) {
          var c = s.offsetLeft + s.offsetWidth / 2, d = Math.abs(c - mid);
          if (d < bd) { bd = d; best = s; }
        });
        return best;
      }
      function markActive() {
        var best = activeSlide();
        all.forEach(function (s) { s.classList.toggle('is-active', s === best); });
        return best;
      }
      function centerOn(slide, smooth) {
        var target = slide.offsetLeft + slide.offsetWidth / 2 - track.clientWidth / 2;
        track.scrollTo({ left: target, behavior: smooth ? 'smooth' : 'auto' });
      }
      /* once we've settled with the first or last slide centered, rotate
         its opposite neighbor across so there's always a next slide */
      function recycle() {
        var active = activeSlide(), u = unit();
        if (active === all[all.length - 1]) {
          var first = all.shift();
          all.push(first);
          track.appendChild(first);
          track.scrollLeft -= u;
        } else if (active === all[0]) {
          var last = all.pop();
          all.unshift(last);
          track.insertBefore(last, track.firstChild);
          track.scrollLeft += u;
        }
        markActive();
      }

      var raf = null;
      track.addEventListener('scroll', function () {
        if (raf) return;
        raf = requestAnimationFrame(function () { markActive(); raf = null; });
      }, { passive: true });

      /* recycle once scrolling (autoplay or manual drag) has settled */
      var scrollSettle = null;
      track.addEventListener('scroll', function () {
        clearTimeout(scrollSettle);
        scrollSettle = setTimeout(recycle, 150);
      }, { passive: true });

      /* No autoplay (Yoav's request, Aug 24): the strip moves only when the
         visitor drags it, taps a slide, or uses the arrows. */
      function advance(dir) {
        var i = all.indexOf(activeSlide()) + (dir || 1);
        centerOn(all[(i + all.length) % all.length], true);
      }

      /* -----------------------------------------------------------------
         Controls — arrows only (Yoav asked to drop the "3 / 10" counter).
         Built here rather than in the markup so all the carousels stay
         in sync.
         ----------------------------------------------------------------- */
      var ARROW = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>';
      var ctls = document.createElement('div');
      ctls.className = 'cf-ctls';
      ctls.setAttribute('dir', 'ltr');
      /* mirror the track's own gutters so the controls line up with content */
      ['px-6', 'sm:px-12'].forEach(function (c) {
        if (track.classList.contains(c)) ctls.classList.add(c);
      });
      ctls.innerHTML =
        '<button type="button" class="cf-ctl" data-cf-prev aria-label="הקודם">' + ARROW + '</button>' +
        '<button type="button" class="cf-ctl" data-cf-next aria-label="הבא" style="transform:rotate(180deg)">' + ARROW + '</button>';
      track.parentNode.insertBefore(ctls, track.nextSibling);

      ctls.querySelector('[data-cf-prev]').addEventListener('click', function () { advance(-1); });
      ctls.querySelector('[data-cf-next]').addEventListener('click', function () { advance(1); });

      /* click a non-centered slide → go to it (override the generic handler) */
      track.addEventListener('click', function (e) {
        var s = e.target.closest('.cf-slide');
        if (s && !s.classList.contains('is-active')) {
          e.preventDefault(); e.stopPropagation();
          centerOn(s, true);
        }
      }, true);

      function setup() {
        pad();
        centerOn(all[0], false);
        markActive();
      }
      setup();
      setTimeout(setup, 300);          /* re-run after layout/fonts settle */
      window.addEventListener('load', setup);
      window.addEventListener('resize', function () { pad(); centerOn(activeSlide(), false); });
    });
  }

  /* =====================================================================
     YouTube lightbox: any [data-yt="VIDEO_ID"] opens a centered overlay
     that plays the video. Closes on backdrop click / Escape / X. The
     iframe is created on open and destroyed on close (nothing loads until
     clicked — keeps the page light).
     ===================================================================== */
  function initYouTube() {
    var triggers = Array.from(document.querySelectorAll('[data-yt]'));
    if (!triggers.length) return;

    var overlay = document.createElement('div');
    overlay.id = 'yt-lightbox';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:200;display:none;align-items:center;justify-content:center;background:rgba(26,26,26,.86);padding:5vw;opacity:0;transition:opacity .3s ease;';
    overlay.innerHTML =
      '<button aria-label="סגור" data-yt-close style="position:absolute;top:20px;left:20px;width:44px;height:44px;display:grid;place-items:center;background:transparent;border:1px solid rgba(255,255,255,.35);color:#fff;cursor:pointer;">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg></button>' +
      '<div style="height:min(86vh,720px);aspect-ratio:9/16;max-width:100%;background:#000;"><div data-yt-slot style="width:100%;height:100%;"></div></div>';
    document.body.appendChild(overlay);
    var slot = overlay.querySelector('[data-yt-slot]');

    function open(id) {
      if (!id) return;
      slot.innerHTML = '<iframe width="100%" height="100%" src="https://www.youtube-nocookie.com/embed/' + id +
        '?autoplay=1&rel=0" title="YouTube" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
      overlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function () { overlay.style.opacity = '1'; });
      overlay.setAttribute('aria-hidden', 'false');
    }
    function close() {
      overlay.style.opacity = '0';
      document.body.style.overflow = '';
      overlay.setAttribute('aria-hidden', 'true');
      setTimeout(function () { overlay.style.display = 'none'; slot.innerHTML = ''; }, 300);
    }
    triggers.forEach(function (t) {
      t.addEventListener('click', function () { open(t.getAttribute('data-yt')); });
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target.closest('[data-yt-close]')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.style.display === 'flex') close();
    });
  }

  /* =====================================================================
     Image lightbox: any [data-img-lightbox] opens a centered overlay with
     the full-size image (its href). Same open/close pattern as the
     YouTube lightbox above, swapped for an <img>.
     ===================================================================== */
  function initImageLightbox() {
    var triggers = Array.from(document.querySelectorAll('[data-img-lightbox]'));
    if (!triggers.length) return;

    var overlay = document.createElement('div');
    overlay.id = 'img-lightbox';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:200;display:none;align-items:center;justify-content:center;background:rgba(26,26,26,.9);padding:5vw;opacity:0;transition:opacity .3s ease;';
    overlay.innerHTML =
      '<button aria-label="סגור" data-img-close style="position:absolute;top:20px;left:20px;width:44px;height:44px;display:grid;place-items:center;background:transparent;border:1px solid rgba(255,255,255,.35);color:#fff;cursor:pointer;">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg></button>' +
      '<img data-img-slot alt="" style="max-height:88vh;max-width:100%;width:auto;box-shadow:0 30px 80px -20px rgba(0,0,0,.6);" />';
    document.body.appendChild(overlay);
    var slot = overlay.querySelector('[data-img-slot]');

    function open(src, alt) {
      if (!src) return;
      slot.src = src;
      slot.alt = alt || '';
      overlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function () { overlay.style.opacity = '1'; });
      overlay.setAttribute('aria-hidden', 'false');
    }
    function close() {
      overlay.style.opacity = '0';
      document.body.style.overflow = '';
      overlay.setAttribute('aria-hidden', 'true');
      setTimeout(function () { overlay.style.display = 'none'; slot.src = ''; }, 300);
    }
    triggers.forEach(function (t) {
      t.addEventListener('click', function (e) {
        e.preventDefault();
        var img = t.querySelector('img');
        open(t.getAttribute('data-img-lightbox') || (img && img.src), img && img.alt);
      });
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target.closest('[data-img-close]')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.style.display === 'flex') close();
    });
  }

  /* =====================================================================
     Lazy clips: [data-clip] videos load + play only while in view (paused
     otherwise). Save-Data keeps the poster. Keeps the page light.
     ===================================================================== */
  function initClips() {
    var clips = Array.from(document.querySelectorAll('video[data-clip]'));
    if (!clips.length) return;
    var conn = navigator.connection || {};
    if (conn.saveData || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          if (!v.src) { v.src = v.getAttribute('data-src'); v.load(); }
          var p = v.play(); if (p && p.catch) p.catch(function () {});
        } else if (v.src) { v.pause(); }
      });
    }, { threshold: 0.25 });
    clips.forEach(function (v) { io.observe(v); });
  }

  /* =====================================================================
     Headline wipe-in: [data-line] spans reveal with a clip wipe + stagger,
     shortly after load. Reduced-motion shows them instantly (handled in CSS).
     ===================================================================== */
  function initHeadline() {
    var lines = Array.from(document.querySelectorAll('[data-line]'));
    if (!lines.length) return;
    lines.forEach(function (el, i) {
      setTimeout(function () { el.classList.add('lit'); }, 180 + i * 140);
    });
  }

  /* =====================================================================
     Count-up: any [data-count="120"] animates 0→target when scrolled in.
     Optional [data-count-suffix] (e.g. "+") is appended. Reduced-motion
     just writes the final value.
     ===================================================================== */
  function initCountUp() {
    var els = Array.from(document.querySelectorAll('[data-count]'));
    if (!els.length) return;
    var reduce = prefersReduced();
    function run(el) {
      var target = parseFloat(el.getAttribute('data-count')) || 0;
      var suffix = el.getAttribute('data-count-suffix') || '';
      if (reduce) { el.textContent = target + suffix; return; }
      var dur = 1500, start = null;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3); /* easeOutCubic */
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
      }, { threshold: 0.5 });
      els.forEach(function (el) { io.observe(el); });
    } else {
      els.forEach(run);
    }
  }

  /* =====================================================================
     Magnetic buttons: [data-magnetic] gently leans toward the cursor on
     hover devices. Pure transform, snaps back on leave. Skipped under
     reduced-motion / touch.
     ===================================================================== */
  function initMagnetic() {
    if (prefersReduced() || !canHover()) return;
    document.querySelectorAll('[data-magnetic]').forEach(function (el) {
      el.style.transition = 'transform .25s cubic-bezier(.16,.84,.44,1)';
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var mx = (e.clientX - r.left) / r.width - 0.5;
        var my = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'translate(' + (mx * 10) + 'px,' + (my * 8) + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = 'translate(0,0)'; });
    });
  }

  /* =====================================================================
     Tag anchor "rows" (teaser + workshop list items that wrap a grid) so
     CSS can give them a hover slide without touching the markup.
     ===================================================================== */
  function tagRows() {
    document.querySelectorAll('a.group').forEach(function (a) {
      var grid = a.querySelector(':scope > div.grid');
      if (grid) a.setAttribute('data-row', '');
    });
  }

  /* =====================================================================
     Reveal-on-scroll: fade + rise, auto-staggered for grouped siblings.
     Above-fold shows immediately, the rest on intersection, 2.6s fallback.
     ===================================================================== */
  function initReveal() {
    var reduce = prefersReduced();
    var els = Array.from(document.querySelectorAll('.reveal'));
    /* stagger: delay each reveal by its index among reveal-siblings */
    els.forEach(function (el) {
      var parent = el.parentElement;
      if (!parent) return;
      var sibs = Array.from(parent.children).filter(function (c) {
        return c.classList && c.classList.contains('reveal');
      });
      if (sibs.length > 1) {
        el.style.transitionDelay = Math.min(sibs.indexOf(el) * 80, 320) + 'ms';
      }
    });
    function show(el) { el.classList.add('in'); }
    if (reduce) { els.forEach(show); return; }
    var vh = window.innerHeight;
    els.forEach(function (el) { if (el.getBoundingClientRect().top < vh * 0.9) show(el); });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      els.forEach(function (el) { if (!el.classList.contains('in')) io.observe(el); });
      setTimeout(function () { els.forEach(show); }, 2600);
    } else {
      els.forEach(show);
    }
  }

  /* =====================================================================
     Testimonials carousel (only on pages with #tq-quote): crossfade,
     autoplay (pauses on hover/focus), and touch swipe.
     ===================================================================== */
  function initCarousel() {
    var quote = document.getElementById('tq-quote');
    if (!quote) return;
    /* Reviews come from an embedded JSON block (#tq-data) when present —
       keeps the copy in the HTML — otherwise this built-in fallback set. */
    var reviews = [
      { text: 'הסדנה של יואב גרמה לי לחשוב אחרת על משחק ולבטא את עצמי בצורה הכי טהורה ואותנטית.', name: 'תמיר אביעד', role: 'שחקן' },
      { text: 'אחרי שנים של פחד מאודישנים, לראשונה נכנסתי לחדר עם כלים ברורים ותחושת שליטה. זה שינה הכל.', name: 'נועה ברק', role: 'שחקנית' },
      { text: 'יואב יודע לראות בדיוק מה עוצר אותך — ולתת לך את המפתח לשחרר את זה. ליווי נדיר ואמיתי.', name: 'דניאל מזרחי', role: 'שחקן' },
    ];
    var dataEl = document.getElementById('tq-data');
    if (dataEl) {
      try {
        var parsed = JSON.parse(dataEl.textContent);
        if (Array.isArray(parsed) && parsed.length) reviews = parsed;
      } catch (e) { /* keep fallback on bad JSON */ }
    }
    var len = reviews.length;
    var idx = 0;
    var reduce = prefersReduced();
    var elText = document.getElementById('tq-text');
    var elName = document.getElementById('tq-name');
    var elRole = document.getElementById('tq-role');
    var elCounter = document.getElementById('tq-counter');
    var fadeTargets = [elText, elName, elRole].filter(Boolean);
    fadeTargets.forEach(function (el) {
      el.style.transition = 'opacity .45s ease, transform .45s cubic-bezier(.16,.84,.44,1)';
    });
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };

    /* optional dot indicators (#tq-dots): one button per review */
    var dotsWrap = document.getElementById('tq-dots');
    var dots = [];
    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      reviews.forEach(function (r, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'המלצה ' + (i + 1));
        b.className = 'w-2.5 h-2.5 rounded-full border border-gold transition-colors duration-300';
        b.addEventListener('click', function () { idx = i; render(); start(); });
        dotsWrap.appendChild(b);
        dots.push(b);
      });
    }
    function syncDots() {
      dots.forEach(function (b, i) {
        b.classList.toggle('bg-gold', i === idx);
        b.classList.toggle('bg-transparent', i !== idx);
      });
    }

    function paint() {
      var r = reviews[idx];
      if (elText) elText.textContent = r.text;
      if (elName) elName.textContent = r.name;
      if (elRole) elRole.textContent = r.role;
      if (elCounter) elCounter.textContent = pad(idx + 1) + ' / ' + pad(len);
      syncDots();
    }
    function render() {
      if (reduce) { paint(); return; }
      fadeTargets.forEach(function (el) { el.style.opacity = '0'; el.style.transform = 'translateY(8px)'; });
      setTimeout(function () {
        paint();
        fadeTargets.forEach(function (el) { el.style.opacity = '1'; el.style.transform = 'none'; });
      }, 220);
    }

    var timer = null;
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function start() { stop(); if (!reduce) timer = setInterval(function () { idx = (idx + 1) % len; render(); }, 6500); }
    function go(d) { idx = (idx + d + len) % len; render(); start(); }

    var next = document.getElementById('tq-next');
    var prev = document.getElementById('tq-prev');
    if (next) next.addEventListener('click', function () { go(1); });
    if (prev) prev.addEventListener('click', function () { go(-1); });

    /* pause on hover/focus, swipe on touch */
    var fig = quote.closest('figure') || quote.parentElement;
    if (fig) {
      fig.addEventListener('mouseenter', stop);
      fig.addEventListener('mouseleave', start);
      fig.addEventListener('focusin', stop);
      fig.addEventListener('focusout', start);
      var x0 = null;
      fig.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      fig.addEventListener('touchend', function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0;
        x0 = null;
        if (Math.abs(dx) < 40) return;
        go(dx < 0 ? 1 : -1);   /* RTL: swipe left → next */
      }, { passive: true });
    }

    paint();
    start();
  }

  /* =====================================================================
     Online booking ([data-booking], audition-prep page): when SITE.booking
     is configured, swap the WhatsApp fallback for the scheduler iframe.
     ===================================================================== */
  function initBooking() {
    var slot = document.querySelector('[data-booking]');
    if (!slot || !SITE.booking) return;
    var fb = slot.querySelector('[data-booking-fallback]');
    if (fb) fb.remove();
    var frame = document.createElement('iframe');
    frame.src = SITE.booking;
    frame.title = 'קביעת תור';
    frame.loading = 'lazy';
    frame.style.cssText = 'width:100%;height:680px;border:0;background:#fff;';
    slot.appendChild(frame);
  }

  /* ---- init ---- */
  wireWhatsApp();
  initBooking();
  injectFXStyles();
  initHeader();
  initDropdowns();
  initProgress();
  initHero();
  initHeroVideo();
  initClips();
  initMediaCarousel();
  initYouTube();
  initImageLightbox();
  initHeadline();
  initDraw();
  initCountUp();
  initMagnetic();
  tagRows();
  initReveal();
  initCarousel();
})();
