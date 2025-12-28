
/**
 * ------------------------------------------------------------------
 * GOOGLE APPS SCRIPT CODE
 * ------------------------------------------------------------------
 * 
 * INSTRUCTIONS:
 * 1. Create a new Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Paste the code below.
 * 4. Create a folder in Google Drive named "Hackathon_Screenshots" and copy its Folder ID.
 * 5. Replace REPLACE_WITH_FOLDER_ID with your actual ID.
 * 6. Click Deploy > New Deployment > Select type: Web App.
 *    - Description: "v3 - Robust Sheet Check"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 7. Copy the "Web App URL" and paste it into components/RegistrationForm.tsx
 */

// ------------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------------
function testAuth() {
  // Run this function in the editor to force all permissions to be asked
  console.log("Checking Permissions...");
  SpreadsheetApp.getActiveSpreadsheet();
  DriveApp.getRootFolder();
  MailApp.getRemainingDailyQuota();
  // This line forces the Slides permission prompt:
  SlidesApp.openById("1ilHiw3IjUEAkLfqffweKNK40e_0Ox9KYGB5kiat3fOI");
  console.log("All Permissions Granted!");
}

function doGet(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    // Try to find "Registrations" sheet, fallback to first sheet if missing
    let sheet = doc.getSheetByName("Registrations");
    if (!sheet) {
      sheet = doc.getSheets()[0];
    }

    const data = sheet.getDataRange().getValues();
    // If sheet is empty, return empty array
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const headers = data[0];
    const rows = data.slice(1);

    const result = rows.map((row) => {
      let obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ error: e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  // Wait for up to 30 seconds for other processes to finish.
  lock.waitLock(30000);

  try {
    const folderId = "1310LHSuZjgXKhC4K_T7sTe3D_iQq24Nt"; // <--- ENSURE THIS ID IS CORRECT
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    let sheetName = "Registrations";
    let sheet = doc.getSheetByName(sheetName);

    // --------------------------------------------------------
    // ROBUST SHEET CHECK: Create if missing
    // --------------------------------------------------------
    if (!sheet) {
      sheet = doc.insertSheet(sheetName);
      // Add Headers immediately
      sheet.appendRow([
        "Registration ID", "Timestamp", "Team Name",
        "Leader Name", "Leader Email", "Leader Phone", "Leader Branch", "Leader USN", "Leader Sem",
        "Member 2 Name", "Member 2 Email", "Member 2 Phone", "Member 2 Branch", "Member 2 USN", "Member 2 Sem",
        "Payment Screenshot URL", "Status"
      ]);
    }

    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);
    const action = data.action || 'register';

    if (action === 'register') {
      // 1. Handle Screenshot Image Upload
      let fileUrl = "No File Uploaded";
      try {
        if (data.imageBase64) {
          const folder = DriveApp.getFolderById(folderId);
          const contentType = data.imageMimeType || "image/png";
          // Clean base64 string just in case
          const base64Data = data.imageBase64.split(',').pop();
          const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, data.teamName + "_Payment_Proof");
          const file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          fileUrl = file.getUrl();
        }
      } catch (uploadError) {
        fileUrl = "Error Uploading File: " + uploadError.toString();
      }

      // 2. Generate Unique ID
      const uniqueId = "HTF-" + Math.floor(100000 + Math.random() * 900000);

      // 3. Dynamic Append (Header-Aware)
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      const newRow = new Array(headers.length).fill(""); // Initialize with empty strings

      // Map data to headers
      const fieldMap = {
        "Registration ID": uniqueId,
        "Timestamp": new Date(),
        "Team Name": data.teamName,
        "Leader Name": data.leaderName,
        "Leader Email": data.leaderEmail,
        "Leader Phone": data.leaderPhone,
        "Leader Branch": data.leaderBranch,
        "Leader USN": data.leaderUSN,
        "Leader Sem": data.leaderSemester,
        "Member 2 Name": data.member2Name,
        "Member 2 Email": data.member2Email,
        "Member 2 Phone": data.member2Phone,
        "Member 2 Branch": data.member2Branch,
        "Member 2 USN": data.member2USN,
        "Member 2 Sem": data.member2Semester,
        "Payment Screenshot URL": fileUrl,
        "Status": data.status || "Pending Verification" // Allow override for On-Spot
      };

      // Fill the row array based on header names
      headers.forEach((header, index) => {
        if (fieldMap.hasOwnProperty(header)) {
          newRow[index] = fieldMap[header];
        }
      });

      // Append the correctly ordered row
      sheet.appendRow(newRow);

      return ContentService.createTextOutput(JSON.stringify({ result: 'success', message: 'Data saved', id: uniqueId }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Status Update Logic (Same as before)
    if (action === 'updateStatus') {
      const idToFind = data.id;
      const newStatus = data.status;
      const range = sheet.getDataRange();
      const values = range.getValues();

      // Find header index for "Status", "Registration ID", "Leader Email", "Team Name"
      const headers = values[0];
      const statusIdx = headers.indexOf("Status");
      const regIdIdx = headers.indexOf("Registration ID");
      const emailIdx = headers.indexOf("Leader Email");
      const teamNameIdx = headers.indexOf("Team Name");

      if (statusIdx === -1 || regIdIdx === -1) {
        return ContentService.createTextOutput(JSON.stringify({ result: 'error', message: 'Columns not found' })).setMimeType(ContentService.MimeType.JSON);
      }

      for (let i = 1; i < values.length; i++) {
        if (values[i][regIdIdx] == idToFind) {
          // Update Status
          sheet.getRange(i + 1, statusIdx + 1).setValue(newStatus);

          // --------------------------------------------------------
          // SEND EMAIL IF VERIFIED
          // --------------------------------------------------------
          if (newStatus === "Verified" && emailIdx !== -1) {
            const email = values[i][emailIdx];
            const teamName = teamNameIdx !== -1 ? values[i][teamNameIdx] : "Participant";

            const subject = "Registration Confirmed: CodeRush 2K25";
            const body = `
  Hello Team ${teamName},

  Congratulations! Your registration for CodeRush 2K25 has been VERIFIED.

  We are excited to have you onboard for this ultimate frontend battle.

  🚀 NEXT STEPS:
  1. Join the Official WhatsApp Group for important updates:
    https://chat.whatsapp.com/YOUR_GROUP_LINK_HERE  <-- (Please update this link)

  2. Event Details:
    - Date: 29th December 2025
    - Reporting Time: 09:00 AM
    - Venue: JCET Hubballi

  See you at the arena!

  Regards,
  CodeRush Team
  JCET Hubballi
  `;

            try {
              MailApp.sendEmail({
                to: email,
                subject: subject,
                body: body
              });
            } catch (emailErr) {
              // Log error silently so we don't break the response
              console.error("Email sending failed: " + emailErr.toString());
            }
          }

          return ContentService.createTextOutput(JSON.stringify({ result: 'success', message: 'Status updated' })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ result: 'error', message: 'ID not found' })).setMimeType(ContentService.MimeType.JSON);
    }

    // --------------------------------------------------------
    // ACTION: UPDATE DOMAIN
    // --------------------------------------------------------
    if (action === 'updateDomain') {
      const idToFind = data.id;
      const newDomain = data.domain;
      const range = sheet.getDataRange();
      const values = range.getValues();
      let headers = values[0];

      // Check if "Assigned Domain" column exists, if not, create it
      let domainIdx = headers.indexOf("Assigned Domain");
      if (domainIdx === -1) {
        sheet.getRange(1, headers.length + 1).setValue("Assigned Domain");
        domainIdx = headers.length; // It's the new last column
        // Refresh values to include new column in future reads (optimization: just know it's at values[i][domainIdx] which is undefined currently)
      }

      const regIdIdx = headers.indexOf("Registration ID");

      if (regIdIdx === -1) {
        return ContentService.createTextOutput(JSON.stringify({ result: 'error', message: 'Registration ID column not found' })).setMimeType(ContentService.MimeType.JSON);
      }

      for (let i = 1; i < values.length; i++) {
        if (values[i][regIdIdx] == idToFind) {
          // Update Domain
          sheet.getRange(i + 1, domainIdx + 1).setValue(newDomain);
          return ContentService.createTextOutput(JSON.stringify({ result: 'success', message: 'Domain assigned' })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ result: 'error', message: 'ID not found' })).setMimeType(ContentService.MimeType.JSON);
    }

    // --------------------------------------------------------
    // ACTION: EVENT CHECK-IN
    // --------------------------------------------------------
    if (action === 'eventCheckIn') {
      const idToFind = data.id;
      const timestamp = data.timestamp || new Date().toLocaleString(); // Use passed timestamp or current
      const range = sheet.getDataRange();
      const values = range.getValues();
      let headers = values[0];

      // Check if "Event Check-In" column exists
      let checkInIdx = headers.indexOf("Event Check-In");
      if (checkInIdx === -1) {
        sheet.getRange(1, headers.length + 1).setValue("Event Check-In");
        checkInIdx = headers.length;
      }

      const regIdIdx = headers.indexOf("Registration ID");
      const statusIdx = headers.indexOf("Status");

      if (regIdIdx === -1) {
        return ContentService.createTextOutput(JSON.stringify({ result: 'error', message: 'Registration ID column not found' })).setMimeType(ContentService.MimeType.JSON);
      }

      for (let i = 1; i < values.length; i++) {
        if (values[i][regIdIdx] == idToFind) {
          // Update Event Check-In (Value: "Checked In" or Timestamp? Let's do "Checked In")
          sheet.getRange(i + 1, checkInIdx + 1).setValue("Checked In");

          // Sync Status as well
          if (statusIdx !== -1) {
            sheet.getRange(i + 1, statusIdx + 1).setValue("Checked In");
          }

          return ContentService.createTextOutput(JSON.stringify({ result: 'success', message: 'Checked In Successfully' })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ result: 'error', message: 'ID not found' })).setMimeType(ContentService.MimeType.JSON);
    }

    // --------------------------------------------------------
    // ACTION: SEND CERTIFICATE
    // --------------------------------------------------------
    // --------------------------------------------------------
    // ACTION: SEND CERTIFICATE
    // --------------------------------------------------------
    if (action === 'sendCertificate') {
      const debugLogs = [];
      debugLogs.push("Started sendCertificate");

      const idToFind = data.id;
      const range = sheet.getDataRange();
      const values = range.getValues();
      const headers = values[0];

      const regIdIdx = headers.indexOf("Registration ID");
      const teamNameIdx = headers.indexOf("Team Name");
      const leaderNameIdx = headers.indexOf("Leader Name");
      const leaderEmailIdx = headers.indexOf("Leader Email");
      const member2NameIdx = headers.indexOf("Member 2 Name");
      const member2EmailIdx = headers.indexOf("Member 2 Email");

      // --- CONFIGURATION ---
      // TODO: USER MUST REPLACE THIS ID
      // If this ID is wrong, it will fail silently or error
      const SLIDE_TEMPLATE_ID = "1ilHiw3IjUEAkLfqffweKNK40e_0Ox9KYGB5kiat3fOI";

      for (let i = 1; i < values.length; i++) {
        if (values[i][regIdIdx] == idToFind) {
          debugLogs.push(`Found ID match at row ${i + 1}`);

          const participants = [];
          if (values[i][leaderNameIdx] && values[i][leaderEmailIdx]) participants.push({ name: values[i][leaderNameIdx], email: values[i][leaderEmailIdx] });
          if (values[i][member2NameIdx] && values[i][member2EmailIdx]) participants.push({ name: values[i][member2NameIdx], email: values[i][member2EmailIdx] });

          const sentLog = [];

          participants.forEach(p => {
            debugLogs.push(`Processing: ${p.name} (${p.email})`);
            try {
              // 1. Copy Template
              const copyFile = DriveApp.getFileById(SLIDE_TEMPLATE_ID).makeCopy(p.name + "_Certificate");
              const copyId = copyFile.getId();
              const copyDoc = SlidesApp.openById(copyId);
              const slides = copyDoc.getSlides();
              debugLogs.push(`Created copy: ${copyId}`);

              // 2. Replace Text (Robust Method)
              slides.forEach((slide, sIndex) => {
                debugLogs.push(`Scanning Slide ${sIndex + 1}`);

                const replacements = ["{{NAME}}", "{{Name}}", "{NAME}", "<NAME>"];
                replacements.forEach(placeholder => {
                  const count = slide.replaceAllText(placeholder, p.name);
                  if (count > 0) debugLogs.push(`Global Replace Success: Replaced ${count} instances of ${placeholder}`);
                });

              });

              copyDoc.saveAndClose();

              // 3. Export PDF
              const pdfBlob = copyFile.getAs(MimeType.PDF);

              // 4. Email
              MailApp.sendEmail({
                to: p.email,
                subject: "Certificate of Participation: CodeRush 2K25",
                body: `Hello ${p.name},\n\nThank you for participating in CodeRush 2K25. Please find your official certificate attached.\n\nBest Regards,\nCodeRush Team\nJCET Hubballi`,
                attachments: [pdfBlob]
              });

              copyFile.setTrashed(true);
              sentLog.push(p.email);
            } catch (err) {
              debugLogs.push(`ERROR for ${p.email}: ${err.toString()}`);
            }
          });

          return ContentService.createTextOutput(JSON.stringify({
            result: 'success',
            message: 'Processed. Check Logs.',
            logs: debugLogs
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ result: 'error', message: 'ID not found', logs: debugLogs })).setMimeType(ContentService.MimeType.JSON);
    }

  } catch (e) {
    console.error("Global Error: " + e.toString());
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', error: e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
