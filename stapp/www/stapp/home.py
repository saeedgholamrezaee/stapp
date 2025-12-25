import json
import frappe

def get_context(context):
    context.no_cache = 1
    context.title = "STERP Home"

    user = getattr(frappe.session, "user", None)
    full_name = frappe.utils.get_fullname(user) if user else "مهمان"

    context.full_name = full_name

    context.app_ctx_json = json.dumps({
        "user": user,
        "full_name": full_name,
        "site_url": frappe.utils.get_url(),
        "route": "/stapp/home",
    }, ensure_ascii=False)
