/* F4 原型 · 共享 JS：设备切换、暗色切换、Modal/Drawer 控制、Toast 通知。仅原型用，无业务逻辑。 */
(function(){
  'use strict';

  // ====== 设备切换 ======
  function setDevice(mode){
    var f = document.getElementById('protoFrame'); if(!f) return;
    f.classList.remove('desktop','mobile'); f.classList.add(mode);
    document.querySelectorAll('.dev-toggle button').forEach(function(b){
      b.classList.toggle('active', b.dataset.device === mode);
    });
    try { localStorage.setItem('zy.proto.device', mode); } catch(e){}
  }
  // ====== 主题切换 ======
  function setTheme(t){
    document.documentElement.setAttribute('data-theme', t);
    var btn = document.getElementById('themeBtn');
    if(btn) btn.textContent = (t === 'dark' ? '☀ 浅色' : '🌙 暗色');
    try { localStorage.setItem('zy.proto.theme', t); } catch(e){}
  }

  window.zyDevice = setDevice;
  window.zyTheme  = setTheme;

  document.addEventListener('DOMContentLoaded', function(){
    // 初始化设备 / 主题
    var d = 'desktop'; var t = 'light';
    try { d = localStorage.getItem('zy.proto.device') || 'desktop'; t = localStorage.getItem('zy.proto.theme') || 'light'; } catch(e){}
    setDevice(d); setTheme(t);

    // 设备按钮
    document.querySelectorAll('.dev-toggle button').forEach(function(b){
      b.addEventListener('click', function(){ setDevice(b.dataset.device); });
    });
    // 主题按钮
    var tb = document.getElementById('themeBtn');
    if(tb) tb.addEventListener('click', function(){
      var cur = document.documentElement.getAttribute('data-theme') || 'light';
      setTheme(cur === 'dark' ? 'light' : 'dark');
    });

    // 全局：data-modal="modalId" 触发显示
    document.addEventListener('click', function(e){
      var m = e.target.closest('[data-open-modal]');
      if(m){ e.preventDefault(); zyModal.open(m.getAttribute('data-open-modal')); return; }
      var c = e.target.closest('[data-close-modal], .zy-modal-mask, .zy-drawer-mask');
      if(c){
        if(c.classList.contains('zy-modal-mask') && e.target !== c) return; // 点击内容不关
        if(c.classList.contains('zy-drawer-mask') && e.target !== c) return;
        e.preventDefault();
        var host = c.closest('.zy-modal-mask, .zy-drawer-mask');
        if(host) host.classList.remove('open');
      }
      var d = e.target.closest('[data-open-drawer]');
      if(d){ e.preventDefault(); zyModal.openDrawer(d.getAttribute('data-open-drawer')); return; }
      var nav = e.target.closest('[data-nav]');
      if(nav){ e.preventDefault(); zyToast('原型链接：'+nav.getAttribute('data-nav'),'info'); return; }
      var toast = e.target.closest('[data-toast]');
      if(toast){ e.preventDefault(); zyToast(toast.getAttribute('data-toast'), toast.getAttribute('data-toast-type')||'info'); return; }
    });

    // ESC 关闭
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape'){
        document.querySelectorAll('.zy-modal-mask.open, .zy-drawer-mask.open').forEach(function(el){
          el.classList.remove('open');
        });
      }
    });
  });

  // ====== Modal API ======
  window.zyModal = {
    open: function(id){ var el = document.getElementById(id); if(el) el.classList.add('open'); },
    close: function(id){ var el = document.getElementById(id); if(el) el.classList.remove('open'); },
    openDrawer: function(id){ var el = document.getElementById(id); if(el) el.classList.add('open'); },
    closeAll: function(){ document.querySelectorAll('.zy-modal-mask.open,.zy-drawer-mask.open').forEach(function(el){ el.classList.remove('open'); }); }
  };

  // ====== Toast ======
  window.zyToast = function(msg, type){
    type = type || 'info';
    var stack = document.getElementById('zyToastStack');
    if(!stack){ stack = document.createElement('div'); stack.id='zyToastStack'; stack.className='zy-toast-stack'; document.body.appendChild(stack); }
    var t = document.createElement('div'); t.className='zy-toast '+type; t.textContent = msg;
    stack.appendChild(t);
    setTimeout(function(){ t.style.opacity='0'; t.style.transform='translateX(20px)'; t.style.transition='.25s'; }, 2500);
    setTimeout(function(){ t.remove(); }, 2900);
  };

  // ====== 简单 Tab 切换（class="zy-pills" 容器内） ======
  document.addEventListener('click', function(e){
    var p = e.target.closest('.zy-pills .zy-pill');
    if(p && p.parentElement.classList.contains('zy-pills')){
      p.parentElement.querySelectorAll('.zy-pill').forEach(function(x){ x.classList.remove('active'); });
      p.classList.add('active');
      // 如果有 data-tab-target，切换显示
      var tgt = p.getAttribute('data-tab');
      if(tgt){
        var group = p.getAttribute('data-tab-group') || 'tab';
        document.querySelectorAll('[data-tab-pane]').forEach(function(pane){
          if(pane.getAttribute('data-tab-group')===group) pane.style.display = (pane.getAttribute('data-tab-pane')===tgt) ? '' : 'none';
        });
      }
    }
  });

  // ====== Collapse ======
  document.addEventListener('click', function(e){
    var h = e.target.closest('[data-collapse]');
    if(h){ var id = h.getAttribute('data-collapse'); var b = document.getElementById(id);
      if(b){ var hide = b.style.display !== 'none'; b.style.display = hide ? 'none' : ''; var ic = h.querySelector('.caret'); if(ic) ic.textContent = hide ? '▶' : '▼'; } }
  });

})();
