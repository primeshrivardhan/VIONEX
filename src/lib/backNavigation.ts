/**
 * Centralized back navigation and modal dismissal registry for Vionex
 * Handles closing of modals, bottom sheets, drawers, and confirmation dialogs
 * before screen navigation is popped.
 */

type BackHandler = () => boolean;

const handlerStack: BackHandler[] = [];

/**
 * Register a back handler (e.g. to close a modal, sheet, or drawer).
 * When Back is pressed, the most recently registered active handler is invoked.
 * If the handler returns true, the Back press is considered handled (consumed)
 * and screen navigation is not performed.
 *
 * @param handler Function to execute on back press. Should return true if handled.
 * @returns Cleanup function to unregister the handler.
 */
export function registerBackHandler(handler: BackHandler): () => void {
  handlerStack.push(handler);
  return () => {
    const idx = handlerStack.lastIndexOf(handler);
    if (idx !== -1) {
      handlerStack.splice(idx, 1);
    }
  };
}

/**
 * Executes the topmost registered modal/overlay back handler.
 * Returns true if a modal was dismissed, false if no handlers were active.
 */
export function executeTopBackHandler(): boolean {
  while (handlerStack.length > 0) {
    const handler = handlerStack.pop();
    if (handler) {
      try {
        const handled = handler();
        if (handled) {
          return true;
        }
      } catch (err) {
        console.error("Error executing back handler:", err);
      }
    }
  }
  return false;
}

/**
 * Returns the count of currently registered modal/dialog handlers.
 */
export function getActiveBackHandlerCount(): number {
  return handlerStack.length;
}
