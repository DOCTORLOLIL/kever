// Grave Marker – האתר לא פועל בשבת ובחג (מ-20 דקות לפני השקיעה ועד 40 דקות אחרי השקיעה במוצאי השבת/החג, לפי שעון ישראל)
(()=>{
const LAT=31.3152, LNG=34.6103, BEFORE=20, AFTER=40;
// ימים טובים בארץ ישראל: ראש השנה (2 ימים), יום כיפור, סוכות, שמיני עצרת, פסח ראשון ושביעי, שבועות
const YT={'תשרי':[1,2,10,15,22],'ניסן':[15,21],'סיון':[6]};
function sunset(y,m,d){const r=Math.PI/180,N=Math.floor(275*m/9)-Math.floor((m+9)/12)*(1+Math.floor((y-4*Math.floor(y/4)+2)/3))+d-30,
  lh=LNG/15,t=N+(18-lh)/24,M=0.9856*t-3.289;let L=M+1.916*Math.sin(M*r)+0.02*Math.sin(2*M*r)+282.634;L=(L%360+360)%360;
  let RA=Math.atan(0.91764*Math.tan(L*r))/r;RA=(RA%360+360)%360;RA=(RA+Math.floor(L/90)*90-Math.floor(RA/90)*90)/15;
  const sd=0.39782*Math.sin(L*r),cd=Math.cos(Math.asin(sd)),H=Math.acos((Math.cos(90.833*r)-sd*Math.sin(LAT*r))/(cd*Math.cos(LAT*r)))/r/15;
  let UT=H+RA-0.06571*t-6.622-lh;UT=(UT%24+24)%24;return new Date(Date.UTC(y,m-1,d)+UT*3600e3)}
function il(t){const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Jerusalem',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(t).map(x=>[x.type,x.value]));
  return new Date(Date.UTC(+p.year,+p.month-1,+p.day))}   // התאריך האזרחי בישראל (חצות UTC)
const add=(d,n)=>new Date(+d+n*864e5);
function holiday(d){if(typeof HebCal==='undefined')return false;const h=HebCal.toHeb(new Date(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()));return (YT[h.month]||[]).includes(h.day)}
const closed=d=>d.getUTCDay()===6||holiday(d);
const ss=d=>sunset(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate());
// מחזיר {end, chag} אם עכשיו סגור, אחרת null
function state(now=new Date()){const x=il(now);let start=null;
  if(closed(x)&&now<new Date(+ss(x)+AFTER*60e3))start=x;
  else if(closed(add(x,1))&&now>=new Date(+ss(x)-BEFORE*60e3))start=add(x,1);
  if(!start)return null;
  let e=start,chag=holiday(start);while(closed(add(e,1))){e=add(e,1);chag=chag||holiday(e)}
  // אם היום כבר באמצע רצף (למשל יום ב' של ראש השנה) – גם הימים הקודמים קובעים אם זה חג
  for(let b=add(start,-1);closed(b);b=add(b,-1))chag=chag||holiday(b);
  return {end:new Date(+ss(e)+AFTER*60e3),chag}}
window.GMShabbat={state,shabbatEnd:n=>state(n)?.end||null};
let box=null;
function check(){const s=state();
  if(s&&!box){box=document.createElement('div');box.id='gm-shabbat';
    box.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#1f5b57;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;font-family:Heebo,system-ui,Arial,sans-serif;direction:rtl';
    const hm=s.end.toLocaleTimeString('he-IL',{timeZone:'Asia/Jerusalem',hour:'2-digit',minute:'2-digit'});
    box.innerHTML=`<div style="font-size:56px;margin-bottom:12px">🕯️🕯️</div><div style="font-size:26px;font-weight:700;line-height:1.4;max-width:520px">לכבוד הנפטרים, אנחנו שומרים ${s.chag?'את החג':'שבת'}.<br>נסו גם אתם.</div><div style="margin-top:18px;font-size:16px;opacity:.85">נחזור ב${s.chag?'מוצאי החג':'מוצאי שבת'}, בשעה ${hm}.</div><div style="margin-top:30px;font-size:14px;opacity:.7">${s.chag?'חג שמח':'שבת שלום'}</div>`;
    document.documentElement.appendChild(box);document.documentElement.style.overflow='hidden'}
  else if(!s&&box){box.remove();box=null;document.documentElement.style.overflow=''}}
// לוח השנה העברי: אם הדף טוען אותו בעצמו – מחכים לו; אחרת טוענים פעם אחת
function boot(){if(typeof HebCal!=='undefined')return check();const sc=document.createElement('script');sc.src='/hebcal.js';sc.onload=check;sc.onerror=check;document.head.appendChild(sc)}
check();   // שבת רגילה לא צריכה את לוח השנה
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
setInterval(check,60e3);
})();
