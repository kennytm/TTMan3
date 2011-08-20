#!/usr/bin/python

##
##    HKUST Ultimate Timetable Constructor <Main program>
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

from ProgressStack1LineConsole import ProgressStack1LineConsole
from hkust import *

import sys
import re
import pickle
import os

sys.stdout.write ("""HKUST Ultimate Timetable Constructor
    Copyright (C) 2008  KennyTM~
    This program comes with ABSOLUTELY NO WARRANTY.
    This is free software, and you are welcome to redistribute it
    under certain conditions.\n\n""")

hasCache = os.path.isfile('coursenet.pickle')

try:
    import psyco
    psyco.cannotcompile(re.compile)
    psyco.full()
except ImportError:
    pass


# Find all departments from HKUST.
# If server is not accessible, try to load from cache instead.

ps = ProgressStack1LineConsole(sys.stdout)
sn = RCourseNetwork()
fn = []
try:
    fn = findAllDepartments(progressStack=ps)
except URLError:
    if hasCache:
        sys.stdout.write('\n\nA&B Server is down. Falling back to cache.\n\n\n')
        fn = ["-- JUST PRESS ENTER --"]
        pass
    else:
        raise
finally:
    ps.cleanup()

# List the departments for choose.

sys.stdout.write(" \nAvailable departments:\n")

for (i, dept) in enumerate(fn):
    if i % 5 == 0:
        sys.stdout.write("\n\t")
    sys.stdout.write(dept + "\t")

invalidInput = True
depts = []
evaluatedFromCache = False
saveToCache = False

while invalidInput:
    sys.stdout.write("\n\nPress [ENTER] to evaluate on all departments, or enter a list of departments to restrict the scope:\n> ")
    deptlist = sys.stdin.readline()
    if deptlist != '\n':
        depts = re.compile(r'[^a-z,]', re.I).sub('', deptlist).upper().split(',')
        invalidInput = False
        for d in depts:
            try:
                fn.index(d)
            except ValueError:
                sys.stdout.write('Error: "%s" is not a valid department.\n' % d)
                invalidInput = True
                break
    else:
        depts = fn
        invalidInput = False
        if hasCache:
            evaluatedFromCache = True
        else:
            saveToCache = True

# If we need all departments, we can load from cache instead.

if evaluatedFromCache:
    evaluatedFromCache = False
    ps.push(maximum=None, message="Loading from cache...")
    try:
        f = open('coursenet.pickle', 'rb')
        sn = pickle.load(f)
        evaluatedFromCache = True
    except (ValueError, ImportError):
        ps.pop()
        sys.stdout.write('Invalid cache. Loading online data instead.\n\n')
        saveToCache = True
    finally:
        f.close()

# If cache is not needed, load directly from HKUST

if not evaluatedFromCache:
    getManyDepartments(sn, depts, progressStack=ps)
    ps.cleanup()

# and save the newest edition to cache

if saveToCache:
    try:
        f = open('coursenet.pickle', 'wb')
        pickle.dump(sn, f)
    finally:
        f.close()

hasCache = os.path.isfile('coursenet.pickle')

inptype = 1
algs = [None, sn.greedyCliques, sn.greedyCliquesSemiExhaustive, sn.greedyCliquesExhaustive, sn.exactCliques]
algtype = 1

compweights = [None, None, lambda s:s.course.credits, lambda s:len(s), -1, lambda s:-s.course.credits, lambda s:-len(s)]
compnames = [None, "Highest course count", "Highest total credit", "Highest occupied time", "Lowest course count", "Lowest total credit", "Lowest occupied time"]
compneedOptimization = [None, False, True, False, False, True, False]
comptype = 1

# Now the interactive shell.

while inptype != 0:
    while True:
        sys.stdout.write("\nDo what?\n")
        sys.stdout.write("  (1) Compute\n")
        sys.stdout.write("  (2) Change metric (currently %s)\n" % compnames[comptype])
        sys.stdout.write("  (3) Change algorithm (currently %s)\n" % algs[algtype].__name__)
        if hasCache:
            sys.stdout.write("  (4) Clear cache\n")
        sys.stdout.write("\n  (9) View license\n")
        sys.stdout.write("  (0) Quit\n> ")        
        inp = sys.stdin.readline()[:-1]
        if not inp.isdigit():
            sys.stdout.write('Error: Please enter a number.\n')
            continue
        inptype = int(inp)

        # Show GPL.
        if inptype == 9:
            gplText = "The newest license is located at <http://www.gnu.org/licenses/gpl-3.0.txt>.\n\n"
            try:
                gplText = GET("http://www.gnu.org/licenses/gpl-3.0.txt")
            except Exception:
                if os.path.isfile('LICENSE'):
                    try:
                        f = open('LICENSE')
                        for line in f:
                            gplText += line
                    finally:
                        f.close()
            sys.stdout.write(gplText)

        # Clear cache
        elif inptype == 4:
            try:
                os.remove('coursenet.pickle')
            except:
                pass
            hasCache = os.path.isfile('coursenet.pickle')

        # Select algorithm
        elif inptype == 3:
            while True:
                sys.stdout.write("\nWhich algorithm?\n")
                for (i, a) in enumerate(algs):
                    if i != 0:
                        sys.stdout.write("%s (%d) %s\n" % ('*' if i == algtype else ' ', i, a.__name__))
                sys.stdout.write("\n  (0) Confirm\n> ")
                inp = sys.stdin.readline()[:-1]
                if not inp.isdigit():
                    sys.stdout.write('Error: Please enter a number.\n')
                    continue
                newalgtype = int(inp)
                if newalgtype < 0 or newalgtype >= len(algs):
                    sys.stdout.write('Error: Please enter a number between 0 and %d.\n' % (len(algs)-1))
                    continue
                if newalgtype == 0:
                    break
                algtype = newalgtype

        # Select vertex weight
        elif inptype == 2:
            while True:
                sys.stdout.write("\nWhich metric?\n")
                for (i, n) in enumerate(compnames):
                    if i != 0:
                        sys.stdout.write("%s (%d) %s\n" % ('*' if i == comptype else ' ', i, n))
                sys.stdout.write("\n  (0) Confirm\n> ")
                inp = sys.stdin.readline()[:-1]
                if not inp.isdigit():
                    sys.stdout.write('Error: Please enter a number.\n')
                    continue
                newcomptype = int(inp)
                if newcomptype < 0 or newcomptype >= len(compweights):
                    sys.stdout.write('Error: Please enter a number between 0 and %d.\n' % (len(algs)-1))
                    continue
                if newcomptype == 0:
                    break
                comptype = newcomptype

        # Quit
        elif inptype == 0:
            exit()

        # Anything else
        elif inptype != 1:
            sys.stdout.write('Error: Please enter a number between 0 and 4.\n')

        # Compute
        else:
            break

    if compneedOptimization[comptype]:
        sn.optimizeEquivalents(compweights[comptype])

    # Do computation.
    clqs = algs[algtype](weight=compweights[comptype], progressStack=ps)
    ps.cleanup()

    sys.stdout.write("Clique score: %8g \n\n" % clqs[1])
    sys.stdout.write("HKUST TTMan2 Import Code:\n\n")

    # Write result
    sys.stdout.write(writeTTMan2Str(sn, clqs))

    sys.stdout.write("\n\n")

