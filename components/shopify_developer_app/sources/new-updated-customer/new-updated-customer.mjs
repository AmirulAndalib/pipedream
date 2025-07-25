import common from "../common/webhook-metafields.mjs";

export default {
  ...common,
  key: "shopify_developer_app-new-updated-customer",
  name: "New Updated Customer (Instant)",
  type: "source",
  description: "Emit new event each time a customer's information is updated.",
  version: "0.0.11",
  dedupe: "unique",
  methods: {
    ...common.methods,
    getTopic() {
      return "CUSTOMERS_UPDATE";
    },
    generateMeta(resource) {
      const ts = Date.parse(resource.updated_at);
      return {
        id: ts,
        summary: `Customer Updated ${resource.id}`,
        ts,
      };
    },
  },
};
