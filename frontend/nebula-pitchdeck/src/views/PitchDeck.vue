<template>
  <div class="flex flex-col items-center justify-between py-5 rounded-xl w-full max-w-7xl">
    <div class="mx-auto items-center border-1 border-custom-blue justify-between bg-card-blue bg-opacity-85 p-5 rounded-xl">
      <section class="mb-8">
        <h1 class="text-2xl sm:text-3xl md:text-4xl font-origin text-yellow-300">Nebula Platform</h1>
        <p class="text-sm sm:text-base md:text-xl mt-4 font-nixie font-bold text-teal">
          The Nebula Platform is the world's first decentralized finance platform for meme coins.
        </p>
      </section>
      <div class="my-8 relative">
        <div class="h-px bg-gradient-to-r from-transparent via-yellow-300 to-transparent shadow-[0_0_15px_rgba(234,179,8,0.5)]"></div>
      </div>
      <div class="space-y-8">
        <section v-for="(section, index) in sections" :key="section.title">
          <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold font-origin text-yellow-300 mb-4 text-center sm:text-left">{{ section.title }}</h2>
          <div class="prose max-w-none font-nixie font-bold text-teal text-center sm:text-left">
            <p class="font-bold">{{ section.content }}</p>
            <div v-if="section.phases" class="mt-4 space-y-4">
              <div class="my-4 relative">
                <div class="h-px w-3/4 mx-auto bg-gradient-to-r from-transparent via-yellow-300 to-transparent shadow-[0_0_10px_rgba(234,179,8,0.3)]"></div>
              </div>
              <div v-for="(phase, phaseIndex) in section.phases" :key="phase.title">
                <h3 class="text-lg sm:text-xl md:text-2xl font-origin text-yellow-300">{{ phase.title }}</h3>
                <p class="font-bold">{{ phase.content }}</p>
                
                <div v-if="phaseIndex !== section.phases.length - 1" class="my-4 relative">
                  <div class="h-px w-3/4 mx-auto bg-gradient-to-r from-transparent via-yellow-300 to-transparent shadow-[0_0_10px_rgba(234,179,8,0.3)]"></div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="index !== sections.length - 1" class="my-8 relative">
            <div class="h-px bg-gradient-to-r from-transparent via-yellow-300 to-transparent shadow-[0_0_15px_rgba(234,179,8,0.5)]"></div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
  
  <script setup>
   
  const sections = [
    {
      title: 'In a Nutshell',
      content: "Nebula Protocol enables meme coins to generate Bitcoin and yield, while providing a platform for meme coins to be traded, aggregated, and managed."
    },
    {
      title: 'The Problem',
      content: "Current Meme Coin infrastructure is build around gambling and not DeFi, there are no machinisms to gain yield on purchased memes, you must sell to reap any benefits."
    },
    {
      title: 'Our Solution',
      content: "Nebula provides secure place to lock your meme coins and generate Bitcoin and yield other meme coins, while providing a platform for meme coins to be traded, aggregated, and managed."
    },
    {
      title: 'Our Execution',
      content: "Our execution plan is divided into four phases to ensure a smooth rollout of the Nebula Platform.",
      phases: [
        {
          title: 'Phase 1',
          content: "Deployment of the Nebula Platform v1 which includes the Miner, Staking/Vesting mechanisms, and Rewards interface. The miner is the gem in the initial deployment of phase 1 as it allows legal and secure distribution of the PrimordialPePe token without compromising SEC regulations. We allow the users to choose one of two token to support ( PEPE or POND ) and it sends the ETH liquidity into that market, from there the users are gifted PrimordialPePe tokens as a reward for their support. Meanwhile the Miner manages the liquidity positions and after a set period liquidates this position into a Gnosis Multi Signature Vault. THe Staking and Vesting systems allow for locking of the intially supported meme tokens to restrict the supply of said tokens while providing an incentive and reward. Currently we only support PEPE, PPEPE and SHIB for staking/vesting until the voting goes live with the Nebula DAO. We will also deploy the Abacus Mobile app v1 allowing users to watch their holdings in the Nebula Platform."
        },
        {
          title: 'Phase 2',
          content: "Focuses on the deployment of the StarDustDividends token, which will be distributed as an airdrop to early users of the Nebula Platform. Users will be able to lock their meme tokens to aqcuire PPEPE, then lock the PPEPE to acquire SDIV tokens. This will allow meme coins holder a path to lock up their assets ( memes ) and generate BTC yield. We will also deploy the Nebula DAO and integrate it into the Nebula Platform as a v1.5 to allow for voting on integrating new meme coins to the Nebula Platform, allowing the newly integrated meme coins to then be staked/vested for rewards."
        },
        {
          title: 'Phase 3',
          content: "Deployment of the Nebula Platform v2 which will include Nebula Swap and Aggregator (Along with the CosmicYield CYLD Token), Nebula Microlending, Nebula DAO, NFT management, and advanced portfolio style tools. The Nebula Swap is a heavily updated Uniswap system that use solidity v8 which has integrated math for cheaper gas fees. The Nebula Aggregator will allow users to trade on multiple routers and get the best options for their swap allowing the user to select which router they want to use, this system ( and the nebula swap system ) will qualify for a cashback rewards for its users. Nebula Microlending, DAO and NFT management will allow a whole suite of tools for meme coin holders. The advanced portfolio tools will allow the users to see all aspects of their investments from profit/loss to number of swap and even rewards."
        },
        {
          title: 'Phase 4',
          content: "Depoyment of the NFT system which include the v1 NFTs for free and the coming NFT game which burns PPEPE to operate creating a deflationary system for the Nebula Platform as well as utilizing the v2 and v3 NFTs to create yield boosting tools for your meme yield pools (MYP)."
        }
      ]
    },
    {
      title: 'Conclusion',
      content: "We're building the future of meme coin infrastructure to allow for true finance to occur with meme coins. Which currently is a multi trillion dollar market that is untapped completely in this aspect. Not only are we providing the tools for everyone to benefit, but we give them the tools to vote in any asset the community wants to be supported."
    }
  ]
  </script>