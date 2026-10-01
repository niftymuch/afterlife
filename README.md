# Afterlife (anti-UX site)

A deliberately hostile static site: low contrast, hard-to-read font, tiny invisible click targets, vague button labels, error messages that appear on the far side of the screen.

## Deploy to GitHub Pages

1. Create a repo and put `index.html`, `style.css`, `app.js` in the repo root.
2. Repo Settings > Pages > Source: "Deploy from a branch", branch `main`, folder `/ (root)`.
3. Visit `https://<your-username>.github.io/<repo>/` after a minute.

## Notes

- Progress (name, angel number, last words, form answers, your number) is stored in `localStorage` so retracing steps shows what you entered.
- To reset: clear site data, or run `localStorage.removeItem('afterlife.v1')` in the console.
- Click hotspots are 9px invisible buttons placed somewhere inside each label.
