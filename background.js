var pppTestedPasswords = [];

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		console.log(request);
		
		var password = request.password;
		
		if (pppTestedPasswords.includes(password)) {
			return;
		}
		
		pppTestedPasswords.push(password);
		
		var xhr = new XMLHttpRequest();
		xhr.open("GET", "https://haveibeenpwned.com/api/v2/pwnedpassword/" + password, true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				if (xhr.status == 200) {
					
					chrome.notifications.onButtonClicked.addListener(function (notificationId, buttonIndex) {
						if (notificationId = 'ppp' && buttonIndex == 0)
							chrome.tabs.create({ url: 'http://www.xaipete.net/2017/10/24/prevent-pwned-passwords/' });
					});
					
					chrome.notifications.create('ppp', {
						type: 'basic',
						iconUrl: 'ppp_48.png',
						title: 'Oh no! Pwned password!',
						message: 'You just used a password on ' + request.hostname + ' that\'s been present in a data breach. You should consider that password insecure and change it.',
						buttons: [
							{title: 'Learn More'}
						],
						priority: 0});
						
				} else if (xhr.status == 404) {
					// Password hasn't been pwned -- nothing to do
				}
			}
		}
		xhr.send();
	});