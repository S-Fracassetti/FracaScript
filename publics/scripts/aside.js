import { $, $$ } from '/scripts/basic.js';

const aside = $('aside');
const blocks = aside.querySelectorAll('.block-list .block');

let acceptChanges = true;
blocks.forEach(block => block.addEventListener('click', async () => {
	if(!acceptChanges) return;
	acceptChanges = false;

	block.classList.add('selected');
	$('main').setAttribute('loading', true);

	let timeoutExpired = false;
	const timeout = setTimeout(() => {
		timeoutExpired = true;
		acceptChanges = true;
		$('main').removeAttribute('loading');
		block.classList.remove('selected');
	}, 10000);
	
	const sectionName = block.getAttribute('api-section-name').toString();
	// Qui ci andrà il fetch dell'API
	if(!timeoutExpired) return;
}));