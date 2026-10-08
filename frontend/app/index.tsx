import { Redirect } from "expo-router";
import React from "react";

/** Die App startet in der Mitarbeiter-App. Die frühere Campus-App liegt unverändert in app/ und src/. */
export default function Index() {
  return <Redirect href="/mitarbeiter" />;
}
