function generateEmptyCardHtml(id) {
    let html = '';
    html += `
        <div id="pkmn${id}" class="pokemonCard pointer" onclick="toggleCard('pkmn${id}', event)">
            <div class="pokemonCardHead">
                <h2 class="pokemonName">Loading...</h2>
                <h2 class="pokemonID"></h2>
            </div>
        <div class="pokemonCardBody">
            <div class="pokemonCardTypes"></div>
            <img alt="pokemon-image">
        </div>
        <div id="pkmn${id}Info" class="pokemonInfo dNone">
            <div class="pokemonInfoHead">
                <div class="pokemonInfoHeadHeadlines">
                        <a class="pointer highlightedHeadline" onclick="switchInfoSection(this)"><span>About</span></a>
                        <a class="pointer" onclick="switchInfoSection(this)"><span>Base Stats</span></a>
                        <a class="pointer" onclick="switchInfoSection(this)"><span>Evolution</span></a>
                        <a class="pointer" onclick="switchInfoSection(this)"><span>Moves</span></a>
                    </div>
                    <div class="blankBar">
                        <div class="positionBar"></div>
                    </div>
                </div>
                <div class="pokemonInfoBody">
                    <div class="pokemonInfoBodySection">Loading...</div>
                    <div class="pokemonInfoBodySection">Loading...</div>
                    <div class="pokemonInfoBodySection">Loading...</div>
                    <div class="pokemonInfoBodySection">Loading...</div>
                </div>
            </div>
        </div>
    `;
    return html
}


function generateTypesHtml() {
    let html = '';
    let types = currentPokemon.types;
    for (let i = 0; i < types.length; i++) {
        const type = types[i];
        html += `<span class="pokemonTypeField">${capitalize(type)}</span>`
    }
    return html
}


function generateAboutTableHtml(pokemon) {
    let html = '';
    html += `
        <table>
            <tbody>
                <tr class="species">
                    <th>Genus</th>
                    <td>${pokemon.about.genus}</td>
                </tr>
                <tr class="height">
                    <th>Height</th>
                    <td>${pokemon.about.height}</td>
                </tr>
                <tr class="weight">
                    <th>Weight</th>
                    <td>${pokemon.about.weight}</td>
                </tr>
                <tr class="abilities">
                    <th>Abilities</th>
                    <td>${formatAbilities(pokemon)}</td>
                </tr>
            </tbody>
        </table>
    `
    return html
}


function generateBaseStatsTableHtml(pokemon) {
    let html = '';
    html += `
        <table>
            <tbody>
                <tr class="hp">
                    <th>HP</th>
                    <td>${pokemon.stats.hp}</td>
                    <td><progress id="file" max="255" value="${pokemon.stats.hp}"></progress></td>
                </tr>
                <tr class="attack">
                    <th>Attack</th>
                    <td>${pokemon.stats.attack}</td>
                    <td><progress id="file" max="255" value="${pokemon.stats.attack}"></progress></td>
                </tr>
                <tr class="defense">
                    <th>Defense</th>
                    <td>${pokemon.stats.defense}</td>
                    <td><progress id="file" max="255" value="${pokemon.stats.defense}"></progress></td>
                </tr>
                <tr class="specialAttack">
                    <th>Special-Attack</th>
                    <td>${pokemon.stats.specialAttack}</td>
                    <td><progress id="file" max="255" value="${pokemon.stats.specialAttack}"></progress></td>
                </tr>
                <tr class="specialDefense">
                    <th>Special-Defense</th>
                    <td>${pokemon.stats.specialDefense}</td>
                    <td><progress id="file" max="255" value="${pokemon.stats.specialDefense}"></progress></td>

                </tr>
                <tr class="speed">
                    <th>Speed</th>
                    <td>${pokemon.stats.speed}</td>
                    <td><progress id="file" max="255" value="${pokemon.stats.speed}"></progress></td>
                </tr>
            </tbody>
        </table>
    `
    return html
}


function generateEvolutionHtml(pokemon, i, j) {
    let html = '';
    html += `
            <div class="evolution">
                <img class="evolutionImage" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.evolutions[i].basePokemon}.png" alt="pokemon-image">
                <div class="evolutionDetail">`
    if (pokemon.evolutions[i].detail[j].hasOwnProperty('trigger')) { html += `<span>${pokemon.evolutions[i].detail[j].trigger.name.replace('-', ' ')}</span>` }
    html += `<img class="evolutionArrow" src=".//img/icons/longArrowRight.png" alt="">`
    if (findEvoCondition(pokemon, i, j)) html += `<span>${findEvoCondition(pokemon, i, j)}</span>`
    html += `
                </div>
                <img class="evolutionImage" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.evolutions[i].evolvesTo}.png" alt="pokemon-image">
            </div>
    `
    return html
}