/*
 * TinyJS
 *
 * A single-file Javascript-alike engine
 *
 * Authored By Gordon Williams <gw@pur3.co.uk>
 *
 * Copyright (C) 2009 Pur3 Ltd
 *

 * 42TinyJS
 *
 * A fork of TinyJS with the goal to makes a more JavaScript/ECMA compliant engine
 *
 * Authored / Changed By Armin Diedering <armin@diedering.de>
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

#include "TinyJS.h"
#include <assert.h>
#include <stdio.h>
#include <iostream>

#ifdef HOST_PC
#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <stdlib.h>
#include <unistd.h>
#endif

void js_print(const CFunctionsScopePtr &v, void *) {
	printf("> %s\n", v->getArgument("text")->toString().c_str());
}

void js_dump(const CFunctionsScopePtr &v, void *) {
	v->getContext()->getRoot()->trace(">  ");
}

#define handle_error(msg) do { perror(msg); exit(EXIT_FAILURE); } while (0)

char *topOfStack;
#define sizeOfStack 64*1024*1024 /* for example 1 MB depend of Compiler-Options */
#define sizeOfSafeStack 50*1024 /* safety area */

int main(int argc, char* argv[])
{
	char dummy;
	topOfStack = &dummy;
	CTinyJS *js = new CTinyJS();
	/* Add a native function */
	js->addNative("function print(text)", &js_print, 0);
	js->addNative("function dump()", &js_dump, js);
	/* Execute out bit of code - we could call 'evaluate' here if
		we wanted something returned */
	js->setStackBase(topOfStack-(sizeOfStack-sizeOfSafeStack));
	if (argc == 2) {
		char *addr;
		struct stat sb;

		int fd = open(argv[1], O_RDONLY);
		if (fd == -1) handle_error("open");
		if (fstat(fd,&sb) == -1) handle_error("fstat");

		addr = reinterpret_cast<char*> (mmap(NULL,sb.st_size,PROT_READ,MAP_PRIVATE,fd,0));
		if (addr == MAP_FAILED) handle_error("mmap");

		try {
			js->execute(addr);
			printf("Program finished successfully\n");
		} catch(CScriptException *e) {
			printf("ERROR: %s\n", e->toString().c_str());
		}

		munmap(addr,sb.st_size);
		close(fd);
	}
	delete js;
	return 0;
}
