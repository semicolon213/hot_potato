
// IMPORTANT: This is a hardcoded key for demonstration purposes only.
// In a production environment, this key should be managed securely (e.g., via environment variables or a key management service).
const SECRET_KEY = 'YourSuperSecretKeyThatIs32Bytes!'; // Must be 32 bytes for AES-256

async function getKey(): Promise<CryptoKey> {
    const encodedKey = new TextEncoder().encode(SECRET_KEY);
    return await crypto.subtle.importKey(
        'raw',
        encodedKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

export async function encrypt(text: string): Promise<string> {
    if (!text) return '';
    try {
        const key = await getKey();
        const encodedText = new TextEncoder().encode(text);
        const iv = crypto.getRandomValues(new Uint8Array(12)); // Initialization Vector

        const encryptedData = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            encodedText
        );

        // Combine IV and encrypted data for storage, and convert to Base64
        const combined = new Uint8Array(iv.length + encryptedData.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(encryptedData), iv.length);

        return btoa(String.fromCharCode.apply(null, Array.from(combined)));
    } catch (error) {
        console.error("Encryption failed:", error);
        return text; // Return original text on failure
    }
}

export async function decrypt(encryptedText: string): Promise<string> {
    if (!encryptedText) return '';
    try {
        const key = await getKey();
        
        const combined = new Uint8Array(Array.from(atob(encryptedText), c => c.charCodeAt(0)));
        const iv = combined.slice(0, 12);
        const data = combined.slice(12);

        const decryptedData = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            data
        );

        return new TextDecoder().decode(decryptedData);
    } catch (error) {
        console.error("Decryption failed:", error);
        return encryptedText; // Return original text on failure
    }
}
