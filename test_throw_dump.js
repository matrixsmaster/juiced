function c() {
	throw {intno: 0, error_code: 1};
}
function b() {
	throw "b()";
	try {
		c();
	} catch (Hg) {
		print("Catched: "+Hg);
	}
	print("invisible b");
}
function a() {
	print("visible a");
	b();
	print("invisible a");
}
a();
