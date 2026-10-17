(function(){
  'use strict';
  var D = window.SITE_DATA, L = window.I18N;
  var LANGS = [
    ['en','English','English'],['ja','日本語','Japanese'],['ko','한국어','Korean'],['zh-Hans','简体中文','Chinese (Simplified)'],
    ['zh-Hant','繁體中文','Chinese (Traditional)'],['fr','Français','French'],['vi','Tiếng Việt','Vietnamese'],['es','Español','Spanish'],
    ['de','Deutsch','German'],['th','ไทย','Thai'],['id','Bahasa Indonesia','Indonesian'],['pt','Português','Portuguese'],['it','Italiano','Italian']
  ];
  var CODES = {en:'EN',ja:'日',ko:'한','zh-Hans':'简','zh-Hant':'繁',fr:'FR',vi:'VI',es:'ES',de:'DE',th:'TH',id:'ID',pt:'PT',it:'IT'};
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lang = 'en';
  try { lang = localStorage.getItem('jk-lang') || ''; } catch(e){}
  if(!L[lang]){
    var nav = (navigator.language||'en');
    lang = /^zh-(TW|HK|MO)|Hant/i.test(nav) ? 'zh-Hant' : /^zh/i.test(nav) ? 'zh-Hans' : nav.slice(0,2);
    if(!L[lang]) lang = 'en';
  }
  function t(k){ var d=L[lang]; return (d && d[k]!=null) ? d[k] : (L.en[k]!=null ? L.en[k] : k); }
  function fmt(s,o){ return String(s).replace(/\{(\w)\}/g,function(_,k){return o[k];}); }
  function yen(n){ return '¥' + n.toLocaleString('en-US'); }
  function dateStr(iso, opts){ var p=iso.split('-'); var d=new Date(+p[0],+p[1]-1,+p[2]); try{return d.toLocaleDateString(t('_locale'),opts);}catch(e){return iso;} }
  var $ = function(s,r){return (r||document).querySelector(s);}, $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};

  /* ---------- i18n render ---------- */
  function render(){
    document.documentElement.lang = lang;
    $$('[data-i18n]').forEach(function(el){ el.textContent = t(el.getAttribute('data-i18n')); });
    document.title = t('meta.title');
    $('#lang-code').textContent = CODES[lang];
    $$('#lang-list button').forEach(function(b){ b.setAttribute('aria-selected', b.dataset.lang===lang); });
    renderNotice(); renderPay(); renderMenu(); renderDress(); renderCalendar(); renderBus(); renderFaq(); renderNews();
    observeReveals();
  }
  function renderNotice(){
    var items = D.closedDays.map(function(d){ return dateStr(d,{month:'short',day:'numeric',weekday:'short'}); }).join('  ·  ');
    var html = '<span><b>'+esc(t('notice.closed'))+'</b>'+esc(items)+'</span><span>'+esc(t('notice.noRes'))+'</span><span><b>☎</b>0977-66-3775</span>';
    $('#notice-track').innerHTML = html + html;
  }
  var PAY_ICON = {
    card:'<svg viewBox="0 0 48 48"><rect x="5" y="11" width="38" height="26" rx="4"/><path d="M5 19h38"/><path d="M11 29h10"/></svg>',
    emoney:'<svg viewBox="0 0 48 48"><rect x="13" y="6" width="22" height="36" rx="4"/><path class="pay-wave" d="M28 18a7 7 0 0 1 0 12M32 14a12 12 0 0 1 0 20"/><circle cx="20" cy="24" r="2.5"/></svg>',
    qr:'<svg viewBox="0 0 48 48"><rect x="7" y="7" width="13" height="13" rx="2"/><rect x="28" y="7" width="13" height="13" rx="2"/><rect x="7" y="28" width="13" height="13" rx="2"/><path d="M28 28h5v5h-5zM36 36h5v5h-5zM36 28h5M28 41h5"/><path class="pay-scan" d="M4 24h40"/></svg>',
    cash:'<svg viewBox="0 0 48 48"><rect x="4" y="12" width="40" height="24" rx="3"/><circle cx="24" cy="24" r="6"/><path d="M21 21l3 3 3-3M24 24v5M21.5 26h5"/></svg>'
  };
  function renderPay(){
    var zh = /^zh/.test(lang);
    $('#pay-grid').innerHTML = D.pay.map(function(g,gi){
      var chips = g[1].map(function(b){
        var name = b[0]==='@ic' ? t('pay.ic') : b[0]==='@yen' ? t('pay.cashChip') : (lang==='ja' && b[1]) ? b[1] : (zh && (b[2]||b[1])) ? (b[2]||b[1]) : b[0];
        return '<span class="chip">'+esc(name)+'</span>';
      }).join('');
      var extra = g[0]==='cash' ? '<p class="pay-extra">'+esc(t('pay.cashNote'))+'</p><p class="pay-extra">'+esc(t('pay.coupon'))+'</p>' : '';
      return '<div class="pay-cat tilt" data-reveal="'+['left','up','down','right'][gi]+'" data-delay="'+(gi+1)+'"><div class="pay-ico">'+PAY_ICON[g[0]]+'</div><h4>'+esc(t('pay.'+g[0]))+'</h4><div class="chips">'+chips+'</div>'+extra+'</div>';
    }).join('');
  }
  var curCat = 'all';
  function renderMenu(){
    var f = $('#menu-filters');
    f.innerHTML = D.cats.map(function(c){ return '<button role="tab" data-cat="'+c+'" class="'+(c===curCat?'on':'')+'">'+esc(t('cat.'+c))+'</button>'; }).join('');
    $$('button',f).forEach(function(b){ b.onclick = function(){ curCat=b.dataset.cat; $$('button',f).forEach(function(x){x.classList.toggle('on',x===b);}); filterMenu(true); }; });
    var names = t('menu'), dirs=['left','up','right','down','scale'];
    $('#food-grid').innerHTML = D.menu.map(function(m,i){
      var meta = [];
      if(m[2]) meta.push('<span>'+esc(t('serv.'+m[2]))+'</span>');
      if(m[4]) meta.push('<span>'+esc(fmt(t('pcs'),{n:m[4]}))+'</span>');
      if(m[5]) meta.push('<span class="rec">★ '+esc(t('rec'))+'</span>');
      var note = (m[0]===1||m[0]===2) ? '<div class="setnote">+ '+esc(t('food.setNote'))+'</div>' : '';
      var ja = lang==='ja' ? '' : '<div class="ja">'+esc(D.menuJa[i])+'</div>';
      return '<article class="dish tilt" data-cat="'+m[1]+'" data-reveal="'+dirs[i%5]+'" data-delay="'+(i%4)+'">'+
        '<span class="no">'+m[0]+'</span><div class="glyph">'+D.catKanji[m[1]]+'</div>'+
        '<h4>'+esc(names[i]||D.menuJa[i])+'</h4>'+ja+note+
        '<div class="meta">'+meta.join('')+'</div><div class="price">'+yen(m[3])+'</div><i class="steam-puff"></i></article>';
    }).join('');
    filterMenu(false); bindTilt();
  }
  function filterMenu(anim){
    $$('#food-grid .dish').forEach(function(d){
      var show = curCat==='all' || d.dataset.cat===curCat;
      d.classList.toggle('hide',!show);
      if(show && anim){ d.classList.remove('in'); void d.offsetWidth; requestAnimationFrame(function(){ d.classList.add('in'); }); }
    });
  }
  function renderDress(){
    var n = t('dress');
    $('#dress-row').innerHTML = D.dressJa.map(function(j,i){
      return '<div class="dress" data-reveal="'+(i%2?'down':'up')+'" data-delay="'+(i%4)+'"><i class="cup" style="background:'+D.dressColor[i]+'"></i><span>'+esc(n[i])+(lang==='ja'?'':'<small>'+j+'</small>')+'</span></div>';
    }).join('');
  }
  function renderCalendar(){
    var c = D.crowd, first = new Date(c.year,c.month-1,1), days = new Date(c.year,c.month,0).getDate();
    var title = first.toLocaleDateString(t('_locale'),{year:'numeric',month:'long'});
    var dows = []; for(var i=0;i<7;i++){ dows.push(new Date(2023,0,1+i).toLocaleDateString(t('_locale'),{weekday:'short'})); }
    var html = '<div class="cal-title">'+esc(title)+'</div><div class="cal-grid">'+dows.map(function(d){return '<div class="dow">'+esc(d)+'</div>';}).join('');
    for(i=0;i<first.getDay();i++) html += '<div class="d empty"></div>';
    for(var d=1; d<=days; d++){
      var cls = c.vbusy.indexOf(d)>-1?'vbusy':c.busy.indexOf(d)>-1?'busy':c.closed.indexOf(d)>-1?'closed':'';
      var lbl = cls ? t('crowd.'+cls) : '';
      html += '<div class="d '+cls+'" title="'+esc(lbl)+'" style="transition-delay:'+(d*18)+'ms">'+d+'</div>';
    }
    $('#calendar').innerHTML = html + '</div>';
  }
  function renderBus(){
    var lines = t('lines');
    $('#bus-routes').innerHTML = D.bus.map(function(b){
      var sub = [fmt(t('bus.ride'),{m:b[1]})]; if(b[2]) sub.push(fmt(t('bus.fare'),{f:b[2]})); if(b[4]) sub.push(fmt(t('bus.walk'),{w:b[4]}));
      return '<div class="route"><div class="route-head"><span>'+esc(t('bus.'+b[0]))+'</span><span class="arrow">➜</span><span>'+esc(t('bus.'+b[3]))+'</span></div>'+
        '<div class="route-sub">'+esc(sub.join(' · '))+'</div><div class="lines">'+b[5].map(function(l){return '<span>'+esc(lines[l]||L.en.lines[l])+'</span>';}).join('')+'</div></div>';
    }).join('');
  }
  function renderFaq(){
    var dirs=['left','right'];
    $('#faq-list').innerHTML = t('faq').map(function(qa,i){
      return '<div class="faq-item" data-reveal="'+dirs[i%2]+'"><button class="faq-q" aria-expanded="false"><span>'+esc(qa[0])+'</span><i></i></button><div class="faq-a"><div><p>'+esc(qa[1])+'</p></div></div></div>';
    }).join('');
    $$('.faq-q').forEach(function(b){ b.onclick=function(){ var it=b.parentNode, o=!it.classList.contains('open'); it.classList.toggle('open',o); b.setAttribute('aria-expanded',o); }; });
  }
  function renderNews(){
    var n = t('news');
    $('#news-list').innerHTML = D.news.map(function(d,i){
      return '<div class="news-item" data-reveal="'+(i%2?'right':'left')+'"><time datetime="'+d+'">'+esc(dateStr(d,{year:'numeric',month:'short',day:'numeric'}))+'</time><p>'+esc(n[i])+'</p></div>';
    }).join('');
  }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  /* ---------- language globe ---------- */
  var dock = $('#lang-dock'), gbtn = $('#globe-btn');
  $('#lang-list').innerHTML = LANGS.map(function(l){ return '<li><button role="option" data-lang="'+l[0]+'" lang="'+l[0]+'"><span>'+l[1]+'</span><small>'+l[2]+'</small></button></li>'; }).join('');
  gbtn.onclick = function(e){ e.stopPropagation(); var o=!dock.classList.contains('open'); dock.classList.toggle('open',o); gbtn.setAttribute('aria-expanded',o); };
  $$('#lang-list button').forEach(function(b){ b.onclick=function(){ setLang(b.dataset.lang); dock.classList.remove('open'); gbtn.setAttribute('aria-expanded',false); }; });
  document.addEventListener('click',function(e){ if(!dock.contains(e.target)){ dock.classList.remove('open'); gbtn.setAttribute('aria-expanded',false);} });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') dock.classList.remove('open'); });
  function setLang(l){
    if(!L[l]) return; lang=l; try{localStorage.setItem('jk-lang',l);}catch(e){}
    document.body.classList.add('lang-swap'); render();
    var u = new URL(location.href); u.searchParams.set('lang',l); history.replaceState(null,'',u);
  }
  try{ var q=new URL(location.href).searchParams.get('lang'); if(q && L[q]) lang=q; }catch(e){}

  /* ---------- reveal on scroll (in both directions) ---------- */
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); } else if(e.boundingClientRect.top>0){ e.target.classList.remove('in'); } });
  },{threshold:.12, rootMargin:'0px 0px -6% 0px'}) : null;
  function observeReveals(){ $$('[data-reveal], .calendar').forEach(function(el){ if(io && !reduce) io.observe(el); else el.classList.add('in'); }); }

  /* ---------- tilt ---------- */
  function bindTilt(){
    if(reduce || !window.matchMedia('(hover:hover)').matches) return;
    $$('.tilt').forEach(function(el){
      if(el._tilt) return; el._tilt=1;
      el.addEventListener('mousemove',function(e){ var r=el.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
        el.style.transform='perspective(800px) rotateY('+(x*10)+'deg) rotateX('+(-y*10)+'deg) translateY(-4px)'; });
      el.addEventListener('mouseleave',function(){ el.style.transform=''; });
    });
  }

  /* ---------- scroll-driven depth ---------- */
  var hero=$('#hero'), layers=$$('#hero .layer'), heroC=$('.hero-content'), cue=$('.scroll-cue');
  var zs=$('#steam'), rings=$$('.zoom-ring'), core=$('.zoom-core'), ztext=$('.zoom-text'), zsteps=$$('.zoom-steps li');
  var tun=$('#flow'), tl=$$('.t-layer'), tdots=$$('.tunnel-dots i');
  var kbg=$$('.kanji-bg'), header=$('#site-header'), prog=$('#progress');
  var navLinks=$$('#main-nav a'), secs=navLinks.map(function(a){return $(a.getAttribute('href'));});
  function prog01(el){ var r=el.getBoundingClientRect(), h=el.offsetHeight-innerHeight; return Math.min(1,Math.max(0,-r.top/(h||1))); }
  var ticking=false;
  function onScroll(){ if(!ticking){ ticking=true; requestAnimationFrame(update); } }
  function update(){
    ticking=false; var y=scrollY, vh=innerHeight;
    header.classList.toggle('scrolled', y>40);
    prog.style.transform='scaleX('+(y/(document.documentElement.scrollHeight-vh))+')';
    if(!reduce){
      // hero: fly forward through layered planes
      var p=prog01(hero);
      layers.forEach(function(l){ var d=+l.dataset.depth; l.style.transform='translate3d(0,'+(p*d*-120)+'px,0) scale('+(1+p*d*2.6)+')'; l.style.opacity = d>0.7 ? 1-p*1.2 : 1; });
      heroC.style.transform='translate3d(0,'+(-p*160)+'px,0) scale('+(1-p*.25)+')'; heroC.style.opacity=1-p*1.6; cue.style.opacity=1-p*4;
      // zoom section: rings fly outward, steamer zooms in, text pops
      var z=prog01(zs);
      rings.forEach(function(r,i){ var s=.25+z*(3+i*1.4); r.style.transform='scale('+s+') rotate('+(z*(i%2?-90:90))+'deg)'; r.style.opacity=Math.max(0,1-z*(0.8+i*.2)); });
      core.style.transform='scale('+(0.5+Math.min(z,.5)*1.3)+') translateY('+(-z*80)+'px)';
      zs.classList.toggle('lid-open', z>.18);
      var tp=Math.min(1,Math.max(0,(z-.2)/.2)); ztext.style.opacity=tp; ztext.style.transform='translateY('+((1-tp)*60)+'px) scale('+(.9+tp*.1)+')';
      zsteps.forEach(function(li,i){ li.classList.toggle('on', z > .35+i*.12); });
      // tunnel: cards travel from far depth, through the viewer
      var q=prog01(tun)*(tl.length-.15);
      tl.forEach(function(el,i){ var k=q-i; var zt=k*900-300; var op = k<-1.2?0 : k<-0.2 ? (k+1.2) : k<0.35 ? 1 : Math.max(0,1-(k-.35)*3);
        var side = (i%2?1:-1)*Math.min(1.4,Math.max(0,-k))*Math.min(380,innerWidth*.28);
        el.style.transform='translate3d('+side+'px,'+(Math.min(1.4,Math.max(0,-k))*-70)+'px,'+Math.min(zt,600)+'px) rotateY('+(side*-.05)+'deg)'; el.style.opacity=op; el.style.zIndex=10+i; el.style.pointerEvents=op>.5?'auto':'none'; });
      tdots.forEach(function(d,i){ d.classList.toggle('on', q>=i-.3); });
      // kanji parallax
      kbg.forEach(function(k){ var r=k.parentNode.getBoundingClientRect(); k.style.transform='translate3d(0,'+((r.top)*(+k.dataset.speed))+'px,0)'; });
    }
    var cur=0; secs.forEach(function(s,i){ if(s && s.getBoundingClientRect().top < vh*.4) cur=i; });
    navLinks.forEach(function(a,i){ a.classList.toggle('active', i===cur && y>vh); });
  }
  addEventListener('scroll',onScroll,{passive:true}); addEventListener('resize',onScroll);

  /* ---------- counters ---------- */
  var cio = new IntersectionObserver(function(es){ es.forEach(function(e){ if(!e.isIntersecting) return; var el=e.target, to=+el.dataset.count, s=performance.now();
    (function step(n){ var k=Math.min(1,(n-s)/1400); el.textContent=Math.round(to*(1-Math.pow(1-k,3))); if(k<1) requestAnimationFrame(step); })(s); cio.unobserve(el); }); },{threshold:.5});
  $$('[data-count]').forEach(function(el){ if(reduce) el.textContent=el.dataset.count; else cio.observe(el); });

  /* ---------- mobile nav ---------- */
  var nt=$('#nav-toggle'), nv=$('#main-nav');
  nt.onclick=function(){ var o=!nv.classList.contains('open'); nv.classList.toggle('open',o); nt.setAttribute('aria-expanded',o); };
  navLinks.forEach(function(a){ a.addEventListener('click',function(){ nv.classList.remove('open'); nt.setAttribute('aria-expanded',false); }); });

  /* ---------- map (loads on demand) ---------- */
  $('#map-load').onclick=function(){
    $('#map-frame').innerHTML='<iframe title="Map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=%E5%9C%B0%E7%8D%84%E8%92%B8%E3%81%97%E5%B7%A5%E6%88%BF%20%E9%89%84%E8%BC%AA&z=16&output=embed"></iframe>';
  };

  /* ---------- steam particles (canvas) ---------- */
  var cv=$('#steam-canvas'), cx=cv.getContext('2d'), P=[], W, H, dpr=Math.min(2,devicePixelRatio||1);
  function size(){ W=cv.width=innerWidth*dpr; H=cv.height=innerHeight*dpr; }
  size(); addEventListener('resize',size);
  var puff=document.createElement('canvas'); puff.width=puff.height=128; var pc=puff.getContext('2d');
  var g=pc.createRadialGradient(64,64,0,64,64,64); g.addColorStop(0,'rgba(255,248,236,.55)'); g.addColorStop(.5,'rgba(255,240,220,.18)'); g.addColorStop(1,'rgba(255,240,220,0)'); pc.fillStyle=g; pc.fillRect(0,0,128,128);
  function spawn(init){ return {x:Math.random()*W, y:init?Math.random()*H:H+60*dpr, r:(40+Math.random()*120)*dpr, vy:(.25+Math.random()*.7)*dpr, vx:(Math.random()-.5)*.3*dpr, a:0, life:0, max:500+Math.random()*600, w:Math.random()*6.28}; }
  var COUNT = innerWidth<700 ? 22 : 42; for(var i=0;i<COUNT;i++) P.push(spawn(true));
  var mx=-1e4, my=-1e4; addEventListener('pointermove',function(e){ mx=e.clientX*dpr; my=e.clientY*dpr; },{passive:true});
  function frame(){
    cx.clearRect(0,0,W,H);
    for(var i=0;i<P.length;i++){ var p=P[i]; p.life++; p.w+=.01; p.y-=p.vy; p.x+=p.vx+Math.sin(p.w)*.4*dpr; p.r+=.12*dpr;
      var dx=p.x-mx, dy=p.y-my, dd=dx*dx+dy*dy; if(dd<40000*dpr*dpr){ p.x+=dx*.02; p.y+=dy*.02; }
      var t1=p.life/p.max; p.a = t1<.2 ? t1/.2 : 1-(t1-.2)/.8;
      if(p.life>p.max || p.y<-p.r) P[i]=spawn(false);
      cx.globalAlpha=Math.max(0,p.a)*.22; cx.drawImage(puff,p.x-p.r,p.y-p.r,p.r*2,p.r*2); }
    if(!document.hidden) requestAnimationFrame(frame); else setTimeout(function(){requestAnimationFrame(frame);},300);
  }
  if(!reduce) requestAnimationFrame(frame);

  /* ---------- boot ---------- */
  render(); bindTilt(); update();
  addEventListener('load',function(){ setTimeout(function(){ $('#loader').classList.add('done'); },400); });
  setTimeout(function(){ $('#loader').classList.add('done'); },2500);
})();
