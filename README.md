# Portfolio

Static site: plain HTML/CSS/JS, no build step. Live at https://vansh-kulshrestha.vercel.app (every push to `main` redeploys).

- `data.js`: all content (projects, skills, job-matcher phrases, experience, education, certifications). Edit this to update the site.
- `index.html`: page layout and section text (hero, about, research, contact).
- `style.css`, `main.js`: styling and interactions (spiking-net background, project pages, demos, job-description matcher, terminal).
- `assets/`: resume, certificate PDF, and `img/` (photo, project figures, screenshots).

Project pages live at `#/p/<id>` (for example `#/p/mini-infer`). Each project in `data.js` sets its card visual (`bars`, `line`, `image`, `flow`, `detect`), a headline metric with context, links, and an optional `page` with figures and a demo (`batching`, `grpo`, `lif`, `iframe`).

After changing `style.css`, `data.js` or `main.js`, bump the `?v=` number on their links in `index.html` so browsers pick up the new files.

Run locally:

```
python -m http.server 5173
```
