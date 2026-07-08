const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const { DateTime } = require('luxon');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const { OAuth2Client } = require('google-auth-library');
const https = require('https');
require('dotenv').config();

const app = express();

// Configure Session Management
app.use(session({
  secret: process.env.SESSION_SECRET || 'pictor-services-secure-session-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if running over HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));

// Configure CORS to allow session cookies from local dev servers (e.g. port 5000 / npx serve)
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    // Allow any localhost origins for testing
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 3000;

// Initialize Google OAuth2 client if CLIENT_ID is present
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
let oauthClient = null;
if (GOOGLE_CLIENT_ID) {
  oauthClient = new OAuth2Client(GOOGLE_CLIENT_ID);
  console.log('Google OAuth Client initialized successfully.');
} else {
  console.warn('Warning: GOOGLE_CLIENT_ID not found in environment. Google login will require Developer Bypass mode.');
}

// Initialize Google Calendar API
let calendar = null;

try {
  let auth = null;
  const saKeyEnv = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (saKeyEnv) {
    const credentials = JSON.parse(saKeyEnv);
    auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/calendar']
    });
  } else {
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

// Helper to write to JSON configuration files in the root folder
const getRootFilePath = (filename) => {
  return path.join(__dirname, '..', filename);
};

// Safe JSON data readers/writers for appointments, messages, and blog articles
const readDataFile = (filename, defaultValue = []) => {
  const filePath = path.join(__dirname, 'data', filename);
  try {
    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filename}:`, err);
    return defaultValue;
  }
};

const writeDataFile = (filename, data) => {
  const filePath = path.join(__dirname, 'data', filename);
  try {
    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error(`Error writing ${filename}:`, err);
    return false;
  }
};

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

const DEFAULT_FAQS = [
  {
    id: "faq_1",
    question: "What is OMARA and why is it important?",
    answer: "OMARA (Office of the Migration Agents Registration Authority) regulates migration agents in Australia. Using a registered agent guarantees they have the required legal knowledge and adhere to a strict Code of Conduct.",
    category: "Migration",
    region: "au",
    createdAt: new Date().toISOString()
  },
  {
    id: "faq_2",
    question: "How long does a student visa (Subclass 500) processing take?",
    answer: "Student visa processing times vary depending on the sector. Higher education sector visas generally take 2-4 weeks, while vocational education can take longer. It depends heavily on document completeness.",
    category: "Education",
    region: "both",
    createdAt: new Date().toISOString()
  },
  {
    id: "faq_3",
    question: "What is the NAATI CCL test?",
    answer: "The NAATI CCL (Credentialed Community Language) test is an exam that assesses your community language translation abilities. Passing it awards 5 bonus points toward your Australian GSM (PR) visa application.",
    category: "General",
    region: "au",
    createdAt: new Date().toISOString()
  },
  {
    id: "faq_4",
    question: "Do you offer university admission assistance in Nepal?",
    answer: "Yes, our Kathmandu office is staffed with QEAC certified counselors who provide free university placement, admissions, scholarship assistance, and visa documentation support.",
    category: "Education",
    region: "np",
    createdAt: new Date().toISOString()
  }
];

// Admin authorization checker middleware
const requireAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized: Admin access required.' });
  }
};

/* ==========================================================================
   PUBLIC API ENDPOINTS
   ========================================================================== */

// Helper to create an uncompressed POSIX TAR file from file buffers
function createTar(files) {
  let totalLength = 0;
  for (const f of files) {
    const fileLen = f.data.length;
    const padding = (512 - (fileLen % 512)) % 512;
    totalLength += 512 + fileLen + padding;
  }
  totalLength += 1024; // two blocks of zeroes at the end

  const buffer = Buffer.alloc(totalLength);
  let offset = 0;

  for (const f of files) {
    // Write name (100 bytes)
    buffer.write(f.name, offset, 100, 'utf8');
    // Mode
    buffer.write('0000644\0', offset + 100, 8, 'utf8');
    // UID
    buffer.write('0000000\0', offset + 108, 8, 'utf8');
    // GID
    buffer.write('0000000\0', offset + 116, 8, 'utf8');
    // Size (12 bytes octal)
    const sizeStr = f.data.length.toString(8).padStart(11, '0') + '\0';
    buffer.write(sizeStr, offset + 124, 12, 'utf8');
    // Mtime
    buffer.write('14000000000\0', offset + 136, 12, 'utf8');
    // Checksum placeholder (8 spaces)
    buffer.write('        ', offset + 148, 8, 'utf8');
    // Type flag '0' (normal file)
    buffer[offset + 156] = 48; // ASCII '0'
    // Magic
    buffer.write('ustar\0', offset + 257, 6, 'utf8');
    // Version
    buffer.write('00', offset + 263, 2, 'utf8');

    // Calculate checksum: sum of the 512 header bytes
    let chk = 0;
    for (let i = 0; i < 512; i++) {
      chk += buffer[offset + i];
    }
    const chkStr = chk.toString(8).padStart(6, '0') + '\0 ';
    buffer.write(chkStr, offset + 148, 8, 'utf8');

    offset += 512;

    // Copy file data
    f.data.copy(buffer, offset);
    offset += f.data.length;

    // Padding to block boundary (512 bytes)
    const padding = (512 - (f.data.length % 512)) % 512;
    offset += padding;
  }

  return buffer;
}

/**
 * POST /api/compile
 * Compiles LaTeX source with logo.png via latexonline.cc
 */
app.post('/api/compile', async (req, res) => {
  const { latex, documentTitle } = req.body;
  if (!latex) {
    return res.status(400).json({ error: 'LaTeX source code is required.' });
  }

  try {
    const logoPath = path.join(__dirname, '..', 'logo.png');
    let logoBuffer = Buffer.alloc(0);
    if (fs.existsSync(logoPath)) {
      logoBuffer = fs.readFileSync(logoPath);
    } else {
      console.warn('logo.png not found at root, compiling without it');
    }

    const files = [
      { name: 'main.tex', data: Buffer.from(latex, 'utf8') }
    ];
    if (logoBuffer.length > 0) {
      files.push({ name: 'logo.png', data: logoBuffer });
    }

    const tarBuffer = createTar(files);

    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const headerStr = 
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="project.tar"\r\n` +
      `Content-Type: application/x-tar\r\n\r\n`;
    
    const footerStr = `\r\n--${boundary}--\r\n`;

    const requestBody = Buffer.concat([
      Buffer.from(headerStr, 'utf8'),
      tarBuffer,
      Buffer.from(footerStr, 'utf8')
    ]);

    const options = {
      hostname: 'latexonline.cc',
      port: 443,
      path: '/data?target=main.tex&command=pdflatex',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': requestBody.length
      }
    };

    const clientReq = https.request(options, (clientRes) => {
      const chunks = [];
      clientRes.on('data', (chunk) => {
        chunks.push(chunk);
      });

      clientRes.on('end', () => {
        const responseData = Buffer.concat(chunks);
        if (clientRes.statusCode >= 200 && clientRes.statusCode < 300) {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${documentTitle || 'document'}.pdf"`);
          res.send(responseData);
        } else {
          res.status(clientRes.statusCode).send(responseData.toString('utf8'));
        }
      });
    });

    clientReq.on('error', (err) => {
      console.error('Error compiling via latexonline.cc:', err);
      res.status(500).json({ error: 'Failed to communicate with LaTeX compilation server.' });
    });

    clientReq.write(requestBody);
    clientReq.end();

  } catch (error) {
    console.error('Compile endpoint error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /api/available-slots
 * Queries Google Calendar events for the specified date and region
 */
app.get('/api/available-slots', async (req, res) => {
  const { date, region } = req.query; 
  
  if (!date || !region) {
    return res.status(400).json({ error: 'Parameters "date" and "region" are required.' });
  }

  const { timezone, calendarId } = getRegionConfig(region);

  if (!calendar) {
    const mockAvailable = SLOT_TEMPLATES
      .filter((_, idx) => (idx + new Date(date).getDate()) % 3 !== 0)
      .map(slot => slot.label);
    return res.json({ slots: mockAvailable, mock: true });
  }

  try {
    const selectedDate = DateTime.fromISO(date, { zone: timezone });
    const timeMin = selectedDate.set({ hour: 8, minute: 0, second: 0 }).toISO();
    const timeMax = selectedDate.set({ hour: 18, minute: 0, second: 0 }).toISO();

    const eventsResponse = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime'
    });

    const events = eventsResponse.data.items || [];
    
    const busyIntervals = events
      .filter(event => event.status !== 'cancelled')
      .map(event => {
        let start, end;
        if (event.start.dateTime) {
          start = DateTime.fromISO(event.start.dateTime);
          end = DateTime.fromISO(event.end.dateTime);
        } else if (event.start.date) {
          start = DateTime.fromISO(event.start.date, { zone: timezone }).startOf('day');
          end = DateTime.fromISO(event.end.date, { zone: timezone }).endOf('day');
        }
        return { start, end };
      });

    const availableSlots = [];

    for (const slot of SLOT_TEMPLATES) {
      const slotStart = selectedDate.set({ hour: slot.hour, minute: slot.minute, second: 0, millisecond: 0 });
      const slotEnd = slotStart.plus({ minutes: 30 });

      const isOverlap = busyIntervals.some(busy => {
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
 * Inserts a new calendar event and saves details locally for notifications dashboard
 */
app.post('/api/book-appointment', async (req, res) => {
  const { name, email, phone, visaType, notes, date, time, region } = req.body;

  if (!name || !email || !date || !time || !region) {
    return res.status(400).json({ error: 'Required fields: name, email, date, time, region' });
  }

  const { timezone, calendarId } = getRegionConfig(region);

  const slotTemplate = SLOT_TEMPLATES.find(slot => slot.label === time);
  if (!slotTemplate) {
    return res.status(400).json({ error: 'Invalid time slot selected.' });
  }

  // Common function to save the appointment locally
  const saveAppointmentLocally = (meetLink, eventId = null) => {
    const appointments = readDataFile('appointments.json');
    const newApt = {
      id: `apt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      phone: phone || 'Not Provided',
      visaType: visaType || 'Not Specified',
      notes: notes || 'None',
      date,
      time,
      region,
      meetLink,
      eventId,
      createdAt: new Date().toISOString(),
      replies: []
    };
    appointments.push(newApt);
    writeDataFile('appointments.json', appointments);
    return newApt;
  };

  if (!calendar) {
    const mockMeetLink = 'https://meet.google.com/mock-meet-link';
    saveAppointmentLocally(mockMeetLink);
    return res.json({
      success: true,
      mock: true,
      message: 'Mock booking successful!',
      meetLink: mockMeetLink
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
        { email }
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

    const response = await calendar.events.insert({
      calendarId,
      resource: event,
      sendUpdates: 'all', 
      conferenceDataVersion: 1
    });

    const createdEvent = response.data;
    const meetLink = createdEvent.conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'video')?.uri || '';

    saveAppointmentLocally(meetLink, createdEvent.id);

    res.json({
      success: true,
      eventId: createdEvent.id,
      meetLink,
      message: 'Booking confirmed on Google Calendar!'
    });
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    // Even if Google Calendar fails, save locally in mock mode so we don't lose client details
    saveAppointmentLocally('https://meet.google.com/mock-meet-link');
    res.status(500).json({ error: 'Failed to create booking on Google Calendar, saved locally.' });
  }
});

/**
 * POST /api/contact
 * Handles submissions from the lead-capture (Contact Me) form
 */
app.post('/api/contact', async (req, res) => {
  const { name, email, phone, country, visaType, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const refCode = 'PCT-' + Math.floor(1000 + Math.random() * 9000);
  const messages = readDataFile('messages.json');
  const newMsg = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    email,
    phone: phone || 'Not Provided',
    country: country || 'Not Specified',
    visaType: visaType || 'Not Specified',
    message,
    refCode,
    createdAt: new Date().toISOString(),
    replies: []
  };

  messages.push(newMsg);
  writeDataFile('messages.json', messages);

  res.json({
    success: true,
    refCode,
    message: 'Message logged successfully!'
  });
});

/**
 * GET /api/blog/posts
 * Public endpoint to fetch published blog posts (and dynamically transition scheduled ones)
 */
app.get('/api/blog/posts', (req, res) => {
  const posts = readDataFile('articles.json');
  const now = new Date();

  // Filter posts that are published, or scheduled and their publication time has passed
  const publishedPosts = posts.filter(post => {
    if (post.status === 'published') return true;
    if (post.status === 'scheduled' && post.scheduledDate) {
      return new Date(post.scheduledDate) <= now;
    }
    return false;
  }).map(post => {
    // If it was scheduled and time passed, serve it as published
    if (post.status === 'scheduled') {
      return { ...post, status: 'published' };
    }
    return post;
  });

  // Sort by created date descending
  publishedPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(publishedPosts);
});

/**
 * GET /api/faqs
 * Public endpoint to fetch active FAQ items
 */
app.get('/api/faqs', (req, res) => {
  const faqs = readDataFile('faqs.json', DEFAULT_FAQS);
  res.json(faqs);
});


/* ==========================================================================
   AUTHENTICATION API ENDPOINTS
   ========================================================================== */

/**
 * GET /api/auth/status
 * Returns current session details
 */
app.get('/api/auth/status', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

/**
 * POST /api/auth/google-login
 * Secure Google Sign-In verification endpoint
 */
app.post('/api/auth/google-login', async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'Google ID Token is required.' });
  }

  if (!oauthClient) {
    return res.status(501).json({ error: 'Google OAuth client is not configured on this server.' });
  }

  try {
    const ticket = await oauthClient.verifyIdToken({
      idToken: idToken,
      audience: GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;

    // Security policy: must belong to @pictorservices.com domain group
    if (!email || !email.endsWith('@pictorservices.com')) {
      return res.status(403).json({ error: 'Access denied: You must log in with a @pictorservices.com account.' });
    }

    req.session.user = {
      email,
      name,
      picture,
      role: 'admin'
    };

    res.json({ success: true, user: req.session.user });
  } catch (error) {
    console.error('Google token verification error:', error);
    res.status(400).json({ error: 'Invalid Google Sign-In token.' });
  }
});

/**
 * POST /api/auth/mock-login
 * Developer bypass login flow when Google Client ID is not configured (or in dev environment)
 */
app.post('/api/auth/mock-login', (req, res) => {
  const { email, name } = req.body;

  // Block mock logins in production environments if Google Sign In is enabled
  if (process.env.NODE_ENV === 'production' && GOOGLE_CLIENT_ID) {
    return res.status(403).json({ error: 'Mock login disabled in production.' });
  }

  if (!email || !email.endsWith('@pictorservices.com')) {
    return res.status(403).json({ error: 'Access denied: User must belong to @pictorservices.com domain.' });
  }

  req.session.user = {
    email,
    name: name || 'Local Administrator',
    picture: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    role: 'admin',
    isMock: true
  };

  res.json({ success: true, user: req.session.user });
});

/**
 * POST /api/auth/logout
 * Destroys administrative session
 */
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Failed to log out.' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});


/* ==========================================================================
   SECURE ADMIN DASHBOARD APIs (Protected by requireAdmin)
   ========================================================================== */

/**
 * GET & POST /api/admin/config/visa
 * Read/Write Visa subclass pricing variables
 */
app.get('/api/admin/config/visa', requireAdmin, (req, res) => {
  try {
    const fileContent = fs.readFileSync(getRootFilePath('visa-costs.json'), 'utf8');
    res.json(JSON.parse(fileContent));
  } catch (error) {
    console.error('Error loading visa-costs.json:', error);
    res.status(500).json({ error: 'Failed to read visa costs config.' });
  }
});

app.post('/api/admin/config/visa', requireAdmin, (req, res) => {
  try {
    const newConfig = req.body;
    
    // Save as JSON
    fs.writeFileSync(getRootFilePath('visa-costs.json'), JSON.stringify(newConfig, null, 2));

    // Keep visa-config.js in sync
    const jsContent = `// Pictor Services — Visa Cost Estimator Price Configuration\n// Synchronized automatically by admin dashboard\nconst VISA_COSTS_CONFIG = ${JSON.stringify(newConfig, null, 2)};\n\nif (typeof window !== 'undefined') {\n  window.VISA_COSTS_CONFIG = VISA_COSTS_CONFIG;\n}\n`;
    fs.writeFileSync(getRootFilePath('visa-config.js'), jsContent);

    res.json({ success: true, message: 'Visa configurations saved and compiled successfully.' });
  } catch (error) {
    console.error('Error writing visa config:', error);
    res.status(500).json({ error: 'Failed to save visa configuration.' });
  }
});

/**
 * GET & POST /api/admin/config/timelines
 * Read/Write Visa processing time ranges
 */
app.get('/api/admin/config/timelines', requireAdmin, (req, res) => {
  try {
    const fileContent = fs.readFileSync(getRootFilePath('processing-times.json'), 'utf8');
    res.json(JSON.parse(fileContent));
  } catch (error) {
    console.error('Error loading processing-times.json:', error);
    res.status(500).json({ error: 'Failed to read processing times config.' });
  }
});

app.post('/api/admin/config/timelines', requireAdmin, (req, res) => {
  try {
    const newConfig = req.body;
    fs.writeFileSync(getRootFilePath('processing-times.json'), JSON.stringify(newConfig, null, 2));
    res.json({ success: true, message: 'Processing timeline configurations saved successfully.' });
  } catch (error) {
    console.error('Error writing timelines config:', error);
    res.status(500).json({ error: 'Failed to save timeline configuration.' });
  }
});

/**
 * GET & POST /api/admin/config/points
 * Read/Write Immigration points calculator options
 */
app.get('/api/admin/config/points', requireAdmin, (req, res) => {
  try {
    const fileContent = fs.readFileSync(getRootFilePath('points-config.json'), 'utf8');
    res.json(JSON.parse(fileContent));
  } catch (error) {
    console.error('Error loading points-config.json:', error);
    res.status(500).json({ error: 'Failed to read points calculator config.' });
  }
});

app.post('/api/admin/config/points', requireAdmin, (req, res) => {
  try {
    const newConfig = req.body;
    fs.writeFileSync(getRootFilePath('points-config.json'), JSON.stringify(newConfig, null, 2));
    res.json({ success: true, message: 'Points configuration saved successfully.' });
  } catch (error) {
    console.error('Error writing points config:', error);
    res.status(500).json({ error: 'Failed to save points configuration.' });
  }
});

/**
 * BLOG MANAGEMENT APIs (Admin CRUD)
 */
app.get('/api/admin/blog/posts', requireAdmin, (req, res) => {
  const posts = readDataFile('articles.json');
  // Sort descending by creation date
  posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(posts);
});

app.post('/api/admin/blog/posts', requireAdmin, (req, res) => {
  const { id, title, summary, content, category, coverImage, status, scheduledDate } = req.body;

  if (!title || !content || !category) {
    return res.status(400).json({ error: 'Title, content, and category are required.' });
  }

  const posts = readDataFile('articles.json');
  const nowStr = new Date().toISOString();
  
  // Calculate a standard reading time (roughly 200 words/min)
  const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
  const readTimeVal = Math.max(1, Math.ceil(wordCount / 200));
  const readTimeLabel = `${readTimeVal} min read`;

  // Create clean URL slug
  const slugVal = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  if (id) {
    // Update existing
    const index = posts.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Blog post not found.' });
    }

    posts[index] = {
      ...posts[index],
      title,
      slug: slugVal,
      summary: summary || posts[index].summary,
      content,
      category,
      coverImage: coverImage || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
      status: status || posts[index].status,
      scheduledDate: status === 'scheduled' ? scheduledDate : null,
      readTime: readTimeLabel,
      updatedAt: nowStr
    };

    writeDataFile('articles.json', posts);
    res.json({ success: true, post: posts[index] });
  } else {
    // Insert new
    const newPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      slug: slugVal,
      summary: summary || title.substring(0, 120) + '...',
      content,
      category,
      coverImage: coverImage || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
      author: req.session.user.name,
      status: status || 'draft',
      scheduledDate: status === 'scheduled' ? scheduledDate : null,
      readTime: readTimeLabel,
      createdAt: nowStr,
      updatedAt: nowStr
    };

    posts.push(newPost);
    writeDataFile('articles.json', posts);
    res.json({ success: true, post: newPost });
  }
});

app.delete('/api/admin/blog/posts/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const posts = readDataFile('articles.json');
  const filtered = posts.filter(p => p.id !== id);
  
  if (posts.length === filtered.length) {
    return res.status(404).json({ error: 'Blog post not found.' });
  }

  writeDataFile('articles.json', filtered);
  res.json({ success: true, message: 'Article deleted successfully.' });
});

/**
 * FAQ MANAGEMENT APIs (Admin CRUD)
 */
app.get('/api/admin/faqs', requireAdmin, (req, res) => {
  const faqs = readDataFile('faqs.json', DEFAULT_FAQS);
  res.json(faqs);
});

app.post('/api/admin/faqs', requireAdmin, (req, res) => {
  const { id, question, answer, category, region } = req.body;

  if (!question || !answer || !category || !region) {
    return res.status(400).json({ error: 'Question, answer, category, and region are required.' });
  }

  const faqs = readDataFile('faqs.json', DEFAULT_FAQS);
  const nowStr = new Date().toISOString();

  if (id) {
    const index = faqs.findIndex(f => f.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'FAQ not found.' });
    }

    faqs[index] = {
      ...faqs[index],
      question,
      answer,
      category,
      region,
      updatedAt: nowStr
    };

    writeDataFile('faqs.json', faqs);
    res.json({ success: true, faq: faqs[index] });
  } else {
    const newFaq = {
      id: `faq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      question,
      answer,
      category,
      region,
      createdAt: nowStr,
      updatedAt: nowStr
    };

    faqs.push(newFaq);
    writeDataFile('faqs.json', faqs);
    res.json({ success: true, faq: newFaq });
  }
});

app.delete('/api/admin/faqs/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const faqs = readDataFile('faqs.json', DEFAULT_FAQS);
  const filtered = faqs.filter(f => f.id !== id);
  
  if (faqs.length === filtered.length) {
    return res.status(404).json({ error: 'FAQ not found.' });
  }

  writeDataFile('faqs.json', filtered);
  res.json({ success: true, message: 'FAQ deleted successfully.' });
});

/**
 * GET /api/admin/notifications
 * Merged list of booked consultations and contact messages
 */
app.get('/api/admin/notifications', requireAdmin, (req, res) => {
  const appointments = readDataFile('appointments.json');
  const messages = readDataFile('messages.json');

  // Sort both by creation timestamp descending
  appointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ appointments, messages });
});

/**
 * POST /api/admin/notifications/reply
 * Logs replies to leads and emails simulated responses back to client
 */
app.post('/api/admin/notifications/reply', requireAdmin, (req, res) => {
  const { type, id, replyMessage } = req.body;

  if (!type || !id || !replyMessage) {
    return res.status(400).json({ error: 'Required fields: type, id, replyMessage' });
  }

  const replyObject = {
    id: `reply_${Date.now()}`,
    message: replyMessage,
    sentAt: new Date().toISOString(),
    sentBy: req.session.user.email
  };

  if (type === 'appointment') {
    const appointments = readDataFile('appointments.json');
    const idx = appointments.findIndex(a => a.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Appointment not found.' });

    appointments[idx].replies = appointments[idx].replies || [];
    appointments[idx].replies.push(replyObject);
    writeDataFile('appointments.json', appointments);

    console.log(`[EMAIL SEND SIMULATION] Sending reply to ${appointments[idx].email}: "${replyMessage}"`);
    return res.json({ success: true, reply: replyObject });
  } else if (type === 'message') {
    const messages = readDataFile('messages.json');
    const idx = messages.findIndex(m => m.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Contact message not found.' });

    messages[idx].replies = messages[idx].replies || [];
    messages[idx].replies.push(replyObject);
    writeDataFile('messages.json', messages);

    console.log(`[EMAIL SEND SIMULATION] Sending reply to ${messages[idx].email}: "${replyMessage}"`);
    return res.json({ success: true, reply: replyObject });
  } else {
    res.status(400).json({ error: 'Invalid message/notification type.' });
  }
});


/* ==========================================================================
   PAGE ROUTING & REDIRECTS (Auth Guards)
   ========================================================================== */

// Route for admin page (with server-side session check)
app.get('/admin', (req, res) => {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    res.sendFile(path.join(__dirname, '..', 'admin.html'));
  } else {
    res.redirect('/login');
  }
});

// Route for login page
app.get('/login', (req, res) => {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    res.redirect('/admin');
  } else {
    res.sendFile(path.join(__dirname, '..', 'login.html'));
  }
});

// Intercept direct HTML accesses to keep URLs clean and enforce auth
app.get('/admin.html', (req, res) => {
  res.redirect('/admin');
});

app.get('/login.html', (req, res) => {
  res.redirect('/login');
});

/* ==========================================================================
   STATIC FILE SERVING & CATCH-ALL
   ========================================================================== */

// Serve frontend assets statically
app.use(express.static(path.join(__dirname, '..')));

// Fallback to index.html for undefined requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
