APP		= juice
#CPU		= -phi

#PREFIX	= /mnt/angar/toolchain/zpu-elf-linux64/bin/zpu-elf-
CXX		= $(PREFIX)g++
CC		= $(PREFIX)gcc
LD		= $(PREFIX)g++
AR		= $(PREFIX)ar
STRIP	= $(PREFIX)strip
OBJCP	= $(PREFIX)objcopy

INCPATHS= 
DEFINES = -DHOST_PC=1
CXXFLAGS= -O2 -Wall -fmessage-length=0 $(CPU)
LDFLAGS = $(CPU)
LDLIBS  = -lm
ARFLAGS	= 

SRCS	= $(wildcard *.cpp)
OBJS	= $(SRCS:.cpp=.o)

all: $(APP) # $(APP).bin

$(APP): $(OBJS)
	$(LD) $(LDFLAGS) $(OBJS) -o $(APP) $(LDLIBS)
	$(STRIP) $(APP)

$(APP).bin: $(APP)
	$(OBJCP) -O binary $(APP) $(APP).bin

%.o: %.c
	$(CC) $(CXXFLAGS) $(DEFINES) $(INCPATHS) -c $<

%.o: %.cpp
	$(CXX) $(CXXFLAGS) $(DEFINES) $(INCPATHS) -c $<

clean:
	rm -f *.o 2> /dev/null
	rm -f $(APP) $(APP).bin 2> /dev/null

.PHONY: all clean
