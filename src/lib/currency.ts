import { getValue } from 'btc2fiat';
import { info, error, debug } from '@tauri-apps/plugin-log';

const CACHE_EXPIRY_TIME = 60 * 1000; // 1 minute in milliseconds

export let fiatCurrencies = [
   { code: "USD", symbolPrefix: "$" },
   { code: "EUR", symbolSuffix: "€" },
   { code: "GBP", symbolPrefix: "£" },
   { code: "JPY", symbolPrefix: "¥" },
 ];

let fiatRateCache = {
   USD: { ratio: null, timestamp: 0 },
   EUR: { ratio: null, timestamp: 0 },
   GBP: { ratio: null, timestamp: 0 },
   JPY: { ratio: null, timestamp: 0 },
};

export function getPrefix(currencyCode: string): string {
   const currency = fiatCurrencies.find(c => c.code === currencyCode);
   return currency?.symbolPrefix || '';
 }
 
 export function getSuffix(currencyCode: string): string {
   const currency = fiatCurrencies.find(c => c.code === currencyCode);
   return currency?.symbolSuffix || '';
 }

async function getUpdatedRatio(fiatCurrency) {
   const now = Date.now();
   if (now - fiatRateCache[fiatCurrency].timestamp > CACHE_EXPIRY_TIME) {
      debug(`Fetching ${fiatCurrency} ratio`);
      try {
         const ratio = await getValue('kraken', fiatCurrency);
         fiatRateCache[fiatCurrency] = { ratio, timestamp: now };
      } catch (e) {
         error(`Error fetching ${fiatCurrency} ratio`);
         console.error(`Error fetching ${fiatCurrency} ratio:`, e);
         // If there's an error, we'll use the cached value if available
         if (fiatRateCache[fiatCurrency].ratio === null) {
            error(`Unable to get ${fiatCurrency} ratio, and there is no cached value`);
            throw new Error(`Unable to get ${fiatCurrency} ratio`);
         }
      }
   }

   debug(`Returning ${fiatCurrency} ratio`);

   return fiatRateCache[fiatCurrency].ratio;
}

export async function convertBtcToFiat(btcAmount: number, fiatCurrency: string, sats: boolean = false, decimals: number = 2) {
   if (btcAmount === 0) return "0";

   if (sats) {
      btcAmount = btcAmount / 100000000;
   }
   const ratio = await getUpdatedRatio(fiatCurrency);
   let fiatAmount = btcAmount * ratio;

   let fiatAmountString = "";
   if (fiatAmount) {
     fiatAmountString = fiatAmount.toFixed(decimals);
   }

   return fiatAmountString ?? "";
}

export function clearCache() {
   for (let currency in fiatRateCache) {
      fiatRateCache[currency] = { ratio: null, timestamp: 0 };
   }
}