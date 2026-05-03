const { generateZatcaCSR } = require('./src/lib/zatca-onboarding');

async function test() {
  try {
    const details = {
      vatNumber: '300000000000003',
      organizationName: 'MARINA WORLDLINK',
      egsSerialNumber: '1-MARINA|2-2026|3-EGS01',
      commonName: 'MARINA-EGS-UNIT-01',
      organizationUnit: '300000000000003',
      city: 'Riyadh',
      country: 'SA'
    };
    console.log('Generating CSR...');
    const result = await generateZatcaCSR(details);
    console.log('Success!');
    console.log('CSR length:', result.csr.length);
    console.log('Private Key length:', result.privateKey.length);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

test();
