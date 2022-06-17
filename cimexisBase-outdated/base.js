const bindType={
	ALL: "ALL",
	SET: "SET",
	ADD: "ADD",
	REMOVE: "REMOVE",
	CHANGE: "CHANGE",
	ERROR: "ERROR",
};

class Subscription{
	constructor(type,callback){
		this.enabled=true;
		this.type=type;
		this.callback=callback;
	}
}

//TODO: use weakmaps to allow garbage collection
//this will bind to objects or arrays
function bind(data,recurse){
	if(typeof data==="function"){
		//do nothing for functions
	}else if(typeof data!=="object" || data==null){
		//wrap the data inside an object
		data={
			data:data
		};
		return bindGeneral(data,true);
	}else if(Array.isArray(data)){
		if(recurse){
			if(!data.isBound){
				for(let x in data){
					data[x]=bind(data[x],recurse);
				}
			}
		}
		return bindArray(data);
	}else{
		if(!data.isBound){
			if(recurse){
				for(let x in data){
					data[x]=bind(data[x],recurse);
				}
			}
			return bindGeneral(data,false);
		}else{
			return data;
		}
	}
}
//binding for general objects with no special handling
function bindGeneral(data,isWrapped){
	let handler = {
		updateId: 0,
		isBound: true,
		subscriptions: [],
		binded: data,
		set: function (target,prop,val) {
			let boundVal=val;
			if(prop!="data"){
				let boundVal=bind(val,true);
			}
			target[prop]=boundVal;
			this.update(bindType.SET,{prop:prop,val:val,bound:boundVal});
			return true;
		},
		get: function(target, prop, receiver) {
			if(prop==="isBound"){
				return this.isBound;
			}else{
				let value = Reflect.get(...arguments);
				return value;
			}
		},
		/*get: function(target, prop, receiver) {
			let value = Reflect.get(...arguments);
			if(typeof value=="object"
				&& value!=null
				&& value.data!==undefined){
				return value.data;
			}else{
				return value;
			}
		},*/

		sub: function(type,sub){
			this.subscriptions.push(new Subscription(type,sub));
		},
		unSub: function(type,sub){
			if(type==bindType.ALL){
				this.unSubAll(sub);
			}else{
				for(let i=0;i<this.subscriptions.length;i++){
					if(this.subscriptions[i].callback==sub && this.subscriptions[i].type==type){
						this.subscriptions.splice(i,1);
					}
				}
			}
		},
		unSubAll: function(sub){
			for(let i=0;i<this.subscriptions.length;i++){
				if(this.subscriptions[i].callback==sub){
					this.subscriptions.splice(i,1);
				}
			}
		},
		toggleSub: function(type,sub,toggle){
			if(type==bindType.ALL){
				this.toggleSubAll(sub);
			}else{
				let targets=this.getSub(type,sub);
				if(target!=null){
					target.enabled=toggle;
				}
			}
		},
		toggleSubAll: function(sub,toggle){
			let targets=this.getSubFull(sub);
			if(target!=null){
				target.enabled=toggle;
			}
		},
		getSub: function(type,sub){
			if(type==bindType.ALL){
				return this.getSubAll(sub);
			}else{
				let matches=[];
				for(let i=0;i<this.subscriptions.length;i++){
					if(this.subscriptions[i].callback==sub && this.subscriptions[i].type==type){
						matches.push(this.subscriptions[i]);
					}
				}
				return matches;
			}
		},
		getSubAll: function(sub){
			for(let i=0;i<this.subscriptions.length;i++){
				if(this.subscriptions[i].callback==sub){
					matches.push(this.subscriptions[i]);
				}
			}
			return matches;
		},
		update: function(type,info){
			if(this.updateId<getUpdateId()){
				this.updateId=getUpdateId();

				if(type==bindType.ALL){
					this.updateAll(info);
				}else{
					console.log("updated "+type+" with:",info);
					for(let i=0;i<this.subscriptions.length;i++){
						if((this.subscriptions[i].type==type||this.subscriptions[i].type==bindType.ALL)&&this.subscriptions[i].enabled){
							this.subscriptions[i].callback(info,type,this);
						}
					}
				}
			}
		},
		updateAll: function(type,info){
			for(let i=0;i<this.subscriptions.length;i++){
				if(this.subscriptions[i].enabled){
					this.subscriptions[i].callback(info,type,this);
				}
			}
		}
	}

	data.sub=(type,sub)=>{handler.sub(type,sub)};
	data.unSub=(type,sub)=>{handler.unSub(type,sub)};
	data.toggleSub=(type,sub,toggle)=>{handler.toggleSub(type,sub,toggle)};
	//getting the update id can help avoid bounce-back when creating subscriptions
	data.getUpdateId=()=>{return handler.updateId};
	//allow manual updating of wrapped primitives
	if(isWrapped){
		data.update=()=>{handler.update(bindType.SET,{prop:"data",val:data.data})};
	}

	return new Proxy(data, handler);
}
//binding for arrays
function bindArray(data){
	let handler = {
		updateId: 0,
		isBound: true,
		subscriptions: [],
		arrLength: data.length,
		surpressUpdates: false,
		binded: data,
		set: function (target,prop,val) {
			if(prop=="length"){
				this.update(bindType.CHANGE,{lengthChange:val-this.arrLength});
				this.arrLength=val;
			}else{
				let boundVal=val;
				if(prop!="data"){
					let boundVal=bind(val,true);
				}
				target[prop]=boundVal;
				if(!this.surpressUpdates){
					this.update(bindType.SET,{prop:prop,val:val,bound:boundVal});
				}
			}
			return true;
		},
		get: function(target, prop, receiver) {
			if(prop==="isBound"){
				return this.isBound;
			}else{
				let value = Reflect.get(...arguments);
				return value;
			}
		},
		/*get: function(target, prop, receiver) {
			let value = Reflect.get(...arguments);
			if(typeof value=="object"
				&& value!=null
				&& value.data!==undefined){
				return value.data;
			}else{
				return value;
			}
		},*/

		add: function(toAdd,index){
			let boundVal=bind(toAdd,true);
			this.surpressUpdates=true;
			if(index != null){
				this.binded.splice(index,0,boundVal);
				this.update(bindType.ADD,{index:index,val:toAdd,bound:boundVal});

			}else{
				this.binded.push(boundVal);
				this.update(bindType.ADD,{index:this.binded.length-1,val:toAdd,bound:boundVal});
			}
			this.surpressUpdates=false;
		},
		remove: function(index){
			this.surpressUpdates=true;
			let removed=this.binded[index];
			this.binded.splice(index,1);
			this.update(bindType.REMOVE,{index:index,removed:removed});
			this.surpressUpdates=false;
		},
		removeItem: function(item){
			let index=this.binded.indexOf(item);
			if(index!==-1){
				this.remove(index);
			}
		},



		sub: function(type,sub){
			this.subscriptions.push(new Subscription(type,sub));
		},
		unSub: function(type,sub){
			if(type==bindType.ALL){
				this.unSubAll(sub);
			}else{
				for(let i=0;i<this.subscriptions.length;i++){
					if(this.subscriptions[i].callback==sub && this.subscriptions[i].type==type){
						this.subscriptions.splice(i,1);
					}
				}
			}
		},
		unSubAll: function(sub){
			for(let i=0;i<this.subscriptions.length;i++){
				if(this.subscriptions[i].callback==sub){
					this.subscriptions.splice(i,1);
				}
			}
		},
		toggleSub: function(type,sub,toggle){
			if(type==bindType.ALL){
				this.toggleSubAll(sub);
			}else{
				let targets=this.getSub(type,sub);
				if(target!=null){
					target.enabled=toggle;
				}
			}
		},
		toggleSubAll: function(sub,toggle){
			let targets=this.getSubFull(sub);
			if(target!=null){
				target.enabled=toggle;
			}
		},
		getSub: function(type,sub){
			if(type==bindType.ALL){
				return this.getSubAll(sub);
			}else{
				let matches=[];
				for(let i=0;i<this.subscriptions.length;i++){
					if(this.subscriptions[i].callback==sub && this.subscriptions[i].type==type){
						matches.push(this.subscriptions[i]);
					}
				}
				return matches;
			}
		},
		getSubAll: function(sub){
			for(let i=0;i<this.subscriptions.length;i++){
				if(this.subscriptions[i].callback==sub){
					matches.push(this.subscriptions[i]);
				}
			}
			return matches;
		},
		update: function(type,info){
			if(this.updateId<getUpdateId()){
				this.updateId=getUpdateId();

				if(type==bindType.ALL){
					this.updateAll(info);
				}else{
					console.log("updated "+type+" with:",info);
					for(let i=0;i<this.subscriptions.length;i++){
						if((this.subscriptions[i].type==type||this.subscriptions[i].type==bindType.ALL)&&this.subscriptions[i].enabled){
							this.subscriptions[i].callback(info,type,this);
						}
					}
				}
			}
		},
		updateAll: function(type,info){
			for(let i=0;i<this.subscriptions.length;i++){
				if(this.subscriptions[i].enabled){
					this.subscriptions[i].callback(info,type,this);
				}
			}
		}
	}

	data.sub=(type,sub)=>{handler.sub(type,sub)};
	data.unSub=(type,sub)=>{handler.unSub(type,sub)};
	data.toggleSub=(type,sub,toggle)=>{handler.toggleSub(type,sub,toggle)};
	data.add=(toAdd,index)=>{handler.add(toAdd,index)};
	data.remove=(index)=>{handler.remove(index)};
	data.removeItem=(index)=>{handler.removeItem(index)};
	//getting the update id can help avoid bounce-back when creating subscriptions
	data.getUpdateId=()=>{return handler.updateId};

	return new Proxy(data, handler);
}

var currentUpdateId=0;
function getUpdateId(){
	return currentUpdateId;
}
//called before a new update, usually trigged through user input
//this makes sure cyclic relationships do not end up in infinite loops
function newUpdate(){
	currentUpdateId++;
}


//created an element
function newElm(tag,classes){
	let elm=document.createElement(tag);
	if(classes){
		let classSplit=classes.split(" ");
		for(let i=0;i<classSplit.length;i++){
			elm.classList.add(classSplit[i]);
		}
	}
	return elm;
}
function appElm(toAdd,target){
	target.appendChild(toAdd);
}
function appElmAt(toAdd,index,target){
	if(index>=target.children.length){
		target.appendChild(toAdd);
	}else{
		target.insertBefore(toAdd,target.children[index])
	}
}
function addClass(classes,elm){
	let classSplit=classes.split(" ");
	for(let i=0;i<classSplit.length;i++){
		elm.classList.add(classSplit[i]);
	}
}
function getElm(selector,target){
	if(target!=null){
		return target.querySelector(selector);
	}
	return document.querySelector(selector);
}
function getElms(selector,target){
	if(target!=null){
		return target.querySelectorAll(selector);
	}
	return document.querySelectorAll(selector);
}
function clearElm(target){
	while(target.firstChild) {
		target.removeChild(target.lastChild);
	}
}
