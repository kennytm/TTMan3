##
##    HKUST Ultimate Timetable Constructor <Reduced Course Network component>
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
from common import xrange
import random

try:
    from psyco.classes import *
except ImportError:
    pass

class RCourseNetwork(object):
    def __init__(this):
        this.otherEquivalentSections = {}
        this.sections = []
        this.adjlist = []
        this.size = 0
        this.sectionBuffer = []
        this.evaluated = False

    def buffer(this, course):
        this.evaluated = False
        for sect in course.sections.values():
            if len(sect.intervals) == 0:
                continue
            this.sectionBuffer.append(sect)
        

    # O(n^3)?
    def reduceNet(this, progressStack=None):
        if len(this.sectionBuffer) != 0:
            if not progressStack is None:
                progressStack.push(title='Simplying course structure', maximum=len(this.sectionBuffer))
            
            for newsects in this.sectionBuffer:
                noEquiv = True
                for oldsects in this.sections:
                    if oldsects == newsects:
                        h = str(oldsects)
                        if h in this.otherEquivalentSections:
                            this.otherEquivalentSections[h].append(newsects)
                        else:
                            this.otherEquivalentSections[h] = [newsects]
                        noEquiv = False
                        break
                if noEquiv:
                    this.sections.append(newsects)

                if not progressStack is None:
                    progressStack.increase(1, message='Evaluating section %s for network construction...'%str(newsects))
                
            oldsize = this.size
            this.size = len(this.sections)
            this.adjlist.extend([set() for i in xrange(this.size - oldsize)]) # cannot use * operator because we need N *copies* of set().

            if not progressStack is None:
                progressStack.pop()

    def evaluateVertex(this, v):
        for i in xrange(v+1, this.size):
            if this.sections[i].course != this.sections[v].course and not this.sections[i].intersect(this.sections[v]):
                this.adjlist[i].add(v)
                this.adjlist[v].add(i)

    def evaluateAllVertices(this, progressStack=None):
        if progressStack is not None:
            progressStack.push(title='Constructing course network', maximum=this.size)
    
        for v in xrange(this.size):
            this.evaluateVertex(v)
            if progressStack is not None:
                progressStack.increase(1, message='Evaluating vertex #%d for network construction...'%v)
       
        if progressStack is not None:
            progressStack.pop()

    def optimizeEquivalents (this, weight):
        for (i, sect) in enumerate(this.sections):
            h = str(sect)
            wMax = weight(sect)
            sMax = None
            if h in this.otherEquivalentSections:
                equivalents = this.otherEquivalentSections[h]
                for s2 in equivalents:
                    curw = weight(s2)
                    if curw > wMax:
                        (wMax, sMax) = (curw, s2)
                if sMax is not None:
                    h2 = str(sMax)
                    equivalents.remove(s2)
                    equivalents.append(sect)
                    this.otherEquivalentSections[h2] = equivalents
                    del this.otherEquivalentSections[h]
                    this.sections[i] = sMax

    # amortized O(k)
    def neighbors(this, v):
        this.evaluateVertex(v)
        return this.adjlist[v]

    # amortized O(n)
    def degree(this):
        this.evaluateAllVertices()
        return [len(v) for v in this.adjlist]

    # amortized O(n)
    def verticesWithDegree(this, k):
        this.evaluateAllVertices()
        return [v for v in xrange(this.size) if len(this.adjlist[v]) == k]

    # amortized O(n)
    def vertexWithMaxDegree(this):
        this.evaluateAllVertices()
        return max(xrange(this.size), key=lambda v:len(this.adjlist[v]))

    def pickMaxWeightNode (this, theSet, weights=None, maxormin=max, rg=None):
        if weights is None:
            return maxormin(theSet, key=lambda v:len(this.adjlist[v]))
        else:
            adjweights = [sum(weights[u] for u in this.adjlist[v]) for v in theSet]
            return max(zip(weights, adjweights, rg or common.randomGenerator(), theSet))[-1]

    # Greedy method to find a clique.
    # Iteratively select the node with most neighbors and remove it from the graph.
    # Will *not* generate the best solution, but it is pretty fast (O(n^3)).
    def greedyCliques(this, initNode=None, weight=None, progressStack=None):
        maxormin = max
        weights = None
        if isinstance(weight, (int, float)) and weight < 0:
            maxormin = min
        elif weight is not None:
            weights = [weight(s) for s in this.sections]

        rg = common.randomGenerator()
        xr = xrange(this.size)

        V0 = this.pickMaxWeightNode(xrange(this.size), weights=weights, maxormin=maxormin, rg=rg) if initNode is None else initNode
            
        Q = set((V0,))
        rho = set(this.adjlist[V0])
        totalweight = 1 if weights is None else weights[V0]

        initRhoSize = len(rho)
        hasProgress = isinstance(progressStack, IProgressStack)

        if hasProgress:
            progressStack.push(title="Searching for cliques", maximum=initRhoSize)
        
        while len(rho) != 0: # O(k)*
            if hasProgress:
                if not progressStack.update(initRhoSize - len(rho), message="Enlarging cliques: %d candidates left (current score: %g)..." % (len(rho), totalweight)):
                    break
            
            # find all new common neighbors, and
            # pick the one with most common neighbors
            maxv = None
            if weights is None:
                vmax = maxormin([(len(rho & this.adjlist[v]), rg, v) for v in rho])[2] # O(k^2)
                Q.add(vmax)
                rho.intersection_update(this.adjlist[vmax])
                totalweight += 1
            else:
                adjweights = dict((v, sum(weights[u] for u in this.adjlist[v] & rho)) for v in rho)
                maxp = max((weights[v], adjweights[v], rg, v) for v in rho)
                Q.add(maxp[-1])
                rho.intersection_update(this.adjlist[maxp[-1]])
                totalweight += weights[maxp[-1]]

        if hasProgress:
            progressStack.pop()
            
        return (Q, totalweight if maxormin == max else -totalweight) # O(k^3)

    def greedyCliquesSemiExhaustive(this, weight=None, progressStack=False):
        untouched = set(xrange(this.size))
        weights = None
        maxormin = max
        if isinstance(weight, (int, float)):
            if weight < 0:
                maxormin = min
        elif weight is not None:
            weights = [weight(v) for v in this.sections]

        wMax = -common.Infinity
        QMax = set()
        if progressStack is not None:
            progressStack.push(title="Iterating remaining initial conditions for clique searching", maximum=this.size)
            
        while len(untouched) != 0:
            v0 = this.pickMaxWeightNode(untouched, weights=weights, maxormin=maxormin)
            curGC = this.greedyCliques(v0, weight=weight, progressStack=None)
            if curGC[1] > wMax:
                (QMax, wMax) = curGC
            untouched.difference_update(curGC[0])

            if progressStack is not None:
                if not progressStack.update(this.size - len(untouched), message="Evaluating initial conditions: %d candidates left (current score: %g)..." % (len(untouched), wMax)):
                    break
                
        if progressStack is not None:
            progressStack.pop()

        return (QMax, wMax)
    

    # calls greedyCliques with starting from all nodes.
    # O(n^4).
    def greedyCliquesExhaustive(this, weight=None, progressStack=False):
        hasProgress = isinstance(progressStack, IProgressStack)

        if hasProgress:
            progressStack.push(title="Iterating initial conditions for clique searching", maximum=this.size)
        
        #if not allResults:
            
        QMax = set()
        wMax = -common.Infinity
        for v in xrange(this.size):
            if hasProgress:
                if not progressStack.increase(1, message="Evaluating vertex #%d for cliques (current score: %g)"%(v,wMax)):
                    break
                
            curGC = this.greedyCliques(v, weight=weight, progressStack=None)
            if curGC[1] > wMax:
                (QMax, wMax) = curGC

        if hasProgress:
            progressStack.pop()
            
        return (QMax, wMax)

    def exactCliques(this, weight=None, progressStack=False):

        hasProgress = isinstance(progressStack, IProgressStack)

        if hasProgress:
            progressStack.push(title="Search for cliques exactly", maximum=this.size, unitstep=1)
        
        
        QMax = []
        wMax = -common.Infinity

        QsPrev = dict( ((v,), 1) for v in xrange(this.size) )
        
        weights = None
        searchformax = True
        
        if isinstance(weight, (int, float)):
            if weight < 0:
                searchformax = False
        elif weight is not None:
            weights = [weight(v) for v in this.sections]
            QsPrev = dict( ((v,), w) for (v, w) in enumerate(weights) )
            
        for QSize in xrange(this.size):
            if hasProgress:
                progressStack.push(message="Current clique size: %d (current score: %g)"%(QSize, wMax), maximum=len(QsPrev))
            
            QsNext = dict()
            
            # find all total neighbors and append to list.
            for (Q, W) in QsPrev.items():
                if hasProgress:
                    if not progressStack.increase(1, message="Current clique size %d (current score: %g)"%(QSize, wMax)):
                        progressStack.pop()
                        progressStack.pop()
                        return (QMax, wMax)
                
                neis = [this.adjlist[v] for v in Q]
                totalNeis = set(neis[0])

                for nei in neis[1:]:
                    totalNeis.intersection_update(nei)

                if len(totalNeis) == 0:
                    if not searchformax:
                        if hasProgress:
                            progressStack.pop()
                            progressStack.pop()
                        return (set(Q), -W)
                    else:
                        if W > wMax:
                            (QMax, wMax) = (set(Q), W)
                    
                for n in totalNeis:
                    Q2 = common.appendSorted(Q, n)
                    W2 = W
                    if weights is not None:
                        W2 += weights[n]
                    else:
                        W2 += 1
                    QsNext[Q2] = W2

            QsPrev = QsNext
            
            if hasProgress:
                progressStack.pop()

            if len(QsPrev) == 0:
                break

        if hasProgress:
            progressStack.pop()

        return (QMax, wMax)
    
##        else:
##            QAll = []
##            QMaxSize = 0
##            for v in xrange(this.size):
##                if hasProgress:
##                    progressStack.update(message="Evaluating vertex #%d for cliques (current score: %g)"%(v,QMaxSize))
##                
##                curGC = this.greedyCliques(v, weight=weight, progressStack=progressStack)
##                if curGC[1] > QMaxSize:
##                    QMaxSize = curGC[1]
##                    QAll = [curGC[0]]
##                elif curGC[1] == QMaxSize:
##                    QAll.append(curGC[0])
##
##            if hasProgress:
##                progressStack.pop()
##                
##            return QAll
            
    # based on Patric Ostergard's cliquer program.
##    def ostergardClique(this, weight=None):
##        
##        def sub_unweigted_single(Q, cliqueSize, table, minsize):
##            if minsize == 0:
##                Q.clear()
##                return True
##            elif minsize == 1:
##                if len(table)>0:
##                    Q.clear()
##                    Q.add(table[0])
##                    return True
##                else:
##                    return False
##            elif len(table) < minsize:
##                return False
##            else:
##                i = len(table)-1
##                for v in reversed(table[(minsize-1):]):
##                    if cliqueSize[v] < minsize:
##                        break
##                    newtable = [w for w in table[:i] if w in this.adjlist[v]]
##                    if len(newtable) < minsize-1:
##                        continue
##                    if cliqueSize[newtable[-1]] < minsize-1:
##                        continue
##                    if sub_unweigted_single(Q, cliqueSize, newtable, minsize-1):
##                        Q.add(v)
##                        return True
##                return False
##                
##        def sub_weighted_all(Q, Qb, table, weight, curweight, low, high, maximalOnly):
##            if len(table) == 0:
##                if curweight > low:
##                    if len(Qb) != 0:
##                        Q.clear()
##                        Q.update(Qb)
##                    return curweight
##        
##        if weight is None:
##            table = sorted(xrange(this.size), key=lambda v:len(this.adjlist[v]), reverse=True)
##            
##            # unweighted search
##            w = table[0]
##            Q = set(w)
##
##            cliqueSize = [0] * this.size
##            cliqueSize[w] = 1
##            
##            for (i, v) in enumerate(table):
##                if i == 0:
##                    continue
##                
##                newtable = [u for u in table[:i] if u in this.adjlist[v]]
##                newsize = len(newtable)
##
##                if sub_unweigted_single(Q, cliqueSize, newtable, cliqueSize[w]):
##                    Q.add(v)
##                    cliqueSize[v] = cliqueSize[w] + 1
##                else
##                    cliqueSize[v] = cliqueSize[w]
##                
##                w = v
##
##            return (Q, len(Q))
##
##        else:
##            weights = list(map(weight, xrange(this.size)))
##            neiweights = [sum(weights[v] for v in this.adjlist[w]) for w in xrange(this.size)]
##
##            w = table[0]
##            Qb = set(w)
##            Q = set()
##
##            searchWeight = weights[w]
##
##            cliqueSize = [0] * this.size
##            cliqueSize[w] = weights[w]
##            
##
##            for (i, v) in enumerate(table):
##                if i == 0:
##                    continue
##
##                newtable = [u for u in table[:i] if u in this.adjlist[v]]
##                newweight = sum(map(weights.__getitem__, newtable))
##                
##                searchWeight = sub_weighted_all(Q, Qb, newtable, newweight, weights[v], searchWeight, cliqueSize[table[-1]]+weights[v], False)
##
##                if searchWeight is None:
##                    break
##
##                cliqueSize[v] = searchWeight
##
##            return (Q, cliqueSize[table[-1]])

            
