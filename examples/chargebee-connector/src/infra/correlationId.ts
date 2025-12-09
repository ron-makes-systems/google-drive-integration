import {createCorrelationId} from "@fibery/correlation-id";

const correlationId = createCorrelationId();

export const middleware = correlationId.expressMiddleware;
export const getCorrelationId = correlationId.correlator.getId;
export const enhanceGot = correlationId.enhanceGot;
