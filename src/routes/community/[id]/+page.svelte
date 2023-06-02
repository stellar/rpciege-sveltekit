<script lang="ts">
	import { dev } from '$app/environment';
	import { page } from '$app/stores';
	import packs from '$lib/packs.json';
	import { deriveNFTIssuer } from '$lib/utils';
	import { StellarWalletsKit, WalletNetwork, WalletType } from 'stellar-wallets-kit';

	let kit: StellarWalletsKit;
	let pubkey: string | null = localStorage.getItem('pubkey');
	let wallettype: WalletType | null = localStorage.getItem('wallettype') as WalletType;

	let redirect_uri = `${location.origin}/auth/discord`;
	let discordUrl = `https://discord.com/api/oauth2/authorize?client_id=1114212182838751344&redirect_uri=${redirect_uri}&response_type=code&scope=identify&state=${$page.params.id}`;
	let token = $page.url.searchParams.get('token');
	let metadata: any;
	let claiming: boolean = false;
    let claimed: boolean = false;

	const horizon_url = dev ? 'https://horizon-testnet.stellar.org' : 'https://horizon.stellar.org';

    $page.url.searchParams.delete('token');
    window.history.replaceState({}, '', $page.url.toString());

	lookupData();
    lookupIssuer();

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
	}
	async function lookupData() {
		const res: any = await fetch(`https://assets.rpciege.com/${packs[$page.params.id]}.json`).then(
			(res) => res.json()
		);

		if (res?.code) metadata = res;
	}
    async function lookupIssuer() {
        if (!token)
            return

        const payload = JSON.parse(atob(token.split('.')[1]))
        const issuer_res: any = await fetch(`${horizon_url}/accounts/${payload?.issuer}`).then((res) => res.json())

        if (issuer_res?.id)
            claimed = true
    }
	async function claimAsset() {
		claiming = true;

		try {
			const { token: feeBumpToken, xdr: xdrInner }: any = await fetch('/claim', {
				method: 'POST',
				body: JSON.stringify({
					pubkey,
				}),
                headers: {
					Authorization: `Bearer ${token}`
				},
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
			<h1 class="text-5xl">{metadata?.name}</h1>
			<h2 class="text-xl mb-4">"{metadata?.desc}"</h2>

			<video
				class="mb-6 rounded-lg"
				src={`https://assets.rpciege.com/${packs[$page.params.id]}.mp4`}
				width="400"
				muted
				autoplay
				loop
				controls
			/>

            {#if claimed}
                <span class="text-5xl">👍</span>
			{:else if token && pubkey}
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
			{:else if token}
				<p class="mb-2">
					Hi {metadata?.name}!<br />
					Select your Stellar Wallet service to claim your NFT
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
			{:else}
				<p class="mb-2">If you are {metadata?.name}</p>
				<a
					class="px-4 py-2 rounded hover:ring-2 hover:ring-black hover:ring-offset-2 ring-offset-red bg-black self-center"
					href={discordUrl}>Unlock your NFT with Discord</a
				>
			{/if}
		{:else}
			<h1 class="text-5xl">Not Found</h1>
		{/if}
	</div>
</div>
