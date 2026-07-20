/* ============================================================ */
/* MICROINTERACTIONS MOBILE-FIRST - Camerata 21 */
/* Interactions táteis e visuais perfeitas para mobile */
/* ============================================================ */

'use strict';

class MicroInteractions {
  constructor() {
    this.isMobile = this.detectMobile();
    this.touchEvents = new Set();
    this.clickTimeout = null;
    this.hapticFeedback = this.hasHapticFeedback();

    this.init();
  }

  // Detecção de recursos do dispositivo
  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }

  // Verifica suporte a feedback háptico
  hasHapticFeedback() {
    return 'vibrate' in navigator;
  }

  // Inicialização
  init() {
    this.setupButtonInteractions();
    this.setupFieldInteractions();
    this.setupCardInteractions();
    this.setupProgressInteractions();
    this.setupGestureFeedback();

    if (this.isMobile) {
      this.setupTouchOptimizations();
    }
  }

  // Botões com feedback tátil
  setupButtonInteractions() {
    document.querySelectorAll('.btn-animate').forEach(button => {
      // Prevent double tap zoom
      button.addEventListener('touchend', (e) => {
        e.preventDefault();
      }, { passive: false });

      button.addEventListener('touchstart', (e) => {
        this.handleButtonTouch(button, e, 'start');
      }, { passive: true });

      button.addEventListener('touchend', (e) => {
        this.handleButtonTouch(button, e, 'end');
      }, { passive: true });

      button.addEventListener('touchcancel', (e) => {
        this.handleButtonTouch(button, e, 'cancel');
      }, { passive: true });
    });
  }

  // Handle eventos de toque em botões
  handleButtonTouch(button, event, state) {
    const touch = event.changedTouches ? event.changedTouches[0] : event;
    const rect = button.getBoundingClientRect();

    // Verifica se o toque está dentro do botão
    const isInside = touch.clientX >= rect.left &&
                    touch.clientX <= rect.right &&
                    touch.clientY >= rect.top &&
                    touch.clientY <= rect.bottom;

    if (state === 'start') {
      button.classList.add('touch-active');

      // Feedback háptico suave
      if (this.hapticFeedback && isInside) {
        navigator.vibrate(10);
      }

      // Ripple effect
      this.createRipple(button, touch);

    } else if (state === 'end') {
      button.classList.remove('touch-active');

      if (isInside) {
        // Animação de sucesso
        this.animateButtonSuccess(button);
      }

    } else if (state === 'cancel') {
      button.classList.remove('touch-active');
    }
  }

  // Cria efeito ripple
  createRipple(button, touch) {
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = touch.clientX - rect.left - size / 2;
    const y = touch.clientY - rect.top - size / 2;

    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.style.transform = 'scale(4)';
      ripple.style.opacity = '0';
    }, 10);

    setTimeout(() => ripple.remove(), 600);
  }

  // Animação de sucesso no botão
  animateButtonSuccess(button) {
    button.classList.add('btn-success');
    const checkmark = document.createElement('span');
    checkmark.className = 'success-checkmark';
    checkmark.innerHTML = '✓';
    button.appendChild(checkmark);

    setTimeout(() => {
      button.classList.remove('btn-success');
      checkmark.remove();
    }, 1000);
  }

  // Campos de formulário com feedback tátil
  setupFieldInteractions() {
    const fields = document.querySelectorAll('.form-field');

    fields.forEach(field => {
      field.addEventListener('focus', (e) => {
        this.handleFieldFocus(field, e);
      }, { passive: true });

      field.addEventListener('blur', (e) => {
        this.handleFieldBlur(field, e);
      }, { passive: true });

      field.addEventListener('input', (e) => {
        this.handleFieldInput(field, e);
      }, { passive: true });

      // Placeholder animation
      if (field.hasAttribute('placeholder')) {
        this.animatePlaceholder(field);
      }
    });
  }

  // Focus em campos
  handleFieldFocus(field, event) {
    field.classList.add('focused');
    field.dataset.focused = 'true';

    // Move label para cima
    const label = field.parentElement?.querySelector('label');
    if (label) {
      label.classList.add('focused-label');
      label.style.transform = 'translateY(-20px) scale(0.8)';
      label.style.color = 'var(--farol)';
    }

    // Efeito sônico visual
    this.createFieldWave(field);
  }

  // Blur em campos
  handleFieldBlur(field, event) {
    field.classList.remove('focused');
    field.dataset.focused = 'false';

    // Validação visual
    if (field.checkValidity()) {
      field.classList.add('valid');
      field.classList.remove('invalid');
    } else {
      field.classList.add('invalid');
      field.classList.remove('valid');
    }

    // Retorna label se campo vazio
    const label = field.parentElement?.querySelector('label');
    if (label && !field.value) {
      label.classList.remove('focused-label');
      label.style.transform = '';
      label.style.color = '';
    }
  }

  // Input em campos
  handleFieldInput(field, event) {
    // Remove classes de validação
    field.classList.remove('valid', 'invalid');

    // Feedback visual ao digitar
    field.classList.add('typing');
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      field.classList.remove('typing');
    }, 300);
  }

  // Animação do placeholder
  animatePlaceholder(field) {
    const placeholder = field.getAttribute('placeholder');
    if (!placeholder) return;

    field.addEventListener('focus', () => {
      field.placeholder = '';
    });

    field.addEventListener('blur', () => {
      if (!field.value) {
        field.placeholder = placeholder;
      }
    });
  }

  // Cria onda sônica visual
  createFieldWave(field) {
    const wave = document.createElement('div');
    wave.className = 'field-wave';
    field.parentElement.appendChild(wave);

    requestAnimationFrame(() => {
      wave.style.transform = 'scale(3)';
      wave.style.opacity = '0';
    });

    setTimeout(() => wave.remove(), 600);
  }

  // Cards com feedback tátil
  setupCardInteractions() {
    const cards = document.querySelectorAll('.card, .instrument-card');

    cards.forEach(card => {
      // Touch feedback
      card.addEventListener('touchstart', (e) => {
        this.handleCardTouch(card, e, 'start');
      }, { passive: true });

      card.addEventListener('touchend', (e) => {
        this.handleCardTouch(card, e, 'end');
      }, { passive: true });

      // Click feedback desktop
      if (!this.isMobile) {
        card.addEventListener('click', (e) => {
          this.handleCardClick(card, e);
        });
      }
    });
  }

  // Touch em cards
  handleCardTouch(card, event, state) {
    if (state === 'start') {
      card.classList.add('card-touched');
      const touch = event.touches[0];
      const rect = card.getBoundingClientRect();

      // Salva posição do toque
      card.dataset.touchX = touch.clientX - rect.left;
      card.dataset.touchY = touch.clientY - rect.top;
    } else if (state === 'end') {
      card.classList.remove('card-touched');

      // Animação de seleção
      if (card.classList.contains('selected')) {
        this.animateCardSelection(card);
      }
    }
  }

  // Click em cards (desktop)
  handleCardClick(card, event) {
    card.classList.add('clicked');

    setTimeout(() => {
      card.classList.remove('clicked');
    }, 300);

    // Animação 3D
    const rotateX = (Math.random() - 0.5) * 10;
    const rotateY = (Math.random() - 0.5) * 10;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(0.95)`;

    setTimeout(() => {
      card.style.transform = '';
    }, 200);
  }

  // Animação de seleção de card
  animateCardSelection(card) {
    const checkmark = document.createElement('div');
    checkmark.className = 'card-selection';
    checkmark.innerHTML = '✓';
    card.appendChild(checkmark);

    setTimeout(() => {
      checkmark.remove();
    }, 1000);
  }

  // Barra de progresso com feedback
  setupProgressInteractions() {
    const progressBar = document.querySelector('.progress-fill');
    if (!progressBar) return;

    // Animação de preenchimento
    const animateProgress = (percentage) => {
      progressBar.style.transition = 'width 0.6s ease-out';
      progressBar.style.width = percentage + '%';

      // Feedback visual
      if (percentage === 100) {
        this.animateCompletion();
      }
    };

    // Observa mudanças no progresso
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'style' &&
            mutation.target.style.width) {
          const percentage = parseFloat(mutation.target.style.width);
          animateProgress(percentage);
        }
      });
    });

    observer.observe(progressBar, { attributes: true });
  }

  // Animação de conclusão
  animateCompletion() {
    const container = document.querySelector('.wizard-container');

    // Efeito de celebração
    const celebration = document.createElement('div');
    celebration.className = 'completion-celebration';
    container.appendChild(celebration);

    // Animação de confetes
    this.createConfetti(container);

    setTimeout(() => {
      celebration.remove();
    }, 2000);
  }

  // Sistema de confetes otimizado
  createConfetti(container) {
    const colors = ['#FFB800', '#B2FF05', '#2E4BFF'];
    const confettiCount = this.isMobile ? 20 : 50;

    for (let i = 0; i < confettiCount; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
        confetti.style.animationDelay = Math.random() * 0.5 + 's';

        container.appendChild(confetti);

        setTimeout(() => confetti.remove(), 5000);
      }, i * 30);
    }
  }

  // Gestos e navegação
  setupGestureFeedback() {
    if (!this.isMobile) return;

    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      // Swipe horizontal
      if (Math.abs(deltaX) > 50) {
        this.triggerSwipeFeedback(deltaX > 0 ? 'right' : 'left');
      }

      // Swipe vertical
      if (Math.abs(deltaY) > 50) {
        this.triggerSwipeFeedback(deltaY > 0 ? 'down' : 'up');
      }
    }, { passive: true });
  }

  // Feedback de swipe
  triggerSwipeFeedback(direction) {
    const feedback = document.createElement('div');
    feedback.className = 'swipe-feedback';
    feedback.textContent = direction === 'right' ? '←' : direction === 'left' ? '→' :
                          direction === 'up' ? '↑' : '↓';
    feedback.style.transform = 'scale(1.5)';

    document.body.appendChild(feedback);

    setTimeout(() => {
      feedback.style.transform = 'scale(0)';
      feedback.style.opacity = '0';
    }, 200);

    setTimeout(() => feedback.remove(), 400);
  }

  // Otimizações específicas para mobile
  setupTouchOptimizations() {
    // Evita zoom duplo clique
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });

    // Ajusta tamanhos de toque
    document.querySelectorAll('button, .clickable').forEach(element => {
      const rect = element.getBoundingClientRect();
      const minSize = Math.min(rect.width, rect.height);

      if (minSize < 44) {
        element.style.padding = '12px';
      }
    });

    // Scroll suave
    document.querySelectorAll('.smooth-scroll').forEach(element => {
      element.style.scrollBehavior = 'smooth';
      element.style.webkitOverflowScrolling = 'touch';
    });
  }

  // Destruir instância
  destroy() {
    // Limpa timeouts
    if (this.clickTimeout) {
      clearTimeout(this.clickTimeout);
    }
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  const microInteractions = new MicroInteractions();
  window.MicroInteractions = MicroInteractions;
  window.microInteractions = microInteractions;
});

// Export para uso global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MicroInteractions;
}