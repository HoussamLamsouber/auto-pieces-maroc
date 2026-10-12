// Export public uniquement : aucune session, aucun compte ou produit supprimé.
const fs=require('node:fs'),path=require('node:path');
const {DatabaseSync}=require('node:sqlite');
const root=path.resolve(__dirname,'..'),folder=path.join(root,'preview');
const db=new DatabaseSync(path.join(root,'data/catalogue.sqlite'),{readOnly:true});
const products=db.prepare("SELECT id,name,ref,category,price,image,description,availability FROM products WHERE active=1 AND efface='Non' ORDER BY id").all();
db.close();fs.mkdirSync(folder,{recursive:true});
for(const p of products){
 if(!/^(assets\/photo-\d+\.(jpg|png)|uploads\/[a-f0-9]{32}\.(jpg|png|webp))$/.test(p.image))throw Error('Chemin image invalide');
 const source=path.join(root,p.image.startsWith('uploads/')?'data':'dist',p.image);
 if(!fs.existsSync(source))throw Error('Photo absente : '+p.image);
 if(p.image.startsWith('uploads/')){const dest=path.join(folder,p.image);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(source,dest);}
}
fs.writeFileSync(path.join(folder,'catalogue.json'),JSON.stringify(products,null,2));
console.log(products.length+' pièces visibles exportées pour la présentation.');
