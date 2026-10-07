/**
 * render.js —— DOM 渲染层
 * -------------------------------------------------------------------------
 * 只负责「把数据变成界面」：生成 HTML 字符串、更新列表、弹提示等。
 * 所有用户输入（名称/描述/联系方式）在插入 innerHTML 前都经 escapeHtml
 * 转义，避免 XSS。
 *
 * 页面状态放在 app.js 的 State 对象里，这里读取它来渲染。
 */
(function (root) {
  'use strict';

  var Core = root.Core;

  /** HTML 转义，防 XSS */
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** 状态 → 标签颜色 class */
  function statusClass(status) {
    if (status === '待认领') return 'st-waiting';
    if (status === '寻找中') return 'st-searching';
    return 'st-done';
  }

  /** 一条信息卡片（首页 / 搜索结果共用） */
  function cardHTML(item) {
    return (
      '<div class="card" data-open="' + item.id + '">' +
        '<div class="emoji">' + escapeHtml(item.emoji) + '</div>' +
        '<div class="info">' +
          '<div class="title">' + escapeHtml(item.name) + '</div>' +
          '<div class="meta"><span>📍' + escapeHtml(item.loc) + '</span><span>🕐' + escapeHtml(item.timeLabel) + '</span></div>' +
        '</div>' +
        '<div class="side">' +
          '<span class="tag-type">' + escapeHtml(Core.typeText(item.type)) + '</span>' +
          '<span class="badge ' + statusClass(item.status) + '">' + escapeHtml(item.status) + '</span>' +
        '</div>' +
      '</div>'
    );
  }

  /** 首页列表 */
  function renderHome() {
    var S = root.State;
    var list = S.items.slice();
    // 先按类型 tab 过滤，再按分类过滤
    list = Core.filterByType(list, S.type);
    if (S.category && S.category !== 'all') {
      list = list.filter(function (it) { return it.cat === S.category; });
    }
    list = Core.sortNewest(list);

    var count = document.getElementById('home-count');
    var box = document.getElementById('home-list');
    if (count) count.textContent = '共 ' + list.length + ' 条';
    if (!box) return;
    box.innerHTML = list.length
      ? list.map(cardHTML).join('')
      : emptyHTML('😢', '暂无相关' + (S.category !== 'all' ? '「' + S.category + '」' : '') + '信息，去发布一条吧');
  }

  /** 搜索页：根据关键词渲染结果或默认内容 */
  function renderSearch(keyword) {
    var S = root.State;
    var def = document.getElementById('search-default');
    var box = document.getElementById('search-result');
    var kw = (keyword == null ? '' : keyword).trim();
    if (def) def.style.display = kw ? 'none' : 'block';
    if (!box) return;
    if (!kw) { box.innerHTML = ''; return; }
    var r = Core.searchItems(S.items, kw);
    box.innerHTML = r.length
      ? '<div class="sect"><h2>搜索结果</h2><span class="cnt">共 ' + r.length + ' 条</span></div>' + r.map(cardHTML).join('')
      : emptyHTML('😢', '没有找到「' + escapeHtml(kw) + '」相关物品');
  }

  /** 详情页 */
  function renderDetail(item) {
    var body = document.getElementById('detail-body');
    var actions = document.getElementById('detail-actions');
    if (!item) return;
    if (body) {
      body.innerHTML =
        '<div class="photo">' + escapeHtml(item.emoji) + '</div>' +
        '<div class="detail-head">' +
          '<div class="tags">' +
            '<span class="tag-type">' + escapeHtml(Core.typeText(item.type)) + '</span>' +
            '<span class="tag-type">' + escapeHtml(item.cat) + '</span>' +
            '<span class="badge ' + statusClass(item.status) + '">' + escapeHtml(item.status) + '</span>' +
          '</div>' +
          '<h2>' + escapeHtml(item.name) + '</h2>' +
          '<div class="code">编号 ' + escapeHtml(Core.formatCode(item.id)) + ' · 发布于 ' + escapeHtml(item.date) + '</div>' +
        '</div>' +
        '<div class="dblock"><h3>物品信息</h3>' +
          '<div class="drow"><span class="k">类别</span><span class="v">' + escapeHtml(item.cat) + '</span></div>' +
          '<div class="drow"><span class="k">地点</span><span class="v">' + escapeHtml(item.loc) + '</span></div>' +
          '<div class="drow"><span class="k">时间</span><span class="v">' + escapeHtml(item.time) + '</span></div>' +
          '<div class="drow"><span class="k">状态</span><span class="v">' + escapeHtml(item.status) + '</span></div>' +
        '</div>' +
        '<div class="dblock"><h3>详细描述</h3><div class="desc">' + escapeHtml(item.desc) + '</div></div>' +
        '<div class="dblock"><h3>发布者</h3>' +
          '<div class="publisher">' +
            '<div class="avatar">' + escapeHtml(String(item.publisher.name).charAt(0)) + '</div>' +
            '<div><div class="pn">' + escapeHtml(item.publisher.name) + '</div>' +
            '<div class="pc">' + escapeHtml(item.publisher.college) + '</div></div>' +
            '<div class="contact">' + escapeHtml(item.contact) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="tip">认领时请主动说明物品特征，建议在图书馆一楼服务台、宿舍楼下等公共场所交接，注意保护个人信息安全。</div>' +
        '<div class="foot">— 信息由同学自主发布，如已找到请及时标记 —</div>';
    }
    if (actions) {
      var active = Core.isActive(item);
      var mainBtn = active
        ? '<button class="btn ghost" data-markdone="' + item.id + '">✅ ' + escapeHtml(Core.doneStatus(item.type) === '已归还' ? '标记已归还' : '标记已找到') + '</button>'
        : '<button class="btn ghost" data-toast="✅|该信息已完成">✅ ' + escapeHtml(item.status) + '</button>';
      actions.innerHTML =
        '<div class="btn-row">' + mainBtn +
        '<button class="btn" data-contact="' + item.id + '">📞 联系发布者</button></div>';
    }
  }

  /** 我的发布 */
  function renderMine() {
    var S = root.State;
    var mine = S.items.filter(function (it) { return it.mine; });
    var stats = Core.calcStats(mine);
    var stTotal = document.getElementById('st-total');
    var stActive = document.getElementById('st-active');
    var stDone = document.getElementById('st-done');
    if (stTotal) stTotal.textContent = stats.total;
    if (stActive) stActive.textContent = stats.active;
    if (stDone) stDone.textContent = stats.done;

    var list = Core.filterByStatus(mine, S.mineGroup);
    list = Core.sortNewest(list);
    var box = document.getElementById('mine-list');
    if (!box) return;
    box.innerHTML = list.length
      ? list.map(mineCardHTML).join('')
      : emptyHTML('📭', '暂无' + (S.mineGroup === 'active' ? '进行中' : S.mineGroup === 'done' ? '已完成' : '') + '信息');
  }

  function mineCardHTML(item) {
    var active = Core.isActive(item);
    var action = active
      ? '<button class="btn small green" data-markdone="' + item.id + '">' + (item.type === 'found' ? '标记已归还' : '标记已找到') + '</button>'
      : '<button class="btn small slate" data-toast="ℹ️|已完成，无需修改">已完成，无需修改</button>';
    return (
      '<div class="card" data-open="' + item.id + '" style="align-items:flex-start;flex-wrap:wrap;">' +
        '<div class="emoji">' + escapeHtml(item.emoji) + '</div>' +
        '<div class="info">' +
          '<div class="title">' + escapeHtml(item.name) + '</div>' +
          '<div class="meta"><span>📍' + escapeHtml(item.loc) + '</span><span>🕐' + escapeHtml(item.timeLabel) + '</span><span>👁 ' + item.views + ' 次浏览</span></div>' +
          '<div class="mine-actions">' + action + '</div>' +
        '</div>' +
        '<div class="side"><span class="tag-type">' + escapeHtml(Core.typeText(item.type)) + '</span>' +
        '<span class="badge ' + statusClass(item.status) + '">' + escapeHtml(item.status) + '</span></div>' +
      '</div>'
    );
  }

  /** 空状态占位 */
  function emptyHTML(emoji, text) {
    return '<div class="empty"><div class="empty-ico">' + emoji + '</div>' + escapeHtml(text) + '</div>';
  }

  /** 联系弹窗（含一键复制） */
  function openContact(item) {
    var mask = document.getElementById('contact-mask');
    document.getElementById('modal-name').textContent = item.name;
    document.getElementById('modal-contact').textContent = item.contact;
    document.getElementById('modal-copy').setAttribute('data-copy', item.contact);
    if (mask) mask.classList.add('show');
  }

  function closeContact() {
    var mask = document.getElementById('contact-mask');
    if (mask) mask.classList.remove('show');
  }

  /** 顶部轻提示 */
  var toastTimer = null;
  function toast(ico, msg) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.innerHTML = '<span class="big">' + ico + '</span>' + escapeHtml(msg);
    el.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 1600);
  }

  root.Render = {
    escapeHtml: escapeHtml,
    statusClass: statusClass,
    cardHTML: cardHTML,
    renderHome: renderHome,
    renderSearch: renderSearch,
    renderDetail: renderDetail,
    renderMine: renderMine,
    openContact: openContact,
    closeContact: closeContact,
    toast: toast
  };
})(typeof self !== 'undefined' ? self : this);
