//do not break on enter
var sectionTags=[
	"div",
	"td",
	"section",
	"body"
];
//split up through the block we are in
var inlineTags={
	"span",
	"em",
	"strong",
	"sub",
	"sup"
};
//split on enter
var blockTags={
	"p",
	"li"//technicality allows p inside of li but shhhh
};

function SplitNode(range){
	var parent=range.commonAncestorContainer;
	while(sectionTags.indexOf(parent)==-1) {
		parent=range.commonAncestorContainer;
	}
	var cRange=range.cloneRange();
	cRange.setStart(parent,0);
	range.insertNode(cRange.extractContents());
}