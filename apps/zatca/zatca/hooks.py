app_name = "zatca"
app_title = "Zatca"
app_publisher = "Antigravity"
app_description = "ZATCA Phase 2 Integration for Saudi Arabia"
app_email = "admin@antigravity.com"
app_license = "mit"

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
# app_include_css = "/assets/zatca/css/zatca.css"
# app_include_js = "/assets/zatca/js/zatca.js"

# include js, css files in header of web template
# web_include_css = "/assets/zatca/css/zatca.css"
# web_include_js = "/assets/zatca/js/zatca.js"

# include custom scss in every website theme (without file extension ".scss")
# website_theme_scss = "zatca/public/scss/website"

# include js, css files in header of web form
# webform_include_js = {"doctype": "public/js/doctype.js"}
# webform_include_css = {"doctype": "public/css/doctype.css"}

# include js in page
# page_js = {"page" : "public/js/file.js"}

# include js in doctype views
# doctype_js = {"doctype" : "public/js/doctype.js"}
# doctype_list_js = {"doctype" : "public/js/doctype_list.js"}
# doctype_tree_js = {"doctype" : "public/js/doctype_tree.js"}
# doctype_calendar_js = {"doctype" : "public/js/doctype_calendar.js"}

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
# role_home_page = {
# 	"Role": "home_page"
# }

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Jinja
# ----------

# add methods and filters to jinja environment
# jinja = {
# 	"methods": "zatca.utils.jinja_methods",
# 	"filters": "zatca.utils.jinja_filters"
# }

# Installation
# ------------

# before_install = "zatca.install.before_install"
# after_install = "zatca.install.after_install"

fixtures = [
    {"dt": "Custom Field", "filters": [["module", "=", "Zatca"]]},
    {"dt": "Property Setter", "filters": [["module", "=", "Zatca"]]}
]

# Uninstallation
# --------------

# before_uninstall = "zatca.uninstall.before_uninstall"
# after_uninstall = "zatca.uninstall.after_uninstall"

# Integration Setup
# ------------------
# To override standard methods of dtypes
# override_whitelisted_methods = {
# 	"frappe.core.doctype.file.file.download_file": "zatca.utils.file_access.download_file"
# }

# DocType Class
# ---------------
# Override standard doctype classes

# override_doctype_class = {
# 	"ToDo": "custom_app.overrides.CustomToDo"
# }
override_doctype_class = {
    "Sales Invoice": "zatca.zatca.overrides.sales_invoice.ZatcaSalesInvoice"
}

# Document Events
# ---------------
# Hook on document methods and events

# doc_events = {
# 	"*": {
# 		"on_update": "method",
# 		"on_cancel": "method",
# 		"on_trash": "method"
# 	}
# }

# Scheduled Tasks
# ---------------

# scheduler_events = {
# 	"all": [
# 		"zatca.tasks.all"
# 	],
# 	"daily": [
# 		"zatca.tasks.daily"
# 	],
# 	"hourly": [
# 		"zatca.tasks.hourly"
# 	],
# 	"weekly": [
# 		"zatca.tasks.weekly"
# 	],
# 	"monthly": [
# 		"zatca.tasks.monthly"
# 	],
# }

# Testing
# -------

# before_tests = "zatca.install.before_tests"

# Overriding Methods
# ------------------------------

# override_whitelisted_methods = {
# 	"frappe.desk.doctype.event.event.get_events": "zatca.event.get_events"
# }
#
# each overriding function accepts a `data` argument;
# generated from the base implementation of the doctype dashboard,
# along with any modifications made in other Frappe apps
# override_doctype_dashboards = {
# 	"Contact": "zatca.dashboard_fixtures.get_dashboard_contact"
# }

# exempt linked doctypes from being automatically cancelled
#
# auto_cancel_exempted_doctypes = ["Auto Repeat"]

# Ignore links to specified DocTypes when deleting documents
# -----------------------------------------------------------

# ignore_links_on_delete = ["Communication", "ToDo"]

# Request Events
# ----------------
# before_request = ["zatca.utils.before_request"]
# after_request = ["zatca.utils.after_request"]

# Job Events
# ----------
# before_job = ["zatca.utils.before_job"]
# after_job = ["zatca.utils.after_job"]

# User Data Protection
# --------------------

# user_data_fields = [
# 	{
# 		"doctype": "{doctype_1}",
# 		"filter_by": "{filter_field}",
# 		"redact_fields": ["{field_1}", "{field_2}"],
# 		"partial": 1,
# 	},
# 	{
# 		"doctype": "{doctype_2}",
# 		"filter_by": "{filter_field}",
# 		"partial": 1,
# 	},
# 	{
# 		"field_map": [
# 			{"from": "mail", "to": "email_address"}
# 		],
# 		"force_delete": [
# 			"Contact",
# 			"Address",
# 		],
# 	},
# ]

# Authentication and Authorization
# --------------------------------

# auth_hooks = [
# 	"zatca.auth.validate"
# ]

# Automatically update python controller files with type annotations for this app.
# export_python_type_annotations = True

# default_log_clearing_config = {
# 	"logging": 10000,
# }
