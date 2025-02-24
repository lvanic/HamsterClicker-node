import { Socket } from "socket.io";
import { initSocketsLogic } from "./handlers/handler";

export const handleSocketConnection = async (socket: Socket) => {
  registerEvents(socket);

  const userId = socket.handshake.query.user_id;
  (socket as unknown as { userId: string }).userId = userId as string;
};

export const registerEvents = (io: Socket) => {
  const socketsLogic = initSocketsLogic(io);

  io.on("clickEvent", socketsLogic.clickEvent);
  io.on("checkTaskStatus", socketsLogic.checkTaskStatus);
  io.on("getUser", socketsLogic.getUser);
  io.on("getLeagueInfo", socketsLogic.getLeagueInfo);
  io.on("getTasks", socketsLogic.getTasks);
  io.on("activateBoost", socketsLogic.activateBoost);
  io.on("userLeague", socketsLogic.userLeague);
  io.on("disconnect", socketsLogic.disconnect);
};
