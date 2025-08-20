(function(){
  // --- Provider Filter (ALL/YOUTUBE) ---
  const chips = Array.from(document.querySelectorAll('.chip'));
  const grid = document.getElementById('grid');
  const cards = Array.from(document.querySelectorAll('.card'));
  function applyFilter(provider){
    cards.forEach(c => {
      const p = (c.dataset.provider || '').toUpperCase();
      const show = (provider === 'ALL') || (p === provider);
      c.style.display = show ? '' : 'none';
    });
    updateVisibleOrder();
  }
  chips.forEach(ch => {
    ch.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      ch.classList.add('active');
      applyFilter(ch.dataset.filter);
    });
  });
  applyFilter('ALL');

  // --- Lightbox & Navigation + Swipe ---
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modalBody');
  const titleEl = document.getElementById('modalTitle');
  const vidEl = document.getElementById('lightVideo');
  const closeBtn = document.getElementById('modalClose');
  const prevBtn = document.getElementById('modalPrev');
  const nextBtn = document.getElementById('modalNext');

  let visibleCards = [];
  let currentIndex = -1;
  function updateVisibleOrder(){
    visibleCards = cards.filter(c => c.style.display !== 'none');
  }

  function lockScroll(lock){
    document.documentElement.style.overflow = lock ? 'hidden' : '';
    document.body.style.overflow = lock ? 'hidden' : '';
  }

  function openVideo(card){
    const title = card.dataset.title || 'Preview';
    titleEl.textContent = title;
    const embed = (card.dataset.embed || '').trim();

    // Normalize common YouTube forms to embed
    let url = embed;
    if (/youtube\.com\/watch\?v=/.test(url)) {
      const id = new URL(url).searchParams.get('v');
      url = `https://www.youtube.com/embed/${id}`;
    } else if (/youtu\.be\//.test(url)) {
      const id = url.split('youtu.be/')[1].split(/[?&#]/)[0];
      url = `https://www.youtube.com/embed/${id}`;
    }

    // Autoplay & sane params
    const sep = url.includes('?') ? '&' : '?';
    url = `${url}${sep}autoplay=1&rel=0&modestbranding=1&playsinline=1`;

    vidEl.src = url;
    modal.classList.add('open');
    lockScroll(true);
  }

  function openCardAt(index){
    if(index < 0 || index >= visibleCards.length) return;
    currentIndex = index;
    openVideo(visibleCards[currentIndex]);
  }
  function closeModal(){
    vidEl.src = '';
    modal.classList.remove('open');
    lockScroll(false);
    currentIndex = -1;
  }
  function next(){
    if(visibleCards.length === 0) return;
    openCardAt((currentIndex + 1) % visibleCards.length);
  }
  function prev(){
    if(visibleCards.length === 0) return;
    openCardAt((currentIndex - 1 + visibleCards.length) % visibleCards.length);
  }

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e)=>{ if(e.target === modal) closeModal(); });
  window.addEventListener('keydown', (e)=>{
    if(!modal.classList.contains('open')) return;
    if(e.key === 'Escape') closeModal();
    if(e.key === 'ArrowRight') next();
    if(e.key === 'ArrowLeft') prev();
  });
  nextBtn.addEventListener('click', next);
  prevBtn.addEventListener('click', prev);

  // --- Event delegation: click ANYWHERE on the card (img, title, text) ---
  grid.addEventListener('click', (e)=>{
    const card = e.target.closest('.card');
    if(!card) return;
    updateVisibleOrder();
    const idx = visibleCards.indexOf(card);
    openCardAt(idx >= 0 ? idx : 0);
  });
  // Keyboard accessibility
  cards.forEach(card => {
    card.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        updateVisibleOrder();
        const idx = visibleCards.indexOf(card);
        openCardAt(idx >= 0 ? idx : 0);
      }
    });
  });

  // --- Swipe Gesture on Modal ---
  let startX = 0, startY = 0, swiping = false, consumed = false;
  const THRESHOLD = Math.max(48, window.innerWidth * 0.08);

  function onPointerDown(e){
    if(!(e.pointerType === 'touch' || e.pointerType === 'pen')) return;
    swiping = true; consumed = false;
    startX = e.clientX; startY = e.clientY;
    modalBody.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e){
    if(!swiping) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if(consumed) return;
    if(Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > THRESHOLD){
      consumed = true;
      if(dx < 0) next(); else prev();
    }
  }
  function onPointerUp(){
    swiping = false; consumed = false;
  }
  modalBody.addEventListener('pointerdown', onPointerDown, {passive:true});
  modalBody.addEventListener('pointermove', onPointerMove, {passive:true});
  modalBody.addEventListener('pointerup', onPointerUp, {passive:true});
  modalBody.addEventListener('pointercancel', onPointerUp, {passive:true});
})();