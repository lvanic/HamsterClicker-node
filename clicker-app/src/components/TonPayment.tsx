import "../utils/setupBuffer.js";
import { useEffect, useState } from "react";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { getConfig } from "../utils/config";
import { getTelegramUser } from "../services/telegramService";
import { Loader2, Wallet } from "lucide-react";
import TonWeb from "tonweb";
import { beginCell, Cell } from "@ton/ton";
import { WaitForTransaction } from "../services/tonService";

export const TonPayment = ({
  serviceType,
  onActivate,
}: {
  serviceType: "boost_x2" | "handicap";
  onActivate: () => void;
}) => {
  const [tonConnectUI] = useTonConnectUI();
  const [paymentInfo, setPaymentInfo] = useState<{
    uuid: string;
    amount: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const { adminApiUrl } = getConfig();

  const serviceName = serviceType === "boost_x2" ? "Boost X2" : "Handicap";
  const price = serviceType === "boost_x2" ? "0.3 TON" : "1.5 TON";
  const iconSrc =
    serviceType === "boost_x2" ? "/img/x2.png" : "/img/handicap.png";

  useEffect(() => {
    const fetchPayment = async () => {
      setLoading(true);
      const user = getTelegramUser();

      try {
        const res = await fetch(`${adminApiUrl}/payments/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceType, userId: user?.id }),
        });
        const data = await res.json();
        setPaymentInfo(data);
      } catch (err) {
        console.error("Ошибка при создании платежа", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [serviceType]);

  const sendTx = async () => {
    // if (!paymentInfo || !tonConnectUI.connected) return;

    // const transaction = {
    //   validUntil: Math.floor(Date.now() / 1000) + 60,
    //   messages: [
    //     {
    //       address: process.env.REACT_APP_TON_WALLET!,
    //       amount: paymentInfo.amount,
    //       payload: createPayload(paymentInfo.uuid),
    //     },
    //   ],
    // };

    // const result = await tonConnectUI.sendTransaction(transaction);
    // const hash = Cell.fromBase64(result.boc).hash().toString("base64");
    // const options = {
    //   hash: hash,
    //   address: tonConnectUI.account?.address ?? "",
    // };
    // await WaitForTransaction({ options });
    onActivate();
  };

  const createPayload = (uuid: string): string => {
    const cell = beginCell()
      .storeUint(0, 32)
      .storeStringTail(uuid)
      .endCell()
      .toBoc()
      .toString("base64");
    return cell;
  };

  return (
    <div
      onClick={sendTx}
      className={`pl-3 py-2 pr-0 my-1 rounded-md flex items-center shadow-sm w-full relative overflow-hidden gap-2 cursor-pointer ${
        !tonConnectUI.connected ? "opacity-60 pointer-events-none" : ""
      }`}
      style={{
        background: "linear-gradient(57.26deg, #761B3F 0%, #78490D 100%)",
      }}
    >
      <img
        className="absolute w-full h-full left-0 top-0"
        src="/img/friend-mask.png"
      />
      <img src={iconSrc} className="w-8 z-10" />
      <div className="w-full z-10">
        <div className="font-semibold">{serviceName}</div>
        <div className="flex justify-between items-center text-sm text-[#F7B84B] pr-4">
          <span>Цена: {price}</span>
          {loading ? (
            <Loader2 className="animate-spin w-4 h-4 text-[#F7B84B]" />
          ) : (
            <div className="flex items-center gap-1 text-white">
              <Wallet className="w-4 h-4" />
              <span>Оплатить</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
