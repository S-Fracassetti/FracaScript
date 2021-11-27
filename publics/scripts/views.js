import { $, $$ } from '/scripts/basic.js';

const header = $('header');
const main = $('main');

main.style.maxHeight = (window.innerHeight - header.getBoundingClientRect().height) + 'px';

const Menu = {
	close: () => new Promise(resolve => {
		const headerHeight = header.getBoundingClientRect().height;
		main.style.height = `calc(100vh - ${headerHeight}px)`;
		main.style.marginTop = headerHeight + 'px';
		document.body.classList.add('full');
		setTimeout(resolve, 300);
	}),
	open: () => new Promise(resolve => {
		const headerHeight = header.getBoundingClientRect().height;
		main.style.height = '';
		main.style.marginTop = '';
		document.body.classList.add('not-full');
		setTimeout(() => {
			document.body.classList.remove('full');
			document.body.classList.remove('not-full');
			resolve();
		}, 300);
	}),
	get isOpened(){
		return !document.body.classList.value.includes('full');
	}
}

const burgerIcon = $('header .mobile-icon');
burgerIcon.addEventListener('click', () => Menu.isOpened ? Menu.close() : Menu.open());