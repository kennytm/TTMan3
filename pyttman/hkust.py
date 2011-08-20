##
##    HKUST Ultimate Timetable Constructor <Specialization for HKUST>
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

from ttmancore import *
from IProgressStack import IProgressStack
from RCourseNetwork import RCourseNetwork
try:
    from urllib.request import urlopen
    from urllib.error import URLError, HTTPError
except ImportError:
    from urllib2 import urlopen, URLError, HTTPError
import re
from common import xrange
import sys

##class SLifts(dict):
##    def initialize (lifts):
##        result = urllib2.urlopen('http://www.ust.hk/cgi-bin/itsc/roomlift/find.pl')
##        rx = re.compile(r"<tr>\n<td>\n([A-Z\d]+)<\/td>\n<td>\n&nbsp;&nbsp;&nbsp;&nbsp;\n([-,\d]+)</td>\n</tr>")
##        for m in rx.findall(result.read()):
##            lifts[m[0]] = m[1]
##            
##    def getLift (lifts, ven):
##        if ven in lifts:
##            return ven + " (" + lifts[ven] + ")"
##        else:
##            return ven

class STimeInterval (TimeInterval):
    starttime = tuple('%02d:%s' % (i, j) for i in xrange(7,23) for j in ('00', '30'))
    endtime = tuple('%02d:%s' % (i, j) for i in xrange(7,23) for j in ('20', '50'))
    reverseStarttime = common.reverseLookup(starttime)
    reverseEndtime = common.reverseLookup(endtime)

    # check if a time slot (0 = 07:00, etc) is outside normal period
    # so unpythonic <g>
    timeIndexType = tuple((-1 if x<'09:00' else 1 if x>='19:00' else 0) for x in starttime)
    
    def __init__(this, day, start, end, code, ssid, ven):
        TimeInterval.__init__(this, day, start, end)
        this.code = code
        this.ssid = ssid
        this.venue = ven

    def strNoArg(this):
        return TimeInterval.week[this.day] + " " + STimeInterval.starttime[this.start] + "-" + STimeInterval.endtime[this.end]

    def __str__(this):
        return this.strNoArg() + " (" + this.code + " " + this.ssid + ")"

    @staticmethod
    def analyzeSchedule (dayrange, timerange, code, ssid, ven):
        if dayrange == "TBA" or timerange == "TBA":
            return []
        
        (start, end) = timerange.split("-")
        start = STimeInterval.reverseStarttime[start]
        end = STimeInterval.reverseEndtime[end]
        
        return [STimeInterval(TimeInterval.reverseWeek[day], start, end, code, ssid, ven) for day in dayrange.split(",")]

        
class SSubsection(Subsection):
    def __init__(this, code, ssid, dayrange, timerange, ven):
        this.code = code
        Subsection.__init__(this, ssid)
        this.add(STimeInterval.analyzeSchedule(dayrange, timerange, code, ssid, ven))

    @staticmethod
    def isMatch (ssid1, ssid2):
        letters = re.compile(r"[a-zA-Z]")
        return letters.sub('', ssid1) == letters.sub('', ssid2)


class SSection(Section):
    def __init__(this, sid):
        Section.__init__(this, sid)


class SCourse(Course):
    def __init__(this, courseTitle):
        credit = float(re.compile(r":([\.\d]+)\]").findall(courseTitle[2])[0])
        Course.__init__(this, courseTitle[0], credit)
        this.title = courseTitle[1]

        this.matchingRules = 0
        if len(courseTitle) > 3 and courseTitle[3].find('matching') != -1:
            if courseTitle[3].find('lecture') != -1:
                this.matchingRules |= 1
            if courseTitle[3].find('tutorial') != -1:
                this.matchingRules |= 2
            if courseTitle[3].find('laboratory') != -1:
                this.matchingRules |= 4

        this.subsections = {}

    def computeSections(this):
        lectures = []
        tutorials = []
        laboratories = []
        others = []

        # extract different types of subsections
        for ssid in this.subsections:
            if ssid[0:2] == 'LA':
                laboratories.append(ssid)
            elif ssid[0] == 'L':
                lectures.append(ssid)
            elif ssid[0] == 'T':
                tutorials.append(ssid)
            else:
                others.append(ssid)

        lt_sects = {}
        ltla_sects = {}

        # find all lectures
        l_sects = dict((ssid, {'L':ssid,'T':'','LA':'','**':''}) for ssid in lectures)

        # no lectures at all! just dump all tutorials
        if len(l_sects) == 0:
            lt_sects = dict(('`'+ssid, {'L':'','T':ssid,'LA':'','**':''}) for ssid in tutorials)
        else:
            #ensure there are tutorials to add...
            if len(tutorials) != 0:
                # if *no* matching rule against lecture & tutorial, we do Cartesian product.
                # otherwise, we filter out those which SSubsection.isMatch returns false.
                for (lec_ssid, sect2) in l_sects.items():
                    for ssid in tutorials:
                        if (3 & ~this.matchingRules) or SSubsection.isMatch(ssid, sect2['L']):
                            lt_sects[lec_ssid+'`'+ssid] = {'L':sect2['L'], 'T':ssid, 'LA':'', '**':''}

            #if there is no tutorials, just copy the lecture sections
            else:
                lt_sects = dict(zip([x+'`' for x in l_sects], l_sects.values()))

        #do the same for labs...
        if len(lt_sects) == 0:
            ltla_sects = dict(('``'+ssid, {'L':'','T':'','LA':ssid,'**':''}) for ssid in tutorials)
        else:
            if len(laboratories) != 0:
                for (tut_sid, sect2) in lt_sects.items():
                    for ssid in laboratories:
                        if ((5 & ~this.matchingRules) or SSubsection.isMatch(ssid, sect2['L'])) and ((6 & ~this.matchingRules) or SSubsection.isMatch(ssid, sect2['T'])):
                            ltla_sects[tut_sid + '`' + ssid] = {'L':sect2['L'], 'T':sect2['T'], 'LA':ssid, '**':''}
            else:
                ltla_sects = dict(zip([x+'`' for x in lt_sects], lt_sects.values()))

        #all ** subsections are by themselves. they're usually XXXX-799 courses
        ltla_sects.update((ssid, {'L':"", 'T':"", 'LA':"", '**':ssid}) for ssid in others)

        # now construct & add the sections
        for (sid, sect2) in ltla_sects.items():
            sect = SSection(sid)
            if sect2['L']:
                sect.add(this.subsections[sect2['L']])
            if sect2['T']:
                sect.add(this.subsections[sect2['T']])
            if sect2['LA']:
                sect.add(this.subsections[sect2['LA']])
            if sect2['**']:
                sect.add(this.subsections[sect2['**']])
            this.add(sect)


def GET(url):
    try:
        return urlopen(url).read().decode()
    except URLError: # as (errno, strerror):
        sys.stderr.write('\nError: The A&B Server [www.ab.ust.hk] is probably under daily maintenence, scheduled in 3:00 -- 3:30am.\n\n')
        raise
    except HTTPError:
        sys.stderr.write('\nError: The page ['+url+'] does not exist.\n\n')
        return None

def getDepartment(refCourseNet, deptcode, evaluation=True, progressStack=None):
    dept_code = deptcode.lower()

    if progressStack is not None:
        progressStack.push(title='Loading department', maximum=None, message="Loading department "+dept_code.upper()+"...")

    try:
        data = GET('https://www.ab.ust.hk/wcr/intf/out/class/cr_class_' + dept_code + '.htm')
    finally:
        if progressStack is not None:
            progressStack.pop()

    #url = 'file:///C:/Documents%20and%20Settings/Administrator/Desktop/Downloads/cr_class_' + dept_code + '.htm'

    if data is None:
        return

    getDepartment2(data, refCourseNet, dept_code)
    
    if evaluation:
        refCourseNet.reduceNet(progressStack=progressStack)
        refCourseNet.evaluateAllVertices(progressStack=progressStack)
        

def getDepartment2(src, refCourseNet, deptcode):
    cleaned = src

    # clean up HTML.
    cleaned = re.compile(r"<(?:script|style).+?</(?:script|style)>", re.S | re.I).sub('', cleaned)
    cleaned = re.compile(r"</?(?:font|img|strong|a|form|html|head|title|body|hr|div|center)[^>]*>", re.I).sub('', cleaned)
    cleaned = re.compile(r"<![^>]+>", re.I).sub('', cleaned)							
    cleaned = re.compile(r" (?:v?align|class)=[^\s>]+", re.I).sub('', cleaned)			
    cleaned = re.compile(r' (?:row|col)span="1"', re.I).sub('', cleaned)
    cleaned = cleaned.replace(" nowrap", '')
    cleaned = re.compile(r"<table[^>]+", re.I).sub('<table', cleaned)					
    cleaned = re.compile(r"(?:&nbsp;\s+)+", re.I).sub('`', cleaned)						
    cleaned = re.compile(r"\s{2,}", re.S).sub(' ', cleaned)								
    cleaned = re.compile(r"(`|>)\s", re.S).sub(r'\1', cleaned)							
    cleaned = re.compile(r"\s(`|<)", re.S).sub(r'\1', cleaned)							
    cleaned = cleaned.replace("&nbsp;", '')								
    cleaned = cleaned.replace('<table><tr><td colspan="11">TBA: To be arranged<br></td></tr></table>', '')
    cleaned = cleaned.replace(" Class Quota / Schedule", '')				
    cleaned = cleaned.replace("<table><tr><td><table>", '<table>')		
    cleaned = cleaned.replace("</table></td></tr></table>", '</table>')
    cleaned = re.compile(r"<br[^>]*>", re.I).sub("\n", cleaned)

    TTA = common.htmlToTuples(cleaned)

    # to do: check if TTA really has 2 tables.
    if len(TTA) != 2:
        return
    
    mainTable = TTA[1]

    # if there is some courses offered by this department, do the analysis
    if mainTable != "No matched class found.":
        # ***IsDirty = *** is being analyzed
        theCourseIsDirty = False
        theSubsectionIsDirty = False

        theCourse = None
        theSubsection = None
        ssSSID = ""
        ssDays = ""
        ssTime = ""
        ssVenue = ""

        for thisRow in mainTable[2:]:
            rowLen = len(thisRow)

            # header row: this row gives the course code and stuff.
            if not isinstance(thisRow, (tuple, list)):
               
                if theSubsectionIsDirty:
                    theCourse.subsections[theSubsection.ssid] = theSubsection
                if theCourseIsDirty:
                    #print "BEFORE>", refCourseNet, theCourse
                    theCourse.computeSections()
                    #print "MIDDLE>", refCourseNet, theCourse
                    refCourseNet.buffer(theCourse)
                
                theCourse = SCourse(thisRow.split('`'))
                theCourseIsDirty = True
                theSubsectionIsDirty = False

            # first row of subsection.
            elif rowLen == 12:
                # there must be a course to contain the subsection!
                if not theCourseIsDirty:
                    return

                # there was old subsection, let's push it in.
                if theSubsectionIsDirty:
                    theCourse.subsections[theSubsection.ssid] = theSubsection

                ssSSID = thisRow[0]
                if ssSSID != '**':
                    ssSSID += thisRow[1]
                else:
                    ssSSID = thisRow[1]

                ssDays = thisRow[8]
                ssTime = thisRow[9]
                ssVenue = re.compile(r"\s+\([-\d]+\)").sub('', thisRow[10])
                
                theSubsection = SSubsection(theCourse.code, ssSSID, ssDays, ssTime, ssVenue)
                theSubsectionIsDirty = True

            # additional details for a subsection, e.g. more student groups and/or time intervals.
            elif rowLen == 10:
                if not theCourseIsDirty or not theSubsectionIsDirty:
                    return
                
                ssDays = thisRow[7]

                if ssDays:
                    ssTime = thisRow[8]
                    ssVenue = re.compile(r"\s+\([-\d]+\)").sub('', thisRow[9])
                    theSubsection.add(STimeInterval.analyzeSchedule(ssDays, ssTime, theCourse.code, theSubsection.ssid, ssVenue))
                    
        if theSubsectionIsDirty:
            theCourse.subsections[theSubsection.ssid] = theSubsection
        if theCourseIsDirty:
            theCourse.computeSections()
            refCourseNet.buffer(theCourse)

# find all departments from HKUST.
def findAllDepartments(progressStack=None):
    if progressStack is not None:
        progressStack.push(title='Finding departments', maximum=None, message="Finding departments...")

    try:
        data = GET('http://www.ab.ust.hk/wcr/intf/out/class/cr_class_group.htm')
    finally:
        if progressStack is not None:
            progressStack.pop()
    
    rx = re.compile(r'<a href="[^"]+">([A-Z]{4})</a>')
    depts = rx.findall(data)
    depts.append('LANG')

    
    return depts

def getManyDepartments(sn, deptlist, progressStack=None):
    if progressStack is not None:
        progressStack.push(title='Loading multiple departments', maximum=len(deptlist)+2, unitstep=1, message="Loading multiple departments...")
        
    for dept in deptlist:
        getDepartment(sn, dept, evaluation=False, progressStack=progressStack)

    if progressStack is not None:
        progressStack.pop()
    
    sn.reduceNet(progressStack=progressStack)
    sn.evaluateAllVertices(progressStack=progressStack)
    
                                 
def writeTTMan2Str(sn, cliqueset):
    strsol2 = '\n'.join([str(sn.sections[i]) for i in cliqueset[0]]) + '\n'
    strsol2 = re.compile(r'(\+|`)[LT]A?').sub(r'\1', strsol2)
    strsol2 = strsol2.replace('\n', ':red;\n')
    return strsol2
    
