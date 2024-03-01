function generatePokemonDataJson(list) {
    for (let i = 0; i < list.length; i++) {
        const pokemon = list[i];
        let entry = {
            about: {
                id: `${fetchIdFromURL(list[i].url)}`,
                name: `${list[i].name}`,
                height: null,
                weight: null,
                genus: null,
            },
            types: [],
            stats: {
                hp: null,
                attack: null,
                defense: null,
                specialAttack: null,
                specialDefense: null,
                speed: null,
            },
            abilities: [],
            moves: [],
            evolutionUrl: null,
            evolutions: [],
            imgUrl: null,
        };
        pokemonData.push(entry);
    }
}


async function load() {
    let pokemonDataAsText = localStorage.getItem('pokemonData');
    if (pokemonDataAsText) {
        pokemonData = JSON.parse(pokemonDataAsText);
    } else {
        await loadPokemonListFromApi();
    }
}


function save() {
    let pokemonDataAsText = JSON.stringify(pokemonData);
    localStorage.setItem('pokemonData', pokemonDataAsText);
}


function clear() {
    content.innerHTML = '';
    cardCounter = 0;
}


async function loadJsonFromApi(url) {
    const response = await fetch(url);
    return await response.json();
}


async function loadPokemonListFromApi() {
    let response = await loadJsonFromApi('https://pokeapi.co/api/v2/pokemon-species?limit=9999&offset=0');
    generatePokemonDataJson(response.results);
    save();
}


function fetchIdFromURL(url) {
    var regex = new RegExp('(?<!v)[0-9]{1,}'),
        results = regex.exec(url);
    return results[0];
}


function capitalize(string) {
    return string.replace(/(?<=[-\s]+|^)([a-zA-Z])/g, function(match) { return match.toUpperCase(); })
}


function formatPokemonId(id) {
    return id < 10 ? '#000' + id : id < 100 ? '#00' + id : id < 1000 ? '#0' + id : '#' + id;
}


function formatHeight(height) {
    let conversionFactorFoot = 3.2808398950131;
    let conversionFactorInch = 12;
    let heightInFoot = Math.round((height / 10) * conversionFactorFoot);
    let moduloHeightInInch = Math.round(((((height / 10) * conversionFactorFoot) % 1) * conversionFactorInch) * 10) / 10;
    let heightInCm = height * 10;
    height = heightInFoot + '\'' + moduloHeightInInch + '" ' + '(' + heightInCm + 'cm' + ')';
    return height;
}


function formatWeight(weight) {
    let conversionFactorPound = 2.2046226218488;
    let weightInPound = Math.round(((weight / 10) * conversionFactorPound) * 10) / 10;
    let weightInKg = weight / 10;
    weight = weightInPound + 'lbs ' + '(' + weightInKg + 'kg' + ')';
    return weight;
}


function convertAbilities(abilities) {
    let array = [];
    for (let i = 0; i < abilities.length; i++) {
        const ability = abilities[i]['ability']['name'];
        array.push(ability);
    }
    return array
}


function formatAbilities(pokemon) {
    let array = pokemon.abilities;
    let formatted = '';
    for (let i = 0; i < array.length; i++) {
        const ability = array[i];
        if (i > 0) {
            formatted += ', ';
        }
        formatted += ability;
    }
    return capitalize(formatted)
}


async function closeCard() {
    toggleCardGrow();
    await delay(calculateDelay());
    toggleCardDisplay();
}


async function openCard(cardId) {
    setAnimationStartPosition();
    toggleCardDisplay();
    await delay(10);
    toggleCardGrow();
    await loadAndRenderInfoCard(cardId);
}


function toggleCardFunction(cardId, event) {
    currentCard.classList.toggle('noHover');
    currentCard.onclick = currentCard.onclick === null ? function() { toggleCard(cardId, event) } : null;
}


function toggleCardGrow() {
    currentCard.classList.toggle('grow');
    currentCardInfo.classList.toggle('grow');
}


function toggleCardDisplay() {
    currentCardInfo.classList.toggle('dNone');
    currentCard.classList.toggle('switchPosition');
}


function toggleOverlay(cardId, event) {
    let overlay = document.getElementById("overlay");
    overlay.classList.toggle('dNone');
    if (cardId) {
        overlay.onclick = function() { toggleCard(cardId, event) };
    } else {
        overlay.onclick = function() { toggleOverlay() };
    }
}


function toggleNotImplemented() {
    document.getElementById('notImplemented').classList.toggle('dNone');
}


function calculateDelay() {
    let rootStyle = getComputedStyle(root);
    let transSpeed = rootStyle.getPropertyValue('--transition_speed').replace('ms', '');
    let delayTime = transSpeed - 5;
    return delayTime;
}


function delay(milliseconds) {
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}


function isNearBottom() {
    if (window.scrollY + window.innerHeight >= document.body.offsetHeight - 500) {
        return (window.scrollY + window.innerHeight >= document.body.offsetHeight - 500);
    }
    if (window.innerHeight >= document.body.offsetHeight - 500) {
        return (window.innerHeight >= document.body.offsetHeight - 500);
    }
    return false;
}


function findEvoCondition(pokemon, i, j) {
    let filteredDetails = '';
    for (let key in pokemon.evolutions[i].detail[j]) {
        const value = pokemon.evolutions[i].detail[j][key];
        if (key !== 'trigger' && key !== 'known_move_type' && value && value !== '') {
            const mapObj = { min_: "", _: " ", location: "at" };
            const selectedValue = value.name ? value.name : value;
            const filteredKey = key.replace(/min_|_|location/gi, function(matched) { return mapObj[matched]; });
            const filteredValue = `${selectedValue}`.replace(/min_|_|location/gi, function(matched) { return mapObj[matched]; });
            const capitalizedKey = capitalize(filteredKey);
            const capitalizedValue = capitalize(filteredValue);
            filteredDetails += `${capitalizedKey}: ${capitalizedValue}<br>`;
        }
    }
    return filteredDetails;
}


function findGenus(resSpec) {
    let genera = resSpec.genera;
    for (let i = 0; i < genera.length; i++) {
        const entry = genera[i];
        if (entry.language.name === 'en') {
            return entry.genus;
        }
    }
}


function setAnimationStartPosition() {
    let pos = currentCard.getBoundingClientRect();
    root.style.setProperty('--card_top', `${pos.top}px`);
    root.style.setProperty('--card_left', `${pos.left}px`);
}