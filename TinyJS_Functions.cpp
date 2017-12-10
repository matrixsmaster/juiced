/*
 * TinyJS
 *
 * A single-file Javascript-alike engine
 *
 * - Useful language functions
 *
 * Authored By Gordon Williams <gw@pur3.co.uk>
 *
 * Copyright (C) 2009 Pur3 Ltd
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

#include "TinyJS_Functions.h"
#include <math.h>
#include <cstdlib>
#include <sstream>
#include <algorithm>
#include "haha.h"

using namespace std;
// ----------------------------------------------- Actual Functions
void scTrace(CScriptVar *c, void *userdata)
{
    CTinyJS *js = (CTinyJS*)userdata;
    js->root->trace();
}

void scObjectDump(CScriptVar *c, void *)
{
    c->getParameter("this")->trace("> ");
}

void scObjectClone(CScriptVar *c, void *)
{
    CScriptVar *obj = c->getParameter("this");
    c->getReturnVar()->copyValue(obj);
}

void scMathRand(CScriptVar *c, void *)
{
    c->getReturnVar()->setDouble((double)rand() / RAND_MAX);
}

void scMathRandInt(CScriptVar *c, void *)
{
    int min = c->getParameter("min")->getInt();
    int max = c->getParameter("max")->getInt();
    int val = min + (int)(rand() % (1 + max - min));
    c->getReturnVar()->setInt(val);
}

void scCharToInt(CScriptVar *c, void *)
{
    string str = c->getParameter("ch")->getString();;
    int val = 0;
    if(str.length() > 0)
        val = (int)str.c_str()[0];
    c->getReturnVar()->setInt(val);
}

void scStringIndexOf(CScriptVar *c, void *)
{
    string str = c->getParameter("this")->getString();
    string search = c->getParameter("search")->getString();
    size_t p = str.find(search);
    int val = (p == string::npos) ? -1 : p;
    c->getReturnVar()->setInt(val);
}

void scStringSubstring(CScriptVar *c, void *)
{
    string str = c->getParameter("this")->getString();
    int lo = c->getParameter("lo")->getInt();
    int hi = c->getParameter("hi")->getInt();

    int l = hi - lo;
    if(l > 0 && lo >= 0 && lo + l <= (int)str.length())
        c->getReturnVar()->setString(str.substr(lo, l));
    else
        c->getReturnVar()->setString("");
}

void scStringCharAt(CScriptVar *c, void *)
{
    string str = c->getParameter("this")->getString();
    int p = c->getParameter("pos")->getInt();
    if(p >= 0 && p < (int)str.length())
        c->getReturnVar()->setString(str.substr(p, 1));
    else
        c->getReturnVar()->setString("");
}

void scStringCharCodeAt(CScriptVar *c, void *)
{
    string str = c->getParameter("this")->getString();
    int p = c->getParameter("pos")->getInt();
    if(p >= 0 && p < (int)str.length())
        c->getReturnVar()->setInt(str.at(p));
    else
        c->getReturnVar()->setInt(0);
}

void scStringSplit(CScriptVar *c, void *)
{
    string str = c->getParameter("this")->getString();
    string sep = c->getParameter("separator")->getString();
    CScriptVar *result = c->getReturnVar();
    result->setArray();
    int length = 0;

    size_t pos = str.find(sep);
    while(pos != string::npos)
    {
        result->setArrayIndex(length++, new CScriptVar(str.substr(0, pos)));
        str = str.substr(pos + 1);
        pos = str.find(sep);
    }

    if(str.size() > 0)
        result->setArrayIndex(length++, new CScriptVar(str));
}

void scStringFromCharCode(CScriptVar *c, void *)
{
    char str[2];
    str[0] = c->getParameter("char")->getInt();
    str[1] = 0;
    c->getReturnVar()->setString(str);
}

void scIntegerParseInt(CScriptVar *c, void *)
{
    string str = c->getParameter("str")->getString();
    int val = strtol(str.c_str(), 0, 0);
    c->getReturnVar()->setInt(val);
}

void scIntegerValueOf(CScriptVar *c, void *)
{
    string str = c->getParameter("str")->getString();

    int val = 0;
    if(str.length() == 1)
        val = str[0];
    c->getReturnVar()->setInt(val);
}

void scJSONStringify(CScriptVar *c, void *)
{
    std::ostringstream result;
    c->getParameter("obj")->getJSON(result);
    c->getReturnVar()->setString(result.str());
}

void scExec(CScriptVar *c, void *data)
{
    CTinyJS *tinyJS = (CTinyJS *)data;
    std::string str = c->getParameter("jsCode")->getString();
    tinyJS->execute(str);
}

void scEval(CScriptVar *c, void *data)
{
    CTinyJS *tinyJS = (CTinyJS *)data;
    std::string str = c->getParameter("jsCode")->getString();
    c->setReturnVar(tinyJS->evaluateComplex(str).var);
}

void scArrayContains(CScriptVar *c, void *data)
{
    CScriptVar *obj = c->getParameter("obj");

    bool contains = false;
    RANGED_FOR(LinkChildType,it,c->getParameter("this")->children)
//    for(auto& it : c->getParameter("this")->children) {
        CScriptVarLink* v = it_->second;
        if(v->var->equals(obj))
        {
            contains = true;
            break;
        }
    }

    c->getReturnVar()->setInt(contains);
}

void scArrayRemove(CScriptVar *c, void *data)
{
    // The implementation for this function is straight garbage.
    // There has to be a better way to keep the linked list and map
    // synced up, as well as keep link names and keys consistent, but 
    // I was unable to come up with one. This may be in part because 
    // the linked-list based algorithm only worked because of implementation
    // details and left extra children in the array, and this algorithm
    // is more or less based on that one.
    CScriptVar *obj = c->getParameter("obj");
    vector<int> removedIndices;
    vector<CScriptVarLink*> children;
    // remove
    CScriptVar* var = c->getParameter("this");
    children = var->orderedChildren();
    RANGED_FOR(std::vector<CScriptVarLink*>,child,children)
//    for(auto& child : children) {
        if((*child_)->var->equals(obj))
        {
            removedIndices.push_back((*child_)->getIntName());
            var->removeLink(*child_); // this also deletes the link
        }
    }
    if(removedIndices.empty())
        return;

    // refetch the list of children since some have been deleted
    children = var->orderedChildren();
    // renumber
    RANGED_FOR(std::vector<CScriptVarLink*>,child,children)
//    for(auto& child : children) {
        int n = (*child_)->getIntName();
        int newn = n;
        for(size_t i = 0; i < removedIndices.size(); i++)
            if(n >= removedIndices[i])
                newn--;
        if(newn != n)
        {
        	(*child_)->setIntName(newn);
            // fix up keys in the map
            CScriptVarLink* link = var->addChildNoDup((*child_)->name, (*child_)->var);
            link->name = (*child_)->name;
        }
    }
    // we need to eliminate children that are stale
    // (ie children whose name does not match their key)
    // however we cannot do that while iterating over the map
    children.clear(); // reuse children
    RANGED_FOR(LinkChildType,pair,var->children)
//    for(auto& pair : var->children)
        if(pair_->first != pair_->second->name)
        {
            // it is impossible to delete an element using the
            // given methods if the link's name does not match
            // the key's name.
            pair_->second->name = pair_->first;
            children.push_back(pair_->second);
        }
    }
    RANGED_FOR(std::vector<CScriptVarLink*>,child,children)
//    for(auto& child : children)
        var->removeLink(*child_);
    }
}

void scArrayJoin(CScriptVar *c, void *data)
{
    string sep = c->getParameter("separator")->getString();
    CScriptVar *arr = c->getParameter("this");

    ostringstream sstr;
    int l = arr->getArrayLength();
    for(int i = 0; i < l; i++)
    {
        if(i > 0) sstr << sep;
        sstr << arr->getArrayIndex(i)->getString();
    }

    c->getReturnVar()->setString(sstr.str());
}

// ----------------------------------------------- Register Functions
void registerFunctions(CTinyJS *tinyJS)
{
    tinyJS->addNative("function exec(jsCode)", scExec, tinyJS); // execute the given code
    tinyJS->addNative("function eval(jsCode)", scEval, tinyJS); // execute the given string (an expression) and return the result
    tinyJS->addNative("function trace()", scTrace, tinyJS);
    tinyJS->addNative("function Object.dump()", scObjectDump, 0);
    tinyJS->addNative("function Object.clone()", scObjectClone, 0);
    tinyJS->addNative("function Math.rand()", scMathRand, 0);
    tinyJS->addNative("function Math.randInt(min, max)", scMathRandInt, 0);
    tinyJS->addNative("function charToInt(ch)", scCharToInt, 0); //  convert a character to an int - get its value
    tinyJS->addNative("function String.indexOf(search)", scStringIndexOf, 0); // find the position of a string in a string, -1 if not
    tinyJS->addNative("function String.substring(lo,hi)", scStringSubstring, 0);
    tinyJS->addNative("function String.charAt(pos)", scStringCharAt, 0);
    tinyJS->addNative("function String.charCodeAt(pos)", scStringCharCodeAt, 0);
    tinyJS->addNative("function String.fromCharCode(char)", scStringFromCharCode, 0);
    tinyJS->addNative("function String.split(separator)", scStringSplit, 0);
    tinyJS->addNative("function Integer.parseInt(str)", scIntegerParseInt, 0); // string to int
    tinyJS->addNative("function Integer.valueOf(str)", scIntegerValueOf, 0); // value of a single character
    tinyJS->addNative("function JSON.stringify(obj, replacer)", scJSONStringify, 0); // convert to JSON. replacer is ignored at the moment
    // JSON.parse is left out as you can (unsafely!) use eval instead
    tinyJS->addNative("function Array.contains(obj)", scArrayContains, 0);
    tinyJS->addNative("function Array.remove(obj)", scArrayRemove, 0);
    tinyJS->addNative("function Array.join(separator)", scArrayJoin, 0);
}

