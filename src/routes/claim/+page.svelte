<script lang="ts">
	import { dev } from '$app/environment';
	import { Account, Asset, Networks, Operation, Transaction, TransactionBuilder } from 'stellar-base';
  import { StellarWalletsKit, WalletNetwork, WalletType } from 'stellar-wallets-kit';

  let kit: StellarWalletsKit
  let pubkey: string|null = localStorage.getItem('pubkey')
  let wallettype: WalletType|null = localStorage.getItem('wallettype') as WalletType
  let setPacks: [string, string][]

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

  // TODO 
    // implement pack logic into the JSON or TOML so we can very directly build packs off hard data vs dynamically

  lookupPacks()

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
          // const pack_idx = Math.ceil(balance.asset_code.replace(/\D/gmi, '') / 5)
          const setPacksPack = setPacks.find(([, cards]) => cards.includes(balance.asset_code))
          const setPacksPackKey = setPacksPack?.[0] || 'pack_0'
          const pack = {
              ...balance,
              code: balance.asset_code,
              issuer: balance.asset_issuer
            }

          if (claimed_packs?.[setPacksPackKey]) {
            claimed_packs[setPacksPackKey].push(pack)
          } else {
            claimed_packs[setPacksPackKey] = [pack]
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

    poster_res?._embedded?.records.forEach((record: any) => {
      const [code, issuer] = record.asset.split(':')

      posters.push({
        ...record,
        code,
        issuer,
      })
    })

    pack_res?._embedded?.records.forEach((record: any) => {
      const [code, issuer] = record.asset.split(':')
      const setPacksPack = setPacks.find(([, cards]) => cards.includes(code))
      const setPacksPackKey = setPacksPack?.[0] || 'pack_0'

      const pack = {
        ...record,
        code,
        issuer,
      }

      if (packs?.[setPacksPackKey]) {
        packs[setPacksPackKey].push(pack)
      } else {
        packs[setPacksPackKey] = [pack]
      }
    })

    posters = posters
    packs = packs
  }
  async function lookupPacks() {
    const packs: any = await fetch('https://futurenet.rpciege.com/packs.json').then((res) => res.json())

    if (Object.keys(packs).length)
      setPacks = Object.entries(packs)
  }
  async function claimClaimableBalance(records: any, key?: string) {
    if (key)
      claiming_packs[key] = true
    else
      claiming_posters = true

    try {
      const horizon_url = dev ? 'https://horizon-testnet.stellar.org' : 'https://horizon.stellar.org'
      const account: any = await fetch(`${horizon_url}/accounts/${pubkey}`).then((res) => res.json())
      const source = new Account(pubkey, account?.sequence)

      let transaction: Transaction|TransactionBuilder = new TransactionBuilder(source, { 
        fee: (1_000_000).toString(), 
        networkPassphrase: dev ? Networks.TESTNET : Networks.PUBLIC
      })

      for (const record of records) {
        transaction
        .addOperation(Operation.changeTrust({
          asset: new Asset(record.code, record.issuer),
          limit: '0.0000001',
        }))
        .addOperation(Operation.claimClaimableBalance({
          balanceId: record.id
        }))
      }

      transaction = transaction
      .setTimeout(30)
      .build()

      const { signedXDR } = await kit.sign({
        xdr: transaction.toXDR(),
        // publicKey: pubkey,
      })

      const txBody = new FormData()
            txBody.append('tx', signedXDR)

      const res: any = await fetch(`${horizon_url}/transactions`, {
        method: 'POST',
        body: txBody
      }).then((res) => res.json())

      if (res.id) {
        console.log(res.id)
        lookupAccount()
        lookupClaimableBalances()
      } else
        alert(JSON.stringify(res, null, 2))
    } finally {
      if (key)
        claiming_packs[key] = false
      else
        claiming_posters = false
    }
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
                <button class="bg-black text-white rounded px-3 py-1 self-start" on:click={() => claimClaimableBalance(posters)}>{claiming_posters ? '...' : 'Claim'} </button>
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
                  <img class="relative h-[150px] drop-shadow max-w-none" src={`https://assets.rpciege.com/${card.code}.jpg`}>
                </a>
              </li>
            {/each}
          </ul>
        {/each}
      {/if}

      <!-- Claimable Packs -->
      {#if Object.keys(packs).length}
        {#each Object.entries(packs) as [key, cards]}
          <ul class="flex mb-4 cursor-pointer [&>li]:hover:!translate-x-0" style:min-width="400px" on:click={() => claimClaimableBalance(cards, key)}>
            <li class="relative z-10">
              <img class="relative" style:left="-0.5rem" style:top="-0.5rem" style:width="150px" src={`./pack${Number(key.split('_')[1])}.png`}>
            </li>

            {#each cards as card, i2}
              <li class="relative flex items-start" style:transition="transform 250ms" style:width="1rem" style:height="1rem" style:top="{`calc(0.5rem * ${i2} + 1rem)`}" style:transform={`translateX(calc(-1rem * ${i2} - 150px + 1rem))`} >
                <img class="relative h-[150px] drop-shadow max-w-none" src={`https://assets.rpciege.com/${card.code}.jpg`}>

                {#if i2 === cards.length - 1}
                  <button class="relative bg-black text-white rounded px-3 py-1 self-start ml-2">{claiming_packs?.[key] ? '...' : 'Claim'}</button>
                {/if}
              </li>
            {/each}
          </ul>
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
</div>