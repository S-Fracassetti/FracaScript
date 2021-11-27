import { $, $$ } from '/scripts/basic.js';

const updateCheckboxes = () => {
	const checkboxes = $$('.checkbox--block:not(imported)');
	checkboxes.forEach(checkbox => {
		checkbox.setLoadingStatus = status =>
			checkbox[status ? 'setAttribute' : 'removeAttribute']('loading', true);
		if(checkbox.getAttribute('loading') !== null) return;
		const async = checkbox.getAttribute('async');
		checkbox.setAttribute('imported', true);
		checkbox.querySelectorAll('.checkbox--label, .checkbox').forEach(_ => _.addEventListener('click', () => {
			checkbox?.onCheck?.(checkbox, !(checkbox.getAttribute('checked') !== null));
			if(async !== null){
				checkbox.removeAttribute('checked');
				checkbox.setAttribute('loading', true);
			}
			else{
				checkbox.removeAttribute('loading');
				checkbox[checkbox.getAttribute('checked') !== null ? 'removeAttribute' : 'setAttribute']('checked', true);
			}
		}));
	});
}
updateCheckboxes();

export default updateCheckboxes;