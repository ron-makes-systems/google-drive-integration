import _ from "lodash";
import {GetDataFn, PaginationConfig, SynchronizedCoupon} from "../../types/types.synchronizerData.js";
import {config} from "../../config.js";
import {createChargebeeApi, Coupon} from "../../api/chargebee.js";
import {centsToDollar, minToSec} from "../../utils/data.js";

const transform = ({site, coupon}: {site: string; coupon: Coupon}): Partial<SynchronizedCoupon> => {
  return {
    ...coupon,
    name: coupon.name,
    discount_type: _.startCase(coupon.discount_type),
    discount_percentage: centsToDollar(coupon.discount_percentage),
    duration_type: _.startCase(coupon.duration_type),
    discount_amount: centsToDollar(coupon.discount_amount),
    valid_till: minToSec(coupon.valid_till),
    status: _.startCase(coupon.status),
    apply_on: _.startCase(coupon.apply_on),
    created_at: minToSec(coupon.created_at),
    archived_at: minToSec(coupon.archived_at),
    updated_at: minToSec(coupon.updated_at),
    period_unit: _.startCase(coupon.period_unit),
    original_url: `https://${site}.chargebee.com/d/coupons/${encodeURIComponent(coupon.id)}`,
  };
};

export const getCoupons: GetDataFn<SynchronizedCoupon, PaginationConfig> = async ({
  account,
  lastSynchronizedAtMin,
  pagination,
}) => {
  const chargebeeApi = createChargebeeApi(account);
  const couponResult = await chargebeeApi.getCoupons({
    limit: config.pageSize,
    offset: pagination?.offset,
    date_from: lastSynchronizedAtMin,
  });

  return {
    items: couponResult.list.map((c) => transform({site: account.site, coupon: c})),
    synchronizationType: _.isEmpty(lastSynchronizedAtMin) ? "full" : "delta",
    pagination: {
      hasNext: !_.isEmpty(couponResult.next_offset),
      nextPageConfig: {offset: couponResult.next_offset},
    },
  };
};
