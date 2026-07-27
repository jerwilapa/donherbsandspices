import Swal from "sweetalert2";

export const showToast = (icon: "success" | "error", title: string) => {
  return Swal.fire({
    icon,
    title,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
    customClass: {
      container: "toast-zindex",
      popup: "custom-toast",
    },
    didOpen: (toast) => {
      const container = document.querySelector(
        ".swal2-container",
      ) as HTMLElement;

      if (container) {
        container.style.paddingTop = "70px";
      }

      // Resize the popup directly
      (toast as HTMLElement).style.width = "360px";
      (toast as HTMLElement).style.padding = "8px 12px";
    },
  });
};
