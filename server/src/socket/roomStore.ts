import { Room } from "./types";

export const rooms = new Map<string, Room>();

export const getRoom = (roomID: string) => rooms.get(roomID);

export const saveRoom = (room: Room) => {
  rooms.set(room.roomID, room);
  return room;
};

export const deleteRoom = (roomID: string) => {
  rooms.delete(roomID);
};

export const createRoomID = () => {
  let roomID = "";

  while (!roomID || rooms.has(roomID)) {
    roomID = (
      Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000
    ).toString();
  }

  return roomID;
};
