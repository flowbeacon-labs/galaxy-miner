# Galaxy Miner — Asteroid Expedition

An original 3D WebGL arcade game designed for Flowbeacon Arcade. Pilot a mining ship through three asteroid sectors, collect minerals, avoid impacts and upgrade your ship.

## Features

- Real 3D space scene rendered with Three.js/WebGL, procedural asteroids, planet, stars and glowing spaceship engines.
- Continuous forward flight, horizontal/vertical steering, mining laser, energy-powered boost and hull collisions.
- Mine asteroids to release magnetic ore fragments and collect the fragments by flying nearby.
- Three sectors with escalating ore targets (60, 85, 110); choose one ship upgrade after each of the first two sectors: mining laser, ore magnet or reinforced hull.
- Touch joystick, MINE and BOOST for phones; keyboard controls on desktops; pause and sound toggle.
- Personal-best score saved locally to the browser.

## Controls

| Action | Desktop | Phone/tablet |
| --- | --- | --- |
| Steer | W/A/S/D or arrow keys | Virtual joystick (lower-left) |
| Mine | Hold Space | Hold MINE |
| Boost | Hold Shift | Hold BOOST |
| Pause / Resume | P | Pause button (top-right) |

**Tip:** Move the ship in front of an asteroid and hold MINE. The laser automatically locks onto a nearby rock ahead. Sweep up the resulting glowing ore fragments. Stay clear of rocks to preserve hull.

## Run locally

This project is intentionally build-free. It needs an internet connection to load the pinned Three.js version from jsDelivr.

From the project directory, start any static HTTP server:

```bash
python -m http.server 8765
```

Open `http://localhost:8765/` in a current browser with WebGL support. Opening `index.html` directly from `file://` may block ES modules and is not recommended.

## Publish on GitHub Pages

1. On GitHub, create a **public** repository named `galaxy-miner` under `flowbeacon-labs`.
2. Upload `index.html`, `game.js`, `style.css`, and `README.md` to the root of the default `main` branch.
3. Open **Settings → Pages → Build and deployment**, select **Deploy from a branch**, choose `main` and `/ (root)`, and click **Save**.
4. Once Pages finishes deploying, open `https://flowbeacon-labs.github.io/galaxy-miner/`.
5. To add it to `flowbeacon-arcade`, create a card linking to the address above in the arcade's `index.html`.

## Technical details

- Three.js **0.160.1**, loaded as a native ES module from jsDelivr CDN.
- No backend, npm, build step or paid assets. 3D meshes and graphics are created procedurally.
- For production use with a restrictive network, download and self-host `three.module.js` and update the import path.
- Uses browser localStorage for personal-best score only.

## Roadmap

Phase 2 could introduce different mineral types, a visible ship upgrade tree, a boss asteroid, more exotic planets, ship skins and improved effects. Phase 3 could add missions, local save slots and more complex exploration.

## License

Original game code is provided under the MIT License; Three.js is separately licensed under MIT.