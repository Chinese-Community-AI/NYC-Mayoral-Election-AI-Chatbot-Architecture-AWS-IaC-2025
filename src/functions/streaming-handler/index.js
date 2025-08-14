"use strict";

exports.handler = async (event) => {
  console.log("Streaming event:", JSON.stringify(event));
  return { ok: true };
};
