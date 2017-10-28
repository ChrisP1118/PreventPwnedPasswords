function checkPassword(passwordField) {
	var password = passwordField.value;
	
	var form = passwordField.form;
	var passwords = form.querySelectorAll('input[type="password"]');
	
	chrome.runtime.sendMessage({
		'action': 'checkPassword',
		'password': password,
		'hostname': location.hostname,
		'ignoreCache': false,
		'isCreateAccount': passwords.length >= 2
	});	
}

function clearNotification() {
	chrome.runtime.sendMessage({
		'action': 'clearNotification',
		'hostname': location.hostname
	});
}

var passwordFields = document.querySelectorAll('input[type="password"]');
for (var i = 0; i < passwordFields.length; ++i) {
	passwordFields[i].addEventListener('keyup', function (e) {
		if (e.keyCode == 13)
			checkPassword(this);
		else
			clearNotification();
	});
	passwordFields[i].addEventListener('blur', function (e) {
		checkPassword(this);
	});
}

var clickedElement = null;

document.addEventListener('mousedown', function (e) {
    if (e.button == 2) {
		chrome.runtime.sendMessage({
			'action': 'setContextMenuPassword',
			'hostname': location.hostname,
			'password': event.target.value,
			'ignoreCache': true
		});
	}
}, true);
