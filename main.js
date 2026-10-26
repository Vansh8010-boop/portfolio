(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch {} },
  };
  const byId = Object.fromEntries(PROJECTS.map((p) => [p.id, p]));

  /* ================= boot sequence ================= */
  function boot() {
    const el = $("#boot");
    if (reduceMotion || store.get("booted") || location.hash.startsWith("#/")) { el.remove(); return Promise.resolve(); }
    const log = $("#boot-log");
    const lines = [
      ["d", "[    0.000000] vansh-os 2.0.27 (b.tech cse ai&ml) #1 SMP"],
      ["d", "[    0.004211] loading modules: pytorch numpy transformers"],
      ["ok", "[  OK  ] mounted /projects (4 shipped, 2 in progress)"],
      ["ok", "[  OK  ] started paged-attention.service"],
      ["ok", "[  OK  ] started grpo-trainer.service"],
      ["ok", "[  OK  ] initialized 1 spiking neural network"],
      ["w", "\nwelcome. starting interface_"],
    ];
    let done = false;
    return new Promise((resolve) => {
      const finish = () => {
        if (done) return;
        done = true;
        store.set("booted", "1");
        el.classList.add("gone");
        setTimeout(() => el.remove(), 600);
        removeEventListener("keydown", finish);
        resolve();
      };
      addEventListener("keydown", finish);
      el.addEventListener("click", finish);
      let i = 0;
      const next = () => {
        if (done) return;
        if (i >= lines.length) { setTimeout(finish, 400); return; }
        const [cls, text] = lines[i++];
        log.insertAdjacentHTML("beforeend", `<span class="${cls}">${esc(text)}</span>\n`);
        setTimeout(next, 80 + Math.random() * 120);
      };
      next();
    });
  }

  /* ================= spiking neural network background ================= */
  function neurons() {
    const cv = $("#neurons");
    const ctx = cv.getContext("2d");
    let W, H, dpr, nodes = [], pulses = [], frame = 0;
    const mouse = { x: -9999, y: -9999 };
    const LINK = 165, K = 3, LEAK = 0.02, WEIGHT = 0.32, REFRACT = 22;

    function resize() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.max(36, Math.min(110, Math.round((W * H) / 16000)));
      nodes = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15,
        v: Math.random() * 0.5, ref: 0, flash: 0, nb: [],
      }));
      pulses = [];
      link();
    }
    function link() {
      for (const a of nodes) {
        a.nb = nodes.filter((b) => b !== a)
          .map((b) => [b, Math.hypot(a.x - b.x, a.y - b.y)])
          .filter(([, d]) => d < LINK).sort((p, q) => p[1] - q[1]).slice(0, K).map(([b]) => b);
      }
    }
    function spike(a) {
      a.v = 0; a.ref = REFRACT; a.flash = 1;
      for (const b of a.nb) pulses.push({ a, b, t: 0, s: 0.035 + Math.random() * 0.02 });
    }
    function step() {
      frame++;
      if (frame % 90 === 0) link();
      for (const a of nodes) {
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > W) a.vx *= -1;
        if (a.y < 0 || a.y > H) a.vy *= -1;
        a.flash *= 0.92;
        if (a.ref > 0) { a.ref--; continue; }
        a.v += -a.v * LEAK + Math.random() * 0.01;
        if (Math.random() < 0.0018) a.v += 0.8;
        const d = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (d < 150) a.v += 0.05 * (1 - d / 150);
        if (a.v >= 1) spike(a);
      }
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.t += p.s;
        if (p.t >= 1) {
          if (p.b.ref === 0) { p.b.v += WEIGHT; if (p.b.v >= 1) spike(p.b); }
          pulses.splice(i, 1);
        }
      }
      if (pulses.length > 600) pulses.splice(0, pulses.length - 600);
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;
      for (const a of nodes) for (const b of a.nb) {
        const act = Math.max(a.flash, b.flash);
        ctx.strokeStyle = `rgba(76,201,240,${0.05 + act * 0.22})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      ctx.fillStyle = "rgba(80,250,123,.85)";
      for (const p of pulses) {
        ctx.beginPath(); ctx.arc(p.a.x + (p.b.x - p.a.x) * p.t, p.a.y + (p.b.y - p.a.y) * p.t, 1.5, 0, 6.283); ctx.fill();
      }
      for (const a of nodes) {
        const r = 1.5 + a.flash * 3.2 + a.v * 1.1;
        if (a.flash > 0.05) { ctx.fillStyle = `rgba(80,250,123,${a.flash * 0.16})`; ctx.beginPath(); ctx.arc(a.x, a.y, r * 4, 0, 6.283); ctx.fill(); }
        ctx.fillStyle = a.flash > 0.1 ? `rgba(180,255,200,${0.5 + a.flash * 0.5})` : `rgba(140,170,200,${0.3 + a.v * 0.4})`;
        ctx.beginPath(); ctx.arc(a.x, a.y, r, 0, 6.283); ctx.fill();
      }
    }
    let last = performance.now(), frames = 0, paused = false;
    const fpsEl = $("#fps");
    function loop(now) {
      if (!paused) { step(); draw(); }
      frames++;
      if (now - last > 1000) { fpsEl.textContent = `${frames} fps · ${nodes.length} neurons`; frames = 0; last = now; }
      requestAnimationFrame(loop);
    }
    neurons.pause = (v) => { paused = v; };
    addEventListener("resize", () => { clearTimeout(resize.t); resize.t = setTimeout(resize, 150); });
    addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    addEventListener("click", (e) => {
      if (e.target.closest("a,button,input,textarea,canvas:not(#neurons),.viz,.card,.feature,dl,figure,#project-view,#lightbox,#term-overlay")) return;
      for (const a of nodes) if (Math.hypot(a.x - e.clientX, a.y - e.clientY) < 200 && a.ref === 0) spike(a);
    });
    resize();
    if (reduceMotion) { for (let i = 0; i < 60; i++) step(); draw(); fpsEl.textContent = "static (reduced motion)"; }
    else requestAnimationFrame(loop);
  }

  /* ================= cursor ring ================= */
  function cursor() {
    const c = $("#cursor");
    if (matchMedia("(hover: none)").matches) return;
    addEventListener("pointermove", (e) => {
      c.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      c.classList.add("on");
      c.classList.toggle("hover", !!e.target.closest("a,button,.chip,.viz,input,textarea,.cert-badge"));
    }, { passive: true });
    document.addEventListener("pointerleave", () => c.classList.remove("on"));
  }

  /* ================= typed roles ================= */
  function typed() {
    const el = $("#typed");
    if (reduceMotion) { el.textContent = SITE.roles[0]; return; }
    let r = 0, i = 0, del = false;
    (function tick() {
      const word = SITE.roles[r];
      i += del ? -1 : 1;
      el.textContent = word.slice(0, i);
      let t = del ? 35 : 70;
      if (!del && i === word.length) { del = true; t = 1700; }
      else if (del && i === 0) { del = false; r = (r + 1) % SITE.roles.length; t = 300; }
      setTimeout(tick, t);
    })();
  }

  /* ================= project visuals (SVG) ================= */
  const VIS = {
    bars(v) {
      const max = Math.max(...v.rows.map((r) => r[1]));
      const rows = v.rows.map(([label, val, tone], i) => {
        const y = 78 + i * 74, w = Math.max(6, (val / max) * 300);
        const fill = tone === "accent" ? "var(--green)" : "rgba(170,182,195,.35)";
        return `<text x="40" y="${y}" class="vt">${esc(label)}</text>
          <rect x="40" y="${y + 10}" height="28" rx="6" width="0" style="fill:${fill}"><animate attributeName="width" from="0" to="${w}" dur="1.2s" begin="indefinite" fill="freeze" calcMode="spline" keySplines=".2 .8 .2 1" keyTimes="0;1"/></rect>
          <text x="${40 + w + 10}" y="${y + 30}" class="vv ${tone}">${val}</text>`;
      }).join("");
      return `<svg viewBox="0 0 420 262" role="img" aria-label="${esc(v.rows.map((r) => r[0] + ": " + r[1]).join(", "))}">${rows}</svg>`;
    },
    line(v) {
      const xs = v.points.map((p) => p[0]), ys = v.points.map((p) => p[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.floor(Math.min(...ys) - 1), y1 = Math.ceil(Math.max(...ys) + 1);
      const X = (x) => 50 + ((x - x0) / (x1 - x0)) * 330, Y = (y) => 210 - ((y - y0) / (y1 - y0)) * 150;
      const pts = v.points.map(([x, y]) => `${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(" ");
      const first = v.points[0], lastP = v.points[v.points.length - 1];
      return `<svg viewBox="0 0 420 262" role="img" aria-label="${esc(v.unit)} rising from ${first[1]}% to ${lastP[1]}%">
        <line x1="50" y1="210" x2="380" y2="210" class="axis"/>
        <polygon points="${X(x0)},210 ${pts} ${X(x1)},210" class="area"/>
        <polyline points="${pts}" class="ln" pathLength="1"/>
        ${v.points.map(([x, y]) => `<circle cx="${X(x)}" cy="${Y(y)}" r="4" class="pt"/>`).join("")}
        <text x="${X(first[0])}" y="${Y(first[1]) - 14}" class="vv muted" text-anchor="start">${first[1]}%</text>
        <text x="${X(lastP[0])}" y="${Y(lastP[1]) - 14}" class="vv accent" text-anchor="end">${lastP[1]}%</text>
        <text x="50" y="234" class="vt dimt">step ${x0}</text><text x="380" y="234" class="vt dimt" text-anchor="end">step ${x1}</text>
      </svg>`;
    },
    image(v) { return `<img src="${v.src}" alt="${esc(v.alt)}" loading="lazy">`; },
    flow(v) {
      const pos = v.steps.map((_, i) => [70 + (i % 3) * 140, i < 3 ? 95 : 185]);
      const order = [0, 1, 2, 5, 4, 3];
      const nodes = v.steps.map((s, i) => {
        const [x, y] = pos[order.indexOf(i)] || pos[i];
        return `<g class="fn" style="animation-delay:${i * 0.9}s"><rect x="${x - 52}" y="${y - 22}" width="104" height="44" rx="22"/><text x="${x}" y="${y + 6}" text-anchor="middle">${esc(s)}</text></g>`;
      }).join("");
      return `<svg viewBox="0 0 420 262" role="img" aria-label="Agent loop: ${esc(v.steps.join(", "))}">
        <path d="M122 95 H158 M262 95 H298 M350 117 V163 M298 185 H262 M158 185 H122" class="arrow"/>
        <path d="M18 185 Q -2 140 18 95" class="arrow dashed"/>
        ${nodes}</svg>`;
    },
    detect() {
      const boxes = [[60, 128, 70, 36, "car", 0], [250, 150, 76, 38, "car", 1.2], [180, 60, 24, 44, "person", 0.5], [330, 118, 64, 32, "bus", 2]];
      return `<svg viewBox="0 0 420 262" role="img" aria-label="Illustration of vehicle and pedestrian detection at a junction">
        <rect x="0" y="110" width="420" height="80" class="road"/><rect x="150" y="0" width="80" height="262" class="road"/>
        <path d="M0 150 H140 M240 150 H420" class="lane"/>
        ${boxes.map(([x, y, w, h, l, d]) => `<g class="det" style="animation-delay:${d}s"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/><text x="${x}" y="${y - 5}">${l}</text></g>`).join("")}
        <g transform="translate(244 24)"><rect width="22" height="58" rx="5" class="pole"/><circle cx="11" cy="12" r="6" class="off"/><circle cx="11" cy="29" r="6" class="off"/><circle cx="11" cy="46" r="6" class="go"/></g>
        <text x="272" y="44" class="vt dimt">busier road →</text><text x="272" y="62" class="vt dimt">longer green</text>
      </svg>`;
    },
  };
  const visTag = (p) => (p.visual.unit ? `<span class="viz-tag">${esc(p.visual.unit)}</span>` : "");
  const visual = (p) => `<a class="viz" href="#/p/${p.id}" aria-label="Open ${esc(p.title)} details">${VIS[p.visual.type](p.visual)}${visTag(p)}</a>`;
  const linkBtns = (p, withDetails) => [
    ...p.links.map((l) => `<a class="btn small${l.primary ? " primary" : ""}" href="${l.url}"${l.url.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>${esc(l.label)}${l.url.startsWith("http") ? " ↗" : ""}</a>`),
    withDetails ? `<a class="btn small ghost" href="#/p/${p.id}">Details <span>→</span></a>` : "",
  ].join("");
  const metric = (h) => `<div class="metric"><b>${esc(h.value)}</b><strong>${esc(h.label)}</strong><span>${esc(h.context)}</span></div>`;
  const progress = (p) => `<div class="progress"><div class="progress-meta"><span>${esc(p.stage)}</span><b>${Math.round(p.progress * 100)}%</b></div><div class="bar"><i data-w="${p.progress}"></i></div></div>`;

  /* ================= render sections ================= */
  function render() {
    $("#building-list").innerHTML = PROJECTS.filter((p) => p.status === "building").map((p) => `
      <article class="feature reveal" data-skills="${esc(p.skills.join("|"))}">
        ${visual(p)}
        <div>
          <p class="p-meta">${esc(p.stack.join(" · "))}</p>
          <h3 class="p-title"><a href="#/p/${p.id}">${esc(p.title)}</a></h3>
          <p class="p-tagline">${esc(p.tagline)}</p>
          ${metric(p.headline)}
          ${progress(p)}
          <div class="p-links"><a class="btn small primary" href="#/p/${p.id}">How it works <span>→</span></a>${linkBtns(p, false)}</div>
        </div>
      </article>`).join("");

    $("#shipped-list").innerHTML = PROJECTS.filter((p) => p.status === "shipped").map((p) => `
      <article class="card reveal" data-skills="${esc(p.skills.join("|"))}">
        ${visual(p)}
        <p class="p-meta">${esc(p.stack.join(" · "))}</p>
        <h3 class="p-title"><a href="#/p/${p.id}">${esc(p.title)}</a></h3>
        <p class="p-tagline">${esc(p.tagline)}</p>
        ${metric(p.headline)}
        <div class="p-links">${linkBtns(p, true)}</div>
      </article>`).join("");

    $("#skill-rows").innerHTML = SKILLS.map((g) => `
      <div class="skill-row reveal"><h4>${esc(g.group)}</h4>
        <div class="chips">${g.items.map((s) => `<button class="chip" data-skill="${esc(s)}">${esc(s)}</button>`).join("")}</div>
      </div>`).join("");

    $("#timeline").innerHTML = EXPERIENCE.map((e) => `
      <li class="tl-item reveal" data-skills="${esc(e.skills.join("|"))}">
        <div class="tl-rail" aria-hidden="true"></div>
        <div class="tl-content">
          <span class="tl-when">${esc(e.when)}</span>
          <h3>${esc(e.role)}</h3>
          <div class="tl-org">${esc(e.org)} <span>· ${esc(e.where)}</span></div>
          <p class="tl-summary">${esc(e.summary)}</p>
          <ul>${e.points.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        </div>
      </li>`).join("");

    $("#education-list").innerHTML = EDUCATION.map((e) => `
      <div class="edu reveal">
        <div class="edu-mark" aria-hidden="true">VIT</div>
        <div><h3>${esc(e.degree)}</h3><p>${esc(e.focus)}</p><p class="dim">${esc(e.school)} · ${esc(e.where)}</p></div>
        <div class="edu-when">${esc(e.when)}<span>${esc(e.note)}</span></div>
      </div>`).join("");

    $("#cert-list").innerHTML = CERTS.map((c, i) => `
      <div class="cert reveal">
        <img class="cert-badge" src="${c.badge}" alt="${esc(c.title)} badge" data-cert="${i}" loading="lazy">
        <div>
          <h3>${esc(c.title)}</h3>
          <p>${esc(c.issuer)} · ${esc(c.date)} · Credential ${esc(c.credential)}</p>
          <div class="p-links"><button class="btn small primary" data-cert="${i}">View certificate</button><a class="btn small ghost" href="${c.pdf}" target="_blank" rel="noopener">PDF ↗</a></div>
        </div>
      </div>`).join("");
  }

  /* ================= skill → project filter ================= */
  let activeSkill = null;
  function filterBy(skill, scroll = true) {
    const targets = $$("#building-list .feature, #shipped-list .card, #timeline .tl-item");
    const has = (el) => el.dataset.skills.split("|").includes(skill);
    if (skill && skill !== activeSkill && !targets.some(has)) { toast(`${skill}: on my resume, not in a public project yet`); return; }
    activeSkill = activeSkill === skill ? null : skill;
    $$(".chip").forEach((c) => c.classList.toggle("active", c.dataset.skill === activeSkill));
    targets.forEach((el) => el.classList.toggle("faded", !!activeSkill && !has(el)));
    $("#filter-bar").hidden = !activeSkill;
    $("#filter-name").textContent = activeSkill || "";
    if (activeSkill && scroll) $("#projects").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }

  /* ================= reveal, counters, bars, svg animations ================= */
  function observe() {
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        const el = en.target;
        el.classList.add("in");
        $$("[data-count]", el).forEach(countUp);
        $$(".bar i", el).forEach((b) => (b.style.width = `${b.dataset.w * 100}%`));
        $$("animate", el).forEach((a) => { try { a.beginElement(); } catch {} });
        $$(".ln", el).forEach((l) => l.classList.add("draw"));
        io.unobserve(el);
      }
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    $$(".reveal").forEach((el) => io.observe(el));

    const links = $$(".nav-desktop a");
    const so = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) links.forEach((a) => a.classList.toggle("active", a.hash === `#${en.target.id}`));
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main section[id]").forEach((s) => so.observe(s));
  }
  function countUp(el) {
    const end = parseFloat(el.dataset.count), dec = +el.dataset.dec || 0;
    const pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
    const fmt = (v) => `${pre}${v.toFixed(dec)}${suf}`;
    if (reduceMotion) { el.textContent = fmt(end); return; }
    const t0 = performance.now(), dur = 1400;
    (function f(now) {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(end * e);
      if (k < 1) requestAnimationFrame(f);
    })(t0);
  }

  /* ================= canvas helper ================= */
  function fitCanvas(cv, h) {
    const d = Math.min(devicePixelRatio || 1, 2), w = cv.clientWidth;
    cv.style.height = h + "px"; cv.width = w * d; cv.height = h * d;
    const ctx = cv.getContext("2d"); ctx.setTransform(d, 0, 0, d, 0, 0);
    return [ctx, w, h];
  }
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  /* ================= MMD illustration ================= */
  function mmdViz() {
    const cv = $("#mmd-canvas");
    const ctx = cv.getContext("2d");
    const out = $("#mmd-val"), box = out.parentElement;
    let W, H;
    const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283 * v); };
    const benignPt = () => { const c = [[0.3, 0.4], [0.62, 0.6], [0.45, 0.72]][Math.floor(Math.random() * 3)]; return { x: c[0] + gauss() * 0.06, y: c[1] + gauss() * 0.07, kind: "b" }; };
    const probePt = () => ({ x: 0.05 + Math.random() * 0.9, y: 0.1 + Math.random() * 0.82, kind: "a" });
    const ref = Array.from({ length: 60 }, benignPt);
    let win = Array.from({ length: 30 }, benignPt), phase = 0, userUntil = 0;
    const k = (a, b) => Math.exp(-((a.x - b.x) ** 2 + (a.y - b.y) ** 2) / (2 * 0.08 ** 2));
    function mmd2(X, Y) {
      let xx = 0, yy = 0, xy = 0;
      for (let i = 0; i < X.length; i++) for (let j = 0; j < X.length; j++) if (i !== j) xx += k(X[i], X[j]);
      for (let i = 0; i < Y.length; i++) for (let j = 0; j < Y.length; j++) if (i !== j) yy += k(Y[i], Y[j]);
      for (const a of X) for (const b of Y) xy += k(a, b);
      const m = X.length, n = Y.length;
      return Math.max(0, xx / (m * (m - 1)) + yy / (n * (n - 1)) - (2 * xy) / (m * n));
    }
    function size() { [, W, H] = fitCanvas(cv, cv.clientWidth < 400 ? 220 : 260); }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (const p of ref) { ctx.fillStyle = "rgba(76,201,240,.16)"; ctx.beginPath(); ctx.arc(p.x * W, p.y * H, 2, 0, 6.283); ctx.fill(); }
      win.forEach((p, i) => {
        const a = 0.35 + (i / win.length) * 0.65;
        ctx.fillStyle = p.kind === "a" ? `rgba(255,106,193,${a})` : `rgba(76,201,240,${a})`;
        ctx.beginPath(); ctx.arc(p.x * W, p.y * H, 3.2, 0, 6.283); ctx.fill();
      });
      const v = mmd2(ref, win), alert = v > 0.12;
      out.textContent = v.toFixed(3);
      box.classList.toggle("alert", alert);
      ctx.fillStyle = alert ? "rgba(255,106,193,.95)" : "rgba(170,182,195,.9)";
      ctx.font = "12px JetBrains Mono, monospace";
      ctx.fillText(alert ? "⚠ Unusual query pattern — raising risk level" : performance.now() < userUntil ? "You are probing…" : "Traffic looks normal", 12, 20);
    }
    function tick() {
      phase++;
      const probing = (phase % 240) > 150;
      if (performance.now() >= userUntil) { win.push(probing ? probePt() : benignPt()); if (win.length > 30) win.shift(); }
      draw();
    }
    cv.addEventListener("pointermove", (e) => {
      const r = cv.getBoundingClientRect();
      win.push({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, kind: "a" });
      if (win.length > 30) win.shift();
      userUntil = performance.now() + 1500;
    });
    addEventListener("resize", size);
    size();
    if (reduceMotion) draw(); else setInterval(() => { if (!document.hidden && $("#project-view").hidden) tick(); }, 120);
  }

  /* ================= project-page demos ================= */
  const DEMOS = {
    batching(root) {
      root.innerHTML = `<p>Eight chat requests arrive (most short, a few long) at a server with 4 slots. Watch how long each approach takes to finish them all.</p>
        <figure class="demo"><canvas></canvas>
        <div class="demo-controls"><button class="btn small primary" data-act="new">New requests</button></div>
        <div class="demo-stats"><div class="muted"><b data-s="static">–</b><span>Static batching: total time</span></div><div><b data-s="cont">–</b><span>Continuous batching: total time</span></div><div><b data-s="gain">–</b><span>Speed-up from batching alone</span></div></div></figure>
        <p class="viz-note">Simplified simulation. In static batching a finished slot sits idle until the slowest request in its batch is done; continuous batching refills it immediately. My engine combines this with a paged KV cache.</p>`;
      const cv = $("canvas", root);
      let raf, jobs;
      const SLOTS = 4;
      function sim() {
        // real chat traffic mixes many short replies with a few long ones
        jobs = Array.from({ length: 8 }, (_, i) => ({ id: i, len: Math.random() < 0.65 ? 2 + Math.round(Math.random() * 2) : 9 + Math.round(Math.random() * 5), hue: (i * 47) % 360 }));
        const stat = [], cont = [];
        let t = 0;
        for (let b = 0; b < jobs.length; b += SLOTS) {
          const batch = jobs.slice(b, b + SLOTS), end = t + Math.max(...batch.map((j) => j.len));
          batch.forEach((j, s) => stat.push({ j, s, a: t, b: t + j.len, idleTo: end }));
          t = end;
        }
        const free = Array(SLOTS).fill(0);
        for (const j of jobs) { const s = free.indexOf(Math.min(...free)); cont.push({ j, s, a: free[s], b: free[s] + j.len }); free[s] += j.len; }
        return { stat, cont, T1: t, T2: Math.max(...free) };
      }
      function run() {
        cancelAnimationFrame(raf);
        const r = sim();
        $('[data-s="static"]', root).textContent = `${r.T1} steps`;
        $('[data-s="cont"]', root).textContent = `${r.T2} steps`;
        $('[data-s="gain"]', root).textContent = `${(r.T1 / r.T2).toFixed(2)}×`;
        const t0 = performance.now(), dur = reduceMotion ? 0 : 4200;
        (function frame(now) {
          const [ctx, W] = fitCanvas(cv, 300);
          const T = r.T1, left = 92, scale = (W - left - 16) / T, lane = 22;
          const t = dur ? Math.min(T, ((now - t0) / dur) * T) : T;
          ctx.clearRect(0, 0, W, 300);
          ctx.font = "12px JetBrains Mono, monospace";
          [["Static", r.stat, 26], ["Continuous", r.cont, 166]].forEach(([name, segs, y0]) => {
            ctx.fillStyle = "rgba(170,182,195,.9)"; ctx.fillText(name, 10, y0 + 12);
            for (let s = 0; s < SLOTS; s++) { ctx.fillStyle = "rgba(255,255,255,.04)"; ctx.fillRect(left, y0 + s * (lane + 6), T * scale, lane); }
            for (const g of segs) {
              const y = y0 + g.s * (lane + 6);
              if (g.idleTo && t > g.b) { ctx.fillStyle = "rgba(255,106,193,.16)"; ctx.fillRect(left + g.b * scale, y, (Math.min(t, g.idleTo) - g.b) * scale, lane); }
              if (t > g.a) {
                ctx.fillStyle = `hsla(${g.j.hue},70%,60%,.85)`;
                ctx.fillRect(left + g.a * scale + 1, y, (Math.min(t, g.b) - g.a) * scale - 2, lane);
                if (t >= g.b) { ctx.fillStyle = "#07090d"; ctx.fillText(`R${g.j.id + 1}`, left + g.a * scale + 6, y + 15); }
              }
            }
          });
          ctx.fillStyle = "rgba(255,106,193,.7)"; ctx.fillRect(left, 280, 12, 10);
          ctx.fillStyle = "rgba(170,182,195,.9)"; ctx.fillText("idle slot, waiting for the batch", left + 18, 289);
          ctx.strokeStyle = "rgba(80,250,123,.8)"; ctx.beginPath(); ctx.moveTo(left + t * scale, 18); ctx.lineTo(left + t * scale, 272); ctx.stroke();
          if (t < T) raf = requestAnimationFrame(frame);
        })(performance.now());
      }
      $('[data-act="new"]', root).addEventListener("click", run);
      run();
      return () => cancelAnimationFrame(raf);
    },

    grpo(root) {
      const problems = [
        { q: "A baker makes 24 muffins and sells 3/4 of them. How many are left?", a: "6", wrong: ["18", "8", "4"] },
        { q: "Tom has 5 boxes of 12 pencils and gives away 17. How many does he keep?", a: "43", wrong: ["60", "47", "33"] },
        { q: "A train covers 180 km in 2.5 hours. What is its average speed in km/h?", a: "72", wrong: ["75", "450", "70"] },
      ];
      let pi = 0;
      root.innerHTML = `<p>GRPO has the model answer the same question several times, scores each answer, and compares it to the <em>group's average</em>. Above-average answers become more likely; below-average ones less likely. No separate critic model needed.</p>
        <figure class="demo"><p class="grpo-q"></p><div class="grpo-rows"></div>
        <div class="demo-stats"><div><b data-s="mean">–</b><span>Group average reward</span></div><div class="muted"><b data-s="std">–</b><span>Spread (std)</span></div></div>
        <p class="grpo-note"></p>
        <div class="demo-controls"><button class="btn small primary" data-act="sample">Sample a new group</button><button class="btn small" data-act="next">Next problem</button></div></figure>
        <p class="viz-note">Reward = 1.0 for the right answer + 0.2 for using the required answer format, as in my trainer. Answers here are illustrative.</p>`;
      function sample() {
        const P = problems[pi];
        $(".grpo-q", root).textContent = `Q: ${P.q}`;
        const g = Array.from({ length: 4 }, () => {
          const ok = Math.random() < 0.55, fmt = Math.random() < 0.8, ans = ok ? P.a : P.wrong[Math.floor(Math.random() * 3)];
          return { ok, fmt, ans, r: (ok ? 1 : 0) + (fmt ? 0.2 : 0) };
        });
        const mean = g.reduce((s, x) => s + x.r, 0) / g.length;
        const std = Math.sqrt(g.reduce((s, x) => s + (x.r - mean) ** 2, 0) / g.length);
        g.forEach((x) => (x.adv = std < 1e-6 ? 0 : (x.r - mean) / std));
        $(".grpo-rows", root).innerHTML = g.map((x, i) => {
          const w = Math.min(Math.abs(x.adv) / 2, 1) * 50;
          return `<div class="grpo-row"><span class="ans">#${i + 1} ${x.fmt ? `answer: \\boxed{${x.ans}}` : `I think it's ${x.ans}`} <span class="${x.ok ? "ok" : "no"}">${x.ok ? "✓" : "✗"}</span></span>
            <span class="rw">${x.r.toFixed(1)}</span>
            <span class="adv" title="advantage ${x.adv.toFixed(2)}"><i style="left:${x.adv >= 0 ? 50 : 50 - w}%;width:${w}%;background:${x.adv >= 0 ? "var(--green)" : "var(--pink)"}"></i></span></div>`;
        }).join("");
        $('[data-s="mean"]', root).textContent = mean.toFixed(2);
        $('[data-s="std"]', root).textContent = std.toFixed(2);
        $(".grpo-note", root).textContent = std < 1e-6
          ? "Every answer got the same reward, so this group teaches nothing. That's why I filter out problems the model always (or never) solves."
          : "Bars show each answer's advantage: green gets reinforced, pink gets discouraged.";
      }
      $('[data-act="sample"]', root).addEventListener("click", sample);
      $('[data-act="next"]', root).addEventListener("click", () => { pi = (pi + 1) % problems.length; sample(); });
      sample();
    },

    lif(root) {
      root.innerHTML = `<p>A spiking neuron collects input like a leaky bucket. When the level crosses a threshold it fires a spike and resets. Change the input and the leak to see when it fires.</p>
        <figure class="demo"><canvas></canvas>
        <div class="demo-controls">
          <label>Input current <input type="range" min="0" max="120" value="70" data-k="i"></label>
          <label>Leak time constant <input type="range" min="5" max="60" value="20" data-k="tau"></label>
        </div>
        <div class="demo-stats"><div><b data-s="spikes">–</b><span>Spikes in 300 steps</span></div><div class="muted"><b data-s="min">–</b><span>Minimum input needed to ever fire</span></div></div></figure>
        <p class="viz-note">Leaky integrate-and-fire: v ← v − v/τ + I, spike and reset when v ≥ 1. The same model drives the neurons in this site's background.</p>`;
      const cv = $("canvas", root);
      const iR = $('[data-k="i"]', root), tR = $('[data-k="tau"]', root);
      function draw() {
        const I = iR.value / 1000, tau = +tR.value;
        const [ctx, W, H] = fitCanvas(cv, 220);
        let v = 0; const vs = [], spikes = [];
        for (let t = 0; t < 300; t++) { v += -v / tau + I; if (v >= 1) { spikes.push(t); vs.push(1.25); v = 0; } else vs.push(v); }
        const X = (t) => 14 + (t / 299) * (W - 28), Y = (y) => H - 22 - (y / 1.3) * (H - 50);
        ctx.clearRect(0, 0, W, H);
        ctx.setLineDash([5, 5]); ctx.strokeStyle = "rgba(255,184,108,.7)"; ctx.beginPath(); ctx.moveTo(14, Y(1)); ctx.lineTo(W - 14, Y(1)); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = "rgba(255,184,108,.9)"; ctx.font = "11px JetBrains Mono, monospace"; ctx.fillText("threshold", 18, Y(1) - 6);
        ctx.strokeStyle = "rgba(76,201,240,.95)"; ctx.lineWidth = 1.6; ctx.beginPath();
        vs.forEach((y, t) => (t ? ctx.lineTo(X(t), Y(y)) : ctx.moveTo(X(t), Y(y)))); ctx.stroke(); ctx.lineWidth = 1;
        ctx.fillStyle = "rgba(80,250,123,.95)"; spikes.forEach((t) => ctx.fillRect(X(t) - 1, Y(1.3), 2, 12));
        $('[data-s="spikes"]', root).textContent = spikes.length;
        $('[data-s="min"]', root).textContent = (1 / tau).toFixed(3);
      }
      iR.addEventListener("input", draw); tR.addEventListener("input", draw);
      draw();
    },

    iframe(root, p) {
      root.innerHTML = `<p>This is the live app. Drop in a PDF or a photo of a page to try it.</p>
        <figure class="demo"><iframe src="${p.page.iframe}" title="${esc(p.title)} live demo" loading="lazy"></iframe></figure>`;
    },
  };

  /* ================= project pages (hash routing) ================= */
  let demoCleanup = null;
  function openProject(id) {
    const p = byId[id];
    if (!p) { location.hash = "#projects"; return; }
    const i = PROJECTS.indexOf(p), prev = PROJECTS[(i - 1 + PROJECTS.length) % PROJECTS.length], next = PROJECTS[(i + 1) % PROJECTS.length];
    const pg = p.page || {};
    $("#pv-prev").href = `#/p/${prev.id}`; $("#pv-prev").title = prev.title;
    $("#pv-next").href = `#/p/${next.id}`; $("#pv-next").title = next.title;
    $("#pv-body").innerHTML = `
      <p class="kicker mono">${p.status === "building" ? "In progress" : "Shipped"} · ${esc(p.stack.join(" · "))}</p>
      <h1 id="pv-title">${esc(p.title)}</h1>
      <p class="pv-tagline">${esc(p.tagline)}</p>
      <div class="pv-hero-metric"><b>${esc(p.headline.value)}</b><div><strong>${esc(p.headline.label)}</strong><span>${esc(p.headline.context)}</span></div></div>
      ${p.progress ? progress(p) : ""}
      <div class="p-links">${linkBtns(p, false)}</div>
      <div class="viz pv-viz">${VIS[p.visual.type](p.visual)}${visTag(p)}</div>
      ${pg.problem ? `<h2>The problem</h2><p>${esc(pg.problem)}</p>` : ""}
      ${pg.built ? `<h2>What I built</h2><ul class="ticks">${pg.built.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
      ${pg.demo ? `<h2>Try it</h2><div id="pv-demo"></div>` : ""}
      ${pg.results ? `<h2>Results</h2>${pg.results.map((r) => `<figure class="pv-fig"><img src="${r.img}" alt="${esc(r.caption)}" loading="lazy" data-zoom><figcaption>${esc(r.caption)}</figcaption></figure>`).join("")}` : ""}
      ${pg.honest ? `<h2>Honest notes</h2><p class="pv-honest"><b>Worth knowing:</b> ${esc(pg.honest)}</p>` : ""}`;
    const pv = $("#project-view");
    pv.hidden = false; pv.scrollTop = 0;
    document.body.classList.add("locked");
    neurons.pause && neurons.pause(true);
    if (demoCleanup) demoCleanup();
    demoCleanup = pg.demo ? DEMOS[pg.demo]($("#pv-demo"), p) || null : null;
    $$(".bar i", pv).forEach((b) => requestAnimationFrame(() => (b.style.width = `${b.dataset.w * 100}%`)));
    $$("animate", pv).forEach((a) => { try { a.beginElement(); } catch {} });
    $$(".ln", pv).forEach((l) => requestAnimationFrame(() => l.classList.add("draw")));
    document.title = `${p.title} — Vansh Kulshrestha`;
    $(".pv-back").focus({ preventScroll: true });
  }
  function closeProject() {
    const pv = $("#project-view");
    if (pv.hidden) return;
    pv.hidden = true;
    document.body.classList.remove("locked");
    neurons.pause && neurons.pause(false);
    if (demoCleanup) { demoCleanup(); demoCleanup = null; }
    $("#pv-body").innerHTML = "";
    document.title = "Vansh Kulshrestha";
  }
  function route() {
    const m = location.hash.match(/^#\/p\/([\w-]+)/);
    if (m) openProject(m[1]);
    else {
      const wasOpen = !$("#project-view").hidden;
      closeProject();
      if (wasOpen && location.hash.length > 1) $(location.hash)?.scrollIntoView();
    }
  }

  /* ================= job-description matcher ================= */
  const SAMPLES = [
    "Machine Learning Engineer Intern. You will train and evaluate deep learning models in Python and PyTorch, build data preprocessing and feature engineering pipelines, and deploy models behind REST APIs with Docker. Familiarity with scikit-learn, Git and SQL is a plus. Experience with AWS or Kubernetes preferred.",
    "LLM Infrastructure Intern. Help us serve large language models at scale: optimize inference latency and throughput, work on KV cache management, batching and quantization, benchmark against vLLM, and write CUDA or Triton kernels. Strong Python and PyTorch required; experience with transformers and GPU profiling preferred.",
    "AI Security Research Intern. Study adversarial attacks on LLMs, including prompt injection, model extraction and jailbreaks. Build evaluations and red-teaming tools for AI agents, design defenses and threat models, and write up results. Python, PyTorch and experience with embeddings or retrieval systems required.",
  ];
  const evidence = (id) => {
    if (byId[id]) return [byId[id].title, `#/p/${id}`];
    const ex = EXPERIENCE.find((e) => e.id === id);
    if (ex) return [`${ex.org} internship`, "#experience"];
    if (id === "research") return ["Research paper", "#research"];
    if (id === "oracle-cert") return ["Oracle certification", "#certifications"];
    return [id, "#"];
  };
  const termRe = (t) => new RegExp(`(?<![a-z0-9+#])${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-z0-9+#])`, "i");
  function match(text) {
    const out = $("#match-out");
    const jd = text.toLowerCase();
    if (jd.trim().length < 20) { out.innerHTML = `<p class="fit-empty">Paste a longer job description (a few sentences) to check the fit.</p>`; return; }
    const found = MATCHER.filter((m) => m.terms.some((t) => termRe(t).test(jd)));
    const have = found.filter((m) => m.where.length), listed = found.filter((m) => !m.where.length);
    const gaps = NOT_YET.filter((t) => termRe(t).test(jd));
    const total = have.length + listed.length + gaps.length;
    if (!total) { out.innerHTML = `<p class="fit-empty">I couldn't spot any technical requirements I recognize. Try pasting the "requirements" part of the posting.</p>`; return; }
    const score = Math.round(((have.length + listed.length * 0.5) / total) * 100);
    const counts = {};
    have.forEach((m) => m.where.forEach((w) => { if (byId[w]) counts[w] = (counts[w] || 0) + 1; }));
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => byId[id]);
    out.innerHTML = `
      <div class="fit-head"><b>${score}%</b><span>of the ${total} requirements I recognized are covered by work I've done</span></div>
      <div class="fit-bar"><i style="width:0"></i></div>
      <div class="fit-cols">
        <div><h4>Covered, with proof</h4><ul class="fit-list">${have.map((m) => `<li><span class="ok">✓</span><span>${esc(m.skill)}</span><span class="ev">${m.where.slice(0, 3).map((w) => { const [n, h] = evidence(w); return `<a href="${h}">${esc(n)}</a>`; }).join(" · ")}</span></li>`).join("") || `<li class="ev">None yet</li>`}
          ${listed.map((m) => `<li><span class="ok">~</span><span>${esc(m.skill)}</span><span class="ev">on my resume, no public project yet</span></li>`).join("")}</ul></div>
        <div>
          ${top.length ? `<h4>Most relevant projects</h4><ul class="fit-list">${top.map((p) => `<li><span class="ok">→</span><a href="#/p/${p.id}">${esc(p.title)}</a></li>`).join("")}</ul>` : ""}
          ${gaps.length ? `<h4 style="margin-top:22px">Not in my toolkit yet</h4><ul class="fit-list">${gaps.map((g) => `<li><span class="gap">○</span><span>${esc(g)}</span></li>`).join("")}</ul>` : ""}
        </div>
      </div>`;
    requestAnimationFrame(() => ($(".fit-bar i", out).style.width = `${score}%`));
  }
  function matcher() {
    const ta = $("#jd");
    $("#match-btn").addEventListener("click", () => match(ta.value));
    $$(".matcher-samples button").forEach((b) => b.addEventListener("click", () => { ta.value = SAMPLES[+b.dataset.sample]; match(ta.value); }));
    ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) match(ta.value); });
  }

  /* ================= lightbox ================= */
  function openLightbox(src, alt, actions = "") {
    $("#lb-img").src = src; $("#lb-img").alt = alt;
    $("#lb-actions").innerHTML = actions;
    $("#lightbox").hidden = false;
    $("#lb-close").focus();
  }
  const closeLightbox = () => { $("#lightbox").hidden = true; };

  /* ================= terminal ================= */
  const C = (cls, s) => `<span class="${cls}">${s}</span>`;
  const run = (c) => `<span class="chip-cmd" data-run="${esc(c)}">${esc(c)}</span>`;
  const sections = ["about", "projects", "research", "skills", "experience", "education", "certifications", "contact"];
  const allIds = PROJECTS.map((p) => p.id);
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2200); }
  function copyEmail() {
    const ok = () => toast("Copied vanshryan@gmail.com");
    if (navigator.clipboard) navigator.clipboard.writeText(SITE.email).then(ok, () => toast(SITE.email));
    else toast(SITE.email);
  }
  function go(id) { closeOverlay(); location.hash = `#${id}`; }
  function bar(p, n = 14) { const f = Math.round(p * n); return C("k", "█".repeat(f)) + C("d", "░".repeat(n - f)); }

  const COMMANDS = {
    help: { f: () => [
      C("d", "available commands:"),
      ...[["whoami", "who I am"], ["projects", "everything I've built"], ["open <id>", "open a project page"], ["ps", "work in progress"],
        ["experience", "internships"], ["research", "current paper"], ["certs", "certifications"], ["contact", "how to reach me"],
        ["resume", "open my resume"], ["goto <section>", "scroll to a section"], ["clear", "clear the screen"]]
        .map(([c, d]) => { const [name, arg] = c.split(" "); return `  ${run(name)}${arg ? " " + C("d", esc(arg)) : ""}${" ".repeat(Math.max(1, 16 - c.length))}${C("d", "— " + d)}`; }),
      C("d", "tip: tab completes, ↑/↓ for history, ` toggles this window."),
    ] },
    whoami: { f: () => [
      `${C("k", "Vansh Kulshrestha")} — AI/ML engineer, final-year B.Tech CSE (AI & ML) @ VIT-AP, class of 2027.`,
      "I learn ML by building the systems myself instead of only calling libraries:",
      "an LLM inference engine, a GRPO trainer, a spiking neural net, and defenses for LLM APIs.",
    ] },
    projects: { f: () => [
      C("d", "in progress:"), ...PROJECTS.filter((p) => p.status === "building").map((p) => `  ${C("k", "●")} ${run("open " + p.id)} ${C("d", "— " + p.title)}`),
      C("d", "shipped:"), ...PROJECTS.filter((p) => p.status === "shipped").map((p) => `  ${C("c", "●")} ${run("open " + p.id)} ${C("d", "— " + p.title)}`),
    ] },
    ls: { f: (a) => COMMANDS.projects.f(a) },
    open: { f: ([id]) => {
      if (!byId[id]) return [C("err", `open: ${esc(id || "")}: no such project`), C("d", "try: ") + allIds.map((i) => run("open " + i)).join(" ")];
      setTimeout(() => { closeOverlay(); location.hash = `#/p/${id}`; }, 150);
      return [C("d", `opening ${byId[id].title}…`)];
    } },
    cat: { f: (a) => COMMANDS.open.f(a) },
    ps: { f: () => [
      C("d", "  NAME         PROGRESS"),
      ...PROJECTS.filter((p) => p.status === "building").map((p) => `  ${C("k", p.id.padEnd(12))} ${bar(p.progress)} ${String(Math.round(p.progress * 100)).padStart(3)}%\n  ${C("d", "└ " + p.stage)}`),
    ] },
    experience: { f: () => EXPERIENCE.map((e) => `${C("a", e.when.padEnd(16))} ${C("k", e.role)} @ ${e.org}\n${" ".repeat(17)}${C("d", e.summary)}`) },
    research: { f: () => [C("k", "Detecting Model-Extraction Probing with Semantic Embeddings and MMD"), C("a", "[manuscript in preparation]"), C("d", "→ ") + run("goto research")] },
    certs: { f: () => CERTS.map((c) => `${C("a", "▸")} ${C("k", esc(c.title))} ${C("d", `— ${c.issuer}, ${c.date}`)}`) },
    contact: { f: () => [
      `email     <a href="mailto:${SITE.email}">${SITE.email}</a>  ${run("email")} ${C("d", "to copy")}`,
      `linkedin  <a href="${SITE.linkedin}" target="_blank" rel="noopener">${SITE.linkedin.replace("https://www.", "")}</a>`,
      `github    <a href="${SITE.github}" target="_blank" rel="noopener">${SITE.github.replace("https://", "")}</a>`,
    ] },
    email: { f: () => { copyEmail(); return [C("k", "✓ copied to clipboard")]; } },
    resume: { f: () => { open(SITE.resume, "_blank", "noopener"); return [C("d", "opening resume…")]; } },
    goto: { f: ([s]) => {
      if (!sections.includes(s)) return [C("err", `goto: unknown section '${esc(s || "")}'`), C("d", "sections: ") + sections.map((x) => run("goto " + x)).join(" ")];
      setTimeout(() => go(s), 150);
      return [C("d", `→ #${s}`)];
    } },
    cd: { f: (a) => COMMANDS.goto.f(a) },
    sudo: { f: (a) => a.join(" ").includes("hire")
      ? [C("k", "[sudo] permission granted."), "excellent decision.", `<a href="mailto:${SITE.email}?subject=Let's%20talk">→ open mail client</a>`]
      : [C("err", "vansh is not in the sudoers file."), C("d", "(try: sudo hire vansh)")] },
    exit: { f: () => { setTimeout(closeOverlay, 100); return [C("d", "bye.")]; } },
    clear: { f: (a, t) => { t.out.innerHTML = ""; return []; } },
  };
  const names = Object.keys(COMMANDS);

  class Term {
    constructor(root) {
      this.root = root; this.out = $(".term-out", root); this.input = $("input", root);
      this.hist = []; this.hi = 0;
      root.addEventListener("click", (e) => {
        const r = e.target.closest("[data-run]");
        if (r) { this.exec(r.dataset.run); return; }
        if (!e.target.closest("a") && !getSelection().toString()) this.input.focus({ preventScroll: true });
      });
      this.input.addEventListener("keydown", (e) => this.key(e));
    }
    print(lines, cls = "") {
      for (const l of lines) this.out.insertAdjacentHTML("beforeend", `<div class="${cls}">${l}</div>`);
      this.root.scrollTop = this.root.scrollHeight;
    }
    exec(raw) {
      const line = raw.trim();
      this.print([esc(line)], "cmd");
      if (!line) return;
      this.hist.push(line); this.hi = this.hist.length;
      const [name, ...args] = line.split(/\s+/);
      const cmd = COMMANDS[name.toLowerCase()];
      if (!cmd) { this.print([C("err", `command not found: ${esc(name)}`) + C("d", " — type ") + run("help")]); return; }
      this.print(cmd.f(args, this));
    }
    key(e) {
      if (e.key === "Enter") { this.exec(this.input.value); this.input.value = ""; }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (this.hi > 0) this.input.value = this.hist[--this.hi]; }
      else if (e.key === "ArrowDown") { e.preventDefault(); this.hi = Math.min(this.hist.length, this.hi + 1); this.input.value = this.hist[this.hi] || ""; }
      else if (e.key === "Tab") {
        e.preventDefault();
        const parts = this.input.value.split(" ");
        let pool = names, cur = parts[0];
        if (parts.length > 1) { cur = parts[parts.length - 1]; pool = ["goto", "cd"].includes(parts[0]) ? sections : ["open", "cat"].includes(parts[0]) ? allIds : []; }
        const m = pool.filter((n) => n.startsWith(cur));
        if (m.length === 1) { parts[parts.length - 1] = m[0]; this.input.value = parts.join(" ") + (parts.length === 1 ? " " : ""); }
        else if (m.length > 1) this.print([C("d", m.join("  "))]);
      }
    }
  }
  let term;
  const overlay = $("#term-overlay");
  function openOverlay() {
    overlay.hidden = false;
    if (!term.out.childElementCount) { term.exec("whoami"); term.print([C("d", "type ") + run("help") + C("d", " or click any underlined command.")]); }
    term.input.focus();
  }
  function closeOverlay() { overlay.hidden = true; }

  /* ================= wiring ================= */
  function wire() {
    term = new Term($("#term-overlay [data-term]"));
    $("#term-toggle").addEventListener("click", openOverlay);
    $("#term-close").addEventListener("click", closeOverlay);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeOverlay(); });

    // mobile menu
    const mb = $("#menu-btn"), mm = $("#mobile-menu");
    const setMenu = (open) => { mm.hidden = !open; mb.setAttribute("aria-expanded", open); mb.setAttribute("aria-label", open ? "Close menu" : "Open menu"); };
    mb.addEventListener("click", () => setMenu(mm.hidden));
    mm.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
    addEventListener("resize", () => { if (innerWidth > 980) setMenu(false); });

    // skills
    $("#skill-rows").addEventListener("click", (e) => { const c = e.target.closest(".chip"); if (c) filterBy(c.dataset.skill); });
    $("#filter-clear").addEventListener("click", () => filterBy(activeSkill, false));

    // certificates + figure zoom
    document.addEventListener("click", (e) => {
      const c = e.target.closest("[data-cert]");
      if (c) { const cert = CERTS[+c.dataset.cert]; openLightbox(cert.image, cert.title, `<a class="btn small" href="${cert.pdf}" target="_blank" rel="noopener">Open PDF ↗</a>`); return; }
      const z = e.target.closest("[data-zoom]");
      if (z) openLightbox(z.src, z.alt);
    });
    $("#lb-close").addEventListener("click", closeLightbox);
    $("#lightbox").addEventListener("click", (e) => { if (e.target.id === "lightbox") closeLightbox(); });

    addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (!$("#lightbox").hidden) closeLightbox();
        else if (!overlay.hidden) closeOverlay();
        else if (!$("#project-view").hidden) location.hash = "#projects";
        else if (!mm.hidden) setMenu(false);
      }
      const typing = e.target.closest?.("input,textarea");
      if (e.key === "`" && !typing) { e.preventDefault(); overlay.hidden ? openOverlay() : closeOverlay(); }
    });

    $("#year").textContent = new Date().getFullYear();
    $("#copy-email").addEventListener("click", copyEmail);
    addEventListener("hashchange", route);
    const h1 = $(".glitch");
    if (!reduceMotion) setInterval(() => { h1.classList.add("glitching"); setTimeout(() => h1.classList.remove("glitching"), 220); }, 6000);
  }

  /* ================= init ================= */
  render();
  neurons();
  cursor();
  observe();
  mmdViz();
  matcher();
  wire();
  route();
  boot().then(typed);
})();
