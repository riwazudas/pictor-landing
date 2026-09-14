/* ==========================================================================
   PICTOR SERVICES PREMIUM LANDING PAGE ENGINE (VANILLA JS)
   ========================================================================== */

import { animate } from "https://cdn.jsdelivr.net/npm/motion@11.11.13/+esm";

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================================================
  // 0. LOCATION BAR CONTROLLER (Local Dev Switcher Close & Prod Auto-Hide)
  // ==========================================================================
  const hostname = window.location.hostname;
  const isLocalDev = hostname === 'localhost' ||
                     hostname === '127.0.0.1' ||
                     hostname === '' ||
                     hostname.startsWith('192.168.') ||
                     hostname.startsWith('10.') ||
                     window.location.protocol === 'file:';

  const topBar = document.querySelector('.top-bar');
  if (topBar) {
    if (!isLocalDev) {
      topBar.style.display = 'none';
      document.body.classList.add('top-bar-hidden');
    } else {
      if (localStorage.getItem('pictor_topbar_closed') === 'true') {
        topBar.style.display = 'none';
        document.body.classList.add('top-bar-hidden');
      } else {
        // Inject Close button
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'top-bar-close-btn';
        closeBtn.innerHTML = '&times;';
        closeBtn.setAttribute('aria-label', 'Close location switcher');
        closeBtn.style.cssText = `
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0 0 0 16px;
          line-height: 1;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        `;
        closeBtn.addEventListener('mouseenter', () => closeBtn.style.color = '#fff');
        closeBtn.addEventListener('mouseleave', () => closeBtn.style.color = 'rgba(255, 255, 255, 0.6)');
        
        const container = topBar.querySelector('.top-bar-container');
        if (container) {
          container.appendChild(closeBtn);
        }
        
        closeBtn.addEventListener('click', () => {
          topBar.style.display = 'none';
          document.body.classList.add('top-bar-hidden');
          localStorage.setItem('pictor_topbar_closed', 'true');
        });
      }
    }
  }

  // ==========================================================================
  // 1. REGIONALIZATION & PORTAL ENGINE
  // ==========================================================================
  const regionalTexts = document.querySelectorAll('.regional-text');
  const regionalBlocks = document.querySelectorAll('.regional-block');
  const leadVisaSelect = document.getElementById('lead-visa-type');
  
  // Random Hero Headings Selection (randomized on page load)
  const chosenHeroHeadingIndex = Math.floor(Math.random() * 4);
  const heroHeadings = {
    au: [
      "Your Journey.<br><span class='text-primary'>Our Expertise.</span>",
      "Navigate Your Path<br>to <span class='text-primary'>Australia.</span>",
      "Your Trusted Partner<br>for <span class='text-primary'>Australian Migration.</span>",
      "Achieve Your Dream of<br>Living in <span class='text-primary'>Australia.</span>"
    ],
    np: [
      "Your Future.<br><span class='text-primary'>Our Guidance.</span>",
      "Study Abroad with<br><span class='text-primary'>Confidence.</span>",
      "Your Gateway to<br>Global <span class='text-primary'>Education.</span>",
      "Empowering Your<br>Educational <span class='text-primary'>Journey.</span>"
    ]
  };

  // Target visa pathway lists for each region
  const visaOptions = {
    au: [
      { value: '189', text: 'Skilled Independent (Subclass 189)' },
      { value: '190', text: 'Skilled Nominated (Subclass 190)' },
      { value: '491', text: 'Skilled Work Regional (Subclass 491)' },
      { value: '482', text: 'Skills in Demand visa (Subclass 482)' },
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
  function switchPortal(region, savePreference = true, immediate = false) {
    if (region !== 'au' && region !== 'np') return;
    
    const applyPortalState = () => {
      try {
        const btnsAu = document.querySelectorAll('.btn-portal-au, #btn-au, [data-portal-switch="au"]');
        const btnsNp = document.querySelectorAll('.btn-portal-np, #btn-np, [data-portal-switch="np"]');

        // Toggle body region classes and button states
        if (region === 'au') {
          document.body.classList.remove('region-np');
          document.body.classList.add('region-au');
          btnsAu.forEach(btn => btn.classList.add('active'));
          btnsNp.forEach(btn => btn.classList.remove('active'));
        } else {
          document.body.classList.remove('region-au');
          document.body.classList.add('region-np');
          btnsNp.forEach(btn => btn.classList.add('active'));
          btnsAu.forEach(btn => btn.classList.remove('active'));
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

        // Update hero heading text dynamically with randomized option
        const headingElement = document.querySelector('.hero-heading');
        if (headingElement && heroHeadings[region]) {
          headingElement.innerHTML = heroHeadings[region][chosenHeroHeadingIndex];
        }

        // Update regional blocks
        regionalBlocks.forEach(block => {
          if (block.getAttribute('data-region') === region) {
            block.style.display = '';
          } else {
            block.style.display = 'none';
          }
        });
        
        // Initialize/Reset services tabs for the active region
        if (typeof initServicesTabs === 'function') {
          initServicesTabs(region);
        }
        
        // Update active states on visualizers if applicable
        updateTimezoneLabels(region);
        
        // Re-trigger timeline calculations for new content
        try {
          if (typeof updateTimelineProgress === 'function') {
            updateTimelineProgress();
          }
        } catch (timelineErr) {
          console.warn('Timeline tracker deferred:', timelineErr);
        }

        // Update secondary Hero button href if present
        const heroSecondaryBtn = document.querySelector('.btn-hero-secondary');
        if (heroSecondaryBtn) {
          if (region === 'au') {
            heroSecondaryBtn.setAttribute('href', 'visa-options.html');
          } else {
            heroSecondaryBtn.setAttribute('href', 'services.html#education');
          }
        }

        // Save preference if flag set
        if (savePreference) {
          localStorage.setItem('pictor_preferred_portal', region);
        }
        
        // Dispatch custom event for pages or components listening for portal switch
        document.dispatchEvent(new CustomEvent('portalSwitched', { detail: { region } }));
      } finally {
        // Always remove switching transition
        document.body.classList.remove('portal-switching');
      }
    };

    if (immediate) {
      applyPortalState();
    } else {
      // Add switching transition class
      document.body.classList.add('portal-switching');
      setTimeout(applyPortalState, 250);
    }
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

  // Auto Detect timezone & location
  // Requirement: if the location is not Australian then always default to the Nepal website
  function autoDetectRegion() {
    // Check local storage first (explicit user choice)
    const preferred = localStorage.getItem('pictor_preferred_portal');
    if (preferred === 'au' || preferred === 'np') {
      switchPortal(preferred, false, true);
      return;
    }
    
    // Fallback to timezone check
    try {
      const tz = (Intl && Intl.DateTimeFormat) ? Intl.DateTimeFormat().resolvedOptions().timeZone || '' : '';
      const auZones = [
        'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Hobart',
        'Darwin', 'Canberra', 'Lord_Howe', 'Broken_Hill', 'Currie', 'Eucla',
        'Lindeman', 'Australia'
      ];
      
      const isAu = tz.startsWith('Australia/') || auZones.some(zone => tz.includes(zone));
      
      if (isAu) {
        switchPortal('au', false, true);
      } else {
        // If not Australian, always default to Nepal website
        switchPortal('np', false, true);
      }
    } catch (e) {
      // Default to Nepal website if timezone API fails
      switchPortal('np', false, true);
    }
  }

  // Bind Toggle button clicks across the page
  document.querySelectorAll('.btn-portal-au, #btn-au, [data-portal-switch="au"]').forEach(btn => {
    btn.addEventListener('click', () => switchPortal('au'));
  });
  document.querySelectorAll('.btn-portal-np, #btn-np, [data-portal-switch="np"]').forEach(btn => {
    btn.addEventListener('click', () => switchPortal('np'));
  });

  // Delegated click listener for dynamic or footer portal switchers
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-portal-switch]');
    if (target) {
      const targetRegion = target.getAttribute('data-portal-switch');
      if (targetRegion === 'au' || targetRegion === 'np') {
        switchPortal(targetRegion);
      }
    }
  });

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
      
      // Special formatter for large metrics (e.g. 5k+ instead of 5.0k+)
      if (target >= 1000) {
        const val = currentVal / 1000;
        const formattedVal = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1);
        el.textContent = formattedVal + 'k' + suffix;
        if (progress === 1) {
          const finalVal = target / 1000;
          const formattedFinal = finalVal % 1 === 0 ? finalVal.toFixed(0) : finalVal.toFixed(1);
          el.textContent = formattedFinal + 'k' + suffix;
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
      tag: 'Skills in Demand Subclass 482 & ENS 186',
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
  // 7. TIMELINE PROGRESS TRACKER
  // ==========================================================================
  function updateTimelineProgress() {
    const timelineSection = document.getElementById('process');
    const timelineNodes = document.querySelectorAll('.v-timeline-node');
    if (!timelineSection || timelineNodes.length === 0) return;

    const rect = timelineSection.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Calculate how far into the viewport the timeline section is
    const scrolledAmount = viewportHeight - rect.top;
    
    let ratio = Math.max(0, Math.min(scrolledAmount / rect.height, 1));

    if (rect.top > viewportHeight) ratio = 0;
    if (rect.bottom < 0) ratio = 1;

    // Highlight node bullets step-by-step
    const numNodes = timelineNodes.length;
    timelineNodes.forEach((node, idx) => {
      const threshold = (idx) / numNodes;
      if (ratio >= threshold) {
        node.classList.add('active');
      } else {
        node.classList.remove('active');
      }
    });
    // Ensure at least step 1 is active when section is in view
    if (ratio > 0 && timelineNodes[0]) {
      timelineNodes[0].classList.add('active');
    }
  }

  window.addEventListener('scroll', updateTimelineProgress);
  window.addEventListener('resize', updateTimelineProgress);

  // ==========================================================================
  // 7b. TESTIMONIAL SLIDER ENGINE
  // ==========================================================================
  const slides = document.querySelectorAll('.testimonial-slide');
  const dots = document.querySelectorAll('#testimonial-dots .slider-dot');
  const prevBtn = document.getElementById('prev-testimonial-btn');
  const nextBtn = document.getElementById('next-testimonial-btn');
  let currentSlide = 0;

  function showSlide(index) {
    if (slides.length === 0) return;
    
    // Boundary checks
    if (index >= slides.length) currentSlide = 0;
    else if (index < 0) currentSlide = slides.length - 1;
    else currentSlide = index;

    slides.forEach((slide, idx) => {
      if (idx === currentSlide) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });

    dots.forEach((dot, idx) => {
      if (idx === currentSlide) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
      showSlide(currentSlide - 1);
    });

    nextBtn.addEventListener('click', () => {
      showSlide(currentSlide + 1);
    });

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const index = parseInt(dot.getAttribute('data-index'), 10);
        showSlide(index);
      });
    });

    // Auto rotate every 8 seconds
    setInterval(() => {
      showSlide(currentSlide + 1);
    }, 8000);
  }


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
  // 11. BACK TO TOP BUTTON
  // ==========================================================================

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
