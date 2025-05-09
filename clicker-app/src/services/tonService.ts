import "../utils/setupBuffer.js";

import {
  Address,
  Cell,
  Dictionary,
  DictionaryValue,
  JettonMaster,
  JettonWallet,
  Sender,
  TonClient,
  TupleBuilder,
  beginCell,
  storeMessage,
  toNano,
} from "@ton/ton";

//https://testnet.toncenter.com/api/v2/jsonRPC testnet
//https://toncenter.com/api/v2/jsonRPC mainnet

const client = new TonClient({
  endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
});

export const WaitForTransaction = async ({
  options,
}: {
  options: {
    hash: string;
    address: string;
    refetchInterval?: number;
    refetchLimit?: number;
  };
}) => {
  const { hash, refetchInterval = 3000, refetchLimit = 10, address } = options;
  let waitFlag = false;
  return new Promise((resolve) => {
    const walletAddress = Address.parse(address);
    const interval = setInterval(async () => {
      try {
        let refetches = 0;
        refetches += 1;
        console.log("waiting transaction...");

        const state = await client.getContractState(walletAddress);
        if (!state || !state.lastTransaction) {
          clearInterval(interval);
          resolve(null);
          return;
        }

        const { lt: lastLt, hash: lastHash } = state.lastTransaction;
        const lastTx = await client.getTransaction(
          walletAddress,
          lastLt,
          lastHash
        );

        if (lastTx && lastTx.inMessage) {
          const msgCell = beginCell()
            .store(storeMessage(lastTx.inMessage))
            .endCell();
          const inMsgHash = msgCell.hash().toString("base64");
          console.log("InMsgHash", inMsgHash, hash);
          console.log(lastTx);

          if (inMsgHash === hash) {
            waitFlag = true;
          }
          //@ts-ignore
          if (lastTx.description.actionPhase.totalActions == 0 && waitFlag) {
            // setTimeout(() => {
            clearInterval(interval);
            resolve(lastTx);
            // }, 5000);
          }
        }

        if (refetchLimit && refetches >= refetchLimit) {
          clearInterval(interval);
          resolve(null);
        }
      } catch {}
    }, refetchInterval);
  });
};
