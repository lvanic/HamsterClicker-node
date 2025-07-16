import "../utils/setupBuffer.js";
import { useEffect, useMemo, useState } from "react";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { getConfig } from "../utils/config";
import { getTelegramUser } from "../services/telegramService";
import { Loader2, Wallet } from "lucide-react";
import TonWeb from "tonweb";
import { beginCell, Cell } from "@ton/core";
import { WaitForTransaction } from "../services/tonService";

export const TonPayment = ({
  serviceType,
  onActivate,
  isFree,
  lastActivation,
  remainingBoosts,
  activationsPerDay,
}: {
  serviceType: "boost_x2" | "boost_x2_free" | "handicap";
  onActivate: () => void;
  isFree?: boolean;
  lastActivation?: number;
  remainingBoosts?: number;
  activationsPerDay?: number;
}) => {
  const [tonConnectUI] = useTonConnectUI();
  const [paymentInfo, setPaymentInfo] = useState<{
    uuid: string;
    amount: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const { adminApiUrl } = getConfig();

  const serviceName =
    serviceType === "boost_x2"
      ? "Boost X2"
      : serviceType === "boost_x2_free"
      ? "Boost X2 free"
      : "Handicap (X5)";
  const price =
    serviceType === "boost_x2"
      ? "0.3 TON"
      : serviceType === "boost_x2_free"
      ? null
      : "1.5 TON";
  const iconSrc =
    serviceType === "boost_x2" ? "/img/lightning.png" : "/img/lightning.png";

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

  const isBlocked = useMemo(() => {
    if (!lastActivation) return false;

    const now = Date.now();
    const isSameUtcDay = (timestamp: number) => {
      const date1 = new Date(timestamp);
      const date2 = new Date(now);
      return (
        date1.getUTCFullYear() === date2.getUTCFullYear() &&
        date1.getUTCMonth() === date2.getUTCMonth() &&
        date1.getUTCDate() === date2.getUTCDate()
      );
    };

    return isSameUtcDay(lastActivation);
  }, [lastActivation]);

  const sendTx = async () => {
    if (isBlocked) {
      return;
    }

    if (isFree) {
      onActivate();
      return;
    }

    if (!tonConnectUI.connected) {
      tonConnectUI.openModal();
      return;
    }
    if (!paymentInfo || !tonConnectUI.connected) return;

    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 60,
      messages: [
        {
          address: process.env.REACT_APP_TON_WALLET!,
          amount: paymentInfo.amount,
          payload: createPayload(paymentInfo.uuid),
        },
      ],
    };

    const result = await tonConnectUI.sendTransaction(transaction);
    const hash = Cell.fromBase64(result.boc).hash().toString("base64");
    const options = {
      hash: hash,
      address: tonConnectUI.account?.address ?? "",
    };
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
      className={`pl-3 py-2 pr-0 my-1 rounded-md flex items-center shadow-sm w-full relative overflow-hidden gap-2 ${
        isBlocked ? "cursor-not-allowed opacity-50" : "cursor-pointer"
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
        {remainingBoosts != undefined && activationsPerDay != undefined && (
          <div className="flex w-full">
            <div className="text-[#F7B84B] w-1/4">
              {remainingBoosts}/{activationsPerDay}
            </div>
            <div className="flex gap-2 items-center w-full justify-between pr-4">
              {[...Array(remainingBoosts)].map((_, i) => (
                <div key={i} className="rounded-full bg-[#F7B84B] h-2 w-full" />
              ))}

              {[...Array(activationsPerDay - remainingBoosts)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-full bg-[#00000080] h-2 w-full"
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center text-sm text-[#F7B84B] pr-4">
          {price ? <span>Price: {price}</span> : <span>Free</span>}
          {loading ? (
            <Loader2 className="animate-spin w-4 h-4 text-[#F7B84B]" />
          ) : (
            <div className="flex items-center gap-1 text-white">
              {price && <Wallet className="w-4 h-4" />}
              <span>
                {isBlocked
                  ? "Activated"
                  : isFree
                  ? "Activate"
                  : "Pay"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
