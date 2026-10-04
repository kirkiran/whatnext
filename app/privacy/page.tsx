import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacy Policy | EegEnu" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <section>
        <h2>Who we are</h2>
        <p>EegEnu is operated by Kiran Suryakant Shahapur, an individual. It is a free, early-stage, invite-only product for adults aged 18 or older. Contact <a href="mailto:contact@eegenu.com">contact@eegenu.com</a> with privacy questions or requests.</p>
      </section>
      <section>
        <h2>Information we process and why</h2>
        <p>We process your account identifier, tasks and their details to provide your workspace. Stored task details include names, estimated duration, urgency, importance, focus requirement, context category, readiness and whether a task can be done in parts. We also store account and task creation times, task IDs and identifiers used to handle addition retries.</p>
        <p>Successful Capture stores the full text you submitted as the original Capture on every resulting task. Editing a task preserves that original text. Deleting one task does not remove copies on other tasks from the same Capture.</p>
        <p>Current Context, including available time, focus, interruption risk and location, stays in browser memory. Unsaved input, clarification and retry state, recommendations and explanations are also transient UI state, rather than persisted application data. Recommendations and explanations are computed locally in your browser.</p>
        <p>We collect limited behavioral events to understand how people use EegEnu and whether the product is useful, including adding tasks, using Capture, interacting with Context and seeing recommendations. These events are linked to your account, not anonymous. They contain event names and timestamps, and only limited metadata: manual/Capture source, task counts, interpretation/persistence failure stage and addition identifiers where relevant. They do not intentionally contain task text, Capture text, Current Context values, recommendation or explanation text, email or profile data.</p>
        <p>If you email us, we process your message and contact details to respond and handle requests. EegEnu has no advertising, payments or subscriptions, and we do not sell personal data.</p>
      </section>
      <section>
        <h2>Legal bases for processing</h2>
        <p>We process account information, tasks, Capture content and related application data as necessary to provide EegEnu to participants who choose to use the product.</p>
        <p>We process limited behavioral telemetry and necessary technical and security information for our legitimate interests in evaluating the product, understanding whether it works, maintaining security, preventing misuse and improving reliability, where those interests are not overridden by participants&apos; rights and interests.</p>
        <p>Where applicable law requires consent for a particular processing activity, we will rely on consent, and participants may withdraw it as permitted by law. Accepting the Terms of Use or acknowledging this Privacy Policy does not by itself constitute consent to processing that requires consent.</p>
        <p>We may also process information where necessary to comply with applicable legal obligations.</p>
      </section>
      <section>
        <h2>Capture and our service providers</h2>
        <p>Capture sends your submitted text server-side to OpenAI for AI interpretation into tasks and estimated details. Your text may contain personal information you choose to include; it is not necessarily anonymous. We do not attach your account identifier, email, existing tasks or Current Context to that interpretation request. Avoid submitting sensitive information or information you do not have permission to share.</p>
        <p>Our OpenAI request uses <code>store:false</code>, but this does not mean zero retention. OpenAI operational and abuse-monitoring retention may still apply. See <a href="https://developers.openai.com/api/docs/guides/your-data">OpenAI&apos;s API data controls</a>.</p>
        <p>Clerk handles identity, email-code authentication, sessions and authentication cookies. EegEnu does not intentionally copy your email or profile into its application database. Supabase stores the application account root, tasks and behavioral events. Vercel hosts the app and processes application requests. Cloudflare provides domain/DNS services and forwards contact@eegenu.com to the operator&apos;s inbox.</p>
        <p>These providers may process technical information, such as IP addresses and request details, and maintain operational or security logs under their own arrangements. Authentication requires cookies and session technology; this policy does not claim that providers use no other technologies.</p>
      </section>
      <section>
        <h2>Retention and deletion</h2>
        <p>Identifiable participant data is retained while product evaluation and analysis are active. After both conclude, the operator intends to delete remaining identifiable participant application data. This is an intention, not an automated purge or a fixed retention period. Aggregated or non-identifying findings may be retained to document product learnings and development.</p>
        <p>You can delete your account using EegEnu&apos;s Delete account action. The implemented flow removes your application-account root and its stored tasks, original Capture text and behavioral events, then deletes your Clerk identity. If deletion cannot be confirmed, follow the retry instructions or contact us.</p>
        <p>This does not instantly erase provider backups or logs, independently retained OpenAI records, or historical unused browser storage from earlier prototypes. Provider retention may continue, and requests already in progress or other open sessions may complicate deletion. Contact us if you need help.</p>
      </section>
      <section>
        <h2>International processing, security and your rights</h2>
        <p>The initial cohort may include adults in the United States, India and France. Our providers and the operator may process information outside your country, where privacy protections may differ. Contact us for information about processing locations and applicable transfer arrangements.</p>
        <p>We use authentication and database access controls to limit access to your data. No internet service is completely secure, and we cannot guarantee security.</p>
        <p>Depending on applicable law, you may have rights to access, correct or delete your personal information, obtain a copy, restrict or object to processing, or withdraw consent where processing relies on it. You may also have the right to complain to your local data-protection authority. Email <a href="mailto:contact@eegenu.com">contact@eegenu.com</a> to exercise rights or ask questions. We may need to verify your identity before responding. You can edit or delete tasks and delete your account directly in the app.</p>
      </section>
      <section>
        <h2>Changes</h2>
        <p>We may update this policy as EegEnu changes. We will update the effective date and bring material changes to participants&apos; attention before they take effect.</p>
      </section>
    </LegalPage>
  );
}
