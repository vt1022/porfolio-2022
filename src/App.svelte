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

    $: isDarkTheme = true
    const changeTheme = (e: CustomEvent) => (isDarkTheme = !e.detail)

    $: themeCssVars = Object.entries(isDarkTheme ? theme.dark : theme.light)
        .map(([key, value]) => `--${key}:${value}`)
        .join(';')

    $: activePage = Pages.home
    const changePage = (e: CustomEvent) => (activePage = e.detail)

    console.log(`Thanks for looking ¯\\(°‿o)/¯`)
</script>

<main style={themeCssVars}>
    <Header {activePage} {isDarkTheme} on:pageChange={changePage} on:themeChange={changeTheme} />

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
        grid-template-rows: min-content;
        height: 100%;
        padding: 8px;
        background-color: var(--bg);
        transition: all 0.2s ease-in;
    }
    main :global(a) {
        color: var(--bodyFont);
        text-decoration: none;
        transition: all 0.2s ease-in;
        border-bottom: 1px solid var(--primary);
    }
    main :global(a:hover) {
        color: var(--primary);
        border-bottom: 1px solid var(--secondary);
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
