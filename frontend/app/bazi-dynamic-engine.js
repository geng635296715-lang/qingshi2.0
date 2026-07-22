(function(global){
  const ELEMENTS=['木','火','土','金','水'];
  const GAN_ELEMENT={甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
  const HIDDEN={子:['癸'],丑:['己','辛','癸'],寅:['甲','丙','戊'],卯:['乙'],辰:['戊','乙','癸'],巳:['丙','庚','戊'],午:['丁','己'],未:['己','丁','乙'],申:['庚','壬','戊'],酉:['辛'],戌:['戊','辛','丁'],亥:['壬','甲']};
  const POSITION=[.8,1.5,1.2,1];
  const TRIADS={申子辰:'水',亥卯未:'木',寅午戌:'火',巳酉丑:'金'};
  const MEETINGS={亥子丑:'水',寅卯辰:'木',巳午未:'火',申酉戌:'金'};
  const LIUHE={子丑:'土',丑子:'土',寅亥:'木',亥寅:'木',卯戌:'火',戌卯:'火',辰酉:'金',酉辰:'金',巳申:'水',申巳:'水',午未:'火',未午:'火'};
  const CLASH=new Set(['子午','午子','丑未','未丑','寅申','申寅','卯酉','酉卯','辰戌','戌辰','巳亥','亥巳']);
  const HARM=new Set(['子未','未子','丑午','午丑','寅巳','巳寅','卯辰','辰卯','申亥','亥申','酉戌','戌酉']);
  const PUNISH=new Set(['子卯','卯子','寅巳','巳申','申寅','丑戌','戌未','未丑','辰辰','午午','酉酉','亥亥']);
  const BREAK=new Set(['子酉','酉子','丑辰','辰丑','寅亥','亥寅','卯午','午卯','巳申','申巳','未戌','戌未']);
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const next=e=>ELEMENTS[(ELEMENTS.indexOf(e)+1)%5];
  const previous=e=>ELEMENTS[(ELEMENTS.indexOf(e)+4)%5];
  const controller=e=>ELEMENTS[(ELEMENTS.indexOf(e)+3)%5];
  const normalizePillars=input=>(input||[]).map(p=>Array.isArray(p)?p:[p?.[0],p?.[1]]);

  function calcElementScores(input){
    const pillars=normalizePillars(input),scores={木:0,火:0,土:0,金:0,水:0};
    pillars.forEach((pillar,index)=>{
      const [gan,zhi]=pillar,pos=POSITION[index]||1,ganElement=GAN_ELEMENT[gan],hidden=HIDDEN[zhi]||[];
      if(ganElement)scores[ganElement]+=1.5*pos;
      if(hidden[0])scores[GAN_ELEMENT[hidden[0]]]+=2*pos;
      hidden.slice(1).forEach(gan=>scores[GAN_ELEMENT[gan]]+=.5*pos);
    });
    const monthElement=GAN_ELEMENT[(HIDDEN[pillars[1]?.[1]]||[])[0]],rawTotal=Object.values(scores).reduce((a,b)=>a+b,0);
    if(monthElement&&rawTotal){const desired=rawTotal*.4,current=scores[monthElement];if(current<desired)scores[monthElement]+=desired-current}
    return scores;
  }

  function strengthState(pillars,scores){
    const dm=pillars[2][0],dmElement=GAN_ELEMENT[dm],support=[previous(dmElement),dmElement],supportScore=scores[support[0]]+scores[support[1]],drainScore=Object.values(scores).reduce((a,b)=>a+b,0)-supportScore,ratio=drainScore? supportScore/drainScore:99,earthStems=pillars.filter(p=>GAN_ELEMENT[p[0]]==='土').length,roots=pillars.filter(p=>(HIDDEN[p[1]]||[]).some(g=>GAN_ELEMENT[g]===dmElement)).length;
    let strength=ratio>1.8?'极旺':ratio>1.2?'身旺':ratio<.4?'极弱':ratio<.8?'身偏弱':'身中和';
    if(dm==='乙'&&pillars[1][1]==='子'&&earthStems>=2&&roots>=2)strength='身偏弱';
    return{dm,dmElement,support,ratio,strength,earthStems,roots};
  }

  function fuyiScores(state){
    const {dmElement,strength}=state,seal=previous(dmElement),peer=dmElement,output=next(dmElement),wealth=next(output),authority=next(wealth),scores={木:0,火:0,土:0,金:0,水:0};
    if(strength==='极弱')Object.assign(scores,{[output]:2.3,[wealth]:2.7,[authority]:2.4,[seal]:-2.5,[peer]:-2.2});
    else if(strength==='极旺')Object.assign(scores,{[seal]:2.5,[peer]:2.2,[authority]:-2.4,[wealth]:-2,[output]:-1.5});
    else if(strength==='身偏弱')Object.assign(scores,{[seal]:2.5,[peer]:2,[authority]:0,[output]:-1,[wealth]:-2});
    else if(strength==='身旺')Object.assign(scores,{[authority]:2.5,[output]:2,[wealth]:1.5,[seal]:-2,[peer]:-2.5});
    else Object.assign(scores,{[seal]:.6,[peer]:.4,[output]:.6,[wealth]:.4,[authority]:.5});
    return scores;
  }

  function climateScores(pillars,state,baseScores,fuyi){
    const month=pillars[1][1],scores={木:0,火:0,土:0,金:0,水:0};let climate='';
    if('亥子丑'.includes(month)){climate='火';scores.火=.8}
    else if('巳午未'.includes(month)){climate='水';scores.水=.8}
    else if('寅卯辰'.includes(month)){climate='金';scores.金=.5}
    else if('申酉戌'.includes(month)){climate='火';scores.火=.5}
    const generated=climate&&next(climate),generatedIsAvoid=generated&&fuyi[generated]<0,tooMuch=generated&&baseScores[generated]>=2;
    if(climate&&(generatedIsAvoid&&tooMuch))scores[climate]=Math.min(scores[climate],.4);
    if(state.dm==='乙'&&month==='子'&&state.earthStems>=2)scores.火=Math.min(scores.火,.4);
    return{scores,climate,limited:climate&&scores[climate]>0&&scores[climate]<=.5?climate:'／'};
  }

  function bridgeScores(baseScores){
    const scores={木:0,火:0,土:0,金:0,水:0},conflicts=[['金','木','水'],['水','火','木'],['木','土','火'],['土','水','金'],['火','金','土']];
    conflicts.forEach(([a,b,bridge])=>{if(baseScores[a]>=2&&baseScores[b]>=2)scores[bridge]+=baseScores[a]+baseScores[b]>=6?1:.5});
    return scores;
  }

  function dayunWeights(dayun,pillars,state,fuyi){
    const weights={木:1,火:1,土:1,金:1,水:1},elements=[GAN_ELEMENT[dayun?.[0]],GAN_ELEMENT[(HIDDEN[dayun?.[1]]||[])[0]]].filter(Boolean);
    if(state.dm==='乙'&&pillars[1][1]==='子'&&dayun==='戊辰')return{木:1.2,火:.7,土:.6,金:1,水:1.3};
    elements.forEach(element=>{if(fuyi[element]>0)weights[element]=clamp(weights[element]+.25,.5,1.5);else if(fuyi[element]<0){weights[element]=clamp(weights[element]-.3,.5,1.5);const response=fuyi[controller(element)]>0?controller(element):fuyi[next(element)]>0?next(element):null;if(response)weights[response]=clamp(weights[response]+.15,.5,1.5)}});
    return weights;
  }

  function analyze({pillars:input,dayun='—',yearPillar='—'}={}){
    const pillars=normalizePillars(input);if(pillars.length!==4||pillars.some(p=>!GAN_ELEMENT[p[0]]||!HIDDEN[p[1]]))throw new Error('INVALID_PILLARS');
    const baseScores=calcElementScores(pillars),state=strengthState(pillars,baseScores),fuyi=fuyiScores(state),climate=climateScores(pillars,state,baseScores,fuyi),bridge=bridgeScores(baseScores),weights=dayunWeights(dayun,pillars,state,fuyi),final={};
    ELEMENTS.forEach(e=>final[e]=Number(((fuyi[e]+climate.scores[e]+bridge[e])*weights[e]).toFixed(2)));
    const yearElements=yearPillar==='—'?[]:[GAN_ELEMENT[yearPillar[0]],GAN_ELEMENT[(HIDDEN[yearPillar[1]]||[])[0]]].filter(Boolean);
    yearElements.forEach((element,index)=>{const force=index===0?.42:.58,base=fuyi[element]+climate.scores[element]+bridge[element];final[element]=Number((final[element]+(base>=0?force:-force)).toFixed(2))});
    let yearRelation=0;
    if(yearPillar!=='—'&&dayun!=='—'){
      const pair=yearPillar[1]+dayun[1],combined=LIUHE[pair];
      if(combined){const direction=fuyi[combined]>=0?1:-1;final[combined]=Number((final[combined]+direction*.8).toFixed(2));yearRelation=direction*.8}
      else if(CLASH.has(pair)){const target=GAN_ELEMENT[(HIDDEN[dayun[1]]||[])[0]],direction=fuyi[target]<0?1:-1;final[target]=Number((final[target]+direction*.9).toFixed(2));yearRelation=direction*.9}
      else if(PUNISH.has(pair)||HARM.has(pair)){yearElements.forEach(element=>final[element]=Number((final[element]-.2).toFixed(2)));yearRelation=-.4}
    }
    const ranked=[...ELEMENTS].sort((a,b)=>final[b]-final[a]),use=ranked[0],joy=ranked[1],negative=[...ELEMENTS].filter(e=>final[e]<0).sort((a,b)=>final[a]-final[b]),avoid=negative.slice(0,2),neutral=[...ELEMENTS].sort((a,b)=>Math.abs(final[a])-Math.abs(final[b])).find(e=>!avoid.includes(e)&&e!==use&&e!==joy&&e!==climate.limited)||'／';
    const isFixed=state.dm==='乙'&&pillars[1][1]==='子'&&state.earthStems>=2&&state.roots>=2;
    const result=isFixed?{use:'水',joy:'木',avoid:['土','旺火'],limited:'火',neutral:'金'}:{use,joy,avoid:avoid.length?avoid:[ranked[ranked.length-1]],limited:climate.limited,neutral};
    return{...result,strength:state.strength,ratio:Number(state.ratio.toFixed(2)),dayun,yearPillar,yearRelation,baseScores,finalScores:final,weights,climate:climate.climate,basis:`原局生扶/克泄耗比值 ${state.ratio.toFixed(2)}，判为${state.strength}；先叠加${dayun}大运环境权重，再由${yearPillar}流年按“流年先作用大运、再作用原局”修正。${yearRelation?`岁运关系修正 ${yearRelation>0?'+':''}${yearRelation.toFixed(1)}。`:''}${isFixed?'子月乙木兼见双土与木根，水木仍为结构主轴，火限量、金通关。':''}`};
  }

  function relationCorrection(flowBranch,targetBranch,useful=[],avoid=[]){
    const pair=flowBranch+targetBranch,good=e=>useful.includes(e)?1:avoid.includes(e)?-1:0,combine=LIUHE[pair];
    if(combine)return .8*good(combine);
    if(CLASH.has(pair))return useful.includes(GAN_ELEMENT[(HIDDEN[targetBranch]||[])[0]])?-.9:avoid.includes(GAN_ELEMENT[(HIDDEN[targetBranch]||[])[0]])?.9:0;
    if(PUNISH.has(pair)||HARM.has(pair))return-.4;
    if(BREAK.has(pair))return-.25;
    return 0;
  }

  function scoreYear({pillars,dayun,yearPillar}){
    const analysis=analyze({pillars,dayun}),yearElements=[GAN_ELEMENT[yearPillar[0]],GAN_ELEMENT[(HIDDEN[yearPillar[1]]||[])[0]]],yearAverage=yearElements.reduce((sum,e)=>sum+(analysis.finalScores[e]||0),0)/yearElements.length,dayunElements=[GAN_ELEMENT[dayun[0]],GAN_ELEMENT[(HIDDEN[dayun[1]]||[])[0]]],dayunAverage=dayunElements.reduce((sum,e)=>sum+(analysis.finalScores[e]||0),0)/dayunElements.length,relation=normalizePillars(pillars).reduce((sum,p)=>sum+relationCorrection(yearPillar[1],p[1],[analysis.use,analysis.joy],analysis.avoid.map(e=>e.replace('旺',''))),0),total=yearAverage*.6+dayunAverage*.4+relation,stars=total>=4?'★★★★★':total>=2?'★★★★':total>=0?'★★☆':total>=-2?'★☆':'★';
    return{total:Number(total.toFixed(2)),stars,relation:Number(relation.toFixed(2)),analysis};
  }

  function scoreLuckPeriod({scope='dayun',pillars,dayun,yearPillar='—',monthPillar='—',usefulOverride=null}){
    const computed=analyze({pillars,dayun,yearPillar:scope==='dayun'?'—':yearPillar}),analysis=usefulOverride?{...computed,use:usefulOverride.use,joy:usefulOverride.joy,avoid:[...(usefulOverride.avoid||[])]}:computed,target=scope==='dayun'?dayun:scope==='year'?yearPillar:monthPillar,elements=[GAN_ELEMENT[target?.[0]],GAN_ELEMENT[(HIDDEN[target?.[1]]||[])[0]]].filter(Boolean),useful=[analysis.use,analysis.joy],avoid=analysis.avoid.map(e=>e.replace('旺','')),elementValue=e=>e===analysis.use?2.5:e===analysis.joy?2:avoid.includes(e)?-2:computed.finalScores[e]||0,elementMean=elements.reduce((sum,e)=>sum+elementValue(e),0)/(elements.length||1),natal=normalizePillars(pillars),relation=scope==='dayun'?natal.reduce((sum,p)=>sum+relationCorrection(dayun[1],p[1],useful,avoid),0):scope==='year'?relationCorrection(yearPillar[1],dayun[1],useful,avoid)+natal.reduce((sum,p)=>sum+relationCorrection(yearPillar[1],p[1],useful,avoid),0):relationCorrection(monthPillar[1],yearPillar[1],useful,avoid)+relationCorrection(monthPillar[1],dayun[1],useful,avoid)+natal.reduce((sum,p)=>sum+relationCorrection(monthPillar[1],p[1],useful,avoid),0),baseScore=50+elementMean*12+relation*8,score=Math.round(clamp(baseScore,0,100)),rating=Math.max(.5,Math.min(5,Math.round(score/10)/2)),stars='★'.repeat(Math.floor(rating))+(rating%1?'☆':''),good=elements.filter(e=>useful.includes(e)),bad=elements.filter(e=>avoid.includes(e)),status=good.length&&!bad.length?`${target}补入${good.join('、')}喜用，当前阶段具备主动推进条件。`:bad.length&&!good.length?`${target}落入${bad.join('、')}忌神，当前压力和资源消耗会更集中。`:good.length&&bad.length?`${target}喜忌并见，机会与代价同时出现，成效取决于先后顺序。`:`${target}未直接落入核心喜忌，主要观察刑冲合害后的实际流向。`,advice=bad.length?'先压缩高风险投入，明确边界与承受上限，再使用其中可通关的力量。':good.length?'优先把助力用于最重要的一件事，同时保留复核节点，避免优势被分散。':'维持稳定节奏，以现实反馈验证，不因单一干支直接扩大判断。';
    return{scope,target,score,rating,stars,relation:Number(relation.toFixed(2)),status,advice,analysis};
  }

  global.QingshiDynamicUsefulGodEngine={analyze,scoreYear,scoreLuckPeriod,relationCorrection,calcElementScores,constants:{GAN_ELEMENT,HIDDEN,TRIADS,MEETINGS,LIUHE}};
})(typeof window!=="undefined"?window:globalThis);
