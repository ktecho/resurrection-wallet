import { fetch } from "@tauri-apps/plugin-http";
import WebSocket from '@tauri-apps/plugin-websocket';

let host = "127.0.0.1";
let port = "9740";
let password = "71ec453e388cdddff03f2dd31bb26230e09af625e922ecc4923a9b9561a27197";

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

  console.debug(response.status + ' - ' + response.statusText);

  if (response.status !== 200) {
    throw new Error("Failed to fetch balance");
  } else {
    const jsonData = await response.json();
    // console.debug('get_balance_sats:', jsonData);

    return jsonData.balanceSat + jsonData.feeCreditSat;
  }
}

export async function get_node_info() {
  const headers = get_auth_headers();

  const response = await fetch(`http://${host}:${port}/getinfo`, {
    method: "GET",
    headers: headers,
  });

  console.debug(response.status + ' - ' + response.statusText);

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

  console.debug(response.status + ' - ' + response.statusText);

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

  console.debug(response.status + ' - ' + response.statusText);

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

  console.debug(response.status + ' - ' + response.statusText);

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

  console.debug(response.status + ' - ' + response.statusText);

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

  console.debug(response.status + ' - ' + response.statusText);

  if (response.status !== 200) {
    throw new Error("Failed to check payment");
  } else {
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