/**
 * ZATCA Phase 2 Cryptography & TLV Encoding Utility
 */

/**
 * Encodes a tag, length, and value into a Buffer-like byte array for ZATCA TLV QR codes.
 */
function encodeTLV(tag: number, value: string): Uint8Array {
  const valueBytes = new TextEncoder().encode(value);
  const length = valueBytes.length;
  
  const res = new Uint8Array(2 + length);
  res[0] = tag;
  res[1] = length;
  res.set(valueBytes, 2);
  
  return res;
}

/**
 * Concatenates multiple Uint8Arrays into one.
 */
function concatBuffers(buffers: Uint8Array[]): Uint8Array {
  const totalLength = buffers.reduce((acc, buf) => acc + buf.length, 0);
  const res = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of buffers) {
    res.set(buf, offset);
    offset += buf.length;
  }
  return res;
}

/**
 * Generates a Base64 encoded TLV string for Phase 2 QR codes.
 * Includes mandatory 9 tags.
 */
export function generatePhase2TLV(params: {
  sellerName: string;
  vatNumber: string;
  timestamp: string;
  total: string;
  vatTotal: string;
  xmlHash: string;
  signature: string;
  publicKey: string;
  certSignature?: string;
}): string {
  const tags = [
    encodeTLV(1, params.sellerName),
    encodeTLV(2, params.vatNumber),
    encodeTLV(3, params.timestamp),
    encodeTLV(4, params.total),
    encodeTLV(5, params.vatTotal),
    encodeTLV(6, params.xmlHash),
    encodeTLV(7, params.signature),
    encodeTLV(8, params.publicKey),
  ];

  if (params.certSignature) {
    tags.push(encodeTLV(9, params.certSignature));
  }

  const finalBuffer = concatBuffers(tags);
  
  // Convert Uint8Array to Base64 string
  if (typeof btoa !== 'undefined') {
    return btoa(String.fromCharCode.apply(null, Array.from(finalBuffer)));
  } else {
    return Buffer.from(finalBuffer).toString('base64');
  }
}

/**
 * Generates a standard UUID (v4) for ZATCA cbc:UUID tag.
 */
export function generateZatcaUUID(): string {
  return crypto.randomUUID();
}

/**
 * Calculates SHA-256 hash of a string (XML) and returns it in Base64 format.
 */
export async function calculateInvoiceHash(xml: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(xml);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashString = hashArray.map(b => String.fromCharCode(b)).join('');
  
  if (typeof btoa !== 'undefined') {
    return btoa(hashString);
  } else {
    return Buffer.from(hashBuffer).toString('base64');
  }
}
