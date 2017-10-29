var keyupTimeout = null;

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
		var passwordField = this;
		clearTimeout(keyupTimeout);
		if (e.keyCode == 13)
			checkPassword(passwordField);
		else {
			keyupTimeout = setTimeout(function () {
				checkPassword(passwordField);
			}, 1500);
			clearNotification();
		}
	});
	passwordFields[i].addEventListener('blur', function (e) {
		clearTimeout(keyupTimeout);
		checkPassword(this);
	});
}

var clickedElement = null;

document.addEventListener('mousedown', function (e) {
    if (e.button == 2) {
		chrome.runtime.sendMessage({
			'action': 'setContextMenuPassword',
			'hostname': location.hostname,
			'password': e.target.value,
			'ignoreCache': true
		});
	}
}, true);
