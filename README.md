# Letour-guide

## To get started:
1. `git clone https://github.com/BossDaily/letour-guide.git`

2. `cd letour-guide`

3. `npm install`

4. `npm run dev` to start up the Astro web server

Broadcast locking
-----------------

This project now supports a per-channel "broadcast lock" so only one broadcaster may transmit audio to a channel at a time. The server grants a lock to the first broadcaster who joins a channel. If that broadcaster becomes inactive or disconnects the lock is automatically released (default inactivity timeout: 7s).

Client behaviour:
- Broadcast components request the lock when joining as a broadcaster and will only send audio when the lock is granted. Listeners continue receiving audio as before.

Quick manual test
-----------------

There is a small test harness you can use to verify behaviour (requires the `ws` package which is already a dependency):

1. Start the dev server: `npm run dev`
2. In another terminal run: `node tools/test-lock.js ws://localhost:4321/api/server`

The script connects two clients and demonstrates lock grant/deny, audio forwarding and inactivity-based release.

When pushing a new version to cs-lab, update the .env with the new version, create a new folder in cs-lab public_html (ex: v0.04), and copy the dist and public folders there, as well as `package.json` and `package-lock.json`.

Astro comes with [Tailwind](https://tailwindcss.com) support out of the box. This example showcases how to style your Astro project with Tailwind.
