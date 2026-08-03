import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { SparkleIcon } from "./Icons";

export default function SnowflakePanel() {
  const [demoCase, setDemoCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCase() {
      try {
        const data = await api.snowflakeDemo();
        setDemoCase(data);
      } catch (err) {
        setError(err.message || "Unable to load Snowflake demo case");
      } finally {
        setLoading(false);
      }
    }

    loadCase();
  }, []);

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-stone-900">Snowflake + cocoCLI</h1>
        <p className="muted">
          A best-fit Snowflake workflow for the project, paired with a concise cocoCLI walkthrough that shows how a demo case can be presented dynamically in the UI.
        </p>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 text-pumpkin">
          <SparkleIcon className="w-5 h-5" />
          <div className="section-title">Why Snowflake fits</div>
        </div>
        <p className="mt-3 text-sm text-stone-600">
          Snowflake is a strong fit for this project when the goal is to combine structured operational data, reporting workflows, and governed analytics in a single SQL-first environment. It gives teams a scalable place to centralize forecasting, share trusted datasets, and expose insights to business users without stitching together many disconnected tools.
        </p>
      </div>

      <div className="card p-5">
        <div className="section-title">What cocoCLI adds</div>
        <p className="mt-2 text-sm text-stone-600">
          cocoCLI is a lightweight command-line companion that helps teams launch and explain a Snowflake-style demo workflow from the terminal. It is useful for showing a realistic path from setup to execution, especially when a product demo needs to stay simple, repeatable, and easy to follow.
        </p>
      </div>

      <div className="card p-5">
        <div className="section-title">Dynamic Snowflake demo case</div>
        {loading && <div className="mt-3 text-sm text-stone-500">Loading demo case…</div>}
        {error && <div className="mt-3 text-sm text-rose-700">{error}</div>}
        {demoCase && (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-marigold/40 bg-gradient-to-r from-marigold/20 to-tangerine/20 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-stone-500">Service in this demo</div>
              <div className="mt-1 text-lg font-semibold text-stone-900">{demoCase.serviceName}</div>
              <p className="mt-2 text-sm text-stone-600">{demoCase.serviceDescription}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {demoCase.serviceHighlights?.map((item) => (
                  <span key={item} className="chip">{item}</span>
                ))}
              </div>
              <div className="mt-3 rounded-lg bg-white/80 p-3 text-sm text-stone-700">
                <span className="font-semibold text-stone-900">Value delivered:</span> {demoCase.serviceValue}
              </div>
            </div>

            <div className="rounded-2xl border border-butter bg-butter/40 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-stone-500">Case title</div>
              <div className="mt-1 text-lg font-semibold text-stone-900">{demoCase.title}</div>
              <p className="mt-2 text-sm text-stone-600">{demoCase.summary}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-butter bg-white p-4">
                <div className="text-sm font-semibold text-stone-900">Use case</div>
                <p className="mt-2 text-sm text-stone-600">{demoCase.useCase}</p>
                <div className="mt-3 text-sm font-semibold text-stone-900">Scenario</div>
                <p className="mt-2 text-sm text-stone-600">{demoCase.scenario}</p>
              </div>

              <div className="rounded-2xl border border-butter bg-white p-4">
                <div className="text-sm font-semibold text-stone-900">Source systems</div>
                <ul className="mt-2 space-y-1 text-sm text-stone-600">
                  {demoCase.sourceSystems.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-pumpkin">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border border-butter bg-white p-4">
              <div className="text-sm font-semibold text-stone-900">Suggested workflow</div>
              <ol className="mt-2 space-y-2 text-sm text-stone-600">
                {demoCase.workflow.map((step) => (
                  <li key={step} className="flex gap-2">
                    <span className="text-pumpkin font-semibold">{String(demoCase.workflow.indexOf(step) + 1)}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-butter bg-white p-4">
                <div className="text-sm font-semibold text-stone-900">Sample SQL</div>
                <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-stone-900 p-3 text-xs text-stone-100">{demoCase.sampleSql}</pre>
              </div>
              <div className="rounded-2xl border border-butter bg-white p-4">
                <div className="text-sm font-semibold text-stone-900">cocoCLI example</div>
                <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-stone-900 p-3 text-xs text-stone-100">{demoCase.cocoCli}</pre>
                <p className="mt-3 text-sm text-stone-600">{demoCase.cocoCliOverview}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
