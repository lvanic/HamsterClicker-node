import React from "react";
import QRCode from "react-qr-code";
import { getConfig } from "../utils/config";

const QRCodeComponent = () => {
  const config = getConfig();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: "100vw",
        height: "100vh",
        backgroundColor: "black",
      }}
    >
      <QRCode
        value={config.tgBotLink}
        bgColor="#000000"
        fgColor="#ffffff"
        size={256}
      />
      <div className="mt-2 color-white">Open app on your phone</div>
    </div>
  );
};

export default QRCodeComponent;
