import React, { useEffect, useState } from "react";

interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
}

const ConnectModal: React.FC<ModalProps> = ({ onClose, children }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true); // Trigger the animation on mount
    return () => setVisible(false); // Clean up on unmount
  }, []);

  const handleClose = () => {
    setVisible(false); // Trigger the exit animation
    setTimeout(onClose, 300); // Wait for the animation to finish before closing
  };

  return (
    <>
      <div className="overlay" onClick={handleClose} />
      <div className={`modal ${visible ? "visible" : "hidden"} h-56`}>
        {children}
      </div>
    </>
  );
};

export default ConnectModal;
