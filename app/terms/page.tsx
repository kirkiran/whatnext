import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms of Use | EegEnu" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use">
      <section>
        <h2>About this experiment and these terms</h2>
        <p>EegEnu is operated by Kiran Suryakant Shahapur, an individual. You must be at least 18 and invited to participate. By using EegEnu, you agree to these Terms of Use and acknowledge the <Link href="/privacy">Privacy Policy</Link>, which explains how your information is processed.</p>
        <p>This is a free, small portfolio and product experiment, with no payments or subscriptions. The service may change, be suspended or end. It is not intended to be a dependable record of critical obligations.</p>
      </section>
      <section>
        <h2>Your account and content</h2>
        <p>Use accurate account information, protect your sign-in access and do not share your account or use someone else&apos;s account. Contact us if you suspect unauthorized access.</p>
        <p>You retain ownership of content you submit. You grant the operator only the limited permission to process, store, transmit and display that content as necessary to provide and operate EegEnu, including using its service providers as described in the Privacy Policy. Submit only information you have permission to use and share.</p>
      </section>
      <section>
        <h2>AI and recommendations</h2>
        <p>Capture uses OpenAI to interpret submitted text and generate or estimate task details. Interpretation and metadata may be incomplete or wrong. Review the resulting tasks and edit them as needed. Recommendations and explanations use local rules and are suggestions only; you decide what to do.</p>
        <p>EegEnu does not execute tasks, send reminders, schedule calendar events or guarantee that obligations will be completed. It is not a medical, financial, legal, emergency or other professional-advice service. Do not rely on it for emergencies, safety-critical matters, deadlines or other critical obligations.</p>
      </section>
      <section>
        <h2>Acceptable use and ending access</h2>
        <p>Do not use EegEnu unlawfully, submit harmful or rights-infringing content, access another person&apos;s data, bypass access controls, interfere with the service or abuse its providers. Do not submit sensitive information unnecessarily.</p>
        <p>You may stop using EegEnu or delete your account at any time during the experiment. The in-app deletion flow removes application data and then the Clerk identity, subject to the limitations explained in the Privacy Policy. The operator may suspend or end access for misuse, security reasons or changes to the experiment.</p>
      </section>
      <section>
        <h2>Service limitations and liability</h2>
        <p>To the extent permitted by applicable law, EegEnu is provided as available, without guarantees of availability, preservation, recovery, accuracy or fitness for a particular purpose. Keep a separate record of anything you need to preserve.</p>
        <p>To the extent permitted by applicable law, the operator is not liable for indirect or consequential losses arising from use of, or inability to use, EegEnu. Nothing in these terms excludes liability that cannot lawfully be excluded or limits your mandatory rights under applicable law.</p>
      </section>
      <section>
        <h2>Contact and changes</h2>
        <p>Contact <a href="mailto:contact@eegenu.com">contact@eegenu.com</a> with questions. We may update these terms, update the effective date and bring material changes to participants&apos; attention before they take effect. If you do not agree to updated terms, stop using the service; you can contact us about deleting your data.</p>
      </section>
    </LegalPage>
  );
}
