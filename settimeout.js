var timer;

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
	var win;
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
}

function fun1()
{
	print("fun1()");
	//setTimeout("fun1()",10);
}

function fun2()
{
	print("fun2()");
}

function myobj(ei)
{
	var num = 0;
	
	this.start=function() {
		setTimeout(this.timer_func.bind(this),10);
	};
	this.timer_func=function() {
		print("MyObject("+num+") timer_func()");
	};
	
	num = ei;
}

function start()
{
	setTimeout("fun1()",1000);
	setTimeout("fun2()",20);
	
	var o = new myobj(348);
	o.start();
}

timer = new Array();
start();
timer_work();
