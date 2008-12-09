/*

common2.njs
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

common2.njs contains common functions that require NJS.
*/

// animation
// perform functor(t) for "time" milliseconds, where t = 0 to 1.

function animate (time, functor) {
	var d = new Date();
	while (true) {
		var dt = new Date() - d;
		if (dt >= time) {
			functor(1);
			return;
		}
		functor(dt / time);
		sleep->(45);
	}
}