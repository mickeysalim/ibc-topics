(function () {
  "use strict";

  var CONFIG = window.IBC_CONFIG || {};
  var API_URL = (CONFIG.API_URL || "").trim();
  var TINTS = ["#f6dbe6", "#f0dba3", "#d7ead9", "#f3e1c4", "#e6e2c6"];
  var TITLES = /^(Bhante|Ajahn|Ayya|Bhikkhu|Bhikkhuni|Venerable|Ven\.?|Romo|Ibu|Pak|Bapak)$/i;

  var $ = function (id) { return document.getElementById(id); };
  var track = $("track"), viewport = $("viewport");
  var topic = $("topic"), who = $("who"), submit = $("submit"), form = $("form"), success = $("success"), errorEl = $("error");

  var speakers = [];
  var sent = {};
  var idx = 0;

  // ---------- helpers ----------
  function initials(name) {
    var parts = name.split(/\s+/).filter(function (w) { return w && !TITLES.test(w); });
    if (!parts.length) parts = name.split(/\s+/);
    return ((parts[0] || "")[0] + ((parts[1] || "")[0] || "")).toUpperCase();
  }

  // Accepts a normal image URL, a path in this site (speakers/x.jpg),
  // or a Google Drive share link (file must be shared "Anyone with the link").
  function photoUrl(raw) {
    var s = String(raw || "").trim();
    if (!s) return "";
    var m = s.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]+)/);
    if (m) return "https://drive.google.com/thumbnail?id=" + m[1] + "&sz=w400";
    return s;
  }

  function showNotice(text) {
    var n = $("notice");
    n.textContent = text;
    n.hidden = !text;
  }

  // ---------- carousel ----------
  function build() {
    track.innerHTML = "";
    speakers.forEach(function (s, i) {
      var el = document.createElement("div");
      el.className = "slide";
      el.tabIndex = 0;
      el.setAttribute("role", "button");
      el.setAttribute("aria-label", s.name);

      var av = document.createElement("div");
      av.className = "avatar";
      av.style.background = TINTS[i % TINTS.length];
      var ini = document.createElement("span");
      ini.textContent = initials(s.name);
      av.appendChild(ini);

      var src = photoUrl(s.photo);
      if (src) {
        var img = document.createElement("img");
        img.alt = "";
        img.loading = "lazy";
        img.src = src;
        img.onerror = function () { img.remove(); };
        av.appendChild(img);
      }

      var badge = document.createElement("span");
      badge.className = "done-badge";
      badge.hidden = true;
      badge.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
      av.appendChild(badge);

      var nm = document.createElement("div");
      nm.className = "name";
      nm.textContent = s.name;

      el.appendChild(av);
      el.appendChild(nm);
      el.addEventListener("click", function () { go(i); });
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(i); }
      });
      track.appendChild(el);
    });
  }

  function render() {
    if (!speakers.length) return;
    var slide = track.firstElementChild;
    var w = slide ? slide.offsetWidth : 124;
    track.style.transform = "translateX(" + (viewport.clientWidth / 2 - w / 2 - idx * w) + "px)";
    Array.prototype.forEach.call(track.children, function (el, i) {
      el.classList.toggle("active", i === idx);
      el.querySelector(".done-badge").hidden = !sent[i];
    });
    var s = speakers[idx];
    $("spName").textContent = s.name;
    $("forName").textContent = s.name;
    $("counter").textContent = (idx + 1) + " of " + speakers.length;
    $("prev").disabled = idx === 0;
    $("next").disabled = idx === speakers.length - 1;
  }

  function go(i) {
    if (i < 0 || i >= speakers.length || i === idx) return;
    idx = i;
    showForm();
    render();
  }

  $("prev").addEventListener("click", function () { go(idx - 1); });
  $("next").addEventListener("click", function () { go(idx + 1); });
  window.addEventListener("resize", render);

  var startX = null;
  $("carousel").addEventListener("pointerdown", function (e) {
    if (e.target.closest("button")) return;
    startX = e.clientX;
  });
  window.addEventListener("pointerup", function (e) {
    if (startX === null) return;
    var dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
  });
  document.addEventListener("keydown", function (e) {
    var a = document.activeElement;
    if (a === topic || a === who) return;
    if (e.key === "ArrowRight") go(idx + 1);
    if (e.key === "ArrowLeft") go(idx - 1);
  });

  // ---------- form ----------
  function grow() {
    topic.style.height = "auto";
    topic.style.height = Math.max(120, topic.scrollHeight) + "px";
  }
  function updateButton() { submit.disabled = !topic.value.trim() || !speakers.length; }

  topic.addEventListener("input", function () { grow(); updateButton(); });

  function showForm() {
    success.hidden = true;
    form.hidden = false;
    errorEl.hidden = true;
    topic.value = "";
    submit.innerHTML = "Submit suggestion";
    updateButton();
    grow();
  }

  function sendSuggestion(payload) {
    if (!API_URL) {
      // Preview mode: pretend it worked so the flow can be tested.
      return new Promise(function (resolve) { setTimeout(resolve, 700); });
    }
    return fetch(API_URL, {
      method: "POST",
      // text/plain avoids a CORS preflight, which Apps Script doesn't answer.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json(); })
      .then(function (data) { if (!data || !data.ok) throw new Error((data && data.error) || "Not saved"); });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = topic.value.trim();
    if (!text || !speakers.length) return;
    var s = speakers[idx], name = who.value.trim(), here = idx;

    submit.disabled = true;
    submit.innerHTML = '<span class="spinner"></span>Sending…';
    errorEl.hidden = true;

    sendSuggestion({ speaker: s.name, topic: text, name: name })
      .then(function () {
        sent[here] = true;
        render();
        form.hidden = true;
        success.hidden = false;
        $("thanks").textContent = name ? "Thank you, " + name + "!" : "Thank you!";
        $("successMsg").textContent = "Your suggestion for " + s.name + " has been sent.";
        var last = here === speakers.length - 1;
        $("nextSpeaker").hidden = last;
        celebrate();
        (last ? $("again") : $("nextSpeaker")).focus({ preventScroll: true });
      })
      .catch(function () {
        submit.innerHTML = "Submit suggestion";
        updateButton();
        errorEl.textContent = "Your suggestion wasn't sent. Check your internet connection and tap Submit again.";
        errorEl.hidden = false;
      });
  });

  $("nextSpeaker").addEventListener("click", function () {
    if (idx < speakers.length - 1) {
      idx++;
      showForm();
      render();
      topic.focus({ preventScroll: true });
    }
  });
  $("again").addEventListener("click", function () {
    showForm();
    topic.focus({ preventScroll: true });
  });

  function celebrate() {
    Array.prototype.forEach.call(success.querySelectorAll(".confetti"), function (c) { c.remove(); });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var colors = ["#f5c344", "#ffd700", "#279745", "#e9a6c4", "#8c5926", "#f0bfd5"];
    for (var i = 0; i < 34; i++) {
      var c = document.createElement("span");
      c.className = "confetti";
      var a = Math.random() * Math.PI * 2, d = 70 + Math.random() * 120;
      c.style.cssText = "background:" + colors[i % colors.length] +
        ";--x:" + (Math.cos(a) * d) + "px;--y:" + (Math.sin(a) * d * 0.8 + 30) + "px;--r:" +
        ((Math.random() * 720 - 360) | 0) + "deg;animation-delay:" + (Math.random() * 80) + "ms";
      success.appendChild(c);
      (function (el) { setTimeout(function () { el.remove(); }, 1500); })(c);
    }
  }

  // ---------- load speakers ----------
  function useSpeakers(list) {
    speakers = (list || []).filter(function (s) { return s && s.name; });
    if (!speakers.length) {
      $("spName").textContent = "No speakers listed yet";
      $("counter").textContent = "";
      return;
    }
    idx = 0;
    build();
    render();
    requestAnimationFrame(render);
    updateButton();
  }

  if (!API_URL) {
    showNotice("Preview mode: suggestions are not saved yet.");
    useSpeakers(CONFIG.FALLBACK_SPEAKERS);
  } else {
    fetch(API_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data || !data.ok || !Array.isArray(data.speakers)) throw new Error("Bad response");
        useSpeakers(data.speakers);
      })
      .catch(function () { useSpeakers(CONFIG.FALLBACK_SPEAKERS); });
  }
})();
