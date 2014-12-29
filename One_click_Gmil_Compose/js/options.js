
var accessToken = null;

document.addEventListener('DOMContentLoaded', function () {
    
    chrome.identity.getAuthToken({ 'interactive': false }, function(token) {
        if( token == 'undefined' || token == null) {
			document.getElementById("logoff_btn").disabled = true;
		}
		else { 
            accessToken = token;
            
             document.getElementById("logoff_btn")
          .addEventListener("click", serverLogOff, false);
        }
    });
});

function serverLogOff() {

chrome.identity.removeCachedAuthToken (
    { token: accessToken },
        function () {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', 'https://accounts.google.com/o/oauth2/revoke?token=' +
                   accessToken);
            xhr.send();
            xhr.onreadystatechange = function () {
                
                if(xhr.readyState == 4 && xhr.status == 200) {
                    document.getElementById("logoff_btn").disabled = true;
                    alert('Done');
                }
                
                else if (xhr.readyState == 4 && xhr.status === 400) {
                    document.getElementById("logoff_btn").disabled = true;
                    alert('Already revoked from server');
                }
            }
        }
    ); 
}