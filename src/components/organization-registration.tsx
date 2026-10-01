"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "./providers";
import { SiteHeader } from "./site-header";

const initialForm = {
  organization_type: "hospital",
  official_name: "",
  address: "",
  phone: "",
  official_email: "",
  registration_number: "",
  license_number: "",
  supporting_document_url: "",
  website_url: "",
  administrator_name: "",
  administrator_role: "",
};

export function OrganizationRegistration() {
  const { t } = useLanguage();
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  function update(name: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/backend/hospital-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (!response.ok) throw new Error("Unable to submit application");
      setSubmitted(true);
    } catch {
      setError(t.unavailable);
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <>
        <SiteHeader simple />
        <main className="auth-page container">
          <section className="auth-card">
            <span className="eyebrow-pill">{t.organizationPending}</span>
            <h1>{t.organizationSubmitted}</h1>
            <p>{t.organizationSubmittedBody}</p>
            <button
              className="button primary"
              onClick={() => router.push("/dashboard")}
            >
              {t.backToDashboard}
            </button>
          </section>
        </main>
      </>
    );
  }

  const fields: Array<[keyof typeof initialForm, string, string]> = [
    ["official_name", t.officialName, "text"],
    ["address", t.organizationAddress, "text"],
    ["phone", t.officialPhone, "tel"],
    ["official_email", t.officialEmail, "email"],
    ["registration_number", t.registrationNumber, "text"],
    ["license_number", t.licenseNumber, "text"],
    ["supporting_document_url", t.supportingDocument, "url"],
    ["website_url", t.website, "url"],
    ["administrator_name", t.administratorName, "text"],
    ["administrator_role", t.administratorRole, "text"],
  ];

  return (
    <>
      <SiteHeader simple />
      <main className="auth-page container">
        <section className="auth-card organization-card">
          <span className="eyebrow-pill">{t.organizationPending}</span>
          <h1>{t.registerOrganization}</h1>
          <p>{t.organizationIntro}</p>
          <form className="auth-form" onSubmit={submit}>
            <label>
              {t.organizationType}
              <select
                value={form.organization_type}
                onChange={(event) =>
                  update("organization_type", event.target.value)
                }
              >
                <option value="hospital">{t.hospital}</option>
                <option value="medical_center">{t.medicalCenter}</option>
              </select>
            </label>
            {fields.map(([name, label, type]) => (
              <label key={name}>
                {label}
                <input
                  required={
                    name === "official_name" ||
                    name === "address" ||
                    name === "phone" ||
                    name === "official_email" ||
                    name === "administrator_name" ||
                    name === "administrator_role"
                  }
                  type={type}
                  value={form[name]}
                  onChange={(event) => update(name, event.target.value)}
                />
              </label>
            ))}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary" type="submit" disabled={busy}>
              {busy ? t.submitting : t.submitOrganization}
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
