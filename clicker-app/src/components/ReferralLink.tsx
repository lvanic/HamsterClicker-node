import { useState, useEffect } from "react";
import { getReferralLink, getShareLink } from "../services/telegramService";
import { getLocalization } from "../localization/getLocalization";

export const ReferralLink = ({
  className,
  share,
}: {
  className?: string;
  share: boolean;
}) => {
  const [link, setLink] = useState("");
  const [isCopied, setCopied] = useState(false);

  useEffect(() => {
    const fetchLink = async () => {
      const referralLink = await getReferralLink();
      setLink(referralLink);
    };

    fetchLink();
  }, []);

  const handleShare = () => {
    const shareLink = getShareLink();
    window.open(shareLink, "_blank");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(link).then(
      () => {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      },
      (error) => {
        console.error("Error copying to clipboard", error);
      }
    );
  };

  return (
    <>
      <div
        className={`absolute w-full px-20 transition-all duration-300 ease-in-out ${
          isCopied ? "top-[100px] opacity-100" : "top-[58px]  opacity-0"
        } overflow-hidden`}
      >
        <div className="bg-[#383838] rounded-b-lg px-3 py-2 border border-t-none">
          Link has been copied
        </div>
      </div>
      <div className={`absolute flex justify-center ${className}`}>
        {share ? (
          <button
            onClick={handleShare}
            className="text-black text-xs px-10 py-2 rounded-md transition duration-300"
            style={{
              background: "linear-gradient(180deg, #FFCB83 0%, #FFAE4C 100%)",
            }}
          >
            {getLocalization("share")}
          </button>
        ) : (
          <button
            onClick={handleCopy}
            className="text-black text-xs px-10 py-2 rounded-md transition duration-300"
            style={{
              background: "linear-gradient(180deg, #FFCB83 0%, #FFAE4C 100%)",
            }}
          >
            {getLocalization("copyLink")}
          </button>
        )}
      </div>
    </>
  );
};
