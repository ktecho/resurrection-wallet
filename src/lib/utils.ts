import { Command } from "@tauri-apps/plugin-shell";
import { exists } from "@tauri-apps/plugin-fs";
import { Store } from '@tauri-apps/plugin-store';
import { join, appDataDir } from '@tauri-apps/api/path';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { ask } from '@tauri-apps/plugin-dialog';

export let phoenixVersionLiteral = "phoenix-0.3.2-linux-x64";

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
        alert("Channel ID copiado al portapapeles");
    }).catch(err => {
        console.error('Error al copiar el texto: ', err);
    });
}

export async function persistSetup(entries: [key: string, value: unknown][]) {
    for (const [key, value] of entries) {
        await store.set(key, value);
    }

    await store.save();
}

export async function loadSetup() {
    return await store.entries();
}

export async function startPhoenixd(network: string = "mainnet", waitMillis: number = 3000): Promise<boolean> {
    const appDirectory: string = await appDataDir();

    console.log("Starting phoenixd...");

    try {
        await Command.create("exec-sh", ["-c", "pkill phoenixd"]).execute();

        Command.create("exec-sh", ["-c", `${await join(appDirectory, "phoenixd")} --chain=${network}`]).execute();

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
    const appDirectory: string = await appDataDir();

    try {
        return await exists(await join(appDirectory, "phoenixd"));
    } catch (error) {
        throw error;
    }
}

export async function checkAndInstallUpdates() {
    const update = await check();
    console.log('--------------------update: ', update);
    if (update?.available && await ask(`Update ${update.version} is available (you have ${update.currentVersion}).

         Do you want to install the update?`, {
        title: `Resurrection Wallet update available`,
        kind: "info"
    })) {
        await update.downloadAndInstall();

        await relaunch();
    }
}
