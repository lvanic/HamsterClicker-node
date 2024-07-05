import { useState, useEffect } from "react";
import { getReferralLink, getShareLink } from "../services/telegramService";

export const ReferralLink = () => {
  const [link, setLink] = useState("");

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
        // alert("Link copied to clipboard!");
      },
      (error) => {
        console.error("Error copying to clipboard", error);
      }
    );
  };

  return (
    <div className="mb-4 flex justify-center">
      <button
        onClick={handleShare}
        className="mr-2 bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition duration-300"
      >
        Share
      </button>
      <button
        onClick={handleCopy}
        className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition duration-300"
      >
        Copy
      </button>
    </div>
  );
};
