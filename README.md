# Feather Fury

A three-round, Angry Birds–style slingshot game running entirely in the browser. Vanilla HTML/CSS/JS, with Matter.js vendored locally. No build step and no network requests are required.

## Run it

Open the folder with any static file server, then visit the printed URL. For example:

```powershell
python -m http.server 8123 --bind 127.0.0.1
```

Then open http://127.0.0.1:8123/.


## Controls

| Action | Input |
| --- | --- |
| Aim / launch | Drag the loaded bird back from the slingshot and release |
| Bird ability | Click the bird mid-flight, tap the **BOOST / DETONATE** button, or press **Space** |
| Pause / resume | **P**, **Esc**, or the pause button |
| Restart round | **R** or the restart button |
| Mute / unmute | **M** or the speaker button |
| Start from menu | **Space** or **Enter** on the Play button |

Doge gets a speed boost when his ability is triggered. Grumpy Cat detonates on command. Trollface is a plain, heavy hitter.

## Project layout

- `index.html` — UI shell, screens, HUD, and image references
- `styles.css` — layout, responsive rules, menus, and effects
- `script.js` — game state, physics, levels, rendering, sound, and input
- `vendor/matter.min.js` — local Matter.js physics engine
- `assets/` — characters, pigs, background, audio, and original uploads
