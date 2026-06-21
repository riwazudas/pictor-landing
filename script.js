/* ==========================================================================
   PICTOR SERVICES PREMIUM LANDING PAGE ENGINE (VANILLA JS)
   ========================================================================== */

import { animate } from "https://cdn.jsdelivr.net/npm/motion@11.11.13/+esm";

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================================================
  // 1. REGIONALIZATION & PORTAL ENGINE
  // ==========================================================================
  const btnAu = document.getElementById('btn-au');
  const btnNp = document.getElementById('btn-np');
  const regionalTexts = document.querySelectorAll('.regional-text');
  const regionalBlocks = document.querySelectorAll('.regional-block');
  const leadVisaSelect = document.getElementById('lead-visa-type');
  
  // Target visa pathway lists for each region
  const visaOptions = {
    au: [
      { value: '189', text: 'Skilled Independent (Subclass 189)' },
      { value: '190', text: 'Skilled Nominated (Subclass 190)' },
      { value: '491', text: 'Skilled Work Regional (Subclass 491)' },
      { value: '482', text: 'Employer Sponsorship (Subclass 482)' },
      { value: '186', text: 'Employer Nomination (Subclass 186)' },
      { value: 'py', text: 'Professional Year Program' }
    ],
    np: [
      { value: 'uni', text: 'University & College Placement' },
      { value: '500', text: 'Student Visa (Subclass 500)' },
      { value: 'ielts', text: 'IELTS Preparation Classes' },
      { value: 'pte', text: 'PTE Academic Preparation' },
      { value: 'accom', text: 'Accommodation & Arrival Support' }
    ]
  };

  // Switch Portal function with snappier opacity transitions
  function switchPortal(region, savePreference = true) {
    if (region !== 'au' && region !== 'np') return;
    
    // Add switching transition class
    document.body.classList.add('portal-switching');
    
    setTimeout(() => {
      // Toggle body region classes
      if (region === 'au') {
        document.body.classList.remove('region-np');
        document.body.classList.add('region-au');
        btnAu.classList.add('active');
        btnNp.classList.remove('active');
      } else {
        document.body.classList.remove('region-au');
        document.body.classList.add('region-np');
        btnNp.classList.add('active');
        btnAu.classList.remove('active');
      }
      
      // Update data-attributes on all regionalized texts
      regionalTexts.forEach(el => {
        const textVal = el.getAttribute(`data-${region}`);
        if (textVal) {
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = textVal;
          } else {
            // Check if HTML is needed (e.g. for br tags)
            if (textVal.includes('<br>') || textVal.includes('</span>') || textVal.includes('</div>')) {
              el.innerHTML = textVal;
            } else {
              el.textContent = textVal;
            }
          }
        }
      });

      // Update regional blocks
      regionalBlocks.forEach(block => {
        if (block.getAttribute('data-region') === region) {
          block.style.display = '';
        } else {
          block.style.display = 'none';
        }
      });
      
      // Initialize/Reset services tabs for the active region
      initServicesTabs(region);
      
      // Update the Lead capture form target pathways dropdown
      populateVisaOptions(region);
      
      // Update active states on visualizers if applicable
      updateTimezoneLabels(region);
      
      // Update live Google Calendar if integrated
      if (typeof initGoogleCalendar === 'function') {
        initGoogleCalendar();
      }
      
      // Re-trigger timeline calculations for new content
      if (typeof updateTimelineProgress === 'function') {
        updateTimelineProgress();
      }

      // Save preference if flag set
      if (savePreference) {
        localStorage.setItem('pictor_preferred_portal', region);
      }
      
      // Remove switching transition
      document.body.classList.remove('portal-switching');
    }, 250);
  }

  // Populate dynamic Lead Capture Visa dropdown
  function populateVisaOptions(region) {
    if (!leadVisaSelect) return;
    leadVisaSelect.innerHTML = '';
    const options = visaOptions[region];
    options.forEach(opt => {
      const optionEl = document.createElement('option');
      optionEl.value = opt.value;
      optionEl.textContent = opt.text;
      leadVisaSelect.appendChild(optionEl);
    });
  }

  // Update calendar/booking wizard timezone tags
  function updateTimezoneLabels(region) {
    const tzTags = document.querySelectorAll('.timezone-tag');
    tzTags.forEach(tag => {
      if (region === 'au') {
        tag.textContent = 'Australia / Melbourne (AEST)';
      } else {
        tag.textContent = 'Nepal / Kathmandu (NPT)';
      }
    });
  }

  // Auto Detect timezone
  function autoDetectRegion() {
    // Check local storage first
    const preferred = localStorage.getItem('pictor_preferred_portal');
    if (preferred === 'au' || preferred === 'np') {
      switchPortal(preferred, false);
      return;
    }
    
    // Fallback to timezone check
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const auZones = ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Hobart', 'Darwin', 'Canberra', 'Australia'];
      
      const isAu = auZones.some(zone => tz.includes(zone));
      const isNp = tz.includes('Kathmandu') || tz.includes('Asia/Katmandu');
      
      if (isNp) {
        switchPortal('np', false);
      } else {
        switchPortal('au', false); // Default to Australia Portal
      }
    } catch (e) {
      switchPortal('au', false); // Default if timezone API fails
    }
  }

  // Bind Toggle button clicks
  if (btnAu) btnAu.addEventListener('click', () => switchPortal('au'));
  if (btnNp) btnNp.addEventListener('click', () => switchPortal('np'));

  // Init regional content
  autoDetectRegion();


  // ==========================================================================
  // 2. STICKY HEADER & MOBILE NAVIGATION
  // ==========================================================================
  const header = document.getElementById('header');
  const menuToggle = document.getElementById('menu-toggle');
  const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  // Sticky Scroll Header active
  window.addEventListener('scroll', () => {
    if (header) {
      if (window.scrollY > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  });

  // Mobile menu trigger
  if (menuToggle && mobileNavOverlay) {
    menuToggle.addEventListener('click', () => {
      const isActive = mobileNavOverlay.classList.toggle('active');
      
      // Hamburger animation
      const bars = menuToggle.querySelectorAll('.hamburger-bar');
      if (bars.length >= 3) {
        if (isActive) {
          bars[0].style.transform = 'translateY(7px) rotate(45deg)';
          bars[1].style.opacity = '0';
          bars[2].style.transform = 'translateY(-7px) rotate(-45deg)';
        } else {
          bars[0].style.transform = 'none';
          bars[1].style.opacity = '1';
          bars[2].style.transform = 'none';
        }
      }
    });
  }

  // Close mobile navigation on link click
  if (mobileNavLinks && mobileNavOverlay && menuToggle) {
    mobileNavLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileNavOverlay.classList.remove('active');
        const bars = menuToggle.querySelectorAll('.hamburger-bar');
        if (bars.length >= 3) {
          bars[0].style.transform = 'none';
          bars[1].style.opacity = '1';
          bars[2].style.transform = 'none';
        }
      });
    });
  }



  // ==========================================================================
  // 3. INTERACTIVE SERVICES TAB ENGINE
  // ==========================================================================
  const serviceTabBtns = document.querySelectorAll('.services-tab-btn');
  
  function initServicesTabs(region) {
    const wrapper = document.querySelector(`.services-tab-wrapper[data-region="${region}"]`);
    if (!wrapper) return;

    const wrapperBtns = wrapper.querySelectorAll('.services-tab-btn');
    const wrapperCards = wrapper.querySelectorAll('.service-detail-card');

    if (wrapperBtns.length > 0) {
      wrapperBtns.forEach(btn => btn.classList.remove('active'));
      wrapperCards.forEach(card => card.classList.remove('active'));

      const firstBtn = wrapperBtns[0];
      firstBtn.classList.add('active');

      const targetId = firstBtn.getAttribute('data-tab');
      const targetCard = document.getElementById(targetId);
      if (targetCard) {
        targetCard.classList.add('active');
      }
    }
  }

  serviceTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const parentWrapper = btn.closest('.services-tab-wrapper');
      if (!parentWrapper) return;

      const wrapperBtns = parentWrapper.querySelectorAll('.services-tab-btn');
      const wrapperCards = parentWrapper.querySelectorAll('.service-detail-card');

      wrapperBtns.forEach(b => b.classList.remove('active'));
      wrapperCards.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');

      const targetId = btn.getAttribute('data-tab');
      const targetCard = document.getElementById(targetId);
      if (targetCard) {
        targetCard.classList.add('active');
      }
    });
  });



  // ==========================================================================
  // 4. ANIMATED STATISTICS COUNTER ENGINE
  // ==========================================================================
  const statElements = document.querySelectorAll('.count-up');
  
  function animateCounter(el) {
    const target = parseFloat(el.getAttribute('data-target'));
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 2000; // 2 seconds
    let startTime = null;

    function step(currentTime) {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function (out-quad)
      const easeProgress = progress * (2 - progress);
      const currentVal = Math.floor(easeProgress * target);
      
      // Special formatter for large metrics
      if (target >= 1000) {
        el.textContent = (currentVal / 1000).toFixed(1) + 'k' + suffix;
        if (progress === 1) {
          el.textContent = (target / 1000).toFixed(1) + 'k' + suffix;
        }
      } else {
        el.textContent = currentVal + suffix;
      }
      
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    
    requestAnimationFrame(step);
  }

  // Intersection observer for counters
  const countersObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  statElements.forEach(el => countersObserver.observe(el));


  // ==========================================================================
  // 5. INTERACTIVE VISA PATHWAY VISUALIZER TOOL
  // ==========================================================================
  const situationSelect = document.getElementById('situation-select');
  const resultCard = document.getElementById('pathway-result');
  const resTag = document.getElementById('res-tag');
  const resTitle = document.getElementById('res-title');
  const resDesc = document.getElementById('res-desc');
  const resTime = document.getElementById('res-time');
  const resReq = document.getElementById('res-req');
  const resList = document.getElementById('res-list');

  // Pathway data matrix
  const pathwayData = {
    student: {
      tag: 'Higher Education Subclass 500',
      title: 'Undergrad / Postgrad Student Visa',
      desc: 'For individuals seeking study opportunities in Australia. Confers work rights during study semesters and opens direct pathways to post-study work streams.',
      time: '1 - 3 Months',
      req: 'COE & Valid GTE/GS',
      steps: [
        'Obtain Letter of Offer & COE from registered CRICOS institution',
        'Demonstrate financial capacity requirements',
        'Achieve minimum IELTS 6.0 or PTE equivalent score',
        'Draft a Genuine Student (GS) declaration, submit health metrics'
      ]
    },
    graduate: {
      tag: 'Temporary Graduate Subclass 485',
      title: 'Post-Study Work Visa Stream',
      desc: 'For international students who have graduated with an eligible qualification from an Australian education provider. Permits full work rights.',
      time: '3 - 5 Months',
      req: 'Australian Study Requirement',
      steps: [
        'Complete registered CRICOS course (minimum 2 academic years)',
        'Apply within 6 months of course completion date',
        'Secure competent English level documentation',
        'Arrange OVHC health cover, obtain federal police checks'
      ]
    },
    worker: {
      tag: 'Skilled Independent Subclass 189',
      title: 'Independent Professional Pathway',
      desc: 'Points-tested visa subclass for skilled professionals without state or employer sponsorship. Allows permanent residence and full legal work rights anywhere.',
      time: '8 - 12 Months',
      req: '65 Points Minimum',
      steps: [
        'Secure positive skills assessment from designated authority',
        'Achieve superior English scores (PTE 79+ or IELTS 8.0)',
        'Submit Expression of Interest (EOI) via SkillSelect',
        'Await Invitation to Apply (ITA) round selection from Department'
      ]
    },
    partner: {
      tag: 'Partner Subclasses 820/801 & 309/100',
      title: 'Spouse & De Facto Family Visas',
      desc: 'For partners or spouses of Australian citizens, permanent residents, or eligible New Zealand citizens. Enables permanent residency transitions.',
      time: '12 - 20 Months',
      req: 'Genuine Relationship Proof',
      steps: [
        'Compile joint financial indicators (leases, bank assets)',
        'Document social relationship context and shared history statements',
        'Confirm mutual long-term domestic commitments',
        'Submit provisional subclass and await assessment'
      ]
    },
    employer: {
      tag: 'TSS Subclass 482 & ENS 186',
      title: 'Corporate Sponsored Placement',
      desc: 'Allows employers to address local labor shortages by bringing in genuinely skilled workers. Provides paths to Permanent Residency through 186 ENS.',
      time: '2 - 4 Months',
      req: 'Approved Business Sponsor',
      steps: [
        'Employer files Business Sponsorship status request',
        'Lodge formal nomination identifying target worker position details',
        'Candidate meets Skills and English thresholds',
        'Lodge employee visa application'
      ]
    }
  };

  if (situationSelect) {
    situationSelect.addEventListener('change', (e) => {
      const selected = e.target.value;
      const data = pathwayData[selected];
      
      if (!data) return;

      // Animate transition using class
      resultCard.classList.remove('active');
      
      setTimeout(() => {
        resTag.textContent = data.tag;
        resTitle.textContent = data.title;
        resDesc.textContent = data.desc;
        resTime.textContent = data.time;
        resReq.textContent = data.req;
        
        // Populate checklist
        resList.innerHTML = '';
        data.steps.forEach(step => {
          const li = document.createElement('li');
          li.textContent = step;
          resList.appendChild(li);
        });
        
        resultCard.classList.add('active');
      }, 200);
    });
  }


  // ==========================================================================
  // 6. CUSTOM CONSULTATION WIZARD SCHEDULER
  // ==========================================================================
  const wizardIndicators = document.querySelectorAll('.step-indicator');
  const wizardSteps = document.querySelectorAll('.wizard-step');
  const calendarMonthYear = document.getElementById('calendar-month-year');
  const calendarDays = document.getElementById('calendar-days');
  const timeslotsGrid = document.getElementById('timeslots-grid');
  const selectedDateStr = document.getElementById('selected-date-str');
  const summaryDateTime = document.getElementById('summary-date-time');
  const confirmedEmail = document.getElementById('confirmed-email');
  
  const receiptDate = document.getElementById('receipt-date');
  const receiptTime = document.getElementById('receipt-time');
  const receiptMode = document.getElementById('receipt-mode');

  const btnStep2 = document.getElementById('btn-goto-step-2');
  const btnStep3 = document.getElementById('btn-goto-step-3');
  const bookingDetailsForm = document.getElementById('booking-details-form');

  // Google Calendar Integration State & Logic
  let googleScriptLoaded = false;
  
  window.initGoogleCalendar = function() {
    const config = window.GOOGLE_CALENDAR_CONFIG;
    if (!config || !config.enabled) {
      const selector = document.getElementById('booking-method-selector');
      if (selector) selector.style.display = 'none';
      window.toggleBookingMethod('manual');
      return;
    }
    
    // Determine active region
    const isAu = document.body.classList.contains('region-au');
    const region = isAu ? 'au' : 'np';
    const scheduleUrl = config.schedules[region];
    
    const iframe = document.getElementById('google-calendar-iframe');
    const directLink = document.getElementById('google-calendar-direct-link');
    const loader = document.getElementById('calendar-loader');
    const fallback = document.getElementById('calendar-fallback');
    const popupCard = document.getElementById('calendar-popup-card');
    const popupTarget = document.getElementById('google-calendar-popup-target');
    
    if (directLink) {
      directLink.href = scheduleUrl;
    }
    
    if (config.displayMode === 'inline') {
      if (popupCard) popupCard.style.display = 'none';
      if (iframe && loader) {
        loader.style.display = 'flex';
        iframe.style.display = 'none';
        if (fallback) fallback.style.display = 'none';
        
        // Load the iframe
        iframe.src = scheduleUrl;
        
        // Handle iframe onload
        iframe.onload = () => {
          loader.style.display = 'none';
          iframe.style.display = 'block';
        };
        
        // Fallback timeout: If iframe doesn't load in 8 seconds, show fallback link
        setTimeout(() => {
          if (loader.style.display === 'flex') {
            loader.style.display = 'none';
            if (fallback) fallback.style.display = 'block';
          }
        }, 8000);
      }
    } else if (config.displayMode === 'popup') {
      if (iframe) iframe.style.display = 'none';
      if (loader) loader.style.display = 'none';
      if (fallback) fallback.style.display = 'none';
      if (popupCard) popupCard.style.display = 'flex';
      
      // Load Google Calendar JS/CSS if not already loaded
      if (!googleScriptLoaded) {
        // Load CSS
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://calendar.google.com/calendar/scheduling-button-script.css';
        document.head.appendChild(cssLink);
        
        // Load JS
        const jsScript = document.createElement('script');
        jsScript.src = 'https://calendar.google.com/calendar/scheduling-button-script.js';
        jsScript.async = true;
        jsScript.onload = () => {
          googleScriptLoaded = true;
          renderGooglePopupButton(scheduleUrl, config.themeColor, popupTarget);
        };
        document.head.appendChild(jsScript);
      } else {
        renderGooglePopupButton(scheduleUrl, config.themeColor, popupTarget);
      }
    }
  }

  function renderGooglePopupButton(url, color, targetEl) {
    if (!targetEl) return;
    if (window.calendar && window.calendar.schedulingButton) {
      // Clear previous button contents
      targetEl.innerHTML = '';
      window.calendar.schedulingButton.load({
        url: url,
        color: color,
        label: 'Book consultation session',
        target: targetEl
      });
    } else {
      // Retry after a short delay if script is not fully parsed yet
      setTimeout(() => renderGooglePopupButton(url, color, targetEl), 100);
    }
  }

  window.toggleBookingMethod = function(method) {
    const liveBtn = document.getElementById('method-btn-live');
    const manualBtn = document.getElementById('method-btn-manual');
    const googleContainer = document.getElementById('google-calendar-container');
    const wizardIndicator = document.querySelector('.wizard-steps-indicator');
    const wizardBody = document.querySelector('.wizard-body');
    
    if (!googleContainer || !wizardIndicator || !wizardBody) return;
    
    if (method === 'live') {
      if (liveBtn) liveBtn.classList.add('active');
      if (manualBtn) manualBtn.classList.remove('active');
      googleContainer.style.display = 'block';
      wizardIndicator.style.display = 'none';
      wizardBody.style.display = 'none';
      
      // Initialize/load active region schedule
      window.initGoogleCalendar();
    } else {
      if (manualBtn) manualBtn.classList.add('active');
      if (liveBtn) liveBtn.classList.remove('active');
      googleContainer.style.display = 'none';
      wizardIndicator.style.display = 'flex';
      wizardBody.style.display = 'block';
    }
  }

  // Bind tab click events
  const liveBtn = document.getElementById('method-btn-live');
  const manualBtn = document.getElementById('method-btn-manual');
  if (liveBtn) liveBtn.addEventListener('click', () => window.toggleBookingMethod('live'));
  if (manualBtn) manualBtn.addEventListener('click', () => window.toggleBookingMethod('manual'));

  let chosenDate = null;
  let chosenTime = null;
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Helper function to shift wizard tabs
  function navigateWizard(stepNum) {
    wizardSteps.forEach(step => step.classList.remove('active'));
    document.getElementById(`wizard-step-${stepNum}`).classList.add('active');

    // Update progress dots
    wizardIndicators.forEach(ind => {
      const idx = parseInt(ind.getAttribute('data-step'));
      ind.classList.remove('active', 'completed');
      if (idx === stepNum) {
        ind.classList.add('active');
      } else if (idx < stepNum) {
        ind.classList.add('completed');
      }
    });
  }

  // Bind back buttons
  document.querySelectorAll('.btn-wizard-back').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetStep = parseInt(btn.getAttribute('data-goto'));
      navigateWizard(targetStep);
    });
  });

  // Calendar builder
  function renderCalendar(month, year) {
    if (!calendarDays) return;
    calendarDays.innerHTML = '';
    
    calendarMonthYear.textContent = `${monthNames[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const prevLastDay = new Date(year, month, 0).getDate();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Padding from previous month
    for (let i = firstDayIndex; i > 0; i--) {
      const btn = document.createElement('button');
      btn.className = 'calendar-day-btn';
      btn.disabled = true;
      btn.textContent = prevLastDay - i + 1;
      calendarDays.appendChild(btn);
    }

    // Days in current month
    for (let day = 1; day <= lastDay; day++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'calendar-day-btn';
      btn.textContent = day;
      
      const evalDate = new Date(year, month, day);
      evalDate.setHours(0,0,0,0);

      // Disable weekends and past dates
      const dayOfWeek = evalDate.getDay();
      if (evalDate < today || dayOfWeek === 0 || dayOfWeek === 6) {
        btn.disabled = true;
      }

      // Check if matches today
      if (evalDate.getTime() === today.getTime()) {
        btn.classList.add('today');
      }

      // Check if selected
      if (chosenDate && evalDate.getTime() === chosenDate.getTime()) {
        btn.classList.add('selected');
      }

      btn.addEventListener('click', () => {
        // Clear active selections
        document.querySelectorAll('.calendar-day-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        
        chosenDate = new Date(year, month, day);
        
        // Unlock next step button
        btnStep2.removeAttribute('disabled');
      });

      calendarDays.appendChild(btn);
    }
  }

  // Month navigation
  const prevMonthBtn = document.getElementById('prev-month');
  const nextMonthBtn = document.getElementById('next-month');

  if (prevMonthBtn && nextMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      renderCalendar(currentMonth, currentYear);
    });

    nextMonthBtn.addEventListener('click', () => {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      renderCalendar(currentMonth, currentYear);
    });
  }

  // Load calendar on start
  renderCalendar(currentMonth, currentYear);

  // Initialize booking method based on config
  const calConfig = window.GOOGLE_CALENDAR_CONFIG;
  let initialMethod = 'manual';
  if (calConfig && calConfig.enabled) {
    if (calConfig.displayMode === 'api') {
      const selector = document.getElementById('booking-method-selector');
      if (selector) selector.style.display = 'none';
      initialMethod = 'manual';
    } else {
      const selector = document.getElementById('booking-method-selector');
      if (selector) selector.style.display = 'flex';
      initialMethod = calConfig.defaultMethod || 'live';
    }
  } else {
    const selector = document.getElementById('booking-method-selector');
    if (selector) selector.style.display = 'none';
  }
  window.toggleBookingMethod(initialMethod);

  // Next steps triggers
  if (btnStep2) {
    btnStep2.addEventListener('click', () => {
      if (!chosenDate) return;
      
      // Update selected date text
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      selectedDateStr.textContent = chosenDate.toLocaleDateString('en-US', options);
      
      // Render timeslots
      renderTimeslots();
      
      // Disable next steps until slot clicked
      btnStep3.setAttribute('disabled', 'true');
      chosenTime = null;
      
      navigateWizard(2);
    });
  }

  // Fetch available slots from backend
  async function fetchAvailableSlots(dateStr, region) {
    const config = window.GOOGLE_CALENDAR_CONFIG;
    if (!config || !config.enabled || config.displayMode !== 'api') {
      return ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"];
    }

    try {
      const url = `${config.apiUrl}/available-slots?date=${dateStr}&region=${region}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('API server returned error');
      const data = await response.json();
      return data.slots || [];
    } catch (e) {
      console.warn('Could not fetch slots from backend. Falling back to default slots.', e);
      return ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"];
    }
  }

  // Timeslots generator
  async function renderTimeslots() {
    if (!timeslotsGrid) return;
    timeslotsGrid.innerHTML = '';

    // Show loading state
    const loaderContainer = document.createElement('div');
    loaderContainer.className = 'timeslots-loader';
    loaderContainer.innerHTML = '<div class="spinner-ring small-spinner"></div><p style="font-size:0.85rem; color:var(--color-text-light);">Loading slots...</p>';
    timeslotsGrid.appendChild(loaderContainer);

    // Disable step 3 button while loading
    if (btnStep3) btnStep3.setAttribute('disabled', 'true');

    // Get active region and formatted date
    const isAu = document.body.classList.contains('region-au');
    const region = isAu ? 'au' : 'np';

    const year = chosenDate.getFullYear();
    const month = String(chosenDate.getMonth() + 1).padStart(2, '0');
    const day = String(chosenDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const slots = await fetchAvailableSlots(dateStr, region);

    timeslotsGrid.innerHTML = '';

    if (slots.length === 0) {
      const emptyMsg = document.createElement('p');
      emptyMsg.className = 'no-slots-msg';
      emptyMsg.textContent = 'No available consultation slots for this date. Please select another day.';
      emptyMsg.style.cssText = 'grid-column: 1 / -1; text-align: center; font-size: 0.9rem; color: var(--color-text-light); padding: 20px 0;';
      timeslotsGrid.appendChild(emptyMsg);
      return;
    }

    slots.forEach(slot => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'timeslot-btn';
      btn.textContent = slot;

      if (chosenTime === slot) {
        btn.classList.add('selected');
        if (btnStep3) btnStep3.removeAttribute('disabled');
      }

      btn.addEventListener('click', () => {
        document.querySelectorAll('.timeslot-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        chosenTime = slot;
        
        // Enable next step button
        if (btnStep3) btnStep3.removeAttribute('disabled');
      });

      timeslotsGrid.appendChild(btn);
    });
  }

  if (btnStep3) {
    btnStep3.addEventListener('click', () => {
      if (!chosenDate || !chosenTime) return;

      const dateOptions = { month: 'short', day: 'numeric', year: 'numeric' };
      const formattedDate = chosenDate.toLocaleDateString('en-US', dateOptions);
      
      // Determine active timezone
      const isAu = document.body.classList.contains('region-au');
      const tzSuffix = isAu ? 'AEST' : 'NPT';
      
      summaryDateTime.textContent = `${formattedDate} at ${chosenTime} (${tzSuffix})`;
      navigateWizard(3);
    });
  }

  // Details form submission
  if (bookingDetailsForm) {
    bookingDetailsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const clientName = document.getElementById('booking-name').value;
      const clientEmail = document.getElementById('booking-email').value;
      const clientPhone = document.getElementById('booking-phone').value;
      const clientMode = document.getElementById('booking-mode');
      const clientModeText = clientMode.options[clientMode.selectedIndex].text;

      const submitBtn = bookingDetailsForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : 'Book My Session';
      
      if (submitBtn) {
        submitBtn.textContent = 'Scheduling...';
        submitBtn.setAttribute('disabled', 'true');
      }

      // Format selected date
      const year = chosenDate.getFullYear();
      const month = String(chosenDate.getMonth() + 1).padStart(2, '0');
      const day = String(chosenDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const isAu = document.body.classList.contains('region-au');
      const region = isAu ? 'au' : 'np';

      const payload = {
        name: clientName,
        email: clientEmail,
        phone: clientPhone,
        notes: `Preferred Consultation Mode: ${clientModeText}`,
        date: dateStr,
        time: chosenTime,
        region: region
      };

      const config = window.GOOGLE_CALENDAR_CONFIG;
      let meetLink = '';
      
      if (config && config.enabled && config.displayMode === 'api') {
        try {
          const response = await fetch(`${config.apiUrl}/book-appointment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Failed to submit booking');
          }
          
          const result = await response.json();
          meetLink = result.meetLink;
        } catch (error) {
          alert(`Booking Error: ${error.message}. Please try again.`);
          if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.removeAttribute('disabled');
          }
          return;
        }
      }

      // Restore submit button state
      if (submitBtn) {
        submitBtn.textContent = originalText;
        submitBtn.removeAttribute('disabled');
      }

      // Update receipts
      const dateOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
      receiptDate.textContent = chosenDate.toLocaleDateString('en-US', dateOptions);
      
      const tzSuffix = isAu ? 'AEST' : 'NPT';
      receiptTime.textContent = `${chosenTime} (${tzSuffix})`;
      receiptMode.textContent = clientModeText;
      confirmedEmail.textContent = clientEmail;

      // Handle Google Meet Link display
      const meetRow = document.getElementById('receipt-meet-row');
      const meetAnchor = document.getElementById('receipt-meet-link');
      if (meetLink && meetRow && meetAnchor) {
        meetAnchor.href = meetLink;
        meetRow.style.display = 'flex';
      } else if (meetRow) {
        meetRow.style.display = 'none';
      }

      navigateWizard(4);
    });
  }

  // Reset booking wizard helper
  const btnResetWizard = document.querySelector('.btn-reset-wizard');
  if (btnResetWizard) {
    btnResetWizard.addEventListener('click', () => {
      chosenDate = null;
      chosenTime = null;
      bookingDetailsForm.reset();
      
      if (btnStep2) btnStep2.setAttribute('disabled', 'true');
      
      renderCalendar(currentMonth, currentYear);
      navigateWizard(1);
    });
  }


  // ==========================================================================
  // 7. TIMELINE PROGRESS TRACKER
  // ==========================================================================
  const timelineSection = document.getElementById('process');
  const progressFill = document.getElementById('timeline-progress-fill');
  const timelineNodes = document.querySelectorAll('.timeline-node');

  function updateTimelineProgress() {
    if (!timelineSection || !progressFill) return;

    const rect = timelineSection.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Calculate how far into the viewport the timeline section is
    // 0 = just entered bottom, 1 = section is fully scrolled past top
    const totalHeight = rect.height + viewportHeight;
    const scrolledAmount = viewportHeight - rect.top;
    
    let ratio = Math.max(0, Math.min(scrolledAmount / rect.height, 1));

    // Refined progress mapping for better visuals
    if (rect.top > viewportHeight) ratio = 0;
    if (rect.bottom < 0) ratio = 1;

    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      progressFill.style.height = `${ratio * 100}%`;
      progressFill.style.width = '100%';
    } else {
      progressFill.style.width = `${ratio * 100}%`;
      progressFill.style.height = '100%';
    }

    // Highlight node bullets step-by-step
    const numNodes = timelineNodes.length;
    timelineNodes.forEach((node, idx) => {
      const threshold = (idx + 0.5) / numNodes;
      if (ratio >= threshold) {
        node.classList.add('active');
      } else {
        node.classList.remove('active');
      }
    });
  }

  window.addEventListener('scroll', updateTimelineProgress);
  window.addEventListener('resize', updateTimelineProgress);


  // ==========================================================================
  // 8. FAQ ACCORDION ENGINE
  // ==========================================================================
  const faqTriggers = document.querySelectorAll('.faq-trigger');

  faqTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const parent = trigger.parentElement;
      const content = trigger.nextElementSibling;
      const isOpen = parent.classList.contains('active');

      // Collapse all FAQ items first (one open at a time requirement)
      document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
        item.querySelector('.faq-trigger').setAttribute('aria-expanded', 'false');
        item.querySelector('.faq-content').style.maxHeight = '0';
      });

      if (!isOpen) {
        parent.classList.add('active');
        trigger.setAttribute('aria-expanded', 'true');
        // Set dynamic height based on scrollHeight
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    });
  });


  // ==========================================================================
  // 9. LEAD CAPTURE MULTI-STEP FORM
  // ==========================================================================
  const leadForm = document.getElementById('lead-capture-form');
  const formStep1 = document.getElementById('form-step-1-el');
  const formStep2 = document.getElementById('form-step-2-el');
  const formSuccess = document.getElementById('form-step-success');
  const formDot1 = document.getElementById('form-step-dot-1');
  const formDot2 = document.getElementById('form-step-dot-2');

  const btnNextForm = document.getElementById('btn-next-form-step');
  const btnPrevForm = document.getElementById('btn-prev-form-step');

  const inputName = document.getElementById('lead-name');
  const inputEmail = document.getElementById('lead-email');
  const inputPhone = document.getElementById('lead-phone');
  const inputCountry = document.getElementById('lead-country');
  const inputVisa = document.getElementById('lead-visa-type');
  const inputMessage = document.getElementById('lead-message');

  const summaryName = document.getElementById('summary-lead-name');
  const summaryPathway = document.getElementById('summary-lead-pathway');
  const summaryRef = document.getElementById('summary-lead-ref');

  if (btnNextForm) {
    btnNextForm.addEventListener('click', () => {
      // Validate step 1 fields before moving next
      if (inputName.checkValidity() && inputEmail.checkValidity() && inputPhone.checkValidity() && inputCountry.checkValidity()) {
        formStep1.classList.remove('active');
        formStep2.classList.add('active');
        formDot1.classList.remove('active');
        formDot2.classList.add('active');
      } else {
        // Trigger default browser form validation visual cues
        inputName.reportValidity() || inputEmail.reportValidity() || inputPhone.reportValidity() || inputCountry.reportValidity();
      }
    });
  }

  if (btnPrevForm) {
    btnPrevForm.addEventListener('click', () => {
      formStep2.classList.remove('active');
      formStep1.classList.add('active');
      formDot2.classList.remove('active');
      formDot1.classList.add('active');
    });
  }

  if (leadForm) {
    leadForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameVal = inputName.value;
      const visaText = inputVisa.options[inputVisa.selectedIndex].text;
      
      const submitBtn = leadForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : 'Submit Request';
      
      if (submitBtn) {
        submitBtn.textContent = 'Sending...';
        submitBtn.setAttribute('disabled', 'true');
      }

      const payload = {
        name: nameVal,
        email: inputEmail.value,
        phone: inputPhone.value,
        country: inputCountry.value,
        visaType: visaText,
        message: inputMessage.value
      };

      const config = window.GOOGLE_CALENDAR_CONFIG;
      const apiUrl = (config && config.apiUrl) ? config.apiUrl.replace('/api', '') : 'http://localhost:3000';
      
      let refCode = 'PCT-' + Math.floor(1000 + Math.random() * 9000);

      try {
        const response = await fetch(`${apiUrl}/api/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.refCode) {
            refCode = result.refCode;
          }
        }
      } catch (err) {
        console.warn('Failed to register lead on the backend. Falling back to local offline code generation.', err);
      } finally {
        if (submitBtn) {
          submitBtn.textContent = originalText;
          submitBtn.removeAttribute('disabled');
        }
      }

      // Populate success screens receipts
      summaryName.textContent = nameVal;
      summaryPathway.textContent = visaText;
      summaryRef.textContent = refCode;

      formStep2.classList.remove('active');
      formSuccess.classList.add('active');
      
      // Hide step dots indicator row
      const progressHeader = document.querySelector('.form-progress-indicator');
      if (progressHeader) progressHeader.style.display = 'none';
    });
  }

  // Reset contact lead form handler
  const btnResetForm = document.getElementById('btn-reset-form');
  if (btnResetForm) {
    btnResetForm.addEventListener('click', () => {
      leadForm.reset();
      
      formSuccess.classList.remove('active');
      formStep1.classList.add('active');
      formDot1.classList.add('active');
      formDot2.classList.remove('active');

      const progressHeader = document.querySelector('.form-progress-indicator');
      if (progressHeader) progressHeader.style.display = 'flex';
    });
  }


  // ==========================================================================
  // 10. INTERSECTION OBSERVER REVEAL ANIMATIONS
  // ==========================================================================
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, { threshold: 0.15 });

  revealElements.forEach(el => revealObserver.observe(el));


  // ==========================================================================
  // 11. NEWSLETTER & BACK TO TOP BUTTONS
  // ==========================================================================
  // Newsletter Form handler
  const newsForm = document.getElementById('newsletter-form');
  const newsSuccess = document.getElementById('newsletter-success');

  if (newsForm && newsSuccess) {
    newsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      newsForm.style.display = 'none';
      newsSuccess.style.display = 'block';
    });
  }

  // Back to top sticky button scroll listener
  const backToTopBtn = document.getElementById('back-to-top');
  
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        backToTopBtn.style.opacity = '1';
        backToTopBtn.style.pointerEvents = 'auto';
      } else {
        backToTopBtn.style.opacity = '0';
        backToTopBtn.style.pointerEvents = 'none';
      }
    });
  }

});
