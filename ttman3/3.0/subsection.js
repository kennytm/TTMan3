/*
 
 subsection.js
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
 
 subsection.js contains the class Subsection which represents a collection of
 TimeInterval's that is a recognizable changeable element in a section.
 
 (Think subsections as quarks in a hadron -- you know it exists, but you can't
  make use it alone.)
 
 */

// a subsection's ssid should be unique *within* a course.
function Subsection (ssid) {
	this.intervals = [];
	
	this.ssid = ssid;
	this.course = null;
}

Subsection.prototype.add = function (ts) {
	if (ts instanceof TimeInterval)
		this.intervals.push(ts);
	else if (ts instanceof Array)
		this.intervals = this.intervals.concat(ts);
	this.intervals.sort(TimeInterval.compare);
}

// check if the two subsections collide.
Subsection.prototype.intersect = function (s2) {
	var id0 = this.intervals.length - 1, id2 = s2.intervals.length - 1;
	
	while (id0 >= 0 && id2 >= 0) {
		if (this.intervals[id0].intersect(s2.intervals[id2]))
			return true;
		else {
			if (TimeInterval.compare(this.intervals[id0], s2.intervals[id2]) >= 0)
				-- id0;
			else
				-- id2;
		}
	}
	
	return false;
}

Subsection.prototype.equal = function (s2) {
	if (s2.intervals.length != this.intervals.length)
		return false;
	for (var i = this.intervals.length-1; i >= 0; --i) {
		if (!s2.intervals[i].equal(this.intervals[i]))
			return false;
	}
	return true;
}

Subsection.prototype.clone = function () {
	var s = new Subsection(this.ssid);
	s.course = this.course;
	s.intervals = this.intervals.clone();
}