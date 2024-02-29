let root = document.querySelector(':root');
let currentCard;
let currentCardInfo;
let cardIsOpen = false;
let pokemonData = [];
let cardCounter = 0;
let cardsToLoad = 1;
let isLoading = false;
let scrollIsHandled = false;

window.addEventListener("scroll", handleScroll);



async function init() {
    clear();
    await load();
    await renderCards();
}


async function load() {
    let pokemonDataAsText = localStorage.getItem('pokemonData');
    if (pokemonDataAsText) {
        pokemonData = JSON.parse(pokemonDataAsText);
    } else {
        await loadPokemonListFromApi();
    }
}


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


function save() {
    let pokemonDataAsText = JSON.stringify(pokemonData);
    localStorage.setItem('pokemonData', pokemonDataAsText);
}


async function renderCards() {
    if (cardCounter < pokemonData.length) {
        if (isLoading == false) {
            isLoading = true;
            await addEmptyCards();
            addCardHead();
            await addCardBody();
            isLoading = false;
        }
        for (windowHeight = window.innerHeight, bodyHeight = document.body.offsetHeight; windowHeight >= bodyHeight - 500; bodyHeight = document.body.offsetHeight) {
            await renderCards()
        }
        handleScroll()
    }
}


async function loadAndRenderInfoCard(cardId) {
    if (isLoading == false) {
        isLoading = true;
        let pokemonId = cardId.slice(4);
        await loadInfoCardData(pokemonId);
        addInfoCard(pokemonId);
        isLoading = false;
    } else {
        await delay(200);
        loadAndRenderInfoCard(cardId)
    }
}


function switchInfoSection(section) {
    let allSections = section.parentElement.children;
    let text = section.children[0].innerHTML;
    let positionBar = section.parentElement.parentElement.children[1].children[0];
    let infoBody = section.parentElement.parentElement.parentElement.children[1];
    for (let i = 0; i < allSections.length; i++) {
        const element = allSections[i];
        element.classList.remove('highlightedHeadline');
    }
    section.classList.add('highlightedHeadline');
    positionBar.style.left = text === 'About' ? '0%' : text === 'Base Stats' ? '25.5%' : text === 'Evolution' ? '55%' : text === 'Moves' ? '80%' : '';
    infoBody.style.left = text === 'About' ? 'calc(-51rem * 0)' : text === 'Base Stats' ? 'calc(-51rem * 1)' : text === 'Evolution' ? 'calc(-51rem * 2)' : text === 'Moves' ? 'calc(-51rem * 3)' : '';
}


async function toggleCard(cardId, event) {
    currentCard = document.getElementById(cardId);
    currentCardInfo = document.getElementById(cardId + 'Info');
    toggleOverlay(cardId, event);
    toggleCardFunction(cardId, event);
    cardIsOpen ? await closeCard() : await openCard(cardId);
    event.stopPropagation();
    cardIsOpen = !cardIsOpen;
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


async function handleScroll() {
    if (cardCounter < pokemonData.length && isNearBottom() && !scrollIsHandled) {
        if (!isLoading) {
            await renderOnScroll()
        } else {
            for (let i = 0; i < 30; i++) {
                await delay(100);
                if (!isLoading) {
                    await renderOnScroll()
                    break;
                }
            }
        }
        if (isNearBottom()) handleScroll();
    }
}


async function renderOnScroll() {
    scrollIsHandled = true;
    await renderCards();
    scrollIsHandled = false;
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


async function loadBodyData(pokemon) {
    if (pokemon.types.length === 0) {
        await loadTypesFromUrl(pokemon);
        await delay(25);
        save();
    }
    if (pokemon.imgUrl == null) {
        pokemon.imgUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.about.id}.png`
        save();
    }
}


async function loadInfoCardData(id) {
    const pokemon = pokemonData[id - 1];
    await loadAboutData(pokemon);
    await delay(5);
    await loadBaseStats(pokemon);
    await delay(5);
    await loadEvolutions(pokemon);
    await delay(5);
    await loadMoves(pokemon);
    await delay(5);
    save();
}


async function loadTypesFromUrl(pokemon) {
    const data = await loadJsonFromApi('https://pokeapi.co/api/v2/pokemon/' + pokemon.about.id)
    let types = data['types'];
    for (let i = 0; i < types.length; i++) {
        let type = types[i]['type']['name'];
        pokemonData[cardCounter].types.push(type);
    }
}


async function loadAboutData(pokemon) {
    if (pokemon.about.height === null || pokemon.about.weight === null || pokemon.abilities.length === 0) {
        await loadAboutDataFromPokemonSub(pokemon);
        save();
    }
    if (pokemon.about.genus === null || pokemon.evolution_chain.url === null) {
        await loadAboutDataFromSpeciesSub(pokemon)
        save();
    }
}


async function loadAboutDataFromPokemonSub(pokemon) {
    const data = await loadJsonFromApi('https://pokeapi.co/api/v2/pokemon/' + pokemon.about.id)
    pokemon.about.height = formatHeight(data.height);
    pokemon.about.weight = formatWeight(data.weight);
    pokemon.abilities = convertAbilities(data.abilities);
}


async function loadAboutDataFromSpeciesSub(pokemon) {
    const data = await loadJsonFromApi('https://pokeapi.co/api/v2/pokemon-species/' + pokemon.about.id)
    pokemon.about.genus = findGenus(data);
    pokemon.evolutionUrl = data.evolution_chain.url;
}


async function loadBaseStats(pokemon) {
    if (pokemon.stats.hp === null) {
        const data = await loadJsonFromApi('https://pokeapi.co/api/v2/pokemon/' + pokemon.about.id)
        let stats = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'];
        for (let i = 0; i < stats.length; i++) {
            const stat = data.stats[i].base_stat;
            pokemon.stats[`${stats[i]}`] = stat;
        }
        save();
    }
}


async function loadEvolutions(pokemon) {
    if (pokemon.evolutions.length === 0) {
        const data = await loadJsonFromApi(pokemon.evolutionUrl)
        for (let i = 0; i < data.chain.evolves_to.length; i++) {
            let evoArray = { basePokemon: fetchIdFromURL(data.chain.species.url), evolvesTo: null, detail: null };
            let urlArray = data.chain.evolves_to[i];
            evoArray.evolvesTo = fetchIdFromURL(urlArray.species.url);
            evoArray.detail = urlArray.evolution_details;
            pokemon.evolutions.push(evoArray);
            for (let j = 0; j < data.chain.evolves_to[i].evolves_to.length; j++) {
                let evoArrayTwo = { basePokemon: `${pokemon.evolutions[i].evolvesTo}`, evolvesTo: null, detail: null };
                let urlArrayTwo = data.chain.evolves_to[i].evolves_to[j];
                evoArrayTwo.evolvesTo = fetchIdFromURL(urlArrayTwo.species.url);
                evoArrayTwo.detail = urlArrayTwo.evolution_details;
                pokemon.evolutions.push(evoArrayTwo);
            }
        }
        save();
    }
}


async function loadMoves(pokemon) {
    if (pokemon.moves.length === 0) {
        const pokemonUrl = 'https://pokeapi.co/api/v2/pokemon/' + [pokemon.about.id];
        let responsePokemon = await fetch(pokemonUrl);
        let resPkmn = await responsePokemon.json();
        for (let i = 0; i < resPkmn.moves.length; i++) {
            const move = resPkmn.moves[i].move.name;
            pokemon.moves.push(move);
        }
        save();
    }
}


async function addEmptyCards() {
    for (let counter = cardsToLoad; counter > 0 && cardCounter < pokemonData.length; counter--, cardCounter++) {
        content.innerHTML += generateEmptyCardHtml(pokemonData[cardCounter].about.id);
        await delay(5);
    }
}


function addCardHead() {
    cardCounter = cardCounter - cardsToLoad;
    for (let counter = cardsToLoad; counter > 0; counter--, cardCounter++) {
        const pokemon = pokemonData[cardCounter];
        const card = document.getElementById('pkmn' + (pokemon.about.id));
        let qsName = card.querySelector(`h2.pokemonName`);
        let qsId = card.querySelector(`h2.pokemonID`);
        qsName.innerHTML = capitalize(pokemon.about.name);
        qsId.innerHTML = formatPokemonId(pokemon.about.id);
    }
}


async function addCardBody() {
    cardCounter = cardCounter - cardsToLoad;
    for (let counter = cardsToLoad; counter > 0; counter--, cardCounter++) {
        const pokemon = pokemonData[cardCounter];
        const card = document.getElementById('pkmn' + (pokemon.about.id));
        let qsTypes = card.querySelector(`div.pokemonCardTypes`);
        let qsImg = card.querySelector(`img`);
        await loadBodyData(pokemon);
        qsTypes.innerHTML = generateTypesHtml(pokemon);
        card.classList.add(`type_${pokemon.types[0]}`);
        qsImg.src = pokemon.imgUrl;
    }
}


function addInfoCard(id) {
    const pokemon = pokemonData[id - 1];
    const card = document.getElementById('pkmn' + id);
    let qs = card.querySelectorAll(`div.pokemonInfoBodySection`);
    qs[0].innerHTML = generateAboutTableHtml(pokemon);
    qs[1].innerHTML = generateBaseStatsTableHtml(pokemon);
    qs[2].innerHTML = addEvolution(pokemon);
    qs[3].innerHTML = addMoves(pokemon);
}


function addEvolution(pokemon) {
    let evos = pokemon.evolutions;
    let html = '';
    for (let i = 0; i < evos.length; i++) {
        const evo = evos[i];
        if (evo.detail.length == 0) { html += generateEvolutionHtml(pokemon, i, 0) };
        for (let j = 0; j < evo.detail.length; j++) {
            const evoDetail = evo.detail[j];
            html += generateEvolutionHtml(pokemon, i, j);
        }
    }
    return html
}


function addMoves(pokemon) {
    let moves = pokemon.moves;
    let html = '<div class="moves">';
    for (let i = 0; i < moves.length; i++) {
        const move = moves[i];
        html += `<span class="move">${capitalize(move)}</span>`;
    }
    html += '</div>';
    return html
}


function clear() {
    content.innerHTML = '';
    cardCounter = 0;
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