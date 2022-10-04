<script lang="ts">
    import Header from './components/Header.svelte'
    import Home from './pages/Home.svelte'
    import About from './pages/About.svelte'
    import Work from './pages/Work.svelte'
    import theme from './data/theme.js'

    enum Pages {
        home,
        work,
        about
    }

    $: themeObject = Object.entries(theme)
        .map(([key, value]) => `--${key}:${value}`)
        .join(';')

    $: activePage = Pages.home
    const changePage = (e: CustomEvent) => (activePage = e.detail)

    console.log(`Thanks for looking ¯\\(°‿o)/¯`)
</script>

<main style={themeObject}>
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
