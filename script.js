/* ==========================================================================
   PICTOR SERVICES PREMIUM LANDING PAGE ENGINE (VANILLA JS)
   ========================================================================== */



document.addEventListener('DOMContentLoaded', () => {
  
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

  function switchServiceTab(parentWrapper, targetIndex, direction) {
    if (!parentWrapper) return;
    const wrapperBtns = Array.from(parentWrapper.querySelectorAll('.services-tab-btn'));
    const wrapperCards = Array.from(parentWrapper.querySelectorAll('.service-detail-card'));
    if (wrapperBtns.length === 0) return;

    let targetIdx = targetIndex;
    if (targetIdx < 0) targetIdx = wrapperBtns.length - 1;
    if (targetIdx >= wrapperBtns.length) targetIdx = 0;

    const currentActiveBtn = parentWrapper.querySelector('.services-tab-btn.active');
    const currentActiveCard = parentWrapper.querySelector('.service-detail-card.active');
    const currentIdx = currentActiveBtn ? wrapperBtns.indexOf(currentActiveBtn) : 0;

    if (currentIdx === targetIdx && currentActiveCard) return;

    const dir = direction || (targetIdx > currentIdx ? 'next' : 'prev');
    const targetBtn = wrapperBtns[targetIdx];
    const targetId = targetBtn.getAttribute('data-tab');
    const targetCard = document.getElementById(targetId);

    wrapperBtns.forEach(b => b.classList.remove('active'));
    targetBtn.classList.add('active');

    // Scroll active button into view horizontally on mobile
    targetBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });

    if (currentActiveCard && targetCard && currentActiveCard !== targetCard) {
      const inClass = dir === 'next' ? 'slide-in-right' : 'slide-in-left';
      const outClass = dir === 'next' ? 'slide-out-left' : 'slide-out-right';

      wrapperCards.forEach(c => c.classList.remove('slide-in-right', 'slide-in-left', 'slide-out-left', 'slide-out-right'));
      currentActiveCard.classList.add(outClass);
      targetCard.classList.add('active', inClass);

      setTimeout(() => {
        wrapperCards.forEach(c => {
          if (c !== targetCard) {
            c.classList.remove('active', 'slide-out-left', 'slide-out-right');
          } else {
            c.classList.remove('slide-in-right', 'slide-in-left');
          }
        });
      }, 380);
    } else if (targetCard) {
      wrapperCards.forEach(c => c.classList.remove('active'));
      targetCard.classList.add('active');
    }
  }

  serviceTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const parentWrapper = btn.closest('.services-tab-wrapper');
      if (!parentWrapper) return;
      const wrapperBtns = Array.from(parentWrapper.querySelectorAll('.services-tab-btn'));
      const idx = wrapperBtns.indexOf(btn);
      switchServiceTab(parentWrapper, idx);
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
      desc: 'Points-tested visa subclass for skilled professionals without state or employer sponsorship. Allows permanent residence and unrestricted work rights anywhere in Australia.',
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
  // 7b. GOOGLE REVIEWS & TESTIMONIAL SLIDER ENGINE
  // ==========================================================================
  const sliderTrack = document.getElementById('testimonial-slider-track');
  const prevBtn = document.getElementById('prev-testimonial-btn');
  const nextBtn = document.getElementById('next-testimonial-btn');
  const dotsContainer = document.getElementById('testimonial-dots');
  const counterEl = document.getElementById('testimonial-counter');
  
  let slides = Array.from(document.querySelectorAll('.testimonial-slide'));
  let dots = Array.from(document.querySelectorAll('#testimonial-dots .slider-dot'));
  let currentSlide = 0;
  let autoSlideTimer = null;

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatQuote(text) {
    if (!text) return '';
    return text.split('\n\n')
      .map(p => `<p>"${escapeHtml(p.trim().replace(/^["“]|["”]$/g, ''))}"</p>`)
      .join('');
  }

  let isTransitioning = false;

  function updateSlideUI(index, direction = 'next') {
    if (slides.length === 0 || isTransitioning) return;
    
    const prevIndex = currentSlide;
    
    // Boundary check
    let targetIndex = index;
    if (targetIndex >= slides.length) targetIndex = 0;
    else if (targetIndex < 0) targetIndex = slides.length - 1;

    // If initial load or same index
    if (targetIndex === prevIndex && slides[targetIndex] && slides[targetIndex].classList.contains('active')) {
      dots.forEach((dot, idx) => dot.classList.toggle('active', idx === currentSlide));
      if (counterEl) counterEl.textContent = `Review ${currentSlide + 1} of ${slides.length}`;
      return;
    }

    isTransitioning = true;
    currentSlide = targetIndex;

    const currentSlideEl = slides[prevIndex];
    const nextSlideEl = slides[targetIndex];

    const outClass = direction === 'next' ? 'slide-out-left' : 'slide-out-right';
    const inClass = direction === 'next' ? 'slide-in-right' : 'slide-in-left';

    // Clear lingering animation classes
    slides.forEach(s => s.classList.remove('slide-in-right', 'slide-out-left', 'slide-in-left', 'slide-out-right'));

    if (currentSlideEl && currentSlideEl !== nextSlideEl) {
      currentSlideEl.classList.add(outClass);
    }
    
    if (nextSlideEl) {
      nextSlideEl.classList.add('active', inClass);
    }

    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentSlide);
    });

    if (counterEl) {
      counterEl.textContent = `Review ${currentSlide + 1} of ${slides.length}`;
    }

    setTimeout(() => {
      slides.forEach((slide, idx) => {
        if (idx !== currentSlide) {
          slide.classList.remove('active', 'slide-out-left', 'slide-out-right');
        } else {
          slide.classList.remove('slide-in-right', 'slide-in-left');
        }
      });
      isTransitioning = false;
    }, 480);
  }

  function startAutoSlide() {
    stopAutoSlide();
    autoSlideTimer = setInterval(() => {
      updateSlideUI(currentSlide + 1, 'next');
    }, 7000);
  }

  function stopAutoSlide() {
    if (autoSlideTimer) {
      clearInterval(autoSlideTimer);
      autoSlideTimer = null;
    }
  }

  function attachSliderControls() {
    if (prevBtn) {
      prevBtn.onclick = () => {
        updateSlideUI(currentSlide - 1, 'prev');
        startAutoSlide();
      };
    }

    if (nextBtn) {
      nextBtn.onclick = () => {
        updateSlideUI(currentSlide + 1, 'next');
        startAutoSlide();
      };
    }

    dots.forEach(dot => {
      dot.onclick = () => {
        const index = parseInt(dot.getAttribute('data-index'), 10);
        const dir = index >= currentSlide ? 'next' : 'prev';
        updateSlideUI(index, dir);
        startAutoSlide();
      };
    });

    // Touch swipe support on testimonials
    let touchStartX = 0;
    let touchStartY = 0;
    let isSwiping = false;

    if (sliderTrack) {
      sliderTrack.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isSwiping = true;
        stopAutoSlide();
      }, { passive: true });

      sliderTrack.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        const diffX = touchStartX - e.touches[0].clientX;
        const diffY = touchStartY - e.touches[0].clientY;
        if (Math.abs(diffY) > Math.abs(diffX)) {
          isSwiping = false;
        }
      }, { passive: true });

      sliderTrack.addEventListener('touchend', (e) => {
        if (!isSwiping) {
          startAutoSlide();
          return;
        }
        const diffX = touchStartX - e.changedTouches[0].clientX;
        if (diffX > 35) {
          // Swiped left -> Next review
          updateSlideUI(currentSlide + 1, 'next');
        } else if (diffX < -35) {
          // Swiped right -> Prev review
          updateSlideUI(currentSlide - 1, 'prev');
        }
        isSwiping = false;
        startAutoSlide();
      }, { passive: true });

      sliderTrack.addEventListener('mouseenter', stopAutoSlide);
      sliderTrack.addEventListener('mouseleave', startAutoSlide);
    }

    startAutoSlide();
  }

  // Fetch Google Reviews from google-reviews.json
  async function loadGoogleReviews() {
    if (!sliderTrack) return;

    try {
      const response = await fetch('google-reviews.json');
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();

      if (data && Array.isArray(data.reviews) && data.reviews.length > 0) {
        // Build new slides
        sliderTrack.innerHTML = '';
        if (dotsContainer) dotsContainer.innerHTML = '';

        data.reviews.forEach((review, idx) => {
          const slide = document.createElement('div');
          slide.className = `testimonial-slide ${idx === 0 ? 'active' : ''}`;
          slide.setAttribute('data-slide-index', idx);

          const initials = review.initials || (review.author ? review.author.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'PS');
          const avatarColor = review.avatar_color || '#512c82';
          const relativeTime = review.relative_time || 'Recent';
          const badgeText = review.service_type || 'Verified Review';
          const userMeta = review.user_badge || 'Verified Client';

          slide.innerHTML = `
            <div class="testimonial-card-header">
              <div class="review-source-meta">
                <svg class="google-g-icon" viewBox="0 0 24 24" width="16" height="16">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span class="review-source-name">Google Review</span>
                <span class="review-bullet">•</span>
                <span class="review-relative-time">${escapeHtml(relativeTime)}</span>
              </div>
              <span class="review-badge-pill">${escapeHtml(badgeText)}</span>
            </div>
            <div class="rating-stars">${'★'.repeat(review.rating || 5)}</div>
            <div class="testimonial-quote">
              ${formatQuote(review.text)}
            </div>
            <div class="testimonial-author">
              <div class="author-left">
                <div class="author-avatar" style="background-color: ${escapeHtml(avatarColor)};">${escapeHtml(initials)}</div>
                <div class="author-info">
                  <h4 class="author-name">${escapeHtml(review.author)} <svg class="verified-check-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></h4>
                  <span class="author-meta">${escapeHtml(userMeta)}</span>
                </div>
              </div>
            </div>
          `;

          sliderTrack.appendChild(slide);

          if (dotsContainer) {
            const dot = document.createElement('span');
            dot.className = `slider-dot ${idx === 0 ? 'active' : ''}`;
            dot.setAttribute('data-index', idx);
            dot.setAttribute('title', `${review.author} review`);
            dotsContainer.appendChild(dot);
          }
        });

        // Re-query new slides and dots
        slides = Array.from(document.querySelectorAll('.testimonial-slide'));
        dots = Array.from(document.querySelectorAll('#testimonial-dots .slider-dot'));
        currentSlide = 0;
        updateSlideUI(0);
        attachSliderControls();
      } else {
        // Fallback to static slides
        attachSliderControls();
      }
    } catch (err) {
      console.warn('Could not load google-reviews.json, using fallback slides:', err);
      attachSliderControls();
    }
  }

  loadGoogleReviews();


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



  // ==========================================================================
  // 12. COMPREHENSIVE MOBILE SWIPE & CAROUSEL ENGINE
  // ==========================================================================
  function initMobileSwipeEngine() {
    // 1. Generic horizontal scroll-snap track with active dots
    function setupSnapTrack(containerSelector, cardSelector) {
      const container = document.querySelector(containerSelector);
      if (!container) return;

      const cards = Array.from(container.querySelectorAll(cardSelector));
      if (cards.length < 2) return;

      // Avoid duplicating indicator bar
      const existingHint = container.parentElement ? container.parentElement.querySelector(`.mobile-swipe-hint[data-for="${containerSelector.replace(/[^a-zA-Z0-9_-]/g, '')}"]`) : null;
      if (existingHint) return;

      const hintEl = document.createElement('div');
      hintEl.className = 'mobile-swipe-hint';
      hintEl.setAttribute('data-for', containerSelector.replace(/[^a-zA-Z0-9_-]/g, ''));
      hintEl.innerHTML = `
        <div class="swipe-dots-bar">
          ${cards.map((_, i) => `<span class="swipe-dot ${i === 0 ? 'active' : ''}" data-card-idx="${i}" aria-label="Go to slide ${i + 1}"></span>`).join('')}
        </div>
      `;

      container.insertAdjacentElement('afterend', hintEl);

      const dots = Array.from(hintEl.querySelectorAll('.swipe-dot'));
      let activeIdx = 0;

      function scrollToCard(idx) {
        if (!cards[idx]) return;
        const card = cards[idx];
        const targetScroll = card.offsetLeft - (container.clientWidth - card.clientWidth) / 2;
        container.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
        updateDots(idx);
      }

      // Dot click handler
      dots.forEach((dot, idx) => {
        dot.addEventListener('click', () => {
          scrollToCard(idx);
        });
      });

      function updateDots(idx) {
        if (idx === activeIdx) return;
        activeIdx = idx;
        dots.forEach((d, i) => d.classList.toggle('active', i === idx));
      }

      // Scroll listener to update dots based on card closest to horizontal center
      let scrollTimer;
      container.addEventListener('scroll', () => {
        if (scrollTimer) cancelAnimationFrame(scrollTimer);
        scrollTimer = requestAnimationFrame(() => {
          const containerRect = container.getBoundingClientRect();
          const centerX = containerRect.left + containerRect.width / 2;
          let closestIdx = 0;
          let closestDist = Infinity;

          cards.forEach((card, idx) => {
            const cardRect = card.getBoundingClientRect();
            const cardCenter = cardRect.left + cardRect.width / 2;
            const dist = Math.abs(centerX - cardCenter);
            if (dist < closestDist) {
              closestDist = dist;
              closestIdx = idx;
            }
          });

          updateDots(closestIdx);
        });
      }, { passive: true });

      // Touch swipe gestures on the container
      let startX = 0;
      let startY = 0;
      let isSwiping = false;
      let hasSwiped = false;
      let swipeMoveDistance = 0;

      container.addEventListener('touchstart', (e) => {
        if (!e.touches || !e.touches[0]) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isSwiping = true;
        hasSwiped = false;
        swipeMoveDistance = 0;
      }, { passive: true });

      container.addEventListener('touchmove', (e) => {
        if (!isSwiping || !e.touches || !e.touches[0]) return;
        const diffX = startX - e.touches[0].clientX;
        const diffY = startY - e.touches[0].clientY;

        // Natural vertical scrolling should not be hijacked
        if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffX) < 10) {
          isSwiping = false;
          return;
        }

        swipeMoveDistance = Math.abs(diffX);
        if (swipeMoveDistance > 8) {
          hasSwiped = true;
        }
      }, { passive: true });

      container.addEventListener('touchend', (e) => {
        if (!isSwiping) return;
        isSwiping = false;
        if (!e.changedTouches || !e.changedTouches[0]) return;
        const diffX = startX - e.changedTouches[0].clientX;

        if (diffX > 30) {
          // Swipe left -> advance to next card
          const nextIdx = Math.min(cards.length - 1, activeIdx + 1);
          scrollToCard(nextIdx);
        } else if (diffX < -30) {
          // Swipe right -> return to previous card
          const prevIdx = Math.max(0, activeIdx - 1);
          scrollToCard(prevIdx);
        }

        if (hasSwiped) {
          setTimeout(() => {
            hasSwiped = false;
            swipeMoveDistance = 0;
          }, 400);
        }
      }, { passive: true });

      // Prevent link clicks if user was performing a swipe gesture
      container.addEventListener('click', (e) => {
        if (hasSwiped || swipeMoveDistance > 10) {
          e.preventDefault();
          e.stopPropagation();
          hasSwiped = false;
          swipeMoveDistance = 0;
        }
      }, true);

      // Mouse/Pointer drag support for desktop emulation
      let pointerStartX = 0;
      let isPointerDown = false;
      let pointerMoved = false;

      container.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'touch') return;
        pointerStartX = e.clientX;
        isPointerDown = true;
        pointerMoved = false;
      });

      container.addEventListener('pointermove', (e) => {
        if (!isPointerDown) return;
        if (Math.abs(pointerStartX - e.clientX) > 8) {
          pointerMoved = true;
          hasSwiped = true;
        }
      });

      window.addEventListener('pointerup', (e) => {
        if (!isPointerDown) return;
        isPointerDown = false;
        const diffX = pointerStartX - e.clientX;
        if (diffX > 35) {
          const nextIdx = Math.min(cards.length - 1, activeIdx + 1);
          scrollToCard(nextIdx);
        } else if (diffX < -35) {
          const prevIdx = Math.max(0, activeIdx - 1);
          scrollToCard(prevIdx);
        }
        if (pointerMoved) {
          setTimeout(() => {
            hasSwiped = false;
            pointerMoved = false;
          }, 350);
        }
      });
    }

    // Initialize horizontal tracks
    setupSnapTrack('.team-grid', '.team-card');
    setupSnapTrack('.social-feed-grid', '.social-feed-card');
    setupSnapTrack('.comparison-matrix-container', '.comparison-card');
    setupSnapTrack('.tools-grid', '.tool-card');

    // 2. Services Section Mobile Swipe
    const serviceWrappers = document.querySelectorAll('.services-tab-wrapper');
    serviceWrappers.forEach(wrapper => {
      const content = wrapper.querySelector('.services-tab-content');
      if (!content) return;

      let startX = 0;
      let startY = 0;
      let isSwiping = false;

      content.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isSwiping = true;
      }, { passive: true });

      content.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        const diffX = startX - e.touches[0].clientX;
        const diffY = startY - e.touches[0].clientY;
        if (Math.abs(diffY) > Math.abs(diffX)) {
          isSwiping = false;
        }
      }, { passive: true });

      content.addEventListener('touchend', (e) => {
        if (!isSwiping) return;
        const diffX = startX - e.changedTouches[0].clientX;
        isSwiping = false;

        const btns = Array.from(wrapper.querySelectorAll('.services-tab-btn'));
        const activeBtn = wrapper.querySelector('.services-tab-btn.active');
        const currentIdx = activeBtn ? btns.indexOf(activeBtn) : 0;

        if (diffX > 40) {
          // Swiped left -> Next service
          switchServiceTab(wrapper, currentIdx + 1, 'next');
        } else if (diffX < -40) {
          // Swiped right -> Prev service
          switchServiceTab(wrapper, currentIdx - 1, 'prev');
        }
      }, { passive: true });
    });

    // 3. Visa Pathway Visualizer Mobile Swipe
    const pathwayCard = document.getElementById('pathway-result');
    const sitSelect = document.getElementById('situation-select');
    if (pathwayCard && sitSelect) {
      let startX = 0;
      let startY = 0;
      let isSwiping = false;

      pathwayCard.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isSwiping = true;
      }, { passive: true });

      pathwayCard.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        const diffX = startX - e.touches[0].clientX;
        const diffY = startY - e.touches[0].clientY;
        if (Math.abs(diffY) > Math.abs(diffX)) {
          isSwiping = false;
        }
      }, { passive: true });

      pathwayCard.addEventListener('touchend', (e) => {
        if (!isSwiping) return;
        const diffX = startX - e.changedTouches[0].clientX;
        isSwiping = false;

        if (diffX > 40) {
          // Swipe left -> Next option
          sitSelect.selectedIndex = (sitSelect.selectedIndex + 1) % sitSelect.options.length;
          sitSelect.dispatchEvent(new Event('change'));
        } else if (diffX < -40) {
          // Swipe right -> Prev option
          sitSelect.selectedIndex = (sitSelect.selectedIndex - 1 + sitSelect.options.length) % sitSelect.options.length;
          sitSelect.dispatchEvent(new Event('change'));
        }
      }, { passive: true });
    }

    // 4. Strategic Pathway Timeline Mobile Swipe
    const timelineContainer = document.querySelector('.vertical-timeline');
    if (timelineContainer) {
      const nodes = Array.from(timelineContainer.querySelectorAll('.v-timeline-node'));
      let startX = 0;
      let startY = 0;
      let isSwiping = false;

      timelineContainer.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isSwiping = true;
      }, { passive: true });

      timelineContainer.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        const diffX = startX - e.touches[0].clientX;
        const diffY = startY - e.touches[0].clientY;
        if (Math.abs(diffY) > Math.abs(diffX)) {
          isSwiping = false;
        }
      }, { passive: true });

      timelineContainer.addEventListener('touchend', (e) => {
        if (!isSwiping) return;
        const diffX = startX - e.changedTouches[0].clientX;
        isSwiping = false;

        const currentActiveIdx = nodes.reduce((last, node, i) => node.classList.contains('active') ? i : last, 0);

        if (diffX > 40) {
          // Swipe left -> Activate next step
          const nextIdx = Math.min(nodes.length - 1, currentActiveIdx + 1);
          nodes.forEach((n, i) => n.classList.toggle('active', i <= nextIdx));
          nodes[nextIdx].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else if (diffX < -40) {
          // Swipe right -> Deactivate last step
          const prevIdx = Math.max(0, currentActiveIdx - 1);
          nodes.forEach((n, i) => n.classList.toggle('active', i <= prevIdx));
          nodes[prevIdx].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, { passive: true });
    }
  }

  initMobileSwipeEngine();

});
