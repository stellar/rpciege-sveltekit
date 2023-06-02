import { Keypair, StrKey } from "stellar-base"

export async function sha256(data: string|Uint8Array, digest: "hex"|null = null): Promise<string|Uint8Array> {
  const hash = new Uint8Array(
    await crypto.subtle.digest(
      { name: 'SHA-256' },
      data instanceof Uint8Array 
        ? data 
        : new TextEncoder().encode(data)
    )
  )

  return digest === 'hex' 
  ? [...hash]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('')
  : hash
}

export async function deriveNFTIssuer(entropy: string, platform: any) {
  const pkBuffer = StrKey.decodeEd25519PublicKey(platform?.env?.RPCIEGE_PK)
  const keyBuffer = Uint8Array.from(entropy, int_str => parseInt(int_str))
  const buffer = new Uint8Array(pkBuffer.byteLength + keyBuffer.byteLength)

  buffer.set(new Uint8Array(pkBuffer), 0)
  buffer.set(new Uint8Array(keyBuffer), pkBuffer.byteLength)

  return Keypair.fromRawEd25519Seed(await sha256(buffer))
}