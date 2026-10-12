(() => {
  const dataCanvas = document.getElementById('dataCanvas');
  const lossCanvas = document.getElementById('lossCanvas');
  const dctx = dataCanvas.getContext('2d');
  const lctx = lossCanvas.getContext('2d');

  let points = [];
  let model = {w1: 0, w2: 0, b: 0, epoch: 0};
  let modelhistory = [];
  let losses = [];
  let running = false;
  let timer = null;

  let playing = false;

  const $ = id => document.getElementById(id);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  function resizeCanvas(c, ctx){
    const r = c.getBoundingClientRect(), dpr = devicePixelRatio || 1;
    c.width = Math.round(r.width*dpr); c.height = Math.round(r.height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function resizeAll(){ resizeCanvas(dataCanvas,dctx); resizeCanvas(lossCanvas,lctx); drawData(); drawLoss(); }
  addEventListener('resize',resizeAll);

  function worldFromCanvas(x,y){
    const r=dataCanvas.getBoundingClientRect();
    return {x:(x-r.left)/r.width*2-1, y:1-(y-r.top)/r.height*2};
  }
  function canvasFromWorld(x,y){
    const r=dataCanvas.getBoundingClientRect();
    return {x:(x+1)/2*r.width, y:(1-y)/2*r.height};
  }

  function grid(ctx,w,h){
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle='#080b10';ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='#151c25';ctx.lineWidth=1;
    for(let i=1;i<10;i++){let x=w*i/10,y=h*i/10;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
    ctx.strokeStyle='#293341';
    ctx.beginPath();ctx.moveTo(w/2,0);ctx.lineTo(w/2,h);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,h/2);ctx.lineTo(w,h/2);ctx.stroke();
  }

  function decisionY(x, offset=0){
    if(Math.abs(model.w2)<1e-8) return null;
    return -(model.w1*x+model.b+offset)/model.w2;
  }

  function drawData(){
    const r=dataCanvas.getBoundingClientRect(),w=r.width,h=r.height; grid(dctx,w,h);
    // decision boundary and margins
    if(Math.hypot(model.w1,model.w2)>1e-5 && Math.abs(model.w2)>1e-5){
      [[0,'#66e3ff',2],[1,'#667488',1],[-1,'#667488',1]].forEach(([off,col,lw])=>{
        const yL=decisionY(-1,off), yR=decisionY(1,off);
        if(yL!==null && yR!==null){
          const a=canvasFromWorld(-1,yL),b=canvasFromWorld(1,yR);
          dctx.strokeStyle=col;dctx.lineWidth=lw;dctx.setLineDash(off===0?[]:[6,6]);
          dctx.beginPath();dctx.moveTo(a.x,a.y);dctx.lineTo(b.x,b.y);dctx.stroke();dctx.setLineDash([]);
        }
      });
    }
    points.forEach(p=>{
      const q=canvasFromWorld(p.x,p.y);
      dctx.beginPath();dctx.arc(q.x,q.y,6,0,Math.PI*2);
      dctx.fillStyle=p.yLabel===1?'#66e3ff':'#ff6685';dctx.fill();
      dctx.lineWidth=2;dctx.strokeStyle='#05070a';dctx.stroke();
      if(p.support){
        dctx.beginPath();dctx.arc(q.x,q.y,10,0,Math.PI*2);dctx.strokeStyle='#ffd166';dctx.lineWidth=1.5;dctx.stroke();
      }
    });
    $('dataCount').textContent=`${points.length} points`;
  }

  function lossAndTerms(){
    let hinge=0, violations=0, svs=0, correct=0, gw=model.w1, gh=model.w2, gb=0;
    points.forEach(p=>{
      const margin=p.yLabel*(model.w1*p.x+model.w2*p.y+model.b);
      const h=Math.max(0,1-margin);
      hinge+=h;
      if(margin<=1) { violations++; gw += -getC()*p.yLabel*p.x; gh += -getC()*p.yLabel*p.y; gb += -getC()*p.yLabel; }
      if(margin<=1.000001) svs++;
      if(margin>0) correct++;
      p.support=margin<=1.000001;
    });
    return {loss:.5*(model.w1**2+model.w2**2)+getC()*hinge,gw,gh,gb,violations,svs,accuracy:points.length?correct/points.length:0};
  }
  function getC(){return +$('c').value}
  function getLR(){return +$('lr').value}

  function updateUI(terms){
    $('w1').textContent=model.w1.toFixed(4);$('w2').textContent=model.w2.toFixed(4);$('bias').textContent=model.b.toFixed(4);
    $('vw1').textContent=model.w1.toFixed(4);$('vw2').textContent=model.w2.toFixed(4);$('vb').textContent=model.b.toFixed(4);
    const norm=Math.hypot(model.w1,model.w2);$('margin').textContent=norm<1e-8?'∞':(2/norm).toFixed(4);
    $('loss').textContent=terms.loss.toFixed(4);$('violations').textContent=terms.violations;$('svs').textContent=terms.svs;$('accuracy').textContent=(terms.accuracy*100).toFixed(1)+'%';
    $('epochBadge').textContent=`Epoch ${model.epoch}`;$('status').textContent=`${running?'TRAINING':'READY'} · STEP ${model.epoch}`;
    $('progress').style.width=clamp(model.epoch/(+$('epochs').value)*100,0,100)+'%';
    drawData();drawLoss();drawMatrix();
  }

  function drawMatrix(){
    const m=$('matrix');m.innerHTML='';
    const head=['x₁','x₂','y','margin'];
    head.forEach(t=>{let e=document.createElement('div');e.className='cell head';e.textContent=t;m.appendChild(e)});
    points.slice(0,6).forEach(p=>{
      const vals=[p.x,p.y,p.yLabel,p.yLabel*(model.w1*p.x+model.w2*p.y+model.b)];
      vals.forEach(v=>{let e=document.createElement('div');e.className='cell';e.textContent=typeof v==='number'?v.toFixed(2):v;m.appendChild(e)});
    });
    if(!points.length)m.innerHTML='<div class="cell" style="grid-column:1/-1">No data — add points or generate random data.</div>';
  }

  function drawLoss(){
    const r=lossCanvas.getBoundingClientRect(),w=r.width,h=r.height;lctx.clearRect(0,0,w,h);grid(lctx,w,h);
    if(losses.length<1)return;
    const max=Math.max(...losses,1e-6), min=Math.min(...losses,0), span=Math.max(max-min,1e-6);
    lctx.strokeStyle='#66e3ff';lctx.lineWidth=2;lctx.beginPath();
    losses.forEach((v,i)=>{const x=10+(w-20)*(i/Math.max(1,losses.length-1));const y=10+(h-20)*(1-(v-min)/span);i?lctx.lineTo(x,y):lctx.moveTo(x,y)});lctx.stroke();
    lctx.fillStyle='#7f8b9a';lctx.font='10px system-ui';lctx.fillText('loss',10,13);lctx.fillText(`epoch ${losses.length}`,w-65,h-8);
  }

  function step(){
    if(!points.length) { randomData(); return }
    if(model.epoch >= +$('epochs').value) return;

    const t = lossAndTerms(), lr = getLR();

    modelhistory.push({
      w1: model.w1,
      w2: model.w2,
      b: model.b,
      epoch: model.epoch});

    model.w1 -= lr * t.gw;
    model.w2 -= lr * t.gh;
    model.b -= lr * t.gb;
    model.epoch++;

    const after = lossAndTerms();
    losses.push(after.loss);
    $('stepSummary').textContent =`Step ${model.epoch}: ${t.violations} point(s) violate or touch the margin. The gradient moves w and b to reduce hinge loss while L2 regularization keeps the weight vector controlled.`;
    $('gradientBox').innerHTML=`Gradient before update: ∇w = [${t.gw.toFixed(4)}, ${t.gh.toFixed(4)}], ∇b = ${t.gb.toFixed(4)}<br>Update: θ ← θ − η∇θ &nbsp; with &nbsp; η = ${lr.toFixed(3)}`;
    $('stateText').textContent=after.violations===0
      ? 'All training points satisfy the margin constraint. The model has reached a stable separating solution for this dataset.'
      : `The model is still correcting ${after.violations} margin violation(s). Highlighted rings identify points at or inside the margin — the support-vector region.`;
    
    updateUI(after);

    return after;
  }

  function backstep() {
     if(!points.length) { randomData(); return }
     if(model.epoch <= 0) return;

     const t = lossAndTerms(), lr = getLR();

    const last = modelhistory.pop();

    model.w1 = last.w1;
    model.w2 = last.w2;
    model.b = last.b;
    model.epoch = last.epoch;

    const after = lossAndTerms();
    losses.push(after.loss);
    $('stepSummary').textContent =`Step ${model.epoch}: ${t.violations} point(s) violate or touch the margin. The gradient moves w and b to reduce hinge loss while L2 regularization keeps the weight vector controlled.`;
    $('gradientBox').innerHTML=`Gradient before update: ∇w = [${t.gw.toFixed(4)}, ${t.gh.toFixed(4)}], ∇b = ${t.gb.toFixed(4)}<br>Update: θ ← θ − η∇θ &nbsp; with &nbsp; η = ${lr.toFixed(3)}`;
    $('stateText').textContent=after.violations===0
      ? 'All training points satisfy the margin constraint. The model has reached a stable separating solution for this dataset.'
      : `The model is still correcting ${after.violations} margin violation(s). Highlighted rings identify points at or inside the margin — the support-vector region.`;
    
    updateUI(after);

    return after;
  }

  function randomData(n=18) {
    points = [];
    for (let i=0; i<n/2; i++) {
      points.push(
        {x:(Math.random()*2)-1, 
          y:(Math.random()*2)-1,
          yLabel:-1
        });
    }
    for(let i=0;i<n/2;i++){points.push({x:(Math.random()*2)-1,y:(Math.random()*2)-1,yLabel:1})}
    resetModel(); drawData(); updateUI(lossAndTerms());
  }
  function makeSeparable(){
    points=[];
    for(let i=0;i<20;i++){
      const x=-.85+Math.random()*1.7;
      const boundary=.25*x+.03;
      const side=i<10?-1:1;
      const y=boundary+side*(.18+Math.random()*.55);
      points.push({x:clamp(x,-.92,.92),y:clamp(y,-.92,.92),yLabel:side});
    }
    resetModel();updateUI(lossAndTerms());
  }
  function resetModel(){model={w1:0,w2:0,b:0,epoch:0};losses=[];running=false;clearInterval(timer);timer=null;$('progress').style.width='0%';}
  function play(){
    if (model.epoch >= +$('epochs').value) {
      playing = false;
      $('playBtn').textContent='◼ Converged';
      return;
    }
    if (playing) {
      playing = false;
      $('playBtn').textContent='▶▶ Play Until Convergence';
    } else {
      playing = true;
      $('playBtn').textContent='⏸ Pause';
    }
    if(running){running=false;clearInterval(timer);$('status').textContent=`READY · STEP ${model.epoch}`;return}
    if(!points.length)randomData();
    running=true;$('status').textContent='TRAINING · RUNNING';
    timer=setInterval(()=>{
      const t=step();
      if(model.epoch>=+$('epochs').value || (t && t.violations===0 && model.epoch>8)){running=false;clearInterval(timer);$('status').textContent=`CONVERGED · STEP ${model.epoch}`;}
    },90);
  }

  dataCanvas.addEventListener('contextmenu',e=>e.preventDefault());
  dataCanvas.addEventListener('pointerdown',e=>{
    const p=worldFromCanvas(e.clientX,e.clientY);
    const idx=points.findIndex(q=>Math.hypot(q.x-p.x,q.y-p.y)<.075);
    if(idx>=0){points.splice(idx,1);resetModel();updateUI(lossAndTerms());return}
    points.push({x:p.x,y:p.y,yLabel:e.button===2?-1:1});resetModel();updateUI(lossAndTerms());
  });
  $('randomBtn').onclick=()=>randomData();
  $('clearBtn').onclick=()=>{points=[];resetModel();updateUI(lossAndTerms())};
  $('separableBtn').onclick=()=>makeSeparable();
  $('stepBtn').onclick=()=>{if(running) return;step()};
  $('backBtn').onclick=()=>{if(running) return;backstep()};
  $('playBtn').onclick=()=>play();

  $('lr').oninput=e=>$('lrVal').textContent=(+e.target.value).toFixed(3);
  $('c').oninput=e=>$('cVal').textContent=(+e.target.value).toFixed(2);
  $('epochs').oninput=e=>$('epochVal').textContent=e.target.value;

  randomData();
  setTimeout(resizeAll,50);
})();