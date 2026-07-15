/*
 * Kerala Ayurveda "Is this right for me?" fit-check — storefront runtime.
 *
 * Vanilla JS (no framework) so it drops into any Shopify theme. It mirrors the
 * Next.js prototype's flow and calls the SAME recommendation API contract
 * (POST FitCheckAnswers -> { recommendation }). Add-to-cart uses Shopify's AJAX
 * Cart API (/cart/add.js). Motion is CSS-driven and respects prefers-reduced-motion.
 */
(function () {
  'use strict';

  // Mirror of src/lib/fit-check/questions.ts (kept small + portable). A product
  // can override the goal set via the custom.fit_check_goals metafield. This
  // module-level array is never mutated — each FitCheck instance works on its
  // own clone (see questionSet below).
  var QUESTIONS = [
    {
      id: 'goals', type: 'multi', min: 1, max: 4,
      title: 'What are you hoping ashwagandha helps with?',
      why: 'Telling us your goal lets us tailor the dose, timing, and what to expect.',
      options: [
        { value: 'stress', label: 'Stress & feeling calmer' },
        { value: 'sleep', label: 'Better sleep' },
        { value: 'energy', label: 'Steady energy & less fatigue' },
        { value: 'focus', label: 'Focus & mental stamina' },
        { value: 'recovery', label: 'Exercise recovery & strength' },
        { value: 'mood', label: 'Mood balance' }
      ]
    },
    {
      id: 'stress', type: 'single',
      title: 'How would you describe your stress right now?',
      why: "Ashwagandha's most-studied benefit is for everyday stress.",
      options: [
        { value: 'rare', label: 'Rarely stressed' },
        { value: 'occasional', label: 'Occasional spikes' },
        { value: 'frequent', label: 'Frequently wired or on-edge' },
        { value: 'constant', label: 'Constantly overwhelmed' }
      ]
    },
    {
      id: 'experience', type: 'single',
      title: 'Have you taken adaptogens or ashwagandha before?',
      why: 'This tells us whether to suggest a first full cycle or a larger pack.',
      options: [
        { value: 'new', label: 'New to it' },
        { value: 'some', label: 'Tried some' },
        { value: 'regular', label: 'Take it regularly' }
      ]
    },
    {
      id: 'safety', type: 'safety',
      title: 'A few quick safety checks',
      why: "Ashwagandha isn't right for everyone. We'd rather be honest than make a sale.",
      toggles: [
        { flag: 'pregnancyOrNursing', label: 'Are you pregnant, breastfeeding, or trying to conceive?' },
        { flag: 'thyroidOrAutoimmune', label: 'Do you have a thyroid or autoimmune condition, or take thyroid medication?' },
        { flag: 'sedativesOrLiver', label: 'Do you take sedatives/sleep meds, or have a liver or GI condition?' }
      ]
    },
    {
      id: 'form', type: 'single',
      title: 'Capsules or powder?',
      why: 'Capsules are tasteless and pre-measured; powder lets you adjust the dose.',
      options: [
        { value: 'capsule', label: 'Capsules' },
        { value: 'powder', label: 'Powder' },
        { value: 'no-preference', label: 'Not sure — recommend one' }
      ]
    },
    {
      id: 'dose', type: 'single',
      title: 'How often would you like to take it?',
      why: "A single morning dose is simplest; a second dose adds evening wind-down.",
      options: [
        { value: 'once', label: 'Once a day' },
        { value: 'twice', label: 'Twice a day' },
        { value: 'no-preference', label: 'Whatever works best' }
      ]
    }
  ];

  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      if (k === 'class') el.className = attrs[k];
      else if (k === 'html') el.innerHTML = attrs[k];
      else if (k === 'text') el.textContent = attrs[k];
      else el.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) el.appendChild(c); });
    return el;
  }

  function money(cents) {
    return '$' + (cents / 100).toFixed(2);
  }

  // State keys for single-selects: form/dose store their preferences under the
  // API field names. Reads AND writes must agree (highlight + Back both rely
  // on it); buildAnswers reads the same keys.
  function answerKey(q) {
    if (q.id === 'form') return 'formPreference';
    if (q.id === 'dose') return 'dosePreference';
    return q.id;
  }

  function FitCheck(root) {
    var configEl = root.querySelector('[data-ka-config]');
    var config = JSON.parse(configEl.textContent);

    // Per-instance clone of the questions so a goalOverride on this block
    // never clobbers other FitCheck blocks on the same page.
    var questionSet = QUESTIONS.map(function (q) {
      var copy = Object.assign({}, q);
      if (q.options) copy.options = q.options.slice();
      if (q.toggles) copy.toggles = q.toggles.slice();
      return copy;
    });
    if (config.goalOverride && Array.isArray(config.goalOverride)) {
      questionSet[0].options = config.goalOverride;
    }

    var mount = root.querySelector('[data-ka-mount]');
    var state = { step: 0, answers: { goals: [], safety: {} } };
    var panelEl = null;   // .ka-modal__panel — persistent close (X) lives here
    var bodyEl = null;    // re-rendered content region inside the panel
    var lastFocused = null;
    var advanceTimer = null;

    root.querySelector('[data-ka-open]').addEventListener('click', open);

    function open() {
      lastFocused = document.activeElement;
      state = { step: 0, answers: { goals: [], safety: {} } };
      mount.hidden = false;
      mount.innerHTML = '';
      var overlay = h('div', { class: 'ka-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Ashwagandha fit-check' });
      var panel = h('div', { class: 'ka-modal__panel', tabindex: '-1' });
      var closeBtn = h('button', { class: 'ka-modal__close', type: 'button', 'aria-label': 'Close fit check', text: '✕' });
      closeBtn.addEventListener('click', close);
      var body = h('div', { class: 'ka-modal__body' });
      panel.appendChild(closeBtn);
      panel.appendChild(body);
      overlay.appendChild(panel);
      overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
      document.addEventListener('keydown', onKeydown);
      mount.appendChild(overlay);
      panelEl = panel;
      bodyEl = body;
      renderStep();
      // Move focus into the dialog; close() restores it to the launcher.
      panel.focus();
    }

    function onKeydown(e) {
      if (e.key === 'Escape') { close(); return; }
      // Minimal focus trap: keep Tab / Shift+Tab inside the dialog.
      if (e.key !== 'Tab' || !panelEl) return;
      var focusables = panelEl.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])');
      if (!focusables.length) { e.preventDefault(); panelEl.focus(); return; }
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      var active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !panelEl.contains(active)) { e.preventDefault(); last.focus(); }
      } else if (active === last || !panelEl.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    }

    function close() {
      clearTimeout(advanceTimer);
      mount.hidden = true;
      mount.innerHTML = '';
      panelEl = null;
      bodyEl = null;
      document.removeEventListener('keydown', onKeydown);
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
      lastFocused = null;
    }

    // done=true renders the completed header used on the result screen:
    // full bar, "Your fit check" label, and no step-skip link.
    function header(done) {
      var pct = done ? 100 : Math.round((state.step / questionSet.length) * 100);
      var bar = h('div', { class: 'ka-progress' }, [
        h('div', { class: 'ka-progress__fill', style: 'width:' + pct + '%' })
      ]);
      var children = [
        h('span', { class: 'ka-step', text: done ? 'Your fit check' : 'Step ' + (state.step + 1) + ' of ' + questionSet.length })
      ];
      if (!done) {
        var skip = h('button', { class: 'ka-skip', type: 'button', text: 'Just show me the product' });
        skip.addEventListener('click', function () {
          close();
          var buy = document.querySelector('form[action*="/cart/add"], .product-form, [data-ka-buy]');
          if (buy) buy.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        children.push(skip);
      }
      bodyEl.appendChild(h('div', { class: 'ka-modal__top' }, children));
      bodyEl.appendChild(bar);
    }

    function renderStep() {
      if (!bodyEl) return;
      bodyEl.innerHTML = '';
      header(false);
      var q = questionSet[state.step];
      bodyEl.appendChild(h('h2', { class: 'ka-q__title', text: q.title }));

      var why = h('button', { class: 'ka-why', type: 'button', text: 'Why we ask' });
      var whyText = h('p', { class: 'ka-why__text', text: q.why, hidden: 'hidden' });
      why.addEventListener('click', function () { whyText.hidden = !whyText.hidden; });
      bodyEl.appendChild(why);
      bodyEl.appendChild(whyText);

      if (q.type === 'safety') renderSafety(q);
      else renderChoices(q);
    }

    function renderChoices(q) {
      var wrap = h('div', { class: 'ka-choices' });
      var key = answerKey(q);
      q.options.forEach(function (opt) {
        var selected = q.type === 'multi'
          ? state.answers.goals.indexOf(opt.value) > -1
          : state.answers[key] === opt.value;
        var btn = h('button', { class: 'ka-choice' + (selected ? ' is-selected' : ''), type: 'button' }, [
          h('span', { class: 'ka-choice__label', text: opt.label }),
          h('span', { class: 'ka-choice__check', text: '✓' })
        ]);
        btn.addEventListener('click', function () {
          if (q.type === 'multi') {
            var i = state.answers.goals.indexOf(opt.value);
            if (i > -1) state.answers.goals.splice(i, 1);
            else if (state.answers.goals.length < q.max) state.answers.goals.push(opt.value);
            renderStep();
          } else {
            state.answers[key] = opt.value;
            renderStep(); // re-render so the choice highlights before advancing
            clearTimeout(advanceTimer);
            advanceTimer = setTimeout(next, 220);
          }
        });
        wrap.appendChild(btn);
      });
      bodyEl.appendChild(wrap);
      if (q.type === 'multi') {
        var nextBtn = h('button', { class: 'ka-next', type: 'button', text: 'Continue' });
        nextBtn.disabled = state.answers.goals.length < q.min;
        nextBtn.addEventListener('click', function () {
          state.answers.primaryGoal = state.answers.goals[0];
          next();
        });
        bodyEl.appendChild(nextBtn);
      }
      backButton();
    }

    function renderSafety(q) {
      var wrap = h('div', { class: 'ka-safety' });
      q.toggles.forEach(function (t) {
        var on = !!state.answers.safety[t.flag];
        var row = h('div', { class: 'ka-safety__row' }, [
          h('span', { class: 'ka-safety__label', text: t.label }),
          h('div', { class: 'ka-toggle' }, [
            mkToggle('No', !on, function () { state.answers.safety[t.flag] = false; renderStep(); }),
            mkToggle('Yes', on, function () { state.answers.safety[t.flag] = true; renderStep(); })
          ])
        ]);
        wrap.appendChild(row);
      });
      bodyEl.appendChild(wrap);
      var done = h('button', { class: 'ka-next', type: 'button', text: 'Continue' });
      done.disabled = q.toggles.some(function (t) { return state.answers.safety[t.flag] === undefined; });
      done.addEventListener('click', next);
      bodyEl.appendChild(done);
      backButton();
    }

    function mkToggle(label, active, onClick) {
      var b = h('button', { class: 'ka-toggle__btn' + (active ? ' is-active' : ''), type: 'button', text: label });
      b.addEventListener('click', onClick);
      return b;
    }

    function backButton() {
      if (state.step === 0) return;
      var back = h('button', { class: 'ka-back', type: 'button', text: '← Back' });
      back.addEventListener('click', function () {
        clearTimeout(advanceTimer);
        state.step--;
        renderStep();
      });
      bodyEl.appendChild(back);
    }

    function next() {
      if (state.step < questionSet.length - 1) {
        state.step++;
        renderStep();
      } else {
        submit();
      }
    }

    function buildAnswers() {
      var a = state.answers;
      return {
        goals: a.goals,
        primaryGoal: a.primaryGoal || a.goals[0],
        stressLevel: a.stress,
        experience: a.experience,
        safety: {
          pregnancyOrNursing: !!a.safety.pregnancyOrNursing,
          thyroidOrAutoimmune: !!a.safety.thyroidOrAutoimmune,
          sedativesOrLiver: !!a.safety.sedativesOrLiver
        },
        formPreference: a.formPreference || 'no-preference',
        dosePreference: a.dosePreference || 'no-preference'
      };
    }

    function submit() {
      var skeletonTimer = setTimeout(function () { renderSkeleton(); }, 350);

      fetch(config.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(buildAnswers())
      })
        .then(function (r) {
          if (!r.ok) throw new Error('bad status ' + r.status);
          return r.json();
        })
        .then(function (data) {
          clearTimeout(skeletonTimer);
          renderResult(data.recommendation);
        })
        .catch(function () {
          clearTimeout(skeletonTimer);
          renderError();
        });
    }

    function renderSkeleton() {
      if (!bodyEl) return;
      bodyEl.innerHTML = '';
      bodyEl.appendChild(h('p', { class: 'ka-loading', role: 'status', text: 'Finding your match…' }));
      var sk = h('div', { class: 'ka-skeleton' });
      for (var i = 0; i < 4; i++) sk.appendChild(h('div', { class: 'ka-skeleton__row' }));
      bodyEl.appendChild(sk);
    }

    function renderError() {
      if (!bodyEl) return;
      bodyEl.innerHTML = '';
      bodyEl.appendChild(h('p', { class: 'ka-error', role: 'alert', text: 'Something went wrong building your recommendation.' }));
      var retry = h('button', { class: 'ka-next', type: 'button', text: 'Try again' });
      retry.addEventListener('click', submit);
      bodyEl.appendChild(retry);
    }

    function renderResult(rec) {
      if (!bodyEl) return;
      bodyEl.innerHTML = '';
      header(true);

      if (rec.outcome === 'caution') {
        panelEl.classList.add('is-caution');
        bodyEl.appendChild(h('h2', { class: 'ka-result__verdict', text: rec.copy.verdictHeadline }));
        bodyEl.appendChild(h('p', { class: 'ka-result__sub', text: rec.copy.verdictSubcopy }));
        var ul = h('ul', { class: 'ka-reasons' });
        rec.copy.reasons.forEach(function (r) { ul.appendChild(h('li', { text: r })); });
        bodyEl.appendChild(ul);
        if (rec.cautionNote) bodyEl.appendChild(h('p', { class: 'ka-caution-note', text: rec.cautionNote }));
        return;
      }

      panelEl.classList.remove('is-caution');
      bodyEl.appendChild(h('h2', { class: 'ka-result__verdict', text: rec.copy.verdictHeadline }));
      bodyEl.appendChild(h('p', { class: 'ka-result__sub', text: rec.copy.verdictSubcopy }));

      if (config.showMeter && rec.matchScore) {
        var meter = h('div', { class: 'ka-meter' }, [
          h('div', { class: 'ka-meter__fill', style: 'width:0%' }),
          h('span', { class: 'ka-meter__label', text: rec.matchStrength + ' match' })
        ]);
        bodyEl.appendChild(meter);
        requestAnimationFrame(function () {
          meter.querySelector('.ka-meter__fill').style.width = rec.matchScore + '%';
        });
      }

      var ul2 = h('ul', { class: 'ka-reasons' });
      rec.copy.reasons.forEach(function (r) { ul2.appendChild(h('li', { text: r })); });
      bodyEl.appendChild(ul2);

      if (rec.protocol) {
        bodyEl.appendChild(h('p', { class: 'ka-protocol', text: rec.protocol.summary }));
      }

      if (rec.offer) {
        // The merchant's "Default the recommendation to Subscribe & Save"
        // toggle gates whether a subscription recommendation is honored.
        var subscribe = rec.offer.sellingMode === 'subscription' && config.subscriptionDefault !== false;
        var offer = h('div', { class: 'ka-offer' }, [
          h('p', { class: 'ka-offer__pack', text: 'Recommended: ' + rec.offer.recommendedPackLabel }),
          h('p', { class: 'ka-offer__mode', text: subscribe ? 'Subscribe & save — cancel anytime' : 'One-time purchase' }),
          h('p', { class: 'ka-offer__reason', text: rec.offer.reasonForPack })
        ]);
        var addBtn = h('button', { class: 'ka-add', type: 'button', text: 'Add recommended pack to cart' });
        addBtn.addEventListener('click', function () { addToCart(rec.offer, subscribe, addBtn); });
        offer.appendChild(addBtn);
        bodyEl.appendChild(offer);
      }

      if (config.disclaimer) bodyEl.appendChild(h('div', { class: 'ka-disclaimer', html: config.disclaimer }));
    }

    function addToCart(offer, subscribe, btn) {
      // recommendedPackLabel is "Form · Pack" (e.g. "Capsules · 2 Bottles").
      var parts = offer.recommendedPackLabel.split(' · ');
      var form = parts[0];
      var pack = parts[1];
      var variant = config.product.variants.filter(function (v) {
        return v.available && v.option1 === form && v.option2 === pack;
      })[0] || config.product.variants.filter(function (v) { return v.available; })[0];

      if (!variant) { btn.textContent = 'Currently unavailable'; return; }

      btn.disabled = true;
      btn.textContent = 'Adding…';
      var payload = { items: [{ id: variant.id, quantity: 1 }] };
      if (subscribe && offer.sellingPlanId) {
        // Subscription lines carry the selling plan on the AJAX Cart payload.
        // NOTE: the id the recommend API returns is illustrative — in a real
        // store, map it to the store-specific selling_plan id created by the
        // subscriptions app (e.g. Appstle).
        payload.items[0].selling_plan = offer.sellingPlanId;
      }

      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(function (r) { if (!r.ok) throw new Error('cart'); return r.json(); })
        .then(function () {
          btn.textContent = 'Added ✓';
          document.dispatchEvent(new CustomEvent('ka:added', { detail: { variant: variant.id } }));
          // Themes commonly listen for this to refresh the cart drawer:
          document.dispatchEvent(new CustomEvent('cart:refresh'));
        })
        .catch(function () {
          btn.disabled = false;
          btn.textContent = 'Try again';
          btn.classList.add('is-error');
        });
    }
  }

  function init() {
    document.querySelectorAll('.ka-fitcheck').forEach(function (root) {
      if (!root.dataset.kaInit) { root.dataset.kaInit = '1'; new FitCheck(root); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  // Re-init when merchant edits the block in the Theme Editor.
  document.addEventListener('shopify:section:load', init);
})();
