"use strict";

exports.handler = async (event) => {
  console.log("Event received:", JSON.stringify(event));
  return { ok: true };
};
