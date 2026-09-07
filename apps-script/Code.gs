/**
 * KWI Capital AG — Lead-Endpoint + Mini-CRM + täglicher KPI-Report  (v1)
 * ======================================================================
 * Setup wie bei Kuroiwa: Code einfügen → Dienste(+): AnalyticsData →
 * Zeitzone Europe/Zurich → setup() ausführen → Bereitstellen als Web-App
 * (Ausführen als: Ich · Zugriff: Jeder) → /exec-URL an Claude.
 * NACH ÄNDERUNGEN: Cmd+S + «Bereitstellungen verwalten → ✏️ → Neue Version».
 */

var VERSION = 'v1';
var CONFIG = {
  EMPFAENGER: 'kaito@kwicapital.ch',
  ABSENDER: 'kaito@kwicapital.ch',
  ABSENDER_NAME: 'KWI Capital AG',
  GA4_PROPERTY_ID: '552602431',       // kwicapital-GA4-Property
  REPORT_STUNDE: 7
};
var INK = '#0b0b0c', PAPER = '#f6f5f2', ROT = '#c0271f', GRAU = '#8d8b86';

function doGet() { return ContentService.createTextOutput('KWI Backend ' + VERSION + ' — Lead-Endpoint aktiv'); }

function doPost(e) {
  try {
    var p = (e && e.parameter) || {};
    if (p._gotcha) return _json({ ok: true });
    if (!p.email || !p.name || !p.nachricht) return _json({ ok: false, fehler: 'Pflichtfelder fehlen' });
    _sheet().appendRow([new Date(), p.name, p.email, p.telefon || '', p.anliegen || '', p.nachricht, 'neu']);

    var wa = String(p.telefon || '').replace(/[^0-9]/g, '');
    if (wa.charAt(0) === '0') wa = '41' + wa.slice(1);

    var inhalt =
      '<p style="margin:0 0 6px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:' + ROT + ';font-weight:bold">Neuer Lead &middot; ' + _esc(p.anliegen || 'Anfrage') + '</p>' +
      '<h1 style="margin:0 0 22px;font-family:Georgia,serif;font-weight:normal;font-size:28px;color:' + INK + '">' + _esc(p.name) + '</h1>' +
      '<table cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;color:#333">' +
      _zeile('E-Mail', '<a href="mailto:' + _esc(p.email) + '" style="color:' + INK + ';font-weight:bold;text-decoration:none">' + _esc(p.email) + '</a>') +
      _zeile('Telefon', p.telefon ? '<b>' + _esc(p.telefon) + '</b>' : '&mdash;') +
      _zeile('Eingang', '<b>' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd.MM.yyyy · HH:mm') + '</b>') +
      '</table>' +
      '<div style="margin:24px 0;padding:18px 22px;background:' + PAPER + ';border-left:3px solid ' + ROT + ';font-size:15px;line-height:1.65;color:#222;white-space:pre-wrap">' + _esc(p.nachricht) + '</div>' +
      '<table cellpadding="0" cellspacing="0"><tr>' + _btn('mailto:' + p.email, 'Antworten', true) +
      (p.telefon ? _btn('tel:' + String(p.telefon).replace(/\s/g, ''), 'Anrufen', false) : '') +
      (wa ? _btn('https://wa.me/' + wa, 'WhatsApp', false) : '') + '</tr></table>';

    GmailApp.sendEmail(CONFIG.EMPFAENGER, 'Lead: ' + (p.anliegen || 'Anfrage') + ' — ' + p.name, '', {
      name: CONFIG.ABSENDER_NAME, from: CONFIG.ABSENDER, replyTo: p.email,
      htmlBody: _rahmen(inhalt, 'Lead-Log: <a href="' + _sheetUrl() + '" style="color:' + GRAU + '">Spreadsheet «KWI Leads»</a>')
    });

    var antwort =
      '<p style="margin:0 0 18px;font-family:Georgia,serif;font-size:22px;color:' + INK + '">Guten Tag ' + _esc(p.name) + '</p>' +
      '<p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#333">Vielen Dank für Ihre Anfrage — sie ist bei uns eingegangen. Sie erhalten in der Regel <b>innert 24 Stunden</b> eine persönliche Rückmeldung.</p>' +
      '<p style="margin:26px 0 12px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:' + GRAU + ';font-weight:bold">Es eilt? Sie erreichen mich direkt:</p>' +
      '<table cellpadding="0" cellspacing="0"><tr>' + _btn('tel:+41792522570', 'Direkt anrufen — 079 252 25 70', true) +
      _btn('https://wa.me/41792522570?text=' + encodeURIComponent('Guten Tag Herr Weingart, ich habe soeben eine Anfrage über kwicapital.ch gesendet.'), 'WhatsApp', false) + '</tr></table>' +
      '<p style="margin:26px 0 18px;font-size:15px;color:#333">Freundliche Grüsse</p>' + _signatur();
    GmailApp.sendEmail(p.email, 'Ihre Anfrage bei KWI Capital', '', {
      name: CONFIG.ABSENDER_NAME, from: CONFIG.ABSENDER, replyTo: CONFIG.EMPFAENGER,
      htmlBody: _rahmen(antwort, 'Diese E-Mail kann vertrauliche Informationen enthalten. Sollten Sie nicht der richtige Adressat sein, informieren Sie bitte den Absender und löschen Sie diese E-Mail.<br>KWI Capital AG &middot; Schwerzistrasse 34 &middot; CH-8807 Freienbach &middot; CHE-221.054.296 &middot; <a href="https://kwicapital.ch" style="color:' + GRAU + '">kwicapital.ch</a>')
    });
    return _json({ ok: true, version: VERSION });
  } catch (err) { return _json({ ok: false, fehler: String(err) }); }
}

function dailyReport() {
  var gestern = _datum(-1);
  var inhalt = '<p style="margin:0 0 6px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:' + ROT + ';font-weight:bold">Täglicher KPI-Report</p>' +
    '<h1 style="margin:0 0 24px;font-family:Georgia,serif;font-weight:normal;font-size:26px;color:' + INK + '">' + gestern + '</h1>';
  var sh = _sheet(), daten = sh.getDataRange().getValues();
  var lg = 0, lt = Math.max(0, daten.length - 1);
  for (var i = 1; i < daten.length; i++)
    if (Utilities.formatDate(new Date(daten[i][0]), Session.getScriptTimeZone(), 'yyyy-MM-dd') === gestern) lg++;
  inhalt += _kpi('Leads gestern', lg + ' <span style="color:' + GRAU + '">(total ' + lt + ')</span>');
  var zusatz = lg + ' Leads';
  if (CONFIG.GA4_PROPERTY_ID) {
    try {
      var prop = 'properties/' + CONFIG.GA4_PROPERTY_ID;
      var kern = AnalyticsData.Properties.runReport({
        dateRanges: [{ startDate: 'yesterday', endDate: 'yesterday' }, { startDate: '8daysAgo', endDate: '2daysAgo' }],
        metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'engagementRate' }, { name: 'averageSessionDuration' }, { name: 'keyEvents' }]
      }, prop);
      var g = _reihe(kern, 0), w = _reihe(kern, 1);
      inhalt += _kpi('Sessions / Nutzer', g[0] + ' / ' + g[1] + ' <span style="color:' + GRAU + '">(7-Tage-Ø: ' + Math.round(w[0] / 7) + '/Tag)</span>');
      inhalt += _kpi('Engagement-Rate', (parseFloat(g[2]) * 100).toFixed(0) + '% <span style="color:' + GRAU + '">· Ø ' + Math.round(parseFloat(g[3])) + 's</span>');
      inhalt += _kpi('Key Events', g[4]);
      zusatz = g[0] + ' Sessions · ' + zusatz;
      var q = AnalyticsData.Properties.runReport({
        dateRanges: [{ startDate: 'yesterday', endDate: 'yesterday' }],
        dimensions: [{ name: 'sessionSource' }], metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 5
      }, prop);
      inhalt += _titel('Top-Quellen');
      if (q.rows) for (var s = 0; s < q.rows.length; s++)
        inhalt += _kpi(q.rows[s].dimensionValues[0].value, q.rows[s].metricValues[0].value + ' Sessions');
    } catch (err) { inhalt += '<p style="color:' + ROT + ';font-size:13px">GA4-Abruf fehlgeschlagen: ' + _esc(String(err)) + '</p>'; }
  } else inhalt += '<p style="font-size:13px;color:' + GRAU + '">GA4_PROPERTY_ID noch nicht gesetzt.</p>';
  GmailApp.sendEmail(CONFIG.EMPFAENGER, 'KWI KPI ' + gestern + ' — ' + zusatz, '', {
    name: CONFIG.ABSENDER_NAME, from: CONFIG.ABSENDER,
    htmlBody: _rahmen(inhalt, '<a href="https://analytics.google.com" style="color:' + GRAU + '">GA4</a> &middot; <a href="' + _sheetUrl() + '" style="color:' + GRAU + '">Lead-Sheet</a>')
  });
}

function setup() {
  _sheet();
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('dailyReport').timeBased().everyDays(1).atHour(CONFIG.REPORT_STUNDE).create();
  Logger.log('Setup OK — Sheet bereit, Report täglich ' + CONFIG.REPORT_STUNDE + ' Uhr.');
}
function testReport() { dailyReport(); }

function _rahmen(inhalt, fussnote) {
  return '<table cellpadding="0" cellspacing="0" width="100%" style="background:#edebe6"><tr><td align="center" style="padding:32px 16px">' +
    '<table cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%">' +
    '<tr><td style="background:' + INK + ';padding:26px 36px">' +
    '<span style="font-family:Helvetica,Arial,sans-serif;font-weight:bold;font-size:24px;color:' + PAPER + ';letter-spacing:1px">KW<span style="color:' + ROT + '">I</span></span>' +
    '<span style="float:right;font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:3px;color:rgba(246,245,242,.5);padding-top:9px">CAPITAL&nbsp;AG</span></td></tr>' +
    '<tr><td style="height:3px;background:' + ROT + ';font-size:0">&nbsp;</td></tr>' +
    '<tr><td style="background:#ffffff;padding:36px;font-family:Helvetica,Arial,sans-serif">' + inhalt + '</td></tr>' +
    '<tr><td style="background:' + INK + ';padding:16px 36px;font-family:Helvetica,Arial,sans-serif;font-size:10px;color:rgba(246,245,242,.5);line-height:1.7">' + (fussnote || '') + '</td></tr>' +
    '</table></td></tr></table>';
}
function _signatur() {
  return '<table cellpadding="0" cellspacing="0" width="100%" style="background:' + INK + ';border-bottom:3px solid ' + ROT + '"><tr>' +
    '<td style="padding:22px 24px;vertical-align:top"><span style="font-family:Helvetica,Arial,sans-serif;color:' + PAPER + ';font-size:16px;font-weight:bold">Kaito Weingart</span><br>' +
    '<span style="font-family:Helvetica,Arial,sans-serif;color:' + ROT + ';font-size:9px;letter-spacing:2px;font-weight:bold">FOUNDER</span>' +
    '<p style="margin:14px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.9">' +
    '<span style="color:#777">Mobil:</span>&nbsp; <a href="tel:+41792522570" style="color:' + PAPER + ';text-decoration:none">+41 (0) 79 252 25 70</a><br>' +
    '<span style="color:#777">Mail:</span>&nbsp; <a href="mailto:kaito@kwicapital.ch" style="color:' + PAPER + ';text-decoration:none">kaito@kwicapital.ch</a></p></td>' +
    '<td style="padding:22px 24px;vertical-align:top;border-left:1px solid #26262a">' +
    '<span style="font-family:Georgia,serif;color:' + PAPER + ';font-size:18px">Kuroiwa<span style="color:' + ROT + '">.</span></span><br>' +
    '<span style="font-family:Helvetica,Arial,sans-serif;color:' + GRAU + ';font-size:8.5px;letter-spacing:2.5px">KWI&nbsp;CAPITAL&nbsp;AG</span>' +
    '<p style="margin:12px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#bbb;line-height:1.7">Schwerzistrasse 34<br>CH-8807 Freienbach, Schweiz</p></td>' +
    '<td width="64" style="padding:22px 18px;vertical-align:middle;border-left:2px solid ' + ROT + ';text-align:center">' +
    '<span style="color:' + PAPER + ';font-size:21px;line-height:1.35;font-family:serif">黒<br>岩</span></td></tr></table>';
}
function _btn(url, label, voll) {
  var st = voll ? 'background:' + ROT + ';color:#ffffff;border:1px solid ' + ROT : 'background:#ffffff;color:' + INK + ';border:1px solid #cccccc';
  return '<td style="padding-right:10px"><a href="' + url + '" style="display:inline-block;padding:12px 22px;font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:bold;text-decoration:none;border-radius:2px;' + st + '">' + label + '</a></td>';
}
function _zeile(k, v) {
  return '<tr><td style="padding:9px 0;border-bottom:1px solid #eee;color:' + GRAU + ';font-size:11px;letter-spacing:1.5px;text-transform:uppercase;width:110px">' + k + '</td><td style="padding:9px 0;border-bottom:1px solid #eee">' + v + '</td></tr>';
}
function _kpi(k, v) { return '<p style="margin:6px 0;font-size:14px;color:#333"><span style="display:inline-block;min-width:220px;color:#555">' + k + '</span><b>' + v + '</b></p>'; }
function _titel(t) { return '<p style="margin:24px 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:' + ROT + ';font-weight:bold;border-bottom:1px solid #eee;padding-bottom:6px">' + t + '</p>'; }
function _sheet() {
  var props = PropertiesService.getScriptProperties(), id = props.getProperty('SHEET_ID'), ss;
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { id = null; } }
  if (!id) {
    ss = SpreadsheetApp.create('KWI Leads');
    ss.getActiveSheet().appendRow(['Zeitpunkt', 'Name', 'E-Mail', 'Telefon', 'Anliegen', 'Nachricht', 'Status']);
    ss.getActiveSheet().setFrozenRows(1);
    props.setProperty('SHEET_ID', ss.getId());
  }
  return ss.getActiveSheet();
}
function _sheetUrl() { var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID'); return id ? 'https://docs.google.com/spreadsheets/d/' + id : 'https://drive.google.com'; }
function _json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function _esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function _reihe(report, idx) {
  var out = ['0', '0', '0', '0', '0'];
  if (report.rows) for (var i = 0; i < report.rows.length; i++) {
    var r = report.rows[i];
    var ri = r.dimensionValues && r.dimensionValues.length ? (r.dimensionValues[0].value === 'date_range_' + idx ? idx : -1) : i;
    if (i === idx || ri === idx) { out = r.metricValues.map(function (m) { return m.value; }); break; }
  }
  return out;
}
function _datum(o) { var d = new Date(); d.setDate(d.getDate() + o); return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd'); }
