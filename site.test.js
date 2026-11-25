import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { quiz, reply, lessons, tips } from './public/content.js';

test('Distinct chat answers and fallback', () => {
 const prompts = ['Что такое вирус?', 'Что такое троян?', 'Как вирус попадает на компьютер?', 'Как защититься от вирусов?', 'Что делать при заражении?', 'Опасно ли открывать неизвестные ссылки?'];
 assert.equal(new Set(prompts.map(reply)).size, prompts.length);
 assert.match(reply('Сколько будет дважды два?'), /переформулировать/);
 assert.equal(lessons.length, 10);
 assert.equal(tips.length, 9);
});

test('Pages, quiz scoring, retries and persistence across restart', async () => {
 const folder = await mkdtemp(join(tmpdir(), 'cybershield-'));
 const port = 23861;
 const root = 'http://127.0.0.1:' + port;
 async function start() {
  const processHandle = spawn(process.execPath, ['server.js'], {
   env: {...process.env, HOST:'127.0.0.1', PORT:String(port), CYBERSHIELD_DB:join(folder,'test.sqlite')}
  });
  await Promise.race([
   once(processHandle.stdout, 'data'),
   once(processHandle, 'exit').then(() => { throw Error('Server exited before readiness'); })
  ]);
  return processHandle;
 }
 async function stop(handle) {
  const exited = once(handle, 'exit');
  handle.kill();
  await exited;
 }
 let server;
 try {
  server = await start();
  for (const page of ['/','/chat','/learn','/protect','/stats','/quiz','/practice','/style.css','/app.js','/content.js']) {
   assert.equal((await fetch(root + page)).status, 200, page);
  }
  const submit = async data => fetch(root + '/api/results', {method:'POST',body:JSON.stringify(data)});
  const correct = quiz.map(q=>q[2]);
  const mixed = correct.map((answer,i) => i < 2 ? (answer+1)%3 : answer);
  const first = {id:crypto.randomUUID(),answers:correct};
  const second = {id:crypto.randomUUID(),answers:mixed};
  assert.deepEqual(await (await submit(first)).json(), {score:10});
  assert.deepEqual(await (await submit(second)).json(), {score:8});
  assert.deepEqual(await (await submit(second)).json(), {score:8});
  assert.equal((await submit({id:crypto.randomUUID(),answers:[0]})).status,400);
  await stop(server);
  server = await start();
  const { count, average, best, total, recent } = await (await fetch(root + '/api/results')).json();
  assert.deepEqual({count,average,best,total}, {count:2,average:9,best:10,total:18});
  assert.deepEqual(recent.map(row=>row.score), [8,10]);
 } finally {
  if (server?.exitCode === null && server.signalCode === null) await stop(server);
  await rm(folder,{recursive:true,force:true});
 }
});
