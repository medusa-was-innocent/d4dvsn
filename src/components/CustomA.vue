<script setup>
import { computed } from 'vue';

const props = defineProps({
    text: { type: String, required: true },
    href: { type: String, default: '#' },
    target: { type: String, default: '' }
});
const letters = computed(() => Array.from(props.text));
</script>

<template>
    <a :href="href" :target="target" :rel="target === '_blank' ? 'noopener noreferrer' : undefined"
        :aria-label="text" class="animated-link">
        <span class="link-window" aria-hidden="true">
            <span class="link-copy">
                <span v-for="(letter, i) in letters" :key="i" class="link-letter"
                    :style="{ '--delay': `${i * 16}ms` }">{{ letter === ' ' ? '\u00a0' : letter }}</span>
            </span>
            <span class="link-copy link-copy-hover">
                <span v-for="(letter, i) in letters" :key="i" class="link-letter"
                    :style="{ '--delay': `${i * 16}ms` }">{{ letter === ' ' ? '\u00a0' : letter }}</span>
            </span>
        </span>
    </a>
</template>

<style scoped>
.animated-link { display: inline-flex; max-width: 100%; min-width: 0; }
/* Both copies have room for descenders (g, j, p and y) and serif overhang. */
.link-window { position: relative; display: block; max-width: 100%; padding: .12em .08em .2em; margin: -.12em -.08em -.2em; overflow: hidden; line-height: 1.55; }
.link-copy { display: flex; white-space: pre; }
.link-copy-hover { position: absolute; top: calc(100% - .2em); left: .08em; color: var(--color-red-custom); }
.link-letter { display: inline-block; transition: transform .3s cubic-bezier(.2,.7,.2,1); transition-delay: var(--delay); }
.animated-link:is(:hover, :focus-visible) .link-copy:not(.link-copy-hover) .link-letter { transform: translateY(-145%); }
.animated-link:is(:hover, :focus-visible) .link-copy-hover .link-letter { transform: translateY(-100%); }
@media (prefers-reduced-motion: reduce) {
    .link-letter { transition: none; }
    .link-copy-hover { display: none; }
    .animated-link:is(:hover, :focus-visible) .link-copy .link-letter { transform: none; color: var(--color-red-custom); }
}
</style>
