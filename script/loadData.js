async function load() {
    let pokemonDataAsText = localStorage.getItem('pokemonData');
    if (pokemonDataAsText) {
        pokemonData = JSON.parse(pokemonDataAsText);
    } else {
        await loadPokemonData();
    }
}


async function loadPokemonData() {
    let response = await loadPokemonDataFromAPI();
    buildPokemonData(response);
    await loadGeneration();
    save();
}


async function loadGeneration() {
    const url = 'https://pokeapi.co/api/v2/generation?limit=9999&offset=0';
    let response = await fetch(url);
    let responseAsJson = await response.json();
    generations = responseAsJson.results;
    for (let i = 0; i < generations.length; i++) {
        const gen = i + 1;
        const genUrl = generations[i].url;
        const response = await fetch(genUrl);
        const data = await response.json();
        writeGenToPokemon(data.pokemon_species, gen);
    }
}


function writeGenToPokemon(data, gen) {
    for (let i = 0; i < data.length; i++) {
        const pokemon = data[i];
        const entry = pokemonData[(fetchIdFromURL(pokemon.url) - 1)];
        entry.about.generation = gen;
    }
}


async function loadPokemonDataFromAPI() {
    const url = 'https://pokeapi.co/api/v2/pokemon-species?limit=9999&offset=0';
    let response = await fetch(url);
    let responseAsJson = await response.json();
    return responseAsJson.results;
}


async function loadBodyData() {
    const pokemon = currentPokemonList[cardCounter];
    if (pokemon.types.length === 0) {
        await delay(10);
        let pokemonNo = cardCounter + 1;
        document.getElementById('loading').children[0].innerHTML = `Loading Pokemon ${pokemonNo} of ${currentPokemonList.length}`;
        await loadTypesFromUrl(pokemonNo, pokemon.about.id);
        saveList();
    }
    if (pokemon.imgUrl == null) {
        pokemon.imgUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.about.id}.png`
        saveList();
    }
}


async function loadInfoCardData(id) {
    const pokemon = pokemonData[id - 1];
    await loadAboutData(pokemon);
    await loadBaseStats(pokemon);
    await loadEvolutions(pokemon);
    await loadMoves(pokemon);
    saveList();
}


async function loadTypesFromUrl(pokemonNo, pokemonId) {
    const pokemonUrl = 'https://pokeapi.co/api/v2/pokemon/' + pokemonId;
    const response = await fetch(pokemonUrl);
    let responseAsJson = await response.json();
    let types = responseAsJson['types'];
    for (let i = 0; i < types.length; i++) {
        let type = types[i]['type']['name'];
        currentPokemonList[cardCounter].types.push(type);
    }
}


async function loadAboutData(pokemon) {
    if (pokemon.about.height === null || pokemon.about.weight === null || pokemon.abilities.length === 0) {
        const pokemonUrl = 'https://pokeapi.co/api/v2/pokemon/' + [pokemon.about.id];
        let responsePokemon = await fetch(pokemonUrl);
        let resPkmn = await responsePokemon.json();
        pokemon.about.height = formatHeight(resPkmn.height);
        pokemon.about.weight = formatWeight(resPkmn.weight);
        pokemon.abilities = convertAbilities(resPkmn.abilities);
        save();
    }
    if (pokemon.about.genus === null) {
        const speciesUrl = 'https://pokeapi.co/api/v2/pokemon-species/' + [pokemon.about.id];
        let responseSpecies = await fetch(speciesUrl);
        let resSpec = await responseSpecies.json();
        pokemon.about.genus = findGenus(resSpec);
        save();
    }
}


async function loadBaseStats(pokemon) {
    if (pokemon.stats.hp === null) {
        const pokemonUrl = 'https://pokeapi.co/api/v2/pokemon/' + [pokemon.about.id];
        let responsePokemon = await fetch(pokemonUrl);
        let resPkmn = await responsePokemon.json();
        pokemon.stats.hp = resPkmn.stats[0].base_stat;
        pokemon.stats.attack = resPkmn.stats[1].base_stat;
        pokemon.stats.defense = resPkmn.stats[2].base_stat;
        pokemon.stats.specialAttack = resPkmn.stats[3].base_stat;
        pokemon.stats.specialDefense = resPkmn.stats[4].base_stat;
        pokemon.stats.speed = resPkmn.stats[5].base_stat;
        save();
    }
}


async function loadEvolutions(pokemon) {
    if (pokemon.evolutions.length === 0) {
        const speciesUrl = 'https://pokeapi.co/api/v2/pokemon-species/' + [pokemon.about.id];
        let responseSpecies = await fetch(speciesUrl);
        let resSpec = await responseSpecies.json();
        pokemon.evolutionUrl = resSpec.evolution_chain.url;
        const url = pokemon.evolutionUrl;
        let responseEvolution = await fetch(url);
        let resEvo = await responseEvolution.json();
        for (let i = 0; i < resEvo.chain.evolves_to.length; i++) {
            let evoArray = { basePokemon: fetchIdFromURL(resEvo.chain.species.url), evolvesTo: null, detail: null };
            let urlArray = resEvo.chain.evolves_to[i];
            evoArray.evolvesTo = fetchIdFromURL(urlArray.species.url);
            evoArray.detail = urlArray.evolution_details;
            pokemon.evolutions.push(evoArray);
            for (let j = 0; j < resEvo.chain.evolves_to[i].evolves_to.length; j++) {
                let evoArrayTwo = { basePokemon: `${pokemon.evolutions[i].evolvesTo}`, evolvesTo: null, detail: null };
                let urlArrayTwo = resEvo.chain.evolves_to[i].evolves_to[j];
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