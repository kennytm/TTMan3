##
##    HKUST Ultimate Timetable Constructor <getkey()>
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

import os

def getkey():
    return None

if os.name == 'nt':
    import msvcrt

    def getkey():
        if msvcrt.kbhit():
            return msvcrt.getch().decode()
        else:
            return None

##elif os.name == 'posix':
##    import tty
##    import termios
##    import sys
##    import copy
##
##    def getkey():
##        stdinfn = sys.stdin.fileno()
##        oldattr = termios.tcgetattr(stdinfn)
##        newattr = copy.copy(oldattr)
##        newattr[3] &= ~(termios.ICANON | termios.ECHO | termios.ISIG)
##        newattr[-1][termios.VMIN] = 0
##        termios.tcsetattr(stdinfn, termios.TCSANOW, newattr)
##        ch = None
##        try:
##            ch = sys.stdin.read(1)
##        finally:
##            termios.tcsetattr(stdinfn, termios.TCSANOW, oldsttr)
##        return ch
##    
