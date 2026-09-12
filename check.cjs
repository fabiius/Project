const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = __dirname;
for(const name of fs.readdirSync(root)) {
  if(name.endsWith('.js')) execFileSync(process.execPath,['--check',path.join(root,name)],{stdio:'inherit'});
  if(name.endsWith('.html')) {
    const html=fs.readFileSync(path.join(root,name),'utf8');
    for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
      if(!/^https?:/.test(match[1]) && !fs.existsSync(path.join(root,match[1].split(/[?#]/)[0]))) throw new Error(`${name}: referência ausente ${match[1]}`);
    }
    const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
    if(new Set(ids).size!==ids.length) throw new Error(`${name}: IDs duplicados`);
  }
}
console.log('JavaScript, referências locais e IDs dos HTMLs: OK. Projeto estático, sem compilação.');
