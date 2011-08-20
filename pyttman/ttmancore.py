import common
##
##    HKUST Ultimate Timetable Constructor <Timetable Manager Core>
##    Copyright (C) 2008  KennyTM~
##
##    This program is free software: you can redistribute it and/or modify
##    it under the terms of the GNU General Public License as published by
##    the Free Software Foundation, either version 3 of the License, or
##    (at your option) any later version.
##
##    This program is distributed in the hope that it will be useful,
##    but WITHOUT ANY WARRANTY; without even the implied warranty of
##    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
##    GNU General Public License for more details.
##
##    You should have received a copy of the GNU General Public License
##    along with this program.  If not, see <http://www.gnu.org/licenses/>.
##

class TimeInterval(object):
    week = ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')
    reverseWeek = common.reverseLookup(week)
    
    def __init__(this, day, start, end):
        this.day = day
        this.start = start
        this.end = end
    
    def __repr__(this):
        return "TimeInterval(" + repr(this.day) + "," + repr(this.start) + "," + repr(this.end) + ")"
    
    def __lt__(a, b):
        return a.day < b.day or a.day == b.day and (a.start < b.start or a.start == b.start and a.end < b.end)
    
    def __eq__(a, b):
        return a.day == b.day and a.start == b.start and a.end == b.end
    
    def __hash__(this):
        return hash((this.day, this.start, this.end))
    
    def intersect(this, ts):
        return ts.day == this.day and (this.start <= ts.end and ts.start <= this.end or this.start >= ts.end and ts.start >= this.end)

    def __len__(this):
        return this.end - this.start + 1

    # i1 and i2 are two *sorted* lists of TimeIntervals
    # listIntersect will check if there are any intersections between any members of them.
    @staticmethod
    def listIntersect(i1, i2):
        # implementation now moved to common.
        return common.intersectNonemptySorted(i1, i2, lambda x,y:x.intersect(y))

    @staticmethod
    def listLen(lst):
        return sum(len(t) for t in lst)

class Subsection(object):
    def __init__(this, ssid):
        this.intervals = []
        this.course = None
        this.ssid = ssid

    def add(this, ts):
        if isinstance(ts, TimeInterval):
            this.intervals = common.appendSorted(this.intervals, ts)
        elif isinstance(ts, (list, tuple)):
            this.intervals = common.mergeSorted(this.intervals, ts)
        return this

    def intersect(this, s2):
        return TimeInterval.listIntersect(this.intervals, s2.intervals)

    def __eq__ (this, s2):
        return this.intervals == s2.intervals

    def __hash__ (this):
        return hash(this.ssid)

    def __len__(this):
        return TimeInterval.listLen(this.intervals)
    

class Section(object):
    def __init__(this, sid):
        this.intervals = []
        this.subsections = []
        this.course = None
        this.sid = sid

    def add(this, ss):
        if isinstance(ss, Subsection):
            this.subsections.append(ss)
            this.intervals = common.mergeSorted(this.intervals, ss.intervals)
        elif isinstance(ss, (list, tuple)):
            this.intervals = common.mergeSorted(this.intervals, ss)
        elif isinstance(ss, TimeInterval):
            this.intervals = common.appendSorted(this.intervals, ss)
        return this

    def intersect(this, s2):
        return TimeInterval.listIntersect(this.intervals, s2.intervals)

    def __hash__(this):
        return hash(str(this))

    def __len__(this):
        return TimeInterval.listLen(this.intervals)

    def __str__(this):
        return (this.course.code if this.course else "") + "+" + this.sid

class Course(object):
    def __init__(this, code, credit):
        this.sections = {}
        this.equivalents = {}
        this.code = code
        this.credits = credit

    def add(this, sect):
        hasEquivalent = False
        
        for (sid, s2) in this.sections.items():
            if sect.intervals == s2.intervals:
                if sid in this.equivalents:
                    this.equivalents[sid].append(sect)
                else:
                    this.equivalents[sid] = [sect]
                hasEquivalent = True
                break

        sect.course = this
        if not hasEquivalent:
            this.sections[sect.sid] = sect
            
        return this
