import _ from "lodash";
import {SynchronizerSchema, SynchronizerSchemaField} from "../types/types.synchronizerSchema.js";
import {customizableTypes, SynchronizerType} from "../types/types.synchronizerConfig.js";
import {VizydropAccount} from "../types/types.authentication.js";
import {ChargebeeApi, createChargebeeApi} from "../api/chargebee.js";

const schema: SynchronizerSchema = {
  [SynchronizerType.Invoice]: {
    id: {
      name: "Id",
      type: "id",
    },
    name: {
      name: "Name",
      type: "text",
    },
    po_number: {
      name: "Purchase Order Number",
      type: "text",
    },
    subscription_id: {
      name: "Subscription ID",
      type: "text",
      relation: {
        cardinality: "many-to-one",
        name: "Subscription",
        targetName: "Invoices",
        targetType: SynchronizerType.Subscription,
        targetFieldId: "id",
      },
    },
    customer_id: {
      name: "Customer ID",
      type: "text",
      relation: {
        cardinality: "many-to-one",
        name: "Customer",
        targetName: "Invoices",
        targetType: SynchronizerType.Customer,
        targetFieldId: "id",
      },
    },
    coupon_ids: {
      name: "Coupons",
      type: "text",
      relation: {
        cardinality: "many-to-many",
        name: "Coupons",
        targetName: "Invoices",
        targetType: SynchronizerType.Coupon,
        targetFieldId: "id",
      },
    },
    recurring: {
      name: "Recurring",
      type: "text",
      subType: "boolean",
    },
    status: {
      name: "Status",
      type: "text",
      subType: "single-select",
      options: [
        {
          name: "Pending",
        },
        {
          name: "Paid",
        },
        {
          name: "Voided",
        },
        {
          name: "Not Paid",
        },
        {
          name: "Posted",
        },
        {
          name: "Payment Due",
        },
      ],
    },
    vat_number: {
      name: "Vat Number",
      type: "text",
    },
    price_type: {
      name: "Price Type",
      type: "text",
      subType: "single-select",
      options: [
        {
          name: "Tax Exclusive",
        },
        {
          name: "Tax Inclusive",
        },
      ],
    },
    date: {
      name: "Invoice Date",
      type: "date",
    },
    due_date: {
      name: "Due Date",
      type: "date",
    },
    net_term_days: {
      name: "Days To Be Paid",
      type: "number",
      subType: "integer",
    },
    exchange_rate: {
      name: "Exchange Rate",
      type: "number",
    },
    currency_code: {
      name: "Currency Code",
      type: "text",
    },
    base_currency_code: {
      name: "Currency Code (Local)",
      type: "text",
    },
    total: {
      name: "Total",
      type: "number",
      format: {
        hasThousandSeparator: true,
        precision: 2,
      },
    },
    amount_paid: {
      name: "Amount Paid",
      type: "number",
      format: {
        hasThousandSeparator: true,
        precision: 2,
      },
    },
    amount_adjusted: {
      name: "Amount Adjusted",
      type: "number",
      format: {
        hasThousandSeparator: true,
        precision: 2,
      },
    },
    write_off_amount: {
      name: "Amount Written Off",
      type: "number",
      format: {
        hasThousandSeparator: true,
        precision: 2,
      },
    },
    credits_applied: {
      name: "Credits Applied",
      type: "number",
      format: {
        hasThousandSeparator: true,
        precision: 2,
      },
    },
    amount_due: {
      name: "Amount Due",
      type: "number",
      format: {
        hasThousandSeparator: true,
        precision: 2,
      },
    },
    paid_at: {
      name: "Paid At",
      type: "date",
    },
    next_retry_at: {
      name: "Next Retry Date",
      type: "date",
    },
    voided_at: {
      name: "Voided Date",
      type: "date",
    },
    updated_at: {
      name: "Updated At",
      type: "date",
    },
    sub_total: {
      name: "Sub Total",
      type: "number",
      format: {
        hasThousandSeparator: true,
        precision: 2,
      },
    },
    tax: {
      name: "Tax",
      type: "number",
      format: {
        hasThousandSeparator: true,
        precision: 2,
      },
    },
    first_invoice: {
      name: "First Invoice",
      type: "text",
      subType: "boolean",
    },
    term_finalized: {
      name: "Finalized",
      type: "text",
      subType: "boolean",
    },
    generated_at: {
      name: "Generated Date",
      type: "date",
    },
    expected_payment_date: {
      name: "Expected Payment Date",
      type: "date",
    },
    amount_to_collect: {
      name: "Amount To Collect",
      type: "number",
      format: {
        hasThousandSeparator: true,
        precision: 2,
      },
    },
    payment_owner: {
      name: "Payment Owner",
      type: "text",
    },
    void_reason_code: {
      name: "Void Reason Code",
      type: "text",
    },
    deleted: {
      name: "Deleted",
      type: "text",
      subType: "boolean",
    },
    channel: {
      name: "Channel",
      type: "text",
      subType: "single-select",
      options: [
        {
          name: "Web",
        },
        {
          name: "App Store",
        },
        {
          name: "Play Store",
        },
      ],
    },
    original_url: {
      name: "Original URL",
      type: "text",
      subType: "url",
    },
    pdf: {
      name: "PDF",
      type: "array[text]",
      subType: "file",
    },
  },
  [SynchronizerType.InvoiceLineItem]: {
    id: {
      name: "Id",
      type: "id",
    },
    name: {
      name: "Name",
      type: "text",
    },
    invoice_id: {
      name: "Invoice Id",
      type: "text",
      relation: {
        cardinality: "many-to-one",
        name: "Invoice",
        targetName: "Line Items",
        targetType: SynchronizerType.Invoice,
        targetFieldId: "id",
      },
    },
    plan: {
      name: " Subscription Plan",
      type: "text",
      relation: {
        cardinality: "many-to-one",
        name: "Subscription Plan",
        targetName: "Invoice Line Items",
        targetType: SynchronizerType.SubscriptionPlan,
        targetFieldId: "id",
      },
    },
    date_from: {
      name: "Date From",
      type: "date",
      subType: "day",
    },
    date_to: {
      name: "Date To",
      type: "date",
      subType: "day",
    },
    unit_amount: {
      name: "Unit Amount",
      type: "number",
      format: {
        hasThousandSeparator: true,
        precision: 2,
      },
    },
    quantity: {
      name: "Quantity",
      type: "number",
      subType: "integer",
    },
    amount: {
      name: "Total Amount",
      type: "number",
      format: {
        hasThousandSeparator: true,
        precision: 2,
      },
    },
    is_taxed: {
      name: "Taxed",
      type: "text",
      subType: "boolean",
    },
    tax_amount: {
      name: "Tax",
      type: "number",
      format: {
        hasThousandSeparator: true,
        precision: 2,
      },
    },
    discount_amount: {
      name: "Total Discount Amount",
      type: "number",
      format: {
        hasThousandSeparator: true,
        precision: 2,
      },
    },
    entity_type: {
      name: "Type",
      type: "text",
      subType: "single-select",
      options: [
        {
          name: "Adhoc",
        },
        {
          name: "Plan Item Price",
        },
        {
          name: "Addon Item Price",
        },
        {
          name: "Charge Item Price",
        },
      ],
    },
  },
  [SynchronizerType.CreditNote]: {
    id: {
      name: "Id",
      type: "id",
    },
    name: {
      name: "Name",
      type: "text",
    },
    subscription_id: {
      name: "Subscription Id",
      type: "text",
      relation: {
        cardinality: "many-to-one",
        name: "Subscription",
        targetName: "Credit Notes",
        targetType: SynchronizerType.Subscription,
        targetFieldId: "id",
      },
    },
    customer_id: {
      name: "Customer ID",
      type: "text",
      relation: {
        cardinality: "many-to-one",
        name: "Customer",
        targetName: "Credit Notes",
        targetType: SynchronizerType.Customer,
        targetFieldId: "id",
      },
    },
    reference_invoice_id: {
      name: "Invoice Id",
      type: "text",
      relation: {
        cardinality: "many-to-one",
        name: "Issued Against Invoice",
        targetName: "Credit Notes",
        targetType: SynchronizerType.Invoice,
        targetFieldId: "id",
      },
    },
    allocated_invoice_ids: {
      name: "Allocated Invoice Ids",
      type: "text",
      relation: {
        cardinality: "many-to-many",
        name: "Allocated to Invoices",
        targetName: "Credits",
        targetType: SynchronizerType.Invoice,
        targetFieldId: "id",
      },
    },
    type: {
      name: "Type",
      type: "text",
      subType: "single-select",
      options: [
        {
          name: "Adjustment",
        },
        {
          name: "Refundable",
        },
      ],
    },
    reason_code: {
      name: "Reason",
      type: "text",
      subType: "single-select",
      options: [
        {
          name: "Other",
        },
        {
          name: "Product Unsatisfactory",
        },
        {
          name: "Subscription Pause",
        },
        {
          name: "Order Cancellation",
        },
        {
          name: "Service Unsatisfactory",
        },
        {
          name: "Subscription Cancellation",
        },
        {
          name: "Chargeback",
        },
        {
          name: "Order Change",
        },
        {
          name: "Write Off",
        },
        {
          name: "Waiver",
        },
        {
          name: "Subscription Change",
        },
        {
          name: "Fraudulent",
        },
      ],
    },
    status: {
      name: "Status",
      type: "text",
      subType: "single-select",
      options: [
        {
          name: "Refund Due",
        },
        {
          name: "Adjusted",
        },
        {
          name: "Refunded",
        },
        {
          name: "Voided",
        },
      ],
    },
    vat: {
      name: "VAT",
      type: "number",
    },
    date: {
      name: "Date Issued",
      type: "date",
    },
    price_type: {
      name: "Price Type",
      type: "text",
      subType: "single-select",
      options: [
        {
          name: "Tax Exclusive",
        },
        {
          name: "Tax Inclusive",
        },
      ],
    },
    currency_code: {
      name: "Currency Code",
      type: "text",
    },
    total: {
      name: "Total",
      type: "number",
      format: {
        hasThousandSeparator: true,
        precision: 2,
      },
    },
    amount_allocated: {
      name: "Amount Allocated",
      type: "number",
      format: {
        hasThousandSeparator: true,
        precision: 2,
      },
    },
    amount_refunded: {
      name: "Amount Refunded",
      type: "number",
      format: {
        hasThousandSeparator: true,
        precision: 2,
      },
    },
    amount_available: {
      name: "Amount Available",
      type: "number",
      format: {
        hasThousandSeparator: true,
        precision: 2,
      },
    },
    fractional_correction: {
      name: "Fractional Correction",
      type: "number",
      format: {
        hasThousandSeparator: true,
        precision: 2,
      },
    },
    refunded_at: {
      name: "Refunded Date",
      type: "date",
    },
    voided_at: {
      name: "Voided Date",
      type: "date",
    },
    updated_at: {
      name: "Updated At",
      type: "date",
    },
    generated_at: {
      name: "Generated Date",
      type: "date",
    },
    channel: {
      name: "Channel",
      type: "text",
      subType: "single-select",
      options: [
        {
          name: "Web",
        },
        {
          name: "App Store",
        },
        {
          name: "Play Store",
        },
      ],
    },
    sub_total: {
      name: "Sub Total",
      type: "number",
      format: {
        hasThousandSeparator: true,
        precision: 2,
      },
    },
    base_currency_code: {
      name: "Currency Code (Local)",
      type: "text",
    },
    deleted: {
      name: "Deleted",
      type: "text",
      subType: "boolean",
    },
    exchange_rate: {
      name: "Exchange Rate",
      type: "number",
    },
    original_url: {
      name: "Original URL",
      type: "text",
      subType: "url",
    },
    pdf: {
      name: "PDF",
      type: "array[text]",
      subType: "file",
    },
  },
  [SynchronizerType.Subscription]: {
    id: {
      name: "Id",
      type: "id",
    },
    auto_collection: {
      name: "Auto Collection",
      type: "text",
      subType: "boolean",
    },
    ui_id: {
      name: "Subscription Id",
      type: "text",
    },
    name: {
      name: "Name",
      type: "text",
    },
    currency_code: {
      name: "Currency Code",
      type: "text",
    },
    started_at: {
      name: "Started Date",
      type: "date",
    },
    cancelled_at: {
      name: "Cancelled Date",
      type: "date",
    },
    cancel_reason: {
      name: "Cancel Reason",
      type: "text",
    },
    next_billing_at: {
      name: "Next Billing Date",
      type: "date",
    },
    current_term_start: {
      name: "Current Term Start",
      type: "date",
    },
    current_term_end: {
      name: "Current Term End",
      type: "date",
    },
    mrr: {
      name: "MRR",
      type: "number",
      format: {
        hasThousandSeparator: true,
        precision: 2,
      },
    },
    quantity: {
      name: "Users",
      type: "number",
      subType: "integer",
    },
    customer_id: {
      name: "Customer ID",
      type: "text",
      relation: {
        cardinality: "many-to-one",
        name: "Customer",
        targetName: "Subscriptions",
        targetType: SynchronizerType.Customer,
        targetFieldId: "id",
      },
    },
    coupon_ids: {
      name: "Coupons",
      type: "text",
      relation: {
        cardinality: "many-to-many",
        name: "Coupons",
        targetName: "Subscriptions",
        targetType: SynchronizerType.Coupon,
        targetFieldId: "id",
      },
    },
    plan: {
      name: " Subscription Plan",
      type: "text",
      relation: {
        cardinality: "many-to-one",
        name: "Subscription Plan",
        targetName: "Subscriptions",
        targetType: SynchronizerType.SubscriptionPlan,
        targetFieldId: "id",
      },
    },
    due_since: {
      name: "Due Since",
      type: "date",
      subType: "day",
    },
    total_dues: {
      name: "Total Due",
      type: "number",
    },
    original_url: {
      name: "Original URL",
      type: "text",
      subType: "url",
    },
  },
  [SynchronizerType.Customer]: {
    id: {
      name: "Id",
      type: "id",
    },
    name: {
      name: "Name",
      type: "text",
    },
    email: {
      name: "Email",
      type: "text",
      subType: "email",
    },
    phone: {
      name: "Phone",
      type: "text",
      format: {
        format: "phone",
      },
    },
    company: {
      name: "Company",
      type: "text",
    },
    vat_number: {
      name: "VAT ID",
      type: "text",
    },
    auto_collection: {
      name: "Auto Collection",
      type: "text",
      subType: "boolean",
    },
    unbilled_charges: {
      name: "Unbilled Charges",
      type: "number",
      format: {
        hasThousandSeparator: true,
        precision: 2,
      },
    },
    offline_payment_method: {
      name: "Offline Payment Method",
      type: "text",
      subType: "single-select",
      options: [
        {name: "No Preference"},
        {name: "Cash"},
        {name: "Check"},
        {name: "Bank Transfer"},
        {name: "Ach Credit"},
        {name: "Sepa Credit"},
        {name: "Boleto"},
        {name: "Us Automated Bank Transfer"},
        {name: "Eu Automated Bank Transfer"},
        {name: "Uk Automated Bank Transfer"},
        {name: "Jp Automated Bank Transfer"},
        {name: "Mx Automated Bank Transfer"},
        {name: "Custom"},
      ],
    },
    net_term_days: {
      name: "Net Term Days",
      type: "number",
      subType: "integer",
    },
    excess_payments: {
      name: "Excess Payments",
      type: "number",
      format: {
        hasThousandSeparator: true,
        precision: 2,
      },
    },
    billing_email: {
      name: "Billing Email",
      type: "text",
      subType: "email",
    },
    billing_company: {
      name: "Billing Company",
      type: "text",
    },
    billing_phone: {
      name: "Billing Phone",
      type: "text",
      format: {
        format: "phone",
      },
    },
    billing_address_line1: {
      name: "Billing Address Line 1",
      type: "text",
    },
    billing_address_line2: {
      name: "Billing Address Line 2",
      type: "text",
    },
    billing_address_line3: {
      name: "Billing Address Line 3",
      type: "text",
    },
    billing_city: {
      name: "Billing City",
      type: "text",
    },
    billing_state_code: {
      name: "Billing State Code",
      type: "text",
    },
    billing_state: {
      name: "State",
      type: "text",
    },
    billing_country: {
      name: "Billing Country",
      type: "text",
    },
    billing_zip: {
      name: "Billing Zip Code",
      type: "text",
    },
    billing_validation_status: {
      name: "Billing Validation Status",
      type: "text",
      subType: "single-select",
      options: [
        {
          name: "Not Validated",
        },
        {
          name: "Valid",
        },
        {
          name: "Partially Valid",
        },
        {
          name: "Invalid",
        },
      ],
    },
    original_url: {
      name: "Original URL",
      type: "text",
      subType: "url",
    },
  },
  [SynchronizerType.Transaction]: {
    id: {
      name: "Id",
      type: "id",
    },
    name: {
      name: "Name",
      type: "text",
    },
    payment_method: {
      name: "Payment Method",
      type: "text",
    },
    card_brand: {
      name: "Card Brand",
      type: "text",
    },
    amount: {
      name: "Amount",
      type: "number",
      format: {
        hasThousandSeparator: true,
        precision: 2,
      },
    },
    type: {
      name: "Type",
      type: "text",
      subType: "single-select",
      options: [
        {
          name: "Authorization",
        },
        {
          name: "Payment Reversal",
        },
        {
          name: "Payment",
        },
        {
          name: "Refund",
        },
      ],
    },
    gateway: {
      name: "Gateway",
      type: "text",
    },
    id_at_gateway: {
      name: "Gateway Transaction Id",
      type: "text",
    },
    customer_id: {
      name: "Customer Id",
      type: "text",
      relation: {
        cardinality: "many-to-one",
        name: "Customer",
        targetName: "Transactions",
        targetType: SynchronizerType.Customer,
        targetFieldId: "id",
      },
    },
    invoice_ids: {
      name: "Invoice Ids",
      type: "text",
      relation: {
        cardinality: "many-to-many",
        name: "Invoices",
        targetName: "Transactions",
        targetType: SynchronizerType.Invoice,
        targetFieldId: "id",
      },
    },
    credit_note_ids: {
      name: "Credit Note Ids",
      type: "text",
      relation: {
        cardinality: "many-to-many",
        name: "Refunded Credit Notes",
        targetName: "Transactions",
        targetType: SynchronizerType.CreditNote,
        targetFieldId: "id",
      },
    },
    original_url: {
      name: "Original URL",
      type: "text",
      subType: "url",
    },
  },
  [SynchronizerType.PromotionalCredit]: {
    id: {
      name: "Id",
      type: "id",
    },
    name: {
      name: "Name",
      type: "text",
    },
    amount: {
      name: "Amount",
      type: "number",
      format: {
        hasThousandSeparator: true,
        precision: 2,
      },
    },
    invoice_id: {
      name: "Invoice ID",
      type: "text",
      relation: {
        cardinality: "many-to-one",
        name: "Invoice",
        targetName: "Promotional Credits",
        targetType: SynchronizerType.Invoice,
        targetFieldId: "id",
      },
    },
    description: {
      name: "Description",
      type: "text",
      subType: "md",
    },
  },
  [SynchronizerType.Coupon]: {
    id: {
      name: "Id",
      type: "id",
    },
    name: {
      name: "Name",
      type: "text",
    },
    invoice_name: {
      name: "Invoice Display Name",
      type: "text",
    },
    discount_type: {
      name: "Discount Type",
      type: "text",
      subType: "single-select",
      options: [
        {
          name: "Fixed Amount",
        },
        {
          name: "Percentage",
        },
      ],
    },
    discount_percentage: {
      name: "Discount Percentage",
      type: "number",
      format: {
        format: "Percent",
        precision: 2,
      },
    },
    discount_amount: {
      name: "Discount Amount",
      type: "number",
      format: {
        hasThousandSeparator: true,
        precision: 2,
      },
    },
    currency_code: {
      name: "Currency Code",
      type: "text",
    },
    duration_type: {
      name: "Duration Type",
      type: "text",
      subType: "single-select",
      options: [
        {
          name: "Limited Period",
        },
        {
          name: "One Time",
        },
        {
          name: "Forever",
        },
      ],
    },
    valid_till: {
      name: "Valid Till",
      type: "date",
    },
    max_redemptions: {
      name: "Max Redemptions",
      type: "number",
      subType: "integer",
    },
    status: {
      name: "Status",
      type: "text",
      subType: "single-select",
      options: [
        {
          name: "Archived",
        },
        {
          name: "Expired",
        },
        {
          name: "Deleted",
        },
        {
          name: "Active",
        },
      ],
    },
    apply_on: {
      name: "Apply On",
      type: "text",
      subType: "single-select",
      options: [
        {
          name: "Invoice Amount",
        },
        {
          name: "Each Specified Item",
        },
      ],
    },
    created_at: {
      name: "Created At",
      type: "date",
    },
    archived_at: {
      name: "Archived At",
      type: "date",
    },
    updated_at: {
      name: "Updated At",
      type: "date",
    },
    period: {
      name: "Period",
      type: "number",
      subType: "integer",
    },
    period_unit: {
      name: "Period Unit",
      type: "text",
      subType: "single-select",
      options: [
        {
          name: "Day",
        },
        {
          name: "Week",
        },
        {
          name: "Month",
        },
        {
          name: "Year",
        },
      ],
    },
    redemptions: {
      name: "Redemptions Count",
      type: "number",
      subType: "integer",
    },
    invoice_notes: {
      name: "Invoice Notes",
      type: "text",
      subType: "md",
    },
    original_url: {
      name: "Original URL",
      type: "text",
      subType: "url",
    },
  },
  [SynchronizerType.CouponSet]: {
    id: {
      name: "Id",
      type: "id",
    },
    name: {
      name: "Name",
      type: "text",
    },
    coupon_id: {
      name: "Coupon ID",
      type: "text",
      relation: {
        cardinality: "many-to-one",
        name: "Coupon",
        targetName: "Coupon Sets",
        targetType: SynchronizerType.Coupon,
        targetFieldId: "id",
      },
    },
    total_count: {
      name: "Total Count",
      type: "number",
      subType: "integer",
    },
    redeemed_count: {
      name: "Redeemed Count",
      type: "number",
      subType: "integer",
    },
    archived_count: {
      name: "Archived Count",
      type: "number",
      subType: "integer",
    },
  },
  [SynchronizerType.CouponCode]: {
    id: {
      name: "Id",
      type: "id",
    },
    name: {
      name: "Name",
      type: "text",
    },
    status: {
      name: "Status",
      type: "text",
      subType: "single-select",
      options: [
        {
          name: "Not Redeemed",
        },
        {
          name: "Redeemed",
        },
        {
          name: "Archived",
        },
      ],
    },
    coupon_id: {
      name: "Coupon",
      type: "text",
      relation: {
        cardinality: "many-to-one",
        name: "Coupon",
        targetName: "Coupon Codes",
        targetType: SynchronizerType.Coupon,
        targetFieldId: "id",
      },
    },
    coupon_set_id: {
      name: "Coupon Set",
      type: "text",
      relation: {
        cardinality: "many-to-one",
        name: "Coupon Set",
        targetName: "Coupon Codes",
        targetType: SynchronizerType.CouponSet,
        targetFieldId: "id",
      },
    },
  },
  [SynchronizerType.SubscriptionPlan]: {
    id: {
      name: "Id",
      type: "id",
    },
    name: {
      name: "Name",
      type: "text",
    },
    period: {
      name: "Period",
      type: "number",
      subType: "integer",
    },
    period_unit: {
      name: "Period Unit",
      type: "text",
      subType: "single-select",
      options: [
        {
          name: "Day",
        },
        {
          name: "Week",
        },
        {
          name: "Month",
        },
        {
          name: "Year",
        },
      ],
    },
    price: {
      name: "Price",
      type: "number",
    },
    currency_code: {
      name: "Currency Code",
      type: "text",
    },
    pricing_model: {
      name: "Pricing Model",
      type: "text",
      subType: "single-select",
      options: [
        {
          name: "Flat Fee",
        },
        {
          name: "Per Unit",
        },
        {
          name: "Tiered",
        },
        {
          name: "Volume",
        },
        {
          name: "Stairstep",
        },
      ],
    },
    original_url: {
      name: "Original URL",
      type: "text",
      subType: "url",
    },
  },
  [SynchronizerType.Comment]: {
    id: {
      name: "Id",
      type: "id",
    },
    name: {
      name: "Name",
      type: "text",
    },
    notes: {
      name: "Comment",
      type: "text",
      subType: "md",
    },
    created_at: {
      name: "Created At",
      type: "date",
    },
    type: {
      name: "Type",
      type: "text",
      subType: "single-select",
      options: [
        {
          name: "System",
        },
        {
          name: "User",
        },
      ],
    },

    // keys of these fields MUST match Chargebee's Comment.EntityType values & our own SynchronizerType values
    subscription: {
      name: "Subscription",
      type: "text",
      relation: {
        cardinality: "many-to-one",
        name: "Subscription",
        targetName: "Comments",
        targetType: SynchronizerType.Subscription,
        targetFieldId: "id",
      },
    },
    invoice: {
      name: "Invoice",
      type: "text",
      relation: {
        cardinality: "many-to-one",
        name: "Invoice",
        targetName: "Comments",
        targetType: SynchronizerType.Invoice,
        targetFieldId: "id",
      },
    },
    credit_note: {
      name: "Credit Note",
      type: "text",
      relation: {
        cardinality: "many-to-one",
        name: "Credit Note",
        targetName: "Comments",
        targetType: SynchronizerType.CreditNote,
        targetFieldId: "id",
      },
    },
    coupon: {
      name: "Coupon",
      type: "text",
      relation: {
        cardinality: "many-to-one",
        name: "Coupon",
        targetName: "Comments",
        targetType: SynchronizerType.Coupon,
        targetFieldId: "id",
      },
    },
    customer: {
      name: "Customer",
      type: "text",
      relation: {
        cardinality: "many-to-one",
        name: "Customer",
        targetName: "Comments",
        targetType: SynchronizerType.Customer,
        targetFieldId: "id",
      },
    },
    transaction: {
      name: "Transaction",
      type: "text",
      relation: {
        cardinality: "many-to-one",
        name: "Transaction",
        targetName: "Comments",
        targetType: SynchronizerType.Transaction,
        targetFieldId: "id",
      },
    },
  },
};

const createFieldSchema = (fieldName: string): SynchronizerSchemaField => ({
  name: _.startCase(_.camelCase(fieldName.replace("cf_", ""))),
  type: "text",
});

const processType = async (type: SynchronizerType, chargebeeApi: ChargebeeApi) => {
  try {
    const typeSchema = schema[type];

    if (typeSchema) {
      if (customizableTypes.includes(type)) {
        const fields = await chargebeeApi.getCustomFieldsForType(type);
        for (const f of fields) {
          typeSchema[f] = createFieldSchema(f);
        }
      }
      return [type, typeSchema] as const;
    }
    return null;
  } catch (error) {
    console.error(`Error processing type ${type}:`, error);
    return null;
  }
};

const processTypes = async (types: Array<SynchronizerType>, chargebeeApi: ChargebeeApi) => {
  try {
    const result = await Promise.all(types.map(async (type) => processType(type, chargebeeApi)));

    return result.reduce((memo: SynchronizerSchema, result) => {
      if (result) {
        const [type, schema] = result;
        memo[type] = schema;
      }
      return memo;
    }, {});
  } catch (error) {
    console.error("Error processing types:", error);
    throw error;
  }
};

export const getSchema = async (
  types: Array<SynchronizerType>,
  account: VizydropAccount,
): Promise<SynchronizerSchema> => {
  const chargebeeApi = createChargebeeApi(account);

  return await processTypes(types, chargebeeApi);
};
