var TuneBook = require('../api/abc_tunebook').TuneBook;
var parseCommon = require('../parse/abc_common');
var Parse = require('../parse/abc_parse');
var TextPrinter = require('../transform/abc2abc_write');
var EngraverController = require('../write/abc_engraver_controller');
var glyphs = require('../write/abc_glyphs');

var InteractiveEditor = function(div, parameters) {
	InteractiveEditor.prototype.notes = ["C,","D,","E,","F,","G,","A,","B,","C","D","E","F","G","A","B","c","d","e","f","g","a","b","c'","d'","e'","f'","g'","a'","b'"];
	InteractiveEditor.prototype.notelengths = ["/16","/8","/4","/2","","2","4","8"];
	InteractiveEditor.prototype.accidentals = ["__","_","=","^","^^"];
	InteractiveEditor.prototype.notelength = 4;
	InteractiveEditor.prototype.parameters=parameters;


	document.getElementById(div).innerHTML ="<div id='abcjs-ie-buttons'></div><div id='abcjs-ie-abc'></div>";
	InteractiveEditor.prototype.div=document.getElementById('abcjs-ie-abc');
	InteractiveEditor.prototype.reset();
	InteractiveEditor.prototype.renderTune();
	document.getElementById('abcjs-ie-buttons').innerHTML =InteractiveEditor.prototype.generateInteractiveEditorControls();
	document.getElementById('abcjs-ie-abc').onclick = InteractiveEditor.prototype.clickAreaABC;
  document.getElementById('abcjs-ie-abc').onmousemove = InteractiveEditor.prototype.mousemoveAreaABC;
	InteractiveEditor.prototype.addEventListenerControls();
};


InteractiveEditor.prototype.getABCHeader = function(){
		return this.ABCmeter+"\n"+this.ABCnotelength+"\n"+this.ABCkey+"\n";
};

InteractiveEditor.prototype.getABC = function(){
		return this.ABCmeter+"\n"+this.ABCnotelength+"\n"+this.ABCkey+"\n"+this.getABCnotation();
};

InteractiveEditor.prototype.getABCnotation = function(){
		var abc="";
		for (var i=0;i<this.notation.length;i++)
			abc+=InteractiveEditor.prototype.getABCnotationPos(i);
		return (abc==""?"x":abc);
};

InteractiveEditor.prototype.getABCnotationPos = function(pos){
		var abc="";
		if (pos>=0 && pos<this.notation.length){
			if (this.notation[pos].posaccidental!=undefined)
				abc+=InteractiveEditor.prototype.accidentals[this.notation[pos].posaccidental]; //accidental
			abc+=InteractiveEditor.prototype.notes[this.notation[pos].posnote]; //note
			abc+=InteractiveEditor.prototype.notelengths[this.notation[pos].posnotelen]; //note lenght
		}
		return abc;
};

InteractiveEditor.prototype.reset = function(){
	InteractiveEditor.prototype.ABCmeter="M: 4/4";
	InteractiveEditor.prototype.ABCnotelength="L: 1/4";
	InteractiveEditor.prototype.ABCclef="treble";
	InteractiveEditor.prototype.ABCkey="K: clef="+InteractiveEditor.prototype.ABCclef;
	InteractiveEditor.prototype.notation = [];
	InteractiveEditor.prototype.elemSelected=-4;
};

//Draw abc music
InteractiveEditor.prototype.renderTune = function(){
	var tunebook = new TuneBook(this.getABC());
  var abcParser = new Parse();
  abcParser.parse(tunebook.tunes[0].abc, {}); //TODO handle multiple tunes
  var tune = abcParser.getTune();
  InteractiveEditor.prototype.engraver_controller = new EngraverController(InteractiveEditor.prototype.div, {});
  InteractiveEditor.prototype.engraver_controller.engraveABC(tune);
	console.log(tune)
	console.log(InteractiveEditor.prototype.engraver_controller.renderer)

	InteractiveEditor.prototype.engraver_controller.addSelectListener(InteractiveEditor.prototype);
	// var idfirtline=undefined; //get min id from elements in paper, this is the first line of stave
	// InteractiveEditor.prototype.engraver_controller.renderer.paper.forEach(
	// 		function(elem) {
	// 			(idfirtline==undefined?idfirtline=elem.id:idfirtline=Math.min(elem.id,idfirtline))
	// 		});
	// this.idfirtline=idfirtline;
	// this.y_pitch10=Math.round(this.paper.getById(this.idfirtline).getBBox().y); //get Y from fivest stave line
	// this.distpitch=Math.round((this.paper.getById(this.idfirtline+1).getBBox().y-this.paper.getById(this.idfirtline).getBBox().y)/2); //calculate height pixel of one pitch
	// this.engraver_controller.renderer.y=this.y_pitch10+10*this.distpitch; //set rederer.y to picth 0 (bottom C on a G clef)
	//
	this.y_pitch10=8
	this.distpitch=10
	//this.engraver_controller.renderer.y=10

	if (this.elemSelected!=-4) { //show element selected
			var abcelems=this.engraver_controller.staffgroups[0].voices[0].children;
			var pos = this.notation.length-1;
			for (var i=abcelems.length-1;i>=0;i--){
				if (abcelems[i].type=="note") pos--;
				if (pos==this.elemSelected){
					this.engraver_controller.clearSelection();
			  	this.engraver_controller.selected = [abcelems[i-1]];
			    abcelems[i-1].highlight();
					}
			}
		}
	};

InteractiveEditor.prototype.insertionZone=function(x,y) {
		var widthStaff = this.engraver_controller.staffgroups[0].w
		if (x> widthStaff)
			return false // x is behind the staff

		var abcelems=this.engraver_controller.staffgroups[0].voices[0].children;
		for (var i=0;i<abcelems.length;i++){
			if (abcelems[i].type=="note" || abcelems[i].type=="rest"){
				if (abcelems[i].x>x){
					return false //x is before the first note
				} else {
					break
				}
			}
		}

		var pitch = InteractiveEditor.prototype.getPitchFromY(y);
		for (var i=abcelems.length-1;i>=0;i--)
			if (abcelems[i].type=="note"){
					var middlewidth = abcelems[i].w/2;
					var notepitch = abcelems[i].heads[0].pitch;
				  if (x>abcelems[i].x-middlewidth && x<abcelems[i].x+middlewidth && notepitch==pitch)
							return false; // x and y are over note head
				}

  	return true;
};

InteractiveEditor.prototype.insertionElement=function(x,y){
	var pitch = InteractiveEditor.prototype.getPitchFromY(y);
	var pos = 0;
	var abcelems=this.engraver_controller.staffgroups[0].voices[0].children;
	for (var i=abcelems.length-1;i>=0;i--)
		if (abcelems[i].type=="note" && x>abcelems[i].x+5){
			pos=InteractiveEditor.prototype.getPositionOnNotationFromChar(abcelems[i].abcelem.startChar)+1;
			this.elemSelected=-4;
			break;
		}

	this.notation.splice(pos, 0,{posnote:pitch+7,posnotelen:this.notelength,posaccidental:undefined})
	InteractiveEditor.prototype.renderTune();
};

InteractiveEditor.prototype.getPitchFromY=function(y) {
		var halfdistpitch=Math.round(this.distpitch/2);
		var pitch=0;
		var lineY=this.y_pitch10+10*this.distpitch;
		for (var i=0;i<=30;i++){
			if (y<=lineY + halfdistpitch && y>=lineY - halfdistpitch)
				return pitch;
			if (y>lineY) {
					pitch--;
					lineY+=this.distpitch;
				}
			else {
				pitch++;
				lineY-=this.distpitch;
				}
		}
		return undefined;
}

// Draw a indeterminate note to show where insert new note
InteractiveEditor.prototype.showInsertion=function(x,y) {
	var symbol= "noteheads.indeterminate";
	if (this.insertion_note!=undefined) this.insertion_note.remove();
	if (this.insertion_stave!=undefined) this.insertion_stave.remove();
	if (InteractiveEditor.prototype.insertionZone(x,y)) {
		this.insertion_note=glyphs.printSymbol(x,y,symbol,InteractiveEditor.prototype.engraver_controller.renderer.paper,"");
		var pitch = InteractiveEditor.prototype.getPitchFromY(y);
		if (pitch%2==0 && (pitch > 10 || pitch<1)) //draw aditional lines
			this.insertion_stave=this.engraver_controller.renderer.printStaveLine(x-3,x+18, pitch, "");
		}
};


 //insert new note
InteractiveEditor.prototype.clickAreaABC=function(event) {
    if (InteractiveEditor.prototype.insertionZone(event.offsetX,event.offsetY)) {
      InteractiveEditor.prototype.insertionElement(event.offsetX,event.offsetY);
    }
};

 // show note for reference for insertion
InteractiveEditor.prototype.mousemoveAreaABC=function(event) {
			InteractiveEditor.prototype.showInsertion(event.offsetX,event.offsetY);
};

/**
 * Up or down pitch of note
 * @param {number} pitch number of pitch to change
 */

InteractiveEditor.prototype.pitchUpDown = function(pitch) {
	var pos = this.notation.length-1;
	if (this.elemSelected>=0)
		pos = this.elemSelected;
//	this.elemSelected=-4;
	posnote=this.notation[pos].posnote+pitch;
	posnote=Math.min(InteractiveEditor.prototype.notes.length-1,posnote);
	posnote=Math.max(0,posnote);
	this.notation[pos].posnote=posnote;
}

/**
 * set accidental to last note or selected note
 * @param {number} accidental number of accidental
 */
InteractiveEditor.prototype.setAccidental=function(accidental){
	var pos = this.notation.length-1;
	if (this.elemSelected>=0)
		pos = this.elemSelected;
	this.notation[pos].posaccidental=accidental;
}

/**
 * set length to selected note
 * @param {number} length number of length
 */
InteractiveEditor.prototype.setNoteLength=function(length){
	if (this.elemSelected>=0) {
		pos = this.elemSelected;
		this.notation[pos].posnotelen=length;
	}
}

/**
 * Return the position in notation from position of char in abc
 * @param {number} startChar which tune is using
 */

InteractiveEditor.prototype.getPositionOnNotationFromChar = function(startChar) {
		var headerlength = InteractiveEditor.prototype.getABCHeader().length;
		if (startChar >= headerlength) {
			//selected notation
			var pos = 0;
			for (var start = startChar - headerlength;start>0;pos++)
				start-=InteractiveEditor.prototype.getABCnotationPos(pos).length;
			return pos;
		}
		return -1;
}

/**
 * Selected element in ABC
 * @param {object} abcelem element of ABC selected
 * @param {number} tuneNumber which tune is using
 */
InteractiveEditor.prototype.highlight = function(abcelem, tuneNumber) {
	var newpos=InteractiveEditor.prototype.getPositionOnNotationFromChar(abcelem.startChar);
	if (this.elemSelected==newpos) {
		this.elemSelected=-4; //remove selection when click over element previously selected
		this.engraver_controller.clearSelection();
	}
	else
		this.elemSelected = newpos;
};
// ----------------------- CONTROLS ---------------------------

/**
 * Build buttons
 */
InteractiveEditor.prototype.generateInteractiveEditorControls = function() {
	var options = this.parameters || {};
	if (options.basiccontrol === undefined) options.basiccontrol = true;

	if (options.tooltipReset === undefined) options.tooltipReset = "Reset";
	if (options.tooltipRemove === undefined) options.tooltipRemove = "Remove selected note or last note";
	if (options.tooltipNoteLenght === undefined) options.tooltipNoteLenght = "Set length to selected note or for new notes";
	if (options.tooltipAccidental === undefined) options.tooltipAccidental = "Insert the accidental to selected note or last note";


	var style = "";
	if (options.hideButton)
		style = 'style="display:none;"';
	var html = '<div class="abcjs-ie-buttons-panel" ' + style + '>';

	if (options.basiccontrol){
		html += '<button id="abcjs-ie-reset" class="abcjs-ie-reset abcjs-btn" title="' + options.tooltipReset + '"></button>';
		html += '<button id="abcjs-ie-remove" class="abcjs-ie-remove abcjs-btn" title="' + options.tooltipRemove + '"></button>';
		html += '<button id="abcjs-ie-up" class="abcjs-ie-up abcjs-btn" title="' + options.tooltipUp + '"></button>';
		html += '<button id="abcjs-ie-down" class="abcjs-ie-down abcjs-btn" title="' + options.tooltipDown + '"></button>';
	}
	if (options.controls){
		html += '<button id="abcj-ie-notelenght" class="abcj-ie-notelenght4 abcjs-btn" title="'+options.tooltipNoteLenght+'"></button>';
		html += '<button id="abcj-ie-accidental" class="abcj-ie-accidental2 abcjs-btn" title="'+options.tooltipAccidental+'"></button>';
	}

	html += "</div>";

	if (options.controls){
		html += '<div id="abcj-ie-menunotelenght" class="abcj-ie-menu-notelenght">';
		html += '<button id="abcj-ie-notelenght0" class="abcj-ie-notelenght0 abcjs-btn"/>';
		html += '<button id="abcj-ie-notelenght1" class="abcj-ie-notelenght1 abcjs-btn"/>';
		html += '<button id="abcj-ie-notelenght2" class="abcj-ie-notelenght2 abcjs-btn"/>';
		html += '<button id="abcj-ie-notelenght3" class="abcj-ie-notelenght3 abcjs-btn"/>';
		html += '<button id="abcj-ie-notelenght4" class="abcj-ie-notelenght4 abcjs-btn"/>';
		html += '<button id="abcj-ie-notelenght5" class="abcj-ie-notelenght5 abcjs-btn"/>';
		html += '<button id="abcj-ie-notelenght6" class="abcj-ie-notelenght6 abcjs-btn"/>';
		html += '<button id="abcj-ie-notelenght7" class="abcj-ie-notelenght7 abcjs-btn"/>';
		html += '</div>';

		html += '<div id="abcj-ie-menuaccidental" class="abcj-ie-menu-accidental">';
		html += '<button id="abcj-ie-accidental0" class="abcj-ie-accidental0 abcjs-btn"/>';
		html += '<button id="abcj-ie-accidental1" class="abcj-ie-accidental1 abcjs-btn"/>';
		html += '<button id="abcj-ie-accidental2" class="abcj-ie-accidental2 abcjs-btn"/>';
		html += '<button id="abcj-ie-accidental3" class="abcj-ie-accidental3 abcjs-btn"/>';
		html += '<button id="abcj-ie-accidental4" class="abcj-ie-accidental4 abcjs-btn"/>';
		html += '</div>';
	}

	return html;
};

InteractiveEditor.prototype.showHidePanel = function(id,idbutton,closeothermenu) {
	for (var i=0;i<closeothermenu.length;i++) document.getElementById(closeothermenu[i]).style.display='none';

  if(document.getElementById(id).style.display == 'block'){
    document.getElementById(id).style.display = 'none';
  } else  {
		var top = document.getElementById(idbutton).getBoundingClientRect().top+45;
		var left = document.getElementById(idbutton).getBoundingClientRect().left;
		document.getElementById(id).style.top=top+"px";
		document.getElementById(id).style.left=left+"px";
    document.getElementById(id).style.display = 'block';
  }
};

InteractiveEditor.prototype.pushButton = function(idpanel,idbutton,cssclass){
  document.getElementById(idpanel).style.display = 'none';
  document.getElementById(idbutton).className=cssclass+' abcjs-btn';
};

InteractiveEditor.prototype.addEventListenerControls = function(){
		document.getElementById('abcjs-ie-reset').onclick = function(){
			InteractiveEditor.prototype.reset();
			InteractiveEditor.prototype.renderTune();
		}

		document.getElementById('abcjs-ie-remove').onclick = function(){
			if (InteractiveEditor.prototype.notation.length>0) {
				if (InteractiveEditor.prototype.elemSelected == -4) //no element selected
						InteractiveEditor.prototype.notation.pop();

				if (InteractiveEditor.prototype.elemSelected >=0)
	    			InteractiveEditor.prototype.notation.splice(InteractiveEditor.prototype.elemSelected, 1);

				InteractiveEditor.prototype.elemSelected = -4;
				InteractiveEditor.prototype.renderTune();
			}
		}

		document.getElementById('abcjs-ie-up').onclick = function(){
			if (InteractiveEditor.prototype.notation.length>0) {
				InteractiveEditor.prototype.pitchUpDown(1);
				InteractiveEditor.prototype.renderTune();
			}
		}

		document.getElementById('abcjs-ie-down').onclick = function(){
			if (InteractiveEditor.prototype.notation.length>0) {
				InteractiveEditor.prototype.pitchUpDown(-1);
				InteractiveEditor.prototype.renderTune();
			}
		}

		document.getElementById('abcj-ie-notelenght').onclick = function(){
			InteractiveEditor.prototype.showHidePanel('abcj-ie-menunotelenght','abcj-ie-notelenght',['abcj-ie-menuaccidental']);
		}

		for (var i=0;i<8;i++) {
			document.getElementById('abcj-ie-notelenght'+i).value=i;
			document.getElementById('abcj-ie-notelenght'+i).onclick = function() {
				InteractiveEditor.prototype.pushButton('abcj-ie-menunotelenght','abcj-ie-notelenght','abcj-ie-notelenght'+this.value);
				InteractiveEditor.prototype.notelength=this.value;
				if (InteractiveEditor.prototype.elemSelected >= 0){ //element selected
					InteractiveEditor.prototype.setNoteLength(this.value);
					InteractiveEditor.prototype.renderTune();
				}
			}
		}

		document.getElementById('abcj-ie-accidental').onclick = function(){
			InteractiveEditor.prototype.showHidePanel('abcj-ie-menuaccidental','abcj-ie-accidental',['abcj-ie-menunotelenght']);
		}

		for (var i=0;i<5;i++){
			document.getElementById('abcj-ie-accidental'+i).value=i;
			document.getElementById('abcj-ie-accidental'+i).onclick = function() {
				InteractiveEditor.prototype.showHidePanel('abcj-ie-menuaccidental','abcj-ie-accidental',['abcj-ie-menunotelenght']);
				if (InteractiveEditor.prototype.notation.length>0) {
					InteractiveEditor.prototype.setAccidental(this.value);
					InteractiveEditor.prototype.renderTune();
				}
			}
		}
}

module.exports = InteractiveEditor;
