// Create global page styles
createStyles(scss`&{
	background-color: ${theme.color.greyStep(-1)};
}`());

// Create data
let title=bind("Elements");
let pages=bind([
	{
		id:"elements",
		text:"Elements",
		selected:true,
		content: new ElementPage()
	},
	{
		id:"about",
		text:"About",
		selected:false,
		content: new AboutPage()
	},
]);

// Set up paging
let selectedPage=bind(null);
selectedPage.data=getSelectedPage();
function getSelectedPage(){
	return pages.find(a=>a.selected.data);
}
function setPage(id){
	pages.forEach(a=>a.selected.data=a.id.data==id);
	selectedPage.data=getSelectedPage();
}

// Set up scroll watcher
let scrollPosition=bind(0);
document.addEventListener('scroll', ()=>{
	scrollPosition.data=window.scrollY;
});

// Create main elements
let headerElm=new Header(title);
let navElm=new Nav(pages,scrollPosition);
let pageElm=new Page(selectedPage);

// Populate page html
let body=html`
	${headerElm}
	${navElm}
	${pageElm}
`();
addElm(body,document.body);
body.disolve();

