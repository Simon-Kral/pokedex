let root = document.querySelector(':root');

let currentCard;
let currentCardInfo;
let cardIsOpen = false;
let pokemonData = [];
let cardCounter = 0;
let cardsToLoad = 1;
let currentGen = null;
let currentPokemonList = [];
let isLoading = false;


async function init() {
    clearContent();
    await load();
    loadGens();
    await renderGen(1)
}


function loadGens() {
    let section = document.getElementById('stickyAside');
    let generations = pokemonData.slice(-1)[0].about.generation;
    for (let i = 0; i <= (generations - 1); i++) {
        section.innerHTML += `<p class="pointer" id="gen${i + 1}" onclick="renderGen(${i + 1})">Generation ${i + 1}</p>`
    }
}


async function renderGen(gen) {
    if (gen != currentGen) {
        if (currentGen != null) { document.getElementById(`gen${currentGen}`).classList.remove('bold') };
        currentGen = gen;
        document.getElementById(`gen${currentGen}`).classList.add('bold');
        document.getElementById('loading').children[0].innerHTML = `Loading Pokemon-List of Gen ${currentGen}`;
        document.getElementById('loading').classList.toggle('dNone');
        await delay(5);
        let list = 'currentPokemonList' + gen;
        let currentPokemonListAsText = localStorage.getItem(list);
        if (currentPokemonListAsText) {
            currentPokemonList = JSON.parse(currentPokemonListAsText);
        } else {
            currentPokemonList = [];
            for (let i = 0; i < pokemonData.length; i++) {
                const pokemon = pokemonData[i];
                if (pokemon.about.generation == currentGen) {
                    currentPokemonList.push(pokemon);
                }
            }
            saveList();
        }
        clearContent();
        addEmptyCards();
        for (cardCounter = 0; cardCounter < currentPokemonList.length; cardCounter++) {
            isLoading = true;
            await loadAndRenderCards();
            isLoading = false;
        }
        document.getElementById('loading').classList.toggle('dNone');
    }
}


function saveList() {
    let currentPokemonListAsText = JSON.stringify(currentPokemonList);
    localStorage.setItem(`currentPokemonList${currentGen}`, currentPokemonListAsText);
}


async function loadAndRenderCards() {
    await loadBodyData();
    addCardHeads();
    addCardBodies();
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
    await delay(5);
    toggleCardGrow();
    await loadAndRenderInfoCard(cardId);
}


async function loadAndRenderInfoCard(cardId) {
    let pokemonId = cardId.slice(4);
    await loadInfoCardData(pokemonId);
    addInfoCard(pokemonId);
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


function save() {
    let pokemonDataAsText = JSON.stringify(pokemonData);
    localStorage.setItem('pokemonData', pokemonDataAsText);
}