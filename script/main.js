let root = document.querySelector(':root');
let currentCard;
let currentCardInfo;
let cardIsOpen = false;
let pokemonData = [];
let searchData = [];
let currentArray = [];
let currentPokemon;
let cardCounter;
let isLoading = false;
let scrollIsHandled = false;
let newSearchStarted = false;

window.addEventListener("scroll", handleScroll);



async function init() {
    clear();
    await load();
    cardCounter = 0;
    currentArray = pokemonData;
    await renderCards();
}


async function renderCards() {
    if (cardCounter < currentArray.length) {
        if (isLoading == false) {
            isLoading = true;
            await buildCard();
            cardCounter++;
            isLoading = false;
        }
        await repeatToFillScreen();
    }
}


async function buildCard() {
    await delay(5)
    addEmptyCard();
    addCardHead();
    await addCardBody();
}


async function repeatToFillScreen() {
    for (windowHeight = window.innerHeight, bodyHeight = document.body.offsetHeight; windowHeight >= bodyHeight - 100 && cardCounter < currentArray.length; bodyHeight = document.body.offsetHeight) {
        if (newSearchStarted == false) {
            await delay(5);
            await renderCards();
        }
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


async function handleScroll() {
    if (cardCounter < currentArray.length && isNearBottom() && !scrollIsHandled) {
        if (!isLoading) {
            await renderOnScroll()
        } else {
            for (let i = 0; i < 100; i++) {
                await delay(100);
                if (!isLoading) {
                    await renderOnScroll()
                    break;
                }
            }
        }
        if (cardCounter < currentArray.length && isNearBottom()) handleScroll();
    }
}


async function renderOnScroll() {
    scrollIsHandled = true;
    if (newSearchStarted == false) {
        await renderCards()
        await handleScroll()
    }
    scrollIsHandled = false;
}


async function loadBodyData() {
    if (currentPokemon.types.length === 0) {
        await loadTypesFromUrl();
        save();
    }
    if (currentPokemon.imgUrl == null) {
        currentPokemon.imgUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${currentPokemon.about.id}.png`
        save();
    }
}


async function loadInfoCardData(id) {
    const pokemon = pokemonData[id - 1];
    await loadAboutData(pokemon);
    await loadBaseStats(pokemon);
    await loadEvolutions(pokemon);
    await loadMoves(pokemon);
    save();
}


async function loadTypesFromUrl() {
    const data = await loadJsonFromApi('https://pokeapi.co/api/v2/pokemon/' + currentPokemon.about.id)
    let types = data['types'];
    for (let i = 0; i < types.length; i++) {
        let type = types[i]['type']['name'];
        currentPokemon.types.push(type);
        pokemonData[currentPokemon.about.id - 1].length == 0 ? pokemonData[currentPokemon.about.id - 1].types.push(type) : '';
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
        await loadFirstLevelEvolutions(pokemon, data)
    }
    save();
}


async function loadFirstLevelEvolutions(pokemon, data) {
    for (let i = 0; i < data.chain.evolves_to.length; i++) {
        let evoArray = { basePokemon: fetchIdFromURL(data.chain.species.url), evolvesTo: null, detail: null };
        let urlArray = data.chain.evolves_to[i];
        evoArray.evolvesTo = fetchIdFromURL(urlArray.species.url);
        evoArray.detail = urlArray.evolution_details;
        pokemon.evolutions.push(evoArray);
        loadSecondLevelEvolutions(pokemon, data, i)
    }
}


async function loadSecondLevelEvolutions(pokemon, data, i) {
    for (let j = 0; j < data.chain.evolves_to[i].evolves_to.length; j++) {
        let evoArrayTwo = { basePokemon: `${pokemon.evolutions[i].evolvesTo}`, evolvesTo: null, detail: null };
        let urlArrayTwo = data.chain.evolves_to[i].evolves_to[j];
        evoArrayTwo.evolvesTo = fetchIdFromURL(urlArrayTwo.species.url);
        evoArrayTwo.detail = urlArrayTwo.evolution_details;
        pokemon.evolutions.push(evoArrayTwo);
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


function addEmptyCard() {
    currentPokemon = currentArray[cardCounter];
    if (cardCounter < currentArray.length) {
        content.innerHTML += generateEmptyCardHtml(currentPokemon.about.id);
    }
}


function addCardHead() {
    const card = document.getElementById('pkmn' + (currentPokemon.about.id));
    let qsName = card.querySelector(`h2.pokemonName`);
    let qsId = card.querySelector(`h2.pokemonID`);
    qsName.innerHTML = capitalize(currentPokemon.about.name);
    qsId.innerHTML = formatPokemonId(currentPokemon.about.id);
}


async function addCardBody() {
    const card = document.getElementById('pkmn' + (currentPokemon.about.id));
    let qsTypes = card.querySelector(`div.pokemonCardTypes`);
    let qsImg = card.querySelector(`img`);
    await loadBodyData();
    qsTypes.innerHTML = generateTypesHtml();
    card.classList.add(`type_${currentPokemon.types[0]}`);
    qsImg.src = currentPokemon.imgUrl;
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


async function searchPokemon() {
    newSearchStarted = true;
    const input = document.getElementById('searchField').value.toLowerCase();
    searchData = [];
    currentArray = input === '' ? pokemonData : searchData;
    clear();
    pokemonData.forEach(pokemon => {
        if (pokemon.about.name.includes(input)) {;
            searchData.push(pokemon)
        }
    });
    cardCounter = 0;
    newSearchStarted = false;
    await renderCards();
}