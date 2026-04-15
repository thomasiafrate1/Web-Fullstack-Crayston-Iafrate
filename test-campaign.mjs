#!/usr/bin/env node

/**
 * Test script for campaign creation and email sending
 * Run with: node test-campaign.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testCampaignWorkflow() {
  console.log("\n📋 CAMPAIGN WORKFLOW TEST");
  console.log("=".repeat(60));

  try {
    // 1️⃣ Create a test organization
    console.log("\n1️⃣ Creating test organization...");
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        slug: `test-org-${Date.now()}`,
        name: "Test Organization",
        plan: "free",
      })
      .select()
      .single();

    if (orgError || !org) {
      throw new Error(`Failed to create org: ${orgError?.message}`);
    }
    console.log(`✅ Org created: ${org.id}`);

    // 2️⃣ Create a test user
    console.log("\n2️⃣ Creating test user profile...");
    const testUserId = crypto.randomUUID();
    const { error: profileError } = await supabase
      .auth.admin.createUser({
        email: `test-${Date.now()}@example.com`,
        password: "TestPassword123!",
        email_confirm: true,
      });

    if (profileError) {
      console.log(`⚠️  User creation skipped (may already exist): ${profileError.message}`);
    }

    const { data: user } = await supabase.auth.admin.listUsers();
    const testUser = user?.users[0];
    
    if (!testUser) {
      throw new Error("No test user found in auth");
    }
    
    const { error: profileInsertError } = await supabase
      .from("profiles")
      .upsert({
        id: testUser.id,
        org_id: org.id,
        email: testUser.email,
        role: "owner",
      });

    if (profileInsertError) {
      console.log(`⚠️  Profile setup: ${profileInsertError.message}`);
    }
    console.log(`✅ User profile linked: ${testUser.id}`);

    // 3️⃣ Create test contacts
    console.log("\n3️⃣ Creating test contacts...");
    const testEmails = [
      { email: `test1-${Date.now()}@gmail.com`, full_name: "John Doe" },
      { email: `test2-${Date.now()}@gmail.com`, full_name: "Jane Smith" },
      { email: `test3-${Date.now()}@gmail.com`, full_name: "Bob Wilson" },
    ];

    const { error: contactsError } = await supabase
      .from("contacts")
      .insert(testEmails.map((contact) => ({
        org_id: org.id,
        email: contact.email,
        full_name: contact.full_name,
      })));

    if (contactsError) {
      throw new Error(`Failed to create contacts: ${contactsError.message}`);
    }
    console.log(`✅ Created ${testEmails.length} test contacts`);
    testEmails.forEach((email) => console.log(`   - ${email.email}`));

    // 4️⃣ Create a campaign
    console.log("\n4️⃣ Creating campaign...");
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .insert({
        org_id: org.id,
        name: "Test Campaign",
        subject: "Test Email Subject 🚀",
        template: `
          <html>
            <body style="font-family: Arial; padding: 20px;">
              <h1>Welcome to Test Campaign</h1>
              <p>This is a test email from our campaign system.</p>
              <p style="color: #666; margin-top: 20px; font-size: 12px;">
                Sent at ${new Date().toISOString()}
              </p>
            </body>
          </html>
        `,
        status: "draft",
        created_by: testUser.id,
      })
      .select()
      .single();

    if (campaignError || !campaign) {
      throw new Error(`Failed to create campaign: ${campaignError?.message}`);
    }
    console.log(`✅ Campaign created: ${campaign.id}`);

    // 5️⃣ Add recipients to campaign
    console.log("\n5️⃣ Adding recipients to campaign...");
    const { error: recipientsError } = await supabase
      .from("campaign_recipients")
      .insert(testEmails.map((contact) => ({
        campaign_id: campaign.id,
        org_id: org.id,
        email: contact.email,
        full_name: contact.full_name,
        status: "draft",
      })));

    if (recipientsError) {
      throw new Error(`Failed to add recipients: ${recipientsError.message}`);
    }
    console.log(`✅ Added ${testEmails.length} recipients to campaign`);

    // 6️⃣ Update campaign status to "sending"
    console.log("\n6️⃣ Updating campaign status to 'sending'...");
    const { error: updateError } = await supabase
      .from("campaigns")
      .update({
        status: "sending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaign.id);

    if (updateError) {
      throw new Error(`Failed to update campaign: ${updateError.message}`);
    }
    console.log(`✅ Campaign status updated to 'sending'`);

    // 7️⃣ Call the send-campaign-emails edge function
    console.log("\n7️⃣ Invoking send-campaign-emails edge function...");
    const { data: functionResult, error: functionError } = await supabase.functions.invoke(
      "send-campaign-emails",
      {
        body: {
          campaignId: campaign.id,
          orgId: org.id,
        },
      }
    );

    if (functionError) {
      console.error(`❌ Function error: ${functionError.message}`);
      console.error("Full error:", functionError);
    } else {
      console.log("✅ Function invoked successfully");
      console.log("📊 Result:", JSON.stringify(functionResult, null, 2));
    }

    // 8️⃣ Check campaign status after sending
    console.log("\n8️⃣ Checking final campaign status...");
    const { data: finalCampaign, error: finalError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaign.id)
      .single();

    if (finalError) {
      console.error(`❌ Failed to fetch campaign: ${finalError.message}`);
    } else {
      console.log("📋 Campaign status:", finalCampaign?.status);
      console.log("📦 Full campaign:", JSON.stringify(finalCampaign, null, 2));
    }

    // 9️⃣ Check recipient statuses
    console.log("\n9️⃣ Checking recipient statuses...");
    const { data: recipients, error: recipientCheckError } = await supabase
      .from("campaign_recipients")
      .select("*")
      .eq("campaign_id", campaign.id);

    if (recipientCheckError) {
      console.error(`❌ Failed to fetch recipients: ${recipientCheckError.message}`);
    } else {
      console.log(`📨 Total recipients: ${recipients?.length ?? 0}`);
      recipients?.forEach((recipient) => {
        console.log(`   - ${recipient.email}: ${recipient.status}`);
      });
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ CAMPAIGN WORKFLOW TEST COMPLETED");
    console.log("=".repeat(60));

  } catch (error) {
    console.error("\n❌ TEST FAILED:");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the test
testCampaignWorkflow();
