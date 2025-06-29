import { createApp } from 'vue';
import App from './App.vue';
import './tailwind.css';
import './assets/main.css';
import { createI18n } from 'vue-i18n';

window.isNebulaWebComponent = true;
document.documentElement.classList.add('web-component-mode');

const styles = document.createElement('style');
styles.textContent = `
  .nebula-app-container {
    width: 100%;
    height: 100%;
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 16px;
    color: #fff;
    background-color: transparent;
  }
  .nebula-app-container * {
    box-sizing: border-box;
  }
`;
document.head.appendChild(styles);

const messages = {
  en: {
    message: {
      connect: 'Connect Wallet',
      disconnect: 'Disconnect Wallet',
      addmetamask: 'Add to Metamask',
      terms: 'Terms',
      privacy: 'Privacy',
      contract: 'Contract: ',
      address: 'Address: ',
      balance: 'Balance',
      jump: 'Jump to Etherscan',
      mine: 'Mine',
      claim: 'Claim',
      earn: 'Earn',
      slot: 'Slot',
      minemore: 'Mine More, Earn More',
      claimmore: 'Claim More, Earn More',
      mememore: 'Meme More, Earn More',
      lpstaking: 'LP Staking',
      vesting: 'Vesting',
      lpstakingslot: 'LP Staking Slots',
      primordialemis: 'Primordial Emission',
      yousupply: 'You Supply',
      youstake: 'You Stake:',
      youvest: 'You Vest:',
      youmine: 'You Mine:',
      amount: 'Amount',
      enteramount: 'Enter Amount',
      max: 'Max',
      insufficientfunds: 'Insufficient Funds',
      starttime: 'Started',
      rewardsowed: 'Rewards',
      locked: 'Locked',
      remaining: 'Remaining',
      apr: 'APR',
      estimatedrewards: 'Est. Rewards',
      calculating: 'Calculating...',
      unstakelp: 'Unstake LP',
      stakelp: 'Stake LP',
      vesttokens: 'Vest Tokens',
      emergencywithdraw: 'Emergency Withdraw',
      pleaseselect: 'Please select a slot',
      limitexceeded: 'Limit Exceeded',
      sdivrewardscomingsoon: 'SDIV Rewards Coming Soon',
      sdivcomingsoon: 'SDIV COMING SOON',
      nostakingslots: 'No active staking slots',
      novestingslots: 'No active vesting slots',
      vestingslots: 'Vesting Slots',
      vestingperiod: 'Vesting Period:',
      mineppepe: 'Cope Harder',
      value: '$',
      ethvalue: 'ETH'
    }
  },
  cn: {
    message: {
      connect: '连接钱包',
      disconnect: '断开钱包连接',
      addmetamask: '添加到Metamask',
      terms: '条款',
      privacy: '隐私',
      contract: '合约: ',
      address: '地址: ',
      balance: '余额',
      jump: '跳转到Etherscan',
      mine: '矿山',
      claim: '索赔',
      earn: '赚',
      slot: '槽位',
      minemore: '挖得越多，赚得越多',
      claimmore: '索取更多，赚取更多',
      mememore: '玩得越多，赚得越多',
      lpstaking: 'LP质押',
      vesting: '归属',
      lpstakingslot: 'LP质押槽位',
      primordialemis: '原始发射',
      yousupply: '你供应',
      youstake: '你质押:',
      youvest: '授权:',
      youmine: '你矿山:',
      amount: '数量',
      enteramount: '输入数量',
      max: '最大',
      insufficientfunds: '资金不足',
      starttime: '开始时间',
      rewardsowed: '所欠奖励',
      locked: '锁定',
      remaining: '剩余',
      apr: '年利率',
      estimatedrewards: '预估奖励',
      calculating: '计算中...',
      unstakelp: '取消LP质押',
      stakelp: '质押LP',
      vesttokens: '背心代币',
      emergencywithdraw: '紧急提款',
      pleaseselect: '请选择一个槽位',
      limitexceeded: '限制超出',
      sdivrewardscomingsoon: 'SDIV奖励即将到来',
      sdivcomingsoon: 'SDIV即将推出',
      nostakingslots: '没有活跃的质押槽位',
      novestingslots: '没有活跃的归属槽位',
      vestingslots: '归属槽位',
      vestingperiod: '归属期限:',
      mineppepe: '矿用PPePe',
      value: '$',
      ethvalue: 'ETH'
    }
  },
  sp: {
    message: {
      connect: 'Connect Wallet',
      disconnect: 'Disconnect Wallet',
      addmetamask: 'Add to Metamask',
      terms: 'Terms',
      privacy: 'Privacy',
      contract: 'Contract: ',
      address: 'Address: ',
      balance: 'Balance',
      jump: 'Jump to Etherscan',
      mine: 'Mine',
      claim: 'Claim',
      earn: 'Earn',
      slot: 'Slot',
      minemore: 'Mine More, Earn More',
      claimmore: 'Claim More, Earn More',
      mememore: 'Meme More, Earn More',
      lpstaking: 'LP Staking',
      vesting: 'Vesting',
      lpstakingslot: 'LP Staking Slots',
      primordialemis: 'Primordial Emis:',
      youstake: 'You Stake:',
      youvest: 'You Vest:',
      youmine: 'You Mine:',
      amount: 'Amount',
      enteramount: 'Enter Amount',
      max: 'Max',
      insufficientfunds: 'Insufficient Funds',
      starttime: 'Start Time',
      rewardsowed: 'Rewards',
      locked: 'Locked',
      remaining: 'Remaining',
      apr: 'APR:',
      estimatedrewards: 'Est. Rewards:',
      calculating: 'Calculating...',
      unstakelp: 'Unstake LP',
      stakelp: 'Stake LP',
      vesttokens: 'Vest Tokens',
      emergencywithdraw: 'Emergency Withdraw',
      pleaseselect: 'Please select a slot',
      sdivrewardscomingsoon: 'SDIV Rewards Coming Soon',
      sdivcomingsoon: 'SDIV COMING SOON',
      nostakingslots: 'No active staking slots',
      novestingslots: 'No active vesting slots',
      vestingslots: 'Vesting Slots',
      vestingperiod: 'Vesting Period:',
      mineppepe: 'Cope Harder'
    }
  }
};

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages
});

window.mountNebulaApp = function(container) {
  const app = createApp(App);
  app.use(i18n);
  app.mount(container);
  return app;
};

if (!customElements.get('nebula-app')) {
  customElements.define('nebula-app', class extends HTMLElement {
    connectedCallback() {
      const container = document.createElement('div');
      container.style.width = '100%';
      container.style.height = '100%';
      container.classList.add('nebula-app-container');
      
      this.innerHTML = '';
      this.appendChild(container);
      
      window.mountNebulaApp(container);
    }
  });
}

if (!window.isNebulaWebComponent) {
  document.addEventListener('DOMContentLoaded', () => {
    const appEl = document.getElementById('app');
    if (appEl) {
      window.mountNebulaApp(appEl);
    }
  });
} 