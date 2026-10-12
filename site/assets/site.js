(() => {
  // القائمة على الجوال
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => { nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); }));
  }

  // موجة الصوت في التايم لاين التوضيحي (زخرفية)
  document.querySelectorAll('.wave[data-bars]').forEach((el) => {
    const count = Number(el.dataset.bars) || 48;
    for (let i = 0; i < count; i++) {
      const bar = document.createElement('i');
      const h = 22 + Math.abs(Math.sin(i * 1.3) * 60 * (0.55 + 0.45 * Math.cos(i * 0.37)));
      bar.style.height = Math.min(100, Math.round(h)) + '%';
      el.appendChild(bar);
    }
  });

  // نسخ أمر التثبيت
  document.querySelectorAll('.copy[data-copy]').forEach((b) => {
    b.addEventListener('click', async () => {
      const text = document.getElementById(b.dataset.copy).textContent.trim();
      try { await navigator.clipboard.writeText(text); }
      catch (e) { const r = document.createRange(); r.selectNodeContents(document.getElementById(b.dataset.copy)); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
      const old = b.textContent; b.textContent = 'انتسخ'; b.classList.add('done');
      setTimeout(() => { b.textContent = old; b.classList.remove('done'); }, 1800);
    });
  });
})();
