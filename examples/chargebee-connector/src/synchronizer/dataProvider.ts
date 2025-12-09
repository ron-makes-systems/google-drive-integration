import {logger} from "../infra/logger.js";
import {ValidationError} from "../errors/errors.js";
import {SynchronizerType} from "../types/types.synchronizerConfig.js";
import {GetDataFn, PaginationConfig, SynchronizerData} from "../types/types.synchronizerData.js";
import {VizydropAccount} from "../types/types.authentication.js";
import {getInvoices} from "./dataProviders/invoice.js";
import {getInvoiceLineItems} from "./dataProviders/invoiceLineItem.js";
import {getSubscriptions} from "./dataProviders/subscription.js";
import {getCustomers} from "./dataProviders/customer.js";
import {getTransactions} from "./dataProviders/transaction.js";
import {getPromotionalCredits} from "./dataProviders/promotionalCredit.js";
import {getCoupons} from "./dataProviders/coupon.js";
import {getCouponSets} from "./dataProviders/couponSet.js";
import {getCreditNotes} from "./dataProviders/creditNote.js";
import {SynchronizerDataFilter} from "../types/types.requests.js";
import {SecToMin} from "../utils/data.js";
import {getCouponCodes} from "./dataProviders/couponCode.js";
import {getSubscriptionPlans} from "./dataProviders/subscriptionPlan.js";
import {getComments} from "./dataProviders/comment.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dataProviders: Record<SynchronizerType, GetDataFn<unknown, any>> = {
  [SynchronizerType.Invoice]: getInvoices,
  [SynchronizerType.InvoiceLineItem]: getInvoiceLineItems,
  [SynchronizerType.CreditNote]: getCreditNotes,
  [SynchronizerType.Subscription]: getSubscriptions,
  [SynchronizerType.Customer]: getCustomers,
  [SynchronizerType.Transaction]: getTransactions,
  [SynchronizerType.PromotionalCredit]: getPromotionalCredits,
  [SynchronizerType.Coupon]: getCoupons,
  [SynchronizerType.CouponSet]: getCouponSets,
  [SynchronizerType.CouponCode]: getCouponCodes,
  [SynchronizerType.SubscriptionPlan]: getSubscriptionPlans,
  [SynchronizerType.Comment]: getComments,
};

export const getData = async ({
  account,
  requestedType,
  filter,
  versionNumber,
  lastSynchronizedAt,
  pagination,
}: {
  account: VizydropAccount;
  requestedType: SynchronizerType;
  filter?: Partial<SynchronizerDataFilter>;
  versionNumber: number;
  lastSynchronizedAt?: string;
  pagination?: PaginationConfig;
}): Promise<SynchronizerData<unknown>> => {
  const getDataForType = dataProviders[requestedType];
  if (!getDataForType) {
    throw new ValidationError(`invalid "requestedType" ${requestedType}`);
  }

  const lastSynchronizedAtMin = SecToMin(lastSynchronizedAt);

  const timer = logger.startTimer();
  logger.info(
    `start fetching data ${requestedType} with pagination ${JSON.stringify(
      pagination,
    )}. lastSynchronizedAt: ${lastSynchronizedAt}`,
  );
  try {
    const data = await getDataForType({
      account,
      filter,
      versionNumber,
      lastSynchronizedAtMin,
      pagination,
    });
    timer.done(
      `fetching of ${requestedType} has been completed with pagination ${JSON.stringify(pagination)}. fetched items: ${
        data.items.length
      }, sync type: ${data.synchronizationType}`,
    );
    return data;
  } catch (err) {
    timer.done(`fetching of ${requestedType} has been failed with pagination ${JSON.stringify(pagination)}.`, {
      err,
    });
    throw err;
  }
};
