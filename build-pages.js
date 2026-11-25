import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const output = 'dist/pages';
const routes = ['/', '/learn', '/chat', '/protect', '/practice', '/quiz', '/stats'];
const files = ['style.css', 'app.js', 'content.js', 'logo.svg'];

// All generated documents resolve links and assets against the project root.
function relativeLinks(source) {
 return source.replace(/\b(href|src)="\/([^"]*)"/g, (_, attribute, target) => {
  const [path, fragment] = target.split('#');
  const destination = path && routes.includes('/' + path) ? path + '/' : path;
  return `${attribute}="./${destination}${fragment ? '#' + fragment : ''}"`;
 });
}

const template = relativeLinks(readFileSync('public/index.html', 'utf8'));
for (const route of routes) {
 const directory = join(output, route.slice(1));
 const html = template
  .replace('<html lang="ru">', `<html lang="ru" data-static-page="${route}">`)
  .replace('<head>', `<head><base href="${route === '/' ? './' : '../'}">`)
  .replace('href="#app"', `href="${route === '/' ? './' : './' + route.slice(1) + '/'}#app"`);
 mkdirSync(directory, { recursive: true });
 writeFileSync(join(directory, 'index.html'), html);
}
for (const file of files) {
 const source = readFileSync(join('public', file), 'utf8');
 writeFileSync(join(output, file), file === 'app.js' ? relativeLinks(source) : source);
}
writeFileSync(join(output, '.nojekyll'), '');
