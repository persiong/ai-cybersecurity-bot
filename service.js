import { quiz } from './public/content.js';
const pages = new Set(['/','/learn','/chat','/protect','/quiz','/stats','/practice']);
const types = {'index.html':'text/html', 'style.css':'text/css','app.js':'text/javascript','content.js':'text/javascript','logo.svg':'image/svg+xml'};
export async function handle(request, db, assets) {
 const { pathname } = new URL(request.url);
 if (pathname === '/api/results' && request.method === 'POST') {
  let data;
  try { data = JSON.parse(await request.text()); } catch { return Response.json({error:'Неверный формат'}, {status:400}); }
  const { id, answers } = data ?? {};
  if (typeof id !== 'string' || !/^[a-f0-9-]{36}$/.test(id) || !Array.isArray(answers) || answers.length !== quiz.length ||
      !answers.every((answer, i) => Number.isInteger(answer) && answer >= 0 && answer < quiz[i][1].length)) {
   return Response.json({error:'Проверьте ответы'}, {status:400});
  }
  const score = answers.reduce((total, answer, i) => total + Number(answer === quiz[i][2]), 0);
  await db.run('INSERT INTO attempts VALUES (?, ?, ?) ON CONFLICT(id) DO NOTHING', [id, score, new Date().toISOString()]);
  const [saved] = await db.all('SELECT score FROM attempts WHERE id = ?', [id]);
  return Response.json(saved);
 }
 if (pathname === '/api/results' && request.method === 'GET') {
  const [summary] = await db.all('SELECT COUNT(*) count, COALESCE(AVG(score),0) average, COALESCE(MAX(score),0) best, COALESCE(SUM(score),0) total FROM attempts', []);
  const recent = await db.all('SELECT score, created_at FROM attempts ORDER BY created_at DESC, id DESC LIMIT 10', []);
  return Response.json({ ...summary, recent }, {headers:{'Cache-Control':'no-store'}});
 }
 const name = pages.has(pathname) ? 'index.html' : pathname.slice(1);
 if (request.method !== 'GET' || !Object.hasOwn(types, name)) return new Response('Страница не найдена', {status:404});
 return new Response(assets[name], {headers:{'Content-Type':types[name] + '; charset=utf-8','X-Content-Type-Options':'nosniff'}});
}
