// Pictor Services — Google Calendar Appointment Schedule Configuration
// You can edit this file to enable/disable or change the Appointment Schedule URLs.
const GOOGLE_CALENDAR_CONFIG = {
  // If set to true, Google Calendar Appointment Schedule will be integrated
  enabled: true,

  // Choose display mode: 
  // 'api'    - Interacts with your custom backend server (retains old UI layout, shows actual busy times).
  // 'inline' - Renders the Google Calendar iframe directly inside the booking wizard card.
  // 'popup'  - Renders a button that opens the Google Calendar in a popup dialog.
  displayMode: 'api',

  // The base URL of your backend server API
  apiUrl: 'http://localhost:3000/api',

  // Google Calendar Appointment Schedule URLs for the different regional portals
  schedules: {
    au: "https://calendar.app.google/LRmPVN4AkDHZiBXb8", // Your Live Google Calendar link
    np: "https://calendar.app.google/LRmPVN4AkDHZiBXb8"  // Defaults to the same link (can be replaced with a Nepal-specific link later)
  },

  // Color theme for the Google Calendar elements (HEX format)
  themeColor: "#512c82", // Matches Pictor's primary brand color

  // Default booking method to show: 'live' (Google Calendar) or 'manual' (Local form)
  defaultMethod: 'live'
};

// Export to window object for accessibility in script.js
if (typeof window !== 'undefined') {
  window.GOOGLE_CALENDAR_CONFIG = GOOGLE_CALENDAR_CONFIG;
}
