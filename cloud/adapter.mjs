export function createAdapter(client){
 const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
 function checked(result){if(result.error)fail(result.status||400,result.error.message);return result.data;}
 async function isAdmin(){const {data,error}=await client.auth.getUser();if(error||!data.user)return false;const r=await client.from('apm_admins').select('user_id').eq('user_id',data.user.id).maybeSingle();if(r.error)fail(503,'Configuration Supabase incomplète : vérifiez le script SQL.');return !!r.data;}
 async function all(query){let results=[];for(let offset=0;;offset+=500){const rows=checked(await query().range(offset,offset+499));results.push(...rows);if(rows.length<500)return results;}}
 const fields='id,name,ref,category,price,image,description,availability,active,version,efface,date_suppression';
 function payload(p){if(!['Refroidissement','Moteur','Transmission','Distribution'].includes(p.category))fail(400,'Choisissez une catégorie de la liste.');return {name:p.name,ref:p.ref,category:p.category,price:p.price,image:p.image,description:p.description,availability:p.availability,active:p.active};}
 return async function request(route,options={}){
  try{
   const url=new URL(route,'https://shop.local'),method=options.method||'GET';
   const p=options.body?JSON.parse(options.body):{};
   if(url.pathname==='/api/products'&&method==='GET')return respond(await all(()=>client.from('products').select(fields).eq('active',true).eq('efface','Non').order('id')));
   if(url.pathname==='/api/session'){
    const authenticated=await isAdmin();
    const user=authenticated?(await client.auth.getUser()).data.user:null;
    return respond({authenticated,needsSetup:false,username:authenticated?String(user?.user_metadata?.username||'Administrateur'):null});
   }
   if(url.pathname==='/api/login'&&method==='POST'){
    const {error}=await client.auth.signInWithPassword({email:p.username,password:p.password});
    if(error)fail(401,'Adresse e-mail ou mot de passe incorrect.');
    if(!await isAdmin()){await client.auth.signOut();fail(403,'Ce compte ne possède pas de droit administrateur.');}
    return respond({ok:true});
   }
   if(url.pathname==='/api/logout'&&method==='POST'){const {error}=await client.auth.signOut();if(error)fail(503,'Déconnexion impossible. Réessayez.');return respond({ok:true});}
   if(!await isAdmin())fail(401,'Connectez-vous avec votre compte administrateur.');
   if(url.pathname==='/api/admin/products'&&method==='GET')return respond(await all(()=>client.from('products').select(fields).eq('efface',url.searchParams.get('deleted')==='1'?'Oui':'Non').order('id',{ascending:false})));
   if(url.pathname==='/api/admin/upload'&&method==='POST'){
    if(typeof p.content!=='string')fail(400,'Photo invalide.');
    const binary=atob(p.content),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
    if(bytes.length>5*1024*1024)fail(413,'Photo trop volumineuse : 5 Mo maximum.');
    let extension,type;
    if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255){extension='jpg';type='image/jpeg';}
    else if([137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n)){extension='png';type='image/png';}
    else if(binary.slice(0,4)==='RIFF'&&binary.slice(8,12)==='WEBP'){extension='webp';type='image/webp';}
    else fail(400,'Formats acceptés : JPEG, PNG ou WebP.');
    const filename=crypto.randomUUID()+'.'+extension;
    checked(await client.storage.from('product-images').upload(filename,bytes,{contentType:type,upsert:false}));
    return respond({image:client.storage.from('product-images').getPublicUrl(filename).data.publicUrl},201);
   }
   if(url.pathname==='/api/admin/products'&&method==='POST')return respond(checked(await client.from('products').insert(payload(p)).select('id').single()),201);
   const permanent=url.pathname.match(/^\/api\/admin\/products\/(\d+)\/permanent$/);
   if(permanent&&method==='DELETE'){
    if(!Number.isInteger(p.version))fail(400,'Version invalide.');
    const rows=checked(await client.from('products').delete().eq('id',Number(permanent[1])).eq('version',p.version).eq('efface','Oui').select('id'));
    if(!rows.length)fail(409,'Cette pièce a changé ou ne se trouve plus dans la corbeille. Actualisez la liste.');
    return respond({ok:true});
   }
   const match=url.pathname.match(/^\/api\/admin\/products\/(\d+)(\/restore)?$/);
   if(match){
    if(!Number.isInteger(p.version))fail(400,'Version invalide.');
    let changes,previous='Non';
    if(method==='POST'&&match[2]){changes={efface:'Non',active:false};previous='Oui';}
    else if(method==='DELETE'&&!match[2])changes={efface:'Oui'};
    else if(method==='PUT'&&!match[2])changes=payload(p);
    else fail(405,'Opération inconnue.');
    const rows=checked(await client.from('products').update(changes).eq('id',Number(match[1])).eq('version',p.version).eq('efface',previous).select('id'));
    if(!rows.length)fail(409,'Cette pièce a changé. Actualisez la liste avant de recommencer.');
    return respond({ok:true});
   }
   fail(404,'Adresse introuvable.');
  }catch(e){return respond({error:e.message||'Connexion impossible.'},e.status>=400&&e.status<=599?e.status:503);}
 };
}
function respond(value,status=200){return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});}
