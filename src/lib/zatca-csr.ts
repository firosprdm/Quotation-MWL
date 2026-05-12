import forge from 'node-forge';

export interface CompanyDetails {
  vatNumber: string; // E.g., 311111111111113
  companyName: string;
  branchName: string;
  egsSerialNumber: string; // E.g., 1-TST|2-TST|3-ed22f1d8-e6a2-1118-9b58-d9a8f11e445f
  address: string;
  city: string;
  industry: string;
}

export function generateZatcaCSR(details: CompanyDetails) {
  // Generate secp256k1 keypair
  // @ts-ignore
  const keys = forge.pki.ecdsa.generateKeyPair(forge.pki.curves['secp256k1']);
  
  const csr = forge.pki.createCertificationRequest();
  csr.publicKey = keys.publicKey;

  const subject = [
    { shortName: 'CN', value: details.egsSerialNumber || `TST-${details.vatNumber}` },
    { shortName: 'O', value: details.companyName },
    { shortName: 'OU', value: details.branchName },
    { shortName: 'C', value: 'SA' },
    // ZATCA Custom OIDs
    { type: '2.5.4.17', value: '12211' }, // PostalCode (dummy or real)
    { type: '2.5.4.12', value: 'VAT Registration' }, // Title
    { type: '2.5.4.26', value: details.address }, // RegisteredAddress
    { type: '2.5.4.15', value: details.industry }, // BusinessCategory
    { type: '2.5.4.5', value: details.vatNumber }, // SN
    { type: '2.5.4.4', value: details.egsSerialNumber }, // Surname
  ];

  csr.setSubject(subject);

  // Sign CSR with private key
  csr.sign(keys.privateKey, forge.md.sha256.create());

  const pemCSR = forge.pki.certificationRequestToPem(csr);
  const pemPrivateKey = forge.pki.privateKeyToPem(keys.privateKey);

  // Return base64 encoded CSR for ZATCA API
  const base64CSR = Buffer.from(pemCSR).toString('base64');

  return {
    privateKey: pemPrivateKey,
    csr: pemCSR,
    base64CSR
  };
}
