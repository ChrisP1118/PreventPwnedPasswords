function pppCheckPassword(passwordField) {
	var password = passwordField.value;
	
	chrome.runtime.sendMessage({
		'password': password,
		'hostname': location.hostname
	}, function(response) {
		//console.log(response);
		//console.log(response.passwordResponse);
	});	
}

var passwordFields = document.querySelectorAll('input[type="password"]');
for (var i = 0; i < passwordFields.length; ++i) {
	passwordFields[i].addEventListener('keyup', function (e) {
		if (e.keyCode == 13)
			pppCheckPassword(this);
	});
	passwordFields[i].addEventListener('blur', function (e) {
		pppCheckPassword(this);
	});
}