import { ethers } from 'ethers';

interface Signature {
  r: string;
  s: string;
  v: number;
}

export function restoreSignatures(condensedSigs: string[]): Signature[] {
  return condensedSigs.map(condensedSig => {
    // Decode the Base64 string to Uint8Array
    const bytes = ethers.decodeBase64(condensedSig);

    // Convert Uint8Array to hex string
    const hexString = ethers.hexlify(bytes);

    // Extract r, s, and v
    const r = '0x' + hexString.slice(2, 66);
    const s = '0x' + hexString.slice(66, 130);
    const v = parseInt(hexString.slice(130), 16);

    return { r, s, v };
  });
}

