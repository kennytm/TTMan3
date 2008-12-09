/*

hkust.njs
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

hkust.njs includes functions to read and analyze course information from
the Hong Kong University of Science & Technology

*/

//------------------------------------------------------------------------------
// Query lift info

var lifts = {};

// initialize the "lifts" assoc. array.
function initLifts () {
	var result;
	result = GET->('http://www.ust.hk/cgi-bin/itsc/roomlift/find.pl', 'Accessing Lift Selection Advisor for lift information&hellip;<br />[http://www.ust.hk/cgi-bin/itsc/roomlift/find.pl]');
	if (result.status == 200) {
		var re = /<tr>\n<td>\n([A-Z\d]+)<\/td>\n<td>\n&nbsp;&nbsp;&nbsp;&nbsp;\n([-,\d]+)<\/td>\n<\/tr>/g;
		var m;
		
		while ((m = re.exec(result.content)))
			lifts[m[1]] = m[2];
	} else
		httpError(result);
}

// append lift info. after the venue part.
function getLift (ven) {
	if (lifts[ven])		// NJS doesn't support "ven in lifts". blah.
		return ven + " (" + lifts[ven] + ")";
	else
		return ven;
}

//------------------------------------------------------------------------------ 

// An STimeInterval is a child of TimeInterval with additional information
// for course code (e.g. MATH123), subsection ID (e.g. L1) and venue (e.g. 2304)
function STimeInterval (day, start, end, iscourse, code, ssid, ven) {
	TimeInterval.call(this, day, start, end);
	this.isCourse = iscourse;
	this.code = code;
	this.ssid = ssid;
	this.venue = ven;
}

// starttime & endtime decodes start & end numbers into actual time.
STimeInterval.starttime = [];
STimeInterval.endtime = [];
for (var i = 7; i <= 22; ++ i) {
	var _hour = pad(i, 2) + ":";
	STimeInterval.starttime.push(_hour + "00", _hour + "30");
	STimeInterval.endtime.push(_hour + "20", _hour + "50");
}
STimeInterval.reverseStarttime = STimeInterval.starttime.reverseLookup();
STimeInterval.reverseEndtime = STimeInterval.endtime.reverseLookup();

// check if a time slot (0 = 07:00, etc) is outside normal period.
STimeInterval.timeIndexType = [];
for (var i = 0; i < STimeInterval.starttime.length; ++ i) {
	if (i < STimeInterval.reverseStarttime['09:00'])
		STimeInterval.timeIndexType.push(-1);
	else if (i >= STimeInterval.reverseStarttime['19:00'])
		STimeInterval.timeIndexType.push(1);
	else
		STimeInterval.timeIndexType.push(0);
}

STimeInterval.prototype = new TimeInterval;

STimeInterval.prototype.create = function (day, start, end) {
	return new STimeInterval(day, start, end, this.isCourse, this.code, this.ssid, this.venue);
}

STimeInterval.prototype.toString = function (no_arg) {
	return TimeInterval.week[this.day] + " " + STimeInterval.starttime[this.start] + "-" + STimeInterval.endtime[this.end] + 
		(no_arg ? "" : " (" + (this.isCourse ? this.code + " " + this.ssid : this.code) + ")");
}

STimeInterval.prototype.toHTML = function () {
	if (this.isCourse)
		return "<strong>" + this.code + "</strong> <em>" + this.ssid + "</em><br /><small>" + get_lift(this.venue) + "</small>";
	else
		return "<strong>" + this.code + "</strong>";
}

STimeInterval.prototype.clone = function () {
	return new STimeInterval(this.day, this.start, this.end, this.isCourse, this.code, this.ssid, this.venue);
}

//------------------------------------------------------------------------------ 
// Read a time range description and convert to a series of time intervals

function analyzeSchedule (dayrange, timerange, iscourse, code, ssid, ven) {
	if (dayrange == "TBA" || timerange == "TBA")
		return [];
		
	var res = [];
	var daysplit = dayrange.split(/,/);
	var timesplit = timerange.split(/-/);
	
	for (var i = 0; i < daysplit.length; ++ i) {
		res.push(new STimeInterval(
			TimeInterval.reverseWeek[daysplit[i]],
			STimeInterval.reverseStarttime[timesplit[0]],
			STimeInterval.reverseEndtime[timesplit[1]],
			iscourse, code, ssid, ven
		));
	}
	
	return res;
}


//------------------------------------------------------------------------------ 
// Some quota info.

function SQuota (quota, enroll, rsvd, vac) {
	this.quota = quota;
	this.enroll = enroll;
	this.reserved = rsvd;
	this.vacancy = vac;
	
	this.clone = function () {
		return new SQuota (this.quota, this.enroll, this.reserved, this.vacancy);
	}
}

function SQuotas (grp, quota, enroll, rsvd, vac, wait) {
	this.waitlist = wait;
	this.groups = {};
	this.totalQuota = 0;
	
	if (grp && grp != "Total" && grp.substr(0,4) != "   -") {
		this.groups[grp] = new SQuota(quota, enroll, rsvd, vac);
		this.totalQuota += quota;
	}
}

SQuotas.prototype.add = function (grp, quota, enroll, rsvd, vac) {
	if (grp && grp != "Total" && grp.substr(0,4) != "   -" && !this.groups[grp]) {
		this.groups[grp] = new SQuota (quota, enroll, rsvd, vac);
		this.totalQuota += quota;
	}
}

SQuotas.prototype.clone = function () {
	var q = new SQuotas ("", 0, 0, 0, 0, this.waitlist);
	for (var i in this.groups)
		q.groups[i] = this.groups[i].clone();
	q.totalQuota = this.totalQuota;
	return q;
}

SQuotas.prototype.toHTML = function () {
	var grps = [], quotas = [], enrolls = [], reserves = [], vacancies = [];
	
	for (var i in this.groups) {
		var quota = this.groups[i];
	
		grps.push(i);
		quotas.push(quota.quota);
		enrolls.push(quota.enroll);
		reserves.push(quota.reserved);
		vacancies.push(
			10*quota.vacancy < quota.quota ?
				'<span title="' + Math.round(100*quota.vacancy/quota.quota) + '% free space left!" class="not_enough_freespace">' + quota.vacancy + '&nbsp;&nbsp;</span>':
				quota.vacancy
		);
	}
	
	return "<td>" + grps.join("<br />") + "</td><td>" + quotas.join("<br />") + "</td><td>" +
			enrolls.join("<br />") + "</td><td>" + reserves.join("<br />") + "</td><td>" + vacancies.join("<br />") +
			"</td><td>" +
				(10*this.waitlist > this.totalQuota ?
					'<span title="Waitlist ' + Math.round(100*this.waitlist/this.totalQuota) + '% overloaded!" class="too_much_waitlist">' + this.waitlist + '&nbsp;&nbsp;</span>':
					this.waitlist
				) +
			"</td>";
}

//------------------------------------------------------------------------------ 
// An SSubsection is a simply a collection of quota info about the subsection.

function SSubsection (code, ssid, group, quota, enroll, resv, vac, wait, dayrange, timerange, ven, instr) {
	this.code = code;
	
	Subsection.call(this, ssid)
	
	// the following are all representational info.
	// they do not affect the decision of this program.
	this.quotas = new SQuotas(group, quota, enroll, resv, vac, wait);
	this.instructor = instr;
	
	this.remarks = "";
	
	this.add(analyzeSchedule(dayrange, timerange, true, this.code, ssid, ven));
}

SSubsection.prototype = new Subsection;

SSubsection.isMatch = function (ssid1, ssid2) {
	return ssid1.replace(/[A-Z]$/i, '') == ssid2.replace(/[A-Z]$/i, '');
}

//------------------------------------------------------------------------------ 
// The SSection inherits Section

function SSection (sid) {
	Section.call(this, sid);
}

SSection.prototype = new Section;

/*
SSection.prototype.insert = function (hsubsect) {
	this.subsections.push(hsubsect);
	
	this.intervals = this.intervals.concat(
		analyzeSchedule(hsubsect.dayrange, hsubsect.timerange, true, hsubsect.code, hsubsect.ssid, hsubsect.ven)
	);
	this.intervals.sort(TimeInterval.compare);
}
*/

//------------------------------------------------------------------------------ 
// A course vector.

function SVector (d) {
	var a = d.replace(/[^-:0-9.]/g, '').split (/[-:]/);
	this.lectures = a[0] - 0;
	this.tutorials = a[1] - 0;
	this.labs = a[2] - 0;
	this.credits = a[3] - 0;
}

SVector.prototype.toString = function () {
	return "[" + this.lectures + "-" + this.tutorials + "-" + this.labs + ":" + this.credits + "]";
}

SVector.prototype.clone = function () {
	var v = new Vector('');
	v.lectures = this.lectures;
	v.tutorials = this.tutorials;
	v.labs = this.labs;
	v.credits = this.credits;
	return v;
}

//------------------------------------------------------------------------------ 
// The SCourse inherits Course

function SCourse (courseTitle) {
	this.vector = new SVector(courseTitle[2]);

	Course.call(this, courseTitle[0], this.vector.credits);
	
	this.title = courseTitle[1];
	
	this.matchingRules = 0;
	if (courseTitle.length > 3 && courseTitle[3].indexOf('matching') != -1) {
		if (courseTitle[3].indexOf('lecture') != -1)
			this.matchingRules |= 1;
		if (courseTitle[3].indexOf('tutorial') != -1)
			this.matchingRules |= 2;
		if (courseTitle[3].indexOf('laboratory') != -1)
			this.matchingRules |= 4;
	}

	this.additionalWaitlists = {L:0,T:0,LA:0,'**':0};
		
	this.subsections = {};
	this.description = "";
}

SCourse.prototype = new Course;

SCourse.prototype.computeSections = function () {
	// extract different types of subsections
	var lectures = {}, tutorials = {}, laboratories = {}, others = {};
	
	for (var ssid in this.subsections) {
		if (ssid.substr(0,2) == 'LA')
			laboratories[ssid] = true;
		else if (ssid.charAt(0) == 'L')
			lectures[ssid] = true;
		else if (ssid.charAt(0) == 'T')
			tutorials[ssid] = true;
		else
			others[ssid] = true;
	}
	
	var l_sects = {}, lt_sects = {}, ltla_sects = {};
	
	// find all lectures
	for (var ssid in lectures) {
		l_sects[ssid] = {L:ssid, T:"", LA:"", '**':""};
	}
	
	// no lectures at all! just dump all tutorials.
	if (isEmpty(l_sects)) {
		for (var ssid in tutorials)
			lt_sects['`' + ssid] = {L:"", T:ssid, LA:"", '**':""};
	} else {
		// ensure there are tutorials to add...
		if (!isEmpty(tutorials)) {
			// if *no* matching rule against lecture & tutorial, we do Cartesian product.
			// otherwise, we filter out those which SSubsection.isMatch returns false.
			for (var lec_ssid in l_sects) {
				var sect2 = l_sects[lec_ssid];
				for (var ssid in tutorials)
					if ((3 & ~this.matchingRules) || SSubsection.isMatch(ssid, sect2.L))
						lt_sects[lec_ssid + '`' + ssid] = {L:sect2.L, T:ssid, LA:"", '**':""};
			}
		
		// if there is no tutorials, just copy the lecture sections
		} else
			for (var lec_ssid in l_sects)
				lt_sects[lec_ssid + '`'] = l_sects[lec_ssid];
	}
	
	// do the same for labs...
	if (isEmpty(lt_sects)) {
		for (var ssid in laboratories)
			ltla_sects['``' + ssid] = {L:"", T:"", LA:ssid, '**':""};
	} else {
	
		if (!isEmpty(laboratories)) {
		
			for (var tut_sid in lt_sects) {
				sect2 = lt_sects[tut_sid];
				for (var ssid in laboratories) {
					if ( ((5 & ~this.matchingRules) || SSubsection.isMatch(ssid, sect2.L)) && ((6 & ~this.matchingRules) || SSubsection.isMatch(ssid, sect2.T)) ) {
						ltla_sects[tut_sid + '`' + ssid] = {L:sect2.L, T:sect2.T, LA:ssid, '**':''};
					}
				}
			}
		
		} else
			for (var tut_sid in lt_sects)
				ltla_sects[tut_sid + '`'] = lt_sects[tut_sid];
	}
	
	// all ** subsections are by themselves. they're usually XXXX-799 courses
	for (var ssid in others)
		ltla_sects[ssid] = {L:"", T:"", LA:"", '**':ssid};
		
	// now construct & add the sections
	for (var sid in ltla_sects) {
		var sect = new SSection(sid);
		var sect2 = ltla_sects[sid];
		if (sect2.L)
			sect.add(this.subsections[sect2.L]);
		if (sect2.T)
			sect.add(this.subsections[sect2.T]);
		if (sect2.LA)
			sect.add(this.subsections[sect2.LA]);
		if (sect2['**'])
			sect.add(this.subsections[sect2['**']]);
		
		this.add(sect);
	}
}

SCourse.prototype.clone = function () {
	var c = new SCourse(this.code);
	
	// copied from Course.prototype.clone:
	// javascript can't cast to derived types :(
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
	// end copy
	
	c.title = this.title;
	c.matchingRules = this.matchingRules;
	c.descriptions = this.descriptions;
	
	for (var ssid in this.subsections[type]) {
		c.subsections[ssid] = this.subsections[ssid].clone();
		c.subsections[ssid].course = c;
	}
	
	return c;
}

//------------------------------------------------------------------------------ 
// A department.

function SDepartment (dept_code) {
	this.lastUpdate = new Date();
	this.courses = {};
	this.coursesCount = 0;
	this.deptCode = dept_code;
}

var departments = {};

//------------------------------------------------------------------------------ 
// Get all courses from department & fill into course net.

function getDepartment (refCourseNet, dept_code, $TTA) {

	dept_code = dept_code.toLowerCase();

	var url = HTTP + 'www.ab.ust.hk/wcr/intf/out/class/cr_class_' + dept_code + '.htm';
	var data = GET->(url, '<p>Querying course information from ' + dept_code.toUpperCase() + ' department.</p><p>Waiting for [' + url + ']</p>');
	
	if (data.status != 200) {
		BlockingSheet.forceHide->();
		if (data.status == 404) {
			new BlockingSheet (
				"No Such Department",
				'<p>The department ' + dept_code.toUpperCase() + ' does not exist.</p>',
				'notfound',
				[['OK', doNothing]],
				'#FFFFCC',
				5000
			).show();
		} else if (data.status == 0) {
			/*errsheet = new BlockingSheet (
				"No Such Department",
				"The department " + dept_code.toUpperCase() + ' does not exist.</p>',
				'notfound',
				[['OK', doNothing]],
				'#FFFFCC',
				4000
			);*/
			httpError(data, "<p>The A&amp;B Server [www.ab.ust.hk] is probably under daily maintenence, scheduled in 3&ndash;4am.</p>", 8000);
		}
		return;
	}
	
	getDepartment2(data, refCourseNet, dept_code, $TTA);
	
	url = 'http://www.ab.ust.hk/wcr/intf/out/class/cr_cour_' + dept_code + '.htm';
	data = GET->(url, '<p>Querying course description from ' + dept_code.toUpperCase() + ' department.</p><p>Waiting for [' + url + ']</p>');
	
	getDepartment3(data, refCourseNet, dept_code, $TTA);
	
	BlockingSheet.forceHide->();
}
	
// auxiliary functions
// (cannot be embedded into getDepartment because NJS will confuse the variable scopes)
function getDepartment2(data, refCourseNet, dept_code, $TTA) {
	var cleaned = data.content;
	
	// cleanup the source.
	
	cleaned = cleaned.replace(/<(?:script|style)[^\x00]+?<\/(?:script|style)>/gi, '');
																			// strip all scripts & styles 
	cleaned = cleaned.replace(/<\/?(?:font|img|strong|a|form|html|head|title|body|hr|div|center)[^>]*>/gi, '');
																			// strip all useless tags.
	cleaned = cleaned.replace(/<![^>]+>/gi, '');							// strip all comments & DOC-TYPES.
	cleaned = cleaned.replace(/ (?:v?align|class)=[^\s>]+/gi, '');			// strip all alignment properties and classes
	cleaned = cleaned.replace(/ nowrap/gi, '');
	cleaned = cleaned.replace(/ (?:row|col)span="1"/gi, '');				// strip useless row/colspans.
	cleaned = cleaned.replace(/<table[^>]+/gi, '<table');					// strip all table properties.
	cleaned = cleaned.replace(/(?:&nbsp;\s+)+/gi, '`');						// handle human-readable separators.
	cleaned = cleaned.replace(/\s{2,}/g, ' ');								// strip excessive spaces.
	cleaned = cleaned.replace(/(`|>)\s/g, '$1');							// strip excessive spaces.
	cleaned = cleaned.replace(/\s(`|<)/g, '$1');							// strip excessive spaces.
	cleaned = cleaned.replace(/&nbsp;/gi, '');								// nbsp's are useless now.
	cleaned = cleaned.replace(/<table><tr><td colspan="11">TBA: To be arranged<br><\/td><\/tr><\/table>/i, '');
	cleaned = cleaned.replace(/ Class Quota \/ Schedule/i, '');				// get rid of useless info.
	cleaned = cleaned.replace(/<table><tr><td><table>/i, '<table>');		// de-nest our main table.
	cleaned = cleaned.replace(/<\/table><\/td><\/tr><\/table>/i, '</table>');// de-nest our main table.
	cleaned = cleaned.replace(/<br[^>]*>/gi, "<br />\n\n");					// getText won't recognize <br/>, but \n.
	
	if (cleaned.indexOf('<table') == -1) {
		new BlockingSheet (
			"HTTP Error #" + parseInt(cleaned,10),
			"<p>Server returned the error message [" + cleaned + "].</p>",
			'error',
			[],
			'#FFCCCC'
		).show();
		return;
	}
	
	// now we have got 2 nicely stripped tables. Let's analyze them.
	$TTA.innerHTML = cleaned;

	var mainTable = $TTA.childNodes[1];
	
	// compute the last update time.
	var dept = new SDepartment(dept_code.toUpperCase());
	dept.lastUpdate = new Date(getText($TTA.firstChild.getElementsByTagName('td')[0]).match(/\d+-\w+-\d+\s\d+:\d+/)[0].replace(/-/g, ' '));
	
	// if there is some courses offered by this department, do the analysis.
	if (getText(mainTable.rows[0].cells[0]) != "No matched class found.") {
		var rowCount = mainTable.rows.length;
		
		// some course analysis variables.
		var theCourse;
		var theSubsection;
		
		// ***IsDirty = *** is being analyzed.
		var theCourseIsDirty = false;
		var theSubsectionIsDirty = false;
		
		// some variables for subsections.
		var ssSSID, /*ssType, ssNum, ssLetter,*/ ssGroup, ssQuota, ssEnroll, ssResv, ssVacancy;
		var ssWaitlist, ssDays, ssTime, ssVenue, ssInstr;
		
		for (var row = 2; row < rowCount; ++ row) {
			var thisRow = mainTable.rows[row];
			
			switch (thisRow.cells.length) {
				// header row: this row gives the course code and stuff.
				case 1: 
					if (theSubsectionIsDirty) {
						theCourse.subsections[theSubsection.ssid] = theSubsection;
					} if (theCourseIsDirty) {
						theCourse.computeSections();
						dept.courses[theCourse.code] = theCourse;
						refCourseNet.add(theCourse);
						++ dept.coursesCount;
					}
				
					theCourse = new SCourse(getText(thisRow.cells[0]).safeSplit(/`/));
					
					theCourseIsDirty = true;
					theSubsectionIsDirty = false;
					
					break;
				
				// first row of subsection.
				case 12:
					// there must be a course to contain the subsection!
					if (!theCourseIsDirty)
						throw "Error: The course is not dirty! (hkust.njs)";
					
					// there was old subsection, let's push it in.	
					if (theSubsectionIsDirty) {
						theCourse.subsections[theSubsection.ssid] = theSubsection;
					}
					
					ssSSID = getText(thisRow.cells[0]);
					if (ssSSID != '**')
						ssSSID += getText(thisRow.cells[1]); 
					else
						ssSSID = getText(thisRow.cells[1]);
					//ssType = ;
					//ssNum = parseInt(ssSSID, 10);
					//ssLetter = ssSSID.match(/[A-Z]*$/i)[0];
					ssGroup = getText(thisRow.cells[2]);
					ssQuota = getText(thisRow.cells[3]) >>> 0;
					ssEnroll = getText(thisRow.cells[4]) >>> 0;
					ssResv = getText(thisRow.cells[5]) >>> 0;
					ssVacancy = getText(thisRow.cells[6]) >>> 0;
					ssWaitlist = getText(thisRow.cells[7]) >>> 0;
					ssDays = getText(thisRow.cells[8]);
					ssTime = getText(thisRow.cells[9]);
					ssVenue = getText(thisRow.cells[10]).replace(/\s+\([-\d]+\)/, '');
					ssInstr = thisRow.cells[11].innerHTML;	// this one is for presentation only, so it's OK.
										
					theSubsection = new SSubsection(theCourse.code, ssSSID, ssGroup,
													ssQuota, ssEnroll, ssResv, ssVacancy, ssWaitlist,
													ssDays, ssTime, ssVenue, ssInstr);
					theSubsectionIsDirty = true;
					
					break;
				
				// additional details for a subsection, e.g. more student groups and/or time intervals.
				case 10:
					if (!theCourseIsDirty)
						throw "Error: The course is not dirty! (hkust.njs)";
					else if (!theSubsectionIsDirty)
						throw "Error: The subsection is not dirty! (hkust.njs)";
					
					ssGroup = getText(thisRow.cells[2]);
					ssQuota = getText(thisRow.cells[3]) >>> 0;
					ssEnroll = getText(thisRow.cells[4]) >>> 0;
					ssResv = getText(thisRow.cells[5]) >>> 0;
					ssVacancy = getText(thisRow.cells[6]) >>> 0;
					ssDays = getText(thisRow.cells[7]);
					ssTime = getText(thisRow.cells[8]);
					ssVenue = getText(thisRow.cells[9]).replace(/\s+\([-\d]+\)/, '');
					
					// more student group, add quota.
					if (ssGroup && ssGroup != "Total") {
						theSubsection.quotas.add(ssGroup, ssQuota, ssEnroll, ssResv, ssVacancy);
					}
					
					// more timeslots
					if (ssDays) {
						theSubsection.add (
							analyzeSchedule(ssDays, ssTime, true, theCourse.code, theSubsection.ssid, ssVenue)
						);
					}
					
					break;
				
				// additional waitlist summary.
				case 5:
					if (!theCourseIsDirty)
						throw "Error: The course is not dirty! (hkust.njs)";
					if (theSubsectionIsDirty)
						theCourse.subsections[theSubsection.ssid] = theSubsection;
						
					theSubsectionIsDirty = false;
					
					{
						var wlType = getText(thisRow.cells[2]);
						var wlWait = getText(thisRow.cells[3]) >>> 0;
						
						if (wlType.indexOf("Lecture") != -1)
							theCourse.additionalWaitlists.L = wlWait;
						else if (wlType.indexOf("Tutorial") != -1)
							theCourse.additionalWaitlists.T = wlWait;
						else if (wlType.indexOf("Laboratory") != -1)
							theCourse.additionalWaitlists.LA = wlWait;
					}
						
					break;
				
				// some remarks for the subsection.
				case 9:
					if (!theCourseIsDirty)
						throw "Error: The course is not dirty! (get_department_3,case=9)";
					else if (!theSubsectionIsDirty)
						throw "Error: The subsection is not dirty! (get_department_3,case=9)";
						
					theSubsection.remarks = thisRow.lastChild.lastChild.rows[0].cells[1].innerHTML.replace(/&gt;/g, '\n').replace(/<br[^>]*>/g, '').replace(/^\n+/g, '');
						
					break;
				
				// class canceled. just ignore.
				case 3:
					break;
					
				default:
					throw "Error: Case unhandled! (hkust.njs)";
			}
		}
		
		if (theSubsectionIsDirty)
			theCourse.subsections[theSubsection.ssid] = theSubsection;
		if (theCourseIsDirty) {
			theCourse.computeSections();
			dept.courses[theCourse.code] = theCourse;
			refCourseNet.add(theCourse);
			++ dept.coursesCount;
		}
	}
	
	departments[dept.deptCode] = dept;
}

function getDepartment3 (data, refCourseNet, dept_code, $TTA) {
	var dept = departments[dept_code.toUpperCase()];
	
	// clean up again.
	
	cleaned = data.content;
	
	cleaned = cleaned.replace(/<(script|style|form)[^\x00]+?<\/\1>/gi, '');
	cleaned = cleaned.replace(/<\/?(?:font|img|strong|a|link|html|head|title|body|hr|div|center|br)[^>]*>/gi, '');
																			// strip all useless tags.
	cleaned = cleaned.replace(/<![^>]+>/gi, '');							// strip all comments & DOC-TYPES.
	cleaned = cleaned.replace(/ (?:v?align|class)=[^\s>]+/gi, '');			// strip all alignment properties and classes
	cleaned = cleaned.replace(/ nowrap/gi, '');
	cleaned = cleaned.replace(/ (?:row|col)span="1"/gi, '');				// strip useless row/colspans.
	cleaned = cleaned.replace(/<table[^>]+/gi, '<table');					// strip all table properties.
	cleaned = cleaned.replace(/&nbsp;&nbsp;/gi, '`');						// handle human-readable separators.
	cleaned = cleaned.replace(/&nbsp;/gi, '');								// nbsp's are useless now.
	cleaned = cleaned.replace(/\s{2,}/g, ' ');								// strip excessive spaces.
	cleaned = cleaned.replace(/(`|>)\s/g, '$1');							// strip excessive spaces.
	cleaned = cleaned.replace(/\s(`|<)/g, '$1');							// strip excessive spaces.
	cleaned = cleaned.replace(/<td><\/td>/g, '');							// remove empty cells.
	cleaned = cleaned.replace(/<table><tr><td><table>/gi, '<table>');		// de-nest all tables.
	cleaned = cleaned.replace(/<\/table><\/td><\/tr><\/table>/gi, '</table>');// de-nest all tables.

	$TTA.innerHTML = cleaned;
	
	// extract the descriptions.
	
	var rows = $TTA.getElementsByTagName('table');
	var rowCount = rows.length-4;
	
	// the 0th (title) and last 4 ("course n/a" & "no such course") tables are useless.
	for (var row = 1; row < rowCount; row += 2) {
		var code = getText(rows[row].rows[0].cells[0]).match(/^[^`]+/)[0];
		if (dept.courses[code]) {
			dept.courses[code].description = getText(rows[row+1].rows[0].cells[0]).replace(/((?:(?:Pre|Co)requisite|Reference|Exclusion|Background)s?:)/g, '<br />&nbsp;• <em>$1</em>');
		}
	}
}

//------------------------------------------------------------------------------
// format a course code.

/*
function cc_id (s, dont_idfy, shadownets) {
	var re = /([\s\/>]|&nbsp;)([A-Z]{4})(\d{3}[A-Z]?)\/\s*(\d{3}[A-Z]?)(?=[\s,.;\/<]|&nbsp;|$)/g;
	
	while (re.test(s)) {
		s = s.replace(re, "$1$2$3/$2$4");
		re.lastIndex = 0;					// Fix for IE.
	}

	return s.replace (
		/([\s\/>]|&nbsp;)([A-Z]{4})(\d{3}[A-Z]?)(?=[\s,.;\/<]|&nbsp;|$)/g,
		dont_idfy ?
			'$1<span class="dept-redundant-plain">$2&#8209;</span><strong>$3</strong>' : 
			function (s, before, dept, num) {
				var code = dept + num;
				if (!departments[dept] || !departments[dept].courses[code])
					return before + '<span class="dept-redundant">' + dept + '&#8209;</span><strong>' + num + '</strong>';
				else
					return before + '<span title="' + courses[code].title + '" class="cc-id" onclick="goToCourse(\'' + code + '\');">' +
					shadownets(
						courses[code].equivalent_timeslots,
						'<span class="dept_redundant">' + dept + '&#8209;</span><strong>' + num + '</strong>',
						code,
						null
					) + '</span>';

			}
	);
	// '$1<span class="cc_id" onclick="go_to_course(\'$2$3\');"><span class="dept_redundant">$2</span>&nbsp;<strong>$3</strong></span>'
}

function cc_idfy (s, before, dept, num) {
	}

function cc_id_plain (s, before, dept, num) {
	return before + '<span class="dept-redundant-plain">' + dept + '&#8209;</span><strong>' + num + '</strong>';
}

function go_to_course (code) {
	if (isTBMode)
		switch_mode();
	
	$CC.value = $CC.oldValue = code;
		
	prepare_course_1(code);
}

*/