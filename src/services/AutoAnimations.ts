/**
 * Class DI class that stores all the listened Dom elements
 * @property {AutoAnimations} instance - The "self" instance of the DI service
 * @property {Map} animations - List of the animations
 */
export class AutoAnimations {
    static instance: AutoAnimations;
    private animations: Map<symbol, () => void> = new Map<symbol, () => void>();

    /**
     * Get or instanciate the AutoAnimations
     * @returns the single AutoAnimations instance
     */
    public static getInstance(): AutoAnimations {
        if (!AutoAnimations.instance) AutoAnimations.instance = new AutoAnimations();
        return AutoAnimations.instance;
    }

    constructor() {
        requestAnimationFrame(this.animate);
    }

    /**
     * Register a new animation
     * @param componentId Unique ID of the component instance
     * @param callback Action to trigger when listener emit
     */
    public addAnimation(componentId: symbol, callback: () => void): void {
        this.animations.set(componentId, callback);
    }

    /**
     * Remove an animation
     * @param componentId Unique ID of the component instance
     */
    public removeAnimation(componentId: symbol): void {
        this.animations.delete(componentId);
    }

    /**
     * Loop that runs all the animations
     */
    private animate = () => {
        this.animations.forEach(a => {
            a();
        })

        requestAnimationFrame(this.animate);
    }
}