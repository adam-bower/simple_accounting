// Simple Accounting - Startup redirect to dashboard
$(document).on("startup", function() {
    var route = frappe.get_route_str();

    // Redirect from default home to accounting dashboard
    if (route === "home" || route === "" || route === "Workspaces" || route === "Workspaces/Home") {
        window.location.href = "/app/accounting-home";
    }
});
