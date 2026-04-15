"use client";

import { useState } from "react";

export default function CampaignTestPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, unknown>>({});
  const [formData, setFormData] = useState({
    testEmails: "test1@example.com\ntest2@example.com\ntest3@example.com",
    campaignName: "Test Campaign",
    campaignSubject: "Test Subject 🚀",
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

      // Create contacts using the contacts action
      console.log("Creating contacts...", emails);

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

      console.log("Contacts created:", responses);

      // Create campaign
      console.log("Creating campaign...");

      const campaignForm = new FormData();
      campaignForm.append("name", formData.campaignName);
      campaignForm.append("subject", formData.campaignSubject);
      campaignForm.append(
        "template",
        `<html><body style="font-family: Arial; padding: 20px;">
          <h1>Test Campaign</h1>
          <p>This is a test campaign email</p>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            Sent on ${new Date().toISOString()}
          </p>
        </body></html>`
      );
      campaignForm.append("recipients", emails.join("\n"));

      const campaignRes = await fetch("/api/test/create-campaign", {
        method: "POST",
        body: campaignForm,
      });

      const campaignData = await campaignRes.json();
      console.log("Campaign created:", campaignData);

      setResults({
        step1: {
          successCount: emails.length,
          emails: emails,
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

      console.log("Sending campaign:", campaignId);

      const form = new FormData();
      form.append("campaignId", campaignId as string);

      const res = await fetch("/api/test/send-campaign", {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      console.log("Send result:", data);

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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          📧 Campaign Testing Interface
        </h1>

        {/* Step 1: Create Contacts & Campaign */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <div
              className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full mr-4 ${
                step >= 1 ? "bg-blue-500" : "bg-gray-300"
              }`}
            >
              <span className="text-white font-bold">1</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Create Contacts & Campaign
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Campaign Name
              </label>
              <input
                type="text"
                value={formData.campaignName}
                onChange={(e) =>
                  setFormData({ ...formData, campaignName: e.target.value })
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Campaign Subject
              </label>
              <input
                type="text"
                value={formData.campaignSubject}
                onChange={(e) =>
                  setFormData({ ...formData, campaignSubject: e.target.value })
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Test Emails (one per line)
              </label>
              <textarea
                value={formData.testEmails}
                onChange={(e) =>
                  setFormData({ ...formData, testEmails: e.target.value })
                }
                rows={4}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
              />
            </div>

            {step >= 1 && (
              <button
                onClick={handleCreateContactsAndCampaign}
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition"
              >
                {loading ? "Processing..." : "Step 1: Create Contacts & Campaign"}
              </button>
            )}
          </div>

          {step >= 2 && results.step1 && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-bold text-green-900 mb-2">✅ Step 1 Complete</h3>
              <pre className="text-sm text-green-800 overflow-auto bg-white p-2 rounded">
                {JSON.stringify(results.step1, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Step 2: Send Campaign */}
        {step >= 2 && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-center mb-6">
              <div
                className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full mr-4 ${
                  step >= 2 ? "bg-blue-500" : "bg-gray-300"
                }`}
              >
                <span className="text-white font-bold">2</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Send Campaign
              </h2>
            </div>

            <button
              onClick={handleSendCampaign}
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition"
            >
              {loading ? "Sending..." : "Step 2: Send Campaign"}
            </button>

            {step >= 3 && results.step2 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-bold text-blue-900 mb-2">
                  ℹ️ Campaign Created
                </h3>
                <pre className="text-sm text-blue-800 overflow-auto bg-white p-2 rounded">
                  {JSON.stringify(results.step2, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Results */}
        {step >= 3 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center mb-6">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full mr-4 bg-blue-500">
                <span className="text-white font-bold">3</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Send Results
              </h2>
            </div>

            {results.step3 && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="font-bold text-purple-900 mb-2">
                  📊 Campaign Send Response
                </h3>
                <pre className="text-sm text-purple-800 overflow-auto bg-white p-2 rounded">
                  {JSON.stringify(results.step3, null, 2)}
                </pre>
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={() => {
                  setStep(1);
                  setResults({});
                  setFormData({
                    testEmails: "test1@example.com\ntest2@example.com\ntest3@example.com",
                    campaignName: "Test Campaign",
                    campaignSubject: "Test Subject 🚀",
                  });
                }}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition"
              >
                Start New Test
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
