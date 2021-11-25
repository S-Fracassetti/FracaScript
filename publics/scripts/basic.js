const $ = input => document.querySelector(input);
const $$ = input => document.querySelectorAll(input);

class Popup{
	constructor(title, message, options){
		this.title = title;
		this.message = message;
		this.options = options || {};
		this.type = this.options.type || 'note';
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
		// Popup.dom
		const contrast = document.createElement('popup-contrast');
		const popup = document.createElement('popup-window');
		popup.setAttribute('data-type', this.type);

		// Header
		const header = document.createElement('popup-header');

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
			if(object.secondary) button.classList.add('secondary-button');
			if(!object.preventClose) button.addEventListener('click', () => this.close());
			if(object.onClick){
				if(!Array.isArray(object.onClick)) object.onClick = [object.onClick];
				object.onClick.forEach(callback => button.addEventListener('click', callback));
			}
			return button;
		}));

		popup.append(header, content, buttonsContainer);
		contrast.appendChild(popup);
		this.dom = contrast;
	}
}

Popup.Setup();

export { $, $$, Popup };