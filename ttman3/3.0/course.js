/*
 
 course.js
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

// #include "section.js"

/*
 
 course.js contains the class Course which represents a collection of
 Section's, i.e. a course.
 
 */

function Course (code, credits) {
	this.sections = {};
	this.equivalents = {};
	
	this.code = code;
	this.credits = credits;
}

Course.prototype.add = function (sect) {
	// search for an existing section.
	// if sect has the same time arrangement, we can just create an equivalent class,
	// and don't waste time to enlarge the course net.
	
	var hasEquivalent = false;
	
	
	for (var sid in this.sections) {
		if (sect.equal(this.sections[sid])) {
			if (sid in this.equivalents)
				this.equivalents[sid].push(sect);
			else
				this.equivalents[sid] = [sect];
			hasEquivalent = true;
			break;
		}
	}
	
	sect.course = this;
	if (!hasEquivalent)
		this.sections[sect.sid] = sect;
}

Course.prototype.clone = function () {
	var c = new Course(this.code);
	for (var sid in this.sections) {
		c.sections[sid] = this.sections[sid].clone();
		c.sections[sid].course = c;
	}
	for (var sid in this.equivalents) {
		c.equivalents[sid] = [];
		for (var i = this.equivalents[sid].length-1; i >= 0; --i) {
			c.equivalents[sid].push(this.equivalents[sid].clone());
			c.equivalents[sid][c.equivalents[sid].length-1].course = c;
		}
	}
}