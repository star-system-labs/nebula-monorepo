import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { Approval } from "../generated/schema"
import { Approval as ApprovalEvent } from "../generated/MiningRig/MiningRig"
import { handleApproval } from "../src/mining-rig"
import { createApprovalEvent } from "./mining-rig-utils"

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let src = Address.fromString("0x0000000000000000000000000000000000000001")
    let guy = Address.fromString("0x0000000000000000000000000000000000000001")
    let wad = BigInt.fromI32(234)
    let newApprovalEvent = createApprovalEvent(src, guy, wad)
    handleApproval(newApprovalEvent)
  })

  afterAll(() => {
    clearStore()
  })

  test("Approval created and stored", () => {
    assert.entityCount("Approval", 1)

    assert.fieldEquals(
      "Approval",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "src",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "Approval",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "guy",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "Approval",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "wad",
      "234"
    )

  })
})
