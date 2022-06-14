//#region reactivity
/*
	█▀█ █▀▀ ▄▀█ █▀▀ ▀█▀ █ █ █ █ ▀█▀ █▄█
	█▀▄ ██▄ █▀█ █▄▄  █  █ ▀▄▀ █  █   █ 
*/

//#region proxy setup

//TODO: consider using weakmaps to allow garbage collection
/**
 * A wrapper for a callback function
 */
class Subscription{
	constructor(callback){
		this.callback=callback;
	}
}

/**
 * A handler class to use when creating a reactive proxy to bind data
 */
class ReactiveHandler{
	/**
	 * A basic constructor
	 * @param {object} data The data to bind. Must be an object since proxies can only be attached to objects.
	 * @param {boolean} isRecursive If the data should be bound recursively. This mainly effects if new data added to the object will be bound.
	 */
	constructor(data,isRecursive){
		this.subscriptions=[];
		this.bound=data;
		this.isBound=true;
		this.isRecursive=isRecursive;
		this.isSuppressed=false;
		this.hasChanged=false;
	}
	/**
	 * Determines the behavior when a value is set
	 * 
	 * @param {object} target The bound object whose value is being set
	 * @param {string | Symbol} prop The property being set
	 * @param {*} val The value being set
	 * @returns true
	 */
	set(target,prop,val) {
		let oldValue=target[prop];
		let value;
		if(prop=="data"){
			value=val;
		}else{
			value=this.isRecursive?bind(val,this.isRecursive):val;
		}
		target[prop]=value;

		if(oldValue!==value){
			this.update();
		}
		return true;
	}
	/**
	 * Determines the behavior when a value is gotten
	 * 
	 * @param {object} target The bound object whose value is being gotten
	 * @param {string | Symbol} prop The property being gotten
	 * @returns The value of the property
	 */
	get(target, prop) {
		if(prop=="isBound"){
			return this.isBound;
		}
		let value=Reflect.get(...arguments);
		return value;
	}
	/**
	 * Subscribes to this reactive proxy. Anytime the value changes the callback function will be run.
	 * 
	 * @param {function} callback The function to run
	 * @returns If the subscription could be added. False if the subscription already exists.
	 */
	sub(callback){
		if(!this.subscriptions.some(s => s.callback===callback)){
			let sub=new Subscription(callback);
			this.subscriptions.push(sub);
			return true;
		}
		return false;
	}
	/**
	 * Unsubscribes to this reactive proxy
	 * 
	 * @param {function} callback The callback function to remove 
	 */
	unSub(callback){
		for(let i=0;i<this.subscriptions.length;i++){
			if(this.subscriptions[i].callback===callback){
				this.subscriptions.splice(i,1);
				break;
			}
		}
	}
	/**
	 * A function to run anytime the value updates that will ensure all subscriptions are notified of the change.
	 * If currenty locked then no subscriptions will be informed of the change, but the change will still be noted.
	 */
	update(){
		if(!this.isSuppressed){
			for(let i=0;i<this.subscriptions.length;i++){
				this.subscriptions[i].callback();
			}
		}else{
			this.hasChanged=true;
		}
	}
	/**
	 * Prevents any subscriptions from being notifed of updates effectively disabling reactivity
	 */
	lock(){
		this.isSuppressed=true;
	}
	/**
	 * Allows subscriptions to be notified of updates once again.
	 * 
	 * @param {*} allowUpdate If updates that occurred while locked should be propagated to all subscriptions now.
	 */
	unlock(allowUpdate=true){
		this.isSuppressed=false;
		if(this.hasChanged){
			this.hasChanged=false;
			if(allowUpdate){
				this.update();
			}
		}
	}
}

/**
 * A handler class to use when creating a reactive proxy to bind an array
 */
class ReactiveArrayHandler extends ReactiveHandler{
	/**
	 * Determines the behavior when a value is set
	 * 
	 * @param {*[]} target The bound object whose value is being set
	 * @param {string | Symbol} prop The property being set
	 * @param {*} val The value being set
	 * @returns true
	 */
	set(target,prop,val) {
		console.log("set",prop);
		if(prop=="length"){
			target[prop]=val;
			this.update();
			return true;
		}
		let oldValue=target[prop];
		let value=this.isRecursive?bind(val,this.isRecursive):val;
		console.log(this.isRecursive,value)
		target[prop]=value;

		if(oldValue!==value){
			this.update();
		}
		return true;
	}
}

/**
 * A general method for wrapping an object as a reactive proxy
 * 
 * @param {object} data The data to bind. Must be an object since proxies can only be attached to objects.
 * @param {boolean} isRecursive If the data should be bound recursively. This mainly effects if new data added to the object will be bound.
 * @returns The reactive proxy binding the object
 */
function bindGeneral(data,isRecursive){
	return bindProxy(data,new ReactiveHandler(data,isRecursive));
}

/**
 * A general method for wrapping an array as a reactive proxy
 * 
 * @param {*[]} data The data to bind
 * @param {boolean} isRecursive If the data should be bound recursively. This mainly effects if new items added to the array will be bound.
 * @returns The reactive proxy binding the array
 */
function bindArray(data,isRecursive){
	return bindProxy(data,new ReactiveArrayHandler(data,isRecursive));
}

/**
 * Binds an object with a reactive proxy
 * 
 * @param {object} data The data to bind
 * @param {ReactiveHandler} handler The handler to bind with
 * @returns The reactive proxy binding the object
 */
function bindProxy(data,handler){
	// Give the bound object access to some of the methods on the handler
	data.sub=(sub)=>{handler.sub(sub)};
	data.unSub=(sub)=>{handler.unSub(sub)};
	data.lock=()=>{handler.lock()};
	data.unlock=(allowUpdate)=>{handler.unlock(allowUpdate)};
	data.update=()=>{handler.update()};

	return new Proxy(data, handler);
}

//#endregion

/**
 * Wraps a piece of data in a proxy making it reactive so events will trigger anytime the data changes
 * 
 * @param {*} data The data to bind
 * @param {boolean} recursive If children of the data should be bound also (such as items in array or properties on an object)
 * @returns The reactive proxy for the bound data
 */
 function bind(data,recursive=true){

	// If the data is a primitive then wrap it inside an object and bind that
	if(typeof data!=="object" || data==null){
		return bindGeneral({data},recursive);
	}

	// If the data is already bound then return it as is
	if(data.isBound===true){
		return data;
	}

	// If the data is an array then bind it
	if(Array.isArray(data)){
		// If recursive then bind all of the items in the array as well
		if(recursive){
			for(let x in data){
				data[x]=bind(data[x],recursive);
			}
		}
		return bindArray(data,recursive);
	}

	// Otherwise the data is an object and should be bound as such
	// If recursive then bind all of the properties of the object array as well
	if(recursive){
		for(let x in data){
			data[x]=bind(data[x],recursive);
		}
	}
	return bindGeneral(data,recursive);
}

/**
 * Defines a bound object that will update based on a set of other bound objects
 * Regardless of what value is returned by the definition function it will always be treated like a wrapped primitive.
 * A definition can return another bound object though; that's acceptable
 * 
 * @param {Function} definition The function to determine the value
 * @param  {...any} bindings The bound objects which this value depends on. If any of these change the value will be updated.
 * @returns The bound object based on the definition
 */
function def(definition,...bindings){
	// The binding should not be recursive
	let bound=bind(null,false);
	let update=()=>{bound.data=definition()};
	link(update,...bindings)();
	return bound;
}
/**
 * Links a function to a set of bound objects. The function will be added as a subscription to each bound object.
 * 
 * @param {Function} toRun The function to run
 * @param  {...any} bindings The bound objects the function should subscribe to
 * @returns The toRun function
 */
function link(toRun,...bindings){
	bindings.forEach((b)=>{b.sub(toRun)});
	return toRun;
}

//#endregion


//#region reactive HTML
/*

	█▀█ █▀▀ ▄▀█ █▀▀ ▀█▀ █ █ █ █▀▀   █ █ ▀█▀ █▀▄▀█ █  
	█▀▄ ██▄ █▀█ █▄▄  █  █ ▀▄▀ ██▄   █▀█  █  █ ▀ █ █▄▄
*/

/**
 * A placeholder element that acts as a temporary capsule allowing the construction and manipulation of a local DOM tree.
 * When the local DOM tree is complete the capsule can be disolved releasing all of its child elements its parent.
 * 
 * As a side note: I know this looks like a great place for a fragement or template but unforunately we need an active DOM we can manipulate.
 */
class Capsule extends HTMLElement{
	/**
	 * A basic constructor
	 */
	constructor(){
		super();
		this.directChildren=[];
		this.isCapsule=true;
		this.marker=newComment();
		this.marker.isMarker=true;
		this.marker.capsule=this;
	}
	/**
	 * Absorbs all of the child elements it had previously released back into itself and cleans all capsules inside.
	 * This is used to absorb the disolved capsule before updating it.
	 */
	absorb(){
		// Absorb all children
		this.absorbChildren();
		// Clean up all capsules inside this one so they can be recreated fresh
		cleanCapsules(this);
	}
	/**
	 * Removes all child elements including the marker so the capsule can be removed without side effects
	 */
	clean(){
		this.absorbChildren();
		removeElm(this.marker);
	}
	/**
	 * Absorb all direct children of this element back into itself
	 */
	absorbChildren(){
		// Remove all direct children from the dom
		this.directChildren.forEach(c=>{
			// If somehow the marker ended up in the directChildren list ignore it.
			// The marker is used to indicate the capsule's location so it shouldn't be removed.
			if(this.marker===c){
				return;
			}
			addElm(c,this);
		});
	}
	/**
	 * Moves the capsule to its marker. The marker indicates where the capsule was last disolved.
	 * This is used to update the capsule without requiring the parent to update its DOM.
	 */
	deliver(){
		replaceElm(this.marker,this,false);
	}
	/**
	 * Prepare the capsule to be disolved
	 */
	prepare(){
		if(this.parentNode==null){
			// The capsule can't be disolved unless it is inside of another element
			return;
		}
		// Identify all direct children that are going to be released 
		this.directChildren=[...this.childNodes];
		// Add the marker to the capsule so the location where the capsule was released can be kept track of after the capsule is disolved
		addElm(this.marker,this);
	}
	/**
	 * Disolve the capsule releasing its children into its parent.
	 * All other capsules contained within this capsule will also be disolved.
	 */
	disolve(){
		if(this.parentNode==null){
			// The capsule can't be disolved unless it is inside of another element
			return;
		}
		// Disolve the capsule and all capsules inside it
		removeCapsules(this);
	}
}
defineElm(Capsule);

/**
 * Disolves all capsules within this element
 * 
 * @param {HTMLElement} target The element to update
 */
function removeCapsules(target){
	// If the element is a capsule prepare it to be disolved
	// This happens recusively before any of the capsules are disolved (breadth first)
	if(isCapsule(target)){
		target.prepare();
	}
	// Try to disolve each child recursively
	let children=[...target.childNodes];
	children.forEach(removeCapsules);
	// If the element is a capsule then disolve it
	// This happens recursively after each capsule has been prepared (depth first)
	if(isCapsule(target)){
		replaceElm(target,target.childNodes,false);
	}
}
/**
 * Cleans all capsules within this element
 * 
 * @param {HTMLElement} target The element to update
 */
function cleanCapsules(target){
	// Try to clean each child recursively
	let children=[...target.childNodes];
	children.forEach(cleanCapsules);
	if(isMarker(target)){
		target.capsule.clean();
	}
}

//returns a function which will create a reactive dom element
/**
 * Used to create reactive HTML
 * 
 * @param {string[]} strings The strings from the string template
 * @param  {...any} keys The keys from the string template
 * @returns A function which when called will produce a bound reactive Capsule element
 */
function html(strings,...keys){
	// Create a function which will return the reactive HTML
	// The bindings provided to this function will determine when this should update 
	let htmlFunc=(...bindings)=>{

		/* STEP 1: determine placeholder and populate static strings */

		// Create a list of placeholders for anything that isn't a static string
		let placeholders=[];
		/**
		 * Creates a placeholder in the html string for a more non-static values
		 * Used to allow dynamic values to be replaced/updated as they change
		 * The key will also be added to the placeholders list for later
		 * 
		 * @param {*} key The value to placehold
		 * @returns The string placeholder to add to the html
		 */
		function placehold(key){
			placeholders.push(key);
			return "$("+(placeholders.length-1)+")"
		}
		/**
		 * Converts static values to strings
		 * Dynamic values will be added as placeholders to be replaced later
		 * 
		 * @param {*} key The value to convert to a string
		 * @returns The string value or placeholder value
		 */
		function convert(key){
			if(key==null){
				// Display null and undefined as a blank string
				return "";
			}
			let type=typeof key;
			if((type=="object"||type=="function")){
				if(key.isHtmlFunction){
					// If this is an html function with no bindings then allow it to inherit the bindings
					return placehold(key(...bindings));
				}
				return placehold(key);
			}
			return key;
		}
		// Create the static HTML for this template populating all static values
		let htmlText=strings[0]+keys.map((k,i)=>convert(k)+strings[i+1]).join("");

		/* STEP 2: Create a capsule that can be updated dynamically with the populate function */

		// Create an empty capsule
		let capsule=newCapsule();
		/**
		 * Populates the capsule with the dynamic values
		 * 
		 * @returns The capsule
		 */
		function populate(){
			/**
			 * Evaluates a dynamic value
			 * This will attempt to resolve the value to a string, element, or capsule that can be added to the html
			 * Values are evaluated recursively whenever is possible to do so
			 * 
			 * @param {*} toEval The dynamic value to evaluate
			 * @returns The value to add to the html
			 */
			function evaluate(toEval){
				if(toEval==null){
					// Display null and undefined as a blank string
					return "";
				}
				let type=typeof toEval;
				if(type=="function"){
					// If it is a function then run it and evaluate the result
					return evaluate(toEval());
				}
				if(type=="object"){
					if(isIterable(toEval)){
						// If it is iterable then turn it into an array
						let array=[...toEval];
						// Evaluate each item in the array
						array=array.map(evaluate);

						if(array.some(n=>isElm(n))){
							// If any item in the array is an element then return a capsule with all the values as child elements
							// This has to be done since if one of the items is an element it can't be turned into a string
							let childCapsule=newCapsule();
							array.forEach(n=>{
								if(isElm(n)){
									addElm(n,childCapsule);
								}else{
									// If the item isn't an element then take its value and turn it into a text node
									// This way it can be added to the capsule like any other element
									addElm(newText(n+""),childCapsule);
								}
							});
							return childCapsule;
						}else{
							// If all items in the array can be expressed as strings then join them together into a single string and return it.
							return array.join("");
						}
					}else if(toEval.isBound){
						// If the value is bound then get its data and evaluate it.
						// If the bound value is an object then .data will return undefined.
						// This is acceptable since how objects should be displayed is ambiguous, only bound primitives should used.
						// Technically we could check for undefined here and display it as json if it is an object.
						return evaluate(toEval.data);
					}else if(isElm(toEval)){
						// If the object is an element return it as is
						return toEval;
					}else{
						// Again, complex objects will just display the same as undefined
						return evaluate(undefined);
					}
				}
				// If the value is something else then just return it and allow it to be cast as a string directly
				return toEval;
			}
			/**
			 * Recursively finds all placeholder comments inside an element
			 * A placeholder comment is an comment containing text in the format of $[number]
			 * 
			 * @param {HTMLElement} elm The element to search
			 * @param {Record<string,HTMLElement>} comments A dictionary to add any found comments to
			 * @returns The dictionary of found comments
			 */
			function getPlaceholderComments(elm,comments){
				// If the comments dictionary was not provided then create a new one
				comments=comments??{};

				// Search all children
				elm.childNodes.forEach(n=>{
					if(n.nodeType==8){
						// If the child is a comment then check that the text is in the correct format $[number]
						let found=/\$\[([0-9]+)\]/.exec(n.data);
						if(found!=null){
							// If it is in the correct format then add it to the dictionary 
							comments[found[1]]=n;
						}
					}else{
						// If the child is not a comment then search it for comments
						getPlaceholderComments(n,comments);
					}
				});
				return comments;
			}

			// Create a copy of the html text to update with the new values
			let replacedHtmlText=htmlText;
			// Evaluate all the placeholder values
			let placeholdersResults=placeholders.map(evaluate);

			/* STEP 2-A: Populate all dynamic string values and create placholder comments for all elements */

			// Replace all placeholders with either the dynamic value or a placeholder comment
			placeholdersResults.forEach((p,i)=>{
				if(!isElm(p)){
					// If the placeholder value isn't an element then use it as a string and replace its placeholder in the HTML
					replacedHtmlText=replacedHtmlText.replace("$("+i+")",p);
				}else{
					// If the placeholder value is an element then create a placeholder comment to mark its location
					replacedHtmlText=replacedHtmlText.replace("$("+i+")","<!--$["+i+"]-->");
				}
			});

			// Populate the capsule with the dynamic string values
			// If the capsule was already disolved then reset it by absorbing it and re-delivering it.
			capsule.absorb();
			capsule.deliver();
			// Set the innerHTML.
			// At this point anything that could be added to the DOM as a string has been added.
			// The remaining placeholders are elements or capsules that can't be added until after the HTML is populated.
			capsule.innerHTML=replacedHtmlText;
			
			/* STEP 2-B: Populate elements */

			// Find all placeholder comments
			let placeholderComments=getPlaceholderComments(capsule);
			// Add all placeholder values that are elements
			placeholdersResults.forEach((p,i)=>{
				if(isElm(p)){
					// Replace the placeholder comment with the correct element
					replaceElm(placeholderComments[i+""],p);
				}
			});
			
			/* STEP 2-C: Disolve and return the capsule */
			
			// Now that the capsule has been populated disolve it releasing all of its children
			// This will also disolve all nested capsules inside
			capsule.disolve();
			// Return the capsule
			return capsule;
		}
		// Return the capsule as a reactive object that will update anytime one of the bindings changes
		// This is done by creating a reactive definition based on the populate function.
		return def(()=>populate(),...bindings);
	}
	// Indicate that the the function is an HTML function.
	// This allows it to be detected and inherit bindings from its parent if it is used inside another html template
	htmlFunc.isHtmlFunction=true;
	return htmlFunc;
}

//#endregion


//#region custom elements
/*
	█▀▀ █ █ █▀ ▀█▀ █▀█ █▀▄▀█   █▀▀ █   █▀▀ █▀▄▀█ █▀▀ █▄ █ ▀█▀ █▀
	█▄▄ █▄█ ▄█  █  █▄█ █ ▀ █   ██▄ █▄▄ ██▄ █ ▀ █ ██▄ █ ▀█  █  ▄█
*/

/**
 * A generic custom element class to inherit off of
 * This holds common useful behaviour
 */
class CustomElm extends HTMLElement{
	constructor(){
		super();
	}
	define(htmlDef){
		this.htmlDef=(typeof htmlDef=="function")?htmlDef():htmlDef;
		let capsule=this.htmlDef.data;
		addElm(capsule,this);
		capsule.disolve();
	}
}
/**
 * A function to define a custom element based on a class
 * @param {class} elmClass The class to define as a custom element
 */
function defineElm(elmClass){
	let nameSpace="cmx";
	let className=elmClass.name.replace(/(.)([A-Z])/g, "$1-$2").toLowerCase(); 
	customElements.define(nameSpace+"-"+className, elmClass);
}

//#endregion


//#region HTML event binding
/*
	█ █ ▀█▀ █▀▄▀█ █     █▀▀ █ █ █▀▀ █▄ █ ▀█▀   █▄▄ █ █▄ █ █▀▄ █ █▄ █ █▀▀
	█▀█  █  █ ▀ █ █▄▄   ██▄ ▀▄▀ ██▄ █ ▀█  █    █▄█ █ █ ▀█ █▄▀ █ █ ▀█ █▄█
*/

//TODO: garbage collection?
/**
 * A dictionary of registered events that can be called from the html
 */
let EventRegistration={};
/**
 * The current event id
 */
let currentRegistrationId=0;

/**
 * Registers an event function which can be called by from the html.
 * Returns a string for the html to call the registered function.
 * 
 * @param {function} func The function to run 
 * @returns The string representing how the function should be called
 */
function fire(func){
	let id=currentRegistrationId++;
	EventRegistration["event"+id]=func;
	return "fireFromHTML(event,"+id+")";
}
/**
 * Allows a registered event to be fired from html
 * 
 * @param {*} event The event 
 * @param {number} id The id of the registered event 
 */
function fireFromHTML(event,id){
	EventRegistration["event"+id](event);
}


//#endregion

//#region utility
/*
	█ █ ▀█▀ █ █   █ ▀█▀ █▄█
	█▄█  █  █ █▄▄ █  █   █ 
*/

/**
 * Checks if a value is an html element
 * 
 * @param {*} toTest The value to check 
 * @returns If the value is an element
 */
function isElm(toTest){
	return toTest instanceof Element
}
/**
 * Creates a new Capsule.
 * 
 * @returns The new capsule
 */
function newCapsule(){
	return new Capsule();
}
/**
 * Checks if an element is a capsule
 * 
 * @param {*} toTest The element to check
 * @returns If the element is a capsule
 */
function isCapsule(toTest){
	return toTest.isCapsule;
}
/**
 * Checks if an element is a marker for a capsule
 * 
 * @param {*} toTest The element to check
 * @returns If the element is a marker
 */
function isMarker(toTest){
	return toTest.isMarker;
}
/**
 * Creates a new element
 * 
 * @param {string} tag The element tag
 * @param {string} classes Any classes that should be added to the element 
 * @returns The new element
 */
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
/**
 * Creates a new text node
 * 
 * @param {string} text The text
 * @returns The text node
 */
function newText(text=""){
	return document.createTextNode(text);
}
/**
 * Creates a new comment node
 * 
 * @param {string} text The comment
 * @returns The comment node
 */
function newComment(text=""){
	return document.createComment(text);
}
/**
 * Adds an element or list of elements to another element
 * 
 * @param {HTMLElement|HTMLElement[]} toAdd The element or list of elements to add
 * @param {HTMLElement} target The element to add it to 
 */
function addElm(toAdd,target){
	if(isIterable(toAdd)){
		// Make sure it is an array so items don't disappear as we add them
		let addList=[...toAdd];
		addList.forEach(n=>addElm(n,target));
	}else{
		target.appendChild(toAdd);
	}
}
/**
 * Removes an element
 * 
 * @param {HTMLElement} target The element to remove 
 */
function removeElm(target){
	target.remove();
}
/**
 * Adds an element at a specific index to another element
 * 
 * @param {HTMLElement} toAdd The element to add
 * @param {number} index The index to add the element at
 * @param {HTMLElement} target The element to add it to
 */
function addElmAt(toAdd,index,target){
	if(index>=target.children.length){
		target.appendChild(toAdd);
	}else{
		target.insertBefore(toAdd,target.children[index])
	}
}
/**
 * Gets the index of an element in its parent
 * 
 * @param {HTMLElement} target The element to get the index of
 * @returns The index of the element
 */
function getElmIdx(target){
	return [...target.parentNode.children].indexOf(target);
}
/**
 * Replaces an element with another element or list of elements
 * 
 * @param {HTMLElement} target The element to replace
 * @param {HTMLElement|HTMLElement[]} replaceWith The element or list of elements to replace it with
 * @param {boolean} keep If the element being replaced should be kept, if false it will be removed
 */
function replaceElm(target,replaceWith,keep=false){
	if(target.parentNode==null){
		// If there is no parent then there is no location to replace from
		return;
	}
	if(isIterable(replaceWith)){
		// Make sure it is an array so items don't disappear as we add them
		let addList=[...replaceWith];
		// If a list of replacement objects was given then run replaceElm on each of them
		// Make sure to keep the element around so the next item can find it too
		addList.forEach(n=>replaceElm(target,n,true));
	}else{
		// Of a single element was given to replace with then just insert it
		target.parentNode.insertBefore(replaceWith,target);
	}
	if(!keep){
		// If the object being replaced shouldn't be kept then remove it
		target.remove();
	}
}
/**
 * Adds a class or list of classes to an element
 * 
 * @param {string} classes A string representing the classes to add, separate multiple classes with a space
 * @param {HTMLElement} elm The element to add the class to
 */
function addClass(classes,elm){
	let classSplit=classes.split(" ");
	for(let i=0;i<classSplit.length;i++){
		elm.classList.add(classSplit[i]);
	}
}
/**
 * Removes a class or list of classes from an element
 * 
 * @param {string} classes A string representing the classes to remove, separate multiple classes with a space
 * @param {HTMLElement} elm The element to remove the class from
 */
function removeClass(classes,elm){
	let classSplit=classes.split(" ");
	for(let i=0;i<classSplit.length;i++){
		elm.classList.remove(classSplit[i]);
	}
}
/**
 * Finds an element
 * 
 * @param {string} selector The query selector
 * @param {HTMLElement} target The element to query or null for the entire document
 * @returns The element matching the query
 */
function getElm(selector,target){
	if(target!=null){
		return target.querySelector(selector);
	}
	return document.querySelector(selector);
}
/**
 * Finds a list of zero or more elements
 * 
 * @param {string} selector The query selector
 * @param {HTMLElement} target The element to query or null for the entire document
 * @returns The list of elements matching the query
 */
function getElms(selector,target){
	if(target!=null){
		return target.querySelectorAll(selector);
	}
	return document.querySelectorAll(selector);
}
/**
 * Removes all child elements from an element
 * 
 * @param {HTMLElement} target The element to clear 
 */
function clearElm(target){
	while(target.firstChild) {
		target.removeChild(target.lastChild);
	}
}
/**
 * Checks if a value is iterable
 * 
 * @param {*} toTest The value to test
 * @returns If the value is an iterable object
 */
function isIterable(toTest){
	if (toTest==null||typeof toTest!="object") {
		return false;
	}
	return typeof toTest[Symbol.iterator]=='function';
}

//#endregion