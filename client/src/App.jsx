import { useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatPanel from "./components/ChatPanel";
import UploadPanel from "./components/UploadPanel";
import FeasibilityPanel from "./components/FeasibilityPanel";
import CompliancePanel from "./components/CompliancePanel";
import PermitsPanel from "./components/PermitsPanel";
import SnowflakePanel from "./components/SnowflakePanel";

export default function App() {
  const [active, setActive] = useState("chat");
  const [session, setSession] = useState(null);
  const [facts, setFacts] = useState({});
  const [feasibility, setFeasibility] = useState(null);
  const [compliance, setCompliance] = useState(null);

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar active={active} onSelect={setActive} session={session} />

      <main className="flex-1 p-6 max-w-[1100px] w-full">
        {active === "chat" && (
          <ChatPanel
            session={session}
            onSession={setSession}
            facts={facts}
            onFacts={setFacts}
          />
        )}
        {active === "upload" && (
          <UploadPanel
            session={session}
            onSession={setSession}
            onFacts={(f) => {
              setFacts((prev) => ({ ...prev, ...f }));
            }}
          />
        )}
        {active === "feasibility" && (
          <FeasibilityPanel
            session={session}
            onSession={setSession}
            onFeasibility={setFeasibility}
          />
        )}
        {active === "compliance" && (
          <CompliancePanel
            session={session}
            onSession={setSession}
            facts={facts}
            onCompliance={setCompliance}
            complianceResult={compliance}
          />
        )}
        {active === "permits" && (
          <PermitsPanel
            session={session}
            onSession={setSession}
            facts={facts}
            feasibility={feasibility}
            compliance={compliance}
          />
        )}
        {active === "snowflake" && <SnowflakePanel />}
      </main>
    </div>
  );
}
