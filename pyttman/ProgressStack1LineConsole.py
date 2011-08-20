from IProgressStack import *
##
##    HKUST Ultimate Timetable Constructor <Progress Stack as 1-Line Console Message>
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

import sys
import time
from getkey import getkey

class ProgressStack1LineConsole(IProgressStack):
    def __init__(self, stream=sys.stderr):
        IProgressStack.__init__(self)
        self.last_rendered = time.time()
        self.msglen = 0
        self.stream = stream

    def cleanup(self):
        sys.stderr.write("\r" + " " * self.msglen + "\n\n")

    def render(self):
        curtime = time.time()
        if curtime - self.last_rendered >= 1:
            self.last_rendered = curtime
            msg = ""
            if self.curlevel > 2:
                msg = ("%s (%s:%s) | ... | %s | %s (%s:%s) %s" % (
                    self.percentage(0),
                    IProgressStack.compact_time_difference(curtime - self.init_times[0]),
                    IProgressStack.compact_time_difference(self.expected_finish_time(curtime, 0)),
                    self.percentage(-2),
                    self.percentage(),
                    IProgressStack.compact_time_difference(curtime - self.init_times[-1]),
                    IProgressStack.compact_time_difference(self.expected_finish_time(curtime)),
                    self.message
                ))
            elif self.curlevel == 2:
                msg = ("%s (%s:%s) | %s | %s (%s:%s) %s" % (
                    self.percentage(0),
                    IProgressStack.compact_time_difference(curtime - self.init_times[0]),
                    IProgressStack.compact_time_difference(self.expected_finish_time(curtime, 0)),
                    self.percentage(1),
                    self.percentage(),
                    IProgressStack.compact_time_difference(curtime - self.init_times[-1]),
                    IProgressStack.compact_time_difference(self.expected_finish_time(curtime)),
                    self.message
                ))
            elif self.curlevel == 1:
                msg = ("%s (%s:%s) | %s (%s:%s) %s" % (
                    self.percentage(0),
                    IProgressStack.compact_time_difference(curtime - self.init_times[0]),
                    IProgressStack.compact_time_difference(self.expected_finish_time(curtime, 0)),
                    self.percentage(),
                    IProgressStack.compact_time_difference(curtime - self.init_times[-1]),
                    IProgressStack.compact_time_difference(self.expected_finish_time(curtime)),
                    self.message
                ))
            elif self.curlevel == 0:
                msg = ("%s (%s:%s) %s" % (
                    self.percentage(),
                    IProgressStack.compact_time_difference(curtime - self.init_times[-1]),
                    IProgressStack.compact_time_difference(self.expected_finish_time(curtime)),
                    self.message
                ))

            if len(msg) > self.msglen:
                self.msglen = len(msg)
                
            self.stream.write(msg.ljust(self.msglen) + "\r")

            return getkey() != 'q'
            
        else:
            return True
