import React from "react";

export const TaskModal = ({
  task,
  onClose,
  onOpenLink,
  onCheckStatus,
}: any) => {
  if (!task) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-5 rounded-lg w-3/4 max-w-md">
        <h2 className="text-2xl mb-4">{task.name}</h2>
        <p className="mb-4">{task.description}</p>
        <p className="mb-4">Reward: {task.rewardAmount}</p>
        <div className="flex justify-end space-x-2">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={onOpenLink}
          >
            {task.type == "telegram" ? "Open Link" : "Go"}
          </button>
          {!task.completed && task.type == "telegram" && (
            <button
              className="px-4 py-2 bg-green-500 text-white rounded"
              onClick={onCheckStatus}
            >
              Check Status
            </button>
          )}
          <button
            className="px-4 py-2 bg-red-500 text-white rounded"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
