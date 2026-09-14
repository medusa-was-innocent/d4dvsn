/**
 * The actions per components that runs on listener emit
 * @property {symbol} componentId - Unique ID of the component instance
 * @property {void} onEmit - Action to run when the listener emits
 */
interface Action {
    componentId: symbol; 
    callback: (e: Event) => void;
}

/**
 * A custom action that is triggered by the event listener
 * @property {Action[]} actions - The actions per components that runs on listener emit
 */
export class EventObserver {
    public actions: Action[] = [];

    /**
     * Run all the listeners's actions 
     */
    public emit(e: Event): void {
        this.actions.forEach((a) => a.callback(e));
    }

    /**
     * Register a new action to run on the emit
     * @param componentId Unique ID of the component instance
     * @param callback Action to run when the listener emits
     */
    public addAction(componentId: symbol, callback: () => void): void {
        this.actions.push({ componentId, callback });
    }

    /**
     * Remove all the linked to a component instance
     * @param componentId Unique ID of the component instance
     */
    public removeAction(componentId: symbol): void {
        this.actions = this.actions.filter((a) => a.componentId !== componentId);
    }
}
