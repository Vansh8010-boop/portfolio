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

  /* ================= boot sequence ================= */
  function boot() {
    const el = $("#boot");
    if (reduceMotion || store.get("booted")) { el.remove(); return Promise.resolve(); }
    const log = $("#boot-log");
    const lines = [
      ["d", "[    0.000000] vansh-os 2.0.27 (b.tech cse ai&ml) #1 SMP"],
      ["d", "[    0.004211] loading kernel modules: pytorch numpy transformers"],
      ["ok", "[  OK  ] mounted /projects (3 shipped, 2 running)"],
      ["ok", "[  OK  ] started paged-attention.service"],
      ["ok", "[  OK  ] started grpo-trainer.service"],
      ["ok", "[  OK  ] initialized 1 spiking neural network (LIF, τ=50ms)"],
      ["d", "[    0.912003] probing for model-extraction attacks... none found"],
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
        el.removeEventListener("click", finish);
        resolve();
      };
      addEventListener("keydown", finish);
      el.addEventListener("click", finish);
      let i = 0;
      const next = () => {
        if (done) return;
        if (i >= lines.length) { setTimeout(finish, 450); return; }
        const [cls, text] = lines[i++];
        log.insertAdjacentHTML("beforeend", `<span class="${cls}">${esc(text)}</span>\n`);
        setTimeout(next, 90 + Math.random() * 140);
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
      const n = Math.max(36, Math.min(120, Math.round((W * H) / 15000)));
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
        a.nb = nodes
          .filter((b) => b !== a)
          .map((b) => [b, Math.hypot(a.x - b.x, a.y - b.y)])
          .filter(([, d]) => d < LINK)
          .sort((p, q) => p[1] - q[1])
          .slice(0, K)
          .map(([b]) => b);
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
        // leaky integration + spontaneous input + cursor stimulation
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
      for (const a of nodes) {
        for (const b of a.nb) {
          const act = Math.max(a.flash, b.flash);
          ctx.strokeStyle = `rgba(76,201,240,${0.06 + act * 0.25})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      for (const p of pulses) {
        const x = p.a.x + (p.b.x - p.a.x) * p.t, y = p.a.y + (p.b.y - p.a.y) * p.t;
        ctx.fillStyle = "rgba(80,250,123,.9)";
        ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 6.283); ctx.fill();
      }
      for (const a of nodes) {
        const r = 1.6 + a.flash * 3.5 + a.v * 1.2;
        if (a.flash > 0.05) {
          ctx.fillStyle = `rgba(80,250,123,${a.flash * 0.18})`;
          ctx.beginPath(); ctx.arc(a.x, a.y, r * 4, 0, 6.283); ctx.fill();
        }
        ctx.fillStyle = a.flash > 0.1 ? `rgba(180,255,200,${0.5 + a.flash * 0.5})` : `rgba(140,170,200,${0.35 + a.v * 0.4})`;
        ctx.beginPath(); ctx.arc(a.x, a.y, r, 0, 6.283); ctx.fill();
      }
    }

    let last = performance.now(), frames = 0;
    const fpsEl = $("#fps");
    function loop(now) {
      step(); draw();
      frames++;
      if (now - last > 1000) { fpsEl.textContent = `${frames} fps · ${nodes.length} neurons`; frames = 0; last = now; }
      requestAnimationFrame(loop);
    }

    addEventListener("resize", () => { clearTimeout(resize.t); resize.t = setTimeout(resize, 150); });
    addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });
    addEventListener("click", (e) => {
      if (e.target.closest("a,button,input,.window,.card,.chip,.stat,.contact-box,.skill-group")) return;
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
      c.classList.toggle("hover", !!e.target.closest("a,button,.chip,.card,input"));
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

  /* ================= render content ================= */
  const usedSkills = new Set([...RUNNING, ...PROJECTS, ...EXPERIENCE].flatMap((p) => p.skills));

  function render() {
    $("#skill-grid").innerHTML = SKILLS.map((g) => `
      <div class="skill-group reveal">
        <h3><i>${g.icon}</i>${esc(g.group)}</h3>
        <div class="chips">${g.items.map((s) => `<button class="chip${usedSkills.has(s) ? " used" : ""}" data-skill="${esc(s)}">${esc(s)}</button>`).join("")}</div>
      </div>`).join("");

    $("#proc-grid").innerHTML = RUNNING.map((p) => `
      <article class="card proc reveal" data-id="${p.id}" data-skills="${esc(p.skills.join("|"))}">
        <div class="proc-head"><span>PID ${p.pid} · ${esc(p.id)}</span><span class="state"><span class="dot live"></span>RUNNING</span></div>
        <h4>${esc(p.title)}</h4>
        <p class="blurb">${esc(p.blurb)}</p>
        <div class="proc-metric"><b>${esc(p.metric.value)}</b><span>${esc(p.metric.label)}</span></div>
        <p class="proc-detail">${esc(p.detail)}</p>
        <div class="bar"><i data-w="${p.progress}"></i></div>
        <div class="bar-meta"><span>${esc(p.stage)}</span><span>${Math.round(p.progress * 100)}%</span></div>
        <ul class="plog">${p.log.map((l) => `<li class="${l.startsWith("✓") ? "done" : l.startsWith("▶") ? "now" : ""}">${esc(l)}</li>`).join("")}</ul>
        <div class="card-foot">
          <div class="stack">${p.skills.slice(0, 4).map((s) => `<span>${esc(s)}</span>`).join("")}</div>
          <a class="repo" href="${p.repo}" target="_blank" rel="noopener">View repo ↗</a>
        </div>
      </article>`).join("");

    $("#card-grid").innerHTML = PROJECTS.map((p) => `
      <article class="card reveal" data-id="${p.id}" data-skills="${esc(p.skills.join("|"))}">
        <p class="kind">${esc(p.kind)}</p>
        <h4>${esc(p.title)}</h4>
        <p class="blurb">${esc(p.blurb)}</p>
        <div class="metrics">${p.metrics.map(([v, l]) => `<div><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join("")}</div>
        <div class="stack">${p.stack.map((s) => `<span>${esc(s)}</span>`).join("")}</div>
      </article>`).join("");

    $("#cert-grid").innerHTML = CERTS.map((c) => `
      <article class="card cert-card reveal">
        <div class="cert-badge">${esc(c.issuer.slice(0, 1))}</div>
        <div>
          <p class="kind">${esc(c.issuer)}</p>
          <h4>${esc(c.title)}</h4>
          <p class="blurb">${esc(c.blurb)}</p>
          <div class="card-foot">
            <div class="stack">${c.skills.map((s) => `<span>${esc(s)}</span>`).join("")}</div>
            <a class="repo" href="${c.link}" target="_blank" rel="noopener">View certificate ↗</a>
          </div>
        </div>
      </article>`).join("");

    $("#timeline").innerHTML = EXPERIENCE.map((e) => `
      <li class="reveal" data-skills="${esc(e.skills.join("|"))}">
        <span class="when">${esc(e.when)}</span>
        <h4>${esc(e.role)}</h4>
        <div class="org">${esc(e.org)} <span>· ${esc(e.where)}</span></div>
        ${e.project ? `<div class="proj">▸ ${esc(e.project)}</div>` : ""}
        ${e.points.length ? `<ul>${e.points.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      </li>`).join("");
  }

  /* ================= skill → project filter ================= */
  let activeSkill = null;
  function filterBy(skill, scroll = true) {
    activeSkill = activeSkill === skill ? null : skill;
    $$(".chip").forEach((c) => c.classList.toggle("active", c.dataset.skill === activeSkill));
    const targets = $$("#proc-grid .card, #card-grid .card, #timeline > li");
    targets.forEach((el) => {
      const has = activeSkill && el.dataset.skills.split("|").includes(activeSkill);
      el.classList.toggle("faded", !!activeSkill && !has);
      el.classList.toggle("match", !!has);
    });
    $("#filter-bar").hidden = !activeSkill;
    $("#filter-name").textContent = activeSkill || "";
    if (activeSkill && scroll) {
      const first = targets.find((el) => el.classList.contains("match"));
      (first || $("#projects")).scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    }
  }

  /* ================= card tilt + spotlight ================= */
  function tilt() {
    if (matchMedia("(hover: none)").matches) return;
    document.addEventListener("pointermove", (e) => {
      const card = e.target.closest(".card");
      $$(".card.tilting").forEach((c) => { if (c !== card) { c.style.transform = ""; c.classList.remove("tilting"); } });
      if (!card) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", `${x * 100}%`);
      card.style.setProperty("--my", `${y * 100}%`);
      if (!reduceMotion) {
        card.classList.add("tilting");
        card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 5}deg) rotateY(${(x - 0.5) * 6}deg)`;
      }
    }, { passive: true });
  }

  /* ================= reveal, counters, bars ================= */
  function observe() {
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        const el = en.target;
        el.classList.add("in");
        $$("[data-count]", el).forEach(countUp);
        $$(".bar i", el).forEach((b) => (b.style.width = `${b.dataset.w * 100}%`));
        io.unobserve(el);
      }
    }, { threshold: 0.05, rootMargin: "0px 0px -40px 0px" });
    $$(".reveal").forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 70}ms`; io.observe(el); });

    // highlight current section in nav
    const links = $$(".topbar nav a");
    const so = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) links.forEach((a) => a.classList.toggle("active", a.hash === `#${en.target.id}`));
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("section[id]").forEach((s) => so.observe(s));
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

  /* ================= MMD toy visualization ================= */
  // Benign queries cluster in embedding space; probing queries sweep it.
  // Shows the MMD² between a reference benign sample and the incoming window.
  function mmdViz() {
    const cv = $("#mmd-canvas");
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const out = $("#mmd-val"), box = out.parentElement;
    let W, H;
    const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283 * v); };
    const benignPt = () => {
      const c = [[0.3, 0.4], [0.62, 0.6], [0.45, 0.72]][Math.floor(Math.random() * 3)];
      return { x: c[0] + gauss() * 0.06, y: c[1] + gauss() * 0.07, kind: "b" };
    };
    const probePt = () => ({ x: 0.05 + Math.random() * 0.9, y: 0.08 + Math.random() * 0.84, kind: "a" });
    const ref = Array.from({ length: 60 }, benignPt);
    let win = Array.from({ length: 30 }, benignPt);
    let phase = 0, userUntil = 0;

    const k = (a, b) => Math.exp(-((a.x - b.x) ** 2 + (a.y - b.y) ** 2) / (2 * 0.08 ** 2));
    function mmd2(X, Y) {
      let xx = 0, yy = 0, xy = 0;
      for (let i = 0; i < X.length; i++) for (let j = 0; j < X.length; j++) if (i !== j) xx += k(X[i], X[j]);
      for (let i = 0; i < Y.length; i++) for (let j = 0; j < Y.length; j++) if (i !== j) yy += k(Y[i], Y[j]);
      for (const a of X) for (const b of Y) xy += k(a, b);
      const m = X.length, n = Y.length;
      return Math.max(0, xx / (m * (m - 1)) + yy / (n * (n - 1)) - (2 * xy) / (m * n));
    }

    function size() { const r = cv.getBoundingClientRect(); const d = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (const p of ref) { ctx.fillStyle = "rgba(76,201,240,.18)"; ctx.beginPath(); ctx.arc(p.x * W, p.y * H, 2, 0, 6.283); ctx.fill(); }
      win.forEach((p, i) => {
        const a = 0.35 + (i / win.length) * 0.65;
        ctx.fillStyle = p.kind === "a" ? `rgba(255,106,193,${a})` : `rgba(76,201,240,${a})`;
        ctx.beginPath(); ctx.arc(p.x * W, p.y * H, 3, 0, 6.283); ctx.fill();
      });
      const v = mmd2(ref, win);
      out.textContent = v.toFixed(3);
      box.classList.toggle("alert", v > 0.12);
      ctx.fillStyle = "rgba(125,138,153,.9)";
      ctx.font = "11px JetBrains Mono, monospace";
      ctx.fillText(v > 0.12 ? "⚠ Distribution shift — escalating risk level" : performance.now() < userUntil ? "You are probing…" : "Traffic looks benign", 10, 16);
    }
    function tick() {
      phase++;
      const probing = performance.now() < userUntil || (phase % 240) > 150;
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
    if (reduceMotion) draw(); else setInterval(tick, 120);
  }

  /* ================= terminal ================= */
  const C = (cls, s) => `<span class="${cls}">${s}</span>`;
  const run = (c) => `<span class="chip-cmd" data-run="${esc(c)}">${esc(c)}</span>`;
  const sections = ["about", "skills", "projects", "experience", "certifications", "contact"];
  const allIds = [...RUNNING, ...PROJECTS].map((p) => p.id);

  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 1800); }
  function copyEmail() {
    const ok = () => toast("copied vanshryan@gmail.com");
    if (navigator.clipboard) navigator.clipboard.writeText(SITE.email).then(ok, () => toast(SITE.email));
    else toast(SITE.email);
  }
  function go(id) { closeOverlay(); $(`#${id}`)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }); }
  function bar(p, n = 20) { const f = Math.round(p * n); return C("k", "█".repeat(f)) + C("d", "░".repeat(n - f)); }

  const COMMANDS = {
    help: { d: "list commands", f: () => [
      C("d", "available commands:"),
      ...[
        ["whoami", "who is this guy"], ["about", "a bit more detail"], ["skills", "what I work with"],
        ["projects", "everything I've built"], ["ps", "builds running right now"], ["cat <id>", "details for one project"],
        ["experience", "internships"], ["research", "current paper"], ["certs", "certifications"], ["contact", "how to reach me"],
        ["resume", "open my resume"], ["goto <section>", "scroll to a section"], ["neofetch", "system info"],
        ["clear", "clear the screen"],
      ].map(([c, d]) => {
        const [name, arg] = c.split(" ");
        return `  ${run(name)}${arg ? " " + C("d", esc(arg)) : ""}${" ".repeat(Math.max(1, 16 - c.length))}${C("d", "— " + d)}`;
      }),
      C("d", "tip: tab completes, ↑/↓ for history, ` opens this anywhere."),
    ] },
    whoami: { f: () => [
      `${C("k", "Vansh Kulshrestha")} — AI/ML engineer, B.Tech CSE (AI & ML) @ VIT-AP, class of 2027.`,
      "I learn ML by building the systems myself instead of only calling libraries.",
      "So far that's meant a spiking neural network written from scratch in NumPy,",
      "an LLM inference engine with its own paged KV cache and batching scheduler,",
      "a GRPO training loop that teaches a small model to reason through math,",
      "and a research project on detecting attackers who try to steal LLMs through their APIs.",
      "Building each piece by hand shows me why it works, where it breaks, and how to make it faster.",
    ] },
    about: { f: () => [
      "focus areas:",
      `  ${C("c", "▸")} LLM systems — serving, batching, KV-cache, quantization`,
      `  ${C("c", "▸")} reasoning — RL fine-tuning (GRPO) on small models`,
      `  ${C("c", "▸")} AI security — detecting model-extraction probing`,
      `  ${C("c", "▸")} neuromorphic — spiking neural networks`,
      C("d", "→ " ) + run("goto about"),
    ] },
    skills: { f: () => SKILLS.map((g) => `${C("a", g.group.padEnd(14))} ${g.items.join(C("d", " · "))}`) },
    projects: { f: () => [
      C("d", "running:"),
      ...RUNNING.map((p) => `  ${C("k", "●")} ${run("cat " + p.id)} ${C("d", "— " + p.title)}`),
      C("d", "shipped:"),
      ...PROJECTS.map((p) => `  ${C("c", "●")} ${run("cat " + p.id)} ${C("d", "— " + p.title)}`),
    ] },
    ls: { f: (a) => COMMANDS.projects.f(a) },
    ps: { d: "running builds", f: () => [
      C("d", "  PID  NAME         PROGRESS"),
      ...RUNNING.map((p) => `  ${p.pid} ${C("k", p.id.padEnd(12))} ${bar(p.progress, 14)} ${String(Math.round(p.progress * 100)).padStart(3)}%\n${" ".repeat(7)}${C("d", "└ " + p.stage)}`),
    ] },
    top: { f: (a) => COMMANDS.ps.f(a) },
    cat: { f: ([id]) => {
      const p = [...RUNNING, ...PROJECTS].find((x) => x.id === id);
      if (!p) return [C("err", `cat: ${esc(id || "")}: no such project`), C("d", "try one of: ") + allIds.map((i) => run("cat " + i)).join(" ")];
      const lines = [C("k", esc(p.title)), esc(p.blurb)];
      if (p.metric) lines.push(`${C("a", esc(p.metric.value))} ${esc(p.metric.label)} ${C("d", "(" + esc(p.detail) + ")")}`, ...p.log.map((l) => "  " + esc(l)));
      if (p.metrics) lines.push(p.metrics.map(([v, l]) => `${C("a", esc(v))} ${esc(l)}`).join(C("d", "  |  ")));
      if (p.stack) lines.push(C("d", "stack: " + p.stack.join(", ")));
      if (p.repo) lines.push(`<a href="${p.repo}" target="_blank" rel="noopener">${esc(p.repo)}</a>`);
      return lines;
    } },
    experience: { f: () => EXPERIENCE.filter((e) => e.project).map((e) => `${C("a", e.when.padEnd(16))} ${C("k", e.role)} @ ${e.org}\n${" ".repeat(17)}${C("d", "▸ " + e.project)}`) },
    research: { f: () => [
      C("k", "Detecting Model-Extraction Probing with Semantic Embeddings and MMD"),
      C("a", "[manuscript in preparation]"),
      "An inference-API wrapper that flags clients trying to clone an LLM by",
      "comparing their query-embedding distribution to benign traffic (MMD).",
      C("d", "→ ") + run("goto experience") + C("d", "  (there's a live toy demo)"),
    ] },
    certs: { f: () => CERTS.map((c) => `${C("a", "▸")} ${C("k", esc(c.title))} ${C("d", "— " + esc(c.issuer))}
  <a href="${c.link}" target="_blank" rel="noopener">${esc(c.link)}</a>`) },
    contact: { f: () => [
      `email     <a href="mailto:${SITE.email}">${SITE.email}</a>  ${run("email")} ${C("d", "to copy")}`,
      `linkedin  <a href="${SITE.linkedin}" target="_blank" rel="noopener">${SITE.linkedin.replace("https://www.", "")}</a>`,
      `github    <a href="${SITE.github}" target="_blank" rel="noopener">${SITE.github.replace("https://", "")}</a>`,
    ] },
    email: { f: () => { copyEmail(); return [C("k", "✓ copied to clipboard")]; } },
    resume: { f: () => { open("assets/Vansh_Kulshrestha_Resume.pdf", "_blank", "noopener"); return [C("d", "opening resume.pdf…")]; } },
    github: { f: () => { open(SITE.github, "_blank", "noopener"); return [C("d", "opening github…")]; } },
    linkedin: { f: () => { open(SITE.linkedin, "_blank", "noopener"); return [C("d", "opening linkedin…")]; } },
    goto: { f: ([s]) => {
      if (!sections.includes(s)) return [C("err", `goto: unknown section '${esc(s || "")}'`), C("d", "sections: ") + sections.map((x) => run("goto " + x)).join(" ")];
      setTimeout(() => go(s), 150);
      return [C("d", `→ #${s}`)];
    } },
    cd: { f: (a) => COMMANDS.goto.f(a) },
    neofetch: { f: () => {
      const art = ["   ▄▄▄▄▄▄▄   ", "  █ ▀▄ ▄▀ █  ", "  █   █   █  ", "  █▄▄▄▄▄▄▄█  ", "   ▀▀▀▀▀▀▀   ", "             ", "             "];
      const info = [
        `${C("k", "vansh")}@${C("k", "portfolio")}`,
        `${C("c", "os")}       B.Tech CSE (AI & ML) '27`,
        `${C("c", "host")}     VIT-AP, Amaravati`,
        `${C("c", "kernel")}   python 3.11 · pytorch`,
        `${C("c", "uptime")}   ${new Date().getFullYear() - 2023} years of CS`,
        `${C("c", "procs")}    ${RUNNING.length} running · ${PROJECTS.length} shipped`,
        `${C("c", "gpu")}      whatever Kaggle gives me (2× T4)`,
      ];
      return art.map((a, i) => C("k", a) + "  " + (info[i] || ""));
    } },
    date: { f: () => [new Date().toString()] },
    echo: { f: (a) => [esc(a.join(" "))] },
    sudo: { f: (a) => a.join(" ").includes("hire")
      ? [C("k", "[sudo] permission granted."), "excellent decision. drafting email…", `<a href="mailto:${SITE.email}?subject=Let's%20talk">→ open mail client</a>`]
      : [C("err", "vansh is not in the sudoers file. this incident will be reported."), C("d", "(try: sudo hire vansh)")] },
    rm: { f: () => [C("err", "nice try.")] },
    exit: { f: () => { setTimeout(closeOverlay, 100); return [C("d", "bye.")]; } },
    history: { f: (a, t) => t.hist.map((h, i) => `${String(i + 1).padStart(4)}  ${esc(h)}`) },
    clear: { f: (a, t) => { t.out.innerHTML = ""; return []; } },
  };
  const names = Object.keys(COMMANDS);

  class Term {
    constructor(root) {
      this.root = root;
      this.out = $(".term-out", root);
      this.input = $("input", root);
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
        const v = this.input.value, parts = v.split(" ");
        let pool = names, cur = parts[0];
        if (parts.length > 1) { cur = parts[parts.length - 1]; pool = ["goto", "cd"].includes(parts[0]) ? sections : parts[0] === "cat" ? allIds : []; }
        const m = pool.filter((n) => n.startsWith(cur));
        if (m.length === 1) { parts[parts.length - 1] = m[0]; this.input.value = parts.join(" ") + (parts.length === 1 ? " " : ""); }
        else if (m.length > 1) this.print([C("d", m.join("  "))]);
      }
      else if (e.key === "l" && e.ctrlKey) { e.preventDefault(); this.out.innerHTML = ""; }
    }
    async demo(cmds) {
      for (const c of cmds) {
        const line = document.createElement("div");
        line.className = "cmd"; this.out.appendChild(line);
        for (let i = 1; i <= c.length; i++) { line.textContent = c.slice(0, i); await new Promise((r) => setTimeout(r, reduceMotion ? 0 : 55)); }
        line.remove();
        this.exec(c);
        await new Promise((r) => setTimeout(r, reduceMotion ? 0 : 500));
      }
      this.print([C("d", "type ") + run("help") + C("d", " to explore, or click any underlined command.")]);
    }
  }

  let heroTerm, overlayTerm;
  const overlay = $("#term-overlay");
  function openOverlay() {
    overlay.hidden = false;
    if (!overlayTerm.out.childElementCount) overlayTerm.print([C("d", "portfolio shell — type ") + run("help")]);
    overlayTerm.input.focus();
  }
  function closeOverlay() { overlay.hidden = true; }

  function terminals() {
    heroTerm = new Term($("#hero-term [data-term]"));
    overlayTerm = new Term($("#term-overlay [data-term]"));
    $("#term-toggle").addEventListener("click", openOverlay);
    $("#term-close").addEventListener("click", closeOverlay);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeOverlay(); });
    addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !overlay.hidden) closeOverlay();
      const typing = e.target.closest?.("input,textarea");
      if (e.key === "`" && !typing) { e.preventDefault(); overlay.hidden ? openOverlay() : closeOverlay(); }
    });
  }

  /* ================= misc ================= */
  function misc() {
    $("#year").textContent = new Date().getFullYear();
    $("#copy-email").addEventListener("click", copyEmail);
    $("#filter-clear").addEventListener("click", () => filterBy(activeSkill, false));
    $("#skill-grid").addEventListener("click", (e) => { const c = e.target.closest(".chip"); if (c) filterBy(c.dataset.skill); });
    const h1 = $(".glitch");
    if (!reduceMotion) setInterval(() => { h1.classList.add("glitching"); setTimeout(() => h1.classList.remove("glitching"), 220); }, 6000);
  }

  /* ================= init ================= */
  render();
  neurons();
  cursor();
  tilt();
  observe();
  mmdViz();
  terminals();
  misc();
  boot().then(() => {
    typed();
    heroTerm.demo(["whoami", "ps"]);
  });
})();
