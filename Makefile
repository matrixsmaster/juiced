CC=g++
CFLAGS=-std=c++11 -O0 -c -g -Wall -DHOST_PC=1
LDFLAGS=-g

SOURCES=  \
TinyJS.cpp \
TinyJS_Functions.cpp \
TinyJS_MathFunctions.cpp \
TinyJS_StringFunctions.cpp

OBJECTS=$(SOURCES:.cpp=.o)

all: Script
.PHONY: all Script

run_tests: run_tests.o $(OBJECTS)
	$(CC) $(LDFLAGS) run_tests.o $(OBJECTS) -o $@

Script: Script.o $(OBJECTS)
	$(CC) $(LDFLAGS) Script.o $(OBJECTS) -o $@

.cpp.o:
	$(CC) $(CFLAGS) $< -o $@

clean:
	rm -fv run_tests Script run_tests.o Script.o $(OBJECTS)
