<script lang="ts">
	import { dev } from '$app/environment';
	import { StellarWalletsKit, WalletNetwork, WalletType } from 'stellar-wallets-kit';
	import { Account, TransactionBuilder } from 'stellar-base';

    const networkPassphrase = dev ? WalletNetwork.TESTNET : WalletNetwork.PUBLIC

	let kit: StellarWalletsKit;
	let pubkey: string | null;
    let choosing_wallet = false;
	let code: string | null = null;
	let dang = false;

	async function setupKit(type: WalletType) {
		kit = new StellarWalletsKit({
			network: networkPassphrase,
			selectedWallet: WalletType[type]
		});

		await connect(type);
        await proveWallet();
	}
	async function connect(type: WalletType) {
		try {
			pubkey = await kit.getPublicKey();
		} catch {}
	}
	async function proveWallet() {
        if (!pubkey) return

        const xdr = new TransactionBuilder(new Account(pubkey, '0'), {
            networkPassphrase,
            fee: '0' 
        })
        .setTimeout(0)
        .build()
        .toXDR()

        const { signedXDR } = await kit.sign({
            xdr
        })

        await fetch('/giveaway', {
            method: 'POST',
            body: JSON.stringify({
                xdr: signedXDR,
                pubkey
            })
        })
        .then(async (res) => {
            if (res.ok)
                return res.text()
            else throw await res.json()
        })
        .then((res) => {
            code = res
        })
		.catch(() => {
			dang = true
		})
	}
</script>

<div
	class="min-w-screen min-h-screen w-full bg-pamphlet flex flex-col justify-start font-merriweather text-fog text-[18px] overflow-hidden relative px-12 items-center shadow-[inset_0_0_0_12px_rgba(71,68,66,1)] max-[1000px]:text-[16px] max-[650px]:px-6"
>
	<nav class="mt-[12px] shadow-[0_0_0_1px_rgba(71,68,66,1)] flex items-center w-screen px-[12px]">
		<a href="https://rpciege.com" class="ml-4">
			<img class="pointer-events-none max-w-[120px]" src="./logo.svg" />
		</a>


		<a href="https://discord.gg/stellardev" class="w-[30px] ml-auto mr-4">
			<img class="w-full" src="./discord.svg">
		</a>
		<a href="/booklet/kit-and-caboodle" class="bg-firebolt font-nanum font-bold uppercase text-darkvision text-[16px] px-[30px] py-[20px] border-l border-fog">
			Play Game
		</a>
	</nav>

	<img class="absolute z-10 top-[100px] right-[-175px] self-start max-w-[640px] pointer-events-none max-[1300px]:right-[-250px] max-[1150px]:right-[-400px] max-[850px]:static max-[850px]:max-w-[250px] max-[850px]:mt-[25px] max-[850px]:mx-auto" src="./card-and-dice.png" />

	<div
		class="max-w-[1100px] w-full mt-[210px] mb-[120px] flex flex-col items-start [&>p]:leading-[2em] max-[850px]:mt-[25px]"
	>
		<img class="max-w-[720px] pointer-events-none max-[1000px]:max-w-[500px] max-[650px]:max-w-[300px]" src="./giveaway.png" />

		<div class="flex items-center mt-[36px] mb-3 max-w-[810px] max-[1000px]:max-w-[640px] max-[650px]:items-start">
			<img class="pointer-events-none max-w-[90px] mr-2" src="./r.png" />
			<p class="font-capitolina text-[32px] leading-[1.2em] max-[1000px]:text-[24px]">
				PCiege physical playing cards are available to collect for accomplished coders who have
				completed enough RPCiege skirmishes to claim 15 NFT digital cards.
			</p>
		</div>

		<p class="mb-12">
			Brave adventurer, have your feats earned you the right to claim this sweet swag? <br /> Prove it
			by connecting your wallet and showing us your accomplishments!
		</p>

		<div class="mb-24 w-full">
			{#if choosing_wallet}
				<div
					class={`
                    [&>div>button]:leading-[1em]
                    [&>div>button]:uppercase
                    [&>div>button]:px-[30px] 
                    [&>div>button]:py-[20px] 
                    [&>div>button]:text-[24px] 
                    [&>div>button]:rounded-lg 
                    [&>div>button]:border 
                    [&>div>button]:border-pamphlet 
                    [&>div>button]:shadow-[0_4px_0_0_rgba(41,30,39,1)]
                    [&>div]:mr-2
                    font-capitolina 
                    font-bold 
                    text-pamphlet 
                    flex
					flex-wrap
                `}
				>
					<div class="flex flex-col mb-4">
						<button class="bg-[#1bb6e5] mb-2" on:click={() => setupKit(WalletType.ALBEDO)}>Albedo</button>
						<a class="underline text-berry text-sm" href="https://albedo.link/">albedo.link</a>
					</div>
					<div class="flex flex-col mb-4">
						<button class="bg-[#634bc9] mb-2" on:click={() => setupKit(WalletType.FREIGHTER)}
							>Freighter</button
						>
						<a class="underline text-berry text-sm" href="https://www.freighter.app/">freighter.app</a>
					</div>
					<div class="flex flex-col mb-4">
						<button class="bg-[#c19cfc] mb-2" on:click={() => setupKit(WalletType.XBULL)}>xBull</button>
						<a class="underline text-berry text-sm" href="https://xbull.app/">xbull.app</a>
					</div>
				</div>
			{:else}
				<button
					on:click={() => (choosing_wallet = true)}
					class="font-capitolina uppercase font-bold bg-firebolt text-pamphlet px-[30px] py-[20px] text-[24px] leading-[1em] rounded-lg border border-pamphlet shadow-[0_4px_0_0_rgba(41,30,39,1)] max-[650px]:w-full"
					>Connect Wallet</button
				>
			{/if}
		</div>

		<div class="mt-auto max-w-[620px]">
			<p><small class="text-[14px]"><strong>While supplies last.</strong></small></p>
			<p>
				<small class="text-[14px] [&>a]:text-berry [&>a]:underline"
					>By clicking “Connect Wallet”, you acknowledge and agree to abide by the Stellar Development
					Foundation’s <a href="https://fastcheapandoutofcontrol.com/rules/rpciege"
						>RPCiege Official Rules</a
					>, <a href="https://stellar.org/terms-of-service">Terms of Service</a>, and
					<a href="https://stellar.org/privacy-policy">Privacy Policy</a>.</small
				>
			</p>
		</div>
	</div>

	{#if code || dang}
		<div class="absolute top-0 left-0 right-0 bottom-0 z-10 bg-darkvision bg-opacity-75 flex flex-col justify-center items-center px-2">
			<div class="bg-darkvision text-pamphlet max-w-[650px] px-[30px] pt-[36px] pb-[60px] rounded-2xl leading-[2.5em] flex flex-col items-start">
				{#if code}
					<h1 class="font-capitolina text-[36px] font-bold mb-6">Congratulations!</h1>
					<p class="font-capitolina text-[32px] mb-6 max-[650px]:text-[24px]">You’ve proven your worth and are eligible to receive a pack of RPCiege physical playing cards! Here is your unique claim link:</p>
					<div class="border border-firebolt rounded-xl p-6 flex w-full justify-center">
						<a class="underline font-nanum text-[18px] max-[650px]:text-[12px] leading-[1.5em]" href="{`https://giveaways.useslingshot.com/playing-cards-7c06470b/${code}`}">{`giveaways.useslingshot.com/playing-cards-7c06470b/${code}`}</a>
					</div>
				{:else}
					<h1 class="font-capitolina text-[36px] font-bold mb-6">Dang!</h1>
					<p class="font-capitolina text-[32px] mb-8 max-[650px]:text-[24px]">It looks like you don’t have enough NFT digital cards in your wallet to be eligible for a pack of RPCiege physical playing cards. But all is not lost! Keep completing RPCiege skirmishes to build your collection, and check back again!</p>
					<a
						href="https://rpciege.com/booklet/kit-and-caboodle"
						class="font-capitolina uppercase font-bold bg-firebolt text-pamphlet px-[30px] py-[20px] text-[24px] leading-[1em] rounded-lg border border-pamphlet shadow-[0_4px_0_0_rgba(41,30,39,1)]"
						>Play Game</a
					>
				{/if}
			</div>
		</div>
	{/if}
</div>
