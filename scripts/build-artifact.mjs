// Assemble dist-artifact/ en une seule page HTML publiable comme artefact Claude
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const js = readFileSync('dist-artifact/app.js', 'utf8').replace(/<\/script/gi, '<\\/script')
const css = readFileSync('dist-artifact/app.css', 'utf8')
const CDN = 'https://cdnjs.cloudflare.com/ajax/libs'

const html = `<title>Pop up</title>
<meta name="description" content="Note et garde une trace de tes films, séries, jeux vidéo et albums.">
<style>${css}</style>
<div id="root"></div>
<script src="${CDN}/react/18.3.1/umd/react.production.min.js"></script>
<script src="${CDN}/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script>${js}</script>
`
mkdirSync('artifact', { recursive: true })
writeFileSync('artifact/backlog.html', html)
console.log(`artifact/backlog.html : ${(html.length / 1024).toFixed(0)} Ko`)
