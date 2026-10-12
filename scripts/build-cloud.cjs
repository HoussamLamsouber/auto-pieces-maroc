const fs=require('node:fs'),path=require('node:path'),esbuild=require('esbuild');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.vercel-cloud');
fs.mkdirSync(out,{recursive:true});
for(const file of ['index.html','style.css','app.js','admin.html','admin.css','admin.js'])fs.copyFileSync(path.join(root,'dist',file),path.join(out,file));
fs.cpSync(path.join(root,'dist/assets'),path.join(out,'assets'),{recursive:true});
// Les anciennes photos locales sont conservées pour l'import initial du catalogue.
if(fs.existsSync(path.join(root,'preview/uploads')))fs.cpSync(path.join(root,'preview/uploads'),path.join(out,'uploads'),{recursive:true});
fs.writeFileSync(path.join(out,'products.js'),'let PRODUCTS = [];');
esbuild.buildSync({entryPoints:[path.join(root,'cloud/entry.mjs')],bundle:true,minify:true,format:'iife',platform:'browser',target:'es2022',outfile:path.join(out,'shop-api.js')});
console.log('Boutique et administration Supabase construites. Aucune base locale ni clé secrète copiée.');
