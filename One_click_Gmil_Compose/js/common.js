function getContacts(accessToken, callBack) {
    var contactsRestUrl = 'https://www.google.com/m8/feeds/contacts/default/full?max-results=10000';
    
    var sendContReq = new XMLHttpRequest();
        
    sendContReq.open("GET", contactsRestUrl, true);
    sendContReq.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        
    sendContReq.onreadystatechange  = function () {
        
        if (sendContReq.status === 200 && sendContReq.readyState === 4) {
            var textResponse = sendContReq.responseText; 

            console.log(textResponse);
            
            var newContacts = [];
            var parser = new DOMParser();
            xmlDoc = parser.parseFromString(textResponse, "text/xml");
            var entries = xmlDoc.getElementsByTagName('feed')[0].getElementsByTagName('entry');
            for (var i = 0; i < entries.length; i++){
                var name = entries[i].getElementsByTagName('title')[0].innerHTML;
                var emails = entries[i].getElementsByTagName('email');
                for (var j = 0; j < emails.length; j++){
                    var email = emails[j].attributes.getNamedItem('address').value;
                    //contacts.push({name: name, email: email});
                    if(email != null) {
                        newContacts.push(email);
                    }
                }
            }
            var serilizeContacts =  {'contactsArr' : newContacts}
            chrome.storage.local.set(serilizeContacts, function() {
                    console.log('store content '+chrome.runtime.lastError );
                if (typeof callBack === "function") {
                    callBack(newContacts);
                }
            });
        }
    };

    sendContReq.onerror = function() {
         var textResponse = sendContReq.responseText;  

        console.log(textResponse);
    };
        
    sendContReq.send();
}