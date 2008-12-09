/*

blocksheet.njs
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

// #include "common.njs"
// #include "color.js"

/*

blocksheet.njs creates a layer that blocks the whole screen.
This is useful when a custom model dialog or warning message is shown.

*/

// initiate all necessary environment for the blocking sheet.
function installBlockingSheet () {
	if (!$('bs-sheetcontainer')) {
		var c = document.createElement('div');
		var bo = document.createElement('div');
		c.id = 'bs-sheetcontainer';
		bo.id = 'bs-blackout';
		bo.innerHTML = '&nbsp;';
		document.body.appendChild(bo);
		document.body.appendChild(c);
	}
}

// A blocking sheet object. The "innerHTML" 
function BlockingSheet (title, innerhtml, icon, buttons, color, autodismissduration) {
	this.title = title;
	this.innerHTML = innerhtml;
	this.icon = (icon.indexOf('.') == -1) ? icon + '.png' : icon;
	this.buttons = buttons;
	this.color = getColor(color);
	this.height = 0;
	this.onhide = null;
	this.autodismissduration = autodismissduration;
	
	if (autodismissduration)
		this.innerHTML += '<p class="not-important">This message will be automatically dismissed in <span id="dismiss-countdown">' + Math.round(autodismissduration/1000) + '</span> seconds.</p>'
	
	var darker_color = darker(this.color);
	var text_color = getTextColorFromBG(this.color);
	var darker_text_color = getTextColorFromBG(darker_color);
	
	// construct the real html of the div.
	this.html = BlockingSheet.HTML.
	replace(/#COLOR#/g, this.color).
	replace(/#DARKERCOLOR#/g, darker_color).
	replace(/#TEXTCOLOR#/g, text_color).
	replace(/#DARKERTEXTCOLOR#/g, darker_text_color).
	replace(/#ICON#/g, this.icon).
	replace(/#BUTTONS#/g, BlockingSheet.buttonsToHTML(this.buttons)).
	replace(/#TITLE#/g, this.title).
	replace(/#HTML#/g, this.innerHTML);
}

// the global blocking sheet status.
// this is required because only 1 blocking sheet can be shown at a time.
// possible status: hidden, showing, doneshowing, shown, hiding.
BlockingSheet.status = "hidden";

// the timeout id for autodismiss. this need to be canceled if some previous sheets are set to autodismiss.
BlockingSheet.autodismisstimeout = 0;
BlockingSheet.autodismisscountdown = 0;

// show the blocking sheet
BlockingSheet.prototype.show = function () {
	if (BlockingSheet.autodismisstimeout) {
		clearTimeout(BlockingSheet.autodismisstimeout);
		BlockingSheet.autodismisstimeout = 0;
	}

	// wait until the previous blocking sheet is completely hidden.
	while (BlockingSheet.status == "hiding")
		sleep->(128);

	// disable all form fields if not done (except ours, which are not present yet)
	if (BlockingSheet.status == "hidden") {
		disableForms();
	} else {
		// there are already some blocking sheet buttons existing. remove them.
		var buttons = document.getElementById('bs-buttons').getElementsByTagName('input');
		for (var i = buttons.length-1; i >= 0; --i)
			buttons[i].onclick = null;
	}

	// write the new sheet.
	var $BS = document.getElementById('bs-sheetcontainer');
	
	$BS.innerHTML = this.html;
	this.height = $BS.clientHeight;
	var $BSI = document.getElementById('bs-sheet');
	
	// hook the event listeners.
	var buttons = document.getElementById('bs-buttons').getElementsByTagName('input');
	for (var i = buttons.length-1; i >= 0; --i)
		buttons[i].onclick = BlockingSheet.ButtonEventListener(this, i);
	
	// just adjust the height of the black-out area.
	BlockingSheet.ResizeEventListener();
	window.onresize = BlockingSheet.ResizeEventListener;
	
	var $BO = document.getElementById('bs-blackout');
	var THIS = this;
	
	$BO.style.display = "block";
	
	// gradually dim the scene & show the sheet.
	if (BlockingSheet.status == "hidden") {
		BlockingSheet.status = "showing";
		animate->(500, function(t) {
			$BO.style.opacity = t * 0.75;
			$BO.style.filter = "alpha(opacity=" + (t * 75) + ")";
			$BS.style.top = THIS.height * (1-t)*(t-1) + 'px';
		});
		BlockingSheet.status = "doneshowing";
	}

	if (BlockingSheet.status == "doneshowing")
		BlockingSheet.status = "shown";
	
	if (this.autodismissduration) {
		BlockingSheet.autodismisstimeout = setTimeout(buttons[buttons.length-1].onclick, this.autodismissduration);
		BlockingSheet.autodismisscountdown = setTimeout("BlockingSheet.countdown(" + Math.round(this.autodismissduration/1000-1) + ");", 1000);
	}
}

BlockingSheet.prototype.hide = function () {
	if (BlockingSheet.autodismisstimeout) {
		clearTimeout(BlockingSheet.autodismisstimeout);
		BlockingSheet.autodismisstimeout = 0;
	}
	if (BlockingSheet.autodismisscountdown) {
		clearTimeout(BlockingSheet.autodismisscountdown);
	}
	
	// wait until the blocking sheet is completely shown
	while (BlockingSheet.status == "showing")
		sleep->(128);
	
	// if the sheet is already hiding / hidden, ignore the request.
	if (BlockingSheet.status != "shown")
		return;

	BlockingSheet.status = "hiding";

	// destroy all event listeners.
	var buttons = document.getElementById('bs-buttons').getElementsByTagName('input');
	for (var i = buttons.length-1; i >= 0; --i)
		buttons[i].onclick = null;

	var $BO = document.getElementById('bs-blackout'), $BS = document.getElementById('bs-sheetcontainer');
	var THIS = this;

	// animate to hide.
	animate->(500, function(t) {
		$BO.style.opacity = (1-t) * 0.75;
		$BS.style.top = (-THIS.height * t * t) + 'px';
	});
	
	// clean up
	$BO.style.display = "none";
	$BS.innerHTML = "";
	
	enableForms();
	
	BlockingSheet.status = "hidden";
	window.onresize = null;
	
	if (this.onhide)
		this.onhide->();
}

BlockingSheet.countdown = function (secsleft) {
	$('dismiss-countdown').innerHTML = secsleft;
	BlockingSheet.autodismisscountdown = setTimeout("BlockingSheet.countdown(" + (secsleft-1) + ");", 1000);
}

BlockingSheet.buttonsToHTML = function (btnarr) {
	var res = new Array(btnarr.length);
	for (var i = res.length-1; i >= 0; --i) {
		if (btnarr[i])
			res[i] = BlockingSheet.BUTTON_HTML.replace(/#BTN#/g, btnarr[i][0]);
		else
			res[i] = '&nbsp; &nbsp; &mdash; &nbsp; &nbsp;<input type="hidden" />';
	}
	return res.join(' ');
}

BlockingSheet.ResizeEventListener = function () {
	document.getElementById('bs-blackout').style.height = (document.documentElement.clientHeight || document.body.clientHeight) + 'px';
}

BlockingSheet.ButtonEventListener = function (BSObj, index) {
	var thatfunction = BSObj.buttons[index][1];
	return function() {
		if(!thatfunction()) {		// we assume the default event listeners are nonblocking.
			BSObj.hide->();
		}
	}
}

BlockingSheet.BUTTON_HTML = '<input type="button" id="bs-btn-#BTN#" value="#BTN#" />';  
BlockingSheet.HTML = [
					  '<div id="bs-sheet" style="background-color:#COLOR#;color:#TEXTCOLOR#">',
                      '<h4 id="bs-title" style="background-color:#DARKERCOLOR#;color:#DARKERTEXTCOLOR#">#TITLE#</h4>',
					  '  <table id="bs-table">',
					  '    <tr>',
					  '      <td id="bs-icon"><img src="img/#ICON#" width="64" height="64" alt="#ICON#" /></td>',
					  '      <td id="bs-content">#HTML#</td>',
					  '    </tr>',
					  '    <tr><td></td><td id="bs-buttons">#BUTTONS#</td></tr>',
					  '  </table>',
					  '</div>'
].join('');

BlockingSheet.forceHide = BlockingSheet.prototype.hide;