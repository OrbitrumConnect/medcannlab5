// supabase/functions/_shared/crypto.ts
// Lógica de criptografia Native Web Crypto API (Deno-friendly)
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// A Chave SECRETA configurada no vault agora é mastigada por HASH
// Convertendo "senha123" num cofre matemático intransponível de 32 bytes.
async function getKey() {
  const secret = Deno.env.get("ENCRYPTION_KEY");
  if (!secret) {
    throw new Error("ENCRYPTION_KEY is missing from environment variables");
  }

  // Upgrade Militar (SHA-256) em vez de Padding
  // Ele destrói qualquer viés linguístico e garante 32 bytes de entropia total.
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(secret));

  return await crypto.subtle.importKey(
    "raw",
    hashBuffer,
    "AES-GCM",
    false,
    ["encrypt", "decrypt"]
  );
}

// Helpers base64 do Deno
function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Retorna String Base64: Iv(12 bytes) + Payload Encriptado
export async function encrypt(text: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(text)
  );

  // Upgrade de Armazenamento: Base64
  const ivB64 = toBase64(iv);
  const encryptedB64 = toBase64(encrypted);

  return `${ivB64}:${encryptedB64}`;
}

export async function decrypt(text: string): Promise<string> {
  const parts = text.split(":");
  if (parts.length !== 2) throw new Error("Formato de token corrompido");

  const [ivB64, encryptedB64] = parts;
  
  const iv = fromBase64(ivB64);
  const encrypted = fromBase64(encryptedB64);

  const key = await getKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted
  );

  return decoder.decode(decrypted);
}
