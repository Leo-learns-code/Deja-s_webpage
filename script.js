// script.js — behavior for the question UI
document.addEventListener('DOMContentLoaded', () => {
  const yesBtn = document.getElementById('yes-btn');
  const noBtn = document.getElementById('no-btn');
  const buttonsWrap = document.querySelector('.buttons');

  if (!yesBtn || !noBtn || !buttonsWrap) return;

  // Track the current scale of the No button
  let scale = 1;
  // Track scale for Yes button (shrinks on clicks)
  let scaleYes = 1;
  // Track translate offsets (in px) for No button
  let tx = 0, ty = 0;
  // Track translate offsets for Yes button (dodge target)
  let txYes = 0, tyYes = 0;
  let lastDodge = 0;

  // Capture original sizes so we can grow the wrapper proportionally
  const origBtnRect = noBtn.getBoundingClientRect();
  const origWrapRect = buttonsWrap.getBoundingClientRect();
  const origBtnWidth = origBtnRect.width;
  const origBtnHeight = origBtnRect.height;
  const origWrapWidth = origWrapRect.width;
  const origWrapHeight = origWrapRect.height;

  // Update the wrapper size to accommodate the scaled No button
  function updateWrapSize() {
    // Extra space needed based on how much the button has grown
    const extraW = origBtnWidth * (scale - 1);
    const extraH = origBtnHeight * (scale - 1);

    // Add a small padding so the button doesn't sit flush against edges
    const paddingW = 24;
    const paddingH = 12;

    buttonsWrap.style.minWidth = `${Math.max(origWrapWidth + extraW + paddingW, origWrapWidth)}px`;
    buttonsWrap.style.minHeight = `${Math.max(origWrapHeight + extraH + paddingH, origWrapHeight)}px`;
  }

  // Helper to apply transforms
  function applyTransform(){
    noBtn.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    yesBtn.style.transform = `translate(${txYes}px, ${tyYes}px) scale(${scaleYes})`;
  }

  // Increase the No button size when Yes is clicked. Bounded to avoid runaway growth.
  yesBtn.addEventListener('click', () => {
    // Grow No button
    scale = Math.min( (Math.round((scale + 0.25) * 100) / 100), 3 ); // step 0.25, max 3
    // Shrink Yes button slightly on each click, bounded to 0.5
    scaleYes = Math.max(0.5, Math.round((scaleYes - 0.08) * 100) / 100);
    applyTransform();
    updateWrapSize();
    noBtn.style.boxShadow = '0 14px 40px rgba(255,77,109,0.18)';
    // brief highlight to draw attention
    noBtn.animate([
      { boxShadow: '0 8px 24px rgba(255,77,109,0.06)' },
      { boxShadow: '0 18px 48px rgba(255,77,109,0.18)' }
    ], { duration: 300, easing: 'ease-out' });
  });

  // Clicking No reduces its size slightly (playful)
  noBtn.addEventListener('click', () => {
    scale = Math.max(1, Math.round((scale - 0.2) * 100) / 100);
    // shrink but keep any current translate
    applyTransform();
    updateWrapSize();
    // Show celebration GIF + text when user clicks "No"
    showCelebrateOnce();
  });

  // Clamp helper
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

  // Dodge behavior when the cursor moves near the Yes button
  function tryDodgeYes(e){
    // Throttle dodges to avoid runaway movement
    const now = Date.now();
    if (now - lastDodge < 350) return;
    lastDodge = now;

    const wrapRect = buttonsWrap.getBoundingClientRect();
    const btnRect = yesBtn.getBoundingClientRect();

    // Pointer relative to button center
    const btnCenterX = btnRect.left + btnRect.width / 2;
    const btnCenterY = btnRect.top + btnRect.height / 2;
    const dx = e.clientX - btnCenterX;
    const dy = e.clientY - btnCenterY;

    // Determine dodge direction away from cursor
    const dirX = dx >= 0 ? 1 : -1; // move in opposite direction (flip)
    const dirY = dy >= 0 ? 1 : -1;

    // Randomize distance a bit
    const dodgeX = dirX * (60 + Math.random() * 120);
    const dodgeY = dirY * (Math.random() * 40 - 20);

    // Compute allowed translate bounds so the button stays inside the wrapper
    const txMin = wrapRect.left - btnRect.left;
    const txMax = wrapRect.right - btnRect.right;
    const tyMin = wrapRect.top - btnRect.top - 10;
    const tyMax = wrapRect.bottom - btnRect.bottom + 10;

    // Update txYes/tyYes and clamp
    txYes = clamp(txYes + dodgeX, txMin, txMax);
    tyYes = clamp(tyYes + dodgeY, tyMin, tyMax);

    applyTransform();
  }

  // Attach pointermove to the wrapper to catch approaching cursor
  if (buttonsWrap) {
    // For mouse users, use mousemove on the wrapper and dodge when pointer is near
    buttonsWrap.addEventListener('mousemove', (e) => {
      // Only trigger when pointer is within ~120px of the YES button center
      const btnRect = yesBtn.getBoundingClientRect();
      const bx = btnRect.left + btnRect.width / 2;
      const by = btnRect.top + btnRect.height / 2;
      const dist = Math.hypot(e.clientX - bx, e.clientY - by);
      if (dist < 120) tryDodgeYes(e);
    });

    // On touch devices, dodge on touchstart
    buttonsWrap.addEventListener('touchstart', (e) => {
      if (!e.touches || e.touches.length === 0) return;
      tryDodgeYes(e.touches[0]);
    }, {passive: true});
  }

  // initialize wrapper size
  updateWrapSize();

  // --- Celebration overlay logic ---
  let _celebrating = false;
  function showCelebrateOnce(){
    if (_celebrating) return;
    _celebrating = true;

    const overlay = document.createElement('div');
    overlay.id = 'celebrate';
    overlay.className = 'celebrate';

    const card = document.createElement('div');
    card.className = 'celebrate-card';

    const img = document.createElement('img');
    img.className = 'cute-gif';
    const caption = document.createElement('div');
    caption.className = 'celebrate-text';
    caption.textContent = 'YAY!!!';

    const close = document.createElement('button');
    close.className = 'celebrate-close';
    close.textContent = 'Close';

    card.appendChild(img);
    card.appendChild(caption);
    card.appendChild(close);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // try project-local gif first, fallback to hosted GIF if missing
    const localSrc = 'cute.gif';
    const fallback = 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif';
    const tester = new Image();
    tester.onload = () => { img.src = localSrc; };
    tester.onerror = () => { img.src = fallback; };
    // kick off test
    tester.src = localSrc;

    function done(){
      overlay.remove();
      _celebrating = false;
    }

    close.addEventListener('click', done);
    // auto-dismiss after 4 seconds
    setTimeout(done, 4000);
  }
});
