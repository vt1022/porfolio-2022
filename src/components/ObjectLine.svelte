<script lang="ts">
    export let key: string
    export let value: string
</script>

<span class="objectLine">
    {key}<span class="codeBlue">: '</span><span class="bodyFont"> {value}</span><span class="codeBlue">'</span>
</span>

<style>
    .objectLine {
        display: block;
    }
    .objectLine::after {
        content: ',';
        color: var(--codeBlue);
    }
    .objectLine:last-child:after {
        content: '';
    }
    .bodyFont {
        font-family: 'Khula';
    }
</style>
