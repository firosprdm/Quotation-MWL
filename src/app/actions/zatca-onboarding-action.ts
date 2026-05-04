'use server';

import { generateZatcaCSR, OnboardingDetails } from '@/lib/zatca-onboarding';

const ZATCA_SANDBOX_URL = 'https://gw-fatoora.zatca.gov.sa/e-inv/all/sandbox/compliance/onboarding';

export async function completeZatcaOnboardingAction(params: {
  otp: string;
  details: OnboardingDetails;
}) {
  try {
    const { otp, details } = params;

    // 1. Generate CSR and Private Key
    const { privateKey, csr } = await generateZatcaCSR(details);

    // 2. Prepare CSR for ZATCA (Base64 only)
    const cleanCSR = csr
      .replace('-----BEGIN CERTIFICATE REQUEST-----', '')
      .replace('-----END CERTIFICATE REQUEST-----', '')
      .replace(/\s+/g, '');

    // 3. Call ZATCA Sandbox API
    const response = await fetch(ZATCA_SANDBOX_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'OTP': otp,
        'accept-language': 'en',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        csr: cleanCSR,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || result.errors?.[0]?.message || 'Failed to connect to ZATCA');
    }

    // result contains: binarySecurityToken, secret, requestID
    return {
      success: true,
      data: {
        certificate: result.binarySecurityToken,
        secret: result.secret,
        privateKey: privateKey,
        csr: cleanCSR
      }
    };

  } catch (error: any) {
    console.error('ZATCA API Error:', error);
    return { success: false, error: error.message };
  }
}
