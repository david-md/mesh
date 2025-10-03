javascript:(async()=>{
  const p=prompt("Enter lat1,lon1,lat2,lon2");
  
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
    /* fallback by order */
    r1=txts.slice(0,2);
    r2=txts.slice(2,4);}

  r1[0].value=a;
  r1[1].value=b;
  r2[0].value=c;
  r2[1].value=d;

  txts[0].dispatchEvent(new Event('input',{bubbles:true}));

  // Try to find and click the "Plot GPS" button
  const btns = [...document.querySelectorAll('input[type="button"],button')];
  const plotBtn = btns.find(b=>b.value?.toLowerCase().includes("plot gps") ||
                               b.textContent?.toLowerCase().includes("plot gps"));
  if(plotBtn) plotBtn.click();
})();
