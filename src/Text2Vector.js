
// variables to make the path notation easier to type.
var a = 'a', h = 'h', v = 'v', l = 'l', m = 'm', m0 = 'm0,', c = ',', c0 = ',0', z = 'z';
var config = {
    font: localStorage.getItem('font') || "Text2Vector",
	text: localStorage.getItem('text') || "",
	size: (parseInt(localStorage.getItem('sizeValue')) / 50) || 1, 
	sizeValue: parseInt(localStorage.getItem('sizeValue')) || 50,
	tracking: parseInt(localStorage.getItem('tracking')) || 10,
	monospace: localStorage.getItem('monospace') == 'true', // default to false
    kerning: localStorage.getItem('kerning') != 'false', // default to true
    kerningEdit: localStorage.getItem('kerningEdit') == 'true', // default to false
	angle: parseInt(localStorage.getItem('angle')) || 10,
	italic: localStorage.getItem('italic') == 'true', // default to false
	lineSpacing: parseInt(localStorage.getItem('lineSpacing')) || 18,
	alignment: localStorage.getItem('alignment') || 'left',
	scaleView: localStorage.getItem('scaleView') == 'true', // default to false
};
var minValue = {
	sizeValue: 6,
	tracking: -30,
	angle: -45,
	lineSpacing: 0
}
var maxValue = {
	angle: 45
}
var fonts = {};

function adjustKern(delta) {
    var i = document.getElementById('text').selectionStart;
    var kernpair = config.text.charAt(i-1) + config.text.charAt(i);
    if (kernpair.length==2) {
    	if(!fonts[config.font].kerningtable) fonts[config.font].kerningtable = {};
        var kerntest = fonts[config.font].kerningtable[kernpair];
        if (!kerntest) {
            kerntest = 1.0;
        }
        kerntest = kerntest + delta;
        fonts[config.font].kerningtable[kernpair] = kerntest;
    }
}
function dumpKernTableToConsole() {
    console.log(JSON.stringify(fonts[config.font].kerningtable));
    var data = 'fonts["' + config.font + '] = ' + JSON.stringify(fonts[config.font]) + ';';
    download(data, config.font + '.data', 'text/plain');
}
function download(data, filename, type) {
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}
function allowKernEdit(evt, propName) {
    if(!config.kerning || !config.kerningEdit) return true;
    var event = evt || window.event;
    var ascii = event.keyCode || event.which;
    switch(ascii) {
        case 112: // F1
            adjustKern(-0.1);
            break;
        case 113: // F2
            adjustKern(0.1);
            break;
        case 114: // F3
            adjustKern(-0.01);
            break;
        case 115: // F4
            adjustKern(0.01);
            break;
        case 116: // F5
            dumpKernTableToConsole();
            break;
        default: return true;
    }
    return false;
}
function getKern(i) {
    var kernpair = config.text.charAt(i) + config.text.charAt(i+1);
    if(!fonts[config.font].kerningtable) fonts[config.font].kerningtable = {};
    var kerntest = fonts[config.font].kerningtable[kernpair];
    if(config.kerning && kerntest != undefined) return kerntest;
    else return 1;
}
function isNumber(value) {
   return typeof value === 'number' && isFinite(value);
}
function drawText(newText) {
	if(newText != undefined) config.text = newText;
	localStorage.setItem('text', config.text);
	var vectorPath = [""];
	var letterWidthAdjust = 0;
	var x = 0;
	var pathWidth = [];
	var letters = fonts[config.font];
	var char, letter;
	for(var i = 0; i < config.text.length; i++) {
		char = config.text.charAt(i);
		if(char == '\n') {
			vectorPath[vectorPath.length] = "";
			pathWidth[pathWidth.length] = x;
			x = 0;
		} else {
			letter = letters[char];
			if(letter) {
			    letterWidth = letter.width;
			    if(config.monospace) letterWidthAdjust = (30 - letterWidth) / 2;
			    else letterWidthAdjust = (letterWidth * getKern(i)) - letterWidth;
			    vectorPath[vectorPath.length-1] += build(letter, x);
			    x += (letterWidth + letterWidthAdjust) + config.tracking;
			}
		}
	}
	pathWidth[pathWidth.length] = x;
	
	var maxWidth = 0;
	for(var i = 0; i < pathWidth.length; i++) {
		if(maxWidth < pathWidth[i]) maxWidth = pathWidth[i];
	}
	
	var opposite = Math.tan(config.angle * Math.PI / 180) * 50;
	var svg = document.getElementById('text2vector');
	svg.innerHTML = '';
	var transform = "";
	for(var i = 0; i < vectorPath.length; i++) {
		var pathObject = document.createElementNS("http://www.w3.org/2000/svg",'path');
		pathObject.setAttribute('style', 'fill:none; stroke:black; stroke-width:1px;');
		pathObject.setAttribute('d', vectorPath[i]);
		
		x = 0;
		if(config.alignment == 'center') x = (maxWidth - pathWidth[i]) / 2.0;
		if(config.alignment == 'right') x = (maxWidth - pathWidth[i]);
		
		if(config.italic) transform = 'translate(' + ((x + opposite) * config.size) +',' + ((i * 50 * config.size) + (i * config.lineSpacing)) + ') skewX(' + (config.angle * -1) + ')';
		else transform = 'translate(' + (x * config.size) + ',' + ((i * 50 * config.size) + (i * config.lineSpacing)) + ')';
		pathObject.setAttribute('transform',transform);
		svg.appendChild(pathObject);
	}
	
	var width = Math.abs(maxWidth - config.tracking) * config.size;
	var height = ((50 * config.size) + config.lineSpacing) * vectorPath.length;
	if(config.tracking < 0) width = Math.abs(width) + Math.abs(config.tracking) + 5;
	
	var viewX = -1;
	if(config.italic) {
		width += Math.abs(opposite);
		if(config.angle < 0) viewX += opposite;
	}
	if(config.tracking < 0) viewX += config.tracking;
	
	svg.setAttribute('width', (width+2) + 'px');
	svg.setAttribute('height', (height+2) + 'px');
	svg.setAttribute('viewBox', viewX + ' -1 ' + (width+2) + ' ' + (height+2));
	
	updateDisplay();
	updateImage();
}
function updateImage() {
	var svg = document.getElementById('text2vector');
	// get svg source.
	var serializer = new XMLSerializer();
	var source = serializer.serializeToString(svg);
	// add name spaces.
	if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
	    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
	}
	if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
	    source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
	}
	var xml = '<?xml version="1.0" standalone="no"?>\r\n' + source;
	var imageSourceData = 'data:image/svg+xml;charset=utf8,' + encodeURIComponent(xml)
	var img = document.getElementById('image');
	img.src = imageSourceData;
	img.style.maxWidth = config.scaleView ? '100%' : 'max-content';
	document.getElementById('imagelink').href = imageSourceData;
}
function copyToClipboard() {
	var text = document.getElementById('text');
	var svg = document.getElementById('text2vector');
	text.value = svg.outerHTML;
	text.select();
	document.execCommand("copy");
	text.value = config.text;
}
function build(letter, startPos) {
	// Variable for builing paths
	var absX = letter.start[0];
	var absY = letter.start[1];
	var path = "M" + ((startPos + absX) * config.size) + c + (absY * config.size);
	var step, nextStep, numberPrev = false;
	
	for(var i = 0; i < letter.instructions.length; i++) {
	    step = letter.instructions[i];
		if(isNumber(step)) {
			if(numberPrev) path += ',';
			path += (step * config.size);
			numberPrev = true;
		} else {
			path += step;
			numberPrev = false;
		}
	}
	return path;
}
function allowNumbers(evt, propName) {
	var event = evt || window.event;
	var ascii = event.keyCode || event.which;
	var allowKey = false;
	switch(ascii) {
		// Allow these keys to act normal
		case 8: // Backspace
		case 9: // Tab
		case 13: // Enter
		case 46: // Delete
		case 48: case 96: // 0
		case 49: case 97: // 1
		case 50: case 98: // 2 
		case 51: case 99: // 3 
		case 52: case 100: // 4 
		case 53: case 101: // 5 
		case 54: case 102: // 6 
		case 55: case 103: // 7 
		case 56: case 104: // 8 
		case 57: case 105: // 9
			allowKey = true; 
			break;
		case 107: // Plus (keypad)
		case 187: // Plus/Equals
		case 38: // Up arrow
		case 39: // Right arrow
			config[propName]++;
			break;
		case 109: // Minus (keypad)
		case 189: // Minus/Underscore
		case 40: // Down arrow
		case 37: // Left arrow
			config[propName]--;
			break;
		default:
			console.log('blocked character: ', ascii) 
			return false;
	}
	if(!allowKey) {
		event.target.value = config[propName];
		updateValue(event, propName);
	}
	return allowKey;
}
function updateValue(evt, propName) {
    var event = evt || window.event;
	var min = minValue[propName];
	var max = maxValue[propName];
	var value = event.target.value;
	if(value) {
		config[propName] = parseInt(value);
		if(min && config[propName] < min) event.target.value = config[propName] = min;
		if(max && config[propName] > max) event.target.value = config[propName] = max;
		if(propName == 'sizeValue') config.size = value / 50;
		drawText();
		localStorage.setItem(propName,value);
	}
}
function setProperty(evt, propName) {
	var event = evt || windoe.event;
	config[propName] = event.target.checked;
	if(propName == 'monospace' && event.target.checked) { 
		document.getElementById('kerning').checked = config['kerning'] = false;
		localStorage.setItem('kerning', 'false');
	}
	if(propName == 'kerning' && event.target.checked) { 
		document.getElementById('monospace').checked = config['monospace'] = false;
		localStorage.setItem('monospace', 'false');
	}
	drawText();
	localStorage.setItem(propName, event.target.checked ? 'true' : 'false');
}
function updateDisplay() {
	var instructions = document.getElementById('editKerningInstructions');
	var display = 'none';
	if(config.kerning && config.kerningEdit) display = 'block';
	else document.getElementById('kerningEdit').checked = config.kerningEdit = false;
	instructions.style.display = display;
}
function updateFilename(evt) {
	var event = evt || window.event;
	var value = event.target.value || 'download-filename.svg';
	document.getElementById('imagelink').setAttribute('download', value);
	event.target.value = value;
}
function pageLoad() {
	// Initialize form values.
	document.getElementById('text').focus();
	document.getElementById('text').value = config.text;
	document.getElementById('size').value = config.sizeValue;
	document.getElementById('lineSpacing').value = config.lineSpacing;
	document.getElementById('tracking').value = config.tracking;
	document.getElementById('angle').value = config.angle;
	document.getElementById('italic').checked = !!config.italic;
	document.getElementById('monospace').checked = !!config.monospace;
	document.getElementById('kerning').checked = !!config.kerning;
	document.getElementById('kerningEdit').checked = !!config.kerningEdit;
	document.getElementById('scaleView').checked = !!config.scaleView;
	
	// Add Fonts to selection control.
	var selectFont = document.getElementById('font');
	var fontList = Object.keys(fonts);
	for(var i = 0; i < fontList.length; i++) {
		var option = document.createElement("option");
		option.text = option.value = fontList[i];
		selectFont.add(option);
	}
	drawText();
}
