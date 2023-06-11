function readArgVec(args,dims=2){
	if(args[0] instanceof Vector){
		let v=args.splice(0,1);
		return [v[0].x,v[0].y];
	}else if(Array.isArray(args[0])){
		let v=args.splice(0,1);
		return v[0];
	}else{
		let v=args.splice(0,dims);
		return v;
	}
}
function readArg(args){
	return args.splice(0,1)[0];
}