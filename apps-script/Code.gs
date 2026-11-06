/**
 * IBC Topic Suggestions: Google Sheet backend.
 *
 * Paste this into the sheet's Apps Script editor (Extensions > Apps Script),
 * then Deploy > New deployment > Web app:
 *   Execute as: Me
 *   Who has access: Anyone
 * Copy the web app URL (ends in /exec) into config.js as API_URL.
 *
 * GET  -> list of speakers from the "Speakers" tab
 * POST -> adds one row to the "Suggestions" tab
 */

var SUGGESTIONS_TAB = "Suggestions";
var SPEAKERS_TAB = "Speakers";
var TIME_ZONE = "Asia/Singapore";

// Speakers tab columns: Order | Name | Photo URL | Show on site
function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SPEAKERS_TAB);
  var rows = sheet.getDataRange().getValues().slice(1);
  var speakers = rows
    .filter(function (r) {
      return String(r[1]).trim() && String(r[3]).trim().toUpperCase() !== "NO";
    })
    .sort(function (a, b) {
      return (Number(a[0]) || 9999) - (Number(b[0]) || 9999);
    })
    .map(function (r) {
      return { name: String(r[1]).trim(), photo: String(r[2] || "").trim() };
    });
  return json({ ok: true, speakers: speakers });
}

// Suggestions tab columns: Timestamp | Speaker | Topic suggestion(s) | Name
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var data = JSON.parse(e.postData.contents);
    var speaker = String(data.speaker || "").trim();
    var topic = String(data.topic || "").trim();
    var name = String(data.name || "").trim();
    if (!speaker || !topic) return json({ ok: false, error: "Missing speaker or topic" });

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SUGGESTIONS_TAB);
    sheet.appendRow([
      Utilities.formatDate(new Date(), TIME_ZONE, "yyyy-MM-dd HH:mm"),
      plainText(speaker),
      plainText(topic),
      plainText(name)
    ]);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Stops text like "=..." or "- ..." from being read as a formula.
function plainText(s) {
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
