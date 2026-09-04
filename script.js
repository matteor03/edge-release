const form=document.getElementById('betaForm');
form?.addEventListener('submit',e=>{e.preventDefault();const note=document.getElementById('formNote');note.textContent='Thanks — in the live beta this will capture your request. No data was sent from this prototype.';note.style.color='#208a5c';form.querySelector('button').textContent='Beta request captured locally';});
