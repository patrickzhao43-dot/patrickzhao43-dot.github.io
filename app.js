/* =====================================================================
   Site engine: renders pages from content.js and provides edit mode.
   Visitors never see edit controls. To edit: add ?edit to the address
   (e.g. https://yourname.github.io/?edit) or press Ctrl+Shift+E.
   ===================================================================== */
(function () {
  "use strict";

  var DRAFT_KEY = "site-content-draft";
  var EDIT = false;
  var DATA = clone(window.SITE);
  var activeTag = "All";
  var app = document.getElementById("app");
  var saveTimer = null;

  /* ---------------- utilities ---------------- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function get(path) {
    return path.split(".").reduce(function (o, k) { return o == null ? undefined : o[k]; }, DATA);
  }
  function set(path, val) {
    var keys = path.split("."), o = DATA;
    for (var i = 0; i < keys.length - 1; i++) {
      if (o[keys[i]] == null) o[keys[i]] = {};
      o = o[keys[i]];
    }
    o[keys[keys.length - 1]] = val;
  }
  var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  function fmtDate(d) {
    if (!d) return "";
    var p = String(d).split("-");
    if (p.length < 2) return d;
    var m = MONTHS[parseInt(p[1], 10) - 1];
    if (!m) return d;
    return (p[2] ? parseInt(p[2], 10) + " " : "") + m + " " + p[0];
  }
  function fmtShort(d) {
    var p = String(d).split("-");
    var m = MONTHS[parseInt(p[1], 10) - 1];
    return m ? m.slice(0, 3) + " ’" + p[0].slice(2) : d;
  }
  function today(day) {
    var t = new Date(), m = ("0" + (t.getMonth() + 1)).slice(-2), dd = ("0" + t.getDate()).slice(-2);
    return t.getFullYear() + "-" + m + (day ? "-" + dd : "");
  }
  function byDateDesc(list) {
    return list.map(function (x, i) { return { x: x, i: i }; })
      .sort(function (a, b) { return String(b.x.date || "").localeCompare(String(a.x.date || "")); });
  }

  /* ---------------- editable field builders ---------------- */
  // Single-line text
  function T(path, tag, cls, ph) {
    tag = tag || "span";
    return "<" + tag + (cls ? ' class="' + cls + '"' : "") + ' data-path="' + path + '" data-ph="' + esc(ph || "Click to type") + '">' +
      esc(get(path)) + "</" + tag + ">";
  }
  // Multi-paragraph text (paragraphs separated by blank lines in content.js)
  function M(path, cls, ph) {
    var v = get(path) || "";
    var paras = String(v).split(/\n+/).filter(function (s) { return s.trim(); });
    return '<div class="prose ' + (cls || "") + '" data-path="' + path + '" data-multi="1" data-ph="' + esc(ph || "Click to write") + '">' +
      paras.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + "</div>";
  }
  // Date: formatted for visitors, raw YYYY-MM(-DD) while editing
  function D(path, tag, cls) {
    tag = tag || "span";
    if (EDIT) return "<" + tag + (cls ? ' class="' + cls + '"' : "") + ' data-path="' + path + '" data-ph="YYYY-MM-DD" title="Format: YYYY-MM or YYYY-MM-DD">' + esc(get(path)) + "</" + tag + ">";
    return "<" + tag + (cls ? ' class="' + cls + '"' : "") + ">" + esc(fmtDate(get(path))) + "</" + tag + ">";
  }
  function btn(label, attrs) {
    return '<button type="button" class="ebtn ed" ' + attrs + ">" + label + "</button>";
  }
  function listTools(list, i, n) {
    return '<div class="ed ebar-row">' +
      (i > 0 ? btn("↑ Up", 'data-act="up" data-list="' + list + '" data-i="' + i + '"') : "") +
      (i < n - 1 ? btn("↓ Down", 'data-act="down" data-list="' + list + '" data-i="' + i + '"') : "") +
      btn("Remove", 'data-act="del" data-list="' + list + '" data-i="' + i + '"') + "</div>";
  }

  /* ---------------- figures ---------------- */
  function figure(list, i, n) {
    var path = list + "." + i, f = get(path) || {};
    var inner = f.src ? '<img src="' + esc(f.src) + '" alt="' + esc(f.caption) + '" data-zoom="1" loading="lazy">' : "Photograph";
    return "<figure>" +
      '<div class="ph">' + inner + "</div>" +
      T(path + ".caption", "figcaption", "", "Caption") +
      '<div class="ed ebar-row">' +
        btn("Upload image", 'data-act="img" data-target="' + path + '.src"') +
        btn("Use file path", 'data-act="imgpath" data-target="' + path + '.src"') +
        (i > 0 ? btn("←", 'data-act="up" data-list="' + list + '" data-i="' + i + '"') : "") +
        (i < n - 1 ? btn("→", 'data-act="down" data-list="' + list + '" data-i="' + i + '"') : "") +
        btn("Remove", 'data-act="del" data-list="' + list + '" data-i="' + i + '"') +
      "</div></figure>";
  }
  function gallery(list, cls) {
    var arr = get(list) || [];
    var html = arr.length ? '<div class="gallery ' + (cls || "") + '">' + arr.map(function (_, i) { return figure(list, i, arr.length); }).join("") + "</div>" : "";
    return html + '<div class="ed ebar-row">' + btn("+ Add photo", 'data-act="add" data-list="' + list + '" data-tpl="image"') + "</div>";
  }

  /* ---------------- chart (monochrome line chart with hover) ---------------- */
  var STROKES = [
    { c: "#111111", d: "" },
    { c: "#7a7a7a", d: "6 4" },
    { c: "#4a4a4a", d: "2 3" }
  ];
  function niceStep(span, n) {
    var s0 = (span || 1) / n, mag = Math.pow(10, Math.floor(Math.log10(s0))), e = s0 / mag;
    return (e >= 7.5 ? 10 : e >= 3.5 ? 5 : e >= 1.5 ? 2 : 1) * mag;
  }
  function chartSVG(chart, uid) {
    var series = (chart.series || []).filter(function (s) { return s.points && s.points.length; }).slice(0, 3);
    if (!series.length) return "";
    var xs = {};
    series.forEach(function (s) { s.points.forEach(function (p) { xs[p[0]] = 1; }); });
    xs = Object.keys(xs).sort();
    var vals = [];
    series.forEach(function (s) { s.points.forEach(function (p) { vals.push(+p[1]); }); });
    var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
    var step = niceStep(mx - mn, 5), lo = Math.floor(mn / step) * step, hi = Math.ceil(mx / step) * step;
    if (hi === lo) { hi += step; lo -= step; }
    var W = 960, H = 330, L = 52, R = series.length > 1 ? 120 : 24, Tm = 14, B = 34;
    var pw = W - L - R, ph = H - Tm - B;
    function X(i) { return L + (xs.length === 1 ? pw / 2 : (i / (xs.length - 1)) * pw); }
    function Y(v) { return Tm + ph - ((v - lo) / (hi - lo)) * ph; }
    var g = "";
    for (var v = lo; v <= hi + step / 2; v += step) {
      var y = Y(v).toFixed(1), lab = +v.toFixed(6);
      g += '<line x1="' + L + '" x2="' + (L + pw) + '" y1="' + y + '" y2="' + y + '" stroke="' + (Math.abs(v - lo) < 1e-9 ? "#bdbdbd" : "#ececec") + '" stroke-width="1"/>';
      g += '<text x="' + (L - 10) + '" y="' + y + '" text-anchor="end" dominant-baseline="middle">' + lab + "</text>";
    }
    var every = Math.max(1, Math.ceil(xs.length / 8));
    xs.forEach(function (d, i) {
      if (i % every === 0 || i === xs.length - 1) {
        if (i === xs.length - 1 && i % every !== 0 && i - Math.floor(i / every) * every < every / 2) return;
        g += '<text x="' + X(i).toFixed(1) + '" y="' + (H - 10) + '" text-anchor="middle">' + esc(fmtShort(d)) + "</text>";
      }
    });
    var lines = "";
    series.forEach(function (s, si) {
      var st = STROKES[si];
      var pts = s.points.slice().sort(function (a, b) { return String(a[0]).localeCompare(b[0]); })
        .map(function (p) { return X(xs.indexOf(p[0])).toFixed(1) + "," + Y(+p[1]).toFixed(1); });
      lines += '<polyline fill="none" stroke="' + st.c + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"' + (st.d ? ' stroke-dasharray="' + st.d + '"' : "") + ' points="' + pts.join(" ") + '"/>';
      if (series.length > 1) {
        var last = pts[pts.length - 1].split(",");
        lines += '<text x="' + (+last[0] + 8) + '" y="' + last[1] + '" dominant-baseline="middle" style="fill:#4a4a4a">' + esc(s.name) + "</text>";
      }
    });
    var hover = '<g class="hover" style="display:none"><line y1="' + Tm + '" y2="' + (Tm + ph) + '" stroke="#111" stroke-width="1"/>' +
      series.map(function (s, si) { return '<circle r="4.5" fill="' + STROKES[si].c + '" stroke="#fff" stroke-width="2" data-s="' + si + '"/>'; }).join("") + "</g>";
    var hit = '<rect class="hit" x="' + L + '" y="' + Tm + '" width="' + pw + '" height="' + ph + '" fill="transparent"/>';
    // stash geometry for the hover handler
    CHARTS[uid] = { xs: xs, series: series, X: X, Y: Y, W: W, L: L, pw: pw };
    return '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(chart.title || "Chart") + '">' + g + lines + hover + hit + "</svg>";
  }
  var CHARTS = {};
  function bindCharts() {
    Array.prototype.forEach.call(document.querySelectorAll(".chart-wrap"), function (wrap) {
      var c = CHARTS[wrap.dataset.uid]; if (!c) return;
      var svg = wrap.querySelector("svg"), hit = svg.querySelector(".hit"), hov = svg.querySelector(".hover"), tip = wrap.querySelector(".tip");
      function move(ev) {
        var r = svg.getBoundingClientRect(), sx = (ev.clientX - r.left) * (c.W / r.width);
        var i = c.xs.length === 1 ? 0 : Math.round(((sx - c.L) / c.pw) * (c.xs.length - 1));
        i = Math.max(0, Math.min(c.xs.length - 1, i));
        var d = c.xs[i], x = c.X(i), rows = [], topY = Infinity;
        hov.style.display = "";
        hov.querySelector("line").setAttribute("x1", x); hov.querySelector("line").setAttribute("x2", x);
        c.series.forEach(function (s, si) {
          var p = s.points.filter(function (q) { return q[0] === d; })[0], dot = hov.querySelector('circle[data-s="' + si + '"]');
          if (!p) { dot.style.display = "none"; return; }
          dot.style.display = ""; dot.setAttribute("cx", x); dot.setAttribute("cy", c.Y(+p[1]));
          topY = Math.min(topY, c.Y(+p[1]));
          rows.push((c.series.length > 1 ? esc(s.name) + ": " : "") + esc(p[1]));
        });
        tip.innerHTML = "<b>" + esc(fmtDate(d)) + "</b>" + rows.join("<br>");
        tip.style.display = "block";
        tip.style.left = (x / c.W) * r.width + "px";
        tip.style.top = (topY * (r.width / c.W) - 8) + "px";
      }
      hit.addEventListener("mousemove", move);
      hit.addEventListener("mouseleave", function () { hov.style.display = "none"; tip.style.display = "none"; });
    });
  }
  function chartToText(chart) {
    return (chart.series || []).map(function (s) {
      return "# " + (s.name || "Series") + "\n" + (s.points || []).map(function (p) { return p[0] + ", " + p[1]; }).join("\n");
    }).join("\n\n");
  }
  function textToSeries(txt) {
    var out = [], cur = null;
    txt.split(/\n/).forEach(function (line) {
      line = line.trim(); if (!line) return;
      if (line.charAt(0) === "#") { cur = { name: line.replace(/^#+\s*/, ""), points: [] }; out.push(cur); return; }
      var m = line.split(/[,\t;]\s*/);
      if (m.length >= 2 && !isNaN(parseFloat(m[1]))) {
        if (!cur) { cur = { name: "Series", points: [] }; out.push(cur); }
        cur.points.push([m[0].trim(), parseFloat(m[1])]);
      }
    });
    return out;
  }
  function chartBlock(path) {
    var ch = get(path); if (!ch) { set(path, { title: "", note: "", series: [] }); ch = get(path); }
    var has = (ch.series || []).some(function (s) { return s.points && s.points.length; });
    if (!has && !EDIT) return "";
    var uid = path.replace(/\W/g, "_");
    var series = (ch.series || []).filter(function (s) { return s.points && s.points.length; });
    var legend = series.length > 1 ? '<div class="legend">' + series.slice(0, 3).map(function (s, i) {
      return "<span><i" + (i ? ' class="dash"' : "") + ' style="' + (i === 2 ? "border-top-style:dotted" : "") + '"></i>' + esc(s.name) + "</span>";
    }).join("") + "</div>" : "";
    var table = "";
    if (has) {
      var xs = {}; series.forEach(function (s) { s.points.forEach(function (p) { xs[p[0]] = 1; }); });
      xs = Object.keys(xs).sort();
      table = '<button class="table-toggle" type="button" data-act="toggletable">Show data table</button><div class="data-table" hidden><table class="ind"><thead><tr><th>Period</th>' +
        series.map(function (s) { return "<th>" + esc(s.name) + "</th>"; }).join("") + "</tr></thead><tbody>" +
        xs.map(function (d) {
          return "<tr><td>" + esc(fmtDate(d)) + "</td>" + series.map(function (s) {
            var p = s.points.filter(function (q) { return q[0] === d; })[0]; return '<td class="num">' + (p ? esc(p[1]) : "—") + "</td>";
          }).join("") + "</tr>";
        }).join("") + "</tbody></table></div>";
    }
    return '<div class="chart-block">' +
      T(path + ".title", "div", "chart-title", "Chart title") +
      T(path + ".note", "div", "chart-note", "Source or note") +
      (has ? '<div class="chart-wrap" data-uid="' + uid + '">' + chartSVG(ch, uid) + '<div class="tip"></div></div>' + legend + table : "") +
      '<div class="ed block" style="flex-direction:column;margin-top:10px">' +
        '<span class="edit-note">Chart data — one series per block: a line starting with # for the series name, then "YYYY-MM, value" per line. Up to 3 series.</span>' +
        '<textarea data-chart="' + path + '">' + esc(chartToText(ch)) + "</textarea>" +
        '<div class="ebar-row" style="display:flex">' + '<button type="button" class="ebtn" style="display:inline-flex" data-act="applychart" data-target="' + path + '">Apply chart data</button></div>' +
      "</div></div>";
  }

  /* ---------------- pages ---------------- */
  function pageHome() {
    var h = DATA.home, reps = byDateDesc(DATA.reports || []);
    // months on record: span between earliest and latest dated item
    var dates = [];
    (DATA.reports || []).forEach(function (r) { if (r.date) dates.push(r.date); ((r.chart || {}).series || []).forEach(function (s) { (s.points || []).forEach(function (p) { dates.push(p[0]); }); }); });
    ((DATA.timeline || {}).events || []).forEach(function (e) { if (e.date) dates.push(e.date); });
    dates.sort();
    var months = 0;
    if (dates.length) {
      var a = dates[0].split("-"), b = dates[dates.length - 1].split("-");
      months = (b[0] - a[0]) * 12 + (b[1] - a[1]) + 1;
    }
    var stats = [
      [reps.length, "Research reports"],
      [months, "Months on record"],
      [(DATA.people.faculty || []).length, "Faculty reviewers"],
      [(DATA.people.students || []).length, "Student collaborators"]
    ];
    var focus = h.focus || [];
    return '<section class="hero">' +
        T("home.eyebrow", "div", "eyebrow") +
        T("home.title", "h1", "page-title") +
        T("home.lede", "p", "lede") +
      "</section>" +
      '<div class="stats">' + stats.map(function (s) { return '<div class="stat"><div class="num">' + s[0] + '</div><div class="lbl">' + s[1] + "</div></div>"; }).join("") + "</div>" +
      '<section class="section"><div class="section-head"><h2>About</h2></div>' + M("home.about") + "</section>" +
      '<section class="section"><div class="section-head"><h2>Research focus</h2></div><div class="focus-grid">' +
        focus.map(function (_, i) {
          return '<div class="focus">' + T("home.focus." + i + ".title", "h3") + M("home.focus." + i + ".text") + listTools("home.focus", i, focus.length) + "</div>";
        }).join("") + "</div>" +
        '<div class="ed ebar-row">' + btn("+ Add focus area", 'data-act="add" data-list="home.focus" data-tpl="focus"') + "</div>" +
      "</section>" +
      '<section class="section"><div class="section-head"><h2>Latest reports</h2><a href="#/research">All reports →</a></div>' +
        reportList(reps.slice(0, 3)) + "</section>";
  }

  function reportList(items) {
    if (!items.length) return '<p class="muted">No reports yet.</p>';
    return '<div class="rlist">' + items.map(function (o) {
      var r = o.x;
      return '<a class="rrow" href="#/research/' + encodeURIComponent(r.id) + '">' +
        '<div class="rdate">' + esc(fmtDate(r.date)) + "</div>" +
        "<div><div class=\"rtitle\">" + esc(r.title) + '</div><p class="rsum">' + esc(r.summary) + "</p>" +
          (r.tags && r.tags.length ? '<div class="tags">' + r.tags.map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") + "</div>" : "") +
        "</div>" +
        '<div class="rmeta">' + esc(r.period) + (r.coverage ? "<br>" + esc(r.coverage) : "") + "</div></a>";
    }).join("") + "</div>";
  }

  function pageResearch() {
    var reps = byDateDesc(DATA.reports || []);
    var tags = ["All"];
    reps.forEach(function (o) { (o.x.tags || []).forEach(function (t) { if (tags.indexOf(t) < 0) tags.push(t); }); });
    if (tags.indexOf(activeTag) < 0) activeTag = "All";
    var shown = reps.filter(function (o) { return activeTag === "All" || (o.x.tags || []).indexOf(activeTag) >= 0; });
    return T("research.title", "h1", "page-title") + T("research.lede", "p", "lede") +
      '<div class="ed ebar-row" style="margin-top:18px">' + btn("+ New report", 'data-act="newreport"') + "</div>" +
      (tags.length > 2 ? '<div class="filters">' + tags.map(function (t) {
        return '<button type="button" class="chip' + (t === activeTag ? " on" : "") + '" data-act="filter" data-tag="' + esc(t) + '">' + esc(t) + "</button>";
      }).join("") + "</div>" : '<div style="height:28px"></div>') +
      reportList(shown);
  }

  function pageReport(id) {
    var idx = -1;
    (DATA.reports || []).forEach(function (r, i) { if (r.id === id) idx = i; });
    if (idx < 0) return '<a class="back" href="#/research">← All reports</a><p>Report not found.</p>';
    var p = "reports." + idx, r = DATA.reports[idx];
    var tagsHtml = EDIT
      ? '<div class="tags"><span class="tag" style="text-transform:none" data-path="' + p + '.tags" data-kind="csv" data-ph="Tags, comma separated">' + esc((r.tags || []).join(", ")) + "</span></div>"
      : (r.tags && r.tags.length ? '<div class="tags">' + r.tags.map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") + "</div>" : "");
    var meta = [["Tracking period", "period"], ["Coverage", "coverage"], ["Authors", "authors"], ["Faculty review", "reviewer"]]
      .filter(function (m) { return EDIT || r[m[1]]; })
      .map(function (m) { return '<div><div class="k">' + m[0] + "</div>" + T(p + "." + m[1], "div", "v", m[0]) + "</div>"; }).join("");
    var inds = r.indicators || [];
    var indHtml = (inds.length || EDIT) ? '<h3>Key indicators</h3>' +
      (inds.length ? '<table class="ind"><thead><tr><th>Indicator</th><th>Level</th><th>Change</th><th>Source / note</th>' + (EDIT ? "<th></th>" : "") + "</tr></thead><tbody>" +
        inds.map(function (_, i) {
          var q = p + ".indicators." + i;
          return "<tr><td>" + T(q + ".name") + '</td><td class="num">' + T(q + ".value") + '</td><td class="num">' + T(q + ".change") + "</td><td>" + T(q + ".note") + "</td>" +
            (EDIT ? "<td>" + btn("Remove", 'data-act="del" data-list="' + p + '.indicators" data-i="' + i + '"') + "</td>" : "") + "</tr>";
        }).join("") + "</tbody></table>" : "") +
      '<div class="ed ebar-row">' + btn("+ Add indicator row", 'data-act="add" data-list="' + p + '.indicators" data-tpl="indicator"') + "</div>" : "";
    var secs = r.sections || [];
    var secHtml = secs.map(function (_, i) {
      return T(p + ".sections." + i + ".heading", "h3", "", "Heading") + M(p + ".sections." + i + ".body") + listTools(p + ".sections", i, secs.length);
    }).join("") + '<div class="ed ebar-row">' + btn("+ Add section", 'data-act="add" data-list="' + p + '.sections" data-tpl="section"') + "</div>";
    var imgs = r.images || [];
    var imgHtml = (imgs.length || EDIT) ? "<h3>Records and photographs</h3>" + gallery(p + ".images") : "";
    var link = r.link || {};
    var linkHtml = (link.url ? '<p style="margin-top:40px"><a href="' + esc(link.url) + '" target="_blank" rel="noopener">' + esc(link.label || "Full report") + " →</a></p>" : "") +
      '<div class="ed ebar-row" style="margin-top:20px">' + btn(link.url ? "Edit document link" : "+ Add document link (PDF, slides…)", 'data-act="link" data-target="' + p + '.link"') + "</div>";

    return '<a class="back" href="#/research">← All reports</a>' +
      '<div class="rhead"><div class="eyebrow">Research report · ' + D(p + ".date") + "</div>" +
        T(p + ".title", "h1", "page-title", "Report title") + tagsHtml +
        '<div class="meta-grid">' + meta + "</div></div>" +
      T(p + ".summary", "div", "summary-box", "Summary") +
      '<div class="rbody">' + chartBlock(p + ".chart") + indHtml + secHtml + imgHtml + linkHtml + "</div>" +
      '<div class="ed ebar-row" style="margin-top:50px">' + btn("Delete this report", 'data-act="delreport" data-i="' + idx + '"') + "</div>";
  }

  function pageTimeline() {
    var ev = (DATA.timeline.events || []), sorted = byDateDesc(ev), years = {}, order = [];
    sorted.forEach(function (o) { var y = String(o.x.date || "").slice(0, 4) || "—"; if (!years[y]) { years[y] = []; order.push(y); } years[y].push(o); });
    var repIds = {}; (DATA.reports || []).forEach(function (r) { repIds[r.id] = r; });
    return T("timeline.title", "h1", "page-title") + T("timeline.lede", "p", "lede") +
      '<div class="ed ebar-row" style="margin-top:18px">' + btn("+ Add timeline entry", 'data-act="add" data-list="timeline.events" data-tpl="event"') + "</div>" +
      order.map(function (y) {
        return '<div class="tl-year"><h2>' + esc(y) + '</h2><div class="tl-items">' + years[y].map(function (o) {
          var p = "timeline.events." + o.i, e = o.x, rep = e.report && repIds[e.report];
          return '<div class="tl-item">' + D(p + ".date", "div", "tl-date") + "<div>" +
            T(p + ".type", "div", "tl-type", "Type") + T(p + ".title", "div", "tl-title", "Title") + M(p + ".text", "tl-text") +
            (rep ? '<a class="tl-link" href="#/research/' + encodeURIComponent(rep.id) + '">Read the report →</a>' : "") +
            ((e.images && e.images.length) || EDIT ? gallery(p + ".images") : "") +
            '<div class="ed ebar-row">' + btn(rep ? "Change linked report" : "Link a report", 'data-act="evreport" data-target="' + p + '.report"') +
              btn("Remove entry", 'data-act="del" data-list="timeline.events" data-i="' + o.i + '"') + "</div>" +
          "</div></div>";
        }).join("") + "</div></div>";
      }).join("");
  }

  function personCards(list) {
    var arr = get(list) || [];
    return '<div class="people">' + arr.map(function (pp, i) {
      var p = list + "." + i;
      return '<div class="person"><div class="ph">' + (pp.photo ? '<img src="' + esc(pp.photo) + '" alt="' + esc(pp.name) + '" data-zoom="1" loading="lazy">' : "Portrait") + "</div>" +
        T(p + ".name", "h3", "", "Name") + T(p + ".role", "div", "role", "Title, institution") + M(p + ".note") +
        '<div class="ed ebar-row">' + btn("Upload photo", 'data-act="img" data-target="' + p + '.photo"') + btn("Use file path", 'data-act="imgpath" data-target="' + p + '.photo"') + "</div>" +
        listTools(list, i, arr.length) + "</div>";
    }).join("") + "</div>" + '<div class="ed ebar-row">' + btn("+ Add person", 'data-act="add" data-list="' + list + '" data-tpl="person"') + "</div>";
  }
  function pagePeople() {
    return T("people.title", "h1", "page-title") + T("people.lede", "p", "lede") +
      '<section class="section"><div class="section-head"><h2>Faculty</h2></div>' + personCards("people.faculty") + "</section>" +
      '<section class="section"><div class="section-head"><h2>Students</h2></div>' + personCards("people.students") + "</section>";
  }

  function renderChrome() {
    var s = DATA.settings;
    var brand = document.getElementById("brand");
    brand.innerHTML = T("settings.siteName", "span", "", "Site name");
    var year = new Date().getFullYear();
    var contact = EDIT
      ? "<span>Email: " + T("settings.email", "span", "", "email") + " · LinkedIn URL: " + T("settings.linkedin", "span", "", "https://linkedin.com/in/…") + "</span>"
      : "<span>" + (s.email && s.email.indexOf("[") < 0 ? '<a href="mailto:' + esc(s.email) + '">' + esc(s.email) + "</a>" : esc(s.email)) +
        (s.linkedin ? ' · <a href="' + esc(s.linkedin) + '" target="_blank" rel="noopener">LinkedIn</a>' : "") + "</span>";
    document.getElementById("footer").innerHTML =
      "<span>© " + year + " " + T("settings.author", "span", "", "Your name") + ". " + T("settings.footerNote", "span", "", "Footer note") + "</span>" + contact;
  }

  /* ---------------- router ---------------- */
  function route() { return (location.hash.replace(/^#\/?/, "") || "").split("/"); }
  function render(scrollTop) {
    CHARTS = {};
    var r = route(), html, name = r[0] || "";
    if (name === "research" && r[1]) html = pageReport(decodeURIComponent(r[1]));
    else if (name === "research") html = pageResearch();
    else if (name === "timeline") html = pageTimeline();
    else if (name === "collaborators") html = pagePeople();
    else { name = ""; html = pageHome(); }
    app.innerHTML = html;
    renderChrome();
    Array.prototype.forEach.call(document.querySelectorAll("#nav a"), function (a) { a.classList.toggle("active", a.dataset.route === name); });
    var label = { "": "", research: r[1] ? "Report" : "Research", timeline: "Timeline", collaborators: "Collaborators" }[name];
    document.title = (label ? label + " — " : "") + String(DATA.settings.siteName || "").replace(/[\[\]]/g, "");
    if (EDIT) Array.prototype.forEach.call(document.querySelectorAll("[data-path]"), function (el) { el.setAttribute("contenteditable", "true"); el.setAttribute("spellcheck", "true"); });
    bindCharts();
    if (scrollTop) window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", function () { render(true); });

  /* ---------------- edit mode ---------------- */
  var TPL = {
    image: function () { return { src: "", caption: "" }; },
    focus: function () { return { title: "New focus area", text: "" }; },
    section: function () { return { heading: "New section", body: "" }; },
    indicator: function () { return { name: "", value: "", change: "", note: "" }; },
    person: function () { return { name: "New person", role: "", note: "", photo: "" }; },
    event: function () { return { date: today(true), type: "Update", title: "New timeline entry", text: "", report: "", images: [] }; }
  };
  function newReport() {
    return {
      id: "report-" + Date.now().toString(36), date: today(false), title: "New report", period: "", coverage: "", tags: [],
      authors: DATA.settings.author || "", reviewer: "", summary: "",
      chart: { title: "Tracked series, indexed (start = 100)", note: "", series: [] },
      indicators: [], sections: [{ heading: "Thesis", body: "" }, { heading: "Findings", body: "" }], images: [], link: { label: "", url: "" }
    };
  }

  function saveDraft() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(DATA)); setStatus("Draft saved in this browser. Export to publish."); }
      catch (e) { setStatus("Browser storage is full (large images). Export now so nothing is lost."); }
    }, 300);
  }
  function setStatus(t) { var s = document.querySelector(".toolbar .status"); if (s) s.textContent = "Edit mode — " + t; }

  function exportContent() {
    var head = "/* SITE CONTENT — exported " + new Date().toISOString().slice(0, 16).replace("T", " ") + ".\n   Replace js/content.js with this file to publish the changes. */\n";
    var blob = new Blob([head + "window.SITE = " + JSON.stringify(DATA, null, 2) + ";\n"], { type: "text/javascript" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "content.js";
    document.body.appendChild(a); a.click(); a.remove();
    setStatus("content.js downloaded. Upload it to js/ in your site to publish.");
  }

  function compressImage(file) {
    return new Promise(function (resolve, reject) {
      if (/svg|gif/.test(file.type)) { var fr = new FileReader(); fr.onload = function () { resolve(fr.result); }; fr.onerror = reject; fr.readAsDataURL(file); return; }
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var max = 1600, w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, max / Math.max(w, h));
        var c = document.createElement("canvas"); c.width = Math.round(w * k); c.height = Math.round(h * k);
        var ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); resolve(c.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject; img.src = url;
    });
  }
  function pickImage(path) {
    var inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*";
    inp.onchange = function () {
      if (!inp.files[0]) return;
      compressImage(inp.files[0]).then(function (src) { set(path, src); saveDraft(); render(false); });
    };
    inp.click();
  }

  function startEdit() {
    EDIT = true;
    try { sessionStorage.setItem("site-edit", "1"); } catch (e) {}
    var draft = null;
    try { draft = localStorage.getItem(DRAFT_KEY); } catch (e) {}
    if (draft) { try { DATA = JSON.parse(draft); } catch (e) {} }
    document.body.classList.add("editing");
    var bar = document.createElement("div");
    bar.className = "toolbar";
    bar.innerHTML = '<div class="wrap"><span class="status"></span>' +
      '<button type="button" data-tb="export" class="primary">Export content.js</button>' +
      '<button type="button" data-tb="discard">Discard draft</button>' +
      '<button type="button" data-tb="exit">Exit edit mode</button></div>';
    document.body.appendChild(bar);
    setStatus(draft ? "Unpublished draft loaded from this browser." : "Click any outlined text to edit. Changes save here as a draft.");
    bar.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.tb === "export") exportContent();
      if (b.dataset.tb === "discard" && confirm("Discard all unpublished edits in this browser and return to the published version?")) {
        try { localStorage.removeItem(DRAFT_KEY); } catch (x) {}
        DATA = clone(window.SITE); render(false); setStatus("Draft discarded. Showing the published version.");
      }
      if (b.dataset.tb === "exit") stopEdit();
    });
    render(false);
  }
  function stopEdit() {
    EDIT = false;
    try { sessionStorage.removeItem("site-edit"); } catch (e) {}
    document.body.classList.remove("editing");
    var bar = document.querySelector(".toolbar"); if (bar) bar.remove();
    if (/[?&]edit\b/.test(location.search)) { location.href = location.pathname + location.hash; return; }
    // keep showing the draft so you can preview it as a visitor would
    render(false);
  }

  // Typing into a field updates the content
  document.addEventListener("input", function (e) {
    if (!EDIT) return;
    var el = e.target.closest && e.target.closest("[data-path]"); if (!el) return;
    var v;
    if (el.dataset.multi) v = el.innerText.split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean).join("\n\n");
    else v = el.innerText.replace(/\s*\n\s*/g, " ").replace(/ /g, " ").trim();
    if (el.dataset.kind === "csv") v = v.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    set(el.dataset.path, v);
    saveDraft();
  });
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.shiftKey && (e.key === "E" || e.key === "e")) { e.preventDefault(); EDIT ? stopEdit() : startEdit(); return; }
    if (!EDIT) return;
    var el = e.target.closest && e.target.closest("[data-path]");
    if (el && e.key === "Enter" && !el.dataset.multi) { e.preventDefault(); el.blur(); }
  });
  document.addEventListener("paste", function (e) {
    if (!EDIT || !(e.target.closest && e.target.closest("[data-path]"))) return;
    e.preventDefault();
    var text = (e.clipboardData || window.clipboardData).getData("text/plain");
    document.execCommand("insertText", false, text);
  });
  // Re-render dates/derived views when leaving a field
  document.addEventListener("focusout", function (e) {
    if (!EDIT) return;
    var el = e.target.closest && e.target.closest("[data-path]");
    if (el && /\.(date|tags)$/.test(el.dataset.path)) setTimeout(function () { if (!document.activeElement.closest("[data-path]")) render(false); }, 0);
  });

  // Buttons and clicks
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (EDIT && t.closest("[data-path]") && t.closest("a")) { e.preventDefault(); return; }
    var zoom = t.closest("img[data-zoom]");
    if (zoom && !EDIT) {
      var lb = document.getElementById("lightbox");
      lb.querySelector("img").src = zoom.src;
      lb.querySelector("figcaption").textContent = zoom.alt || "";
      lb.hidden = false; return;
    }
    if (t.closest("#lightbox")) { document.getElementById("lightbox").hidden = true; return; }
    var b = t.closest("[data-act]"); if (!b) return;
    var act = b.dataset.act, list = b.dataset.list, i = +b.dataset.i, arr = list ? get(list) : null;
    if (act === "filter") { activeTag = b.dataset.tag; render(false); return; }
    if (act === "toggletable") {
      var tb = b.nextElementSibling; tb.hidden = !tb.hidden; b.textContent = tb.hidden ? "Show data table" : "Hide data table"; return;
    }
    if (!EDIT) return;
    if (act === "add") { if (!arr) { set(list, []); arr = get(list); } arr.push(TPL[b.dataset.tpl]()); }
    else if (act === "del") { if (!confirm("Remove this item?")) return; arr.splice(i, 1); }
    else if (act === "up" && i > 0) { var u = arr[i - 1]; arr[i - 1] = arr[i]; arr[i] = u; }
    else if (act === "down" && i < arr.length - 1) { var d = arr[i + 1]; arr[i + 1] = arr[i]; arr[i] = d; }
    else if (act === "img") { pickImage(b.dataset.target); return; }
    else if (act === "imgpath") {
      var cur = get(b.dataset.target) || "";
      var pth = prompt("Image path or URL (e.g. images/meeting.jpg). Leave empty to clear.", /^data:/.test(cur) ? "" : cur);
      if (pth === null) return; set(b.dataset.target, pth.trim());
    }
    else if (act === "link") {
      var lk = get(b.dataset.target) || {};
      var url = prompt("Link to the full document (PDF, slides, etc.). Leave empty to remove.", lk.url || ""); if (url === null) return;
      var lab = url ? prompt("Link text", lk.label || "Full report (PDF)") : ""; if (lab === null) return;
      set(b.dataset.target, { label: lab, url: url.trim() });
    }
    else if (act === "evreport") {
      var ids = (DATA.reports || []).map(function (r) { return r.id + "  —  " + r.title; }).join("\n");
      var rid = prompt("Type the id of the report to link (leave empty for none):\n\n" + ids, get(b.dataset.target) || "");
      if (rid === null) return; set(b.dataset.target, rid.trim());
    }
    else if (act === "applychart") {
      var ta = document.querySelector('textarea[data-chart="' + b.dataset.target + '"]');
      set(b.dataset.target + ".series", textToSeries(ta.value));
    }
    else if (act === "newreport") {
      var nr = newReport(); DATA.reports.push(nr); saveDraft(); location.hash = "#/research/" + nr.id; return;
    }
    else if (act === "delreport") {
      if (!confirm("Delete this entire report?")) return;
      DATA.reports.splice(i, 1); saveDraft(); location.hash = "#/research"; return;
    }
    else return;
    saveDraft(); render(false);
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") document.getElementById("lightbox").hidden = true; });

  /* ---------------- start ---------------- */
  var wantEdit = /[?&]edit\b/.test(location.search);
  try { wantEdit = wantEdit || sessionStorage.getItem("site-edit") === "1"; } catch (e) {}
  if (wantEdit) startEdit(); else render(false);
})();
