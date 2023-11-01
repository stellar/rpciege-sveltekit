<script lang="ts">
  import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import type { ActionData, PageData } from '$lib/types';

  export let data: PageData
  export let form: ActionData

  let codes: Array<any> = []
  let loading: boolean = false
  let token: string
  let countdown: string|null = null

  const countdownInterval = setInterval(() => updateCountdown(), 1000)

  if (browser) {
    updateCountdown()

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
        if (res.ok)
          codes = await res.json()
        else if (res.status === 401)
          localStorage.removeItem('token')
      })
    }
  }

  function updateCountdown() {
    const now = new Date().getTime()
    const eventDate = new Date('Oct 31 2023 9:00:00 PM GMT-0400').getTime()
    const timeLeft = eventDate - now

    if (timeLeft <= 0) {
      clearInterval(countdownInterval)
      countdown = null
      return
    }

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000).toString().padStart(2, '0')
    
    countdown = `${days}d ${hours}h ${minutes}m ${seconds}s`
  }
</script>

<div class="fixed top-0 left-0 right-0 bottom-0 min-h-screen bg-no-repeat bg-cover bg-center" style:background-image="url('./axe-and-ember-bg.png')"></div>
<div class="fixed inset-0" style:background="linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.3) 100%)"></div>

<div class="relative w-screen min-h-screen flex flex-col items-center px-8 max-[620px]:px-2">
  <img class="mt-24" src="./siege-logo-on-box-with-stylings-distress.png">

  <div class="relative p-5 mt-10 mb-14 rounded-lg [&>*]:relative overflow-hidden w-full max-[620px]:px-3" style:max-width="700px">
    <div class="!absolute inset-0 z-0 opacity-90 bg-yellow bg-center bg-repeat" style:background-image="url(./bg-signup.jpg)"></div>
    
    {#if codes.length}
      <h1 class="flex items-center text-black mb-2">
        <span class="text-3xl -mb-4" style:font-family="Columbus" style:line-height="revert">Now, Prepare for Night</span>
        &nbsp; or
        <a class="px-4 py-2 rounded hover:ring-2 hover:ring-red hover:ring-offset-2 ring-offset-yellow bg-red text-yellow ml-2" href="/booklet/axe-and-ember" data-sveltekit-reload>Play The Game</a>
      </h1>

      <img class="w-full mt-5" src="./dragon-pano.png">

      <ol class="font-serif my-4 mb-4 [&>li>a]:underline [&>li>a]:font-bold">
        <li>[1] <a href="https://stellar.org/blog/developers/rpciege-axe-and-ember-get-set-up">Read up</a> on your upcoming quest to gain valuable insights and insider information</li>
        <li>[2] <a href="https://discord.gg/stellardev">Join our Discord</a> to forge alliances and prepare for what lies ahead</li>
        <li>[3] <a href="https://rpciege.com/booklet">Play previous RPCiege</a> skirmishes to level up your expertise</li>
      </ol>
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
        <span class="text-3xl -mb-4" style:font-family="Columbus" style:line-height="revert">Axe & Ember</span>
        <a class="px-4 py-2 rounded hover:ring-2 hover:ring-red hover:ring-offset-2 ring-offset-yellow bg-red text-yellow ml-2" href="/booklet/axe-and-ember" data-sveltekit-reload>Play The Game</a>
      </h1>

      <p class="font-serif mb-3">
        You’re a traveling rock peddler journeying to a new town. Your path has unexpectedly led you into the depths of Dreadwood Forest on the night of the full moon. You’ve heard stories of these woods and the monsters that emerge when the sun goes down. And you know these dangers are even more menacing under the silvery gaze of the full moon’s light.        
      </p>
      <p class="font-serif mb-3">
        You are in a lush grass-covered clearing surrounded by dense pine trees when you decide to make camp for the night. You must survive until morning by keeping the monsters at bay with artificial light, or by trying something a little more creative. Monsters can attack anytime once the sun sets (from 9 p.m. to 5 a.m.).
      </p>
      <p class="font-serif mb-3">
        In addition to the dull axe and some flint hanging from your belt, you have a knapsack with two items in it:
      </p>
      <ol class="font-serif mb-3">
        <li>[1] Oil lamp and canister of oil</li>
        <li>[2] Torch and sharpening stone</li>
        <li>[3] Flask of whiskey and lucky amulet</li>
      </ol>
      <p>
      {#if countdown}
        In <strong class="text-xl">{countdown}</strong> the
      {:else}
        The
      {/if} choice is up to you...</p>

      <form class="flex flex-col w-full mt-6 max-[650px]:!mb-0" style:margin-bottom="80px" method="POST" action="?/enlist">
        <div class="flex">
          <input type="hidden" name="referral" bind:value={$page.params.referral}>
          <input class="py-1 mr-2 bg-transparent w-full placeholder:text-black/50 outline-none focus:!border-solid peer order-2" style:border-bottom="1px dashed black" name="email" type="email" placeholder="Enter email">
          <span class="mr-2 text-2xl order-1 peer-focus:text-red">✘</span>
          <button class="relative z-10 px-2 py-1 rounded shrink-0 order-3 hover:ring-2 hover:ring-red hover:ring-offset-2 ring-offset-yellow max-[650px]:!mr-0" style:background-color="#da2f11" style:color="#f7d892" style:margin-right="140px" on:click={() => loading = true}>{loading ? '...' : 'Enlist Me'}</button>
          <img class="absolute z-0 right-0 max-[650px]:opacity-30 max-[650px]:!-top-24 pointer-events-none" style:width="180px" style:top="-30px" src="./enlistment-icon.png">
        </div>
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
        <a class="border-r pr-2 mr-2" href="/booklet/axe-and-ember" data-sveltekit-reload>Play the Game</a>
        <a class="border-r pr-2 mr-2" href="https://soroban.stellar.org">Learn about Soroban</a>
        <a class="border-r pr-2 mr-2" href="https://discord.gg/stellardev">Join the Discord</a>
        <a href="https://twitter.com/sorobanofficial">Follow on Twitter</a>
      </div>

      {#if countdown}
        <span class="text-sm ml-auto bg-black rounded text-yellow px-1 tabular-nums max-[560px]:mt-4 max-[560px]:mr-auto">{countdown}</span>
      {/if}
    </div>
  </div>
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