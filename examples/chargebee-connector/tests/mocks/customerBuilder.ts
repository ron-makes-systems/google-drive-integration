import {Customer} from "chargebee";

let customerCounter = 0;

export const customerBuilder = (overrides: Partial<Customer> = {}): Customer => {
  customerCounter++;
  const id = overrides.id || `cust_${customerCounter}`;

  return {
    id,
    first_name: `First${customerCounter}`,
    last_name: `Last${customerCounter}`,
    email: `customer${customerCounter}@example.com`,
    phone: `+1555000${customerCounter.toString().padStart(4, "0")}`,
    company: `Company ${customerCounter}`,
    vat_number: `VAT${customerCounter}`,
    auto_collection: "on",
    unbilled_charges: 0,
    offline_payment_method: "no_preference",
    net_term_days: 30,
    excess_payments: 0,
    billing_address: {
      email: `billing${customerCounter}@example.com`,
      company: `Billing Company ${customerCounter}`,
      phone: `+1555111${customerCounter.toString().padStart(4, "0")}`,
      line1: `${customerCounter} Main St`,
      line2: `Suite ${customerCounter}`,
      line3: "",
      city: "San Francisco",
      state_code: "CA",
      state: "California",
      country: "US",
      zip: "94102",
      validation_status: "valid",
    },
    ...overrides,
  } as Customer;
};

export const resetCustomerCounter = () => {
  customerCounter = 0;
};
