"use strict";

exports.handler = async (event) => {
  return {
    isAuthorized: true,
    resolverContext: {
      userId: "default-user",
    },
    denyMessage: "",
  };
};
