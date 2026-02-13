/**
 * Enhanced print functionality for CV page.
 * Shows a notification, then opens the browser print dialog.
 */
export function initPrint(printButton: HTMLElement): void {
  printButton.addEventListener("click", () => {
    const notification = document.createElement("div");
    notification.className =
      "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-700 text-white px-6 py-4 rounded-md shadow-xl z-50 transition-all duration-500 text-center max-w-md print:hidden";
    notification.innerHTML = `
      <div class="font-bold text-lg mb-2">Opening Print Dialog...</div>
      <div class="text-sm mb-3">When the dialog opens, select "Save as PDF" for best results</div>
      <div class="text-xs">All styling and formatting will be preserved in the PDF</div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.display = "none";
      window.print();

      setTimeout(() => {
        notification.style.display = "";
        setTimeout(() => {
          notification.style.opacity = "0";
          notification.style.transform = "translate(-50%, -50%) scale(0.9)";
          setTimeout(() => {
            notification.parentNode?.removeChild(notification);
          }, 500);
        }, 500);
      }, 500);
    }, 800);
  });
}
