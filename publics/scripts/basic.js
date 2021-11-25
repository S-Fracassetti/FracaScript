const $ = input => document.querySelector(input);
const $$ = input => document.querySelectorAll(input);

class Popup{
	constructor(title, message, type = 'danger', options){
		this.title = title;
		this.message = message;
		this.options = options || {};
		this.type = type;
		this.events = {};
		this.onClose = callback => this.events.close = callback;
		this.onDisplay = callback => this.events.display = callback;
		this.onHide = callback => this.events.hide = callback;
		this.saveRender();
	}

	close(){
		this.events?.close?.();
		this.dom.remove();
	}

	display(){
		document.body.append(this.dom);
		this.dom.classList.remove('popup-hidden');
		this.events?.display?.();
	}

	hide(){
		this.dom.classList.add('popup-hidden');
		this.events?.hide?.();
	}

	static Setup(){
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = '/styles/lib/Popup.css';
		document.head.prepend(link);
	}

	saveRender(){
		console.log(1);
		// Popup.dom
		const contrast = document.createElement('popup-contrast');
		const popup = document.createElement('popup-window');

		// Header
		const header = document.createElement('popup-header');
		header.setAttribute('data-type', this.type);

		// Content
		const content = document.createElement('popup-content');
		const title = document.createElement('popup-title');
		const paragraph = document.createElement('popup-paragraph');

		title.textContent = this.title;
		paragraph.textContent = this.message;

		content.append(title, paragraph);

		// CTAs
		const buttonsContainer = document.createElement('popup-callbacks');
		buttonsContainer.append(...(this.options?.buttons || [{ text: 'Chiudi' }]).map(object => {
			const button = document.createElement('popup-button');
			button.textContent = object.text;
			if(object.type === 'secondary') button.classList.add('secondary-button');
			if(!object.preventClose) button.addEventListener('click', () => this.close());
			return button;
		}));

		content.append(header, buttonsContainer);
		popup.append(content);
		contrast.appendChild(popup);
		this.dom = contrast;
	}
}

Popup.Setup();

new Popup('test', 'lorem ipsum dolor sit amet').display();

export { $, $$, Popup };