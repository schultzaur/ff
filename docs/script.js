// from https://github.com/mdn/web-speech-api/tree/master/speak-easy-synthesis

var synth = window.speechSynthesis;

var timerDisplay = document.querySelector('#timerDisplay');
var playButton = document.querySelector('#playButton');
var pauseButton = document.querySelector('#pauseButton');
var resetButton = document.querySelector('#resetButton');

var inputTxt = document.querySelector('.txt');
var voiceSelect = document.querySelector('select');

var pitch = document.querySelector('#pitch');
var pitchValue = document.querySelector('.pitch-value');
var rate = document.querySelector('#rate');
var rateValue = document.querySelector('.rate-value');

var voices = [];

var timerInterval;
var timerMs = 0;
var lastInterval;
var callouts;
var calloutsIndex = 0;

function updateTimerDisplay() {
    timerDisplay.innerHTML = new Date(timerMs).toISOString().substring(14, 22);
}

function timer() {
    var now = Date.now();
    var diff = now-lastInterval;
    lastInterval = now;
    timerMs += diff
    updateTimerDisplay();

    while (calloutsIndex < callouts.length && timerMs/1000 >= callouts[calloutsIndex][0]) {
        speakText(callouts[calloutsIndex][1])
        calloutsIndex++;
        
        if (calloutsIndex >= callouts.length) {
            clearInterval(timerInterval);
        }
    }
}

function speakText(txt) {
    console.log(txt);
    if (txt.startsWith("#")) { return; }

    var utterThis = new SpeechSynthesisUtterance(txt);
    var selectedOption = voiceSelect.selectedOptions[0].getAttribute('data-name');
    for (i = 0; i < voices.length; i++) {
        if (voices[i].name === selectedOption) {
            utterThis.voice = voices[i];
        }
    }
    utterThis.pitch = pitch.value;
    utterThis.rate = rate.value;
    synth.speak(utterThis);
}

function populateVoiceList() {
    voices = synth.getVoices();

    for (i = 0; i < voices.length; i++) {
        var option = document.createElement('option');
        option.textContent = voices[i].name + ' (' + voices[i].lang + ')';

        if (voices[i].default) {
            option.textContent += ' -- DEFAULT';
        }

        option.setAttribute('data-lang', voices[i].lang);
        option.setAttribute('data-name', voices[i].name);
        voiceSelect.appendChild(option);
    }
}

populateVoiceList();
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populateVoiceList;
}

const callRegex = /((\d*:?)\d+(\.\d+)?)\s+(.+)/;

parseTime = function(time) {
    var tokens = time.split(":");
    var seconds = 0;

    while (tokens.length > 0) {
        seconds *= 60;
        var token = tokens.shift(0);
        seconds += Number.parseFloat(token);
    }

    return seconds;
}

parseCall = function(line) {
    matches = line.match(callRegex);
    
    if (matches != null) {
        return [[parseTime(matches[1]), matches[4]]];
    }

    return null;
}

parseCalls = function(txt) {
    lines = txt.split(/\r?\n/);
    return lines.flatMap(line => parseCall(line) || [])
}

playButton.onclick = function (event) {
    event.preventDefault();

    callouts = parseCalls(inputTxt.value);
    calloutsIndex = 0;

    if (callouts && callouts.length > 0 && calloutsIndex < callouts.length) {
        while(timerMs > 0 && timerMs/1000 >= callouts[calloutsIndex][0]) {
            calloutsIndex++;
        }
    }

    lastInterval = Date.now();
    timer()
    timerInterval = setInterval(timer, 10);
}
pauseButton.onclick = function (event) {
    event.preventDefault();
    clearInterval(timerInterval);
}

resetButton.onclick = function (event) {
    event.preventDefault();
    timerMs = 0;
    clearInterval(timerInterval);

    updateTimerDisplay();
}

pitch.onchange = function () {
    pitchValue.textContent = pitch.value;
}

rate.onchange = function () {
    rateValue.textContent = rate.value;
}