import React from "react";
import { RecentMember } from "../types";
import { getInitials } from "../../../utils/avatarInitials";

type RecentMembersProps = {
  members: RecentMember[];
};

const RecentMembers: React.FC<RecentMembersProps> = ({ members }) => {
  return (
    <aside className="dashboard-panel members-panel">
      <p className="dashboard-kicker">People</p>
      <h2>Recent members</h2>
      {members.length === 0 ? (
        <p className="empty-state">Members will appear after guests join.</p>
      ) : (
        <div className="member-list">
          {members.map((member, index) => (
            <div className="member-row" key={`${member.email}-${index}`}>
              {member.avatar?.secure_url ? (
                <img
                  className="member-avatar"
                  src={member.avatar.secure_url}
                  alt={member.name || "Member avatar"}
                />
              ) : (
                <span className="member-avatar member-avatar-placeholder">
                  {getInitials(member.name)}
                </span>
              )}
              <div>
                <strong>{member.name || "Unknown user"}</strong>
                <p>{member.lastSessionTitle}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
};

export default RecentMembers;
