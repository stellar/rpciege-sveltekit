<script lang="ts">
  import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import type { ActionData, PageData } from '$lib/types';

  export let data: PageData
  export let form: ActionData

  let codes: Array<any> = []
  let loading: boolean = false
  let token: string
  let countdown: string | null

  $: claimed = codes.filter(({status}) => status !== 'unused').length

  // const countdownInterval = setInterval(() => updateCountdown(), 1000)

  const image_ids = [
    "ccb0656e-6a7d-4a83-1e31-51e8b03da200",
    "GA3TEWIUQOSAKW25DADJILDGTCMEOSELHVTH3U3HHEAW7P6TUMJP6IRN",
    "6fb9d682-3a03-4a0e-d6b0-be21b0505d00",
    "GANS46Q7RRMFEV4FPKDCDKHYWDNG5O5EO7GZS3ZGL4MCM6ORYLMFU7P7",
    "cbf385d5-c65c-4add-2cc0-f856ba6a8100",
    "GD6OLQUWE3J42TYIVO3CP5M6WPYXWOE4FO2V3YWXHTA4L63ZFUXB7D7E",
    "033251f4-e0bc-455e-f013-68a558940900",
    "GA4QDG22XUJEBJC7OBT56WSPZDBIFII6TVK2KX55BSFN5T2YQPPWHUID",
    "e7acb9b8-63e7-4953-f212-7fe8f04c4b00",
    "GB4JV3OBVNZIH3JRB4TTNNB65HR7CJR5A7LZVEHIKR3WYEXINPLMZDJN"
  ]

  if (browser) {
    // updateCountdown()

    if (form?.token)
      localStorage.setItem('token', form.token)

    const existingToken = localStorage.getItem('token')

    if (existingToken)
      form = { token: existingToken, referral: $page.params.referral }

    token = form?.token || existingToken

    if (token) {
      data = JSON.parse(atob(token.split('.')[1]))

      fetch('/codes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).then(async (res) => {
        if (res.ok) {
          codes = await res.json()
          codes = codes.map((codeObject, i) => {
            return {
              ...codeObject,
              image_id: image_ids[i * 2 + 1],
              image_id_sm: image_ids[i * 2],
              copied: false
            }
          })
        } else {
          if (res.status === 401)
            localStorage.removeItem('token')
        }
      })
    }

    // if (window.turnstile)
    //   turnstile.ready(function () {
    //     turnstile.render('#turnstile', {
    //       sitekey: '0x4AAAAAAAFF6nYIU7bzj4Zx',
    //       callback: function(token) {
    //         console.log(`Challenge Success ${token}`);
    //       },
    //     });
    //   });

    // window.onloadTurnstileCallback = function() {
    //   turnstile.render('#turnstile', {
    //     sitekey: '0x4AAAAAAAFF6nYIU7bzj4Zx',
    //     callback: function(token) {
    //       console.log(`Challenge Success ${token}`);
    //     },
    //   });
    // };
  }

  function copyCode(link: string, code: string) {
    navigator.clipboard.writeText(link)

    updateCopied(code, true)

    setTimeout(() => updateCopied(code, false), 3000)
  }

  function claimNFT(code: string) {
    updateClaiming(code, true)

    const pubkey = prompt('Enter your Stellar public key to claim your NFT')

    if (!pubkey)
      return updateClaiming(code, false)

    fetch(`/claim/${code}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ pubkey }),
    })
    .then(async (res) => {
      if (res.ok)
        return
      else if (res.status === 401)
        localStorage.removeItem('token')
      throw await res.json()
    })
    .then(() => {
      codes = codes.map((codeObject, i) => {
        return {
          ...codeObject,
          status: codeObject.code === code ? null : codeObject.status,
        }
      })
    })
    .catch((err) => alert(JSON.stringify(err, null, 2)))
    .finally(() => updateClaiming(code, false))
  }

  function updateCopied(code: string, copied: boolean) {
    codes = codes.map((codeObject) => {
      return {
        ...codeObject,
        copied: codeObject.code === code ? copied : codeObject.copied,
      }
    })
  }

  function updateClaiming(code: string, claiming: boolean) {
    codes = codes.map((codeObject) => {
      return {
        ...codeObject,
        claiming: codeObject.code === code ? claiming : codeObject.claiming,
      }
    })
  }

  // function updateCountdown() {
  //   const now = new Date().getTime()
  //   const eventDate = new Date(1686229200000).getTime()
  //   const timeLeft = eventDate - now

  //   if (timeLeft <= 0) {
  //     clearInterval(countdownInterval)
  //     countdown = null
  //     return
  //   }

  //   const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
  //   const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  //   const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
  //   const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000).toString().padStart(2, '0')
    
  //   countdown = `${days}d ${hours}h ${minutes}m ${seconds}s`
  // }
</script>

<div class="fixed top-0 left-0 right-0 min-h-screen bg-no-repeat bg-cover bg-top" style:background-image="url('./HQ-upscale.jpg')"></div>
<div class="fixed inset-0" style:background="linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.3) 100%)"></div>

<div class="relative w-screen min-h-screen flex flex-col items-center px-8 max-[620px]:px-2">
  <img class="mt-24" src="./siege-logo-on-box-with-stylings-distress.png">

  <div class="relative p-5 mt-10 mb-14 rounded-lg [&>*]:relative overflow-hidden w-full max-[620px]:px-3" style:max-width="700px">
    <div class="!absolute inset-0 z-0 opacity-90 bg-yellow bg-center bg-repeat" style:background-image="url(./bg-signup.jpg)"></div>
    
    {#if codes.length}
      <h1 class="flex items-center text-black mb-2">
        <span class="text-3xl -mb-4" style:font-family="Columbus" style:line-height="revert">Now, Recruit an Army</span>
        &nbsp; or
        <a class="px-4 py-2 rounded hover:ring-2 hover:ring-red hover:ring-offset-2 ring-offset-yellow bg-red text-yellow ml-2" href="/booklet" data-sveltekit-reload>Play The Game</a>
      </h1>

      <img class="w-full" src="./rpciege-posters-shadow.png">

      <p class="font-serif my-4">Share these unique codes to forge the alliance for the siege. Recruit at least 5 friends to unlock the entire elite <em><strong>RPCiege Poster</strong></em> collection.</p>

      <ul class="my-4">
        {#each codes as {code, status, image_id, image_id_sm, claiming, copied}}
          <li class="relative z-10 flex items-center mb-1">
            <a href={`https://api.stellar.quest/badge/${image_id}?v=4`}>
              <img class="mr-2" style:width="24px" src={`https://imagedelivery.net/g6Pj0V6gQzzMod63KwDUaw/${image_id_sm}/w=96`}>
            </a>
            →
            {#if status === 'unused'} 
              <span class="mx-2">{location.host}/{code}</span> 
              <button class="uppercase text-xs bg-red py-1 px-2 rounded text-yellow {copied ? '!text-black' : ''}" style:background-color={copied ? "#78c484" : ''} on:click={() => copyCode(`${location.origin}/${code}`,code)}>{copied ? '✘ Copied' : 'Copy'}</button>
            {:else if status === 'unclaimed'}
              <span class="underline line-through mx-2">{code}</span> 
              <button class="uppercase text-xs bg-black py-1 px-2 rounded text-yellow" on:click={() => claimNFT(code)}>{claiming ? '...' : 'Unlock'}</button>
            {:else}
              <span class="uppercase text-xs mx-2 py-1 px-2 rounded text-black" style:background-color="#78c484">✘ Unlocked</span>
            {/if}
          </li>
        {/each}

        <img class="absolute z-0 right-0 pointer-events-none top-1/2 -translate-y-1/2 max-[620px]:opacity-30" style:width="180px" src="./enlistment-icon.png">
      </ul>

      {#if claimed}
        <p class="text-sm [&>a]:underline mb-4 border-l-4 pl-2">RPCiege Posters are issued as claimable NFTs on the Stellar blockchain. In order to own them you'll need claim them. Many Stellar wallets such as <a href="https://albedo.link">Albedo</a> and <a href="https://xbull.app">xBull</a> have this feature built in. If you're using <a href="https://www.freighter.app">Freighter</a> you could try <a href="https://balances.lumens.space/account">this site</a>. Good luck! If all else fails we have a <a href="https://quest.stellar.org/learn/series/3/quest/3">Stellar Quest challenge</a> which walks through how to claim these balances in either the <a href="https://laboratory.stellar.org">Laboratory</a> or the JS SDK.</p>
      {/if}
    {:else if form?.id}
      <h1 class="relative z-10 text-2xl text-black" style:font-family="Columbus" style:line-height="revert">Check With Reconnaissance (Your Email)</h1>

      <form class="flex w-full mt-2 max-[650px]:!mb-0" style:margin-bottom="80px" method="POST" action="?/confirm">
        <input type="hidden" name="id" bind:value={form.id}>
        <input type="hidden" name="email" bind:value={form.email}>
        <input type="hidden" name="referral" bind:value={form.referral}>
        <input class="py-1 mr-2 bg-transparent w-full placeholder:text-black/50 outline-none focus:!border-solid peer order-2" style:border-bottom="1px dashed black" name="code" type="number" placeholder="Enter code">
        <span class="mr-2 text-2xl order-1 peer-focus:text-red">✘</span>
        <button class="relative z-10 px-2 py-1 rounded shrink-0 order-3 hover:ring-2 hover:ring-red hover:ring-offset-2 ring-offset-yellow max-[650px]:!mr-0" style:background-color="#da2f11" style:color="#f7d892" style:margin-right="140px" on:click={() => loading = true}>{loading ? '...' : 'Confirm Code'}</button>
        <img class="absolute z-0 right-0 max-[650px]:opacity-30 max-[650px]:!-top-24 pointer-events-none" style:width="180px" style:top="-30px" src="./enlistment-icon.png">
      </form>
    {:else}
      <h1 class="flex items-center text-black mb-2">
        <span class="text-3xl -mb-4" style:font-family="Columbus" style:line-height="revert">The Siege Has Begun!</span>
        <a class="px-4 py-2 rounded hover:ring-2 hover:ring-red hover:ring-offset-2 ring-offset-yellow bg-red text-yellow ml-2" href="/booklet" data-sveltekit-reload>Play The Game</a>
      </h1>

      <p class="font-serif mb-3">
        Blast back to the future of gaming with 'RPCiege"! Get ready for an adrenaline-pumped, mind-blowing <a class="underline" href="https://soroban.stellar.org/">Soroban</a> developer experience where you're not just playing a game, you're rewriting history with every challenge you conquer. Each task you tackle takes you through time, unlocking NFTs styled after the most legendary heroes and villains known to man! With 5 levels of nail-biting difficulty, the stakes only get higher the more you play.
      </p>
      <p class="font-serif">
        Your mission, should you choose to accept it, is to stress test the network and make your mark in a tsunami of GET and POST requests. Whether you're a veteran dApp interface manipulator or a newbie just cutting your teeth on complex footprints, this is your playground. So what are you waiting for? Dive into the RPCiege and earn your place in the annals of gaming history! Fire up those contracts, hash out those puzzles, and leave no event unlogged. The battleground of the future awaits you, warrior. Time to unleash your full power!
      </p>  

      <form class="flex flex-col w-full mt-6 max-[650px]:!mb-0" style:margin-bottom="80px" method="POST" action="?/enlist">
        <div class="flex">
          <input type="hidden" name="referral" bind:value={$page.params.referral}>
          <input class="py-1 mr-2 bg-transparent w-full placeholder:text-black/50 outline-none focus:!border-solid peer order-2" style:border-bottom="1px dashed black" name="email" type="email" placeholder="Enter email">
          <span class="mr-2 text-2xl order-1 peer-focus:text-red">✘</span>
          <button class="relative z-10 px-2 py-1 rounded shrink-0 order-3 hover:ring-2 hover:ring-red hover:ring-offset-2 ring-offset-yellow max-[650px]:!mr-0" style:background-color="#da2f11" style:color="#f7d892" style:margin-right="140px" on:click={() => loading = true}>{loading ? '...' : 'Enlist Me'}</button>
          <img class="absolute z-0 right-0 max-[650px]:opacity-30 max-[650px]:!-top-24 pointer-events-none" style:width="180px" style:top="-30px" src="./enlistment-icon.png">
        </div>

        <!-- <div class="cf-turnstile" data-sitekey="0x4AAAAAAAFF6nYIU7bzj4Zx"></div> -->
        <!-- <div id="turnstile" class="mt-2"></div> -->
      </form>
    {/if}

    {#if form?.missing}
      <p class="text-red mt-2">Missing form value</p>
    {/if}

    {#if form?.invalid}
      <p class="text-red mt-2">Invalid form value</p>
    {/if}

    <div class="flex mt-4 max-[560px]:flex-col">
      <div class="flex [&>a]:text-sm [&>a]:underline [&>a]:text-center [&>a:hover]:text-red max-[560px]:justify-center">
        <a class="border-r pr-2 mr-2" href="/booklet" data-sveltekit-reload>Play the Game</a>
        <a class="border-r pr-2 mr-2" href="https://soroban.stellar.org">Learn about Soroban</a>
        <a class="border-r pr-2 mr-2" href="https://discord.gg/stellardev">Join the Discord</a>
        <a href="https://twitter.com/sorobanofficial">Follow on Twitter</a>
      </div>

      {#if countdown}
        <span class="text-sm ml-auto bg-black rounded text-yellow px-1 tabular-nums max-[560px]:mt-4 max-[560px]:mr-auto">{countdown}</span>
      {/if}
    </div>
  </div>

  <h1 class="text-7xl text-white mr-auto ml-8 mt-auto mb-8 flex flex-col max-[860px]:text-5xl max-[620px]:text-3xl max-[620px]:text-center max-[620px]:ml-auto" style:font-family="Columbus" style:line-height="revert">
    <span style:margin-bottom="-0.2em">Conquer Fear,</span>
    <span style:margin-bottom="-0.2em">Forge Alliances,</span>
    <span>Become Unhackable.</span>
  </h1>
</div>

<div class="fixed inset-0 z-10 pointer-events-none max-[620px]:hidden" style:box-shadow="inset 0 0 0 1rem #da2f11, inset 0 0 0 calc(1rem + 5px) black"></div>
<div class="absolute inset-0 z-10 pointer-events-none min-[621px]:hidden" style:box-shadow="inset 0 1rem 0 0 #da2f11, inset 0 calc(1rem + 5px) 0 0 black"></div>

<div class="fixed top-0 left-1/2 -translate-x-1/2 z-20 max-[620px]:absolute flex">
  <a class="px-7 text-white z-10 backdrop-blur-sm flex items-center rounded-bl-3xl min-w-[150px] justify-center max-[620px]:hidden" style:box-shadow="inset 0 0 0 1px rgba(0,0,0,0.2)" style:margin-top="calc(1rem + 5px)" href="/leaderboard">Leaderboard</a>

  <a style:background-color="#da2f11" style:box-shadow="inset 0 1rem 0 0 #da2f11, inset 0 0 0 5px black" style:padding="1rem 3.5rem" href="https://fastcheapandoutofcontrol.com">
    <img class="w-screen max-w-[150px]" src="./fca00c.svg">
  </a>

  <a class="px-7 text-white z-10 backdrop-blur-sm flex items-center rounded-br-3xl min-w-[150px] justify-center max-[620px]:hidden" style:box-shadow="inset 0 0 0 1px rgba(0,0,0,0.2)" style:margin-top="calc(1rem + 5px)" href="/claim">Claim</a>
</div>