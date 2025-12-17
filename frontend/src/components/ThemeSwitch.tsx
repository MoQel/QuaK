import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/theme";

type ThemeSwitchProps = {
  onToggle?: (isDark: boolean) => void;
};

export default function ThemeSwitch({ onToggle }: ThemeSwitchProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const handleClick = () => {
    toggleTheme();
    onToggle?.(!isDark);
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Toggle theme"
      className="
        relative flex items-center
        w-14 h-7 rounded-full
        bg-bg-light
        p-1
      "
    >
      {isDark ? (
        <Sun className="absolute right-7 w-5 h-5 text-orange-300 pointer-events-none" />
      ) : (
        <Moon className="absolute left-7 w-5 h-5 text-gray-700 pointer-events-none" />
      )}

      {/* Thumb */}
      <span
        className={`
          absolute top-1 left-1
          w-5 h-5 rounded-full bg-white
          transition-transform duration-300
          ${isDark ? "translate-x-7" : "translate-x-0"}
        `}
      />
    </button>
  );
}
