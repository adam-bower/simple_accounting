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

    // Listen for theme changes
    setup_theme_listener(page);
};

frappe.pages['accounting-home'].on_page_show = function(wrapper) {
    // Refresh data when page is shown
    if (wrapper.page) {
        load_dashboard(wrapper.page);
    }
};

// Theme detection and listener
function is_dark_mode() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
}

function setup_theme_listener(page) {
    // Watch for theme changes via MutationObserver
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'data-theme') {
                // Re-render dashboard when theme changes
                load_dashboard(page);
            }
        });
    });

    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
    });
}

// Get theme-aware colors
function get_theme_colors() {
    const isDark = is_dark_mode();
    return {
        cardBg: isDark ? '#1a1a1a' : '#ffffff',
        cardShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
        textPrimary: isDark ? '#f0f0f0' : '#333333',
        textSecondary: isDark ? '#999999' : '#666666',
        borderColor: isDark ? '#333333' : '#f0f0f0',
        tableHeaderBg: isDark ? '#252525' : '#f5f5f5',
        tableHoverBg: isDark ? '#252525' : '#f9f9f9',
        // KPI icon backgrounds (dark mode uses 20% opacity)
        kpiBlueIcon: isDark ? 'rgba(25, 118, 210, 0.2)' : '#e3f2fd',
        kpiGreenIcon: isDark ? 'rgba(46, 125, 50, 0.2)' : '#e8f5e9',
        kpiOrangeIcon: isDark ? 'rgba(245, 124, 0, 0.2)' : '#fff3e0',
        kpiPurpleIcon: isDark ? 'rgba(123, 31, 162, 0.2)' : '#f3e5f5',
        // Status pill backgrounds
        pillGreen: isDark ? 'rgba(46, 125, 50, 0.2)' : '#e8f5e9',
        pillOrange: isDark ? 'rgba(245, 124, 0, 0.2)' : '#fff3e0',
        pillRed: isDark ? 'rgba(211, 47, 47, 0.2)' : '#ffebee',
        pillBlue: isDark ? 'rgba(25, 118, 210, 0.2)' : '#e3f2fd',
        pillYellow: isDark ? 'rgba(249, 168, 37, 0.2)' : '#fffde7',
        pillGray: isDark ? 'rgba(117, 117, 117, 0.2)' : '#f5f5f5',
        // Status pill text colors
        pillGreenText: isDark ? '#66bb6a' : '#2e7d32',
        pillOrangeText: isDark ? '#ffa726' : '#f57c00',
        pillRedText: isDark ? '#ef5350' : '#d32f2f',
        pillBlueText: isDark ? '#42a5f5' : '#1976d2',
        pillYellowText: isDark ? '#ffee58' : '#f9a825',
        pillGrayText: isDark ? '#bdbdbd' : '#757575',
        // Overdue card
        overdueGoodBorder: isDark ? 'rgba(46, 125, 50, 0.3)' : '#e8f5e9',
        overdueBadBorder: isDark ? 'rgba(211, 47, 47, 0.3)' : '#ffebee'
    };
}

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
    const colors = get_theme_colors();
    const openInvoicesCount = data.open_invoices_count || 0;

    let html = `
        <div class="accounting-dashboard">
            <!-- KPI Cards Row -->
            <div class="kpi-row">
                ${render_kpi_card('Cash Balance', format_currency(data.cash_balance), 'fa-university', 'blue', null, colors)}
                ${render_kpi_card('Receivables', format_currency(data.receivables), 'fa-file-text-o', 'green', '/app/sales-invoice?status=Unpaid', colors)}
                ${render_kpi_card('Payables', format_currency(data.payables), 'fa-credit-card', 'orange', null, colors)}
                ${render_kpi_card('Revenue (MTD)', format_currency(data.revenue), 'fa-line-chart', 'purple', null, colors)}
            </div>

            <!-- Quick Actions Row -->
            <div class="quick-actions-section">
                <h3 style="color: ${colors.textPrimary};">Quick Actions</h3>
                <div class="quick-actions-row">
                    <button class="btn btn-primary quick-action-btn" onclick="frappe.new_doc('Sales Invoice')">
                        <i class="fa fa-plus"></i> New Invoice
                    </button>
                    <button class="btn btn-success quick-action-btn" onclick="frappe.new_doc('Payment Entry')">
                        <i class="fa fa-money"></i> Record Payment
                    </button>
                    <button class="btn btn-warning quick-action-btn" onclick="frappe.set_route('List', 'Sales Invoice', {status: 'Unpaid'})">
                        <i class="fa fa-clock-o"></i> Open Invoices ${openInvoicesCount > 0 ? '<span class="badge">' + openInvoicesCount + '</span>' : ''}
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
                ${render_stats_card(data.quick_stats, colors)}
                ${render_overdue_card(data.overdue, colors)}
            </div>

            <!-- Recent Invoices -->
            <div class="recent-invoices-section" style="background: ${colors.cardBg}; box-shadow: ${colors.cardShadow};">
                <div class="section-header">
                    <h3 style="color: ${colors.textPrimary};">Recent Invoices</h3>
                    <a href="/app/sales-invoice?status=Unpaid" class="btn btn-sm btn-outline-warning">View Open Invoices</a>
                </div>
                <table class="accounting-table">
                    <thead>
                        <tr style="background: ${colors.tableHeaderBg};">
                            <th style="color: ${colors.textSecondary};">Invoice</th>
                            <th style="color: ${colors.textSecondary};">Customer</th>
                            <th style="color: ${colors.textSecondary};">Date</th>
                            <th class="text-right" style="color: ${colors.textSecondary};">Total</th>
                            <th class="text-right" style="color: ${colors.textSecondary};">Outstanding</th>
                            <th style="color: ${colors.textSecondary};">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${render_invoices_rows(data.recent_invoices, colors)}
                    </tbody>
                </table>
                <a href="/app/sales-invoice" class="btn btn-default">View All Invoices</a>
            </div>
        </div>
    `;

    page.main.html(html);
}

function render_kpi_card(title, value, icon, color, link, colors) {
    const clickAttr = link ? `onclick="frappe.set_route('${link}')" style="cursor: pointer;"` : '';

    // Get the appropriate icon background based on color
    let iconBg;
    switch(color) {
        case 'blue': iconBg = colors.kpiBlueIcon; break;
        case 'green': iconBg = colors.kpiGreenIcon; break;
        case 'orange': iconBg = colors.kpiOrangeIcon; break;
        case 'purple': iconBg = colors.kpiPurpleIcon; break;
        default: iconBg = colors.kpiBlueIcon;
    }

    const borderColors = {
        blue: '#1976d2',
        green: '#2e7d32',
        orange: '#f57c00',
        purple: '#7b1fa2'
    };

    const iconColors = {
        blue: '#1976d2',
        green: '#2e7d32',
        orange: '#f57c00',
        purple: '#7b1fa2'
    };

    return `
        <div class="kpi-card" ${clickAttr} style="background: ${colors.cardBg}; box-shadow: ${colors.cardShadow}; border-left: 4px solid ${borderColors[color]};">
            <div class="kpi-icon" style="background: ${iconBg}; color: ${iconColors[color]};"><i class="fa ${icon}"></i></div>
            <div class="kpi-content">
                <div class="kpi-value" style="color: ${colors.textPrimary};">${value}</div>
                <div class="kpi-title" style="color: ${colors.textSecondary};">${title}</div>
            </div>
        </div>
    `;
}

function render_stats_card(stats, colors) {
    return `
        <div class="stats-card" style="background: ${colors.cardBg}; box-shadow: ${colors.cardShadow};">
            <h4 style="color: ${colors.textSecondary};">This Month</h4>
            <div class="stat-item" style="border-bottom-color: ${colors.borderColor};">
                <span class="stat-label" style="color: ${colors.textSecondary};">Invoices Created</span>
                <span class="stat-value" style="color: ${colors.textPrimary};">${stats.invoices_this_month || 0}</span>
            </div>
            <div class="stat-item" style="border-bottom-color: ${colors.borderColor};">
                <span class="stat-label" style="color: ${colors.textSecondary};">Payments Received</span>
                <span class="stat-value" style="color: ${colors.textPrimary};">${stats.payments_this_month || 0}</span>
            </div>
            <div class="stat-item" style="border-bottom: none;">
                <span class="stat-label" style="color: ${colors.textSecondary};">Active Customers</span>
                <span class="stat-value" style="color: ${colors.textPrimary};">${stats.total_customers || 0}</span>
            </div>
        </div>
    `;
}

function render_overdue_card(overdue, colors) {
    const hasOverdue = overdue.count > 0;
    const borderColor = hasOverdue ? colors.overdueBadBorder : colors.overdueGoodBorder;
    const countColor = hasOverdue ? '#d32f2f' : '#2e7d32';

    return `
        <div class="overdue-card" style="background: ${colors.cardBg}; box-shadow: ${colors.cardShadow}; border: 2px solid ${borderColor};">
            <h4 style="color: ${colors.textSecondary};">Overdue Invoices</h4>
            <div class="overdue-count" style="color: ${countColor};">${overdue.count}</div>
            <div class="overdue-total" style="color: ${colors.textSecondary};">${format_currency(overdue.total)}</div>
            ${hasOverdue
                ? '<a href="/app/sales-invoice?status=Overdue" class="btn btn-sm btn-danger">View Overdue</a>'
                : '<span class="text-success">All caught up!</span>'}
        </div>
    `;
}

function render_invoices_rows(invoices, colors) {
    if (!invoices || invoices.length === 0) {
        return `<tr><td colspan="6" class="text-center text-muted" style="color: ${colors.textSecondary};">No invoices found</td></tr>`;
    }

    return invoices.map(inv => {
        const statusStyle = get_status_style(inv.status, colors);
        return `
            <tr onclick="frappe.set_route('Form', 'Sales Invoice', '${inv.name}')" style="cursor: pointer;">
                <td style="color: ${colors.textPrimary}; border-bottom-color: ${colors.borderColor};"><a href="/app/sales-invoice/${inv.name}">${inv.name}</a></td>
                <td style="color: ${colors.textPrimary}; border-bottom-color: ${colors.borderColor};">${inv.customer_name || ''}</td>
                <td style="color: ${colors.textPrimary}; border-bottom-color: ${colors.borderColor};">${frappe.datetime.str_to_user(inv.posting_date)}</td>
                <td class="text-right" style="color: ${colors.textPrimary}; border-bottom-color: ${colors.borderColor};">${format_currency(inv.grand_total)}</td>
                <td class="text-right" style="color: ${colors.textPrimary}; border-bottom-color: ${colors.borderColor};">${format_currency(inv.outstanding_amount)}</td>
                <td style="border-bottom-color: ${colors.borderColor};"><span class="indicator-pill" style="${statusStyle}">${inv.status}</span></td>
            </tr>
        `;
    }).join('');
}

function get_status_style(status, colors) {
    const styles = {
        'Paid': `background: ${colors.pillGreen}; color: ${colors.pillGreenText};`,
        'Unpaid': `background: ${colors.pillOrange}; color: ${colors.pillOrangeText};`,
        'Overdue': `background: ${colors.pillRed}; color: ${colors.pillRedText};`,
        'Cancelled': `background: ${colors.pillGray}; color: ${colors.pillGrayText};`,
        'Draft': `background: ${colors.pillGray}; color: ${colors.pillGrayText};`,
        'Submitted': `background: ${colors.pillBlue}; color: ${colors.pillBlueText};`,
        'Partly Paid': `background: ${colors.pillYellow}; color: ${colors.pillYellowText};`
    };
    return styles[status] || `background: ${colors.pillGray}; color: ${colors.pillGrayText};`;
}

function format_currency(value) {
    // Use simple number formatting to avoid frappe.format recursion issues
    const num = parseFloat(value) || 0;
    return '$' + num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}
