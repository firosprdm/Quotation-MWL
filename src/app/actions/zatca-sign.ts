'use server';

import crypto from 'node:crypto';

export async function signInvoiceAction(params: {
  hash: string;
  privateKey: string;
}) {
  try {
    const { hash, privateKey } = params;
    const sign = crypto.createSign('SHA256');
    sign.update(Buffer.from(hash, 'base64'));
    sign.end();
    
    const signature = sign.sign(privateKey, 'base64');
    
    // ZATCA requires the public key in the QR code as well
    // Extract public key from private key
    const key = crypto.createPrivateKey(privateKey);
    const publicKey = crypto.createPublicKey(key).export({ type: 'spki', format: 'pem' }) as string;
    
    // Clean up public key PEM for ZATCA
    const cleanPublicKey = publicKey
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '')
      .replace(/\s+/g, '');

    return { 
      success: true, 
      signature, 
      publicKey: cleanPublicKey 
    };
  } catch (error: any) {
    console.error('Signing Error:', error);
    return { success: false, error: error.message };
  }
}
