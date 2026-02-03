# BD Tracker Automation (Tenuto Labs)

This repository contains the Google Apps Script backend that powers **Tenuto Labs’** lead intake and Build Note distribution system.

It connects website forms (**Build Notes, Contact, Newsletter**) to a centralized Google Sheets BD Tracker and automatically emails Build Notes when requested.

---

## What This Does

### 1. Centralized Lead Capture

All website submissions are logged into a single Google Sheet tab:

**Inbound Leads**

**Supported sources:**
- Build Note requests  
- Contact form submissions  
- Newsletter subscriptions  

Each submission records:
- Timestamp  
- Name (if provided)  
- Email  
- Company  
- Role / Title  
- Source (Build Note / Contact / Newsletter)  
- Build Note requested (if applicable)  
- Status (`Sent`, `N/A`, or `ERROR`)  
- Message (Contact form only)

---

### 2. Automated Build Note Delivery

If a submission’s source is **Build Note**, the script:

- Determines which Build Note was requested  
- Fetches the correct PDF from Google Drive  
- Emails the Build Note directly to the requester  
- Updates the row status to **Sent**

Non–Build Note submissions are logged with status **N/A**.

---

## Supported Build Notes

Build Notes are mapped by key to Google Drive file IDs:

```js
const BUILD_NOTES = {
  legal: "GOOGLE_DRIVE_FILE_ID",
  fire: "GOOGLE_DRIVE_FILE_ID",
  pm_ai_age: "GOOGLE_DRIVE_FILE_ID",
  signal_from_noise: "GOOGLE_DRIVE_FILE_ID"
};
