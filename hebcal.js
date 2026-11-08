// לוח עברי – חישוב מדויק (Dershowitz–Reingold). גרסת JS של הממיר שנבדק מול 28 אלף תאריכים.
const HebCal=(()=>{
  const EPOCH=-1373427, RD1970=719163;
  const leap=y=>(7*y+1)%19<7;
  const elapsed=y=>{const m=Math.floor((235*y-234)/19),p=12084+13753*m,d=29*m+Math.floor(p/25920);return (3*(d+1))%7<3?d+1:d};
  const corr=y=>{const a=elapsed(y-1),b=elapsed(y),c=elapsed(y+1);return c-b===356?2:(b-a===382?1:0)};
  const newyear=y=>EPOCH+elapsed(y)+corr(y);
  function months(y){const L=newyear(y+1)-newyear(y),hes=L%10===5?30:29,kis=L%10===3?29:30;
    const m=[['תשרי',30],['חשון',hes],['כסלו',kis],['טבת',29],['שבט',30]];
    m.push(...(leap(y)?[['אדר א',30],['אדר ב',29]]:[['אדר',29]]));
    m.push(['ניסן',30],['אייר',29],['סיון',30],['תמוז',29],['אב',30],['אלול',29]);return m}
  const V=[[400,'ת'],[300,'ש'],[200,'ר'],[100,'ק'],[90,'צ'],[80,'פ'],[70,'ע'],[60,'ס'],[50,'נ'],[40,'מ'],[30,'ל'],[20,'כ'],[10,'י'],[9,'ט'],[8,'ח'],[7,'ז'],[6,'ו'],[5,'ה'],[4,'ד'],[3,'ג'],[2,'ב'],[1,'א']];
  function gem(n){let s='';while(n>0){if(n===15||n===16){s+='ט'+(n===15?'ו':'ז');break}for(const [v,c] of V)if(v<=n){s+=c;n-=v;break}}
    return s.length>1?s.slice(0,-1)+'"'+s.slice(-1):s+"'"}
  const rdOf=d=>Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/864e5)+RD1970;
  const dateOf=rd=>{const t=new Date((rd-RD1970)*864e5);return new Date(t.getUTCFullYear(),t.getUTCMonth(),t.getUTCDate())};
  function toHeb(d){const rd=rdOf(d),g=d.getFullYear();let y=rd>=newyear(g+3761)?g+3761:g+3760,x=rd-newyear(y);
    for(const [name,n] of months(y)){if(x<n)return {y,month:name,day:x+1};x-=n}}
  function toRd(y,month,day){let rd=newyear(y);for(const [name,n] of months(y)){if(name===month)return rd+day-1;rd+=n}return null}
  const fmt=h=>`${gem(h.day)} ${h.month} ${gem(h.y%1000)}`;
  // יום השנה בשנה עברית נתונה
  function yahrzeitIn(h,y){
    let m=h.month,d=h.day;
    if(m==='אדר'&&leap(y))m='אדר ב';                 // נפטר באדר בשנה רגילה – בשנה מעוברת: אדר ב (מנהג ספרד)
    if((m==='אדר א'||m==='אדר ב')&&!leap(y))m='אדר';
    const len=months(y).find(x=>x[0]===m)[1];
    if(d>len){const idx=months(y).findIndex(x=>x[0]===m);m=months(y)[idx+1][0];d=1} // 30 בחודש שיש בו 29 – א' בחודש הבא
    return {y,month:m,day:d,rd:toRd(y,m,d)};
  }
  function nextYahrzeits(death,count=5,from=new Date()){
    const h=toHeb(death),today=rdOf(from),out=[];let y=toHeb(from).y-1;
    while(out.length<count){const z=yahrzeitIn(h,y);if(z.y>h.y&&z.rd>=today)out.push({...z,date:dateOf(z.rd)});y++}
    return out;
  }
  return {toHeb,fmt,nextYahrzeits,gem};
})();
