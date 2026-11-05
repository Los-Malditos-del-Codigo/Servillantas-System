export interface TokenPayload {
  sub?: string;
  rol?: string;
  nombres?: string;
  iat?: number;
  exp?: number;
}

function base64UrlToString(base64Url: string): string {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function decodificarPayloadToken(token: string): TokenPayload | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    return JSON.parse(base64UrlToString(payload)) as TokenPayload;
  } catch {
    return null;
  }
}