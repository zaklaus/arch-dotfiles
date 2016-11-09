function $(qry, ref) {return $$(qry, ref)[0]}
function $$(qry, ref) {return Array.from((ref||document).querySelectorAll(qry))}
function $x(tag, attr) {return Object.assign(document.createElement(tag), attr)}
