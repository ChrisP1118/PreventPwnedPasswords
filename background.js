var pppTestedPasswords = [];
var whitelistedHostnames = null;
var learnMoreUrl = 'http://www.xaipete.net/2017/10/24/prevent-pwned-passwords/';

chrome.contextMenus.create({
	title: 'Clear Whitelist',
	contexts: ['page_action'],
	onclick: function () {
		if (confirm('Are you sure you want to clear the whitelist?'))
			chrome.storage.sync.clear();
	}
});

chrome.contextMenus.create({
	title: 'Learn more...',
	contexts: ['page_action'],
	onclick: function () {
		chrome.tabs.create({ url: learnMoreUrl });
	}
});

function checkHash(hashedPassword, hostname) {
	console.log(whitelistedHostnames);
	
	if (whitelistedHostnames.includes(hostname))
		return;
				
	var notificationId = 'ppp_' + hostname;
	
	fetch("https://haveibeenpwned.com/api/v2/pwnedpassword/" + hashedPassword, {
		cache: 'no-store'
	}).then(function(response) {
		if (response.status == 200) {
		
			chrome.notifications.onButtonClicked.addListener(function (notificationId, buttonIndex) {
				if (notificationId == notificationId && buttonIndex == 0) {
					chrome.tabs.create({ url: learnMoreUrl });
				} else if (notificationId == notificationId && buttonIndex == 1) {
					if (!whitelistedHostnames.includes(hostname)) {
						whitelistedHostnames.push(hostname);
						chrome.storage.sync.set({'whitelist': whitelistedHostnames});
						chrome.notifications.clear(notificationId);
					}
				}
			});
			
			chrome.notifications.create(notificationId, {
				type: 'basic',
				iconUrl: 'ppp_48.png',
				title: 'Oh no! Pwned password!',
				message: 'You just used a password on ' + hostname + ' that\'s been present in a data breach. You should consider that password insecure and change it.',
				buttons: [
					{title: 'Learn More'},
					{title: 'Whitelist ' + hostname}
				],
				priority: 0});
				
		} else if (response.status == 404) {
			// Password hasn't been pwned -- nothing to do
		}
	});
}

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.action == 'checkPassword') {
	
			var password = request.password;
			if (password == '')
				return;
				
			var hashedPassword = sha1(password);
			
			if (pppTestedPasswords.includes(hashedPassword))
				return;
			
			pppTestedPasswords.push(hashedPassword);
			
			if (whitelistedHostnames == null) {
				chrome.storage.sync.get('whitelist', function (results) {
					if (typeof results.whitelist === 'undefined') {
						whitelistedHostnames = [];
						chrome.storage.sync.set({'whitelist': whitelistedHostnames});
					} else {
						whitelistedHostnames = results.whitelist;
					}
					
					checkHash(hashedPassword, request.hostname);
				});
			} else {
				checkHash(hashedPassword, request.hostname);
			}
		} else if (request.action == 'clearNotification') {
			var notificationId = 'ppp_' + request.hostname;
			chrome.notifications.clear(notificationId);
		}
	});