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

  // ---- NEW PART ----
  // Wait for chart to render and then auto-download PNG
  function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

  // try for up to ~10s
  for (let i=0;i<20;i++) {
    await sleep(500);

    // Look for the "Download PNG" menu item
    const menuItems = [...document.querySelectorAll("text,span,div,button")];
    const pngBtn = menuItems.find(el =>
      (el.textContent||"").toLowerCase().includes("download png")
    );

    if (pngBtn) {
      pngBtn.click();
      console.log("Clicked 'Download PNG Image'");
      break;
    }

    // Some charts hide menu behind a menu button, try opening first
    const menuToggle = menuItems.find(el =>
      (el.textContent||"").toLowerCase().includes("menu") ||
      el.className?.toLowerCase().includes("export") ||
      el.getAttribute("aria-label")?.toLowerCase().includes("menu")
    );
    if (menuToggle) {
      menuToggle.click();
      // loop will try again to find "Download PNG"
    }
  }
})();
