"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoomID = exports.deleteRoom = exports.saveRoom = exports.getRoom = exports.rooms = void 0;
exports.rooms = new Map();
const getRoom = (roomID) => exports.rooms.get(roomID);
exports.getRoom = getRoom;
const saveRoom = (room) => {
    exports.rooms.set(room.roomID, room);
    return room;
};
exports.saveRoom = saveRoom;
const deleteRoom = (roomID) => {
    exports.rooms.delete(roomID);
};
exports.deleteRoom = deleteRoom;
const createRoomID = () => {
    let roomID = "";
    while (!roomID || exports.rooms.has(roomID)) {
        roomID = (Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000).toString();
    }
    return roomID;
};
exports.createRoomID = createRoomID;
