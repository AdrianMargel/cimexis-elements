function isNumber(value) {
	return /^-?\d+(\.\d+)?$/.test(value);
}
//this is used for numbers being typed out, if the number could be still valid assuming it is unfinished
function isAlmostNumber(value) {
	return /^-?\d*(\.\d*)?$/.test(value);
}

function isPrice(value) {
	return /^-?\d+(\.\d+)?$/.test(value);
}
//this is used for prices being typed out, if the number could be still valid assuming it is unfinished
function isAlmostPrice(value) {
	return /^-?\$?\d*(\.\d{0,2})?$/.test(value);
}

function isInt(value) {
	return /^-?\d+$/.test(value);
}