# Portfolio

Static site — plain HTML/CSS/JS, no build step.

- `data.js` — all content (projects, running builds, skills, experience). Edit this to update the site.
- `index.html` — layout and section text (about, research, contact).
- `style.css`, `main.js` — styling and interactions (spiking-net background, terminal, skill filter, MMD demo).
- `assets/` — resume PDF.

Run locally:

```
python -m http.server 5173
```

Deploy: push this folder to a GitHub repo and enable GitHub Pages (Settings → Pages → deploy from branch), or import the repo on Vercel.
