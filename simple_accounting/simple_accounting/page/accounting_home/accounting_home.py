import frappe
from frappe import _
from frappe.utils import flt, getdate, nowdate, get_first_day, get_last_day, add_months


@frappe.whitelist()
def get_dashboard_data():
    """Main API endpoint that returns all dashboard data"""
    return {
        "cash_balance": get_cash_balance(),
        "receivables": get_outstanding_receivables(),
        "payables": get_outstanding_payables(),
        "revenue": get_revenue_this_month(),
        "recent_invoices": get_recent_invoices(),
        "overdue": get_overdue_invoices(),
        "quick_stats": get_quick_stats(),
        "open_invoices_count": get_open_invoices_count()
    }


def get_open_invoices_count():
    """Get count of unpaid/open invoices"""
    count = frappe.db.count("Sales Invoice", {
        "docstatus": 1,
        "outstanding_amount": [">", 0]
    })
    return count


def get_cash_balance():
    """Get total balance from bank and cash accounts"""
    balance = frappe.db.sql("""
        SELECT COALESCE(SUM(debit) - SUM(credit), 0) as balance
        FROM `tabGL Entry`
        WHERE account IN (
            SELECT name FROM `tabAccount` 
            WHERE account_type IN ('Bank', 'Cash')
            AND is_group = 0
        )
        AND is_cancelled = 0
    """, as_dict=True)
    
    return flt(balance[0].balance if balance else 0, 2)


def get_outstanding_receivables():
    """Get total outstanding receivables from unpaid sales invoices"""
    receivables = frappe.db.sql("""
        SELECT COALESCE(SUM(outstanding_amount), 0) as total
        FROM `tabSales Invoice`
        WHERE docstatus = 1
        AND outstanding_amount > 0
    """, as_dict=True)
    
    return flt(receivables[0].total if receivables else 0, 2)


def get_outstanding_payables():
    """Get total outstanding payables from unpaid purchase invoices"""
    payables = frappe.db.sql("""
        SELECT COALESCE(SUM(outstanding_amount), 0) as total
        FROM `tabPurchase Invoice`
        WHERE docstatus = 1
        AND outstanding_amount > 0
    """, as_dict=True)
    
    return flt(payables[0].total if payables else 0, 2)


def get_revenue_this_month():
    """Get revenue for the current month"""
    today = getdate(nowdate())
    first_day = get_first_day(today)
    last_day = get_last_day(today)
    
    revenue = frappe.db.sql("""
        SELECT COALESCE(SUM(grand_total), 0) as total
        FROM `tabSales Invoice`
        WHERE docstatus = 1
        AND posting_date BETWEEN %s AND %s
    """, (first_day, last_day), as_dict=True)
    
    return flt(revenue[0].total if revenue else 0, 2)


def get_recent_invoices(limit=5):
    """Get recent sales invoices"""
    invoices = frappe.db.sql("""
        SELECT 
            name,
            customer_name,
            posting_date,
            grand_total,
            outstanding_amount,
            status
        FROM `tabSales Invoice`
        WHERE docstatus = 1
        ORDER BY posting_date DESC, creation DESC
        LIMIT %s
    """, (limit,), as_dict=True)
    
    return invoices


def get_overdue_invoices():
    """Get count and total of overdue invoices"""
    today = nowdate()
    
    overdue = frappe.db.sql("""
        SELECT 
            COUNT(*) as count,
            COALESCE(SUM(outstanding_amount), 0) as total
        FROM `tabSales Invoice`
        WHERE docstatus = 1
        AND outstanding_amount > 0
        AND due_date < %s
    """, (today,), as_dict=True)
    
    return {
        "count": overdue[0].count if overdue else 0,
        "total": flt(overdue[0].total if overdue else 0, 2)
    }


def get_quick_stats():
    """Get quick statistics for the dashboard"""
    today = getdate(nowdate())
    first_day = get_first_day(today)
    last_day = get_last_day(today)
    
    # Invoices this month
    invoices_count = frappe.db.count("Sales Invoice", {
        "docstatus": 1,
        "posting_date": ["between", [first_day, last_day]]
    })
    
    # Payments this month
    payments_count = frappe.db.count("Payment Entry", {
        "docstatus": 1,
        "posting_date": ["between", [first_day, last_day]]
    })
    
    # Total customers
    customers_count = frappe.db.count("Customer", {"disabled": 0})
    
    return {
        "invoices_this_month": invoices_count,
        "payments_this_month": payments_count,
        "total_customers": customers_count
    }
