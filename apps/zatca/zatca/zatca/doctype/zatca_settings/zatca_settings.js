frappe.ui.form.on('ZATCA Settings', {
    refresh: function(frm) {
        if (frm.doc.status === 'Onboarded') {
            frm.set_intro(__("System is successfully onboarded with ZATCA."), "blue");
        } else if (frm.doc.status === 'Compliance Passed') {
            frm.set_intro(__("Compliance checks passed. Waiting for production certificate."), "orange");
        }
    },
    
    generate_csr_btn: function(frm) {
        frappe.call({
            method: 'generate_keys_and_csr',
            doc: frm.doc,
            callback: function(r) {
                if (!r.exc) {
                    frappe.msgprint(__("Private Key and CSR generated. Keep the Private Key secure."));
                    frm.refresh();
                }
            }
        });
    },
    
    onboard_btn: function(frm) {
        if (!frm.doc.otp) {
            frappe.msgprint(__("Please enter the ZATCA OTP."));
            return;
        }
        
        frappe.confirm(__("Start ZATCA onboarding process?"), () => {
            frm.call({
                method: 'onboard_with_zatca',
                doc: frm.doc,
                callback: function(r) {
                    if (!r.exc) {
                        frappe.msgprint(__("Onboarding process complete."));
                        frm.refresh();
                    }
                }
            });
        });
    }
});
