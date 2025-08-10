(function () {
  const slidesEl = document.getElementById("slides");
  const paginationEl = document.getElementById("pagination");
  const captionEl = document.getElementById("caption");
  const counterEl = document.getElementById("counter");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");

  const slides = (window.SLIDES || []).filter(s => s && s.src);
  const opts = Object.assign({
    autoplay: true,
    interval: 5000,
    pauseOnHover: true,
    pauseOnInteraction: true,
    fadeDuration: 500
  }, window.PLAYER_OPTIONS || {});

  if (!slides.length) {
    slidesEl.innerHTML = "<p style='color:#888;display:grid;place-items:center;height:100%'>Add slides in window.SLIDES.</p>";
    return;
  }

  // Build DOM slides
  const slideNodes = slides.map((s, idx) => {
    const node = document.createElement("div");
    node.className = "slide" + (idx === 0 ? " active" : "");
    node.setAttribute("role", "img");
    node.setAttribute("aria-label", s.alt || s.caption || ("Slide " + (idx+1)));
    // Lazy: use data-src then load current immediately
    node.dataset.src = s.src;
    slidesEl.appendChild(node);
    return node;
  });

  // Build dots
  slides.forEach((_, i) => {
    const d = document.createElement("div");
    d.className = "dot" + (i === 0 ? " active" : "");
    d.dataset.index = i;
    d.addEventListener("click", () => goTo(i, true, true));
    paginationEl.appendChild(d);
  });

  const state = {
    index: 0,
    count: slides.length,
    width: window.innerWidth,
    isDragging: false,
    startX: 0,
    currentX: 0,
    autoplayTimer: null,
    hovering: false,
    interacted: false
  };

  function setCaption() {
    const s = slides[state.index];
    captionEl.textContent = s.caption || "";
    counterEl.textContent = `${state.index + 1} / ${state.count}`;
  }

  // Image loading and enhanced preloading
  function setSlideBackground(node, src) {
    if (!src || node.dataset.loaded === "1") return;
    const img = new Image();
    img.onload = () => {
      node.style.backgroundImage = `url('${src}')`;
      node.dataset.loaded = "1";
    };
    img.src = src;
  }

  function preloadIndex(i) {
    if (i < 0 || i >= state.count) return;
    setSlideBackground(slideNodes[i], slides[i].src);
  }

  function enhancedPreload() {
    // current, next, next+1, prev
    preloadIndex(state.index);
    preloadIndex((state.index + 1) % state.count);
    preloadIndex((state.index + 2) % state.count);
    preloadIndex((state.index - 1 + state.count) % state.count);
  }

  // Initial caption and preload
  setCaption();
  enhancedPreload();

  function setActive(index) {
    slideNodes.forEach((n, i) => n.classList.toggle("active", i === index));
    [...paginationEl.children].forEach((dot, i) => dot.classList.toggle("active", i === index));
  }

  let transitionLock = false;
  function goTo(i, userInitiated = false, animate = true) {
    if (transitionLock) return;
    const target = (i + state.count) % state.count;
    if (opts.pauseOnInteraction && userInitiated) { state.interacted = true; stopAutoplay(); }
    transitionLock = true;

    // Ensure images are loaded for current/target
    enhancedPreload();

    // Fade handled via CSS .active toggling
    setActive(target);
    state.index = target;
    setCaption();

    setTimeout(() => {
      transitionLock = false;
      enhancedPreload();
    }, opts.fadeDuration);
  }

  function next() { goTo(state.index + 1); }
  function prev() { goTo(state.index - 1); }

  // Autoplay controls
  function startAutoplay() {
    if (!opts.autoplay) return;
    if (state.autoplayTimer) clearInterval(state.autoplayTimer);
    state.autoplayTimer = setInterval(() => {
      if (opts.pauseOnHover && state.hovering) return;
      if (opts.pauseOnInteraction && state.interacted) return;
      next();
    }, Math.max(1500, opts.interval));
  }
  function stopAutoplay() {
    if (state.autoplayTimer) clearInterval(state.autoplayTimer);
    state.autoplayTimer = null;
  }
  startAutoplay();

  // Hover pause (desktop)
  if (opts.pauseOnHover) {
    slidesEl.addEventListener("mouseenter", () => { state.hovering = true; });
    slidesEl.addEventListener("mouseleave", () => { state.hovering = false; });
  }

  // Buttons and keyboard
  nextBtn.addEventListener("click", () => goTo(state.index + 1, true));
  prevBtn.addEventListener("click", () => goTo(state.index - 1, true));
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") goTo(state.index + 1, true);
    if (e.key === "ArrowLeft") goTo(state.index - 1, true);
  });

  // Swipe gestures (left-right)
  function onDown(x) {
    state.isDragging = true;
    state.startX = x;
    state.currentX = x;
  }
  function onMove(x) {
    if (!state.isDragging) return;
    state.currentX = x;
  }
  function onUp() {
    if (!state.isDragging) return;
    state.isDragging = false;
    const delta = state.currentX - state.startX;
    const threshold = Math.min(120, window.innerWidth * 0.18);
    if (delta < -threshold) goTo(state.index + 1, true);
    else if (delta > threshold) goTo(state.index - 1, true);
  }

  // Pointer Events
  slidesEl.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    slidesEl.setPointerCapture(e.pointerId);
    onDown(e.clientX);
  });
  slidesEl.addEventListener("pointermove", (e) => onMove(e.clientX));
  slidesEl.addEventListener("pointerup", onUp);
  slidesEl.addEventListener("pointercancel", onUp);

  // Touch Events (iOS Safari)
  slidesEl.addEventListener("touchstart", (e) => onDown(e.touches[0].clientX), { passive: true });
  slidesEl.addEventListener("touchmove", (e) => onMove(e.touches[0].clientX), { passive: true });
  slidesEl.addEventListener("touchend", onUp);

  // Resize
  window.addEventListener("resize", () => {
    // nothing needed for fade, but kept for completeness
  }, { passive: true });

  // Visibility change (pause autoplay when tab is hidden)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAutoplay();
    else startAutoplay();
  });
})();