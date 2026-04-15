"use client";

import { useState } from "react";

export default function CampaignTestPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, unknown>>({});
  const [formData, setFormData] = useState({
    testEmails: "test1@example.com\ntest2@example.com\ntest3@example.com",
    campaignName: "Test Campaign",
    campaignSubject: "Test Subject",
  });

  const handleCreateContactsAndCampaign = async () => {
    setLoading(true);
    try {
      const emails = formData.testEmails
        .split("\n")
        .map((e) => e.trim())
        .filter(Boolean);

      if (emails.length === 0) {
        alert("Enter at least one email");
        setLoading(false);
        return;
      }

      const responses = [];
      for (const email of emails) {
        const formDataObj = new FormData();
        formDataObj.append("email", email);
        formDataObj.append("fullName", `Test User ${emails.indexOf(email) + 1}`);

        const res = await fetch("/api/test/create-contact", {
          method: "POST",
          body: formDataObj,
        });

        const data = await res.json();
        responses.push(data);
      }

      const campaignForm = new FormData();
      campaignForm.append("name", formData.campaignName);
      campaignForm.append("subject", formData.campaignSubject);
      campaignForm.append(
        "template",
        `<html><body style="font-family: Arial; padding: 20px;"><h1>Test Campaign</h1><p>This is a test campaign email</p><p style="color: #999; font-size: 12px; margin-top: 20px;">Sent on ${new Date().toISOString()}</p></body></html>`,
      );
      campaignForm.append("recipients", emails.join("\n"));

      const campaignRes = await fetch("/api/test/create-campaign", {
        method: "POST",
        body: campaignForm,
      });

      const campaignData = await campaignRes.json();

      setResults({
        step1: {
          successCount: emails.length,
          emails,
          contacts: responses,
        },
        step2: campaignData,
      });

      setStep(2);
    } catch (error) {
      console.error("Error:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCampaign = async () => {
    setLoading(true);
    try {
      const campaignId = (results.step2 as Record<string, unknown>)?.campaignId;

      if (!campaignId) {
        alert("No campaign ID found");
        setLoading(false);
        return;
      }

      const form = new FormData();
      form.append("campaignId", campaignId as string);

      const res = await fetch("/api/test/send-campaign", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      setResults((prev) => ({
        ...prev,
        step3: data,
      }));

      setStep(3);
    } catch (error) {
      console.error("Error:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-4xl font-bold text-gray-900">Campaign Testing Interface</h1>

        <div className="mb-8 rounded-lg bg-white p-8 shadow-lg">
          <div className="mb-6 flex items-center">
            <div
              className={`mr-4 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${
                step >= 1 ? "bg-blue-500" : "bg-gray-300"
              }`}
            >
              <span className="font-bold text-white">1</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Create Contacts and Campaign</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Campaign Name</label>
              <input
                type="text"
                value={formData.campaignName}
                onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Campaign Subject</label>
              <input
                type="text"
                value={formData.campaignSubject}
                onChange={(e) => setFormData({ ...formData, campaignSubject: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Test Emails (one per line)</label>
              <textarea
                value={formData.testEmails}
                onChange={(e) => setFormData({ ...formData, testEmails: e.target.value })}
                rows={4}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleCreateContactsAndCampaign}
              disabled={loading}
              className="w-full rounded-lg bg-blue-500 px-4 py-3 font-bold text-white transition hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? "Processing..." : "Step 1: Create Contacts and Campaign"}
            </button>
          </div>

          {step >= 2 && results.step1 != null ? (
            <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
              <h3 className="mb-2 font-bold text-green-900">Step 1 Complete</h3>
              <pre className="overflow-auto rounded bg-white p-2 text-sm text-green-800">
                {JSON.stringify(results.step1, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>

        {step >= 2 ? (
          <div className="mb-8 rounded-lg bg-white p-8 shadow-lg">
            <div className="mb-6 flex items-center">
              <div
                className={`mr-4 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${
                  step >= 2 ? "bg-blue-500" : "bg-gray-300"
                }`}
              >
                <span className="font-bold text-white">2</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Send Campaign</h2>
            </div>

            <button
              onClick={handleSendCampaign}
              disabled={loading}
              className="w-full rounded-lg bg-green-500 px-4 py-3 font-bold text-white transition hover:bg-green-600 disabled:bg-gray-400"
            >
              {loading ? "Sending..." : "Step 2: Send Campaign"}
            </button>

            {step >= 3 && results.step2 != null ? (
              <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-2 font-bold text-blue-900">Campaign Created</h3>
                <pre className="overflow-auto rounded bg-white p-2 text-sm text-blue-800">
                  {JSON.stringify(results.step2, null, 2)}
                </pre>
              </div>
            ) : null}
          </div>
        ) : null}

        {step >= 3 ? (
          <div className="rounded-lg bg-white p-8 shadow-lg">
            <div className="mb-6 flex items-center">
              <div className="mr-4 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-500">
                <span className="font-bold text-white">3</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Send Results</h2>
            </div>

            {results.step3 != null ? (
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                <h3 className="mb-2 font-bold text-purple-900">Campaign Send Response</h3>
                <pre className="overflow-auto rounded bg-white p-2 text-sm text-purple-800">
                  {JSON.stringify(results.step3, null, 2)}
                </pre>
              </div>
            ) : null}

            <div className="mt-6">
              <button
                onClick={() => {
                  setStep(1);
                  setResults({});
                  setFormData({
                    testEmails: "test1@example.com\ntest2@example.com\ntest3@example.com",
                    campaignName: "Test Campaign",
                    campaignSubject: "Test Subject",
                  });
                }}
                className="w-full rounded-lg bg-gray-500 px-4 py-3 font-bold text-white transition hover:bg-gray-600"
              >
                Start New Test
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
