import React from "react";

type WorkspaceHeroProps = {
  userName: string;
  roomCount: number;
};

const WorkspaceHero: React.FC<WorkspaceHeroProps> = ({
  userName,
  roomCount,
}) => {
  return (
    <section className="dashboard-hero">
      <div>
        <p className="dashboard-kicker">Workspace</p>
        <h1>{userName}'s workspace</h1>
        <p>Create rooms and reopen recent sessions.</p>
      </div>
      <div className="dashboard-stats">
        <div>
          <strong>{roomCount}</strong>
          <span>Rooms created</span>
        </div>
      </div>
    </section>
  );
};

export default WorkspaceHero;
