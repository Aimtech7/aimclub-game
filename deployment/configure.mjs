import fs from'node:fs/promises';
const databaseId=process.env.CLOUDFLARE_D1_DATABASE_ID,name=process.env.CLOUDFLARE_WORKER_NAME||'aimfun-club';
if(!databaseId||!/^[a-f0-9-]{36}$/i.test(databaseId))throw Error('Set CLOUDFLARE_D1_DATABASE_ID to your D1 database UUID.');
if(!/^[a-z0-9][a-z0-9-]{0,62}$/.test(name))throw Error('Choose a lowercase Cloudflare Worker name.');
const config={name,main:'dist/server/index.js',compatibility_date:'2026-10-01',workers_dev:true,d1_databases:[{binding:'DB',database_name:process.env.CLOUDFLARE_D1_DATABASE_NAME||'aimfun-club',database_id:databaseId,migrations_dir:'drizzle'}]};
await fs.writeFile('.local-wrangler.json',JSON.stringify(config,null,2)+'\n');console.log('Generated local Cloudflare deployment configuration.');
