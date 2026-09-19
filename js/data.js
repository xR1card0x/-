/* ============================================================
 * 信息雷达站 · 数据层
 * 数据来源：《计算机协会软件部 2026 年秋季纳新第二轮考核题目》第四部分
 *          校园活动与机会信息（26 条模拟信息，不代表学校真实通知）
 * 处理原则：
 *  1. 题目没有提供的信息一律标注"未注明"，不擅自编造；
 *  2. 编号 09 / 20 为补充通知，合并进原信息 01 / 03 的"更新记录"；
 *  3. 时间背景以考核当日 2026-09-19 为准，状态随当前时间动态计算。
 * ============================================================ */

/* ---------- 枚举与元信息 ---------- */
const META = {
  /* 7 种活动类型 */
  categories: {
    lecture:   { label: "讲座",     color: "#2563eb" },
    camp:      { label: "训练营",   color: "#7c3aed" },
    contest:   { label: "竞赛",     color: "#ea580c" },
    research:  { label: "科研",     color: "#0d9488" },
    volunteer: { label: "志愿服务", color: "#16a34a" },
    teamup:    { label: "项目组队", color: "#4f46e5" },
    student:   { label: "学生自发", color: "#db2777" }
  },
  /* 7 种活动状态（open/closing/closed/full/ended/pending/updated） */
  statuses: {
    open:    { label: "报名中",   color: "#16a34a" },
    closing: { label: "即将截止", color: "#d97706" },
    closed:  { label: "已截止",   color: "#6b7280" },
    full:    { label: "已满",     color: "#dc2626" },
    ended:   { label: "已结束",   color: "#475569" },
    pending: { label: "待确认",   color: "#0284c7" },
    updated: { label: "有更新",   color: "#9333ea" }
  },
  /* 4 种适合对象 */
  audiences: {
    all:       { label: "全校" },
    freshman:  { label: "大一" },
    sophomore: { label: "大二及以上" },
    zero:      { label: "零基础" }
  },
  /* 3 种信息来源（可信度递减） */
  sources: {
    official: { label: "学校/学院", trust: 3, trustLabel: "可信度：高（官方渠道）" },
    student:  { label: "学生个人",  trust: 2, trustLabel: "可信度：中（建议核实后参与）" },
    risk:     { label: "高风险信息", trust: 1, trustLabel: "可信度：低（存在风险特征，谨慎对待）" }
  },
  /* 3 级新生友好度 */
  freshman: {
    good:    { label: "新生推荐", color: "#16a34a" },
    caution: { label: "新生谨慎", color: "#d97706" },
    no:      { label: "不适合新生", color: "#dc2626" }
  },
  /* 费用类型 */
  fees: {
    free:    { label: "免费" },
    paid:    { label: "收费" },
    aa:      { label: "AA制" },
    unknown: { label: "未注明" }
  },
  /* 地点模式 */
  locations: {
    offline: { label: "线下" },
    online:  { label: "线上" },
    both:    { label: "线上+线下" },
    unknown: { label: "待定/未注明" }
  }
};

/* ---------- 模拟活动数据（考核当日 2026-09-19） ----------
 * 字段说明：
 *  id            原始编号（保持与题目对应，便于溯源）
 *  category      类型  source 来源  org   来源单位
 *  start/end     开始与结束时间（ISO 字符串，null=未注明）
 *  scheduleNote  多场次/长期类活动的时间说明
 *  deadline      报名截止时间   deadlineLabel 截止内容说明   deadlineNote 截止备注
 *  signup        报名要求       signupMode    报名方式
 *  audiences     适合对象数组（空数组=未注明，筛选时在任何对象下可见）
 *  effort        预计投入       capacity      名额限制
 *  fee           {type, amount, note}  费用说明
 *  location      {mode, detail} 活动地点
 *  contact       联系方式（种子数据均未提供）
 *  freshman      新生友好度     freshmanReason 评级理由
 *  updates       补充更新记录   notes         其他说明
 *  desc          题目信息原文（用于溯源核对）
 *  特殊标记：explicitEnded / waitlist / reviewRequired / partialFull /
 *           uncertain / riskSignals / teamNote / formNote
 * ------------------------------------------------------------- */
const SEED_ACTIVITIES = [
  {
    id: "01",
    title: "“蓝桥杯”程序设计校内训练营",
    category: "camp", source: "official", org: "学校/学院（主办方未注明具体单位）",
    start: "2026-09-21T19:30", end: null,
    scheduleNote: "原计划9月20日起每周六19:00训练；因场地调整，首次训练改为9月21日19:30（详见更新记录）",
    deadline: "2026-09-24T22:00", deadlineLabel: "报名截止",
    signup: "需报名", signupMode: "报名方式未注明",
    audiences: ["all", "zero"],
    effort: "未注明（每周训练1次）", capacity: null,
    fee: { type: "unknown", amount: null, note: null },
    location: { mode: "offline", detail: "首次训练：实验楼A402（更新后）；后续地点未注明" },
    contact: null,
    freshman: "good", freshmanReason: "面向全校、零基础可参加，报名截止前时间充裕，适合新生入门练手",
    updates: [
      { ref: "09", date: "2026-09-19", title: "场地与首次训练时间调整",
        content: "因场地调整，首次训练改为9月21日19:30，地点改至实验楼A402；已报名同学无需重复提交；报名截止时间不变。" }
    ],
    notes: [], desc: "9月24日22:00报名截止；原计划9月20日起每周六19:00训练；面向全校学生；零基础可参加。"
  },
  {
    id: "02",
    title: "AI应用入门公开课",
    category: "lecture", source: "official", org: "学校/学院（主办方未注明具体单位）",
    start: "2026-09-19T19:00", end: "2026-09-19T20:30",
    scheduleNote: null,
    deadline: null, deadlineLabel: null, deadlineNote: "无需报名，无截止时间",
    signup: "无需报名，直接参加", signupMode: "—",
    audiences: ["all"],
    effort: "单次约90分钟", capacity: null,
    fee: { type: "unknown", amount: null, note: null },
    location: { mode: "offline", detail: "计算机学院教学楼" },
    contact: null,
    freshman: "good", freshmanReason: "入门级公开课、无需报名，当晚即可直接参加",
    updates: [], notes: [],
    desc: "9月19日19:00；计算机学院教学楼；面向全校学生；无需报名；预计90分钟。"
  },
  {
    id: "03",
    title: "大学生创新创业项目团队招募",
    category: "teamup", source: "official", org: "学校/学院（主办方未注明具体单位）",
    start: null, end: null,
    scheduleNote: "长期项目，入队后持续进行（具体安排未注明）",
    deadline: "2026-09-22T18:00", deadlineLabel: "报名截止",
    signup: "需报名，需提交简短自我介绍", signupMode: "提交方式未注明",
    audiences: [],
    effort: "每周需稳定投入4小时以上", capacity: null,
    fee: { type: "unknown", amount: null, note: null },
    location: { mode: "unknown", detail: "未注明" },
    contact: null,
    freshman: "caution", freshmanReason: "要求每周稳定投入4小时以上，新生需先评估课业与时间安排",
    partialFull: "开发方向名额已满，现主要补充设计与材料成员",
    updates: [
      { ref: "20", date: "2026-09-19", title: "招募方向与名额更新",
        content: "开发方向名额已满，现主要补充设计与材料成员；9月22日18:00截止；此前已投递者无需重复提交。" }
    ],
    notes: [],
    desc: "招募开发、设计、材料成员；每周需稳定投入4小时以上；9月22日18:00截止；需提交简短自我介绍。"
  },
  {
    id: "04",
    title: "数学建模竞赛经验分享会",
    category: "lecture", source: "official", org: "学校/学院（主办方未注明具体单位）",
    start: "2026-09-18T19:30", end: null,
    scheduleNote: "线上直播（已于9月18日19:30进行）",
    explicitEnded: true,
    deadline: null, deadlineLabel: null, deadlineNote: "直播形式，无报名环节",
    signup: "无需报名（直播形式）", signupMode: "—",
    audiences: ["all"],
    effort: "未注明", capacity: null,
    fee: { type: "unknown", amount: null, note: null },
    location: { mode: "online", detail: "线上直播（回放预计9月20日上传）" },
    contact: null,
    freshman: "good", freshmanReason: "不限专业、可看回放，适合新生了解数学建模",
    updates: [], notes: ["活动方预计9月20日上传回放，可关注后续获取回放地址"],
    desc: "直播时间为9月18日19:30；不限专业；直播已结束，活动方预计9月20日上传回放。"
  },
  {
    id: "05",
    title: "校园公益志愿服务活动",
    category: "volunteer", source: "official", org: "学校/学院（主办方未注明具体单位）",
    start: "2026-09-27T08:30", end: "2026-09-27T17:00",
    scheduleNote: null,
    deadline: "2026-09-20T12:00", deadlineLabel: "报名截止",
    signup: "需报名，活动当日需提前到场签到", signupMode: "报名方式未注明",
    audiences: [],
    effort: "单次约8小时（9月27日全天）", capacity: null,
    fee: { type: "unknown", amount: null, note: null },
    location: { mode: "unknown", detail: "未注明（仅说明需提前到场签到）" },
    contact: null,
    freshman: "good", freshmanReason: "单日志愿服务，无门槛要求，适合新生积累志愿经历",
    updates: [], notes: [],
    desc: "活动时间9月27日8:30—17:00；9月20日12:00报名截止；预计服务8小时；需提前到场签到。"
  },
  {
    id: "06",
    title: "Web开发零基础学习小组",
    category: "camp", source: "official", org: "学校/学院（主办方未注明具体单位）",
    start: "2026-09-23T19:30", end: null,
    scheduleNote: "9月23日起每周三19:30开展，共6周（单次时长未注明）",
    deadline: null, deadlineLabel: null, deadlineNote: "报名时间未注明，满员即止",
    signup: "需报名，满员即止", signupMode: "报名方式未注明",
    audiences: ["zero"],
    effort: "每周1次（共6周）", capacity: "限30人",
    fee: { type: "unknown", amount: null, note: null },
    location: { mode: "unknown", detail: "未注明" },
    contact: null,
    freshman: "good", freshmanReason: "专为零基础学生设计，小班制（30人），适合新生入门Web开发",
    updates: [], notes: [],
    desc: "9月23日起每周三19:30开展，共6周；面向零基础学生；限30人；报名时间未注明，满员即止。"
  },
  {
    id: "07",
    title: "AI创新应用挑战赛",
    category: "contest", source: "official", org: "学校/学院（主办方未注明具体单位）",
    start: null, end: null,
    scheduleNote: "10月20日提交作品（通过意向登记后组队完成）",
    deadline: "2026-09-21T18:00", deadlineLabel: "校内意向登记截止",
    deadlineNote: "意向登记不等同于最终作品提交",
    signup: "需在9月21日18:00前完成校内意向登记", signupMode: "登记方式未注明",
    audiences: [],
    effort: "未注明（需组队完成作品并持续投入）", capacity: null,
    fee: { type: "unknown", amount: null, note: null },
    location: { mode: "unknown", detail: "未注明" },
    contact: null,
    freshman: "caution", freshmanReason: "竞赛类活动，需2—4人组队并投入至10月提交作品，新生需评估基础与时间",
    teamNote: "2—4人组队",
    updates: [], notes: ["意向登记不等同于最终作品提交"],
    desc: "2—4人组队；9月21日18:00前完成校内意向登记；10月20日提交作品；意向登记不等同于最终作品提交。"
  },
  {
    id: "08",
    title: "校园软件项目组招募",
    category: "teamup", source: "official", org: "学校/学院（主办方未注明具体单位）",
    start: null, end: null,
    scheduleNote: "长期项目（每周投入约5小时）",
    deadline: null, deadlineLabel: null, deadlineNote: "长期招募，满员即止",
    signup: "需报名，长期招募满员即止", signupMode: "报名方式未注明",
    audiences: ["freshman", "sophomore"],
    effort: "每周约5小时", capacity: null,
    fee: { type: "unknown", amount: null, note: null },
    location: { mode: "unknown", detail: "未注明" },
    contact: null,
    freshman: "good", freshmanReason: "明确面向大一、大二学生招募，对新生友好",
    requirement: "希望成员了解Git基本操作",
    updates: [], notes: [],
    desc: "开发校园实用工具；面向大一、大二学生；希望成员了解Git基本操作；每周预计投入5小时；长期招募，满员即止。"
  },
  {
    id: "10",
    title: "前端开发经验交流会",
    category: "lecture", source: "official", org: "学校/学院（主办方未注明具体单位）",
    start: "2026-09-19T15:00", end: "2026-09-19T16:30",
    scheduleNote: null,
    deadline: null, deadlineLabel: null, deadlineNote: "无需报名，无截止时间",
    signup: "无需报名，直接参加", signupMode: "—",
    audiences: [],
    effort: "单次约1.5小时", capacity: null,
    fee: { type: "unknown", amount: null, note: null },
    location: { mode: "both", detail: "线下A201，并同步线上直播（直播地址未注明）" },
    contact: null,
    freshman: "good", freshmanReason: "无需报名、线下线上同步，方便新生直接旁听",
    updates: [], notes: [],
    desc: "9月19日15:00—16:30；线下A201并同步线上直播；无需报名。"
  },
  {
    id: "11",
    title: "大学生科研入门分享会",
    category: "research", source: "official", org: "学校/学院（主办方未注明具体单位）",
    start: "2026-09-21T19:00", end: "2026-09-21T20:30",
    scheduleNote: null,
    deadline: null, deadlineLabel: null, deadlineNote: "报名要求未注明",
    signup: "报名要求未注明", signupMode: "报名方式未注明",
    audiences: ["all"],
    effort: "单次约1.5小时", capacity: null,
    fee: { type: "unknown", amount: null, note: null },
    location: { mode: "unknown", detail: "未注明" },
    contact: null,
    freshman: "good", freshmanReason: "科研入门导向，介绍论文检索、科研项目与导师联系方法，适合想了解科研的新生",
    updates: [], notes: [],
    desc: "9月21日19:00—20:30；介绍论文检索、学生科研项目和导师联系方法；面向全校学生。"
  },
  {
    id: "12",
    title: "全国高校计算机能力挑战赛",
    category: "contest", source: "official", org: "全国性赛事（校内报名）",
    start: null, end: null,
    scheduleNote: "10月5日23:59报名截止（比赛具体日程未注明）",
    deadline: "2026-10-05T23:59", deadlineLabel: "报名截止",
    signup: "需报名，个人参赛", signupMode: "报名方式未注明",
    audiences: ["all"], audiencesNote: "面向本科生",
    effort: "未注明", capacity: null,
    fee: { type: "unknown", amount: null, note: "题目明确说明：具体费用信息未提供" },
    location: { mode: "unknown", detail: "未注明" },
    contact: null,
    freshman: "caution", freshmanReason: "全国性竞赛，建议先评估自身基础与备赛投入后再报名",
    teamNote: "个人参赛",
    updates: [], notes: [],
    desc: "面向本科生；10月5日23:59报名截止；个人参赛；具体费用信息未提供。"
  },
  {
    id: "13",
    title: "科研助理招募",
    category: "research", source: "official", org: "学校/学院（主办方未注明具体单位）",
    start: null, end: null,
    scheduleNote: "长期协助数据整理和实验工作（每周投入约6小时）",
    deadline: "2026-09-21T23:59", deadlineLabel: "报名截止",
    signup: "需报名", signupMode: "报名方式未注明",
    audiences: ["sophomore"],
    effort: "每周约6小时", capacity: null,
    fee: { type: "unknown", amount: null, note: null },
    location: { mode: "unknown", detail: "未注明" },
    contact: null,
    freshman: "no", freshmanReason: "仅限大二及以上学生，大一新生不符合报名条件",
    updates: [], notes: [],
    desc: "协助数据整理和实验工作；仅限大二及以上学生；每周预计投入6小时；9月21日截止报名。"
  },
  {
    id: "14",
    title: "Git与GitHub零基础工作坊",
    category: "camp", source: "official", org: "学校/学院（主办方未注明具体单位）",
    start: "2026-09-21T19:00", end: "2026-09-21T20:30",
    scheduleNote: null,
    deadline: null, deadlineLabel: null, deadlineNote: "需提前预约，预约截止时间未注明",
    signup: "需提前预约，限40人", signupMode: "提交报名表预约（审核通知为准）",
    audiences: ["freshman", "zero"],
    effort: "单次约1.5小时", capacity: "限40人",
    fee: { type: "unknown", amount: null, note: null },
    location: { mode: "unknown", detail: "未注明" },
    contact: null,
    freshman: "good", freshmanReason: "专为大一新生设计的零基础工作坊，直接对应新生需求",
    reviewRequired: "审核制：提交报名表不代表最终录取，以审核通知为准",
    updates: [], notes: [],
    desc: "9月21日19:00—20:30；主要面向大一新生；限40人；需提前预约，提交报名表不代表最终录取，以审核通知为准。"
  },
  {
    id: "15",
    title: "AI应用创意挑战",
    category: "contest", source: "official", org: "学校/学院（主办方未注明具体单位）",
    start: null, end: null,
    scheduleNote: "9月23日23:59前提交创意方案；9月30日前提交最终作品",
    deadline: "2026-09-23T23:59", deadlineLabel: "创意方案提交截止",
    deadlineNote: "最终作品需在9月30日前提交",
    signup: "需在9月23日23:59前提交创意方案", signupMode: "提交方式未注明",
    audiences: [],
    effort: "未注明", capacity: null,
    fee: { type: "unknown", amount: null, note: null },
    location: { mode: "unknown", detail: "未注明" },
    contact: null,
    freshman: "good", freshmanReason: "以创意方案为主、允许个人参加，前期参与门槛较低",
    teamNote: "允许个人或团队参加；进入展示环节后可再组队",
    updates: [], notes: [],
    desc: "9月23日23:59前提交创意方案；9月30日前提交最终作品；允许个人或团队参加；进入展示环节后可再组队。"
  },
  {
    id: "16",
    title: "校园摄影志愿者招募",
    category: "volunteer", source: "official", org: "学校/学院（主办方未注明具体单位）",
    start: null, end: null,
    scheduleNote: "长期招募，参与校内大型活动摄影",
    deadline: null, deadlineLabel: null, deadlineNote: "具体报名截止时间未注明",
    signup: "需报名（长期招募）", signupMode: "报名方式未注明",
    audiences: [],
    effort: "未注明", capacity: null,
    fee: { type: "unknown", amount: null, note: null },
    location: { mode: "unknown", detail: "未注明（随校内活动安排）" },
    contact: null,
    freshman: "good", freshmanReason: "长期招募、无硬性设备要求，适合感兴趣的新生尝试",
    updates: [], notes: ["有摄影设备者优先，但不作硬性要求"],
    desc: "长期招募；参与校内大型活动摄影；具体报名截止时间未注明；有摄影设备者优先但不作硬性要求。"
  },
  {
    id: "17",
    title: "Python程序设计学习资料合集",
    category: "camp", source: "official", org: "学校/学院（整理方未注明具体单位）",
    start: null, end: null,
    scheduleNote: "学习资料合集，长期开放（非线下活动）",
    formNote: "自学资料（非线下活动）",
    deadline: null, deadlineLabel: null, deadlineNote: "当前网盘提取信息有效至9月22日，后续将统一更新",
    signup: "无需报名，直接获取资料", signupMode: "网盘提取（提取方式未注明）",
    audiences: [],
    effort: "自学，投入自定", capacity: null,
    fee: { type: "unknown", amount: null, note: null },
    location: { mode: "online", detail: "网盘资料（提取方式未注明）" },
    contact: null,
    freshman: "good", freshmanReason: "Python课程、练习与项目案例齐全，适合新生自学入门",
    updates: [], notes: ["资料长期开放；当前网盘提取信息有效至9月22日，后续将统一更新"],
    desc: "包含课程、练习和项目案例；资料长期开放；当前网盘提取信息有效至9月22日，后续将统一更新。"
  },
  {
    id: "18",
    title: "网络安全兴趣交流小组",
    category: "camp", source: "official", org: "学校/学院（组织方未注明具体单位）",
    start: "2026-09-19T19:30", end: null,
    scheduleNote: "首次交流：9月19日19:30；之后每两周开展一次（单次时长未注明）",
    formNote: "兴趣交流小组",
    deadline: null, deadlineLabel: null, deadlineNote: "报名要求未注明",
    signup: "报名要求未注明", signupMode: "报名方式未注明",
    audiences: ["all", "zero"], audiencesNote: "面向对CTF、Web安全等方向感兴趣的学生，不限基础",
    effort: "每两周1次", capacity: null,
    fee: { type: "unknown", amount: null, note: null },
    location: { mode: "unknown", detail: "未注明" },
    contact: null,
    freshman: "good", freshmanReason: "不限基础，当晚即可参加首次交流，适合对安全方向好奇的新生",
    updates: [], notes: [],
    desc: "首次交流时间为9月19日19:30；之后每两周开展一次；面向CTF、Web安全等方向感兴趣的学生；不限基础。"
  },
  {
    id: "19",
    title: "学生创新项目路演观摩",
    category: "lecture", source: "official", org: "学校/学院（主办方未注明具体单位）",
    start: "2026-09-20T14:30", end: null,
    scheduleNote: null,
    formNote: "路演观摩活动",
    deadline: "2026-09-18T22:00", deadlineLabel: "报名截止（已过）",
    waitlist: "原报名已截止；活动方说明如现场仍有余位，可接受候补入场",
    signup: "报名已于9月18日22:00截止", signupMode: "—",
    audiences: [],
    effort: "未注明", capacity: null,
    fee: { type: "unknown", amount: null, note: null },
    location: { mode: "unknown", detail: "未注明" },
    contact: null,
    freshman: "good", freshmanReason: "观摩类活动无参与门槛，适合新生开眼界（需候补入场）",
    updates: [], notes: [],
    desc: "活动时间9月20日14:30；原报名截止时间为9月18日22:00；活动方说明如现场仍有余位，可接受候补入场。"
  },
  {
    id: "21",
    title: "计算机学院AI产品设计分享会",
    category: "lecture", source: "official", org: "计算机学院",
    start: "2026-09-20T19:00", end: null,
    scheduleNote: null,
    deadline: null, deadlineLabel: null, deadlineNote: "无需报名，无截止时间",
    signup: "无需报名，直接参加（座位有限）", signupMode: "—",
    audiences: ["all"],
    effort: "未注明", capacity: "座位有限",
    fee: { type: "unknown", amount: null, note: null },
    location: { mode: "offline", detail: "明德楼B203" },
    contact: null,
    freshman: "good", freshmanReason: "学院官方发布、无需报名，适合新生了解AI产品设计",
    updates: [], notes: [],
    desc: "计算机学院发布；9月20日19:00；明德楼B203；面向全校学生；无需报名，座位有限。"
  },
  {
    id: "22",
    title: "学生发起｜周末羽毛球约球",
    category: "student", source: "student", org: "学生个人发布",
    start: "2026-09-20T16:00", end: null,
    scheduleNote: "9月20日16:00（时长未注明）",
    deadline: null, deadlineLabel: null, deadlineNote: "报名要求未注明（计划6—8人）",
    signup: "报名要求未注明（计划6—8人）", signupMode: "联系方式未注明",
    audiences: [],
    effort: "未注明", capacity: "计划6—8人",
    fee: { type: "aa", amount: null, note: "费用AA制（场地费等具体金额未注明）" },
    location: { mode: "unknown", detail: "场地待最终确认" },
    contact: null,
    freshman: "good", freshmanReason: "轻松的约球活动，适合新生运动社交；注意费用AA、场地待定",
    uncertain: "场地待最终确认，参与前需与发布者核实",
    updates: [], notes: [],
    desc: "学生个人发布；9月20日16:00；计划6—8人；费用AA；场地待最终确认。"
  },
  {
    id: "23",
    title: "学生发起｜AI工具交流搭子招募",
    category: "student", source: "student", org: "学生个人发布",
    start: null, end: null,
    scheduleNote: "拟于9月21日晚开展（具体时间未确定）",
    deadline: null, deadlineLabel: null, deadlineNote: "报名后拉群",
    signup: "报名后拉群", signupMode: "报名方式未注明",
    audiences: ["zero"],
    effort: "未注明", capacity: null,
    fee: { type: "unknown", amount: null, note: null },
    location: { mode: "unknown", detail: "具体地点未确定" },
    contact: null,
    freshman: "good", freshmanReason: "欢迎零基础，适合想入门AI工具的新生；时间地点待定，报名后进群确认",
    uncertain: "活动时间与地点均未最终确定，以报名后群内通知为准",
    updates: [], notes: [],
    desc: "学生个人发布；拟于9月21日晚开展；欢迎零基础；报名后拉群；具体地点未确定。"
  },
  {
    id: "24",
    title: "学生发起｜“校园兼职福利分享”",
    category: "student", source: "risk", org: "学生个人发布（风险特征明显）",
    start: null, end: null,
    scheduleNote: "活动时间未提供",
    deadline: null, deadlineLabel: null, deadlineNote: "未提供",
    signup: "要求添加私人微信获取详情", signupMode: "添加私人微信（风险特征）",
    audiences: [],
    effort: "未注明", capacity: null,
    fee: { type: "unknown", amount: null, note: "宣称“零门槛、日结”，未说明报酬来源" },
    location: { mode: "unknown", detail: "未提供" },
    contact: "对方要求添加私人微信获取详情（切勿轻易添加陌生微信）",
    freshman: "no", freshmanReason: "典型高风险兼职推广特征，新生容易受骗，不建议参与",
    uncertain: "未提供主办方、地点和完整内容",
    riskSignals: [
      "要求添加私人微信获取详情",
      "宣称“零门槛、日结”，但无报酬来源说明",
      "未提供主办方、地点和完整内容"
    ],
    updates: [], notes: [],
    desc: "学生个人发布；称“零门槛、日结”，要求添加私人微信获取详情；未提供主办方、地点和完整内容。"
  },
  {
    id: "25",
    title: "学生发起｜数码新品体验交流",
    category: "student", source: "risk", org: "学生个人发布（疑似商业推广）",
    start: null, end: null,
    scheduleNote: "活动时间未注明",
    deadline: null, deadlineLabel: null, deadlineNote: "未注明",
    signup: "报名要求未注明", signupMode: "未注明",
    audiences: [],
    effort: "未注明", capacity: null,
    fee: { type: "unknown", amount: null, note: "正文主要介绍某商家优惠及购买链接" },
    location: { mode: "unknown", detail: "未注明" },
    contact: null,
    freshman: "no", freshmanReason: "内容以商家推广为主，不属于真正的校园活动，不建议参与",
    uncertain: "活动时间、地点未注明",
    riskSignals: [
      "标题为技术交流，正文主要介绍某商家优惠及购买链接",
      "疑似商业推广而非校园活动",
      "活动时间、地点未注明"
    ],
    updates: [], notes: [],
    desc: "学生个人发布；标题为技术交流，正文主要介绍某商家优惠及购买链接；活动时间、地点未注明。"
  },
  {
    id: "26",
    title: "外国语学院校园语言角",
    category: "lecture", source: "official", org: "外国语学院",
    start: "2026-09-21T15:00", end: null,
    scheduleNote: null,
    formNote: "语言角·自由交流",
    deadline: null, deadlineLabel: null, deadlineNote: "无需提前报名",
    signup: "无需报名，自由参加（场地容量有限）", signupMode: "—",
    audiences: ["all"],
    effort: "未注明", capacity: "场地容量有限",
    fee: { type: "unknown", amount: null, note: null },
    location: { mode: "unknown", detail: "未注明（场地容量有限，建议提前到场）" },
    contact: null,
    freshman: "good", freshmanReason: "自由交流、无需报名，适合想练习外语的新生",
    updates: [], notes: [],
    desc: "外国语学院发布；9月21日15:00；面向全校学生；自由交流；场地容量有限，无需提前报名。"
  }
];

/* 用户自主发布的数据存于 localStorage，键名与版本： */
const LS_KEYS = {
  posts:   "radar.posts.v1",
  favs:    "radar.favs.v1",
  enrolled:"radar.enrolled.v1",
  notifRead:"radar.notif.read.v1",
  freshMode:"radar.freshMode.v1"
};
