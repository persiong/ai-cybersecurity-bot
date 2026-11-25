import { lessons, tips, quiz, reply } from './content.js';
const app = document.querySelector('#app');
const staticPage = document.documentElement.dataset.staticPage;
const page = staticPage ?? location.pathname;
document.querySelectorAll('nav a').forEach(a => {
 const href = a.getAttribute('href');
 const route = staticPage ? '/' + href.slice(2).replace(/\/$/, '') : href;
 if (route === page) a.setAttribute('aria-current','page');
});
const historyKey = 'cybershield.attempts.v1';

function localAttempts() {
 return JSON.parse(localStorage.getItem(historyKey) ?? '[]');
}

async function results(attempt) {
 if (staticPage) {
  const recent = localAttempts();
  if (attempt) {
   const saved = recent.find(row => row.id === attempt.id);
   if (saved) return saved;
   const score = attempt.answers.reduce((sum, answer, i) => sum + Number(answer === quiz[i][2]), 0);
   const row = { id: attempt.id, score, created_at: new Date().toISOString() };
   localStorage.setItem(historyKey, JSON.stringify([row, ...recent]));
   return row;
  }
  const scores = recent.map(row => row.score);
  const count = scores.length;
  const total = scores.reduce((sum, score) => sum + score, 0);
  const best = scores.reduce((max, score) => Math.max(max, score), 0);
  return { count, total, best, average: count ? total / count : 0, recent: recent.slice(0, 10) };
 }
 const response = await fetch('/api/results', attempt ? {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(attempt)
 } : undefined);
 if (!response.ok) throw new Error('Не удалось получить результаты');
 return response.json();
}
const heading = (title, description) => `<header class="page-heading"><h1>${title}</h1><p>${description}</p></header>`;
if (page === '/') {
 app.innerHTML = `<section class="home-intro">
 <div class="home-copy"><h1>Компьютерные угрозы.<br><em>Как защитить себя?</em></h1><p>Добро пожаловать в КиберЩит! Разберитесь, как работают вирусы, как заметить заражение и что делать, если устройство под угрозой.</p>
 <div class="actions"><a class="button" href="/chat">Спросить бота</a><a class="button secondary" href="/learn">Учебные материалы</a><a class="button secondary" href="/quiz">Пройти тест</a></div></div>
 <div class="shield-art" aria-hidden="true"><div class="shield-rings"><img src="/logo.svg" alt="" width="96" height="96"></div></div>
 </section>
 <section class="directory" aria-label="Практика и защита"><h2>Практика и защита</h2><div class="directory-list">
 <a href="/protect#incident"><strong>Что делать при заражении</strong><span>Первые действия и инструкция по восстановлению</span></a>
 <a href="/practice"><strong>Тренажёр по фишингу</strong><span>Найдите подозрительные фрагменты в учебном письме</span></a>
 <a href="/stats"><strong>Статистика теста</strong><span>Баллы, средний результат и история прохождений</span></a>
 </div></section>`;
}
if (page === '/practice') {
 app.innerHTML = heading('Тренажёр по фишингу','Разберите учебное письмо от якобы школьной поддержки.') + `<div class="workspace"> <section class="mail"><div class="mail-head"><div><h2>Разбор письма</h2><p>Найдите три признака фишинга.</p></div><output aria-label="Найдено признаков" aria-live="polite">0 / 3</output></div>
 <div class="mail-body"><button type="button" aria-pressed="false" data-clue="0"><small>Отправитель</small>Поддержка школы &lt;notice@edu-check.example&gt;</button><button type="button" aria-pressed="false" data-clue="1">Ваш аккаунт заблокируют через 15 минут.</button><button type="button" aria-pressed="false" data-clue="2">Подтвердите пароль по ссылке</button></div>
 <p class="mail-feedback" role="status">Нажимайте на подозрительные фрагменты.</p></section><aside class="side-panel"><h2>Как проверить письмо</h2><p>Уточните адрес отправителя через знакомый канал связи. Если сообщение требует срочного входа, откройте сервис вручную.</p><a class="text-link" href="/protect">Другие способы защиты</a></aside></div>`;
 const clues = ['Адрес отправителя стоит сверить с официальным адресом школы.', 'Короткий срок подталкивает к поспешному решению.', 'Запрос пароля по ссылке опасен. Откройте школьный сервис по знакомому адресу.'];
 const found = new Set();
 const feedback = app.querySelector('.mail-feedback');
 const counter = app.querySelector('output');
 app.querySelectorAll('[data-clue]').forEach(button => button.onclick = () => {
  const index = Number(button.dataset.clue);
  found.add(index);
  button.setAttribute('aria-pressed','true');
  counter.textContent = found.size + ' / 3';
  feedback.textContent = clues[index] + (found.size === clues.length ? ' Все признаки найдены.' : '');
 });
}
if (page === '/learn') {
 const groups = [
  { title: 'Вирусы и заражение', start: 0, end: 6 },
  { title: 'Защита и восстановление', start: 6, end: lessons.length }
 ];
 app.innerHTML = heading('Учебные материалы','Выберите тему, чтобы раскрыть объяснение.') + `
 <div class="topics">${groups.map(({title,start,end})=>`<section class="topic-group" aria-labelledby="topic-group-${start}">
  <h2 id="topic-group-${start}">${title}</h2>
  ${lessons.slice(start,end).map(([label,body],i)=>`<details class="card">
   <summary><span class="number">${String(start+i+1).padStart(2,'0')}</span><span>${label}</span></summary>
   <p>${body}</p>
  </details>`).join('')}
 </section>`).join('')}</div>`;
}
if (page === '/protect') {
 const groups = [
  ['Устройство и программы', [0, 1, 2, 6]],
  ['Аккаунты и файлы', [3, 4, 5, 7]]
 ];
 app.innerHTML = heading('Профилактика и защита','Настройте защиту устройства и подготовьтесь к возможной потере данных.') + `
 <section id="incident" class="incident"><h2>Что делать при заражении</h2><p>${tips[8][1]}</p></section>
 <div class="topics">${groups.map(([label,indices])=>`<section class="advice"><h2>${label}</h2>${indices.map(i=>`<article><h3>${tips[i][0]}</h3><p>${tips[i][1]}</p></article>`).join('')}</section>`).join('')}</div>`;
 if (location.hash === '#incident') document.querySelector('#incident').scrollIntoView();
}
if (page === '/chat') {
 const prompts = ['Что такое вирус?','Что такое троян?','Как вирус попадает на компьютер?','Как защититься от вирусов?','Что делать при заражении?','Опасно ли открывать неизвестные ссылки?'];
 app.innerHTML = heading('Чат-бот КиберЩит','Задайте вопрос о вредоносных программах или защите устройства.') + `<div class="workspace chat-workspace">
 <section class="chat"><div class="chat-title"><img src="/logo.svg" width="32" height="32" alt=""><h2>Переписка</h2></div><div class="messages" role="log" aria-label="Переписка"></div>
 <form><input aria-label="Ваш вопрос" placeholder="Напишите вопрос…" required maxlength="500"><button class="button">Отправить</button></form></section>
 <aside class="side-panel chat-suggestions"><h2>О чём спросить?</h2><div class="prompts">${prompts.map(p=>`<button type="button">${p}</button>`).join('')}</div><a class="text-link" href="/learn">Учебные материалы</a></aside></div>`;
 const log = app.querySelector('.messages');
 const input = app.querySelector('input');
 function add(message, sender) {
  const bubble = document.createElement('p');
  bubble.className = 'bubble ' + sender;
  bubble.textContent = message;
  log.append(bubble);
  log.scrollTop = log.scrollHeight;
 }
 add('Привет! Я помогу разобраться с компьютерными вирусами. С чего начнём?', 'bot');
 function send(question) {
  if (!question.trim()) return;
  add(question.trim(),'user');
  add(reply(question),'bot');
  input.value = '';
 }
 app.querySelector('form').onsubmit = event => { event.preventDefault(); send(input.value); input.focus(); };
 app.querySelectorAll('.prompts button').forEach(button => button.onclick = () => send(button.textContent));
}
function level(score) {
 if (score >= 9) return 'отличный';
 if (score >= 7) return 'хороший';
 if (score >= 5) return 'базовый';
 return 'начальный';
}
if (page === '/quiz') {
 const title = heading('Тест по кибербезопасности','10 вопросов. В каждом один правильный ответ.');
 app.innerHTML = title + '<section class="quiz"></section><div class="quiz-note"><span>Один правильный ответ — один балл.</span><a class="text-link" href="/stats">История попыток</a></div>';
 const panel = app.querySelector('.quiz');
 let answers, id;
 function start() {
  answers = [];
  id = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(18)), b => b.toString(16).padStart(2,'0')).join('');
  question();
 }
 function question() {
  const i = answers.length;
  const [label, options] = quiz[i];
  panel.innerHTML = `<div class="progress-label">Вопрос ${i+1} из ${quiz.length}</div><progress value="${i+1}" max="${quiz.length}"></progress><h2 tabindex="-1">${label}</h2><div class="options">${options.map((option,index)=>`<button data-index="${index}"><span>${['А','Б','В'][index]}</span>${option}</button>`).join('')}</div>`;
  if(i) panel.querySelector('h2').focus();
  panel.querySelectorAll('button').forEach(button => button.onclick = () => {
   answers.push(Number(button.dataset.index));
   if (answers.length === quiz.length) finish();
   else question();
  });
 }
 async function finish() {
  panel.innerHTML = '<p role="status">Сохраняем результат…</p>';
  try {
   const {score} = await results({id,answers});
   panel.innerHTML = `<h2>Ваш результат — ${score} из 10</h2><p class="score">${score*10}%</p><p>Уровень знаний — ${level(score)}.</p><div class="actions"><button class="button">Пройти повторно</button><a class="button secondary" href="/stats">Статистика</a></div>`;
   panel.querySelector('button').onclick = start;
  } catch {
   panel.innerHTML = '<p role="alert">Не удалось сохранить результат. Повторите попытку.</p><button class="button">Сохранить снова</button>';
   panel.querySelector('button').onclick = finish;
  }
 }
 start();
}
if (page === '/stats') {
 app.innerHTML = heading('Статистика теста', staticPage ? 'История прохождений в этом браузере.' : 'Общая история прохождений на этом сайте.') + '<div id="results" aria-live="polite"></div>';
 const output = app.querySelector('#results');
 async function show() {
  output.textContent = 'Загружаем статистику…';
  try {
   const { count, average, best, total, recent } = await results();
   const date = new Intl.DateTimeFormat('ru',{dateStyle:'medium',timeStyle:'short'});
   output.innerHTML = `<div class="metrics">${[['Прохождений',count],['Средний результат',count ? Math.round(average*10)+'%' : '—'],['Лучший результат',count ? best+' / 10' : '—'],['Всего правильных ответов',total]].map(([label,value])=>`<div class="metric"><strong>${value}</strong><p>${label}</p></div>`).join('')}</div><section class="history"><h2>Последние результаты</h2>${recent.length ? `<ul>${recent.map(r=>`<li><time datetime="${r.created_at}">${date.format(new Date(r.created_at))}</time><progress aria-label="Баллы за попытку" value="${r.score}" max="10"></progress><strong>${r.score} из 10</strong></li>`).join('')}</ul>` : '<p>История пока пуста.</p><a class="button" href="/quiz">Пройти тест</a>'}</section>`;
  } catch {
   output.innerHTML = '<p role="alert">Не удалось загрузить статистику.</p><button class="button">Повторить</button>';
   output.querySelector('button').onclick = show;
  }
 }
 show();
}
