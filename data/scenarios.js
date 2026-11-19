// 模擬開刀房的 OSCE 情境題。小人一走進手術室就會自動開始一題。
// 每個情境是一張「狀況圖」:nodes 裡每個狀況有 4 個選項,每個選項各自通往不同的狀況(to)。
//   to:"cpr"  → 病人心跳停止,直接進入 ACLS 流程(流程在 js/island.js 的 aclsNodes 依 acls 設定產生)
//   to:"dead" → 病人死亡(不經過 CPR,例如數天後的併發症)
//   to:"win"  → 病人穩定、情境完成;其他 → 走到那個狀況,病人的生命徵象跟著改變
//   ok:true 是最佳處置;rescue:true 是「雖然晚了但救得回來」的補救處置
//   v 是該狀況的生命徵象:hr 心跳、sbp/dbp 血壓、spo2、etco2、rr、temp、
//     skin(normal/pale/cyan/flush)、alarm、shake、rhythm(sinus/vf/asystole/pea/st)
//   ck 是這個選項拿到的 OSCE 評分項目(對應 checklist 的編號,從 0 開始)
//   ecg:{t, lead, mm?, pvc?, hr?} 這個狀況要考心電圖判讀時,情境面板會畫出心電圖(種類見 js/island.js 的 ecgSVG 說明;心跳停止會自動畫)
//   acls:{rhythm:"vf"|"pea", fix:"處理這題可逆原因的做法", epi?, aa?, peds?}
//   use:[{n:"收集冊物品名稱", t, to, ok/rescue, ck, fb}] 放在狀況裡:小麻收集冊(island-bag)裡有這個東西時,
//     拿出來用就會帶到 to 那個狀況(用掉就少一個);沒有的話只能從四個選項裡選。n 要和 island.js 的 COLLECT 名稱一樣。
//   bonus:[{n:"收集冊物品名稱", t:"怎麼用", fb:"為什麼有幫助", dv:{sbp:+10,temp:-0.5}, at?:["s1"]}] 放在情境本身:
//     這題「還想得到、用得到」的額外物品。小麻在情境中打開收集冊拿出來用,就是額外 bonus(+1 金幣),
//     病人的生命徵象依 dv 變好(帶到之後的狀況,心跳停止時不算),但不改變流程,照樣把情境走完。
//     每樣一題只算一次;at 可以限定只在某些狀況用(不寫就是整題都能用)。結束畫面會列出用了哪些、還可以用哪些。
//     不會事先告訴玩家這題能用什麼(避免洩漏診斷);拿出用不上的東西不會被用掉。
// 題名與選項都不直接寫出診斷,要從生命徵象與病程自己判斷;診斷在通關後才顯示(tag)。
window.ISLAND_SCENARIOS = [
{ id:"mh", title:"腹腔鏡闌尾切除:EtCO₂ 往上爬", tag:"惡性高熱",
  patient:"24 歲男性,ASA I,腹腔鏡闌尾切除。以 propofol、succinylcholine 誘導插管,sevoflurane 維持,CO₂ 氣腹 12 mmHg。",
  checklist:["鑑別 EtCO₂ 上升的原因(氣腹吸收、吸收劑、通氣不足、高代謝)","及早說出可能是惡性高熱並呼救","立刻停用揮發性麻醉劑與 succinylcholine","100% O₂ 高流量、過度換氣","Dantrolene 2.5 mg/kg 靜脈給予,可重複","處理高血鉀、主動降溫、維持尿量","術後送加護病房觀察至少 24 小時"],
  acls:{rhythm:"vf", fix:"Dantrolene 2.5 mg/kg、處理高血鉀(calcium chloride、insulin 加葡萄糖)、主動降溫"},
  bonus:[
    {n:"Dantrolene",t:"多拿一份 dantrolene 備用",fb:"每瓶都要用無菌水搖很久才溶得開,一個病人常要好幾瓶;多準備一份,追加劑量時不會斷掉。",dv:{temp:-0.3,etco2:-4,hr:-6}},
    {n:"溫毯被",t:"溫毯被改吹冷風,主動降溫",fb:"體溫一直往上升時主動降溫;降到 38°C 左右就停,避免過冷。",dv:{temp:-0.5}},
    {n:"A-line",t:"放動脈導管",fb:"可以反覆抽動脈血追 pH、PaCO₂、K⁺ 與 CK,連續看血壓。"},
    {n:"Foley",t:"放尿管看尿量與尿色",fb:"橫紋肌溶解會出現可樂色尿;維持尿量 >2 mL/kg/h 保護腎臟。"},
    {n:"CRNA 學姊",t:"請學姊來幫忙溶藥",fb:"多一雙手專門溶解 dantrolene,其他人能繼續處理病人。",dv:{hr:-4}}],
  start:"s0",
  nodes:{
    s0:{ story:"氣腹建立後 20 分鐘。EtCO₂ 從 36 慢慢升到 52 mmHg,心跳 112 次/分,血壓 138/82。呼吸器設定沒有變。",
      v:{hr:112,sbp:138,dbp:82,spo2:98,etco2:52,rr:12,temp:37.4,skin:"normal",alarm:true},
      q:"此時最適當的處置是?",
      options:[
        {t:"提高每分鐘通氣量,同時檢查:吸入 CO₂ 是否大於 0、體溫趨勢、肌肉張力、心律;抽動脈血液氣體,請外科暫時把氣腹壓力降低",ok:true,to:"s1",ck:[0],fb:"正確。EtCO₂ 上升有很多原因:氣腹 CO₂ 吸收、吸收劑耗盡、通氣不足、皮下氣腫、高代謝。先處理、同時系統性找原因。"},
        {t:"氣腹本來就會讓 EtCO₂ 上升,維持原設定觀察 15 分鐘",to:"d0",fb:"氣腹吸收的 CO₂ 通常在建立後 15–30 分鐘趨於穩定,而且提高通氣就能壓下來。不處理也不找原因,錯過了早期的線索。"},
        {t:"加深 sevoflurane,心跳快可能是麻醉太淺",to:"d1c",fb:"在原因未明前加深揮發性麻醉劑,如果這是惡性高熱,等於加重誘發。"},
        {t:"給 esmolol 把心跳壓下來",to:"d1d",fb:"心跳快是身體對 CO₂ 與代謝增加的反應。只處理數字沒有處理原因。"}
      ]},
    s1:{ story:"通氣量加倍後 EtCO₂ 還是升到 68 mmHg。吸入 CO₂ 為 0,體溫 38.4°C 且每 5 分鐘升 0.3°C,下顎很緊,外科說腹壁很硬。動脈血:pH 7.18、PaCO₂ 74、K⁺ 5.9。",
      v:{hr:134,sbp:146,dbp:88,spo2:96,etco2:68,rr:24,temp:38.4,skin:"flush",alarm:true},
      q:"下一步最適當的處置是?",
      options:[
        {t:"立刻停 sevoflurane、改 100% O₂ 高流量(10 L/min 以上)過度換氣,改全靜脈麻醉;大聲呼救、通知外科盡快結束,請人拿 dantrolene",ok:true,to:"s2",ck:[1,2,3],fb:"正確。CO₂ 產生量異常增加、體溫快速上升、肌肉僵硬、混合性酸中毒與高血鉀,符合惡性高熱。先停誘發藥物並呼救。"},
        {t:"這是氣腹吸收,把氣腹放掉、改開腹手術就好",to:"d1a",fb:"吸入 CO₂ 為 0、通氣加倍仍壓不住,加上體溫上升與肌肉僵硬,已經不是氣腹能解釋的。"},
        {t:"給 sodium bicarbonate 矯正酸中毒,繼續原本的麻醉",to:"d1d",fb:"酸中毒是結果不是原因。誘發藥物還在,高代謝會繼續。"},
        {t:"體溫高可能是敗血症,先給抗生素並冰敷",to:"d1a",fb:"敗血症不會在幾十分鐘內讓 EtCO₂ 壓不住、肌肉僵硬並高血鉀。"}
      ]},
    d0:{ story:"15 分鐘後:EtCO₂ 74 mmHg,體溫 38.9°C,監視器出現頻發的心室早期收縮,外科說肚子很硬。",
      v:{hr:142,sbp:150,dbp:90,spo2:95,etco2:74,rr:12,temp:38.9,skin:"flush",alarm:true},
      ecg:{t:"pvc",lead:"II"},
      q:"現在該怎麼做?",
      options:[
        {t:"停 sevoflurane、100% O₂ 過度換氣、呼救;dantrolene 2.5 mg/kg 靜脈給予",rescue:true,to:"s2",ck:[1,2,3],fb:"晚了,但方向對了:停掉誘發藥物、純氧過度換氣、盡快給 dantrolene。"},
        {t:"給 verapamil 治療心律不整",to:"cpr",fb:"心律不整來自高血鉀與酸中毒。鈣離子通道阻斷劑在這裡會加重高血鉀與心肌抑制,病人心室顫動。"},
        {t:"冰敷降溫,請外科加快速度",to:"cpr",fb:"誘發藥物還在給,高代謝持續,高血鉀造成心室顫動。"},
        {t:"追加 succinylcholine 讓肚子放鬆",to:"cpr",fb:"Succinylcholine 本身是誘發藥物,又讓血鉀再上升,病人心室顫動。"}
      ]},
    d1a:{ story:"5 分鐘後:EtCO₂ 80 mmHg,體溫 39.4°C,尿袋裡的尿變成可樂色,出現頻發的心室早期收縮。",
      v:{hr:146,sbp:152,dbp:90,spo2:94,etco2:80,rr:24,temp:39.4,skin:"flush",alarm:true},
      ecg:{t:"pvc",lead:"II"},
      q:"現在該怎麼做?",
      options:[
        {t:"停 sevoflurane、100% O₂ 過度換氣、呼救;dantrolene 2.5 mg/kg 靜脈給予",rescue:true,to:"s2",ck:[1,2,3],fb:"晚了,但方向對了。"},
        {t:"給 furosemide 讓尿變清",to:"cpr",fb:"沒有處理原因。橫紋肌溶解與高血鉀繼續惡化,病人心室顫動。"},
        {t:"給 amiodarone 處理早期收縮",to:"cpr",fb:"沒有處理原因,高血鉀與酸中毒繼續惡化,病人心室顫動。"},
        {t:"把警報靜音,請外科加快速度",to:"cpr",fb:"警報是在告訴你病人快撐不住了。高血鉀造成心室顫動。"}
      ]},
    d1c:{ story:"加深麻醉後:體溫 39.8°C、全身肌肉僵硬,EtCO₂ 85 mmHg。心電圖 T 波變高變尖、QRS 變寬。",
      v:{hr:136,sbp:96,dbp:54,spo2:94,etco2:85,rr:12,temp:39.8,skin:"flush",alarm:true,shake:true},
      ecg:{t:"peakedT",lead:"II"},
      q:"現在該怎麼做?",
      options:[
        {t:"給 calcium 處理高血鉀,其餘維持原本的麻醉",to:"cpr",fb:"只處理高血鉀,揮發性麻醉劑還開著、也沒有 dantrolene,病人心室顫動。"},
        {t:"停揮發劑、純氧過度換氣、呼救,dantrolene 2.5 mg/kg;同時用 calcium 處理高血鉀並主動降溫",rescue:true,to:"s2",ck:[1,2,3,5],fb:"方向正確。停誘發藥物與 dantrolene 是治本,高血鉀與高體溫同時處理。"},
        {t:"只給 lidocaine 治療心律不整",to:"cpr",fb:"沒有處理原因,高血鉀與酸中毒繼續惡化,病人心室顫動。"},
        {t:"給 succinylcholine 讓肌肉放鬆",to:"cpr",fb:"Succinylcholine 是誘發藥物,血鉀再上升,病人心室顫動。"}
      ]},
    d1d:{ story:"處理後心跳 98 次/分,但 EtCO₂ 80 mmHg、動脈血 pH 7.05、K⁺ 6.6、血壓 82/44 mmHg,體溫 39.5°C。",
      v:{hr:98,sbp:82,dbp:44,spo2:94,etco2:80,rr:12,temp:39.5,skin:"flush",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"再追加一劑 β-blocker",to:"cpr",fb:"心跳快是高代謝的代償,再壓下去心輸出量撐不住,病人心跳停止。"},
        {t:"給 sodium bicarbonate 後繼續觀察",to:"cpr",fb:"酸中毒的來源沒有被處理,sevoflurane 還開著,病人心室顫動。"},
        {t:"停揮發劑、純氧過度換氣、呼救,dantrolene 2.5 mg/kg 靜脈給予",rescue:true,to:"s2",ck:[1,2,3],fb:"方向正確:停掉誘發藥物並給 dantrolene,才是在處理原因。"},
        {t:"把揮發劑關小一點就好",to:"cpr",fb:"關小不等於停用,惡性高熱會持續,病人心室顫動。"}
      ]},
    s2:{ story:"Sevoflurane 已停、純氧過度換氣中,dantrolene 送到了。病人 70 kg,體溫 39.2°C,EtCO₂ 66 mmHg,K⁺ 6.2 mEq/L。",
      v:{hr:124,sbp:118,dbp:70,spo2:98,etco2:66,rr:24,temp:39.2,skin:"flush",alarm:true},
      q:"給藥與後續處置,何者正確?",
      options:[
        {t:"Dantrolene 2.5 mg/kg 快速靜脈給予,必要時重複;calcium、insulin 加葡萄糖處理高血鉀;主動降溫到 38°C 停止;維持尿量 >2 mL/kg/h;術後送加護病房觀察至少 24 小時",ok:true,to:"win",ck:[4,5,6],fb:"正確。Dantrolene 可重複到症狀控制;降溫到 38°C 就停以免過冷;約四分之一病人會復發,所以要在加護病房觀察。"},
        {t:"Dantrolene 0.25 mg/kg 給一次就好,避免肌肉無力",to:"cpr",fb:"劑量只有建議量的十分之一,高代謝沒被壓住,高血鉀造成心室顫動。"},
        {t:"症狀改善後直接拔管,送回一般病房",to:"dead",fb:"惡性高熱約四分之一會在 24 小時內復發。病人在病房再次高熱,沒有人及時發現,隔天死亡。"},
        {t:"用 verapamil 治療剩下的心律不整",to:"cpr",fb:"鈣離子通道阻斷劑與 dantrolene 併用會造成嚴重高血鉀與心肌抑制,病人心跳停止。"}
      ]}
  },
  win:"體溫回到 37.6°C,EtCO₂ 40 mmHg,肌肉放鬆,尿色變淡。病人在加護病房觀察一天後順利轉出,並安排家族諮詢與惡性高熱體質檢查。",
  dead:"急救無效,宣告死亡。"
},

{ id:"ana", title:"甲狀腺切除:劃刀前血壓掉下來", tag:"全身性過敏",
  patient:"45 歲女性,ASA I,甲狀腺切除,全身麻醉氣管插管。誘導用 propofol、rocuronium;劃刀前 5 分鐘給了 cefazolin。",
  checklist:["鑑別誘導後低血壓的原因並檢查皮膚與呼吸音","停掉可疑藥物並呼救","100% O₂","Epinephrine 靜脈小劑量滴定","快速大量輸液","抽 tryptase、記錄並通報","持續監測雙相反應,不急著拔管"],
  acls:{rhythm:"pea", fix:"大劑量 epinephrine 與快速大量輸液補充血管內容積(過敏性休克)"},
  bonus:[
    {n:"Epinephrine",t:"epinephrine 10–50 mcg 靜脈推注,依血壓逐次滴定",fb:"Epinephrine 同時收縮血管、增加心收縮力,也穩定肥大細胞,是過敏性休克的第一線藥物。",dv:{sbp:14,dbp:8,hr:6}},
    {n:"IV 18G",t:"再打一條 18G 大號點滴快速輸液",fb:"過敏性休克是嚴重的血管擴張與微血管滲漏,需要大量快速補充血管內容積。",dv:{sbp:8,dbp:4}},
    {n:"Vasopressin",t:"epinephrine 效果不好時加 vasopressin",fb:"對 epinephrine 反應不佳的頑固性低血壓,可以加 vasopressin 或 norepinephrine。",dv:{sbp:8}},
    {n:"A-line",t:"放動脈導管",fb:"連續看每一下的血壓,升壓藥滴定更精準,也能抽血驗 tryptase。"},
    {n:"麻醉主治醫師",t:"請麻醉主治醫師來幫忙",fb:"過敏性休克需要多人分工:給藥、輸液、記錄、通知外科。"}],
  start:"s1",
  nodes:{
    s1:{ story:"血壓從 112/70 掉到 68/38 mmHg、心跳 132 次/分,EtCO₂ 26 mmHg,尖峰氣道壓比剛插管時高 10 cmH₂O。病人身上都蓋著布單。",
      v:{hr:132,sbp:68,dbp:38,spo2:93,etco2:26,rr:12,skin:"normal",alarm:true},
      q:"最適當的處置是?",
      options:[
        {t:"停止剛給的藥、100% O₂、呼救並通知外科;掀開布單看皮膚、聽診;epinephrine 靜脈 10–100 mcg 開始滴定,同時快速輸液",ok:true,to:"s2",ck:[0,1,2,3,4],fb:"正確。低血壓合併氣道壓上升、時間點在給抗生素後,要想到全身性過敏;掀開布單常看到被蓋住的潮紅與蕁麻疹。Epinephrine 是第一線藥物。"},
        {t:"誘導後低血壓很常見,給 ephedrine 10 mg 並把 sevoflurane 調低",to:"dD",fb:"單一劑 ephedrine 對這種程度的休克遠遠不夠,也沒有處理氣道壓上升。"},
        {t:"給 diphenhydramine 與 hydrocortisone,然後觀察",to:"dB",fb:"抗組織胺與類固醇是輔助用藥,起效慢,矯正不了休克與支氣管痙攣。"},
        {t:"氣道壓高,把 sevoflurane 調高擴張支氣管",to:"dC",fb:"揮發性麻醉劑擴張血管、抑制心肌,休克時加深只會更糟。"}
      ]},
    dB:{ story:"10 分鐘後:血壓 52/28 mmHg、心跳 146 次/分,尖峰氣道壓 40 cmH₂O,雙側哮鳴音,SpO₂ 86%。掀開布單,胸前與手臂一片潮紅。",
      v:{hr:146,sbp:52,dbp:28,spo2:86,etco2:20,rr:12,skin:"flush",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"Epinephrine 靜脈滴定、快速輸液、100% O₂",rescue:true,to:"s2",ck:[2,3,4],fb:"這才是第一步。Epinephrine 同時處理低血壓與支氣管痙攣。"},
        {t:"再追加第二劑抗組織胺",to:"cpr",fb:"休克持續太久,冠狀動脈灌流不足,病人心跳停止。"},
        {t:"懷疑肺水腫,給 furosemide",to:"cpr",fb:"過敏性休克的血管內容積大量外漏,再利尿等於雪上加霜,病人心跳停止。"},
        {t:"給 propofol 加深麻醉讓氣道壓下降",to:"cpr",fb:"Propofol 擴張血管又抑制心肌,病人心跳停止。"}
      ]},
    dC:{ story:"調高 sevoflurane 後:血壓 44/20 mmHg,EtCO₂ 剩 14 mmHg,頸動脈摸不太到,皮膚蒼白。",
      v:{hr:150,sbp:44,dbp:20,spo2:84,etco2:14,rr:12,skin:"pale",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"等血壓計再量一次確認",to:"cpr",fb:"EtCO₂ 14 加上摸不太到脈搏,循環快要停了。等待的這一分鐘,病人心跳停止。"},
        {t:"關掉揮發劑、100% O₂,epinephrine 靜脈 100 mcg 起並快速大量輸液,摸不到脈搏就開始 CPR",rescue:true,to:"s2",ck:[2,3,4],fb:"及時把循環救回來。"},
        {t:"給 ephedrine 5 mg",to:"cpr",fb:"劑量與藥效都不夠對抗這種休克,病人心跳停止。"},
        {t:"給 atropine",to:"cpr",fb:"問題不是心跳慢,而是血管擴張與容積流失。病人心跳停止。"}
      ]},
    dD:{ story:"血壓短暫回到 80/46 mmHg 後又掉到 58/30 mmHg。掀開布單,嘴唇與舌頭明顯腫脹,SpO₂ 84%,氣道壓持續上升。",
      v:{hr:138,sbp:58,dbp:30,spo2:84,etco2:22,rr:12,skin:"flush",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"繼續追加 ephedrine",to:"cpr",fb:"過敏反應沒有被中止,休克與支氣管痙攣同時惡化,病人心跳停止。"},
        {t:"Epinephrine 靜脈滴定加快速輸液;呼吸道已經水腫,氣管內管留著不動",rescue:true,to:"s2",ck:[2,3,4,6],fb:"正確。換成 epinephrine,並保住已經建立的呼吸道。"},
        {t:"拔掉氣管內管讓病人自己呼吸",to:"cpr",fb:"舌頭與喉頭水腫,拔管後呼吸道完全阻塞、無法再插管,病人缺氧後心跳停止。"},
        {t:"給 β-blocker 把心跳降下來",to:"cpr",fb:"心跳快是代償;β-blocker 還讓 epinephrine 失效,病人心跳停止。"}
      ]},
    s2:{ story:"給了 epinephrine 與 2 公升輸液後,血壓 104/60 mmHg、心跳 108 次/分,氣道壓下降,SpO₂ 98%。外科醫師問:可以開始了嗎?",
      v:{hr:108,sbp:104,dbp:60,spo2:98,etco2:33,rr:12,skin:"flush",alarm:false},
      q:"病人暫時穩定,接下來怎麼做?",
      options:[
        {t:"既然穩定了,馬上拔管送恢復室",to:"cpr",fb:"拔管後 20 分鐘喉頭水腫,呼吸道阻塞、無法重新插管,病人缺氧後心跳停止。"},
        {t:"用較小劑量的 cefazolin 再試一次,確認是不是它",to:"cpr",fb:"再次暴露引發更嚴重的反應,病人心跳停止。"},
        {t:"持續監測,必要時 epinephrine 輸注;1–2 小時內抽 tryptase;完整記錄並通報過敏;與外科討論延後手術;術後加護觀察並轉介過敏科",ok:true,to:"win",ck:[5,6],fb:"正確。Tryptase 有助確認肥大細胞活化;雙相反應可在數小時後出現。"},
        {t:"怕水腫,把輸液與升壓藥都停掉",to:"cpr",fb:"血管通透性還沒恢復,停掉支持後血壓再度崩落,病人心跳停止。"}
      ]}
  },
  win:"手術延期。病人在加護病房觀察 24 小時沒有再發作,病歷與手圈都註記 cefazolin 過敏,並安排過敏科追蹤。",
  dead:"急救無效,宣告死亡。"
},

{ id:"last", title:"全膝置換術前:神經阻斷後病人說耳鳴", tag:"局部麻醉藥中毒",
  patient:"68 歲女性,50 kg,全膝關節置換術前在超音波導引下做神經阻斷,剛打完 0.5% bupivacaine 30 mL。病人清醒、鼻導管給氧。",
  checklist:["把耳鳴、口周麻、躁動與剛打完的局部麻醉藥聯想在一起","停止注射並呼救","100% O₂ 並維持呼吸道通暢","以 benzodiazepine 止抽搐,避免大劑量 propofol","20% 脂肪乳劑 1.5 mL/kg 推注後持續輸注","Epinephrine 用小劑量(≤1 mcg/kg)","避免 vasopressin、鈣離子通道阻斷劑、β-blocker 與 lidocaine"],
  acls:{rhythm:"vf", fix:"20% 脂肪乳劑 1.5 mL/kg 推注後 0.25 mL/kg/min 輸注;CPR 可能需要做很久,無效時考慮體外循環", epi:"小劑量 epinephrine(≤1 mcg/kg),不用 vasopressin", aa:"amiodarone 300 mg IV(不可用 lidocaine)"},
  bonus:[
    {n:"Intralipid 20%",t:"20% 脂肪乳劑 1.5 mL/kg 推注,接著 0.25 mL/kg/min 輸注",fb:"出現局部麻醉藥中毒徵象就要及早給脂肪乳劑,不必等到心跳停止。",dv:{sbp:10,hr:6}},
    {n:"Midazolam",t:"抽搐時給 midazolam",fb:"止抽首選 benzodiazepine;propofol 會抑制心臟,心血管不穩時避免大劑量。"},
    {n:"電擊器",t:"先把去顫電擊片貼好",fb:"局部麻醉藥中毒可能突然變成心室心律不整,先貼好電擊片爭取時間。"},
    {n:"A-line",t:"放動脈導管",fb:"連續監測血壓,急救時也能看胸外按壓的效果。"},
    {n:"CRNA 學姊",t:"請學姊拿局部麻醉藥中毒急救箱",fb:"急救箱裡有脂肪乳劑與流程卡,多一個人照流程一步步核對。"}],
  start:"s1",
  nodes:{
    s1:{ story:"注射完 2 分鐘,病人說耳鳴、嘴巴周圍麻,講話變多、變得躁動,接著兩眼上吊、全身抽搐。",
      v:{hr:118,sbp:158,dbp:92,spo2:91,etco2:30,rr:8,skin:"normal",alarm:true,shake:true},
      q:"第一步最適當的處置是?",
      options:[
        {t:"呼救;100% O₂ 並維持呼吸道;給小劑量 benzodiazepine 止抽搐;請人拿 20% 脂肪乳劑",ok:true,to:"s2",ck:[0,1,2,3],fb:"正確。先確保氧合與通氣(缺氧與酸中毒會加重毒性),用 benzodiazepine 止抽搐,並及早準備脂肪乳劑。"},
        {t:"給 propofol 200 mg 止抽搐",to:"dB",fb:"大劑量 propofol 會抑制已經受影響的心肌。止抽搐首選 benzodiazepine。"},
        {t:"先壓住病人避免受傷,等抽搐自己停",to:"dC",fb:"抽搐時沒有有效呼吸,缺氧、高碳酸與酸中毒會讓心臟毒性大幅加重。"},
        {t:"慢慢滴注 phenytoin",to:"dD",fb:"Phenytoin 起效慢,本身也是鈉離子通道阻斷劑,不適合用在這裡。"}
      ]},
    dB:{ story:"抽搐停了,但血壓 62/30 mmHg、心跳 52 次/分,心電圖 QRS 明顯變寬。",
      v:{hr:52,sbp:62,dbp:30,spo2:90,etco2:28,rr:6,skin:"pale",alarm:true},
      ecg:{t:"wide",lead:"II"},
      q:"現在該怎麼做?",
      options:[
        {t:"給氧並協助通氣;20% 脂肪乳劑 1.5 mL/kg 推注後持續輸注;需要升壓時用小劑量 epinephrine",rescue:true,to:"s2",ck:[2,4,5],fb:"正確。心血管毒性出現時,脂肪乳劑是關鍵治療。"},
        {t:"Epinephrine 1 mg 靜脈推注",to:"cpr",fb:"這種情況下大劑量 epinephrine 會誘發難治的心室性心律不整,病人心室顫動。"},
        {t:"給 vasopressin 升血壓",to:"cpr",fb:"這裡要避免 vasopressin,心輸出量進一步下降,病人心跳停止。"},
        {t:"給 lidocaine 治療寬 QRS",to:"cpr",fb:"Lidocaine 也是局部麻醉藥,等於再加一份毒性,病人心跳停止。"}
      ]},
    dC:{ story:"抽搐持續 3 分鐘:SpO₂ 72%,嘴唇發紺,監視器出現一串心室頻脈。",
      v:{hr:156,sbp:84,dbp:46,spo2:72,etco2:20,rr:4,skin:"cyan",alarm:true,shake:true},
      ecg:{t:"vt",lead:"II",hr:110},
      q:"現在該怎麼做?",
      options:[
        {t:"給 lidocaine 治療心室頻脈",to:"cpr",fb:"Lidocaine 是局部麻醉藥,會加重毒性,心律惡化成心室顫動。"},
        {t:"給 β-blocker 控制心跳",to:"cpr",fb:"β-blocker 抑制心肌收縮,在這裡要避免。病人心跳停止。"},
        {t:"100% O₂ 面罩通氣(必要時插管)、benzodiazepine 止抽搐,並給 20% 脂肪乳劑",rescue:true,to:"s2",ck:[2,3,4],fb:"正確。先把氧合與通氣救回來,止住抽搐,同時給脂肪乳劑。"},
        {t:"給 verapamil",to:"cpr",fb:"鈣離子通道阻斷劑會加重心肌抑制與傳導阻滯,病人心跳停止。"}
      ]},
    dD:{ story:"Phenytoin 還在滴,抽搐已經持續 5 分鐘:SpO₂ 78%、心跳 44 次/分、QRS 變寬。",
      v:{hr:44,sbp:78,dbp:40,spo2:78,etco2:22,rr:4,skin:"cyan",alarm:true,shake:true},
      ecg:{t:"wide",lead:"II"},
      q:"現在該怎麼做?",
      options:[
        {t:"繼續等 phenytoin 起效",to:"cpr",fb:"缺氧與酸中毒持續加重心臟毒性,心跳越來越慢,最後停止。"},
        {t:"給 succinylcholine 讓病人不要動就好",to:"cpr",fb:"肌肉不動不代表腦部停止放電,也沒有給氧通氣,病人缺氧後心跳停止。"},
        {t:"給大劑量 propofol 止抽搐",to:"cpr",fb:"心臟已經被抑制,大劑量 propofol 讓血壓崩落,病人心跳停止。"},
        {t:"100% O₂ 並協助通氣、benzodiazepine 止抽搐、給 20% 脂肪乳劑",rescue:true,to:"s2",ck:[2,3,4],fb:"正確。氧合通氣、止抽搐與脂肪乳劑同時進行。"}
      ]},
    s2:{ story:"病人已經給氧通氣、抽搐停止,脂肪乳劑送到了。但心跳 40 次/分、QRS 很寬,血壓 70/40 mmHg。",
      v:{hr:40,sbp:70,dbp:40,spo2:95,etco2:30,rr:12,skin:"pale",alarm:true},
      ecg:{t:"wide",lead:"II"},
      q:"脂肪乳劑與用藥,何者正確?",
      options:[
        {t:"照一般流程:epinephrine 1 mg 反覆給,再加 vasopressin",to:"cpr",fb:"這種中毒的急救和一般流程不同:大劑量 epinephrine 與 vasopressin 會讓預後變差,病人心室顫動。"},
        {t:"20% 脂肪乳劑 1.5 mL/kg 於 2–3 分鐘推注,接著 0.25 mL/kg/min 輸注;需要時 epinephrine 用小劑量(≤1 mcg/kg);避免 vasopressin、鈣離子通道阻斷劑、β-blocker 與 lidocaine;穩定後持續監測",ok:true,to:"win",ck:[4,5,6],fb:"正確。這是局部麻醉藥中毒的處理重點。"},
        {t:"給 lidocaine 1.5 mg/kg 治療心律不整",to:"cpr",fb:"Lidocaine 是局部麻醉藥,會加重毒性,病人心跳停止。"},
        {t:"拿 propofol 當脂肪乳劑的來源",to:"cpr",fb:"Propofol 的脂肪含量遠遠不夠,需要的量會造成嚴重心肌抑制,病人心跳停止。"}
      ]}
  },
  win:"推注脂肪乳劑後 3 分鐘,QRS 變窄、心跳回到 78 次/分、血壓 112/64 mmHg。手術延期,病人留院監測,之後完全恢復。",
  dead:"急救無效,宣告死亡。"
},

{ id:"lsp", title:"扁桃腺切除:拔管後的那一分鐘", tag:"喉痙攣",
  patient:"5 歲男童,20 kg,扁桃腺切除術,sevoflurane 全身麻醉。手術結束,剛在半清醒狀態下拔管。",
  checklist:["辨識上呼吸道完全阻塞","100% O₂、托下顎、面罩密合給持續正壓","清除口咽的血與分泌物,呼救","Propofol 0.5–1 mg/kg 加深麻醉","無效時給 succinylcholine(必要時肌肉注射)加 atropine","緩解後觀察負壓性肺水腫"],
  acls:{rhythm:"pea", peds:true, kg:20, fix:"打開呼吸道並給氧通氣(缺氧是這位兒童心跳停止的原因)"},
  bonus:[
    {n:"Propofol",t:"propofol 0.5–1 mg/kg 靜脈推注",fb:"小劑量 propofol 常常就能讓聲門放鬆,打斷喉痙攣。",dv:{spo2:6}},
    {n:"Atropine",t:"先給 atropine 0.02 mg/kg",fb:"兒童缺氧加上 succinylcholine 都容易心跳過緩,先預防。",dv:{hr:12}},
    {n:"Succinylcholine",t:"持續喉痙攣時給 succinylcholine(靜脈 0.1–0.5 mg/kg)",fb:"正壓與 propofol 都無效時,小劑量 succinylcholine 能讓聲帶放鬆、重新給氧。"},
    {n:"Endo 5.0",t:"備好 5.0 號有氣囊氣管內管",fb:"5 歲兒童有氣囊管約 4.5–5.0 號;萬一要重新插管,東西先準備好。"}],
  start:"s1",
  nodes:{
    s1:{ story:"拔管後先聽到尖銳的吸氣聲,幾秒後完全沒有聲音。胸部往內凹、肚子往外凸,面罩上的 EtCO₂ 波形消失,SpO₂ 92% 並快速下降。",
      v:{hr:140,sbp:98,dbp:58,spo2:92,etco2:0,rr:30,skin:"normal",alarm:true},
      q:"第一步最適當的處置是?",
      options:[
        {t:"100% O₂、托下顎並在耳後下顎角施壓、面罩密合給持續正壓;抽吸口咽的血與分泌物,呼救",ok:true,to:"s2",ck:[0,1,2],fb:"正確。這是喉痙攣:純氧、托下顎、持續正壓,並移除刺激來源。"},
        {t:"不給藥,直接拿喉頭鏡重新插管",to:"dB",fb:"聲門緊閉時硬插只會加重刺激與損傷,也浪費寶貴的氧合時間。"},
        {t:"戴上鼻導管給氧,搖醒病人",to:"dC",fb:"聲門關著,鼻導管的氧氣進不去;刺激病人反而讓痙攣更久。"},
        {t:"用力擠壓氣囊,用高壓把氣灌進去",to:"dD",fb:"聲門緊閉時,高壓只會把氣灌進胃裡,增加嘔吐與誤吸的風險。"}
      ]},
    dB:{ story:"喉頭鏡下聲門完全緊閉,管子進不去。SpO₂ 70%,心跳從 140 掉到 80 次/分,嘴唇發紺。",
      v:{hr:80,sbp:84,dbp:46,spo2:70,etco2:0,rr:30,skin:"cyan",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"再試第二次、第三次插管",to:"cpr",fb:"反覆嘗試期間沒有任何氧合。兒童缺氧很快變成心搏過緩,接著心跳停止。"},
        {t:"退出喉頭鏡,純氧托下顎給持續正壓;propofol 0.5–1 mg/kg,無效就給 succinylcholine 加 atropine",rescue:true,to:"s2",ck:[1,3,4],fb:"正確。回到基本處置,並用藥物把聲門打開。"},
        {t:"等他缺氧到一定程度,聲門自己會鬆開",to:"cpr",fb:"兒童氧氣儲備少,等不到聲門放鬆就已經心跳停止。"},
        {t:"給 neostigmine 處理可能的殘餘肌鬆",to:"cpr",fb:"問題是聲門痙攣不是肌無力。Neostigmine 還會讓心跳更慢,病人心跳停止。"}
      ]},
    dC:{ story:"病人掙扎了幾下後變得軟弱無力。SpO₂ 62%,全身發紺,心跳 62 次/分。",
      v:{hr:62,sbp:76,dbp:40,spo2:62,etco2:0,rr:10,skin:"cyan",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"給 naloxone 處理可能的鴉片類過量",to:"cpr",fb:"這不是呼吸驅動的問題而是呼吸道完全阻塞。沒有打開呼吸道,病人心跳停止。"},
        {t:"讓他側躺、拍背",to:"cpr",fb:"拍背打不開緊閉的聲門。缺氧持續,心跳停止。"},
        {t:"離開床邊去找人幫忙",to:"cpr",fb:"呼救要用喊的,人不能離開病人。你回來時病人已經沒有心跳。"},
        {t:"100% O₂ 托下顎面罩持續正壓;propofol 0.5–1 mg/kg,無效就給 succinylcholine 加 atropine",rescue:true,to:"s2",ck:[1,3,4],fb:"正確。立刻回到標準處置。"}
      ]},
    dD:{ story:"肚子明顯鼓起來,病人嘔吐,口中有血與胃內容物。SpO₂ 74%,心跳 96 次/分。",
      v:{hr:96,sbp:88,dbp:48,spo2:74,etco2:0,rr:20,skin:"cyan",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"繼續用更大的壓力擠氣囊",to:"cpr",fb:"胃越脹越大、橫膈被往上頂,又再次嘔吐並大量誤吸。病人缺氧後心跳停止。"},
        {t:"頭側一邊並抽吸乾淨;純氧托下顎給持續正壓;propofol 0.5–1 mg/kg,無效就給 succinylcholine 加 atropine",rescue:true,to:"s2",ck:[1,2,3,4],fb:"正確。先清乾淨呼吸道,再回到標準處置。"},
        {t:"用手壓肚子把氣排出來",to:"cpr",fb:"壓肚子把胃內容物擠進沒有保護的呼吸道,造成大量誤吸,病人心跳停止。"},
        {t:"只給 midazolam 讓他安靜下來",to:"cpr",fb:"Midazolam 解不了聲門緊閉。缺氧持續,心跳停止。"}
      ]},
    s2:{ story:"純氧、托下顎與持續正壓都做了,呼吸道仍完全阻塞。SpO₂ 78%,心跳開始變慢到 90 次/分。靜脈管路還在。",
      v:{hr:90,sbp:88,dbp:50,spo2:78,etco2:0,rr:30,skin:"cyan",alarm:true},
      q:"下一步是?",
      options:[
        {t:"繼續維持現狀,等痙攣自己緩解",to:"cpr",fb:"血氧持續下降、心跳變慢就是該用藥的訊號。等待的結果是心跳停止。"},
        {t:"只給 atropine 處理變慢的心跳",to:"cpr",fb:"心跳慢是缺氧造成的。不打開呼吸道,atropine 只能撐幾十秒。"},
        {t:"給 neostigmine 處理可能的殘餘肌鬆",to:"cpr",fb:"Neostigmine 解不了喉痙攣,還會讓已經變慢的心跳更慢。"},
        {t:"Propofol 0.5–1 mg/kg 靜脈給予;仍無效就給 succinylcholine(沒有靜脈時改肌肉注射 4 mg/kg)加 atropine 0.02 mg/kg,必要時重新插管;緩解後觀察有無負壓性肺水腫",ok:true,to:"win",ck:[3,4,5],fb:"正確。基本處置無效就要加深麻醉或給肌鬆劑;兒童給 succinylcholine 要搭配 atropine。"}
      ]}
  },
  win:"給藥後 30 秒聲門放鬆,面罩通氣順暢,SpO₂ 回到 99%。病人在恢復室觀察,沒有出現粉紅色泡沫痰或低血氧。",
  dead:"急救無效,宣告死亡。"
},

{ id:"turp", title:"經尿道攝護腺刮除:病人說頭痛想吐", tag:"TURP 症候群",
  patient:"72 歲男性,體重 68 kg,高血壓,脊髓麻醉(T10)下接受經尿道攝護腺刮除,單極電燒、1.5% glycine 灌洗,手術已進行 70 分鐘。",
  checklist:["把神經症狀、高血壓與心搏過緩聯想到灌洗液吸收","請外科盡快止血結束、降低灌洗液高度","給氧並保護呼吸道","驗血鈉、滲透壓與血糖","有症狀的嚴重低血鈉用 3% 高張食鹽水","矯正速度:前 24 小時不超過 8–10 mEq/L","處理容積過多(限水、必要時利尿)"],
  acls:{rhythm:"pea", fix:"3% 高張食鹽水矯正嚴重低血鈉、停止灌洗液吸收"},
  bonus:[
    {n:"溫毯被",t:"溫毯被保溫",fb:"大量冷的灌洗液會讓老人體溫下降,低體溫會加重凝血異常與寒顫。",dv:{temp:0.5}},
    {n:"A-line",t:"放動脈導管",fb:"可以反覆抽血追血鈉、滲透壓與血糖,連續看血壓。"},
    {n:"Midazolam",t:"抽搐時給 midazolam",fb:"低血鈉可能造成抽搐;止抽同時仍要矯正血鈉。"},
    {n:"外科醫師",t:"請外科醫師盡快止血、結束手術",fb:"灌洗時間越長,吸收的灌洗液越多。"}],
  start:"s1",
  nodes:{
    s1:{ story:"病人說頭痛、想吐、看東西模模糊糊,開始有點躁動。血壓 172/98 mmHg、心跳 52 次/分、SpO₂ 93%,呼吸變快。",
      v:{hr:52,sbp:172,dbp:98,spo2:93,etco2:34,rr:24,skin:"normal",alarm:true},
      q:"最適當的處置是?",
      options:[
        {t:"請泌尿科盡快止血並結束手術、降低灌洗液高度;給氧;抽血驗血鈉、滲透壓與血糖,評估意識",ok:true,to:"s2",ck:[0,1,2,3],fb:"正確。清醒的脊髓麻醉病人,意識與神經症狀是最早的警訊;高血壓加心搏過緩是灌洗液大量吸收、容積過多的表現。"},
        {t:"病人躁動,給 midazolam 讓他安靜下來繼續手術",to:"d1",fb:"鎮靜會蓋掉最重要的監測指標:病人的意識。"},
        {t:"心跳慢給 atropine,血壓高給 labetalol,手術繼續",to:"d2",fb:"只處理數字,沒有想到原因;手術繼續,灌洗液還在被吸收。"},
        {t:"改成全身麻醉插管,讓外科把手術做完",to:"d3",fb:"全身麻醉讓你失去了病人的意識這個監測指標,而吸收還在繼續。"}
      ]},
    d1:{ story:"給了 midazolam 後病人安靜下來。10 分鐘後全身抽搐,SpO₂ 82%,血壓 180/100、心跳 46。",
      v:{hr:46,sbp:180,dbp:100,spo2:82,etco2:30,rr:6,skin:"cyan",alarm:true,shake:true},
      q:"現在該怎麼做?",
      options:[
        {t:"停手術、給氧協助通氣(必要時插管)、benzodiazepine 止抽搐;抽血鈉並準備 3% 高張食鹽水",rescue:true,to:"s2",ck:[1,2,3],fb:"及時處理。抽搐是嚴重低血鈉的表現。"},
        {t:"給 phenytoin 慢慢滴注,手術繼續",to:"cpr",fb:"原因沒處理、手術還在吸收灌洗液;腦水腫加重,病人心跳停止。"},
        {t:"給 furosemide 40 mg 就好",to:"cpr",fb:"利尿無法矯正已經很低的血鈉,抽搐持續,病人缺氧後心跳停止。"},
        {t:"等抽搐自己停",to:"cpr",fb:"缺氧加上腦水腫,病人心跳停止。"}
      ]},
    d2:{ story:"手術繼續。15 分鐘後病人叫不醒,只對疼痛有反應,瞳孔放大,心跳 40 次/分。",
      v:{hr:40,sbp:150,dbp:90,spo2:88,etco2:28,rr:8,skin:"pale",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"請外科立刻結束、停止灌洗;保護呼吸道(插管)與給氧;抽血鈉並準備 3% 高張食鹽水",rescue:true,to:"s2",ck:[1,2,3],fb:"及時處理。意識下降代表腦水腫,要先保護呼吸道。"},
        {t:"再給 atropine 處理心跳慢",to:"cpr",fb:"沒有處理原因,腦水腫持續,病人心跳停止。"},
        {t:"安排頭部電腦斷層,做完再處理",to:"cpr",fb:"病人在電腦斷層室心跳停止。"},
        {t:"給 naloxone",to:"cpr",fb:"不是鴉片類的問題,腦水腫持續,病人心跳停止。"}
      ]},
    d3:{ story:"全身麻醉 30 分鐘後,心電圖 QRS 變寬、ST 段改變,心跳 38 次/分、血壓 74/40 mmHg,呼吸器氣道壓上升,聽到雙側囉音。",
      v:{hr:38,sbp:74,dbp:40,spo2:86,etco2:30,rr:12,skin:"pale",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"請外科立刻結束、停止灌洗;抽血鈉;3% 高張食鹽水;PEEP 與利尿處理肺水腫;以升壓劑支持循環",rescue:true,to:"s2",ck:[1,3],fb:"及時處理。容積過多造成肺水腫,低血鈉影響心臟傳導。"},
        {t:"快速輸注生理食鹽水 2 公升拉血壓",to:"cpr",fb:"病人已經容積過多,再大量輸液讓肺水腫惡化,病人心跳停止。"},
        {t:"加深麻醉",to:"cpr",fb:"血壓更低,病人心跳停止。"},
        {t:"給 atropine 後繼續手術",to:"cpr",fb:"沒有處理原因,吸收持續,病人心跳停止。"}
      ]},
    s2:{ story:"手術已結束。血鈉 114 mEq/L、滲透壓 252 mOsm/kg,病人意識混亂。",
      v:{hr:58,sbp:164,dbp:92,spo2:95,etco2:34,rr:20,skin:"normal",alarm:true},
      q:"矯正低血鈉,何者正確?",
      options:[
        {t:"3% 高張食鹽水(例如 100–150 mL 推注,依症狀可重複),先讓血鈉上升 4–6 mEq/L 止住症狀;前 24 小時總上升不超過 8–10 mEq/L;限水,容積過多時加 furosemide;每 2–4 小時追蹤血鈉",ok:true,to:"win",ck:[4,5,6],fb:"正確。有嚴重症狀時先快速止住症狀,之後放慢速度,避免滲透性去髓鞘。"},
        {t:"一口氣把血鈉補到 140 mEq/L",to:"dead",fb:"矯正太快造成滲透性去髓鞘:病人兩天後出現四肢癱瘓與吞嚥困難,最後死於吸入性肺炎。"},
        {t:"只限水,不給高張食鹽水",to:"cpr",fb:"有嚴重神經症狀的低血鈉只限水太慢,病人抽搐後缺氧,心跳停止。"},
        {t:"快速輸注生理食鹽水 2 公升",to:"cpr",fb:"病人容積過多,生理食鹽水升血鈉的效果有限,反而造成肺水腫,病人心跳停止。"}
      ]}
  },
  win:"3% 食鹽水後 1 小時意識恢復,血鈉 119 mEq/L,隔天 125 mEq/L,沒有神經後遺症。",
  dead:"病人死亡。"
},

{ id:"bcis", title:"髖部半關節置換:放進股骨柄的時候", tag:"骨水泥植入症候群",
  patient:"84 歲女性,股骨頸骨折,心臟衰竭病史,全身麻醉氣管插管下接受骨水泥固定的髖部半關節置換,已放動脈導管。",
  checklist:["把骨水泥與股骨柄放入的時間點和突發低血氧、低血壓、EtCO₂ 下降連起來","100% O₂","告知外科","快速補充容積","以 epinephrine 等血管加壓/強心藥支持右心","避免低血氧、高碳酸與酸中毒(會升高肺血管阻力)","術後送加護病房監測"],
  acls:{rhythm:"pea", fix:"純氧、epinephrine 支持衰竭的右心(類似大量肺栓塞),必要時考慮 ECMO"},
  bonus:[
    {n:"Epinephrine",t:"epinephrine 小劑量推注支持右心",fb:"骨水泥植入後肺動脈壓急升、右心衰竭,epinephrine 能增加心收縮力並維持血壓。",dv:{sbp:14,dbp:6}},
    {n:"Norepinephrine",t:"norepinephrine 持續輸注",fb:"維持主動脈舒張壓,右心的冠狀動脈灌流才夠。",dv:{sbp:10,dbp:6}},
    {n:"CVC",t:"放中央靜脈導管",fb:"升壓藥從中央靜脈給比較安全,也能看中央靜脈壓的變化。"},
    {n:"麻醉主治醫師",t:"請麻醉主治醫師來幫忙",fb:"高齡心衰病人循環崩潰時需要多人分工。"}],
  start:"s1",
  nodes:{
    s1:{ story:"外科剛把骨水泥打進股骨髓腔並放入股骨柄。1 分鐘內 SpO₂ 從 98% 掉到 87%,EtCO₂ 由 35 掉到 21 mmHg,動脈壓 70/38 mmHg,心跳 118。",
      v:{hr:118,sbp:70,dbp:38,spo2:87,etco2:21,rr:12,skin:"pale",alarm:true},
      q:"最適當的處置是?",
      options:[
        {t:"FiO₂ 100%、告知外科;快速輸液;以 phenylephrine 或 epinephrine 小劑量滴定支持血壓與右心;準備可能的心跳停止",ok:true,to:"s2",ck:[0,1,2,3,4],fb:"正確。時間點正好在骨水泥與股骨柄放入,突發低血氧、低血壓與 EtCO₂ 下降(死腔增加),是骨水泥植入症候群的表現。"},
        {t:"可能是疼痛刺激,加深麻醉",to:"d1",fb:"加深麻醉會讓血壓更低,在右心衰竭時很危險。"},
        {t:"可能是氣胸,立刻在鎖骨中線第二肋間針刺減壓",to:"d2",fb:"沒有呼吸音不對稱、氣道壓上升等證據就針刺,只是延誤真正的處置。"},
        {t:"給 furosemide 預防肺水腫",to:"d3",fb:"病人正處於低血壓,利尿會讓前負荷更少,衰竭的右心更撐不住。"}
      ]},
    d1:{ story:"加深麻醉後:動脈壓 50/26 mmHg,EtCO₂ 14 mmHg,心跳 132,SpO₂ 82%。",
      v:{hr:132,sbp:50,dbp:26,spo2:82,etco2:14,rr:12,skin:"pale",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"關掉揮發劑、100% O₂,epinephrine 靜脈滴定與快速輸液,告知外科",rescue:true,to:"s2",ck:[1,2,3,4],fb:"及時把循環撐住。"},
        {t:"給 nitroglycerin 降低心臟負擔",to:"cpr",fb:"在低血壓下擴張血管,冠狀動脈灌流崩落,病人心跳停止。"},
        {t:"再等一下看看會不會自己回來",to:"cpr",fb:"右心持續衰竭,病人心跳停止。"},
        {t:"給 esmolol 把心跳降下來",to:"cpr",fb:"心跳快是代償,β-blocker 讓心輸出量崩落,病人心跳停止。"}
      ]},
    d2:{ story:"針刺後沒有氣體出來。動脈壓 52/28 mmHg,SpO₂ 80%,EtCO₂ 15 mmHg。",
      v:{hr:134,sbp:52,dbp:28,spo2:80,etco2:15,rr:12,skin:"cyan",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"100% O₂,epinephrine 靜脈滴定與快速輸液,告知外科",rescue:true,to:"s2",ck:[1,2,3,4],fb:"回到正確方向。"},
        {t:"在另一側也做針刺減壓",to:"cpr",fb:"延誤處置,右心衰竭持續,病人心跳停止。"},
        {t:"放胸管後再處理血壓",to:"cpr",fb:"處置延誤,病人心跳停止。"},
        {t:"給 atropine",to:"cpr",fb:"問題不在心跳,而是右心阻塞性衰竭,病人心跳停止。"}
      ]},
    d3:{ story:"利尿後:動脈壓 54/30 mmHg、心跳 136,SpO₂ 84%。",
      v:{hr:136,sbp:54,dbp:30,spo2:84,etco2:16,rr:12,skin:"pale",alarm:true},
      ecg:{t:"wide",lead:"II"},
      q:"現在該怎麼做?",
      options:[
        {t:"100% O₂,快速輸液補回前負荷,epinephrine 靜脈滴定支持右心,告知外科",rescue:true,to:"s2",ck:[1,2,3,4],fb:"回到正確方向。"},
        {t:"再追加 furosemide",to:"cpr",fb:"前負荷更少,右心撐不住,病人心跳停止。"},
        {t:"給 nitroglycerin",to:"cpr",fb:"血壓崩落,病人心跳停止。"},
        {t:"把 PEEP 調到 15 cmH₂O 改善氧合",to:"cpr",fb:"高 PEEP 讓靜脈回流更少、右心後負荷更高,病人心跳停止。"}
      ]},
    s2:{ story:"給了 epinephrine 與輸液後,動脈壓 92/54 mmHg、SpO₂ 94%。經食道心臟超音波:右心室擴大、收縮差,中央靜脈壓由 8 升到 18 mmHg。",
      v:{hr:112,sbp:92,dbp:54,spo2:94,etco2:28,rr:12,skin:"normal",alarm:true},
      q:"接下來怎麼做?",
      options:[
        {t:"持續 epinephrine 或 norepinephrine 維持全身血壓以保冠狀動脈灌流;避免低血氧、高碳酸與酸中毒;輸液改為依反應少量給;術後送加護病房",ok:true,to:"win",ck:[5,6],fb:"正確。衰竭的右心需要足夠的冠狀動脈灌流壓;升高肺血管阻力的因素都要避免。"},
        {t:"再快速輸液 3 公升讓中央靜脈壓更高",to:"cpr",fb:"右心已經擴大,過多容積讓室中隔壓向左心,心輸出量崩落,病人心跳停止。"},
        {t:"給 nitroglycerin 減少後負荷",to:"cpr",fb:"全身血壓下降,右心冠狀動脈灌流不足,病人心跳停止。"},
        {t:"降低通氣量讓 CO₂ 上升擴張血管",to:"cpr",fb:"高碳酸會升高肺血管阻力,右心更撐不住,病人心跳停止。"}
      ]}
  },
  win:"手術順利完成。病人在加護病房用 norepinephrine 支持一天後停藥,第三天轉回病房。",
  dead:"急救無效,宣告死亡。"
},

{ id:"ekg", title:"大腸切除:監視器上的 ST 段", tag:"術中心肌缺血",
  patient:"66 歲男性,高血壓、糖尿病、三年前放過冠狀動脈支架,全身麻醉下接受開腹大腸切除。監視器顯示 II 與 V5 導程。",
  checklist:["辨識缺血型 ST 段變化並做 12 導程比較","找出心肌氧供需失衡的原因(心跳、血壓、氧合、血紅素)","以加深麻醉與 β-blocker 小心控制心搏過速","確保氧合與足夠血紅素","低血壓時用升壓劑維持冠狀動脈灌流壓","追蹤 troponin、術後監測並會診心臟科"],
  acls:{rhythm:"vf", fix:"恢復循環後緊急心導管處理急性冠狀動脈症候群"},
  bonus:[
    {n:"Esmolol",t:"心跳快時給 esmolol 慢慢降心跳",fb:"心跳越快,心肌耗氧越多、舒張期灌流時間越短;血壓夠時降心跳可以減少缺血。",dv:{hr:-12}},
    {n:"Phenylephrine",t:"血壓低時給 phenylephrine",fb:"維持舒張壓才能維持冠狀動脈灌流。",dv:{sbp:10,dbp:6}},
    {n:"Nitroglycerin",t:"血壓夠時給小劑量 nitroglycerin",fb:"減少前負荷與心室壁張力、擴張冠狀動脈;血壓低時不能用。"},
    {n:"A-line",t:"放動脈導管",fb:"連續看血壓,也能抽血驗血紅素與心肌酵素。"},
    {n:"PRBC",t:"血紅素太低時輸血",fb:"貧血讓帶到心肌的氧氣不夠;冠心病人血紅素太低時考慮輸血。",dv:{spo2:1}}],
  start:"s1",
  nodes:{
    s1:{ story:"剛劃刀不久。心跳 118 次/分、血壓 172/98 mmHg,V5 導程 ST 段水平下降 2 mm,和誘導前不同。",
      v:{hr:118,sbp:172,dbp:98,spo2:99,etco2:35,rr:12,skin:"normal",alarm:true,rhythm:"st"},
      ecg:{t:"stdep",lead:"V5",mm:2},
      q:"最適當的處置是?",
      options:[
        {t:"加深麻醉與止痛控制交感反應;esmolol 小劑量滴定降心跳,維持舒張壓;確認氧合與血紅素;印 12 導程比較",ok:true,to:"s2",ck:[0,1,2,3],fb:"正確。心搏過速縮短舒張期、增加耗氧,是麻醉中缺血最常見的原因,先處理供需失衡。"},
        {t:"給 ephedrine 提高血壓增加冠狀動脈灌流",to:"d1",fb:"血壓本來就高;ephedrine 讓心跳更快,氧需求更多。"},
        {t:"Nitroglycerin 大劑量快速推注",to:"d2",fb:"快速大劑量會讓血壓驟降,冠狀動脈灌流壓不足,反射性心跳更快。"},
        {t:"ST 變化多半是電極或濾波的問題,不需處理",to:"d3",fb:"和誘導前不同的新 ST 段下降要當作缺血處理,先排除再說。"}
      ]},
    d1:{ story:"Ephedrine 後心跳 138 次/分,血壓 190/104,V5 ST 段下降 4 mm,出現頻繁心室早期收縮。",
      v:{hr:138,sbp:190,dbp:104,spo2:98,etco2:36,rr:12,skin:"normal",alarm:true,rhythm:"st"},
      ecg:{t:"stdep",lead:"V5",mm:4,pvc:true},
      q:"現在該怎麼做?",
      options:[
        {t:"加深麻醉、esmolol 滴定降心跳、純氧,印 12 導程",rescue:true,to:"s2",ck:[1,2,3],fb:"回到正確方向。"},
        {t:"再給一次 ephedrine",to:"cpr",fb:"心肌缺血加重,心室早期收縮變成心室顫動。"},
        {t:"給 atropine",to:"cpr",fb:"心跳更快,缺血惡化成心室顫動。"},
        {t:"不處理,手術繼續",to:"cpr",fb:"缺血持續,心室早期收縮變成心室顫動。"}
      ]},
    d2:{ story:"推注後血壓 72/40 mmHg,心跳 132,ST 段下降更深。",
      v:{hr:132,sbp:72,dbp:40,spo2:98,etco2:30,rr:12,skin:"pale",alarm:true,rhythm:"st"},
      ecg:{t:"stdep",lead:"V5",mm:4},
      q:"現在該怎麼做?",
      options:[
        {t:"停 nitroglycerin,phenylephrine 拉回舒張壓,補充容積,之後再小心處理心跳",rescue:true,to:"s2",ck:[1,4],fb:"及時把冠狀動脈灌流壓救回來。"},
        {t:"再追加 nitroglycerin",to:"cpr",fb:"血壓更低,冠狀動脈灌流崩落,病人心室顫動。"},
        {t:"給 esmolol 把心跳壓下來",to:"cpr",fb:"在低血壓時給 β-blocker,心輸出量崩落,病人心室顫動。"},
        {t:"加深麻醉",to:"cpr",fb:"血壓更低,病人心室顫動。"}
      ]},
    d3:{ story:"15 分鐘後 V5 ST 段改成上升 3 mm,血壓 90/50,出現心室頻脈連發。",
      v:{hr:124,sbp:90,dbp:50,spo2:96,etco2:30,rr:12,skin:"pale",alarm:true,rhythm:"st"},
      ecg:{t:"stelev",lead:"V5",mm:3},
      q:"現在該怎麼做?",
      options:[
        {t:"純氧、維持血壓、控制心跳;印 12 導程、通知外科與心臟科,討論盡快結束手術與緊急心導管",rescue:true,to:"s2",ck:[0,1],fb:"ST 上升代表可能急性冠狀動脈阻塞,要盡快安排再灌流。"},
        {t:"給 aspirin 與 heparin 全量抗凝,手術繼續",to:"cpr",fb:"開腹手術中全量抗凝造成大出血,休克後心室顫動。"},
        {t:"再觀察 15 分鐘",to:"cpr",fb:"心室頻脈變成心室顫動。"},
        {t:"給 nitroglycerin 大劑量推注",to:"cpr",fb:"血壓崩落,病人心室顫動。"}
      ]},
    s2:{ story:"心跳 76、血壓 130/74 後 ST 段回到基準線。40 分鐘後腸繫膜出血,血紅素 7.0 g/dL,血壓 84/46 mmHg、心跳 114,ST 段又下降。",
      v:{hr:114,sbp:84,dbp:46,spo2:98,etco2:32,rr:12,skin:"pale",alarm:true,rhythm:"st"},
      ecg:{t:"stdep",lead:"V5",mm:2},
      q:"接下來怎麼做?",
      options:[
        {t:"補充容積並輸紅血球;用 phenylephrine 維持冠狀動脈灌流壓;請外科止血;術後追蹤 troponin、加護監測並會診心臟科",ok:true,to:"win",ck:[3,4,5],fb:"正確。這次缺血來自低血壓與貧血(氧供應不足),要補氧供應而不是壓心跳。"},
        {t:"心跳快,給 esmolol",to:"cpr",fb:"低血容時心跳快是代償,β-blocker 讓血壓崩落,病人心室顫動。"},
        {t:"給 nitroglycerin 擴張冠狀動脈",to:"cpr",fb:"低血壓時擴張血管,冠狀動脈灌流壓崩落,病人心室顫動。"},
        {t:"只觀察,等外科止血",to:"cpr",fb:"持續低血壓與貧血,缺血惡化成心室顫動。"}
      ]}
  },
  win:"輸了兩單位紅血球,血壓 118/68、ST 段回到基準線。術後 troponin 輕度上升,心臟科安排後續評估,病人順利出院。",
  dead:"急救無效,宣告死亡。"
}
];

// ---------- 第三批情境:兒童延遲甦醒、脊髓麻醉效果不好改全身麻醉、剖腹產改全身麻醉、重大外傷 ----------
window.ISLAND_SCENARIOS.push(
{ id:"de", title:"尿道下裂修補:手術結束了,孩子還沒醒", tag:"延遲甦醒(低血糖、低體溫)",
  patient:"3 歲女童,14 kg,尿道下裂修補 3 小時,sevoflurane 全身麻醉加骶管阻斷。昨晚 8 點後禁食,術中輸 lactated Ringer's。",
  checklist:["系統性找延遲甦醒的原因(藥物、體溫、血糖、電解質、神經學)","測床邊血糖","以 TOF 確認肌肉鬆弛已完全恢復","依原因處理,不盲目給拮抗劑","兒童低血糖用 D10W 2–5 mL/kg 並複測","主動保溫並持續保護呼吸道直到清醒"],
  acls:{rhythm:"pea", peds:true, kg:14, fix:"D10W 矯正低血糖、主動保溫"},
  bonus:[
    {n:"溫毯被",t:"溫毯被主動保溫",fb:"小孩體表面積大,長時間手術很容易失溫;低體溫會讓麻醉藥代謝變慢、更難醒。",dv:{temp:0.8}},
    {n:"NMT",t:"接上肌肉鬆弛監測",fb:"確認沒有殘餘肌肉鬆弛,才能把延遲甦醒的原因範圍縮小。"},
    {n:"BIS",t:"貼上 BIS",fb:"看麻醉深度,區分是麻醉還太深,還是有其他原因(低血糖、低體溫)讓孩子醒不來。"},
    {n:"麻醉主治醫師",t:"請麻醉主治醫師來一起評估",fb:"延遲甦醒要系統性地一項一項排除,多一個人一起想。"}],
  start:"s1",
  nodes:{
    s1:{ story:"Sevoflurane 關掉已經 25 分鐘,孩子還是叫不醒,對疼痛刺激只有輕微反應。自主呼吸淺、每分鐘 10 次,SpO₂ 96%,心跳 88,四肢冰涼。",
      v:{hr:88,sbp:84,dbp:46,spo2:96,etco2:48,rr:10,temp:35.0,skin:"pale",alarm:true},
      q:"最適當的處置是?",
      options:[
        {t:"維持呼吸道與通氣;量中心體溫、測床邊血糖、做 TOF、看瞳孔,並回顧術中用藥的種類與時間",ok:true,to:"s2",ck:[0,1,2],fb:"正確。延遲甦醒要系統性找原因:殘餘藥物、低體溫、低血糖、電解質異常、高碳酸、神經學事件。"},
        {t:"給 naloxone 0.1 mg/kg 全量推注",to:"d1",fb:"在沒找原因前就給拮抗劑;這孩子只用了少量鴉片類,而且全量推注會造成疼痛與交感暴衝。"},
        {t:"已經有自主呼吸,拔管送恢復室慢慢醒",to:"d2",fb:"意識還沒恢復、呼吸淺,拔管後很容易呼吸道阻塞。"},
        {t:"給 flumazenil",to:"d3",fb:"這孩子沒有用 benzodiazepine,flumazenil 沒有作用,也延誤了找原因。"}
      ]},
    d1:{ story:"Naloxone 推注後孩子扭動了一下又睡回去。心跳 150、血壓 118/70,還沒量體溫與血糖。",
      v:{hr:150,sbp:118,dbp:70,spo2:95,etco2:46,rr:12,temp:34.9,skin:"pale",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"再給一次 naloxone",to:"cpr",fb:"原因沒找到。低血糖持續造成抽搐,接著缺氧與心搏過緩,心跳停止。"},
        {t:"停下來系統性評估:量體溫、測床邊血糖、做 TOF、看瞳孔",rescue:true,to:"s2",ck:[0,1,2],fb:"回到正確方向。"},
        {t:"拔管送恢復室",to:"cpr",fb:"在恢復室呼吸道阻塞,低血糖持續,心跳停止。"},
        {t:"安排頭部電腦斷層再說",to:"cpr",fb:"在電腦斷層室抽搐、缺氧,心跳停止。"}
      ]},
    d2:{ story:"拔管 5 分鐘後,孩子先發出打鼾聲,然後沒有聲音,SpO₂ 82%,心跳 70。",
      v:{hr:70,sbp:76,dbp:40,spo2:82,etco2:0,rr:4,skin:"cyan",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"給氧氣鼻導管就好",to:"cpr",fb:"呼吸道阻塞時鼻導管沒有用,心跳越來越慢,最後停止。"},
        {t:"給 naloxone",to:"cpr",fb:"問題是呼吸道阻塞,不是鴉片類。缺氧持續,心跳停止。"},
        {t:"托下顎、面罩正壓給 100% O₂(必要時重新插管),再系統性找延遲甦醒的原因",rescue:true,to:"s2",ck:[0],fb:"先救呼吸道,再找原因。"},
        {t:"等他自己醒",to:"cpr",fb:"缺氧讓心跳變慢,最後停止。"}
      ]},
    d3:{ story:"Flumazenil 後完全沒反應。體溫 34.8°C,四肢冰涼,還沒測血糖。",
      v:{hr:84,sbp:80,dbp:44,spo2:95,etco2:48,rr:9,temp:34.8,skin:"pale",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"再給一劑 flumazenil",to:"cpr",fb:"沒有對應的原因。低血糖持續,抽搐後心跳停止。"},
        {t:"量體溫、測床邊血糖、做 TOF、看瞳孔,回顧用藥",rescue:true,to:"s2",ck:[0,1,2],fb:"回到系統性評估。"},
        {t:"給 physostigmine",to:"cpr",fb:"沒有抗膽鹼中毒的證據,反而造成心搏過緩,心跳停止。"},
        {t:"拔管送恢復室觀察",to:"cpr",fb:"在恢復室呼吸道阻塞,低血糖持續,心跳停止。"}
      ]},
    s2:{ story:"體溫 34.8°C,床邊血糖 38 mg/dL,TOF 比值 0.95,瞳孔對稱有光反射。",
      v:{hr:86,sbp:82,dbp:44,spo2:97,etco2:46,rr:10,temp:34.8,skin:"pale",alarm:true},
      q:"接下來怎麼做?",
      options:[
        {t:"只要保溫,體溫回來就會醒",to:"cpr",fb:"嚴重低血糖沒有處理,孩子抽搐後缺氧,心跳停止。"},
        {t:"D10W 2–5 mL/kg(約 30–70 mL)推注,接著含葡萄糖的輸液維持,15–30 分鐘複測血糖;同時用熱風毯與加溫輸液主動保溫,呼吸道保留到完全清醒",ok:true,to:"win",ck:[3,4,5],fb:"正確。兒童用 D10W 就好,不需要高濃度葡萄糖;低體溫也會延遲甦醒,要一起處理。"},
        {t:"再給一次 neostigmine 確保肌肉鬆弛拮抗完全",to:"cpr",fb:"TOF 已經 0.95,不需要再拮抗;低體溫的孩子給 neostigmine 造成嚴重心搏過緩,心跳停止。"},
        {t:"給 naloxone 後再觀察",to:"cpr",fb:"原因不是鴉片類。低血糖持續,抽搐後心跳停止。"}
      ]}
  },
  win:"推注葡萄糖 10 分鐘後孩子睜眼哭鬧,體溫回到 36.2°C 後拔管,血糖 112 mg/dL。",
  dead:"急救無效,宣告死亡。",
  isbar:{i:"3 歲女童 14 kg,尿道下裂修補,全身麻醉加骶管阻斷。",s:"術後延遲甦醒,原因是低血糖(38 mg/dL)與低體溫(34.8°C)。",b:"無過敏;術前禁食 12 小時以上;已給 D10W 推注,含葡萄糖輸液維持中;骶管 bupivacaine 止痛。",a:"已清醒拔管、血糖 112、體溫 36.2°C、生命徵象穩定。",r:"每 30–60 分鐘複測血糖直到可進食;持續保溫;觀察呼吸與尿管;血糖 <60 或嗜睡立刻通知。"}},

{ id:"fsp", title:"疝氣修補:劃刀時病人喊痛", tag:"脊髓麻醉效果不足,術中改全身麻醉",
  patient:"58 歲男性,92 kg,高血壓,右側腹股溝疝氣修補。脊髓麻醉 0.5% hyperbaric bupivacaine 2.5 mL,鼻導管給氧。",
  checklist:["確認阻斷範圍不足並與外科溝通","不在麻醉不足下用大量鎮靜硬撐","改全身麻醉前預給氧、備好升壓劑","誘導藥減量(已有交感阻斷)","處理誘導後低血壓與心搏過緩","重新打脊髓麻醉要考慮高位阻斷風險"],
  acls:{rhythm:"pea", fix:"純氧通氣,及早給 epinephrine(椎管內麻醉後的嚴重心搏過緩與低血壓)"},
  bonus:[
    {n:"Fentanyl",t:"小劑量 fentanyl 補充鎮痛",fb:"阻斷效果不完全時,小劑量鴉片類可以先止痛,但要注意呼吸抑制。",dv:{hr:-6}},
    {n:"Ketamine",t:"小劑量 ketamine",fb:"鎮痛效果好、比較不抑制呼吸,適合補強不完全的阻斷。"},
    {n:"LMA",t:"備好聲門上呼吸道",fb:"改全身麻醉時,這類手術常可用聲門上呼吸道。"},
    {n:"Ephedrine",t:"血壓偏低時給 ephedrine",fb:"脊髓麻醉後交感神經被阻斷,血壓與心跳都可能偏低。",dv:{sbp:10,hr:6}}],
  start:"s1",
  nodes:{
    s1:{ story:"打完脊髓麻醉 20 分鐘,冷覺只到 L1。外科劃刀後病人大叫會痛、一直動,血壓 168/96、心跳 104。",
      v:{hr:104,sbp:168,dbp:96,spo2:97,etco2:38,rr:22,skin:"normal",alarm:true},
      q:"最適當的處置是?",
      options:[
        {t:"給大量 fentanyl 與 midazolam 讓他睡著,手術繼續",to:"d1",fb:"用鎮靜去補一個沒有作用的區域麻醉,很容易變成沒有保護的深度鎮靜。"},
        {t:"請外科暫停並告知病人;改全身麻醉:預給氧,誘導藥減量滴定並準備好 phenylephrine/ephedrine,放喉罩或插管後繼續",ok:true,to:"s2",ck:[0,1,2,3],fb:"正確。阻斷範圍不夠就改全身麻醉;已經有部分交感阻斷,誘導藥要減量、升壓劑先備好。"},
        {t:"請病人忍耐,手術很快就好",to:"d2",fb:"疼痛造成的交感暴衝對高血壓病人很危險,也是病人不愉快的經驗。"},
        {t:"讓病人側躺,用同樣劑量再打一次脊髓麻醉",to:"d3",fb:"第一劑已經在脊髓腔裡,再打一次全量,實際阻斷範圍很難預測,可能變成高位阻斷。"}
      ]},
    d1:{ story:"鎮靜後病人開始打鼾,接著沒有聲音。SpO₂ 84%,EtCO₂ 波形消失。",
      v:{hr:96,sbp:118,dbp:70,spo2:84,etco2:0,rr:4,skin:"cyan",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"提高鼻導管氧氣流量",to:"cpr",fb:"呼吸道阻塞時鼻導管沒有用,缺氧後心跳停止。"},
        {t:"托下顎、面罩正壓給 100% O₂;接著改成正式的全身麻醉並確保呼吸道",rescue:true,to:"s2",ck:[1,2],fb:"先救呼吸道,再改全身麻醉。"},
        {t:"給 naloxone 和 flumazenil 後讓手術繼續",to:"cpr",fb:"拮抗後病人疼痛躁動、又再追加鎮靜,反覆缺氧後心跳停止。"},
        {t:"再追加 midazolam 讓他不要動",to:"cpr",fb:"呼吸更抑制,缺氧後心跳停止。"}
      ]},
    d2:{ story:"病人一直掙扎,血壓 196/110、心跳 128,監視器 ST 段下降。",
      v:{hr:128,sbp:196,dbp:110,spo2:96,etco2:36,rr:26,skin:"flush",alarm:true,rhythm:"st"},
      q:"現在該怎麼做?",
      options:[
        {t:"給 labetalol 降血壓,手術繼續",to:"cpr",fb:"疼痛還在,交感暴衝持續,心肌缺血惡化成心室顫動。"},
        {t:"請外科暫停、改全身麻醉:預給氧、誘導藥減量並備好升壓劑",rescue:true,to:"s2",ck:[0,2,3],fb:"處理原因:疼痛。"},
        {t:"給 midazolam 讓他安靜",to:"cpr",fb:"沒有止痛,鎮靜加上缺氧讓心肌缺血惡化成心室顫動。"},
        {t:"請外科加快速度",to:"cpr",fb:"疼痛持續、心肌缺血惡化成心室顫動。"}
      ]},
    d3:{ story:"第二劑打完 3 分鐘,病人說手抬不起來、呼吸好喘,接著講不出話。血壓 70/40、心跳 42。",
      v:{hr:42,sbp:70,dbp:40,spo2:88,etco2:22,rr:6,skin:"pale",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"讓病人坐起來,避免藥物往上跑",to:"cpr",fb:"坐起讓靜脈回流更少,嚴重低血壓與心搏過緩後心跳停止。"},
        {t:"鼻導管氧氣加大,觀察",to:"cpr",fb:"呼吸肌已經被阻斷,通氣不足,缺氧後心跳停止。"},
        {t:"呼救;仰臥、100% O₂ 面罩正壓後插管;phenylephrine/ephedrine、atropine,反應不佳就給 epinephrine,快速輸液",rescue:true,to:"s2",ck:[5],fb:"高位脊髓麻醉:保住呼吸與循環,插管後改全身麻醉完成手術。"},
        {t:"給 naloxone",to:"cpr",fb:"這不是鴉片類的問題。呼吸與循環持續惡化,心跳停止。"}
      ]},
    s2:{ story:"已經預給氧,propofol 誘導後放上喉罩。血壓從 132/80 掉到 66/36,心跳 50。",
      v:{hr:50,sbp:66,dbp:36,spo2:99,etco2:36,rr:12,skin:"pale",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"把 sevoflurane 調高,避免術中知曉",to:"cpr",fb:"在部分交感阻斷下加深麻醉,血壓崩落,心跳停止。"},
        {t:"等它自己回來",to:"cpr",fb:"低血壓加心搏過緩持續,心跳停止。"},
        {t:"給 esmolol 保護心臟",to:"cpr",fb:"心跳已經慢,β-blocker 讓心輸出量崩落,心跳停止。"},
        {t:"Ephedrine 或 phenylephrine 推注、快速輸液,心跳慢加 atropine;血壓回穩後再調整麻醉深度",ok:true,to:"win",ck:[4],fb:"正確。誘導藥加上殘存的交感阻斷,低血壓與心搏過緩很常見,要預期並立即處理。"}
      ]}
  },
  win:"血壓回到 118/70 後手術順利完成,病人在恢復室清醒,沒有術中記憶。",
  dead:"急救無效,宣告死亡。",
  isbar:{i:"58 歲男性 92 kg,右側腹股溝疝氣修補。",s:"脊髓麻醉範圍不足(冷覺只到 L1),術中改全身麻醉放喉罩完成手術。",b:"高血壓;無過敏;誘導後低血壓與心搏過緩,給過 ephedrine 與 atropine;脊髓麻醉 bupivacaine 仍有部分作用。",a:"已清醒、血壓 124/76、心跳 72、疼痛 3 分。",r:"評估下肢感覺運動恢復與解尿;注意延遲出現的低血壓;疼痛 >4 分給止痛;術中知曉的問題要詢問並記錄。"}},

{ id:"csga", title:"脊髓麻醉下剖腹產:產婦說胸悶", tag:"高位脊髓麻醉,剖腹產緊急改全身麻醉",
  patient:"32 歲第一胎足月,BMI 34,脊髓麻醉下接受剖腹產。打完脊髓麻醉剛 5 分鐘,外科正在消毒鋪單。",
  checklist:["辨識高位脊髓麻醉","呼救、子宮左移、100% O₂","處理低血壓與心搏過緩(phenylephrine、ephedrine、atropine,必要時 epinephrine)","快速誘導插管:頭高斜坡擺位、影像喉頭鏡","插管失敗不反覆嘗試,改二代聲門上呼吸道","胎兒娩出後處理子宮收縮無力與出血"],
  acls:{rhythm:"pea", fix:"子宮左移(必要時手動把子宮推向左側);4 分鐘內沒恢復循環,就在原地做復甦性子宮切開取出胎兒"},
  bonus:[
    {n:"Phenylephrine",t:"phenylephrine 推注或持續輸注",fb:"高位阻斷造成嚴重低血壓,維持血壓才能維持胎盤血流。",dv:{sbp:14,dbp:6}},
    {n:"Endo 6.5",t:"備好 6.5 號氣管內管",fb:"孕婦呼吸道水腫,要用比平常小一號的管子(6.0–6.5)。"},
    {n:"影像喉頭鏡",t:"第一次插管就用影像喉頭鏡",fb:"產婦插管失敗的機率比一般人高,第一次就用最好的工具。"},
    {n:"Bougie",t:"備好 bougie",fb:"看不到聲門時沿著 bougie 套管進去,提高第一次就成功的機率。"},
    {n:"溫毯被",t:"溫毯被保溫",fb:"剖腹產常有低體溫,會加重出血與寒顫。",dv:{temp:0.4}}],
  start:"s1",
  nodes:{
    s1:{ story:"產婦說胸口悶、手指發麻、講話越來越小聲,接著反應變慢。血壓 70/38、心跳 48,SpO₂ 93%。",
      v:{hr:48,sbp:70,dbp:38,spo2:93,etco2:28,rr:8,skin:"pale",alarm:true},
      q:"最適當的處置是?",
      options:[
        {t:"把床頭抬高,避免麻醉藥再往上跑",to:"d1",fb:"抬高床頭讓靜脈回流更少,低血壓與心搏過緩更嚴重。"},
        {t:"給 midazolam 讓她不要那麼焦慮",to:"d2",fb:"她的症狀不是焦慮,是阻斷範圍太高;鎮靜會讓呼吸更差。"},
        {t:"呼救;子宮左移、100% O₂ 面罩;phenylephrine 加 ephedrine 推注、atropine 處理心搏過緩、快速輸液;準備快速誘導插管",ok:true,to:"s2",ck:[0,1,2],fb:"正確。高位脊髓麻醉:先救循環與氧合,同時準備接手呼吸道。"},
        {t:"請外科加快速度把小孩拿出來,其他先觀察",to:"d3",fb:"母親的呼吸與循環正在惡化,沒有處理只會兩個人都危險。"}
      ]},
    d1:{ story:"抬高床頭後:血壓 52/28、心跳 38,產婦叫不醒,SpO₂ 85%。",
      v:{hr:38,sbp:52,dbp:28,spo2:85,etco2:20,rr:4,skin:"pale",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"放平、子宮左移、100% O₂ 正壓通氣;phenylephrine、ephedrine、atropine,反應不佳立刻給 epinephrine;準備插管",rescue:true,to:"s2",ck:[1,2],fb:"及時把循環與氧合撐住。"},
        {t:"再抬高一點",to:"cpr",fb:"靜脈回流更少,心跳停止。"},
        {t:"給 naloxone",to:"cpr",fb:"不是鴉片類的問題,心跳停止。"},
        {t:"先量一次血壓確認",to:"cpr",fb:"延誤處置,心跳停止。"}
      ]},
    d2:{ story:"Midazolam 後產婦沒有反應,呼吸每分鐘 4 次,SpO₂ 84%,心跳 44。",
      v:{hr:44,sbp:66,dbp:34,spo2:84,etco2:18,rr:4,skin:"cyan",alarm:true},
      ecg:{t:"stdep",lead:"V5",mm:1.5},
      q:"現在該怎麼做?",
      options:[
        {t:"給 flumazenil 後觀察",to:"cpr",fb:"呼吸抑制主要來自高位阻斷,flumazenil 救不了,缺氧後心跳停止。"},
        {t:"鼻導管氧氣加大",to:"cpr",fb:"通氣不足時鼻導管沒用,缺氧後心跳停止。"},
        {t:"呼救;子宮左移、100% O₂ 面罩正壓;升壓劑與 atropine;準備快速誘導插管",rescue:true,to:"s2",ck:[1,2],fb:"回到正確方向。"},
        {t:"請外科加快速度",to:"cpr",fb:"母親缺氧後心跳停止。"}
      ]},
    d3:{ story:"外科加快速度,但產婦已無反應、呼吸停止,血壓 58/30,心跳 40,SpO₂ 80%。",
      v:{hr:40,sbp:58,dbp:30,spo2:80,etco2:0,rr:0,skin:"cyan",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"繼續觀察,等胎兒取出血壓就會回來",to:"cpr",fb:"母親沒有呼吸,缺氧後心跳停止。"},
        {t:"呼救;100% O₂ 正壓通氣、子宮左移;升壓劑、atropine,必要時 epinephrine;準備插管",rescue:true,to:"s2",ck:[1,2],fb:"及時接手呼吸與循環。"},
        {t:"給 oxytocin 讓子宮收縮",to:"cpr",fb:"Oxytocin 推注會讓血壓更低,心跳停止。"},
        {t:"給 midazolam",to:"cpr",fb:"呼吸更差,心跳停止。"}
      ]},
    s2:{ story:"產婦已經無法自己維持呼吸道,面罩給氧中 SpO₂ 95%。準備插管。",
      v:{hr:96,sbp:102,dbp:58,spo2:95,etco2:30,rr:12,skin:"normal",alarm:true},
      q:"插管的做法,何者正確?",
      options:[
        {t:"不用給藥,直接拿喉頭鏡插管",to:"cpr",fb:"她還有部分意識,沒有用藥就插管造成嗆咳、嘔吐、誤吸與喉痙攣,缺氧後心跳停止。"},
        {t:"快速誘導:propofol 或 ketamine 加 succinylcholine 或 rocuronium,維持子宮左移、頭高斜坡擺位、影像喉頭鏡;插不上不反覆嘗試,改放二代聲門上呼吸道並與外科決定是否繼續",ok:true,to:"s3",ck:[3,4],fb:"正確。產科困難插管很常見;插不上就換成聲門上呼吸道,不要一直重試。"},
        {t:"插不上就一直重試,直到成功",to:"cpr",fb:"反覆嘗試讓呼吸道水腫出血,最後無法插管也無法通氣,心跳停止。"},
        {t:"等她自己恢復呼吸再說",to:"cpr",fb:"呼吸持續不足,缺氧後心跳停止。"}
      ]},
    s3:{ story:"插管成功、通氣順暢,胎兒娩出。之後子宮摸起來很軟,出血 1200 mL,血壓 82/44、心跳 124。",
      v:{hr:124,sbp:82,dbp:44,spo2:98,etco2:32,rr:12,skin:"pale",alarm:true},
      q:"接下來怎麼做?",
      options:[
        {t:"把 sevoflurane 調高,避免術中知曉",to:"cpr",fb:"高濃度揮發劑讓子宮更無力,出血更多,休克後心跳停止。"},
        {t:"只用大量晶體液補充",to:"cpr",fb:"稀釋性凝血異常讓出血止不住,休克後心跳停止。"},
        {t:"等子宮自己收縮",to:"cpr",fb:"出血持續,休克後心跳停止。"},
        {t:"Oxytocin 輸注、按摩子宮,必要時 carboprost 或 methylergonovine(無高血壓、無氣喘時);揮發劑降到 ≤0.5–1 MAC 並以靜脈藥維持;tranexamic acid;啟動輸血並補鈣",ok:true,to:"win",ck:[5],fb:"正確。全身麻醉下剖腹產,揮發劑會讓子宮收縮無力,要降濃度並積極給宮縮劑。"}
      ]}
  },
  win:"子宮收縮變好,出血控制在 1500 mL,輸 2 單位紅血球。新生兒 Apgar 7 分、9 分。",
  dead:"急救無效,宣告死亡。",
  isbar:{i:"32 歲第一胎,足月剖腹產,BMI 34。",s:"脊髓麻醉後發生高位阻斷,緊急改全身麻醉插管;術後子宮收縮無力,出血 1500 mL。",b:"無過敏;給過 phenylephrine、ephedrine、atropine;oxytocin 輸注中,給過 carboprost 與 tranexamic acid,輸紅血球 2 單位。",a:"已拔管清醒、血壓 112/66、子宮收縮好、陰道出血少量。",r:"每 15 分鐘看子宮張力與出血量;oxytocin 持續;追蹤血紅素與凝血功能;注意脊髓麻醉消退與呼吸;新生兒在嬰兒室,協助早期哺乳。"}},

{ id:"trauma", title:"機車事故:直接推進手術室", tag:"出血性休克(重大外傷)",
  patient:"35 歲男性,約 80 kg,機車事故,骨盆骨折合併腹內出血,戴著頸圈直接送手術室剖腹探查。GCS 13,已輸晶體液 1 公升。",
  checklist:["辨識出血性休克並啟動大量輸血","止血優先、限制晶體液、容許性低血壓","3 小時內給 tranexamic acid","減量誘導、頸椎徑內固定下快速誘導插管","監測並矯正低體溫、酸中毒、低血鈣","損害控制手術並送加護"],
  acls:{rhythm:"pea", fix:"大量輸血補足血容量並止血;排除張力性氣胸(針刺減壓)與心包填塞"},
  bonus:[
    {n:"PRBC",t:"加溫輸注 PRBC",fb:"出血性休克要補的是血,不是一直灌晶體液。",dv:{sbp:10,dbp:6,hr:-6}},
    {n:"FFP",t:"PRBC 與 FFP 依 1:1 給",fb:"大量出血會消耗凝血因子;及早補 FFP 才不會越輸越凝不了血。",dv:{sbp:4}},
    {n:"Platelet",t:"補充血小板",fb:"大量輸血流程要依比例補血小板。"},
    {n:"Cryoprecipitate",t:"纖維蛋白原低時補 cryoprecipitate",fb:"大量出血時纖維蛋白原最早掉到不夠,補它才能形成血塊。"},
    {n:"溫毯被",t:"溫毯被保溫、輸血加溫",fb:"低體溫、酸中毒與凝血異常會互相惡化(致死三角)。",dv:{temp:0.5}},
    {n:"IV 18G",t:"再打一條 18G 大號點滴",fb:"要大量快速輸血,至少需要兩條大號周邊靜脈。"},
    {n:"A-line",t:"放動脈導管",fb:"連續看血壓,也能抽血追血紅素、乳酸、凝血與鈣離子。"}],
  start:"s1",
  nodes:{
    s1:{ story:"進手術室時:血壓 78/40、心跳 136、SpO₂ 95%,四肢冰冷,FAST 腹部有大量積液。",
      v:{hr:136,sbp:78,dbp:40,spo2:95,etco2:28,rr:26,temp:35.6,skin:"pale",alarm:true},
      q:"最適當的處置是?",
      options:[
        {t:"再快速輸 2 公升生理食鹽水,把血壓拉到 120",to:"d1",fb:"大量晶體液會稀釋凝血因子、造成低體溫與酸中毒,血壓拉高還會讓出血更多。"},
        {t:"啟動大量輸血流程(紅血球:血漿:血小板接近 1:1:1)、限制晶體液,在止血前把收縮壓維持在約 80–90(沒有頭部外傷時);tranexamic acid 1 g;加溫輸液並請外科盡快止血",ok:true,to:"s2",ck:[0,1,2],fb:"正確。出血性休克的核心是止血與損害控制復甦。"},
        {t:"先送電腦斷層全身掃描,確定所有傷勢",to:"d2",fb:"血流動力學不穩定的病人不該離開能止血的地方。"},
        {t:"給 norepinephrine 把血壓拉高,不急著輸血",to:"d3",fb:"出血性休克缺的是血,單用升壓劑只是讓器官更缺血。"}
      ]},
    d1:{ story:"輸完 2 公升後血壓短暫 104/60,隨即又掉到 70/36。傷口與管路到處滲血,體溫 34.8°C。",
      v:{hr:142,sbp:70,dbp:36,spo2:94,etco2:24,rr:28,temp:34.8,skin:"pale",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"再輸 2 公升晶體液",to:"cpr",fb:"凝血異常更嚴重,出血止不住,心跳停止。"},
        {t:"停止晶體液,啟動大量輸血流程並給 tranexamic acid、加溫、請外科盡快止血",rescue:true,to:"s2",ck:[0,1,2],fb:"回到損害控制復甦。"},
        {t:"給 furosemide 避免水分過多",to:"cpr",fb:"在休克中利尿,心跳停止。"},
        {t:"給 norepinephrine 就好",to:"cpr",fb:"沒有補血,心跳停止。"}
      ]},
    d2:{ story:"在電腦斷層室血壓掉到 58/30,病人意識變差,GCS 9。",
      v:{hr:150,sbp:58,dbp:30,spo2:90,etco2:20,rr:30,temp:35.2,skin:"pale",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"把掃描做完再回手術室",to:"cpr",fb:"病人在掃描台上心跳停止。"},
        {t:"立刻推回手術室止血,啟動大量輸血流程並給 tranexamic acid",rescue:true,to:"s2",ck:[0,2],fb:"回到能止血的地方。"},
        {t:"在電腦斷層室插管後繼續掃描",to:"cpr",fb:"誘導讓血壓崩落,心跳停止。"},
        {t:"快速輸 3 公升晶體液",to:"cpr",fb:"凝血異常與出血更嚴重,心跳停止。"}
      ]},
    d3:{ story:"Norepinephrine 加到很高劑量,血壓 84/46,但乳酸 8 mmol/L,尿量 0,四肢發紫。",
      v:{hr:140,sbp:84,dbp:46,spo2:93,etco2:22,rr:28,temp:35.3,skin:"cyan",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"再提高 norepinephrine 劑量",to:"cpr",fb:"器官持續缺血,酸中毒惡化,心跳停止。"},
        {t:"給 bicarbonate 矯正酸中毒",to:"cpr",fb:"原因是缺血,不補血就沒用,心跳停止。"},
        {t:"啟動大量輸血流程、tranexamic acid,升壓劑逐漸減量,請外科盡快止血",rescue:true,to:"s2",ck:[0,1,2],fb:"補血才是治療。"},
        {t:"給 furosemide 讓尿出來",to:"cpr",fb:"在休克中利尿,心跳停止。"}
      ]},
    s2:{ story:"血品已經掛上、快速加溫輸注中。病人越來越躁動,需要插管開腹,頸圈還在。",
      v:{hr:128,sbp:86,dbp:48,spo2:95,etco2:30,rr:26,temp:35.4,skin:"pale",alarm:true},
      q:"誘導插管,何者正確?",
      options:[
        {t:"Propofol 2 mg/kg 標準劑量誘導",to:"cpr",fb:"休克病人用標準劑量 propofol,血壓崩落,心跳停止。"},
        {t:"誘導前先把 4 公升晶體液輸完",to:"cpr",fb:"稀釋性凝血異常讓出血更多,心跳停止。"},
        {t:"頸椎徑內固定下快速誘導:減量 ketamine 或 etomidate 加 rocuronium,誘導前血品已在輸、升壓劑備好,用影像喉頭鏡,插管後以二氧化碳波形確認",ok:true,to:"s3",ck:[3],fb:"正確。減量誘導、穩住頸椎、立刻確認管位。"},
        {t:"先不插管,請外科在局部麻醉下開腹",to:"cpr",fb:"躁動的休克病人無法在局部麻醉下開腹止血,心跳停止。"}
      ]},
    s3:{ story:"已輸紅血球 8 單位。體溫 34.6°C、離子鈣 0.82 mmol/L、pH 7.18,傷口還是一直滲血。",
      v:{hr:122,sbp:88,dbp:50,spo2:97,etco2:32,rr:14,temp:34.6,skin:"pale",alarm:true},
      q:"接下來怎麼做?",
      options:[
        {t:"繼續只輸紅血球",to:"cpr",fb:"凝血因子與血小板不足,出血止不住,心跳停止。"},
        {t:"加溫輸液與熱風毯、補 calcium chloride、依 TEG/ROTEM 補 fibrinogen 與血小板;請外科做損害控制(填塞止血、暫時關腹)後送加護",ok:true,to:"win",ck:[4,5],fb:"正確。低體溫、酸中毒、低血鈣與凝血異常會互相惡化,要同時矯正;先控制出血,確定性手術之後再做。"},
        {t:"給 bicarbonate 矯正 pH 就好",to:"cpr",fb:"只矯正數字,凝血與體溫沒處理,出血止不住,心跳停止。"},
        {t:"請外科一次完成所有確定性修補",to:"cpr",fb:"手術時間太長,低體溫、酸中毒、凝血異常惡化,心跳停止。"}
      ]}
  },
  win:"填塞止血、暫時關腹後送加護病房,體溫回到 36.4°C,乳酸下降。兩天後回手術室做確定性修補。",
  dead:"急救無效,宣告死亡。",
  isbar:{i:"35 歲男性約 80 kg,機車事故,骨盆骨折合併腹內出血。",s:"出血性休克,剖腹探查做損害控制(填塞止血、暫時關腹)。",b:"無已知過敏與病史;頸椎尚未排除損傷,頸圈在位;輸紅血球 8、血漿 8、血小板 1 單位、tranexamic acid 1 g、calcium chloride 2 g。",a:"插管鎮靜中,血壓 106/62、心跳 104、體溫 36.0°C、離子鈣 1.08、乳酸 4.2。",r:"直接轉加護病房;每小時看腹內壓、尿量與引流量;追蹤血紅素、凝血與乳酸;持續保溫;24–48 小時回手術室;頸椎影像待做。"}}
);

// ---------- 前面各題的 ISBAR 交班內容 ----------
(function(){ const IS={
mh:{i:"24 歲男性,腹腔鏡闌尾切除,全身麻醉。",s:"術中發生惡性高熱,dantrolene 共 2.5 mg/kg,手術已完成。",b:"無過敏;已停揮發劑改全靜脈麻醉;高血鉀用 calcium、insulin 加葡萄糖處理過;有動脈導管與導尿管。",a:"體溫 37.6°C、EtCO₂ 40、肌肉已放鬆、尿色變淡。",r:"每 15 分鐘看體溫、EtCO₂、尿量與尿色;追蹤血鉀、CK、肌紅蛋白;24 小時內可能復發,dantrolene 備在床邊;轉加護病房。"},
ana:{i:"45 歲女性,原排甲狀腺切除。",s:"給 cefazolin 後發生全身性過敏,手術延期。",b:"無已知過敏;給過 epinephrine 共 300 mcg 與輸液 2 公升;已抽第一次 tryptase。",a:"血壓 112/66、心跳 92、沒有哮鳴音,皮膚仍微紅。",r:"觀察雙相反應至少 24 小時並注意呼吸道水腫;1–2 小時後再抽 tryptase;病歷與手圈註記 cefazolin 過敏,轉介過敏科。"},
last:{i:"68 歲女性 50 kg,原排全膝置換。",s:"神經阻斷 0.5% bupivacaine 30 mL 後局部麻醉藥中毒(抽搐、寬 QRS),手術延期。",b:"已用 benzodiazepine 止抽搐;20% 脂肪乳劑推注後持續輸注中。",a:"意識清楚、心跳 78、QRS 已變窄、血壓 112/64。",r:"脂肪乳劑持續到循環穩定後至少 10 分鐘;監測心律與神經學 4–6 小時以上;再抽搐或心律不整立刻通知;注意脂肪乳劑總量上限。"},
lsp:{i:"5 歲男童 20 kg,扁桃腺切除。",s:"拔管後喉痙攣,給 propofol 與 succinylcholine 加 atropine 後緩解。",b:"無過敏;術中給過 fentanyl;已經面罩給氧。",a:"清醒、SpO₂ 99%、呼吸平順,沒有粉紅色泡沫痰。",r:"觀察負壓性肺水腫與術後出血(吐血、頻繁吞嚥);監測血氧;止痛與止吐;出血立刻通知。"},
turp:{i:"72 歲男性,經尿道攝護腺刮除,脊髓麻醉 T10。",s:"灌洗液吸收造成低血鈉(最低 114)與意識混亂,手術提前結束。",b:"高血壓;1.5% glycine 灌洗約 70 分鐘;給過 3% 食鹽水與 furosemide。",a:"意識改善,血鈉 119、血壓 150/88、心跳 64。",r:"每 2–4 小時追蹤血鈉,24 小時內上升不超過 8–10 mEq/L;記錄輸入輸出;注意抽搐、意識變化與膀胱出血;評估脊髓麻醉消退。"},
bcis:{i:"84 歲女性,骨水泥髖部半關節置換,全身麻醉。",s:"放入股骨柄時發生骨水泥植入症候群,低血氧與低血壓。",b:"心臟衰竭病史;給過 epinephrine 與輸液,norepinephrine 輸注中;有動脈導管。",a:"動脈壓 108/60、SpO₂ 96%(FiO₂ 50%)、超音波右心室仍擴大。",r:"轉加護病房;維持平均動脈壓 ≥65、避免低血氧與高碳酸;追蹤 troponin 與血液氣體;注意譫妄。"},
ekg:{i:"66 歲男性,開腹大腸切除,全身麻醉。",s:"術中兩次 ST 段下降:一次心搏過速、一次出血後貧血低血壓。",b:"高血壓、糖尿病、三年前冠狀動脈支架(aspirin 未停);給過 esmolol,輸紅血球 2 單位。",a:"血壓 118/68、心跳 78、ST 段回到基準線,血紅素 9.1。",r:"術後追蹤 troponin 與 12 導程心電圖;持續心電圖監測;維持血紅素與血壓;止痛避免心搏過速;會診心臟科。"}};
  window.ISLAND_SCENARIOS.forEach(c=>{ if(!c.isbar&&IS[c.id]) c.isbar=IS[c.id]; }); })();

// ---------- 第四批情境:無法插管無法給氧、兒童支氣管痙攣、靜脈空氣栓塞 ----------
window.ISLAND_SCENARIOS.push(
{ id:"cico", title:"甲狀腺腫切除:誘導後插不上管", tag:"無法插管、無法給氧(CICO)",
  patient:"52 歲女性,BMI 38,巨大甲狀腺腫壓迫氣管,睡眠呼吸中止。術前評估 Mallampati III、頸部活動受限。已給 propofol 與 rocuronium。",
  checklist:["插管失敗後限制嘗試次數並呼救","改用聲門上呼吸道與雙人面罩通氣維持氧合","宣告「無法插管、無法給氧」","用 sugammadex 16 mg/kg 讓病人恢復自主呼吸是選項之一,但不能延誤外科呼吸道","執行頸前緊急外科呼吸道(手術刀環甲膜切開)","術後檢討並記錄困難呼吸道"],
  acls:{rhythm:"pea", fix:"建立頸前外科呼吸道(手術刀環甲膜切開)並給 100% O₂"},
  bonus:[
    {n:"Bougie",t:"環甲膜切開時沿著刀子放入 bougie",fb:"手術刀環甲膜切開的步驟:橫切、轉刀、沿刀放 bougie、套入有氣囊的管子。"},
    {n:"Endo 6.0",t:"備好 6.0 號有氣囊氣管內管",fb:"環甲膜切開後套入 6.0 號有氣囊管,才能有效通氣並保護呼吸道。"},
    {n:"LMA",t:"備好二代聲門上呼吸道",fb:"插管失敗後先用聲門上呼吸道維持氧合。",dv:{spo2:2}},
    {n:"CRNA 學姊",t:"請學姊來幫忙雙人面罩通氣",fb:"兩個人通氣,一個壓面罩、一個擠袋子,效果比一個人好。",dv:{spo2:2}}],
  start:"s1",
  nodes:{
    s1:{ story:"影像喉頭鏡試了兩次都看不到聲門。SpO₂ 從 100% 慢慢掉到 91%。",
      v:{hr:104,sbp:132,dbp:80,spo2:91,etco2:0,rr:0,skin:"normal",alarm:true},
      q:"最適當的下一步是?",
      options:[
        {t:"再試第三、第四次,這次一定插得上",to:"d1",fb:"反覆嘗試讓呼吸道水腫出血,後面的面罩與聲門上呼吸道都會更困難。"},
        {t:"停止插管、call help(呼救);放二代聲門上呼吸道,不行就雙人面罩加口咽呼吸道給 100% O₂;同時請人準備頸前呼吸道器械",ok:true,to:"s2",ck:[0,1],fb:"正確。插管最多三次(加上一次較有經驗者),失敗就轉為維持氧合,並預先準備下一步。"},
        {t:"等 rocuronium 退了讓病人自己醒來",to:"d2",fb:"Rocuronium 要很久才會退,病人撐不到那時候。"},
        {t:"改用盲目經鼻插管",to:"d1",fb:"盲目嘗試在困難呼吸道上很容易造成出血,浪費時間。"}
      ]},
    d1:{ story:"嘴裡都是血,呼吸道明顯水腫。SpO₂ 82%,心跳 118。",
      v:{hr:118,sbp:140,dbp:86,spo2:82,etco2:0,rr:0,skin:"cyan",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"再試一次影像喉頭鏡",to:"cpr",fb:"再嘗試只是更多出血,缺氧後心搏過緩,心跳停止。"},
        {t:"抽吸乾淨,call help(呼救);放二代聲門上呼吸道或雙人面罩給 100% O₂,準備頸前呼吸道",rescue:true,to:"s2",ck:[0,1],fb:"轉為維持氧合。"},
        {t:"給 succinylcholine 讓肌肉更鬆",to:"cpr",fb:"肌肉已經完全放鬆,問題不在肌肉。缺氧後心跳停止。"},
        {t:"降低 FiO₂ 避免吸收性肺塌陷",to:"cpr",fb:"缺氧時要給 100% O₂,心跳停止。"}
      ]},
    d2:{ story:"等了 3 分鐘,SpO₂ 74%、心跳 56,病人沒有任何自主呼吸。",
      v:{hr:56,sbp:96,dbp:54,spo2:74,etco2:0,rr:0,skin:"cyan",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"call help(呼救);聲門上呼吸道或雙人面罩給 100% O₂,準備頸前呼吸道",rescue:true,to:"s2",ck:[0,1],fb:"回到維持氧合。"},
        {t:"給 atropine 處理心搏過緩就好",to:"cpr",fb:"心跳慢是缺氧造成的,沒給氧,心跳停止。"},
        {t:"繼續等",to:"cpr",fb:"缺氧後心跳停止。"},
        {t:"給 neostigmine 拮抗 rocuronium",to:"cpr",fb:"深度阻斷時 neostigmine 無效,還會讓心跳更慢,心跳停止。"}
      ]},
    s2:{ story:"聲門上呼吸道放不好、漏氣嚴重,雙人面罩加口咽呼吸道也幾乎沒有胸部起伏、沒有 EtCO₂ 波形。SpO₂ 78% 持續下降。",
      v:{hr:96,sbp:118,dbp:70,spo2:78,etco2:0,rr:0,skin:"cyan",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"宣告「無法插管、無法給氧」;頸部伸展,手術刀環甲膜切開:橫切、轉刀、沿刀放入探條、套入 6.0 有氣囊管,接上通氣並以 EtCO₂ 確認",ok:true,to:"win",ck:[2,4],fb:"正確。插管、聲門上呼吸道、面罩三條路都失敗,就要立刻做頸前外科呼吸道,不能再等。"},
        {t:"先給 sugammadex 16 mg/kg,等病人自己呼吸,不做其他準備",to:"cpr",fb:"Sugammadex 可以讓肌肉恢復,但巨大甲狀腺腫壓迫的呼吸道不一定能自己通;一味等待而沒有準備頸前呼吸道,病人心跳停止。"},
        {t:"再試一次插管",to:"cpr",fb:"已經沒有時間了,病人心跳停止。"},
        {t:"等外科醫師來做正式氣切",to:"cpr",fb:"正式氣切花太久,巨大甲狀腺腫更難。病人心跳停止。"}
      ]}
  },
  win:"環甲膜切開後 EtCO₂ 出現,SpO₂ 回到 97%。之後由外科改做正式氣切,病人轉加護病房。",
  dead:"急救無效,宣告死亡。",
  isbar:{i:"52 歲女性,BMI 38,巨大甲狀腺腫。",s:"誘導後無法插管、無法給氧,緊急手術刀環甲膜切開,之後外科改正式氣切。",b:"睡眠呼吸中止;無過敏;給過 propofol、rocuronium;最低 SpO₂ 74%。",a:"氣切管在位、EtCO₂ 波形正常、SpO₂ 97%、鎮靜中。",r:"轉加護病房;氣切管固定與抽痰、床邊備好替換管與擴張器;評估缺氧後神經學;病歷與手圈註記困難呼吸道並告知病人。"}},

{ id:"dia", title:"腹腔鏡膽囊切除:插管兩次都沒成功", tag:"未預期的困難插管(可以通氣、無法插管),以 sugammadex 喚醒病人",
  patient:"38 歲女性,70 kg,BMI 34,ASA II,腹腔鏡膽囊切除。術前呼吸道評估沒有特別發現。Propofol 150 mg、fentanyl 100 mcg、rocuronium 70 mg(1 mg/kg)誘導後 3 分鐘。",
  checklist:["插管失敗後限制嘗試次數、及早呼救","改用聲門上呼吸道或雙人面罩維持氧合","能通氣但插不上管、又是常規手術:決定喚醒病人、延後手術","深度 rocuronium 阻斷時立即給 sugammadex 16 mg/kg","知道深度阻斷時 neostigmine 無效","手邊沒有 sugammadex 時,請耳鼻喉科支援並準備頸前呼吸道","病人醒後記錄困難呼吸道,下次規劃清醒纖維支氣管鏡插管"],
  acls:{rhythm:"pea", fix:"建立確定的呼吸道(耳鼻喉科插管或環甲膜切開)並給 100% O₂"},
  bonus:[
    {n:"Bougie",t:"插管時改用 bougie 輔助",fb:"看不到聲門時,bougie 可以提高插管成功率。"},
    {n:"LMA",t:"放二代聲門上呼吸道",fb:"插管失敗後先用聲門上呼吸道維持氧合,也可以接著用來喚醒病人。",dv:{spo2:3}},
    {n:"NMT",t:"接上肌肉鬆弛監測",fb:"確認拮抗後 TOF 比值到 0.9 以上,病人才有足夠的肌肉力量自己呼吸。"},
    {n:"麻醉主治醫師",t:"請麻醉主治醫師來幫忙",fb:"困難呼吸道要及早呼救,多一個有經驗的人一起處理。",dv:{spo2:2}}],
  start:"s1",
  nodes:{
    s1:{ story:"直接喉頭鏡第一次只看得到會厭;第二次換影像喉頭鏡加 bougie,還是送不進去。SpO₂ 從 100% 慢慢掉到 92%。",
      v:{hr:98,sbp:128,dbp:76,spo2:92,etco2:0,rr:0,skin:"normal",alarm:true},
      q:"最適當的下一步是?",
      options:[
        {t:"停止插管、call help(呼救);放二代聲門上呼吸道,不行就雙人面罩加口咽呼吸道給 100% O₂",ok:true,to:"s2",ck:[0,1],fb:"正確。插管嘗試要有次數限制,失敗就把重點放回氧合,同時找人來幫忙。"},
        {t:"換更大的喉頭鏡葉片,再試第三、第四次",to:"d1",fb:"反覆嘗試讓呼吸道水腫出血,之後面罩與聲門上呼吸道都會更困難。"},
        {t:"等 rocuronium 自己退,病人就會自己呼吸",to:"d2",fb:"1 mg/kg 的 rocuronium 要四十分鐘以上才會恢復,病人撐不到那時候。"},
        {t:"改用盲目經鼻插管",to:"d1",fb:"盲目嘗試在困難呼吸道上很容易出血,浪費寶貴的時間。"}
      ]},
    d1:{ story:"嘴裡都是血,舌頭和會厭腫起來。SpO₂ 84%,心跳 116。",
      v:{hr:116,sbp:138,dbp:84,spo2:84,etco2:0,rr:0,skin:"cyan",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"抽吸乾淨、call help(呼救);放二代聲門上呼吸道或雙人面罩給 100% O₂",rescue:true,to:"s2",ck:[0,1],fb:"轉為維持氧合。"},
        {t:"再試一次影像喉頭鏡",to:"cpr",fb:"再試只會更多出血。缺氧後心跳越來越慢,心跳停止。"},
        {t:"給 succinylcholine 讓肌肉更鬆",to:"cpr",fb:"肌肉已經完全放鬆,問題不在肌肉。缺氧後心跳停止。"},
        {t:"把 FiO₂ 調低,避免吸收性肺塌陷",to:"cpr",fb:"缺氧時要給 100% O₂。病人心跳停止。"}
      ]},
    d2:{ story:"等了 3 分鐘,SpO₂ 76%、心跳 58,病人沒有任何自主呼吸。",
      v:{hr:58,sbp:98,dbp:56,spo2:76,etco2:0,rr:0,skin:"cyan",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"call help(呼救);聲門上呼吸道或雙人面罩加口咽呼吸道給 100% O₂",rescue:true,to:"s2",ck:[0,1],fb:"回到維持氧合。"},
        {t:"給 atropine 處理心跳慢就好",to:"cpr",fb:"心跳慢是缺氧造成的,沒有給氧,心跳停止。"},
        {t:"繼續等肌肉鬆弛劑退掉",to:"cpr",fb:"缺氧後心跳停止。"},
        {t:"給 neostigmine 拮抗 rocuronium",to:"cpr",fb:"深度阻斷時 neostigmine 沒有效果,還會讓心跳更慢。病人心跳停止。"}
      ]},
    s2:{ story:"麻醉主治醫師和學姊進來幫忙。二代聲門上呼吸道放好了,有 EtCO₂ 波形、胸部有起伏,但漏氣明顯,SpO₂ 只回到 90%。這是常規手術;肌肉鬆弛監測 TOF 0、PTC 2。",
      v:{hr:92,sbp:120,dbp:72,spo2:90,etco2:32,rr:12,skin:"normal",alarm:true},
      q:"接下來的計畫是?",
      use:[{n:"Sugammadex",t:"拿出 Sugammadex:16 mg/kg(約 1120 mg)靜脈推注,繼續用聲門上呼吸道給 100% O₂,讓病人醒過來、手術延後",ok:true,to:"s3",ck:[2,3,4],fb:"正確。能通氣但插不上管、又是常規手術,最安全的是讓病人醒過來。深度 rocuronium 阻斷只有 sugammadex 16 mg/kg 能在幾分鐘內拮抗。"}],
      options:[
        {t:"call help:請耳鼻喉科醫師立刻帶硬式喉鏡來支援;維持聲門上呼吸道雙人通氣 100% O₂,先摸好、標記環甲膜,備好頸前呼吸道器械",ok:true,to:"e1",ck:[2,5],fb:"手邊沒有 sugammadex 時,不能只是等。維持氧合、請耳鼻喉科支援,並先準備好頸前呼吸道。"},
        {t:"給 neostigmine 0.05 mg/kg 加 glycopyrrolate 拮抗",to:"n1",fb:"TOF 0 的深度阻斷,neostigmine 沒有效果(它有天花板效應),反而延誤真正的處置。"},
        {t:"既然能通氣,就請外科開始手術,用聲門上呼吸道撐完全程",to:"d3",fb:"漏氣、SpO₂ 只有 90%,打上氣腹後通氣會更差,胃脹氣與吸入的風險也更高。"},
        {t:"拔掉聲門上呼吸道,再插一次管",to:"d1",fb:"好不容易建立的通氣又放棄了,第三次嘗試讓呼吸道出血水腫。"}
      ]},
    n1:{ story:"給完 neostigmine 5 分鐘,TOF 還是 0,病人沒有自主呼吸,心跳掉到 52、口水變多。聲門上呼吸道漏氣越來越大,SpO₂ 85%。",
      v:{hr:52,sbp:100,dbp:58,spo2:85,etco2:28,rr:12,skin:"pale",alarm:true},
      q:"現在該怎麼做?",
      use:[{n:"Sugammadex",t:"拿出 Sugammadex:16 mg/kg 靜脈推注,繼續 100% O₂ 通氣,讓病人醒過來",rescue:true,to:"s3",ck:[2,3],fb:"晚了一點,但給過 neostigmine 之後,sugammadex 一樣能拮抗 rocuronium。"}],
      options:[
        {t:"call help:請耳鼻喉科醫師立刻來支援、準備頸前呼吸道;atropine 處理心跳慢,維持雙人通氣 100% O₂",rescue:true,to:"e1",ck:[5],fb:"把方向拉回來:維持氧合、處理心跳慢、找能建立確定呼吸道的人。"},
        {t:"再追加一劑 neostigmine",to:"cpr",fb:"Neostigmine 有天花板效應,加量只會帶來更多副作用(心跳更慢、分泌物、支氣管收縮)。病人心跳停止。"},
        {t:"繼續等 neostigmine 起作用",to:"cpr",fb:"缺氧越來越嚴重,病人心跳停止。"},
        {t:"拔掉聲門上呼吸道,再插一次管",to:"cpr",fb:"失去了唯一的通氣方式,病人心跳停止。"}
      ]},
    d3:{ story:"氣腹 12 mmHg 一打上去,聲門上呼吸道大量漏氣,EtCO₂ 波形越來越小,SpO₂ 80%,胃部明顯脹氣。",
      v:{hr:118,sbp:112,dbp:68,spo2:80,etco2:20,rr:12,skin:"cyan",alarm:true},
      q:"現在該怎麼做?",
      use:[{n:"Sugammadex",t:"請外科放掉氣腹、停止手術;拿出 Sugammadex 16 mg/kg 靜脈推注,100% O₂ 通氣讓病人醒過來",rescue:true,to:"s3",ck:[2,3],fb:"及時停手:放掉氣腹、拮抗肌肉鬆弛劑、讓病人醒過來。"}],
      options:[
        {t:"請外科放掉氣腹、停止手術;call help:請耳鼻喉科支援並準備頸前呼吸道,雙人通氣 100% O₂",rescue:true,to:"e1",ck:[2,5],fb:"及時停手,把重點放回呼吸道。"},
        {t:"把吸氣壓力調到 40 cmH₂O 硬撐",to:"cpr",fb:"高壓只會讓更多氣體灌進胃,增加嘔吐吸入。缺氧後心跳停止。"},
        {t:"給 neostigmine 拮抗",to:"cpr",fb:"深度阻斷時 neostigmine 無效,缺氧後心跳停止。"},
        {t:"拔掉聲門上呼吸道,再插一次管",to:"cpr",fb:"失去了唯一的通氣方式,病人心跳停止。"}
      ]},
    e1:{ story:"耳鼻喉科醫師帶著硬式喉鏡趕到。病人仍靠聲門上呼吸道雙人通氣,SpO₂ 88%。",
      v:{hr:104,sbp:118,dbp:70,spo2:88,etco2:30,rr:12,skin:"pale",alarm:true},
      q:"麻醉團隊要怎麼配合?",
      options:[
        {t:"持續 100% O₂ 與聲門上呼吸道通氣;讓耳鼻喉科用硬式喉鏡插管,失敗就立刻環甲膜切開;用 EtCO₂ 波形確認管子位置",ok:true,to:"e2",ck:[5],fb:"正確。分工清楚:麻醉團隊顧氧合,耳鼻喉科建立確定的呼吸道,並先講好失敗時的下一步。"},
        {t:"請耳鼻喉科先在旁邊等,麻醉科自己再插兩次",to:"cpr",fb:"再試只會更多出血水腫,缺氧後心跳停止。"},
        {t:"先拔掉聲門上呼吸道,讓耳鼻喉科看得清楚一點",to:"cpr",fb:"失去了唯一的通氣方式,病人心跳停止。"},
        {t:"既然耳鼻喉科來了,就請外科先開始手術",to:"d3",fb:"呼吸道還沒處理好就開始手術,只會讓情況更糟。"}
      ]},
    e2:{ story:"耳鼻喉科用硬式喉鏡把 6.5 號氣管內管放進去,EtCO₂ 波形出現,SpO₂ 回到 97%。",
      v:{hr:90,sbp:124,dbp:74,spo2:97,etco2:38,rr:12,skin:"normal",alarm:false},
      q:"接下來?",
      options:[
        {t:"和外科、耳鼻喉科討論:呼吸道已確保,可以完成手術或延後;病歷與手圈註記困難呼吸道,術後由有經驗者在備好器械下拔管",ok:true,to:"win",ck:[6],fb:"正確。困難呼吸道一定要記錄、告知病人,拔管也要有計畫。"},
        {t:"手術結束病人一動就拔管,送回一般病房",to:"dead",fb:"困難呼吸道沒有拔管計畫。病人在病房上呼吸道水腫阻塞,沒有人能及時插管,隔天死亡。"},
        {t:"不用記錄,反正已經插上了",to:"dead",fb:"沒有記錄困難呼吸道,術後拔管前沒有準備,病人拔管後呼吸道阻塞,救不回來。"},
        {t:"把氣管內管換成小一號的再手術",to:"cpr",fb:"困難呼吸道上換管等於重新冒一次險。換管失敗,病人缺氧心跳停止。"}
      ]},
    s3:{ story:"推完 sugammadex 2 分鐘,TOF 回到 4 次、比值 0.9 以上,病人開始自己呼吸、眼睛張開,SpO₂ 回到 98%。",
      v:{hr:88,sbp:132,dbp:80,spo2:98,etco2:38,rr:14,skin:"normal",alarm:false},
      q:"病人醒了,接下來?",
      options:[
        {t:"等病人完全清醒、能聽指令再移除聲門上呼吸道;向外科說明延後手術;病歷與手圈註記困難呼吸道,下次規劃清醒纖維支氣管鏡插管",ok:true,to:"win",ck:[6],fb:"正確。喚醒病人之後,困難呼吸道要記錄並告知病人,下次改用清醒插管的計畫。"},
        {t:"病人醒了就再誘導一次、重新插管,把手術做完",to:"d1",fb:"同樣的困難呼吸道還在,又回到插不上管的處境,這次呼吸道出血水腫。"},
        {t:"病人一開始自己呼吸就拔掉聲門上呼吸道,推回病房",to:"s3x",fb:"病人還沒完全清醒就拔除,上呼吸道很容易阻塞。"},
        {t:"再給一劑 rocuronium,讓外科先開始",to:"d2",fb:"Sugammadex 剛拮抗完,又回到深度阻斷、插不上管的處境。"}
      ]},
    s3x:{ story:"拔掉後病人打鼾、胸腹反向起伏,SpO₂ 掉到 86%,叫不太醒。",
      v:{hr:104,sbp:138,dbp:82,spo2:86,etco2:0,rr:6,skin:"pale",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"抬下顎、放口咽呼吸道、面罩 100% O₂ 正壓,等病人完全清醒;註記困難呼吸道",rescue:true,to:"win",ck:[6],fb:"打開呼吸道、給氧,等病人完全清醒。"},
        {t:"給 naloxone 就直接推走",to:"cpr",fb:"沒有先打開呼吸道,缺氧後心跳停止。"},
        {t:"再插一次管",to:"cpr",fb:"又回到插不上管的處境,缺氧後心跳停止。"},
        {t:"讓病人側躺,先回去準備下一台",to:"cpr",fb:"沒有人在旁邊處理阻塞,病人缺氧心跳停止。"}
      ]}
  },
  win:"病人平安,呼吸道已確保或已安全醒來。手術延後,並規劃下次清醒纖維支氣管鏡插管。",
  dead:"急救無效,宣告死亡。",
  isbar:{i:"38 歲女性,70 kg,BMI 34,預定腹腔鏡膽囊切除。",s:"誘導後未預期困難插管,聲門上呼吸道可以通氣;以 sugammadex 拮抗後喚醒(或由耳鼻喉科建立確定呼吸道),手術延後。",b:"無特殊病史、無過敏;給過 propofol、fentanyl、rocuronium、sugammadex;最低 SpO₂ 約 84%。",a:"清醒、能聽指令、自主呼吸、SpO₂ 98%,喉嚨痛、口內少量出血。",r:"半坐臥、氧氣面罩;觀察呼吸音、喘鳴與出血;病歷與手圈註記困難呼吸道並告知病人,下次規劃清醒纖維支氣管鏡插管。"}},
{ id:"bronch", title:"疝氣修補:插管後擠不進氣", tag:"支氣管痙攣(兒童氣喘)",
  patient:"8 歲男童,25 kg,氣喘(上週剛感冒、最近夜咳),腹股溝疝氣修補。Sevoflurane 吸入誘導後插管。",
  checklist:["鑑別氣道壓上升的原因(管路阻塞、位置錯誤、支氣管痙攣、氣胸)","100% O₂、加深揮發性麻醉劑","吸入型 β2 致效劑經管路給予","調整呼吸器:延長吐氣時間、避免空氣滯留","頑固時給 epinephrine 或 magnesium 等","術後觀察並與家屬討論延後擇期手術"],
  acls:{rhythm:"pea", peds:true, kg:25, fix:"處理嚴重支氣管痙攣與空氣滯留:斷開呼吸器讓氣體排出、壓胸協助吐氣,epinephrine"},
  bonus:[
    {n:"Sevoflurane",t:"加深 sevoflurane",fb:"Sevoflurane 本身就有支氣管擴張的效果;麻醉太淺時刺激呼吸道也會誘發痙攣。",dv:{spo2:3,etco2:-3}},
    {n:"Ketamine",t:"ketamine 1 mg/kg",fb:"Ketamine 會釋放兒茶酚胺,讓支氣管擴張。",dv:{spo2:2}},
    {n:"Dexamethasone",t:"給類固醇",fb:"類固醇要幾個小時才有效,用來減少之後的呼吸道發炎,不能取代立即的支氣管擴張劑。"},
    {n:"麻醉主治醫師",t:"請麻醉主治醫師來幫忙",fb:"嚴重支氣管痙攣時,一個人擠袋子、一個人給藥,比較不會手忙腳亂。"}],
  start:"s1",
  nodes:{
    s1:{ story:"插管後擠氣囊很硬,尖峰氣道壓 42 cmH₂O,EtCO₂ 波形呈鯊魚鰭狀且越來越低,雙側都有哮鳴音、呼吸音對稱。SpO₂ 91%。",
      v:{hr:148,sbp:98,dbp:56,spo2:91,etco2:52,rr:20,skin:"normal",alarm:true},
      q:"最適當的處置是?",
      options:[
        {t:"100% O₂、手動通氣感受阻力;抽吸管路排除阻塞、確認管深度;加深 sevoflurane;經管路給吸入型 salbutamol",ok:true,to:"s2",ck:[0,1,2],fb:"正確。雙側哮鳴、鯊魚鰭波形,符合支氣管痙攣;同時排除管路阻塞與位置錯誤。"},
        {t:"給 neostigmine 拮抗,準備叫醒",to:"d1",fb:"Neostigmine 會增加支氣管分泌物與收縮,讓痙攣更嚴重。"},
        {t:"把呼吸次數調到 30 次/分,把 CO₂ 洗出去",to:"d2",fb:"支氣管痙攣時吐氣不完全,呼吸太快會造成空氣滯留、內生性 PEEP,血壓會掉。"},
        {t:"給 propranolol 讓心跳慢下來",to:"d1",fb:"非選擇性 β-blocker 會讓支氣管痙攣更嚴重。"}
      ]},
    d1:{ story:"氣道壓 50 cmH₂O,幾乎擠不進氣,EtCO₂ 只剩一點點,SpO₂ 82%。",
      v:{hr:156,sbp:84,dbp:46,spo2:82,etco2:18,rr:20,skin:"cyan",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"100% O₂、加深 sevoflurane、經管路給 salbutamol;仍無效就 epinephrine 小劑量靜脈",rescue:true,to:"s2",ck:[1,2],fb:"回到正確方向。"},
        {t:"再給一次 neostigmine",to:"cpr",fb:"痙攣更嚴重,缺氧後心跳停止。"},
        {t:"拔管改面罩",to:"cpr",fb:"面罩通氣更擠不進氣,缺氧後心跳停止。"},
        {t:"給 morphine 止痛",to:"cpr",fb:"Morphine 會釋放組織胺,讓痙攣更嚴重,心跳停止。"}
      ]},
    d2:{ story:"血壓掉到 62/30,胸廓越來越鼓,EtCO₂ 波形變平。",
      v:{hr:164,sbp:62,dbp:30,spo2:84,etco2:14,rr:30,skin:"pale",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"再調高呼吸次數",to:"cpr",fb:"空氣滯留更嚴重,靜脈回流被擋住,心跳停止。"},
        {t:"給大量輸液拉血壓",to:"cpr",fb:"原因是胸內壓太高,輸液擋不住,心跳停止。"},
        {t:"把呼吸器斷開讓氣體排出、輕壓胸部協助吐氣;改成慢呼吸次數、長吐氣時間;加深麻醉並給 salbutamol",rescue:true,to:"s2",ck:[3],fb:"先把滯留的氣體放出來,血壓就會回來。"},
        {t:"給 phenylephrine 就好",to:"cpr",fb:"沒有處理空氣滯留,心跳停止。"}
      ]},
    s2:{ story:"處理後氣道壓降到 32 cmH₂O,SpO₂ 94%,但仍有明顯哮鳴音,EtCO₂ 波形斜率還是很陡。",
      v:{hr:140,sbp:96,dbp:56,spo2:94,etco2:48,rr:14,skin:"normal",alarm:true},
      q:"接下來怎麼做?",
      options:[
        {t:"呼吸器改為較小潮氣量、慢呼吸次數、長吐氣時間,容許輕度高碳酸;持續 salbutamol;仍頑固就 epinephrine 小劑量靜脈或 magnesium sulfate 40 mg/kg 慢滴、類固醇;術後與家屬討論感冒緩解後再安排",ok:true,to:"win",ck:[3,4,5],fb:"正確。兒童近期上呼吸道感染加上控制不佳的氣喘,是支氣管痙攣的高危險因子。"},
        {t:"加大潮氣量把肺撐開",to:"cpr",fb:"空氣滯留與氣壓傷,造成氣胸,心跳停止。"},
        {t:"已經改善了,馬上深麻醉下拔管",to:"cpr",fb:"痙攣還沒解除,拔管後缺氧,心跳停止。"},
        {t:"給 desflurane 取代 sevoflurane",to:"cpr",fb:"Desflurane 刺激呼吸道,讓痙攣更嚴重,心跳停止。"}
      ]}
  },
  win:"30 分鐘後哮鳴音消失,手術延期。孩子清醒拔管,在恢復室吸入治療後轉兒科病房觀察。",
  dead:"急救無效,宣告死亡。",
  isbar:{i:"8 歲男童 25 kg,原排腹股溝疝氣修補。",s:"插管後嚴重支氣管痙攣,處理後緩解,手術延期。",b:"氣喘、上週感冒;sevoflurane 誘導;給過 salbutamol、magnesium sulfate 與類固醇。",a:"已清醒拔管、SpO₂ 96%(面罩 6 L/min)、輕度哮鳴、呼吸稍快。",r:"每 15 分鐘評估呼吸次數、呼吸功與血氧;依醫囑吸入治療;呼吸功增加或 SpO₂ <92% 立刻通知;轉兒科病房,感冒緩解 2–4 週後再安排手術。"}},

{ id:"tbi", title:"沒戴安全帽的機車騎士:緊急開刀", tag:"頭部外傷急性硬腦膜上血腫合併出血:維持腦灌流、保護大腦",
  patient:"28 歲男性,約 70 kg,騎機車撞電線桿,沒戴安全帽。急診時 GCS 從 12 掉到 7、已插管;右側瞳孔放大。頭皮撕裂傷一直滲血,左側股骨骨折。直接推進手術室。",
  checklist:["避免低血壓:收縮壓維持 ≥110 mmHg,腦灌流壓 60–70 mmHg","避免缺氧:SpO₂ ≥94%","正常通氣(PaCO₂ 35–40);只有在腦疝脫徵象時短暫過度換氣","降顱內壓:頭抬高 30°、頸部正中不壓迫頸靜脈、高張食鹽水或 mannitol","出血時加溫輸注血品(PRBC 與 FFP 依比例),不用含葡萄糖或低張的溶液","避免體溫過高與高血糖","術後帶管送神經加護病房"],
  acls:{rhythm:"pea", fix:"大量輸血補足血容量、維持氧合與通氣,請外科盡快止血減壓"},
  bonus:[
    {n:"溫毯被",t:"溫毯被改吹室溫或冷風,避免體溫過高",fb:"發燒會增加腦部代謝與顱內壓,讓腦傷更嚴重;頭部外傷要積極避免體溫過高(目標正常體溫)。",dv:{temp:-0.6}},
    {n:"PRBC",t:"加溫輸注 PRBC",fb:"失血造成的低血壓會讓腦灌流不足;要補的是血,不是一直灌晶體液。",dv:{sbp:10,dbp:6,hr:-6}},
    {n:"FFP",t:"PRBC 與 FFP 依比例給",fb:"腦外傷很容易合併凝血異常,讓顱內出血更多。",dv:{sbp:4}},
    {n:"A-line",t:"放動脈導管",fb:"連續看血壓、算腦灌流壓,也能抽血追 PaCO₂、血鈉、血糖與血紅素。"},
    {n:"Norepinephrine",t:"norepinephrine 持續輸注維持血壓",fb:"收縮壓要維持在 110 mmHg 以上,腦灌流壓才不會掉。",dv:{sbp:12,dbp:6}},
    {n:"IV 18G",t:"再打一條 18G 大號點滴",fb:"出血要快速輸血,至少需要兩條大號周邊靜脈。"},
    {n:"Foley",t:"放尿管看尿量",fb:"給 mannitol 後會大量利尿,要看尿量並補足,避免低血容。"}],
  start:"s1",
  nodes:{
    s1:{ story:"病人推進手術室,外科正在擺位準備開顱。血壓 172/96,心跳 54,呼吸器上 EtCO₂ 44 mmHg,右側瞳孔 6 mm、對光反射消失。",
      v:{hr:54,sbp:172,dbp:96,spo2:96,etco2:44,rr:12,temp:37.2,skin:"normal",alarm:true},
      q:"此時最適當的處置是?",
      options:[
        {t:"頭抬高 30°、頸部正中不壓迫頸靜脈;暫時調高通氣讓 EtCO₂ 約 30–35;給高張食鹽水或 mannitol;維持靜脈麻醉,不急著把血壓降下來",ok:true,to:"s2",ck:[1,2,3],fb:"正確。血壓高、心跳慢是顱內壓升高時身體在維持腦灌流;要處理的是顱內壓,等外科減壓。"},
        {t:"血壓 172 太高,用 nicardipine 把收縮壓降到 120 以下",to:"d1",fb:"這時的高血壓是身體為了把血打進腦子的代償。把血壓壓下來,腦灌流壓跟著掉,腦缺血加重。"},
        {t:"心跳 54 太慢,先給 atropine 再觀察",to:"d2",fb:"心跳慢是顱內壓升高造成的;只處理心跳,沒有降顱內壓。"},
        {t:"改成 sevoflurane 2 MAC 加深麻醉讓血壓下來",to:"d2",fb:"高濃度揮發性麻醉劑會擴張腦血管、增加腦血流,顱內壓更高。"}
      ]},
    d1:{ story:"給了降壓藥後,收縮壓掉到 92/50,心跳 64。右側瞳孔 7 mm,左側也開始變大。",
      v:{hr:64,sbp:92,dbp:50,spo2:96,etco2:42,rr:12,temp:37.2,skin:"pale",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"停掉降壓藥,用 phenylephrine 或 norepinephrine 把收縮壓拉回 110 以上;頭抬高 30°、高張食鹽水或 mannitol,請外科盡快減壓",rescue:true,to:"s2",ck:[0,3],fb:"把腦灌流壓拉回來,同時降顱內壓。"},
        {t:"再加一點降壓藥,怕血腫變大",to:"cpr",fb:"腦灌流壓崩潰,腦幹缺血,病人心跳停止。"},
        {t:"快速輸 5% dextrose 2 公升把血壓拉起來",to:"cpr",fb:"低張、含糖的溶液會加重腦水腫與高血糖。顱內壓急升、腦疝脫,病人心跳停止。"},
        {t:"等外科打開頭骨再說",to:"cpr",fb:"低血壓持續,腦疝脫後病人心跳停止。"}
      ]},
    d2:{ story:"右側瞳孔 7 mm、左側也放大,血壓 194/104,心跳 44,EtCO₂ 46 mmHg。",
      v:{hr:44,sbp:194,dbp:104,spo2:95,etco2:46,rr:12,temp:37.3,skin:"normal",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"短暫過度換氣讓 EtCO₂ 約 30–35、高張食鹽水或 mannitol、頭抬高 30°、改回靜脈麻醉,請外科盡快減壓",rescue:true,to:"s2",ck:[2,3],fb:"出現腦疝脫徵象時,短暫過度換氣與高滲透壓治療可以爭取時間。"},
        {t:"過度換氣把 EtCO₂ 壓到 20,越低越好",to:"cpr",fb:"過度換氣太多,腦血管強烈收縮造成腦缺血。病人心跳停止。"},
        {t:"再給一次 atropine",to:"cpr",fb:"沒有處理顱內壓,腦疝脫後病人心跳停止。"},
        {t:"用 nicardipine 把血壓降下來",to:"cpr",fb:"腦灌流壓崩潰,病人心跳停止。"}
      ]},
    s2:{ story:"外科掀開頭皮、鑽孔,頭皮與骨頭大量出血,股骨骨折處也持續滲血。血壓掉到 96/54,心跳 118,血紅素 7.8 g/dL。",
      v:{hr:118,sbp:96,dbp:54,spo2:96,etco2:34,rr:14,temp:37.4,skin:"pale",alarm:true},
      q:"現在最適當的處置是?",
      options:[
        {t:"啟動大量輸血,加溫輸注 PRBC 與 FFP 依比例給;升壓藥維持收縮壓 ≥110;抽血追凝血、鈣離子、血鈉與血糖",ok:true,to:"s3",ck:[0,4],fb:"正確。腦外傷病人一次低血壓就會讓預後明顯變差;失血要用血品補,並且加溫。"},
        {t:"快速輸 5% dextrose 2 公升把血壓拉起來",to:"d3",fb:"低張、含糖的溶液會加重腦水腫與高血糖。"},
        {t:"腦外傷要限水,收縮壓 90 可以接受,先不輸",to:"d3",fb:"一次收縮壓低於 90 就會讓腦外傷的死亡率明顯上升。"},
        {t:"給 nitroglycerin 讓血壓低一點、減少出血",to:"d3",fb:"降壓會讓腦灌流壓更低,而且 nitroglycerin 會擴張腦血管。"}
      ]},
    d3:{ story:"收縮壓 78/40,心跳 134,EtCO₂ 26 mmHg,心電圖 ST 段壓低。",
      v:{hr:134,sbp:78,dbp:40,spo2:94,etco2:26,rr:14,temp:36.8,skin:"pale",alarm:true},
      ecg:{t:"stdep",lead:"V5",mm:1.5},
      q:"現在該怎麼做?",
      options:[
        {t:"呼救;啟動大量輸血,加溫輸注 PRBC 與 FFP、升壓藥維持收縮壓 ≥110,請外科加壓止血",rescue:true,to:"s3",ck:[0,4],fb:"把血容量與腦灌流壓拉回來。"},
        {t:"繼續輸晶體液 3 公升",to:"cpr",fb:"大量晶體液稀釋凝血因子、加重腦水腫,出血更止不住。病人心跳停止。"},
        {t:"只給升壓藥,不輸血",to:"cpr",fb:"血管裡沒有足夠的血,升壓藥撐不住。病人心跳停止。"},
        {t:"先觀察 10 分鐘",to:"cpr",fb:"失血持續,病人心跳停止。"}
      ]},
    s3:{ story:"血腫清除、出血控制。血壓 118/68,體溫 38.3°C,血糖 246 mg/dL,PaCO₂ 31 mmHg。",
      v:{hr:96,sbp:118,dbp:68,spo2:98,etco2:30,rr:14,temp:38.3,skin:"normal",alarm:true},
      q:"收尾階段要注意什麼?",
      options:[
        {t:"避免發燒(主動散熱、退燒)、血糖控制在 140–180、通氣調回 PaCO₂ 35–40、收縮壓維持 ≥110;帶管送神經加護病房",ok:true,to:"win",ck:[2,5,6],fb:"正確。發燒、高血糖、過度換氣與低血壓都會讓受傷的大腦更糟。"},
        {t:"用冰水把體溫降到 32°C 保護大腦",to:"d4",fb:"成人頭部外傷常規做深度低溫沒有證實有好處,還會讓凝血變差、感染增加;目標是避免發燒、維持正常體溫。"},
        {t:"繼續過度換氣,把 PaCO₂ 維持在 25 保護大腦",to:"d5",fb:"長時間過度換氣讓腦血管收縮,受傷的腦組織反而缺血。"},
        {t:"病人一動就在手術室拔管,送一般病房",to:"dead",fb:"GCS 7 的腦外傷病人沒有保護呼吸道的能力,術後腦水腫高峰還沒到。病人在病房吸入、缺氧,沒有救回來。"}
      ]},
    d4:{ story:"體溫降到 33.4°C,傷口又開始滲血,心跳 52,PT 延長。",
      v:{hr:52,sbp:104,dbp:60,spo2:97,etco2:32,rr:14,temp:33.4,skin:"pale",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"停止降溫、慢慢回溫到 36–37°C,補 FFP 與血小板;之後避免發燒,帶管送神經加護病房",rescue:true,to:"win",ck:[5,6],fb:"回到正常體溫,矯正凝血。"},
        {t:"繼續降到 30°C",to:"cpr",fb:"嚴重低溫造成心律不整,病人心跳停止。"},
        {t:"給 atropine 就好,體溫不用管",to:"dead",fb:"低溫造成的凝血異常讓顱內再次出血,病人術後死亡。"},
        {t:"立刻拔管送一般病房",to:"dead",fb:"低溫、凝血異常又沒有保護呼吸道,病人術後死亡。"}
      ]},
    d5:{ story:"過度換氣 30 分鐘後,腦組織氧分壓下降,監測顯示局部腦缺血。",
      v:{hr:90,sbp:116,dbp:66,spo2:98,etco2:24,rr:20,temp:38.2,skin:"normal",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"把通氣調回 PaCO₂ 35–40、避免發燒、控制血糖,收縮壓維持 ≥110;帶管送神經加護病房",rescue:true,to:"win",ck:[2,5,6],fb:"回到正常通氣;過度換氣只用在腦疝脫時短暫爭取時間。"},
        {t:"再加大通氣,把 PaCO₂ 壓到 20",to:"dead",fb:"腦缺血擴大,術後大範圍腦梗塞,病人死亡。"},
        {t:"給 nicardipine 讓腦血流少一點",to:"cpr",fb:"腦灌流壓再下降,病人心跳停止。"},
        {t:"立刻拔管送一般病房",to:"dead",fb:"病人沒有保護呼吸道的能力,術後吸入、缺氧死亡。"}
      ]}
  },
  win:"血腫清除、出血控制,腦灌流與氧合都維持住。病人帶管送神經加護病房。",
  dead:"急救無效,宣告死亡。",
  isbar:{i:"28 歲男性,約 70 kg,機車事故頭部外傷,急性硬腦膜上血腫。",s:"緊急開顱血腫清除,術中出血多,已輸 PRBC 與 FFP,用升壓藥維持血壓。",b:"沒戴安全帽;到院 GCS 7、右側瞳孔放大;合併左股骨骨折;給過高張食鹽水;無已知過敏。",a:"帶管、鎮靜中,血壓 118/68,體溫 37.4°C,血糖 168,瞳孔右 4 mm、左 3 mm。",r:"送神經加護病房:頭抬高 30°、收縮壓 ≥110、PaCO₂ 35–40、避免發燒、血糖 140–180;追血鈉、凝血與 Hb;股骨骨折後續由骨科處理;瞳孔或意識變化立刻通知神經外科。"}},
{ id:"vae", title:"坐姿後顱窩手術:EtCO₂ 突然往下掉", tag:"靜脈空氣栓塞",
  patient:"45 歲男性,坐姿下接受後顱窩腫瘤切除,全身麻醉,有動脈導管與右心房多孔中央靜脈導管,心前區都卜勒監測。",
  checklist:["從 EtCO₂ 突降、都卜勒聲音改變想到空氣栓塞","請外科用生理食鹽水淹沒術野、阻止空氣繼續進入","100% O₂、停用笑氣","經中央靜脈導管抽出空氣","支持循環:輸液、升壓劑,頭放低","大量空氣時讓病人左側臥頭低(若可行)並準備 CPR"],
  acls:{rhythm:"pea", fix:"經中央靜脈導管抽氣、左側臥頭低位、100% O₂"},
  bonus:[
    {n:"外科醫師",t:"請外科用濕紗布蓋住傷口、骨緣塗骨蠟",fb:"先阻止空氣繼續從開放的靜脈或骨頭進入。"},
    {n:"刷手護理師",t:"請刷手護理師遞生理食鹽水灌滿術野",fb:"讓術野淹在水裡,空氣就不會再被吸進去。"},
    {n:"Phenylephrine",t:"血壓掉時給 phenylephrine",fb:"空氣栓塞造成右心出口阻塞與低血壓,要維持血壓。",dv:{sbp:10,dbp:5}},
    {n:"Ephedrine",t:"血壓低、心跳慢時給 ephedrine",fb:"同時提升心跳與血壓。",dv:{sbp:8,hr:6}}],
  start:"s1",
  nodes:{
    s1:{ story:"外科正在剝離腫瘤。心前區都卜勒突然出現「磨坊輪」樣的雜音,EtCO₂ 從 34 掉到 22 mmHg,動脈壓 92/54,SpO₂ 95%。",
      v:{hr:112,sbp:92,dbp:54,spo2:95,etco2:22,rr:12,skin:"normal",alarm:true},
      q:"最適當的處置是?",
      options:[
        {t:"告知外科並請他們用生理食鹽水淹沒術野、找出開放的靜脈;100% O₂ 並停笑氣;經中央靜脈導管抽氣;輸液與升壓劑支持",ok:true,to:"s2",ck:[0,1,2,3,4],fb:"正確。EtCO₂ 突降加上都卜勒聲音改變,高度懷疑靜脈空氣栓塞;先阻止空氣繼續進入,再把空氣抽出來。"},
        {t:"EtCO₂ 低是過度換氣,把呼吸次數調低",to:"d1",fb:"通氣沒有改變,EtCO₂ 突降是死腔增加(肺血流被擋住)。"},
        {t:"加深麻醉,血壓低可能是剛剛刺激比較大",to:"d2",fb:"血壓更低,而空氣還在繼續進入。"},
        {t:"開始使用笑氣幫助麻醉",to:"d2",fb:"笑氣會擴散進氣泡,讓栓塞變得更大。"}
      ]},
    d1:{ story:"EtCO₂ 掉到 14 mmHg,動脈壓 70/40,SpO₂ 88%,心電圖出現 ST 段改變。",
      v:{hr:128,sbp:70,dbp:40,spo2:88,etco2:14,rr:8,skin:"pale",alarm:true,rhythm:"st"},
      ecg:{t:"stdep",lead:"II",mm:1.5},
      q:"現在該怎麼做?",
      options:[
        {t:"請外科淹沒術野、100% O₂、停笑氣、經中央靜脈導管抽氣、升壓劑支持",rescue:true,to:"s2",ck:[1,2,3,4],fb:"回到正確方向。"},
        {t:"再把呼吸次數調更低",to:"cpr",fb:"沒有處理空氣栓塞,右心衰竭,心跳停止。"},
        {t:"給 nitroglycerin 處理 ST 改變",to:"cpr",fb:"血壓崩落,心跳停止。"},
        {t:"繼續觀察",to:"cpr",fb:"空氣持續進入,心跳停止。"}
      ]},
    d2:{ story:"動脈壓 58/30,EtCO₂ 12 mmHg,都卜勒持續有雜音。",
      v:{hr:136,sbp:58,dbp:30,spo2:86,etco2:12,rr:12,skin:"pale",alarm:true},
      q:"現在該怎麼做?",
      options:[
        {t:"再加深麻醉",to:"cpr",fb:"循環崩落,心跳停止。"},
        {t:"請外科淹沒術野、100% O₂ 停笑氣、經中央靜脈導管抽氣、升壓劑與輸液",rescue:true,to:"s2",ck:[1,2,3,4],fb:"回到正確方向。"},
        {t:"給 atropine",to:"cpr",fb:"問題不在心跳,而是空氣擋住右心出口,心跳停止。"},
        {t:"給 furosemide",to:"cpr",fb:"在休克中利尿,心跳停止。"}
      ]},
    s2:{ story:"已經從中央靜脈導管抽出 40 mL 帶泡沫的血,但動脈壓仍只有 74/42,EtCO₂ 18。",
      v:{hr:124,sbp:74,dbp:42,spo2:92,etco2:18,rr:12,skin:"pale",alarm:true},
      q:"接下來怎麼做?",
      options:[
        {t:"持續抽氣與升壓劑支持;把頭放低(在頭部固定許可下讓病人轉為左側臥頭低);準備好 CPR;若頭部固定不能移動,就暫停手術、壓迫雙側頸靜脈並維持血壓",ok:true,to:"win",ck:[4,5],fb:"正確。大量空氣時頭放低、左側臥,讓空氣留在右心房而不阻塞右心出口。"},
        {t:"讓病人坐得更直,方便抽氣",to:"cpr",fb:"坐得更直讓頭部靜脈壓更低,更多空氣進入,心跳停止。"},
        {t:"把 PEEP 調到 20 cmH₂O 擠出空氣",to:"cpr",fb:"高 PEEP 讓右心後負荷更高、靜脈回流更少,心跳停止。"},
        {t:"開始使用笑氣增加麻醉深度",to:"cpr",fb:"笑氣讓氣泡變大,心跳停止。"}
      ]}
  },
  win:"空氣進入點被封住,血壓回到 108/64、EtCO₂ 32。手術完成,病人送加護病房觀察神經學。",
  dead:"急救無效,宣告死亡。",
  isbar:{i:"45 歲男性,坐姿後顱窩腫瘤切除。",s:"術中靜脈空氣栓塞,經中央靜脈導管抽出約 40 mL 空氣後循環恢復。",b:"無過敏;給過 phenylephrine 與輸液;有動脈導管與右心房中央靜脈導管。",a:"血壓 108/64、EtCO₂ 32、SpO₂ 98%,鎮靜插管中。",r:"轉加護病房;清醒後立刻做神經學評估(注意反常性栓塞造成中風);追蹤血液氣體;持續監測血壓與心律。"}}
);
