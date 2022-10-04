<script lang="ts">
    import HeaderNavLink from './HeaderNavLink.svelte'

    export let activePage: number

    let innerWidth: number = 0
    $: desktopMode = innerWidth > 370
</script>

<svelte:window bind:innerWidth />

<header class={`header ${desktopMode ? 'header--desktop' : 'header--mobile'}`}>
    <nav class={`nav ${desktopMode ? 'nav--desktop' : 'nav--mobile'}`}>
        {#if desktopMode}
            <ul class="navList">
                <HeaderNavLink innerHtml="Home.js" toPage={0} {activePage} on:pageChange />
                <HeaderNavLink innerHtml="MyWork.js" toPage={1} {activePage} on:pageChange />
                <HeaderNavLink innerHtml="AboutMe.html" toPage={2} {activePage} on:pageChange />
            </ul>
        {:else}
            <!-- skip link -->
            <a href="#home" class="skip-link visuallyHidden">skip to main content</a>
            <!-- hamburger checkbox starts -->
            <input type="checkbox" id="toggle" name="toggle" class="nav__toggle-input" />
            <label for="toggle" class="nav__toggle-label">
                <div class="hamburger">
                    <div class="hamburger-lines line1" />
                    <div class="hamburger-lines line2" />
                    <div class="hamburger-lines line3" />
                </div>
            </label>
            <ul class="nav__links">
                <HeaderNavLink innerHtml="Home.js" toPage={0} {activePage} on:pageChange />
                <HeaderNavLink innerHtml="MyWork.js" toPage={1} {activePage} on:pageChange />
                <HeaderNavLink innerHtml="AboutMe.html" toPage={2} {activePage} on:pageChange />
            </ul>
        {/if}
    </nav>
</header>

<style>
    .header--desktop {
        display: flex;
        border-bottom: 2px solid var(--offBg);
    }
    .header {
        overflow: hidden;
    }
    .nav {
        margin: 0 auto;
        width: 700px;
        max-width: 98vw;
    }
    .navList {
        display: flex;
        margin: 0;
    }

    /* hamburger starts */
    .nav__toggle-input {
        display: none;
    }
    .nav__toggle-label {
        position: relative;
        top: 0;
        z-index: 4;
        transition: 0.5s;
    }
    .nav__links {
        position: relative;
        left: 40px;
        top: -550px;
        height: 0;
        margin: 0;
        padding-bottom: 0.5em;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        transition: all 0.5s ease-in-out;
        overflow: hidden;
    }
    .nav__toggle-input:checked ~ .nav__links {
        z-index: 11111111;
        top: -30px;
        height: 90px;

        background: var(--bg);
    }
    .nav .hamburger {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        position: relative;
        z-index: 6;
        height: 25px;
        width: 50px;
        max-width: 120px;
        min-width: 30px;
        transition: 0.5s ease;
    }
    .nav .hamburger:active .hamburger-lines {
        transform: translate(5px, 5px);
    }
    .nav .hamburger-lines {
        width: 100%;
        height: 1px;

        background: var(--bodyFont);
        transition: 0.5s ease;
    }
    .nav .hamburger-lines.line3 {
        width: calc(100% / (1.6 * 2));
    }
    .nav .hamburger-lines.line1 {
        height: 3px;
        width: calc(100% / 1.6);
        background: var(--primary);
    }
    /* hamburger animation starts */
    .nav__toggle-input:checked + label > .hamburger > .line1 {
        width: 30px;
        transform: translateY(10px) rotate(405deg);
    }
    .nav__toggle-input:checked + label > .hamburger > .line2 {
        opacity: 0;
    }
    .nav__toggle-input:checked + label > .hamburger > .line3 {
        width: 30px;
        transform: translateY(-14px) rotate(-405deg);
    }
    .nav .hamburger:hover,
    .nav .hamburger:focus {
        cursor: pointer;
    }
</style>
