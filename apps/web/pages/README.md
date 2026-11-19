Intentionally empty. Next.js looks for `pages/` in the project root before `src/pages`; this folder stops it from
treating the Feature-Sliced Design `src/pages` layer as the Pages Router. Routing lives in `app/`.
