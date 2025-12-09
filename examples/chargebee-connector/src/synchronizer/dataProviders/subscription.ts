import _ from "lodash";
import {GetDataFn, PaginationConfig, SynchronizedSubscription} from "../../types/types.synchronizerData.js";
import {config} from "../../config.js";
import {createChargebeeApi, Subscription} from "../../api/chargebee.js";
import {centsToDollar, minToSec} from "../../utils/data.js";
import {logger} from "../../infra/logger.js";

const getSubscriptionName = ({
  subscription,
  plan,
}: {
  subscription: Subscription;
  plan?: Subscription.SubscriptionItem;
}) => {
  const defaultSubscriptionName = _.isEmpty(plan?.item_price_id) ? subscription.id : _.startCase(plan?.item_price_id);
  if (subscription.cf_workspace_name) {
    const fiberyNameRegex = /^(.+)\.fibery\..*$/;
    const match = subscription.cf_workspace_name.match(fiberyNameRegex);
    const workspaceName = match ? match[1] : subscription.cf_workspace_name;
    return `${workspaceName} - ${defaultSubscriptionName}`;
  }
  return defaultSubscriptionName;
};

const transform = ({
  site,
  subscription,
}: {
  site: string;
  subscription: Subscription;
}): Partial<SynchronizedSubscription> => {
  const plan = subscription.subscription_items?.filter((i) => i.item_type === "plan")[0];
  return {
    ...subscription,
    auto_collection: subscription.auto_collection === "on",
    ui_id: subscription.id,
    mrr: centsToDollar(subscription.mrr),
    name: getSubscriptionName({subscription, plan}),
    started_at: minToSec(subscription.started_at),
    cancelled_at: minToSec(subscription.cancelled_at),
    next_billing_at: minToSec(subscription.next_billing_at),
    current_term_start: minToSec(subscription.current_term_start),
    current_term_end: minToSec(subscription.current_term_end),
    quantity: plan?.quantity,
    coupon_ids: subscription.coupons?.map((c) => c.coupon_id).join(";") || "",
    plan: plan?.item_price_id,
    due_since: minToSec(subscription.due_since),
    total_dues: centsToDollar(subscription.total_dues),
    original_url: `https://${site}.chargebee.com/d/subscriptions/${subscription.id}`,
  };
};

export const getSubscriptions: GetDataFn<SynchronizedSubscription, PaginationConfig> = async ({
  account,
  lastSynchronizedAtMin,
  pagination,
}) => {
  const chargebeeApi = createChargebeeApi(account);
  logger.warn(`Ignoring lastSynchronizedAt for subscriptions: ${lastSynchronizedAtMin}`);
  const subscriptionResult = await chargebeeApi.getSubscriptions({
    limit: config.pageSize,
    offset: pagination?.offset,
    date_from: undefined,
  });

  return {
    items: subscriptionResult.list.map((s) => transform({site: account.site, subscription: s})),
    synchronizationType: _.isEmpty(lastSynchronizedAtMin) ? "full" : "delta",
    pagination: {
      hasNext: !_.isEmpty(subscriptionResult.next_offset),
      nextPageConfig: {offset: subscriptionResult.next_offset},
    },
  };
};
