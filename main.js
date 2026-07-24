/* =============================================
   VESCOPLAST — main.js
   ============================================= */

/* ── Ano dinâmico no rodapé ── */
document.getElementById('currentYear').textContent = new Date().getFullYear();


/* ── Scroll suave para links âncora internos ── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});


/* ── Header: sombra ao rolar ── */
const header = document.querySelector('header');

window.addEventListener('scroll', () => {
  if (window.scrollY > 10) {
    header.classList.add('shadow-md');
  } else {
    header.classList.remove('shadow-md');
  }
});


/* ── Animação de entrada dos cards de produto (Intersection Observer) ── */
const observerOptions = {
  threshold: 0.12,
  rootMargin: '0px 0px -40px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.product-card, .diferencial-card, .insta-card').forEach(el => {
  el.classList.add('fade-in-up');
  observer.observe(el);
});


/* ── Botão flutuante: pulso de atenção a cada 8s ── */
const floatBtn = document.getElementById('whatsapp-float');

function pulseFloat() {
  floatBtn.style.transform = 'scale(1.2)';
  setTimeout(() => {
    floatBtn.style.transform = 'scale(1)';
  }, 300);
}

setInterval(pulseFloat, 8000);


/* ── Tooltip no botão flutuante ── */
const tooltip = document.createElement('span');
tooltip.textContent = 'Fale conosco!';
tooltip.style.cssText = `
  position: absolute;
  right: 4.5rem;
  background: #1e293b;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.35rem 0.75rem;
  border-radius: 0.5rem;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
`;
floatBtn.style.position = 'fixed';
floatBtn.appendChild(tooltip);

floatBtn.addEventListener('mouseenter', () => { tooltip.style.opacity = '1'; });
floatBtn.addEventListener('mouseleave', () => { tooltip.style.opacity = '0'; });


/* ── Injeção do CSS de animação fade-in-up via JS ── */
const animStyle = document.createElement('style');
animStyle.textContent = `
  .fade-in-up {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 0.55s ease, transform 0.55s ease;
  }
  .fade-in-up.is-visible {
    opacity: 1;
    transform: translateY(0);
  }
`;
document.head.appendChild(animStyle);