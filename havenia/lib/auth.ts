export function getToken() {
  if (typeof window === "undefined") return undefined; // <- string "undefined"
  return localStorage.getItem("token") ?? undefined;
}

export function saveToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}
