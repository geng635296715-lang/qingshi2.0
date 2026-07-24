(() => {
  if (!location.pathname.endsWith('/liuyao.html')) return;

  const methodNames = {
    auto: ['系统摇卦', '三钱六掷'],
    manual: ['手动起卦', '录入六爻'],
    direct: ['直接排盘', '已知卦象'],
    library: ['六十四卦', '卦象全解']
  };
  const savedCasts = () => {
    try {
      const value = JSON.parse(localStorage.getItem('qingshiji-liuyao-casts') || '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  };
  const miniLines = item => (item?.base?.lines_bottom_up || []).map(yang => `<i class="${yang ? '' : 'yin'}"></i>`).join('');

  function renderNotes(shell) {
    const host = shell.querySelector('.ly-wb-note-list');
    const count = shell.querySelector('.ly-wb-note-count');
    if (!host || !count) return;
    const items = savedCasts();
    count.textContent = items.length;
    host.innerHTML = items.length ? items.map((item, index) => `
      <article class="ly-wb-note-row">
        <button type="button" class="ly-wb-note" data-ly-note="${index}">
          <span class="ly-wb-note-lines">${miniLines(item)}</span>
          <span><b>${item.question || '未命名所问'}</b><small>${item.base?.full_name || '卦象待定'} · ${item.changed?.full_name || '无变卦'}</small></span>
          <time>${item.createdAt ? new Date(item.createdAt).toLocaleDateString('zh-CN') : ''}</time>
        </button>
        <button type="button" class="ly-wb-note-delete" data-ly-note-delete="${index}" aria-label="删除此卜卦笔记" title="删除笔记">×</button>
      </article>`).join('') : '<div class="ly-wb-note-empty"><b>暂无卜卦笔记</b><small>排卦完成后点击“存入卦记”，即可在这里回看。</small></div>';
  }

  function syncMethod(shell, method) {
    const [title, subtitle] = methodNames[method] || methodNames.auto;
    const libraryMode = method === 'library';
    shell.classList.toggle('is-library-mode', libraryMode);
    shell.querySelectorAll('[data-ly-feature]').forEach(button => button.classList.toggle('active', button.dataset.lyFeature === method));
    shell.querySelector('.ly-wb-method-head b').textContent = title;
    shell.querySelector('.ly-wb-method-head small').textContent = subtitle;
    shell.querySelector('.ly-wb-reading-head h2').textContent = libraryMode ? '六十四卦 · 卦象详解' : '卦象解读';
    shell.querySelector('.ly-wb-reading-head>span').textContent = libraryMode ? '易经卦序 · 六章参详' : '排卦结果 · 卦象详解';
    shell.querySelector('.ly-wb-reading-empty').hidden = libraryMode || !document.querySelector('#result')?.hidden;
  }

  function mount() {
    const main = document.querySelector('.liuyao-main');
    const ask = main?.querySelector('.ask-card');
    const method = main?.querySelector('.method-wrap');
    const result = main?.querySelector('#result');
    if (!main || !ask || !method || !result || main.querySelector('.ly-web-workbench')) return;

    main.classList.add('has-ly-workbench');
    const shell = document.createElement('section');
    shell.className = 'ly-web-workbench';
    shell.innerHTML = `
      <aside class="ly-wb-pane ly-wb-feature-pane">
        <header><small>LIU YAO DIVINATION</small><h2>六爻占卜</h2></header>
        <nav aria-label="六爻功能切换">
          ${Object.entries(methodNames).map(([id, value], index) => `<button type="button" class="${index ? '' : 'active'}" data-ly-feature="${id}"><span><b>${value[0]}</b><small>${value[1]}</small></span><i>›</i></button>`).join('')}
        </nav>
        <footer><span>六爻工作台</span><small>选择起卦方式，在中间区域完成排卦与参详。</small></footer>
      </aside>
      <aside class="ly-wb-controls">
        <section class="ly-wb-control-card ly-wb-question-card"><header><div><small>QUESTION</small><b>所问之事</b></div></header><div class="ly-wb-question-host"></div></section>
        <section class="ly-wb-control-card ly-wb-method-card"><header class="ly-wb-method-head"><div><small>CASTING METHOD</small><b>系统摇卦</b></div><small>三钱六掷</small></header><div class="ly-wb-method-host"></div></section>
        <section class="ly-wb-control-card ly-wb-notes-card"><header><div><small>DIVINATION NOTES</small><b>卜卦笔记</b></div><em class="ly-wb-note-count">0</em></header><div class="ly-wb-note-list"></div></section>
        <button type="button" class="ly-wb-cast-action"><b>起卦</b><small>起卦并存入卦记</small></button>
      </aside>
      <section class="ly-wb-reading">
        <header class="ly-wb-reading-head"><div><small>HEXAGRAM READING</small><h2>卦象解读</h2></div><span>排卦结果 · 卦象详解</span></header>
        <div class="ly-wb-reading-empty"><i>☷</i><b>尚未形成卦象</b><p>在左侧选择起卦方式，填写所问之事并完成排卦后，此处将呈现排卦结果与六章卦象详解。</p></div>
        <div class="ly-wb-library-host"></div>
        <div class="ly-wb-result-host"></div>
      </section>
      <aside class="ly-wb-pane ly-wb-ai-pane">
        <header><i>AI</i><div><h2>AI 命理师</h2><small>即时参详 · 暂未开放</small></div><span></span></header>
        <div class="ly-wb-ai-chat"><time>今天</time><p>你好，我是青筮问道 AI 命理师。未来可结合所问之事、本卦、变卦与动爻，为你梳理解卦重点。</p><div><span>卦意解读</span><span>动爻参详</span><span>决策问答</span></div></div>
        <div class="ly-wb-ai-input"><textarea disabled placeholder="AI 命理师暂未开放"></textarea><button disabled>↑</button></div>
        <small class="ly-wb-ai-note">AI 内容仅作传统文化研究参考</small>
      </aside>`;
    method.before(shell);
    shell.querySelector('.ly-wb-question-host').appendChild(ask);
    shell.querySelector('.ly-wb-method-host').appendChild(method);
    shell.querySelector('.ly-wb-library-host').appendChild(method.querySelector('[data-panel="library"]'));
    shell.querySelector('.ly-wb-result-host').appendChild(result);
    renderNotes(shell);
    syncMethod(shell, document.querySelector('.method-tabs [data-method].active')?.dataset.method || 'auto');
    let saveAfterCast = false;

    shell.addEventListener('click', event => {
      const remove = event.target.closest('[data-ly-note-delete]');
      if (remove) {
        const items = savedCasts();
        items.splice(Number(remove.dataset.lyNoteDelete), 1);
        localStorage.setItem('qingshiji-liuyao-casts', JSON.stringify(items));
        renderNotes(shell);
        return;
      }
      const feature = event.target.closest('[data-ly-feature]');
      if (feature) {
        const source = document.querySelector(`.method-tabs [data-method="${feature.dataset.lyFeature}"]`);
        source?.click();
        syncMethod(shell, feature.dataset.lyFeature);
        return;
      }
      const castAction = event.target.closest('.ly-wb-cast-action');
      if (castAction) {
        const activeMethod = document.querySelector('.method-tabs [data-method].active')?.dataset.method || 'auto';
        const source = document.querySelector(`#${activeMethod === 'auto' ? 'autoCast' : activeMethod === 'manual' ? 'manualCast' : 'directCast'}`);
        if (!document.querySelector('#question')?.value.trim()) {
          source?.click();
          return;
        }
        saveAfterCast = true;
        castAction.disabled = true;
        castAction.classList.add('is-casting');
        source?.click();
        if (activeMethod !== 'auto') {
          setTimeout(() => {
            if (!saveAfterCast) return;
            saveAfterCast = false;
            castAction.disabled = false;
            castAction.classList.remove('is-casting');
          }, 250);
        }
        return;
      }
      const note = event.target.closest('[data-ly-note]');
      if (note) {
        const item = savedCasts()[Number(note.dataset.lyNote)];
        window.QingshiLiuyaoWorkbench?.restoreCast(item);
        syncMethod(shell, document.querySelector('.method-tabs [data-method].active')?.dataset.method || 'auto');
      }
    });
    document.addEventListener('qingshi:liuyao-rendered', () => {
      if (!saveAfterCast) return;
      saveAfterCast = false;
      document.querySelector('#saveCast')?.click();
      const castAction = shell.querySelector('.ly-wb-cast-action');
      castAction.disabled = false;
      castAction.classList.remove('is-casting');
      renderNotes(shell);
    });
    document.querySelector('#saveCast')?.addEventListener('click', () => queueMicrotask(() => renderNotes(shell)));
    document.querySelectorAll('.method-tabs [data-method]').forEach(button => button.addEventListener('click', () => syncMethod(shell, button.dataset.method)));
    new MutationObserver(() => {
      const libraryMode = shell.classList.contains('is-library-mode');
      shell.querySelector('.ly-wb-reading-empty').hidden = libraryMode || !result.hidden;
    }).observe(result, { attributes: true, attributeFilter: ['hidden'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
