import React, { useMemo, useState, useEffect } from "react";
import { TonConnect, TonConnectButton } from "@tonconnect/ui-react";
import { useTonAddress } from "@tonconnect/ui-react";
import { getConfig } from "../../utils/config";
import { getTelegramUser } from "../../services/telegramService";
import './TonButton.css'; // Импортируем CSS файл с пользовательскими стилями

const TonButton = ({ className }: { className?: string }) => {
  const userFriendlyAddress = useTonAddress();

  useEffect(() => {
    const storedAddress = localStorage.getItem("walletAddress");
    if (storedAddress) {
      // здесь можно добавить логику для работы с сохраненным адресом
    } else {
      if (userFriendlyAddress) {
        localStorage.setItem("walletAddress", userFriendlyAddress);
        sendWalletAddressToServer(userFriendlyAddress);
      }
    }
  }, [userFriendlyAddress]);

  const truncatedAddress = useMemo(
    () =>
      userFriendlyAddress
        ? `${userFriendlyAddress.slice(0, 3)}...${userFriendlyAddress.slice(
            -3
          )}`
        : "",
    [userFriendlyAddress]
  );

  const sendWalletAddressToServer = async (address: string) => {
    try {
      const config = getConfig();
      const user = getTelegramUser();
      const response = await fetch(`${config.adminApiUrl}/wallet-address`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletAddress: address, userTgId: user.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to send wallet address to the server");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={className}>
      {!userFriendlyAddress ? (
          <TonConnectButton />
      ) : (
        <div className="border-2 border-white rounded-full py-1 px-4">
          <span className="text-white">{truncatedAddress}</span>
        </div>
      )}
    </div>
  );
};

export default TonButton;
