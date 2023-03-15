class ElementExamples extends CustomElm{
	constructor(){
		super();
		let text=bind("test");

		let toggle=bind(true);
		let invToggle=def(()=>!toggle.data,toggle);
		let item1Name=bind("Item 1");
		let item2Name=bind("Item 2");
		let item1BtnText=def(()=>"Open "+item1Name.data,item1Name);
		let item2BtnText=def(()=>"Open "+item2Name.data,item2Name);

		let list=bind(["An item","Another item","Some other item"]);

		let htmlText=bind(`<li>some text</li>`);


		this.define(html`
			<div class="line"><h3>EX 1</h3></div>
			<div class="ex1">
				<p class="center">This is an example of two linked text inputs</p>
				<div>
					${new Input(text)}
					${new Input(text)}
				</div>
				<p class="center">
					The text currently is:<br/>
					<span>${html`${text}`(text)}</span>
				</p>
			</div>

			<div class="line"><h3>EX 2</h3></div>
			<div class="ex2">
				<p class="center">This is an example of a conditional switch</p>
				<div class="buttons">
					${new ButtonClickable(item1BtnText,()=>{toggle.data=true},toggle)}
					${new ButtonClickable(item2BtnText,()=>{toggle.data=false},invToggle)}
				</div>
				<div class="item">
				${html`
					${
						// NOTE: This will create a new html`` everytime it updates.
						// And currently because of the subscriptions the hold html`` instances won't get garbage collected.
						// In the future if the subscriptions are changed to weakmaps this should get fixed.
						()=>toggle.data?
						html`
							<p class="center">
								Hello! I am ${item1Name}<br>
								You can rename me though:
							</p>
							${new Input(item1Name)}
						`(item1Name):
						html`
							<p class="center">
								Hey there, I am ${item2Name}<br>
								You can rename me though:
							</p>
							${new Input(item2Name)}
						`(item2Name)
				}`(toggle)}
				</div>
			</div>

			<div class="line"><h3>EX 3</h3></div>
			<div class="ex3">
				<p class="center">This is an example of a list</p>
				<div class="buttons">
					${new ButtonClickable("Add Item",()=>{
						// Lock the list before doing any operations on it
						// This ensures that it will only fire a maximum of one update event
						list.lock();
						list.unshift("new item "+Math.floor(Math.random()*1000));
						list.unlock();
					})}
				</div>
				<div class="list">
					${html`
						<p>Length: ${()=>list.length}</p> 
						<ul>
							${()=>
								list.map((item,i)=>{
									return html`
										<li>
											<span class="index">${i}</span>
											${item} ${new ButtonLink("(remove)",()=>{
												// Lock the list before doing any operations on it
												// This ensures that it will only fire a maximum of one update event
												list.lock();
												list.splice(i,1);
												list.unlock();
											})}
										</li>
									`(item)
									}
								)
							}
						</ul>
					`(list)}
				</div>
				<div class="buttons">
					${new ButtonLink("(rename a random Item)",()=>{
						if(list.length>0){
							let index=Math.floor(Math.random()*list.length);
							list[index].data="renamed item "+Math.floor(Math.random()*1000);
						}
					})}
				</div>
			</div>

			<div class="line"><h3>EX 4</h3></div>
			<div class="ex4">
				<p class="center">String rendering with HTML parsing</p>
				<div>
					${new Input(htmlText)}
				</div>
				<p class="center">
					The text currently is:<br/>
					<div class="html">${html`${htmlText}`(htmlText)}</div>
				</p>
			</div>

			<div class="line"><h3>EX 5</h3></div>
			<div class="ex5">
				<p class="center">String rendering without HTML parsing</p>
				<div>
					${new Input(htmlText)}
				</div>
				<p class="center">
					The text currently is:<br/>
					<span class="text">${html`${()=>safe(htmlText.data)}`(htmlText)}</span>
				</p>
			</div>
		`);
	}
}
defineElm(ElementExamples,scss`&{
	> .line{
		border-bottom: 4px solid ${theme.color.greyStep(0)};
		${theme.center}
		margin: 40px 30px;
		h3{
			color: ${theme.color.greyStep(3)};
			background-color: ${theme.color.greyStep(-1)};
			padding: 0 20px;

			font-weight: 700;
			${theme.font.fontSizeStep(-1)}
			position: absolute;
		}
	}
	> .ex1{
		> div{
			${theme.center}
			> ${Input}{
				margin: 20px;
			}
		}
		span{
			font-weight: 700;
			padding: 0 20px;
			border-radius: 20px;
			background-color: ${theme.color.greyStep(1)};
		}
	}
	> .ex2{
		> .buttons{
			${theme.center}
			> ${ButtonClickable}{
				margin: 20px;
			}
		}
		> .item{
			> ${Input}{
				${theme.center}
			}
		}
	}
	> .ex3{
		> .buttons{
			${theme.center}
			> ${ButtonClickable}{
				margin: 20px;
			}
		}
		> .list{
			${theme.center}
			> *{
				flex-basis: 0;
				flex-grow: 1;
				margin: 0;
			}
			> p{
				text-align: right;
				margin-right: 20px;
			}
			li{
				margin: 10px 0;
				display: flex;

				${ButtonLink}{
					margin-left: 10px;
				}
			}
			.index{
				${theme.center}
				font-weight: 700;
				width: 40px;
				border-radius: 20px;
				background-color: ${theme.color.greyStep(1)};
				margin-right: 10px;
			}
		}
	}
	> .ex4{
		> div{
			${theme.center}
			> ${Input}{
				margin: 20px;
			}
		}
		.html{
			${theme.center}
			min-height: 100px;
			background-color: ${theme.color.greyStep(-0.5)};
		}
	}
	> .ex5{
		> div{
			${theme.center}
			> ${Input}{
				margin: 20px;
			}
		}
		.text{
			padding: 0 20px;
			border-radius: 20px;
			background-color: ${theme.color.greyStep(0)};
		}
	}
}`);

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
`().data;
addElm(body,document.body);
body.disolve();

