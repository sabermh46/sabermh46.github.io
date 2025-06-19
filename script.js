document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('preloader-overlay');
  const authorImage = document.querySelector('.author-container .img img');
  const body = document.body;
  
  // Add loading class to body
  body.classList.add('image-loading');

  document.querySelectorAll('.marquee__inner').forEach(inner => {
    // Duplicate
    inner.innerHTML += inner.innerHTML;
    // Measure half (original) width
    const full = inner.scrollWidth;
    const half = full / 2;
    // Store in CSS var
    inner.style.setProperty('--scroll-width', `${half}px`);
  });
  
  function handleImageLoad() {
    // Add loaded class to body
    body.classList.remove('image-loading');
    body.classList.add('image-loaded');
    
    // Fade out overlay
    overlay.classList.add('loaded');
    
    // Remove overlay after transition
    setTimeout(() => {
      overlay.remove();
    }, 500);
  }
  
  // Check if image is already loaded
  if (authorImage.complete && authorImage.naturalHeight !== 0) {
    handleImageLoad();
  } else {
    authorImage.addEventListener('load', handleImageLoad);
    authorImage.addEventListener('error', handleImageLoad);
  }

  // --------------------------
  // Helper: Thresholds array
  // --------------------------
  function buildThresholds(step = 0.01) {
    const thresholds = [];
    for (let i = 0; i <= 1.0; i += step) {
      thresholds.push(Number(i.toFixed(2)));
    }
    return thresholds;
  }

  // --------------------------
  // 1) Intersection Observer: inview
  // --------------------------
  const intObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const threshold = entry.target.dataset.obsThreshold;
      entry.target.classList.toggle('inview', entry.intersectionRatio >= threshold);
    });
  }, {
    rootMargin: '0px',
    threshold: buildThresholds()
  });

  document.querySelectorAll('.int-obs').forEach(el => {
    let threshold = 0.5;
    el.classList.forEach(cls => {
      if (cls.startsWith('ob-')) {
        const num = parseInt(cls.slice(3), 10);
        if (!isNaN(num) && num >= 1 && num <= 100) {
          threshold = num / 100;
        }
      }
    });
    el.dataset.obsThreshold = threshold;
    intObs.observe(el);
  });

  // --------------------------
  // 2) Scroll percentage: Observer + scroll for smooth update
  // --------------------------
  const trackedElements = new Set();
  const elementStates = new WeakMap();

  const percentObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        trackedElements.add(entry.target);
        // Initialize state if not already set
        if (!elementStates.has(entry.target)) {
          elementStates.set(entry.target, { hasReached100: false });
        }
      } else {
        // Only remove if element is below viewport (not above)
        if (entry.boundingClientRect.top > window.innerHeight) {
          trackedElements.delete(entry.target);
          const state = elementStates.get(entry.target);
          // Only reset if it hasn't reached 100% yet
          if (state && !state.hasReached100) {
            entry.target.style.setProperty('--threshold-percentage', 0);
          }
        }
      }
    });
  }, {
    rootMargin: '0px',
    threshold: 0
  });

  document.querySelectorAll('.scroll-percent').forEach(el => {
    percentObs.observe(el);
  });

  // --------------------------
  // Scroll loop: runs every scroll frame
  // --------------------------
  function updateScrollPercentages() {
    const vh = window.innerHeight;
    trackedElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const elementHeight = rect.height;
      const totalRange = vh + elementHeight;
      const distance = vh - rect.top;

      let percentage = (distance / totalRange) * 100;
      percentage = Math.max(0, Math.min(100, percentage));
      percentage = Math.round(percentage * 100) / 100; 

      // Get or create state for this element
      let state = elementStates.get(el);
      if (!state) {
        state = { hasReached100: false };
        elementStates.set(el, state);
      }
      
      // If we've reached 100%, mark it and don't go below
      if (percentage >= 99.9) {
        state.hasReached100 = true;
        percentage = 100;
      }
      

      el.style.setProperty('--threshold-percentage', percentage);
    });
  }

  function updateScreenWidthFactor() {
    const factor = window.innerWidth / 1000;
    document.documentElement.style.setProperty('--screen-width', factor);
  }

  // Initialize screen width factor
  updateScreenWidthFactor();

  // Update screen width factor on resize
  let resizeTimeout;
  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateScreenWidthFactor();
      onScroll();
    }, 100);
  }

  // Smooth update with requestAnimationFrame
  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateScrollPercentages();
        ticking = false;
      });
      ticking = true;
    }
  }


        (() => {
            const widthsc = document.documentElement.clientWidth;
            
            const grid   = document.querySelector('.tech-grid');
            const cards  = Array.from(grid.querySelectorAll('.icon-card'));
            const R_mult = 2; // base factor per percent
            const MIN_R  = 30; // minimum radius in px
            const MAX_R  = widthsc <= 768 ? 110 : 180; // maximum radius in px

            const circle = [
              { x:  1,      y:   0    },
              { x:  0.5,    y:   0.866},
              { x: -0.5,    y:   0.866},
              { x: -1,      y:   0    },
              { x: -0.5,    y:  -0.866},
              { x:  0.5,    y:  -0.866}
            ];

            function frame() {
              // measure
              const rect = grid.getBoundingClientRect();
              const vh   = window.innerHeight;

              // map scroll position to 0…1
              let pct = (vh - rect.top) / vh;
              pct = Math.min(1, Math.max(0, pct));

              // compute pixel radius with clamp
              let radius = R_mult * (pct * 100);
              radius = Math.max(MIN_R, Math.min(MAX_R, radius));

              // apply transform for each icon
              cards.forEach(card => {
                const i = +card.dataset.index - 1;
                const { x, y } = circle[i];
                const tx = x * radius;
                const ty = y * radius;
                card.style.transform = `translate(-50%, -50%) translate3d(${tx}px, ${ty}px, 0)`;
              });

              requestAnimationFrame(frame);
            }

            requestAnimationFrame(frame);
          })();


  window.addEventListener('scroll', onScroll);
  window.addEventListener('resize', handleResize);

  // --------------------------
  // Cleanup
  // --------------------------
  window.addEventListener('beforeunload', () => {
    intObs.disconnect();
    percentObs.disconnect();
    window.removeEventListener('resize', handleResize);
    clearTimeout(resizeTimeout);
  });
});









