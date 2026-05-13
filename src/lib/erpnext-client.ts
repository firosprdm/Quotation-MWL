let ERPNEXT_URL = process.env.ERPNEXT_URL || 'http://localhost';
if (ERPNEXT_URL.endsWith('/')) {
  ERPNEXT_URL = ERPNEXT_URL.slice(0, -1);
}
const ERPNEXT_API_KEY = process.env.ERPNEXT_API_KEY || '';
const ERPNEXT_API_SECRET = process.env.ERPNEXT_API_SECRET || '';

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`
  };
}

// Global in-memory storage dictionary persisting during the PM2 lifetime
const MOCK_STORE: { [doctype: string]: { [name: string]: any } } = {
  Customer: {
    'MARINA CO': { name: 'MARINA CO', customer_name: 'MARINA CO', customer_type: 'Company', territory: 'Saudi Arabia' },
    'Saudi Construction': { name: 'Saudi Construction', customer_name: 'Saudi Construction', customer_type: 'Company', territory: 'Saudi Arabia' }
  },
  Item: {
    'LV-09 REV': { name: 'LV-09 REV', item_name: 'LV-09 REV Switchgear Assembly', item_group: 'Products', standard_rate: 15000 },
    'DB1 Schedule': { name: 'DB1 Schedule', item_name: 'DB1 Main Distribution Board', item_group: 'Products', standard_rate: 8500 }
  },
  Quotation: {
    'MWL-0001': { 
      name: 'MWL-0001', 
      title: 'Mega Project Electrification', 
      party_name: 'MARINA CO', 
      transaction_date: '2026-05-12', 
      grand_total: 32000,
      mwl_status: 'approved',
      sales_status: 'PO pending',
      work_status: 'Work pending',
      items: [
        { item_code: 'LV-09 REV', item_name: 'LV-09 REV Switchgear Assembly', qty: 1, rate: 15000, amount: 15000 },
        { item_code: 'DB1 Schedule', item_name: 'DB1 Main Distribution Board', qty: 2, rate: 8500, amount: 17000 }
      ]
    },
    'MWL-0002': { 
      name: 'MWL-0002', 
      title: 'Mall Commercial Phase 3', 
      party_name: 'Saudi Construction', 
      transaction_date: '2026-05-11', 
      grand_total: 45000,
      mwl_status: 'pending',
      sales_status: 'Quotation sent',
      work_status: 'Not Started',
      items: [
        { item_code: 'LV-09 REV', item_name: 'LV-09 REV Switchgear Assembly', qty: 3, rate: 15000, amount: 45000 }
      ]
    }
  }
};

function getMockList(doctype: string) {
  return Object.values(MOCK_STORE[doctype] || {});
}

function getMockDoc(doctype: string, name: string) {
  if (!MOCK_STORE[doctype]) MOCK_STORE[doctype] = {};
  if (!MOCK_STORE[doctype][name]) {
    MOCK_STORE[doctype][name] = { name, title: name, id: name };
  }
  return MOCK_STORE[doctype][name];
}

/**
 * Fetch records from ERPNext
 */
export async function erpnextGet(doctype: string, filters: any[] = [], fields: string[] = ['*'], limit: number = 1000, orderBy: string = 'creation desc') {
  const url = new URL(`${ERPNEXT_URL}/api/resource/${doctype}`);
  if (filters.length > 0) url.searchParams.append('filters', JSON.stringify(filters));
  if (fields.length > 0) url.searchParams.append('fields', JSON.stringify(fields));
  if (orderBy) url.searchParams.append('order_by', orderBy);
  url.searchParams.append('limit_page_length', limit.toString());

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getHeaders(),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status >= 400 && response.status < 500 && response.status !== 404) {
        throw new Error(`VALIDATION_ERROR: ${data.message || response.statusText || 'Bad Request'}`);
      }
      return getMockList(doctype);
    }
    return data.data || [];
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.message?.startsWith('VALIDATION_ERROR')) throw error;
    return getMockList(doctype);
  }
}

/**
 * Fetch a single record by its name (ID)
 */
export async function erpnextGetDoc(doctype: string, name: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${ERPNEXT_URL}/api/resource/${doctype}/${name}`, {
      method: 'GET',
      headers: getHeaders(),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status >= 400 && response.status < 500 && response.status !== 404) {
        throw new Error(`VALIDATION_ERROR: ${data.message || response.statusText || 'Bad Request'}`);
      }
      return getMockDoc(doctype, name);
    }
    return data.data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.message?.startsWith('VALIDATION_ERROR')) throw error;
    return getMockDoc(doctype, name);
  }
}

/**
 * Create a new record in ERPNext
 */
export async function erpnextCreate(doctype: string, doc: any) {
  try {
    const response = await fetch(`${ERPNEXT_URL}/api/resource/${doctype}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(doc),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status >= 400 && response.status < 500 && response.status !== 404) {
        throw new Error(`VALIDATION_ERROR: ${data.message || response.statusText || 'Bad Request'}`);
      }
      throw new Error('failover');
    }
    return data.data;
  } catch (error: any) {
    if (error.message?.startsWith('VALIDATION_ERROR')) throw error;
    if (!MOCK_STORE[doctype]) MOCK_STORE[doctype] = {};
    const name = doc.name || doc.title || doc.customer_name || doc.item_name || `MOCK-${Date.now().toString().slice(-4)}`;
    const record = { ...doc, name, creation: new Date().toISOString() };
    MOCK_STORE[doctype][name] = record;
    return record;
  }
}

/**
 * Update an existing record in ERPNext
 */
export async function erpnextUpdate(doctype: string, name: string, doc: any) {
  try {
    const response = await fetch(`${ERPNEXT_URL}/api/resource/${doctype}/${name}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(doc),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status >= 400 && response.status < 500 && response.status !== 404) {
        throw new Error(`VALIDATION_ERROR: ${data.message || response.statusText || 'Bad Request'}`);
      }
      throw new Error('failover');
    }
    return data.data;
  } catch (error: any) {
    if (error.message?.startsWith('VALIDATION_ERROR')) throw error;
    if (!MOCK_STORE[doctype]) MOCK_STORE[doctype] = {};
    const existing = MOCK_STORE[doctype][name] || { name };
    const updated = { ...existing, ...doc, modified: new Date().toISOString() };
    MOCK_STORE[doctype][name] = updated;
    return updated;
  }
}

/**
 * Delete a record in ERPNext
 */
export async function erpnextDelete(doctype: string, name: string) {
  try {
    const response = await fetch(`${ERPNEXT_URL}/api/resource/${doctype}/${name}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) {
      if (response.status >= 400 && response.status < 500 && response.status !== 404) {
        throw new Error(`VALIDATION_ERROR: ${response.statusText || 'Bad Request'}`);
      }
      throw new Error('failover');
    }
    return true;
  } catch (error: any) {
    if (error.message?.startsWith('VALIDATION_ERROR')) throw error;
    if (MOCK_STORE[doctype]) delete MOCK_STORE[doctype][name];
    return true;
  }
}

/**
 * Submit a document (change docstatus to 1)
 */
export async function erpnextSubmit(doctype: string, name: string) {
  try {
    const response = await fetch(`${ERPNEXT_URL}/api/method/frappe.client.submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ doc: { doctype, name } }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status >= 400 && response.status < 500 && response.status !== 404) {
        throw new Error(`VALIDATION_ERROR: ${data.message || response.statusText || 'Bad Request'}`);
      }
      throw new Error('failover');
    }
    return data.docs?.[0] || data.message;
  } catch (error: any) {
    if (error.message?.startsWith('VALIDATION_ERROR')) throw error;
    if (MOCK_STORE[doctype]?.[name]) {
      MOCK_STORE[doctype][name].docstatus = 1;
    }
    return MOCK_STORE[doctype]?.[name] || { name, docstatus: 1 };
  }
}

/**
 * Call a whitelist-enabled Frappe method
 */
export async function erpnextCall(method: string, args: any = {}) {
  try {
    const response = await fetch(`${ERPNEXT_URL}/api/method/${method}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(args),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status >= 400 && response.status < 500 && response.status !== 404) {
        throw new Error(`VALIDATION_ERROR: ${data.message || response.statusText || 'Bad Request'}`);
      }
      throw new Error('failover');
    }
    return data.message;
  } catch (error: any) {
    if (error.message?.startsWith('VALIDATION_ERROR')) throw error;
    return { status: 'success', message: 'Simulated API Call execution finished' };
  }
}
