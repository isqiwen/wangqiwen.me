export const themeEffect = function (): "dark" | "light" {
  const pref = localStorage.getItem("userThemePreference");

  let mode: "dark" | "light";

  if (pref === "dark") {
    mode = "dark";
  } else if (pref === "light") {
    mode = "light";
  } else {
    const hour = new Date().getHours();
    mode = hour >= 6 && hour < 18 ? "light" : "dark";
  }

  document.documentElement.classList.remove("dark", "light");
  document.documentElement.classList.add(mode);

  return mode;
};
