/* Progressive enhancement: navigation, portfolio, contact and FAQ work without JS. */
(() => {
  'use strict';
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
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

  const stage = document.querySelector('#motion-stage');
  const replay = document.querySelector('#replay-study');
  if (stage && replay) {
    let timer;
    const resetPosition = () => { stage.style.removeProperty('--mx'); stage.style.removeProperty('--my'); };
    const play = () => {
      if (motion.matches) return;
      clearTimeout(timer);
      stage.classList.remove('study-playing');
      void stage.offsetWidth;
      stage.classList.add('study-playing');
      replay.disabled = true;
      timer = setTimeout(() => { stage.classList.remove('study-playing'); replay.disabled = false; }, 2600);
    };
    replay.hidden = motion.matches;
    replay.addEventListener('click', play);
    stage.addEventListener('pointermove', event => {
      if (motion.matches || !finePointer.matches) return;
      const rect = stage.getBoundingClientRect();
      stage.style.setProperty('--mx', `${((event.clientX - rect.left) / rect.width - .5) * 24}px`);
      stage.style.setProperty('--my', `${((event.clientY - rect.top) / rect.height - .5) * 18}px`);
    });
    stage.addEventListener('pointerleave', resetPosition);
    motion.addEventListener('change', event => {
      replay.hidden = event.matches;
      if (event.matches) { clearTimeout(timer); stage.classList.remove('study-playing'); replay.disabled = false; resetPosition(); }
    });
    if ('IntersectionObserver' in window) {
      const stageObserver = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) { play(); stageObserver.disconnect(); }
      }, { threshold: .3 });
      stageObserver.observe(stage);
    }
  }
  const year = document.querySelector('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
