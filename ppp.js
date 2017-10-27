function checkPassword(passwordField) {
	var password = passwordField.value;
	
	chrome.runtime.sendMessage({
		'action': 'checkPassword',
		'password': password,
		'hostname': location.hostname
	}, function(response) {
		//console.log(response);
		//console.log(response.passwordResponse);
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

