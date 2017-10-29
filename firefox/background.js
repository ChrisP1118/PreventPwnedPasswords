var testedPasswords = [];
var whitelistedHostnames = null;
var mode = 'All';
var contextMenuPassword = null;
var learnMoreUrl = 'https://chrisp1118.github.io/PreventPwnedPasswords/';
var whitelistHostname = null;

function setMode(newMode) {
	if (mode == newMode)
		return;
		
	browser.storage.sync.set({'mode': newMode});
	mode = newMode;
}

function initContextMenus() {

	browser.contextMenus.create({
		title: 'Has this password been pwned?',
		contexts: ['all'],
		onclick: function (info) {
			if (contextMenuPassword != null)
				checkPassword(contextMenuPassword);
		}
	});

	browser.contextMenus.create({
		contexts: ['all'],
		type: 'separator'
	});
	
	browser.contextMenus.create({
		id: 'settings',
		title: 'Settings',
		contexts: ['all']
	});

	browser.contextMenus.create({
		parentId: 'settings',
		title: 'Verify all password fields',
		contexts: ['all'],
		type: 'radio',
		checked: mode == 'All',
		onclick: function () {
			setMode('All');
		}
	});

	browser.contextMenus.create({
		parentId: 'settings',
		title: 'Verify password fields when creating an account',
		contexts: ['all'],
		type: 'radio',
		checked: mode == 'Create',
		onclick: function () {
			setMode('Create');
		}
	});

	browser.contextMenus.create({
		parentId: 'settings',
		title: 'Verify password fields when I ask',
		contexts: ['all'],
		type: 'radio',
		checked: mode == 'Menu',
		onclick: function () {
			setMode('Menu');
		}
	});
	
	browser.contextMenus.create({
		parentId: 'settings',
		contexts: ['all'],
		type: 'separator'
	});

	browser.contextMenus.create({
		parentId: 'settings',
		id: 'whitelist',
		title: 'Whitelist this site',
		contexts: ['all'],
		onclick: function () {
			whitelistedHostnames.push(whitelistHostname);
			chrome.storage.sync.set({'whitelist': whitelistedHostnames});
		}
	});

	browser.contextMenus.create({
		parentId: 'settings',
		title: 'Clear whitelist',
		contexts: ['all'],
		onclick: function () {
			whitelistedHostnames = [];
			testedPasswords = [];
			browser.storage.sync.set({'whitelist': whitelistedHostnames});
		}
	});

	browser.contextMenus.create({
		contexts: ['all'],
		type: 'separator'
	});

	browser.contextMenus.create({
		title: 'Learn more...',
		contexts: ['all'],
		onclick: function () {
			browser.tabs.create({ url: learnMoreUrl });
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
		
			browser.notifications.create(notificationId, {
				type: 'basic',
				iconUrl: 'warning_48.png',
				title: 'Oh no! Pwned password!',
				message: 'You just used a password on ' + hostname + ' that\'s been in a data breach. You should consider that password insecure and change it.',
				priority: 0});
				
		} else if (response.status == 404) {

			if (ignoreCache) {
				browser.notifications.create(notificationId, {
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
		browser.storage.sync.get('whitelist').then(function (results) {
			if (typeof results.whitelist === 'undefined') {
				whitelistedHostnames = [];
				browser.storage.sync.set({'whitelist': whitelistedHostnames});
			} else {
				whitelistedHostnames = results.whitelist;
			}
			
			checkHash(hashedPassword, request.hostname, request.ignoreCache);
		});
	} else {
		checkHash(hashedPassword, request.hostname, request.ignoreCache);
	}
}

browser.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.action == 'checkPassword') {
			if (mode == 'All')
				checkPassword(request);
			else if (mode == 'Create' && request.isCreateAccount)
				checkPassword(request);
		} else if (request.action == 'clearNotification') {
			var notificationId = 'ppp_' + request.hostname;
			browser.notifications.clear(notificationId);
		} else if (request.action == 'setContextMenuPassword') {
			contextMenuPassword = request;

			whitelistHostname = request.hostname;
			browser.contextMenus.update('whitelist', {
				title: 'Whitelist ' + whitelistHostname
			});
		} else if (request.action == 'setWhitelistHostname') {
			whitelistHostname = request.hostname;
			browser.contextMenus.update('whitelist', {
				title: 'Whitelist ' + whitelistHostname
			});
		}
	});
	
browser.storage.sync.get('mode').then(function (results) {
	if (typeof results.mode !== 'undefined')
		mode = results.mode;
	
	initContextMenus();
});

browser.tabs.onActivated.addListener(function (activeInfo) {
	browser.tabs.get(activeInfo.tabId).then(function(tabInfo) {
		var parser = document.createElement('a');
		parser.href = tabInfo.url;
		
		whitelistHostname = parser.hostname;
		browser.contextMenus.update('whitelist', {
			title: 'Whitelist ' + whitelistHostname
		});
	});
});
