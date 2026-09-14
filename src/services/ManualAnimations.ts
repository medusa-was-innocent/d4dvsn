import { DomElement } from "@/services/DomElement";

/**
 * Class DI class that stores all the listened Dom elements
 * @property {ManualAnimations} instance - The "self" instance of the DI service
 * @property {DomElement[]} domElements - List of the Dom elements
 */
export class ManualAnimations {
    static instance: ManualAnimations;
    private domElements: DomElement[] = [];

    /**
     * Get or instanciate the ManualAnimations
     * @returns the single ManualAnimations instance
     */
    public static getInstance(): ManualAnimations {
        if (!ManualAnimations.instance) ManualAnimations.instance = new ManualAnimations();
        return ManualAnimations.instance;
    }

    /**
     * Create or attach an action to an event listener
     * @param el Dom element to listen
     * @param event Event type to listen
     * @param componentId Unique ID of the component instance
     * @param callback Action to trigger when listener emit
     */
    public addEventListener(el: HTMLElement, event: string, componentId: symbol, callback: () => void): void {
        this.registerDomElement(el);
        this.domElements.find(e => e.element == el).addListener(event, componentId, callback);
    }

    /**
     * Remove all the listeners linked to a component instance
     * @param componentId Unique ID of the component instance
     */
    public removeEventListeners(componentId: symbol): void {
        this.domElements.forEach(el => {
            el.removeListenersByComponentId(componentId)
        })
    }

    /**
     * Register a Dom element to listen
     * @param el Dom element to listen
     */
    private registerDomElement(el: HTMLElement): void {
        if (this.domElements.some(e => e.element == el)) return;
        this.domElements.push(new DomElement(el));
    }
}
