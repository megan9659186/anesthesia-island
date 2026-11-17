// 麻醉藥理（Pharmacology）街區：街區資料、AI 猜題與所有學習主題
ISLAND.add({
 "sys": {
  "id": "pharm",
  "name": "麻醉藥理",
  "en": "Pharmacology",
  "aiq": [
   {
    "q": "propofol 持續輸注少於 3 小時,其情境敏感半衰期約為多少?",
    "o": [
     "約 3 分鐘",
     "約 10 分鐘",
     "約 40 分鐘",
     "約 90 分鐘"
    ],
    "a": 1,
    "e": "Miller 第 21 章:propofol 輸注 3 小時內情境敏感半衰期約 10 分鐘,輸注到 8 小時仍少於 40 分鐘。情境敏感半衰期是停止輸注後濃度下降 50% 的時間,會隨輸注時間延長。",
    "src": "Miller 10e Ch21 Intravenous Anesthetics",
    "refs": [
     "111A31",
     "112A50"
    ]
   },
   {
    "q": "下列吸入麻醉劑中,血氣分配係數最低、誘導與甦醒最快的是何者?",
    "o": [
     "isoflurane",
     "sevoflurane",
     "halothane",
     "desflurane"
    ],
    "a": 3,
    "e": "Miller 第 18 章表列血氣分配係數:desflurane 0.45、笑氣 0.47、sevoflurane 0.65、isoflurane 1.4、halothane 2.5。血中溶解度越低,肺泡分壓上升越快。",
    "src": "Miller 10e Ch18 Inhaled Anesthetic Uptake, Distribution, Metabolism, and Toxicity",
    "refs": [
     "109A2",
     "109A50"
    ]
   },
   {
    "q": "其他條件相同時,下列何種狀況會使吸入麻醉誘導變慢?",
    "o": [
     "每分鐘通氣量增加",
     "新鮮氣體流量增加",
     "使用血中溶解度低的麻醉藥",
     "心輸出量增加"
    ],
    "a": 3,
    "e": "心輸出量高時肺血流把麻醉藥帶走較多,肺泡分壓上升變慢,誘導變慢;增加通氣量、氣體流量或使用低溶解度藥物則加快誘導。",
    "src": "Miller 10e Ch18 Inhaled Anesthetic Uptake, Distribution, Metabolism, and Toxicity",
    "refs": [
     "109A39"
    ]
   },
   {
    "q": "吸入高濃度笑氣時,其他同時吸入氣體的肺泡濃度維持或上升,此現象稱為何?",
    "o": [
     "濃度效應",
     "第二氣體效應",
     "擴散性缺氧",
     "過度加壓"
    ],
    "a": 1,
    "e": "笑氣快速被吸收使肺泡體積縮小,讓同時吸入的其他氣體(如揮發性麻醉劑、氧氣)濃度維持或上升,稱為第二氣體效應;濃度效應是指吸入濃度越高,因攝取而下降的比例越小。",
    "src": "Miller 10e Ch18 Inhaled Anesthetic Uptake, Distribution, Metabolism, and Toxicity",
    "refs": [
     "109A2"
    ]
   },
   {
    "q": "揮發性麻醉劑造成免疫性肝炎的發生率與其代謝程度相關,下列何者風險最低?",
    "o": [
     "halothane",
     "enflurane",
     "isoflurane",
     "desflurane"
    ],
    "a": 3,
    "e": "反應性代謝物修飾肝蛋白引發免疫反應,發生率依代謝程度:halothane ≫ enflurane > isoflurane > desflurane。現代吸入藥代謝少,肝腎毒性也較低。",
    "src": "Miller 10e Ch18 Inhaled Anesthetic Uptake, Distribution, Metabolism, and Toxicity",
    "refs": [
     "109A50"
    ]
   },
   {
    "q": "有關局部麻醉藥的代謝,下列何者正確?",
    "o": [
     "酯類主要由血漿酯酶代謝,醯胺類主要由肝臟 CYP450 代謝",
     "醯胺類主要由血漿酯酶代謝",
     "兩類都由腎臟原型排出",
     "酯類主要由肝臟代謝"
    ],
    "a": 0,
    "e": "Miller 第 25 章:胺基酯類(如 chloroprocaine、tetracaine)由血漿酯酶代謝;胺基醯胺類(如 lidocaine、bupivacaine、ropivacaine)由肝臟 CYP450 代謝(110 年考分類)。",
    "src": "Miller 10e Ch25 Local Anesthetics",
    "refs": [
     "110A52",
     "112A51"
    ]
   },
   {
    "q": "局部麻醉藥中毒時,下列哪一種情況會加重毒性?",
    "o": [
     "低血氧與酸中毒",
     "高血氧",
     "鹼中毒",
     "低體溫"
    ],
    "a": 0,
    "e": "低血氧與酸中毒會加重局麻藥對心臟與腦的毒性,所以急救首重呼吸道與氧合;bupivacaine 中毒的急救特別困難,超音波導引與分次給藥可降低發生率。",
    "src": "Miller 10e Ch25 Local Anesthetics",
    "refs": [
     "115A46",
     "114A72"
    ]
   },
   {
    "q": "非去極化肌肉鬆弛劑的起效速度與效價的關係為何?",
    "o": [
     "效價越高,起效越快",
     "兩者無關",
     "效價越低,起效越快",
     "只有 succinylcholine 遵循此關係"
    ],
    "a": 2,
    "e": "起效速度與效價成反比:rocuronium 莫耳效價約為 vecuronium 的 13%、cisatracurium 的 9%,但起效比兩者快(atracurium 除外)。",
    "src": "Miller 10e Ch24 Pharmacology of Neuromuscular Blocking Drugs and Antagonists (Reversal Agents)",
    "refs": [
     "113G74",
     "109A79"
    ]
   },
   {
    "q": "下列哪一組肌肉的神經肌肉阻斷起效最快、恢復也最快?",
    "o": [
     "拇內收肌",
     "足部屈肌",
     "喉部內收肌與橫膈",
     "眼輪匝肌與拇內收肌"
    ],
    "a": 2,
    "e": "喉部內收肌、橫膈、咬肌等中央肌群血流豐富,阻斷起效快、持續短、恢復快;周邊的拇內收肌較慢,所以監測拇內收肌恢復較不會高估(113 年考)。",
    "src": "Miller 10e Ch24 Pharmacology of Neuromuscular Blocking Drugs and Antagonists (Reversal Agents)",
    "refs": [
     "113G74"
    ]
   },
   {
    "q": "未使用定量神經肌肉監測時,neostigmine 拮抗後拔管,恢復室中約有多少比例病人仍有殘餘阻斷(TOF <0.9)?",
    "o": [
     "約 1%",
     "約 5–10%",
     "約 30–50%",
     "約 90%"
    ],
    "a": 2,
    "e": "Miller 第 24 章:未用定量監測時,約 30–50% 病人在 neostigmine 拮抗後仍 TOF <0.9,會增加低血氧、呼吸道阻塞與肺部併發症;拔管標準為 TOF ≥0.90(加速度肌動圖 1.0)。",
    "src": "Miller 10e Ch24 Pharmacology of Neuromuscular Blocking Drugs and Antagonists (Reversal Agents)",
    "refs": [
     "115G64",
     "113G60"
    ]
   }
  ]
 },
 "topics": [
  {
   "id": "pkpd",
   "sys": "pharm",
   "name": "藥動與藥效學",
   "tag": "藥動藥效",
   "en": "PK · PD",
   "one": "停藥後多久醒,要看輸注了多久。",
   "pts": [
    "情境敏感半衰期:持續輸注維持穩定濃度後停藥,血中濃度下降 50% 所需時間,會隨輸注時間變長。",
    "Hysteresis:血漿濃度與藥效之間的時間延遲,包括藥物擴散到作用部位的時間。",
    "效應部位濃度是數學推導的虛擬位置;單一藥物的不同效果(止痛、呼吸抑制、插管反應)出現在不同濃度。",
    "麻醉是藥物交互作用的實踐:安眠藥、止痛藥與肌鬆劑會互相加乘。",
    "藥物遵循質量作用定律:血漿濃度高於組織時進入組織,低於組織時從組織回到血漿。",
    "容易通過血腦障壁的脂溶性藥物(安眠藥、鴉片類)也大量被脂肪攝取。",
    "肝臟是藥物代謝的主要器官;小分子、未與蛋白結合的藥物可自由進入腎絲球濾液。",
    "非離子化部分在腎小管再吸收,離子化部分隨尿液排出。",
    "排除半衰期 = 濃度下降 50% 所需時間;麻醉藥物都是多腔室藥動學,有多個半衰期。",
    "藥效消退無法從半衰期預測,應以情境敏感半衰期(context-sensitive half-time)比較靜脈藥物。(Morgan)"
   ],
   "refs": [
    "112A50",
    "111A31",
    "111A77",
    "112A63",
    "114A28"
   ],
   "src": [
    "Miller 10e Ch16 Basic Principles of Pharmacology",
    "Morgan & Mikhail's Clinical Anesthesiology 7e, Ch7 Pharmacological Principles"
   ],
   "detail": [
    {
     "h": "觀念",
     "p": "藥物動力學(PK)描述身體如何處理藥物:吸收、分布、代謝、排除;藥物效力學(PD)描述藥物如何作用於身體。麻醉藥常以持續輸注給予,所以「停藥後多久會醒」比單純的半衰期更有臨床意義。臨床麻醉的每一個給藥決定都建立在藥動學(身體對藥物做什麼:吸收、分布、代謝、排除)與藥效學(藥物對身體做什麼:劑量反應、效價、效能)之上。"
    },
    {
     "h": "機轉與生理",
     "p": "靜脈麻醉藥進入血液後,先分布到血流豐富的中央室,再慢慢進入肌肉、脂肪等周邊室。持續輸注時周邊室逐漸填滿,停藥後周邊室的藥物會回流到血液,使濃度下降變慢。情境敏感半衰期是:持續輸注維持穩定濃度後停藥,血中濃度下降 50% 所需的時間,它隨輸注時間延長而變長,不同藥物差異很大(fentanyl 增加明顯,remifentanil 幾乎不變)。Hysteresis 指血漿濃度與藥效之間的時間延遲,反映藥物從血液擴散到作用部位(效應部位)所需時間;效應部位濃度是數學推導的虛擬位置。同一藥物不同效果(止痛、呼吸抑制、抑制插管反應)出現在不同濃度。",
     "more": [
      "分布體積(Vd)越大,達到相同血漿濃度所需負荷劑量越大;負荷劑量 ≈ 目標濃度 × Vd。",
      "清除率決定維持輸注速率;肝清除分為流量限制型(高萃取率,受肝血流影響)與容量限制型(低萃取率,受酵素活性與蛋白結合影響)。",
      "第一相反應(氧化、還原、水解,多經 CYP450)與第二相反應(結合,如葡萄糖醛酸化)。",
      "藥效學:效價(potency,EC50)≠ 效能(efficacy,最大效應);拮抗劑分為競爭型與非競爭型。"
     ]
    },
    {
     "h": "臨床處置",
     "p": [
      "長時間手術選擇情境敏感半衰期短的藥物(propofol、remifentanil),較易預測甦醒。",
      "安眠藥與鴉片類合併使用有明顯加乘作用,兩者都要減量。",
      "藥效出現有延遲,調整劑量後要等待效應部位達到平衡再判斷。",
      "脂溶性藥物單次注射後作用結束主要靠再分布(血液 → 肌肉、脂肪),不是代謝。",
      "長時間輸注後周邊腔室飽和,作用時間改由排除決定(例:thiopental 長期輸注)。",
      "效應部位平衡時間(ke0)決定起效延遲,滴定藥物時要等藥效出現再追加。",
      "肝腎功能不全:依藥物的主要排除途徑調整劑量;低白蛋白血症使高蛋白結合藥物游離比例上升。"
     ]
    },
    {
     "h": "考試提醒",
     "p": [
      "情境敏感半衰期隨輸注時間變長。",
      "Hysteresis = 血漿濃度與藥效之間的延遲。",
      "效應部位濃度是虛擬位置。",
      "麻醉藥之間有加乘作用。",
      "比較靜脈藥物的恢復快慢:用情境敏感半衰期。(Morgan)",
      "非離子化部分再吸收、離子化部分排出。",
      "高萃取率藥物清除受肝血流影響。"
     ]
    }
   ],
   "mgx": 7
  },
  {
   "id": "volatile",
   "sys": "pharm",
   "name": "吸入麻醉藥:攝取與藥理",
   "tag": "吸入麻醉藥",
   "en": "Inhaled uptake",
   "one": "血中溶解度越低,上得越快。",
   "pts": [
    "肺泡分壓是驅動麻醉藥進入血液與腦的力量;新鮮氣體流量、揮發器設定與每分鐘通氣量增加可加快遞送。",
    "血中溶解度高或心輸出量高時攝取增加,肺泡分壓上升變慢,誘導變慢。",
    "血氣分配係數:desflurane 0.45、笑氣 0.47、sevoflurane 0.65、isoflurane 1.4。",
    "濃度效應與第二氣體效應:高濃度笑氣快速被吸收,使其他氣體濃度維持或上升。",
    "影響攝取三要素:血中溶解度(血/氣分配係數)、肺泡血流(心輸出量)、肺泡與混合靜脈血的分壓差。(Morgan)",
    "低心輸出量時肺泡濃度上升更快,容易造成可溶性藥物過量。(Morgan)",
    "加快誘導的因素多半也加快甦醒:無重吸、高新鮮氣體流量、迴路體積小、溶解度低、腦血流高、通氣增加。(Morgan)",
    "MAC:對標準刺激(劃刀)50% 病人不動的肺泡濃度;Meyer–Overton:效價與脂溶性相關(只是近似)。",
    "長時間暴露笑氣可造成骨髓抑制(巨母紅血球貧血)與周邊神經病變。",
    "Desflurane 溶解度低,誘導與甦醒極快,但濃度快速上升時引起心跳、血壓與兒茶酚胺上升。(Morgan)",
    "Sevoflurane 無刺激味、肺泡濃度上升快,適合小兒與成人吸入誘導。(Morgan)"
   ],
   "refs": [
    "109A2",
    "109A50",
    "109A39",
    "110A47",
    "111G76"
   ],
   "src": [
    "Miller 10e Ch18 Inhaled Anesthetic Uptake, Distribution, Metabolism, and Toxicity",
    "Miller 10e Ch17 Inhaled Anesthetics: Mechanisms of Action",
    "Morgan & Mikhail's Clinical Anesthesiology 7e, Ch8 Inhalation Anesthetics"
   ],
   "detail": [
    {
     "h": "觀念",
     "p": "吸入麻醉藥的效果取決於它在腦中的分壓,而腦的分壓最終會與肺泡分壓平衡。所以「肺泡分壓上升得多快」決定誘導快慢,「下降得多快」決定甦醒快慢。全身麻醉分為誘導、維持、甦醒三期。吸入麻醉的最終效果取決於腦部達到治療分壓;藥物由吸入濃度(FI)→ 肺泡濃度(FA)→ 動脈血 → 腦。FA/FI 上升越快,誘導越快。甦醒主要靠藥物由腦部再分布,再經肺排出。"
    },
    {
     "h": "機轉與生理",
     "p": "肺泡分壓上升的速度由兩股力量拉扯:遞送(新鮮氣體流量、揮發器濃度、每分鐘通氣量)把藥送進肺泡;攝取(血中溶解度、心輸出量、肺泡與靜脈分壓差)把藥從肺泡帶走。血氣分配係數越低,代表血液只需溶解少量麻醉藥就能達到平衡,肺泡分壓上升快,誘導與甦醒都快:desflurane 0.45、笑氣 0.47、sevoflurane 0.65、isoflurane 1.4。心輸出量高時攝取多,肺泡分壓上升慢(誘導變慢);心輸出量低(休克)時反而上升快,容易過量。濃度效應是高濃度笑氣被快速吸收,使肺泡內剩下的氣體濃縮並吸入更多新鮮氣體;第二氣體效應是笑氣同時讓一起給予的揮發劑濃度上升。MAC 是使 50% 病人對切皮無體動的肺泡濃度,高齡、低體溫、懷孕、鎮靜藥會降低 MAC。",
     "more": [
      "MAC(成人約):sevoflurane ≈2%、desflurane ≈6%、isoflurane ≈1.2%、笑氣 ≈104%;MAC 可加成。(Morgan)",
      "MAC 下降:年齡增加、低體溫、懷孕、急性酒精中毒、鴉片類/鎮靜藥、低血鈉;上升:慢性酒精、高體溫、高血鈉、急性安非他命/古柯鹼。",
      "第二氣體效應與濃度效應:大量笑氣攝取使其他氣體在肺泡中濃縮。(Morgan)",
      "笑氣會擴散進入含氣空腔(氣胸、腸阻塞、中耳、眼內氣體),使體積或壓力上升。"
     ]
    },
    {
     "h": "臨床處置",
     "p": [
      "休克病人吸入麻醉要小心,肺泡濃度上升快,易抑制循環。",
      "右向左分流會使低溶解度藥物誘導變慢;左向右分流影響不大。",
      "甦醒時笑氣大量從血液排到肺泡,可能稀釋氧氣造成擴散性低血氧,停笑氣後給 100% 氧氣數分鐘。",
      "吸入誘導:sevoflurane 最適合;desflurane 與 isoflurane 刺激呼吸道,不適合誘導。(Morgan)",
      "揮發性麻醉藥都會劑量依賴地降低血壓、抑制通氣、擴張支氣管、增加腦血流(>1 MAC 時自我調節受損)。",
      "所有揮發性麻醉藥(與琥珀膽鹼)都可觸發惡性高熱;笑氣不會。",
      "笑氣的禁忌:氣胸、腸阻塞、氣腦、玻璃體內注氣、肺高壓、維生素 B12 缺乏。",
      "Halothane 肝炎極罕見;高風險:短期多次暴露、中年肥胖女性、家族或個人病史。"
     ]
    },
    {
     "h": "考試提醒",
     "p": [
      "血氣係數:des 0.45 < N₂O 0.47 < sevo 0.65 < iso 1.4。",
      "溶解度越低,誘導甦醒越快。",
      "心輸出量高 → 誘導變慢。",
      "擴散性低血氧:停笑氣後給純氧。",
      "低心輸出量 → 吸入誘導加快 → 易過量。(Morgan)",
      "Sevoflurane 適合吸入誘導;desflurane 快速加量致心搏過速。(Morgan)",
      "笑氣擴散入含氣空腔,長期暴露造成巨母紅血球貧血。"
     ]
    }
   ],
   "mgx": 8
  },
  {
   "id": "ivanes",
   "sys": "pharm",
   "name": "靜脈麻醉藥",
   "tag": "靜脈麻醉藥",
   "en": "IV anesthetics",
   "one": "選藥看血流動力學。",
   "pts": [
    "propofol:增強 GABA,主要以降低 SVR 造成低血壓;輸注 3 小時內情境敏感半衰期約 10 分鐘;具止吐作用。",
    "etomidate:心血管與呼吸影響小,適合高齡或不穩定病人;單次劑量即會抑制腎上腺皮質合成。",
    "ketamine:NMDA 拮抗,解離性麻醉與止痛,擬交感作用保留心臟功能,呼吸抑制小。",
    "dexmedetomidine:α₂ 致效劑,呼吸抑制小,心跳與心輸出量隨濃度下降;midazolam 可被 flumazenil 拮抗,remimazolam 經血漿酯酶快速代謝。",
    "脂溶性高的 barbiturate 長時間輸注(如巴比妥昏迷)會飽和周邊腔室,作用時間改由排除決定——情境敏感性的例子。",
    "Barbiturate 收縮腦血管,降低腦血流、腦血容積與顱內壓。",
    "Benzodiazepine 誘導後呼吸停止雖不常見,小劑量靜脈注射仍可能造成呼吸停止。",
    "Ketamine 與其他誘導藥不同,會升高動脈血壓、心跳與心輸出量(尤其快速推注)。",
    "Propofol 製劑可支持細菌生長,需無菌操作,開封後 6 小時內使用。"
   ],
   "refs": [
    "115A24",
    "115A25",
    "115A26",
    "114A28",
    "114A31",
    "113A36",
    "109A31",
    "112A62",
    "110A51",
    "113A32",
    "112A63",
    "112A51",
    "112A50",
    "110A68",
    "109A66"
   ],
   "src": [
    "Miller 10e Ch21 Intravenous Anesthetics",
    "Morgan & Mikhail's Clinical Anesthesiology 7e, Ch9 Intravenous Anesthetics"
   ],
   "detail": [
    {
     "h": "觀念",
     "p": "靜脈麻醉藥的選擇,常取決於病人的血流動力學與共病。每一種藥都有自己的「招牌特性」,考題常就此出題。全身麻醉可用全靜脈麻醉(TIVA)、吸入或兩者合併維持;ketamine 也可肌肉注射誘導。"
    },
    {
     "h": "機轉與生理",
     "p": "propofol 增強 GABA_A 受體,誘導快、甦醒清醒,具止吐作用;主要以降低 SVR(與抑制交感、心收縮)造成低血壓,呼吸抑制明顯;長時間高劑量輸注可能引起 propofol 輸注症候群(代謝性酸中毒、橫紋肌溶解、心衰竭)。etomidate 對心血管與呼吸影響最小,適合心血管不穩定病人,但單次劑量即抑制 11β-hydroxylase,抑制腎上腺皮質醇合成,且噁心嘔吐與肌陣攣較多。ketamine 拮抗 NMDA 受體,產生解離性麻醉與強效止痛,間接擬交感作用使血壓、心跳上升,保留呼吸驅動與呼吸道反射、擴張支氣管;但對兒茶酚胺耗竭的病人可呈現直接心肌抑制,並有甦醒期幻覺。dexmedetomidine 是 α₂ 致效劑,鎮靜可喚醒、呼吸抑制小,但造成心搏過緩與低血壓。midazolam 可被 flumazenil 拮抗;remimazolam 是由血漿酯酶快速代謝的 benzodiazepine,同樣可被 flumazenil 拮抗。"
    },
    {
     "h": "臨床處置",
     "p": [
      "低血容積或心血管不穩:etomidate 或 ketamine,propofol 減量。",
      "氣喘病人誘導:ketamine 或 propofol。",
      "需要清醒鎮靜且不抑制呼吸(如清醒插管):dexmedetomidine。",
      "敗血症病人使用 etomidate 要考慮腎上腺抑制。",
      "血流動力學不穩或休克:選 etomidate 或 ketamine,減少劑量。(Morgan)",
      "顱內壓高:propofol、barbiturate 降低腦代謝與顱內壓。",
      "急性間歇性紫質症:barbiturate(與 etomidate)禁用,propofol 可用。(Morgan)",
      "Propofol 調配:無菌技術、開封後 6 小時內使用,避免細菌污染造成感染。"
     ]
    },
    {
     "h": "考試提醒",
     "p": [
      "propofol 低血壓主因 SVR 下降,具止吐作用。",
      "etomidate 抑制腎上腺皮質。",
      "ketamine:NMDA 拮抗、擬交感、支氣管擴張。",
      "remimazolam:血漿酯酶代謝,可被 flumazenil 拮抗。",
      "Ketamine 唯一會升高血壓心跳的誘導藥。(Morgan)",
      "Barbiturate 禁用於紫質症。",
      "Propofol 開封 6 小時內用完。(Morgan)"
     ]
    }
   ],
   "mgx": 9
  },
  {
   "id": "lapharm",
   "sys": "pharm",
   "name": "局部麻醉藥藥理",
   "tag": "局麻藥理",
   "en": "Local anesthetic pharmacology",
   "one": "酯類看血漿、醯胺類看肝。",
   "pts": [
    "局部麻醉藥阻斷電壓門控鈉通道,中斷神經衝動。",
    "分為胺基酯類與胺基醯胺類:酯類由血漿酯酶代謝,醯胺類由肝臟 CYP450 代謝。",
    "非離子型脂溶性高、易穿過膜;離子型在作用部位較有效。酸性環境(如感染組織)使離子型增加。",
    "低血氧與酸中毒會加重全身毒性;bupivacaine 中毒的急救特別困難。",
    "電壓閘控鈉通道有靜止、開啟、失活三狀態;局麻藥結合 α 次單元內側,阻止鈉離子內流。",
    "神經纖維對局麻藥的敏感度受直徑、髓鞘等影響。",
    "效價與脂溶性相關,加入大烷基可增加效價;局麻藥沒有類似 MAC 的效價指標。",
    "作用時間與效價、脂溶性相關。(Morgan)",
    "全身吸收速度:靜脈 > 氣管 > 肋間 > 子宮頸旁 > 硬脊膜外 > 臂神經叢 > 坐骨 > 皮下。"
   ],
   "refs": [
    "110A52",
    "112A51",
    "109A27",
    "110A50"
   ],
   "src": [
    "Miller 10e Ch25 Local Anesthetics",
    "Morgan & Mikhail's Clinical Anesthesiology 7e, Ch16 Local Anesthetics"
   ],
   "detail": [
    {
     "h": "觀念",
     "p": "局部麻醉藥阻斷神經傳導,是區域麻醉與許多止痛技術的基礎。結構(酯類或醯胺類)決定代謝方式與過敏特性,pKa 與脂溶性決定起效速度與效價。"
    },
    {
     "h": "機轉與生理",
     "p": "局麻藥以非離子(鹼基)型穿過神經膜,進入細胞後再轉為離子型,從細胞內側阻斷電壓門控鈉通道,使動作電位無法產生。pKa 越接近生理 pH,非離子型比例越高、起效越快(如 lidocaine);感染組織呈酸性,離子型增加、難以穿膜,所以效果變差。脂溶性越高效價越強,蛋白結合率越高作用越久(如 bupivacaine)。酯類(procaine、chloroprocaine、tetracaine)由血漿膽鹼酯酶代謝,代謝物 PABA 較易引起過敏;醯胺類(名稱有兩個 i:lidocaine、bupivacaine、ropivacaine)由肝臟 CYP450 代謝。",
     "more": [
      "加入 epinephrine:減少全身吸收、延長作用(對 lidocaine 效果明顯)、可作為誤入血管的測試劑。(Morgan)",
      "酯類代謝產物 PABA 可引起過敏;醯胺類真正過敏罕見(多為防腐劑或 epinephrine 反應)。",
      "Prilocaine 與 benzocaine 可造成變性血紅素血症,以 methylene blue 治療。"
     ]
    },
    {
     "h": "臨床處置",
     "p": [
      "加入 epinephrine 可收縮血管、減少吸收、延長作用並作為血管內注射的指標。",
      "加入碳酸氫鈉可提高 pH、加快起效。",
      "肝功能不佳時醯胺類累積;血漿膽鹼酯酶缺乏時酯類作用延長。",
      "低血氧與酸中毒會加重毒性;bupivacaine 中毒急救困難。",
      "局麻藥全身毒性(LAST):先口周麻、耳鳴、頭暈、躁動 → 抽搐 → 心律不整、心血管崩潰;病人鎮靜時前驅症狀可能被掩蓋。",
      "LAST 處置:呼救、維持呼吸道與給氧、控制抽搐(benzodiazepine)、儘早 20% 脂肪乳劑;CPR 時 epinephrine 用小劑量,避免 vasopressin、鈣離子阻斷劑、β 阻斷劑與局麻藥類抗心律不整藥。",
      "Chloroprocaine 起效快、作用短,由偽膽鹼酯酶快速代謝,常用於產科硬脊膜外急救。(Morgan)"
     ]
    },
    {
     "h": "考試提醒",
     "p": [
      "作用機轉:阻斷電壓門控鈉通道。",
      "酯類看血漿酯酶、醯胺類看肝臟。",
      "感染(酸性)組織效果變差。",
      "pKa 決定起效、脂溶性決定效價、蛋白結合決定作用時間。",
      "起效看 pKa,效價與作用時間看脂溶性。(Morgan)",
      "吸收:肋間 > 硬脊膜外 > 臂神經叢 > 皮下。",
      "LAST 首要:氧合 + 脂肪乳劑。"
     ]
    }
   ],
   "mgx": 16
  },
  {
   "id": "nmbd",
   "sys": "pharm",
   "name": "肌肉鬆弛劑藥理",
   "tag": "肌鬆藥理",
   "en": "Neuromuscular blockers",
   "one": "越不強效,起效越快。",
   "pts": [
    "非去極化肌鬆劑與乙醯膽鹼競爭接合後受體;succinylcholine 造成持續去極化,由血漿膽鹼酯酶快速水解。",
    "起效速度與效價成反比:rocuronium 效價較低,起效比 vecuronium、cisatracurium 快。",
    "喉部內收肌、橫膈、咬肌等中央肌群阻斷較快、恢復也較快;拇內收肌較慢。",
    "長效肌鬆劑多經腎臟排出;mivacurium 由血漿膽鹼酯酶代謝。",
    "Succinylcholine 使正常人血鉀上升約 0.5 mEq/L;燒傷、大創傷、神經疾病等可致命性高血鉀。(Morgan)",
    "兒童與青少年常規使用 succinylcholine 屬相對禁忌(未診斷肌病變的高血鉀、橫紋肌溶解、心跳停止)。(Morgan)",
    "Pancuronium 與 vecuronium 部分經腎排除,腎衰竭時作用延長;pancuronium 造成高血壓與心搏過速。(Morgan)",
    "Rocuronium 0.9–1.2 mg/kg 起效 60–90 秒,可用於快速誘導;sugammadex 可快速拮抗。(Morgan)"
   ],
   "refs": [
    "113G74",
    "109A79",
    "113G73",
    "111A45",
    "111G76",
    "115G64",
    "114A71",
    "113A36",
    "112A63",
    "112A55",
    "110A68"
   ],
   "src": [
    "Miller 10e Ch24 Pharmacology of Neuromuscular Blocking Drugs and Antagonists (Reversal Agents)",
    "Morgan & Mikhail's Clinical Anesthesiology 7e, Ch11 Neuromuscular Blocking Agents"
   ],
   "detail": [
    {
     "h": "觀念",
     "p": "肌肉鬆弛劑讓插管更容易、手術視野更好。分為去極化(succinylcholine)與非去極化兩大類,作用方式與副作用完全不同。"
    },
    {
     "h": "機轉與生理",
     "p": "succinylcholine 由兩個乙醯膽鹼分子組成,與受體結合造成持續去極化,先出現肌束顫動,再因鈉通道失活而無法再興奮(第一相阻斷);由血漿膽鹼酯酶快速水解,作用約 5–10 分鐘。副作用:高血鉀(正常約上升 0.5 mEq/L,受體上調者可致命)、心搏過緩(尤其兒童與重複給藥)、肌肉痛、眼內壓與胃內壓上升、誘發惡性高熱。非去極化肌鬆劑與乙醯膽鹼競爭受體。效價與起效速度成反比:效價較低的 rocuronium 需要較多分子,濃度梯度大,所以起效快。中央肌群(喉部內收肌、橫膈、咬肌)血流多,起效與恢復都比拇內收肌快。",
     "more": [
      "去極化阻斷:第 I 相(持續去極化、肌束顫動,TOF 不衰減、無強直後增強);重複或大劑量造成第 II 相(類似非去極化,TOF 衰減)。",
      "非去極化阻斷特徵:TOF 衰減、強直刺激衰減、強直後增強;可被乙醯膽鹼酯酶抑制劑拮抗。(Morgan)",
      "Succinylcholine 副作用:心搏過緩(尤其兒童與重複給藥)、肌痛、眼壓/胃內壓/顱內壓上升、高血鉀、咬肌僵直、惡性高熱觸發。(Morgan)",
      "增強非去極化阻斷:揮發性麻醉劑、低體溫、低血鉀、高鎂、aminoglycoside、lithium、局部麻醉藥、酸中毒。",
      "Dibucaine number:正常 ~80;異型合子 40–60;同型合子非典型 ~20。"
     ]
    },
    {
     "h": "臨床處置",
     "p": [
      "需要快速插管:succinylcholine 1–1.5 mg/kg 或 rocuronium 1.2 mg/kg。",
      "肝腎衰竭:cisatracurium(Hofmann 分解與酯水解)。",
      "膽鹼酯酶異常者 succinylcholine 與 mivacurium 作用延長。",
      "高血鉀風險(上運動神經元損傷、燒傷 24–48 小時後、長期臥床、大範圍肌肉創傷)→ 避免 succinylcholine。(Morgan)",
      "肝腎衰竭:分布體積增加,初始劑量可能較大,但依賴肝腎排除者維持劑量要減少;首選 cisatracurium。(Morgan)",
      "ICU 長期使用 vecuronium 可導致停藥後數天的延長阻斷(3-OH 代謝物、多發神經病變)。(Morgan)",
      "所有使用肌鬆劑的病人都需確保足夠麻醉深度,避免術中甦醒。"
     ]
    },
    {
     "h": "考試提醒",
     "p": [
      "效價越低,起效越快(rocuronium)。",
      "中央肌群起效與恢復較快。",
      "succinylcholine 由血漿膽鹼酯酶水解。",
      "長效肌鬆劑多經腎排除。",
      "Pancuronium:心搏過速、腎排除。(Morgan)",
      "Dibucaine number ~20 = 同型合子非典型。"
     ]
    }
   ],
   "mgx": 11
  },
  {
   "id": "reversal",
   "sys": "pharm",
   "name": "拮抗劑",
   "tag": "拮抗劑",
   "en": "Reversal agents",
   "one": "沒有定量監測,就不知道有沒有醒透。",
   "pts": [
    "拔管前拇內收肌 TOF ratio ≥0.90(加速度肌動圖為 1.0);只有定量監測能確認恢復程度。",
    "未使用定量監測時,neostigmine 拮抗後約 30–50% 病人在拔管後仍 TOF <0.9。",
    "殘餘阻斷會降低上食道張力、吞嚥協調與低氧通氣驅動,增加呼吸併發症。",
    "sugammadex 只逆轉類固醇類肌鬆劑;flumazenil、naloxone 作用時間短於被拮抗的藥物。",
    "膽鹼酯酶抑制劑主要用於拮抗非去極化肌鬆劑,也用於診斷與治療重症肌無力。",
    "乙醯膽鹼是整個副交感、交感神經節、腎上腺髓質、汗腺與骨骼肌的神經傳導物質。",
    "抑制劑間接增加乙醯膽鹼,與非去極化肌鬆劑競爭菸鹼受體,恢復傳導。",
    "膽鹼酯酶抑制劑會延長 succinylcholine 的去極化阻斷。",
    "肝腎功能不全延長肌鬆劑作用時,通常也延長抑制劑作用時間。",
    "加速度肌動描記等定量監測可減少未察覺的術後殘餘麻痺。"
   ],
   "refs": [
    "115G64",
    "114A71",
    "112A55",
    "112A57",
    "109A66",
    "110A68",
    "113A32",
    "110A51",
    "109A79"
   ],
   "src": [
    "Miller 10e Ch24 Pharmacology of Neuromuscular Blocking Drugs and Antagonists (Reversal Agents)",
    "Miller 10e Ch39 Neuromuscular Monitoring",
    "Morgan & Mikhail's Clinical Anesthesiology 7e, Ch12 Cholinesterase Inhibitors & Antagonists to NMBAs"
   ],
   "detail": [
    {
     "h": "觀念",
     "p": "肌鬆劑拮抗的目的是讓病人在拔管前完全恢復肌力。殘餘肌肉鬆弛很常見,而且臨床上不容易察覺,是術後呼吸併發症的重要原因。"
    },
    {
     "h": "機轉與生理",
     "p": "neostigmine 抑制乙醯膽鹼酯酶,增加突觸間乙醯膽鹼,與肌鬆劑競爭受體;它有天花板效應,阻斷太深(TOF <4 個反應)時效果有限,需併用抗膽鹼藥(glycopyrrolate 或 atropine)抵消蕈毒鹼副作用(心搏過緩、分泌物)。sugammadex 是環糊精,在血中包覆 rocuronium 或 vecuronium 分子,使其無法作用,可在任何深度逆轉,不需要抗膽鹼藥。殘餘阻斷會降低上食道括約肌張力、咽部吞嚥協調與對低血氧的通氣反應,增加誤吸與低血氧。",
     "more": [
      "抑制劑的毒蕈鹼副作用:心搏過緩、支氣管痙攣、分泌物增加、腸蠕動增加、噁心。",
      "Pyridostigmine 用於重症肌無力的口服治療。(Morgan)"
     ]
    },
    {
     "h": "臨床處置",
     "p": [
      "拔管前以定量監測確認拇內收肌 TOF ratio ≥0.90(加速度肌動圖需達 1.0)。",
      "未使用定量監測時,neostigmine 拮抗後仍有約 30–50% 病人拔管後 TOF <0.9。",
      "neostigmine:TOF 四個反應都出現後才給,最大約 50–70 mcg/kg。",
      "sugammadex 劑量依阻斷深度:2、4、16 mg/kg;注意與荷爾蒙避孕藥交互作用(視同漏服一次)。",
      "flumazenil、naloxone 作用時間短於被拮抗藥物,需觀察再鎮靜。",
      "拮抗前評估 TOF 計數:至少出現 2–4 個反應再給 neostigmine;拮抗後以定量監測確認 TOF 比值 ≥0.9。(Morgan)",
      "Sugammadex 可結合含黃體素的口服避孕藥,育齡女性需衛教 7 天內加用其他避孕方式。(Morgan)",
      "Sugammadex 罕見過敏與心搏過緩;腎衰竭時複合物排除延遲。(Morgan)",
      "使用 sugammadex 後短時間內若需再次肌鬆,rocuronium/vecuronium 效果不佳,可改用 benzylisoquinolinium 類或 succinylcholine。(Morgan)"
     ]
    },
    {
     "h": "考試提醒",
     "p": [
      "只有定量監測能確認恢復。",
      "sugammadex 只逆轉類固醇類。",
      "neostigmine 要合併抗膽鹼藥。",
      "殘餘阻斷增加誤吸與低血氧。",
      "膽鹼酯酶抑制劑會延長 succinylcholine 作用。"
     ]
    }
   ],
   "mgx": 12
  }
 ]
});
