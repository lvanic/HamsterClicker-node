import React, { useState, useMemo, useEffect } from "react";
import { getConfig } from "../../utils/config";
import { getTelegramUser } from "../../services/telegramService";
import "./TonButton.css";
import ConnectModal from "./ConnectModal";

const EthereumButton = ({ className }: { className?: string }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputAddress, setInputAddress] = useState("");

  useEffect(() => {
    const storedAddress = localStorage.getItem("walletAddress");
    if (storedAddress) {
      setWalletAddress(storedAddress);
    }
  }, []);

  const handleAddressSubmit = () => {
    if (inputAddress) {
      setWalletAddress(inputAddress);
      localStorage.setItem("walletAddress", inputAddress);
      sendWalletAddressToServer(inputAddress);
      setIsModalOpen(false);
    }
  };

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

  const truncatedAddress = useMemo(
    () =>
      walletAddress
        ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
        : "",
    [walletAddress]
  );

  return (
    <div className={className}>
      {!walletAddress ? (
        <button
          onClick={() => setIsModalOpen(true)}
          className="connect-button px-4 py-2"
        >
          Connect Ethereum Wallet
        </button>
      ) : (
        <div className="border-2 border-white rounded-full py-1 px-4">
          <span className="text-white">{truncatedAddress}</span>
        </div>
      )}
      {isModalOpen && (
        <ConnectModal onClose={() => setIsModalOpen(false)}>
          <div className="flex flex-col items-center gap-4 mt-6">
            <div className="flex flex-col items-center gap-4">
              <h2 className="">Enter Ethereum Wallet Address</h2>
              <input
                type="text"
                value={inputAddress}
                onChange={(e) => setInputAddress(e.target.value)}
                placeholder="0x..."
                className="bg-[#383838] rounded-lg px-4 py-2"
              />
            </div>
            <button
              onClick={handleAddressSubmit}
              className="px-4 py-2 rounded-lg"
              style={{
                background: "linear-gradient(180deg, #ff4c64 0%, #f4895d 100%)",
              }}
            >
              Submit
            </button>
          </div>
        </ConnectModal>
      )}
    </div>
  );
};

export default EthereumButton;
