import { writable } from 'svelte/store';
import { loadSetup, persistSetup } from './utils';

type SetupData = [string, unknown][];

function createSetupStore() {
    const { subscribe, set, update } = writable<SetupData>([]);

    return {
        subscribe,
        set: (value: SetupData) => {
            set(value);
            persistSetup(value);
        },
        update: (updater: (value: SetupData) => SetupData) => {
            update(store => {
                const newValue = updater(store);
                persistSetup(newValue);
                return newValue;
            });
        },
        load: async () => {
            const setupData = await loadSetup();
            set(setupData);
        }
    };
}

export const setupStore = createSetupStore();