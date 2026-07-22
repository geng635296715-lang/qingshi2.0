const state={hexagrams:[],readings:[],details:[],lookup:new Map(),current:null};
const $=selector=>document.querySelector(selector);
const lineNames=['初爻','二爻','三爻','四爻','五爻','上爻'];
const showNihaixiaChapter=false;

function lineOption(value,label){return `<option value="${value}">${value} · ${label}</option>`}
function setupControls(){
  $('#manualGrid').innerHTML=lineNames.map((name,index)=>({name,index})).reverse().map(({name,index})=>`<label><span>${name}</span><i class="manual-line-symbol yang" aria-hidden="true"></i><select data-manual-line="${index}" aria-label="${name}铜钱合数">${lineOption(7,'少阳 ⚊')}${lineOption(8,'少阴 ⚋')}${lineOption(9,'老阳 ⚊ 动')}${lineOption(6,'老阴 ⚋ 动')}</select></label>`).join('');
  $('#manualGrid').addEventListener('change',event=>{const select=event.target.closest('[data-manual-line]');if(!select)return;const symbol=select.closest('label').querySelector('.manual-line-symbol');const value=Number(select.value);symbol.className=`manual-line-symbol ${value===7||value===9?'yang':'yin'} ${value===6||value===9?'moving':''}`});
  $('#movingChecks').innerHTML=lineNames.map((name,index)=>`<label><input type="checkbox" value="${index}">${name}</label>`).join('');
}

async function loadData(){
  const [hexagrams,readings,details]=await Promise.all([fetch('./api/liuyao-hexagrams.json').then(r=>r.json()),fetch('./api/liuyao-readings.json').then(r=>r.json()),fetch('./api/liuyao-details.json').then(r=>r.json())]);
  state.hexagrams=hexagrams;state.readings=readings;state.details=details;
  hexagrams.forEach(item=>state.lookup.set(item.lines_bottom_up.join(''),item));
  $('#directHexagram').innerHTML='<option value="">请选择本卦</option>'+hexagrams.map(item=>`<option value="${item.king_wen_no}">${item.king_wen_no}. ${item.full_name}</option>`).join('');
  renderHexagramLibrary(hexagrams);
}

function renderHexagramLibrary(items){
  $('#hexagramGrid').innerHTML=items.length?items.map(item=>`<button class="hexagram-tile" data-hexagram-no="${item.king_wen_no}"><span>第 ${item.king_wen_no} 卦</span><b>${item.name}</b><em>上${item.upper_trigram}下${item.lower_trigram}</em><small>${item.full_name}</small></button>`).join(''):'<p class="library-empty">未找到对应卦象</p>';
}

function showHexagramDetail(no){
  const hexagram=state.hexagrams.find(item=>item.king_wen_no===Number(no));
  const reading=readingFor(hexagram?.king_wen_no);
  if(!hexagram)return;
  document.querySelectorAll('.hexagram-tile').forEach(tile=>tile.classList.toggle('active',Number(tile.dataset.hexagramNo)===hexagram.king_wen_no));
  $('#detailNo').textContent=`第 ${hexagram.king_wen_no} 卦`;
  $('#detailName').textContent=hexagram.full_name;
  $('#detailMeta').textContent=`${hexagram.palace}宫 · ${hexagram.palace_element} · ${hexagram.palace_stage} · 世${hexagram.shi_line}应${hexagram.ying_line}`;
  $('#detailLines').innerHTML=hexagram.lines_bottom_up.map(yang=>`<i class="${yang?'yang':'yin'}"></i>`).join('');
  $('#detailSituation').textContent=reading?.core?.situation||'审时观象';
  $('#detailPrinciple').textContent=reading?.core?.principle||'随时位进退';
  $('#detailRisk').textContent=reading?.core?.risk||'执一失变';
  $('#detailReading').textContent=reading?.readings?.大象||'数据库暂无卦象摘要。';
  $('#hexagramDetail').dataset.hexagramNo=hexagram.king_wen_no;
  $('#hexagramDetail').hidden=false;
  updateHexagramDetails(hexagram.king_wen_no,{name:'#libraryExplainGuaName',sections:'#libraryExplainSections',traditional:'#libraryTraditionalExplain'});
  $('#libraryHexagramExplain').hidden=false;
}

function randomCoinLine(){let total=0;const faces=[];for(let i=0;i<3;i++){const front=Math.random()<.5;faces.push(front);total+=front?3:2}state.lastCoinFaces=faces;return total}
function updateCoinFaces(faces=[true,true,true]){document.querySelectorAll('.coin-stage span').forEach((coin,index)=>{coin.classList.toggle('coin-front',faces[index]!==false);coin.classList.toggle('coin-back',faces[index]===false)})}
function setupCastProgress(){
  $('#castLines').innerHTML=lineNames.map((name,index)=>`<div class="cast-line" data-cast-line="${index}"><small>${name}</small><i class="cast-line-mark"></i><b>待掷</b></div>`).join('');
}
function castValueLabel(value){return ({6:'老阴 · 动',7:'少阳 · 静',8:'少阴 · 静',9:'老阳 · 动'})[value]||'待掷'}
function drawCastLine(index,value){const slot=document.querySelector(`[data-cast-line="${index}"]`);if(!slot)return;slot.classList.add('drawn');slot.querySelector('.cast-line-mark').className=`cast-line-mark ${value===7||value===9?'yang':'yin'} ${value===6||value===9?'moving':''}`;slot.querySelector('b').textContent=castValueLabel(value);}
function resetCastProgress(){document.querySelectorAll('.cast-line').forEach(slot=>{slot.classList.remove('drawn');slot.querySelector('.cast-line-mark').className='cast-line-mark';slot.querySelector('b').textContent='待掷'});$('#castStatus').textContent='静心定问 · 准备摇卦';$('#castRound').textContent='0 / 6'}
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function runAutoCast(){
  if(state.autoRunning)return;state.autoRunning=true;const panel=$('[data-panel="auto"]');const button=$('#autoCast');const values=[];resetCastProgress();panel.classList.add('casting');button.disabled=true;
  try{for(let index=0;index<6;index++){const value=randomCoinLine();updateCoinFaces(state.lastCoinFaces);$('#castStatus').textContent=`第${index+1}掷 · ${state.lastCoinFaces.map(face=>face?'正':'背').join(' · ')}`;$('#castRound').textContent=`${index} / 6`;await wait(620);drawCastLine(index,value);$('#castStatus').textContent=`${lineNames[index]}：${castValueLabel(value)}`;$('#castRound').textContent=`${index+1} / 6`;values.push(value);await wait(280)}$('#castStatus').textContent='六爻已成 · 正在排卦';await wait(350);render(values)}finally{panel.classList.remove('casting');button.disabled=false;state.autoRunning=false}}
function fromHexagram(hexagram,moving=[]){return hexagram.lines_bottom_up.map((yang,index)=>moving.includes(index)?(yang?9:6):(yang?7:8))}
function bitsFromValues(values){return values.map(value=>value===7||value===9?1:0)}
function changedBits(values){return values.map(value=>value===9?0:value===6?1:(value===7?1:0))}
function findHexagram(bits){return state.lookup.get(bits.join(''))}
function readingFor(no){return state.readings.find(item=>item.hexagram_no===no)}
function detailFor(no){return state.details.find(item=>item.hexagram_no===no)}

function renderNihaixiaSection(item,fullName){
  const title='倪海厦64卦图解';
  if(!item?.available)return `<section class="explain-section nihaixia-section"><header><span><h4>${title}</h4></span></header><div class="explain-content"><div class="nihaixia-missing"><b>当前资料未收录此卦</b><p>所提供的《倪师卦图象解》PDF仅收录第1至第19卦，暂无“${fullName}”的卦图与象解。</p></div></div></section>`;
  return `<section class="explain-section nihaixia-section"><header><span><h4>${title}</h4></span></header><div class="explain-content"><div class="nihaixia-layout"><figure><img src="${item.image_url}" alt="${fullName}卦图象解" loading="lazy"><figcaption>${fullName} · 卦图象解</figcaption></figure><div class="nihaixia-copy">${(item.explanations||[]).map(text=>`<p>${text}</p>`).join('')}</div></div></div></section>`;
}

function buildLines(container,bits,values){
  container.innerHTML=bits.map((yang,index)=>`<div class="line-row ${values&&[6,9].includes(values[index])?'moving':''}"><small>${index+1}</small><span class="line-mark ${yang?'yang':'yin'}"><i></i></span><b>${values?[6,7,8,9][[6,7,8,9].indexOf(values[index])]||'':''}</b></div>`).join('');
}

function render(values){
  const base=findHexagram(bitsFromValues(values));
  const changed=findHexagram(changedBits(values));
  if(!base||!changed){alert('卦象数据未匹配，请重新起卦。');return}
  const moving=values.map((v,i)=>[6,9].includes(v)?i+1:null).filter(Boolean);
  const reading=readingFor(base.king_wen_no);
  state.current={question:$('#question').value.trim()||'心中所问',values,base,changed,moving,focus:'changed',createdAt:new Date().toISOString()};
  $('#resultQuestion').textContent=state.current.question;
  $('#baseName').textContent=base.full_name;$('#baseMeta').textContent=`${base.palace}宫 · ${base.palace_element} · ${base.palace_stage}`;
  $('#changedName').textContent=changed.full_name;$('#changedMeta').textContent=`${changed.palace}宫 · ${changed.palace_element} · ${changed.palace_stage}`;
  $('#movingLabel').textContent=moving.length?`${moving.map(i=>lineNames[i-1]).join('、')}动`:'六爻安静';
  buildLines($('#baseLines'),base.lines_bottom_up,values);buildLines($('#changedLines'),changed.lines_bottom_up);
  const byNo=no=>state.hexagrams.find(item=>item.king_wen_no===no);
  $('#relations').innerHTML=`<div><span>世应</span><b>世${base.shi_line} · 应${base.ying_line}</b></div><div><span>互卦</span><b>${byNo(base.mutual_no)?.name||'—'}</b></div><div><span>错 / 综</span><b>${byNo(base.opposite_no)?.name||'—'} · ${byNo(base.reversed_no)?.name||'—'}</b></div>`;
  updateFocusReading();
  $('#result').hidden=false;$('#result').scrollIntoView({behavior:'smooth',block:'start'});
}

function updateReading(reading=readingFor(state.current?.base?.king_wen_no)){$('#readingText').textContent=reading?.readings?.[$('#readingCategory').value]||'数据库暂无此项参详。'}
function updateFocusReading(){
  if(!state.current)return;
  const focus=state.current.focus==='changed'?state.current.changed:state.current.base;
  const reading=readingFor(focus.king_wen_no);
  document.querySelectorAll('[data-focus]').forEach(button=>button.classList.toggle('active',button.dataset.focus===state.current.focus));
  $('#situation').textContent=reading?.core?.situation||`${focus.full_name}之象`;
  $('#principle').textContent=reading?`参详主线：${reading.core.principle}`:'宜结合所问之事，审时察变。';
  $('#risk').textContent=reading?.core?.risk||'执一不变，忽略时位';
  $('#focusMiniLines').innerHTML=focus.lines_bottom_up.map(yang=>`<i class="${yang?'yang':'yin'}"></i>`).join('');
  $('#focusGuaName').textContent=focus.full_name;
  $('#focusGuaFormation').textContent=`上${focus.upper_trigram}下${focus.lower_trigram}`;
  updateReading(reading);
  updateHexagramDetails(focus.king_wen_no);
}
function updateHexagramDetails(no,targets={name:'#explainGuaName',sections:'#explainSections',traditional:'#traditionalExplain'}){
  const detail=detailFor(no);if(!detail)return;
  $(targets.name).textContent=detail.full_name;
  const original={...detail.guaci,text:detail.guaci.text,plain_text:detail.guaci.plain_text,lines:detail.lines||[]};
  const xiang={...detail.xiang,plain_text:detail.xiang.plain_text};
  const renderBlock=item=>`<section class="explain-section"><header><span><h4>${item.title}</h4></span></header><div class="explain-content"><p class="explain-main">${item.text}</p>${item.plain_text?`<div class="plain-reading"><small>白话文解释</small><p>${item.plain_text}</p></div>`:''}${item.lines?.length?`<details class="line-commentaries"><summary><span><b>六爻爻辞</b><small>初爻至上爻 · 点击展开</small></span><i aria-hidden="true"></i></summary><div class="line-commentary-list">${item.lines.map(line=>`<article><h5>${line.label}爻辞</h5><p class="line-original">${line.line_text.replace(/[：:，,]/,'。')}<br>象曰：${line.xiang_text.replace(/^.*?[：:]/,'')}</p><div class="line-plain"><b>白话文解释</b><p>${line.plain_text}</p><p>${line.xiang_plain_text}</p></div></article>`).join('')}</div></details>`:''}</div></section>`;
  const nihaixiaChapter=showNihaixiaChapter?renderNihaixiaSection(detail.nihaixia,detail.full_name):'';
  $(targets.sections).innerHTML=[original,xiang].map(renderBlock).join('')+nihaixiaChapter+[detail.duanyi,detail.shaoyong,detail.fupeirong].map(renderBlock).join('');
  const traditional=detail.traditional||{};const readings=traditional.readings||{};
  $(targets.traditional).innerHTML=`<section class="explain-section traditional"><header><span><h4>${traditional.title||'传统解卦'}</h4></span></header><div class="explain-content"><p class="explain-main">${traditional.summary||''}</p><div class="traditional-grid">${Object.entries(readings).map(([name,text])=>`<div><b>${name}</b><p>${text}</p></div>`).join('')}</div></div></section>`;
}
function validateQuestion(){if(!$('#question').value.trim()){alert('请先写下所问之事，再起卦。');$('#question').focus();return false}return true}

document.querySelectorAll('[data-method]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('[data-method]').forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-selected',String(active))});
  document.querySelectorAll('[data-panel]').forEach(panel=>{const active=panel.dataset.panel===button.dataset.method;panel.classList.toggle('active',active);panel.hidden=!active});
  $('#result').hidden=button.dataset.method==='library'||!state.current;
}));

$('#autoCast').addEventListener('click',()=>{if(validateQuestion())runAutoCast()});
$('#manualCast').addEventListener('click',()=>{if(!validateQuestion())return;const values=Array(6);document.querySelectorAll('[data-manual-line]').forEach(select=>{values[Number(select.dataset.manualLine)]=Number(select.value)});render(values)});
$('#directCast').addEventListener('click',()=>{if(!validateQuestion())return;const selected=state.hexagrams.find(item=>item.king_wen_no===Number($('#directHexagram').value));if(!selected){alert('请选择本卦。');return}const moving=[...$('#movingChecks').querySelectorAll('input:checked')].map(item=>Number(item.value));render(fromHexagram(selected,moving))});
$('#readingCategory').addEventListener('change',()=>state.current?updateFocusReading():updateReading());
document.querySelectorAll('[data-focus]').forEach(button=>button.addEventListener('click',()=>{if(!state.current)return;state.current.focus=button.dataset.focus;updateFocusReading()}));
$('#newCast').addEventListener('click',()=>{state.current=null;$('#result').hidden=true;window.scrollTo({top:0,behavior:'smooth'})});
$('#saveCast').addEventListener('click',()=>{if(!state.current)return;const items=JSON.parse(localStorage.getItem('qingshiji-liuyao-casts')||'[]');items.unshift(state.current);localStorage.setItem('qingshiji-liuyao-casts',JSON.stringify(items.slice(0,30)));$('#saveCast').textContent='已存卦记'});
$('#historyLink').addEventListener('click',event=>{event.preventDefault();const items=JSON.parse(localStorage.getItem('qingshiji-liuyao-casts')||'[]');alert(items.length?`已保存 ${items.length} 卦\n最近：${items[0].question} · ${items[0].base.full_name}`:'暂无已保存的卦记。')});
$('#hexagramSearch').addEventListener('input',event=>{const term=event.target.value.trim().replace(/\s+/g,'');renderHexagramLibrary(state.hexagrams.filter(item=>{const formation=`上${item.upper_trigram}下${item.lower_trigram}`;return !term||String(item.king_wen_no)===term||item.name.includes(term)||item.full_name.includes(term)||item.palace.includes(term)||formation.includes(term)}))});
$('#hexagramGrid').addEventListener('click',event=>{const tile=event.target.closest('[data-hexagram-no]');if(tile)showHexagramDetail(tile.dataset.hexagramNo)});

setupControls();
setupCastProgress();
const now=new Date();$('#todayText').textContent=new Intl.DateTimeFormat('zh-CN',{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(now);
loadData().catch(()=>{alert('六爻数据库载入失败，请刷新页面重试。');$('#directHexagram').innerHTML='<option>载入失败</option>'});
