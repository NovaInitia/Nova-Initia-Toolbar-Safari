/*
algorithms.js
Modified versions of functions from nova-initia_algorithms.js and other tidbits.

-Ryan
*/

// Turns a URL into a pair of hashes.
// Input is expected to be in the format "proto://domain/path?qs#ignored"
//   where the path and query string are optional, and everything after the
//   hash is ignored.
// Return value is an object containing two base32 strings (see rfc3548), both
// of length 26.  The two values are under keys "domain" and "url"
function UrlToHash(url,doHash)
{
	// Make sure it's a URL, and strip the bits we don't care about.
	
	
	//To Lowercase causes problems
	//url = url.toLowerCase();
	
	/* Regex:
		^[a-z]+:\/\/							Protocol
		[a-z][-a-z0-9]+(\.[a-z][-a-z0-9]+)+		Domain name
		($|\/|\?)?[^#]*							Everything else up to the #
	*/
	url = /^[a-z]+:\/\/([a-z0-9][-a-z0-9]+(\.[a-z0-9][-a-z0-9]+)+)[^_]($|\/|\?)?[^#]*/.exec(url);
	if (!url)
		return(false);
	var domain = url[1];
	url = url[0];
	
	if(doHash)
		return({"domain":base32md5(domain),"url":base32md5(url)});
	else
		return(url);
}

//just call these
function getHashedURL(theURL)
{
	var url_and_domain = UrlToHash(theURL, true);
	var url_hash = url_and_domain['url'];
	return url_hash;
}
function getHashedDomain(theURL)
{
	var url_and_domain = UrlToHash(theURL, true);
	var domain_hash = url_and_domain['domain'];
	return domain_hash;
}

//
//The following 2 functions replace the above one
//

//
function standardizeURL(url)
{
	// Make sure it's a URL, and strip the bits we don't care about.
	
	
	//To Lowercase causes problems
	//url = url.toLowerCase();
	
	/* Regex:
		^[a-z]+:\/\/							Protocol
		[a-z][-a-z0-9]+(\.[a-z][-a-z0-9]+)+		Domain name
		($|\/|\?)?[^#]*							Everything else up to the #
	*/
	url = /^[a-z]+:\/\/([a-z0-9][-a-z0-9]+(\.[a-z0-9][-a-z0-9]+)+)[^_]($|\/|\?)?[^#]*/.exec(url);
	if (!url)
		return(false);
	var domain = url[1];
	url = url[0];

	return(url);
}
function hashURL(url)
{
	url = /^[a-z]+:\/\/([a-z0-9][-a-z0-9]+(\.[a-z0-9][-a-z0-9]+)+)[^_]($|\/|\?)?[^#]*/.exec(url);
	if (!url)
		return(false);
	var domain = url[1];
	url = url[0];

	return({"domain":base32md5(domain),"url":base32md5(url)});
}

//
// end
//

// Takes a string, md5's it, and turns it into base32.
function base32md5(data)
{
	var hex = MD5(data);
	
	if (hex.length != 32)
		return(false);
	
	// Convert base16 into base32.
	// (We ignore the =='s on the end, as the whole point is to make it shorter,
	// and we don't care about decoding it, and all are the same length).
	var b32 = "";
	for(var i = 0; i < 7; i++)
	{
		var b32tmp = parseInt(hex.substr(0,5),16).toString(32);
		while(b32tmp.length < (i==6?2:4))
			b32tmp = "0"+b32tmp;
		b32 += b32tmp; 
		hex = hex.substr(5);
	}
	
	return (b32);
}

function MD5(str)
{
	//from 2.3.0-md5.js

	// var hash = Crypto.MD5(str);
	var utf = Utf8Encode(str);
	var bytes = convertToByteArray(utf);
	var hash = Crypto.MD5(bytes, { asString: true });


	function toHexString(charCode)
	{
		return ("0" + charCode.toString(16)).slice(-2);
	}


	// convert the binary hash data to a hex string.
	var s = "";
	for(i in hash)
	{
		s += toHexString(hash.charCodeAt(i));
	}

	// var tmp = [];
	// for(i in hash)
	// {
	// 	tmp.push(toHexString(hash.charCodeAt(i)));
	// }
	// var s = tmp.join("");

	//Added for compatibility with TNN
	s = s.substr(0,32);
	return s;
}

function convertToByteArray2(str)
{
	var bytes = [];

	for (var i=0; i<str.length; ++i)
	{
		bytes.push(str.charCodeAt(i));
	}

	return bytes;
}

function convertToByteArray( str )
{
  var ch, st, re = [];
  for (var i = 0; i < str.length; i++ ) {
    ch = str.charCodeAt(i);  // get char 
    st = [];                 // set up "stack"
    do {
      st.push( ch & 0xFF );  // push byte to stack
      ch = ch >> 8;          // shift value down by 1 byte
    }  
    while ( ch );
    // add stack contents to result
    // done because chars have "wrong" endianness
    re = re.concat( st.reverse() );
  }
  // return an array of bytes
  return re;
}

function Utf8Encode(string)
{
	string = string.replace(/\r\n/g,"\n");
	var utftext = "";

	for (var n = 0; n < string.length; n++)
	{
		var c = string.charCodeAt(n);

		if (c < 128)
		{
			utftext += String.fromCharCode(c);
		}
		else if((c > 127) && (c < 2048))
		{
			utftext += String.fromCharCode((c >> 6) | 192);
			utftext += String.fromCharCode((c & 63) | 128);
		}
		else
		{
			utftext += String.fromCharCode((c >> 12) | 224);
			utftext += String.fromCharCode(((c >> 6) & 63) | 128);
			utftext += String.fromCharCode((c & 63) | 128);
		}
	}
	return utftext;
}

//
//URL encoding and decoding for Doorways:
//

function urlencode(str)
{
    // URL-encodes string  
    // 
    // version: 910.813
    // discuss at: http://phpjs.org/functions/urlencode
    // +   original by: Philip Peterson
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +      input by: AJ
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   improved by: Brett Zamir (http://brett-zamir.me)
    // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +      input by: travc
    // +      input by: Brett Zamir (http://brett-zamir.me)
    // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   improved by: Lars Fischer
    // +      input by: Ratheous
    // +      reimplemented by: Brett Zamir (http://brett-zamir.me)
    // +   bugfixed by: Joris
    // %          note 1: This reflects PHP 5.3/6.0+ behavior
    // *     example 1: urlencode('Kevin van Zonneveld!');
    // *     returns 1: 'Kevin+van+Zonneveld%21'
    // *     example 2: urlencode('http://kevin.vanzonneveld.net/');
    // *     returns 2: 'http%3A%2F%2Fkevin.vanzonneveld.net%2F'
    // *     example 3: urlencode('http://www.google.nl/search?q=php.js&ie=utf-8&oe=utf-8&aq=t&rls=com.ubuntu:en-US:unofficial&client=firefox-a');
    // *     returns 3: 'http%3A%2F%2Fwww.google.nl%2Fsearch%3Fq%3Dphp.js%26ie%3Dutf-8%26oe%3Dutf-8%26aq%3Dt%26rls%3Dcom.ubuntu%3Aen-US%3Aunofficial%26client%3Dfirefox-a'
    var hexStr = function (dec) {
        return '%' + (dec < 16 ? '0' : '') + dec.toString(16).toUpperCase();
    };

    var ret = '',
            unreserved = /[\w.-]/; // A-Za-z0-9_.- // Tilde is not here for historical reasons; to preserve it, use rawurlencode instead
    str = (str+'').toString();

    for (var i = 0, dl = str.length; i < dl; i++) {
        var ch = str.charAt(i);
        if (unreserved.test(ch)) {
            ret += ch;
        }
        else {
            var code = str.charCodeAt(i);
            if (0xD800 <= code && code <= 0xDBFF) { // High surrogate (could change last hex to 0xDB7F to treat high private surrogates as single characters); https://developer.mozilla.org/index.php?title=en/Core_JavaScript_1.5_Reference/Global_Objects/String/charCodeAt
                ret += ((code - 0xD800) * 0x400) + (str.charCodeAt(i+1) - 0xDC00) + 0x10000;
                i++; // skip the next one as we just retrieved it as a low surrogate
            }
            // We never come across a low surrogate because we skip them, unless invalid
            // Reserved assumed to be in UTF-8, as in PHP
            else if (code === 32) {
                ret += '+'; // %20 in rawurlencode
            }
            else if (code < 128) { // 1 byte
                ret += hexStr(code);
            }
            else if (code >= 128 && code < 2048) { // 2 bytes
                ret += hexStr((code >> 6) | 0xC0);
                ret += hexStr((code & 0x3F) | 0x80);
            }
            else if (code >= 2048) { // 3 bytes (code < 65536)
                ret += hexStr((code >> 12) | 0xE0);
                ret += hexStr(((code >> 6) & 0x3F) | 0x80);
                ret += hexStr((code & 0x3F) | 0x80);
            }
        }
    }
    return ret;
}

function urldecode(str)
{
    // Decodes URL-encoded string  
    // 
    // version: 909.322
    // discuss at: http://phpjs.org/functions/urldecode
    // +   original by: Philip Peterson
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +      input by: AJ
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   improved by: Brett Zamir (http://brett-zamir.me)
    // +      input by: travc
    // +      input by: Brett Zamir (http://brett-zamir.me)
    // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   improved by: Lars Fischer
    // +      input by: Ratheous
    // +   improved by: Orlando
    // %        note 1: info on what encoding functions to use from: http://xkr.us/articles/javascript/encode-compare/
    // *     example 1: urldecode('Kevin+van+Zonneveld%21');
    // *     returns 1: 'Kevin van Zonneveld!'
    // *     example 2: urldecode('http%3A%2F%2Fkevin.vanzonneveld.net%2F');
    // *     returns 2: 'http://kevin.vanzonneveld.net/'
    // *     example 3: urldecode('http%3A%2F%2Fwww.google.nl%2Fsearch%3Fq%3Dphp.js%26ie%3Dutf-8%26oe%3Dutf-8%26aq%3Dt%26rls%3Dcom.ubuntu%3Aen-US%3Aunofficial%26client%3Dfirefox-a');
    // *     returns 3: 'http://www.google.nl/search?q=php.js&ie=utf-8&oe=utf-8&aq=t&rls=com.ubuntu:en-US:unofficial&client=firefox-a'
    
    var hash_map = {}, ret = str.toString(), unicodeStr='', hexEscStr='';
    
    var replacer = function (search, replace, str) {
        var tmp_arr = [];
        tmp_arr = str.split(search);
        return tmp_arr.join(replace);
    };
    
    // The hash_map is identical to the one in urlencode.
    hash_map["'"]   = '%27';
    hash_map['(']   = '%28';
    hash_map[')']   = '%29';
    hash_map['*']   = '%2A';
    hash_map['~']   = '%7E';
    hash_map['!']   = '%21';
    hash_map['%20'] = '+';
    hash_map['\u00DC'] = '%DC';
    hash_map['\u00FC'] = '%FC';
    hash_map['\u00C4'] = '%D4';
    hash_map['\u00E4'] = '%E4';
    hash_map['\u00D6'] = '%D6';
    hash_map['\u00F6'] = '%F6';
    hash_map['\u00DF'] = '%DF';
    hash_map['\u20AC'] = '%80';
    hash_map['\u0081'] = '%81';
    hash_map['\u201A'] = '%82';
    hash_map['\u0192'] = '%83';
    hash_map['\u201E'] = '%84';
    hash_map['\u2026'] = '%85';
    hash_map['\u2020'] = '%86';
    hash_map['\u2021'] = '%87';
    hash_map['\u02C6'] = '%88';
    hash_map['\u2030'] = '%89';
    hash_map['\u0160'] = '%8A';
    hash_map['\u2039'] = '%8B';
    hash_map['\u0152'] = '%8C';
    hash_map['\u008D'] = '%8D';
    hash_map['\u017D'] = '%8E';
    hash_map['\u008F'] = '%8F';
    hash_map['\u0090'] = '%90';
    hash_map['\u2018'] = '%91';
    hash_map['\u2019'] = '%92';
    hash_map['\u201C'] = '%93';
    hash_map['\u201D'] = '%94';
    hash_map['\u2022'] = '%95';
    hash_map['\u2013'] = '%96';
    hash_map['\u2014'] = '%97';
    hash_map['\u02DC'] = '%98';
    hash_map['\u2122'] = '%99';
    hash_map['\u0161'] = '%9A';
    hash_map['\u203A'] = '%9B';
    hash_map['\u0153'] = '%9C';
    hash_map['\u009D'] = '%9D';
    hash_map['\u017E'] = '%9E';
    hash_map['\u0178'] = '%9F';
    hash_map['\u00C6'] = '%C3%86';
    hash_map['\u00D8'] = '%C3%98';
    hash_map['\u00C5'] = '%C3%85';

    for (unicodeStr in hash_map) {
        hexEscStr = hash_map[unicodeStr]; // Switch order when decoding
        ret = replacer(hexEscStr, unicodeStr, ret); // Custom replace. No regexing
    }
    
    // End with decodeURIComponent, which most resembles PHP's encoding functions
    ret = decodeURIComponent(ret);

    return ret;
}
