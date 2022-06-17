var sharedData={
	pageToggle: [true,false]
}
bind(sharedData,true);
var pageData={
	title: "Elements",
	categoryIndex: 0,
	categoriesDown: false,
	categories:
	[
		{
			name: "Elements",
			selected: sharedData.pageToggle[0],
			isMid: true
		},
		{
			name: "About",
			selected: sharedData.pageToggle[1],
			isMid: false
		}
	],
	pages:
	[
		{
			name: "Elements",
			type: "Home",
			selected: sharedData.pageToggle[0],
			content: {
				title: "Elements"
			}
		},
		{
			name: "About",
			type: "About",
			selected: sharedData.pageToggle[1],
			content: {
				title: "About",
				content: `
					<p>This is an example project using custom elements to be used as a base of reference.
					The custom elements created and shown here are all reusable.
					</p>
					<p>This also doubles as a kind of style guide for future Cimexis projects.</p>
				`
			}
		}

	]
};
pageData=bind(pageData,true);

for(let i=0;i<pageData.categories.length;i++){
	//create sub to update index when a category is selected
	pageData.categories[i].selected.sub(bindType.SET,()=>{
		if(pageData.categories[i].selected.data){
			pageData.categoryIndex.data=i;
		}
	});
	//create sub to update each category when the index changes
	pageData.categoryIndex.sub(bindType.SET,()=>{
		pageData.categories[i].selected.data=pageData.categoryIndex.data===i;
	});
}

//update nav based on scroll
document.addEventListener("scroll", checkStickyNav);
function checkStickyNav(){
	if(window.scrollY>400){
		if(!pageData.categoriesDown.data){
			newUpdate();
			pageData.categoriesDown.data=true;
		}
	}else{
		if(pageData.categoriesDown.data){
			newUpdate();
			pageData.categoriesDown.data=false;
		}
	}
}

//add elements
{
	let header=new Header();
	appElm(header,document.body);
	header.init(pageData.categories,pageData.title,pageData.categoriesDown);

	let body=new Body();
	appElm(body,document.body);
	body.init(pageData.pages);

	//let priceCalculator=new PriceCalculator();
	//appElm(priceCalculator,document.body);
	//priceCalculator.init(sharedData.priceList);
}