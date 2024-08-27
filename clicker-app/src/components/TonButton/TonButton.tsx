import React, { useState, useMemo, useEffect } from "react";
import { getConfig } from "../../utils/config";
import { getTelegramUser } from "../../services/telegramService";
import "./TonButton.css";
import ConnectModal from "./ConnectModal";
import { isAddress } from "web3-validator";

const EthereumButton = ({ className }: { className?: string }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputAddress, setInputAddress] = useState("");
  const [isUnvalid, setUnvalid] = useState(false);

  useEffect(() => {
    const storedAddress = localStorage.getItem("walletAddress");
    if (storedAddress) {
      setWalletAddress(storedAddress);
    }
  }, []);

  const handleAddressSubmit = () => {
    if (inputAddress && isAddress(inputAddress)) {
      setWalletAddress(inputAddress);
      localStorage.setItem("walletAddress", inputAddress);
      sendWalletAddressToServer(inputAddress);
      setIsModalOpen(false);
    } else {
      setUnvalid(true);
      setTimeout(() => {
        setUnvalid(false);
      }, 1000);
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
  const handleDisconnectWallet = () => {
    localStorage.removeItem("walletAddress");
    setWalletAddress(null);
  };

  return (
    <>
      <div
        className={`absolute w-full px-20 transition-all duration-300 ease-in-out ${
          isUnvalid ? "top-[100px] opacity-100" : "top-[58px]  opacity-0"
        } overflow-hidden`}
      >
        <div className="bg-[#383838] rounded-b-lg px-3 py-2 border border-t-none">
          Address unvalid
        </div>
      </div>
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
                  background:
                    "linear-gradient(180deg, #ff4c64 0%, #f4895d 100%)",
                }}
              >
                Submit
              </button>
            </div>
          </ConnectModal>
        )}
      </div>
    </>
  );
};

export default EthereumButton;
