/* Yoav Rosenberg — kinetic type (homepage only).

   The homepage is about acting, so it performs its own copy instead of
   just laying it out. The hero re-take is pure CSS animation and needs
   nothing from this file. What lives here is the optional layer:

     1. the replay button — restarts the hero performance
     2. director's notes — margin annotations that fade in on scroll
     3. the generic take — pain lines that strike themselves out

   All progressive enhancement. Without this file the page is finished,
   readable text; the CSS only hides the notes once `js-kinetic` confirms
   JS is actually running. Reduced motion is handled in CSS. */
(function () {
  'use strict';

  /* Synchronous, before first paint: the CSS keys the notes' hidden state
     off this class, so setting it late would flash them into view. */
  document.documentElement.classList.add('js-kinetic');

  function reduced() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* =====================================================================
     REPLAY — "עוד טייק".
     Restarting a CSS animation means taking the element out of the
     animation entirely, forcing a reflow, then putting it back.
     ===================================================================== */
  function initReplay() {
    var wrap = document.querySelector('[data-retake]');
    if (!wrap) return;
    var btn = wrap.querySelector('[data-retake-again]');
    if (!btn) return;

    var parts = wrap.querySelectorAll('.rt-1, .rt-cutline, .rt-w, .rt-l1, .rt-l2');
    if (!parts.length) return;

    btn.addEventListener('click', function () {
      if (reduced()) return;   /* nothing to replay — CSS shows take 2 only */
      Array.prototype.forEach.call(parts, function (el) { el.style.animation = 'none'; });
      void wrap.offsetWidth;   /* reflow: drops the finished animation state */
      Array.prototype.forEach.call(parts, function (el) { el.style.animation = ''; });
    });
  }

  /* =====================================================================
     SCROLL BEATS — director's notes and the struck-out generic take.
     One observer, one shot each.
     ===================================================================== */
  function initScrollBeats() {
    var notes = Array.prototype.slice.call(document.querySelectorAll('[data-note]'));
    var lists = Array.prototype.slice.call(document.querySelectorAll('[data-strike-list]'));
    if (!notes.length && !lists.length) return;

    function strikeAll(list, stagger) {
      Array.prototype.forEach.call(list.children, function (li, i) {
        if (!stagger) { li.classList.add('struck'); return; }
        setTimeout(function () { li.classList.add('struck'); }, 260 + i * 420);
      });
    }

    if (!('IntersectionObserver' in window)) {
      notes.forEach(function (n) { n.classList.add('in'); });
      lists.forEach(function (l) { strikeAll(l, false); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        if (e.target.hasAttribute('data-strike-list')) {
          /* strike the lines in sequence, so it reads as someone working
             down the list rather than one flash */
          strikeAll(e.target, !reduced());
        } else {
          e.target.classList.add('in');
        }
      });
    }, { threshold: 0.35, rootMargin: '0px 0px -8% 0px' });

    notes.forEach(function (n) { io.observe(n); });
    lists.forEach(function (l) { io.observe(l); });
  }

  function boot() {
    try { initReplay(); } catch (err) { /* hero already played from CSS */ }
    try { initScrollBeats(); } catch (err) { /* copy stays intact */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
