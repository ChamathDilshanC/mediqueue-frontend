"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "./providers";
import { Loader } from "./loader";
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
  const [existingApp, setExistingApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function checkExisting() {
      try {
        const res = await fetch("/api/backend/hospital-applications/me", {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setExistingApp(data[0]);
          }
        }
      } catch (err) {
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }
    void checkExisting();
    return () => controller.abort();
  }, []);

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

  const hasExisting = existingApp !== null;
  const currentApp = hasExisting ? existingApp : null;
  const status = currentApp?.status || "pending_review";

  if (loading) {
    return (
      <>
        <SiteHeader simple />
        <main className="organization-page container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
          <Loader />
        </main>
      </>
    );
  }

  if (submitted || hasExisting) {
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
          <section className="organization-status-card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: '3rem 2rem' }}>
            <div className="organization-status-icon" aria-hidden>
              <span />
            </div>
            <span className="eyebrow-pill">{t.organizationPending}</span>
            <h1>{status === "verified" ? "Application Approved!" : status === "rejected" ? "Application Rejected" : t.organizationSubmitted}</h1>
            <p style={{ marginBottom: '2rem' }}>{status === "pending_review" ? t.organizationSubmittedBody : status === "verified" ? "Your organization has been approved. You can now access your workspace." : "Unfortunately, your application was not approved."}</p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3rem 0', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '16px', left: '10%', right: '10%', height: '2px', background: 'var(--border)', zIndex: 0 }} />
              
              <div style={{ background: 'var(--background)', padding: '0 1rem', zIndex: 1 }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'var(--primary-foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontWeight: 'bold' }}>1</div>
                <small style={{ marginTop: '0.75rem', display: 'block', fontWeight: '500' }}>Submitted</small>
              </div>

              <div style={{ background: 'var(--background)', padding: '0 1rem', zIndex: 1 }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: status !== 'pending_review' ? 'var(--primary)' : 'var(--muted)', color: status !== 'pending_review' ? 'var(--primary-foreground)' : 'var(--muted-foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontWeight: 'bold' }}>2</div>
                <small style={{ marginTop: '0.75rem', display: 'block', fontWeight: '500' }}>Under Review</small>
              </div>

              <div style={{ background: 'var(--background)', padding: '0 1rem', zIndex: 1 }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: status === 'verified' ? '#0f766e' : status === 'rejected' ? '#0f766e' : 'var(--muted)', color: status !== 'pending_review' ? '#ffffff' : 'var(--muted-foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontWeight: 'bold' }}>3</div>
                <small style={{ marginTop: '0.75rem', display: 'block', fontWeight: '500' }}>{status === 'rejected' ? 'Rejected' : 'Approved'}</small>
              </div>
            </div>

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
          <form className="auth-form organization-form" onSubmit={submit}>
            <label className="field-wide">
              {t.organizationType} <span className="text-destructive">*</span>
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
                label={
                  <span>
                    {label} <span className={required ? "text-destructive" : "text-[var(--flat-accent)]"}>*</span>
                  </span>
                }
                required={required}
                type={type}
                value={form[name]}
                onChange={(value) => update(name, value)}
                className={
                  name === "address" || name === "website_url"
                    ? "field-wide"
                    : undefined
                }
              />
            ))}
            <AttachmentUpload
              className="field-wide"
              accept=".pdf,.png,.jpg,.jpeg"
              maxFiles={1}
              attachmentsLabel={
                <span>
                  {t.supportingDocument} <span className="text-destructive">*</span>
                </span>
              }
              title={t.supportingDocument}
              description="PDF, PNG or JPG"
              value={attachments}
              onValueChange={setAttachments}
            />
            <Input
              className="field-wide"
              label={
                <span>
                  {t.supportingDocument} URL <span className="text-[var(--flat-accent)]">*</span>
                </span>
              }
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
            <div className="field-wide" style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <button className="button primary" type="submit" disabled={busy}>
                {busy ? t.submitting : t.submitOrganization}
              </button>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
