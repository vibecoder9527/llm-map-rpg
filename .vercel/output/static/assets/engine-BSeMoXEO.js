import{J as e,K as t,h as n,n as r,t as i}from"./utils-d9bDBB9q.js";import{a,n as o,t as s,u as c}from"./functions-BjE1_nVT.js";import{n as l}from"./dist-CjlbW1cG.js";var u=e(t(),1),d=Object.defineProperty,f=(e,t)=>d(e,`name`,{value:t,configurable:!0}),p=u.useId||(()=>void 0),m=0;function h(e){let[t,n]=u.useState(p());return l(()=>{e||n(e=>e??String(m++))},[e]),e||(t?`radix-${t}`:``)}f(h,`useId`);var g=Object.defineProperty,ee=(e,t)=>g(e,`name`,{value:t,configurable:!0}),_=u.useEffectEvent,v=u.useInsertionEffect;function y(e){if(typeof _==`function`)return _(e);let t=u.useRef(()=>{throw Error(`Cannot call an event handler while rendering.`)});return typeof v==`function`?v(()=>{t.current=e}):l(()=>{t.current=e}),u.useMemo(()=>((...e)=>t.current?.(...e)),[])}ee(y,`useEffectEvent`);var b=Object.defineProperty,x=(e,t)=>b(e,`name`,{value:t,configurable:!0}),te=u.useInsertionEffect||l;function S({prop:e,defaultProp:t,onChange:n=x(()=>{},`onChange`),caller:r}){let[i,a,o]=C({defaultProp:t,onChange:n}),s=e!==void 0;return[s?e:i,u.useCallback(t=>{if(s){let n=w(t)?t(e):t;n!==e&&o.current?.(n)}else a(t)},[s,e,a,o])]}x(S,`useControllableState`);function C({defaultProp:e,onChange:t}){let[n,r]=u.useState(e),i=u.useRef(n),a=u.useRef(t);return te(()=>{a.current=t},[t]),u.useEffect(()=>{i.current!==n&&(a.current?.(n),i.current=n)},[n,i]),[n,r,a]}x(C,`useUncontrolledState`);function w(e){return typeof e==`function`}x(w,`isFunction`);var T=Symbol(`RADIX:SYNC_STATE`);function ne(e,t,n,r){let{prop:i,defaultProp:a,onChange:o,caller:s}=t,c=i!==void 0,l=y(o),d=[{...n,state:a}];r&&d.push(r);let[f,p]=u.useReducer((t,n)=>{if(n.type===T)return{...t,state:n.state};let r=e(t,n);return c&&!Object.is(r.state,t.state)&&l(r.state),r},...d),m=f.state,h=u.useRef(m);u.useEffect(()=>{h.current!==m&&(h.current=m,c||l(m))},[m,h,c]);let g=u.useMemo(()=>i===void 0?f:{...f,state:i},[f,i]);return u.useEffect(()=>{c&&!Object.is(i,f.state)&&p({type:T,state:i})},[i,f.state,c]),[g,p]}x(ne,`useControllableStateReducer`);var E=n(),D=u.forwardRef(({className:e,...t},n)=>(0,E.jsx)(`textarea`,{className:i(`flex min-h-24 w-full rounded-lg border border-input bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 disabled:cursor-not-allowed disabled:opacity-50`,e),ref:n,...t}));D.displayName=`Textarea`;var re=[`撰寫世界`,`繪製地圖`,`辨識場景物件`,`配置平面`,`安置人物`,`推演這一回`,`進入新場景`];function O({stage:e,detail:t}){return(0,E.jsx)(`div`,{className:`fixed inset-0 z-40 flex items-center justify-center bg-background/80 px-6`,children:(0,E.jsxs)(`div`,{className:`w-full max-w-sm rounded-xl border border-border bg-card p-6`,children:[(0,E.jsxs)(`div`,{className:`mb-4 flex items-center gap-2 text-sm text-muted-foreground`,children:[(0,E.jsx)(c,{className:`size-4 animate-spin`}),`進行中`]}),(0,E.jsx)(`p`,{className:`font-display text-xl`,children:e}),t?(0,E.jsx)(`p`,{className:`mt-2 text-sm text-muted-foreground`,children:t}):(0,E.jsx)(`div`,{className:`mt-3 h-3 w-2/3 rounded-sm shimmer`}),(0,E.jsx)(`ul`,{className:`mt-6 space-y-1.5 text-xs text-muted-foreground`,children:re.filter(e=>[`撰寫世界`,`繪製地圖`,`辨識場景物件`,`安置人物`,`推演這一回`,`進入新場景`].includes(e)).map(t=>(0,E.jsxs)(`li`,{className:t===e?`text-foreground`:`opacity-40`,children:[t===e?`●`:`○`,` `,t]},t))})]})})}function k(e){let t=e.trim(),n=(t.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1]??t).trim(),r=n.indexOf(`{`),i=n.indexOf(`[`),a=-1;if(a=r<0?i:i<0?r:Math.min(r,i),a<0)throw Error(`模型沒有回傳 JSON`);let o=n[a]===`[`?`]`:`}`,s=n.lastIndexOf(o);if(s<a)throw Error(`模型 JSON 不完整`);try{return JSON.parse(n.slice(a,s+1))}catch{throw Error(`模型 JSON 無法解析`)}}function A(e,t){let n=typeof e==`number`?e:Number(e);return Number.isFinite(n)?n:t}function j(e,t=``){return typeof e==`string`?e:t}var M={adjacent:12,near:24,sameArea:52,distant:72};function N(e,t){return Math.hypot(e.x-t.x,e.y-t.y)}function P(e){return e<=M.adjacent?`adjacent`:e<=M.near?`near`:e<=M.sameArea?`same-area`:e<=M.distant?`distant`:`far`}var F={adjacent:`伸手可及`,near:`近處可談`,"same-area":`同區須揚聲`,distant:`遠處只見人影`,far:`遠在地圖另一端`};function I(e,t){if(t.length===0)return null;let n=t[0],r=N(e,n);for(let i=1;i<t.length;i++){let a=N(e,t[i]);a<r&&(n=t[i],r=a)}return n}function ie(e,t,n){let r=[];r.push(`【座標與距離】玩家座標為百分比，原點在地圖左上。`),r.push(`玩家：(${e.x.toFixed(0)}, ${e.y.toFixed(0)})`);let i=I(e,n);i&&r.push(`最近物件：${i.label}（距 ${N(e,i).toFixed(0)}）`);for(let n of t){let t=N(e,n);r.push(`${n.name}：(${n.x.toFixed(0)}, ${n.y.toFixed(0)}) 距離 ${t.toFixed(0)}＝${F[P(t)]}`)}return r.push(`規則：≤12 可碰觸／低語；≤24 可正常交談；≤52 同區須揚聲且細節不清；>52 聽不見對話。`),r.join(`
`)}var ae=`你是文字冒險「圖誌」的主持人。玩家與 NPC 活在有座標的地圖上。
硬性規則：
1. 空間為真。座標是地圖百分比（左上為 0,0，右下為 100,100）。
2. 距離：≤12 伸手可及（低語、碰觸、偷竊）；≤24 可正常交談；≤52 同區須揚聲、細節聽不清；>52 聽不見對話，只能看見模糊動靜。
3. 禁止讓遠在地圖兩端的角色像面對面聊天。若玩家對遠距 NPC 說話，敘事必須寫出對方沒聽見、或只看到口型。
4. 移動必須合理，不可穿牆或穿過實心家具。參考物件標註與可行走說明。
5. 只有玩家明確走向出口／離開此地時才可切換場景。不要無故傳送。
6. 敘事使用台灣繁體中文，克制、具體、感官；不要條列遊戲規則給玩家看。
7. 只輸出 JSON，不要 markdown。`;function L(e){return`為一款重視空間距離的文字冒險擬一個主題。使用台灣繁體中文。
玩家提示：${e.trim()||`（無，請自行構思一個有氣味與方位的場所）`}
輸出 JSON：
{
  "theme": "一句主題（18字內）",
  "pitch": "兩句世界氣氛",
  "place": "初始場所名稱"
}`}function R(e){return`根據主題建立完整開場。台灣繁體中文。主題：${e.theme}
玩家角色提示：${e.playerHint||`（無，請創造一位有缺陷的普通人）`}
額外設定：${e.extra||`（無）`}

輸出 JSON：
{
  "title": "存檔標題（短）",
  "theme": "主題一句",
  "lorebook": [
    {"title": "條目名", "content": "80–140字", "tags": ["tag"]}
  ],
  "player": {
    "name": "",
    "bio": "背景與動機",
    "appearance": "外觀，不含座標",
    "status": "此刻狀態"
  },
  "scene": {
    "name": "場所名",
    "summary": "這個空間裡有什麼、誰在、氣氛",
    "atmosphere": "氣味、光線、聲音",
    "mapPrompt": "英文，給圖片模型的 top-down 地圖提示。必須是正上方俯視建築平面／剖面，不是 isometric，不要人物、文字、UI。清楚的家具與出口。"
  },
  "npcs": [
    {
      "name": "",
      "bio": "",
      "appearance": "",
      "status": "",
      "where": "相對位置，如「吧台後」"
    }
  ]
}
lorebook 6–10 條。npc 2–4 人，分散在場景各處，不要全擠在一起。`}function z(){return`這是一張由正上方俯視的室內／場所地圖，沒有人物。請辨識所有可見的家具、出口、地標、容器。
使用台灣繁體中文標籤。座標為百分比 0–100，x,y 是物件中心。
只輸出 JSON：
{
  "title": "場所短名",
  "walkableNotes": "哪些區域可走、哪些是實心（吧台、牆壁、桌面）",
  "objects": [
    {"id": "o1", "label": "吧台", "kind": "furniture", "x": 50, "y": 18, "w": 70, "h": 12, "desc": "沿北牆的長吧台"}
  ]
}
kind 只能是 furniture | door | landmark | hazard | container | other。
不要發明圖裡沒有的東西。出口（門、樓梯、巷口）一定要標。物件 8–18 個。`}function B(e,t,n,r){return`把角色放到這張已標註的地圖上。不要重疊，NPC 必須分散。
場所：${e.name}
說明：${e.summary}
可行走：${e.walkableNotes}
物件：${JSON.stringify(t)}
玩家：${n}
NPC：${JSON.stringify(r)}

輸出 JSON：
{
  "player": {"x": 0, "y": 0, "note": "為何在此"},
  "npcs": [{"name": "須與輸入同名", "x": 0, "y": 0, "status": "此刻在做什麼"}]
}
座標 5–95。玩家通常靠近入口。NPC 靠近其 where 對應物件。`}function V(e){return`圖片生成失敗，請改為文字配置一張可走的俯視平面。台灣繁體中文標籤。
場所：${e.name}
${e.summary}
${e.atmosphere}

輸出 JSON：
{
  "title": "",
  "walkableNotes": "",
  "objects": [
    {"id": "o1", "label": "", "kind": "furniture", "x": 50, "y": 20, "w": 40, "h": 10, "desc": ""}
  ]
}
須含牆壁感的邊界物件與至少一個 door。物件 8–14 個，彼此不要嚴重重疊。`}function H(e,t,n){let r=e.log.slice(-10),i=e.lorebook.slice(0,10).map(e=>`- ${e.title}：${e.content}`).join(`
`),a=t.objects.map(e=>`${e.label}[${e.kind}] @(${e.x.toFixed(0)},${e.y.toFixed(0)}) ${e.desc}`).join(`
`),o=t.npcs.map(e=>`${e.id} ${e.name} @(${e.x.toFixed(0)},${e.y.toFixed(0)}) 狀態：${e.status}／${e.bio}`).join(`
`),s=r.map(e=>e.kind===`action`?`玩家：${e.text}`:`主持：${e.text}`).join(`
`);return`${ae}

【世界】${e.theme}
【Lorebook】
${i}

【當前場景】${t.name}
${t.summary}
氣氛：${t.atmosphere}
可行走：${t.walkableNotes}
物件：
${a}

【玩家】${e.player.name} @(${t.playerPos.x.toFixed(0)},${t.playerPos.y.toFixed(0)})
${e.player.bio}
物品：${e.inventory.join(`、`)||`無`}
旗標：${JSON.stringify(e.flags)}

【NPC】
${o}

${ie(t.playerPos,t.npcs,t.objects)}

【近況】
${s||`（開場）`}

【本回玩家行動】
${n}

只輸出 JSON：
{
  "narrative": "本回敘事，200–450字。若有人說話，寫出誰聽得見。",
  "player": {"x": 0, "y": 0},
  "npcs": [{"id": "原id", "x": 0, "y": 0, "status": "", "speech": "可選，僅在對方聽得見時"}],
  "inventory": ["若未變可省略"],
  "flags": {"可選": "鍵值"},
  "suggested": ["下一步短句", "下一步短句", "下一步短句"],
  "sceneChange": null
}
若玩家離開此地，sceneChange 改為：
{"name":"","summary":"","atmosphere":"","mapPrompt":"英文 top-down 地圖提示，無人物無文字","npcs":[{"name":"","bio":"","appearance":"","status":"","where":""}],"reason":"為何離開"}
npc 的 id 必須是現有 id。可讓 NPC 小幅走動。玩家座標應反映行動（走向某處就更新）。`}var U=`Orthographic true top-down architectural plan / bird's-eye section map, viewed straight down, NOT isometric, NOT 3/4, NOT perspective. No people, no characters, no text, no letters, no UI, no compass, no legend, no watermark. Square composition, even overhead lighting, high readability, distinct furniture silhouettes, muted ink-and-parchment cartography palette (aged paper, dark wood, stone). `,W={furniture:`#3a342c`,door:`#4a4034`,landmark:`#2f3330`,hazard:`#3a2a28`,container:`#33302c`,other:`#323232`};function G(e,t){let n=document.createElement(`canvas`);n.width=768,n.height=768;let r=n.getContext(`2d`);if(!r)return``;r.fillStyle=`#1a1814`,r.fillRect(0,0,768,768),r.strokeStyle=`rgba(236,236,232,0.05)`,r.lineWidth=1;for(let e=0;e<=10;e++){let t=e/10*768;r.beginPath(),r.moveTo(t,0),r.lineTo(t,768),r.stroke(),r.beginPath(),r.moveTo(0,t),r.lineTo(768,t),r.stroke()}r.strokeStyle=`rgba(236,236,232,0.18)`,r.lineWidth=10,r.strokeRect(18,18,732,732);for(let t of e){let e=Math.max(24,t.w/100*768),n=Math.max(24,t.h/100*768),i=t.x/100*768-e/2,a=t.y/100*768-n/2;r.fillStyle=W[t.kind]??W.other,r.fillRect(i,a,e,n),r.strokeStyle=`rgba(236,236,232,0.22)`,r.lineWidth=1.5,r.strokeRect(i,a,e,n),r.fillStyle=`rgba(236,236,232,0.72)`,r.font=`12px sans-serif`,r.textAlign=`center`,r.textBaseline=`middle`,r.fillText(t.label,i+e/2,a+n/2,e-8)}return r.fillStyle=`rgba(236,236,232,0.35)`,r.font=`13px serif`,r.textAlign=`left`,r.textBaseline=`top`,r.fillText(t,28,28),n.toDataURL(`image/jpeg`,.86)}var K=[{id:`door`,label:`南門`,kind:`door`,x:50,y:93,w:14,h:8,desc:`朝南的雙開木門，通往雨濕的街道`},{id:`bar`,label:`長吧台`,kind:`furniture`,x:50,y:16,w:72,h:14,desc:`沿北牆的深色長吧台，瓶架與銅龍頭`},{id:`stools`,label:`吧凳`,kind:`furniture`,x:48,y:27,w:50,h:8,desc:`一排面向吧台的圓凳`},{id:`fireplace`,label:`石壁爐`,kind:`landmark`,x:12,y:48,w:16,h:22,desc:`西牆巨大石砌壁爐，火光還在`},{id:`rug`,label:`爐前毯`,kind:`furniture`,x:24,y:50,w:14,h:16,desc:`壁爐前磨舊的織毯`},{id:`table-fire`,label:`爐邊圓桌`,kind:`furniture`,x:38,y:44,w:14,h:14,desc:`靠近壁爐的圓桌與椅`},{id:`table-mid`,label:`中央圓桌`,kind:`furniture`,x:52,y:52,w:14,h:14,desc:`廳中央的圓桌`},{id:`table-east`,label:`東側圓桌`,kind:`furniture`,x:64,y:46,w:13,h:13,desc:`偏東的圓桌`},{id:`table-south`,label:`近門圓桌`,kind:`furniture`,x:46,y:68,w:13,h:13,desc:`靠近南門的圓桌`},{id:`stairs`,label:`上樓梯`,kind:`door`,x:84,y:80,w:16,h:18,desc:`東南角木梯，通往客房`},{id:`barrels`,label:`酒桶堆`,kind:`container`,x:84,y:20,w:16,h:16,desc:`東北角酒桶與木箱`},{id:`kitchen`,label:`廚房傳菜口`,kind:`landmark`,x:18,y:12,w:14,h:10,desc:`西北角通往廚房的傳菜口`}];function q(){let e=Date.now(),t=`scene_tavern`;return{version:1,id:`game_sample_${e}`,title:`雨夜〈北風亭〉`,theme:`港口雨夜，一家不肯打烊的旅店`,createdAt:e,updatedAt:e,turnCount:0,lorebook:[{id:`lb1`,title:`北風亭`,content:`開在舊碼頭第三街的木造旅店。招牌被風吹歪，可爐火從不熄。水手、更夫、躲債的人都來這裡把聲音壓低。`,tags:[`場所`]},{id:`lb2`,title:`今晚的雨`,content:`雨從黃昏下到現在。街上的油燈只剩兩盞，碼頭吊車停著。有人說潮水比月曆提早了一尺。`,tags:[`天氣`]},{id:`lb3`,title:`阿秋`,content:`吧台後的老闆娘。左手缺半截小指，調酒時用銅量杯敲桌沿計時。不喜歡有人問她以前在船上做什麼。`,tags:[`人物`]},{id:`lb4`,title:`禁問的房間`,content:`樓上 3 號房從上週起一直亮著燈，可鑰匙在阿秋圍裙裡。沒人被允許送熱水上去。`,tags:[`謎`]},{id:`lb5`,title:`潮汐哨`,content:`更夫用的銅哨，吹兩短一長代表「潮來了」。今晚還沒有人吹過。`,tags:[`物件`]}],player:{id:`player`,name:`林拾`,role:`player`,bio:`剛下船的記帳助手，懷裡有一封不該拆的信，要在黎明前交給「聽得見潮聲的人」。`,appearance:`深色短襖，袖口鹽白，肩上還在滴水。`,color:`#f4f1ea`,x:50,y:82,status:`剛推門進來，雨水還在下巴。`},inventory:[`未拆的油紙信`,`半包受潮的菸`],flags:{letter:`未拆`},scenes:{[t]:{id:t,name:`北風亭·一樓`,summary:`木造旅店一樓。北牆長吧台，西牆壁爐，東南角樓梯，南門通往雨街。廳裡有幾張圓桌，人不多，可空氣很滿。`,atmosphere:`濕羊毛、炭火、廉價酒。雨打在門板上像有人用指節敲門。`,mapImage:`/maps/tavern.jpg`,mapSource:`sample`,walkableNotes:`中央地板與桌間走道可走。吧台表面、壁爐石座、酒桶堆、桌面不可穿。南門可出街，東南梯可上樓。`,objects:K,playerPos:{x:50,y:82},npcs:[{id:`npc_qiu`,name:`阿秋`,role:`npc`,bio:`北風亭老闆娘，缺半截小指，聲音不高。`,appearance:`深褐圍裙，髮用銅簪挽著。`,color:`#a67c6d`,x:52,y:14,status:`在吧台後擦一只量杯，沒抬頭。`},{id:`npc_hou`,name:`老侯`,role:`npc`,bio:`退休的碼頭書記，每晚佔壁爐旁那桌，聽雨勝過人話。`,appearance:`灰色圍巾，眼鏡起霧。`,color:`#7d9aa3`,x:36,y:44,status:`坐在爐邊圓桌，杯沿對準壁爐。`},{id:`npc_qing`,name:`阿青`,role:`npc`,bio:`巡夜的更夫，銅哨在腰帶上。今晚她在門邊躲雨，還不是進來歇腳的時間。`,appearance:`深青披風，靴底帶泥。`,color:`#8a8e7a`,x:62,y:86,status:`靠在近門的柱邊，聽外面的雨勢。`}]}},currentSceneId:t,log:[{id:`log_open`,at:e,kind:`narrative`,text:`門軸叫了一聲。雨被留在門外，熱氣立刻貼上臉。北風亭的一樓比你記憶中更暗——壁爐在西牆，吧台在最北，樓梯在東南角陰著。吧台後有人在擦杯子，沒有問你要什麼。爐邊坐著一個戴眼鏡的老人。門邊還站著一個披青衣的人，銅哨偶爾碰到皮帶扣，輕響。

你站在門口的濕地板上。再走幾步才進得了廳中央；若要跟人說話，得先走近。`}],suggested:[`走到吧台向阿秋要一杯熱的`,`在爐邊坐下，聽老侯有沒有在說話`,`問門邊的巡夜人雨還要下多久`,`推門走回街上`]}}var J=[`#7d9aa3`,`#a67c6d`,`#8a8e7a`,`#7a7e8c`,`#9a8b78`];async function Y(e,t,n,r){let i=[...n?[{role:`system`,content:n}]:[],{role:`user`,content:t}],{text:a}=await s({data:{config:e,messages:i,maxTokens:r?.maxTokens??1800,temperature:r?.temperature??.7}});return k(a)}function X(e){return Math.min(94,Math.max(6,e))}function Z(e){return Array.isArray(e)?e.map((e,t)=>{let n=e,r=j(n.kind,`other`);return{id:j(n.id,`obj_${t}`),label:j(n.label,`物件${t+1}`),kind:[`furniture`,`door`,`landmark`,`hazard`,`container`,`other`].includes(r)?r:`other`,x:X(A(n.x,50)),y:X(A(n.y,50)),w:Math.min(80,Math.max(4,A(n.w,10))),h:Math.min(80,Math.max(4,A(n.h,10))),desc:j(n.desc,``)}}).filter(e=>e.label):[]}async function oe(e,t){return Y(e,L(t),void 0,{maxTokens:400,temperature:.9})}async function se(e,t){let n=await Y(e,R(t),void 0,{maxTokens:2200,temperature:.8}),i=Array.isArray(n.lorebook)?n.lorebook:[],a=Array.isArray(n.npcs)?n.npcs:[],o=n.player??{},s=n.scene??{},c=i.map((e,t)=>{let n=e;return{id:r(`lb`),title:j(n.title,`條目 ${t+1}`),content:j(n.content,``),tags:Array.isArray(n.tags)?n.tags.map(e=>String(e)):[]}});return{title:j(n.title,j(n.theme,`未命名旅程`)),theme:j(n.theme,t.theme),lorebook:c,player:{name:j(o.name,`旅人`),bio:j(o.bio,``),appearance:j(o.appearance,``),status:j(o.status,`剛抵達`)},scene:{name:j(s.name,`未知場所`),summary:j(s.summary,``),atmosphere:j(s.atmosphere,``),mapPrompt:j(s.mapPrompt,t.theme)},npcs:a.map(e=>{let t=e;return{name:j(t.name,`無名`),bio:j(t.bio,``),appearance:j(t.appearance,``),status:j(t.status,``),where:j(t.where,`場中`)}})}}async function ce(e,t){let{text:n}=await a({data:{config:e,prompt:z(),image:t,maxTokens:1600}}),r=k(n);return{title:j(r.title,``),walkableNotes:j(r.walkableNotes,``),objects:Z(r.objects)}}async function Q(e,t){let n=await Y(e,V(t),void 0,{maxTokens:1400,temperature:.4});return{title:j(n.title,t.name),walkableNotes:j(n.walkableNotes,``),objects:Z(n.objects)}}async function le(e,t,n,r,i){let a=n.objects.map(e=>({label:e.label,x:e.x,y:e.y,kind:e.kind})),o=await Y(e,B({name:t.name,summary:t.summary,walkableNotes:n.walkableNotes},a,r,i),void 0,{maxTokens:800,temperature:.4}),s=o.player??{},c=Array.isArray(o.npcs)?o.npcs:[];return{player:{x:X(A(s.x,50)),y:X(A(s.y,82))},npcs:c.map((e,t)=>{let n=e;return{name:j(n.name,i[t]?.name??`無名`),x:X(A(n.x,40+t*10)),y:X(A(n.y,40)),status:j(n.status,i[t]?.status??``)}})}}async function $(e,t,n){n(`繪製地圖`,`正上方俯視圖`);let i=``,a=`generated`;try{let n=`${U}${t.scene.mapPrompt}`;i=(await o({data:{config:e,prompt:n}})).image}catch{a=`schematic`}let s;if(a===`generated`&&i){n(`辨識場景物件`,`讀取地圖上的家具與出口`);try{s=await ce(e,i)}catch{s=await Q(e,t.scene)}}else n(`配置平面`,`改以示意平面圖`),s=await Q(e,t.scene),i=G(s.objects,t.scene.name);s.objects.length===0&&(s=await Q(e,t.scene),a!==`generated`&&(i=G(s.objects,t.scene.name),a=`schematic`)),n(`安置人物`,`依地圖標註分散站位`);let c=await le(e,t.scene,s,t.player.name,t.npcs),l=t.npcs.map((e,t)=>{let n=c.npcs.find(t=>t.name===e.name)??c.npcs[t];return{id:r(`npc`),name:e.name,role:`npc`,bio:e.bio,appearance:e.appearance,color:J[t%J.length],x:n?.x??40+t*8,y:n?.y??40,status:n?.status||e.status}});return{id:r(`scene`),name:t.scene.name,summary:t.scene.summary,atmosphere:t.scene.atmosphere,mapImage:i,mapSource:a,walkableNotes:s.walkableNotes,objects:s.objects,npcs:l,playerPos:c.player}}async function ue(e,t,n){let i=await $(e,t,n),a=Date.now(),o={id:`player`,name:t.player.name,role:`player`,bio:t.player.bio,appearance:t.player.appearance,color:`#f4f1ea`,x:i.playerPos.x,y:i.playerPos.y,status:t.player.status},s=i.npcs.map(e=>e.name).join(`、`);return{version:1,id:r(`game`),title:t.title,theme:t.theme,createdAt:a,updatedAt:a,turnCount:0,lorebook:t.lorebook,player:o,inventory:[],flags:{},scenes:{[i.id]:i},currentSceneId:i.id,log:[{id:r(`log`),at:a,kind:`narrative`,text:`${i.atmosphere}\n\n你站在${i.name}。${i.summary}${s?` 場中可見：${s}。`:``}\n距離會改變誰聽得見你。`}],suggested:[`環顧四周`,`走向最近的人`,`檢查自己身上帶了什麼`]}}function de(){return q()}async function fe(e,t,n,i){let a=t.scenes[t.currentSceneId];if(!a)throw Error(`找不到當前場景`);i(`推演這一回`,`把距離一併交給主持人`);let o=await Y(e,H(t,a,n),void 0,{maxTokens:1400,temperature:.75}),s={x:X(A(o.player?.x,a.playerPos.x)),y:X(A(o.player?.y,a.playerPos.y))},c=Array.isArray(o.npcs)?o.npcs:[],l=a.npcs.map(e=>{let t=c.find(t=>t.id===e.id);return t?{...e,x:X(A(t.x,e.x)),y:X(A(t.y,e.y)),status:j(t.status,e.status)}:e}),u=[...t.log,{id:r(`log`),at:Date.now(),kind:`action`,text:n},{id:r(`log`),at:Date.now()+1,kind:`narrative`,text:j(o.narrative,`……`)}],d={...t,turnCount:t.turnCount+1,updatedAt:Date.now(),inventory:Array.isArray(o.inventory)?o.inventory:t.inventory,flags:o.flags?{...t.flags,...o.flags}:t.flags,player:{...t.player,x:s.x,y:s.y},suggested:Array.isArray(o.suggested)&&o.suggested.length?o.suggested.slice(0,4):t.suggested,log:u.slice(-80),scenes:{...t.scenes,[a.id]:{...a,playerPos:s,npcs:l}}};if(o.sceneChange&&o.sceneChange.name){i(`進入新場景`,o.sceneChange.name);let n=await $(e,{theme:t.theme,lorebook:t.lorebook,player:{name:t.player.name,bio:t.player.bio,appearance:t.player.appearance,status:t.player.status},scene:{name:o.sceneChange.name,summary:o.sceneChange.summary,atmosphere:o.sceneChange.atmosphere,mapPrompt:o.sceneChange.mapPrompt},npcs:o.sceneChange.npcs??[]},i),a=[...d.log,{id:r(`log`),at:Date.now(),kind:`system`,text:`抵達：${n.name}。${o.sceneChange.reason??``}`.trim()},{id:r(`log`),at:Date.now()+1,kind:`narrative`,text:`${n.atmosphere}\n\n${n.summary}`}];d={...d,currentSceneId:n.id,player:{...d.player,x:n.playerPos.x,y:n.playerPos.y},scenes:{...d.scenes,[n.id]:n},log:a}}return d}export{fe as a,I as c,D as d,S as f,ue as i,P as l,se as n,F as o,h as p,de as r,N as s,oe as t,O as u};