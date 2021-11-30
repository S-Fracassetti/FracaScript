import { $, $$, Popup } from '/scripts/basic.js';

const mediasUpload = () => {
	const cardImages = $$('.medias-list .card > img');
	const preview = $('.img-preview');
	preview.classList.add('hidden');
	preview.style.display = 'flex';
	preview.querySelector('.close i').addEventListener('click', () => {
		preview.classList.remove('show');
		setTimeout(() => preview.classList.add('hidden'), 200);
	});
	[...cardImages, $('.img-preview > img')].forEach(img => img.ondragstart = () => false);
	cardImages.forEach(img => img.addEventListener('click', () => {
		preview.querySelector('img').src = img.src;
		preview.classList.remove('hidden');
		preview.classList.add('show');
	}));

	// Upload
	const button = $('#upload-cta');
	const input = $('#media-upload');

	$('.fs').ondragover = function(event){
		event.preventDefault();
		this.classList.add('copy');
		console.log('Dragging');
	}
	$('.fs').ondrop = function(event){
		event.preventDefault();
		this.classList.remove('copy');
		console.log('Dropped');
	}

	button.addEventListener('click', () => input.click());
}

const newApp = () => {
	const form = $('#app-creation-form');
	form.addEventListener('submit', async () => {
		const type = form.querySelector('[name="type"]').value;
		const name = form.querySelector('[name="nome"]').value;
		const description = form.querySelector('[name="descrizione"]').value;
		const error = document.querySelector('#new-app .error');

		if(!type || !name || !description){	
			error.querySelector('.banner--description').textContent = 'Tutti i campi sono obbligatori!';
			$('.loading-creation').classList.add('hidden');
			return error.classList.remove('hidden');
		}

		form.classList.add('hidden');
		$('.loading-creation').classList.remove('hidden');

		const response = await (await fetch('/private/create-app', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				session: _hHS8jid,
				name, type, description
			})
		})).json();

		if(!response.success){
			form.classList.remove('hidden');
			error.querySelector('.banner--description').textContent = response.error;
			$('.loading-creation').classList.add('hidden');
			return error.classList.remove('hidden');
		}
		$('aside [api-section-name="my-apps"]').click();
	});
}

const myApps = async () => {
	const apps = await (await fetch('/private/my-apps?session=' + encodeURIComponent(_hHS8jid))).json();
	$('.loading-apps').classList.add('hidden');
	if(!apps.apps.length)
		$('.no-apps').classList.remove('hidden');

	apps.apps.forEach(app => {
		const container = document.createElement('div');
		const title = document.createElement('h2');
		const type = document.createElement('app-type');
		const description = document.createElement('p');
		const options = document.createElement('div');
		options.classList.add('options');
		const trash = document.createElement('img');
		trash.src = '/assets/icons/trash.svg';
		trash.alt = 'Elimina';
		trash.classList.add('icon');
		const rename = document.createElement('span');
		const changeDescription = document.createElement('span');
		rename.textContent = 'Rinomina';
		changeDescription.textContent = 'Cambia descrizione';
		const left = document.createElement('div');
		left.append(rename, changeDescription);
		options.append(left, trash);
		type.setAttribute(app.type || 'mobile', true);
		type.textContent = app.name;
		title.append(type);
		description.textContent = (app.description.length > 223 ? app.description.substring(0, 220) + '…' : app.description);
		container.classList.add('app');
		container.append(options, title, description);
		$('.app-cards').append(container);

		let titleEditMode = false;
		let descriptionEditMode = false;
		changeDescription.addEventListener('click', () => {
			description.contentEditable = true;
			description.focus();
			descriptionEditMode = true;
		});

		rename.addEventListener('click', () => {
			title.contentEditable = true;
			title.focus();
			titleEditMode = true;
		});

		title.addEventListener('blur', async () => {
			if(!titleEditMode) return;
			titleEditMode = false;
			title.contentEditable = false;
			title.blur();
			await performTitleChange();
		});

		description.addEventListener('blur', async () => {
			if(!descriptionEditMode) return;
			descriptionEditMode = false;
			description.contentEditable = false;
			description.blur();
			await performDescriptionChange();
		});

		description.addEventListener('keypress', async event => {
			if(description.textContent.length > 1023)
				event.preventDefault();
			if(!descriptionEditMode || event.key !== 'Enter') return;
			event.preventDefault();
			description.contentEditable = false;
			descriptionEditMode = false;
			description.blur();
		});

		title.addEventListener('keypress', async event => {
			if(![...'abcdefghijklmnopqrstuvyxz0123456789 -_#'].includes(event.key.toLowerCase()) || title.textContent.rawContent().length > 31)
				event.preventDefault();
			if(!titleEditMode || event.key !== 'Enter') return;
			event.preventDefault();
			title.contentEditable = false;
			titleEditMode = false;
			title.blur();
		});

		trash.addEventListener('click', () => new Popup(`Sicuro di voler procedere?`, `L'operazione è irreversibile, stai per eliminare “${app.name}”`, { type: 'warning', buttons: [{ text: "Elimina", onClick: async () => {
			container.querySelectorAll('*').forEach(i => i.classList.add('hidden'));
			container.setAttribute('loading', true);
			await (await fetch('/private/delete-app', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					session: _hHS8jid,
					appId: app.appId
				})
			})).json();
			container.remove();
			if($$('.app-cards .app').length === 0)
				$('.no-apps').classList.remove('hidden');
		} }, { text: "Annulla", secondary: true }] }).display());

		const performTitleChange = async () => await (await fetch('/private/change-app-title', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				session: _hHS8jid,
				appId: app.appId,
				newTitle: title.textContent
			})
		})).json();

		const performDescriptionChange = async () => console.log(await (await fetch('/private/change-app-description', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				session: _hHS8jid,
				appId: app.appId,
				newDescription: description.textContent
			})
		})).json());

		container.addEventListener('click', async event => {
			if(!'IMG SPAN BUTTON'.split(' ').includes(event.target.tagName)){
				container.querySelectorAll('*').forEach(i => i.classList.add('hidden'));
				container.setAttribute('loading', true);
				const editorSessionId = await (await fetch('/private/editor/createSession', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						session: _hHS8jid,
						appId: app.appId
					})
				})).json();
				if(!editorSessionId.success){
					container.querySelectorAll('*').forEach(i => i.classList.remove('hidden'));
					container.removeAttribute('loading');
					return;
				}
				window.open(`/editor/${editorSessionId.id}`, '_self');
			}
		});
	});
}

String.prototype.rawContent = function(){
	const string = this;
    let startIndex = false;
    let stopIndex = false;
    return [...string].filter(i => {
        if((i === '\t' || i === ' ') && !startIndex) return false;
        else return startIndex = true;
    }).reverse().filter(i => {
        if((i === '\t' || i === ' ') && !stopIndex) return false;
        else return stopIndex = true;
    }).reverse().join('');
}

export { mediasUpload, myApps, newApp };