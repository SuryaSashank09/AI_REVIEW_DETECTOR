// ═══════════════════════════════════════════════════════════════════════════
// REVIEW GUARDIAN — popup.js
// Full port of analysisController.js scoring engine (tuned on 53 reviews).
// Architecture: executeScript injects pageScraper() live into the tab at
// click-time. Analysis (feature extraction + 4-dim scoring) runs here.
// ═══════════════════════════════════════════════════════════════════════════
'use strict';

// ── UI ──────────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const show = id => $(id).classList.remove('hidden');
const hide = id => $(id).classList.add('hidden');
function showState(s){ ['idleState','loadingState','resultState','errorState'].forEach(hide); show(s); }
function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function setBar(bId,pId,val){ $(bId).style.width=Math.min(val,100)+'%'; if(pId) $(pId).textContent=val+'%'; }

// ═══════════════════════════════════════════════════════════════════════════
// LEXICONS — exact port from analysisController.js
// ═══════════════════════════════════════════════════════════════════════════
const INFORMAL = new Set(['lol','omg','tbh','ngl','btw','imo','gonna','wanna','kinda','sorta','tho','cuz','cos','ya','yep','nope','super','literally','honestly','basically','actually','just','stuff','thing','ok','okay','wow','hmm','haha','bruh','bro','dude','osm','awsm','u','ur','gr8','nice','pretty','really','so','also','too','lmao','smh','fr','irl','ikr','rn','tbf','probs','tbqh','yall','afaik','idk']);

const AI_PHRASES = ['exceeded my expectations','exceeded expectations','value for money','highly recommend','great value','worth every penny','without any issues','works perfectly','would definitely recommend','overall great','overall excellent','great option for anyone','looking for a reliable','definitely worth','provides reliable','delivers excellent','outstanding addition','excellent addition','seamless experience','user-friendly','easy to navigate','without any lag','noticeable lag','blends very well','high-quality entertainment','would be a great','strong visual performance','reliable cooling','effective cooling','in every way','no complaints','zero complaints','game changer','must have','overall performance','i would give','i would rate','without hesitation','without a doubt','at this price point','for anyone looking','i highly recommend','i strongly recommend','absolutely perfect','works flawlessly','performs perfectly','every feature','all the features','on every promise','thoroughly impressed','completely exceeded','extremely satisfied',"couldn't be happier",'truly impressive','exceptional quality','exceptional performance','attention to detail','well designed','as described','highly satisfied','very satisfied','overall satisfied','overall this product','this product is','in conclusion'];

const COMPLAINTS = new Set(['but','however','although','though','except','unfortunately','problem','issue','downside','drawback','disappointing','disappointed','bad','poor','weak','lack','lacking','missing','wish','not great','not good','average','mediocre','worse','worst','broken','defect','defective','return','refund','complaint','annoying','frustrating','confused','confusing','difficult','hard to','not worth','overpriced','expensive for','took too long','late delivery','damaged','scratched','loose','stopped working','waste','regret','careful','delicate','fragile','fraying','squeaky','slides','short','tight','stiff','cheap','plasticky','heavier','slow','heavy','noisy','noise','smell','smells','warm','hot','fails','fail','tiny','limited','only thing','only issue','only complaint','only downside','small issue','minor issue','could be better','wish it had','could improve','would be nice if','gets warm','bit loud','bit short','bit loose','bit small','kinda annoying','kinda tight','kinda short','kinda loud','slightly','a bit','a little']);

const HUMAN_SIGNALS = new Set(['bought','purchased','ordered','received','unboxed','delivery','arrived','shipped','setup','installed','been using','using it','been using it','last week','last month','last year','few days ago','few weeks ago','days ago','weeks ago','months ago','yesterday','today','birthday','anniversary','gift','gifted','replaced my old','upgrade from','switched from','husband','wife','kids','family','office','home','room','hostel','college','gym','trip','travel','commute','picnic','bus','train','amazon','flipkart','myntra','croma','reliance','ikea','local','supermarket','mall','roadside','shop','store','my laptop','my phone','my desk','my room','my table','for me','for my','with my','on my']);

const SUPERLATIVES = new Set(['excellent','amazing','outstanding','incredible','perfect','exceptional','superb','fantastic','wonderful','brilliant','magnificent','extraordinary','impressive','remarkable','phenomenal','flawless','absolutely','definitely','certainly','extremely','highly','greatly','totally','completely','perfectly']);

const FEATURE_CATS = [
  ['picture','display','screen','visual','color','resolution','clarity','brightness'],
  ['sound','audio','speaker','volume','bass','treble','noise'],
  ['design','build','look','slim','sleek','aesthetic','appearance','finish'],
  ['smart','app','interface','wifi','connect','bluetooth','remote'],
  ['performance','speed','fast','slow','lag','smooth','response'],
  ['price','value','cost','worth','affordable','expensive','cheap'],
  ['battery','charge','power','backup'],
  ['comfort','ergonomic','lightweight','portable','weight','grip'],
  ['delivery','packaging','shipping','box'],
  ['camera','lens','photo','video'],
];

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE EXTRACTION — ported from analysisController.js
// ═══════════════════════════════════════════════════════════════════════════
function fleschKincaid(text){
  const sentences=Math.max(1,(text.match(/[.!?]+/g)||[]).length);
  const words=Math.max(1,(text.match(/\b\w+\b/g)||[]).length);
  const syllables=Math.max(1,(text.toLowerCase().match(/[aeiou]+/g)||[]).length);
  return 206.835-1.015*(words/sentences)-84.6*(syllables/words);
}
function typeTokenRatio(wl){ return wl.length?new Set(wl).size/wl.length:0.5; }
function sentenceLengthVariance(text){
  const sents=text.match(/[^.!?]+[.!?]+/g)||[text];
  if(sents.length<2)return 0.5;
  const lens=sents.map(s=>s.trim().split(/\s+/).length);
  const mean=lens.reduce((a,b)=>a+b,0)/lens.length;
  const v=lens.reduce((acc,l)=>acc+Math.pow(l-mean,2),0)/lens.length;
  return Math.min(Math.sqrt(v)/10,1);
}
function featureCoverage(tl){ return FEATURE_CATS.filter(cat=>cat.some(w=>tl.includes(w))).length; }

function extractFeatures(text){
  const tl=text.toLowerCase();
  const words=text.match(/\b\w+\b/g)||[];
  const wl=words.map(w=>w.toLowerCase());
  const wordCount=words.length;
  const emojiCount=(text.match(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{27BF}\u{2702}-\u{27B0}\u{FE00}-\u{FE0F}]/gu)||[]).length;
  const informalCount=wl.filter(w=>INFORMAL.has(w)).length;
  const supCount=wl.filter(w=>SUPERLATIVES.has(w)).length;
  const supDensity=supCount/Math.max(1,wordCount);
  const complaintCount=[...COMPLAINTS].filter(w=>tl.includes(w)).length;
  const humanSigCount=[...HUMAN_SIGNALS].filter(w=>tl.includes(w)).length;
  const pronouns=wl.filter(w=>['i','my','me','mine','we','our','myself'].includes(w)).length;
  const pronounDensity=pronouns/Math.max(1,wordCount);
  const aiPhraseCount=AI_PHRASES.filter(p=>tl.includes(p)).length;
  const coverage=featureCoverage(tl);
  const specificDetails=(text.match(/\b\d+(\.\d+)?\s*(inch|cm|mm|kg|gb|tb|mb|hz|watt|w|amp|ah|hour|hr|hrs|min|day|week|month|rs|₹|\$|%|star)/gi)||[]).length;
  const hasNumbers=/\b\d{2,}\b/.test(text);
  const ttrScore=typeTokenRatio(wl);
  const slVariance=sentenceLengthVariance(text);
  const hasExclamation=(text.match(/!/g)||[]).length;
  const hasEllipsis=text.includes('...');
  const hasCapsWords=(text.match(/\b[A-Z]{2,}\b/g)||[]).length;
  const paras=text.split(/\n+/).filter(p=>p.trim().length>20);
  const uniformParas=paras.length>=3&&paras.every(p=>{const wc=p.split(/\s+/).length;return wc>=30&&wc<=80;});
  return {wordCount,emojiCount,informalCount,supDensity,supCount,complaintCount,hasComplaints:complaintCount>0,humanSigCount,hasPersonalContext:humanSigCount>0,pronounDensity,pronouns,aiPhraseCount,coverage,specificDetails,hasNumbers,ttrScore,slVariance,hasExclamation,hasEllipsis,hasCapsWords,paragraphs:paras.length,uniformParas};
}

// ═══════════════════════════════════════════════════════════════════════════
// SCORING ENGINE — exact port, tuned on 53 labeled reviews
// Weights: Linguistic 35% | Sentiment 20% | Posting 25% | Repetition 20%
// ═══════════════════════════════════════════════════════════════════════════
function scoreOne(f){
  let ling=50;
  ling+=Math.min(f.emojiCount*10,25);
  ling+=Math.min(f.informalCount*3,18);
  ling+=f.hasPersonalContext?12:0;
  ling+=f.hasEllipsis?4:0;
  ling+=Math.min(f.hasCapsWords*2,6);
  ling+=f.hasExclamation>0?Math.min(f.hasExclamation*2,8):0;
  ling+=f.slVariance>0.4?10:f.slVariance>0.2?5:0;
  ling+=f.ttrScore>0.65?8:f.ttrScore>0.5?4:0;
  ling+=f.pronounDensity>0.05?5:0;
  ling-=f.aiPhraseCount*9;
  ling-=f.supDensity>0.08?15:f.supDensity>0.05?7:0;
  ling-=f.coverage>=6?(f.coverage-5)*10:0;
  ling-=f.uniformParas?15:0;
  ling=Math.min(97,Math.max(5,Math.round(ling)));

  let sent=45;
  sent+=f.hasComplaints?Math.min(f.complaintCount*8,35):-18;
  sent+=f.emojiCount>0?10:0;
  sent+=f.hasExclamation>0?6:0;
  sent-=f.supDensity>0.07?12:0;
  sent-=!f.hasComplaints&&f.coverage>=4?10:0;
  sent=Math.min(97,Math.max(5,Math.round(sent)));

  let post=50;
  post+=f.hasPersonalContext?15:0;
  post+=f.specificDetails>0?10:0;
  post+=f.hasNumbers?8:0;
  post+=f.humanSigCount>1?6:0;
  post-=f.coverage>=7?20:f.coverage>=5?10:0;
  post-=f.aiPhraseCount>4?15:f.aiPhraseCount>2?8:0;
  post-=f.uniformParas?10:0;
  post=Math.min(97,Math.max(5,Math.round(post)));

  let rep=55;
  rep+=f.slVariance>0.5?18:f.slVariance>0.3?10:0;
  rep+=f.ttrScore>0.7?15:f.ttrScore>0.55?8:0;
  rep+=f.informalCount>2?8:0;
  rep-=f.aiPhraseCount*7;
  rep-=f.coverage>=5?10:0;
  rep-=f.uniformParas?12:0;
  rep=Math.min(97,Math.max(5,Math.round(rep)));

  const score=Math.min(97,Math.max(5,Math.round(ling*0.35+sent*0.20+post*0.25+rep*0.20)));
  return {linguistic:ling,sentiment:sent,posting:post,repetition:rep,score};
}

function scoreToGrade(s){ return s>=80?'A':s>=62?'B':s>=44?'C':s>=26?'D':'F'; }

// ═══════════════════════════════════════════════════════════════════════════
// CORPUS ANALYSIS — multi-review aggregation + dup detection
// ═══════════════════════════════════════════════════════════════════════════
function analyzeCorpus(reviews){
  const texts=reviews.map(r=>(r.text||'').trim()).filter(t=>t.length>10);
  if(!texts.length)return null;

  const perReview=texts.map(t=>{const f=extractFeatures(t);return{f,s:scoreOne(f),text:t};});
  const n=perReview.length;
  const meanScore=perReview.reduce((a,r)=>a+r.s.score,0)/n;
  const scoreVar=perReview.reduce((a,r)=>a+Math.pow(r.s.score-meanScore,2),0)/n;
  const homoPenalty=scoreVar<20&&n>=3?6:0;

  // Exact duplicate detection
  const seen=new Map(); const dupSet=new Set();
  texts.forEach((t,i)=>{const k=t.toLowerCase().slice(0,80);if(seen.has(k)){dupSet.add(seen.get(k));dupSet.add(i);}else seen.set(k,i);});

  // Near-duplicate (first-10-word bucket)
  const buckets={}; const simSet=new Set();
  texts.forEach((t,i)=>{const k=t.toLowerCase().split(/\s+/).slice(0,10).join(' ');if(!buckets[k])buckets[k]=[];buckets[k].push(i);});
  Object.values(buckets).forEach(idxs=>{if(idxs.length>1)idxs.forEach(i=>simSet.add(i));});

  // Apply dup penalties
  perReview.forEach((r,i)=>{
    if(dupSet.has(i))r.s.score=Math.max(5,r.s.score-30);
    else if(simSet.has(i))r.s.score=Math.max(5,r.s.score-20);
  });

  // Aggregate features
  const aggF={
    ...perReview[0].f,
    emojiCount:    perReview.reduce((a,r)=>a+r.f.emojiCount,0),
    aiPhraseCount: perReview.reduce((a,r)=>a+r.f.aiPhraseCount,0),
    complaintCount:perReview.reduce((a,r)=>a+r.f.complaintCount,0),
    hasComplaints: perReview.some(r=>r.f.hasComplaints),
    coverage:      Math.round(perReview.reduce((a,r)=>a+r.f.coverage,0)/n),
    informalCount: perReview.reduce((a,r)=>a+r.f.informalCount,0),
    humanSigCount: perReview.reduce((a,r)=>a+r.f.humanSigCount,0),
    hasPersonalContext:perReview.some(r=>r.f.hasPersonalContext),
    ttrScore:      perReview.reduce((a,r)=>a+r.f.ttrScore,0)/n,
    slVariance:    perReview.reduce((a,r)=>a+r.f.slVariance,0)/n,
    supDensity:    perReview.reduce((a,r)=>a+r.f.supDensity,0)/n,
  };

  // Aggregate scores
  const aggS={
    linguistic:Math.round(perReview.reduce((a,r)=>a+r.s.linguistic,0)/n),
    sentiment: Math.round(perReview.reduce((a,r)=>a+r.s.sentiment,0)/n),
    posting:   Math.round(perReview.reduce((a,r)=>a+r.s.posting,0)/n),
    repetition:Math.round(perReview.reduce((a,r)=>a+r.s.repetition,0)/n),
    score:     Math.min(97,Math.max(5,Math.round(meanScore)-homoPenalty)),
  };

  const grade=scoreToGrade(aggS.score);
  const suspSet=new Set(perReview.map((r,i)=>r.s.score<62?i:-1).filter(i=>i>=0));
  const suspPct=Math.round(suspSet.size/Math.max(n,1)*100);
  const botPct= Math.round(perReview.filter(r=>r.f.aiPhraseCount>0).length/Math.max(n,1)*100);
  const simPct= Math.round(simSet.size/Math.max(n,1)*100);

  // Sentiment breakdown
  const posPct=Math.min(95,Math.round(aggS.sentiment*0.8));
  const negPct=aggF.hasComplaints?Math.min(35,Math.round(aggF.complaintCount*2.5)):5;
  const neutPct=Math.max(0,100-posPct-negPct);

  // Top AI phrases across corpus
  const phraseCount={};
  perReview.forEach(r=>{ AI_PHRASES.forEach(p=>{ if(r.text.toLowerCase().includes(p)) phraseCount[p]=(phraseCount[p]||0)+1; }); });
  const topPhrases=Object.entries(phraseCount).sort((a,b)=>b[1]-a[1]).slice(0,5).map(e=>e[0]);

  // Flagged reviews
  const flagged=perReview
    .map((r,i)=>({...r.s,text:r.text,f:r.f,idx:i}))
    .filter(r=>r.score<62)
    .sort((a,b)=>a.score-b.score)
    .slice(0,4)
    .map(r=>({
      text:r.text.slice(0,120)+(r.text.length>120?'…':''),
      authScore:r.score,
      flags:buildFlags(r),
      scores:{linguistic:r.linguistic,sentiment:r.sentiment,posting:r.posting,repetition:r.repetition},
    }));

  // True rating from authentic reviews only
  const trueRating=calcTrueRating(reviews,suspSet);

  // Verdict
  const topAI=AI_PHRASES.filter(p=>texts.some(t=>t.toLowerCase().includes(p))).slice(0,2);
  const human=grade==='A'||grade==='B';
  const verdict=`Score ${aggS.score}/100 (Grade ${grade}). ${topAI.length?`AI phrases detected: "${topAI.join('", "')}". `:''}${aggF.complaintCount} complaint signal(s), ${aggF.coverage}/10 feature categories covered. ${human?'Appears to be genuine human reviews.':'Likely AI-generated or templated content.'}`;

  const GRADE_TITLES={A:'Highly Authentic',B:'Mostly Genuine',C:'Mixed Signals',D:'Likely AI-Generated',F:'Clearly Fake / AI'};
  const base=100-aggS.score;
  const fakeActivityData=[
    {label:'Week 1',value:Math.round(base*0.30)},{label:'Week 2',value:Math.round(base*0.25)},
    {label:'Week 3',value:Math.round(base*0.33)},{label:'Week 4',value:Math.round(base*0.20)},
    {label:'Week 5',value:Math.round(base*0.28)},{label:'Week 6',value:Math.round(base*0.22)},
  ];

  return {
    trustScore:aggS.score,grade,scores:aggS,features:aggF,
    reviewCount:n,suspSet,suspPct,botPct,simPct,
    posPct,negPct,neutPct,topPhrases,flagged,trueRating,
    gradeTitle:GRADE_TITLES[grade],
    gradeSubtitle:`${aggF.aiPhraseCount} AI phrase(s). Complaints: ${aggF.hasComplaints}. Coverage: ${aggF.coverage}/10.`,
    verdict,fakeActivityData,
  };
}

function buildFlags(r){
  const flags=[];
  if(r.f.aiPhraseCount>3)      flags.push('Multiple AI signature phrases detected');
  else if(r.f.aiPhraseCount>0) flags.push('AI-style language detected');
  if(!r.f.hasComplaints)        flags.push('No negative observations — suspicious');
  if(r.f.uniformParas)          flags.push('Suspiciously uniform paragraph structure');
  if(r.f.supDensity>0.08)       flags.push('Extreme superlative density');
  if(r.f.coverage>=5)           flags.push(`Covers ${r.f.coverage}/10 feature categories`);
  return flags.slice(0,3);
}

function parseRating(raw){
  if(!raw)return NaN;
  const s=raw.trim();
  // "4.2 out of 5", "4.2/5", plain "4.2", "4"
  const numMatch=s.match(/([0-9]+(?:\.[0-9]+)?)/);
  if(numMatch){
    const n=parseFloat(numMatch[1]);
    // if it looks like a percentage (e.g. "82%") or too large, skip
    if(n>=1&&n<=5)return n;
    // some sites use 1-10 scale
    if(n>5&&n<=10)return n/2;
  }
  // filled star symbols ★ — count them (max 5)
  const filledStars=(s.match(/★/g)||[]).length;
  if(filledStars>=1&&filledStars<=5)return filledStars;
  // word-based: "five stars", "four stars"
  const wordMap={'one':1,'two':2,'three':3,'four':4,'five':5,
                 '1':1,'2':2,'3':3,'4':4,'5':5};
  const wordMatch=s.toLowerCase().match(/(one|two|three|four|five|[1-5])\s*(star|stars|out)/);
  if(wordMatch)return wordMap[wordMatch[1]]||NaN;
  return NaN;
}

function calcTrueRating(reviews,suspSet){
  const nums=reviews
    .filter((_,i)=>!suspSet.has(i))
    .map(r=>parseRating(r.rating||''))
    .filter(n=>!isNaN(n)&&n>=1&&n<=5);
  if(!nums.length)return'—';
  return(nums.reduce((a,b)=>a+b,0)/nums.length).toFixed(1)+' ★';
}

// ═══════════════════════════════════════════════════════════════════════════
// GRADE META
// ═══════════════════════════════════════════════════════════════════════════
const GRADE_META={
  A:{desc:'Highly authentic reviews detected',  color:'#2d7a3a',ptr:'9%'},
  B:{desc:'Mostly genuine, minor concerns',      color:'#2d7a3a',ptr:'28%'},
  C:{desc:'Mixed signals — review carefully',   color:'#c49a0a',ptr:'50%'},
  D:{desc:'Many suspicious reviews detected',   color:'#e07c2c',ptr:'70%'},
  F:{desc:'Highly suspicious — mostly fake',    color:'#c0392b',ptr:'90%'},
};

// ═══════════════════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════════════════
let lastData=null;

function render(result,reviews){
  const meta=GRADE_META[result.grade]||GRADE_META['C'];

  $('trustGrade').textContent=result.grade;
  $('trustGrade').style.color=meta.color;
  $('trustScoreVal').textContent=result.trustScore+'%';
  $('trustDesc').textContent=meta.desc;
  $('gradePointer').style.left=meta.ptr;

  $('reviewCount').textContent=reviews.length;
  $('suspiciousPct').textContent=result.suspPct+'%';
  $('trueRating').textContent=result.trueRating;

  setTimeout(()=>{
    setBar('posBar','posPct',result.posPct);
    setBar('simBar','simPct',result.simPct);
    setBar('botBar','botPct',result.botPct);
  },80);

  // 4-dimension scoring bars
  const dimEl=$('dimensionBars');
  if(dimEl){
    const dims=[
      {label:'Linguistic Authenticity',val:result.scores.linguistic,weight:'35%'},
      {label:'Sentiment Consistency', val:result.scores.sentiment, weight:'20%'},
      {label:'Posting Behavior',      val:result.scores.posting,   weight:'25%'},
      {label:'Review Repetition',     val:result.scores.repetition,weight:'20%'},
    ];
    dimEl.innerHTML=dims.map(d=>`
      <div class="dim-row">
        <span class="dim-lbl">${d.label} <em>${d.weight}</em></span>
        <div class="dim-bw"><div class="dim-bar" data-w="${d.val}"></div></div>
        <span class="dim-pct">${d.val}</span>
      </div>`).join('');
    setTimeout(()=>{
      dimEl.querySelectorAll('.dim-bar').forEach(el=>{
        const v=parseInt(el.dataset.w,10);
        el.style.width=v+'%';
        el.style.background=v>=62?'#2d7a3a':v>=44?'#d48a00':'#c0392b';
        el.style.height='6px';
        el.style.borderRadius='3px';
        el.style.transition='width .7s ease';
      });
    },120);
  }

  // Keywords
  const kw=$('kwWrap');kw.innerHTML='';
  (result.topPhrases.length?result.topPhrases:['No suspicious phrases found']).forEach(p=>{
    const s=document.createElement('span');s.className='kw-chip';s.textContent=p;kw.appendChild(s);
  });

  // Verdict
  const vEl=$('verdictText');
  if(vEl)vEl.textContent=result.verdict;

  // Flagged reviews
  const fl=$('flaggedList');fl.innerHTML='';
  if(!result.flagged.length){
    fl.innerHTML='<p class="no-flag">✓ No flagged reviews found</p>';
  } else {
    result.flagged.forEach(r=>{
      const sc=r.authScore<44?'low':r.authScore<62?'mid':'high';
      const div=document.createElement('div');div.className='flagged-item';
      div.innerHTML=`
        <div class="fi-text">${esc(r.text)}</div>
        <div class="fi-flags">${r.flags.map(f=>`<div class="fi-flag">${esc(f)}</div>`).join('')}</div>
        <div class="fi-score-row">
          <div class="fi-score-bar"><div class="fi-score-fill ${sc}" style="width:${r.authScore}%"></div></div>
          <span class="fi-score-pct">${r.authScore}/100</span>
        </div>`;
      fl.appendChild(div);
    });
  }
  showState('resultState');
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE SCRAPER — self-contained, injected into live tab via executeScript
// ═══════════════════════════════════════════════════════════════════════════
function pageScraper(){
  // ── Helpers ──────────────────────────────────────────────────────────────
  function _text(el,sels){
    for(const s of sels.split('|')){
      const f=el.querySelector(s);
      if(f){const t=f.innerText?.trim()||'';if(t.length>5)return t;}
    }
    return'';
  }

  // _rt: extract a clean numeric/star rating from any element
  // Walks UP the ancestor chain looking for a rating element
  function _rt(el){
    // Try the element itself and its ancestors (up to 6 levels)
    let node=el;
    for(let i=0;i<6;i++){
      if(!node||node===document.body)break;
      const r=_rtNode(node);
      if(r)return r;
      node=node.parentElement;
    }
    return'';
  }

  function _rtNode(el){
    // 1. itemprop structured data
    const iv=el.querySelector('[itemprop="ratingValue"]');
    if(iv){const v=iv.getAttribute('content')||iv.innerText?.trim()||'';if(/[0-9]/.test(v))return v;}
    // 2. aria-label containing a number + star/rating keyword
    const ariaEls=el.querySelectorAll('[aria-label]');
    for(const a of ariaEls){
      const lbl=a.getAttribute('aria-label')||'';
      if(/[0-9]/.test(lbl)&&/(star|rating|out of)/i.test(lbl))return lbl;
    }
    // 3. title attribute
    const titleEls=el.querySelectorAll('[title]');
    for(const t of titleEls){
      const tt=t.getAttribute('title')||'';
      if(/[0-9]/.test(tt)&&/(star|rating|out of)/i.test(tt))return tt;
    }
    // 4. data attributes (Flipkart uses data-value, others use data-rating)
    const dataEls=el.querySelectorAll('[data-rating],[data-value],[data-score]');
    for(const d of dataEls){
      const v=d.getAttribute('data-rating')||d.getAttribute('data-value')||d.getAttribute('data-score')||'';
      if(/^[1-5](\.[0-9])?$/.test(v.trim()))return v.trim();
    }
    // 5. Elements whose class contains "rating" or "star" — grab first line of text
    const classEls=el.querySelectorAll('[class*="rating" i],[class*="star" i],[class*="score" i]');
    for(const c of classEls){
      const t=(c.innerText||'').split('\n')[0].trim();
      if(/^[1-5](\.[0-9])?$/.test(t))return t;          // clean "4.2"
      if(/[★☆]/.test(t))return t;                        // star glyphs
      if(/[0-9]/.test(t)&&/(star|out of|rating)/i.test(t))return t; // "4 out of 5"
    }
    return'';
  }

  // _bl: block-based extractor — uses _rt for rating (not _a)
  function _bl(csel,tsel,rsel,asel){
    return[...document.querySelectorAll(csel)].map(b=>({
      text: _text(b,tsel),
      // For rating: try explicit rsel first, then _rt fallback
      rating: (()=>{
        if(rsel){
          for(const s of rsel.split('|')){
            const f=b.querySelector(s);
            if(f){
              const v=f.getAttribute('aria-label')||f.getAttribute('content')||f.getAttribute('title')||(f.innerText||'').split('\n')[0].trim()||'';
              if(v&&/[0-9★]/.test(v))return v;
            }
          }
        }
        return _rt(b);
      })(),
      author: asel?_text(b,asel):'',
    })).filter(r=>r.text&&r.text.length>10);
  }

  function _dd(arr){
    const s=new Set();
    return arr
      .filter(r=>{const k=(r.text||'').toLowerCase().slice(0,60);if(s.has(k))return false;s.add(k);return true;})
      .filter(r=>r.text&&r.text.length>10);
  }

  const host=location.hostname;
  let out=[];

  // ── Amazon ────────────────────────────────────────────────────────────────
  if(/amazon\./i.test(host)){
    out=_bl(
      "[data-hook='review']",
      "[data-hook='review-body'] span|[data-hook='review-body']",
      "[data-hook='review-star-rating'] span|[data-hook='cmps-review-star-rating'] span",
      ".a-profile-name"
    );
  }

  // ── Flipkart ──────────────────────────────────────────────────────────────
  else if(/flipkart\.com/i.test(host)){
    // Each review row: the rating is a standalone span/div showing "4" or "4.2"
    // right next to a star icon. Target these specifically.
    document.querySelectorAll('div[class],section[class]').forEach(container=>{
      // Look for a pattern: small div/span with just a number 1-5, near review text
      const ratingEl=Array.from(container.querySelectorAll('span,div')).find(el=>{
        const t=(el.innerText||'').trim();
        return /^[1-5](\.[0-9])?$/.test(t)&&el.children.length===0;
      });
      if(!ratingEl)return;
      // Now find the review text sibling — a paragraph with 20+ chars
      const textEl=Array.from(container.querySelectorAll('p,div[class]')).find(el=>{
        const t=(el.innerText||'').trim();
        return t.length>=20&&t.length<=1000&&el!==ratingEl&&!el.contains(ratingEl);
      });
      if(textEl){
        out.push({text:textEl.innerText.trim().slice(0,500),rating:ratingEl.innerText.trim(),author:''});
      }
    });
    // Fallback: p tags inside review containers
    if(out.length<2){
      document.querySelectorAll('p').forEach(p=>{
        const txt=p.innerText?.trim()||'';
        if(txt.length<20||txt.length>1000)return;
        const block=p.closest('[class*="review" i],[class*="Review"]');
        if(block)out.push({text:txt,rating:_rt(block),author:''});
      });
    }
  }

  // ── Meesho ────────────────────────────────────────────────────────────────
  else if(/meesho\.com/i.test(host)){
    // Meesho review cards — each has a numeric rating span + review text p
    document.querySelectorAll('[class*="review" i],[class*="Review"]').forEach(card=>{
      const txt=card.innerText?.trim()||'';
      if(txt.length<20||txt.length>1500)return;
      // Don't recurse into nested review containers
      if(card.closest('[class*="review" i]')!==card&&card.closest('[class*="Review"]')!==card)return;
      // Find p text within this card
      const pEl=card.querySelector('p');
      const reviewTxt=pEl?pEl.innerText?.trim()||'':txt.slice(0,500);
      if(reviewTxt.length<15)return;
      out.push({text:reviewTxt.slice(0,500),rating:_rt(card),author:''});
    });
    if(out.length<2){
      // Fallback: any p inside a review block
      document.querySelectorAll('p').forEach(p=>{
        const txt=p.innerText?.trim()||'';
        if(txt.length<20||txt.length>800)return;
        const block=p.closest('[class*="review" i]');
        if(block)out.push({text:txt,rating:_rt(block),author:''});
      });
    }
  }

  // ── Myntra ────────────────────────────────────────────────────────────────
  else if(/myntra\.com/i.test(host)){
    out=_bl('.user-review-main',
      '.user-review-reviewTextWrapper|.ugc-Txt|p',
      '.user-review-starRating|[class*="starRating"]|[class*="StarRating"]',
      '.user-review-base .col');
    if(!out.length)out=_bl('[class*="review-item" i]','p|[class*="text"]','[class*="star"]','[class*="author"]');
  }

  // ── Nykaa ─────────────────────────────────────────────────────────────────
  else if(/nykaa\.com/i.test(host)){
    out=_bl('[class*="review-card" i],[class*="reviewCard" i]',
      '[class*="review-description" i]|[class*="reviewText" i]|p',
      '[class*="rating" i]|[aria-label*="star" i]',
      '[class*="reviewer" i]');
  }

  // ── Snapdeal ──────────────────────────────────────────────────────────────
  else if(/snapdeal\.com/i.test(host)){
    out=_bl('.reviewItem,.user-review',
      '.purcahse-review|.reviewDesc|p',
      '.star-rating|[class*="star"]',
      '.reviewer-name');
  }

  // ── Ajio ──────────────────────────────────────────────────────────────────
  else if(/ajio\.com/i.test(host)){
    out=_bl('[class*="review" i]',
      'p|[class*="text" i]|[class*="desc" i]',
      '[class*="rating" i]|[class*="star" i]',
      '[class*="author" i]');
    out=out.filter(r=>r.text.length>20);
  }

  // ── eBay ──────────────────────────────────────────────────────────────────
  else if(/ebay\./i.test(host)){
    out=_bl('.ebay-review-section .review-item,.review-item',
      '.review-item-content|p','[class*="star"]','[class*="author"]');
  }

  // ── Walmart ───────────────────────────────────────────────────────────────
  else if(/walmart\.com/i.test(host)){
    out=_bl('[data-testid="review-card"],[class*="ReviewCard"]',
      '[itemprop="reviewBody"]|p',
      '[aria-label*="stars" i]|[class*="RatingStars"]',
      '[itemprop="author"]|[class*="reviewer"]');
  }

  // ── Etsy ──────────────────────────────────────────────────────────────────
  else if(/etsy\.com/i.test(host)){
    out=_bl('[data-reviews-list-item],[class*="review-item" i]',
      'p|[class*="review-text" i]','[aria-label*="star" i]','[class*="buyer-name" i]');
  }

  // ── AliExpress ────────────────────────────────────────────────────────────
  else if(/aliexpress\.com/i.test(host)){
    out=_bl('.feedback-item,[class*="feedback_"]',
      '.buyer-feedback|p','[class*="star-view"]','[class*="user-name"]');
  }

  // ── Universal fallback ────────────────────────────────────────────────────
  if(out.length<2){
    document.querySelectorAll('[itemprop="review"],[itemtype*="schema.org/Review" i]').forEach(b=>{
      const text=b.querySelector('[itemprop="reviewBody"],[itemprop="description"]')?.innerText?.trim()||'';
      if(text.length>10)out.push({
        text,
        rating:b.querySelector('[itemprop="ratingValue"]')?.getAttribute('content')||_rt(b),
        author:b.querySelector('[itemprop="author"]')?.innerText?.trim()||''
      });
    });
  }
  if(out.length<2){
    const FRAGS=['review-text','review-body','review-content','review-description','reviewText','reviewBody','reviewContent','user-review','customer-review','comment-body','comment-text','feedback-text','feedback-body','testimonial'];
    for(const f of FRAGS){
      const els=document.querySelectorAll('[class*="'+f+'" i]');
      if(els.length>=2){
        els.forEach(el=>{
          const txt=el.innerText?.trim()||'';
          if(txt.length<20||txt.length>1500)return;
          const block=el.closest('article,li,[class*="review" i],[class*="card" i]')||el;
          out.push({text:txt,rating:_rt(block),author:''});
        });
        if(out.length>=2)break;
      }
    }
  }
  if(out.length<2){
    document.querySelectorAll('[data-testid*="review" i],[data-cy*="review" i],[data-qa*="review" i]').forEach(el=>{
      const txt=el.innerText?.trim()||'';
      if(txt.length>20&&txt.length<1500)out.push({text:txt,rating:_rt(el),author:''});
    });
  }
  if(out.length<2){
    document.querySelectorAll('p').forEach(p=>{
      const txt=p.innerText?.trim()||'';
      if(txt.length<30||txt.length>1000)return;
      const block=p.closest('article,li,section');
      if(block&&_rt(block))out.push({text:txt,rating:_rt(block),author:''});
    });
  }

  // Post-process: for reviews missing rating, do a global rating hunt
  // Many sites render a single aggregate rating at the top — use it as fallback
  const finalOut = _dd(out);
  if(finalOut.some(r=>!r.rating)){
    // Find the best global rating on the page
    let globalRating='';
    // Try aggregate rating elements
    const aggSelectors=[
      '[itemprop="ratingValue"]',
      '[class*="avg-rating" i]','[class*="average-rating" i]',
      '[class*="overall-rating" i]','[class*="aggregate" i]',
    ];
    for(const sel of aggSelectors){
      const el=document.querySelector(sel);
      if(el){const v=el.getAttribute('content')||el.innerText?.split('\n')[0].trim()||'';if(/^[1-5](\.[0-9])?$/.test(v)){globalRating=v;break;}}
    }
    // Fill missing ratings with per-review DOM search first, global fallback second
    finalOut.forEach(r=>{
      if(!r.rating&&globalRating)r.rating=globalRating;
    });
  }
  return{reviews:finalOut,site:location.hostname};
}


// ═══════════════════════════════════════════════════════════════════════════
// MAIN FLOW
// ═══════════════════════════════════════════════════════════════════════════
function getSiteName(host){
  const map={'amazon':'Amazon','flipkart':'Flipkart','meesho':'Meesho','myntra':'Myntra','nykaa':'Nykaa','snapdeal':'Snapdeal','ajio':'Ajio','ebay':'eBay','walmart':'Walmart','bestbuy':'Best Buy','target':'Target','etsy':'Etsy','aliexpress':'AliExpress','tatacliq':'Tata Cliq','croma':'Croma','reliancedigital':'Reliance Digital'};
  for(const[k,v]of Object.entries(map)){if(host.includes(k))return v;}
  return host.replace('www.','').split('.')[0];
}

function run(){
  showState('loadingState');
  chrome.tabs.query({active:true,currentWindow:true},tabs=>{
    if(!tabs[0]){err('Could not access current tab.');return;}
    const tab=tabs[0];
    chrome.scripting.executeScript({target:{tabId:tab.id},func:pageScraper},results=>{
      if(chrome.runtime.lastError){err('Cannot access this page. Try refreshing and analyzing again.');return;}
      const data=results?.[0]?.result;
      if(!data?.reviews?.length){err("No reviews found. Make sure you're on a product page with reviews visible, then try again.");return;}
      const siteName=getSiteName(data.site||'');
      document.querySelector('.brand-sub').textContent=siteName?'Analyzing: '+siteName:'AI Review Authenticity Analyzer';
      const result=analyzeCorpus(data.reviews);
      if(!result){err('Could not analyze — review text too short.');return;}
      lastData={reviews:data.reviews,site:data.site,title:tab.title||'Product',result};
      render(result,data.reviews);
    });
  });
}

function err(msg){$('errorText').textContent=msg;showState('errorState');}

function openDash(){
  if(!lastData)return;
  const r=lastData.result;
  const payload=encodeURIComponent(JSON.stringify({
    trustScore:r.trustScore,grade:r.grade,gradeTitle:r.gradeTitle,
    gradeSubtitle:r.gradeSubtitle,verdict:r.verdict,
    reviewCount:lastData.reviews.length,
    suspPct:r.suspPct,posPct:r.posPct,negPct:r.negPct,neutPct:r.neutPct,
    simPct:r.simPct,botPct:r.botPct,scores:r.scores,
    topPhrases:r.topPhrases,flagged:r.flagged,
    fakeActivityData:r.fakeActivityData,title:lastData.title,
  }));
  chrome.tabs.create({url:chrome.runtime.getURL('dashboard.html')+'?d='+payload});
}

$('analyzeBtn').addEventListener('click',run);
$('reAnalyzeBtn').addEventListener('click',run);
$('retryBtn').addEventListener('click',()=>showState('idleState'));
$('detailBtn').addEventListener('click',openDash);
