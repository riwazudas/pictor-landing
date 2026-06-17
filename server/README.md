# Google Calendar Backend Integration Setup Guide

This backend server connects your custom website booking wizard directly to your personal Google Calendar. It queries Google to see when you are available, and inserts a new event (with a Google Meet video link) when someone books.

---

## 🔑 Step 1: Create a Google Cloud Service Account
1. Open the **[Google Cloud Console](https://console.cloud.google.com/)**.
2. Create a new project (e.g., `Pictor Services Booking`).
3. In the search bar at the top, search for **Google Calendar API** and click **Enable**.
4. Navigate to **APIs & Services > Credentials**.
5. Click **+ Create Credentials** at the top and select **Service Account**.
6. Fill in the Service Account details (e.g., name `calendar-booking`) and click **Create and Continue**, then click **Done**.
7. In the credentials list, click on your newly created Service Account email address.
8. Go to the **Keys** tab, click **Add Key > Create new key**, choose **JSON**, and click **Create**.
9. A JSON file will download to your computer. Save this key!

---

## 📅 Step 2: Share your Google Calendar with the Service Account
Because the Service Account is a robot account, it has no access to your calendar by default. You must share your calendar with it:
1. Open the JSON file you downloaded in Step 1 and copy the `"client_email"` value (e.g. `calendar-booking@your-project.iam.gserviceaccount.com`).
2. Open **[Google Calendar](https://calendar.google.com/)**.
3. Under "My calendars" on the left, hover over the calendar you want to use, click the **three vertical dots**, and choose **Settings and sharing**.
4. Scroll down to the **"Share with specific people or groups"** section.
5. Click **+ Add people and groups**.
6. Paste the Service Account's **client email** address.
7. Under **Permissions**, choose **Make changes to events** (required to insert bookings).
8. Click **Send**.

---

## ⚙️ Step 3: Configure the Backend Server
1. Move the JSON file you downloaded in Step 1 into the `server` directory and rename it to **`credentials.json`**.
   *(Alternatively, you can copy the entire JSON content and paste it inside the `GOOGLE_SERVICE_ACCOUNT_KEY` variable inside your `.env` file.)*
2. Update the calendar IDs in `.env` if you are using specific calendars (otherwise `"primary"` uses the Service Account owner's default calendar):
   ```env
   CALENDAR_ID_AU="your-calendar-email@gmail.com"
   CALENDAR_ID_NP="your-nepal-office-calendar@gmail.com"
   ```

---

## 🚀 Step 4: Run the Server
From your terminal, navigate to the `server` folder and run:

```bash
# Install dependencies
npm install

# Start the server
npm start
```

The server will run on `http://localhost:3000`. The website will automatically communicate with it to handle slots and bookings.
