// 麻醉誘島主程式：three.js 3D 島嶼、小麻、書本閱讀、題目。
// 以一般 <script> 載入（包在 async 函式裡），雙擊 index.html 直接開也能跑。
(async () => {
"use strict";
const D = window.ISLAND_DATA;
const QB = window.ISLAND_QBANK;
const SYS = D.sys, T = D.topics, L = D.links;
const ISLAND_DEF=[{k:1,name:"評估給藥島",short:"評估・給藥",ic:"💉",sids:["preop","pharm","monitor","equip","pos"]},
  {k:2,name:"器官系統島",short:"器官系統",ic:"🫀",sids:["resp","cv","neuro","gi","renal"]},
  {k:3,name:"術後疼痛照護島",short:"疼痛照護",ic:"🌿",sids:["pain"]},
  {k:4,name:"模擬開刀房島",short:"模擬開刀房",ic:"🏥",sids:[],room:true},
  {k:5,name:"專科照護島",short:"專科照護",ic:"🤰",sids:["ob","age","endoc"]},
  {k:6,name:"重症安全島",short:"重症安全",ic:"🚑",sids:["fluid","icu","safety"]},
  {k:7,name:"專科手術島",short:"專科手術",ic:"🦴",sids:["cts","thor","nsx","ortho","plast","gsx","uro","eye","ent","trauma","amb"]}];
const byId = Object.fromEntries(T.map(t=>[t.id,t]));
const sysById = Object.fromEntries(SYS.map(s=>[s.id,s]));
const $ = id => document.getElementById(id);
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const refInfo = r => { const m=/^(\d{3})([GA])(\d+)$/.exec(r); return {y:+m[1], s:m[2]==="G"?"通論":"進階", full:m[2]==="G"?"專科護理通論":"進階專科護理", n:+m[3]}; };
const done = new Set(); try{ JSON.parse(localStorage.getItem("ai-done")||"[]").forEach(r=>done.add(r)); }catch(e){}
const saveDone = () => { try{ localStorage.setItem("ai-done",JSON.stringify([...done])); }catch(e){} };
const topicsOf = sid => T.filter(t=>t.sys===sid).sort((a,b)=>b.refs.length-a.refs.length);
const mgLabel = t => "";

/* AI 猜題分到最相關的主題(與該題相似考古題重疊最多者) */
const AIBY = {}; // topicId -> [{sid,i}]
SYS.forEach(s=>s.aiq.forEach((q,i)=>{ let best=null,bn=0; if(q.t&&T.some(t=>t.id===q.t)){ (AIBY[q.t]=AIBY[q.t]||[]).push({sid:s.id,i}); return; } const ts0=topicsOf(s.id), hasOrig=ts0.some(t=>!t.mg), mq=/^Morgan/.test(q.src||""); ts0.filter(t=>(hasOrig&&!mq)?!t.mg:true).forEach(t=>{ const n=q.refs.filter(r=>t.refs.includes(r)).length; if(n>bn){bn=n;best=t.id;} }); if(best) (AIBY[best]=AIBY[best]||[]).push({sid:s.id,i}); }));

/* ---------- stats ---------- */
const nRefs = new Set(T.flatMap(t=>t.refs)).size;
$("stats").innerHTML = [[SYS.length,"個街區"],[T.length,"本書"],[nRefs,"題歷屆考題"],[SYS.reduce((a,s)=>a+s.aiq.length,0),"題 AI 猜題"]]
  .map(([n,l])=>`<div class="stat"><b>${n}</b><span>${l}</span></div>`).join("");

/* ---------- list view ---------- */
function renderList(){
  const sysOrd=ISLAND_DEF.flatMap(I=>I.sids.map(id=>({I,s:SYS.find(x=>x.id===id)}))).filter(x=>x.s);
  $("viewList").innerHTML = sysOrd.map(({I,s},n)=>{ const ts=topicsOf(s.id); const head=(n===0||sysOrd[n-1].I!==I)?`<h3 class="islh">${I.ic} ${I.k}. ${I.name}</h3>`:"";
    return head+(()=>{
    return `<section class="syscol" style="--c:var(--${s.id})"><h4>${s.name}<small>${s.en}</small></h4>${OVERVIEW[s.id]?`<button type="button" data-ov="${s.id}" style="font-weight:600;color:#8A5A1A">📖 ${OVERVIEW[s.id].title}</button>`:""}${ts.map(t=>`<button type="button" data-book="${t.id}">📕 ${t.name}<span class="n">${t.refs.length} 題</span></button>`).join("")}</section>`; })(); }).join("");
  $("viewList").querySelectorAll("[data-book]").forEach(b=>b.onclick=()=>openBook(b.dataset.book));
  $("viewList").querySelectorAll("[data-ov]").forEach(b=>b.onclick=()=>openOverview(b.dataset.ov));
}
renderList();
function setView(v){ document.body.classList.toggle("immersive",v==="3d"); $("v3d").setAttribute("aria-pressed",v==="3d"); $("vList").setAttribute("aria-pressed",v==="list"); $("viewIsland").hidden=v!=="3d"; $("viewList").hidden=v!=="list"; if(v==="3d") window.dispatchEvent(new Event("resize")); }
$("v3d").onclick=()=>setView("3d"); $("vList").onclick=()=>setView("list");
document.body.classList.add("immersive");
/* 右上角選單收合(手機預設收起;記住使用者的選擇) */
{ const btn=$("menuToggle"); const set=(open,save)=>{ document.body.classList.toggle("tools-closed",!open); btn.setAttribute("aria-expanded",open); btn.setAttribute("aria-label",open?"收合選單":"展開選單"); btn.textContent=open?"✕ 收合":"☰ 選單";
    if(!open) document.querySelectorAll(".toolbar .wxbar").forEach(b=>b.classList.add("closed")); if(save) try{ localStorage.setItem("island-menu",open?"open":"closed"); }catch(e){} };
  let saved=null; try{ saved=localStorage.getItem("island-menu"); }catch(e){}
  set(saved?saved==="open":window.innerWidth>700,false); btn.onclick=()=>set(document.body.classList.contains("tools-closed"),true); window.__menuOpen=()=>set(true,false); }
$("wxToggle").onclick=()=>{ const c=$("wxbar").classList.toggle("closed"); $("wxToggle").setAttribute("aria-expanded",!c); };
/* ---------- 金幣與小麻技能 ---------- */
const SKILLS=[
  {id:"stool",cost:30,ic:"🪑",name:"坐椅子滑",desc:"點麻醉機旁的黑色椅子,坐著滑來滑去"},
  {id:"iv",cost:50,ic:"🩺",name:"拉點滴架",desc:"點麻醉機旁的點滴架,拉著它滑來滑去"},
  {id:"face",cost:100,ic:"😊",name:"自選表情",desc:"用「表情」按鈕指定小麻的表情"},
  {id:"freeswim",cost:150,ic:"🏊",name:"游泳",desc:"換泳裝戴蛙鏡,自己下海游自由式"},
  {id:"swim",cost:200,ic:"🐬",name:"下班騎海豚",desc:"換泳裝、戴蛙鏡,騎海豚繞島"},
  {id:"fish",cost:250,ic:"🎣",name:"海邊釣魚",desc:"走到沙灘邊甩竿,會釣到各種海洋生物"},
  {id:"sail",cost:350,ic:"⛵",name:"下班開帆船",desc:"穿夏威夷花襯衫開帆船"},
  {id:"dance",cost:500,ic:"💃",name:"跳舞",desc:"點小麻,她會開心跳一段舞"},
  {id:"gold",cost:800,ic:"👑",name:"金色手術帽",desc:"手術帽換成閃亮的金色"}];
/* ---------- 裝扮小麻:手術帽顏色、手術衣顏色、飾品(可多選)、臉上刺青(存在 localStorage 的 island-look) ---------- */
const LOOK_CAPS={green:{c:0x5DAE8B,css:"#5DAE8B",n:"經典綠"},blue:{c:0x4A90D9,css:"#4A90D9",n:"天空藍"},navy:{c:0x2F4A7A,css:"#2F4A7A",n:"深藍"},pink:{c:0xF29BB8,css:"#F29BB8",n:"粉紅"},purple:{c:0x9B7FD1,css:"#9B7FD1",n:"薰衣草紫"},yellow:{c:0xF2C94C,css:"#F2C94C",n:"檸檬黃"},red:{c:0xE05B5B,css:"#E05B5B",n:"番茄紅"},black:{c:0x3A3F4B,css:"#3A3F4B",n:"黑色"},white:{c:0xF4F4F4,css:"#F4F4F4",n:"白色"},
  dots:{pat:1,css:"#4A90D9",n:"藍底點點"},hearts:{pat:1,css:"#FBE3EA",n:"愛心印花"},stars:{pat:1,css:"#2F4A7A",n:"星星印花"}};
const LOOK_SCRUBS={teal:{c:0x7EC4CF,c2:0x63B0BD,css:"#7EC4CF",n:"湖水藍"},sky:{c:0x9FC9F0,c2:0x7FAFDD,css:"#9FC9F0",n:"天藍"},navy:{c:0x34507F,c2:0x283F66,css:"#34507F",n:"海軍藍"},green:{c:0x5E9E7E,c2:0x4B8667,css:"#5E9E7E",n:"手術綠"},wine:{c:0x9A4258,c2:0x7F3347,css:"#9A4258",n:"酒紅"},pink:{c:0xF2A7BE,c2:0xE08CA6,css:"#F2A7BE",n:"粉紅"},purple:{c:0x8C78C9,c2:0x7462B0,css:"#8C78C9",n:"紫色"},gray:{c:0x8A929C,c2:0x727A84,css:"#8A929C",n:"灰色"},black:{c:0x34383F,c2:0x26292F,css:"#34383F",n:"黑色"}};
const LOOK_ACC=[["bow","🎀","蝴蝶結"],["flower","🌸","小花髮夾"],["star","⭐","星星髮夾"],["glasses","👓","眼鏡"],["earring","⚪","珍珠耳環"],["necklace","📿","珍珠項鍊"],["mask","😷","外科口罩"]];
const LOOK_TAT=[["none","✖️","不要"],["heart","❤️","愛心"],["star","⭐","星星"],["flower","🌸","小花"],["butterfly","🦋","蝴蝶"],["bolt","⚡","閃電"],["moon","🌙","月亮"],["cross","➕","小紅十字"],["dot","•","淚痣"]];
function lookClean(L){ L=L&&typeof L==="object"?L:{}; return {cap:LOOK_CAPS[L.cap]?L.cap:"green",scrub:LOOK_SCRUBS[L.scrub]?L.scrub:"teal",acc:(Array.isArray(L.acc)?L.acc:[]).filter(k=>LOOK_ACC.some(a=>a[0]===k)).slice(0,LOOK_ACC.length),tat:LOOK_TAT.some(t=>t[0]===L.tat)?L.tat:"none"}; }
let LOOK=lookClean(null); try{ LOOK=lookClean(JSON.parse(localStorage.getItem("island-look")||"null")); }catch(e){}
/* ---------- 收集冊:撿到、釣到、浮潛抓到的東西都收在這裡(存在 localStorage 的 island-bag) ----------
   r = 稀有度(1 常見、2 少見、3 稀有);med = 會從海裡釣到/浮潛撿到/漂流瓶開出來的醫療收藏品
   之後模擬手術室要用到這些收藏品時,用名稱 n 當 key 讀 island-bag 即可。 */
const COLLECT=[
  {c:"海洋生物",items:[["小丑魚","🐠",1],["藍倒吊","🐟",1],["鯖魚","🐟",1],["河豚","🐡",2],["小章魚","🐙",2],["螃蟹","🦀",2],["海星","⭐",1],["貝殼","🐚",1],["寄居蟹","🦀",2],["小魚","🐟",1],["小蝦","🦐",1],["蝌蚪","🐸",1],["海馬","🦄",3],["金色鯛魚","✨",3]]},
  {c:"沙灘小物",items:[["莓果","🍒",1],["椰子","🥥",1],["舊靴子","🥾",1],["漂流瓶","🍾",2],["珍珠","🦪",3]]},
  {c:"麻醉藥物",med:"drug",items:[["Propofol","🥛",1],["Etomidate","💉",2],["Ketamine","💉",2],["Midazolam","💉",1],["Dexmedetomidine","💉",2],["Remimazolam","💉",3],["Fentanyl","💉",1],["Morphine","💉",1],["Remifentanil","💉",2],["Meperidine","💉",2],["Sevoflurane","🟡",1],["Desflurane","🔵",2],["Isoflurane","🟣",2],["Rocuronium","💉",1],["Cisatracurium","💉",2],["Succinylcholine","💉",2],["Sugammadex","💉",2],["Neostigmine","💉",1],["Glycopyrrolate","💉",2],["Atropine","💉",1],["Lidocaine","💉",1],["Bupivacaine","💉",1],["Ropivacaine","💉",2],["Naloxone","💉",2],["Flumazenil","💉",2],["Dantrolene","🧪",3],["Ondansetron","💉",1],["Dexamethasone","💉",1],["Intralipid 20%","🥛",3]]},
  {c:"升壓與降壓藥",med:"vaso",items:[["Ephedrine","💉",1],["Phenylephrine","💉",1],["Epinephrine","💉",1],["Norepinephrine","💉",2],["Vasopressin","💉",2],["Dopamine","💉",2],["Dobutamine","💉",2],["Milrinone","💉",3],["Nitroglycerin","💉",2],["Labetalol","💉",1],["Esmolol","💉",2],["Nicardipine","💉",2],["Hydralazine","💉",2],["Nitroprusside","💉",3]]},
  {c:"呼吸道與管路",med:"line",items:[["Endo 3.0","🫁",2],["Endo 3.5","🫁",2],["Endo 4.0","🫁",2],["Endo 4.5","🫁",2],["Endo 5.0","🫁",2],["Endo 5.5","🫁",2],["Endo 6.0","🫁",1],["Endo 6.5","🫁",1],["Endo 7.0","🫁",1],["Endo 7.5","🫁",1],["Endo 8.0","🫁",1],["雙腔管 DLT","🫁",3],["LMA","🫁",1],["FloTrac","📈",2],["Trachway","📹",2],["喉頭鏡","🔦",1],["影像喉頭鏡","📹",2],["Bougie","🪄",2],["A-line","🩸",1],["CVC","🩺",2],["PICC","🩺",2],["IV 18G","💧",1],["IV 20G","💧",1],["IV 22G","💧",1],["Foley","💧",1]]},
  {c:"監測與保溫備品",med:"line",items:[["BIS","🧠",2],["NMT","⚡",2],["溫毯被","🛏️",1]]},
  {c:"血品",med:"blood",items:[["PRBC","🩸",1],["FFP","🟨",1],["Platelet","🟡",2],["Cryoprecipitate","🧊",3],["Albumin","🥛",2]]},
  {c:"手術室夥伴與設備",med:"card",items:[["麻醉主治醫師","👨‍⚕️",3],["麻醉巡迴員","👩‍⚕️",3],["CRNA 學姊","👩‍⚕️",2],["外科醫師","🧑‍⚕️",2],["刷手護理師","🧑‍⚕️",2],["升降椅","🪑",2],["點滴架","🩺",1],["電擊器","⚡",3]]}];
const COL_BY={}; COLLECT.forEach(g=>g.items.forEach(([n,ic,r])=>COL_BY[n]={n,ic,r,c:g.c,med:g.med}));
const COL_MED=COLLECT.filter(g=>g.med).flatMap(g=>g.items.map(([n])=>COL_BY[n]));
const COL_W={1:10,2:4,3:1};
function rollMed(){ const tot=COL_MED.reduce((a,it)=>a+COL_W[it.r],0); let r=Math.random()*tot; for(const it of COL_MED){ r-=COL_W[it.r]; if(r<=0) return it; } return COL_MED[0]; }
let BAGD={}; try{ BAGD=JSON.parse(localStorage.getItem("island-bag")||"{}")||{}; }catch(e){}
function colAdd(n){ BAGD[n]=(BAGD[n]||0)+1; try{ localStorage.setItem("island-bag",JSON.stringify(BAGD)); }catch(e){}
  const tot=Object.keys(COL_BY).length, got=Object.keys(COL_BY).filter(k=>BAGD[k]).length; return BAGD[n]===1?`🆕 新收集!收集冊 ${got}/${tot}`:`收集冊裡有 ${BAGD[n]} 個`; }
function colIcon(n){ return (COL_BY[n]||{}).ic||"🎁"; }
function openCollection(){ const tot=Object.keys(COL_BY).length, got=Object.keys(COL_BY).filter(k=>BAGD[k]).length; const m=document.createElement("div"); m.className="about colbook";
  const extra=Object.keys(BAGD).filter(k=>!COL_BY[k]&&BAGD[k]);
  const grid=(items)=>`<div class="colgrid">${items.map(n=>{ const it=COL_BY[n]||{n,ic:"🎁",r:1}, c=BAGD[n]||0; return `<div class="colit${c?"":" no"} r${it.r}"><span class="ic">${c?it.ic:"❔"}</span><b>${c?it.n:"???"}</b><small>${c?"× "+c:["","常見","少見","稀有"][it.r]}</small></div>`; }).join("")}</div>`;
  m.innerHTML=`<div class="box" role="dialog" aria-modal="true" aria-label="收集冊"><button class="x" type="button" aria-label="關閉">✕</button><h2>📒 收集冊</h2>
    <p class="meta">已收集 ${got}/${tot} 種。撿貝殼、搖樹叢、釣魚、浮潛、打開漂流瓶都可能拿到;藥物、管路、血品與手術室夥伴之後會在模擬手術室派上用場。</p>
    ${COLLECT.map(g=>{ const n=g.items.filter(([k])=>BAGD[k]).length; return `<h3 class="colh">${g.c} <small>${n}/${g.items.length}</small></h3>${grid(g.items.map(([k])=>k))}`; }).join("")}
    ${extra.length?`<h3 class="colh">其他</h3>${grid(extra)}`:""}</div>`;
  const close=()=>m.remove(); m.onclick=e=>{ if(e.target===m) close(); }; m.querySelector(".x").onclick=close; document.body.appendChild(m); }
const COIN=new Set(); try{ JSON.parse(localStorage.getItem("island-coins")||"[]").forEach(k=>COIN.add(k)); }catch(e){}
done.forEach(r=>COIN.add("q:"+r));
let BONUS=0; try{ BONUS=parseFloat(localStorage.getItem("island-bonus")||"0")||0; }catch(e){}   // 零錢:埋藏金幣與浮潛金幣 +0.05、撿垃圾 +0.1、垃圾被海鷗或海龜吃掉 −0.1(下班活動的金幣額度比答題少很多)
const coins=()=>Math.round((COIN.size*10+BONUS)*100)/100;
/* 測試模式只給網站管理者:用專屬網址 /anesthesia-island/<金鑰>(或 ?dev=<金鑰>)開一次,這台瀏覽器就會記住(?dev=off 關閉)。程式裡只存金鑰的 SHA-256。 */
const DEV_HASH="574cbccffe2edf1a9c544ade3f8e123a8fffb1b2afff7104c0e20a123d60a981";   // 也可以打開 /anesthesia-island/<鑰匙>(由 404.html 處理)
let DEV=false; try{ DEV=localStorage.getItem("island-dev")==="1"; if(DEV&&localStorage.getItem("island-dev-new")==="1"){ localStorage.removeItem("island-dev-new"); setTimeout(()=>toast("🧪 已開啟管理者測試模式(只在這台瀏覽器)"),1500); } }catch(e){}
let TESTMODE=false; try{ if(DEV) TESTMODE=localStorage.getItem("island-test")!=="0"; }catch(e){}
{ const q=new URLSearchParams(location.search), key=q.get("dev");
  if(key!==null){ const clean=()=>{ q.delete("dev"); try{ history.replaceState(null,"",location.pathname+(q.toString()?"?"+q:"")+location.hash); }catch(e){} };
    if(key==="off"){ DEV=false; TESTMODE=false; try{ localStorage.removeItem("island-dev"); localStorage.removeItem("island-test"); }catch(e){} clean(); }
    else if(window.crypto&&crypto.subtle) crypto.subtle.digest("SHA-256",new TextEncoder().encode(key.trim().toLowerCase())).then(buf=>{ const hex=[...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,"0")).join(""); clean();
      if(hex===DEV_HASH){ DEV=true; TESTMODE=true; try{ localStorage.setItem("island-dev","1"); localStorage.removeItem("island-test"); }catch(e){} renderSkills(); toast("🧪 已開啟管理者測試模式(只在這台瀏覽器)"); } }); } }
function hasSkill(id){ if(TESTMODE) return true; const k=SKILLS.find(x=>x.id===id); return !k||coins()>=k.cost; }
// 在模擬手術室(含恢復室)裡不跳金幣、撿垃圾之類的通知,免得干擾情境
function orQuiet(){ const w=window.__world; try{ return !!(w&&((w.inSuite&&w.inSuite())||(w.inOR&&w.inOR()))); }catch(e){ return false; } }
function toast(html,cls){ if(orQuiet()&&(cls==="coin"||/金幣|垃圾|解鎖新技能|class="gc"/.test(String(html)))) return; let box=document.querySelector(".toasts"); if(!box){ box=document.createElement("div"); box.className="toasts"; document.body.appendChild(box); }
  const t=document.createElement("div"); t.className="toast "+(cls||""); t.innerHTML=html; box.appendChild(t); setTimeout(()=>{ t.style.transition="opacity .4s"; t.style.opacity=0; setTimeout(()=>t.remove(),450); },Math.max(cls==="unlock"?5500:4200, (t.textContent||"").length*140)); }
function lockMsg(id){ const k=SKILLS.find(x=>x.id===id); toast(`🔒 ${k.ic} ${k.name} 需要累積 ${k.cost} 金幣(目前 ${coins()})<br><small>去書裡練習考古題和 AI 猜題,答對就有金幣</small>`); }
function award(key){ const w=window.__world; if(COIN.has(key)){ w&&w.react("right"); return; }
  const before=coins(); COIN.add(key); try{ localStorage.setItem("island-coins",JSON.stringify([...COIN])); }catch(e){}
  const after=coins(); toast(`<i class="gc" aria-hidden="true"></i> +10 金幣 · 共 ${after}`,"coin"); w&&w.react("right");
  SKILLS.filter(k=>before<k.cost&&after>=k.cost).forEach((k,i)=>setTimeout(()=>{ toast(`🎉 解鎖新技能:${k.ic} ${k.name}!`,"unlock"); w&&w.react("unlock"); },900+i*600));
  renderSkills(); }
function addBonus(v,why){ const before=coins(); BONUS=Math.round((BONUS+v)*100)/100; if(coins()<0) BONUS=-COIN.size*10; try{ localStorage.setItem("island-bonus",String(BONUS)); }catch(e){}
  const after=coins(); toast(`<i class="gc" aria-hidden="true"></i> ${why||""} ${v<0?"−"+(-v):"+"+v} 金幣 · 共 ${after}`,v<0?"":"coin"); const w=window.__world; w&&w.react(v<0?"wrong":"right");
  SKILLS.filter(k=>before<k.cost&&after>=k.cost).forEach((k,i)=>setTimeout(()=>{ toast(`🎉 解鎖新技能:${k.ic} ${k.name}!`,"unlock"); w&&w.react("unlock"); },900+i*600)); renderSkills(); }
function wrongAns(){ const w=window.__world; w&&w.react("wrong"); }
function aiAnswer(key,k){ const [sid,i]=key.split(":"); const q=sysById[sid]&&sysById[sid].aiq[+i]; if(!q) return; if(q.a===k) award("ai:"+key); else wrongAns(); }
function renderSkills(){ const n=coins(); $("coinToggle").innerHTML=`<i class="gc" aria-hidden="true"></i> ${n}`; const next=SKILLS.find(k=>k.cost>n); const prev=[...SKILLS].reverse().find(k=>k.cost<=n);
  const p=next?Math.round((n-(prev?prev.cost:0))/(next.cost-(prev?prev.cost:0))*100):100;
  $("skillbar").innerHTML=`<div class="sk-head"><b><i class="gc" aria-hidden="true"></i> ${n} 金幣</b><div class="sk-bar"><i style="width:${p}%"></i></div><small>${next?`再 ${next.cost-n} 金幣解鎖 ${next.ic} ${next.name}`:"全部技能都解鎖了!"}<br>書裡的歷屆考古題和 AI 猜題,每答對一題 +10 金幣(每題只算一次)</small></div>`+
    (DEV?`<label class="sk-test"><input type="checkbox" id="testMode"${TESTMODE?" checked":""}> 🧪 測試模式(全部技能先解鎖,只有管理者看得到)</label>`:"")+
    SKILLS.map(k=>{ const ok=TESTMODE||n>=k.cost; return `<button type="button" class="sk${ok?"":" lock"}" data-sk="${k.id}"${ok?"":" aria-disabled=\"true\""}><span class="ic">${ok?k.ic:"🔒"}</span><span><b>${k.name}</b><small>${k.desc}</small></span><span class="tag">${ok?"使用":`${k.cost} <i class="gc" aria-hidden="true"></i>`}</span></button>`; }).join(""); }
renderSkills(); window.__coins=coins;
$("skillbar").addEventListener("change",e=>{ if(e.target.id!=="testMode"||!DEV) return; TESTMODE=e.target.checked; try{ localStorage.setItem("island-test",TESTMODE?"1":"0"); }catch(x){} renderSkills(); toast(TESTMODE?"🧪 測試模式開啟:全部技能可用":"測試模式關閉:技能依金幣解鎖"); }); window.__aiA=(key)=>{ const [sid,i]=key.split(":"); return sysById[sid].aiq[+i].a; };
$("skillbar").addEventListener("click",e=>{ const b=e.target.closest("[data-sk]"); if(!b) return; const id=b.dataset.sk; if(!hasSkill(id)){ lockMsg(id); return; } const w=window.__world; if(!w) return;
  $("skillbar").classList.add("closed"); $("coinToggle").setAttribute("aria-expanded",false);
  if(id==="stool") w.goStool(); else if(id==="iv") w.goIV(); else if(id==="face") $("faceToggle").click(); else if(id==="swim"||id==="sail"||id==="freeswim") w.offStart(id==="swim"?"swim":id==="sail"?"hawaii":"free"); else if(id==="dance") w.dance(); else if(id==="fish") w.fishStart(); else if(id==="gold") w.toggleGold(); });
{ const box=$("islbar"); box.insertAdjacentHTML("beforeend",ISLAND_DEF.map((I,i)=>`<button type="button" class="islbtn" data-isl="${i}"><b>${I.ic} ${I.k}. ${I.name}</b><small>${I.sids.map(id=>(sysById[id]||{}).name).filter(Boolean).join("・")}</small></button>`).join(""));
  box.addEventListener("click",e=>{ const b=e.target.closest("[data-isl]"); if(!b||!window.__world) return; window.__world.goIsland(+b.dataset.isl,true); box.classList.add("closed"); $("islToggle").setAttribute("aria-expanded",false); }); }
/* ---------- 模擬開刀房情境 ---------- */
/* 模擬開刀房情境題庫
   每個情境 = 病人背景 + 數個步驟;每個步驟有「狀況」「問題」「四個選項」。
   start / effect 可設定的病人反應:
     hr 心跳, sbp/dbp 血壓, spo2 血氧, etco2 潮氣末二氧化碳, rr 呼吸次數, temp 體溫
     skin: "normal" 正常 | "pale" 蒼白 | "cyan" 發紺 | "flush" 潮紅
     alarm: true/false 監視器警報;  shake: true/false 病人顫抖
   ok:true 的選項是正確答案;fb 是作答後顯示的說明。 */
const OR_SCENARIOS=window.ISLAND_SCENARIOS||[];   // 題目在 data/scenarios.js

const ORV0={hr:72,sbp:118,dbp:72,spo2:99,etco2:35,rr:12,temp:36.5,skin:"normal",alarm:false,shake:false,rhythm:"sinus"};
const ORVF={hr:190,sbp:38,dbp:18,spo2:60,etco2:8,rr:0,skin:"cyan",alarm:true,shake:false,rhythm:"vf"};          // 選到致命選項:先心室顫動
const ORDEAD={hr:0,sbp:0,dbp:0,spo2:0,etco2:0,rr:0,skin:"cyan",alarm:true,shake:false,rhythm:"asystole"};   // 然後一直線
const ORS={sc:null,idx:-1,node:null,n:0,end:null,V:{...ORV0},T:{...ORV0},picked:null,ck:new Set(),miss:0,raf:0,wasIn:false};
function orPush(){ const w=window.__world; if(w) w.orSet(ORS.V); }
function orSetTarget(o,instant){ Object.assign(ORS.T,o); ["skin","alarm","shake","rhythm"].forEach(k=>{ if(o[k]!==undefined) ORS.V[k]=o[k]; }); if(instant) Object.assign(ORS.V,ORS.T); orPush(); }
function orLoop(){ const V=ORS.V,T=ORS.T; ["hr","sbp","dbp","spo2","etco2","rr","temp"].forEach(k=>{ const d=T[k]-V[k]; if(Math.abs(d)>.05) V[k]+=d*.05; else V[k]=T[k]; });
  orPush(); const vit=$("orPanel").querySelector(".vit"); if(vit) vit.innerHTML=orVitHTML();
  //小麻一走進手術室就自動開始一題
  { const w=window.__world, inside=!!(w&&w.inOR&&w.inOR()); if(inside&&!ORS.wasIn&&NET.role!=="guest") orAuto(); ORS.wasIn=inside; }
  if(NET.role==="host"&&ORS.sc){ const now=performance.now(); if(now-(ORS.vSent||0)>250){ ORS.vSent=now; netSend({t:"v",V:["hr","sbp","dbp","spo2","etco2","rr","temp"].map(k=>Math.round(V[k]*10)/10),s:V.skin,al:!!V.alarm,sh:!!V.shake,rh:V.rhythm}); } }
  ORS.raf=requestAnimationFrame(orLoop); }
function orVitHTML(){ const V=ORS.V, cell=(n,v,bad)=>`<div class="${bad?"bad":""}">${n}<b>${v}</b></div>`;
  return cell("HR",Math.round(V.hr),V.hr>120||V.hr<50)+cell("BP",`${Math.round(V.sbp)}/${Math.round(V.dbp)}`,V.sbp<80)+cell("SpO₂",Math.round(V.spo2)+"%",V.spo2<90)+cell("EtCO₂",Math.round(V.etco2),V.etco2<25||V.etco2>50)+cell("RR",Math.round(V.rr),V.rr<6)+cell("體溫",V.temp.toFixed(1),V.temp<35.5||V.temp>38.3); }
/* ---------- ACLS:任何情境走到心跳停止,都接進這段流程(依 AHA 成人 ACLS 心跳停止流程;兒童改用 PALS 劑量) ---------- */
const ACLS_CK=["立即高品質胸外按壓、呼救、接上去顫器","正確判讀可電擊/不可電擊心律","電擊與 epinephrine 的時機正確","每 2 分鐘檢查心律、按壓少中斷","依 H 與 T 找並處理可逆原因","恢復循環後的照護"];
function aclsNodes(sc){ const A=sc.acls||{rhythm:"vf"}, P=!!A.peds, kg=A.kg||20, dead="dead";
  const cpr=P?"立刻開始高品質胸外按壓(100–120 次/分、胸廓前後徑約 1/3、每次完全回彈、兩人急救 15:2,插管後持續按壓並每 2–3 秒通氣一次)、呼救、接上去顫器":"立刻開始高品質胸外按壓(100–120 次/分、深 5–6 cm、每次完全回彈、儘量不中斷),呼叫急救小組,接上去顫器";
  const epi=A.epi||(P?`epinephrine 0.01 mg/kg(${(kg*.01).toFixed(2)} mg)IV,每 3–5 分鐘一次`:"epinephrine 1 mg IV,之後每 3–5 分鐘一次");
  const sh1=P?`電擊 2 J/kg(${kg*2} J)`:"電擊一次(雙相 120–200 J,依機型建議;不確定就用最大能量)", sh2=P?`電擊 4 J/kg(${kg*4} J)`:"再電擊一次(同等或更高能量)";
  const aa=A.aa||(P?`amiodarone 5 mg/kg(${kg*5} mg)IV 或 lidocaine 1 mg/kg`:"amiodarone 300 mg IV(或 lidocaine 1–1.5 mg/kg)");
  const fx=A.fix||"處理可逆原因";
  const vfV={hr:200,sbp:22,dbp:10,spo2:0,etco2:14,rr:0,skin:"cyan",alarm:true,shake:false,rhythm:"vf"};
  const peaV={hr:48,sbp:0,dbp:0,spo2:0,etco2:12,rr:0,skin:"cyan",alarm:true,shake:false,rhythm:"pea"};
  const rosc={ story:"恢復自發循環:EtCO₂ 突然升到 40 mmHg,摸得到頸動脈脈搏,血壓 86/50 mmHg,心跳 108 次/分,病人仍昏迷。",
    v:{hr:108,sbp:86,dbp:50,spo2:94,etco2:40,rr:12,skin:"pale",alarm:true,rhythm:"sinus"},
    q:"恢復循環後的照護,何者正確?",
    options:[
      {t:"給 100% O₂ 讓 SpO₂ 維持 100%,並過度換氣把 PaCO₂ 降到 25 mmHg",to:dead,fb:"高氧與過度換氣都對腦不好;腦血管收縮加上反覆低血壓,病人再次心跳停止,這次沒有救回來。"},
      {t:"維持 SpO₂ 92–98%、PaCO₂ 35–45 mmHg;以輸液與升壓劑維持收縮壓 ≥90、平均動脈壓 ≥65 mmHg;12 導程心電圖;處理原因("+fx+");昏迷者做目標溫度管理並避免發燒,送加護病房",ok:true,to:"win",ck:["a5"],fb:"正確。恢復循環後的重點是避免缺氧與高氧、維持灌流、處理原因、保護腦部。"},
      {t:"血壓 86/50 還可以,先觀察不處理",to:dead,fb:"恢復循環後的低血壓會讓腦與心臟再次缺血,病人再度心跳停止,這次沒有救回來。"},
      {t:"既然救回來了,立刻拔管送一般病房",to:dead,fb:"病人仍昏迷、循環不穩,拔管後呼吸道阻塞並再次心跳停止。"}
    ]};
  if(A.rhythm==="vf") return {
    cpr:{ story:"病人沒有脈搏。監視器是不規則、沒有 QRS 波的波形。",v:vfV,
      q:"第一步最適當的處置是?",
      options:[
        {t:"先給 "+(P?"epinephrine":"epinephrine 1 mg")+",看反應再決定要不要按壓",to:dead,fb:"每延遲一分鐘按壓與電擊,存活率就明顯下降。"},
        {t:cpr,ok:true,to:"v2",ck:["a0"],fb:"正確。發現沒有脈搏就立刻按壓、呼救,並盡快接上去顫器。"},
        {t:"先做 12 導程心電圖確認心律",to:dead,fb:"心跳停止時不做 12 導程,延誤按壓與電擊。"},
        {t:"給 atropine 1 mg",to:dead,fb:"Atropine 不在心跳停止的流程裡,而且延誤了按壓與電擊。"}
      ]},
    v2:{ story:"去顫器貼片貼好了,按壓中短暫停下來看心律:心室顫動。",v:vfV,
      q:"下一步是?",
      options:[
        {t:"做同步電擊(synchronized cardioversion)",to:dead,fb:"心室顫動沒有 QRS 波可以同步,機器不會放電,延誤了電擊。"},
        {t:"先摸脈搏 1 分鐘確認",to:dead,fb:"心律已經看到了,檢查脈搏不超過 10 秒;延誤電擊。"},
        {t:sh1+",電擊後立刻接續按壓 2 分鐘,不先檢查脈搏與心律",ok:true,to:"v3",ck:["a1","a3"],fb:"正確。可電擊心律盡快電擊,電擊後直接按壓,不要停下來看。"},
        {t:"給 amiodarone 後再電擊",to:dead,fb:"可電擊心律第一優先是電擊,不是藥物。"}
      ]},
    v3:{ story:"按壓 2 分鐘後檢查心律:仍是心室顫動。已有靜脈管路,病人已插管、EtCO₂ 18 mmHg。",v:vfV,
      q:"下一步是?",
      options:[
        {t:sh2+",立刻繼續按壓;按壓中給 "+epi+";插管後持續按壓不中斷,每 6 秒給一次通氣",ok:true,to:"v4",ck:["a2","a3"],fb:"正確。第二次電擊後開始給 epinephrine,按壓不為了給藥或通氣而中斷。"},
        {t:"改用 vasopressin 40 U 取代 epinephrine",to:dead,fb:"Epinephrine 才是建議的血管加壓劑,vasopressin 不建議取代或合併使用。"},
        {t:"停止按壓 30 秒,讓大家確認管路與用藥",to:dead,fb:"按壓中斷讓冠狀動脈與腦灌流歸零,存活率下降。"},
        {t:"給 sodium bicarbonate 與 calcium 作為常規急救藥",to:dead,fb:"心跳停止時不常規給 bicarbonate 與 calcium(除非有特定原因,例如高血鉀)。"}
      ]},
    v4:{ story:"又過了 2 分鐘,仍是心室顫動(已電擊 2 次、給過一次 epinephrine)。",v:vfV,
      q:"下一步是?",
      options:[
        {t:"已經急救 6 分鐘,停止急救",to:dead,fb:"頑固性心室顫動仍有機會救回,而且原因還沒處理。"},
        {t:"不再電擊,改只給藥物",to:dead,fb:"心室顫動時電擊是最有效的處置,不能停。"},
        {t:"給 adenosine 6 mg",to:dead,fb:"Adenosine 用於穩定的心室上頻脈,對心室顫動沒有作用。"},
        {t:"再電擊,繼續按壓;給 "+aa+";同時依 H 與 T 找可逆原因並處理:"+fx,ok:true,to:"rosc",ck:["a2","a4"],fb:"正確。第三次電擊後給抗心律不整藥,同時一定要處理造成心跳停止的原因。"}
      ]},
    rosc};
  return {
    cpr:{ story:P?"心跳掉到 40 次/分以下,摸不到脈搏,病人沒有反應。":"病人沒有脈搏。",v:peaV,
      q:"第一步最適當的處置是?",
      options:[
        {t:"先給 atropine,看心跳會不會回來",to:dead,fb:(P?"兒童心跳 <60 次/分合併灌流不良就要開始按壓;":"")+"延誤按壓,存活率明顯下降。"},
        {t:"先插管(或重新確認管路)再開始按壓",to:dead,fb:"按壓不能等呼吸道處理完才開始。"},
        {t:cpr,ok:true,to:"p2",ck:["a0"],fb:"正確。"+(P?"兒童心跳 <60 次/分合併灌流不良,給氧通氣後仍未改善就開始按壓。":"發現沒有脈搏就立刻按壓、呼救、接去顫器。")},
        {t:"先量一次血壓確認",to:dead,fb:"心跳停止的判斷不靠血壓計,延誤了按壓。"}
      ]},
    p2:{ story:"去顫器接好,按壓中短暫停下來看心律:監視器上有規則的 QRS 波,但摸不到脈搏(無脈性電氣活動)。",v:peaV,
      q:"下一步是?",
      options:[
        {t:"電擊 200 J",to:dead,fb:"無脈性電氣活動與心搏停止是不可電擊的心律。"},
        {t:"不可電擊心律:繼續按壓,盡快給 "+epi+";每 2 分鐘檢查心律",ok:true,to:"p3",ck:["a1","a2","a3"],fb:"正確。不可電擊心律盡快給 epinephrine。"},
        {t:"給 atropine 1 mg,每 3–5 分鐘重複",to:dead,fb:"Atropine 已經不在無脈性電氣活動與心搏停止的流程裡。"},
        {t:"放經皮心律調節器",to:dead,fb:"心跳停止時經皮心律調節沒有效果,還延誤了按壓與 epinephrine。"}
      ]},
    p3:{ story:"按壓 2 分鐘後檢查心律:仍是無脈性電氣活動。",v:peaV,
      q:"下一步是?",
      options:[
        {t:"給 amiodarone 300 mg",to:dead,fb:"抗心律不整藥用在可電擊心律,不是無脈性電氣活動。"},
        {t:"停止按壓,等心臟超音波確認",to:dead,fb:"超音波可以輔助找原因,但不能讓按壓長時間中斷。"},
        {t:"繼續按壓與 epinephrine,同時依 H 與 T 找可逆原因並處理:"+fx,ok:true,to:"rosc",ck:["a3","a4"],fb:"正確。無脈性電氣活動能不能救回來,關鍵在找到並處理原因。"},
        {t:"已經按壓 4 分鐘,停止急救",to:dead,fb:"原因還沒處理就放棄,太早了。"}
      ]},
    rosc};
}
const orWon=(c)=>COIN.has("scn:"+c.id+":win");
const SEEN=(()=>{ try{ return new Set(JSON.parse(localStorage.getItem("island-scn-seen")||"[]")); }catch(e){ return new Set(); } })();
const orSeen=(c)=>SEEN.has(c.id)||orWon(c), markSeen=(c)=>{ SEEN.add(c.id); try{ localStorage.setItem("island-scn-seen",JSON.stringify([...SEEN])); }catch(e){} };
function orOpen(){ const P0=$("orPanel"); P0.classList.remove("min"); const mb=P0.querySelector(".mini"); if(mb) mb.textContent="▾"; P0.hidden=false; document.body.classList.add("or-run"); }
const orHead=(kick)=>`<button class="x" type="button" aria-label="關閉">✕</button><button class="mini" type="button" aria-label="收起或展開">▾</button><div class="kick">${kick}</div>`;
function orWire(P){ P.querySelector(".x").onclick=orClose; P.querySelector(".mini").onclick=()=>{ const m=P.classList.toggle("min"); P.querySelector(".mini").textContent=m?"▴":"▾"; }; }
function orMenu(){ if(NET.role==="guest"){ toast("👥 連線中,情境由邀請你的人開始"); return; } const P=$("orPanel"); orOpen(); ORS.sc=null; ORS.end=null; orSetTarget({...ORV0},false);
  P.innerHTML=orHead("🏥 模擬開刀房 · OSCE 情境")+`<div class="cols"><div><h3>選一個情境</h3>
    <p class="pt">每個狀況有四個處置可選,每個處置會把病人帶到不同的狀況;選錯還有一次補救機會,再錯病人就會死亡。每個情境限時 1 分 30 秒;連線時隊友從背包拿對東西,可以多 10 秒。生命徵象看麻醉機上的監視器。</p></div><div>`+
    OR_SCENARIOS.map((c,i)=>orSeen(c)?`<button type="button" class="scn" data-s="${i}"><b>${orWon(c)?"✅ ":"📝 "}${c.title}${c.tag?`<span class="tag">${c.tag}</span>`:""}</b><small>${c.patient}</small></button>`
      :`<button type="button" class="scn" data-s="${i}"><b>❔ 尚未練習的情境 ${i+1}</b><small>練習過之後才會顯示題目</small></button>`).join("")+`<p class="pt">已練習 ${OR_SCENARIOS.filter(orSeen).length} / ${OR_SCENARIOS.length} 題</p></div></div>`;
  orWire(P); P.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>orStart(+b.dataset.s)); netSendOR("menu"); }
//小麻走進手術室就隨機出一題(先出還沒通關的,不連續出同一題)
function orAuto(){ if(ORS.sc||!$("orPanel").hidden||!OR_SCENARIOS.length) return; const all=OR_SCENARIOS.map((c,i)=>i);
  let pool=all.filter(i=>!orWon(OR_SCENARIOS[i])&&i!==ORS.idx); if(!pool.length) pool=all.filter(i=>i!==ORS.idx); if(!pool.length) pool=all;
  orStart(pool[Math.floor(Math.random()*pool.length)]); }
const orShuffle=(n)=>{ const a=[...Array(n).keys()]; for(let i=n-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
function orStart(n){ if(NET.role==="guest") return; orOpen(); const w=window.__world; if(w){ w.orReset&&w.orReset(); if(w.inOR&&!w.inOR()) w.goIsland(3); }
  ORS.cprOn=false; ORS.idx=n; ORS.sc=OR_SCENARIOS[n]; ORS.nodes={...ORS.sc.nodes,...aclsNodes(ORS.sc)}; ORS.acls=false; ORS.help=false; ORS.node=ORS.sc.start; ORS.n=1; ORS.end=null; ORS.miss=0; ORS.ck=new Set(); ORS.last=null; ORS.log=[]; ORS.logK=[]; ORS.isbar=null; ORS.isbarK=null; ORS.assist=[]; ORS.gift={}; ORS.bonus=[]; ORS.bdv={}; ORS.bagOpen=false; ORS.helpT=new Set();
  ORS.tEnd=performance.now()+OR_TOTAL; ORS.tRun=true;
  Object.assign(ORS.V,ORV0); Object.assign(ORS.T,ORV0); orStep(); }
function orStep(){ const nd=ORS.nodes[ORS.node]; { const w=window.__world, inArrest=/^(cpr|v\d|p\d)$/.test(String(ORS.node)); if(w&&w.orCPR&&inArrest!==!!ORS.cprOn){ ORS.cprOn=inArrest; w.orCPR(inArrest); } } ORS.order=orShuffle(nd.options.length); orSetTarget(orBonusV({...ORV0,...nd.v}),!ORS.last); orRender(); }
/* ---------- 計時:每個情境題限時 1 分 30 秒(OSCE 的時間壓力),畫面只顯示一個倒數 ----------
   時間到:這一站結束(「⏱️ 時間到」,不算病人死亡)。推去恢復室和 ISBAR 交班不計時。
   朋友從背包拿出這題用得到的東西,加 10 秒(同一樣東西只加一次)。 */
const OR_TOTAL=90000, OR_PLUS=10000;
const orMMSS=(ms)=>{ const t=Math.max(0,Math.ceil(ms/1000)); return Math.floor(t/60)+":"+String(t%60).padStart(2,"0"); };
function orTimerHTML(){ return `<div class="ortimer" aria-live="off"></div>`; }
function orTimerPaint(tl){ const el=$("orPanel").querySelector(".ortimer"); if(!el) return; el.innerHTML=`<span class="${tl<20000?"low":""}">⏱️ <b>${orMMSS(tl)}</b></span><i style="width:${Math.max(0,Math.min(100,tl/OR_TOTAL*100))}%"></i>`; }
function orTimerTick(){ const now=performance.now();
  if(NET.role==="guest"){ const g=NET.orT; if(g&&g.run) orTimerPaint(g.tEnd-now); return; }
  if(!ORS.sc||ORS.end||!ORS.tRun) return; const tl=ORS.tEnd-now;
  if(tl<=0){ orTimeUp(); return; } orTimerPaint(tl); }
setInterval(orTimerTick,250);
function orTimeUp(){ ORS.tRun=false; orEnd("time","⏱️ 1 分 30 秒到了,這一站時間結束。"); }
// 朋友從背包拿出這題用得到的東西(bonus 或這個狀況能用的):加 10 秒
function orHelpTime(n){ if(!ORS.sc||ORS.end||!ORS.tRun||!COL_BY[n]) return; const nd=ORS.nodes[ORS.node];
  const useful=!!orBonusFor(ORS.sc,n,ORS.node)||(nd&&(nd.use||[]).some(u=>u.n===n)); if(!useful||ORS.helpT.has(n)) return;
  ORS.helpT.add(n); ORS.tEnd+=OR_PLUS; toast(`⏱️ 隊友拿對東西(${colIcon(n)} ${esc(n)}),多 10 秒!`,"unlock"); netSendOR("q"); }
// 有人喊「呼救」:廣播「麻醉科 1 房需要幫忙」,麻醉主治醫師與三位麻醉專科護理師衝進來
function orCallHelp(){ if(ORS.help) return; ORS.help=true; const w=window.__world; w&&w.orHelp&&w.orHelp(); orHelpBanner(); }
function orHelpBanner(){
  let bn=document.querySelector(".orcall"); if(!bn){ bn=document.createElement("div"); bn.className="orcall"; document.body.appendChild(bn); }
  bn.textContent="📢 麻醉科 1 房需要幫忙!麻醉科 1 房需要幫忙!"; bn.classList.remove("show"); void bn.offsetWidth; bn.classList.add("show");
  try{ const on=/開/.test(($("sndToggle")||{}).textContent||""); if(on&&window.speechSynthesis){ const u=new SpeechSynthesisUtterance("麻醉科一房需要幫忙,麻醉科一房需要幫忙"); u.lang="zh-TW"; u.rate=1.05; speechSynthesis.speak(u); } }catch(e){} }
function orFlash(){ let f=document.querySelector('.orflash'); if(!f){ f=document.createElement('div'); f.className='orflash'; document.body.appendChild(f); } f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); toast('⚡ 電擊!所有人離開病床!'); }
const HELP_RE=/呼救|呼叫急救小組|請求協助|call help/i;   // 只有選項裡有「呼救 / call help」時,麻醉科才會進來幫忙
/* ---------- 情境題的心電圖:畫在心電圖紙上(25 mm/s、10 mm/mV),讓玩家自己判讀 ----------
   狀況的 ecg 欄位:{t:種類, lead:"II"|"V5", mm:ST 偏移(mm), pvc:true 夾雜心室早期收縮, hr:心跳(預設用 v.hr)}
   t:sinus 竇性、stdep ST 段水平下降、stelev ST 段上升、pvc 頻發心室早期收縮、peakedT T 波高尖+QRS 變寬、
     wide 寬 QRS、vt 心室頻脈連發、vf 心室顫動、pea 無脈搏電氣活動(有規則的波形但沒有脈搏)、asystole 心搏停止
   心跳停止的狀況(ACLS)不用寫,會依 v.rhythm 自動畫。圖下只標導程與紙速,不寫判讀結果。 */
function orEcg(nd){ if(!nd) return null; if(nd.ecg) return nd.ecg; const r=nd.v&&nd.v.rhythm; return (r==="vf"||r==="pea"||r==="asystole")?{t:r,lead:"II"}:null; }
function ecgSVG(e,hr0){ const T=e.t, HR=Math.max(20,Math.min(220,e.hr||hr0||75)), SEC=6, PXS=100, Y0=70, MV=40, W=SEC*PXS, H=120;
  const G=(t,c,w,a)=>a*Math.exp(-((t-c)*(t-c))/(2*w*w));
  const wideQ=T==="wide"||T==="peakedT", stmm=(T==="stdep"?-1:T==="stelev"?1:0)*(e.mm||2);
  // 一個正常(或變形)的心跳,t 是這一下開始後的秒數
  const beat=(t)=>{ const qw=T==="wide"?.03:T==="peakedT"?.02:.01, P=T==="peakedT"?.06:.13;
    let v=G(t,.09,.024,P)+G(t,.2,qw*.9,-.12)+G(t,.225,qw,wideQ?.85:1.15)+G(t,.255+(wideQ?qw*1.4:0),qw,-.28);
    if(T==="peakedT") v+=G(t,.43,.034,.95); else if(T==="stelev") v+=G(t,.44,.06,.32); else v+=G(t,.45,.05,T==="stdep"?.12:.28);
    if(stmm){ const s0=.27+(wideQ?.03:0), k=t<s0?0:t<s0+.015?(t-s0)/.015:t<.42?1:t<.52?1-(t-.42)/.1:0; v+=stmm*.1*k; }
    if(T==="wide") v+=G(t,.5,.07,-.18);
    return v; };
  const pvc=(t)=>G(t,.08,.045,-.35)+G(t,.14,.05,1.35)+G(t,.36,.08,-.5);
  const vtb=(t)=>G(t,.06,.05,1.25)+G(t,.2,.06,-.55);
  // 依種類排出每一下的開始時間與形狀
  const beats=[]; let t=.15, n=0; const RR=60/HR;
  if(T==="vt"){ while(t<SEC){ const run=n>=2&&n<10; beats.push([t,run?vtb:beat]); t+=run?.32:RR; n++; } }
  else if(T==="pvc"||e.pvc){ while(t<SEC){ const isP=n%3===2; beats.push([t,isP?pvc:beat]); t+=isP?RR*1.45:(n%3===1?RR*.62:RR); n++; } }
  else if(T==="pea"){ const r=60/Math.max(30,Math.min(70,HR)); while(t<SEC){ beats.push([t,(x)=>beat(x)*.75]); t+=r; } }
  else if(T!=="vf"&&T!=="asystole"){ while(t<SEC){ beats.push([t,beat]); t+=RR; } }
  const val=(x)=>{ if(T==="vf") return .32*Math.sin(2*Math.PI*4.6*x)*(.6+.4*Math.sin(2*Math.PI*.35*x+1))+.18*Math.sin(2*Math.PI*7.1*x+.7)+.1*Math.sin(2*Math.PI*11.3*x+2.1);
    if(T==="asystole") return .03*Math.sin(2*Math.PI*.4*x)+.015*Math.sin(2*Math.PI*3.1*x);
    let v=0; for(const [b,f] of beats){ const d=x-b; if(d>-.05&&d<.9) v+=f(d); } return v; };
  let path=""; for(let i=0;i<=SEC*250;i++){ const x=i/250; const y=Y0-val(x)*MV; path+=(i?"L":"M")+(x*PXS).toFixed(1)+" "+y.toFixed(1); }
  let grid=""; for(let x=0;x<=W;x+=4) grid+=`<line x1="${x}" y1="0" x2="${x}" y2="${H}" class="${x%20?"g1":"g5"}"/>`; for(let y=0;y<=H;y+=4) grid+=`<line x1="0" y1="${y}" x2="${W}" y2="${y}" class="${y%20?"g1":"g5"}"/>`;
  // 校正方波 1 mV
  const cal=`<path d="M2 ${Y0} H6 V${Y0-MV} H14 V${Y0} H18" class="cal"/>`;
  return `<div class="ecg"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="心電圖 ${e.lead||"II"} 導程">${grid}${cal}<path d="${path}" class="tr"/></svg><small>導程 ${e.lead||"II"} · 25 mm/s · 10 mm/mV</small></div>`; }
function orRender(){ const c=ORS.sc, nd=ORS.nodes[ORS.node], P=$("orPanel"), L=ORS.last;
  P.innerHTML=orHead(`${ORS.acls?"🚨 ACLS":"🏥 OSCE 情境"} · 狀況 ${ORS.n} · ${c.title}`)+orTimerHTML()+`<div class="cols"><div>
      <p class="pt">👤 ${c.patient}</p>
      <p class="story">${nd.story}</p>${orEcg(nd)?ecgSVG(orEcg(nd),nd.v&&nd.v.hr):""}<div class="vit">${orVitHTML()}</div>${orAssistHTML()}
    </div><div><div class="q">${nd.q}</div>`+
    ORS.order.map((k,j)=>`<button type="button" class="opt" data-k="${k}"><b>${"ABCD"[j]}</b><span>${nd.options[k].t}</span></button>`).join("")+orBagHTML(ORS.bagOpen)+`</div></div>`;
  P.scrollTop=0; orWire(P); orTimerTick(); netSendOR("q");
  const pick=(o,k,b)=>{ (o.ck||[]).forEach(i=>ORS.ck.add(i)); ORS.logK.push([ORS.node,k]); netSend({t:"pick",j:b.querySelector("b").textContent});
    if(o.ok){ if(!/^(cpr|v\d|p\d|rosc)$/.test(String(ORS.node))) award("scn:"+c.id+":"+ORS.node); } else if(!o.rescue){ ORS.miss++; wrongAns(); }
    if(HELP_RE.test(o.t)) orCallHelp();
    if(/電擊/.test(o.t)&&!/不可電擊|同步|不再電擊|改只給藥/.test(o.t)){ const w=window.__world; w&&w.orShock&&w.orShock(); orFlash(); }
    ORS.last={cls:o.ok||o.rescue?"ok":"no", icon:o.ok?"✅ ":o.rescue?"🩹 救回來了。":o.to==="dead"?"💔 ":o.to==="cpr"?"🚨 ":"⚠️ ", fb:o.fb||""};
    (ORS.log=ORS.log||[]).push({n:ORS.n, q:nd.q, t:o.t, ...ORS.last});   // 過程中不顯示對錯,結束後一起檢討
    // 一選完,病人立刻有反應,直接進到下一個狀況
    if(o.to==="dead"||o.to==="win") ORS.tRun=false;
    if(o.to==="dead"){ orSetTarget(ORVF); setTimeout(()=>orEnd(false,o.fb),900); P.querySelectorAll(".opt").forEach(x=>x.disabled=true); b.classList.add("no"); return; }
    if(o.to==="win"){ orIsbar(); return; }
    if(o.to==="cpr"&&!ORS.acls){ ORS.acls=true; toast("🚨 病人心跳停止,開始 ACLS"); }
    ORS.node=o.to; ORS.n++; orStep(); };
  P.querySelectorAll(".opt[data-k]").forEach(b=>b.onclick=()=>pick(nd.options[+b.dataset.k],+b.dataset.k,b));
  orWireBag(P,nd,pick); }
/* ---------- 情境題裡打開收集冊:拿出釣魚、浮潛、漂流瓶收集到的東西來用 ----------
   情境的 bonus(整題都能用、不改變流程,用了病人狀況變好、多一枚金幣)與狀況的 use(會帶到另一個狀況)都從這裡拿。
   不事先列出這題用得到什麼(避免洩漏診斷);拿出用不上的東西只會提示「現在用不上」,不會用掉。
   隊友從背包遞過來的東西(ORS.gift)也會出現在這裡,先用隊友的。 */
const OR_BAG_KINDS=["drug","vaso","line","blood","card"];
function orBagHas(n){ return ((ORS.gift||{})[n]||0)+(BAGD[n]||0); }
function orBagTake(n){ const g=ORS.gift||{}; if(g[n]>0){ g[n]--; return true; } if(BAGD[n]>0){ BAGD[n]--; if(!BAGD[n]) delete BAGD[n]; try{ localStorage.setItem("island-bag",JSON.stringify(BAGD)); }catch(e){} return true; } return false; }
function orBagHTML(open){ const names=COLLECT.filter(g=>OR_BAG_KINDS.includes(g.med)).flatMap(g=>g.items.map(([n])=>n)).filter(n=>orBagHas(n)>0);
  const used=(ORS.bonus||[]).length;
  return `<div class="usebox"><button type="button" class="bagbtn">🎒 打開收集冊,拿東西出來用${used?` <small>已用 ${used} 樣 bonus</small>`:""}<span>${open?"▴":"▾"}</span></button>`+
    (open?(names.length?`<p class="pt">想想這個病人還用得到什麼?點一下就拿出來用。用對了是額外 bonus;用不上的東西不會被用掉。</p><div class="chips">${names.map(n=>`<button type="button" class="chip bag${(ORS.bonus||[]).includes(n)?" done":""}" data-bag="${esc(n)}">${colIcon(n)} ${esc(n)} <small>×${orBagHas(n)}</small></button>`).join("")}</div>`
      :`<p class="pt">收集冊裡還沒有藥物、管路或血品。下班去釣魚、浮潛或撿漂流瓶,收集到了就能在手術室拿出來用。</p>`):"")+`</div>`; }
function orBonusFor(c,n,node){ return (c.bonus||[]).find(b=>b.n===n&&(!b.at||b.at.includes(node))); }
function orWireBag(P,nd,pick){ if(!P.querySelector(".usebox")) return;
  const wire=()=>{ const bx=P.querySelector(".usebox"); bx.querySelector(".bagbtn").onclick=()=>{ ORS.bagOpen=!ORS.bagOpen; bx.outerHTML=orBagHTML(ORS.bagOpen); wire(); };
    bx.querySelectorAll("[data-bag]").forEach(b=>b.onclick=()=>{ const n=b.dataset.bag, c=ORS.sc; if(!orBagHas(n)) return;
      const ui=(nd.use||[]).findIndex(u=>u.n===n);
      if(ui>=0){ orBagTake(n); toast(`🎒 拿出 ${colIcon(n)} ${esc(n)}`); ORS.bagOpen=false; pick(nd.use[ui],-1-ui,b); return; }
      const bo=orBonusFor(c,n,ORS.node);
      if(bo&&!(ORS.bonus||[]).includes(n)){ orBagTake(n); (ORS.bonus=ORS.bonus||[]).push(n); ORS.bdv=ORS.bdv||{};
        Object.entries(bo.dv||{}).forEach(([k,v])=>ORS.bdv[k]=(ORS.bdv[k]||0)+v);
        const now={...ORS.T}; Object.entries(bo.dv||{}).forEach(([k,v])=>{ if(typeof now[k]==="number") now[k]+=v; }); orSetTarget(orBonusV(now,true));
        toast(`🎁 Bonus!${colIcon(n)} ${esc(n)}:${bo.t}`,"unlock"); addBonus(1,"🎁 收集冊 bonus");
        const st=P.querySelector(".story"); if(st) st.insertAdjacentHTML("afterend",`<p class="fb ok">🎁 ${esc(n)}:${bo.fb}</p>`);
        bx.outerHTML=orBagHTML(true); wire(); netSendOR("q"); return; }
      toast(bo?`${colIcon(n)} ${esc(n)} 這題已經用過了`:`${colIcon(n)} ${esc(n)} 現在用不上,先收回收集冊`); }); };
  wire(); }
// bonus 的效果(dv)會帶到之後的每個狀況(心跳停止時不算),數值保持在合理範圍
function orBonusV(v,already){ const d=ORS.bdv; if(!d||/^(cpr|v\d|p\d)$/.test(String(ORS.node))) return v; const o={...v};
  const R={hr:[40,150],sbp:[50,170],dbp:[30,100],spo2:[50,100],etco2:[0,60],rr:[0,30],temp:[34,40]};
  Object.keys(R).forEach(k=>{ if(typeof o[k]!=="number") return; let x=o[k]+(already?0:(d[k]||0)); if(k==="etco2"&&v[k]===0) x=0; o[k]=Math.max(R[k][0],Math.min(R[k][1],Math.round(x*10)/10)); }); return o; }
/* ---------- 病人穩定後:和巡迴護理師一起推去恢復室,用 ISBAR 交班 ---------- */
function orIsbar(){ const c=ORS.sc, P=$("orPanel"), L=ORS.last; ORS.tRun=false;
  orSetTarget({hr:82,sbp:118,dbp:70,spo2:99,etco2:36,rr:12,temp:37,skin:"normal",alarm:false,shake:false,rhythm:"sinus"});
  P.innerHTML=orHead(`🏥 OSCE 情境 · 送恢復室 · ${c.title}`)+`<div class="cols"><div><p class="pt">👤 ${c.patient}</p></div>
    <div><p class="story">病人穩定了。手術結束後,你和巡迴護理師一起把病人推到恢復室,準備交班給恢復室護理師⋯⋯</p></div></div>`; orWire(P); netSendOR("go");
  let shown=false; const ask=()=>{ if(shown||ORS.sc!==c) return; shown=true; orIsbarAsk(); };
  const w=window.__world; if(w&&w.orHandoff) w.orHandoff(ask); setTimeout(ask,w&&w.orHandoff?30000:300); }
function orIsbarOpts(c){ const I=c.isbar||{}; const full=`I:${I.i} S:${I.s} B:${I.b} A:${I.a} R:${I.r}`;
  return [
    {t:full,ok:true,fb:"正確。ISBAR 依序交代身分、狀況、背景、評估與建議,恢復室護理師才知道要看什麼、要追什麼。"},
    {t:"病人手術順利,生命徵象穩定,有什麼問題再打電話給我。",fb:"太籠統:沒有交代身分、術中發生的事、目前的問題與要追蹤的項目。"},
    {t:`I:${I.i} S:${I.s} A:${I.a}`,fb:"少了 B(病史、過敏、術中事件與用藥)和 R(要觀察什麼、什麼情況要通知、待追蹤的檢驗)。"},
    {t:"在走廊上先口頭交代重點,病人推進恢復室後就直接回手術室準備下一台。",fb:"交班要在床邊當面進行,一起確認生命徵象、管路與傷口,對方複述確認後才離開。"}]; }
function orIsbarAsk(){ const c=ORS.sc, P=$("orPanel"); const opts=orIsbarOpts(c);
  const ord=orShuffle(4); ORS.ibOrd=ord;
  P.innerHTML=orHead(`🏥 OSCE 情境 · ISBAR 交班 · ${c.title}`)+`<div class="cols"><div><p class="story">到恢復室了。恢復室護理師說:「好,請交班。」</p><div class="vit">${orVitHTML()}</div></div>
    <div><div class="q">哪一個交班最完整、最正確?</div>`+ord.map((k,j)=>`<button type="button" class="opt" data-k="${k}"><b>${"ABCD"[j]}</b><span>${opts[k].t}</span></button>`).join("")+`</div></div>`;
  P.scrollTop=0; orWire(P); netSendOR("ib");
  P.querySelectorAll(".opt[data-k]").forEach(b=>b.onclick=()=>{ const o=opts[+b.dataset.k]; ORS.isbar=o; ORS.isbarK=+b.dataset.k; netSend({t:"pick",j:b.querySelector("b").textContent}); if(o.ok) award("scn:"+c.id+":isbar"); else wrongAns(); orEnd(true); }); }
function orEnd(win,why){ const c=ORS.sc, P=$("orPanel"); const tu=win==="time"; if(tu) win=false; ORS.tRun=false; ORS.end=win?"win":tu?"time":"dead"; markSeen(c); if(ORS.cprOn){ ORS.cprOn=false; const w=window.__world; w&&w.orCPR&&w.orCPR(false); }
  if(win){ orSetTarget({hr:80,sbp:118,dbp:70,spo2:99,etco2:36,rr:12,temp:37,skin:"normal",alarm:false,shake:false,rhythm:"sinus"}); award("scn:"+c.id+":win"); toast(`🎉 病人穩定了:${c.tag||c.title}`,"unlock"); }
  else if(tu){ const w=window.__world; w&&w.react("wrong"); }
  else { orSetTarget(ORDEAD,true); const w=window.__world; w&&w.react("wrong"); }
  const got=c.checklist.filter((_,i)=>ORS.ck.has(i)).length, B=ORS.isbar;
  const list=(items,has)=>`<ul class="ck">${items.map((t,i)=>`<li class="${has(i)?"hit":"miss"}"><span>${has(i)?"✅":"⬜"}</span><span>${t}</span></li>`).join("")}</ul>`;
  P.innerHTML=orHead(`🏥 OSCE 情境 · ${c.tag||""} · ${c.title}`)+`<div class="cols"><div>
      <div class="end ${win?"ok":tu?"time":"dead"}"><b>${win?"🎉 病人穩定了":tu?"⏱️ 時間到":"💀 病人死亡"}</b><div style="font-size:13px;opacity:.85;margin-bottom:4px">診斷:${c.tag||""}</div>${win?(ORS.acls?"經過急救後恢復自發循環。":"")+c.win:tu?(why||"")+" 病人還沒穩定下來;看看下面的評分表與檢討,再挑戰一次,試著在 1 分 30 秒內完成。":(why||"")+" "+c.dead}</div>
      ${B?`<div class="fb ${B.ok?"ok":"no"}">${B.ok?"✅ ISBAR 交班正確。":"⚠️ ISBAR 交班:"}${B.ok?"":B.fb}</div>`:""}
      <div class="nav"><button type="button" id="orAgain">${win?"再做一次":"重新挑戰"}</button>${OR_SCENARIOS.length>1?`<button type="button" class="sec" id="orNextS">下一個情境</button>`:""}<button type="button" class="sec" id="orBack">情境清單</button></div>
    </div><div><div class="q">OSCE 評分表:做到 ${got} / ${c.checklist.length} 項${win&&ORS.miss?`(中途選錯 ${ORS.miss} 次)`:""}</div>${list(c.checklist,i=>ORS.ck.has(i))}
      ${(ORS.log||[]).length?`<div class="q">逐步檢討</div><ol class="rev">${ORS.log.map(r=>`<li class="${r.cls}"><b>${r.icon}${r.t}</b><span>${r.fb}</span></li>`).join("")}</ol>`:""}
      ${ORS.acls?`<div class="q">${c.acls&&c.acls.peds?"PALS":"ACLS"} 評分:做到 ${ACLS_CK.filter((_,i)=>ORS.ck.has("a"+i)).length} / ${ACLS_CK.length} 項</div>${list(ACLS_CK,i=>ORS.ck.has("a"+i))}`:""}${orBonusEnd(c)}${orAssistHTML(true)}</div></div>`;
  P.scrollTop=0; orWire(P); netSendOR("end"); const q=(id,f)=>{ const e=P.querySelector("#"+id); if(e) e.onclick=f; };
  const pickNext=()=>{ const all=OR_SCENARIOS.map((_,i)=>i).filter(i=>i!==ORS.idx); return all[Math.floor(Math.random()*all.length)]; };
  q("orAgain",()=>orStart(ORS.idx)); q("orNextS",()=>orStart(pickNext())); q("orBack",orMenu); }
function orBonusEnd(c,usedL){ const B=c.bonus||[]; if(!B.length) return ""; const used=new Set(usedL||ORS.bonus||[]);
  const u=B.filter(b=>used.has(b.n)), left=B.filter(b=>!used.has(b.n));
  return `<div class="q">🎁 收集冊 bonus:用了 ${u.length} / ${B.length} 樣</div><ul class="ck">${u.map(b=>`<li class="hit"><span>${colIcon(b.n)}</span><span><b>${esc(b.n)}</b>:${b.t}。${b.fb}</span></li>`).join("")}${left.map(b=>`<li class="miss"><span>${colIcon(b.n)}</span><span><b>${esc(b.n)}</b>(${usedL?"這次沒用到":orBagHas(b.n)?"收集冊裡有,下次記得拿出來":"還沒收集到"}):${b.t}</span></li>`).join("")}</ul>`; }
function orClose(){ if(NET.role==="guest"){ $("orPanel").hidden=true; document.body.classList.remove("or-run"); return; } netSendOR("off"); ORS.cprOn=false; ORS.tRun=false; $("orPanel").hidden=true; document.body.classList.remove("or-run"); ORS.sc=null; ORS.end=null; orSetTarget({...ORV0},false); const w=window.__world; w&&w.orReset&&w.orReset(); }
$("orLeave").onclick=()=>{ const w=window.__world; w&&w.leaveOR&&w.leaveOR(); };
$("orStart").onclick=()=>{ if(window.__world && !window.__world.atOR()) window.__world.goIsland(3,true); orMenu(); };
ORS.raf=requestAnimationFrame(orLoop);
const FACES=[["smile","😊","微笑"],["laugh","😄","大笑"],["wink","😉","眨眼"],["love","😍","愛心"],["surprised","😮","驚訝"],["shy","😳","害羞"],["sleepy","😴","想睡"],["sad","😢","難過"],["angry","😠","生氣"]];
{ const box=document.querySelector("#facebar .faces"); box.innerHTML=`<button type="button" class="auto" data-f="auto" aria-pressed="true"><span>🔄</span>自動變換表情</button>`+FACES.map(([k,e,n])=>`<button type="button" data-f="${k}" aria-pressed="false"><span>${e}</span>${n}</button>`).join("");
  const pick=(k,quiet)=>{ if(k!=="auto"&&!hasSkill("face")){ if(!quiet) lockMsg("face"); k="auto"; }
    box.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.f===k)); $("faceToggle").textContent=k==="auto"?"🔄 表情":(FACES.find(f=>f[0]===k)||FACES[0])[1]+" 表情"; try{ localStorage.setItem("island-face",k); }catch(e){} if(window.__world) window.__world.setFace(k==="auto"?null:k); };
  box.addEventListener("click",e=>{ const b=e.target.closest("[data-f]"); if(b) pick(b.dataset.f); });
  window.__pickFace=pick; }
const panels=[["islToggle","islbar"],["coinToggle","skillbar"],["faceToggle","facebar"],["lookToggle","lookbar"],["decoToggle","decobar"],["offToggle","offbar"],["wxToggle","wxbar"],["netToggle","netbar"]];
/* ---------- 裝扮小麻面板 ---------- */
{ const box=$("lookbar"); const sw=(grp,obj,cur)=>Object.entries(obj).map(([k,v])=>`<button type="button" class="sw${v.pat?" pat pat-"+k:""}" data-${grp}="${k}" aria-pressed="${k===cur}" title="${v.n}" aria-label="${v.n}" style="--sw:${v.css}"></button>`).join("");
  const draw=()=>{ box.innerHTML=`<span class="lbl">手術帽 <small>${(LOOK_CAPS[LOOK.cap]||{}).n||""}</small></span><div class="sws">${sw("cap",LOOK_CAPS,LOOK.cap)}</div>
    <span class="lbl">手術衣 <small>${(LOOK_SCRUBS[LOOK.scrub]||{}).n||""}</small></span><div class="sws">${sw("scrub",LOOK_SCRUBS,LOOK.scrub)}</div>
    <span class="lbl">飾品 <small>可以多選</small></span><div class="chips">${LOOK_ACC.map(([k,ic,n])=>`<button type="button" class="chip" data-acc="${k}" aria-pressed="${LOOK.acc.includes(k)}">${ic} ${n}</button>`).join("")}</div>
    <span class="lbl">臉上的刺青</span><div class="chips">${LOOK_TAT.map(([k,ic,n])=>`<button type="button" class="chip" data-tat="${k}" aria-pressed="${LOOK.tat===k}">${ic} ${n}</button>`).join("")}</div>
    <div class="nrow"><button type="button" class="sec" id="lookPeek">👀 看看小麻</button><button type="button" class="sec" id="lookReset">↺ 恢復原本的樣子</button></div>
    <small class="lnote">${hasSkill("gold")&&(()=>{ try{ return localStorage.getItem("island-gold")==="1"; }catch(e){ return false; } })()?"目前戴著 👑 金色手術帽(技能),到金幣面板可以關掉。":"手術帽、手術衣只在上班時穿;下班換泳裝或夏威夷衫時,眼鏡、耳環和刺青還會在。"}</small>`; };
  const save=()=>{ try{ localStorage.setItem("island-look",JSON.stringify(LOOK)); }catch(e){} const w=window.__world; w&&w.setLook&&w.setLook(LOOK); draw(); };
  box.addEventListener("click",e=>{ const b=e.target.closest("button"); if(!b) return; const d=b.dataset;
    if(d.cap) LOOK.cap=d.cap; else if(d.scrub) LOOK.scrub=d.scrub; else if(d.tat) LOOK.tat=d.tat;
    else if(d.acc){ LOOK.acc=LOOK.acc.includes(d.acc)?LOOK.acc.filter(k=>k!==d.acc):[...LOOK.acc,d.acc]; }
    else if(b.id==="lookReset") LOOK=lookClean(null);
    else if(b.id==="lookPeek"){ const w=window.__world; w&&w.lookAtNurse&&w.lookAtNurse(); return; } else return; save(); });
  draw(); $("lookToggle").addEventListener("click",()=>{ draw(); if(!$("lookbar").classList.contains("closed")){ const w=window.__world; w&&w.lookAtNurse&&w.lookAtNurse(); } }); }
/* ---------- 島嶼佈置面板 ---------- */
const DECO_MAX=80;
const DECO_ITEMS=[["pot","🌷","花盆"],["tree","🌳","小樹"],["cactus","🌵","仙人掌"],["mush","🍄","大蘑菇"],["rock","🪨","石頭"],["lamp","🏮","路燈"],["bench","🪑","長椅"],["umb","⛱️","陽傘"],["flag","🚩","旗子"],["balloon","🎈","氣球"],["heart","💗","愛心看板"],["sign","🪧","名字木牌"],["xmas","🎄","聖誕樹"],["snowman","⛄","雪人"]];
function decoBar(k){ let bar=$("decoBar"); if(!bar){ bar=document.createElement("div"); bar.id="decoBar"; bar.className="decobar"; $("stage").appendChild(bar); }
  const w=window.__world; if(!k){ bar.hidden=true; w&&w.decoMode(null); document.body.classList.remove("decoing"); return; }
  const it=DECO_ITEMS.find(x=>x[0]===k); w&&w.decoMode(k); document.body.classList.add("decoing"); bar.hidden=false;
  bar.innerHTML=`<span>${k==="remove"?"🧹 收起模式:點一下要收起來的東西":`${it[1]} 放置 <b>${it[2]}</b>:點島上的空地放下去 · 點已放好的東西可以轉向`}</span>
    <span class="dbtns"><button type="button" data-dk="pick">🪴 換東西</button>${k==="remove"?"":`<button type="button" data-dk="remove">🧹 收起</button>`}<button type="button" class="ok" data-dk="done">✓ 完成</button></span>`;
  bar.onclick=e=>{ const b=e.target.closest("[data-dk]"); if(!b) return; const a=b.dataset.dk; if(a==="done") decoBar(null); else if(a==="remove") decoBar("remove"); else { $("decoToggle").click(); } }; }
{ const box=$("decobar"); const draw=()=>{ const w=window.__world, n=w&&w.decoCount?w.decoCount():0;
    box.innerHTML=`<span class="lbl">佈置我的島 <small>${n}/${DECO_MAX} 樣</small></span><div class="decos">${DECO_ITEMS.map(([k,ic,nm])=>`<button type="button" data-dk="${k}"><span>${ic}</span>${nm}</button>`).join("")}</div>
      <div class="nrow"><button type="button" class="sec" data-dk="remove">🧹 收起東西</button>${n?`<button type="button" class="sec" data-dk="clear">🗑️ 全部清除</button>`:""}</div><small class="lnote">選一樣東西,再點島上的空地放下去。朋友來你的島時也看得到你的佈置。</small>`; };
  box.addEventListener("click",e=>{ const b=e.target.closest("[data-dk]"); if(!b) return; const k=b.dataset.dk, w=window.__world; if(!w) return;
    if(NET.role==="guest"){ toast("🏝️ 你在朋友的島上,回到自己的島才能佈置喔"); return; }
    if(k==="clear"){ if(confirm("確定要把島上的佈置全部收起來嗎?")){ w.decoClear(); decoBar(null); draw(); } return; }
    box.classList.add("closed"); $("decoToggle").setAttribute("aria-expanded",false); decoBar(k); });
  $("decoToggle").addEventListener("click",draw); }
function netDecoSend(){ if(NET.role!=="host") return; const w=window.__world; if(w&&w.decoList) netSend({t:"deco",d:w.decoList()}); }

panels.forEach(([t,p])=>{ const el=$(t); const old=el.onclick; el.onclick=()=>{ panels.forEach(([t2,p2])=>{ if(p2!==p){ $(p2).classList.add("closed"); $(t2).setAttribute("aria-expanded",false); } }); const c=$(p).classList.toggle("closed"); el.setAttribute("aria-expanded",!c); }; });
$("offbar").addEventListener("click",e=>{ const b=e.target.closest("[data-off]"); if(!b||!window.__world) return; const k=b.dataset.off;
  const sk={swim:"swim",hawaii:"sail",free:"freeswim",snorkel:"freeswim",fish:"fish"}[k]; if(k!=="work"&&!hasSkill(sk)){ lockMsg(sk); return; }
  if(k==="work"){ window.__world.fishEnd(); window.__world.offEnd(); } else if(k==="fish") window.__world.fishStart(); else window.__world.offStart(k);
  document.querySelectorAll(".offbtn").forEach(x=>x.setAttribute("aria-pressed",x.dataset.off===k&&k!=="work"));
  $("offToggle").textContent=k==="work"?"🏖️ 下班":k==="fish"?"🎣 釣魚中":k==="swim"?"🐬 下班中":k==="free"?"🏊 下班中":k==="snorkel"?"🤿 浮潛中":"⛵ 下班中"; $("offbar").classList.add("closed"); });
$("colToggle").onclick=()=>{ panels.forEach(([t,p])=>{ $(p).classList.add("closed"); $(t).setAttribute("aria-expanded",false); }); openCollection(); };
$("aboutBtn").onclick=()=>{ const m=document.createElement("div"); m.className="about";
  m.innerHTML=`<div class="box" role="dialog" aria-modal="true" aria-label="說明"><button class="x" type="button" aria-label="關閉">✕</button><h2>麻醉誘島</h2>
    <p>${document.querySelector(".lede").innerHTML}</p><div class="stats" style="margin:10px 0">${$("stats").innerHTML}</div>
    <div class="qr"><img src="img/qrcode.svg" alt="麻醉誘島網站 QR code" width="132" height="132"><div><b>掃描 QR code 開啟麻醉誘島</b><small>分享給同學,手機掃描就能進入網站</small><a href="https://megan9659186.github.io/anesthesia-island/" target="_blank" rel="noopener">megan9659186.github.io/anesthesia-island</a></div></div>
    <p class="meta">拖曳可旋轉視角,滾輪或雙指可縮放。</p><p class="meta">${document.querySelector("footer").innerHTML}</p></div>`;
  const close=()=>m.remove(); m.onclick=e=>{ if(e.target===m) close(); }; m.querySelector(".x").onclick=close; document.body.appendChild(m); };

/* ---------- 入口畫面:幫小麻取名字、選身份(SNA 學員 / CRNA) ----------
   存在 localStorage:island-name(名字)、island-role("SNA" 或 "CRNA")。每次打開網站都會先出現,帶入上次填的內容。 */
const PLAYER={ name:(()=>{ try{ return localStorage.getItem("island-name")||""; }catch(e){ return ""; } })(), role:(()=>{ try{ return localStorage.getItem("island-role")==="SNA"?"SNA":"CRNA"; }catch(e){ return "CRNA"; } })() };
const esc=(t)=>String(t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function drawBadge(g,w,h,P){ P=P||PLAYER; const sna=P.role==="SNA"; g.fillStyle="#fff"; g.fillRect(0,0,w,h); g.fillStyle=sna?"#3C9AD6":"#E46F8E"; g.fillRect(0,0,w,40);
  g.textAlign="center"; g.textBaseline="middle"; if(P.name){ g.fillStyle="#fff"; let s=30; do{ g.font=`700 ${s}px "Noto Sans TC",sans-serif`; s--; }while(g.measureText(P.name).width>w-16&&s>12); g.fillText(P.name,w/2,21); }
  g.fillStyle="#3B3347"; g.font='700 56px "Noto Sans TC",sans-serif'; g.fillText(P.role,w/2,98); }
function playerChip(){ const t=document.querySelector(".ttl"); if(!t) return; let c=$("meChip"); if(!c){ c=document.createElement("button"); c.type="button"; c.id="meChip"; c.className="mechip"; c.title="修改名字與身份"; c.onclick=()=>openIntro(true); t.appendChild(c); }
  c.innerHTML=`<i class="${PLAYER.role==="SNA"?"sna":"crna"}">${PLAYER.role}</i>${esc(PLAYER.name||"小麻")}`; }
function openIntro(edit){ const m=document.createElement("div"); m.className="intro";
  m.innerHTML=`<form class="ibox" role="dialog" aria-modal="true" aria-label="進入麻醉誘島">
    <div class="eyebrow">Anesthesia Island</div><h2>麻醉誘島</h2><p class="meta">歡迎上島!先幫你的麻醉護理師小人取個名字,再選你的身份。</p>
    <label class="ilab" for="inName">小麻的名字</label><input id="inName" maxlength="10" autocomplete="nickname" placeholder="例如:小麻" value="${esc(PLAYER.name)}">
    <span class="ilab">身份</span>
    <div class="roles" role="radiogroup" aria-label="身份">
      <button type="button" role="radio" data-r="SNA" aria-checked="${PLAYER.role==="SNA"}"><b>SNA</b><small>麻醉專科護理師學員</small></button>
      <button type="button" role="radio" data-r="CRNA" aria-checked="${PLAYER.role!=="SNA"}"><b>CRNA</b><small>麻醉專科護理師</small></button></div>
    <button class="go" type="submit">${edit?"儲存":"進入島嶼"}</button></form>`;
  let role=PLAYER.role; m.querySelectorAll("[data-r]").forEach(b=>b.onclick=()=>{ role=b.dataset.r; m.querySelectorAll("[data-r]").forEach(x=>x.setAttribute("aria-checked",x===b)); });
  m.querySelector("form").onsubmit=e=>{ e.preventDefault(); PLAYER.name=m.querySelector("#inName").value.trim().slice(0,10); PLAYER.role=role;
    try{ localStorage.setItem("island-name",PLAYER.name); localStorage.setItem("island-role",role); }catch(err){}
    m.remove(); playerChip(); if(window.__world&&window.__world.setBadge) window.__world.setBadge(); netSend({t:"hi",name:PLAYER.name,role:PLAYER.role}); if(NET.pendingJoin){ const c=NET.pendingJoin; NET.pendingJoin=null; netJoin(c); } };
  if(edit) m.onclick=e=>{ if(e.target===m) m.remove(); };
  document.body.appendChild(m); setTimeout(()=>{ const i=m.querySelector("#inName"); if(i&&!PLAYER.name) i.focus(); },50); }
playerChip(); openIntro(false); setTimeout(()=>netUI(),0);

/* ---------- 連線一起玩:邀請朋友來自己的島(PeerJS 點對點連線,不需要帳號;公共伺服器只負責配對) ----------
   邀請者(host)產生 6 碼房號,朋友(guest)輸入房號或點邀請連結加入;最多 3 位朋友。
   每 0.1 秒互傳自己小麻的位置、姿勢、服裝、表情與正在做的事,對方的小麻會出現在你的島上。
   模擬手術室:由邀請者開始情境、作答;朋友看到同一題與同一台監視器,不能作答,但可以「協助」或從背包拿東西出來用(用掉會扣背包數量)。
   手術室同步只傳題目編號與狀態,朋友那邊用自己的題庫畫面,不傳 HTML。 */
function netFx(fn,a){ if(NET.role==="host") netSend({t:"fx",fn,a}); }
const NET={peer:null,role:null,code:null,conns:new Map(),prof:new Map(),host:null,status:"",pendingJoin:null,asT:0};
const NET_PREFIX="anesthesia-island-room-", NET_MAX=3, NET_ALPHA="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const netStr=(x,n)=>String(x==null?"":x).slice(0,n);
const netNum=(x)=>{ const v=+x; return Number.isFinite(v)?v:0; };
const netName=(k)=>{ const p=NET.prof.get(k); return (p&&p.name)||"朋友"; };
function netLib(){ if(window.Peer) return Promise.resolve(); return new Promise((ok,no)=>{ const sc=document.createElement("script"); sc.src="https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js"; sc.onload=ok; sc.onerror=()=>no(new Error("lib")); document.head.appendChild(sc); }); }
const netOpts=()=>Object.assign({debug:0},window.ISLAND_PEER_OPTS||{});
function netSend(d,except){ if(!NET.role) return; for(const [k,v] of NET.conns){ if(k!==except&&v.c.open){ try{ v.c.send(d); }catch(e){} } } }
function netErr(e){ const t=e&&e.type; NET.status=t==="peer-unavailable"?"找不到這個房號,請確認房號,或請朋友重新邀請。":t==="unavailable-id"?"":t==="browser-incompatible"?"這個瀏覽器不支援連線。":"連不上:可能是網路擋住了點對點連線(醫院或公司 Wi‑Fi 常會擋),換成手機網路再試試看。"; netUI(); }
async function netHost(){ if(NET.role) return; NET.status="準備房間中⋯"; netUI();
  try{ await netLib(); }catch(e){ NET.status="連線元件下載失敗,請檢查網路。"; netUI(); return; }
  const code=Array.from({length:6},()=>NET_ALPHA[Math.floor(Math.random()*NET_ALPHA.length)]).join("");
  const peer=new Peer(NET_PREFIX+code,netOpts()); NET.peer=peer;
  peer.on("open",()=>{ NET.role="host"; NET.code=code; NET.status=""; netUI(); });
  peer.on("connection",c=>{ if(NET.conns.size>=NET_MAX){ c.on("open",()=>{ try{ c.send({t:"full"}); }catch(e){} setTimeout(()=>c.close(),400); }); return; } netWire(c); });
  peer.on("error",e=>{ if(e&&e.type==="unavailable-id"){ peer.destroy(); NET.peer=null; netHost(); return; } if(NET.role==="host"&&e&&e.type==="peer-unavailable") return;   // 朋友那邊連線失敗,不影響房間
    if(!NET.role){ peer.destroy(); NET.peer=null; } netErr(e); });
  peer.on("disconnected",()=>{ try{ peer.reconnect(); }catch(e){} }); }
async function netJoin(code){ code=netStr(code,12).toUpperCase().replace(/[^A-Z0-9]/g,""); if(code.length!==6){ NET.status="房號是 6 個英文字母或數字。"; netUI(); return; } if(NET.role) return;
  NET.status="連線中⋯"; netUI();
  try{ await netLib(); }catch(e){ NET.status="連線元件下載失敗,請檢查網路。"; netUI(); return; }
  const peer=new Peer(undefined,netOpts()); NET.peer=peer;
  peer.on("open",()=>{ const c=peer.connect(NET_PREFIX+code,{reliable:true,serialization:"json"}); NET.host=c; NET.code=code; netWire(c,true);
    setTimeout(()=>{ if(!NET.role&&NET.peer===peer){ NET.status="連不上:可能是網路擋住了點對點連線(醫院或公司 Wi‑Fi 常會擋),換成手機網路再試試看。"; peer.destroy(); NET.peer=null; netUI(); } },30000); });
  peer.on("error",e=>{ if(!NET.role){ peer.destroy(); NET.peer=null; } netErr(e); }); }
function netWire(c,asGuest){
  c.on("open",()=>{ if(asGuest){ NET.role="guest"; NET.status=""; NET.tp=false; NET.follow=true; NET.hIsl=-1; decoBar(null); } NET.conns.set(c.peer,{c}); c.send({t:"hi",name:PLAYER.name,role:PLAYER.role});
    if(!asGuest){ for(const [k,p] of NET.prof) if(k!==c.peer) c.send({t:"hi",id:k,name:p.name,role:p.role}); if(ORS.sc) netSendOR(ORS.end?"end":"q"); const w=window.__world; if(w&&w.decoList) c.send({t:"deco",d:w.decoList()}); }
    netUI(); });
  c.on("data",d=>netRecv(c,d));
  c.on("close",()=>netDrop(c.peer));
  c.on("error",()=>netDrop(c.peer)); }
function netDrop(id){ if(!NET.conns.has(id)) return; NET.conns.delete(id);
  if(NET.role==="guest"){ toast("👋 和邀請者的連線已中斷"); netLeave(); return; }
  const w=window.__world; w&&w.netDel&&w.netDel(id); if(NET.prof.has(id)) toast(`👋 ${esc(netName(id))} 離開了你的島`); NET.prof.delete(id); netSend({t:"bye",id}); netUI(); }
function netLeave(){ const w=window.__world; for(const k of NET.prof.keys()) w&&w.netDel&&w.netDel(k);
  for(const [,v] of NET.conns){ try{ v.c.close(); }catch(e){} } NET.conns.clear(); NET.prof.clear();
  const wasGuest=NET.role==="guest"; if(wasGuest&&w){ w.camFollow&&w.camFollow(null); w.decoShow&&w.decoShow(null); } if(NET.peer){ try{ NET.peer.destroy(); }catch(e){} } Object.assign(NET,{peer:null,role:null,code:null,host:null,status:""});
  if(wasGuest){ $("orPanel").hidden=true; document.body.classList.remove("or-run"); ORS.gsc=null; orSetTarget({...ORV0},true); w&&w.orReset&&w.orReset(); }
  netUI(); }
// 收到對方的資料:只接受已知的類型,文字限制長度,一律當純文字顯示
function netRecv(c,d){ if(!d||typeof d!=="object"||typeof d.t!=="string") return; const w=window.__world;
  const fromHost=NET.role==="guest"; const key=fromHost&&d.id?netStr(d.id,80):c.peer;
  if(NET.role==="host"&&["hi","st","as"].includes(d.t)) netSend({...d,id:c.peer},c.peer);   // 邀請者幫忙轉給其他朋友
  switch(d.t){
    case "hi": { const prof={name:netStr(d.name,10).trim(),role:d.role==="SNA"?"SNA":"CRNA"}; const isNew=!NET.prof.has(key); NET.prof.set(key,prof); w&&w.netAdd&&w.netAdd(key,prof);
      if(isNew) toast(fromHost&&!d.id?`🏝️ 你來到 ${esc(prof.name||"朋友")} 的島了`:`👋 ${esc(prof.name||"朋友")}(${prof.role})來到${NET.role==="host"?"你的":"這座"}島`); netUI(); break; }
    case "st": if(w&&w.netUpd){ w.netUpd(key,d);
      if(fromHost&&!d.id){ // 朋友的畫面跟著邀請者的視角;邀請者換島時朋友也跟過去(朋友在手術室裡、或切成自由視角時不跟)
        if(NET.follow&&Array.isArray(d.c)&&d.c.length===6&&d.c.every(v=>Number.isFinite(+v))) w.camFollow(d.c.map(Number));
        if(Number.isInteger(d.i)){ const i=Math.max(0,Math.min(6,d.i)); if(i!==NET.hIsl&&(NET.follow||!NET.tp)&&!(w.inSuite&&w.inSuite())){ NET.hIsl=i; NET.tp=true; w.goIsland(i,true); } } } } break;
    case "deco": if(fromHost&&w&&w.decoShow&&Array.isArray(d.d)) w.decoShow(d.d.slice(0,DECO_MAX)); break;
    case "bye": if(fromHost){ w&&w.netDel&&w.netDel(key); NET.prof.delete(key); netUI(); } break;
    case "full": NET.status="這座島已經有 3 位朋友了。"; netLeave(); break;
    case "as": { const x=netStr(d.x,40); if(NET.role==="host") orAssistAdd(netName(key),x); else toast(`🤝 ${esc(netName(key))}:${esc(x)}`); w&&w.netSay&&w.netSay(key,x); break; }
    case "or": if(fromHost) orGuest(d); break;
    case "v": if(fromHost&&Array.isArray(d.V)){ const K=["hr","sbp","dbp","spo2","etco2","rr","temp"], o={}; K.forEach((k,i)=>o[k]=netNum(d.V[i])); o.skin=["normal","pale","cyan","flush"].includes(d.s)?d.s:"normal"; o.alarm=!!d.al; o.shake=!!d.sh; o.rhythm=["sinus","vf","asystole","pea","st"].includes(d.rh)?d.rh:"sinus"; Object.assign(ORS.V,o); Object.assign(ORS.T,o); orPush(); } break;
    case "fx": if(fromHost&&w){ const fn=d.fn; if(fn==="orCPR") w.orCPR(!!d.a); else if(fn==="orHelp"){ w.orHelp(); orHelpBanner(); } else if(fn==="orShock"){ w.orShock(); orFlash(); } else if(fn==="orHandoff") w.orHandoffFx(); else if(fn==="orReset") w.orReset(); } break;
    case "pick": if(fromHost) toast(`👩‍⚕️ ${esc(netName(c.peer))} 選了 ${esc(netStr(d.j,2))}`); break;
  } }
/* ---------- 手術室:邀請者把狀態傳給朋友;朋友看到同一題,但改成協助與背包 ---------- */
function netSendOR(ph){ if(NET.role!=="host") return; if(ph==="off"||(!ORS.sc&&ph!=="menu")){ netSend({t:"or",ph:"off"}); return; }
  netSend({t:"or",ph,i:ORS.idx,node:ORS.node,ord:ORS.order,n:ORS.n,acls:!!ORS.acls,ck:[...(ORS.ck||[])],log:ORS.logK||[],end:ORS.end,miss:ORS.miss||0,ib:ORS.ibOrd||null,ibk:ORS.isbarK,bo:(ORS.bonus||[]).slice(0,30),as:(ORS.assist||[]).slice(-12),tr:!!(ORS.tRun&&!ORS.end),tl:Math.round((ORS.tEnd||0)-performance.now())}); }
function orAssistAdd(who,x){ if(!ORS.sc) { toast(`🤝 ${esc(who)}:${esc(x)}`); return; } (ORS.assist=ORS.assist||[]).push({who,x}); toast(`🤝 ${esc(who)}:${esc(x)}`);
  { const m=/^拿出 (.+)$/.exec(String(x)); if(m&&COL_BY[m[1]]){ const g=ORS.gift=ORS.gift||{}; g[m[1]]=(g[m[1]]||0)+1; orHelpTime(m[1]);
    const bx=!ORS.end&&$("orPanel").querySelector(".usebox"); if(bx){ ORS.bagOpen=true; orRender(); toast(`🎒 隊友遞來 ${colIcon(m[1])} ${esc(m[1])},已放進收集冊選單`); return; } } }
  const el=$("orPanel").querySelector(".aslog"); if(el) el.outerHTML=orAssistHTML(); netSendOR(ORS.end?"end":ORS.node?"q":"menu"); }
function orAssistHTML(end){ const a=(NET.role==="guest"?(NET.or&&NET.or.as):ORS.assist)||[]; if(!a.length) return end?"":`<div class="aslog" hidden></div>`;
  return `<div class="aslog"><div class="q">🤝 ${end?"團隊協助紀錄":"隊友協助"}</div><ul>${a.slice(end?0:-5).map(r=>`<li><b>${esc(netStr(r.who,10))}</b>${esc(netStr(r.x,40))}</li>`).join("")}</ul></div>`; }
const ASSIST=[["🙋","我來幫忙壓胸(換手)",1],["⚡","推去顫器過來、貼好貼片",1],["🫁","幫忙 Ambu 通氣",0],["💉","幫忙抽好急救藥物",0],["🩸","打電話聯絡血庫叫血",0],["🧪","幫忙抽血送 ABG",0],["📝","幫忙記錄時間與用藥",0],["📞","幫忙呼叫支援",0]];
function orGuest(d){ const P=$("orPanel"), w=window.__world; NET.or=d;
  { const now=performance.now(), tl=netNum(d.tl); NET.orT={run:!!d.tr&&d.ph==="q",tEnd:now+Math.max(0,Math.min(OR_TOTAL+600000,tl))}; }
  if(d.ph==="off"){ ORS.gsc=null; P.hidden=true; document.body.classList.remove("or-run"); return; }
  const c=OR_SCENARIOS[netNum(d.i)|0], host=esc(netName(NET.host&&NET.host.peer)); orOpen();
  if(d.ph==="menu"||!c){ P.innerHTML=orHead(`👥 ${host} 的模擬開刀房`)+`<div class="cols"><div><p class="story">${host} 正在挑選情境⋯⋯</p><p class="pt">情境由邀請你的人開始與作答;你可以在旁邊協助,或從背包拿東西出來用。</p></div><div></div></div>`; orWire(P); return; }
  ORS.gsc=c; const nodes={...c.nodes,...aclsNodes(c)}, nd=nodes[d.node];
  const lock=`<p class="lock">🔒 由 ${host} 作答;你可以協助與拿背包的東西。</p>`;
  const opts=(list,ord)=>(Array.isArray(ord)?ord:list.map((_,i)=>i)).filter(k=>list[k]).map((k,j)=>`<button type="button" class="opt" disabled><b>${"ABCD"[j]}</b><span>${list[k].t}</span></button>`).join("");
  let left="", right="";
  if(d.ph==="q"&&nd){ left=`<p class="pt">👤 ${c.patient}</p><p class="story">${nd.story}</p>${orEcg(nd)?ecgSVG(orEcg(nd),nd.v&&nd.v.hr):""}<div class="vit">${orVitHTML()}</div>${orAssistHTML()}`; right=`<div class="q">${nd.q}</div>`+opts(nd.options,d.ord)+lock+orHelpPad(d.acls); }
  else if(d.ph==="go"){ left=`<p class="pt">👤 ${c.patient}</p>`; right=`<p class="story">病人穩定了。${host} 和巡迴護理師一起把病人推到恢復室,準備交班⋯⋯</p>`; }
  else if(d.ph==="ib"){ left=`<p class="story">到恢復室了。恢復室護理師說:「好,請交班。」</p><div class="vit">${orVitHTML()}</div>`; right=`<div class="q">哪一個交班最完整、最正確?</div>`+opts(orIsbarOpts(c),d.ib)+lock; }
  else if(d.ph==="end"){ const win=d.end==="win", ck=new Set(d.ck||[]), got=c.checklist.filter((_,i)=>ck.has(i)).length;
    const steps=(d.log||[]).map(([nid,k])=>{ const o=nodes[nid]&&(k<0?(nodes[nid].use||[])[-1-k]:nodes[nid].options[k]); return o?`<li class="${o.ok||o.rescue?"ok":"no"}"><b>${o.ok?"✅ ":o.rescue?"🩹 ":o.to==="dead"?"💔 ":"⚠️ "}${o.t}</b><span>${o.fb||""}</span></li>`:""; }).join("");
    const tu=d.end==="time"; left=`<div class="end ${win?"ok":tu?"time":"dead"}"><b>${win?"🎉 病人穩定了":tu?"⏱️ 時間到":"💀 病人死亡"}</b><div style="font-size:13px;opacity:.85">診斷:${c.tag||""}</div>${win?c.win:tu?"1 分 30 秒到了,這一站時間結束。":c.dead}</div>`;
    right=`<div class="q">OSCE 評分表:做到 ${got} / ${c.checklist.length} 項</div><ul class="ck">${c.checklist.map((t,i)=>`<li class="${ck.has(i)?"hit":"miss"}"><span>${ck.has(i)?"✅":"⬜"}</span><span>${t}</span></li>`).join("")}</ul>${steps?`<div class="q">逐步檢討</div><ol class="rev">${steps}</ol>`:""}${orBonusEnd(c,(Array.isArray(d.bo)?d.bo:[]).filter(n=>typeof n==="string"))}${orAssistHTML(true)}`; }
  P.innerHTML=orHead(`👥 ${host} 主持 · ${d.acls?"🚨 ACLS":"🏥 OSCE 情境"} · 狀況 ${netNum(d.n)|0} · ${c.title}`)+(d.ph==="q"?orTimerHTML():"")+`<div class="cols"><div>${left}</div><div>${right}</div></div>`;
  orWire(P); orWireHelp(P); orTimerTick(); }
function orHelpPad(acls){ const bag=Object.keys(BAGD).filter(n=>BAGD[n]>0&&COL_BY[n]&&COL_BY[n].med);
  return `<div class="helppad"><div class="q">🤝 我來幫忙</div><div class="chips">${ASSIST.filter(a=>acls||!a[2]).map(([ic,t])=>`<button type="button" class="chip" data-as="${esc(t)}">${ic} ${t}</button>`).join("")}</div>
    <div class="q">🎒 從背包拿出來用</div><div class="chips">${bag.length?bag.map(n=>`<button type="button" class="chip bag" data-bag="${esc(n)}">${COL_BY[n].ic} ${esc(n)} <small>×${BAGD[n]}</small></button>`).join(""):`<p class="pt">背包裡還沒有藥物、管路或血品;下班去釣魚、浮潛、開漂流瓶可以收集。</p>`}</div></div>`; }
function orWireHelp(P){ P.querySelectorAll("[data-as],[data-bag]").forEach(b=>b.onclick=()=>{ const now=performance.now(); if(now-NET.asT<1200) return; NET.asT=now;
    let x; if(b.dataset.bag){ const n=b.dataset.bag; if(!(BAGD[n]>0)) return; BAGD[n]--; if(!BAGD[n]) delete BAGD[n]; try{ localStorage.setItem("island-bag",JSON.stringify(BAGD)); }catch(e){}
      x=COL_BY[n].med==="card"?`請 ${n} 來幫忙`:`拿出 ${n}`; const pad=P.querySelector(".helppad"); if(pad) pad.outerHTML=orHelpPad(NET.or&&NET.or.acls); orWireHelp(P); }
    else x=b.dataset.as;
    netSend({t:"as",x}); toast(`🤝 你:${esc(x)}`); const w=window.__world; w&&w.netSay&&w.netSay("me",x); }); }
/* ---------- 連線面板 ---------- */
function netUI(){ const box=$("netbar"); if(!box) return; const tg=$("netToggle"); if(tg) tg.textContent=NET.role?`👥 連線中 ${NET.prof.size+1}`:"👥 連線";
  const link=NET.code?location.origin+location.pathname+"?join="+NET.code:"", people=[...NET.prof.values()].map(p=>`<li><i class="${p.role==="SNA"?"sna":"crna"}">${p.role}</i>${esc(p.name||"朋友")}</li>`).join("");
  const st=NET.status?`<p class="nst">${esc(NET.status)}</p>`:"";
  if(NET.role==="host") box.innerHTML=`<span class="lbl">把房號或連結給朋友,對方打開就會來到你的島</span><div class="ncode">${NET.code}</div>
    <div class="nrow"><button type="button" id="netCopy">📋 複製邀請連結</button>${navigator.share?`<button type="button" id="netShare">📤 分享</button>`:""}<button type="button" class="sec" id="netEnd">結束連線</button></div>
    <ul class="nppl">${people||`<li class="wait">等待朋友加入⋯(最多 ${NET_MAX} 位)</li>`}</ul>${st}`;
  else if(NET.role==="guest") box.innerHTML=`<span class="lbl">你在朋友的島上(房號 ${NET.code})</span><ul class="nppl">${people}</ul><div class="nrow"><button type="button" class="sec" id="netEnd">離開</button></div>${st}`;
  else box.innerHTML=`<span class="lbl">和朋友一起玩:一起下班、一起進模擬開刀房</span>
    <div class="nrow"><button type="button" id="netHost">🔗 邀請朋友來我的島</button></div>
    <span class="lbl">或輸入朋友給你的房號</span><div class="nrow"><input id="netCode" maxlength="6" placeholder="6 碼房號" autocapitalize="characters" autocomplete="off"><button type="button" id="netGo">加入</button></div>
    ${st}<p class="nnote">使用 PeerJS 免費公共伺服器配對,之後資料直接在兩台裝置之間傳送。手術室由邀請者作答,朋友可以協助並使用背包裡的東西。</p>`;
  const on=(id,f)=>{ const e=$(id); if(e) e.onclick=f; };
  on("netHost",netHost); on("netGo",()=>netJoin(($("netCode")||{}).value)); on("netEnd",netLeave);
  on("netCopy",()=>{ try{ navigator.clipboard.writeText(link).then(()=>toast("📋 已複製邀請連結")); }catch(e){ prompt("邀請連結",link); } });
  on("netShare",()=>{ navigator.share({title:"麻醉誘島",text:`來我的麻醉誘島一起玩!房號 ${NET.code}`,url:link}).catch(()=>{}); });
  const ci=$("netCode"); if(ci) ci.onkeydown=e=>{ if(e.key==="Enter") netJoin(ci.value); };
  // 朋友(guest)畫面上的小工具列:跟著邀請者視角 / 自由視角、隨時離開
  let fl=$("netFloat"); if(!fl&&$("stage")){ fl=document.createElement("div"); fl.id="netFloat"; fl.className="netfloat"; $("stage").appendChild(fl); }
  if(fl){ fl.hidden=NET.role!=="guest"; if(NET.role==="guest"){ const hn=esc(netName(NET.host&&NET.host.peer));
    fl.innerHTML=`<button type="button" id="netFollow" aria-pressed="${!!NET.follow}">${NET.follow?`👀 跟著 ${hn} 的視角`:"🔓 自由視角"}</button><button type="button" class="sec" id="netBye">🚪 離開 ${hn} 的島</button>`;
    on("netFollow",()=>{ NET.follow=!NET.follow; const w=window.__world; if(!NET.follow&&w) w.camFollow(null); netUI(); }); on("netBye",netLeave); } } }
setInterval(()=>{ if(!NET.role||!NET.conns.size) return; const w=window.__world; if(!w||!w.netSelf) return; const d=w.netSelf(); d.t="st"; netSend(d); },100);
{ const q=new URLSearchParams(location.search), j=q.get("join"); if(j){ NET.pendingJoin=j; q.delete("join"); try{ history.replaceState(null,"",location.pathname+(q.toString()?"?"+q:"")+location.hash); }catch(e){} } }
window.addEventListener("beforeunload",()=>{ if(NET.role) netSend({t:"bye"}); });

/* ---------- question modal ---------- */
function openQ(r,list){
  const q=QB[r]; if(!q) return; const i=refInfo(r); const LAB="ABCD";
  const m=document.createElement("div"); m.className="modal";
  m.innerHTML=`<div class="mbox" role="dialog" aria-modal="true" aria-label="歷屆考題">
    <div class="mtop"><span class="mtag">${i.y} 年 · ${i.full} · 第 ${i.n} 題</span><button class="x" type="button" aria-label="關閉">✕</button></div>
    <p class="qstem">${q.q}</p>${q.f?`<figure class="qfig"><img src="${q.f}" alt="題目附圖"></figure>`:""}
    <div class="opts">${q.o.map((o,k)=>`<button type="button" class="opt" data-k="${k}"><b>${LAB[k]}</b><span>${o}</span></button>`).join("")}</div>
    <div class="ansbox"></div>
    <div class="mfoot"><button class="btn ghost" type="button" data-nav="-1">← 上一題</button><button class="btn" type="button" id="reveal">看答案</button><button class="btn ghost" type="button" data-nav="1">下一題 →</button></div></div>`;
  let pick=-1; const close=()=>{ m.remove(); document.removeEventListener("keydown",onKey); };
  const onKey=e=>{ if(e.key==="Escape"){ e.stopPropagation(); close(); } }; document.addEventListener("keydown",onKey,true);
  m.addEventListener("click",e=>{ if(e.target===m) close(); });
  m.querySelector(".x").onclick=close;
  m.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{ if(m.dataset.done) return; pick=+b.dataset.k; m.querySelectorAll(".opt").forEach(x=>x.classList.toggle("pick",x===b)); });
  m.querySelector("#reveal").onclick=()=>{ m.dataset.done=1;
    m.querySelectorAll(".opt").forEach(x=>{ const k=+x.dataset.k; if(q.a.includes(k)) x.classList.add("right"); else if(k===pick) x.classList.add("wrong"); });
    const ok=q.a.includes(pick);
    // 詳解下方列出書庫裡收錄這題的主題,點一下直接打開那本書複習
    const tps=T.filter(t=>(t.refs||[]).includes(r)).slice(0,4);
    m.querySelector(".ansbox").innerHTML=`<div class="ans"><b>官方答案 ${q.a.map(k=>LAB[k]).join("、")}</b>${pick<0?"":ok?"　答對了。":"　這題再看一次重點。"}${q.e?`<br><span class="qexp">📝 詳解:${q.e}</span>`:""}${tps.length?`<div class="qbooks">📖 書庫裡的相關主題:${tps.map(t=>`<button type="button" class="qbook" data-book="${t.id}">${t.name}</button>`).join("")}</div>`:""}</div>`;
    m.querySelectorAll("[data-book]").forEach(b=>b.onclick=()=>{ const id=b.dataset.book; close(); openBook(id); });
    m.querySelector("#reveal").disabled=true;
    if(ok){ done.add(r); saveDone(); document.querySelectorAll(`.qchip[data-ref="${r}"]`).forEach(c=>c.classList.add("done")); award("q:"+r); } else if(pick>=0) wrongAns(); };
  const idx=list.indexOf(r);
  m.querySelectorAll("[data-nav]").forEach(b=>{ const j=idx+(+b.dataset.nav); if(j<0||j>=list.length) b.disabled=true; else b.onclick=()=>{ close(); openQ(list[j],list); }; });
  document.body.appendChild(m); m.querySelector(".opt").focus();
}

/* ---------- open book ---------- */
const AIPICK={};
let bookEl=null, bookTopic=null;
function aiHTML(t,whole){
  const own=(AIBY[t.id]||[]); const s=sysById[t.sys];
  const list = own.length? own : s.aiq.map((_,i)=>({sid:s.id,i}));
  const LAB="ABCD";
  const qs=list.map(({sid,i},n)=>{ const q=sysById[sid].aiq[i]; const key=sid+":"+i; const p=AIPICK[key]; const dn=p!==undefined;
    return `<div class="aq" data-key="${key}"><div class="aqs"><span class="aqn">${n+1}</span>${q.q}</div>
      <div class="opts">${q.o.map((o,k)=>`<button type="button" class="opt${dn&&k===q.a?" right":""}${dn&&k===p&&p!==q.a?" wrong":""}" data-k="${k}"${dn?" disabled":""}><b>${LAB[k]}</b><span>${o}</span></button>`).join("")}</div>
      ${dn?`<div class="ans"><b>${p===q.a?"答對了":"正解 "+LAB[q.a]}</b>　${q.e}${q.refs.length?`<div class="simref">相似考古題:`:""}${q.refs.map(r=>{const k=refInfo(r);return `<button type="button" class="qchip${done.has(r)?" done":""}" data-ref="${r}">${k.y} ${k.s} ${k.n}</button>`;}).join("")}${q.refs.length?"</div>":""}</div>`:""}</div>`; }).join("");
  const keys=list.map(({sid,i})=>sid+":"+i); const ans=keys.filter(k=>AIPICK[k]!==undefined);
  const ok=ans.filter(k=>{ const [sid,i]=k.split(":"); return sysById[sid].aiq[+i].a===AIPICK[k]; }).length;
  return {n:list.length, own:own.length>0, html:`${own.length||whole?"":`<p class="meta">這個主題沒有專屬猜題,以下是${s.name}街區的全部 AI 猜題。</p>`}
    <div class="aiscore">已作答 ${ans.length}/${list.length} · 答對 ${ok} 題${ans.length?`<button type="button" class="linkbtn" data-aireset>重新作答</button>`:""}</div>${qs}`, keys};
}
function notesHTML(t){
  const rel=L.filter(l=>l[0]===t.id||l[1]===t.id).map(l=>({o:byId[l[0]===t.id?l[1]:l[0]],why:l[2]}));
  const det=t.detail?t.detail.map(d=>`<div class="dsec${d.h==="考試提醒"?" tip":""}"><h5>${d.h}</h5>${Array.isArray(d.p)?`<ul>${d.p.map(x=>`<li>${x}</li>`).join("")}</ul>`:`<p>${d.p}</p>`}${d.more&&d.more.length?`<ul>${d.more.map(x=>`<li>${x}</li>`).join("")}</ul>`:""}</div>`).join(""):"";
  return `<p class="one">${t.one}</p>${det}
    <div class="quick"><b>考前快速複習</b><ul>${t.pts.map(p=>`<li>${p}</li>`).join("")}</ul></div>
    ${rel.length?`<div class="dsec"><h5>跨區關聯</h5><div class="rel">${rel.map(r=>`<button type="button" data-go="${r.o.id}" style="--rc:var(--${r.o.sys})"><b>${r.o.name}</b><span>${r.why}</span></button>`).join("")}</div></div>`:""}
    ${t.src&&t.src.length?`<div class="srcline">📖 依 ${t.src.join("、")} 整理</div>`:`<div class="srcline">📖 依一般麻醉學教科書與臨床指引整理(尚未對照 Miller 章節)</div>`}`;
}
/* 麻醉影響總覽:每個街區一本,最上方仍保留整區的歷屆考古題與 AI 猜題 */
function overviewHTML(sid){
  const o=(typeof OVERVIEW!=="undefined")&&OVERVIEW[sid]; if(!o) return "";
  const t=o.table;
  return `<p class="one">${o.intro}</p>
    ${t?`<div class="ovtbl"><table><thead><tr>${t.cols.map(c=>`<th scope="col">${c}</th>`).join("")}</tr></thead><tbody>${t.rows.map(r=>`<tr><th scope="row">${r[0]}</th>${r.slice(1).map((c,i)=>`<td data-l="${t.cols[i+1]}">${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
      <div class="ovlegend">↑ 增加 · ↓ 減少 · ↔ 大致不變<span class="wide-only"> · 表格可左右滑動</span></div>`:""}
    ${o.sections.map(x=>`<div class="dsec"><h5>${x.h}</h5><ul>${x.p.map(li=>`<li>${li}</li>`).join("")}</ul></div>`).join("")}
    <div class="srcline">📖 依 ${o.src.join("、")} 整理改寫,非原文。</div>`;
}
function openOverview(sid, keep){
  const s=sysById[sid]; const o=OVERVIEW[sid]; if(!s||!o) return;
  const ts=topicsOf(sid); const all=[...new Set(ts.flatMap(t=>t.refs))];
  const ai=aiHTML({id:"__ov_"+sid, sys:sid},true);
  const prev = bookEl && bookTopic==="ov-"+sid ? {p:bookEl.querySelector("#pqPast")?.open, a:bookEl.querySelector("#pqAI")?.open, y:bookEl.querySelector(".page")?.scrollTop} : null;
  if(!bookEl){ bookEl=document.createElement("div"); bookEl.className="bookov"; document.body.appendChild(bookEl);
    bookEl.addEventListener("pointerdown",e=>{ bookEl._pd=e.target===bookEl; }); bookEl.addEventListener("click",e=>{ if(e.target===bookEl && bookEl._pd){ closeBook(); return; } if(bookEl) bookEl._pd=false; }); document.addEventListener("keydown",bookKey); }
  bookTopic="ov-"+sid;
  bookEl.innerHTML=`<div class="book" role="dialog" aria-modal="true" aria-label="${o.title}" style="--c:var(--${sid})"><div class="page">
    <div class="bk-head"><div><button class="toshelf" type="button" data-shelf="${sid}">← 回到書櫃</button><div class="kicker">${s.name} · 總覽 · ${ts.length} 本書 · 歷屆考古題 ${all.length} 題</div><h3>${o.title}</h3></div><button class="x" type="button" aria-label="闔上書本">✕</button></div>
    <div class="page-in">
      <details class="pq" id="pqPast"><summary>📚 歷屆${s.name}考古題(${all.length} 題)</summary><div class="pqb">
        <p class="meta">依主題整理;點題號作答,再看官方答案。</p>
        ${ts.filter(t=>t.refs.length).map(t=>`<div class="pastgrp" style="border-top:1px solid var(--line);padding:9px 0"><div style="font-weight:600;font-size:14px;margin-bottom:6px">${t.name} <small class="meta">${t.refs.length} 題</small></div><div class="cs">${t.refs.slice().sort().reverse().map(r=>{const k=refInfo(r);return `<button type="button" class="qchip${done.has(r)?" done":""}" data-ref="${r}" data-t="${t.id}">${k.y} ${k.s} ${k.n}</button>`;}).join("")}</div></div>`).join("")}
      </div></details>
      <details class="pq" id="pqAI"><summary>✏️ ${s.name} AI 猜題(${ai.n} 題)</summary><div class="pqb">${ai.html}</div></details>
      ${overviewHTML(sid)}
      <div class="dsec"><h5>本區的書</h5><div class="ovbooks">${ts.map(t=>`<button type="button" data-open="${t.id}">📕 ${t.name}</button>`).join("")}</div></div>
    </div></div></div>`;
  if(prev){ bookEl.querySelector("#pqPast").open=!!prev.p; bookEl.querySelector("#pqAI").open=!!prev.a; bookEl.querySelector(".book").style.animation="none"; bookEl.querySelector(".page").scrollTop=prev.y||0; }
  bookEl.querySelector(".x").onclick=closeBook;
  bookEl.querySelectorAll(".qchip").forEach(b=>b.onclick=()=>{ const t=b.dataset.t?byId[b.dataset.t]:null; openQ(b.dataset.ref, t?t.refs:[b.dataset.ref]); });
  bookEl.querySelectorAll(".aq .opt").forEach(b=>b.onclick=()=>{ const key=b.closest(".aq").dataset.key; AIPICK[key]=+b.dataset.k; aiAnswer(key,+b.dataset.k); openOverview(sid,true); });
  const rs=bookEl.querySelector("[data-aireset]"); if(rs) rs.onclick=()=>{ ai.keys.forEach(k=>delete AIPICK[k]); openOverview(sid,true); };
  bookEl.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>{ openBook(b.dataset.open); world&&world.pickBook(b.dataset.open); });
  if(!keep) bookEl.querySelector(".x").focus({preventScroll:true});
  try{ history.replaceState(null,"","#o-"+sid); }catch(e){}
}
document.addEventListener("click",e=>{ const b=e.target.closest&&e.target.closest(".toshelf"); if(b){ e.preventDefault(); openShelfMenu(b.dataset.shelf); } });
function openShelfMenu(sid){
  const s=sysById[sid]; if(!s) return; const o=OVERVIEW[sid]; const ts=topicsOf(sid); const all=[...new Set(ts.flatMap(t=>t.refs))];
  if(!bookEl){ bookEl=document.createElement("div"); bookEl.className="bookov"; document.body.appendChild(bookEl);
    bookEl.addEventListener("pointerdown",e=>{ bookEl._pd=e.target===bookEl; }); bookEl.addEventListener("click",e=>{ if(e.target===bookEl && bookEl._pd){ closeBook(); return; } if(bookEl) bookEl._pd=false; }); document.addEventListener("keydown",bookKey); }
  bookTopic="menu-"+sid;
  bookEl.innerHTML=`<div class="book shelfmenu" role="dialog" aria-modal="true" aria-label="${s.name} 文庫" style="--c:var(--${sid})"><div class="page">
    <div class="bk-head"><div><div class="kicker">${s.name} 文庫 · ${ts.length} 本書 · 歷屆考古題 ${all.length} 題</div><h3>想看哪一本?</h3></div><button class="x" type="button" aria-label="關上書櫃">✕</button></div>
    <div class="page-in">
      ${o?`<button type="button" class="sm-ov" data-pick="ov-${sid}"><span class="sm-ic">📖</span><span><b>${o.title}</b><small>麻醉影響總覽 · 全區歷屆考古題 ${all.length} 題 · AI 猜題 ${s.aiq.length} 題</small></span></button>`:""}
      <div class="sm-grid">${ts.map(t=>`<button type="button" data-pick="${t.id}"><span class="sm-sp"></span><span><b>${t.name}</b><small>歷屆考古題 ${t.refs.length} 題</small></span></button>`).join("")}</div>
    </div></div></div>`;
  bookEl.querySelector(".x").onclick=closeBook;
  bookEl.querySelectorAll("[data-pick]").forEach(b=>b.onclick=()=>{ const id=b.dataset.pick; if(id.startsWith("ov-")){ world&&world.pickBook(id); openOverview(sid); } else { world&&world.pickBook(id); openBook(id); } });
  bookEl.querySelector(".x").focus({preventScroll:true});
}
function openBook(id, keepScroll){
  const t=byId[id]; if(!t) return; const s=sysById[t.sys];
  const ys=[...new Set(t.refs.map(r=>refInfo(r).y))].sort();
  const byYear={}; t.refs.forEach(r=>{ const i=refInfo(r); (byYear[i.y]=byYear[i.y]||[]).push(r); });
  const ai=aiHTML(t);
  const prevOpen = bookEl && bookTopic===id ? {p:bookEl.querySelector("#pqPast")?.open, a:bookEl.querySelector("#pqAI")?.open, y:bookEl.querySelector(".page")?.scrollTop} : null;
  if(!bookEl){ bookEl=document.createElement("div"); bookEl.className="bookov"; document.body.appendChild(bookEl);
    bookEl.addEventListener("pointerdown",e=>{ bookEl._pd=e.target===bookEl; }); bookEl.addEventListener("click",e=>{ if(e.target===bookEl && bookEl._pd){ closeBook(); return; } if(bookEl) bookEl._pd=false; }); document.addEventListener("keydown",bookKey); }
  bookTopic=id;
  const ts=topicsOf(t.sys); const k=ts.findIndex(x=>x.id===id);
  bookEl.innerHTML=`<div class="book" role="dialog" aria-modal="true" aria-label="${t.name}" style="--c:var(--${t.sys})"><div class="page">
    <div class="bk-head"><div><button class="toshelf" type="button" data-shelf="${t.sys}">← 回到書櫃</button><div class="kicker">${s.name} · 第 ${k+1} / ${ts.length} 本${mgLabel(t)?` · ${mgLabel(t)}`:""} · 歷屆考古題 ${t.refs.length} 題${ys.length?`(${ys[0]}–${ys[ys.length-1]} 年)`:""}</div><h3>${t.name}<small>${t.en}</small></h3></div><button class="x" type="button" aria-label="闔上書本">✕</button></div>
    <div class="page-in">
      <details class="pq" id="pqPast"${t.refs.length?"":" hidden"}><summary>📚 歷屆考古題(${t.refs.length} 題)</summary><div class="pqb">
        <p class="meta">點題號作答,再看官方答案;答對的題號會變綠。</p>
        <div class="yrs">${Object.keys(byYear).sort((a,b)=>b-a).map(y=>`<div class="yr"><span class="y">${y}</span><div class="cs">${byYear[y].map(r=>{const i=refInfo(r);return `<button type="button" class="qchip${done.has(r)?" done":""}" data-ref="${r}" data-own="1">${i.s} ${i.n}</button>`;}).join("")}</div></div>`).join("")}</div></div></details>
      <details class="pq" id="pqAI"><summary>✏️ AI 猜題(${ai.n} 題)</summary><div class="pqb">${ai.html}</div></details>
      ${notesHTML(t)}
      <div class="pager"><button class="btn ghost" type="button" data-step="-1"${k<=0?" disabled":""}>← 上一本</button><button class="btn ghost" type="button" data-step="1"${k>=ts.length-1?" disabled":""}>下一本 →</button></div>
    </div></div></div>`;
  if(prevOpen){ bookEl.querySelector("#pqPast").open=!!prevOpen.p; bookEl.querySelector("#pqAI").open=!!prevOpen.a; bookEl.querySelector(".book").style.animation="none"; bookEl.querySelector(".page").scrollTop=prevOpen.y||0; }
  bookEl.querySelector(".x").onclick=closeBook;
  bookEl.querySelectorAll(".qchip").forEach(b=>b.onclick=()=>openQ(b.dataset.ref, b.dataset.own?t.refs:[b.dataset.ref]));
  bookEl.querySelectorAll(".aq .opt").forEach(b=>b.onclick=()=>{ const key=b.closest(".aq").dataset.key; AIPICK[key]=+b.dataset.k; aiAnswer(key,+b.dataset.k); openBook(id,true); });
  const rs=bookEl.querySelector("[data-aireset]"); if(rs) rs.onclick=()=>{ ai.keys.forEach(k=>delete AIPICK[k]); openBook(id,true); };
  bookEl.querySelectorAll("[data-step]").forEach(b=>b.onclick=()=>{ const n=ts[k+(+b.dataset.step)]; if(n){ openBook(n.id); world&&world.pickBook(n.id); } });
  bookEl.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>{ const o=byId[b.dataset.go]; closeBook(); if(world && o.sys!==world.focus()) world.jumpTo(o.sys, o.id); else { openBook(o.id); world&&world.pickBook(o.id); } });
  if(!keepScroll) bookEl.querySelector(".x").focus({preventScroll:true});
  try{ history.replaceState(null,"","#t-"+id); }catch(e){}
}
function bookKey(e){ if(e.key==="Escape" && bookEl && !document.querySelector(".modal")) closeBook(); }
function closeBook(){ if(!bookEl) return; bookEl.remove(); bookEl=null; document.removeEventListener("keydown",bookKey); const bt=bookTopic||""; const t=byId[bt]; const os=bt.startsWith("ov-")?bt.slice(3):bt.startsWith("menu-")?bt.slice(5):null; bookTopic=null; world&&world.closeBook(); try{ history.replaceState(null,"",t?"#d-"+t.sys:os?"#d-"+os:location.pathname); }catch(e){} }

/* ================= 3D world ================= */
let world=null;
try{ world = await buildWorld(); window.__world=world; try{ window.__pickFace(localStorage.getItem("island-face")||"auto",true); if(localStorage.getItem("island-gold")==="1"&&hasSkill("gold")) world.toggleGold(true); }catch(e){} }
catch(err){ console.error(err); $("loading").textContent="這台裝置無法顯示 3D 島嶼,已切換到書目清單。"; setTimeout(()=>setView("list"),1200); }
const h0=location.hash;
const h0id=(D.alias&&D.alias[h0.slice(3)])||h0.slice(3);
if(h0.startsWith("#t-") && byId[h0id]){ const t=byId[h0id]; if(world) world.goDistrict(t.sys,t.id,true); else openBook(t.id); }
else if(h0.startsWith("#d-") && sysById[h0.slice(3)] && world) world.goDistrict(h0.slice(3),null,true);
else if(h0.startsWith("#o-") && sysById[h0.slice(3)]){ if(world) world.goDistrict(h0.slice(3),"ov-"+h0.slice(3),true); else openOverview(h0.slice(3)); }

async function buildWorld(){
  const THREE = await import("three");
  const {OrbitControls} = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js");
  const {RoundedBoxGeometry} = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/geometries/RoundedBoxGeometry.js");
  try{ await Promise.race([Promise.all([document.fonts.load('400 40px "Huninn"'),document.fonts.load('700 40px "Noto Sans TC"'),document.fonts.load('700 40px "Noto Serif TC"')]), new Promise(r=>setTimeout(r,2500))]); }catch(e){}

  const stage=$("stage");
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  stage.insertBefore(renderer.domElement,stage.firstChild);
  $("loading").remove();
  const scene=new THREE.Scene();
  scene.fog=new THREE.Fog(0xD6EEF7,180,520);
  const camera=new THREE.PerspectiveCamera(46,1,0.5,1400);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true; controls.dampingFactor=.08; controls.enablePan=true; controls.screenSpacePanning=true; controls.panSpeed=.9;
  controls.minDistance=9; controls.maxDistance=290; controls.maxPolarAngle=1.45; controls.minPolarAngle=.2;
  const HOME={pos:new THREE.Vector3(0,40,72),tgt:new THREE.Vector3(0,4,4)};
  camera.position.copy(HOME.pos); controls.target.copy(HOME.tgt);

  const hemi=new THREE.HemisphereLight(0xFFFFFF,0xF2D3B6,1.35); scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xFFF1E0,1.6); sun.position.set(-26,48,30); sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048); Object.assign(sun.shadow.camera,{left:-42,right:42,top:42,bottom:-42,near:1,far:140}); sun.shadow.bias=-0.0006; sun.shadow.normalBias=.04;
  scene.add(sun);

  const M=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.85,metalness:0,...o});
  const mix=(a,b,t)=>{ const A=new THREE.Color(a),B=new THREE.Color(b); return A.lerp(B,t); };
  const up0=new THREE.Vector3(0,1,0);
  const shadowy=o=>{ o.traverse(m=>{ if(m.isMesh){ m.castShadow=true; m.receiveShadow=true; } }); return o; };

  /* sea + island */
  /* ocean: GPU waves (several directional swells + shore-bound rollers), fresnel sky reflection,
     sun glitter, whitecaps on crests and a breaking-surf band around the beach */
  const WAVES=[[1,.12,.055,1.0],[.7,-.7,.08,1.3],[-.4,1,.13,1.9],[.9,.45,.21,2.6],[-.8,-.3,.34,3.4]]; // dx,dz,k,speed
  const ISL=ISLAND_DEF.map((d,i)=>({...d,i,c:[new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,-61),new THREE.Vector3(38.9,0,-34.6),new THREE.Vector3(-47.6,0,-27.5),new THREE.Vector3(59,0,15.7),new THREE.Vector3(-50.5,0,28.5),new THREE.Vector3(0,0,67)][i],R:[30,24,15,24,24,21,30][i],ring:[7.6,4.4,0,0,4.4,4.4,4.4][i],dring:[20.5,14.6,0,0,14.6,12.6,20.5][i],doff:[0,0,0,0,0,0,.5][i]}));   // doff:街區起始角度錯開半格,橋頭才不會正對一個街區
  const ARCH_C=ISL.reduce((a,I)=>a.add(I.c),new THREE.Vector3()).multiplyScalar(1/ISL.length);
  const coastR=(x,z)=>{ let m=1e9; for(const I of ISL){ const d=Math.hypot(x-I.c.x,z-I.c.z)-I.R; if(d<m) m=d; } return 30+m; };
  const ISL_GLSL=ISL.map(I=>`{ vec2 cc=vec2(${I.c.x.toFixed(1)},${I.c.z.toFixed(1)}); float dd=length(p.xz-cc)-${I.R.toFixed(1)}; if(dd<m){ m=dd; nc=cc; } }`).join(" ");
  const waveH=(x,z,t,A)=>{ const r=coastR(x,z); const damp=Math.min(1,Math.max(0,(r-33)/16)); let h=0;
    WAVES.forEach(([dx,dz,k,w],i)=>{ const L=Math.hypot(dx,dz); h+=Math.sin((x*dx+z*dz)/L*k+t*w)*(.9/(i+1.4)); }); h*=A*damp;
    const sh=r>30.5&&r<46?Math.sin(r*.9+t*2.4)*.22*(1-Math.min(1,(r-30.5)/15.5)):0; return h+sh; };
  const seaU=THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{uT:{value:0},uA:{value:.35},uDeep:{value:new THREE.Color(0x0E4F7A)},uShal:{value:new THREE.Color(0x3FC1C9)},
    uSky:{value:new THREE.Color(0xBFE3F5)},uSun:{value:new THREE.Vector3(0,.3,-1)},uSunC:{value:new THREE.Color(0xFFF4D6)},uSunI:{value:1},uFoam:{value:1},uNight:{value:0}}]);
  const seaMat=new THREE.ShaderMaterial({uniforms:seaU,fog:true,lights:false,
    vertexShader:`
      uniform float uT,uA; varying vec3 vW; varying vec3 vN; varying float vH; varying float vR;
      #include <fog_pars_vertex>
      void main(){
        vec3 p=position; float m=1e9; vec2 nc=vec2(0.); ${ISL_GLSL} float r=30.+m; float damp=clamp((r-33.)/16.,0.,1.);
        vec4 W[5]; W[0]=vec4(1.,.12,.055,1.0); W[1]=vec4(.7,-.7,.08,1.3); W[2]=vec4(-.4,1.,.13,1.9); W[3]=vec4(.9,.45,.21,2.6); W[4]=vec4(-.8,-.3,.34,3.4);
        float h=0.; vec2 g=vec2(0.);
        for(int i=0;i<5;i++){ vec2 d=normalize(W[i].xy); float a=.9/(float(i)+1.4); float ph=dot(p.xz,d)*W[i].z+uT*W[i].w; h+=sin(ph)*a; g+=d*W[i].z*cos(ph)*a; }
        h*=uA*damp; g*=uA*damp;
        if(r>30.5&&r<46.){ float f=1.-(r-30.5)/15.5; h+=sin(r*.9+uT*2.4)*.22*f; g+=normalize(p.xz-nc+vec2(.0001))*cos(r*.9+uT*2.4)*.9*.22*f; }
        p.y+=h; vH=h/(max(uA,.2)); vR=r;
        vN=normalize(vec3(-g.x,1.,-g.y));
        vec4 wp=modelMatrix*vec4(p,1.); vW=wp.xyz;
        vec4 mvPosition=viewMatrix*wp; gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader:`
      uniform float uT,uA,uSunI,uFoam,uNight; uniform vec3 uDeep,uShal,uSky,uSun,uSunC; varying vec3 vW; varying vec3 vN; varying float vH; varying float vR;
      #include <fog_pars_fragment>
      float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }
      float fbm(vec2 p){ float v=0.,a=.5; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.1; a*=.5; } return v; }
      void main(){
        vec2 q=vW.xz; float t=uT;
        // small ripples perturb the normal
        float e=.6; float n0=fbm(q*.35+vec2(t*.25,t*.18)); float nx=fbm((q+vec2(e,0.))*.35+vec2(t*.25,t*.18)); float nz=fbm((q+vec2(0.,e))*.35+vec2(t*.25,t*.18));
        vec3 N=normalize(vN+vec3(n0-nx,0.,n0-nz)*1.6);
        vec3 V=normalize(cameraPosition-vW);
        float fres=pow(1.-max(dot(N,V),0.),4.)*.85+.06;
        float shoreT=1.-smoothstep(30.5,58.,vR);
        vec3 water=mix(uDeep,uShal,shoreT*.85);
        water*=.82+.25*clamp(vH*.5+.5,0.,1.);
        vec3 col=mix(water,uSky,fres);
        vec3 L=normalize(uSun); vec3 H=normalize(L+V);
        float spec=pow(max(dot(N,H),0.),260.)*3.+pow(max(dot(N,H),0.),40.)*.25;
        col+=uSunC*spec*uSunI;
        // whitecaps on wave crests (more in rough weather) and surf near the beach
        float cap=smoothstep(.78,1.15,vH+fbm(q*.6+t*.3)*.5)*smoothstep(.25,1.2,uA)*smoothstep(32.,40.,vR);
        float surfBand=1.-smoothstep(30.6,33.2,vR);
        float roll=smoothstep(.55,1.,sin(vR*.9+t*2.4))*(1.-smoothstep(31.,40.,vR));
        float foam=max(cap,max(surfBand*(.55+.45*fbm(q*1.4+t*.5)),roll*.75))*smoothstep(.25,.55,fbm(q*1.1-t*.2)+.25);
        col=mix(col,vec3(1.)*(1.-uNight*.55),clamp(foam*uFoam,0.,1.));
        gl_FragColor=vec4(col,1.);
        #include <fog_fragment>
      }`});
  const seaGeo=new THREE.PlaneGeometry(1100,1100,320,320); seaGeo.rotateX(-Math.PI/2);
  const sea=new THREE.Mesh(seaGeo,seaMat); sea.position.y=-.7; scene.add(sea);
  const foams=[];
  const R=30, TOP=1.4;
  const isl=new THREE.Mesh(new THREE.CylinderGeometry(R,R+2.2,2.6,96),[M(0xF1D5AE),M(0xFFF6E6),M(0xF1D5AE)]); isl.position.y=TOP-1.3; isl.receiveShadow=true; scene.add(isl);
  const grass=new THREE.Mesh(new THREE.CircleGeometry(R-.6,96),M(0xFFFBF0)); grass.rotation.x=-Math.PI/2; grass.position.y=TOP+.01; grass.receiveShadow=true; scene.add(grass);

  /* plaza with name */
  const tex=(w,h,draw)=>{ const c=document.createElement("canvas"); c.width=w; c.height=h; draw(c.getContext("2d"),w,h); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; return t; };
  const plaza=new THREE.Mesh(new THREE.CircleGeometry(7,64),new THREE.MeshStandardMaterial({roughness:.9,map:tex(512,512,(g,w,h)=>{ g.fillStyle="#FCE7CF"; g.beginPath(); g.arc(w/2,h/2,w/2,0,7); g.fill();
    g.strokeStyle="#F3C9A0"; g.lineWidth=10; g.setLineDash([22,16]); g.beginPath(); g.arc(w/2,h/2,w/2-22,0,7); g.stroke();
    })}));
  plaza.rotation.x=-Math.PI/2; plaza.position.y=TOP+.03; plaza.receiveShadow=true; scene.add(plaza);
  for(const I of ISL.slice(1)){
    const SIDE=[0,0xF0CBB8,0xEFCF9A,0xE6DCC8,0xF3D9B5,0xC9C3B8,0xE9D3B2][I.i]||0xF1D5AE, TOPC=[0,0xFFF1EC,0xFFF5DC,0xFBFBF6,0xFFF8EC,0xF1F1EE,0xFDF6EA][I.i]||0xFFFBF0;
    const b=new THREE.Mesh(new THREE.CylinderGeometry(I.R,I.R+2.2,2.6,80),[M(SIDE),M(TOPC),M(SIDE)]); b.position.set(I.c.x,TOP-1.3,I.c.z); b.receiveShadow=true; scene.add(b);
    const gr=new THREE.Mesh(new THREE.CircleGeometry(I.R-.6,80),M(TOPC)); gr.rotation.x=-Math.PI/2; gr.position.set(I.c.x,TOP+.01,I.c.z); gr.receiveShadow=true; scene.add(gr); }
  /* every solid thing on the islands registers a circle here; route() walks around them */
  const OBS=[]; let FOUNTAIN=null; const DECO_OBS=[];   // DECO_OBS:玩家佈置的東西(小麻、海龜、寄居蟹都要繞開)
  const addObs=(o,pad=.45,min=.55)=>{ o.updateMatrixWorld(true); const b=new THREE.Box3().setFromObject(o); if(b.isEmpty()) return; const c=new THREE.Vector3(); o.getWorldPosition(c); c.y=0; const ext=Math.max(Math.abs(b.min.x-c.x),Math.abs(b.max.x-c.x),Math.abs(b.min.z-c.z),Math.abs(b.max.z-c.z)); const r=Math.min(3.2,ext*.8+pad); if(r>=min) OBS.push({c,r,o}); };
  const trees=[];
  /* 矮樹叢:幾團低矮的葉球 + 小紅莓果(共用幾何;很矮,不擋視野) */
  const BUSH=(()=>{ const leafMs=[0x3F8F4E,0x4FA35A,0x5DB565,0x377F47].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.8,flatShading:true}));
    const blobG=new THREE.IcosahedronGeometry(1,1), berryM=new THREE.MeshStandardMaterial({color:0xD8344A,roughness:.4}), berryG=new THREE.SphereGeometry(.11,8,6);
    const flowerM=new THREE.MeshStandardMaterial({color:0xFFF1F4,roughness:.6}), flowerG=new THREE.SphereGeometry(.09,6,5);
    function mk(s,k){ const p=new THREE.Group(), n=5+(k%3), H=1.35;
      for(let i=0;i<n;i++){ const a=i/n*Math.PI*2+k*.7, rr=i===0?0:.55+((i*3+k)%3)*.12, sz=i===0?.78:.5+((i*5+k)%4)*.07;
        const m=new THREE.Mesh(blobG,leafMs[(i+k)%4]); m.position.set(Math.cos(a)*rr,sz*.8+(i===0?.15:0),Math.sin(a)*rr); m.scale.set(sz,sz*.82,sz); m.rotation.set(i*1.3,i*.7+k,0); p.add(m); }
      const nb=6+(k%4); for(let i=0;i<nb;i++){ const a=i/nb*Math.PI*2+k, e=.35+((i*7+k)%5)*.12, R=.95;
        const b=new THREE.Mesh(k%2?berryG:flowerG,k%2?berryM:flowerM); b.position.set(Math.cos(a)*R*Math.cos(e),.55+Math.sin(e)*.75,Math.sin(a)*R*Math.cos(e)); p.add(b); }
      p.scale.setScalar(s); p.userData.crown=H*s; return p; }
    return {mk, coco:()=>{ const c=new THREE.Mesh(new THREE.SphereGeometry(.2,12,10),berryM); return c; },
      leaf:()=>{ const g=new THREE.Group(); const m=new THREE.Mesh(blobG,leafMs[2]); m.scale.set(.22,.04,.14); g.add(m); return g; }}; })();
  // Morgan islands: plaza + an open-book monument in the middle
  for(const I of ISL.slice(4,6)){ const pz=plaza.clone(); pz.scale.setScalar(.72); pz.position.set(I.c.x,TOP+.03,I.c.z); scene.add(pz);
    const g=new THREE.Group(); g.position.set(I.c.x,TOP,I.c.z); g.rotation.y=Math.atan2(-(I.c.x-ISL[0].c.x),-(I.c.z-ISL[0].c.z)); scene.add(g);
    const stone=M(0xF4ECE0,{roughness:.6}), page=M(0xFFFBF0,{roughness:.8}), cover=M(I.i===4?0x8E3D5E:0x2E5E7E,{roughness:.6});
    const ped=new THREE.Mesh(new THREE.CylinderGeometry(2.0,2.4,1.2,8),stone); ped.position.y=.6; g.add(ped);
    const ped2=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.7,.9,8),stone); ped2.position.y=1.65; g.add(ped2);
    for(const sx of [-1,1]){ const cv=new THREE.Mesh(new RoundedBoxGeometry(1.9,.14,2.6,2,.05),cover); cv.position.set(sx*.95,2.35,0); cv.rotation.z=-sx*.22; g.add(cv);
      const pg=new THREE.Mesh(new THREE.BoxGeometry(1.75,.16,2.4),page); pg.position.set(sx*.93,2.47,0); pg.rotation.z=-sx*.22; g.add(pg); }
 shadowy(g); OBS.push({c:new THREE.Vector3(I.c.x,0,I.c.z),r:3.0}); }
  // organ island: central plaza + fountain
  { const I=ISL[1]; const pz=plaza.clone(); pz.scale.setScalar(.72); pz.position.set(I.c.x,TOP+.03,I.c.z); scene.add(pz);
    const stone=M(0xF4ECE0,{roughness:.6}), water=new THREE.MeshPhysicalMaterial({color:0x6CC9E6,roughness:.1,clearcoat:1,transparent:true,opacity:.85});
    const f=new THREE.Group(); f.position.set(I.c.x,TOP,I.c.z); scene.add(f);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(3.1,3.3,.7,40),stone); base.position.y=.35; f.add(base);
    const pool=new THREE.Mesh(new THREE.CircleGeometry(2.75,40),water); pool.rotation.x=-Math.PI/2; pool.position.y=.66; f.add(pool);
    const col=new THREE.Mesh(new THREE.CylinderGeometry(.35,.5,2.0,16),stone); col.position.y=1.5; f.add(col);
    const bowl=new THREE.Mesh(new THREE.SphereGeometry(1.2,24,10,0,Math.PI*2,Math.PI/2,Math.PI/2),stone); bowl.position.y=2.75; f.add(bowl);
    const top=new THREE.Mesh(new THREE.CircleGeometry(1.1,24),water); top.rotation.x=-Math.PI/2; top.position.y=2.74; f.add(top);
    const jet=new THREE.Mesh(new THREE.ConeGeometry(.25,1.4,12,1,true),new THREE.MeshPhysicalMaterial({color:0xBFEFFF,transparent:true,opacity:.55,roughness:.1})); jet.position.y=3.4; f.add(jet);
    for(let k=0;k<8;k++){ const a=k/8*Math.PI*2; const arcC=new THREE.CatmullRomCurve3([new THREE.Vector3(Math.cos(a)*.9,2.8,Math.sin(a)*.9),new THREE.Vector3(Math.cos(a)*1.7,3.0,Math.sin(a)*1.7),new THREE.Vector3(Math.cos(a)*2.4,.8,Math.sin(a)*2.4)]);
      f.add(new THREE.Mesh(new THREE.TubeGeometry(arcC,16,.05,6,false),new THREE.MeshPhysicalMaterial({color:0xCFF3FF,transparent:true,opacity:.5,roughness:.1}))); }
    shadowy(f); f.userData.act="wish"; FOUNTAIN=f; OBS.push({c:new THREE.Vector3(I.c.x,0,I.c.z),r:3.9}); }
  const LOUNGERS=[];
  // pain island: bushes and two beach loungers
  { const I=ISL[2];
    [[.55,1.15],[2.0,1.05],[3.6,1.25],[4.6,1.1]].forEach(([a,sc],k)=>{ const r=I.R-3.2; const p=BUSH.mk(sc,k); p.position.set(I.c.x+Math.cos(a)*r,TOP,I.c.z+Math.sin(a)*r);
      p.rotation.y=-a; p.userData.ph=k*1.7; p.userData.act="palm"; p.userData.shk=0; p.userData.home=2; trees.push(p); shadowy(p); scene.add(p); });
    const towel=[0xFF7A8A,0x7EC4CF]; [-1,1].forEach((sd,k)=>{ const g=new THREE.Group(); g.userData.lounger=true; LOUNGERS.push(g); const u=I.c.clone().sub(ISL[0].c).normalize(), pr=new THREE.Vector3(-u.z,0,u.x);
      const p=I.c.clone().addScaledVector(u,5.4+3.0).addScaledVector(pr,sd*2.6); g.position.set(p.x,TOP,p.z); g.rotation.y=Math.atan2(u.x,u.z)+Math.PI;
      const bed=new THREE.Mesh(new THREE.BoxGeometry(1.2,.15,2.6),M(0xFFFFFF)); bed.position.y=.5; g.add(bed);
      const tw=new THREE.Mesh(new THREE.BoxGeometry(1.0,.04,2.3),M(towel[k])); tw.position.y=.6; g.add(tw);
      const back=new THREE.Mesh(new THREE.BoxGeometry(1.2,.12,1.0),M(0xFFFFFF)); back.position.set(0,.85,-1.25); back.rotation.x=-.8; g.add(back);
      [[-.5,-1.1],[.5,-1.1],[-.5,1.1],[.5,1.1]].forEach(([x,z])=>{ const l=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.5,6),M(0xD9C9B0)); l.position.set(x,.25,z); g.add(l); });
      g.scale.setScalar(1.7); shadowy(g); scene.add(g); addObs(g,.15); }); }
  /* ================= 模擬開刀房(俯瞰) ================= */
  let HUT_SRC=new THREE.Group();
  const OR=(()=>{ const I=ISL[3]; const u=ISL[0].c.clone().sub(I.c).normalize(); const yaw=Math.atan2(u.x,u.z);
    const g=new THREE.Group(); g.position.set(I.c.x,TOP,I.c.z); g.rotation.y=yaw; scene.add(g);
    const W=20, D=17, WH=1.6;
    // 依真實手術室照片:藍綠色帶細斑點的無縫地板,手術台與麻醉機那一區鋪淺藍色地墊
    const floorT=tex(256,256,(c,w,h)=>{ c.fillStyle="#9FC1BC"; c.fillRect(0,0,w,h); for(let i=0;i<2600;i++){ const r=Math.random(); c.fillStyle=r<.4?"#8DB2AD":r<.7?"#B4D2CD":r<.85?"#7FA6A3":"#C9DEDB"; c.fillRect(Math.random()*w,Math.random()*h,1.6,1.6); } });
    floorT.wrapS=floorT.wrapT=THREE.RepeatWrapping; floorT.repeat.set(4,3.4);
    const fl=new THREE.Mesh(new THREE.BoxGeometry(W,.12,D),new THREE.MeshStandardMaterial({map:floorT,roughness:.6})); fl.position.y=.06; fl.receiveShadow=true; g.add(fl);
    { const matT=tex(128,128,(c,w,h)=>{ c.fillStyle="#AFC3DF"; c.fillRect(0,0,w,h); for(let i=0;i<500;i++){ c.fillStyle=Math.random()<.5?"#A2B7D6":"#BDCDE6"; c.fillRect(Math.random()*w,Math.random()*h,1.5,1.5); } });
      const mat=new THREE.Mesh(new THREE.PlaneGeometry(11.5,11),new THREE.MeshStandardMaterial({map:matT,roughness:.7})); mat.rotation.x=-Math.PI/2; mat.position.set(-1.6,.125,.6); mat.receiveShadow=true; g.add(mat); }
    // 牆面:淡綠色;後牆與兩側牆加高,嵌著不鏽鋼框的玻璃櫃(門口那面維持矮牆,才看得到房間裡面)
    const wallM=M(0xDCE6D2,{roughness:.75}), trimM=M(0xC4CCD2,{roughness:.35,metalness:.5});
    const wall=(w,d,x,z,hh=WH)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(w,hh,d),wallM); m.position.set(x,hh/2,z); g.add(m); const t=new THREE.Mesh(new THREE.BoxGeometry(w+.04,.12,d+.04),trimM); t.position.set(x,hh+.06,z); g.add(t); };
    const WT=3.1; wall(W,.3,0,-D/2,WT); wall(.3,D,-W/2,0,WT); wall(W,.3,0,D/2);
    // 出入口在右牆靠後面的角落:門洞 DZ0~DZ1,門框與拉開的自動門
    const DZ0=-7.7, DZ1=-3.5, DZC=(DZ0+DZ1)/2; wall(.3,DZ0+D/2,W/2,(-D/2+DZ0)/2,WT); wall(.3,D/2-DZ1,W/2,(DZ1+D/2)/2,WT);
    { const fm=M(0xC4CCD2,{roughness:.35,metalness:.5}); for(const z of [DZ0,DZ1]){ const p=new THREE.Mesh(new THREE.BoxGeometry(.45,WT,.18),fm); p.position.set(W/2,WT/2,z); g.add(p); }
      const lt=new THREE.Mesh(new THREE.BoxGeometry(.45,.3,DZ1-DZ0+.18),fm); lt.position.set(W/2,WT+.05,DZC); g.add(lt);
      const dp=new THREE.Mesh(new THREE.BoxGeometry(.12,WT-.1,DZ1-DZ0),M(0xDCE2E6,{roughness:.4,metalness:.3})); dp.position.set(W/2+.32,(WT-.1)/2,DZ1+(DZ1-DZ0)/2+.1); g.add(dp);
      const win=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.9),new THREE.MeshStandardMaterial({color:0x9CC7D8,roughness:.1,metalness:.2})); win.rotation.y=Math.PI/2; win.position.set(W/2+.39,2.0,dp.position.z); g.add(win); }
    const doorSign=new THREE.Mesh(new THREE.PlaneGeometry(3.2,.8),new THREE.MeshBasicMaterial({map:tex(320,80,(c,w,h)=>{ c.fillStyle="#2E7D6E"; c.fillRect(0,0,w,h); c.fillStyle="#fff"; c.font='400 40px "Huninn","Noto Sans TC"'; c.textAlign="center"; c.textBaseline="middle"; c.fillText("手術室 OR 1",w/2,h/2+2); })}));
    doorSign.rotation.set(-Math.PI/2,0,Math.PI/2); doorSign.position.set(W/2-1.0,.14,DZC); g.add(doorSign);
    // OR table
    const steel=M(0xCDD3D8,{roughness:.3,metalness:.6}), dark=M(0x3A414A,{roughness:.5});
    // 手術台照真實的電動手術台:藍色底座外殼、不鏽鋼立柱、黑色台框上鋪寶藍色台墊,兩側有側軌
    const tblBlue=M(0x3E5F8E,{roughness:.45,metalness:.3}), padBlue=M(0x2B4D9C,{roughness:.6});
    const base=new THREE.Mesh(new RoundedBoxGeometry(1.9,.3,3.6,2,.1),tblBlue); base.position.set(0,.22,-.5); g.add(base);
    const col=new THREE.Mesh(new RoundedBoxGeometry(1.0,1.35,1.5,2,.08),steel); col.position.set(0,1.0,-.5); g.add(col);
    const top=new THREE.Mesh(new RoundedBoxGeometry(2.3,.22,6.4,2,.08),dark); top.position.set(0,1.72,-.5); g.add(top);
    const pad=new THREE.Mesh(new RoundedBoxGeometry(2.24,.16,6.3,2,.07),padBlue); pad.position.set(0,1.89,-.5); g.add(pad);
    for(const sx of [-1,1]){ const rl=new THREE.Mesh(new THREE.BoxGeometry(.06,.1,6.2),steel); rl.position.set(sx*1.19,1.72,-.5); g.add(rl);
      const ab=new THREE.Mesh(new RoundedBoxGeometry(1.9,.18,.55,2,.08),padBlue); ab.position.set(sx*1.9,1.92,1.05); g.add(ab); }
    // patient
    const patM=new THREE.MeshStandardMaterial({color:0xF2CDB0,roughness:.6});
    const head=new THREE.Group(); head.position.set(0,2.45,2.05); g.add(head);
    const hd=new THREE.Mesh(new THREE.SphereGeometry(.55,24,18),patM); hd.scale.set(1,.85,1.05); head.add(hd);
    // 依真實手術中的樣子:綠色不織布手術帽 + 蓋在頭頂的淺綠毛巾、閉眼貼透明護眼膜、額頭 BIS 貼片、經口氣管內管用白膠布固定
    const hcap=new THREE.Mesh(new THREE.SphereGeometry(.585,24,14,0,Math.PI*2,0,Math.PI*.4),M(0x2FA58A,{roughness:.95})); hcap.rotation.x=Math.PI/2+.45; hcap.position.z=.1; hcap.scale.set(1.02,1,.92); head.add(hcap);
    const towel=new THREE.Mesh(new THREE.SphereGeometry(.6,24,12,0,Math.PI*2,0,Math.PI*.3),M(0xBFE6CF,{roughness:1})); towel.rotation.x=Math.PI/2+.75; towel.position.set(0,.02,.1); towel.scale.set(1.04,1,.95); head.add(towel);
    for(const sx of [-.2,.2]){ const e=new THREE.Mesh(new THREE.BoxGeometry(.17,.03,.03),M(0x3A2A2A)); e.position.set(sx,.44,-.16); e.rotation.x=-.2; head.add(e);
      const film=new THREE.Mesh(new THREE.BoxGeometry(.3,.012,.2),new THREE.MeshPhysicalMaterial({color:0xFFFFFF,transparent:true,opacity:.45,roughness:.15,clearcoat:1})); film.position.set(sx,.46,-.16); film.rotation.x=-.25; head.add(film); }
    const nose=new THREE.Mesh(new THREE.SphereGeometry(.09,12,10),patM); nose.scale.set(.8,1,1.3); nose.position.set(0,.5,-.3); head.add(nose);
    // 額頭的 BIS 貼片(白色、印著 1 2 3 4 的電極)
    { const bt=tex(256,72,(c,w,h)=>{ c.clearRect(0,0,w,h); c.fillStyle="#FFFFFF"; c.beginPath(); c.roundRect(4,10,w-8,h-20,24); c.fill(); [[40,"2"],[110,"1"],[180,"4"],[226,"3"]].forEach(([x,n])=>{ c.fillStyle="#1F2A44"; c.beginPath(); c.arc(x,h/2,15,0,Math.PI*2); c.fill(); c.fillStyle="#fff"; c.font="bold 18px sans-serif"; c.textAlign="center"; c.textBaseline="middle"; c.fillText(n,x,h/2+1); }); });
      const bis=new THREE.Mesh(new THREE.PlaneGeometry(.78,.22),new THREE.MeshStandardMaterial({map:bt,transparent:true,roughness:.7})); bis.rotation.x=-Math.PI/2+.05; bis.position.set(0,.475,.04); head.add(bis); }
    // 嘴角固定氣管內管的白色膠布
    for(const sx of [-1,1]){ const t2=new THREE.Mesh(new THREE.BoxGeometry(.42,.02,.1),M(0xF7F7F2,{roughness:.95})); t2.position.set(sx*.2,.43,-.4); t2.rotation.set(-.35,0,-sx*.15); head.add(t2); }

    const pillow=new THREE.Mesh(new RoundedBoxGeometry(1.4,.25,1.0,2,.12),M(0xFFFFFF)); pillow.position.set(0,2.0,2.1); g.add(pillow);
    const neck=new THREE.Mesh(new THREE.CylinderGeometry(.28,.3,.5,12),patM); neck.rotation.x=Math.PI/2; neck.position.set(0,2.2,1.55); g.add(neck);
    const drapeM=M(0x9AA6E4,{roughness:.9});   // 淡藍紫色手術鋪單(照真實樣子)
    const drape=new THREE.Mesh(new RoundedBoxGeometry(2.6,.45,4.6,3,.18),drapeM); drape.position.set(0,2.15,-1.85); g.add(drape);
    const chest=new THREE.Mesh(new RoundedBoxGeometry(2.2,.55,1.5,3,.25),drapeM); chest.position.set(0,2.2,.65); g.add(chest);
    const field=new THREE.Mesh(new THREE.PlaneGeometry(1.0,1.3),new THREE.MeshStandardMaterial({color:0xC9873A,roughness:.6})); field.rotation.x=-Math.PI/2; field.position.set(0,2.39,-1.2); g.add(field);
    const ether=new THREE.Mesh(new THREE.BoxGeometry(2.8,1.6,.08),M(0x8E9BDD,{roughness:.9})); ether.position.set(0,2.75,1.35); g.add(ether);
    for(const sx of [-1,1]){ const arm=new THREE.Mesh(new THREE.CylinderGeometry(.26,.22,1.7,10),patM); arm.rotation.z=Math.PI/2; arm.position.set(sx*1.95,2.15,1.05); g.add(arm);
      const hand=new THREE.Mesh(new THREE.SphereGeometry(.2,10,8),patM); hand.position.set(sx*2.85,2.15,1.05); g.add(hand); }
    // 呼吸管路:經口氣管內管 → HMEF 過濾器 → 直角接頭 → 藍色螺紋管路接到麻醉機;過濾器旁接 CO₂ 取樣管
    const gear=new THREE.Group(); g.add(gear);
    { const clear=new THREE.MeshPhysicalMaterial({color:0xEAF4F8,transparent:true,opacity:.75,roughness:.15,clearcoat:1});
      const tubeAlong=(pts,r,mat,seg=40)=>{ const m=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),seg,r,10,false),mat); gear.add(m); return m; };
      // 氣管內管(含藍色刻度線)由嘴巴往上
      tubeAlong([[0,2.8,1.65],[0,3.15,1.66],[.02,3.58,1.7]],.075,clear,16);
      tubeAlong([[.06,2.82,1.65],[.06,3.15,1.66],[.08,3.48,1.7]],.012,M(0x2F6FD6),16);
      // HMEF 過濾器(小一點):直接接在氣管內管上,白色、藍色環
      const hm=new THREE.Group(); hm.position.set(.02,3.68,1.7); gear.add(hm);
      hm.add(new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.15,24),M(0xF4F4F0,{roughness:.6})));
      hm.add(new THREE.Mesh(new THREE.CylinderGeometry(.205,.205,.045,24),M(0x3C7DD9,{roughness:.4})));
      for(const sy of [-1,1]){ const port=new THREE.Mesh(new THREE.CylinderGeometry(.075,.085,.14,14),clear); port.position.y=sy*.13; hm.add(port); }
      // 藍色螺紋管路的直角接頭(right angle)接在 HMEF 上,再接藍色螺紋管路到麻醉機
      tubeAlong([[.02,3.8,1.7],[.02,3.95,1.71],[-.08,4.02,1.74],[-.3,4.02,1.8]],.085,clear,16);
      const corr=tex(32,256,(c,w,h)=>{ for(let i=0;i<32;i++){ c.fillStyle=i%2?"#A9D6F2":"#5FA6D8"; c.fillRect(0,i*h/32,w,h/32+1); } }); corr.wrapS=corr.wrapT=THREE.RepeatWrapping; corr.repeat.set(1,10);
      // 接到麻醉機呼吸管路的 Y 型接頭(麻醉機區塊的 Y 接頭換算到手術室座標約在 (-5.7, 0.77, 5.69))
      { const Y=new THREE.Vector3(-1.6,.85,2.55).multiplyScalar(.9).applyAxisAngle(new THREE.Vector3(0,1,0),.45).add(new THREE.Vector3(-5.4,0,3.0));
        tubeAlong([[-.3,4.02,1.8],[-.9,3.9,2.05],[-1.9,3.3,2.8],[-3.1,2.4,3.9],[(Y.x-3.1)/2-1.55,1.4,(Y.z+3.9)/2],[Y.x+.15,Y.y+.25,Y.z-.15],[Y.x,Y.y,Y.z]],.09,new THREE.MeshStandardMaterial({map:corr,roughness:.4,transparent:true,opacity:.9}),64); }
      // CO₂ 取樣管(細透明管)從過濾器拉到麻醉機
      tubeAlong([[.2,3.7,1.7],[.3,3.9,1.8],[-1.0,4.1,2.2],[-2.2,3.4,2.9],[-3.4,2.9,3.2]],.02,clear,30);
      // BIS 導線
      tubeAlong([[.4,2.93,2.1],[.8,2.8,2.4],[1.2,2.4,2.8],[1.5,1.8,3.0]],.025,M(0xE8ECF0,{roughness:.6}),20);
      // FloTrac 動脈壓感測器(白色,掛在病人右側),透明壓力管接到右手的動脈導管
      const ft=new THREE.Group(); ft.position.set(2.2,2.85,2.75); gear.add(ft);
      const fb=new THREE.Mesh(new RoundedBoxGeometry(.32,.8,.2,2,.06),M(0xF2F4F5,{roughness:.5})); ft.add(fb);
      const fl=new THREE.Mesh(new THREE.PlaneGeometry(.12,.55),new THREE.MeshBasicMaterial({map:tex(32,160,(c,w,h)=>{ c.fillStyle="#F2F4F5"; c.fillRect(0,0,w,h); c.save(); c.translate(w/2,h/2); c.rotate(-Math.PI/2); c.fillStyle="#2E8C6E"; c.font="italic bold 20px sans-serif"; c.textAlign="center"; c.textBaseline="middle"; c.fillText("FloTrac",0,0); c.restore(); })})); fl.rotation.x=-Math.PI/2; fl.position.set(0,.11,0); fl.rotation.set(-Math.PI/2,0,0); fl.position.set(.0,.105,0); ft.add(fl); fl.rotation.set(-Math.PI/2,0,0);
      const sc=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.14,10),M(0x2E72E0)); sc.position.set(-.2,.25,0); sc.rotation.z=Math.PI/2; ft.add(sc);
      const pole=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,2.9,8),M(0xCDD3D8,{metalness:.6,roughness:.3})); pole.position.set(.25,-1.4,0); ft.add(pole);
      tubeAlong([[2.2,2.45,2.75],[2.5,2.2,2.2],[2.8,2.2,1.4],[2.85,2.25,1.1]],.025,clear,24); }
    // anesthesia machine (a smaller copy of the island's machine)
    const amHolder=new THREE.Group(); amHolder.position.set(-5.4,0,3.0); amHolder.rotation.y=.45; amHolder.scale.setScalar(.9); g.add(amHolder);   // 麻醉機放大
    // patient monitor on a pole, tilted up for the overhead view
    const monCv=document.createElement("canvas"); monCv.width=512; monCv.height=340; const monTex=new THREE.CanvasTexture(monCv); monTex.colorSpace=THREE.SRGBColorSpace;
    // Mayo stand + back table + computer cart
    const mayo=new THREE.Mesh(new THREE.BoxGeometry(1.6,.08,1.0),steel); mayo.position.set(.6,2.6,-4.6); g.add(mayo); const mpo=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,2.5,8),steel); mpo.position.set(1.2,1.3,-4.6); g.add(mpo);
    const bt=new THREE.Mesh(new THREE.BoxGeometry(3.4,.12,1.6),M(0x3A62B0,{roughness:.9})); bt.position.set(5.6,2.0,-6.3); g.add(bt);   // 器械台鋪藍色無菌單
    for(const [x,z] of [[4.1,-5.7],[7.1,-5.7],[4.1,-6.9],[7.1,-6.9]]){ const l=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,2,6),steel); l.position.set(x,1,z); g.add(l); }
    for(let i=0;i<6;i++){ const ins=new THREE.Mesh(new THREE.BoxGeometry(.08,.04,.8),steel); ins.position.set(4.6+i*.35,2.1,-6.3); g.add(ins); }
    const cart=new THREE.Mesh(new RoundedBoxGeometry(1.5,2.1,1.2,2,.1),M(0xEDEFF2)); cart.position.set(8.2,1.05,3.8); g.add(cart);
    const lap=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.8),new THREE.MeshBasicMaterial({map:tex(160,100,(c,w,h)=>{ c.fillStyle="#F5F7FA"; c.fillRect(0,0,w,h); c.fillStyle="#2A6FBF"; c.fillRect(0,0,w,16); c.fillStyle="#99A"; for(let r=0;r<5;r++) c.fillRect(10,24+r*14,w-20,6); })})); lap.rotation.x=-Math.PI/2+.3; lap.position.set(8.2,2.2,3.8); g.add(lap);
    /* ---------- 依真實手術室照片擺設 ---------- */
    { const ss=M(0xC9D0D6,{roughness:.3,metalness:.65}), white=M(0xF3F4F2,{roughness:.5});
      const fit=(c,t,x,y,mw,px,font)=>{ let s=px; do{ c.font=`${font||"500"} ${s}px "Noto Sans TC",sans-serif`; s--; }while(c.measureText(t).width>mw&&s>9); c.fillText(t,x,y); };
      // 牆上的不鏽鋼框玻璃櫃:兩片拉門、玻璃層板,上面放貼了標籤的黃色收納籃
      const glassBg=(c,w,h)=>{ c.fillStyle="#56656C"; c.fillRect(0,0,w,h); const gr=c.createLinearGradient(0,0,0,h); gr.addColorStop(0,"rgba(220,235,240,.25)"); gr.addColorStop(1,"rgba(0,0,0,.15)"); c.fillStyle=gr; c.fillRect(0,0,w,h); };
      const glassFg=(c,w,h,rows)=>{ c.strokeStyle="rgba(210,240,240,.75)"; c.lineWidth=4; for(let r=1;r<rows;r++){ const y=h*r/rows; c.beginPath(); c.moveTo(0,y); c.lineTo(w,y); c.stroke(); }
        c.fillStyle="rgba(255,255,255,.10)"; for(const x0 of [w*.12,w*.62]){ c.beginPath(); c.moveTo(x0,0); c.lineTo(x0+60,0); c.lineTo(x0-90,h); c.lineTo(x0-150,h); c.fill(); }
        c.strokeStyle="#C9D1D6"; c.lineWidth=18; c.strokeRect(9,9,w-18,h-18); c.lineWidth=10; c.beginPath(); c.moveTo(w/2,0); c.lineTo(w/2,h); c.stroke(); c.fillStyle="#8E989F"; c.fillRect(w/2+10,h*.45,8,40); };
      const bin=(c,x,y,bw,bh,label)=>{ c.fillStyle="#F2C318"; c.beginPath(); c.moveTo(x,y); c.lineTo(x+bw,y+bh*.25); c.lineTo(x+bw,y+bh); c.lineTo(x,y+bh); c.closePath(); c.fill(); c.strokeStyle="#C99A0C"; c.lineWidth=3; c.stroke();
        c.fillStyle="rgba(255,255,255,.5)"; c.fillRect(x+bw*.15,y+bh*.05,bw*.5,bh*.2);
        if(label){ c.fillStyle="#FBF6E4"; c.fillRect(x+bw*.08,y+bh*.5,bw*.84,bh*.38); c.fillStyle="#222"; c.textAlign="center"; c.textBaseline="middle"; label.split("\n").forEach((t,i,a)=>fit(c,t,x+bw/2,y+bh*.69+(i-(a.length-1)/2)*bh*.17,bw*.78,a.length>1?20:24)); } };
      const binCab=(rows,head)=>tex(640,560,(c,w,h)=>{ glassBg(c,w,h); const R=rows.length, rh=h/R;
        rows.forEach((row,r)=>row.forEach((lab,k)=>{ const cw=w/row.length; bin(c,k*cw+16,r*rh+rh*.3,cw-30,rh*.62,lab); }));
        glassFg(c,w,h,R); if(head){ c.fillStyle="#FBF6E4"; c.fillRect(w/2-80,22,160,40); c.fillStyle="#222"; c.textAlign="center"; c.textBaseline="middle"; fit(c,head,w/2,43,150,26); } });
      // 設備櫃:蘇打石灰罐、頭墊與趴墊、TCI 與輸液幫浦(照片上的層板標籤)
      const tape=(c,t,x,y)=>{ c.font='700 22px "Noto Sans TC",sans-serif'; const tw=c.measureText(t).width+20; c.fillStyle="#F4EFC8"; c.fillRect(x-tw/2,y-16,tw,32); c.fillStyle="#111"; c.textAlign="center"; c.textBaseline="middle"; c.fillText(t,x,y+1); };
      const pump=(c,x,y,s)=>{ c.fillStyle="#E9ECEF"; c.fillRect(x,y,90*s,70*s); c.fillStyle="#2C6FB8"; c.fillRect(x+12*s,y+10*s,40*s,28*s); c.fillStyle="#9AA6B2"; for(let i=0;i<3;i++) for(let j=0;j<3;j++) c.fillRect(x+58*s+j*9*s,y+12*s+i*9*s,6*s,6*s); };
      const eqTex=tex(640,560,(c,w,h)=>{ glassBg(c,w,h); const rh=h/3;
        c.fillStyle="#6E5A3A"; c.beginPath(); c.ellipse(200,rh*.62,46,64,-.5,0,Math.PI*2); c.fill(); c.fillStyle="#9C7E4E"; c.beginPath(); c.ellipse(186,rh*.5,30,42,-.5,0,Math.PI*2); c.fill();
        c.fillStyle="#8D97A3"; c.fillRect(40,rh*.4,90,rh*.55); c.fillStyle="#E9EDF0"; c.fillRect(380,rh*.6,170,rh*.32);
        pump(c,60,rh+rh*.35,1.2); pump(c,220,rh+rh*.3,1.25); c.strokeStyle="#C7CCD1"; c.lineWidth=4; c.beginPath(); c.moveTo(50,rh*1.9); c.bezierCurveTo(120,rh*1.6,30,rh*1.4,150,rh*1.35); c.stroke();
        c.fillStyle="#F5F5F0"; c.fillRect(40,rh*2+rh*.45,200,rh*.5); c.fillRect(270,rh*2+rh*.4,140,rh*.55); bin(c,460,rh*2+rh*.35,150,rh*.6,"Ringer");
        glassFg(c,w,h,3); tape(c,"蘇打石灰罐",170,rh*.18); tape(c,"脂肪頭墊",120,rh+rh*.15); tape(c,"Spine趴墊",250,rh+rh*.15); tape(c,"TCI",110,rh*2+rh*.15); tape(c,"亞培pump",260,rh*2+rh*.15); });
      const cleanTex=binCab([["",""],["清潔用品","漂白水布\n消毒液"],["拖鞋套","垃圾袋"]],"清潔用品");
      const CABS=[ // [x, z, 朝向, 材質]
        [-7.6,-D/2+.5,0,binCab([["A-line 延長管","One dome A-line"],["喉頭面罩 3號 4號","Facial Mask"],["IV set /吸入性\n藥罐/手電筒","Trachway\nA-line kit"],["EKG 5 lead / NIBP\ncuff / A-line導線","運送用 SpO₂ / NMT\n小兒 SpO₂ / Entropy"]],"設備類")],
        [-3.9,-D/2+.5,0,binCab([["小 垃圾袋","半/全身溫毯被"],["無菌手套","腰麻包/CVC包\n襪套/棉捲"],["腰椎穿刺針 26號\n3/0 Nylon","直插空針\n11號尖刀"],["L.R","N.S"]])],
        [-.2,-D/2+.5,0,eqTex],
        [3.5,-D/2+.5,0,binCab([["Endo 管","Stylet"],["Airway","牙墊"],["抽痰管","密閉式抽痰管"]])],
        [7.2,-D/2+.5,0,cleanTex],
        [W/2-.5,-1.4,-Math.PI/2,binCab([["縫線","紗布"],["沖洗棉棒","紗繃"],["宜拉膠","3M 膠帶"]])],
        [W/2-.5,2.4,-Math.PI/2,binCab([["Foley","尿袋"],["電燒貼片","止血帶"],["約束帶","沙袋"]])],
        [-W/2+.5,-5.6,Math.PI/2,binCab([["Ringer","N.S"],["D5W","Voluven"],["加壓袋","輸血 set"]])],
        [-W/2+.5,-2.0,Math.PI/2,binCab([["3-way","T-connect"],["IV 延長線","Pump bag"],["Nasal airway","Oral airway"]])]];
      for(const [x,z,ry,t] of CABS){ const cg=new THREE.Group(); cg.position.set(x,0,z); cg.rotation.y=ry; g.add(cg);
        const box=new THREE.Mesh(new THREE.BoxGeometry(3.6,2.9,.7),ss); box.position.set(0,1.55,0); cg.add(box);
        const kick=new THREE.Mesh(new THREE.BoxGeometry(3.6,.5,.04),M(0xE6E9E4)); kick.position.set(0,.37,.36); cg.add(kick);
        const fr=new THREE.Mesh(new THREE.PlaneGeometry(3.5,2.3),new THREE.MeshStandardMaterial({map:t,roughness:.25,metalness:.1})); fr.position.set(0,1.85,.355); cg.add(fr); }
      // 天花板吊臂式無影燈:中央吊座、三支白色關節臂,燈頭推到手術台兩旁(才不會擋住畫面)
      const lampM=M(0xF5F6F4,{roughness:.35}), lampTrim=M(0x2E5FA8,{roughness:.4});
      const hub=new THREE.Vector3(.4,6.4,-3.6); const hubM=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,.3,24),lampM); hubM.position.copy(hub); g.add(hubM);
      const stem=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,1.2,12),lampM); stem.position.set(hub.x,hub.y+.6,hub.z); g.add(stem);
      [[-4.8,4.7,-1.9,"1"],[5.2,4.5,-.6,"2"]].forEach(([lx,ly,lz,n],i)=>{ const elbow=new THREE.Vector3((hub.x+lx)/2,hub.y-.3-i*.2,(hub.z+lz)/2-.6);
        const seg=(a,b,r)=>{ const v=b.clone().sub(a), m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,v.length(),12),lampM); m.position.copy(a).addScaledVector(v,.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize()); g.add(m); };
        const L=new THREE.Vector3(lx,ly+.4,lz); seg(hub,elbow,.12); seg(elbow,L,.1);
        const kn=new THREE.Mesh(new THREE.SphereGeometry(.18,14,10),lampM); kn.position.copy(elbow); g.add(kn);
        const tag=new THREE.Mesh(new THREE.CircleGeometry(.2,16),new THREE.MeshBasicMaterial({map:tex(64,64,(c,w,h)=>{ c.fillStyle="#fff"; c.fillRect(0,0,w,h); c.fillStyle="#1E3E78"; c.font="bold 44px serif"; c.textAlign="center"; c.textBaseline="middle"; c.fillText(n,w/2,h/2+2); })})); tag.rotation.x=-Math.PI/2; tag.position.set(elbow.x,elbow.y+.19,elbow.z); tag.scale.setScalar(.7); g.add(tag);
        const lh=new THREE.Group(); lh.position.set(lx,ly,lz); lh.scale.setScalar(.62); lh.rotation.set((lz>0?-.35:.35),0,(lx>0?.3:-.3)); g.add(lh);
        const dome=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.35,.35,32),lampM); lh.add(dome);
        const ring=new THREE.Mesh(new THREE.TorusGeometry(1.3,.05,8,40),lampTrim); ring.rotation.x=Math.PI/2; ring.position.y=-.1; lh.add(ring);
        const face=new THREE.Mesh(new THREE.CircleGeometry(1.15,32),new THREE.MeshBasicMaterial({color:0xFFFBEA})); face.rotation.x=Math.PI/2; face.position.y=-.19; lh.add(face);
        const hdl=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.45,12),M(0x2A3038)); hdl.position.y=-.4; lh.add(hdl);
        const cap=new THREE.Mesh(new THREE.SphereGeometry(.3,14,10,0,Math.PI*2,0,Math.PI/2),lampM); cap.position.y=.17; lh.add(cap); });
      // 氣體吊塔(氣柱):在麻醉機和藥車中間、偏藥車那側,正面比麻醉機的方向再往麻醉機斜一些;氧氣(綠)、空氣(黃)、笑氣(藍)出口與插座,管線接到麻醉機
      { const pg=new THREE.Group(); pg.position.set(-7.55,0,5.8); pg.rotation.y=.95; g.add(pg);
        const pb=new THREE.Mesh(new RoundedBoxGeometry(1.1,2.4,.8,2,.06),white); pb.position.y=4.3; pg.add(pb);
        const pst=new THREE.Mesh(new THREE.CylinderGeometry(.18,.18,1.0,12),white); pst.position.y=6.0; pg.add(pst);
        const pt=tex(110,240,(c,w,h)=>{ c.fillStyle="#F3F4F2"; c.fillRect(0,0,w,h); [["#2FA84F",30],["#F2C318",80],["#3C78D8",130]].forEach(([col,y])=>{ c.fillStyle="#C9CDD1"; c.fillRect(14,y-14,82,32); c.fillStyle=col; c.beginPath(); c.arc(38,y+2,10,0,Math.PI*2); c.fill(); c.beginPath(); c.arc(72,y+2,10,0,Math.PI*2); c.fill(); });
          c.fillStyle="#E25B4B"; c.fillRect(18,176,30,40); c.fillRect(62,176,30,40); c.fillStyle="#fff"; c.fillRect(26,186,4,14); c.fillRect(36,186,4,14); c.fillRect(70,186,4,14); c.fillRect(80,186,4,14); });
        const pf=new THREE.Mesh(new THREE.PlaneGeometry(1.0,2.2),new THREE.MeshBasicMaterial({map:pt})); pf.position.set(0,4.3,.41); pg.add(pf);
        // 每條管子接在同顏色的出口(綠=氧氣、黃=空氣、藍=笑氣),往下垂到地面,從呼吸袋與機身之間繞到麻醉機背面接進去,不穿過麻醉機
        pg.updateMatrixWorld(true);
        const PW=(x,y,z)=>new THREE.Vector3(x,y,z).applyMatrix4(pg.matrix);                                   // 氣柱本地座標 → 手術室座標
        const AW=(x,y,z)=>new THREE.Vector3(x,y,z).multiplyScalar(.9).applyAxisAngle(up0,.45).add(new THREE.Vector3(-5.4,0,3.0));   // 麻醉機本地座標 → 手術室座標
        const rounded=(pts,r)=>{ const out=[pts[0]]; for(let k=1;k<pts.length-1;k++){ const a=pts[k-1], b=pts[k], c=pts[k+1]; const l1=a.distanceTo(b), l2=b.distanceTo(c), rr=Math.min(r,l1*.45,l2*.45);
            const p0=b.clone().lerp(a,rr/l1), p2=b.clone().lerp(c,rr/l2); for(let t=0;t<=6;t++){ const u=t/6, v=1-u; out.push(new THREE.Vector3().addScaledVector(p0,v*v).addScaledVector(b,2*u*v).addScaledVector(p2,u*u)); } }
          out.push(pts[pts.length-1]); return out; };
        const conM=M(0xE8EBEE,{roughness:.4,metalness:.3});
        [[0x2FA84F,30,-1],[0xF2C318,80,0],[0x3C78D8,130,1]].forEach(([col,ty,o])=>{ const ox=-.5+38/110, oy=4.3+1.1-(ty+2)/240*2.2, d=o*.14, xi=-.35+o*.2;
          const plug=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.16,10),conM); plug.rotation.x=Math.PI/2; plug.position.copy(PW(ox,oy,.49)); plug.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(up0,.95)); g.add(plug);
          const inlet=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.18,10),conM); inlet.rotation.x=Math.PI/2; inlet.position.copy(AW(xi,1.2,-1.12)); inlet.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(up0,.45)); g.add(inlet);
          const pts=[PW(ox,oy,.56),PW(ox,oy-.35,.9),PW(ox*.5,.1,1.05),AW(-2.9+d,.08,1.55),AW(-2.9+d,.08,-1.95+d),AW(xi,.08,-1.95+d),AW(xi,1.2,-1.95+d),AW(xi,1.2,-1.2)];
          const curve=new THREE.CatmullRomCurve3(rounded(pts,.35),false,"centripetal");
          g.add(new THREE.Mesh(new THREE.TubeGeometry(curve,160,.045,8,false),M(col,{roughness:.5}))); }); }
      // 麻醉推車(照片):灰褐色抽屜櫃配湖水綠飾條、上層湖水綠托盤、U 型把手架與分格收納盒、側掛黃色針頭收集盒與藍蓋桶、左側收納籃
      // 推車放在麻醉機旁的角落,抽屜正面朝向麻醉護理師站位
      { const cg=new THREE.Group(); cg.position.set(-8.7,0,7.3); cg.rotation.y=Math.atan2(-1.7+8.7,4.4-7.3); g.add(cg);
        const taupe=M(0x9E968D,{roughness:.6}), teal=M(0x7ED4CC,{roughness:.5}), frameM=M(0xCFC7BC,{roughness:.5});
        const body=new THREE.Mesh(new RoundedBoxGeometry(1.7,2.0,1.15,2,.06),taupe); body.position.y=1.25; cg.add(body);
        const ft=tex(340,400,(c,w,h)=>{ c.fillStyle="#A59D93"; c.fillRect(0,0,w,h); const H=[54,54,54,40,56,40,56,46]; let y=0; const labs={3:"Endo/輸血set/3way lock/T-connect/IV延長線/Nasal airway",5:"紗繃、宜拉膠、3M膠帶 / pump bag / 延長線"};
          H.forEach((dh,i)=>{ const yy=y*400/400; c.fillStyle="#8E867C"; c.fillRect(6,yy+dh-4,w-12,4); if(i!==3&&i!==5&&i!==7){ c.fillStyle="#7ED4CC"; c.fillRect(10,yy+3,w-20,9); } else if(i===3||i===5){ c.fillStyle="#7ED4CC"; c.fillRect(10,yy+3,w-20,9); }
            c.fillStyle="#968E84"; c.fillRect(30,yy+18,w-60,8); if(labs[i]){ c.fillStyle="#F4EFC8"; c.fillRect(30,yy+3,w-60,11); c.fillStyle="#111"; c.textAlign="center"; c.textBaseline="middle"; fit(c,labs[i],w/2,yy+9,w-66,11,"700"); } y+=dh; }); });
        const fp=new THREE.Mesh(new THREE.PlaneGeometry(1.62,1.9),new THREE.MeshStandardMaterial({map:ft,roughness:.6})); fp.position.set(0,1.25,.58); cg.add(fp);
        const tray=new THREE.Mesh(new RoundedBoxGeometry(1.85,.2,1.25,2,.06),teal); tray.position.y=2.35; cg.add(tray);
        const trayIn=new THREE.Mesh(new THREE.BoxGeometry(1.6,.05,1.0),M(0xA9E3DD)); trayIn.position.y=2.46; cg.add(trayIn);
        [[0xF7F1A0,.3,.1,.7,.5,.3],[0xFFFFFF,-.4,-.1,.5,.25,-.2],[0xF2D04A,-.05,.2,.25,.25,0],[0xE4ECF2,-.5,.25,.35,.2,.6]].forEach(([col,x,z,w2,d2,r])=>{ const it=new THREE.Mesh(new THREE.BoxGeometry(w2,.06,d2),M(col)); it.position.set(x,2.5,z); it.rotation.y=r; cg.add(it); });
        for(const sx of [-.82,.82]){ const po=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,1.5,8),frameM); po.position.set(sx,3.15,-.5); cg.add(po); }
        const bar=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,1.64,8),frameM); bar.rotation.z=Math.PI/2; bar.position.set(0,3.9,-.5); cg.add(bar);
        const shelf=new THREE.Mesh(new THREE.BoxGeometry(1.5,.06,.35),frameM); shelf.position.set(0,3.05,-.45); cg.add(shelf);
        for(let i=0;i<5;i++){ const bx=new THREE.Mesh(new THREE.BoxGeometry(.26,.24,.28),M(0xF3EFE6)); bx.position.set(-.6+i*.3,3.2,-.45); cg.add(bx); }
        for(const sx of [-.08,.08]){ const sc=new THREE.Mesh(new THREE.TorusGeometry(.07,.025,6,12),M(0xD8342C)); sc.position.set(.32+sx,3.42,-.45); cg.add(sc); }
        for(let i=0;i<6;i++){ const st=new THREE.Mesh(new THREE.BoxGeometry(.035,.3,.03),M(0xE7CFA4)); st.position.set(-.62+i*.04,3.45,-.45); cg.add(st); }
        const sharps=new THREE.Mesh(new THREE.BoxGeometry(.5,.5,.55),M(0xF2D21C,{roughness:.5})); sharps.position.set(1.15,2.0,.15); cg.add(sharps);
        const bucket=new THREE.Mesh(new THREE.CylinderGeometry(.25,.23,.5,16),white); bucket.position.set(1.12,.95,.2); cg.add(bucket);
        const lid=new THREE.Mesh(new THREE.CylinderGeometry(.28,.28,.07,16),M(0x2D6FD8,{roughness:.4})); lid.position.set(1.12,1.23,.2); cg.add(lid);
        const sb=new THREE.Mesh(new THREE.BoxGeometry(.45,.6,.5),taupe); sb.position.set(-1.1,1.0,.2); cg.add(sb);
        const sb2=new THREE.Mesh(new THREE.BoxGeometry(.42,.4,.45),M(0xA9E3DD)); sb2.position.set(-1.1,2.05,.2); cg.add(sb2);
        for(const [x,z] of [[-.7,-.45],[.7,-.45],[-.7,.45],[.7,.45]]){ const wh=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.1,12),M(0x9AA0A6)); wh.rotation.z=Math.PI/2; wh.position.set(x,.15,z); cg.add(wh); } }
      // 電燒主機推車(兩台藍色機器疊在不鏽鋼推車上)
      { const eg=new THREE.Group(); eg.position.set(8.6,0,5.8); eg.rotation.y=-Math.PI/2; g.add(eg);
        for(const y of [.4,1.4,2.3]){ const sh=new THREE.Mesh(new THREE.BoxGeometry(1.3,.06,1.0),ss); sh.position.y=y; eg.add(sh); }
        for(const [x,z] of [[-.6,-.45],[.6,-.45],[-.6,.45],[.6,.45]]){ const l=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,2.3,6),ss); l.position.set(x,1.2,z); eg.add(l); }
        const u1=new THREE.Mesh(new RoundedBoxGeometry(1.1,.5,.8,2,.05),M(0x4C88C8,{roughness:.4})); u1.position.y=1.7; eg.add(u1);
        const u2=new THREE.Mesh(new RoundedBoxGeometry(1.0,.4,.7,2,.05),M(0xEEF1F3,{roughness:.4})); u2.position.y=2.55; eg.add(u2);
        const u3=new THREE.Mesh(new RoundedBoxGeometry(1.1,.45,.8,2,.05),M(0x3B6FAE,{roughness:.4})); u3.position.y=.68; eg.add(u3);
        const dsp=new THREE.Mesh(new THREE.PlaneGeometry(.4,.2),new THREE.MeshBasicMaterial({color:0x7FE0A0})); dsp.position.set(-.2,1.75,.41); eg.add(dsp); }
      // 點滴架(掛兩袋輸液)、紅色踢桶套粉紅色垃圾袋、綠色踏階兩個
      { const ip=new THREE.Group(); ip.position.set(4.6,0,7.6); g.add(ip);
        for(let i=0;i<5;i++){ const a=i/5*Math.PI*2, lg=new THREE.Mesh(new THREE.BoxGeometry(.7,.06,.08),M(0x2A3038)); lg.position.set(Math.cos(a)*.35,.12,Math.sin(a)*.35); lg.rotation.y=-a; ip.add(lg); }
        const po=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,4.4,8),ss); po.position.y=2.3; ip.add(po);
        const hk=new THREE.Mesh(new THREE.BoxGeometry(.9,.04,.04),ss); hk.position.y=4.45; ip.add(hk);
        for(const sx of [-.35,.35]){ const bag=new THREE.Mesh(new RoundedBoxGeometry(.32,.55,.12,2,.05),new THREE.MeshPhysicalMaterial({color:0xEAF4FA,transparent:true,opacity:.8,roughness:.2})); bag.position.set(sx,4.05,0); ip.add(bag); } }
      { const kb=new THREE.Group(); kb.position.set(-3.4,0,-4.6); g.add(kb);
        const bk=new THREE.Mesh(new THREE.CylinderGeometry(.5,.42,.8,20),M(0xD8342C,{roughness:.5})); bk.position.y=.55; kb.add(bk);
        const bg=new THREE.Mesh(new THREE.SphereGeometry(.55,14,10,0,Math.PI*2,0,Math.PI/2),M(0xE94E86,{roughness:.7})); bg.scale.y=.6; bg.position.y=.95; kb.add(bg);
        const fr=new THREE.Mesh(new THREE.TorusGeometry(.5,.04,6,20),ss); fr.rotation.x=Math.PI/2; fr.position.y=.2; kb.add(fr); }
      for(const [x,z,r] of [[-6.6,-6.7,.1],[-4.6,-6.9,-.15]]){ const sg=new THREE.Group(); sg.position.set(x,0,z); sg.rotation.y=r; g.add(sg);
        const tp=new THREE.Mesh(new RoundedBoxGeometry(1.4,.12,.9,2,.04),M(0x2E7A5E,{roughness:.8})); tp.position.y=.62; sg.add(tp);
        for(const [lx,lz] of [[-.6,-.35],[.6,-.35],[-.6,.35],[.6,.35]]){ const l=new THREE.Mesh(new THREE.BoxGeometry(.08,.56,.08),ss); l.position.set(lx,.3,lz); sg.add(l); } }
    }
    // staff
    const SKIN=0xF6D2B5;
    function mkStaff(o){ const p=new THREE.Group(); const sc=M(o.scrub,{roughness:.7}), gw=o.gown?M(o.gown,{roughness:.75}):sc, sk=M(SKIN,{roughness:.6}), glove=M(o.glove||SKIN,{roughness:.5});
      p.userData.legs=[]; p.userData.arms=[];
      for(const sx of [-.28,.28]){ const lg=new THREE.Mesh(new THREE.CylinderGeometry(.24,.22,1.6,10),sc); lg.geometry.translate(0,-.8,0); lg.position.set(sx,1.6,0); p.add(lg); p.userData.legs.push(lg); const sh=new THREE.Mesh(new RoundedBoxGeometry(.38,.22,.6,2,.08),M(0xE9EDF1)); sh.position.set(0,-1.5,.08); lg.add(sh); }
      const tor=new THREE.Mesh(o.gown?new THREE.CylinderGeometry(.62,.78,2.0,14):new RoundedBoxGeometry(1.25,1.45,.75,3,.25),gw); tor.position.y=o.gown?2.3:2.35; p.add(tor);
      const hd=new THREE.Mesh(new THREE.SphereGeometry(.58,20,16),sk); hd.position.y=3.6; p.add(hd);
      const cap=new THREE.Mesh(new THREE.SphereGeometry(.62,20,12,0,Math.PI*2,0,Math.PI*.55),M(o.cap,{roughness:.8})); cap.position.y=3.68; cap.rotation.x=-.25; p.add(cap);
      const mask=new THREE.Mesh(new RoundedBoxGeometry(.75,.42,.2,2,.08),M(o.mask||0x9CCFEA,{roughness:.8})); mask.position.set(0,3.42,.48); p.add(mask);
      for(const sx of [-.2,.2]){ const e=new THREE.Mesh(new THREE.SphereGeometry(.06,8,6),M(0x2B2230)); e.position.set(sx,3.72,.53); p.add(e); }
      if(o.loupe){ const lp=new THREE.Mesh(new THREE.BoxGeometry(.6,.12,.12),M(0x222831)); lp.position.set(0,3.75,.6); p.add(lp); }
      for(const sx of [-1,1]){ const ar=new THREE.Group(); ar.position.set(sx*.68,2.95,0); p.add(ar);
        const up=new THREE.Mesh(new THREE.CylinderGeometry(.18,.16,1.0,10),gw); up.position.y=-.45; ar.add(up);
        const fo=new THREE.Group(); fo.position.y=-.9; ar.add(fo); const f1=new THREE.Mesh(new THREE.CylinderGeometry(.15,.14,.9,10),gw); f1.position.y=-.4; fo.add(f1);
        const hn=new THREE.Mesh(new THREE.SphereGeometry(.17,10,8),glove); hn.position.y=-.9; fo.add(hn);
        p.userData.arms.push({ar,fo,sx});
        if(o.hands==="front"){ ar.rotation.x=-.5; ar.rotation.z=sx*.15; fo.rotation.x=-1.3; } else if(o.hands==="type"){ ar.rotation.x=-.35; fo.rotation.x=-1.1; } else { ar.rotation.z=sx*.08; } }
      p.scale.setScalar(o.scale||1.1); shadowy(p); return p; }   // 和小麻一樣高
    const staff=[
      {role:"外科醫師",o:{scrub:0x5B7FBF,gown:0x4E76B8,cap:0x2E4B7A,glove:0xF2E3C2,hands:"front",loupe:true},x:2.4,z:-.7,ry:-Math.PI/2},
      {role:"外科住院醫師",o:{scrub:0x5B7FBF,gown:0x4E76B8,cap:0x6FA0D8,glove:0xF2E3C2,hands:"front"},x:-2.4,z:-1.2,ry:Math.PI/2},
      {role:"刷手護理師",o:{scrub:0x5B7FBF,gown:0x4E76B8,cap:0xE48CA8,glove:0xF2E3C2,hands:"front"},x:2.6,z:-4.9,ry:-Math.PI*.7},
      {role:"巡迴護理師",o:{scrub:0x6FB5A6,cap:0xF2B544,hands:"type"},x:7.0,z:3.8,ry:Math.PI/2},
    ].map(d=>{ const p=mkStaff(d.o); p.position.set(d.x,.12,d.z); p.rotation.y=d.ry; g.add(p); return {...d,p}; });
    const labels=[];   // 角色頭上的說明牌已拿掉
    shadowy(g);
    const toW=(x,z)=>{ const v=new THREE.Vector3(x,0,z).applyAxisAngle(up0,yaw).add(new THREE.Vector3(I.c.x,0,I.c.z)); return v; };
    const loc=(x,z)=>{ const v=new THREE.Vector3(x-I.c.x,0,z-I.c.z).applyAxisAngle(up0,-yaw); return v; };
    const room={ yaw, station:toW(-1.7,4.4), station2:toW(1.0,5.0), stationYaw:yaw+Math.PI, doorIn:toW(W/2-1.4,DZC), doorOut:toW(W/2+1.6,DZC), via:toW(5.0,6.2),
      inside:(p)=>{ const l=loc(p.x,p.z); return Math.abs(l.x)<W/2-.2 && Math.abs(l.z)<D/2-.2; }, near:(x,z)=>{ const l=loc(x,z); return (Math.abs(l.x)<W/2+1.5 && Math.abs(l.z)<D/2+1.5) || (l.x>-22 && l.x<-10 && l.z>-7 && l.z<13); } };
    // 兩個點都在手術室外面、但直線會穿過手術室時:沿牆外側繞過轉角(不穿牆)
    // 恢復室(PACU)在手術室左邊,只有前面(+z)開口:PX=-16、寬 9、深 10
    const PAX0=-20.5, PAX1=-11.5, PAZ0=-5, PAZ1=5;
    room.inPacu=(p)=>{ const l=loc(p.x,p.z); return l.x>PAX0+.6&&l.x<PAX1-.6&&l.z>PAZ0+.6&&l.z<PAZ1+.2; };
    room.pacuFront=toW(-16,10.4);
    // 走在手術室與恢復室外面時:沿牆外側繞過轉角(兩個房間都不穿牆)
    room.around=(p,q)=>{ const L=(v)=>{ const l=loc(v.x,v.z); return [l.x,l.z]; };
      const BOX=[[-W/2-1.1,W/2+1.1,-D/2-1.1,D/2+1.1],[PAX0-1.1,PAX1+1.1,PAZ0-1.1,PAZ1+1.1]];
      const hit1=(P,Q,b)=>{ let t0=0,t1=1; for(const [o,d,lo,hi] of [[P[0],Q[0]-P[0],b[0],b[1]],[P[1],Q[1]-P[1],b[2],b[3]]]){ if(Math.abs(d)<1e-6){ if(o<=lo||o>=hi) return false; } else { let u0=(lo-o)/d, u1=(hi-o)/d; if(u0>u1){ const t=u0; u0=u1; u1=t; } t0=Math.max(t0,u0); t1=Math.min(t1,u1); if(t0>t1) return false; } } return true; };
      const hit=(P,Q)=>BOX.some(b=>hit1(P,Q,b));
      const A=L(p), B=L(q); if(!hit(A,B)) return [];
      const hx=W/2+1.5, hz=D/2+1.5, C=[[hx,hz],[hx,-hz],[-hx,-hz],[-hx,hz],[PAX0-1.5,PAZ0-1.5],[PAX0-1.5,PAZ1+1.5]]; let best=null, bl=1e9;
      const go=(seq)=>{ const pts=[A,...seq,B]; let len=0; for(let k=0;k<pts.length-1;k++){ if(hit(pts[k],pts[k+1])) return; len+=Math.hypot(pts[k+1][0]-pts[k][0],pts[k+1][1]-pts[k][1]); } if(len<bl){ bl=len; best=seq; } };
      for(let i=0;i<C.length;i++){ go([C[i]]); for(let j=0;j<C.length;j++){ if(j===i) continue; go([C[i],C[j]]); for(let k=0;k<C.length;k++){ if(k===i||k===j) continue; go([C[i],C[j],C[k]]); } } }
      return best?best.map(c=>toW(c[0],c[1])):[]; };
    room.viaFor=(p)=>{ const l=loc(p.x,p.z); return l.x<3.5&&l.z>-2; };
    // 手術室裡的障礙物(本地座標的圓 [x,z,半徑]):小麻走路會繞開手術台、麻醉機、推車、器械台與手術室成員,不會穿過去
    const OR_FIX=[[0,-3.3,1.45],[0,-.6,1.45],[0,2.0,1.45],[-2.4,1.05,.75],[2.4,1.05,.75],[2.45,2.75,.45],[-5.4,3.0,1.9],[.9,-4.6,.9],[4.6,-6.3,1.05],[6.6,-6.3,1.05],[8.2,3.8,1.15],[8.6,5.8,.9],[4.6,7.6,.55],[-8.7,7.3,1.35],[-3.4,-4.6,.6],[-6.6,-6.7,.95],[-4.6,-6.9,.95],[-18.3,-.5,1.5],[-18.3,-2.7,1.5],[-13.6,-1.5,1.0],[-7.55,5.8,.8]];
    room.obs=()=>{ const out=OR_FIX.map(([x,z,r])=>({c:toW(x,z),r}));
      const ppl=[...staff.map(d=>d.p),...HELP.filter(h=>h.p.visible).map(h=>h.p)];
      ppl.forEach(p=>out.push({c:toW(p.position.x,p.position.z),r:1.15}));
      chairs.forEach(ch=>{ if(ch.c.visible!==false) out.push({c:toW(ch.c.position.x,ch.c.position.z),r:.8}); });
      return out; };
    // 點到手術室裡:目標拉回離牆(和牆邊櫃子)有距離的地方,也不會停在手術台或人身上;點到牆上:推到牆外
    const MX=W/2-1.5, MZ=D/2-1.5, BX=W/2+1.4, BZ=D/2+1.4;
    room.inWall=(p)=>{ const l=loc(p.x,p.z); return !room.inside(p)&&Math.abs(l.x)<BX&&Math.abs(l.z)<BZ; };
    const inPacuBox=(l)=>l.x>PAX0-1.2&&l.x<PAX1+1.2&&l.z>PAZ0-1.2&&l.z<PAZ1+.4;
    room.inSuiteArea=(p)=>{ const l=loc(p.x,p.z); return (Math.abs(l.x)<BX&&Math.abs(l.z)<BZ)||inPacuBox(l); };
    room.fixTarget=(p,from)=>{ const l=loc(p.x,p.z), fromIn=!!(from&&room.inside(from));
      // 點到恢復室(含牆、床):拉回恢復室裡面空的地方
      if(inPacuBox(l)&&!(Math.abs(l.x)<BX&&Math.abs(l.z)<BZ)){ const cl=()=>{ l.x=Math.max(PAX0+1.1,Math.min(PAX1-1.1,l.x)); l.z=Math.max(PAZ0+1.1,Math.min(PAZ1-.4,l.z)); }; cl();
        for(let it=0;it<3;it++) for(const [x,z,r] of OR_FIX.slice(-4,-1)){ const dx=l.x-x, dz=l.z-z, d=Math.hypot(dx,dz), rr=r+.35; if(d<rr){ if(d<1e-3) l.x=x+rr; else { l.x=x+dx/d*rr; l.z=z+dz/d*rr; } } } cl(); return toW(l.x,l.z); }
      if(room.inside(p)||(fromIn&&Math.abs(l.x)<BX&&Math.abs(l.z)<BZ)){
        const clampB=()=>{ l.x=Math.max(-MX,Math.min(MX,l.x)); l.z=Math.max(-MZ,Math.min(MZ,l.z)); }; clampB();
        // 手術台(含頭端)當成長方形,點在上面就站到最近的一側
        const TX=1.6+.5, TZ0=-4.8, TZ1=3.5; if(Math.abs(l.x)<TX&&l.z>TZ0&&l.z<TZ1){ const dl=[TX-l.x,TX+l.x,l.z-TZ0,TZ1-l.z], m=Math.min(...dl); if(m===dl[0]) l.x=TX; else if(m===dl[1]) l.x=-TX; else if(m===dl[2]) l.z=TZ0; else l.z=TZ1; }
        const C=[...OR_FIX.slice(3),...room.obs().slice(OR_FIX.length).map(o=>{ const q=loc(o.c.x,o.c.z); return [q.x,q.z,o.r]; })];
        for(let it=0;it<3;it++) for(const [x,z,r] of C){ const dx=l.x-x, dz=l.z-z, d=Math.hypot(dx,dz), rr=r+.35; if(d<rr){ if(d<1e-3) l.x=x+rr; else { l.x=x+dx/d*rr; l.z=z+dz/d*rr; } } }
        clampB(); return toW(l.x,l.z); }
      if(Math.abs(l.x)<BX&&Math.abs(l.z)<BZ){ if(BX-Math.abs(l.x)<BZ-Math.abs(l.z)) l.x=Math.sign(l.x||1)*BX; else l.z=Math.sign(l.z||1)*BZ; return toW(l.x,l.z); }
      return new THREE.Vector3(p.x,0,p.z); };
    room.clampIn=(p)=>{ const l=loc(p.x,p.z); if(Math.abs(l.x)>=W/2+.3||Math.abs(l.z)>=D/2+.3) return p; l.x=Math.max(-(W/2-1.0),Math.min(W/2-1.0,l.x)); l.z=Math.max(-(D/2-1.0),Math.min(D/2-1.0,l.z)); return toW(l.x,l.z); };   // 從門口走到床頭(麻醉站位)時,先沿右牆走到床頭那側,不穿過外科團隊
    I.room=room;
    // live state pushed from the scenario panel
    const st={hr:72,sbp:118,dbp:72,spo2:99,etco2:35,rr:12,temp:36.5,skin:"normal",alarm:false,shake:false,rhythm:"sinus"};
    const VENT={ph:0,ev:null,b:null};
    const SK={normal:new THREE.Color(0xF2CDB0),pale:new THREE.Color(0xEDE6DC),cyan:new THREE.Color(0x7F9BE0),flush:new THREE.Color(0xF0705E)};
    let ph=0, wph=0, drawT=0, flash=0;
    function drawMon(){ const c=monCv.getContext("2d"), w=512, h=340; c.fillStyle="#04070A"; c.fillRect(0,0,w,h);
      const al=st.alarm&&flash<.5; if(st.alarm){ c.strokeStyle=al?"#FF3B3B":"#552222"; c.lineWidth=10; c.strokeRect(5,5,w-10,h-10); }
      const wave=(y,col,f)=>{ c.strokeStyle=col; c.lineWidth=3; c.beginPath(); for(let x=14;x<330;x++) c.lineTo(x,y+f(x)); c.stroke(); };
      const hrP=60/Math.max(30,st.hr)*90, sh=wph*90;
      const flat=st.rhythm==="asystole"||st.hr<1, vf=st.rhythm==="vf", stD=st.rhythm==="st"?10:0;   // 一直線 / 心室顫動
      wave(62,"#3BE06B",x=>{ if(flat) return Math.sin((x+sh)*.04)*1.2; if(vf){ const u=x+sh*3; return Math.sin(u*.21)*13+Math.sin(u*.47+1)*8+Math.sin(u*.09)*6; } const p=((x+sh)%hrP)/hrP; return p>.4&&p<.45?-36:p>.45&&p<.5?14:p>=.5&&p<.62?stD:p>.62&&p<.72?stD-6*Math.sin((p-.62)/.1*Math.PI):0; });
      wave(150,"#4FD6F2",x=>{ if(flat||vf||st.rhythm==="pea") return 0; const p=((x+sh)%hrP)/hrP; return -Math.max(0,Math.sin(p*Math.PI*2))*22*(st.spo2/100); });
      const rp=st.rr>0?60/st.rr*40:1e9; wave(240,"#F5D24A",x=>{ if(st.rr<=0) return 0; const p=((x+sh*.4)%rp)/rp; const hgt=Math.min(40,st.etco2); return p<.08?-hgt*p/.08:p<.5?-hgt:p<.56?-hgt*(1-(p-.5)/.06):0; });
      c.textAlign="right"; c.font="bold 56px sans-serif";
      c.fillStyle=st.hr>120||st.hr<50?(al?"#FF5050":"#3BE06B"):"#3BE06B"; c.fillText(Math.round(st.hr),500,82);
      c.fillStyle=st.spo2<90?(al?"#FF5050":"#4FD6F2"):"#4FD6F2"; c.fillText(Math.round(st.spo2),500,168);
      c.fillStyle="#F5D24A"; c.fillText(Math.round(st.etco2),500,256);
      c.font="15px sans-serif"; c.textAlign="left"; c.fillStyle="#3BE06B"; c.fillText("HR",350,32); c.fillStyle="#4FD6F2"; c.fillText("SpO₂ %",350,118); c.fillStyle="#F5D24A"; c.fillText("EtCO₂  RR "+Math.round(st.rr),350,206);
      c.fillStyle=st.sbp<80?(al?"#FF5050":"#F07A7A"):"#F07A7A"; c.font="bold 40px sans-serif"; c.fillText(`${Math.round(st.sbp)}/${Math.round(st.dbp)}`,16,318);
      c.font="22px sans-serif"; c.fillText(`(${Math.round((st.sbp+2*st.dbp)/3)})  NIBP`,196,316); c.fillStyle="#9AB"; c.fillText(`${st.temp.toFixed(1)}°C`,420,316);
      monTex.needsUpdate=true; }
    function tick(dt,tt){ ph+=(st.rr/60)*Math.PI*2*dt; wph+=dt*1.6; flash=(flash+dt*2)%1;
      // 呼吸器:依呼吸次數讓手術室麻醉機的風箱上下動(吸氣:風箱往下壓;吐氣:回升),I:E 約 1:2,並通知音效
      { const rr=Math.max(6,Math.min(40,st.rr||12)); const p0=VENT.ph; VENT.ph=(VENT.ph+dt*rr/60)%1; if(VENT.ph<p0) VENT.ev="in"; else if(p0<1/3&&VENT.ph>=1/3) VENT.ev="out";
        if(VENT.b){ const insp=VENT.ph<1/3, k=insp?VENT.ph*3:(VENT.ph-1/3)*1.5; VENT.b.scale.y=insp?1.1-.45*Math.sin(k*Math.PI/2):.65+.45*Math.sin(k*Math.PI/2); } }
      const b=st.rr>0?(Math.sin(ph)*.5+.5):0; chest.scale.y=1+b*.35; chest.position.y=2.2+b*.06;
      patM.color.lerp(SK[st.skin]||SK.normal,Math.min(1,dt*1.5));
      head.position.x=st.shake?Math.sin(tt*40)*.03:0;
      drawT-=dt; if(drawT<=0){ drawT=.1; drawMon(); }
      const vis=viewIsl===3; labels.forEach(l=>l.visible=vis);
      if(vis){ staffTick(dt,tt); eventTick(dt,tt); cprTick(dt,tt); } }
    /* ---------- 恢復室(PACU):在手術室旁邊,前面開放 ---------- */
    { const PX=-16, PW=9, PD=10, pf=new THREE.Mesh(new THREE.BoxGeometry(PW,.12,PD),new THREE.MeshStandardMaterial({color:0xEAF2F7,roughness:.6})); pf.position.set(PX,.06,0); pf.receiveShadow=true; g.add(pf);
      const pwM=M(0xD6E6EF,{roughness:.7}); const pwall=(w,d,x,z)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(w,WH,d),pwM); m.position.set(x,WH/2,z); g.add(m); const t=new THREE.Mesh(new THREE.BoxGeometry(w+.04,.12,d+.04),M(0x8FB8CF)); t.position.set(x,WH+.06,z); g.add(t); };
      pwall(PW,.3,PX,-PD/2); pwall(.3,PD,PX-PW/2,0); pwall(.3,PD,PX+PW/2,0);
      const ps=new THREE.Mesh(new THREE.PlaneGeometry(3.6,.8),new THREE.MeshBasicMaterial({map:tex(360,80,(c,w,h)=>{ c.fillStyle="#3E7FA8"; c.fillRect(0,0,w,h); c.fillStyle="#fff"; c.font='400 40px "Huninn","Noto Sans TC"'; c.textAlign="center"; c.textBaseline="middle"; c.fillText("恢復室 PACU",w/2,h/2+2); })}));
      ps.rotation.x=-Math.PI/2; ps.position.set(PX,.14,PD/2-.8); g.add(ps);
      // 一張已經有病人的床 + 恢復室護理師
      const bed=new THREE.Group(); const bf=new THREE.Mesh(new RoundedBoxGeometry(2.0,.5,4.2,2,.12),M(0xF4F6F8)); bf.position.y=1.3; bed.add(bf); const bl=new THREE.Mesh(new THREE.BoxGeometry(1.8,1.1,3.8),M(0xC9CDD2,{metalness:.4,roughness:.4})); bl.position.y=.6; bed.add(bl);
      const pb=new THREE.Mesh(new RoundedBoxGeometry(1.5,.5,2.8,3,.2),M(0x9CC8E8)); pb.position.set(0,1.75,-.3); bed.add(pb); const ph2=new THREE.Mesh(new THREE.SphereGeometry(.45,16,12),M(0xF2CDB0)); ph2.position.set(0,1.85,1.45); bed.add(ph2);
      bed.position.set(PX-2.3,0,-1.6); g.add(bed); }
    const pacuNurse=mkStaff({scrub:0x7FB2D8,cap:0x3E7FA8,hands:"type"}); pacuNurse.position.set(-13.6,.12,-1.5); pacuNurse.rotation.y=-Math.PI/2; g.add(pacuNurse);
    /* ---------- 呼救:麻醉主治醫師與三位麻醉專科護理師從門口衝進來 ---------- */
    const HELP=[{o:{scrub:0x2E5E9E,gown:0xF7F7F4,cap:0x2E5E9E,hands:"front"},to:[-1.4,7.4]},{o:{scrub:0x5FA98F,cap:0x3F8F72},to:[-3.4,7.5]},{o:{scrub:0x5FA98F,cap:0xE48CA8},to:[-5.2,7.6]},{o:{scrub:0x5FA98F,cap:0xF2B544},to:[-6.6,6.6]}]
      .map(h=>{ const p=mkStaff(h.o); p.visible=false; g.add(p); return {p,to:h.to,t:0}; });
    let helpOn=false;
    function help(){ if(helpOn) return; helpOn=true; HELP.forEach((h,i)=>{ h.p.visible=true; h.p.position.set(W/2+3+i*1.6,.12,DZC); h.t=-i*.35; h.wp=[[W/2-1.2,DZC],[5.0,6.4],h.to]; }); }
    /* ---------- ACLS:壓胸與電擊 ---------- */
    const defib=new THREE.Group(); { const cb=new THREE.Mesh(new RoundedBoxGeometry(1.1,1.6,.8,2,.08),M(0xE2463F)); cb.position.y=.8; defib.add(cb);
      const dm=new THREE.Mesh(new RoundedBoxGeometry(.9,.6,.5,2,.06),M(0x2A3038)); dm.position.y=1.9; defib.add(dm);
      const ds=new THREE.Mesh(new THREE.PlaneGeometry(.72,.42),new THREE.MeshBasicMaterial({color:0x2EE07A})); ds.position.set(0,1.92,.26); defib.add(ds);
      for(const sx of [-.25,.25]){ const pd=new THREE.Mesh(new RoundedBoxGeometry(.2,.12,.3,2,.04),M(0xF4F6F8)); pd.position.set(sx,1.66,.3); defib.add(pd); } }
    defib.position.set(3.6,0,3.0); defib.rotation.y=-Math.PI/2; defib.visible=false; g.add(defib);
    const pads=[[-.45,.9],[.55,.3]].map(([x,z])=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(.5,.05,.6),M(0xF4F6F8)); m.position.set(x,2.5,z); m.visible=false; g.add(m); return m; });
    const zap=new THREE.PointLight(0xBFE6FF,0,14,2); zap.position.set(0,4,.6); g.add(zap);
    let cprOn=false, shockT=0;
    const CPRX=1.75, CPRZ=.05, CPRUP=.62;   // 站在踏階上,手臂才會在胸口上方而不是陷進布單
    const step=new THREE.Mesh(new RoundedBoxGeometry(1.3,.6,1.0,2,.06),M(0x9AA3AD,{metalness:.4,roughness:.4})); step.position.set(CPRX+.2,.3,CPRZ); step.visible=false; g.add(step);   // 壓胸的人站在病人右側、手臂板下方,不和手臂板與外科醫師重疊
    function cpr(on){ cprOn=on; defib.visible=on||shockT>0; pads.forEach(p=>p.visible=on); step.visible=on; const c=HELP[1]; if(on){ c.p.visible=true; c.t=1e9; c.p.position.set(CPRX,.12+CPRUP,CPRZ); c.p.rotation.set(0,-Math.PI/2,0,"YXZ"); } else { if(!helpOn) c.p.visible=false; c.t=0; c.p.position.y=.12; c.p.rotation.x=0; } }
    function shock(){ shockT=.7; defib.visible=true; }
    function cprTick(dt,tt){ zap.intensity=shockT>0?Math.max(0,shockT-.4)*60:0;
      if(shockT>0){ shockT-=dt; const k=Math.max(0,shockT-.4)/.3; head.position.y=2.45+k*.35; chest.position.y=2.2+k*.3; if(shockT<=0){ head.position.y=2.45; } }
      if(!cprOn) return; const c=HELP[1].p, u=c.userData, ph=(tt*1.85)%1, push=Math.max(0,Math.sin(ph*Math.PI*2));   // 約 110 次/分
      c.position.set(CPRX,.12+CPRUP-push*.12,CPRZ); c.rotation.set(.32+push*.08,-Math.PI/2,0,"YXZ"); u.legs.forEach(l=>l.rotation.x=0);
      u.arms.forEach(a=>{ a.ar.rotation.x=-.95-push*.08; a.ar.rotation.z=a.sx*.42; a.fo.rotation.x=-.1; });   // 雙臂打直、雙手交疊在胸骨上
      if(shockT<=0) chest.scale.y=Math.max(.55,chest.scale.y-push*.4); }
    /* ---------- 送恢復室:推床從手術台旁推出門,沿牆外繞到恢復室 ---------- */
    const gur=new THREE.Group(); { const gb=new THREE.Mesh(new RoundedBoxGeometry(1.8,.4,4.0,2,.12),M(0xF4F6F8)); gb.position.y=1.25; gur.add(gb); const gl=new THREE.Mesh(new THREE.BoxGeometry(1.6,1.0,3.6),M(0xC9CDD2,{metalness:.4,roughness:.4})); gl.position.y=.55; gur.add(gl);
      const gp=new THREE.Mesh(new RoundedBoxGeometry(1.4,.45,2.7,3,.2),M(0x9CC8E8)); gp.position.set(0,1.65,-.3); gur.add(gp); const gh=new THREE.Mesh(new THREE.SphereGeometry(.42,16,12),M(0xF2CDB0)); gh.position.set(0,1.75,1.35); gur.add(gh);
      const mo=new THREE.Mesh(new RoundedBoxGeometry(.9,.6,.15,2,.05),M(0x2A3038)); mo.position.set(0,2.2,-1.9); gur.add(mo); }
    gur.visible=false; g.add(gur);
    const GPATH=[[3.6,3.6],[6.4,1.0],[7.6,-3.2],[9.0,DZC],[W/2+1.8,DZC],[W/2+1.8,11.6],[-12.6,11.6],[-16,6.8],[-16,1.4]];
    let ho=null;
    // 推床出發後,手術台上的病人就不再顯示(病人已經在推床上)
    const patParts=[]; g.traverse(o=>{ if(o.isMesh&&(o.material===patM||o.material===drapeM)) patParts.push(o); }); patParts.push(head,pillow,ether,gear);
    const showPat=(v)=>patParts.forEach(o=>o.visible=v);
    function handoff(cb,driven){ showPat(false); restOn=true; gur.visible=true; gur.position.set(GPATH[0][0],0,GPATH[0][1]); gur.rotation.y=Math.atan2(GPATH[1][0]-GPATH[0][0],GPATH[1][1]-GPATH[0][1]); ho={i:1,cb,done:false,driven:!!driven}; }
    // 小麻推床時由主程式帶著推床走(世界座標);到恢復室後呼叫 gurDone
    function gurSet(wx,wz,ry){ const l=loc(wx,wz); gur.position.set(l.x,0,l.z); gur.rotation.y=ry-yaw; }
    function gurDone(){ if(!ho||ho.done) return; ho.done=true; ho.retT=2.5; const cb=ho.cb; ho.cb=null; cb&&cb(); }
    function reset(){ cpr(false); shockT=0; restOn=false; circRest=false; cRet=null; staff.forEach(d=>{ d.p.position.set(d.x,.12,d.z); d.p.rotation.set(0,d.ry,0); d.p.userData.legs.forEach(l=>l.rotation.x=0); d.back=0; }); cw={i:0,wait:1}; showPat(true); helpOn=false; HELP.forEach(h=>h.p.visible=false); gur.visible=false; ho=null; }
    // 不要穿過小麻:靠太近就往旁邊讓開
    const _nl=new THREE.Vector3(); const dodge=(p)=>{ g.updateMatrixWorld(); _nl.copy(nurse.position); g.worldToLocal(_nl); const dx=p.position.x-_nl.x, dz=p.position.z-_nl.z, d=Math.hypot(dx,dz), R=1.25; if(d<R&&d>1e-4){ p.position.x=_nl.x+dx/d*R; p.position.z=_nl.z+dz/d*R; } };
    let cRet=null;   // 送完病人後,巡迴護理師沿原路走回手術室
    const chairs=[]; let restOn=false, circRest=false;
    const CHAIRS=[["外科醫師",5.6,-3.4],["外科住院醫師",-7.3,-3.4],["巡迴護理師",8.5,1.4]];
    function addChairs(src){ CHAIRS.forEach(([role,x,z])=>{ const c=src.clone(); c.scale.setScalar(.88); c.position.set(x,.12,z); c.rotation.set(0,Math.atan2(-x,-z),0); g.add(c); chairs.push({role,c,x,z,ry:Math.atan2(-x,-z)}); }); }
    const sitPose=(p,ch,dt)=>{ const u=p.userData; p.position.x+=(ch.x-p.position.x)*Math.min(1,dt*6); p.position.z+=(ch.z-p.position.z)*Math.min(1,dt*6); p.position.y=-.3; p.rotation.set(0,ch.ry,0);
      u.legs.forEach(l=>l.rotation.x=-1.45); u.arms.forEach(a=>{ a.ar.rotation.x=-.5; a.ar.rotation.z=a.sx*.15; a.fo.rotation.x=-1.0; }); };
    const walkTo=(p,tx,tz,dt,sp,tt)=>{ const u=p.userData, dx=tx-p.position.x, dz=tz-p.position.z, dist=Math.hypot(dx,dz);
      if(dist>.08){ const s2=Math.min(dist,dt*sp); p.position.x+=dx/dist*s2; p.position.z+=dz/dist*s2; const want=Math.atan2(dx,dz); let df=want-p.rotation.y; while(df>Math.PI) df-=2*Math.PI; while(df<-Math.PI) df+=2*Math.PI; p.rotation.y+=df*Math.min(1,dt*8);
        const sw=Math.sin(tt*(sp>3?13:9))*.55; u.legs[0].rotation.x=sw; u.legs[1].rotation.x=-sw; u.arms.forEach(a=>{ a.ar.rotation.x=-a.sx*sw*.7; a.fo.rotation.x=-.4; }); dodge(p); return false; }
      u.legs.forEach(l=>l.rotation.x*=.8); return true; };
    function eventTick(dt,tt){
      HELP.forEach((h,hi)=>{ if(!h.p.visible) return; if(cprOn&&hi===1) return; h.t+=dt; if(h.t<0) return; if(!h.wp) h.wp=[h.to]; const last=h.wp.length===1;
        const [tx,tz]=h.wp[0]; if(walkTo(h.p,tx,tz,dt,5.2,tt)){ if(!last){ h.wp.shift(); return; } h.p.rotation.y+=((-Math.PI*.85)-h.p.rotation.y)*Math.min(1,dt*4); h.p.userData.arms.forEach(a=>{ a.ar.rotation.x=-.6; a.fo.rotation.x=-1.2+Math.sin(tt*5+a.sx)*.15; }); } });
      if(ho&&!ho.done){ if(!ho.driven){ const t=GPATH[ho.i], dx=t[0]-gur.position.x, dz=t[1]-gur.position.z, dist=Math.hypot(dx,dz);
        if(dist>.06){ const s2=Math.min(dist,dt*4.5); gur.position.x+=dx/dist*s2; gur.position.z+=dz/dist*s2; const want=Math.atan2(dx,dz); let df=want-gur.rotation.y; while(df>Math.PI) df-=2*Math.PI; while(df<-Math.PI) df+=2*Math.PI; gur.rotation.y+=df*Math.min(1,dt*6); }
        else if(++ho.i>=GPATH.length){ ho.done=true; ho.retT=2.5; gur.rotation.y=Math.PI; const cb=ho.cb; ho.cb=null; cb&&cb(); } }
        // 巡迴護理師在推床右側扶著床一起推
        const circ=staff.find(d=>d.role==="巡迴護理師").p; const side=new THREE.Vector3(1.35,0,-1.2).applyAxisAngle(up0,gur.rotation.y); walkTo(circ,gur.position.x+side.x,gur.position.z+side.z,dt,7,tt); }
      // 病人交給恢復室後,巡迴護理師沿原路走回手術室,坐到椅子上休息
      if(ho&&ho.done&&ho.retT>0){ ho.retT-=dt; if(ho.retT<=0){ const ch=chairs.find(c=>c.role==="巡迴護理師"); cRet=[...GPATH].reverse().slice(1); if(ch) cRet.push([ch.x+(-ch.x)*.12,ch.z+(-ch.z)*.12]); circRest=true; } }
    }
    // 手術室成員會動:外科醫師與刷手護理師做開刀動作,巡迴護理師在房間裡走來走去
    const CIRC=[[7.0,3.8,2.5],[7.2,-1.5,0],[5.6,-4.6,2.2],[3.6,-2.2,0],[4.4,4.6,1.6]];   // 巡迴的路線點(x, z, 停留秒數)
    let cw={i:0,wait:2.5};
    function staffTick(dt,tt){
      staff.forEach((d,k)=>{ const u=d.p.userData;
        if(d.role==="巡迴護理師"){ if(ho&&!ho.done) return; if(cRet){ if(walkTo(d.p,cRet[0][0],cRet[0][1],dt,2.6,tt)){ cRet.shift(); if(!cRet.length){ cRet=null; cw={i:0,wait:1}; } } return; }
          if(circRest){ const ch=chairs.find(c=>c.role===d.role); if(ch){ sitPose(d.p,ch,dt); return; } } if(ho) return; const tgt=CIRC[cw.i], dx=tgt[0]-d.p.position.x, dz=tgt[1]-d.p.position.z, dist=Math.hypot(dx,dz);
          if(dist>.08){ const sp=Math.min(dist,dt*2.2); d.p.position.x+=dx/dist*sp; d.p.position.z+=dz/dist*sp; dodge(d.p);
            const want=Math.atan2(dx,dz); let df=want-d.p.rotation.y; while(df>Math.PI) df-=2*Math.PI; while(df<-Math.PI) df+=2*Math.PI; d.p.rotation.y+=df*Math.min(1,dt*8);
            const sw=Math.sin(tt*9)*.5; u.legs[0].rotation.x=sw; u.legs[1].rotation.x=-sw; u.arms.forEach(a=>{ a.ar.rotation.x=-a.sx*sw*.6; a.fo.rotation.x=-.3; }); }
          else { u.legs.forEach(l=>l.rotation.x*=.8); cw.wait-=dt; u.arms.forEach(a=>{ a.ar.rotation.x=-.35; a.fo.rotation.x=-1.1+Math.sin(tt*6+a.sx)*.12; });
            if(cw.wait<=0){ cw.i=(cw.i+1)%CIRC.length; cw.wait=CIRC[cw.i][2]; } }
          return; }
        // 手術結束、病人送去恢復室:外科醫師與住院醫師走到椅子坐下休息
        if(restOn&&!cprOn){ const ch=chairs.find(c=>c.role===d.role); if(ch){ if(d.p.position.y>-.2&&!walkTo(d.p,ch.x*.86,ch.z*.86,dt,2.2,tt)) return; sitPose(d.p,ch,dt); return; } }
        // 急救時外科團隊退開,讓出病人身邊的位置
        if(cprOn||(d.back||0)>0){ const tgtB=cprOn?1:0; d.back=(d.back||0)+(tgtB-(d.back||0))*Math.min(1,dt*3); const sx=Math.sign(d.x)||1; d.p.position.x=d.x+sx*1.5*d.back; d.p.position.z=d.z-.6*d.back; if(cprOn){ u.arms.forEach(a=>{ a.ar.rotation.x=-.3; a.fo.rotation.x=-1.0; }); return; } if(d.back<.01){ d.back=0; d.p.position.set(d.x,.12,d.z); } }
        // 外科團隊:雙手在術野上做切、縫、拉的小動作,身體微微前傾
        u.arms.forEach(a=>{ const ph=tt*(2.2+k*.4)+a.sx*1.3+k; a.ar.rotation.x=-.5+Math.sin(ph)*.12; a.fo.rotation.x=-1.3+Math.sin(ph*1.7)*.22; a.ar.rotation.z=a.sx*(.15+Math.sin(ph*.8)*.06); });
        d.p.rotation.x=.06+Math.sin(tt*.7+k)*.03; });
    }
    drawMon();
    // 生理監視器就是麻醉機上原本那台:把情境的生命徵象畫到它的螢幕上(不另外多放一台)
    const mountMon=()=>{ let scr=null; amHolder.traverse(o=>{ const p=o.geometry&&o.geometry.parameters; if(o.isMesh&&p&&Math.abs(p.width-1.85)<1e-3&&Math.abs(p.height-1.3)<1e-3) scr=o; });
      if(scr) scr.material=new THREE.MeshBasicMaterial({map:monTex}); };
    return {set:(v)=>Object.assign(st,v), get:()=>({...st}), tick, I, amHolder, vent:VENT, mountMon, help, handoff, gurSet, gurDone, GPATH, reset, toW, yaw, cpr, shock, addChairs};
  })();
  // bridges between every pair of islands
  const BH=3.0;
  const BRIDGES=[[0,1],[0,2],[1,2],[0,3],[0,4],[0,5],[0,6]].map(([i,j])=>{ const A=ISL[i],B=ISL[j]; const dir=B.c.clone().sub(A.c).normalize(); const a=A.c.clone().addScaledVector(dir,A.R-1.6), b=B.c.clone().addScaledVector(dir,-(B.R-1.6)); const len=a.distanceTo(b); return {i,j,a,b,dir,len,h:Math.min(2.2,len*.12)}; });
  const bridgeT=(b,x,z)=>{ const abx=b.b.x-b.a.x, abz=b.b.z-b.a.z; return ((x-b.a.x)*abx+(z-b.a.z)*abz)/(abx*abx+abz*abz); };
  const segDist=(x,z,b)=>{ const t=Math.max(0,Math.min(1,bridgeT(b,x,z))); return Math.hypot(b.a.x+(b.b.x-b.a.x)*t-x,b.a.z+(b.b.z-b.a.z)*t-z); };
  const deckY=(t,h)=>TOP+.22+(h===undefined?BH:h)*Math.sin(Math.PI*Math.max(0,Math.min(1,t)));
  const SIGNS=[];
  { const wood=M(0xC99A68,{roughness:.8}), wood2=M(0xB07D52,{roughness:.8}), rope=M(0xE9D8B4,{roughness:.9}), post=M(0x9C6A42,{roughness:.8});
    for(const br of BRIDGES){ const g=new THREE.Group(); g.position.copy(br.a); g.rotation.y=-Math.atan2(br.dir.z,br.dir.x); scene.add(g);
      const n=Math.ceil(br.len/.55);
      for(let k=0;k<=n;k++){ const t=k/n, x=t*br.len, y=deckY(t,br.h), dy=br.h*Math.PI/br.len*Math.cos(Math.PI*t);
        const pl=new THREE.Mesh(new THREE.BoxGeometry(.46,.14,6.2),k%2?wood:wood2); pl.position.set(x,y,0); pl.rotation.z=Math.atan(dy); g.add(pl); }
      for(const sd of [-3.05,3.05]){ const tops=[];
        for(let k=0;k<=Math.ceil(br.len/2.6);k++){ const t=Math.min(1,k*2.6/br.len), x=t*br.len, y=deckY(t,br.h);
          const p=new THREE.Mesh(new THREE.CylinderGeometry(.09,.1,1.2,8),post); p.position.set(x,y+.6,sd); g.add(p); tops.push(new THREE.Vector3(x,y+1.15,sd)); }
        g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(tops),Math.max(20,tops.length*6),.045,6,false),rope));
        const mid=tops.map(v=>v.clone().add(new THREE.Vector3(0,-.45,0))); g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(mid),Math.max(20,tops.length*6),.035,6,false),rope)); }
      const A=ISL[br.i], B=ISL[br.j];
      for(let x=A.R-br.a.distanceTo(A.c)+3; x<br.len-(B.R-br.b.distanceTo(B.c))-2; x+=4){ const t=x/br.len, y=deckY(t,br.h);
        for(const sd of [-2.7,2.7]){ const pi=new THREE.Mesh(new THREE.CylinderGeometry(.22,.26,y+4,8),post); pi.position.set(x,(y-4)/2,sd); g.add(pi); } }
      shadowy(g);
      // signposts at both ends pointing to the island across
      for(const [from,to,at,dirS] of [[A,B,br.a,1],[B,A,br.b,-1]]){ const sg=new THREE.Group();
        const p=at.clone().addScaledVector(br.dir,-dirS*.9); sg.position.set(p.x,TOP,p.z); sg.rotation.y=-Math.atan2(br.dir.z*dirS,br.dir.x*dirS)+Math.PI/2; scene.add(sg);
        // signboard beside the bridge foot (no archway): says which island this is / where the bridge goes
        const AW=M(0xFAF8F3,{roughness:.5}), AT=M(0x2E9C97,{roughness:.45}), AB=M(0xDDF3F1,{roughness:.6}); const SX=5.2;
        for(const ox of [-1.86,1.86]){ const pole=new THREE.Mesh(new THREE.CylinderGeometry(.11,.14,3.2,10),AW); pole.position.set(SX+ox,1.6,0); sg.add(pole);
          for(const y of [.5,1.0]){ const band=new THREE.Mesh(new THREE.CylinderGeometry(.145,.145,.18,10),AT); band.position.set(SX+ox,y,0); sg.add(band); }
          const cap=new THREE.Mesh(new THREE.SphereGeometry(.19,12,8),AT); cap.position.set(SX+ox,3.28,0); sg.add(cap); }
        const bd=new THREE.Mesh(new THREE.BoxGeometry(3.5,1.0,.12),AB); bd.position.set(SX,2.6,0); sg.add(bd);
        const fr=new THREE.Mesh(new THREE.BoxGeometry(3.66,.1,.16),AT); fr.position.set(SX,3.15,0); sg.add(fr);
        const mk=(txt)=>new THREE.MeshBasicMaterial({map:tex(480,120,(c,w,h)=>{ c.fillStyle="#F2FBFA"; c.fillRect(0,0,w,h); c.strokeStyle="#2E9C97"; c.lineWidth=6; c.strokeRect(4,4,w-8,h-8); c.fillStyle="#1F5F66"; c.font='400 50px "Huninn","Noto Sans TC"'; c.textAlign="center"; c.textBaseline="middle"; c.fillText(txt,w/2,h/2+3); })});
        const lab=new THREE.Mesh(new THREE.PlaneGeometry(3.4,.9),mk(to.ic+" 往 "+to.name)); lab.position.set(SX,2.6,.075); sg.add(lab);
        const lab2=new THREE.Mesh(new THREE.PlaneGeometry(3.4,.9),mk(from.ic+" "+from.name)); lab2.rotation.y=Math.PI; lab2.position.set(SX,2.6,-.075); sg.add(lab2);
        sg.userData.isl=to.i; shadowy(sg); SIGNS.push(sg); } } }

  /* districts on a ring */
  const ORDER=ISLAND_DEF.flatMap(I=>I.sids);
  const RING=20.5, PR=5.4, PH=.9;
  const D3={};
  const svgImg=(k)=>new Promise(res=>{ const org=(typeof ORGANS!=="undefined")&&ORGANS[k]; const vb=org?"0 0 200 200":"0 0 100 100"; const body=org||ICONS[k];
    const s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${org?"-6 -6 212 212":"-4 -4 108 108"}" width="512" height="512">${body}</svg>`;
    const im=new Image(); im.onload=()=>res(im); im.onerror=()=>res(null); im.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(s); });
  const rand=(()=>{ let s=7; return ()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; }; })();
  const clickables=[];
  const PLACE=[]; for(const I of ISL) I.sids.forEach((sid,k)=>{ const n=I.sids.length; let a,c,u; if(I.dring>0){ a=(-90+(k+(I.doff||0))*360/n)*Math.PI/180; u=new THREE.Vector3(Math.cos(a),0,Math.sin(a)); c=I.c.clone().addScaledVector(u,I.dring); } else { u=I.c.clone().sub(ISL[0].c).normalize(); a=Math.atan2(u.z,u.x); c=I.c.clone(); } PLACE.push({sid,a,c,u,I}); });
  for(const {sid,a,c,u,I} of PLACE){
    const s=sysById[sid]; if(!s) continue;
    const col=css("--"+sid);
    const g=new THREE.Group(); g.position.copy(c); scene.add(g);
    const plat=new THREE.Mesh(new THREE.CylinderGeometry(PR,PR+.35,PH,6),[M(mix(col,"#fff",.4)),M(mix(col,"#fff",.62)),M(mix(col,"#fff",.4))]);
    plat.position.y=TOP+PH/2; plat.rotation.y=a; plat.userData.sys=sid; shadowy(plat); g.add(plat); clickables.push(plat);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(PR-.6,.07,6,6),new THREE.MeshBasicMaterial({color:mix(col,"#fff",.35)})); rim.rotation.x=Math.PI/2; rim.rotation.z=a; rim.position.y=TOP+PH+.02; g.add(rim);
    // organ sticker (billboard)
    const disc=document.createElement("canvas"); disc.width=disc.height=512; const dg=disc.getContext("2d");
    const paint=(im)=>{ dg.clearRect(0,0,512,512); dg.fillStyle="rgba(80,60,60,.18)"; dg.beginPath(); dg.arc(256,266,236,0,7); dg.fill();
      dg.fillStyle="#fff"; dg.beginPath(); dg.arc(256,256,236,0,7); dg.fill(); dg.lineWidth=18; dg.strokeStyle=col; dg.stroke();
      dg.fillStyle=mix(col,"#fff",.88).getStyle(); dg.beginPath(); dg.arc(256,256,210,0,7); dg.fill();
      if(im) dg.drawImage(im,76,76,360,360); };
    paint(null);
    const stx=new THREE.CanvasTexture(disc); stx.colorSpace=THREE.SRGBColorSpace;
    svgImg(sid).then(im=>{ paint(im); stx.needsUpdate=true; });
    const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:stx,depthWrite:false})); spr.scale.set(4.6,4.6,1); spr.position.y=TOP+PH+9.6; spr.userData.sys=sid; g.add(spr); clickables.push(spr);
    const ts=topicsOf(sid);
    // organ / equipment illustration laid flat on top of the district platform
    const deck=new THREE.Mesh(new THREE.CircleGeometry(4.0,64),new THREE.MeshStandardMaterial({map:stx,transparent:true,roughness:.75,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
    deck.rotation.x=-Math.PI/2; deck.position.y=TOP+PH+.03; deck.receiveShadow=true; deck.userData.sys=sid; g.add(deck); clickables.push(deck);
    // path stones toward the plaza
    for(let d=(I.ring?I.ring+1:99); d<I.dring-PR; d+=1.6){ const st=new THREE.Mesh(new THREE.CylinderGeometry(.55,.6,.12,12),M(0xF6E2C6)); st.position.set(I.c.x+Math.cos(a)*d+(rand()-.5)*.4,TOP+.06,I.c.z+Math.sin(a)*d+(rand()-.5)*.4); st.receiveShadow=true; scene.add(st); }
    // label
    const lb=document.createElement("button"); lb.type="button"; lb.className="lbl3"; lb.style.setProperty("--c",`var(--${sid})`);
    lb.innerHTML=`${s.name}`; lb.title=`${ts.length} 本書 · ${new Set(ts.flatMap(t=>t.refs)).size} 題歷屆考題`;
    lb.onclick=()=>goDistrict(sid);
    D3[sid]={sid,a,c,u,isl:I.i,g,spr,lb,col,deck,shelf:null,books:{}};
  }
  /* trees */
  for(const I of ISL){ const want=[8,9,0,3,8,6,9][I.i], r0=I.ring?I.ring+.4:PR+2.5; let placed=0, tries=0;
  while(placed<want && tries<3000){ tries++;
    const r=r0+rand()*(I.R-2-r0), a=rand()*Math.PI*2; const x=I.c.x+Math.cos(a)*r, z=I.c.z+Math.sin(a)*r;
    if(Object.values(D3).some(d=>Math.hypot(d.c.x-x,d.c.z-z)<PR+1.6)) continue;
    if(Object.values(D3).some(d=>{ if(d.isl!==I.i||!I.ring) return false; const rx=x-I.c.x, rz=z-I.c.z; const t=(rx*Math.cos(d.a)+rz*Math.sin(d.a)); const perp=Math.abs(-rx*Math.sin(d.a)+rz*Math.cos(d.a)); return t>0&&perp<1.6; })) continue;
    if(BRIDGES.some(br=>segDist(x,z,br)<4.4)) continue;
    if((I.i===2||I.i===6) && Math.hypot(x-I.c.x,z-I.c.z)>I.R-4.5) continue;
    if(I.room && I.room.near(x,z)) continue;
    if(trees.some(t=>Math.hypot(t.position.x-x,t.position.z-z)<3.6)) continue;
    if(I.i===0&&(r<9.5||r>26.5||(z>-4&&Math.abs(x)<z*1.4+10))) continue;   // 麻醉機正前方留空
    if(OBS.some(o=>Math.hypot(o.c.x-x,o.c.z-z)<o.r+1.4)) continue;
    const tr=BUSH.mk(1.0+rand()*.3,placed); tr.userData.ph=rand()*6; tr.userData.act="palm"; tr.userData.shk=0; tr.userData.home=I.i; trees.push(tr);
    tr.position.set(x,TOP,z); tr.rotation.y=rand()*6; shadowy(tr); scene.add(tr); placed++;
  } }
  /* clouds */
  const clouds=[]; const cm=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,transparent:true,opacity:.92});
  for(let i=0;i<10;i++){ const cg=new THREE.Group(), mat=cm.clone(); [[0,0,0,2.2],[2,-.3,.4,1.6],[-2,-.3,-.2,1.7],[.8,.8,-.3,1.5]].forEach(([x,y,z,r])=>{ const sp=new THREE.Mesh(new THREE.SphereGeometry(r,14,10),mat); sp.position.set(x,y,z); cg.add(sp); });
    const a=i/10*Math.PI*2+.3; const sc=2.2+rand()*2; cg.scale.setScalar(sc); cg.userData.mat=mat; cg.userData.rad=sc*4.2; cg.userData.f=1; cg.position.set(Math.cos(a)*130,30+rand()*16,Math.sin(a)*130); cg.userData.a=a; cg.userData.r=110+rand()*70; cg.userData.k=i; scene.add(cg); clouds.push(cg); }
  const ENV=buildEnvironment(); 



  /* ================= 天空、太陽月亮、海、帆船、天氣 ================= */
  function buildEnvironment(){
    const sRGB=h=>new THREE.Color(h).convertLinearToSRGB();
    // sky dome with a vertical gradient (follows the camera)
    const skyU={top:{value:sRGB(0x6FB8E6)},bot:{value:sRGB(0xE6F4FB)},flash:{value:0}};
    const sky=new THREE.Mesh(new THREE.SphereGeometry(900,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:skyU,
      vertexShader:"varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",
      fragmentShader:"uniform vec3 top; uniform vec3 bot; uniform float flash; varying vec3 vP; void main(){ float h=clamp(vP.y*1.8+.08,0.,1.); vec3 c=mix(bot,top,pow(h,.7)); gl_FragColor=vec4(c+flash,1.); }"}));
    sky.renderOrder=-10; scene.add(sky);
    const glowTex=(inner,outer)=>tex(256,256,(g,w,h)=>{ const gr=g.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2); gr.addColorStop(0,inner); gr.addColorStop(.18,inner); gr.addColorStop(.32,outer); gr.addColorStop(1,"rgba(255,255,255,0)"); g.fillStyle=gr; g.fillRect(0,0,w,h); });
    const sunSpr=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex("#FFFBEA","rgba(255,214,120,.55)"),fog:false,depthWrite:false,transparent:true})); sunSpr.scale.set(70,70,1); scene.add(sunSpr);
    const moonSpr=new THREE.Sprite(new THREE.SpriteMaterial({fog:false,depthWrite:false,transparent:true,map:tex(256,256,(g,w,h)=>{ const gr=g.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2); gr.addColorStop(0,"rgba(220,232,255,.55)"); gr.addColorStop(.5,"rgba(200,215,255,.12)"); gr.addColorStop(1,"rgba(200,215,255,0)"); g.fillStyle=gr; g.fillRect(0,0,w,h);
      g.fillStyle="#F4F2E6"; g.beginPath(); g.arc(w/2,h/2,40,0,7); g.fill(); g.fillStyle="rgba(170,170,160,.35)"; [[-12,-8,9],[14,6,7],[2,16,5],[-6,14,4]].forEach(([x,y,r])=>{ g.beginPath(); g.arc(w/2+x,h/2+y,r,0,7); g.fill(); }); })})); moonSpr.scale.set(46,46,1); scene.add(moonSpr);
    // stars
    const sp=[]; for(let i=0;i<1400;i++){ const th=Math.random()*Math.PI*2, ph=Math.acos(Math.random()*.92+.06); sp.push(Math.sin(ph)*Math.cos(th)*850,Math.cos(ph)*850,Math.sin(ph)*Math.sin(th)*850); }
    const sg=new THREE.BufferGeometry(); sg.setAttribute("position",new THREE.Float32BufferAttribute(sp,3));
    const stars=new THREE.Points(sg,new THREE.PointsMaterial({color:0xffffff,size:2.2,sizeAttenuation:false,transparent:true,opacity:0,fog:false,depthWrite:false})); scene.add(stars);
    // rainbow: soft concentric bands
    const rbTex=tex(1024,64,(g,w,h)=>{ const cols=["#FF4D4D","#FF9E3D","#FFE14D","#5FD068","#4DA6FF","#5B5BE8","#A35BE8"]; const gr=g.createLinearGradient(0,0,0,h); cols.forEach((c,i)=>gr.addColorStop(i/(cols.length-1),c)); g.fillStyle=gr; g.fillRect(0,0,w,h); });
    const rainbow=new THREE.Mesh(new THREE.RingGeometry(250,290,96,1,0,Math.PI),new THREE.MeshBasicMaterial({map:rbTex,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,fog:false}));
    { const uv=rainbow.geometry.attributes.uv, pos=rainbow.geometry.attributes.position; for(let i=0;i<pos.count;i++){ const r=Math.hypot(pos.getX(i),pos.getY(i)); uv.setXY(i,.5,(r-250)/40); } }
    scene.add(rainbow);
    // rain
    const RMAX=7000; const rp=new Float32Array(RMAX*6); for(let i=0;i<RMAX;i++){ const x=(Math.random()-.5)*110, y=Math.random()*60, z=(Math.random()-.5)*110; rp.set([x,y,z,x,y-1,z],i*6); }
    const rg=new THREE.BufferGeometry(); rg.setAttribute("position",new THREE.BufferAttribute(rp,3)); rg.setDrawRange(0,0);
    const rain=new THREE.LineSegments(rg,new THREE.LineBasicMaterial({color:0xD8E6F2,transparent:true,opacity:.5,depthWrite:false})); rain.frustumCulled=false; scene.add(rain);
    // sailboats
    const boats=[]; const sailCols=[0xFFFFFF,0xFFE4E1,0xE6F4FF,0xFFF3C9,0xE9FFE9];
    for(let i=0;i<5;i++){ const b=new THREE.Group();
      const hs=new THREE.Shape(); hs.moveTo(-2,-.8); hs.lineTo(1.3,-.8); hs.quadraticCurveTo(2.7,0,1.3,.8); hs.lineTo(-2,.8); hs.quadraticCurveTo(-2.3,0,-2,-.8);
      const hull=new THREE.Mesh(new THREE.ExtrudeGeometry(hs,{depth:.9,bevelEnabled:true,bevelSize:.12,bevelThickness:.12,bevelSegments:2}),M(i%2?0xFFFFFF:0x2E5E8C,{roughness:.5})); hull.rotation.x=-Math.PI/2; hull.position.y=-.4; b.add(hull);
      const deck=new THREE.Mesh(new THREE.BoxGeometry(3.4,.08,1.4),M(0xC99A68)); deck.position.set(-.2,.56,0); b.add(deck);
      const stripe=new THREE.Mesh(new THREE.BoxGeometry(4.2,.12,1.75),M(i%2?0xE46F8E:0xFFFFFF)); stripe.position.set(-.1,.3,0); stripe.scale.z=1.02; b.add(stripe);
      const mast=new THREE.Mesh(new THREE.CylinderGeometry(.07,.08,5.2,8),M(0xF4EDE2)); mast.position.set(.1,3.1,0); b.add(mast);
      const ms=new THREE.Shape(); ms.moveTo(0,0); ms.lineTo(0,4.4); ms.lineTo(-2.3,0); ms.lineTo(0,0);
      const main=new THREE.Mesh(new THREE.ShapeGeometry(ms),new THREE.MeshStandardMaterial({color:sailCols[i],side:THREE.DoubleSide,roughness:.8})); main.position.set(0,.75,0); b.add(main);
      const js=new THREE.Shape(); js.moveTo(0,0); js.lineTo(0,3.6); js.lineTo(1.9,0); js.lineTo(0,0);
      const jib=new THREE.Mesh(new THREE.ShapeGeometry(js),new THREE.MeshStandardMaterial({color:[0xF6A9BF,0x7EC4CF,0xF3C969,0xA9DDB0,0xB7A9E6][i],side:THREE.DoubleSide,roughness:.8})); jib.position.set(.25,.8,0); b.add(jib);
      const flag=new THREE.Mesh(new THREE.PlaneGeometry(.7,.4),new THREE.MeshBasicMaterial({color:0xE46F8E,side:THREE.DoubleSide})); flag.position.set(.45,5.6,0); b.add(flag);
      shadowy(b); b.scale.setScalar(1.25); b.userData={a:i/5*Math.PI*2+.4, r:128+i*9, sp:(.035+i*.006)*(i%2?1:-1), ph:Math.random()*6, flag};
      scene.add(b); boats.push(b); }
    // weather presets
    const P={
      clear:   {top:0x5FB2E8,bot:0xE3F3FB,fog:0xD9EEF8,fn:200,ff:620,hemi:1.35,sun:1.6,sunV:1,cloud:0xFFFFFF,cOp:.95,cN:5,cSp:.01,rain:0,rSp:0,rSl:0,rLen:0,rOp:0,wave:.35,boats:1,rb:0,wind:.05,sea:0x2F8CB8,bolt:0},
      overcast:{top:0x93A2AE,bot:0xD4DCE2,fog:0xC6CFD6,fn:90,ff:380,hemi:1.0,sun:.45,sunV:0,cloud:0xBFC7CF,cOp:1,cN:10,cSp:.02,rain:0,rSp:0,rSl:0,rLen:0,rOp:0,wave:.55,boats:1,rb:0,wind:.15,sea:0x4D7E96,bolt:0},
      drizzle: {top:0x7F8E9B,bot:0xC0C9D0,fog:0xB4BEC6,fn:60,ff:300,hemi:.88,sun:.3,sunV:0,cloud:0xA9B2BB,cOp:1,cN:10,cSp:.03,rain:1600,rSp:20,rSl:.06,rLen:.7,rOp:.35,wave:.65,boats:1,rb:0,wind:.22,sea:0x456F85,bolt:0},
      downpour:{top:0x58626C,bot:0x8C97A1,fog:0x7F8A94,fn:25,ff:190,hemi:.62,sun:.15,sunV:0,cloud:0x7E8790,cOp:1,cN:10,cSp:.05,rain:6000,rSp:46,rSl:.14,rLen:1.8,rOp:.5,wave:1.1,boats:0,rb:0,wind:.5,sea:0x39596B,bolt:0},
      typhoon: {top:0x353D46,bot:0x66717B,fog:0x606B75,fn:18,ff:140,hemi:.5,sun:.1,sunV:0,cloud:0x5E6670,cOp:1,cN:10,cSp:.22,rain:7000,rSp:62,rSl:.95,rLen:2.4,rOp:.55,wave:2.2,boats:0,rb:0,wind:1,sea:0x2E4A5A,bolt:1},
      rainbow: {top:0x6CB9EA,bot:0xEAF6FC,fog:0xDDEFF7,fn:200,ff:620,hemi:1.3,sun:1.5,sunV:1,cloud:0xFFFFFF,cOp:.9,cN:6,cSp:.012,rain:0,rSp:0,rSl:0,rLen:0,rOp:0,wave:.4,boats:1,rb:1,wind:.08,sea:0x2F8CB8,bolt:0},
    };
    const NIGHT={top:0x0A1430,bot:0x23345A,fog:0x1A2744,sea:0x123A58,cloud:0x4A5570};
    let state={time:"day",wx:"clear"};
    try{ const sv=JSON.parse(localStorage.getItem("island-wx")||"null"); if(sv&&sv.wx==="downpour") sv.wx="drizzle"; if(sv&&P[sv.wx]) state=sv; }catch(e){}   // 傾盆大雨已移除,舊設定改成毛毛雨
    const cur={}, tgt={};
    const C=["top","bot","fog","cloud","sea"];
    function target(){ const p=P[state.wx], n=state.time==="night";
      const dim=(c,k)=>new THREE.Color(c).lerp(new THREE.Color(0x000000),k);
      for(const k in p) tgt[k]=C.includes(k)?new THREE.Color(p[k]):p[k];
      if(n){ const wet=["drizzle","downpour","typhoon","overcast"].includes(state.wx);
        tgt.top=wet?dim(p.top,.72):new THREE.Color(NIGHT.top); tgt.bot=wet?dim(p.bot,.72):new THREE.Color(NIGHT.bot); tgt.fog=wet?dim(p.fog,.74):new THREE.Color(NIGHT.fog);
        tgt.sea=wet?dim(p.sea,.6):new THREE.Color(NIGHT.sea); tgt.cloud=dim(p.cloud,.62); tgt.hemi=p.hemi*.32; tgt.sun=p.sun*.28; tgt.rb=p.rb*.18; }
      tgt.night=n?1:0; tgt.stars=n&&(state.wx==="clear"||state.wx==="rainbow")?1:0; tgt.moonV=n&&!["downpour","typhoon","overcast","drizzle"].includes(state.wx)?1:0; tgt.sunV=n?0:p.sunV; }
    function snap(){ target(); for(const k in tgt) cur[k]=tgt[k] instanceof THREE.Color?tgt[k].clone():tgt[k]; }
    snap();
    function set(part){ Object.assign(state,part); try{ localStorage.setItem("island-wx",JSON.stringify(state)); }catch(e){} target(); ui(); api.onChange&&api.onChange(); }
    function ui(){ document.querySelectorAll("#tod [data-t]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.t===state.time)); document.querySelectorAll("#wx [data-w]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.w===state.wx)); }
    document.querySelectorAll("#tod [data-t]").forEach(b=>b.onclick=()=>set({time:b.dataset.t}));
    document.querySelectorAll("#wx [data-w]").forEach(b=>b.onclick=()=>set({wx:b.dataset.w}));
    ui();
    let flash=0, nextBolt=3, rainShown=0;
    const camAz=()=>Math.atan2(camera.position.x-controls.target.x,camera.position.z-controls.target.z);
    const api={boats, taken:null, foam:1, A:.7, onChange:null, onBolt:null, curState:()=>cur, raining:()=>["drizzle","downpour","typhoon"].includes(state.wx), state:()=>state, wave:()=>api.A, night:()=>cur.night, update(dt,tt){
      const k=Math.min(1,dt*1.6);
      for(const key in tgt){ if(tgt[key] instanceof THREE.Color) cur[key].lerp(tgt[key],k); else cur[key]+=(tgt[key]-cur[key])*k; }
      // sky + fog + lights
      skyU.top.value.copy(cur.top).convertLinearToSRGB(); skyU.bot.value.copy(cur.bot).convertLinearToSRGB();
      sky.position.copy(camera.position);
      scene.fog.color.copy(cur.fog); scene.fog.near=cur.fn; scene.fog.far=cur.ff;
      hemi.intensity=cur.hemi+flash*2.4; hemi.color.setRGB(1,1,1).lerp(new THREE.Color(0x9FB4E8),cur.night*.8);
      hemi.groundColor.set(0xF2D3B6).lerp(new THREE.Color(0x2A3550),cur.night*.8);
      sun.intensity=cur.sun; sun.color.set(0xFFF1E0).lerp(new THREE.Color(0xBFD3FF),cur.night);
      // sun / moon sit low behind the island, opposite the camera, so they stay in frame
      const az=camAz()+Math.PI+.5, el=.16; const D=760;
      const sx=Math.sin(az)*Math.cos(el)*D, sy=Math.sin(el)*D, sz=Math.cos(az)*Math.cos(el)*D;
      sunSpr.position.set(controls.target.x+sx,sy,controls.target.z+sz); sunSpr.material.opacity=cur.sunV;
      moonSpr.position.set(controls.target.x+sx,sy+40,controls.target.z+sz); moonSpr.material.opacity=cur.moonV;
      stars.material.opacity=cur.stars*.95; stars.position.copy(camera.position);
      const raz=camAz()+Math.PI-.35; rainbow.position.set(controls.target.x+Math.sin(raz)*520,-30,controls.target.z+Math.cos(raz)*520); rainbow.lookAt(camera.position.x,-30,camera.position.z); rainbow.material.opacity=cur.rb*.55;
      // ocean uniforms
      const A=cur.wave*2.2;
      seaU.uT.value=tt; seaU.uA.value=A; seaU.uDeep.value.copy(cur.sea).multiplyScalar(.55); seaU.uShal.value.set(0x3FC1C9).lerp(cur.sea,.35).multiplyScalar(1-cur.night*.65);
      seaU.uSky.value.copy(cur.bot).lerp(cur.top,.3); seaU.uNight.value=cur.night;
      seaU.uSun.value.set(sx,sy,sz).normalize(); seaU.uSunI.value=Math.max(cur.sunV,cur.moonV*.35)*(1-flash)+flash*.4; seaU.uSunC.value.set(cur.night>.5?0xCFE0FF:0xFFF1D0);
      api.foam=1-Math.min(.6,cur.night*.5); api.A=A;
      // clouds
      // 雲擋在鏡頭與看的地方之間(或太靠近鏡頭)時,慢慢變透明,不擋視線
      { const cp=camera.position, tg=controls.target, sx=tg.x-cp.x, sy=tg.y-cp.y, sz=tg.z-cp.z, L2=sx*sx+sy*sy+sz*sz||1;
        clouds.forEach(c=>{ const u=c.userData; c.visible=u.k<Math.round(cur.cN); u.a+=dt*cur.cSp; c.position.x=Math.cos(u.a)*u.r; c.position.z=Math.sin(u.a)*u.r;
          const px=c.position.x-cp.x, py=c.position.y-cp.y, pz=c.position.z-cp.z; const t=Math.max(0,Math.min(1,(px*sx+py*sy+pz*sz)/L2)); const d=Math.hypot(px-sx*t,py-sy*t,pz-sz*t);
          let block=(t>0&&t<1&&d<u.rad)||Math.hypot(px,py,pz)<u.rad+12;
          // 也不能擋在鏡頭和任何一座島之間
          if(!block) for(const I of ISL){ const ix=I.c.x-cp.x, iy=TOP-cp.y, iz=I.c.z-cp.z, l2=ix*ix+iy*iy+iz*iz||1; const ti=(px*ix+py*iy+pz*iz)/l2; if(ti<=0||ti>=1) continue; const di=Math.hypot(px-ix*ti,py-iy*ti,pz-iz*ti); if(di<u.rad+I.R*.7*ti){ block=true; break; } } u.f+=((block?0:1)-u.f)*Math.min(1,dt*3);
          u.mat.color.copy(cur.cloud); u.mat.opacity=cur.cOp*u.f; u.mat.depthWrite=u.f>.97; c.visible=c.visible&&u.f>.02; }); }
      // rain
      const n=Math.round(cur.rain); rg.setDrawRange(0,n*2); rain.material.opacity=cur.rOp*(1-cur.night*.35); rain.position.set(controls.target.x,0,controls.target.z);
      if(n>0){ const a=rg.attributes.position.array; const v=cur.rSp*dt, sl=cur.rSl, L=cur.rLen;
        for(let i=0;i<n;i++){ const j=i*6; let x=a[j]+sl*v, y=a[j+1]-v, z=a[j+2]; if(y<-1){ y=40+Math.random()*20; x=(Math.random()-.5)*110; z=(Math.random()-.5)*110; } if(x>55) x-=110;
          a[j]=x; a[j+1]=y; a[j+2]=z; a[j+3]=x-sl*L; a[j+4]=y+L; a[j+5]=z; }
        rg.attributes.position.needsUpdate=true; }
      // lightning in a typhoon
      if(cur.bolt>.5){ nextBolt-=dt; if(nextBolt<=0){ flash=1; nextBolt=2.5+Math.random()*5; api.onBolt&&api.onBolt(); api.onBolt2&&api.onBolt2(); } }
      flash=Math.max(0,flash-dt*3.2); skyU.flash.value=flash*.35;
      // wind in the trees
      trees.forEach(t=>{ const sh=t.userData.shk||0; if(sh>0) t.userData.shk=Math.max(0,sh-dt*.7); t.rotation.z=Math.sin(tt*(1.5+cur.wind*3)+t.userData.ph)*cur.wind*.1+cur.wind*.09+Math.sin(tt*24)*.09*Math.min(1,sh); });
      // boats: sail around, rock on the swell, head for harbour in a storm
      boats.forEach(b=>{ const u=b.userData; u.a+=u.sp*dt*(1+cur.wind); const x=Math.cos(u.a)*u.r, z=Math.sin(u.a)*u.r;
        b.position.set(x,-.75+waveH(x,z,tt,A)+(1-cur.boats)*-8,z);
        const sg=Math.sign(u.sp), dx=-Math.sin(u.a)*sg, dz=Math.cos(u.a)*sg;
        b.rotation.set(Math.sin(tt*1.1+u.ph)*.06*(1+A),Math.atan2(-dz,dx),Math.sin(tt*.9+u.ph)*.05*(1+A*1.5));
        b.visible=cur.boats>.05&&b!==api.taken; u.flag.rotation.y=Math.sin(tt*6+u.ph)*.4; });
      // warm reading lamps at night
      for(const d of Object.values(D3)) if(d.glow) d.glow.intensity=2.2+cur.night*9;
    }};
    return api;
  }

  /* ---------- nurse anesthetist ---------- */
  const NS=1.35; const nurse=buildNurse(); nurse.userData.setLook(LOOK); nurse.userData.nurseHit=true; nurse.scale.setScalar(NS); scene.add(nurse);
  // 模擬手術室(含恢復室)裡:小麻不能自己走出去,要按「🚪 離開模擬手術室」;在裡面不吃零食,垃圾也暫停被海鷗、海龜吃掉
  let leavingOR=false;
  const suiteP=(p)=>{ const R=ISL[3].room; return !!R&&R.inSuiteArea(p); };
  const inSuite=()=>suiteP(nurse.position);
  const orLocked=(to)=>inSuite()&&!leavingOR&&!(to&&suiteP(to));
  const lockMsg=()=>toast("🏥 在模擬手術室裡喔!要出去請按「🚪 離開模擬手術室」");
  function buildNurse(prof){
    const n=new THREE.Group(); const SKIN=0xFFDCC8, SCRUB=0x7EC4CF, SCRUB2=0x63B0BD, CAP=0x5DAE8B;
    const body=new THREE.Group(); n.add(body);
    const cap=(r,len,c)=>new THREE.Mesh(new THREE.CapsuleGeometry(r,len,6,14),M(c));
    // legs + shoes
    const legs=[];
    for(const sx of [-.28,.28]){ const hip=new THREE.Group(); hip.position.set(sx,1.05,0); const lg=cap(.2,.62,SCRUB2); lg.position.y=-.45; hip.add(lg);
      const sh=new THREE.Mesh(new RoundedBoxGeometry(.34,.2,.52,2,.08),M(0xFFFFFF)); sh.position.set(0,-.92,.08); hip.add(sh); body.add(hip); legs.push(hip); }
    // torso (scrub top) with V neck and pocket
    const torso=new THREE.Mesh(new RoundedBoxGeometry(1.15,1.05,.72,4,.28),M(SCRUB)); torso.position.y=1.6; body.add(torso);
    const vneck=new THREE.Mesh(new THREE.CircleGeometry(.2,3),M(SKIN)); vneck.position.set(0,1.98,.365); vneck.rotation.z=-Math.PI/2; vneck.scale.set(1,1.3,1); body.add(vneck);
    const legMeshes=legs.map(h=>h.children[0]), shoes=legs.map(h=>h.children[1]);
    const pocket=new THREE.Mesh(new RoundedBoxGeometry(.3,.26,.04,2,.03),M(SCRUB2)); pocket.position.set(-.3,1.55,.37); body.add(pocket);
    const pen=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.3,6),M(0xE46F8E)); pen.position.set(-.36,1.66,.39); body.add(pen);
    // badge
    const badge=new THREE.Mesh(new THREE.PlaneGeometry(.34,.2),new THREE.MeshBasicMaterial({map:tex(256,150,(g,w,h)=>drawBadge(g,w,h,prof))})); badge.name="badge";   // 名牌:上面是自訂名字,下面是身份 SNA / CRNA
    badge.position.set(-.28,1.32,.37); body.add(badge);
    // neck + head
    const neck=new THREE.Mesh(new THREE.CylinderGeometry(.16,.18,.22,12),M(SKIN)); neck.position.y=2.18; body.add(neck);
    const head=new THREE.Group(); head.position.y=2.78; body.add(head);
    head.add(new THREE.Mesh(new THREE.SphereGeometry(.62,28,20),M(SKIN)));
    // green surgical scrub cap: covers the whole scalp, front edge sits on the forehead, back drops to the nape
    const capAll=new THREE.Group(); head.add(capAll); const capG=new THREE.Group(); capG.rotation.x=-.75; capAll.add(capG);
    const capM=M(CAP,{roughness:.9});
    const capTh=Math.PI*.62, capR=.665;
    const capShell=new THREE.Mesh(new THREE.SphereGeometry(capR,32,20,0,Math.PI*2,0,capTh),capM); capShell.scale.set(1.03,1.06,1.05); capG.add(capShell);
    const band=new THREE.Mesh(new THREE.TorusGeometry(capR*Math.sin(capTh)*1.04,.055,8,40),capM); band.rotation.x=Math.PI/2; band.position.y=capR*Math.cos(capTh)*1.06; band.scale.set(1,1.01,1); capG.add(band);
    for(const sx of [-1,1]){ const tie=new THREE.Mesh(new RoundedBoxGeometry(.09,.38,.03,2,.015),capM); tie.position.set(sx*.08,-.62,-.5); tie.rotation.set(.35,0,sx*.25); capAll.add(tie); }
    const knot=new THREE.Mesh(new THREE.SphereGeometry(.07,10,8),capM); knot.position.set(0,-.46,-.58); capAll.add(knot);
    // painted face decal on the front of the head — expressions are redrawn on this canvas
    const faceTex=tex(512,400,()=>{}); const fcv=faceTex.image, fx=fcv.getContext("2d");
    const face=new THREE.Mesh(new THREE.SphereGeometry(.626,40,30,Math.PI/2-.9,1.8,Math.PI/2-.7,1.4),new THREE.MeshBasicMaterial({map:faceTex,transparent:true,depthWrite:false}));
    face.renderOrder=2; head.add(face);
    const EY=208, LX=154, RX=358, MY=296;
    function drawFace(ex,blink){ const c=fx; c.clearRect(0,0,512,400); c.lineCap="round"; c.lineJoin="round";
      const INK="#2B2230", MOUTH="#8E4A4A";
      const blush=(a)=>{ c.fillStyle=`rgba(247,150,150,${a})`; [108,404].forEach(x=>{ c.beginPath(); c.ellipse(x,MY-6,44,30,0,0,7); c.fill(); }); };
      const oval=(x,rx=33,ry=41,dy=0)=>{ c.fillStyle=INK; c.beginPath(); c.ellipse(x,EY+dy,rx,ry,0,0,7); c.fill(); c.fillStyle="#fff"; c.beginPath(); c.arc(x+rx*.35,EY+dy-ry*.38,rx*.32,0,7); c.fill(); c.beginPath(); c.arc(x-rx*.3,EY+dy+ry*.35,rx*.14,0,7); c.fill(); };
      const closed=(x,up=true)=>{ c.strokeStyle=INK; c.lineWidth=10; c.beginPath(); if(up) c.arc(x,EY+14,30,Math.PI*1.15,Math.PI*1.85); else c.arc(x,EY-16,30,Math.PI*.15,Math.PI*.85); c.stroke(); };
      const line=(x)=>{ c.strokeStyle=INK; c.lineWidth=10; c.beginPath(); c.moveTo(x-28,EY+4); c.quadraticCurveTo(x,EY+14,x+28,EY+4); c.stroke(); };
      const smile=(w=44,d=22,y=MY)=>{ c.strokeStyle=MOUTH; c.lineWidth=9; c.beginPath(); c.moveTo(256-w,y-d*.4); c.quadraticCurveTo(256,y+d*1.4,256+w,y-d*.4); c.stroke(); };
      const frown=(w=36,d=14,y=MY+10)=>{ c.strokeStyle=MOUTH; c.lineWidth=9; c.beginPath(); c.moveTo(256-w,y+d*.5); c.quadraticCurveTo(256,y-d*1.4,256+w,y+d*.5); c.stroke(); };
      const brow=(x,tilt,y=EY-66)=>{ c.strokeStyle=INK; c.lineWidth=9; c.beginPath(); c.moveTo(x-26,y+tilt*(x<256?1:-1)); c.lineTo(x+26,y-tilt*(x<256?1:-1)); c.stroke(); };
      const heart=(x)=>{ c.fillStyle="#E8456B"; c.beginPath(); const y=EY-10, k=1.25; c.moveTo(x,y+30*k); c.bezierCurveTo(x-44*k,y+2*k,x-30*k,y-30*k,x,y-12*k); c.bezierCurveTo(x+30*k,y-30*k,x+44*k,y+2*k,x,y+30*k); c.fill(); c.fillStyle="rgba(255,255,255,.8)"; c.beginPath(); c.arc(x-14,y-8,7,0,7); c.fill(); };
      const open=["smile","surprised","sad","angry","wink"].includes(ex)&&blink;
      if(open){ line(LX); if(ex!=="wink") line(RX); else closed(RX); }
      switch(ex){
        case "laugh": closed(LX); closed(RX); blush(.6);
          c.fillStyle="#7A2E3A"; c.beginPath(); c.moveTo(206,MY-14); c.quadraticCurveTo(256,MY-20,306,MY-14); c.quadraticCurveTo(300,MY+52,256,MY+52); c.quadraticCurveTo(212,MY+52,206,MY-14); c.fill();
          c.fillStyle="#F28C9B"; c.beginPath(); c.ellipse(256,MY+34,26,14,0,0,7); c.fill(); break;
        case "wink": if(!open){ oval(LX); closed(RX); } blush(.55); smile(46,24); c.fillStyle="#F28C9B"; c.beginPath(); c.ellipse(270,MY+20,13,10,0,0,Math.PI); c.fill(); break;
        case "love": heart(LX); heart(RX); blush(.6); smile(50,26); break;
        case "surprised": if(!open){ oval(LX,36,46); oval(RX,36,46); } brow(LX,-6,EY-78); brow(RX,-6,EY-78); blush(.35);
          c.strokeStyle=MOUTH; c.lineWidth=9; c.beginPath(); c.ellipse(256,MY+8,16,22,0,0,7); c.stroke(); break;
        case "shy": c.strokeStyle=INK; c.lineWidth=10; [[LX,1],[RX,-1]].forEach(([x,d])=>{ c.beginPath(); c.moveTo(x-22*d,EY-20); c.lineTo(x+18*d,EY); c.lineTo(x-22*d,EY+20); c.stroke(); });
          blush(.85); c.strokeStyle=MOUTH; c.lineWidth=8; c.beginPath(); for(let i=0;i<=4;i++){ const x=228+i*14, y=MY+(i%2?8:-2); i?c.lineTo(x,y):c.moveTo(x,y); } c.stroke(); break;
        case "sleepy": c.strokeStyle=INK; c.lineWidth=10; [LX,RX].forEach(x=>{ c.beginPath(); c.moveTo(x-30,EY+6); c.quadraticCurveTo(x,EY+22,x+30,EY+6); c.stroke(); }); blush(.35);
          c.strokeStyle=MOUTH; c.lineWidth=8; c.beginPath(); c.ellipse(256,MY+6,12,10,0,0,7); c.stroke();
          c.fillStyle="#5B8FD9"; c.font="bold 54px sans-serif"; c.fillText("z",420,120); c.font="bold 38px sans-serif"; c.fillText("z",462,80); break;
        case "sad": if(!open){ oval(LX,28,34,10); oval(RX,28,34,10); } brow(LX,10,EY-54); brow(RX,10,EY-54); frown();
          c.fillStyle="#7EC8F2"; c.beginPath(); c.moveTo(LX-20,EY+40); c.quadraticCurveTo(LX-36,EY+74,LX-20,EY+80); c.quadraticCurveTo(LX-4,EY+74,LX-20,EY+40); c.fill(); break;
        case "angry": if(!open){ oval(LX,30,36,8); oval(RX,30,36,8); } c.lineWidth=12; brow(LX,-14,EY-46); brow(RX,-14,EY-46); blush(.7); frown(34,12,MY+12);
          c.strokeStyle="#E0475A"; c.lineWidth=6; c.beginPath(); c.moveTo(420,70); c.lineTo(440,90); c.moveTo(440,70); c.lineTo(420,90); c.moveTo(430,62); c.lineTo(430,98); c.stroke(); break;
        default: if(!open){ oval(LX); oval(RX); } blush(.55); smile(); }
      drawTattoo(c); faceTex.needsUpdate=true; }
    // 臉上的小刺青(裝扮):畫在右臉頰(畫面左右看起來在小麻的左臉頰)
    let tatK="none";
    function drawTattoo(c){ const x=0, y=0; c.save(); c.translate(410,250); c.scale(1.45,1.45);
      switch(tatK){
        case "heart": c.fillStyle="#E8456B"; c.beginPath(); c.moveTo(x,y+14); c.bezierCurveTo(x-22,y,x-14,y-16,x,y-6); c.bezierCurveTo(x+14,y-16,x+22,y,x,y+14); c.fill(); break;
        case "star": c.fillStyle="#F2B705"; c.beginPath(); for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, r=i%2?7:17; c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r); } c.closePath(); c.fill(); break;
        case "flower": c.fillStyle="#F28AA6"; for(let i=0;i<5;i++){ const a=i/5*Math.PI*2; c.beginPath(); c.arc(x+Math.cos(a)*9,y+Math.sin(a)*9,8,0,7); c.fill(); } c.fillStyle="#FFD94A"; c.beginPath(); c.arc(x,y,6,0,7); c.fill(); break;
        case "butterfly": c.fillStyle="#7E6BD6"; [[-1,-1],[1,-1]].forEach(([sx])=>{ c.beginPath(); c.ellipse(x+sx*10,y-6,10,13,sx*.5,0,7); c.fill(); c.beginPath(); c.ellipse(x+sx*8,y+9,7,8,-sx*.4,0,7); c.fill(); }); c.fillStyle="#3B3347"; c.fillRect(x-1.5,y-12,3,26); break;
        case "bolt": c.fillStyle="#F2A007"; c.beginPath(); c.moveTo(x+4,y-20); c.lineTo(x-10,y+3); c.lineTo(x,y+3); c.lineTo(x-5,y+20); c.lineTo(x+11,y-4); c.lineTo(x+1,y-4); c.closePath(); c.fill(); break;
        case "dot": c.fillStyle="#4A3A3A"; c.beginPath(); c.arc(x-12,y+2,3.5,0,7); c.fill(); break;
        case "cross": c.fillStyle="#E25B4B"; c.fillRect(x-4,y-13,8,26); c.fillRect(x-13,y-4,26,8); break;
        case "moon": c.fillStyle="#F2C94C"; c.beginPath(); c.arc(x,y,14,0,7); c.fill(); c.globalCompositeOperation="destination-out"; c.beginPath(); c.arc(x+7,y-4,12,0,7); c.fill(); break; }
      c.restore(); }
    let faceEx="smile", blinkT=2.5, blinking=0;
    function setFace(ex){ faceEx=ex; drawFace(faceEx,false); }
    function faceTick(dt){ if(blinking>0){ blinking-=dt; if(blinking<=0) drawFace(faceEx,false); return; } blinkT-=dt; if(blinkT<=0){ blinkT=2.5+Math.random()*3; if(["smile","surprised","sad","angry"].includes(faceEx)){ blinking=.13; drawFace(faceEx,true); } } }
    setFace("smile");
    // stethoscope around the neck
    const steth=new THREE.Group(); body.add(steth);
    const SM=M(0x3B4252,{roughness:.5}), MET=M(0xD7DEE6,{metalness:.7,roughness:.25});
    const tube=(pts,r,mat)=>new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),40,r,8,false),mat);
    // stethoscope worn around the neck: metal binaural U in front of the neck with two ear tips, tubing hanging to the chest piece
    for(const sx of [-1,1]){
      steth.add(tube([[0,1.93,.42],[sx*.12,1.95,.42],[sx*.24,2.0,.38],[sx*.32,2.08,.28],[sx*.34,2.14,.16]],.026,MET));
      const tip=new THREE.Mesh(new THREE.SphereGeometry(.055,12,10),M(0x2B2F38,{roughness:.6})); tip.scale.set(1,1.3,1); tip.position.set(sx*.34,2.17,.14); steth.add(tip);
    }
    const yoke=new THREE.Mesh(new THREE.SphereGeometry(.05,10,8),MET); yoke.position.set(0,1.92,.43); steth.add(yoke);
    steth.add(tube([[0,1.92,.43],[.06,1.78,.46],[.16,1.6,.47],[.26,1.48,.46]],.042,SM));
    const bell=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.07,20),MET); bell.position.set(.29,1.4,.46); bell.rotation.x=Math.PI/2; steth.add(bell);
    const dia=new THREE.Mesh(new THREE.CircleGeometry(.1,20),M(0x2B2F38)); dia.position.set(.29,1.4,.5); steth.add(dia);
    // arms
    const mkArm=(side)=>{ const sh=new THREE.Group(); sh.position.set(side*.68,1.95,0);
      const up=cap(.17,.42,SCRUB); up.position.y=-.3; sh.add(up);
      const fore=new THREE.Group(); fore.position.y=-.55; sh.add(fore);
      const fa=cap(.15,.38,SKIN); fa.position.y=-.24; fore.add(fa);
      const hand=new THREE.Mesh(new THREE.SphereGeometry(.17,14,12),M(SKIN)); hand.position.y=-.52; fore.add(hand);
      body.add(sh); return {sh,fore,hand,up}; };
    const armR=mkArm(-1), armL=mkArm(1); // armR = patient's right = viewer's left when facing camera
    armR.sh.rotation.set(-.95,0,.12); armR.fore.rotation.x=-.75;
    armL.sh.rotation.set(-.85,0,-.12); armL.fore.rotation.x=-.85;
    // endotracheal tube in the right hand
    const ETT=new THREE.Group(); const clear=new THREE.MeshPhysicalMaterial({color:0xCFEAFB,transparent:true,opacity:.78,roughness:.2,clearcoat:1});
    const ettPts=[[0,.55,0],[0,.3,.04],[0,0,.12],[0,-.32,.3],[0,-.55,.56],[0,-.66,.82]];
    ETT.add(tube(ettPts,.036,clear));
    const conM=new THREE.MeshPhysicalMaterial({color:0xF5F7FA,transparent:true,opacity:.92,roughness:.3,clearcoat:.8});
    const con=new THREE.Mesh(new THREE.CylinderGeometry(.054,.049,.18,16),conM); con.position.y=.65; ETT.add(con); // 15 mm connector
    const flange=new THREE.Mesh(new THREE.CylinderGeometry(.085,.085,.025,18),conM); flange.position.y=.57; ETT.add(flange);
    const cuffM=new THREE.MeshPhysicalMaterial({color:0xE4F2FA,transparent:true,opacity:.55,roughness:.35,clearcoat:.6});
    ETT.add(tube([[0,-.34,.32],[0,-.45,.44],[0,-.55,.56],[0,-.6,.66]],.046,cuffM)); // deflated cuff hugging the tube
    ETT.add(tube([[.05,.2,.04],[.18,.1,.02],[.28,.25,0],[.3,.45,0]],.009,clear));
    const pb=new THREE.Mesh(new THREE.SphereGeometry(.07,10,8),clear); pb.scale.set(.75,1.15,.28); pb.position.set(.3,.5,0); ETT.add(pb); // deflated pilot balloon
    // printed depth markings (cm) + size, on the outside of the tube
    const markTex=tex(1024,64,(g,w,h)=>{ g.clearRect(0,0,w,h); g.fillStyle="#1E2430"; g.strokeStyle="#1E2430";
      for(const band of [6,38]){
        for(let k=0;k<=13;k++){ const x=w*(.2+k*.03); const big=k%2===0; g.fillRect(x,band,3,big?20:12); if(big&&k<13){ g.save(); g.font='700 15px "IBM Plex Mono",monospace'; g.fillText(String(30-k),x+5,band+15); g.restore(); } }
        g.font='700 14px "IBM Plex Mono",monospace'; g.fillText("I.D. 7.0",w*.09,band+15);
        g.fillRect(w*.8,band+2,w*.06,2); }
    });
    const marks=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ettPts.map(p=>new THREE.Vector3(...p))),60,.038,12,false),new THREE.MeshBasicMaterial({map:markTex,transparent:true,depthWrite:false}));
    ETT.add(marks);
    const tipRing=new THREE.Mesh(new THREE.TorusGeometry(.036,.009,6,16),clear); tipRing.position.set(0,-.66,.82); tipRing.rotation.x=1.2; ETT.add(tipRing);
    const valve=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.14,10),M(0xFFFFFF,{roughness:.4})); valve.position.set(.3,.63,0); ETT.add(valve);
    ETT.scale.setScalar(1.0); ETT.position.set(0,-.5,.05); ETT.rotation.set(.9,1.25,.2); armR.fore.add(ETT);
    // Trachway (video intubating stylet) in the left hand: handle + screen + malleable stylet
    const TW=new THREE.Group(); const dark=M(0xF4F6F8,{roughness:.4}); const bezel=M(0x2F3440,{roughness:.5});
    const handle=new THREE.Mesh(new RoundedBoxGeometry(.22,.62,.22,2,.06),dark); TW.add(handle);
    const grip=new THREE.Mesh(new RoundedBoxGeometry(.235,.3,.235,2,.06),M(0xDCE3EA)); grip.position.y=-.08; TW.add(grip);
    const scr=new THREE.Group(); scr.position.set(0,.5,-.02); scr.rotation.x=-.35;
    scr.add(new THREE.Mesh(new RoundedBoxGeometry(.62,.48,.08,2,.04),dark));
    const lcd=new THREE.Mesh(new THREE.PlaneGeometry(.52,.38),new THREE.MeshBasicMaterial({map:tex(256,190,(g,w,h)=>{ const gr=g.createRadialGradient(w/2,h/2,10,w/2,h/2,130); gr.addColorStop(0,"#F6B4A8"); gr.addColorStop(1,"#7A2F2A"); g.fillStyle=gr; g.fillRect(0,0,w,h);
      g.strokeStyle="#FBE3DA"; g.lineWidth=7; g.beginPath(); g.moveTo(w/2-40,h/2+40); g.lineTo(w/2,h/2-30); g.lineTo(w/2+40,h/2+40); g.stroke(); g.fillStyle="#3A1210"; g.beginPath(); g.moveTo(w/2-30,h/2+38); g.lineTo(w/2,h/2-18); g.lineTo(w/2+30,h/2+38); g.fill(); })}));
    const bz=new THREE.Mesh(new THREE.PlaneGeometry(.56,.42),bezel); bz.position.z=.041; scr.add(bz); lcd.position.z=.043; scr.add(lcd); TW.add(scr);
    TW.add(tube([[0,-.3,0],[0,-.52,.01],[0,-.72,.06],[0,-.84,.18],[0,-.88,.3]],.035,MET));
    const tip=new THREE.Mesh(new THREE.SphereGeometry(.05,10,8),MET); tip.position.set(0,-.88,.31); TW.add(tip);
    TW.position.set(0,-.55,.06); TW.rotation.set(1.05,0,-.15); armL.fore.add(TW);
    shadowy(n);
    // umbrella: shaft from her right hand, canopy over her head
    const umb=new THREE.Group(); umb.position.set(-.5,1.25,.35);
    const stripe=tex(512,64,(g,w,h)=>{ for(let i=0;i<8;i++){ g.fillStyle=i%2?"#FFFFFF":"#F28AA6"; g.fillRect(i*w/8,0,w/8,h); } });
    const canopy=new THREE.Mesh(new THREE.ConeGeometry(1.55,.62,8,1,true),new THREE.MeshStandardMaterial({map:stripe,side:THREE.DoubleSide,roughness:.7})); canopy.position.y=2.55; umb.add(canopy);
    const ferrule=new THREE.Mesh(new THREE.SphereGeometry(.06,8,6),M(0xF28AA6)); ferrule.position.y=2.9; umb.add(ferrule);
    const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,2.6,8),M(0xD8DDE3,{metalness:.6,roughness:.3})); shaft.position.y=1.25; umb.add(shaft);
    const hook=new THREE.Mesh(new THREE.TorusGeometry(.09,.035,6,14,Math.PI),M(0x8A5A3A)); hook.position.set(.09,-.04,0); hook.rotation.z=Math.PI; umb.add(hook);
    umb.rotation.z=.12; umb.scale.setScalar(.001); umb.visible=false; body.add(umb);
    /* ---- off-duty outfits ---- */
    const skinM=M(SKIN), scrubM=torso.material, scrub2M=legMeshes[0].material, shoeM=shoes[0].material;
    const swimT=tex(256,256,(c,w,h)=>{ c.fillStyle="#FF6F91"; c.fillRect(0,0,w,h); c.fillStyle="#FFFFFF"; for(let y=10;y<h;y+=36) for(let x=(y/36%2)*18+8;x<w;x+=36){ c.beginPath(); c.arc(x,y,7,0,7); c.fill(); } });
    const swimM=new THREE.MeshStandardMaterial({map:swimT,roughness:.45});
    const floralT=tex(256,256,(c,w,h)=>{ c.fillStyle="#1E9FB5"; c.fillRect(0,0,w,h);
      const leaf=(x,y,r)=>{ c.fillStyle="#2E8B57"; c.save(); c.translate(x,y); c.rotate(r); c.beginPath(); c.ellipse(0,0,26,9,0,0,7); c.fill(); c.restore(); };
      const flower=(x,y,col,s)=>{ c.fillStyle=col; for(let i=0;i<5;i++){ const a=i/5*Math.PI*2; c.beginPath(); c.ellipse(x+Math.cos(a)*14*s,y+Math.sin(a)*14*s,13*s,9*s,a,0,7); c.fill(); } c.fillStyle="#FFD94A"; c.beginPath(); c.arc(x,y,5*s,0,7); c.fill(); };
      [[40,40],[170,60],[100,140],[220,170],[40,210],[150,230]].forEach(([x,y],i)=>{ leaf(x+22,y+14,i); leaf(x-20,y-12,i+2); flower(x,y,i%2?"#FFFFFF":"#FF7A8A",1.1); });
      [[110,30],[230,100],[20,120],[190,240]].forEach(([x,y])=>flower(x,y,"#FFB347",.7)); });
    const floralM=new THREE.MeshStandardMaterial({map:floralT,roughness:.7});
    const sandalM=M(0x9C6A3E,{roughness:.6});
    const trunks=[], shorts=[], feet=[];
    legs.forEach(h=>{ const t=new THREE.Mesh(new THREE.CylinderGeometry(.235,.225,.3,14),M(0x2B4C7E,{roughness:.5})); t.position.y=-.1; t.visible=false; h.add(t); trunks.push(t);
      const sh2=new THREE.Mesh(new THREE.CylinderGeometry(.25,.235,.46,14),M(0xD9C08A,{roughness:.8})); sh2.position.y=-.18; sh2.visible=false; h.add(sh2); shorts.push(sh2);
      const f=new THREE.Mesh(new RoundedBoxGeometry(.26,.14,.4,2,.06),skinM); f.position.set(0,-.94,.08); f.visible=false; h.add(f); feet.push(f); });
    // swim cap + goggles resting on the forehead
    const shades=new THREE.Group(); shades.visible=false; head.add(shades);
    { const lensM=new THREE.MeshPhysicalMaterial({color:0x1A1A22,roughness:.08,metalness:.3,clearcoat:1}), frameM=M(0xE46F8E,{roughness:.4});
      for(const sx of [-.21,.21]){ const fr=new THREE.Mesh(new THREE.TorusGeometry(.15,.03,8,24),frameM); fr.scale.y=.82; fr.position.set(sx,.06,.565); fr.rotation.y=sx*.35; shades.add(fr);
        const ln=new THREE.Mesh(new THREE.CircleGeometry(.145,24),lensM); ln.scale.y=.82; ln.position.set(sx,.06,.57); ln.rotation.y=sx*.35; shades.add(ln);
        const arm=new THREE.Mesh(new THREE.BoxGeometry(.03,.03,.5),frameM); arm.position.set(sx*2.55,.08,.32); arm.rotation.y=sx*-.35; shades.add(arm); }
      const br=new THREE.Mesh(new THREE.TorusGeometry(.06,.022,6,12,Math.PI),frameM); br.position.set(0,.09,.6); shades.add(br); }
    const swimCap=new THREE.Group(); swimCap.visible=false; head.add(swimCap);
    { const sc=new THREE.Mesh(new THREE.SphereGeometry(.655,32,20,0,Math.PI*2,0,Math.PI*.56),M(0x3FA9F5,{roughness:.35})); sc.rotation.x=-.55; sc.scale.set(1.03,1.06,1.05); swimCap.add(sc);
      const strap=new THREE.Mesh(new THREE.TorusGeometry(.68,.035,8,40),M(0x23395B,{roughness:.5})); strap.rotation.x=Math.PI/2-.62; strap.position.y=.16; swimCap.add(strap);
      for(const sx of [-.2,.2]){ const fr=new THREE.Mesh(new THREE.TorusGeometry(.12,.035,8,20),M(0xFF6F91,{roughness:.4})); fr.position.set(sx,.42,.47); fr.rotation.x=-.75; swimCap.add(fr);
        const ln=new THREE.Mesh(new THREE.CircleGeometry(.11,20),new THREE.MeshPhysicalMaterial({color:0x6FD3FF,metalness:.6,roughness:.08,clearcoat:1})); ln.position.set(sx,.425,.475); ln.rotation.x=-.75; ln.translateZ(.015); swimCap.add(ln); }
      const br=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.16,8),M(0xFF6F91)); br.rotation.z=Math.PI/2; br.position.set(0,.43,.5); swimCap.add(br); }
    // straw hat + flower lei
    const hat=new THREE.Group(); hat.visible=false; head.add(hat);
    { const straw=M(0xE9C97C,{roughness:.9}); const crown=new THREE.Mesh(new THREE.CylinderGeometry(.5,.66,.46,28),straw); crown.position.y=.5; hat.add(crown);
      const brim=new THREE.Mesh(new THREE.CylinderGeometry(1.08,1.12,.05,40),straw); brim.position.y=.28; hat.add(brim);
      const bd=new THREE.Mesh(new THREE.CylinderGeometry(.6,.645,.12,28),M(0xE2474B,{roughness:.6})); bd.position.y=.36; hat.add(bd);
      const hib=new THREE.Mesh(new THREE.SphereGeometry(.1,10,8),M(0xFF7A8A)); hib.position.set(.5,.4,.32); hat.add(hib); hat.rotation.x=-.12; }
    const lei=new THREE.Group(); lei.visible=false; body.add(lei);
    { const cols=[0xFF7A8A,0xFFD94A,0xFFFFFF,0xFFB347,0xB57EDC]; for(let i=0;i<18;i++){ const a=i/18*Math.PI*2; const f=new THREE.Mesh(new THREE.SphereGeometry(.075,8,6),M(cols[i%5],{roughness:.6})); f.position.set(Math.cos(a)*.42,0,Math.sin(a)*.36); lei.add(f); }
      lei.position.set(0,1.98,.06); lei.rotation.x=.38; }
    /* ---- 裝扮:手術帽顏色、手術衣顏色、飾品、臉上刺青(存在 localStorage 的 island-look) ---- */
    const ACC={}, accM=(c,o)=>M(c,{roughness:.45,...(o||{})});
    { const bow=new THREE.Group(); const bm=accM(0xE8456B); for(const sx of [-1,1]){ const w=new THREE.Mesh(new THREE.ConeGeometry(.13,.26,10),bm); w.rotation.z=sx*Math.PI/2; w.position.x=sx*.13; bow.add(w); }
      bow.add(new THREE.Mesh(new THREE.SphereGeometry(.07,10,8),bm)); bow.position.set(.36,.5,.3); bow.rotation.set(-.5,.5,.3); capAll.add(bow); ACC.bow=bow; }
    { const fl=new THREE.Group(); [0xFFFFFF,0xFFFFFF,0xFFFFFF,0xFFFFFF,0xFFFFFF].forEach((c,i)=>{ const a=i/5*Math.PI*2, pt=new THREE.Mesh(new THREE.SphereGeometry(.075,8,6),accM(0xFFB6C9)); pt.scale.set(1,1,.45); pt.position.set(Math.cos(a)*.09,Math.sin(a)*.09,0); fl.add(pt); });
      const cn=new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),accM(0xFFD94A)); cn.position.z=.02; fl.add(cn); fl.position.set(-.42,.36,.42); fl.rotation.set(-.3,-.7,0); capAll.add(fl); ACC.flower=fl; }
    { const gl=new THREE.Group(), fm=accM(0x3B3347,{roughness:.3}), lm=new THREE.MeshPhysicalMaterial({color:0xE8F4FF,transparent:true,opacity:.25,roughness:.05});
      for(const sx of [-.21,.21]){ const fr=new THREE.Mesh(new THREE.TorusGeometry(.13,.018,6,24),fm); fr.position.set(sx,.0,.6); fr.rotation.y=sx*.35; gl.add(fr); const ln=new THREE.Mesh(new THREE.CircleGeometry(.125,20),lm); ln.position.set(sx,0,.602); ln.rotation.y=sx*.35; gl.add(ln);
        const arm=new THREE.Mesh(new THREE.BoxGeometry(.02,.02,.45),fm); arm.position.set(sx*2.6,.02,.36); arm.rotation.y=sx*-.3; gl.add(arm); }
      const br=new THREE.Mesh(new THREE.TorusGeometry(.05,.015,6,12,Math.PI),fm); br.position.set(0,.03,.63); gl.add(br); head.add(gl); ACC.glasses=gl; }
    { const er=new THREE.Group(); for(const sx of [-1,1]){ const pr=new THREE.Mesh(new THREE.SphereGeometry(.055,10,8),M(0xFFF8EE,{roughness:.15,metalness:.2})); pr.position.set(sx*.6,-.24,.06); er.add(pr); } head.add(er); ACC.earring=er; }
    { const mk=new THREE.Group(); const mm=M(0x8FC3E8,{roughness:.8,side:THREE.DoubleSide});
      const sh=new THREE.Mesh(new THREE.SphereGeometry(.645,30,10,Math.PI/2-.85,1.7,Math.PI/2+.08,.52),mm); mk.add(sh);
      head.add(mk); ACC.mask=mk; }
    { const nk=new THREE.Group(); for(let i=0;i<20;i++){ const a=Math.PI*.15+i/19*Math.PI*.7; const pr=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),M(0xF5E6C8,{roughness:.2,metalness:.3})); pr.position.set(Math.cos(a)*.3,-Math.sin(a)*.16,.0); nk.add(pr); }
      nk.position.set(0,2.04,.36); nk.rotation.x=.25; body.add(nk); ACC.necklace=nk; }
    { const hp=new THREE.Group(); const hm=M(0xF2C94C,{metalness:.6,roughness:.25}); const st=new THREE.Mesh(new THREE.OctahedronGeometry(.12),hm); hp.add(st); hp.position.set(.42,.3,.44); hp.rotation.set(0,.7,0); capAll.add(hp); ACC.star=hp; }
    Object.values(ACC).forEach(a=>{ a.visible=false; shadowy(a); });
    const LK={cap:"green",scrub:"teal",acc:[],tat:"none"}; let goldCap=false, shadesOn=false;
    const capPat={}; const capTex=(k,base)=>capPat[k]||(capPat[k]=tex(256,128,(c,w,h)=>{ c.fillStyle=base; c.fillRect(0,0,w,h);
      if(k==="dots"){ c.fillStyle="#FFFFFF"; for(let y=8;y<h;y+=22) for(let x=(y/22%2)*11+6;x<w;x+=22){ c.beginPath(); c.arc(x,y,4.5,0,7); c.fill(); } }
      else if(k==="hearts"){ c.fillStyle="#E8456B"; for(let y=12;y<h;y+=28) for(let x=(y/28%2)*14+10;x<w;x+=28){ c.beginPath(); c.moveTo(x,y+7); c.bezierCurveTo(x-10,y,x-6,y-8,x,y-3); c.bezierCurveTo(x+6,y-8,x+10,y,x,y+7); c.fill(); } }
      else if(k==="stars"){ c.fillStyle="#FFE27A"; for(let y=12;y<h;y+=26) for(let x=(y/26%2)*13+8;x<w;x+=26){ c.beginPath(); for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, r=i%2?2.6:6.5; c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r); } c.fill(); } } }));
    function paintCap(){ const C=LOOK_CAPS[LK.cap]||LOOK_CAPS.green; capM.map=null; capM.metalness=0; capM.roughness=.9;
      if(goldCap){ capM.color.set(0xE9C25A); capM.metalness=.7; capM.roughness=.25; }
      else if(C.pat){ capM.color.set(0xFFFFFF); capM.map=capTex(LK.cap,C.css); } else capM.color.set(C.c);
      capM.needsUpdate=true; }
    function setLook(L){ L=lookClean(L); Object.assign(LK,L); const S=LOOK_SCRUBS[LK.scrub]||LOOK_SCRUBS.teal; scrubM.color.set(S.c); scrub2M.color.set(S.c2); paintCap();
      for(const k in ACC) ACC[k].visible=LK.acc.includes(k)&&!(k==="glasses"&&shadesOn);
      tatK=LK.tat; drawFace(faceEx,false); }
    let outfitK="scrub";
    function setOutfit(k){ outfitK=k; const sw=k==="swim", hw=k==="hawaii", sc=!sw&&!hw;
      capAll.visible=sc; steth.visible=sc; badge.visible=sc; pen.visible=sc; pocket.visible=sc; vneck.visible=!sw;
      torso.material=sw?swimM:hw?floralM:scrubM; [armR.up,armL.up].forEach(u=>u.material=sw?skinM:hw?floralM:scrubM);
      legMeshes.forEach(l=>l.material=sc?scrub2M:skinM);
      shoes.forEach(x=>{ x.visible=!sw; x.material=hw?sandalM:shoeM; x.scale.y=hw?.45:1; x.position.y=hw?-.98:-.92; });
      feet.forEach(f=>f.visible=sw); trunks.forEach(t=>t.visible=sw); shorts.forEach(t=>t.visible=hw);
      swimCap.visible=sw; hat.visible=hw; lei.visible=hw; ETT.visible=sc; TW.visible=sc; }
    const setCap=(g)=>{ goldCap=!!g; paintCap(); };
    pocket.material=scrub2M; [armR.up,armL.up].forEach(u=>u.material=scrubM); legMeshes.forEach(l=>l.material=scrub2M);
    n.userData={body,legs,armR,armL,head,umb,ETT,TW,setShades:(v)=>{ shades.visible=v; shadesOn=!!v; ACC.glasses.visible=LK.acc.includes("glasses")&&!shadesOn; },setOutfit,setFace,faceTick,setCap,setLook,get look(){ return {...LK,acc:[...LK.acc]}; },get face(){ return faceEx; },get outfit(){ return outfitK; }};
    return n;
  }


  /* ================= 麻醉機、海星、貝殼、寄居蟹、海鷗、跳出海面的海洋生物 ================= */
  const HUT=(()=>{ const pos=new THREE.Vector3(0,TOP,-.6); const S=1.65;   // 島中央的麻醉工作站(依醫院實機外型;下雨時小麻躲到右側鍵盤架下)
    const g=new THREE.Group(); g.position.copy(pos); g.rotation.y=0; g.scale.setScalar(S);
    const W0=M(0xF4F5F6,{roughness:.38}), W1=M(0xE3E6E9,{roughness:.42}), GR=M(0xB9BEC4,{roughness:.4}), DK=M(0x2C3138,{roughness:.45}), BLK=M(0x15181C,{roughness:.5}), steel=M(0xC3C8CE,{roughness:.25,metalness:.7});
    const glass=new THREE.MeshPhysicalMaterial({color:0xFFFFFF,roughness:.05,transmission:.9,transparent:true,opacity:.28,thickness:.1});
    const box=(w,h,d,m,x,y,z,r=.08,par=g)=>{ const o=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,3,Math.min(r,w/2-.001,h/2-.001,d/2-.001)),m); o.position.set(x,y,z); par.add(o); return o; };
    const cyl=(rt,rb,h,m,x,y,z,seg=18,par=g)=>{ const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),m); o.position.set(x,y,z); par.add(o); return o; };
    const screen=(w,h,draw)=>new THREE.MeshBasicMaterial({map:tex(Math.round(w*256),Math.round(h*256),draw)});
    /* ---- 底座:四支腳 + 大輪子 ---- */
    [[-1.25,1.05],[1.25,1.05],[-1.0,-.95],[1.0,-.95]].forEach(([x,z])=>{ const L=Math.hypot(x,z); const leg=box(L,.22,.34,W1,x/2,.42,z/2,.1); leg.rotation.y=-Math.atan2(z,x); leg.rotation.z=.06;
      const fork=box(.2,.32,.3,GR,x,.34,z,.06); const wh=cyl(.24,.24,.16,DK,x,.24,z+.04,20); wh.rotation.x=Math.PI/2; wh.rotation.z=Math.PI/2; const hub=cyl(.1,.1,.18,steel,x,.24,z+.04,12); hub.rotation.z=Math.PI/2; });
    box(.7,.5,.6,W1,0,.62,0,.12);
    /* ---- 下層三格抽屜櫃 ---- */
    box(2.2,1.5,1.7,W0,0,1.35,0,.16);
    for(let i=0;i<3;i++){ const y=1.82-i*.48; box(2.1,.03,.02,GR,0,y-.22,.86,.01); box(.9,.05,.04,W1,0,y+.1,.86,.02); }
    /* ---- 主工作檯 + 前方 O2+ 快速充氧鈕 ---- */
    box(2.5,.22,1.95,W0,.15,2.2,.12,.1);
    box(2.4,.32,.2,W1,.15,1.98,1.05,.08);
    const o2=cyl(.13,.13,.06,M(0xFFFFFF,{roughness:.3}),-.65,2.0,1.16,24); o2.rotation.x=Math.PI/2;
    const o2r=new THREE.Mesh(new THREE.TorusGeometry(.13,.03,8,24),M(0x2FA35A,{roughness:.3})); o2r.position.set(-.65,2.0,1.18); g.add(o2r);
    /* ---- 左側風箱模組:刻度透明罩 + 黑色風箱 + APL 旋鈕 ---- */
    box(1.25,.75,1.55,W0,-1.75,1.78,.12,.12);
    box(1.25,.12,1.55,W1,-1.75,2.2,.12,.06);
    const scale=tex(256,256,(c,w,h)=>{ c.fillStyle="rgba(225,240,250,.55)"; c.fillRect(0,0,w,h); c.fillStyle="rgba(255,255,255,.35)"; c.fillRect(0,0,14,h); c.fillRect(120,0,8,h); c.fillStyle="rgba(20,20,20,.95)"; c.font="bold 22px sans-serif"; [300,600,900,1200,1500].forEach((v,i)=>{ const y=34+i*40; c.fillRect(40,y,26,3); c.fillText(v,72,y+8); }); });
    const hous=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,1.1,32,1,true),new THREE.MeshPhysicalMaterial({map:scale,color:0xA9D2EE,roughness:.15,clearcoat:1,transparent:true,opacity:.42,side:THREE.DoubleSide,depthWrite:false,emissive:0x355A75,emissiveIntensity:.25})); hous.position.set(-1.75,2.82,.25); hous.rotation.y=2.75; g.add(hous);
    { const rim=new THREE.Mesh(new THREE.TorusGeometry(.51,.045,10,40),M(0xD5DCE2,{roughness:.3})); rim.rotation.x=Math.PI/2; rim.position.set(-1.75,3.37,.25); g.add(rim); } cyl(.55,.55,.1,DK,-1.75,2.29,.25,32);
    const bellows=new THREE.Group(); bellows.name="bellows"; for(let i=0;i<7;i++){ const r=new THREE.Mesh(new THREE.TorusGeometry(.36,.055,8,24),BLK); r.rotation.x=Math.PI/2; r.position.y=i*.11; bellows.add(r); }
    bellows.position.set(-1.75,2.36,.25); g.add(bellows); { const band=new THREE.Mesh(new THREE.CylinderGeometry(.53,.53,.16,40,1,true),M(0xD5DCE2,{roughness:.3,side:THREE.DoubleSide})); band.position.set(-1.75,2.36,.25); g.add(band);
      const hl=new THREE.Mesh(new THREE.PlaneGeometry(.06,.95),new THREE.MeshBasicMaterial({color:0xFFFFFF,transparent:true,opacity:.55,depthWrite:false})); hl.position.set(-1.75+.28,2.85,.25+.43); hl.rotation.y=.55; g.add(hl);
      const hl2=hl.clone(); hl2.position.set(-1.75-.34,2.85,.25+.39); hl2.rotation.y=-.7; hl2.scale.x=.6; g.add(hl2); }
    /* ---- 上方框架:Air / O2 旋鈕、揮發罐(SEV 黃、Des 深灰)、輔助流量管 ---- */
    box(2.3,2.2,.5,W1,.15,3.35,-.62,.1);                 // back panel
    box(.32,2.2,1.0,W0,-.86,3.35,-.38,.1); box(.32,2.2,1.0,W0,1.16,3.35,-.38,.1);   // side pillars
    box(2.34,.62,1.05,W0,.15,4.42,-.36,.14);              // header
    box(2.0,.12,.05,BLK,.15,4.62,.17,.04);
    [[0xF2C230,-.15],[0x2FA35A,.45]].forEach(([c,x])=>{ const k=cyl(.15,.15,.1,M(0xF7F7F7,{roughness:.3}),x,4.32,.18,24); k.rotation.x=Math.PI/2; const r=new THREE.Mesh(new THREE.TorusGeometry(.16,.035,8,24),M(c,{roughness:.3})); r.position.set(x,4.32,.22); g.add(r); });
    // back bar + two vaporizers
    box(1.6,.14,.2,GR,.15,3.85,-.3,.04);
    const sev=new THREE.Group(); sev.position.set(-.3,3.15,-.1); g.add(sev);
    box(.62,1.1,.62,W0,0,0,0,.08,sev); box(.62,.18,.64,W1,0,.6,0,.06,sev);
    box(.34,.32,.08,M(0xF2C230,{roughness:.4}),.0,-.22,.31,.04,sev); cyl(.08,.08,.08,M(0x9C8A62),0,-.22,.37,14,sev).rotation.x=Math.PI/2;
    const lab=new THREE.Mesh(new THREE.PlaneGeometry(.26,.12),screen(.5,.25,(c,w,h)=>{ c.fillStyle="#F2C230"; c.fillRect(0,0,w,h); c.fillStyle="#7A3A00"; c.font="bold 44px sans-serif"; c.textAlign="center"; c.textBaseline="middle"; c.fillText("SEV",w/2,h/2+2); })); lab.position.set(.15,.28,.315); sev.add(lab);
    const dial=cyl(.22,.22,.12,M(0xE9EAEC,{roughness:.35}),0,.72,0,24,sev);
    const des=new THREE.Group(); des.position.set(.48,3.15,-.1); g.add(des);
    box(.66,1.15,.66,DK,0,0,0,.08,des); box(.66,.2,.68,M(0x3E454E,{roughness:.4}),0,.62,0,.06,des);
    const dscr=new THREE.Mesh(new THREE.PlaneGeometry(.36,.22),screen(.6,.36,(c,w,h)=>{ c.fillStyle="#0B1522"; c.fillRect(0,0,w,h); c.fillStyle="#5BD1F0"; c.font="bold 40px sans-serif"; c.fillText("6.0",14,58); c.fillStyle="#9fb"; c.font="18px sans-serif"; c.fillText("DES  %",14,84); })); dscr.position.set(0,.1,.335); des.add(dscr);
    const dlab=new THREE.Mesh(new THREE.PlaneGeometry(.34,.08),screen(.6,.14,(c,w,h)=>{ c.fillStyle="#2F6FD0"; c.fillRect(0,0,w,h); c.fillStyle="#fff"; c.font="bold 26px sans-serif"; c.textAlign="center"; c.textBaseline="middle"; c.fillText("DESFLURANE",w/2,h/2+1); })); dlab.position.set(0,-.18,.335); des.add(dlab);
    // aux O2 flowtube on the right pillar + green button
    const ft=cyl(.06,.06,.55,glass,1.16,3.95,.14,12); cyl(.045,.045,.06,M(0x2FA35A),1.16,3.8,.14,10); box(.2,.7,.06,W1,1.16,3.95,.1,.03);
    const gb=cyl(.07,.07,.05,M(0x2FA35A,{emissive:0x1A6B3A,emissiveIntensity:.6}),1.16,2.75,.14,16); gb.rotation.x=Math.PI/2;
    // small shelf with tape rolls under the vaporizers
    box(1.75,.06,.75,W1,.15,2.55,0,.03);
    [[-.1,0x3BA7D9],[.25,0x3BA7D9],[.55,0xF4F4F4]].forEach(([x,c])=>{ const t=new THREE.Mesh(new THREE.TorusGeometry(.09,.04,8,16),M(c)); t.position.set(x,2.65,.1); g.add(t); });
    box(.5,.22,.4,BLK,-.5,2.69,.05,.04);
    /* ---- 頂層:模組架 ---- */
    box(2.0,.16,1.1,W0,.15,4.82,-.35,.06);
    box(1.85,.7,.95,W0,.3,5.25,-.4,.08);
    [[-.4,0x9E6BD6],[-.08,0xE0623A],[.24,0x6A5ACD],[.56,0xF2C230]].forEach(([x,c])=>{ box(.28,.62,.12,M(0xF9FAFB,{roughness:.3}),x,5.22,.1,.03); cyl(.07,.07,.05,M(c),x,5.12,.17,14).rotation.x=Math.PI/2; });
    /* ---- 左上大病人監視器(含支臂) ---- */
    const pole=cyl(.07,.07,3.4,steel,-1.15,4.45,-.75,10);
    const arm1=box(1.0,.14,.14,steel,-1.6,5.75,-.55,.05); arm1.rotation.y=-.5;
    const pm=new THREE.Group(); pm.position.set(-2.15,5.95,-.15); pm.rotation.y=.32; g.add(pm);
    box(2.1,1.6,.18,W0,0,0,0,.12,pm);
    const pmT=screen(1.85,1.3,(c,w,h)=>{ c.fillStyle="#04070A"; c.fillRect(0,0,w,h);
      const wave=(y,col,f)=>{ c.strokeStyle=col; c.lineWidth=3; c.beginPath(); for(let x=10;x<w*.66;x++) c.lineTo(x,y+f(x)); c.stroke(); };
      wave(h*.22,"#3BE06B",x=>{ const p=(x%70)/70; return p>.4&&p<.44?-34:p>.44&&p<.48?14:0; });
      wave(h*.5,"#4F8FF2",x=>-Math.max(0,Math.sin((x%46)/46*Math.PI*2))*22);
      c.fillStyle="#3BE06B"; c.font="bold 70px sans-serif"; c.fillText("63",w*.72,h*.27);
      c.fillStyle="#4F8FF2"; c.fillText("100",w*.7,h*.55);
      c.fillStyle="#F04848"; c.font="bold 46px sans-serif"; c.fillText("118/72",w*.66,h*.8); c.font="bold 30px sans-serif"; c.fillText("(88)",w*.75,h*.9);
      c.fillStyle="#4F8FF2"; c.font="bold 40px sans-serif"; c.fillText("39",w*.5,h*.82);
      c.fillStyle="#2A3A4A"; c.fillRect(0,h*.93,w,h*.07); });
    const pms=new THREE.Mesh(new THREE.PlaneGeometry(1.85,1.3),pmT); pms.position.z=.095; pms.position.y=.06; pm.add(pms);
    /* ---- 左側呼吸器螢幕 ---- */
    const vm=new THREE.Group(); vm.position.set(-1.95,4.2,.35); vm.rotation.y=.35; g.add(vm);
    box(1.35,1.2,.14,W0,0,0,0,.1,vm);
    const vmT=screen(1.15,.92,(c,w,h)=>{ c.fillStyle="#0A1420"; c.fillRect(0,0,w,h); c.strokeStyle="#F5D24A"; c.lineWidth=3;
      [.25,.48].forEach(f=>{ c.beginPath(); for(let x=50;x<w*.72;x++){ const p=(x%90)/90; c.lineTo(x,h*f-(p<.35?28:p<.42?28*(1-(p-.35)/.07):0)); } c.stroke(); });
      c.strokeStyle="#7FD0F0"; c.beginPath(); for(let x=50;x<w*.72;x++){ const p=(x%90)/90; c.lineTo(x,h*.72-(p<.08?24*p/.08:p<.5?24:p<.56?24*(1-(p-.5)/.06):0)); } c.stroke();
      c.fillStyle="#9AC2F0"; c.fillRect(12,h*.2,10,h*.55); c.fillStyle="#3BE06B"; c.fillRect(30,h*.6,10,h*.15);
      c.fillStyle="#fff"; c.font="bold 34px sans-serif"; c.fillText("45",w*.8,h*.35); c.font="bold 24px sans-serif"; c.fillText("24",w*.82,h*.6);
      c.fillStyle="#5568B8"; c.fillRect(0,h*.84,w,h*.16); c.fillStyle="#fff"; c.font="18px sans-serif"; ["VCV","550","10","1:2","5"].forEach((t,i)=>c.fillText(t,14+i*w/5.2,h*.94)); });
    const vms=new THREE.Mesh(new THREE.PlaneGeometry(1.15,.92),vmT); vms.position.set(0,.06,.075); vm.add(vms);
    for(let i=0;i<4;i++) cyl(.035,.035,.03,GR,-.3+i*.18,-.5,.08,10,vm).rotation.x=Math.PI/2;
    cyl(.08,.08,.05,GR,.5,-.48,.08,16,vm).rotation.x=Math.PI/2;
    /* ---- 右側:鍵盤滑出架 + 電腦螢幕 ---- */
    box(1.7,.12,1.25,W0,2.15,2.22,.45,.08);
    box(.5,.35,.5,W1,1.55,2.0,.3,.06);
    const kb=box(1.05,.05,.36,BLK,1.95,2.31,.45,.02);
    const keys=new THREE.Mesh(new THREE.PlaneGeometry(1.0,.32),screen(1,.32,(c,w,h)=>{ c.fillStyle="#15181C"; c.fillRect(0,0,w,h); c.fillStyle="#3A3F46"; for(let r=0;r<5;r++) for(let k=0;k<16;k++) c.fillRect(4+k*15.6,4+r*15.6,12,12); })); keys.rotation.x=-Math.PI/2; keys.position.set(1.95,2.34,.45); g.add(keys);
    const mouse=new THREE.Mesh(new THREE.SphereGeometry(.1,12,8),BLK); mouse.scale.set(.8,.45,1.2); mouse.position.set(2.75,2.32,.4); g.add(mouse);
    const em=new THREE.Group(); em.position.set(2.45,3.5,.05); em.rotation.y=-.38; g.add(em);
    box(1.7,1.12,.1,M(0xDADDE0,{roughness:.35}),0,0,0,.05,em);
    const emT=screen(1.6,1.0,(c,w,h)=>{ c.fillStyle="#F5F7FA"; c.fillRect(0,0,w,h); c.fillStyle="#2A6FBF"; c.fillRect(0,0,w,26); c.fillStyle="#F3E7A8"; c.fillRect(10,60,w-20,40); c.strokeStyle="#C7CDD5"; for(let r=0;r<6;r++){ c.strokeRect(10,40+r*20,w-20,20); } c.fillStyle="#556"; c.font="12px sans-serif"; for(let r=0;r<6;r++) for(let k=0;k<6;k++) c.fillText("▬▬",16+k*62,54+r*20); });
    const ems=new THREE.Mesh(new THREE.PlaneGeometry(1.6,1.0),emT); ems.position.z=.055; em.add(ems);
    const ea=box(.12,.9,.12,steel,1.75,2.85,-.2,.04);
    /* ---- 右柱掛聽診器 ---- */
    { const cv=new THREE.CatmullRomCurve3([[1.33,3.9,.0],[1.38,3.3,.2],[1.4,2.75,.32],[1.36,2.55,.25],[1.32,3.0,.05],[1.34,3.9,-.05]].map(p=>new THREE.Vector3(...p))); g.add(new THREE.Mesh(new THREE.TubeGeometry(cv,40,.03,8,false),BLK));
      const cp=cyl(.09,.09,.05,steel,1.4,2.45,.3,16); cp.rotation.x=Math.PI/2; }
    /* ---- 風箱側:綠色 APL、吐氣端藍綠色過濾器、藍色螺紋管路、白色儲氣袋支臂 + 綠色儲氣袋、琥珀色鈉石灰罐 ---- */
    const ribs=tex(64,64,(c,w,h)=>{ for(let y=0;y<h;y+=8){ c.fillStyle="#A9D6F2"; c.fillRect(0,y,w,5); c.fillStyle="#5FA6D8"; c.fillRect(0,y+5,w,3); } }); ribs.wrapS=ribs.wrapT=THREE.RepeatWrapping; ribs.repeat.set(1,40);
    const tubeM=new THREE.MeshStandardMaterial({map:ribs,roughness:.4,transparent:true,opacity:.88});
    const ribW=tex(64,64,(c,w,h)=>{ for(let y=0;y<h;y+=8){ c.fillStyle="#FAFAFA"; c.fillRect(0,y,w,5); c.fillStyle="#D8DEE4"; c.fillRect(0,y+5,w,3); } }); ribW.wrapS=ribW.wrapT=THREE.RepeatWrapping; ribW.repeat.set(1,14);
    const ribC=tex(64,64,(c,w,h)=>{ for(let y=0;y<h;y+=8){ c.fillStyle="#F3E7C8"; c.fillRect(0,y,w,5); c.fillStyle="#D9C79E"; c.fillRect(0,y+5,w,3); } }); ribC.wrapS=ribC.wrapT=THREE.RepeatWrapping; ribC.repeat.set(1,40);
    const tube=(pts,r,mat,seg=48)=>{ const cv=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))); const m=new THREE.Mesh(new THREE.TubeGeometry(cv,seg,r,10,false),mat); g.add(m); return m; };
    const teal=M(0x2FA59A,{roughness:.35}), whiteP=M(0xF5F6F7,{roughness:.3});
    // teal APL knob on the module
    { const sideT=tex(256,64,(c,w,h)=>{ c.fillStyle="#2FA59A"; c.fillRect(0,0,w,h); c.fillStyle="#E8FFFA"; for(let i=0;i<24;i++){ const x=i*w/24; c.fillRect(x,h*.15,2,i%4?h*.25:h*.45); } c.font="bold 16px sans-serif"; ["5","10","20","30","40","50","70"].forEach((t,i)=>c.fillText(t,4+i*36,h*.9)); });
      const topT=tex(128,128,(c,w,h)=>{ c.fillStyle="#2FA59A"; c.fillRect(0,0,w,h); c.fillStyle="#FFFFFF"; c.font="bold 30px sans-serif"; c.textAlign="center"; c.fillText("APL",w/2,62); c.font="16px sans-serif"; c.fillText("≈cmH₂O",w/2,86);
        c.strokeStyle="#E8FFFA"; c.lineWidth=3; for(let i=0;i<16;i++){ const a=i/16*Math.PI*2; c.beginPath(); c.moveTo(w/2+Math.cos(a)*54,h/2+Math.sin(a)*54); c.lineTo(w/2+Math.cos(a)*62,h/2+Math.sin(a)*62); c.stroke(); } });
      const apl=new THREE.Mesh(new THREE.CylinderGeometry(.09,.105,.17,28),[new THREE.MeshStandardMaterial({map:sideT,roughness:.35}),new THREE.MeshStandardMaterial({map:topT,roughness:.35}),teal]);
      apl.position.set(-1.36,2.345,.74); g.add(apl); }
    // insp / exp ports on the front of the module
    const portI=cyl(.12,.12,.36,whiteP,-1.45,1.62,1.05,14); portI.rotation.x=Math.PI/2;
    const portE=cyl(.12,.12,.36,whiteP,-2.1,1.62,1.05,14); portE.rotation.x=Math.PI/2;
    const insLab=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.1,14,1,true),M(0x1C2B3A)); insLab.rotation.x=Math.PI/2; insLab.position.set(-1.45,1.62,1.2); g.add(insLab);
    // HME filter (teal disc) on the expiratory port
    { const hme=new THREE.Group(); hme.position.set(-2.1,1.62,1.3); g.add(hme);
      const d=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.14,28),new THREE.MeshPhysicalMaterial({color:0x37C3B4,roughness:.25,transparent:true,opacity:.85,clearcoat:.6})); d.rotation.x=Math.PI/2; hme.add(d);
      const n1=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.22,12),M(0x9FE3DA)); n1.rotation.x=Math.PI/2; n1.position.z=.17; hme.add(n1);
      const n0=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.14,12),M(0x9FE3DA)); n0.rotation.x=Math.PI/2; n0.position.z=-.1; hme.add(n0); }
    // short white corrugated tube from the filter, then the blue limbs down to the Y-piece
    tube([[-2.1,1.62,1.46],[-2.15,1.45,1.8],[-2.35,1.0,1.9],[-2.3,.75,1.75]],.085,new THREE.MeshStandardMaterial({map:ribW,roughness:.4}),24);
    tube([[-2.3,.75,1.75],[-2.1,.5,2.05],[-1.85,.6,2.4],[-1.6,.85,2.55]],.085,tubeM);
    tube([[-1.45,1.62,1.22],[-1.35,1.25,1.55],[-1.4,.75,1.95],[-1.5,.62,2.3],[-1.6,.85,2.55]],.085,tubeM);
    cyl(.1,.08,.28,M(0xF2F2F2,{roughness:.3}),-1.6,1.0,2.6,10);
    // amber CO2 absorber canister below the module
    { const can=cyl(.42,.42,.62,new THREE.MeshPhysicalMaterial({color:0xD89A3C,roughness:.3,transparent:true,opacity:.8}),-1.75,1.06,.35,24);
      const lime=cyl(.36,.36,.45,M(0xF1E1B8,{roughness:.95}),-1.75,1.04,.35,20); cyl(.45,.45,.08,M(0xC8CDD2),-1.75,1.38,.35,24); }
    // white articulated bag arm with a cream corrugated hose, white bag mount and green reservoir bag
    tube([[-2.25,2.12,-.35],[-2.55,2.42,-.55],[-3.15,2.5,-.45],[-3.6,2.35,-.05],[-3.85,2.2,.35]],.1,whiteP,40);
    tube([[-2.25,1.95,-.15],[-2.6,2.22,-.38],[-3.15,2.3,-.3],[-3.55,2.15,.0],[-3.8,2.02,.32]],.07,new THREE.MeshStandardMaterial({map:ribC,roughness:.5}),40);
    { const head=new THREE.Mesh(new RoundedBoxGeometry(.62,.42,.56,3,.1),whiteP); head.position.set(-3.95,2.12,.5); head.rotation.y=-.5; g.add(head);
      const neck=cyl(.12,.12,.22,M(0x1E5FAF,{roughness:.4}),-3.95,1.82,.5,16); cyl(.15,.15,.06,M(0x2E7BD6),-3.95,1.72,.5,16); cyl(.13,.11,.16,M(0x1E3A2E),-3.95,1.62,.5,14);
      const bag=new THREE.Mesh(new THREE.SphereGeometry(.42,22,16),new THREE.MeshPhysicalMaterial({color:0x6FD3B0,roughness:.45,clearcoat:.4})); bag.scale.set(1,1.38,.92); bag.position.set(-3.95,1.0,.5); g.add(bag);
      const hook=new THREE.Mesh(new THREE.TorusGeometry(.12,.025,6,16,Math.PI*1.4),M(0x1A1A1A)); hook.position.set(-3.2,2.2,-.25); g.add(hook);
      const strap=cyl(.115,.115,.14,M(0x151515,{roughness:.9}),-2.95,2.48,-.48,12); strap.rotation.z=Math.PI/2; strap.rotation.y=.3; }
    /* ---- 機器背面:網套黑色氧氣鋼瓶、彩色管線、抽吸罐與調壓錶、操作手冊 ---- */
    { const bk=new THREE.Group(); g.add(bk);
      const cylM=M(0x1B1E22,{roughness:.45,metalness:.3});
      const o2=cyl(.26,.26,1.9,cylM,-1.0,1.25,-1.15,18,bk); const dome=new THREE.Mesh(new THREE.SphereGeometry(.26,16,8,0,Math.PI*2,0,Math.PI/2),cylM); dome.position.set(-1.0,2.2,-1.15); bk.add(dome);
      const netT=tex(128,128,(c,w,h)=>{ c.clearRect(0,0,w,h); c.strokeStyle="rgba(245,245,245,.95)"; c.lineWidth=5; for(let i=-h;i<w;i+=22){ c.beginPath(); c.moveTo(i,0); c.lineTo(i+h,h); c.stroke(); c.beginPath(); c.moveTo(i+h,0); c.lineTo(i,h); c.stroke(); } }); netT.wrapS=netT.wrapT=THREE.RepeatWrapping; netT.repeat.set(3,4);
      const net=new THREE.Mesh(new THREE.CylinderGeometry(.275,.275,1.5,18,1,true),new THREE.MeshStandardMaterial({map:netT,transparent:true,alphaTest:.3,side:THREE.DoubleSide})); net.position.set(-1.0,1.05,-1.15); bk.add(net);
      cyl(.08,.1,.22,steel,-1.0,2.42,-1.15,10,bk); const gg=cyl(.12,.12,.06,M(0xF2F2F2),-.85,2.45,-1.15,16,bk); gg.rotation.z=Math.PI/2;
      // coiled hoses: yellow, green, white, grey
      [[0xF2C230,-1.55,1.0,.5],[0x2FA35A,-1.65,1.2,.45],[0xF5F5F5,-1.45,1.45,.4],[0x9AA1A8,-1.7,1.65,.35]].forEach(([c,x,y,r],i)=>{ const t=new THREE.Mesh(new THREE.TorusGeometry(r,.04,6,28),M(c,{roughness:.5})); t.position.set(x,y,-1.0+i*.04); t.rotation.y=Math.PI/2+.2; bk.add(t); });
      // suction canister (graduated) + regulator gauge + blue tube
      const canT=tex(64,128,(c,w,h)=>{ c.fillStyle="rgba(240,248,255,.55)"; c.fillRect(0,0,w,h); c.fillStyle="#556"; c.font="10px sans-serif"; for(let i=0;i<9;i++){ c.fillRect(6,12+i*12,10,2); c.fillText(1800-i*100,20,16+i*12); } });
      const can=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.9,18),new THREE.MeshPhysicalMaterial({map:canT,transparent:true,opacity:.75,roughness:.15})); can.position.set(.95,.95,-1.2); bk.add(can);
      cyl(.24,.24,.1,M(0xF5F5F5),.95,1.44,-1.2,18,bk); cyl(.24,.24,.06,M(0xF5F5F5),.95,.48,-1.2,18,bk);
      const gauge=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.08,20),new THREE.MeshStandardMaterial({map:tex(64,64,(c,w,h)=>{ c.fillStyle="#fff"; c.fillRect(0,0,w,h); c.strokeStyle="#222"; c.lineWidth=3; c.beginPath(); c.arc(32,32,24,Math.PI*.8,Math.PI*2.2); c.stroke(); c.strokeStyle="#D33"; c.beginPath(); c.moveTo(32,32); c.lineTo(20,16); c.stroke(); })})); gauge.rotation.x=Math.PI/2; gauge.position.set(.95,1.85,-1.32); bk.add(gauge);
      const rim=new THREE.Mesh(new THREE.TorusGeometry(.14,.03,6,20),M(0x1B1E22)); rim.position.set(.95,1.85,-1.28); rim.rotation.y=Math.PI; bk.add(rim);
      box(.14,.3,.14,steel,.95,1.62,-1.25,.03,bk); const valve=box(.12,.06,.06,M(0xD33A2C),1.1,1.6,-1.3,.02,bk);
      { const cv=new THREE.CatmullRomCurve3([[.95,1.5,-1.2],[1.3,1.8,-1.0],[1.5,2.4,-.6],[1.4,2.9,-.3]].map(p=>new THREE.Vector3(...p))); bk.add(new THREE.Mesh(new THREE.TubeGeometry(cv,24,.04,6,false),M(0x2E6FD0,{roughness:.4}))); }
      // operating manual hanging on the back
      const man=new THREE.Mesh(new THREE.BoxGeometry(.75,.95,.05),new THREE.MeshStandardMaterial({map:tex(150,190,(c,w,h)=>{ c.fillStyle="#EEF1F4"; c.fillRect(0,0,w,h); c.fillStyle="#2B3440"; c.font="bold 16px sans-serif"; c.fillText("簡易操作手冊",18,40); c.fillStyle="#B9C2CC"; for(let i=0;i<5;i++) c.fillRect(18,64+i*20,110,8); }),roughness:.6})); man.position.set(-.1,1.2,-.88); man.rotation.set(-.08,Math.PI,0); bk.add(man);
      // vent grille on the back of the tower
      const vent=new THREE.Mesh(new THREE.PlaneGeometry(1.0,.5),new THREE.MeshBasicMaterial({map:tex(128,64,(c,w,h)=>{ c.fillStyle="#DDE1E5"; c.fillRect(0,0,w,h); c.fillStyle="#9AA1A8"; for(let x=6;x<w;x+=8) c.fillRect(x,6,3,h-12); })})); vent.position.set(.4,3.2,-.88); vent.rotation.y=Math.PI; bk.add(vent);
      // cable bundle drooping from the monitor arm
      [[0x1B1E22,0],[0xF5F5F5,.12],[0x6A6F75,.24]].forEach(([c,o])=>{ const cv=new THREE.CatmullRomCurve3([[-1.15+o,5.2,-.8],[-1.25+o,3.9,-1.0],[-.95+o,2.6,-1.1],[-.7+o,1.2,-1.05],[-.5+o,.3,-1.3]].map(p=>new THREE.Vector3(...p))); bk.add(new THREE.Mesh(new THREE.TubeGeometry(cv,40,.025,6,false),M(c,{roughness:.5}))); }); }
    /* ---- 背後管線 ---- */
    [[0x2FA35A,-.4],[0xF2C230,-.1],[0x2F6FD0,.2]].forEach(([c,x])=>{ const cv=new THREE.CatmullRomCurve3([new THREE.Vector3(x,4.0,-.9),new THREE.Vector3(x+.2,2.8,-1.4),new THREE.Vector3(x+.5,1.0,-1.6),new THREE.Vector3(x+.9,.12,-2.3)]); g.add(new THREE.Mesh(new THREE.TubeGeometry(cv,30,.05,8,false),M(c,{roughness:.5}))); });
    // little plate on the top drawer
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(.8,.22),new THREE.MeshBasicMaterial({map:tex(256,70,(c,w,h)=>{ c.fillStyle="#FFFFFF"; c.fillRect(0,0,w,h); c.strokeStyle="#5DAE8B"; c.lineWidth=6; c.strokeRect(3,3,w-6,h-6); c.fillStyle="#2E6E57"; c.font='400 40px "Huninn","Noto Sans TC"'; c.textAlign="center"; c.textBaseline="middle"; c.fillText("麻醉機",w/2,h/2+2); })}));
    sign.position.set(.15,1.98,1.16); g.add(sign);
    const lamp=new THREE.PointLight(0xFFD08A,0,7,2); lamp.position.set(1.0,3.2,1.8); g.add(lamp);
    shadowy(g); scene.add(g);
    { const cp=g.clone(); cp.position.set(0,0,0); cp.rotation.set(0,0,0); cp.scale.setScalar(1); OR.amHolder.add(cp); OR.mountMon(); OR.vent.b=cp.getObjectByName("bellows"); }
    const toWorld=(x,z)=>{ const v=new THREE.Vector3(x*S,0,z*S).applyAxisAngle(up0,g.rotation.y).add(pos); v.y=0; return v; };
    return {pos, g, lamp, bellows, door:toWorld(2.4,2.6), front:toWorld(.4,3.9), inside:toWorld(2.5,.2)}; })();
  OBS.push({c:new THREE.Vector3(HUT.pos.x,0,HUT.pos.z),r:2.4});
  /* ================= IV stand(點它:小麻放下器械,拉著點滴架滑來滑去) ================= */
  const IV=(()=>{ const g=new THREE.Group(); g.userData.iv=true;
    const steel=M(0xD5DADF,{roughness:.22,metalness:.8}), dark=M(0x2C3138,{roughness:.5});
    const home=new THREE.Vector3(-5.6,TOP,4.3); g.position.copy(home); g.rotation.y=.6;
    const wheels=[];
    for(let i=0;i<5;i++){ const a=i/5*Math.PI*2; const leg=new THREE.Mesh(new THREE.CylinderGeometry(.06,.07,.75,8),steel); leg.rotation.z=Math.PI/2; leg.rotation.y=-a; leg.position.set(Math.cos(a)*.36,.28,Math.sin(a)*.36); leg.rotation.order="YZX"; g.add(leg);
      const cs=new THREE.Group(); cs.position.set(Math.cos(a)*.72,.13,Math.sin(a)*.72); g.add(cs);
      const w=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,.08,14),dark); w.rotation.z=Math.PI/2; cs.add(w); wheels.push(w);
      const fk=new THREE.Mesh(new THREE.BoxGeometry(.06,.14,.12),steel); fk.position.y=.12; cs.add(fk); }
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(.13,.16,.22,12),steel); hub.position.y=.3; g.add(hub);
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.055,.065,5.7,12),steel); pole.position.y=3.1; g.add(pole);
    const knob=new THREE.Mesh(new THREE.TorusGeometry(.1,.035,8,16),steel); knob.rotation.x=Math.PI/2; knob.position.y=2.3; g.add(knob);
    // top: 4 hooks
    for(let i=0;i<4;i++){ const a=i/4*Math.PI*2+Math.PI/4; const arm=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.6,8),steel); arm.rotation.z=Math.PI/2; arm.rotation.y=-a; arm.rotation.order="YZX"; arm.position.set(Math.cos(a)*.3,5.92,Math.sin(a)*.3); g.add(arm);
      const hk=new THREE.Mesh(new THREE.TorusGeometry(.07,.02,6,12,Math.PI*1.4),steel); hk.position.set(Math.cos(a)*.58,5.86,Math.sin(a)*.58); hk.rotation.y=-a; g.add(hk); }
    // IV bags (NS + a smaller piggyback)
    const bagM=new THREE.MeshPhysicalMaterial({color:0xF4FAFF,roughness:.25,transparent:true,opacity:.82,clearcoat:.6});
    const lab=(t,c)=>new THREE.MeshBasicMaterial({map:tex(128,128,(x,w,h)=>{ x.fillStyle="#fff"; x.fillRect(0,0,w,h); x.fillStyle=c; x.fillRect(0,0,w,26); x.fillStyle="#334"; x.font="bold 30px sans-serif"; x.textAlign="center"; x.fillText(t,w/2,72); x.font="18px sans-serif"; x.fillText("500 mL",w/2,104); })});
    const mkBag=(a,sc,t,c)=>{ const bg=new THREE.Group(); const b=new THREE.Mesh(new RoundedBoxGeometry(.62,.95,.18,3,.08),bagM); bg.add(b);
      const l=new THREE.Mesh(new THREE.PlaneGeometry(.42,.42),lab(t,c)); l.position.z=.095; bg.add(l);
      const port=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.18,8),M(0xF2F2F2)); port.position.y=-.56; bg.add(port);
      const dc=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.3,12),new THREE.MeshPhysicalMaterial({color:0xFFFFFF,transparent:true,opacity:.6,roughness:.1})); dc.position.y=-.8; bg.add(dc);
      bg.scale.setScalar(sc); bg.position.set(Math.cos(a)*.58,5.25-(1-sc)*.4,Math.sin(a)*.58); bg.rotation.y=-a+Math.PI/2; g.add(bg); return bg; };
    mkBag(Math.PI/4,1,"N/S","#3B8FD9"); mkBag(Math.PI/4+Math.PI,.75,"LR","#E07A3A");
    // infusion pump on the pole
    const pump=new THREE.Mesh(new RoundedBoxGeometry(.55,.62,.36,3,.06),M(0xF1F3F5,{roughness:.4})); pump.position.set(0,3.6,.24); g.add(pump);
    const ps=new THREE.Mesh(new THREE.PlaneGeometry(.38,.22),new THREE.MeshBasicMaterial({map:tex(128,72,(x,w,h)=>{ x.fillStyle="#0E2233"; x.fillRect(0,0,w,h); x.fillStyle="#6CF0A0"; x.font="bold 30px sans-serif"; x.fillText("80",10,44); x.font="16px sans-serif"; x.fillText("mL/h",64,44); })})); ps.position.set(0,3.7,.43); g.add(ps);
    const pl=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.02,10),M(0x47D16C,{emissive:0x2A9A48,emissiveIntensity:.8})); pl.rotation.x=Math.PI/2; pl.position.set(.18,3.45,.43); g.add(pl);
    // tubing from the bag through the pump and down
    { const cv=new THREE.CatmullRomCurve3([[.41,4.28,.41],[.3,3.95,.35],[.1,3.85,.3],[0,3.3,.3],[.25,2.6,.35],[.45,1.8,.15],[.35,1.4,-.1]].map(p=>new THREE.Vector3(...p))); g.add(new THREE.Mesh(new THREE.TubeGeometry(cv,40,.022,6,false),new THREE.MeshPhysicalMaterial({color:0xE9F6FF,transparent:true,opacity:.75,roughness:.2}))); }
    shadowy(g); scene.add(g);
    return {g,home,wheels}; })();
  /* ================= 下班模式:泳裝騎海豚 / 夏威夷衫開帆船 ================= */
  let OFF=null; const RIDE={}; const LEAVING=[]; let SNORKEL=false;
  // 浮潛面鏡與呼吸管(戴在頭上,浮潛時才出現)
  const SNKMASK=(()=>{ const g=new THREE.Group(); g.visible=false; nurse.userData.head.add(g); const frame=M(0x1E8C9A,{roughness:.4}), lensM=new THREE.MeshPhysicalMaterial({color:0xBFEFFF,transparent:true,opacity:.55,roughness:.05,clearcoat:1});
    const mk=new THREE.Group(); mk.position.set(0,.38,.5); mk.rotation.x=-.55; g.add(mk);
    const fr=new THREE.Mesh(new RoundedBoxGeometry(.78,.36,.16,3,.07),frame); mk.add(fr); const ln=new THREE.Mesh(new RoundedBoxGeometry(.66,.26,.04,3,.05),lensM); ln.position.z=.08; mk.add(ln);
    const strap=new THREE.Mesh(new THREE.TorusGeometry(.66,.04,8,40),frame); strap.rotation.x=Math.PI/2-.55; strap.position.y=.2; g.add(strap);
    const tube=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(.1,-.32,.6),new THREE.Vector3(.5,-.3,.45),new THREE.Vector3(.66,.1,.2),new THREE.Vector3(.62,.9,.05)]),24,.05,8,false),M(0xFF9F43,{roughness:.4})); g.add(tube);
    const top=new THREE.Mesh(new THREE.CylinderGeometry(.08,.06,.12,10),M(0xFFFFFF)); top.position.set(.62,.95,.05); g.add(top); return g; })();
  function floatIcon(ic,p){ const n=new THREE.Sprite(new THREE.SpriteMaterial({map:tex(96,96,(c,w,h)=>{ c.font="64px serif"; c.textAlign="center"; c.textBaseline="middle"; c.fillText(ic,w/2,h/2+4); }),transparent:true,depthWrite:false}));
    n.scale.set(1.6,1.6,1); n.position.copy(p||nurse.position).add(new THREE.Vector3(0,2.6,0)); n.userData.t=0; scene.add(n); NOTES.push(n); }
  const SEA_FIND=["小丑魚","藍倒吊","海星","小章魚","海馬","小蝦","貝殼","珍珠","螃蟹","河豚"].map(n=>COL_BY[n]);
  function snorkelFind(){ const p=nurse.position.clone(); spray(p.clone().add(new THREE.Vector3(0,.4,0)),[0xBFEFFF,0xFFFFFF,0x8FD8F0],12,.08,2.4); const r=Math.random();
    if(r<.3){ floatIcon("🪙"); addBonus(.05,"🤿 浮潛撿到一枚金幣!"); return; }
    if(r<.5){ floatIcon("🗑️"); addBonus(.1,"🤿 把海裡的垃圾撿起來,好棒!"); return; }
    if(r<.68&&$("wishPanel").hidden){ floatIcon("📜"); toast("🤿 撿到一個漂流瓶,裡面有一題!"); showWish({all:true}); return; }
    let it; if(Math.random()<.5) it=rollMed(); else { const tot=SEA_FIND.reduce((a,x)=>a+COL_W[x.r],0); let k=Math.random()*tot; it=SEA_FIND.find(x=>(k-=COL_W[x.r])<=0)||SEA_FIND[0]; }
    floatIcon(it.ic); const bag=bagAdd(it.n); toast(`🤿 浮潛抓到 ${it.ic} ${it.n}!<small>(${bag})</small>`,it.r>=3?"unlock":"coin"); react(it.r>=3?"unlock":"right"); }
  function mkRideBoat(){ const b=new THREE.Group();
    const hs=new THREE.Shape(); hs.moveTo(-2,-.8); hs.lineTo(1.3,-.8); hs.quadraticCurveTo(2.7,0,1.3,.8); hs.lineTo(-2,.8); hs.quadraticCurveTo(-2.3,0,-2,-.8);
    const hull=new THREE.Mesh(new THREE.ExtrudeGeometry(hs,{depth:.9,bevelEnabled:true,bevelSize:.12,bevelThickness:.12,bevelSegments:2}),M(0xFFFFFF,{roughness:.45})); hull.rotation.x=-Math.PI/2; hull.position.y=-.4; b.add(hull);
    const deck=new THREE.Mesh(new THREE.BoxGeometry(3.4,.08,1.4),M(0xC99A68)); deck.position.set(-.2,.56,0); b.add(deck);
    const stripe=new THREE.Mesh(new THREE.BoxGeometry(4.2,.14,1.78),M(0x1E9FB5)); stripe.position.set(-.1,.3,0); b.add(stripe);
    const mast=new THREE.Mesh(new THREE.CylinderGeometry(.07,.08,5.2,8),M(0xF4EDE2)); mast.position.set(.4,3.1,0); b.add(mast);
    const boom=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,2.4,8),M(0xF4EDE2)); boom.rotation.z=Math.PI/2; boom.position.set(-.8,1.0,0);
    const sailG=new THREE.Group(); sailG.position.set(.4,0,0); b.add(sailG); boom.position.x-=.4; sailG.add(boom);
    const ms=new THREE.Shape(); ms.moveTo(0,.9); ms.lineTo(0,5.2); ms.lineTo(-2.4,.9); ms.lineTo(0,.9);
    const sailT=tex(256,256,(c,w,h)=>{ c.fillStyle="#FFFFFF"; c.fillRect(0,0,w,h); c.fillStyle="#FF7A8A"; c.fillRect(0,h*.62,w,h*.12); c.fillStyle="#FFB347"; c.fillRect(0,h*.78,w,h*.08); });
    const main=new THREE.Mesh(new THREE.ShapeGeometry(ms),new THREE.MeshStandardMaterial({map:sailT,side:THREE.DoubleSide,roughness:.8})); sailG.add(main);
    const js=new THREE.Shape(); js.moveTo(0,.9); js.lineTo(0,4.3); js.lineTo(1.9,.9); js.lineTo(0,.9);
    const jib=new THREE.Mesh(new THREE.ShapeGeometry(js),new THREE.MeshStandardMaterial({color:0xFFD94A,side:THREE.DoubleSide,roughness:.8})); jib.position.set(.45,0,0); b.add(jib);
    const flag=new THREE.Mesh(new THREE.PlaneGeometry(.8,.45),new THREE.MeshBasicMaterial({color:0xFF7A8A,side:THREE.DoubleSide})); flag.position.set(.8,5.6,0); b.add(flag);
    const tiller=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,1.1,8),M(0x8A5A32)); tiller.rotation.z=Math.PI/2-.2; tiller.position.set(-1.7,.8,0); b.add(tiller);
    shadowy(b); b.scale.setScalar(1.5); b.visible=false; scene.add(b); b.userData={sailG,flag,seat:new THREE.Vector3(-1.15,.62,0),scale:1.15}; return b; }
  function mkFree(){ const d=new THREE.Group(); d.visible=false; scene.add(d); d.userData.seat=new THREE.Vector3(-1.35,.1,0); d.userData.scale=1.4; d.userData.free=true; return d; }
  function mkRideBoard(sup){ const d=new THREE.Group(); const L=sup?2.2:1.6, W=sup?.56:.5;   // 板子沿 +x 前進
    const bs=new THREE.Shape(); bs.moveTo(-L,0); bs.quadraticCurveTo(-L*.85,W*1.1,0,W); bs.quadraticCurveTo(L*.7,W*.9,L,0); bs.quadraticCurveTo(L*.7,-W*.9,0,-W); bs.quadraticCurveTo(-L*.85,-W*1.1,-L,0);
    const bd=new THREE.Mesh(new THREE.ExtrudeGeometry(bs,{depth:.1,bevelEnabled:true,bevelSize:.04,bevelThickness:.04,bevelSegments:2}),M(sup?0xFFD24F:0xFF8A5B,{roughness:.35})); bd.rotation.x=-Math.PI/2; d.add(bd);
    const st=new THREE.Mesh(new THREE.BoxGeometry(L*1.7,.02,.07),M(0xFFFFFF)); st.position.y=.15; d.add(st);
    const fin=new THREE.Mesh(new THREE.BoxGeometry(.3,.28,.03),M(0x2E3440)); fin.position.set(-L*.75,-.16,0); d.add(fin);
    if(sup){ // 槳是獨立的物件(不跟板子縮放),每一格依兩隻手的位置擺放,所以手一定握在桿子上;原點在握把,桿子朝 -y 延伸
      const pg=new THREE.Group(); const LEN=4.5; const sh=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,LEN,8),M(0x3A3F46)); sh.position.y=-LEN/2; pg.add(sh);
      const bl=new THREE.Mesh(new THREE.BoxGeometry(.07,1.0,.46),M(0x2FA7C9,{roughness:.4})); bl.position.y=-LEN-.4; pg.add(bl); const gr=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.4,8),M(0x3A3F46)); gr.rotation.x=Math.PI/2; gr.position.y=.04; pg.add(gr);
      pg.visible=false; scene.add(pg); d.userData.paddle=pg; }
    shadowy(d); d.scale.setScalar(sup?2.1:2.3); d.visible=false; scene.add(d); d.userData.seat=new THREE.Vector3(sup?0:-.1,.15,0); d.userData.scale=1.2; d.userData.board=sup?"sup":"surf"; return d; }
  const isBoard=(k)=>k==="surf"||k==="sup", outfitOf=(k)=>(k==="free"||isBoard(k))?"swim":k;
  function mkRideDolphin(){ const d=LIFE.mkDolphin(); d.scale.setScalar(2.7); d.visible=false; scene.add(d); d.userData.seat=new THREE.Vector3(.05,.52,0); d.userData.scale=1.25; return d; }
  const puffs=[];
  function splashAt(p){ const m=new THREE.Mesh(new THREE.SphereGeometry(.18,6,5),new THREE.MeshBasicMaterial({color:0xFFFFFF,transparent:true,opacity:.85,depthWrite:false})); m.position.set(p.x+(Math.random()-.5)*1.5,p.y+.5,p.z+(Math.random()-.5)*1.5);
    m.userData={v:new THREE.Vector3((Math.random()-.5)*2,2+Math.random()*2,(Math.random()-.5)*2),t:0}; scene.add(m); puffs.push(m); }
  function sprayFx(...a){ return spray(...a); }   // 給 buildLife 用(那裡有同名的水花粒子變數)
  function spray(p,cols,n=10,sz=.09,up=2){ for(let i=0;i<n;i++){ const m=new THREE.Mesh(new THREE.SphereGeometry(sz*(.7+Math.random()*.6),6,5),new THREE.MeshBasicMaterial({color:cols[i%cols.length],transparent:true,opacity:.95,depthWrite:false}));
      const a=Math.random()*Math.PI*2, v=.8+Math.random()*1.4; m.position.set(p.x,p.y,p.z); m.userData={v:new THREE.Vector3(Math.cos(a)*v,up*(.6+Math.random()*.8),Math.sin(a)*v),t:0,g:true}; scene.add(m); puffs.push(m); } }
  function poof(p){ for(let i=0;i<12;i++){ const m=new THREE.Mesh(new THREE.SphereGeometry(.35,8,6),new THREE.MeshBasicMaterial({color:i%3?0xFFFFFF:0xFFE08A,transparent:true,opacity:.9,depthWrite:false}));
      const a=i/12*Math.PI*2; m.position.set(p.x,p.y+1.5+Math.random()*2.5,p.z); m.userData={v:new THREE.Vector3(Math.cos(a)*2.4,Math.random()*1.5,Math.sin(a)*2.4),t:0}; scene.add(m); puffs.push(m); } }
  const headingY=(a)=>-a-Math.PI/2;           // facing for counter-clockwise travel around the archipelago
  const pol=(a,r)=>new THREE.Vector3(ARCH_C.x+Math.cos(a)*r,0,ARCH_C.z+Math.sin(a)*r);
  const RIDE_R=Math.max(...ISL.map(I=>I.c.distanceTo(ARCH_C)+I.R))+14;
  // 下海的出口:從島邊沿著「離群島中心」的方向游出去,整條路不能碰到吊橋、別的島或岸邊的東西
  const EXITS={};
  function exitClear(I,a,sx,sz){ if(BRIDGES.some(br=>segDist(sx,sz,br)<6)) return false; if(OBS.some(o=>Math.hypot(o.c.x-sx,o.c.z-sz)<o.r+1.2)) return false;
    if(Object.values(D3).some(d=>Math.hypot(d.c.x-sx,d.c.z-sz)<PR+1.5)) return false; if(I.room&&I.room.near(sx,sz)) return false;
    const r0=Math.hypot(sx-ARCH_C.x,sz-ARCH_C.z); for(let r=r0+.5;r<=RIDE_R+3;r+=.8){ const x=ARCH_C.x+Math.cos(a)*r, z=ARCH_C.z+Math.sin(a)*r;
      if(BRIDGES.some(br=>segDist(x,z,br)<5.5)) return false; if(ISL.some(J=>J!==I&&Math.hypot(x-J.c.x,z-J.c.z)<J.R+3)) return false; if(Math.hypot(x-I.c.x,z-I.c.z)<I.R-1.2) return false; } return true; }
  function outer(I){ if(EXITS[I.i]!==undefined) return EXITS[I.i]; const dc=I.c.clone().sub(ARCH_C); const a0=dc.lengthSq()>1?Math.atan2(dc.z,dc.x):0; let best=null;
    for(let k=0;k<180&&!best;k++){ const a=a0+(k%2?1:-1)*Math.ceil(k/2)*Math.PI/90;
      // 從群島中心沿角度 a 的射線,和這座島外緣的最遠交點就是出口
      const ux=Math.cos(a), uz=Math.sin(a), ox=I.c.x-ARCH_C.x, oz=I.c.z-ARCH_C.z, R=I.R-.8, bq=ox*ux+oz*uz, disc=bq*bq-(ox*ox+oz*oz-R*R); if(disc<0) continue;
      const t=bq+Math.sqrt(disc); if(t<=0) continue; const sx=ARCH_C.x+ux*t, sz=ARCH_C.z+uz*t; if(exitClear(I,a,sx,sz)) best={I,shore:new THREE.Vector3(sx,0,sz),a,rW:t+4.8}; }
    EXITS[I.i]=best; return best; }
  // 這座島沒有乾淨的出口(例如被橋圍住)時,走到最近一座有出口的島再下海
  function exitFrom(I){ const O=outer(I); if(O) return O; let best=null, bd=1e9; for(const J of ISL){ const O2=outer(J); if(!O2) continue; const d=J.c.distanceTo(I.c); if(d<bd){ bd=d; best=O2; } } return best; }
  const fwd=(a0,a1)=>{ let d=a1-a0; while(d<0) d+=Math.PI*2; while(d>=Math.PI*2) d-=Math.PI*2; return d; };
  function spawnDolphinAt(a,r){ const v=RIDE.d||(RIDE.d=mkRideDolphin()); for(let i=LEAVING.length-1;i>=0;i--) if(LEAVING[i].v===v) LEAVING.splice(i,1);
    const p=pol(a,r); v.position.set(p.x,-1,p.z); v.rotation.set(0,headingY(a),0); v.visible=true; for(let i=0;i<14;i++) splashAt(v.position); return v; }
  function rideVehicle(kind){ const v=kind==="free"?(RIDE.f||(RIDE.f=mkFree())):kind==="swim"?(RIDE.d||(RIDE.d=mkRideDolphin())):kind==="surf"?(RIDE.s||(RIDE.s=mkRideBoard(false))):kind==="sup"?(RIDE.p||(RIDE.p=mkRideBoard(true))):(RIDE.b||(RIDE.b=mkRideBoat())); for(let i=LEAVING.length-1;i>=0;i--) if(LEAVING[i].v===v) LEAVING.splice(i,1); return v; }
  function xferStart(kind){ const old=OFF.v; const a1=OFF.a+.05, r1=OFF.r+4.2; const T=pol(a1,r1); let v2=rideVehicle(kind), from;
    if(kind==="hawaii"){ let nb=null, bd=1e9; ENV.boats.forEach(b=>{ if(!b.visible) return; const dd=b.position.distanceTo(old.position); if(dd<bd){ bd=dd; nb=b; } });
      if(nb){ from=nb.position.clone(); ENV.taken=nb; v2.rotation.set(0,nb.rotation.y,0); } else { from=pol(OFF.a+.25,OFF.r+30); v2.rotation.set(0,headingY(OFF.a),0); } }
    else { from=T.clone(); v2.rotation.set(0,headingY(a1),0); if(kind==="swim") for(let i=0;i<14;i++) splashAt(T); }
    v2.position.copy(from); v2.visible=true;
    OFF.x={old,v2,kind,from,a1,r1,t:0,dur:kind==="hawaii"?Math.min(4,Math.max(1.6,from.distanceTo(T)/16)):.35,step:"come"}; OFF.phase="xfer"; setHud(); }
  function offStart(kind){ if(orLocked()){ lockMsg(); return; } fishEnd(); loungeEnd();
    if(OFF){ if(OFF.kind===kind) return;
      if(OFF.phase==="ride"){ xferStart(kind); return; }
      if(OFF.phase==="walk"){ if(OFF.v&&kind!=="swim"){ OFF.v.visible=false; OFF.v=null; } OFF.kind=kind; if(kind==="swim") OFF.v=spawnDolphinAt(OFF.a,OFF.rW); setHud(); return; }
      if(OFF.phase==="xfer") return;
      offEnd(()=>offStart(kind)); return; }
    releaseIV(); if(bookEl) closeBook();
    if(focus){ focus=null; target=null; setHud(); try{ history.replaceState(null,"",location.pathname+location.search); }catch(e){} }
    const O=exitFrom(islandAt(nurse.position)); const pts=pathTo(O.shore); viewIsl=O.I.i;
    OFF={kind,phase:"walk",a:O.a,rW:O.rW,t:0}; inHut=false; faceCamera=false; mode="off"; setHud();
    if(kind==="swim") OFF.v=spawnDolphinAt(O.a,O.rW);   // the dolphin shows up straight away and waits at the beach
    route(pts,()=>{ if(!OFF) return; const kind=OFF.kind; poof(nurse.position); nurse.userData.setOutfit(outfitOf(kind)); mode="off"; faceCamera=true;
      const v=kind==="free"?(RIDE.f||(RIDE.f=mkFree())):kind==="swim"?(RIDE.d||(RIDE.d=mkRideDolphin())):kind==="surf"?(RIDE.s||(RIDE.s=mkRideBoard(false))):kind==="sup"?(RIDE.p||(RIDE.p=mkRideBoard(true))):(RIDE.b||(RIDE.b=mkRideBoat())); for(let i=LEAVING.length-1;i>=0;i--) if(LEAVING[i].v===v) LEAVING.splice(i,1); if(OFF.kind==="swim"&&OFF.v===v){ OFF.phase="hop"; OFF.t=0; OFF.from=nurse.position.clone(); faceCamera=false; return; } v.rotation.set(0,0,0); OFF.v=v; v.visible=true; OFF.phase="call"; OFF.t=0; if(kind==="free"||isBoard(kind)){ OFF.t=1e9; } });
    setHud(); }
  function offEnd(cb){ if(!OFF){ cb&&cb(); return; } OFF.cb=cb;
    if(OFF.phase==="walk"||OFF.phase==="call"){ const v=OFF.v; if(v) v.visible=false; nurse.userData.setOutfit("scrub"); OFF=null; mode="idle"; walk=null; setHud(); if(cb) cb(); else goIsland(islandAt(nurse.position).i); return; }
    if(["cruise","return","hopback","leave"].includes(OFF.phase)) return;
    if(OFF.phase==="hop"){ OFF.r=OFF.rW; }
    // land on the island whose outer beach comes up next along the loop
    let best=null; for(const I of ISL){ const O=outer(I); if(!O) continue; const d=fwd(OFF.a,O.a); const dd=d<.35?d+Math.PI*2:d; if(!best||dd<best.dd) best={O,dd}; }
    OFF.L=best.O; OFF.aEnd=OFF.a+best.dd; OFF.phase="cruise"; OFF.t=0; setHud(); }
  function offTick(dt,tt){
    for(let i=puffs.length-1;i>=0;i--){ const m=puffs[i]; m.userData.t+=dt; if(m.userData.g) m.userData.v.y-=9*dt; m.position.addScaledVector(m.userData.v,dt); if(!m.userData.g) m.scale.setScalar(1+m.userData.t*2.5); m.material.opacity=.9*(1-m.userData.t/.7); if(m.userData.t>.7){ scene.remove(m); puffs.splice(i,1); } }
    for(let i=LEAVING.length-1;i>=0;i--){ const L=LEAVING[i]; L.t+=dt; const k=Math.min(1,L.t/2.2); const p=pol(L.a,L.rW+k*30); const y=waveH(p.x,p.z,tt,ENV.wave())-.7;
      L.v.position.set(p.x,L.swim?y-.35-k*3:y+.05,p.z); L.v.rotation.y=-L.a; if(k>=1){ L.v.visible=false; LEAVING.splice(i,1); } }
    if(ENV.taken&&!(OFF&&(OFF.kind==="hawaii"||(OFF.x&&OFF.x.kind==="hawaii")))) ENV.taken=null;
    if(RIDE.p&&!(OFF&&OFF.kind==="sup"&&["ride","cruise","return","xfer"].includes(OFF.phase))) RIDE.p.userData.paddle.visible=false;
    if(!OFF) SNORKEL=false; SNKMASK.visible=!!(SNORKEL&&OFF&&OFF.kind==="free"&&!["walk","call"].includes(OFF.phase));
    if(!OFF||!OFF.v) return; const v=OFF.v, swim=OFF.kind==="swim", ud=nurse.userData; OFF.t+=dt;
    const free=OFF.kind==="free", surfK=OFF.kind==="surf", supK=OFF.kind==="sup", board=surfK||supK;
    const place=(a,r,lift)=>{ const p=pol(a,r); const y=waveH(p.x,p.z,tt,ENV.wave())-.7; v.position.set(p.x,free?y-.55:swim?y-.35+(lift||0):y+.05,p.z); };
    const seatNurse=()=>{ v.updateMatrixWorld(); const p=v.localToWorld(v.userData.seat.clone()); nurse.position.copy(p); nurse.quaternion.setFromAxisAngle(up0,v.rotation.y+Math.PI/2);
      ud.body.rotation.x=0; ud.head.rotation.x=0;
      if(free){ nurse.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI/2*.92)); ud.body.position.y=0; ud.body.rotation.z=Math.sin(tt*2.6)*.18;
        ud.armR.sh.rotation.set(-((tt*5.2)%(Math.PI*2)),0,.12); ud.armL.sh.rotation.set(-((tt*5.2+Math.PI)%(Math.PI*2)),0,-.12); ud.armR.fore.rotation.x=-.25; ud.armL.fore.rotation.x=-.25;
        ud.legs[0].rotation.set(Math.sin(tt*13)*.4,0,0); ud.legs[1].rotation.set(-Math.sin(tt*13)*.4,0,0); ud.head.rotation.y=Math.max(0,Math.sin(tt*2.6))*.7; }
      else if(swim){ ud.body.position.y=-1.0; ud.legs.forEach((l,i)=>{ l.rotation.x=-1.25; l.rotation.z=(i?-1:1)*.5; }); ud.armR.sh.rotation.set(-1.25,0,.25); ud.armL.sh.rotation.set(-1.25,0,-.25); ud.armR.fore.rotation.x=-.3; ud.armL.fore.rotation.x=-.3; }
      else if(surfK){ // 側身、微蹲、雙手張開平衡,身體跟著轉彎傾斜
        nurse.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(up0,-1.15)); const lean=Math.cos(OFF.a*3)*.2+Math.sin(tt*2.4)*.05;
        ud.body.position.y=-.22+Math.sin(tt*3.1)*.05; ud.body.rotation.x=lean; ud.body.rotation.z=0; ud.head.rotation.y=.95;
        ud.legs.forEach((l,i)=>{ l.rotation.set(0,0,(i?-1:1)*.42); }); ud.armR.sh.rotation.set(-.2,0,-1.2+Math.sin(tt*2.2)*.15); ud.armL.sh.rotation.set(-.2,0,1.2+Math.sin(tt*2.2)*.15); ud.armR.fore.rotation.x=-.15; ud.armL.fore.rotation.x=-.15; }
      else if(supK){ // 站直划槳:每兩下換邊
        const ph=OFF.t*2.4, sw=Math.sin(ph), side=Math.sin(ph*.25)>=0?1:-1; ud.body.position.y=0; ud.body.rotation.x=.1+sw*.08; ud.body.rotation.z=0; ud.head.rotation.y=0;
        ud.legs.forEach((l,i)=>{ l.rotation.set(0,0,(i?-1:1)*.14); });
        // side=+1 在小麻左邊划:左手在下握桿、右手在上握握把;side=-1 相反
        const lo=side>0?ud.armL:ud.armR, hi=side>0?ud.armR:ud.armL;
        lo.sh.rotation.set(-.8+sw*.3,0,side*.3); lo.fore.rotation.x=-.3; hi.sh.rotation.set(-1.75+sw*.18,0,side*.55); hi.fore.rotation.x=-.95;
        const pg=v.userData.paddle; nurse.updateMatrixWorld(true); const pT=hi.hand.getWorldPosition(new THREE.Vector3()), pB=lo.hand.getWorldPosition(new THREE.Vector3()); const dir=pB.sub(pT).normalize();
        pg.position.copy(pT).addScaledVector(dir,-.12); pg.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),dir); pg.visible=true; }
      else { ud.body.position.y=0; ud.legs.forEach(l=>{ l.rotation.x=0; l.rotation.z=0; }); ud.armR.sh.rotation.set(-2.6+Math.sin(tt*6)*.35,0,.35); ud.armR.fore.rotation.x=-.4; ud.armL.sh.rotation.set(-.7,0,-.2); ud.armL.fore.rotation.x=-.6; } };
    const follow=()=>{ if(camTween) return; const want=v.position.clone().add(new THREE.Vector3(0,1.5,0)); const off=camera.position.clone().sub(controls.target); controls.target.lerp(want,Math.min(1,dt*2.5)); camera.position.copy(controls.target).add(off); };
    const anim=()=>{ if(free){ v.rotation.z=0; } else if(swim){ v.rotation.z=Math.cos(OFF.t*2.1)*.18; } else if(board){ v.rotation.x=surfK?Math.cos(OFF.a*3)*.28:Math.sin(OFF.t*1.5)*.04; v.rotation.z=surfK?.07+Math.sin(OFF.t*2.3)*.06:Math.sin(OFF.t*1.2)*.03; } else { v.rotation.z=0; v.rotation.x=Math.sin(OFF.t*1.3)*.07; v.userData.sailG.rotation.y=-.35+Math.sin(OFF.t*.7)*.08; v.userData.flag.rotation.y=Math.sin(OFF.t*6)*.4; } };
    if(OFF.phase==="walk"){ place(OFF.a,OFF.rW,Math.sin(OFF.t*2.4)*.35); v.rotation.set(0,headingY(OFF.a),Math.sin(OFF.t*2.4)*.15); if(Math.random()<dt*2) splashAt(v.position); return; }
    if(OFF.phase==="xfer"){ const X=OFF.x; X.t+=dt; place(OFF.a,OFF.r); anim(); if(X.step==="come") seatNurse(); follow();
      const T=pol(X.a1,X.r1); const wy=(p)=>waveH(p.x,p.z,tt,ENV.wave())-.7;
      const setV2=(p,ry)=>{ const yy=wy(p); X.v2.position.set(p.x,X.kind==="free"?yy-.55:X.kind==="swim"?yy-.35:yy+.05,p.z); X.v2.rotation.y=ry; };
      if(X.step==="come"){ const k=Math.min(1,X.t/X.dur), e=1-Math.pow(1-k,3); const p=X.from.clone().lerp(T,e); const mv=T.clone().sub(X.from);
        const ryMove=Math.atan2(-mv.z,mv.x); setV2(p,k<.75?ryMove:THREE.MathUtils.lerp(ryMove,headingY(X.a1),(k-.75)/.25));
        if(X.kind==="hawaii"){ X.v2.userData.sailG.rotation.y=-.35; X.v2.userData.flag.rotation.y=Math.sin(tt*6)*.4; }
        if(k>=1){ X.step="hop"; X.t=0; X.p0=nurse.position.clone(); } return; }
      if(X.step==="hop"){ const k=Math.min(1,X.t/.85); setV2(T,headingY(X.a1)); X.v2.updateMatrixWorld(); const to=X.v2.localToWorld(X.v2.userData.seat.clone());
        nurse.position.lerpVectors(X.p0,to,k); nurse.position.y+=Math.sin(k*Math.PI)*3.2; nurse.quaternion.setFromAxisAngle(up0,headingY(X.a1)+Math.PI/2);
        ud.body.position.y=0; ud.body.rotation.z=0; ud.body.rotation.x=0; ud.head.rotation.y=0; ud.legs.forEach(l=>{ l.rotation.set(-.6*Math.sin(k*Math.PI),0,0); }); ud.armR.sh.rotation.set(-2.4,0,.4); ud.armL.sh.rotation.set(-2.4,0,-.4);
        if(!X.swapped&&k>=.5){ X.swapped=true; poof(nurse.position); ud.setOutfit(outfitOf(X.kind)); }
        if(k>=1){ LEAVING.push({v:X.old,a:OFF.a,rW:OFF.r,swim:X.old===RIDE.d||X.old===RIDE.f,t:0}); OFF.v=X.v2; OFF.kind=X.kind; OFF.a=X.a1; OFF.r=X.r1; OFF.x=null; OFF.phase="ride"; OFF.t=0; setHud();
          { const ot=document.getElementById("offToggle"); if(ot) ot.textContent=X.kind==="swim"?"🐬 下班中":X.kind==="free"?"🏊 下班中":X.kind==="surf"?"🏄 衝浪中":X.kind==="sup"?"🛶 SUP 中":"⛵ 下班中"; } } return; } }
    if(OFF.phase==="call"&&(free||board)){ OFF.phase="hop"; OFF.t=0; OFF.from=nurse.position.clone(); faceCamera=false; }
    if(OFF.phase==="call"){ const k=Math.min(1,OFF.t/2.6), e=1-Math.pow(1-k,3); place(OFF.a,OFF.rW+30*(1-e), swim?Math.sin(k*Math.PI*3)*.4:0);
      v.rotation.y=THREE.MathUtils.lerp(-Math.PI-OFF.a, headingY(OFF.a), Math.min(1,Math.max(0,(k-.55)/.45))); v.rotation.z=0;
      if(k>=1){ OFF.phase="hop"; OFF.t=0; OFF.from=nurse.position.clone(); faceCamera=false; } return; }
    if(OFF.phase==="hop"){ const k=Math.min(1,OFF.t/.8); place(OFF.a,OFF.rW); v.rotation.y=headingY(OFF.a); v.updateMatrixWorld(); const to=v.localToWorld(v.userData.seat.clone());
      nurse.position.lerpVectors(OFF.from,to,k); nurse.position.y+=Math.sin(k*Math.PI)*3; ud.legs.forEach(l=>l.rotation.x=-.6*Math.sin(k*Math.PI));
      if(k>=1){ OFF.phase="ride"; OFF.t=0; OFF.r=OFF.rW; OFF.rStart=OFF.rW; const dir=new THREE.Vector3(Math.cos(OFF.a),0,Math.sin(OFF.a)); const cp=to.clone().addScaledVector(dir,18).add(new THREE.Vector3(0,9,0)).addScaledVector(new THREE.Vector3(-dir.z,0,dir.x),-8);
        tweenCam(cp,to.clone().add(new THREE.Vector3(0,1.5,0)),1400); OFF.followAt=performance.now()+1450; OFF.last=null; } return; }
    if((free||surfK)&&(OFF.phase==="ride"||OFF.phase==="cruise"||OFF.phase==="return")&&Math.random()<dt*14) splashAt(v.position);
    if(SNORKEL&&free&&OFF.phase==="ride"){ OFF.snk=(OFF.snk===undefined?4:OFF.snk)-dt; if(OFF.snk<=0){ OFF.snk=6+Math.random()*6; snorkelFind(); } }
    if(OFF.phase==="ride"||OFF.phase==="cruise"){ const sp=(free?4.6:swim?8.5:surfK?10:supK?3.6:6)*(OFF.phase==="cruise"?2.6:1); OFF.r+=(RIDE_R-OFF.r)*Math.min(1,dt*.5); { const r1=OFF.rStart||OFF.r, k=Math.min(1,Math.max(0,(OFF.r-r1)/Math.max(1,RIDE_R-3-r1))); OFF.a+=sp/OFF.r*dt*(OFF.phase==="cruise"?1:Math.max(.04,k*k)); } const r=OFF.r+Math.sin(OFF.a*3)*2.5*Math.min(1,Math.max(0,(OFF.r-(OFF.rStart||OFF.r))/8));
      const hop=swim&&!free?Math.max(0,Math.sin(OFF.t*2.1))*.9:0; place(OFF.a,r,hop); v.rotation.y=headingY(OFF.a)-Math.cos(OFF.a*3)*.15; anim(); seatNurse(); follow();
      if(OFF.phase==="cruise" && OFF.a>=OFF.aEnd-.32){ OFF.phase="return"; OFF.t=0; OFF.r0=r; OFF.a0=OFF.a; } return; }
    if(OFF.phase==="return"){ const k=Math.min(1,OFF.t/2.8), e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2; const a=THREE.MathUtils.lerp(OFF.a0,OFF.aEnd,Math.min(1,e*2.5)), r=THREE.MathUtils.lerp(OFF.r0,OFF.L.rW,e);
      place(a,r); v.rotation.y=headingY(a); v.rotation.z=0; v.rotation.x=0; seatNurse(); follow();
      if(k>=1){ OFF.a=a; OFF.phase="hopback"; OFF.t=0; OFF.from=nurse.position.clone(); } return; }
    if(OFF.phase==="hopback"){ const k=Math.min(1,OFF.t/.8); if(board&&OFF.t<dt*1.5){ nurse.quaternion.setFromAxisAngle(up0,v.rotation.y+Math.PI/2); ud.body.rotation.set(0,0,0); ud.head.rotation.y=0; ud.legs.forEach(l=>l.rotation.set(0,0,0)); } if(free&&OFF.t<dt*1.5){ nurse.quaternion.setFromAxisAngle(up0,v.rotation.y+Math.PI/2); ud.body.rotation.z=0; ud.head.rotation.y=0; ud.legs.forEach(l=>l.rotation.set(0,0,0)); } const to=OFF.L.shore.clone(); to.y=groundY(to.x,to.z); nurse.position.lerpVectors(OFF.from,to,k); nurse.position.y+=Math.sin(k*Math.PI)*3;
      ud.body.position.y=THREE.MathUtils.lerp(swim?-1:0,0,k); ud.legs.forEach(l=>{ l.rotation.x*=1-k; l.rotation.z*=1-k; });
      if(k>=1){ poof(nurse.position); ud.setOutfit("scrub"); ud.armR.sh.rotation.set(-.95,0,.12); ud.armR.fore.rotation.x=-.75; ud.armL.sh.rotation.set(-.85,0,-.12); ud.armL.fore.rotation.x=-.85;
        LEAVING.push({v,a:OFF.a,rW:OFF.L.rW,swim,t:0}); const cb=OFF.cb, Li=OFF.L.I.i; OFF=null; mode="idle"; faceCamera=true; setHud(); if(cb) cb(); else goIsland(Li); } return; } }
  /* ================= 麻醉護理師的黑色滑輪椅(點它:坐上去滑來滑去) ================= */
  const STOOL=(()=>{ const g=new THREE.Group(); g.userData.stool=true;
    const blk=M(0x18191B,{roughness:.55}), chrome=M(0xC9CDD2,{roughness:.2,metalness:.85}), dark=M(0x2A2C30,{roughness:.4,metalness:.3});
    const wheels=[];
    for(let i=0;i<5;i++){ const a=i/5*Math.PI*2+.3; const leg=new THREE.Mesh(new THREE.BoxGeometry(.62,.07,.12),dark); leg.position.set(Math.cos(a)*.32,.1,Math.sin(a)*.32); leg.rotation.y=-a; g.add(leg);
      const cs=new THREE.Group(); cs.position.set(Math.cos(a)*.62,.07,Math.sin(a)*.62); g.add(cs);
      const w=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.07,14),M(0x111111,{roughness:.6})); w.rotation.z=Math.PI/2; cs.add(w); wheels.push(w);
      const hub=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.08,10),M(0xE9C25A,{roughness:.4})); hub.rotation.z=Math.PI/2; cs.add(hub); }
    const col=new THREE.Mesh(new THREE.CylinderGeometry(.06,.07,.82,12),chrome); col.position.y=.5; g.add(col);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.48,.035,8,36),chrome); ring.rotation.x=Math.PI/2; ring.position.y=.45; g.add(ring);
    for(let i=0;i<3;i++){ const a=i/3*Math.PI*2; const sp=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.46,6),chrome); sp.rotation.z=Math.PI/2; sp.position.set(Math.cos(a)*.24,.45,Math.sin(a)*.24); sp.rotation.y=-a; g.add(sp); }
    const seat=new THREE.Mesh(new THREE.CylinderGeometry(.7,.68,.18,36),blk); seat.position.y=.97; g.add(seat);
    const seatTop=new THREE.Mesh(new THREE.SphereGeometry(.7,36,8,0,Math.PI*2,0,Math.PI*.12),blk); seatTop.scale.y=.5; seatTop.position.y=.735; g.add(seatTop);
    const post=new THREE.Mesh(new THREE.BoxGeometry(.14,.75,.05),blk); post.position.set(0,1.3,-.68); post.rotation.x=.05; g.add(post);
    { const sh=new THREE.Shape(); const r0=.66,r1=.82,a0=Math.PI*1.22,a1=Math.PI*1.78; sh.absarc(0,0,r1,a0,a1,false); sh.absarc(0,0,r0,a1,a0,true);
      const back=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.26,bevelEnabled:true,bevelSize:.04,bevelThickness:.04,bevelSegments:3,curveSegments:24}),blk); back.rotation.x=Math.PI/2; back.position.y=1.86; back.scale.y=1; g.add(back); }
    const S=1.42; g.scale.setScalar(S); const home=new THREE.Vector3(6.4,TOP,5.2); g.position.copy(home); g.rotation.y=-2.3;
    shadowy(g); scene.add(g); return {g,wheels,S}; })();
  OR.addChairs(STOOL.g);   // 手術室裡給外科醫師與巡迴護理師休息的黑色椅子
  function buildLife(){
    const rnd=(()=>{ let s=99; return ()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; }; })();
    const onBeach=(r0,r1)=>{ for(let k=0;k<80;k++){ const a=rnd()*Math.PI*2, r=r0+rnd()*(r1-r0); const x=Math.cos(a)*r, z=Math.sin(a)*r;
        if(Object.values(D3).some(d=>Math.hypot(d.c.x-x,d.c.z-z)<PR+.8)) continue; return {x,z,a}; } return {x:0,z:28,a:Math.PI/2}; };
    // clear trees out of the hut's way
    trees.forEach(t=>{ if(t.userData.home===0&&(Math.hypot(t.position.x,t.position.z)<9.5||Math.hypot(t.position.x,t.position.z)>26.5)) t.visible=false; });
    /* starfish */
    const star=(R,r)=>{ const sh=new THREE.Shape(); for(let i=0;i<10;i++){ const a=i/10*Math.PI*2-Math.PI/2, rr=i%2?r:R; i?sh.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):sh.moveTo(Math.cos(a)*rr,Math.sin(a)*rr); } return sh; };
    const picks=[];
    const starCols=[0xF2804F,0xF5A3B5,0xF6C257,0xE86A6A];
    for(let i=0;i<9;i++){ const p=onBeach(26.4,29.2); const m=new THREE.Mesh(new THREE.ExtrudeGeometry(star(.55,.22),{depth:.1,bevelEnabled:true,bevelSize:.06,bevelThickness:.06,bevelSegments:2}),M(starCols[i%4],{roughness:.7}));
      m.rotation.x=-Math.PI/2; m.rotation.z=rnd()*6; m.position.set(p.x,TOP+.06,p.z); const sc=.8+rnd()*.7; m.scale.setScalar(sc); shadowy(m); scene.add(m); m.userData.act="pick"; m.userData.item="海星"; m.userData.home=m.position.clone(); picks.push(m);
      for(let k=0;k<5;k++){ const a=k/5*Math.PI*2-Math.PI/2+m.rotation.z; } }
    /* shells: scallops and little spirals */
    const shellCols=[0xFFF1E0,0xF9D3C4,0xF3E0B5,0xFFFFFF];
    for(let i=0;i<14;i++){ const p=onBeach(26.2,29.4); const g=new THREE.Group();
      if(i%3){ const sc=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.08,14,1,false,0,Math.PI),M(shellCols[i%4],{roughness:.6})); sc.scale.set(1,1,.9); g.add(sc);
        for(let k=1;k<7;k++){ const rib=new THREE.Mesh(new THREE.BoxGeometry(.03,.1,.42),M(0xE6BFA8)); const a=k/7*Math.PI; rib.position.set(Math.cos(a)*.2,0,Math.sin(a)*.2*.9); rib.rotation.y=-a+Math.PI/2; g.add(rib); }
        const hinge=new THREE.Mesh(new THREE.BoxGeometry(.22,.08,.1),M(shellCols[i%4])); hinge.position.z=-.04; g.add(hinge); g.position.y=TOP+.05; }
      else { const co=new THREE.Mesh(new THREE.ConeGeometry(.22,.6,10),M(0xF6D8C2,{roughness:.6})); co.rotation.z=Math.PI/2; g.add(co); const ring=new THREE.Mesh(new THREE.TorusGeometry(.17,.06,6,14),M(0xEFC3A6)); ring.position.x=-.22; ring.rotation.y=Math.PI/2; g.add(ring); g.position.y=TOP+.18; }
      g.position.x=p.x; g.position.z=p.z; g.rotation.y=rnd()*6; g.scale.setScalar(.9+rnd()*.6); shadowy(g); scene.add(g); g.userData.act="pick"; g.userData.item=i%3?"扇貝":"螺貝"; g.userData.home=g.position.clone(); picks.push(g); }
    /* giant hermit crabs walking along the beach */
    const crabs=[];
    for(let i=0;i<3;i++){ const c=new THREE.Group(); const red=M(i===1?0xE8743B:0xD9483B,{roughness:.6});
      const shell=new THREE.Group(); const sh1=new THREE.Mesh(new THREE.SphereGeometry(.85,18,14),M([0xF2D4A6,0xE9B8C8,0xD9C6A0][i],{roughness:.55})); sh1.scale.set(1,.9,1.15); shell.add(sh1);
      for(let k=0;k<3;k++){ const t=new THREE.Mesh(new THREE.TorusGeometry(.55-k*.16,.11,8,20),M([0xD9A777,0xD58FA8,0xB89F73][i])); t.position.set(0,.18+k*.24,-.15-k*.18); t.rotation.x=1.1; shell.add(t); }
      const spire=new THREE.Mesh(new THREE.ConeGeometry(.22,.5,10),M([0xE7C08F,0xE0A3B9,0xC9B38A][i])); spire.position.set(0,.75,-.55); spire.rotation.x=-.9; shell.add(spire);
      shell.position.set(0,.95,-.25); c.add(shell);
      const bodyc=new THREE.Mesh(new THREE.SphereGeometry(.42,14,10),red); bodyc.scale.set(1.1,.7,.9); bodyc.position.set(0,.55,.42); c.add(bodyc);
      for(const sx of [-1,1]){ const st=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.4,6),red); st.position.set(sx*.15,.85,.62); st.rotation.x=.3; c.add(st);
        const eye=new THREE.Mesh(new THREE.SphereGeometry(.08,10,8),M(0x1E1A1A,{roughness:.3})); eye.position.set(sx*.15,1.06,.68); c.add(eye);
        const cl=new THREE.Mesh(new THREE.SphereGeometry(sx>0?.28:.2,12,10),red); cl.scale.set(1,.7,1.3); cl.position.set(sx*.42,.45,.78); c.add(cl); }
      const legs=[]; for(const sx of [-1,1]) for(let k=0;k<3;k++){ const lg=new THREE.Group(); lg.position.set(sx*.32,.5,.5-k*.18); const seg=new THREE.Mesh(new THREE.CylinderGeometry(.045,.035,.65,6),red); seg.position.set(sx*.28,-.18,0); seg.rotation.z=sx*1.0; lg.add(seg); c.add(lg); legs.push({lg,ph:k*1.3+(sx>0?0:Math.PI)}); }
      const a0=Math.PI/2+.55+i*2.1; c.userData={a:a0, r:27.6+(i%2)*.8, sp:(i%2?1:-1)*.018, legs, pause:0};
      c.scale.setScalar((.95+i*.12)*.6); shadowy(c); scene.add(c); crabs.push(c); c.userData.act="pick"; c.userData.item="寄居蟹"; picks.push(c); }
    /* seagulls */
    const gulls=[]; const gw=M(0xFFFFFF,{roughness:.7}), gg=M(0x9AA6B2,{roughness:.7}), gy=M(0xF2B53A);
    for(let i=0;i<4;i++){ const b=new THREE.Group(); const bd=new THREE.Mesh(new THREE.SphereGeometry(.35,12,10),gw); bd.scale.set(1.9,.8,.8); b.add(bd);
      const hd=new THREE.Mesh(new THREE.SphereGeometry(.22,10,8),gw); hd.position.set(.62,.12,0); b.add(hd);
      const bk=new THREE.Mesh(new THREE.ConeGeometry(.06,.3,6),gy); bk.rotation.z=-Math.PI/2; bk.position.set(.9,.08,0); b.add(bk);
      const tl=new THREE.Mesh(new THREE.ConeGeometry(.2,.45,4),gw); tl.rotation.z=Math.PI/2; tl.position.set(-.75,0,0); tl.scale.z=.3; b.add(tl);
      const wings=[]; for(const sz of [-1,1]){ const w=new THREE.Group(); const inner=new THREE.Mesh(new THREE.BoxGeometry(.55,.04,1.1),gw); inner.position.z=sz*.55; w.add(inner);
        const outer=new THREE.Mesh(new THREE.BoxGeometry(.4,.04,.9),gg); outer.position.set(-.08,0,sz*1.5); outer.rotation.y=sz*.25; w.add(outer); b.add(w); wings.push({w,sz}); }
      b.userData={a:rnd()*6, r:18+rnd()*30, h:13+rnd()*10, sp:(.18+rnd()*.12)*(i%2?1:-1), ph:rnd()*6, wings}; b.scale.setScalar(.75); shadowy(b); scene.add(b); gulls.push(b); }
    let gullCD=20;
    // 海鷗的路線:先在高空(比陽傘、樹叢、燈塔都高)飛到目標正上方,再垂直降落;起飛也是先垂直升高再飛走,不會穿過任何東西
    const GULL_CRUISE=TOP+12.5;
    const columnClear=(x,z)=>OBS.every(o=>Math.hypot(o.c.x-x,o.c.z-z)>o.r+.7)&&trees.every(t=>!t.visible||Math.hypot(t.position.x-x,t.position.z-z)>1.9)&&!(ISL[3].room&&ISL[3].room.near(x,z))&&(typeof HUT==="undefined"||Math.hypot(x-HUT.pos.x,z-HUT.pos.z)>6);
    function gullJob(b,u,dt,tt,orbit){ const J=u.job; J.t+=dt; const flap=(sp,amp)=>u.wings.forEach(w=>w.w.rotation.x=w.sz*Math.sin(tt*sp+u.ph)*amp);
      const headTop=()=>{ nurse.updateMatrixWorld(true); const p=nurse.userData.head.getWorldPosition(new THREE.Vector3()); p.y+=.8*nurse.scale.y; return p; };
      const P=J.k==="eat"?J.lit.position.clone().add(new THREE.Vector3(0,.25,0)):headTop();
      const face=(dx,dz)=>{ if(Math.hypot(dx,dz)>.01) b.rotation.set(0,Math.atan2(-dz,dx),0,"YXZ"); };
      const done=()=>{ J.phase="up"; J.t=0; J.from=b.position.clone(); };
      if(J.phase==="go"){ const above=new THREE.Vector3(P.x,GULL_CRUISE,P.z); const k=Math.min(1,J.t/J.dur), e=k*k*(3-2*k); const d=above.clone().sub(J.from);
        b.position.copy(J.from).addScaledVector(d,e); face(d.x,d.z); flap(9,.6); if(k>=1){ J.phase="down"; J.t=0; } return; }
      if(J.phase==="down"){ if(J.k==="peck"&&!columnClear(P.x,P.z)){ done(); return; } const k=Math.min(1,J.t/1.6), e=k*k*(3-2*k); b.position.set(P.x,GULL_CRUISE+(P.y-GULL_CRUISE)*e,P.z); b.rotation.z=0; flap(5,.7); if(k>=1){ J.phase="act"; J.t=0; J.at=P.clone(); } return; }
      if(J.phase==="act"){ if(J.k==="peck"&&Math.hypot(P.x-J.at.x,P.z-J.at.z)>.9){ done(); return; }   // 小麻走開了就飛走
        b.position.copy(P); b.rotation.z=-.55*Math.max(0,Math.sin(J.t*13)); flap(3,.12);
        if(!J.done&&J.t>.35){ J.done=true;
          if(J.k==="eat"){ if(!eatLitter(J.lit,"gull")){ done(); return; } }
          else { toast("🐦 海鷗停在小麻頭上啄啄啄⋯⋯好痛!"); react("wrong"); sprayFx(P.clone(),[0xFFFFFF,0xE8EDF2],6,.06,1.4); } }
        if(J.t>(J.k==="eat"?1.4:1.9)) done(); return; }
      if(J.phase==="up"){ const k=Math.min(1,J.t/1.4), e=k*k*(3-2*k); b.position.set(J.from.x,J.from.y+(GULL_CRUISE-J.from.y)*e,J.from.z); b.rotation.z=.3*(1-k); flap(10,.7); if(k>=1){ J.phase="back"; J.t=0; J.from=b.position.clone(); } return; }
      const k=Math.min(1,J.t/2.6), e=k*k*(3-2*k); const d=orbit.clone().sub(J.from); b.position.copy(J.from).addScaledVector(d,e); face(d.x,d.z); flap(8,.55); if(k>=1) u.job=null; }
    /* sea creatures that leap out of the water — lathe bodies with counter-shading, shaped fins */
    const lathe=(prof,seg=28)=>{ const cr=new THREE.SplineCurve(prof.map(([x,r])=>new THREE.Vector2(x,r))); const pts=cr.getPoints(60).map(v=>new THREE.Vector2(Math.max(v.y,.0001),v.x)); const g=new THREE.LatheGeometry(pts,seg); g.rotateZ(-Math.PI/2); return g; };
    const paint=(geo,fn)=>{ const p=geo.attributes.position, c=[]; const col=new THREE.Color(); for(let i=0;i<p.count;i++){ fn(p.getX(i),p.getY(i),p.getZ(i),col); c.push(col.r,col.g,col.b); } geo.setAttribute("color",new THREE.Float32BufferAttribute(c,3)); return geo; };
    const skin=(o={})=>new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.32,clearcoat:.7,clearcoatRoughness:.25,...o});
    const finShape=(pts,depth=.05)=>{ const sh=new THREE.Shape(); pts.forEach(([x,y],i)=>i?sh.lineTo(x,y):sh.moveTo(x,y)); const g=new THREE.ExtrudeGeometry(sh,{depth,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:2,curveSegments:10}); g.translate(0,0,-depth/2); return g; };
    const curveFin=(arr)=>{ const sh=new THREE.Shape(); sh.moveTo(arr[0][0],arr[0][1]); for(let i=1;i<arr.length;i+=2) sh.quadraticCurveTo(arr[i][0],arr[i][1],arr[i+1][0],arr[i+1][1]); return sh; };
    const extr=(sh,depth=.06)=>{ const g=new THREE.ExtrudeGeometry(sh,{depth,bevelEnabled:true,bevelSize:.03,bevelThickness:.03,bevelSegments:3,curveSegments:14}); g.translate(0,0,-depth/2); return g; };
    const C=(h)=>new THREE.Color(h);
    function cetacean(orca){
      const g=new THREE.Group();
      // body profile along x (tail at -2.2, snout at +2.0)
      const prof=orca? [[-2.2,.02],[-2.0,.1],[-1.6,.2],[-1.1,.38],[-.5,.6],[.1,.72],[.7,.7],[1.2,.6],[1.6,.46],[1.9,.28],[2.05,.08],[2.08,.0]]
                     : [[-2.2,.02],[-2.0,.08],[-1.6,.16],[-1.1,.3],[-.5,.48],[.1,.56],[.7,.52],[1.15,.42],[1.45,.3],[1.55,.2],[1.62,.12],[2.05,.08],[2.15,.04],[2.18,0]];
      const bg=lathe(prof,64); bg.scale(1,.92,.86);
      const back=orca?C(0x101216):C(0x5E7C96), belly=orca?C(0xF7F8FA):C(0xE4ECF2), mid=orca?C(0x101216):C(0x8EA8BC);
      paint(bg,(x,y,z,col)=>{ const ny=y/.7;
        if(orca){ col.copy(back);
          if(ny<-.18 && x>-1.2 && x<1.95) col.copy(belly);                       // white chin and belly
          if(x>-1.0 && x<-.2 && ny<.1 && ny>-.6 && Math.abs(z)>.35) col.copy(belly); // flank flare
          { const ex=(x-1.12)/.3, ey=(ny-.24)/.17; if(ex*ex+ey*ey<1 && Math.abs(z)>.25) col.copy(belly); } // eye patch
          if(x>-.7 && x<.05 && ny>.72) col.set(0x8C929C);                         // grey saddle
        } else { const k=THREE.MathUtils.smoothstep(ny,-.55,.35); col.copy(belly).lerp(mid,k).lerp(back,THREE.MathUtils.smoothstep(ny,.35,.95)); } });
      if(orca){ // crisp painted markings: lathe UV u = around the body (0.25 = belly, 0.75 = back), v = tail→snout
        const otex=tex(1024,512,(c,w,h)=>{ c.fillStyle="#0F1115"; c.fillRect(0,0,w,h); const Y=v=>(1-v)*h, X=u=>u*w;
          c.fillStyle="#F6F7F9";
          c.beginPath(); c.moveTo(X(.25),Y(.17)); c.bezierCurveTo(X(.34),Y(.3),X(.46),Y(.36),X(.44),Y(.5)); c.bezierCurveTo(X(.4),Y(.62),X(.4),Y(.8),X(.47),Y(.97));
          c.lineTo(X(.03),Y(.97)); c.bezierCurveTo(X(.1),Y(.8),X(.1),Y(.62),X(.06),Y(.5)); c.bezierCurveTo(X(.04),Y(.36),X(.16),Y(.3),X(.25),Y(.17)); c.fill();
          for(const u of [.9,.6]){ c.beginPath(); c.ellipse(X(u),Y(.79),w*.06,h*.085,-.25,0,7); c.fill(); }
          c.fillStyle="#7E848E"; c.beginPath(); c.ellipse(X(.75),Y(.44),w*.09,h*.06,0,0,7); c.fill(); });
        g.add(new THREE.Mesh(bg,new THREE.MeshPhysicalMaterial({map:otex,roughness:.3,clearcoat:.8,clearcoatRoughness:.2})));
      } else g.add(new THREE.Mesh(bg,skin()));
      const finM2=new THREE.MeshPhysicalMaterial({color:orca?0x101216:0x5E7C96,roughness:.32,clearcoat:.7});
      // dorsal fin: tall upright for the orca, curved sickle for the dolphin
      const dors=orca? curveFin([[-.45,0],[-.35,.9],[-.05,1.75],[.05,1.05],[.35,0]]) : curveFin([[-.55,0],[-.5,.45],[-.75,.82],[-.2,.55],[.25,0]]);
      const df=new THREE.Mesh(extr(dors,.07),finM2); df.position.set(orca?-.25:-.05,orca?.6:.45,0); g.add(df);
      // tail flukes
      const fl=curveFin([[0,0],[-.25,.45],[-.75,.9],[-.45,.3],[-.62,0],[-.45,-.3],[-.75,-.9],[-.25,-.45],[0,0]]);
      const fg=extr(fl,.05); fg.rotateX(Math.PI/2); const fk=new THREE.Mesh(fg,finM2); fk.position.set(-2.1,0,0); g.add(fk);
      // pectoral flippers
      for(const sz of [-1,1]){ const pf=new THREE.Mesh(extr(curveFin([[0,0],[-.2,-.25],[-.62,-.42],[-.25,-.1],[0,.05]]),.04),new THREE.MeshPhysicalMaterial({color:orca?0x101216:0x6F8BA3,roughness:.35,clearcoat:.6}));
        pf.position.set(.75,-.32,sz*.42); pf.rotation.set(sz*-.9,sz*.5,0); g.add(pf); }
      // eyes + blowhole
      for(const sz of [-1,1]){ const eye=new THREE.Mesh(new THREE.SphereGeometry(orca?.065:.045,10,8),new THREE.MeshPhysicalMaterial({color:0x0B0B0F,roughness:.1,clearcoat:1})); eye.position.set(orca?1.32:1.32,orca?.16:.05,sz*(orca?.43:.4)); g.add(eye); }
      const bh=new THREE.Mesh(new THREE.TorusGeometry(.05,.015,6,12),new THREE.MeshBasicMaterial({color:orca?0x2A2E36:0x3E5468})); bh.rotation.x=Math.PI/2; bh.position.set(.95,.62*(orca?1.05:.86),0); g.add(bh);
      if(!orca){ const smile=new THREE.Mesh(new THREE.TorusGeometry(.32,.012,4,20,1.0),new THREE.MeshBasicMaterial({color:0x2E3E4E})); smile.position.set(1.85,-.2,0); smile.rotation.set(Math.PI/2,0,-.2); g.add(smile); }
      g.scale.setScalar(orca?2.9:2.1); return g; }
    function flyingFish(){
      const g=new THREE.Group();
      const bg=lathe([[-1.0,.02],[-.8,.08],[-.4,.17],[.1,.22],[.5,.2],[.8,.14],[.95,.07],[1.0,0]],24); bg.scale(1,.85,.8);
      paint(bg,(x,y,z,col)=>{ const ny=y/.2; col.set(0xE9EEF3).lerp(C(0x3A7FD0),THREE.MathUtils.smoothstep(ny,-.25,.55)).lerp(C(0x1F4E9A),THREE.MathUtils.smoothstep(ny,.55,1)); });
      g.add(new THREE.Mesh(bg,skin({clearcoat:1,roughness:.2,metalness:.2})));
      const rayTex=tex(256,256,(c,w,h)=>{ c.fillStyle="rgba(170,215,245,.55)"; c.fillRect(0,0,w,h); c.strokeStyle="rgba(40,90,150,.75)"; c.lineWidth=3; for(let i=0;i<10;i++){ c.beginPath(); c.moveTo(0,h*.5); c.lineTo(w,h*(i/9)); c.stroke(); } });
      const wm=new THREE.MeshStandardMaterial({map:rayTex,transparent:true,side:THREE.DoubleSide,roughness:.4,depthWrite:false});
      const wings=[]; for(const sz of [-1,1]){ const sh=curveFin([[0,0],[-.25,sz*.9],[-.9,sz*1.35],[-1.05,sz*.7],[-.55,sz*.12],[-.3,0],[0,0]]);
        const wg=new THREE.ShapeGeometry(sh,10); const uv=wg.attributes.uv, pp=wg.attributes.position; for(let i=0;i<pp.count;i++) uv.setXY(i,-pp.getX(i)/1.05,.5+pp.getY(i)*sz*.37);
        const w=new THREE.Mesh(wg,wm); w.rotation.x=Math.PI/2; w.position.set(.35,.04,0); g.add(w); wings.push(w); }
      for(const sz of [-1,1]){ const pv=new THREE.Mesh(new THREE.ShapeGeometry(curveFin([[0,0],[-.15,sz*.35],[-.45,sz*.42],[-.25,sz*.1],[0,0]])),wm); pv.rotation.x=Math.PI/2; pv.position.set(-.35,-.08,0); g.add(pv); }
      const tail=new THREE.Mesh(new THREE.ShapeGeometry(curveFin([[0,0],[-.18,.17],[-.42,.32],[-.25,.03],[-.36,-.42],[-.14,-.2],[0,0]])),new THREE.MeshStandardMaterial({color:0x2E64B8,side:THREE.DoubleSide,roughness:.4})); tail.position.x=-.95; g.add(tail);
      for(const sz of [-1,1]){ const eye=new THREE.Mesh(new THREE.SphereGeometry(.05,10,8),new THREE.MeshPhysicalMaterial({color:0x111111,roughness:.1,clearcoat:1})); eye.position.set(.78,.04,sz*.12); g.add(eye); }
      g.userData.wings=wings; g.scale.setScalar(2.2); return g; }
    const fish=(kind)=>{ const g=kind==="flying"?flyingFish():cetacean(kind==="orca"); shadowy(g); g.visible=false; scene.add(g); return g; };
    /* spray: pooled droplets for creature splashes, surf on the beach and the dripping trail */
    const NP=1400; const pp=new Float32Array(NP*3).fill(-999), pv=new Float32Array(NP*3), pl=new Float32Array(NP);
    const pg=new THREE.BufferGeometry(); pg.setAttribute("position",new THREE.BufferAttribute(pp,3));
    const dropTex=tex(64,64,(c,w,h)=>{ const gr=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2); gr.addColorStop(0,"rgba(255,255,255,1)"); gr.addColorStop(.45,"rgba(240,250,255,.8)"); gr.addColorStop(1,"rgba(255,255,255,0)"); c.fillStyle=gr; c.fillRect(0,0,w,h); });
    const spray=new THREE.Points(pg,new THREE.PointsMaterial({map:dropTex,size:.55,transparent:true,depthWrite:false,opacity:.95,sizeAttenuation:true})); spray.frustumCulled=false; scene.add(spray);
    let pi=0; const emit=(x,y,z,vx,vy,vz,life)=>{ const i=pi; pi=(pi+1)%NP; pp[i*3]=x; pp[i*3+1]=y; pp[i*3+2]=z; pv[i*3]=vx; pv[i*3+1]=vy; pv[i*3+2]=vz; pl[i]=life; };
    const burst=(x,z,n,power,spread)=>{ for(let k=0;k<n;k++){ const a=Math.random()*Math.PI*2, r=Math.random()*spread; emit(x+Math.cos(a)*r*.4,-.3,z+Math.sin(a)*r*.4,Math.cos(a)*r*2.2,power*(.55+Math.random()*.7),Math.sin(a)*r*2.2,1.2+Math.random()*.6); } };
    const splashM=new THREE.MeshBasicMaterial({color:0xFFFFFF,transparent:true,opacity:0,depthWrite:false});
    const splashes=[]; for(let i=0;i<10;i++){ const sp=new THREE.Mesh(new THREE.RingGeometry(.6,1,32),splashM.clone()); sp.rotation.x=-Math.PI/2; sp.visible=false; scene.add(sp); splashes.push({m:sp,t:1}); }
    const splash=(x,z,big)=>{ burst(x,z,big?90:28,big?9:5,big?1.6:.8); const s=splashes.find(o=>o.t>=1); if(!s) return; s.m.position.set(x,-.25,z); s.t=0; s.big=big; s.m.visible=true; };
    let surfT=0;
    // leapers: dolphins and flying fish, near the island and far out to the horizon (far dolphins travel in pods)
    const jumpers=[]; const kinds=[["dolphin",0],["dolphin",0],["dolphin",0],["dolphin",1],["dolphin",1],["dolphin",1],["dolphin",1],["dolphin",1],["flying",0],["flying",0],["flying",1],["flying",1],["flying",1]];
    kinds.forEach(([k,far],i)=>{ const g=fish(k); if(far) g.scale.multiplyScalar(1.5); jumpers.push({k,far,g,t:1,wait:.5+i*.7,cfg:null}); });
    let pod=null;
    // orcas cruise at the surface: dorsal fin and back break the water, blow, then dip and swim on
    const orcas=[[134,.02,0],[118,.016,2.2],[124,.016,2.35],[165,-.012,4.4]].map(([r,sp,a0],i)=>{ const g=cetacean(true); shadowy(g); scene.add(g); return {g,r,sp,a:a0,ph:i*.37,blown:false,far:r>100}; });
    const camAz=()=>Math.atan2(camera.position.x-controls.target.x,camera.position.z-controls.target.z);
    function launch(j){ let x0,z0,dir; const now=performance.now();
      if(j.far&&j.k==="dolphin"){ if(!pod||now>pod.until){ const az=camAz()+(Math.random()-.5)*3.0, r=85+Math.random()*95; pod={x:Math.sin(az)*r,z:Math.cos(az)*r,dir:az+Math.PI/2*(Math.random()<.5?1:-1),until:now+7000}; }
        pod.x+=Math.sin(pod.dir)*6; pod.z+=Math.cos(pod.dir)*6; x0=pod.x+(Math.random()-.5)*10; z0=pod.z+(Math.random()-.5)*10; dir=pod.dir+(Math.random()-.5)*.2; }
      else { const az=camAz()+(Math.random()-.5)*(j.far?3.0:2.2); const r=j.far?80+Math.random()*100:38+Math.random()*20;
        x0=Math.sin(az)*r; z0=Math.cos(az)*r; dir=az+Math.PI/2*(Math.random()<.5?1:-1)+(Math.random()-.5)*.6; }
      const nearBr=(x,z)=>{ for(let k=0;k<=6;k++){ const px=x+Math.sin(dir)*28*k/6, pz=z+Math.cos(dir)*28*k/6; if(BRIDGES.some(br=>segDist(px,pz,br)<8)||coastR(px,pz)<36) return true; } return false; };
      for(let s=0;s<14&&(coastR(x0,z0)<38||coastR(x0+Math.sin(dir)*28,z0+Math.cos(dir)*28)<38||nearBr(x0,z0));s++){ x0=x0*1.15+ARCH_C.x*.0; z0=z0*1.15; }
      const fs=j.far?1.5:1; const L={dolphin:15,flying:32}[j.k]*fs, H={dolphin:6.5,flying:3.2}[j.k]*fs, T={dolphin:1.7,flying:2.8}[j.k]*(j.far?1.2:1);
      j.cfg={x0,z0,dx:Math.sin(dir),dz:Math.cos(dir),L,H,T}; j.t=0; j.g.visible=true; splash(x0,z0,j.k!=="flying"); }
    const api={picks, gullNow:()=>{ gullCD=0; }, gulls, mkDolphin:()=>cetacean(false), _orca(i){ const o=orcas[i]; return [o.g.position.x,o.g.position.y,o.g.position.z]; }, _pose(i,x,y,z,ry){ const j=jumpers[i]; j.t=2; j.wait=999; j.g.visible=true; j.g.position.set(x,y,z); j.g.rotation.set(0,ry,.15); j.g.userData.posed=true; }, update(dt,tt){
      const st=ENV.state(), night=ENV.night(), stormy=st.wx==="typhoon"||st.wx==="downpour", wave=ENV.wave();
      // crabs
      crabs.forEach(c=>{ const u=c.userData; if(u.held) return; if(u.pause>0){ u.pause-=dt; } else { u.a+=u.sp*dt*(stormy?0:1); if(Math.random()<.003) u.pause=1.5+Math.random()*3; }
        let x=Math.cos(u.a)*u.r, z=Math.sin(u.a)*u.r;
        // 寄居蟹不穿過任何東西:街區平台、樹、沙灘擺設、玩家佈置、吊橋、小麻與其他寄居蟹
        const blocked=Object.values(D3).some(d=>Math.hypot(d.c.x-x,d.c.z-z)<PR+.5)||trees.some(t=>t.visible&&Math.hypot(t.position.x-x,t.position.z-z)<1.5)||OBS.some(o=>Math.hypot(o.c.x-x,o.c.z-z)<o.r+.5)
          ||DECO_OBS.some(o=>Math.hypot(o.c.x-x,o.c.z-z)<o.r+.6)||BRIDGES.some(br=>segDist(x,z,br)<2.2)||Math.hypot(nurse.position.x-x,nurse.position.z-z)<1.7||crabs.some(o=>o!==c&&!o.userData.held&&Math.hypot(o.position.x-x,o.position.z-z)<1.6);
        if(blocked){ u.sp=-u.sp; u.a+=u.sp*dt*3; x=Math.cos(u.a)*u.r; z=Math.sin(u.a)*u.r; u.pause=Math.max(u.pause,.4); }
        c.position.set(x,TOP+(u.pause>0?0:Math.abs(Math.sin(tt*9))*.04),z); { const sg=Math.sign(u.sp); c.rotation.y=Math.atan2(-Math.sin(u.a)*sg,Math.cos(u.a)*sg); }
        u.legs.forEach(l=>{ l.lg.rotation.x=u.pause>0?0:Math.sin(tt*12+l.ph)*.35; }); });
      // gulls: daytime and fair weather only
      const gullOK=night<.5&&!stormy;
      // 海鷗的小任務:飛下來吃地上的垃圾(扣 0.1),或是停在小麻頭上啄一啄
      gullCD-=dt; if(gullOK&&gullCD<=0&&!gulls.some(b=>b.userData.job)){ gullCD=18+Math.random()*24;
        const lit=FALLEN.find(f=>litterFree(f)&&(f.userData.age||0)>8&&columnClear(f.position.x,f.position.z));
        const idle=mode==="idle"&&!walk&&!OFF&&!inHut&&!FISH&&!LOUNGE&&!bookEl&&!(ISL[3].room&&ISL[3].room.near(nurse.position.x,nurse.position.z));
        const b=gulls[Math.floor(Math.random()*gulls.length)], u=b.userData;
        if(lit) u.job={k:"eat",lit,phase:"go",t:0,from:b.position.clone()}; else if(idle&&Math.random()<.5&&columnClear(nurse.position.x,nurse.position.z)) u.job={k:"peck",phase:"go",t:0,from:b.position.clone()};
        if(u.job){ const P=u.job.k==="eat"?lit.position:nurse.position; u.job.dur=Math.min(4.5,Math.max(2,b.position.distanceTo(P)/14)); } }
      gulls.forEach(b=>{ const u=b.userData; b.visible=gullOK; if(!gullOK){ u.job=null; return; } u.a+=u.sp*dt; const x=Math.cos(u.a)*u.r, z=Math.sin(u.a)*u.r;
        if(u.job){ gullJob(b,u,dt,tt,new THREE.Vector3(x,u.h+Math.sin(tt*.7+u.ph)*1.2,z)); return; }
        if(viewIsl===3&&Math.hypot(x-ISL[3].c.x,z-ISL[3].c.z)<ISL[3].R+22){ b.visible=false; return; }   // 看手術室時,海鷗不從上面飛過
        b.position.set(x,u.h+Math.sin(tt*.7+u.ph)*1.2,z); { const sg=Math.sign(u.sp), dx=-Math.sin(u.a)*sg, dz=Math.cos(u.a)*sg; b.rotation.set(sg*.28,Math.atan2(-dz,dx),0,"YXZ"); }
        const flap=Math.sin(tt*6+u.ph)*.55; u.wings.forEach(w=>w.w.rotation.x=w.sz*flap); });
      // jumping sea life
      jumpers.forEach(j=>{ if(j.g.userData.posed) return; if(j.t>=1){ j.g.visible=false; j.wait-=dt; if(j.wait<=0 && !(stormy&&j.k==="flying")){ launch(j); } return; }
        const c=j.cfg; j.t+=dt/c.T; const t=Math.min(1,j.t); const y=-2.6+c.H*4*t*(1-t); const dy=c.H*4*(1-2*t);
        j.g.position.set(c.x0+c.dx*c.L*t, y+wave*.3, c.z0+c.dz*c.L*t); j.g.rotation.set(0,Math.atan2(-c.dz,c.dx),Math.atan2(dy,c.L)*.9);
        if(j.g.userData.wings) j.g.userData.wings.forEach((w,k)=>{ w.rotation.y=(k?1:-1)*Math.sin(tt*30)*.15; });
        if(j.t>=1){ splash(c.x0+c.dx*c.L,c.z0+c.dz*c.L,j.k!=="flying"); j.wait=j.far&&j.k==="dolphin"?.4+Math.random()*1.6:1.5+Math.random()*4; } });
      // cruising orcas
      orcas.forEach(o=>{ o.a+=o.sp*dt*(stormy?1.5:1); const x=Math.cos(o.a)*o.r, z=Math.sin(o.a)*o.r; const sg=Math.sign(o.sp), dx=-Math.sin(o.a)*sg, dz=Math.cos(o.a)*sg;
        const u=((tt/(o.far?11:9))+o.ph)%1; const up=u<.6?Math.sin(u/.6*Math.PI):0; const dup=u<.6?Math.cos(u/.6*Math.PI):0;
        const sea=waveH(x,z,tt,wave)-.7; o.g.position.set(x,sea-2.6+Math.min(1,up*1.25)*2.25+Math.sin(tt*1.3+o.ph*9)*.12,z); o.g.rotation.set(Math.sin(tt*.9+o.ph*5)*.04,Math.atan2(-dz,dx),dup*.07+up*.13);
        o.g.visible=true;
        if(u<.6 && up>.92 && !o.blown){ o.blown=true; for(let k=0;k<70;k++) emit(x+dx*3.2+(Math.random()-.5)*.6,sea+1.6,z+dz*3.2+(Math.random()-.5)*.6,(Math.random()-.5)*1.4,7+Math.random()*5,(Math.random()-.5)*1.4,1.4); }
        if(u>.5) o.blown=false;
        if(Math.random()<.55) emit(x-dx*4.5+(Math.random()-.5)*1.5,sea+.1,z-dz*4.5+(Math.random()-.5)*1.5,(Math.random()-.5)*.6,1.2+Math.random(),(Math.random()-.5)*.6,.6); });
      splashes.forEach(s=>{ if(s.t>=1){ s.m.visible=false; return; } s.t+=dt/1.1; const k=Math.min(1,s.t); s.m.scale.setScalar((s.big?1.2:.6)+k*(s.big?4:2)); s.m.material.opacity=.85*(1-k); });
      // droplets trailing a leaping animal
      jumpers.forEach(j=>{ if(j.t<1&&j.k!=="flying"&&Math.random()<.7){ const p=j.g.position; emit(p.x+(Math.random()-.5),p.y-.4,p.z+(Math.random()-.5),(Math.random()-.5)*.8,-.5,(Math.random()-.5)*.8,.7); } });
      // surf spray where rollers hit the beach (more in rough weather)
      surfT-=dt; if(surfT<=0){ surfT=.05/(.4+wave); const a=Math.random()*Math.PI*2, r=30.6+Math.random()*.9; const n=2+Math.round(wave*3);
        for(let k=0;k<n;k++) emit(Math.cos(a)*r+(Math.random()-.5)*.8,-.2,Math.sin(a)*r+(Math.random()-.5)*.8,Math.cos(a)*(.6+Math.random())*.8,2.2+Math.random()*2.4*(.5+wave*.4),Math.sin(a)*(.6+Math.random())*.8,.9+Math.random()*.4); }
      for(let i=0;i<NP;i++){ if(pl[i]<=0) continue; pl[i]-=dt; const j=i*3; pv[j+1]-=16*dt; pp[j]+=pv[j]*dt; pp[j+1]+=pv[j+1]*dt; pp[j+2]+=pv[j+2]*dt; if(pl[i]<=0||pp[j+1]<-1.2){ pl[i]=0; pp[j+1]=-999; } }
      pg.attributes.position.needsUpdate=true; spray.material.opacity=.95*(1-night*.5);
      HUT.lamp.intensity=night*3.5+(ENV.raining()?2:0); HUT.bellows.scale.y=.75+.35*(.5+.5*Math.sin(tt*1.26));
    }};
    return api;
  }
  const LIFE=buildLife();
  const STAR_GLOW=tex(64,64,(c,w,h)=>{ const g2=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2); g2.addColorStop(0,"rgba(255,255,255,1)"); g2.addColorStop(.3,"rgba(255,255,255,.55)"); g2.addColorStop(1,"rgba(255,255,255,0)"); c.fillStyle=g2; c.fillRect(0,0,w,h); });
  const BEACH=(()=>{ const DEC=[], anim=[], castles=[], rings=[], boards=[], vb={net:null}, boats=[], hearts=[]; let seed=4242; const rnd=()=>{ seed=(seed*16807)%2147483647; return (seed-1)/2147483646; };
    const free=(I,x,z,gap,dg=2.2)=>BRIDGES.every(br=>segDist(x,z,br)>5.6)&&Object.values(D3).every(d=>Math.hypot(d.c.x-x,d.c.z-z)>PR+dg)&&trees.every(t=>!t.visible||Math.hypot(t.position.x-x,t.position.z-z)>2.8)&&!(I.room&&I.room.near(x,z))&&DEC.every(q=>Math.hypot(q.x-x,q.z-z)>gap)
      &&LOUNGERS.every(l=>Math.hypot(l.position.x-x,l.position.z-z)>3.5)&&Math.hypot(x-HUT.pos.x,z-HUT.pos.z)>9;
    function spot(I,r0,r1,gap=3.2,dg=2.2,ok){ for(let k=0;k<400;k++){ const a=rnd()*Math.PI*2, r=r0+rnd()*(r1-r0); const x=I.c.x+Math.cos(a)*r, z=I.c.z+Math.sin(a)*r; if(free(I,x,z,gap,dg)&&(!ok||ok(x,z))){ DEC.push({x,z}); return {x,z,a}; } } return null; }
    const put=(o,sp,s=1)=>{ o.position.set(sp.x,TOP,sp.z); o.rotation.y=-sp.a+Math.PI/2; o.scale.multiplyScalar(s); shadowy(o); scene.add(o); addObs(o); return o; };
    const umbrella=(cols,h=3.4)=>{ const g=new THREE.Group(); const pole=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,h,8),M(0xF4EDE2)); pole.position.y=h/2; g.add(pole);
      const st=tex(512,64,(c,w,hh)=>{ cols.forEach((col,i)=>{ c.fillStyle=col; c.fillRect(i*w/cols.length,0,w/cols.length+1,hh); }); });
      const can=new THREE.Mesh(new THREE.ConeGeometry(1.9,.8,cols.length*2,1,true),new THREE.MeshStandardMaterial({map:st,side:THREE.DoubleSide,roughness:.7})); can.position.y=h; g.add(can);
      const knob=new THREE.Mesh(new THREE.SphereGeometry(.09,8,6),M(0xF4EDE2)); knob.position.y=h+.42; g.add(knob); g.rotation.z=.08; return g; };
    const towel=(c1,c2)=>{ const t=new THREE.Mesh(new THREE.BoxGeometry(1.3,.04,2.4),new THREE.MeshStandardMaterial({roughness:.9,map:tex(64,128,(c,w,h)=>{ for(let i=0;i<8;i++){ c.fillStyle=i%2?c1:c2; c.fillRect(0,i*h/8,w,h/8+1); } })})); t.position.y=.03; const g=new THREE.Group(); g.add(t); return g; };
    // ① 評估給藥島:藥局海灘 — 膠囊色陽傘、藥丸抱枕、浴巾
    { const I=ISL[0]; for(let i=0;i<4;i++){ const sp=spot(I,26.4,28.6,5); if(!sp) continue; const g=new THREE.Group(); g.add(umbrella(["#F28AA6","#FFFFFF","#7EC4CF","#FFFFFF"]));
        const tw=towel("#FFFFFF","#F6B7C8"); tw.position.set(1.2,0,.4); g.add(tw);
        const pill=new THREE.Group(); const c1=new THREE.Mesh(new THREE.CapsuleGeometry(.28,.6,6,12),M(0xF28AA6)); c1.rotation.z=Math.PI/2; pill.add(c1); pill.position.set(1.2,.3,1.3); g.add(pill); put(g,sp); } }
    // ② 器官系統島:珊瑚礁海灘 — 粉紅珊瑚、愛心石、潮池
    { const I=ISL[1]; const coral=(col)=>{ const g=new THREE.Group(); const m=M(col,{roughness:.6}); const br=(x,z,h,t)=>{ const c=new THREE.Mesh(new THREE.CylinderGeometry(.08,.14,h,6),m); c.position.set(x,h/2,z); c.rotation.set(t,0,t*.6); g.add(c); const b=new THREE.Mesh(new THREE.SphereGeometry(.14,8,6),m); b.position.set(x+Math.sin(t*.6)*h*.5,h,z-Math.sin(t)*h*.5); g.add(b); };
        br(0,0,1.4,0); br(.2,0,1.0,.5); br(-.2,.1,1.1,-.45); br(0,-.2,.8,.35); return g; };
      for(let i=0;i<7;i++){ const sp=spot(I,20.4,22.6,3); if(!sp) continue; put(coral([0xF27D8E,0xF6A07A,0xE86AA0,0xF5B0C0][i%4]),sp,1+rnd()*.5); }
      // 水潭 + 小船(可以坐上去、在船上釣魚)
      { const sp=spot(I,20.4,21.2,6,4.2); if(sp){ const g=new THREE.Group(); const R2=2.7; const pond=new THREE.Mesh(new THREE.CircleGeometry(R2,40),new THREE.MeshPhysicalMaterial({color:0x4FB8DC,roughness:.08,clearcoat:1,transparent:true,opacity:.9})); pond.rotation.x=-Math.PI/2; pond.position.y=.04; g.add(pond);
          for(let k=0;k<12;k++){ const a=k/12*Math.PI*2; const st=new THREE.Mesh(new THREE.DodecahedronGeometry(.4,0),M(0xB9AFA5,{flatShading:true})); st.position.set(Math.cos(a)*(R2+.15),.14,Math.sin(a)*(R2+.15)); g.add(st); }
          for(const [x,z] of [[-1.6,-1.2],[1.3,1.5]]){ const pad=new THREE.Mesh(new THREE.CircleGeometry(.35,16),M(0x6FB45A)); pad.rotation.x=-Math.PI/2; pad.position.set(x,.06,z); g.add(pad); }
          put(g,sp); const boat=new THREE.Group(); const hs=new THREE.Shape(); hs.moveTo(-.9,-.4); hs.lineTo(.6,-.4); hs.quadraticCurveTo(1.2,0,.6,.4); hs.lineTo(-.9,.4); hs.quadraticCurveTo(-1.05,0,-.9,-.4);
          const hull=new THREE.Mesh(new THREE.ExtrudeGeometry(hs,{depth:.35,bevelEnabled:true,bevelSize:.06,bevelThickness:.06,bevelSegments:2}),M(0xF2A65A,{roughness:.6})); hull.rotation.x=-Math.PI/2; boat.add(hull);
          const seat=new THREE.Mesh(new THREE.BoxGeometry(.25,.06,.7),M(0x8A5A32)); seat.position.set(-.2,.36,0); boat.add(seat); const rim=new THREE.Mesh(new THREE.BoxGeometry(1.6,.06,.86),M(0xFFFFFF)); rim.position.set(-.1,.4,0); boat.add(rim); rim.visible=false;
          boat.scale.setScalar(1.45); boat.position.set(g.position.x+1.0,TOP+.05,g.position.z); boat.userData={act:"boat",pond:g.position.clone(),R:R2-1.5,seat:new THREE.Vector3(-.2,.2,0)}; shadowy(boat); scene.add(boat); boats.push(boat); } }
      for(let i=0;i<2;i++){ const sp=spot(I,20.6,22.4,4); if(!sp) continue; const g=new THREE.Group(); const pool=new THREE.Mesh(new THREE.CircleGeometry(1.2,24),new THREE.MeshPhysicalMaterial({color:0x6CC9E6,roughness:.1,clearcoat:1,transparent:true,opacity:.85})); pool.rotation.x=-Math.PI/2; pool.position.y=.03; g.add(pool);
        for(let k=0;k<6;k++){ const a=k/6*Math.PI*2; const st=new THREE.Mesh(new THREE.DodecahedronGeometry(.32,0),M(0xB9AFA5,{flatShading:true})); st.position.set(Math.cos(a)*1.3,.12,Math.sin(a)*1.3); g.add(st); } put(g,sp); }
      for(let i=0;i<3;i++){ const sp=spot(I,20.6,22.6,3); if(!sp) continue; const hs=new THREE.Shape(); hs.moveTo(0,-.5); hs.bezierCurveTo(-.9,.1,-.5,.8,0,.35); hs.bezierCurveTo(.5,.8,.9,.1,0,-.5);
        const h=new THREE.Mesh(new THREE.ExtrudeGeometry(hs,{depth:.3,bevelEnabled:true,bevelSize:.08,bevelThickness:.08,bevelSegments:3}),M(0xE2575B,{roughness:.5})); h.position.y=.55; const g=new THREE.Group(); g.add(h); put(g,sp,1.1); g.userData.act="heart"; hearts.push(g); } }
    // ③ 術後疼痛照護島:熱帶度假 — 火把、扶桑花、遮陽傘
    { const I=ISL[2]; for(let i=0;i<4;i++){ const sp=spot(I,10.5,13.2,3); if(!sp) continue; const g=new THREE.Group(); const pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.11,2.6,8),M(0x8A5A32)); pole.position.y=1.3; g.add(pole);
        const cup=new THREE.Mesh(new THREE.CylinderGeometry(.22,.14,.4,10),M(0x6B4A2E)); cup.position.y=2.75; g.add(cup);
        const fl=new THREE.Mesh(new THREE.ConeGeometry(.2,.6,10),new THREE.MeshBasicMaterial({color:0xFFB347,transparent:true,opacity:.9})); fl.position.y=3.2; g.add(fl);
        const li=new THREE.PointLight(0xFF9A40,0,6,2); li.position.y=3.3; g.add(li); anim.push({fl,li,ph:rnd()*6,torch:true}); put(g,sp); }
      for(let i=0;i<4;i++){ const sp=spot(I,9.8,13.4,2.6); if(!sp) continue; const g=new THREE.Group(); const bush=new THREE.Mesh(new THREE.IcosahedronGeometry(.75,0),M(0x4E9A64,{flatShading:true})); bush.position.y=.6; g.add(bush);
        for(let k=0;k<5;k++){ const f=new THREE.Mesh(new THREE.SphereGeometry(.16,8,6),M([0xFF4F6E,0xFFB347,0xFF7AB6][k%3])); const a=k/5*Math.PI*2; f.position.set(Math.cos(a)*.6,.8+(k%2)*.3,Math.sin(a)*.6); g.add(f); } put(g,sp); }
      { const L=LOUNGERS; if(L.length===2){ const m=L[0].position.clone().add(L[1].position).multiplyScalar(.5); const u=umbrella(["#FFD94A","#FF7A8A","#FFD94A","#7EC4CF"],4.2); u.position.set(m.x,TOP,m.z); OBS.push({c:new THREE.Vector3(m.x,0,m.z),r:.55}); shadowy(u); scene.add(u); } } }
    // ④ 模擬開刀房島:救生站 — 救生員瞭望台、救生圈、救生浮板
    { const I=ISL[3]; const sp=spot(I,14.2,16.6,4); if(sp){ const g=new THREE.Group(); const wood=M(0xF4F4F2), red=M(0xE2463F);
        for(const [x,z] of [[-.9,-.9],[.9,-.9],[-.9,.9],[.9,.9]]){ const l=new THREE.Mesh(new THREE.CylinderGeometry(.1,.12,3.4,8),wood); l.position.set(x,1.7,z); l.rotation.set(z*.06,0,-x*.06); g.add(l); }
        const pl=new THREE.Mesh(new THREE.BoxGeometry(2.4,.18,2.4),red); pl.position.y=3.4; g.add(pl);
        const hut=new THREE.Mesh(new THREE.BoxGeometry(2.0,1.4,1.6),wood); hut.position.y=4.2; g.add(hut);
        const roof=new THREE.Mesh(new THREE.ConeGeometry(1.8,.9,4),red); roof.position.y=5.35; roof.rotation.y=Math.PI/4; g.add(roof);
        const cross=new THREE.Mesh(new THREE.PlaneGeometry(.9,.9),new THREE.MeshBasicMaterial({map:tex(64,64,(c,w,h)=>{ c.fillStyle="#fff"; c.fillRect(0,0,w,h); c.fillStyle="#E2463F"; c.fillRect(24,8,16,48); c.fillRect(8,24,48,16); })})); cross.position.set(0,4.2,.81); g.add(cross);
        const fp=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,2,6),M(0xC9CDD2)); fp.position.set(.9,6.2,0); g.add(fp);
        const fl=new THREE.Mesh(new THREE.PlaneGeometry(.9,.55),new THREE.MeshBasicMaterial({color:0xE2463F,side:THREE.DoubleSide})); fl.position.set(1.35,6.9,0); g.add(fl); anim.push({flag:fl,ph:0}); put(g,sp); }
      for(let i=0;i<3;i++){ const sp=spot(I,14.0,16.8,3); if(!sp) continue; const g=new THREE.Group(); const post=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,2.2,8),M(0x8A5A32)); post.position.y=1.1; g.add(post);
        const ring=new THREE.Mesh(new THREE.TorusGeometry(.5,.15,10,24),new THREE.MeshStandardMaterial({roughness:.5,map:tex(128,16,(c,w,h)=>{ for(let k=0;k<8;k++){ c.fillStyle=k%2?"#FFFFFF":"#E2463F"; c.fillRect(k*w/8,0,w/8+1,h); } })})); ring.position.set(0,1.5,.12); g.add(ring); put(g,sp); g.userData.act="ring"; g.userData.ring=ring; rings.push(g); }
      { const sp=spot(I,14.2,16.6,3); if(sp){ const g=new THREE.Group(); const b=new THREE.Mesh(new THREE.CapsuleGeometry(.4,2.4,6,12),M(0xE2463F)); b.rotation.x=Math.PI/2; b.scale.set(1,1,.25); b.position.y=.12; g.add(b);
        const cr=new THREE.Mesh(new THREE.PlaneGeometry(.5,.5),new THREE.MeshBasicMaterial({map:tex(64,64,(c,w,h)=>{ c.clearRect(0,0,w,h); c.fillStyle="#fff"; c.fillRect(24,6,16,52); c.fillRect(6,24,52,16); }),transparent:true})); cr.rotation.x=-Math.PI/2; cr.position.y=.24; g.add(cr); put(g,sp); } } }
    // ⑤ 專科照護島:親子海灘 — 沙堡、水桶鏟子、海灘球、彩虹陽傘
    { const I=ISL[4]; const sandM=M(0xEED3A6,{roughness:.95});
      for(let i=0;i<3;i++){ const sp=spot(I,18.4,22.8,4,7); if(!sp) continue; const g=new THREE.Group(); const base=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.25,.7,16),sandM); base.position.y=.35; g.add(base);
        for(const [x,z] of [[-.6,-.6],[.6,-.6],[-.6,.6],[.6,.6]]){ const t=new THREE.Mesh(new THREE.CylinderGeometry(.28,.32,.9,10),sandM); t.position.set(x,1.1,z); g.add(t); const c=new THREE.Mesh(new THREE.ConeGeometry(.34,.4,10),sandM); c.position.set(x,1.75,z); g.add(c); }
        const kp=new THREE.Mesh(new THREE.CylinderGeometry(.42,.48,1.3,12),sandM); kp.position.y=1.3; g.add(kp); const fl=new THREE.Mesh(new THREE.PlaneGeometry(.45,.28),new THREE.MeshBasicMaterial({color:[0xD45D86,0x4FA3E0,0x7E9A2E][i],side:THREE.DoubleSide})); fl.position.set(.22,2.45,0); g.add(fl);
        const st=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.7,5),M(0x8A5A32)); st.position.y=2.25; g.add(st); anim.push({flag:fl,ph:i}); put(g,sp); g.userData.act="castle"; castles.push(g); }
      for(let i=0;i<3;i++){ const sp=spot(I,19.4,22.6,3); if(!sp) continue; const g=new THREE.Group();
        const ball=new THREE.Mesh(new THREE.SphereGeometry(.55,24,16),new THREE.MeshStandardMaterial({roughness:.4,map:tex(256,64,(c,w,h)=>{ ["#FF5A5F","#FFFFFF","#FFD23F","#FFFFFF","#3FA9F5","#FFFFFF"].forEach((col,k)=>{ c.fillStyle=col; c.fillRect(k*w/6,0,w/6+1,h); }); })})); ball.position.y=.55; g.add(ball);
        const bk=new THREE.Mesh(new THREE.CylinderGeometry(.35,.28,.55,14,1,true),M([0x4FA3E0,0xFF8A3D,0x7FD07A][i],{side:THREE.DoubleSide})); bk.position.set(1.1,.28,.2); g.add(bk);
        const sh=new THREE.Mesh(new THREE.BoxGeometry(.08,.05,.9),M(0xFFD23F)); sh.position.set(1.5,.05,-.3); sh.rotation.y=.6; g.add(sh); put(g,sp); }
      for(let i=0;i<2;i++){ const sp=spot(I,19.6,22.4,5); if(!sp) continue; put(umbrella(["#FF8A8A","#FFC46B","#FFE97A","#8EDC9A","#7EC4F2","#B9A2F0"],3.6),sp); } }
    // ⑥ 重症安全島:燈塔岩岸 — 紅白燈塔、礁岩、警示浮標
    { const I=ISL[5]; let beam=null, lamp=null; const sp=spot(I,16.4,18.6,6); if(sp){ const g=new THREE.Group();
        const body=new THREE.Mesh(new THREE.CylinderGeometry(.9,1.4,7.5,24),new THREE.MeshStandardMaterial({roughness:.5,map:tex(64,256,(c,w,h)=>{ for(let k=0;k<6;k++){ c.fillStyle=k%2?"#FFFFFF":"#D9414B"; c.fillRect(0,k*h/6,w,h/6+1); } })})); body.position.y=3.75; g.add(body);
        const gal=new THREE.Mesh(new THREE.CylinderGeometry(1.25,1.25,.2,24),M(0x2E3440)); gal.position.y=7.6; g.add(gal);
        const glass=new THREE.Mesh(new THREE.CylinderGeometry(.75,.75,1.1,16),new THREE.MeshPhysicalMaterial({color:0xFFF6C8,emissive:0xFFE08A,emissiveIntensity:.4,transparent:true,opacity:.85,roughness:.1})); glass.position.y=8.25; g.add(glass);
        const cap=new THREE.Mesh(new THREE.ConeGeometry(.95,.8,16),M(0xD9414B)); cap.position.y=9.2; g.add(cap);
        lamp=new THREE.PointLight(0xFFE7A0,0,40,2); lamp.position.y=8.25; g.add(lamp);
        beam=new THREE.Mesh(new THREE.ConeGeometry(1.6,18,20,1,true),new THREE.MeshBasicMaterial({color:0xFFF3C0,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending})); beam.rotation.z=Math.PI/2; beam.position.set(9,0,0);
        const bp=new THREE.Group(); bp.position.y=8.25; bp.add(beam); g.add(bp); anim.push({beamPivot:bp,beam,lamp,glass}); put(g,sp,1.1); }
      for(let i=0;i<6;i++){ const s2=spot(I,17,19.6,2.6); if(!s2) continue; const g=new THREE.Group(); for(let k=0;k<3;k++){ const r=new THREE.Mesh(new THREE.DodecahedronGeometry(.5+rnd()*.6,0),M([0x8E8A86,0x9EA3A8,0x7A7570][k],{flatShading:true,roughness:.9})); r.position.set((rnd()-.5)*1.4,.3,(rnd()-.5)*1.4); r.rotation.set(rnd()*3,rnd()*3,0); g.add(r); } put(g,s2); }
      for(let i=0;i<4;i++){ const a=i/4*Math.PI*2+.4; const x=I.c.x+Math.cos(a)*(I.R+6), z=I.c.z+Math.sin(a)*(I.R+6); const g=new THREE.Group();
        const b=new THREE.Mesh(new THREE.CylinderGeometry(.35,.55,1.0,12),M(i%2?0xFFB020:0xE2463F)); b.position.y=.5; g.add(b); const t=new THREE.Mesh(new THREE.ConeGeometry(.3,.6,10),M(0xFFFFFF)); t.position.y=1.3; g.add(t);
        const li=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),new THREE.MeshBasicMaterial({color:0xFF5A3C})); li.position.y=1.7; g.add(li); g.position.set(x,0,z); scene.add(g); anim.push({buoy:g,x,z,ph:i*1.3,li}); } }
    // ⑦ 專科手術島:運動海灘 — 衝浪板、沙灘排球網、浴巾
    { const I=ISL[6];
      // 衝浪板不要擋在橋頭和路牌前面:離每座橋至少 10
      const offBridge=(x,z)=>BRIDGES.every(br=>segDist(x,z,br)>10);
      for(let i=0;i<3;i++){ const sp=spot(I,10.6,13.2,3.2,2.2,offBridge)||spot(I,10.6,13.2,3.2); if(!sp) continue; const g=new THREE.Group(); const sup=i===2;
        const bs=new THREE.Shape(); bs.moveTo(0,-1.5); bs.quadraticCurveTo(.55,-1.2,.5,0); bs.quadraticCurveTo(.45,1.1,0,1.6); bs.quadraticCurveTo(-.45,1.1,-.5,0); bs.quadraticCurveTo(-.55,-1.2,0,-1.5);
        const bd=new THREE.Mesh(new THREE.ExtrudeGeometry(bs,{depth:.1,bevelEnabled:true,bevelSize:.04,bevelThickness:.04,bevelSegments:2}),M([0xFF8A5B,0x4FB3E0,0xFFD24F][i],{roughness:.35})); bd.position.y=1.45; bd.rotation.y=Math.PI/2; bd.rotation.x=-.12; g.add(bd);
        const st=new THREE.Mesh(new THREE.BoxGeometry(.06,2.6,.02),M(0xFFFFFF)); st.position.set(.12,1.5,0); st.rotation.y=Math.PI/2; st.rotation.x=-.12; g.add(st);
        if(sup){ bd.scale.y=1.3; bd.position.y=1.9; st.scale.y=1.3; st.position.y=1.95;   // 第三塊是 SUP 立槳板:比較長,旁邊靠一支槳
          const pd=new THREE.Group(); const sh=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,3.4,8),M(0x3A3F46)); sh.position.y=1.7; pd.add(sh);
          const bl=new THREE.Mesh(new THREE.BoxGeometry(.05,.8,.36),M(0x2FA7C9,{roughness:.4})); bl.position.y=.4; pd.add(bl); const gr=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.3,8),M(0x3A3F46)); gr.rotation.x=Math.PI/2; gr.position.y=3.4; pd.add(gr);
          pd.position.set(0,0,.85); pd.rotation.x=-.1; g.add(pd); g.userData.paddle=pd; }
        put(g,sp); g.userData.act="board"; g.userData.kind=sup?"sup":"surf"; g.userData.bd=[bd,st]; boards.push(g); }
      { const sp=spot(I,9.8,12.4,5); if(sp){ const g=new THREE.Group(); const pm=M(0xF4F4F2);
          for(const x of [-2.6,2.6]){ const p=new THREE.Mesh(new THREE.CylinderGeometry(.07,.08,2.6,8),pm); p.position.set(x,1.3,0); g.add(p); }
          const net=new THREE.Mesh(new THREE.PlaneGeometry(5.2,.8),new THREE.MeshStandardMaterial({side:THREE.DoubleSide,transparent:true,roughness:.9,map:tex(256,40,(c,w,h)=>{ c.clearRect(0,0,w,h); c.strokeStyle="#334"; c.lineWidth=1.5; for(let x=0;x<w;x+=10){ c.beginPath(); c.moveTo(x,0); c.lineTo(x,h); c.stroke(); } for(let y=0;y<h;y+=10){ c.beginPath(); c.moveTo(0,y); c.lineTo(w,y); c.stroke(); } c.fillStyle="#fff"; c.fillRect(0,0,w,5); })}));
          net.position.y=2.15; g.add(net);
          const ball=new THREE.Mesh(new THREE.SphereGeometry(.28,18,12),M(0xFFF3C4,{roughness:.5})); ball.position.set(1.1,.28,1.4); g.add(ball); put(g,sp); g.userData.act="vball"; g.userData.ball=ball; g.userData.ballHome=ball.position.clone(); vb.net=g; } }
      for(let i=0;i<2;i++){ const sp=spot(I,10.4,13,3); if(!sp) continue; const g=new THREE.Group(); const tw=towel(["#4FB3E0","#FF8A5B"][i],"#FFFFFF"); tw.position.y=.02; g.add(tw); put(g,sp); } }
    // 每座島都加:花圃、長椅、路燈(晚上會亮)、青苔石、野餐墊,還有白天的蝴蝶、晚上的螢火蟲
    { const flowerCols=[0xFF6F91,0xFFD23F,0xFFFFFF,0xB28DFF,0xFF9F43,0x7EC4F2], stemM=M(0x4E9A64), woodM=M(0xB07A4A,{roughness:.8}), ironM=M(0x3A4048,{roughness:.5});
      const bulbM=()=>new THREE.MeshStandardMaterial({color:0xFFF4D0,emissive:0xFFC864,emissiveIntensity:0,roughness:.3});
      const range=I=>{ const r0=I.ring?I.ring+1:PR+2.5; return [r0,Math.max(r0+1,I.R-2.2)]; };
      const okI=I=>I.i===0?((x,z)=>{ const r=Math.hypot(x,z); return r>9.5&&r<26.5&&!(z>-4&&Math.abs(x)<z*1.4+10); }):null;
      const bed=(k)=>{ const g=new THREE.Group(); const soil=new THREE.Mesh(new THREE.CylinderGeometry(.95,1.05,.16,16),M(0x8A6A4A,{roughness:1})); soil.position.y=.08; g.add(soil);
        const ring=new THREE.Mesh(new THREE.TorusGeometry(1.0,.1,6,20),M(0xE8DCC8)); ring.rotation.x=Math.PI/2; ring.position.y=.14; g.add(ring);
        for(let i=0;i<11;i++){ const a=i*2.4+k, r=i?.25+(i%3)*.22:0, h=.35+(i%4)*.08; const st=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,h,4),stemM); st.position.set(Math.cos(a)*r,.15+h/2,Math.sin(a)*r); g.add(st);
          const fl=new THREE.Mesh(new THREE.IcosahedronGeometry(.12,0),M(flowerCols[(i+k)%flowerCols.length],{flatShading:true})); fl.position.set(Math.cos(a)*r,.18+h,Math.sin(a)*r); fl.scale.y=.7; g.add(fl); } return g; };
      const bench=()=>{ const g=new THREE.Group(); for(let i=0;i<3;i++){ const sl=new THREE.Mesh(new THREE.BoxGeometry(1.9,.07,.17),woodM); sl.position.set(0,.6,-.22+i*.2); g.add(sl); }
        for(let i=0;i<2;i++){ const bk=new THREE.Mesh(new THREE.BoxGeometry(1.9,.15,.06),woodM); bk.position.set(0,.85+i*.22,-.36); bk.rotation.x=-.15; g.add(bk); }
        for(const x of [-.82,.82]){ const leg=new THREE.Mesh(new THREE.BoxGeometry(.08,.6,.55),ironM); leg.position.set(x,.3,-.05); g.add(leg); const bl=new THREE.Mesh(new THREE.BoxGeometry(.08,.6,.06),ironM); bl.position.set(x,.95,-.38); g.add(bl); } return g; };
      const lamp=()=>{ const g=new THREE.Group(); const p=new THREE.Mesh(new THREE.CylinderGeometry(.05,.08,2.3,8),ironM); p.position.y=1.15; g.add(p);
        const base=new THREE.Mesh(new THREE.CylinderGeometry(.16,.2,.16,8),ironM); base.position.y=.08; g.add(base);
        const b=new THREE.Mesh(new THREE.SphereGeometry(.2,12,10),bulbM()); b.position.y=2.42; g.add(b); const cap=new THREE.Mesh(new THREE.ConeGeometry(.24,.18,8),ironM); cap.position.y=2.66; g.add(cap);
        const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:STAR_GLOW,color:0xFFD27A,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0})); halo.scale.set(1.8,1.8,1); halo.position.y=2.42; g.add(halo);
        anim.push({lampB:b,halo}); return g; };
      const rocks=()=>{ const g=new THREE.Group(); for(let k=0;k<3;k++){ const r=new THREE.Mesh(new THREE.DodecahedronGeometry(.32+k*.12,0),M([0xA8A29A,0x9AA0A5,0xB5ADA2][k],{flatShading:true,roughness:.9})); r.position.set(k*.42-.4,.18+k*.05,(k%2)*.3); r.rotation.set(k,k*2,0); g.add(r);
          const moss=new THREE.Mesh(new THREE.SphereGeometry(.2+k*.05,8,6,0,Math.PI*2,0,Math.PI/2),M(0x6FA552,{roughness:1})); moss.position.set(r.position.x,r.position.y+.2+k*.07,r.position.z); moss.scale.y=.4; g.add(moss); } return g; };
      const picnic=(k)=>{ const g=new THREE.Group(); const cl=new THREE.Mesh(new THREE.BoxGeometry(1.8,.03,1.8),new THREE.MeshStandardMaterial({roughness:.9,map:tex(64,64,(c,w,h)=>{ c.fillStyle="#fff"; c.fillRect(0,0,w,h); c.fillStyle=["rgba(226,70,63,.75)","rgba(79,163,224,.75)"][k%2]; for(let i=0;i<8;i+=2){ c.fillRect(i*8,0,8,h); c.fillRect(0,i*8,w,8); } })})); cl.position.y=.02; g.add(cl);
        const bk=new THREE.Mesh(new THREE.CylinderGeometry(.3,.25,.35,10),M(0xC9954F,{roughness:.9})); bk.position.set(.45,.2,.4); g.add(bk); const hd=new THREE.Mesh(new THREE.TorusGeometry(.22,.03,6,12,Math.PI),M(0xA77B3E)); hd.position.set(.45,.38,.4); g.add(hd);
        const wm=new THREE.Mesh(new THREE.SphereGeometry(.4,16,10,0,Math.PI*2,0,Math.PI/2),M(0x3E8E41)); wm.rotation.x=Math.PI; wm.position.set(-.45,.4,-.3); g.add(wm);
        const fl=new THREE.Mesh(new THREE.CircleGeometry(.39,16),M(0xF2545B)); fl.rotation.x=-Math.PI/2; fl.position.set(-.45,.41,-.3); g.add(fl);
        for(let i=0;i<2;i++){ const cup=new THREE.Mesh(new THREE.CylinderGeometry(.08,.06,.18,10),M([0xFFD23F,0x7EC4F2][i])); cup.position.set(-.1+i*.25,.12,.55); g.add(cup); } return g; };
      ISL.forEach(I=>{ const [r0,r1]=range(I), ok=okI(I);
        for(let i=0;i<4;i++){ const sp=spot(I,r0,r1,3,2.2,ok); if(sp) put(bed(i+I.i),sp,.9+rnd()*.3); }
        for(let i=0;i<3;i++){ const sp=spot(I,r0,r1,4,2.4,ok); if(sp) put(lamp(),sp); }
        for(let i=0;i<2;i++){ const sp=spot(I,r0,r1,3,2.2,ok); if(sp) put(rocks(),sp,1+rnd()*.4); }
        { const sp=spot(I,r0,r1,4,2.6,ok); if(sp) put(bench(),sp); }
        if(I.i!==3){ const sp=spot(I,r0,r1,4.5,2.8,ok); if(sp) put(picnic(I.i),sp); } });
      // 蝴蝶(白天)與螢火蟲(晚上):繞著各島飛
      const wingG=new THREE.PlaneGeometry(.22,.16); wingG.translate(.11,0,0);
      ISL.forEach(I=>{ const [r0,r1]=range(I); for(let i=0;i<4;i++){ const g=new THREE.Group(); const col=[0xFFB5D8,0xFFE27A,0x9FD8FF,0xD7B8FF][(i+I.i)%4];
          const wm=new THREE.MeshStandardMaterial({color:col,side:THREE.DoubleSide,roughness:.6}); const L=new THREE.Mesh(wingG,wm), R=new THREE.Mesh(wingG,wm); R.rotation.y=Math.PI; g.add(L); g.add(R);
          const bd=new THREE.Mesh(new THREE.CapsuleGeometry(.02,.12,4,6),M(0x333333)); bd.rotation.x=Math.PI/2; g.add(bd); scene.add(g);
          anim.push({fly:g,L,R,c:I.c,r:r0+rnd()*(r1-r0),a:rnd()*6,sp:(.15+rnd()*.2)*(i%2?1:-1),ph:rnd()*6}); }
        for(let i=0;i<6;i++){ const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:STAR_GLOW,color:0xD8FF7A,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0})); sp.scale.set(.45,.45,1); scene.add(sp);
          anim.push({ffly:sp,c:I.c,r:r0+rnd()*(r1-r0),a:rnd()*6,sp:.08+rnd()*.1,ph:rnd()*6}); } }); }
    return {castles, rings, boards, vb, boats, hearts, update(dt,tt){ const night=ENV.night();
      anim.forEach(o=>{ if(o.torch){ const f=1+Math.sin(tt*14+o.ph)*.12+Math.sin(tt*23+o.ph)*.08; o.fl.scale.set(f,f*(1.1+night*.3),f); o.li.intensity=night*3*f; }
        if(o.flag) o.flag.rotation.y=Math.sin(tt*5+o.ph)*.4;
        if(o.beamPivot){ o.beamPivot.rotation.y=tt*.8; o.beam.material.opacity=night*.22; o.lamp.intensity=night*6; o.glass.material.emissiveIntensity=.4+night*1.6; }
        if(o.lampB){ o.lampB.material.emissiveIntensity=night*2.2; o.halo.material.opacity=night*.8; }
        if(o.fly){ o.fly.visible=night<.5; if(o.fly.visible){ o.a+=o.sp*dt; const x=o.c.x+Math.cos(o.a)*o.r+Math.sin(tt*.7+o.ph)*1.2, z=o.c.z+Math.sin(o.a)*o.r+Math.cos(tt*.6+o.ph)*1.2; o.fly.position.set(x,TOP+1.1+Math.sin(tt*2.3+o.ph)*.35,z); o.fly.rotation.y=-o.a+(o.sp>0?0:Math.PI); const f=Math.sin(tt*18+o.ph)*1.1; o.L.rotation.y=f; o.R.rotation.y=Math.PI-f; } }
        if(o.ffly){ o.a+=o.sp*dt; o.ffly.position.set(o.c.x+Math.cos(o.a)*o.r+Math.sin(tt*.5+o.ph),TOP+.8+Math.sin(tt*1.3+o.ph)*.5,o.c.z+Math.sin(o.a)*o.r+Math.cos(tt*.4+o.ph)); o.ffly.material.opacity=night*(.4+.6*Math.max(0,Math.sin(tt*2.2+o.ph))); o.ffly.visible=night>.05; }
        if(o.buoy){ const y=waveH(o.x,o.z,tt,ENV.wave())-.7; o.buoy.position.y=y-.2; o.buoy.rotation.set(Math.sin(tt*1.3+o.ph)*.15,0,Math.cos(tt*1.1+o.ph)*.15); o.li.material.color.setHex(Math.sin(tt*3+o.ph)>.6?0xFFE0A0:0xFF5A3C); } }); } }; })();

  /* ================= 海邊背景音效(Web Audio 即時合成,不需下載音檔;預設關閉,可隨時切換) ================= */
  const SOUND=(()=>{
    let ac=null, master=null, monBus=null, flatG=null, orAuto=false, orMute=false, nextClink=3, nextSuck=8, nextBeep=0, nextAlarm=.4, on=false, nodes=null, nextWave=0, nextGull=2, nextDol=6, nextRainTick=0, nextDrop=0, nextGust=0;
    let pref=false; try{ pref=localStorage.getItem("island-sound")==="on"; }catch(e){}
    const btn=$("sndToggle");
    function ui(){ btn.textContent=on?"🔊 音效開":"🔇 音效關"; btn.setAttribute("aria-pressed",on); }
    function noiseBuf(sec,pink){ const n=Math.floor(ac.sampleRate*sec), F=Math.floor(ac.sampleRate*1.5), raw=new Float32Array(n+F); let b0=0,b1=0,b2=0;
      for(let i=0;i<n+F;i++){ const w=Math.random()*2-1; if(pink){ b0=.99765*b0+w*.099046; b1=.963*b1+w*.2965164; b2=.57*b2+w*1.0526913; raw[i]=(b0+b1+b2+w*.1848)*.18; } else raw[i]=w; }
      const b=ac.createBuffer(1,n,ac.sampleRate), d=b.getChannelData(0);
      for(let i=0;i<n;i++){ if(i<F){ const k=i/F; d[i]=raw[i]*Math.sin(k*Math.PI/2)+raw[n+i]*Math.cos(k*Math.PI/2); } else d[i]=raw[i]; } return b; }
    function loop(buf){ const s=ac.createBufferSource(); s.buffer=buf; s.loop=true; s.start(0,Math.random()*buf.duration); return s; }
    function chain(src,...ns){ let x=src; ns.forEach(n=>{ x.connect(n); x=n; }); return x; }
    function init(){
      // iPhone 靜音開關:把網頁聲音設成「播放媒體」,才不會被靜音模式一起關掉(Safari 16.4 以上支援)
      try{ if(navigator.audioSession) navigator.audioSession.type="playback"; }catch(e){}
      ac=new (window.AudioContext||window.webkitAudioContext)(); master=ac.createGain(); master.gain.value=0; master.connect(ac.destination);
      // 生理監視器的聲音走另一條線,不受海邊音量影響
      monBus=ac.createGain(); monBus.gain.value=0; monBus.connect(ac.destination);
      { const o=ac.createOscillator(); o.type="sine"; o.frequency.value=520; flatG=ac.createGain(); flatG.gain.value=0; o.connect(flatG); flatG.connect(monBus); o.start(); }
      const pink=noiseBuf(14,true), white=noiseBuf(8,false);
      // 開刀房的背景聲:空調送風的低沉嗡嗡聲、出風口的細細氣流聲(走在 monBus 上,只有在手術室裡才聽得到)
      { const f=ac.createBiquadFilter(); f.type="lowpass"; f.frequency.value=220; const g=ac.createGain(); g.gain.value=.16; chain(loop(pink),f,g,monBus);
        const h=ac.createBiquadFilter(); h.type="highpass"; h.frequency.value=2600; const hg=ac.createGain(); hg.gain.value=.008; chain(loop(white),h,hg,monBus);
        const o=ac.createOscillator(); o.type="sine"; o.frequency.value=100; const og=ac.createGain(); og.gain.value=.012; o.connect(og); og.connect(monBus); o.start(); }
      // surf bed + rolling waves
      const bedG=ac.createGain(); bedG.gain.value=.25; const bf=ac.createBiquadFilter(); bf.type="lowpass"; bf.frequency.value=300; const swellA=ac.createGain(); swellA.gain.value=.6; chain(loop(pink),bf,swellA,bedG,master);
      // two slow, unsynchronised swells make the sea rise and fall
      [[.05,.08],[.031,.06]].forEach(([f,d])=>{ const o=ac.createOscillator(); o.frequency.value=f; const og=ac.createGain(); og.gain.value=d; o.connect(og); og.connect(swellA.gain); o.start(); });
      { const o=ac.createOscillator(); o.frequency.value=.09; const og=ac.createGain(); og.gain.value=40; o.connect(og); og.connect(bf.frequency); o.start(); }
      const wf=ac.createBiquadFilter(); wf.type="lowpass"; wf.frequency.value=520; const waveG=ac.createGain(); waveG.gain.value=0; chain(loop(pink),wf,waveG,master);
      // wind
      const wb=ac.createBiquadFilter(); wb.type="bandpass"; wb.frequency.value=420; wb.Q.value=.7; const windG=ac.createGain(); windG.gain.value=0; chain(loop(pink),wb,windG,master);
      // rain hiss
      const filt=(type,f,q)=>{ const x=ac.createBiquadFilter(); x.type=type; x.frequency.value=f; if(q) x.Q.value=q; return x; };
      // light rain: soft, airy patter
      const lightG=ac.createGain(); lightG.gain.value=0; chain(loop(white),filt("bandpass",3200,.6),filt("lowpass",5500),lightG,master);
      // heavy rain: dense, full-bodied roar + sizzle on the sand
      const heavyG=ac.createGain(); heavyG.gain.value=0; chain(loop(pink),filt("bandpass",1100,.45),heavyG,master);
      const sizzleG=ac.createGain(); sizzleG.gain.value=0; chain(loop(white),filt("highpass",2200),filt("lowpass",7000),sizzleG,master);
      // storm gust layer + howl for the typhoon
      const gustF=filt("bandpass",380,.8), gustG=ac.createGain(); gustG.gain.value=0; chain(loop(pink),gustF,gustG,master);
      const howlF=filt("bandpass",620,7), howlG=ac.createGain(); howlG.gain.value=0; chain(loop(pink),howlF,howlG,master);
      const rainG=lightG;
      // gulls / thunder bus
      const fx=ac.createGain(); fx.gain.value=1; fx.connect(master);
      nodes={bedG,waveG,wf,windG,wb,rainG,lightG,heavyG,sizzleG,gustF,gustG,howlF,howlG,fx,pink,white};
    }
    // one soft breaker: low swell → muffled wash on the sand → gentle retreat (all low-passed pink noise, nothing sharp)
    function wave(strength){ const s0=Math.min(1.3,strength), t=ac.currentTime+.05, tc=t+1.4+Math.random()*.8;
      const pan=ac.createStereoPanner?ac.createStereoPanner():null; const out=ac.createGain(); out.gain.value=.7;
      if(pan){ pan.pan.value=Math.random()*1.0-.5; out.connect(pan); pan.connect(master); } else out.connect(master);
      const src=()=>{ const x=ac.createBufferSource(); x.buffer=nodes.pink; x.loop=true; x.start(t,Math.random()*3); x.stop(tc+7); return x; };
      const lp=(f)=>{ const x=ac.createBiquadFilter(); x.type="lowpass"; x.frequency.value=f; x.Q.value=.3; return x; };
      // swell building
      { const f=lp(200), g=ac.createGain(); f.frequency.setValueAtTime(180,t); f.frequency.linearRampToValueAtTime(480,tc);
        g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(.2*s0,tc); g.gain.linearRampToValueAtTime(.001,tc+1.2); chain(src(),f,g,out); }
      // soft thud
      { const f=lp(130), g=ac.createGain(); g.gain.setValueAtTime(0,tc); g.gain.linearRampToValueAtTime(.45*s0,tc+.12); g.gain.exponentialRampToValueAtTime(.001,tc+1.0); chain(src(),f,g,out); }
      // wash spreading up the sand
      { const f=lp(850), g=ac.createGain(); f.frequency.setValueAtTime(850,tc); f.frequency.exponentialRampToValueAtTime(300,tc+2.6);
        g.gain.setValueAtTime(0,tc); g.gain.linearRampToValueAtTime(.24*s0,tc+.35); g.gain.exponentialRampToValueAtTime(.05*s0,tc+1.6); g.gain.exponentialRampToValueAtTime(.001,tc+3.2); chain(src(),f,g,out); }
      // water sliding back
      { const L=2.4+Math.random()*1.2, f=lp(600), g=ac.createGain(); f.frequency.setValueAtTime(600,tc+1.2); f.frequency.exponentialRampToValueAtTime(220,tc+1.2+L);
        g.gain.setValueAtTime(0,tc+1.0); g.gain.linearRampToValueAtTime(.07*s0,tc+1.6); g.gain.exponentialRampToValueAtTime(.001,tc+1.6+L); chain(src(),f,g,out); }
      return (tc-t)+3.6+Math.random()*3.5-Math.min(1.5,strength*.6); }
    function gull(pan){ const t0=ac.currentTime+.05, n=2+Math.floor(Math.random()*3), base=900+Math.random()*350;
      const p=ac.createStereoPanner?ac.createStereoPanner():null; const out=ac.createGain(); out.gain.value=.16+Math.random()*.08; if(p){ p.pan.value=pan; out.connect(p); p.connect(nodes.fx); } else out.connect(nodes.fx);
      for(let i=0;i<n;i++){ const t=t0+i*(.32+Math.random()*.12), d=.24+Math.random()*.1;
        const o=ac.createOscillator(); o.type="sawtooth"; const o2=ac.createOscillator(); o2.type="triangle";
        const bp=ac.createBiquadFilter(); bp.type="bandpass"; bp.Q.value=3.5; const g=ac.createGain(); g.gain.value=0;
        const f0=base*(1+Math.random()*.1); [o,o2].forEach((x,k)=>{ x.frequency.setValueAtTime(f0*(k?1.005:1),t); x.frequency.linearRampToValueAtTime(f0*1.9,t+d*.25); x.frequency.exponentialRampToValueAtTime(f0*.7,t+d); });
        bp.frequency.setValueAtTime(f0*2,t); bp.frequency.linearRampToValueAtTime(f0*2.6,t+d*.3);
        g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(1,t+.025); g.gain.linearRampToValueAtTime(.55,t+d*.5); g.gain.exponentialRampToValueAtTime(.001,t+d);
        // a little vibrato for the "laughing" call
        const lfo=ac.createOscillator(); lfo.frequency.value=22+Math.random()*8; const lg=ac.createGain(); lg.gain.value=f0*.04; lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
        o.connect(bp); o2.connect(bp); bp.connect(g); g.connect(out); [o,o2,lfo].forEach(x=>{ x.start(t); x.stop(t+d+.05); }); } }
    function dolphin(pan){ const t0=ac.currentTime+.05; const p=ac.createStereoPanner?ac.createStereoPanner():null; const out=ac.createGain(); out.gain.value=.05+Math.random()*.03;
      if(p){ p.pan.value=pan; out.connect(p); p.connect(nodes.fx); } else out.connect(nodes.fx);
      const n=1+Math.floor(Math.random()*3);
      for(let i=0;i<n;i++){ const t=t0+i*(.45+Math.random()*.35), d=.35+Math.random()*.45, f0=3200+Math.random()*1800;
        const o=ac.createOscillator(); o.type="sine"; const g=ac.createGain(); g.gain.value=0;
        const shape=Math.floor(Math.random()*3);
        o.frequency.setValueAtTime(f0,t);
        if(shape===0){ o.frequency.exponentialRampToValueAtTime(f0*1.8,t+d*.7); o.frequency.exponentialRampToValueAtTime(f0*1.4,t+d); }
        else if(shape===1){ o.frequency.exponentialRampToValueAtTime(f0*1.6,t+d*.35); o.frequency.exponentialRampToValueAtTime(f0*.9,t+d*.7); o.frequency.exponentialRampToValueAtTime(f0*1.5,t+d); }
        else { o.frequency.exponentialRampToValueAtTime(f0*2.1,t+d); }
        const v=ac.createOscillator(); v.frequency.value=9+Math.random()*6; const vg=ac.createGain(); vg.gain.value=f0*.03; v.connect(vg); vg.connect(o.frequency);
        g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(1,t+.04); g.gain.setValueAtTime(1,t+d-.06); g.gain.linearRampToValueAtTime(0,t+d);
        o.connect(g); g.connect(out); [o,v].forEach(x=>{ x.start(t); x.stop(t+d+.05); }); }
      // echolocation click train
      if(Math.random()<.7){ const tc=t0+n*.6, m=8+Math.floor(Math.random()*14), gap=.025+Math.random()*.03;
        for(let k=0;k<m;k++){ const t=tc+k*gap*(1-k/(m*2)); const s=ac.createBufferSource(); s.buffer=nodes.white; const hp=ac.createBiquadFilter(); hp.type="bandpass"; hp.frequency.value=3500; hp.Q.value=1.2; const g=ac.createGain();
          g.gain.setValueAtTime(.7,t); g.gain.exponentialRampToValueAtTime(.001,t+.008); s.connect(hp); hp.connect(g); g.connect(out); s.start(t,Math.random()*2); s.stop(t+.012); } } }
    // a single raindrop tapping (drizzle)
    function drop(){ const t=ac.currentTime+.01; const s=ac.createBufferSource(); s.buffer=nodes.white; const bp=ac.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=1800+Math.random()*2200; bp.Q.value=4;
      const g=ac.createGain(); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(.05+Math.random()*.05,t+.003); g.gain.exponentialRampToValueAtTime(.001,t+.05);
      const p=ac.createStereoPanner?ac.createStereoPanner():null; if(p){ p.pan.value=Math.random()*1.6-.8; s.connect(bp); bp.connect(g); g.connect(p); p.connect(master); } else { s.connect(bp); bp.connect(g); g.connect(master); }
      s.start(t,Math.random()*5); s.stop(t+.07); }
    // one big gust of typhoon wind
    function gust(){ const t=ac.currentTime, up=1+Math.random()*1.2, hold=.6+Math.random()*1.2, down=1.8+Math.random()*1.6, pk=.16+Math.random()*.12;
      const g=nodes.gustG.gain, f=nodes.gustF.frequency; g.cancelScheduledValues(t); g.setValueAtTime(g.value,t); g.linearRampToValueAtTime(pk,t+up); g.setValueAtTime(pk,t+up+hold); g.linearRampToValueAtTime(.03,t+up+hold+down);
      f.cancelScheduledValues(t); f.setValueAtTime(f.value,t); f.linearRampToValueAtTime(650+Math.random()*250,t+up); f.linearRampToValueAtTime(320,t+up+hold+down); }
    // thunder: sometimes a close sharp crack, always a long rolling rumble
    function thunder(){ const near=Math.random()<.45, t=ac.currentTime+(near?.12:.6+Math.random()*1.4);
      const p=ac.createStereoPanner?ac.createStereoPanner():null; const out=ac.createGain(); out.gain.value=near?1.0:.75; if(p){ p.pan.value=Math.random()*1.2-.6; out.connect(p); p.connect(nodes.fx); } else out.connect(nodes.fx);
      if(near){ const s=ac.createBufferSource(); s.buffer=nodes.pink; const bp=ac.createBiquadFilter(); bp.type="lowpass"; bp.frequency.setValueAtTime(2400,t); bp.frequency.exponentialRampToValueAtTime(400,t+.5);
        const g=ac.createGain(); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(.7,t+.015); g.gain.exponentialRampToValueAtTime(.001,t+.7); s.connect(bp); bp.connect(g); g.connect(out); s.start(t,Math.random()*5); s.stop(t+.8); }
      const s=ac.createBufferSource(); s.buffer=nodes.pink; const lp=ac.createBiquadFilter(); lp.type="lowpass"; lp.frequency.setValueAtTime(700,t); lp.frequency.exponentialRampToValueAtTime(70,t+5.5);
      const g=ac.createGain(); const L=5+Math.random()*2.5; g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(1.1,t+(near?.1:.5));
      for(let i=1;i<6;i++){ const tt=t+i*L/7; g.gain.linearRampToValueAtTime((1.1-i*.16)*(.7+Math.random()*.5),tt); }
      g.gain.exponentialRampToValueAtTime(.001,t+L);
      s.connect(lp); lp.connect(g); g.connect(out); s.start(t,Math.random()*5); s.stop(t+L+.1); }
    // 一聲監視器嗶聲
    // 呼吸器打氣聲:吸氣時「咻—」加一聲輕微的機械聲,吐氣時較輕的回氣聲
    let ventBuf=null;
    function ventSound(inh){ const t=ac.currentTime; ventBuf=ventBuf||noiseBuf(2,true); const src=ac.createBufferSource(); src.buffer=ventBuf; src.playbackRate.value=inh?1.15:.85;
      const f=ac.createBiquadFilter(); f.type="bandpass"; f.frequency.value=inh?650:420; f.Q.value=.9; const g=ac.createGain(); const dur=inh?1.1:1.5, vol=inh?.13:.08;
      g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+.2); g.gain.linearRampToValueAtTime(vol*.6,t+dur*.7); g.gain.linearRampToValueAtTime(0,t+dur);
      src.connect(f); f.connect(g); g.connect(monBus); src.start(t,Math.random()*.5); src.stop(t+dur+.05);
      if(inh){ const o=ac.createOscillator(); o.type="sine"; o.frequency.setValueAtTime(140,t); o.frequency.exponentialRampToValueAtTime(70,t+.08); const og=ac.createGain(); og.gain.setValueAtTime(.045,t); og.gain.exponentialRampToValueAtTime(.001,t+.1); o.connect(og); og.connect(monBus); o.start(t); o.stop(t+.12); } }
    // 器械台上金屬器械輕碰的「叮」、遠處抽吸管的「嘶——」
    function clink(){ const t=ac.currentTime+.02, p=ac.createStereoPanner?ac.createStereoPanner():null, out=ac.createGain(); out.gain.value=.05+Math.random()*.04; if(p){ p.pan.value=Math.random()*1.4-.7; out.connect(p); p.connect(monBus); } else out.connect(monBus);
      const n=1+Math.floor(Math.random()*2); for(let j=0;j<n;j++){ const t0=t+j*(.09+Math.random()*.1); [2350,3720,5480].forEach((f,i)=>{ const o=ac.createOscillator(); o.type="sine"; o.frequency.value=f*(1+Math.random()*.03); const g=ac.createGain(); g.gain.setValueAtTime(0,t0); g.gain.linearRampToValueAtTime(1/(i+1),t0+.003); g.gain.exponentialRampToValueAtTime(.001,t0+.25+i*.05); o.connect(g); g.connect(out); o.start(t0); o.stop(t0+.4); }); } }
    function suction(){ const t=ac.currentTime+.02, L=.8+Math.random()*1.4, s=ac.createBufferSource(); s.buffer=nodes.white; const f=ac.createBiquadFilter(); f.type="bandpass"; f.frequency.value=1300+Math.random()*600; f.Q.value=1.8; const g=ac.createGain();
      g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(.025,t+.15); g.gain.setValueAtTime(.025,t+L); g.gain.linearRampToValueAtTime(0,t+L+.25); s.connect(f); f.connect(g); g.connect(monBus); s.start(t,Math.random()*4); s.stop(t+L+.3); }
    function blip(f,dur,vol,delay){ const t=ac.currentTime+(delay||0); const o=ac.createOscillator(); o.type="sine"; o.frequency.value=f; const g=ac.createGain(); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+.008); g.gain.setValueAtTime(vol,t+dur-.02); g.gain.linearRampToValueAtTime(0,t+dur); o.connect(g); g.connect(monBus); o.start(t); o.stop(t+dur+.02); }
    async function setOn(v,keep){ on=v; ui(); if(!keep) try{ localStorage.setItem("island-sound",on?"on":"off"); }catch(e){}
      if(on){ if(!ac) init(); if(ac.state==="suspended") await ac.resume(); master.gain.setTargetAtTime(.75,ac.currentTime,.6); nextWave=0; }
      else if(ac){ master.gain.setTargetAtTime(0,ac.currentTime,.25); monBus.gain.setTargetAtTime(0,ac.currentTime,.1); } }
    const inOR=()=>!!(ISL[3].room&&ISL[3].room.inside(nurse.position));
    // 自己按音效鈕:在手術室裡關掉就維持關掉(直到走出手術室),不再自動打開
    btn.onclick=()=>{ if(inOR()) orMute=on; orAuto=false; setOn(!on); };
    // 瀏覽器規定點一下才能出聲:上次有開音效的人,第一次點畫面就自動開;iPhone 要在 touchend/click 才算數,所以三種都聽
    const UNLOCK=["pointerdown","touchend","click"];
    if(pref){ const first=()=>{ UNLOCK.forEach(ev=>window.removeEventListener(ev,first,true)); if(!on) setOn(true); }; UNLOCK.forEach(ev=>window.addEventListener(ev,first,true)); }
    // 切到別的 App 再回來,iPhone 會把聲音暫停(狀態變成 suspended/interrupted):下一次點畫面或回到網頁時自動恢復
    const wake=()=>{ if(on&&ac&&ac.state!=="running"){ try{ if(navigator.audioSession) navigator.audioSession.type="playback"; }catch(e){} ac.resume().catch(()=>{}); } };
    UNLOCK.forEach(ev=>window.addEventListener(ev,wake,true));
    // 離開麻醉誘島(切到別的分頁或 App、螢幕鎖定、關掉網頁):島的聲音全部停掉;回來後才恢復
    const sleep=()=>{ try{ if(ac&&ac.state==="running") ac.suspend(); }catch(e){} try{ if(window.speechSynthesis) speechSynthesis.cancel(); }catch(e){} };
    document.addEventListener("visibilitychange",()=>{ if(document.hidden) sleep(); else wake(); });
    window.addEventListener("pagehide",sleep); window.addEventListener("pageshow",()=>{ if(!document.hidden) wake(); });
    ui();
    ENV.onBolt=()=>{ if(on&&ac) thunder(); };
    // 拉著點滴架跳舞時唱一小段(原創的簡單旋律)
    function sing(){ if(!on||!ac||ac.state!=="running") return; const N=[659,784,880,784,659,587,659,784,1047,988,880,784,659,587,523,587,659]; const L=[.3,.3,.3,.3,.6,.3,.3,.6,.3,.3,.3,.3,.6,.3,.3,.3,.9];
      let t=ac.currentTime+.05; N.forEach((f,i)=>{ const o=ac.createOscillator(), o2=ac.createOscillator(), g=ac.createGain(); o.type="triangle"; o2.type="sine"; o.frequency.value=f; o2.frequency.value=f*2; const d=L[i];
        g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(.16,t+.03); g.gain.setValueAtTime(.12,t+d*.7); g.gain.linearRampToValueAtTime(0,t+d*.95);
        const g2=ac.createGain(); g2.gain.value=.25; o.connect(g); o2.connect(g2); g2.connect(g); g.connect(ac.destination); o.start(t); o2.start(t); o.stop(t+d); o2.stop(t+d); t+=d; }); }
    return {sing, update(dt){
      // 小麻一走進模擬手術室,音效自動打開並換成開刀房的聲音;走出手術室,恢復原本(沒開音效的人就再關掉)
      { const io=inOR(); if(!io) orMute=false;
        if(io&&!on&&!orMute&&!document.hidden){ orAuto=true; setOn(true,true); }
        else if(!io&&orAuto){ orAuto=false; if(on) setOn(false,true); } }
      if(!on||!ac||ac.state!=="running") return;
      { // 走進模擬手術室:海邊的聲音淡出,改成監視器的心跳嗶聲(音調跟著 SpO₂)、警報與心跳停止的長音
        const inOr=!!(ISL[3].room&&ISL[3].room.inside(nurse.position)), kk=ac.currentTime;
        master.gain.setTargetAtTime(inOr?0:.75,kk,.4); monBus.gain.setTargetAtTime(inOr?.55:0,kk,.15);
        if(inOr){ const v=OR.get(), flat=v.rhythm==="asystole"||v.hr<1, vf=v.rhythm==="vf"; flatG.gain.setTargetAtTime(flat?.2:0,kk,.04);
          if(!flat&&!vf){ nextBeep-=dt; if(nextBeep<=0){ nextBeep=60/Math.max(30,v.hr); blip(Math.max(330,Math.min(880,440+(v.spo2-80)*22)),.09,.24); } } else nextBeep=0;
          { const V=OR.vent; if(V.ev){ ventSound(V.ev==="in"); V.ev=null; } }
          nextClink-=dt; if(nextClink<=0){ nextClink=5+Math.random()*10; clink(); }
          nextSuck-=dt; if(nextSuck<=0){ nextSuck=12+Math.random()*16; suction(); }
          if(v.alarm&&!flat){ nextAlarm-=dt; if(nextAlarm<=0){ nextAlarm=vf?1.1:2.6; [0,.17,.34].forEach(d=>blip(vf?1150:960,.11,.15,d)); } } else nextAlarm=.4;
          return; }
        flatG.gain.setTargetAtTime(0,kk,.04); }
      const st=ENV.state(), c=ENV.curState(), night=c.night||0, rain=Math.min(1,(c.rain||0)/6000), wind=c.wind||0, A=ENV.wave();
      const k=ac.currentTime;
      nodes.bedG.gain.setTargetAtTime(.2+A*.07,k,.8); nodes.waveG.gain.setTargetAtTime(.045+A*.025,k,2);
      const wx=st.wx, typh=wx==="typhoon", down=wx==="downpour", driz=wx==="drizzle";
      nodes.windG.gain.setTargetAtTime(typh?.07:down?.025:0,k,1.5); nodes.wb.frequency.setTargetAtTime(260+wind*120+Math.sin(k*.7)*50*wind,k,.5);
      // three different rains
      nodes.lightG.gain.setTargetAtTime(driz?.035:(down||typh)?.02:0,k,1.5);
      const gustNow=typh?(.75+.45*Math.max(0,Math.sin(k*.9)*Math.sin(k*.37+1))):1;
      nodes.heavyG.gain.setTargetAtTime(typh?.30*gustNow:down?.26:0,k,typh?.4:1.5);
      nodes.sizzleG.gain.setTargetAtTime(typh?.07*gustNow:down?.06:driz?.006:0,k,typh?.4:1.5);
      if(driz){ nextDrop-=dt; if(nextDrop<=0){ nextDrop=.08+Math.random()*.35; drop(); } }
      // typhoon: roaring gusts and a howl that rise and fall
      if(typh){ nextGust-=dt; if(nextGust<=0){ nextGust=3+Math.random()*4; gust(); } nodes.howlG.gain.setTargetAtTime(.03+.03*Math.max(0,Math.sin(k*.6)),k,.8); nodes.howlF.frequency.setTargetAtTime(520+220*Math.sin(k*.45),k,.6); }
      else { nodes.gustG.gain.setTargetAtTime(0,k,1); nodes.howlG.gain.setTargetAtTime(0,k,1); nextGust=0; }
      const gullsOK=night<.5&&!["downpour","typhoon"].includes(st.wx);
      nextDol-=dt; if(nextDol<=0){ nextDol=gullsOK?(9+Math.random()*14):5; if(gullsOK) dolphin(Math.random()*1.4-.7); }
      nextGull-=dt; if(nextGull<=0){ nextGull=gullsOK?(4+Math.random()*9):3; if(gullsOK) gull(Math.random()*1.6-.8); }
    }};
  })();


  /* ---------- labels, picking, animation ---------- */
  const v=new THREE.Vector3();
  function placeLabels(){
    const w=stage.clientWidth,h=stage.clientHeight;
    for(const d of Object.values(D3)){ v.set(d.c.x,TOP+PH+12.2,d.c.z).project(camera);
      d.lb.style.transform=`translate(${(v.x*.5+.5)*w}px,${(-v.y*.5+.5)*h}px) translate(-50%,-100%)`;
      d.lb.classList.toggle("off", v.z>1 || focus===d.sid || (focus && closeUp)); }
  }
  const ray=new THREE.Raycaster(), ptr=new THREE.Vector2(); const groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-TOP), gHit=new THREE.Vector3();
  let downAt=null, hovered=null, hintK=null;
  // 沙灘上（點了小麻會走過去的地方）的游標：藍色光球
  const WALK_CURSOR=`url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><defs><radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#EBF7FF" stop-opacity="1"/><stop offset=".16" stop-color="#96D2FF" stop-opacity=".98"/><stop offset=".38" stop-color="#469BF5" stop-opacity=".7"/><stop offset=".62" stop-color="#3C8CF0" stop-opacity=".25"/><stop offset="1" stop-color="#3C8CF0" stop-opacity="0"/></radialGradient></defs><circle cx="22" cy="22" r="22" fill="url(#g)"/></svg>')}") 22 22, grab`;
  const pick=(e)=>{ const r=renderer.domElement.getBoundingClientRect(); ptr.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1); ray.setFromCamera(ptr,camera);
    const hits=ray.intersectObjects([...clickables,...Object.values(D3).flatMap(d=>Object.values(d.books)),...Object.values(D3).filter(d=>d.shelf&&d.shelf.visible).map(d=>d.shelf),IV.g,STOOL.g,...LOUNGERS,...trees.filter(t=>t.visible),...LIFE.picks.filter(m=>m.visible),...BURIED.list.filter(m=>m.visible),...DRIFT.list.filter(m=>m.visible),...TURTLES.list.map(T=>T.g),...FALLEN.filter(m=>m.visible),...BEACH.castles,...BEACH.rings,...BEACH.boards,...BEACH.boats,...BEACH.hearts,...(CARRY?[]:[]),...(BEACH.vb.net?[BEACH.vb.net]:[]),...(FOUNTAIN?[FOUNTAIN]:[]),...(ORB.g.visible?[ORB.core]:[]),...SIGNS,nurse],true); for(const h of hits){ if(h.object.isSprite && h.object.material.opacity<.4) continue; { let hid=false, q=h.object; while(q){ if(!q.visible){ hid=true; break; } q=q.parent; } if(hid) continue; } let o=h.object; while(o&&!o.userData.sys&&!o.userData.topic&&!o.userData.shelf&&!o.userData.iv&&!o.userData.stool&&!o.userData.lounger&&!o.userData.act&&!o.userData.orb&&!o.userData.nurseHit&&o.userData.isl===undefined) o=o.parent; if(o) return o; } return null; };
  renderer.domElement.addEventListener("pointerdown",e=>{ downAt=[e.clientX,e.clientY]; });
  renderer.domElement.addEventListener("pointerup",e=>{ $("tip3").hidden=true; if(!downAt) return; const moved=Math.hypot(e.clientX-downAt[0],e.clientY-downAt[1]); downAt=null; if(moved>6) return;
    if(DECO.mode){ decoClick(e); return; }
    const o=pick(e); if(OFF&&o&&(o.userData.sys||o.userData.shelf)){ const sid=o.userData.sys||o.userData.shelf; offEnd(()=>goDistrict(sid)); return; } if(o&&o.userData.isl!==undefined){ goIsland(o.userData.isl); return; } if(OFF) return; if(o&&o.userData.nurseHit){ if(FISH) return; if(hasSkill("dance")) dance(); else lockMsg("dance"); return; } if(o&&o.userData.orb){ useOrb(); return; } const mouse=e.pointerType==="mouse";
    if(o&&o.userData.stool){ if(onStool){ toggleStool(); return; } hideOrb(); if(!hasSkill("stool")){ lockMsg("stool"); return; } toggleStool(); return; }
    if(o&&o.userData.iv){ if(holdIV){ toggleIV(); return; } hideOrb(); if(!hasSkill("iv")){ lockMsg("iv"); return; } toggleIV(); return; }
    if(o&&o.userData.lounger){ if(LOUNGE&&LOUNGE.g===o){ loungeEnd(); return; } hideOrb(); lounge(o); return; }
    if(o&&o.userData.act){ if(OFF) return; hideOrb(); actOn(o.userData.act,o); return; } if(!o){ if(ray.ray.intersectPlane(groundPlane,gHit)) walkHere(gHit.clone()); return; } if(o.userData.topic){ const tt0=byId[o.userData.topic]; if(e.pointerType!=="mouse" && tt0 && tt0.sys===focus) openShelfMenu(focus); else openFromShelf(o.userData.topic); } else if(o.userData.shelf){ if(o.userData.shelf===focus) openShelfMenu(focus); else goDistrict(o.userData.shelf); } else if(o.userData.sys){ if(o.userData.sys===focus && D3[focus].rise>.9) openShelfMenu(focus); else goDistrict(o.userData.sys); } });
  renderer.domElement.addEventListener("pointerleave",()=>{ if(ORB.hover) hideOrb(); if(hintK){ hintK=null; setHud(); } });
  renderer.domElement.addEventListener("pointermove",e=>{ if(e.pointerType!=="mouse") return; if(DECO.mode){ renderer.domElement.style.cursor=DECO.mode==="remove"?"not-allowed":"crosshair"; if(DECO.mode==="remove"&&decoHit(e)) renderer.domElement.style.cursor="pointer"; return; } const o=pick(e);
    { const k=o&&(o.userData.iv?"iv":o.userData.stool?"stool":o.userData.lounger?"lounge":o.userData.act||null); const busy=(k==="iv"&&holdIV)||(k==="stool"&&onStool)||(k==="lounge"&&LOUNGE&&LOUNGE.g===o);
      const plain=!!k; /* 可互動的東西都用手指游標表示,不顯示光球,只顯示提示文字 */
      if(k&&!busy&&!OFF&&plain){ if(ORB.hover) hideOrb(); $("hint").textContent=HOVER_TXT[k]; hintK=k; }
      else{ if(hintK){ hintK=null; setHud(); }
        if(k&&!busy&&!OFF){ if(ORB.obj!==o||!ORB.g.visible) showOrb(k,o,true); else ORB.t=0; }
        else if(ORB.hover&&!(o&&o.userData.orb)) hideOrb(); } } renderer.domElement.style.cursor=o?"pointer":WALK_CURSOR;
    { const tip=$("tip3"); let sid=o&&o.userData.sys; if(!sid&&o&&o.userData.topic) sid=null; if(sid&&sid!==focus){ const r=stage.getBoundingClientRect(); tip.hidden=false; tip.textContent=sysById[sid].name; tip.style.setProperty("--c",`var(--${sid})`); tip.style.left=(e.clientX-r.left)+"px"; tip.style.top=(e.clientY-r.top)+"px"; } else tip.hidden=true; }
    if(hovered!==o){ if(hovered&&hovered.userData.topic) hovered.userData.hover=false; hovered=o; if(o&&o.userData.topic) o.userData.hover=true; } });

  let viewIsl=0; let mode="idle", focus=null, target=null, walk=null, camTween=null, openId=null, pendingBook=null;
  const groundY=(x,z)=>{ for(const d of Object.values(D3)) if(Math.hypot(d.c.x-x,d.c.z-z)<PR-.2) return TOP+PH;
    for(const br of BRIDGES){ const t=bridgeT(br,x,z); if(t>-.01&&t<1.01&&segDist(x,z,br)<3.4) return deckY(t,br.h); } return TOP; };
  function tweenCam(pos,tgt,dur){ camTween={p0:camera.position.clone(),t0:controls.target.clone(),p1:pos.clone(),t1:tgt.clone(),s:performance.now(),d:dur}; controls.enabled=false; }
  function distView(sid){ const d=D3[sid]; const u=d.u.clone(); const tall=(d.rows||1)>1;
    const narrow=stage.clientWidth/stage.clientHeight<1; const back=(narrow?17.5:16)+(tall?4.5:0), up=(narrow?7.6:6.2)+(tall?2.6:0); const perp=new THREE.Vector3(-u.z,0,u.x);
    const side=narrow?0:.6;
    return {pos:d.c.clone().addScaledVector(u,-back).addScaledVector(perp,side).add(new THREE.Vector3(0,TOP+up,0)), tgt:d.c.clone().addScaledVector(u,narrow?-.4:.6).addScaledVector(perp,side).add(new THREE.Vector3(0,TOP+(narrow?2.4:2.9)+(tall?2.4:0),0))}; }
  // leave a district by stepping inward alongside the bookcase, so she never walks through furniture
  // walk around the central hut on a ring, never through it
  const RR=7.6;
  function islandAt(p){ let best=ISL[0], bd=1e9; for(const I of ISL){ const d=Math.hypot(p.x-I.c.x,p.z-I.c.z)-I.R; if(d<bd){ bd=d; best=I; } } return best; }
  const ringPt=(I,a)=>new THREE.Vector3(I.c.x+Math.cos(a)*I.ring,0,I.c.z+Math.sin(a)*I.ring);
  function arcI(I,a0,a1){ let d=a1-a0; while(d>Math.PI) d-=2*Math.PI; while(d<-Math.PI) d+=2*Math.PI; const n=Math.max(1,Math.ceil(Math.abs(d)/.35)); const out=[]; for(let i=1;i<=n;i++) out.push(ringPt(I,a0+d*i/n)); return out; }
  function within(I,from,to){ const T=new THREE.Vector3(to.x,0,to.z);
    if(I.room){ const R=I.room; T.copy(R.fixTarget(T,from)); const V=(p)=>R.viaFor(p)?[R.via.clone()]:[];
      // 起點、終點各在哪裡:手術室裡(走門)、恢復室裡(走前面開口)、外面;中間沿牆外繞
      const kind=(p)=>R.inside(p)?"or":R.inPacu(p)?"pacu":"out", ka=kind(from), kb=kind(T);
      if(ka===kb&&ka!=="out") return [T];
      const exit=ka==="or"?[...V(from),R.doorIn.clone(),R.doorOut.clone()]:ka==="pacu"?[R.pacuFront.clone()]:[];
      const enter=kb==="or"?[R.doorOut.clone(),R.doorIn.clone(),...V(T)]:kb==="pacu"?[R.pacuFront.clone()]:[];
      const p0=exit.length?exit[exit.length-1]:from, p1=enter.length?enter[0]:T;
      return [...exit,...R.around(p0,p1),...enter,T]; }
    if(!I.ring) return [T];
    const fx=from.x-I.c.x, fz=from.z-I.c.z, tx=to.x-I.c.x, tz=to.z-I.c.z, abx=tx-fx, abz=tz-fz, L2=abx*abx+abz*abz||1;
    const k=Math.max(0,Math.min(1,-(fx*abx+fz*abz)/L2)); const near=Math.hypot(fx+abx*k,fz+abz*k), lim=I.i===0?4.9:I.ring-1.0;
    if(near>=lim && Math.hypot(tx,tz)>=lim && Math.hypot(fx,fz)>=lim) return [T];
    const a0=Math.atan2(fz,fx), a1=Math.atan2(tz,tx); return [ringPt(I,a0),...arcI(I,a0,a1),T]; }
  function pathTo(to){ const out=[]; let from=nurse.position.clone();
    if(inHut){ out.push(HUT.door.clone()); from=HUT.door.clone(); inHut=false; }
    const A=islandAt(from), B=islandAt(to);
    if(A===B) return out.concat(within(A,from,to));
    const ends=(A,B)=>{ const br=BRIDGES.find(b=>(b.i===A.i&&b.j===B.i)||(b.i===B.i&&b.j===A.i)); return br?(br.i===A.i?[br.a,br.b]:[br.b,br.a]):null; };
    const e=ends(A,B); if(e) return out.concat(within(A,from,e[0]),[e[1].clone()],within(B,e[1],to));
    const H=ISL[0], e1=ends(A,H), e2=ends(H,B);
    return out.concat(within(A,from,e1[0]),[e1[1].clone()],within(H,e1[1],e2[0]),[e2[1].clone()],within(B,e2[1],to)); }
  function arc(a0,a1){ let d=a1-a0; while(d>Math.PI) d-=2*Math.PI; while(d<-Math.PI) d+=2*Math.PI; const n=Math.max(1,Math.ceil(Math.abs(d)/.35)); const out=[]; for(let i=1;i<=n;i++){ const a=a0+d*i/n; out.push(new THREE.Vector3(Math.cos(a)*RR,0,Math.sin(a)*RR)); } return out; }
  function pathToAngle(a1){ const out=[]; let x=nurse.position.x, z=nurse.position.z;
    if(inHut){ out.push(HUT.door.clone()); x=HUT.door.x; z=HUT.door.z; inHut=false; }
    const a0=Math.atan2(z,x); out.push(new THREE.Vector3(Math.cos(a0)*RR,0,Math.sin(a0)*RR)); return out.concat(arc(a0,a1)); }
  function exitPath(){ return []; }
  let routeMs=0;
  // detour around every district platform (bookcase included) instead of walking through it
  const AV_R=PR+1.0;
  const OBST=()=>[...(ISL[3].room&&ISL[3].room.obs?ISL[3].room.obs().map(o=>({...o,room:true})):[]),...Object.values(D3).map(d=>({c:d.c,r:AV_R})),...trees.filter(t=>t.userData.keep!==undefined?t.userData.keep:t.visible).map(t=>({c:t.position,r:1.15})),...OBS,...DECO_OBS,...SANDBUILT.map(g=>({c:g.position,r:1.35}))];
  function detour(A,B,depth=0){
    const RM=ISL[3].room, segIn=!!(RM&&(RM.inside(A)||RM.inside(B)));
    if(depth<10) for(const ob of OBST()){ const c=ob.c, r=ob.r; if(ob.room&&!segIn) continue;   // 手術室裡的設備與人員只在手術室裡繞,牆外的路不受影響(否則會繞進牆裡)
      const ax=A.x-c.x, az=A.z-c.z, bx=B.x-c.x, bz=B.z-c.z; const aIn=Math.hypot(ax,az)<r-.05, bIn=Math.hypot(bx,bz)<r-.05;
      if(aIn&&bIn) continue;
      const dx=bx-ax, dz=bz-az, qa=dx*dx+dz*dz; if(qa<1e-6) continue;
      const qb=2*(ax*dx+az*dz), qc=ax*ax+az*az-r*r, disc=qb*qb-4*qa*qc; if(disc<=0) continue;
      const sq=Math.sqrt(disc), t1=(-qb-sq)/(2*qa), t2=(-qb+sq)/(2*qa);
      if(t2<=1e-3||t1>=1-1e-3||(Math.min(t2,1)-Math.max(t1,0))*Math.sqrt(qa)<.4) continue;
      const g0=aIn?Math.atan2(az,ax):Math.atan2(az+dz*t1,ax+dx*t1), g1=bIn?Math.atan2(bz,bx):Math.atan2(az+dz*t2,ax+dx*t2);
      let dg=g1-g0; while(dg>Math.PI) dg-=2*Math.PI; while(dg<-Math.PI) dg+=2*Math.PI;
      const mkArc=(dg)=>{ const n=Math.max(2,Math.ceil(Math.abs(dg)/.3)), out=[]; for(let i=0;i<=n;i++){ const g=g0+dg*i/n; out.push(new THREE.Vector3(c.x+Math.cos(g)*r,0,c.z+Math.sin(g)*r)); } return out; };
      let arcp=mkArc(dg);
      // 繞障礙物的弧線如果會穿進手術室或恢復室的牆,就改從另一邊繞
      if(RM&&!segIn&&arcp.some(q=>RM.inSuiteArea(q))){ const alt=mkArc(dg>0?dg-2*Math.PI:dg+2*Math.PI); if(!alt.some(q=>RM.inSuiteArea(q))) arcp=alt; }
      const n=arcp.length-1;
      return [...(aIn?[arcp[0]]:detour(A,arcp[0],depth+1)),...arcp.slice(1),...(bIn?[B]:detour(arcp[n],B,depth+1))]; }
    return [B]; }
  function avoidPts(pts){ const out=[]; let prev=nurse.position.clone(); const R=ISL[3].room; for(const p of pts){ out.push(...detour(prev,new THREE.Vector3(p.x,0,p.z)).map(q=>R&&R.clampIn?R.clampIn(q):q)); prev=p; } return out; }
  // 走路:整條路線一次規劃好,轉角修成圓弧,沿路連續前進(起步加速、到點前減速),不再一段一段走走停停
  const WALK_V=10, WALK_A=18;
  function smoothPath(P){ if(P.length<3) return P; const out=[P[0]];
    for(let i=1;i<P.length-1;i++){ const a=P[i-1], b=P[i], c=P[i+1]; const l1=Math.hypot(b.x-a.x,b.z-a.z), l2=Math.hypot(c.x-b.x,c.z-b.z); const r=Math.min(1.1,l1*.45,l2*.45);
      if(r<.05){ out.push(b); continue; } const p0=b.clone().lerp(a,r/l1), p2=b.clone().lerp(c,r/l2);
      for(let k=0;k<=5;k++){ const t=k/5, u=1-t; out.push(new THREE.Vector3(u*u*p0.x+2*u*t*b.x+t*t*p2.x,0,u*u*p0.z+2*u*t*b.z+t*t*p2.z)); } }
    out.push(P[P.length-1]); return out; }
  function route(pts,done,opt){ if(pts.length&&orLocked(pts[pts.length-1])) return; pts=avoidPts(pts); const raw=[nurse.position.clone().setY(0)]; pts.forEach((p,i)=>{ const q=new THREE.Vector3(p.x,0,p.z), l=raw[raw.length-1], last=i===pts.length-1; if(Math.hypot(q.x-l.x,q.z-l.z)>(last?.05:.35)) raw.push(q); else if(last&&raw.length>1) raw[raw.length-1]=q; });
    if(raw.length===1&&pts.length) raw.push(new THREE.Vector3(pts[pts.length-1].x,0,pts[pts.length-1].z));
    const P=smoothPath(raw), cum=[0]; for(let i=1;i<P.length;i++) cum.push(cum[i-1]+Math.hypot(P[i].x-P[i-1].x,P[i].z-P[i-1].z));
    const total=cum[cum.length-1]; routeMs=(total/WALK_V+WALK_V/WALK_A)*1000;
    if(total<.05){ walk=null; done&&done(); return; }
    walk={P,cum,total,s:0,v:0,i:0,ph:walk&&walk.ph||0,onArrive:done,vmax:opt&&opt.vmax,push:opt&&opt.push}; mode="walk"; }
  function walkPoint(W,s){ s=Math.max(0,Math.min(W.cum[W.cum.length-1],s)); let i=Math.min(W.i,W.cum.length-2); while(i>0&&W.cum[i]>s) i--; while(i<W.cum.length-2&&W.cum[i+1]<s) i++;
    const seg=W.cum[i+1]-W.cum[i], k=seg>1e-6?(s-W.cum[i])/seg:0; return {x:W.P[i].x+(W.P[i+1].x-W.P[i].x)*k, z:W.P[i].z+(W.P[i+1].z-W.P[i].z)*k, i}; }

  function walkHere(p){ fishEnd();
    const I=islandAt(p); const rx=p.x-I.c.x, rz=p.z-I.c.z; let r=Math.hypot(rx,rz); if(r>I.R+1.5) return;
    let k=1; if(r>I.R-.8) k=(I.R-.8)/r; if(I.ring && r<I.ring-1.2) k=(I.ring-1.2)/Math.max(r,.01); p.set(I.c.x+rx*k,0,I.c.z+rz*k);
    if(orLocked(p)){ lockMsg(); return; }
    if(walk&&walk.push){ toast("🛏️ 正在和巡迴護理師一起推病人去恢復室"); return; }
    if(focus){ if(bookEl) closeBook(); focus=null; target=null; setHud(); try{ history.replaceState(null,"",location.pathname+location.search); }catch(e){} }
    const cross=islandAt(nurse.position)!==I; viewIsl=I.i; if(cross){ chase={vw:homeView()}; camTween=null; controls.enabled=true; } faceCamera=false; route(pathTo(p),()=>{ mode="idle"; faceCamera=true; });
    marker(p); }
  const ring=new THREE.Mesh(new THREE.RingGeometry(.45,.7,32),new THREE.MeshBasicMaterial({color:0xFFFFFF,transparent:true,opacity:0,depthWrite:false})); ring.rotation.x=-Math.PI/2; scene.add(ring); let ringT=9;
  function marker(p){ ring.position.set(p.x,groundY(p.x,p.z)+.06,p.z); ringT=0; }
  function jumpTo(sid,bookId){ if(orLocked()){ lockMsg(); return; } if(OFF) jumpOffDuty(); fishEnd(); releaseIV(); if(bookEl) closeBook(); poof(nurse.position); inHut=false;
    goDistrict(sid,bookId,true,600); poof(nurse.position); }
  function goDistrict(sid,bookId,instant,openDelay){ if(orLocked()){ lockMsg(); return; } fishEnd();
    if(!D3[sid]) return; releaseIV(); if(focus===sid && mode==="district" && !bookId && !instant) return; closeShelfBooks(); pendingBook=bookId||null;
    focus=sid; target=sid; setHud();
    const d=D3[sid]; viewIsl=d.isl; const u=d.u.clone(); const perp=new THREE.Vector3(-u.z,0,u.x);
    const narrow=stage.clientWidth/stage.clientHeight<1; const stand=narrow? d.c.clone().addScaledVector(u,-4.6).addScaledVector(perp,3.3) : d.c.clone().addScaledVector(u,-2.6).addScaledVector(perp,4.9); stand.y=0;
    const vw=distView(sid);
    if(instant){ walk=null; chase=null; camTween=null; controls.enabled=true; nurse.position.set(stand.x,groundY(stand.x,stand.z),stand.z); camera.position.copy(vw.pos); controls.target.copy(vw.tgt); arrive(); try{ history.replaceState(null,"","#d-"+sid); }catch(e){} return; }
    camTo(vw,stand,0); route(pathTo(stand), arrive);
    if(!chase) tweenCam(vw.pos,vw.tgt,Math.max(1600,routeMs+200));
    try{ history.replaceState(null,"","#d-"+sid); }catch(e){}
    function arrive(){ mode="district"; faceCamera=true; SEEN.add(sid); if(pendingBook){ const b=pendingBook; pendingBook=null; setTimeout(()=>{ if(focus===sid) openFromShelf(b); },openDelay||1600); } }
  }
  let faceCamera=false; let closeUp=false; let inHut=false; const SEEN=new Set();
  // rainy weather: go and wait in the beach hut; come back out when it clears
  const DOOR_A=Math.atan2(HUT.door.z,HUT.door.x);
  let holdIV=false, wanderT=0;
  let manualFace=null, evFace=null, evUntil=0, autoCur="smile", autoNext=0, curFace="smile", danceT=0, gold=false;
  const POOLS={idle:["smile","smile","laugh","wink","love","shy","surprised","smile","laugh"],night:["sleepy","smile","sleepy","shy"],hut:["sad","sleepy","surprised","smile"],
    ride:["laugh","love","wink","laugh","smile"],district:["smile","surprised","wink","smile","laugh","shy"],walk:["smile","laugh","smile","wink"]};
  function faceAuto(){ const now=performance.now(); let f;
    if(evFace&&now<evUntil) f=evFace; else if(danceT>0) f="laugh"; else if(manualFace) f=manualFace; else {
      const pool=SAND?["laugh","smile","love","laugh"]:LOUNGE?["sleepy","smile","love","sleepy","wink"]:OFF?POOLS.ride:(inHut&&ENV.raining())?POOLS.hut:ENV.night()>.5?POOLS.night:focus?POOLS.district:walk?POOLS.walk:POOLS.idle;
      if(now>autoNext||!pool.includes(autoCur)){ let n=autoCur; for(let i=0;i<4&&n===autoCur;i++) n=pool[Math.floor(Math.random()*pool.length)]; autoCur=n; autoNext=now+3500+Math.random()*4500; }
      f=autoCur; }
    if(f!==curFace){ curFace=f; nurse.userData.setFace(f); } }
  function react(k){ const m={right:["laugh",2600],wrong:["sad",2600],unlock:["love",4200],bolt:["surprised",1400]}[k]; if(!m) return; evFace=m[0]; evUntil=performance.now()+m[1]; }
  ENV.onBolt2=()=>react("bolt");
  function dance(){ if(OFF||walk||FISH||LOUNGE) return; danceT=5.5; wanderT=8; noteT=0; if(holdIV) SOUND.sing(); }
  let noteT=0; const NOTES=[];
  /* ================= 藍色指示光球:點點滴架/椅子/躺椅時先走到旁邊,點光球才使用 ================= */
  const ORB=(()=>{ const glow=tex(256,256,(c,w,h)=>{ const g=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2); g.addColorStop(0,"rgba(235,247,255,1)"); g.addColorStop(.16,"rgba(150,210,255,.98)"); g.addColorStop(.38,"rgba(70,155,245,.7)"); g.addColorStop(.62,"rgba(60,140,240,.25)"); g.addColorStop(1,"rgba(60,140,240,0)"); c.fillStyle=g; c.fillRect(0,0,w,h); });
    const core=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,transparent:true,depthWrite:false,depthTest:false,opacity:.95})); core.scale.set(2.4,2.4,1); core.renderOrder=20;
    const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,transparent:true,depthWrite:false,depthTest:false,opacity:.5})); halo.scale.set(5.4,5.4,1); halo.renderOrder=19;
    const light=new THREE.PointLight(0x5AA8FF,.7,5,2);
    const g=new THREE.Group(); g.add(halo); g.add(core); g.add(light); g.visible=false; scene.add(g); core.userData.orb=true; return {g,core,halo,light,kind:null,obj:null,t:0}; })();
  const ORB_TXT={iv:"點藍色光球:拉著點滴架走",stool:"點藍色光球:坐上椅子滑",lounge:"點藍色光球:戴上太陽眼鏡躺下休息",palm:"點藍色光球:搖樹叢",wish:"點藍色光球:丟硬幣許願,抽一題猜題",pick:"點藍色光球:撿起來",castle:"點藍色光球:蹲下來玩沙、蓋城堡",ring:"點藍色光球:拿救生圈去游泳",board:"點藍色光球:帶板子下海(衝浪板衝浪、長板划 SUP)",vball:"點藍色光球:打沙灘排球",boat:"點一下:坐小船、在船上釣魚",heart:"點一下:把愛心拔起來搬到別的地方",turtle:"點藍色光球:摸摸海龜"};
  const HOVER_TXT={iv:"點一下:拉著點滴架走",stool:"點一下:坐上椅子滑",lounge:"點一下:戴太陽眼鏡躺下休息",palm:"點一下:搖樹叢,看會掉下什麼",wish:"點一下:丟硬幣許願,抽一題器官系統猜題",pick:"點一下:撿起來",castle:"點一下:蹲下來玩沙、蓋城堡",ring:"點一下:拿救生圈去海裡游泳",board:"點一下:帶板子下海(衝浪板衝浪、長板划 SUP)",vball:"點一下:打沙灘排球",boat:"點一下:坐小船、在船上釣魚(再點一次小船就上岸)",heart:"點一下:把愛心拔起來,再點沙灘放到新的位置",turtle:"點一下:摸摸海龜(海龜也會偷吃地上的垃圾喔)"};
  function showOrb(kind,obj,hover){ ORB.kind=kind; ORB.obj=obj; ORB.t=0; ORB.hover=!!hover; ORB.g.visible=true; $("hint").textContent=(hover?HOVER_TXT:ORB_TXT)[kind]||""; }
  function hideOrb(){ if(!ORB.g.visible) return; ORB.g.visible=false; ORB.kind=null; ORB.obj=null; ORB.hover=false; setHud(); }
  function orbTick(dt,tt){ if(!ORB.g.visible) return; ORB.t+=dt; const o=ORB.obj; const top=ORB.kind==="iv"?7.4:ORB.kind==="stool"?4.0:ORB.kind==="palm"?(o.userData.crown||5)+1.2:ORB.kind==="pick"?1.8:ORB.kind==="castle"?3.4:ORB.kind==="ring"?3.4:ORB.kind==="wish"?4.6:3.4;
    ORB.g.position.set(o.position.x,o.position.y+top+Math.sin(tt*2.2)*.18,o.position.z); const pz=1+Math.sin(tt*3)*.08; ORB.core.scale.set(2.4*pz,2.4*pz,1); ORB.halo.scale.set(5.4/pz,5.4/pz,1);
    ORB.halo.material.opacity=.42+Math.sin(tt*3)*.1; ORB.light.intensity=.6+Math.sin(tt*3)*.2; if(!ORB.hover&&ORB.t>14) hideOrb(); }
  function approach(kind,obj){ if(obj&&obj.position&&orLocked(obj.position)){ lockMsg(); return; } fishEnd(); releaseIV(); if(bookEl) closeBook(); danceT=0;
    if(focus){ focus=null; target=null; setHud(); try{ history.replaceState(null,"",location.pathname+location.search); }catch(e){} }
    const op=obj.position; let away=new THREE.Vector3(nurse.position.x-op.x,0,nurse.position.z-op.z); if(away.lengthSq()<.01) away.set(0,0,1); away.normalize();
    if(kind==="lounge"){ const side=new THREE.Vector3(Math.cos(obj.rotation.y),0,-Math.sin(obj.rotation.y)); away=side.dot(away)>=0?side:side.negate(); }
    const p=new THREE.Vector3(op.x,0,op.z).addScaledVector(away,{iv:1.9,stool:2.1,palm:1.7,pick:1.3,castle:2.3,ring:1.7,wish:4.4}[kind]||2.4);
    const I=islandAt(p); viewIsl=I.i; faceCamera=false; route(pathTo(p),()=>{ mode="idle"; faceCamera=true; }); marker(p); showOrb(kind,obj); }
  function useOrb(){ const k=ORB.kind, obj=ORB.obj; hideOrb();
    if(k==="iv"){ if(!holdIV&&!hasSkill("iv")){ lockMsg("iv"); return; } toggleIV(); }
    else if(k==="stool"){ if(!onStool&&!hasSkill("stool")){ lockMsg("stool"); return; } toggleStool(); }
    else if(k==="lounge") lounge(obj); else actOn(k,obj); }
  /* ================= 沙灘上埋著的金幣(撿到 +0.05):露出一點邊緣、偶爾閃一下 ================= */
  const STAR=tex(128,128,(c,w,h)=>{ const g2=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2); g2.addColorStop(0,"rgba(255,255,240,1)"); g2.addColorStop(.25,"rgba(255,230,140,.6)"); g2.addColorStop(1,"rgba(255,210,80,0)"); c.fillStyle=g2; c.fillRect(0,0,w,h);
    c.fillStyle="rgba(255,255,255,.95)"; c.beginPath(); const m=w/2; c.moveTo(m,4); c.quadraticCurveTo(m,m,w-4,m); c.quadraticCurveTo(m,m,m,h-4); c.quadraticCurveTo(m,m,4,m); c.quadraticCurveTo(m,m,m,4); c.fill(); });
  const BURIED=(()=>{ const list=[], coinM=M(0xFFD54A,{metalness:.6,roughness:.2,emissive:0xC99A10,emissiveIntensity:.55}), sandM=M(0xE9CF9C,{roughness:.95});
    const okAt=(I,x,z)=>Object.values(D3).every(d=>Math.hypot(d.c.x-x,d.c.z-z)>PR+1.2)&&!(I.room&&I.room.near(x,z))&&trees.every(t=>!t.visible||Math.hypot(t.position.x-x,t.position.z-z)>2)&&Math.hypot(x-HUT.pos.x,z-HUT.pos.z)>6&&BRIDGES.every(br=>segDist(x,z,br)>3);
    const spotOn=(I)=>{ for(let k=0;k<200;k++){ const a=Math.random()*Math.PI*2, r0=I.ring?I.ring+1.2:PR+2.5, r=r0+Math.random()*Math.max(1,I.R-1.8-r0); const x=I.c.x+Math.cos(a)*r, z=I.c.z+Math.sin(a)*r; if(okAt(I,x,z)) return new THREE.Vector3(x,TOP,z); } return null; };
    ISL.forEach(I=>{ for(let i=0;i<4;i++){ const p=spotOn(I); if(!p) continue; const g=new THREE.Group();
      const c=new THREE.Mesh(new THREE.CylinderGeometry(.26,.26,.06,18),coinM); c.rotation.set(Math.PI/2-.5,0,.3); c.position.set(0,.12,0); g.add(c);
      // 亮晶晶:幾顆四角星一直輪流閃
      const stars=[0,1,2,3].map(k=>{ const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:STAR,color:k%2?0xFFF3B0:0xFFFFFF,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})); sp.position.set((k%2?-.3:.35)*(k<2?1:.6),.3+k*.18,(k<2?.15:-.25)); sp.userData.ph=k*1.7; g.add(sp); return sp; });
      const glint=stars[0];
      g.position.copy(p); g.userData={act:"pick",item:"金幣",glint,stars,ph:Math.random()*6,isl:undefined,relocate:()=>{ const q=spotOn(I); if(q) g.position.copy(q); }}; delete g.userData.isl; g.userData.home=g.position.clone(); shadowy(g); scene.add(g); list.push(g); } });
    return {list, update(tt){ list.forEach(g=>{ if(!g.visible) return; g.userData.stars.forEach(sp=>{ const k=.5+.5*Math.sin(tt*4+g.userData.ph+sp.userData.ph); const s2=.35+k*.55; sp.scale.set(s2,s2,1); sp.material.opacity=.45+k*.55; sp.material.rotation=tt*.8+sp.userData.ph; }); }); }};
  })();
  /* ================= 漂流瓶:被海浪沖上岸,打開會拿到藥物、管路、血品等收藏品 ================= */
  const DRIFT=(()=>{ const list=[], glass=new THREE.MeshPhysicalMaterial({color:0x9FE3C9,transparent:true,opacity:.6,roughness:.08,clearcoat:1}), cork=M(0xB0814E,{roughness:.9}), paper=M(0xFFF4D6,{roughness:.9});
    const okAt=(I,x,z)=>Object.values(D3).every(d=>Math.hypot(d.c.x-x,d.c.z-z)>PR+1.5)&&!(I.room&&I.room.near(x,z))&&trees.every(t=>!t.visible||Math.hypot(t.position.x-x,t.position.z-z)>2)&&Math.hypot(x-HUT.pos.x,z-HUT.pos.z)>7&&BRIDGES.every(br=>segDist(x,z,br)>4)&&OBS.every(o=>Math.hypot(o.c.x-x,o.c.z-z)>o.r+.8);
    const spotOn=(I)=>{ for(let k=0;k<200;k++){ const a=Math.random()*Math.PI*2, r=I.R-1.6-Math.random()*1.2; const x=I.c.x+Math.cos(a)*r, z=I.c.z+Math.sin(a)*r; if(okAt(I,x,z)) return new THREE.Vector3(x,TOP,z); } return null; };
    ISL.forEach(I=>{ const p=spotOn(I); if(!p) return; const g=new THREE.Group(); const b=new THREE.Group(); b.rotation.z=Math.PI/2-.15; b.position.y=.24; g.add(b);
      const body=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.7,16),glass); b.add(body); const sh=new THREE.Mesh(new THREE.SphereGeometry(.22,16,10,0,Math.PI*2,0,Math.PI/2),glass); sh.position.y=.35; b.add(sh);
      const neck=new THREE.Mesh(new THREE.CylinderGeometry(.08,.1,.25,12),glass); neck.position.y=.6; b.add(neck); const ck=new THREE.Mesh(new THREE.CylinderGeometry(.075,.07,.12,10),cork); ck.position.y=.76; b.add(ck);
      const pp=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.45,10),paper); pp.position.y=-.02; b.add(pp);
      const star=new THREE.Sprite(new THREE.SpriteMaterial({map:STAR,color:0xFFFFFF,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})); star.position.set(.2,.55,0); g.add(star);
      g.position.copy(p); g.rotation.y=Math.random()*6; g.userData={act:"pick",item:"漂流瓶",star,ph:Math.random()*6,relocate:()=>{ const q=spotOn(I); if(q) g.position.copy(q); }}; g.userData.home=g.position.clone(); shadowy(g); scene.add(g); list.push(g); });
    return {list, update(tt){ list.forEach(g=>{ if(!g.visible) return; const k=.5+.5*Math.sin(tt*3+g.userData.ph); g.userData.star.scale.setScalar(.4+k*.6); g.userData.star.material.opacity=.4+k*.6; g.position.y=TOP+Math.sin(tt*1.6+g.userData.ph)*.03; }); }};
  })();
  /* ================= 搖樹叢、撿貝殼、玩沙、救生圈 ================= */
  const FALLEN=[]; let SAND=null, RINGPOST=null, BUSY=null;
  const bagAdd=(k)=>colAdd(k);
  // 地上的垃圾:小麻正要去撿的那個,海鷗和海龜不搶;被吃掉就從場景移除
  const litterFree=(f)=>f.userData.item==="垃圾"&&f.userData.rest&&f.visible&&FALLEN.includes(f)&&!(BUSY&&BUSY.obj===f)&&!(f.userData.claimedAt&&performance.now()-f.userData.claimedAt<9000);
  function eatLitter(f,who){ if(inSuite()) return false; const i=FALLEN.indexOf(f); if(i<0||!litterFree(f)) return false; FALLEN.splice(i,1); scene.remove(f); spray(f.position.clone().add(new THREE.Vector3(0,.3,0)),[0xFFFFFF,0xCCCCCC],8,.07,1.8); addBonus(-.1,who==="gull"?"🐦 海鷗把垃圾吃下肚了⋯⋯":"🐢 海龜誤吃了垃圾⋯⋯"); return true; }
  function prep(){ $("wishPanel").hidden=true; fishEnd(); boatEnd(); releaseIV(); if(bookEl) closeBook(); danceT=0;
    if(focus){ focus=null; target=null; setHud(); try{ history.replaceState(null,"",location.pathname+location.search); }catch(e){} } }
  function besides(obj,dist){ const op=obj.position; let away=new THREE.Vector3(nurse.position.x-op.x,0,nurse.position.z-op.z); if(away.lengthSq()<.01) away.set(0,0,1); away.normalize(); return new THREE.Vector3(op.x,0,op.z).addScaledVector(away,dist); }
  function faceTo(obj){ const dx=obj.position.x-nurse.position.x, dz=obj.position.z-nurse.position.z; nurse.quaternion.setFromAxisAngle(up0,Math.atan2(dx,dz)); faceCamera=false; }
  function wishAt(f){ prep(); faceCamera=false; viewIsl=1;
    route(pathTo(besides(f,4.4)),()=>{ faceTo(f); mode="busy"; BUSY={k:"wish",t:0,f}; }); }
  function showWish(opt){ const sids=opt&&opt.all?SYS.map(s=>s.id):ISL[1].sids, all=[]; sids.forEach(sid=>{ const sy=sysById[sid]; if(sy) sy.aiq.forEach((q,i)=>all.push(sid+":"+i)); }); if(!all.length) return;
    const fresh=all.filter(k=>AIPICK[k]===undefined), pool=fresh.length?fresh:all, key=pool[Math.floor(Math.random()*pool.length)];
    const [sid,qi]=key.split(":"), sy=sysById[sid], q=sy.aiq[+qi], LAB="ABCD", P=$("wishPanel");
    let topic=null; for(const [tid,arr] of Object.entries(AIBY)) if(arr.some(x=>x.sid===sid&&x.i===+qi)){ topic=tid; break; }
    const draw=(pk)=>{ const dn=pk!==undefined;
      P.innerHTML=`<button type="button" class="x" data-wx aria-label="關閉">✕</button><div class="kick">${opt?"🤿 浮潛 · 漂流瓶":"⛲ 許願池"} · ${sy.name}</div><h3>${opt?"漂流瓶裡有一張小紙條,是一題":"丟了一枚硬幣,抽到一題"}</h3>
        <div class="pt">答對可得金幣(和書裡的 AI 猜題共用,同一題只算一次)</div><div class="q">${q.q}</div>`+
        q.o.map((o,k)=>`<button type="button" class="opt${dn&&k===q.a?" ok":""}${dn&&k===pk&&pk!==q.a?" no":""}" data-wk="${k}"${dn?" disabled":""}><b>${LAB[k]}</b><span>${o}</span></button>`).join("")+
        (dn?`<div class="fb ${pk===q.a?"ok":"no"}"><b>${pk===q.a?"答對了!":"正解 "+LAB[q.a]}</b>　${q.e}</div>`:"")+
        (dn?`<div class="nav">${topic?`<button type="button" data-wbook>📖 去讀這本書</button>`:""}${opt?"":`<button type="button"${topic?' class="sec"':""} data-wagain>🪙 再許一個願</button>`}</div>`:""); };
    draw(); P.hidden=false; P.scrollTop=0;
    P.onclick=(e)=>{ const b=e.target.closest("button"); if(!b) return;
      if(b.hasAttribute("data-wx")){ P.hidden=true; return; }
      if(b.hasAttribute("data-wk")){ const k=+b.dataset.wk; AIPICK[key]=k; aiAnswer(key,k); draw(k); return; }
      if(b.hasAttribute("data-wbook")){ P.hidden=true; const t=byId[topic]; if(t) goDistrict(t.sys,topic); return; }
      if(b.hasAttribute("data-wagain")){ P.hidden=true; wishAt(FOUNTAIN); } }; }
  function actOn(kind,obj){ if(kind==="wish"){ wishAt(obj); return; } if(kind==="palm") shakePalm(obj); else if(kind==="pick") collect(obj); else if(kind==="castle") sandPlay(obj); else if(kind==="ring") takeRing(obj); else if(kind==="board") takeBoard(obj); else if(kind==="vball") vballPlay(obj); else if(kind==="boat") boatToggle(obj); else if(kind==="heart") liftHeart(obj); else if(kind==="turtle") petTurtle(obj); }
  function petTurtle(g){ const T=TURTLES.list.find(x=>x.g===g); if(!T) return; const r=Math.hypot(g.position.x-T.I.c.x,g.position.z-T.I.c.z);
    if(r>T.I.R-.6){ toast("🐢 海龜正在海裡游泳,等牠上岸再來摸摸牠吧!"); return; }
    prep(); faceCamera=false; viewIsl=T.I.i; T.hold=true; T.happy=false; T.holdUntil=performance.now()+12000; T.food=null;
    route(pathTo(besides(g,2.1)),()=>{ faceTo(g); mode="busy"; BUSY={k:"pet",t:0,T}; T.holdUntil=performance.now()+6000; }); }
  function mkCoconut(){ const c=BUSH.coco(); shadowy(c); return c; }
  function mkLeaf(){ return BUSH.leaf(); }
  function shakePalm(tr){ prep(); faceCamera=false; viewIsl=islandAt(tr.position).i;
    route(pathTo(besides(tr,1.7)),()=>{ faceTo(tr); mode="busy"; BUSY={k:"shake",t:0,tr,dropped:false}; }); }
  function collect(obj){ prep(); faceCamera=false; obj.userData.claimedAt=performance.now();
    route(pathTo(besides(obj,1.25)),()=>{ faceTo(obj); mode="busy"; BUSY={k:"pick",t:0,obj,from:obj.position.clone()}; if(obj.userData.item==="寄居蟹") obj.userData.held=true; }); }
  function sandPlay(castle){ prep(); faceCamera=false; viewIsl=islandAt(castle.position).i;
    route(pathTo(besides(castle,2.3)),()=>{ faceTo(castle); mode="sand"; setTools(false); SAND={t:0,n:0,cur:null,castle}; }); }
  function sandEnd(){ if(!SAND) return; if(SAND.cur&&SAND.cur.userData.k<1) { scene.remove(SAND.cur); } SAND=null; setTools(true); const ud=nurse.userData; ud.body.position.y=0; ud.body.rotation.set(0,0,0); ud.legs.forEach(l=>l.rotation.set(0,0,0));
    ud.armR.sh.rotation.set(-.95,0,.12); ud.armR.fore.rotation.x=-.75; ud.armL.sh.rotation.set(-.85,0,-.12); ud.armL.fore.rotation.x=-.85; if(mode==="sand") mode="idle"; faceCamera=true; }
  const SANDBUILT=[]; const sandM2=M(0xEBCB98,{roughness:.95}), sandD=M(0xD9B57E,{roughness:.95});
  const SANDKINDS=[["城堡",()=>{ const g=new THREE.Group(); const b=new THREE.Mesh(new THREE.CylinderGeometry(.9,1.05,.55,14),sandM2); b.position.y=.27; g.add(b);
      for(let i=0;i<4;i++){ const a=i/4*Math.PI*2+.4; const t=new THREE.Mesh(new THREE.CylinderGeometry(.22,.26,.75,10),sandM2); t.position.set(Math.cos(a)*.55,.9,Math.sin(a)*.55); g.add(t); const c=new THREE.Mesh(new THREE.ConeGeometry(.28,.35,10),sandD); c.position.set(Math.cos(a)*.55,1.45,Math.sin(a)*.55); g.add(c); }
      const k=new THREE.Mesh(new THREE.CylinderGeometry(.32,.38,1.2,12),sandM2); k.position.y=1.1; g.add(k); const kc=new THREE.Mesh(new THREE.ConeGeometry(.4,.5,12),sandD); kc.position.y=1.95; g.add(kc);
      const f=new THREE.Mesh(new THREE.PlaneGeometry(.35,.22),new THREE.MeshBasicMaterial({color:0xE46F8E,side:THREE.DoubleSide})); f.position.set(.18,2.45,0); g.add(f); const st=new THREE.Mesh(new THREE.CylinderGeometry(.015,.015,.5,5),M(0x8A5A32)); st.position.y=2.3; g.add(st); return g; }],
    ["海龜沙雕",()=>{ const g=new THREE.Group(); const sh=new THREE.Mesh(new THREE.SphereGeometry(.85,18,10,0,Math.PI*2,0,Math.PI/2),sandM2); sh.scale.set(1,.55,1.25); g.add(sh);
      for(let i=0;i<6;i++){ const a=i/6*Math.PI*2; const d=new THREE.Mesh(new THREE.SphereGeometry(.16,8,6),sandD); d.scale.y=.4; d.position.set(Math.cos(a)*.45,.38,Math.sin(a)*.55); g.add(d); }
      const hd=new THREE.Mesh(new THREE.SphereGeometry(.3,12,10),sandM2); hd.position.set(0,.2,1.25); g.add(hd);
      for(const [x,z] of [[.85,.6],[-.85,.6],[.7,-.7],[-.7,-.7]]){ const f=new THREE.Mesh(new THREE.SphereGeometry(.28,10,8),sandM2); f.scale.set(1.3,.35,.7); f.position.set(x,.08,z); g.add(f); } return g; }],
    ["愛心沙雕",()=>{ const hs=new THREE.Shape(); hs.moveTo(0,-.9); hs.bezierCurveTo(-1.5,.2,-.9,1.3,0,.6); hs.bezierCurveTo(.9,1.3,1.5,.2,0,-.9);
      const h=new THREE.Mesh(new THREE.ExtrudeGeometry(hs,{depth:.35,bevelEnabled:true,bevelSize:.12,bevelThickness:.12,bevelSegments:3}),sandM2); h.rotation.x=-Math.PI/2; h.position.y=.05; const g=new THREE.Group(); g.add(h);
      const sh=new THREE.Mesh(new THREE.ExtrudeGeometry((()=>{ const s2=new THREE.Shape(); for(let i=0;i<10;i++){ const a=i/10*Math.PI*2-Math.PI/2, rr=i%2?.08:.22; i?s2.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):s2.moveTo(Math.cos(a)*rr,Math.sin(a)*rr); } return s2; })(),{depth:.06,bevelEnabled:false}),M(0xF2804F)); sh.rotation.x=-Math.PI/2; sh.position.set(0,.55,.1); g.add(sh); return g; }],
    ["沙塔",()=>{ const g=new THREE.Group(); let y=0; [[.75,.5],[.58,.45],[.42,.4],[.26,.35]].forEach(([r,h])=>{ const c=new THREE.Mesh(new THREE.CylinderGeometry(r*.9,r,h,14),sandM2); c.position.y=y+h/2; g.add(c); y+=h; });
      const sh=new THREE.Mesh(new THREE.ConeGeometry(.2,.4,10),M(0xF9D3C4)); sh.position.y=y+.2; g.add(sh); return g; }]];
  /* 專科手術島:點衝浪板 → 帶著板子下海衝浪(長板是 SUP);點排球網 → 打沙灘排球 */
  let BOARDPOST=null, VBALL=null;
  const boardShow=(g,on)=>{ g.userData.bd.forEach(m=>m.visible=on); if(g.userData.paddle) g.userData.paddle.visible=on; };
  function takeBoard(g){ prep(); faceCamera=false; viewIsl=islandAt(g.position).i;
    route(pathTo(besides(g,2.2)),()=>{ faceTo(g); if(BOARDPOST) boardShow(BOARDPOST,true); boardShow(g,false); BOARDPOST=g; poof(g.position.clone().add(new THREE.Vector3(0,1.5,0)));
      const k=g.userData.kind; toast(k==="sup"?"🛶 拿了 SUP 立槳板,去海上划水囉!":"🏄 拿了衝浪板,去衝浪囉!"); offStart(k); }); }
  function vballPlay(net){ prep(); faceCamera=false; viewIsl=islandAt(net.position).i; net.updateMatrixWorld();
    const side=net.worldToLocal(nurse.position.clone()).z>=0?1:-1; const p=net.localToWorld(new THREE.Vector3(0,0,side*3.4)); p.y=0;
    route(pathTo(p),()=>{ faceTo(net); net.updateMatrixWorld(); const z=net.worldToLocal(nurse.position.clone()).z; mode="busy"; VBALL=net; BUSY={k:"vball",t:0,net,side:z>=0?1:-1,zN:z,said:false}; }); }
  function takeRing(post){ prep(); faceCamera=false;
    route(pathTo(besides(post,1.7)),()=>{ faceTo(post); post.userData.ring.visible=false; RINGPOST=post; nurseRing.visible=true; poof(post.position.clone().add(new THREE.Vector3(0,1.5,0)));
      toast("🛟 拿了救生圈,去游泳囉!"); offStart("free"); if(OFF) OFF.ring=true; }); }
  const nurseRing=new THREE.Mesh(new THREE.TorusGeometry(.78,.22,12,28),new THREE.MeshStandardMaterial({roughness:.5,map:tex(128,16,(c,w,h)=>{ for(let k=0;k<8;k++){ c.fillStyle=k%2?"#FFFFFF":"#E2463F"; c.fillRect(k*w/8,0,w/8+1,h); } })}));
  nurseRing.rotation.x=Math.PI/2; nurseRing.position.y=1.35; nurseRing.visible=false; nurse.userData.body.add(nurseRing);
  function busyTick(dt,tt){ const ud=nurse.userData;
    if(RINGPOST&&(!OFF||!OFF.ring)){ RINGPOST.userData.ring.visible=true; RINGPOST=null; nurseRing.visible=false; }
    { const onB=(k)=>k==="surf"||k==="sup"; if(BOARDPOST&&mode!=="walk"&&!walk&&!(OFF&&(onB(OFF.kind)||(OFF.x&&onB(OFF.x.kind))))){ boardShow(BOARDPOST,true); BOARDPOST=null; } }
    if(VBALL&&!walk&&!(BUSY&&BUSY.k==="vball")){ VBALL.userData.ball.position.copy(VBALL.userData.ballHome); VBALL=null; ud.body.position.y=0; }
    for(let i=FALLEN.length-1;i>=0;i--){ const f=FALLEN[i], u=f.userData; if(u.rest){ u.age=(u.age||0)+dt; continue; } u.t+=dt;
      if(u.leaf){ u.v.y=Math.max(u.v.y-2.2*dt,-1.6); f.position.addScaledVector(u.v,dt); f.rotation.y+=dt*2.2; f.rotation.z=Math.sin(u.t*3)*.5; if(f.position.y<=TOP+.08){ f.position.y=TOP+.08; f.rotation.set(0,f.rotation.y,0); u.rest=true; } }
      else { u.v.y-=16*dt; f.position.addScaledVector(u.v,dt); f.rotation.x+=u.v.z*dt; f.rotation.z-=u.v.x*dt; if(f.position.y<=TOP+.3){ f.position.y=TOP+.3; if(Math.abs(u.v.y)>2){ u.v.y=-u.v.y*.35; u.v.x*=.6; u.v.z*=.6; } else { u.rest=true; } } } }
    if(walk&&BUSY&&BUSY.k==="snack") snackStop();
    if(!BUSY||walk) return; const B=BUSY; B.t+=dt;
    if(B.k==="snack"){ if(walk||!snackOK()){ snackStop(); return; } const bites=3, per=1.1, i=Math.floor(B.t/per), k=(B.t-i*per)/per;
      if(i<bites){ const up=Math.sin(Math.min(1,k*1.6)*Math.PI); ud.armR.sh.rotation.set(-.4-up*2.0,0,.15+up*.45); ud.armR.fore.rotation.x=-.4+up*.2; ud.head.rotation.x=up*.08; /* 把食物送到嘴邊 */ if(k>.45&&k<.5) B.food.scale.multiplyScalar(.84); return; }
      if(!B.thrown){ B.thrown=true; ud.armR.hand.remove(B.food); ud.head.rotation.x=0;
        const cup=B.S[0]==="飲料", lit=mkLitter(B.S[3],cup); const hand=ud.armR.hand.getWorldPosition(new THREE.Vector3()); lit.position.copy(hand);
        const a=Math.random()*Math.PI*2, sp=1.6+Math.random()*1.4; lit.userData={v:new THREE.Vector3(Math.cos(a)*sp,3.2,Math.sin(a)*sp),t:0,act:"pick",item:"垃圾",fallen:true}; scene.add(lit); FALLEN.push(lit); while(FALLEN.length>30){ const o=FALLEN.shift(); scene.remove(o); }
        toast(`😋 吃完了⋯⋯${cup?"杯子":"包裝"}隨手一丟!<small>(點垃圾撿起來 +0.1 金幣;被海鷗或海龜吃掉會 −0.1)</small>`); }
      const kk=Math.min(1,(B.t-bites*per)/.5); ud.armR.sh.rotation.set(-.4-Math.sin(kk*Math.PI)*1.6,0,.15); ud.armR.fore.rotation.x=-.3;
      if(B.t>bites*per+.7){ BUSY=null; mode="idle"; } return; }
    if(B.k==="vball"){ const net=B.net, ball=net.userData.ball, HITS=6, per=1.2; const i=Math.floor(B.t/per), k=(B.t-i*per)/per;
      const rest=()=>{ ud.body.position.y=0; ud.armR.sh.rotation.set(-.95,0,.12); ud.armR.fore.rotation.x=-.75; ud.armL.sh.rotation.set(-.85,0,-.12); ud.armL.fore.rotation.x=-.85; };
      if(!B.said){ B.said=true; toast("🏐 發球!"); }
      if(i>=HITS){ ball.position.copy(net.userData.ballHome); VBALL=null; BUSY=null; mode="idle"; faceCamera=true; rest(); toast(`🏐 來回打了 ${HITS} 球,好球!`); react("right"); return; }
      // 偶數拍:小麻把球打過網;奇數拍:球從對面沙地彈回來
      const out=i%2===0, zN=B.zN-B.side*.7, zF=-B.side*2.8, yN=3.3, yF=.3; const z0=out?zN:zF, z1=out?zF:zN, y0=out?yN:yF, y1=out?yF:yN, dx=Math.sin(i*2.1)*.7;
      ball.position.set(out?dx*k:dx*(1-k), y0+(y1-y0)*k+Math.sin(k*Math.PI)*2.7, z0+(z1-z0)*k); ball.rotation.x+=dt*7; ball.rotation.z+=dt*3;
      const hit=out?Math.max(0,1-k/.3):Math.max(0,(k-.7)/.3);   // 接球與擊球時雙手上舉、小跳
      ud.armR.sh.rotation.set(-1.15-hit*1.6,0,.18); ud.armL.sh.rotation.set(-1.15-hit*1.6,0,-.18); ud.armR.fore.rotation.x=-.35; ud.armL.fore.rotation.x=-.35; ud.body.position.y=hit*.45;
      if(!out&&k<.08&&B.sp!==i){ B.sp=i; const w=net.localToWorld(new THREE.Vector3(0,.2,zF)); spray(w,[0xEED3A6,0xF6E3BE],6,.07,1.6); }
      return; }
    if(B.k==="wish"){ const f=B.f; ud.armR.sh.rotation.set(B.t<.35?-1.0-B.t*4:-2.4+Math.min(1,(B.t-.35)*3)*1.4,0,.2);
      if(!B.coin&&B.t>.35){ B.coin=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.05,16),M(0xF2C230,{metalness:.6,roughness:.3})); B.c0=nurse.position.clone().add(new THREE.Vector3(0,3.6,0)); B.c0.y=TOP+3.6;
        B.c1=new THREE.Vector3(f.position.x+(Math.random()-.5)*1.4,TOP+.7,f.position.z+(Math.random()-.5)*1.4); scene.add(B.coin); }
      if(B.coin&&!B.splash){ const k=Math.min(1,(B.t-.35)/.8); B.coin.position.lerpVectors(B.c0,B.c1,k); B.coin.position.y+=Math.sin(k*Math.PI)*2.4; B.coin.rotation.x+=.35;
        if(k>=1){ B.splash=true; scene.remove(B.coin); spray(B.c1,[0xBFEFFF,0xFFFFFF,0x6CC9E6],14,.08,3); toast("⛲ 噗通!許了一個願⋯⋯"); } }
      if(B.t>1.8){ BUSY=null; mode="idle"; faceCamera=true; ud.armR.sh.rotation.set(-.95,0,.12); showWish(); } return; }
    if(B.k==="shake"){ ud.armR.sh.rotation.set(-1.7,0,.25); ud.armL.sh.rotation.set(-1.7,0,-.25); ud.armR.fore.rotation.x=-.3+Math.sin(tt*24)*.2; ud.armL.fore.rotation.x=-.3-Math.sin(tt*24)*.2; ud.body.rotation.x=Math.sin(tt*24)*.04; B.tr.userData.shk=1.6;
      if(!B.dropped&&B.t>.55){ B.dropped=true; const tr=B.tr, n=1+Math.floor(Math.random()*2), leaf=Math.random()<.6; const cy=TOP+(tr.userData.crown||5);
        for(let i=0;i<n;i++){ const c=mkCoconut(); c.position.set(tr.position.x+(Math.random()-.5)*.6,cy-.2,tr.position.z+(Math.random()-.5)*.6); c.userData={v:new THREE.Vector3((Math.random()-.5)*2.4,1+Math.random(),(Math.random()-.5)*2.4),t:0,act:"pick",item:"莓果",fallen:true}; scene.add(c); FALLEN.push(c); }
        if(leaf){ const l=mkLeaf(); l.position.set(tr.position.x+(Math.random()-.5),cy,tr.position.z+(Math.random()-.5)); l.userData={v:new THREE.Vector3((Math.random()-.5)*1.5,0,(Math.random()-.5)*1.5),t:0,leaf:true}; scene.add(l); FALLEN.push(l); }
        while(FALLEN.length>30){ const o=FALLEN.shift(); scene.remove(o); }
        toast(`🌿 搖呀搖~ 掉下 ${n} 顆莓果${leaf?"和一片葉子":""}!`); react("right"); }
      if(B.t>1.7){ BUSY=null; mode="idle"; faceCamera=true; ud.body.rotation.x=0; ud.armR.sh.rotation.set(-.95,0,.12); ud.armR.fore.rotation.x=-.75; ud.armL.sh.rotation.set(-.85,0,-.12); ud.armL.fore.rotation.x=-.85; } return; }
    if(B.k==="pet"){ const T=B.T; ud.body.position.y=-.55; ud.body.rotation.x=.38; ud.legs.forEach((l,i)=>{ l.rotation.x=-1.2; l.rotation.z=(i?-1:1)*.3; });
      ud.armR.sh.rotation.set(-1.25,0,.1); ud.armR.fore.rotation.x=-.25+Math.sin(tt*7)*.3; ud.armL.sh.rotation.set(-.4,0,-.15); ud.armL.fore.rotation.x=-.5; T.happy=B.t>.5;
      if(!B.said&&B.t>.6){ B.said=true; const gift=Math.random()<.25; const msgs=["海龜開心地伸長脖子!","海龜眯起眼睛,好舒服~","海龜對小麻笑了一下!"];
        if(gift){ const pool=["貝殼","海星","珍珠","小蝦"]; const it=COL_BY[pool[Math.floor(Math.random()*pool.length)]]; const bag=bagAdd(it.n); toast(`🐢 摸摸海龜~ 牠送小麻一個禮物:${it.ic} ${it.n}!<small>(${bag})</small>`,"coin"); }
        else toast("🐢 摸摸海龜~ "+msgs[Math.floor(Math.random()*msgs.length)]); react("right"); }
      if(Math.random()<dt*3) spray(T.g.position.clone().add(new THREE.Vector3(0,2.2,0)),[0xFF6F91,0xFFB3C7],3,.09,1.2);
      if(B.t>2.8){ T.hold=false; T.happy=false; T.wait=1.5; ud.legs.forEach(l=>l.rotation.set(0,0,0)); ud.armR.fore.rotation.x=-.75; ud.armL.fore.rotation.x=-.85; endPick(); } return; }
    if(B.k==="pick"){ const o=B.obj, crab=o.userData.item==="寄居蟹"; const k=Math.min(1,B.t/.6); ud.body.position.y=-.5*Math.sin(Math.min(1,B.t/.9)*Math.PI); ud.body.rotation.x=.35*Math.sin(Math.min(1,B.t/.9)*Math.PI);
      const hand=nurse.position.clone().add(new THREE.Vector3(0,crab?4.6:3.0,0));
      if(B.t>.45){ const k2=Math.min(1,(B.t-.45)/.5); o.position.lerpVectors(B.from,hand,k2); if(!crab) o.scale.setScalar(Math.max(.05,(o.userData.s0||(o.userData.s0=o.scale.x))*(1-k2*.5))); }
      if(B.t>1.0&&!B.done&&(o.userData.item==="金幣"||o.userData.item==="垃圾")){ B.done=true; if(o.userData.item==="金幣") addBonus(.05,"🪙 找到埋藏的金幣!"); else addBonus(.1,"🗑️ 把垃圾撿起來丟掉,好棒!"); }
      if(B.t>1.0&&!B.done&&o.userData.item==="漂流瓶"){ B.done=true; bagAdd("漂流瓶"); const it=Math.random()<.08?COL_BY["珍珠"]:rollMed(); const bag=bagAdd(it.n); toast(`🍾 打開漂流瓶,裡面是 ${it.ic} ${it.n}!<small>(${bag})</small>`,it.r>=3?"unlock":"coin"); react(it.r>=3?"unlock":"right"); }
      if(B.t>1.0&&!B.done){ B.done=true; const bag=bagAdd(o.userData.item); toast(`${crab?"🦀":o.userData.item==="莓果"?"🍒":o.userData.item==="椰子"?"🥥":o.userData.item==="海星"?"⭐":"🐚"} 撿到${o.userData.item}!<small>(${bag})</small>`,"coin"); react("right"); }
      if(crab){ ud.armR.sh.rotation.set(-2.8,0,.3); ud.armL.sh.rotation.set(-2.8,0,-.3); if(B.t>2.6){ o.position.copy(B.from); o.userData.held=false; o.userData.pause=2; endPick(); } return; }
      if(B.t>1.3){ o.visible=false; if(o.userData.fallen){ scene.remove(o); const fi=FALLEN.indexOf(o); if(fi>=0) FALLEN.splice(fi,1); } else { o.scale.setScalar(o.userData.s0); const home=o.userData.home; setTimeout(()=>{ if(o.userData.relocate) o.userData.relocate(); else o.position.copy(home); o.visible=true; },60000); } endPick(); } return; } }
  const SNACKS=[["餅乾","🍪",()=>{ const m=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.06,16),M(0xC98A43,{roughness:.9})); m.rotation.x=Math.PI/2; return m; },0xF4E6C8],
    ["糖果","🍬",()=>{ const g=new THREE.Group(); const b=new THREE.Mesh(new THREE.SphereGeometry(.12,12,10),M(0xFF6FA8)); g.add(b); for(const sx of [-1,1]){ const w=new THREE.Mesh(new THREE.ConeGeometry(.09,.16,8),M(0xFFE14D)); w.rotation.z=sx*Math.PI/2; w.position.x=sx*.17; g.add(w); } return g; },0xFFE14D],
    ["披薩","🍕",()=>{ const sh=new THREE.Shape(); sh.moveTo(0,0); sh.lineTo(-.18,.42); sh.quadraticCurveTo(0,.5,.18,.42); sh.lineTo(0,0); const m=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.04,bevelEnabled:false}),M(0xF2B544)); m.rotation.x=-Math.PI/2; return m; },0xFFFFFF],
    ["飲料","🧋",()=>{ const g=new THREE.Group(); const c=new THREE.Mesh(new THREE.CylinderGeometry(.13,.1,.38,14),M(0xD9B38C,{transparent:true,opacity:.92})); g.add(c); const st=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.3,6),M(0xE2463F)); st.position.set(.04,.28,0); g.add(st); return g; },0xF4F6F8],
    ["冰淇淋","🍦",()=>{ const g=new THREE.Group(); const c=new THREE.Mesh(new THREE.ConeGeometry(.12,.3,12),M(0xD9A35A)); c.rotation.x=Math.PI; g.add(c); const s2=new THREE.Mesh(new THREE.SphereGeometry(.14,12,10),M(0xFFC4D6)); s2.position.y=.18; g.add(s2); return g; },0xEDE0C8]];
  function mkLitter(col,cup){ const m=cup?new THREE.Mesh(new THREE.CylinderGeometry(.16,.12,.4,12),M(col)):new THREE.Mesh(new THREE.IcosahedronGeometry(.22,0),M(col,{flatShading:true,roughness:.8})); if(cup){ m.rotation.z=Math.PI/2; } shadowy(m); return m; }
  let idleT=0, snackCD=6;
  // 吃零食、丟垃圾只在小麻沒事做的時候:在書庫(街區書櫃、看書、題目視窗)或模擬手術室(含恢復室、手術室附近)都不行
  function snackOK(){ if(focus||bookEl||inHut||OFF||FISH||LOUNGE||holdIV||onStool||SAND||danceT>0) return false; if(inSuite()||(ISL[3].room&&ISL[3].room.near(nurse.position.x,nurse.position.z))) return false;
    if(Object.values(D3).some(d=>Math.hypot(d.c.x-nurse.position.x,d.c.z-nurse.position.z)<PR+2.5)) return false;
    const op=document.getElementById("orPanel"), wp=document.getElementById("wishPanel"); if((op&&!op.hidden)||(wp&&!wp.hidden)) return false;
    if(document.querySelector(".modal,.about,.intro,.shelfmenu")||(typeof DECO!=="undefined"&&DECO.mode)) return false; return true; }
  function snackStop(){ if(!(BUSY&&BUSY.k==="snack")) return; const ud=nurse.userData; if(BUSY.food&&BUSY.food.parent) BUSY.food.parent.remove(BUSY.food); ud.head.rotation.x=0; BUSY=null; if(mode==="busy") mode="idle"; idleT=0; }
  function idleTick(dt,tt){ const ud=nurse.userData;
    const free=mode==="idle"&&!walk&&!focus&&!inHut&&!OFF&&!holdIV&&!onStool&&!SAND&&!LOUNGE&&!FISH&&!BUSY&&danceT<=0&&!(ISL[3].room&&ISL[3].room.near(nurse.position.x,nurse.position.z));
    const selfManaged=holdIV||onStool||SAND||OFF||LOUNGE||FISH||BOAT||CARRY;   // 這些活動自己會管工具
    const inRoom=ISL[3].room&&ISL[3].room.near(nurse.position.x,nurse.position.z);
    if(!selfManaged&&((BUSY&&BUSY.k==="snack")||danceT>0||inRoom)){ if(ud.ETT.visible) setTools(false); if(!free){ idleT=0; return; } }   // 吃零食、跳舞、在手術室裡:手上不拿氣管內管與 Trachway
    if(!free){ idleT=0; if(!ud.ETT.visible&&!BUSY&&!selfManaged&&danceT<=0&&!inRoom){ setTools(true); } return; }
    idleT+=dt;
    // 沒事做 3 秒:把氣管內管和 Trachway 收起來,手自然放下
    if(idleT>3&&ud.ETT.visible){ setTools(false); }
    if(!ud.ETT.visible){ ud.armR.sh.rotation.x+=(-.12-ud.armR.sh.rotation.x)*Math.min(1,dt*4); ud.armR.fore.rotation.x+=(-.2-ud.armR.fore.rotation.x)*Math.min(1,dt*4); ud.armL.sh.rotation.x+=(-.12-ud.armL.sh.rotation.x)*Math.min(1,dt*4); ud.armL.fore.rotation.x+=(-.2-ud.armL.fore.rotation.x)*Math.min(1,dt*4); }
    // 再閒一陣子:拿出零食來吃
    if(idleT>3+snackCD&&snackOK()){ idleT=3; snackCD=10+Math.random()*12; const S=SNACKS[Math.floor(Math.random()*SNACKS.length)]; const food=S[2](); food.scale.setScalar(1.6); setTools(false); ud.armR.hand.add(food); food.position.set(0,-.18,.12);
      faceCamera=true; mode="busy"; BUSY={k:"snack",t:0,S,food}; toast(`${S[1]}小麻拿出${S[0]}開始吃⋯⋯`); } }
  /* ---------- 水潭小船:坐上去慢慢漂,在船上釣魚 ---------- */
  let BOAT=null, CARRY=null;
  const POND_CATCH=[["小魚","🐟"],["小魚","🐟"],["蝌蚪","🐸"],["小蝦","🦐"],["舊靴子","🥾"],["小魚","🐟"]];
  function boatToggle(b){ if(BOAT){ boatEnd(); return; } prep(); faceCamera=false; const c=b.userData.pond; const edge=c.clone().add(b.position.clone().sub(c).setY(0).normalize().multiplyScalar(3.4)); edge.y=0;
    route(pathTo(edge),()=>{ BOAT={b,t:0,ang:Math.atan2(b.position.z-c.z,b.position.x-c.x),hop:0,next:5+Math.random()*4}; mode="boat"; setTools(false); FROD.rod.visible=true; toast("🚣 坐上小船了!在船上釣魚中⋯⋯(再點一次小船就上岸)"); }); }
  function boatEnd(){ if(!BOAT) return; const B=BOAT; BOAT=null; FROD.rod.visible=false; setTools(true); const ud=nurse.userData; ud.body.position.y=0; ud.legs.forEach(l=>l.rotation.set(0,0,0));
    const c=B.b.userData.pond; const out=nurse.position.clone().sub(c).setY(0).normalize().multiplyScalar(3.4).add(c); nurse.position.set(out.x,groundY(out.x,out.z),out.z); poof(nurse.position); if(mode==="boat") mode="idle"; faceCamera=true; }
  function boatTick(dt,tt){ if(!BOAT) return; if(walk){ boatEnd(); return; } const B=BOAT, b=B.b, ud=nurse.userData, c=b.userData.pond, r=b.userData.R; B.t+=dt;
    B.ang+=dt*.25; b.position.set(c.x+Math.cos(B.ang)*r,TOP+.05+Math.sin(tt*2)*.03,c.z+Math.sin(B.ang)*r); b.rotation.set(Math.sin(tt*1.6)*.04,-B.ang-Math.PI/2+Math.PI,Math.cos(tt*1.3)*.04);
    b.updateMatrixWorld(); const p=b.localToWorld(b.userData.seat.clone()); nurse.position.copy(p); nurse.quaternion.setFromEuler(new THREE.Euler(0,b.rotation.y+Math.PI/2,0));
    ud.body.position.y=-.55; ud.legs.forEach(l=>l.rotation.set(-1.4,0,0)); ud.armR.sh.rotation.set(-1.15,0,.3); ud.armR.fore.rotation.x=-.7; ud.armL.sh.rotation.set(-1.0,0,-.45); ud.armL.fore.rotation.x=-1.0;
    B.next-=dt; if(B.next<=0){ B.next=7+Math.random()*7; const [it,ic]=POND_CATCH[Math.floor(Math.random()*POND_CATCH.length)]; const bag=bagAdd(it); toast(`🎣 ${ic} 在水潭裡釣到${it}!<small>(${bag})</small>`,"coin"); react("right"); spray(b.position.clone().add(new THREE.Vector3(0,.3,0)),[0xBFEFFF,0xFFFFFF],10,.07,2.2); } }
  /* ---------- 愛心石:拔起來,點沙灘放到新位置 ---------- */
  function liftHeart(h){ if(CARRY) return; prep(); faceCamera=false; route(pathTo(besides(h,1.6)),()=>{ faceTo(h); setTools(false); CARRY={h,armed:false,wasWalk:false}; poof(h.position.clone().add(new THREE.Vector3(0,.6,0))); toast("💗 拔起愛心了!點沙灘上想放的位置,小麻會搬過去放下"); }); }
  function carryTick(dt,tt){ if(!CARRY) return; const C=CARRY, ud=nurse.userData; ud.armR.sh.rotation.set(-2.9,0,.35); ud.armL.sh.rotation.set(-2.9,0,-.35); ud.armR.fore.rotation.x=-.2; ud.armL.fore.rotation.x=-.2;
    nurse.updateMatrixWorld(); const top=nurse.localToWorld(new THREE.Vector3(0,4.0,.15)); C.h.position.set(top.x,top.y-.5,top.z); C.h.rotation.y=nurse.rotation.y;
    if(walk) { C.armed=true; C.wasWalk=true; return; }
    if(C.armed&&C.wasWalk){ const f=nurse.localToWorld(new THREE.Vector3(0,0,1.4)); C.h.position.set(f.x,TOP,f.z); C.h.rotation.y=Math.random()*Math.PI*2; poof(C.h.position.clone().add(new THREE.Vector3(0,.5,0))); CARRY=null; setTools(true);
      ud.armR.sh.rotation.set(-.95,0,.12); ud.armL.sh.rotation.set(-.85,0,-.12); ud.armR.fore.rotation.x=-.75; ud.armL.fore.rotation.x=-.85; toast("💗 愛心放好了!"); react("right"); } }
  /* ---------- 海龜:在島上慢慢爬,偶爾爬下海游一圈再回來 ---------- */
  const TURTLES=(()=>{ const list=[];
    const shellM=M(0x7C9A3E,{roughness:.55}), scuteM=M(0x5E7C2C,{roughness:.5}), rimM=M(0xC9A35C,{roughness:.6}), bellyM=M(0xE9D9A6,{roughness:.7}), skinM=M(0x9CC46A,{roughness:.6}), spotM=M(0x6E9A45,{roughness:.6});
    // 走得到的地方:不靠近街區平台、樹、障礙物、手術室與中央工作站
    const ptOK=(I,x,z)=>{ const r=Math.hypot(x-I.c.x,z-I.c.z); if(r>I.R-1.4||r<(I.ring?I.ring+1:PR+2)) return false;
      if(!Object.values(D3).every(d=>Math.hypot(d.c.x-x,d.c.z-z)>PR+1.2)) return false; if(I.room&&I.room.near(x,z)) return false; if(Math.hypot(x-HUT.pos.x,z-HUT.pos.z)<6.5) return false;
      if(trees.some(t=>t.visible&&Math.hypot(t.position.x-x,t.position.z-z)<1.6)) return false; if(OBS.some(o=>Math.hypot(o.c.x-x,o.c.z-z)<o.r+1.0)) return false; if(DECO_OBS.some(o=>Math.hypot(o.c.x-x,o.c.z-z)<o.r+1.0)) return false; return BRIDGES.every(br=>segDist(x,z,br)>2.5); };
    const clear=(I,a,b,sea)=>{ const d=Math.hypot(b.x-a.x,b.z-a.z), n2=Math.max(1,Math.ceil(d/.7)); for(let k=1;k<=n2;k++){ const x=a.x+(b.x-a.x)*k/n2, z=a.z+(b.z-a.z)*k/n2; const r=Math.hypot(x-I.c.x,z-I.c.z); if(sea&&r>I.R-1.6){ if(!seaOK(I,x,z)) return false; continue; } if(!ptOK(I,x,z)) return false; } return true; };
    // 海裡:不能碰到吊橋(含橋墩)或別的島
    const seaOK=(I,x,z)=>BRIDGES.every(br=>segDist(x,z,br)>4.5)&&ISL.every(J=>J===I||Math.hypot(x-J.c.x,z-J.c.z)>J.R+1.5);
    const seaClear=(I,a,b)=>{ const d=Math.hypot(b.x-a.x,b.z-a.z), n2=Math.max(1,Math.ceil(d/.7)); for(let k=1;k<=n2;k++){ const x=a.x+(b.x-a.x)*k/n2, z=a.z+(b.z-a.z)*k/n2; if(Math.hypot(x-I.c.x,z-I.c.z)>I.R-1.6&&!seaOK(I,x,z)) return false; } return true; };
    // 繞島游的下一個點:先試著往前游,前面有橋就掉頭
    const nextSwim=(T,I,from)=>{ const a0=Math.atan2(from.z-I.c.z,from.x-I.c.x); for(const sg of [T.sg||1,-(T.sg||1)]) for(const st of [.6,.35]){ const a=a0+sg*st; const p=I.c.clone().add(new THREE.Vector3(Math.cos(a)*(I.R+8),0,Math.sin(a)*(I.R+8))); if(seaClear(I,from,p)){ T.sg=sg; return p; } } return null; };
    const pickLand=(I,from)=>{ for(let k=0;k<120;k++){ const a=Math.random()*Math.PI*2, r0=(I.ring?I.ring+1:PR+2), r=r0+Math.random()*(I.R-3-r0); const p=new THREE.Vector3(I.c.x+Math.cos(a)*r,0,I.c.z+Math.sin(a)*r); if(ptOK(I,p.x,p.z)&&(!from||clear(I,from,p))) return p; } return null; };
    const pickSea=(I,from)=>{ const a0=Math.atan2(from.z-I.c.z,from.x-I.c.x); for(let k=0;k<20;k++){ const a=a0+(k%2?1:-1)*Math.ceil(k/2)*.12; const p=I.c.clone().add(new THREE.Vector3(Math.cos(a)*(I.R+7),0,Math.sin(a)*(I.R+7))); if(clear(I,from,p,true)) return p; } return null; };
    function mkTurtle(){ const g=new THREE.Group();
      const shell=new THREE.Mesh(new THREE.SphereGeometry(.8,28,18,0,Math.PI*2,0,Math.PI/2),shellM); shell.scale.set(1,.85,1.2); shell.position.y=.28; g.add(shell);   // 圓鼓鼓的龜殼
      const rim=new THREE.Mesh(new THREE.TorusGeometry(.8,.09,10,32),rimM); rim.rotation.x=Math.PI/2; rim.scale.set(1,1.2,1); rim.position.y=.28; g.add(rim);
      const belly=new THREE.Mesh(new THREE.CylinderGeometry(.78,.7,.16,28),bellyM); belly.scale.z=1.2; belly.position.y=.2; g.add(belly);
      // 龜甲上的六角形甲片
      const sc=(x,z,r,tilt)=>{ const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r*1.05,.08,6),scuteM); const y=.28+.68*Math.sqrt(Math.max(0,1-(x*x)/(.8*.8)-(z*z)/(.96*.96))); m.position.set(x,y,z); m.rotation.set(-z*tilt,0,x*tilt); g.add(m); };
      sc(0,0,.24,0); sc(0,.42,.2,.7); sc(0,-.42,.2,.7); [[.38,.2],[-.38,.2],[.38,-.22],[-.38,-.22]].forEach(([x,z])=>sc(x,z,.18,.9));
      const neck=new THREE.Mesh(new THREE.CylinderGeometry(.15,.18,.35,12),skinM); neck.rotation.x=Math.PI/2-.35; neck.position.set(0,.36,1.0); g.add(neck);
      const hd=new THREE.Group(); hd.position.set(0,.5,1.25); g.add(hd);
      const head=new THREE.Mesh(new THREE.SphereGeometry(.26,16,12),skinM); head.scale.set(1,.85,1.15); hd.add(head);
      for(const sx of [-.12,.12]){ const w=new THREE.Mesh(new THREE.SphereGeometry(.07,10,8),M(0xFFFFFF)); w.position.set(sx,.07,.17); hd.add(w); const e=new THREE.Mesh(new THREE.SphereGeometry(.045,8,6),M(0x1B1E22)); e.position.set(sx*1.05,.08,.22); hd.add(e); }
      const smile=new THREE.Mesh(new THREE.TorusGeometry(.07,.012,6,12,Math.PI),M(0x3E5A22)); smile.rotation.set(0,0,Math.PI); smile.position.set(0,-.06,.27); hd.add(smile);
      for(const [x,z] of [[.14,.05],[-.18,-.1]]){ const sp=new THREE.Mesh(new THREE.CircleGeometry(.05,10),spotM); sp.position.set(x,.18,z); sp.rotation.x=-Math.PI/2+.4; hd.add(sp); }
      const fl=[[-.72,.5,1],[.72,.5,1],[-.6,-.6,0],[.6,-.6,0]].map(([x,z,front])=>{ const p=new THREE.Group(); p.position.set(x,.22,z); const sh=new THREE.Shape(); const L=front?.75:.42, Wd=front?.24:.2;
        sh.moveTo(0,-Wd/2); sh.quadraticCurveTo(L*.6,-Wd*.8,L,0); sh.quadraticCurveTo(L*.6,Wd*.5,0,Wd/2); sh.lineTo(0,-Wd/2);
        const m=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.07,bevelEnabled:true,bevelSize:.02,bevelThickness:.02,bevelSegments:2}),skinM); m.rotation.x=-Math.PI/2; if(x<0) m.scale.x=-1; m.rotation.z=front?(x<0?-.5:.5):(x<0?.6:-.6); p.add(m); g.add(p); return p; });
      const tail=new THREE.Mesh(new THREE.ConeGeometry(.08,.25,8),skinM); tail.rotation.x=-Math.PI/2; tail.position.set(0,.24,-1.05); g.add(tail);
      shadowy(g); return {g,fl,hd}; }
    [0,1,2,4,5].forEach((ii,n)=>{ const I=ISL[ii]; const T=mkTurtle(); const p0=pickLand(I); if(!p0) return; T.g.position.set(p0.x,TOP,p0.z); T.g.scale.setScalar(1.15); T.g.userData.act="turtle"; scene.add(T.g);
      list.push({...T,I,mode:"walk",tgt:pickLand(I,p0)||p0.clone(),wait:Math.random()*3,ph:n}); });
    return {list, update(dt,tt){ list.forEach(T=>{ const g=T.g, I=T.I;
      // 小麻來摸摸牠:停下來,抬頭看小麻
      if(T.hold){ if(performance.now()>T.holdUntil) T.hold=false; else { const dx=nurse.position.x-g.position.x, dz=nurse.position.z-g.position.z; let df=Math.atan2(dx,dz)-g.rotation.y; while(df>Math.PI) df-=2*Math.PI; while(df<-Math.PI) df+=2*Math.PI; g.rotation.y+=df*Math.min(1,dt*3);
        T.hd.position.y=.5+(T.happy?.18+Math.sin(tt*6)*.05:.08); T.hd.rotation.y=Math.sin(tt*2)*.15; T.fl.forEach((p,k)=>{ p.rotation.y=T.happy?Math.sin(tt*8+k)*.35:0; }); return; } }
      // 看到附近地上的垃圾,會慢慢爬過去吃掉(小麻要搶先撿起來)
      if(T.food&&!litterFree(T.food)){ T.food=null; T.tgt=pickLand(I,g.position)||g.position.clone(); }
      if(!T.food&&T.mode==="walk"&&Math.random()<dt*.6){ const f=FALLEN.find(f=>litterFree(f)&&(f.userData.age||0)>6&&islandAt(f.position)===I&&Math.hypot(f.position.x-g.position.x,f.position.z-g.position.z)<10); if(f){ T.food=f; T.wait=0; } }
      if(T.food){ const fp=T.food.position; T.tgt=new THREE.Vector3(fp.x,0,fp.z); if(Math.hypot(fp.x-g.position.x,fp.z-g.position.z)<1.4){ eatLitter(T.food,"turtle"); T.food=null; T.wait=2.5; T.tgt=pickLand(I,g.position)||g.position.clone(); return; } }
      if(T.wait>0){ T.wait-=dt; return; }
      const dx=T.tgt.x-g.position.x, dz=T.tgt.z-g.position.z, d=Math.hypot(dx,dz), r=Math.hypot(g.position.x-I.c.x,g.position.z-I.c.z), inSea=r>I.R-.4;
      const sp=inSea?1.4:.55; if(d>.1){ const nx=g.position.x+dx/d*Math.min(d,sp*dt), nz=g.position.z+dz/d*Math.min(d,sp*dt);
        if(!inSea&&T.mode==="walk"&&!ptOK(I,nx,nz)){ T.food=null; T.tgt=pickLand(I,g.position)||g.position.clone(); T.wait=.6; return; }   // 前面有東西:換方向
        g.position.x=nx; g.position.z=nz; const want=Math.atan2(dx,dz); let df=want-g.rotation.y; while(df>Math.PI) df-=2*Math.PI; while(df<-Math.PI) df+=2*Math.PI; g.rotation.y+=df*Math.min(1,dt*2); }
      g.position.y=inSea?waveH(g.position.x,g.position.z,tt,ENV.wave())-.9:groundY(g.position.x,g.position.z);
      const fp=tt*(inSea?3:5)+T.ph; T.fl.forEach((p,k)=>{ p.rotation.y=Math.sin(fp+(k%2?Math.PI:0)+(k<2?0:Math.PI/2))*(inSea?.7:.4); p.rotation.z=inSea?Math.sin(fp)*.3:0; }); T.hd.position.y=.5+Math.sin(tt*1.3+T.ph)*.04; T.hd.rotation.y=Math.sin(tt*.7+T.ph)*.3;
      if(d<=.1){ if(T.mode==="walk"){ const sea=Math.random()<.35?pickSea(I,g.position):null; if(sea){ T.mode="toSea"; T.tgt=sea; } else { T.tgt=pickLand(I,g.position)||g.position.clone(); T.wait=1+Math.random()*4; } }
        else if(T.mode==="toSea"){ T.mode="swim"; T.n=3; const p=nextSwim(T,I,g.position); if(p) T.tgt=p; else T.n=1; }
        else if(T.mode==="swim"){ const p=--T.n>0?nextSwim(T,I,g.position):null; if(p){ T.tgt=p; }
          else { // 找一個上得了岸、路上沒有東西的點
            let best=null; for(let k=0;k<60&&!best;k++){ const a=Math.random()*Math.PI*2; const p=I.c.clone().add(new THREE.Vector3(Math.cos(a)*(I.R-2.5),0,Math.sin(a)*(I.R-2.5))); const off=p.clone().add(p.clone().sub(I.c).setY(0).normalize().multiplyScalar(9)); if(ptOK(I,p.x,p.z)&&seaClear(I,g.position,off)&&seaClear(I,off,p)) best=p; }
            if(!best){ T.n=2; T.sg=-(T.sg||1); T.tgt=nextSwim(T,I,g.position)||g.position.clone(); } else { T.mode="land"; T.tgt=best.clone().add(best.clone().sub(I.c).setY(0).normalize().multiplyScalar(9)); T.shore=best; } } }
        else if(T.mode==="land"){ T.mode="walk"; T.tgt=T.shore||pickLand(I)||g.position.clone(); } } }); }};
  })();
  function endPick(){ const ud=nurse.userData; BUSY=null; mode="idle"; faceCamera=true; ud.body.position.y=0; ud.body.rotation.x=0; ud.armR.sh.rotation.set(-.95,0,.12); ud.armL.sh.rotation.set(-.85,0,-.12); }
  function sandTick(dt,tt){ if(!SAND||walk) return; const S=SAND, ud=nurse.userData; S.t+=dt;
    ud.body.position.y=-.75; ud.legs.forEach((l,i)=>{ l.rotation.x=-1.35; l.rotation.z=(i?-1:1)*.35; }); ud.body.rotation.x=.3;
    ud.armR.sh.rotation.set(-1.1+Math.sin(tt*9)*.35,0,.3); ud.armL.sh.rotation.set(-1.1-Math.sin(tt*9)*.35,0,-.3); ud.armR.fore.rotation.x=-.6; ud.armL.fore.rotation.x=-.6;
    if(!S.cur&&S.t>.6){ const kind=SANDKINDS[S.n%SANDKINDS.length]; const g=kind[1](); const cp=S.castle.position, I=islandAt(cp);
      const out=new THREE.Vector3(cp.x-I.c.x,0,cp.z-I.c.z).normalize(); let slots=[70,-70,120,-120,25,-25,160,-160].map(d=>{ const a=d*Math.PI/180; return new THREE.Vector3(cp.x+(out.x*Math.cos(a)-out.z*Math.sin(a))*3.3,0,cp.z+(out.x*Math.sin(a)+out.z*Math.cos(a))*3.3); })
        .filter(q=>Math.hypot(q.x-I.c.x,q.z-I.c.z)<I.R-1.8&&Object.values(D3).every(d=>Math.hypot(d.c.x-q.x,d.c.z-q.z)>PR+2)&&Math.hypot(q.x-nurse.position.x,q.z-nurse.position.z)>1.7&&trees.every(t=>!t.visible||Math.hypot(t.position.x-q.x,t.position.z-q.z)>1.8));
      if(!slots.length){ const fw=new THREE.Vector3(0,0,1).applyQuaternion(nurse.quaternion), sd=new THREE.Vector3(-fw.z,0,fw.x); slots=[nurse.position.clone().addScaledVector(sd,2.2)]; }
      const p=slots[S.n%slots.length]; for(let j=SANDBUILT.length-1;j>=0;j--) if(Math.hypot(SANDBUILT[j].position.x-p.x,SANDBUILT[j].position.z-p.z)<1.6){ scene.remove(SANDBUILT[j]); SANDBUILT.splice(j,1); }
      const dx=p.x-nurse.position.x, dz=p.z-nurse.position.z; nurse.quaternion.setFromAxisAngle(up0,Math.atan2(dx,dz)); g.position.set(p.x,TOP,p.z); g.rotation.y=Math.random()*6; g.scale.set(1,.01,1); g.userData={k:0,name:kind[0]}; shadowy(g); scene.add(g); S.cur=g; S.t=0; }
    if(S.cur){ const g=S.cur; g.userData.k=Math.min(1,S.t/5); g.scale.set(.6+.4*g.userData.k,Math.max(.01,g.userData.k),.6+.4*g.userData.k); if(Math.random()<dt*5) spray(g.position.clone().add(new THREE.Vector3(0,.3,0)),[0xE8C890,0xD9B57E,0xF2DDB0],6,.08,2.2);
      if(g.userData.k>=1){ toast(`🏰 蓋好了:${g.userData.name}!`,"coin"); react("right"); SANDBUILT.push(g); while(SANDBUILT.length>8){ scene.remove(SANDBUILT.shift()); } S.cur=null; S.n++; S.t=-1.8; } } }
  /* ================= 躺椅:戴太陽眼鏡躺著休息 ================= */
  let LOUNGE=null;
  function lounge(g){ fishEnd(); releaseIV(); if(bookEl) closeBook(); danceT=0;
    const side=new THREE.Vector3(Math.cos(g.rotation.y),0,-Math.sin(g.rotation.y)); const toN=new THREE.Vector3(nurse.position.x-g.position.x,0,nurse.position.z-g.position.z);
    const sd=side.dot(toN)>=0?1:-1; const stand=g.position.clone().addScaledVector(side,sd*2.4); stand.y=0; faceCamera=false;
    route(pathTo(stand),()=>{ LOUNGE={g,stand,t:0}; mode="lounge"; setTools(false); nurse.userData.setShades(true); poof(nurse.position); faceCamera=false; evFace="smile"; evUntil=performance.now()+600; }); }
  function loungeEnd(){ if(!LOUNGE) return; const L=LOUNGE; LOUNGE=null; const ud=nurse.userData; ud.setShades(false); setTools(true);
    nurse.quaternion.setFromAxisAngle(up0,L.g.rotation.y); nurse.position.set(L.stand.x,groundY(L.stand.x,L.stand.z),L.stand.z);
    ud.body.position.y=0; ud.body.rotation.set(0,0,0); ud.legs.forEach(l=>l.rotation.set(0,0,0)); ud.head.rotation.set(0,0,0);
    ud.armR.sh.rotation.set(-.95,0,.12); ud.armR.fore.rotation.x=-.75; ud.armL.sh.rotation.set(-.85,0,-.12); ud.armL.fore.rotation.x=-.85; if(mode==="lounge") mode="idle"; faceCamera=true; }
  function loungeTick(dt,tt){ if(!LOUNGE||walk) return; LOUNGE.t+=dt; const g=LOUNGE.g, ud=nurse.userData; g.updateMatrixWorld();
    const p=g.localToWorld(new THREE.Vector3(0,.62,1.05)); nurse.position.set(p.x,p.y+.47,p.z);
    nurse.quaternion.setFromAxisAngle(up0,g.rotation.y).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-(Math.PI/2-.42)));
    ud.body.position.y=0; ud.body.rotation.set(Math.sin(tt*1.4)*.015,0,0); ud.legs.forEach((l,i)=>l.rotation.set(0,0,(i?-1:1)*.06));
    ud.armR.sh.rotation.set(-2.75,0,.55); ud.armR.fore.rotation.x=-1.7; ud.armL.sh.rotation.set(-2.75,0,-.55); ud.armL.fore.rotation.x=-1.7; ud.head.rotation.set(.25,Math.sin(tt*.5)*.15,0); }
  /* ================= 海邊釣魚 ================= */
  let FISH=null, FCATCH=null, FISHN=0;
  const FROD=(()=>{ const ud=nurse.userData; const rod=new THREE.Group(); rod.visible=false;
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.016,.04,3.4,8),M(0x2C3E50,{roughness:.4})); pole.position.y=1.6; rod.add(pole);
    for(let i=1;i<4;i++){ const ring=new THREE.Mesh(new THREE.TorusGeometry(.04,.008,6,10),M(0xC9CDD2,{metalness:.7})); ring.position.set(0,.3+i*.8,.03); rod.add(ring); }
    const grip=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.55,10),M(0x8A5A32,{roughness:.7})); grip.position.y=-.05; rod.add(grip);
    const reel=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.08,16),M(0xC9CDD2,{metalness:.7,roughness:.3})); reel.rotation.z=Math.PI/2; reel.position.set(.11,.28,0); rod.add(reel);
    const tip=new THREE.Object3D(); tip.position.y=3.3; rod.add(tip);
    rod.position.set(-.42,1.25,.62); rod.rotation.set(.85,0,0); ud.body.add(rod);
    const lineG=new THREE.BufferGeometry(); lineG.setAttribute("position",new THREE.BufferAttribute(new Float32Array(20*3),3));
    const line=new THREE.Line(lineG,new THREE.LineBasicMaterial({color:0xF4F4F4,transparent:true,opacity:.9})); line.frustumCulled=false; line.visible=false; scene.add(line);
    const bob=new THREE.Group(); const b1=new THREE.Mesh(new THREE.SphereGeometry(.17,14,10,0,Math.PI*2,0,Math.PI/2),M(0xE63946,{roughness:.4})); bob.add(b1);
    const b2=new THREE.Mesh(new THREE.SphereGeometry(.17,14,10,0,Math.PI*2,Math.PI/2,Math.PI/2),M(0xFFFFFF,{roughness:.4})); bob.add(b2);
    const st=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,.25,6),M(0xE63946)); st.position.y=.25; bob.add(st); bob.visible=false; scene.add(bob);
    return {rod,tip,line,bob}; })();
  const CATCH=[{n:"小丑魚",k:"fish",c:0xFF7A2E,s:0xFFFFFF,w:20},{n:"藍倒吊",k:"fish",c:0x2E6FE0,s:0xFFD23F,w:16},{n:"鯖魚",k:"fish",c:0x7B9BB5,s:0x2C3E50,w:18},
    {n:"河豚",k:"puffer",c:0xF2D16B,w:11},{n:"小章魚",k:"octo",c:0xE8738A,w:10},{n:"海星",k:"star",c:0xF2804F,w:10},{n:"舊靴子",k:"boot",c:0x6B4A2E,w:6},
    {n:"螃蟹",k:"crab",c:0xD9483B,w:8},{n:"金色鯛魚",k:"fish",c:0xF2C230,s:0xFFF3B0,w:3,gold:true}];
  // 釣到的醫療收藏品:藥物是小藥瓶、血品是血袋、其他是一張卡片
  function mkMed(o){ const g=new THREE.Group(); const label=(w,h,bg,draw)=>tex(w,h,(c,W,H)=>{ c.fillStyle=bg; c.fillRect(0,0,W,H); draw(c,W,H); });
    const hue=[...o.n].reduce((a,ch)=>a+ch.charCodeAt(0),0)%360;
    if(o.med==="drug"||o.med==="vaso"){ const glass=new THREE.MeshPhysicalMaterial({color:0xEAF6FF,transparent:true,opacity:.55,roughness:.05,clearcoat:1});
      const liq=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.5,18),M(/Propofol|Intralipid|Albumin/.test(o.n)?0xFFFFFF:o.med==="vaso"?0xFFE3E3:0xF4FAFF,{roughness:.3})); liq.position.y=-.05; g.add(liq);
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(.23,.23,.7,18),glass)); const cap=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.14,16),M(new THREE.Color().setHSL(hue/360,.65,.55))); cap.position.y=.42; g.add(cap);
      const lb=new THREE.Mesh(new THREE.CylinderGeometry(.235,.235,.32,24,1,true),new THREE.MeshStandardMaterial({map:label(256,64,"#FFFFFF",(c,W,H)=>{ c.fillStyle=`hsl(${hue},60%,45%)`; c.fillRect(0,0,W,10); c.fillStyle="#333"; c.font="bold 28px sans-serif"; c.textAlign="center"; c.textBaseline="middle"; c.fillText(o.n,W/2,H/2+4); }),side:THREE.DoubleSide})); lb.position.y=-.02; g.add(lb); }
    else if(o.med==="blood"){ const col={PRBC:0x9E1B2A,FFP:0xF2C94C,Platelet:0xF7E3A1,Cryoprecipitate:0xF4E9D8,Albumin:0xF8F3E6}[o.n]||0xC0392B;
      g.add(new THREE.Mesh(new RoundedBoxGeometry(.7,.95,.14,3,.08),new THREE.MeshPhysicalMaterial({color:col,roughness:.25,clearcoat:.6})));
      for(const x of [-.15,.15]){ const pt=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.2,8),M(0xF4F4F4)); pt.position.set(x,.56,0); g.add(pt); }
      const lb=new THREE.Mesh(new THREE.PlaneGeometry(.5,.3),new THREE.MeshStandardMaterial({map:label(160,96,"#FFFFFF",(c,W,H)=>{ c.fillStyle="#333"; c.font="bold 30px sans-serif"; c.textAlign="center"; c.textBaseline="middle"; c.fillText(o.n.length>8?o.n.slice(0,6)+"…":o.n,W/2,H/2); })})); lb.position.set(0,-.1,.08); g.add(lb); }
    else { const cv=new THREE.Mesh(new RoundedBoxGeometry(.8,1.05,.05,2,.04),[M(0xF2C230),M(0xF2C230),M(0xF2C230),M(0xF2C230),new THREE.MeshStandardMaterial({map:label(160,210,"#FFFDF6",(c,W,H)=>{ c.strokeStyle="#F2C230"; c.lineWidth=8; c.strokeRect(4,4,W-8,H-8); c.font="88px serif"; c.textAlign="center"; c.textBaseline="middle"; c.fillText(o.ic,W/2,H*.42); c.fillStyle="#333"; c.font="bold 22px sans-serif"; c.fillText(o.n.length>9?o.n.slice(0,8)+"…":o.n,W/2,H*.82); })}),M(0xF2C230)]); g.add(cv); }
    g.scale.setScalar(1.5); shadowy(g); return g; }
  function mkCatch(o){ if(o.k==="med") return mkMed(o); const g=new THREE.Group(), mat=M(o.c,{roughness:.45}), eye=M(0x111111,{roughness:.2});
    if(o.k==="fish"){ const b=new THREE.Mesh(new THREE.SphereGeometry(.42,18,12),o.gold?new THREE.MeshStandardMaterial({color:o.c,metalness:.7,roughness:.25,emissive:0x5A4000,emissiveIntensity:.4}):mat); b.scale.set(1.5,.85,.5); g.add(b);
      const t=new THREE.Mesh(new THREE.ConeGeometry(.32,.45,4),mat); t.rotation.z=Math.PI/2; t.position.x=-.78; t.scale.z=.3; g.add(t);
      for(const x of [.15,-.25]){ const band=new THREE.Mesh(new THREE.TorusGeometry(.3,.05,6,18),M(o.s)); band.rotation.y=Math.PI/2; band.position.x=x; band.scale.set(1,1.15,.7); g.add(band); }
      for(const z of [-.2,.2]){ const e=new THREE.Mesh(new THREE.SphereGeometry(.06,8,6),eye); e.position.set(.42,.08,z); g.add(e); } }
    else if(o.k==="puffer"){ g.add(new THREE.Mesh(new THREE.SphereGeometry(.5,16,12),mat)); for(let i=0;i<26;i++){ const sp=new THREE.Mesh(new THREE.ConeGeometry(.05,.18,5),M(0xE0B040)); const v=new THREE.Vector3().randomDirection(); sp.position.copy(v.clone().multiplyScalar(.52)); sp.quaternion.setFromUnitVectors(up0,v); g.add(sp); }
      for(const z of [-.22,.22]){ const e=new THREE.Mesh(new THREE.SphereGeometry(.08,8,6),eye); e.position.set(.42,.12,z); g.add(e); } }
    else if(o.k==="octo"){ const h=new THREE.Mesh(new THREE.SphereGeometry(.42,16,12),mat); h.scale.y=1.15; h.position.y=.25; g.add(h);
      for(let i=0;i<8;i++){ const a=i/8*Math.PI*2; const cv=new THREE.CatmullRomCurve3([new THREE.Vector3(Math.cos(a)*.2,0,Math.sin(a)*.2),new THREE.Vector3(Math.cos(a)*.45,-.35,Math.sin(a)*.45),new THREE.Vector3(Math.cos(a)*.6,-.55,Math.sin(a)*.6+.1)]); g.add(new THREE.Mesh(new THREE.TubeGeometry(cv,10,.06,6,false),mat)); }
      for(const z of [-.16,.16]){ const e=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),eye); e.position.set(.36,.3,z); g.add(e); } }
    else if(o.k==="star"){ const sh=new THREE.Shape(); for(let i=0;i<10;i++){ const a=i/10*Math.PI*2-Math.PI/2, rr=i%2?.22:.6; i?sh.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):sh.moveTo(Math.cos(a)*rr,Math.sin(a)*rr); } g.add(new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.12,bevelEnabled:true,bevelSize:.05,bevelThickness:.05,bevelSegments:2}),mat)); }
    else if(o.k==="boot"){ const l=new THREE.Mesh(new RoundedBoxGeometry(.4,.8,.4,2,.08),mat); l.position.y=.2; g.add(l); const f=new THREE.Mesh(new RoundedBoxGeometry(.75,.28,.42,2,.1),mat); f.position.set(.2,-.25,0); g.add(f);
      const weed=new THREE.Mesh(new THREE.TorusGeometry(.2,.03,5,12,Math.PI*1.3),M(0x3E9A5E)); weed.position.set(0,.65,0); g.add(weed); }
    else if(o.k==="crab"){ const b=new THREE.Mesh(new THREE.SphereGeometry(.38,14,10),mat); b.scale.set(1.3,.6,1); g.add(b);
      for(const sx of [-1,1]){ const cl=new THREE.Mesh(new THREE.SphereGeometry(.15,10,8),mat); cl.scale.set(1,.7,1.3); cl.position.set(.45,.05,sx*.38); g.add(cl);
        for(let k=0;k<3;k++){ const lg=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.4,5),mat); lg.position.set(-.15+k*.15,-.1,sx*.42); lg.rotation.x=sx*1.1; g.add(lg); }
        const e=new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),eye); e.position.set(.3,.25,sx*.1); g.add(e); } }
    shadowy(g); return g; }
  function pickCatch(){ if(Math.random()<.35){ const it=rollMed(); return {n:it.n,k:"med",med:it.med,ic:it.ic,gold:it.r>=3}; } const tot=CATCH.reduce((a,b)=>a+b.w,0); let r=Math.random()*tot; for(const c of CATCH){ r-=c.w; if(r<=0) return c; } return CATCH[0]; }
  function fishStart(){ if(orLocked()){ lockMsg(); return; } loungeEnd(); sandEnd(); hideOrb(); if(FISH){ fishEnd(); return; } if(OFF){ offEnd(()=>fishStart()); return; } releaseIV(); if(bookEl) closeBook(); danceT=0;
    if(focus){ focus=null; target=null; setHud(); try{ history.replaceState(null,"",location.pathname+location.search); }catch(e){} }
    let I=islandAt(nurse.position); if(I.room) I=ISL[0];
    let a0=Math.atan2(camera.position.z-I.c.z,camera.position.x-I.c.x), a=a0;
    for(let k=0;k<26;k++){ const aa=a0+(k%2?1:-1)*Math.ceil(k/2)*.24; const x=I.c.x+Math.cos(aa)*(I.R-1.4), z=I.c.z+Math.sin(aa)*(I.R-1.4);
      if(BRIDGES.every(br=>segDist(x,z,br)>5.8)&&Object.values(D3).every(d=>Math.hypot(d.c.x-x,d.c.z-z)>AV_R+.5)){ a=aa; break; } }
    const dir=new THREE.Vector3(Math.cos(a),0,Math.sin(a)); const stand=I.c.clone().addScaledVector(dir,I.R-1.4); stand.y=0;
    FISH={phase:"walk",dir,spot:I.c.clone().addScaledVector(dir,I.R+6.5),t:0}; viewIsl=I.i; inHut=false; faceCamera=false; mode="fish"; setHud();
    { const ot=document.getElementById("offToggle"); if(ot) ot.textContent="🎣 釣魚中"; }
    route(pathTo(stand),()=>{ if(!FISH) return; FISH.phase="cast"; FISH.t=0; setTools(false); FROD.rod.visible=true; nurse.quaternion.setFromAxisAngle(up0,Math.atan2(dir.x,dir.z)); faceCamera=false;
      const side=new THREE.Vector3(-dir.z,0,dir.x); tweenCam(stand.clone().addScaledVector(side,11).addScaledVector(dir,-7).add(new THREE.Vector3(0,7.5,0)),stand.clone().addScaledVector(dir,3.5).add(new THREE.Vector3(0,2.2,0)),1300); });
    marker(stand); }
  function fishEnd(){ loungeEnd(); sandEnd(); hideOrb(); if(BUSY&&BUSY.k==="pick"&&BUSY.obj.userData.item==="寄居蟹"){ BUSY.obj.userData.held=false; BUSY.obj.position.copy(BUSY.from); } if(BUSY){ BUSY=null; if(mode==="busy") mode="idle"; } if(!FISH) return; FISH=null; FROD.rod.visible=false; FROD.line.visible=false; FROD.bob.visible=false; if(FCATCH){ scene.remove(FCATCH); FCATCH=null; }
    setTools(true); const ud=nurse.userData; ud.armR.sh.rotation.set(-.95,0,.12); ud.armR.fore.rotation.x=-.75; ud.armL.sh.rotation.set(-.85,0,-.12); ud.armL.fore.rotation.x=-.85; FROD.rod.rotation.x=.85;
    if(mode==="fish") mode="idle"; faceCamera=true; { const ot=document.getElementById("offToggle"); if(ot&&!OFF) ot.textContent="🏖️ 下班"; } }
  function fishTick(dt,tt){ if(!FISH||FISH.phase==="walk"||walk) return; FISH.t+=dt; const ud=nurse.userData, F=FISH, t=F.t;
    ud.armR.sh.rotation.set(-1.15,0,.3); ud.armR.fore.rotation.x=-.7; ud.armL.sh.rotation.set(-1.0,0,-.45); ud.armL.fore.rotation.x=-1.0;
    const wy=(p)=>waveH(p.x,p.z,tt,ENV.wave())-.7; const tipW=new THREE.Vector3(); nurse.updateMatrixWorld(); FROD.tip.getWorldPosition(tipW);
    const spot=F.spot.clone(); spot.y=wy(spot)+.08; let bob=spot.clone(); let pitch=.85;
    if(F.phase==="cast"){ const k=Math.min(1,t/1.0); pitch=k<.35?.85-k/.35*1.0:-.15+(k-.35)/.65*1.0;
      bob=k<.35?tipW.clone():tipW.clone().lerp(spot,(k-.35)/.65); if(k>=.35) bob.y+=Math.sin((k-.35)/.65*Math.PI)*3;
      if(k>=1){ F.phase="wait"; F.t=0; F.next=2.5+Math.random()*4.5; for(let i=0;i<6;i++) splashAt(spot); } }
    else if(F.phase==="wait"){ bob.y+=Math.sin(tt*2.6)*.07; if(t>F.next){ F.phase="bite"; F.t=0; } }
    else if(F.phase==="bite"){ bob.y-=Math.sin(tt*28)>0?.32:.04; pitch=.85+Math.sin(tt*20)*.04; if(Math.random()<dt*10) splashAt(spot);
      if(t>1.1){ F.phase="reel"; F.t=0; F.c=pickCatch(); FCATCH=mkCatch(F.c); FCATCH.scale.setScalar(.9); scene.add(FCATCH); for(let i=0;i<12;i++) splashAt(spot); } }
    else if(F.phase==="reel"){ const k=Math.min(1,t/1.2); pitch=.85-k*.75; const above=nurse.position.clone().addScaledVector(F.dir,1.6).add(new THREE.Vector3(0,4.6,0));
      bob=spot.clone().lerp(above,k); bob.y+=Math.sin(k*Math.PI)*3; FCATCH.position.copy(bob).add(new THREE.Vector3(0,-.55,0)); FCATCH.rotation.set(Math.sin(tt*14)*.5,Math.atan2(F.dir.x,F.dir.z)-Math.PI/2,Math.sin(tt*11)*.4);
      if(k>=1){ F.phase="show"; F.t=0; FISHN++; const bag=bagAdd(F.c.n); toast(`🎣 釣到了 ${F.c.gold?"✨ ":""}${F.c.k==="med"?F.c.ic+" ":""}${F.c.n}!<small>(今天第 ${FISHN} 個 · ${bag})</small>`,F.c.gold?"unlock":"coin"); react(F.c.k==="boot"?"wrong":F.c.gold?"unlock":"right"); } }
    else if(F.phase==="show"){ pitch=.1; const above=nurse.position.clone().addScaledVector(F.dir,1.6).add(new THREE.Vector3(0,4.6,0)); bob=above.clone().add(new THREE.Vector3(0,Math.sin(tt*3)*.08,0));
      FCATCH.position.copy(bob).add(new THREE.Vector3(0,-.55,0)); FCATCH.rotation.x=Math.sin(tt*9)*.35;
      if(t>1.9){ scene.remove(FCATCH); FCATCH=null; poof(bob.clone().add(new THREE.Vector3(0,-3,0))); F.phase="cast"; F.t=0; } }
    FROD.rod.rotation.x=pitch; FROD.bob.visible=true; FROD.bob.position.copy(bob); FROD.line.visible=true;
    nurse.updateMatrixWorld(); FROD.tip.getWorldPosition(tipW);
    const arr=FROD.line.geometry.attributes.position.array, sag=F.phase==="wait"||F.phase==="bite"?.8:.2;
    for(let i=0;i<20;i++){ const u=i/19; const x=tipW.x+(bob.x-tipW.x)*u, y=tipW.y+(bob.y+.15-tipW.y)*u-Math.sin(u*Math.PI)*sag, z=tipW.z+(bob.z-tipW.z)*u; arr[i*3]=x; arr[i*3+1]=y; arr[i*3+2]=z; }
    FROD.line.geometry.attributes.position.needsUpdate=true; }
  function goIV(){ if(!holdIV) toggleIV(); }
  let onStool=false;
  function sitStool(){ onStool=true; STOOL.g.removeFromParent(); nurse.add(STOOL.g); STOOL.g.position.set(0,0,-.28); STOOL.g.rotation.set(0,0,0); STOOL.g.scale.setScalar(.82); }
  function releaseStool(){ if(!onStool) return; onStool=false; const ud=nurse.userData; nurse.updateMatrixWorld(); const p=new THREE.Vector3(); STOOL.g.getWorldPosition(p);
    STOOL.g.removeFromParent(); scene.add(STOOL.g); STOOL.g.position.set(p.x,groundY(p.x,p.z),p.z); STOOL.g.rotation.set(0,nurse.rotation.y,0); STOOL.g.scale.setScalar(STOOL.S);
    ud.body.position.y=0; ud.legs.forEach(l=>l.rotation.set(0,0,0)); ud.armR.sh.rotation.set(-.95,0,.12); ud.armR.fore.rotation.x=-.75; ud.armL.sh.rotation.set(-.85,0,-.12); ud.armL.fore.rotation.x=-.85; }
  function toggleStool(){ fishEnd(); if(onStool){ releaseStool(); return; } releaseIV();
    if(focus){ if(bookEl) closeBook(); focus=null; target=null; setHud(); try{ history.replaceState(null,"",location.pathname+location.search); }catch(e){} }
    const p=STOOL.g.position.clone(); p.y=0; faceCamera=false;
    route(pathTo(p),()=>{ sitStool(); mode="idle"; faceCamera=true; wanderT=1.2; }); }
  function goStool(){ if(!onStool) toggleStool(); }
  function setTools(v){ nurse.userData.ETT.visible=v; nurse.userData.TW.visible=v; }
  function releaseIV(){ releaseStool(); if(!holdIV) return; holdIV=false; setTools(true); nurse.userData.armL.sh.rotation.set(-.85,0,-.12); nurse.userData.armL.fore.rotation.x=-.85; nurse.userData.armR.sh.rotation.set(-.95,0,.12); nurse.userData.armR.fore.rotation.x=-.75; IV.g.position.y=groundY(IV.g.position.x,IV.g.position.z); }
  function toggleIV(){ fishEnd(); if(holdIV){ releaseIV(); return; } releaseStool();
    if(focus){ if(bookEl) closeBook(); focus=null; target=null; setHud(); try{ history.replaceState(null,"",location.pathname+location.search); }catch(e){} }
    const p=IV.g.position, out=new THREE.Vector3(p.x,0,p.z).normalize(); const side=new THREE.Vector3(-out.z,0,out.x);
    const stand=new THREE.Vector3(p.x,0,p.z).addScaledVector(out,.6).addScaledVector(side,-1.5);
    const a=nurse.position, ab=new THREE.Vector3(stand.x-a.x,0,stand.z-a.z); const k=ab.lengthSq()?Math.max(0,Math.min(1,-(a.x*ab.x+a.z*ab.z)/ab.lengthSq())):0;
    const pts=pathTo(stand);
    faceCamera=false; route(pts,()=>{ holdIV=true; setTools(false); mode="idle"; faceCamera=true; wanderT=1.2; }); }
  function goHut(instant){ releaseIV();
    const done=()=>{ inHut=true; mode="hut"; faceCamera=false; nurse.quaternion.setFromAxisAngle(up0,0); };
    if(instant){ nurse.position.copy(HUT.inside); done(); return; }
    if(inHut) return; route([...pathTo(HUT.door), HUT.inside.clone()], done); }
  function goFront(){ route(pathTo(HUT.front),()=>{ mode="idle"; faceCamera=true; }); }
  ENV.onChange=()=>{ if(focus||OFF||FISH||SAND||BUSY) return; if(ENV.raining()){ if(islandAt(nurse.position).i===0) goHut(); } else if(inHut) goFront(); };
  function goHome(){ if(OFF){ offEnd(); return; } const i=focus?D3[focus].isl:islandAt(nurse.position).i; goIsland(i); }

  /* ---------- shelves and books ---------- */
  /* ---------- 典雅胡桃木書櫃 + 皮革精裝書 ---------- */
  const grain=(base,dark,seed)=>{ const t=tex(512,512,(g,w,h)=>{ g.fillStyle=base; g.fillRect(0,0,w,h); let s=seed;
      const r=()=>{ s=(s*16807)%2147483647; return (s-1)/2147483646; };
      for(let i=0;i<140;i++){ const y0=r()*h, amp=4+r()*16, fr=.004+r()*.012, ph=r()*6; g.strokeStyle=dark; g.globalAlpha=.06+r()*.18; g.lineWidth=.8+r()*2.6;
        g.beginPath(); for(let x=0;x<=w;x+=8){ const y=y0+Math.sin(x*fr+ph)*amp+Math.sin(x*fr*3.1+ph)*amp*.25; x?g.lineTo(x,y):g.moveTo(x,y); } g.stroke(); }
      g.globalAlpha=1; });
    t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; };
  const WAL=new THREE.MeshStandardMaterial({color:0xFFFFFF,map:grain("#9A6844","#5A3720",3),roughness:.42,metalness:.05});
  const WAL_D=new THREE.MeshStandardMaterial({color:0xFFFFFF,map:grain("#7A5034","#43281A",9),roughness:.5});
  const WAL_L=new THREE.MeshStandardMaterial({color:0xFFFFFF,map:grain("#B47D55","#6E4628",17),roughness:.38});
  const BRASS=new THREE.MeshStandardMaterial({color:0xD4AE62,metalness:.85,roughness:.28});
  const MGCOL=["#1F3550","#22404A","#2C2F55","#1E4A3C","#4A2A3A"];
  const LEATHER=["#7A2430","#1F3A5C","#2F5A3E","#6B3F22","#4B2B57","#8A5A2B"];
  const bookCol=(sid,i)=>{ const c=new THREE.Color(css("--"+sid)); const hsl={}; c.getHSL(hsl,THREE.SRGBColorSpace);
    const alt=new THREE.Color(LEATHER[(i+sid.length)%LEATHER.length]); const out=new THREE.Color().setHSL(hsl.h,Math.min(.62,hsl.s*.8),.22+(i%3)*.05,THREE.SRGBColorSpace); return i%3===2?alt:out; };
  const spineTex=(t,col,w,h,bands)=>tex(w,h,(g)=>{
    const base=new THREE.Color(col);
    g.fillStyle=base.getStyle(); g.fillRect(0,0,w,h);
    for(let i=0;i<2600;i++){ g.fillStyle=`rgba(${Math.random()<.5?"0,0,0":"255,255,255"},${Math.random()*.05})`; g.fillRect(Math.random()*w,Math.random()*h,2+Math.random()*3,2+Math.random()*3); }
    const sh=g.createLinearGradient(0,0,w,0); sh.addColorStop(0,"rgba(0,0,0,.45)"); sh.addColorStop(.3,"rgba(255,255,255,.16)"); sh.addColorStop(.5,"rgba(255,255,255,.04)"); sh.addColorStop(1,"rgba(0,0,0,.5)"); g.fillStyle=sh; g.fillRect(0,0,w,h);
    const GOLD=g.createLinearGradient(0,0,w,0); GOLD.addColorStop(0,"#9C7A34"); GOLD.addColorStop(.45,"#F6DE97"); GOLD.addColorStop(1,"#A9853B");
    g.fillStyle=GOLD;
    bands.forEach(f=>{ const y=(1-f)*h; g.fillRect(6,y-12,w-12,2); g.fillRect(6,y+10,w-12,2); });
    g.fillRect(6,10,w-12,4); g.fillRect(6,h-14,w-12,4);
    // dark title label with gold frame
    const ly0=h*.33, ly1=h*.71; g.fillStyle="rgba(20,10,8,.78)"; g.fillRect(12,ly0,w-24,ly1-ly0);
    g.strokeStyle="#E7C878"; g.lineWidth=3; g.strokeRect(17,ly0+5,w-34,ly1-ly0-10);
    const label=t.tag; const fs=Math.min(w*.5,46); g.fillStyle=GOLD; g.textAlign="center"; g.textBaseline="middle";
    const CJK=/[　-鿿＀-￯]/; const toks=label.match(/[　-鿿＀-￯]|[^　-鿿＀-￯\s]+/g)||[label];
    g.font=`700 ${fs}px "Noto Serif TC","Noto Sans TC",serif`;
    const sizes=toks.map(k=>CJK.test(k)?fs*1.1:g.measureText(k).width+fs*.3);
    const total=sizes.reduce((a,b)=>a+b,0), avail=(ly1-ly0)-40, sc=Math.min(1,avail/total);
    g.save(); g.translate(w/2,ly0+20+(avail-total*sc)/2); g.scale(Math.min(1,sc*1.15),sc);
    g.shadowColor="rgba(0,0,0,.6)"; g.shadowOffsetY=2; g.shadowBlur=2;
    let y=0; toks.forEach((k,i)=>{ const s=sizes[i]; if(CJK.test(k)) g.fillText(k,0,y+s/2); else { g.save(); g.translate(0,y+s/2); g.rotate(Math.PI/2); g.fillText(k,0,0); g.restore(); } y+=s; });
    g.restore();
    // question count in a small gold roundel near the foot
    const cy=h*.78; g.fillStyle="rgba(20,10,8,.62)"; g.beginPath(); g.ellipse(w/2,cy,w*.36,40,0,0,7); g.fill(); g.strokeStyle="#E7C878"; g.lineWidth=2.5; g.stroke();
    g.fillStyle="#F3D990"; g.font=`700 ${Math.min(w*.24,36)}px "Noto Serif TC",serif`; g.fillText(t.refs.length+"題",w/2,cy+2);
    // small fleuron at the top panel
    g.fillStyle="#E7C878"; { g.font=`${Math.min(w*.3,30)}px serif`; g.fillText("❦",w/2,h*.2); }
  });
  function goldEmblem(cv,im){
    const g=cv.getContext("2d"), W=cv.width, cx=W/2;
    // 1) organ silhouette + its own tonal detail -> luminance map
    const t=document.createElement("canvas"); t.width=t.height=W; const tg=t.getContext("2d");
    tg.drawImage(im,W*.17,W*.17,W*.66,W*.66);
    const src=tg.getImageData(0,0,W,W), d=src.data;
    const L=new Float32Array(W*W), A=new Float32Array(W*W);
    for(let i=0;i<W*W;i++){ const a=d[i*4+3]/255; A[i]=a; L[i]=(d[i*4]*.3+d[i*4+1]*.59+d[i*4+2]*.11)/255; }
    // 2) gold ramp shaded by the original tones plus a top-left emboss light from the alpha edge
    const out=g.createImageData(W,W), o=out.data;
    const ramp=(v)=>{ const s=[[0,[86,56,18]],[.35,[150,108,42]],[.62,[214,172,88]],[.82,[246,218,140]],[1,[255,246,206]]]; for(let k=1;k<s.length;k++){ if(v<=s[k][0]){ const f=(v-s[k-1][0])/(s[k][0]-s[k-1][0]); return s[k-1][1].map((c,j)=>c+(s[k][1][j]-c)*f); } } return s[s.length-1][1]; };
    for(let y=1;y<W-1;y++) for(let x=1;x<W-1;x++){ const i=y*W+x; const a=A[i]; if(a<.02) continue;
      const gx=(A[i+1]-A[i-1])+(L[i+1]-L[i-1])*.6, gy=(A[i+W]-A[i-W])+(L[i+W]-L[i-W])*.6; const light=(-gx-gy)*1.6;
      let v=.25+L[i]*.55+light*.5; v=Math.max(0,Math.min(1,v)); const c=ramp(v);
      o[i*4]=c[0]; o[i*4+1]=c[1]; o[i*4+2]=c[2]; o[i*4+3]=Math.min(255,a*255); }
    g.clearRect(0,0,W,W);
    // 3) oval cartouche: dark leather inset with double gilt rule and corner fleurons
    g.fillStyle="rgba(40,22,12,.55)"; g.beginPath(); g.ellipse(cx,cx,W*.43,W*.47,0,0,7); g.fill();
    const gold=g.createLinearGradient(0,0,W,W); gold.addColorStop(0,"#F9E3A0"); gold.addColorStop(.5,"#B98A3A"); gold.addColorStop(1,"#F2D388");
    g.strokeStyle=gold; g.lineWidth=10; g.beginPath(); g.ellipse(cx,cx,W*.43,W*.47,0,0,7); g.stroke();
    g.lineWidth=3; g.beginPath(); g.ellipse(cx,cx,W*.4,W*.44,0,0,7); g.stroke();
    g.fillStyle=gold; g.font=`${W*.07}px serif`; g.textAlign="center"; g.textBaseline="middle"; [[cx,W*.06],[cx,W*.94]].forEach(([x,y])=>g.fillText("❦",x,y));
    // 4) the embossed organ: drop shadow then gilt
    const tmp=document.createElement("canvas"); tmp.width=tmp.height=W; tmp.getContext("2d").putImageData(out,0,0);
    g.save(); g.shadowColor="rgba(0,0,0,.6)"; g.shadowBlur=8; g.shadowOffsetX=4; g.shadowOffsetY=5; g.drawImage(tmp,0,0); g.restore();
    g.drawImage(tmp,0,0);
  }
  function buildShelf(sid){
    const d=D3[sid]; const ts=topicsOf(sid);
    const shelf=new THREE.Group();
    const dims=[{t:{id:"ov-"+sid,tag:"麻醉影響總覽",refs:[...new Set(ts.flatMap(t=>t.refs))]},i:-1,ov:true,th:1.25,h:3.7},...ts.map((t,i)=>({t,i,th:.82+Math.min(t.refs.length,14)*.04,h:3.15+((t.id.charCodeAt(0)+t.id.length)%5)*.11}))];
    const gap=.05; const rowW=r=>r.reduce((a,b)=>a+b.th+gap,0)+.7;
    const lower=dims.filter(b=>!b.mg), upper=dims.filter(b=>b.mg);
    // 書超過 9 本就分上下兩層(前半在上層),書櫃才不會太寬
    const half=Math.ceil(dims.length/2); const rows=dims.length>9?[dims.slice(half),dims.slice(0,half)]:(lower.length>1&&upper.length?[lower,upper]:[dims]); d.rows=rows.length;
    const L=Math.max(4.6,...rows.map(rowW)), ROWH=4.05;
    const H=4.7+(rows.length-1)*ROWH, DEP=2.6, BASE=.62;
    const box=(w,h,dd,m,x,y,z,r=.04)=>{ const b=new THREE.Mesh(new RoundedBoxGeometry(w,h,dd,2,r),m); b.position.set(x,y,z); shelf.add(b); return b; };
    // plinth with bun feet
    box(L+1.15,BASE-.12,DEP+.3,WAL_D,0,(BASE-.12)/2+.12,0);
    box(L+1.3,.12,DEP+.42,WAL_L,0,BASE-.06,.0);
    for(const sx of [-1,1]) for(const sz of [-1,1]){ const f=new THREE.Mesh(new THREE.SphereGeometry(.2,14,10),WAL_D); f.scale.y=.7; f.position.set(sx*(L/2+.38),.12,sz*(DEP/2-.05)); shelf.add(f); }
    // back panel with a raised field
    box(L+.2,H,.14,WAL_D,0,BASE+H/2,-DEP/2+.07);
    box(L-.4,H-.7,.06,WAL,0,BASE+H/2,-DEP/2+.17,.08);
    // side pilasters with fluting and brass capitals
    for(const sx of [-1,1]){ const x=sx*(L/2+.24);
      box(.48,H,DEP,WAL,x,BASE+H/2,0);
      for(const fx of [-.11,0,.11]) box(.045,H-.9,.04,WAL_D,x+fx,BASE+H/2,DEP/2+.01,.02);
      box(.58,.14,DEP+.1,BRASS,x,BASE+H-.28,.02,.03); box(.58,.14,DEP+.1,BRASS,x,BASE+.28,.02,.03); }
    // shelf boards
    box(L,.12,DEP-.1,WAL_L,0,BASE+.06,.0);
    for(let k=1;k<rows.length;k++) box(L,.12,DEP-.1,WAL_L,0,BASE+k*ROWH+.06,.0);
    // cornice in three steps + arched crest
    box(L+1.15,.24,DEP+.25,WAL,0,BASE+H+.12,.0);
    box(L+1.45,.16,DEP+.45,WAL_L,0,BASE+H+.32,.0);
    box(L+1.2,.18,DEP+.28,WAL_D,0,BASE+H+.49,.0);
    const crestS=new THREE.Shape(); const cw=Math.min(L*.62,4.6), ch=1.0; crestS.moveTo(-cw/2,0); crestS.quadraticCurveTo(-cw/2,ch*.15,-cw*.3,ch*.35); crestS.quadraticCurveTo(0,ch*1.25,cw*.3,ch*.35); crestS.quadraticCurveTo(cw/2,ch*.15,cw/2,0); crestS.lineTo(-cw/2,0);
    const crest=new THREE.Mesh(new THREE.ExtrudeGeometry(crestS,{depth:.22,bevelEnabled:true,bevelSize:.04,bevelThickness:.04,bevelSegments:2}),WAL); crest.position.set(0,BASE+H+.58,.6); shelf.add(crest);
    // engraved brass plaque
    const plW=Math.min(L*.55,3.6);
    const plaque=new THREE.Mesh(new THREE.PlaneGeometry(plW,.5),new THREE.MeshStandardMaterial({metalness:.35,roughness:.4,emissive:0x2A1A08,emissiveIntensity:.25,map:tex(640,90,(g,w,h)=>{
      const bg=g.createLinearGradient(0,0,0,h); bg.addColorStop(0,"#4A2C16"); bg.addColorStop(1,"#2E1A0C"); g.fillStyle=bg; g.fillRect(0,0,w,h);
      const gold=g.createLinearGradient(0,10,0,h-10); gold.addColorStop(0,"#FFF1B8"); gold.addColorStop(.45,"#E2B456"); gold.addColorStop(.55,"#B9852F"); gold.addColorStop(1,"#F2D27E");
      g.strokeStyle=gold; g.lineWidth=3; g.strokeRect(8,8,w-16,h-16); g.lineWidth=1.5; g.strokeRect(14,14,w-28,h-28);
      g.font='700 50px "Noto Serif TC","Noto Sans TC",serif'; g.textAlign="center"; g.textBaseline="middle";
      g.fillStyle="rgba(0,0,0,.55)"; g.fillText(sysById[sid].name+" 文庫",w/2+2,h/2+5); g.fillStyle=gold; g.fillText(sysById[sid].name+" 文庫",w/2,h/2+3); })}));
    plaque.position.set(0,BASE+H+.12,DEP/2+.14); shelf.add(plaque);
    const plaque2=plaque.clone(); plaque2.position.set(0,BASE+.95,-DEP/2-.02); plaque2.rotation.y=Math.PI; plaque2.scale.setScalar(1.15); shelf.add(plaque2);
    // gold-tooled organ emblem: the district's illustration re-cast as gilt relief inside an oval cartouche
    const emC=document.createElement("canvas"); emC.width=emC.height=640; const emT=new THREE.CanvasTexture(emC); emT.colorSpace=THREE.SRGBColorSpace; emT.anisotropy=8;
    const emMat=new THREE.MeshStandardMaterial({map:emT,transparent:true,alphaTest:.04,metalness:.15,roughness:.38,color:0xFFFFFF,emissive:0x3A2A0E,emissiveIntensity:.35});
    const emSize=Math.min(H*.62,L*.6); const em=new THREE.Mesh(new THREE.PlaneGeometry(emSize,emSize),emMat); em.position.set(0,BASE+H*.62,-DEP/2-.03); em.rotation.y=Math.PI; shelf.add(em);
    svgImg(sid).then(im=>{ if(!im) return; goldEmblem(emC,im); emT.needsUpdate=true; });
    for(const sx of [-1,1]){ const sc=new THREE.Mesh(new THREE.SphereGeometry(.05,8,6),BRASS); sc.position.set(sx*(plW/2-.12),BASE+H+.12,DEP/2+.16); shelf.add(sc); }
    // a warm little lamp glow inside the case
    const glow=new THREE.PointLight(0xFFD9A0,2.5,8,2); glow.position.set(0,BASE+H-.5,.9); shelf.add(glow); d.glow=glow; d.shelfTop=BASE+H+1.7;
    // books
    rows.forEach((row,ri)=>{ let x=-rowW(row)/2+.35;
    row.forEach(b=>{ const col=b.ov?new THREE.Color(0x6B4A12):b.mg?new THREE.Color(MGCOL[b.t.mg%MGCOL.length]):bookCol(sid,b.i); const colS=col.getStyle();
      const bands=[.88];
      const sp=spineTex(b.t,colS,160,560,bands);
      const leather=M(col,{roughness:.62}), pages=M(0xF6EBCF,{roughness:.95}), gilt=new THREE.MeshStandardMaterial({color:0xE2C27A,metalness:.6,roughness:.35});
      const grp=new THREE.Group(); const D2=2.05;
      // covers (slightly larger than the page block) + page block with gilt top edge
      const cv=.07;
      for(const sx of [-1,1]){ const c=new THREE.Mesh(new RoundedBoxGeometry(cv,b.h,D2,2,.025),leather); c.position.set(sx*(b.th/2-cv/2),b.h/2,0); grp.add(c); }
      const blk=new THREE.Mesh(new THREE.BoxGeometry(b.th-cv*2,b.h-.12,D2-.12),[pages,pages,gilt,pages,pages,pages]); blk.position.set(0,b.h/2,-.06); grp.add(blk);
      // rounded spine carrying the label
      const r=b.th/2; const spine=new THREE.Mesh(new THREE.CylinderGeometry(r,r,b.h,24,1,true,-Math.PI/2,Math.PI),new THREE.MeshStandardMaterial({map:sp,roughness:.55}));
      spine.scale.z=.42; spine.position.set(0,b.h/2,D2/2-.02); grp.add(spine);
      // raised bands
      bands.forEach(f=>{ const band=new THREE.Mesh(new THREE.CylinderGeometry(r*1.03,r*1.03,.06,24,1,false,-Math.PI/2,Math.PI),leather); band.scale.z=.45; band.position.set(0,f*b.h,D2/2-.02); grp.add(band); });
      const holder=new THREE.Group(); holder.add(grp);
      holder.position.set(x+b.th/2,BASE+.12+ri*ROWH,.05); holder.userData={topic:b.t.id,home:holder.position.clone(),lift:0};
      shelf.add(holder); d.books[b.t.id]=holder; x+=b.th+gap; }); });
    // a small brass reading lamp + bookend flourish at the right end of the case top
    const u=d.u.clone(); shelf.position.copy(d.c).addScaledVector(u,1.0); shelf.position.y=TOP+PH; shelf.rotation.y=Math.atan2(-u.x,-u.z);
    shelf.userData.shelf=sid; shadowy(shelf); scene.add(shelf); d.shelf=shelf; d.rise=0; d.baseY=shelf.position.y; d.sinkBy=BASE+H+1.9; shelf.position.y=d.baseY-d.sinkBy; shelf.visible=false;
  }
  for(const sid of Object.keys(D3)) buildShelf(sid);
  function openFromShelf(id){ if(id&&id.startsWith("ov-")){ const sd=id.slice(3); if(focus!==sd){ goDistrict(sd,id); return; } openId=id; openOverview(sd); return; } const t=byId[id]; if(!t) return; if(focus!==t.sys){ goDistrict(t.sys,id); return; } pickBook(id); openBook(id); }
  function pickBook(id){ if(id&&id.startsWith("ov-")){ openId=id; return; } const t=byId[id]; const d=D3[t&&t.sys]; if(!d||!d.books[id]) { openId=id; return; } openId=id; }
  function closeShelfBooks(){ openId=null; }
  function setHud(){ document.body.classList.toggle("on-or",viewIsl===3&&!focus&&!OFF); { const ot=document.getElementById("offToggle"), on=OFF&&!["cruise","return","hopback"].includes(OFF.phase); if(ot) ot.textContent=on?(OFF.kind==="swim"?"🐬 下班中":OFF.kind==="free"?(SNORKEL?"🤿 浮潛中":"🏊 下班中"):OFF.kind==="surf"?"🏄 衝浪中":OFF.kind==="sup"?"🛶 SUP 中":"⛵ 下班中"):"🏖️ 下班"; document.querySelectorAll(".offbtn").forEach(x=>x.setAttribute("aria-pressed",!!on&&x.dataset.off===(OFF.kind==="free"&&SNORKEL?"snorkel":OFF.kind))); }
    const bar=$("dbar"); bar.hidden=!focus; $("hint").textContent=OFF?"下班中~點「下班 → 回去上班」或點街區就會回來上班":focus?"點書櫃或「打開書櫃」選一本書來看":(innerWidth<600?"點沙灘走過去 · 雙指拖曳移動畫面":"點沙灘小麻會走過去 · 點街區進入科別 · 右鍵拖曳可移動畫面");
    if(focus){ const s=sysById[focus]; const ts=topicsOf(focus); const n=new Set(ts.flatMap(t=>t.refs)).size;
      bar.style.setProperty("--c",`var(--${focus})`);
      bar.classList.add("mini");
      bar.innerHTML=`<button class="back" id="back" type="button">← 回到島上</button><button class="dsw dopen" id="dopen" type="button">📚 打開書櫃</button><button class="dsw" id="dsw" type="button" aria-expanded="false">換科別 ▾</button>
        <div class="dnav" id="dnavPop" hidden>${ISL.filter(I=>I.sids.length).map(I=>`<span class="dnis">${I.ic} ${I.name}</span>`+I.sids.filter(k=>sysById[k]).map(k=>`<button type="button" data-d="${k}" style="--dc:var(--${k})"${k===focus?' aria-current="true"':''}>${sysById[k].name}</button>`).join("")).join("")}</div>`;
      if(false) bar.innerHTML=`<h2>${s.name}<span class="en">${s.en}</span></h2>${OVERVIEW[focus]?`<button class="ovbtn" type="button" id="ovBtn">📖 ${OVERVIEW[focus].title.replace("的影響","")}</button>`:""}
        <span class="dmeta">${ts.length} 本書 · 歷屆考古題 ${n} 題 · AI 猜題 ${s.aiq.length} 題 · 書背數字 = 該主題考題數</span>
        <details><summary>書目</summary><div class="blist">${ts.map(t=>`<button type="button" data-b="${t.id}">${t.name}</button>`).join("")}</div></details>
        <div class="dnav"><span class="lbl">換科別</span>${ORDER.filter(k=>sysById[k]).map(k=>`<button type="button" data-d="${k}" style="--dc:var(--${k})"${k===focus?' aria-current="true"':''}>${sysById[k].name}</button>`).join("")}</div>`;
      $("back").onclick=goHome; $("dopen").onclick=()=>openShelfMenu(focus); { const sw=$("dsw"), pop=$("dnavPop"); sw.onclick=()=>{ const o=pop.hidden; pop.hidden=!o; sw.setAttribute("aria-expanded",o); sw.textContent=o?"換科別 ▴":"換科別 ▾"; }; } const ob=$("ovBtn"); if(ob) ob.onclick=()=>openFromShelf("ov-"+focus);
      bar.querySelectorAll("[data-d]").forEach(b=>b.onclick=()=>{ if(b.dataset.d!==focus) goDistrict(b.dataset.d); });
      
      bar.querySelectorAll("[data-b]").forEach(b=>b.onclick=()=>openFromShelf(b.dataset.b)); }
  }
  function homeView(){ const I=ISL[viewIsl]||ISL[0], q=(I.R+8)/38;
    if(I.room){ const asp=(stage.clientWidth||1)/(stage.clientHeight||1); const u=new THREE.Vector3(Math.sin(I.room.yaw),0,Math.cos(I.room.yaw)); const run=document.body.classList.contains("or-run"); const hgt=asp<1?(run?62:44):(run?34:25); return {pos:I.c.clone().addScaledVector(u,asp<1?(run?10:7):(run?12:9)).add(new THREE.Vector3(0,hgt,0)), tgt:I.c.clone().addScaledVector(u,asp<1?1.5:.8).add(new THREE.Vector3(0,1.5,0))}; } const w=stage.clientWidth||1,h=stage.clientHeight||1, asp=w/h; const fov=(asp<1?58:46)*Math.PI/180;
    const hf=2*Math.atan(Math.tan(fov/2)*asp); const dist=asp<1?Math.max(50*q,(I.R+1)/Math.tan(hf/2)):Math.max(66*q, (I.R+8)/Math.tan(hf/2)); const pitch=(asp<1?52:34)*Math.PI/180;
    return {pos:new THREE.Vector3(0,Math.sin(pitch),Math.cos(pitch)).multiplyScalar(dist).add(new THREE.Vector3(0,0,4*q)).add(I.c), tgt:new THREE.Vector3(0,asp<1?-1:1,(asp<1?4:3)*q).add(I.c)}; }
  function islandFront(I){ if(I.room) return (NET.role==="guest"?I.room.station2:I.room.station).clone(); if(I.i===0) return HUT.front.clone(); if(I.ring) return I.c.clone().add(new THREE.Vector3(0,0,I.ring+3.6)); const d=D3[I.sids[0]]; return I.c.clone().addScaledVector(d?d.u:new THREE.Vector3(0,0,1),-(PR+2.2)); }
  let chase=null;
  function jumpOffDuty(){ if(!OFF) return; const v=OFF.v; if(v) v.visible=false; if(OFF.x&&OFF.x.v2) OFF.x.v2.visible=false; ENV.taken=null; const ud=nurse.userData; ud.setOutfit("scrub"); nurse.quaternion.identity(); ud.body.position.y=0; ud.body.rotation.set(0,0,0); ud.head.rotation.set(0,0,0);
    ud.legs.forEach(l=>l.rotation.set(0,0,0)); ud.armR.sh.rotation.set(-.95,0,.12); ud.armR.fore.rotation.x=-.75; ud.armL.sh.rotation.set(-.85,0,-.12); ud.armL.fore.rotation.x=-.85; OFF=null; setHud(); }
  function camTo(vw,dest,ms){ if(islandAt(nurse.position)!==islandAt(dest)){ chase={vw}; camTween=null; controls.enabled=true; } else { chase=null; tweenCam(vw.pos,vw.tgt,ms); } }
  function goIsland(i,instant){ if(i!==3&&orLocked()){ lockMsg(); return; } fishEnd(); if(OFF){ if(instant){ jumpOffDuty(); } else { offEnd(()=>goIsland(i)); return; } } if(bookEl) closeBook();
    if(focus){ focus=null; target=null; try{ history.replaceState(null,"",location.pathname+location.search); }catch(e){} }
    viewIsl=i; setHud(); const I=ISL[i];
    if(instant&&I.room){ snackStop(); const R=I.room, hv=homeView(); tweenCam(hv.pos,hv.tgt,900);
      if(!inSuite()){ // 瞬間移動到手術室門外,再從門口走進去(不穿牆)
        const out=R.doorOut.clone().sub(R.doorIn).setY(0).normalize(), p=R.doorOut.clone().addScaledVector(out,2.5); walk=null; inHut=false; chase=null; poof(nurse.position); nurse.position.set(p.x,groundY(p.x,p.z),p.z); poof(nurse.position); }
      faceCamera=false; route(pathTo(islandFront(I)),()=>{ mode="idle"; nurse.quaternion.setFromAxisAngle(up0,R.stationYaw); }); return; }
    if(instant){ const p=islandFront(I); walk=null; inHut=false; chase=null; poof(nurse.position); nurse.position.set(p.x,groundY(p.x,p.z),p.z); mode="idle"; faceCamera=true; poof(nurse.position); if(I.room){ faceCamera=false; nurse.quaternion.setFromAxisAngle(up0,I.room.stationYaw); }
      const hv=homeView(); tweenCam(hv.pos,hv.tgt,900); if(i===0 && ENV.raining()) goHut(); return; }
    const dest=(i===0 && ENV.raining())?HUT.door:islandFront(I); const hv=homeView(); camTo(hv,dest,1500);
    if(i===0 && ENV.raining()) goHut(); else { faceCamera=false; route(pathTo(dest),()=>{ mode="idle"; if(I.room) nurse.quaternion.setFromAxisAngle(up0,I.room.stationYaw); else faceCamera=true; }); } }
  $("useExit").onclick=()=>{ if(holdIV||onStool) releaseIV(); else if(SAND) sandEnd(); else if(LOUNGE) loungeEnd(); else if(FISH) fishEnd(); };
  $("reset").onclick=()=>{ const vw=focus?distView(focus):homeView(); tweenCam(vw.pos,vw.tgt,700); };

  /* ---------- resize + loop ---------- */
  function resize(){ const w=stage.clientWidth,h=stage.clientHeight; if(!w||!h) return; renderer.setSize(w,h,false); camera.aspect=w/h;
    camera.fov = w/h<1 ? 58 : 46; camera.updateProjectionMatrix(); if(!focus && !camTween && !walk && !moved0){ const hv=homeView(); camera.position.copy(hv.pos); controls.target.copy(hv.tgt); } }
  let orFK=""; let moved0=false; renderer.domElement.addEventListener("pointerdown",()=>moved0=true,{once:true});
  new ResizeObserver(resize).observe(stage); resize();
  nurse.position.set(HUT.front.x,TOP,HUT.front.z);
  if(ENV.raining() && !location.hash) goHut(true);
  const clock=new THREE.Clock(); const ease=k=>k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
  const tmpQ=new THREE.Quaternion(), up=new THREE.Vector3(0,1,0);
  renderer.setAnimationLoop(()=>{
    const rawDt=clock.getDelta(), dt=Math.min(rawDt,.05), rdt=Math.min(rawDt,.3), now=performance.now(), tt=now/1000;
    { // 情境題面板開著時,把手術室畫面往上移到面板上方,兩者同時看得到
      const P=document.getElementById("orPanel"), run=document.body.classList.contains("or-run")&&viewIsl===3&&P&&!P.hidden;
      const ph=run&&!P.classList.contains("min")?P.getBoundingClientRect().height+12:0, key=Math.round(ph/10)+"|"+run;
      if(key!==orFK){ orFK=key; const w=stage.clientWidth,h=stage.clientHeight; if(ph>0&&w&&h) camera.setViewOffset(w,h,0,Math.min(ph,h*.6)*.5,w,h); else camera.clearViewOffset(); camera.updateProjectionMatrix();
        if(viewIsl===3&&!focus&&!OFF){ const hv=homeView(); tweenCam(hv.pos,hv.tgt,600); } } }
    // walking
    const ud=nurse.userData;
    if(ringT<1.2){ ringT+=dt; const q=Math.min(1,ringT/1.2); ring.scale.setScalar(.6+q*1.2); ring.material.opacity=.85*(1-q); }
    if(walk){ const W=walk, rem=W.total-W.s; W.v=Math.min(W.v+WALK_A*rdt, W.vmax||WALK_V, Math.sqrt(2*WALK_A*Math.max(rem,0))+.8); W.s=Math.min(W.total,W.s+W.v*rdt);
      const cp=walkPoint(W,W.s); W.i=cp.i; const x=cp.x, z=cp.z; const la=walkPoint(W,W.s+1.4); const dx=la.x-x, dz=la.z-z; const k=W.s>=W.total-1e-4?1:0;
      if(Math.hypot(dx,dz)>.05){ tmpQ.setFromAxisAngle(up,Math.atan2(dx,dz)); nurse.quaternion.slerp(tmpQ,Math.min(1,dt*9)); }
      W.ph+=W.v*rdt*1.55; const amp=Math.min(1,W.v/3.5);
      nurse.position.set(x, nurse.position.y+(groundY(x,z)-nurse.position.y)*Math.min(1,dt*12), z);
      ud.cr=0; ud.head.rotation.x=0; ud.legs.forEach(l=>l.rotation.z=0);
      if(holdIV){ const kick=Math.max(0,Math.sin(tt*5)); ud.legs[0].rotation.x=0; ud.legs[1].rotation.x=kick*.9; ud.body.position.y=.05+kick*.05; ud.body.rotation.x=.14; }
      else { ud.body.rotation.x=0; const ph=W.ph; ud.legs[0].rotation.x=Math.sin(ph)*.7*amp; ud.legs[1].rotation.x=-Math.sin(ph)*.7*amp; ud.body.position.y=Math.abs(Math.sin(ph))*.12*amp;
      ud.armR.sh.rotation.x=-.95+Math.sin(ph)*.12*amp; ud.armL.sh.rotation.x=-.85-Math.sin(ph)*.12*amp; }
      // 推床:推床走在小麻前面,雙手往前扶著床尾
      if(W.push){ const g2=walkPoint(W,W.s+W.push), g1=walkPoint(W,W.s+W.push-1.2); const ry=Math.atan2(g2.x-g1.x,g2.z-g1.z); OR.gurSet(g2.x,g2.z,ry); ud.armR.sh.rotation.x=-1.25; ud.armL.sh.rotation.x=-1.25; ud.armR.fore.rotation.x=-.2; ud.armL.fore.rotation.x=-.2; }
      if(k>=1){ const cb=W.onArrive; walk=null; cb&&cb(); if(!walk){ ud.legs.forEach(l=>l.rotation.x=0); ud.body.position.y=0; } }
    } else {
      { const cr=inHut&&mode==="hut"; const kq=Math.min(1,dt*4); ud.cr=(ud.cr||0)+((cr?1:0)-(ud.cr||0))*kq; const c=ud.cr;   // 下雨:蹲在鍵盤架底下
        ud.body.position.y=-.55*c+Math.sin(tt*2.2)*.04*(1-c); ud.legs.forEach((l,i)=>{ l.rotation.x=-.95*c; l.rotation.z=(i?-1:1)*.28*c; });
        ud.body.rotation.x=.12*c; ud.head.rotation.x=-.1*c; }
      ud.head.rotation.z=Math.sin(tt*1.3)*.06;
      if(faceCamera && !(OFF&&OFF.v&&OFF.phase!=="call")){ const dx=camera.position.x-nurse.position.x, dz=camera.position.z-nurse.position.z; tmpQ.setFromAxisAngle(up,Math.atan2(dx,dz)); nurse.quaternion.slerp(tmpQ,Math.min(1,dt*5)); }
    }
    if(walk) faceCamera=false;
    if(onStool){ const moving=!!walk; const ph=tt*9;
      ud.body.position.y=-.02; ud.body.rotation.x=moving?.08:0;
      ud.legs[0].rotation.set(-1.25+(moving?Math.sin(ph)*.35:0),0,.12); ud.legs[1].rotation.set(-1.25-(moving?Math.sin(ph)*.35:0),0,-.12);
      if(!holdIV){ ud.armR.sh.rotation.set(-.6,0,.25); ud.armR.fore.rotation.x=-.9; ud.armL.sh.rotation.set(-.55,0,-.25); ud.armL.fore.rotation.x=-.9; }
      if(moving){ STOOL.wheels.forEach(w=>w.rotation.x+=rdt*14); STOOL.g.rotation.y=Math.sin(tt*2)*.12; } else STOOL.g.rotation.y*=.9;
      if(!walk && !focus && !inHut && mode==="idle"){ wanderT-=dt; if(wanderT<=0){ wanderT=1.2+Math.random()*2.2; let p=null; const WI=islandAt(nurse.position); for(let i=0;i<30&&!p;i++){ const a=Math.random()*Math.PI*2, r0=WI.ring?WI.ring+.5:PR+1.5, r=r0+Math.random()*(WI.R-2.5-r0); const x=WI.c.x+Math.cos(a)*r, z=WI.c.z+Math.sin(a)*r; if(Object.values(D3).every(d=>Math.hypot(d.c.x-x,d.c.z-z)>PR+.6)) p=new THREE.Vector3(x,0,z); }
        if(p){ faceCamera=false; route(pathTo(p),()=>{ mode="idle"; faceCamera=true; }); } } } }
    // IV stand rolls along at her side; she wanders around the island with it
    if(holdIV){ const side=new THREE.Vector3(.78,0,.62).applyAxisAngle(up0,danceT>0?nurse.userData.body.rotation.y:0).applyQuaternion(nurse.quaternion).multiplyScalar(nurse.scale.x);
      const tx=nurse.position.x+side.x, tz=nurse.position.z+side.z; const mv=Math.hypot(tx-IV.g.position.x,tz-IV.g.position.z);
      IV.g.position.set(tx,groundY(tx,tz),tz); IV.wheels.forEach(w=>w.rotation.x+=mv/.11); IV.g.rotation.y=nurse.rotation.y+Math.sin(tt*1.7)*.05; IV.g.rotation.z=walk?-.05:0;
      ud.armL.sh.rotation.set(-.95,0,-.32); ud.armL.fore.rotation.x=-.45; ud.armR.sh.rotation.set(-.7,0,-.45); ud.armR.fore.rotation.x=-.6;
      if(!walk && !focus && !inHut && mode==="idle"){ wanderT-=dt; if(wanderT<=0){ wanderT=1.5+Math.random()*2.5; let p=null; const WI=islandAt(nurse.position); for(let i=0;i<30&&!p;i++){ const a=Math.random()*Math.PI*2, r0=WI.ring?WI.ring+.5:PR+1.5, r=r0+Math.random()*(WI.R-2.5-r0); const x=WI.c.x+Math.cos(a)*r, z=WI.c.z+Math.sin(a)*r; if(Object.values(D3).every(d=>Math.hypot(d.c.x-x,d.c.z-z)>PR+.6)) p=new THREE.Vector3(x,0,z); }
        if(p){ const a=nurse.position, ab=new THREE.Vector3(p.x-a.x,0,p.z-a.z); const k=Math.max(0,Math.min(1,-(a.x*ab.x+a.z*ab.z)/(ab.lengthSq()||1))); const pts=pathTo(p); faceCamera=false; route(pts,()=>{ mode="idle"; faceCamera=true; }); } } } }
    { const t=holdIV?"🩺 放下點滴架":onStool?"🪑 離開椅子":LOUNGE?"🏖️ 起身":SAND?"🏖️ 不玩沙了":FISH&&FISH.phase!=="walk"?"🎣 收竿":""; const b=$("useExit"); if(b.dataset.t!==t){ b.dataset.t=t; b.textContent=t; b.hidden=!t; } }
    offTick(rdt,tt); fishTick(rdt,tt); loungeTick(rdt,tt); orbTick(rdt,tt); busyTick(rdt,tt); sandTick(rdt,tt); BEACH.update(dt,tt); faceAuto(); ud.faceTick(rdt);
    if(danceT>0){ danceT-=rdt; if(walk||OFF) danceT=0;
      if(danceT>0){ const ph=tt*7, k=1-danceT/5.5; ud.body.position.y=Math.abs(Math.sin(ph))*.32; ud.body.rotation.z=Math.sin(ph*.5)*.2; ud.body.rotation.y=k*Math.PI*4;
        if(holdIV){ ud.armL.sh.rotation.set(-.95,0,-.32); ud.armL.fore.rotation.x=-.45; ud.armR.sh.rotation.set(-2.7+Math.sin(ph)*.45,0,-.55); ud.armR.fore.rotation.x=-.3;   // 左手抓著點滴架一起轉,右手揮舞
          noteT-=rdt; if(noteT<=0){ noteT=.45; const n=new THREE.Sprite(new THREE.SpriteMaterial({map:tex(64,64,(c,w,h)=>{ c.fillStyle=["#E46F8E","#4FA3E0","#F2B544","#45A86E"][Math.floor(Math.random()*4)]; c.font="bold 52px serif"; c.textAlign="center"; c.textBaseline="middle"; c.fillText(Math.random()<.5?"♪":"♫",w/2,h/2); }),transparent:true,depthWrite:false}));
            n.scale.set(.9,.9,1); n.position.copy(nurse.position).add(new THREE.Vector3((Math.random()-.5)*1.2,4.2*nurse.scale.x,(Math.random()-.5)*1.2)); n.userData.t=0; scene.add(n); NOTES.push(n); } }
        else { ud.armR.sh.rotation.set(-2.7+Math.sin(ph)*.45,0,-.55); ud.armL.sh.rotation.set(-2.7-Math.sin(ph)*.45,0,.55); ud.armR.fore.rotation.x=-.3; ud.armL.fore.rotation.x=-.3; }
        ud.legs[0].rotation.x=-Math.max(0,Math.sin(ph))*.7; ud.legs[1].rotation.x=-Math.max(0,-Math.sin(ph))*.7; }
      else { ud.body.position.y=0; ud.body.rotation.set(0,0,0); ud.legs.forEach(l=>l.rotation.x=0); if(!holdIV&&!OFF){ ud.armR.sh.rotation.set(-.95,0,.12); ud.armR.fore.rotation.x=-.75; ud.armL.sh.rotation.set(-.85,0,-.12); ud.armL.fore.rotation.x=-.85; } } }
    for(let i=NOTES.length-1;i>=0;i--){ const n=NOTES[i]; n.userData.t+=rdt; n.position.y+=rdt*1.4; n.position.x+=Math.sin(n.userData.t*4)*rdt*.6; n.material.opacity=Math.max(0,1-n.userData.t/2.2); if(n.userData.t>2.2){ scene.remove(n); NOTES.splice(i,1); } }
    OR.tick(rdt,tt); netTick(rdt); { const su=inSuite(); if(leavingOR&&!su) leavingOR=false; if(document.body.classList.contains("in-suite")!==su) document.body.classList.toggle("in-suite",su); } idleTick(rdt,tt); BURIED.update(tt); DRIFT.update(tt); TURTLES.update(rdt,tt); boatTick(rdt,tt); carryTick(rdt,tt);
    { const want=BOAT?1.0:inHut&&!OFF?1.05:(ISL[3].room&&ISL[3].room.near(nurse.position.x,nurse.position.z)&&!OFF)?.95:NS; const s=nurse.scale.x+(want-nurse.scale.x)*Math.min(1,dt*2.2); nurse.scale.setScalar(s); }
    { const u=ud.umb; const open=ENV.raining()&&!inHut&&!OFF&&!LOUNGE; const cs=u.scale.x+((open?1:0)-u.scale.x)*Math.min(1,dt*5); u.scale.set(cs,cs,cs); u.visible=cs>.02; }
    LIFE.update(dt,tt); SOUND.update(dt);
    if(focus){ const A=camera.position, B=nurse.position, C=D3[focus].c; trees.forEach(t=>{ if(!t.userData.keep) t.userData.keep=t.visible; if(!t.userData.keep) return; const P=t.position;
        const seg=(Q)=>{ const abx=Q.x-A.x, abz=Q.z-A.z, L2=abx*abx+abz*abz||1; const k=Math.max(0,Math.min(1,((P.x-A.x)*abx+(P.z-A.z)*abz)/L2)); return Math.hypot(A.x+abx*k-P.x,A.z+abz*k-P.z); };
        t.visible=seg(B)>2.6&&seg(C)>3.2; }); }
    else trees.forEach(t=>{ if(t.userData.keep!==undefined) t.visible=t.userData.keep; });
    // camera tween
    if(chase){ if(walk){ const want=nurse.position.clone().add(new THREE.Vector3(0,2.2,0)); const off=camera.position.clone().sub(controls.target); const L=off.length(); if(L>30) off.multiplyScalar(30/L); if(L<16) off.multiplyScalar(16/Math.max(L,.01)); if(off.y<9) off.y=9;
        controls.target.lerp(want,Math.min(1,rdt*3)); camera.position.copy(controls.target).add(off); }
      else { const v=chase.vw; chase=null; tweenCam(v.pos,v.tgt,1500); } }
    if(camTween){ const k=Math.min(1,(now-camTween.s)/camTween.d), e=ease(k); camera.position.lerpVectors(camTween.p0,camTween.p1,e); controls.target.lerpVectors(camTween.t0,camTween.t1,e); if(k>=1){ camTween=null; controls.enabled=true; } }
    if(FOLLOW&&NET.role==="guest"&&NET.follow){ camTween=null; chase=null; controls.enabled=false; const k=Math.min(1,rdt*5); camera.position.lerp(_fp.set(FOLLOW[0],FOLLOW[1],FOLLOW[2]),k); controls.target.lerp(_ft.set(FOLLOW[3],FOLLOW[4],FOLLOW[5]),k); }
    if(DECO.list.length) decoTick(dt,tt);
    { const t=controls.target; const ox=t.x-ARCH_C.x, oz=t.z-ARCH_C.z, r=Math.hypot(ox,oz), R=125; if(r>R){ const k=R/r, dx=ox*(k-1), dz=oz*(k-1); t.x+=dx; t.z+=dz; camera.position.x+=dx; camera.position.z+=dz; } if(t.y<-4){ camera.position.y+=-4-t.y; t.y=-4; } if(t.y>40){ camera.position.y-=t.y-40; t.y=40; } }
    controls.update(); closeUp = camera.position.distanceTo(controls.target) < 30;
    // stickers bob, shelves grow, books lift
    for(const d of Object.values(D3)){
      d.spr.position.y=TOP+PH+9.6+Math.sin(tt*1.6+d.a*3)*.18;
      const goal=0; d.spr.material.opacity+= (goal-d.spr.material.opacity)*Math.min(1,dt*6); d.spr.material.transparent=true; d.spr.visible=false;
      if(d.shelf){ const want=focus===d.sid?1:0; const sp=want>d.rise?.75:1.4; d.rise=Math.max(0,Math.min(1,d.rise+Math.sign(want-d.rise)*rdt*sp)); if(Math.abs(want-d.rise)<.002) d.rise=want;
        const e=d.rise<.5?2*d.rise*d.rise:1-Math.pow(-2*d.rise+2,2)/2; d.shelf.position.y=d.baseY-(1-e)*d.sinkBy; d.shelf.visible=d.rise>.002; d.deck.material.opacity=1-e*.85;
        d.shelf.rotation.z=d.rise>0&&d.rise<1?Math.sin(tt*30)*.004:0; }
      if(d.shelf&&d.shelf.visible){
        for(const [id,b] of Object.entries(d.books)){ const want=id===openId?1:(b.userData.hover?.35:0); b.userData.lift+=(want-b.userData.lift)*Math.min(1,dt*8); const L=b.userData.lift;
          b.position.set(b.userData.home.x,b.userData.home.y+L*.5,b.userData.home.z+L*1.6); b.rotation.x=-L*.12; } }
    }
    ENV.update(dt,tt);

    if(focus){ const d=D3[focus]; const a=camera.position, b=new THREE.Vector3(d.c.x,TOP+3,d.c.z), p=new THREE.Vector3(HUT.pos.x,TOP+4,HUT.pos.z); const ab=b.clone().sub(a); const k=Math.max(0,Math.min(1,p.clone().sub(a).dot(ab)/ab.lengthSq())); HUT.g.visible=a.clone().addScaledVector(ab,k).distanceTo(p)>7.5; } else HUT.g.visible=true;
    renderer.render(scene,camera); placeLabels();
  });

  /* ---------- 島嶼佈置:從佈置面板選東西,點島上的地面放下去(存在 localStorage 的 island-deco:[種類, x, z, 角度]) ----------
     放置模式中點已經放好的東西會轉 45°;收起模式點一下就收起來。朋友來你的島時看到的是你的佈置。 */
  const DECO={list:[],mode:null,shown:null,t:0};
  const decoBuild={
    pot:()=>{ const g=new THREE.Group(); const p=new THREE.Mesh(new THREE.CylinderGeometry(.55,.4,.7,16),M(0xC8724A)); p.position.y=.35; g.add(p); const rim=new THREE.Mesh(new THREE.TorusGeometry(.55,.07,6,20),M(0xB5643E)); rim.rotation.x=Math.PI/2; rim.position.y=.7; g.add(rim);
      [[0,0,0xFF7A8A],[.25,.15,0xFFD94A],[-.22,.18,0xB57EDC],[.05,-.25,0xFFFFFF]].forEach(([x,z,c],i)=>{ const st=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.7+i*.08,5),M(0x3E8E4E)); st.position.set(x,1.05+i*.04,z); g.add(st); const f=new THREE.Mesh(new THREE.SphereGeometry(.17,10,8),M(c)); f.position.set(x,1.42+i*.08,z); g.add(f); }); return g; },
    tree:()=>{ const g=new THREE.Group(); const t=new THREE.Mesh(new THREE.CylinderGeometry(.22,.3,2.2,8),M(0x8A5A3A)); t.position.y=1.1; g.add(t); [[0,3.0,0,1.5],[.7,2.6,.3,1.0],[-.6,2.7,-.3,1.1]].forEach(([x,y,z,r])=>{ const c=new THREE.Mesh(new THREE.IcosahedronGeometry(r,1),M(0x58A55C,{flatShading:true})); c.position.set(x,y,z); g.add(c); }); return g; },
    lamp:()=>{ const g=new THREE.Group(); const dk=M(0x2F3A40,{metalness:.4,roughness:.4}); const b=new THREE.Mesh(new THREE.CylinderGeometry(.3,.38,.25,12),dk); b.position.y=.12; g.add(b); const pl=new THREE.Mesh(new THREE.CylinderGeometry(.08,.1,4,8),dk); pl.position.y=2.1; g.add(pl);
      const gl=new THREE.Mesh(new THREE.SphereGeometry(.38,14,12),new THREE.MeshStandardMaterial({color:0xFFF2C2,emissive:0xFFD87A,emissiveIntensity:.9})); gl.position.y=4.35; g.add(gl); const top=new THREE.Mesh(new THREE.ConeGeometry(.45,.35,12),dk); top.position.y=4.8; g.add(top); return g; },
    bench:()=>{ const g=new THREE.Group(); const wd=M(0xB07A4A), ir=M(0x3B4248,{metalness:.4}); const seat=new THREE.Mesh(new RoundedBoxGeometry(3,.15,.8,2,.04),wd); seat.position.y=.9; g.add(seat); const back=new THREE.Mesh(new RoundedBoxGeometry(3,.6,.12,2,.04),wd); back.position.set(0,1.45,-.38); back.rotation.x=-.12; g.add(back);
      for(const x of [-1.3,1.3]) for(const z of [-.3,.3]){ const l=new THREE.Mesh(new THREE.BoxGeometry(.12,.9,.12),ir); l.position.set(x,.45,z); g.add(l); } return g; },
    umb:()=>{ const g=new THREE.Group(); const pl=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,3.6,8),M(0xF4F4F4)); pl.position.y=1.8; g.add(pl);
      const st=tex(512,64,(c,w,h)=>{ for(let i=0;i<8;i++){ c.fillStyle=i%2?"#FFFFFF":"#3FA9F5"; c.fillRect(i*w/8,0,w/8,h); } }); const cn=new THREE.Mesh(new THREE.ConeGeometry(2.2,.8,8,1,true),new THREE.MeshStandardMaterial({map:st,side:THREE.DoubleSide,roughness:.7})); cn.position.y=3.6; g.add(cn); return g; },
    flag:()=>{ const g=new THREE.Group(); const pl=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,5,8),M(0xD7DEE6,{metalness:.5})); pl.position.y=2.5; g.add(pl); const ball=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),M(0xF2C94C,{metalness:.5})); ball.position.y=5.05; g.add(ball);
      const ft=tex(128,80,(c,w,h)=>{ c.fillStyle="#F29BB8"; c.fillRect(0,0,w,h); c.fillStyle="#fff"; c.fillRect(w/2-9,16,18,48); c.fillRect(w/2-24,31,48,18); }); const fl=new THREE.Mesh(new THREE.PlaneGeometry(1.6,1,8,1),new THREE.MeshStandardMaterial({map:ft,side:THREE.DoubleSide,roughness:.8})); fl.position.set(.82,4.4,0); fl.userData.wave=true; g.add(fl); return g; },
    rock:()=>{ const g=new THREE.Group(); [[0,.5,0,.8],[.7,.3,.3,.45],[-.5,.25,.4,.35]].forEach(([x,y,z,r])=>{ const m=new THREE.Mesh(new THREE.DodecahedronGeometry(r,0),M(0x9AA0A6,{flatShading:true})); m.position.set(x,y,z); m.rotation.set(x,y*3,z); g.add(m); }); return g; },
    balloon:()=>{ const g=new THREE.Group(); const wt=new THREE.Mesh(new THREE.CylinderGeometry(.2,.25,.3,10),M(0x8A929C)); wt.position.y=.15; g.add(wt); const fl=new THREE.Group(); fl.userData.bob=true; g.add(fl);
      [[0,5,0,0xE8456B],[.6,4.6,.2,0x3FA9F5],[-.55,4.7,-.1,0xF2C94C]].forEach(([x,y,z,c])=>{ const b=new THREE.Mesh(new THREE.SphereGeometry(.55,14,12),M(c,{roughness:.25})); b.scale.y=1.18; b.position.set(x,y,z); fl.add(b);
        fl.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(0,.3,0),new THREE.Vector3(x,y-.6,z)),2,.012,4,false),M(0xF4F4F4))); }); return g; },
    mush:()=>{ const g=new THREE.Group(); const st=new THREE.Mesh(new THREE.CylinderGeometry(.28,.35,1,12),M(0xF6EEDD)); st.position.y=.5; g.add(st); const cp=new THREE.Mesh(new THREE.SphereGeometry(.85,18,10,0,Math.PI*2,0,Math.PI/2),M(0xE05B5B)); cp.position.y=.95; g.add(cp);
      for(let i=0;i<7;i++){ const a=i/7*Math.PI*2, d=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),M(0xFFFFFF)); d.position.set(Math.cos(a)*.55,1.4,Math.sin(a)*.55); g.add(d); } const d0=new THREE.Mesh(new THREE.SphereGeometry(.13,8,6),M(0xFFFFFF)); d0.position.y=1.82; g.add(d0); return g; },
    xmas:()=>{ const g=new THREE.Group(); const t=new THREE.Mesh(new THREE.CylinderGeometry(.2,.25,.6,8),M(0x8A5A3A)); t.position.y=.3; g.add(t); [[1.5,1.6,1.2],[1.15,1.4,2.2],[.8,1.2,3.1]].forEach(([r,h,y])=>{ const c=new THREE.Mesh(new THREE.ConeGeometry(r,h,10),M(0x2E8B57)); c.position.y=y; g.add(c); });
      const star=new THREE.Mesh(new THREE.OctahedronGeometry(.28),new THREE.MeshStandardMaterial({color:0xFFD94A,emissive:0xF2B705,emissiveIntensity:.7})); star.position.y=3.95; g.add(star);
      [[.9,1.4,.6,0xE05B5B],[-.7,2.2,.6,0x3FA9F5],[.4,2.9,.5,0xF2C94C],[-.9,1.3,-.5,0xF2C94C],[.6,2.1,-.6,0xE05B5B]].forEach(([x,y,z,c])=>{ const o=new THREE.Mesh(new THREE.SphereGeometry(.13,8,6),new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:.35})); o.position.set(x,y,z); g.add(o); }); return g; },
    cactus:()=>{ const g=new THREE.Group(); const cm=M(0x4F9A5A); const p=new THREE.Mesh(new THREE.CylinderGeometry(.5,.4,.6,12),M(0xE6D3A3)); p.position.y=.3; g.add(p); const b=new THREE.Mesh(new THREE.CapsuleGeometry(.32,1.4,6,10),cm); b.position.y=1.5; g.add(b);
      [[-1,1.5],[1,1.9]].forEach(([sx,y])=>{ const a=new THREE.Mesh(new THREE.CapsuleGeometry(.17,.45,4,8),cm); a.position.set(sx*.48,y,0); g.add(a); const a2=new THREE.Mesh(new THREE.CapsuleGeometry(.15,.2,4,8),cm); a2.rotation.z=Math.PI/2; a2.position.set(sx*.32,y-.3,0); g.add(a2); }); const fl=new THREE.Mesh(new THREE.SphereGeometry(.14,8,6),M(0xFF7A8A)); fl.position.y=2.55; g.add(fl); return g; },
    sign:()=>{ const g=new THREE.Group(); const wd=M(0xA66F42); const pl=new THREE.Mesh(new THREE.BoxGeometry(.18,2.4,.18),wd); pl.position.y=1.2; g.add(pl);
      const nm=(PLAYER.name||"小麻")+" 的島"; const bt=tex(320,120,(c,w,h)=>{ c.fillStyle="#D9A96A"; c.fillRect(0,0,w,h); c.strokeStyle="#8A5A3A"; c.lineWidth=8; c.strokeRect(4,4,w-8,h-8); c.fillStyle="#5A3A22"; c.textAlign="center"; c.textBaseline="middle"; let fs=52; do{ c.font=`700 ${fs}px "Huninn","Noto Sans TC",sans-serif`; fs-=2; }while(c.measureText(nm).width>w-30&&fs>16); c.fillText(nm,w/2,h/2+2); });
      const bd=new THREE.Mesh(new RoundedBoxGeometry(2.4,.9,.12,2,.04),[wd,wd,wd,wd,new THREE.MeshStandardMaterial({map:bt,roughness:.8}),new THREE.MeshStandardMaterial({map:bt,roughness:.8})]); bd.position.y=2.2; g.add(bd); return g; },
    snowman:()=>{ const g=new THREE.Group(); const sw=M(0xFAFCFF,{roughness:.6}); [[0,.7,.75],[0,1.75,.55],[0,2.55,.4]].forEach(([x,y,r])=>{ const b=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),sw); b.position.set(x,y,0); g.add(b); });
      const nose=new THREE.Mesh(new THREE.ConeGeometry(.07,.35,8),M(0xF28C28)); nose.rotation.x=Math.PI/2; nose.position.set(0,2.55,.5); g.add(nose); for(const sx of [-.13,.13]){ const e=new THREE.Mesh(new THREE.SphereGeometry(.045,6,6),M(0x222222)); e.position.set(sx,2.68,.36); g.add(e); }
      const sc=new THREE.Mesh(new THREE.TorusGeometry(.42,.09,6,18),M(0xE05B5B)); sc.rotation.x=Math.PI/2; sc.position.y=2.2; g.add(sc); const hat=new THREE.Mesh(new THREE.CylinderGeometry(.28,.28,.45,14),M(0x2B2F38)); hat.position.y=3.0; g.add(hat); const br=new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,.05,16),M(0x2B2F38)); br.position.y=2.8; g.add(br); return g; },
    heart:()=>{ const g=new THREE.Group(); const sh=new THREE.Shape(); sh.moveTo(0,-1); sh.bezierCurveTo(-1.6,0,-1,1.2,0,.5); sh.bezierCurveTo(1,1.2,1.6,0,0,-1);
      const m=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.3,bevelEnabled:true,bevelSize:.08,bevelThickness:.08,bevelSegments:2}),new THREE.MeshStandardMaterial({color:0xF06C8F,emissive:0xE8456B,emissiveIntensity:.25,roughness:.4})); m.position.set(0,2.3,-.15); g.add(m);
      const pl=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,1.4,8),M(0xD7DEE6)); pl.position.y=.7; g.add(pl); return g; }};
  const DECO_R={pot:.8,tree:1.6,lamp:.6,bench:1.6,umb:.8,flag:.5,rock:1.1,balloon:.6,mush:.9,xmas:1.5,cactus:.7,sign:1.3,snowman:.8,heart:1.1};
  function decoOK(x,z){ const p=new THREE.Vector3(x,0,z), I=islandAt(p), r=Math.hypot(x-I.c.x,z-I.c.z); if(r>I.R-1.2) return false; if(I.ring&&r<I.ring+.6) return false; if(suiteP(p)||(I.room&&I.room.inside(p))) return false;
    for(const d of Object.values(D3)) if(Math.hypot(d.c.x-x,d.c.z-z)<PR+.5) return false; if(Math.hypot(HUT.pos.x-x,HUT.pos.z-z)<7) return false; if(ISL[3].room&&ISL[3].room.near&&ISL[3].room.near(x,z)) return false;
    if(OBS.some(o=>Math.hypot(o.c.x-x,o.c.z-z)<o.r+.6)||trees.some(t=>t.visible&&Math.hypot(t.position.x-x,t.position.z-z)<1.8)) return false; return BRIDGES.every(br=>segDist(x,z,br)>3); }
  function decoMake(k,x,z,r){ const f=decoBuild[k]; if(!f) return null; const g=f(); g.position.set(x,groundY(x,z),z); g.rotation.y=r; g.userData.deco=k; shadowy(g); scene.add(g); return g; }
  function decoRender(list){ DECO.list.forEach(d=>scene.remove(d.g)); DECO.list=[]; (list||[]).forEach(([k,x,z,r])=>{ const g=decoMake(k,x,z,r); if(g) DECO.list.push({k,x,z,r,g}); }); decoObsSync(); }
  function decoObsSync(){ DECO_OBS.length=0; DECO.list.forEach(d=>DECO_OBS.push({c:d.g.position,r:DECO_R[d.k]||1})); }
  function decoSave(){ decoObsSync(); try{ localStorage.setItem("island-deco",JSON.stringify(DECO.list.map(d=>[d.k,+d.x.toFixed(2),+d.z.toFixed(2),+d.r.toFixed(3)]))); }catch(e){} if(typeof netDecoSend==="function") netDecoSend(); }
  function decoMine(){ try{ return decoClean(JSON.parse(localStorage.getItem("island-deco")||"[]")); }catch(e){ return []; } }
  function decoClean(a){ return (Array.isArray(a)?a:[]).filter(d=>Array.isArray(d)&&decoBuild[d[0]]&&[d[1],d[2],d[3]].every(v=>Number.isFinite(+v))&&decoOK(+d[1],+d[2])).slice(0,DECO_MAX).map(d=>[d[0],+d[1],+d[2],+d[3]]); }
  function decoHit(e){ const r=renderer.domElement.getBoundingClientRect(); ptr.set(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1); ray.setFromCamera(ptr,camera);
    const h=ray.intersectObjects(DECO.list.map(d=>d.g),true)[0]; if(!h) return null; let o=h.object; while(o&&!o.userData.deco) o=o.parent; return DECO.list.find(d=>d.g===o)||null; }
  function decoClick(e){ if(DECO.shown){ toast("🏝️ 這是朋友的島,不能動他的佈置喔"); return; } const hit=decoHit(e);
    if(DECO.mode==="remove"){ if(!hit){ toast("🧹 點一下要收起來的東西"); return; } scene.remove(hit.g); DECO.list.splice(DECO.list.indexOf(hit),1); poof(hit.g.position.clone()); decoSave(); return; }
    if(hit){ hit.r+=Math.PI/4; hit.g.rotation.y=hit.r; decoSave(); return; }
    if(!ray.ray.intersectPlane(groundPlane,gHit)) return; const x=gHit.x, z=gHit.z;
    if(!decoOK(x,z)){ toast("🚧 這裡不能放:要放在島上的空地(不能放在書櫃、小木屋、麻醉機旁或手術室裡)"); return; }
    if(Math.hypot(nurse.position.x-x,nurse.position.z-z)<2.2){ toast("小麻站在這裡,換個地方放吧"); return; }
    if(DECO.list.length>=DECO_MAX){ toast(`島上最多放 ${DECO_MAX} 樣東西,先收起一些吧`); return; }
    for(const d of DECO.list) if(Math.hypot(d.x-x,d.z-z)<(DECO_R[d.k]+DECO_R[DECO.mode])*.7){ toast("太擠了,換個地方放吧"); return; }
    const r=Math.atan2(camera.position.x-x,camera.position.z-z); const g=decoMake(DECO.mode,x,z,r); if(!g) return; DECO.list.push({k:DECO.mode,x,z,r,g}); poof(g.position.clone()); decoSave(); }
  function decoTick(dt,tt){ for(const d of DECO.list){ d.g.children.forEach(c=>{ if(c.userData.bob){ c.position.y=Math.sin(tt*1.3+d.x)*.18; c.rotation.z=Math.sin(tt*.9+d.z)*.05; } if(c.userData.wave){ const pa=c.geometry.attributes.position; for(let i=0;i<pa.count;i++){ const x=pa.getX(i)+.8; pa.setZ(i,Math.sin(tt*4-x*3)*.12*x); } pa.needsUpdate=true; } }); } }
  decoRender(decoMine());
  /* ---------- 連線:朋友來我的島時,畫面跟著邀請者的視角(朋友可以切換成自由視角) ---------- */
  let FOLLOW=null; const _fp=new THREE.Vector3(), _ft=new THREE.Vector3();
  /* ---------- 連線:朋友的小麻(依對方傳來的位置、姿勢、服裝、表情畫出來,頭上有名字與正在做的事) ---------- */
  const REMOTE=new Map(), _rq=new THREE.Quaternion(), _rv=new THREE.Vector3();
  function remoteLab(R){ R.lab.querySelector("b").textContent=(R.prof.name||"朋友")+" · "+R.prof.role; R.lab.querySelector("span").textContent=R.sayT>0?"💬 "+R.say:(R.st&&R.st.a)||""; R.lab.classList.toggle("sna",R.prof.role==="SNA"); }
  function netAdd(id,prof){ let R=REMOTE.get(id);
    if(R){ R.prof=prof; const b=R.g.getObjectByName("badge"); if(b){ b.material.map=tex(256,150,(g,w,h)=>drawBadge(g,w,h,prof)); b.material.needsUpdate=true; } remoteLab(R); return; }
    const g=buildNurse(prof); g.scale.setScalar(NS); g.visible=false; shadowy(g); scene.add(g); g.userData.ETT.visible=false; g.userData.TW.visible=false;
    const lab=document.createElement("div"); lab.className="plab off"; lab.innerHTML="<b></b><span></span>"; $("labels").appendChild(lab);
    R={g,prof,lab,st:null,o:"scrub",f:"smile",lk:"",say:"",sayT:0}; REMOTE.set(id,R); remoteLab(R); }
  function netDel(id){ const R=REMOTE.get(id); if(!R) return; scene.remove(R.g); R.lab.remove(); REMOTE.delete(id); }
  function netUpd(id,d){ const R=REMOTE.get(id); if(!R) return; const A=(x,n)=>Array.isArray(x)&&x.length===n&&x.every(v=>Number.isFinite(+v))?x.map(Number):null;
    const st={p:A(d.p,3),q:A(d.q,4),s:Number.isFinite(+d.s)?Math.max(.5,Math.min(2,+d.s)):NS,b:A(d.b,4),l:A(d.l,4),ar:A(d.ar,4),al:A(d.al,4),h:Number.isFinite(+d.h)?+d.h:0,
      o:typeof d.o==="string"?d.o.slice(0,10):"scrub",f:typeof d.f==="string"?d.f.slice(0,12):"smile",a:typeof d.a==="string"?d.a.slice(0,20):""};
    if(!st.p||!st.q) return; const first=!R.st; R.st=st;
    if(first){ R.g.position.set(...st.p); R.g.quaternion.set(...st.q).normalize(); R.g.visible=true; R.lab.classList.remove("off"); }
    if(st.o!==R.o){ R.o=st.o; R.g.userData.setOutfit(st.o); R.g.userData.ETT.visible=false; R.g.userData.TW.visible=false; }
    if(st.f!==R.f){ R.f=st.f; R.g.userData.setFace(st.f); }
    if(d.lk&&typeof d.lk==="object"){ const L=lookClean(d.lk), key=JSON.stringify(L); if(key!==R.lk){ R.lk=key; R.g.userData.setLook(L); R.g.userData.setCap(!!d.gd); } }
    remoteLab(R); }
  function netSay(id,x){ const R=REMOTE.get(id); if(!R) return; R.say=x; R.sayT=4; remoteLab(R); }
  function netTick(dt){ if(!REMOTE.size) return; const k=Math.min(1,dt*10), L=(a,b)=>a+(b-a)*k, w=stage.clientWidth, h=stage.clientHeight;
    for(const R of REMOTE.values()){ const S=R.st; if(!S) continue; const g=R.g, u=g.userData;
      g.position.set(L(g.position.x,S.p[0]),L(g.position.y,S.p[1]),L(g.position.z,S.p[2])); g.quaternion.slerp(_rq.set(...S.q).normalize(),k); g.scale.setScalar(L(g.scale.x,S.s));
      if(S.b){ u.body.position.y=L(u.body.position.y,S.b[0]); u.body.rotation.set(L(u.body.rotation.x,S.b[1]),L(u.body.rotation.y,S.b[2]),L(u.body.rotation.z,S.b[3])); }
      if(S.l) u.legs.forEach((lg,i)=>{ lg.rotation.x=L(lg.rotation.x,S.l[i*2]); lg.rotation.z=L(lg.rotation.z,S.l[i*2+1]); });
      [[u.armR,S.ar],[u.armL,S.al]].forEach(([a,v])=>{ if(!v) return; a.sh.rotation.set(L(a.sh.rotation.x,v[0]),L(a.sh.rotation.y,v[1]),L(a.sh.rotation.z,v[2])); a.fore.rotation.x=L(a.fore.rotation.x,v[3]); });
      u.head.rotation.y=L(u.head.rotation.y,S.h); u.faceTick(dt);
      if(R.sayT>0){ R.sayT-=dt; if(R.sayT<=0) remoteLab(R); }
      _rv.copy(g.position); _rv.y+=4.9*g.scale.x/NS; _rv.project(camera);
      R.lab.style.transform=`translate(${(_rv.x*.5+.5)*w}px,${(-_rv.y*.5+.5)*h}px) translate(-50%,-100%)`; R.lab.classList.toggle("off",_rv.z>1||!g.visible); } }
  function netSelf(){ const ud=nurse.userData, b=ud.body, r=(v)=>Math.round(v*1000)/1000, q=nurse.quaternion, p=nurse.position, arm=(a)=>[a.sh.rotation.x,a.sh.rotation.y,a.sh.rotation.z,a.fore.rotation.x].map(r);
    const a=FISH?"🎣 釣魚中":OFF?({free:SNORKEL?"🤿 浮潛中":"🏊 游泳中",swim:"🐬 騎海豚",hawaii:"⛵ 開帆船",surf:"🏄 衝浪中"}[OFF.kind]||"🏖️ 下班中"):danceT>0?"💃 跳舞中":ISL[3].room.inside(p)?"🏥 模擬開刀房":bookEl?"📖 看書中":LOUNGE?"🏖️ 躺椅休息":"";
    return {p:[r(p.x),r(p.y),r(p.z)],q:[r(q.x),r(q.y),r(q.z),r(q.w)],s:r(nurse.scale.x),b:[r(b.position.y),r(b.rotation.x),r(b.rotation.y),r(b.rotation.z)],
      l:[ud.legs[0].rotation.x,ud.legs[0].rotation.z,ud.legs[1].rotation.x,ud.legs[1].rotation.z].map(r),ar:arm(ud.armR),al:arm(ud.armL),h:r(ud.head.rotation.y),o:ud.outfit,f:ud.face,a,i:islandAt(p).i,lk:ud.look,gd:gold,
      c:NET.role==="host"?[camera.position.x,camera.position.y,camera.position.z,controls.target.x,controls.target.y,controls.target.z].map(r):undefined}; }
  return {goDistrict,focus:()=>focus,pickBook,closeBook:()=>{ openId=null; },
    setLook:(L)=>{ nurse.userData.setLook(L); nurse.userData.setCap(gold); }, lookAtNurse:()=>{ const n=nurse.position, f=new THREE.Vector3(0,0,1).applyQuaternion(nurse.quaternion).setY(0).normalize(); if(f.lengthSq()<.1) f.set(0,0,1); const tgt=new THREE.Vector3(n.x,n.y+3.4,n.z); tweenCam(tgt.clone().addScaledVector(f,11).add(new THREE.Vector3(0,2.2,0)),tgt,900); faceCamera=true; },
    decoMode:(k)=>{ DECO.mode=k||null; renderer.domElement.style.cursor=k?"crosshair":""; }, decoList:()=>DECO.list.map(d=>[d.k,+d.x.toFixed(2),+d.z.toFixed(2),+d.r.toFixed(3)]), decoCount:()=>DECO.list.length,
    decoShow:(list)=>{ if(list){ DECO.shown=true; decoRender(decoClean(list)); } else if(DECO.shown){ DECO.shown=null; decoRender(decoMine()); } }, decoClear:()=>{ DECO.list.forEach(d=>scene.remove(d.g)); DECO.list=[]; decoSave(); },
    camFollow:(c)=>{ FOLLOW=c; if(!c) controls.enabled=true; },
    orSet:(v)=>OR.set(v), orGet:()=>OR.get(), orHelp:()=>{ OR.help(); netFx("orHelp"); }, orCPR:(on)=>{ OR.cpr(on); netFx("orCPR",!!on); }, orShock:()=>{ OR.shock(); netFx("orShock"); }, orReset:()=>{ OR.reset(); netFx("orReset"); }, orHandoffFx:()=>OR.handoff(()=>{}), netAdd, netDel, netUpd, netSay, netSelf,
    orHandoff:(cb)=>{ netFx("orHandoff"); let a=false,b=false; const fin=()=>{ if(a&&b) cb&&cb(); };
      // 小麻和巡迴護理師一起推床:小麻先走到推床床尾,再推著床出門、沿牆外繞到恢復室
      OR.handoff(()=>{ a=true; fin(); },true); faceCamera=false; const GP=OR.GPATH.map(([x,z])=>OR.toW(x,z)), PUSH=2.9;
      const d0=GP[1].clone().sub(GP[0]).setY(0).normalize(), start=GP[0].clone().addScaledVector(d0,-PUSH);
      route(pathTo(start),()=>{ walk=null; const pts=[start,...GP]; const raw=[nurse.position.clone().setY(0)]; pts.forEach(q=>raw.push(new THREE.Vector3(q.x,0,q.z)));
        const P=smoothPath(raw), cum=[0]; for(let i=1;i<P.length;i++) cum.push(cum[i-1]+Math.hypot(P[i].x-P[i-1].x,P[i].z-P[i-1].z));
        // 推床的路線要到推床停的位置為止,小麻停在床尾後面
        const total=cum[cum.length-1]-PUSH; walk={P,cum,total,s:0,v:0,i:0,ph:0,vmax:6.5,push:PUSH,onArrive:()=>{ OR.gurDone(); mode="idle"; faceCamera=true; b=true; fin(); }}; mode="walk"; });
      const tgt=OR.toW(-9,2); tgt.y=TOP; const pos=OR.toW(-6,24); pos.y=TOP+26; tweenCam(pos,tgt,1600); }, atOR:()=>viewIsl===3, inOR:()=>ISL[3].room.inside(nurse.position), inSuite:()=>inSuite(),
    leaveOR:()=>{ if(!inSuite()) return; leavingOR=true; if(typeof orClose==="function"&&!$("orPanel").hidden) orClose(); releaseIV(); const out=OR.toW(10+3.6,-5.6); faceCamera=false; route(pathTo(out),()=>{ mode="idle"; faceCamera=true; leavingOR=false; }); },
    _vent:()=>({ph:+OR.vent.ph.toFixed(2), sy:OR.vent.b?+OR.vent.b.scale.y.toFixed(2):null}),
    _orLook:(cx,cy,cz,tx,ty,tz)=>{ const a=OR.toW(cx,cz), b=OR.toW(tx,tz); camTween=null; controls.enabled=false; camera.position.set(a.x,TOP+cy,a.z); controls.target.set(b.x,TOP+ty,b.z); controls.update(); },
    _walkP:()=>walk&&walk.P?walk.P.map(q=>[+q.x.toFixed(2),+q.z.toFixed(2)]):null,
    _exits:()=>ISL.map(I=>{ const O=outer(I); return O?[+O.a.toFixed(2),+O.rW.toFixed(1),O.I.i]:null; }), _br:()=>BRIDGES.map(b=>[b.a.x,b.a.z,b.b.x,b.b.z]), _off:()=>OFF&&{phase:OFF.phase,kind:OFF.kind}, _isl:()=>ISL.map(I=>[I.c.x,I.c.z,I.R]), _goIsl:(i)=>{ const I=ISL[i]; nurse.position.set(I.c.x+(I.ring?I.ring+2:PR+3),TOP,I.c.z); },
    _pet:(i)=>petTurtle(TURTLES.list[i||0].g), _turtles:()=>TURTLES.list, _snk:()=>snorkelFind(), _gull:()=>LIFE.gullNow(), _gulls:()=>LIFE.gulls, _fallen:()=>FALLEN, _bonus:()=>window.__coins(),
    _dropLitter:()=>{ const lit=mkLitter(0xE46F8E,false); lit.position.set(nurse.position.x+2,TOP+.3,nurse.position.z+1); lit.userData={v:new THREE.Vector3(),t:0,act:"pick",item:"垃圾",fallen:true,rest:true,age:20}; scene.add(lit); FALLEN.push(lit); return lit; },
    offStart:(k)=>{ const was=SNORKEL; SNORKEL=k==="snorkel"; offStart(k==="snorkel"?"free":k); if(SNORKEL&&!was&&OFF) toast("🤿 戴上面鏡去浮潛!在海裡游一游,會撿到金幣、垃圾、漂流瓶題目或各種收藏品"); setHud(); }, offEnd:()=>offEnd(), fishStart:()=>fishStart(), fishEnd:()=>fishEnd(), _approach:(k)=>approach(k,k==="iv"?IV.g:k==="stool"?STOOL.g:LOUNGERS[0]), _obs:()=>OBS.map(o=>[+o.c.x.toFixed(1),+o.c.z.toFixed(1),+o.r.toFixed(2)]), _act:(k,i)=>actOn(k,k==="wish"?FOUNTAIN:k==="palm"?trees.filter(t=>t.visible)[i||0]:k==="pick"?LIFE.picks[i||0]:k==="castle"?BEACH.castles[i||0]:BEACH.rings[i||0]), _trees:()=>{ const c={}; trees.forEach(t=>{ const k=islandAt(t.position).i+(t.visible?"":"h"); c[k]=(c[k]||0)+1; }); return c; }, _busy:()=>[!!BUSY,!!SAND,!!RINGPOST,FALLEN.length,OFF&&OFF.ring], _useOrb:()=>useOrb(), _act2:(k)=>{ if(k==="boat") boatToggle(BEACH.boats[0]); if(k==="heart") liftHeart(BEACH.hearts[0]); }, _st:()=>({boat:!!BOAT,carry:!!CARRY,turtles:TURTLES.list.map(t=>t.mode+":"+t.g.position.x.toFixed(1)), tpos:TURTLES.list.map(t=>[t.g.position.x,t.g.position.y,t.g.position.z,t.mode]),heart:BEACH.hearts[0]&&BEACH.hearts[0].position.toArray().map(v=>+v.toFixed(1)),boatPos:BEACH.boats[0]&&BEACH.boats[0].position.toArray().map(v=>+v.toFixed(1)),nurse:nurse.position.toArray().map(v=>+v.toFixed(1))}), _walk:(x,z)=>walkHere(new THREE.Vector3(x,0,z)), _arm:(sx,sy,sz,fx)=>{ const ud=nurse.userData; ud.armR.sh.rotation.set(sx,sy,sz); ud.armR.fore.rotation.x=fx; nurse.updateMatrixWorld(true); const h=ud.armR.hand.getWorldPosition(new THREE.Vector3()), hd=ud.head.getWorldPosition(new THREE.Vector3()); const inv=nurse.matrixWorld.clone().invert(); h.applyMatrix4(inv); hd.applyMatrix4(inv); return {hand:h.toArray().map(v=>+v.toFixed(2)), head:hd.toArray().map(v=>+v.toFixed(2))}; }, _coins:()=>BURIED.list.filter(g=>g.visible).length, _litter:()=>FALLEN.filter(o=>o.userData.item==="垃圾").length, _collect:(it)=>{ const o=it==="金幣"?BURIED.list.find(g=>g.visible):FALLEN.find(x=>x.userData.item==="垃圾"&&x.userData.rest); if(o) collect(o); return !!o; }, _dance:()=>dance(), _ivPos:()=>IV.g.position.toArray().map(v=>+v.toFixed(2)), _notes:()=>NOTES.length, _pathTo:(x,z)=>pathTo(new THREE.Vector3(x,0,z)).map(p=>[+p.x.toFixed(1),+p.z.toFixed(1)]), _room:()=>{ const R=ISL[3].room; return {doorOut:[R.doorOut.x,R.doorOut.z], c:[ISL[3].c.x,ISL[3].c.z], shore:[outer(ISL[3]).shore.x,outer(ISL[3]).shore.z], inside:(x,z)=>R.inside({x,z})}; }, _board:(i)=>takeBoard(BEACH.boards[i||0]), _vball:()=>vballPlay(BEACH.vb.net), _boards:()=>BEACH.boards.map(g=>[g.userData.kind,+g.position.x.toFixed(1),+g.position.z.toFixed(1),g.userData.bd[0].visible]), _vb:()=>BEACH.vb.net&&BEACH.vb.net.userData.ball.position.toArray().map(x=>+x.toFixed(2)), _lounge:()=>!!LOUNGE, _orb:()=>ORB.g.visible, jumpTo:(s,b)=>jumpTo(s,b), _fish:()=>FISH&&FISH.phase, _off:()=>OFF&&{ph:OFF.phase,kind:OFF.kind}, setFace:(f)=>{ manualFace=f; autoNext=0; }, react:(k)=>react(k), _face:()=>curFace, _nb:()=>{ const b=new THREE.Box3().setFromObject(nurse); return [b.min.toArray(),b.max.toArray(),nurse.scale.x]; }, _dbg:()=>({off:OFF&&{ph:OFF.phase,a:+OFF.a.toFixed(2),r:OFF.r&&+OFF.r.toFixed(1)},v:OFF&&OFF.v&&OFF.v.position.toArray().map(x=>+x.toFixed(1)),tgt:controls.target.toArray().map(x=>+x.toFixed(1)),cam:camera.position.toArray().map(x=>+x.toFixed(1)),tw:!!camTween}), dance:()=>dance(), goIV:()=>goIV(), goStool:()=>goStool(), _stool:()=>onStool, _sb:()=>{ const b=new THREE.Box3().setFromObject(STOOL.g); return [STOOL.g.parent===nurse, STOOL.g.visible, b.min.toArray().map(v=>+v.toFixed(2)), b.max.toArray().map(v=>+v.toFixed(2)), nurse.position.toArray().map(v=>+v.toFixed(2))]; }, goIsland:(i,inst)=>goIsland(i,inst), setBadge:()=>{ const b=nurse.getObjectByName("badge"); if(b){ b.material.map=tex(256,150,drawBadge); b.material.needsUpdate=true; } },
    toggleGold:(v)=>{ gold=v===undefined?!gold:v; nurse.userData.setCap(gold); try{ localStorage.setItem("island-gold",gold?"1":"0"); }catch(e){} }, isOff:()=>!!OFF, _np:()=>[+nurse.position.x.toFixed(1),+nurse.position.z.toFixed(1)], _iv:()=>toggleIV(),    _pose:(...a)=>LIFE._pose(...a), _orca:(i)=>LIFE._orca(i),
    _look(x,y,z,tx,ty,tz){ camTween=null; controls.enabled=false; camera.position.set(x,y,z); controls.target.set(tx,ty,tz); controls.update(); },
    _peek(k=1.9,hy=1.75){ const n=nurse.position, f=new THREE.Vector3(0,0,1).applyQuaternion(nurse.quaternion); camTween=null; controls.enabled=false; camera.position.set(n.x+f.x*k,n.y+hy+.3,n.z+f.z*k); controls.target.set(n.x,n.y+hy,n.z); controls.update(); }};
}
})();
