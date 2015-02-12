
var menuTitlePrefix = "Mail this to";
var baseMenuID = "1000";
var baseContactMenuID = "1500";
var withURLMenuID = "1001";
var MailComposer = null;
var restApiBaseURL = 'https://www.googleapis.com/';
var clientKeyQuery = '?key={140036326041-l2mt34sna0ugvbivqdb0r2kenv9teedh.apps.googleusercontent.com}';
var accessToken;

var mailSendingState = {
	'send' :0,
	'fail' : 1,
	'sending' : 2
};

addContextMenu = function() {

	chrome.contextMenus.removeAll();
	
	chrome.contextMenus.create({
		"id": baseMenuID,
		"title": menuTitlePrefix,
		"contexts": ["page", "selection", "image", "link"],
		"onclick" : clickHandler
	});
	
	chrome.contextMenus.create({
		"id": "1001",
		"title": "Mail with page URL to",
		"contexts": ["page", "selection", "image", "link"],
		"onclick" : clickHandler
	});
	
	readContactsFromStorage(function(newContacts) {
		newContacts.sort();
		for (var j = 0; j < newContacts.length; j++){
			chrome.contextMenus.create({
				"id": newContacts[j],
				"title": newContacts[j],
				"contexts": ["page", "selection", "image", "link"],
				"onclick" : clickHandler,
				"parentId" :baseMenuID
			});
		}
	});
	
	readContactsFromStorage(function(newContacts) {
		newContacts.sort();
		for (var j = 0; j < newContacts.length; j++){
			chrome.contextMenus.create({
				"id": newContacts[j]+j,
				"title": newContacts[j],
				"contexts": ["page", "selection", "image", "link"],
				"onclick" : clickHandlerWithURL,
				"parentId" :withURLMenuID
			});
		}
	});
}

document.addEventListener('DOMContentLoaded', function () {

	MailComposer = require("mailcomposer").MailComposer;
	addContextMenu();
	
	chrome.identity.getAuthToken({ 'interactive': false }, function(token) {
		if( token == 'undefined' || token == null) {
		}
		else {
			accessToken = token;
		}});
});

var clickHandler = function(e) {

	var url = e.pageUrl;
	var body = "";
	var subject = "";
	
	if (e.selectionText) {
		body += e.selectionText;
	}

	if (e.mediaType === "image") {
		subject += "image URL "
		body += e.srcUrl;
	}

	if (e.linkUrl) {
		subject += "link URL "
		body += e.linkUrl;
	}

	sendMail(e.menuItemId, subject + body.substring(0, 10)+"...", body);
};

var clickHandlerWithURL = function(e) {

	var url = e.pageUrl;
	var body = "";
	var subject = "";
	
	if (e.selectionText) {
		body += e.selectionText;
	}

	if (e.mediaType === "image") {
		subject += "image URL "
		body += e.srcUrl;
	}

	if (e.linkUrl) {
		subject += "link URL "
		body += e.linkUrl;
	}
	if (e.pageUrl) {
		body += "\nsource URL = " + e.pageUrl;
	}

	sendMail(e.menuItemId.substring(0, (e.menuItemId.length-1)), subject+body.substring(0, 10)+"...", body);
};

function sendRequest() {

	if (sendReq.readyState == 4 && sendReq.status == 200) {
		var textResponse = sendReq.responseText;
		var jsonResponse = JSON.parse(textResponse);
		setProgressInfo(mailSendingState.send);
	}

	else if(sendReq.status != 200) {
		
		setProgressInfo(mailSendingState.fail);
		// TODO SHOW eRROR SENDING MESSAGE IN UI OR PROGRESS INFO
		var textResponse = sendReq.responseText;

		if (textResponse != null && textResponse != "") {
			var jsonResponse = JSON.parse(textResponse);
			console.log(jsonResponse);
		}
	}
}

function sendMail(to_val, subject_val, body_val) {
	
	setProgressInfo(mailSendingState.sending);
	chrome.identity.getAuthToken({ 'interactive': false }, function(token) {
		if( token == 'undefined' || token == null) {
			setProgressInfo(mailSendingState.fail);
		}
		else {
			accessToken = token;
		}

		var option = {
				encoding: "7-bit"
		}
		var mailcomposer = new MailComposer(option);
		
		mailcomposer.setMessageOption({
			from: "me",
			to: to_val,
			subject: subject_val,
			body: body_val
		});

		mailcomposer.buildMessage(function(err, messageSource) {
			console.log(err || messageSource);
			var rawM = btoa(unescape(encodeURIComponent(messageSource)));
			console.log('before url safe'+rawM);
			// to make url safe base64 encoding
			rawM = rawM.replace(/\+/g, '-').replace(/\//g, '_');
			console.log('after url safe'+rawM);

			sendReq = new XMLHttpRequest();
			var GmailSendRestUrl = restApiBaseURL+'gmail/v1/users/me/messages/send'+clientKeyQuery;

			sendReq.open("POST", GmailSendRestUrl, true);
			sendReq.setRequestHeader('Authorization', 'Bearer ' + accessToken);
			sendReq.setRequestHeader('Content-type', 'application/json');

			sendReq.onreadystatechange  = sendRequest;
			var parameters = { raw: rawM };
			sendReq.onerror = sendRequest;

			console.log(sendReq);

			var string = JSON.stringify(parameters);

			sendReq.send(string);

		});

	});}

readContactsFromStorage = function (callBack) {

	var storageKeyArr = ["contactsArr"];
	chrome.storage.local.get(storageKeyArr, function (result) {
		var contactList = result.contactsArr;
		if (typeof callBack === "function") {
			callBack(contactList);
		}

	});
}

setProgressInfo = function (type) {
	
	var msg = "sending";
	var bColor = '#FCB03C';
	
	switch (type) {
		case mailSendingState.send:
			{
			bColor = '#47F558';
			msg = "Send";
			break;
			}
			
		case mailSendingState.fail:
			{
			bColor = '#FF0000';
			msg = "FAIL";
			break;
			}
			
		case mailSendingState.sending:
			{
			bColor = '#FCB03C';
			msg = ">>>>";
			break;
			}
	}
	
	chrome.tabs.query({active:true,windowType:"normal", currentWindow: true},function(d)
			{
		console.debug(d[0].id);
		chrome.browserAction.setBadgeBackgroundColor({tabId:d[0].id, color:bColor});
		chrome.browserAction.setBadgeText({tabId:d[0].id, text:msg});
			});
}