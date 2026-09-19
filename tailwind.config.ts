import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        evergreen: {
          50: "var(--color-evergreen-50)",
          100: "var(--color-evergreen-100)",
          200: "var(--color-evergreen-200)",
          300: "var(--color-evergreen-300)",
          400: "var(--color-evergreen-400)",
          500: "var(--color-evergreen-500)",
          600: "var(--color-evergreen-600)",
          700: "var(--color-evergreen-700)",
          800: "var(--color-evergreen-800)",
          900: "var(--color-evergreen-900)",
        },
        action: {
          primary: "var(--color-action-primary)",
          "primary-hover": "var(--color-action-primary-hover)",
          "primary-pressed": "var(--color-action-primary-pressed)",
          "secondary-pressed": "var(--color-action-secondary-pressed)",
        },
        canvas: "var(--color-canvas)",
        surface: {
          primary: "var(--color-surface-primary)",
          secondary: "var(--color-surface-secondary)",
          elevated: "var(--color-surface-elevated)",
          "brand-subtle": "var(--color-surface-brand-subtle)",
          recommendation: "var(--color-surface-recommendation)",
        },
        content: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
          disabled: "var(--color-text-disabled)",
          inverse: "var(--color-text-inverse)",
          brand: "var(--color-text-brand)",
        },
        line: {
          subtle: "var(--color-border-subtle)",
          DEFAULT: "var(--color-border-default)",
          strong: "var(--color-border-strong)",
          control: "var(--color-border-control)",
          brand: "var(--color-border-brand)",
        },
        status: {
          success: {
            surface: "var(--color-status-success-surface)",
            border: "var(--color-status-success-border)",
            text: "var(--color-status-success-text)",
            icon: "var(--color-status-success-icon)",
          },
          warning: {
            surface: "var(--color-status-warning-surface)",
            border: "var(--color-status-warning-border)",
            text: "var(--color-status-warning-text)",
            icon: "var(--color-status-warning-icon)",
          },
          danger: {
            surface: "var(--color-status-danger-surface)",
            border: "var(--color-status-danger-border)",
            text: "var(--color-status-danger-text)",
            icon: "var(--color-status-danger-icon)",
          },
          info: {
            surface: "var(--color-status-info-surface)",
            border: "var(--color-status-info-border)",
            text: "var(--color-status-info-text)",
            icon: "var(--color-status-info-icon)",
          },
        },
        focus: "var(--color-focus-ring)",
      },
      spacing: {
        "ds-1": "var(--space-1)",
        "ds-2": "var(--space-2)",
        "ds-3": "var(--space-3)",
        "ds-4": "var(--space-4)",
        "ds-5": "var(--space-5)",
        "ds-6": "var(--space-6)",
        "ds-8": "var(--space-8)",
        "ds-10": "var(--space-10)",
        "ds-12": "var(--space-12)",
        "ds-16": "var(--space-16)",
        "icon-compact": "var(--icon-size-compact)",
      },
      minHeight: {
        control: "var(--control-height)",
      },
      borderRadius: {
        small: "var(--radius-small)",
        control: "var(--radius-control)",
        card: "var(--radius-card)",
        badge: "var(--radius-full)",
      },
      boxShadow: {
        1: "var(--elevation-1)",
        2: "var(--elevation-2)",
        3: "var(--elevation-3)",
      },
      transitionDuration: {
        fast: "var(--motion-fast)",
        standard: "var(--motion-standard)",
        deliberate: "var(--motion-deliberate)",
      },
      ringWidth: {
        system: "var(--focus-ring-width)",
      },
      ringOffsetWidth: {
        system: "var(--focus-ring-offset)",
      },
      opacity: {
        disabled: "var(--opacity-disabled)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        "page-title": [
          "var(--font-size-page-title)",
          {
            lineHeight: "var(--line-height-page-title)",
            fontWeight: "var(--font-weight-semibold)",
          },
        ],
        "section-title": [
          "var(--font-size-section-title)",
          {
            lineHeight: "var(--line-height-section-title)",
            fontWeight: "var(--font-weight-semibold)",
          },
        ],
        "recommendation-title": [
          "var(--font-size-recommendation-title)",
          {
            lineHeight: "var(--line-height-recommendation-title)",
            fontWeight: "var(--font-weight-semibold)",
          },
        ],
        "component-title": [
          "var(--font-size-component-title)",
          {
            lineHeight: "var(--line-height-component-title)",
            fontWeight: "var(--font-weight-semibold)",
          },
        ],
        body: [
          "var(--font-size-body)",
          {
            lineHeight: "var(--line-height-body)",
            fontWeight: "var(--font-weight-regular)",
          },
        ],
        "body-small": [
          "var(--font-size-body-small)",
          {
            lineHeight: "var(--line-height-body-small)",
            fontWeight: "var(--font-weight-regular)",
          },
        ],
        label: [
          "var(--font-size-label)",
          {
            lineHeight: "var(--line-height-label)",
            fontWeight: "var(--font-weight-medium)",
          },
        ],
        metadata: [
          "var(--font-size-metadata)",
          {
            lineHeight: "var(--line-height-metadata)",
            fontWeight: "var(--font-weight-regular)",
          },
        ],
        eyebrow: [
          "var(--font-size-eyebrow)",
          {
            lineHeight: "var(--line-height-eyebrow)",
            fontWeight: "var(--font-weight-semibold)",
            letterSpacing: "var(--letter-spacing-eyebrow)",
          },
        ],
      },
    },
  },
  plugins: [],
};

export default config;
