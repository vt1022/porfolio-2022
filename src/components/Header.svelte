<script lang="ts">
    import { createEventDispatcher } from 'svelte'

    export let activePage: number

    const dispatch = createEventDispatcher()
    
    const handlePageClick = (page: number) => dispatch('pageChange', page)

    $: active = activePage
</script>

<header class="header">
    <nav>
        <ul class="navList">
            <li class={`navLink primary ${active === 0 ? 'active' : ''}`} on:click|preventDefault={() => handlePageClick(0)}>
                Home.js
            </li>
            <li class={`navLink primary ${active === 1 ? 'active' : ''}`} on:click|preventDefault={() => handlePageClick(1)}>
                MyWork.js
            </li>
            <li class={`navLink primary ${active === 2 ? 'active' : ''}`} on:click|preventDefault={() => handlePageClick(2)}>
                AboutMe.html
            </li>
        </ul>
    </nav>
</header>

<style>
    .navList {
        display: flex;
        margin: 0;
    }
    .navLink {
        margin: 0;
        padding: 0 0.5em;
        border-bottom: 1px none var(--primary);
        background-color: var(--offBg);
        font-size: 1.2rem;
        cursor: pointer;
        transition: all 0.3s ease-in;
    }
    .navLink:after {
        content: '*';
        color: var(--bodyFont);
        opacity: 0;
        transition: all 0.3s ease-in;
    }
    .navLink:hover::after {
        opacity: 1;
    }
    .navLink.active {
        border-bottom: 1px solid var(--secondary);
        background-color: var(--bg);
    }
    .navLink.active::after {
        opacity: 1;
    }
</style>
