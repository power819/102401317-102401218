/**
 * data.js —— 内置样例数据（首次打开时的种子数据）
 * -------------------------------------------------------------------------
 * 当 localStorage 里还没有数据时，store 会用这 8 条数据初始化，模拟
 * 「校园里已经有一些同学发布的失物招领信息」。
 *
 * 字段说明见 core.js 注释里的 Item 结构；createdAt 为 ISO 时间，用于排序
 * 和相对时间展示，time/date 用于详情页与卡片上的直观显示。
 */
var SAMPLE_ITEMS = [
  {
    id: 1, type: 'found', name: '黑色保温杯', cat: '生活用品', emoji: '🥤',
    loc: '图书馆三楼自习区', time: '2026-10-07 06:30', date: '10-07',
    status: '待认领', views: 286,
    desc: '早上在图书馆三楼靠窗自习区捡到一个黑色 500ml 保温杯，杯身有一道浅色划痕，杯盖是按压式的，侧面贴了一张校园卡通贴纸。已放到一楼服务台旁的失物暂存点，请主人尽快认领。',
    contact: '138****6621', publisher: { name: '李思远', college: '计算机学院 · 2024 级' },
    mine: false, createdAt: '2026-10-07T06:30:00'
  },
  {
    id: 2, type: 'lost', name: 'AirPods Pro 充电盒', cat: '电子设备', emoji: '🎧',
    loc: '第二教学楼 204 教室', time: '2026-10-07 04:10', date: '10-07',
    status: '寻找中', views: 512,
    desc: '在第二教学楼 204 教室上课时遗失，白色 AirPods Pro 充电盒，盒盖内侧有轻微磨损，带一个透明保护壳，内有单只左耳耳机。',
    contact: '微信 airpods_lost', publisher: { name: '张子豪', college: '信息学院 · 2023 级' },
    mine: true, createdAt: '2026-10-07T04:10:00'
  },
  {
    id: 3, type: 'found', name: '校园一卡通（王雨桐）', cat: '证件卡片', emoji: '🪪',
    loc: '第二食堂二楼门口', time: '2026-10-07 00:40', date: '10-07',
    status: '待认领', views: 178,
    desc: '在第二食堂二楼门口捡到一张校园一卡通，姓名王雨桐，卡号后四位 3721，请失主尽快联系认领。',
    contact: '139****8888', publisher: { name: '陈晓', college: '外国语学院 · 2024 级' },
    mine: false, createdAt: '2026-10-07T00:40:00'
  },
  {
    id: 4, type: 'found', name: '藏青格纹雨伞', cat: '生活用品', emoji: '☂️',
    loc: '体育馆东门伞架旁', time: '2026-10-06 13:15', date: '10-06',
    status: '待认领', views: 220,
    desc: '体育馆东门伞架旁捡到一把藏青色格纹雨伞，伞柄有磨损，伞面内侧有一块小补丁。',
    contact: '137****5566', publisher: { name: '周琳', college: '经济学院 · 2023 级' },
    mine: false, createdAt: '2026-10-06T13:15:00'
  },
  {
    id: 5, type: 'lost', name: '灰色 Nike 双肩包', cat: '衣物配饰', emoji: '🎒',
    loc: '南门篮球场东侧长椅', time: '2026-10-06 11:30', date: '10-06',
    status: '寻找中', views: 394,
    desc: '南门篮球场东侧长椅上忘拿，灰色 Nike 双肩包，包内有两本书和一个蓝色水杯。',
    contact: '150****2233', publisher: { name: '王磊', college: '体育学院 · 2022 级' },
    mine: false, createdAt: '2026-10-06T11:30:00'
  },
  {
    id: 6, type: 'lost', name: '黑框近视眼镜', cat: '生活用品', emoji: '👓',
    loc: '理科楼 305 实验室', time: '2026-10-05 08:20', date: '10-05',
    status: '寻找中', views: 241,
    desc: '理科楼 305 实验室做完实验后遗失，黑框近视眼镜，镜腿内侧有银色小字，度数约 300 度。',
    contact: '微信 glasses_wl', publisher: { name: '王雨桐', college: '物理学院 · 2024 级' },
    mine: true, createdAt: '2026-10-05T08:20:00'
  },
  {
    id: 7, type: 'found', name: '一串钥匙（含蓝色门禁卡）', cat: '生活用品', emoji: '🔑',
    loc: '校园建设银行 ATM 前', time: '2026-10-04 01:05', date: '10-04',
    status: '已归还', views: 603,
    desc: '校园建设银行 ATM 前捡到一串钥匙，含一把钥匙和一张蓝色门禁卡，挂着一个金属小铃铛。已联系到失主并归还。',
    contact: '136****9900', publisher: { name: '李思远', college: '计算机学院 · 2024 级' },
    mine: true, createdAt: '2026-10-04T01:05:00'
  },
  {
    id: 8, type: 'lost', name: 'Kindle Paperwhite', cat: '电子设备', emoji: '📖',
    loc: '图书馆四楼阅览室', time: '2026-10-04 07:40', date: '10-04',
    status: '已找到', views: 468,
    desc: '图书馆四楼阅览室遗失，Kindle Paperwhite 电子书阅读器，黑色，屏幕有细微划痕，皮套为深蓝色。已找回。',
    contact: '159****3344', publisher: { name: '张子豪', college: '信息学院 · 2023 级' },
    mine: false, createdAt: '2026-10-04T07:40:00'
  }
];
