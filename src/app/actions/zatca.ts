'use server';

import { generateZatcaCSR, OnboardingDetails } from '@/lib/zatca-onboarding';

export async function onboardZatcaAction(details: OnboardingDetails) {
  try {
    const result = await generateZatcaCSR(details);
    return { success: true, data: result };
  } catch (error: any) {
    console.error('ZATCA Onboarding Error:', error);
    return { success: false, error: error.message };
  }
}
