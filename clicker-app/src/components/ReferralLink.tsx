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
      <div className={` flex justify-center ${className}`}>
        {share ? (
          <button
            onClick={handleShare}
            className="text-white px-3 py-1 rounded-md transition duration-300 bg-[#BA580F]"
          >
            {getLocalization("share")}
          </button>
        ) : (
          <button
            onClick={handleCopy}
            className="flex gap-1.5 items-center text-white px-3 py-1 rounded-md transition duration-300 bg-[#BA580F]"
          >
            <img src="/img/copy.png" className="w-3.5" />
            <div>
              {isCopied
                ? getLocalization("copied")
                : getLocalization("copyLink")}
            </div>
          </button>
        )}
      </div>
      {
        <div
          className={`fixed px-20 transition-all duration-300 ease-in-out ${
            isCopied ? "top-[0px] opacity-100" : "-top-[20px]  opacity-0"
          } overflow-hidden`}
        >
          <div className="bg-[#FD6717] rounded-b-lg px-3 py-2 border border-t-none">
            Link has been copied
          </div>
        </div>
      }
    </>
  );
};
