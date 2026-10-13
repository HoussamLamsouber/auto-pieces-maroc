'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {promisify}=require('node:util');
const {DatabaseSync}=require('node:sqlite');
const scrypt=promisify(crypto.scrypt);
const root=path.join(__dirname,'dist'), data=path.resolve(process.env.DATA_DIR||path.join(__dirname,'data'));
fs.mkdirSync(data,{recursive:true});fs.mkdirSync(path.join(data,'uploads'),{recursive:true});
const db=new DatabaseSync(path.join(data,'catalogue.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,ref TEXT NOT NULL DEFAULT '',category TEXT NOT NULL,price REAL,image TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',availability TEXT NOT NULL DEFAULT 'Sur demande',active INTEGER NOT NULL DEFAULT 1,version INTEGER NOT NULL DEFAULT 1);
 CREATE TABLE IF NOT EXISTS admin(id INTEGER PRIMARY KEY CHECK(id=1),username TEXT NOT NULL,salt TEXT NOT NULL,hash TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL);`);
const columns=db.prepare('PRAGMA table_info(products)').all().map(c=>c.name);
if(!columns.includes('efface'))db.exec("ALTER TABLE products ADD COLUMN efface TEXT NOT NULL DEFAULT 'Non' CHECK(efface IN ('Oui','Non'))");
if(!columns.includes('date_suppression'))db.exec('ALTER TABLE products ADD COLUMN date_suppression TEXT');
if(!db.prepare("SELECT 1 FROM metadata WHERE key='seeded'").get()){
 const seed=JSON.parse(fs.readFileSync(path.join(__dirname,'seed.json'),'utf8'));
 db.exec('BEGIN');try{const insert=db.prepare('INSERT INTO products(id,name,ref,category,price,image) VALUES(?,?,?,?,?,?)');for(const p of seed)insert.run(p.id,p.name,p.ref,p.category,p.price,p.image);db.prepare('INSERT INTO metadata VALUES(?,?)').run('seeded','1');db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
}
const port=Number(process.env.PORT||4174),host=process.env.HOST||'127.0.0.1';
const origin=process.env.PUBLIC_ORIGIN||`http://127.0.0.1:${port}`;
const production=process.env.NODE_ENV==='production';
if(production && !origin.startsWith('https://'))throw Error('PUBLIC_ORIGIN HTTPS requis en production.');
const setupPath=path.join(data,'setup-key.txt');
if(!db.prepare('SELECT 1 FROM admin').get()&&!fs.existsSync(setupPath))fs.writeFileSync(setupPath,crypto.randomBytes(32).toString('hex'),{mode:0o600});
function fail(status,message){throw Object.assign(new Error(message),{status});}
function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));}
const hashToken=t=>crypto.createHash('sha256').update(t).digest('hex');
function authenticated(req){const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('apm_session='))?.slice(12);return token&&db.prepare('SELECT 1 FROM sessions WHERE token=? AND expires>?').get(hashToken(token),Date.now());}
function requireAuth(req){if(!authenticated(req))fail(401,'Connectez-vous pour continuer.');}
async function body(req){if(!(req.headers['content-type']||'').startsWith('application/json'))fail(415,'Format JSON requis.');let chunks=[],size=0;for await(const chunk of req){size+=chunk.length;if(size>7500000)fail(413,'Photo trop volumineuse (5 Mo maximum).');chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString())}catch{fail(400,'Données invalides.');}}
function text(value,max,required=false){if(typeof value!=='string'||value.length>max||(required&&!value.trim()))fail(400,'Vérifiez les champs du formulaire.');return value.trim();}
function validProduct(p){const name=text(p.name,160,true),ref=text(p.ref,100),category=text(p.category,80,true),description=text(p.description,3000),availability=text(p.availability,40,true);if(!['Refroidissement','Moteur','Transmission','Distribution'].includes(category))fail(400,'Choisissez une catégorie de la liste.');if(!['Sur demande','Disponible','Indisponible'].includes(availability))fail(400,'Disponibilité invalide.');if(p.price!==null&&(typeof p.price!=='number'||!Number.isFinite(p.price)||p.price<0||p.price>10000000||Math.abs(p.price*100-Math.round(p.price*100))>0.00001))fail(400,'Prix invalide (deux décimales maximum).');if(typeof p.active!=='boolean')fail(400,'Visibilité invalide.');const image=text(p.image,200,true);if(!/^(assets\/photo-\d+\.(jpg|png)|uploads\/[a-f0-9]{32}\.(jpg|png|webp))$/.test(image))fail(400,'Choisissez une photo du catalogue ou importez une image.');if(!fs.existsSync(path.join(image.startsWith('uploads/')?data:root,image)))fail(400,'Photo introuvable.');return [name,ref,category,p.price,image,description,availability,p.active?1:0];}
const attempts=new Map();
function throttle(req){const key=req.socket.remoteAddress,now=Date.now();let a=attempts.get(key);if(!a||now>a.until){a={count:0,until:now+15*60000};attempts.set(key,a);}if(++a.count>10)fail(429,'Trop de tentatives. Réessayez dans 15 minutes.');}
let setupBusy=false;
async function api(req,res,url){
 if(req.method==='GET'&&url.pathname==='/api/products')return json(res,200,db.prepare("SELECT * FROM products WHERE active=1 AND efface='Non' ORDER BY id").all());
 if(req.method==='GET'&&url.pathname==='/api/session')return json(res,200,{authenticated:!!authenticated(req),needsSetup:!db.prepare('SELECT 1 FROM admin').get()});
 if(!['GET','HEAD'].includes(req.method)&&req.headers.origin!==origin)fail(403,'Origine de la requête refusée.');
 if(req.method==='POST'&&url.pathname==='/api/setup'){
  throttle(req);if(db.prepare('SELECT 1 FROM admin').get()||setupBusy)fail(409,'Le compte administrateur existe déjà.');
  const p=await body(req);if(!fs.existsSync(setupPath)||typeof p.key!=='string'||!crypto.timingSafeEqual(hashBytes(p.key),hashBytes(fs.readFileSync(setupPath,'utf8').trim())))fail(403,'Code de création incorrect. Utilisez LANCER.cmd sur votre ordinateur.');
  if(setupBusy||db.prepare('SELECT 1 FROM admin').get())fail(409,'Le compte administrateur existe déjà.');
  setupBusy=true;try{const username=text(p.username,80,true);if(typeof p.password!=='string'||p.password.length<12||p.password.length>128)fail(400,'Choisissez un mot de passe de 12 à 128 caractères.');const salt=crypto.randomBytes(16).toString('hex');const hash=(await scrypt(p.password,salt,64)).toString('hex');db.prepare('INSERT INTO admin VALUES(1,?,?,?)').run(username,salt,hash);fs.unlinkSync(setupPath);return json(res,201,{ok:true});}finally{setupBusy=false;}
 }
 if(req.method==='POST'&&url.pathname==='/api/login'){
  throttle(req);const p=await body(req),admin=db.prepare('SELECT * FROM admin').get();if(typeof p.password!=='string'||p.password.length>128||typeof p.username!=='string')fail(400,'Identifiants invalides.');const hash=await scrypt(p.password,admin?.salt||'dummy-salt',64);if(!admin||p.username!==admin.username||!crypto.timingSafeEqual(hash,Buffer.from(admin.hash,'hex')))fail(401,'Identifiant ou mot de passe incorrect.');
  const token=crypto.randomBytes(32).toString('hex');db.prepare('DELETE FROM sessions WHERE expires<=?').run(Date.now());db.prepare('INSERT INTO sessions VALUES(?,?)').run(hashToken(token),Date.now()+8*3600000);res.setHeader('Set-Cookie',`apm_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${production?'; Secure':''}`);return json(res,200,{ok:true});
 }
 requireAuth(req);
 if(req.method==='POST'&&url.pathname==='/api/logout'){const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('apm_session='))?.slice(12);if(token)db.prepare('DELETE FROM sessions WHERE token=?').run(hashToken(token));res.setHeader('Set-Cookie',`apm_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${production?'; Secure':''}`);return json(res,200,{ok:true});}
 if(req.method==='GET'&&url.pathname==='/api/admin/products')return json(res,200,db.prepare(url.searchParams.get('deleted')==='1'?"SELECT * FROM products WHERE efface='Oui' ORDER BY date_suppression DESC":"SELECT * FROM products WHERE efface='Non' ORDER BY id DESC").all());
 if(req.method==='GET'&&url.pathname==='/api/admin/images')return json(res,200,[...fs.readdirSync(path.join(root,'assets')).filter(n=>/^photo-\d+\.(jpg|png)$/.test(n)).map(n=>'assets/'+n),...fs.readdirSync(path.join(data,'uploads')).filter(n=>/^[a-f0-9]{32}\.(jpg|png|webp)$/.test(n)).map(n=>'uploads/'+n)]);
 if(req.method==='POST'&&url.pathname==='/api/admin/upload'){
  const p=await body(req);if(typeof p.content!=='string'||!/^[A-Za-z0-9+/]+={0,2}$/.test(p.content))fail(400,'Image invalide.');const bytes=Buffer.from(p.content,'base64');if(bytes.length>5*1024*1024)fail(413,'Photo trop volumineuse (5 Mo maximum).');let ext;if(bytes.subarray(0,3).equals(Buffer.from([255,216,255])))ext='jpg';else if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))ext='png';else if(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP')ext='webp';else fail(400,'Formats acceptés : JPEG, PNG ou WebP.');const filename=crypto.randomBytes(16).toString('hex')+'.'+ext;fs.writeFileSync(path.join(data,'uploads',filename),bytes,{flag:'wx'});return json(res,201,{image:'uploads/'+filename});
 }
 if(req.method==='POST'&&url.pathname==='/api/admin/products'){const values=validProduct(await body(req));const result=db.prepare('INSERT INTO products(name,ref,category,price,image,description,availability,active) VALUES(?,?,?,?,?,?,?,?)').run(...values);return json(res,201,{id:Number(result.lastInsertRowid)});}
 const permanent=url.pathname.match(/^\/api\/admin\/products\/(\d+)\/permanent$/);
 if(permanent&&req.method==='DELETE'){const p=await body(req);if(!Number.isInteger(p.version))fail(400,'Version invalide.');const result=db.prepare("DELETE FROM products WHERE id=? AND version=? AND efface='Oui'").run(Number(permanent[1]),p.version);if(!result.changes)fail(409,'Cette pièce a changé ou ne se trouve plus dans la corbeille.');return json(res,200,{ok:true});}
 const restore=url.pathname.match(/^\/api\/admin\/products\/(\d+)\/restore$/);
 if(restore&&req.method==='POST'){const p=await body(req);if(!Number.isInteger(p.version))fail(400,'Version invalide.');const result=db.prepare("UPDATE products SET efface='Non',active=0,version=version+1 WHERE id=? AND version=? AND efface='Oui'").run(Number(restore[1]),p.version);if(!result.changes)fail(409,'Cette pièce a changé. Actualisez la liste.');return json(res,200,{ok:true});}
 const match=url.pathname.match(/^\/api\/admin\/products\/(\d+)$/);
 if(match&&req.method==='DELETE'){const p=await body(req);if(!Number.isInteger(p.version))fail(400,'Version invalide.');const result=db.prepare("UPDATE products SET efface='Oui',date_suppression=?,version=version+1 WHERE id=? AND version=? AND efface='Non'").run(new Date().toISOString(),Number(match[1]),p.version);if(!result.changes)fail(409,'Cette pièce a changé ou a déjà été supprimée. Actualisez la liste.');return json(res,200,{ok:true});}
 if(match&&req.method==='PUT'){const p=await body(req),values=validProduct(p);if(!Number.isInteger(p.version))fail(400,'Version invalide.');const result=db.prepare("UPDATE products SET name=?,ref=?,category=?,price=?,image=?,description=?,availability=?,active=?,version=version+1 WHERE id=? AND version=? AND efface='Non'").run(...values,Number(match[1]),p.version);if(!result.changes)fail(409,'Cette pièce a été modifiée ailleurs. Rechargez la liste avant de recommencer.');return json(res,200,{ok:true});}
 fail(404,'Adresse introuvable.');
}
function hashBytes(value){return crypto.createHash('sha256').update(value).digest();}
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp'};
const server=http.createServer(async(req,res)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
 try{
  if(req.headers.host!==new URL(origin).host)fail(403,'Adresse du serveur non autorisée.');
  const url=new URL(req.url,origin);
  if(url.pathname.startsWith('/api/'))return await api(req,res,url);
  if(!['GET','HEAD'].includes(req.method))fail(405,'Méthode non autorisée.');
  const pathname=decodeURIComponent(url.pathname),base=pathname.startsWith('/uploads/')?data:root;
  const file=path.resolve(base,'.'+(pathname==='/'?'/index.html':pathname));
  const relative=path.relative(base,file);if(relative.startsWith('..')||path.isAbsolute(relative)||relative.split(/[\\/]/).some(s=>s.startsWith('.')))fail(404,'Fichier introuvable.');
  if(base===data&&!/^uploads\/[a-f0-9]{32}\.(jpg|png|webp)$/.test(relative.replaceAll('\\','/')))fail(404,'Fichier introuvable.');
  const type=mime[path.extname(file)];if(!type||!fs.existsSync(file)||!fs.statSync(file).isFile())fail(404,'Fichier introuvable.');
  res.writeHead(200,{'Content-Type':type});res.end(req.method==='HEAD'?undefined:fs.readFileSync(file));
 }catch(e){if(!res.headersSent)json(res,e.status||500,{error:e.status?e.message:'Erreur du serveur. Réessayez.'});else res.end();if(!e.status)console.error(e);}
});
server.requestTimeout=30000;server.listen(port,host,()=>console.log(`Boutique : ${origin}\nAdministration : ${origin}/admin.html`));
function stop(){server.close(()=>{db.close();process.exit(0);});}process.on('SIGTERM',stop);process.on('SIGINT',stop);
