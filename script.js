document.addEventListener('DOMContentLoaded', () => {
  
  const overlay = document.getElementById('preloader-overlay');
    const authorImage = document.querySelector('.author-container .img img');
    const body = document.body;
    
    // Add loading class to body
    body.classList.add('image-loading');
    
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

  const percentObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        trackedElements.add(entry.target);
      } else {
        trackedElements.delete(entry.target);
        entry.target.style.setProperty('--threshold-percentage', 0);
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

      el.style.setProperty('--threshold-percentage', percentage);
    });
  }

  function updateScreenWidthFactor() {
    // Calculate normalized screen width factor
    // - Base factor: 1.0 for 1000px width
    // - Scales linearly with screen size
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
        // Also trigger scroll update to recalculate positions
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
