const SHEET_NAME = "Inbound Leads";

// Map build note keys to Google Drive file IDs
const BUILD_NOTES = {
  legal: "1NYfuWqNyawS8L1xJQAkuRAjYKRKD0BWy",
  fire: "1wq-nptuINLzS0Amwani8WM0elKEww-g0",
  pm_ai_age: "1Vq_fDCiU7YgJJsk6FgBk5bIPcVHRehzlAgZAOhU7-Bk",
  signal_from_noise: "1d7HpAtPbHuAAmr_zxRIkLELOBTWbrRy75xxM1Ve3VCI"
};


const FROM_NAME = "Tenuto Labs";

function doPost(e) {
  // Ignore totally empty hits (health checks)
  if (!e) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: true, ignored: true })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    let data = {};

    // Prefer JSON if present
    const hasJsonBody = e.postData && e.postData.contents;
    if (hasJsonBody) {
      try {
        data = JSON.parse(e.postData.contents || "{}");
      } catch (jsonErr) {
        // If JSON parse fails, fall back to parameters
        data = {};
      }
    }

    // Fill from parameters if missing (covers form-urlencoded + missing JSON)
    data.name = data.name || e.parameter?.name || e.parameter?.fullName || "";
    data.email =
      data.email ||
      e.parameter?.email ||
      e.parameter?.emailAddress ||
      e.parameter?.company_email ||
      e.parameter?.companyEmail ||
      "";

    data.company = data.company || e.parameter?.company || e.parameter?.companyName || "";
    data.role = data.role || e.parameter?.role || e.parameter?.title || "";
    data.build_note = data.build_note || e.parameter?.build_note || e.parameter?.buildNote || "";
    data.message = data.message || e.parameter?.message || "";
    data.source = data.source || e.parameter?.source || "Newsletter"; // default to Newsletter for email-only forms

    // Required fields
    if (!data.email) throw new Error("Missing field: email");
    if (!data.source) throw new Error("Missing field: source");

    const needsName = (data.source === "Build Note" || data.source === "Contact");
    if (needsName && !data.name) throw new Error("Missing field: name");

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error(`Sheet not found: ${SHEET_NAME}`);

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      // Append row (A:I)
      sheet.appendRow([
        new Date(),
        data.name,
        data.email,
        data.company,
        data.role,
        data.source,
        data.build_note,
        "New",
        data.message
      ]);

      const row = sheet.getLastRow();

      // Only Build Note triggers an email
      if (data.source === "Build Note") {
        try {
          sendBuildNoteEmail(data);
          sheet.getRange(row, 8).setValue("Sent"); // H
        } catch (emailErr) {
          sheet.getRange(row, 8).setValue("ERROR"); // H
          sheet.getRange(row, 10).setValue("Email error: " + emailErr.message); // J (Debug)
          throw emailErr;
        }
      } else {
        sheet.getRange(row, 8).setValue("N/A"); // H
      }

      SpreadsheetApp.flush();

    } finally {
      lock.releaseLock();
    }

    return ContentService.createTextOutput(
      JSON.stringify({ success: true })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    logError(err);
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: err.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function sendBuildNoteEmail(data) {
 const raw = (data.build_note || "").toString().trim().toLowerCase();

// normalize common formats coming from the UI
const key = raw
  .replace(/&/g, "and")
  .replace(/[:]/g, "")
  .replace(/[^a-z0-9]+/g, "_")
  .replace(/^_+|_+$/g, "");

const fileId = BUILD_NOTES[key] || BUILD_NOTES[raw];
if (!fileId) throw new Error("Unknown Build Note: " + data.build_note);

  const file = DriveApp.getFileById(fileId);

  const subject = "Your Tenuto Build Note";
  const body = `Hi ${data.name},

Thanks for your interest in Tenuto Labs.

Here’s the Build Note you requested.
If you have any questions or want to chat, feel free to reply here.

— Tenuto Labs`;

  GmailApp.sendEmail(data.email, subject, body, {
    name: FROM_NAME,
    attachments: [file.getAs(MimeType.PDF)]
  });
}

function logError(err) {
  console.error(err);
}

function doGet(e) {
  return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
}

function authorizeEmail() {
  GmailApp.sendEmail(
    Session.getActiveUser().getEmail(),
    "Tenuto Apps Script Authorization Test",
    "If you received this, Gmail permissions are approved."
  );
}
