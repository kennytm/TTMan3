/*

hkust-events.njs
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

// #include "http.njs"
// #include "blocksheet.js"
// #include "course.js"

/*

hkust-events.njs includes event handlers for HKUST.

*/

//------------------------------------------------------------------------------

// onload.

initLifts();

// checkbox manipulators.

$('select-all-sections').onclick = function clear_sections(e) {
	var inputs = $('preferred-sections-table').getElementsByTagName('input');
	for (var i = inputs.length-1; i >= 0; --i)
		inputs[i].checked = true;
}

$('toggle-preferred-sections').onclick = function (e) {
	var inputs = $('preferred-sections-table').getElementsByTagName('input');
	for (var i = inputs.length-1; i >= 0; --i)
		inputs[i].checked = !inputs[i].checked;
}

$('clear-all-sections').onclick = function clear_sections(e) {
	var inputs = $('preferred-sections-table').getElementsByTagName('input');
	for (var i = inputs.length-1; i >= 0; --i)
		inputs[i].checked = false;
}

// mode switching

var TBSRC = "";
var isTBMode = false;
{
	TBSRC = '<tr><th>Days:</th><td><input id="tb:w0" type="checkbox" /></td><td><label for="tb:w0">Monday</label></td></tr>';
	TBSRC += '<tr><td></td><td><input id="tb:w1" type="checkbox" /></td><td><label for="tb:w1">Tuesday</label></td></tr>';
	TBSRC += '<tr><td></td><td><input id="tb:w2" type="checkbox" /></td><td><label for="tb:w2">Wednesday</label></td></tr>';
	TBSRC += '<tr><td></td><td><input id="tb:w3" type="checkbox" /></td><td><label for="tb:w3">Thursday</label></td></tr>';
	TBSRC += '<tr><td></td><td><input id="tb:w4" type="checkbox" /></td><td><label for="tb:w4">Friday</label></td></tr>';
	TBSRC += '<tr><td></td><td><input id="tb:w5" type="checkbox" /></td><td><label for="tb:w5">Saturday</label></td></tr>';
	TBSRC += '<tr><td></td><td><input id="tb:w6" type="checkbox" /></td><td><label for="tb:w6">Sunday</label></td></tr>';

	TBSRC += '<tr><th>Begin:</th><td colspan="2"><select id="tb:begin">';
	for (var i = 0; i < STimeInterval.starttime.length; ++ i) {
		var classes = "";
		if (!(i & 1))
			classes += "hours ";
		if (STimeInterval.timeIndexType[i])
			classes += "ext-time";
		if (classes)
			classes = 'class="' + classes + '"';
		
		if (STimeInterval.starttime[i] == '12:00')
			TBSRC += '<option ' + classes + ' selected="selected">12:00</option>';
		else
			TBSRC += '<option ' + classes + '>' + STimeInterval.starttime[i] + '</option>';
	}
	TBSRC += '</select></td></tr>';
	TBSRC += '<tr><th>End:</th><td colspan="2"><select id="tb:end">';
	
	for (var i = 0; i < STimeInterval.endtime.length; ++ i) {
		var classes = "";
		if (i & 1)
			classes += "hours ";
		if (STimeInterval.timeIndexType[i])
			classes += "ext-time";
		if (classes)
			classes = 'class="' + classes + '"';
	
			if (STimeInterval.endtime[i] == '12:50')
			TBSRC += '<option ' + classes + ' selected="selected">12:50</option>';
		else
			TBSRC += '<option ' + classes + '>' + STimeInterval.endtime[i] + '</option>';
	}
	TBSRC += '</select></td></tr>';
}

function switchMode () {
	isTBMode = !isTBMode;

	$('mode-label').innerHTML = isTBMode ? 'Title:' : 'Course:';
	$('switch-mode-button')._title = isTBMode ? 'Switch to Course mode' : 'Switch to Custom events mode';
	$('confirm-cc').disabled = isTBMode;
	$('required-type').disabled = isTBMode;
	$('required-type').selectedIndex = 0;
		
	if (isTBMode) {
		setInnerHTML($('preferred-sections-table'), TBSRC);
	} else {
		clearTable($('preferred-sections-table'));
	}
	
	$('preferred-sections-table').style.fontSize = '1em';
	
	
	$('switch-mode-button').src = isTBMode ? 'icons/switch-courses.png' : 'icons/switch-custom.png';
}

$('switch-mode-button').onclick = switchMode();

// get detail of a course

$('confirm-cc').onclick = function () {
	//var code = 
}
