/*
 
 common.njs
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

// #include "blocksheet.njs"

/*
 
 common.js contains some common functions not present in native javascript.
 
 */

function doNothing () {}

// functions to manipulate the enabled states of form fields.

function disableCollections(tagName) {
	var col = document.getElementsByTagName(tagName);
	for (var i = col.length-1; i >= 0; --i) {
		var o = col[i];
		o.previousDisabled = o.disabled;
		o.disabled = true;
	}
}

function enableCollections(tagName) {
	var col = document.getElementsByTagName(tagName);
	for (var i = col.length-1; i >= 0; --i) {
		var o = col[i];
		o.disabled = o.previousDisabled;
	}
}

function disableForms() {
	disableCollections('input');
	disableCollections('textarea');
	disableCollections('select');
	disableCollections('button');
}

function enableForms() {
	enableCollections('input');
	enableCollections('textarea');
	enableCollections('select');
	enableCollections('button');
}

// find position of an element.
// method attribute to http://www.quirksmode.org/js/findpos.html
function findOffsetPos(obj) {
	var curleft = 0, curtop = 0;
	if (obj.offsetParent) {
		do {
			curleft += obj.offsetLeft;
			curtop += obj.offsetTop;
		} while ((obj = obj.offsetParent));
	}
	
	return [curleft,curtop];
}

var htmlElement = document.getElementsByTagName('html')[0];

function findScrollPos(obj) {
	var scrLeft = 0, scrTop = 0;
	if (obj.parentNode) {
		do {
			scrLeft += obj.scrollLeft || 0;
			scrTop += obj.scrollTop || 0;
		} while ((obj = obj.parentNode));
	}
	
	return [scrLeft - (window.scrollX || document.body.scrollLeft || htmlElement.scrollLeft), scrTop - (window.scrollY || document.body.scrollTop || htmlElement.scrollTop)];
}

function findPos(obj) {
	var obj1 = obj;
	var offset = findOffsetPos(obj1);
	var scroll = findScrollPos(obj);
	return [offset[0]-scroll[0], offset[1]-scroll[1]];
}

// array manipulation

Array.prototype.clone = function () {
	var l = this.length;
	var a = [];
	for (var i = 0; i < l; ++ i) {
		if ('object' == typeof this[i])
			a[i] = this[i].clone();
		else
			a[i] = this[i];
	}
	
	return a;
}

Array.prototype.shallowClone = Array.prototype.concat;

Array.prototype.unique = function (f) {
	var a = this.sort(f);
	var final_array = [];
	var l = a.length;
	
	final_array.push(a[l-1]);
	
	for (var i = l-2; i >= 0; --i) {
		if (f(a[i+1], a[i]))
			final_array.push(a[i]);
	}
		
	return final_array.reverse();
}

if (!Array.prototype.lastIndexOf) {
	Array.prototype.lastIndexOf = function (t) {
		for (var i = this.length-1; i >= 0; --i)
			if (this[i] == t)
				return i;
		return -1;
	}
}

Array.prototype.pushIfUnique = function (obj, eq) {
	for (var i = this.length-1; i >= 0; --i)
		if (eq(obj, this[i]))
			return false;
	this.push(obj);
	return true;
}

// directly copied from http://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Objects/Array/filter
if (!Array.prototype.filter) {
	Array.prototype.filter = function(fun /*, thisp*/) {
		var len = this.length;
		if (typeof fun != "function")
			throw new TypeError();
		
		var res = new Array();
		var thisp = arguments[1];
		for (var i = 0; i < len; i++) {
			if (i in this) {
				var val = this[i]; // in case fun mutates this
				if (fun.call(thisp, val, i, this))
					res.push(val);
			}
		}
		
		return res;
	};
}

Array.prototype.testPattern = function (re) {
	for (var i = this.length-1; i >= 0; --i)
		if (re.test(this[i]))
			return true;
	return false;
}

Array.prototype.reverseLookup = function () {
	var res = {};
	for (var i = this.length-1; i >= 0; -- i)
		res[this[i]] = i;
	return res;
}

// numeric functions

function sgn (a, b) {
	return a < b ? -1 : a > b ? 1 : 0;
}

function pad (x, n) {
	var y = x;
	if ("string" != typeof y)
		y = x.toString();
	
	var z = n - y.length;
	var zeros = "000000000000000000000000000000000000";
	while (z > 0) {
		substr = zeros.substr(0, z);
		z -= substr.length;
		y = substr + y;
	}
	
	return y;
}

// string manipulation

function nl2br (s) { return s.replace (/\n/g, '<br />'); }

function escapeHTML (s) {
	return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

//")} (fix Xcode formatting)

function unescapeHTML (s) {
	return s.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
}

// get the human-readable relative date from now. 

function relativeDate (d) {
	var difference = new Date() - d;		// number of milliseconds pasted since last update.
	var minutes = difference / 60000;
	if (minutes < 1)
		return "less than a minute ago";
	else if (minutes < 2)
		return "a minute ago";
	else if (minutes < 60)
		return (minutes >>> 0) + " minutes ago";
	else {
		var hours = minutes / 60;
		if (hours < 2)
			return "an hour ago";
		else if (hours < 24)
			return (hours >>> 0) + " hours ago";
		else {
			var days = hours / 24;
			if (days < 2)
				return "yesterday";
			else if (days < 32)
				return (days >>> 0) + " days ago";
			else
				return "more than a month ago";
		}
	}
}

// in IE empty elements will be ignored. therefore a safeSplit version is required to workaround this.
if (",".split(/,/).length == 2)
	String.prototype.safeSplit = String.prototype.split;
else {
	String.prototype.safeSplit = function (by, safechar) {
		var a = this.replace(new RegExp(by, "g"), safechar + by + safechar).split(by);
		var re = new RegExp(safechar, "g");
		for (var i = a.length-1; i >= 0; -- i)
			a[i] = a[i].replace(re, "");
		return a;
	}
}

// obtain keys from an object (assoc. array)
function keys (obj) {
	var retval = [];
	for (var i in obj)
		retval.push(i);
	return retval;
}

// convert a DOM collection to an ordinary array.
function toArray (col) {
	var a = [];
	var len = col.length;
	for (var i = 0; i < len; ++ i)
		a.push(col[i]);
	return a;
}

// the following 1 function is new in Aug 03, 2008 to fix the FINA-110 / ECON-503 problems, where courses without tutorials cannot have preferred sections.
// check if an assoc. array is empty.
function isEmpty (obj) {
	for (var sth in obj)
		return false;
	return true;
}

// for arrays, isEmpty <=> length == 0 or all elements not in array.
Array.prototype.isEmpty = function () {
	for (var i = this.length-1; i >= 0; -- i)
		if (i in this)
			return true;
	return false;
}

// check if two objects have equal keys
function keysEqual (obj1, obj2) {
	for (var i in obj1)
		if (!(i in obj2))
			return false;
	for (var i in obj2)
		if (!(i in obj1))
			return false;
	return true;
}

// create a shallow copy of obj.
function shallowClone (obj) {
	if (obj instanceof Array)
		return obj.concat();
	else if (!(obj instanceof Object))
		return obj;
	
	var ret = {};
	for (var i in obj)
		ret[i] = obj[i];
	return ret;
}



var getText;
// get text content of a node.
if ('textContent' in document.body)
	getText = function (elem) { return elem.textContent; }		// Moz & DOM-3
else if ('innerText' in document.body)
	getText = function (elem) { return elem.innerText; }			// IE
else if ('text' in document.body)
	getText = function (elem) { return elem.text; }				// ?
else
	getText = function (elem) { return elem.firstChild.nodeValue; } // works only if elem contains only 1 text node.

function setInnerHTML (table, src) {
	try {
		table.innerHTML = src;
		return table;
	} catch (e) {
		var table_id = table.id;
		clearTable(table);
		var outerHTML = table.parentNode.innerHTML.replace(/<\/table>/i, '');
		table.parentNode.innerHTML = outerHTML + src + '</table>';
		return $(table_id);
	}
}

function clearTable (table) {
	try {
		table.innerHTML = "<tr><td></td></tr>";
	} catch(e) {
		while (table.rows.length) {
			table.deleteRow(table.rows.length-1);
		}
	}
}

function $(x) { return document.getElementById(x); }

// set operations
function composeKeys (reverser, subset) {
	var res = [];
	for (var key in subset)
		res[reverser[key]] = true;
	return res;
}


function union (a, b) {
	var res = shallowClone(a);
	for (var j in b)
		res[j] = true;
	return res;
}

function unionTo (a, b) {
	for (var j in b)
		a[j] = true;
	return a;
}

function compl (a, b) {
	var res = shallowClone(a);
	for (var j in b)
		delete res[j];
	return res;
}

// cloning again.
function shallowCloneTo (tgt, src) {
	for (var i in src) {
		if (!(i in src.constructor.prototype))
			tgt[i] = src[i];
	}
}

Array.prototype.removeEmptyObjects = function () {
	for (var i = this.length-1; i >= 0; --i) {
		if (isEmpty(i))
			this.splice(i, 1);
	}
}