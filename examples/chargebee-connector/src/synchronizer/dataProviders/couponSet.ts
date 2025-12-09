import _ from "lodash";
import {GetDataFn, PaginationConfig, SynchronizedCouponSet} from "../../types/types.synchronizerData.js";
import {config} from "../../config.js";
import {createChargebeeApi, CouponSet} from "../../api/chargebee.js";

const transform = (couponSet: CouponSet): Partial<SynchronizedCouponSet> => {
  return {
    ...couponSet,
    name: couponSet.name,
  };
};

export const getCouponSets: GetDataFn<SynchronizedCouponSet, PaginationConfig> = async ({
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

  const couponSetResult = await chargebeeApi.getCouponSets({
    limit: config.pageSize,
    offset: pagination?.offset,
    couponIds: couponIds,
  });

  return {
    items: couponSetResult.list.map(transform),
    synchronizationType: _.isEmpty(lastSynchronizedAtMin) ? "full" : "delta",
    pagination: {
      hasNext: !_.isEmpty(couponSetResult.next_offset),
      nextPageConfig: {offset: couponSetResult.next_offset, coupon_ids: couponIds},
    },
  };
};
