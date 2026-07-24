import InformationPageLayout from "@/components/information/InformationPageLayout";
import InformationSection from "@/components/information/InformationSection";
import React from "react";

export default function RefundPolicyScreen() {
  return (
    <InformationPageLayout
      title="Refund Policy"
      subtitle="How payment, cancellation and refund requests are reviewed"
      icon="card-outline"
      lastUpdated="24 July 2026"
    >
      <InformationSection
        title="1. Overview"
        icon="information-circle-outline"
        paragraphs={[
          "AV Art Academy provides digital educational content, course access, tests and related learning services. Because access to digital material may be provided immediately after payment, refund eligibility is limited.",
          "Please review the course description, duration, included content and device requirements carefully before completing a purchase.",
        ]}
      />

      <InformationSection
        title="2. Requests That May Be Eligible"
        icon="checkmark-circle-outline"
        accentColor="#34D399"
        items={[
          {
            title: "Duplicate payment",
            text: "The same order was charged more than once and the duplicate charge can be verified.",
          },
          {
            title: "Payment completed but access not provided",
            text: "A successful payment was recorded, but course access was not activated and the issue could not be resolved within a reasonable support period.",
          },
          {
            title: "Incorrect product activation",
            text: "A different course was activated because of a verified technical or administrative error.",
          },
          {
            title: "Course cancellation",
            text: "A paid course is cancelled by AV Art Academy and a suitable replacement or equivalent access is not offered.",
          },
          {
            title: "Other exceptional cases",
            text: "A request may be reviewed where applicable law requires a refund or where the academy determines that exceptional circumstances justify one.",
          },
        ]}
      />

      <InformationSection
        title="3. Requests Normally Not Eligible"
        icon="close-circle-outline"
        accentColor="#FB7185"
        items={[
          {
            text: "Change of mind after purchasing or accessing digital content.",
          },
          {
            text: "Failure to attend, complete lessons, practise or use the course.",
          },
          {
            text: "Dissatisfaction with examination results, rank, admission or selection.",
          },
          {
            text: "Inability to use the service because of an unsupported device, poor internet connection or user-controlled technical environment.",
          },
          {
            text: "Account suspension caused by violation of the Terms of Use.",
          },
          {
            text: "Requests based on content already substantially consumed, downloaded, recorded, shared or otherwise used.",
          },
        ]}
      />

      <InformationSection
        title="4. How to Request a Review"
        icon="mail-outline"
        accentColor="#4CC3FF"
        paragraphs={[
          "Send the request to vikkitembhurne358@gmail.com as soon as possible after discovering the issue.",
        ]}
        items={[
          {
            text: "Registered student name.",
          },
          {
            text: "Registered email address and mobile number.",
          },
          {
            text: "Course or product name.",
          },
          {
            text: "Payment date and amount.",
          },
          {
            text: "Order ID, transaction ID or payment reference.",
          },
          {
            text: "A clear explanation of the issue and relevant screenshots.",
          },
        ]}
      />

      <InformationSection
        title="5. Review Process"
        icon="search-outline"
        accentColor="#A78BFA"
        paragraphs={[
          "Submitting a request does not automatically guarantee a refund. The academy may verify account activity, payment records, access history and communication related to the purchase.",
          "Additional information may be requested before a decision is made. Requests containing incomplete or inaccurate details may take longer to review.",
        ]}
      />

      <InformationSection
        title="6. Approved Refunds"
        icon="wallet-outline"
        accentColor="#34D399"
        paragraphs={[
          "When a refund is approved, it will normally be returned through the original payment method where supported.",
          "The time required for the amount to appear depends on the payment provider, bank and transaction method. Processing delays after approval may be outside AV Art Academy's direct control.",
        ]}
      />

      <InformationSection
        title="7. Failed or Pending Payments"
        icon="hourglass-outline"
        accentColor="#FBBF24"
        paragraphs={[
          "A payment shown as pending may later succeed or automatically reverse. Before making another payment, check your bank or payment-app statement and contact support with the transaction reference.",
          "If money is debited but the payment provider marks the transaction as failed, the reversal timeline is generally controlled by the bank or payment provider.",
        ]}
      />

      <InformationSection
        title="8. Course Transfers"
        icon="swap-horizontal-outline"
        paragraphs={[
          "Course transfers, credits or replacement access are not guaranteed. In suitable cases, the academy may offer an alternative resolution instead of a cash refund.",
        ]}
      />

      <InformationSection
        title="9. Policy Changes"
        icon="refresh-outline"
        accentColor="#A78BFA"
        paragraphs={[
          "This Refund Policy may be updated to reflect changes in products, payment providers, business practices or legal requirements. The policy applicable at the time of purchase will generally be considered when reviewing a request.",
        ]}
      />

      <InformationSection
        title="10. Contact"
        icon="chatbubble-ellipses-outline"
        accentColor="#4CC3FF"
        paragraphs={[
          "For payment or refund assistance, email vikkitembhurne358@gmail.com or call +91 93252 17691.",
        ]}
      />
    </InformationPageLayout>
  );
}
