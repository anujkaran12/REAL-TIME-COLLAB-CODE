import React, { useCallback, useEffect, useRef, useState } from "react";
import "./Participants.css";
import { useSocket } from "../../context/socketContext";
import { useSearchParams } from "react-router-dom";
import ReactAvatar from "react-avatar";
import { getAvatarColor } from "../../utils/avatarColor";
interface Iprop {
  participantsData: any[];
  hostSocketId: string;
}

const Participants: React.FC<Iprop> = ({ participantsData, hostSocketId }) => {
  const socket = useSocket();
  const [params] = useSearchParams();
  const roomId = params.get("ID") || "";

  useEffect(() => {}, [socket]);

  const onClickRemoveParticipant = useCallback(
    (participantSocketId: string) => {
      socket?.emit("remove-participant", { roomId, participantSocketId });
    },
    [roomId, socket]
  );
  return (
    <div className="participants-container">
      <h3 className="participants-header">
        Participants ({participantsData.length})
      </h3>
      <div className="participants-grid">
        {participantsData.map((p, i) => (
          <div key={i} className="participant">
            <div className="avatar">
              {p.userData?.avatar?.secure_url ? (
                <img
                  src={p.userData.avatar.secure_url}
                  alt={p.userData.name}
                  width="100%"
                  height="100%"
                  loading="lazy"
                />
              ) : (
                <ReactAvatar
                  name={p.userData.name}
                  round={true}
                  size="95"
                  color={getAvatarColor(p.userData?._id || p.socketID || p.userData?.name)}
                />
              )}
              {hostSocketId === socket?.id && p.socketID !== socket?.id && (
                <i
                  className="bi bi-person-dash-fill remove-label"
                  title={`Remove ${p.userData.name} from session`}
                  onClick={() => onClickRemoveParticipant(p.socketID)}
                ></i>
              )}
              {p.socketID === socket?.id && (
                <span className="you-label" title="your avatar">
                  YOU
                </span>
              )}
            </div>
            <p>{p.userData.name}</p>
            {p.socketID === hostSocketId && (
              <span className="host-label" title="Host of the session">
                Host
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Participants;
