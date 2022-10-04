<script>
    import { fly } from 'svelte/transition'
    import ObjectDeclaration from '../components/ObjectDeclaration.svelte'
    import ObjectLine from '../components/ObjectLine.svelte'
</script>

<section class="work container" in:fly={{ x: 300, duration: 500 }}>
    <ul class="workList bodyFont">
        <li class="work">
            <ObjectDeclaration name="my_portfolio" />
            <p class="insideObj codeGreen">
                live<span class="codeBlue">:</span>
                <a target="_blank" rel="noopener" href="https://vinccitsui.me" aria-label="my portfolio"> vinccitsui.me</a><span
                    class="codeBlue">,</span
                >
                <br />
                code<span class="codeBlue">:</span>
                <a target="_blank" rel="noopener" href="https://github.com/vt1022/portfolio-2022" aria-label="my portfolio">
                    github/portfolio</a
                ><span class="codeBlue">,</span>
                <ObjectLine
                    key="description"
                    value="Built as a project to learn Svelte with TypeScript. The design concept is to make it look like VS Code because
                    it is the main tool of a developer"
                />
                <ObjectLine key="skills" value="Svelte, TypeScript, Css, Html" />
            </p>
            <span class="codeOrange">&#125;</span>
        </li>
        <li class="work">
            <ObjectDeclaration name="che_patisserie" />
            <p class="insideObj codeGreen">
                live<span class="codeBlue">:</span>
                <a target="_blank" rel="noopener" href="https://chepatisserie.com" aria-label="che patisserie">
                    chepatisserie.com</a
                ><span class="codeBlue">,</span>
                <ObjectLine key="code" value="available upon request" />
                <ObjectLine
                    key="description"
                    value="Mobile-first e-Commerce website for a home baker client built with React. Integration with Google Sheets for
                    content management and Discord webhooks for notifications"
                />
                <ObjectLine key="skills" value="React, JavaScript, Sass, Html" />
            </p>
            <span class="codeOrange">&#125;</span>
        </li>
        <li class="work">
            <ObjectDeclaration name="poké_match" />
            <p class="insideObj codeGreen">
                live<span class="codeBlue">:</span>
                <a target="_blank" rel="noopener" href="https://vt1022.github.io/pokematch/" aria-label="pokématch">
                    gh-pages.pokematch</a
                ><span class="codeBlue">,</span>
                <br />
                code<span class="codeBlue">:</span>
                <a target="_blank" rel="noopener" href="https://github.com/vt1022/pokematch" aria-label="pokématch code repo">
                    github/pokematch</a
                ><span class="codeBlue">,</span>
                <ObjectLine
                    key="description"
                    value="Memory game to match pairs of Pokémon. Interactive game made with AJAX call to Pokémon api"
                />
                <ObjectLine key="skills" value="JavaScript, jQuery, Sass, Html" />
            </p>
            <span class="codeOrange">&#125;</span>
        </li>
        <li class="work">
            <ObjectDeclaration name="div_craft" />
            <p class="insideObj codeGreen">
                live<span class="codeBlue">:</span>
                <a target="_blank" rel="noopener" href="https://vt1022.github.io/characterSelection/" aria-label="div craft">
                    gh-pages.divcraft</a
                ><span class="codeBlue">,</span>
                <br />
                code<span class="codeBlue">:</span>
                <a
                    target="_blank"
                    rel="noopener"
                    href="https://github.com/vt1022/characterSelection"
                    aria-label="div craft code repo"
                >
                    github/divcraft</a
                ><span class="codeBlue">,</span>
                <ObjectLine
                    key="description"
                    value="Character creation screen of a game. Made with React and Firebase. One div style css drawings and animations"
                />
                <ObjectLine key="skills" value="React, JavaScript, Firebase, Sass, Html" />
            </p>
            <span class="codeOrange">&#125;</span>
        </li>
    </ul>
</section>

<style>
    .container {
        display: flex;
        flex-direction: column;
        align-items: center;
        height: 100%;
        font-family: 'Courier New', Courier, monospace;
        line-height: 1.2;
        overflow: scroll;
        scrollbar-width: none;
    }
    .workList {
        display: grid;
        grid-gap: 1em;
    }
    .insideObj {
        margin: 0;
        max-width: 530px;
        padding-left: 2em;
    }
</style>
