import { ManualAnimations } from "@/services/ManualAnimations";
import { AutoAnimations } from "@/services/AutoAnimations"

/**
 * A vue component adapter used to delegate the animations management to optimized services
 * @property {symbol} id - Unique ID of the component instance
 * @property {boolean} areAnimationsEnabled - Status of animation capability
 * @property {HTMLElement} domSection - The section / container that must be visible to enable the animation
 * @property {void} enableAnimations - The trigger to enable animations
 * @property {void} disableAnimations - The trigger to disable animations
 * @property {void} prepareForAnimations - The computation of animation data
 * @property {void} tick - The animation "apply" method
 */
export class AnimatedComponent {
    public id: symbol;
    public areAnimationsEnabled: boolean = false;
    public domSection: HTMLElement;
    public enableAnimations: () => void = () => { };
    public disableAnimations: () => void = () => { };
    public prepareForAnimations: () => void = () => { };
    public tick: (e?: Event | number) => void = () => { };

    /**
     * @param domSection The section / container that must be visible to enable the animation
     */
    constructor(domSection?: HTMLElement) {
        this.id = Symbol()
        this.domSection = domSection ?? null;
    }

    /**
     * Reset the instance to default values
     */
    public reset(): void {
        this.areAnimationsEnabled = false;
        this.enableAnimations = ()=>{};
        this.disableAnimations = ()=>{};
        this.prepareForAnimations = ()=>{};
        this.tick = ()=>{};
        this.removeAnimationTriggers();
    }

    /**
     * Compute and run the animation
     */
    public animate(e?: Event): void {
        // Ensure that the animation is visible
        if (!this.isVisibleOnScreen()) {
            if (this.areAnimationsEnabled) this.toggleAnimationStatus();
            return;
        }

        // Compute all the data for the animation tick
        if (!this.areAnimationsEnabled) this.toggleAnimationStatus();
        this.prepareForAnimations();

        // Delegate the animation sync to the browser
        e ? requestAnimationFrame(() => this.tick(e)) : requestAnimationFrame(this.tick);
    }

    public autoAnimate(): void {
        AutoAnimations.getInstance().addAnimation(this.id, this.animate.bind(this))
    }

    /**
     * Add a cutom event listener on a component that will be used to trigger this animation
     * @param el The Dom element that is listened
     * @param event Event type to listen 
     */
    public addAnimationTrigger(el: HTMLElement, event: string): void {
        ManualAnimations.getInstance().addEventListener(el, event, this.id, this.animate.bind(this));
    }

    /**
     * Remove all the listeners dedicated to this animation
     */
    public removeAnimationTriggers(): void {
        ManualAnimations.getInstance().removeEventListeners(this.id);
        AutoAnimations.getInstance().removeAnimation(this.id);
    }

    /**
     * Check if the animation is on a visible section
     * @returns True if the animation is visible
     */
    public isVisibleOnScreen(): boolean {
        if (!this.domSection) return true

        const isAboveScreen = this.domSection.getBoundingClientRect().bottom < 0;
        const isBelowScreen = this.domSection.getBoundingClientRect().top - window.innerHeight > 0
        return !isAboveScreen && !isBelowScreen
    }

    /**
     * Enable / Disable the animations based on current status
     */
    private toggleAnimationStatus(): void {
        this.areAnimationsEnabled ? this.disableAnimations() : this.enableAnimations();
        this.areAnimationsEnabled = !this.areAnimationsEnabled;
    }
}
