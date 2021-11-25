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
	const error = () => {
		timeoutExpired = true;
		acceptChanges = true;
		main.removeAttribute('loading');
		main.setAttribute('empty', true);
		block.classList.remove('selected');
	}
	const timeout = setTimeout(error, 10000);
	
	const sectionName = block.getAttribute('api-section-name').toString();
	const response = await (await fetch('/api/section/' + encodeURIComponent(sectionName), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({})
	})).json();

	if(timeoutExpired) return;
	clearTimeout(timeout);
	acceptChanges = true;

	if(response?.status !== 200){
		alert('error');
		return error();
	}

	main.querySelector('.section-content').innerHTML = response?.content || 'Errore durante il fetch del contenuto';
	main.removeAttribute('empty');
	main.removeAttribute('loading');
}));
