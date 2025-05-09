import TonWeb from "tonweb";
import { completePayment, getExpectedAmount, getServiceType } from "../services/paymentService";
import { config } from "../core/config";
import { AccountSubscription } from "./AccountSubscription";
import logger from "../core/logger";
import { debug } from "console";

const isMainnet = true;

const tonweb = isMainnet
  ? new TonWeb(new TonWeb.HttpProvider("https://toncenter.com/api/v2/jsonRPC", { apiKey: config.TONCENTER_API_KEY }))
  : new TonWeb(
      new TonWeb.HttpProvider("https://testnet.toncenter.com/api/v2/jsonRPC", { apiKey: config.TONCENTER_API_KEY }),
    );

let accountSubscription: AccountSubscription | null = null;

export const onTransaction = async (tx: any) => {
  if (tx.in_msg.source && tx.out_msgs.length === 0) {
    const payload = tx.in_msg.message;
    const value = tx.in_msg.value;

    if (!payload || tx.in_msg.msg_data["@type"] !== "msg.dataText") return;

    const expected = await getExpectedAmount(payload);
    const service = await getServiceType(payload);
    
    if (expected) {
      const roundedValue = Math.ceil(parseFloat(value) * 10) / 10; // округление вверх до 1 знака
      if (BigInt(Math.floor(expected * 100)) <= BigInt(Math.floor(roundedValue * 100))) {
        console.log(`✅ Payment received for ${service} [UUID: ${payload}]`);
        await completePayment(payload);
      }
    }
  }
};

export const startTonMonitor = async () => {
  debug("startTonMonitor");

  // accountSubscription = new AccountSubscription(tonweb, config.TON_WALLET_ADDRESS, 0, onTransaction);
  // accountSubscription.start();
};

export const stopTonMonitor = () => {
  if (accountSubscription) {
    // accountSubscription.stop();
  }
};
