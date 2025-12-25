import frappe

@frappe.whitelist(allow_guest=True)
def greeting(name):
        return f" Hi {name} "

