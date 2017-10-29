var testedPasswords = [];
var whitelistedHostnames = null;
var mode = 'All';
var contextMenuPassword = null;
var learnMoreUrl = 'https://chrisp1118.github.io/PreventPwnedPasswords/';
var lastHostname = null;

function setMode(newMode) {
	if (mode == newMode)
		return;
		
	chrome.storage.sync.set({'mode': newMode});
	mode = newMode;
}

function initContextMenus() {

	chrome.contextMenus.create({
		title: 'Verify all password fields',
		contexts: ['page_action'],
		type: 'radio',
		checked: mode == 'All',
		onclick: function () {
			setMode('All');
		}
	});

	chrome.contextMenus.create({
		title: 'Verify password fields when creating an account',
		contexts: ['page_action'],
		type: 'radio',
		checked: mode == 'Create',
		onclick: function () {
			setMode('Create');
		}
	});

	chrome.contextMenus.create({
		title: 'Verify password fields when I ask',
		contexts: ['page_action'],
		type: 'radio',
		checked: mode == 'Menu',
		onclick: function () {
			setMode('Menu');
		}
	});
	
	chrome.contextMenus.create({
		contexts: ['page_action'],
		type: 'separator'
	});

	chrome.contextMenus.create({
		title: 'Clear whitelist',
		contexts: ['page_action'],
		onclick: function () {
			if (confirm('Are you sure you want to clear the whitelist?')) {
				whitelistedHostnames = [];
				testedPasswords = [];
				chrome.storage.sync.set({'whitelist': whitelistedHostnames});
			}
		}
	});

	chrome.contextMenus.create({
		title: 'Learn more...',
		contexts: ['page_action'],
		onclick: function () {
			chrome.tabs.create({ url: learnMoreUrl });
		}
	});
	
	chrome.contextMenus.create({
		title: 'Has this password been pwned?',
		contexts: ['editable'],
		onclick: function (info) {
			if (contextMenuPassword != null)
				checkPassword(contextMenuPassword);
		}
	});
}

function checkHash(hashedPassword, hostname, ignoreCache) {
	if (!ignoreCache) {
		if (whitelistedHostnames.includes(hostname))
			return;
					
		if (testedPasswords.includes(hashedPassword))
			return;
	}
	
	testedPasswords.push(hashedPassword);
			
	var notificationId = 'ppp_' + hostname;
	
	fetch("https://haveibeenpwned.com/api/v2/pwnedpassword/" + hashedPassword, {
		cache: 'no-store'
	}).then(function(response) {
		if (response.status == 200) {
		
			lastHostname = hostname;
		
			chrome.notifications.create(notificationId, {
				type: 'basic',
				iconUrl: 'warning_48.png',
				title: 'Oh no! Pwned password!',
				message: 'You just used a password on ' + hostname + ' that\'s been in a data breach. You should consider that password insecure and change it.',
				buttons: [
					{title: 'Learn More'},
					{title: 'Whitelist ' + hostname + ' (Ignore passwords here)'}
				],
				priority: 0});
				
		} else if (response.status == 404) {
			if (ignoreCache) {
				chrome.notifications.create(notificationId, {
					type: 'basic',
					iconUrl: 'success_48.png',
					title: 'Hooray! Good password!',
					message: 'You just used a password on ' + hostname + ' that\'s not known to have been in any data breach.',
					priority: 0});
			}
		}
	});
}

function checkPassword(request) {
	var password = request.password;
	if (password == '')
		return;
		
	var hashedPassword = sha1(password);
	
	if (whitelistedHostnames == null) {
		chrome.storage.sync.get('whitelist', function (results) {
			if (typeof results.whitelist === 'undefined') {
				whitelistedHostnames = [];
				chrome.storage.sync.set({'whitelist': whitelistedHostnames});
			} else {
				whitelistedHostnames = results.whitelist;
			}
			
			checkHash(hashedPassword, request.hostname, request.ignoreCache);
		});
	} else {
		checkHash(hashedPassword, request.hostname, request.ignoreCache);
	}
}

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.action == 'checkPassword') {
			if (mode == 'All')
				checkPassword(request);
			else if (mode == 'Create' && request.isCreateAccount)
				checkPassword(request);
		} else if (request.action == 'clearNotification') {
			var notificationId = 'ppp_' + request.hostname;
			chrome.notifications.clear(notificationId);
		} else if (request.action == 'setContextMenuPassword') {
			contextMenuPassword = request;
		}
	});
	
chrome.storage.sync.get('mode', function (results) {
	if (typeof results.mode !== 'undefined')
		mode = results.mode;
	
	initContextMenus();
});

chrome.notifications.onButtonClicked.addListener(function (notificationId, buttonIndex) {
	if (notificationId == notificationId && buttonIndex == 0) {
		chrome.tabs.create({ url: learnMoreUrl });
	} else if (notificationId == notificationId && buttonIndex == 1) {
		if (!whitelistedHostnames.includes(lastHostname)) {
			whitelistedHostnames.push(lastHostname);
			chrome.storage.sync.set({'whitelist': whitelistedHostnames});
			chrome.notifications.clear(notificationId);
		}
	}
});

