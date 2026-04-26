(function main(){
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d', { alpha: true, willReadFrequently: false });

  function resize(){canvas.width=innerWidth;canvas.height=innerHeight}
  addEventListener('resize',resize);resize();

  const confetti = [];
  const colors = ['#ff6b6b','#ffd166','#06d6a0','#4d96ff','#c084fc'];
  
  // Detect low-end devices (small RAM, slow device)
  const isLowEnd = (navigator.deviceMemory && navigator.deviceMemory <= 4) || innerWidth <= 380;
  
  // gentle neon particle background (mobile-optimized)
  const particles = [];
  function spawnParticles(amount = 18){
    const count = Math.max(isLowEnd ? 3 : 6, Math.floor(amount * (isLowEnd ? 0.3 : 1)));
    for(let i=0;i<count;i++){
      particles.push({
        x: Math.random()*canvas.width,
        y: Math.random()*canvas.height,
        r: 6 + Math.random()*28,
        vx: (Math.random()-0.5)*0.18,
        vy: -0.15 - Math.random()*0.35,
        alpha: 0.06 + Math.random()*0.18,
        hue: (Math.random()>.5) ? 'cyan' : 'magenta'
      });
    }
  }

  function spawnConfetti(amount=80){
    for(let i=0;i<amount;i++){
      confetti.push({
        x:Math.random()*canvas.width,
        y:-20-Math.random()*canvas.height*0.2,
        vx:(Math.random()-0.5)*4,
        vy:2+Math.random()*6,
        size:6+Math.random()*10,
        angle:Math.random()*360,
        color:colors[Math.floor(Math.random()*colors.length)],
      });
    }
  }

  let running=true;
  let lastFrameTime = performance.now();
  const targetFPS = isLowEnd ? 30 : 60;
  const frameInterval = 1000 / targetFPS;
  
  function tick(){
    const now = performance.now();
    const deltaTime = now - lastFrameTime;
    
    // Skip frame if not enough time has passed (throttling for low-end devices)
    if (deltaTime < frameInterval - 2) {
      if(running) requestAnimationFrame(tick);
      return;
    }
    lastFrameTime = now - (deltaTime % frameInterval);
    
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // draw soft neon particles behind confetti
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for(let i=particles.length-1;i>=0;i--){
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      // recycle
      if(p.y < -80 || p.x < -80 || p.x > canvas.width + 80){
        p.x = Math.random()*canvas.width;
        p.y = canvas.height + 20 + Math.random()*120;
        p.vx = (Math.random()-0.5)*0.18; p.vy = -0.15 - Math.random()*0.35;
      }
      const grad = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);
      if(p.hue === 'cyan'){
        grad.addColorStop(0, 'rgba(0,245,255,' + (p.alpha*0.95) + ')');
        grad.addColorStop(0.5, 'rgba(124,58,237,' + (p.alpha*0.28) + ')');
        grad.addColorStop(1, 'rgba(0,245,255,0)');
      } else {
        grad.addColorStop(0, 'rgba(255,45,166,' + (p.alpha*0.95) + ')');
        grad.addColorStop(0.5, 'rgba(124,58,237,' + (p.alpha*0.28) + ')');
        grad.addColorStop(1, 'rgba(255,45,166,0)');
      }
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
    for(let i=confetti.length-1;i>=0;i--){
      const p=confetti[i];
      p.x+=p.vx; p.y+=p.vy; p.vy+=0.04; p.angle+=p.vx*2;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.angle*Math.PI/180);
      ctx.fillStyle=p.color; ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*0.6);
      ctx.restore();
      if(p.y>canvas.height+50) confetti.splice(i,1);
    }
    if(running) requestAnimationFrame(tick);
  }
  
  // Pause animation when page is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      running = false;
    } else {
      running = true;
      lastFrameTime = performance.now();
      tick();
    }
  });
  
  tick();

  // initialize particles (fewer on small screens)
  const initialParticles = (innerWidth <= 520) ? (isLowEnd ? 5 : 10) : (isLowEnd ? 12 : 22);
  spawnParticles(initialParticles);

  function startCelebration(){
    spawnConfetti(140);
    playMelody();
  }

  function playMelody(){
    try{
      const ctx = new (window.AudioContext||window.webkitAudioContext)();
      const notes=[523,659,784,1046];
      let t=0;
      notes.forEach((n,i)=>{
        const o=ctx.createOscillator();
        const g=ctx.createGain();
        o.type='sine';o.frequency.value=n;
        g.gain.value=0.0001;
        o.connect(g);g.connect(ctx.destination);
        const now=ctx.currentTime + t;
        g.gain.linearRampToValueAtTime(0.12, now+0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now+0.38);
        o.start(now); o.stop(now+0.4);
        t+=0.15;
      });
    }catch(e){}
  }

  // removed unused keydown handler
  window.startCelebration = startCelebration;
  window.spawnSmallConfetti = (n=36) => spawnConfetti(n);
  const avatarImg = document.getElementById('avatar-img');
  avatarImg?.addEventListener('click', ()=>{
    // mobile-friendly confetti amount - reduced on low-end devices
    const baseCount = (innerWidth <= 520) ? 28 : 48;
    const smallCount = isLowEnd ? Math.floor(baseCount * 0.4) : baseCount;
    window.spawnSmallConfetti(smallCount);
    try{
      const actx = new (window.AudioContext||window.webkitAudioContext)();
      const o = actx.createOscillator();
      const g = actx.createGain();
      o.type = 'triangle'; o.frequency.value = 880;
      g.gain.value = 0.0001; o.connect(g); g.connect(actx.destination);
      const now = actx.currentTime;
      g.gain.linearRampToValueAtTime(0.1, now+0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now+0.25);
      o.start(now); o.stop(now+0.25);
    }catch(e){}
  });

  // Background audio: prefer user's uploaded MP3 (id="bg-audio"); otherwise fall back to synth.
  const bgAudio = document.getElementById('bg-audio');
  let bgPlaying = false;
  let bgAutoplayBlocked = false;
  const hintToast = document.getElementById('autoplay-hint');

  if (bgAudio) {
    // Start muted and at zero volume to maximize autoplay success, then attempt a gentle fade-in.
    try { bgAudio.loop = true; bgAudio.volume = 0; bgAudio.muted = true; } catch (e) {}

    function fadeInAudio(duration = 4000) {
      const steps = 40; let step = 0; const stepTime = Math.max(20, duration / steps);
      const iv = setInterval(() => {
        step++;
        const v = Math.min(1, step / steps);
        try { bgAudio.volume = v; } catch (e) {}
        if (step >= steps) { clearInterval(iv); try { bgAudio.muted = false; } catch (e) {} }
      }, stepTime);
    }

    const tryPlay = async () => {
      try {
        await bgAudio.play();
        bgPlaying = true;
        // if playing while muted, fade in
        if (bgAudio.muted || bgAudio.volume === 0) fadeInAudio(3500);
        console.log('[bg] autoplay succeeded');
      } catch (err) {
        console.warn('[bg] autoplay blocked', err);
        // Autoplay blocked — show hint toast and wait for gesture
        bgAutoplayBlocked = true;
        if (hintToast) { hintToast.setAttribute('aria-hidden', 'false'); hintToast.classList.add('show'); setTimeout(()=>{ hintToast.classList.remove('show'); hintToast.setAttribute('aria-hidden','true'); }, 6000); }
      }
    };

    // Attempt autoplay when script runs (defer ensures DOM is ready)
    tryPlay();

    // Avatar click serves as a natural user gesture: start/unmute and play with fade-in
    const avatarImgEl = document.getElementById('avatar-img');
    if (avatarImgEl) {
      avatarImgEl.addEventListener('click', async () => {
        // existing confetti + short tone is triggered elsewhere; keep that behavior
        if (bgAutoplayBlocked && !bgPlaying) {
          try {
            bgAudio.muted = false;
            bgAudio.volume = 0;
            await bgAudio.play();
            bgPlaying = true; bgAutoplayBlocked = false;
            fadeInAudio(3000);
            if (hintToast) { hintToast.setAttribute('aria-hidden','true'); hintToast.classList.remove('show'); }
          } catch (e) { /* still blocked */ }
        }
      });
    }

    // Dismiss hint when clicked
    hintToast?.addEventListener('click', ()=>{ hintToast.classList.remove('show'); hintToast.setAttribute('aria-hidden','true'); });
    

    // Keep internal state if audio ends
    bgAudio.addEventListener('ended', () => { bgPlaying = false; });

  } else {
    // Fallback to synth-based player if no MP3 present
    const noteFreq = {
      'C4':261.63,'D4':293.66,'E4':329.63,'F4':349.23,'G4':392.00,'A4':440.00,'B4':493.88,
      'C5':523.25,'D5':587.33,'E5':659.25,'F5':698.46,'G5':783.99,'A5':880.00
    };
    const melody = [
      ['G4',0.45],['G4',0.35],['A4',0.8],['G4',0.8],['C5',0.9],['B4',1.0],
      ['G4',0.45],['G4',0.35],['A4',0.8],['G4',0.8],['D5',0.9],['C5',1.0],
      ['G4',0.45],['G4',0.35],['G5',0.8],['E5',0.8],['C5',0.9],['B4',0.9],['A4',1.0],
      ['F5',0.45],['F5',0.35],['E5',0.8],['C5',0.8],['D5',0.9],['C5',1.4]
    ];

    let bgCtx = null;
    let bgInterval = null;

    function playNoteAt(time, note, dur, velocity=0.04){
      const o = bgCtx.createOscillator();
      const g = bgCtx.createGain();
      o.type = 'sine';
      o.frequency.value = noteFreq[note] || 440;
      g.gain.value = 0.0001;
      o.connect(g); g.connect(bgCtx.destination);
      g.gain.setValueAtTime(0.0001, time);
      g.gain.linearRampToValueAtTime(velocity, time + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, time + dur - 0.02);
      o.start(time); o.stop(time + dur);
    }

    function playMelodyLoop(){
      if(!bgCtx) return 0;
      const now = bgCtx.currentTime + 0.05;
      let t = now;
      for(const [n,d] of melody){
        playNoteAt(t, n, d, 0.06);
        t += d;
      }
      return t - now;
    }

    function startBg(){
      if(bgPlaying) return;
      try{
        bgCtx = bgCtx || new (window.AudioContext || window.webkitAudioContext)();
        const loop = playMelodyLoop();
        bgInterval = setInterval(()=>{ playMelodyLoop(); }, Math.max(1200, Math.floor(loop*1000)) );
        bgPlaying = true;
        
      }catch(e){/* audio not allowed */}
    }

    function stopBg(){
      bgPlaying = false;
      if(bgInterval) { clearInterval(bgInterval); bgInterval = null; }
      
      try{ if(bgCtx && typeof bgCtx.suspend === 'function') bgCtx.suspend(); }catch(e){}
    }

  }
  // Mobile-first micro-interactions: shimmer the name on load and add quick card pulse on tap
  document.addEventListener('DOMContentLoaded', ()=>{
    const nameEl = document.querySelector('.name');
    const cardEl = document.querySelector('.card');
    if(nameEl){
      // add shimmer class briefly for motion-friendly devices (skip on low-end)
      if(!isLowEnd && window.matchMedia('(prefers-reduced-motion: reduce)').matches === false){
        nameEl.classList.add('shimmer');
        nameEl.addEventListener('animationend', ()=> nameEl.classList.remove('shimmer'), {once:true});
      }
    }

    if(cardEl){
      // tap anywhere on the card to create a subtle pulse (disabled on low-end devices)
      cardEl.addEventListener('click', ()=>{
        if(isLowEnd || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        cardEl.classList.remove('tap-pulse');
        // force reflow to restart animation
        // eslint-disable-next-line no-unused-expressions
        cardEl.offsetWidth;
        cardEl.classList.add('tap-pulse');
        setTimeout(()=>cardEl.classList.remove('tap-pulse'), 600);
      });
    }
  });
})();
