import * as functions from "firebase-functions";

export const toggles = () => functions.config().toggles || {};
