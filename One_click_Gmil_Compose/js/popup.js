var sendXHRReq;
var contacts = null;
var MailComposer;
var accessToken;
var customProgressBar;
var progressBarDiv ;
var storageKeyArr = ["profilePic", "profileName"];
var restApiBaseURL = 'https://www.googleapis.com/';
var clientKeyQuery = '?key={140036326041-l2mt34sna0ugvbivqdb0r2kenv9teedh.apps.googleusercontent.com}';

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById("login_btn")
          .addEventListener("click", login, false);
	document.getElementById("send")
          .addEventListener("click", sendMail, false);
		  
	MailComposer = require("mailcomposer").MailComposer;
    progressBarDiv = document.getElementById("progressInfo_bar");
    customProgressBar = new ProgressBar.Line(progressBarDiv, {
        color: '#FCB03C'
    });
    startUpLogin();
});

function startUpLogin() {

    chrome.identity.getAuthToken({ 'interactive': false }, function(token) {
		if( token == 'undefined' || token == null) {
			document.getElementById("send").disabled = true;
		}
		else {               
            accessToken = token;
                                 
            chrome.storage.local.get(storageKeyArr, function (result) {
                console.log(result);
                    
                var imgUrl = result.profilePic;
                var profileNameTxt = result.profileName;
                
                console.log(imgUrl);
                if (imgUrl == 'undefined' || imgUrl == null) {
                    console.log(imgUrl);
                    login();
                    return;
                }
                document.getElementById("login_btn").remove();
                addLoginElement(imgUrl, profileNameTxt);
            });
		}
	});
}
                                     
function addLoginElement(profilePicImage, profileName) {
                
    var loginAreadiv = document.getElementById("login_area");
    var profileImgElm = document.createElement('img');

    profileImgElm.setAttribute('src', profilePicImage);
    loginAreadiv.appendChild(profileImgElm);

    var pofileNameElm = document.createTextNode(profileName);

    loginAreadiv.appendChild(pofileNameElm);
}
            
function login() {

    chrome.identity.getAuthToken({ 'interactive': true }, function(token) {

        //TODO start some progrees indication in UI
        if(token == 'undefined' || token == null) {
            console.log('fail to login please contact vendor or check your internet connection');
            //TODO show alert here
            return;
        }

        console.log(token);
        accessToken = token;
        var xhr = new XMLHttpRequest();
        var GmailProfileRestUrl = restApiBaseURL+'gmail/v1/users/me/profile'+clientKeyQuery;

        xhr.open("get", GmailProfileRestUrl, true);
        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        xhr.onload  = function() {
            if (xhr.status == 200) {
                var textResponse = xhr.responseText;  
                console.log(textResponse);
                var jsonResponse = JSON.parse(textResponse);
                var userEmailAddress = jsonResponse.emailAddress;
                console.log(userEmailAddress);
                document.getElementById("send").disabled = false;
            }
        }; 

        xhr.onerror = function() {
            //TODO show alert 
            console.log('dont have gmail access');
        }
        xhr.send();

        //google plus profile get
        var xhrp = new XMLHttpRequest();
        var GPlusProfileRestUrl = restApiBaseURL+'plus/v1/people/me'+clientKeyQuery;  

        xhrp.open("get", GPlusProfileRestUrl, true);
        xhrp.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        xhrp.onload  = function() {

            if (xhrp.status == 200) {
                var textResponse = xhrp.responseText;  
                var jsonResponse = JSON.parse(textResponse);

                var name = jsonResponse.displayName;
                console.log(name);

                var imageUrl = jsonResponse.image.url;
                console.log(imageUrl);
                document.getElementById("login_btn").remove();

                var serilizeValue = {'profilePic': imageUrl, 'profileName': name};
                chrome.storage.local.set(serilizeValue, function() {
                    console.log('store content '+chrome.runtime.lastError );
                });
                //TODO END PROGRESS INDICATION HERE
                addLoginElement(imageUrl, name);
          }
        }; 

        xhrp.onerror = function() {
            console.log('err');
        }
        xhrp.send();
    });
}


function sendRequest() {
    
    var progressColor = '#FB0612';
    var progressDuration = 3000;
	if (sendReq.readyState == 4 && sendReq.status == 200) {
		var textResponse = sendReq.responseText;
		var jsonResponse = JSON.parse(textResponse);
        progressDuration = 1200;
        progressColor = '#47F558';
        //TODO show some acknowledgement in UI
        //TODO OR MESSAGE SEND TO SMTP SERVER SUCCESSFULLY
		console.log(jsonResponse);
    }
    
    else if (this.status === 401) {
          // This status may indicate that the cached
          // access token was invalid. Retry once with
          // a fresh token.
          chrome.identity.removeCachedAuthToken(
              { 'token': accessToken },
              login);
        }
    else if(sendReq.status != 200) {
		
        //TODO SHOW eRROR SENDING MESSAGE IN UI OR PROGRESS INFO
        //if message is invalid credential than revoke access immediatly 
		var textResponse = sendReq.responseText;  
		var jsonResponse = JSON.parse(textResponse);
		console.log(jsonResponse);
    }
    
    document.getElementById("send_mail_field").disabled = false;
    customProgressBar.animate(1, { 
        duration: 1200,
        from: { color: '#FCB03C' },
        to: { color: progressColor },
        step: function(state, line) {
            line.path.setAttribute('stroke', state.color);
        }
    }, function() {
        console.log('Animation has finished');
        resetProgreesBar();
    });
}


function sendMail() {
    
    document.getElementById("send_mail_field").disabled = true;

	var to_val = document.getElementById("id_to").value;
	var body_val = document.getElementById("id_body").value;
	var subject_val = document.getElementById("id_subject").value;
    
    if(to_val == null || to_val == "") {
        alert("Invalid value");
        document.getElementById("send_mail_field").disabled = false;
        customProgressBar.destroy();
        return;
    }
    var atpos = to_val.indexOf("@");
    var dotpos = to_val.lastIndexOf(".");
    
    if (atpos< 1 || dotpos<atpos+2 || dotpos+2>=to_val.length) {
        alert("Not a valid e-mail address");
        document.getElementById("send_mail_field").disabled = false;
        return;
    }
    
     var option = {  
        encoding: "7-bit"
    }
    mailcomposer = new MailComposer(option);
    
	mailcomposer.setMessageOption({
		from: "me",
		to: to_val,
		subject: subject_val,
		body: body_val
	});
	
    customProgressBar.animate(0.1);
	mailcomposer.buildMessage(function(err, messageSource) {
        //TODO MESSAGE BUILD SUCCESSFULLY SHOW IN PROGESS INFO DEPENDING UPON VALUE OF ERR
        console.log(err || messageSource);
        var rawM = btoa(unescape( encodeURIComponent(messageSource)));
        console.log(rawM);
        
        customProgressBar.animate(0.5);

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
        customProgressBar.animate(.65, { 
            duration: 400
        });
        //TODO SENDING MESSAGE SHOW IN PROGESS  & HANDLE NETWORK NOT AVAILABLE ERROR
    });

}

function resetProgreesBar() {
    customProgressBar.destroy();
    customProgressBar = new ProgressBar.Line(progressBarDiv, {
        color: '#FCB03C'
    });
}

function logoff() {
//TODO IMPLEMENT REVOKE ACCESS HERE 
}