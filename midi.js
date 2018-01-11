const animation = require('./src/api/abc_animation');
const tunebook = require('./src/api/abc_tunebook');

let abcjs = {};

abcjs.signature = "abcjs-midi v3.3.0";

Object.keys(animation).forEach(function (key) {
	abcjs[key] = animation[key];
});

Object.keys(tunebook).forEach(function (key) {
	abcjs[key] = tunebook[key];
});

abcjs.renderAbc = require('./src/api/abc_tunebook_svg');
abcjs.renderMidi = require('./src/api/abc_tunebook_midi');

const editor = require('./src/edit/abc_editor');
abcjs['Editor'] = editor;

module.exports = abcjs;
