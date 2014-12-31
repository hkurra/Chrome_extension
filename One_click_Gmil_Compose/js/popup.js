var contacts = [];
var sendXHRReq;
var MailComposer;
var accessToken;
var customProgressBar;
var progressBarDiv;
var detachedLoginButton = null;
var storageKeyArr = ["profilePic", "profileName", "contactsArr"];
var restApiBaseURL = 'https://www.googleapis.com/';
var clientKeyQuery = '?key={140036326041-l2mt34sna0ugvbivqdb0r2kenv9teedh.apps.googleusercontent.com}';

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById("login_btn")
          .addEventListener("click", login, false);
	document.getElementById("send")
          .addEventListener("click", sendMail, false);
    
    /*document.getElementById("maximize")
          .addEventListener("click", contacts, false);*/
      
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
                var contactList = result.contactsArr;
                
                console.log(imgUrl);
                if (imgUrl == 'undefined' || imgUrl == null) {
                    console.log(imgUrl);
                    //login();
                    return;
                }
                if (contactList == null || contactList.length == 0) {
                    getContacts(accessToken, function(newContacts) {
                        for (var j = 0; j < newContacts.length; j++){
                            contacts.push(newContacts[j]);
                        }
                    });
                }
                
                //I dont know why copy & deep copy using slice not working thts why i have to manually deep copy 
                for (var j = 0; j < contactList.length; j++){
                    contacts.push(contactList[j]);
                }
                //document.getElementById("login_btn").remove();
                
               detachedLoginButton =  $( "#login_btn" ).detach();
                addLoginElement(imgUrl, profileNameTxt);
            });
		}
	});
}
                                     
function addLoginElement(profilePicImage, profileName) {
     
    //TO DO check elemnt are there before adding 
    var loginAreadiv = document.getElementById("login_area");
    var profileImgElm = document.createElement('img');

    profileImgElm.setAttribute('src', profilePicImage);
    profileImgElm.setAttribute('id', 'profile_Pic_Image');
    loginAreadiv.appendChild(profileImgElm);

    var pofileNameElm = document.createTextNode(profileName);
    
    loginAreadiv.appendChild(pofileNameElm);
}
          
function login() {

    customProgressBar.animate(.2);
    chrome.identity.getAuthToken({ 'interactive': true }, function(token) {

        //TODO start some progrees indication in UI
        if(token == 'undefined' || token == null) {
            console.log('fail to login please contact vendor or check your internet connection');
            //TODO show alert here
            completeProgressBarWithColor('#FB0612');
            return;
        }
        
        customProgressBar.animate(.3);
        
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
                
                completeProgressBarWithColor('#47F558');
            }
            
             else if (xhr.status === 401) {
                handleUnauthorizedResponse(accessToken, true);
                completeProgressBarWithColor('#FB0612');
            }
        }; 

        xhr.onerror = function() {
            //TODO show alert 
            completeProgressBarWithColor('#FB0612');
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
                
                customProgressBar.animate(.7);
                var imageUrl = jsonResponse.image.url;
                console.log(imageUrl);
                //document.getElementById("login_btn").remove();
                detachedLoginButton = $( "#login_btn" ).detach();
                
                var serilizeValue = {'profilePic': imageUrl, 'profileName': name };
                chrome.storage.local.set(serilizeValue, function() {
                    console.log('store content '+chrome.runtime.lastError );
                });
                //TODO END PROGRESS INDICATION HERE
                getContacts(accessToken, function(newContacts) {
                        for (var j = 0; j < newContacts.length; j++) {
                            contacts.push(newContacts[j]);
                        }
                });
                addLoginElement(imageUrl, name);
                completeProgressBarWithColor('#47F558');
          }
            else if (xhrp.status === 401) {
            }
        }; 

        xhrp.onerror = function() {
            console.log('err');
            completeProgressBarWithColor('#FB0612');
        }
        xhrp.send();
        customProgressBar.animate(.5);
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
    
    else if (sendReq.readyState == 4 && this.status === 401) {
          // This status may indicate that the cached
          // access token was invalid. Retry once with
          // a fresh token.
        handleUnauthorizedResponse(accessToken, false);
        }
    else if(sendReq.status != 200) {
		
        //TODO SHOW eRROR SENDING MESSAGE IN UI OR PROGRESS INFO
        //if message is invalid credential than revoke access immediatly 
		var textResponse = sendReq.responseText;  
        
        if (textResponse != null && textResponse != "") {
            var jsonResponse = JSON.parse(textResponse);
            console.log(jsonResponse);
        }
    }
    
    document.getElementById("send_mail_field").disabled = false;
    customProgressBar.animate(1, { 
        duration: progressDuration,
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
        //html: body_val
	});
	
    customProgressBar.animate(0.1);
	mailcomposer.buildMessage(function(err, messageSource) {
        //TODO MESSAGE BUILD SUCCESSFULLY SHOW IN PROGESS INFO DEPENDING UPON VALUE OF ERR
        console.log(err || messageSource);
        var rawM = btoa(unescape(encodeURIComponent(messageSource)));
        console.log('before url safe'+rawM);
        //to make url safe base64 encoding
        rawM = rawM.replace(/\+/g, '-').replace(/\//g, '_');
        console.log('after url safe'+rawM);
        
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

      
$(function() {
    function split( val ) {
      return val.split( /,\s*/ );
    }
    function extractLast( term ) {
      return split( term ).pop();
    }
    
    $( "#id_to" ).bind( "keydown", function( event ) {
        if ( event.keyCode === $.ui.keyCode.TAB &&
            $( "#id_to" ).autocomplete( "instance" ).menu.active ) {
          event.preventDefault();
        }
      }).autocomplete({
        source: function( request, response ) {
          // delegate back to autocomplete, but extract the last term
          response( $.ui.autocomplete.filter(
            contacts, extractLast( request.term ) ) );
        },
        focus: function() {
              // prevent value inserted on focus
         return false;
        },
        select: function( event, ui ) {
          var terms = split( this.value );
          // remove the current input
          terms.pop();
          // add the selected item
          terms.push( ui.item.value );
          // add placeholder to get the comma-and-space at the end
          terms.push( "" );
          this.value = terms.join( ", " );
          return false;
        }
    });
  });

function completeProgressBarWithColor(color) {
    
    customProgressBar.animate(1, { 
        duration: 2000,
        from: { color: '#FCB03C' },
        to: { color: color },
        step: function(state, line) {
            line.path.setAttribute('stroke', state.color);
        }
    }, function() {
            console.log('Animation has finished');
            resetProgreesBar();
        });
}

function handleUnauthorizedResponse(problamaticToken, doLogin) {
    
    if (doLogin) {
        chrome.identity.removeCachedAuthToken (
            { token: problamaticToken },
            login);
    }
    
    else {
        logoff(false, problamaticToken);
    }
}

function logoff(doOnServer, tokenToRevoke) {
    
    chrome.identity.removeCachedAuthToken (
    { token: tokenToRevoke },
        function () {
            $("#login_area").empty();
            if (detachedLoginButton != null) {
                detachedLoginButton.appendTo($("#login_area"));
            }
            if (doOnServer) {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', 'https://accounts.google.com/o/oauth2/revoke?token=' +
                       tokenToRevoke);
                xhr.send();
            }
        }
    );  
}