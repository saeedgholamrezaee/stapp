frappe.provide("frappe");
frappe.provide("frappe.st_utils");

frappe.stmsg = function (msg) {
    console.log("📢 پیام از frappe:", msg);
};

frappe.st_utils = {
    say_hello(name) {
        console.log(`👋 سلام ${name}`);
    },
    show_alert(msg) {
        frappe.msgprint(msg);
    }
};

frappe.st_utils.greeting = function (name) {
    frappe.call({
        method: "education.customst.greeting",
        args: { name: name },
        callback: function (r) {
            if (r.message) {
                console.log("✅ پاسخ از سرور:", r.message);
                frappe.msgprint(r.message);
            } else {
                console.warn("⚠️ پاسخی از سرور دریافت نشد");
            }
        },
        error: function (err) {
            console.error("❌ خطا در تماس با سرور:", err);
        }
    });
};
