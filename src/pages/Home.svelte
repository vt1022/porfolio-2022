<script lang="ts">
    import { fly } from 'svelte/transition'
</script>

<section class="home container" in:fly={{ x: 300, duration: 500 }}>
    <div class="greetingContainer">
        <p class="greeting">hey, i'm</p>
        <h2 class="name">vincci <span class="name name--last">tsui</span></h2>
        <h2 class="title">frontend developer</h2>
    </div>
    <ul class="contactList bodyFont">
        <li class="contact">
            <span class="codePurple">const</span> <span class="codeRed">email</span> <span class="codePurple">=</span>
            <a target="_blank" rel="noopener" href="mailto:vinccimantsui@gmail.com" aria-label="email me">
                vinccimantsui@gmail.com
            </a>
        </li>
        <li class="contact">
            <span class="codePurple">const</span> <span class="codeRed">github</span> <span class="codePurple">=</span>
            <a target="_blank" rel="noopener" href="https://github.com/vt1022" aria-label="go to my github"> /vt1022 </a>
        </li>
        <li class="contact">
            <span class="codePurple">const</span> <span class="codeRed">linkedin</span> <span class="codePurple">=</span>
            <a
                target="_blank"
                rel="noopener"
                href="https://www.linkedin.com/in/vincci-tsui-040a031a3/"
                aria-label="go to my linkedin"
            >
                /vinccimantsui
            </a>
        </li>
        <!-- <li class="contact">
            <span class="codePurple">const</span> <span class="codeRed">resume</span> <span class="codePurple">=</span>
            <a href="assets/resume-vincci-tsui-2022-b.pdf" download="resume-vincci-tsui" aria-label="download resume">
                download pdf
            </a>
        </li> -->
    </ul>
</section>

<style>
    .container {
        display: flex;
        flex-direction: column;
        margin-top: 3em;
    }

    .greetingContainer {
        margin-bottom: 3em;
    }

    .greeting {
        font-size: 28px;
        margin: 0 0 0.3em 0;
        color: var(--bodyFont);
        text-align: center;
    }

    .name {
        font-family: 'LimeLight';
        /* font-family: 'Courier New'; */
        font-size: 65px;
        font-weight: 600;
        color: var(--primary);

        margin: 0;
        line-height: 0.9;
        text-align: center;
        text-transform: uppercase;
    }

    .name--last {
        color: var(--secondary);
    }

    .title {
        font-size: 25px;
        font-weight: 400;
        color: var(--bodyFont);

        margin: 0;
        display: block;
        line-height: 1;
        letter-spacing: 0.6em;
        text-align: center;
        text-transform: lowercase;
        word-spacing: -0.2em;
    }

    .contactList {
        display: grid;
        grid-gap: .7em;
        margin: 0 auto;
        font-family: 'Courier New', Courier, monospace;
        font-weight: 400;
        line-height: 1.2;
    }
</style>
