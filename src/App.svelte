<script lang="ts">
    import Header from './components/Header.svelte'
    import Home from './pages/Home.svelte'
    import About from './pages/About.svelte'
    import Work from './pages/Work.svelte'

    const theme: object = {
        primary: '#55ccc0',
        secondary: '#8574CB',
        softBlack: '#252525',
        bg: '#222',
        offBg: '#313131',
        bodyFont: '#eee',
        codePurple: '#bf80ff',
        codeRed: '#ff6133',
        codeGreen: '#9df274',
        codeBlue: '#33ccff',
        codeOrange: '#ffcc00'
        // codePurple: '#8574CB',
        // codeRed: '#8E3543',
        // codeGreen: '#7E9D6F',
    }
    $: cssVarColours = Object.entries(theme)
        .map(([key, value]) => `--${key}:${value}`)
        .join(';')

    enum Pages {
        home,
        work,
        about
    }
    $: activePage = Pages.home
    const changePage = (e: CustomEvent) => (activePage = e.detail)
</script>

<main style={cssVarColours}>
    <Header {activePage} on:pageChange={changePage} />

    {#if activePage === Pages.about}
        <About />
    {:else if activePage === Pages.work}
        <Work />
    {:else}
        <Home />
    {/if}
</main>

<style>
    main {
        display: grid;
        grid-template-rows: 40px;

        height: 100%;
        padding: 8px;
        background-color: var(--bg);
    }
    main :global(a) {
        text-decoration: underline;
        transition: all 0.2s ease-in;
    }
    main :global(a:hover) {
        color: var(--bodyFont);
        text-decoration: underline;
    }
    main :global(.primary) {
        color: var(--primary);
    }
    main :global(.secondary) {
        color: var(--secondary);
    }
    main :global(.bodyFont) {
        color: var(--bodyFont);
    }
    main :global(.codePurple) {
        color: var(--codePurple);
    }
    main :global(.codeRed) {
        color: var(--codeRed);
    }
    main :global(.codeGreen) {
        color: var(--codeGreen);
    }
    main :global(.codeBlue) {
        color: var(--codeBlue);
    }
    main :global(.codeOrange) {
        color: var(--codeOrange);
    }
</style>
