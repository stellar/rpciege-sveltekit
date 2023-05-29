export async function sha256(data: string): Promise<string> {
  return [...new Uint8Array(
    await crypto.subtle.digest(
      { name: 'SHA-256' },
      new TextEncoder().encode(data)
    )
  )]
  .map(x => x.toString(16).padStart(2, '0'))
  .join('')
}