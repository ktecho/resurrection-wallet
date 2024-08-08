import { Command } from "@tauri-apps/plugin-shell";
import { exists } from "@tauri-apps/plugin-fs";
import { Store } from '@tauri-apps/plugin-store';

const store = new Store('resurrection_wallet_setup.bin');

export function formatDate(timestamp) {
    return new Date(timestamp).toLocaleString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

export function formatAmount(amount, millisatoshis: boolean = false) {
    if (millisatoshis) {
        let sats = Math.round(amount / 1000);
        return `${sats.toLocaleString()} sats`;
    } else {
        return `${amount.toLocaleString()} sats`;
    }
}

export function truncateString(description, maxLength = 40) {
    if (!description) return "";

    return description.length > maxLength
        ? description.slice(0, maxLength) + "..."
        : description;
}

export function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
        // Opcionalmente, puedes mostrar una notificación de que se ha copiado
        alert("Channel ID copiado al portapapeles");
    }).catch(err => {
        console.error('Error al copiar el texto: ', err);
    });
}

export async function persistSetup(entries: [key: string, value: unknown][]) {
    console.log("saveSetup - SETUP ENTRIES: " + entries);

    for (const [key, value] of entries) {
        await store.set(key, value);
    }

    await store.save();
}

export async function loadSetup() {
    const setupEntries = await store.entries();
    console.log("loadSetup - SETUP ENTRIES: " + setupEntries);
    return setupEntries;
}

export async function startPhoenixd(network: string = "mainnet", waitMillis: number = 3000): Promise<boolean> {
    console.log("Starting phoenixd...");

    try {
        await Command.create("exec-sh", ["-c", "pkill phoenixd"]).execute();

        Command.create("exec-sh", ["-c", `binaries/phoenixd --chain=${network}`]).execute();

        // Wait a bit for the process to start up
        await new Promise((resolve) => setTimeout(resolve, waitMillis));

        return true;

    } catch (e) {
        console.error("Error starting phoenixd:", e);
        return false;
    }
}

export async function stopPhoenixd() {
    console.log("Stopping phoenixd...");

    try {
        await Command.create("exec-sh", ["-c", "pkill phoenixd"]).execute();
        return true;
    } catch (e) {
        console.error("Error stopping phoenixd:", e);
        return false;
    }
}

export async function phoenixBinaryExists(): Promise<boolean> {
    try {
        return await exists("binaries/phoenixd");
    } catch (error) {
        throw error;
    }
}
