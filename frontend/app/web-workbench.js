(() => {
  const page = location.pathname.split('/').pop();
  if (!['chart.html', 'hepan.html'].includes(page)) return;
  const isChart = page === 'chart.html';

  const archives = () => {
    try {
      const value = JSON.parse(localStorage.getItem('qingshiji-archives') || '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  };
  const selected = () => localStorage.getItem('qingshiji-selected') || '';

  function renderArchiveList(root) {
    const list = root.querySelector('.wb-archive-list');
    if (!list) return;
    const current = selected();
    const items = archives();
    list.innerHTML = items.length ? items.map(item => `
      <article class="wb-profile-card ${item.id === current ? 'selected' : ''}">
        <header>
          <i>${(item.name || '命').slice(0, 1)}</i>
          <div><b>${item.name || '未命名'}</b><small>${item.gender === '男' ? '乾造' : '坤造'} · ${item.location || '未填写地区'}</small></div>
        </header>
        <p>${String(item.solar || '').replace('T', ' ') || '未填写出生时间'}</p>
        <div>
          <button type="button" data-wb-select="${item.id}">选择</button>
          <button type="button" data-wb-edit="${item.id}">修改</button>
          <button type="button" class="danger" data-wb-delete="${item.id}">删除</button>
        </div>
      </article>`).join('') : '<div class="wb-archive-empty">暂无人物档案<small>点击“录入档案”添加第一份信息</small></div>';
  }

  function syncFeatureRail(root) {
    const source = document.querySelector(isChart ? '#chartRoot .content-tabs' : '.hepan-content-tabs');
    const host = root.querySelector('.wb-feature-list');
    if (!source || !host) return;
    const sourceButtons = [...source.querySelectorAll('button')];
    if (host.children.length !== sourceButtons.length) {
      host.innerHTML = sourceButtons.map((button, index) => `<button type="button" data-wb-feature="${index}"><span>${button.textContent.trim()}</span><i>›</i></button>`).join('');
    }
    sourceButtons.forEach((button, index) => host.children[index]?.classList.toggle('active', button.classList.contains('active')));
  }

  function arrangeBaziBaseLayout() {
    if (!isChart) return;
    const base = document.querySelector('#chartRoot #base');
    if (!base) return;
    const cards = [...base.querySelectorAll(':scope > .section-card')];
    const chart = cards.find(card => card.querySelector('.section-head h2')?.textContent.trim() === '八字命帖');
    const luck = cards.find(card => card.querySelector('.section-head h2')?.textContent.trim() === '流运');
    if (!chart || !luck) return;

    let layout = base.querySelector(':scope > .wb-bazi-base-layout');
    if (!layout) {
      layout = document.createElement('div');
      layout.className = 'wb-bazi-base-layout';
      layout.innerHTML = '<div class="wb-bazi-chart-column"></div><div class="wb-bazi-luck-column"></div>';
      chart.before(layout);
    }
    const chartColumn = layout.querySelector('.wb-bazi-chart-column');
    const luckColumn = layout.querySelector('.wb-bazi-luck-column');
    if (chart.parentElement !== chartColumn) chartColumn.appendChild(chart);
    if (luck.parentElement !== luckColumn) luckColumn.appendChild(luck);
    if (!luck.classList.contains('wb-bazi-luck-stack')) luck.classList.add('wb-bazi-luck-stack');

    const labels = {
      dayun: ['大运', '十年运势'],
      years: ['流年 / 小运', '当年参看'],
      months: ['流月', '逐月参看']
    };
    luck.querySelectorAll('.luck-panel').forEach(panel => {
      if (panel.querySelector(':scope > .wb-luck-panel-head')) return;
      const [title, subtitle] = labels[panel.id] || ['流运', '动态参看'];
      const head = document.createElement('div');
      head.className = 'wb-luck-panel-head';
      head.innerHTML = `<b>${title}</b><small>${subtitle}</small>`;
      panel.prepend(head);
    });
  }

  function arrangeSmartInterpretation() {
    if (!isChart) return;
    const panel = document.querySelector('#chartRoot #smart');
    const chart = panel?.querySelector('.smart-chart-card');
    const analysis = panel?.querySelector('.smart-day-ganzhi');
    const personality = analysis?.querySelector('.day-personality-result');
    if (!panel || !chart || !analysis || !personality) return;

    let layout = panel.querySelector(':scope > .wb-smart-primary-layout');
    if (!layout) {
      layout = document.createElement('div');
      layout.className = 'wb-smart-primary-layout';
      layout.innerHTML = '<div class="wb-smart-chart-column"></div><section class="section-card wb-smart-day-card"></section>';
      chart.before(layout);
    }
    const chartColumn = layout.querySelector('.wb-smart-chart-column');
    if (chart.parentElement !== chartColumn) chartColumn.appendChild(chart);

    const dayCard = layout.querySelector('.wb-smart-day-card');
    if (!dayCard.dataset.ready) {
      const heading = analysis.querySelector(':scope > .section-head:first-child');
      const reference = analysis.querySelector(':scope > .smart-reference-tip');
      dayCard.replaceChildren(
        ...[heading, reference, personality].filter(Boolean).map(node => node.cloneNode(true))
      );
      dayCard.dataset.ready = '1';
    }
    if (!analysis.classList.contains('wb-smart-ganzhi-only')) analysis.classList.add('wb-smart-ganzhi-only');
  }

  function mount() {
    if (document.querySelector('.four-pane-workbench')) return;
    const main = document.querySelector('body > main');
    if (!main) return;
    document.body.classList.add('has-four-pane-workbench');
    const shell = document.createElement('div');
    shell.className = 'four-pane-workbench';
    shell.innerHTML = `
      <aside class="wb-pane wb-feature-pane">
        <header><small>${isChart ? 'BAZI NATAL' : 'BAZI MATCH'}</small><h2>${isChart ? '八字排盘' : '八字合盘'}</h2></header>
        <nav class="wb-feature-list" aria-label="${isChart ? '八字排盘' : '八字合盘'}功能"></nav>
        <footer><span>功能工作台</span><small>选择板块后在中间区域查看内容</small></footer>
      </aside>
      <aside class="wb-pane wb-archive-pane">
        <header><div><small>LOCAL ARCHIVES</small><h2>档案管理</h2></div><b class="wb-archive-count">0</b></header>
        <div class="wb-archive-actions">
          <button type="button" data-wb-add>录入档案</button>
        </div>
        <div class="wb-archive-list"></div>
      </aside>
      <section class="wb-main-pane" aria-label="命理工作台"></section>
      <aside class="wb-pane wb-ai-pane">
        <header><i>AI</i><div><h2>AI 命理师</h2><small>即时参详 · 暂未开放</small></div><span></span></header>
        <div class="wb-ai-chat">
          <time>今天</time>
          <p class="ai-message">你好，我是青筮问道 AI 命理师。未来可结合当前命帖，为你解释术语、梳理重点并回答问题。</p>
          <div class="wb-ai-capabilities"><span>命帖解读</span><span>关系梳理</span><span>岁运问答</span></div>
        </div>
        <div class="wb-ai-input">
          <textarea disabled placeholder="AI 命理师暂未开放"></textarea>
          <button type="button" disabled aria-label="发送消息">↑</button>
        </div>
        <small class="wb-ai-note">AI 内容仅作传统文化研究参考</small>
      </aside>`;
    main.before(shell);
    shell.querySelector('.wb-main-pane').appendChild(main);
    shell.querySelector('.wb-archive-count').textContent = archives().length;
    renderArchiveList(shell);
    syncFeatureRail(shell);
    arrangeBaziBaseLayout();
    arrangeSmartInterpretation();

    shell.addEventListener('click', event => {
      const feature = event.target.closest('[data-wb-feature]');
      if (feature) {
        const sourceButtons = [...document.querySelectorAll(isChart ? '#chartRoot .content-tabs button' : '.hepan-content-tabs button')];
        sourceButtons[Number(feature.dataset.wbFeature)]?.click();
        syncFeatureRail(shell);
        return;
      }
      if (event.target.closest('[data-wb-add]')) {
        window.QingshiArchiveManager?.openEditor('new=1&standalone=1');
        return;
      }
      const choose = event.target.closest('[data-wb-select]');
      if (choose) {
        localStorage.setItem('qingshiji-selected', choose.dataset.wbSelect);
        window.dispatchEvent(new CustomEvent('qingshiji-archive-selected', { detail: { id: choose.dataset.wbSelect } }));
        renderArchiveList(shell);
        return;
      }
      const edit = event.target.closest('[data-wb-edit]');
      if (edit) {
        window.QingshiArchiveManager?.openEditor(`edit=${encodeURIComponent(edit.dataset.wbEdit)}&standalone=1`);
        return;
      }
      const remove = event.target.closest('[data-wb-delete]');
      if (remove && confirm('确定删除这个档案吗？')) {
        const next = archives().filter(item => item.id !== remove.dataset.wbDelete);
        localStorage.setItem('qingshiji-archives', JSON.stringify(next));
        window.QingshiArchiveStorage?.save(next);
        if (selected() === remove.dataset.wbDelete) localStorage.removeItem('qingshiji-selected');
        shell.querySelector('.wb-archive-count').textContent = next.length;
        renderArchiveList(shell);
      }
    });

    const observer = new MutationObserver(() => {
      syncFeatureRail(shell);
      arrangeBaziBaseLayout();
      arrangeSmartInterpretation();
    });
    observer.observe(main, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });
    window.addEventListener('qingshiji-archive-selected', () => renderArchiveList(shell));
    window.addEventListener('message', () => setTimeout(() => {
      shell.querySelector('.wb-archive-count').textContent = archives().length;
      renderArchiveList(shell);
    }, 120));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
