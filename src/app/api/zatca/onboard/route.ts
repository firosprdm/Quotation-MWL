import { NextResponse } from 'next/server';
import { EGS, EGSUnitInfo } from 'zatca-xml-ts';

export async function POST(req: Request) {
  try {
    const { otp, vatNumber, companyName, crNumber, city, district, street, building, postalZone } = await req.json();

    if (!otp || !vatNumber || !companyName) {
      return NextResponse.json({ success: false, error: 'Missing required fields (OTP, VAT Number, Company Name)' }, { status: 400 });
    }

    // Initialize EGS
    const egsInfo: EGSUnitInfo = {
      uuid: crypto.randomUUID(), // Unit UUID
      custom_id: `EGS-${vatNumber}`,
      model: 'AntigravityERP',
      CRN_number: crNumber || '1010000000',
      VAT_name: companyName,
      VAT_number: vatNumber,
      branch_name: 'Main Branch',
      branch_industry: 'Construction',
      location: {
        city: city || 'Riyadh',
        city_subdivision: district || 'Al Olaya',
        street: street || 'King Fahd Road',
        building: building || '1234',
        postal_zone: postalZone || '12211',
      }
    };

    // Use "development" for the Sandbox/Developer testing.
    const egs = new EGS(egsInfo, "development");

    console.log("Generating CSR and Private Key...");
    await egs.generateNewKeysAndCSR(false, 'AntigravityERP');

    console.log("Issuing Compliance Certificate...");
    const complianceRequestId = await egs.issueComplianceCertificate(otp);
    
    console.log("Issuing Production Certificate...");
    const productionRequestId = await egs.issueProductionCertificate(complianceRequestId);

    const updatedEgsInfo = egs.get();

    // In a real application, you'd save this to Supabase. 
    // We return it to the frontend so it can be saved to the settings table.
    return NextResponse.json({
      success: true,
      data: {
        privateKey: updatedEgsInfo.private_key,
        csr: updatedEgsInfo.csr,
        complianceCertificate: updatedEgsInfo.compliance_certificate,
        complianceApiSecret: updatedEgsInfo.compliance_api_secret,
        productionCertificate: updatedEgsInfo.production_certificate,
        productionApiSecret: updatedEgsInfo.production_api_secret,
      }
    });

  } catch (error: any) {
    console.error("ZATCA Onboarding Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Failed to onboard with ZATCA',
      details: error?.response?.data || String(error)
    }, { status: 500 });
  }
}
