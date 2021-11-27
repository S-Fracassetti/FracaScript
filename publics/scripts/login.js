if(error){
	const banner = document.createElement('error-banner');
	banner.textContent = error;
	document.querySelector('.form-error').append(banner);
}