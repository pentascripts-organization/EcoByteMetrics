interface TransitionDocument {
  documentElement: { dataset: DOMStringMap };
  startViewTransition?: (update: () => Promise<void>) => Pick<ViewTransition, "ready" | "finished">;
}

export async function dashboardTransition(document: TransitionDocument, reducedMotion: boolean,
  navigate: (entry: "crossfade" | "fade") => void, waitForPage: () => Promise<void>, destination: "dashboard" | "home" = "dashboard") {
  if (!document.startViewTransition || reducedMotion) { navigate("fade"); return; }
  let navigated = false;
  document.documentElement.dataset.routeTransition = destination;
  try {
    const transition = document.startViewTransition(async () => {
      navigated = true; navigate("crossfade");
      await waitForPage();
    });
    void transition.ready.catch(() => {});
    await transition.finished.catch(() => {});
  } catch { if (!navigated) navigate("fade"); }
  finally { delete document.documentElement.dataset.routeTransition; }
}
