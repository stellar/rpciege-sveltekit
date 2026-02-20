<script lang="ts">
	import { dev } from '$app/environment';
  import { StellarWalletsKit, WalletNetwork, WalletType } from 'stellar-wallets-kit';
  import packCards from '$lib/pack_cards.json';

  let kit: StellarWalletsKit
  let pubkey: string|null = localStorage.getItem('pubkey')
  let wallettype: WalletType|null = localStorage.getItem('wallettype') as WalletType

  let claiming_posters: boolean = false
  let claimed_posters: any[] = []
  let posters: any[] = []

  let claiming_packs: any = {}
  let claimed_packs: any = {}
  let packs: any = {}

  const horizon_url = dev ? 'https://horizon-testnet.stellar.org' : 'https://horizon.stellar.org'
  const poster_sponsor = 'GB5K7EYJJHDI5FGQKSPMU5AYDWVIGQPW5L5BEELVZMBYBPYYZJTLK2A6'
  const pack_sponsor = 'GCIYTA7LEWMA3LFSJKVVIMBDKSR65R7DNZLBNIEEGJHDNOXJXICGYQSZ'

  // GDAYVCINVNUZ57EOCN4FK2VVWGQ3L3NW37L6UJLZCK3C7S7CNSS5EHHG

  $: {
    if (pubkey) {
      lookupAccount()
      lookupClaimableBalances()

      if (!kit && wallettype)
        setupKit(wallettype)
    }
  }

  function setupKit(type: WalletType) {
    kit = new StellarWalletsKit({
      network: dev ? WalletNetwork.TESTNET : WalletNetwork.PUBLIC,
      selectedWallet: WalletType[type]
    })

    if (!pubkey)
      connect(type)
  }
  async function connect(type: WalletType) {
    pubkey = await kit.getPublicKey()
    localStorage.setItem('pubkey', pubkey)
    localStorage.setItem('wallettype', WalletType[type])
  }
  function disconnect() {
    pubkey = null
    localStorage.removeItem('pubkey')
    localStorage.removeItem('wallettype')

    claimed_posters = []
    claimed_packs = {}
    posters = []
    packs = {}
  }
  async function lookupAccount() {
    const account_res: any = await fetch(`${horizon_url}/accounts/${pubkey}`).then((res) => res.json())
    
    if (account_res.id) {
      claimed_posters = []
      claimed_packs = {}

      account_res.balances.forEach((balance: any) => {
        if (balance.asset_code?.startsWith('FCA00C')) {
          claimed_posters.push({
            ...balance,
            code: balance.asset_code,
            issuer: balance.asset_issuer,
          })
        }

        else if (balance.asset_code?.startsWith('RPCIEGE')) {
          // Handle common cards by resetting them to dynamic cards
          // if (balance.asset_code.substr(-1) === 'c') {
          //   balance.asset_code = balance.asset_code
          //   .replace(/[a-z]/g, '')
          //   .replace('RPCIEGE', 'RPCIEGE0')
          // }

          // TODO display community and fortress cards
          if (
            balance.asset_code.substr(-1) === 'C'
            || balance.asset_code.substr(-1) === 'F'
          ) return

          const packCardsIndex = packCards.findIndex((pack) => pack.includes(processAssetCode(balance.asset_code)))
          const packCardsKey = packCardsIndex > -1 ? `pack_${packCardsIndex + 1}` : 'pack_0'
          const pack = {
              ...balance,
              code: balance.asset_code,
              issuer: balance.asset_issuer
            }

          if (claimed_packs?.[packCardsKey]) {
            claimed_packs[packCardsKey].push(pack)
          } else {
            claimed_packs[packCardsKey] = [pack]
          }
        }

        claimed_posters = claimed_posters
        claimed_packs = claimed_packs
      })
    }
  }
  async function lookupClaimableBalances() {
    const poster_res: any = await fetch(`${horizon_url}/claimable_balances/?sponsor=${poster_sponsor}&claimant=${pubkey}&limit=200`).then((res) => res.json())
    const pack_res: any = await fetch(`${horizon_url}/claimable_balances/?sponsor=${pack_sponsor}&claimant=${pubkey}&limit=200`).then((res) => res.json())

    posters = []
    packs = {}

    // TODO filter by unique by asset code

    poster_res?._embedded?.records.forEach((record: any) => {
      const [code, issuer] = record.asset.split(':')

      posters.push({
        ...record,
        code,
        issuer,
      })
    })

    pack_res?._embedded?.records.forEach((record: any) => {
      let [code, issuer] = record.asset.split(':')

      // Handle common cards by resetting them to dynamic cards
      // if (code.substr(-1) === 'c') {
      //   code = code
      //     .replace(/[a-z]/g, '')
      //     .replace('RPCIEGE', 'RPCIEGE0')
      // }

      const packCardsIndex = packCards.findIndex((pack) => pack.includes(processAssetCode(code)))
      const packCardsKey = packCardsIndex > -1 ? `pack_${packCardsIndex + 1}` : 'pack_0'

      const pack = {
        ...record,
        code,
        issuer,
      }

      if (packs?.[packCardsKey]) {
        packs[packCardsKey].push(pack)
      } else {
        packs[packCardsKey] = [pack]
      }
    })

    posters = posters
    packs = packs
  }
  async function claimClaimableBalance(records: any, key?: string) {
    if (key)
      claiming_packs[key] = true
    else
      claiming_posters = true

    try {
      const {token, xdr: xdrInner}: any = await fetch('/claim', {
        method: 'POST',
        body: JSON.stringify({
          pubkey,
          records: records.map(({code, issuer, id}: any) => ({code, issuer, id}))
        })
      }).then(async (res) => {
        if (res.ok)
          return res.json()
        throw res
      })

      const { signedXDR } = await kit.sign({
        xdr: xdrInner,
        // publicKey: pubkey,
      })

      const { xdr: xdrOuter }: any = await fetch('/claim', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tx: signedXDR,
        })
      }).then(async (res) => {
        if (res.ok)
          return res.json()
        else if (res.status === 401)
          localStorage.removeItem('token')
        throw res
      })

      const txBody = new FormData()
            txBody.append('tx', xdrOuter)

      const res: any = await fetch(`${horizon_url}/transactions`, {
        method: 'POST',
        body: txBody
      }).then((res) => res.json())

      if (res.id) {
        console.log(res.id)
        lookupAccount()
        lookupClaimableBalances()
      } else {
        console.error(res)
        alert(JSON.stringify(res, null, 2))
      }
    } 

    catch(err) {
      console.error(err);
    }

    finally {
      if (key)
        claiming_packs[key] = false
      else
        claiming_posters = false
    }
  }
  function processAssetCode(code: string) {
    if (code.substr(-1) === 'c')
      return code
      .replace(/[a-z]/g, '')
      .replace('RPCIEGE', 'RPCIEGE0')

    return code
  }
</script>

<div class="bg-white flex flex-col items-start min-h-screen p-4">
  {#if pubkey}
    <button class="bg-black text-white rounded px-3 py-1 self-start mb-4" on:click={disconnect}>Disconnect {pubkey.substring(0, 5)}...{pubkey.substring(pubkey.length - 5, pubkey.length)}</button>

    {#if claimed_posters.length || posters.length}
      <h1 class="text-2xl mb-2">Posters</h1>

      <!-- Claimed Posters -->
      {#if claimed_posters.length}
        <ul class="mb-4 hover:[&>li]:z-10">
          {#each claimed_posters as poster, i}
            <li class="relative flex items-start" style:margin-bottom={claimed_posters.length - 1 === i ? 'calc(150px - 0.5rem)' : ''} style:height="0.5rem" style:left={`${i}rem`}>
              <a href={`https://api.stellar.quest/badge/${poster.issuer}?v=4&network=public`}>
                <img class="h-[150px] drop-shadow mr-2" src={`https://api.stellar.quest/badge/${poster.issuer}?v=4&network=public`}>
              </a>
            </li>
          {/each}
        </ul>
      {/if}

      <!-- Claimable Posters -->
      {#if posters.length}
        <ul class="mb-4">
          {#each posters as poster, i}
            <li class="relative flex items-start" style:margin-bottom={posters.length - 1 === i ? 'calc(150px - 0.5rem)' : ''} style:height="0.5rem" style:left={`${i}rem`}>
              <img class="h-[150px] drop-shadow mr-2" src={`https://api.stellar.quest/badge/${poster.issuer}?v=4&network=public`}>

              {#if posters.length - 1 === i}
                <button class="gtm-trigger bg-black text-white rounded px-3 py-1 self-start" on:click={() => claimClaimableBalance(posters)}>{claiming_posters ? '...' : 'Claim'}</button>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    {/if}

    {#if Object.keys(claimed_packs).length || Object.keys(packs).length}
      <h1 class="text-2xl mb-2">Cards</h1>
      
      <!-- Claimed Packs -->
      {#if Object.keys(claimed_packs).length}
        {#each Object.entries(claimed_packs) as [key, cards]}
          <ul class="flex mb-4 [&>li]:hover:!translate-x-0 hover:[&>li]:z-10" style:min-width="400px">
            <li class="relative z-10">
              <img class="relative" style:left="-0.5rem" style:top="-0.5rem" style:width="150px" src={`./pack${Number(key.split('_')[1])}.png`}>
            </li>

            {#each cards as card, i2}
              <li class="relative flex items-start" style:transition="transform 250ms" style:width="1rem" style:height="1rem" style:top="{`calc(0.5rem * ${i2} + 1rem)`}" style:transform={`translateX(calc(-1rem * ${i2} - 150px + 1rem))`} >
                <a href={`https://assets.rpciege.com/${card.code}.mp4`}>
                  <img class="relative h-[150px] drop-shadow max-w-none" src={`https://assets.rpciege.com/${processAssetCode(card.code)}.jpg`}>
                </a>
              </li>
            {/each}
          </ul>
        {/each}
      {/if}

      <!-- Claimable Packs -->
      {#if Object.keys(packs).length}
        {#each Object.entries(packs) as [key, cards]}
          <!-- {#if cards.length > 1} -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <ul class="gtm-trigger flex mb-4 cursor-pointer [&>li]:hover:!translate-x-0" style:min-width="400px" on:click={() => claimClaimableBalance(cards, key)}>
              <li class="relative z-10">
                <img class="relative" style:left="-0.5rem" style:top="-0.5rem" style:width="150px" src={`./pack${Number(key.split('_')[1])}.png`}>
              </li>

              {#each cards as card, i2}
                <li class="relative flex items-start" style:transition="transform 250ms" style:width="1rem" style:height="1rem" style:top="{`calc(0.5rem * ${i2} + 1rem)`}" style:transform={`translateX(calc(-1rem * ${i2} - 150px + 1rem))`} >
                  <img class="relative h-[150px] drop-shadow max-w-none" src={`https://assets.rpciege.com/${processAssetCode(card.code)}.jpg`}>

                  {#if i2 === cards.length - 1}
                    <button class="relative bg-black text-white rounded px-3 py-1 self-start ml-2">{claiming_packs?.[key] ? '...' : 'Claim'}</button>
                  {/if}
                </li>
              {/each}
            </ul>
          <!-- {:else}
            <ul class="gtm-trigger flex mb-4 cursor-pointer" on:click={() => claimClaimableBalance(cards, key)}>
              {#each cards as card}
                <li class="flex items-start" >
                  <img class="h-[150px] drop-shadow max-w-none" src={`https://assets.rpciege.com/${processAssetCode(card.code)}.jpg`} on:error={(e) => swapSrc(e)}>
                  <button class="bg-black text-white rounded px-3 py-1 self-start ml-2">{claiming_packs?.[key] ? '...' : 'Claim'}</button>
                </li>
              {/each}
            </ul>
          {/if} -->
        {/each}
      {/if}
    {/if}
  {:else}
    <h1 class="text-2xl mb-2">Select Your Stellar Wallet Service</h1>

    <ul class="[&>li>button]:bg-black [&>li>button]:text-white [&>li>button]:rounded [&>li>button]:px-3 [&>li>button]:py-1 [&>li>button]:mb-1">
      <li>
        <button on:click={() => setupKit(WalletType.ALBEDO)}>Albedo</button>
      </li>
      <li>
        <button on:click={() => setupKit(WalletType.FREIGHTER)}>Freighter</button>
      </li>
      <li>
        <button on:click={() => setupKit(WalletType.XBULL)}>xBull</button>
      </li>
    </ul>
  {/if}

  <div class="flex mt-2 [&>a]:text-sm [&>a]:underline [&>a]:text-center [&>a:hover]:text-red max-[560px]:justify-center">
    <a class="border-r pr-2 mr-2" href="/booklet/kit-and-caboodle" data-sveltekit-reload>Play the Game</a>
    <a class="border-r pr-2 mr-2" href="https://soroban.stellar.org">Learn about Soroban</a>
    <a class="border-r pr-2 mr-2" href="https://discord.gg/stellardev">Join the Discord</a>
    <a href="https://twitter.com/BuildOnStellar">Follow on Twitter</a>
  </div>
</div>
