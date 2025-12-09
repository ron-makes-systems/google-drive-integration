import _ from "lodash";
import {GetDataFn, PaginationConfig, SynchronizedSubscriptionPlan} from "../../types/types.synchronizerData.js";
import {config} from "../../config.js";
import {createChargebeeApi, ItemPrice} from "../../api/chargebee.js";
import {centsToDollar} from "../../utils/data.js";

const transform = ({site, sub_plan}: {site: string; sub_plan: ItemPrice}): Partial<SynchronizedSubscriptionPlan> => {
  return {
    ...sub_plan,
    period_unit: _.startCase(sub_plan.period_unit),
    price: centsToDollar(sub_plan.price),
    pricing_model: _.startCase(sub_plan.pricing_model),
    original_url: `https://${site}.chargebee.com/d/plans/${sub_plan.item_id}`,
  };
};

export const getSubscriptionPlans: GetDataFn<SynchronizedSubscriptionPlan, PaginationConfig> = async ({
  account,
  lastSynchronizedAtMin,
  pagination,
}) => {
  const chargebeeApi = createChargebeeApi(account);
  const subscriptionPlanResult = await chargebeeApi.getSubscriptionPlans({
    limit: config.pageSize,
    offset: pagination?.offset,
    date_from: lastSynchronizedAtMin,
  });

  return {
    items: subscriptionPlanResult.list.map((sp) => transform({site: account.site, sub_plan: sp})),
    synchronizationType: _.isEmpty(lastSynchronizedAtMin) ? "full" : "delta",
    pagination: {
      hasNext: !_.isEmpty(subscriptionPlanResult.next_offset),
      nextPageConfig: {offset: subscriptionPlanResult.next_offset},
    },
  };
};
