# Debugging Email Issues in Google Apps Script

If emails are not sending, follow these exact steps to fix permissions and deployment.

## Step 1: Force Authorization
The script needs explicit permission to send emails on your behalf.

1.  Open your **Google Apps Script** project.
2.  Add this temporary function at the bottom of your code:
    ```javascript
    function testEmailPermission() {
      console.log("Remaining email quota: " + MailApp.getRemainingDailyQuota());
      MailApp.sendEmail({
        to: Session.getActiveUser().getEmail(),
        subject: "Test Email from CodeRush Admin",
        body: "If you received this, permissions are working!"
      });
    }
    ```
3.  **Save** the project.
4.  Select `testEmailPermission` from the function dropdown menu (top toolbar).
5.  Click **Run**.
6.  **Important**: A popup will appear saying "Authorization Required".
    *   Click **Review Permissions**.
    *   Choose your account.
    *   If you see "Google hasn't verified this app", click **Advanced** -> **Go to (Project Name) (unsafe)**.
    *   Click **Allow**.
7.  Check your inbox for the test email.

## Step 2: Redeploy Correctly
Even if the code is saved, the **Web App** is still running the *old* version until you deploy a *new* one.

1.  Click **Deploy** (blue button top right) -> **Manage Deployments**.
2.  Select the **Active** deployment (usually the top one).
3.  Click the **Pencil Icon** (Edit).
4.  **Version**: Click the dropdown and select **"New version"**. (Do NOT keep it on the existing version number).
5.  Click **Deploy**.

## Step 3: Test Again
1.  Go to your Admin Panel (`localhost:3000/admin`).
2.  Refresh the page.
3.  Try updating a user's status to **Verified**.
4.  The email should now defineitly send.
