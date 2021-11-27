import { $, $$ } from '/scripts/basic.js';

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

export { mediasUpload };