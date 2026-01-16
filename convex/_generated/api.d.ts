/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as adminAccounts from "../adminAccounts.js";
import type * as adminProducts from "../adminProducts.js";
import type * as auth from "../auth.js";
import type * as categories from "../categories.js";
import type * as credits from "../credits.js";
import type * as emails from "../emails.js";
import type * as http from "../http.js";
import type * as notifications from "../notifications.js";
import type * as payments from "../payments.js";
import type * as quotations from "../quotations.js";
import type * as registration from "../registration.js";
import type * as reports from "../reports.js";
import type * as rfqs from "../rfqs.js";
import type * as supplierProducts from "../supplierProducts.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  adminAccounts: typeof adminAccounts;
  adminProducts: typeof adminProducts;
  auth: typeof auth;
  categories: typeof categories;
  credits: typeof credits;
  emails: typeof emails;
  http: typeof http;
  notifications: typeof notifications;
  payments: typeof payments;
  quotations: typeof quotations;
  registration: typeof registration;
  reports: typeof reports;
  rfqs: typeof rfqs;
  supplierProducts: typeof supplierProducts;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
