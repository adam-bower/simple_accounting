frappe.pages['accounting-home'].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Accounting Dashboard',
        single_column: true
    });

    // Add refresh button
    page.set_primary_action(__('Refresh'), () => {
        load_dashboard(page);
    }, 'refresh');

    // Store page reference
    wrapper.page = page;

    // Load dashboard data
    load_dashboard(page);
};

frappe.pages['accounting-home'].on_page_show = function(wrapper) {
    // Refresh data when page is shown
    if (wrapper.page) {
        load_dashboard(wrapper.page);
    }
};

function load_dashboard(page) {
    // Show loading
    page.main.html('<div class="accounting-loading"><i class="fa fa-spinner fa-spin fa-3x"></i><p>Loading dashboard...</p></div>');

    frappe.call({
        method: 'simple_accounting.simple_accounting.page.accounting_home.accounting_home.get_dashboard_data',
        callback: function(r) {
            if (r.message) {
                render_dashboard(page, r.message);
            }
        },
        error: function(err) {
            page.main.html('<div class="accounting-error"><i class="fa fa-exclamation-triangle fa-3x"></i><p>Error loading dashboard. Please refresh.</p></div>');
        }
    });
}

function render_dashboard(page, data) {
    let html = `
        <div class="accounting-dashboard">
            <!-- KPI Cards Row -->
            <div class="kpi-row">
                ${render_kpi_card('Cash Balance', format_currency(data.cash_balance), 'fa-university', 'blue')}
                ${render_kpi_card('Receivables', format_currency(data.receivables), 'fa-file-text-o', 'green')}
                ${render_kpi_card('Payables', format_currency(data.payables), 'fa-credit-card', 'orange')}
                ${render_kpi_card('Revenue (MTD)', format_currency(data.revenue), 'fa-line-chart', 'purple')}
            </div>

            <!-- Quick Actions Row -->
            <div class="quick-actions-section">
                <h3>Quick Actions</h3>
                <div class="quick-actions-row">
                    <button class="btn btn-primary quick-action-btn" onclick="frappe.new_doc('Sales Invoice')">
                        <i class="fa fa-plus"></i> New Invoice
                    </button>
                    <button class="btn btn-success quick-action-btn" onclick="frappe.new_doc('Payment Entry')">
                        <i class="fa fa-money"></i> Record Payment
                    </button>
                    <button class="btn btn-info quick-action-btn" onclick="frappe.new_doc('Journal Entry')">
                        <i class="fa fa-book"></i> Journal Entry
                    </button>
                    <button class="btn btn-default quick-action-btn" onclick="frappe.set_route('query-report', 'General Ledger')">
                        <i class="fa fa-list"></i> General Ledger
                    </button>
                </div>
            </div>

            <!-- Stats and Overdue Row -->
            <div class="stats-row">
                <div class="stats-card">
                    <h4>This Month</h4>
                    <div class="stat-item">
                        <span class="stat-label">Invoices Created</span>
                        <span class="stat-value">${data.quick_stats.invoices_this_month || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Payments Received</span>
                        <span class="stat-value">${data.quick_stats.payments_this_month || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Active Customers</span>
                        <span class="stat-value">${data.quick_stats.total_customers || 0}</span>
                    </div>
                </div>
                <div class="overdue-card ${data.overdue.count > 0 ? 'has-overdue' : ''}">
                    <h4>Overdue Invoices</h4>
                    <div class="overdue-count">${data.overdue.count}</div>
                    <div class="overdue-total">${format_currency(data.overdue.total)}</div>
                    ${data.overdue.count > 0 ? '<a href="/app/sales-invoice?status=Overdue" class="btn btn-sm btn-danger">View Overdue</a>' : '<span class="text-success">All caught up!</span>'}
                </div>
            </div>

            <!-- Recent Invoices -->
            <div class="recent-invoices-section">
                <h3>Recent Invoices</h3>
                <table class="table table-bordered table-hover">
                    <thead>
                        <tr>
                            <th>Invoice</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th class="text-right">Total</th>
                            <th class="text-right">Outstanding</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${render_invoices_rows(data.recent_invoices)}
                    </tbody>
                </table>
                <a href="/app/sales-invoice" class="btn btn-default">View All Invoices</a>
            </div>
        </div>
    `;

    page.main.html(html);
}

function render_kpi_card(title, value, icon, color) {
    return `
        <div class="kpi-card kpi-${color}">
            <div class="kpi-icon"><i class="fa ${icon}"></i></div>
            <div class="kpi-content">
                <div class="kpi-value">${value}</div>
                <div class="kpi-title">${title}</div>
            </div>
        </div>
    `;
}

function render_invoices_rows(invoices) {
    if (!invoices || invoices.length === 0) {
        return '<tr><td colspan="6" class="text-center text-muted">No invoices found</td></tr>';
    }

    return invoices.map(inv => `
        <tr onclick="frappe.set_route('Form', 'Sales Invoice', '${inv.name}')" style="cursor: pointer;">
            <td><a href="/app/sales-invoice/${inv.name}">${inv.name}</a></td>
            <td>${inv.customer_name || ''}</td>
            <td>${frappe.datetime.str_to_user(inv.posting_date)}</td>
            <td class="text-right">${format_currency(inv.grand_total)}</td>
            <td class="text-right">${format_currency(inv.outstanding_amount)}</td>
            <td><span class="indicator-pill ${get_status_color(inv.status)}">${inv.status}</span></td>
        </tr>
    `).join('');
}

function format_currency(value) {
    // Use simple number formatting to avoid frappe.format recursion issues
    const num = parseFloat(value) || 0;
    return '$' + num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function get_status_color(status) {
    const colors = {
        'Paid': 'green',
        'Unpaid': 'orange',
        'Overdue': 'red',
        'Cancelled': 'gray',
        'Draft': 'gray',
        'Submitted': 'blue',
        'Partly Paid': 'yellow'
    };
    return colors[status] || 'gray';
}
