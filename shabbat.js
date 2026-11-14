// Grave Marker – האתר לא פועל בשבת (מכניסת שבת עד צאת השבת, לפי שעון ישראל)
(()=>{
const LAT=31.3152, LNG=34.6103, BEFORE=20, AFTER=40;   // דקות לפני השקיעה בערב שבת / אחרי השקיעה במוצאי שבת
function sunset(y,m,d){const r=Math.PI/180,N=Math.floor(275*m/9)-Math.floor((m+9)/12)*(1+Math.floor((y-4*Math.floor(y/4)+2)/3))+d-30,
  lh=LNG/15,t=N+(18-lh)/24,M=0.9856*t-3.289;let L=M+1.916*Math.sin(M*r)+0.02*Math.sin(2*M*r)+282.634;L=(L%360+360)%360;
  let RA=Math.atan(0.91764*Math.tan(L*r))/r;RA=(RA%360+360)%360;RA=(RA+Math.floor(L/90)*90-Math.floor(RA/90)*90)/15;
  const sd=0.39782*Math.sin(L*r),cd=Math.cos(Math.asin(sd)),H=Math.acos((Math.cos(90.833*r)-sd*Math.sin(LAT*r))/(cd*Math.cos(LAT*r)))/r/15;
  let UT=H+RA-0.06571*t-6.622-lh;UT=(UT%24+24)%24;return new Date(Date.UTC(y,m-1,d)+UT*3600e3)}
// התאריך והיום בשבוע בישראל
function il(t){const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Jerusalem',year:'numeric',month:'numeric',day:'numeric',weekday:'short'}).formatToParts(t).map(x=>[x.type,x.value]));
  return {y:+p.year,m:+p.month,d:+p.day,w:p.weekday}}
// מחזיר את שעת צאת השבת אם עכשיו שבת, אחרת null
function shabbatEnd(now=new Date()){const x=il(now);
  if(x.w==='Fri'){const s=sunset(x.y,x.m,x.d);if(now>=new Date(s-BEFORE*60e3)){const n=new Date(Date.UTC(x.y,x.m-1,x.d+1)),e=sunset(n.getUTCFullYear(),n.getUTCMonth()+1,n.getUTCDate());return new Date(+e+AFTER*60e3)}}
  if(x.w==='Sat'){const e=new Date(+sunset(x.y,x.m,x.d)+AFTER*60e3);if(now<e)return e}
  return null}
window.GMShabbat={shabbatEnd};
let box=null;
function check(){const end=shabbatEnd();
  if(end&&!box){box=document.createElement('div');box.id='gm-shabbat';
    box.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#1f5b57;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;font-family:Heebo,system-ui,Arial,sans-serif;direction:rtl';
    const hm=end.toLocaleTimeString('he-IL',{timeZone:'Asia/Jerusalem',hour:'2-digit',minute:'2-digit'});
    box.innerHTML=`<div style="font-size:56px;margin-bottom:12px">🕯️🕯️</div><div style="font-size:26px;font-weight:700;line-height:1.4;max-width:520px">לכבוד הנפטרים, אנחנו שומרים שבת.<br>נסו גם אתם.</div><div style="margin-top:18px;font-size:16px;opacity:.85">נחזור במוצאי שבת, בשעה ${hm}.</div><div style="margin-top:30px;font-size:14px;opacity:.7">שבת שלום</div>`;
    document.documentElement.appendChild(box);document.documentElement.style.overflow='hidden'}
  else if(!end&&box){box.remove();box=null;document.documentElement.style.overflow=''}}
if(document.documentElement)check();
document.addEventListener('DOMContentLoaded',check);
setInterval(check,60e3);
})();
