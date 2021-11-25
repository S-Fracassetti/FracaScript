import { $, $$, Popup } from '/scripts/basic.js';

const aside = $('aside');
const main = $('main');
const blocks = aside.querySelectorAll('.block-list .block');

let acceptChanges = true;
blocks.forEach(block => block.addEventListener('click', async () => {
	if(!acceptChanges || block.classList.value.includes('selected')) return;
	acceptChanges = false;

	blocks.forEach(block => block.classList.remove('selected'));
	block.classList.add('selected');
	main.setAttribute('loading', true);

	let timeoutExpired = false;
	const error = status => {
		timeoutExpired = true;
		acceptChanges = true;
		main.removeAttribute('loading');
		main.setAttribute('empty', true);
		block.classList.remove('selected');
		new Popup(`Errore ${status}!`, 'Si è verificato un errore durante il caricamento della sezione', { type: 'danger' } ).display();
	}
	const timeout = setTimeout(() => error(408), 10000);
	
	let ce = false;
	const sectionName = block.getAttribute('api-section-name').toString();
	let response;
	try{
		response = await (await fetch('/api/section/' + encodeURIComponent(sectionName), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({})
		})).json();
	}
	catch(e){ ce = true }

	if(timeoutExpired) return;
	clearTimeout(timeout);
	acceptChanges = true;

	if(ce) return error(503);
	if(response?.status !== 200 && !ce) return error(response.status);

	main.querySelector('.section-content').innerHTML = response?.content || 'Errore durante il fetch del contenuto';
	main.removeAttribute('empty');
	main.removeAttribute('loading');
}));
