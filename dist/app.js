'use strict';
(async()=>{
if(location.protocol!=='file:'){
 let fromAdmin=new URLSearchParams(location.search).get('from')==='admin';
 try{if(fromAdmin)sessionStorage.setItem('apm-from-admin','1');fromAdmin=fromAdmin||sessionStorage.getItem('apm-from-admin')==='1';}catch{}
 if(fromAdmin){
  const back=document.createElement('a');back.className='admin-return';back.href='/admin.html';back.textContent='← Retour à l’administration';back.hidden=true;document.querySelector('header').append(back);
  async function checkAdmin(){try{const r=await window.shopRequest('/api/session',{cache:'no-store'});const s=await r.json();back.hidden=!s.authenticated;if(!s.authenticated){try{sessionStorage.removeItem('apm-from-admin');}catch{}}}catch{back.hidden=true;}}
  await checkAdmin();window.addEventListener('pageshow',checkAdmin);window.addEventListener('focus',checkAdmin);document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkAdmin();});setInterval(checkAdmin,30000);
 }
}

if(location.protocol==='file:'){const notice=document.createElement('p');notice.className='local-notice';notice.textContent='Copie statique : pour consulter le catalogue actualisé, lancez LANCER.cmd puis ouvrez la boutique sur http://127.0.0.1:4174/.';document.querySelector('main').prepend(notice);}
if(location.protocol!=='file:'){
 try{const response=await window.shopRequest('/api/products',{cache:'no-store'});if(!response.ok)throw Error('Catalogue indisponible');PRODUCTS=await response.json();}
 catch{document.querySelector('#products').textContent='Le catalogue est momentanément indisponible. Actualisez la page pour réessayer.';return;}
}

const $ = s => document.querySelector(s);
const formatPrice = p => p.price === null ? 'Sur demande' : new Intl.NumberFormat('fr-MA',{style:'currency',currency:'MAD'}).format(p.price);
const normalize = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const escapeHTML = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let category='Toutes', limit=12, cart={};
try { const saved=JSON.parse(localStorage.getItem('apm-cart')||'{}'); if(saved && typeof saved==='object') for(const p of PRODUCTS) { if(Number.isInteger(saved[p.id]) && saved[p.id]>0) cart[p.id]=Math.min(saved[p.id],99); } } catch {}
const categories=['Toutes',...new Set(PRODUCTS.map(p=>p.category))];
$('#categories').innerHTML=categories.map(c=>`<button aria-pressed="${c===category}" data-category="${escapeHTML(c)}">${escapeHTML(c)}</button>`).join('');
function renderProducts(){
 const query=normalize($('#search').value.trim());
 const filtered=PRODUCTS.filter(p=>(category==='Toutes'||p.category===category)&&normalize(`${p.name} ${p.ref} ${p.category}`).includes(query));
 $('#result-count').textContent=`${filtered.length} pièce${filtered.length>1?'s':''}`;
 $('#empty').hidden=filtered.length>0;
 $('#show-more').hidden=filtered.length<=limit;
 $('#products').innerHTML=filtered.slice(0,limit).map(p=>`<article class="product"><div class="product-photo"><button class="photo-button" data-detail="${p.id}" aria-label="Voir ${escapeHTML(p.name)} ${escapeHTML(p.ref)}"><img src="${p.image}" alt="${escapeHTML(p.name)}" loading="lazy" width="260" height="190"></button><button class="zoom-button" data-zoom="${p.id}" aria-label="Agrandir la photo : ${escapeHTML(p.name)}" title="Agrandir la photo"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6M7 10h6M10 7v6"/></svg></button></div><div class="product-body"><p class="product-category">${escapeHTML(p.category)}</p><h3>${escapeHTML(p.name)}</h3><p class="availability">${escapeHTML(p.availability||'Sur demande')}</p><p class="reference">${p.ref?'Réf. '+escapeHTML(p.ref):'Article APM-'+p.id}</p><div class="product-bottom"><span class="price">${formatPrice(p)}</span><button class="add" data-add="${p.id}" aria-label="Ajouter ${escapeHTML(p.name)} au panier">+</button></div></div></article>`).join('');
}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),2400);}
function saveCart(){try{localStorage.setItem('apm-cart',JSON.stringify(cart));}catch{} $('#cart-count').textContent=Object.values(cart).reduce((a,b)=>a+b,0);}
function add(id){if((cart[id]||0)>=99){toast('Quantité maximale : 99 par article.');return;}cart[id]=(cart[id]||0)+1;saveCart();toast('Pièce ajoutée à votre panier');}
function renderCart(){
 const entries=PRODUCTS.filter(p=>cart[p.id]);
 $('#cart-actions').hidden=false;
 $('#cart-whatsapp').href=buildWhatsAppUrl();
 $('#cart-items').innerHTML=entries.length?entries.map(p=>`<div class="cart-row"><img src="${p.image}" alt=""><div><h3>${escapeHTML(p.name)}</h3><p>${p.ref?'Réf. '+escapeHTML(p.ref):'Article APM-'+p.id} · ${formatPrice(p)}</p><div class="quantity"><button data-change="${p.id}" data-delta="-1" aria-label="Diminuer la quantité de ${escapeHTML(p.name)}">−</button><span aria-label="Quantité">${cart[p.id]}</span><button data-change="${p.id}" data-delta="1" aria-label="Augmenter la quantité de ${escapeHTML(p.name)}" ${cart[p.id]>=99?'disabled':''}>+</button></div></div><button class="remove" data-remove="${p.id}" aria-label="Retirer ${escapeHTML(p.name)}">Retirer</button></div>`).join(''):'<p class="empty">Votre panier est vide. Retrouvez les pièces dans notre catalogue.</p>';
}
$('#categories').addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(!b)return;category=b.dataset.category;limit=12;$('#categories').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));renderProducts();});
$('#search').addEventListener('input',()=>{limit=12;renderProducts();});
$('#show-more').addEventListener('click',()=>{limit+=12;renderProducts();});
document.addEventListener('click',e=>{
 const zoom=e.target.closest('[data-zoom]');
 if(zoom){
  const p=PRODUCTS.find(p=>p.id===Number(zoom.dataset.zoom));
  if(!p)return;
  $('#zoom-image').src=p.image;
  $('#zoom-image').alt=p.name;
  $('#zoom-title').textContent=p.name+(p.ref?' — Réf. '+p.ref:'');
  $('#zoom-dialog').showModal();
  return;
 }

 const addButton=e.target.closest('[data-add]');if(addButton)add(Number(addButton.dataset.add));
 const detailButton=e.target.closest('[data-detail]');if(detailButton){const p=PRODUCTS.find(p=>p.id===Number(detailButton.dataset.detail));$('#detail').innerHTML=`<img class="detail-img" src="${p.image}" alt="${escapeHTML(p.name)}"><p class="eyebrow">${escapeHTML(p.category)}</p><h2 id="detail-title">${escapeHTML(p.name)}</h2><p>${p.ref?'Référence photographiée : '+escapeHTML(p.ref):'Article catalogue : APM-'+p.id}</p><p class="detail-copy">${escapeHTML(p.description||'')}</p><p>${escapeHTML(p.availability||'Sur demande')}</p><p class="detail-copy">Vérifiez la référence et la compatibilité avec votre véhicule avant commande. Prix et disponibilité à confirmer.</p><p><strong>${formatPrice(p)}</strong></p><button class="primary" data-add="${p.id}">Ajouter au panier <span aria-hidden="true">+</span></button>`;$('#product-dialog').showModal();}
 const close=e.target.closest('[data-close]');if(close)close.closest('dialog').close();
 const change=e.target.closest('[data-change]');if(change){const id=Number(change.dataset.change);cart[id]=Math.max(0,Math.min(99,cart[id]+Number(change.dataset.delta)));if(!cart[id])delete cart[id];saveCart();renderCart();}
 const remove=e.target.closest('[data-remove]');if(remove){delete cart[remove.dataset.remove];saveCart();renderCart();}
});
$('#open-cart').addEventListener('click',()=>{renderCart();$('#cart-dialog').showModal();});
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
function buildWhatsAppUrl(){
 const lines=['Bonjour, je souhaite des renseignements sur les pièces suivantes :',''];
 const entries=PRODUCTS.filter(p=>cart[p.id]);
 entries.forEach(p=>lines.push(cart[p.id]+' × '+p.name+' | '+(p.ref?'Réf. '+p.ref:'APM-'+p.id)));
 if(!entries.length) return 'https://wa.me/212633274823?text='+encodeURIComponent('Bonjour, je souhaite un renseignement sur vos pièces automobiles.');
 lines.push('','Pouvez-vous confirmer le prix et la disponibilité ? Merci.');
 return 'https://wa.me/212633274823?text='+encodeURIComponent(lines.join('\n'));
}
renderProducts();saveCart();

})().catch(()=>{document.querySelector("#products").textContent="Impossible de charger le catalogue. Actualisez la page.";});
