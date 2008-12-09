/*
 
 color.js
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

/*

color.js just contains some color-related functions 

*/

function getBrightness (rgbarr) {
	return 0.2126 * rgbarr[0] + 0.7152 * rgbarr[1] + 0.0722 * rgbarr[2];
}

function getTextColorFromBG (rgb) {
	if ("string" == typeof rgb)
		rgb = ('0x' + rgb.replace(/#/g, '')) >>> 0;
	return getBrightness( numToRgb(rgb) ) <= 0.5 ? "white" : "black";
}

function colorToNum (rgb) {
	if ("string" == typeof rgb)
		rgb = ('0x' + rgb.replace(/#/g, '')) >>> 0;
	return rgb;
}

function numToColor(num) {
	return '#' + pad(num.toString(16), 6);
}

function numToRgb (rgb) {
	var r = 1/255;
	return [(rgb >> 16)*r, ((rgb >> 8) & 0xFF)*r, (rgb & 0xFF)*r];
}

function rgbToNum (rgbarr) {
	return (rgbarr[0]*255+0.5) << 16 | (rgbarr[1]*255+0.5) << 8 | (rgbarr[2]*255+0.5);
}

function rgbToHsl(rgbarr) {
	var maxrgb = Math.max.apply(null, rgbarr);
	var minrgb = Math.min.apply(null, rgbarr);
	var l = 0.5*(maxrgb + minrgb);
	if (maxrgb == minrgb) {
		return [0, 0, l];
	} else {
		var s = (maxrgb - minrgb) / (l <= 0.5 ? 2*l : 2-2*l);
		var h = 1/(maxrgb - minrgb)/6;
		if (maxrgb == rgbarr[0]) {
			h *= rgbarr[1]-rgbarr[2];
			if (h < 0)
				h += 1;
		} else if (maxrgb == rgbarr[1]) {
			h *= rgbarr[2]-rgbarr[0];
			h += 1/3;
		} else if (maxrgb == rgbarr[2]) {
			h *= rgbarr[0]-rgbarr[1];
			h += 2/3;
		}
		return [h, s, l];
	}
}

// hsl->rgb code by http://www.geekymonkey.com/Programming/CSharp/RGB2HSL_HSL2RGB.htm
function hslToRgb(hslarr) {
	if (hslarr[2] <= 0)
		return [0,0,0];
	else if (hslarr[2] >= 1)
		return [1,1,1];
	if (hslarr[1] == 0)
		return [hslarr[2],hslarr[2],hslarr[2]];
	
	var v = (hslarr[2] <= 0.5) ? (hslarr[2] * (1 + hslarr[1])) : (hslarr[2] + hslarr[1] - hslarr[2] * hslarr[1]);
	var m = 2*hslarr[2] - v;
	var sv = (v - m ) / v;
	var h = hslarr[0]*6;
	var sextant = h >>> 0;
	var fract = h - sextant;
	var vsf = v * sv * fract;
	var mid1 = m + vsf;
	var mid2 = v - vsf;
	var r, g, b;
	
	switch (sextant) {
		case 0:
			r = v;
			g = mid1;
			b = m;
			break;
		case 1:
			r = mid2;
			g = v;
			b = m;
			break;
		case 2:
			r = m;
			g = v;
			b = mid1;
			break;
		case 3:
			r = m;
			g = mid2;
			b = v;
			break;
		case 4:
			r = mid1;
			g = m;
			b = v;
			break;
		case 5:
			r = v;
			g = m;
			b = mid2;
			break;
	}
	
	if (r < 0) r = 0;
	if (r > 1) r = 1;
	if (g < 0) g = 0;
	if (g > 1) g = 1;
	if (b < 0) b = 0;
	if (b > 1) b = 1;
	
	return [r, g, b];
}

function darkerMul (rgb) {
	return numToColor((colorToNum(rgb) & 0xFEFEFE) >>> 1);
}

function darker (rgb) {
	var hsl = rgbToHsl(numToRgb(colorToNum(rgb)));
	hsl[2] -= 0.2;
	return numToColor(rgbToNum(hslToRgb(hsl)));
}

function brighter (rgb) {
	var hsl = rgbToHsl(numToRgb(colorToNum(rgb)));
	hsl[2] += 0.2;
	return numToColor(rgbToNum(hslToRgb(hsl)));
}

function getColor (color_name) {
	var colors = {
		aliceblue: "#f0f8ff", antiquewhite: "#faebd7", aqua: "#00ffff", aquamarine: "#7fffd4", azure: "#f0ffff", beige: "#f5f5dc", bisque: "#ffe4c4", black: "#000000",
		blanchedalmond: "#ffebcd", blue: "#0000ff", blueviolet: "#8a2be2", brown: "#a52a2a", burlywood: "#deb887", cadetblue: "#5f9ea0", chartreuse: "#7fff00", chocolate: "#d2691e", 
		coral: "#ff7f50", cornflowerblue: "#6495ed", cornsilk: "#fff8dc", crimson: "#dc143c", cyan: "#00ffff", darkblue: "#00008b", darkcyan: "#008b8b", 
		darkgoldenrod: "#b8860b", darkgray: "#a9a9a9", darkgreen: "#006400", darkkhaki: "#bdb76b", darkmagenta: "#8b008b", darkolivegreen: "#556b2f", darkorange: "#ff8c00", 
		darkorchid: "#9932cc", darkred: "#8b0000", darksalmon: "#e9967a", darkseagreen: "#8fbc8f", darkslateblue: "#483d8b", darkslategray: "#2f4f4f", darkturquoise: "#00ced1", 
		darkviolet: "#9400d3", deeppink: "#ff1493", deepskyblue: "#00bfff", dimgray: "#696969", dodgerblue: "#1e90ff", feldspar: "#d19275", firebrick: "#b22222", 
		floralwhite: "#fffaf0", forestgreen: "#228b22", fuchsia: "#ff00ff", gainsboro: "#dcdcdc", ghostwhite: "#f8f8ff", gold: "#ffd700", goldenrod: "#daa520", gray: "#808080",
		green: "#008000", greenyellow: "#adff2f", honeydew: "#f0fff0", hotpink: "#ff69b4", indianred : "#cd5c5c", indigo : "#4b0082", ivory: "#fffff0", khaki: "#f0e68c", 
		lavender: "#e6e6fa", lavenderblush: "#fff0f5", lawngreen: "#7cfc00", lemonchiffon: "#fffacd", lightblue: "#add8e6", lightcoral: "#f08080", lightcyan: "#e0ffff", 
		lightgoldenrodyellow: "#fafad2", lightgrey: "#d3d3d3", lightgreen: "#90ee90", lightpink: "#ffb6c1", lightsalmon: "#ffa07a", lightseagreen: "#20b2aa", 
		lightskyblue: "#87cefa", lightslateblue: "#8470ff", lightslategray: "#778899", lightsteelblue: "#b0c4de", lightyellow: "#ffffe0", lime: "#00ff00", limegreen: "#32cd32", 
		linen: "#faf0e6", magenta: "#ff00ff", maroon: "#800000", mediumaquamarine: "#66cdaa", mediumblue: "#0000cd", mediumorchid: "#ba55d3", mediumpurple: "#9370d8", 
		mediumseagreen: "#3cb371", mediumslateblue: "#7b68ee", mediumspringgreen: "#00fa9a", mediumturquoise: "#48d1cc", mediumvioletred: "#c71585", midnightblue: "#191970", 
		mintcream: "#f5fffa", mistyrose: "#ffe4e1", moccasin: "#ffe4b5", navajowhite: "#ffdead", navy: "#000080", oldlace: "#fdf5e6", olive: "#808000", olivedrab: "#6b8e23", 
		orange: "#ffa500", orangered: "#ff4500", orchid: "#da70d6", palegoldenrod: "#eee8aa", palegreen: "#98fb98", paleturquoise: "#afeeee", palevioletred: "#d87093", 
		papayawhip: "#ffefd5", peachpuff: "#ffdab9", peru: "#cd853f", pink: "#ffc0cb", plum: "#dda0dd", powderblue: "#b0e0e6", purple: "#800080", red: "#ff0000", 
		rosybrown: "#bc8f8f", royalblue: "#4169e1", saddlebrown: "#8b4513", salmon: "#fa8072", sandybrown: "#f4a460", seagreen: "#2e8b57", seashell: "#fff5ee", sienna: "#a0522d", 
		silver: "#c0c0c0", skyblue: "#87ceeb", slateblue: "#6a5acd", slategray: "#708090", snow: "#fffafa", springgreen: "#00ff7f", steelblue: "#4682b4", tan: "#d2b48c", 
		teal: "#008080", thistle: "#d8bfd8", tomato: "#ff6347", turquoise: "#40e0d0", violet: "#ee82ee", violetred: "#d02090", wheat: "#f5deb3", white: "#ffffff", 
		whitesmoke: "#f5f5f5", yellow: "#ffff00", yellowgreen: "#9acd32"
    };
    
    color_name = color_name.toLowerCase();
    
	if (/^\#[0-9a-f]{6}$/.test(color_name))
		return color_name;
	else if (color_name in colors)
		return colors[color_name];
	else {
		color_name = color_name.replace(/[^0-9a-f]/g,'');
		if (color_name.length >= 6)
			return '#' + color_name.substr(0,6);
		else if (color_name.length == 3)
			return "#" + color_name.charAt(0) + color_name.substr(0,2) + color_name.substr(1,2) + color_name.charAt(2);
		else
			return "#000000";
	}
}
