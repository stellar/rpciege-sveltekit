import { Keypair, StrKey } from "stellar-base"

const utf8Encoder = new TextEncoder();

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
  let keyBuffer

  const pkBuffer = StrKey.decodeEd25519PublicKey(platform?.env?.RPCIEGE_PK)

  if (entropy.charAt(entropy.length - 1) === 'F') { // this is the better way to derive entropy, but sadly we started using it too late
    keyBuffer = utf8Encoder.encode(entropy);
  } else {
    keyBuffer = Uint8Array.from(entropy, int_str => parseInt(int_str))
  }

  const buffer = new Uint8Array(pkBuffer.byteLength + keyBuffer.byteLength)

  buffer.set(new Uint8Array(pkBuffer), 0)
  buffer.set(new Uint8Array(keyBuffer), pkBuffer.byteLength)

  return Keypair.fromRawEd25519Seed(await sha256(buffer))
}

export async function deriveNFTIssuerClient(entropy: string) {
  let keyBuffer

  const pkBuffer = StrKey.decodeEd25519PublicKey('GCIYTA7LEWMA3LFSJKVVIMBDKSR65R7DNZLBNIEEGJHDNOXJXICGYQSZ')

  if (entropy.charAt(entropy.length - 1) === 'F') { // this is the better way to derive entropy, but sadly we started using it too late
    keyBuffer = utf8Encoder.encode(entropy);
  } else {
    keyBuffer = Uint8Array.from(entropy, int_str => parseInt(int_str))
  }

  const buffer = new Uint8Array(pkBuffer.byteLength + keyBuffer.byteLength)

  buffer.set(new Uint8Array(pkBuffer), 0)
  buffer.set(new Uint8Array(keyBuffer), pkBuffer.byteLength)

  return Keypair.fromRawEd25519Seed(await sha256(buffer)).publicKey()
}