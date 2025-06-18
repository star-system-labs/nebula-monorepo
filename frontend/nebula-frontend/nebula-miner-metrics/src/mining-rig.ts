import { BigInt, BigDecimal } from "@graphprotocol/graph-ts"
import { MineLiquidityCall, MiningRig } from "../generated/MiningRig/MiningRig"
import { Miner, MiningTransaction } from "../generated/schema"

export function handleMineLiquidity(call: MineLiquidityCall): void {
  let minerId = call.from.toHexString()
  let miner = Miner.load(minerId)
  
  if (!miner) {
    miner = new Miner(minerId)
    miner.address = call.from
    miner.base = BigInt.fromI32(0)
    miner.balance = BigInt.fromI32(0)
    miner.frequency = BigInt.fromI32(0)
    miner.held = BigInt.fromI32(0)
    miner.debt = BigInt.fromI32(0)
    miner.totalMined = BigInt.fromI32(0)
    miner.efficiency = BigDecimal.fromString("0")
    miner.debtRatio = BigDecimal.fromString("0")
    miner.totalScore = BigInt.fromI32(0)
    miner.lastMiningTimestamp = BigInt.fromI32(0)
  }
  
  let liquidity = call.outputs.value0
  let newAllot = call.outputs.newAllot
  let quote = call.outputs.quote
  
  let contract = MiningRig.bind(call.to)
  let scoresResult = contract.try_scores(call.from)
  
  if (!scoresResult.reverted) {
    miner.base = scoresResult.value.getBase()
    miner.balance = scoresResult.value.getBalance()
    miner.frequency = scoresResult.value.getFrequency()
    miner.held = scoresResult.value.getHeld()
    miner.debt = scoresResult.value.getDebt()
    
    let scoreResult = contract.try_score(call.from)
    if (!scoreResult.reverted) {
      miner.totalScore = scoreResult.value
      
      // efficiency (score per mining)
      if (!miner.frequency.equals(BigInt.fromI32(0))) {
        miner.efficiency = miner.totalScore.toBigDecimal().div(miner.frequency.toBigDecimal())
      }
      
      // debt ratio
      if (!miner.base.equals(BigInt.fromI32(0))) {
        miner.debtRatio = miner.debt.toBigDecimal().div(miner.base.toBigDecimal())
      }
    }
    
    miner.totalMined = miner.totalMined.plus(newAllot)
    miner.lastMiningTimestamp = call.block.timestamp
    miner.save()
    
    let txId = call.transaction.hash.toHexString() + "-" + call.transaction.index.toString()
    let tx = new MiningTransaction(txId)
    tx.miner = minerId
    tx.blockNumber = call.block.number
    tx.timestamp = call.block.timestamp
    tx.amountETH = call.transaction.value
    tx.liquidityAdded = liquidity
    tx.allotment = newAllot
    tx.quote = quote
    tx.save()
  }
}
