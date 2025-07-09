import { generators } from "./generators.js";
import { names } from "./names.js";
import { genreData } from "./genres.js";
import { promptTemplates } from "./prompts.js";
import { quotes } from "./quotes.js";

let isChecking = false;
let isSaved = true;
let isSubmitting = false;
let lastPickedGenre = null;
let voices = [];

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    document.body.setAttribute('data-bs-theme', savedTheme);
} else {
    document.body.setAttribute('data-bs-theme', 'light');
}
const savedSize = localStorage.getItem('size');
const settingSize = document.getElementById('fontSizeSelector');
if (savedSize) {
    document.body.setAttribute('data-font', savedSize);
    if (settingSize) {settingSize.value = savedSize};
} else {
    document.body.setAttribute('data-font', 'md');
    if (settingSize) {settingSize.value = 'md'};
}

const savedFont = localStorage.getItem('font');
const settingFont = document.getElementById('fontFamilySelector');
if (savedFont) {
    document.body.setAttribute('data-font-type', savedFont);
    if (settingFont) {settingFont.value = savedFont};
} else {
    document.body.setAttribute('data-font-type', 'default');
    if (settingFont) {settingFont.value = 'default'};
}

function saveFileAs() {
    const filename = document.getElementById("title").value.trim()
    
    if (filename) {
        document.getElementById("downloadModal").style.display = "block";
        document.getElementById("pdfButton").addEventListener("click", () => {
            const text = document.querySelector("textarea").value;
            converttoPDF(filename, text);
        document.getElementById("downloadModal").style.display = "none";
    });
        document.getElementById("txtButton").addEventListener("click", () => {const textBlob = new Blob([document.querySelector("textarea").value], {type:'text/plain'});
        const downloadLink = document.createElement("a");
        downloadLink.download = filename;
        downloadLink.href = window.URL.createObjectURL(textBlob);
        downloadLink.click();
        document.getElementById("downloadModal").style.display = "none";
    })} else {
        alert("You need to title your work first!");
    }
}

function converttoPDF(title, text) {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22)
    doc.text(title, 20, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const wrappedText = doc.splitTextToSize(text, 170);
    doc.text(wrappedText, 20, 45);
    doc.save(`${title}.pdf`);
}

function insertText() {
    const fileInput = document.getElementById("myFile");
    const textarea = document.getElementById("textbox");
    const file = fileInput.files[0];
    if (!file) {
        alert ("No file selected!");
        return;
    }
    if (textarea.value.trim() == ""){
        const reader = new FileReader();
        reader.onload = function(e) {
            textarea.value = e.target.result;
        }
        reader.readAsText(file);
    } else {
        alert("Clear or save textarea before inputing a new file.");
    }
}


function escapeHTML(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function highlightErrors(text, suggestions) {
    let offsetShift = 0;

    suggestions.forEach(s => {
        if (s.errorLength === 0) return;
        
        const start = s.offset + offsetShift;
        const end = start + s.length;
        const errorText = text.slice(start, end);

        const highlighted = `<span class="highlight">${escapeHTML(errorText)}</span>`;
        text = text.slice(0, start) + highlighted + text.slice(end);

        offsetShift += highlighted.length - errorText.length;
    });

    return text;
}

async function checkWriting() {
    const spinner = document.getElementById('loadingSpinner');
    const button = document.getElementById('checkWriting');
    const text = document.getElementById("textbox").value;
    
    spinner.classList.remove('d-none');
    button.disabled = true;
    isChecking = true;
    
    const response = await fetch('/check', {
        method:'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({text: text})
    });

    const results = await response.json();
    const suggestions = results.suggestions;

    let output = '';
    suggestions.forEach(s => {
        output += `<p><strong>Error:</strong> ${s.message}<br>`;
        output +=  `<p><strong>Suggestion:</strong> ${s.replacements.join(', ')}</p>`;
    });

    document.getElementById('results').innerHTML = output || 'No errors found!';

    const highlightedText = highlightErrors(text, suggestions);
    document.getElementById('highlightedOutput').innerHTML = highlightedText;

    spinner.classList.add('d-none');
    button.disabled = false;
    isChecking = false;
}

function syncText() {
    if (isChecking) return;
    
    const textarea = document.getElementById('textbox');
    const highlightDiv = document.getElementById('highlightedOutput');

    const text = textarea.value.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    highlightDiv.innerHTML = text;
}

function toggleDarkMode() {
    const currentTheme = document.body.getAttribute("data-bs-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.body.setAttribute("data-bs-theme", newTheme);
    localStorage.setItem('theme', newTheme);
}

function resetSettings() {
    document.body.setAttribute('data-bs-theme', 'light');
    localStorage.removeItem('theme');

    document.body.setAttribute('data-font', 'md');
    localStorage.removeItem('size');

    document.body.setAttribute('data-font-type', 'default');
    localStorage.removeItem('font');

    document.getElementById('fontSizeSelector').value = 'md';
    document.getElementById('fontFamilySelector').value = 'default';

    localStorage.removeItem('voice');
}

function getRandomGenerated(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getFilteredNames(selectedTags) {
    if (selectedTags.length === 0) {
        return names;
    }
    return names.filter(entry =>
        selectedTags.every(tag => entry.tags.includes(tag))
    );
}
function getRandomName(selectedTags) {
    const filtered = getFilteredNames(selectedTags);
    if (filtered.length === 0) {
        return "No names that fit those requirements. Please change a few.";
    }
    const randomEntry = getRandomGenerated(filtered);
    return randomEntry.name;
}

function generatePrompt(charA, charB, genre) {
    const templates = promptTemplates[genre];
    if (!templates || templates.length === 0) return "No prompts avaliable for this genre. Please select a different one.";

    const nameA = charA.trim() || "Character A";
    const nameB = charB.trim() || "Character B";

    const partA = getRandomGenerated(templates.partA).replace(/{charA}/g, nameA).replace(/{charB}/g, nameB);
    const partB = getRandomGenerated(templates.partB).replace(/{charA}/g, nameA).replace(/{charB}/g, nameB);

    return `${partA} ${partB}`;
}

function loadVoices() {
    let allVoices = speechSynthesis.getVoices();
    const bannedVoices = ["Jester", "Rocko", "Grandma", "Grandma (English (United Kingdom))", "Grandma (English (United States))", "Grandpa (English (United Kingdom))","Grandpa (English (United States))", "Grandpa", "Flo", "Eddy", "Sandy", "Bahh", "Albert", "Organ", "Cellos", "Zarvox", "Superstar", "Bells", "Trinoids", "Kathy", "Boing", "Whisper", "Good News", "Bad News", "Wobble", "Bubbles", "Ralph", "Fred", "Junior", "Daniel (English (United Kingdom))", "Eddy (English (United Kingdom))", "Eddy (English (United States))", "Flo (English (United Kingdom))", "Flo (English (United States))", "Reed (English (United Kingdom))", "Reed (English (United States))", "Rocko (English (United Kingdom))", "Rocko (English (United States))", "Sandy (English (United Kingdom))", "Sandy (English (United States))", "Shelley (English (United Kingdom))", "Shelley (English (United States))"]
    voices = allVoices.filter(v =>
        v.lang.startsWith("en") && !bannedVoices.includes(v.name)
    );
    const selector = document.getElementById("voiceSelector");
    if (selector) {
    selector.innerHTML = '';
    voices.forEach((voice) => {
        const option = document.createElement("option");
        option.value = voice.name;
        option.textContent = `${voice.name} (${voice.lang})`;
        selector.appendChild(option);
    })

    const savedVoice = localStorage.getItem('voice');
    if (savedVoice) {
        selector.value = savedVoice;
    }
}}

function saveVoice() {
    const selectedVoice = document.getElementById('voiceSelector').value;
    if (selectedVoice){
        localStorage.setItem("voice", selectedVoice);
}}

function textToSpeech(e) {
    e.preventDefault();
    const text = document.getElementById("textbox").value;
    if (text.trim() !== "") {
        if (voices.length === 0) {voices = speechSynthesis.getVoices()}
        const speaking = new SpeechSynthesisUtterance(text);
        const savedVoiceName = localStorage.getItem('voice');

        if (savedVoiceName) {
            const voice = voices.find(v => v.name === savedVoiceName);
            if (voice) {
                speaking.voice = voice;
            }
        }
        speechSynthesis.speak(speaking);
    }
}

// EVENT LISTENERS DOING THE STUFFFFFFFF

const clearbutton = document.getElementById('clear')
if (clearbutton) {clearbutton.addEventListener('click', function(){
    document.getElementById('textbox').value = '';
    document.getElementById('title').value = '';})}

const download = document.getElementById("download");
if (download) {download.onclick = saveFileAs}

const insert = document.getElementById("insert");
if (insert) {insert.addEventListener("click", insertText)}

const checkWritingButton = document.getElementById('checkWriting');
if (checkWritingButton) {checkWritingButton.addEventListener('click', checkWriting)}

const textbox = document.getElementById('textbox')
if (textbox) {
    textbox.addEventListener('scroll', function() {
    document.getElementById('highlightedOutput').scrollTop = this.scrollTop;
})
    textbox.addEventListener("input", () => {
    isSaved = false;
})
}

document.getElementById('save')?.addEventListener('click', () => {
    isSaved = true;
    isSubmitting = true;
});

window.addEventListener("beforeunload", function(e) {
    if (!isSaved && !isSubmitting){
        e.preventDefault();
        e.returnValue = '';
}})

const textToSpeechButton = document.getElementById('textToSpeech');
if (textToSpeechButton) {textToSpeechButton.addEventListener("click", textToSpeech)}

speechSynthesis.onvoiceschanged = loadVoices;
loadVoices()

const darkModeButton = document.getElementById("darkModeButton");
if (darkModeButton) {darkModeButton.addEventListener("click", toggleDarkMode)}

const fontSizeSelector = document.getElementById("fontSizeSelector");
if (fontSizeSelector) {fontSizeSelector.addEventListener("change", function(e) {
    document.body.setAttribute("data-font", e.target.value);
    localStorage.setItem("size", e.target.value);
})}

const fontFamilySelector = document.getElementById("fontFamilySelector");
if (fontFamilySelector) {fontFamilySelector.addEventListener("change", function(e) {
    document.body.setAttribute("data-font-type", e.target.value);
    localStorage.setItem("font", e.target.value);
})}

const voiceTypeSelector = document.getElementById('voiceSelector');
if (voiceTypeSelector) {voiceTypeSelector.addEventListener("change", saveVoice)}

const tryVoiceBtn = document.getElementById('tryVoiceBtn');
if (tryVoiceBtn) {tryVoiceBtn.addEventListener("click", () => {
    const selector = document.getElementById('voiceSelector');
    const voiceName = selector.value;
    const voice = voices.find(v=>v.name === voiceName);
    const utter = new SpeechSynthesisUtterance("Hi, I'm Siri, your virtual assistant.")
    if (voice) utter.voice = voice;
    speechSynthesis.speak(utter);
})}

const resetButton = document.getElementById('resetSettings');
if (resetButton) {resetButton.addEventListener('click', resetSettings)}

const quote = document.getElementById('quote');
if (quote) {quote.innerText = getRandomGenerated(quotes)}


// SHOW/HIDE GENERATOR PAGES
const homeGeneratorButton = document.querySelector('.homeGeneratorButton');
console.log("homeGeneratorButton:", homeGeneratorButton);
if (homeGeneratorButton) {homeGeneratorButton.addEventListener('click', () => {
    document.getElementById("mainGeneratorPage").classList.remove('hide');
    document.getElementById("nameGenerator").classList.add('hide');
    document.getElementById("genreGenerator").classList.add('hide');
    document.getElementById("promptGenerator").classList.add('hide');
})}

const nameGeneratorButton = document.querySelector('.nameGeneratorButton');
if (nameGeneratorButton) {nameGeneratorButton.addEventListener('click', () => {
        document.getElementById("nameGenerator").classList.remove('hide');
        document.getElementById("mainGeneratorPage").classList.add('hide');
        document.getElementById("genreGenerator").classList.add('hide');
        document.getElementById("promptGenerator").classList.add('hide');
})}

const genreGeneratorButton = document.querySelector('.genreGeneratorButton');
if (genreGeneratorButton) {genreGeneratorButton.addEventListener('click', () => {
        document.getElementById("genreGenerator").classList.remove('hide');
        document.getElementById("mainGeneratorPage").classList.add('hide');
        document.getElementById("nameGenerator").classList.add('hide');
        document.getElementById("promptGenerator").classList.add('hide');
})}

const promptGeneratorButton = document.querySelector('.promptGeneratorButton');
if (promptGeneratorButton) {promptGeneratorButton.addEventListener('click', () => {
        document.getElementById("promptGenerator").classList.remove('hide');
        document.getElementById("mainGeneratorPage").classList.add('hide');
        document.getElementById("nameGenerator").classList.add('hide');
        document.getElementById("genreGenerator").classList.add('hide');
})}

// The three pesky buttons that are on the main generator page thing bc you just HAD to add it
const tryTheName = document.querySelector('#tryTheNameGenerator');
if (tryTheName) {tryTheName.addEventListener('click', () => {
        document.getElementById("nameGenerator").classList.remove('hide');
        document.getElementById("mainGeneratorPage").classList.add('hide');
        document.getElementById("genreGenerator").classList.add('hide');
        document.getElementById("promptGenerator").classList.add('hide');
})}

const tryTheGenre = document.querySelector('#TryTheGenreandTropeGenerator');
if (tryTheGenre) {tryTheGenre.addEventListener('click', () => {
        document.getElementById("genreGenerator").classList.remove('hide');
        document.getElementById("mainGeneratorPage").classList.add('hide');
        document.getElementById("nameGenerator").classList.add('hide');
        document.getElementById("promptGenerator").classList.add('hide');
})}

const tryThePrompt = document.querySelector('#TryThePromptGenerator');
if (tryThePrompt) {tryThePrompt.addEventListener('click', () => {
        document.getElementById("promptGenerator").classList.remove('hide');
        document.getElementById("mainGeneratorPage").classList.add('hide');
        document.getElementById("nameGenerator").classList.add('hide');
        document.getElementById("genreGenerator").classList.add('hide');
})}

// ACTIVATE HYPERDRIVE CHEWY (the generators lol)
const mainGeneratorClicker = document.getElementById('mainGeneratorClicker');
if (mainGeneratorClicker) {mainGeneratorClicker.addEventListener("click", () => {
    document.getElementById('mainGeneratorResult').innerHTML = `You should try the ${getRandomGenerated(generators)} generator!`;
})}

const nameGeneratorClicker = document.getElementById('nameGeneratorClicker');
if (nameGeneratorClicker) {nameGeneratorClicker.addEventListener("click", () => {
    document.getElementById('nameGeneratorResult').innerHTML = `Name: ${getRandomName(Array.from(document.querySelectorAll('.tagCheckbox:checked')).map(el => el.value).filter(Boolean))}`
})}

const genreGeneratorClicker = document.getElementById('genreGeneratorClicker');
if (genreGeneratorClicker) {genreGeneratorClicker.addEventListener("click", () => {
    const randomGenreObj = getRandomGenerated(genreData);
    lastPickedGenre = randomGenreObj;
    document.getElementById('genreGeneratorResult').innerHTML = `Genre: ${lastPickedGenre.genre}`;
})}

const subgenreGeneratorClicker = document.getElementById('subgenreGeneratorClicker');
if (subgenreGeneratorClicker) {subgenreGeneratorClicker.addEventListener("click", () => {
    if (!lastPickedGenre) {
        document.getElementById('subgenreGeneratorResult').innerHTML = "Generate a genre first!";
        return;
    }
    const subgenre = getRandomGenerated(lastPickedGenre.subgenres);
    document.getElementById('subgenreGeneratorResult').innerHTML = `Subgenre: ${subgenre}`;
})}

const tropeGeneratorClicker = document.getElementById('tropeGeneratorClicker');
if (tropeGeneratorClicker) {tropeGeneratorClicker.addEventListener("click", () => {
    const selectedGenre = document.getElementById('tropeGenreSelector').value;
    if (!selectedGenre) {
        document.getElementById('tropeGeneratorResult').innerText = "Please select a genre from the dropdown first.";
        return;
    }
    const genreObj = genreData.find(g => g.genre === selectedGenre);
    if (!genreObj) {
        document.getElementById('tropeGeneratorResult').innerText = "Genre not found!";
        return;
    }
    const trope = getRandomGenerated(genreObj.tropes);
    document.getElementById('tropeGeneratorResult').innerText = `Trope: ${trope}`;
})}

const promptGeneratorClicker = document.getElementById('promptGeneratorClicker');
if (promptGeneratorClicker) {promptGeneratorClicker.addEventListener("click", () => {
    const charA = document.getElementById('charAName').value;
    const charB = document.getElementById('charBName').value;
    const genre = document.getElementById('promptGenreSelector').value;

    if (!genre) {
        document.getElementById('promptGeneratorResult').innerText = "Please select a genre.";
        return;
    }

    const prompt = generatePrompt(charA, charB, genre);
    document.getElementById('promptGeneratorResult').innerText = prompt;
})}