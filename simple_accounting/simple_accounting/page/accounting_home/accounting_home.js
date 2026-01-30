frappe.pages['accounting-home'].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: '',
        single_column: true
    });

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
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'data-theme') {
                load_dashboard(page);
            }
        });
    });

    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
    });
}

// Get current month/year for display
function get_current_period() {
    const now = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return {
        month: months[now.getMonth()],
        year: now.getFullYear(),
        display: `${months[now.getMonth()]} ${now.getFullYear()}`
    };
}

// Get theme-aware colors
function get_theme_colors() {
    const isDark = is_dark_mode();
    return {
        // Main backgrounds
        pageBg: isDark ? '#0d0d0d' : '#f5f5f5',
        sidebarBg: isDark ? '#1a1a1a' : '#ffffff',
        cardBg: isDark ? '#1a1a1a' : '#ffffff',
        cardShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
        // Text colors
        textPrimary: isDark ? '#f0f0f0' : '#333333',
        textSecondary: isDark ? '#999999' : '#666666',
        textMuted: isDark ? '#666666' : '#999999',
        // Borders
        borderColor: isDark ? '#333333' : '#e0e0e0',
        borderLight: isDark ? '#2a2a2a' : '#f0f0f0',
        // Table
        tableHeaderBg: isDark ? '#252525' : '#f5f5f5',
        tableHoverBg: isDark ? '#252525' : '#f9f9f9',
        // Sidebar
        sidebarHover: isDark ? '#252525' : '#f5f5f5',
        sidebarActive: isDark ? '#2d4a3e' : '#e8f5e9',
        sidebarActiveText: isDark ? '#66bb6a' : '#2e7d32',
        // KPI icon backgrounds
        kpiBlueIcon: isDark ? 'rgba(25, 118, 210, 0.2)' : '#e3f2fd',
        kpiGreenIcon: isDark ? 'rgba(46, 125, 50, 0.2)' : '#e8f5e9',
        kpiOrangeIcon: isDark ? 'rgba(245, 124, 0, 0.2)' : '#fff3e0',
        kpiPurpleIcon: isDark ? 'rgba(123, 31, 162, 0.2)' : '#f3e5f5',
        kpiRedIcon: isDark ? 'rgba(211, 47, 47, 0.2)' : '#ffebee',
        // Status pills
        pillGreen: isDark ? 'rgba(46, 125, 50, 0.2)' : '#e8f5e9',
        pillOrange: isDark ? 'rgba(245, 124, 0, 0.2)' : '#fff3e0',
        pillRed: isDark ? 'rgba(211, 47, 47, 0.2)' : '#ffebee',
        pillBlue: isDark ? 'rgba(25, 118, 210, 0.2)' : '#e3f2fd',
        pillYellow: isDark ? 'rgba(249, 168, 37, 0.2)' : '#fffde7',
        pillGray: isDark ? 'rgba(117, 117, 117, 0.2)' : '#f5f5f5',
        pillGreenText: isDark ? '#66bb6a' : '#2e7d32',
        pillOrangeText: isDark ? '#ffa726' : '#f57c00',
        pillRedText: isDark ? '#ef5350' : '#d32f2f',
        pillBlueText: isDark ? '#42a5f5' : '#1976d2',
        pillYellowText: isDark ? '#ffee58' : '#f9a825',
        pillGrayText: isDark ? '#bdbdbd' : '#757575',
        // Overdue
        overdueGoodBorder: isDark ? 'rgba(46, 125, 50, 0.3)' : '#e8f5e9',
        overdueBadBorder: isDark ? 'rgba(211, 47, 47, 0.3)' : '#ffebee'
    };
}

function load_dashboard(page) {
    const colors = get_theme_colors();
    page.main.html(`<div class="accounting-loading" style="color: ${colors.textSecondary};"><i class="fa fa-spinner fa-spin fa-3x"></i><p>Loading dashboard...</p></div>`);

    frappe.call({
        method: 'simple_accounting.simple_accounting.page.accounting_home.accounting_home.get_dashboard_data',
        callback: function(r) {
            if (r.message) {
                render_dashboard(page, r.message);
            }
        },
        error: function(err) {
            page.main.html(`<div class="accounting-error" style="color: ${colors.textSecondary};"><i class="fa fa-exclamation-triangle fa-3x"></i><p>Error loading dashboard. Please refresh.</p></div>`);
        }
    });
}

function render_dashboard(page, data) {
    const colors = get_theme_colors();
    const period = get_current_period();
    const openInvoicesCount = data.open_invoices_count || 0;

    let html = `
        <div class="accounting-app" style="display: flex; min-height: calc(100vh - 60px); background: ${colors.pageBg};">
            <!-- Left Sidebar -->
            ${render_sidebar(colors)}

            <!-- Main Content -->
            <div class="accounting-main" style="flex: 1; padding: 24px; overflow-y: auto;">
                <!-- Header with period -->
                <div class="dashboard-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <div>
                        <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: ${colors.textPrimary};">Dashboard</h1>
                        <p style="margin: 4px 0 0 0; font-size: 14px; color: ${colors.textSecondary};">
                            <i class="fa fa-calendar-o" style="margin-right: 6px;"></i>${period.display}
                        </p>
                    </div>
                    <button class="btn btn-default btn-sm" onclick="frappe.pages['accounting-home'].on_page_show(cur_page.page)" style="border-radius: 6px;">
                        <i class="fa fa-refresh"></i> Refresh
                    </button>
                </div>

                <!-- KPI Cards Row -->
                <div class="kpi-row" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px;">
                    ${render_kpi_card('Cash Balance', format_currency(data.cash_balance), 'fa-university', 'blue', null, colors)}
                    ${render_kpi_card('Receivables', format_currency(data.receivables), 'fa-file-text-o', 'green', '/app/sales-invoice?status=Unpaid', colors)}
                    ${render_kpi_card('Payables', format_currency(data.payables), 'fa-credit-card', 'orange', '/app/purchase-invoice?status=Unpaid', colors)}
                    ${render_kpi_card('Revenue (MTD)', format_currency(data.revenue), 'fa-arrow-up', 'purple', null, colors)}
                    ${render_kpi_card('Expenses (MTD)', format_currency(data.expenses), 'fa-arrow-down', 'red', null, colors)}
                </div>

                <!-- Quick Actions Row -->
                <div style="margin-bottom: 24px;">
                    <h3 style="font-size: 14px; font-weight: 600; color: ${colors.textSecondary}; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Quick Actions</h3>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                        <button class="action-btn action-btn-primary" onclick="frappe.new_doc('Sales Invoice')">
                            <i class="fa fa-plus"></i> New Invoice
                        </button>
                        <button class="action-btn action-btn-success" onclick="frappe.new_doc('Payment Entry')">
                            <i class="fa fa-money"></i> Record Payment
                        </button>
                        <button class="action-btn action-btn-warning" onclick="frappe.set_route('List', 'Sales Invoice', {status: 'Unpaid'})">
                            <i class="fa fa-clock-o"></i> Open Invoices ${openInvoicesCount > 0 ? '<span class="action-badge">' + openInvoicesCount + '</span>' : ''}
                        </button>
                        <button class="action-btn action-btn-info" onclick="frappe.new_doc('Journal Entry')">
                            <i class="fa fa-book"></i> Journal Entry
                        </button>
                        <button class="action-btn action-btn-default" onclick="frappe.set_route('query-report', 'General Ledger')" style="background: ${colors.cardBg}; color: ${colors.textPrimary}; border: 1px solid ${colors.borderColor};">
                            <i class="fa fa-list"></i> General Ledger
                        </button>
                    </div>
                </div>

                <!-- Stats Row -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 24px;">
                    ${render_stats_card(data.quick_stats, colors, period)}
                    ${render_overdue_card(data.overdue, colors)}
                </div>

                <!-- Recent Invoices -->
                <div style="background: ${colors.cardBg}; border-radius: 12px; padding: 20px; box-shadow: ${colors.cardShadow};">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: ${colors.textPrimary};">Recent Invoices</h3>
                        <a href="/app/sales-invoice?status=Unpaid" class="action-btn action-btn-outline" style="padding: 6px 12px; font-size: 12px;">View Open Invoices</a>
                    </div>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: ${colors.tableHeaderBg};">
                                    <th style="padding: 12px 15px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: ${colors.textSecondary}; border-bottom: 2px solid ${colors.borderColor};">Invoice</th>
                                    <th style="padding: 12px 15px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: ${colors.textSecondary}; border-bottom: 2px solid ${colors.borderColor};">Customer</th>
                                    <th style="padding: 12px 15px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: ${colors.textSecondary}; border-bottom: 2px solid ${colors.borderColor};">Date</th>
                                    <th style="padding: 12px 15px; text-align: right; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: ${colors.textSecondary}; border-bottom: 2px solid ${colors.borderColor};">Total</th>
                                    <th style="padding: 12px 15px; text-align: right; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: ${colors.textSecondary}; border-bottom: 2px solid ${colors.borderColor};">Outstanding</th>
                                    <th style="padding: 12px 15px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: ${colors.textSecondary}; border-bottom: 2px solid ${colors.borderColor};">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${render_invoices_rows(data.recent_invoices, colors)}
                            </tbody>
                        </table>
                    </div>
                    <div style="margin-top: 16px;">
                        <a href="/app/sales-invoice" class="action-btn action-btn-default" style="background: ${colors.cardBg}; color: ${colors.textPrimary}; border: 1px solid ${colors.borderColor};">View All Invoices</a>
                    </div>
                </div>
            </div>
        </div>

        <style>
            .accounting-app .action-btn {
                padding: 10px 16px;
                font-size: 13px;
                font-weight: 500;
                border-radius: 8px;
                border: none;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                transition: all 0.2s ease;
                text-decoration: none;
            }
            .accounting-app .action-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            .accounting-app .action-btn-primary {
                background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
                color: white;
            }
            .accounting-app .action-btn-success {
                background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
                color: white;
            }
            .accounting-app .action-btn-warning {
                background: linear-gradient(135deg, #f57c00 0%, #ef6c00 100%);
                color: white;
            }
            .accounting-app .action-btn-info {
                background: linear-gradient(135deg, #0288d1 0%, #0277bd 100%);
                color: white;
            }
            .accounting-app .action-btn-danger {
                background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%);
                color: white;
            }
            .accounting-app .action-btn-default {
                background: transparent;
            }
            .accounting-app .action-btn-outline {
                background: transparent;
                border: 1px solid #f57c00;
                color: #f57c00;
            }
            .accounting-app .action-btn-outline:hover {
                background: #f57c00;
                color: white;
            }
            .accounting-app .action-badge {
                background: rgba(255,255,255,0.3);
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
            }
            .accounting-app .sidebar-item {
                display: flex;
                align-items: center;
                padding: 10px 16px;
                margin: 2px 8px;
                border-radius: 8px;
                color: ${colors.textSecondary};
                text-decoration: none;
                font-size: 14px;
                transition: all 0.15s ease;
                cursor: pointer;
            }
            .accounting-app .sidebar-item:hover {
                background: ${colors.sidebarHover};
                color: ${colors.textPrimary};
            }
            .accounting-app .sidebar-item.active {
                background: ${colors.sidebarActive};
                color: ${colors.sidebarActiveText};
                font-weight: 500;
            }
            .accounting-app .sidebar-item i {
                width: 20px;
                margin-right: 12px;
                text-align: center;
            }
            .accounting-app .sidebar-section {
                padding: 16px 16px 8px 16px;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: ${colors.textMuted};
            }
        </style>
    `;

    page.main.html(html);
}

function render_sidebar(colors) {
    return `
        <div class="accounting-sidebar" style="width: 240px; background: ${colors.sidebarBg}; border-right: 1px solid ${colors.borderColor}; padding: 16px 0; flex-shrink: 0;">
            <!-- Logo/Brand -->
            <div style="padding: 0 16px 16px 16px; border-bottom: 1px solid ${colors.borderColor}; margin-bottom: 8px;">
                <div style="font-size: 18px; font-weight: 700; color: ${colors.textPrimary};">
                    <i class="fa fa-calculator" style="color: #2e7d32; margin-right: 8px;"></i>Accounting
                </div>
            </div>

            <!-- Navigation -->
            <div class="sidebar-section">Overview</div>
            <a class="sidebar-item active" href="/app/accounting-home">
                <i class="fa fa-dashboard"></i> Dashboard
            </a>

            <div class="sidebar-section">Sales</div>
            <a class="sidebar-item" href="/app/sales-invoice">
                <i class="fa fa-file-text-o"></i> Invoices
            </a>
            <a class="sidebar-item" href="/app/customer">
                <i class="fa fa-users"></i> Customers
            </a>
            <a class="sidebar-item" href="/app/item">
                <i class="fa fa-cube"></i> Products & Services
            </a>

            <div class="sidebar-section">Expenses</div>
            <a class="sidebar-item" href="/app/bank-transaction">
                <i class="fa fa-download"></i> Bank Transactions
            </a>
            <a class="sidebar-item" href="/app/bank-reconciliation-tool">
                <i class="fa fa-check-square-o"></i> Reconciliation
            </a>
            <a class="sidebar-item" href="/app/purchase-invoice">
                <i class="fa fa-file-o"></i> Bills
            </a>
            <a class="sidebar-item" href="/app/supplier">
                <i class="fa fa-truck"></i> Vendors
            </a>

            <div class="sidebar-section">Banking</div>
            <a class="sidebar-item" href="/app/payment-entry">
                <i class="fa fa-money"></i> Payments
            </a>
            <a class="sidebar-item" href="/app/journal-entry">
                <i class="fa fa-book"></i> Journal Entries
            </a>
            <a class="sidebar-item" href="/app/account">
                <i class="fa fa-university"></i> Chart of Accounts
            </a>

            <div class="sidebar-section">Reports</div>
            <a class="sidebar-item" href="/app/query-report/Profit%20and%20Loss%20Statement">
                <i class="fa fa-line-chart"></i> Profit & Loss
            </a>
            <a class="sidebar-item" href="/app/query-report/Balance%20Sheet">
                <i class="fa fa-balance-scale"></i> Balance Sheet
            </a>
            <a class="sidebar-item" href="/app/query-report/General%20Ledger">
                <i class="fa fa-list-alt"></i> General Ledger
            </a>
            <a class="sidebar-item" href="/app/query-report/Accounts%20Receivable">
                <i class="fa fa-clock-o"></i> Accounts Receivable
            </a>
        </div>
    `;
}

function render_kpi_card(title, value, icon, color, link, colors) {
    const clickAttr = link ? `onclick="frappe.set_route('${link}')" style="cursor: pointer;"` : '';

    let iconBg;
    switch(color) {
        case 'blue': iconBg = colors.kpiBlueIcon; break;
        case 'green': iconBg = colors.kpiGreenIcon; break;
        case 'orange': iconBg = colors.kpiOrangeIcon; break;
        case 'purple': iconBg = colors.kpiPurpleIcon; break;
        case 'red': iconBg = colors.kpiRedIcon; break;
        default: iconBg = colors.kpiBlueIcon;
    }

    const borderColors = {
        blue: '#1976d2',
        green: '#2e7d32',
        orange: '#f57c00',
        purple: '#7b1fa2',
        red: '#d32f2f'
    };

    const iconColors = {
        blue: '#1976d2',
        green: '#2e7d32',
        orange: '#f57c00',
        purple: '#7b1fa2',
        red: '#d32f2f'
    };

    return `
        <div class="kpi-card" ${clickAttr} style="background: ${colors.cardBg}; box-shadow: ${colors.cardShadow}; border-radius: 12px; padding: 20px; display: flex; align-items: center; border-left: 4px solid ${borderColors[color]}; transition: transform 0.2s;">
            <div style="width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-right: 16px; background: ${iconBg}; color: ${iconColors[color]}; font-size: 20px;">
                <i class="fa ${icon}"></i>
            </div>
            <div>
                <div style="font-size: 22px; font-weight: 600; color: ${colors.textPrimary}; line-height: 1.2;">${value}</div>
                <div style="font-size: 13px; color: ${colors.textSecondary}; margin-top: 2px;">${title}</div>
            </div>
        </div>
    `;
}

function render_stats_card(stats, colors, period) {
    return `
        <div style="background: ${colors.cardBg}; border-radius: 12px; padding: 20px; box-shadow: ${colors.cardShadow};">
            <h4 style="font-size: 14px; font-weight: 600; color: ${colors.textSecondary}; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                ${period.month} ${period.year}
            </h4>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid ${colors.borderLight};">
                <span style="color: ${colors.textSecondary}; font-size: 14px;">Invoices Created</span>
                <span style="font-size: 18px; font-weight: 600; color: ${colors.textPrimary};">${stats.invoices_this_month || 0}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid ${colors.borderLight};">
                <span style="color: ${colors.textSecondary}; font-size: 14px;">Payments Received</span>
                <span style="font-size: 18px; font-weight: 600; color: ${colors.textPrimary};">${stats.payments_this_month || 0}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
                <span style="color: ${colors.textSecondary}; font-size: 14px;">Active Customers</span>
                <span style="font-size: 18px; font-weight: 600; color: ${colors.textPrimary};">${stats.total_customers || 0}</span>
            </div>
        </div>
    `;
}

function render_overdue_card(overdue, colors) {
    const hasOverdue = overdue.count > 0;
    const borderColor = hasOverdue ? colors.overdueBadBorder : colors.overdueGoodBorder;
    const countColor = hasOverdue ? '#d32f2f' : '#2e7d32';

    return `
        <div style="background: ${colors.cardBg}; border-radius: 12px; padding: 20px; box-shadow: ${colors.cardShadow}; border: 2px solid ${borderColor}; text-align: center;">
            <h4 style="font-size: 14px; font-weight: 600; color: ${colors.textSecondary}; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px;">Overdue Invoices</h4>
            <div style="font-size: 48px; font-weight: 700; color: ${countColor}; line-height: 1;">${overdue.count}</div>
            <div style="font-size: 16px; color: ${colors.textSecondary}; margin: 12px 0 16px 0;">${format_currency(overdue.total)}</div>
            ${hasOverdue
                ? '<a href="/app/sales-invoice?status=Overdue" class="action-btn action-btn-danger" style="padding: 8px 16px; font-size: 13px;">View Overdue</a>'
                : '<span style="color: #2e7d32; font-weight: 500;"><i class="fa fa-check-circle" style="margin-right: 6px;"></i>All caught up!</span>'}
        </div>
    `;
}

function render_invoices_rows(invoices, colors) {
    if (!invoices || invoices.length === 0) {
        return `<tr><td colspan="6" style="padding: 24px; text-align: center; color: ${colors.textSecondary};">No invoices found</td></tr>`;
    }

    return invoices.map(inv => {
        const statusStyle = get_status_style(inv.status, colors);
        return `
            <tr onclick="frappe.set_route('Form', 'Sales Invoice', '${inv.name}')" style="cursor: pointer; transition: background 0.15s;" onmouseover="this.style.background='${colors.tableHoverBg}'" onmouseout="this.style.background='transparent'">
                <td style="padding: 12px 15px; color: ${colors.textPrimary}; border-bottom: 1px solid ${colors.borderLight};"><a href="/app/sales-invoice/${inv.name}" style="color: var(--primary);">${inv.name}</a></td>
                <td style="padding: 12px 15px; color: ${colors.textPrimary}; border-bottom: 1px solid ${colors.borderLight};">${inv.customer_name || ''}</td>
                <td style="padding: 12px 15px; color: ${colors.textPrimary}; border-bottom: 1px solid ${colors.borderLight};">${frappe.datetime.str_to_user(inv.posting_date)}</td>
                <td style="padding: 12px 15px; color: ${colors.textPrimary}; border-bottom: 1px solid ${colors.borderLight}; text-align: right;">${format_currency(inv.grand_total)}</td>
                <td style="padding: 12px 15px; color: ${colors.textPrimary}; border-bottom: 1px solid ${colors.borderLight}; text-align: right;">${format_currency(inv.outstanding_amount)}</td>
                <td style="padding: 12px 15px; border-bottom: 1px solid ${colors.borderLight};"><span style="display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; ${statusStyle}">${inv.status}</span></td>
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
    const num = parseFloat(value) || 0;
    return '$' + num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}
