/*
 * 42TinyJS
 *
 * A fork of TinyJS with the goal to makes a more JavaScript/ECMA compliant engine
 *
 * Authored By Armin Diedering <armin@diedering.de>
 *
 * Copyright (C) 2010-2014 ardisoft
 *
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

#include <algorithm>
#include <stdio.h>
#include "TinyJS.h"

#ifdef __x86_64__
#define EVILCAST(X) static_cast<int32_t>((int64_t)(X))
#else
#define EVILCAST(X) static_cast<int32_t>(X)
#endif

#define FROMUDATA EVILCAST(userdata)

using namespace std;
// ----------------------------------------------- Actual Functions

#define CheckObjectCoercible(var) do { \
		if(var->isUndefined() || var->isNull())\
			c->throwError(TypeError, "can't convert undefined to object");\
	}while(0) 

static string this2string(const CFunctionsScopePtr &c) {
	CScriptVarPtr This = c->getArgument("this");
	CheckObjectCoercible(This);
	return This->toString();
}

static void scStringCharAt(const CFunctionsScopePtr &c, void *) {
	string str = this2string(c);
	int p = c->getArgument("pos")->toNumber().toInt32();
	if (p>=0 && p<(int)str.length())
		c->setReturnVar(c->newScriptVar(str.substr(p, 1)));
	else
		c->setReturnVar(c->newScriptVar(""));
}

static void scStringCharCodeAt(const CFunctionsScopePtr &c, void *) {
	string str = this2string(c);
	int p = c->getArgument("pos")->toNumber().toInt32();
	if (p>=0 && p<(int)str.length())
		c->setReturnVar(c->newScriptVar((unsigned char)str.at(p)));
	else
		c->setReturnVar(c->constScriptVar(NaN));
}

static void scStringConcat(const CFunctionsScopePtr &c, void *userdata) {
	int length = c->getArgumentsLength();
	string str = this2string(c);
	for(int i=FROMUDATA; i<length; i++)
		str.append(c->getArgument(i)->toString());
	c->setReturnVar(c->newScriptVar(str));
}

static void scStringIndexOf(const CFunctionsScopePtr &c, void *userdata) {
	string str = this2string(c);
	string search = c->getArgument("search")->toString();
	CNumber pos_n = c->getArgument("pos")->toNumber();
	string::size_type pos;
	pos = (userdata) ? string::npos : 0;
	if(pos_n.sign()<0) pos = 0;
	else if(pos_n.isInfinity()) pos = string::npos;
	else if(pos_n.isFinite()) pos = pos_n.toInt32();
	string::size_type p = (userdata==0) ? str.find(search, pos) : str.rfind(search, pos);
	int val = (p==string::npos) ? -1 : p;
	c->setReturnVar(c->newScriptVar(val));
}

static void scStringLocaleCompare(const CFunctionsScopePtr &c, void *userdata) {
	string str = this2string(c);
	string compareString = c->getArgument("compareString")->toString();
	int val = 0;
	if(str<compareString) val = -1;
	else if(str>compareString) val = 1;
	c->setReturnVar(c->newScriptVar(val));
}

static void scStringQuote(const CFunctionsScopePtr &c, void *userdata) {
	string str = this2string(c);
	c->setReturnVar(c->newScriptVar(getJSString(str)));
}

static bool charcmp (char i, char j) { return (i==j); }
static bool charicmp (char i, char j) { return (toupper(i)==toupper(j)); }
// helper-function for replace search
static bool string_search(const string &str, const string::const_iterator &search_begin, const string &substr, bool ignoreCase, bool sticky, string::const_iterator &match_begin, string::const_iterator &match_end) {
	bool (*cmp)(char,char) = ignoreCase ? charicmp : charcmp;
	if(sticky) {
		match_begin = match_end = search_begin;
		string::const_iterator s1e=str.end();
		string::const_iterator s2=substr.begin(), s2e=substr.end();
		while(match_end!=s1e && s2!=s2e && cmp(*match_end++, *s2++));
		return s2==s2e;
	} 
	match_begin = search(search_begin, str.end(), substr.begin(), substr.end(), cmp);
	if(match_begin==str.end()) return false;
	match_end = match_begin + substr.length();
	return true;
}
//************************************
// Method:    getRegExpData
// FullName:  getRegExpData
// Access:    public static 
// Returns:   bool true if regexp-param=RegExp-Object / other false
// Qualifier:
// Parameter: const CFunctionsScopePtr & c
// Parameter: const string & regexp - parameter name of the regexp
// Parameter: bool noUndefined - true an undefined regexp aims in "" else in "undefined"
// Parameter: const string & flags - parameter name of the flags
// Parameter: string & substr - rgexp.source
// Parameter: bool & global
// Parameter: bool & ignoreCase
// Parameter: bool & sticky
//************************************
static CScriptVarPtr getRegExpData(const CFunctionsScopePtr &c, const string &regexp, bool noUndefined, const char *flags_argument, string &substr, bool &global, bool &ignoreCase, bool &sticky) {
	CScriptVarPtr regexpVar = c->getArgument(regexp);
	if(regexpVar->isRegExp()) return CScriptVarPtr();

	substr.clear();
	if(!noUndefined || !regexpVar->isUndefined()) substr = regexpVar->toString();
	CScriptVarPtr flagVar;
	if(flags_argument && (flagVar = c->getArgument(flags_argument)) && !flagVar->isUndefined()) {
		string flags = flagVar->toString();
		string::size_type pos = flags.find_first_not_of("gimy");
		if(pos != string::npos) {
			c->throwError(SyntaxError, string("invalid regular expression flag ")+flags[pos]);
		}
		global = flags.find_first_of('g')!=string::npos;
		ignoreCase = flags.find_first_of('i')!=string::npos;
		sticky = flags.find_first_of('y')!=string::npos;
	} else
		global = ignoreCase = sticky = false;

	return CScriptVarPtr();
}

static void scStringReplace(const CFunctionsScopePtr &c, void *) {
	const string str = this2string(c);
	CScriptVarPtr newsubstrVar = c->getArgument("newsubstr");
	string substr, ret_str;
	bool global, ignoreCase, sticky;
	bool isRegExp = getRegExpData(c, "substr", false, "flags", substr, global, ignoreCase, sticky);
	if(isRegExp && !newsubstrVar->isFunction()) {
	} else {
		bool (*search)(const string &, const string::const_iterator &, const string &, bool, bool, string::const_iterator &, string::const_iterator &);
		search = string_search;
		string newsubstr;
		vector<CScriptVarPtr> arguments;
		if(!newsubstrVar->isFunction()) 
			newsubstr = newsubstrVar->toString();
		global = global && substr.length();
		string::const_iterator search_begin=str.begin(), match_begin, match_end;
		if(search(str, search_begin, substr, ignoreCase, sticky, match_begin, match_end)) {
			do {
				ret_str.append(search_begin, match_begin);
				if(newsubstrVar->isFunction()) {
					arguments.push_back(c->newScriptVar(string(match_begin, match_end)));
					newsubstr = c->getContext()->callFunction(newsubstrVar, arguments, c)->toString();
					arguments.pop_back();
				}
				ret_str.append(newsubstr);
#if 1 /* Fix from "vcmpeq" (see Issue 14) currently untested */
				if (match_begin == match_end) {
					if (search_begin != str.end())
						++search_begin;
					else
						break;
				} else {
					search_begin = match_end;
				}
#else
				search_begin = match_end;
#endif
			} while(global && search(str, search_begin, substr, ignoreCase, sticky, match_begin, match_end));
		}
		ret_str.append(search_begin, str.end());
	}
	c->setReturnVar(c->newScriptVar(ret_str));
}

static void scStringSearch(const CFunctionsScopePtr &c, void *userdata) {
	string str = this2string(c);

	string substr;
	bool global, ignoreCase, sticky;
	getRegExpData(c, "regexp", true, "flags", substr, global, ignoreCase, sticky);
	string::const_iterator search_begin=str.begin(), match_begin, match_end;
	c->setReturnVar(c->newScriptVar(string_search(str, search_begin, substr, ignoreCase, sticky, match_begin, match_end)?match_begin-search_begin:-1));
}

static void scStringSlice(const CFunctionsScopePtr &c, void *userdata) {
	string str = this2string(c);
	int length = c->getArgumentsLength()-(FROMUDATA & 1);
	bool slice = (FROMUDATA & 2) == 0;
	int start = c->getArgument("start")->toNumber().toInt32();
	int end = (int)str.size();
	if(slice && start<0) start = str.size()+start;
	if(length>1) {
		end = c->getArgument("end")->toNumber().toInt32();
		if(slice && end<0) end = str.size()+end;
	}
	if(!slice && end < start) { end^=start; start^=end; end^=start; }
	if(start<0) start = 0;
	if(start>=(int)str.size()) 
		c->setReturnVar(c->newScriptVar(""));
	else if(end <= start)
		c->setReturnVar(c->newScriptVar(""));
	else
		c->setReturnVar(c->newScriptVar(str.substr(start, end-start)));
}

static void scStringSplit(const CFunctionsScopePtr &c, void *) {
	const string str = this2string(c);

	string seperator;
	bool global, ignoreCase, sticky;
	getRegExpData(c, "separator", true, 0, seperator, global, ignoreCase, sticky);
		
	CScriptVarPtr sep_var = c->getArgument("separator");
	CScriptVarPtr limit_var = c->getArgument("limit");
	int limit = limit_var->isUndefined() ? 0x7fffffff : limit_var->toNumber().toInt32();

	CScriptVarPtr result(newScriptVar(c->getContext(), Array));
	c->setReturnVar(result);
	if(limit == 0)
		return;
	else if(!str.size() || sep_var->isUndefined()) {
		result->setArrayIndex(0, c->newScriptVar(str));
		return;
	}
	if(seperator.size() == 0) {
		for(int i=0; i<min((int)str.size(), limit); ++i)
			result->setArrayIndex(i, c->newScriptVar(str.substr(i,1)));
		return;
	}
	int length = 0;
	string::const_iterator search_begin=str.begin(), match_begin, match_end;
	bool found=true;
	while(found) {
			found = string_search(str, search_begin, seperator, ignoreCase, sticky, match_begin, match_end);
		string f;
		if(found) {
			result->setArrayIndex(length++, c->newScriptVar(string(search_begin, match_begin)));
			if(length>=limit) break;
			search_begin = match_end;
		} else {
			result->setArrayIndex(length++, c->newScriptVar(string(search_begin,str.end())));
			if(length>=limit) break;
		}
	}
}

static void scStringSubstr(const CFunctionsScopePtr &c, void *userdata) {
	string str = this2string(c);
	int length = c->getArgumentsLength()-FROMUDATA;
	int start = c->getArgument("start")->toNumber().toInt32();
	if(start<0 || start>=(int)str.size()) 
		c->setReturnVar(c->newScriptVar(""));
	else if(length>1) {
		int length = c->getArgument("length")->toNumber().toInt32();
		c->setReturnVar(c->newScriptVar(str.substr(start, length)));
	} else
		c->setReturnVar(c->newScriptVar(str.substr(start)));
}

static void scStringToLowerCase(const CFunctionsScopePtr &c, void *) {
	string str = this2string(c);
	transform(str.begin(), str.end(), str.begin(), ::tolower);
	c->setReturnVar(c->newScriptVar(str));
}

static void scStringToUpperCase(const CFunctionsScopePtr &c, void *) {
	string str = this2string(c);
	transform(str.begin(), str.end(), str.begin(), ::toupper);
	c->setReturnVar(c->newScriptVar(str));
}

static void scStringTrim(const CFunctionsScopePtr &c, void *userdata) {
	string str = this2string(c);
	string::size_type start = 0;
	string::size_type end = string::npos;
	if(((FROMUDATA) & 2) == 0) {
		start = str.find_first_not_of(" \t\r\n");
		if(start == string::npos) start = 0;
	}
	if(((FROMUDATA) & 1) == 0) {
		end = str.find_last_not_of(" \t\r\n");
		if(end != string::npos) end = 1+end-start;
	}
	c->setReturnVar(c->newScriptVar(str.substr(start, end)));
}

static void scCharToInt(const CFunctionsScopePtr &c, void *) {
	string str = c->getArgument("ch")->toString();;
	int val = 0;
	if (str.length()>0)
		val = (int)str.c_str()[0];
	c->setReturnVar(c->newScriptVar(val));
}

static void scStringFromCharCode(const CFunctionsScopePtr &c, void *userdata) {
	char str[2];
	str[0] = (FROMUDATA)? c->getArgument("this")->toNumber().toInt32() : c->getArgument("char")->toNumber().toInt32();
	str[1] = 0;
	c->setReturnVar(c->newScriptVar(str));
}

static void scStringFromFile(const CFunctionsScopePtr &c, void *) {
	string ret,str = this2string(c);
//	printf("ACHTUNG! << %s\n",str.c_str());

	FILE* f = fopen(str.c_str(),"r");
	if (f) {
		fseek(f,0,SEEK_END);
		size_t n = ftell(f);
		fseek(f,0,SEEK_SET);
//		printf("FILE IS %lu bytes LONG\n",n);
		ret.resize(n);
		fread(&(ret[0]),n,1,f);
		fclose(f);
	}

	c->setReturnVar(c->newScriptVar(ret));
}

// ----------------------------------------------- Register Functions
void registerStringFunctions(CTinyJS *tinyJS) {}
extern "C" void _registerStringFunctions(CTinyJS *tinyJS) {
	CScriptVarPtr fnc;
	// charAt
	tinyJS->addNative("function String.prototype.charAt(pos)", scStringCharAt, 0, SCRIPTVARLINK_BUILDINDEFAULT);
	tinyJS->addNative("function String.charAt(this,pos)", scStringCharAt, 0, SCRIPTVARLINK_BUILDINDEFAULT);
	// charCodeAt
	tinyJS->addNative("function String.prototype.charCodeAt(pos)", scStringCharCodeAt, 0, SCRIPTVARLINK_BUILDINDEFAULT);
	tinyJS->addNative("function String.charCodeAt(this,pos)", scStringCharCodeAt, 0, SCRIPTVARLINK_BUILDINDEFAULT);
	// concat
	tinyJS->addNative("function String.prototype.concat()", scStringConcat, 0, SCRIPTVARLINK_BUILDINDEFAULT);
	tinyJS->addNative("function String.concat(this)", scStringConcat, (void*)1, SCRIPTVARLINK_BUILDINDEFAULT);
	// indexOf
	tinyJS->addNative("function String.prototype.indexOf(search,pos)", scStringIndexOf, 0, SCRIPTVARLINK_BUILDINDEFAULT); // find the position of a string in a string, -1 if not
	tinyJS->addNative("function String.indexOf(this,search,pos)", scStringIndexOf, 0, SCRIPTVARLINK_BUILDINDEFAULT); // find the position of a string in a string, -1 if not
	// lastIndexOf
	tinyJS->addNative("function String.prototype.lastIndexOf(search,pos)", scStringIndexOf, (void*)-1, SCRIPTVARLINK_BUILDINDEFAULT); // find the last position of a string in a string, -1 if not
	tinyJS->addNative("function String.lastIndexOf(this,search,pos)", scStringIndexOf, (void*)-1, SCRIPTVARLINK_BUILDINDEFAULT); // find the last position of a string in a string, -1 if not
	// localeCompare
	tinyJS->addNative("function String.prototype.localeCompare(compareString)", scStringLocaleCompare, 0, SCRIPTVARLINK_BUILDINDEFAULT);
	tinyJS->addNative("function String.localeCompare(this,compareString)", scStringLocaleCompare, 0, SCRIPTVARLINK_BUILDINDEFAULT);
	// quote
	tinyJS->addNative("function String.prototype.quote()", scStringQuote, 0, SCRIPTVARLINK_BUILDINDEFAULT);
	tinyJS->addNative("function String.quote(this)", scStringQuote, 0, SCRIPTVARLINK_BUILDINDEFAULT);
	// replace
	tinyJS->addNative("function String.prototype.replace(substr, newsubstr, flags)", scStringReplace, 0, SCRIPTVARLINK_BUILDINDEFAULT);
	tinyJS->addNative("function String.replace(this, substr, newsubstr, flags)", scStringReplace, 0, SCRIPTVARLINK_BUILDINDEFAULT);
	// search
	tinyJS->addNative("function String.prototype.search(regexp, flags)", scStringSearch, 0, SCRIPTVARLINK_BUILDINDEFAULT);
	tinyJS->addNative("function String.search(this, regexp, flags)", scStringSearch, 0, SCRIPTVARLINK_BUILDINDEFAULT);
	// slice
	tinyJS->addNative("function String.prototype.slice(start,end)", scStringSlice, 0, SCRIPTVARLINK_BUILDINDEFAULT); // find the last position of a string in a string, -1 if not
	tinyJS->addNative("function String.slice(this,start,end)", scStringSlice, (void*)1, SCRIPTVARLINK_BUILDINDEFAULT); // find the last position of a string in a string, -1 if not
	// split
	tinyJS->addNative("function String.prototype.split(separator,limit)", scStringSplit, 0, SCRIPTVARLINK_BUILDINDEFAULT);
	tinyJS->addNative("function String.split(this,separator,limit)", scStringSplit, 0, SCRIPTVARLINK_BUILDINDEFAULT);
	// substr
	tinyJS->addNative("function String.prototype.substr(start,length)", scStringSubstr, 0, SCRIPTVARLINK_BUILDINDEFAULT);
	tinyJS->addNative("function String.substr(this,start,length)", scStringSubstr, (void*)1, SCRIPTVARLINK_BUILDINDEFAULT);
	// substring
	tinyJS->addNative("function String.prototype.substring(start,end)", scStringSlice, (void*)2, SCRIPTVARLINK_BUILDINDEFAULT);
	tinyJS->addNative("function String.substring(this,start,end)", scStringSlice, (void*)3, SCRIPTVARLINK_BUILDINDEFAULT);
	// toLowerCase toLocaleLowerCase currently the same function
	tinyJS->addNative("function String.prototype.toLowerCase()", scStringToLowerCase, 0, SCRIPTVARLINK_BUILDINDEFAULT);
	tinyJS->addNative("function String.toLowerCase(this)", scStringToLowerCase, 0, SCRIPTVARLINK_BUILDINDEFAULT);
	tinyJS->addNative("function String.prototype.toLocaleLowerCase()", scStringToLowerCase, 0, SCRIPTVARLINK_BUILDINDEFAULT);
	tinyJS->addNative("function String.toLocaleLowerCase(this)", scStringToLowerCase, 0, SCRIPTVARLINK_BUILDINDEFAULT);
	// toUpperCase toLocaleUpperCase currently the same function
	tinyJS->addNative("function String.prototype.toUpperCase()", scStringToUpperCase, 0, SCRIPTVARLINK_BUILDINDEFAULT);
	tinyJS->addNative("function String.toUpperCase(this)", scStringToUpperCase, 0, SCRIPTVARLINK_BUILDINDEFAULT);
	tinyJS->addNative("function String.prototype.toLocaleUpperCase()", scStringToUpperCase, 0, SCRIPTVARLINK_BUILDINDEFAULT);
	tinyJS->addNative("function String.toLocaleUpperCase(this)", scStringToUpperCase, 0, SCRIPTVARLINK_BUILDINDEFAULT);
	// trim
	tinyJS->addNative("function String.prototype.trim()", scStringTrim, 0, SCRIPTVARLINK_BUILDINDEFAULT);
	tinyJS->addNative("function String.trim(this)", scStringTrim, 0, SCRIPTVARLINK_BUILDINDEFAULT);
	// trimLeft
	tinyJS->addNative("function String.prototype.trimLeft()", scStringTrim, (void*)1, SCRIPTVARLINK_BUILDINDEFAULT);
	tinyJS->addNative("function String.trimLeft(this)", scStringTrim, (void*)1, SCRIPTVARLINK_BUILDINDEFAULT);
	// trimRight
	tinyJS->addNative("function String.prototype.trimRight()", scStringTrim, (void*)2, SCRIPTVARLINK_BUILDINDEFAULT);
	tinyJS->addNative("function String.trimRight(this)", scStringTrim, (void*)2, SCRIPTVARLINK_BUILDINDEFAULT);

	tinyJS->addNative("function charToInt(ch)", scCharToInt, 0, SCRIPTVARLINK_BUILDINDEFAULT); //  convert a character to an int - get its value
	
	tinyJS->addNative("function String.prototype.fromCharCode(char)", scStringFromCharCode, 0, SCRIPTVARLINK_BUILDINDEFAULT);
	tinyJS->addNative("function String.fromCharCode(this,char)", scStringFromCharCode, (void*)1, SCRIPTVARLINK_BUILDINDEFAULT);

	tinyJS->addNative("function String.prototype.fromFile()", scStringFromFile, 0, SCRIPTVARLINK_BUILDINDEFAULT);
}

