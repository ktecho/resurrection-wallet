import { fetch } from "@tauri-apps/plugin-http";
import WebSocket from '@tauri-apps/plugin-websocket';

let host = "127.0.0.1";
let port = "9740";
let password = "d1aee2fbe9def384f1b92a3f64106a236140fed80f1ceb06e4e107edc6db47a4";

export function get_auth_headers() {
  const headers = new Headers();
  headers.append(
    "Authorization",
    "Basic " + btoa(":" + password,),
  );
  return headers;
}

export async function get_balance_sats() {
  const headers = get_auth_headers();

  const response = await fetch(`http://${host}:${port}/getbalance`, {
    method: "GET",
    headers: headers,
  });

  console.debug("get_balance_sats - " + response.status + ' - ' + response.statusText);

  if (response.status !== 200) {
    throw new Error("Failed to fetch balance");
  } else {
    const jsonData = await response.json();
    console.debug('get_balance_sats:', jsonData);

    return [jsonData.balanceSat, jsonData.feeCreditSat];
  }
}

export async function get_node_info() {
  const headers = get_auth_headers();

  const response = await fetch(`http://${host}:${port}/getinfo`, {
    method: "GET",
    headers: headers,
  });

  console.debug("get_node_info - " + response.status + ' - ' + response.statusText);

  if (response.status !== 200) {
    throw new Error("Failed to fetch node info");
  } else {
    console.debug('get_node_info:', response);
    return await response.json();
  }
}

export async function get_incoming_payments() {
  const headers = get_auth_headers();

  const response = await fetch(`http://${host}:${port}/payments/incoming`, {
    method: "GET",
    headers: headers,
  });

  console.debug("get_incoming_payments - " + response.status + ' - ' + response.statusText);

  if (response.status !== 200) {
    throw new Error("Failed to fetch incoming payments");
  } else {
    console.debug('get_incoming_payments:', response);
    return await response.json();
  }
}

export async function get_outgoing_payments() {
  const headers = get_auth_headers();

  const response = await fetch(`http://${host}:${port}/payments/outgoing`, {
    method: "GET",
    headers: headers,
  });

  console.debug("get_outgoing_payments - " + response.status + ' - ' + response.statusText);

  if (response.status !== 200) {
    throw new Error("Failed to fetch outgoing payments");
  } else {
    console.debug('get_outgoing_payments:', response);
    return await response.json();
  }
}

export async function create_invoice_bolt11(description: string = "", amount: number) {
  const headers = get_auth_headers();
  headers.append("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");

  const params = new URLSearchParams();
  params.append("description", description);
  if (amount) params.append("amountSat", amount.toString());

  const response = await fetch(`http://${host}:${port}/createinvoice`, {
    method: "POST",
    headers: headers,
    body: params,
  });

  console.debug("create_invoice_bolt11 - " + response.status + ' - ' + response.statusText);

  if (response.status !== 200) {
    throw new Error("Failed to get a bolt11 invoice");
  } else {
    console.debug('get_outgoing_payments:', response);
    return await response.json();
  }
}

export async function create_offer_bolt12() {
  const headers = get_auth_headers();

  const response = await fetch(`http://${host}:${port}/getoffer`, {
    method: "GET",
    headers: headers,
  });

  console.debug("create_offer_bolt12 - " + response.status + ' - ' + response.statusText);

  if (response.status !== 200) {
    throw new Error("Failed to get a bolt12 offer");
  } else {
    console.debug('get_outgoing_payments:', response);
    //return await response.json();
    return response.text();
  }
}

export async function check_payment(paymentHash: string) {
  console.debug('check_payment - paymentHash: ', paymentHash);
  const headers = get_auth_headers();

  const response = await fetch(`http://${host}:${port}/payments/incoming/${paymentHash}`, {
    method: "GET",
    headers: headers,
  });

  console.debug("check_payment - " + response.status + ' - ' + response.statusText);

  if (response.status !== 200) {
    throw new Error("Failed to check payment");
  } else {
    return await response.json();
  }
}

export async function decode_bolt11_invoice(invoice: string) {
  const headers = get_auth_headers();
  headers.append("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");

  const params = new URLSearchParams();
  params.append("invoice", invoice);
  
  const response = await fetch(`http://${host}:${port}/decodeinvoice`, {
    method: "POST",
    headers: headers,
    body: params,
  });

  console.debug("decode_bolt11_invoice - " + response.status + ' - ' + response.statusText);

  if (response.status !== 200) {
    throw new Error("Failed to decode a bolt11 invoice");
  } else {
    console.debug('decode_bolt11_invoice:', response);
    return await response.json();
  }
}

export async function decode_bolt12_offer(offer: string) {
  const headers = get_auth_headers();
  headers.append("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");

  const params = new URLSearchParams();
  params.append("offer", offer);

  const response = await fetch(`http://${host}:${port}/decodeoffer`, {
    method: "POST",
    headers: headers,
    body: params,
  });

  console.debug("decode_bolt12_offer - " + response.status + ' - ' + response.statusText);

  if (response.status !== 200) {
    throw new Error("Failed to decode a bolt12 offer");
  } else {
    return await response.json();
  }
}

export async function pay_bolt11_invoice(invoice: string, amountSat: number) {
  const headers = get_auth_headers();
  headers.append("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");

  const params = new URLSearchParams();
  params.append("invoice", invoice);
  if (amountSat) params.append("amountSat", amountSat.toString());
  
  const response = await fetch(`http://${host}:${port}/payinvoice`, {
    method: "POST",
    headers: headers,
    body: params,
  });

  console.debug("pay_bolt11_invoice - " + response.status + ' - ' + response.statusText);

  if (response.status !== 200) {
    throw new Error("Failed to pay a bolt11 invoice");
  } else {
    console.debug('pay_bolt11_invoice:', response);
    return await response.json();
  }
}

export async function pay_bolt12_offer(offer: string, amountSat: number, message: string) {
  const headers = get_auth_headers();
  headers.append("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");

  const params = new URLSearchParams();
  params.append("offer", offer);
  if (amountSat) params.append("amountSat", amountSat.toString());
  if (message) params.append("message", message);
  
  const response = await fetch(`http://${host}:${port}/payoffer`, {
    method: "POST",
    headers: headers,
    body: params,
  });

  console.debug("pay_bolt12_offer - " + response.status + ' - ' + response.statusText);

  if (response.status !== 200) {
    throw new Error("Failed to pay a bolt12 offer");
  } else {
    console.debug('pay_bolt12_offer:', response);
    return await response.json();
  }
}

export async function pay_lightning_address(address: string, amountSat: number, message: string) {
  const headers = get_auth_headers();
  headers.append("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");

  const params = new URLSearchParams();
  params.append("address", address);
  if (amountSat) params.append("amountSat", amountSat.toString());
  if (message) params.append("message", message);
  
  const response = await fetch(`http://${host}:${port}/payoffer`, {
    method: "POST",
    headers: headers,
    body: params,
  });

  console.debug("pay_lightning_address - " + response.status + ' - ' + response.statusText);

  if (response.status !== 200) {
    throw new Error("Failed to pay a Lightning Address");
  } else {
    console.debug('pay_lightning_address:', response);
    return await response.json();
  }
}

export async function pay_onchain_address(address: string, amountSat: number, feerateSatByte: number) {
  const headers = get_auth_headers();
  headers.append("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");

  const params = new URLSearchParams();
  params.append("address", address);
  if (amountSat) params.append("amountSat", amountSat.toString());
  if (feerateSatByte) params.append("feerateSatByte", feerateSatByte);

  const response = await fetch(`http://${host}:${port}/payoffer`, {
    method: "POST",
    headers: headers,
    body: params,
  });

  console.debug("pay_onchain_address - " + response.status + ' - ' + response.statusText);

  if (response.status !== 200) {
    throw new Error("Failed to pay an onchain address");
  } else {
    console.debug('pay_onchain_address:', response);
    return await response.json();
  }
}

export async function setupPaymentsWebSocket(): Promise<WebSocket> {
  let ws: WebSocket;
  let options = {
    headers: get_auth_headers()
  };

  try {
    ws = await WebSocket.connect(`ws://${host}:${port}/websocket`, options).then((r) => {
      console.log("Connected to WebSocket");
      return r;
    });
  } catch (e) {
    console.error("Error connecting to Phoenixd WebSocket:", e);
    throw e;
  }

  return ws;
}