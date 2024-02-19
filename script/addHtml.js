function addEmptyCards() {
    let content = document.getElementById('content');
    for (let i = 0; i < currentPokemonList.length; i++) {
        const pokemon = currentPokemonList[i];
        content.innerHTML += generateEmptyCardHtml(currentPokemonList[i].about.id);
    }
}


function addCardHeads() {
    const pokemon = currentPokemonList[cardCounter];
    const card = document.getElementById('pkmn' + (pokemon.about.id));
    let qsName = card.querySelector(`h2.pokemonName`);
    let qsId = card.querySelector(`h2.pokemonID`);
    qsName.innerHTML = capitalize(pokemon.about.name);;
    qsId.innerHTML = formatPokemonId(pokemon.about.id);
}


function addCardBodies() {
    const pokemon = currentPokemonList[cardCounter];
    const card = document.getElementById('pkmn' + (pokemon.about.id));
    let qsTypes = card.querySelector(`div.pokemonCardTypes`);
    let qsImg = card.querySelector(`img`);
    qsTypes.innerHTML = generateTypesHtml(pokemon);
    card.classList.add(`type_${pokemon.types[0]}`);
    qsImg.src = pokemon.imgUrl;
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