import _ from "lodash";
import {GetDataFn, PaginationConfig, SynchronizedCouponCode} from "../../types/types.synchronizerData.js";
import {config} from "../../config.js";
import {createChargebeeApi, CouponCode} from "../../api/chargebee.js";

const transform = (coupon_code: CouponCode): Partial<SynchronizedCouponCode> => {
  return {
    ...coupon_code,
    id: `${coupon_code.coupon_id}-${coupon_code.code}`,
    name: coupon_code.code,
    status: _.startCase(coupon_code.status),
  };
};

export const getCouponCodes: GetDataFn<SynchronizedCouponCode, PaginationConfig> = async ({
  account,
  lastSynchronizedAtMin,
  pagination,
}) => {
  const chargebeeApi = createChargebeeApi(account);
  let couponIds = pagination?.coupon_ids;
  if (_.isEmpty(couponIds)) {
    couponIds = await chargebeeApi.getAllCouponIds({limit: config.pageSize, date_from: lastSynchronizedAtMin});
  }

  // if empty even after getAllCouponIds -> means nothing new to sync
  if (_.isEmpty(couponIds) || couponIds === "[]") {
    return {
      items: [],
      synchronizationType: _.isEmpty(lastSynchronizedAtMin) ? "full" : "delta",
      pagination: {
        hasNext: false,
      },
    };
  }

  const couponCodeResult = await chargebeeApi.getCouponCodes({
    limit: config.pageSize,
    offset: pagination?.offset,
    couponIds: couponIds,
  });

  return {
    items: couponCodeResult.list.map(transform),
    synchronizationType: _.isEmpty(lastSynchronizedAtMin) ? "full" : "delta",
    pagination: {
      hasNext: !_.isEmpty(couponCodeResult.next_offset),
      nextPageConfig: {offset: couponCodeResult.next_offset, coupon_ids: couponIds},
    },
  };
};
