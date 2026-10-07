/**
 * core.js —— 核心纯逻辑层
 * -------------------------------------------------------------------------
 * 只做数据运算，不碰 DOM、不碰 localStorage，因此既能在浏览器里运行，
 * 也能被 Node 直接 require 做单元测试（UMD 写法）。
 *
 * 这里集中了校园失物招领的全部业务规则：
 *   - 物品分类与图标
 *   - 招领/寻物 的类型文案
 *   - 状态机（待认领/寻找中 → 已归还/已找到）
 *   - 关键词搜索、类型/状态筛选
 *   - 发布表单校验
 *   - 编号格式化、相对时间、统计
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Core = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // 七个物品分类（与第一次原型一致）
  var CATEGORIES = [
    '生活用品', '电子设备', '证件卡片', '衣物配饰',
    '书籍资料', '运动器材', '其他'
  ];

  // 分类对应的 emoji 图标
  var CAT_EMOJI = {
    '生活用品': '🧴', '电子设备': '🎧', '证件卡片': '🪪', '衣物配饰': '🎒',
    '书籍资料': '📚', '运动器材': '⚽', '其他': '📦'
  };

  // 状态：招领 / 寻物 各自的两段式状态机
  var ACTIVE_STATUSES = ['待认领', '寻找中'];
  var DONE_STATUSES = ['已归还', '已找到'];

  /** 分类 → emoji，未知分类给通用图标 */
  function catEmoji(cat) {
    return CAT_EMOJI[cat] || '📦';
  }

  /** type → 中文标签 */
  function typeText(type) {
    return type === 'found' ? '招领' : '寻物';
  }

  /** 招领/寻物 各自对应的「已完成」状态 */
  function doneStatus(type) {
    return type === 'found' ? '已归还' : '已找到';
  }

  /** 是否处于「进行中」状态（待认领/寻找中） */
  function isActive(item) {
    return item && ACTIVE_STATUSES.indexOf(item.status) !== -1;
  }

  /** 是否处于「已完成」状态（已归还/已找到） */
  function isDone(item) {
    return item && DONE_STATUSES.indexOf(item.status) !== -1;
  }

  /**
   * 关键词搜索：在 名称/类别/地点/描述 中做不区分大小写的包含匹配。
   * 空关键词返回全部（副本）。
   */
  function searchItems(items, keyword) {
    if (!Array.isArray(items)) return [];
    var kw = String(keyword == null ? '' : keyword).trim().toLowerCase();
    if (!kw) return items.slice();
    return items.filter(function (it) {
      var fields = [it.name, it.cat, it.loc, it.desc];
      for (var i = 0; i < fields.length; i++) {
        if (fields[i] && String(fields[i]).toLowerCase().indexOf(kw) !== -1) {
          return true;
        }
      }
      return false;
    });
  }

  /** 按类型筛选：'all' | 'found' | 'lost' */
  function filterByType(items, type) {
    if (!Array.isArray(items)) return [];
    if (!type || type === 'all') return items.slice();
    return items.filter(function (it) { return it.type === type; });
  }

  /** 按状态组筛选：'all' | 'active' | 'done' */
  function filterByStatus(items, group) {
    if (!Array.isArray(items)) return [];
    if (group === 'active') return items.filter(isActive);
    if (group === 'done') return items.filter(isDone);
    return items.slice();
  }

  /**
   * 状态机转移：进行中 → 已完成。
   * 返回转移后的新状态字符串；若当前不可转移（已完成或非法），返回 null。
   */
  function markDoneStatus(item) {
    if (!item || !isActive(item)) return null;
    return doneStatus(item.type);
  }

  /**
   * 发布表单校验：名称、地点、联系方式为必填。
   * 返回 { valid:boolean, errors:string[] }。
   */
  function validateItem(fields) {
    var errors = [];
    if (!fields) return { valid: false, errors: ['参数不能为空'] };
    if (!String(fields.name || '').trim()) errors.push('请填写物品名称');
    if (!String(fields.loc || '').trim()) errors.push('请填写地点');
    if (!String(fields.contact || '').trim()) errors.push('请填写联系方式');
    return { valid: errors.length === 0, errors: errors };
  }

  /** 编号格式化：id → 'LF' + 6 位补零，如 formatCode(1) === 'LF000001' */
  function formatCode(id) {
    var s = String(id);
    while (s.length < 6) s = '0' + s;
    return 'LF' + s;
  }

  /**
   * 相对时间：把 ISO 时间转成「刚刚 / n 分钟前 / n 小时前 / n 天前」。
   * 第二个参数 now 可注入固定时间，便于测试（缺省用当前时间）。
   */
  function relativeTime(isoStr, now) {
    if (!isoStr) return '';
    var then = new Date(isoStr).getTime();
    if (isNaN(then)) return '';
    var nowMs = now == null ? Date.now() : new Date(now).getTime();
    if (isNaN(nowMs)) return '';
    var diff = Math.max(0, nowMs - then);
    var minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return minutes + ' 分钟前';
    var hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + ' 小时前';
    var days = Math.floor(hours / 24);
    if (days < 30) return days + ' 天前';
    return new Date(then).toLocaleDateString('zh-CN');
  }

  /** 统计：累计 / 进行中 / 已完成 数量 */
  function calcStats(items) {
    var list = Array.isArray(items) ? items : [];
    return {
      total: list.length,
      active: list.filter(isActive).length,
      done: list.filter(isDone).length
    };
  }

  /** 按 id 从新到旧排序（新发布 id 更大，排前面），返回副本 */
  function sortNewest(items) {
    if (!Array.isArray(items)) return [];
    return items.slice().sort(function (a, b) { return b.id - a.id; });
  }

  return {
    CATEGORIES: CATEGORIES,
    CAT_EMOJI: CAT_EMOJI,
    ACTIVE_STATUSES: ACTIVE_STATUSES,
    DONE_STATUSES: DONE_STATUSES,
    catEmoji: catEmoji,
    typeText: typeText,
    doneStatus: doneStatus,
    isActive: isActive,
    isDone: isDone,
    searchItems: searchItems,
    filterByType: filterByType,
    filterByStatus: filterByStatus,
    markDoneStatus: markDoneStatus,
    validateItem: validateItem,
    formatCode: formatCode,
    relativeTime: relativeTime,
    calcStats: calcStats,
    sortNewest: sortNewest
  };
});
