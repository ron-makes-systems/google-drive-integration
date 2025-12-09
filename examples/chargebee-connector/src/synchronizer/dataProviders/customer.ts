import _ from "lodash";
import {GetDataFn, PaginationConfig, SynchronizedCustomer} from "../../types/types.synchronizerData.js";
import {config} from "../../config.js";
import {createChargebeeApi, Customer} from "../../api/chargebee.js";
import {centsToDollar, getCustomerName} from "../../utils/data.js";

const transform = ({site, customer}: {site: string; customer: Customer}): Partial<SynchronizedCustomer> => {
  return {
    ...customer,
    name: getCustomerName(customer.id, customer.first_name, customer.last_name, customer.email),
    auto_collection: customer.auto_collection === "on",
    unbilled_charges: centsToDollar(customer.unbilled_charges),
    offline_payment_method: _.startCase(customer.offline_payment_method),
    excess_payments: centsToDollar(customer.excess_payments),
    billing_email: customer.billing_address?.email,
    billing_company: customer.billing_address?.company,
    billing_phone: customer.billing_address?.phone,
    billing_address_line1: customer.billing_address?.line1,
    billing_address_line2: customer.billing_address?.line2,
    billing_address_line3: customer.billing_address?.line3,
    billing_city: customer.billing_address?.city,
    billing_state_code: customer.billing_address?.state_code,
    billing_state: customer.billing_address?.state,
    billing_country: customer.billing_address?.country,
    billing_zip: customer.billing_address?.zip,
    billing_validation_status: _.startCase(customer.billing_address?.validation_status),
    original_url: `https://${site}.chargebee.com/d/customers/${customer.id}`,
  };
};

export const getCustomers: GetDataFn<SynchronizedCustomer, PaginationConfig> = async ({
  account,
  lastSynchronizedAtMin,
  pagination,
}) => {
  const chargebeeApi = createChargebeeApi(account);
  const customerResult = await chargebeeApi.getCustomers({
    limit: config.pageSize,
    offset: pagination?.offset,
    date_from: lastSynchronizedAtMin,
  });

  return {
    items: customerResult.list.map((c) => transform({site: account.site, customer: c})),
    synchronizationType: _.isEmpty(lastSynchronizedAtMin) ? "full" : "delta",
    pagination: {
      hasNext: !_.isEmpty(customerResult.next_offset),
      nextPageConfig: {offset: customerResult.next_offset},
    },
  };
};
