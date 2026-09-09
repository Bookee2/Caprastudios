/* Progressive enhancement: navigation, portfolio, contact and FAQ work without JS. */
(() => {
  'use strict';
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#mobile-nav');
  if (menuButton && menu) {
    menuButton.hidden = false;
    document.documentElement.classList.add('has-menu');
    const closeMenu = (restoreFocus = false) => {
      menu.hidden = true;
      menuButton.setAttribute('aria-expanded', 'false');
      if (restoreFocus) menuButton.focus();
    };
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(open));
      menu.hidden = !open;
    });
    menu.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) closeMenu(true); });
    document.addEventListener('click', e => { if (!e.target.closest('.site-header')) closeMenu(); });
    window.matchMedia('(min-width: 861px)').addEventListener('change', e => { if (e.matches) closeMenu(); });
  }

  // The observer is established before hiding anything; failed JS never hides content.
  if ('IntersectionObserver' in window && !motion.matches) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.05, rootMargin: '0px 0px 30px 0px' });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    document.documentElement.classList.add('reveal-ready');
    motion.addEventListener('change', e => {
      if (e.matches) {
        document.documentElement.classList.remove('reveal-ready');
        observer.disconnect();
      }
    });
  }

  const stage = document.querySelector('#stage-media');
  const video = document.querySelector('#unicorn-film');
  const poster = document.querySelector('#stage-poster');
  const control = document.querySelector('#replay-study');
  if (stage && video && poster && control) {
    const connection = navigator.connection;
    const label = control.querySelector('[data-film-label]');
    const icon = control.querySelector('[data-film-icon]');
    let attempted = false, visible = false, resumeWhenVisible = false, userPaused = false;
    const automatic = () => !motion.matches && !connection?.saveData;
    const setPoster = (opening = false) => {
      const suffix = opening ? '-opening-poster.jpg' : '-poster.jpg';
      poster.querySelector('source').srcset = `assets/motion/capra-unicorn-mobile${suffix}`;
      poster.querySelector('img').src = `assets/motion/capra-unicorn${suffix}`;
    };
    const updateControl = () => {
      const playing = !video.paused && !video.ended;
      const text = playing ? 'Pause' : video.ended ? 'Replay' : video.currentTime && !video.hidden ? 'Resume' : 'Play';
      label.textContent = text;
      icon.textContent = playing ? 'Ⅱ' : text === 'Replay' ? '↻' : '▷';
      control.setAttribute('aria-label', `${text} unicorn animation`);
    };
    const showStill = () => {
      setPoster();
      poster.hidden = false;
      video.hidden = true;
      updateControl();
    };
    const play = (restart = false) => {
      attempted = true;
      userPaused = false;
      resumeWhenVisible = false;
      if (!video.getAttribute('src')) {
        const phone = matchMedia('(max-width: 600px)').matches;
        video.src = `assets/motion/capra-unicorn-${phone ? 'mobile' : '1080p'}.mp4?v=2`;
        video.poster = `assets/motion/capra-unicorn${phone ? '-mobile' : ''}-opening-poster.jpg`;
      }
      if (restart || video.ended) video.currentTime = 0;
      if (video.currentTime === 0) setPoster(true);
      video.hidden = false;
      video.play().then(() => {
        if (!video.paused) poster.hidden = true;
        updateControl();
      }).catch(error => {
        if (error.name !== 'AbortError') showStill();
      });
    };
    control.hidden = false;
    control.addEventListener('click', () => {
      if (video.paused || video.ended || video.hidden) play(video.hidden || video.ended);
      else {
        userPaused = true;
        resumeWhenVisible = false;
        video.pause();
      }
    });
    for (const event of ['play', 'pause', 'ended']) video.addEventListener(event, updateControl);
    video.addEventListener('ended', () => { resumeWhenVisible = false; showStill(); });
    video.addEventListener('error', showStill);
    const pauseOffscreen = () => {
      if (!userPaused && !video.paused && !video.ended) resumeWhenVisible = true;
      video.pause();
    };
    const resume = () => {
      if (!visible || document.hidden) return;
      if (resumeWhenVisible && !userPaused) play();
      else if (!attempted && automatic()) play();
    };
    if ('IntersectionObserver' in window) {
      if (automatic()) setPoster(true);
      const observer = new IntersectionObserver(entries => {
        const entry = entries[0];
        visible = entry.intersectionRatio >= .85;
        if (!entry.isIntersecting) pauseOffscreen();
        else resume();
      }, { threshold: [0, .85] });
      observer.observe(stage);
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pauseOffscreen(); else resume();
    });
    const respectPreferences = () => {
      if (automatic()) return;
      attempted = true;
      resumeWhenVisible = false;
      video.pause();
      showStill();
    };
    motion.addEventListener('change', respectPreferences);
    connection?.addEventListener?.('change', respectPreferences);
  }
  const year = document.querySelector('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
