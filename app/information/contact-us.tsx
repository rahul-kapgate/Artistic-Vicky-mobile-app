import ContactAction from "@/components/information/ContactAction";
import InformationPageLayout from "@/components/information/InformationPageLayout";
import InformationSection from "@/components/information/InformationSection";
import React from "react";

const EMAIL = "vikkitembhurne358@gmail.com";
const PHONE_DISPLAY = "+91 93252 17691";
const PHONE_VALUE = "+919325217691";

export default function ContactUsScreen() {
  return (
    <InformationPageLayout
      title="Contact Us"
      subtitle="We are here to help with courses, payments and learning support"
      icon="chatbubble-ellipses-outline"
    >
      <InformationSection
        title="How Can We Help?"
        icon="help-buoy-outline"
        paragraphs={[
          "Have a question about a course, your account, mock tests, payments or learning material? Reach out to the AV Art Academy team using one of the options below.",
          "When contacting us, include your registered name, registered email address and a short description of the issue so we can assist you faster.",
        ]}
      />

      <ContactAction
        title="Email Support"
        value={EMAIL}
        icon="mail-outline"
        color="#4CC3FF"
        url={`mailto:${EMAIL}?subject=${encodeURIComponent(
          "AV Art Academy Support Request",
        )}`}
      />

      <ContactAction
        title="Call Us"
        value={PHONE_DISPLAY}
        icon="call-outline"
        color="#34D399"
        url={`tel:${PHONE_VALUE}`}
      />

      <ContactAction
        title="WhatsApp"
        value="Send a message to our support team"
        icon="logo-whatsapp"
        color="#22C55E"
        url={`https://wa.me/${PHONE_VALUE.replace("+", "")}?text=${encodeURIComponent(
          "Hello AV Art Academy, I need help with:",
        )}`}
      />

      <InformationSection
        title="Before Contacting Support"
        icon="checkmark-done-outline"
        accentColor="#A78BFA"
        items={[
          {
            title: "Account issue",
            text: "Mention the registered email address and the screen where the issue occurred. Never share your password or OTP.",
          },
          {
            title: "Course-access issue",
            text: "Include the course name and, if possible, a screenshot of the message shown in the app.",
          },
          {
            title: "Payment issue",
            text: "Include the transaction date, amount and transaction or order ID. Do not share complete card or banking credentials.",
          },
          {
            title: "Test-result issue",
            text: "Mention whether it was a mock test or PYQ and include the attempt ID shown in your test history.",
          },
        ]}
      />

      <InformationSection
        title="Response Time"
        icon="time-outline"
        accentColor="#FBBF24"
        paragraphs={[
          "Support requests are handled as soon as reasonably possible. Response time may vary during examinations, launches, holidays or periods of high demand.",
        ]}
      />
    </InformationPageLayout>
  );
}
