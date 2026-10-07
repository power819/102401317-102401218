/**
 * store.js —— 数据持久化层（localStorage）
 * -------------------------------------------------------------------------
 * 把「当前全部物品」存在浏览器的 localStorage 里，刷新页面后数据仍在，
 * 从而实现「发布的信息不会丢」。
 *
 * 对外只暴露一个 Store 对象：
 *   Store.load()   读取全部物品（首次自动写入种子数据）
 *   Store.save(list) 保存全部物品
 *   Store.add(item) 新增一条（自动分配 id），返回完整条目
 *   Store.update(item) 更新某条
 *   Store.getAll() 同 load
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root.Core, root.SAMPLE_ITEMS);
  } else {
    root.Store = factory(root.Core, root.SAMPLE_ITEMS);
  }
})(typeof self !== 'undefined' ? self : this, function (Core, SAMPLE_ITEMS) {
  'use strict';

  var KEY = 'campus-lost-found-items-v1';

  function readRaw() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch (e) {
      // 数据损坏时视为空，重新用种子数据
      return null;
    }
  }

  function writeRaw(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch (e) {
      // localStorage 不可用（如隐私模式）时静默失败，仅本次会话有效
    }
  }

  function load() {
    var list = readRaw();
    if (!list) {
      list = (SAMPLE_ITEMS || []).slice();
      writeRaw(list);
    }
    return list;
  }

  function save(list) {
    writeRaw(Array.isArray(list) ? list : []);
  }

  /** 新增一条：自动分配一个比现有最大 id 还大的 id */
  function add(item, list) {
    var items = Array.isArray(list) ? list : load();
    var maxId = items.reduce(function (m, it) { return Math.max(m, it.id || 0); }, 0);
    var full = Object.assign({}, item, {
      id: item.id || maxId + 1,
      createdAt: item.createdAt || new Date().toISOString()
    });
    items.unshift(full);
    save(items);
    return full;
  }

  /** 更新某条（按 id），找不到则忽略 */
  function update(item, list) {
    var items = Array.isArray(list) ? list : load();
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === item.id) {
        items[i] = item;
        save(items);
        return item;
      }
    }
    return null;
  }

  return {
    load: load,
    save: save,
    getAll: load,
    add: add,
    update: update
  };
});
