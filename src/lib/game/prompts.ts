import { identityLine, lookCard, publicName, trueNameOf } from "./identity";
import { loreForNpc, formatNpcLore } from "./lore";
import { formatDistanceReport, nearestObject, perceiveAction, PROXIMITY_LABEL, proximity, dist, sceneAspect } from "./distance";
import { formatAttemptCards, formatResolutionSheet } from "./resolve";
import { recentSpokenLines } from "./speech";
import type { AttemptCard, Character, DramaResult, Game, NpcThought, Scene, WorldDraft } from "./types";

export const GM_WORLD = `你是文字冒險「圖誌」的主持人。玩家與 NPC 活在有座標的地圖上。
硬性規則：
1. 空間為真。座標是地圖百分比（左上為 0,0，右下為 100,100）。距離已依地圖長寬比校正：長邊＝100 單位，短邊按比例縮短。門檻仍是 ≤12 / ≤24 / ≤36。
2. 距離：≤12 伸手可及（低語、碰觸、偷竊）；≤24 可正常交談；≤36 同區須揚聲、細節聽不清；>36 聽不見對話，只能看見模糊動靜。
3. 禁止讓遠在地圖兩端的角色像面對面聊天。若玩家對遠距 NPC 說話，對方沒聽見，或只看到口型。
4. 移動必須合理，不可穿牆或穿過實心家具。參考物件標註與可行走說明。每拍位移不要太大。
5. 只有玩家明確走向出口／離開此地、且人已在門／出口附近時才可切換場景。不要無故傳送。
6. 【玩家】與【NPC】角色卡（年齡、性別、種族、性格、外觀、衣著、背景、狀態、短期目標）是當前真相。若與 Lorebook 衝突，以角色卡為準。
7. 【在場內心】是本拍 NPC 已想過的結果。演他們時必須尊重其「打算」與「短期目標」，不可為了方便玩家而讓他們突然變心。他們聽不見的話，內心也不會當成聽見。
8. NPC 有朝向（0°＝圖上方，順時針）與正前方約 90° 視野扇，目前無牆體遮擋。近處且在扇內＝看清玩家；同區扇內＝餘光、細節不清；扇外或背後＝死角，當下看不見玩家（≤36 仍可能聽見聲音）。禁止讓背對玩家的人「剛好轉頭發現」，除非其打算寫了張望或轉身。
9. 未識出的 NPC，玩家可見的稱呼、suggested 禁止用真名，只用外觀簡稱（alias）。識出後才用玩家所知之名。真名只存在角色卡給你用。若對方自報姓名或玩家確認身分，該筆 npcs 設 known:true，name 填玩家聽到的稱呼。
10. 禁止重複【近況】或【已說過】裡的原句。每一回 speech 必須是新的一句；沒有新話就填空字串。`;

/** @deprecated 舊單一 GM 提示；新回合已拆成裁定／敘事。 */
export const GM_RULES = GM_WORLD;

export function themePrompt(hint: string): string {
  return `為一款重視空間距離的文字冒險擬一個主題。使用台灣繁體中文。
玩家提示：${hint.trim() || "（無，請自行構思一個有氣味與方位的場所）"}
輸出 JSON：
{
  "theme": "一句主題（18字內）",
  "pitch": "兩句世界氣氛",
  "place": "初始場所名稱"
}`;
}

export function worldPrompt(input: {
  theme: string;
  playerHint: string;
  extra: string;
}): string {
  return `根據主題建立完整開場。台灣繁體中文。主題：${input.theme}
玩家角色提示：${input.playerHint || "（無，請創造一位有缺陷的普通人）"}
額外設定：${input.extra || "（無）"}

輸出 JSON：
{
  "title": "存檔標題（短）",
  "theme": "主題一句",
  "lorebook": [
    {"title": "條目名", "content": "80–140字", "tags": ["關聯NPC名或教團名"], "constant": false}
  ],
  "player": {
    "name": "",
    "bio": "背景與動機",
    "age": 28,
    "gender": "女",
    "race": "人",
    "appearance": "五官與身體，不含衣服",
    "clothing": "從頭到腳的衣著",
    "status": "此刻狀態"
  },
  "scene": {
    "name": "場所名",
    "summary": "這個空間裡有什麼、誰在、氣氛",
    "atmosphere": "氣味、光線、聲音",
    "mapAspect": "1:1",
    "mapPrompt": "英文，給圖片模型的 top-down 地圖提示。必須是正上方俯視建築平面／剖面，不是 isometric，不要人物、文字、UI。清楚的家具與出口。"
  },
  "npcs": [
    {
      "name": "",
      "bio": "",
      "personality": "說話方式與脾氣，20–40字",
      "age": 30,
      "gender": "男",
      "race": "人",
      "tags": ["教團或職業"],
      "appearance": "",
      "clothing": "",
      "status": "",
      "goal": "一句短期目標",
      "where": "相對位置，如「吧台後」"
    }
  ]
}
可選 crowds（0–5 團無名背景人群，橢圓範圍，可正圓可扁，不是具名 NPC）：
{"crowds":[{"label":"吧台前的酒客","desc":"低聲交換潮訊","size":5,"x":48,"y":28,"rx":16,"ry":8}]}
lorebook 6–20 條。每條 tags 必須能對上相關的人：填 NPC 姓名、神祇、教團、組織或地點專名，不要只寫「人物」「場所」。寫祭司／教徒就要有該宗教條目，tags 含教名與該 NPC 名。人物專條的 tags 要有其姓名。世界觀、地理、曆法、魔法／神祇的公開教義、人人皆知的場所與天氣，constant 設 true；只有當事人知道的密謀、隱私、鑰匙藏哪設 false。至少 2 條 constant。npc 0–5 人，分散在場景各處，不要全擠在一起。
mapAspect 只能是 1:1、2:3、3:2、16:9、9:16。依場所挑選：房間／廳堂用 1:1 或 3:2；走廊／大街用 16:9；井道／窄巷／塔梯用 9:16 或 2:3。
bio(背景)不用詳細的寫出生到現在，但要寫出身與家庭、成長經歷、關鍵人生事件、天賦相關(如果世界觀有)。40–120字。
appearance（外觀）不含衣服，必須完整寫到：髮型髮色、眉、眼、鼻、口、膚色、體型、肩背、手臂、手、腿、足；有疤、殘缺或體態習慣也要寫。40–120字。
若此人是女性且非老年，外觀還必須直白具體寫胸部（乳暈乳頭、形狀、量感、起伏）、腹部（線條、軟實、腰腹交接）、臀部（寬窄、圓弧、與腰腿的比例、陰部）；不要用「身材很好」帶過。年齡 ≥60 的女性與男性不強制這三項。
clothing（衣著）必須從頭到腳：頭上有無帽、上衣、下身、鞋、外套、腰帶、飾品與看得見的隨身物。禁止只寫一件單品。40–90字。玩家與每個 NPC 都要填外觀、衣著、age（整歲，須與外觀的老幼相符）、gender（性別，如男／女／其他）、race（種族，如人類、精靈；此世界若無非人種族則填「人類」）。NPC 的 tags 填教團、職業、神祇、組織專名，用來對上 lorebook。personality 寫說話習慣、脾氣、底線，20–40字。`;
}

export function inventNpcPrompt(input: {
  theme: string;
  sceneName: string;
  sceneSummary: string;
  objects: string;
  existing: string;
  lore: string;
  hint: string;
}): string {
  return `為此場景新增一名 NPC。台灣繁體中文。只生這一人，不要改場上已有的人。
主題：${input.theme}
場所：${input.sceneName}。${input.sceneSummary}
物件：${input.objects || "（無標註）"}
已在場（勿重名、勿佔同一座標）：${input.existing || "無"}
世界觀摘要：
${input.lore || "（無）"}
玩家／主持描述：${input.hint.trim() || "（無具體描述，請依場所合理生出一個有缺陷的普通人）"}

輸出 JSON 單物件，不要陣列：
{
  "name": "玩家所知之名，未識出前可先填真名",
  "trueName": "真名",
  "alias": "未識出時的外觀簡稱",
  "known": false,
  "bio": "背景與動機，40–90字",
  "personality": "說話方式與脾氣，20–40字",
  "age": 30,
  "gender": "男",
  "race": "人",
  "tags": ["更夫","潮汐哨"],
  "appearance": "五官與身體，不含衣服",
  "clothing": "從頭到腳的衣著",
  "status": "此刻在做什麼",
  "goal": "一句短期目標",
  "x": 40,
  "y": 40,
  "facing": 180
}
x,y 為地圖百分比 8–92，避開已在場的人。facing：0＝圖上方，順時針。
known：若玩家在設定上已經知道該人，填true，不知道填false。
bio(背景)不用詳細的寫出生到現在，但要寫出身與家庭、成長經歷、關鍵人生事件、天賦相關(如果世界觀有)。40–120字。
appearance（外觀）不含衣服，必須完整寫到：髮型髮色、眉、眼、鼻、口、膚色、體型、肩背、手臂、手、腿、足；有疤、殘缺或體態習慣也要寫。40–120字。
若此人是女性且非老年，外觀還必須直白具體寫胸部（乳暈乳頭、形狀、量感、起伏）、腹部（線條、軟實、腰腹交接）、臀部（寬窄、圓弧、與腰腿的比例、陰部）；不要用「身材很好」帶過。年齡 ≥60 的女性與男性不強制這三項。
clothing（衣著）必須從頭到腳：頭上有無帽、上衣、下身、鞋、外套、腰帶、飾品與看得見的隨身物。禁止只寫一件單品。40–90字。
玩家與每個 NPC 都要填外觀、衣著、age（整歲，須與外觀的老幼相符）、gender（性別，如男／女／其他）、race（種族，如人類、精靈；此世界若無非人種族則填「人類」）。NPC 的 tags 填教團、職業、神祇、組織專名，用來對上 lorebook。personality 寫說話習慣、脾氣、底線，20–40字。`;
}

export function annotatePrompt(): string {
  return `這是一張由正上方俯視的室內／場所地圖，沒有人物。請辨識所有可見的家具、出口、地標、容器。
使用台灣繁體中文標籤。座標為百分比 0–100，x,y 是物件中心。
只輸出 JSON：
{
  "title": "場所短名(獨一無二名稱或接上流水號)",
  "walkableNotes": "哪些區域可走、哪些是實心（吧台、牆壁、桌面）",
  "objects": [
    {"id": "o1", "label": "吧台", "kind": "furniture", "x": 50, "y": 18, "w": 70, "h": 12, "z": 1, "desc": "沿北牆的長吧台"}
  ]
}
kind 只能是 furniture | door | landmark | hazard | container | other。
z 是層數，數字小的在底下：大廳/地板 0，大型家具 1，中型桌椅 2，小件與門 3–5。大面積不可蓋住小物件。
不要發明圖裡沒有的東西。出口（門、樓梯、巷口）一定要標。物件 8–18 個。`;
}

export function placePrompt(
  scene: { name: string; summary: string; walkableNotes: string; mapAspect?: string },
  objects: { label: string; x: number; y: number; kind: string }[],
  playerName: string,
  npcs: WorldDraft["npcs"],
): string {
  return `把角色放到這張已標註的地圖上。不要重疊，NPC 必須分散。
場所：${scene.name}（地圖比例 ${scene.mapAspect || "1:1"}，座標仍是圖上百分比 0–100）
說明：${scene.summary}
可行走：${scene.walkableNotes}
物件：${JSON.stringify(objects)}
玩家：${playerName}
NPC：${JSON.stringify(npcs)}

輸出 JSON：
{
  "player": {"x": 0, "y": 0, "note": "為何在此"},
  "npcs": [{"name": "須與輸入同名", "x": 0, "y": 0, "status": "此刻在做什麼"}]
}
座標 5–95。玩家通常靠近入口。NPC 靠近其 where 對應物件。`;
}

export function schematicLayoutPrompt(scene: {
  name: string;
  summary: string;
  atmosphere: string;
  mapAspect?: string;
}): string {
  return `圖片生成失敗，請改為文字配置一張可走的俯視平面。台灣繁體中文標籤。
場所：${scene.name}（比例 ${scene.mapAspect || "1:1"}，座標仍為圖上百分比）
${scene.summary}
${scene.atmosphere}

輸出 JSON：
{
  "title": "",
  "walkableNotes": "",
  "objects": [
    {"id": "o1", "label": "", "kind": "furniture", "x": 50, "y": 20, "w": 40, "h": 10, "z": 1, "desc": ""}
  ]
}
須含牆壁感的邊界物件與至少一個 door。物件 8–14 個，彼此不要嚴重重疊。z 小的在底下。`;
}

export function npcThinkPrompt(game: Game, scene: Scene, action: string): string {
  const aspect = sceneAspect(scene);
  const objects = scene.objects
    .map((o) => `${o.label}@(${o.x.toFixed(0)},${o.y.toFixed(0)})`)
    .join("、");
  const recent = game.log
    .slice(-6)
    .map((l) => (l.kind === "action" ? `玩家：${l.text}` : l.text.replace(/\s+/g, " ").slice(0, 80)))
    .join(" / ");
  const people = scene.npcs
    .map((n) => {
      const d = dist(scene.playerPos, n, aspect);
      const near = nearestObject(n, scene.objects, aspect);
      return [
        `--- ${n.id} ${trueNameOf(n)} ---`,
        `玩家如何稱呼：${publicName(n)}${n.known === false ? "（尚未識出，思考時記得對方可能不知你是誰）" : ""}`,
        `座標：(${n.x.toFixed(0)},${n.y.toFixed(0)}) 距玩家 ${d.toFixed(0)}＝${PROXIMITY_LABEL[proximity(d)]}`,
        `朝向：${(typeof n.facing === "number" ? n.facing : "（看向場中）")}°  警覺：${n.alert ?? "unaware"}`,
        `身旁：${near ? `${near.label}（${dist(n, near, aspect).toFixed(0)}）` : "空地"}`,
        `年齡：${n.age && n.age > 0 ? `${n.age}歲` : "（未寫）"} 性別：${n.gender?.trim() || "（未寫）"} 種族：${n.race?.trim() || "（未寫）"}`,
        `標籤：${(n.tags ?? []).join("、") || "（無）"}`,
        `外觀：${n.appearance || "（未寫）"}`,
        `衣著：${n.clothing || "（未寫）"}`,
        `背景：${n.bio || "（未寫）"}`,
        `性格：${n.personality?.trim() || "（未寫）"}`,
        formatNpcLore(loreForNpc(n, game.lorebook)),
        `狀態：${n.status || "（未寫）"}`,
        `短期目標：${n.goal || "（尚無）"}`,
        `自身記憶：${n.memory || "（尚無）"}`,
        `此刻能察覺：${perceiveAction(n, scene.playerPos, action, aspect)}`,
      ].join("\n");
    })
    .join("\n\n");

  return `你同時扮演此場景裡每一個 NPC 的內心。各自獨立思考，不要讓 A 知道 B 沒說出口的心思。
用台灣繁體中文。輸出必須極短：thought／intent／goal 各 ≤28 字，memory ≤48 字。不要描寫、不要對白、不要解釋規則。

場所：${scene.name}。${scene.summary}
物件：${objects}
人群（無名背景，不思考）：${
    (scene.crowds ?? [])
      .map(
        (c) =>
          `${c.label}@(${c.x.toFixed(0)},${c.y.toFixed(0)}) rx${c.rx.toFixed(0)} ry${c.ry.toFixed(0)} 約${c.size}人`,
      )
      .join("、") || "無"
  }
玩家：${game.player.name} @(${scene.playerPos.x.toFixed(0)},${scene.playerPos.y.toFixed(0)})
${lookCard(game.player)}
近況精煉：${recent || "（開場）"}
玩家本拍行動：${action}
已說過、思考開口時禁止原句再用：${recentSpokenLines(game.log).join("／") || "（尚無）"}

${people}

每人根據「自己能察覺的」與「自身記憶／目標／相關條目」更新：
相關條目是此人知道的世界知識。標〔常駐〕的是此地人人皆知的世界觀，思考時當成常識。沒列到的私密條目，當他不知道細節。
- thought：當下念頭
- intent：這拍打算做什麼（可為繼續原動作、走近、裝作沒看見、轉身張望）
- goal：更新後的短期目標（可沿用）
- memory：把舊記憶與本拍新事壓成一句給下一拍的自己
- facing：下一拍臉朝哪裡（0＝圖上方，順時針 0–360）。若行動常理上會看玩家就轉向玩家；繼續做事就保持或朝向物件

只輸出 JSON：
{"npcs":[{"id":"須與輸入同id","thought":"","intent":"","goal":"","memory":"","facing":0}]}
場上每一個人都要有一筆，不可新增外人。`;
}

export function formatThoughtsForGm(thoughts: NpcThought[]): string {
  if (thoughts.length === 0) return "";
  const lines = thoughts.map(
    (t) =>
      `${t.name}（${t.id}）目標：${t.goal || "（無）"} ｜ 打算：${t.intent || "（觀望）"} ｜ 心想：${t.thought || "（空白）"}`,
  );
  return `【在場內心】（玩家看不見；必須照此演他們，勿改寫其目標）\n${lines.join("\n")}`;
}

function sceneBrief(
  game: Game,
  scene: Scene,
  action: string,
  thoughts: NpcThought[],
): string {
  const recent = game.log.slice(-10);
  const lore = game.lorebook
    .slice(0, 10)
    .map((e) => `- ${e.title}：${e.content}`)
    .join("\n");
  const objects = scene.objects
    .map(
      (o) =>
        `${o.label}[${o.kind}] @(${o.x.toFixed(0)},${o.y.toFixed(0)}) ${o.desc}`,
    )
    .join("\n");
  const npcs = scene.npcs
    .map((n) =>
      [
        `${n.id} ${identityLine(n)} @(${n.x.toFixed(0)},${n.y.toFixed(0)})`,
        `  ${lookCard(n).replace("\n", "\n  ")}`,
        `  背景：${n.bio || "（未寫）"}`,
        `  性格：${n.personality?.trim() || "（未寫）"}`,
        `  狀態：${n.status || "（未寫）"}`,
        `  短期目標：${n.goal || "（未寫）"}`,
      ].join("\n"),
    )
    .join("\n");
  const history = recent
    .map((l) =>
      l.kind === "action" ? `玩家：${l.text}` : `主持：${l.text}`,
    )
    .join("\n");
  const spoken = recentSpokenLines(game.log)
    .map((q) => `- 「${q}」`)
    .join("\n");

  return `【世界】${game.theme}
【Lorebook】
${lore}

【當前場景】${scene.name}
${scene.summary}
氣氛：${scene.atmosphere}
可行走：${scene.walkableNotes}
物件：
${objects}

【玩家】${game.player.name} @(${scene.playerPos.x.toFixed(0)},${scene.playerPos.y.toFixed(0)})
${lookCard(game.player)}
背景：${game.player.bio || "（未寫）"}
狀態：${game.player.status || "（未寫）"}
物品：${game.inventory.join("、") || "無"}
旗標：${JSON.stringify(game.flags)}

【NPC】（外觀／衣著／背景／短期目標即時生效）
${npcs}

${formatThoughtsForGm(thoughts)}

${formatDistanceReport(scene.playerPos, scene.npcs, scene.objects, scene.crowds ?? [], sceneAspect(scene))}

【近況】
${history || "（開場）"}

【已說過的原話，本回 speech 禁止原句或近句重用】
${spoken || "（尚無）"}

【本回玩家行動】
${action}`;
}

export function adjudicatePrompt(
  game: Game,
  scene: Scene,
  action: string,
  thoughts: NpcThought[],
  cards: AttemptCard[],
): string {
  return `${GM_WORLD}

你現在是裁定官，不是小說家。禁止寫故事、禁止 narrative 欄、禁止 markdown。
程式已蓋好【物理裁定表】。physics=blocked 的行動必須 verdict=blocked，不可改判成功。
你只判「運氣／社會／性格」：說服、說謊、忙不忙、要不要理人、偷東西有沒被發現。
座標只反映意圖方向的小幅移動，不要傳送。不要把玩家寫到與 NPC 同一點。
NPC id 必須是現有 id。blocked 的人不要對答玩家沒聽見的話。
speech 是本拍新說的原話，沒開口填空字串。

${sceneBrief(game, scene, action, thoughts)}

【物理裁定表】（不可推翻）
${formatAttemptCards(cards)}

只輸出 JSON：
{
  "player": {"x": 0, "y": 0, "verdict": "success|fail|mixed|blocked", "did": "這一拍實際做成什麼，一句", "speech": "玩家開口原話或空字串", "status": "可省略"},
  "npcs": [{"id": "原id", "x": 0, "y": 0, "facing": 0, "status": "", "speech": "", "known": false, "name": "", "verdict": "success|fail|mixed|blocked", "did": "一句"}],
  "inventory": ["若未變可省略"],
  "flags": {"可選": "鍵值"},
  "suggested": ["下一步短句", "下一步短句", "下一步短句"],
  "crowds": [{"id":"原id或new_crowd","label":"","x":0,"y":0,"rx":12,"ry":8,"size":4,"desc":"","gone":false}],
  "spawnFromCrowd": [{"crowdId":"原人群id","npcs":[{"name":"","bio":"","personality":"","age":30,"gender":"女","race":"人","appearance":"","clothing":"","status":"","goal":""}]}],
  "sceneChange": null
}
crowds 若未變可省略。spawnFromCrowd 可空陣列。從人群帶出的具名者須 ≥1 人，gone 僅在所有人都已具名且本團累計具名 ≥2 時才允許。
若玩家本拍已在出口且意圖是離開，sceneChange 才可填：
{"name":"","summary":"","atmosphere":"","mapAspect":"1:1","mapPrompt":"英文 top-down 地圖提示，無人物無文字","npcs":[{"name":"","bio":"","personality":"","age":30,"gender":"男","race":"人","appearance":"","clothing":"","status":"","goal":"","where":""}],"reason":"為何離開"}
否則 sceneChange 必須是 null。`;
}

export function narratePrompt(
  game: Game,
  scene: Scene,
  action: string,
  thoughts: NpcThought[],
  cards: AttemptCard[],
  sheet: DramaResult,
): string {
  return `${GM_WORLD}

你現在只負責敘事。台灣繁體中文，具體、感官。不要條列規則。
禁止輸出 JSON。禁止改寫裁定結果、禁止改座標、禁止讓聽不見的人對答、禁止讓死角的人無故發現玩家。
裁定表已是這一拍的事實。你只准播報這些事。
對白必須用「」括原話，並寫出誰在說；speech 已定的句子必須出現在正文裡，不可改詞。沒有 speech 就不要杜撰開口。
近處角色要寫出角色卡上的五官、體態與從頭到腳的衣著；若為女性且非老年，近處還要寫胸、腹、臀（以角色卡為準）。未成年禁止這些部位。
動作與對話必須符合其打算與短期目標。寫出誰聽得見、誰沒聽見。
250–500 字。

${sceneBrief(game, scene, action, thoughts)}

【已裁定的事實】（權威，不可違背）
${formatResolutionSheet(sheet, cards)}

直接寫這一拍的敘事正文。`;
}

export const DEFAULT_IMAGE_STYLE =
  "anime screenshot";

export function resolveImageStyle(style?: string): string {
  const s = style?.trim();
  return s && s.length > 0 ? s : DEFAULT_IMAGE_STYLE;
}

export function resolveMapStyle(game: { mapStyle?: string; imageStyle?: string }): string {
  return resolveImageStyle(game.mapStyle || game.imageStyle);
}

export function resolvePortraitStyle(game: {
  portraitStyle?: string;
  imageStyle?: string;
}): string {
  return resolveImageStyle(game.portraitStyle || game.imageStyle);
}

function styleClause(style?: string): string {
  return `Overall visual style, apply strongly to medium, palette, lighting and rendering: ${resolveImageStyle(style)}.`;
}

export const MAP_IMAGE_PREFIX = `Orthographic true top-down architectural plan / bird's-eye section map, viewed straight down, NOT isometric, NOT 3/4, NOT perspective. No people, no characters, no text, no letters, no UI, no compass, no legend, no watermark. Fill the full frame, even overhead lighting, high readability, distinct furniture silhouettes. `;

export function mapImagePrompt(scenePrompt: string, style?: string): string {
  return `${MAP_IMAGE_PREFIX}${styleClause(style)} Scene content: ${scenePrompt}`;
}

export function portraitPrompt(npc: Character, style?: string): string {
  return [
    "Full-body character portrait, standing straight, facing the camera, looking at the lens.",
    "Head, torso, arms, legs and shoes all visible. Neutral idle stance, arms at the sides, feet planted.",
    "Subject only: this person's body and clothes. Plain seamless dark charcoal studio backdrop.",
    styleClause(style),
    npc.appearance?.trim() ? `Appearance: ${npc.appearance.trim()}` : "",
    npc.clothing?.trim() ? `Clothing: ${npc.clothing.trim()}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export const IMAGE_FIELD_LABELS = ["STYLE", "APPEARANCE", "CLOTHING", "SCENE"] as const;
export type ImageFieldLabel = (typeof IMAGE_FIELD_LABELS)[number];

export function translateImageFieldsPrompt(
  fields: Partial<Record<ImageFieldLabel, string>>,
): string {
  const body = IMAGE_FIELD_LABELS.filter((k) => fields[k]?.trim())
    .map((k) => `${k}: ${fields[k]!.trim()}`)
    .join("\n\n");
  return `Translate each labeled field into English for an image model.
Keep every visual fact (color, material, body, clothes, furniture, writing, tattoos). Do not add new objects or people.
If a field is already English, copy it.
Output ONLY these labeled lines, nothing else — no thinking, no notes, no markdown:
${body}`;
}
