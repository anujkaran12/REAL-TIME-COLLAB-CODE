import React, { useCallback, useEffect } from "react";
import "./Participants.css";
import { useSocket } from "../../context/socketContext";
import { useSearchParams } from "react-router-dom";
import { getAvatarColor } from "../../utils/avatarColor";
import { getInitials } from "../../utils/avatarInitials";
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
                <span
                  className="avatar-initials"
                  style={{
                    backgroundColor: getAvatarColor(
                      p.userData?._id || p.socketID || p.userData?.name
                    ),
                  }}
                >
                  {getInitials(p.userData?.name)}
                </span>
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
