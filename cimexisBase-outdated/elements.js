//connected callback must be called before init, otherwise any elements created through innerHTML will not exist yet

class TextInput extends HTMLElement{
	constructor(){
		super();
		this.inputElm=newElm("input");
	}
	init(text){
		this.text=text;
		this.textChangeSub=()=>{this.update()};
		this.text.sub(bindType.SET,this.textChangeSub);
		this.update();

		this.inputElm.addEventListener('input', ()=>{this.set();});
	}
	connectedCallback(){
		appElm(this.inputElm,this);
		let afterElm=newElm("DIV","focused");
		appElm(afterElm,this);
	}
	update(){
		this.inputElm.value=this.text.data;
	}
	set(){
		newUpdate();
		this.text.data=this.inputElm.value;
	}
}
customElements.define('text-input', TextInput);

class TextDisplay extends HTMLElement{
	constructor(){
		super();
	}
	init(text){
		this.text=text;
		this.textChangeSub=()=>{this.update()};
		this.text.sub(bindType.SET,this.textChangeSub);
		this.update();
	}
	connectedCallback(){
	}
	update(){
		this.innerText=this.text.data;
	}
}
customElements.define('text-display', TextDisplay);

class NumberInput extends HTMLElement{
	constructor(){
		super();
		this.inputElm=newElm("input");
	}
	init(number){
		this.number=number;
		this.text=bind(this.number.data+"");
		this.textChangeSub=()=>{this.update()};
		this.text.sub(bindType.SET,this.textChangeSub);
		this.text.sub(bindType.SET,()=>{
			let num=parseFloat(this.text.data);
			if(!isNaN(num)){
				this.number.data=num;
			}else{
				this.number.data=0;
			}
		});
		this.number.sub(bindType.SET,()=>{
			let curr=parseFloat(this.text.data);
			if(isNaN(curr)){
				curr=0;
			}
			if(curr!==this.number.data){
				this.text.data=this.number.data+"";
			}
		});
		this.update();

		this.inputElm.addEventListener('input', ()=>{this.set();});
		this.inputElm.addEventListener('blur', ()=>{this.fullUpdate();});
	}
	connectedCallback(){
		appElm(this.inputElm,this);
		let afterElm=newElm("DIV","focused");
		appElm(afterElm,this);
	}
	update(){
		this.inputElm.value=this.text.data;
	}
	fullUpdate(){
		newUpdate();
		this.text.data=this.number.data+"";
		this.update();
	}
	set(){
		if(this.inputElm.value===""){
			newUpdate();
			this.text.data="";
		}else{
			if(isAlmostNumber(this.inputElm.value)){
				newUpdate();
				this.text.data=this.inputElm.value;
			}else{
				//if the number is definately wrong then reset the user input
				newUpdate();
				this.text.data=this.text.data;
			}
		}
	}
}
customElements.define('number-input', NumberInput);

class PriceInput extends HTMLElement{
	constructor(){
		super();
		this.inputElm=newElm("input");
	}
	init(number){
		this.number=number;
		this.text=bind(this.numToString(this.number.data));
		this.textChangeSub=()=>{this.update()};
		this.text.sub(bindType.SET,this.textChangeSub);
		this.text.sub(bindType.SET,()=>{
			let num=parseFloat(this.text.data.replace('$',''));
			if(!isNaN(num)){
				this.number.data=num;
			}else{
				this.number.data=0;
			}
		});
		this.number.sub(bindType.SET,()=>{
			let curr=parseFloat(this.text.data.replace('$',''));
			if(isNaN(curr)){
				curr=0;
			}
			if(curr!==this.number.data){
				this.text.data=this.numToString(this.number.data);
			}
		});
		this.fullUpdate();

		this.inputElm.addEventListener('input', ()=>{this.set();});
		this.inputElm.addEventListener('blur', ()=>{this.fullUpdate();});
	}
	numToString(num){
		let asString=num.toFixed(2);
		if(asString.includes("-")){
			asString=asString.replace("-","");
			asString="-$"+asString;
		}else{
			asString="$"+asString;
		}
		return asString;
	}
	connectedCallback(){
		appElm(this.inputElm,this);
		let afterElm=newElm("DIV","focused");
		appElm(afterElm,this);
	}
	update(){
		this.inputElm.value=this.text.data;
	}
	fullUpdate(){
		newUpdate();
		this.text.data=this.numToString(this.number.data);
		this.update();
	}
	set(){
		if(this.inputElm.value===""){
			newUpdate();
			this.text.data="";
		}else{
			if(isAlmostPrice(this.inputElm.value)){
				newUpdate();
				this.text.data=this.inputElm.value;
			}else{
				//if the number is definately wrong then reset the user input
				newUpdate();
				this.text.data=this.text.data;
			}
		}
	}
}
customElements.define('price-input', PriceInput);

class PriceDisplay extends HTMLElement{
	constructor(){
		super();
	}
	init(text){
		this.text=text;
		this.textChangeSub=()=>{this.update()};
		this.text.sub(bindType.SET,this.textChangeSub);
		this.update();
	}
	connectedCallback(){
	}
	update(){
		let cleanedVal="$"+(this.text.data.toFixed(2))
		this.innerText=cleanedVal;
	}
}
customElements.define('price-display', PriceDisplay);

class ListRepeater extends HTMLElement{
	constructor(){
		super();
	}

	//list is the bound list used
	//mappingFunc is the way to convert from a single item in the list to an element
	init(list,mappingFunc){
		this.list=list;
		this.addSub=(info)=>{this.addItem(info.bound,info.index)};
		this.removeSub=(info)=>{this.removeItem(info.index)};
		this.setSub=(info)=>{this.setItem(info.bound,info.prop)};
		this.list.sub(bindType.ADD,this.addSub);
		this.list.sub(bindType.REMOVE,this.removeSub);
		this.list.sub(bindType.SET,this.setSub);
		this.mappingFunc=mappingFunc;
		this.elmList=[];
		for(let i=0;i<this.list.length;i++){
			this.addItem(this.list[i],i);
		}
	}
	connectedCallback(){

	}
	setItem(item,index){
		this.removeItem(index);
		this.addItem(item,index);
	}
	addItem(item,index){
		let toAdd=this.mappingFunc();
		appElmAt(toAdd,index,this);
		toAdd.init(item,this.list);
		this.elmList.splice(index,0,toAdd);
	}
	removeItem(index){
		this.elmList[index].remove();
		this.elmList.splice(index,1);
	}
}
customElements.define('list-repeater', ListRepeater);

class Header extends HTMLElement{
	constructor(){
		super();
	}
	init(categories,title,isDown){
		this.introElm.init(title);
		this.navElm.init(categories,isDown);
	}
	connectedCallback(){
		this.introElm=new Intro();
		this.navElm=new Nav();
		appElm(this.introElm,this);
		appElm(this.navElm,this);
	}
}
customElements.define('header-control', Header);

class Intro extends HTMLElement{
	constructor(){
		super();
	}
	init(title){
		this.headElm.init(title);
	}
	connectedCallback(){
		this.headElm=new IntroHead();
		appElm(this.headElm,this);
	}
}
customElements.define('intro-control', Intro);

class IntroHead extends HTMLElement{
	constructor(){
		super();
	}
	init(title){
		this.titleElm.init(title);
	}
	connectedCallback(){
		this.innerHTML=`
			<div class="icon"></div>
			<div class="title">
				<h1>Cimexis <text-display class="titleText"></text-display></h1>
			</div>
		`;
		this.titleElm=getElm(".titleText",this);
	}
}
customElements.define('intro-head', IntroHead);

class Nav extends HTMLElement{
	constructor(){
		super();
	}
	init(categories,isDown){
		this.isDown=isDown;
		this.downSub=()=>{this.update()};
		this.isDown.sub(bindType.SET,this.downSub);
		this.categoriesElm.init(categories);
		this.update();
	}
	connectedCallback(){
		this.innerHTML=`
			<div class="mid">
				<div class="cover"><div></div></div>
				<div class="shadowHider"></div>
				<div class="icon"></div>
			</div>
		`;
		this.categoriesElm=new CategoryList();
		appElm(this.categoriesElm,this);
	}
	update(){
		if(this.isDown.data){
			this.classList.add("down");
		}else{
			this.classList.remove("down");
		}
	}
}
customElements.define('nav-control', Nav);

class CategoryList extends HTMLElement{
	constructor(){
		super();
	}
	init(categories){
		this.repeaterElm.init(categories,()=>{return new CategoryItem()});
	}
	connectedCallback(){
		this.repeaterElm=new ListRepeater();
		appElm(this.repeaterElm,this);
	}
}
customElements.define('category-list', CategoryList);

class CategoryItem extends HTMLElement{
	constructor(){
		super();
	}
	init(category){
		this.selected=category.selected;
		this.selSub=()=>{this.update()};
		this.selected.sub(bindType.SET,this.selSub);
		this.textDisp.init(category.name);
		this.update();
		this.btn.onclick=()=>{this.select()};
		if(category.isMid.data){
			this.classList.add("midGap");
		}
	}
	connectedCallback(){
		this.btn=newElm("button");
		this.textDisp=new TextDisplay();
		appElm(this.btn,this);
		appElm(this.textDisp,this.btn);
	}
	update(){
		if(this.selected.data){
			this.classList.add("selected");
		}else{
			this.classList.remove("selected");
		}
	}
	select(){
		newUpdate();
		this.selected.data=true;
	}
}
customElements.define('category-item', CategoryItem);

class Body extends HTMLElement{
	constructor(){
		super();
	}
	init(pages){
		this.repeaterElm.init(pages,()=>{return new Page()});
	}
	connectedCallback(){
		this.repeaterElm=new ListRepeater();
		appElm(this.repeaterElm,this);
	}
}
customElements.define('body-control', Body);

class Page extends HTMLElement{
	constructor(){
		super();
	}
	init(page){
		this.selected=page.selected;
		this.selSub=()=>{this.update()};
		this.selected.sub(bindType.SET,this.selSub);
		this.update();

		let type=page.type.data;
		let pageInner=null;
		switch (type){
			case "Home":
				pageInner=new HomePage();
				break;
			case "About":
				pageInner=new AboutPage();
				break;
		}
		if(pageInner!==null){
			appElm(pageInner,this);
			pageInner.init(page.content);
		}
	}
	connectedCallback(){
		let end=new EndSymbol();
		appElm(end,this);
	}
	update(){
		if(this.selected.data){
			this.classList.add("selected");
		}else{
			this.classList.remove("selected");
		}
	}
}
customElements.define('page-control', Page);

class HomePage extends HTMLElement{
	constructor(){
		super();
	}
	init(content){
		let exampleSharedData={
			text: "Sample text",
			number: 1,
			price: 1.50,
			priceList:[
				0.12, 20, 6.01
			]
		};
		exampleSharedData=bind(exampleSharedData,true);

		this.classList.add("content");
		let title=content.title.data;
		let titleElm=newElm("h2");
		titleElm.innerText=title;
		appElm(titleElm,this);

		{
			this.addElementIntro("Text Input");
			let currSection=newElm("section");
			appElm(currSection,this);
			let descElm=newElm("p");
			descElm.innerHTML="A basic text input.";
			appElm(descElm,currSection);

			let textInElm1=new TextInput();
			appElm(textInElm1,currSection);
			textInElm1.init(exampleSharedData.text);
			let textInElm2=new TextInput();
			appElm(textInElm2,currSection);
			textInElm2.init(exampleSharedData.text);
		}
		{
			this.addElementIntro("Text Display");
			let currSection=newElm("section");
			appElm(currSection,this);
			let descElm=newElm("p");
			descElm.innerHTML="A basic text display.";
			appElm(descElm,currSection);

			let textOutElm=new TextDisplay();
			appElm(textOutElm,currSection);
			textOutElm.init(exampleSharedData.text);
		}
		{
			this.addElementIntro("Number Input");
			let currSection=newElm("section");
			appElm(currSection,this);
			let descElm=newElm("p");
			descElm.innerHTML="A basic number input.";
			appElm(descElm,currSection);

			let numInElm1=new NumberInput();
			appElm(numInElm1,currSection);
			numInElm1.init(exampleSharedData.number);

			let numInElm2=new NumberInput();
			appElm(numInElm2,currSection);
			numInElm2.init(exampleSharedData.number);
		}
		{
			this.addElementIntro("Price Input");
			let currSection=newElm("section");
			appElm(currSection,this);
			let descElm=newElm("p");
			descElm.innerHTML="A basic price input.";
			appElm(descElm,currSection);

			let priceInElm1=new PriceInput();
			appElm(priceInElm1,currSection);
			priceInElm1.init(exampleSharedData.price);
			
			let priceInElm2=new PriceInput();
			appElm(priceInElm2,currSection);
			priceInElm2.init(exampleSharedData.price);
		}
		{
			this.addElementIntro("Price Display");
			let currSection=newElm("section");
			appElm(currSection,this);
			let descElm=newElm("p");
			descElm.innerHTML="A basic price display.";
			appElm(descElm,currSection);

			let priceOutElm=new PriceDisplay();
			appElm(priceOutElm,currSection);
			priceOutElm.init(exampleSharedData.price);
		}
		{
			this.addElementIntro("Price Calculator");
			let currSection=newElm("section");
			appElm(currSection,this);
			let descElm=newElm("p");
			descElm.innerHTML="An example of a more complex control using list-repeaters. This was created primarily as an example of the more complex functionality that can be achieved with custom elements. The aesthetics for this control would clearly need some work before it could be used in a real project.";
			appElm(descElm,currSection);

			let priceCalcElm=new PriceCalculator();
			appElm(priceCalcElm,currSection);
			priceCalcElm.init(exampleSharedData.priceList);
		}
	}
	addElementIntro(name){
		let titleElm=new SectionTitle();
		titleElm.init(name);
		appElm(titleElm,this);
	}
	connectedCallback(){
	}
}
customElements.define('home-page', HomePage);

class AboutPage extends HTMLElement{
	constructor(){
		super();
	}
	init(content){
		this.classList.add("content");
		let title=content.title.data;
		let titleElm=newElm("h2");
		titleElm.innerText=title;
		appElm(titleElm,this);

		let description=content.content.data;
		let descElm=newElm("div");
		descElm.innerHTML=description;
		appElm(descElm,this);
	}
	connectedCallback(){
	}
}
customElements.define('about-page', AboutPage);

class EndSymbol extends HTMLElement{
	constructor(){
		super();
	}
	init(){
		
	}
	connectedCallback(){
		this.innerHTML=`
			<div class="icon"></div>
			<div class="line"></div>
			<div class="cover"></div>
		`;
	}
}
customElements.define('end-symbol', EndSymbol);

class PriceCalculator extends HTMLElement{
	constructor(){
		super();
	}
	init(list){
		this.list=list;
		this.repeaterElm.init(this.list,()=>{return new PriceItem()});
		
		//calculate the price subtotal
		//create a bound object to hold the results
		this.subtotalVal=bind(null);
		//create an update function
		this.subtotalSub=()=>{
			let total=0;
			for(let i=0;i<this.list.length;i++){
				let val=this.list[i].data;
				if(typeof val==="number"){
					total+=val;
				}
			}
			this.subtotalVal.data=total;
		};
		//subscribe to update everytime the list changes
		this.list.sub(bindType.ALL,this.subtotalSub);
		//subscribe to each item in the list to update if any of them change
		for(let i=0;i<this.list.length;i++){
			this.list[i].sub(bindType.SET,this.subtotalSub);	
		}
		//subscribe so any new items will have subscriptions added to them
		//this is to make sure that when any value in the list changes this value updates
		this.list.sub(bindType.ADD,(info)=>{
			let index=info.index;
			this.list[index].sub(bindType.SET,this.subtotalSub);
		});
		//subscribe so any new items will have subscriptions removed from them
		//this will rarely matter unless the object is used outside of the list
		this.list.sub(bindType.REMOVE,(info)=>{
			info.removed.unSub(bindType.ALL,this.subtotalSub);
		});
		//trigger an update to initialize the value
		this.subtotalSub();

		//calculate the gst
		//create a bound object to hold the results
		this.gstVal=bind(null);
		//create an update function
		this.gstSub=()=>{
			this.gstVal.data=this.subtotalVal.data*0.05;
		};
		//subscribe to update everytime the total changes
		this.subtotalVal.sub(bindType.SET,this.gstSub);
		//trigger an update to initialize the value
		this.gstSub();

		//calculate the total
		//create a bound object to hold the results
		this.totalVal=bind(null);
		//create an update function
		this.totalSub=()=>{
			this.totalVal.data=this.subtotalVal.data+this.gstVal.data;
		};
		//subscribe to update everytime the gst changes
		this.gstVal.sub(bindType.SET,this.totalSub);
		//trigger an update to initialize the value
		this.totalSub();

		this.addBtn.onclick=()=>{this.newItem()};
		this.subtotalElm.init(this.subtotalVal);
		this.gstElm.init(this.gstVal);
		this.totalElm.init(this.totalVal);

	}
	connectedCallback(){
		this.repeaterElm=new ListRepeater();
		this.addBtn=newElm("button","positive");
		this.addBtn.innerText='Add New';
		this.subtotalElm=new PriceDisplay();
		this.gstElm=new PriceDisplay();
		this.totalElm=new PriceDisplay();
		appElm(this.repeaterElm,this);
		appElm(this.addBtn,this);
		appElm(this.subtotalElm,this);
		appElm(this.gstElm,this);
		appElm(this.totalElm,this);
	}
	newItem(){
		newUpdate();
		this.list.add(0);
	}
}
customElements.define('price-calculator', PriceCalculator);
class PriceItem extends HTMLElement{
	constructor(){
		super();
		this.dispElm=new PriceInput();
	}
	init(item,list){
		this.list=list;
		this.item=item;
		this.dispElm.init(this.item);
		this.removeBtn.onclick=()=>{this.removeItem()};
	}
	connectedCallback(){
		this.removeBtn=newElm("button","negative");
		this.removeBtn.innerText='Remove';
		appElm(this.dispElm,this);
		appElm(this.removeBtn,this);
	}
	removeItem(){
		newUpdate();
		this.list.removeItem(this.item);
	}
}
customElements.define('price-item', PriceItem);

class SectionTitle extends HTMLElement{
	constructor(){
		super();
		this.dispElm=new PriceInput();
	}
	init(textSimple){
		this.innerHTML=`
			<h3 class="">${textSimple}</h3>
			<div class="cover"></div> 	
		`;
	}
	connectedCallback(){
	}
}
customElements.define('section-title', SectionTitle);

