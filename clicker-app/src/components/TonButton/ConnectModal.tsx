import React, { useEffect, useMemo, useState } from "react";
import { getPlatform } from "../../services/telegramService";

interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
}

const ConnectModal: React.FC<ModalProps> = ({ onClose, children }) => {
  const [visible, setVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const platform = useMemo(() => getPlatform(), [getPlatform]);

  useEffect(() => {
    setVisible(true);

    return () => {
      setVisible(false);
    };
  }, [platform]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300); // Ждем завершения анимации перед закрытием
  };

  return (
    <>
      <div className="overlay" onClick={handleClose} />
      <div
        className={`modal top-20 rounded-[40px!important] mx-4  ${
          visible ? "visible" : "hidden"
        } h-56`}
        style={{ width: "-webkit-fill-available" }} // динамически изменяем mb
      >
        {children}
      </div>
    </>
  );
};

export default ConnectModal;
