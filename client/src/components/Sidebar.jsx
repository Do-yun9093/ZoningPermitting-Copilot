import { ChatIcon, UploadIcon, MapIcon, TableIcon, CheckListIcon, SunIcon, SparkleIcon } from "./Icons";

const ITEMS = [
  { id: "chat", label: "Zoning Chat", icon: ChatIcon },
  { id: "upload", label: "Upload Document", icon: UploadIcon },
  { id: "feasibility", label: "Site Feasibility", icon: MapIcon },
  { id: "compliance", label: "Compliance Gap", icon: TableIcon },
  { id: "permits", label: "Permit Checklist", icon: CheckListIcon },
  { id: "snowflake", label: "Snowflake Demo", icon: SparkleIcon }
];

export default function Sidebar({ active, onSelect, session }) {
  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 border-r border-butter bg-white flex flex-col">
      <div className="px-5 py-5 border-b border-butter">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-marigold to-pumpkin grid place-items-center shadow-soft">
            <SunIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-stone-900 leading-tight">Zoning Copilot</div>
            <div className="text-xs text-stone-500">Real estate · urban planning</div>
          </div>
        </div>
      </div>

      <nav className="px-3 py-3 space-y-1 flex-1 overflow-y-auto">
        {ITEMS.map((it) => {
          const Icon = it.icon;
          const isActive = active === it.id;
          return (
            <button
              key={it.id}
              onClick={() => onSelect(it.id)}
              className={[
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition",
                isActive
                  ? "bg-gradient-to-r from-marigold/40 to-tangerine/30 text-stone-900 ring-1 ring-marigold"
                  : "text-stone-700 hover:bg-butter/70"
              ].join(" ")}
            >
              <Icon
                className={[
                  "w-5 h-5",
                  isActive ? "text-pumpkin" : "text-stone-500"
                ].join(" ")}
              />
              {it.label}
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-butter">
        <div className="label mb-1">Session</div>
        <div className="font-mono text-[11px] text-stone-500 break-all">
          {session?.id || "—"}
        </div>
        <div className="mt-2 text-xs text-stone-500">
          Upload a document to ground every answer.
        </div>
      </div>
    </aside>
  );
}
