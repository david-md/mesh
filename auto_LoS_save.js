javascript:(async()=>{
  const p = prompt("Enter lat1,lon1,lat2,lon2");
  if(!p) return;
  const [a,b,c,d] = p.split(/[,\s]+/).map(Number);

  const txts = [...document.querySelectorAll('input[type="text"],input[type="number"],input[type="tel"]')];

  function byLabel(t){
    t=t.toLowerCase();
    return txts.filter(i=>{
      const l=i.closest('label,div,td,section');
      return l && l.textContent.toLowerCase().includes(t);
    });
  }

  // ---- fill fields ----
  let r1=byLabel('radio 1'), r2=byLabel('radio 2');
  if(r1.length<2||r2.length<2){ r1=txts.slice(0,2); r2=txts.slice(2,4); }
  const fields=[r1[0],r1[1],r2[0],r2[1]];
  [a,b,c,d].forEach((v,i)=>{ fields[i].value=v; });
  fields.forEach(el=>{
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
  });

  // ---- click Plot GPS ----
  const btns=[...document.querySelectorAll('input[type="button"],button')];
  const plotBtn = btns.find(b=>(b.value||b.textContent||'').toLowerCase().includes('plot gps'));
  if(plotBtn) plotBtn.click();

  const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));

  // Build a safe filename: LOS_lat1_lon1__lat2_lon2_YYYYMMDD-HHMMSS
  const fmt=(x)=>Number(x).toFixed(5).replace(/[^0-9\-]/g,'_'); // keep digits and minus; swap dot with underscore
  const now=new Date();
  const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;
  const filename = `LOS_${fmt(a)}_${fmt(b)}__${fmt(c)}_${fmt(d)}_${ts}`;

  function getChartInstance(){
    if (window.chart && (typeof window.chart.exportChart==='function' || typeof window.chart.exportChartLocal==='function')) return window.chart;
    if (window.jQuery && typeof jQuery('#chartContainer').highcharts === 'function') {
      const c=jQuery('#chartContainer').highcharts(); if(c) return c;
    }
    if (window.Highcharts && Array.isArray(Highcharts.charts)) {
      for (const c of Highcharts.charts||[]) {
        try{ if(c && c.renderTo && c.renderTo.parentElement && c.renderTo.parentElement.id==='chartContainer') return c; }catch(e){}
      }
    }
    return null;
  }

  // Wait for chart to render
  let chartInst=null;
  for(let i=0;i<30;i++){ // ~15s max
    await sleep(500);
    const svgReady = document.querySelector('#chartContainer .highcharts-root, #chartContainer svg');
    chartInst = getChartInstance();
    if (svgReady && chartInst) break;
  }

  // If we have a chart, set exporting.filename so both API and menu use it
  if (chartInst) {
    try {
      chartInst.update({ exporting: { filename } }, false); // no redraw needed for filename
    } catch(e){ console.warn('Could not set exporting.filename', e); }
  }

  // Prefer programmatic export (lets us pass filename)
  try{
    if (chartInst && typeof chartInst.exportChartLocal === 'function'){
      chartInst.exportChartLocal({ type: 'image/png', filename });
      return;
    }
    if (chartInst && typeof chartInst.exportChart === 'function'){
      chartInst.exportChart({ type: 'image/png', filename });
      return;
    }
  }catch(e){
    console.warn('Highcharts export API failed, will try menu clicking', e);
  }

  // Fallback: open context menu and click "Download PNG image"
  const contextBtn = document.querySelector('#chartContainer .highcharts-contextbutton');
  if (contextBtn){
    contextBtn.dispatchEvent(new MouseEvent('click',{bubbles:true}));
    await sleep(250);
  }

  let tries=0, pngItem=null;
  while(tries++<20 && !pngItem){
    await sleep(200);
    const items = [
      ...document.querySelectorAll(
        '.highcharts-menu, .highcharts-contextmenu, .highcharts-menu-item, .highcharts-menu text, .highcharts-contextmenu span, .highcharts-contextmenu div'
      )
    ];
    pngItem = items.find(el => (el.textContent||'').toLowerCase().includes('download png'));
  }
  if (pngItem){
    pngItem.dispatchEvent(new MouseEvent('click',{bubbles:true}));
  } else {
    console.warn('Could not find "Download PNG image" menu item.');
  }
})();
