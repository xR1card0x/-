/* ============================================================
 * 信息雷达站 · 应用逻辑
 * 纯前端实现：筛选排序 / 详情行动卡 / 自主发布 / 收藏与报名 /
 * ICS 日历导出 / 分享 / 通知中心 / 新生模式 / 本地状态持久化
 * ============================================================ */
"use strict";

/* ---------------- 小工具 ---------------- */
const $  = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));
const esc = s => String(s==null ? "" : s)
  .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
  .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
const WD = "日一二三四五六";
const p2 = n => String(n).padStart(2,"0");
const fmtTime = iso => { const d=new Date(iso); return p2(d.getHours())+":"+p2(d.getMinutes()); };
const fmtD = iso => { const d=new Date(iso); return (d.getMonth()+1)+"月"+d.getDate()+"日"; };
const fmtDT = iso => { const d=new Date(iso); return fmtD(iso)+"（周"+WD[d.getDay()]+"）"+fmtTime(iso); };
const sameDay = (a,b) => { const x=new Date(a), y=new Date(b);
  return x.getFullYear()===y.getFullYear()&&x.getMonth()===y.getMonth()&&x.getDate()===y.getDate(); };
const isToday = (iso, now) => iso && sameDay(iso, now);
function humanDelta(ms){
  const m = Math.floor(ms/60000);
  if (m < 1) return "不到1分钟";
  if (m < 60) return m+"分钟";
  const h = Math.floor(m/60);
  if (h < 24) return h+"小时"+(m%60 ? (m%60)+"分" : "");
  const d = Math.floor(h/24);
  return d+"天"+(h%24 ? (h%24)+"小时" : "");
}

/* 本地存储（刷新后保留） */
const store = {
  get(k, def){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; }catch(e){ return def; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
let favs     = store.get(LS_KEYS.favs, []);        // 收藏 id
let enrolled = store.get(LS_KEYS.enrolled, []);    // 已报名标记 id
let posts    = store.get(LS_KEYS.posts, []);       // 用户发布
let notifRead= store.get(LS_KEYS.notifRead, []);   // 已读通知 key
let freshMode= store.get(LS_KEYS.freshMode, false);// 新生模式

/* ---------------- 图标 ---------------- */
const I = {
  clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  hourglass:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 22h14M5 2h14M17 22v-4.17a2 2 0 0 0-.59-1.42L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2M7 2v4.17a2 2 0 0 0 .59 1.42L12 12 7.59 16.41A2 2 0 0 0 7 17.83V22"/></svg>',
  pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
  users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  timer:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></svg>',
  yen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 3l6 8 6-8M12 11v10M7 13h10M7 17h10"/></svg>',
  info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
  shield:'<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  heart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg>',
  calPlus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M12 14v4M10 16h4"/></svg>',
  share:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>',
  warn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  bell:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  edit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
  trash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>',
  refresh:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6"/></svg>'
};
const shieldRow = n => `<span class="shields">${[1,2,3].map(i =>
  `<span class="${i<=n?'on':'off'}">${I.shield}</span>`).join("")}</span>`;

/* ---------------- 数据聚合 ---------------- */
function allActivities(){ return SEED_ACTIVITIES.concat(posts); }
function findActivity(id){ return allActivities().find(a => a.id === id); }

/* 状态计算（随当前时间动态变化） */
function computeStatus(a, now){
  now = now || Date.now();
  if (a.explicitEnded) return "ended";
  if (a.updates && a.updates.length) return "updated";
  if (a.end && now > new Date(a.end).getTime()) return "ended";
  if (a.start && !a.end && now > new Date(a.start).getTime() + 3*3600e3) return "ended"; // 无结束时间：开始3小时后视为结束
  if (a.deadline && now > new Date(a.deadline).getTime()) return "closed";
  if (a.deadline && new Date(a.deadline).getTime() - now <= 72*3600e3) return "closing";
  if (a.uncertain) return "pending";
  return "open";
}

/* 信息完整度检查（缺信预警） */
function missingFields(a){
  const miss = [];
  if (!a.start && !a.scheduleNote) miss.push("活动时间未注明");
  if (!a.deadline && !a.deadlineNote) miss.push("报名截止未注明");
  if (!a.location || a.location.mode === "unknown") miss.push("活动地点未注明");
  if (!a.fee || a.fee.type === "unknown") miss.push("费用未注明");
  if (!a.signupMode || /未注明|未提供/.test(a.signupMode)) miss.push("报名方式未注明");
  if (!a.contact) miss.push("联系方式未注明");
  if (!a.effort || /未注明/.test(a.effort)) miss.push("预计投入未注明");
  if (!a.audiences || !a.audiences.length) miss.push("适合对象未注明");
  return miss;
}

/* ---------------- 筛选与排序 ---------------- */
const state = {
  q:"", cat:"any", status:"any", audience:"any", fresh:"any", source:"any",
  sort:"smart", quick:"", view:"discover"
};

function filteredActivities(){
  const now = Date.now();
  const kw = state.q.trim().toLowerCase();
  let list = allActivities().filter(a => {
    a._st = computeStatus(a, now);
    if (freshMode && a.freshman !== "good") return false;
    if (freshMode && a.source === "risk") return false;
    if (state.cat !== "any" && a.category !== state.cat) return false;
    if (state.source !== "any" && a.source !== state.source) return false;
    if (state.fresh !== "any" && a.freshman !== state.fresh) return false;
    if (state.audience !== "any" &&
        a.audiences && a.audiences.length && !a.audiences.includes(state.audience)) return false;
    if (state.status !== "any"){
      if (state.status === "full"){ if (!a.partialFull) return false; }
      else if (a._st !== state.status) return false;
    }
    if (state.quick === "today" && !isToday(a.start, now)) return false;
    if (kw){
      const hay = [a.title, a.desc, a.org, a.location && a.location.detail, a.scheduleNote,
                   a.signup, a.freshmanReason, (a.notes||[]).join(" "), (a.updates||[]).map(u=>u.title+u.content).join(" ")]
        .join(" ").toLowerCase();
      if (!hay.includes(kw)) return false;
    }
    return true;
  });
  const dl = a => a.deadline ? new Date(a.deadline).getTime() : Infinity;
  if (state.sort === "deadline"){
    list.sort((x,y) => dl(x) - dl(y));
  } else if (state.sort === "newest"){
    list.sort((x,y) => (y.createdAt||0) - (x.createdAt||0) || String(x.id).localeCompare(String(y.id)));
  } else { /* 智能排序 */
    const tier = a => {
      if (a._st === "ended") return 6;
      if (a._st === "closed" || a._st === "full") return 5;
      if (isToday(a.start, now)) return 0;
      if (a._st === "closing") return 1;
      if (a._st === "updated") return 2;
      if (a._st === "open" && a.deadline) return 3;
      return 4; /* open 无截止 / pending */
    };
    list.sort((x,y) => tier(x) - tier(y) || dl(x) - dl(y) || String(x.id).localeCompare(String(y.id)));
  }
  return list;
}

/* ---------------- 文本组装 ---------------- */
function timeText(a){
  if (a.start && a.end){
    return sameDay(a.start, a.end)
      ? fmtD(a.start)+" "+fmtTime(a.start)+"—"+fmtTime(a.end)
      : fmtDT(a.start)+" — "+fmtDT(a.end);
  }
  if (a.start) return fmtDT(a.start)+" 开始";
  if (a.scheduleNote) return a.scheduleNote;
  return "时间未注明";
}
function deadlineText(a, now){
  now = now || Date.now();
  if (a.deadline){
    const t = new Date(a.deadline).getTime();
    const label = a.deadlineLabel || "报名截止";
    return now > t ? {cls:"over", text:"已于 "+fmtDT(a.deadline)+" 截止"}
                   : {cls:"hl", text:"距"+label+"还有 "+humanDelta(t-now)};
  }
  if (a.deadlineNote) return {cls:"", text:a.deadlineNote};
  return {cls:"", text:"报名截止未注明"};
}
function locText(a){
  if (!a.location) return "未注明";
  const m = META.locations[a.location.mode] ? META.locations[a.location.mode].label : "";
  const d = a.location.detail && a.location.detail !== "未注明" ? a.location.detail : "待定/未注明";
  return a.location.mode === "unknown" ? d : "【"+m+"】"+d;
}
function feeText(a){
  if (!a.fee || a.fee.type === "unknown") return {label:"未注明", note:a.fee && a.fee.note ? a.fee.note : ""};
  const base = META.fees[a.fee.type].label + (a.fee.type==="paid" && a.fee.amount ? " "+a.fee.amount+"元" : "");
  return {label:base, note:a.fee.note || ""};
}
function trustText(a){ return META.sources[a.source].trustLabel; }

/* ---------------- 卡片渲染 ---------------- */
function badge(cls, txt, pulse){ return `<span class="badge ${cls}${pulse?' pulse':''}">${txt}</span>`; }
function catBadge(a){ const c = META.categories[a.category];
  return `<span class="badge cat"><span class="dot" style="background:${c.color}"></span>${c.label}</span>`; }
function srcBadge(a){ return badge("src-"+a.source, META.sources[a.source].label); }
function freshBadge(a){ return badge("fr-"+a.freshman, META.freshman[a.freshman].label); }
function modeBadge(a){
  const m = a.location ? a.location.mode : "unknown";
  const txt = {offline:"线下", online:"线上", both:"线上+线下", unknown:"地点待定"}[m];
  return `<span class="badge cat">${txt}</span>`;
}
function extraBadges(a){
  let s = "";
  if (a.partialFull) s += badge("st-full", "部分方向已满");
  if (a.waitlist) s += badge("st-pending", "可候补入场");
  if (a.reviewRequired) s += badge("st-pending", "报名需审核");
  if (a.formNote) s += badge("cat", a.formNote);
  return s;
}

function cardHTML(a, idx){
  const now = Date.now();
  const dl = deadlineText(a, now);
  const isFav = favs.includes(a.id), isEn = enrolled.includes(a.id);
  const st = META.statuses[a._st];
  return `
  <article class="acard" tabindex="0" data-id="${esc(a.id)}"
           style="--cat-color:${META.categories[a.category].color}; animation-delay:${Math.min(idx*35,350)}ms">
    <div class="acard-top">
      <span class="acard-id">#${esc(a.id)}</span>
      ${badge("st-"+a._st, st.label, a._st==="closing")}
      ${a.partialFull ? badge("st-full","部分方向已满") : ""}
    </div>
    <h3 class="acard-title">${esc(a.title)}</h3>
    <div class="badges">${catBadge(a)}${srcBadge(a)}${freshBadge(a)}${modeBadge(a)}${extraBadges(a)}</div>
    <div class="acard-info">
      <div class="row">${I.clock}<span>${esc(timeText(a))}</span></div>
      <div class="row">${I.hourglass}<span class="${dl.cls}">${esc(dl.text)}</span></div>
      <div class="row">${I.pin}<span>${esc(locText(a))}</span></div>
    </div>
    <div class="acard-foot">
      <span class="link-more">查看详情 →</span>
      <div style="display:flex;gap:7px">
        <button class="icon-btn ${isFav?'faved':''}" data-act="fav" title="${isFav?'取消收藏':'收藏'}"
                aria-label="收藏">${I.heart}</button>
        <button class="icon-btn ${isEn?'checked':''}" data-act="en" title="${isEn?'取消报名标记':'标记已报名'}"
                aria-label="标记已报名">${I.check}</button>
      </div>
    </div>
  </article>`;
}

function renderCards(){
  const list = filteredActivities();
  const box = $("#cards");
  box.innerHTML = list.length ? list.map(cardHTML).join("") : `
    <div class="empty">
      ${I.info}
      <p>没有符合条件的活动</p>
      <p class="sub">试试放宽筛选条件，或关闭新生模式查看全部内容</p>
    </div>`;
  const total = allActivities().length;
  const conds = [];
  if (state.cat!=="any") conds.push("类型:"+META.categories[state.cat].label);
  if (state.status!=="any") conds.push("状态:"+(state.status==="full"?"已满":META.statuses[state.status].label));
  if (state.audience!=="any") conds.push("对象:"+META.audiences[state.audience].label);
  if (state.fresh!=="any") conds.push(META.freshman[state.fresh].label);
  if (state.source!=="any") conds.push("来源:"+META.sources[state.source].label);
  if (state.quick==="today") conds.push("今日活动");
  if (state.q) conds.push('关键词"'+state.q+'"');
  $("#resultsMeta").innerHTML =
    `共 ${total} 个活动 · 当前显示 <strong>${list.length}</strong> 个` +
    (conds.length ? "（"+conds.map(esc).join(" · ")+"）" : "");
  /* 风险提示条 */
  $("#riskTip").style.display = state.source === "risk" ? "flex" : "none";
}

/* ---------------- 筛选面板 ---------------- */
function chipRow(label, key, items){
  const cur = state[key];
  const chips = [`<button class="chip ${cur==="any"?"active":""}" data-k="${key}" data-v="any">全部</button>`]
    .concat(items.map(([v, txt, color]) =>
      `<button class="chip ${cur===v?"active":""}" data-k="${key}" data-v="${v}">
        ${color?`<span class="dot" style="background:${color}"></span>`:""}${txt}</button>`));
  return `<div class="filter-row"><span class="flabel">${label}</span><div class="chip-set">${chips.join("")}</div></div>`;
}
function renderFilters(){
  $("#filterPanel").innerHTML =
    chipRow("类型","cat", Object.entries(META.categories).map(([k,v])=>[k,v.label,v.color])) +
    chipRow("状态","status", Object.entries(META.statuses).map(([k,v])=>[k,v.label,v.color])) +
    chipRow("适合对象","audience", Object.entries(META.audiences).map(([k,v])=>[k,v.label])) +
    chipRow("新生友好度","fresh", Object.entries(META.freshman).map(([k,v])=>[k,v.label,v.color])) +
    chipRow("来源","source", Object.entries(META.sources).map(([k,v])=>[k,v.label]));
}

/* ---------------- 详情弹层（行动卡） ---------------- */
function dcell(icon, label, valueHTML, wide){
  return `<div class="dcell${wide?" wide":""}">
    <div class="dl">${icon}${label}</div><div class="dv">${valueHTML}</div></div>`;
}
function renderDetail(a){
  const now = Date.now();
  const st = META.statuses[computeStatus(a, now)];
  const isFav = favs.includes(a.id), isEn = enrolled.includes(a.id);
  const src = META.sources[a.source];
  const fee = feeText(a);

  /* 头部 */
  $("#detailHead").innerHTML = `
    <button class="modal-close" id="detailClose" aria-label="关闭">✕</button>
    <p class="detail-idline">#${esc(a.id)}${a.custom?" · 我发布的":""} · 原始信息编号可溯源</p>
    <h2 class="detail-title">${esc(a.title)}</h2>
    <div class="detail-badges">
      ${badge("st-"+a._st, st.label, a._st==="closing")}
      ${catBadge(a)}${srcBadge(a)}${freshBadge(a)}${modeBadge(a)}${extraBadges(a)}
    </div>`;

  /* 风险横幅 */
  let body = "";
  if (a.source === "risk"){
    body += `<div class="risk-banner">${I.warn}<div>
      <strong>高风险信息提示</strong>（${esc(trustText(a))}）
      <ul>${(a.riskSignals||[]).map(r=>`<li>${esc(r)}</li>`).join("")}</ul>
      <div style="margin-top:6px">新生提示：请勿轻易添加陌生人微信、转账或提供验证码。参与前建议向学校相关部门核实。</div>
    </div></div>`;
  }

  /* 倒计时块 */
  if (a.deadline){
    const t = new Date(a.deadline).getTime();
    const label = a.deadlineLabel || "报名截止";
    if (now > t){
      body += `<div class="countdown passed">${I.hourglass}<div>
        <div class="cd-num">已截止</div><div class="cd-label">${label}时间为 ${fmtDT(a.deadline)}</div></div></div>`;
    } else {
      const left = t - now;
      body += `<div class="countdown ${left<=24*3600e3?"urgent":""}">${I.hourglass}<div>
        <div class="cd-num">${humanDelta(left)}</div>
        <div class="cd-label">距${label}（${fmtDT(a.deadline)}）${a.deadlineNote?" · "+esc(a.deadlineNote):""}</div></div></div>`;
    }
  }

  /* 更新时间线 */
  if (a.updates && a.updates.length){
    body += `<div class="note-block" style="margin:14px 0 0"><strong>该活动有补充更新</strong>，以下为最新安排：</div>
    <div class="timeline">${a.updates.map(u=>`
      <div class="tl-item"><div class="tl-head">补充通知 #${esc(u.ref)}<span class="tl-date">${esc(u.date)}</span></div>
      <p><strong>${esc(u.title)}</strong> — ${esc(u.content)}</p></div>`).join("")}</div>`;
  }

  /* 信息栅格 */
  const dl2 = deadlineText(a, now);
  const audChips = (a.audiences && a.audiences.length)
    ? a.audiences.map(k=>`<span class="badge cat">${META.audiences[k].label}</span>`).join(" ")
    : `<span class="none">未注明</span>`;
  const other = [];
  if (a.capacity) other.push("名额："+esc(a.capacity));
  if (a.teamNote) other.push("组队："+esc(a.teamNote));
  if (a.requirement) other.push("能力要求："+esc(a.requirement));
  body += `<div class="dgrid">
    ${dcell(I.clock,"活动时间", esc(timeText(a)) + (a.start && a.scheduleNote ? `<div class="sub">${esc(a.scheduleNote)}</div>`:""))}
    ${dcell(I.hourglass,"报名截止", dl2.cls==="over" ? `<span class="none">${esc(dl2.text)}</span>`
        : `<strong>${esc(dl2.text)}</strong>${a.deadline?`<div class="sub">${fmtDT(a.deadline)}</div>`:(a.deadlineNote?`<div class="sub">${esc(a.deadlineNote)}</div>`:"")}`)}
    ${dcell(I.pin,"活动地点", esc(locText(a)))}
    ${dcell(I.list,"报名要求", esc(a.signup || "未注明") + (a.signupMode?`<div class="sub">方式：${esc(a.signupMode)}</div>`:""))}
    ${dcell(I.users,"适合对象", audChips + (a.audiencesNote?`<div class="sub">${esc(a.audiencesNote)}</div>`:""))}
    ${dcell(I.timer,"预计投入", /未注明|—/.test(a.effort) ? `<span class="none">${esc(a.effort||"未注明")}</span>` : esc(a.effort))}
    ${dcell(I.yen,"费用说明", (a.fee&&a.fee.type==="unknown" ? `<span class="none">未注明</span>` : `<strong>${esc(fee.label)}</strong>`)
        + (fee.note?`<div class="sub">${esc(fee.note)}</div>`:""))}
    ${dcell(I.info,"当前状态", `<strong style="color:${st.color}">${st.label}</strong>`
        + (a.waitlist?`<div class="sub">${esc(a.waitlist)}</div>`:"")
        + (a.partialFull?`<div class="sub">${esc(a.partialFull)}</div>`:""))}
    ${dcell(I.shield,"来源与可信度", `<div class="trust-row">${shieldRow(src.trust)}
        <strong>${src.label}</strong></div><div class="sub">${esc(src.trustLabel)} · ${esc(a.org||"")}</div>`
        + (a.originNote?`<div class="sub">发布者来源说明：${esc(a.originNote)}</div>`:""))}
    ${dcell(I.users,"联系方式", a.contact ? esc(a.contact) : `<span class="none">未注明（建议通过官方渠道核实）</span>`)}
    ${other.length ? dcell(I.list,"名额与要求", other.join("<br>")) : ""}
  </div>`;

  /* 特殊说明块 */
  if (a.reviewRequired) body += `<div class="note-block blue">审核提示：${esc(a.reviewRequired)}</div>`;
  if (a.uncertain) body += `<div class="note-block amber">待确认：${esc(a.uncertain)}</div>`;
  if (a.notes && a.notes.length)
    body += `<div class="note-block">补充说明：<ul style="margin:4px 0 0;padding-left:18px">${a.notes.map(n=>`<li>${esc(n)}</li>`).join("")}</ul></div>`;

  /* 缺信预警 */
  const miss = missingFields(a);
  body += `<div class="completeness">
    <div class="ct">${miss.length ? I.warn+" 信息完整度提示 —— 本条信息有 "+miss.length+" 项关键内容未注明，参与前请先核实"
      : `<span class="ok">${I.check} 信息完整度良好</span>`}</div>
    ${miss.length?`<div class="miss">${miss.map(m=>`<span>${esc(m)}</span>`).join("")}</div>
      <div style="margin-top:6px;color:#94a3b8">以上为原始信息中未提供的内容，平台不作推测，请向发布方核实后再做决定。</div>`:""}
  </div>`;

  /* 原文 */
  body += `<details class="origin"><summary>查看原始信息（用于溯源核对）</summary>
    <blockquote>${esc(a.desc || "（无原文）")}</blockquote></details>`;

  /* 操作区 */
  body += `<div class="action-bar">
    <button class="act-btn ${isFav?'faved':''}" data-dact="fav">${I.heart} ${isFav?"已收藏":"收藏"}</button>
    <button class="act-btn ${isEn?'checked':''}" data-dact="en">${I.check} ${isEn?"已标记报名 · 点击取消":"标记已报名"}</button>
    <button class="act-btn primary" data-dact="ics" ${a.start?"":"disabled title=\"活动时间未注明，无法生成日历\""}>${I.calPlus} 加入日历</button>
    <button class="act-btn" data-dact="share">${I.share} 分享</button>
    ${a.custom?`<button class="act-btn" data-dact="del" style="color:#dc2626;border-color:#fecaca">${I.trash} 删除</button>`:""}
  </div>`;

  $("#detailBody").innerHTML = body;
}

let currentDetail = null;
function openDetail(id){
  const a = findActivity(id);
  if (!a) return;
  currentDetail = a;
  renderDetail(a);
  $("#detailMask").classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeDetail(){
  $("#detailMask").classList.remove("open");
  document.body.style.overflow = "";
  currentDetail = null;
  if (location.hash.startsWith("#/a/")) history.replaceState(null, "", "#/"+state.view);
}

/* ---------------- 动作 ---------------- */
function toggleFav(id){
  const i = favs.indexOf(id);
  if (i>=0){ favs.splice(i,1); toast("已取消收藏"); }
  else { favs.push(id); toast("已加入收藏，可在「我的」中查看"); }
  store.set(LS_KEYS.favs, favs);
}
function toggleEn(id){
  const i = enrolled.indexOf(id);
  const a = findActivity(id);
  if (i>=0){ enrolled.splice(i,1); toast("已取消报名标记"); }
  else {
    enrolled.push(id);
    if (a && a.source === "risk") toast("已标记报名。注意：该信息为高风险信息，请谨慎核实", 4000);
    else toast(a && a.deadline && new Date(a.deadline) > new Date()
      ? "已标记报名，截止前会在通知中心提醒你" : "已标记报名");
  }
  store.set(LS_KEYS.enrolled, enrolled);
}

/* ICS 日历导出 */
function icsEscape(s){ return String(s).replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\n/g,"\\n"); }
function icsStamp(d){ return d.getUTCFullYear()+p2(d.getUTCMonth()+1)+p2(d.getUTCDate())+"T"+p2(d.getUTCHours())+p2(d.getUTCMinutes())+p2(d.getUTCSeconds())+"Z"; }
function downloadICS(a){
  if (!a.start){ toast("该活动未注明开始时间，无法生成日历"); return; }
  const L = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//信息雷达站//CN","CALSCALE:GREGORIAN","BEGIN:VEVENT",
    "UID:"+a.id+"-"+icsStamp(new Date())+"@radar",
    "DTSTAMP:"+icsStamp(new Date()),
    "DTSTART:"+a.start.replace(/[-:]/g,"")];
  if (a.end) L.push("DTEND:"+a.end.replace(/[-:]/g,""));
  L.push("SUMMARY:"+icsEscape(a.title));
  L.push("LOCATION:"+icsEscape(locText(a)));
  const desc = [a.signup?("报名要求："+a.signup):"",
    a.deadline?("报名截止："+fmtDT(a.deadline)):"",
    feeText(a).label!=="未注明"?("费用："+feeText(a).label):"",
    "来源："+META.sources[a.source].label+" · 信息雷达站",
    (a.updates&&a.updates.length)?("注意：该活动有补充更新，参加前请查看最新通知"):""]
    .filter(Boolean).join("\\n");
  L.push("DESCRIPTION:"+icsEscape(desc));
  L.push("END:VEVENT","END:VCALENDAR");
  const blob = new Blob([L.join("\r\n")], {type:"text/calendar;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const el = document.createElement("a");
  el.href = url; el.download = "信息雷达站-"+a.id+".ics";
  document.body.appendChild(el); el.click(); el.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 2000);
  toast("日历文件已下载，双击即可导入系统日历");
}

/* 分享 */
function shareActivity(a){
  const st = META.statuses[computeStatus(a)].label;
  const url = location.origin + location.pathname + "#/a/" + a.id;
  const text = `【信息雷达站】${a.title}\n` +
    `状态：${st}｜来源：${META.sources[a.source].label}｜${META.freshman[a.freshman].label}\n` +
    `时间：${timeText(a)}\n地点：${locText(a)}\n` +
    (a.deadline ? `报名截止：${fmtDT(a.deadline)}\n` : "") +
    `详情：${url}`;
  const copyFallback = () => {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position="fixed"; ta.style.opacity="0";
    document.body.appendChild(ta); ta.select();
    let ok = false; try{ ok = document.execCommand("copy"); }catch(e){}
    ta.remove();
    toast(ok ? "活动信息已复制，快去分享给同学吧" : "复制失败，请手动分享");
  };
  if (navigator.share){
    navigator.share({title:"信息雷达站 · "+a.title, text}).catch(()=>copyFallback());
  } else if (navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(()=>toast("活动信息已复制，快去分享给同学吧")).catch(copyFallback);
  } else copyFallback();
}

/* ---------------- 通知中心 ---------------- */
function buildNotifications(){
  const now = Date.now(); const list = [];
  const push = (key, ico, title, sub, act) => list.push({key, ico, title, sub, act, ts:now});
  allActivities().forEach(a => {
    (a.updates||[]).forEach(u =>
      push(`upd-${a.id}-${u.ref}`, "update", `「${a.title}」有补充更新`, `${u.title}：${u.content}`, a.id));
    const watched = favs.includes(a.id) || enrolled.includes(a.id);
    if (watched && a.deadline){
      const t = new Date(a.deadline).getTime();
      if (t > now && t - now <= 48*3600e3){
        const kind = enrolled.includes(a.id) ? "你已标记报名的" : "你收藏的";
        push(`dl-${a.id}-${a.deadline}`, "deadline",
          `${kind}「${a.title}」即将截止`,
          `${a.deadlineLabel||"报名截止"}时间为 ${fmtDT(a.deadline)}，剩余 ${humanDelta(t-now)}`, a.id);
      }
    }
    if (enrolled.includes(a.id) && isToday(a.start, now))
      push(`today-${a.id}`, "today", `「${a.title}」今天开始`, "开始时间："+timeText(a), a.id);
    if (watched && a.source === "risk")
      push(`risk-${a.id}`, "risk", `你关注了高风险信息「${a.title}」`,
        "该信息存在风险特征，参与前务必核实，谨防诈骗", a.id);
  });
  return list;
}
function renderNotifications(){
  const list = buildNotifications();
  const unread = list.filter(n => !notifRead.includes(n.key));
  const badge = $("#bellBadge");
  badge.textContent = unread.length;
  badge.classList.toggle("hidden", unread.length === 0);
  const box = $("#notifList");
  box.innerHTML = list.length ? list.map(n => `
    <div class="notif-item ${notifRead.includes(n.key)?"":"unread"}" data-key="${esc(n.key)}" data-act="${esc(n.act)}">
      <div class="n-ico ${n.ico}">${
        n.ico==="update"?I.refresh : n.ico==="deadline"?I.hourglass : n.ico==="today"?I.clock : I.warn}</div>
      <div><div class="n-txt">${esc(n.title)}</div><div class="n-sub">${esc(n.sub)}</div></div>
    </div>`).join("")
    : `<div class="notif-empty">暂无通知<br><span style="font-size:12px">收藏或标记报名的活动，在截止前会出现在这里</span></div>`;
}
function openNotif(){ renderNotifications(); $("#notifDrawer").classList.add("open"); $("#notifMask").classList.add("open"); }
function closeNotif(){ $("#notifDrawer").classList.remove("open"); $("#notifMask").classList.remove("open"); }

/* ---------------- 发布表单 ---------------- */
function initPublishForm(){
  $("#fCategory").innerHTML = `<option value="">请选择类型</option>` +
    Object.entries(META.categories).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join("");
  const radioSet = (box, name, items) => {
    box.innerHTML = items.map(([v,txt]) =>
      `<label class="radio-pill"><input type="radio" name="${name}" value="${v}"><span>${txt}</span></label>`).join("");
  };
  radioSet($("#fAudiences"), "fa", Object.entries(META.audiences).map(([k,v])=>[k,v.label]));
  radioSet($("#fLocMode"), "fl", [["offline","线下"],["online","线上"],["both","线上+线下"],["unknown","待定"]]);
  radioSet($("#fFee"), "ff", [["free","免费"],["paid","收费"],["aa","AA制"]]);
  radioSet($("#fFreshman"), "fr", [["good","推荐"],["caution","谨慎"],["no","不适合"]]);
  $('#fFreshman input[value="caution"]').checked = true;

  /* 字数统计 */
  const bindCounter = (input, out, max) => {
    $(input).addEventListener("input", e => {
      const n = e.target.value.length;
      const c = $(out); c.textContent = n;
      c.parentElement.classList.toggle("warn", n > max*0.8 && n <= max);
      c.parentElement.classList.toggle("over", n > max);
    });
  };
  bindCounter("#fTitle", "#titleCount", 50);
  bindCounter("#fOriginNote", "#originCount", 100);
  $("#fTitle").addEventListener("input", e => { if (e.target.value.length > 50) e.target.value = e.target.value.slice(0,50); });
  $("#fOriginNote").addEventListener("input", e => { if (e.target.value.length > 100) e.target.value = e.target.value.slice(0,100); });

  /* 收费联动 */
  $("#fFee").addEventListener("change", e => {
    const v = e.target.value;
    $("#feeAmountField").style.display = v === "paid" ? "flex" : "none";
  });

  /* 清空 */
  $("#formReset").addEventListener("click", () => {
    $$("#publishForm .field").forEach(f => f.classList.remove("invalid"));
    $("#feeAmountField").style.display = "none";
    $("#titleCount").textContent = "0"; $("#originCount").textContent = "0";
    $('#fFreshman input[value="caution"]').checked = true;
  });

  /* 提交 */
  $("#publishForm").addEventListener("submit", e => {
    e.preventDefault();
    const val = s => $(s).value.trim();
    const invalid = [];
    const mark = (sel, bad) => {
      const f = $(sel).closest(".field");
      f.classList.toggle("invalid", bad);
      if (bad) invalid.push(f);
    };
    const title = val("#fTitle");
    mark('[data-f="title"]', !title || title.length > 50);
    mark('[data-f="category"]', !val("#fCategory"));
    const auds = $$('#fAudiences input:checked').map(i=>i.value);
    mark('[data-f="audiences"]', !auds.length);
    mark('[data-f="start"]', !val("#fStart"));
    const locMode = ($('#fLocMode input:checked')||{}).value;
    mark('[data-f="locMode"]', !locMode);
    const locDetail = val("#fLocDetail");
    mark('[data-f="locDetail"]', (locMode==="offline"||locMode==="both") && !locDetail);
    const feeType = ($('#fFee input:checked')||{}).value;
    mark('[data-f="fee"]', !feeType);
    const feeAmount = val("#fFeeAmount");
    mark('[data-f="feeAmount"]', feeType==="paid" && (!feeAmount || Number(feeAmount) < 0));
    mark('[data-f="contactType"]', !val("#fContactType"));
    mark('[data-f="contact"]', !val("#fContact"));
    const fresh = ($('#fFreshman input:checked')||{}).value;
    mark('[data-f="freshman"]', !fresh);
    const originNote = val("#fOriginNote");
    mark('[data-f="originNote"]', !originNote || originNote.length > 100);

    if (invalid.length){
      invalid[0].scrollIntoView({behavior:"smooth", block:"center"});
      invalid[0].querySelector("input,select,textarea").focus();
      toast("请完善标红的必填项（"+invalid.length+" 处）");
      return;
    }

    const start = val("#fStart"), end = val("#fEnd"), deadline = val("#fDeadline");
    const detail = val("#fDetail");
    const post = {
      id: "u" + Date.now().toString(36),
      custom: true, createdAt: Date.now(),
      title, category: val("#fCategory"), source: "student", org: "学生个人发布",
      start: start || null, end: end || null,
      scheduleNote: val("#fScheduleNote") || null,
      deadline: deadline || null, deadlineLabel: "报名截止", deadlineNote: null,
      signup: deadline ? "需报名（截止 "+fmtDT(deadline)+"）" : "需报名（长期有效）",
      signupMode: val("#fContactType")+"："+val("#fContact"),
      audiences: auds, audiencesNote: null,
      effort: val("#fEffort") || null, capacity: null,
      fee: { type: feeType, amount: feeType==="paid" ? feeAmount : null,
             note: feeType==="aa" ? "费用AA制，具体金额现场分摊" : null },
      location: { mode: locMode,
        detail: locDetail || (locMode==="online" ? "线上（平台未注明）" : "待定") },
      contact: val("#fContactType")+" "+val("#fContact"),
      freshman: fresh, freshmanReason: "发布者自评",
      originNote,
      uncertain: locMode==="unknown" ? "地点待定，请与发布者确认" : null,
      riskSignals: [], updates: [],
      notes: detail ? [detail] : [],
      desc: detail || title + "（学生自主发布）"
    };
    posts.push(post);
    store.set(LS_KEYS.posts, posts);
    e.target.reset();
    $("#feeAmountField").style.display = "none";
    $("#titleCount").textContent = "0"; $("#originCount").textContent = "0";
    $('#fFreshman input[value="caution"]').checked = true;
    toast("发布成功！已进入信息流（学生个人发布）");
    setView("discover");
    if (freshMode) { setFreshMode(false); toast("发布内容为「学生发布」，已自动关闭新生模式以便查看", 3500); }
    state.q = ""; $("#searchInput").value = "";
    renderCards();
    setTimeout(() => {
      const card = $(`.acard[data-id="${post.id}"]`);
      if (card){ card.scrollIntoView({behavior:"smooth", block:"center"}); card.classList.add("flash"); }
    }, 120);
  });
}

/* ---------------- 个人中心 ---------------- */
function myItemHTML(a, kind){
  const now = Date.now();
  const st = META.statuses[computeStatus(a, now)];
  const dl = deadlineText(a, now);
  const acts = [];
  acts.push(`<button class="mini-btn" data-open="${esc(a.id)}">详情</button>`);
  if (kind !== "post"){
    acts.push(`<button class="mini-btn" data-cal="${esc(a.id)}" ${a.start?"":"disabled"}>日历</button>`);
    acts.push(kind === "fav"
      ? `<button class="mini-btn danger" data-unfav="${esc(a.id)}">取消收藏</button>`
      : `<button class="mini-btn danger" data-unen="${esc(a.id)}">取消标记</button>`);
  } else {
    acts.push(`<button class="mini-btn danger" data-delpost="${esc(a.id)}">删除</button>`);
  }
  return `<div class="my-item">
    <div class="mi-main">
      <div class="mi-title" data-open="${esc(a.id)}">${esc(a.title)}</div>
      <div class="mi-meta">
        <span>${badge("st-"+a._st, st.label)}</span>
        <span>${esc(timeText(a))}</span>
        <span class="${dl.cls}">${esc(dl.text)}</span>
        ${kind==="post"?'<span class="badge src-student">我发布的</span>':""}
      </div>
    </div>
    <div class="mi-acts">${acts.join("")}</div>
  </div>`;
}
function renderProfile(){
  const favList = favs.map(findActivity).filter(Boolean);
  const enList  = enrolled.map(findActivity).filter(Boolean);
  const myList  = posts.slice().sort((a,b)=>b.createdAt-a.createdAt);
  const stat = (ico,bg,color,num,lab) => `
    <div class="stat-card"><div class="s-ico" style="background:${bg};color:${color}">${ico}</div>
    <div><div class="num">${num}</div><div class="lab">${lab}</div></div></div>`;
  $("#profileStats").innerHTML =
    stat(I.heart, "#fdf2f8", "#ec4899", favList.length, "我的收藏") +
    stat(I.check, "#f0fdf4", "#16a34a", enList.length, "已标记报名") +
    stat(I.edit,  "#eff6ff", "#2563eb", myList.length, "我发布的");
  const sect = (title, arr, kind, emptyTip) => `
    <div class="sect-title">${title}<span class="cnt">${arr.length}</span></div>
    <div class="my-list">${arr.length ? arr.map(a=>myItemHTML(a, kind)).join("")
      : `<div class="empty" style="padding:26px"><p class="sub">${emptyTip}</p></div>`}</div>`;
  $("#profileContent").innerHTML =
    sect("我的收藏", favList, "fav", "还没有收藏活动。在「发现」页点击卡片右下角的心形按钮即可收藏。") +
    sect("已标记报名", enList, "en", "还没有标记任何报名。标记后截止前会在通知中心提醒你。") +
    sect("我发布的", myList, "post", "还没有发布过活动。去「发布」页创建你的第一个招募或活动信息吧。");
}

/* ---------------- 视图与路由 ---------------- */
function setView(v){
  state.view = v;
  $$("#mainTabs button").forEach(b => b.classList.toggle("active", b.dataset.view === v));
  $$(".view").forEach(s => s.classList.toggle("active", s.id === "view-"+v));
  if (v === "profile") renderProfile();
  if (v === "discover") renderCards();
}
function route(){
  const h = location.hash;
  const m = h.match(/^#\/a\/(.+)$/);
  if (m){ openDetail(decodeURIComponent(m[1])); setView(state.view === "publish" ? "publish" : "discover"); return; }
  closeDetail();
  const mv = h.match(/^#\/(discover|publish|profile)$/);
  setView(mv ? mv[1] : "discover");
}

/* ---------------- 新生模式 ---------------- */
function setFreshMode(on){
  freshMode = on;
  store.set(LS_KEYS.freshMode, on);
  $("#freshSwitch").classList.toggle("on", on);
  $("#freshTip").classList.toggle("show", on);
  renderCards();
}

/* ---------------- Toast ---------------- */
let toastTimer = null;
function toast(msg, ms){
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove("show"), ms || 2400);
}

/* ---------------- 事件绑定 ---------------- */
function bindEvents(){
  /* 页签 */
  $("#mainTabs").addEventListener("click", e => {
    const b = e.target.closest("button[data-view]");
    if (b){ location.hash = "#/" + b.dataset.view; }
  });

  /* 搜索 / 排序 */
  $("#searchInput").addEventListener("input", e => { state.q = e.target.value; renderCards(); });
  $("#sortSelect").addEventListener("change", e => { state.sort = e.target.value; renderCards(); });

  /* 筛选 chips */
  $("#filterPanel").addEventListener("click", e => {
    const c = e.target.closest(".chip");
    if (!c) return;
    state[c.dataset.k] = c.dataset.v;
    renderFilters(); renderCards();
  });

  /* 快捷筛选 */
  $("#quickChips").addEventListener("click", e => {
    const b = e.target.closest("button[data-quick]");
    if (!b) return;
    const q = b.dataset.quick;
    if (q === "today"){
      state.quick = state.quick === "today" ? "" : "today";
    } else if (q === "closing" || q === "updated"){
      state.status = state.status === q ? "any" : q;
      state.quick = "";
    } else if (q === "risk"){
      if (state.source === "risk"){ state.source = "any"; }
      else {
        state.source = "risk";
        if (freshMode){ setFreshMode(false); toast("已暂时关闭新生模式以查看风险信息（仅用于学习甄别）", 3500); }
      }
      state.quick = "";
    }
    renderFilters(); renderCards();
  });

  /* 卡片：详情 / 收藏 / 报名标记 */
  $("#cards").addEventListener("click", e => {
    const btn = e.target.closest("button[data-act]");
    const card = e.target.closest(".acard");
    if (!card) return;
    const id = card.dataset.id;
    if (btn){
      e.stopPropagation();
      if (btn.dataset.act === "fav"){ toggleFav(id); renderCards(); if (currentDetail && currentDetail.id===id) renderDetail(currentDetail); }
      if (btn.dataset.act === "en"){ toggleEn(id); renderCards(); if (currentDetail && currentDetail.id===id) renderDetail(currentDetail); }
      return;
    }
    location.hash = "#/a/" + id;
  });
  $("#cards").addEventListener("keydown", e => {
    const card = e.target.closest(".acard");
    if (card && (e.key === "Enter" || e.key === " ")){ e.preventDefault(); location.hash = "#/a/" + card.dataset.id; }
  });

  /* 详情弹层 */
  $("#detailMask").addEventListener("click", e => {
    if (e.target === $("#detailMask") || e.target.closest("#detailClose")){ closeDetail(); return; }
    const b = e.target.closest("button[data-dact]");
    if (!b || !currentDetail) return;
    const id = currentDetail.id;
    if (b.dataset.dact === "fav"){ toggleFav(id); renderDetail(currentDetail); renderCards(); }
    if (b.dataset.dact === "en"){ toggleEn(id); renderDetail(currentDetail); renderCards(); }
    if (b.dataset.dact === "ics"){ downloadICS(currentDetail); }
    if (b.dataset.dact === "share"){ shareActivity(currentDetail); }
    if (b.dataset.dact === "del"){
      if (confirm("确定删除这条发布吗？删除后不可恢复。")){
        posts = posts.filter(p => p.id !== id);
        favs = favs.filter(f => f !== id);
        enrolled = enrolled.filter(en => en !== id);
        store.set(LS_KEYS.posts, posts); store.set(LS_KEYS.favs, favs); store.set(LS_KEYS.enrolled, enrolled);
        closeDetail(); renderCards(); toast("已删除该发布");
      }
    }
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape"){ closeDetail(); closeNotif(); }
  });

  /* 通知 */
  $("#bellBtn").addEventListener("click", openNotif);
  $("#notifClose").addEventListener("click", closeNotif);
  $("#notifMask").addEventListener("click", closeNotif);
  $("#markAllRead").addEventListener("click", () => {
    buildNotifications().forEach(n => { if (!notifRead.includes(n.key)) notifRead.push(n.key); });
    store.set(LS_KEYS.notifRead, notifRead);
    renderNotifications();
  });
  $("#notifList").addEventListener("click", e => {
    const item = e.target.closest(".notif-item");
    if (!item) return;
    if (!notifRead.includes(item.dataset.key)){
      notifRead.push(item.dataset.key);
      store.set(LS_KEYS.notifRead, notifRead);
    }
    closeNotif();
    renderNotifications();
    location.hash = "#/a/" + item.dataset.act;
  });

  /* 新生模式 */
  $("#freshSwitch").addEventListener("click", () => {
    setFreshMode(!freshMode);
    toast(freshMode ? "新生模式已开启：只看新生推荐，已隐藏高风险信息" : "已关闭新生模式，显示全部信息");
  });

  /* 个人中心（事件委托） */
  $("#profileContent").addEventListener("click", e => {
    const open = e.target.closest("[data-open]");
    if (open){ location.hash = "#/a/" + open.dataset.open; return; }
    const cal = e.target.closest("[data-cal]");
    if (cal){ const a = findActivity(cal.dataset.cal); if (a) downloadICS(a); return; }
    const uf = e.target.closest("[data-unfav]");
    if (uf){ favs = favs.filter(x => x !== uf.dataset.unfav); store.set(LS_KEYS.favs, favs); renderProfile(); toast("已取消收藏"); return; }
    const ue = e.target.closest("[data-unen]");
    if (ue){ enrolled = enrolled.filter(x => x !== ue.dataset.unen); store.set(LS_KEYS.enrolled, enrolled); renderProfile(); toast("已取消报名标记"); return; }
    const dp = e.target.closest("[data-delpost]");
    if (dp){
      if (confirm("确定删除这条发布吗？删除后不可恢复。")){
        posts = posts.filter(p => p.id !== dp.dataset.delpost);
        store.set(LS_KEYS.posts, posts);
        renderProfile(); toast("已删除该发布");
      }
    }
  });
  $("#clearAllBtn").addEventListener("click", () => {
    if (confirm("将清除本浏览器中的收藏、报名标记、我发布的活动和通知记录，确定继续？")){
      Object.values(LS_KEYS).forEach(k => { try{ localStorage.removeItem(k); }catch(e){} });
      favs = []; enrolled = []; posts = []; notifRead = [];
      renderProfile(); renderCards(); renderNotifications();
      toast("已清除全部本地数据");
    }
  });

  window.addEventListener("hashchange", route);
}

/* 倒计时实时刷新（卡片与详情） */
setInterval(() => {
  if (state.view === "discover" && !$("#detailMask").classList.contains("open")) renderCards();
  if ($("#detailMask").classList.contains("open") && currentDetail) renderDetail(currentDetail);
  renderNotifications();
}, 60000);

/* ---------------- 启动 ---------------- */
initPublishForm();
bindEvents();
renderFilters();
setFreshMode(freshMode);
renderNotifications();
route();
