# Letour-guide

## To get started:
1. `git clone https://github.com/BossDaily/letour-guide.git`

2. `cd letour-guide`

3. `npm install`

4. `npm run dev` to start up the Astro web server

5. `npm run server` to start up the websocket server

When pushing a new version to cs-lab, update the .env with the new version, create a new folder in cs-lab public_html (ex: v0.04), and copy the dist and public folders there, as well as `package.json` and `package-lock.json`.

Astro comes with [Tailwind](https://tailwindcss.com) support out of the box. This example showcases how to style your Astro project with Tailwind.
