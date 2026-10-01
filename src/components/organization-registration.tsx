"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "./providers";
import { SiteHeader } from "./site-header";
import {
  AttachmentUpload,
  type AttachmentUploadItem,
} from "./motion/attachment-upload";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "./motion/combobox";
import { Input } from "./motion/input";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";

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
  const [attachments, setAttachments] = useState<AttachmentUploadItem[]>([]);

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
        <main className="organization-page container">
          <Breadcrumb className="organization-breadcrumb">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">{t.home}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{t.organizationPending}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <section className="organization-status-card">
            <div className="organization-status-icon" aria-hidden>
              <span />
            </div>
            <span className="eyebrow-pill">{t.organizationPending}</span>
            <h1>{t.organizationSubmitted}</h1>
            <p>{t.organizationSubmittedBody}</p>
            <div className="organization-status-divider" />
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

  const fields: Array<{
    name: Exclude<
      keyof typeof initialForm,
      "organization_type" | "supporting_document_url"
    >;
    label: string;
    type: "text" | "tel" | "email" | "url";
    required?: boolean;
  }> = [
    {
      name: "official_name",
      label: t.officialName,
      type: "text",
      required: true,
    },
    {
      name: "address",
      label: t.organizationAddress,
      type: "text",
      required: true,
    },
    { name: "phone", label: t.officialPhone, type: "tel", required: true },
    {
      name: "official_email",
      label: t.officialEmail,
      type: "email",
      required: true,
    },
    { name: "registration_number", label: t.registrationNumber, type: "text" },
    { name: "license_number", label: t.licenseNumber, type: "text" },
    { name: "website_url", label: t.website, type: "url" },
    {
      name: "administrator_name",
      label: t.administratorName,
      type: "text",
      required: true,
    },
    {
      name: "administrator_role",
      label: t.administratorRole,
      type: "text",
      required: true,
    },
  ];

  return (
    <>
      <SiteHeader simple />
      <main className="organization-page container">
        <Breadcrumb className="organization-breadcrumb">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">{t.home}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t.registerOrganization}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <section className="auth-card organization-card">
          <span className="eyebrow-pill">{t.organizationPending}</span>
          <h1>{t.registerOrganization}</h1>
          <p>{t.organizationIntro}</p>
          <form className="auth-form" onSubmit={submit}>
            <label>
              {t.organizationType}
              <Combobox
                value={form.organization_type}
                onValueChange={(value) => update("organization_type", value)}
              >
                <ComboboxTrigger>
                  <ComboboxValue />
                </ComboboxTrigger>
                <ComboboxContent>
                  <ComboboxInput />
                  <ComboboxList>
                    <ComboboxItem value="hospital">{t.hospital}</ComboboxItem>
                    <ComboboxItem value="medical_center">
                      {t.medicalCenter}
                    </ComboboxItem>
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </label>
            {fields.map(({ name, label, type, required }) => (
              <Input
                key={name}
                label={label}
                required={required}
                type={type}
                value={form[name]}
                onChange={(value) => update(name, value)}
              />
            ))}
            <AttachmentUpload
              accept=".pdf,.png,.jpg,.jpeg"
              maxFiles={1}
              attachmentsLabel={t.supportingDocument}
              title={t.supportingDocument}
              description="PDF, PNG or JPG"
              value={attachments}
              onValueChange={setAttachments}
            />
            <Input
              label={`${t.supportingDocument} URL`}
              type="url"
              value={form.supporting_document_url}
              onChange={(value) => update("supporting_document_url", value)}
              placeholder="https://..."
            />
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
