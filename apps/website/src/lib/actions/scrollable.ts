import type { Action } from "svelte/action";

/** Give overflowing regions a tab stop without intercepting native scrolling keys. */
export const scrollable: Action<HTMLElement> = (node) => {
  let frame: number | undefined;
  const children = new Set<Element>();
  const resize = new ResizeObserver(schedule);

  function update() {
    frame = undefined;
    // A constrained region can keep the same size while its content grows or shrinks.
    for (const child of children) {
      if (child.parentElement !== node) {
        resize.unobserve(child);
        children.delete(child);
      }
    }
    for (const child of node.children) {
      if (!children.has(child)) {
        children.add(child);
        resize.observe(child);
      }
    }

    const overflows =
      node.clientWidth > 0 &&
      node.clientHeight > 0 &&
      (node.scrollWidth > node.clientWidth || node.scrollHeight > node.clientHeight);
    if (overflows) {
      if (node.getAttribute("tabindex") !== "0") node.setAttribute("tabindex", "0");
    } else if (node.hasAttribute("tabindex")) {
      node.removeAttribute("tabindex");
    }
  }

  function schedule() {
    frame ??= requestAnimationFrame(update);
  }

  const mutations = new MutationObserver((records) => {
    // Ignore the action's own attribute writes; observe content and visibility changes.
    if (records.some((record) => record.target !== node || record.attributeName !== "tabindex")) {
      schedule();
    }
  });
  mutations.observe(node, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
  });
  resize.observe(node);
  update();

  return {
    destroy() {
      resize.disconnect();
      mutations.disconnect();
      if (frame !== undefined) cancelAnimationFrame(frame);
      node.removeAttribute("tabindex");
    },
  };
};
