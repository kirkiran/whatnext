import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";

export function EmptyWorkspaceWelcome({ onStartCapture, disabled }: {
  onStartCapture: () => void;
  disabled: boolean;
}) {
  return (
    <Surface className="space-y-ds-5 p-ds-5 sm:p-ds-6" aria-labelledby="welcome-title">
      <div className="max-w-3xl space-y-ds-2">
        <h2 id="welcome-title" className="text-section-title text-content-primary">Not sure what to do next?</h2>
        <p className="text-body text-content-secondary">
          EegEnu helps you choose what makes sense to work on based on what you need to get done and your situation right now.
        </p>
      </div>
      <ol className="grid gap-ds-4 sm:grid-cols-3">
        {[
          ["Capture", "Write what you want to get done, in your own words."],
          ["Current Context", "Check your time, location, focus, and chance of interruption."],
          ["Recommended Next Action", "EegEnu recommends a task that fits your current situation."],
        ].map(([title, description], index) => (
          <li key={title} className="flex items-start gap-ds-3">
            <span aria-hidden="true" className="text-component-title text-content-brand">{index + 1}.</span>
            <div className="space-y-ds-1">
              <h3 className="text-component-title text-content-brand">{title}</h3>
              <p className="text-body-small text-content-secondary">{description}</p>
            </div>
          </li>
        ))}
      </ol>
      <Button variant="primary" disabled={disabled} onClick={onStartCapture}>Start with Capture</Button>
    </Surface>
  );
}
