#!/usr/bin/env node
/* 麻醉誘島:穿模(穿牆、穿過東西)自動檢查
   用法(在儲存庫根目錄):node tools/collision-check.js        完整檢查
                         node tools/collision-check.js --quick 只跑一小部分
   需要 Playwright(require('playwright') 可用)。three.js 預設從 CDN 載入;CDN 連不上時,
   設定 THREE_DIR=<three@0.160.0 套件資料夾>(例如 node_modules/three)改用本機檔案。

   檢查內容:每一格畫面呼叫 world._clipCheck(),看有沒有人卡進障礙物或牆裡
   - 小麻在各座島上隨機走動(繞開書櫃、樹、擺設、小攤販、玩家佈置)
   - 小麻進出模擬手術室(只能走門)、手術室裡走動、走去恢復室
   - 模擬一位連線朋友:故意送出直接穿過手術台、牆、書櫃的位置,畫面上的朋友不能穿過去
   - 手術室成員(巡迴護理師、呼救進來的主治醫師與 CRNA)不能卡在牆裡
   加 --baseline 會關掉每一格畫面的防穿模保護(只剩路線規劃),用來確認這個檢查真的抓得到穿模。
   有任何穿模就列出來並以 exit code 1 結束。改到任何會動的東西、障礙物、牆、擺設之後都要跑一次。 */
const http=require("http"), fs=require("fs"), path=require("path");
const { chromium }=require("playwright");
const ROOT=path.resolve(__dirname,".."), QUICK=process.argv.includes("--quick"), BASE=process.argv.includes("--baseline");   // --baseline:關掉防穿模保護,看看原本會穿模的地方
const TYPES={".html":"text/html",".js":"application/javascript",".css":"text/css",".svg":"image/svg+xml",".png":"image/png",".json":"application/json"};
const srv=http.createServer((q,r)=>{ let f=path.join(ROOT,decodeURIComponent(q.url.split("?")[0])); if(f.endsWith("/")) f+="index.html";
  if(!f.startsWith(ROOT)||!fs.existsSync(f)){ r.writeHead(404); r.end(); return; } r.writeHead(200,{"Content-Type":TYPES[path.extname(f)]||"application/octet-stream"}); fs.createReadStream(f).pipe(r); });
(async()=>{ await new Promise(ok=>srv.listen(0,ok)); const port=srv.address().port;
  const b=await chromium.launch({args:["--use-gl=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]});
  const pg=await (await b.newContext({viewport:{width:480,height:360}})).newPage();
  const errs=[]; pg.on("pageerror",e=>errs.push(e.message));
  if(process.env.THREE_DIR){ const T=path.resolve(process.env.THREE_DIR);
    await pg.route("https://cdn.jsdelivr.net/npm/three@0.160.0/**",r=>{ const rel=new URL(r.request().url()).pathname.replace("/npm/three@0.160.0/",""), f=path.join(T,rel); if(fs.existsSync(f)) r.fulfill({body:fs.readFileSync(f),contentType:"application/javascript"}); else r.abort(); }); }
  await pg.route(/unpkg\.com|fonts\.g/,r=>r.abort());
  await pg.addInitScript(()=>{ localStorage.setItem("island-name","檢查"); localStorage.setItem("island-role","SNA"); localStorage.removeItem("island-wx"); });
  if(BASE) await pg.addInitScript(()=>{ window.__noSolid=true; });
  await pg.goto(`http://localhost:${port}/index.html`); await pg.waitForFunction(()=>window.__world,null,{timeout:120000});
  await pg.evaluate(()=>{ const f=document.querySelector(".intro form"); if(f) f.requestSubmit(); });
  // 每一格畫面收集穿模
  await pg.evaluate(()=>{ window.__clips=[]; const seen=new Set(); const loop=()=>{ for(const v of window.__world._clipCheck()){ const k=v.who+v.what+Math.round(v.x)+","+Math.round(v.z); if(!seen.has(k)){ seen.add(k); window.__clips.push(v); } } requestAnimationFrame(loop); }; loop(); });
  const walking=()=>pg.evaluate(()=>!!window.__world._walkP());
  async function walkTo(x,z,lim=40000){ await pg.evaluate(([x,z])=>window.__world._walk(x,z),[x,z]); const t0=Date.now(); await pg.waitForTimeout(300); while(await walking()&&Date.now()-t0<lim) await pg.waitForTimeout(250); }
  const isl=await pg.evaluate(()=>window.__world._isl()), room=await pg.evaluate(()=>{ const R=window.__world._room(); return {doorOut:R.doorOut,c:R.c}; });
  let seed=7; const rnd=()=>{ seed=(seed*16807)%2147483647; return (seed-1)/2147483646; };
  // ① 各座島隨機走動
  const per=QUICK?2:5;
  for(let i=0;i<isl.length;i++){ const [cx,cz,R]=isl[i]; for(let k=0;k<per;k++){ const a=rnd()*Math.PI*2, r=4+rnd()*(R-7); await walkTo(cx+Math.cos(a)*r,cz+Math.sin(a)*r); } }
  // ② 模擬手術室:走進去、在裡面走動、走去恢復室、再出來
  const [rx,rz]=room.c; const inner=QUICK?[[0,5],[-6,3]]:[[0,5],[-6,3],[6,-5],[-7,-5],[5,6],[-2,-6]];
  await walkTo(room.doorOut[0],room.doorOut[1]);
  for(const [dx,dz] of inner) await walkTo(rx+dx,rz+dz);   // 世界座標附近的點;程式會拉回手術室裡可以站的地方
  await walkTo(room.doorOut[0]+6,room.doorOut[1]+2);
  // ③ 連線朋友:送出一條直接穿過手術室(牆、手術台)與書櫃的路線
  await pg.evaluate(()=>window.__world.netAdd("bot",{name:"朋友",role:"SNA"}));
  const line=[[rx+16,rz-12],[rx-16,rz+12],[0,0],[isl[1][0],isl[1][1]+12],[isl[1][0],isl[1][1]-12]];
  const q=[0,0,0,1]; let cur=line[0];
  for(let s=1;s<line.length;s++){ const [x0,z0]=cur, [x1,z1]=line[s], n=Math.ceil(Math.hypot(x1-x0,z1-z0)/.6);
    for(let k=1;k<=n;k++){ const x=x0+(x1-x0)*k/n, z=z0+(z1-z0)*k/n; await pg.evaluate(([x,z,q])=>window.__world.netUpd("bot",{p:[x,3,z],q,a:""}),[x,z,q]); await pg.waitForTimeout(60); } cur=line[s]; }
  await pg.waitForTimeout(800); await pg.evaluate(()=>window.__world.netDel("bot"));
  // ④ 呼救:主治醫師與 CRNA 從門口衝進手術室
  await pg.evaluate(()=>window.__world.orHelp()); await pg.waitForTimeout(QUICK?4000:9000);
  const clips=await pg.evaluate(()=>window.__clips); await b.close(); srv.close();
  if(errs.length) console.log("⚠️ 頁面錯誤:",errs.slice(0,5));
  if(!clips.length){ console.log("✅ 沒有穿模"); process.exit(errs.length?1:0); }
  console.log(`❌ 發現 ${clips.length} 處穿模:`); clips.slice(0,40).forEach(c=>console.log("  ",JSON.stringify(c))); process.exit(1); })().catch(e=>{ console.error(e); srv.close(); process.exit(2); });
