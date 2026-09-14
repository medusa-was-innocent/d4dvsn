import { EventObserver } from "@/services/EventObserver";

/**
 * Class that represent a Dom element to which is listened (watched/observed)
 * @property {HTMLElement} element - The Dom element that is listened
 * @property {[key: string]: EventObserver} listeners - List of listeners attached to the Dom element
 */
export class DomElement {
    public element: HTMLElement;
    private listeners: { [key: string]: { observer: EventObserver; boundHandler: EventListener } } = {};

    constructor(el: HTMLElement) {
        this.element = el;
    }

    /**
     * Attach a component action to an event listener
     * @param event Event type to listen
     * @param componentId Unique ID of the component instance
     * @param callback Action to trigger when listener emit
     */
    public addListener(event: string, componentId: symbol, callback: () => void): void {
        if (!this.listeners[event]) this.createEventObserver(event);
        this.listeners[event].observer.addAction(componentId, callback);
    }

    /**
     * Remove all the listeners linked to a component
     * @param componentId Unique ID of the component instance
     */
    public removeListenersByComponentId(componentId: symbol): void {
        Object.entries(this.listeners).forEach(([event, listener]) => {
            listener.observer.removeAction(componentId);
            if (listener.observer.actions.length === 0) this.removeEventObserver(event);
        });
    }

    /**
     * Add an event listener with custom listener emi
     * @param event Event type to listen
     */
    private createEventObserver(event: string): void {
        const observer = new EventObserver();
        const boundHandler = (e: Event) => observer.emit(e);
        this.element.addEventListener(event, boundHandler, { passive: true });
        this.listeners[event] = { observer, boundHandler: boundHandler as EventListener };
    }

    /**
     * Remove the event listener and custom listener
     * @param event Event type to listen
     */
    private removeEventObserver(event: string): void {
        const { boundHandler } = this.listeners[event];
        this.element.removeEventListener(event, boundHandler);
        delete this.listeners[event];
    }
}
