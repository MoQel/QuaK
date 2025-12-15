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
    onToggle?.(!isDark); // after toggle, it becomes the opposite
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Toggle theme"
      className="
        relative flex items-center
        w-14 h-7 rounded-full
        bg-gray-300
        p-1
      "
    >
      {isDark ? (
        <Moon className="absolute right-5 w-2 h-2 text-gray-700 pointer-events-none" />
      ) : (
        <Sun className="absolute left-5 w-2 h-2 text-yellow-500 pointer-events-none" />
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
