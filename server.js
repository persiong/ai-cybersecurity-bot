import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { handle } from './service.js';
const file = process.env.CYBERSHIELD_DB ?? 'data/results.sqlite';
mkdirSync(dirname(file), { recursive: true });
const db = new DatabaseSync(file);
db.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
const query = {
 async run(sql, args) { db.prepare(sql).run(...args); },
 async all(sql, args) { return db.prepare(sql).all(...args); }
};
const assets = Object.fromEntries(['index.html','style.css','app.js','content.js','logo.svg'].map(name => [name, readFileSync(new URL('./public/' + name, import.meta.url), 'utf8')]));
const port = Number(process.env.PORT ?? 3000);
createServer(async (req, res) => {
 try {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
   size += chunk.length;
   if (size > 4096) { res.writeHead(413).end(); return; }
   chunks.push(chunk);
  }
  const response = await handle(new Request('http://localhost' + req.url, {
   method: req.method,
   body: chunks.length && !['GET','HEAD'].includes(req.method) ? Buffer.concat(chunks) : undefined
  }), query, assets);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
 } catch {
  res.writeHead(500, {'Content-Type':'application/json'}).end(JSON.stringify({error:'Ошибка сервера'}));
 }
}).listen(port, process.env.HOST ?? '127.0.0.1', () => console.log('http://localhost:' + port));
