import {getStore} from "@netlify/blobs";
import {createBroker} from "../lib/broker.mjs";

export default async request => createBroker(
  getStore({name: "iota-inference-v1", consistency: "strong"}), process.env)(request);

export const config = {path: "/iota/api/*"};
