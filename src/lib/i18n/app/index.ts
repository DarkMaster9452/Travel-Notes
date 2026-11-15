import { dashboardDe, dashboardEn, dashboardSk } from "./dashboard";
import { questDe, questEn, questSk } from "./quest";
import { shellDe, shellEn, shellSk } from "./shell";

/**
 * Words the rebuilt customer screens needed that the main dictionaries did
 * not have: mostly strings that used to be written in English in the markup.
 *
 * One file per screen, with the three languages side by side, so a string and
 * its translations are added and read together. Everything lands under
 * `t.app.<screen>`; `appSk` and `appDe` are typed against `appEn`, so a
 * missing translation is a build error here too.
 */
export const appEn = { app: { ...shellEn, ...dashboardEn, ...questEn } };

export const appSk: typeof appEn = { app: { ...shellSk, ...dashboardSk, ...questSk } };

export const appDe: typeof appEn = { app: { ...shellDe, ...dashboardDe, ...questDe } };
