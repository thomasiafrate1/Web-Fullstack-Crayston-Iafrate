const readFirstDefined = (...values: Array<string | undefined>) => {
  for (const value of values) {
    if (value) {
      return value;
    }
  }
  return "";
};

const readRequired = (label: string, ...keys: string[]) => {
  const value = readFirstDefined(...keys);
  if (!value) {
    throw new Error(
      `${label} is missing. Define one of: ${keys.join(", ")} in your environment.`,
    );
  }
  return value;
};

const readSupabaseUrl = () =>
  readRequired(
    "Supabase URL",
    "NEXT_PUBLIC_SUPABASE_URL / VITE_SUPABASE_URL",
  );

const readSupabaseAnonKey = () =>
  readRequired(
    "Supabase anon key",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY / VITE_SUPABASE_ANON_KEY",
  );

const supabaseUrlValue = readFirstDefined(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.VITE_SUPABASE_URL,
);

const supabaseAnonKeyValue = readFirstDefined(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  process.env.VITE_SUPABASE_ANON_KEY,
);

export const env = {
  supabaseUrl: supabaseUrlValue || readSupabaseUrl(),
  supabaseAnonKey: supabaseAnonKeyValue || readSupabaseAnonKey(),
  adminSignupCode: readFirstDefined(
    process.env.ADMIN_SIGNUP_CODE,
    process.env.VITE_ADMIN_SIGNUP_CODE,
  ),
  ownerSignupCode: readFirstDefined(
    process.env.OWNER_SIGNUP_CODE,
    process.env.VITE_OWNER_SIGNUP_CODE,
  ),
  supabaseServiceRoleKey: readFirstDefined(process.env.SUPABASE_SERVICE_ROLE_KEY),
  resendApiKey: readFirstDefined(process.env.RESEND_API_KEY),
  resendFromEmail: readFirstDefined(process.env.RESEND_FROM_EMAIL),
  resendFunctionName: readFirstDefined(
    process.env.SUPABASE_RESEND_FUNCTION_NAME,
    process.env.VITE_SUPABASE_RESEND_FUNCTION_NAME,
  ),
  stripeSecretKey: readFirstDefined(process.env.STRIPE_SECRET_KEY),
  stripeWebhookSecret: readFirstDefined(process.env.STRIPE_WEBHOOK_SECRET),
  stripeProPriceId: readFirstDefined(process.env.STRIPE_PRO_PRICE_ID),
  stripePublishableKey: readFirstDefined(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    process.env.VITE_STRIPE_PUBLISHABLE_KEY,
  ),
};

export const hasServiceRoleKey = () => Boolean(env.supabaseServiceRoleKey);
