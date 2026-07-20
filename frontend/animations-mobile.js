/* ============================================================ */
/* ANIMAÇÕES MOBILE-FIRST - Camerata 21 */
/* 100% Otimizado para dispositivos móveis */
/* Performance garantida em todos os dispositivos */
/* ============================================================ */

'use strict';

class MobileAnimations {
  constructor() {
    this.isMobile = this.detectMobile();
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.animationQueue = [];
    this.isAnimating = false;

    this.init();
  }

  // Detecção de dispositivos
  detectMobile() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isSmallScreen = window.innerWidth <= 768;

    return isMobile || isSmallScreen;
  }

  // Inicialização
  init() {
    this.setupReducedMotion();
    this.setupTouchEvents();
    this.setupIntersectionObserver();
    this.setupPerformanceOptimization();

    // Adiciona classes ao body para mobile
    if (this.isMobile) {
      document.body.classList.add('mobile-animations');
    }

    if (this.isReducedMotion) {
      document.body.classList.add('reduced-motion');
    }
  }

  // Configurações para redução de movimento
  setupReducedMotion() {
    if (this.isReducedMotion) {
      // Remove todas as animações complexas
      document.querySelectorAll('.animate-float, .animate-pulse, .animate-glow').forEach(el => {
        el.style.animation = 'none';
      });

      // Mantém apenas transições essenciais
      document.querySelectorAll('[class*="animate"]').forEach(el => {
        const duration = parseFloat(getComputedStyle(el).animationDuration) || 0;
        if (duration > 0.3) {
          el.style.animationDuration = '0s';
        }
      });
    }
  }

  // Eventos touch otimizados
  setupTouchEvents() {
    // Touch feedback para botões
    document.addEventListener('touchstart', (e) => {
      if (e.target.closest('.btn-animate')) {
        const btn = e.target.closest('.btn-animate');
        btn.classList.add('touch-active');

        // Cria ripple effect no ponto do toque
        this.createRipple(e, btn);
      }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      if (e.target.closest('.btn-animate')) {
        const btn = e.target.closest('.btn-animate');
        btn.classList.remove('touch-active');
      }
    }, { passive: true });

    // Prevenir scroll em elementos animados
    document.querySelectorAll('.animate-vertical-scroll').forEach(el => {
      let isDown = false;
      let startY = 0;
      let scrollTop = 0;

      el.addEventListener('touchstart', (e) => {
        isDown = true;
        startY = e.touches[0].pageY;
        scrollTop = el.scrollTop;
      }, { passive: false });

      el.addEventListener('touchmove', (e) => {
        if (!isDown) return;
        e.preventDefault();

        const y = e.touches[0].pageY;
        const walk = (y - startY) * 2;
        el.scrollTop = scrollTop - walk;
      }, { passive: false });

      el.addEventListener('touchend', () => {
        isDown = false;
      });
    });
  }

  // Cria efeito ripple no ponto de toque
  createRipple(e, button) {
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.touches[0].clientX - rect.left - size / 2;
    const y = e.touches[0].clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');

    button.appendChild(ripple);

    // Remove ripple após animação
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  // Intersection Observer para animações performáticas
  setupIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
          this.animateElement(entry.target);
          entry.target.classList.add('animated');
        }
      });
    }, options);

    // Observa elementos que precisam de animação
    document.querySelectorAll('.scroll-reveal, .animate-on-scroll').forEach(el => {
      observer.observe(el);
    });
  }

  // Otimização de performance
  setupPerformanceOptimization() {
    // Usa requestAnimationFrame para animações suaves
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // Otimiza animações durante scroll
    this.lastScrollY = window.scrollY;
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const delta = scrollY - this.lastScrollY;
      this.lastScrollY = scrollY;

      // Pausa animações pesadas durante scroll rápido
      if (Math.abs(delta) > 50) {
        this.pauseHeavyAnimations();
      } else {
        this.resumeHeavyAnimations();
      }
    }, { passive: true });
  }

  // Anima elementos com consideração mobile
  animateElement(element) {
    const animationType = element.dataset.animation || 'fade-in-up';
    const delay = element.dataset.delay || '0';
    const duration = element.dataset.duration || '0.4';

    // Ajusta duração para dispositivos mais lentos
    const adjustedDuration = this.isMobile ? Math.max(parseFloat(duration), 0.6) : duration;

    element.style.animation = `${animationType} ${adjustedDuration}s ease-out ${delay}s forwards`;

    // Para mobile, adiciona transformação extra para melhor experiência tátil
    if (this.isMobile && element.classList.contains('card-3d')) {
      element.style.transform = 'translateZ(0)';
    }
  }

  // Pausa animações pesadas
  pauseHeavyAnimations() {
    document.querySelectorAll('.animate-float, .animate-pulse, .animate-glow').forEach(el => {
      el.style.animationPlayState = 'paused';
    });
  }

  // Retoma animações
  resumeHeavyAnimations() {
    document.querySelectorAll('.animate-float, .animate-pulse, .animate-glow').forEach(el => {
      if (!this.isReducedMotion) {
        el.style.animationPlayState = 'running';
      }
    });
  }

  // Handle scroll effects
  handleScroll() {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.parallax-element');

    parallaxElements.forEach(el => {
      const speed = el.dataset.speed || 0.5;
      const yPos = -(scrolled * speed);
      el.style.transform = `translateY(${yPos}px)`;
    });
  }

  // Animações específicas para formulário mobile
  setupFormAnimations() {
    if (!this.isMobile) return;

    // Anima campos de formulário com feedback tátil
    const formFields = document.querySelectorAll('.form-field');

    formFields.forEach(field => {
      field.addEventListener('focus', () => {
        field.classList.add('focused-mobile');
        this.animateField(field, 'focus');
      }, { passive: true });

      field.addEventListener('blur', () => {
        field.classList.remove('focused-mobile');
        this.animateField(field, 'blur');
      }, { passive: true });

      // Feedback visual ao digitar
      let typingTimer;
      field.addEventListener('input', () => {
        field.classList.add('typing');
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
          field.classList.remove('typing');
        }, 1000);
      }, { passive: true });
    });
  }

  // Anima campos de formulário
  animateField(field, state) {
    if (!this.isMobile) return;

    const fieldRect = field.getBoundingClientRect();
    const fieldCenter = fieldRect.left + fieldRect.width / 2;
    const fieldTop = fieldRect.top;

    // Cria onda sônica visual
    const ripple = document.createElement('div');
    ripple.className = 'form-ripple';
    ripple.style.left = fieldRect.width / 2 + 'px';
    ripple.style.top = '0';
    ripple.style.width = '20px';
    ripple.style.height = '20px';

    field.appendChild(ripple);

    // Animação da onda
    requestAnimationFrame(() => {
      ripple.style.transform = 'scale(20)';
      ripple.style.opacity = '0';
    });

    setTimeout(() => ripple.remove(), 600);
  }

  // Drag and drop otimizado para mobile
  setupDragAndDrop() {
    if (!this.isMobile) return;

    const dragItems = document.querySelectorAll('.drag-item');
    let draggedElement = null;
    let touchOffset = { x: 0, y: 0 };

    dragItems.forEach(item => {
      item.addEventListener('touchstart', (e) => {
        draggedElement = item;
        const touch = e.touches[0];
        const rect = item.getBoundingClientRect();

        touchOffset.x = touch.clientX - rect.left;
        touchOffset.y = touch.clientY - rect.top;

        item.classList.add('dragging');
        item.style.zIndex = '1000';
        item.style.position = 'fixed';
      }, { passive: true });

      item.addEventListener('touchmove', (e) => {
        if (!draggedElement) return;
        e.preventDefault();

        const touch = e.touches[0];
        draggedElement.style.left = (touch.clientX - touchOffset.x) + 'px';
        draggedElement.style.top = (touch.clientY - touchOffset.y) + 'px';
      }, { passive: false });

      item.addEventListener('touchend', (e) => {
        if (!draggedElement) return;

        draggedElement.classList.remove('dragging');
        draggedElement.style.zIndex = '';
        draggedElement.style.position = '';

        // Volta para a posição original com animação
        draggedElement.style.transition = 'all 0.3s ease-out';
        draggedElement.style.left = '';
        draggedElement.style.top = '';

        setTimeout(() => {
          draggedElement.style.transition = '';
        }, 300);

        draggedElement = null;
      }, { passive: true });
    });
  }

  // Sistema de partículas otimizado para mobile
  setupParticleSystem() {
    if (!this.isMobile) return;

    const particleContainer = document.querySelector('.particles-container');
    if (!particleContainer) return;

    // Limita número de partículas em mobile
    const maxParticles = this.isMobile ? 20 : 50;

    // Cria partículas com animação otimizada
    for (let i = 0; i < maxParticles; i++) {
      const particle = document.createElement('div');
      particle.className = 'mobile-particle';

      // Ajusta tamanho e duração para mobile
      const size = Math.random() * 4 + 2;
      const duration = Math.random() * 10 + 10;

      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDuration = duration + 's';
      particle.style.animationDelay = Math.random() * 5 + 's';

      particleContainer.appendChild(particle);
    }
  }

  // Gestos de navegação
  setupNavigationGestures() {
    if (!this.isMobile) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let minSwipeDistance = 50;

    const container = document.querySelector('.wizard-container');

    container.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // Swipe horizontal
      if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          // Swipe right - voltar
          this.navigateBack();
        } else {
          // Swipe left - avançar
          this.navigateForward();
        }
      }

      // Swipe vertical
      if (Math.abs(deltaY) > minSwipeDistance && Math.abs(deltaY) > Math.abs(deltaX)) {
        if (deltaY > 0) {
          // Swipe down
          this.handleSwipeDown();
        } else {
          // Swipe up
          this.handleSwipeUp();
        }
      }
    }, { passive: true });
  }

  // Navegação por gestos
  navigateBack() {
    const prevButton = document.querySelector('.btn-prev');
    if (prevButton && !prevButton.disabled) {
      prevButton.click();
    }
  }

  navigateForward() {
    const nextButton = document.querySelector('.btn-next');
    if (nextButton && !nextButton.disabled) {
      nextButton.click();
    }
  }

  handleSwipeDown() {
    // Ação para swipe down
  }

  handleSwipeUp() {
    // Ação para swipe up
  }

  // Animações de entrada otimizadas
  setupEntryAnimations() {
    if (!this.isMobile) return;

    // Animações específicas para telas mobile
    const screens = document.querySelectorAll('.screen');

    screens.forEach((screen, index) => {
      screen.style.animation = `fadeInUp 0.4s ease-out ${index * 0.1}s forwards`;
    });
  }

  // Cleanup de recursos
  destroy() {
    // Remove event listeners
    window.removeEventListener('scroll', this.handleScroll);
    document.body.classList.remove('mobile-animations', 'reduced-motion');
  }
}

// Inicializa quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  const mobileAnimations = new MobileAnimations();

  // Exporta para global scope
  window.MobileAnimations = MobileAnimations;
  window.mobileAnimations = mobileAnimations;

  console.log('Mobile animations initialized:', {
    isMobile: mobileAnimations.isMobile,
    isReducedMotion: mobileAnimations.isReducedMotion,
    touchSupported: mobileAnimations.touchSupported
  });
});

// Performance monitoring
if ('PerformanceObserver' in window) {
  const perfObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 100) {
        console.warn('Long animation detected:', entry);
      }
    }
  });

  perfObserver.observe({ entryTypes: ['measure'] });
}