import { ethers } from 'ethers';

interface Signature {
  r: string;
  s: string;
  v: number;
}

export function condenseSignatures(signatures: Signature[]): string[] {
  return signatures.map(sig => {
    // Pad v to 2 hex characters
    const vHex = ethers.zeroPadValue(ethers.toBeHex(sig.v), 1);

    // Concatenate r, s, and v
    const combined = sig.r + sig.s.slice(2) + vHex.slice(2);

    // Convert to Uint8Array and encode to Base64
    return ethers.encodeBase64(ethers.getBytes(combined));
  });
}

// Usage (assuming claimActionRes is defined elsewhere)
// const condensedSigs = condenseSignatures(claimActionRes["0x4c466..."].signatures);
