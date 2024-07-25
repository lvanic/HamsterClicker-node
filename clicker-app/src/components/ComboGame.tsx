import { useContext, useEffect } from "react";
import { useWebSocket } from "../hooks/useWebsocket";
import { NotifyContext } from "../contexts/NotifyContext";
import { useUser } from "../hooks/useUser";
import { DataContext } from "../contexts/DataContext";

export const ComboGame = () => {

  const notifyContext = useContext(NotifyContext);
  const dataContext = useContext(DataContext);
  const { user } = useUser();

  const unlockedCombos = user?.currentComboCompletions || [];
  const totalCombos = 3;

  return (
    <div className="grid grid-cols-3 grid-flow-row gap-4">
      {unlockedCombos.map((b) => {
        const business = dataContext?.businesses.find((cb) => cb.id == b);
        return (
          <div
            key={b}
            className="rounded-lg bg-[#373737CC]"
            style={{
              width: "60px",
              height: "60px",
            }}
          >
            <img
              className="rounded-lg"
              src={business?.avatarUrl}
              style={{
                width: "60px",
                height: "60px",
              }}
            />
          </div>
        );
      })}
      {Array.from({ length: totalCombos - unlockedCombos.length }).map(
        (_, index) => (
          <div
            key={`combo-placeholder-${index}`}
            className="rounded-lg bg-[#373737CC] flex items-center justify-center text-white"
            style={{ width: "60px", height: "60px" }}
          >
            Combo #{unlockedCombos.length + index + 1}
          </div>
        )
      )}
    </div>
  );
};
