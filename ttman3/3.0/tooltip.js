/*
 
 tooltip.js
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

/*

tooltip.js creates advanced tooltips from title attribute.

*/

function installTooltips () {
	if (!$('tooltip')) {
		var c = document.createElement('div');
		c.id = 'tooltip';
		document.body.appendChild(c);
	}
}

var tooltipTimeout = 0;

function showTooltip(e) {
	if (tooltipTimeout)
		clearTimeout(tooltipTimeout);
	
	$('tooltip').innerHTML = this._title;
	
	var curpos = findPos(this);
	$('tooltip').style.left = (curpos[0]+this.offsetWidth-4) + 'px';
	$('tooltip').style.top = (curpos[1]+this.offsetHeight-4) + 'px';

	$('tooltip').style.visibility = 'visible';	
}

function hideTooltip () {
	tooltipTimeout = setTimeout("$('tooltip').style.visibility = 'hidden'", 100);
}

function upgradeTooltip (root) {
	var all = root.getElementsByTagName('*');
	for (var i = all.length-1; i >= 0; -- i) {
		var elem = all[i];
		
		if (elem.title) {
			elem._title = nl2br(elem.title);
			
			if (elem._title.charAt(0) != '<')
				elem._title = '<div>' + elem._title + '</div>';
			
			elem.onfocus = showTooltip;
			elem.onblur = hideTooltip;
			
			elem.title = "";
			
			elem.onmouseover = showTooltip;
			elem.onmouseout = hideTooltip;
		}
	}
}