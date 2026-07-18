(function(){
  const triggers=[...document.querySelectorAll('[data-global-archives]')];
  if(!triggers.length)return;
  const root=document.createElement('div');
  root.className='global-archive-backdrop';
  root.setAttribute('aria-hidden','true');
  root.innerHTML='<section class="global-archive-sheet" role="dialog" aria-modal="true" aria-label="档案管理"><header class="global-archive-head"><div><p class="eyebrow">ARCHIVE MANAGER</p><h2>档案管理</h2></div><button class="global-archive-close" aria-label="关闭">×</button></header><a class="global-archive-add" href="/bazi.html?new=1">＋ 添加新档案</a><div class="global-archive-list"></div></section>';
  document.body.appendChild(root);
  const list=root.querySelector('.global-archive-list');
  const archives=()=>JSON.parse(localStorage.getItem('qingshiji-archives')||'[]');
  const selected=()=>localStorage.getItem('qingshiji-selected')||'';
  const hex=g=>g==='男'?'<span class="global-hexagram qian" title="男性 · 乾三连"><i></i><i></i><i></i></span>':'<span class="global-hexagram kun" title="女性 · 坤六断"><i></i><i></i><i></i></span>';
  function render(){const items=archives(),sid=selected();list.innerHTML=items.length?items.map(x=>`<article class="global-archive-item ${x.id===sid?'selected':''}"><div class="global-archive-main"><div class="global-archive-avatar">${x.name.slice(0,1)}</div><div class="global-archive-copy"><b class="global-archive-name">${x.name}${hex(x.gender)}${x.id===sid?' · 当前':''}</b><p>${x.gender==='男'?'乾造':'坤造'} · ${x.location||''} · ${(x.solar||'').replace('T',' ')}</p></div></div><div class="global-archive-actions"><button data-select="${x.id}">选择</button><a href="/bazi.html?edit=${encodeURIComponent(x.id)}">修改</a><button class="danger" data-delete="${x.id}">删除</button></div></article>`).join(''):'<div class="global-archive-empty">暂无档案<br><small>点击上方按钮添加第一份档案</small></div>'}
  function open(){render();root.classList.add('show');root.setAttribute('aria-hidden','false')}
  function close(){root.classList.remove('show');root.setAttribute('aria-hidden','true')}
  triggers.forEach(el=>el.addEventListener('click',e=>{e.preventDefault();open()}));
  root.querySelector('.global-archive-close').onclick=close;
  root.addEventListener('click',e=>{if(e.target===root)close();const choose=e.target.closest('[data-select]');if(choose){localStorage.setItem('qingshiji-selected',choose.dataset.select);render();window.dispatchEvent(new CustomEvent('qingshiji-archive-selected',{detail:{id:choose.dataset.select}}))}const del=e.target.closest('[data-delete]');if(del&&confirm('确定删除这个档案吗？')){const next=archives().filter(x=>x.id!==del.dataset.delete);localStorage.setItem('qingshiji-archives',JSON.stringify(next));if(selected()===del.dataset.delete)localStorage.removeItem('qingshiji-selected');render()}});
  window.addEventListener('storage',render);
})();
