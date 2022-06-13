class Item extends CustomElm{
	constructor(item){
		super();
		this.define(html`
		<span style="background-color:#105050">
			${item}
		</span>
		`(item));
	}
}
defineElm(Item);

let testList=bind([10,20,"test"]);

let testRepeater=html`
<h1>Repeater</h1>
<button
	onclick="${fire(()=>{
		let randomId=(Math.random()+1).toString(36).substring(7);
		testList.push("Item - "+randomId);
	})}"
>
	Add New Item
</button>

${()=>testList.map(
	(n,i)=>
	html`
		<div>
			Index: ${i} Value: ${new Item(n)} - 
				<button
				onclick="${fire(()=>{testList.splice(i,1)})}"
			>
				Remove Item
			</button>
		</div>
	`(n)
)}
`(testList);

addElm(testRepeater.data,document.body);
testRepeater.data.disolve(); // This disolve doesn't need to be here if this gets used within a custom element