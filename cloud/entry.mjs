import {createClient} from '@supabase/supabase-js';
import config from '../supabase/public-config.json';
import {createAdapter} from './adapter.mjs';
const client=createClient(config.url,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
window.shopRequest=createAdapter(client);
window.SHOP_CLOUD=true;
