/*
 
 section.js
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

// #include "subsection.js"

/*
 
 section.js contains the class Section which represents a collection of
 TimeInterval's, i.e. a course section.
 
 */

// sid: the section ID which is unique _within_ the course.
function Section (sid) {
	this.intervals = [];
	
	this.subsections = [];
	
	this.sid = sid;
	this.course = null;
}

Section.prototype.add = function (ss) {
	if (ss instanceof Subsection) {
		this.subsections.push(ss);
		this.intervals = this.intervals.concat(ss.intervals);
	} else if (ss instanceof Array) {
		this.intervals = this.intervals.concat(ss);
	} else if (ss instanceof TimeInterval) {
		this.intervals.push(ss);
	}
	this.intervals.sort(TimeInterval.compare);
}

// check if the two sections collide.
Section.prototype.intersect = function (s2) {
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

Section.prototype.equal = function (s2) {
	if (s2.intervals.length != this.intervals.length)
		return false;
	for (var i = this.intervals.length-1; i >= 0; --i) {
		if (!s2.intervals[i].equal(this.intervals[i]))
			return false;
	}
	return true;
}

Section.prototype.clone = function () {
	var s = new Section(this.sid);
	s.course = this.course;
	s.intervals = this.intervals.clone();
	s.subsections = this.subsections.clone();
}

Section.prototype.hash = function () {
	return (this.course ? this.course.code : "") + "+" + this.sid;
}