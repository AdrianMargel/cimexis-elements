
/*

	This file is kind of a mess, or at least the styles are.
	The CSS still isn't very elagent and many of the things I tried to midigate that are still very experimental.
	However the elements themselves I'm pretty happy with.

	A better reference to look at is the example.js file 

*/

function sigmoid(x){
	return 1/(1+Math.pow(Math.E,-x));
}
function blendColors(col1,col2,mix){
	let invMix=1-mix;
	return new Color(
		col1.r*invMix+col2.r*mix,
		col1.g*invMix+col2.g*mix,
		col1.b*invMix+col2.b*mix,
		col1.a*invMix+col2.a*mix,
	);
}
function blendValues(v1,v2,mix){
	let invMix=1-mix;
	return v1*invMix+v2*mix;
}
let theme;
{
	let white=new Color(1,1,1);
	let black=new Color(0,0,0);

	let colorScale=(a,base)=>{
		// a = [0,1]
		let blend=(a-0.5)*2;

		if(blend>0){
			return blendColors(base,white,blend);
		}else{
			return blendColors(base,black,-blend);
		}
	};
	let greyStep=(a)=>{
		// a = (-infinity,infinity)
		let base=new Color("#36363F");

		let minCol=Math.min(base.r,base.g,base.b);
		let maxCol=Math.max(base.r,base.g,base.b);

		let darkDist=maxCol;
		let lightDist=1-minCol;
		let totalDist=darkDist+lightDist;

		let lightScale=lightDist/totalDist;
		let darkScale=darkDist/totalDist;

		if(a>0){
			a*=darkScale;
		}else{
			a*=lightScale;
		}
		a*=0.6;
		return colorScale(sigmoid(a),base);
	};
	let genericStep=(a,maxSize,minSize,mid)=>{
		let smallDist=mid-minSize;
		let bigDist=maxSize-mid;
		let totalDist=smallDist+bigDist;

		let smallScale=smallDist/totalDist;
		let bigScale=bigDist/totalDist;
		if(a>0){
			a*=smallScale;
			let blend=(sigmoid(a)-0.5)*2;
			return blendValues(mid,maxSize,blend);
		}else{
			a*=bigScale;
			let blend=(sigmoid(a)-0.5)*2;
			return blendValues(mid,minSize,-blend);
		}

	}
	let fontSizeStep=(a)=>{
		return "font-size:"+Math.floor(genericStep(a,150,10,24))+"px;";
	}
	let boxShadowStep=(a)=>{
		return "box-shadow: 0 0 "+genericStep(a,80,0,30)+"px #00000080;";
	}
	let primary=`font-family: 'Sen', sans-serif;`;
	let secondary=`font-family: 'Montserrat', sans-serif;`;
	let center=`
		display: flex;
		justify-content: center;
		align-items: center;
	`;
	let centerX=`
		display: flex;
		justify-content: center;
	`;
	let centerY=`
		display: flex;
		align-items: center;
	`;
	let centerText=`text-align: center;`;
	theme={
		color:{
			greyStep,
			highlight: "#7AC16C",
			white,
			black
		},
		font:{
			primary,
			secondary,
			fontSizeStep,
			standard:`
				font-weight: 400;
				${secondary}
				${fontSizeStep(0)}
			`,
			title:`
				font-weight: 700;
				${primary}
				${centerText}
				${fontSizeStep(2)}
			`
		},
		elementReset:`
			display: block;
		`,
		boxShadowStep,
		center,
		centerX,
		centerY,
		centerText
	}
}

//${Array.apply(null, Array(10)).map((_,i)=>`<div style="${theme.boxShadowStep(i-5)}">TEST${i-5}</div>`)}

class Input extends CustomElm{
	constructor(text){
		super();
		text=bind(text);
		this.define(html`
			<input
				value=${attr(text)(text)}
				oninput=${attr(act((event)=>{
					text.data=event.target.value;
				}))()}
			/>
		`);
	}
}
defineElm(Input);

class ButtonClickable extends CustomElm{
	constructor(text,event,selected=false){
		super();
		text=bind(text);
		event=bind(event);
		selected=bind(selected);
		this.define(html`
			<button
				class=${attr(()=>selected.data?"selected":"")(selected)}
				onclick=${attr(act(event.data))(event)}
			>
				<div class="surface">
					${html`${text}`(text)}
				</div>
				<div class="selector"><div></div></div>
			</button>
		`);
	}
}
defineElm(ButtonClickable,scss`&{
	>button{
		position: relative;
		padding: 0;
		border: none;
		background-color: #58934C;
		border-radius: 6px;
		${theme.boxShadowStep(-3)}
		.surface{
			font-family: 'Sen', sans-serif;
			font-weight: 700;
			font-size: 20px;
			color: white;
			background-color: #7AC16C;
			border: none;
			padding: 10px 30px;
			border-radius: 6px;
			position: relative;
			bottom: 10px;
			transition: bottom 0.1s;
		}
		.selector{
			opacity: 0;
			position: absolute;
			border: 12px solid transparent;
			border-bottom-color: #28282E;
			width: 0;
			height: 0;
			bottom: -12px;
			right: calc(50% - 12px);
			transition: bottom 0.4s, opacity 0.4s;
			div{
				position: absolute;
				border: 10px solid transparent;
				border-bottom-color: white;
				width: 0;
				height: 0;
				top: -4px;
				right: calc(50% - 10px);
			}
		}
		&.selected .selector{
			opacity: 1;
			bottom: -6px;
		}
		&:active .surface{
			bottom: 4px;
		}
		&:active .selector{
			bottom: -12px;
		}
	}
}`);

class ButtonLink extends CustomElm{
	constructor(text,event){
		super();
		text=bind(text);
		event=bind(event);
		this.define(html`
			<button
				onclick=${attr(act(event.data))(event)}
			>
				${html`${text}`(text)}
			</button>
		`);
	}
}
defineElm(ButtonLink,scss`&{
	>button{
		margin: 0;
		padding: 0;
		display: inline;
		cursor: pointer;
		background-color: transparent;
		color: #7AC16C;
		&:hover{
			text-decoration: underline;
		}
	}
}`);

class Header extends CustomElm{
	constructor(text){
		super();
		this.define(html`
			<div class="back"></div>
			<h1>Cimexis ${html`${text}`(text)}</h1>
		`);
	}
}
defineElm(Header,(()=>{
	let size="400px";

	return scss`&{
		${theme.elementReset}
		${theme.center}
		height: ${size};
		background-color: ${theme.color.greyStep(0)};
		z-index: 2;
		position: relative;
		> .back{
			position: absolute;
			height:${size};
			width:${size};
			background-image: url('./img/logo.png');
			background-size: contain;
			background-repeat: no-repeat;
			background-position: center;
		}
		> h1{
			position: relative;
			margin-top: ${3+5}px;
			padding-bottom: 5px;
			background-color: ${theme.color.greyStep(0)};
			${theme.font.title}
		}
	}`})()
);

//TODO: better list handling

class Nav extends CustomElm{
	constructor(items,scroll){
		super();
		let isDown;
		if(scroll!=null){
			isDown=def(()=>scroll.data>400,scroll);
		}else{
			isDown=bind(false);
		}
		let hasMid=def(()=>items.length%2==0,items);
		this.define(html`
			<div class=${attr(()=>isDown.data?"down":"")(isDown)}>
				${html`${
					()=>hasMid.data?
					`
						<div class="mid">
							<div class="cover"><div></div></div>
							<div class="shadowHider"></div>
							<div class="icon"></div>
						</div>
					`:""
				}`(hasMid)}
				${()=>{
					let list=items.map((a)=>html`
						<button
							onclick=${attr(act(()=>setPage(a.id.data)))}
							class=${attr(()=>a.selected.data?"selected":"")(a.selected)}
						>
						<span>${html`${a.text}`(a.text)}</span>
						</button>
					`());
					if(list.length%2==0){
						list.splice(Math.floor(list.length/2),0,newElm("div","midGap"));
					}
					return list;
				}}
			</div>
		`(items));
	}
}
defineElm(Nav,(()=>{
	let height="50px";
	let space="20px";
	let width="200px";
	let transWhite=new Color(theme.color.white);
	transWhite.a=0.5;

	return scss`
	&{
		${theme.elementReset}
		height: ${height};
	}
	>div{
		${theme.elementReset}
		${theme.center}
		height: ${height};
		background-color: ${theme.color.greyStep(0)};
		${theme.boxShadowStep(0)}
		position: relative;
		z-index: 1;
		button{
			transition: border-color 0.2s, color 0.2s;
			height: ${height};
			width: ${width};
			${theme.center}

			font-weight: 700;
			${theme.font.primary}
			${theme.centerText}
			${theme.font.fontSizeStep(-0.5)}
			color: ${transWhite};

			border: none;
			border-bottom: 4px solid;
			border-radius:0;
			background: none;
			padding: 0 ${space};
			padding-top: 4px;
			border-color: transparent;
			> span{
				z-index: 1;
			}
			&:hover{
				color: ${theme.color.white};
				border-color: ${transWhite};
			}
			&.selected{
				border-color: ${theme.color.highlight};
				color: ${theme.color.highlight};
			}
		}
		.mid{
			position: absolute;
			width: 100%;
			height: 100%;
			justify-content: center;
			display: flex;
			opacity: 0;
			transition: opacity 0.5s;
			pointer-events: none;
			.cover{
				position: absolute;
				transform: scaleY(0.8) rotate(-45deg)
				> div{
					width: 65px;
					height: 65px;
					background-color: #36363F;
					box-shadow: 0 0 30px #00000080;
				}
			}
			.shadowHider{
				background-color: #36363F;
				position: absolute;
				top: 0px;
				height: 35px;
				width: 100%;
			}
			.icon{
				width: 60px;
				height: 60px;
				background-image: url("./img/logoSmall.png");
				background-position: center;
				background-size: cover;
				position: absolute;
			}
		}
		.midGap{
			margin-right: 0;
			transition: margin 0.5s;
		}
		&.down{
			position: fixed;
			left: 0;
			right: 0;
			top: 0;
			.midGap{
				margin-right: 50px;
			}
			.mid{
				opacity: 1;
			}
		}


	}`})()
);

class EndSymbol extends CustomElm{
	constructor(){
		super();
		this.define(html`
			<div class="icon"></div>
			<div class="line"></div>
			<div class="cover"></div>
		`);
	}
}
defineElm(EndSymbol,scss`&{
	height: 70px;
	${theme.centerX}
	opacity: 0.2;
	position: absolute;
	bottom: 0;
	right: calc(50% - 90px);
	width: 180px;
	.icon{
		position: absolute;
		top: 0px;
		width: 60px;
		height: 60px;
		background-image: url("./img/logoSmall.png");
		background-position: center;
		background-size: cover;
		z-index: 2;
	}
	.line{
		position: absolute;
		top: 30px;
		width: 100%;
		border-top: 1px solid white;
	}
	.cover{
		position: absolute;
		top: 0px;
		width: 60px;
		height: 60px;
		background-color: #28282E;
	}
}`);

class Surface extends CustomElm{
	constructor(contentElement,width="md",invisible=false,isTop=false){
		super();
		isTop=bind(isTop,false);
		width=bind(width,false);
		invisible=bind(invisible,false);
		//width=sm,md,lg
		this.define(html`
			<div
				class=${attr(()=>{
					return [isTop.data?"top":"","size-"+width.data,invisible.data?"":"visible"].join(" ")
				})(isTop,width,invisible)}
			>
				${contentElement}
			</div>`);
	}
}
defineElm(Surface,scss`&{
	${theme.elementReset}
	width: 100%;
	${theme.centerX}
	> div{
		flex-grow:1;
		${theme.elementReset}
		margin: 0 100px;
		padding: 40px 40px;
		&.visible{
			border: 4px solid ${theme.color.greyStep(0)};
			background-color: ${theme.color.greyStep(-0.5)};
			${theme.boxShadowStep(-1)}
		}

		&.size-sm{
			max-width: 900px;
		}
		&.size-md{
			max-width: 980px;
		}
		&.size-lg{
			max-width: 1060px;
		}
		&.top{
			border-top: none;
			padding-top: 50px;
		}
		> *:first-child {
			margin-top:0;
		}
		> *:last-child {
			margin-bottom:0;
		}
}
}`);

class Page extends CustomElm{
	constructor(page){
		super();
		this.define(html`
			<div class="back">
				<div></div>
			</div>
			<div class="main">
				${()=>page.data?.content?.data??new MissingPage()}
			</div>
			<div class="foot">
				${new EndSymbol()}
			</div>
		`(page));
	}
}
defineElm(Page,scss`&{
	${theme.elementReset}
	${theme.centerY}
	flex-direction: column;
	position:relative;
	> .back{
		position: absolute;
		inset: 0;
		bottom: 100px;
		${theme.centerX}
		> div{
			${theme.boxShadowStep(-1)}
			flex-grow: 1;
			border: 4px solid ${theme.color.greyStep(0)};
			border-top: none;
			max-width: 900px;
			margin: 0 150px;
		}
	}
	> .main{
		width: 100%;
		position: relative;
		min-height: calc(100vh - 450px);
		${theme.centerX}
	}
	> .foot{
		margin-top: 20px;
		height: 80px;
		position: relative;
	}

	h2{
		text-align: center;
		${theme.font.fontSizeStep(3)}
		margin: 20px 0;
	}
	p{
		font-size: 20px;
		margin: 15px 40px;
		line-height: 1.4;
	}
	.handwritten{
		font-size: 30px;
		line-height: 1;
		letter-spacing: 0.1rem;
		font-family: 'Sue Ellen Francisco', cursive;
	}
}`);

class MissingPage extends CustomElm{
	constructor(){
		super();
		this.define(html`
			404 Error - Page Not Found
		`);
	}
}
defineElm(MissingPage,scss`&{

}`);

class ElementPage extends CustomElm{
	constructor(){
		super();
		this.define(html`
			${new Surface(html`
				<h2>Explanation</h2>
				<p class="center">This is a sample website to showcase development with custom elements.</p>
			`,"lg",false,true)}
			${new Surface(html`
				<h2>Examples</h2>
				${new ElementExamples()}
			`,"sm",true)}
		`);
	}
}
defineElm(ElementPage,scss`&{
	width: 100%;
	> .gap{
		height: 40px;
	}
	p.center{
		text-align: center;
	}
}`);

class AboutPage extends CustomElm{
	constructor(){
		super();
		this.define(html`
		<div class="gap"></div>
		${new Surface(html`
			<h2>About</h2>
			<p class="center">This is a sample website to showcase development with custom elements.</p>
		`,"sm",false)}
	`);
	}
}
defineElm(AboutPage,scss`&{
	width: 100%;
	> .gap{
		height: 40px;
	}
	p.center{
		text-align: center;
	}

}`);



// let a=html`<div>${html`<div>testA</div>`()}</div>`();
// let b=html`<div>${html`<div>testB</div>`()}</div>`();
// let sel=bind(null);
// sel.data=a;

// let body=html`
// test
// 	<div>${()=>sel}</div>
// 	<button onClick=${attr(act(()=>{
// 		sel.data=sel.data==a?b:a;
// 	}))}>change</button>
// `(sel).data;
// addElm(body,document.body);
// body.disolve();




// let testList=bind([10,20,"test"]);
// for(let i=0;i<500;i++){
// 	testList.push("test"+i);
// }
// testList.sub(()=>console.log("change"));

// let body=html`
// 	<h1>Repeater</h1>
// 	<button
// 		onClick=${attr(act(()=>{
// 			let randomId=(Math.random()+1).toString(36).substring(7);
// 			testList.lock();
// 			testList.unshift("Item - "+randomId);
// 			testList.unlock();
// 		}))}
// 	>
// 		Add New Item
// 	</button>

// 	${()=>testList.map(
// 		(n,i)=>
// 		html`
// 			<div>
// 				Index: ${i} Value: ${new Item(n)} - 
// 					<button
// 					onClick=${attr(act(()=>{
// 						testList.lock();
// 						testList.splice(i,1);
// 						testList.unlock();
// 					}))}
// 				>
// 					Remove Item
// 				</button>
// 			</div>
// 		`(n)
// 	)}
// `(testList).data;
// addElm(body,document.body);
// body.disolve();



