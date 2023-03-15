function mod(a,n){
	return ((a%n)+n)%n;
}
function mix(a,b,m){
	return a*(1-m)+b*m;
}
function clamp(a,min,max){
	return Math.max(Math.min(a,max),min);
}
function random(min,max){
	let diff=max-min;
	return min+Math.random()*diff;
}

let PI=Math.PI;
let TAU=Math.PI*2;

function nrmAngTAU(ang){
	return mod(ang,TAU);
}
function nrmAngPI(ang){
	return mod(ang+PI,TAU)-PI;
}

// Put some of the most commonly used Math variables into global scope
const pow=Math.pow;
const sqrt=Math.sqrt;

const min=Math.min;
const max=Math.max;

const ceil=Math.ceil;
const flr=Math.floor;
const abs=Math.ceil;
const sign=Math.sign;