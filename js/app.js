/**
 * app.js —— 应用入口与交互编排
 * -------------------------------------------------------------------------
 * 负责：初始化状态 → 绑定事件 → 页面路由 → 发布/搜索/标记/复制等交互。
 * 渲染统一交给 render.js，业务规则统一交给 core.js，数据读写交给 store.js。
 */
(function (root) {
  'use strict';

  var Core = root.Core;
  var Store = root.Store;
  var Render = root.Render;

  var HISTORY_KEY = 'campus-lost-found-history-v1';

  /** 全局状态 */
  var State = {
    items: [],
    type: 'all',       // 首页类型 tab：all / found / lost
    category: 'all',   // 首页分类筛选
    keyword: '',
    mineGroup: 'all',  // 我的发布：all / active / done
    detailId: null,
    detailFrom: 'home',
    publishType: 'found',
    history: []
  };

  /* ---------------- 工具 ---------------- */

  function $(id) { return document.getElementById(id); }

  function decorateTime(item) {
    item.timeLabel = Core.relativeTime(item.createdAt);
    return item;
  }

  function findItem(id) {
    for (var i = 0; i < State.items.length; i++) {
      if (State.items[i].id === id) return State.items[i];
    }
    return null;
  }

  /* ---------------- 路由 ---------------- */

  function go(page) {
    var pages = document.querySelectorAll('.page');
    for (var i = 0; i < pages.length; i++) pages[i].classList.remove('active');
    var target = $('page-' + page);
    if (target) target.classList.add('active');

    var tabs = document.querySelectorAll('.tabbar .tab');
    for (var j = 0; j < tabs.length; j++) {
      tabs[j].classList.toggle('on', tabs[j].getAttribute('data-go') === page);
    }

    if (page === 'home') Render.renderHome();
    if (page === 'mine') Render.renderMine();
  }

  function goBack() {
    go(State.detailFrom === 'search' ? 'search' : 'home');
  }

  /* ---------------- 首页筛选 ---------------- */

  function setType(type) {
    State.type = type;
    var tabs = document.querySelectorAll('#page-home .type-tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle('on', tabs[i].getAttribute('data-type') === type);
    }
    Render.renderHome();
  }

  function setCategory(cat) {
    State.category = cat;
    var chips = document.querySelectorAll('#home-cats .chip');
    for (var i = 0; i < chips.length; i++) {
      chips[i].classList.toggle('on', chips[i].getAttribute('data-cat') === cat);
    }
    Render.renderHome();
  }

  /* ---------------- 搜索 ---------------- */

  function doSearch(kw) {
    State.keyword = kw;
    $('search-input').value = kw;
    Render.renderSearch(kw);
  }

  function pushHistory(kw) {
    kw = String(kw).trim();
    if (!kw) return;
    State.history = State.history.filter(function (h) { return h !== kw; });
    State.history.unshift(kw);
    if (State.history.length > 8) State.history.length = 8;
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(State.history)); } catch (e) {}
    renderHistory();
  }

  function renderHistory() {
    var box = $('history-chips');
    if (!box) return;
    if (!State.history.length) { box.innerHTML = ''; return; }
    box.innerHTML = State.history.map(function (h) {
      return '<div class="chip" data-quick="' + Render.escapeHtml(h) + '">' + Render.escapeHtml(h) + '</div>';
    }).join('');
  }

  function clearHistory() {
    State.history = [];
    try { localStorage.removeItem(HISTORY_KEY); } catch (e) {}
    renderHistory();
    Render.toast('🧹', '已清空搜索历史');
  }

  /* ---------------- 详情 & 状态 ---------------- */

  function openDetail(id) {
    var it = findItem(id);
    if (!it) return;
    State.detailId = id;
    State.detailFrom = $('page-search').classList.contains('active') ? 'search' : 'home';
    Render.renderDetail(it);
    go('detail');
  }

  function markDone(id) {
    var it = findItem(id);
    if (!it) return;
    var next = Core.markDoneStatus(it);
    if (!next) { Render.toast('ℹ️', '该信息已完成'); return; }
    it.status = next;
    Store.update(it);
    if (State.detailId === id) Render.renderDetail(it);
    Render.toast('✅', '状态已更新为「' + next + '」');
    Render.renderMine();
    Render.renderHome();
  }

  /* ---------------- 发布 ---------------- */

  function setPublishType(type) {
    State.publishType = type;
    var found = $('type-found');
    var lost = $('type-lost');
    found.classList.toggle('on-found', type === 'found');
    lost.classList.toggle('on-lost', type === 'lost');
    $('type-hint').textContent = type === 'found'
      ? '当前为「招领」信息：请尽量写清拾到时间与地点，便于失主辨认。'
      : '当前为「寻物」信息：请尽量写清丢失时间与地点，便于同学帮忙留意。';
    $('f-loc-lbl').innerHTML = (type === 'found' ? '拾到地点' : '丢失地点') + ' <span class="req">*</span>';
    $('f-time-lbl').textContent = type === 'found' ? '拾到时间' : '丢失时间';
    $('f-loc').placeholder = type === 'found' ? '例如：图书馆三楼自习区' : '例如：第二教学楼 204 教室';
  }

  function selectedCategory() {
    var chip = document.querySelector('#f-cats .chip.on');
    return chip ? chip.getAttribute('data-c') : '其他';
  }

  function publish() {
    var fields = {
      name: $('f-name').value,
      loc: $('f-loc').value,
      time: $('f-time').value,
      desc: $('f-desc').value,
      contact: $('f-contact').value
    };
    var result = Core.validateItem(fields);
    if (!result.valid) {
      Render.toast('⚠️', result.errors[0]);
      return;
    }
    var now = new Date();
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var timeStr = fields.time.trim() || (now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()));
    var cat = selectedCategory();
    var item = Store.add({
      type: State.publishType,
      name: fields.name.trim(),
      cat: cat,
      emoji: Core.catEmoji(cat),
      loc: fields.loc.trim(),
      time: timeStr,
      date: pad(now.getMonth() + 1) + '-' + pad(now.getDate()),
      status: State.publishType === 'found' ? '待认领' : '寻找中',
      views: 1,
      desc: fields.desc.trim() || '（无补充描述）',
      contact: fields.contact.trim(),
      publisher: { name: '罗炜', college: '计算机学院 · 2024 级' },
      mine: true,
      createdAt: now.toISOString()
    });
    decorateTime(item);
    State.items = Store.getAll();

    // 清空表单
    ['f-name', 'f-loc', 'f-time', 'f-desc', 'f-contact'].forEach(function (id) {
      $(id).value = '';
    });

    Render.toast('🎉', '发布成功！');
    setTimeout(function () { go('home'); }, 800);
  }

  /* ---------------- 联系 & 复制 ---------------- */

  function copyText(text) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      return ok;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { Render.toast('✅', '联系方式已复制'); },
        function () { fallback() ? Render.toast('✅', '联系方式已复制') : Render.toast('⚠️', '复制失败，请手动复制'); }
      );
    } else {
      fallback() ? Render.toast('✅', '联系方式已复制') : Render.toast('⚠️', '复制失败，请手动复制');
    }
  }

  /* ---------------- 事件绑定 ---------------- */

  function bindEvents() {
    // 统一事件委托：按钮类 data-* 优先于卡片 data-open
    document.addEventListener('click', function (e) {
      var t = e.target;

      var markDoneEl = t.closest('[data-markdone]');
      if (markDoneEl) { markDone(Number(markDoneEl.getAttribute('data-markdone'))); return; }

      var contactEl = t.closest('[data-contact]');
      if (contactEl) {
        var cit = findItem(Number(contactEl.getAttribute('data-contact')));
        if (cit) Render.openContact(cit);
        return;
      }

      var copyEl = t.closest('[data-copy]');
      if (copyEl) { copyText(copyEl.getAttribute('data-copy')); return; }

      var quickEl = t.closest('[data-quick]');
      if (quickEl) { doSearch(quickEl.getAttribute('data-quick')); return; }

      var clearEl = t.closest('[data-clear-history]');
      if (clearEl) { clearHistory(); return; }

      var closeEl = t.closest('[data-close-modal]');
      if (closeEl) { Render.closeContact(); return; }

      var toastEl = t.closest('[data-toast]');
      if (toastEl) {
        var parts = toastEl.getAttribute('data-toast').split('|');
        Render.toast(parts[0] || 'ℹ️', parts[1] || '');
        return;
      }

      var openEl = t.closest('[data-open]');
      if (openEl) { openDetail(Number(openEl.getAttribute('data-open'))); return; }

      var goEl = t.closest('[data-go]');
      if (goEl) { go(goEl.getAttribute('data-go')); return; }

      var typeEl = t.closest('#page-home [data-type]');
      if (typeEl) { setType(typeEl.getAttribute('data-type')); return; }

      var catEl = t.closest('#home-cats [data-cat]');
      if (catEl) { setCategory(catEl.getAttribute('data-cat')); return; }

      var mtEl = t.closest('#page-mine [data-mt]');
      if (mtEl) { State.mineGroup = mtEl.getAttribute('data-mt'); updateMineTabs(); Render.renderMine(); return; }

      var ptypeEl = t.closest('#page-publish [data-ptype]');
      if (ptypeEl) { setPublishType(ptypeEl.getAttribute('data-ptype')); return; }
    });

    // 搜索输入实时响应
    var searchInput = $('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        doSearch(searchInput.value);
      });
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && searchInput.value.trim()) pushHistory(searchInput.value.trim());
      });
    }

    // 返回按钮
    var back = $('back-btn');
    if (back) back.addEventListener('click', goBack);

    // 发布按钮
    var pub = $('publish-btn');
    if (pub) pub.addEventListener('click', publish);

    // 发布页类别 chips
    var catChips = document.querySelectorAll('#f-cats .chip');
    for (var i = 0; i < catChips.length; i++) {
      catChips[i].addEventListener('click', function () {
        var chips = document.querySelectorAll('#f-cats .chip');
        for (var j = 0; j < chips.length; j++) chips[j].classList.remove('on');
        this.classList.add('on');
      });
    }
  }

  function updateMineTabs() {
    var tabs = document.querySelectorAll('#page-mine .cat[data-mt]');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle('on', tabs[i].getAttribute('data-mt') === State.mineGroup);
    }
  }

  /* ---------------- 初始化 ---------------- */

  function init() {
    State.items = Store.load().map(decorateTime);
    try {
      var h = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      if (Array.isArray(h)) State.history = h;
    } catch (e) {}

    Render.renderHome();
    Render.renderMine();
    renderHistory();
    bindEvents();
  }

  // 暴露给 render.js 读取、以及控制台调试
  root.State = State;
  root.App = { State: State, go: go, openDetail: openDetail, markDone: markDone, publish: publish };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof self !== 'undefined' ? self : this);
