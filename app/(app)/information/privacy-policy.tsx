import InformationPageLayout from "@/components/information/InformationPageLayout";
import InformationSection from "@/components/information/InformationSection";
import React from "react";

export default function PrivacyPolicyScreen() {
  return (
    <InformationPageLayout
      title="Privacy Policy"
      subtitle="How AV Art Academy collects, uses and protects information"
      icon="shield-checkmark-outline"
      lastUpdated="24 July 2026"
    >
      <InformationSection
        title="1. Introduction"
        icon="information-circle-outline"
        paragraphs={[
          "AV Art Academy respects your privacy and is committed to handling personal information responsibly. This Privacy Policy explains the information that may be collected when you use our website, mobile application, courses, mock tests, previous-year question papers and related services.",
          "By creating an account or using the services, you acknowledge the practices described in this policy.",
        ]}
      />

      <InformationSection
        title="2. Information We Collect"
        icon="desktop"
        accentColor="#A78BFA"
        items={[
          {
            title: "Account information",
            text: "Your name, email address, mobile number, account identifier, profile details and authentication information.",
          },
          {
            title: "Learning information",
            text: "Enrolled courses, lesson progress, test attempts, selected answers, scores, result history and other learning activity.",
          },
          {
            title: "Communication information",
            text: "Messages, support requests, feedback and information you voluntarily provide when contacting us.",
          },
          {
            title: "Payment information",
            text: "Transaction status, order references and payment-related records. Sensitive payment credentials are generally processed by the relevant payment provider rather than stored directly by us.",
          },
          {
            title: "Technical information",
            text: "Device type, operating system, app version, IP address, logs, crash information and similar data used to operate and secure the services.",
          },
        ]}
      />

      <InformationSection
        title="3. How We Use Information"
        icon="analytics-outline"
        accentColor="#34D399"
        items={[
          {
            text: "Create, authenticate and manage user accounts.",
          },
          {
            text: "Provide courses, videos, tests, results and other learning features.",
          },
          {
            text: "Track learning progress and display attempt history.",
          },
          {
            text: "Process transactions and provide purchased access.",
          },
          {
            text: "Respond to questions, complaints and support requests.",
          },
          {
            text: "Improve performance, reliability, content and user experience.",
          },
          {
            text: "Detect fraud, abuse, unauthorised access and security incidents.",
          },
          {
            text: "Comply with legal obligations and enforce our terms.",
          },
        ]}
      />

      <InformationSection
        title="4. Sharing of Information"
        icon="people-outline"
        accentColor="#FBBF24"
        paragraphs={[
          "We do not sell personal information. Information may be shared only when reasonably necessary to provide or protect the services.",
        ]}
        items={[
          {
            title: "Service providers",
            text: "Hosting, analytics, authentication, communication, cloud-storage and payment providers that support our operations.",
          },
          {
            title: "Legal requirements",
            text: "Government authorities or other parties when disclosure is required by applicable law, legal process or a valid official request.",
          },
          {
            title: "Business protection",
            text: "Where reasonably necessary to investigate fraud, protect users, enforce agreements or defend the rights and safety of AV Art Academy.",
          },
        ]}
      />

      <InformationSection
        title="5. Data Storage and Security"
        icon="lock-closed-outline"
        accentColor="#FB7185"
        paragraphs={[
          "We use reasonable administrative and technical safeguards designed to protect information from unauthorised access, loss, misuse or alteration.",
          "No internet transmission or storage system is completely secure. Users should protect their login credentials, use a secure device and notify us if they suspect unauthorised account access.",
        ]}
      />

      <InformationSection
        title="6. Data Retention"
        icon="archive-outline"
        paragraphs={[
          "Information is retained for as long as reasonably necessary to provide the services, maintain academic and transaction records, comply with law, resolve disputes and enforce agreements.",
          "Some information may remain in backups or legal records for a limited period after account closure.",
        ]}
      />

      <InformationSection
        title="7. Your Choices and Rights"
        icon="options-outline"
        accentColor="#A78BFA"
        items={[
          {
            text: "Review and update available profile information.",
          },
          {
            text: "Request correction of inaccurate personal information.",
          },
          {
            text: "Ask questions about how your information is used.",
          },
          {
            text: "Request account or data deletion, subject to legal, academic, fraud-prevention and transaction-record requirements.",
          },
          {
            text: "Manage device permissions from your operating-system settings.",
          },
        ]}
      />

      <InformationSection
        title="8. Children's Privacy"
        icon="happy-outline"
        accentColor="#34D399"
        paragraphs={[
          "The services may be used by students who are minors. A parent or lawful guardian should supervise the creation and use of a minor's account and any purchases made for that student.",
          "If you believe a child has provided information without appropriate permission, contact us so the matter can be reviewed.",
        ]}
      />

      <InformationSection
        title="9. Third-Party Services"
        icon="open-outline"
        accentColor="#FBBF24"
        paragraphs={[
          "The app may use or link to third-party services such as payment processors, video providers, cloud-storage services or external communication apps. Their handling of information is governed by their own policies.",
        ]}
      />

      <InformationSection
        title="10. Policy Changes"
        icon="refresh-outline"
        paragraphs={[
          "This Privacy Policy may be updated when the services, legal requirements or data practices change. The updated version will be made available in the app with a revised last-updated date.",
        ]}
      />

      <InformationSection
        title="11. Contact"
        icon="mail-outline"
        accentColor="#4CC3FF"
        paragraphs={[
          "Questions about this Privacy Policy may be sent to vikkitembhurne358@gmail.com.",
        ]}
      />
    </InformationPageLayout>
  );
}
