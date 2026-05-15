export type Participant = {
  socketID: string;
  role: string;
  userData: any;
};

export type Room = {
  roomID: string;
  roomTitle?: string;
  roomPassword?: string;
  hostUserId?: string;
  hostSocketId?: string;
  maxParticipants: number;
  lastCode: string;
  lastLanguage: string;
  participants: Participant[];
};
