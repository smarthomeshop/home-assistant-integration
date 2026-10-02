/**
 * Guard custom-card registrations against Home Assistant replacing the global
 * CustomElementRegistry during frontend boot.
 *
 * Home Assistant 2026.8 introduced a scoped-registry polyfill. On a cold or
 * slow load an extra module can register its elements in the native registry
 * just before the polyfill replaces `window.customElements`. The module has
 * executed, but Lovelace then waits on a registry that does not know the card.
 */

export const CUSTOM_ELEMENTS_HEALED_EVENT = 'smarthomeshop-elements-healed';

interface RegistryLike {
  define(name: string, constructor: CustomElementConstructor): void;
  get(name: string): CustomElementConstructor | undefined;
  whenDefined(name: string): Promise<CustomElementConstructor>;
}

interface RegistryGuardOptions {
  registryAtLoad: RegistryLike;
  getCurrentRegistry: () => RegistryLike;
  pollIntervalMs?: number;
  pollRounds?: number;
  setTimer?: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  clearTimer?: (timer: ReturnType<typeof setTimeout>) => void;
  onHealed?: (names: string[], via: string) => void;
}

export interface CustomElementRegistryGuard {
  defineElement(name: string, constructor: CustomElementConstructor): void;
  checkNow(via?: string): void;
  dispose(): void;
}

export function createCustomElementRegistryGuard(
  options: RegistryGuardOptions,
): CustomElementRegistryGuard {
  const registryAtLoad = options.registryAtLoad;
  const pollIntervalMs = options.pollIntervalMs ?? 250;
  const pollRounds = options.pollRounds ?? 120;
  const setTimer = options.setTimer ?? ((callback, delay) => setTimeout(callback, delay));
  const clearTimer = options.clearTimer ?? ((timer) => clearTimeout(timer));

  const pending = new Map<string, CustomElementConstructor>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let rounds = 0;
  let watching = false;
  let disposed = false;

  const stopTimer = (): void => {
    if (timer === undefined) return;
    clearTimer(timer);
    timer = undefined;
  };

  const checkNow = (via = 'manual check'): void => {
    if (disposed || pending.size === 0) return;

    let current: RegistryLike;
    try {
      current = options.getCurrentRegistry();
    } catch (error) {
      console.warn('SmartHomeShop: could not inspect the custom-element registry', error);
      return;
    }

    // Nothing can have been lost while Home Assistant still exposes the same
    // registry object. Keep watching for a later boot-time replacement.
    if (current === registryAtLoad) return;

    const healed: string[] = [];
    for (const [name, constructor] of pending) {
      try {
        if (!current.get(name)) {
          current.define(name, constructor);
          healed.push(name);
        }
        pending.delete(name);
      } catch (error) {
        // A concurrent resource may be defining the same element. Leave the
        // entry pending so the bounded poll can verify it on the next pass.
        console.warn(`SmartHomeShop: retrying registration of ${name}`, error);
      }
    }

    if (healed.length > 0) {
      console.info(
        `SmartHomeShop: restored ${healed.join(', ')} after Home Assistant replaced the custom-element registry (${via})`,
      );
      options.onHealed?.(healed, via);
    }

    if (pending.size === 0) stopTimer();
  };

  const schedulePoll = (): void => {
    if (disposed || timer !== undefined || pending.size === 0 || rounds >= pollRounds) return;
    timer = setTimer(() => {
      timer = undefined;
      rounds += 1;
      checkNow('fallback poll');
      schedulePoll();
    }, pollIntervalMs);
  };

  const startWatching = (): void => {
    if (watching || disposed) return;
    watching = true;

    // Home Assistant installs the scoped registry before defining its root
    // element. This resolves quickly in the normal race, while the bounded
    // poll covers a late registry replacement on slow devices.
    void registryAtLoad.whenDefined('home-assistant')
      .then(() => checkNow('Home Assistant boot signal'))
      .catch(() => undefined);
    schedulePoll();
  };

  return {
    defineElement(name, constructor): void {
      if (disposed) return;
      try {
        if (!registryAtLoad.get(name)) registryAtLoad.define(name, constructor);
      } catch (error) {
        // Do not let one failed definition abort all sibling card/editor
        // registrations. The poll can still recover after a registry swap.
        console.warn(`SmartHomeShop: initial registration of ${name} failed`, error);
      }
      pending.set(name, constructor);
      startWatching();
      schedulePoll();
    },
    checkNow,
    dispose(): void {
      disposed = true;
      pending.clear();
      stopTimer();
    },
  };
}

let defaultGuard: CustomElementRegistryGuard | undefined;

export function defineCustomElement(
  name: string,
  constructor: CustomElementConstructor,
): void {
  if (!defaultGuard) {
    defaultGuard = createCustomElementRegistryGuard({
      registryAtLoad: globalThis.customElements,
      getCurrentRegistry: () => globalThis.customElements,
      onHealed: (names) => {
        window.dispatchEvent(new CustomEvent(CUSTOM_ELEMENTS_HEALED_EVENT, {
          detail: { names },
        }));
      },
    });
  }
  defaultGuard.defineElement(name, constructor);
}
