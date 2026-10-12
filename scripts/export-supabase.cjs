// Export à usage unique pour le SQL Editor. Le résultat reste dans data/ (ignoré par Git).
const fs=require('node:fs'),path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const root=path.resolve(__dirname,'..');
const db=new DatabaseSync(path.join(root,'data/catalogue.sqlite'),{readOnly:true});
const rows=db.prepare('SELECT id,name,ref,category,price,image,description,availability,active,version,efface,date_suppression FROM products ORDER BY id').all();db.close();
const literal=v=>v===null?'NULL':typeof v==='number'?String(v):typeof v==='boolean'?(v?'true':'false'):"'"+String(v).replaceAll("'","''")+"'";
let sql='-- Migration du catalogue uniquement, sans comptes ni sessions.\nBEGIN;\n';
for(const p of rows){
 if(!/^(assets\/photo-\d+\.(jpg|png)|uploads\/[a-f0-9]{32}\.(jpg|png|webp))$/.test(p.image))throw Error('Chemin image invalide');
 if(p.image.startsWith('uploads/')){const target=path.join(root,'preview',p.image);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,'data',p.image),target);}
 const values=[p.id,p.name,p.ref,p.category,p.price,p.image,p.description,p.availability,!!p.active,p.version,p.efface,p.date_suppression];
 sql+='INSERT INTO public.products(id,name,ref,category,price,image,description,availability,active,version,efface,date_suppression) VALUES('+values.map(literal).join(',')+') ON CONFLICT(id) DO NOTHING;\n';
}
sql+="SELECT setval(pg_get_serial_sequence('public.products','id'),COALESCE((SELECT max(id) FROM public.products),1),(SELECT count(*)>0 FROM public.products));\nCOMMIT;\n";
fs.writeFileSync(path.join(root,'data/02-import-catalogue.sql'),sql);console.log(rows.length+' pièces exportées, corbeille incluse. SQL : data/02-import-catalogue.sql');
