/* =============================================
   VESCOPLAST — comportamento responsivo
   ============================================= */

(() => {
  'use strict';

  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hoverCapable = window.matchMedia('(hover: hover) and (pointer: fine)');

  root.classList.add('js');

  const state = {
    carouselTimer: null,
    currentSlide: 0,
    resizeFrame: null,
    touchStartX: 0,
    touchStartY: 0,
  };

  const qs = (selector, context = document) => context.querySelector(selector);
  const qsa = (selector, context = document) => [...context.querySelectorAll(selector)];

  /**
   * Função central de responsividade.
   * Atualiza a altura útil real do navegador, identifica o tipo de tela
   * e fecha elementos mobile quando o viewport muda para desktop.
   */
  function applyResponsiveLayout() {
    const visualViewport = window.visualViewport;
    const width = Math.round(visualViewport?.width || window.innerWidth);
    const height = Math.round(visualViewport?.height || window.innerHeight);
    const viewport = width < 640 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';

    // Densidade automática: diminui apenas o necessário em telas estreitas/baixas.
    let density = 'comfortable';
    if (width < 768 && (width <= 360 || height <= 620)) {
      density = 'ultra-compact';
    } else if (width < 768 && (width <= 480 || height <= 760)) {
      density = 'compact';
    }

    root.style.setProperty('--app-height', `${height}px`);
    root.style.setProperty('--viewport-width', `${width}px`);
    root.style.setProperty('--viewport-height', `${height}px`);
    root.dataset.viewport = viewport;
    root.dataset.density = density;
    root.classList.toggle('is-mobile', viewport === 'mobile');
    root.classList.toggle('is-tablet', viewport === 'tablet');
    root.classList.toggle('is-desktop', viewport === 'desktop');
    root.classList.toggle('is-compact-ui', density !== 'comfortable');
    root.classList.toggle('is-ultra-compact-ui', density === 'ultra-compact');

    if (width >= 768) {
      setMobileMenu(false);
    }

    requestAnimationFrame(syncHeroSize);
  }

  function scheduleResponsiveLayout() {
    if (state.resizeFrame) cancelAnimationFrame(state.resizeFrame);
    state.resizeFrame = requestAnimationFrame(applyResponsiveLayout);
  }

  /* Ano do rodapé */
  const currentYear = qs('#currentYear');
  if (currentYear) currentYear.textContent = String(new Date().getFullYear());

  /* Menu mobile */
  const menuButton = qs('#mobile-menu-button');
  const mobileMenu = qs('#mobile-menu');

  function setMobileMenu(open) {
    if (!menuButton || !mobileMenu) return;

    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
    mobileMenu.hidden = !open;

    const icon = qs('i', menuButton);
    if (icon) {
      icon.classList.toggle('fa-bars', !open);
      icon.classList.toggle('fa-xmark', open);
    }
  }

  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', () => {
      setMobileMenu(menuButton.getAttribute('aria-expanded') !== 'true');
    });

    qsa('a', mobileMenu).forEach(link => {
      link.addEventListener('click', () => setMobileMenu(false));
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') setMobileMenu(false);
    });
  }

  /* Carousel */
  const hero = qs('#hero');
  const slides = qsa('.hero-slide');
  const dots = qsa('.hero-dot');
  const progress = qs('#hero-progress');
  const carouselInterval = 4500;


  /**
   * Calcula a altura exata da área visual usando a proporção natural
   * da imagem ativa. Dessa forma nenhum banner é cortado ou distorcido.
   */
  function syncHeroSize() {
    if (!hero || !slides.length) return;

    const activeSlide = slides[state.currentSlide] || slides[0];
    const image = qs('.hero-slide-bg', activeSlide);
    if (!image) return;

    const applySize = () => {
      const heroWidth = Math.max(280, Math.round(hero.getBoundingClientRect().width));
      const naturalWidth = Number(image.naturalWidth) || 16;
      const naturalHeight = Number(image.naturalHeight) || 9;
      const ratio = naturalWidth / naturalHeight;
      const mediaHeight = Math.max(220, Math.round(heroWidth / ratio));
      const infoHeight = parseFloat(
        getComputedStyle(root).getPropertyValue('--hero-info-height')
      ) || 94;

      root.style.setProperty('--hero-media-height', `${mediaHeight}px`);
      hero.style.height = `${mediaHeight + infoHeight}px`;
      hero.style.minHeight = `${mediaHeight + infoHeight}px`;
    };

    if (image.complete && image.naturalWidth > 0) {
      applySize();
    } else {
      image.addEventListener('load', applySize, { once: true });
    }
  }

  function restartProgress() {
    if (!progress) return;

    progress.style.animation = 'none';
    // Força reflow para reiniciar a animação.
    void progress.offsetWidth;
    progress.style.animation = reducedMotion.matches
      ? 'none'
      : `progressBar ${carouselInterval}ms linear infinite`;
  }

  function goToSlide(index) {
    if (!slides.length) return;

    const normalized = (Number(index) + slides.length) % slides.length;
    state.currentSlide = normalized;

    slides.forEach((slide, position) => {
      const active = position === normalized;
      slide.classList.toggle('active', active);
      slide.setAttribute('aria-hidden', String(!active));
    });

    dots.forEach((dot, position) => {
      const active = position === normalized;
      dot.classList.toggle('active', active);
      dot.setAttribute('aria-current', String(active));
    });

    requestAnimationFrame(syncHeroSize);
    restartProgress();
  }

  function stopCarousel() {
    if (state.carouselTimer) {
      window.clearInterval(state.carouselTimer);
      state.carouselTimer = null;
    }
  }

  function startCarousel() {
    stopCarousel();
    if (slides.length <= 1 || reducedMotion.matches || document.hidden) return;

    state.carouselTimer = window.setInterval(() => {
      goToSlide(state.currentSlide + 1);
    }, carouselInterval);
  }

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      goToSlide(Number(dot.dataset.slideIndex ?? index));
      startCarousel();
    });
  });

  if (hero) {
    if (hoverCapable.matches) {
      hero.addEventListener('mouseenter', stopCarousel);
      hero.addEventListener('mouseleave', startCarousel);
    }

    hero.addEventListener('touchstart', event => {
      const touch = event.changedTouches[0];
      state.touchStartX = touch.clientX;
      state.touchStartY = touch.clientY;
      stopCarousel();
    }, { passive: true });

    hero.addEventListener('touchend', event => {
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - state.touchStartX;
      const deltaY = touch.clientY - state.touchStartY;

      if (Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY)) {
        goToSlide(state.currentSlide + (deltaX < 0 ? 1 : -1));
      }
      startCarousel();
    }, { passive: true });
  }


  slides.forEach(slide => {
    const image = qs('.hero-slide-bg', slide);
    image?.addEventListener('load', () => {
      if (slide.classList.contains('active')) syncHeroSize();
    });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopCarousel();
    else startCarousel();
  });

  reducedMotion.addEventListener?.('change', () => {
    restartProgress();
    startCarousel();
  });

  /* Abas de produtos */
  function switchTab(tabName, options = {}) {
    const button = document.getElementById(`tab-${tabName}`);
    const content = document.getElementById(`content-${tabName}`);
    if (!button || !content) return;

    qsa('.tab-btn').forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
    });

    qsa('.tab-content').forEach(panel => {
      const active = panel === content;
      panel.classList.toggle('active', active);
      panel.hidden = !active;
    });

    button.scrollIntoView({
      behavior: reducedMotion.matches ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'center',
    });

    if (options.scrollToProducts) {
      const section = qs('#produtos');
      section?.scrollIntoView({
        behavior: reducedMotion.matches ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  }

  qsa('[data-tab-target]').forEach(control => {
    control.addEventListener('click', event => {
      const tabName = control.dataset.tabTarget;
      if (!tabName) return;

      if (control.tagName === 'A') event.preventDefault();
      switchTab(tabName, { scrollToProducts: control.closest('.hero-slide') !== null });
    });
  });

  qsa('.tab-btn').forEach((button, index, buttons) => {
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();

      let nextIndex = index;
      if (event.key === 'ArrowLeft') nextIndex = (index - 1 + buttons.length) % buttons.length;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % buttons.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = buttons.length - 1;

      const next = buttons[nextIndex];
      next.focus();
      switchTab(next.dataset.tabTarget, { scrollToProducts: false });
    });
  });

  // Estado inicial acessível das abas.
  qsa('.tab-content').forEach(panel => {
    panel.hidden = !panel.classList.contains('active');
  });

  /* Scroll suave de links internos que não controlam abas */
  qsa('a[href^="#"]:not([data-tab-target])').forEach(anchor => {
    anchor.addEventListener('click', event => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;

      const target = qs(href);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({
        behavior: reducedMotion.matches ? 'auto' : 'smooth',
        block: 'start',
      });
      setMobileMenu(false);
    });
  });

  /* Sombra do header */
  const header = qs('#main-header');
  function updateHeaderShadow() {
    header?.classList.toggle('shadow-md', window.scrollY > 10);
  }
  window.addEventListener('scroll', updateHeaderShadow, { passive: true });

  /* Animação de entrada */
  const animatedCards = qsa('.product-card, .diferencial-card, .insta-card');
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

    animatedCards.forEach(card => {
      card.classList.add('fade-in-up');
      observer.observe(card);
    });
  } else {
    animatedCards.forEach(card => card.classList.add('is-visible'));
  }

  /* Pulso discreto do WhatsApp */
  const floatButton = qs('#whatsapp-float');
  if (floatButton && !reducedMotion.matches) {
    window.setInterval(() => {
      floatButton.classList.remove('is-pulsing');
      void floatButton.offsetWidth;
      floatButton.classList.add('is-pulsing');
    }, 8000);
  }

  // Quando o CTA final aparece, ele substitui o botão flutuante no mobile.
  const contactSection = qs('#contato');
  if (floatButton && contactSection && 'IntersectionObserver' in window) {
    const contactObserver = new IntersectionObserver(entries => {
      const visible = entries.some(entry => entry.isIntersecting);
      floatButton.classList.toggle('is-cta-visible', visible);
    }, { threshold: 0.08 });

    contactObserver.observe(contactSection);
  }

  /* Eventos globais de responsividade */
  window.addEventListener('resize', scheduleResponsiveLayout, { passive: true });
  window.addEventListener('orientationchange', scheduleResponsiveLayout, { passive: true });
  window.visualViewport?.addEventListener('resize', scheduleResponsiveLayout, { passive: true });

  applyResponsiveLayout();
  updateHeaderShadow();
  goToSlide(0);
  startCarousel();

  // Compatibilidade com chamadas antigas do projeto.
  window.goToSlide = goToSlide;
  window.switchTab = tabName => switchTab(tabName, { scrollToProducts: true });
  window.applyResponsiveLayout = applyResponsiveLayout;
})();
