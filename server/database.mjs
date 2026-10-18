import{DatabaseSync}from'node:sqlite';
import fs from'node:fs';import path from'node:path';
export function openDatabase(filename){
 if(filename!==':memory:')fs.mkdirSync(path.dirname(path.resolve(filename)),{recursive:true});
 const db=new DatabaseSync(filename);db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
 db.exec('CREATE TABLE IF NOT EXISTS local_migrations(name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)');
 const schema=fs.readFileSync(new URL('../drizzle/0000_rooms.sql',import.meta.url),'utf8');
 if(!db.prepare('SELECT name FROM local_migrations WHERE name=?').get('0000_rooms')){
  db.exec('BEGIN IMMEDIATE');try{
   // Adopt a prior local database only when its tables already match the room schema.
   const existing=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='rooms'").get();
   if(!existing)db.exec(schema);else{const columns=db.prepare('PRAGMA table_info(rooms)').all().map(c=>c.name);if(!['code','state','version','created_at','expires_at'].every(c=>columns.includes(c)))throw Error('Existing local rooms schema is incompatible. Back up the database and review it.');db.exec('CREATE TABLE IF NOT EXISTS room_limits(key TEXT PRIMARY KEY, count INTEGER NOT NULL DEFAULT 0, expires_at INTEGER NOT NULL)');}
   db.prepare('INSERT INTO local_migrations VALUES(?,?)').run('0000_rooms',Date.now());db.exec('COMMIT');
  }catch(e){db.exec('ROLLBACK');db.close();throw e;}
 }
 return {
  close:()=>db.close(),
  prepare(sql){
   return {bind(...args){
    return {
     async first(){return db.prepare(sql).get(...args)||null;},
     async run(){const result=db.prepare(sql).run(...args);return {meta:{changes:Number(result.changes)}};}
    };
   }};
  }
 };
}
