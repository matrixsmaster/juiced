"use strict";

var timer,gladis,killswitch,mtable,nocturnal;

function print(s)
{
	console.log(s);
}

function setTimeoutInt(f,t,n)
{
	print("Setting timer (period " + t + ") to slot " + n);
	timer[n].done = false;
	timer[n].period = t;
	timer[n].fun = f;
}

function setTimeout(f,t)
{
	var i;
	var flg = false;
	for (i = 0; i < timer.length; i++) {
		if (timer[i].done == true) {
			setTimeoutInt(f,t,i);
			flg = true;
			break;
		}
	}
	if (flg == false) {
		i = timer.length;
		timer[i] = new Object();
		print("New timer object " + i);
		setTimeoutInt(f,t,i);
	}
}

function timer_work()
{
	var i,win;
	var changed = true;
	while (changed) {
		changed = false;
		win = -1;
		for (i = 0; i < timer.length; i++) {
			if (timer[i].done == false) {
				if (timer[i].period <= 0) win = i;
				changed = true;
			}
		}
		print("winner is " + win);
		if (changed && win >= 0) {
			timer[win].done = true;
			print(typeof(timer[win].fun));
			if (typeof(timer[win].fun) == "function") timer[win].fun();
			else eval(timer[win].fun);
		}
		for (i = 0; i < timer.length; i++) {
			if (timer[i].period > 0) timer[i].period = timer[i].period - 1;
		}
	}
	print("End of main loop");
}

function load_binary(url, cb)
{
    var req, typed_array, is_ie;

    // console.log("load_binary: url=" + url);

    req = new XMLHttpRequest();
    req.open('GET', url, true);

    /* completion function */
    req.onreadystatechange = function() {
        var err, data, len, i, buf;

        if (req.readyState == 4) {
            //            console.log("req status=" + req.status);
            if (req.status != 200 && req.status != 0) {
				print("NO DATA LOADED");
                cb(null, -1);
            } else {
                if (is_ie) {
                    data = new VBArray(req.responseBody).toArray();
                    len = data.length;
                    cb(data, len);
                } else {
                    if (typed_array && 'mozResponse' in req) {
                        /* firefox 6 beta */
                        data = req.mozResponse;
                    } else if (typed_array && req.mozResponseArrayBuffer) {
                        /* Firefox 4 */
                        data = req.mozResponseArrayBuffer;
                    } else if ('responseType' in req) {
                        /* Note: in Android 3.0 there is no typed arrays so its
                           returns UTF8 text */
                        data = req.response;
                    } else {
                        data = req.responseText;
                        typed_array = false;
                    }
                
                    if (typed_array) {
                        len = data.byteLength;
                        buf = new Uint8Array(data, 0, len);
                        print("LOADED " + len + " BYTES (TYPED)");
                        cb(buf, len);
                    } else {
                        len = data.length;
                        print("LOADED " + len + " BYTES");
                        cb(data, len);
                    }
                }
            }
        }
    };

    is_ie = (typeof ActiveXObject == "function");
    if (!is_ie) {
        typed_array = ('ArrayBuffer' in window && 'Uint8Array' in window);
        if (typed_array && 'mozResponseType' in req) {
            /* firefox 6 beta */
            req.mozResponseType = 'arraybuffer';
        } else if (typed_array && 'responseType' in req) {
            /* Chrome */
            req.responseType = 'arraybuffer';
        } else {
            req.overrideMimeType('text/plain; charset=x-user-defined');
            typed_array = false;
        }
    }
    req.send(null);
}

function CPU_X86() {
    var i,da;
    print("X86 entry OK");
    this.regs=new Array();
    for(i=0; i<8; i++)this.regs[i]=0;
    this.eip=0;
    this.cc_op=0;
    this.cc_dst=0;
    this.cc_src=0;
    this.cc_op2=0;
    this.cc_dst2=0;
    this.df=1;
    this.eflags=0x2;
    this.cycle_count=0;
    this.hard_irq=0;
    this.hard_intno=-1;
    this.cpl=0;
    this.cr0=(1<<0);
    this.cr2=0;
    this.cr3=0;
    this.cr4=0;
    this.idt= {base:0,limit:0};
    this.gdt= {base:0,limit:0};
    this.segs=new Array();
    for(i=0; i<7; i++) {
        this.segs[i]= {selector:0,base:0,limit:0,flags:0};
    }
    this.segs[2].flags=(1<<22);
    this.segs[1].flags=(1<<22);
    this.tr= {selector:0,base:0,limit:0,flags:0};
    this.ldt= {selector:0,base:0,limit:0,flags:0};
    this.halted=0;
    this.phys_mem=null;
    da=0x100000;
    print("Creating TLB Arrays");
    this.tlb_read_kernel=new Array();
    this.tlb_write_kernel=new Array();
    this.tlb_read_user=new Array();
    this.tlb_write_user=new Array();
    print("Filling TLB Arrays");
    //print("WARNING: INIT DISABLED. DO NOT USE.");
    for(i=0; i<da; i++) {
        this.tlb_read_kernel[i]=-1;
        this.tlb_write_kernel[i]=-1;
        this.tlb_read_user[i]=-1;
        this.tlb_write_user[i]=-1;
        //print(i + " / " + da);
        var _p = i / da * 100;
        //print("TLB " + _p + " %");
    }
    print("Creating last TLB Array");
    this.tlb_pages=new Array();
    print("Filling last TLB Array");
    for(i=0; i<2048; i++)this.tlb_pages[i]=0;
    this.tlb_pages_count=0;
    print("X86 CPU INIT DONE");

	this.phys_mem_resize=function(ea) {
		this.mem_size=ea;
		ea+=((15+3)&~3);
		var i,fa,ga,ha;
		this.phys_mem8=null;
		fa = this.phys_mem8 = new Array();
		print("Memory size will be "+ea);
		//print("WARNING: INIT DISABLED. DO NOT USE.");
		for(i=0; i<ea; i++) {
			fa[i]=0;
			var _p = i / ea * 100;
			//print("RAM " + _p + " %");
		}
	};
	this.ld8_phys=function(ia) {
		return this.phys_mem8[ia];
	};
	this.st8_phys=function(ia,ja) {
		this.phys_mem8[ia]=ja&0xff;
	};
	this.ld32_phys=function(ia) {
		return this.phys_mem8[ia]|(this.phys_mem8[ia+1]<<8)|(this.phys_mem8[ia+2]<<16)|(this.phys_mem8[ia+3]<<24);
	};
	this.st32_phys=function(ia,ja) {
		this.phys_mem8[ia]=ja&0xff;
		this.phys_mem8[ia+1]=(ja>>8)&0xff;
		this.phys_mem8[ia+2]=(ja>>16)&0xff;
		this.phys_mem8[ia+3]=(ja>>24)&0xff;
	};
	this.tlb_set_page=function(ia,ka,la,ma) {
		var i,ja,j;
		ka&=-4096;
		ia&=-4096;
		ja=ia^ka;
		i=ia>>>12;
		if(this.tlb_read_kernel[i]==-1) {
			if(this.tlb_pages_count>=2048) {
				this.tlb_flush_all1((i-1)&0xfffff);
			}
			this.tlb_pages[this.tlb_pages_count++]=i;
		}
		this.tlb_read_kernel[i]=ja;
		if(la) {
			this.tlb_write_kernel[i]=ja;
		}
		else {
			this.tlb_write_kernel[i]=-1;
		}
		if(ma) {
			this.tlb_read_user[i]=ja;
			if(la) {
				this.tlb_write_user[i]=ja;
			}
			else {
				this.tlb_write_user[i]=-1;
			}
		}
		else {
			this.tlb_read_user[i]=-1;
			this.tlb_write_user[i]=-1;
		}
	};
	this.tlb_flush_page=function(ia) {
		var i;
		i=ia>>>12;
		this.tlb_read_kernel[i]=-1;
		this.tlb_write_kernel[i]=-1;
		this.tlb_read_user[i]=-1;
		this.tlb_write_user[i]=-1;
	};
	this.tlb_flush_all=function() {
		var i,j,n,na;
		na=this.tlb_pages;
		n=this.tlb_pages_count;
		for(j=0; j<n; j++) {
			i=na[j];
			this.tlb_read_kernel[i]=-1;
			this.tlb_write_kernel[i]=-1;
			this.tlb_read_user[i]=-1;
			this.tlb_write_user[i]=-1;
		}
		this.tlb_pages_count=0;
	};
	this.tlb_flush_all1=function(oa) {
		var i,j,n,na,pa;
		na=this.tlb_pages;
		n=this.tlb_pages_count;
		pa=0;
		for(j=0; j<n; j++) {
			i=na[j];
			if(i==oa) {
				na[pa++]=i;
			}
			else {
				this.tlb_read_kernel[i]=-1;
				this.tlb_write_kernel[i]=-1;
				this.tlb_read_user[i]=-1;
				this.tlb_write_user[i]=-1;
			}
		}
		this.tlb_pages_count=pa;
	};
	this.write_string=function(ia,qa) {
		var i;
		for(i=0; i<qa.length; i++) {
			this.st8_phys(ia++,qa.charCodeAt(i)&0xff);
		}
		this.st8_phys(ia,0);
	};
	function ra(ja,n) {
		var i,s;
		var h="0123456789ABCDEF";
		s="";
		for(i=n-1; i>=0; i--) {
			s=s+h[(ja>>>(i*4))&15];
		}
		return s;
	}
	function sa(n) {
		return ra(n,8);
	}
	function ta(n) {
		return ra(n,2);
	}
	function ua(n) {
		return ra(n,4);
	}
	this.dump_short=function() {
		print(" EIP="+sa(this.eip)+" EAX="+sa(this.regs[0])+" ECX="+sa(this.regs[1])+" EDX="+sa(this.regs[2])+" EBX="+sa(this.regs[3]));
		print("EFL="+sa(this.eflags)+" ESP="+sa(this.regs[4])+" EBP="+sa(this.regs[5])+" ESI="+sa(this.regs[6])+" EDI="+sa(this.regs[7]));
	};
	this.dump=function() {
		var i,va,qa;
		var wa=[" ES"," CS"," SS"," DS"," FS"," GS","LDT"," TR"];
		this.dump_short();
		print("TSC="+sa(this.cycle_count)+" OP="+ta(this.cc_op)+" SRC="+sa(this.cc_src)+" DST="+sa(this.cc_dst)+" OP2="+ta(this.cc_op2)+" DST2="+sa(this.cc_dst2));
		print("CPL="+this.cpl+" CR0="+sa(this.cr0)+" CR2="+sa(this.cr2)+" CR3="+sa(this.cr3)+" CR4="+sa(this.cr4));
		qa="";
		for(i=0; i<8; i++) {
			if(i==6)va=this.ldt;
			else if(i==7)va=this.tr;
			else va=this.segs[i];
			qa+=wa[i]+"="+ua(va.selector)+" "+sa(va.base)+" "+sa(va.limit)+" "+ua((va.flags>>8)&0xf0ff);
			if(i&1) {
				print(qa);
				qa="";
			}
			else {
				qa+=" ";
			}
		}
		va=this.gdt;
		qa="GDT=     "+sa(va.base)+" "+sa(va.limit)+"      ";
		va=this.idt;
		qa+="IDT=     "+sa(va.base)+" "+sa(va.limit);
		print(qa);
	};

	this.exec=function(xa) {
		var Fg,Oa,Gg,ya;
		Gg=this.cycle_count+xa;
		Oa=256;
		ya=null;
		while(this.cycle_count<Gg) {
			//try {
				Oa=this.exec_internal(Gg-this.cycle_count,ya);
				print("exec_internal returned "+Oa);
				if(Oa!=256)break;
				ya=null;
			/*} catch(Hg) {
				print("CATCHED " + Hg);
				if(Hg.hasOwnProperty("intno")) 
					ya=Hg;
				else
					throw Hg;
			}*/
		}
		return Oa;
	};
	this.load_binary=function(Ig,ia,Jg) {
		var Kg,za;
		za=this;
		Kg=function(Lg,sg) {
			var i;
			if(sg<0) {
				Jg(sg);
			}
			else {
				if(typeof Lg=="string") {
					for(i=0; i<sg; i++) {
						var _p = i / sg * 100;
						//print("LD " + _p + " %");
						za.st8_phys(ia+i,Lg.charCodeAt(i));
					}
				}
				else {
					for(i=0; i<sg; i++) {
						za.st8_phys(ia+i,Lg[i]);
					}
				}
				Jg(sg);
			}
		};
		load_binary(Ig,Kg);
	};
	
	this.exec_internal=function(xa,ya) {
		var aa=[1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1];
		var ba=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14];
		var ca=[0,1,2,3,4,5,6,7,8,0,1,2,3,4,5,6,7,8,0,1,2,3,4,5,6,7,8,0,1,2,3,4];

		var za,ia,Aa;
		var Ba,Ca,Da,Ea,Fa;
		var Ga,Ha,Ia,b,Ja,ja,Ka,La,Ma,Na,Oa,Pa;
		var Qa,Ra,Sa,Ta,Ua,Va;
		var Wa,Xa;
		var Ya,Za,ab,bb,cb,db;
		function eb() {
			var fb;
			mtable.eb = mtable.eb + 1;
			gb(ia,0,za.cpl==3);
			fb=cb[ia>>>12]^ia;
			return Wa[fb];
		}
		function hb() {
			var Xa;
			mtable.hb = mtable.hb + 1;
			return(((Xa=cb[ia>>>12])==-1)?eb():Wa[ia^Xa]);
		}
		function ib() {
			var ja;
			ja=hb();
			ia++;
			ja|=hb()<<8;
			ia--;
			return ja;
		}
		function jb() {
			var Xa;
			return(((Xa=cb[ia>>>12])|ia)&1?ib():(Xa^=ia,Wa[Xa]|(Wa[Xa+1]<<8)));
		}
		function kb() {
			var ja;
			mtable.kb = mtable.kb + 1;
			ja=hb();
			ia++;
			ja|=hb()<<8;
			ia++;
			ja|=hb()<<16;
			ia++;
			ja|=hb()<<24;
			ia-=3;
			return ja;
		}
		function lb() {
			var Xa;
			mtable.lb = mtable.lb + 1;
			return(((Xa=cb[ia>>>12])|ia)&3?kb():(Xa^=ia,Wa[Xa]|(Wa[Xa+1]<<8)|(Wa[Xa+2]<<16)|(Wa[Xa+3]<<24)));
		}
		function mb() {
			var fb;
			gb(ia,1,za.cpl==3);
			fb=db[ia>>>12]^ia;
			return Wa[fb];
		}
		function nb() {
			var fb;
			return((fb=db[ia>>>12])==-1)?mb():Wa[ia^fb];
		}
		function ob() {
			var ja;
			ja=nb();
			ia++;
			ja|=nb()<<8;
			ia--;
			return ja;
		}
		function pb() {
			var fb;
			return((fb=db[ia>>>12])|ia)&1?ob():(fb^=ia,Wa[fb]|(Wa[fb+1]<<8));
		}
		function qb() {
			var ja;
			ja=nb();
			ia++;
			ja|=nb()<<8;
			ia++;
			ja|=nb()<<16;
			ia++;
			ja|=nb()<<24;
			ia-=3;
			return ja;
		}
		function rb() {
			var fb;
			return((fb=db[ia>>>12])|ia)&3?qb():(fb^=ia,Wa[fb]|(Wa[fb+1]<<8)|(Wa[fb+2]<<16)|(Wa[fb+3]<<24));
		}
		function sb(ja) {
			var fb;
			gb(ia,1,za.cpl==3);
			fb=db[ia>>>12]^ia;
			Wa[fb]=ja&0xff;
		}
		function tb(ja) {
			var Xa;
			{
				Xa=db[ia>>>12];
				if(Xa==-1) {
					sb(ja);
				}
				else {
					Wa[ia^Xa]=ja&0xff;
				}
			};
		}
		function ub(ja) {
			tb(ja);
			ia++;
			tb(ja>>8);
			ia--;
		}
		function vb(ja) {
			var Xa;
			{
				Xa=db[ia>>>12];
				if((Xa|ia)&1) {
					ub(ja);
				}
				else {
					Xa^=ia;
					Wa[Xa]=ja&0xff;
					Wa[Xa+1]=(ja>>8)&0xff;
				}
			};
		}
		function wb(ja) {
			tb(ja);
			ia++;
			tb(ja>>8);
			ia++;
			tb(ja>>16);
			ia++;
			tb(ja>>24);
			ia-=3;
		}
		function xb(ja) {
			var Xa;
			{
				Xa=db[ia>>>12];
				if((Xa|ia)&3) {
					wb(ja);
				}
				else {
					Xa^=ia;
					Wa[Xa]=ja&0xff;
					Wa[Xa+1]=(ja>>8)&0xff;
					Wa[Xa+2]=(ja>>16)&0xff;
					Wa[Xa+3]=(ja>>24)&0xff;
				}
			};
		}
		function yb() {
			var fb;
			gb(ia,0,0);
			fb=Ya[ia>>>12]^ia;
			return Wa[fb];
		}
		function zb() {
			var fb;
			return((fb=Ya[ia>>>12])==-1)?yb():Wa[ia^fb];
		}
		function Ab() {
			var ja;
			ja=zb();
			ia++;
			ja|=zb()<<8;
			ia--;
			return ja;
		}
		function Bb() {
			var fb;
			return((fb=Ya[ia>>>12])|ia)&1?Ab():(fb^=ia,Wa[fb]|(Wa[fb+1]<<8));
		}
		function Cb() {
			var ja;
			ja=zb();
			ia++;
			ja|=zb()<<8;
			ia++;
			ja|=zb()<<16;
			ia++;
			ja|=zb()<<24;
			ia-=3;
			return ja;
		}
		function Db() {
			var fb;
			return((fb=Ya[ia>>>12])|ia)&3?Cb():(fb^=ia,Wa[fb]|(Wa[fb+1]<<8)|(Wa[fb+2]<<16)|(Wa[fb+3]<<24));
		}
		function Eb(ja) {
			var fb;
			gb(ia,1,0);
			fb=Za[ia>>>12]^ia;
			Wa[fb]=ja&0xff;
		}
		function Fb(ja) {
			var fb;
			fb=Za[ia>>>12];
			if(fb==-1) {
				Eb(ja);
			}
			else {
				Wa[ia^fb]=ja&0xff;
			}
		}
		function Gb(ja) {
			Fb(ja);
			ia++;
			Fb(ja>>8);
			ia--;
		}
		function Hb(ja) {
			var fb;
			fb=Za[ia>>>12];
			if((fb|ia)&1) {
				Gb(ja);
			}
			else {
				fb^=ia;
				Wa[fb]=ja&0xff;
				Wa[fb+1]=(ja>>8)&0xff;
			}
		}
		function Ib(ja) {
			Fb(ja);
			ia++;
			Fb(ja>>8);
			ia++;
			Fb(ja>>16);
			ia++;
			Fb(ja>>24);
			ia-=3;
		}
		function Jb(ja) {
			var fb;
			fb=Za[ia>>>12];
			if((fb|ia)&3) {
				Ib(ja);
			}
			else {
				fb^=ia;
				Wa[fb]=ja&0xff;
				Wa[fb+1]=(ja>>8)&0xff;
				Wa[fb+2]=(ja>>16)&0xff;
				Wa[fb+3]=(ja>>24)&0xff;
			}
		}
		var Kb,Lb,Mb,Nb,Ob;
		function Pb() {
			var ja,Ka;
			ja=Wa[Lb++];;
			Ka=Wa[Lb++];;
			return ja|(Ka<<8);
		}
		function Qb(Ha) {
			var base,ia,Rb,Sb,Tb,Ub;
			if(Ta&&(Ga&(0x000f|0x0080))==0) {
				switch((Ha&7)|((Ha>>3)&0x18)) {
				case 0x04:
					Rb=Wa[Lb++];;
					base=Rb&7;
					if(base==5) {{
							ia=Wa[Lb]|(Wa[Lb+1]<<8)|(Wa[Lb+2]<<16)|(Wa[Lb+3]<<24);
							Lb+=4;
						};
					}
					else {
						ia=Aa[base];
					}
					Sb=(Rb>>3)&7;
					if(Sb!=4) {
						ia=(ia+(Aa[Sb]<<(Rb>>6)))>>0;
					}
					break;
				case 0x0c:
					Rb=Wa[Lb++];;
					ia=((Wa[Lb++]<<24)>>24);;
					base=Rb&7;
					ia=(ia+Aa[base])>>0;
					Sb=(Rb>>3)&7;
					if(Sb!=4) {
						ia=(ia+(Aa[Sb]<<(Rb>>6)))>>0;
					}
					break;
				case 0x14:
					Rb=Wa[Lb++];;
					{
						ia=Wa[Lb]|(Wa[Lb+1]<<8)|(Wa[Lb+2]<<16)|(Wa[Lb+3]<<24);
						Lb+=4;
					};
					base=Rb&7;
					ia=(ia+Aa[base])>>0;
					Sb=(Rb>>3)&7;
					if(Sb!=4) {
						ia=(ia+(Aa[Sb]<<(Rb>>6)))>>0;
					}
					break;
				case 0x05: {
					ia=Wa[Lb]|(Wa[Lb+1]<<8)|(Wa[Lb+2]<<16)|(Wa[Lb+3]<<24);
					Lb+=4;
				};
				break;
				case 0x00:
				case 0x01:
				case 0x02:
				case 0x03:
				case 0x06:
				case 0x07:
					base=Ha&7;
					ia=Aa[base];
					break;
				case 0x08:
				case 0x09:
				case 0x0a:
				case 0x0b:
				case 0x0d:
				case 0x0e:
				case 0x0f:
					ia=((Wa[Lb++]<<24)>>24);;
					base=Ha&7;
					ia=(ia+Aa[base])>>0;
					break;
				case 0x10:
				case 0x11:
				case 0x12:
				case 0x13:
				case 0x15:
				case 0x16:
				case 0x17:
				default: {
					ia=Wa[Lb]|(Wa[Lb+1]<<8)|(Wa[Lb+2]<<16)|(Wa[Lb+3]<<24);
					Lb+=4;
				};
				base=Ha&7;
				ia=(ia+Aa[base])>>0;
				break;
				}
				return ia;
			}
			else if(Ga&0x0080) {
				if((Ha&0xc7)==0x06) {
					ia=Pb();
					Ub=3;
				}
				else {
					switch(Ha>>6) {
					case 0:
						ia=0;
						break;
					case 1:
						ia=((Wa[Lb++]<<24)>>24);;
						break;
					default:
						ia=Pb();
						break;
					}
					switch(Ha&7) {
					case 0:
						ia=(ia+Aa[3]+Aa[6])&0xffff;
						Ub=3;
						break;
					case 1:
						ia=(ia+Aa[3]+Aa[7])&0xffff;
						Ub=3;
						break;
					case 2:
						ia=(ia+Aa[5]+Aa[6])&0xffff;
						Ub=2;
						break;
					case 3:
						ia=(ia+Aa[5]+Aa[7])&0xffff;
						Ub=2;
						break;
					case 4:
						ia=(ia+Aa[6])&0xffff;
						Ub=3;
						break;
					case 5:
						ia=(ia+Aa[7])&0xffff;
						Ub=3;
						break;
					case 6:
						ia=(ia+Aa[5])&0xffff;
						Ub=2;
						break;
					case 7:
					default:
						ia=(ia+Aa[3])&0xffff;
						Ub=3;
						break;
					}
				}
				Tb=Ga&0x000f;
				if(Tb==0) {
					Tb=Ub;
				}
				else {
					Tb--;
				}
				ia=(ia+za.segs[Tb].base)>>0;
				return ia;
			}
			else {
				switch((Ha&7)|((Ha>>3)&0x18)) {
				case 0x04:
					Rb=Wa[Lb++];;
					base=Rb&7;
					if(base==5) {{
							ia=Wa[Lb]|(Wa[Lb+1]<<8)|(Wa[Lb+2]<<16)|(Wa[Lb+3]<<24);
							Lb+=4;
						};
						base=0;
					}
					else {
						ia=Aa[base];
					}
					Sb=(Rb>>3)&7;
					if(Sb!=4) {
						ia=(ia+(Aa[Sb]<<(Rb>>6)))>>0;
					}
					break;
				case 0x0c:
					Rb=Wa[Lb++];;
					ia=((Wa[Lb++]<<24)>>24);;
					base=Rb&7;
					ia=(ia+Aa[base])>>0;
					Sb=(Rb>>3)&7;
					if(Sb!=4) {
						ia=(ia+(Aa[Sb]<<(Rb>>6)))>>0;
					}
					break;
				case 0x14:
					Rb=Wa[Lb++];;
					{
						ia=Wa[Lb]|(Wa[Lb+1]<<8)|(Wa[Lb+2]<<16)|(Wa[Lb+3]<<24);
						Lb+=4;
					};
					base=Rb&7;
					ia=(ia+Aa[base])>>0;
					Sb=(Rb>>3)&7;
					if(Sb!=4) {
						ia=(ia+(Aa[Sb]<<(Rb>>6)))>>0;
					}
					break;
				case 0x05: {
					ia=Wa[Lb]|(Wa[Lb+1]<<8)|(Wa[Lb+2]<<16)|(Wa[Lb+3]<<24);
					Lb+=4;
				};
				base=0;
				break;
				case 0x00:
				case 0x01:
				case 0x02:
				case 0x03:
				case 0x06:
				case 0x07:
					base=Ha&7;
					ia=Aa[base];
					break;
				case 0x08:
				case 0x09:
				case 0x0a:
				case 0x0b:
				case 0x0d:
				case 0x0e:
				case 0x0f:
					ia=((Wa[Lb++]<<24)>>24);;
					base=Ha&7;
					ia=(ia+Aa[base])>>0;
					break;
				case 0x10:
				case 0x11:
				case 0x12:
				case 0x13:
				case 0x15:
				case 0x16:
				case 0x17:
				default: {
					ia=Wa[Lb]|(Wa[Lb+1]<<8)|(Wa[Lb+2]<<16)|(Wa[Lb+3]<<24);
					Lb+=4;
				};
				base=Ha&7;
				ia=(ia+Aa[base])>>0;
				break;
				}
				Tb=Ga&0x000f;
				if(Tb==0) {
					if(base==4||base==5)Tb=2;
					else Tb=3;
				}
				else {
					Tb--;
				}
				ia=(ia+za.segs[Tb].base)>>0;
				return ia;
			}
		}
		function Vb() {
			var ia,Tb;
			if(Ga&0x0080) {
				ia=Pb();
			}
			else {{
					ia=Wa[Lb]|(Wa[Lb+1]<<8)|(Wa[Lb+2]<<16)|(Wa[Lb+3]<<24);
					Lb+=4;
				};
			}
			Tb=Ga&0x000f;
			if(Tb==0)Tb=3;
			else Tb--;
			ia=(ia+za.segs[Tb].base)>>0;
			return ia;
		}
		function Wb(Ja,ja) {
			if(Ja&4)Aa[Ja&3]=(Aa[Ja&3]&-65281)|((ja&0xff)<<8);
			else Aa[Ja&3]=(Aa[Ja&3]&-256)|(ja&0xff);
		}
		function Xb(Ja,ja) {
			Aa[Ja]=(Aa[Ja]&-65536)|(ja&0xffff);
		}
		function Yb(Ma,Zb,ac) {
			var bc;
			switch(Ma) {
			case 0:
				Ba=ac;
				Zb=(Zb+ac)>>0;
				Ca=Zb;
				Da=2;
				break;
			case 1:
				Zb=Zb|ac;
				Ca=Zb;
				Da=14;
				break;
			case 2:
				bc=cc();
				Ba=ac;
				Zb=(Zb+ac+bc)>>0;
				Ca=Zb;
				Da=bc?5:2;
				break;
			case 3:
				bc=cc();
				Ba=ac;
				Zb=(Zb-ac-bc)>>0;
				Ca=Zb;
				Da=bc?11:8;
				break;
			case 4:
				Zb=Zb&ac;
				Ca=Zb;
				Da=14;
				break;
			case 5:
				Ba=ac;
				Zb=(Zb-ac)>>0;
				Ca=Zb;
				Da=8;
				break;
			case 6:
				Zb=Zb^ac;
				Ca=Zb;
				Da=14;
				break;
			case 7:
				Ba=ac;
				Ca=(Zb-ac)>>0;
				Da=8;
				break;
			default:
				throw"arith"+dc+": invalid op";
			}
			return Zb;
		}
		function ec(Ma,Zb,ac) {
			var bc;
			switch(Ma) {
			case 0:
				Ba=ac;
				Zb=(((Zb+ac)<<16)>>16);
				Ca=Zb;
				Da=1;
				break;
			case 1:
				Zb=(((Zb|ac)<<16)>>16);
				Ca=Zb;
				Da=13;
				break;
			case 2:
				bc=cc();
				Ba=ac;
				Zb=(((Zb+ac+bc)<<16)>>16);
				Ca=Zb;
				Da=bc?4:1;
				break;
			case 3:
				bc=cc();
				Ba=ac;
				Zb=(((Zb-ac-bc)<<16)>>16);
				Ca=Zb;
				Da=bc?10:7;
				break;
			case 4:
				Zb=(((Zb&ac)<<16)>>16);
				Ca=Zb;
				Da=13;
				break;
			case 5:
				Ba=ac;
				Zb=(((Zb-ac)<<16)>>16);
				Ca=Zb;
				Da=7;
				break;
			case 6:
				Zb=(((Zb^ac)<<16)>>16);
				Ca=Zb;
				Da=13;
				break;
			case 7:
				Ba=ac;
				Ca=(((Zb-ac)<<16)>>16);
				Da=7;
				break;
			default:
				throw"arith"+dc+": invalid op";
			}
			return Zb;
		}
		function fc(ja) {
			if(Da<25) {
				Ea=Da;
				Fa=Ca;
			}
			Ca=(((ja+1)<<16)>>16);
			Da=26;
			return Ca;
		}
		function gc(ja) {
			if(Da<25) {
				Ea=Da;
				Fa=Ca;
			}
			Ca=(((ja-1)<<16)>>16);
			Da=29;
			return Ca;
		}
		function hc(Ma,Zb,ac) {
			var bc;
			switch(Ma) {
			case 0:
				Ba=ac;
				Zb=(((Zb+ac)<<24)>>24);
				Ca=Zb;
				Da=0;
				break;
			case 1:
				Zb=(((Zb|ac)<<24)>>24);
				Ca=Zb;
				Da=12;
				break;
			case 2:
				bc=cc();
				Ba=ac;
				Zb=(((Zb+ac+bc)<<24)>>24);
				Ca=Zb;
				Da=bc?3:0;
				break;
			case 3:
				bc=cc();
				Ba=ac;
				Zb=(((Zb-ac-bc)<<24)>>24);
				Ca=Zb;
				Da=bc?9:6;
				break;
			case 4:
				Zb=(((Zb&ac)<<24)>>24);
				Ca=Zb;
				Da=12;
				break;
			case 5:
				Ba=ac;
				Zb=(((Zb-ac)<<24)>>24);
				Ca=Zb;
				Da=6;
				break;
			case 6:
				Zb=(((Zb^ac)<<24)>>24);
				Ca=Zb;
				Da=12;
				break;
			case 7:
				Ba=ac;
				Ca=(((Zb-ac)<<24)>>24);
				Da=6;
				break;
			default:
				throw"arith"+dc+": invalid op";
			}
			return Zb;
		}
		function ic(ja) {
			if(Da<25) {
				Ea=Da;
				Fa=Ca;
			}
			Ca=(((ja+1)<<24)>>24);
			Da=25;
			return Ca;
		}
		function jc(ja) {
			if(Da<25) {
				Ea=Da;
				Fa=Ca;
			}
			Ca=(((ja-1)<<24)>>24);
			Da=28;
			return Ca;
		}
		function kc(Ma,Zb,ac) {
			var lc,bc;
			switch(Ma) {
			case 0:
				if(ac&0x1f) {
					ac&=0x7;
					Zb&=0xff;
					lc=Zb;
					Zb=(Zb<<ac)|(Zb>>>(8-ac));
					Ba=mc();
					Ba|=(Zb&0x0001)|(((lc^Zb)<<4)&0x0800);
					Ca=((Ba>>6)&1)^1;
					Da=24;
				}
				break;
			case 1:
				if(ac&0x1f) {
					ac&=0x7;
					Zb&=0xff;
					lc=Zb;
					Zb=(Zb>>>ac)|(Zb<<(8-ac));
					Ba=mc();
					Ba|=((Zb>>7)&0x0001)|(((lc^Zb)<<4)&0x0800);
					Ca=((Ba>>6)&1)^1;
					Da=24;
				}
				break;
			case 2:
				ac=ca[ac&0x1f];
				if(ac) {
					Zb&=0xff;
					lc=Zb;
					bc=cc();
					Zb=(Zb<<ac)|(bc<<(ac-1));
					if(ac>1)Zb|=lc>>>(9-ac);
					Ba=mc();
					Ba|=(((lc^Zb)<<4)&0x0800)|((lc>>(8-ac))&0x0001);
					Ca=((Ba>>6)&1)^1;
					Da=24;
				}
				break;
			case 3:
				ac=ca[ac&0x1f];
				if(ac) {
					Zb&=0xff;
					lc=Zb;
					bc=cc();
					Zb=(Zb>>>ac)|(bc<<(8-ac));
					if(ac>1)Zb|=lc<<(9-ac);
					Ba=mc();
					Ba|=(((lc^Zb)<<4)&0x0800)|((lc>>(ac-1))&0x0001);
					Ca=((Ba>>6)&1)^1;
					Da=24;
				}
				break;
			case 4:
			case 6:
				ac&=0x1f;
				if(ac) {
					Ba=Zb<<(ac-1);
					Ca=Zb=(((Zb<<ac)<<24)>>24);
					Da=15;
				}
				break;
			case 5:
				ac&=0x1f;
				if(ac) {
					Zb&=0xff;
					Ba=Zb>>>(ac-1);
					Ca=Zb=(((Zb>>>ac)<<24)>>24);
					Da=18;
				}
				break;
			case 7:
				ac&=0x1f;
				if(ac) {
					Zb=(Zb<<24)>>24;
					Ba=Zb>>(ac-1);
					Ca=Zb=(((Zb>>ac)<<24)>>24);
					Da=18;
				}
				break;
			default:
				throw"unsupported shift8="+Ma;
			}
			return Zb;
		}
		function nc(Ma,Zb,ac) {
			var lc,bc;
			switch(Ma) {
			case 0:
				if(ac&0x1f) {
					ac&=0xf;
					Zb&=0xffff;
					lc=Zb;
					Zb=(Zb<<ac)|(Zb>>>(16-ac));
					Ba=mc();
					Ba|=(Zb&0x0001)|(((lc^Zb)>>4)&0x0800);
					Ca=((Ba>>6)&1)^1;
					Da=24;
				}
				break;
			case 1:
				if(ac&0x1f) {
					ac&=0xf;
					Zb&=0xffff;
					lc=Zb;
					Zb=(Zb>>>ac)|(Zb<<(16-ac));
					Ba=mc();
					Ba|=((Zb>>15)&0x0001)|(((lc^Zb)>>4)&0x0800);
					Ca=((Ba>>6)&1)^1;
					Da=24;
				}
				break;
			case 2:
				ac=ba[ac&0x1f];
				if(ac) {
					Zb&=0xffff;
					lc=Zb;
					bc=cc();
					Zb=(Zb<<ac)|(bc<<(ac-1));
					if(ac>1)Zb|=lc>>>(17-ac);
					Ba=mc();
					Ba|=(((lc^Zb)>>4)&0x0800)|((lc>>(16-ac))&0x0001);
					Ca=((Ba>>6)&1)^1;
					Da=24;
				}
				break;
			case 3:
				ac=ba[ac&0x1f];
				if(ac) {
					Zb&=0xffff;
					lc=Zb;
					bc=cc();
					Zb=(Zb>>>ac)|(bc<<(16-ac));
					if(ac>1)Zb|=lc<<(17-ac);
					Ba=mc();
					Ba|=(((lc^Zb)>>4)&0x0800)|((lc>>(ac-1))&0x0001);
					Ca=((Ba>>6)&1)^1;
					Da=24;
				}
				break;
			case 4:
			case 6:
				ac&=0x1f;
				if(ac) {
					Ba=Zb<<(ac-1);
					Ca=Zb=(((Zb<<ac)<<16)>>16);
					Da=16;
				}
				break;
			case 5:
				ac&=0x1f;
				if(ac) {
					Zb&=0xffff;
					Ba=Zb>>>(ac-1);
					Ca=Zb=(((Zb>>>ac)<<16)>>16);
					Da=19;
				}
				break;
			case 7:
				ac&=0x1f;
				if(ac) {
					Zb=(Zb<<16)>>16;
					Ba=Zb>>(ac-1);
					Ca=Zb=(((Zb>>ac)<<16)>>16);
					Da=19;
				}
				break;
			default:
				throw"unsupported shift16="+Ma;
			}
			return Zb;
		}
		function oc(Ma,Zb,ac) {
			var lc,bc;
			switch(Ma) {
			case 0:
				ac&=0x1f;
				if(ac) {
					lc=Zb;
					Zb=(Zb<<ac)|(Zb>>>(32-ac));
					Ba=mc();
					Ba|=(Zb&0x0001)|(((lc^Zb)>>20)&0x0800);
					Ca=((Ba>>6)&1)^1;
					Da=24;
				}
				break;
			case 1:
				ac&=0x1f;
				if(ac) {
					lc=Zb;
					Zb=(Zb>>>ac)|(Zb<<(32-ac));
					Ba=mc();
					Ba|=((Zb>>31)&0x0001)|(((lc^Zb)>>20)&0x0800);
					Ca=((Ba>>6)&1)^1;
					Da=24;
				}
				break;
			case 2:
				ac&=0x1f;
				if(ac) {
					lc=Zb;
					bc=cc();
					Zb=(Zb<<ac)|(bc<<(ac-1));
					if(ac>1)Zb|=lc>>>(33-ac);
					Ba=mc();
					Ba|=(((lc^Zb)>>20)&0x0800)|((lc>>(32-ac))&0x0001);
					Ca=((Ba>>6)&1)^1;
					Da=24;
				}
				break;
			case 3:
				ac&=0x1f;
				if(ac) {
					lc=Zb;
					bc=cc();
					Zb=(Zb>>>ac)|(bc<<(32-ac));
					if(ac>1)Zb|=lc<<(33-ac);
					Ba=mc();
					Ba|=(((lc^Zb)>>20)&0x0800)|((lc>>(ac-1))&0x0001);
					Ca=((Ba>>6)&1)^1;
					Da=24;
				}
				break;
			case 4:
			case 6:
				ac&=0x1f;
				if(ac) {
					Ba=Zb<<(ac-1);
					Ca=Zb=Zb<<ac;
					Da=17;
				}
				break;
			case 5:
				ac&=0x1f;
				if(ac) {
					Ba=Zb>>>(ac-1);
					Ca=Zb=Zb>>>ac;
					Da=20;
				}
				break;
			case 7:
				ac&=0x1f;
				if(ac) {
					Ba=Zb>>(ac-1);
					Ca=Zb=Zb>>ac;
					Da=20;
				}
				break;
			default:
				throw"unsupported shift32="+Ma;
			}
			return Zb;
		}
		function pc(Ma,Zb,ac,qc) {
			var rc;
			qc&=0x1f;
			if(qc) {
				if(Ma==0) {
					ac&=0xffff;
					rc=ac|(Zb<<16);
					Ba=rc>>(32-qc);
					rc<<=qc;
					if(qc>16)rc|=ac<<(qc-16);
					Zb=Ca=rc>>16;
					Da=19;
				}
				else {
					rc=(Zb&0xffff)|(ac<<16);
					Ba=rc>>(qc-1);
					rc>>=qc;
					if(qc>16)rc|=ac<<(32-qc);
					Zb=Ca=(((rc)<<16)>>16);
					Da=19;
				}
			}
			return Zb;
		}
		function sc(Zb,ac,qc) {
			qc&=0x1f;
			if(qc) {
				Ba=Zb<<(qc-1);
				Ca=Zb=(Zb<<qc)|(ac>>>(32-qc));
				Da=17;
			}
			return Zb;
		}
		function tc(Zb,ac,qc) {
			qc&=0x1f;
			if(qc) {
				Ba=Zb>>(qc-1);
				Ca=Zb=(Zb>>>qc)|(ac<<(32-qc));
				Da=20;
			}
			return Zb;
		}
		function uc(Zb,ac) {
			ac&=0xf;
			Ba=Zb>>ac;
			Da=19;
		}
		function vc(Zb,ac) {
			ac&=0x1f;
			Ba=Zb>>ac;
			Da=20;
		}
		function wc(Ma,Zb,ac) {
			var xc;
			ac&=0xf;
			Ba=Zb>>ac;
			xc=1<<ac;
			switch(Ma) {
			case 1:
				Zb|=xc;
				break;
			case 2:
				Zb&=~xc;
				break;
			case 3:
			default:
				Zb^=xc;
				break;
			}
			Da=19;
			return Zb;
		}
		function yc(Ma,Zb,ac) {
			var xc;
			ac&=0x1f;
			Ba=Zb>>ac;
			xc=1<<ac;
			switch(Ma) {
			case 1:
				Zb|=xc;
				break;
			case 2:
				Zb&=~xc;
				break;
			case 3:
			default:
				Zb^=xc;
				break;
			}
			Da=20;
			return Zb;
		}
		function zc(Zb,ac) {
			ac&=0xffff;
			if(ac) {
				Zb=0;
				while((ac&1)==0) {
					Zb++;
					ac>>=1;
				}
				Ca=1;
			}
			else {
				Ca=0;
			}
			Da=14;
			return Zb;
		}
		function Ac(Zb,ac) {
			if(ac) {
				Zb=0;
				while((ac&1)==0) {
					Zb++;
					ac>>=1;
				}
				Ca=1;
			}
			else {
				Ca=0;
			}
			Da=14;
			return Zb;
		}
		function Bc(Zb,ac) {
			ac&=0xffff;
			if(ac) {
				Zb=15;
				while((ac&0x8000)==0) {
					Zb--;
					ac<<=1;
				}
				Ca=1;
			}
			else {
				Ca=0;
			}
			Da=14;
			return Zb;
		}
		function Cc(Zb,ac) {
			if(ac) {
				Zb=31;
				while(ac>=0) {
					Zb--;
					ac<<=1;
				}
				Ca=1;
			}
			else {
				Ca=0;
			}
			Da=14;
			return Zb;
		}
		function Dc(b) {
			var a,q,r;
			a=Aa[0]&0xffff;
			b&=0xff;
			if((a>>8)>=b)Ec(0);
			q=(a/b)>>0;
			r=(a%b);
			Xb(0,(q&0xff)|(r<<8));
		}
		function Fc(b) {
			var a,q,r;
			a=(Aa[0]<<16)>>16;
			b=(b<<24)>>24;
			if(b==0)Ec(0);
			q=(a/b)>>0;
			if(((q<<24)>>24)!=q)Ec(0);
			r=(a%b);
			Xb(0,(q&0xff)|(r<<8));
		}
		function Gc(b) {
			var a,q,r;
			a=(Aa[2]<<16)|(Aa[0]&0xffff);
			b&=0xffff;
			if((a>>>16)>=b)Ec(0);
			q=(a/b)>>0;
			r=(a%b);
			Xb(0,q);
			Xb(2,r);
		}
		function Hc(b) {
			var a,q,r;
			a=(Aa[2]<<16)|(Aa[0]&0xffff);
			b=(b<<16)>>16;
			if(b==0)Ec(0);
			q=(a/b)>>0;
			if(((q<<16)>>16)!=q)Ec(0);
			r=(a%b);
			Xb(0,q);
			Xb(2,r);
		}
		function Ic(Jc,Kc,b) {
			var a,i,Lc;
			Jc=Jc>>>0;
			Kc=Kc>>>0;
			b=b>>>0;
			if(Jc>=b) {
				Ec(0);
			}
			if(Jc>=0&&Jc<=0x200000) {
				a=Jc*4294967296+Kc;
				Pa=(a%b)>>0;
				return(a/b)>>0;
			}
			else {
				for(i=0; i<32; i++) {
					Lc=Jc>>31;
					Jc=((Jc<<1)|(Kc>>>31))>>>0;
					if(Lc||Jc>=b) {
						Jc=Jc-b;
						Kc=(Kc<<1)|1;
					}
					else {
						Kc=Kc<<1;
					}
				}
				Pa=Jc>>0;
				return Kc;
			}
		}
		function Mc(Jc,Kc,b) {
			var Nc,Oc,q;
			if(Jc<0) {
				Nc=1;
				Jc=~Jc;
				Kc=(-Kc)>>0;
				if(Kc==0)Jc=(Jc+1)>>0;
			}
			else {
				Nc=0;
			}
			if(b<0) {
				b=(-b)>>0;
				Oc=1;
			}
			else {
				Oc=0;
			}
			q=Ic(Jc,Kc,b);
			Oc^=Nc;
			if(Oc) {
				if((q>>>0)>0x80000000)Ec(0);
				q=(-q)>>0;
			}
			else {
				if((q>>>0)>=0x80000000)Ec(0);
			}
			if(Nc) {
				Pa=(-Pa)>>0;
			}
			return q;
		}
		function Pc(a,b) {
			var rc;
			a&=0xff;
			b&=0xff;
			rc=(Aa[0]&0xff)*(b&0xff);
			Ba=rc>>8;
			Ca=(((rc)<<24)>>24);
			Da=21;
			return rc;
		}
		function Qc(a,b) {
			var rc;
			a=(((a)<<24)>>24);
			b=(((b)<<24)>>24);
			rc=(a*b)>>0;
			Ca=(((rc)<<24)>>24);
			Ba=(rc!=Ca)>>0;
			Da=21;
			return rc;
		}
		function Rc(a,b) {
			var rc;
			rc=((a&0xffff)*(b&0xffff))>>0;
			Ba=rc>>>16;
			Ca=(((rc)<<16)>>16);
			Da=22;
			return rc;
		}
		function Sc(a,b) {
			var rc;
			a=(a<<16)>>16;
			b=(b<<16)>>16;
			rc=(a*b)>>0;
			Ca=(((rc)<<16)>>16);
			Ba=(rc!=Ca)>>0;
			Da=22;
			return rc;
		}
		function Tc(a,b) {
			var r,Kc,Jc,Uc,Vc,m;
			a=a>>>0;
			b=b>>>0;
			r=a*b;
			if(r<=0xffffffff) {
				Pa=0;
				r&=-1;
			}
			else {
				Kc=a&0xffff;
				Jc=a>>>16;
				Uc=b&0xffff;
				Vc=b>>>16;
				r=Kc*Uc;
				Pa=Jc*Vc;
				m=Kc*Vc;
				r+=(((m&0xffff)<<16)>>>0);
				Pa+=(m>>>16);
				if(r>=4294967296) {
					r-=4294967296;
					Pa++;
				}
				m=Jc*Uc;
				r+=(((m&0xffff)<<16)>>>0);
				Pa+=(m>>>16);
				if(r>=4294967296) {
					r-=4294967296;
					Pa++;
				}
				r&=-1;
				Pa&=-1;
			}
			return r;
		}
		function Wc(a,b) {
			Ca=Tc(a,b);
			Ba=Pa;
			Da=23;
			return Ca;
		}
		function Xc(a,b) {
			var s,r;
			s=0;
			if(a<0) {
				a=-a;
				s=1;
			}
			if(b<0) {
				b=-b;
				s^=1;
			}
			r=Tc(a,b);
			if(s) {
				Pa=~Pa;
				r=(-r)>>0;
				if(r==0) {
					Pa=(Pa+1)>>0;
				}
			}
			Ca=r;
			Ba=(Pa-(r>>31))>>0;
			Da=23;
			return r;
		}
		function cc() {
			var Zb,rc,Yc,Zc;
			if(Da>=25) {
				Yc=Ea;
				Zc=Fa;
			}
			else {
				Yc=Da;
				Zc=Ca;
			}
			switch(Yc) {
			case 0:
				rc=(Zc&0xff)<(Ba&0xff);
				break;
			case 1:
				rc=(Zc&0xffff)<(Ba&0xffff);
				break;
			case 2:
				rc=(Zc>>>0)<(Ba>>>0);
				break;
			case 3:
				rc=(Zc&0xff)<=(Ba&0xff);
				break;
			case 4:
				rc=(Zc&0xffff)<=(Ba&0xffff);
				break;
			case 5:
				rc=(Zc>>>0)<=(Ba>>>0);
				break;
			case 6:
				rc=((Zc+Ba)&0xff)<(Ba&0xff);
				break;
			case 7:
				rc=((Zc+Ba)&0xffff)<(Ba&0xffff);
				break;
			case 8:
				rc=((Zc+Ba)>>>0)<(Ba>>>0);
				break;
			case 9:
				Zb=(Zc+Ba+1)&0xff;
				rc=Zb<=(Ba&0xff);
				break;
			case 10:
				Zb=(Zc+Ba+1)&0xffff;
				rc=Zb<=(Ba&0xffff);
				break;
			case 11:
				Zb=(Zc+Ba+1)>>>0;
				rc=Zb<=(Ba>>>0);
				break;
			case 12:
			case 13:
			case 14:
				rc=0;
				break;
			case 15:
				rc=(Ba>>7)&1;
				break;
			case 16:
				rc=(Ba>>15)&1;
				break;
			case 17:
				rc=(Ba>>31)&1;
				break;
			case 18:
			case 19:
			case 20:
				rc=Ba&1;
				break;
			case 21:
			case 22:
			case 23:
				rc=Ba!=0;
				break;
			case 24:
				rc=Ba&1;
				break;
			default:
				throw"GET_CARRY: unsupported cc_op="+Da;
			}
			return rc;
		}
		function ad() {
			var rc,Zb;
			switch(Da) {
			case 0:
				Zb=(Ca-Ba)>>0;
				rc=(((Zb^Ba^-1)&(Zb^Ca))>>7)&1;
				break;
			case 1:
				Zb=(Ca-Ba)>>0;
				rc=(((Zb^Ba^-1)&(Zb^Ca))>>15)&1;
				break;
			case 2:
				Zb=(Ca-Ba)>>0;
				rc=(((Zb^Ba^-1)&(Zb^Ca))>>31)&1;
				break;
			case 3:
				Zb=(Ca-Ba-1)>>0;
				rc=(((Zb^Ba^-1)&(Zb^Ca))>>7)&1;
				break;
			case 4:
				Zb=(Ca-Ba-1)>>0;
				rc=(((Zb^Ba^-1)&(Zb^Ca))>>15)&1;
				break;
			case 5:
				Zb=(Ca-Ba-1)>>0;
				rc=(((Zb^Ba^-1)&(Zb^Ca))>>31)&1;
				break;
			case 6:
				Zb=(Ca+Ba)>>0;
				rc=(((Zb^Ba)&(Zb^Ca))>>7)&1;
				break;
			case 7:
				Zb=(Ca+Ba)>>0;
				rc=(((Zb^Ba)&(Zb^Ca))>>15)&1;
				break;
			case 8:
				Zb=(Ca+Ba)>>0;
				rc=(((Zb^Ba)&(Zb^Ca))>>31)&1;
				break;
			case 9:
				Zb=(Ca+Ba+1)>>0;
				rc=(((Zb^Ba)&(Zb^Ca))>>7)&1;
				break;
			case 10:
				Zb=(Ca+Ba+1)>>0;
				rc=(((Zb^Ba)&(Zb^Ca))>>15)&1;
				break;
			case 11:
				Zb=(Ca+Ba+1)>>0;
				rc=(((Zb^Ba)&(Zb^Ca))>>31)&1;
				break;
			case 12:
			case 13:
			case 14:
				rc=0;
				break;
			case 15:
			case 18:
				rc=((Ba^Ca)>>7)&1;
				break;
			case 16:
			case 19:
				rc=((Ba^Ca)>>15)&1;
				break;
			case 17:
			case 20:
				rc=((Ba^Ca)>>31)&1;
				break;
			case 21:
			case 22:
			case 23:
				rc=Ba!=0;
				break;
			case 24:
				rc=(Ba>>11)&1;
				break;
			case 25:
				rc=(Ca&0xff)==0x80;
				break;
			case 26:
				rc=(Ca&0xffff)==0x8000;
				break;
			case 27:
				rc=(Ca==-2147483648);
				break;
			case 28:
				rc=(Ca&0xff)==0x7f;
				break;
			case 29:
				rc=(Ca&0xffff)==0x7fff;
				break;
			case 30:
				rc=Ca==0x7fffffff;
				break;
			default:
				throw"JO: unsupported cc_op="+Da;
			}
			return rc;
		}
		function bd() {
			var rc;
			switch(Da) {
			case 6:
				rc=((Ca+Ba)&0xff)<=(Ba&0xff);
				break;
			case 7:
				rc=((Ca+Ba)&0xffff)<=(Ba&0xffff);
				break;
			case 8:
				rc=((Ca+Ba)>>>0)<=(Ba>>>0);
				break;
			case 24:
				rc=(Ba&(0x0040|0x0001))!=0;
				break;
			default:
				rc=cc()|(Ca==0);
				break;
			}
			return rc;
		}
		function cd() {
			if(Da==24) {
				return(Ba>>2)&1;
			}
			else {
				return aa[Ca&0xff];
			}
		}
		function dd() {
			var rc;
			switch(Da) {
			case 6:
				rc=((Ca+Ba)<<24)<(Ba<<24);
				break;
			case 7:
				rc=((Ca+Ba)<<16)<(Ba<<16);
				break;
			case 8:
				rc=((Ca+Ba)>>0)<Ba;
				break;
			case 12:
			case 25:
			case 28:
			case 13:
			case 26:
			case 29:
			case 14:
			case 27:
			case 30:
				rc=Ca<0;
				break;
			case 24:
				rc=((Ba>>7)^(Ba>>11))&1;
				break;
			default:
				rc=(Da==24?((Ba>>7)&1):(Ca<0))^ad();
				break;
			}
			return rc;
		}
		function ed() {
			var rc;
			switch(Da) {
			case 6:
				rc=((Ca+Ba)<<24)<=(Ba<<24);
				break;
			case 7:
				rc=((Ca+Ba)<<16)<=(Ba<<16);
				break;
			case 8:
				rc=((Ca+Ba)>>0)<=Ba;
				break;
			case 12:
			case 25:
			case 28:
			case 13:
			case 26:
			case 29:
			case 14:
			case 27:
			case 30:
				rc=Ca<=0;
				break;
			case 24:
				rc=(((Ba>>7)^(Ba>>11))|(Ba>>6))&1;
				break;
			default:
				rc=((Da==24?((Ba>>7)&1):(Ca<0))^ad())|(Ca==0);
				break;
			}
			return rc;
		}
		function fd() {
			var Zb,rc;
			switch(Da) {
			case 0:
			case 1:
			case 2:
				Zb=(Ca-Ba)>>0;
				rc=(Ca^Zb^Ba)&0x10;
				break;
			case 3:
			case 4:
			case 5:
				Zb=(Ca-Ba-1)>>0;
				rc=(Ca^Zb^Ba)&0x10;
				break;
			case 6:
			case 7:
			case 8:
				Zb=(Ca+Ba)>>0;
				rc=(Ca^Zb^Ba)&0x10;
				break;
			case 9:
			case 10:
			case 11:
				Zb=(Ca+Ba+1)>>0;
				rc=(Ca^Zb^Ba)&0x10;
				break;
			case 12:
			case 13:
			case 14:
				rc=0;
				break;
			case 15:
			case 18:
			case 16:
			case 19:
			case 17:
			case 20:
			case 21:
			case 22:
			case 23:
				rc=0;
				break;
			case 24:
				rc=Ba&0x10;
				break;
			case 25:
			case 26:
			case 27:
				rc=(Ca^(Ca-1))&0x10;
				break;
			case 28:
			case 29:
			case 30:
				rc=(Ca^(Ca+1))&0x10;
				break;
			default:
				throw"AF: unsupported cc_op="+Da;
			}
			return rc;
		}
		function gd(hd) {
			var rc;
			switch(hd>>1) {
			case 0:
				rc=ad();
				break;
			case 1:
				rc=cc();
				break;
			case 2:
				rc=(Ca==0);
				break;
			case 3:
				rc=bd();
				break;
			case 4:
				rc=(Da==24?((Ba>>7)&1):(Ca<0));
				break;
			case 5:
				rc=cd();
				break;
			case 6:
				rc=dd();
				break;
			case 7:
				rc=ed();
				break;
			default:
				throw"unsupported cond: "+hd;
			}
			return rc^(hd&1);
		}
		function mc() {
			return(cd()<<2)|((Ca==0)<<6)|((Da==24?((Ba>>7)&1):(Ca<0))<<7)|fd();
		}
		function id() {
			return(cc()<<0)|(cd()<<2)|((Ca==0)<<6)|((Da==24?((Ba>>7)&1):(Ca<0))<<7)|(ad()<<11)|fd();
		}
		function jd() {
			var kd;
			kd=id();
			kd|=za.df&0x00000400;
			kd|=za.eflags;
			return kd;
		}
		function ld(kd,md) {
			Ba=kd&(0x0800|0x0080|0x0040|0x0010|0x0004|0x0001);
			Ca=((Ba>>6)&1)^1;
			Da=24;
			za.df=1-(2*((kd>>10)&1));
			za.eflags=(za.eflags&~md)|(kd&md);
		}
		function nd() {
			return za.cycle_count+(xa-Na);
		}
		function od(qa) {
			throw"CPU abort: "+qa;
		}
		function pd() {
			za.eip=Kb;
			za.cc_src=Ba;
			za.cc_dst=Ca;
			za.cc_op=Da;
			za.cc_op2=Ea;
			za.cc_dst2=Fa;
			za.dump();
		}
		function qd() {
			za.eip=Kb;
			za.cc_src=Ba;
			za.cc_dst=Ca;
			za.cc_op=Da;
			za.cc_op2=Ea;
			za.cc_dst2=Fa;
			za.dump_short();
		}
		function rd(intno,error_code) {
			print("cycle count increment in rd("+intno+","+error_code+") = "+(xa-Na));
			//throw "rd used";
			za.cycle_count+=(xa-Na);
			za.eip=Kb;
			za.cc_src=Ba;
			za.cc_dst=Ca;
			za.cc_op=Da;
			za.cc_op2=Ea;
			za.cc_dst2=Fa;
			throw {intno: intno, error_code: error_code};
		}
		function Ec(intno) {
			rd(intno,0);
		}
		function sd(td) {
			za.cpl=td;
			if(za.cpl==3) {
				cb=ab;
				db=bb;
			}
			else {
				cb=Ya;
				db=Za;
			}
		}
		function ud(ia,vd) {
			var fb;
			if(vd) {
				fb=db[ia>>>12];
			}
			else {
				fb=cb[ia>>>12];
			}
			if(fb==-1) {
				gb(ia,vd,za.cpl==3);
				if(vd) {
					fb=db[ia>>>12];
				}
				else {
					fb=cb[ia>>>12];
				}
			}
			return fb^ia;
		}
		function wd(ja) {
			var xd;
			xd=Aa[4]-2;
			ia=((xd&Sa)+Ra)>>0;
			vb(ja);
			Aa[4]=(Aa[4]&~Sa)|((xd)&Sa);
		}
		function yd(ja) {
			var xd;
			xd=Aa[4]-4;
			ia=((xd&Sa)+Ra)>>0;
			xb(ja);
			Aa[4]=(Aa[4]&~Sa)|((xd)&Sa);
		}
		function zd() {
			ia=((Aa[4]&Sa)+Ra)>>0;
			return jb();
		}
		function Ad() {
			Aa[4]=(Aa[4]&~Sa)|((Aa[4]+2)&Sa);
		}
		function Bd() {
			ia=((Aa[4]&Sa)+Ra)>>0;
			return lb();
		}
		function Cd() {
			Aa[4]=(Aa[4]&~Sa)|((Aa[4]+4)&Sa);
		}
		function Dd(Ob,b) {
			var n,Ga,l,Ha,Ed,base,Ma,Fd;
			n=1;
			Ga=Ua;
			if(Ga&0x0100)Fd=2;
			else Fd=4;
	Gd:
			for(;;) {
				switch(b) {
				case 0x66:
					if(Ua&0x0100) {
						Fd=4;
						Ga&=~0x0100;
					}
					else {
						Fd=2;
						Ga|=0x0100;
					}
				case 0xf0:
				case 0xf2:
				case 0xf3:
				case 0x26:
				case 0x2e:
				case 0x36:
				case 0x3e:
				case 0x64:
				case 0x65: {
					if((n+1)>15)Ec(6);
					ia=(Ob+(n++))>>0;
					b=(((Xa=cb[ia>>>12])==-1)?eb():Wa[ia^Xa]);
				};
				break;
				case 0x67:
					if(Ua&0x0080) {
						Ga&=~0x0080;
					}
					else {
						Ga|=0x0080;
					}{
						if((n+1)>15)Ec(6);
						ia=(Ob+(n++))>>0;
						b=(((Xa=cb[ia>>>12])==-1)?eb():Wa[ia^Xa]);
					};
					break;
				case 0x91:
				case 0x92:
				case 0x93:
				case 0x94:
				case 0x95:
				case 0x96:
				case 0x97:
				case 0x40:
				case 0x41:
				case 0x42:
				case 0x43:
				case 0x44:
				case 0x45:
				case 0x46:
				case 0x47:
				case 0x48:
				case 0x49:
				case 0x4a:
				case 0x4b:
				case 0x4c:
				case 0x4d:
				case 0x4e:
				case 0x4f:
				case 0x50:
				case 0x51:
				case 0x52:
				case 0x53:
				case 0x54:
				case 0x55:
				case 0x56:
				case 0x57:
				case 0x58:
				case 0x59:
				case 0x5a:
				case 0x5b:
				case 0x5c:
				case 0x5d:
				case 0x5e:
				case 0x5f:
				case 0x98:
				case 0x99:
				case 0xc9:
				case 0x9c:
				case 0x9d:
				case 0x06:
				case 0x0e:
				case 0x16:
				case 0x1e:
				case 0x07:
				case 0x17:
				case 0x1f:
				case 0xc3:
				case 0xcb:
				case 0x90:
				case 0xcc:
				case 0xce:
				case 0xcf:
				case 0xf5:
				case 0xf8:
				case 0xf9:
				case 0xfc:
				case 0xfd:
				case 0xfa:
				case 0xfb:
				case 0x9e:
				case 0x9f:
				case 0xf4:
				case 0xa4:
				case 0xa5:
				case 0xaa:
				case 0xab:
				case 0xa6:
				case 0xa7:
				case 0xac:
				case 0xad:
				case 0xae:
				case 0xaf:
				case 0x9b:
				case 0xec:
				case 0xed:
				case 0xee:
				case 0xef:
				case 0xd7:
				case 0x27:
				case 0x2f:
				case 0x37:
				case 0x3f:
				case 0x60:
				case 0x61:
				case 0x6c:
				case 0x6d:
				case 0x6e:
				case 0x6f:
					break Gd;
				case 0xb0:
				case 0xb1:
				case 0xb2:
				case 0xb3:
				case 0xb4:
				case 0xb5:
				case 0xb6:
				case 0xb7:
				case 0x04:
				case 0x0c:
				case 0x14:
				case 0x1c:
				case 0x24:
				case 0x2c:
				case 0x34:
				case 0x3c:
				case 0xa8:
				case 0x6a:
				case 0xeb:
				case 0x70:
				case 0x71:
				case 0x72:
				case 0x73:
				case 0x76:
				case 0x77:
				case 0x78:
				case 0x79:
				case 0x7a:
				case 0x7b:
				case 0x7c:
				case 0x7d:
				case 0x7e:
				case 0x7f:
				case 0x74:
				case 0x75:
				case 0xe0:
				case 0xe1:
				case 0xe2:
				case 0xe3:
				case 0xcd:
				case 0xe4:
				case 0xe5:
				case 0xe6:
				case 0xe7:
				case 0xd4:
				case 0xd5:
					n++;
					if(n>15)Ec(6);
					break Gd;
				case 0xb8:
				case 0xb9:
				case 0xba:
				case 0xbb:
				case 0xbc:
				case 0xbd:
				case 0xbe:
				case 0xbf:
				case 0x05:
				case 0x0d:
				case 0x15:
				case 0x1d:
				case 0x25:
				case 0x2d:
				case 0x35:
				case 0x3d:
				case 0xa9:
				case 0x68:
				case 0xe9:
				case 0xe8:
					n+=Fd;
					if(n>15)Ec(6);
					break Gd;
				case 0x88:
				case 0x89:
				case 0x8a:
				case 0x8b:
				case 0x86:
				case 0x87:
				case 0x8e:
				case 0x8c:
				case 0xc4:
				case 0xc5:
				case 0x00:
				case 0x08:
				case 0x10:
				case 0x18:
				case 0x20:
				case 0x28:
				case 0x30:
				case 0x38:
				case 0x01:
				case 0x09:
				case 0x11:
				case 0x19:
				case 0x21:
				case 0x29:
				case 0x31:
				case 0x39:
				case 0x02:
				case 0x0a:
				case 0x12:
				case 0x1a:
				case 0x22:
				case 0x2a:
				case 0x32:
				case 0x3a:
				case 0x03:
				case 0x0b:
				case 0x13:
				case 0x1b:
				case 0x23:
				case 0x2b:
				case 0x33:
				case 0x3b:
				case 0x84:
				case 0x85:
				case 0xd0:
				case 0xd1:
				case 0xd2:
				case 0xd3:
				case 0x8f:
				case 0x8d:
				case 0xfe:
				case 0xff:
				case 0xd8:
				case 0xd9:
				case 0xda:
				case 0xdb:
				case 0xdc:
				case 0xdd:
				case 0xde:
				case 0xdf:
				case 0x62:
				case 0x63: {{
						if((n+1)>15)Ec(6);
						ia=(Ob+(n++))>>0;
						Ha=(((Xa=cb[ia>>>12])==-1)?eb():Wa[ia^Xa]);
					};
					if(Ga&0x0080) {
						switch(Ha>>6) {
						case 0:
							if((Ha&7)==6)n+=2;
							break;
						case 1:
							n++;
							break;
						default:
							n+=2;
							break;
						}
					}
					else {
						switch((Ha&7)|((Ha>>3)&0x18)) {
						case 0x04: {
							if((n+1)>15)Ec(6);
							ia=(Ob+(n++))>>0;
							Ed=(((Xa=cb[ia>>>12])==-1)?eb():Wa[ia^Xa]);
						};
						if((Ed&7)==5) {
							n+=4;
						}
						break;
						case 0x0c:
							n+=2;
							break;
						case 0x14:
							n+=5;
							break;
						case 0x05:
							n+=4;
							break;
						case 0x00:
						case 0x01:
						case 0x02:
						case 0x03:
						case 0x06:
						case 0x07:
							break;
						case 0x08:
						case 0x09:
						case 0x0a:
						case 0x0b:
						case 0x0d:
						case 0x0e:
						case 0x0f:
							n++;
							break;
						case 0x10:
						case 0x11:
						case 0x12:
						case 0x13:
						case 0x15:
						case 0x16:
						case 0x17:
							n+=4;
							break;
						}
					}
					if(n>15)Ec(6);
				};
				break Gd;
				case 0xa0:
				case 0xa1:
				case 0xa2:
				case 0xa3:
					if(Ga&0x0100)n+=2;
					else n+=4;
					if(n>15)Ec(6);
					break Gd;
				case 0xc6:
				case 0x80:
				case 0x82:
				case 0x83:
				case 0x6b:
				case 0xc0:
				case 0xc1: {{
						if((n+1)>15)Ec(6);
						ia=(Ob+(n++))>>0;
						Ha=(((Xa=cb[ia>>>12])==-1)?eb():Wa[ia^Xa]);
					};
					if(Ga&0x0080) {
						switch(Ha>>6) {
						case 0:
							if((Ha&7)==6)n+=2;
							break;
						case 1:
							n++;
							break;
						default:
							n+=2;
							break;
						}
					}
					else {
						switch((Ha&7)|((Ha>>3)&0x18)) {
						case 0x04: {
							if((n+1)>15)Ec(6);
							ia=(Ob+(n++))>>0;
							Ed=(((Xa=cb[ia>>>12])==-1)?eb():Wa[ia^Xa]);
						};
						if((Ed&7)==5) {
							n+=4;
						}
						break;
						case 0x0c:
							n+=2;
							break;
						case 0x14:
							n+=5;
							break;
						case 0x05:
							n+=4;
							break;
						case 0x00:
						case 0x01:
						case 0x02:
						case 0x03:
						case 0x06:
						case 0x07:
							break;
						case 0x08:
						case 0x09:
						case 0x0a:
						case 0x0b:
						case 0x0d:
						case 0x0e:
						case 0x0f:
							n++;
							break;
						case 0x10:
						case 0x11:
						case 0x12:
						case 0x13:
						case 0x15:
						case 0x16:
						case 0x17:
							n+=4;
							break;
						}
					}
					if(n>15)Ec(6);
				};
				n++;
				if(n>15)Ec(6);
				break Gd;
				case 0xc7:
				case 0x81:
				case 0x69: {{
						if((n+1)>15)Ec(6);
						ia=(Ob+(n++))>>0;
						Ha=(((Xa=cb[ia>>>12])==-1)?eb():Wa[ia^Xa]);
					};
					if(Ga&0x0080) {
						switch(Ha>>6) {
						case 0:
							if((Ha&7)==6)n+=2;
							break;
						case 1:
							n++;
							break;
						default:
							n+=2;
							break;
						}
					}
					else {
						switch((Ha&7)|((Ha>>3)&0x18)) {
						case 0x04: {
							if((n+1)>15)Ec(6);
							ia=(Ob+(n++))>>0;
							Ed=(((Xa=cb[ia>>>12])==-1)?eb():Wa[ia^Xa]);
						};
						if((Ed&7)==5) {
							n+=4;
						}
						break;
						case 0x0c:
							n+=2;
							break;
						case 0x14:
							n+=5;
							break;
						case 0x05:
							n+=4;
							break;
						case 0x00:
						case 0x01:
						case 0x02:
						case 0x03:
						case 0x06:
						case 0x07:
							break;
						case 0x08:
						case 0x09:
						case 0x0a:
						case 0x0b:
						case 0x0d:
						case 0x0e:
						case 0x0f:
							n++;
							break;
						case 0x10:
						case 0x11:
						case 0x12:
						case 0x13:
						case 0x15:
						case 0x16:
						case 0x17:
							n+=4;
							break;
						}
					}
					if(n>15)Ec(6);
				};
				n+=Fd;
				if(n>15)Ec(6);
				break Gd;
				case 0xf6: {{
						if((n+1)>15)Ec(6);
						ia=(Ob+(n++))>>0;
						Ha=(((Xa=cb[ia>>>12])==-1)?eb():Wa[ia^Xa]);
					};
					if(Ga&0x0080) {
						switch(Ha>>6) {
						case 0:
							if((Ha&7)==6)n+=2;
							break;
						case 1:
							n++;
							break;
						default:
							n+=2;
							break;
						}
					}
					else {
						switch((Ha&7)|((Ha>>3)&0x18)) {
						case 0x04: {
							if((n+1)>15)Ec(6);
							ia=(Ob+(n++))>>0;
							Ed=(((Xa=cb[ia>>>12])==-1)?eb():Wa[ia^Xa]);
						};
						if((Ed&7)==5) {
							n+=4;
						}
						break;
						case 0x0c:
							n+=2;
							break;
						case 0x14:
							n+=5;
							break;
						case 0x05:
							n+=4;
							break;
						case 0x00:
						case 0x01:
						case 0x02:
						case 0x03:
						case 0x06:
						case 0x07:
							break;
						case 0x08:
						case 0x09:
						case 0x0a:
						case 0x0b:
						case 0x0d:
						case 0x0e:
						case 0x0f:
							n++;
							break;
						case 0x10:
						case 0x11:
						case 0x12:
						case 0x13:
						case 0x15:
						case 0x16:
						case 0x17:
							n+=4;
							break;
						}
					}
					if(n>15)Ec(6);
				};
				Ma=(Ha>>3)&7;
				if(Ma==0) {
					n++;
					if(n>15)Ec(6);
				}
				break Gd;
				case 0xf7: {{
						if((n+1)>15)Ec(6);
						ia=(Ob+(n++))>>0;
						Ha=(((Xa=cb[ia>>>12])==-1)?eb():Wa[ia^Xa]);
					};
					if(Ga&0x0080) {
						switch(Ha>>6) {
						case 0:
							if((Ha&7)==6)n+=2;
							break;
						case 1:
							n++;
							break;
						default:
							n+=2;
							break;
						}
					}
					else {
						switch((Ha&7)|((Ha>>3)&0x18)) {
						case 0x04: {
							if((n+1)>15)Ec(6);
							ia=(Ob+(n++))>>0;
							Ed=(((Xa=cb[ia>>>12])==-1)?eb():Wa[ia^Xa]);
						};
						if((Ed&7)==5) {
							n+=4;
						}
						break;
						case 0x0c:
							n+=2;
							break;
						case 0x14:
							n+=5;
							break;
						case 0x05:
							n+=4;
							break;
						case 0x00:
						case 0x01:
						case 0x02:
						case 0x03:
						case 0x06:
						case 0x07:
							break;
						case 0x08:
						case 0x09:
						case 0x0a:
						case 0x0b:
						case 0x0d:
						case 0x0e:
						case 0x0f:
							n++;
							break;
						case 0x10:
						case 0x11:
						case 0x12:
						case 0x13:
						case 0x15:
						case 0x16:
						case 0x17:
							n+=4;
							break;
						}
					}
					if(n>15)Ec(6);
				};
				Ma=(Ha>>3)&7;
				if(Ma==0) {
					n+=Fd;
					if(n>15)Ec(6);
				}
				break Gd;
				case 0xea:
				case 0x9a:
					n+=2+Fd;
					if(n>15)Ec(6);
					break Gd;
				case 0xc2:
				case 0xca:
					n+=2;
					if(n>15)Ec(6);
					break Gd;
				case 0xc8:
					n+=3;
					if(n>15)Ec(6);
					break Gd;
				case 0xd6:
				case 0xf1:
				default:
					Ec(6);
				case 0x0f: {
					if((n+1)>15)Ec(6);
					ia=(Ob+(n++))>>0;
					b=(((Xa=cb[ia>>>12])==-1)?eb():Wa[ia^Xa]);
				};
				switch(b) {
				case 0x06:
				case 0xa2:
				case 0x31:
				case 0xa0:
				case 0xa8:
				case 0xa1:
				case 0xa9:
				case 0xc8:
				case 0xc9:
				case 0xca:
				case 0xcb:
				case 0xcc:
				case 0xcd:
				case 0xce:
				case 0xcf:
					break Gd;
				case 0x80:
				case 0x81:
				case 0x82:
				case 0x83:
				case 0x84:
				case 0x85:
				case 0x86:
				case 0x87:
				case 0x88:
				case 0x89:
				case 0x8a:
				case 0x8b:
				case 0x8c:
				case 0x8d:
				case 0x8e:
				case 0x8f:
					n+=Fd;
					if(n>15)Ec(6);
					break Gd;
				case 0x90:
				case 0x91:
				case 0x92:
				case 0x93:
				case 0x94:
				case 0x95:
				case 0x96:
				case 0x97:
				case 0x98:
				case 0x99:
				case 0x9a:
				case 0x9b:
				case 0x9c:
				case 0x9d:
				case 0x9e:
				case 0x9f:
				case 0x40:
				case 0x41:
				case 0x42:
				case 0x43:
				case 0x44:
				case 0x45:
				case 0x46:
				case 0x47:
				case 0x48:
				case 0x49:
				case 0x4a:
				case 0x4b:
				case 0x4c:
				case 0x4d:
				case 0x4e:
				case 0x4f:
				case 0xb6:
				case 0xb7:
				case 0xbe:
				case 0xbf:
				case 0x00:
				case 0x01:
				case 0x02:
				case 0x03:
				case 0x20:
				case 0x22:
				case 0x23:
				case 0xb2:
				case 0xb4:
				case 0xb5:
				case 0xa5:
				case 0xad:
				case 0xa3:
				case 0xab:
				case 0xb3:
				case 0xbb:
				case 0xbc:
				case 0xbd:
				case 0xaf:
				case 0xc0:
				case 0xc1:
				case 0xb0:
				case 0xb1: {{
						if((n+1)>15)Ec(6);
						ia=(Ob+(n++))>>0;
						Ha=(((Xa=cb[ia>>>12])==-1)?eb():Wa[ia^Xa]);
					};
					if(Ga&0x0080) {
						switch(Ha>>6) {
						case 0:
							if((Ha&7)==6)n+=2;
							break;
						case 1:
							n++;
							break;
						default:
							n+=2;
							break;
						}
					}
					else {
						switch((Ha&7)|((Ha>>3)&0x18)) {
						case 0x04: {
							if((n+1)>15)Ec(6);
							ia=(Ob+(n++))>>0;
							Ed=(((Xa=cb[ia>>>12])==-1)?eb():Wa[ia^Xa]);
						};
						if((Ed&7)==5) {
							n+=4;
						}
						break;
						case 0x0c:
							n+=2;
							break;
						case 0x14:
							n+=5;
							break;
						case 0x05:
							n+=4;
							break;
						case 0x00:
						case 0x01:
						case 0x02:
						case 0x03:
						case 0x06:
						case 0x07:
							break;
						case 0x08:
						case 0x09:
						case 0x0a:
						case 0x0b:
						case 0x0d:
						case 0x0e:
						case 0x0f:
							n++;
							break;
						case 0x10:
						case 0x11:
						case 0x12:
						case 0x13:
						case 0x15:
						case 0x16:
						case 0x17:
							n+=4;
							break;
						}
					}
					if(n>15)Ec(6);
				};
				break Gd;
				case 0xa4:
				case 0xac:
				case 0xba: {{
						if((n+1)>15)Ec(6);
						ia=(Ob+(n++))>>0;
						Ha=(((Xa=cb[ia>>>12])==-1)?eb():Wa[ia^Xa]);
					};
					if(Ga&0x0080) {
						switch(Ha>>6) {
						case 0:
							if((Ha&7)==6)n+=2;
							break;
						case 1:
							n++;
							break;
						default:
							n+=2;
							break;
						}
					}
					else {
						switch((Ha&7)|((Ha>>3)&0x18)) {
						case 0x04: {
							if((n+1)>15)Ec(6);
							ia=(Ob+(n++))>>0;
							Ed=(((Xa=cb[ia>>>12])==-1)?eb():Wa[ia^Xa]);
						};
						if((Ed&7)==5) {
							n+=4;
						}
						break;
						case 0x0c:
							n+=2;
							break;
						case 0x14:
							n+=5;
							break;
						case 0x05:
							n+=4;
							break;
						case 0x00:
						case 0x01:
						case 0x02:
						case 0x03:
						case 0x06:
						case 0x07:
							break;
						case 0x08:
						case 0x09:
						case 0x0a:
						case 0x0b:
						case 0x0d:
						case 0x0e:
						case 0x0f:
							n++;
							break;
						case 0x10:
						case 0x11:
						case 0x12:
						case 0x13:
						case 0x15:
						case 0x16:
						case 0x17:
							n+=4;
							break;
						}
					}
					if(n>15)Ec(6);
				};
				n++;
				if(n>15)Ec(6);
				break Gd;
				case 0x04:
				case 0x05:
				case 0x07:
				case 0x08:
				case 0x09:
				case 0x0a:
				case 0x0b:
				case 0x0c:
				case 0x0d:
				case 0x0e:
				case 0x0f:
				case 0x10:
				case 0x11:
				case 0x12:
				case 0x13:
				case 0x14:
				case 0x15:
				case 0x16:
				case 0x17:
				case 0x18:
				case 0x19:
				case 0x1a:
				case 0x1b:
				case 0x1c:
				case 0x1d:
				case 0x1e:
				case 0x1f:
				case 0x21:
				case 0x24:
				case 0x25:
				case 0x26:
				case 0x27:
				case 0x28:
				case 0x29:
				case 0x2a:
				case 0x2b:
				case 0x2c:
				case 0x2d:
				case 0x2e:
				case 0x2f:
				case 0x30:
				case 0x32:
				case 0x33:
				case 0x34:
				case 0x35:
				case 0x36:
				case 0x37:
				case 0x38:
				case 0x39:
				case 0x3a:
				case 0x3b:
				case 0x3c:
				case 0x3d:
				case 0x3e:
				case 0x3f:
				case 0x50:
				case 0x51:
				case 0x52:
				case 0x53:
				case 0x54:
				case 0x55:
				case 0x56:
				case 0x57:
				case 0x58:
				case 0x59:
				case 0x5a:
				case 0x5b:
				case 0x5c:
				case 0x5d:
				case 0x5e:
				case 0x5f:
				case 0x60:
				case 0x61:
				case 0x62:
				case 0x63:
				case 0x64:
				case 0x65:
				case 0x66:
				case 0x67:
				case 0x68:
				case 0x69:
				case 0x6a:
				case 0x6b:
				case 0x6c:
				case 0x6d:
				case 0x6e:
				case 0x6f:
				case 0x70:
				case 0x71:
				case 0x72:
				case 0x73:
				case 0x74:
				case 0x75:
				case 0x76:
				case 0x77:
				case 0x78:
				case 0x79:
				case 0x7a:
				case 0x7b:
				case 0x7c:
				case 0x7d:
				case 0x7e:
				case 0x7f:
				case 0xa6:
				case 0xa7:
				case 0xaa:
				case 0xae:
				case 0xb8:
				case 0xb9:
				case 0xc2:
				case 0xc3:
				case 0xc4:
				case 0xc5:
				case 0xc6:
				case 0xc7:
				default:
					Ec(6);
				}
				break;
				}
			}
			return n;
		}
		function gb(Hd,Id,ma) {
			var Jd,Kd,error_code,Ld,Md,Nd,Od,vd,Pd;
			mtable.gb = mtable.gb + 1;
			if(!(za.cr0&(1<<31))) {
				za.tlb_set_page(Hd&-4096,Hd&-4096,1);
			}
			else {
				Jd=(za.cr3&-4096)+((Hd>>20)&0xffc);
				Kd=za.ld32_phys(Jd);
				if(!(Kd&0x00000001)) {
					error_code=0;
				}
				else {
					if(!(Kd&0x00000020)) {
						Kd|=0x00000020;
						za.st32_phys(Jd,Kd);
					}
					Ld=(Kd&-4096)+((Hd>>10)&0xffc);
					Md=za.ld32_phys(Ld);
					if(!(Md&0x00000001)) {
						error_code=0;
					}
					else {
						Nd=Md&Kd;
						if(ma&&!(Nd&0x00000004)) {
							error_code=0x01;
						}
						else if(Id&&!(Nd&0x00000002)) {
							error_code=0x01;
						}
						else {
							Od=(Id&&!(Md&0x00000040));
							if(!(Md&0x00000020)||Od) {
								Md|=0x00000020;
								if(Od)Md|=0x00000040;
								za.st32_phys(Ld,Md);
							}
							vd=0;
							if((Md&0x00000040)&&(Nd&0x00000002))vd=1;
							Pd=0;
							if(Nd&0x00000004)Pd=1;
							za.tlb_set_page(Hd&-4096,Md&-4096,vd,Pd);
							return;
						}
					}
				}
				error_code|=Id<<1;
				if(ma)error_code|=0x04;
				za.cr2=Hd;
				rd(14,error_code);
			}
		}
		function Qd(Rd) {
			if(!(Rd&(1<<0)))od("real mode not supported");
			if((Rd&((1<<31)|(1<<16)|(1<<0)))!=(za.cr0&((1<<31)|(1<<16)|(1<<0)))) {
				za.tlb_flush_all();
			}
			za.cr0=Rd|(1<<4);
		}
		function Sd(Td) {
			za.cr3=Td;
			if(za.cr0&(1<<31)) {
				za.tlb_flush_all();
			}
		}
		function Ud(Vd) {
			za.cr4=Vd;
		}
		function Wd(Xd) {
			if(Xd&(1<<22))return-1;
			else return 0xffff;
		}
		function Yd(selector) {
			var va,Sb,Zd,Xd;
			if(selector&0x4)va=za.ldt;
			else va=za.gdt;
			Sb=selector&~7;
			if((Sb+7)>va.limit)return null;
			ia=va.base+Sb;
			Zd=Db();
			ia+=4;
			Xd=Db();
			return[Zd,Xd];
		}
		function ae(Zd,Xd) {
			var limit;
			limit=(Zd&0xffff)|(Xd&0x000f0000);
			if(Xd&(1<<23))limit=(limit<<12)|0xfff;
			return limit;
		}
		function be(Zd,Xd) {
			return(((Zd>>>16)|((Xd&0xff)<<16)|(Xd&0xff000000)))&-1;
		}
		function ce(va,Zd,Xd) {
			va.base=be(Zd,Xd);
			va.limit=ae(Zd,Xd);
			va.flags=Xd;
		}
		function de() {
			Qa=za.segs[1].base;
			Ra=za.segs[2].base;
			if(za.segs[2].flags&(1<<22))Sa=-1;
			else Sa=0xffff;
			Ta=(((Qa|Ra|za.segs[3].base|za.segs[0].base)==0)&&Sa==-1);
			if(za.segs[1].flags&(1<<22))Ua=0;
			else Ua=0x0100|0x0080;
		}
		function ee(fe,selector,base,limit,flags) {
	za.segs[fe]= {selector:
				  selector,base:
				  base,limit:
				  limit,flags:
						  flags
						 };
			de();
		}
		function ge(Tb,selector) {
			ee(Tb,selector,(selector<<4),0xffff,(1<<15)|(3<<13)|(1<<12)|(1<<8)|(1<<12)|(1<<9));
		}
		function he(ie) {
			var je,Sb,ke,le,me;
			if(!(za.tr.flags&(1<<15)))od("invalid tss");
			je=(za.tr.flags>>8)&0xf;
			if((je&7)!=1)od("invalid tss type");
			ke=je>>3;
			Sb=(ie*4+2)<<ke;
			if(Sb+(4<<ke)-1>za.tr.limit)rd(10,za.tr.selector&0xfffc);
			ia=(za.tr.base+Sb)&-1;
			if(ke==0) {
				me=Bb();
				ia+=2;
			}
			else {
				me=Db();
				ia+=4;
			}
			le=Bb();
			return[le,me];
		}
		function ne(intno,oe,error_code,pe,qe) {
			var va,re,je,ie,selector,se,te;
			var ue,ve,ke;
			var e,Zd,Xd,we,le,me,xe,ye;
			var ze,Sa;
			ue=0;
			if(!oe&&!qe) {
				switch(intno) {
				case 8:
				case 10:
				case 11:
				case 12:
				case 13:
				case 14:
				case 17:
					ue=1;
					break;
				}
			}
			if(oe)ze=pe;
			else ze=Kb;
			va=za.idt;
			if(intno*8+7>va.limit)rd(13,intno*8+2);
			ia=(va.base+intno*8)&-1;
			Zd=Db();
			ia+=4;
			Xd=Db();
			je=(Xd>>8)&0x1f;
			switch(je) {
			case 5:
			case 7:
			case 6:
				throw"unsupported task gate";
			case 14:
			case 15:
				break;
			default:
				rd(13,intno*8+2);
				break;
			}
			ie=(Xd>>13)&3;
			te=za.cpl;
			if(oe&&ie<te)rd(13,intno*8+2);
			if(!(Xd&(1<<15)))rd(11,intno*8+2);
			selector=Zd>>16;
			we=(Xd&-65536)|(Zd&0x0000ffff);
			if((selector&0xfffc)==0)rd(13,0);
			e=Yd(selector);
			if(!e)rd(13,selector&0xfffc);
			Zd=e[0];
			Xd=e[1];
			if(!(Xd&(1<<12))||!(Xd&((1<<11))))rd(13,selector&0xfffc);
			ie=(Xd>>13)&3;
			if(ie>te)rd(13,selector&0xfffc);
			if(!(Xd&(1<<15)))rd(11,selector&0xfffc);
			if(!(Xd&(1<<10))&&ie<te) {
				e=he(ie);
				le=e[0];
				me=e[1];
				if((le&0xfffc)==0)rd(10,le&0xfffc);
				if((le&3)!=ie)rd(10,le&0xfffc);
				e=Yd(le);
				if(!e)rd(10,le&0xfffc);
				xe=e[0];
				ye=e[1];
				se=(ye>>13)&3;
				if(se!=ie)rd(10,le&0xfffc);
				if(!(ye&(1<<12))||(ye&(1<<11))||!(ye&(1<<9)))rd(10,le&0xfffc);
				if(!(ye&(1<<15)))rd(10,le&0xfffc);
				ve=1;
				Sa=Wd(ye);
				re=be(xe,ye);
			}
			else if((Xd&(1<<10))||ie==te) {
				if(za.eflags&0x00020000)rd(13,selector&0xfffc);
				ve=0;
				Sa=Wd(za.segs[2].flags);
				re=za.segs[2].base;
				me=Aa[4];
				ie=te;
			}
			else {
				rd(13,selector&0xfffc);
				ve=0;
				Sa=0;
				re=0;
				me=0;
			}
			ke=je>>3;
			if(ke==1) {
				if(ve) {
					if(za.eflags&0x00020000) {{
							me=(me-4)&-1;
							ia=(re+(me&Sa))&-1;
							Jb(za.segs[5].selector);
						};
						{
							me=(me-4)&-1;
							ia=(re+(me&Sa))&-1;
							Jb(za.segs[4].selector);
						};
						{
							me=(me-4)&-1;
							ia=(re+(me&Sa))&-1;
							Jb(za.segs[3].selector);
						};
						{
							me=(me-4)&-1;
							ia=(re+(me&Sa))&-1;
							Jb(za.segs[0].selector);
						};
					}{
						me=(me-4)&-1;
						ia=(re+(me&Sa))&-1;
						Jb(za.segs[2].selector);
					};
					{
						me=(me-4)&-1;
						ia=(re+(me&Sa))&-1;
						Jb(Aa[4]);
					};
				}{
					me=(me-4)&-1;
					ia=(re+(me&Sa))&-1;
					Jb(jd());
				};
				{
					me=(me-4)&-1;
					ia=(re+(me&Sa))&-1;
					Jb(za.segs[1].selector);
				};
				{
					me=(me-4)&-1;
					ia=(re+(me&Sa))&-1;
					Jb(ze);
				};
				if(ue) {{
						me=(me-4)&-1;
						ia=(re+(me&Sa))&-1;
						Jb(error_code);
					};
				}
			}
			else {
				if(ve) {
					if(za.eflags&0x00020000) {{
							me=(me-2)&-1;
							ia=(re+(me&Sa))&-1;
							Hb(za.segs[5].selector);
						};
						{
							me=(me-2)&-1;
							ia=(re+(me&Sa))&-1;
							Hb(za.segs[4].selector);
						};
						{
							me=(me-2)&-1;
							ia=(re+(me&Sa))&-1;
							Hb(za.segs[3].selector);
						};
						{
							me=(me-2)&-1;
							ia=(re+(me&Sa))&-1;
							Hb(za.segs[0].selector);
						};
					}{
						me=(me-2)&-1;
						ia=(re+(me&Sa))&-1;
						Hb(za.segs[2].selector);
					};
					{
						me=(me-2)&-1;
						ia=(re+(me&Sa))&-1;
						Hb(Aa[4]);
					};
				}{
					me=(me-2)&-1;
					ia=(re+(me&Sa))&-1;
					Hb(jd());
				};
				{
					me=(me-2)&-1;
					ia=(re+(me&Sa))&-1;
					Hb(za.segs[1].selector);
				};
				{
					me=(me-2)&-1;
					ia=(re+(me&Sa))&-1;
					Hb(ze);
				};
				if(ue) {{
						me=(me-2)&-1;
						ia=(re+(me&Sa))&-1;
						Hb(error_code);
					};
				}
			}
			if(ve) {
				if(za.eflags&0x00020000) {
					ee(0,0,0,0,0);
					ee(3,0,0,0,0);
					ee(4,0,0,0,0);
					ee(5,0,0,0,0);
				}
				le=(le&~3)|ie;
				ee(2,le,re,ae(xe,ye),ye);
			}
			Aa[4]=(Aa[4]&~Sa)|((me)&Sa);
			selector=(selector&~3)|ie;
			ee(1,selector,be(Zd,Xd),ae(Zd,Xd),Xd);
			sd(ie);
			Kb=we,Lb=Nb=0;
			if((je&1)==0) {
				za.eflags&=~0x00000200;
			}
			za.eflags&=~(0x00000100|0x00020000|0x00010000|0x00004000);
		}
		function Ae(intno,oe,error_code,pe,qe) {
			var va,re,selector,we,me,ze;
			va=za.idt;
			if(intno*4+3>va.limit)rd(13,intno*8+2);
			ia=(va.base+(intno<<2))>>0;
			we=Bb();
			ia=(ia+2)>>0;
			selector=Bb();
			me=Aa[4];
			if(oe)ze=pe;
			else ze=Kb;
			{
				me=(me-2)>>0;
				ia=((me&Sa)+Ra)>>0;
				vb(jd());
			};
			{
				me=(me-2)>>0;
				ia=((me&Sa)+Ra)>>0;
				vb(za.segs[1].selector);
			};
			{
				me=(me-2)>>0;
				ia=((me&Sa)+Ra)>>0;
				vb(ze);
			};
			Aa[4]=(Aa[4]&~Sa)|((me)&Sa);
			Kb=we,Lb=Nb=0;
			za.segs[1].selector=selector;
			za.segs[1].base=(selector<<4);
			za.eflags&=~(0x00000200|0x00000100|0x00040000|0x00010000);
		}
		function Be(intno,oe,error_code,pe,qe) {
			if(intno==0x06) {
				var Ce=Kb;
				var Ob;
				qa="do_interrupt: intno="+ta(intno)+" error_code="+sa(error_code)+" EIP="+sa(Ce)+" ESP="+sa(Aa[4])+" EAX="+sa(Aa[0])+" EBX="+sa(Aa[3])+" ECX="+sa(Aa[1]);
				if(intno==0x0e) {
					qa+=" CR2="+sa(za.cr2);
				}
				print(qa);
				if(intno==0x06) {
					var qa,i,n;
					qa="Code:";
					Ob=(Ce+Qa)>>0;
					n=4096-(Ob&0xfff);
					if(n>15)n=15;
					for(i=0; i<n; i++) {
						ia=(Ob+i)&-1;
						qa+=" "+ta(hb());
					}
					print(qa);
				}
			}
			if(za.cr0&(1<<0)) {
				ne(intno,oe,error_code,pe,qe);
			}
			else {
				Ae(intno,oe,error_code,pe,qe);
			}
		}
		function De(selector) {
			var va,Zd,Xd,Sb,Ee;
			selector&=0xffff;
			if((selector&0xfffc)==0) {
				za.ldt.base=0;
				za.ldt.limit=0;
			}
			else {
				if(selector&0x4)rd(13,selector&0xfffc);
				va=za.gdt;
				Sb=selector&~7;
				Ee=7;
				if((Sb+Ee)>va.limit)rd(13,selector&0xfffc);
				ia=(va.base+Sb)&-1;
				Zd=Db();
				ia+=4;
				Xd=Db();
				if((Xd&(1<<12))||((Xd>>8)&0xf)!=2)rd(13,selector&0xfffc);
				if(!(Xd&(1<<15)))rd(11,selector&0xfffc);
				ce(za.ldt,Zd,Xd);
			}
			za.ldt.selector=selector;
		}
		function Fe(selector) {
			var va,Zd,Xd,Sb,je,Ee;
			selector&=0xffff;
			if((selector&0xfffc)==0) {
				za.tr.base=0;
				za.tr.limit=0;
				za.tr.flags=0;
			}
			else {
				if(selector&0x4)rd(13,selector&0xfffc);
				va=za.gdt;
				Sb=selector&~7;
				Ee=7;
				if((Sb+Ee)>va.limit)rd(13,selector&0xfffc);
				ia=(va.base+Sb)&-1;
				Zd=Db();
				ia+=4;
				Xd=Db();
				je=(Xd>>8)&0xf;
				if((Xd&(1<<12))||(je!=1&&je!=9))rd(13,selector&0xfffc);
				if(!(Xd&(1<<15)))rd(11,selector&0xfffc);
				ce(za.tr,Zd,Xd);
				Xd|=(1<<9);
				Jb(Xd);
			}
			za.tr.selector=selector;
		}
		function Ge(He,selector) {
			var Zd,Xd,te,ie,Ie,va,Sb;
			te=za.cpl;
			if((selector&0xfffc)==0) {
				if(He==2)rd(13,0);
				ee(He,selector,0,0,0);
			}
			else {
				if(selector&0x4)va=za.ldt;
				else va=za.gdt;
				Sb=selector&~7;
				if((Sb+7)>va.limit)rd(13,selector&0xfffc);
				ia=(va.base+Sb)&-1;
				Zd=Db();
				ia+=4;
				Xd=Db();
				if(!(Xd&(1<<12)))rd(13,selector&0xfffc);
				Ie=selector&3;
				ie=(Xd>>13)&3;
				if(He==2) {
					if((Xd&(1<<11))||!(Xd&(1<<9)))rd(13,selector&0xfffc);
					if(Ie!=te||ie!=te)rd(13,selector&0xfffc);
				}
				else {
					if((Xd&((1<<11)|(1<<9)))==(1<<11))rd(13,selector&0xfffc);
					if(!(Xd&(1<<11))||!(Xd&(1<<10))) {
						if(ie<te||ie<Ie)rd(13,selector&0xfffc);
					}
				}
				if(!(Xd&(1<<15))) {
					if(He==2)rd(12,selector&0xfffc);
					else rd(11,selector&0xfffc);
				}
				if(!(Xd&(1<<8))) {
					Xd|=(1<<8);
					Jb(Xd);
				}
				ee(He,selector,be(Zd,Xd),ae(Zd,Xd),Xd);
			}
		}
		function Je(He,selector) {
			var va;
			selector&=0xffff;
			if(!(za.cr0&(1<<0))) {
				va=za.segs[He];
				va.selector=selector;
				va.base=selector<<4;
			}
			else if(za.eflags&0x00020000) {
				ge(He,selector);
			}
			else {
				Ge(He,selector);
			}
		}
		function Ke(Le,Me) {
			Kb=Me,Lb=Nb=0;
			za.segs[1].selector=Le;
			za.segs[1].base=(Le<<4);
			de();
		}
		function Ne(Le,Me) {
			var Oe,je,Zd,Xd,te,ie,Ie,limit,e;
			if((Le&0xfffc)==0)rd(13,0);
			e=Yd(Le);
			if(!e)rd(13,Le&0xfffc);
			Zd=e[0];
			Xd=e[1];
			te=za.cpl;
			if(Xd&(1<<12)) {
				if(!(Xd&(1<<11)))rd(13,Le&0xfffc);
				ie=(Xd>>13)&3;
				if(Xd&(1<<10)) {
					if(ie>te)rd(13,Le&0xfffc);
				}
				else {
					Ie=Le&3;
					if(Ie>te)rd(13,Le&0xfffc);
					if(ie!=te)rd(13,Le&0xfffc);
				}
				if(!(Xd&(1<<15)))rd(11,Le&0xfffc);
				limit=ae(Zd,Xd);
				if((Me>>>0)>(limit>>>0))rd(13,Le&0xfffc);
				ee(1,(Le&0xfffc)|te,be(Zd,Xd),limit,Xd);
				Kb=Me,Lb=Nb=0;
			}
			else {
				od("unsupported jump to call or task gate");
			}
		}
		function Pe(Le,Me) {
			if(!(za.cr0&(1<<0))||(za.eflags&0x00020000)) {
				Ke(Le,Me);
			}
			else {
				Ne(Le,Me);
			}
		}
		function Qe(He,te) {
			var ie,Xd;
			if((He==4||He==5)&&(za.segs[He].selector&0xfffc)==0)return;
			Xd=za.segs[He].flags;
			ie=(Xd>>13)&3;
			if(!(Xd&(1<<11))||!(Xd&(1<<10))) {
				if(ie<te) {
					ee(He,0,0,0,0);
				}
			}
		}
		function Re(ke,Le,Me,pe) {
			var me;
			me=Aa[4];
			if(ke) {{
					me=(me-4)>>0;
					ia=((me&Sa)+Ra)>>0;
					xb(za.segs[1].selector);
				};
				{
					me=(me-4)>>0;
					ia=((me&Sa)+Ra)>>0;
					xb(pe);
				};
			}
			else {{
					me=(me-2)>>0;
					ia=((me&Sa)+Ra)>>0;
					vb(za.segs[1].selector);
				};
				{
					me=(me-2)>>0;
					ia=((me&Sa)+Ra)>>0;
					vb(pe);
				};
			}
			Aa[4]=(Aa[4]&~Sa)|((me)&Sa);
			Kb=Me,Lb=Nb=0;
			za.segs[1].selector=Le;
			za.segs[1].base=(Le<<4);
			de();
		}
		function Se(ke,Le,Me,pe) {
			var ve,i,e;
			var Zd,Xd,te,ie,Ie,selector,we,Te;
			var le,xe,ye,Ue,je,se,Sa;
			var ja,limit,Ve;
			var re,We,Xe;
			if((Le&0xfffc)==0)rd(13,0);
			e=Yd(Le);
			if(!e)rd(13,Le&0xfffc);
			Zd=e[0];
			Xd=e[1];
			te=za.cpl;
			Xe=Aa[4];
			if(Xd&(1<<12)) {
				if(!(Xd&(1<<11)))rd(13,Le&0xfffc);
				ie=(Xd>>13)&3;
				if(Xd&(1<<10)) {
					if(ie>te)rd(13,Le&0xfffc);
				}
				else {
					Ie=Le&3;
					if(Ie>te)rd(13,Le&0xfffc);
					if(ie!=te)rd(13,Le&0xfffc);
				}
				if(!(Xd&(1<<15)))rd(11,Le&0xfffc);
				{
					Ue=Xe;
					Sa=Wd(za.segs[2].flags);
					re=za.segs[2].base;
					if(ke) {{
							Ue=(Ue-4)&-1;
							ia=(re+(Ue&Sa))&-1;
							Jb(za.segs[1].selector);
						};
						{
							Ue=(Ue-4)&-1;
							ia=(re+(Ue&Sa))&-1;
							Jb(pe);
						};
					}
					else {{
							Ue=(Ue-2)&-1;
							ia=(re+(Ue&Sa))&-1;
							Hb(za.segs[1].selector);
						};
						{
							Ue=(Ue-2)&-1;
							ia=(re+(Ue&Sa))&-1;
							Hb(pe);
						};
					}
					limit=ae(Zd,Xd);
					if(Me>limit)rd(13,Le&0xfffc);
					Aa[4]=(Aa[4]&~Sa)|((Ue)&Sa);
					ee(1,(Le&0xfffc)|te,be(Zd,Xd),limit,Xd);
					Kb=Me,Lb=Nb=0;
				}
			}
			else {
				je=(Xd>>8)&0x1f;
				ie=(Xd>>13)&3;
				Ie=Le&3;
				switch(je) {
				case 1:
				case 9:
				case 5:
					throw"unsupported task gate";
					return;
				case 4:
				case 12:
					break;
				default:
					rd(13,Le&0xfffc);
					break;
				}
				ke=je>>3;
				if(ie<te||ie<Ie)rd(13,Le&0xfffc);
				if(!(Xd&(1<<15)))rd(11,Le&0xfffc);
				selector=Zd>>16;
				we=(Xd&0xffff0000)|(Zd&0x0000ffff);
				Te=Xd&0x1f;
				if((selector&0xfffc)==0)rd(13,0);
				e=Yd(selector);
				if(!e)rd(13,selector&0xfffc);
				Zd=e[0];
				Xd=e[1];
				if(!(Xd&(1<<12))||!(Xd&((1<<11))))rd(13,selector&0xfffc);
				ie=(Xd>>13)&3;
				if(ie>te)rd(13,selector&0xfffc);
				if(!(Xd&(1<<15)))rd(11,selector&0xfffc);
				if(!(Xd&(1<<10))&&ie<te) {
					e=he(ie);
					le=e[0];
					Ue=e[1];
					if((le&0xfffc)==0)rd(10,le&0xfffc);
					if((le&3)!=ie)rd(10,le&0xfffc);
					e=Yd(le);
					if(!e)rd(10,le&0xfffc);
					xe=e[0];
					ye=e[1];
					se=(ye>>13)&3;
					if(se!=ie)rd(10,le&0xfffc);
					if(!(ye&(1<<12))||(ye&(1<<11))||!(ye&(1<<9)))rd(10,le&0xfffc);
					if(!(ye&(1<<15)))rd(10,le&0xfffc);
					Ve=Wd(za.segs[2].flags);
					We=za.segs[2].base;
					Sa=Wd(ye);
					re=be(xe,ye);
					if(ke) {{
							Ue=(Ue-4)&-1;
							ia=(re+(Ue&Sa))&-1;
							Jb(za.segs[2].selector);
						};
						{
							Ue=(Ue-4)&-1;
							ia=(re+(Ue&Sa))&-1;
							Jb(Xe);
						};
						for(i=Te-1; i>=0; i--) {
							ja=Ye(We+((Xe+i*4)&Ve));
							{
								Ue=(Ue-4)&-1;
								ia=(re+(Ue&Sa))&-1;
								Jb(ja);
							};
						}
					}
					else {{
							Ue=(Ue-2)&-1;
							ia=(re+(Ue&Sa))&-1;
							Hb(za.segs[2].selector);
						};
						{
							Ue=(Ue-2)&-1;
							ia=(re+(Ue&Sa))&-1;
							Hb(Xe);
						};
						for(i=Te-1; i>=0; i--) {
							ja=Ze(We+((Xe+i*2)&Ve));
							{
								Ue=(Ue-2)&-1;
								ia=(re+(Ue&Sa))&-1;
								Hb(ja);
							};
						}
					}
					ve=1;
				}
				else {
					Ue=Xe;
					Sa=Wd(za.segs[2].flags);
					re=za.segs[2].base;
					ve=0;
				}
				if(ke) {{
						Ue=(Ue-4)&-1;
						ia=(re+(Ue&Sa))&-1;
						Jb(za.segs[1].selector);
					};
					{
						Ue=(Ue-4)&-1;
						ia=(re+(Ue&Sa))&-1;
						Jb(pe);
					};
				}
				else {{
						Ue=(Ue-2)&-1;
						ia=(re+(Ue&Sa))&-1;
						Hb(za.segs[1].selector);
					};
					{
						Ue=(Ue-2)&-1;
						ia=(re+(Ue&Sa))&-1;
						Hb(pe);
					};
				}
				if(ve) {
					le=(le&~3)|ie;
					ee(2,le,re,ae(xe,ye),ye);
				}
				selector=(selector&~3)|ie;
				ee(1,selector,be(Zd,Xd),ae(Zd,Xd),Xd);
				sd(ie);
				Aa[4]=(Aa[4]&~Sa)|((Ue)&Sa);
				Kb=we,Lb=Nb=0;
			}
		}
		function af(ke,Le,Me,pe) {
			if(!(za.cr0&(1<<0))||(za.eflags&0x00020000)) {
				Re(ke,Le,Me,pe);
			}
			else {
				Se(ke,Le,Me,pe);
			}
		}
		function bf(ke,cf,df) {
			var Ue,Le,Me,ef,Sa,re,ff;
			Sa=0xffff;
			Ue=Aa[4];
			re=za.segs[2].base;
			if(ke==1) {{
					ia=(re+(Ue&Sa))&-1;
					Me=Db();
					Ue=(Ue+4)&-1;
				};
				{
					ia=(re+(Ue&Sa))&-1;
					Le=Db();
					Ue=(Ue+4)&-1;
				};
				Le&=0xffff;
				if(cf) {
					ia=(re+(Ue&Sa))&-1;
					ef=Db();
					Ue=(Ue+4)&-1;
				};
			}
			else {{
					ia=(re+(Ue&Sa))&-1;
					Me=Bb();
					Ue=(Ue+2)&-1;
				};
				{
					ia=(re+(Ue&Sa))&-1;
					Le=Bb();
					Ue=(Ue+2)&-1;
				};
				if(cf) {
					ia=(re+(Ue&Sa))&-1;
					ef=Bb();
					Ue=(Ue+2)&-1;
				};
			}
			Aa[4]=(Aa[4]&~Sa)|((Ue+df)&Sa);
			za.segs[1].selector=Le;
			za.segs[1].base=(Le<<4);
			Kb=Me,Lb=Nb=0;
			if(cf) {
				if(za.eflags&0x00020000)ff=0x00000100|0x00040000|0x00200000|0x00000200|0x00010000|0x00004000;
				else ff=0x00000100|0x00040000|0x00200000|0x00000200|0x00003000|0x00010000|0x00004000;
				if(ke==0)ff&=0xffff;
				ld(ef,ff);
			}
			de();
		}
		function gf(ke,cf,df) {
			var Le,ef,hf;
			var jf,kf,lf,mf;
			var e,Zd,Xd,xe,ye;
			var te,ie,Ie,ff,Va;
			var re,Ue,Me,xd,Sa;
			Sa=Wd(za.segs[2].flags);
			Ue=Aa[4];
			re=za.segs[2].base;
			ef=0;
			if(ke==1) {{
					ia=(re+(Ue&Sa))&-1;
					Me=Db();
					Ue=(Ue+4)&-1;
				};
				{
					ia=(re+(Ue&Sa))&-1;
					Le=Db();
					Ue=(Ue+4)&-1;
				};
				Le&=0xffff;
				if(cf) {{
						ia=(re+(Ue&Sa))&-1;
						ef=Db();
						Ue=(Ue+4)&-1;
					};
					if(ef&0x00020000) {{
							ia=(re+(Ue&Sa))&-1;
							xd=Db();
							Ue=(Ue+4)&-1;
						};
						{
							ia=(re+(Ue&Sa))&-1;
							hf=Db();
							Ue=(Ue+4)&-1;
						};
						{
							ia=(re+(Ue&Sa))&-1;
							jf=Db();
							Ue=(Ue+4)&-1;
						};
						{
							ia=(re+(Ue&Sa))&-1;
							kf=Db();
							Ue=(Ue+4)&-1;
						};
						{
							ia=(re+(Ue&Sa))&-1;
							lf=Db();
							Ue=(Ue+4)&-1;
						};
						{
							ia=(re+(Ue&Sa))&-1;
							mf=Db();
							Ue=(Ue+4)&-1;
						};
						ld(ef,0x00000100|0x00040000|0x00200000|0x00000200|0x00003000|0x00020000|0x00004000|0x00080000|0x00100000);
						ge(1,Le&0xffff);
						sd(3);
						ge(2,hf&0xffff);
						ge(0,jf&0xffff);
						ge(3,kf&0xffff);
						ge(4,lf&0xffff);
						ge(5,mf&0xffff);
						Kb=Me&0xffff,Lb=Nb=0;
						Aa[4]=(Aa[4]&~Sa)|((xd)&Sa);
						return;
					}
				}
			}
			else {{
					ia=(re+(Ue&Sa))&-1;
					Me=Bb();
					Ue=(Ue+2)&-1;
				};
				{
					ia=(re+(Ue&Sa))&-1;
					Le=Bb();
					Ue=(Ue+2)&-1;
				};
				if(cf) {
					ia=(re+(Ue&Sa))&-1;
					ef=Bb();
					Ue=(Ue+2)&-1;
				};
			}
			if((Le&0xfffc)==0)rd(13,Le&0xfffc);
			e=Yd(Le);
			if(!e)rd(13,Le&0xfffc);
			Zd=e[0];
			Xd=e[1];
			if(!(Xd&(1<<12))||!(Xd&(1<<11)))rd(13,Le&0xfffc);
			te=za.cpl;
			Ie=Le&3;
			if(Ie<te)rd(13,Le&0xfffc);
			ie=(Xd>>13)&3;
			if(Xd&(1<<10)) {
				if(ie>Ie)rd(13,Le&0xfffc);
			}
			else {
				if(ie!=Ie)rd(13,Le&0xfffc);
			}
			if(!(Xd&(1<<15)))rd(11,Le&0xfffc);
			Ue=(Ue+df)&-1;
			if(Ie==te) {
				ee(1,Le,be(Zd,Xd),ae(Zd,Xd),Xd);
			}
			else {
				if(ke==1) {{
						ia=(re+(Ue&Sa))&-1;
						xd=Db();
						Ue=(Ue+4)&-1;
					};
					{
						ia=(re+(Ue&Sa))&-1;
						hf=Db();
						Ue=(Ue+4)&-1;
					};
					hf&=0xffff;
				}
				else {{
						ia=(re+(Ue&Sa))&-1;
						xd=Bb();
						Ue=(Ue+2)&-1;
					};
					{
						ia=(re+(Ue&Sa))&-1;
						hf=Bb();
						Ue=(Ue+2)&-1;
					};
				}
				if((hf&0xfffc)==0) {
					rd(13,0);
				}
				else {
					if((hf&3)!=Ie)rd(13,hf&0xfffc);
					e=Yd(hf);
					if(!e)rd(13,hf&0xfffc);
					xe=e[0];
					ye=e[1];
					if(!(ye&(1<<12))||(ye&(1<<11))||!(ye&(1<<9)))rd(13,hf&0xfffc);
					ie=(ye>>13)&3;
					if(ie!=Ie)rd(13,hf&0xfffc);
					if(!(ye&(1<<15)))rd(11,hf&0xfffc);
					ee(2,hf,be(xe,ye),ae(xe,ye),ye);
				}
				ee(1,Le,be(Zd,Xd),ae(Zd,Xd),Xd);
				sd(Ie);
				Ue=xd;
				Sa=Wd(ye);
				Qe(0,Ie);
				Qe(3,Ie);
				Qe(4,Ie);
				Qe(5,Ie);
				Ue=(Ue+df)&-1;
			}
			Aa[4]=(Aa[4]&~Sa)|((Ue)&Sa);
			Kb=Me,Lb=Nb=0;
			if(cf) {
				ff=0x00000100|0x00040000|0x00200000|0x00010000|0x00004000;
				if(te==0)ff|=0x00003000;
				Va=(za.eflags>>12)&3;
				if(te<=Va)ff|=0x00000200;
				if(ke==0)ff&=0xffff;
				ld(ef,ff);
			}
		}
		function nf(ke) {
			var Va;
			if(!(za.cr0&(1<<0))||(za.eflags&0x00020000)) {
				if(za.eflags&0x00020000) {
					Va=(za.eflags>>12)&3;
					if(Va!=3)Ec(13);
				}
				bf(ke,1,0);
			}
			else {
				if(za.eflags&0x00004000) {
					throw"unsupported task gate";
				}
				else {
					gf(ke,1,0);
				}
			}
		}
		function of(ke,df) {
			if(!(za.cr0&(1<<0))||(za.eflags&0x00020000)) {
				bf(ke,0,df);
			}
			else {
				gf(ke,0,df);
			}
		}
		function pf(selector,qf) {
			var e,Zd,Xd,Ie,ie,te,je;
			if((selector&0xfffc)==0)return null;
			e=Yd(selector);
			if(!e)return null;
			Zd=e[0];
			Xd=e[1];
			Ie=selector&3;
			ie=(Xd>>13)&3;
			te=za.cpl;
			if(Xd&(1<<12)) {
				if((Xd&(1<<11))&&(Xd&(1<<10))) {} else {
					if(ie<te||ie<Ie)return null;
				}
			}
			else {
				je=(Xd>>8)&0xf;
				switch(je) {
				case 1:
				case 2:
				case 3:
				case 9:
				case 11:
					break;
				case 4:
				case 5:
				case 12:
					if(qf)return null;
					break;
				default:
					return null;
				}
				if(ie<te||ie<Ie)return null;
			}
			if(qf) {
				return ae(Zd,Xd);
			}
			else {
				return Xd&0x00f0ff00;
			}
		}
		function rf(ke,qf) {
			var ja,Ha,Ja,selector;
			if(!(za.cr0&(1<<0))||(za.eflags&0x00020000))Ec(6);
			Ha=Wa[Lb++];;
			Ja=(Ha>>3)&7;
			if((Ha>>6)==3) {
				selector=Aa[Ha&7]&0xffff;
			}
			else {
				ia=Qb(Ha);
				selector=jb();
			}
			ja=pf(selector,qf);
			Ba=id();
			if(ja===null) {
				Ba&=~0x0040;
			}
			else {
				Ba|=0x0040;
				if(ke)Aa[Ja]=ja;
				else Xb(Ja,ja);
			}
			Ca=((Ba>>6)&1)^1;
			Da=24;
		}
		function sf(selector,vd) {
			var e,Zd,Xd,Ie,ie,te;
			if((selector&0xfffc)==0)return 0;
			e=Yd(selector);
			if(!e)return 0;
			Zd=e[0];
			Xd=e[1];
			if(!(Xd&(1<<12)))return 0;
			Ie=selector&3;
			ie=(Xd>>13)&3;
			te=za.cpl;
			if(Xd&(1<<11)) {
				if(vd) {
					return 0;
				}
				else {
					if(!(Xd&(1<<9)))return 1;
					if(!(Xd&(1<<10))) {
						if(ie<te||ie<Ie)return 0;
					}
				}
			}
			else {
				if(ie<te||ie<Ie)return 0;
				if(vd&&!(Xd&(1<<9)))return 0;
			}
			return 1;
		}
		function tf(selector,vd) {
			var z;
			z=sf(selector,vd);
			Ba=id();
			if(z)Ba|=0x0040;
			else Ba&=~0x0040;
			Ca=((Ba>>6)&1)^1;
			Da=24;
		}
		function uf() {
			var Ha,ja,Ka,Ia;
			if(!(za.cr0&(1<<0))||(za.eflags&0x00020000))Ec(6);
			Ha=Wa[Lb++];;
			if((Ha>>6)==3) {
				Ia=Ha&7;
				ja=Aa[Ia]&0xffff;
			}
			else {
				ia=Qb(Ha);
				ja=pb();
			}
			Ka=Aa[(Ha>>3)&7];
			Ba=id();
			if((ja&3)<(Ka&3)) {
				ja=(ja&~3)|(Ka&3);
				if((Ha>>6)==3) {
					Xb(Ia,ja);
				}
				else {
					vb(ja);
				}
				Ba|=0x0040;
			}
			else {
				Ba&=~0x0040;
			}
			Ca=((Ba>>6)&1)^1;
			Da=24;
		}
		function vf() {
			var Sb;
			Sb=Aa[0];
			switch(Sb) {
			case 0:
				Aa[0]=1;
				Aa[3]=0x756e6547&-1;
				Aa[2]=0x49656e69&-1;
				Aa[1]=0x6c65746e&-1;
				break;
			case 1:
			default:
				Aa[0]=(5<<8)|(4<<4)|3;
				Aa[3]=8<<8;
				Aa[1]=0;
				Aa[2]=(1<<4);
				break;
			}
		}
		function wf(base) {
			var xf,yf;
			if(base==0)Ec(0);
			xf=Aa[0]&0xff;
			yf=(xf/base)&-1;
			xf=(xf%base);
			Aa[0]=(Aa[0]&~0xffff)|xf|(yf<<8);
			Ca=(((xf)<<24)>>24);
			Da=12;
		}
		function zf(base) {
			var xf,yf;
			xf=Aa[0]&0xff;
			yf=(Aa[0]>>8)&0xff;
			xf=(yf*base+xf)&0xff;
			Aa[0]=(Aa[0]&~0xffff)|xf;
			Ca=(((xf)<<24)>>24);
			Da=12;
		}
		function Af() {
			var Bf,xf,yf,Cf,kd;
			kd=id();
			Cf=kd&0x0010;
			xf=Aa[0]&0xff;
			yf=(Aa[0]>>8)&0xff;
			Bf=(xf>0xf9);
			if(((xf&0x0f)>9)||Cf) {
				xf=(xf+6)&0x0f;
				yf=(yf+1+Bf)&0xff;
				kd|=0x0001|0x0010;
			}
			else {
				kd&=~(0x0001|0x0010);
				xf&=0x0f;
			}
			Aa[0]=(Aa[0]&~0xffff)|xf|(yf<<8);
			Ba=kd;
			Ca=((Ba>>6)&1)^1;
			Da=24;
		}
		function Df() {
			var Bf,xf,yf,Cf,kd;
			kd=id();
			Cf=kd&0x0010;
			xf=Aa[0]&0xff;
			yf=(Aa[0]>>8)&0xff;
			Bf=(xf<6);
			if(((xf&0x0f)>9)||Cf) {
				xf=(xf-6)&0x0f;
				yf=(yf-1-Bf)&0xff;
				kd|=0x0001|0x0010;
			}
			else {
				kd&=~(0x0001|0x0010);
				xf&=0x0f;
			}
			Aa[0]=(Aa[0]&~0xffff)|xf|(yf<<8);
			Ba=kd;
			Ca=((Ba>>6)&1)^1;
			Da=24;
		}
		function Ef() {
			var xf,Cf,Ff,kd;
			kd=id();
			Ff=kd&0x0001;
			Cf=kd&0x0010;
			xf=Aa[0]&0xff;
			kd=0;
			if(((xf&0x0f)>9)||Cf) {
				xf=(xf+6)&0xff;
				kd|=0x0010;
			}
			if((xf>0x9f)||Ff) {
				xf=(xf+0x60)&0xff;
				kd|=0x0001;
			}
			Aa[0]=(Aa[0]&~0xff)|xf;
			kd|=(xf==0)<<6;
			kd|=aa[xf]<<2;
			kd|=(xf&0x80);
			Ba=kd;
			Ca=((Ba>>6)&1)^1;
			Da=24;
		}
		function Gf() {
			var xf,Hf,Cf,Ff,kd;
			kd=id();
			Ff=kd&0x0001;
			Cf=kd&0x0010;
			xf=Aa[0]&0xff;
			kd=0;
			Hf=xf;
			if(((xf&0x0f)>9)||Cf) {
				kd|=0x0010;
				if(xf<6||Ff)kd|=0x0001;
				xf=(xf-6)&0xff;
			}
			if((Hf>0x99)||Ff) {
				xf=(xf-0x60)&0xff;
				kd|=0x0001;
			}
			Aa[0]=(Aa[0]&~0xff)|xf;
			kd|=(xf==0)<<6;
			kd|=aa[xf]<<2;
			kd|=(xf&0x80);
			Ba=kd;
			Ca=((Ba>>6)&1)^1;
			Da=24;
		}
		function If() {
			var Ha,ja,Ka,La;
			Ha=Wa[Lb++];;
			if((Ha>>3)==3)Ec(6);
			ia=Qb(Ha);
			ja=lb();
			ia=(ia+4)&-1;
			Ka=lb();
			Ja=(Ha>>3)&7;
			La=Aa[Ja];
			if(La<ja||La>Ka)Ec(5);
		}
		function Jf() {
			var Ha,ja,Ka,La;
			Ha=Wa[Lb++];;
			if((Ha>>3)==3)Ec(6);
			ia=Qb(Ha);
			ja=(jb()<<16)>>16;
			ia=(ia+2)&-1;
			Ka=(jb()<<16)>>16;
			Ja=(Ha>>3)&7;
			La=(Aa[Ja]<<16)>>16;
			if(La<ja||La>Ka)Ec(5);
		}
		function Kf() {
			var ja,Ka,Ja;
			Ka=(Aa[4]-16)>>0;
			ia=((Ka&Sa)+Ra)>>0;
			for(Ja=7; Ja>=0; Ja--) {
				ja=Aa[Ja];
				vb(ja);
				ia=(ia+2)>>0;
			}
			Aa[4]=(Aa[4]&~Sa)|((Ka)&Sa);
		}
		function Lf() {
			var ja,Ka,Ja;
			Ka=(Aa[4]-32)>>0;
			ia=((Ka&Sa)+Ra)>>0;
			for(Ja=7; Ja>=0; Ja--) {
				ja=Aa[Ja];
				xb(ja);
				ia=(ia+4)>>0;
			}
			Aa[4]=(Aa[4]&~Sa)|((Ka)&Sa);
		}
		function Mf() {
			var Ja;
			ia=((Aa[4]&Sa)+Ra)>>0;
			for(Ja=7; Ja>=0; Ja--) {
				if(Ja!=4) {
					Xb(Ja,jb());
				}
				ia=(ia+2)>>0;
			}
			Aa[4]=(Aa[4]&~Sa)|((Aa[4]+16)&Sa);
		}
		function Nf() {
			var Ja;
			ia=((Aa[4]&Sa)+Ra)>>0;
			for(Ja=7; Ja>=0; Ja--) {
				if(Ja!=4) {
					Aa[Ja]=lb();
				}
				ia=(ia+4)>>0;
			}
			Aa[4]=(Aa[4]&~Sa)|((Aa[4]+32)&Sa);
		}
		function Of() {
			var ja,Ka;
			Ka=Aa[5];
			ia=((Ka&Sa)+Ra)>>0;
			ja=jb();
			Xb(5,ja);
			Aa[4]=(Aa[4]&~Sa)|((Ka+2)&Sa);
		}
		function Pf() {
			var ja,Ka;
			Ka=Aa[5];
			ia=((Ka&Sa)+Ra)>>0;
			ja=lb();
			Aa[5]=ja;
			Aa[4]=(Aa[4]&~Sa)|((Ka+4)&Sa);
		}
		function Qf() {
			var df,Rf,me,Sf,ja,Tf;
			df=Pb();
			Rf=Wa[Lb++];;
			Rf&=0x1f;
			me=Aa[4];
			Sf=Aa[5];
			{
				me=(me-2)>>0;
				ia=((me&Sa)+Ra)>>0;
				vb(Sf);
			};
			Tf=me;
			if(Rf!=0) {
				while(Rf>1) {
					Sf=(Sf-2)>>0;
					ia=((Sf&Sa)+Ra)>>0;
					ja=jb();
					{
						me=(me-2)>>0;
						ia=((me&Sa)+Ra)>>0;
						vb(ja);
					};
					Rf--;
				}{
					me=(me-2)>>0;
					ia=((me&Sa)+Ra)>>0;
					vb(Tf);
				};
			}
			me=(me-df)>>0;
			ia=((me&Sa)+Ra)>>0;
			pb();
			Aa[5]=(Aa[5]&~Sa)|(Tf&Sa);
			Aa[4]=me;
		}
		function Uf() {
			var df,Rf,me,Sf,ja,Tf;
			df=Pb();
			Rf=Wa[Lb++];;
			Rf&=0x1f;
			me=Aa[4];
			Sf=Aa[5];
			{
				me=(me-4)>>0;
				ia=((me&Sa)+Ra)>>0;
				xb(Sf);
			};
			Tf=me;
			if(Rf!=0) {
				while(Rf>1) {
					Sf=(Sf-4)>>0;
					ia=((Sf&Sa)+Ra)>>0;
					ja=lb();
					{
						me=(me-4)>>0;
						ia=((me&Sa)+Ra)>>0;
						xb(ja);
					};
					Rf--;
				}{
					me=(me-4)>>0;
					ia=((me&Sa)+Ra)>>0;
					xb(Tf);
				};
			}
			me=(me-df)>>0;
			ia=((me&Sa)+Ra)>>0;
			rb();
			Aa[5]=(Aa[5]&~Sa)|(Tf&Sa);
			Aa[4]=(Aa[4]&~Sa)|((me)&Sa);
		}
		function Vf(Tb) {
			var ja,Ka,Ha;
			Ha=Wa[Lb++];;
			if((Ha>>3)==3)Ec(6);
			ia=Qb(Ha);
			ja=lb();
			ia+=4;
			Ka=jb();
			Je(Tb,Ka);
			Aa[(Ha>>3)&7]=ja;
		}
		function Wf(Tb) {
			var ja,Ka,Ha;
			Ha=Wa[Lb++];;
			if((Ha>>3)==3)Ec(6);
			ia=Qb(Ha);
			ja=jb();
			ia+=2;
			Ka=jb();
			Je(Tb,Ka);
			Xb((Ha>>3)&7,ja);
		}
		function Xf() {
			var Yf,Zf,ag,bg,Va,ja;
			Va=(za.eflags>>12)&3;
			if(za.cpl>Va)Ec(13);
			if(Ga&0x0080)Yf=0xffff;
			else Yf=-1;
			Zf=Aa[7];
			ag=Aa[2]&0xffff;
			if(Ga&(0x0010|0x0020)) {
				bg=Aa[1];
				if((bg&Yf)==0)return;;
				{
					ja=za.ld8_port(ag);
					ia=((Zf&Yf)+za.segs[0].base)>>0;
					tb(ja);
					Aa[7]=(Zf&~Yf)|((Zf+(za.df<<0))&Yf);
					Aa[1]=bg=(bg&~Yf)|((bg-1)&Yf);
					if(bg&Yf)Lb=Nb;;
				}
			}
			else {
				ja=za.ld8_port(ag);
				ia=((Zf&Yf)+za.segs[0].base)>>0;
				tb(ja);
				Aa[7]=(Zf&~Yf)|((Zf+(za.df<<0))&Yf);
			}
		}
		function cg() {
			var Yf,dg,Tb,bg,ag,Va,ja;
			Va=(za.eflags>>12)&3;
			if(za.cpl>Va)Ec(13);
			if(Ga&0x0080)Yf=0xffff;
			else Yf=-1;
			Tb=Ga&0x000f;
			if(Tb==0)Tb=3;
			else Tb--;
			dg=Aa[6];
			ag=Aa[2]&0xffff;
			if(Ga&(0x0010|0x0020)) {
				bg=Aa[1];
				if((bg&Yf)==0)return;;
				ia=((dg&Yf)+za.segs[Tb].base)>>0;
				ja=hb();
				za.st8_port(ag,ja);
				Aa[6]=(dg&~Yf)|((dg+(za.df<<0))&Yf);
				Aa[1]=bg=(bg&~Yf)|((bg-1)&Yf);
				if(bg&Yf)Lb=Nb;;
			}
			else {
				ia=((dg&Yf)+za.segs[Tb].base)>>0;
				ja=hb();
				za.st8_port(ag,ja);
				Aa[6]=(dg&~Yf)|((dg+(za.df<<0))&Yf);
			}
		}
		function eg() {
			var Yf,Zf,dg,bg,Tb,fg;
			if(Ga&0x0080)Yf=0xffff;
			else Yf=-1;
			Tb=Ga&0x000f;
			if(Tb==0)Tb=3;
			else Tb--;
			dg=Aa[6];
			Zf=Aa[7];
			ia=((dg&Yf)+za.segs[Tb].base)>>0;
			fg=((Zf&Yf)+za.segs[0].base)>>0;
			if(Ga&(0x0010|0x0020)) {
				bg=Aa[1];
				if((bg&Yf)==0)return;;
				{
					ja=hb();
					ia=fg;
					tb(ja);
					Aa[6]=(dg&~Yf)|((dg+(za.df<<0))&Yf);
					Aa[7]=(Zf&~Yf)|((Zf+(za.df<<0))&Yf);
					Aa[1]=bg=(bg&~Yf)|((bg-1)&Yf);
					if(bg&Yf)Lb=Nb;;
				}
			}
			else {
				ja=hb();
				ia=fg;
				tb(ja);
				Aa[6]=(dg&~Yf)|((dg+(za.df<<0))&Yf);
				Aa[7]=(Zf&~Yf)|((Zf+(za.df<<0))&Yf);
			}
		}
		function gg() {
			var Yf,Zf,bg;
			if(Ga&0x0080)Yf=0xffff;
			else Yf=-1;
			Zf=Aa[7];
			ia=((Zf&Yf)+za.segs[0].base)>>0;
			if(Ga&(0x0010|0x0020)) {
				bg=Aa[1];
				if((bg&Yf)==0)return;;
				{
					tb(Aa[0]);
					Aa[7]=(Zf&~Yf)|((Zf+(za.df<<0))&Yf);
					Aa[1]=bg=(bg&~Yf)|((bg-1)&Yf);
					if(bg&Yf)Lb=Nb;;
				}
			}
			else {
				tb(Aa[0]);
				Aa[7]=(Zf&~Yf)|((Zf+(za.df<<0))&Yf);
			}
		}
		function hg() {
			var Yf,Zf,dg,bg,Tb,fg;
			if(Ga&0x0080)Yf=0xffff;
			else Yf=-1;
			Tb=Ga&0x000f;
			if(Tb==0)Tb=3;
			else Tb--;
			dg=Aa[6];
			Zf=Aa[7];
			ia=((dg&Yf)+za.segs[Tb].base)>>0;
			fg=((Zf&Yf)+za.segs[0].base)>>0;
			if(Ga&(0x0010|0x0020)) {
				bg=Aa[1];
				if((bg&Yf)==0)return;;
				ja=hb();
				ia=fg;
				Ka=hb();
				hc(7,ja,Ka);
				Aa[6]=(dg&~Yf)|((dg+(za.df<<0))&Yf);
				Aa[7]=(Zf&~Yf)|((Zf+(za.df<<0))&Yf);
				Aa[1]=bg=(bg&~Yf)|((bg-1)&Yf);
				if(Ga&0x0010) {
					if(!(Ca==0))return;
				}
				else {
					if((Ca==0))return;
				}
				if(bg&Yf)Lb=Nb;;
			}
			else {
				ja=hb();
				ia=fg;
				Ka=hb();
				hc(7,ja,Ka);
				Aa[6]=(dg&~Yf)|((dg+(za.df<<0))&Yf);
				Aa[7]=(Zf&~Yf)|((Zf+(za.df<<0))&Yf);
			}
		}
		function ig() {
			var Yf,dg,Tb,bg,ja;
			if(Ga&0x0080)Yf=0xffff;
			else Yf=-1;
			Tb=Ga&0x000f;
			if(Tb==0)Tb=3;
			else Tb--;
			dg=Aa[6];
			ia=((dg&Yf)+za.segs[Tb].base)>>0;
			if(Ga&(0x0010|0x0020)) {
				bg=Aa[1];
				if((bg&Yf)==0)return;;
				ja=hb();
				Aa[0]=(Aa[0]&-256)|ja;
				Aa[6]=(dg&~Yf)|((dg+(za.df<<0))&Yf);
				Aa[1]=bg=(bg&~Yf)|((bg-1)&Yf);
				if(bg&Yf)Lb=Nb;;
			}
			else {
				ja=hb();
				Aa[0]=(Aa[0]&-256)|ja;
				Aa[6]=(dg&~Yf)|((dg+(za.df<<0))&Yf);
			}
		}
		function jg() {
			var Yf,Zf,bg,ja;
			if(Ga&0x0080)Yf=0xffff;
			else Yf=-1;
			Zf=Aa[7];
			ia=((Zf&Yf)+za.segs[0].base)>>0;
			if(Ga&(0x0010|0x0020)) {
				bg=Aa[1];
				if((bg&Yf)==0)return;;
				ja=hb();
				hc(7,Aa[0],ja);
				Aa[7]=(Zf&~Yf)|((Zf+(za.df<<0))&Yf);
				Aa[1]=bg=(bg&~Yf)|((bg-1)&Yf);
				if(Ga&0x0010) {
					if(!(Ca==0))return;
				}
				else {
					if((Ca==0))return;
				}
				if(bg&Yf)Lb=Nb;;
			}
			else {
				ja=hb();
				hc(7,Aa[0],ja);
				Aa[7]=(Zf&~Yf)|((Zf+(za.df<<0))&Yf);
			}
		}
		function kg() {
			var Yf,Zf,ag,bg,Va,ja;
			Va=(za.eflags>>12)&3;
			if(za.cpl>Va)Ec(13);
			if(Ga&0x0080)Yf=0xffff;
			else Yf=-1;
			Zf=Aa[7];
			ag=Aa[2]&0xffff;
			if(Ga&(0x0010|0x0020)) {
				bg=Aa[1];
				if((bg&Yf)==0)return;;
				{
					ja=za.ld16_port(ag);
					ia=((Zf&Yf)+za.segs[0].base)>>0;
					vb(ja);
					Aa[7]=(Zf&~Yf)|((Zf+(za.df<<1))&Yf);
					Aa[1]=bg=(bg&~Yf)|((bg-1)&Yf);
					if(bg&Yf)Lb=Nb;;
				}
			}
			else {
				ja=za.ld16_port(ag);
				ia=((Zf&Yf)+za.segs[0].base)>>0;
				vb(ja);
				Aa[7]=(Zf&~Yf)|((Zf+(za.df<<1))&Yf);
			}
		}
		function lg() {
			var Yf,dg,Tb,bg,ag,Va,ja;
			Va=(za.eflags>>12)&3;
			if(za.cpl>Va)Ec(13);
			if(Ga&0x0080)Yf=0xffff;
			else Yf=-1;
			Tb=Ga&0x000f;
			if(Tb==0)Tb=3;
			else Tb--;
			dg=Aa[6];
			ag=Aa[2]&0xffff;
			if(Ga&(0x0010|0x0020)) {
				bg=Aa[1];
				if((bg&Yf)==0)return;;
				ia=((dg&Yf)+za.segs[Tb].base)>>0;
				ja=jb();
				za.st16_port(ag,ja);
				Aa[6]=(dg&~Yf)|((dg+(za.df<<1))&Yf);
				Aa[1]=bg=(bg&~Yf)|((bg-1)&Yf);
				if(bg&Yf)Lb=Nb;;
			}
			else {
				ia=((dg&Yf)+za.segs[Tb].base)>>0;
				ja=jb();
				za.st16_port(ag,ja);
				Aa[6]=(dg&~Yf)|((dg+(za.df<<1))&Yf);
			}
		}
		function mg() {
			var Yf,Zf,dg,bg,Tb,fg;
			if(Ga&0x0080)Yf=0xffff;
			else Yf=-1;
			Tb=Ga&0x000f;
			if(Tb==0)Tb=3;
			else Tb--;
			dg=Aa[6];
			Zf=Aa[7];
			ia=((dg&Yf)+za.segs[Tb].base)>>0;
			fg=((Zf&Yf)+za.segs[0].base)>>0;
			if(Ga&(0x0010|0x0020)) {
				bg=Aa[1];
				if((bg&Yf)==0)return;;
				{
					ja=jb();
					ia=fg;
					vb(ja);
					Aa[6]=(dg&~Yf)|((dg+(za.df<<1))&Yf);
					Aa[7]=(Zf&~Yf)|((Zf+(za.df<<1))&Yf);
					Aa[1]=bg=(bg&~Yf)|((bg-1)&Yf);
					if(bg&Yf)Lb=Nb;;
				}
			}
			else {
				ja=jb();
				ia=fg;
				vb(ja);
				Aa[6]=(dg&~Yf)|((dg+(za.df<<1))&Yf);
				Aa[7]=(Zf&~Yf)|((Zf+(za.df<<1))&Yf);
			}
		}
		function ng() {
			var Yf,Zf,bg;
			if(Ga&0x0080)Yf=0xffff;
			else Yf=-1;
			Zf=Aa[7];
			ia=((Zf&Yf)+za.segs[0].base)>>0;
			if(Ga&(0x0010|0x0020)) {
				bg=Aa[1];
				if((bg&Yf)==0)return;;
				{
					vb(Aa[0]);
					Aa[7]=(Zf&~Yf)|((Zf+(za.df<<1))&Yf);
					Aa[1]=bg=(bg&~Yf)|((bg-1)&Yf);
					if(bg&Yf)Lb=Nb;;
				}
			}
			else {
				vb(Aa[0]);
				Aa[7]=(Zf&~Yf)|((Zf+(za.df<<1))&Yf);
			}
		}
		function og() {
			var Yf,Zf,dg,bg,Tb,fg;
			if(Ga&0x0080)Yf=0xffff;
			else Yf=-1;
			Tb=Ga&0x000f;
			if(Tb==0)Tb=3;
			else Tb--;
			dg=Aa[6];
			Zf=Aa[7];
			ia=((dg&Yf)+za.segs[Tb].base)>>0;
			fg=((Zf&Yf)+za.segs[0].base)>>0;
			if(Ga&(0x0010|0x0020)) {
				bg=Aa[1];
				if((bg&Yf)==0)return;;
				ja=jb();
				ia=fg;
				Ka=jb();
				ec(7,ja,Ka);
				Aa[6]=(dg&~Yf)|((dg+(za.df<<1))&Yf);
				Aa[7]=(Zf&~Yf)|((Zf+(za.df<<1))&Yf);
				Aa[1]=bg=(bg&~Yf)|((bg-1)&Yf);
				if(Ga&0x0010) {
					if(!(Ca==0))return;
				}
				else {
					if((Ca==0))return;
				}
				if(bg&Yf)Lb=Nb;;
			}
			else {
				ja=jb();
				ia=fg;
				Ka=jb();
				ec(7,ja,Ka);
				Aa[6]=(dg&~Yf)|((dg+(za.df<<1))&Yf);
				Aa[7]=(Zf&~Yf)|((Zf+(za.df<<1))&Yf);
			}
		}
		function pg() {
			var Yf,dg,Tb,bg,ja;
			if(Ga&0x0080)Yf=0xffff;
			else Yf=-1;
			Tb=Ga&0x000f;
			if(Tb==0)Tb=3;
			else Tb--;
			dg=Aa[6];
			ia=((dg&Yf)+za.segs[Tb].base)>>0;
			if(Ga&(0x0010|0x0020)) {
				bg=Aa[1];
				if((bg&Yf)==0)return;;
				ja=jb();
				Aa[0]=(Aa[0]&-65536)|ja;
				Aa[6]=(dg&~Yf)|((dg+(za.df<<1))&Yf);
				Aa[1]=bg=(bg&~Yf)|((bg-1)&Yf);
				if(bg&Yf)Lb=Nb;;
			}
			else {
				ja=jb();
				Aa[0]=(Aa[0]&-65536)|ja;
				Aa[6]=(dg&~Yf)|((dg+(za.df<<1))&Yf);
			}
		}
		function qg() {
			var Yf,Zf,bg,ja;
			if(Ga&0x0080)Yf=0xffff;
			else Yf=-1;
			Zf=Aa[7];
			ia=((Zf&Yf)+za.segs[0].base)>>0;
			if(Ga&(0x0010|0x0020)) {
				bg=Aa[1];
				if((bg&Yf)==0)return;;
				ja=jb();
				ec(7,Aa[0],ja);
				Aa[7]=(Zf&~Yf)|((Zf+(za.df<<1))&Yf);
				Aa[1]=bg=(bg&~Yf)|((bg-1)&Yf);
				if(Ga&0x0010) {
					if(!(Ca==0))return;
				}
				else {
					if((Ca==0))return;
				}
				if(bg&Yf)Lb=Nb;;
			}
			else {
				ja=jb();
				ec(7,Aa[0],ja);
				Aa[7]=(Zf&~Yf)|((Zf+(za.df<<1))&Yf);
			}
		}
		function rg() {
			var Yf,Zf,ag,bg,Va,ja;
			Va=(za.eflags>>12)&3;
			if(za.cpl>Va)Ec(13);
			if(Ga&0x0080)Yf=0xffff;
			else Yf=-1;
			Zf=Aa[7];
			ag=Aa[2]&0xffff;
			if(Ga&(0x0010|0x0020)) {
				bg=Aa[1];
				if((bg&Yf)==0)return;;
				if(Yf==-1&&za.df==1&&(ia&3)==0) {
					var sg,l,tg,i,ug,ja,vg;
					sg=bg>>>0;
					l=(4096-(ia&0xfff))>>2;
					if(sg>l)sg=l;
					tg=ud(Aa[7],1);
					vg=za.ld32_port;
					for(i=0; i<sg; i++) {
						ja=vg(ag);
						Wa[tg]=ja&0xff;
						Wa[tg+1]=(ja>>8)&0xff;
						Wa[tg+2]=(ja>>16)&0xff;
						Wa[tg+3]=(ja>>24)&0xff;
						tg+=4;
					}
					ug=sg<<2;
					Aa[7]=(Zf+ug)>>0;
					Aa[1]=bg=(bg-sg)>>0;
					if(bg)Lb=Nb;
				}
				else {
					ja=za.ld32_port(ag);
					ia=((Zf&Yf)+za.segs[0].base)>>0;
					xb(ja);
					Aa[7]=(Zf&~Yf)|((Zf+(za.df<<2))&Yf);
					Aa[1]=bg=(bg&~Yf)|((bg-1)&Yf);
					if(bg&Yf)Lb=Nb;;
				}
			}
			else {
				ja=za.ld32_port(ag);
				ia=((Zf&Yf)+za.segs[0].base)>>0;
				xb(ja);
				Aa[7]=(Zf&~Yf)|((Zf+(za.df<<2))&Yf);
			}
		}
		function wg() {
			var Yf,dg,Tb,bg,ag,Va,ja;
			Va=(za.eflags>>12)&3;
			if(za.cpl>Va)Ec(13);
			if(Ga&0x0080)Yf=0xffff;
			else Yf=-1;
			Tb=Ga&0x000f;
			if(Tb==0)Tb=3;
			else Tb--;
			dg=Aa[6];
			ag=Aa[2]&0xffff;
			if(Ga&(0x0010|0x0020)) {
				bg=Aa[1];
				if((bg&Yf)==0)return;;
				ia=((dg&Yf)+za.segs[Tb].base)>>0;
				ja=lb();
				za.st32_port(ag,ja);
				Aa[6]=(dg&~Yf)|((dg+(za.df<<2))&Yf);
				Aa[1]=bg=(bg&~Yf)|((bg-1)&Yf);
				if(bg&Yf)Lb=Nb;;
			}
			else {
				ia=((dg&Yf)+za.segs[Tb].base)>>0;
				ja=lb();
				za.st32_port(ag,ja);
				Aa[6]=(dg&~Yf)|((dg+(za.df<<2))&Yf);
			}
		}
		function xg() {
			var Yf,Zf,dg,bg,Tb,fg;
			if(Ga&0x0080)Yf=0xffff;
			else Yf=-1;
			Tb=Ga&0x000f;
			if(Tb==0)Tb=3;
			else Tb--;
			dg=Aa[6];
			Zf=Aa[7];
			ia=((dg&Yf)+za.segs[Tb].base)>>0;
			fg=((Zf&Yf)+za.segs[0].base)>>0;
			if(Ga&(0x0010|0x0020)) {
				bg=Aa[1];
				if((bg&Yf)==0)return;;
				if(Yf==-1&&za.df==1&&((ia|fg)&3)==0) {
					var sg,l,yg,tg,i,ug;
					sg=bg>>>0;
					l=(4096-(ia&0xfff))>>2;
					if(sg>l)sg=l;
					l=(4096-(fg&0xfff))>>2;
					if(sg>l)sg=l;
					yg=ud(ia,0);
					tg=ud(fg,1);
					ug=sg<<2;
					for(i=0; i<ug; i++)Wa[tg+i]=Wa[yg+i];
					Aa[6]=(dg+ug)>>0;
					Aa[7]=(Zf+ug)>>0;
					Aa[1]=bg=(bg-sg)>>0;
					if(bg)Lb=Nb;
				}
				else {
					ja=lb();
					ia=fg;
					xb(ja);
					Aa[6]=(dg&~Yf)|((dg+(za.df<<2))&Yf);
					Aa[7]=(Zf&~Yf)|((Zf+(za.df<<2))&Yf);
					Aa[1]=bg=(bg&~Yf)|((bg-1)&Yf);
					if(bg&Yf)Lb=Nb;;
				}
			}
			else {
				ja=lb();
				ia=fg;
				xb(ja);
				Aa[6]=(dg&~Yf)|((dg+(za.df<<2))&Yf);
				Aa[7]=(Zf&~Yf)|((Zf+(za.df<<2))&Yf);
			}
		}
		function zg() {
			var Yf,Zf,bg;
			if(Ga&0x0080)Yf=0xffff;
			else Yf=-1;
			Zf=Aa[7];
			ia=((Zf&Yf)+za.segs[0].base)>>0;
			if(Ga&(0x0010|0x0020)) {
				bg=Aa[1];
				if((bg&Yf)==0)return;;
				if(Yf==-1&&za.df==1&&(ia&3)==0) {
					var sg,l,tg,i,ug,ja;
					sg=bg>>>0;
					l=(4096-(ia&0xfff))>>2;
					if(sg>l)sg=l;
					tg=ud(Aa[7],1);
					ja=Aa[0];
					for(i=0; i<sg; i++) {
						Wa[tg]=ja&0xff;
						Wa[tg+1]=(ja>>8)&0xff;
						Wa[tg+2]=(ja>>16)&0xff;
						Wa[tg+3]=(ja>>24)&0xff;
						tg+=4;
					}
					ug=sg<<2;
					Aa[7]=(Zf+ug)>>0;
					Aa[1]=bg=(bg-sg)>>0;
					if(bg)Lb=Nb;
				}
				else {
					xb(Aa[0]);
					Aa[7]=(Zf&~Yf)|((Zf+(za.df<<2))&Yf);
					Aa[1]=bg=(bg&~Yf)|((bg-1)&Yf);
					if(bg&Yf)Lb=Nb;;
				}
			}
			else {
				xb(Aa[0]);
				Aa[7]=(Zf&~Yf)|((Zf+(za.df<<2))&Yf);
			}
		}
		function Ag() {
			var Yf,Zf,dg,bg,Tb,fg;
			if(Ga&0x0080)Yf=0xffff;
			else Yf=-1;
			Tb=Ga&0x000f;
			if(Tb==0)Tb=3;
			else Tb--;
			dg=Aa[6];
			Zf=Aa[7];
			ia=((dg&Yf)+za.segs[Tb].base)>>0;
			fg=((Zf&Yf)+za.segs[0].base)>>0;
			if(Ga&(0x0010|0x0020)) {
				bg=Aa[1];
				if((bg&Yf)==0)return;;
				ja=lb();
				ia=fg;
				Ka=lb();
				Yb(7,ja,Ka);
				Aa[6]=(dg&~Yf)|((dg+(za.df<<2))&Yf);
				Aa[7]=(Zf&~Yf)|((Zf+(za.df<<2))&Yf);
				Aa[1]=bg=(bg&~Yf)|((bg-1)&Yf);
				if(Ga&0x0010) {
					if(!(Ca==0))return;
				}
				else {
					if((Ca==0))return;
				}
				if(bg&Yf)Lb=Nb;;
			}
			else {
				ja=lb();
				ia=fg;
				Ka=lb();
				Yb(7,ja,Ka);
				Aa[6]=(dg&~Yf)|((dg+(za.df<<2))&Yf);
				Aa[7]=(Zf&~Yf)|((Zf+(za.df<<2))&Yf);
			}
		}
		function Bg() {
			var Yf,dg,Tb,bg,ja;
			if(Ga&0x0080)Yf=0xffff;
			else Yf=-1;
			Tb=Ga&0x000f;
			if(Tb==0)Tb=3;
			else Tb--;
			dg=Aa[6];
			ia=((dg&Yf)+za.segs[Tb].base)>>0;
			if(Ga&(0x0010|0x0020)) {
				bg=Aa[1];
				if((bg&Yf)==0)return;;
				ja=lb();
				Aa[0]=ja;
				Aa[6]=(dg&~Yf)|((dg+(za.df<<2))&Yf);
				Aa[1]=bg=(bg&~Yf)|((bg-1)&Yf);
				if(bg&Yf)Lb=Nb;;
			}
			else {
				ja=lb();
				Aa[0]=ja;
				Aa[6]=(dg&~Yf)|((dg+(za.df<<2))&Yf);
			}
		}
		function Cg() {
			var Yf,Zf,bg,ja;
			if(Ga&0x0080)Yf=0xffff;
			else Yf=-1;
			Zf=Aa[7];
			ia=((Zf&Yf)+za.segs[0].base)>>0;
			if(Ga&(0x0010|0x0020)) {
				bg=Aa[1];
				if((bg&Yf)==0)return;;
				ja=lb();
				Yb(7,Aa[0],ja);
				Aa[7]=(Zf&~Yf)|((Zf+(za.df<<2))&Yf);
				Aa[1]=bg=(bg&~Yf)|((bg-1)&Yf);
				if(Ga&0x0010) {
					if(!(Ca==0))return;
				}
				else {
					if((Ca==0))return;
				}
				if(bg&Yf)Lb=Nb;;
			}
			else {
				ja=lb();
				Yb(7,Aa[0],ja);
				Aa[7]=(Zf&~Yf)|((Zf+(za.df<<2))&Yf);
			}
		}
		za=this;
		Wa=this.phys_mem8;
		ab=this.tlb_read_user;
		bb=this.tlb_write_user;
		Ya=this.tlb_read_kernel;
		Za=this.tlb_write_kernel;
		if(za.cpl==3) {
			cb=ab;
			db=bb;
		}
		else {
			cb=Ya;
			db=Za;
		}
		if(za.halted) {
			if(za.hard_irq!=0&&(za.eflags&0x00000200)) {
				za.halted=0;
			}
			else {
				return 257;
			}
		}
		Aa=this.regs;
		Ba=this.cc_src;
		Ca=this.cc_dst;
		Da=this.cc_op;
		Ea=this.cc_op2;
		Fa=this.cc_dst2;
		Kb=this.eip;
		de();
		Oa=256;
		Na=xa;
		if(ya) {
			;
			Be(ya.intno,0,ya.error_code,0,0);
		}
		if(za.hard_intno>=0) {
			;
			Be(za.hard_intno,0,0,0,1);
			za.hard_intno=-1;
		}
		if(za.hard_irq!=0&&(za.eflags&0x00000200)) {
			za.hard_intno=za.get_hard_intno();;
			Be(za.hard_intno,0,0,0,1);
			za.hard_intno=-1;
		}
		Lb=0;
		Nb=0;
	Dg:
		do {
			;
			Kb=(Kb+Lb-Nb)>>0;
			Ob=(Kb+Qa)>>0;
			Mb=cb[Ob>>>12];
			if(((Mb|Ob)&0xfff)>=(4096-15+1)) {
				var Eg;
				if(Mb==-1)gb(Ob,0,za.cpl==3);
				Mb=cb[Ob>>>12];
				Nb=Lb=Ob^Mb;
				b=Wa[Lb++];;
				Eg=Ob&0xfff;
				if(Eg>=(4096-15+1)) {
					ja=Dd(Ob,b);
					if((Eg+ja)>4096) {
						Nb=Lb=this.mem_size;
						for(Ka=0; Ka<ja; Ka++) {
							ia=(Ob+Ka)>>0;
							Wa[Lb+Ka]=(((Xa=cb[ia>>>12])==-1)?eb():Wa[ia^Xa]);
						}
						Lb++;
					}
				}
			}
			else {
				Nb=Lb=Ob^Mb;
				b=Wa[Lb++];;
			}
			b|=(Ga=Ua)&0x0100;
			/*if (this.cycle_count >= 700000 && this.cycle_count < 1200000) {
				gladis[gladis.length] = new Object();
				gladis[gladis.length-1].St = this.cycle_count;
				gladis[gladis.length-1].Na = Na;
				gladis[gladis.length-1].b = b;
			}*/
	Gd:
			for(;;) {
				/*if (this.cycle_count >= 700000 && this.cycle_count < 800000) {
					nocturnal[nocturnal.length] = "B = "+b+" EIP="+sa(this.eip)+" EAX="+sa(this.regs[0])+" ECX="+sa(this.regs[1])+" EDX="+sa(this.regs[2])+" EBX="+sa(this.regs[3])+" EFL="+sa(this.eflags)+" ESP="+sa(this.regs[4])+" EBP="+sa(this.regs[5])+" ESI="+sa(this.regs[6])+" EDI="+sa(this.regs[7]);
				}*/
				nocturnal[nocturnal.length] = "EIP=" + sa(Kb);
				switch(b) {
				case 0x66:
					if(Ga==Ua)Dd(Ob,b);
					if(Ua&0x0100)Ga&=~0x0100;
					else Ga|=0x0100;
					b=Wa[Lb++];;
					b|=(Ga&0x0100);
					break;
				case 0x67:
					if(Ga==Ua)Dd(Ob,b);
					if(Ua&0x0080)Ga&=~0x0080;
					else Ga|=0x0080;
					b=Wa[Lb++];;
					b|=(Ga&0x0100);
					break;
				case 0xf0:
					if(Ga==Ua)Dd(Ob,b);
					Ga|=0x0040;
					b=Wa[Lb++];;
					b|=(Ga&0x0100);
					break;
				case 0xf2:
					if(Ga==Ua)Dd(Ob,b);
					Ga|=0x0020;
					b=Wa[Lb++];;
					b|=(Ga&0x0100);
					break;
				case 0xf3:
					if(Ga==Ua)Dd(Ob,b);
					Ga|=0x0010;
					b=Wa[Lb++];;
					b|=(Ga&0x0100);
					break;
				case 0x26:
				case 0x2e:
				case 0x36:
				case 0x3e:
					if(Ga==Ua)Dd(Ob,b);
					Ga=(Ga&~0x000f)|(((b>>3)&3)+1);
					b=Wa[Lb++];;
					b|=(Ga&0x0100);;
					break;
				case 0x64:
				case 0x65:
					if(Ga==Ua)Dd(Ob,b);
					Ga=(Ga&~0x000f)|((b&7)+1);
					b=Wa[Lb++];;
					b|=(Ga&0x0100);;
					break;
				case 0xb0:
				case 0xb1:
				case 0xb2:
				case 0xb3:
				case 0xb4:
				case 0xb5:
				case 0xb6:
				case 0xb7:
					ja=Wa[Lb++];;
					b&=7;
					Xa=(b&4)<<1;
					Aa[b&3]=(Aa[b&3]&~(0xff<<Xa))|(((ja)&0xff)<<Xa);
					break Gd;
				case 0xb8:
				case 0xb9:
				case 0xba:
				case 0xbb:
				case 0xbc:
				case 0xbd:
				case 0xbe:
				case 0xbf: {
					ja=Wa[Lb]|(Wa[Lb+1]<<8)|(Wa[Lb+2]<<16)|(Wa[Lb+3]<<24);
					Lb+=4;
				};
				Aa[b&7]=ja;
				break Gd;
				case 0x88:
					Ha=Wa[Lb++];;
					Ja=(Ha>>3)&7;
					ja=(Aa[Ja&3]>>((Ja&4)<<1));
					if((Ha>>6)==3) {
						Ia=Ha&7;
						Xa=(Ia&4)<<1;
						Aa[Ia&3]=(Aa[Ia&3]&~(0xff<<Xa))|(((ja)&0xff)<<Xa);
					}
					else {
						ia=Qb(Ha);
						{
							Xa=db[ia>>>12];
							if(Xa==-1) {
								sb(ja);
							}
							else {
								Wa[ia^Xa]=ja&0xff;
							}
						};
					}
					break Gd;
				case 0x89:
					Ha=Wa[Lb++];;
					ja=Aa[(Ha>>3)&7];
					if((Ha>>6)==3) {
						Aa[Ha&7]=ja;
					}
					else {
						ia=Qb(Ha);
						{
							Xa=db[ia>>>12];
							if((Xa|ia)&3) {
								wb(ja);
							}
							else {
								Xa^=ia;
								Wa[Xa]=ja&0xff;
								Wa[Xa+1]=(ja>>8)&0xff;
								Wa[Xa+2]=(ja>>16)&0xff;
								Wa[Xa+3]=(ja>>24)&0xff;
							}
						};
					}
					break Gd;
				case 0x8a:
					Ha=Wa[Lb++];;
					if((Ha>>6)==3) {
						Ia=Ha&7;
						ja=(Aa[Ia&3]>>((Ia&4)<<1));
					}
					else {
						ia=Qb(Ha);
						ja=(((Xa=cb[ia>>>12])==-1)?eb():Wa[ia^Xa]);
					}
					Ja=(Ha>>3)&7;
					Xa=(Ja&4)<<1;
					Aa[Ja&3]=(Aa[Ja&3]&~(0xff<<Xa))|(((ja)&0xff)<<Xa);
					break Gd;
				case 0x8b:
					Ha=Wa[Lb++];;
					if((Ha>>6)==3) {
						ja=Aa[Ha&7];
					}
					else {
						ia=Qb(Ha);
						ja=(((Xa=cb[ia>>>12])|ia)&3?kb():(Xa^=ia,Wa[Xa]|(Wa[Xa+1]<<8)|(Wa[Xa+2]<<16)|(Wa[Xa+3]<<24)));
					}
					Aa[(Ha>>3)&7]=ja;
					break Gd;
				case 0xa0:
					ia=Vb();
					ja=hb();
					Aa[0]=(Aa[0]&-256)|ja;
					break Gd;
				case 0xa1:
					ia=Vb();
					ja=lb();
					Aa[0]=ja;
					break Gd;
				case 0xa2:
					ia=Vb();
					tb(Aa[0]);
					break Gd;
				case 0xa3:
					ia=Vb();
					xb(Aa[0]);
					break Gd;
				case 0xd7:
					ia=(Aa[3]+(Aa[0]&0xff))>>0;
					if(Ga&0x0080)ia&=0xffff;
					Ja=Ga&0x000f;
					if(Ja==0)Ja=3;
					else Ja--;
					ia=(ia+za.segs[Ja].base)>>0;
					ja=hb();
					Wb(0,ja);
					break Gd;
				case 0xc6:
					Ha=Wa[Lb++];;
					if((Ha>>6)==3) {
						ja=Wa[Lb++];;
						Wb(Ha&7,ja);
					}
					else {
						ia=Qb(Ha);
						ja=Wa[Lb++];;
						tb(ja);
					}
					break Gd;
				case 0xc7:
					Ha=Wa[Lb++];;
					if((Ha>>6)==3) {{
							ja=Wa[Lb]|(Wa[Lb+1]<<8)|(Wa[Lb+2]<<16)|(Wa[Lb+3]<<24);
							Lb+=4;
						};
						Aa[Ha&7]=ja;
					}
					else {
						ia=Qb(Ha);
						{
							ja=Wa[Lb]|(Wa[Lb+1]<<8)|(Wa[Lb+2]<<16)|(Wa[Lb+3]<<24);
							Lb+=4;
						};
						xb(ja);
					}
					break Gd;
				case 0x91:
				case 0x92:
				case 0x93:
				case 0x94:
				case 0x95:
				case 0x96:
				case 0x97:
					Ja=b&7;
					ja=Aa[0];
					Aa[0]=Aa[Ja];
					Aa[Ja]=ja;
					break Gd;
				case 0x86:
					Ha=Wa[Lb++];;
					Ja=(Ha>>3)&7;
					if((Ha>>6)==3) {
						Ia=Ha&7;
						ja=(Aa[Ia&3]>>((Ia&4)<<1));
						Wb(Ia,(Aa[Ja&3]>>((Ja&4)<<1)));
					}
					else {
						ia=Qb(Ha);
						ja=nb();
						tb((Aa[Ja&3]>>((Ja&4)<<1)));
					}
					Wb(Ja,ja);
					break Gd;
				case 0x87:
					Ha=Wa[Lb++];;
					Ja=(Ha>>3)&7;
					if((Ha>>6)==3) {
						Ia=Ha&7;
						ja=Aa[Ia];
						Aa[Ia]=Aa[Ja];
					}
					else {
						ia=Qb(Ha);
						ja=rb();
						xb(Aa[Ja]);
					}
					Aa[Ja]=ja;
					break Gd;
				case 0x8e:
					Ha=Wa[Lb++];;
					Ja=(Ha>>3)&7;
					if(Ja>=6||Ja==1)Ec(6);
					if((Ha>>6)==3) {
						ja=Aa[Ha&7]&0xffff;
					}
					else {
						ia=Qb(Ha);
						ja=jb();
					}
					Je(Ja,ja);
					break Gd;
				case 0x8c:
					Ha=Wa[Lb++];;
					Ja=(Ha>>3)&7;
					if(Ja>=6)Ec(6);
					ja=za.segs[Ja].selector;
					if((Ha>>6)==3) {
						if((((Ga>>8)&1)^1)) {
							Aa[Ha&7]=ja;
						}
						else {
							Xb(Ha&7,ja);
						}
					}
					else {
						ia=Qb(Ha);
						vb(ja);
					}
					break Gd;
				case 0xc4:
					Vf(0);
					break Gd;
				case 0xc5:
					Vf(3);
					break Gd;
				case 0x00:
				case 0x08:
				case 0x10:
				case 0x18:
				case 0x20:
				case 0x28:
				case 0x30:
				case 0x38:
					Ha=Wa[Lb++];;
					Ma=b>>3;
					Ja=(Ha>>3)&7;
					Ka=(Aa[Ja&3]>>((Ja&4)<<1));
					if((Ha>>6)==3) {
						Ia=Ha&7;
						Wb(Ia,hc(Ma,(Aa[Ia&3]>>((Ia&4)<<1)),Ka));
					}
					else {
						ia=Qb(Ha);
						if(Ma!=7) {
							ja=nb();
							ja=hc(Ma,ja,Ka);
							tb(ja);
						}
						else {
							ja=hb();
							hc(7,ja,Ka);
						}
					}
					break Gd;
				case 0x01:
					Ha=Wa[Lb++];;
					Ka=Aa[(Ha>>3)&7];
					if((Ha>>6)==3) {
						Ia=Ha&7;
						{
							Ba=Ka;
							Ca=Aa[Ia]=(Aa[Ia]+Ba)>>0;
							Da=2;
						};
					}
					else {
						ia=Qb(Ha);
						ja=rb();
						{
							Ba=Ka;
							Ca=ja=(ja+Ba)>>0;
							Da=2;
						};
						xb(ja);
					}
					break Gd;
				case 0x09:
				case 0x11:
				case 0x19:
				case 0x21:
				case 0x29:
				case 0x31:
					Ha=Wa[Lb++];;
					Ma=b>>3;
					Ka=Aa[(Ha>>3)&7];
					if((Ha>>6)==3) {
						Ia=Ha&7;
						Aa[Ia]=Yb(Ma,Aa[Ia],Ka);
					}
					else {
						ia=Qb(Ha);
						ja=rb();
						ja=Yb(Ma,ja,Ka);
						xb(ja);
					}
					break Gd;
				case 0x39:
					Ha=Wa[Lb++];;
					Ma=b>>3;
					Ka=Aa[(Ha>>3)&7];
					if((Ha>>6)==3) {
						Ia=Ha&7;
						{
							Ba=Ka;
							Ca=(Aa[Ia]-Ba)>>0;
							Da=8;
						};
					}
					else {
						ia=Qb(Ha);
						ja=lb();
						{
							Ba=Ka;
							Ca=(ja-Ba)>>0;
							Da=8;
						};
					}
					break Gd;
				case 0x02:
				case 0x0a:
				case 0x12:
				case 0x1a:
				case 0x22:
				case 0x2a:
				case 0x32:
				case 0x3a:
					Ha=Wa[Lb++];;
					Ma=b>>3;
					Ja=(Ha>>3)&7;
					if((Ha>>6)==3) {
						Ia=Ha&7;
						Ka=(Aa[Ia&3]>>((Ia&4)<<1));
					}
					else {
						ia=Qb(Ha);
						Ka=hb();
					}
					Wb(Ja,hc(Ma,(Aa[Ja&3]>>((Ja&4)<<1)),Ka));
					break Gd;
				case 0x03:
					Ha=Wa[Lb++];;
					Ja=(Ha>>3)&7;
					if((Ha>>6)==3) {
						Ka=Aa[Ha&7];
					}
					else {
						ia=Qb(Ha);
						Ka=lb();
					}{
						Ba=Ka;
						Ca=Aa[Ja]=(Aa[Ja]+Ba)>>0;
						Da=2;
					};
					break Gd;
				case 0x0b:
				case 0x13:
				case 0x1b:
				case 0x23:
				case 0x2b:
				case 0x33:
					Ha=Wa[Lb++];;
					Ma=b>>3;
					Ja=(Ha>>3)&7;
					if((Ha>>6)==3) {
						Ka=Aa[Ha&7];
					}
					else {
						ia=Qb(Ha);
						Ka=lb();
					}
					Aa[Ja]=Yb(Ma,Aa[Ja],Ka);
					break Gd;
				case 0x3b:
					Ha=Wa[Lb++];;
					Ma=b>>3;
					Ja=(Ha>>3)&7;
					if((Ha>>6)==3) {
						Ka=Aa[Ha&7];
					}
					else {
						ia=Qb(Ha);
						Ka=lb();
					}{
						Ba=Ka;
						Ca=(Aa[Ja]-Ba)>>0;
						Da=8;
					};
					break Gd;
				case 0x04:
				case 0x0c:
				case 0x14:
				case 0x1c:
				case 0x24:
				case 0x2c:
				case 0x34:
				case 0x3c:
					Ka=Wa[Lb++];;
					Ma=b>>3;
					Wb(0,hc(Ma,Aa[0]&0xff,Ka));
					break Gd;
				case 0x05: {
					Ka=Wa[Lb]|(Wa[Lb+1]<<8)|(Wa[Lb+2]<<16)|(Wa[Lb+3]<<24);
					Lb+=4;
				};
				{
					Ba=Ka;
					Ca=Aa[0]=(Aa[0]+Ba)>>0;
					Da=2;
				};
				break Gd;
				case 0x0d:
				case 0x15:
				case 0x1d:
				case 0x25:
				case 0x2d: {
					Ka=Wa[Lb]|(Wa[Lb+1]<<8)|(Wa[Lb+2]<<16)|(Wa[Lb+3]<<24);
					Lb+=4;
				};
				Ma=b>>3;
				Aa[0]=Yb(Ma,Aa[0],Ka);
				break Gd;
				case 0x35: {
					Ka=Wa[Lb]|(Wa[Lb+1]<<8)|(Wa[Lb+2]<<16)|(Wa[Lb+3]<<24);
					Lb+=4;
				};
				{
					Ca=Aa[0]=Aa[0]^Ka;
					Da=14;
				};
				break Gd;
				case 0x3d: {
					Ka=Wa[Lb]|(Wa[Lb+1]<<8)|(Wa[Lb+2]<<16)|(Wa[Lb+3]<<24);
					Lb+=4;
				};
				{
					Ba=Ka;
					Ca=(Aa[0]-Ba)>>0;
					Da=8;
				};
				break Gd;
				case 0x80:
				case 0x82:
					Ha=Wa[Lb++];;
					Ma=(Ha>>3)&7;
					if((Ha>>6)==3) {
						Ia=Ha&7;
						Ka=Wa[Lb++];;
						Wb(Ia,hc(Ma,(Aa[Ia&3]>>((Ia&4)<<1)),Ka));
					}
					else {
						ia=Qb(Ha);
						Ka=Wa[Lb++];;
						if(Ma!=7) {
							ja=nb();
							ja=hc(Ma,ja,Ka);
							tb(ja);
						}
						else {
							ja=hb();
							hc(7,ja,Ka);
						}
					}
					break Gd;
				case 0x81:
					Ha=Wa[Lb++];;
					Ma=(Ha>>3)&7;
					if(Ma==7) {
						if((Ha>>6)==3) {
							ja=Aa[Ha&7];
						}
						else {
							ia=Qb(Ha);
							ja=lb();
						}{
							Ka=Wa[Lb]|(Wa[Lb+1]<<8)|(Wa[Lb+2]<<16)|(Wa[Lb+3]<<24);
							Lb+=4;
						};
						{
							Ba=Ka;
							Ca=(ja-Ba)>>0;
							Da=8;
						};
					}
					else {
						if((Ha>>6)==3) {
							Ia=Ha&7;
							{
								Ka=Wa[Lb]|(Wa[Lb+1]<<8)|(Wa[Lb+2]<<16)|(Wa[Lb+3]<<24);
								Lb+=4;
							};
							Aa[Ia]=Yb(Ma,Aa[Ia],Ka);
						}
						else {
							ia=Qb(Ha);
							{
								Ka=Wa[Lb]|(Wa[Lb+1]<<8)|(Wa[Lb+2]<<16)|(Wa[Lb+3]<<24);
								Lb+=4;
							};
							ja=rb();
							ja=Yb(Ma,ja,Ka);
							xb(ja);
						}
					}
					break Gd;
				case 0x83:
					Ha=Wa[Lb++];;
					Ma=(Ha>>3)&7;
					if(Ma==7) {
						if((Ha>>6)==3) {
							ja=Aa[Ha&7];
						}
						else {
							ia=Qb(Ha);
							ja=lb();
						}
						Ka=((Wa[Lb++]<<24)>>24);;
						{
							Ba=Ka;
							Ca=(ja-Ba)>>0;
							Da=8;
						};
					}
					else {
						if((Ha>>6)==3) {
							Ia=Ha&7;
							Ka=((Wa[Lb++]<<24)>>24);;
							Aa[Ia]=Yb(Ma,Aa[Ia],Ka);
						}
						else {
							ia=Qb(Ha);
							Ka=((Wa[Lb++]<<24)>>24);;
							ja=rb();
							ja=Yb(Ma,ja,Ka);
							xb(ja);
						}
					}
					break Gd;
				case 0x40:
				case 0x41:
				case 0x42:
				case 0x43:
				case 0x44:
				case 0x45:
				case 0x46:
				case 0x47:
					Ja=b&7;
					{
						if(Da<25) {
							Ea=Da;
							Fa=Ca;
						}
						Aa[Ja]=Ca=(Aa[Ja]+1)>>0;
						Da=27;
					};
					break Gd;
				case 0x48:
				case 0x49:
				case 0x4a:
				case 0x4b:
				case 0x4c:
				case 0x4d:
				case 0x4e:
				case 0x4f:
					Ja=b&7;
					{
						if(Da<25) {
							Ea=Da;
							Fa=Ca;
						}
						Aa[Ja]=Ca=(Aa[Ja]-1)>>0;
						Da=30;
					};
					break Gd;
				case 0x6b:
					Ha=Wa[Lb++];;
					Ja=(Ha>>3)&7;
					if((Ha>>6)==3) {
						Ka=Aa[Ha&7];
					}
					else {
						ia=Qb(Ha);
						Ka=lb();
					}
					La=((Wa[Lb++]<<24)>>24);;
					Aa[Ja]=Xc(Ka,La);
					break Gd;
				case 0x69:
					Ha=Wa[Lb++];;
					Ja=(Ha>>3)&7;
					if((Ha>>6)==3) {
						Ka=Aa[Ha&7];
					}
					else {
						ia=Qb(Ha);
						Ka=lb();
					}{
						La=Wa[Lb]|(Wa[Lb+1]<<8)|(Wa[Lb+2]<<16)|(Wa[Lb+3]<<24);
						Lb+=4;
					};
					Aa[Ja]=Xc(Ka,La);
					break Gd;
				case 0x84:
					Ha=Wa[Lb++];;
					if((Ha>>6)==3) {
						Ia=Ha&7;
						ja=(Aa[Ia&3]>>((Ia&4)<<1));
					}
					else {
						ia=Qb(Ha);
						ja=hb();
					}
					Ja=(Ha>>3)&7;
					Ka=(Aa[Ja&3]>>((Ja&4)<<1));
					{
						Ca=(((ja&Ka)<<24)>>24);
						Da=12;
					};
					break Gd;
				case 0x85:
					Ha=Wa[Lb++];;
					if((Ha>>6)==3) {
						ja=Aa[Ha&7];
					}
					else {
						ia=Qb(Ha);
						ja=lb();
					}
					Ka=Aa[(Ha>>3)&7];
					{
						Ca=ja&Ka;
						Da=14;
					};
					break Gd;
				case 0xa8:
					Ka=Wa[Lb++];;
					{
						Ca=(((Aa[0]&Ka)<<24)>>24);
						Da=12;
					};
					break Gd;
				case 0xa9: {
					Ka=Wa[Lb]|(Wa[Lb+1]<<8)|(Wa[Lb+2]<<16)|(Wa[Lb+3]<<24);
					Lb+=4;
				};
				{
					Ca=Aa[0]&Ka;
					Da=14;
				};
				break Gd;
				case 0xf6:
					Ha=Wa[Lb++];;
					Ma=(Ha>>3)&7;
					switch(Ma) {
					case 0:
						if((Ha>>6)==3) {
							Ia=Ha&7;
							ja=(Aa[Ia&3]>>((Ia&4)<<1));
						}
						else {
							ia=Qb(Ha);
							ja=hb();
						}
						Ka=Wa[Lb++];;
						{
							Ca=(((ja&Ka)<<24)>>24);
							Da=12;
						};
						break;
					case 2:
						if((Ha>>6)==3) {
							Ia=Ha&7;
							Wb(Ia,~(Aa[Ia&3]>>((Ia&4)<<1)));
						}
						else {
							ia=Qb(Ha);
							ja=nb();
							ja=~ja;
							tb(ja);
						}
						break;
					case 3:
						if((Ha>>6)==3) {
							Ia=Ha&7;
							Wb(Ia,hc(5,0,(Aa[Ia&3]>>((Ia&4)<<1))));
						}
						else {
							ia=Qb(Ha);
							ja=nb();
							ja=hc(5,0,ja);
							tb(ja);
						}
						break;
					case 4:
						if((Ha>>6)==3) {
							Ia=Ha&7;
							ja=(Aa[Ia&3]>>((Ia&4)<<1));
						}
						else {
							ia=Qb(Ha);
							ja=hb();
						}
						Xb(0,Pc(Aa[0],ja));
						break;
					case 5:
						if((Ha>>6)==3) {
							Ia=Ha&7;
							ja=(Aa[Ia&3]>>((Ia&4)<<1));
						}
						else {
							ia=Qb(Ha);
							ja=hb();
						}
						Xb(0,Qc(Aa[0],ja));
						break;
					case 6:
						if((Ha>>6)==3) {
							Ia=Ha&7;
							ja=(Aa[Ia&3]>>((Ia&4)<<1));
						}
						else {
							ia=Qb(Ha);
							ja=hb();
						}
						Dc(ja);
						break;
					case 7:
						if((Ha>>6)==3) {
							Ia=Ha&7;
							ja=(Aa[Ia&3]>>((Ia&4)<<1));
						}
						else {
							ia=Qb(Ha);
							ja=hb();
						}
						Fc(ja);
						break;
					default:
						Ec(6);
					}
					break Gd;
				case 0xf7:
					Ha=Wa[Lb++];;
					Ma=(Ha>>3)&7;
					switch(Ma) {
					case 0:
						if((Ha>>6)==3) {
							ja=Aa[Ha&7];
						}
						else {
							ia=Qb(Ha);
							ja=lb();
						}{
							Ka=Wa[Lb]|(Wa[Lb+1]<<8)|(Wa[Lb+2]<<16)|(Wa[Lb+3]<<24);
							Lb+=4;
						};
						{
							Ca=ja&Ka;
							Da=14;
						};
						break;
					case 2:
						if((Ha>>6)==3) {
							Ia=Ha&7;
							Aa[Ia]=~Aa[Ia];
						}
						else {
							ia=Qb(Ha);
							ja=rb();
							ja=~ja;
							xb(ja);
						}
						break;
					case 3:
						if((Ha>>6)==3) {
							Ia=Ha&7;
							Aa[Ia]=Yb(5,0,Aa[Ia]);
						}
						else {
							ia=Qb(Ha);
							ja=rb();
							ja=Yb(5,0,ja);
							xb(ja);
						}
						break;
					case 4:
						if((Ha>>6)==3) {
							ja=Aa[Ha&7];
						}
						else {
							ia=Qb(Ha);
							ja=lb();
						}
						Aa[0]=Wc(Aa[0],ja);
						Aa[2]=Pa;
						break;
					case 5:
						if((Ha>>6)==3) {
							ja=Aa[Ha&7];
						}
						else {
							ia=Qb(Ha);
							ja=lb();
						}
						Aa[0]=Xc(Aa[0],ja);
						Aa[2]=Pa;
						break;
					case 6:
						if((Ha>>6)==3) {
							ja=Aa[Ha&7];
						}
						else {
							ia=Qb(Ha);
							ja=lb();
						}
						Aa[0]=Ic(Aa[2],Aa[0],ja);
						Aa[2]=Pa;
						break;
					case 7:
						if((Ha>>6)==3) {
							ja=Aa[Ha&7];
						}
						else {
							ia=Qb(Ha);
							ja=lb();
						}
						Aa[0]=Mc(Aa[2],Aa[0],ja);
						Aa[2]=Pa;
						break;
					default:
						Ec(6);
					}
					break Gd;
				case 0xc0:
					Ha=Wa[Lb++];;
					Ma=(Ha>>3)&7;
					if((Ha>>6)==3) {
						Ka=Wa[Lb++];;
						Ia=Ha&7;
						Wb(Ia,kc(Ma,(Aa[Ia&3]>>((Ia&4)<<1)),Ka));
					}
					else {
						ia=Qb(Ha);
						Ka=Wa[Lb++];;
						ja=nb();
						ja=kc(Ma,ja,Ka);
						tb(ja);
					}
					break Gd;
				case 0xc1:
					Ha=Wa[Lb++];;
					Ma=(Ha>>3)&7;
					if((Ha>>6)==3) {
						Ka=Wa[Lb++];;
						Ia=Ha&7;
						Aa[Ia]=oc(Ma,Aa[Ia],Ka);
					}
					else {
						ia=Qb(Ha);
						Ka=Wa[Lb++];;
						ja=rb();
						ja=oc(Ma,ja,Ka);
						xb(ja);
					}
					break Gd;
				case 0xd0:
					Ha=Wa[Lb++];;
					Ma=(Ha>>3)&7;
					if((Ha>>6)==3) {
						Ia=Ha&7;
						Wb(Ia,kc(Ma,(Aa[Ia&3]>>((Ia&4)<<1)),1));
					}
					else {
						ia=Qb(Ha);
						ja=nb();
						ja=kc(Ma,ja,1);
						tb(ja);
					}
					break Gd;
				case 0xd1:
					Ha=Wa[Lb++];;
					Ma=(Ha>>3)&7;
					if((Ha>>6)==3) {
						Ia=Ha&7;
						Aa[Ia]=oc(Ma,Aa[Ia],1);
					}
					else {
						ia=Qb(Ha);
						ja=rb();
						ja=oc(Ma,ja,1);
						xb(ja);
					}
					break Gd;
				case 0xd2:
					Ha=Wa[Lb++];;
					Ma=(Ha>>3)&7;
					Ka=Aa[1]&0xff;
					if((Ha>>6)==3) {
						Ia=Ha&7;
						Wb(Ia,kc(Ma,(Aa[Ia&3]>>((Ia&4)<<1)),Ka));
					}
					else {
						ia=Qb(Ha);
						ja=nb();
						ja=kc(Ma,ja,Ka);
						tb(ja);
					}
					break Gd;
				case 0xd3:
					Ha=Wa[Lb++];;
					Ma=(Ha>>3)&7;
					Ka=Aa[1]&0xff;
					if((Ha>>6)==3) {
						Ia=Ha&7;
						Aa[Ia]=oc(Ma,Aa[Ia],Ka);
					}
					else {
						ia=Qb(Ha);
						ja=rb();
						ja=oc(Ma,ja,Ka);
						xb(ja);
					}
					break Gd;
				case 0x98:
					Aa[0]=(Aa[0]<<16)>>16;
					break Gd;
				case 0x99:
					Aa[2]=Aa[0]>>31;
					break Gd;
				case 0x50:
				case 0x51:
				case 0x52:
				case 0x53:
				case 0x54:
				case 0x55:
				case 0x56:
				case 0x57:
					ja=Aa[b&7];
					if(Ta) {
						ia=(Aa[4]-4)>>0;
						{
							Xa=db[ia>>>12];
							if((Xa|ia)&3) {
								wb(ja);
							}
							else {
								Xa^=ia;
								Wa[Xa]=ja&0xff;
								Wa[Xa+1]=(ja>>8)&0xff;
								Wa[Xa+2]=(ja>>16)&0xff;
								Wa[Xa+3]=(ja>>24)&0xff;
							}
						};
						Aa[4]=ia;
					}
					else {
						yd(ja);
					}
					break Gd;
				case 0x58:
				case 0x59:
				case 0x5a:
				case 0x5b:
				case 0x5c:
				case 0x5d:
				case 0x5e:
				case 0x5f:
					if(Ta) {
						ia=Aa[4];
						ja=(((Xa=cb[ia>>>12])|ia)&3?kb():(Xa^=ia,Wa[Xa]|(Wa[Xa+1]<<8)|(Wa[Xa+2]<<16)|(Wa[Xa+3]<<24)));
						Aa[4]=(ia+4)>>0;
					}
					else {
						ja=Bd();
						Cd();
					}
					Aa[b&7]=ja;
					break Gd;
				case 0x60:
					Lf();
					break Gd;
				case 0x61:
					Nf();
					break Gd;
				case 0x8f:
					Ha=Wa[Lb++];;
					if((Ha>>6)==3) {
						ja=Bd();
						Cd();
						Aa[Ha&7]=ja;
					}
					else {
						ja=Bd();
						Ka=Aa[4];
						Cd();
						La=Aa[4];
						ia=Qb(Ha);
						Aa[4]=Ka;
						xb(ja);
						Aa[4]=La;
					}
					break Gd;
				case 0x68: {
					ja=Wa[Lb]|(Wa[Lb+1]<<8)|(Wa[Lb+2]<<16)|(Wa[Lb+3]<<24);
					Lb+=4;
				};
				if(Ta) {
					ia=(Aa[4]-4)>>0;
					xb(ja);
					Aa[4]=ia;
				}
				else {
					yd(ja);
				}
				break Gd;
				case 0x6a:
					ja=((Wa[Lb++]<<24)>>24);;
					if(Ta) {
						ia=(Aa[4]-4)>>0;
						xb(ja);
						Aa[4]=ia;
					}
					else {
						yd(ja);
					}
					break Gd;
				case 0xc8:
					Uf();
					break Gd;
				case 0xc9:
					if(Ta) {
						ia=Aa[5];
						ja=lb();
						Aa[5]=ja;
						Aa[4]=(ia+4)>>0;
					}
					else {
						Pf();
					}
					break Gd;
				case 0x9c:
					Va=(za.eflags>>12)&3;
					if((za.eflags&0x00020000)&&Va!=3)Ec(13);
					ja=jd()&~(0x00020000|0x00010000);
					if((((Ga>>8)&1)^1)) {
						yd(ja);
					}
					else {
						wd(ja);
					}
					break Gd;
				case 0x9d:
					Va=(za.eflags>>12)&3;
					if((za.eflags&0x00020000)&&Va!=3)Ec(13);
					if((((Ga>>8)&1)^1)) {
						ja=Bd();
						Cd();
						Ka=-1;
					}
					else {
						ja=zd();
						Ad();
						Ka=0xffff;
					}
					La=(0x00000100|0x00040000|0x00200000|0x00004000);
					if(za.cpl==0) {
						La|=0x00000200|0x00003000;
					}
					else {
						if(za.cpl<=Va)La|=0x00000200;
					}
					ld(ja,La&Ka);
					{
						if(za.hard_irq!=0&&(za.eflags&0x00000200))break Dg;
					};
					break Gd;
				case 0x06:
				case 0x0e:
				case 0x16:
				case 0x1e:
					yd(za.segs[b>>3].selector);
					break Gd;
				case 0x07:
				case 0x17:
				case 0x1f:
					Je(b>>3,Bd()&0xffff);
					Cd();
					break Gd;
				case 0x8d:
					Ha=Wa[Lb++];;
					if((Ha>>6)==3)Ec(6);
					Ga=(Ga&~0x000f)|(6+1);
					Aa[(Ha>>3)&7]=Qb(Ha);
					break Gd;
				case 0xfe:
					Ha=Wa[Lb++];;
					Ma=(Ha>>3)&7;
					switch(Ma) {
					case 0:
						if((Ha>>6)==3) {
							Ia=Ha&7;
							Wb(Ia,ic((Aa[Ia&3]>>((Ia&4)<<1))));
						}
						else {
							ia=Qb(Ha);
							ja=nb();
							ja=ic(ja);
							tb(ja);
						}
						break;
					case 1:
						if((Ha>>6)==3) {
							Ia=Ha&7;
							Wb(Ia,jc((Aa[Ia&3]>>((Ia&4)<<1))));
						}
						else {
							ia=Qb(Ha);
							ja=nb();
							ja=jc(ja);
							tb(ja);
						}
						break;
					default:
						Ec(6);
					}
					break Gd;
				case 0xff:
					Ha=Wa[Lb++];;
					Ma=(Ha>>3)&7;
					switch(Ma) {
					case 0:
						if((Ha>>6)==3) {
							Ia=Ha&7;
							{
								if(Da<25) {
									Ea=Da;
									Fa=Ca;
								}
								Aa[Ia]=Ca=(Aa[Ia]+1)>>0;
								Da=27;
							};
						}
						else {
							ia=Qb(Ha);
							ja=rb();
							{
								if(Da<25) {
									Ea=Da;
									Fa=Ca;
								}
								ja=Ca=(ja+1)>>0;
								Da=27;
							};
							xb(ja);
						}
						break;
					case 1:
						if((Ha>>6)==3) {
							Ia=Ha&7;
							{
								if(Da<25) {
									Ea=Da;
									Fa=Ca;
								}
								Aa[Ia]=Ca=(Aa[Ia]-1)>>0;
								Da=30;
							};
						}
						else {
							ia=Qb(Ha);
							ja=rb();
							{
								if(Da<25) {
									Ea=Da;
									Fa=Ca;
								}
								ja=Ca=(ja-1)>>0;
								Da=30;
							};
							xb(ja);
						}
						break;
					case 2:
						if((Ha>>6)==3) {
							ja=Aa[Ha&7];
						}
						else {
							ia=Qb(Ha);
							ja=lb();
						}
						Ka=(Kb+Lb-Nb);
						if(Ta) {
							ia=(Aa[4]-4)>>0;
							xb(Ka);
							Aa[4]=ia;
						}
						else {
							yd(Ka);
						}
						Kb=ja,Lb=Nb=0;
						break;
					case 4:
						if((Ha>>6)==3) {
							ja=Aa[Ha&7];
						}
						else {
							ia=Qb(Ha);
							ja=lb();
						}
						Kb=ja,Lb=Nb=0;
						break;
					case 6:
						if((Ha>>6)==3) {
							ja=Aa[Ha&7];
						}
						else {
							ia=Qb(Ha);
							ja=lb();
						}
						if(Ta) {
							ia=(Aa[4]-4)>>0;
							xb(ja);
							Aa[4]=ia;
						}
						else {
							yd(ja);
						}
						break;
					case 3:
					case 5:
						if((Ha>>6)==3)Ec(6);
						ia=Qb(Ha);
						ja=lb();
						ia=(ia+4)>>0;
						Ka=jb();
						if(Ma==3)af(1,Ka,ja,(Kb+Lb-Nb));
						else Pe(Ka,ja);
						break;
					default:
						Ec(6);
					}
					break Gd;
				case 0xeb:
					ja=((Wa[Lb++]<<24)>>24);;
					Lb=(Lb+ja)>>0;
					break Gd;
				case 0xe9: {
					ja=Wa[Lb]|(Wa[Lb+1]<<8)|(Wa[Lb+2]<<16)|(Wa[Lb+3]<<24);
					Lb+=4;
				};
				Lb=(Lb+ja)>>0;
				break Gd;
				case 0xea:
					if((((Ga>>8)&1)^1)) {{
							ja=Wa[Lb]|(Wa[Lb+1]<<8)|(Wa[Lb+2]<<16)|(Wa[Lb+3]<<24);
							Lb+=4;
						};
					}
					else {
						ja=Pb();
					}
					Ka=Pb();
					Pe(Ka,ja);
					break Gd;
				case 0x70:
					if(ad()) {
						ja=((Wa[Lb++]<<24)>>24);;
						Lb=(Lb+ja)>>0;
					}
					else {
						Lb=(Lb+1)>>0;
					}
					break Gd;
				case 0x71:
					if(!ad()) {
						ja=((Wa[Lb++]<<24)>>24);;
						Lb=(Lb+ja)>>0;
					}
					else {
						Lb=(Lb+1)>>0;
					}
					break Gd;
				case 0x72:
					if(cc()) {
						ja=((Wa[Lb++]<<24)>>24);;
						Lb=(Lb+ja)>>0;
					}
					else {
						Lb=(Lb+1)>>0;
					}
					break Gd;
				case 0x73:
					if(!cc()) {
						ja=((Wa[Lb++]<<24)>>24);;
						Lb=(Lb+ja)>>0;
					}
					else {
						Lb=(Lb+1)>>0;
					}
					break Gd;
				case 0x74:
					if((Ca==0)) {
						ja=((Wa[Lb++]<<24)>>24);;
						Lb=(Lb+ja)>>0;
					}
					else {
						Lb=(Lb+1)>>0;
					}
					break Gd;
				case 0x75:
					if(!(Ca==0)) {
						ja=((Wa[Lb++]<<24)>>24);;
						Lb=(Lb+ja)>>0;
					}
					else {
						Lb=(Lb+1)>>0;
					}
					break Gd;
				case 0x76:
					if(bd()) {
						ja=((Wa[Lb++]<<24)>>24);;
						Lb=(Lb+ja)>>0;
					}
					else {
						Lb=(Lb+1)>>0;
					}
					break Gd;
				case 0x77:
					if(!bd()) {
						ja=((Wa[Lb++]<<24)>>24);;
						Lb=(Lb+ja)>>0;
					}
					else {
						Lb=(Lb+1)>>0;
					}
					break Gd;
				case 0x78:
					if((Da==24?((Ba>>7)&1):(Ca<0))) {
						ja=((Wa[Lb++]<<24)>>24);;
						Lb=(Lb+ja)>>0;
					}
					else {
						Lb=(Lb+1)>>0;
					}
					break Gd;
				case 0x79:
					if(!(Da==24?((Ba>>7)&1):(Ca<0))) {
						ja=((Wa[Lb++]<<24)>>24);;
						Lb=(Lb+ja)>>0;
					}
					else {
						Lb=(Lb+1)>>0;
					}
					break Gd;
				case 0x7a:
					if(cd()) {
						ja=((Wa[Lb++]<<24)>>24);;
						Lb=(Lb+ja)>>0;
					}
					else {
						Lb=(Lb+1)>>0;
					}
					break Gd;
				case 0x7b:
					if(!cd()) {
						ja=((Wa[Lb++]<<24)>>24);;
						Lb=(Lb+ja)>>0;
					}
					else {
						Lb=(Lb+1)>>0;
					}
					break Gd;
				case 0x7c:
					if(dd()) {
						ja=((Wa[Lb++]<<24)>>24);;
						Lb=(Lb+ja)>>0;
					}
					else {
						Lb=(Lb+1)>>0;
					}
					break Gd;
				case 0x7d:
					if(!dd()) {
						ja=((Wa[Lb++]<<24)>>24);;
						Lb=(Lb+ja)>>0;
					}
					else {
						Lb=(Lb+1)>>0;
					}
					break Gd;
				case 0x7e:
					if(ed()) {
						ja=((Wa[Lb++]<<24)>>24);;
						Lb=(Lb+ja)>>0;
					}
					else {
						Lb=(Lb+1)>>0;
					}
					break Gd;
				case 0x7f:
					if(!ed()) {
						ja=((Wa[Lb++]<<24)>>24);;
						Lb=(Lb+ja)>>0;
					}
					else {
						Lb=(Lb+1)>>0;
					}
					break Gd;
				case 0xe0:
				case 0xe1:
				case 0xe2:
					ja=((Wa[Lb++]<<24)>>24);;
					if(Ga&0x0080)Ma=0xffff;
					else Ma=-1;
					Ka=(Aa[1]-1)&Ma;
					Aa[1]=(Aa[1]&~Ma)|Ka;
					b&=3;
					if(b==0)La=!(Ca==0);
					else if(b==1)La=(Ca==0);
					else La=1;
					if(Ka&&La) {
						if(Ga&0x0100) {
							Kb=(Kb+Lb-Nb+ja)&0xffff,Lb=Nb=0;
						}
						else {
							Lb=(Lb+ja)>>0;
						}
					}
					break Gd;
				case 0xe3:
					ja=((Wa[Lb++]<<24)>>24);;
					if(Ga&0x0080)Ma=0xffff;
					else Ma=-1;
					if((Aa[1]&Ma)==0) {
						if(Ga&0x0100) {
							Kb=(Kb+Lb-Nb+ja)&0xffff,Lb=Nb=0;
						}
						else {
							Lb=(Lb+ja)>>0;
						}
					}
					break Gd;
				case 0xc2:
					Ka=(Pb()<<16)>>16;
					ja=Bd();
					Aa[4]=(Aa[4]&~Sa)|((Aa[4]+4+Ka)&Sa);
					Kb=ja,Lb=Nb=0;
					break Gd;
				case 0xc3:
					if(Ta) {
						ia=Aa[4];
						ja=lb();
						Aa[4]=(Aa[4]+4)>>0;
					}
					else {
						ja=Bd();
						Cd();
					}
					Kb=ja,Lb=Nb=0;
					break Gd;
				case 0xe8: {
					ja=Wa[Lb]|(Wa[Lb+1]<<8)|(Wa[Lb+2]<<16)|(Wa[Lb+3]<<24);
					Lb+=4;
				};
				Ka=(Kb+Lb-Nb);
				if(Ta) {
					ia=(Aa[4]-4)>>0;
					xb(Ka);
					Aa[4]=ia;
				}
				else {
					yd(Ka);
				}
				Lb=(Lb+ja)>>0;
				break Gd;
				case 0x9a:
					La=(((Ga>>8)&1)^1);
					if(La) {{
							ja=Wa[Lb]|(Wa[Lb+1]<<8)|(Wa[Lb+2]<<16)|(Wa[Lb+3]<<24);
							Lb+=4;
						};
					}
					else {
						ja=Pb();
					}
					Ka=Pb();
					af(La,Ka,ja,(Kb+Lb-Nb));
					{
						if(za.hard_irq!=0&&(za.eflags&0x00000200))break Dg;
					};
					break Gd;
				case 0xca:
					Ka=(Pb()<<16)>>16;
					of((((Ga>>8)&1)^1),Ka);
					{
						if(za.hard_irq!=0&&(za.eflags&0x00000200))break Dg;
					};
					break Gd;
				case 0xcb:
					of((((Ga>>8)&1)^1),0);
					{
						if(za.hard_irq!=0&&(za.eflags&0x00000200))break Dg;
					};
					break Gd;
				case 0xcf:
					nf((((Ga>>8)&1)^1));
					{
						if(za.hard_irq!=0&&(za.eflags&0x00000200))break Dg;
					};
					break Gd;
				case 0x90:
					break Gd;
				case 0xcc:
					Ka=(Kb+Lb-Nb);
					Be(3,1,0,Ka,0);
					break Gd;
				case 0xcd:
					ja=Wa[Lb++];;
					if((za.eflags&0x00020000)&&((za.eflags>>12)&3)!=3)Ec(13);
					Ka=(Kb+Lb-Nb);
					Be(ja,1,0,Ka,0);
					break Gd;
				case 0xce:
					if(ad()) {
						Ka=(Kb+Lb-Nb);
						Be(4,1,0,Ka,0);
					}
					break Gd;
				case 0x62:
					If();
					break Gd;
				case 0xf5:
					Ba=id()^0x0001;
					Ca=((Ba>>6)&1)^1;
					Da=24;
					break Gd;
				case 0xf8:
					Ba=id()&~0x0001;
					Ca=((Ba>>6)&1)^1;
					Da=24;
					break Gd;
				case 0xf9:
					Ba=id()|0x0001;
					Ca=((Ba>>6)&1)^1;
					Da=24;
					break Gd;
				case 0xfc:
					za.df=1;
					break Gd;
				case 0xfd:
					za.df=-1;
					break Gd;
				case 0xfa:
					Va=(za.eflags>>12)&3;
					if(za.cpl>Va)Ec(13);
					za.eflags&=~0x00000200;
					break Gd;
				case 0xfb:
					Va=(za.eflags>>12)&3;
					if(za.cpl>Va)Ec(13);
					za.eflags|=0x00000200;
					{
						if(za.hard_irq!=0&&(za.eflags&0x00000200))break Dg;
					};
					break Gd;
				case 0x9e:
					Ba=((Aa[0]>>8)&(0x0080|0x0040|0x0010|0x0004|0x0001))|(ad()<<11);
					Ca=((Ba>>6)&1)^1;
					Da=24;
					break Gd;
				case 0x9f:
					ja=jd();
					Wb(4,ja);
					break Gd;
				case 0xf4:
					if(za.cpl!=0)Ec(13);
					za.halted=1;
					Oa=257;
					break Dg;
				case 0xa4:
					eg();
					break Gd;
				case 0xa5:
					xg();
					break Gd;
				case 0xaa:
					gg();
					break Gd;
				case 0xab:
					zg();
					break Gd;
				case 0xa6:
					hg();
					break Gd;
				case 0xa7:
					Ag();
					break Gd;
				case 0xac:
					ig();
					break Gd;
				case 0xad:
					Bg();
					break Gd;
				case 0xae:
					jg();
					break Gd;
				case 0xaf:
					Cg();
					break Gd;
				case 0x6c:
					Xf();
					{
						if(za.hard_irq!=0&&(za.eflags&0x00000200))break Dg;
					};
					break Gd;
				case 0x6d:
					rg();
					{
						if(za.hard_irq!=0&&(za.eflags&0x00000200))break Dg;
					};
					break Gd;
				case 0x6e:
					cg();
					{
						if(za.hard_irq!=0&&(za.eflags&0x00000200))break Dg;
					};
					break Gd;
				case 0x6f:
					wg();
					{
						if(za.hard_irq!=0&&(za.eflags&0x00000200))break Dg;
					};
					break Gd;
				case 0xd8:
				case 0xd9:
				case 0xda:
				case 0xdb:
				case 0xdc:
				case 0xdd:
				case 0xde:
				case 0xdf:
					if(za.cr0&((1<<2)|(1<<3))) {
						Ec(7);
					}
					Ha=Wa[Lb++];;
					Ja=(Ha>>3)&7;
					Ia=Ha&7;
					Ma=((b&7)<<3)|((Ha>>3)&7);
					Xb(0,0xffff);
					if((Ha>>6)==3) {} else {
						ia=Qb(Ha);
					}
					break Gd;
				case 0x9b:
					break Gd;
				case 0xe4:
					Va=(za.eflags>>12)&3;
					if(za.cpl>Va)Ec(13);
					ja=Wa[Lb++];;
					Wb(0,za.ld8_port(ja));
					{
						if(za.hard_irq!=0&&(za.eflags&0x00000200))break Dg;
					};
					break Gd;
				case 0xe5:
					Va=(za.eflags>>12)&3;
					if(za.cpl>Va)Ec(13);
					ja=Wa[Lb++];;
					Aa[0]=za.ld32_port(ja);
					{
						if(za.hard_irq!=0&&(za.eflags&0x00000200))break Dg;
					};
					break Gd;
				case 0xe6:
					Va=(za.eflags>>12)&3;
					if(za.cpl>Va)Ec(13);
					ja=Wa[Lb++];;
					za.st8_port(ja,Aa[0]&0xff);
					{
						if(za.hard_irq!=0&&(za.eflags&0x00000200))break Dg;
					};
					break Gd;
				case 0xe7:
					Va=(za.eflags>>12)&3;
					if(za.cpl>Va)Ec(13);
					ja=Wa[Lb++];;
					za.st32_port(ja,Aa[0]);
					{
						if(za.hard_irq!=0&&(za.eflags&0x00000200))break Dg;
					};
					break Gd;
				case 0xec:
					Va=(za.eflags>>12)&3;
					if(za.cpl>Va)Ec(13);
					Wb(0,za.ld8_port(Aa[2]&0xffff));
					{
						if(za.hard_irq!=0&&(za.eflags&0x00000200))break Dg;
					};
					break Gd;
				case 0xed:
					Va=(za.eflags>>12)&3;
					if(za.cpl>Va)Ec(13);
					Aa[0]=za.ld32_port(Aa[2]&0xffff);
					{
						if(za.hard_irq!=0&&(za.eflags&0x00000200))break Dg;
					};
					break Gd;
				case 0xee:
					Va=(za.eflags>>12)&3;
					if(za.cpl>Va)Ec(13);
					za.st8_port(Aa[2]&0xffff,Aa[0]&0xff);
					{
						if(za.hard_irq!=0&&(za.eflags&0x00000200))break Dg;
					};
					break Gd;
				case 0xef:
					Va=(za.eflags>>12)&3;
					if(za.cpl>Va)Ec(13);
					za.st32_port(Aa[2]&0xffff,Aa[0]);
					{
						if(za.hard_irq!=0&&(za.eflags&0x00000200))break Dg;
					};
					break Gd;
				case 0x27:
					Ef();
					break Gd;
				case 0x2f:
					Gf();
					break Gd;
				case 0x37:
					Af();
					break Gd;
				case 0x3f:
					Df();
					break Gd;
				case 0xd4:
					ja=Wa[Lb++];;
					wf(ja);
					break Gd;
				case 0xd5:
					ja=Wa[Lb++];;
					zf(ja);
					break Gd;
				case 0x63:
					uf();
					break Gd;
				case 0xd6:
				case 0xf1:
					Ec(6);
					break;
				case 0x0f:
					b=Wa[Lb++];;
					switch(b) {
					case 0x80:
					case 0x81:
					case 0x82:
					case 0x83:
					case 0x84:
					case 0x85:
					case 0x86:
					case 0x87:
					case 0x88:
					case 0x89:
					case 0x8a:
					case 0x8b:
					case 0x8c:
					case 0x8d:
					case 0x8e:
					case 0x8f: {
						ja=Wa[Lb]|(Wa[Lb+1]<<8)|(Wa[Lb+2]<<16)|(Wa[Lb+3]<<24);
						Lb+=4;
					};
					if(gd(b&0xf))Lb=(Lb+ja)>>0;
					break Gd;
					case 0x90:
					case 0x91:
					case 0x92:
					case 0x93:
					case 0x94:
					case 0x95:
					case 0x96:
					case 0x97:
					case 0x98:
					case 0x99:
					case 0x9a:
					case 0x9b:
					case 0x9c:
					case 0x9d:
					case 0x9e:
					case 0x9f:
						Ha=Wa[Lb++];;
						ja=gd(b&0xf);
						if((Ha>>6)==3) {
							Wb(Ha&7,ja);
						}
						else {
							ia=Qb(Ha);
							tb(ja);
						}
						break Gd;
					case 0x40:
					case 0x41:
					case 0x42:
					case 0x43:
					case 0x44:
					case 0x45:
					case 0x46:
					case 0x47:
					case 0x48:
					case 0x49:
					case 0x4a:
					case 0x4b:
					case 0x4c:
					case 0x4d:
					case 0x4e:
					case 0x4f:
						Ha=Wa[Lb++];;
						if((Ha>>6)==3) {
							ja=Aa[Ha&7];
						}
						else {
							ia=Qb(Ha);
							ja=lb();
						}
						if(gd(b&0xf))Aa[(Ha>>3)&7]=ja;
						break Gd;
					case 0xb6:
						Ha=Wa[Lb++];;
						Ja=(Ha>>3)&7;
						if((Ha>>6)==3) {
							Ia=Ha&7;
							ja=(Aa[Ia&3]>>((Ia&4)<<1))&0xff;
						}
						else {
							ia=Qb(Ha);
							ja=(((Xa=cb[ia>>>12])==-1)?eb():Wa[ia^Xa]);
						}
						Aa[Ja]=ja;
						break Gd;
					case 0xb7:
						Ha=Wa[Lb++];;
						Ja=(Ha>>3)&7;
						if((Ha>>6)==3) {
							ja=Aa[Ha&7]&0xffff;
						}
						else {
							ia=Qb(Ha);
							ja=jb();
						}
						Aa[Ja]=ja;
						break Gd;
					case 0xbe:
						Ha=Wa[Lb++];;
						Ja=(Ha>>3)&7;
						if((Ha>>6)==3) {
							Ia=Ha&7;
							ja=(Aa[Ia&3]>>((Ia&4)<<1));
						}
						else {
							ia=Qb(Ha);
							ja=(((Xa=cb[ia>>>12])==-1)?eb():Wa[ia^Xa]);
						}
						Aa[Ja]=(((ja)<<24)>>24);
						break Gd;
					case 0xbf:
						Ha=Wa[Lb++];;
						Ja=(Ha>>3)&7;
						if((Ha>>6)==3) {
							ja=Aa[Ha&7];
						}
						else {
							ia=Qb(Ha);
							ja=jb();
						}
						Aa[Ja]=(((ja)<<16)>>16);
						break Gd;
					case 0x00:
						if(!(za.cr0&(1<<0))||(za.eflags&0x00020000))Ec(6);
						Ha=Wa[Lb++];;
						Ma=(Ha>>3)&7;
						switch(Ma) {
						case 0:
						case 1:
							if(Ma==0)ja=za.ldt.selector;
							else ja=za.tr.selector;
							if((Ha>>6)==3) {
								Xb(Ha&7,ja);
							}
							else {
								ia=Qb(Ha);
								vb(ja);
							}
							break;
						case 2:
						case 3:
							if(za.cpl!=0)Ec(13);
							if((Ha>>6)==3) {
								ja=Aa[Ha&7]&0xffff;
							}
							else {
								ia=Qb(Ha);
								ja=jb();
							}
							if(Ma==2)De(ja);
							else Fe(ja);
							break;
						case 4:
						case 5:
							if((Ha>>6)==3) {
								ja=Aa[Ha&7]&0xffff;
							}
							else {
								ia=Qb(Ha);
								ja=jb();
							}
							tf(ja,Ma&1);
							break;
						default:
							Ec(6);
						}
						break Gd;
					case 0x01:
						Ha=Wa[Lb++];;
						Ma=(Ha>>3)&7;
						switch(Ma) {
						case 2:
						case 3:
							if((Ha>>6)==3)Ec(6);
							if(this.cpl!=0)Ec(13);
							ia=Qb(Ha);
							ja=jb();
							ia+=2;
							Ka=lb();
							if(Ma==2) {
								this.gdt.base=Ka;
								this.gdt.limit=ja;
							}
							else {
								this.idt.base=Ka;
								this.idt.limit=ja;
							}
							break;
						case 7:
							if(this.cpl!=0)Ec(13);
							if((Ha>>6)==3)Ec(6);
							ia=Qb(Ha);
							za.tlb_flush_page(ia&-4096);
							break;
						default:
							Ec(6);
						}
						break Gd;
					case 0x02:
					case 0x03:
						rf((((Ga>>8)&1)^1),b&1);
						break Gd;
					case 0x20:
						if(za.cpl!=0)Ec(13);
						Ha=Wa[Lb++];;
						if((Ha>>6)!=3)Ec(6);
						Ja=(Ha>>3)&7;
						switch(Ja) {
						case 0:
							ja=za.cr0;
							break;
						case 2:
							ja=za.cr2;
							break;
						case 3:
							ja=za.cr3;
							break;
						case 4:
							ja=za.cr4;
							break;
						default:
							Ec(6);
						}
						Aa[Ha&7]=ja;
						break Gd;
					case 0x22:
						if(za.cpl!=0)Ec(13);
						Ha=Wa[Lb++];;
						if((Ha>>6)!=3)Ec(6);
						Ja=(Ha>>3)&7;
						ja=Aa[Ha&7];
						switch(Ja) {
						case 0:
							Qd(ja);
							break;
						case 2:
							za.cr2=ja;
							break;
						case 3:
							Sd(ja);
							break;
						case 4:
							Ud(ja);
							break;
						default:
							Ec(6);
						}
						break Gd;
					case 0x06:
						if(za.cpl!=0)Ec(13);
						Qd(za.cr0&~(1<<3));
						break Gd;
					case 0x23:
						if(za.cpl!=0)Ec(13);
						Ha=Wa[Lb++];;
						if((Ha>>6)!=3)Ec(6);
						Ja=(Ha>>3)&7;
						ja=Aa[Ha&7];
						if(Ja==4||Ja==5)Ec(6);
						break Gd;
					case 0xb2:
					case 0xb4:
					case 0xb5:
						Vf(b&7);
						break Gd;
					case 0xa2:
						vf();
						break Gd;
					case 0xa4:
						Ha=Wa[Lb++];;
						Ka=Aa[(Ha>>3)&7];
						if((Ha>>6)==3) {
							La=Wa[Lb++];;
							Ia=Ha&7;
							Aa[Ia]=sc(Aa[Ia],Ka,La);
						}
						else {
							ia=Qb(Ha);
							La=Wa[Lb++];;
							ja=rb();
							ja=sc(ja,Ka,La);
							xb(ja);
						}
						break Gd;
					case 0xa5:
						Ha=Wa[Lb++];;
						Ka=Aa[(Ha>>3)&7];
						La=Aa[1];
						if((Ha>>6)==3) {
							Ia=Ha&7;
							Aa[Ia]=sc(Aa[Ia],Ka,La);
						}
						else {
							ia=Qb(Ha);
							ja=rb();
							ja=sc(ja,Ka,La);
							xb(ja);
						}
						break Gd;
					case 0xac:
						Ha=Wa[Lb++];;
						Ka=Aa[(Ha>>3)&7];
						if((Ha>>6)==3) {
							La=Wa[Lb++];;
							Ia=Ha&7;
							Aa[Ia]=tc(Aa[Ia],Ka,La);
						}
						else {
							ia=Qb(Ha);
							La=Wa[Lb++];;
							ja=rb();
							ja=tc(ja,Ka,La);
							xb(ja);
						}
						break Gd;
					case 0xad:
						Ha=Wa[Lb++];;
						Ka=Aa[(Ha>>3)&7];
						La=Aa[1];
						if((Ha>>6)==3) {
							Ia=Ha&7;
							Aa[Ia]=tc(Aa[Ia],Ka,La);
						}
						else {
							ia=Qb(Ha);
							ja=rb();
							ja=tc(ja,Ka,La);
							xb(ja);
						}
						break Gd;
					case 0xba:
						Ha=Wa[Lb++];;
						Ma=(Ha>>3)&7;
						switch(Ma) {
						case 4:
							if((Ha>>6)==3) {
								ja=Aa[Ha&7];
								Ka=Wa[Lb++];;
							}
							else {
								ia=Qb(Ha);
								Ka=Wa[Lb++];;
								ja=lb();
							}
							vc(ja,Ka);
							break;
						case 5:
						case 6:
						case 7:
							if((Ha>>6)==3) {
								Ia=Ha&7;
								Ka=Wa[Lb++];;
								Aa[Ia]=yc(Ma&3,Aa[Ia],Ka);
							}
							else {
								ia=Qb(Ha);
								Ka=Wa[Lb++];;
								ja=rb();
								ja=yc(Ma&3,ja,Ka);
								xb(ja);
							}
							break;
						default:
							Ec(6);
						}
						break Gd;
					case 0xa3:
						Ha=Wa[Lb++];;
						Ka=Aa[(Ha>>3)&7];
						if((Ha>>6)==3) {
							ja=Aa[Ha&7];
						}
						else {
							ia=Qb(Ha);
							ia=(ia+((Ka>>5)<<2))>>0;
							ja=lb();
						}
						vc(ja,Ka);
						break Gd;
					case 0xab:
					case 0xb3:
					case 0xbb:
						Ha=Wa[Lb++];;
						Ka=Aa[(Ha>>3)&7];
						Ma=(b>>3)&3;
						if((Ha>>6)==3) {
							Ia=Ha&7;
							Aa[Ia]=yc(Ma,Aa[Ia],Ka);
						}
						else {
							ia=Qb(Ha);
							ia=(ia+((Ka>>5)<<2))>>0;
							ja=rb();
							ja=yc(Ma,ja,Ka);
							xb(ja);
						}
						break Gd;
					case 0xbc:
					case 0xbd:
						Ha=Wa[Lb++];;
						Ja=(Ha>>3)&7;
						if((Ha>>6)==3) {
							Ka=Aa[Ha&7];
						}
						else {
							ia=Qb(Ha);
							Ka=lb();
						}
						if(b&1)Aa[Ja]=Cc(Aa[Ja],Ka);
						else Aa[Ja]=Ac(Aa[Ja],Ka);
						break Gd;
					case 0xaf:
						Ha=Wa[Lb++];;
						Ja=(Ha>>3)&7;
						if((Ha>>6)==3) {
							Ka=Aa[Ha&7];
						}
						else {
							ia=Qb(Ha);
							Ka=lb();
						}
						Aa[Ja]=Xc(Aa[Ja],Ka);
						break Gd;
					case 0x31:
						if((za.cr4&(1<<2))&&za.cpl!=0)Ec(13);
						ja=nd();
						Aa[0]=ja>>>0;
						Aa[2]=(ja/0x100000000)>>>0;
						break Gd;
					case 0xc0:
						Ha=Wa[Lb++];;
						Ja=(Ha>>3)&7;
						if((Ha>>6)==3) {
							Ia=Ha&7;
							ja=(Aa[Ia&3]>>((Ia&4)<<1));
							Ka=hc(0,ja,(Aa[Ja&3]>>((Ja&4)<<1)));
							Wb(Ja,ja);
							Wb(Ia,Ka);
						}
						else {
							ia=Qb(Ha);
							ja=nb();
							Ka=hc(0,ja,(Aa[Ja&3]>>((Ja&4)<<1)));
							tb(Ka);
							Wb(Ja,ja);
						}
						break Gd;
					case 0xc1:
						Ha=Wa[Lb++];;
						Ja=(Ha>>3)&7;
						if((Ha>>6)==3) {
							Ia=Ha&7;
							ja=Aa[Ia];
							Ka=Yb(0,ja,Aa[Ja]);
							Aa[Ja]=ja;
							Aa[Ia]=Ka;
						}
						else {
							ia=Qb(Ha);
							ja=rb();
							Ka=Yb(0,ja,Aa[Ja]);
							xb(Ka);
							Aa[Ja]=ja;
						}
						break Gd;
					case 0xb0:
						Ha=Wa[Lb++];;
						Ja=(Ha>>3)&7;
						if((Ha>>6)==3) {
							Ia=Ha&7;
							ja=(Aa[Ia&3]>>((Ia&4)<<1));
							Ka=hc(5,Aa[0],ja);
							if(Ka==0) {
								Wb(Ia,(Aa[Ja&3]>>((Ja&4)<<1)));
							}
							else {
								Wb(0,ja);
							}
						}
						else {
							ia=Qb(Ha);
							ja=nb();
							Ka=hc(5,Aa[0],ja);
							if(Ka==0) {
								tb((Aa[Ja&3]>>((Ja&4)<<1)));
							}
							else {
								Wb(0,ja);
							}
						}
						break Gd;
					case 0xb1:
						Ha=Wa[Lb++];;
						Ja=(Ha>>3)&7;
						if((Ha>>6)==3) {
							Ia=Ha&7;
							ja=Aa[Ia];
							Ka=Yb(5,Aa[0],ja);
							if(Ka==0) {
								Aa[Ia]=Aa[Ja];
							}
							else {
								Aa[0]=ja;
							}
						}
						else {
							ia=Qb(Ha);
							ja=rb();
							Ka=Yb(5,Aa[0],ja);
							if(Ka==0) {
								xb(Aa[Ja]);
							}
							else {
								Aa[0]=ja;
							}
						}
						break Gd;
					case 0xa0:
					case 0xa8:
						yd(za.segs[(b>>3)&7].selector);
						break Gd;
					case 0xa1:
					case 0xa9:
						Je((b>>3)&7,Bd()&0xffff);
						Cd();
						break Gd;
					case 0xc8:
					case 0xc9:
					case 0xca:
					case 0xcb:
					case 0xcc:
					case 0xcd:
					case 0xce:
					case 0xcf:
						Ja=b&7;
						ja=Aa[Ja];
						ja=(ja>>>24)|((ja>>8)&0x0000ff00)|((ja<<8)&0x00ff0000)|(ja<<24);
						Aa[Ja]=ja;
						break Gd;
					case 0x04:
					case 0x05:
					case 0x07:
					case 0x08:
					case 0x09:
					case 0x0a:
					case 0x0b:
					case 0x0c:
					case 0x0d:
					case 0x0e:
					case 0x0f:
					case 0x10:
					case 0x11:
					case 0x12:
					case 0x13:
					case 0x14:
					case 0x15:
					case 0x16:
					case 0x17:
					case 0x18:
					case 0x19:
					case 0x1a:
					case 0x1b:
					case 0x1c:
					case 0x1d:
					case 0x1e:
					case 0x1f:
					case 0x21:
					case 0x24:
					case 0x25:
					case 0x26:
					case 0x27:
					case 0x28:
					case 0x29:
					case 0x2a:
					case 0x2b:
					case 0x2c:
					case 0x2d:
					case 0x2e:
					case 0x2f:
					case 0x30:
					case 0x32:
					case 0x33:
					case 0x34:
					case 0x35:
					case 0x36:
					case 0x37:
					case 0x38:
					case 0x39:
					case 0x3a:
					case 0x3b:
					case 0x3c:
					case 0x3d:
					case 0x3e:
					case 0x3f:
					case 0x50:
					case 0x51:
					case 0x52:
					case 0x53:
					case 0x54:
					case 0x55:
					case 0x56:
					case 0x57:
					case 0x58:
					case 0x59:
					case 0x5a:
					case 0x5b:
					case 0x5c:
					case 0x5d:
					case 0x5e:
					case 0x5f:
					case 0x60:
					case 0x61:
					case 0x62:
					case 0x63:
					case 0x64:
					case 0x65:
					case 0x66:
					case 0x67:
					case 0x68:
					case 0x69:
					case 0x6a:
					case 0x6b:
					case 0x6c:
					case 0x6d:
					case 0x6e:
					case 0x6f:
					case 0x70:
					case 0x71:
					case 0x72:
					case 0x73:
					case 0x74:
					case 0x75:
					case 0x76:
					case 0x77:
					case 0x78:
					case 0x79:
					case 0x7a:
					case 0x7b:
					case 0x7c:
					case 0x7d:
					case 0x7e:
					case 0x7f:
					case 0xa6:
					case 0xa7:
					case 0xaa:
					case 0xae:
					case 0xb8:
					case 0xb9:
					case 0xc2:
					case 0xc3:
					case 0xc4:
					case 0xc5:
					case 0xc6:
					case 0xc7:
					case 0xd0:
					case 0xd1:
					case 0xd2:
					case 0xd3:
					case 0xd4:
					case 0xd5:
					case 0xd6:
					case 0xd7:
					case 0xd8:
					case 0xd9:
					case 0xda:
					case 0xdb:
					case 0xdc:
					case 0xdd:
					case 0xde:
					case 0xdf:
					case 0xe0:
					case 0xe1:
					case 0xe2:
					case 0xe3:
					case 0xe4:
					case 0xe5:
					case 0xe6:
					case 0xe7:
					case 0xe8:
					case 0xe9:
					case 0xea:
					case 0xeb:
					case 0xec:
					case 0xed:
					case 0xee:
					case 0xef:
					case 0xf0:
					case 0xf1:
					case 0xf2:
					case 0xf3:
					case 0xf4:
					case 0xf5:
					case 0xf6:
					case 0xf7:
					case 0xf8:
					case 0xf9:
					case 0xfa:
					case 0xfb:
					case 0xfc:
					case 0xfd:
					case 0xfe:
					case 0xff:
					default:
						Ec(6);
					}
					break;
				default:
					switch(b) {
					case 0x189:
						Ha=Wa[Lb++];;
						ja=Aa[(Ha>>3)&7];
						if((Ha>>6)==3) {
							Xb(Ha&7,ja);
						}
						else {
							ia=Qb(Ha);
							vb(ja);
						}
						break Gd;
					case 0x18b:
						Ha=Wa[Lb++];;
						if((Ha>>6)==3) {
							ja=Aa[Ha&7];
						}
						else {
							ia=Qb(Ha);
							ja=jb();
						}
						Xb((Ha>>3)&7,ja);
						break Gd;
					case 0x1b8:
					case 0x1b9:
					case 0x1ba:
					case 0x1bb:
					case 0x1bc:
					case 0x1bd:
					case 0x1be:
					case 0x1bf:
						Xb(b&7,Pb());
						break Gd;
					case 0x1a1:
						ia=Vb();
						ja=jb();
						Xb(0,ja);
						break Gd;
					case 0x1a3:
						ia=Vb();
						vb(Aa[0]);
						break Gd;
					case 0x1c7:
						Ha=Wa[Lb++];;
						if((Ha>>6)==3) {
							ja=Pb();
							Xb(Ha&7,ja);
						}
						else {
							ia=Qb(Ha);
							ja=Pb();
							vb(ja);
						}
						break Gd;
					case 0x191:
					case 0x192:
					case 0x193:
					case 0x194:
					case 0x195:
					case 0x196:
					case 0x197:
						Ja=b&7;
						ja=Aa[0];
						Xb(0,Aa[Ja]);
						Xb(Ja,ja);
						break Gd;
					case 0x187:
						Ha=Wa[Lb++];;
						Ja=(Ha>>3)&7;
						if((Ha>>6)==3) {
							Ia=Ha&7;
							ja=Aa[Ia];
							Xb(Ia,Aa[Ja]);
						}
						else {
							ia=Qb(Ha);
							ja=pb();
							vb(Aa[Ja]);
						}
						Xb(Ja,ja);
						break Gd;
					case 0x1c4:
						Wf(0);
						break Gd;
					case 0x1c5:
						Wf(3);
						break Gd;
					case 0x101:
					case 0x109:
					case 0x111:
					case 0x119:
					case 0x121:
					case 0x129:
					case 0x131:
					case 0x139:
						Ha=Wa[Lb++];;
						Ma=(b>>3)&7;
						Ka=Aa[(Ha>>3)&7];
						if((Ha>>6)==3) {
							Ia=Ha&7;
							Xb(Ia,ec(Ma,Aa[Ia],Ka));
						}
						else {
							ia=Qb(Ha);
							if(Ma!=7) {
								ja=pb();
								ja=ec(Ma,ja,Ka);
								vb(ja);
							}
							else {
								ja=jb();
								ec(7,ja,Ka);
							}
						}
						break Gd;
					case 0x103:
					case 0x10b:
					case 0x113:
					case 0x11b:
					case 0x123:
					case 0x12b:
					case 0x133:
					case 0x13b:
						Ha=Wa[Lb++];;
						Ma=(b>>3)&7;
						Ja=(Ha>>3)&7;
						if((Ha>>6)==3) {
							Ka=Aa[Ha&7];
						}
						else {
							ia=Qb(Ha);
							Ka=jb();
						}
						Xb(Ja,ec(Ma,Aa[Ja],Ka));
						break Gd;
					case 0x105:
					case 0x10d:
					case 0x115:
					case 0x11d:
					case 0x125:
					case 0x12d:
					case 0x135:
					case 0x13d:
						Ka=Pb();
						Ma=(b>>3)&7;
						Xb(0,ec(Ma,Aa[0],Ka));
						break Gd;
					case 0x181:
						Ha=Wa[Lb++];;
						Ma=(Ha>>3)&7;
						if((Ha>>6)==3) {
							Ia=Ha&7;
							Ka=Pb();
							Aa[Ia]=ec(Ma,Aa[Ia],Ka);
						}
						else {
							ia=Qb(Ha);
							Ka=Pb();
							if(Ma!=7) {
								ja=pb();
								ja=ec(Ma,ja,Ka);
								vb(ja);
							}
							else {
								ja=jb();
								ec(7,ja,Ka);
							}
						}
						break Gd;
					case 0x183:
						Ha=Wa[Lb++];;
						Ma=(Ha>>3)&7;
						if((Ha>>6)==3) {
							Ia=Ha&7;
							Ka=((Wa[Lb++]<<24)>>24);;
							Xb(Ia,ec(Ma,Aa[Ia],Ka));
						}
						else {
							ia=Qb(Ha);
							Ka=((Wa[Lb++]<<24)>>24);;
							if(Ma!=7) {
								ja=pb();
								ja=ec(Ma,ja,Ka);
								vb(ja);
							}
							else {
								ja=jb();
								ec(7,ja,Ka);
							}
						}
						break Gd;
					case 0x140:
					case 0x141:
					case 0x142:
					case 0x143:
					case 0x144:
					case 0x145:
					case 0x146:
					case 0x147:
						Ja=b&7;
						Xb(Ja,fc(Aa[Ja]));
						break Gd;
					case 0x148:
					case 0x149:
					case 0x14a:
					case 0x14b:
					case 0x14c:
					case 0x14d:
					case 0x14e:
					case 0x14f:
						Ja=b&7;
						Xb(Ja,gc(Aa[Ja]));
						break Gd;
					case 0x16b:
						Ha=Wa[Lb++];;
						Ja=(Ha>>3)&7;
						if((Ha>>6)==3) {
							Ka=Aa[Ha&7];
						}
						else {
							ia=Qb(Ha);
							Ka=jb();
						}
						La=((Wa[Lb++]<<24)>>24);;
						Xb(Ja,Sc(Ka,La));
						break Gd;
					case 0x169:
						Ha=Wa[Lb++];;
						Ja=(Ha>>3)&7;
						if((Ha>>6)==3) {
							Ka=Aa[Ha&7];
						}
						else {
							ia=Qb(Ha);
							Ka=jb();
						}
						La=Pb();
						Xb(Ja,Sc(Ka,La));
						break Gd;
					case 0x185:
						Ha=Wa[Lb++];;
						if((Ha>>6)==3) {
							ja=Aa[Ha&7];
						}
						else {
							ia=Qb(Ha);
							ja=jb();
						}
						Ka=Aa[(Ha>>3)&7];
						{
							Ca=(((ja&Ka)<<16)>>16);
							Da=13;
						};
						break Gd;
					case 0x1a9:
						Ka=Pb();
						{
							Ca=(((Aa[0]&Ka)<<16)>>16);
							Da=13;
						};
						break Gd;
					case 0x1f7:
						Ha=Wa[Lb++];;
						Ma=(Ha>>3)&7;
						switch(Ma) {
						case 0:
							if((Ha>>6)==3) {
								ja=Aa[Ha&7];
							}
							else {
								ia=Qb(Ha);
								ja=jb();
							}
							Ka=Pb();
							{
								Ca=(((ja&Ka)<<16)>>16);
								Da=13;
							};
							break;
						case 2:
							if((Ha>>6)==3) {
								Ia=Ha&7;
								Xb(Ia,~Aa[Ia]);
							}
							else {
								ia=Qb(Ha);
								ja=pb();
								ja=~ja;
								vb(ja);
							}
							break;
						case 3:
							if((Ha>>6)==3) {
								Ia=Ha&7;
								Xb(Ia,ec(5,0,Aa[Ia]));
							}
							else {
								ia=Qb(Ha);
								ja=pb();
								ja=ec(5,0,ja);
								vb(ja);
							}
							break;
						case 4:
							if((Ha>>6)==3) {
								ja=Aa[Ha&7];
							}
							else {
								ia=Qb(Ha);
								ja=jb();
							}
							ja=Rc(Aa[0],ja);
							Xb(0,ja);
							Xb(2,ja>>16);
							break;
						case 5:
							if((Ha>>6)==3) {
								ja=Aa[Ha&7];
							}
							else {
								ia=Qb(Ha);
								ja=jb();
							}
							ja=Sc(Aa[0],ja);
							Xb(0,ja);
							Xb(2,ja>>16);
							break;
						case 6:
							if((Ha>>6)==3) {
								ja=Aa[Ha&7];
							}
							else {
								ia=Qb(Ha);
								ja=jb();
							}
							Gc(ja);
							break;
						case 7:
							if((Ha>>6)==3) {
								ja=Aa[Ha&7];
							}
							else {
								ia=Qb(Ha);
								ja=jb();
							}
							Hc(ja);
							break;
						default:
							Ec(6);
						}
						break Gd;
					case 0x1c1:
						Ha=Wa[Lb++];;
						Ma=(Ha>>3)&7;
						if((Ha>>6)==3) {
							Ka=Wa[Lb++];;
							Ia=Ha&7;
							Xb(Ia,nc(Ma,Aa[Ia],Ka));
						}
						else {
							ia=Qb(Ha);
							Ka=Wa[Lb++];;
							ja=pb();
							ja=nc(Ma,ja,Ka);
							vb(ja);
						}
						break Gd;
					case 0x1d1:
						Ha=Wa[Lb++];;
						Ma=(Ha>>3)&7;
						if((Ha>>6)==3) {
							Ia=Ha&7;
							Xb(Ia,nc(Ma,Aa[Ia],1));
						}
						else {
							ia=Qb(Ha);
							ja=pb();
							ja=nc(Ma,ja,1);
							vb(ja);
						}
						break Gd;
					case 0x1d3:
						Ha=Wa[Lb++];;
						Ma=(Ha>>3)&7;
						Ka=Aa[1]&0xff;
						if((Ha>>6)==3) {
							Ia=Ha&7;
							Xb(Ia,nc(Ma,Aa[Ia],Ka));
						}
						else {
							ia=Qb(Ha);
							ja=pb();
							ja=nc(Ma,ja,Ka);
							vb(ja);
						}
						break Gd;
					case 0x198:
						Xb(0,(Aa[0]<<24)>>24);
						break Gd;
					case 0x199:
						Xb(2,(Aa[0]<<16)>>31);
						break Gd;
					case 0x190:
						break Gd;
					case 0x150:
					case 0x151:
					case 0x152:
					case 0x153:
					case 0x154:
					case 0x155:
					case 0x156:
					case 0x157:
						wd(Aa[b&7]);
						break Gd;
					case 0x158:
					case 0x159:
					case 0x15a:
					case 0x15b:
					case 0x15c:
					case 0x15d:
					case 0x15e:
					case 0x15f:
						ja=zd();
						Ad();
						Xb(b&7,ja);
						break Gd;
					case 0x160:
						Kf();
						break Gd;
					case 0x161:
						Mf();
						break Gd;
					case 0x18f:
						Ha=Wa[Lb++];;
						if((Ha>>6)==3) {
							ja=zd();
							Ad();
							Xb(Ha&7,ja);
						}
						else {
							ja=zd();
							Ka=Aa[4];
							Ad();
							La=Aa[4];
							ia=Qb(Ha);
							Aa[4]=Ka;
							vb(ja);
							Aa[4]=La;
						}
						break Gd;
					case 0x168:
						ja=Pb();
						wd(ja);
						break Gd;
					case 0x16a:
						ja=((Wa[Lb++]<<24)>>24);;
						wd(ja);
						break Gd;
					case 0x1c8:
						Qf();
						break Gd;
					case 0x1c9:
						Of();
						break Gd;
					case 0x106:
					case 0x10e:
					case 0x116:
					case 0x11e:
						wd(za.segs[(b>>3)&3].selector);
						break Gd;
					case 0x107:
					case 0x117:
					case 0x11f:
						Je((b>>3)&3,zd());
						Ad();
						break Gd;
					case 0x18d:
						Ha=Wa[Lb++];;
						if((Ha>>6)==3)Ec(6);
						Ga=(Ga&~0x000f)|(6+1);
						Xb((Ha>>3)&7,Qb(Ha));
						break Gd;
					case 0x1ff:
						Ha=Wa[Lb++];;
						Ma=(Ha>>3)&7;
						switch(Ma) {
						case 0:
							if((Ha>>6)==3) {
								Ia=Ha&7;
								Xb(Ia,fc(Aa[Ia]));
							}
							else {
								ia=Qb(Ha);
								ja=pb();
								ja=fc(ja);
								vb(ja);
							}
							break;
						case 1:
							if((Ha>>6)==3) {
								Ia=Ha&7;
								Xb(Ia,gc(Aa[Ia]));
							}
							else {
								ia=Qb(Ha);
								ja=pb();
								ja=gc(ja);
								vb(ja);
							}
							break;
						case 2:
							if((Ha>>6)==3) {
								ja=Aa[Ha&7]&0xffff;
							}
							else {
								ia=Qb(Ha);
								ja=jb();
							}
							wd((Kb+Lb-Nb));
							Kb=ja,Lb=Nb=0;
							break;
						case 4:
							if((Ha>>6)==3) {
								ja=Aa[Ha&7]&0xffff;
							}
							else {
								ia=Qb(Ha);
								ja=jb();
							}
							Kb=ja,Lb=Nb=0;
							break;
						case 6:
							if((Ha>>6)==3) {
								ja=Aa[Ha&7];
							}
							else {
								ia=Qb(Ha);
								ja=jb();
							}
							wd(ja);
							break;
						case 3:
						case 5:
							if((Ha>>6)==3)Ec(6);
							ia=Qb(Ha);
							ja=jb();
							ia=(ia+2)>>0;
							Ka=jb();
							if(Ma==3)af(0,Ka,ja,(Kb+Lb-Nb));
							else Pe(Ka,ja);
							break;
						default:
							Ec(6);
						}
						break Gd;
					case 0x1eb:
						ja=((Wa[Lb++]<<24)>>24);;
						Kb=(Kb+Lb-Nb+ja)&0xffff,Lb=Nb=0;
						break Gd;
					case 0x1e9:
						ja=Pb();
						Kb=(Kb+Lb-Nb+ja)&0xffff,Lb=Nb=0;
						break Gd;
					case 0x170:
					case 0x171:
					case 0x172:
					case 0x173:
					case 0x174:
					case 0x175:
					case 0x176:
					case 0x177:
					case 0x178:
					case 0x179:
					case 0x17a:
					case 0x17b:
					case 0x17c:
					case 0x17d:
					case 0x17e:
					case 0x17f:
						ja=((Wa[Lb++]<<24)>>24);;
						Ka=gd(b&0xf);
						if(Ka)Kb=(Kb+Lb-Nb+ja)&0xffff,Lb=Nb=0;
						break Gd;
					case 0x1c2:
						Ka=(Pb()<<16)>>16;
						ja=zd();
						Aa[4]=(Aa[4]&~Sa)|((Aa[4]+2+Ka)&Sa);
						Kb=ja,Lb=Nb=0;
						break Gd;
					case 0x1c3:
						ja=zd();
						Ad();
						Kb=ja,Lb=Nb=0;
						break Gd;
					case 0x1e8:
						ja=Pb();
						wd((Kb+Lb-Nb));
						Kb=(Kb+Lb-Nb+ja)&0xffff,Lb=Nb=0;
						break Gd;
					case 0x162:
						Jf();
						break Gd;
					case 0x1a5:
						mg();
						break Gd;
					case 0x1a7:
						og();
						break Gd;
					case 0x1ad:
						pg();
						break Gd;
					case 0x1af:
						qg();
						break Gd;
					case 0x1ab:
						ng();
						break Gd;
					case 0x16d:
						kg();
						{
							if(za.hard_irq!=0&&(za.eflags&0x00000200))break Dg;
						};
						break Gd;
					case 0x16f:
						lg();
						{
							if(za.hard_irq!=0&&(za.eflags&0x00000200))break Dg;
						};
						break Gd;
					case 0x1e5:
						Va=(za.eflags>>12)&3;
						if(za.cpl>Va)Ec(13);
						ja=Wa[Lb++];;
						Xb(0,za.ld16_port(ja));
						{
							if(za.hard_irq!=0&&(za.eflags&0x00000200))break Dg;
						};
						break Gd;
					case 0x1e7:
						Va=(za.eflags>>12)&3;
						if(za.cpl>Va)Ec(13);
						ja=Wa[Lb++];;
						za.st16_port(ja,Aa[0]&0xffff);
						{
							if(za.hard_irq!=0&&(za.eflags&0x00000200))break Dg;
						};
						break Gd;
					case 0x1ed:
						Va=(za.eflags>>12)&3;
						if(za.cpl>Va)Ec(13);
						Xb(0,za.ld16_port(Aa[2]&0xffff));
						{
							if(za.hard_irq!=0&&(za.eflags&0x00000200))break Dg;
						};
						break Gd;
					case 0x1ef:
						Va=(za.eflags>>12)&3;
						if(za.cpl>Va)Ec(13);
						za.st16_port(Aa[2]&0xffff,Aa[0]&0xffff);
						{
							if(za.hard_irq!=0&&(za.eflags&0x00000200))break Dg;
						};
						break Gd;
					case 0x166:
					case 0x167:
					case 0x1f0:
					case 0x1f2:
					case 0x1f3:
					case 0x126:
					case 0x12e:
					case 0x136:
					case 0x13e:
					case 0x164:
					case 0x165:
					case 0x100:
					case 0x108:
					case 0x110:
					case 0x118:
					case 0x120:
					case 0x128:
					case 0x130:
					case 0x138:
					case 0x102:
					case 0x10a:
					case 0x112:
					case 0x11a:
					case 0x122:
					case 0x12a:
					case 0x132:
					case 0x13a:
					case 0x104:
					case 0x10c:
					case 0x114:
					case 0x11c:
					case 0x124:
					case 0x12c:
					case 0x134:
					case 0x13c:
					case 0x1a0:
					case 0x1a2:
					case 0x1d8:
					case 0x1d9:
					case 0x1da:
					case 0x1db:
					case 0x1dc:
					case 0x1dd:
					case 0x1de:
					case 0x1df:
					case 0x184:
					case 0x1a8:
					case 0x1f6:
					case 0x1c0:
					case 0x1d0:
					case 0x1d2:
					case 0x1fe:
					case 0x1cd:
					case 0x1ce:
					case 0x1f5:
					case 0x1f8:
					case 0x1f9:
					case 0x1fc:
					case 0x1fd:
					case 0x1fa:
					case 0x1fb:
					case 0x19e:
					case 0x19f:
					case 0x1f4:
					case 0x127:
					case 0x12f:
					case 0x137:
					case 0x13f:
					case 0x1d4:
					case 0x1d5:
					case 0x16c:
					case 0x16e:
					case 0x1a4:
					case 0x1a6:
					case 0x1aa:
					case 0x1ac:
					case 0x1ae:
					case 0x180:
					case 0x182:
					case 0x186:
					case 0x188:
					case 0x18a:
					case 0x18c:
					case 0x18e:
					case 0x19b:
					case 0x1b0:
					case 0x1b1:
					case 0x1b2:
					case 0x1b3:
					case 0x1b4:
					case 0x1b5:
					case 0x1b6:
					case 0x1b7:
					case 0x1c6:
					case 0x1cc:
					case 0x1d7:
					case 0x1e4:
					case 0x1e6:
					case 0x1ec:
					case 0x1ee:
					case 0x1cf:
					case 0x1ca:
					case 0x1cb:
					case 0x19a:
					case 0x19c:
					case 0x19d:
					case 0x1ea:
					case 0x1e0:
					case 0x1e1:
					case 0x1e2:
					case 0x1e3:
						b&=0xff;
						break;
					case 0x163:
					case 0x1d6:
					case 0x1f1:
					default:
						Ec(6);
					case 0x10f:
						b=Wa[Lb++];;
						b|=0x0100;
						switch(b) {
						case 0x180:
						case 0x181:
						case 0x182:
						case 0x183:
						case 0x184:
						case 0x185:
						case 0x186:
						case 0x187:
						case 0x188:
						case 0x189:
						case 0x18a:
						case 0x18b:
						case 0x18c:
						case 0x18d:
						case 0x18e:
						case 0x18f:
							ja=Pb();
							if(gd(b&0xf))Kb=(Kb+Lb-Nb+ja)&0xffff,Lb=Nb=0;
							break Gd;
						case 0x140:
						case 0x141:
						case 0x142:
						case 0x143:
						case 0x144:
						case 0x145:
						case 0x146:
						case 0x147:
						case 0x148:
						case 0x149:
						case 0x14a:
						case 0x14b:
						case 0x14c:
						case 0x14d:
						case 0x14e:
						case 0x14f:
							Ha=Wa[Lb++];;
							if((Ha>>6)==3) {
								ja=Aa[Ha&7];
							}
							else {
								ia=Qb(Ha);
								ja=jb();
							}
							if(gd(b&0xf))Xb((Ha>>3)&7,ja);
							break Gd;
						case 0x1b6:
							Ha=Wa[Lb++];;
							Ja=(Ha>>3)&7;
							if((Ha>>6)==3) {
								Ia=Ha&7;
								ja=(Aa[Ia&3]>>((Ia&4)<<1))&0xff;
							}
							else {
								ia=Qb(Ha);
								ja=hb();
							}
							Xb(Ja,ja);
							break Gd;
						case 0x1be:
							Ha=Wa[Lb++];;
							Ja=(Ha>>3)&7;
							if((Ha>>6)==3) {
								Ia=Ha&7;
								ja=(Aa[Ia&3]>>((Ia&4)<<1));
							}
							else {
								ia=Qb(Ha);
								ja=hb();
							}
							Xb(Ja,(((ja)<<24)>>24));
							break Gd;
						case 0x1af:
							Ha=Wa[Lb++];;
							Ja=(Ha>>3)&7;
							if((Ha>>6)==3) {
								Ka=Aa[Ha&7];
							}
							else {
								ia=Qb(Ha);
								Ka=jb();
							}
							Xb(Ja,Sc(Aa[Ja],Ka));
							break Gd;
						case 0x1c1:
							Ha=Wa[Lb++];;
							Ja=(Ha>>3)&7;
							if((Ha>>6)==3) {
								Ia=Ha&7;
								ja=Aa[Ia];
								Ka=ec(0,ja,Aa[Ja]);
								Xb(Ja,ja);
								Xb(Ia,Ka);
							}
							else {
								ia=Qb(Ha);
								ja=pb();
								Ka=ec(0,ja,Aa[Ja]);
								vb(Ka);
								Xb(Ja,ja);
							}
							break Gd;
						case 0x1a0:
						case 0x1a8:
							wd(za.segs[(b>>3)&7].selector);
							break Gd;
						case 0x1a1:
						case 0x1a9:
							Je((b>>3)&7,zd());
							Ad();
							break Gd;
						case 0x1b2:
						case 0x1b4:
						case 0x1b5:
							Wf(b&7);
							break Gd;
						case 0x1a4:
						case 0x1ac:
							Ha=Wa[Lb++];;
							Ka=Aa[(Ha>>3)&7];
							Ma=(b>>3)&1;
							if((Ha>>6)==3) {
								La=Wa[Lb++];;
								Ia=Ha&7;
								Xb(Ia,pc(Ma,Aa[Ia],Ka,La));
							}
							else {
								ia=Qb(Ha);
								La=Wa[Lb++];;
								ja=pb();
								ja=pc(Ma,ja,Ka,La);
								vb(ja);
							}
							break Gd;
						case 0x1a5:
						case 0x1ad:
							Ha=Wa[Lb++];;
							Ka=Aa[(Ha>>3)&7];
							La=Aa[1];
							Ma=(b>>3)&1;
							if((Ha>>6)==3) {
								Ia=Ha&7;
								Xb(Ia,pc(Ma,Aa[Ia],Ka,La));
							}
							else {
								ia=Qb(Ha);
								ja=pb();
								ja=pc(Ma,ja,Ka,La);
								vb(ja);
							}
							break Gd;
						case 0x1ba:
							Ha=Wa[Lb++];;
							Ma=(Ha>>3)&7;
							switch(Ma) {
							case 4:
								if((Ha>>6)==3) {
									ja=Aa[Ha&7];
									Ka=Wa[Lb++];;
								}
								else {
									ia=Qb(Ha);
									Ka=Wa[Lb++];;
									ja=jb();
								}
								uc(ja,Ka);
								break;
							case 5:
							case 6:
							case 7:
								if((Ha>>6)==3) {
									Ia=Ha&7;
									Ka=Wa[Lb++];;
									Aa[Ia]=wc(Ma&3,Aa[Ia],Ka);
								}
								else {
									ia=Qb(Ha);
									Ka=Wa[Lb++];;
									ja=pb();
									ja=wc(Ma&3,ja,Ka);
									vb(ja);
								}
								break;
							default:
								Ec(6);
							}
							break Gd;
						case 0x1a3:
							Ha=Wa[Lb++];;
							Ka=Aa[(Ha>>3)&7];
							if((Ha>>6)==3) {
								ja=Aa[Ha&7];
							}
							else {
								ia=Qb(Ha);
								ia=(ia+(((Ka&0xffff)>>4)<<1))>>0;
								ja=jb();
							}
							uc(ja,Ka);
							break Gd;
						case 0x1ab:
						case 0x1b3:
						case 0x1bb:
							Ha=Wa[Lb++];;
							Ka=Aa[(Ha>>3)&7];
							Ma=(b>>3)&3;
							if((Ha>>6)==3) {
								Ia=Ha&7;
								Xb(Ia,wc(Ma,Aa[Ia],Ka));
							}
							else {
								ia=Qb(Ha);
								ia=(ia+(((Ka&0xffff)>>4)<<1))>>0;
								ja=pb();
								ja=wc(Ma,ja,Ka);
								vb(ja);
							}
							break Gd;
						case 0x1bc:
						case 0x1bd:
							Ha=Wa[Lb++];;
							Ja=(Ha>>3)&7;
							if((Ha>>6)==3) {
								Ka=Aa[Ha&7];
							}
							else {
								ia=Qb(Ha);
								Ka=jb();
							}
							ja=Aa[Ja];
							if(b&1)ja=Bc(ja,Ka);
							else ja=zc(ja,Ka);
							Xb(Ja,ja);
							break Gd;
						case 0x1b1:
							Ha=Wa[Lb++];;
							Ja=(Ha>>3)&7;
							if((Ha>>6)==3) {
								Ia=Ha&7;
								ja=Aa[Ia];
								Ka=ec(5,Aa[0],ja);
								if(Ka==0) {
									Xb(Ia,Aa[Ja]);
								}
								else {
									Xb(0,ja);
								}
							}
							else {
								ia=Qb(Ha);
								ja=pb();
								Ka=ec(5,Aa[0],ja);
								if(Ka==0) {
									vb(Aa[Ja]);
								}
								else {
									Xb(0,ja);
								}
							}
							break Gd;
						case 0x100:
						case 0x101:
						case 0x102:
						case 0x103:
						case 0x120:
						case 0x122:
						case 0x106:
						case 0x123:
						case 0x1a2:
						case 0x131:
						case 0x190:
						case 0x191:
						case 0x192:
						case 0x193:
						case 0x194:
						case 0x195:
						case 0x196:
						case 0x197:
						case 0x198:
						case 0x199:
						case 0x19a:
						case 0x19b:
						case 0x19c:
						case 0x19d:
						case 0x19e:
						case 0x19f:
						case 0x1b0:
							b=0x0f;
							Lb--;
							break;
						case 0x104:
						case 0x105:
						case 0x107:
						case 0x108:
						case 0x109:
						case 0x10a:
						case 0x10b:
						case 0x10c:
						case 0x10d:
						case 0x10e:
						case 0x10f:
						case 0x110:
						case 0x111:
						case 0x112:
						case 0x113:
						case 0x114:
						case 0x115:
						case 0x116:
						case 0x117:
						case 0x118:
						case 0x119:
						case 0x11a:
						case 0x11b:
						case 0x11c:
						case 0x11d:
						case 0x11e:
						case 0x11f:
						case 0x121:
						case 0x124:
						case 0x125:
						case 0x126:
						case 0x127:
						case 0x128:
						case 0x129:
						case 0x12a:
						case 0x12b:
						case 0x12c:
						case 0x12d:
						case 0x12e:
						case 0x12f:
						case 0x130:
						case 0x132:
						case 0x133:
						case 0x134:
						case 0x135:
						case 0x136:
						case 0x137:
						case 0x138:
						case 0x139:
						case 0x13a:
						case 0x13b:
						case 0x13c:
						case 0x13d:
						case 0x13e:
						case 0x13f:
						case 0x150:
						case 0x151:
						case 0x152:
						case 0x153:
						case 0x154:
						case 0x155:
						case 0x156:
						case 0x157:
						case 0x158:
						case 0x159:
						case 0x15a:
						case 0x15b:
						case 0x15c:
						case 0x15d:
						case 0x15e:
						case 0x15f:
						case 0x160:
						case 0x161:
						case 0x162:
						case 0x163:
						case 0x164:
						case 0x165:
						case 0x166:
						case 0x167:
						case 0x168:
						case 0x169:
						case 0x16a:
						case 0x16b:
						case 0x16c:
						case 0x16d:
						case 0x16e:
						case 0x16f:
						case 0x170:
						case 0x171:
						case 0x172:
						case 0x173:
						case 0x174:
						case 0x175:
						case 0x176:
						case 0x177:
						case 0x178:
						case 0x179:
						case 0x17a:
						case 0x17b:
						case 0x17c:
						case 0x17d:
						case 0x17e:
						case 0x17f:
						case 0x1a6:
						case 0x1a7:
						case 0x1aa:
						case 0x1ae:
						case 0x1b7:
						case 0x1b8:
						case 0x1b9:
						case 0x1bf:
						case 0x1c0:
						default:
							Ec(6);
						}
						break;
					}
				}
			}
		} while(--Na);
		print("cycles increment in exec_internal = "+(xa-Na));
		this.cycle_count+=(xa-Na);
		this.eip=(Kb+Lb-Nb);
		this.cc_src=Ba;
		this.cc_dst=Ca;
		this.cc_op=Da;
		this.cc_op2=Ea;
		this.cc_dst2=Fa;
		return Oa;
	};

}

function Mg(a) {
    return((a/10)<<4)|(a%10);
}

function Ng(n) {
    var fa,i;
    fa=new Array();
    for(i=0; i<n; i++)fa[i]=0;
    return fa;
}

function Og(Pg) {
	this.ioport_write=function(ia,Lg) {
		if(ia==0x70) {
			this.cmos_index=Lg&0x7f;
		}
	};
	this.ioport_read=function(ia) {
		var Rg;
		if(ia==0x70) {
			return 0xff;
		}
		else {
			Rg=this.cmos_data[this.cmos_index];
			if(this.cmos_index==10)this.cmos_data[10]^=0x80;
			else if(this.cmos_index==12)this.cmos_data[12]=0x00;
			return Rg;
		}
	};
	
	var Qg,d;
    Qg=Ng(128);
    this.cmos_data=Qg;
    this.cmos_index=0;
    //d=new Date();
    Qg[0]=Mg(0);//d.getUTCSeconds());
    Qg[2]=Mg(0);//d.getUTCMinutes());
    Qg[4]=Mg(0);//d.getUTCHours());
    Qg[6]=Mg(1);//d.getUTCDay());
    Qg[7]=Mg(1);//d.getUTCDate());
    Qg[8]=Mg(1);//d.getUTCMonth()+1);
    Qg[9]=Mg(2017);//d.getUTCFullYear()%100);
    Qg[10]=0x26;
    Qg[11]=0x02;
    Qg[12]=0x00;
    Qg[13]=0x80;
    Qg[0x14]=0x02;
    Pg.register_ioport_write(0x70,2,1,this.ioport_write.bind(this));
    Pg.register_ioport_read(0x70,2,1,this.ioport_read.bind(this));
}

function Sg(Pg,ag) {
	this.reset=function() {
		this.last_irr=0;
		this.irr=0;
		this.imr=0;
		this.isr=0;
		this.priority_add=0;
		this.irq_base=0;
		this.read_reg_select=0;
		this.special_mask=0;
		this.init_state=0;
		this.auto_eoi=0;
		this.rotate_on_autoeoi=0;
		this.init4=0;
		this.elcr=0;
		this.elcr_mask=0;
	};
	this.set_irq1=function(Tg,Rf) {
		var xc;
		xc=1<<Tg;
		if(Rf) {
			if((this.last_irr&xc)==0)this.irr|=xc;
			this.last_irr|=xc;
		}
		else {
			this.last_irr&=~xc;
		}
	};
	this.get_priority=function(xc) {
		var Ug;
		if(xc==0)return-1;
		Ug=7;
		while((xc&(1<<((Ug+this.priority_add)&7)))==0)Ug--;
		return Ug;
	};
	this.get_irq=function() {
		var xc,Vg,Ug;
		xc=this.irr&~this.imr;
		Ug=this.get_priority(xc);
		if(Ug<0)return-1;
		Vg=this.get_priority(this.isr);
		if(Ug>Vg) {
			return Ug;
		}
		else {
			return-1;
		}
	};
	this.intack=function(Tg) {
		if(this.auto_eoi) {
			if(this.rotate_on_auto_eoi)this.priority_add=(Tg+1)&7;
		}
		else {
			this.isr|=(1<<Tg);
		}
		if(!(this.elcr&(1<<Tg)))this.irr&=~(1<<Tg);
	};
	this.ioport_write=function(ia,ja) {
		var Ug;
		ia&=1;
		if(ia==0) {
			if(ja&0x10) {
				this.reset();
				this.init_state=1;
				this.init4=ja&1;
				if(ja&0x02)throw"single mode not supported";
				if(ja&0x08)throw"level sensitive irq not supported";
			}
			else if(ja&0x08) {
				if(ja&0x02)this.read_reg_select=ja&1;
				if(ja&0x40)this.special_mask=(ja>>5)&1;
			}
			else {
				switch(ja) {
				case 0x00:
				case 0x80:
					this.rotate_on_autoeoi=ja>>7;
					break;
				case 0x20:
				case 0xa0:
					Ug=this.get_priority(this.isr);
					if(Ug>=0) {
						this.isr&=~(1<<((Ug+this.priority_add)&7));
					}
					if(ja==0xa0)this.priority_add=(this.priority_add+1)&7;
					break;
				case 0x60:
				case 0x61:
				case 0x62:
				case 0x63:
				case 0x64:
				case 0x65:
				case 0x66:
				case 0x67:
					Ug=ja&7;
					this.isr&=~(1<<Ug);
					break;
				case 0xc0:
				case 0xc1:
				case 0xc2:
				case 0xc3:
				case 0xc4:
				case 0xc5:
				case 0xc6:
				case 0xc7:
					this.priority_add=(ja+1)&7;
					break;
				case 0xe0:
				case 0xe1:
				case 0xe2:
				case 0xe3:
				case 0xe4:
				case 0xe5:
				case 0xe6:
				case 0xe7:
					Ug=ja&7;
					this.isr&=~(1<<Ug);
					this.priority_add=(Ug+1)&7;
					break;
				}
			}
		}
		else {
			switch(this.init_state) {
			case 0:
				this.imr=ja;
				this.update_irq();
				break;
			case 1:
				this.irq_base=ja&0xf8;
				this.init_state=2;
				break;
			case 2:
				if(this.init4) {
					this.init_state=3;
				}
				else {
					this.init_state=0;
				}
				break;
			case 3:
				this.auto_eoi=(ja>>1)&1;
				this.init_state=0;
				break;
			}
		}
	};
	this.ioport_read=function(Wg) {
		var ia,Rg;
		ia=Wg&1;
		if(ia==0) {
			if(this.read_reg_select)Rg=this.isr;
			else Rg=this.irr;
		}
		else {
			Rg=this.imr;
		}
		return Rg;
	};
	
	Pg.register_ioport_write(ag,2,1,this.ioport_write.bind(this));
    Pg.register_ioport_read(ag,2,1,this.ioport_read.bind(this));
    this.reset();
}

function Xg(Pg,Yg,Wg,Zg) {
	this.update_irq=function() {
		var ah,Tg;
		ah=this.pics[1].get_irq();
		if(ah>=0) {
			this.pics[0].set_irq1(2,1);
			this.pics[0].set_irq1(2,0);
		}
		Tg=this.pics[0].get_irq();
		if(Tg>=0) {
			this.cpu_set_irq(1);
		}
		else {
			this.cpu_set_irq(0);
		}
	};
	this.set_irq=function(Tg,Rf) {
		this.pics[Tg>>3].set_irq1(Tg&7,Rf);
		this.update_irq();
	};
	this.get_hard_intno=function() {
		var Tg,ah,intno;
		Tg=this.pics[0].get_irq();
		if(Tg>=0) {
			this.pics[0].intack(Tg);
			if(Tg==2) {
				ah=this.pics[1].get_irq();
				if(ah>=0) {
					this.pics[1].intack(ah);
				}
				else {
					ah=7;
				}
				intno=this.pics[1].irq_base+ah;
				Tg=ah+8;
			}
			else {
				intno=this.pics[0].irq_base+Tg;
			}
		}
		else {
			Tg=7;
			intno=this.pics[0].irq_base+Tg;
		}
		this.update_irq();
		return intno;
	};
	
	this.pics=new Array();
    this.pics[0]=new Sg(Pg,Yg);
    this.pics[1]=new Sg(Pg,Wg);
    this.pics[0].elcr_mask=0xf8;
    this.pics[1].elcr_mask=0xde;
    this.irq_requested=0;
    this.cpu_set_irq=Zg;
    this.pics[0].update_irq=this.update_irq.bind(this);
    this.pics[1].update_irq=this.update_irq.bind(this);
}

function bh(Pg,ch,dh) {
	this.ioport_write=function(ia,ja) {
		var jh,kh,s;
		ia&=3;
		if(ia==3) {
			jh=ja>>6;
			if(jh==3)return;
			s=this.pit_channels[jh];
			kh=(ja>>4)&3;
			switch(kh) {
			case 0:
				s.latched_count=s.pit_get_count();
				s.rw_state=4;
				break;
			default:
				s.mode=(ja>>1)&7;
				s.bcd=ja&1;
				s.rw_state=kh-1+0;
				break;
			}
		}
		else {
			s=this.pit_channels[ia];
			switch(s.rw_state) {
			case 0:
				s.pit_load_count(ja);
				break;
			case 1:
				s.pit_load_count(ja<<8);
				break;
			case 2:
			case 3:
				if(s.rw_state&1) {
					s.pit_load_count((s.latched_count&0xff)|(ja<<8));
				}
				else {
					s.latched_count=ja;
				}
				s.rw_state^=1;
				break;
			}
		}
	};
	this.ioport_read=function(ia) {
		var Rg,pa,s;
		ia&=3;
		s=this.pit_channels[ia];
		switch(s.rw_state) {
		case 0:
		case 1:
		case 2:
		case 3:
			pa=s.pit_get_count();
			if(s.rw_state&1)Rg=(pa>>8)&0xff;
			else Rg=pa&0xff;
			if(s.rw_state&2)s.rw_state^=1;
			break;
		default:
		case 4:
		case 5:
			if(s.rw_state&1)Rg=s.latched_count>>8;
			else Rg=s.latched_count&0xff;
			s.rw_state^=1;
			break;
		}
		return Rg;
	};
	this.speaker_ioport_write=function(ia,ja) {
		this.speaker_data_on=(ja>>1)&1;
		this.pit_channels[2].gate=ja&1;
	};
	this.speaker_ioport_read=function(ia) {
		var gh,s,ja;
		s=this.pit_channels[2];
		gh=s.pit_get_out();
		ja=(this.speaker_data_on<<1)|s.gate|(gh<<5);
		return ja;
	};
	this.update_irq=function() {
		this.set_irq(1);
		this.set_irq(0);
	};
	
	var s,i;
    this.pit_channels=new Array();
    for(i=0; i<3; i++) {
        s=new eh(dh);
        this.pit_channels[i]=s;
        s.mode=3;
        s.gate=(i!=2)>>0;
        s.pit_load_count(0);
    }
    this.speaker_data_on=0;
    this.set_irq=ch;
    Pg.register_ioport_write(0x40,4,1,this.ioport_write.bind(this));
    Pg.register_ioport_read(0x40,3,1,this.ioport_read.bind(this));
    Pg.register_ioport_read(0x61,1,1,this.speaker_ioport_read.bind(this));
    Pg.register_ioport_write(0x61,1,1,this.speaker_ioport_write.bind(this));
}

function eh(dh) {
	this.get_time=function() {
		return Math.floor(this.get_ticks()*this.pit_time_unit);
	};
	this.pit_get_count=function() {
		var d,fh;
		d=this.get_time()-this.count_load_time;
		switch(this.mode) {
		case 0:
		case 1:
		case 4:
		case 5:
			fh=(this.count-d)&0xffff;
			break;
		default:
			fh=this.count-(d%this.count);
			break;
		}
		return fh;
	};
	this.pit_get_out=function() {
		var d,gh;
		d=this.get_time()-this.count_load_time;
		switch(this.mode) {
		default:
		case 0:
			gh=(d>=this.count)>>0;
			break;
		case 1:
			gh=(d<this.count)>>0;
			break;
		case 2:
			if((d%this.count)==0&&d!=0)gh=1;
			else gh=0;
			break;
		case 3:
			gh=((d%this.count)<(this.count>>1))>>0;
			break;
		case 4:
		case 5:
			gh=(d==this.count)>>0;
			break;
		}
		return gh;
	};
	this.get_next_transition_time=function() {
		var d,hh,base,ih;
		d=this.get_time()-this.count_load_time;
		switch(this.mode) {
		default:
		case 0:
		case 1:
			if(d<this.count)hh=this.count;
			else return-1;
			break;
		case 2:
			base=(d/this.count)*this.count;
			if((d-base)==0&&d!=0)hh=base+this.count;
			else hh=base+this.count+1;
			break;
		case 3:
			base=(d/this.count)*this.count;
			ih=((this.count+1)>>1);
			if((d-base)<ih)hh=base+ih;
			else hh=base+this.count;
			break;
		case 4:
		case 5:
			if(d<this.count)hh=this.count;
			else if(d==this.count)hh=this.count+1;
			else return-1;
			break;
		}
		hh=this.count_load_time+hh;
		return hh;
	};
	this.pit_load_count=function(ja) {
		if(ja==0)ja=0x10000;
		this.count_load_time=this.get_time();
		this.count=ja;
	};
	
	this.count=0;
    this.latched_count=0;
    this.rw_state=0;
    this.mode=0;
    this.bcd=0;
    this.gate=0;
    this.count_load_time=0;
    this.get_ticks=dh;
    this.pit_time_unit=1193182/2000000;
}

function lh(Pg,ia,mh,nh) {
	this.update_irq=function() {
		if((this.lsr&0x01)&&(this.ier&0x01)) {
			this.iir=0x04;
		}
		else if((this.lsr&0x20)&&(this.ier&0x02)) {
			this.iir=0x02;
		}
		else {
			this.iir=0x01;
		}
		if(this.iir!=0x01) {
			this.set_irq_func(1);
		}
		else {
			this.set_irq_func(0);
		}
	};
	this.write_tx_fifo=function() {
		if(this.tx_fifo!="") {
			this.write_func(this.tx_fifo);
			this.tx_fifo="";
			this.lsr|=0x20;
			this.lsr|=0x40;
			this.update_irq();
		}
	};
	this.ioport_write=function(ia,ja) {
		ia&=7;
		switch(ia) {
		default:
		case 0:
			if(this.lcr&0x80) {
				this.divider=(this.divider&0xff00)|ja;
			}
			else {
				if(this.fcr&0x01) {
					this.tx_fifo+=String.fromCharCode(ja);
					this.lsr&=~0x20;
					this.update_irq();
					if(this.tx_fifo.length>=16) {
						this.write_tx_fifo();
					}
				}
				else {
					this.lsr&=~0x20;
					this.update_irq();
					this.write_func(String.fromCharCode(ja));
					this.lsr|=0x20;
					this.lsr|=0x40;
					this.update_irq();
				}
			}
			break;
		case 1:
			if(this.lcr&0x80) {
				this.divider=(this.divider&0x00ff)|(ja<<8);
			}
			else {
				this.ier=ja;
				this.update_irq();
			}
			break;
		case 2:
			if((this.fcr^ja)&0x01) {
				ja|=0x04|0x02;
			}
			if(ja&0x04)this.tx_fifo="";
			if(ja&0x02)this.rx_fifo="";
			this.fcr=ja&0x01;
			break;
		case 3:
			this.lcr=ja;
			break;
		case 4:
			this.mcr=ja;
			break;
		case 5:
			break;
		case 6:
			this.msr=ja;
			break;
		case 7:
			this.scr=ja;
			break;
		}
	};
	this.ioport_read=function(ia) {
		var Rg;
		ia&=7;
		switch(ia) {
		default:
		case 0:
			if(this.lcr&0x80) {
				Rg=this.divider&0xff;
			}
			else {
				Rg=this.rbr;
				this.lsr&=~(0x01|0x10);
				this.update_irq();
				this.send_char_from_fifo();
			}
			break;
		case 1:
			if(this.lcr&0x80) {
				Rg=(this.divider>>8)&0xff;
			}
			else {
				Rg=this.ier;
			}
			break;
		case 2:
			Rg=this.iir;
			if(this.fcr&0x01)Rg|=0xC0;
			break;
		case 3:
			Rg=this.lcr;
			break;
		case 4:
			Rg=this.mcr;
			break;
		case 5:
			Rg=this.lsr;
			break;
		case 6:
			Rg=this.msr;
			break;
		case 7:
			Rg=this.scr;
			break;
		}
		return Rg;
	};
	this.send_break=function() {
		this.rbr=0;
		this.lsr|=0x10|0x01;
		this.update_irq();
	};
	this.send_char=function(oh) {
		this.rbr=oh;
		this.lsr|=0x01;
		this.update_irq();
	};
	this.send_char_from_fifo=function() {
		var ph;
		ph=this.rx_fifo;
		if(ph!=""&&!(this.lsr&0x01)) {
			this.send_char(ph.charCodeAt(0));
			this.rx_fifo=ph.substr(1,ph.length-1);
		}
	};
	this.send_chars=function(qa) {
		this.rx_fifo+=qa;
		this.send_char_from_fifo();
	};
	
	this.divider=0;
    this.rbr=0;
    this.ier=0;
    this.iir=0x01;
    this.lcr=0;
    this.mcr;
    this.lsr=0x40|0x20;
    this.msr=0;
    this.scr=0;
    this.fcr=0;
    this.set_irq_func=mh;
    this.write_func=nh;
    this.tx_fifo="";
    this.rx_fifo="";
    Pg.register_ioport_write(0x3f8,8,1,this.ioport_write.bind(this));
    Pg.register_ioport_read(0x3f8,8,1,this.ioport_read.bind(this));
}

function qh(Pg,rh) {
	this.read_status=function(ia) {
		return 0;
	};
	this.write_command=function(ia,ja) {
		switch(ja) {
		case 0xfe:
			this.reset_request();
			break;
		default:
			break;
		}
	};
	
	Pg.register_ioport_read(0x64,1,1,this.read_status.bind(this));
    Pg.register_ioport_write(0x64,1,1,this.write_command.bind(this));
    this.reset_request=rh;
}

function sh(Pg,ag,th,nh,uh) {
	this.ioport_writeb=function(ia,ja) {
		this.doc_str+=String.fromCharCode(ja);
	};
	this.ioport_readb=function(ia) {
		var c,qa,ja;
		qa=this.doc_str;
		if(this.cur_pos<qa.length) {
			ja=qa.charCodeAt(this.cur_pos)&0xff;
		}
		else {
			ja=0;
		}
		this.cur_pos++;
		return ja;
	};
	this.ioport_writel=function(ia,ja) {
		var qa;
		ia=(ia>>2)&3;
		switch(ia) {
		case 0:
			this.doc_str=this.doc_str.substr(0,ja>>>0);
			break;
		case 1:
			return this.cur_pos=ja>>>0;
		case 2:
			qa=String.fromCharCode(ja&0xff)+String.fromCharCode((ja>>8)&0xff)+String.fromCharCode((ja>>16)&0xff)+String.fromCharCode((ja>>24)&0xff);
			this.doc_str+=qa;
			break;
		case 3:
			this.write_func(this.doc_str);
		}
	};
	this.ioport_readl=function(ia) {
		var ja;
		ia=(ia>>2)&3;
		switch(ia) {
		case 0:
			this.doc_str=this.read_func();
			return this.doc_str.length>>0;
		case 1:
			return this.cur_pos>>0;
		case 2:
			ja=this.ioport_readb(0);
			ja|=this.ioport_readb(0)<<8;
			ja|=this.ioport_readb(0)<<16;
			ja|=this.ioport_readb(0)<<24;
			return ja;
		case 3:
			if(this.get_boot_time)return this.get_boot_time()>>0;
			else return 0;
		}
	};
	
	Pg.register_ioport_read(ag,16,4,this.ioport_readl.bind(this));
    Pg.register_ioport_write(ag,16,4,this.ioport_writel.bind(this));
    Pg.register_ioport_read(ag+8,1,1,this.ioport_readb.bind(this));
    Pg.register_ioport_write(ag+8,1,1,this.ioport_writeb.bind(this));
    this.cur_pos=0;
    this.doc_str="";
    this.read_func=th;
    this.write_func=nh;
    this.get_boot_time=uh;
}

function vh(Gh,Hh) {
	this.identify=function() {
		function wh(xh,v) {
			fa[xh*2]=v&0xff;
			fa[xh*2+1]=(v>>8)&0xff;
		}
		function yh(xh,qa,sg) {
			var i,v;
			for(i=0; i<sg; i++) {
				if(i<qa.length) {
					v=qa.charCodeAt(i)&0xff;
				}
				else {
					v=32;
				}
				fa[xh*2+(i^1)]=v;
			}
		}
		var fa,i,zh;
		fa=this.io_buffer;
		for(i=0; i<512; i++)fa[i]=0;
		wh(0,0x0040);
		wh(1,this.cylinders);
		wh(3,this.heads);
		wh(4,512*this.sectors);
		wh(5,512);
		wh(6,this.sectors);
		wh(20,3);
		wh(21,512);
		wh(22,4);
		yh(27,"JSLinux HARDDISK",40);
		wh(47,0x8000|128);
		wh(48,0);
		wh(49,1<<9);
		wh(51,0x200);
		wh(52,0x200);
		wh(54,this.cylinders);
		wh(55,this.heads);
		wh(56,this.sectors);
		zh=this.cylinders*this.heads*this.sectors;
		wh(57,zh);
		wh(58,zh>>16);
		if(this.mult_sectors)wh(59,0x100|this.mult_sectors);
		wh(60,this.nb_sectors);
		wh(61,this.nb_sectors>>16);
		wh(80,(1<<1)|(1<<2));
		wh(82,(1<<14));
		wh(83,(1<<14));
		wh(84,(1<<14));
		wh(85,(1<<14));
		wh(86,0);
		wh(87,(1<<14));
	};
	this.set_signature=function() {
		this.select&=0xf0;
		this.nsector=1;
		this.sector=1;
		this.lcyl=0;
		this.hcyl=0;
	};
	this.abort_command=function() {
		this.status=0x40|0x01;
		this.error=0x04;
	};
	this.set_irq=function() {
		if(!(this.cmd&0x02)) {
			this.ide_if.set_irq_func(1);
		}
	};
	this.transfer_start=function(dc,Ah) {
		this.end_transfer_func=Ah;
		this.data_index=0;
		this.data_end=dc;
	};
	this.transfer_stop=function() {
		this.end_transfer_func=this.transfer_stop.bind(this);
		this.data_index=0;
		this.data_end=0;
	};
	this.get_sector=function() {
		var Bh;
		if(this.select&0x40) {
			Bh=((this.select&0x0f)<<24)|(this.hcyl<<16)|(this.lcyl<<8)|this.sector;
		}
		else {
			Bh=((this.hcyl<<8)|this.lcyl)*this.heads*this.sectors+(this.select&0x0f)*this.sectors+(this.sector-1);
		}
		return Bh;
	};
	this.set_sector=function(Bh) {
		var Ch,r;
		if(this.select&0x40) {
			this.select=(this.select&0xf0)|((Bh>>24)&0x0f);
			this.hcyl=(Bh>>16)&0xff;
			this.lcyl=(Bh>>8)&0xff;
			this.sector=Bh&0xff;
		}
		else {
			Ch=Bh/(this.heads*this.sectors);
			r=Bh%(this.heads*this.sectors);
			this.hcyl=(Ch>>8)&0xff;
			this.lcyl=Ch&0xff;
			this.select=(this.select&0xf0)|((r/this.sectors)&0x0f);
			this.sector=(r%this.sectors)+1;
		}
	};
	this.sector_read=function() {
		var Bh,n,Rg;
		Bh=this.get_sector();
		n=this.nsector;
		if(n==0)n=256;
		if(n>this.req_nb_sectors)n=this.req_nb_sectors;
		this.io_nb_sectors=n;
		Rg=this.bs.read_async(Bh,this.io_buffer,n,this.sector_read_cb.bind(this));
		if(Rg<0) {
			this.abort_command();
			this.set_irq();
		}
		else if(Rg==0) {
			this.sector_read_cb();
		}
		else {
			this.status=0x40|0x10|0x80;
			this.error=0;
		}
	};
	this.sector_read_cb=function() {
		var n,Dh;
		n=this.io_nb_sectors;
		this.set_sector(this.get_sector()+n);
		this.nsector=(this.nsector-n)&0xff;
		if(this.nsector==0)Dh=this.sector_read_cb_end.bind(this);
		else Dh=this.sector_read.bind(this);
		this.transfer_start(512*n,Dh);
		this.set_irq();
		this.status=0x40|0x10|0x08;
		this.error=0;
	};
	this.sector_read_cb_end=function() {
		this.status=0x40|0x10;
		this.error=0;
		this.transfer_stop();
	};
	this.sector_write_cb1=function() {
		var Bh,Rg;
		this.transfer_stop();
		Bh=this.get_sector();
		Rg=this.bs.write_async(Bh,this.io_buffer,this.io_nb_sectors,this.sector_write_cb2.bind(this));
		if(Rg<0) {
			this.abort_command();
			this.set_irq();
		}
		else if(Rg==0) {
			this.sector_write_cb2();
		}
		else {
			this.status=0x40|0x10|0x80;
		}
	};
	this.sector_write_cb2=function() {
		var n;
		n=this.io_nb_sectors;
		this.set_sector(this.get_sector()+n);
		this.nsector=(this.nsector-n)&0xff;
		if(this.nsector==0) {
			this.status=0x40|0x10;
		}
		else {
			n=this.nsector;
			if(n>this.req_nb_sectors)n=this.req_nb_sectors;
			this.io_nb_sectors=n;
			this.transfer_start(512*n,this.sector_write_cb1.bind(this));
			this.status=0x40|0x10|0x08;
		}
		this.set_irq();
	};
	this.sector_write=function() {
		var n;
		n=this.nsector;
		if(n==0)n=256;
		if(n>this.req_nb_sectors)n=this.req_nb_sectors;
		this.io_nb_sectors=n;
		this.transfer_start(512*n,this.sector_write_cb1.bind(this));
		this.status=0x40|0x10|0x08;
	};
	this.identify_cb=function() {
		this.transfer_stop();
		this.status=0x40;
	};
	this.exec_cmd=function(ja) {
		var n;
		switch(ja) {
		case 0xA1:
		case 0xEC:
			this.identify();
			this.status=0x40|0x10|0x08;
			this.transfer_start(512,this.identify_cb.bind(this));
			this.set_irq();
			break;
		case 0x91:
		case 0x10:
			this.error=0;
			this.status=0x40|0x10;
			this.set_irq();
			break;
		case 0xC6:
			if(this.nsector>128||(this.nsector&(this.nsector-1))!=0) {
				this.abort_command();
			}
			else {
				this.mult_sectors=this.nsector;
				this.status=0x40;
			}
			this.set_irq();
			break;
		case 0x20:
		case 0x21:
			this.req_nb_sectors=1;
			this.sector_read();
			break;
		case 0x30:
		case 0x31:
			this.req_nb_sectors=1;
			this.sector_write();
			break;
		case 0xC4:
			if(!this.mult_sectors) {
				this.abort_command();
				this.set_irq();
			}
			else {
				this.req_nb_sectors=this.mult_sectors;
				this.sector_read();
			}
			break;
		case 0xC5:
			if(!this.mult_sectors) {
				this.abort_command();
				this.set_irq();
			}
			else {
				this.req_nb_sectors=this.mult_sectors;
				this.sector_write();
			}
			break;
		case 0xF8:
			this.set_sector(this.nb_sectors-1);
			this.status=0x40;
			this.set_irq();
			break;
		default:
			this.abort_command();
			this.set_irq();
			break;
		}
	};
	
	var Ih,Jh;
    this.ide_if=Gh;
    this.bs=Hh;
    Jh=Hh.get_sector_count();
    Ih=Jh/(16*63);
    if(Ih>16383)Ih=16383;
    else if(Ih<2)Ih=2;
    this.cylinders=Ih;
    this.heads=16;
    this.sectors=63;
    this.nb_sectors=Jh;
    this.mult_sectors=128;
    this.feature=0;
    this.error=0;
    this.nsector=0;
    this.sector=0;
    this.lcyl=0;
    this.hcyl=0;
    this.select=0xa0;
    this.status=0x40|0x10;
    this.cmd=0;
    this.io_buffer=Ng(128*512+4);
    this.data_index=0;
    this.data_end=0;
    this.end_transfer_func=this.transfer_stop.bind(this);
    this.req_nb_sectors=0;
    this.io_nb_sectors=0;
}

function Eh(Pg,ia,Kh,mh,Lh) {
	this.ioport_write=function(ia,ja) {
		var s=this.cur_drive;
		var Fh;
		ia&=7;
		switch(ia) {
		case 0:
			break;
		case 1:
			if(s) {
				s.feature=ja;
			}
			break;
		case 2:
			if(s) {
				s.nsector=ja;
			}
			break;
		case 3:
			if(s) {
				s.sector=ja;
			}
			break;
		case 4:
			if(s) {
				s.lcyl=ja;
			}
			break;
		case 5:
			if(s) {
				s.hcyl=ja;
			}
			break;
		case 6:
			s=this.cur_drive=this.drives[(ja>>4)&1];
			if(s) {
				s.select=ja;
			}
			break;
		default:
		case 7:
			if(s) {
				s.exec_cmd(ja);
			}
			break;
		}
	};
	this.ioport_read=function(ia) {
		var s=this.cur_drive;
		var Rg;
		ia&=7;
		if(!s) {
			Rg=0xff;
		}
		else {
			switch(ia) {
			case 0:
				Rg=0xff;
				break;
			case 1:
				Rg=s.error;
				break;
			case 2:
				Rg=s.nsector;
				break;
			case 3:
				Rg=s.sector;
				break;
			case 4:
				Rg=s.lcyl;
				break;
			case 5:
				Rg=s.hcyl;
				break;
			case 6:
				Rg=s.select;
				break;
			default:
			case 7:
				Rg=s.status;
				this.set_irq_func(0);
				break;
			}
		}
		return Rg;
	};
	this.status_read=function(ia) {
		var s=this.cur_drive;
		var Rg;
		if(s) {
			Rg=s.status;
		}
		else {
			Rg=0;
		}
		return Rg;
	};
	this.cmd_write=function(ia,ja) {
		var i,s;
		if(!(this.cmd&0x04)&&(ja&0x04)) {
			for(i=0; i<2; i++) {
				s=this.drives[i];
				if(s) {
					s.status=0x80|0x10;
					s.error=0x01;
				}
			}
		}
		else if((this.cmd&0x04)&&!(ja&0x04)) {
			for(i=0; i<2; i++) {
				s=this.drives[i];
				if(s) {
					s.status=0x40|0x10;
					s.set_signature();
				}
			}
		}
		for(i=0; i<2; i++) {
			s=this.drives[i];
			if(s) {
				s.cmd=ja;
			}
		}
	};
	this.data_writew=function(ia,ja) {
		var s=this.cur_drive;
		var p,fa;
		if(!s)return;
		p=s.data_index;
		fa=s.io_buffer;
		fa[p]=ja&0xff;
		fa[p+1]=(ja>>8)&0xff;
		p+=2;
		s.data_index=p;
		if(p>=s.data_end)s.end_transfer_func();
	};
	this.data_readw=function(ia) {
		var s=this.cur_drive;
		var p,Rg,fa;
		if(!s) {
			Rg=0;
		}
		else {
			p=s.data_index;
			fa=s.io_buffer;
			Rg=fa[p]|(fa[p+1]<<8);
			p+=2;
			s.data_index=p;
			if(p>=s.data_end)s.end_transfer_func();
		}
		return Rg;
	};
	this.data_writel=function(ia,ja) {
		var s=this.cur_drive;
		var p,fa;
		if(!s)return;
		p=s.data_index;
		fa=s.io_buffer;
		fa[p]=ja&0xff;
		fa[p+1]=(ja>>8)&0xff;
		fa[p+2]=(ja>>16)&0xff;
		fa[p+3]=(ja>>24)&0xff;
		p+=4;
		s.data_index=p;
		if(p>=s.data_end)s.end_transfer_func();
	};
	this.data_readl=function(ia) {
		var s=this.cur_drive;
		var p,Rg,fa;
		if(!s) {
			Rg=0;
		}
		else {
			p=s.data_index;
			fa=s.io_buffer;
			Rg=fa[p]|(fa[p+1]<<8)|(fa[p+2]<<16)|(fa[p+3]<<24);
			p+=4;
			s.data_index=p;
			if(p>=s.data_end)s.end_transfer_func();
		}
		return Rg;
	};
	
	var i,Mh;
    this.set_irq_func=mh;
    this.drives=[];
    for(i=0; i<2; i++) {
        if(Lh[i]) {
            Mh=new vh(this,Lh[i]);
        }
        else {
            Mh=null;
        }
        this.drives[i]=Mh;
    }
    this.cur_drive=this.drives[0];
    Pg.register_ioport_write(ia,8,1,this.ioport_write.bind(this));
    Pg.register_ioport_read(ia,8,1,this.ioport_read.bind(this));
    if(Kh) {
        Pg.register_ioport_read(Kh,1,1,this.status_read.bind(this));
        Pg.register_ioport_write(Kh,1,1,this.cmd_write.bind(this));
    }
    Pg.register_ioport_write(ia,2,2,this.data_writew.bind(this));
    Pg.register_ioport_read(ia,2,2,this.data_readw.bind(this));
    Pg.register_ioport_write(ia,4,4,this.data_writel.bind(this));
    Pg.register_ioport_read(ia,4,4,this.data_readl.bind(this));
}

function Nh(Ig,Oh,Ph) {
	this.get_sector_count=function() {
		return this.nb_sectors;
	};
	this.get_time=function() {
		//return+new Date();
		return 1513033232713;
	};
	this.get_cached_block=function(Qh) {
		var Rh,i,Sh=this.cache;
		for(i=0; i<Sh.length; i++) {
			Rh=Sh[i];
			if(Rh.block_num==Qh)return Rh;
		}
		return null;
	};
	this.new_cached_block=function(Qh) {
		var Rh,Th,i,j,Uh,Sh=this.cache;
		Rh=new Object();
		Rh.block_num=Qh;
		Rh.time=this.get_time();
		if(Sh.length<this.max_cache_size) {
			j=Sh.length;
		}
		else {
			for(i=0; i<Sh.length; i++) {
				Th=Sh[i];
				if(i==0||Th.time<Uh) {
					Uh=Th.time;
					j=i;
				}
			}
		}
		Sh[j]=Rh;
		return Rh;
	};
	this.get_url=function(Ig,Qh) {
		var p,s;
		s=Qh.toString();
		while(s.length<9)s="0"+s;
		p=Ig.indexOf("%d");
		return Ig.substr(0,p)+s+Ig.substring(p+2,Ig.length);
	};
	this.read_async_cb=function(Vh) {
		var Qh,l,we,Rh,i,Wh,Xh,Yh,Zh;
		var ai,Ig;
		while(this.sector_index<this.sector_count) {
			Qh=Math.floor(this.sector_num/this.block_sectors);
			Rh=this.get_cached_block(Qh);
			if(Rh) {
				we=this.sector_num-Qh*this.block_sectors;
				l=Math.min(this.sector_count-this.sector_index,this.block_sectors-we);
				Wh=l*512;
				Xh=this.sector_buf;
				Yh=this.sector_index*512;
				Zh=Rh.buf;
				ai=we*512;
				for(i=0; i<Wh; i++) {
					Xh[i+Yh]=Zh[i+ai];
				}
				this.sector_index+=l;
				this.sector_num+=l;
			}
			else {
				Ig=this.get_url(this.url,Qh);
				load_binary(Ig,this.read_async_cb2.bind(this));
				return;
			}
		}
		this.sector_buf=null;
		if(!Vh) {
			this.sector_cb(0);
		}
	};
	this.add_block=function(Qh,Lg,sg) {
		var Rh,bi,i;
		Rh=this.new_cached_block(Qh);
		bi=Rh.buf=Ng(this.block_sectors*512);
		if(typeof Lg=="string") {
			for(i=0; i<sg; i++)bi[i]=Lg.charCodeAt(i)&0xff;
		}
		else {
			for(i=0; i<sg; i++)bi[i]=Lg[i];
		}
	};
	this.read_async_cb2=function(Lg,sg) {
		var Qh;
		if(sg<0||sg!=(this.block_sectors*512)) {
			this.sector_cb(-1);
		}
		else {
			Qh=Math.floor(this.sector_num/this.block_sectors);
			this.add_block(Qh,Lg,sg);
			this.read_async_cb(false);
		}
	};
	this.read_async=function(Bh,bi,n,ci) {
		if((Bh+n)>this.nb_sectors)return-1;
		this.sector_num=Bh;
		this.sector_buf=bi;
		this.sector_index=0;
		this.sector_count=n;
		this.sector_cb=ci;
		this.read_async_cb(true);
		if(this.sector_index>=this.sector_count) {
			return 0;
		}
		else {
			return 1;
		}
	};
	this.preload=function(fa,Jg) {
		var i,Ig,Qh;
		if(fa.length==0) {
			setTimeout(Jg,0);
		}
		else {
			this.preload_cb2=Jg;
			this.preload_count=fa.length;
			for(i=0; i<fa.length; i++) {
				Qh=fa[i];
				Ig=this.get_url(this.url,Qh);
				load_binary(Ig,this.preload_cb.bind(this,Qh));
			}
		}
	};
	this.preload_cb=function(Qh,Lg,sg) {
		if(sg<0) {} else {
			this.add_block(Qh,Lg,sg);
			this.preload_count--;
			if(this.preload_count==0) {
				this.preload_cb2(0);
			}
		}
	};
	this.write_async=function(Bh,bi,n,ci) {
		return-1;
	};
	
	if(Ig.indexOf("%d")<0)throw"Invalid URL";
    if(Ph<=0||Oh<=0)throw"Invalid parameters";
    this.block_sectors=Oh*2;
    this.nb_sectors=this.block_sectors*Ph;
    this.url=Ig;
    this.max_cache_size=Math.max(1,Math.ceil(2536/Oh));
    this.cache=new Array();
    this.sector_num=0;
    this.sector_index=0;
    this.sector_count=0;
    this.sector_buf=null;
    this.sector_cb=null;
}

function Zg(Rf) {
    this.hard_irq=Rf;
}

function di() {
    return this.cycle_count;
}

function PCEmulator(ei) {
	this.load_binary=function(Ig,ka,Jg) {
		return this.cpu.load_binary(Ig,ka,Jg);
	};
	this.start=function() {
		setTimeout(this.timer_func.bind(this),10);
	};
	this.timer_func=function() {
		var Oa,hi,ii,ji,ki,Pg,za;
		Pg=this;
		za=Pg.cpu;
		ii=za.cycle_count+100000;
		ji=false;
		ki=false;
		console.log("cycles = " + za.cycle_count);
		if (za.cycle_count >= 700000) killswitch = true;
	li:
		while(za.cycle_count<ii) {
			Pg.serial.write_tx_fifo();
			Pg.pit.update_irq();
			Oa=za.exec(ii-za.cycle_count);
			if(Oa==256) {
				if(Pg.reset_request) {
					ji=true;
					break;
				}
			}
			else if(Oa==257) {
				ki=true;
				break;
			}
			else {
				ji=true;
				break;
			}
		}
		if(!ji) {
			if(killswitch) {
				print("KILLED BY SWITCH");
				return;
			}
			if(ki) {
				setTimeout(this.timer_func.bind(this),10);
			}
			else {
				setTimeout(this.timer_func.bind(this),0);
			}
		}
	};
	this.init_ioports=function() {
		var i,mi,ni;
		this.ioport_readb_table=new Array();
		this.ioport_writeb_table=new Array();
		this.ioport_readw_table=new Array();
		this.ioport_writew_table=new Array();
		this.ioport_readl_table=new Array();
		this.ioport_writel_table=new Array();
		mi=this.default_ioport_readw.bind(this);
		ni=this.default_ioport_writew.bind(this);
		for(i=0; i<1024; i++) {
			this.ioport_readb_table[i]=this.default_ioport_readb;
			this.ioport_writeb_table[i]=this.default_ioport_writeb;
			this.ioport_readw_table[i]=mi;
			this.ioport_writew_table[i]=ni;
			this.ioport_readl_table[i]=this.default_ioport_readl;
			this.ioport_writel_table[i]=this.default_ioport_writel;
		}
	};
	this.default_ioport_readb=function(ag) {
		var ja;
		ja=0xff;
		return ja;
	};
	this.default_ioport_readw=function(ag) {
		var ja;
		ja=this.ioport_readb_table[ag](ag);
		ag=(ag+1)&(1024-1);
		ja|=this.ioport_readb_table[ag](ag)<<8;
		return ja;
	};
	this.default_ioport_readl=function(ag) {
		var ja;
		ja=-1;
		return ja;
	};
	this.default_ioport_writeb=function(ag,ja) {};
	this.default_ioport_writew=function(ag,ja) {
		this.ioport_writeb_table[ag](ag,ja&0xff);
		ag=(ag+1)&(1024-1);
		this.ioport_writeb_table[ag](ag,(ja>>8)&0xff);
	};
	this.default_ioport_writel=function(ag,ja) {};
	this.ld8_port=function(ag) {
		var ja;
		ja=this.ioport_readb_table[ag&(1024-1)](ag);
		return ja;
	};
	this.ld16_port=function(ag) {
		var ja;
		ja=this.ioport_readw_table[ag&(1024-1)](ag);
		return ja;
	};
	this.ld32_port=function(ag) {
		var ja;
		ja=this.ioport_readl_table[ag&(1024-1)](ag);
		return ja;
	};
	this.st8_port=function(ag,ja) {
		this.ioport_writeb_table[ag&(1024-1)](ag,ja);
	};
	this.st16_port=function(ag,ja) {
		this.ioport_writew_table[ag&(1024-1)](ag,ja);
	};
	this.st32_port=function(ag,ja) {
		this.ioport_writel_table[ag&(1024-1)](ag,ja);
	};
	this.register_ioport_read=function(start,sg,dc,Dh) {
		var i;
		switch(dc) {
		case 1:
			for(i=start; i<start+sg; i++) {
				this.ioport_readb_table[i]=Dh;
			}
			break;
		case 2:
			for(i=start; i<start+sg; i+=2) {
				this.ioport_readw_table[i]=Dh;
			}
			break;
		case 4:
			for(i=start; i<start+sg; i+=4) {
				this.ioport_readl_table[i]=Dh;
			}
			break;
		}
	};
	this.register_ioport_write=function(start,sg,dc,Dh) {
		var i;
		switch(dc) {
		case 1:
			for(i=start; i<start+sg; i++) {
				this.ioport_writeb_table[i]=Dh;
			}
			break;
		case 2:
			for(i=start; i<start+sg; i+=2) {
				this.ioport_writew_table[i]=Dh;
			}
			break;
		case 4:
			for(i=start; i<start+sg; i+=4) {
				this.ioport_writel_table[i]=Dh;
			}
			break;
		}
	};
	this.ioport80_write=function(ia,Lg) {};
	this.reset=function() {
		this.request_request=1;
	};
	
	var za,fi,gi,i,p;
    print("PCEmulator entry OK");
    za=new CPU_X86();
    this.cpu=za;
    print("Resizing memory...");
    za.phys_mem_resize(ei.mem_size);
    this.init_ioports();
    print("IO ports init done, creating peripherals...");
    this.register_ioport_write(0x80,1,1,this.ioport80_write);
    this.pic=new Xg(this,0x20,0xa0,Zg.bind(za));
    this.pit=new bh(this,this.pic.set_irq.bind(this.pic,0),di.bind(za));
    this.cmos=new Og(this);
    this.serial=new lh(this,0x3f8,this.pic.set_irq.bind(this.pic,4),ei.serial_write);
    this.kbd=new qh(this,this.reset.bind(this));
    this.reset_request=0;
    gi=["hda","hdb"];
    fi=new Array();
    for(i=0; i<gi.length; i++) {
        p=ei[gi[i]];
        fi[i]=null;
        if(p) {
            fi[i]=new Nh(p.url,p.block_size,p.nb_blocks);
        }
    }
    this.ide0=new Eh(this,0x1f0,0x3f6,this.pic.set_irq.bind(this.pic,14),fi);
    if(ei.clipboard_get&&ei.clipboard_set) {
        this.jsclipboard=new sh(this,0x3c0,ei.clipboard_get,ei.clipboard_set,ei.get_boot_time);
    }
    za.ld8_port=this.ld8_port.bind(this);
    za.ld16_port=this.ld16_port.bind(this);
    za.ld32_port=this.ld32_port.bind(this);
    za.st8_port=this.st8_port.bind(this);
    za.st16_port=this.st16_port.bind(this);
    za.st32_port=this.st32_port.bind(this);
    za.get_hard_intno=this.pic.get_hard_intno.bind(this.pic);
    print("PC Object init done");
}

function Term(aa,ba,ca) {
    this.w=aa;
    this.h=ba;
    this.cur_h=ba;
    this.tot_h;
    this.y_base;
    this.y_disp;
    this.x;
    this.y;
    this.cursorstate=0;
    this.handler=ca;
    this.convert_lf_to_crlf=false;
    this.state=0;
    this.output_queue="";
    this.bg_colors=["#000000","#ff0000","#00ff00","#ffff00","#0000ff","#ff00ff","#00ffff","#ffffff"];
    this.fg_colors=["#000000","#ff0000","#00ff00","#ffff00","#0000ff","#ff00ff","#00ffff","#ffffff"];
    this.def_attr=(7<<3)|0;
    this.cur_attr=this.def_attr;
    this.is_mac=false;
    this.key_rep_state=0;
    this.key_rep_str="";
    print("Terminal created");
    
    this.clear=function(ko)
	{
		var y,da,i,c;
		this.lines = new Array();
		c = 32 | (this.def_attr<<16);
		for(y=0; y<this.cur_h; y++)
		{
			da = new Array();
			for(i=0; i<this.w; i++) da[i] = c;
			this.lines[y]=da;
		}
		this.cu_h = this.h;
		this.tot_h = 1000;
		this.y_base = 0;
		this.y_disp = 0;
		this.x = 0;
		this.y = 0;
		if (ko) this.refresh(0,this.h-1);
	};
    this.open=function()
    {
		var y,ea;
		print('<table border="0" cellspacing="0" cellpadding="0">');
		for(y=0;y<this.h;y++)
		{
			print('<tr><td class="term" id="tline'+y+'"></td></tr>');
		}
		print('</table>');
		this.clear(1);
		//document.addEventListener("keydown",this.keyDownHandler.bind(this),true);
		//document.addEventListener("keypress",this.keyPressHandler.bind(this),true);
		ea=this;
		//setInterval(function(){ea.cursor_timer_cb();},1000);
	};
	this.refresh=function(fa,ga)
	{
		print("REFRESH()");
	};
	this.cursor_timer_cb=function()
	{
		this.cursor_state^=1;
		this.refresh(this.y,this.y);
	};
	this.show_cursor=function()
	{
		if(!this.cursor_state)
		{
			this.cursor_state=1;
			this.refresh(this.y,this.y);
		}
	};
	this.scroll=function()
	{
	};
	this.scroll_disp=function(n)
	{
	};
	this.write=function(pa)
	{
		print(pa);
	};
	this.writeln=function(pa)
	{
		this.write(pa+'\r\n');
	};

	this.keyDownHandler=function(ya)
	{
		return true;
	};
	this.keyPressHandler=function(ya)
	{
		return false;
	};
	this.queue_chars=function(pa)
	{
		this.output_queue+=pa;
		if(this.output_queue)
			setTimeout(this.outputHandler.bind(this),0);
	};
	this.outputHandler=function()
	{
		if(this.output_queue)
		{
			this.handler(this.output_queue);
			this.output_queue="";
		}
	};
}

var term, pc, init_state, started;

function term_start()
{
	term = new Term(80, 30, term_handler);
	term.open();
	term.writeln("JSPC");
}
function term_handler(str)
{
	if (!started)
		term.write(str);
	else
		pc.serial.send_chars(str);
}
function start()
{
	var params;

	if (started > 0)
		return;

	started = 1;
	//document.getElementById("initButton").style.visibility = 'hidden';

	term_start();
	term.writeln("[JSPC]: Init");

	init_state = new Object();

	params = new Object();

	/* serial output chars */
	params.serial_write = term.write.bind(term);

	/* memory size (in bytes) */
	params.mem_size = 16 * 1024 * 1024;

	/* clipboard I/O */
	//params.clipboard_get = clipboard_get;
	//params.clipboard_set = clipboard_set;

	//params.get_boot_time = get_boot_time;

	/* IDE drive. The raw disk image is split into files of
	* 'block_size' KB. 
	*/
	term.writeln("[JSPC]: Setting HDA URI params");
	params.hda = { url: "hda%d.bin", block_size: 64, nb_blocks: 912 };

	term.writeln("[JSPC]: Creating virtual PC object");
	pc = new PCEmulator(params);

	init_state.params = params;

	term.writeln("[JSPC]: Loading vmlinuz binary");
	pc.load_binary("vmlinux-2.6.20.bin", 0x00100000, start2);
}
function start2(ret)
{
	if (ret < 0) {
		term.writeln("[JSPC]: ERR: start() returned bad value");
		return;
	}
	term.writeln("[JSPC]: Loading LinuxStart");
	init_state.start_addr = 0x10000;
	pc.load_binary("linuxstart.bin", init_state.start_addr, start3);
}
function start3(ret)
{
	var cmdline_addr;

	if (ret < 0) {
		term.writeln("[JSPC]: ERR: start2() returned bad value");
		return;
	}

	/* set the Linux kernel command line */
	term.writeln("[JSPC]: Setting Linux kernel commandline");
	cmdline_addr = 0xf800;
	pc.cpu.write_string(cmdline_addr, "console=ttyS0 root=/dev/hda ro init=/sbin/init notsc=1 hdb=none");

	pc.cpu.eip = init_state.start_addr;
	pc.cpu.regs[0] = init_state.params.mem_size; /* eax */
	pc.cpu.regs[3] = 0; /* ebx = initrd_size (no longer used) */
	pc.cpu.regs[1] = cmdline_addr; /* ecx */

	term.writeln("[JSPC]: Ready to start CPU!");
	setTimeout("start_CPU()",2000);
	timer_work();
}
function start_CPU()
{
	pc.start();
}
function stopit()
{
	killswitch = true;
}
function m_ra(ja,n) {
	var i,s;
	var h="0123456789ABCDEF";
	s="";
	for(i=n-1; i>=0; i--) {
		s=s+h[(ja>>>(i*4))&15];
	}
	return s;
}
function showdump()
{
	/*print("Length of gladis is " + gladis.length);
	var i,_s = "";
	for (i = 0; i < gladis.length; i++) {
		_s = _s + m_ra(gladis[i].b,2) + " ";
		if (i > 0 && i % 64 == 0) {
			print(gladis[i].St + " + " + gladis[i].Na + ": " + _s);
			_s = "";
		}
	}
	print(_s);*/
	
	print("eb: "+mtable.eb);
	print("hb: "+mtable.hb);
	print("kb: "+mtable.kb);
	print("lb: "+mtable.lb);
	print("gb: "+mtable.gb);
	
	var i;
	print("Nocturnal "+nocturnal.length);
	for (i = 9366; i < 57000; i++) print(nocturnal[i]);
	print("END OF DUMP(9366-57000)");
}

timer = new Array();
gladis = new Array();
mtable = new Object();
mtable.eb = 0;
mtable.hb = 0;
mtable.kb = 0;
mtable.lb = 0;
mtable.gb = 0;
nocturnal = new Array();
killswitch = false;
print("All Clear");
