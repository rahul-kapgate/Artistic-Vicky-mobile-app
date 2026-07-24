import InformationPageLayout from "@/components/information/InformationPageLayout";
import InformationSection from "@/components/information/InformationSection";
import React from "react";

export default function TermsOfUseScreen() {
  return (
    <InformationPageLayout
      title="Terms of Use"
      subtitle="Rules that apply when using AV Art Academy services"
      icon="document-text-outline"
      lastUpdated="24 July 2026"
    >
      <InformationSection
        title="1. Acceptance of Terms"
        icon="checkmark-circle-outline"
        paragraphs={[
          "These Terms of Use govern access to and use of the AV Art Academy website, mobile application, courses, videos, study material, mock tests, previous-year question papers and related services.",
          "By creating an account, purchasing a course or using the services, you agree to these terms. If you do not agree, do not use the services.",
        ]}
      />

      <InformationSection
        title="2. Accounts and Eligibility"
        icon="person-circle-outline"
        accentColor="#A78BFA"
        items={[
          {
            text: "Provide accurate and current account information.",
          },
          {
            text: "Keep passwords, OTPs and authentication details confidential.",
          },
          {
            text: "Do not allow another person to use your account without permission.",
          },
          {
            text: "Notify us if you believe your account has been accessed without authorisation.",
          },
          {
            text: "A parent or lawful guardian should supervise accounts and purchases for minor students.",
          },
        ]}
      />

      <InformationSection
        title="3. Educational Services"
        icon="school-outline"
        accentColor="#34D399"
        paragraphs={[
          "AV Art Academy provides educational content and preparation resources intended to support learning and examination practice.",
          "We do not guarantee admission, rank, score, selection, employment or any particular academic result. Outcomes depend on factors including the student's preparation, attendance, practice and examination performance.",
        ]}
      />

      <InformationSection
        title="4. Purchases and Access"
        icon="card-outline"
        accentColor="#FBBF24"
        items={[
          {
            text: "Prices, course duration, included features and access periods are displayed at the time of purchase.",
          },
          {
            text: "Course access is personal, limited and non-transferable.",
          },
          {
            text: "Access may begin after successful payment confirmation.",
          },
          {
            text: "Taxes, payment-provider rules and transaction processing may apply.",
          },
          {
            text: "Refund requests are handled according to the Refund Policy available in the app.",
          },
        ]}
      />

      <InformationSection
        title="5. Intellectual Property"
        icon="ribbon-outline"
        accentColor="#FB7185"
        paragraphs={[
          "Course videos, notes, questions, illustrations, designs, logos, recordings, documents and other content are owned by or licensed to AV Art Academy and are protected by applicable intellectual-property laws.",
        ]}
        items={[
          {
            text: "You may access purchased content for your personal educational use.",
          },
          {
            text: "You may not copy, record, download without permission, redistribute, sell, publish, upload or commercially exploit the content.",
          },
          {
            text: "You may not remove watermarks, ownership notices or access controls.",
          },
          {
            text: "Sharing account access or course content with unauthorised persons is prohibited.",
          },
        ]}
      />

      <InformationSection
        title="6. Acceptable Use"
        icon="shield-outline"
        items={[
          {
            text: "Do not use the services for unlawful, fraudulent or harmful activity.",
          },
          {
            text: "Do not attempt to bypass authentication, payment, screen-protection or content-access controls.",
          },
          {
            text: "Do not interfere with servers, APIs, applications or other users.",
          },
          {
            text: "Do not submit malicious code, automated scraping requests or excessive traffic.",
          },
          {
            text: "Do not impersonate another person or provide misleading information.",
          },
          {
            text: "Do not harass instructors, staff or other students.",
          },
        ]}
      />

      <InformationSection
        title="7. Test and Result Information"
        icon="clipboard-outline"
        accentColor="#A78BFA"
        paragraphs={[
          "Mock-test and PYQ scores are educational progress indicators. They may not represent official examination results.",
          "Users must not manipulate attempts, answers, scores, timing data or APIs. We may correct technical errors or remove invalid attempts where reasonably necessary.",
        ]}
      />

      <InformationSection
        title="8. Availability and Changes"
        icon="construct-outline"
        accentColor="#FBBF24"
        paragraphs={[
          "We aim to keep the services available, but uninterrupted or error-free operation cannot be guaranteed. Maintenance, internet issues, hosting outages, updates or events outside our control may temporarily affect access.",
          "Content, features, schedules and course structures may be improved, replaced or updated when reasonably necessary.",
        ]}
      />

      <InformationSection
        title="9. Suspension and Termination"
        icon="ban-outline"
        accentColor="#FB7185"
        paragraphs={[
          "Access may be restricted or terminated if an account violates these terms, misuses content, engages in fraud, threatens service security or fails to complete a required payment.",
          "Where appropriate, we may investigate the issue before taking action.",
        ]}
      />

      <InformationSection
        title="10. Disclaimers"
        icon="alert-circle-outline"
        paragraphs={[
          "The services and educational content are provided on an as-available basis. While reasonable care is taken, we do not promise that every item will always be complete, current or error-free.",
          "Students should verify official examination dates, eligibility requirements, syllabus updates and rules through the relevant examination authority.",
        ]}
      />

      <InformationSection
        title="11. Limitation of Liability"
        icon="scale-outline"
        accentColor="#A78BFA"
        paragraphs={[
          "To the maximum extent permitted by applicable law, AV Art Academy will not be liable for indirect, incidental or consequential loss resulting from use of or inability to use the services.",
          "Nothing in these terms excludes rights or liability that cannot legally be excluded.",
        ]}
      />

      <InformationSection
        title="12. Changes to These Terms"
        icon="refresh-outline"
        accentColor="#34D399"
        paragraphs={[
          "These terms may be updated when services, business practices or legal requirements change. Continued use after an updated version becomes effective indicates acceptance of the revised terms.",
        ]}
      />

      <InformationSection
        title="13. Contact"
        icon="mail-outline"
        accentColor="#4CC3FF"
        paragraphs={[
          "Questions about these Terms of Use may be sent to vikkitembhurne358@gmail.com.",
        ]}
      />
    </InformationPageLayout>
  );
}
