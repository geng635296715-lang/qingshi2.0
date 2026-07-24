(() => {
  const stems = '甲乙丙丁戊己庚辛壬癸';
  const elements = {
    甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土',
    庚: '金', 辛: '金', 壬: '水', 癸: '水',
    寅: '木', 卯: '木', 巳: '火', 午: '火', 辰: '土', 戌: '土',
    丑: '土', 未: '土', 申: '金', 酉: '金', 亥: '水', 子: '水'
  };
  const hidden = {
    子: ['癸'], 丑: ['己', '癸', '辛'], 寅: ['甲', '丙', '戊'], 卯: ['乙'],
    辰: ['戊', '乙', '癸'], 巳: ['丙', '戊', '庚'], 午: ['丁', '己'],
    未: ['己', '丁', '乙'], 申: ['庚', '壬', '戊'], 酉: ['辛'],
    戌: ['戊', '辛', '丁'], 亥: ['壬', '甲']
  };
  const personalities = {
    甲: ['正直进取，重原则与成长，喜欢先立方向再持续推进。', '给变化与他人意见留下空间，避免过度坚持单一路径。'],
    乙: ['细腻灵活，擅长观察环境与协调关系，韧性强而不喜硬碰。', '重要决定建立明确边界，避免因顾全关系而反复犹豫。'],
    丙: ['热情坦率，行动力和感染力较强，愿意主动带动周围。', '热度之外补足耐心与收尾，避免承诺推进得过快。'],
    丁: ['敏锐专注，重感受与品质，表达温和但内在判断清楚。', '减少暗自消耗，把需求与不满及时、具体地说出来。'],
    戊: ['稳重负责，重承诺与整体秩序，遇事倾向先承担再处理。', '不要把所有责任都揽在自己身上，适时释放压力。'],
    己: ['务实包容，善于整理资源、照顾细节并让事情稳定落地。', '避免顾虑过多，用期限和规则提高决断效率。'],
    庚: ['果断直接，执行力和原则感强，面对问题倾向迅速解决。', '表达判断时保留温度，先理解背景再给结论。'],
    辛: ['精致敏感，重标准、审美与分寸，擅长发现细微差异。', '降低对完美的依赖，允许关系和成果逐步成熟。'],
    壬: ['思路开阔，适应力强，善于连接信息、资源与不同的人。', '控制目标发散，选择主航道并建立稳定执行节奏。'],
    癸: ['内敛敏锐，洞察细微，善于理解情绪和隐含信息。', '避免把压力留在心里，用清晰沟通获得确定感。']
  };
  const branchTraits = {
    子: '内在反应敏捷，重信息与情绪流动', 丑: '内在谨慎耐久，习惯先积累再行动',
    寅: '内在有开创欲，面对目标愿意主动争取', 卯: '内在重关系与秩序，追求有分寸的互动',
    辰: '内在兼具理性与变通，会为长远预留余地', 巳: '内在警觉而有推动力，重效率与反馈',
    午: '内在表达直接，重体验、热度和被理解', 未: '内在温和细致，重照顾、归属与稳定',
    申: '内在机敏务实，善于迅速评估利弊', 酉: '内在标准清楚，重品质、边界与承诺',
    戌: '内在守信有防线，重责任与可靠结果', 亥: '内在包容而富想象，重精神理解与自由空间'
  };
  const roles = ['外缘与早年环境', '家庭、事业基础与执行方式', '自我核心与亲密关系', '长期规划、成果与子女缘'];
  const cls = value => ({ 木: 'wood', 火: 'fire', 土: 'earth', 金: 'metal', 水: 'water' })[elements[value]] || '';

  function tenGod(dayMaster, other) {
    const order = { 木: 0, 火: 1, 土: 2, 金: 3, 水: 4 };
    const distance = (order[elements[other]] - order[elements[dayMaster]] + 5) % 5;
    const samePolarity = stems.indexOf(dayMaster) % 2 === stems.indexOf(other) % 2;
    return [
      samePolarity ? '比肩' : '劫财',
      samePolarity ? '食神' : '伤官',
      samePolarity ? '偏财' : '正财',
      samePolarity ? '七杀' : '正官',
      samePolarity ? '偏印' : '正印'
    ][distance];
  }

  function relationLabels(pillars) {
    const result = [];
    const stemPairs = { 甲己: '甲己合化土', 乙庚: '乙庚合化金', 丙辛: '丙辛合化水', 丁壬: '丁壬合化木', 戊癸: '戊癸合化火' };
    const branchPairs = {
      子丑: '子丑相合', 寅亥: '寅亥相合', 卯戌: '卯戌相合', 辰酉: '辰酉相合', 巳申: '巳申相合', 午未: '午未相合',
      子午: '子午相冲', 丑未: '丑未相冲', 寅申: '寅申相冲', 卯酉: '卯酉相冲', 辰戌: '辰戌相冲', 巳亥: '巳亥相冲',
      子未: '子未相害', 丑午: '丑午相害', 寅巳: '寅巳相害', 卯辰: '卯辰相害', 申亥: '申亥相害', 酉戌: '酉戌相害'
    };
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
      const stemKey = [pillars[i][0], pillars[j][0]].sort((a, b) => stems.indexOf(a) - stems.indexOf(b)).join('');
      const directStem = stemPairs[stemKey] || stemPairs[[pillars[j][0], pillars[i][0]].join('')];
      if (directStem) result.push(directStem);
      const branchKey = [pillars[i][1], pillars[j][1]].join('');
      const reverseBranchKey = [pillars[j][1], pillars[i][1]].join('');
      if (branchPairs[branchKey] || branchPairs[reverseBranchKey]) result.push(branchPairs[branchKey] || branchPairs[reverseBranchKey]);
    }
    return [...new Set(result)];
  }

  function render() {
    const panel = document.querySelector('#smart');
    const chart = panel?.querySelector('.smart-chart-card');
    if (!panel || !chart) return;
    panel.querySelector('.smart-ten-analysis')?.remove();
    const lifeReading = document.querySelector('.life-domain-reading');
    const lifeReadingAnchor = panel.querySelector(':scope > .wb-smart-primary-layout') || chart;
    if (lifeReading && (lifeReading.parentElement !== panel || lifeReading.previousElementSibling !== lifeReadingAnchor)) {
      lifeReadingAnchor.after(lifeReading);
    }
    if (panel.querySelector('.smart-day-ganzhi')) return;
    const profiles = JSON.parse(localStorage.getItem('qingshiji-archives') || '[]');
    const profile = profiles.find(item => item.id === localStorage.getItem('qingshiji-selected'));
    const engine = window.QingshiBaziEngine;
    if (!profile || !engine) return;
    const pillars = engine.pillars(new Date(profile.trueSolar || profile.solar));
    const dayMaster = pillars[2][0];
    const dayBranch = pillars[2][1];
    const dayMain = hidden[dayBranch][0];
    const dayGod = tenGod(dayMaster, dayMain);
    const counts = {};
    pillars.forEach((pillar, index) => {
      const visibleGod = index === 2 ? '日主' : tenGod(dayMaster, pillar[0]);
      counts[visibleGod] = (counts[visibleGod] || 0) + 1;
      hidden[pillar[1]].forEach(stem => {
        const god = tenGod(dayMaster, stem);
        counts[god] = (counts[god] || 0) + 1;
      });
    });
    const leadingGod = Object.entries(counts).filter(([name]) => name !== '日主').sort((a, b) => b[1] - a[1])[0]?.[0] || dayGod;
    const relations = relationLabels(pillars);
    const section = document.createElement('section');
    section.className = 'section-card smart-day-ganzhi';
    section.innerHTML = `
      <div class="section-head"><h2>日柱性格 · ${dayMaster}${dayBranch}</h2><small>日干为表 · 日支为里</small></div>
      <p class="smart-reference-tip">以日干观察核心表达，以日支及藏干观察内在反应与亲密关系模式，再回到四柱位置和原局关系验证。</p>
      <div class="day-personality-result">
        <div class="day-pillar-seal"><span class="${cls(dayMaster)}">${dayMaster}</span><span class="${cls(dayBranch)}">${dayBranch}</span><small>${elements[dayMaster]}坐${elements[dayBranch]}</small></div>
        <div class="day-personality-copy">
          <b>${dayMaster}日主性格</b>
          <p>${personalities[dayMaster][0]}${branchTraits[dayBranch]}；日支本气${dayMain}为${dayGod}，在亲近关系和真实压力下，更容易以“${dayGod}”的方式回应。</p>
          <dl><div><dt>优势表现</dt><dd>${personalities[dayMaster][0]}</dd></div><div><dt>调整建议</dt><dd>${personalities[dayMaster][1]}</dd></div></dl>
        </div>
      </div>
      <div class="section-head smart-ganzhi-head"><h2>八字天干地支分析</h2><small>四柱定位 · 逐柱验证</small></div>
      <div class="smart-ganzhi-grid">${pillars.map((pillar, index) => {
        const visibleGod = index === 2 ? '日主' : tenGod(dayMaster, pillar[0]);
        const branchHidden = hidden[pillar[1]];
        const branchGod = tenGod(dayMaster, branchHidden[0]);
        return `<article>
          <header><span>${['年柱', '月柱', '日柱', '时柱'][index]}</span><small>${roles[index]}</small></header>
          <div class="ganzhi-pair"><b class="${cls(pillar[0])}">${pillar[0]}</b><b class="${cls(pillar[1])}">${pillar[1]}</b></div>
          <p><strong>天干 · ${visibleGod}</strong>${index === 2 ? '代表命主主动表达与核心选择。' : `外显多以${visibleGod}方式处理事务。`}</p>
          <p><strong>地支 · ${branchHidden[0]}·${branchGod}</strong>${branchTraits[pillar[1]]}；藏干${branchHidden.map(stem => `${stem}·${tenGod(dayMaster, stem)}`).join('、')}。</p>
        </article>`;
      }).join('')}</div>
      <div class="smart-ganzhi-verdict">
        <div><small>原局关系</small><p>${relations.length ? relations.join('、') : '未见明显天干相合或地支合冲害关系'}</p></div>
        <div><small>综合落点</small><p>命局反复出现的十神主题以“${leadingGod}”较突出。以日柱${dayMaster}${dayBranch}为性格核心，以月柱验证现实执行，再由年、时柱补充环境与长期结果；关系项表示作用方式，不直接等同吉凶。</p></div>
      </div>`;
    (lifeReading || chart).after(section);
  }

  const boot = () => {
    render();
    requestAnimationFrame(render);
    setTimeout(render, 120);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  window.addEventListener('qingshiji-archive-selected', () => requestAnimationFrame(render));
})();
