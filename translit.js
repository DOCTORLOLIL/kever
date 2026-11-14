// Grave Marker – תעתיק של טקסט מנוקד לאותיות לועזיות/קיריליות, והשמעה בקול
(()=>{
// השמעה כבויה: אי אפשר להבטיח קול גברי מקולות המכשיר. תופעל עם הקלטות בקול גברי בלבד.
const SPEAK=false;   // יודלק אחרי שפונקציית tts תעלה
const TTS='https://vqydrrhgklikhfdsgrwr.supabase.co/functions/v1/smooth-handler', TTS_KEY='sb_publishable_w6o5yCjbhBkuJ2FREujpHA_1V8ZcY0C';
const DAG='ּ', SHIN='ׁ', SIN='ׂ', HOLAM='ֹ', HOLAM_V='ֺ', SHVA='ְ';
const V={'ַ':'a','ָ':'a','ֲ':'a','ֶ':'e','ֵ':'e','ֱ':'e','ִ':'i','ֹ':'o','ֺ':'o','ֳ':'o','ֻ':'u','ׇ':'o'};
const isL=c=>c>='א'&&c<='ת';
// סכמות: מה כותבים לכל צליל
const S={
  lat:{b:'b',v:'v',g:'g',d:'d',h:'h',z:'z',ch:'ch',t:'t',y:'y',k:'k',l:'l',m:'m',n:'n',s:'s',p:'p',f:'f',ts:'ts',r:'r',sh:'sh',a:'a',e:'e',i:'i',o:'o',u:'u',ap:"'",adonai:'Adonai',yi:'i'},
  cyr:{b:'б',v:'в',g:'г',d:'д',h:'х',z:'з',ch:'х',t:'т',y:'й',k:'к',l:'л',m:'м',n:'н',s:'с',p:'п',f:'ф',ts:'ц',r:'р',sh:'ш',a:'а',e:'е',i:'и',o:'о',u:'у',ap:'',adonai:'Адонай',yi:'й'}};
function word(w,sc){
  // פירוק לאותיות עם הסימנים שעליהן
  const L=[];for(const c of w){if(isL(c))L.push({c,m:''});else if(L.length&&c>='֑'&&c<='ׇ')L[L.length-1].m+=c}
  if(!L.length)return w;
  // שם השם (יהוה) נקרא "אדוני"
  const bare=L.map(x=>x.c).join(''), k=bare.indexOf('יהוה');
  if(k>=0&&k<=1){const pre=k?word([...w].slice(0,[...w].findIndex((c,j)=>j>0&&isL(c))).join(''),sc):'';return pre+sc.adonai}
  let out='';
  for(let i=0;i<L.length;i++){const {c,m}=L[i],last=i===L.length-1,dag=m.includes(DAG);
    let vow='';for(const ch of m)if(V[ch]){vow=V[ch];break}
    const shva=m.includes(SHVA);
    let cons='';
    switch(c){
      case 'א':case 'ע':cons='';break;
      case 'ב':cons=dag?'b':'v';break;case 'ג':cons='g';break;case 'ד':cons='d';break;
      case 'ה':cons=(last&&!dag&&!vow)?'':'h';break;
      case 'ו':{
        const marks=m.replace(/[\u0591-\u05AF\u05BD\u05C3]/g,'');
        if(dag&&!vow&&!shva){out+=sc.u;continue}                                  // שורוק
        if(vow==='o'&&(marks===HOLAM||marks===HOLAM_V)){out+=sc.o;continue}       // חולם מלא
        cons='v';break}
      case 'ז':cons='z';break;case 'ח':cons='ch';break;case 'ט':cons='t';break;
      case 'י':
        if(!vow&&!shva&&!dag&&i>0&&!(L[i+1]&&L[i+1].c==='ו'&&/[\u05B9\u05BA\u05BC]/.test(L[i+1].m))){const pv=[...L[i-1].m].map(x=>V[x]).find(Boolean);if(pv==='i'){continue}if(pv==='e'){if([...L[i-1].m].includes('\u05B5'))out+=sc.yi;continue}if(pv==='a'||pv==='o'||pv==='u'){out+=sc.yi;continue}}
        cons='y';break;
      case 'כ':case 'ך':cons=dag?'k':'ch';break;case 'ל':cons='l';break;case 'מ':case 'ם':cons='m';break;
      case 'נ':case 'ן':cons='n';break;case 'ס':cons='s';break;
      case 'פ':case 'ף':cons=dag?'p':'f';break;case 'צ':case 'ץ':cons='ts';break;case 'ק':cons='k';break;case 'ר':cons='r';break;
      case 'ש':cons=m.includes(SIN)?'s':'sh';break;case 'ת':cons='t';break}
    // פתח גנובה: ח/ע/ה בסוף מילה עם פתח – התנועה לפני העיצור
    if(last&&vow==='a'&&(c==='ח'||c==='ע'||(c==='ה'&&dag))){out+=sc.a+(cons?sc[cons]:'');continue}
    if(cons)out+=sc[cons];
    if(vow)out+=sc[vow];
    else if(shva&&i===0&&cons)out+=sc.e;           // שווא נע בתחילת מילה
    else if(shva&&i>0&&L[i-1].m.includes(SHVA)&&!last)out+=sc.e; // שווא שני ברצף – נע
  }
  return out;
}
function translit(text,scheme='lat'){const sc=S[scheme]||S.lat;
  const t=text.replace(/\s*\([^()]*\)/g,m=>/[\u05B0-\u05BB\u05C7]/.test(m)?m:'').replace(/ה['׳](?=[\s,.:;]|$)/g,'יהוה').replace(/[֑-ֽֿ֯׀׃-׆]/g,m=>m==='־'?' ':'') // טעמים, מתג, פסק
             .replace(/־/g,' ');
  const res=t.split(/(\s+|[.,:;!?״"'()\-–—]+)/).map(p=>/[א-ת]/.test(p)?word(p,sc):p).join('');
  return res.charAt(0).toUpperCase()+res.slice(1)}

// ---------- השמעה ----------
let speaking=false, audio=null;
// קול גברי בלבד: קובצי קול שנוצרים בשרת. אין שימוש בקולות המכשיר.
async function clip(text){const r=await fetch(TTS,{method:'POST',headers:{'content-type':'application/json',apikey:TTS_KEY},body:JSON.stringify({text})});
  const j=await r.json();if(!r.ok||!j.url)throw new Error(j.error||'tts');return j.url}
async function speak(els,btn){
  if(speaking){speaking=false;audio?.pause();btn.textContent='🔊 השמעה';els.forEach(e=>e.classList.remove('reading'));return}
  speaking=true;btn.textContent='⏹ עצירה';
  let next=els.length?clip(els[0].dataset.say||els[0].innerText).catch(()=>null):null;
  for(let i=0;i<els.length&&speaking;i++){const e=els[i];const url=await next;
    next=i+1<els.length?clip(els[i+1].dataset.say||els[i+1].innerText).catch(()=>null):null;   // מכינים את הבא מראש
    if(!url){if(i===0){alert('ההשמעה לא זמינה כרגע. נסו שוב מאוחר יותר.');break}continue}
    e.classList.add('reading');e.scrollIntoView({behavior:'smooth',block:'center'});
    await new Promise(res=>{audio=new Audio(url);audio.onended=audio.onerror=res;audio.play().catch(res)});
    e.classList.remove('reading')}
  speaking=false;btn.textContent='🔊 השמעה'}

// ---------- חיבור לדף ----------
// bar: איפה לשים את הכפתורים, items: הפסוקים/השורות
function attach({bar,items,root}){
  const st=document.createElement('style');st.textContent='.gm-tr{direction:ltr;text-align:left;font-family:system-ui,Arial,sans-serif;font-size:calc(15px * var(--z,1));color:var(--mute,#6d6a64);margin:-2px 0 8px;line-height:1.5}.reading{background:rgba(224,168,58,.25);border-radius:6px}.gm-tools{display:flex;gap:6px;flex-wrap:wrap}.gm-tools button{font:inherit;border:1px solid var(--line,#ccc);background:var(--card,#fff);color:var(--ink,#222);border-radius:8px;padding:4px 12px;cursor:pointer}.gm-tools button.on{background:var(--acc,#1f5b57);color:#fff;border-color:var(--acc,#1f5b57)}';
  document.head.appendChild(st);
  const host=document.querySelector(bar);if(!host)return;
  const box=document.createElement('span');box.className='gm-tools';
  const lang=(navigator.language||'').slice(0,2), def=lang==='ru'?'cyr':'lat';
  let mode=null;try{mode=localStorage.getItem('gmTr')}catch{} if(mode==='null')mode=null;
  box.innerHTML=`${SPEAK?'<button type="button" id="gmSay">🔊 השמעה</button>':''}<button type="button" id="gmLat">Abc</button><button type="button" id="gmCyr">Абв</button>`;
  host.prepend(box);
  const sel=()=>[...document.querySelectorAll(items)];
  let draw=()=>{document.querySelectorAll('.gm-tr').forEach(e=>e.remove());
    box.querySelector('#gmLat').classList.toggle('on',mode==='lat');box.querySelector('#gmCyr').classList.toggle('on',mode==='cyr');
    if(!mode)return;for(const e of sel()){const d=document.createElement('div');d.className='gm-tr';d.textContent=translit(e.innerText,mode);e.after(d)}};
  const set=m=>{mode=mode===m?null:m;try{localStorage.setItem('gmTr',mode)}catch{}draw()};
  box.querySelector('#gmLat').onclick=()=>set('lat');box.querySelector('#gmCyr').onclick=()=>set('cyr');
  if(SPEAK)box.querySelector('#gmSay').onclick=e=>speak(sel(),e.currentTarget);
  // כשהטקסט נטען/מתחלף – מעדכנים את התעתיק
  const r=document.querySelector(root||'body');
  const ob=new MutationObserver(()=>{ob.disconnect();draw();ob.observe(r,{childList:true})});
  const draw0=draw;draw=()=>{ob.disconnect();draw0();ob.observe(r,{childList:true})};
  ob.observe(r,{childList:true});
  if(mode===null&&lang!=='he'&&lang)mode=def;  // מי שהדפדפן שלו לא בעברית – מקבל תעתיק כברירת מחדל
  draw();
}
window.GMTranslit={translit,attach};
})();
