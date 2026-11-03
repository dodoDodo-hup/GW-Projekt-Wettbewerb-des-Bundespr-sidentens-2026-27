(function () {
  var COLORS = ["--a1", "--a2", "--a3", "--a4", "--a5"];
  var KEY = "notizen-v1";
  var DEFAULT_INTRO = "Willkommen! Hier sammle ich meine Notizen. Such dir unten einen Tab aus oder spring direkt zu einem Bereich.";
  var state = {
    title: "Meine Notizen",
    intro: DEFAULT_INTRO,
    active: 0,
    tabs: [0, 1, 2, 3, 4].map(function (i) { return { name: "Tab " + (i + 1), text: "" }; })
  };

  try {
    var raw = localStorage.getItem(KEY);
    if (raw) {
      var saved = JSON.parse(raw);
      if (saved && Array.isArray(saved.tabs) && saved.tabs.length === 5) {
        state = saved;
        if (typeof state.intro !== "string") state.intro = DEFAULT_INTRO;
        if (typeof state.active !== "number" || state.active < 0 || state.active > 4) state.active = 0;
      }
    }
  } catch (e) { /* storage empty or blocked: keep defaults */ }

  var titleEl = document.getElementById("title");
  var tabsEl = document.getElementById("tabs");
  var panel = document.getElementById("panel");
  var editor = document.getElementById("editor");
  var statusEl = document.getElementById("status");
  var renameBtn = document.getElementById("rename");
  var introEl = document.getElementById("intro");
  var jumpEl = document.getElementById("jump");
  var timer = null;
  var tabEls = [];

  function renderJump() {
    jumpEl.innerHTML = "";
    state.tabs.forEach(function (t, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.style.setProperty("--c", "var(" + COLORS[i] + ")");
      var n = document.createElement("span");
      n.className = "name";
      n.textContent = t.name;
      var p = document.createElement("span");
      p.className = "peek";
      var first = t.text.split("\n").filter(function (s) { return s.trim(); })[0];
      p.textContent = first ? first.trim() : "Noch leer";
      b.appendChild(n);
      b.appendChild(p);
      b.addEventListener("click", function () {
        select(i);
        document.getElementById("tabs").scrollIntoView({ behavior: "smooth", block: "start" });
        editor.focus({ preventScroll: true });
      });
      jumpEl.appendChild(b);
    });
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      statusEl.textContent = "Gespeichert";
    } catch (e) {
      statusEl.textContent = "Speichern nicht möglich";
    }
  }
  function queueSave() {
    statusEl.textContent = "Speichert …";
    clearTimeout(timer);
    timer = setTimeout(save, 300);
  }

  function build() {
    tabsEl.innerHTML = "";
    tabEls = state.tabs.map(function (t, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "tab";
      b.id = "tab-" + i;
      b.setAttribute("role", "tab");
      b.setAttribute("aria-controls", "panel");
      b.style.setProperty("--c", "var(" + COLORS[i] + ")");
      var l = document.createElement("span");
      l.className = "label";
      l.textContent = t.name;
      b.appendChild(l);
      b.addEventListener("click", function () { select(i); });
      b.addEventListener("dblclick", function () { startRename(i); });
      b.addEventListener("keydown", function (e) {
        if (e.target !== b) return;
        var n = null;
        if (e.key === "ArrowRight") n = (i + 1) % 5;
        if (e.key === "ArrowLeft") n = (i + 4) % 5;
        if (e.key === "Home") n = 0;
        if (e.key === "End") n = 4;
        if (n !== null) { e.preventDefault(); select(n); tabEls[n].focus(); }
      });
      tabsEl.appendChild(b);
      return b;
    });
  }

  function select(i) {
    state.active = i;
    tabEls.forEach(function (b, k) {
      var on = k === i;
      b.setAttribute("aria-selected", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
    });
    panel.setAttribute("aria-labelledby", "tab-" + i);
    document.documentElement.style.setProperty("--accent", "var(" + COLORS[i] + ")");
    editor.value = state.tabs[i].text;
    renderJump();
    queueSave();
  }

  function startRename(i) {
    select(i);
    var l = tabEls[i].querySelector(".label");
    l.contentEditable = "true";
    l.focus();
    var r = document.createRange();
    r.selectNodeContents(l);
    var s = window.getSelection();
    s.removeAllRanges();
    s.addRange(r);
    function finish(commit) {
      l.contentEditable = "false";
      l.removeEventListener("blur", onBlur);
      l.removeEventListener("keydown", onKey);
      var name = l.textContent.replace(/\s+/g, " ").trim();
      if (commit && name) state.tabs[i].name = name.slice(0, 24);
      l.textContent = state.tabs[i].name;
      renderJump();
      queueSave();
    }
    function onBlur() { finish(true); }
    function onKey(e) {
      e.stopPropagation();
      if (e.key === "Enter") { e.preventDefault(); finish(true); tabEls[i].focus(); }
      if (e.key === "Escape") { e.preventDefault(); finish(false); tabEls[i].focus(); }
    }
    l.addEventListener("blur", onBlur);
    l.addEventListener("keydown", onKey);
  }

  titleEl.value = state.title;
  titleEl.addEventListener("input", function () {
    state.title = titleEl.value;
    document.title = titleEl.value.trim() || "Meine Notizen";
    queueSave();
  });
  introEl.value = state.intro;
  introEl.addEventListener("input", function () {
    state.intro = introEl.value;
    queueSave();
  });
  editor.addEventListener("input", function () {
    state.tabs[state.active].text = editor.value;
    renderJump();
    queueSave();
  });
  renameBtn.addEventListener("click", function () { startRename(state.active); });

  document.title = state.title.trim() || "Meine Notizen";
  build();
  select(state.active);
  statusEl.textContent = "Bereit";
})();
