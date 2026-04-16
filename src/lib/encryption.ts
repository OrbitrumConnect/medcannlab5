// Implementation of AES-256-GCM for LGPD/HIPAA compliance
// Uses Web Crypto API

// Get encryption key from environment or fallback to a deterministic key for demonstration
// In production, NEVER use a hardcoded fallback. Use a secure KMS or user-derived key.
const getEncryptionKey = async (): Promise<CryptoKey> => {
    const rawKey = import.meta.env.VITE_ENCRYPTION_KEY || 'default_secure_key_for_dev_only_32B';
    const enc = new TextEncoder();
    // Ensure key is 32 bytes (256 bits) for AES-256
    const keyMaterial = await crypto.subtle.digest('SHA-256', enc.encode(rawKey));
    
    return crypto.subtle.importKey(
        'raw', 
        keyMaterial, 
        { name: 'AES-GCM' }, 
        false, 
        ['encrypt', 'decrypt']
    );
};

export async function encryptMessage(text: string): Promise<string> {
    const enc = new TextEncoder();
    const encoded = enc.encode(text);
    
    // Generate a random 12-byte IV for GCM
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await getEncryptionKey();
    
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoded
    );
    
    // Combine IV and Ciphertext, then base64 encode
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);
    
    // Convert to base64 safely
    const binary = Array.from(combined).map(b => String.fromCharCode(b)).join('');
    return `AES[${btoa(binary)}]`;
}

export async function decryptMessage(encryptedText: string): Promise<string> {
    if (encryptedText.startsWith('AES[')) {
        try {
            const base64Format = encryptedText.slice(4, -1);
            const binaryString = atob(base64Format);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            // Extract IV (first 12 bytes) and ciphertext
            const iv = bytes.slice(0, 12);
            const data = bytes.slice(12);
            const key = await getEncryptionKey();
            
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                key,
                data
            );
            
            const dec = new TextDecoder();
            return dec.decode(decrypted);
        } catch (e) {
            console.error('[Decryption Error]:', e);
            return '[Decryption Error]';
        }
    } else if (encryptedText.startsWith('ENC[')) {
        // Legacy mock support for backward compatibility with existing data
        const content = encryptedText.slice(4, -1);
        try {
            return atob(content);
        } catch (e) {
            return '[Decryption Error]';
        }
    }
    return encryptedText; // Legacy plaintext support
}
