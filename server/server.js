const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const { DateTime } = require('luxon');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Initialize Google Calendar API
let calendar = null;

try {
  let auth = null;
  const saKeyEnv = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (saKeyEnv) {
    // Authenticate using raw JSON key from environment variable
    const credentials = JSON.parse(saKeyEnv);
    auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/calendar']
    });
  } else {
    // Look for credentials.json file
    const credentialsPath = path.join(__dirname, 'credentials.json');
    if (fs.existsSync(credentialsPath)) {
      auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: ['https://www.googleapis.com/auth/calendar']
      });
    }
  }

  if (auth) {
    calendar = google.calendar({ version: 'v3', auth });
    console.log('Google Calendar client initialized successfully.');
  } else {
    console.warn('Warning: Google Calendar credentials not found. API endpoints will run in mock mode.');
  }
} catch (error) {
  console.error('Error initializing Google Calendar client:', error);
}

// Map regions to timezones and calendar IDs
const getRegionConfig = (region) => {
  const isNp = region === 'np';
  return {
    timezone: isNp ? 'Asia/Kathmandu' : 'Australia/Melbourne',
    calendarId: isNp ? (process.env.CALENDAR_ID_NP || 'primary') : (process.env.CALENDAR_ID_AU || 'primary')
  };
};

// Available slot templates
const SLOT_TEMPLATES = [
  { label: "09:00 AM", hour: 9, minute: 0 },
  { label: "10:00 AM", hour: 10, minute: 0 },
  { label: "11:00 AM", hour: 11, minute: 0 },
  { label: "01:00 PM", hour: 13, minute: 0 },
  { label: "02:00 PM", hour: 14, minute: 0 },
  { label: "03:00 PM", hour: 15, minute: 0 },
  { label: "04:00 PM", hour: 16, minute: 0 }
];

/**
 * GET /api/available-slots
 * Queries Google Calendar events for the specified date and region
 * Filters out busy slots and returns available consultation options.
 */
app.get('/api/available-slots', async (req, res) => {
  const { date, region } = req.query; // date format: YYYY-MM-DD, region: 'au' or 'np'
  
  if (!date || !region) {
    return res.status(400).json({ error: 'Parameters "date" and "region" are required.' });
  }

  const { timezone, calendarId } = getRegionConfig(region);

  // If no calendar is initialized, return mockup slots for development
  if (!calendar) {
    console.log(`Running in Mock Mode for region: ${region}`);
    // Mock availability (exclude some slots to simulate a live experience)
    const mockAvailable = SLOT_TEMPLATES
      .filter((_, idx) => (idx + new Date(date).getDate()) % 3 !== 0)
      .map(slot => slot.label);
    return res.json({ slots: mockAvailable, mock: true });
  }

  try {
    // Parse selected day in regional timezone
    const selectedDate = DateTime.fromISO(date, { zone: timezone });
    const timeMin = selectedDate.set({ hour: 8, minute: 0, second: 0 }).toISO();
    const timeMax = selectedDate.set({ hour: 18, minute: 0, second: 0 }).toISO();

    // Query list of events for the day
    const eventsResponse = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime'
    });

    const events = eventsResponse.data.items || [];
    
    // Parse events into start and end Luxon date times
    const busyIntervals = events
      .filter(event => event.status !== 'cancelled')
      .map(event => {
        let start, end;
        if (event.start.dateTime) {
          start = DateTime.fromISO(event.start.dateTime);
          end = DateTime.fromISO(event.end.dateTime);
        } else if (event.start.date) {
          // All day event: parse in target timezone
          start = DateTime.fromISO(event.start.date, { zone: timezone }).startOf('day');
          end = DateTime.fromISO(event.end.date, { zone: timezone }).endOf('day');
        }
        return { start, end };
      });

    // Check availability for each slot
    const availableSlots = [];

    for (const slot of SLOT_TEMPLATES) {
      // Slot runs for 30 minutes
      const slotStart = selectedDate.set({ hour: slot.hour, minute: slot.minute, second: 0, millisecond: 0 });
      const slotEnd = slotStart.plus({ minutes: 30 });

      // Check for overlap
      const isOverlap = busyIntervals.some(busy => {
        // Standard overlap: slotStart < busy.end AND busy.start < slotEnd
        return slotStart < busy.end && busy.start < slotEnd;
      });

      if (!isOverlap) {
        availableSlots.push(slot.label);
      }
    }

    res.json({ slots: availableSlots });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to retrieve slot availability from Google Calendar.' });
  }
});

/**
 * POST /api/book-appointment
 * Inserts a new calendar event on the regional Google Calendar
 * and automatically sets up a Google Meet meeting.
 */
app.post('/api/book-appointment', async (req, res) => {
  const { name, email, phone, visaType, notes, date, time, region } = req.body;

  if (!name || !email || !date || !time || !region) {
    return res.status(400).json({ error: 'Required fields: name, email, date, time, region' });
  }

  const { timezone, calendarId } = getRegionConfig(region);

  // Parse slot details
  const slotTemplate = SLOT_TEMPLATES.find(slot => slot.label === time);
  if (!slotTemplate) {
    return res.status(400).json({ error: 'Invalid time slot selected.' });
  }

  // If no calendar is initialized, return mockup success
  if (!calendar) {
    console.log(`Mock booking request: ${name} (${email}) at ${time} on ${date}`);
    return res.json({
      success: true,
      mock: true,
      message: 'Mock booking successful!',
      meetLink: 'https://meet.google.com/mock-meet-link'
    });
  }

  try {
    const startDateTime = DateTime.fromISO(date, { zone: timezone }).set({
      hour: slotTemplate.hour,
      minute: slotTemplate.minute,
      second: 0,
      millisecond: 0
    });
    const endDateTime = startDateTime.plus({ minutes: 30 });

    const eventDescription = `
📋 Pictor Services Strategic Roadmap Consultation

Client Name: ${name}
Client Email: ${email}
Client Phone: ${phone || 'Not Provided'}
Visa Pathway Interested: ${visaType || 'Not Specified'}

Additional Notes:
${notes || 'None'}
    `.trim();

    const event = {
      summary: `Pictor Consultation: ${name} (${region.toUpperCase()})`,
      description: eventDescription,
      start: {
        dateTime: startDateTime.toISO(),
        timeZone: timezone
      },
      end: {
        dateTime: endDateTime.toISO(),
        timeZone: timezone
      },
      attendees: [
        { email } // Invitation sent to client
      ],
      conferenceData: {
        createRequest: {
          requestId: `pictor-consult-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      }
    };

    // Insert event and generate Meet link
    const response = await calendar.events.insert({
      calendarId,
      resource: event,
      sendUpdates: 'all', // Sends email updates to client
      conferenceDataVersion: 1
    });

    const createdEvent = response.data;
    const meetLink = createdEvent.conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'video')?.uri || '';

    res.json({
      success: true,
      eventId: createdEvent.id,
      meetLink,
      message: 'Booking confirmed on Google Calendar!'
    });
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    res.status(500).json({ error: 'Failed to create booking on Google Calendar.' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
