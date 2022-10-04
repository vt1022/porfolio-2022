<script lang="ts">
    import { fly } from 'svelte/transition'
</script>

<section class="about container" in:fly={{ x: 300, duration: 500 }}>
    <p class="bodyFont">
        <span class="pTag">
            <span class="codeBlue">&lt;</span><span class="codeRed">p</span><span class="codeBlue">&gt;</span>
        </span>
        <span class="content">
            I am a developer with design experience. My experience has taught me the value of reusability, user experience, and
            accessibility from both a development and design perspective. I love finding solutions that balance these concepts. I
            currently work daily with React, JavaScript, TypeScript, Node, Git, Webpack, HTML and SASS. I am also currently
            learning other new technologies such as Svelte.
        </span>
        <span class="pTag">
            <span class="codeBlue">&lt;/</span><span class="codeRed">p</span><span class="codeBlue">&gt;</span>
        </span>
    </p>
</section>

<style>
    .container {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 3em;
    }
    .bodyFont {
        max-width: 480px;
    }
    .pTag {
        display: block;
        font-family: 'Courier New', Courier, monospace;
    }
    .content {
        display: block;
        padding-left: 2em;
    }
</style>
