// (c) RUSSIANEASY.NET Liam Hahne 2014
// Get all the text nodes in the document, and replace any Cyrillic characters found with RUSSIANEASY equiv.
$(getTextNodesIn(document)).each(function(index, el) {
    var $el, text, chars, i, len, c, chameleo, frag, match, phonetic, not_latin=0;
    $el = $(el), text = $el.text(), chars = [], frag = document.createDocumentFragment();

    // Walk through the text in this node one character at a time.
    for (i = 0, len = text.length; i < len; i++) {
        c = text[i], chameleo = _charmap[c];

        // If the char was in our map (i.e. it's a cyrillic char), replace it with russianeasy
        if (chameleo) {
		not_latin=1;
            if (chars.length) {
                frag.appendChild(document.createTextNode(chars.join('')));
                chars = [];
            }
            chars.push(chameleo);
        }
        else
            chars.push(c);
    }

    // Add any remaining chars to the document fragment.
    if (chars.length)
        frag.appendChild(document.createTextNode(chars.join('')));

if (not_latin==1){	
if (-10>-1) {$(el).replaceWith(frag);}
else {	
var frag2 = document.createDocumentFragment();
frag2.appendChild(document.createTextNode(text));
frag2.appendChild(document.createElement("br"));
frag2.appendChild(frag);

    // Replace the text node with the fragment we've assembled, so can still check translations nice bubble translate
    $(el).replaceWith(frag2);}
}
});

// Selects all decendent text nodes of an element.
// http://stackoverflow.com/questions/298750/how-do-i-select-text-nodes-with-jquery
function getTextNodesIn(node, includeWhitespaceNodes) {
    var textNodes = [], whitespace = /^\s*$/;

    function getTextNodes(node) {
        if (node.nodeType == 3) {
            if (includeWhitespaceNodes || !whitespace.test(node.nodeValue)) {
                textNodes.push(node);
            }
        } else {
            for (var i = 0, len = node.childNodes.length; i < len; ++i) {
                getTextNodes(node.childNodes[i]);
            }
        }
    }

    getTextNodes(node);
    return textNodes;
}