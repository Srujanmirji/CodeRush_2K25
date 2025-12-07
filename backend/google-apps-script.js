
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
    return ContentService.createTextOutput(JSON.stringify({error: e.toString()}))
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

        // 3. Append Row
        sheet.appendRow([
          uniqueId,                    
          new Date(),                  
          data.teamName,
          data.leaderName,
          data.leaderEmail,
          data.leaderPhone,
          data.leaderBranch,
          data.leaderUSN,
          data.leaderSemester,
          data.member2Name,
          data.member2Email,
          data.member2Phone,
          data.member2Branch,
          data.member2USN,
          data.member2Semester,
          fileUrl,                     
          "Pending Verification"       
        ]);

        return ContentService.createTextOutput(JSON.stringify({ result: 'success', message: 'Data saved', id: uniqueId }))
          .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Status Update Logic (Same as before)
    if (action === 'updateStatus') {
        const idToFind = data.id;
        const newStatus = data.status;
        const range = sheet.getDataRange();
        const values = range.getValues();
        
        // Find header index for "Status" and "Registration ID"
        const headers = values[0];
        const statusIdx = headers.indexOf("Status");
        const regIdIdx = headers.indexOf("Registration ID");

        if (statusIdx === -1 || regIdIdx === -1) {
           return ContentService.createTextOutput(JSON.stringify({ result: 'error', message: 'Columns not found' })).setMimeType(ContentService.MimeType.JSON);
        }

        for (let i = 1; i < values.length; i++) {
            if (values[i][regIdIdx] == idToFind) {
                 sheet.getRange(i + 1, statusIdx + 1).setValue(newStatus);
                 return ContentService.createTextOutput(JSON.stringify({ result: 'success', message: 'Status updated' })).setMimeType(ContentService.MimeType.JSON);
            }
        }
        return ContentService.createTextOutput(JSON.stringify({ result: 'error', message: 'ID not found' })).setMimeType(ContentService.MimeType.JSON);
    }

  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', error: e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
