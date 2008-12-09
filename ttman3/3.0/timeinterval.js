/*
 
 timeinterval.js
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
 
 timeinterval.js contains the class TimeInterval which represents a continuous
 time interval for a single class.
 
 */


// day: 0 = Mon, 1 = Tue, ... 6 = Sun
// from: a number representing the start timeslot
// to: the end timeslot.
// the interval is [from, to] (inclusive).
function TimeInterval (day, start, end) {
	this.day = day;
	this.start = start;
	this.end = end;	
}

TimeInterval.prototype.create = function (day, start, end) {
	return new TimeInterval(day, start, end);
}

TimeInterval.prototype.intersect = function (ts) {
	return (ts.day == this.day) && (this.start <= ts.end && ts.start <= this.end || this.start >= ts.end && ts.start >= this.end);
}

TimeInterval.prototype.equal = function (ts) {
	return ts.day == this.day && ts.start == this.start && ts.end == this.end;
}

TimeInterval.prototype.clone = function () {
	return new TimeInterval (this.day, this.start, this.end);
}

TimeInterval.prototype.cut_away = function (ts) {
	if (ts.day == this.day) {
		if (ts.start <= this.start) {
			if (ts.end >= this.end)
				return [];
			else if (ts.end >= this.start)
				// use this.create instead of new TimeInterval to retain possible extra info in child classes.
				return [this.create(this.day, ts.end+1, this.end)];
			else
				return [this];
		} else if (ts.end >= this.end) {
			if (ts.start > this.end)
				return [this];
			else
				return [this.create(this.day, this.start, ts.start-1)];
		} else {	// ts.start > this.start && ts.end < this.end
			return [this.create(this.day, this.start, ts.start-1), this.create(this.day, ts.end+1, this.end)];
		}
	} else
		return [this];
}


TimeInterval.compare = function (a, b) {
	return a.day - b.day || a.start - b.start || a.end - b.end;
}


// just a convenient array to convert "day" numbers to weekdays.
TimeInterval.week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
TimeInterval.reverseWeek = TimeInterval.week.reverseLookup();
