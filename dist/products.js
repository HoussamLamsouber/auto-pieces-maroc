// Catalogue éditable. Prix en MAD : remplacer null par un nombre après validation.
// Les désignations sont indicatives ; vérifier les références et compatibilités.
let PRODUCTS = [
 {id:43,name:'Boîtier de thermostat',category:'Refroidissement',ref:'981847880',image:43},
 {id:44,name:'Durite de refroidissement',category:'Refroidissement',ref:'1317018',image:44},
 {id:45,name:'Boîtier papillon',category:'Moteur',ref:'9803001180',image:45},
 {id:46,name:'Récepteur d’embrayage',category:'Transmission',ref:'1609015780',image:46},
 {id:47,name:'Durite d’air',category:'Moteur',ref:'144607440R',image:47},
 {id:48,name:'Tuyau de carburant',category:'Moteur',ref:'1574AJ',image:48},
 {id:49,name:'Tube de refroidissement',category:'Refroidissement',ref:'9804177680',image:49},
 {id:50,name:'Joint de réservoir',category:'Moteur',ref:'',image:50},
 {id:51,name:'Bague de réservoir',category:'Moteur',ref:'',image:51},
 {id:53,name:'Joint de culasse',category:'Moteur',ref:'1682802380',image:53},
 {id:54,name:'Tuyau de refroidissement',category:'Refroidissement',ref:'1351VF',image:54},
 {id:55,name:'Tuyau de carburant',category:'Moteur',ref:'',image:55},
 {id:56,name:'Kit d’embrayage',category:'Transmission',ref:'',image:56},
 {id:58,name:'Thermostat',category:'Refroidissement',ref:'',image:58},
 {id:59,name:'Kit de distribution avec pompe',category:'Distribution',ref:'',image:59},
 {id:60,name:'Kit de distribution',category:'Distribution',ref:'',image:60},
 {id:61,name:'Boîtier de thermostat',category:'Refroidissement',ref:'',image:61},
 {id:62,name:'Câble d’embrayage',category:'Transmission',ref:'2150CX',image:62},
 {id:63,name:'Câble d’embrayage',category:'Transmission',ref:'2150EC',image:63},
 {id:64,name:'Câble d’embrayage',category:'Transmission',ref:'2150EE',image:64},
 {id:65,name:'Câble d’embrayage',category:'Transmission',ref:'2150CY',image:65},
 {id:15,name:'Courroies et galets de distribution',category:'Distribution',ref:'',image:15},
 {id:20,name:'Support moteur',category:'Moteur',ref:'',image:20},
 {id:21,name:'Support moteur circulaire',category:'Moteur',ref:'',image:21}
].map(p => ({...p, price:null, image:`assets/photo-${p.image}.jpg`}));
