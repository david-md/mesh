javascript:(async()=>{
  const p = prompt("Enter lat1,lon1,lat2,lon2");
  if (!p) return;
  const [a,b,c,d] = p.split(/[,\s]+/).map(Number);

  const txts = [...document.querySelectorAll('input[type="text"],input[type="number"]')];

  function byLabel(t){
    t=t.toLowerCase();
    return txts.filter(i=>{
      const l=i.closest('label,div,td,section');
      return l && l.textContent.toLowerCase().includes(t);
    });
  }

  let r1=byLabel('radio 1'),
      r2=byLabel('radio 2');

  if(r1.length<2||r2.length<2){
    // fallback by order
    r1=txts.slice(0,2);
    r2=txts.slice(2,4);
  }

  r1[0].value=a; r1[1].value=b;
  r2[0].value=c; r2[1].value=d;

  // fire input/change events so the site registers
  for (const el of [r1[0],r1[1],r2[0],r2[1]]) {
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
  }

  // Click Plot GPS
  const btns = [...document.querySelectorAll('input[type="button"],button')];
  const plotBtn = btns.find(b=>b.value?.toLowerCase().includes("plot gps") ||
                               b.textContent?.toLowerCase().includes("plot gps"));
  if(plotBtn) plotBtn.click();

  // ---- helpers ----
  const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));

  function getChartInstance(){
    // 1) global variable created by the page's script
    if (window.chart && (typeof window.chart.exportChart==='function' || typeof window.chart.exportChartLocal==='function')) return window.chart;

    // 2) jQuery wrapper
    if (window.jQuery && typeof jQuery('#chartContainer').highcharts === 'function') {
      const c = jQuery('#chartContainer').highcharts();
      if (c) return c;
    }

    // 3) scan Highcharts registry for the one inside #chartContainer
    if (window.Highcharts && Array.isArray(Highcharts.charts)) {
      for (const c of Highcharts.charts){
        try{
          if (c && c.renderTo && c.renderTo.parentElement && c.renderTo.parentElement.id==='chartContainer') return c;
        }catch(e){}
      }
    }
    return null;
  }

  // ---- wait for chart to render ----
  let chartInst=null;
  for(let i=0;i<30;i++){ // up to ~15s
    await sleep(500);
    // presence of SVG container is a good sign
    const svgReady = document.querySelector('#chartContainer .highcharts-root, #chartContainer svg');
    chartInst = getChartInstance();
    if (svgReady && chartInst) break;
  }

  if (!chartInst){
    // fallback: try clicking the context button anyway
    const ctxBtn = document.querySelector('#chartContainer .highcharts-contextbutton');
    if (ctxBtn) ctxBtn.dispatchEvent(new MouseEvent('click',{bubbles:true}));
  }

  // ---- try programmatic export first (most reliable) ----
  try{
    if (chartInst && typeof chartInst.exportChartLocal === 'function'){
      chartInst.exportChartLocal({ type: 'image/png' });
      return;
    }
    if (chartInst && typeof chartInst.exportChart === 'function'){
      chartInst.exportChart({ type: 'image/png' });
      return;
    }
  }catch(e){
    console.warn('Highcharts export API failed, will try menu clicking', e);
  }

  // ---- fallback: open menu and click "Download PNG image" ----
  // 1) open the menu
  const contextBtn = document.querySelector('#chartContainer .highcharts-contextbutton');
  if (contextBtn) {
    contextBtn.dispatchEvent(new MouseEvent('click',{bubbles:true}));
    await sleep(200);
  }

  // 2) find the menu item (different Highcharts builds place it in a <div> or <g>)
  // Match any element whose text includes 'Download PNG'
  let tried=0, pngItem=null;
  while(tried++<20 && !pngItem){
    await sleep(250);
    const items = [
      ...document.querySelectorAll('.highcharts-menu-item, .highcharts-contextmenu span, .highcharts-contextmenu div, .highcharts-menu text')
    ];
    pngItem = items.find(el => (el.textContent||'').toLowerCase().includes('download png'));
  }

  if (pngItem){
    pngItem.dispatchEvent(new MouseEvent('click',{bubbles:true}));
  } else {
    console.warn('Could not find "Download PNG image" menu item.');
  }
})();