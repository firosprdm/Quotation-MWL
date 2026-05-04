import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface OnboardingDetails {
  vatNumber: string;
  organizationName: string;
  egsSerialNumber: string;
  commonName: string;
  organizationUnit: string;
  city: string;
  country: string;
}

export async function generateZatcaCSR(details: OnboardingDetails) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zatca-'));
  const keyPath = path.join(tempDir, 'private_key.pem');
  const cnfPath = path.join(tempDir, 'csr_config.cnf');
  const csrPath = path.join(tempDir, 'request.csr');

  // Clear library paths to avoid symbol lookup errors on some systems
  const env = { 
    ...process.env, 
    LD_LIBRARY_PATH: '', 
    DYLD_LIBRARY_PATH: '',
    OPENSSL_CONF: '' // Sometimes this helps too
  };

  try {
    // 1. Generate secp256k1 private key
    execSync(`openssl ecparam -name secp256k1 -genkey -noout -out ${keyPath}`, { env });

    // 2. Create CSR configuration file with ZATCA OIDs
    const cnfContent = `
[req]
default_bits = 2048
emailAddress = info@marina.com
req_extensions = v3_req
prompt = no
default_md = sha256
distinguished_name = dn

[dn]
C = SA
OU = ${details.vatNumber}
O = ${details.organizationName}
CN = ${details.commonName}

[v3_req]
basicConstraints = CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment
subjectAltName = dirName:alt_names

[alt_names]
SN = ${details.egsSerialNumber}
UID = ${details.vatNumber}
title = 1100
registeredAddress = ${details.city}
businessCategory = ${details.organizationUnit}
`;

    fs.writeFileSync(cnfPath, cnfContent);

    // 3. Generate CSR
    execSync(`openssl req -new -sha256 -key ${keyPath} -config ${cnfPath} -out ${csrPath}`, { env });

    const privateKey = fs.readFileSync(keyPath, 'utf8');
    const csr = fs.readFileSync(csrPath, 'utf8');

    return { privateKey, csr };
  } finally {
    // Cleanup
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}
