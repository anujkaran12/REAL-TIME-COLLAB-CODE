export type SessionParticipant = {
  name?: string;
  email?: string;
  role?: "HOST" | "GUEST";
  avatar?: {
    secure_url?: string;
  };
};

export type Session = {
  _id: string;
  roomID: string;
  roomTitle: string;
  roomPassword: string;
  maxParticipants: number;
  status: "ACTIVE" | "ENDED";
  lastCode?: string;
  lastLanguage?: string;
  lastEditedBy?: string;
  lastEditedAt?: string;
  participants: SessionParticipant[];
  createdAt: string;
  updatedAt: string;
};

export type RecentMember = SessionParticipant & {
  lastSessionTitle?: string;
  lastJoinedAt?: string;
};
