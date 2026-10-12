const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.vercel-preview');
const products=JSON.parse(fs.readFileSync(path.join(root,'preview/catalogue.json'),'utf8'));
// Vercel fournit un répertoire de build neuf ; seuls les fichiers publics sont copiés.
fs.mkdirSync(out,{recursive:true});
for(const file of ['index.html','style.css','app.js'])fs.copyFileSync(path.join(root,'dist',file),path.join(out,file));
for(const name of ['photo-0.png','photo-1.jpg']){fs.mkdirSync(path.join(out,'assets'),{recursive:true});fs.copyFileSync(path.join(root,'dist/assets',name),path.join(out,'assets',name));}
for(const p of products){
 if(!/^(assets\/photo-\d+\.(jpg|png)|uploads\/[a-f0-9]{32}\.(jpg|png|webp))$/.test(p.image))throw Error('Chemin image invalide');
 const source=path.join(root,p.image.startsWith('uploads/')?'preview':'dist',p.image),dest=path.join(out,p.image);
 fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(source,dest);
}
fs.writeFileSync(path.join(out,'products.js'),'let PRODUCTS = '+JSON.stringify(products)+';');
fs.writeFileSync(path.join(out,'catalogue-preview.json'),JSON.stringify(products));
fs.writeFileSync(path.join(out,'session-preview.json'),JSON.stringify({authenticated:false,needsSetup:false}));
fs.writeFileSync(path.join(out,'admin.html'),'<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Administration — Aperçu</title><link rel="stylesheet" href="admin.css"><main><section class="auth"><h1>Aperçu de la boutique</h1><p>L’administration est disponible sur la version locale. Cet aperçu permet de consulter le catalogue et de tester le panier et le contact WhatsApp.</p><a href="/">Retour à la boutique</a></section></main></html>');
fs.copyFileSync(path.join(root,'dist/admin.css'),path.join(out,'admin.css'));
console.log('Aperçu Vercel construit : '+products.length+' pièces, sans base ni identifiants.');
