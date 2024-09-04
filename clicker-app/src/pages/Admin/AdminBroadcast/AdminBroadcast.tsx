import React, { useState } from "react";
import { getConfig } from "../../../utils/config";

const { adminApiUrl } = getConfig();

export const AdminBroadcast = () => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const sendMessage = async () => {
    setSending(true);
    setStatus(null);
    try {
      const response = await fetch(`${adminApiUrl}/admin/broadcast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Admin-Token": localStorage.getItem("password") || "",
        },
        body: JSON.stringify({ message }),
      });

      if (response.ok) {
        setStatus("Message sent successfully!");
      } else {
        setStatus("Failed to send message.");
      }
    } catch (error) {
      console.error("Error sending broadcast:", error);
      setStatus("An error occurred.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h2>Broadcast Message to All Users</h2>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message here..."
        rows={5}
        cols={50}
        className="text-black"
      />
      <br />
      <button onClick={sendMessage} disabled={sending || !message.trim()}>
        {sending ? "Sending..." : "Send Broadcast"}
      </button>
      {status && <p>{status}</p>}
    </div>
  );
};
