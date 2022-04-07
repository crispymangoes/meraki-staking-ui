import { BigInt, Address } from "@graphprotocol/graph-ts";
import {
  TestMeraki,
  Transfer,
} from "../generated/TestMeraki/TestMeraki";
import { User } from "../generated/schema";

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export function handleTransfer(event: Transfer): void {
  let id0 = event.params.from.toHex()
  let id1 = event.params.to.toHex()

  let from = User.load(id0)
  if(from == null){
    from = new User(id0)
    from.tokens = []
  }

  let to = User.load(id1)
  if(to == null){
    to = new User(id1)
    to.tokens = []
  }

  let toTokens = to.tokens
  let fromTokens = from.tokens
  //check if we need to remove a token from from
  if (event.params.from.toHexString() != ZERO_ADDRESS){
    let elementToMove = fromTokens.pop() //remove last element from the array, and store it
    let indexToRemove = fromTokens.indexOf(event.params.tokenId) //find element to overwrite
    if(indexToRemove != -1){
      fromTokens[indexToRemove] = elementToMove; //overwrite element
    }
    //from.tokens = fromTokens
  }
  toTokens.push(event.params.tokenId)
  to.tokens = toTokens
  //to.tokens.push(event.params.tokenId)

  from.save()
  to.save()
}
