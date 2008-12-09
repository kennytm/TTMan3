/*
 
 coursenet.js
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
// #include "course.js"

/*
 
 coursenet.js contains the class CourseNetwork which is a network where nodes
 are Section's and edges indicate compatible time.
 
 the main task is to find the independent sets, which are just a complete timetable.
 
 */

function CourseNetwork (shadow) {
	this.sections = {};
	this.adjlist = {};
	
	// these courses do not occupy time.
	this.alwaysOKSections = {};
	
	// a shadow is a supernet that contains all possible linkage already.
	this.shadow = shadow;
	
	this.size = 0;
	this.courses = {};
}

CourseNetwork.prototype.add = function (course) {
	
	if (this.shadow) {
		
		// copy links from shadow
		for (var s2 in course.sections) {
			var h2 = course.sections[s2].hash();
			
			if (h2 in this.shadow.alwaysOKSections) {
				this.alwaysOKSections[h2] = this.shadow.alwaysOKSections[s2];
				continue;
			}
			
			++ this.size;
			
			this.sections[h2] = course.sections[s2];
			this.adjlist[h2] = {};
			for (var h1 in this.shadow.adjlist[h2]) {
				if (h1 in this.sections) {
					this.adjlist[h2][h1] = true;
					this.adjlist[h1][h2] = true;
				}
			}
			
			
		}
		
	} else {
	
		// build up the links for every section.
		for (var s2 in course.sections) {
			var h2 = course.sections[s2].hash();
			
			if (course.sections[s2].intervals.length == 0) {
				this.alwaysOKSections[h2] = course.sections[s2];
				continue;
			}
			
			++ this.size;
			
			this.adjlist[h2] = {};
			
			for (var h1 in this.sections) {
				if (this.sections[h1].intersect(course.sections[s2])) {
					this.adjlist[h1][h2] = true;
					this.adjlist[h2][h1] = true;
				}
			}
			
			this.sections[h2] = course.sections[s2];
			
			// connect to courses itself as well!
			for (var s3 in course.sections) {
				if (s3 != s2) {
					var h3 = course.sections[s3].hash();
					this.adjlist[h2][h3] = true;
				}
			}
		}
	}
	
	this.courses[course.code] = course;
}

CourseNetwork.prototype.remove = function (course_instr) {
	// remove node which the hash contains the string [course_instr].
	for (var s2 in this.sections)
		if (s2.indexOf(course_instr) != -1) {
			-- this.size;
			delete this.courses[this.sections[s2].course.code];
			delete this.sections[s2];
		}
	
	for (var s3 in this.alwaysOKSections)
		if (s3.indexOf(course_instr) != -1) {
			delete this.courses[this.alwaysOKSections[s3].course.code];
			delete this.alwaysOKSections[s3];
		}
	
	for (var fr in this.adjlist) {
		if (fr.indexOf(course_instr) != -1) {
			// remove adjlist element pointing to the node to be removed.
			for (var to in this.adjlist[fr])
				delete this.adjlist[to][fr];
			// remove the adjlist entry itself.
			delete this.adjlist[fr];
		}
	}
}

CourseNetwork.prototype.maxIndepSets = function (required_courses_2) {
	// find all independent sets from the coursenet,
	// with "required_courses" (an array of Course's)
	// being courses that can must be included.
	
	var required_courses = required_courses_2.shallowClone();
	
	var least_size = required_courses.length;
	
	var result = [];
	
	// remove those required courses which are always ok.
	for (var i = required_courses_2.length-1; i >= 0; -- i) {
		for (var s3 in this.alwaysOKSections) {
			if (this.alwaysOKSections[s3].course == required_courses_2[i]) {
				required_courses.splice(i,1);
				break;
			}
		}
	}
	
	
	
	return result.concat(current_cliques);
}

CourseNetwork.prototype.clone = function () {
	
}


// support function for .cliques(): find neighbors that
// connect to *all* nodes (which should be a clique) at input (an assoc array)
/*
CourseNetwork.prototype.fullneighbors = function (nodes) {
	var res = {};
	var initialized = false;
	
	for (var h2 in nodes) {
		if (!initialized) {
			// initialize the possible candidates.
			for (var h1 in this.adjlist[h2]) {
				if (!(h1 in nodes))
					res[h1] = true;
			}
			initialized = true;
		} else {
			// remove those neighbors that is not fully connected.
			for (var h1 in res) {
				if (!(h1 in this.adjlist[h2]))
					delete res[h1];
			}
		}
		
		if (isEmpty(res))
			return [];
	}
	
	return keys(res).sort();
}
*/

//------------------------------------------------------------------------------
// A course network that handles independent sets automatically.

function CourseNetworkWIS (shadow) {
	CourseNetwork.call(this, shadow);
	
	// this records all indep sets spanning over all courses.
	this.indepSets = [];
}

CourseNetworkWIS.prototype = new CourseNetwork;

CourseNetworkWIS.prototype.add = function (course) {
	var isFirstCourse = isEmpty(this.courses);
	
	CourseNetwork.prototype.add.call(this, course);
	this.addToIndepSet(course, isFirstCourse);
}

CourseNetworkWIS.prototype.addToIndepSet = function (course, isFirstCourse) {
	var newIndepSets = [];
	
	if (isFirstCourse) {
		
		for (var s2 in course.sections) {
			var h2 = course.sections[s2].hash();
			var newIndepSet = {};
			newIndepSet[h2] = true;
			this.indepSets.push(newIndepSet);
		}
		
	} else {
		
		for (var s2 in course.sections) {
			var h2 = course.sections[s2].hash();
							
			// if always OK, no need to check it forms an indep set with the old ones.
			if (h2 in this.alwaysOKSections) {

				for (var i = this.indepSets.length-1; i >= 0; -- i) {
					var newIndepSet = shallowClone(this.indepSets[i]);
					newIndepSet[h2] = true;
					newIndepSets.push(newIndepSet);
				}
				
			} else {
			// if not, compare with each set.
				var myAdj = this.adjlist[h2];
							
			outer:
				for (var i = this.indepSets.length-1; i >= 0; -- i) {
					var oldIndepSet = this.indepSets[i];
					for (var j in oldIndepSet) {
						if (myAdj[j])
							continue outer;
					}
					var newIndepSet = shallowClone(oldIndepSet);
					newIndepSet[h2] = true;
					newIndepSets.push(newIndepSet);
				}
			}
		}
	}
	
	this.indepSets = newIndepSets;
}

CourseNetworkWIS.prototype.remove = function (course_instr) {
	CourseNetwork.prototype.remove.call(this, course_instr);
	
	// we need to recompute all indep sets.
	var isFirstCourse = true;
	for (var code in this.courses) {
		this.addToIndepSet(this.courses[code], isFirstCourse);
		isFirstCourse = false;
	}
}

CourseNetworkWIS.prototype.clone = function () {
	var superclone = CourseNetwork.prototype.clone.call(this);
	var copy = new CourseNetworkWIS();
	shallowCloneTo(copy, superclone);
	
	copy.indepSets = this.indepSets.clone();
	
	return copy;
}


CourseNetwork.prototype.maximalCliques = function () {
	var max = 0;
	var found;
	
	var G = keys(this.sections);
	var reverseLookup = G.reverseLookup();
	
	var SUN = new Array(this.size);
	SUN[0] = G;
	for (var i = 1; i < this.size; ++ i) {
		SUN[i] = SUN[i-1].shallowClone();
		delete SUN[i][i-1];
	}
	
	var N = new Array(this.size);
	for (var sid in this.adjlist) {
		N[reverseLookup[sid]] = composeKeys(reverseLookup, this.adjlist[sid]);
	}
	
	for (var i = 1; i < this.size; ++ i)
		unionTo(SUN[i], N[i]);
	
	var c = new Array(this.size);

	function clique(U, size) {
		if (U.isEmpty()) {
			if (size > max) {
				max = size;
				found = true;
			}
		}
	}
	
	for (var i = this.size-1; i >= 0; -- i) {
		found = false;
		clique(SUN[i], 1);
		c[i] = max;
	}
}

/*
// construct the maximal cliques ("ultimate timetables") from all nodes (courses)
CourseNetwork.prototype.maximalCliques = function () {
	// find all cliques from the coursenet,
	// with "required_courses" (an array of Course's)
	// being courses that can must be included.
		
	var result = [];
	
	// a list of assoc. array of nodes, which each element of the list
	// contains all the cliques.
	var current_cliques = [];
	for (var h in this.sections) {
		var obj = {};
		obj[h] = true;
		current_cliques.push(obj);
	}
	
	var res = [];
	
	// i is the size of clique we're currently dealing with.
	while (true) {
		// expand the clique size.
		var new_cliques = [];
		
		for (var j = current_cliques.length-1; j >= 0; -- j) {
			// collect all full neighbors.
			var fullneis = this.fullneighbors(current_cliques[j]);
			
			if (fullneis.length == 0) {
				//res.pushIfUnique(current_cliques[j], keysEqual);
				res.push(current_cliques[j]);
				continue;
			}
			
			var newobj;
			for (var k = fullneis.length-1; k >= 0; --k) {
				newobj = shallowClone(current_cliques[j]);
				newobj[fullneis[k]] = true;
				new_cliques.pushIfUnique(newobj, keysEqual);
			}
		}
		
		if (new_cliques.length == 0)
			break;
		current_cliques = new_cliques;
	}
	
	return res;
}
*/
 
/*
CourseNetwork.prototype.collide = function (course) {
	for (var i = course.sections.
}

CourseNetwork.testCollision = function (cnarr, course) {
	for (var i = cnarr.length-1; i >= 0; --i) {
		var cn = cnarr[i];
	}
}*/