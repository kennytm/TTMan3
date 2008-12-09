/*

http.njs
Copyright (C) 2008  Kenny TM~ <kennytm@gmail.com>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

*/

// #include "blocksheet.njs"

/*

http.njs contains functions to access web content. 
calling GET will return the 3-tuple [content, status, message].

*/

// IMPORTANT: CHANGE THE PATH WHEN DEPLOYING.
var ProxyCGI = location.protocol == "file:" ? "" : location.protocol + '//' + location.host + '/~ph_cckac/cgi-bin/proxy.cgi';

// REGULAR USERS: STOP MODIFYING THE CODE BELOW.

var HTTP = location.protocol == 'https:' ? 'https://' : 'http://';

var XMLHttpObject;

if(window.XMLHttpRequest) {
	try {
		XMLHttpObject = new XMLHttpRequest();
	} catch(e) {
		XMLHttpObject = false;
	}
} else if(window.ActiveXObject) {
	try {
		XMLHttpObject = new ActiveXObject("Msxml2.XMLHTTP");
	} catch(e) {
		try {
			XMLHttpObject = new ActiveXObject("Microsoft.XMLHTTP");
		} catch(e) {
			XMLHttpObject = false;
		}
	}
}

if (!XMLHttpObject) {
	new BlockingSheet(
		'The <code>XMLHttpRequest</code> object cannot be created.',
		'<p>If you are using Internet Explorer, probably you have turned off ActiveX control. Please turn it on.<br />Otherwise, upgrade your browser to the latest version.</p>',
		'error',
		[],
		'#FFCCCC'
	).show();
}

// GET a url.
function GET (url, waitmsg, login, password) {
	if (!waitmsg)
		waitmsg = "Loading " + url + "&hellip;";
	
	var fetched = new EventNotifier();
	var mySheet = new BlockingSheet('Loading', waitmsg, 'loading.gif', [], 'white');
	
	XMLHttpObject.onreadystatechange = fetched;
	
	mySheet.show();
	
	// use this.opened instead of just opened to prevent a parsing error in NJS's compiler that causes opened can never set to true.
	this.opened = false;
	this.login = login;
	this.password = password;
	this.url = url;
		
	if (!ProxyCGI) {
		try {
			netscape.security.PrivilegeManager.enablePrivilege('UniversalBrowserRead');
		} catch(e) { }
				
		if (login) {
			try {
				XMLHttpObject.open("GET", url, true, this.login, this.password);
				XMLHttpObject.send(null);
				this.opened = true;
			} catch(e) { doNothing(); }
		} else {
			try {
				XMLHttpObject.open("GET", url, true);
				XMLHttpObject.send(null);
				this.opened = true;
			} catch (e) {}
		}
	}
	
	if (!this.opened) {
		try {
			XMLHttpObject.open("POST", ProxyCGI, true);
			XMLHttpObject.setRequestHeader("Content-Type","application/x-www-form-urlencoded; charset=utf-8");
			var postcontent = "url=" + encodeURIComponent(url);
			if (login)
				postcontent += "&login=" + encodeURIComponent(login) + "&password=" + encodeURIComponent(password);
			XMLHttpObject.send(postcontent);
		} catch (e) {
			mySheet.hide->();
			new BlockingSheet(
				'Cannot Perform <code>XMLHttpRequest</code>',
				'<p>A request to [' + url + '] is failed probably because of local security measure.</p><p>Please run this program online.</p><p>Exception caught: ' + e.message + '.</p>',
				'error',
				[],
				'#FFCCCC'
			).show(); 
			throw e;
		}
	}
	
	while (XMLHttpObject.readyState != 4) {
		fetched.wait->();
	}
	
	XMLHttpObject.onreadystatechange = null;
	
	mySheet.hide();
	
	var respcontent = "";
	var respsttext = "";
	
	try {
		return {
			content: XMLHttpObject.responseText,
			status: XMLHttpObject.status,
			message: XMLHttpObject.statusText,
			url: this.url,
			exception: null
		};
	} catch (e) {
		return {
			content: "",
			status: XMLHttpObject.status,
			message: "",
			url: this.url,
			exception: e
		};
	}
}

function authenticate (url, reason) {
	if (!reason) reason = "";
	if (!url) url = "http://";
	
	var insecure = false;
	
	if (ProxyCGI && location.protocol == "http:" || url.substr(0,5) == "http:")
		insecure = true;
		
	var html = '<p>Authentication is required to access ' + url + ' (' + reason + ').</p><div><table id="auth-table"><tr><th><label for="auth-username">Username:</label></th><td><input type="text" id="auth-username"></td></tr><tr><th><label for="auth-password">Password:</label></th><td><input type="password" id="auth-password" /></td></tr></table></div>';
	if (insecure)
		html += '<p><em>Warning: Your connection is insecure. Your password could be eavesdropped!</em></p>';
	
	var login = '', password = '';
	
	var mySheet = new BlockingSheet(
		'Authentication required',
		html,
		'password',
		[['Cancel', doNothing], null, ['Login', function(){
			login = document.getElementById('auth-username').value;
			password = document.getElementById('auth-password').value;
			return !login;
		}]],
		'#CCCCFF'
	)
	
	var hided = new EventNotifier();
	mySheet.onhide = hided;
	
	mySheet.show->();
	hided.wait->();
	
	return {login: login, password: password};
}

// show an http error from a response object
function httpError (response, altmsg, dismissable) {
	new BlockingSheet(
		'HTTP Error #' + response.status,
		altmsg || '<p>HTTP Error #' + response.status + ' (' + response.message + ') encountered while loading [' + response.url + '].</p>',
		dismissable ? 'warning' : 'error',
		dismissable ? [['Dismiss', doNothing]] : [],
		dismissable ? '#FFFFCC' : '#FFCCCC',
		dismissable
	).show();
}

//document.getElementById('A').onclick = function() { console.log(authenticate->()); }