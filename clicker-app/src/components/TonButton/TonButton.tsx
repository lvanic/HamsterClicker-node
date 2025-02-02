import React, { useMemo, useState, useEffect, useContext } from "react";
import { TonConnectButton, useTonConnectUI } from "@tonconnect/ui-react";
import { useTonAddress } from "@tonconnect/ui-react";
import { UserContext } from "../../contexts/UserContext";
import { getConfig } from "../../utils/config";

const TonButton = ({ className }: { className?: string }) => {
  const userFriendlyAddress = useTonAddress();
  const wallet = useTonConnectUI();
  const user = useContext(UserContext);

  useEffect(() => {
    const storedAddress = localStorage.getItem("walletAddress");
    if (storedAddress) {
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
            45
          )}`
        : "",
    [userFriendlyAddress]
  );

  const sendWalletAddressToServer = async (address: string) => {
    try {
      const config = getConfig();
      const response = await fetch(`${config.adminApiUrl}/wallet-address`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: address,
          userTgId: user?.user?.tgId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send wallet address to the server");
      }
    } catch (error) {
      console.error(error);
    }
  };
  const handleDisconnectWallet = () => {
    wallet[0].disconnect();
  };

  return (
    <div className={className}>
      {!userFriendlyAddress ? (
        <TonConnectButton />
      ) : (
        <div className="border-2 border-white rounded-full py-1 px-4 flex items-center gap-2">
          <span className="text-white">{truncatedAddress}</span>
          <svg
            onClick={handleDisconnectWallet}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 0C3.5888 0 0 3.5888 0 8C0 12.4112 3.5888 16 8 16C12.4112 16 16 12.4112 16 8C16 3.5888 12.4112 0 8 0ZM8 1.6C11.5288 1.6 14.4 4.4712 14.4 8C14.4 11.5288 11.5288 14.4 8 14.4C4.4712 14.4 1.6 11.5288 1.6 8C1.6 4.4712 4.4712 1.6 8 1.6ZM8 2.4C7.5584 2.4 7.2 2.7576 7.2 3.2V7.2C7.2 7.6424 7.5584 8 8 8C8.4416 8 8.8 7.6416 8.8 7.2V3.2C8.8 2.7576 8.4416 2.4 8 2.4ZM5.65313 3.83906C5.5509 3.85784 5.45157 3.89585 5.35938 3.95625C4.00738 4.84905 3.2 6.34882 3.2 7.96563C3.2 10.6128 5.3528 12.7656 8 12.7656C10.6472 12.7656 12.8 10.612 12.8 7.96563C12.8 6.34802 11.9934 4.84905 10.6406 3.95625C10.2734 3.71465 9.77445 3.81638 9.53125 4.18438C9.28805 4.55317 9.39058 5.04819 9.75938 5.29219C10.6618 5.88739 11.2 6.88723 11.2 7.96563C11.2 9.73042 9.7648 11.1656 8 11.1656C6.2352 11.1656 4.8 9.73042 4.8 7.96563C4.8 6.88723 5.33903 5.88739 6.24062 5.29219C6.60943 5.04819 6.71039 4.55317 6.46719 4.18438C6.28539 3.90838 5.9598 3.78274 5.65313 3.83906Z"
              fill="white"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default TonButton;
