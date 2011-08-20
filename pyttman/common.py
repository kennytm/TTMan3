##
##    HKUST Ultimate Timetable Constructor <Common & Miscellaneous routines>
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

import re
import random

try:
    Infinity = float("inf")
    NaN = float("nan")
except ValueError:
    Infinity = 1e1000
    NaN = 1e1000 * 0

try:
    xrange = xrange
except NameError:
    xrange = range

# build a reverse lookup table.
def reverseLookup (this):
    if isinstance(this, (list, tuple)):
        return dict(zip(this, range(len(this))))
    else:
        return dict(zip(this.values(), this.keys()))

def flattenSingletonRecursive (obj):
    if isinstance(obj, (list, tuple)):
        if len(obj) == 1:
            return flattenSingletonRecursive(obj[0])
        elif len(obj) == 0:
            return None
        else:
            return tuple(flattenSingletonRecursive(i) for i in obj)
    else:
        return obj
    

# convert HTML to Python tuples
def htmlToTuples (string):
    cleaned = re.compile(r"(</?)[^>]+>").sub(r'\1>', string)

    retval = []
    stacks = [retval]
    mode = 0
    # 0 = normal.
    # 1 = found <

    tags = re.compile(r"</?>")
    curloc = 0

    for match in tags.finditer(cleaned):
        rng = match.span()
        typ = match.group()

        if rng[0] != curloc:
            stacks[-1].append(cleaned[curloc:rng[0]])
        curloc = rng[1]

        # found open tag: down one level.
        if typ == '<>':
            stacks[-1].append([])
            stacks.append(stacks[-1][-1])

        # found closed tag: up one level.
        elif typ == '</>':
            stacks.pop()

    if curloc != len(cleaned):
        retval.append(cleaned[curloc:])

    # flatten the structure a bit.
    return flattenSingletonRecursive(retval)

def allIndex (lst, val):
    return [i for i in xrange(len(lst)) if lst[i] == val]

def randomIndex (lst, val):
    return random.choice(allIndex(lst, val))

def appendSorted (lst, e):
    """
    Append an element to a sorted list.
    """

    extraelem = type(lst)([e])

    if len(lst) == 0:
        return extraelem
    elif lst[-1] < e:
        return lst + extraelem
    elif e < lst[0]:
        return extraelem + lst
    else:
        for (i, v) in enumerate(lst):
            if e < v:
                return lst[:i] + extraelem + lst[i:]


def mergeSorted (lst1, lst2):
    """
    Merge two sorted list.
    """

    if len(lst1)==0:
        return lst2
    elif len(lst2)==0:
        return lst1
    elif len(lst1)==1:
        return appendSorted(lst2, lst1[0])
    elif len(lst2)==1:
        return appendSorted(lst1, lst2[0])
    
    elif lst1[-1] < lst2[0]:
        return lst1 + lst2
    elif lst2[-1] < lst1[0]:
        return lst2 + lst1
    else:
        result = []
        i1 = 0
        i2 = 0
        while True:
            if lst2[i2] < lst1[i1]:
                result.append(lst2[i2])
                i2 += 1
            else:
                result.append(lst1[i1])
                i1 += 1
            if i1 == len(lst1):
                result.extend(lst2[i2:])
                return result
            if i2 == len(lst2):
                result.extend(lst1[i1:])
                return result

    
def intersectSorted (lst1, lst2):
    """
    Compute intersection of two sorted lists.
    """
    
    if len(lst1) == 0 or len(lst2) == 0:
        return []
    elif lst1[-1] < lst2[0] or lst2[-1] < lst1[0]:
        return []
    else:
        i1 = 0
        i2 = 0
        result = []
        while i1 != len(lst1) and i2 != len(lst2):
            if lst1[i1] < lst2[i2]:
                i1 += 1
            elif lst2[i2] < lst1[i1]:
                i2 += 1
            else:
                result.append(lst1[i1])
                i1 += 1
                i2 += 1
        return result

def intersectSizeSorted (lst1, lst2):
    if len(lst1) == 0 or len(lst2) == 0:
        return 0
    elif lst1[-1] < lst2[0] or lst2[-1] < lst1[0]:
        return 0
    else:
        i1 = 0
        i2 = 0
        result = 0
        while i1 != len(lst1) and i2 != len(lst2):
            if lst1[i1] < lst2[i2]:
                i1 += 1
            elif lst2[i2] < lst1[i1]:
                i2 += 1
            else:
                result += 1
                i1 += 1
                i2 += 1
        return result

def intersectNonemptySorted (lst1, lst2, eqfunc=(lambda x,y:x==y)):
    """
    Check if two sorted lists have any intersections.

    The members between the lists can be partially ordered, but those
    within the same list must be strictly ordered.
    """
    
    if len(lst1) == 0 or len(lst2) == 0:
        return False
    else:
        i1 = 0
        i2 = 0
        result = 0
        while i1 != len(lst1) and i2 != len(lst2):
            if eqfunc(lst1[i1], lst2[i2]):
                return True
            elif lst1[i1] < lst2[i2]:
                i1 += 1
            else:
                i2 += 1
        return False

def diffRange (lst1, rngEnd):
    for (i, v) in enumerate(lst1):
        if v >= rngEnd:
            return lst1[i:]
    return lst1
            
class randomGenerator:
    def __iter__(this):
        return this

    def __next__(this):
        return random.random()

    next = __next__
