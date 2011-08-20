##
##    HKUST Ultimate Timetable Constructor <Base class for Progress Stack>
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

import time
from collections import deque
import common # for Infinite & NaN

class IProgressStack:
    """
    The base class for a Progress Stack.

    A Progress Stack is widget with a progress bar hierachy.
    It is useful to show subprocess progress, e.g.

      Total             |---------->          | 50%
      Downloading data  |-------------------> | 90%
      index.xml         |--->                 | 15%
    """
    
    def __init__(self):
        self.values = deque()
        self.last_manual_values = deque()
        self.init_times = deque()
        self.maximums = deque()
        self.is_definite = deque()
        self.ratios = deque()
        self.titles = deque()
        self.message = ""
        self.curlevel = -1

    def push(self, title="", maximum=100, unitstep=0, message=None):
        """
        Create a new progress bar stack.

        You can pass None to maximum for an indefinite progress. It is
        useful when you don't know when the task will end.
        
        If unitstep is nonzero, any change in its child progress bar will
        be reflected to this progress bar automatically.
        For example, if you are processing 100 files, you can set unitstep
        to 1, so the it can grow smoothly from N to N+1 automatically when
        you change the value of the processing progress.
        """
        
        self.values.append(0.0)
        self.last_manual_values.append(0.0)
        self.init_times.append(time.time())
        self.maximums.append(float(maximum or 0))
        self.is_definite.append(not maximum is None)
        self.ratios.append(float(unitstep))
        self.titles.append(title)
        if message is not None:
            self.message = message
        self.curlevel += 1

        self.render()

    def pop(self, message=None):
        """
        Remove the last progress bar.
        """

        if self.curlevel >= 0:
            self.values.pop()
            self.last_manual_values.pop()
            self.init_times.pop()
            self.maximums.pop()
            self.is_definite.pop()
            self.ratios.pop()
            self.titles.pop()
            if message is not None:
                self.message = message

            self.curlevel -= 1

            if self.curlevel >= 0:
                if self.ratios[-1] != 0:
                    self.last_manual_values[-1] += self.ratios[-1]
                    self.values[-1] = self.last_manual_values[-1]
                else:
                    self.last_manual_values[-1] = self.values[-1]

            self.render()
        else:
            self.cleanup()

    def _updateParents(self):
        for i in range(self.curlevel, 0, -1):
            if self.ratios[i-1] == 0:
                break
            parentDelta = self.values[i] * self.ratios[i-1] / self.maximums[i]
            self.values[i-1] = parentDelta + self.last_manual_values[i-1]
    
    def update(self, value=None, message=None):
        """
        Update the value of the last progress bar.

        Additional message can be shown with the message parameter.
        """
        if self.curlevel == -1:
            return

        if not message is None:
            self.message = message

        if not value is None:
            self.values[-1] = self.last_manual_values[-1] = value

        if self.curlevel > 0:
            self._updateParents()
            
        return self.render()

    
    def increase(self, by, message=None):
        """
        Increase the value of the last progress bar.

        Additional message can be shown with the message parameter.
        """
        if self.curlevel != -1:
            return self.update(self.values[-1]+by, message)
        else:
            return True

    def render(self):
        """
        Render the progress stack.

        This is the only required function that a subclass must implement.
        """
        raise NotImplementedError("IProgressStack.render() is not implemented. Please subclass it and implement this method.")

    def cleanup(self):
        """
        Clean up the progress stack.

        A subclass should implement this function, but this is optional.
        """
        pass

    def expected_finish_time(self, curtime=None, n=-1):
        """
        Compute the expected finish time for the n-th progress bar.
        """
        if not self.is_definite[n]:
            return common.NaN

        if self.values[n] == 0:
            return common.Infinity
        
        now = curtime
        if curtime is None:
            now = time.time()
        return (now - self.init_times[n]) * (self.maximums[n] / self.values[n] - 1)

    def percentage(self, n=-1):
        """
        Compute and format the percentage for the n-th progress bar
        """
        if not self.is_definite[n]:
            return "??%"
        else:
            return "%2d%%" % int(100.*self.values[n] / self.maximums[n])

    @staticmethod
    def human_readable_time_difference (delta):
        """
        Return a human readable string that represents a difference of delta seconds.
        """
        if delta != delta:
            return "unknown"
        elif delta >= common.Infinity:
            return "forever"
        
        retval = ""
        x = abs(int(delta))
        
        if delta < 0:
            retval = "negative "

        if x < 60:
            return retval + ("%d second%s" % (x, ('s' if x!=1 else '')))
        elif x < 3600:
            (minutes, seconds) = divmod(x, 60)
            return retval + ("%d minute%s %d second%s" % (minutes, ('s' if minutes!=1 else ''), seconds, ('s' if seconds!=1 else '')))
        elif x < 86400:
            (hours, minutes) = divmod(x//60, 60)
            return retval + ("%d hour%s %d minute%s" % (hours, ('s' if hours!=1 else ''), minutes, ('s' if minutes!=1 else '')))
        elif x < 2592000:
            (days, hours) = divmod(x//3600, 24)
            return retval + ("%d day%s %d hour%s" % (days, ('s' if days!=1 else ''), hours, ('s' if hours!=1 else '')))
        else:
            days = x//86400
            return retval + ("%d day%s" % (days, ('s' if days!=1 else '')))

    @staticmethod
    def compact_time_difference (delta):
        if delta != delta:
            return "?"
        elif delta >= common.Infinity:
            return "inf"
        
        x = abs(int(delta))
        y = x
        retval = ("" if delta>0 else "-")

        if x >= 86400:
            (days, rest) = divmod(y, 86400)
            retval += "%dd"%days
            y = rest
            
        if x >= 3600:
            (hours, rest) = divmod(y, 3600)
            retval += "%dh"%hours
            y = rest

        if x >= 60:
            (minutes, rest) = divmod(y, 60)
            retval += "%dm"%minutes
            y = rest

        retval += "%ds" % y
        return retval
            
