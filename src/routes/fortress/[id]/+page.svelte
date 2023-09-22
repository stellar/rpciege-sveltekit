<script lang="ts">
	import { dev } from '$app/environment';
	import { page } from '$app/stores';
	import fortress_cards from '$lib/fortress_cards.json';
	import { deriveNFTIssuerClient } from '$lib/utils';
	import { StellarWalletsKit, WalletNetwork, WalletType } from 'stellar-wallets-kit';

	let kit: StellarWalletsKit;
	let pubkey: string | null = localStorage.getItem('pubkey');
	let wallettype: WalletType | null = localStorage.getItem('wallettype') as WalletType;

	let metadata: any = null;
	let claiming: boolean = false;

	const horizon_url = dev ? 'https://horizon-testnet.stellar.org' : 'https://horizon.stellar.org';

	lookupData().then(lookupIssuer);

	$: {
		if (pubkey) if (!kit && wallettype) setupKit(wallettype);
	}

	function setupKit(type: WalletType) {
		kit = new StellarWalletsKit({
			network: dev ? WalletNetwork.TESTNET : WalletNetwork.PUBLIC,
			selectedWallet: WalletType[type]
		});

		if (!pubkey) connect(type);
	}
	async function connect(type: WalletType) {
		pubkey = await kit.getPublicKey();
		localStorage.setItem('pubkey', pubkey);
		localStorage.setItem('wallettype', WalletType[type]);
		lookupData().then(lookupIssuer);
	}
	async function lookupData() {
		try {
			for (const code of fortress_cards[$page.params.id]) {
				const res: any = await fetch(`https://assets.rpciege.com/${code}.json`).then((res) => res.json());

				if (res?.code) {
					metadata = metadata ?? {};
					metadata[code] = res;
				} else throw null;
			}
		} catch {
			metadata = null;
		}
	}
	async function lookupIssuer() {
		if (!pubkey)
			return

		const account: any = await fetch(`${horizon_url}/accounts/${pubkey}`).then((res) => res.json());

		for (const balance of account.balances) {
			if (fortress_cards[pubkey].find((code) => balance.asset_code === code))
				metadata[balance.asset_code].claimed = true
		}
	}
	async function claimAsset() {
		claiming = true;

		try {
			const { token: feeBumpToken, xdr: xdrInner }: any = await fetch('/claim', {
				method: 'POST',
				body: JSON.stringify({
					pubkey,
					codes: fortress_cards[$page.params.id]
				})
			}).then(async (res) => {
				if (res.ok) return res.json();
				throw res;
			});

			const { signedXDR } = await kit.sign({
				xdr: xdrInner
			});

			const { xdr: xdrOuter }: any = await fetch('/claim', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${feeBumpToken}`
				},
				body: JSON.stringify({
					tx: signedXDR
				})
			}).then(async (res) => {
				if (res.ok) return res.json();
				throw res;
			});

			const txBody = new FormData();
			txBody.append('tx', xdrOuter);

			const res: any = await fetch(`${horizon_url}/transactions`, {
				method: 'POST',
				body: txBody
			}).then((res) => res.json());

			if (res.id) {
				console.log(res.id);
				lookupIssuer();
			} else alert(JSON.stringify(res, null, 2));
		} catch (err) {
			console.error(err);
		} finally {
			claiming = false;
		}
	}
</script>

<div class="flex flex-col">
	<div class="inline-flex flex-col mx-auto text-white text-center my-10">
		{#if metadata}
			<h1 class="text-5xl">Fortresses</h1>
			
			<h2 class="text-xl mb-4">
				{$page.params.id.substring(0, 5)}...{$page.params.id.substring($page.params.id.length - 5, $page.params.id.length)}
			</h2>

			<div class="flex flex-wrap w-[600px] pl-2">
				{#each fortress_cards[$page.params.id] as code}
					{#if !metadata?.[code]?.claimed}
						<div class="mb-6 pr-2 w-1/3">
							<p class="mb-2">{metadata?.[code]?.name}</p>
							<img class="rounded-lg" src={`https://assets.rpciege.com/${code}.png`} />
						</div>
					{/if}
				{/each}
			</div>

			{#if pubkey}
				{#if pubkey !== $page.params.id}
					{pubkey.substring(0, 5)}...{pubkey.substring(pubkey.length - 5, pubkey.length)} 
						is not
					{$page.params.id.substring(0, 5)}...{$page.params.id.substring($page.params.id.length - 5, $page.params.id.length)}
				{:else if fortress_cards[pubkey].filter((code) => !metadata?.[code]?.claimed).length === 0}
					<span class="text-5xl">👍</span>
				{:else}
					<button
						class="px-4 py-2 rounded hover:ring-2 hover:ring-black hover:ring-offset-2 ring-offset-red bg-black self-center"
						on:click={claimAsset}
						>{claiming
							? '...'
							: `Claim with ${pubkey.substring(0, 5)}...${pubkey.substring(
									pubkey.length - 5,
									pubkey.length
							)}`}</button
					>
				{/if}
			{:else}
				<p class="mb-2">
					Select your Stellar Wallet service to claim your NFTs
				</p>
				<ul
					class="[&>li>button]:bg-black [&>li>button]:text-white [&>li>button]:rounded [&>li>button]:px-3 [&>li>button]:py-1 [&>li>button]:mb-1"
				>
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
		{:else}
			<h1 class="text-5xl">Not Found</h1>
		{/if}
	</div>
</div>
