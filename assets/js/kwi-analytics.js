/* ============================================================
   KWI-ANALYTICS v1  ·  Kuroiwa / KWI Capital AG
   Consent Mode v2 + Google Tag Manager + Event/Conversion-Layer
   + Microsoft Clarity (Heatmaps / Session-Maps / AI-Insights)
   ------------------------------------------------------------
   >>> HIER DEINE IDs EINTRAGEN — bis dahin bleibt alles inaktiv <<<
   ============================================================ */
(function () {
  var CFG = {
    gtm:     'GTM-KFHC6SKX',   // Google Tag Manager Container-ID
    clarity: 'XXXXXXXXXX'     // Microsoft Clarity Projekt-ID
    // GA4 (G-XXXX) und Google Ads (AW-XXXX) werden IM GTM konfiguriert (siehe Anleitung)
  };
  var isSet = function (v) { return v && v.indexOf('XXXX') === -1; };

  window.dataLayer = window.dataLayer || [];
  function dl(o) { window.dataLayer.push(o); }
  function gtag() { window.dataLayer.push(arguments); }
  function ready(fn) { document.readyState !== 'loading' ? fn() : document.addEventListener('DOMContentLoaded', fn); }

  /* ---------- Google Tag Manager (erst mit echter ID) ---------- */
  (function loadGTM() {
    if (!isSet(CFG.gtm)) return;
    (function (w, d, s, l, i) {
      w[l] = w[l] || []; w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
      var f = d.getElementsByTagName(s)[0], j = d.createElement(s), dlp = l != 'dataLayer' ? '&l=' + l : '';
      j.async = true; j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dlp;
      f.parentNode.insertBefore(j, f);
    })(window, document, 'script', 'dataLayer', CFG.gtm);
  })();

  /* ---------- Consent ---------- */
  var KEY = 'kwi-consent';
  function getConsent() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function setConsent(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function grant() {
    gtag('consent', 'update', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' });
    dl({ event: 'consent_update', consent_state: 'granted' });
    loadClarity();
  }
  function deny() {
    gtag('consent', 'update', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' });
    dl({ event: 'consent_update', consent_state: 'denied' });
  }

  /* ---------- Microsoft Clarity (nur mit ID + Zustimmung) ---------- */
  var clarityLoaded = false;
  function loadClarity() {
    if (clarityLoaded || !isSet(CFG.clarity)) return;
    clarityLoaded = true;
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', CFG.clarity);
  }

  /* ---------- Consent-Banner ---------- */
  function injectStyle() {
    var css = '#kwi-cc{position:fixed;left:16px;right:16px;bottom:16px;z-index:99999;max-width:720px;margin:0 auto;' +
      'background:#0c0b0b;color:#e9e9e9;border:1px solid rgba(255,255,255,.12);border-radius:14px;' +
      'box-shadow:0 24px 70px rgba(0,0,0,.6);font-family:"Helvetica Neue",Arial,sans-serif;overflow:hidden}' +
      '#kwi-cc .in{padding:18px 20px}' +
      '#kwi-cc p{margin:0 0 14px;font-size:13px;line-height:1.6;color:#cfcfcf}' +
      '#kwi-cc a{color:#e0574a;text-decoration:underline}' +
      '#kwi-cc .btns{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}' +
      '#kwi-cc button{cursor:pointer;border-radius:9px;padding:11px 20px;font-size:13px;font-weight:700;letter-spacing:.3px;border:1px solid transparent}' +
      '#kwi-cc .deny{background:transparent;color:#cfcfcf;border-color:rgba(255,255,255,.18)}' +
      '#kwi-cc .ok{background:#c1272d;color:#fff}' +
      '#kwi-cc .bar{height:4px;background:#c1272d}';
    var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
  }
  function banner() {
    var prev = getConsent();
    if (prev) { prev === 'granted' ? grant() : deny(); return; }
    injectStyle();
    var b = document.createElement('div'); b.id = 'kwi-cc';
    b.innerHTML =
      '<div class="bar"></div><div class="in">' +
      '<p>Wir setzen Cookies und Analyse-/Marketing-Dienste ein (Google Analytics, Google Ads, Microsoft Clarity), ' +
      'um unsere Website zu verbessern und Reichweite zu messen. Ihre Einwilligung ist freiwillig und jederzeit widerrufbar. ' +
      'Details im <a href="/impressum.html">Datenschutz</a>.</p>' +
      '<div class="btns"><button class="deny" type="button">Nur notwendige</button>' +
      '<button class="ok" type="button">Akzeptieren</button></div></div>';
    document.body.appendChild(b);
    b.querySelector('.ok').onclick = function () { setConsent('granted'); grant(); b.remove(); };
    b.querySelector('.deny').onclick = function () { setConsent('denied'); deny(); b.remove(); };
  }

  /* ---------- Event- / Conversion-Tracking ---------- */
  function track(name, params) { dl(Object.assign({ event: name }, params || {})); }
  function labelOf(el) { return ((el.getAttribute('aria-label') || el.textContent || '').trim()).slice(0, 80); }

  function wire() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a,button'); if (!a) return;
      var href = a.getAttribute('href') || '';
      if (href.indexOf('mailto:') === 0)               track('contact_click', { method: 'email', label: href.replace('mailto:', '') });
      else if (href.indexOf('tel:') === 0)             track('contact_click', { method: 'phone', label: href.replace('tel:', '') });
      else if (/wa\.me|whatsapp/.test(href))           track('contact_click', { method: 'whatsapp' });
      else if (/\.(pdf|vcf)(\?|$)/i.test(href))        track('file_download', { file: href });
      else if (href.indexOf('study.html') > -1)        track('study_view', { study: labelOf(a) });
      else if (a.matches && a.matches('.nav-cta,.cta a,.cta-nav,.link-lux,.btn,.btn-primary'))
                                                       track('cta_click', { cta_label: labelOf(a) });
      else if (a.tagName === 'A' && a.hostname && a.hostname !== location.hostname && href.indexOf('#') !== 0)
                                                       track('outbound_click', { url: href });
    }, true);

    document.addEventListener('submit', function (e) {
      track('generate_lead', { form_id: (e.target && e.target.id) || 'form' });
    }, true);

    var marks = [25, 50, 75, 90], hit = {};
    window.addEventListener('scroll', function () {
      var h = document.documentElement, sp = h.scrollTop || document.body.scrollTop, max = h.scrollHeight - h.clientHeight;
      if (max <= 0) return; var pct = Math.round(sp / max * 100);
      marks.forEach(function (m) { if (pct >= m && !hit[m]) { hit[m] = 1; track('scroll_depth', { percent: m }); } });
    }, { passive: true });
  }

  ready(function () { wire(); banner(); });
})();
