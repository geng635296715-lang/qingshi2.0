(() => {
  const STORAGE_KEY = 'qingshiji-viewport-mode';
  const BREAKPOINT = 768;
  const root = document.documentElement;
  const saved = localStorage.getItem(STORAGE_KEY);
  let preference = saved === 'mobile' || saved === 'web' ? saved : 'auto';

  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = './app/responsive-shell.css?v=20260725-2';
  document.head.appendChild(stylesheet);

  function detectedMode() {
    return window.innerWidth >= BREAKPOINT ? 'web' : 'mobile';
  }

  function activeMode() {
    return preference === 'auto' ? detectedMode() : preference;
  }

  function iconMarkup(mode) {
    return mode === 'web'
      ? '<i class="viewport-device phone-icon" aria-hidden="true"><b></b></i><span>切换手机端</span>'
      : '<i class="viewport-device desktop-icon" aria-hidden="true"><b></b></i><span>切换电脑端</span>';
  }

  function update() {
    const mode = activeMode();
    root.dataset.viewportMode = mode;
    root.dataset.viewportPreference = preference;
    syncWebTopbar(mode);
    const button = document.querySelector('.viewport-mode-toggle');
    if (button) {
      button.innerHTML = iconMarkup(mode);
      button.setAttribute('aria-label', mode === 'web' ? '切换为手机移动端布局' : '切换为电脑和平板布局');
      button.title = preference === 'auto'
        ? `当前自动识别为${mode === 'web' ? '电脑/平板端' : '手机端'}`
        : `当前固定为${mode === 'web' ? '电脑/平板端' : '手机端'}，双击恢复自动识别`;
    }
  }

  function syncWebTopbar(mode) {
    let bar = document.querySelector('.web-topbar');
    if (mode === 'web') {
      if (!bar) {
        const path = location.pathname.split('/').pop() || 'index.html';
        const items = [
          ['index.html', './', '首页'],
          ['chart.html', './chart.html', '八字排盘'],
          ['hepan.html', './hepan.html', '八字合盘'],
          ['liuyao.html', './liuyao.html', '六爻占卜'],
          ['applications.html', './applications.html', '应用']
        ];
        bar = document.createElement('header');
        bar.className = 'web-topbar';
        bar.innerHTML = `<div class="web-topbar-inner">
          <a class="web-brand" href="./" aria-label="青筮问道首页">
            <img src="./assets/qing-logo-horizontal.png" alt="青筮问道">
            <span>QING SHI WEN DAO</span>
            <span class="web-brand-copy"><b>青衣筮卜　窥天问道</b><small>东方传统国学工作台</small></span>
          </a>
          <nav aria-label="电脑端主导航">${items.map(([file, href, label]) => `<a class="${path === file ? 'active' : ''}" href="${href}">${label}</a>`).join('')}</nav>
          <div class="web-topbar-actions"><a href="./bazi.html">本地档案</a></div>
        </div>`;
        document.body.prepend(bar);
      }
    } else if (bar) {
      bar.remove();
    }
  }

  function mount() {
    if (document.body.classList.contains('embedded')) {
      root.dataset.viewportMode = 'mobile';
      root.dataset.viewportPreference = 'embedded';
      return;
    }
    if (document.querySelector('.viewport-mode-toggle')) return update();
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'viewport-mode-toggle';
    button.addEventListener('click', () => {
      preference = activeMode() === 'web' ? 'mobile' : 'web';
      localStorage.setItem(STORAGE_KEY, preference);
      update();
    });
    button.addEventListener('dblclick', event => {
      event.preventDefault();
      preference = 'auto';
      localStorage.removeItem(STORAGE_KEY);
      update();
    });
    document.body.appendChild(button);
    update();
  }

  root.dataset.viewportMode = activeMode();
  window.addEventListener('resize', () => {
    if (preference === 'auto') update();
  }, { passive: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
