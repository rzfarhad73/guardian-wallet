import { ImageResponse } from "next/og";

// Guardian Eye Shield favicon — three sizes for manifest + browser tab.
// 32 = tab icon (simplified shield only), 192 = Android homescreen,
// 512 = splash / PWA install prompt (full detail).

const sizes: Record<string, { width: number; height: number }> = {
  small: { width: 32, height: 32 },
  medium: { width: 192, height: 192 },
  large: { width: 512, height: 512 }
};

export function generateImageMetadata() {
  return [
    { id: "small", size: sizes.small, contentType: "image/png" },
    { id: "medium", size: sizes.medium, contentType: "image/png" },
    { id: "large", size: sizes.large, contentType: "image/png" }
  ];
}

// Next.js only passes `id` to icon components — size must be resolved locally.
export default function Icon({ id }: { id: string }) {
  const { width, height } = sizes[id] ?? sizes.medium;
  const isSmall = id === "small";
  const isLarge = id === "large";

  return new ImageResponse(
    <div
      style={{
        width,
        height,
        borderRadius: Math.round(width * 0.22),
        background: "#0d9e7e",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <svg
        width={Math.round(width * 0.78)}
        height={Math.round(height * 0.78)}
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M12 2C12 2 4 5 4 5.8V12.5C4 17.5 7.5 21.8 12 23.2C16.5 21.8 20 17.5 20 12.5V5.8C20 5 12 2 12 2Z"
          fill="white"
          fillOpacity="0.95"
        />

        {!isSmall && (
          <>
            <circle cx="12" cy="12.5" r={isLarge ? 2.2 : 2.4} fill="#0d9e7e" fillOpacity="0.85" />
            <circle cx="12" cy="12.5" r="0.88" fill="white" />
          </>
        )}

        {isLarge && (
          <>
            <path
              d="M7 12.5C8.5 10.2 10 9.2 12 9.2C14 9.2 15.5 10.2 17 12.5C15.5 14.8 14 15.8 12 15.8C10 15.8 8.5 14.8 7 12.5Z"
              fill="#0d9e7e"
              fillOpacity="0.14"
            />
            <line x1="7" y1="12.5" x2="17" y2="12.5" stroke="#0d9e7e" strokeWidth="0.4" strokeOpacity="0.4" />
            <circle cx="9" cy="12.5" r="0.45" fill="#0d9e7e" fillOpacity="0.6" />
            <circle cx="15" cy="12.5" r="0.45" fill="#0d9e7e" fillOpacity="0.6" />
          </>
        )}
      </svg>
    </div>,
    { width, height }
  );
}
