/* ============================================================
   LangGraph 极速入门 · 交互逻辑
   ============================================================ */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- scroll progress + topbar + section nav ---------- */
  var progress = $('#progress');
  var topbar = $('#topbar');
  var navLinks = $$('#secnav a');
  var sections = navLinks.map(function (a) {
    return document.getElementById(a.getAttribute('href').slice(1));
  });
  function onScroll() {
    var h = document.documentElement;
    var sc = h.scrollTop;
    var max = h.scrollHeight - h.clientHeight;
    progress.style.width = (max > 0 ? (sc / max) * 100 : 0) + '%';
    topbar.classList.toggle('scrolled', sc > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* active section highlight */
  var navObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        var id = e.target.id;
        navLinks.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(function (s) { if (s) navObserver.observe(s); });

  /* ---------- scroll reveal ---------- */
  var revObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); revObserver.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach(function (el) { revObserver.observe(el); });

  /* ---------- concept cards: expand + cursor glow ---------- */
  $$('.concept').forEach(function (card) {
    card.addEventListener('click', function () { card.classList.toggle('open'); });
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- code tabs + copy ---------- */
  $$('.code').forEach(function (block) {
    var tabs = $$('.code-tab', block);
    var bodies = $$('.code-body', block);
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        var id = t.dataset.tab;
        tabs.forEach(function (x) { x.classList.toggle('active', x === t); });
        bodies.forEach(function (b) { b.classList.toggle('active', b.id === id); });
      });
    });
    var copyBtn = $('.code-copy', block);
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var id = copyBtn.dataset.copy;
        var pre = $('#' + id + ' pre');
        var txt = pre ? pre.innerText : '';
        var done = function () {
          copyBtn.classList.add('done');
          var c = $('.ctxt', copyBtn);
          var old = c ? c.textContent : '复制';
          if (c) c.textContent = '已复制';
          setTimeout(function () { copyBtn.classList.remove('done'); if (c) c.textContent = old; }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(txt).then(done, done);
        } else {
          var ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta);
          ta.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(ta); done();
        }
      });
    }
  });

  /* ---------- hero mini graph ---------- */
  (function buildHero() {
    var host = $('#heroVisual');
    if (!host) return;
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 320 320');
    var N = [
      { id: 's', x: 40, y: 150, r: 26, t: 'START', cls: 'term' },
      { id: 'c', x: 160, y: 80, r: 34, t: 'chatbot', cls: 'accent' },
      { id: 'o', x: 160, y: 240, r: 30, t: 'tools', cls: 'amber' },
      { id: 'e', x: 280, y: 150, r: 26, t: 'END', cls: 'term' }
    ];
    var E = [
      { a: 's', b: 'c' }, { a: 'c', b: 'o' }, { a: 'o', b: 'c' }, { a: 'c', b: 'e' }
    ];
    function pos(id) { return N.filter(function (n) { return n.id === id; })[0]; }
    // edges
    E.forEach(function (ed, i) {
      var A = pos(ed.a), B = pos(ed.b);
      var p = document.createElementNS(ns, 'line');
      p.setAttribute('x1', A.x); p.setAttribute('y1', A.y);
      p.setAttribute('x2', B.x); p.setAttribute('y2', B.y);
      p.setAttribute('class', 'hedge'); p.setAttribute('data-i', i);
      svg.appendChild(p);
    });
    // nodes
    N.forEach(function (n) {
      var c = document.createElementNS(ns, 'circle');
      c.setAttribute('cx', n.x); c.setAttribute('cy', n.y); c.setAttribute('r', n.r);
      c.setAttribute('class', 'hnode ' + n.cls); c.setAttribute('data-id', n.id);
      svg.appendChild(c);
      var l = document.createElementNS(ns, 'text');
      l.setAttribute('x', n.x); l.setAttribute('y', n.y + 3);
      l.setAttribute('class', 'hnode-lbl'); l.textContent = n.t;
      svg.appendChild(l);
    });
    host.appendChild(svg);

    // animate: cycle through edges lighting up + a token
    var tok = document.createElementNS(ns, 'circle');
    tok.setAttribute('r', 5); tok.setAttribute('class', 'token'); tok.setAttribute('cx', -10); tok.setAttribute('cy', -10);
    svg.appendChild(tok);
    var order = [0, 1, 2, 0, 3]; // flow: start→chatbot, chatbot→tools, tools→chatbot, start→chatbot, chatbot→end
    var idx = 0;
    function tick() {
      var i = order[idx % order.length];
      var edges = $$('.hedge', svg);
      edges.forEach(function (e, j) { e.classList.toggle('active', j === i); });
      var A = pos(E[i].a), B = pos(E[i].b);
      var t0 = null, dur = 900;
      function step(ts) {
        if (!t0) t0 = ts;
        var k = Math.min(1, (ts - t0) / dur);
        var ease = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        tok.setAttribute('cx', A.x + (B.x - A.x) * ease);
        tok.setAttribute('cy', A.y + (B.y - A.y) * ease);
        if (k < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      idx++;
    }
    tick();
    setInterval(tick, 1400);
  })();

  /* ============================================================
     INTERACTIVE GRAPH RUNNER
     ============================================================ */
  (function runner() {
    var svg = $('#runnerSvg');
    if (!svg) return;
    var ns = 'http://www.w3.org/2000/svg';

    // marker for arrows
    var defs = document.createElementNS(ns, 'defs');
    defs.innerHTML = '<marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#D6D6CB"/></marker>' +
      '<marker id="arrA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#4F46E5"/></marker>';
    svg.appendChild(defs);

    var nodes = {
      START:   { x: 24,  y: 174, w: 54, h: 34, term: true,  label: 'START',   sub: '' },
      chatbot: { x: 128, y: 78,  w: 124, h: 64, term: false, label: 'chatbot', sub: 'LLM 节点' },
      tools:   { x: 250, y: 226, w: 116, h: 64, term: false, label: 'tools',   sub: 'ToolNode' },
      END:     { x: 384, y: 174, w: 52, h: 34, term: true,  label: 'END',     sub: '' }
    };
    function ctr(n) { return { x: n.x + n.w / 2, y: n.y + n.h / 2 }; }

    var edges = [
      { id: 'e1', from: 'START', to: 'chatbot', cond: false, label: '', path: 'M78,191 L150,118' },
      { id: 'e2', from: 'chatbot', to: 'tools', cond: true, label: 'tool_calls', path: 'M232,142 Q300,180 296,226' },
      { id: 'e3', from: 'tools', to: 'chatbot', cond: false, label: '', path: 'M262,232 Q196,196 192,142' },
      { id: 'e4', from: 'chatbot', to: 'END', cond: true, label: 'END', path: 'M252,100 Q330,96 386,182' }
    ];

    // draw edges
    edges.forEach(function (ed) {
      var p = document.createElementNS(ns, 'path');
      p.setAttribute('d', ed.path);
      p.setAttribute('class', 'gedge' + (ed.cond ? ' cond' : ''));
      p.setAttribute('marker-end', 'url(#arr)');
      p.setAttribute('data-id', ed.id);
      svg.appendChild(p);
      if (ed.label) {
        var lbl = document.createElementNS(ns, 'text');
        var m = ed.id === 'e2' ? { x: 286, y: 196 } : { x: 330, y: 112 };
        lbl.setAttribute('x', m.x); lbl.setAttribute('y', m.y);
        lbl.setAttribute('class', 'gedge-label'); lbl.setAttribute('text-anchor', 'middle');
        lbl.textContent = ed.label;
        svg.appendChild(lbl);
      }
    });

    // draw nodes
    Object.keys(nodes).forEach(function (key) {
      var n = nodes[key];
      var g = document.createElementNS(ns, 'g');
      var r = document.createElementNS(ns, 'rect');
      r.setAttribute('x', n.x); r.setAttribute('y', n.y); r.setAttribute('width', n.w); r.setAttribute('height', n.h);
      r.setAttribute('rx', 12); r.setAttribute('class', 'gnode-rect' + (n.term ? ' term' : ''));
      r.setAttribute('data-id', key);
      g.appendChild(r);
      var l = document.createElementNS(ns, 'text');
      l.setAttribute('x', ctr(n).x); l.setAttribute('y', ctr(n).y + (n.sub ? 0 : 4));
      l.setAttribute('class', 'gnode-lbl' + (n.term ? ' light' : '')); l.setAttribute('text-anchor', 'middle');
      l.textContent = n.label; g.appendChild(l);
      if (n.sub) {
        var s = document.createElementNS(ns, 'text');
        s.setAttribute('x', ctr(n).x); s.setAttribute('y', ctr(n).y + 17);
        s.setAttribute('class', 'gnode-sub'); s.setAttribute('text-anchor', 'middle');
        s.textContent = n.sub; g.appendChild(s);
      }
      svg.appendChild(g);
    });

    // token
    var token = document.createElementNS(ns, 'circle');
    token.setAttribute('r', 6); token.setAttribute('class', 'token'); token.setAttribute('cx', -20); token.setAttribute('cy', -20);
    svg.appendChild(token);

    /* ---- execution scenario ---- */
    var seq = [
      { node: 'chatbot', edge: 'e1', msg: { role: 'user', body: 'LangGraph 是什么？' }, log: '<b>invoke</b> → START 路由到 <b>chatbot</b>' },
      { node: 'chatbot', edge: null, msg: { role: 'ai', body: '（决策）需要联网，调用 search 工具…' }, log: 'chatbot: LLM 输出含 tool_calls', stay: true },
      { node: 'tools', edge: 'e2', msg: null, log: 'route_tools: 检测到 tool_calls <span class="arr">→</span> tools' },
      { node: 'tools', edge: null, msg: { role: 'tool', body: '搜索结果：LangGraph 是基于有向图的智能体编排框架…' }, log: 'tools: 执行搜索，追加 ToolMessage' },
      { node: 'chatbot', edge: 'e3', msg: null, log: 'tools <span class="arr">→</span> chatbot: 工具结果回喂' },
      { node: 'chatbot', edge: null, msg: { role: 'ai', body: 'LangGraph 把智能体逻辑建模为有向图：节点做事，边决定下一步，状态在节点间流转。' }, log: 'chatbot: 基于工具结果生成最终回答', stay: true },
      { node: 'END', edge: 'e4', msg: null, log: 'route_tools: 无 tool_calls <span class="arr">→</span> END ✓ 完成' }
    ];

    var msgList = $('#msgList'), msgEmpty = $('#msgEmpty'), runLog = $('#runLog'), stateStep = $('#stateStep');
    var btnRun = $('#rRun'), btnStep = $('#rStep'), btnReset = $('#rReset');
    var i = 0, playing = false, timer = null;

    function setActive(id, done) {
      $$('.gnode-rect', svg).forEach(function (r) {
        r.classList.remove('active');
        if (done && r.dataset.id !== 'START') {} // keep done styling separately
      });
      if (id) {
        var rect = $('.gnode-rect[data-id="' + id + '"]', svg);
        if (rect) rect.classList.add('active');
      }
    }
    function markDone(id) {
      var rect = $('.gnode-rect[data-id="' + id + '"]', svg);
      if (rect) { rect.classList.remove('active'); rect.classList.add('done'); }
    }
    function clearEdges() { $$('.gedge', svg).forEach(function (e) { e.classList.remove('active'); e.setAttribute('marker-end', 'url(#arr)'); }); }
    function activateEdge(id) {
      var e = $('.gedge[data-id="' + id + '"]', svg);
      if (e) { e.classList.add('active'); e.setAttribute('marker-end', 'url(#arrA)'); }
    }
    function animateToken(edgeId, cb) {
      var e = $('.gedge[data-id="' + edgeId + '"]', svg);
      if (!e) { cb(); return; }
      var len = e.getTotalLength();
      var t0 = null, dur = 620;
      function step(ts) {
        if (!t0) t0 = ts;
        var k = Math.min(1, (ts - t0) / dur);
        var pt = e.getPointAtLength(len * k);
        token.setAttribute('cx', pt.x); token.setAttribute('cy', pt.y);
        if (k < 1) requestAnimationFrame(step); else cb();
      }
      requestAnimationFrame(step);
    }
    function addMsg(m) {
      if (msgEmpty) { msgEmpty.style.display = 'none'; }
      $$('.msg', msgList).forEach(function (el) { el.classList.remove('fresh'); });
      var d = document.createElement('div');
      d.className = 'msg ' + m.role + ' fresh';
      var roleText = { user: 'user', ai: 'assistant', tool: 'tool' }[m.role] || m.role;
      d.innerHTML = '<span class="role">' + roleText + '</span><div class="body">' + m.body + '</div>';
      msgList.appendChild(d);
      msgList.scrollTop = msgList.scrollHeight;
    }
    function log(html) {
      if (runLog.querySelector('.l') && runLog.querySelector('.l').style.color === 'var(--faint)') runLog.innerHTML = '';
      var l = document.createElement('div'); l.className = 'l'; l.innerHTML = '<span class="arr">▸</span> ' + html;
      runLog.appendChild(l);
      runLog.scrollTop = runLog.scrollHeight;
    }
    function setStep(text) { stateStep.textContent = text; }

    function clearAll() {
      i = 0; playing = false; if (timer) { clearTimeout(timer); timer = null; }
      $$('.gnode-rect', svg).forEach(function (r) { r.classList.remove('active', 'done'); });
      clearEdges();
      token.setAttribute('cx', -20); token.setAttribute('cy', -20);
      msgList.innerHTML = '';
      msgEmpty = document.createElement('div'); msgEmpty.className = 'lab-empty'; msgEmpty.id = 'msgEmpty';
      msgEmpty.innerHTML = '点击「运行」<br>观察 messages 如何被追加'; msgList.appendChild(msgEmpty);
      runLog.innerHTML = '<span class="l" style="opacity:1;color:var(--faint);">// 执行日志将显示在此…</span>';
      setStep('未运行');
      btnRun.disabled = false; btnRun.innerHTML = '▶ 运行'; btnStep.disabled = false;
    }

    function execStep() {
      if (i >= seq.length) { finish(); return; }
      var s = seq[i];
      setStep('超步 ' + (i + 1) + ' / ' + seq.length + ' · ' + nodes[s.node].label);
      // clear previous "active" but keep done
      $$('.gnode-rect', svg).forEach(function (r) { r.classList.remove('active'); });

      function afterEdge() {
        setActive(s.node);
        if (s.msg) addMsg(s.msg);
        log(s.log);
        if (!s.stay && (s.node === 'chatbot' || s.node === 'tools')) {
          // mark as done after a beat if not staying
          (function (node) { setTimeout(function () { markDone(node); }, 500); })(s.node);
        }
        i++;
        if (playing) { timer = setTimeout(execStep, 950); }
      }
      if (s.edge) { activateEdge(s.edge); animateToken(s.edge, afterEdge); }
      else { afterEdge(); }
    }

    function finish() {
      playing = false;
      $$('.gnode-rect', svg).forEach(function (r) { r.classList.remove('active'); });
      var end = $('.gnode-rect[data-id="END"]', svg); if (end) end.classList.add('done');
      setStep('已完成 ✓');
      btnRun.disabled = false; btnRun.innerHTML = '↻ 再次运行'; btnStep.disabled = true;
    }

    btnRun.addEventListener('click', function () {
      if (i >= seq.length) clearAll();
      if (playing) {
        playing = false; if (timer) clearTimeout(timer);
        btnRun.innerHTML = '▶ 运行'; btnStep.disabled = false;
        return;
      }
      playing = true; btnRun.innerHTML = '⏸ 暂停'; btnStep.disabled = true;
      execStep();
    });
    btnStep.addEventListener('click', function () {
      if (i >= seq.length) clearAll();
      playing = false; execStep();
    });
    btnReset.addEventListener('click', clearAll);
  })();

  /* ============================================================
     REDUCER LAB
     ============================================================ */
  (function lab() {
    var toggle = $('#reducerToggle');
    var input = $('#labInput');
    var sendBtn = $('#labSend');
    var send3 = $('#labSend3');
    var clearBtn = $('#labClear');
    var msgsEl = $('#labMsgs');
    var countEl = $('#labCount');
    var explain = $('#reducerExplain');
    if (!toggle) return;

    var reducer = 'overwrite';
    var msgs = [];
    var counter = 0;

    var explains = {
      overwrite: '默认覆盖：每次更新直接替换整个字段，列表永远只剩最新一条。',
      append: 'add_messages 追加：新消息拼接到列表末尾，历史完整保留（并按 ID 去重/更新）。'
    };

    function render() {
      countEl.textContent = msgs.length + ' 条';
      if (msgs.length === 0) {
        msgsEl.innerHTML = '<div class="lab-empty">列表为空 · 发送一条试试</div>';
        return;
      }
      msgsEl.innerHTML = '';
      msgs.forEach(function (m, idx) {
        var d = document.createElement('div');
        d.className = 'lab-msg' + (m.fresh ? ' new' : '');
        d.innerHTML = '<span class="idx">[' + idx + ']</span>"' + m.text + '"';
        msgsEl.appendChild(d);
      });
      msgs.forEach(function (m) { m.fresh = false; });
    }

    function send(text) {
      if (!text) text = input.value.trim();
      if (!text) return;
      counter++;
      var item = { text: text, fresh: true };
      if (reducer === 'overwrite') {
        msgs = [item];
      } else {
        msgs.push(item);
      }
      input.value = '';
      render();
    }

    toggle.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      reducer = b.dataset.r;
      $$('button', toggle).forEach(function (x) { x.classList.toggle('active', x === b); });
      explain.textContent = (reducer === 'overwrite' ? '默认覆盖：' : 'add_messages 追加：') + explains[reducer].replace(/^[^：]+：/, '');
      // re-render existing to reflect new reducer semantics on a demo
      if (msgs.length > 1 && reducer === 'overwrite') {
        // keep only last to demonstrate overwrite
        msgs = [msgs[msgs.length - 1]];
      }
      render();
    });

    sendBtn.addEventListener('click', function () { send(); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') send(); });
    send3.addEventListener('click', function () {
      var samples = ['你好', '介绍一下图', '谢谢'];
      var k = 0;
      function next() {
        if (k >= samples.length) return;
        input.value = samples[k]; k++;
        send();
        setTimeout(next, 360);
      }
      next();
    });
    clearBtn.addEventListener('click', function () { msgs = []; render(); });

    render();
  })();

})();
