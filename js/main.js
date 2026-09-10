/* ==========================================================================
   Firm Foundation — shared UI
   Nav toggle and booking tabs. No dependencies.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- Nav -- */
  function initNav() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('site-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });

    // Close the mobile menu on Escape, and return focus to the button.
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
      toggle.focus();
    });

    // If the viewport grows past the breakpoint, drop the open state so the
    // desktop nav isn't left in a half-toggled condition.
    var wide = window.matchMedia('(min-width: 801px)');
    var onChange = function (e) {
      if (!e.matches) return;
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
    };
    if (wide.addEventListener) wide.addEventListener('change', onChange);
    else if (wide.addListener) wide.addListener(onChange);
  }

  /* --------------------------------------------------------------- Tabs -- */
  /* Exposed as FF.initTabs so the Firestore-rendered booking page can call it
     again after it swaps in real tutor data. */
  function initTabs(listSelector) {
    var list = document.querySelector(listSelector || '[role="tablist"]');
    if (!list) return;

    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;

    function select(tab, setFocus) {
      tabs.forEach(function (t) {
        var selected = t === tab;
        t.setAttribute('aria-selected', String(selected));
        t.tabIndex = selected ? 0 : -1;

        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !selected;
      });
      if (setFocus) tab.focus();
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () { select(tab, false); });

      tab.addEventListener('keydown', function (e) {
        var i = tabs.indexOf(tab);
        var next = null;

        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') next = tabs[0];
        else if (e.key === 'End') next = tabs[tabs.length - 1];
        else return;

        e.preventDefault();
        select(next, true);
      });
    });

    // Deep links like booking.html#james open that tutor's panel.
    var hash = window.location.hash.replace('#', '');
    if (hash) {
      var target = tabs.filter(function (t) {
        return t.id === 'tab-' + hash || t.getAttribute('aria-controls') === 'panel-' + hash;
      })[0];
      if (target) select(target, false);
    }
  }

  /* ------------------------------------------------------------- Public -- */
  window.FF = window.FF || {};
  window.FF.initTabs = initTabs;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    initNav();
    initTabs('#booking-tabs');
  });
})();
