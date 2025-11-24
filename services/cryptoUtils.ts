

/**
 * Pure JavaScript SHA-256 implementation.
 * This allows generating Wompi Integrity Signatures even in non-secure contexts (HTTP),
 * where window.crypto.subtle is blocked by the browser.
 */

export async function sha256(ascii: string): Promise<string> {
  function rightRotate(value: number, amount: number) {
      return (value >>> amount) | (value << (32 - amount));
  }
  
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length'
  let i, j; // Used as a counter across the whole file
  let result = ''

  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;
  
  // Initial hash values: first 32 bits of the fractional parts of the square roots of the first 8 primes
  let hash = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  
  //@ts-ignore
  let k = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  //@ts-ignore
  let primeCounter = k[lengthProperty];

  let isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
      //@ts-ignore
      if (!isComposite[candidate]) {
          for (i = 0; i < 313; i += candidate) {
              //@ts-ignore
              isComposite[i] = candidate;
          }
          hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
          k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
  }

  ascii += '\x80' // Append Ƈ' bit (plus zero padding)
  while (ascii[lengthProperty] % 64 - 56) ascii += '\x00' // More zero padding
  for (i = 0; i < ascii[lengthProperty]; i++) {
      j = ascii.charCodeAt(i);
      if (j >> 8) return ''; // ASCII check: only support characters > 255
      words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
  words[words[lengthProperty]] = (asciiBitLength)

  // process each chunk
  for (j = 0; j < words[lengthProperty];) {
      //@ts-ignore
      let w = words.slice(j, j += 16); // The message is expanded into 64 words as part of the iteration
      let oldHash = hash;
      // This is now the "working hash", often labelled as variables a...g
      // (we have to truncate as we go, otherwise 'var's would start getting too big)
      hash = hash.slice(0, 8);

      for (i = 0; i < 64; i++) {
          // Expand the message into 64 words
          // W[i] = (w[i] is undefined) ? (sigma1(W[i - 2]) + W[i - 7] + sigma0(W[i - 15]) + W[i - 16]) : w[i]
          let w15 = w[i - 15], w2 = w[i - 2];

          // Iterate
          let a = hash[0], e = hash[4];
          let temp1 = hash[7] +
              (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + // S1
              ((e & hash[5]) ^ ((~e) & hash[6])) + // ch
              k[i] +
              // Expand the message schedule if needed
              (w[i] = (i < 16) ? w[i] : (
                  w[i - 16] +
                  (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) + // s0
                  w[i - 7] +
                  (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10)) // s1
              ) | 0
              );
          // This is only used once, so *could* be moved below, but it only saves 4 bytes and makes things unreadble
          let temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + // S0
              ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2])); // maj

          hash = [(temp1 + temp2) | 0].concat(hash); // We don't bother trimming off the extra ones, they're harmless as long as we're truncating when we do the slice()
          hash[4] = (hash[4] + temp1) | 0;
      }

      for (i = 0; i < 8; i++) {
          hash[i] = (hash[i] + oldHash[i]) | 0;
      }
  }

  for (i = 0; i < 8; i++) {
      for (j = 3; j + 1; j--) {
          let b = (hash[i] >> (j * 8)) & 255;
          result += ((b < 16) ? 0 : '') + b.toString(16);
      }
  }
  return result;
}
