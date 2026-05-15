const STORAGE_KEY = "iskomart_client_session";
const HEADER_NAME = "X-Isko-Client-Session";

function randomToken() {
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function clientSessionToken() {
  let token = sessionStorage.getItem(STORAGE_KEY);
  if (!token) {
    token = randomToken();
    sessionStorage.setItem(STORAGE_KEY, token);
  }
  return token;
}

function isApiRequest(input) {
  const url = input instanceof Request ? input.url : String(input);
  return url.startsWith("/api/") || new URL(url, window.location.origin).pathname.startsWith("/api/");
}

export function installClientSessionFetch() {
  if (window.__iskomartFetchPatched) {
    return;
  }

  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    if (!isApiRequest(input)) {
      return nativeFetch(input, init);
    }

    const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
    headers.set(HEADER_NAME, clientSessionToken());

    if (input instanceof Request) {
      return nativeFetch(new Request(input, { ...init, headers }));
    }

    return nativeFetch(input, { ...init, headers });
  };

  window.__iskomartFetchPatched = true;
}
